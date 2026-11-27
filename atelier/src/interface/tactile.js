// [interface/tactile.js] Les commandes tactiles : joystick, regard, doigts multiples, rotation de l'écran.
// ---------- commandes tactiles ----------
function turn(dx, dy) {
  if (LB.on && !lobOv()) lobTurn(dx, dy);
}
// en paysage forcé, le doigt est lu dans le repère de la scène tournée
let rot = false;
const stage = $('stage');
function fit() {
  rot = innerHeight > innerWidth;
  document.documentElement.classList.toggle('rot', rot);
  stage.style.width = rot ? innerHeight + 'px' : '';
  stage.style.height = rot ? innerWidth + 'px' : '';
  const W = rot ? innerHeight : innerWidth;
  document.documentElement.classList.toggle('sm', W < 800);
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 200));
fit();
const px = e => (rot ? e.clientY : e.clientX),
  py = e => (rot ? innerWidth - e.clientX : e.clientY);
function pDown(e) {
  if (!LB.on || lobOv()) return;
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch (_) {}
  const x = px(e),
    y = py(e),
    W = rot ? innerHeight : innerWidth,
    H = rot ? innerWidth : innerHeight;
  if (e.currentTarget === canvas && joy.id === null && x < W * 0.4 && y > H * 0.3) {
    joy.id = e.pointerId;
    joy.x0 = x;
    joy.y0 = y;
    return;
  }
  looks[e.pointerId] = { x, y };
}
function pMove(e) {
  const x = px(e),
    y = py(e);
  if (e.pointerId === joy.id) {
    const dx = x - joy.x0,
      dy = y - joy.y0,
      l = Math.hypot(dx, dy),
      m = 44,
      k = l > m ? m / l : 1;
    joy.r = (dx * k) / m;
    joy.f = (-dy * k) / m;
    $('knob').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    return;
  }
  const p = looks[e.pointerId];
  if (!p) return;
  turn(x - p.x, y - p.y);
  p.x = x;
  p.y = y;
}
function pUp(e) {
  if (e.pointerId === joy.id) {
    joy.id = null;
    joy.f = joy.r = 0;
    joy.full = 0;
    $('knob').style.transform = '';
  }
  delete looks[e.pointerId];
}
for (const el of [canvas, $('bFire'), $('bJump'), $('bFree'), $('bSneak')]) {
  el.addEventListener('pointerdown', pDown);
  el.addEventListener('pointermove', pMove);
  el.addEventListener('pointerup', pUp);
  el.addEventListener('pointercancel', pUp);
}
$('bFire').addEventListener('pointerdown', () => $('bFire').classList.add('on'));
for (const ev of ['pointerup', 'pointercancel'])
  $('bFire').addEventListener(ev, () => $('bFire').classList.remove('on'));
$('bJump').addEventListener('pointerdown', () => {
  jumpQ = true;
  jumpHeld = true;
});
for (const ev of ['pointerup', 'pointercancel']) {
  $('bJump').addEventListener(ev, () => {
    jumpHeld = false;
  });
  $('bSneak').addEventListener(ev, () => {
    sneakHeld = false;
  });
}
$('bSneak').addEventListener('pointerdown', e => {
  e.preventDefault();
  try {
    $('bSneak').setPointerCapture(e.pointerId);
  } catch (_) {}
  sneakHeld = true;
  if (flying()) return;
  inp.sneak = !inp.sneak;
  $('bSneak').classList.toggle('on', inp.sneak);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
