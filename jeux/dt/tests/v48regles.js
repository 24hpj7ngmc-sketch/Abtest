// V4.8 (demande du lobby, claude/demande-dernier-toit-roles-elements.md) : Zéphyr (le Tireur), l'élément de l'arme (opts.elementArme),
// les balles de Vent (traversent, soulèvent), la prédilection (+10 %), « Nature ». Les règles seules (sous Node, ≈ 2 s).
//                                                                                         node tests/v48regles.js
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'regles.js'), 'utf8'),
  NOMS =
    'newRun,step,startDay,HEROS,HKEYS,ELKEYS,ELNOM,ELFX,ZT,eyeP,viewDir,spawnOne,shoot,gridBuild,heroMods,useHeroSkill,useHeroUlt,' +
    'appliqueActions,hpMul,bigZ,setLobby';
function charge() {
  const c = { console };
  vm.createContext(c);
  // elementArmeLobby et bonusLobby sont des « let » des règles : un petit accès pour les tests
  vm.runInContext(SRC + ';function setLobby(el, b){ elementArmeLobby = el; bonusLobby = b || null; }' + ';this.A={' + NOMS + '};', c);
  return c.A;
}
let ok = 0,
  ko = 0;
const T = (n, b, x) => {
  b ? ok++ : ko++;
  console.log((b ? 'OK   ' : 'RATÉ ') + n + (x !== undefined ? ' — ' + x : ''));
};
const A = charge();
const partie = (hero, extra, jour) => {
  const S = A.newRun(
    Object.assign({ cash: 0, lv: { root: 1 }, layout: {}, mode: 'out', hero: hero, weap: 'fusil' }, extra || {}),
    jour || 2,
    5
  );
  S.god = true;
  return S;
};
const regarde = (S, q) => {
  const o = A.eyeP(S.p),
    dx = q[0] - o[0],
    dy = q[1] - o[1],
    dz = q[2] - o[2];
  S.p.yaw = Math.atan2(-dx, -dz);
  S.p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
};
// des zombies (type ty, 0 : rôdeur) en file sur l'axe x = 0, aux distances zs (z négatifs), le joueur à z0, dans la rue ; ils ne
// tombent pas (vie énorme), pas de critique
function file(hero, zs, o) {
  o = o || {};
  const S = partie(hero, o.save);
  A.startDay(S);
  S.toSpawn = 0;
  const Z = S.z,
    ids = [];
  for (const z of zs) {
    A.spawnOne(S);
    const i = S.act[S.nAct - 1];
    Z.st[i] = 1;
    Z.ty[i] = o.ty || 0;
    Z.x[i] = 0;
    Z.z[i] = z;
    Z.y[i] = 0;
    Z.hp[i] = 1e5;
    Z.root[i] = Z.slow[i] = Z.burn[i] = Z.psn[i] = 0;
    ids.push(i);
  }
  A.gridBuild(S);
  Object.assign(S.p, { x: 0, y: 0, z: o.z0 === undefined ? -18 : o.z0, ground: true });
  S.P.rCrit = -1;
  regarde(S, [0, 1.05 * A.ZT[o.ty || 0].sc, zs[0]]);
  S.ev.length = 0;
  return { S, ids };
}
const perte = (S, i) => 1e5 - S.z.hp[i];

// ---- les tableaux
T(
  'six héros, Zéphyr en sixième (Tireur, Bond, Tir perçant, #8fe6dc)',
  A.HKEYS.join() === 'feu,eau,bois,terre,elec,vent' &&
    A.HEROS.vent.n === 'Zéphyr' &&
    A.HEROS.vent.role === 'Tireur' &&
    A.HEROS.vent.sk === 'Bond' &&
    A.HEROS.vent.ul === 'Tir perçant' &&
    A.HEROS.vent.c === '#8fe6dc' &&
    A.HEROS.vent.cd === 14
);
T(
  'les rôles du contrat, « Nature » à la place de « Bois »',
  ['Mage', 'Support', 'Combattant', 'Tank', 'Assassin', 'Tireur'].join() === A.HKEYS.map(h => A.HEROS[h].role).join() &&
    A.HEROS.bois.el === 'Nature' &&
    A.ELNOM.bois === 'Nature' &&
    A.ELKEYS.every(e => A.ELFX[e])
);
{
  A.setLobby(null);
  const a = partie('vent'),
    b = partie('bois', { elArme: 'feu' });
  A.setLobby('eau');
  const c = partie('bois', { elArme: 'feu' });
  A.setLobby('rien');
  const d = partie('terre');
  A.setLobby(null);
  const e = A.newRun({ cash: 0, lv: { root: 1 }, layout: {}, mode: 'in', hero: 'feu', weap: 'fusil' }, 2, 5);
  T(
    "l'élément de l'arme : celui du héros, sinon celui du menu, et celui du lobby d'abord (rien en « Ils arrivent »)",
    a.elArme === 'vent' && b.elArme === 'feu' && c.elArme === 'eau' && d.elArme === 'terre' && e.elArme === null,
    [a.elArme, b.elArme, c.elArme, d.elArme, e.elArme].join(' ')
  );
}
{
  A.setLobby(null, { heros: { kPush: 1, uDmg: 0.5, spA1: 0.2 }, balles: { ePierce: 2, eLift: 0.8 } });
  const m = A.heroMods();
  A.setLobby(null);
  T(
    'les cases nouvelles du lobby sont lues (kPush, uDmg, ePierce, eLift ; spA1 seulement avec sa voie, V4.9)',
    m.kPush === 1 && m.uDmg === 0.5 && m.spA1 === 0 && m.ePierce === 2 && m.eLift === 0.8
  );
}

// ---- la prédilection et le passif de Zéphyr (de loin)
{
  const a = file('bois', [-30], { save: { elArme: 'bois' } }),
    b = file('bois', [-30], { save: { elArme: 'feu' } });
  A.shoot(a.S);
  A.shoot(b.S);
  const r = perte(a.S, a.ids[0]) / perte(b.S, b.ids[0]);
  T('prédilection : arme de son élément, +10 % de dégâts', Math.abs(r - 1.1) < 0.005, r.toFixed(3));
}
{
  const pres = file('vent', [-30], { z0: -18 }),
    loin = file('vent', [-60], { z0: -18 }),
    autre = file('eau', [-60], { z0: -18, save: { elArme: 'vent' } });
  A.shoot(pres.S);
  A.shoot(loin.S);
  A.shoot(autre.S);
  const r = perte(loin.S, loin.ids[0]) / perte(pres.S, pres.ids[0]),
    r2 = perte(autre.S, autre.ids[0]) / perte(pres.S, pres.ids[0]);
  T(
    'Zéphyr : +20 % au-delà de 30 m (pas Ondine avec une arme de Vent)',
    Math.abs(r - 1.2) < 0.005 && Math.abs(r2 - 1 / 1.1) < 0.005,
    r.toFixed(3) + ' · ' + r2.toFixed(3)
  );
}

// ---- les balles de Vent
{
  const zs = [-30, -33, -36, -39, -42],
    vent = file('vent', zs),
    feu = file('feu', zs);
  A.shoot(vent.S);
  A.shoot(feu.S);
  const nv = vent.ids.filter(i => perte(vent.S, i) > 0).length,
    nf = feu.ids.filter(i => perte(feu.S, i) > 0 && perte(feu.S, i) > 5).length;
  T('Vent : la balle traverse un zombie de plus que le Feu', nv === nf + 1, nv + ' contre ' + nf);
  T(
    'Vent : les petits touchés sont soulevés 0,6 s (immobiles), un événement « souleve » chacun',
    vent.ids.slice(0, nv).every(i => Math.abs(vent.S.z.root[i] - 0.6) < 1e-6) && vent.S.ev.filter(e => e.k === 'souleve').length === nv
  );
}
{
  A.setLobby(null, { balles: { ePierce: 2, eLift: 0.8 } });
  const zs = [-30, -33, -36, -39, -42, -45],
    v = file('vent', zs);
  A.setLobby(null);
  A.shoot(v.S);
  const n = v.ids.filter(i => perte(v.S, i) > 0).length;
  T(
    'ePierce 2 : deux de plus ; eLift 0,8 : soulevés 1,4 s',
    n === 4 && Math.abs(v.S.z.root[v.ids[0]] - 1.4) < 1e-5,
    n + ' touchés, ' + v.S.z.root[v.ids[0]]
  );
}
{
  const g = file('vent', [-30], { ty: 2 });
  A.shoot(g.S);
  T('Vent : un Colosse touché ne décolle pas', perte(g.S, g.ids[0]) > 0 && g.S.z.root[g.ids[0]] === 0);
}
{
  // Sylve avec une arme de Feu : les balles brûlent (l'arme) et empoisonnent (le passif de Sylve)
  const s = file('bois', [-30], { save: { elArme: 'feu' } });
  A.shoot(s.S);
  const i = s.ids[0];
  T("l'élément de l'arme plus celui du héros : Sylve et une arme de Feu brûlent et empoisonnent", s.S.z.burn[i] > 0 && s.S.z.psn[i] > 0);
  const r = file('terre', [-30], { save: { elArme: 'vent' } });
  A.shoot(r.S);
  T('Roc avec une arme de Vent : soulevé, pas de recul en plus', r.S.z.root[r.ids[0]] > 0 && Math.abs(r.S.z.z[r.ids[0]] + 30) < 1e-6);
}

// ---- le Bond
{
  const { S, ids } = file('vent', [-21, -40]);
  S.p.yaw = 0;
  S.p.pitch = 0;
  const z0 = S.p.z;
  const parti = A.useHeroSkill(S);
  T(
    'Bond : un bond en arrière de 8 m, recharge 14 s, petit saut',
    parti && Math.abs(S.p.z - z0 - 8) < 0.01 && Math.abs(S.hab - 14) < 0.01 && S.p.vy > 0 && S.ev.some(e => e.k === 'rafale'),
    'Δz ' + (S.p.z - z0).toFixed(2) + ' · ' + S.hab.toFixed(1) + ' s'
  );
  T('Bond sans kPush : personne repoussé', Math.abs(S.z.z[ids[0]] + 21) < 1e-6);
}
{
  A.setLobby(null, { heros: { kPush: 1, kLen: 4 } });
  const { S, ids } = file('vent', [-21, -40]);
  A.setLobby(null);
  S.p.yaw = 0;
  S.p.pitch = 0;
  const z0 = S.p.z;
  A.useHeroSkill(S);
  T(
    'Bond avec kPush et kLen 4 : 12 m, le zombie à 3 m repoussé de 5 m, pas celui de 22 m',
    Math.abs(S.p.z - z0 - 12) < 0.01 && Math.abs(S.z.z[ids[0]] + 26) < 0.01 && Math.abs(S.z.z[ids[1]] + 40) < 1e-6,
    (S.p.z - z0).toFixed(2) + ' · ' + S.z.z[ids[0]].toFixed(2)
  );
}
{
  const S = partie('vent');
  S.phase = 'prep';
  const a = A.useHeroSkill(S);
  const S2 = partie('feu');
  S2.phase = 'prep';
  T("Bond aussi entre deux jours (comme la Fulgurance), pas l'Orbe", a && !A.useHeroSkill(S2));
}

// ---- le Tir perçant
{
  // une file de zombies dans l'axe, un à côté (3 m) ; on vise le premier
  const { S, ids } = file('vent', [-30, -40, -60, -90]);
  A.spawnOne(S);
  const j = S.act[S.nAct - 1],
    Z = S.z;
  Z.st[j] = 1;
  Z.ty[j] = 0;
  Z.x[j] = 3;
  Z.z[j] = -40;
  Z.y[j] = 0;
  Z.hp[j] = 1e5;
  S.ult = 1;
  S.p.pitch = 0;
  const parti = A.useHeroUlt(S),
    attendu = 160 * S.P.onde.pw * A.hpMul(S.day);
  T(
    'Tir perçant : toute la file prend 160 × vie du jour, pas celui à 3 m de la ligne',
    parti && ids.every(i => Math.abs(perte(S, i) - attendu) < 0.5) && perte(S, j) === 0 && S.ev.some(e => e.k === 'percant') && S.ult === 0,
    ids.map(i => Math.round(perte(S, i))).join(' ') + ' · ' + Math.round(perte(S, j))
  );
}
{
  // à travers l'immeuble : le joueur sur le toit vise la rue de l'autre côté
  const S = partie('vent');
  A.startDay(S);
  S.toSpawn = 0;
  A.spawnOne(S);
  const i = S.act[S.nAct - 1],
    Z = S.z;
  Z.st[i] = 1;
  Z.ty[i] = 0;
  Z.x[i] = 0;
  Z.z[i] = 40;
  Z.y[i] = 0;
  Z.hp[i] = 1e5;
  Object.assign(S.p, { x: 0, y: 0, z: -40, ground: true });
  regarde(S, [0, 1, 40]);
  S.ult = 1;
  A.useHeroUlt(S);
  T("Tir perçant : les murs ne l'arrêtent pas (à travers l'immeuble)", perte(S, i) > 0);
}
{
  A.setLobby(null, { heros: { uDmg: 0.5, uRad: 2 } });
  const { S, ids } = file('vent', [-30]);
  A.setLobby(null);
  S.z.x[ids[0]] = 1.5;
  S.p.pitch = 0;
  S.ult = 1;
  A.useHeroUlt(S);
  const e = S.ev.find(q => q.k === 'percant');
  T(
    'uDmg 0,5 : +50 % ; uRad 2 : 3,5 m de large (touche à 1,5 m)',
    Math.abs(perte(S, ids[0]) - 240 * S.P.onde.pw * A.hpMul(S.day)) < 0.5 && e.w === 3.5,
    Math.round(perte(S, ids[0]))
  );
}

// ---- le multi : les cases de l'invité arrivent avec son ultime ; ses balles de Vent soulèvent chez l'hôte
{
  const { S, ids } = file('vent', [-30]);
  const joueur = { id: 'b', heros: 'vent', vu: 0 },
    p = S.p;
  p.pitch = 0;
  A.appliqueActions(S, joueur, [['u', 1, p.x, p.y, p.z, p.yaw, p.pitch, 'vent', 1, [0, 0, 0, 0, 0, 0, 0, 0, 1]]]);
  T(
    "l'ultime d'un invité, exécuté chez l'hôte avec ses cases (uDmg 1 : ×2)",
    Math.abs(perte(S, ids[0]) - 320 * A.hpMul(S.day)) < 0.5,
    Math.round(perte(S, ids[0]))
  );
  const z = S.z,
    i = ids[0];
  z.root[i] = 0;
  A.appliqueActions(S, joueur, [['h', 2, i, z.gen[i] & 15, 5, 8]]);
  T("le coup d'un invité marqué « soulevé » (8) : immobile 0,6 s chez l'hôte", Math.abs(z.root[i] - 0.6) < 1e-6);
}

console.log(ok + ' OK, ' + ko + ' ratés');
process.exit(ko ? 1 : 0);
