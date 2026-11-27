// V4.2 : le Guide « Règles » (interface/regles.js, affichage/guide.js) : le même personnage qu'au lobby, sur le toit près du départ.
// Vérifie : il est sur le toit en « Ils s'échappent » (à une place libre) et absent en « Ils arrivent » ; il se tourne vers le joueur proche ;
// le bouton « Règles » apparaît près de lui et pas loin de lui ; la fiche s'ouvre avec ses 5 onglets dans l'ordre, chacun avec des lignes,
// et tient sur l'écran ; la partie est en pause pendant la fiche et reprend à « Retour » ; la ligne « Règles » de la grande carte ;
// le « Tuto pas à pas » ; les gains du lobby (page lancée depuis le lobby) ; aucune erreur de page.
// Captures : shots/guide-depart.png (le Guide vu du départ), shots/guide-fiche.png (la fiche ouverte).
//   node tests/guidetest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ONGLETS = ['Le but', 'Perdre', 'Commandes', 'Ce jeu', 'Ce que ça rapporte'];

(async () => {
  fs.mkdirSync('shots', { recursive: true });
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const errs = [];
  // une page de jeu (lobby : options passées par le lobby, sinon la page seule)
  const ouvre = async lobby => {
    const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    if (lobby) await p.addInitScript(o => (window.DT_LOBBY = o), lobby);
    await p.goto('file://' + path.resolve('test3d.html'));
    await p.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(p);
    // un vrai appui du doigt au milieu de l'élément
    p.tap2 = async sel => {
      const bb = await (await p.$(sel)).boundingBox();
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, id: 7 }]
      });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    return { p, ctx };
  };
  const { p, ctx } = await ouvre(null);
  const vis = sel => p.isVisible(sel);
  // où se tient le Guide (interface/regles.js)
  const GP = await p.evaluate(() => ({ x: GUIDEP.x, z: GUIDEP.z }));
  // le joueur à (x, z) sur le toit, regard vers le Guide
  const place = (x, z, pitch) =>
    p.evaluate(
      ([x, z, pitch]) => {
        const P = __dt.S.p;
        P.x = x;
        P.y = H;
        P.z = z;
        P.yaw = Math.atan2(-(GUIDEP.x - x), -(GUIDEP.z - z));
        P.pitch = pitch;
      },
      [x, z, pitch === undefined ? -0.05 : pitch]
    );

  // ---- une partie « Ils s'échappent » (pas la première : le tuto ne parle pas)
  await p.evaluate(() => {
    __dt.save.mode = 'out';
    __dt.save.runsOut = 3;
    __dt.newGame(1);
    document.getElementById('big').style.display = 'none';
  });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shots/guide-depart.png' });
  const g = await p.evaluate(() => ({
    vu: G.guide.visible && G.guideLab.visible,
    x: G.guide.position.x,
    y: G.guide.position.y,
    z: G.guide.position.z,
    gx: GUIDEP.x,
    gz: GUIDEP.z,
    H,
    dep: Math.hypot(GUIDEP.x - __dt.S.p.x, GUIDEP.z - __dt.S.p.z),
    lab: G.guideLab.position.y - H
  }));
  T("Ils s'échappent : le Guide et son étiquette sont sur le toit", g.vu && g.x === g.gx && g.z === g.gz && g.y === g.H, JSON.stringify(g));
  T('tout près du départ (3,5 à 6 m), étiquette au-dessus de sa tête', g.dep > 3.5 && g.dep < 6 && g.lab > 2.2, g.dep.toFixed(2) + ' m');
  // une place libre : aucune boîte du toit ne le traverse, loin des emplacements de tourelle, des tyroliennes, des boutiques, de l'hélico
  const libre = await p.evaluate(() => {
    const x = GUIDEP.x,
      z = GUIDEP.z,
      r = 0.45,
      boites = BOX.filter(
        o => !o.dead && o.y1 > H + 0.05 && o.y0 < H + 1.8 && o.x0 < x + r && o.x1 > x - r && o.z0 < z + r && o.z1 > z - r
      );
    const d = (a, b) => Math.hypot(a[0] - x, a[1] - z);
    return {
      boites: boites.map(o => o.t),
      tourelle: Math.min(...SLOTS.filter(s => s.k === 'toit').map(s => d([s.x, s.z]))),
      tyro: Math.min(...ZIPS.map(q => d([q.a[0], q.a[2]]))),
      boutique: Math.min(...SHOPS.filter(s => s.y === H).map(s => d([s.x, s.z]))),
      helico: d(HELI),
      bord: B - Math.max(Math.abs(x), Math.abs(z))
    };
  });
  T(
    'à une place libre du toit (rien ne le traverse)',
    !libre.boites.length && libre.tourelle > 2.2 && libre.tyro > 3 && libre.boutique > 5 && libre.helico > 6 && libre.bord > 2,
    JSON.stringify(libre)
  );
  T('au départ (à plus de 3,5 m) : pas de bouton « Règles »', !(await vis('#bRules')));

  // ---- il se tourne vers le joueur proche, pas vers celui qui est loin
  // (le moteur d'aperçu tourne lentement : on attend en temps de jeu, pas en temps réel)
  const attends = async sec => {
    const t0 = await p.evaluate(() => __dt.S.t);
    for (let i = 0; i < 150; i++) {
      await p.waitForTimeout(100);
      if ((await p.evaluate(() => __dt.S.t)) > t0 + sec) break;
    }
  };
  const yaw0 = await p.evaluate(() => G.guideYaw);
  await place(GP.x + 3, GP.z + 1);
  await attends(0.5);
  const yaw1 = await p.evaluate(() => G.guideYaw);
  T(
    'il se tourne lentement (au plus 1,5 rad/s)',
    yaw1 !== yaw0 && Math.abs(yaw1 - yaw0) < 1.5 * 0.5 + 0.1,
    (yaw1 - yaw0).toFixed(3) + ' rad en 0,5 s'
  );
  await attends(4);
  const tour = await p.evaluate(() => {
    const P = __dt.S.p,
      vers = Math.atan2(-(P.x - GUIDEP.x), -(P.z - GUIDEP.z));
    return Math.abs(Math.atan2(Math.sin(vers - G.guideYaw), Math.cos(vers - G.guideYaw)));
  });
  T('il se tourne vers le joueur proche', tour < 0.1, tour.toFixed(3) + ' rad');
  await place(GP.x + 9, GP.z + 15);
  await attends(0.3);
  const avant = await p.evaluate(() => G.guideYaw);
  await attends(1.5);
  T('pas vers celui qui est à plus de 15 m', Math.abs((await p.evaluate(() => G.guideYaw)) - avant) < 1e-6);

  // ---- le bouton « Règles » : près de lui seulement
  await place(GP.x + 1.2, GP.z + 1.8);
  await p.waitForTimeout(400);
  T('à côté du Guide : « Règles » en haut à droite', (await vis('#bRules')) && (await p.textContent('#bRules')) === 'Règles');
  const bb = await (await p.$('#bRules')).boundingBox();
  T('placé comme « Boutique » (haut à droite)', bb.x > 800 && bb.y < 100, JSON.stringify(bb));
  await place(GP.x + 3.2, GP.z + 1.6);
  await p.waitForTimeout(300);
  T('à 3,6 m : plus de bouton', !(await vis('#bRules')));
  await place(GP.x + 1, GP.z + 1.5);
  await p.evaluate(() => (__dt.S.p.y = H - 3.8));
  await p.waitForTimeout(300);
  T("à l'étage du dessous, sous le Guide : pas de bouton", !(await vis('#bRules')));

  // ---- la fiche : 5 onglets dans l'ordre, des lignes partout, pause, Retour
  await place(GP.x + 1, GP.z + 1.5, -0.1);
  await p.waitForTimeout(400);
  await p.tap2('#bRules');
  await p.waitForTimeout(400);
  T('toucher « Règles » ouvre la fiche', await vis('#guideV'));
  T('titre « Règles · Dernier Toit »', (await p.textContent('#guT')) === 'Règles · Dernier Toit');
  const noms = await p.$$eval('#guTabs .tchip', l => l.map(e => e.textContent));
  T('5 onglets dans cet ordre : ' + ONGLETS.join(' · '), JSON.stringify(noms) === JSON.stringify(ONGLETS), noms.join(' · '));
  await p.screenshot({ path: 'shots/guide-fiche.png' });
  const tient = await p.evaluate(() => {
    const c = document.querySelector('#guideV .card').getBoundingClientRect(),
      r = document.getElementById('guX').getBoundingClientRect();
    return c.top >= 0 && c.bottom <= innerHeight && r.bottom <= innerHeight && r.top >= 0;
  });
  T("la fiche tient sur l'écran (966 × 366), « Retour » visible", tient);
  let lignes = [];
  for (let k = 0; k < ONGLETS.length; k++) {
    await p.tap2('#guTabs .tchip[data-k="' + k + '"]');
    await p.waitForTimeout(150);
    const n = await p.$$eval(
      '#guB .srow',
      l => l.filter(e => e.querySelector('b').textContent && e.querySelector('small').textContent).length
    );
    const sel = await p.$eval('#guTabs .tchip.sel', e => e.textContent);
    lignes.push(n);
    T('onglet « ' + ONGLETS[k] + ' » : ' + n + ' lignes', n > 0 && sel === ONGLETS[k]);
  }
  const textes = await p.evaluate(() => RULES_TOIT().map(o => o[1].map(r => r[0] + ' : ' + r[1])));
  T(
    'Commandes : les 5 lignes communes, puis « Sur le toit »',
    textes[2].length === 7 && textes[2][5].startsWith('Sur le toit') && textes[2][6].startsWith('Sur le toit')
  );
  T('Ce jeu : 6 à 9 lignes', textes[3].length >= 6 && textes[3].length <= 9, textes[3].length);
  T(
    "Perdre : la ville, toi (relevé en 8 s), rien n'est perdu",
    /^La ville/.test(textes[1][0]) && /8 secondes/.test(textes[1][1]) && /^Rien n'est perdu/.test(textes[1][2])
  );
  T(
    'Le but : 10 jours, hélicoptère, sans fin',
    textes[0].join(' ').includes('10 jours') && textes[0].join(' ').includes('hélicoptère') && textes[0].join(' ').includes('sans fin')
  );
  T('hors lobby : la ligne « Depuis le lobby »', textes[4].length === 2 && textes[4][1].startsWith('Depuis le lobby'));
  const t0 = await p.evaluate(() => [__dt.S.t, running, G.time]);
  await p.waitForTimeout(600);
  const t1 = await p.evaluate(() => [__dt.S.t, running, G.time]);
  T('la partie est en pause pendant la fiche', t0[0] === t1[0] && t0[2] === t1[2] && !t1[1]);
  await p.tap2('#guX');
  await p.waitForTimeout(500);
  const t2 = await p.evaluate(() => [__dt.S.t, running]);
  T('« Retour » : la fiche se ferme et la partie reprend', !(await vis('#guideV')) && t2[1] && t2[0] > t1[0]);

  // ---- depuis la grande carte
  await place(0, -7);
  await p.evaluate(() => openMap());
  await p.waitForTimeout(200);
  const ligne = await p.$('#mapOpt button:has-text("Règles")');
  T('grande carte : une ligne « Règles »', !!ligne);
  if (ligne) {
    await ligne.click();
    await p.waitForTimeout(300);
    T(
      'elle ouvre la fiche (loin du Guide aussi), carte fermée, en pause',
      (await vis('#guideV')) && !(await vis('#mapV')) && !(await p.evaluate(() => running))
    );
    await p.tap2('#guX');
    await p.waitForTimeout(300);
    T('« Retour » ramène à la grande carte', !(await vis('#guideV')) && (await vis('#mapV')));
    await p.evaluate(() => (document.getElementById('mapV').hidden = true));
  }

  // ---- le tuto pas à pas : proposé au jour 1 avant de lancer le jour, quand il n'est pas déjà en cours
  await place(GP.x + 1, GP.z + 1.5);
  await p.waitForTimeout(300);
  await p.tap2('#bRules');
  await p.waitForTimeout(300);
  T(
    'jour 1, avant de lancer le jour : « Tuto pas à pas » proposé',
    (await vis('#guA')) && (await p.textContent('#guA')) === 'Tuto pas à pas'
  );
  await p.tap2('#guA');
  await p.waitForTimeout(700);
  T(
    "il ferme la fiche, la partie reprend et la première astuce s'affiche",
    !(await vis('#guideV')) && (await p.evaluate(() => running)) && (await p.textContent('#toast')).startsWith('Mode fuite'),
    await p.textContent('#toast')
  );
  await p.tap2('#bRules');
  await p.waitForTimeout(300);
  T('pendant le tuto : plus proposé', !(await vis('#guA')));
  await p.tap2('#guX');
  await p.evaluate(() => __dt.startDay(__dt.S));
  await p.waitForTimeout(300);
  T('pendant le jour : « Règles » est toujours là', await vis('#bRules'));
  await p.tap2('#bRules');
  await p.waitForTimeout(300);
  T('… mais plus de tuto (le jour est lancé)', (await vis('#guideV')) && !(await vis('#guA')));
  await p.tap2('#guX');
  await p.waitForTimeout(200);

  // ---- une nouvelle partie oublie le tuto relancé ; la première partie du mode le joue déjà (pas proposé)
  await p.evaluate(() => {
    __dt.save.runsOut = 0;
    __dt.newGame(1);
    document.getElementById('big').style.display = 'none';
  });
  await place(GP.x + 1, GP.z + 1.5);
  await p.waitForTimeout(400);
  await p.tap2('#bRules');
  await p.waitForTimeout(300);
  T('première partie du mode (le tuto est en cours) : pas proposé', (await vis('#guideV')) && !(await vis('#guA')));
  await p.tap2('#guX');
  await p.waitForTimeout(200);

  // ---- Ils arrivent : pas de Guide, pas de bouton, pas de ligne sur la carte
  await p.evaluate(() => {
    __dt.save.mode = 'in';
    __dt.newGame(1);
    document.getElementById('big').style.display = 'none';
  });
  await place(GP.x + 1, GP.z + 1.5);
  await p.waitForTimeout(500);
  T('Ils arrivent : pas de Guide', !(await p.evaluate(() => G.guide.visible || G.guideLab.visible)));
  T('Ils arrivent : pas de bouton « Règles » à sa place', !(await vis('#bRules')));
  await p.evaluate(() => openMap());
  T('Ils arrivent : pas de ligne « Règles » sur la carte', !(await p.$('#mapOpt button:has-text("Règles")')));
  await p.evaluate(() => (document.getElementById('mapV').hidden = true));
  await ctx.close();

  // ---- lancé depuis le lobby : les gains du lobby
  const L = await ouvre({ heros: 'eau', arme: 'pompe' });
  const gains = await L.p.evaluate(() => RULES_TOIT()[4][1].map(r => r[0]));
  T(
    'depuis le lobby : Ton argent, Pour ton île, Plus dur mieux payé, Le butin, Ton village',
    JSON.stringify(gains) === JSON.stringify(['Ton argent', 'Pour ton île', 'Plus dur, mieux payé', 'Le butin', 'Ton village']),
    gains.join(' · ')
  );
  T('depuis le lobby : le Guide est sur le toit', await L.p.evaluate(() => __dt.S.mode === 'out' && G.guide.visible));
  await L.ctx.close();

  T('aucune erreur de page', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
