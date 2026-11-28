// [interface/boucle.js] La boucle de la page : resize, frame() (une image du lobby, ou la pause quand un mini-jeu est ouvert dans son cadre), démarrage.
// ---------- boucle ----------
// le rapport largeur / hauteur de l'écran, relu par la caméra du lobby (lobbyTick)
let aspect = 1;
function resize() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    pr = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
    renderer.setSize(w, h, false);
    aspect = w / h;
  }
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (DernierToit.ouvert) {
    last = now;
    window.__dtPause = (window.__dtPause || 0) + 1;
    toitNet(now);
    return;
  }
  // L'Île des Cinq est ouverte dans son cadre : même pause (ni boucle, ni rendu, ni sons du lobby), le facteur du multi continue
  if (IleDesCinq.ouvert) {
    last = now;
    window.__ilePause = (window.__ilePause || 0) + 1;
    ileNet(now);
    return;
  }
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  resize();
  if (LB.on) lobbyTick(dt, now);
  netTick(dt);
}
lobbyEnter();
requestAnimationFrame(frame);
