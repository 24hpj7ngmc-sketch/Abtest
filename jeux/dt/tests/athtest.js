// V4.5 : l'écran de jeu au modèle de L'Île des Cinq V1.2 (décision de Frédéric du 24/11 : « l'ATH par défaut », claude/mini-jeu-contrat-lobby.md).
// Vérifie : pas de bandeau pendant le jour (zombies restants et « Dedans » en haut à droite), vie en barre fine sans chiffres sous la
// barre d'outils, étiquette d'action en une ligne sous le viseur (orange quand la pose est refusée), joystick discret au repos,
// bouton Boutique pâli quand rien n'est achetable.          node tests/athtest.js   (≈ 10 s)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    Object.assign(__dt.save, { mode: 'out', hero: 'feu', weap: 'fusil', cash: 0, snd: false });
    __dt.newGame(1);
  });
  await p.waitForTimeout(600);
  const vu = id =>
    p.evaluate(i => {
      const e = document.getElementById(i);
      return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    }, id);
  // préparation : le panneau du jour est là, pas de chiffre « Zombies »
  T('préparation : le panneau du jour et « Lancer le jour »', (await vu('wave')) && (await vu('go')));
  T('préparation : pas de chiffre « Zombies » ni « Dedans »', !(await vu('sLeft')) && !(await vu('sIn')));
  T("mode fuite : la vie n'est plus un chiffre en haut (la Ville, si)", !(await vu('sHp')) && (await vu('sCity')));
  // la vie : barre fine, sans texte, sous la barre d'outils
  const hp = await p.evaluate(() => {
    const h = document.getElementById('hp').getBoundingClientRect(),
      o = document.getElementById('hot').getBoundingClientRect();
    return { h: h.height, haut: h.top, basOutils: o.bottom, texte: getComputedStyle(document.getElementById('hpT')).display };
  });
  T(
    "la vie : barre fine sous la barre d'outils, sans « 100 / 100 »",
    hp.h <= 8 && hp.haut >= hp.basOutils && hp.texte === 'none',
    JSON.stringify(hp)
  );
  // joystick discret au repos
  const op = await p.evaluate(() => +getComputedStyle(document.getElementById('joy')).opacity);
  T('joystick à peine visible au repos', op < 0.5, String(op));
  // le jour : plus de bandeau, les zombies restants en haut à droite
  await p.evaluate(() => {
    __dt.S.p.invul = 1e9;
    __dt.startDay(__dt.S);
  });
  await p.waitForTimeout(500);
  const jour = await p.evaluate(() => ({ n: document.querySelector('#sLeft b').textContent, left: Math.max(0, __dt.S.left) }));
  T('jour en cours : plus de bandeau en haut', !(await vu('wave')));
  T('jour en cours : « Zombies » en haut à droite', (await vu('sLeft')) && jour.n === String(jour.left), JSON.stringify(jour));
  // l'étiquette d'action : une ligne sous le viseur ; orange quand il n'y a plus de tourelle libre
  await p.evaluate(() => {
    __dt.setTool('marteau');
    const S = __dt.S,
      P = S.p;
    let vide = null;
    for (const s of SLOTS) if (slotOn(S.P, s, S.mode) && s.k === 'toit' && !__dt.save.layout[SLOTS.indexOf(s)]) vide = vide || s;
    S.P.turrets = Math.min(S.P.turrets, placedCount(__dt.save)); // aucune tourelle libre : la pose est refusée
    P.x = vide.x * 0.55;
    P.z = vide.z * 0.55;
    const oeil = eyeP(P),
      vx = vide.x - oeil[0],
      vy = vide.y + 0.4 - oeil[1],
      vz = vide.z - oeil[2];
    P.yaw = Math.atan2(-vx, -vz);
    P.pitch = Math.atan2(vy, Math.hypot(vx, vz));
  });
  await p.waitForTimeout(300);
  const lab = await p.evaluate(() => {
    const e = document.getElementById('aLab'),
      r = e.getBoundingClientRect(),
      c = document.getElementById('cross').getBoundingClientRect();
    return {
      vu: !e.hidden,
      ligne: r.height < 22,
      sous: r.top >= c.bottom - 2 && r.top < c.bottom + 30 && Math.abs(r.left + r.width / 2 - (c.left + c.width / 2)) < 3,
      couleur: getComputedStyle(e).color,
      texte: e.textContent
    };
  });
  T("étiquette d'action : une ligne centrée sous le viseur", lab.vu && lab.ligne && lab.sous, JSON.stringify(lab));
  T("pose refusée : l'étiquette passe en orange", lab.couleur === 'rgb(255, 177, 90)', lab.couleur);
  // la boutique : pâlie sans argent, dorée quand une case est achetable
  await p.evaluate(() => {
    __dt.setTool('fusil');
    const S = __dt.S,
      s = SHOPS[0];
    Object.assign(S.p, { x: s.x - 1.6, z: s.z, yaw: -Math.PI / 2, pitch: -0.2 });
    __dt.save.cash = 0;
  });
  await p.waitForTimeout(300);
  const pale = await p.evaluate(() => getComputedStyle(document.getElementById('bTree')).opacity);
  await p.evaluate(() => (__dt.save.cash = 100000));
  await p.waitForTimeout(300);
  const dore = await p.evaluate(() => {
    const e = document.getElementById('bTree');
    return [e.classList.contains('has'), getComputedStyle(e).opacity];
  });
  T(
    "Boutique pâlie quand rien n'est achetable, dorée sinon",
    (await vu('bTree')) && +pale < 0.7 && dore[0] && +dore[1] === 1,
    pale + ' → ' + dore
  );
  // jour 6 : des zombies entrent dans l'immeuble : « Dedans » en haut à droite, en rouge
  await p.evaluate(() => {
    __dt.newGame(6);
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    __dt.S.p.invul = 1e9;
    __dt.startDay(__dt.S);
  });
  let dedans = { n: 0 };
  for (let k = 0; k < 40 && !dedans.n; k++) {
    await p.waitForTimeout(500);
    dedans = await p.evaluate(() => {
      const S = __dt.S;
      let n = 0;
      for (let k = 0; k < S.nAct; k++) {
        const i = S.act[k],
          e = S.z.st[i];
        if (e === 7 || (e === 3 && S.z.lv[i] < NLV)) n++;
      }
      const el = document.getElementById('sIn');
      return { n, txt: el.querySelector('b').textContent, vu: !el.hidden, rouge: getComputedStyle(el.querySelector('b')).color };
    });
  }
  T("jour 6 : « Dedans » compte les zombies entrés dans l'immeuble", dedans.n > 0 && dedans.vu && +dedans.txt > 0, JSON.stringify(dedans));
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
})();
