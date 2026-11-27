// ===================== L'ARBRE D'AMÉLIORATIONS =====================
// NODES : les cases de l'arbre (on garde l'argent et les niveaux d'une partie à l'autre, dans save.lv) ; derive(save.lv) calcule une fois
// tout ce qu'elles changent (S.P : dégâts, cadences, portées, capacités…), au début d'une partie et à chaque achat.
// Fournit aux autres dossiers : NODES, NODE, nodeCost, START_DAYS, derive (interface : la carte de l'arbre, la boutique, le menu) ; bonusLobby (posé par interface/lobby.js).

// Une case : id (clé dans save.lv), n : nom, d : description, max : niveau maximum ; x, y : place sur la carte de l'arbre (1 = une case) ;
// req : la case qu'il faut avoir pour voir celle-ci ; c, g : prix du niveau 1, puis ×g à chaque niveau (nodeCost) ;
// b : branche (base, fusil, tour, spec = spéciaux, cap = capacités, vie = survie, eco = butin, imm = immeuble : la couleur sur la carte).
// Ce que fait chaque case est écrit dans derive (plus bas), pas ici.
const NODES = [
  {
    id: 'root',
    n: 'Survivant',
    d: "Seul sur le toit, un fusil et deux tourelles. Tiens dix jours : l'hélico viendra te chercher.",
    max: 1,
    c: 0,
    x: 0,
    y: 0,
    b: 'base'
  },
  // fusil
  { id: 'f_dmg', n: 'Calibre', d: 'Dégâts du fusil', max: 20, c: 8, g: 1.42, req: 'root', x: 0, y: -1.1, b: 'fusil' },
  { id: 'f_rate', n: 'Cadence', d: 'Tirs par seconde du fusil', max: 10, c: 20, g: 1.55, req: 'f_dmg', x: -0.85, y: -2, b: 'fusil' },
  { id: 'f_crit', n: 'Œil de lynx', d: 'Chance de coup critique (×2,5)', max: 8, c: 30, g: 1.6, req: 'f_dmg', x: 0.85, y: -2, b: 'fusil' },
  {
    id: 'f_pierce',
    n: 'Perforant',
    d: 'Chaque balle traverse un zombie de plus',
    max: 3,
    c: 250,
    g: 3.2,
    req: 'f_rate',
    x: -0.85,
    y: -3,
    b: 'fusil'
  },
  {
    id: 'f_exp',
    n: 'Balles explosives',
    d: 'Chaque impact explose autour de la cible',
    max: 5,
    c: 400,
    g: 2.2,
    req: 'f_crit',
    x: 0.85,
    y: -3,
    b: 'fusil'
  },
  // V4.7 (sa demande du 25/11 : « des améliorations d'arme fun ») : trois balles spéciales, pour toutes les armes à balles (mode fuite)
  {
    id: 'f_arc',
    n: 'Arc électrique',
    d: "Une balle sur cinq qui touche lance un éclair : il saute vers 2 zombies proches (+1 par niveau) (mode « Ils s'échappent »)",
    max: 4,
    c: 500,
    g: 2,
    req: 'f_dmg',
    x: 0,
    y: -3,
    b: 'fusil'
  },
  {
    id: 'f_rico',
    n: 'Ricochet',
    d: "Quand ta balle tue, elle rebondit sur le zombie le plus proche ; si elle le tue aussi, elle repart (1 rebond par niveau) (mode « Ils s'échappent »)",
    max: 3,
    c: 600,
    g: 2.4,
    req: 'f_pierce',
    x: -0.85,
    y: -4,
    b: 'fusil'
  },
  {
    id: 'f_feu',
    n: 'Balles incendiaires',
    d: "Chaque balle a 8 % de chances par niveau d'enflammer le zombie touché, et le feu gagne ses voisins (mode « Ils s'échappent »)",
    max: 5,
    c: 700,
    g: 1.9,
    req: 'f_exp',
    x: 0.85,
    y: -4,
    b: 'fusil'
  },
  // tourelles
  {
    id: 't_slot',
    n: 'Tourelle +1',
    d: 'Nombre de tourelles que tu peux poser',
    max: 10,
    c: 25,
    g: 1.7,
    req: 'root',
    x: 1.15,
    y: 0,
    b: 'tour'
  },
  { id: 'mg_dmg', n: 'Mitrailleuse', d: 'Dégâts des mitrailleuses', max: 20, c: 10, g: 1.42, req: 't_slot', x: 2.2, y: -1.5, b: 'tour' },
  { id: 'mg_rate', n: 'Cadence', d: 'Cadence des mitrailleuses', max: 8, c: 30, g: 1.6, req: 'mg_dmg', x: 3.2, y: -1.5, b: 'tour' },
  { id: 'mg_range', n: 'Portée', d: 'Portée des mitrailleuses', max: 4, c: 60, g: 1.8, req: 'mg_rate', x: 4.2, y: -1.5, b: 'tour' },
  {
    id: 'mg_twin',
    n: 'Double canon',
    d: 'Spécial : les mitrailleuses tirent deux fois plus',
    max: 1,
    c: 1500,
    req: 'mg_range',
    x: 5.2,
    y: -1.5,
    b: 'spec'
  },
  {
    id: 'la_unl',
    n: 'Laser',
    d: 'Débloque la tourelle laser : un rayon qui traverse tout ce qui est sur sa ligne',
    max: 1,
    c: 120,
    req: 't_slot',
    x: 2.2,
    y: -0.5,
    b: 'tour'
  },
  { id: 'la_dmg', n: 'Puissance', d: 'Dégâts des lasers', max: 20, c: 40, g: 1.42, req: 'la_unl', x: 3.2, y: -0.5, b: 'tour' },
  {
    id: 'la_ramp',
    n: 'Surchauffe',
    d: 'Le rayon chauffe : plus il reste sur une cible, plus il fait mal',
    max: 5,
    c: 150,
    g: 1.8,
    req: 'la_dmg',
    x: 4.2,
    y: -0.5,
    b: 'tour'
  },
  {
    id: 'la_prism',
    n: 'Prisme',
    d: 'Spécial : chaque laser tire un rayon de plus sur une autre cible',
    max: 2,
    c: 3000,
    g: 3,
    req: 'la_ramp',
    x: 5.2,
    y: -0.5,
    b: 'spec'
  },
  {
    id: 'mo_unl',
    n: 'Mortier',
    d: 'Débloque le mortier : un obus sur le plus gros paquet de zombies',
    max: 1,
    c: 300,
    req: 't_slot',
    x: 2.2,
    y: 0.5,
    b: 'tour'
  },
  { id: 'mo_dmg', n: 'Charge', d: 'Dégâts des mortiers', max: 20, c: 60, g: 1.42, req: 'mo_unl', x: 3.2, y: 0.5, b: 'tour' },
  { id: 'mo_rad', n: 'Rayon', d: "Rayon d'explosion des mortiers", max: 5, c: 200, g: 1.8, req: 'mo_dmg', x: 4.2, y: 0.5, b: 'tour' },
  {
    id: 'mo_frag',
    n: 'Fragmentation',
    d: "Spécial : l'obus lâche des sous-munitions autour de l'impact",
    max: 3,
    c: 2500,
    g: 2.5,
    req: 'mo_rad',
    x: 5.2,
    y: 0.5,
    b: 'spec'
  },
  {
    id: 'fl_unl',
    n: 'Lance-flammes',
    d: 'Débloque le lance-flammes : courte portée, il brûle tout un paquet',
    max: 1,
    c: 700,
    req: 't_slot',
    x: 2.2,
    y: 1.5,
    b: 'tour'
  },
  { id: 'fl_dmg', n: 'Pression', d: 'Dégâts des lance-flammes', max: 20, c: 100, g: 1.42, req: 'fl_unl', x: 3.2, y: 1.5, b: 'tour' },
  { id: 'fl_range', n: 'Longue flamme', d: 'Portée des lance-flammes', max: 4, c: 300, g: 1.9, req: 'fl_dmg', x: 4.2, y: 1.5, b: 'tour' },
  {
    id: 'fl_nap',
    n: 'Napalm',
    d: 'Spécial : les flammes laissent au sol un feu qui brûle ceux qui passent',
    max: 3,
    c: 4000,
    g: 2.4,
    req: 'fl_range',
    x: 5.2,
    y: 1.5,
    b: 'spec'
  },
  // capacités
  {
    id: 'a_mis',
    n: 'Missile',
    d: 'Compétence : un missile là où tu vises (double appui)',
    max: 1,
    c: 80,
    req: 'root',
    x: 0,
    y: 1.15,
    b: 'cap'
  },
  { id: 'a_mis_dmg', n: 'Ogive', d: 'Dégâts du missile', max: 10, c: 60, g: 1.5, req: 'a_mis', x: -0.55, y: 2.1, b: 'cap' },
  { id: 'a_mis_cd', n: 'Rechargement', d: 'Temps de recharge du missile', max: 5, c: 120, g: 1.8, req: 'a_mis', x: 0.55, y: 2.1, b: 'cap' },
  {
    id: 'a_leu',
    n: 'Leurre',
    d: 'Objet : un appât sonore qui attire la horde au sol',
    max: 1,
    c: 350,
    req: 'a_mis',
    x: -1.5,
    y: 2.45,
    b: 'cap'
  },
  { id: 'a_leu_dur', n: 'Pile neuve', d: 'Le leurre dure plus longtemps', max: 4, c: 150, g: 1.8, req: 'a_leu', x: -1.5, y: 3.4, b: 'cap' },
  {
    id: 'a_leu_boom',
    n: 'Leurre piégé',
    d: 'Spécial : le leurre explose à la fin',
    max: 1,
    c: 1200,
    req: 'a_leu_dur',
    x: -1.5,
    y: 4.35,
    b: 'spec'
  },
  {
    id: 'a_onde',
    n: 'Onde de choc',
    d: 'Ultime : décroche tout ce qui grimpe et balaie le toit (se charge en tuant)',
    max: 1,
    c: 600,
    req: 'a_mis',
    x: 0,
    y: 3.05,
    b: 'cap'
  },
  {
    id: 'a_onde_ch',
    n: 'Charge rapide',
    d: "L'onde se recharge avec moins de zombies tués",
    max: 5,
    c: 300,
    g: 1.8,
    req: 'a_onde',
    x: -0.55,
    y: 4,
    b: 'cap'
  },
  {
    id: 'a_onde_pw',
    n: 'Souffle',
    d: "Puissance et portée de l'onde au sol",
    max: 4,
    c: 500,
    g: 2,
    req: 'a_onde',
    x: 0.55,
    y: 4,
    b: 'cap'
  },
  {
    id: 'a_air',
    n: 'Frappe aérienne',
    d: 'Objet : une ligne de bombes le long de la rue que tu vises',
    max: 1,
    c: 2000,
    req: 'a_mis',
    x: 1.5,
    y: 2.45,
    b: 'cap'
  },
  { id: 'a_air_n', n: 'Escadrille', d: 'Plus de bombes, plus fortes', max: 4, c: 800, g: 2, req: 'a_air', x: 1.5, y: 3.4, b: 'cap' },
  // survie, butin, immeuble
  { id: 's_hp', n: 'Gilet', d: 'Points de vie', max: 10, c: 15, g: 1.55, req: 'root', x: -1.15, y: -0.6, b: 'vie' },
  {
    id: 's_reg',
    n: 'Bandages',
    d: 'Tu récupères des points de vie quand on te laisse tranquille',
    max: 6,
    c: 40,
    g: 1.7,
    req: 's_hp',
    x: -2.15,
    y: -1.2,
    b: 'vie'
  },
  {
    id: 's_arm',
    n: 'Blindage',
    d: 'Les coups des zombies font moins mal',
    max: 6,
    c: 60,
    g: 1.75,
    req: 's_hp',
    x: -2.15,
    y: -0.25,
    b: 'vie'
  },
  // V4.7 (sa demande du 25/11 : « sauter d'étage en étage gratuit de base, et la tyrolienne, elle est déblocable ») : l'escalade est
  // offerte, la tyrolienne prend sa place dans l'arbre (l'ancienne case m_grimpe est convertie au chargement : interface/sauvegarde.js)
  {
    id: 'm_tyro',
    n: 'Tyrolienne',
    d: "Au poteau du bord du toit, face au câble, Saut devient « Tyrolienne » : tu files vers la passerelle de l'avenue, et tu peux tirer en glissant (mode « Ils s'échappent »)",
    max: 1,
    c: 120,
    req: 's_hp',
    x: -2.15,
    y: -2.2,
    b: 'vie'
  },
  // V4.7 (sa demande du 25/11 : « un grappin ») : un outil de plus dans la barre
  {
    id: 'm_grap',
    n: 'Grappin',
    d: "Un outil de plus : vise une façade, un balcon, le toit, une passerelle ou la rue, et Action : le crochet te tire jusque-là (30 m). Niveau 2 : 45 m, plus vite, recharge plus courte (mode « Ils s'échappent »)",
    max: 2,
    c: 450,
    g: 2.2,
    req: 'm_tyro',
    x: -3.15,
    y: -2.2,
    b: 'vie'
  },
  {
    id: 'w_masse',
    n: 'Masse',
    d: "Arme : une masse pour cogner les zombies de près et casser les cloisons (mode « Ils s'échappent »)",
    max: 1,
    c: 150,
    req: 's_arm',
    x: -3.15,
    y: -0.7,
    b: 'vie'
  },
  {
    id: 'w_masse_pw',
    n: 'Masse lourde',
    d: 'Dégâts de la masse, sur les zombies et sur les murs',
    max: 6,
    c: 120,
    g: 1.8,
    req: 'w_masse',
    x: -4.15,
    y: -1.2,
    b: 'vie'
  },
  { id: 'w_masse_sp', n: 'Élan', d: 'La masse frappe plus vite', max: 4, c: 100, g: 1.8, req: 'w_masse', x: -4.15, y: -0.25, b: 'vie' },
  { id: 'e_cash', n: 'Prime', d: 'Argent gagné par zombie', max: 15, c: 30, g: 1.5, req: 'root', x: -1.15, y: 0.6, b: 'eco' },
  { id: 'e_day', n: 'Butin du jour', d: 'Prime de fin de journée', max: 5, c: 80, g: 1.9, req: 'e_cash', x: -2.15, y: 0.75, b: 'eco' },
  {
    id: 'e_start',
    n: 'Raccourci',
    d: "Commencer une partie plus loin (jour 3, puis 5, puis 7), si tu l'as déjà atteint",
    max: 3,
    c: 500,
    g: 5,
    req: 'e_day',
    x: -3.15,
    y: 0.75,
    b: 'eco'
  },
  {
    id: 'b_mur',
    n: 'Murs',
    d: "Ferme le bout des avenues par un mur : ils doivent l'escalader. 8 emplacements de tourelle dessus",
    max: 1,
    c: 800,
    req: 'root',
    x: -1.15,
    y: 1.7,
    b: 'imm'
  },
  {
    id: 'b_murh',
    n: 'Murs plus hauts',
    d: 'Les murs sont plus hauts : plus longs à escalader',
    max: 2,
    c: 1500,
    g: 2.5,
    req: 'b_mur',
    x: -2.15,
    y: 1.85,
    b: 'imm'
  },
  {
    id: 'b_barb',
    n: 'Barbelés',
    d: 'Le haut des façades blesse et ralentit ceux qui grimpent',
    max: 5,
    c: 250,
    g: 1.9,
    req: 'b_mur',
    x: -2.15,
    y: 2.85,
    b: 'imm'
  }
];
// NODE[id] : la case d'après son id
const NODE = {};
for (const n of NODES) NODE[n.id] = n;
// prix du niveau suivant d'une case n quand on en a déjà lv
const nodeCost = (n, lv) => (n.g ? Math.round(n.c * Math.pow(n.g, lv)) : n.c);
// jours de départ possibles (case Raccourci : 0 → jour 1 seulement, 1 → jour 3, 2 → jour 5, 3 → jour 7, si on l'a déjà atteint)
const START_DAYS = [1, 3, 5, 7];

// S.P : tout ce que l'arbre change, calculé une fois (au début d'une partie et à chaque achat) d'après les niveaux L (save.lv). Champs : r… le fusil (dégâts, cadence, critique,
// perforation, explosion) ; turrets : nombre de tourelles ; mg, la, mo, fl : les tourelles (on : débloquée) ; hp, regen, armor : survie
// (armor multiplie les coups reçus, et les dégâts à la ville) ; cash : prime ×… ; dayB : butin du jour ; grimpe, masse ; bal, mur, murH, barb :
// immeuble ; mis, onde, leu, air : capacités (mis et onde règlent aussi la compétence et l'ultime des héros).
// g(k) : niveau de la case k ; p124(k) : ×1,24 par niveau
function derive(L) {
  const g = k => L[k] || 0,
    p124 = k => Math.pow(1.24, g(k));
  const P = {
    rDmg: 10 * p124('f_dmg'),
    rRate: 4.5 * (1 + 0.12 * g('f_rate')),
    rCrit: 0.05 + 0.05 * g('f_crit'),
    rPierce: 1 + g('f_pierce'),
    rExp: g('f_exp') ? 0.15 + 0.15 * g('f_exp') : 0,
    rArc: g('f_arc') ? 1 + g('f_arc') : 0, // V4.7 : zombies touchés par l'éclair (0 : pas d'arc)
    rRico: g('f_rico'), // V4.7 : rebonds
    rFeu: 0.08 * g('f_feu'), // V4.7 : chance d'enflammer
    turrets: 2 + g('t_slot'),
    mg: { on: 1, dmg: 4 * p124('mg_dmg'), rate: 5 * (1 + 0.15 * g('mg_rate')) * (g('mg_twin') ? 2 : 1), range: 28 + 5 * g('mg_range') },
    la: { on: g('la_unl'), dps: 24 * p124('la_dmg'), ramp: 0.35 * g('la_ramp'), beams: 1 + g('la_prism'), range: 36 },
    mo: { on: g('mo_unl'), dmg: 34 * p124('mo_dmg'), rad: 3.2 + 0.55 * g('mo_rad'), frag: g('mo_frag'), reload: 2.3, rmin: 9, range: 62 },
    fl: { on: g('fl_unl'), dps: 20 * p124('fl_dmg'), range: 8.5 + 1.3 * g('fl_range'), nap: g('fl_nap') },
    hp: 100 + 25 * g('s_hp'),
    regen: g('s_reg') ? 2 + 2 * g('s_reg') : 0,
    armor: 1 - 0.07 * g('s_arm'),
    cash: Math.pow(1.12, g('e_cash')),
    dayB: 1 + 0.5 * g('e_day'),
    startLv: g('e_start'),
    grimpe: { on: 1, v: 5.5 }, // V4.7 : l'escalade est offerte
    tyro: { on: g('m_tyro') }, // V4.7 : la tyrolienne se débloque
    // V4.7 : le grappin (portée r, vitesse v de la traction, recharge cd)
    grap: { on: g('m_grap'), r: g('m_grap') >= 2 ? 45 : 30, v: g('m_grap') >= 2 ? 30 : 22, cd: g('m_grap') >= 2 ? 0.8 : 1.5 },
    masse: {
      on: g('w_masse'),
      dmg: 45 * Math.pow(1.3, g('w_masse_pw')),
      wall: 6 * (1 + 0.3 * g('w_masse_pw')),
      swing: 0.75 * (1 - 0.08 * g('w_masse_sp')),
      reach: 2.3
    },
    bal: 1,
    mur: g('b_mur'),
    murH: 2.6 + 0.9 * g('b_murh'),
    barb: g('b_barb') ? 6 * Math.pow(1.5, g('b_barb') - 1) : 0,
    mis: { on: g('a_mis'), dmg: 160 * Math.pow(1.3, g('a_mis_dmg')), cd: 22 - 2.6 * g('a_mis_cd'), r: 6.5 },
    onde: { on: g('a_onde'), need: 150 - 20 * g('a_onde_ch'), pw: 1 + 0.4 * g('a_onde_pw') },
    leu: { on: g('a_leu'), dur: 8 + 3 * g('a_leu_dur'), cd: 35, R: 34, boom: g('a_leu_boom') },
    air: { on: g('a_air'), n: 6 + 2 * g('a_air_n'), dmg: 100 * Math.pow(1.35, g('a_air_n')), cd: 55 }
  };
  if (bonusLobby) appliqueBonus(P, bonusLobby);
  return P;
}

// ---------------------------------------------------------------- les bonus du lobby (V4.1)
// Quand Dernier Toit est lancé depuis le lobby (voir LOBBY.md), l'interface pose ici les bonus que le joueur y a gagnés
// (arbre de l'arme, arbre du héros, préparatifs) ; null hors lobby : les parties restent exactement les mêmes.
// Ils s'ajoutent à l'arbre de l'immeuble, à chaque calcul de S.P (début de partie, achat à la boutique). Champs, tous facultatifs :
//   degats, cadence : ×, sur toutes les armes à feu ; critique : + chance de critique (0,05 = +5 points) ; vie : + points de vie ;
//   heroDegats : × la force de la compétence et de l'ultime du héros ; recharge : × le temps de recharge de la compétence
//   et le nombre de zombies à tuer pour charger l'ultime (0,9 = 10 % plus vite).
let bonusLobby = null;
const bonusNb = (v, def, min, max) => (typeof v === 'number' && isFinite(v) ? Math.min(max, Math.max(min, v)) : def);
function appliqueBonus(P, b) {
  P.rDmg *= bonusNb(b.degats, 1, 0.1, 20);
  P.rRate *= bonusNb(b.cadence, 1, 0.1, 5);
  P.rCrit += bonusNb(b.critique, 0, 0, 1);
  P.hp += Math.round(bonusNb(b.vie, 0, 0, 5000));
  const force = bonusNb(b.heroDegats, 1, 0.1, 20),
    recharge = bonusNb(b.recharge, 1, 0.2, 2);
  P.mis.dmg *= force;
  P.onde.pw *= force;
  P.mis.cd *= recharge;
}
// V4.2 : le rang (1 à 4) choisi au portail du lobby : la vie de tous les zombies est multipliée (mêmes chiffres que les niveaux de
// campagne de L'Île des Cinq), donc face à toutes les sources de dégâts (balles, héros, tourelles, frappe…). 1 hors lobby.
const RANGK = [1, 1.35, 1.8, 2.4];
let rangLobby = 1;
// V4.8 : l'élément de l'arme emportée, choisi au lobby (opts.elementArme) ; null hors lobby (l'élément choisi au menu, sinon celui du héros)
let elementArmeLobby = null;
// V4.9 : la voie du héros (opts.voie.id du lobby : 'a' ou 'b' ; null sans voie, et toujours hors lobby) ; voies.js
let voieLobby = null;
const rangK = () => RANGK[Math.max(1, Math.min(RANGK.length, Math.round(rangLobby) || 1)) - 1];
// V4.2 : l'arbre du héros (bonus.heros) et l'élément des balles (bonus.balles) venus du lobby, en valeurs brutes (celles du lobby :
// hSpd 0,06 par niveau = +6 % de marche, abRad en mètres…). Lus dans S.hm (newRun) ; 0 partout hors lobby, les parties restent les mêmes.
//   hSpd, hSprint : + vitesse de marche, de sprint (fraction) ; hJump : + hauteur de saut (fraction) ; uCharge : l'ultime se charge plus vite ;
//   pA : le passif du héros ; abRad, kDur, kWide, kLen, kHeal, uRad, uDur, uExtra : sa compétence et son ultime (voir heros.js) ;
//   eFireR, eBurn, eSlow, eWave, ePois, ePoisD, eKnock, eChain, eChainD : l'effet de ses balles (heroOnHit). Pas repris : kTrail, eArm.
// V4.8 : kPush, uDmg (Zéphyr), spA1, spA2, spB1, spB2 (les voies) ; ePierce, eLift (balles de Vent).
const HMK = [
    'hSpd',
    'hSprint',
    'hJump',
    'uCharge',
    'pA',
    'abRad',
    'kDur',
    'kWide',
    'kLen',
    'kHeal',
    'uRad',
    'uDur',
    'uExtra',
    'kPush',
    'uDmg',
    'spA1',
    'spA2',
    'spB1',
    'spB2'
  ],
  BMK = ['eFireR', 'eBurn', 'eSlow', 'eWave', 'ePois', 'ePoisD', 'eKnock', 'eChain', 'eChainD', 'ePierce', 'eLift'];
function heroMods() {
  const o = {},
    h = (bonusLobby && bonusLobby.heros) || {},
    b = (bonusLobby && bonusLobby.balles) || {};
  // (spA1 jusqu'à 100 : la vie du Colosse, +25 par niveau)
  for (const k of HMK) o[k] = bonusNb(h[k], 0, 0, k === 'spA1' ? 100 : 30);
  for (const k of BMK) o[k] = bonusNb(b[k], 0, 0, 30);
  // V4.9 : seules les cases de la voie jouée comptent
  if (voieLobby !== 'a') o.spA1 = o.spA2 = 0;
  if (voieLobby !== 'b') o.spB1 = o.spB2 = 0;
  return o;
}
