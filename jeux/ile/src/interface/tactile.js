// [interface/tactile.js] Les commandes tactiles : joystick, regard, doigts multiples, rotation de l'écran.
// ---------- commandes tactiles ----------
function turn(dx, dy) {
  if (!sim) return;
  const h = sim.hero,
    k = 0.0055 / Math.pow(aimZoom(), 0.8);
  h.yaw -= dx * k;
  h.pitch = Math.max(-1.3, Math.min(1.3, h.pitch - dy * k));
} // en visée la caméra tourne moins vite, à proportion du zoom
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
  if (!running) return;
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch (_) {}
  const x = px(e),
    y = py(e),
    W = rot ? innerHeight : innerWidth,
    H = rot ? innerWidth : innerHeight;
  if (e.currentTarget === canvas && cielOn()) {
    cielDown(e, x, y); // la vue du ciel : toucher, glisser, pincer (interface/ciel.js)
    return;
  }
  if (e.currentTarget === canvas && joy.id === null && x < W * 0.4 && y > H * 0.3) {
    joy.id = e.pointerId;
    joy.x0 = x;
    joy.y0 = y;
    $('joy').classList.add('on'); // le joystick, à peine visible au repos, s'allume sous le pouce
    return;
  }
  looks[e.pointerId] = { x, y };
}
function pMove(e) {
  const x = px(e),
    y = py(e);
  if (ciel.pts[e.pointerId]) {
    cielMove(e, x, y);
    return;
  }
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
  if (ciel.pts[e.pointerId]) {
    cielUp(e, px(e), py(e));
    return;
  }
  if (e.pointerId === joy.id) {
    joy.id = null;
    joy.f = joy.r = 0;
    joy.full = 0;
    $('knob').style.transform = '';
    $('joy').classList.remove('on');
  }
  delete looks[e.pointerId];
}
for (const el of [canvas, $('bFire'), $('bJump'), $('bFree'), $('bSneak'), $('bAb'), $('bUlt'), $('bRenf')]) {
  el.addEventListener('pointerdown', pDown);
  el.addEventListener('pointermove', pMove);
  el.addEventListener('pointerup', pUp);
  el.addEventListener('pointercancel', pUp);
}
$('bFire').addEventListener('pointerdown', () => {
  fireTouch = true;
  $('bFire').classList.add('on');
  if (running && tool === 'pistolet' && WT[tWeap].scope && !ov()) aimHold = true;
}); // arme à lunette : tenir Tir ouvre la lunette
for (const ev of ['pointerup', 'pointercancel'])
  $('bFire').addEventListener(ev, () => {
    fireTouch = false;
    $('bFire').classList.remove('on');
    if (aimHold) {
      aimHold = false;
      if (ev === 'pointerup') {
        fireQ = true;
        fireQT = performance.now();
      }
    }
  }); // … et relâcher fait partir le coup
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
$('bAb').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!dbl(e) || !running) return;
  const hh = sim.hero,
    sy = Math.sin(hh.pitch),
    far = hh.el === 'feu' && hh.m.voA ? BAL.artiFb + hh.m.spA1 : 0, // V2.2, Artilleur : l'Orbe part plus loin
    dd = Math.max(4, Math.min(22 + far, sy < -0.05 ? ((hh.y + hh.eye) / -sy) * Math.cos(hh.pitch) : 22 + far)); // point visé au sol, pour les compétences qui se lancent à distance
  send([
    'ab',
    r1(hh.x),
    r1(hh.z),
    Math.round(hh.yaw * 100) / 100,
    r1(hh.x - Math.sin(hh.yaw) * dd),
    r1(hh.z - Math.cos(hh.yaw) * dd)
  ]);
});
$('bUlt').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!dbl(e)) return;
  const hh = sim && sim.hero;
  if (!running || !hh || !KIT[hh.el] || hh.ult < 100 || hh.down > 0) return;
  hh.ult = 0;
  send(['ul']);
  if (!net.host) ULT[hh.el](sim, hh);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
