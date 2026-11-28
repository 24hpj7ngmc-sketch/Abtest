// V4.2 : la synchro avec le lobby (claude/demande-dernier-toit-synchro.md), dans une page hôte comme le vrai lobby (dt-pour-lobby.js).
// Vérifie : mourir n'arrête plus la partie (relevé sur le toit au bout de RELEVE s, aucun « fin ») ; la ville qui tombe donne l'écran de paie ;
// le rang multiplie la vie des zombies ; la bourse s'ajoute une seule fois ; « pret » à chaque partie ; « fin » porte depart, boss, duree,
// chutes, rang, dev ; l'arbre du héros (vitesse, saut, charge de l'ultime) et les balles passent dans S.hm ; DernierToit.accepte.
//   node tests/synchrotest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const hote = path.resolve('shots/hote-synchro.html');
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
    'accepte',
    await p.evaluate(
      () =>
        JSON.stringify(DernierToit.accepte) ===
        JSON.stringify(['rang', 'argent', 'heros', 'balles', 'niveaux', 'multi', 'elementArme', 'voie', 'elHeros'])
    )
  );

  const bonus = {
    argent: 150,
    heros: { hSpd: 0.12, hSprint: 0.16, hJump: 0.3, uCharge: 0.3, abRad: 1.5, kDur: 2 },
    balles: { ePois: 2, eChain: 1 },
    niveaux: { heros: 4, arme: 3 }
  };
  await p.evaluate(b => lance({ heros: 'bois', arme: 'assaut', rang: 3, bonus: b }), bonus);
  await p.waitForTimeout(2500);
  const f = p.frames().find(fr => fr !== p.mainFrame());
  const e1 = await f.evaluate(() => {
    const cash0 = save.cash;
    return { rangK: S.rangK, hm: S.hm, cash: cash0, depart: S.depart, ver: document.title };
  });
  T('rang 3 : vie ×1,8', e1.rangK === 1.8, e1.rangK);
  T(
    'arbre du héros et balles dans S.hm',
    e1.hm.hSpd === 0.12 &&
      e1.hm.uCharge === 0.3 &&
      e1.hm.abRad === 1.5 &&
      e1.hm.ePois === 2 &&
      e1.hm.eChain === 1 &&
      e1.hm.kTrail === undefined,
    JSON.stringify(e1.hm)
  );
  let recu = await p.evaluate(() => recu);
  T(
    'pret (partie 1, bourse 150)',
    recu.length === 1 && recu[0].dt === 'pret' && recu[0].partie === 1 && recu[0].argent === 150 && recu[0].rang === 3,
    JSON.stringify(recu)
  );

  // un zombie qui sort : sa vie × 1,8 ; l'ultime se charge 30 % plus vite ; les Entraves plus grandes et plus longues
  const z = await f.evaluate(() => {
    const n0 = S.nAct;
    devSpawn(1);
    const i = S.act[S.nAct - 1],
      ty = S.z.ty[i],
      attendu = ZT[ty].hp * hpMul(S.day) * (ty === 3 ? 1 + 0.15 * (S.day - 5) : 1) * 1.8;
    const u0 = S.ult;
    killZ(S, i, 'p');
    const du = S.ult - u0;
    S.phase = 'day';
    S.hab = 0;
    S.p.pitch = -0.5;
    const ok = useHeroSkill(S),
      th = S.thorns[S.thorns.length - 1];
    return { hm: S.z.hm[i], attendu, du, need: S.P.onde.need, n0, ok, r: th && th.r, t: th && th.t };
  });
  T('vie du zombie ×1,8', Math.abs(z.hm - z.attendu) < 1e-3, z.hm + ' / ' + z.attendu);
  T('ultime : +30 % par zombie', Math.abs(z.du - 1.3 / z.need) < 1e-9, z.du + ' / ' + 1.3 / z.need);
  T('Entraves : rayon +1,5 m, durée +2 s', z.ok && Math.abs(z.r - 6.7) < 1e-9 && z.t === 8, JSON.stringify(z));

  // la chute : la partie continue, aucun « fin », relevé sur le toit au bout de RELEVE s
  const c = await f.evaluate(() => {
    S.p.x = 3;
    S.p.z = 2;
    S.p.inv = 0;
    hurtP(S, 1e6);
    return { down: S.p.down, phase: S.phase, dead: S.p.dead, chutes: S.chutes, R: RELEVE };
  });
  T('tombé : la partie continue', c.down === 8 && c.R === 8 && !c.dead && c.phase !== 'dead' && c.chutes === 1, JSON.stringify(c));
  await p.waitForTimeout(400);
  T(
    'le voile « Tu es tombé »',
    await f.evaluate(
      () =>
        !document.getElementById('chuteV').hidden &&
        /De retour sur le toit dans [1-8] s/.test(document.getElementById('chuteT').textContent)
    )
  );
  const pendant = await f.evaluate(() => ({ skill: useHeroSkill(S), hp0: S.p.hp }));
  T('pas de compétence pendant la chute', pendant.skill === false);
  await f.evaluate(() => {
    for (let k = 0; k < 170; k++) step(S, 0.05, { f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
    events();
  });
  const r = await f.evaluate(() => ({
    x: S.p.x,
    y: S.p.y,
    z: S.p.z,
    H,
    hp: S.p.hp,
    hpMax: S.p.hpMax,
    down: S.p.down,
    inv: S.p.inv,
    voile: document.getElementById('chuteV').hidden
  }));
  T(
    'relevé au départ, toute sa vie, invincible un instant',
    r.x === 0 && r.z === -7 && r.y === r.H && r.hp === r.hpMax && r.down === 0 && r.inv > 0 && r.voile,
    JSON.stringify(r)
  );
  recu = await p.evaluate(() => recu);
  T('aucun « fin » à la chute', !recu.some(m => m.dt === 'fin'));

  // la ville tombe : écran de paie, un « fin » avec les nouveaux champs
  await f.evaluate(() => {
    S.runCash = 4321;
    hurtCity(S, 1e9);
    events();
  });
  await p.waitForTimeout(1900);
  const fin = await f.evaluate(() => ({
    t: document.getElementById('eT').textContent,
    paie: document.getElementById('eT').classList.contains('paie'),
    p: document.getElementById('eP').textContent,
    arbre: document.getElementById('eTree').textContent,
    btns: [...document.querySelectorAll('#eBtns button')].map(x => x.textContent)
  }));
  T(
    'écran de paie',
    fin.paie &&
      /^\+ 4\s?321 \$$/.test(fin.t) &&
      /argent est gardé/.test(fin.p) &&
      fin.arbre === "Améliorer l'immeuble" &&
      fin.btns.some(x => /^Repartir plus fort/.test(x)),
    JSON.stringify(fin)
  );
  T("niveaux à l'écran de fin", /Rang 3 · Sylve, Combattant niv\. 4 · Fusil d'assaut niv\. 3 de Nature/.test(fin.p), fin.p);
  recu = await p.evaluate(() => recu);
  const m = recu.find(x => x.dt === 'fin') || {};
  T(
    'fin : depart, boss, duree, chutes, rang, dev',
    m.raison === 'ville' &&
      m.depart === 1 &&
      m.boss === 0 &&
      Number.isInteger(m.duree) &&
      m.duree >= 8 &&
      m.chutes === 1 &&
      m.rang === 3 &&
      m.dev === false &&
      m.argent === 4321,
    JSON.stringify(m)
  );

  // « Repartir plus fort » : une deuxième partie, un deuxième « pret » sans bourse ; puis mode dev → dev: true
  const cashAvant = await f.evaluate(() => save.cash);
  await f.evaluate(() => [...document.querySelectorAll('#eBtns button')].find(x => /^Repartir/.test(x.textContent)).click());
  await p.waitForTimeout(500);
  recu = await p.evaluate(() => recu);
  const pr2 = recu.filter(x => x.dt === 'pret');
  T(
    'pret à la deuxième partie, sans bourse',
    pr2.length === 2 && pr2[1].partie === 2 && pr2[1].argent === 0 && (await f.evaluate(() => save.cash)) === cashAvant,
    JSON.stringify(pr2[1])
  );
  await f.evaluate(() => {
    save.dev = true;
    devTick(0.016);
    save.dev = false;
    S.phase = 'dead';
    S.p.dead = true;
    S.abandon = true;
    showEnd(false);
  });
  recu = await p.evaluate(() => recu);
  const m2 = recu.filter(x => x.dt === 'fin')[1] || {};
  T('fin : dev quand le mode dev a servi', m2.dev === true && m2.raison === 'abandon', JSON.stringify(m2));

  // la page seule : rien du lobby, mourir en « Ils s'échappent » relève aussi ; « Ils arrivent » garde la défaite
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errs.push('page seule : ' + e.message));
  await p2.goto('file://' + path.resolve('test3d.html'));
  await p2.waitForTimeout(1500);
  const seule = await p2.evaluate(() => {
    save.mode = 'out';
    newGame(1);
    const a = { rangK: S.rangK, hm: Object.values(S.hm).every(v => v === 0) };
    hurtP(S, 1e6);
    a.down = S.p.down;
    save.mode = 'in';
    newGame(1);
    hurtP(S, 1e6);
    a.inDead = S.p.dead && S.phase === 'dead';
    return a;
  });
  T(
    'page seule : rang 1, bonus à zéro, chute ; « Ils arrivent » : défaite',
    seule.rangK === 1 && seule.hm && seule.down === 8 && seule.inDead,
    JSON.stringify(seule)
  );

  T('aucune erreur', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
