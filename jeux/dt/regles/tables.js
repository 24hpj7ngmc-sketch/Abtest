// ===================== CONSTANTES ET TABLES : routes, types de zombies, journées, tourelles =====================
// Le nord est vers −Z (là où regarde le joueur au départ). « Ils arrivent » : les zombies arrivent par les routes, traversent la place,
// escaladent les façades (plus vite quand ils s'entassent), passent le parapet et foncent sur le joueur.
// « Ils s'échappent » : ils sortent de l'immeuble et fuient par les routes ; chaque fuyard abîme la ville.
// Fournit aux autres dossiers : PLAZA, ROADS, roadOpen, HELI, ZT, VARD, dayCount, INV_DAY, TT, TKEYS (affichage, interface) ; mkRng (tests).

// Repère (voir immeuble.js) : mètres, +Y en haut, immeuble centré sur l'origine, façades à x = ±B et z = ±B, toit à y = H.
// PAR : hauteur du parapet ; PLAZA : demi-largeur de la place (les routes y débouchent) ; EYE : hauteur des yeux du joueur ;
// WALLHALF : demi-largeur d'un mur d'avenue ; NFB : tranches de 1,5 m le long d'une façade (pour compter ceux qui s'entassent) ;
// CLK : l'escalade des façades garde la même durée qu'avec l'ancien immeuble (17,6 m)
const PAR = 0.8,
  PLAZA = 30,
  EYE = 1.62,
  WALLHALF = 7.5,
  NFB = Math.ceil((2 * B) / 1.5),
  CLK = H / 17.6;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// le hasard de la partie (S.rnd = mkRng(graine)) : même graine, même partie. Ne jamais changer le nombre ni l'ordre des tirages.
const mkRng = s => () => {
  s |= 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// les routes : quatre avenues (avec un mur possible à leur débouché) puis quatre ruelles en diagonale.
// n : nom ; day : jour où elle s'ouvre ; w : largeur ; a : bout de la route (loin) ; b : débouché sur la place ; wall : avenue (mur possible).
// Calculés au chargement : len, (dx, dz) direction de a vers b, (px, pz) direction en travers, faces : les façades qu'elle regarde.
const ROADS = [
  { n: 'Nord', day: 1, w: 12, a: [0, -88], b: [0, -PLAZA], wall: 1 },
  { n: 'Est', day: 2, w: 12, a: [88, 0], b: [PLAZA, 0], wall: 1 },
  { n: 'Sud', day: 3, w: 12, a: [0, 88], b: [0, PLAZA], wall: 1 },
  { n: 'Ouest', day: 4, w: 12, a: [-88, 0], b: [-PLAZA, 0], wall: 1 },
  { n: 'ruelle nord-est', day: 6, w: 5, a: [68, -68], b: [PLAZA, -PLAZA] },
  { n: 'ruelle sud-ouest', day: 7, w: 5, a: [-68, 68], b: [-PLAZA, PLAZA] },
  { n: 'ruelle sud-est', day: 8, w: 5, a: [68, 68], b: [PLAZA, PLAZA] },
  { n: 'ruelle nord-ouest', day: 9, w: 5, a: [-68, -68], b: [-PLAZA, -PLAZA] }
];
for (const r of ROADS) {
  const dx = r.b[0] - r.a[0],
    dz = r.b[1] - r.a[1],
    l = Math.hypot(dx, dz);
  r.len = l;
  r.dx = dx / l;
  r.dz = dz / l;
  r.px = -r.dz;
  r.pz = r.dx;
  r.faces = [0, 1, 2, 3].filter(f => FACES[f][0] * -r.dx + FACES[f][1] * -r.dz > 0.5);
}

// l'aire de l'hélicoptère, sur le toit
const HELI = [6.8, 6.8];

// les types de zombies (Z.ty = indice) : rôdeur (le gros de la horde), coureur, colosse, mastodonte (le chef des grosses journées), puis les variantes.
// hp : vie au jour 1 (× hpMul(jour)) ; sp : vitesse dehors (m/s, ±15 % au hasard) ; cl : vitesse d'escalade ; rs : vitesse dans l'immeuble ;
// dps : morsure (vie par seconde) ; cash : prime (×2 si c'est le joueur qui l'abat) ; sc : taille (1 = rôdeur) ; r : rayon (pour les touchers)
const ZT = [
  { n: 'Rôdeur', hp: 20, sp: 1.9, cl: 1, rs: 2.7, dps: 9, cash: 1, sc: 1, r: 0.42 },
  { n: 'Coureur', hp: 12, sp: 4.3, cl: 1.8, rs: 4.6, dps: 7, cash: 1, sc: 0.96, r: 0.38 },
  { n: 'Colosse', hp: 160, sp: 1.35, cl: 0.62, rs: 2.1, dps: 26, cash: 6, sc: 1.32, r: 0.62 },
  { n: 'Mastodonte', hp: 2400, sp: 1.15, cl: 0.52, rs: 1.9, dps: 70, cash: 150, sc: 2.25, r: 1.05 },
  // les variantes (mode fuite seulement) : 4 sprinteur, 5 casseur, 6 porteur, 7 hurleur
  { n: 'Sprinteur', hp: 10, sp: 6.3, cl: 2.2, rs: 5.5, dps: 6, cash: 2, sc: 0.95, r: 0.36 },
  { n: 'Casseur', hp: 90, sp: 1.75, cl: 0.8, rs: 2.4, dps: 18, cash: 5, sc: 1.12, r: 0.5 },
  { n: 'Porteur', hp: 55, sp: 2.3, cl: 0.9, rs: 3, dps: 8, cash: 30, sc: 1.02, r: 0.45 },
  { n: 'Hurleur', hp: 40, sp: 2.2, cl: 1, rs: 3, dps: 8, cash: 8, sc: 1, r: 0.42 }
];
// la phrase qui annonce la première variante de chaque sorte dans une partie (événement 'variant')
const VARD = {
  4: 'il fonce vers la sortie, abats-le vite',
  5: 'il arrache les planches, casse les cloisons et frappe fort',
  6: "il emporte un sac d'argent : abats-le avant qu'il s'échappe (gros butin)",
  7: 'son cri accélère les zombies autour de lui'
};
// ---------------------------------------------------------------- les journées
// DAYN : taille de la horde des jours 1 à 10 (dayCount : ×1,4 par jour ensuite) ; hpMul : vie ×1,3 par jour ; spawnDur : durée de la sortie
// de la horde (s) ; bossN : mastodontes du jour ; roadOpen : la route r est-elle ouverte au jour d
const DAYN = [0, 120, 240, 420, 700, 1100, 1700, 2600, 3900, 5800, 8500];
const dayCount = d => (d <= 10 ? DAYN[d] : Math.round(8500 * Math.pow(1.4, d - 10)));
const hpMul = d => Math.pow(1.3, d - 1);
const spawnDur = d => 28 + 9 * Math.min(d, 12);
const bossN = d => (d >= 10 ? 3 : d >= 8 ? 2 : d >= 5 ? 1 : 0);
const roadOpen = (r, d) => ROADS[r].day <= d;
// mode « Ils s'échappent » : à partir du jour 6, une part de ceux qui sortent du hall (invShare) envahissent les étages, sans dépasser
// l'étage invCap(jour) : le 2e au jour 6, le 3e au 7, le 4e au 8, le toit à partir du jour 9
const INV_DAY = 6,
  invShare = d => Math.min(0.2, 0.04 + 0.025 * (d - INV_DAY)),
  invCap = d => Math.min(NLV, d - 4);

// les types de tourelles (nom, couleur) ; leurs chiffres viennent de l'arbre (S.P.mg, S.P.la, S.P.mo, S.P.fl : voir derive)
const TT = {
  mg: { n: 'Mitrailleuse', c: '#ffcf5a' },
  la: { n: 'Laser', c: '#ff5a6e' },
  mo: { n: 'Mortier', c: '#b9c46a' },
  fl: { n: 'Lance-flammes', c: '#ff8a3d' }
};
const TKEYS = ['mg', 'la', 'mo', 'fl'];
// mode fuite : ce qu'un fuyard de chaque type coûte à la ville (+10 % par jour au-delà du 10e)
const ESC = [5, 4, 18, 60, 6, 10, 12, 6];
// les « gros » : colosse, mastodonte, et (V4.0) le casseur ; avant la V4.0, le test « ty >= 2 » rangeait aussi sprinteur, porteur et hurleur parmi les gros
// (l'Onde de choc ne faisait que les ralentir au lieu de les entraver, les Météores et le mortier les visaient en priorité)
const BIG = [0, 0, 1, 1, 0, 1, 0, 0];
const bigZ = ty => BIG[ty] === 1;
