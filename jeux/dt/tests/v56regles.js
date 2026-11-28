// V5.6 : les corrections du multi dans les règles (deux contextes vm, comme tests/multiregles.js) : Relance de l'Escarmoucheur chez l'invité,
// bouclier de la Répulsion pour les autres joueurs, élément choisi des sorts dans l'instantané (ajout facultatif, compatible, non fiable).
//   node tests/v56regles.js
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const RACINE = path.join(__dirname, '..'),
  SRC = fs.readFileSync(path.join(RACINE, 'regles.js'), 'utf8'),
  NOMS =
    'newRun,step,startDay,stepInvite,encodeInstantane,appliqueInstantane,appliqueActions,actionsInvite,useHeroSkill,useHeroUlt,' +
    'bouclier,bouclierMaree,bouclierAllie,ELKEYS,H,B,MAXZ,ZT,eyeP,boom,killZ,elH';
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
const inp = S => ({ f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
const save = hero => ({ cash: 0, lv: { root: 1 }, layout: {}, mode: 'out', hero, weap: 'fusil' });
function hote(jour, sec, hero) {
  const A = charge(),
    S = A.newRun(save(hero), jour, 99);
  S.god = true;
  A.startDay(S);
  for (let t = 0; t < sec; t += 1 / 30) {
    A.step(S, 1 / 30, inp(S));
    S.ev.length = 0;
  }
  return { A, S };
}
function invite(G, hero) {
  const A = charge(),
    S = A.newRun(save(hero), 1, 5);
  S.invite = true;
  if (G !== undefined) A.appliqueInstantane(S, G);
  return { A, S };
}
const actifs = S => {
  const L = [];
  for (let k = 0; k < S.nAct; k++) if (S.z.st[S.act[k]]) L.push(S.act[k]);
  return L;
};

// ---------------------------------------------------------------- 3. Relance de l'Escarmoucheur chez un invité
{
  const { A: HA, S: H } = hote(5, 22, 'bois');
  const { A: GA, S: G } = invite(HA.encodeInstantane(H, [], 3000), 'elec');
  G.voie = 'b';
  G.hm.spB2 = 1;
  const L = actifs(G).filter(i => !G.z.fant[i] && G.z.st[i] === 1 && G.z.y[i] < 0.5);
  T('il y a des zombies dehors chez l’invité', L.length > 0, L.length + ' zombies');
  const i = L[0];
  // le zombie juste devant le joueur, dans le couloir de la Fulgurance
  Object.assign(G.p, { x: 0, y: 0, z: -20, yaw: 0 });
  const mets = (hp, st) => {
    G.z.x[i] = G.z.mx[i] = 0;
    G.z.z[i] = G.z.mz[i] = -24;
    G.z.y[i] = G.z.my[i] = 0;
    G.z.hp[i] = hp;
    G.z.st[i] = st === undefined ? 1 : st;
  };
  mets(10);
  G.hab = 0;
  G.ev.length = 0;
  const cd = GA.useHeroSkill(G) && G.hab;
  T(
    'invité : un zombie meurt de la Fulgurance : recharge rendue (0,3 s)',
    Math.abs(G.hab - 0.3) < 1e-9 && G.ev.some(e => e.k === 'relance'),
    'hab ' + G.hab
  );
  mets(1e6);
  for (const j of actifs(G)) G.z.hp[j] = 1e6;
  Object.assign(G.p, { x: 0, y: 0, z: -20, yaw: 0 });
  G.hab = 0;
  G.ev.length = 0;
  GA.useHeroSkill(G);
  T(
    'invité : le zombie survit : recharge normale, pas de relance',
    G.hab > 1 && !G.ev.some(e => e.k === 'relance'),
    'hab ' + G.hab.toFixed(1)
  );
  // sans la case (spB2) ou sans la voie : jamais de relance
  mets(10);
  Object.assign(G.p, { x: 0, y: 0, z: -20, yaw: 0 });
  G.hm.spB2 = 0;
  G.hab = 0;
  GA.useHeroSkill(G);
  T('invité : sans la case Relance, recharge normale', G.hab > 1);
  // l'hôte qui rejoue la Fulgurance de cet invité n'en fait pas un événement chez lui
  G.hm.spB2 = 1;
  mets(10);
  Object.assign(G.p, { x: 0, y: 0, z: -20, yaw: 0 });
  G.hab = 0;
  G.mActions.length = 0;
  GA.useHeroSkill(G);
  H.ev.length = 0;
  const pre = { x: 0, y: 0, z: -24 };
  void pre;
  HA.appliqueActions(H, { vu: 0, id: 'g' }, GA.actionsInvite(G, 2000));
  T('hôte : la Relance de l’invité ne fait ni toast ni son chez l’hôte', !H.ev.some(e => e.k === 'relance' || e.k === 'bouclier'));
}

// ---------------------------------------------------------------- 2. bouclier de la Répulsion pour les autres
{
  const { A, S } = invite(undefined, 'eau');
  S.phase = 'day';
  S.voie = 'a';
  S.hm.spA2 = 1;
  Object.assign(S.p, { x: 0, y: 0, z: -10 });
  A.bouclierMaree(S, 0, 0, -10, 8);
  T(
    'lanceuse : bouclier de 30 et annonce [n°, x, y, z, rayon]',
    S.p.boucl === 30 && Array.isArray(S.mBouc) && S.mBouc.length === 5 && S.mBouc[0] === 1 && S.mBouc[4] === 8
  );
  A.bouclierMaree(S, 3, 0, -10, 8);
  T('lanceuse : le numéro de l’annonce augmente', S.mBouc[0] === 2 && S.mBouc[1] === 3);
  S.mOwn = 'x';
  const n = S.mBouc[0];
  A.bouclierMaree(S, 0, 0, 0, 8);
  S.mOwn = undefined;
  T('hôte qui rejoue le sort d’un invité : pas d’annonce', S.mBouc[0] === n);
  // un autre joueur
  const O = invite(undefined, 'feu');
  const E = O.S;
  E.phase = 'day';
  Object.assign(E.p, { x: 4, y: 0, z: -10 });
  E.p.boucl = 0;
  T('allié à 4 m : protégé (30, 10 s)', O.A.bouclierAllie(E, [1, 0, 0, -10, 8]) && E.p.boucl === 30 && E.p.boucT === 10);
  E.p.boucl = 0;
  Object.assign(E.p, { x: 12, y: 0, z: -10 });
  T('allié à 12 m : pas protégé', !O.A.bouclierAllie(E, [1, 0, 0, -10, 8]) && E.p.boucl === 0);
  Object.assign(E.p, { x: 4, y: 6, z: -10 });
  T('allié à un autre étage : pas protégé', !O.A.bouclierAllie(E, [1, 0, 0, -10, 8]) && E.p.boucl === 0);
  Object.assign(E.p, { x: 4, y: 0, z: -10 });
  E.p.down = 5;
  T('allié à terre : pas protégé', !O.A.bouclierAllie(E, [1, 0, 0, -10, 8]) && E.p.boucl === 0);
  E.p.down = 0;
  E.phase = 'prep';
  T('hors du jour : pas de bouclier', !O.A.bouclierAllie(E, [1, 0, 0, -10, 8]));
  E.phase = 'day';
  T('annonce absente : rien', !O.A.bouclierAllie(E, null));
}

// ---------------------------------------------------------------- 4. l'élément choisi des sorts dans l'instantané
{
  const { A: HA, S: H } = hote(5, 22, 'feu');
  H.p.x = 3;
  H.p.z = -10;
  const G0 = HA.encodeInstantane(H, [], 3000),
    SANS = invite(G0);
  T('sans élément choisi : pas d’extension (la chaîne est celle d’avant)', G0.length > 0 && SANS.S.thorns.every(o => !o.ec));
  // des effets avec un élément choisi, une explosion de sort, la pluie du Déluge
  H.thorns.push({ x: 5, z: -12, y: 0, r: 4, t: 4, dps: 22, pulse: 0, ec: 'feu' });
  H.guards.push({ x: -5, z: -12, t: 5, cd: 0, pw: 1, ec: 'eau' }, { x: -7, z: -12, t: 5, cd: 0, pw: 1 });
  H.storms.push({ x: 0, z: -30, y: 0, r: 10, t: 4, zap: 0, pw: 1, ec: 'vent' });
  H.ramparts.push({ id: 4, x: 8, z: -9, nx: 0, nz: 1, half: 4, t: 6, hp: 450, hp0: 450, ec: 'terre' });
  H.sortEl = 'elec';
  HA.boom(H, 6, 0, -14, 4, 0, 'p', 'B');
  H.sortEl = null;
  HA.boom(H, -6, 0, -14, 4, 0, 'p', 'b');
  H.flood = 5;
  H.floodEc = 'bois';
  const G1 = HA.encodeInstantane(H, [], 3000);
  T(
    'avec élément choisi : la chaîne reste dans l’alphabet et le budget',
    /^[A-Za-z0-9_-]*$/.test(G1) && G1.length <= 3000 && G1.length >= G0.length
  );
  const { A: GA, S: G } = invite(G1);
  const ec = L => L.map(o => String(o.ec || null)).join();
  T(
    'invité : ronciers, gardiens, orage, rempart gardent l’élément du lanceur',
    ec(G.thorns) === 'feu' && ec(G.guards) === 'eau,null' && ec(G.storms) === 'vent' && ec(G.ramparts) === 'terre',
    [ec(G.thorns), ec(G.guards), ec(G.storms), ec(G.ramparts)].join(' | ')
  );
  const bs = G.ev.filter(e => e.k === 'boom');
  T(
    'invité : les explosions des sorts portent l’élément (celle d’une balle : rien)',
    bs.length === 2 && bs.some(e => e.ec === 'elec' && e.kind === 'B') && bs.some(e => !e.ec && e.kind === 'b'),
    JSON.stringify(bs.map(e => [e.kind, e.ec]))
  );
  T('invité : la pluie du Déluge a l’élément du lanceur', G.flood > 0 && G.floodEc === 'bois');
  // l'instantané d'avant (sans extension) se lit comme avant ; les restes d'un format ancien ou abîmé n'empêchent pas la lecture
  H.thorns.length = H.guards.length = H.storms.length = H.ramparts.length = 0;
  H.mBooms.length = 0;
  H.flood = 0;
  const G2 = HA.encodeInstantane(H, [], 3000),
    I2 = invite(G2);
  T('sans élément : lu comme avant, floodEc vide', I2.S.floodEc === null && I2.S.flood === 0);
  const coupe = G1.slice(0, G1.length - 3),
    I3 = invite(undefined);
  T(
    'extension tronquée : l’instantané est lu, les éléments sont ignorés',
    I3.A.appliqueInstantane(I3.S, coupe) === true && I3.S.thorns.every(o => !o.ec)
  );
  // les zombies sont les mêmes avec ou sans extension
  const Z1 = actifs(G).length,
    Z2 = actifs(I2.S).length;
  T('mêmes zombies lus', Z1 === Z2 && Z1 > 0, Z1 + ' / ' + Z2);
  // petit budget : l'extension saute, le reste tient
  const Gp = HA.encodeInstantane(H, [], 400);
  T('budget serré : la chaîne tient', Gp.length <= 400);
  H.thorns.push({ x: 5, z: -12, y: 0, r: 4, t: 4, dps: 22, pulse: 0, ec: 'feu' });
  const Gq = HA.encodeInstantane(H, [], 400);
  T(
    'budget serré avec élément : la chaîne tient quand même',
    Gq.length <= 400 && invite(undefined).A.appliqueInstantane(invite(undefined).S, Gq) !== undefined
  );
}
console.log(ok + ' OK, ' + ko + ' ratés');
process.exit(ko ? 1 : 0);
