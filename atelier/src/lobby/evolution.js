// [lobby/evolution.js] Le renom et la seule progression : l'évolution de l'île (niveau du Hall), qui agrandit l'île.
// ---- le renom : un score. Tout ce qu'on accomplit en rapporte (artefacts, étoiles, records, bâtiments, héros, armes, défis). Il ne débloque rien.
if (!save.rec || typeof save.rec !== 'object') save.rec = {};
if (!Array.isArray(save.q)) save.q = [];
if (!Number.isFinite(save.qd)) save.qd = 0;
function renom() {
  const r = {
    art: LOOT.reduce((a, L) => a + (save.loot[L[0]] > 0 ? 25 + 3 * Math.min(10, save.loot[L[0]] - 1) : 0), 0),
    star: HEROS.filter(e => save.loot['etoile_' + e]).length * 20,
    rec:
      Math.round(Math.min(save.rec.normal || 0, BALN.waves) * 3.5) +
      (save.rec.hard || 0) * 4 +
      Math.min(save.rec.toit || 0, 10) * 7,
    bat: myVil().reduce((a, B) => a + (CAT[B.t].up ? 10 + 20 * (lvOf(B) - 1) : 0), 0),
    her: HEROS.reduce((a, e) => a + hLevel(e), 0) + 2 * Object.keys(WT).reduce((a, w) => a + wLevel(w), 0),
    def: save.qd * 10
  };
  r.tot = r.art + r.star + r.rec + r.bat + r.her + r.def;
  return r;
}
// ---- UNE SEULE PROGRESSION : l'évolution, c'est-à-dire le niveau du Hall des héros (1 à 6). Elle fixe la taille de l'île, l'ampleur du relief,
// le paysage (rivières, grotte, rochers flottants) et ce qu'on peut bâtir. Le renom n'est plus qu'un score : il ne débloque rien.
function mountH() {
  return MTH[Math.max(1, Math.min(6, save.evo || 1))];
}
function ilCheck() {
  if (VISIT.on) return;
  const L = Math.max(1, Math.min(6, Math.max(save.evo || 0, bLv('hall'))));
  if (L === save.evo && RI === ILR[L - 1] && MHc === mountH()) return;
  save.evo = L;
  MHc = mountH();
  terrSetR(ILR[L - 1]);
  terrLocks();
  vilGround();
  if (LB.on) LB.y = Math.max(LB.y, hAt(LB.x, LB.z));
  persist();
}
// ce que rapporte chaque bâtiment selon son niveau
const UPC = [0, 0, 400, 1000, 2500, 5000, 10000],
  bonus = t => Math.max(0, bLv(t) - 1);
function kHall() {
  return 1 + 0.1 * bonus('hall');
}
function kHome() {
  return 1 + 0.1 * bonus('maison');
}
function armesK() {
  return 1 - 0.1 * bonus('armes');
}
function shopK() {
  return 1 - 0.1 * bonus('marchand');
}
const MINEG = [0, 20, 40, 70, 110, 160, 220],
  mineG = () => MINEG[bLv('mine')],
  tavK = () => 1 + 0.25 * bonus('taverne');
const UPD = {
  hall: ['Éclats gagnés en partie', l => '+' + 10 * (l - 1) + ' %'],
  maison: ['Or céleste gagné en partie', l => '+' + 10 * (l - 1) + ' %'],
  musee: ['Chance de trouver du butin', l => '+' + 10 * (l - 1) + ' points'],
  armes: ["Prix dans l'arbre des armes", l => '−' + 10 * (l - 1) + ' %'],
  marchand: ['Prix du marchand', l => '−' + 10 * (l - 1) + ' %'],
  mine: ['Or céleste produit à chaque partie terminée', l => '+' + MINEG[l] + ' or'],
  taverne: ['Récompense des défis', l => '+' + 25 * (l - 1) + ' %'],
  verger: ['Provisions pour la prochaine partie', l => '+' + (10 + 5 * l) + ' PV']
};
