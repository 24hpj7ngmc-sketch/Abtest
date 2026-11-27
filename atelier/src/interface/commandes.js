// [interface/commandes.js] Les commandes universelles au lobby : Action et Saut dans le coin, Sneak et le bouton libre le long de l'arc ; l'état des commandes (joystick, regard, saut, sneak).
// ---------- commandes universelles : Action (l'outil en main) et Saut côte à côte, le bouton libre et Sneak au-dessus ----------
// Chaque mini-jeu reprend la même disposition dans son cadre, avec Compétence et Ultime en plus (masqués au lobby, ils ne sont plus dans cette page).
// `padSet` écrit le bouton Action, le bouton libre et l'étiquette posée à gauche d'Action.
let barT = 0;
// l'état des commandes : sneak (inp), joystick (joy), doigts qui tournent la caméra (looks), Saut demandé ou tenu, Sneak tenu
const inp = { sneak: false };
const joy = { id: null, x0: 0, y0: 0, f: 0, r: 0, full: 0 };
const looks = {};
let jumpQ = false,
  jumpHeld = false,
  sneakHeld = false;
const flying = () => !!(save.dev && dev.fly);
// Le petit bouton libre : il faut deux appuis rapprochés pour activer. Sneak, lui, répond au premier appui (V8.5). Un appui seul arme le bouton (liseré blanc) et ne fait rien :
// le pouce qui tourne la caméra ne déclenche plus rien par accident. Un doigt posé sur un petit bouton puis glissé tourne d'ailleurs la caméra, comme partout.
const DBL = 420;
let dblId = '',
  dblT = 0;
function dbl(e) {
  const b = e.currentTarget,
    now = performance.now();
  if (dblId === b.id && now - dblT < DBL) {
    dblId = '';
    clearTimeout(b._at);
    b.classList.remove('arm');
    return true;
  }
  if (dblId && dblId !== b.id) $(dblId).classList.remove('arm');
  dblId = b.id;
  dblT = now;
  b.classList.add('arm');
  clearTimeout(b._at);
  b._at = setTimeout(() => b.classList.remove('arm'), DBL);
  return false;
}
function padSet(a, as, cls, f, fs, fon, lab, ls, lpoor) {
  const A = $('bFire'),
    F = $('bFree'),
    L = $('aLab');
  setTxt('bFire', 'b', a);
  setTxt('bFire', 'small', as || '');
  if (A._c !== cls) {
    A._c = cls;
    A.classList.toggle('go', cls === 'go');
    A.classList.toggle('poor', cls === 'poor');
    A.classList.toggle('idle', cls === 'idle');
  }
  if (F._v !== !f) {
    F._v = !f;
    F.classList.toggle('vh', !f);
  }
  if (f) {
    setTxt('bFree', 'b', f);
    setTxt('bFree', 'small', fs || '');
  }
  if (F._o !== !!fon) {
    F._o = !!fon;
    F.classList.toggle('on', !!fon);
  }
  const hl = !lab && !ls;
  if (L.hidden !== hl) L.hidden = hl;
  if (!hl) {
    setTxt('aLab', 'b', lab || '');
    setTxt('aLab', 'small', ls || '');
  }
  if (L._p !== !!lpoor) {
    L._p = !!lpoor;
    L.classList.toggle('poor', !!lpoor);
  }
}
// Action : l'outil en main du lobby (ouvrir, poser, monter, creuser). Le bouton libre demande deux appuis rapprochés.
function padAct(e) {
  if (LB.on) lobPress(1, e);
}
function padFree(e) {
  e.preventDefault();
  if (dbl(e) && LB.on) lobPress(LB.fk || 2, e);
}
$('bFire').addEventListener('pointerdown', padAct);
$('bFree').addEventListener('pointerdown', padFree);
// Le gros bouton est coupé en diagonale par un découpage CSS (clip-path), qui décide aussi de la moitié touchée. Par sécurité, si un téléphone n'en tient pas compte pour le toucher,
// on calcule la moitié nous-mêmes (sous la diagonale : Action ; au-dessus : Saut) et on renvoie l'appui au bon bouton. Les appuis fabriqués par les tests passent sans détour.
$('padMain').addEventListener(
  'pointerdown',
  e => {
    if (!e.isTrusted) return;
    const r = e.currentTarget.getBoundingClientRect(),
      u = rot ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width,
      v = rot ? (r.right - e.clientX) / r.width : (e.clientY - r.top) / r.height,
      t = $(v > u ? 'bFire' : 'bJump'); // u, v : la position dans le bouton, de 0 à 1 (l'écran peut être tourné)
    if (Math.abs(v - u) < 0.06 || e.target === t || t.contains(e.target)) return;
    e.stopPropagation();
    e.preventDefault();
    t.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        isPrimary: e.isPrimary,
        clientX: e.clientX,
        clientY: e.clientY
      })
    );
  },
  true
);
$('lBar').addEventListener(
  'pointerdown',
  () => {
    barT = performance.now();
  },
  true
); // la barre d'outils se réveille dès qu'on la touche
