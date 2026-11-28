// [interface/armes.js] Les six armes : profils, arbres (Général, par mini-jeu, Élément des balles), ce qu'une arme apporte dans un jeu (armMods).
// ---------- un arbre par arme : amélioré à la salle d'armes, payé en or céleste, valable pour tous les héros ----------
// LES ARMES APPARTIENNENT AU JOUEUR : une arme se monte une fois, à la salle d'armes, et garde son arbre partout. Chaque mini-jeu accepte certaines armes :
// `games` liste les jeux où l'arme sert (identifiants de LGAMES, dans lobby/terrain.js). Une case qui n'a de sens que dans un jeu porte `only` (ajouté après la création).
// Pour une nouvelle arme : une entrée ici avec ses `games`. Pour un nouveau mini-jeu : l'ajouter aux `games` des armes qu'il accepte, et lire leurs cases avec armMods(jeu).
const WT = {
  pistolet: {
    title: 'Pistolet',
    short: 'Pistolet',
    vm: 'pistolet',
    base: {},
    kick: 1,
    zoom: 1.35,
    about: "L'arme de base : équilibrée, 51 m de portée.",
    games: ['ile', 'toit'],
    unit: 'or céleste',
    close: 'Retour',
    grow: true,
    lab: 2.9,
    br: {
      d: { a: -90, c: '#ffcf5a', n: 'Puissance' },
      c: { a: 0, c: '#7fd8ff', n: 'Cadence' },
      x: { a: 90, c: '#ff8fa3', n: 'Critique' },
      r: { a: 180, c: '#7ddc8a', n: 'Portée' }
    },
    nodes: [
      N(
        'd1',
        'd',
        1,
        0,
        null,
        'dmg',
        'Dégâts du tir',
        3,
        50,
        'hDmg',
        0.15,
        L => f(BAL.gun * (1 + 0.15 * L), 1) + ' dégâts par balle'
      ),
      N(
        'd2',
        'd',
        2,
        0,
        'd1',
        'pierce',
        'Tir perforant',
        1,
        250,
        'hPierce',
        1,
        L => (L ? 'traverse 1 ennemi' : 'ne traverse pas'),
        1
      ),
      N(
        'c1',
        'c',
        1,
        0,
        null,
        'cd',
        'Cadence de tir',
        3,
        60,
        'hCd',
        0.08,
        L => f(0.26 * (1 - 0.08 * L), 2) + ' s entre deux tirs'
      ),
      N(
        'x1',
        'x',
        1,
        0,
        null,
        'bolt',
        'Chance de coup critique',
        3,
        60,
        'hCrit',
        0.04,
        L => Math.round((BAL.crit + 0.04 * L) * 100) + ' % des tirs'
      ),
      N('x2', 'x', 2, 0, 'x1', 'dmg', 'Dégâts critiques', 2, 90, 'hCritD', 0.25, L => '×' + f(BAL.critK + 0.25 * L, 2)),
      N('r1', 'r', 1, 0, null, 'range', 'Portée du tir', 2, 50, 'hLife', 0.15, L => f(51 * (1 + 0.15 * L), 0) + ' m')
    ]
  }
};
// TROIS ARBRES PAR ARME : « Général » (WT[arme].nodes, vaut dans tous les mini-jeux), un arbre par mini-jeu qui accepte l'arme (WT[arme].gt[jeu]), et « Élément » (ET, plus bas).
// L'arbre de L'Île des Cinq : la Marque (case m1, venue de l'arbre général : même identifiant, la sauvegarde ne bouge pas), les boss, la prime. Ses cases se gardent avec les autres dans save.wl[arme].
const ileTree = (mk, mc, mb) => ({
  br: {
    m: { a: -90, c: '#c79bff', n: 'Marque' },
    b: { a: 30, c: '#ff8fa3', n: 'Boss' },
    g: { a: 150, c: '#ffcf5a', n: 'Butin' }
  },
  nodes: [
    N(
      'm1',
      'm',
      1,
      0,
      null,
      'rad',
      'Marque renforcée',
      2,
      mc,
      'hMark',
      mk,
      L => 'défenses +' + Math.round((BAL.markK + mb + mk * L) * 100) + ' % sur la cible marquée'
    ),
    N(
      'b1',
      'b',
      1,
      0,
      null,
      'dmg',
      'Tueur de boss',
      3,
      90,
      'hBoss',
      0.1,
      L => '+' + 10 * L + " % de dégâts de l'arme contre les boss"
    ),
    N(
      'g1',
      'g',
      1,
      0,
      null,
      'coin',
      'Prime de chasse',
      2,
      120,
      'hGold',
      1,
      L => '+' + L + " or par ennemi tué à l'arme"
    )
  ]
});
// L'arbre de Dernier Toit : trois cases qui ne comptent que derrière le deuxième portail ; elles partent dans les « bonus » passés au jeu (toitBonus, lobby/toit.js).
const toitTree = () => ({
  br: {
    a: { a: -90, c: '#ffcf5a', n: 'Calibre' },
    b: { a: 30, c: '#7fd8ff', n: 'Cadence' },
    c: { a: 150, c: '#ff8fa3', n: 'Critique' }
  },
  nodes: [
    N(
      'td',
      'a',
      1,
      0,
      null,
      'dmg',
      'Balles de survie',
      3,
      80,
      'tDmg',
      0.06,
      L => '+' + 6 * L + ' % de dégâts dans Dernier Toit'
    ),
    N(
      'tc',
      'b',
      1,
      0,
      null,
      'cd',
      'Doigt rapide',
      3,
      80,
      'tCd',
      0.04,
      L => '+' + 4 * L + ' % de cadence dans Dernier Toit'
    ),
    N(
      'tx',
      'c',
      1,
      0,
      null,
      'bolt',
      'Œil du toit',
      2,
      100,
      'tCrit',
      0.02,
      L => '+' + 2 * L + ' points de critique dans Dernier Toit'
    )
  ]
});
WT.pistolet.gt = { ile: ileTree(0.1, 80, 0), toit: toitTree() };
// Une arme = un profil de base (`base` : réglages ajoutés à ceux de ses cases ; le pistolet, sans profil, est la référence) + le même arbre à cinq branches, à ses propres valeurs.
// `vm` : son modèle en main (vm.<nom>, dans gfx/models/mains.js) ; `kick` : force du recul à l'écran ; `short` : son nom dans la barre d'outils.
const mkArm = (title, short, vm, kick, about, base, c) => {
  const B = k => base[k] || 0;
  return {
    title,
    short,
    vm,
    kick,
    about,
    base,
    games: ['ile', 'toit'],
    unit: 'or céleste',
    close: 'Retour',
    grow: true,
    lab: 2.9,
    br: WT.pistolet.br,
    gt: { ile: ileTree(c.m1[0], c.m1[1], B('hMark')), toit: toitTree() },
    nodes: [
      N(
        'd1',
        'd',
        1,
        0,
        null,
        'dmg',
        'Dégâts du tir',
        3,
        c.d1[1],
        'hDmg',
        c.d1[0],
        L => f(BAL.gun * (1 + B('hDmg') + c.d1[0] * L), 1) + ' dégâts par balle'
      ),
      N(
        'd2',
        'd',
        2,
        0,
        'd1',
        'pierce',
        'Tir perforant',
        1,
        c.d2,
        'hPierce',
        1,
        L => {
          const n = B('hPierce') + L;
          return n ? 'traverse ' + n + ' ennemi' + (n > 1 ? 's' : '') : 'ne traverse pas';
        },
        1
      ),
      N(
        'c1',
        'c',
        1,
        0,
        null,
        'cd',
        'Cadence de tir',
        3,
        c.c1[1],
        'hCd',
        c.c1[0],
        L => f(0.26 * (1 - B('hCd') - c.c1[0] * L), 2) + ' s entre deux tirs'
      ),
      N(
        'x1',
        'x',
        1,
        0,
        null,
        'bolt',
        'Chance de coup critique',
        3,
        c.x1[1],
        'hCrit',
        c.x1[0],
        L => Math.round((BAL.crit + B('hCrit') + c.x1[0] * L) * 100) + ' % des tirs'
      ),
      N(
        'x2',
        'x',
        2,
        0,
        'x1',
        'dmg',
        'Dégâts critiques',
        2,
        c.x2[1],
        'hCritD',
        c.x2[0],
        L => '×' + f(BAL.critK + B('hCritD') + c.x2[0] * L, 2)
      ),
      N(
        'r1',
        'r',
        1,
        0,
        null,
        'range',
        'Portée du tir',
        2,
        c.r1[1],
        'hLife',
        c.r1[0],
        L => f(51 * (1 + B('hLife') + c.r1[0] * L), 0) + ' m'
      )
    ]
  };
};
// fusil d'assaut : deux fois plus de balles, chacune plus légère, portée courte — pour faucher les meutes et marquer beaucoup de cibles
WT.assaut = mkArm(
  "Fusil d'assaut",
  'Assaut',
  'assaut',
  0.55,
  'Tire deux fois plus vite, des balles plus légères, à 41 m. Pour les meutes.',
  { hCd: 0.55, hDmg: -0.42, hLife: -0.2, hCrit: -0.04 },
  { d1: [0.08, 60], d2: 300, c1: [0.03, 70], x1: [0.03, 60], x2: [0.2, 90], m1: [0.08, 80], r1: [0.12, 50] }
);
WT.assaut.zoom = 1.5;
// fusil de sniper : un tir lourd toutes les 0,8 s, qui traverse un ennemi, à 100 m, souvent critique, et qui marque fort — pour les boss et les gros
WT.sniper = mkArm(
  'Fusil de sniper',
  'Sniper',
  'sniper',
  2.2,
  'Un tir lourd et lent qui traverse un ennemi, à 102 m. Pour les boss.',
  { hCd: -2.2, hDmg: 3.4, hLife: 1, hCrit: 0.13, hCritD: 0.5, hPierce: 1, hMark: 0.2 },
  { d1: [0.5, 70], d2: 350, c1: [0.2, 80], x1: [0.05, 70], x2: [0.5, 100], m1: [0.15, 90], r1: [0.2, 50] }
);
WT.sniper.zoom = 4;
WT.sniper.scope = true;
// LES TROIS AUTRES ARMES DE DERNIER TOIT (V10.1, « les mêmes armes de ce mini-jeu, partout ») : profils tirés des rapports de Dernier Toit, rapportés au pistolet (la référence d'ici). Premier jet.
// fusil : polyvalent — un peu moins fort que le pistolet, un peu plus rapide, presque la portée du sniper
WT.fusil = mkArm(
  'Fusil',
  'Fusil',
  'fusil',
  1,
  'Polyvalent : des balles un peu plus légères que le pistolet, plus rapides, à 96 m.',
  { hCd: 0.14, hDmg: -0.29, hLife: 0.875, hCrit: -0.05 },
  { d1: [0.11, 60], d2: 300, c1: [0.07, 70], x1: [0.04, 60], x2: [0.25, 90], m1: [0.1, 80], r1: [0.15, 50] }
);
WT.fusil.zoom = 1.5;
// fusil à pompe : huit plombs en gerbe (hPel, hSpread), lents à repartir ; pleins dégâts jusqu'à 6 m, 30 % en bout de portée
WT.pompe = mkArm(
  'Fusil à pompe',
  'Pompe',
  'pompe',
  2.4,
  'Huit plombs en gerbe, à 26 m : terrible de près, faible de loin, lent à recharger.',
  { hCd: -2.9, hDmg: -0.557, hLife: -0.5, hCrit: -0.05, hPel: 8, hSpread: 0.075 },
  { d1: [0.07, 70], d2: 350, c1: [0.25, 80], x1: [0.04, 70], x2: [0.25, 100], m1: [0.1, 90], r1: [0.08, 50] }
);
WT.pompe.zoom = 1.25;
// lance-flammes : un cône de feu (hFlame, hCone) à 8 m, douze tics par seconde, qui enflamme ; ni critique ni tir perforant : sa branche « Critique » devient « Brûlure »
WT.lance = mkArm(
  'Lance-flammes',
  'Flammes',
  'lance',
  0.12,
  "Un cône de feu à 8 m qui enflamme tout ce qu'il touche. Pas de coup critique.",
  { hCd: 0.68, hDmg: -0.73, hLife: -0.833, hCrit: -1, hFlame: 1, hCone: 0.38 },
  { d1: [0.04, 60], d2: 300, c1: [0.02, 70], x1: [0, 60], x2: [0, 90], m1: [0.08, 80], r1: [0.03, 50] }
);
WT.lance.zoom = 1.1;
WT.lance.br = Object.assign({}, WT.pistolet.br, { x: { a: 90, c: '#ff8a3c', n: 'Brûlure' } });
WT.lance.nodes = WT.lance.nodes
  .filter(n => n.b !== 'x' && n.id !== 'd2')
  .concat([
    N('x1', 'x', 1, 0, null, 'clock', 'Brûlure prolongée', 2, 80, 'hBurn', 1, L => f(2.5 + L, 1) + ' s de brûlure')
  ]); // zoom : grossissement en visée ; scope : lunette plein écran, et tenir Tir vise (le coup part au relâcher)
if (!save.wl || typeof save.wl !== 'object') save.wl = {};
for (const w in WT) if (!save.wl[w] || typeof save.wl[w] !== 'object') save.wl[w] = {};
// L'ÉLÉMENT DES BALLES (V9.0, revu en V12.1) : les balles prennent l'élément de l'arme (avant la V12.1 : celui du héros joué). Cet arbre le renforce, une branche par élément ;
// seule la branche de l'élément de l'arme agit en partie. Il est commun à toutes les armes (save.we), payé en or céleste. Roc n'avait aucun effet sur ses balles : ses deux cases en créent un.
const ET = {
  title: 'Élément des balles',
  unit: 'or céleste',
  close: 'Retour',
  grow: true,
  lab: 2.9,
  br: {
    feu: { a: -90, c: EL.feu.c, n: EL.feu.n },
    eau: { a: -30, c: EL.eau.c, n: EL.eau.n },
    bois: { a: 30, c: EL.bois.c, n: EL.bois.n },
    terre: { a: 90, c: EL.terre.c, n: EL.terre.n },
    elec: { a: 150, c: EL.elec.c, n: EL.elec.n },
    vent: { a: 210, c: EL.vent.c, n: EL.vent.n }
  },
  nodes: [
    N(
      'f1',
      'feu',
      1,
      0,
      null,
      'rad',
      'Balles explosives',
      3,
      70,
      'eFireR',
      0.7,
      L => 'explosion de ' + f(2.5 + 0.7 * L, 1) + ' m autour de la cible'
    ),
    N('f2', 'feu', 2, 0, 'f1', 'clock', 'Brûlure prolongée', 2, 90, 'eBurn', 1, L => 2 + L + ' s de brûlure'),
    N(
      'w1',
      'eau',
      1,
      0,
      null,
      'wave',
      'Balles glacées',
      3,
      70,
      'eSlow',
      0.6,
      L => 'ralentit ' + f(1.2 + 0.6 * L, 1) + ' s'
    ),
    N(
      'w2',
      'eau',
      2,
      0,
      'w1',
      'rad',
      'Vague de froid',
      1,
      220,
      'eWave',
      1,
      L => (L ? 'ralentit aussi à 2,5 m autour' : 'ne ralentit que la cible'),
      1
    ),
    N('b1', 'bois', 1, 0, null, 'clock', 'Poison tenace', 3, 70, 'ePois', 1, L => 2.5 + L + ' s de poison'),
    N(
      'b2',
      'bois',
      2,
      0,
      'b1',
      'dmg',
      'Poison virulent',
      2,
      90,
      'ePoisD',
      0.25,
      L => f(4 * (1 + 0.25 * L), 0) + ' dégâts par seconde'
    ),
    N('t1', 'terre', 1, 0, null, 'range', 'Balles lourdes', 3, 70, 'eKnock', 0.6, L =>
      L ? 'repoussent la cible de ' + f(0.6 * L, 1) + ' m' : 'ne repoussent pas'
    ),
    N(
      't2',
      'terre',
      2,
      0,
      't1',
      'pierce',
      'Perce-armure',
      1,
      220,
      'eArm',
      1,
      L => (L ? "ignorent l'armure" : "l'armure réduit les dégâts"),
      1
    ),
    N('e1', 'elec', 1, 0, null, 'bolt', 'Rebonds', 2, 110, 'eChain', 1, L => 1 + L + ' rebond' + (L ? 's' : '')),
    N(
      'e2',
      'elec',
      2,
      0,
      'e1',
      'dmg',
      'Rebonds puissants',
      2,
      90,
      'eChainD',
      0.15,
      L => Math.round((0.5 + 0.15 * L) * 100) + ' % des dégâts par rebond'
    ),
    N(
      'n1',
      'vent',
      1,
      0,
      null,
      'pierce',
      'Balles traversantes',
      3,
      70,
      'ePierce',
      1,
      L => 'traversent ' + (1 + L) + ' ennemis'
    ),
    N(
      'n2',
      'vent',
      2,
      0,
      'n1',
      'wave',
      'Soulèvement',
      2,
      90,
      'eLift',
      0.4,
      L => 'soulève les petits ennemis ' + f(0.6 + 0.4 * L, 1) + ' s'
    )
  ]
};
// L'ÉLÉMENT DE CHAQUE ARME : il se choisit à la salle d'armes ou au portail, arme par arme ; tant qu'on n'a rien choisi, l'arme prend l'élément choisi du héros joué (V12.9 ; sa clé tant qu'il n'a pas choisi).
if (!save.wel || typeof save.wel !== 'object') save.wel = {};
// l'ÉLÉMENT CHOISI D'UN HÉROS (save.hel[héros], vide = sa clé, donc une ancienne sauvegarde ne change rien). La clé reste son identité (kit, voies, rôle, nom, modèle, records) ;
// l'élément choisi sert partout où elle servait d'élément : couleurs, prédilection, élément par défaut des armes, branche d'élément. Gratuit, réversible.
if (!save.hel || typeof save.hel !== 'object') save.hel = {};
const elH = h => (HEROS.includes(save.hel[h]) ? save.hel[h] : HEROS.includes(h) ? h : 'feu');
function setHEl(h, e) {
  if (!HEROS.includes(h) || !HEROS.includes(e)) return;
  if (e === h) delete save.hel[h];
  else save.hel[h] = e;
  persist();
}
// la couleur d'un héros : celle de son élément choisi
const hc = h => elc(elH(h));
const wEl = (w, h) => (HEROS.includes(save.wel[w]) ? save.wel[w] : elH(h || tHero));
function setWEl(w, e) {
  if (!WT[w] || !HEROS.includes(e)) return;
  save.wel[w] = e;
  persist();
}
// la rangée de choix de l'élément d'une arme (salle d'armes et portails) : six pastilles, l'élément choisi du héros marqué d'une étoile
function welRow(id, w, redraw) {
  const cur = wEl(w);
  $(id).innerHTML =
    '<span>Son élément</span>' +
    HEROS.map(
      e =>
        `<button class="tchip${e === cur ? ' sel' : ''}" data-wel="${e}" style="border-color:${elc(e)};color:${elc(e)}">${EL[e].n}${e === elH(tHero) ? ' ★' : ''}</button>`
    ).join('');
  $(id)
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          setWEl(w, b.dataset.wel);
          redraw();
        })
    );
}
// la rangée « Son élément » d'un héros, au Hall : les six éléments en pastilles, le sien (sa clé) marqué d'une étoile
function helRow(id, h, redraw) {
  const cur = elH(h);
  $(id).innerHTML =
    '<span>Son élément</span>' +
    HEROS.map(
      e =>
        `<button class="tchip${e === cur ? ' sel' : ''}" data-hel="${e}" style="border-color:${elc(e)};color:${elc(e)}">${EL[e].n}${e === h ? ' ★' : ''}</button>`
    ).join('');
  $(id)
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          setHEl(h, b.dataset.hel);
          redraw();
        })
    );
}
if (!save.we || typeof save.we !== 'object') save.we = {};
const elMods = (el, m) => {
    for (const n of ET.nodes) if (n.b === el) m[n.key] = (m[n.key] || 0) + (save.we[n.id] || 0) * n.inc;
    return m;
  },
  eLevel = () => ET.nodes.reduce((a, n) => a + (save.we[n.id] || 0), 0);
const armNodes = w => Object.values(WT[w].gt || {}).reduce((a, t) => a.concat(t.nodes), WT[w].nodes.slice()); // toutes les cases d'une arme : générales + celles de chaque mini-jeu
let tWeap = WT[save.weap] ? save.weap : 'pistolet'; // l'arme en main : choisie au portail ou à la salle d'armes, gardée dans la sauvegarde
function setWeap(w) {
  if (!WT[w] || w === tWeap) return;
  tWeap = w;
  save.weap = w;
  persist();
}
const armsOf = g => Object.keys(WT).filter(w => WT[w].games.includes(g)),
  gameN = id => {
    const G = LGAMES.find(G => G.id === id);
    return G ? G.t : id;
  };
// les réglages qu'une arme apporte dans un jeu : toutes ses cases, sauf celles réservées à un autre jeu ; rien si le jeu n'accepte pas l'arme
function armMods(g, w, m) {
  m = m || {};
  if (!WT[w] || !WT[w].games.includes(g)) return m;
  for (const k in WT[w].base) m[k] = (m[k] || 0) + WT[w].base[k];
  for (const n of WT[w].nodes.concat(WT[w].gt && WT[w].gt[g] ? WT[w].gt[g].nodes : []))
    m[n.key] = (m[n.key] || 0) + (save.wl[w][n.id] || 0) * n.inc;
  return m;
}
const wLevel = w => armNodes(w).reduce((a, n) => a + (save.wl[w][n.id] || 0), 0);
// l'ancienne branche Tir des héros est rendue en éclats, une fois
if (!save.wmig) {
  const TC = { t1: 60, t2: 80, t3: 300, t4: 70 };
  for (const e of HEROS) {
    for (const k in TC) {
      const L = save.hl[e][k] || 0;
      if (L > 0) save.sh[e] += (TC[k] * L * (L + 1)) / 2;
      delete save.hl[e][k];
    }
  }
  save.wmig = 1;
}
const HT = {};
for (const e of HEROS) {
  const sp = HSPEC[e],
    nodes = TREES.hero.nodes.filter(n => n.b === 'v');
  for (const b of ['k', 'u', 'p'])
    sp[b].forEach((d, i) =>
      nodes.push(
        N(
          b + (i + 1),
          b,
          i + 1,
          0,
          i ? b + i : null,
          b === 'k' ? 'wave' : b === 'u' ? 'bolt' : 'stack',
          d[0],
          d[1],
          d[2],
          d[3],
          d[4],
          d[5],
          d[6]
        )
      )
    );
  HT[e] = {
    title: EL[e].hero,
    unit: 'éclats',
    close: 'Retour',
    grow: true,
    nodes,
    br: {
      k: { a: -90, c: '#7fd8ff', n: KIT[e].skill },
      u: { a: 0, c: '#ffb14a', n: KIT[e].ult },
      p: { a: 90, c: '#c79bff', n: 'Passif' },
      v: { a: 180, c: '#7ddc8a', n: 'Corps' },
      s: { a: 135, c: '#ff8fd0', n: 'Voie · niv. ' + VOIE_NIV }
    }
  };
  HT[e].base = nodes;
}
// LES SPÉCIALISATIONS : la voie choisie au Hall ajoute sa branche (deux cases) à l'arbre du héros. Changer de voie ne rembourse rien et ne fait rien perdre :
// les cases de l'autre voie restent dans la sauvegarde et reviennent avec elle. Le seuil se compte sur les cases de base, pour qu'une voie ouverte le reste.
if (!save.voie || typeof save.voie !== 'object') save.voie = {};
const hBase = e => HT[e].base.reduce((a, n) => a + (save.hl[e][n.id] || 0), 0),
  voieOf = e => ((save.voie[e] === 'a' || save.voie[e] === 'b') && hBase(e) >= VOIE_NIV ? save.voie[e] : null);
function voieApply(e) {
  const T = HT[e],
    v = voieOf(e);
  T.nodes = T.base.concat(
    v
      ? VOIES[e][v].c.map((d, i) =>
          N(
            's' + v + (i + 1),
            's',
            i + 1,
            0,
            i ? 's' + v + i : null,
            i ? 'dbl' : 'core',
            d[0],
            d[1],
            d[2],
            d[3],
            d[4],
            d[5],
            d[6]
          )
        )
      : []
  );
  T.br.s.n = v ? VOIES[e][v].n : 'Voie · niv. ' + VOIE_NIV;
}
function setVoie(e, v) {
  if (!VOIES[e] || !VOIES[e][v] || hBase(e) < VOIE_NIV) return false;
  save.voie[e] = v;
  persist();
  voieApply(e);
  return true;
}
for (const e of HEROS) voieApply(e);
let tHero = HEROS.includes(save.last) ? save.last : 'feu';
const hLevel = e =>
  Object.keys(save.hl[e]).reduce((a, k) => a + (HT[e].nodes.some(n => n.id === k) ? save.hl[e][k] : 0), 0);
function heroMods(el) {
  const m = {};
  for (const n of HT[el].nodes) m[n.key] = (save.hl[el][n.id] || 0) * n.inc;
  return elMods(elH(el), armMods('ile', tWeap, m));
} // L'Île des Cinq : l'arbre du héros + l'arme portée, si ce jeu l'accepte, + la branche de son élément
let tMode = 'hero',
  tSel = null;
let tTab = 'gen'; // l'arbre affiché à la salle d'armes : 'gen' (général), l'identifiant d'un mini-jeu, ou 'el' (élément)
const armTree = () => {
    const W = WT[tWeap],
      G = W.gt && W.gt[tTab];
    return tTab === 'el'
      ? ET
      : G
        ? Object.assign({ title: W.title, unit: W.unit, close: W.close, grow: true, lab: 2.9 }, G)
        : W;
  },
  armSave = () => (tTab === 'el' ? save.we : save.wl[tWeap]);
const tTree = () => (tMode === 'hero' ? HT[tHero] : armTree()),
  tLv = id => (tMode === 'hero' ? save.hl[tHero][id] : armSave()[id]) || 0,
  tCur = () => (tMode === 'hero' ? save.sh[tHero] : save.gold);
const tCost = (tr, n, L) => {
  const c = tr.grow ? n.cost * (L + 1) : n.cost;
  return tMode === 'arme' ? Math.round((c * armesK()) / 5) * 5 : c;
};
function tPos(tr, n, s, o) {
  const C = { x: 470, y: 320 };
  if (!n) return C;
  const a = (tr.br[n.b || n].a * Math.PI) / 180,
    dx = Math.cos(a),
    dy = Math.sin(a);
  s = s || n.s;
  o = o === undefined ? n.o : o;
  return { x: C.x + (dx * s * 92 - dy * o * 80) * 1.2, y: C.y + (dy * s * 92 + dx * o * 80) * 0.82 };
}
function drawTree() {
  const tr = tTree(),
    by = {};
  if (tMode === 'hero') {
    $('tTitle').textContent = tr.title + ' · niv. ' + hLevel(tHero);
    $('tHeroes')
      .querySelectorAll('.tchip')
      .forEach(b => b.classList.toggle('sel', b.dataset.e === tHero));
  }
  if (tMode === 'arme') {
    $('tTitle').textContent = tTab === 'el' ? tr.title + ' · niv. ' + eLevel() : tr.title + ' · niv. ' + wLevel(tWeap);
    // un rayon par portail : les armes que ce jeu accepte (une arme qui sert dans deux jeux est dans les deux rayons, avec le même arbre)
    const RY = [];
    for (const G of LGAMES) {
      const A = armsOf(G.id);
      if (!A.length) {
        if (G.open) RY.push({ t: G.t, A, n: 1 });
        continue;
      }
      const q = RY.find(q => q.k === A.join());
      if (q) {
        q.t += ' · ' + G.t;
        q.n++;
      } else RY.push({ k: A.join(), t: G.t, A, n: 1 });
    }
    const NG = LGAMES.filter(G => armsOf(G.id).length).length;
    $('tArms').innerHTML =
      RY.map(q =>
        q.A.length
          ? `<div class="ray"><span>${q.n > 1 && q.n === NG ? 'Partout' : q.t}</span>${q.A.map(w => `<button class="tchip${w === tWeap ? ' sel' : ''}" data-w="${w}">${wPic(w)}${WT[w].short} · ${q.A.length > 4 ? '' : 'niv. '}${wLevel(w)}</button>`).join('')}</div>`
          : `<div class="ray off"><span>${q.t}</span><em>aucune arme</em></div>`
      ).join('') +
      `<div class="ray tabs"><span>Arbre</span>${[['gen', 'Général']]
        .concat(
          WT[tWeap].games.filter(g => WT[tWeap].gt && WT[tWeap].gt[g]).map(g => [g, gameN(g)]),
          [['el', 'Élément · niv. ' + eLevel()]]
        )
        .map(a => `<button class="tchip${a[0] === tTab ? ' sel' : ''}" data-tab="${a[0]}">${a[1]}</button>`)
        .join('')}</div>` +
      (tTab === 'el' ? '<div class="ray" id="tWel"></div>' : ''); // les trois arbres de l'arme, et sous l'arbre d'élément le choix de l'élément de cette arme
    if (tTab === 'el') welRow('tWel', tWeap, drawTree);
    $('tArms')
      .querySelectorAll('.tchip:not([data-wel])')
      .forEach(
        b =>
          (b.onclick = () => {
            if (b.dataset.tab) {
              if (tTab === b.dataset.tab) return;
              tTab = b.dataset.tab;
              tSel = null;
              drawTree();
              return;
            }
            if (tWeap === b.dataset.w) return;
            setWeap(b.dataset.w);
            if (tTab !== 'el' && !(WT[tWeap].gt && WT[tWeap].gt[tTab])) tTab = 'gen';
            tSel = null;
            $('tUnit').textContent = tTree().unit;
            drawTree();
          })
      );
  } // l'arme qu'on regarde devient l'arme en main
  tr.nodes.forEach(n => (by[n.id] = n));
  let svg = '',
    html = `<div class="tn root" style="left:470px;top:320px;--c:#7ff3ff">${ico('core')}</div>`;
  for (const n of tr.nodes) {
    const a = tPos(tr, n.p ? by[n.p] : null),
      b = tPos(tr, n),
      L = tLv(n.id),
      open = !n.p || tLv(n.p) > 0,
      c = tr.br[n.b].c;
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${L > 0 ? c : '#33464f'}" stroke-width="3"/>`;
    let pips = '';
    for (let i = 0; i < n.max; i++) pips += `<i class="${i < L ? 'on' : ''}"></i>`;
    html += `<button class="tn${n.cap ? ' cap' : ''}${open ? '' : ' lock'}${L > 0 ? ' own' : ''}${L >= n.max ? ' max' : ''}${tSel === n.id ? ' sel' : ''}" data-id="${n.id}" aria-label="${n.n}" style="left:${b.x}px;top:${b.y}px;--c:${c}">${ico(n.k)}<span class="pips">${pips}</span>${n.only ? `<em class="tb">${(LGAMES.find(G => G.id === n.only) || {}).tag || ''}</em>` : ''}</button>`;
  }
  for (const k in tr.br) {
    const p = tPos(tr, k, tr.lab || 3.85, 0);
    html += `<div class="tl" style="left:${p.x}px;top:${p.y}px;--c:${tr.br[k].c}">${tr.br[k].n}</div>`;
  }
  $('tMap').innerHTML = `<svg viewBox="0 0 940 640">${svg}</svg>` + html;
  $('tMap')
    .querySelectorAll('button.tn')
    .forEach(
      b =>
        (b.onclick = () => {
          tSel = b.dataset.id;
          drawTree();
        })
    );
  $('tSh').textContent = tCur();
  const n = by[tSel],
    el = $('tInfo');
  if (!n) {
    el.innerHTML =
      `<div class="ti-h">Touche une case pour voir son effet. Fais glisser pour parcourir la grille.</div>` +
      (tMode !== 'arme'
        ? ''
        : tTab === 'el'
          ? `<div class="ti-n">Élément des balles · ${WT[tWeap].short} : ${EL[wEl(tWeap)].n}</div><div class="ti-h">Chaque arme a son élément : tu le choisis ici (« Son élément ») ou au portail. En partie, seule la branche de cet élément agit. L'étoile marque l'élément choisi de ${EL[tHero].hero} (${EL[elH(tHero)].n}), qui donne +10 % aux armes du même élément.</div><div class="ti-h">Ce que tu montes ici vaut pour toutes tes armes. Tant qu'un jeu n'a pas été mis à jour, ses balles suivent encore l'élément du héros.</div>`
          : tTab !== 'gen'
            ? `<div class="ti-n">${WT[tWeap].title} · ${gameN(tTab)}</div><div class="ti-h">Ces améliorations ne servent que dans ${gameN(tTab)}.</div>`
            : `<div class="ti-n">${tr.title} · en main</div><div class="ti-h">${tr.about}</div><div class="ti-h">Cette arme sert dans : ${tr.games.map(gameN).join(', ')}. L'arbre général vaut partout où elle sert.</div>`);
    return;
  }
  const L = tLv(n.id),
    mx = L >= n.max,
    cost = tCost(tr, n, L),
    open = !n.p || tLv(n.p) > 0,
    cur = tCur();
  const why = mx
    ? 'Niveau maximum atteint.'
    : !open
      ? "Débloque d'abord : " + by[n.p].n + '.'
      : cur < cost
        ? 'Il te manque ' + (cost - cur) + ' ' + tr.unit + '.'
        : '';
  el.innerHTML =
    `<div class="ti-n">${n.n}</div><div class="ti-v">${mx ? n.v(L) : n.v(L) + ' > ' + n.v(L + 1)}</div><div class="ti-r"><span>${mx ? '' : cost + ' ' + tr.unit}</span><span>${L} / ${n.max}</span></div>` +
    (n.only ? `<div class="ti-h">Ne sert que dans ${gameN(n.only)}.</div>` : '') +
    (why ? `<div class="ti-h">${why}</div>` : `<button class="solid" id="tBuy">Acheter · définitif</button>`);
  if (!why)
    $('tBuy').onclick = () => {
      if (tMode === 'hero') {
        save.sh[tHero] -= cost;
        save.hl[tHero][n.id] = L + 1;
        persist();
        syncHeroes();
      } else {
        save.gold -= cost;
        armSave()[n.id] = L + 1;
        persist();
        SND.play('coin');
      }
      drawTree();
    };
}
function openTree(mode) {
  tMode = mode;
  tSel = null;
  if (mode === 'arme') tTab = 'gen';
  $('tree').classList.toggle('arme', mode === 'arme'); // à la salle d'armes le titre est caché : l'arme et l'arbre choisis se lisent sur les pastilles
  const tr = tTree();
  $('tHeroes').hidden = mode !== 'hero';
  $('tArms').hidden = mode !== 'arme';
  $('tTitle').textContent = tr.title;
  $('tUnit').textContent = tr.unit;
  $('tClose').textContent = tr.close;
  $('tree').hidden = false;
  treeBack = !$('start').hidden ? 'start' : !$('toitV').hidden ? 'toitV' : '';
  $('start').hidden = $('toitV').hidden = true;
  $('end').hidden = true;
  drawTree();
  const sc = $('tScroll');
  sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  sc.scrollTop = (sc.scrollHeight - sc.clientHeight) / 2;
}
let treeBack = '';
$('tClose').onclick = () => {
  $('tree').hidden = true;
  syncHeroes();
  lobSync();
  if (treeBack === 'toitV') toitDraw();
  if (treeBack) $(treeBack).hidden = false;
};
$('tHeroes').innerHTML = HEROS.map(
  e =>
    `<button class="tchip" data-e="${e}" style="border-color:${elc(elH(e))};color:${elc(elH(e))}">${EL[e].hero}</button>`
).join('');
$('tHeroes')
  .querySelectorAll('.tchip')
  .forEach(
    b =>
      (b.onclick = () => {
        tHero = b.dataset.e;
        save.last = tHero;
        persist();
        tSel = null;
        drawTree();
      })
  );
$('sTree').onclick = $('dtTree').onclick = () => openTree('hero');
