// [interface/commandes.js] Les commandes universelles : Action et Saut dans le coin, Sneak, Compétence, Ultime, Renfort et le bouton libre le long de l'arc.
// ---------- commandes universelles : Action (l'outil en main) et Saut côte à côte, quatre boutons au-dessus (libre, Sneak, Compétence, Ultime) ----------
// Les mêmes boutons servent au lobby et dans chaque mini-jeu. `padSet` écrit le bouton Action, le bouton libre et l'étiquette posée à gauche d'Action.
let freeK = '',
  barT = 0;
// LA VISÉE (V8.9), comme sur les jeux de tir mobiles : le bouton libre devient « Viser » quand on a l'arme en main (un appui pour viser, un autre pour arrêter).
// En visée : zoom (WT[arme].zoom), caméra qui tourne moins vite, pas de sprint, arme ramenée au centre. Une arme à lunette (scope, le sniper) affiche la lunette plein écran ;
// avec elle, tenir Tir vise aussi, et le coup part quand on relâche (fireQ). `aim` : bascule du bouton ; `aimHold` : visée tenue par Tir ; aimOn() : on vise.
let aim = false,
  aimHold = false,
  fireQ = false,
  fireQT = 0;
const aimOn = () => (aim || aimHold) && running && tool === 'pistolet' && !ov() && !(sim.hero.down > 0),
  aimZoom = () => (aimOn() ? WT[tWeap].zoom || 1.35 : 1);
function aimSet(v) {
  aim = !!v;
  if (!aim) aimHold = false;
}
// Petits boutons (libre, Compétence, Ultime) : il faut deux appuis rapprochés pour activer. Sneak, lui, répond au premier appui (V8.5). Un appui seul arme le bouton (liseré blanc) et ne fait rien :
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
function autoAct() {
  if (!nearA || !running) return;
  toast(nearA.auto ? 'Mode auto coupé sur cette défense' : 'Défense passée en automatique');
  send(['au', nearA.id]);
}
function lineAct() {
  if (!running || !placing || !isLine(placeType)) return;
  if (gWhy) {
    toast(gWhy);
    return;
  }
  if (wallA < 0) {
    wallA = cellOf(gx, gz);
    gKey = '';
    return;
  }
  if (sim.gold < gChk.cost) {
    toast("Pas assez d'or");
    return;
  }
  send([placeType === 'mur' ? 'wl' : 'dg', cellX(wallA), cellZ(wallA), gx, gz]);
  wallA = -1;
  gKey = '';
}
// Action : au pistolet le tir est tenu (voir fireTouch) ; à la pelle, point A puis point B ; au marteau, pose (ou amélioration, accroupi près d'une défense) avec l'élément conseillé
function padAct(e) {
  if (!running || ov() || tool === 'pistolet') return;
  if (placing && isLine(placeType)) {
    lineAct();
    return;
  }
  const w = wheelCtx;
  if (!w) return;
  if (w.why) {
    toast(w.why);
    return;
  }
  if (wheelAdv < 0) {
    toast('Niveau maximum');
    return;
  }
  wheelGo(wheelAdv);
}
function padFree(e) {
  e.preventDefault();
  if (running && freeK === 'aim') {
    if (!ov()) aimSet(!aim);
    return;
  } // Viser : un seul appui
  if (!dbl(e)) return;
  if (!running || ov()) return;
  if (freeK === 'auto') autoAct();
  else if (freeK === 'shop' && shopNear) openTree();
}
// RENFORT (V1.2, demande de Frédéric du 24/11 : « comme compétence normale, pas dans le marteau ») : son propre bouton sur l'arc, au-dessus de l'Ultime,
// toujours là quel que soit l'outil en main ; deux appuis rapprochés, comme Compétence et Ultime. Avant : le bouton libre, marteau en main seulement.
function padRenf(e) {
  e.preventDefault();
  if (!dbl(e) || !running || ov()) return;
  const h = sim.hero;
  if (h.down > 0) return;
  if (h.sm > 0) toast('Renfort : encore ' + Math.ceil(h.sm) + ' s');
  else send(['sm']);
}
$('bFire').addEventListener('pointerdown', padAct);
$('bFree').addEventListener('pointerdown', padFree);
$('bRenf').addEventListener('pointerdown', padRenf);
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
$('act').addEventListener(
  'pointerdown',
  () => {
    barT = performance.now();
  },
  true
); // la barre d'outils se réveille dès qu'on la touche
