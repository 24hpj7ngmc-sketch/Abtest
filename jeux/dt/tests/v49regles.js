// V4.9 (demande du lobby, claude/demande-dernier-toit-roles-elements.md, point 6) : les voies (opts.voie, spA1, spA2, spB1, spB2) et
// l'ultime teinté par l'élément de l'arme. Les règles seules (sous Node, ≈ 2 s).                         node tests/v49regles.js
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'regles.js'), 'utf8'),
  NOMS =
    'newRun,startDay,HEROS,ZT,eyeP,spawnOne,shoot,gridBuild,heroMods,useHeroSkill,useHeroUlt,heroStep,projStep,rampartBlock,' +
    'appliqueActions,hpMul,killZ,hurtP,finishP,heroHp,weapOf,VOIES,voieNom,setLobby';
function charge() {
  const c = { console };
  vm.createContext(c);
  // elementArmeLobby, bonusLobby, voieLobby sont des « let » des règles : un petit accès pour les tests
  vm.runInContext(
    SRC +
      ';function setLobby(el, b, v){ elementArmeLobby = el; bonusLobby = b || null; voieLobby = v || null; }' +
      ';this.A={' +
      NOMS +
      '};',
    c
  );
  return c.A;
}
let ok = 0,
  ko = 0;
const T = (n, b, x) => {
  b ? ok++ : ko++;
  console.log((b ? 'OK   ' : 'RATÉ ') + n + (x !== undefined ? ' — ' + x : ''));
};
const A = charge();
// une partie avec ce héros, cette voie, ces cases (bonus.heros) et cet élément d'arme
function partie(hero, voie, heros, el) {
  A.setLobby(el || null, { heros: heros || {} }, voie);
  const S = A.newRun({ cash: 0, lv: { root: 1 }, layout: {}, mode: 'out', hero, weap: 'fusil' }, 2, 5);
  A.setLobby(null);
  S.god = true;
  A.startDay(S);
  S.toSpawn = 0;
  S.P.rCrit = -1;
  Object.assign(S.p, { x: 0, y: 0, z: -18, ground: true, yaw: 0, pitch: 0 });
  S.ev.length = 0;
  return S;
}
// un zombie (type ty) dans la rue, en (x, z), vie hp (et vie max hm)
function zombie(S, x, z, o) {
  o = o || {};
  A.spawnOne(S);
  const i = S.act[S.nAct - 1],
    Z = S.z;
  Z.st[i] = 1;
  Z.ty[i] = o.ty || 0;
  Z.x[i] = x;
  Z.z[i] = z;
  Z.y[i] = 0;
  Z.hp[i] = o.hp || 1e5;
  if (o.hm) Z.hm[i] = o.hm;
  Z.root[i] = Z.slow[i] = Z.burn[i] = Z.psn[i] = 0;
  A.gridBuild(S);
  return i;
}
const regarde = (S, q) => {
  const o = A.eyeP(S.p),
    dx = q[0] - o[0],
    dy = q[1] - o[1],
    dz = q[2] - o[2];
  S.p.yaw = Math.atan2(-dx, -dz);
  S.p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
};
const perte = (S, i, hp) => (hp || 1e5) - S.z.hp[i];
const pas = (S, n, f) => {
  for (let k = 0; k < n; k++) {
    S.t += 0.02;
    (f || A.heroStep)(S, 0.02);
  }
};
const INP = { f: 0, r: 0, fire: false, ads: false, yaw: 0, pitch: 0 };

// ---- la voie arrive du lobby
{
  A.setLobby(null, { heros: { spA1: 2, spA2: 1, spB1: 3, spB2: 1 } }, 'a');
  const ma = A.heroMods();
  A.setLobby(null, { heros: { spA1: 2, spA2: 1, spB1: 3, spB2: 1 } }, 'b');
  const mb = A.heroMods();
  A.setLobby(null);
  T('voie a : ses cases seules (spA1, spA2) ; voie b : les siennes', ma.spA1 === 2 && ma.spB1 === 0 && mb.spB1 === 3 && mb.spA2 === 0);
  const a = partie('vent', 'a'),
    b = partie('vent', 'zz');
  A.setLobby(null, {}, 'b');
  const c = A.newRun({ cash: 0, lv: {}, layout: {}, mode: 'in', hero: 'vent', weap: 'fusil' }, 2, 5);
  A.setLobby(null);
  T(
    'S.voie : celle du lobby, rien si elle est inconnue ou en « Ils arrivent » ; voieNom',
    a.voie === 'a' && b.voie === null && c.voie === null && A.voieNom(a) === 'Sniper' && A.voieNom(b) === '',
    [a.voie, b.voie, c.voie].join()
  );
  T(
    'les douze voies ont un nom, un effet et leurs deux cases',
    Object.keys(A.VOIES).length === 6 && Object.values(A.VOIES).every(v => v.a.n && v.a.d && v.a.c2 && v.b.n && v.b.c1)
  );
}

// ---- Roc
{
  const S = partie('terre', 'a', { spA1: 1, spA2: 1 }),
    base = partie('terre');
  regarde(S, [0, 0, -26]);
  regarde(base, [0, 0, -26]);
  A.useHeroSkill(S);
  A.useHeroSkill(base);
  const w = S.ramparts[0],
    w0 = base.ramparts[0];
  T(
    'Gardien : rempart 3 m plus large de chaque côté (2 + spA1) et 1,5 fois plus solide',
    w.half - w0.half === 3 && Math.abs(w.hp / w0.hp - 1.5) < 1e-6
  );
  const i = zombie(S, 0, -25.9);
  const blo = A.rampartBlock(S, i, 0, -27, 0.1);
  T(
    'Rempart renvoyeur : le zombie qui le frappe prend la moitié du coup',
    blo && perte(S, i) > 0 && Math.abs(perte(S, i) - (w.hp0 - w.hp) / 2) < 0.02,
    perte(S, i).toFixed(2)
  );
}
{
  const S = partie('terre', 'b', { spB1: 2, spB2: 1 });
  const i = zombie(S, 0, -29),
    j = zombie(S, 0, -36.5),
    g = zombie(S, 1, -30, { ty: 2 });
  regarde(S, [0, 0, -26]);
  A.useHeroSkill(S);
  const w = S.ramparts[0],
    z0 = w.z;
  pas(S, 60);
  const Z = S.z;
  T(
    "Avant-garde : le rempart charge 8 m (6 + spB1) vers l'extérieur, puis tient",
    Math.abs(z0 - w.z - 8) < 1e-3 && w.ch === 0 && S.ramparts.length === 1,
    (z0 - w.z).toFixed(2)
  );
  T(
    "ce qu'il pousse : devant lui, renversé (petit : à terre ; Colosse : ralenti), blessé une fois",
    Z.z[i] < w.z && Z.root[i] > 0 && perte(S, i) > 0 && Z.slow[g] > 0 && Z.root[g] === 0,
    Z.z[i].toFixed(2) + ' · ' + perte(S, i).toFixed(1)
  );
  T(
    "Onde de choc (spB2) : renverse aussi celui qui attendait à l'arrivée",
    Z.root[j] > 0 && perte(S, j) > 0 && S.ev.some(e => e.k === 'onde_roc')
  );
}

// ---- Sylve
{
  const S = partie('bois', 'a', { spA1: 50, spA2: 1 }),
    base = partie('bois');
  T('Colosse : +25 de vie, +25 par niveau', A.heroHp(S) - A.heroHp(base) === 75 && S.p.hpMax === A.heroHp(S), A.heroHp(S) - A.heroHp(base));
  const i = zombie(S, 0, -21);
  S.p.hp = 50;
  regarde(S, [0, 1, -21]);
  A.shoot(S);
  T('Sève (spA2) : un coup sur un zombie à moins de 5 m rend 2 de vie', S.p.hp === 52 && perte(S, i) > 0, S.p.hp);
}
{
  const S = partie('bois', 'b', { spB2: 1 });
  const i = zombie(S, 0, -25),
    j = zombie(S, 0.5, -26.5);
  regarde(S, [0, 0, -24]);
  A.useHeroSkill(S);
  T(
    "Plongeur : on bondit sur le point visé (6 m), roncier et poison 6 s à l'arrivée",
    Math.abs(S.p.z + 24) < 0.05 && S.thorns.length === 1 && Math.abs(S.thorns[0].z + 24) < 0.05 && S.z.psn[i] >= 5.9 && perte(S, i) > 0,
    S.p.z.toFixed(2)
  );
  const S2 = partie('bois', 'b', { spB1: 2 });
  regarde(S2, [0, 0, -40]);
  A.useHeroSkill(S2);
  T('Plongeur : 10 m au plus (8 + spB1) vers un point plus loin', Math.abs(S2.p.z + 28) < 0.05, S2.p.z.toFixed(2));
  const S3 = partie('bois', 'b', { spB2: 1 });
  const a = zombie(S3, 0, -30),
    b = zombie(S3, 1.5, -30),
    c = zombie(S3, 6, -30);
  S3.z.psn[a] = 2;
  A.killZ(S3, a, 'p');
  T("Poison qui se propage (spB2) : à la mort d'un empoisonné, ses voisins à 3 m", S3.z.psn[b] >= 3 && S3.z.psn[c] === 0);
}

// ---- Volt
{
  const seul = partie('elec', 'a', { spA1: 0.2 }),
    foule = partie('elec', 'a', { spA1: 0.2 }),
    base = partie('elec');
  const i = zombie(seul, 0, -30),
    j = zombie(foule, 0, -30),
    k = zombie(base, 0, -30);
  zombie(foule, 2.5, -31);
  for (const [S, q] of [
    [seul, i],
    [foule, j],
    [base, k]
  ]) {
    regarde(S, [0, 1, -30]);
    A.shoot(S);
  }
  const r = perte(seul, i) / perte(base, k),
    r2 = perte(foule, j) / perte(base, k);
  T(
    'Lame : +50 % (+20 % par niveau) sur un zombie isolé, rien dans la foule',
    Math.abs(r - 1.7) < 0.005 && Math.abs(r2 - 1) < 1e-6,
    r.toFixed(3) + ' · ' + r2.toFixed(3)
  );
  const S = partie('elec', 'a', { spA2: 1 }),
    d = perte(base, k) / 1.5;
  const q = zombie(S, 0, -30, { hp: Math.round(perte(base, k)) + 8, hm: 100 });
  regarde(S, [0, 1, -30]);
  A.shoot(S);
  T('Exécution (spA2) : sous 15 % de sa vie, achevé', S.z.st[q] === 0 && S.ev.some(e => e.k === 'acheve'), d.toFixed(1));
}
{
  const S = partie('elec', 'b', { spB1: 0.15 }),
    cd = (A.HEROS.elec.cd * S.P.mis.cd) / 22;
  S.hab = 5;
  const i = zombie(S, 0, -30);
  A.killZ(S, i, 'p');
  T(
    'Escarmoucheur : un tué rend 4 % de la recharge (2,5 + spB1 × 10 points)',
    Math.abs(5 - S.hab - cd * 0.04) < 1e-6,
    (5 - S.hab).toFixed(3)
  );
  const S2 = partie('elec', 'b', { spB2: 1 });
  zombie(S2, 0, -24, { hp: 1 });
  S2.p.yaw = 0;
  A.useHeroSkill(S2);
  const S3 = partie('elec', 'b', { spB2: 1 });
  S3.p.yaw = 0;
  A.useHeroSkill(S3);
  T(
    "Relance (spB2) : un zombie tué par l'Éclair le relance (pas sans tué)",
    S2.hab <= 0.3 && S3.hab > 5,
    S2.hab + ' · ' + S3.hab.toFixed(1)
  );
}

// ---- Braise
{
  const S = partie('feu', 'a', { spA1: 5, spA2: 1 }),
    base = partie('feu'),
    R = A.weapOf(S).range;
  const i = zombie(S, 0, -18 - R - 10),
    j = zombie(base, 0, -18 - R - 10);
  regarde(S, [0, 1, -18 - R - 10]);
  regarde(base, [0, 1, -18 - R - 10]);
  A.shoot(S);
  A.shoot(base);
  T('Artilleur : les armes portent 15 m plus loin (10 + spA1)', perte(S, i) > 0 && perte(base, j) === 0, 'portée ' + R);
  regarde(S, [0, 0, -30]);
  A.useHeroSkill(S);
  T('Artilleur : le Brasier laisse un feu de 6 m', S.fballs[0].feuR === 6);
  S.ult = 1;
  zombie(S, 0, -40);
  A.useHeroUlt(S);
  pas(S, 30);
  T('Sol en feu (spA2) : le météore tombé laisse un feu 4 s', S.bombs.some(b => b.feu) || S.fires.some(f => f.t <= 4 && f.r === 3.5));
  pas(S, 40, (S, dt) => A.projStep(S, dt));
  T(
    '… le feu est au sol',
    S.fires.some(f => f.r === 3.5)
  );
}
{
  const S = partie('feu', 'b', { spB1: 1, spB2: 1 });
  const i = zombie(S, 0, -21.5),
    j = zombie(S, 0, -23);
  for (let k = 0; k < 5; k++) A.finishP(S, 0.05, INP, false);
  T("Mage de bataille : l'aura brûle à 4 m (3 + spB1), pas plus loin", S.z.burn[i] > 0 && perte(S, i) > 0 && S.z.burn[j] === 0);
  S.god = false;
  const h0 = S.p.hp;
  A.hurtP(S, 20);
  const base = partie('feu');
  base.god = false;
  const b0 = base.p.hp;
  A.hurtP(base, 20);
  T("l'aura amortit les coups (spB2 : −25 %)", Math.abs((h0 - S.p.hp) / (b0 - base.p.hp) - 0.75) < 1e-6);
}

// ---- Ondine
{
  const S = partie('eau', 'a', { spA1: 0.15, spA2: 1 }),
    base = partie('eau');
  for (const s of [S, base]) {
    s.p.hp = 10;
    s.p.hurtT = 5;
    A.finishP(s, 1, INP, false);
  }
  T('Soigneuse : la vie remonte 35 % plus vite (20 + spA1)', Math.abs((S.p.hp - 10) / (base.p.hp - 10) - 1.35) < 1e-6);
  regarde(S, [0, 0, -30]);
  A.useHeroSkill(S);
  T("Bouclier d'eau (spA2) : la Marée pose 30 de bouclier", S.p.boucl === 30 && S.ev.some(e => e.k === 'bouclier'));
  S.god = false;
  const h0 = S.p.hp;
  A.hurtP(S, 20 / S.P.armor);
  const h1 = S.p.hp;
  A.hurtP(S, 20 / S.P.armor);
  T("le bouclier prend les coups d'abord (20 puis 10 + 10)", h1 === h0 && Math.abs(h0 - S.p.hp - 10) < 1e-6 && S.p.boucl === 0);
}
{
  const S = partie('eau', 'b', { spB1: 0.5, spB2: 1 });
  const i = zombie(S, 0, -30),
    g = zombie(S, 1, -30, { ty: 2 }),
    j = zombie(S, 0, -60);
  regarde(S, [0, 0, -30]);
  A.useHeroSkill(S);
  T(
    'Entraveuse : la Marée immobilise 2 s (1,5 + spB1) ; un Colosse, seulement ralenti',
    Math.abs(S.z.root[i] - 2) < 1e-6 && S.z.root[g] === 0 && S.z.slow[g] > 0
  );
  S.ult = 1;
  A.useHeroUlt(S);
  T('Lame de fond (spB2) : le Déluge immobilise tous les petits dehors', Math.abs(S.z.root[j] - 2) < 1e-6);
}

// ---- Zéphyr
{
  const S = partie('vent', 'a', { spA1: 0.1 }),
    base = partie('vent');
  const i = zombie(S, 0, -70),
    j = zombie(base, 0, -70);
  regarde(S, [0, 1, -70]);
  regarde(base, [0, 1, -70]);
  A.shoot(S);
  A.shoot(base);
  T(
    'Sniper : +25 % au-delà de 40 m (15 + spA1)',
    Math.abs(perte(S, i) / perte(base, j) - 1.25) < 0.005,
    (perte(S, i) / perte(base, j)).toFixed(3)
  );
  const C = partie('vent', 'a', { spA2: 1 }),
    nc = partie('vent', 'a', { spA2: 1 });
  const zs = [-30, -32, -34, -36, -38, -40, -42];
  const ic = zs.map(z => zombie(C, 0, z)),
    inc = zs.map(z => zombie(nc, 0, z));
  for (const [s, q] of [
    [C, 1.2],
    [nc, 0.5]
  ]) {
    regarde(s, [0, 1, -30]);
    for (let k = 0; k < 4; k++) A.finishP(s, q / 4, Object.assign({}, INP, { ads: true }), false);
    A.finishP(s, 0.01, Object.assign({}, INP, { ads: true, fire: true }), false);
  }
  const tc = ic.filter(i => perte(C, i) > 0).length,
    tn = inc.filter(i => perte(nc, i) > 0).length;
  T(
    'Tir chargé (spA2) : après 1 s en visée, ×2 et 3 zombies de plus ; pas avant',
    tc === tn + 3 && Math.abs(perte(C, ic[0]) / perte(nc, inc[0]) - 2) < 0.005 && C.p.adsT === 0,
    tc + ' contre ' + tn
  );
}
{
  // cadence : tirs en 3 s, debout puis en courant, et avec le tir continu
  const tirs = (voie, heros, spr) => {
    const S = partie('vent', voie, heros);
    S.p.spr = spr;
    S.p.pitch = 1.2;
    let n = 0;
    for (let k = 0; k < 150; k++) {
      const f0 = S.p.fireT;
      A.finishP(S, 0.02, Object.assign({}, INP, { fire: true }), false);
      if (S.p.fireT > f0) n++;
      S.p.spr = spr;
    }
    return n;
  };
  const n0 = tirs(null),
    n1 = tirs('b'),
    n2 = tirs('b', { spB1: 0.08 }, true),
    n3 = tirs('b', { spB2: 1 });
  T(
    'Mitrailleur : +10 % de cadence ; en courant +18 % de plus (10 + spB1)',
    n1 > n0 && n2 > n1 && Math.abs(n2 / n0 - 1.28) < 0.06,
    [n0, n1, n2].join(' ')
  );
  T(
    "Tir continu (spB2) : la cadence monte tant qu'il tire (jusqu'à +40 %)",
    n3 > n1 + 2 && n3 / n0 > 1.3 && n3 / n0 <= 1.5,
    [n0, n3].join(' ')
  );
}

// ---- l'ultime teinté
{
  const S = partie('terre', null, {}, 'feu'),
    base = partie('terre', null, {}, 'terre');
  const i = zombie(S, 0, -25),
    j = zombie(base, 0, -25);
  S.ult = base.ult = 1;
  A.useHeroUlt(S);
  A.useHeroUlt(base);
  T(
    'Séisme avec une arme de Feu : séisme de lave (les zombies brûlent) ; avec la Terre, rien de plus',
    S.z.burn[i] > 0 && base.z.burn[j] === 0 && S.ev.some(e => e.k === 'hult' && e.el === 'feu')
  );
  const V = partie('vent', null, {}, 'bois');
  const k = zombie(V, 0, -30);
  regarde(V, [0, 1, -30]);
  V.p.pitch = 0;
  V.ult = 1;
  A.useHeroUlt(V);
  T('Tir perçant avec une arme de Nature : il empoisonne', V.z.psn[k] > 0);
  const E = partie('feu', null, {}, 'eau');
  const m = zombie(E, 0, -40);
  E.ult = 1;
  A.useHeroUlt(E);
  pas(E, 40, (s, dt) => {
    A.heroStep(s, dt);
    A.projStep(s, dt);
  });
  T("Météores avec une arme d'Eau : ce qu'ils touchent est ralenti", perte(E, m) > 0 && E.z.slow[m] > 0);
  const O = partie('eau', null, {}, 'elec');
  zombie(O, 0, -30);
  zombie(O, 1, -30);
  O.ult = 1;
  A.useHeroUlt(O);
  O.ev.length = 0;
  pas(O, 10);
  const z1 = O.ev.filter(e => e.k === 'zap').length;
  pas(O, 10);
  T(
    "Déluge avec une arme d'Élec : des arcs, une fois par seconde au plus par zombie",
    z1 >= 1 && O.ev.filter(e => e.k === 'zap').length === z1,
    z1
  );
}

// ---- le multi : l'ultime d'un invité garde sa voie et l'élément de son arme
{
  const S = partie('feu');
  const i = zombie(S, 0, -25),
    p = S.p;
  A.appliqueActions(S, { id: 'b', heros: 'terre', vu: 0 }, [['u', 1, p.x, p.y, p.z, p.yaw, p.pitch, 'terre', 1, [], '', 'feu']]);
  T(
    "l'ultime d'un invité avec une arme de Feu : séisme de lave chez l'hôte (puis l'hôte retrouve son héros)",
    S.z.burn[i] > 0 && S.hero === 'feu' && S.elArme === 'feu'
  );
  const H = partie('feu');
  const j = zombie(H, 0, -29),
    q = H.p;
  regarde(H, [0, 0, -26]);
  A.appliqueActions(H, { id: 'b', heros: 'terre', vu: 0 }, [
    ['c', 1, q.x, q.y, q.z, q.yaw, q.pitch, 'terre', 1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0], 'b', 'terre']
  ]);
  const w = H.ramparts[0];
  T("le Rempart d'un invité en Avant-garde charge chez l'hôte (8 m), à son compte", w && w.ch === 8 && w.own === 'b' && H.voie === null);
}

console.log(ok + ' OK, ' + ko + ' ratés');
process.exit(ko ? 1 : 0);
