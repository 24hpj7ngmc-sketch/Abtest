// [lobby/portails.js] Les portails sur leur parvis au nord, la montagne, les parcelles et le relief de base de l'île (terraBase).
// ---- les portails, au nord, sur leur parvis de marbre : un par mini-jeu. Le second mène à Dernier Toit depuis la V10.1 (voir « DERNIER TOIT » plus bas). Ils reculent quand l'île grandit.
for (const G of LGAMES) {
  const ry = Math.atan2(-G.x * 0.35, 8),
    v = lput('set.portail', G.x, 0, G.z, ry),
    cy = (v.userData.prep.center || [0, 3.2, 0])[1],
    u = { t: { value: 0 }, on: { value: G.open ? 1 : 0 } };
  G.u = u;
  G.ry = ry;
  G.v = v;
  if (G.open) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(3.3, 36),
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: VTX_V,
        fragmentShader: VTX_F,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    disc.position.y = cy;
    v.add(disc);
    G.disc = disc;
    const gl = new THREE.Sprite(glowM(0xa77bff, 0.55));
    gl.position.set(0, cy, 0.4);
    gl.scale.setScalar(8);
    v.add(gl);
    G.gl = gl;
  } else {
    const dk = new THREE.Mesh(
      new THREE.CircleGeometry(3.3, 36),
      new THREE.MeshBasicMaterial({ color: 0x141a3a, side: THREE.DoubleSide })
    );
    dk.position.y = cy;
    v.add(dk);
    const ch = mdlOf('lob.sceau', {}, '', { cast: false });
    ch.position.set(0, cy, 0.5);
    v.add(ch);
  }
  const l = lobLabel(6.6);
  lob.add(l);
  lobText(l, G.n, G.d, G.open ? '#d9c2ff' : '#a2c0c7');
  G.lab = l;
}
// change le rayon de l'île : bord, parvis, maillage, roche du dessous, eau et portails suivent
// la montagne : un seul grand massif en terrasses, dont le sommet reste plat. Elle s'efface vers le bord de l'île et devant les portails.
// ================= LE TERRAFORMAGE =================
// Le cœur de l'île (rayon ~74 m) porte le village : Grand-Place du Hall au centre, deux anneaux de parcelles, portails au nord.
// Autour, la « couronne sauvage » (TERRA[1], les Prairies). Elle s'élargit et prend de la hauteur quand l'île grandit.
// MH0 = relief brut de l'évolution ; MH = relief après aménagement (terrasses sous les bâtiments et les parcelles, routes nivelées).
// Angles : a = atan2(x, −z), 0 au nord (portails), π au sud. q = position dans la couronne (0 au bord du cœur, 1 au bord de l'île).
const MH0 = new Float32Array(NV),
  TW = new Float32Array(NV),
  CORE = 74,
  PZ = -46,
  MASS = { x: 0, z: 60, r: 30, h: 0, riv: [], cave: [0, 60, 30] };
let VILOK = false,
  TERQ = 0;
const PLOTS = [];
for (let i = 0; i < 6; i++) {
  const a = ((30 + 60 * i) * Math.PI) / 180;
  PLOTS.push({ x: Math.sin(a) * 30, z: -Math.cos(a) * 30, a, ring: 1 });
}
for (let i = 0; i < 10; i++) {
  const a = ((45 + 30 * i) * Math.PI) / 180;
  PLOTS.push({ x: Math.sin(a) * 58, z: -Math.cos(a) * 58, a, ring: 2 });
}
const tnz = (x, z, f, s) => vn(x * f + s, z * f + s * 1.7),
  tfbm = (x, z, f, s) => (tnz(x, z, f, s) + 0.5 * tnz(x, z, f * 2, s + 5) + 0.25 * tnz(x, z, f * 4, s + 9)) / 1.75,
  trdg = (x, z, f, s) => 1 - Math.abs(2 * tnz(x, z, f, s) - 1),
  tad = (a, c) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))),
  tbell = (v, c, w) => {
    const d = Math.abs(v - c) / w;
    return d < 1 ? (1 - d * d) * (1 - d * d) : 0;
  },
  tlerp = (a, b, w) => a + (b - a) * w,
  tpol = (a, r) => [Math.sin(a) * r, -Math.cos(a) * r],
  tdir = (ax, az, bx, bz) => {
    const l = Math.hypot(bx - ax, bz - az) || 1;
    return [(bx - ax) / l, (bz - az) / l];
  };
const TERRA = [
  null,
  // 1 · CÉLESTE — les Prairies : collines douces, mont sacré en terrasses au sud, lac au sud-est, colline à l'ouest
  (R, A, bw) => {
    const H = Math.min(64, 12 + 0.42 * bw) * A,
      rs = CORE + 0.5 * bw,
      LK = tpol(2.25, CORE + 0.42 * bw),
      lR = 10 + 0.2 * bw,
      WH = tpol(-1.75, CORE + 0.5 * bw),
      wR = 0.42 * bw + 6,
      d = tdir(0, rs, LK[0], LK[1]);
    Object.assign(MASS, {
      x: 0,
      z: rs,
      r: 0.5 * bw + 4,
      h: H,
      riv: [
        [0, rs, d[0], d[1]],
        [0, rs, 0.25, 0.97],
        [0, rs, -0.8, 0.6]
      ],
      cave: [0, rs, 0.5 * bw + 4]
    });
    return (x, z, r, a, q) => {
      const w = sst(CORE - 2, CORE + 22, r);
      let h =
        2.5 * sst(60, 0, r) +
        Math.max(-0.25, 7 * A * (tfbm(x, z, 0.02, 3) - 0.4)) * w +
        9 * A * Math.pow(trdg(x, z, 0.012, 9), 2) * sst(0.1, 0.5, q) * sst(0.5, 1.2, tad(a, Math.PI));
      const m = sst(1.25, 0.3, tad(a, Math.PI)),
        b = q > 0 && q < 1 ? Math.pow(Math.sin(Math.PI * q), 0.8) : 0;
      let f = m * b * (1 + 0.25 * (tnz(x, z, 0.03, 7) - 0.5));
      f += (Math.round(f * 7) / 7 - f) * 0.55;
      h += H * f;
      h += 0.45 * H * tbell(Math.hypot(x - WH[0], z - WH[1]), 0, wR);
      const dl = (Math.hypot(x - LK[0], z - LK[1]) / lR) * (1 + 0.2 * Math.sin(3 * Math.atan2(z - LK[1], x - LK[0])));
      return tlerp(h, -2.7, sst(1.15, 0.8, dl));
    };
  }
];
// relief brut de l'île, pour le rayon et l'ampleur du moment. window.__flat (tests) : île plate.
function terraBase() {
  const R = RI,
    A = 0.7 + 0.3 * Math.min(1, MHc / 30),
    bw = Math.max(20, R - 8 - CORE);
  MASS.riv = [];
  MASS.h = 0;
  MASS.s0 = 0;
  const F = window.__flat ? null : TERRA[1](R, A, bw);
  for (let i = 0; i < NV; i++) {
    const x = -VH + (i % VW) * VC,
      z = -VH + Math.floor(i / VW) * VC,
      r = Math.hypot(x, z);
    let h = 0;
    if (F && r < R + 6) {
      h = F(x, z, r, Math.atan2(x, -z), (r - CORE) / bw);
      if (h > 0) h *= sst(R - 4, R - 13, r);
      let pd = 1e9;
      for (const G of LGAMES) pd = Math.min(pd, Math.hypot(G.x - x, G.z - z));
      h *= sst(PADR + 1, PADR + 10, pd);
    }
    MH0[i] = h;
  }
}
