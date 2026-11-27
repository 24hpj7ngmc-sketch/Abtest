// ===================== DERNIER TOIT : l'interface =====================
// sauvegarde.js — la sauvegarde (localStorage), trois petits outils de page et l'état partagé de l'interface.
// Premier fichier collé : `$` et `save` doivent exister avant les sons (sons/ lit `save.snd` dès le chargement).
// Fournit aux autres dossiers : `save` (lu et écrit par les règles : argent, meilleurs jours, plan des tourelles ;
// lu par l'affichage et les sons).
// Utilise : rien (le navigateur seulement).

// raccourci : l'élément de la page qui porte cet id
const $ = id => document.getElementById(id);

// ---------------------------------------------------------------- la sauvegarde
// Une seule clé dans le localStorage du navigateur (chaque page publiée a donc la sienne). Champs :
//   cash (argent), lv (niveaux de l'arbre, { root: 1, f_dmg: 2… }), layout (plan des tourelles : numéro d'emplacement → type),
//   best / bestF (meilleur jour « Ils arrivent » / « Ils s'échappent »), bestEnd (meilleur jour sans fin),
//   runs / runsOut (parties lancées, dont en mode fuite), kills, won (sauvetages), endlessRun (la partie en cours est sans fin),
//   mode ('in' | 'out'), hero, weap (arme), stage ('eau1'…, niveau de campagne choisi), camp (plus haut niveau fini par type),
//   réglages : snd (son), auto (tir auto sur cible), sens (vitesse de la caméra), dev (mode dev), fps (images/s affichées),
//   devOpt (options du panneau DEV : vol libre, invincible, vitesse, jours auto).
const SAVEK = 'dernier-toit-v1';
let save;
try {
  save = JSON.parse(localStorage.getItem(SAVEK) || 'null');
} catch (_) {
  save = null;
}
if (!save || typeof save !== 'object') save = {};
save = Object.assign(
  {
    camp: {},
    cash: 0,
    lv: { root: 1 },
    layout: { 4: 'mg', 0: 'mg' },
    best: 0,
    runs: 0,
    kills: 0,
    won: 0,
    snd: true,
    auto: true,
    sens: 1,
    dev: false,
    bestEnd: 0
  },
  save
);
save.lv.root = 1;
// V4.7 : l'escalade devient offerte et la tyrolienne se débloque à sa place ; qui avait payé l'Escalade garde la Tyrolienne
// (même prix, 120 $), et le niveau 2 (264 $) lui est rendu
if (save.lv.m_grimpe) {
  save.lv.m_tyro = Math.max(save.lv.m_tyro || 0, 1);
  if (save.lv.m_grimpe >= 2) save.cash += 264;
  delete save.lv.m_grimpe;
}
function store() {
  try {
    localStorage.setItem(SAVEK, JSON.stringify(save));
  } catch (_) {}
}

// ---------------------------------------------------------------- petits outils
// un nombre lisible : 12 345 → « 12.3 k », 2 500 000 → « 2.5 M »
const fmt = n => {
  n = Math.floor(n);
  return n >= 1e9
    ? (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + ' G'
    : n >= 1e6
      ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' M'
      : n >= 1e4
        ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + ' k'
        : String(n);
};
// change le texte d'un élément (ou d'un de ses enfants, `sel`) seulement s'il a changé : appelé à chaque image
function setTxt(id, sel, texte) {
  const el = sel ? $(id).querySelector(sel) : $(id);
  if (el._t !== texte) {
    el._t = texte;
    el.textContent = texte;
  }
}

// ---------------------------------------------------------------- l'état partagé de l'interface
// (les tests en lisent et en écrivent plusieurs par leur nom : S, running, tool, ads…)
// sniper : Tir tenu = lunette, relâché = le coup part (fireQ : heure du coup en attente, 0 = aucun)
let snipe = false,
  snipeAds = false,
  fireQ = 0;
// S : la partie en cours (créée par les règles, newRun) ; running : la partie tourne (faux au menu, dans l'arbre, à la fin)
// tool : outil en main ; ptype : type de tourelle choisi au marteau ; aimSlot / aimDoor : emplacement / porte visés au marteau (−1 = aucun)
// ads : visée ; barT : dernier appui sur la barre d'outils (elle s'efface 3,5 s après) ; firing : Tir tenu
// autoOn / autoT : un zombie est dans l'axe (tir auto), revu toutes les 0,08 s ; bob / bobT : balancement de la marche
// hurtV / lastHp : voile rouge des coups reçus ; godMode : invincible (outil DEV)
let S = null,
  running = false,
  tool = 'fusil',
  ptype = 'mg',
  aimSlot = -1,
  aimDoor = -1,
  ads = false,
  barT = 0,
  firing = false,
  autoOn = false,
  autoT = 0,
  bob = 0,
  bobT = 0,
  hurtV = 0,
  lastHp = 0,
  hurtAcc = 0,
  godMode = false;
// joy : le joystick (doigt, point de départ, avance f et côté r entre −1 et 1) ; looks : les doigts qui tournent la caméra
const joy = { id: null, x0: 0, y0: 0, f: 0, r: 0 },
  looks = {};
// jumpQ : un saut demandé (pris par la boucle) ; sneak : accroupi (interrupteur) ; sprintOn : sprint en cours
let jumpQ = false,
  sneak = false,
  sprintOn = false;
