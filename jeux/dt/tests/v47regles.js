// V4.7 (sa demande du 25/11) : escalade offerte, tyrolienne à débloquer, grappin, et trois balles spéciales (arc électrique, ricochet,
// balles incendiaires). Les règles seules (sous Node, ≈ 2 s).            node tests/v47regles.js
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'regles.js'), 'utf8'),
  NOMS = 'newRun,step,startDay,derive,NODES,H,B,LVY,PASSY,PASSD,ZT,eyeP,viewDir,spawnOne,shoot,grappinVise,useGrappin,gridBuild';
function charge() {
  const c = { console };
  vm.createContext(c);
  vm.runInContext(SRC + ';this.A={' + NOMS + '};', c);
  return c.A;
}
let ok = 0,
  ko = 0;
const T = (n, b, x) => {
  b ? ok++ : ko++;
  console.log((b ? 'OK   ' : 'RATÉ ') + n + (x !== undefined ? ' — ' + x : ''));
};
const A = charge();
const partie = (lv, jour) => {
  const S = A.newRun({ cash: 0, lv: Object.assign({ root: 1 }, lv), layout: {}, mode: 'out', hero: 'eau', weap: 'fusil' }, jour || 2, 5);
  S.god = true;
  return S;
};
// on regarde le point q depuis les yeux du joueur
const regarde = (S, q) => {
  const o = A.eyeP(S.p),
    dx = q[0] - o[0],
    dy = q[1] - o[1],
    dz = q[2] - o[2];
  S.p.yaw = Math.atan2(-dx, -dz);
  S.p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
};
const tire = (S, sec) => {
  for (let t = 0; t < sec; t += 1 / 30) {
    A.step(S, 1 / 30, { f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
    S.ev.length = 0;
  }
};

// ---- l'arbre
const P0 = A.derive({ root: 1 });
T('escalade offerte, tyrolienne et grappin à débloquer', P0.grimpe.on && !P0.tyro.on && !P0.grap.on);
const n = id => A.NODES.find(q => q.id === id);
T(
  'les cases : Tyrolienne (Survie), Grappin après elle, trois balles spéciales (Fusil)',
  n('m_tyro').req === 's_hp' &&
    n('m_grap').req === 'm_tyro' &&
    n('f_arc') &&
    n('f_rico').req === 'f_pierce' &&
    n('f_feu').req === 'f_exp' &&
    !n('m_grimpe')
);
const pos = new Set();
T(
  "aucune case sur une autre dans l'arbre",
  A.NODES.every(q => !pos.has(q.x + ',' + q.y) && pos.add(q.x + ',' + q.y))
);

// ---- le grappin
{
  const S = partie({ m_tyro: 1, m_grap: 1 });
  const p = S.p;
  // dans la rue, face à la façade nord, en visant à 9 m de haut : on se pose sur un balcon
  Object.assign(p, { x: 1.3, y: 0, z: -26, ground: true });
  regarde(S, [1.3, 9.5, -A.B]); // entre deux fenêtres (par une fenêtre, on toucherait un plafond dedans : rien)
  let g = A.grappinVise(S);
  T(
    'rue → façade : se pose sur un balcon',
    g && /balcon/.test(g.n) && Math.abs(g.land[2]) > A.B && Math.abs(g.land[2]) < A.B + 2.4,
    g && g.n
  );
  const yb = g && g.land[1];
  A.useGrappin(S, g);
  T('il part : recharge, corde accrochée', S.grapCd > 0 && p.clb && p.clb.gr);
  T('pendant la recharge, pas de second tir', !A.useGrappin(S, A.grappinVise(S) || g));
  tire(S, 3);
  T('posé sur le balcon', !p.clb && Math.abs(p.y - yb) < 0.05 && p.ground, p.y.toFixed(2));
  // en haut de la façade : par-dessus le parapet, sur le toit
  Object.assign(p, { x: 4, y: 0, z: -26, ground: true });
  S.grapCd = 0;
  regarde(S, [4, A.H - 0.6, -A.B]);
  g = A.grappinVise(S);
  T('haut de la façade → le toit', g && g.n === 'le toit' && Math.abs(g.land[1] - A.H) < 0.05, g && g.n);
  A.useGrappin(S, g);
  tire(S, 3);
  T('posé sur le toit, derrière le parapet', Math.abs(p.y - A.H) < 0.05 && Math.abs(p.z) < A.B, p.y.toFixed(2) + ' ' + p.z.toFixed(2));
  // du toit, vers la rue
  S.grapCd = 0;
  Object.assign(p, { x: 0, z: -12.6 }); // contre le parapet
  regarde(S, [0, 0, -29]);
  g = A.grappinVise(S);
  T('toit → la rue', g && g.n === 'la rue' && g.land[1] === 0, g && g.n);
  // la passerelle nord, vue de la rue
  Object.assign(p, { x: 0, y: 0, z: -45, ground: true, clb: null });
  regarde(S, [0, A.PASSY - 0.2, -A.PASSD]);
  g = A.grappinVise(S);
  T('rue → passerelle', g && g.n === 'la passerelle' && Math.abs(g.land[1] - A.PASSY) < 0.05, g && g.n);
  // le ciel : rien
  p.pitch = 1.2;
  T('le ciel : rien à attraper', A.grappinVise(S) === null);
  // trop loin : rien
  Object.assign(p, { x: 0, y: 0, z: -80 });
  regarde(S, [0, 9, -A.B]);
  T('trop loin (30 m) : rien', A.grappinVise(S) === null);
  // sans la case
  const S2 = partie({ m_tyro: 1 });
  Object.assign(S2.p, { x: 0, y: 0, z: -26 });
  regarde(S2, [0, 9.5, -A.B]);
  T('sans la case Grappin : rien', A.grappinVise(S2) === null);
}

// ---- les balles spéciales : un zombie devant soi, d'autres autour de lui
function stand(lv, nb) {
  const S = partie(lv, 2);
  A.startDay(S);
  S.toSpawn = 0;
  const Z = S.z,
    ids = [];
  for (let k = 0; k < nb; k++) {
    A.spawnOne(S);
    const i = S.act[S.nAct - 1];
    Z.st[i] = 1;
    Z.x[i] = k === 0 ? 0 : Math.cos(k) * 2.5;
    Z.z[i] = -30 + (k === 0 ? 0 : Math.sin(k) * 2.5);
    Z.y[i] = 0;
    ids.push(i);
  }
  A.gridBuild(S);
  Object.assign(S.p, { x: 0, y: 0, z: -18, ground: true });
  regarde(S, [0, 1.05 * A.ZT[Z.ty[ids[0]]].sc, -30]);
  S.ev.length = 0;
  return { S, ids };
}
{
  // ricochet : la balle tue, puis rebondit
  const { S, ids } = stand({ f_rico: 3, f_dmg: 20 }, 6);
  for (const i of ids) S.z.hp[i] = 1;
  A.shoot(S);
  const r = S.ev.filter(e => e.k === 'tracer' && e.ty === 'rico').length,
    morts = ids.filter(i => S.z.st[i] === 0).length;
  T('ricochet : la balle tue, puis rebondit (3 rebonds qui tuent)', r === 3 && morts === 4, r + ' rebonds, ' + morts + ' morts');
}
{
  const { S, ids } = stand({}, 6);
  for (const i of ids) S.z.hp[i] = 1;
  A.shoot(S);
  T('sans la case : pas de ricochet', !S.ev.some(e => e.ty === 'rico'));
}
{
  // arc électrique : une balle sur cinq qui touche
  const { S, ids } = stand({ f_arc: 4 }, 7);
  for (const i of ids) S.z.hp[i] = 1e6;
  let zaps = [];
  for (let k = 0; k < 5; k++) {
    A.shoot(S);
    zaps.push(S.ev.filter(e => e.k === 'zap').length);
    S.ev.length = 0;
  }
  T(
    'arc électrique : rien aux 4 premières, un éclair sur 5 zombies à la 5e',
    zaps.slice(0, 4).every(z => z === 0) && zaps[4] === 5,
    zaps.join(' ')
  );
}
{
  // balles incendiaires : au niveau 5, 40 % des balles enflamment
  const { S, ids } = stand({ f_feu: 5 }, 1);
  S.z.hp[ids[0]] = 1e9;
  let feu = 0;
  for (let k = 0; k < 200; k++) {
    S.z.burn[ids[0]] = 0;
    A.shoot(S);
    if (S.z.burn[ids[0]] > 0) feu++;
    S.ev.length = 0;
  }
  T('balles incendiaires : environ 40 % des balles enflamment', feu > 55 && feu < 110, feu + ' / 200');
}
{
  // en « Ils arrivent », rien de tout ça
  const S = A.newRun(
    { cash: 0, lv: { root: 1, f_rico: 3, f_arc: 4, f_feu: 5, m_grap: 1, m_tyro: 1 }, layout: {}, mode: 'in', hero: 'feu', weap: 'fusil' },
    2,
    5
  );
  T('« Ils arrivent » : pas de grappin', A.grappinVise(S) === null);
}
console.log(ok + ' OK, ' + ko + ' ratés');
process.exit(ko ? 1 : 0);
