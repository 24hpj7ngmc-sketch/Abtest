// V4.8 : les rôles et les éléments depuis le lobby (claude/demande-dernier-toit-roles-elements.md), dans une page hôte comme le vrai lobby
// (dt-pour-lobby.js) : DernierToit.HEROS (Zéphyr) et accepte (elementArme) ; Zéphyr avec une arme d'Eau (S.elArme, « pret », « fin ») ;
// la Rafale, le Tir perçant et une balle de Vent dessinés sans erreur ; le Guide et l'écran de fin présentent le héros par son rôle ;
// l'étiquette d'un autre joueur porte son rôle. V4.9 : une voie (Roc en Avant-garde : la charge, l'ultime teinté, le Guide, la fin) ;
// le réticule du tir chargé, l'aura du Mage de bataille, la barre du bouclier.                       node tests/rolestest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const hote = path.resolve('shots/hote-roles.html');
  fs.mkdirSync(path.dirname(hote), { recursive: true });
  fs.writeFileSync(
    hote,
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#123"><script>' +
      fs.readFileSync('dt-pour-lobby.js', 'utf8') +
      '\nDernierToit.troisJs = ' +
      JSON.stringify('file://' + path.resolve('gfx/three-lite.js')) +
      ';\nwindow.recu = [];\n' +
      'function lance(o){ DernierToit.ouvrir(o, { pret: m => recu.push(m), fin: m => recu.push(m), retour: () => recu.push({ dt: "retour-lobby" }) }); }\n' +
      '</script></body></html>'
  );
  const b = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--allow-file-access-from-files'
    ]
  });
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text());
  });
  await p.goto('file://' + hote);
  T(
    'DernierToit.HEROS : les six (Zéphyr) ; accepte : elementArme',
    await p.evaluate(
      () =>
        DernierToit.HEROS.join() === 'feu,eau,bois,terre,elec,vent' &&
        DernierToit.accepte.includes('elementArme') &&
        DernierToit.accepte.includes('voie') &&
        DernierToit.version === 'V5.1'
    )
  );

  await p.evaluate(() =>
    lance({
      heros: 'vent',
      role: 'Tireur',
      arme: 'sniper',
      elementArme: 'eau',
      voie: null,
      rang: 1,
      bonus: { heros: { kLen: 2, kPush: 1, uDmg: 0.25, uRad: 0.5, pA: 1 }, balles: { eSlow: 0.5 }, niveaux: { heros: 3, arme: 2 } }
    })
  );
  await p.waitForTimeout(2500);
  const f = p.frames().find(fr => fr !== p.mainFrame());
  const e1 = await f.evaluate(() => ({
    hero: S.hero,
    el: S.elArme,
    hm: S.hm,
    ab: document.querySelector('#bAb').textContent,
    ul: document.querySelector('#bUlt').textContent
  }));
  T(
    "Zéphyr avec une arme d'Eau : S.elArme, cases du lobby, boutons Rafale et Tir perçant",
    e1.hero === 'vent' &&
      e1.el === 'eau' &&
      e1.hm.kPush === 1 &&
      e1.hm.uDmg === 0.25 &&
      e1.hm.eSlow === 0.5 &&
      /^Rafale/.test(e1.ab) &&
      /^Tir perçant/.test(e1.ul),
    JSON.stringify([e1.hero, e1.el, e1.ab, e1.ul])
  );
  let recu = await p.evaluate(() => recu);
  T(
    '« pret » porte elementArme',
    recu[0] && recu[0].dt === 'pret' && recu[0].heros === 'vent' && recu[0].elementArme === 'eau',
    JSON.stringify(recu[0])
  );

  // la Rafale (entre deux jours), puis le jour : le Tir perçant et une balle de Vent (soulève) ; l'image tourne sans erreur
  const fx = await f.evaluate(() => {
    const z0 = S.p.z;
    S.p.yaw = Math.PI; // dos au centre du toit : on recule vers le centre
    const raf = useHeroSkill(S);
    events();
    const dz = Math.abs(S.p.z - z0);
    startDay(S);
    S.toSpawn = 0;
    devSpawn(1);
    const i = S.act[S.nAct - 1];
    S.z.st[i] = 1;
    S.z.ty[i] = 0;
    S.z.x[i] = 0;
    S.z.z[i] = -40;
    S.z.y[i] = 0;
    S.z.hp[i] = 1e5;
    S.ult = 1;
    S.p.pitch = -0.3;
    const ult = useHeroUlt(S);
    const nPercant = S.ev.filter(e => e.k === 'percant').length;
    events();
    // une balle de Vent : on la pose comme si elle venait de toucher
    S.elArme = 'vent';
    heroOnHit(S, i, 10, S.z.x[i], 1, S.z.z[i]);
    const leve = S.z.root[i];
    events();
    return { raf, dz, ult, nPercant, leve, beam: HX.beamD[6] < HX.beamD[7], lev: HX.lev1[i] > HX.lev0[i] };
  });
  T('Rafale : on recule, sans erreur', fx.raf && fx.dz > 3, fx.dz.toFixed(1) + ' m');
  T('Tir perçant : le trait part (HX.beamD)', fx.ult && fx.nPercant === 1 && fx.beam, JSON.stringify(fx));
  T('balle de Vent : le zombie décolle (HX.lev0 / lev1)', fx.leve > 0.5 && fx.lev);
  await p.screenshot({ path: 'shots/v48-tir-percant.png' });
  await p.waitForTimeout(2500);
  T(
    'les images tournent (trait éteint après 0,6 s)',
    await f.evaluate(() => HX.beamD[6] >= HX.beamD[7] && running),
    await f.evaluate(() => HX.beamD[6] + ' / ' + HX.beamD[7])
  );

  // le Guide : le héros par son rôle, les éléments
  const guide = await f.evaluate(() => JSON.stringify(RULES_TOIT()));
  T(
    'Guide : « Zéphyr, Tireur (Vent) », et les six éléments',
    /Zéphyr, Tireur \(Vent\)/.test(guide) &&
      /Les armes et leurs éléments/.test(guide) &&
      /Nature : elles empoisonnent/.test(guide) &&
      /Vent : elles traversent/.test(guide)
  );

  // un autre joueur sur le toit : son étiquette porte son rôle (dessin du canevas : on lit ce qui a été écrit)
  const lab = await f.evaluate(() => {
    const ecrit = [],
      proto = CanvasRenderingContext2D.prototype,
      vrai = proto.fillText;
    proto.fillText = function (t) {
      ecrit.push(String(t));
      return vrai.apply(this, arguments);
    };
    const r = { lab: { userData: { c: document.createElement('canvas'), t: {} } }, nom: 'Léa', heros: 'vent' };
    r.lab.userData.c.width = 384;
    r.lab.userData.c.height = 96;
    joueurTexte(r);
    proto.fillText = vrai;
    return ecrit;
  });
  T("étiquette d'un joueur : son nom, et dessous « Tireur »", lab.join('|') === 'Léa|Tireur', lab.join('|'));

  // la fin : le héros par son rôle, l'élément de l'arme ; « fin » porte elementArme
  await f.evaluate(() => {
    hurtCity(S, 1e9);
    events();
  });
  await p.waitForTimeout(1900);
  const fin = await f.evaluate(() => document.getElementById('eP').textContent);
  T(
    'écran de fin : « Zéphyr, Tireur niv. 3 · Fusil de précision niv. 2 de Vent »',
    /Rang 1 · Zéphyr, Tireur niv\. 3 · .+ niv\. 2 de Vent/.test(fin),
    fin
  );
  recu = await p.evaluate(() => recu);
  const m = recu.find(x => x.dt === 'fin') || {};
  T('« fin » porte elementArme', m.heros === 'vent' && m.elementArme === 'vent', JSON.stringify(m).slice(0, 200));

  // un élément inconnu du lobby : celui du héros
  await p.evaluate(() => {
    DernierToit.fermer();
    lance({ heros: 'bois', arme: 'assaut', elementArme: 'glace' });
  });
  await p.waitForTimeout(2500);
  const f2 = p.frames().find(fr => fr !== p.mainFrame());
  T('elementArme inconnu : les balles du héros (Nature)', await f2.evaluate(() => S.hero === 'bois' && S.elArme === 'bois'));

  // V4.9 : une voie. Roc en Avant-garde (spB1 1, spB2 1) avec une arme de Feu : le rempart charge, l'ultime est teinté ; le Guide, la fin
  await p.evaluate(() => {
    DernierToit.fermer();
    recu.length = 0;
    lance({
      heros: 'terre',
      arme: 'assaut',
      elementArme: 'feu',
      voie: { id: 'b', nom: 'Avant-garde' },
      rang: 1,
      bonus: { heros: { spB1: 1, spB2: 1, spA1: 3 }, niveaux: { heros: 11, arme: 2 } }
    });
  });
  await p.waitForTimeout(2500);
  const f3 = p.frames().find(fr => fr !== p.mainFrame());
  const v = await f3.evaluate(() => {
    const out = { voie: S.voie, spB1: S.hm.spB1, spA1: S.hm.spA1, nom: voieNom(S) };
    startDay(S);
    S.toSpawn = 0;
    devSpawn(1);
    const i = S.act[S.nAct - 1];
    Object.assign(S.p, { x: 0, y: 0, z: -18, ground: true });
    S.z.st[i] = 1;
    S.z.x[i] = 0;
    S.z.z[i] = -29;
    S.z.y[i] = 0;
    S.z.hp[i] = 1e5;
    gridBuild(S);
    const o = eyeP(S.p);
    S.p.yaw = 0;
    S.p.pitch = Math.atan2(-o[1], 8);
    out.skill = useHeroSkill(S);
    out.ch = S.ramparts[0] ? S.ramparts[0].ch : -1;
    events();
    S.ult = 1;
    out.ult = useHeroUlt(S);
    out.el = (S.ev.find(e => e.k === 'hult') || {}).el;
    out.burn = S.z.burn[i];
    events();
    return out;
  });
  T(
    'Roc en Avant-garde : S.voie b, seules ses cases ; le Rempart part en charge (7 m) ; Séisme teinté de Feu',
    v.voie === 'b' &&
      v.spB1 === 1 &&
      v.spA1 === 0 &&
      v.nom === 'Avant-garde' &&
      v.skill &&
      v.ch === 7 &&
      v.ult &&
      v.el === 'feu' &&
      v.burn > 0,
    JSON.stringify(v)
  );
  await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shots/v49-avant-garde.png' });
  const w = await f3.evaluate(() => ({
    ch: S.ramparts[0] && S.ramparts[0].ch,
    on: HX.walls.filter(q => q.on).length,
    z: S.ramparts[0] && S.ramparts[0].z
  }));
  T('la charge est allée au bout, le mur dessiné suit', w.ch === 0 && w.on === 1, JSON.stringify(w));
  recu = await p.evaluate(() => recu);
  T('« pret » porte la voie', recu[0] && recu[0].voie === 'b', JSON.stringify(recu[0]));
  const g3 = await f3.evaluate(() => JSON.stringify(RULES_TOIT()));
  T('Guide : « Ta voie, Avant-garde : … »', /Ta voie, Avant-garde : le Rempart charge/.test(g3));
  await f3.evaluate(() => {
    hurtCity(S, 1e9);
    events();
  });
  await p.waitForTimeout(1900);
  const fin3 = await f3.evaluate(() => document.getElementById('eP').textContent);
  T('écran de fin : « Roc, Tank (Avant-garde) niv. 11 »', /Roc, Tank \(Avant-garde\) niv\. 11/.test(fin3), fin3);
  recu = await p.evaluate(() => recu);
  T('« fin » porte la voie', (recu.find(x => x.dt === 'fin') || {}).voie === 'b');

  // Zéphyr Sniper : le réticule du tir chargé ; Braise Mage de bataille : l'aura dessinée ; Ondine Soigneuse : la barre du bouclier
  await p.evaluate(() => {
    DernierToit.fermer();
    lance({ heros: 'vent', arme: 'sniper', voie: { id: 'a', nom: 'Sniper' }, bonus: { heros: { spA2: 1 } } });
  });
  await p.waitForTimeout(2500);
  const f4 = p.frames().find(fr => fr !== p.mainFrame());
  const c4 = await f4.evaluate(async () => {
    ads = true;
    const avant = document.getElementById('cross').classList.contains('charge');
    await new Promise(r => setTimeout(r, 1800));
    const apres = document.getElementById('cross').classList.contains('charge');
    ads = false;
    return !avant && apres;
  });
  T("Sniper : en visée, le réticule montre le tir chargé au bout d'une seconde", c4);
  await p.evaluate(() => {
    DernierToit.fermer();
    lance({ heros: 'feu', arme: 'fusil', voie: { id: 'b', nom: 'Mage de bataille' } });
  });
  await p.waitForTimeout(2500);
  const f5 = p.frames().find(fr => fr !== p.mainFrame());
  const a5 = await f5.evaluate(async () => {
    S.p.pitch = -1.2;
    await new Promise(r => setTimeout(r, 600));
    return G.P.fire && G.P.fire.n !== undefined ? G.P.fire.n : HX.auraA !== undefined;
  });
  await p.screenshot({ path: 'shots/v49-aura.png' });
  T("Mage de bataille : les flammes de l'aura sont dessinées", !!a5, String(a5));
  await p.evaluate(() => {
    DernierToit.fermer();
    lance({ heros: 'eau', arme: 'fusil', voie: { id: 'a', nom: 'Soigneuse' }, bonus: { heros: { spA2: 1 } } });
  });
  await p.waitForTimeout(2500);
  const f6 = p.frames().find(fr => fr !== p.mainFrame());
  const b6 = await f6.evaluate(async () => {
    S.p.boucl = 30;
    S.p.boucT = 10;
    await new Promise(r => setTimeout(r, 300));
    return document.getElementById('hpS').style.width;
  });
  T('Soigneuse : la barre du bouclier sur la vie', parseFloat(b6) > 0, b6);

  T('aucune erreur', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
