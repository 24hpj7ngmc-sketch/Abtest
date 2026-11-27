// [affichage/modeles.js] Des modèles aux objets affichés (mdlOf), textures et halos, petits outils de hasard et de bruit (hsh, vn, sst).
// un exemplaire affichable (pièces articulées comprises), à l'échelle prévue par le modèle
function mdlOf(name, ctx, key, o) {
  const p = prepOf(name, ctx, key),
    g = K.inst(p, o || {});
  if (p.scale) g.scale.setScalar(p.scale);
  return g;
}
// texture de grain fabriquée sur place : elle multiplie la couleur des sommets (herbe, sable, terre) et se répète sans raccord visible
function tex(w, base, cols, n, r0, r1, rep) {
  const c = document.createElement('canvas');
  c.width = c.height = w;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, w, w);
  let s = 11 + n;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const x = r() * w,
      y = r() * w,
      q = r0 + r() * (r1 - r0);
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = 0.22 + r() * 0.4;
    for (const dx of [-w, 0, w])
      for (const dy of [-w, 0, w]) {
        g.beginPath();
        g.arc(x + dx, y + dy, q, 0, 7);
        g.fill();
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  return t;
}
// halo lumineux : sert aux étincelles, aux tirs et à la lueur du cœur
const glowT = (() => {
  const n = 96,
    d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - (n - 1) / 2, y - (n - 1) / 2) / (n / 2),
        a = r >= 1 ? 0 : Math.pow(1 - r, 1.6),
        i = (y * n + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.round(a * 255);
    }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
})();
const glowM = (col, op) =>
  new THREE.SpriteMaterial({
    map: glowT,
    color: col,
    transparent: true,
    opacity: op === undefined ? 1 : op,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
// bruit doux (le même à chaque chargement) pour faire varier les teintes du sol
const hsh = (i, j) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn = (x, z) => {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = x - i,
    v = z - j,
    a = u * u * (3 - 2 * u),
    b = v * v * (3 - 2 * v);
  return (hsh(i, j) * (1 - a) + hsh(i + 1, j) * a) * (1 - b) + (hsh(i, j + 1) * (1 - a) + hsh(i + 1, j + 1) * a) * b;
};
const sst = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
