// tutoriel.js — le tutoriel léger de la première partie de chaque mode (jour 1) : une astuce à la fois en toast, répétée toutes
// les 5 s tant que son étape n'est pas faite (ok) ; et l'astuce des planches au jour 6 en mode fuite (une fois par partie).
// V4.2 : il se relance aussi à la demande (« Tuto pas à pas », dans la fiche des règles du Guide : regles.js) : tutoPossible, tutoStart.
// Utilise des règles : placedCount, INV_DAY, DOORS.

// ---------------------------------------------------------------- tutoriel léger (première partie)
// « Ils arrivent »
const TUTO = [
  { t: 'Glisse le pouce droit pour regarder, le gauche pour marcher.', ok: () => S.t > 4 },
  {
    t: 'Prends le Marteau (barre du bas), vise un cercle blanc, puis Action : tu poses une tourelle.',
    ok: () => placedCount(save) > 2 || S.phase !== 'prep'
  },
  { t: 'Quand tu es prêt : « Lancer le jour » en haut.', ok: () => S.phase !== 'prep' },
  { t: 'Ils arrivent par le nord. Tire au fusil. Va au bord du toit pour viser ceux qui grimpent !', ok: () => S.runKills > 25 },
  {
    t: "Le cabanon du toit mène à l'escalier : tous les étages se visitent. Mais si tu descends, ils entrent par les fenêtres…",
    ok: () => S.runKills > 60
  }
];
// « Ils s'échappent »
const TUTO_OUT = [
  { t: "Mode fuite : la horde va sortir de l'immeuble sous tes pieds et filer par les rues.", ok: () => S.t - tutoT0() > 5 },
  { t: 'Le premier jour, pas de tourelle : ton héros et ton arme. Touche « Lancer le jour ».', ok: () => S.phase !== 'prep' },
  { t: 'Abats-les avant le bout de la rue : chaque fuyard abîme la ville (jauge « Ville » en haut).', ok: () => S.runKills > 25 }
];
// tutoI : l'étape en cours (remise à 0 par newGame) ; tutoT : temps avant de répéter l'astuce
let tutoI = 0,
  tutoT = 0;
// V4.2 : tutoS : la partie où le tuto a été relancé à la demande (une autre partie l'oublie) ; tutoS0 : le moment de la relance
let tutoS = null,
  tutoS0 = 0;
const tutoT0 = () => (tutoS === S ? tutoS0 : 0);
// le tuto de cette partie : la première de son mode, ou relancé à la demande
const tutoPremiere = () => tutoS === S || (S.mode === 'out' ? (save.runsOut || 0) <= 1 : save.runs <= 1);
// le tuto est-il en train de défiler (une astuce reste à faire, jour 1) ?
const tutoEnCours = () => tutoPremiere() && tutoI < (S.mode === 'out' ? TUTO_OUT : TUTO).length && S.day <= 1;
// peut-on le relancer maintenant ? (mode fuite, jour 1 pas encore lancé, pas déjà en cours)
const tutoPossible = () => !!S && S.mode === 'out' && S.day === 1 && S.phase === 'prep' && !S.endless && !tutoEnCours();
// le relancer depuis sa première astuce
function tutoStart() {
  tutoS = S;
  tutoS0 = S.t;
  tutoI = 0;
  tutoT = 0;
}
function tutoTick(dt) {
  // mode fuite, à partir du jour 6 (ils envahissent les étages) : l'astuce des planches, une fois par partie
  if (S.mode === 'out' && S.day >= INV_DAY && S.phase === 'prep' && !S.toldPl && S.t > 0.8) {
    S.toldPl = 1;
    if (!DOORS.some(d => d.planks > 0)) toast('Marteau sur une porte : maintiens pour barricader', 4500);
  }
  const etapes = S.mode === 'out' ? TUTO_OUT : TUTO;
  if (!tutoPremiere() || tutoI >= etapes.length || S.day > 1) return;
  tutoT -= dt;
  if (etapes[tutoI].ok()) {
    tutoI++;
    tutoT = 0;
    return;
  }
  if (tutoT <= 0) {
    toast(etapes[tutoI].t, 4000);
    tutoT = 5;
  }
}
