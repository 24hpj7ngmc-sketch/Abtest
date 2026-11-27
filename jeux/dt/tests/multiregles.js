// V4.3 : le multi dans les règles (regles/multi.js). Deux joueurs = deux copies des règles (deux contextes vm, comme deux cadres) :
// l'hôte fait tourner la partie, l'invité recopie son instantané. Vérifie : aller-retour fidèle, budget respecté, coup d'un invité
// appliqué par l'hôte, mauvaise génération ignorée, compétence / ultime / leurre / frappe / planche d'un invité, horde ×1,5 à deux,
// rien ne change à un joueur (empreinte), reprise d'hôte, données invalides sans effet.      node tests/multiregles.js
const fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  { spawnSync } = require('child_process');
const RACINE = path.join(__dirname, '..'),
  SRC = fs.readFileSync(path.join(RACINE, 'regles.js'), 'utf8'),
  NOMS =
    'newRun,step,startDay,stepInvite,encodeInstantane,appliqueInstantane,appliqueActions,actionsInvite,reprendHote,hurtZ,' +
    'useHeroSkill,useHeroUlt,useLeurre,useAir,plankStep,setPlanks,derive,NODES,H,B,NLV,MAXZ,DOORS,PANELS,SLOTS,ZT,eyeP,hordeK,' +
    'wallDmg,spawnOne,LVY,levelOf,buildTurrets,planCode,planLit,niveauxCode,niveauxLit,statsTourelles,slotOn';
function charge() {
  const c = { console };
  vm.createContext(c);
  vm.runInContext(SRC + ';this.A={' + NOMS + '};', c);
  c.A.ctx = c;
  return c.A;
}
let ok = 0,
  ko = 0;
const T = (n, b, x) => {
  b ? ok++ : ko++;
  console.log((b ? 'OK   ' : 'RATÉ ') + n + (x !== undefined ? ' — ' + x : ''));
};
const inp = S => ({ f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
const save = (hero, arbre, A) => {
  const s = { cash: 0, lv: { root: 1 }, layout: {}, mode: 'out', hero, weap: 'fusil' };
  for (let k = 0; k < 24; k++) s.layout[k] = ['mg', 'la', 'mo', 'fl'][k % 4];
  if (arbre) for (const n of A.NODES) s.lv[n.id] = n.max;
  return s;
};
// une partie d'hôte : jour, secondes jouées (sans tirer), options { hero, arbre, nj, graine }
function hote(jour, sec, o = {}) {
  const A = charge(),
    S = A.newRun(save(o.hero || 'feu', o.arbre, A), jour, o.graine || 99);
  S.god = true;
  if (o.nj) S.nJoueurs = o.nj;
  A.startDay(S);
  for (let t = 0; t < sec; t += 1 / 30) {
    A.step(S, 1 / 30, inp(S));
    S.ev.length = 0;
  }
  return { A, S };
}
// un invité : sa propre partie (newRun), marqué invité, puis l'instantané de l'hôte
function invite(G, o = {}) {
  const A = charge(),
    S = A.newRun(save(o.hero || 'eau', o.arbre, A), 1, 5);
  S.invite = true;
  const r = G !== undefined ? A.appliqueInstantane(S, G) : null;
  return { A, S, r };
}
const actifs = S => {
  const L = [];
  for (let k = 0; k < S.nAct; k++) if (S.z.st[S.act[k]]) L.push(S.act[k]);
  return L;
};
// l'empreinte d'un état (comme tests/empreinte.js)
const emp = S => {
  let h = 2166136261;
  const mix = v => {
    const s = String(Math.round(v * 1e4) / 1e4);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  };
  for (const i of actifs(S)) for (const c of ['x', 'y', 'z', 'hp', 'st', 'ty']) mix(S.z[c][i]);
  return [S.kills, S.escaped, S.nAct, Math.round(S.city * 1e4), Math.round(S.save.cash * 1e4), h].join(' ');
};

// ---------------------------------------------------------------- aller-retour, jour 4 (tout tient en proches)
{
  const { A: HA, S: H } = hote(4, 25);
  H.p.x = 3;
  H.p.z = -10;
  H.p.yaw = 0.4;
  H.city = 87.3;
  const G0 = HA.encodeInstantane(H, [{ x: 20, y: 0, z: 30 }], 3000),
    { S: G, r } = invite(G0);
  T('instantané lu', r === true && typeof G0 === 'string', G0.length + ' caractères, ' + H.mStat.actifs + ' zombies actifs');
  T('alphabet sûr pour JSON', /^[A-Za-z0-9_-]*$/.test(G0) && JSON.stringify(G0).length === G0.length + 2);
  T(
    'la journée recopiée',
    G.day === 4 &&
      G.phase === 'day' &&
      Math.abs(G.city - 87.3) < 0.051 &&
      G.toSpawn === H.toSpawn &&
      G.spawned === H.spawned &&
      G.dayTotal === H.dayTotal &&
      G.left === H.left &&
      G.escaped === H.escaped &&
      Math.abs(G.dayT - H.dayT) < 0.051 &&
      G.mVilleMax === H.P.hp,
    'jour ' + G.day + ', ville ' + G.city + ' / ' + G.mVilleMax + ', restent ' + G.toSpawn + ' à sortir'
  );
  const LH = actifs(H),
    LG = actifs(G);
  let err = 0,
    pire = 0;
  for (const i of LH) {
    const z = G.z,
      h = H.z;
    const d = Math.max(Math.abs(z.mx[i] - h.x[i]), Math.abs(z.mz[i] - h.z[i]), Math.abs(z.my[i] - h.y[i]));
    pire = Math.max(pire, d);
    if (z.fant[i] || z.st[i] !== h.st[i] || z.ty[i] !== h.ty[i] || (z.gen[i] & 15) !== (h.gen[i] & 15) || d > 0.126) err++;
    if (z.hp[i] < h.hp[i] - 1e-3 || z.hp[i] > h.hp[i] + h.hm[i] / 16 + 1e-3) err++;
  }
  T(
    'aller-retour fidèle (proches)',
    LG.length === LH.length && err === 0 && H.mStat.lointains === 0,
    LG.length + ' / ' + LH.length + ' zombies, écart maxi ' + pire.toFixed(3) + ' m, ' + err + ' écarts'
  );
  T(
    'tourelles recopiées',
    G.tur.length === H.tur.length && G.tur.every((t, k) => t.slot === H.tur[k].slot && t.ty === H.tur[k].ty),
    G.tur.length + ' tourelles'
  );
}

// ---------------------------------------------------------------- jour 10 : ~1 600 zombies, le budget
let LOURD = null;
{
  const { A: HA, S: H } = hote(10, 26);
  LOURD = { HA, H };
  let pire = 0,
    tout = true;
  const inv = [
    { x: 40, y: 0, z: -40 },
    { x: -60, y: 0, z: 10 },
    { x: 0, y: 19.4, z: 0 }
  ];
  for (const max of [3000, 2500, 1500, 800, 400, 120, 60, 20, 5000, 9000]) {
    const G0 = HA.encodeInstantane(H, inv, max),
      l = JSON.stringify(G0).length;
    pire = Math.max(pire, l - max);
    if (l > max && G0 !== '') tout = false;
    if (G0 && !invite(G0).r) tout = false;
  }
  T('budget jamais dépassé (3000 → 20)', tout && pire <= 0, 'pire écart au budget ' + pire);
  const G0 = HA.encodeInstantane(H, inv, 3000),
    st = Object.assign({}, H.mStat);
  console.log(
    '     jour 10, ' + st.actifs + ' actifs, 3000 car. : ' + st.proches + ' proches + ' + st.lointains + ' lointains (' + st.car + ' car.)'
  );
  const { A: GA, S: G } = invite(G0);
  let fant = 0,
    err = 0,
    proches = 0;
  for (const i of actifs(G)) {
    if (G.z.fant[i]) {
      fant++;
      if (Math.abs(G.z.mx[i] - H.z.x[i]) > 0.51 || Math.abs(G.z.mz[i] - H.z.z[i]) > 0.51 || G.z.ty[i] !== H.z.ty[i]) err++;
    } else {
      proches++;
      if (Math.abs(G.z.mx[i] - H.z.x[i]) > 0.126 || G.z.st[i] !== H.z.st[i]) err++;
    }
  }
  T(
    'foule lointaine en fantômes',
    st.actifs > 1000 && fant === st.lointains && proches === st.proches && fant > 100 && err === 0,
    proches + ' proches, ' + fant + ' fantômes, ' + err + ' écarts'
  );
  // les proches sont bien les plus proches d'un joueur
  const dmin = i =>
    Math.min(
      ...[[H.p.x, H.p.y, H.p.z]]
        .concat(inv.map(q => [q.x, q.y, q.z]))
        .map(a => (H.z.x[i] - a[0]) ** 2 + (H.z.z[i] - a[2]) ** 2 + 4 * (H.z.y[i] - a[1]) ** 2)
    );
  let maxP = 0,
    minF = Infinity;
  for (const i of actifs(G)) {
    if (G.z.fant[i]) minF = Math.min(minF, dmin(i));
    else maxP = Math.max(maxP, dmin(i));
  }
  T(
    'les plus proches d’abord',
    maxP <= minF + 1e-6,
    'proche le plus loin ' + Math.sqrt(maxP).toFixed(1) + ' m, fantôme le plus près ' + Math.sqrt(minF).toFixed(1) + ' m'
  );
  T('budget minuscule : chaîne vide, ignorée', HA.encodeInstantane(H, [], 10) === '' && invite('').r === false);
  // les fantômes ne se touchent pas
  const f = actifs(G).find(i => G.z.fant[i]),
    n0 = G.mActions.length;
  T('un fantôme ne se touche pas', f !== undefined && GA.hurtZ(G, f, 50, 'p') === false && G.mActions.length === n0);
  LOURD.G0 = G0;
}

// ---------------------------------------------------------------- cloisons et planches de l'hôte
{
  const { A: HA, S: H } = hote(3, 5);
  for (const k of [3, 77, 300, 610, 1100]) HA.PANELS[k].dead = 1;
  HA.setPlanks(HA.DOORS[2], 4);
  HA.setPlanks(HA.DOORS[40], 1);
  const { A: GA, S: G } = invite(HA.encodeInstantane(H, [], 3000));
  for (let n = 0; n < 3; n++) GA.appliqueInstantane(G, HA.encodeInstantane(H, [], 3000));
  const morts = GA.PANELS.map((o, k) => (o.dead ? k : -1)).filter(k => k >= 0);
  T('cloisons cassées recopiées (en 4 instantanés)', morts.join() === '3,77,300,610,1100', morts.join(','));
  T('planches recopiées', GA.DOORS[2].planks === 4 && GA.DOORS[40].planks === 1 && G.plankVer > 0);
  // une planche posée par l'invité : l'hôte la cloue
  G.phase = 'day';
  GA.plankStep(G, 0.6, 5);
  const J = { vu: 0 };
  const n = HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T('planche d’un invité clouée par l’hôte', GA.DOORS[5].planks === 0 && n === 1 && HA.DOORS[5].planks === 1);
}

// ---------------------------------------------------------------- coups d'un invité
{
  const { A: HA, S: H } = hote(5, 20);
  const { A: GA, S: G } = invite(HA.encodeInstantane(H, [], 3000));
  const L = actifs(G).filter(i => !G.z.fant[i] && G.z.hp[i] > 30);
  const i = L[0],
    j = L[1],
    hp0 = H.z.hp[i];
  GA.hurtZ(G, i, 5.5, 'p');
  const a = G.mActions[G.mActions.length - 1];
  T(
    'le coup d’un invité devient une action h',
    a[0] === 'h' && a[2] === i && a[3] === (G.z.gen[i] & 15) && a[4] === 5.5,
    JSON.stringify(a)
  );
  T(
    'chez l’invité, rien de vrai : la vie baisse ici seulement',
    H.z.hp[i] === hp0 && Math.abs(G.z.hp[i] - (Math.min(hp0, G.z.hm[i]) - 5.5)) < H.z.hm[i] / 16 + 0.01
  );
  const J = { vu: 0 },
    n1 = HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T(
    'l’hôte applique le coup',
    n1 === 1 && Math.abs(H.z.hp[i] - (hp0 - 5.5)) < 1e-3,
    'vie ' + hp0.toFixed(1) + ' → ' + H.z.hp[i].toFixed(1)
  );
  T(
    'la même action n’est pas rejouée',
    HA.appliqueActions(H, J, GA.actionsInvite(G, 2000)) === 0 && Math.abs(H.z.hp[i] - (hp0 - 5.5)) < 1e-3
  );
  // un coup mortel : l'invité compte son tué et son argent ; l'hôte tue (cause 'p') sans se payer
  const k0 = G.runKills,
    c0 = G.save.cash,
    hk = H.kills,
    hrk = H.runKills,
    hc = H.save.cash,
    hl = H.left;
  H.ev.length = 0;
  GA.hurtZ(G, j, 1e5, 'p');
  T('invité : tué compté chez lui, zombie éteint', G.runKills === k0 + 1 && G.save.cash > c0 && G.z.st[j] === 0);
  HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T(
    'hôte : le coup tue (cause p), sans payer l’hôte',
    H.z.st[j] === 0 &&
      H.kills === hk + 1 &&
      H.left === hl - 1 &&
      H.runKills === hrk &&
      H.save.cash === hc &&
      !H.ev.some(e => e.k === 'pkill'),
    'tués ' + hk + ' → ' + H.kills
  );
  // mauvaise génération : la place a été reprise par un autre zombie
  const m = L[2],
    hpm = H.z.hp[m];
  GA.stepInvite(G, 1 / 30, inp(G));
  GA.hurtZ(G, m, 3, 'p');
  H.z.gen[m]++;
  HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T('mauvaise génération ignorée', H.z.hp[m] === hpm);
  // tué chez l'invité, encore vivant dans un instantané en retard : il reste éteint
  const q = L[3];
  GA.hurtZ(G, q, 1e5, 'p');
  GA.stepInvite(G, 1 / 30, inp(G));
  GA.appliqueInstantane(G, HA.encodeInstantane(H, [], 3000));
  T('tué ici, l’instantané en retard ne le ressuscite pas', G.z.st[q] === 0 && H.z.st[q] !== 0);
  // premier contact : on se cale sur ce qui est déjà là
  const J2 = {};
  T('premier contact : rien de rejoué', HA.appliqueActions(H, J2, GA.actionsInvite(G, 2000)) === 0 && J2.vu === G.mSeq);
  const J3 = {};
  HA.appliqueActions(H, J3, []);
  T('premier contact sans action : tout ce qui suit passe', J3.vu === 0);
  // publication : 8 au plus, sous le budget, par seq croissant
  for (let n = 0; n < 20; n++) {
    GA.stepInvite(G, 1 / 30, inp(G));
    GA.hurtZ(G, L[5 + (n % 5)], 0.1, 'p');
  }
  const P = GA.actionsInvite(G, 300);
  T(
    'actionsInvite : 8 au plus, sous le budget',
    P.length <= 8 &&
      P.length > 0 &&
      JSON.stringify(P).length <= 300 &&
      P.every((a, k) => !k || a[1] > P[k - 1][1]) &&
      P[P.length - 1][1] === G.mSeq,
    P.length + ' actions, ' + JSON.stringify(P).length + ' car.'
  );
  // données invalides : rien ne casse, rien ne change
  const e0 = emp(H);
  let plante = false;
  try {
    HA.appliqueActions(H, { vu: 0 }, [
      ['h', 1, 'x', null, 1e99, 3],
      ['c', 2, NaN, 'a', {}, 0, 0, 'zzz', 1],
      5,
      null,
      ['h', 3, -1, 0, 5, 0],
      ['h', 4, 99999, 0, 5, 0],
      ['h', 5, 1.5, 0, 5, 0],
      ['q', 6],
      ['l', 1e30],
      'h'
    ]);
    HA.appliqueActions(H, null, null);
    HA.appliqueActions(H, { vu: 0 }, 'abc');
  } catch (e) {
    plante = e.message;
  }
  T('actions invalides sans effet', !plante && emp(H) === e0, plante || '');
  const s0 = JSON.stringify([G.day, G.phase, G.city, G.nAct]);
  let mauvais = 0;
  for (const x of ['', 'A!b', 123, null, 'AAAA', 'B', 'é', 'x'.repeat(70000), 'AB-_9z'.repeat(40)])
    if (GA.appliqueInstantane(G, x)) mauvais++;
  let plante2 = false;
  try {
    for (let n = 0; n < 200; n++) {
      let s = 'B';
      for (let k = 0; k < 20 + n * 3; k++)
        s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[(n * 7919 + k * 104729) % 64];
      GA.appliqueInstantane(G, s);
    }
  } catch (e) {
    plante2 = e.message;
  }
  T(
    'instantanés invalides refusés, sans plantage',
    mauvais === 0 && JSON.stringify([G.day, G.phase, G.city, G.nAct]) === s0 && !plante2,
    plante2 || ''
  );
}

// ---------------------------------------------------------------- le pas de l'invité
{
  const { A: HA, S: H } = hote(5, 20);
  const { A: GA, S: G } = invite(HA.encodeInstantane(H, [], 3000));
  const n0 = G.nAct,
    ts = G.toSpawn;
  for (let t = 0; t < 1.5; t += 1 / 30) HA.step(H, 1 / 30, inp(H));
  GA.appliqueInstantane(G, HA.encodeInstantane(H, [], 3000));
  const L = actifs(G).filter(i => !G.z.fant[i]),
    d0 = L.reduce((s, i) => s + Math.hypot(G.z.mx[i] - G.z.x[i], G.z.mz[i] - G.z.z[i]), 0);
  for (let t = 0; t < 0.5; t += 1 / 30) GA.stepInvite(G, 1 / 30, inp(G));
  const d1 = L.reduce((s, i) => s + Math.hypot(G.z.mx[i] - G.z.x[i], G.z.mz[i] - G.z.z[i]), 0);
  T(
    'invité : aucun zombie ne sort, les siens glissent vers leur place',
    G.toSpawn === H.toSpawn && G.nAct <= n0 + 400 && d1 < d0 * 0.05,
    'écart total ' + d0.toFixed(1) + ' → ' + d1.toFixed(2) + ' m'
  );
  // ce que le pas de l'invité ne fait pas : la vraie sortie de la horde
  const t0 = G.toSpawn;
  for (let t = 0; t < 2; t += 1 / 30) GA.stepInvite(G, 1 / 30, inp(G));
  T('invité : la horde ne sort que chez l’hôte', G.toSpawn === t0 && ts >= t0);
  // morsure locale : un zombie de l'immeuble collé au joueur
  const i = L[0];
  Object.assign(G.p, { x: 2, y: GA.H, z: -9 });
  G.z.st[i] = 3;
  G.z.x[i] = G.z.mx[i] = 2.4;
  G.z.y[i] = G.z.my[i] = GA.H;
  G.z.z[i] = G.z.mz[i] = -9;
  const hp0 = G.p.hp;
  for (let t = 0; t < 1; t += 1 / 30) GA.stepInvite(G, 1 / 30, inp(G));
  T('invité : mordu par un zombie proche', G.p.hp < hp0, 'vie ' + hp0 + ' → ' + G.p.hp.toFixed(1));
  // fin de partie et jour tenu viennent de l'instantané
  G.ev.length = 0;
  const c0 = G.save.cash;
  H.phase = 'clear';
  GA.appliqueInstantane(G, HA.encodeInstantane(H, [], 3000));
  const clr = G.ev.find(e => e.k === 'clear');
  T('jour tenu chez l’invité, avec sa prime', G.phase === 'clear' && clr && clr.bonus > 0 && G.save.cash === c0 + clr.bonus);
  H.phase = 'dead';
  H.why = 'ville';
  GA.appliqueInstantane(G, HA.encodeInstantane(H, [], 3000));
  T('défaite chez l’invité', G.phase === 'dead' && G.why === 'ville' && G.p.dead && G.ev.some(e => e.k === 'dead'));
}

// ---------------------------------------------------------------- compétence, ultime, leurre, frappe d'un invité
{
  const { A: HA, S: H } = hote(5, 22, { hero: 'bois' });
  const { A: GA, S: G } = invite(HA.encodeInstantane(H, [], 3000), { hero: 'eau', arbre: true });
  // l'invité, au bord du toit nord, vise un zombie dans la rue
  const L = actifs(G).filter(i => !G.z.fant[i] && G.z.st[i] === 1 && G.z.y[i] < 0.5 && G.z.z[i] < -16);
  Object.assign(G.p, { x: 1, y: GA.H, z: -GA.B + 0.8 });
  const vise = i => {
    const e = GA.eyeP(G.p),
      dx = G.z.x[i] - e[0],
      dy = G.z.y[i] + 0.3 - e[1],
      dz = G.z.z[i] - e[2];
    G.p.yaw = Math.atan2(-dx, -dz);
    G.p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  };
  vise(L[0]);
  const hpG = actifs(G)
      .map(i => G.z.hp[i])
      .join(),
    touches = () => H.kills + actifs(H).filter(i => H.z.slow[i] >= 3).length,
    t0 = touches();
  G.hab = 0;
  const okC = GA.useHeroSkill(G);
  T(
    'invité : la compétence part en action c, rien d’exécuté ici',
    okC &&
      G.hab > 0 &&
      G.mActions[G.mActions.length - 1][0] === 'c' &&
      actifs(G)
        .map(i => G.z.hp[i])
        .join() === hpG
  );
  const p0 = H.p,
    pose0 = [p0.x, p0.y, p0.z, p0.yaw, p0.pitch].join(),
    avant = [H.hero, H.hab, H.ult, H.P, H.hm],
    J = { vu: 0 };
  H.ult = 0.37;
  avant[2] = 0.37;
  const n = HA.appliqueActions(H, J, GA.actionsInvite(G, 2000)),
    t1 = touches();
  const remis = () =>
    H.p === p0 &&
    [p0.x, p0.y, p0.z, p0.yaw, p0.pitch].join() === pose0 &&
    H.hero === avant[0] &&
    H.hab === avant[1] &&
    H.ult === avant[2] &&
    H.P === avant[3] &&
    H.hm === avant[4];
  T('hôte : la Marée de l’invité frappe depuis sa pose', n === 1 && t1 > t0, t1 - t0 + ' zombies tués ou ralentis');
  T('hôte : pose, héros, recharge, ultime remis', remis());
  // une erreur au milieu : tout est remis quand même
  const vrai = HA.ctx.useHeroSkill;
  HA.ctx.useHeroSkill = () => {
    throw new Error('exprès');
  };
  G.hab = 0;
  GA.useHeroSkill(G);
  const n2 = HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  HA.ctx.useHeroSkill = vrai;
  T('erreur pendant la compétence : tout est remis', n2 === 0 && remis());
  // l'ultime (Déluge : la ville soignée chez l'hôte)
  G.ult = 1;
  const okU = GA.useHeroUlt(G);
  H.city = 40;
  HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T(
    'ultime d’un invité exécuté chez l’hôte',
    okU && G.ult === 0 && H.flood > 0 && H.city > 40 && remis(),
    'Déluge ' + H.flood.toFixed(1) + ' s, ville 40 → ' + H.city.toFixed(0)
  );
  // leurre et frappe (l'arbre de l'invité les a, pas celui de l'hôte)
  G.leuCd = G.airCd = 0;
  G.p.pitch = -0.5;
  G.p.yaw = 0;
  const okL = GA.useLeurre(G),
    b0 = H.bombs.length;
  const okR = GA.useAir(G);
  HA.appliqueActions(H, J, GA.actionsInvite(G, 2000));
  T(
    'leurre d’un invité posé chez l’hôte',
    okL && !G.decoy && H.decoy && Math.abs(H.decoy.z - G.mActions.find(a => a[0] === 'l')[3]) < 1e-6
  );
  T('frappe d’un invité lancée chez l’hôte', okR && H.bombs.length === b0 + G.P.air.n && !G.bombs.length, H.bombs.length - b0 + ' bombes');
  T('l’hôte ne voit pas le voile ni les pièces de l’invité', !H.ev.some(e => e.k === 'hult' || e.k === 'pkill' || e.k === 'brasier0'));
}

// ---------------------------------------------------------------- horde ×1,5 à deux joueurs ; rien ne change à un joueur
{
  const a = hote(3, 10),
    b = hote(3, 10, { nj: 2 }),
    c = hote(3, 10, { nj: 3 });
  T(
    'horde ×1,5 à deux joueurs (total et cadence)',
    b.S.dayTotal === Math.round(a.S.dayTotal * 1.5) && Math.abs(b.S.spawned - 1.5 * a.S.spawned) <= 2 && c.S.dayTotal === a.S.dayTotal * 2,
    'total ' +
      a.S.dayTotal +
      ' → ' +
      b.S.dayTotal +
      ' (3 joueurs : ' +
      c.S.dayTotal +
      '), sortis en 10 s ' +
      a.S.spawned +
      ' → ' +
      b.S.spawned
  );
  // un hôte qui publie son instantané joue exactement la même partie
  const x = hote(6, 0, { arbre: true }),
    y = hote(6, 0, { arbre: true });
  y.S.nJoueurs = 1;
  y.S.invite = false;
  for (let k = 0; k < 600; k++) {
    for (const o of [x, y]) {
      o.S.p.yaw = Math.sin(k * 0.01) * 0.9;
      o.S.p.pitch = -0.5;
      o.A.step(o.S, 1 / 30, { f: 0, r: 0, yaw: o.S.p.yaw, pitch: o.S.p.pitch, fire: true });
      o.S.ev.length = 0;
    }
    if (k % 3 === 0) y.A.encodeInstantane(y.S, [{ x: 10, y: 0, z: 10 }], 3000);
  }
  T('publier l’instantané ne change pas la partie de l’hôte', emp(x.S) === emp(y.S), emp(x.S));
  const r = spawnSync('node', [path.join(__dirname, 'empreinte.js')], { cwd: RACINE, encoding: 'utf8' }),
    fin = (r.stdout || '').trim().split('\n').pop();
  T('empreinte inchangée à un joueur', fin === '7 OK, 0 ratés', fin.replace(' OK, ', ' OK · '));
}

// ---------------------------------------------------------------- reprise d'hôte
{
  const { HA, H, G0 } = LOURD;
  const { A: GA, S: G } = invite(G0, { hero: 'elec' });
  const fant = actifs(G).filter(i => G.z.fant[i]).length,
    n0 = G.nAct,
    k0 = G.kills,
    ts = G.toSpawn;
  const okR = GA.reprendHote(G);
  let mauvais = 0;
  for (const i of actifs(G)) {
    const z = G.z;
    if (z.fant[i] || !isFinite(z.x[i]) || z.x[i] !== z.mx[i] || z.road[i] >= 8 || !(z.hp[i] > 0)) mauvais++;
  }
  T(
    'reprise : les fantômes deviennent de vrais zombies',
    okR && !G.invite && fant > 100 && mauvais === 0,
    fant + ' fantômes repris, ' + n0 + ' zombies'
  );
  let plante = false;
  const x0 = actifs(G).map(i => G.z.x[i] + G.z.z[i]);
  try {
    for (let t = 0; t < 20; t += 1 / 30) {
      GA.step(G, 1 / 30, inp(G));
      G.ev.length = 0;
    }
  } catch (e) {
    plante = e.message;
  }
  let nan = 0;
  for (const i of actifs(G)) if (!isFinite(G.z.x[i] + G.z.y[i] + G.z.z[i] + G.z.hp[i])) nan++;
  T(
    'reprise : la partie continue chez le nouvel hôte',
    !plante && nan === 0 && G.escaped + G.kills > k0 && G.toSpawn < ts,
    plante || 'en 20 s : ' + (G.escaped - H.escaped) + ' fuyards, ' + (G.kills - k0) + ' tués (tourelles), ' + (ts - G.toSpawn) + ' sortis'
  );
  T('reprise refusée hors invité', GA.reprendHote(G) === false);
}

// ---------------------------------------------------------------- V4.4 : les trous comblés
{
  // 1. une cloison touchée par l'invité casse chez l'hôte (action 'm')
  const { A: HA, S: Hs } = hote(1, 1);
  const { A: IA, S: Is } = invite(HA.encodeInstantane(Hs, [], 3000));
  const o = IA.PANELS.find(q => q.destr && !q.dead);
  IA.wallDmg(Is, o, 1e4, (o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2, (o.z0 + o.z1) / 2);
  const am = Is.mActions.find(a => a[0] === 'm');
  const oh = HA.PANELS[o.pid],
    j = { id: 'inv1', heros: 'eau' };
  HA.appliqueActions(Hs, j, []);
  const n = HA.appliqueActions(Hs, j, IA.actionsInvite(Is, 2000));
  T(
    "cloison : le coup de l'invité part en action 'm' et casse chez l'hôte",
    !!am && am[2] === o.pid && n >= 1 && oh.dead,
    JSON.stringify(am)
  );

  // 2. les tués de la frappe d'un invité lui reviennent (S.mCredits), pas à l'hôte
  const { A: HA2, S: H2 } = hote(2, 25);
  const L = actifs(H2).filter(i => H2.z.y[i] < 0.5 && Math.hypot(H2.z.x[i], H2.z.z[i]) > 20);
  const cible = L[0];
  // (les tourelles de l'hôte tuent aussi pendant ce temps : chaque tué compte une fois, à l'hôte ou à l'invité)
  const rk = H2.runKills,
    k0 = H2.kills,
    j2 = { id: 'inv2', heros: 'feu' };
  HA2.appliqueActions(H2, j2, []);
  HA2.appliqueActions(H2, j2, [['r', 1, H2.z.x[cible], H2.z.z[cible], 8, 1e5]]);
  for (let t = 0; t < 4; t += 1 / 30) {
    HA2.step(H2, 1 / 30, inp(H2));
    H2.ev.length = 0;
  }
  const cr = (H2.mCredits || {}).inv2;
  T(
    "frappe d'un invité : ses tués à son compte, pas à l'hôte",
    cible !== undefined && cr && cr.k > 0 && cr.c > 0 && H2.kills - k0 === H2.runKills - rk + cr.k,
    JSON.stringify({ cr, rk: H2.runKills - rk, kills: H2.kills - k0 })
  );

  // 3. un zombie dans l'immeuble chasse l'invité le plus proche (S.mInvites → majCibles → mCible)
  const { A: HA3, S: H3 } = hote(7, 1);
  const Z = H3.z;
  for (const i of actifs(H3)) Z.st[i] = 0;
  H3.p.x = 0;
  H3.p.y = HA3.H;
  H3.p.z = -7;
  const lv = 2,
    y = HA3.LVY(lv);
  // un invité au 2e étage, côté ouest ; un zombie au même étage, entre les deux
  H3.mInvites = [{ id: 'inv3', x: -9, y, z: 3 }];
  HA3.spawnOne(H3, 0);
  const i = H3.act[H3.nAct - 1];
  Z.st[i] = 3;
  Z.lv[i] = lv;
  Z.inv[i] = 0;
  Z.x[i] = -4;
  Z.y[i] = y;
  Z.z[i] = 3;
  const d0 = Math.hypot(Z.x[i] + 9, Z.z[i] - 3);
  for (let t = 0; t < 2; t += 1 / 30) {
    HA3.step(H3, 1 / 30, inp(H3));
    H3.ev.length = 0;
  }
  const d1 = Z.st[i] ? Math.hypot(Z.x[i] + 9, Z.z[i] - 3) : -1;
  T(
    "immeuble : le zombie va vers l'invité de son étage",
    d1 >= 0 && d1 < d0 - 1 && H3.mCibles && H3.mCibles.length === 1,
    d0.toFixed(1) + ' → ' + d1.toFixed(1)
  );
  // sans invité, plus de cible
  H3.mInvites = [];
  HA3.step(H3, 1 / 30, inp(H3));
  T('sans invité : plus de cibles', H3.mCibles.length === 0);
}

// ---------------------------------------------------------------- V4.6 : chacun ses tourelles (avant : seules celles de l'hôte existaient)
{
  const A = charge();
  // codage du plan et des niveaux, et données invalides
  const plan = { 3: 'mo', 7: 'la', 12: 'mg' },
    lvI = { t_slot: 8, mo_unl: 1, mo_dmg: 5, la_unl: 1, mg_dmg: 3 };
  const pc = A.planCode(plan),
    pl = A.planLit(pc);
  T('plan : aller-retour fidèle', JSON.stringify(pl) === JSON.stringify(plan), pc);
  const nl = A.niveauxLit(A.niveauxCode(lvI));
  T('niveaux : aller-retour fidèle', nl.t_slot === 8 && nl.mo_unl === 1 && nl.mo_dmg === 5 && nl.fl_unl === 0);
  T(
    'plan ou niveaux mal formés : refusés',
    A.planLit('A') === null &&
      A.planLit('!!') === null &&
      A.planLit(42) === null &&
      A.planLit('_A') === null &&
      A.niveauxLit('zz') === null &&
      A.niveauxLit('-'.repeat(17)) === null
  );
  T('niveaux trop hauts : bornés au maximum de la case', A.niveauxLit('z'.repeat(17)).mg_dmg === A.NODES.find(n => n.id === 'mg_dmg').max);
  // l'hôte : 2 mitrailleuses (arbre vide : 2 tourelles, mitrailleuse seule) ; l'invité : 6 tourelles, dont mortiers et lasers débloqués
  const sH = { cash: 0, lv: { root: 1 }, layout: { 0: 'mg', 1: 'mg' }, mode: 'out', hero: 'feu', weap: 'fusil' };
  const S = A.newRun(sH, 3, 7);
  S.god = true;
  A.startDay(S);
  const libres = A.SLOTS.filter(s => s.k === 'toit' && s.id > 1 && A.slotOn(S.P, s, S.mode)).map(s => s.id);
  const planI = {
    0: 'mo',
    [libres[0]]: 'mo',
    [libres[1]]: 'la',
    [libres[2]]: 'mo',
    [libres[3]]: 'fl',
    [libres[4]]: 'la',
    [libres[5]]: 'mo'
  };
  const lvInv = { t_slot: 4, mo_unl: 1, la_unl: 1, mo_dmg: 6 }; // 6 tourelles ; pas de lance-flammes débloqué
  S.mTurInv = [{ id: 'inv1', plan: A.planLit(A.planCode(planI)), P: A.statsTourelles(A.niveauxLit(A.niveauxCode(lvInv))) }];
  A.buildTurrets(S);
  const aLui = S.tur.filter(t => t.own === 'inv1'),
    aHote = S.tur.filter(t => t.own === undefined);
  T("hôte : ses 2 tourelles d'abord, l'emplacement pris reste à lui", aHote.length === 2 && S.tur.find(t => t.slot === 0).ty === 'mg');
  T(
    "invité : ses tourelles posées (pas sur l'emplacement pris, pas le lance-flammes qu'il n'a pas)",
    aLui.length === 5 && !aLui.some(t => t.slot === 0 || t.ty === 'fl'),
    aLui.map(t => t.slot + t.ty).join(' ')
  );
  T('invité : ses chiffres à lui (mortier débloqué, ses dégâts)', aLui.every(t => t.PP && t.PP.mo.on) && aLui[0].PP.mo.dmg > S.P.mo.dmg);
  // la journée : les tourelles de l'invité tuent, et ces tués sont à son compte
  for (let t = 0; t < 40; t += 1 / 30) {
    A.step(S, 1 / 30, inp(S));
    S.ev.length = 0;
  }
  const cr = S.mCredits && S.mCredits.inv1;
  T('ses tourelles tuent pour lui (S.mCredits)', cr && cr.k > 0 && cr.c > 0, cr ? cr.k + ' tués, ' + Math.round(cr.c) + ' $' : 'rien');
  // l'instantané : l'invité voit toutes les tourelles, les siennes comprises
  const G = A.encodeInstantane(S, [{ x: 0, y: 0, z: 0 }], 24000),
    { S: I } = invite(G);
  T("l'invité reçoit toutes les tourelles (hôte + les siennes)", I.tur.length === S.tur.length, I.tur.length + ' / ' + S.tur.length);
  // chez l'invité, buildTurrets ne touche à rien (l'instantané fait foi)
  const n0 = I.tur.length;
  I.save.layout = {};
  A.buildTurrets.call(null, I);
  T("chez l'invité, buildTurrets ne change rien", I.tur.length === n0);
  // l'invité part : ses tourelles s'en vont
  S.mTurInv = [];
  A.buildTurrets(S);
  T("l'invité parti : ses tourelles s'en vont", S.tur.every(t => t.own === undefined) && S.tur.length === 2);
}
console.log(ok + ' OK, ' + ko + ' ratés');
process.exit(ko ? 1 : 0);
