// [lobby/terrain.js] Le terrain de l'île : grille de sommets sculptable, hauteurs, rayon selon l'évolution, la liste des mini-jeux (LGAMES), couleurs du sol, mer de nuages.
// ---- l'île : un terrain que le joueur sculpte. Grille de sommets tous les 2 m (65 × 65), hauteurs de -3 à +10 m. Le rayon de l'île grandit avec son niveau (38 → 62 m) ; le bord et le parvis des portails restent à 0.
const VN = 120,
  VC = 4,
  VH = (VN * VC) / 2,
  VW = VN + 1,
  NV = VW * VW,
  TMIN = -3,
  TMAX = 10,
  PADR = 11.5,
  ILR = [126, 148, 170, 192, 214, 236];
// TH = le relief sculpté par le joueur (sauvegardé) ; MH = la montagne, qui pousse avec le niveau de l'île ; HTT = hauteur réelle du sol = TH + MH
const MH = new Float32Array(NV),
  HTT = new Float32Array(NV),
  MTH = [0, 6, 12, 18, 24, 30, 30];
let MHc = 0,
  NATK = 0,
  MHtop = 0; // hauteur du sommet par niveau d'île, centre de la montagne (là où se tient le hall du village de départ)
const TH = new Float32Array(NV),
  TLOCK = new Uint8Array(NV),
  TFIX = new Uint8Array(NV),
  VPX = new Float32Array(NV),
  VPZ = new Float32Array(NV),
  VNo = new Float32Array(NV * 3),
  VCo = new Float32Array(NV * 3);
let RI = 38,
  TIDX = [],
  TP = null,
  TNo = null,
  TCo = null;
const LGAMES = [
    {
      id: 'ile',
      n: "L'ÎLE DES CINQ",
      t: "L'Île des Cinq",
      tag: 'Île',
      d: 'Tower defense',
      x: -7.6,
      z: -46,
      open: true
    },
    { id: 'toit', n: 'DERNIER TOIT', t: 'Dernier Toit', tag: 'Toit', d: 'Survie · zombies', x: 7.6, z: -46, open: true }
  ],
  LOBS = []; // LOBS : obstacles fixes [x, z, rayon]
if (typeof save.terr === 'string') {
  const t = save.terr,
    rd = c => Math.max(TMIN, Math.min(TMAX, (c - 77) / 4));
  if (t.length === NV) for (let i = 0; i < NV; i++) TH[i] = rd(t.charCodeAt(i));
} // les anciens reliefs (grilles plus petites) sont recentrés dans la nouvelle
function terrSave() {
  if (VISIT.on) return;
  let t = '';
  for (let i = 0; i < NV; i++) t += String.fromCharCode(77 + Math.round(TH[i] * 4));
  save.terr = t;
}
function hAt(x, z) {
  const fx = Math.max(0, Math.min(VN - 1e-4, (x + VH) / VC)),
    fz = Math.max(0, Math.min(VN - 1e-4, (z + VH) / VC)),
    i = fx | 0,
    j = fz | 0,
    u = fx - i,
    v = fz - j,
    a = HTT[i + j * VW],
    b = HTT[i + 1 + j * VW],
    c = HTT[i + (j + 1) * VW],
    d = HTT[i + 1 + (j + 1) * VW];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
// ---- le décor de l'île (Céleste) : couleurs du sol, ciel, mer de nuages, lumière, eau
const tcOf = o => {
  const r = {};
  for (const k in o) r[k] = K.rgb(o[k]);
  return r;
};
const ENV = [
  null,
  {
    n: 'Céleste',
    tc: tcOf({
      a: 0x5d9a58,
      b: 0x86bd6a,
      c: 0x9fc47a,
      rock: 0x8d88a6,
      rockD: 0x6a6684,
      snow: 0xf3f1fa,
      sand: 0xd8cba0,
      mud: 0x8a7c62,
      rim: 0xb9b4c8,
      pad: 0xe4dfd2
    }),
    sky: [0x0f123d, 0x5447a3, 0xffbda3, 0x33bf9e, 0xffcc9e, 1],
    cld: [0x574f9e, 0xffdedb, 0xffc7a8],
    fog: 0xb9a0cf,
    hemi: [0xd9dcff, 0x7a6aa0, 0.82],
    sun: [0xffe6cc, 0.78],
    rim: [0xff9d8a, 0.3],
    water: [0x4fb6e8, 0.72],
    glow: 0xa77bff,
    mote: 0xfff2c4
  }
];
let TC = ENV[1].tc;
const terrM = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: tex(256, '#f1f4ea', ['#dfe7d2', '#ffffff', '#d0dcc2', '#f7fbef'], 900, 1.2, 5, 1)
  })
);
terrM.frustumCulled = false;
lob.add(terrM);
function terrDraw() {
  for (let i = 0; i < NV; i++) HTT[i] = TFIX[i] ? 0 : TH[i] + MH[i];
  const H = (i, j) => HTT[Math.max(0, Math.min(VN, i)) + Math.max(0, Math.min(VN, j)) * VW];
  for (let j = 0; j < VW; j++)
    for (let i = 0; i < VW; i++) {
      const q = i + j * VW,
        x = VPX[q],
        z = VPZ[q],
        r = Math.hypot(x, z);
      if (r > RI + 3) continue;
      const h = HTT[q],
        nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * VC),
        nz = -(H(i, j + 1) - H(i, j - 1)) / (2 * VC),
        l = 1 / Math.hypot(nx, 1, nz);
      VNo[q * 3] = nx * l;
      VNo[q * 3 + 1] = l;
      VNo[q * 3 + 2] = nz * l;
      const n1 = vn(x * 0.07 + 3, z * 0.07 + 9),
        n2 = vn(x * 0.23 + 11, z * 0.23 + 5);
      let c = K.mix(K.mix(TC.a, TC.b, sst(0.25, 0.8, n1)), TC.c, sst(0.55, 0.95, n2) * 0.6);
      c = K.mix(c, K.mix(TC.rock, TC.rockD, n2), sst(0.06, 0.2, 1 - l));
      c = K.mix(c, K.mix(TC.rock, TC.rockD, n1), sst(6, 13, h + n2 * 3) * 0.55);
      c = K.mix(c, TC.snow, sst(19, 26, h + n2 * 4));
      c = K.mix(c, TC.sand, sst(-0.25, -0.8, h));
      c = K.mix(c, TC.mud, sst(-1.6, -2.6, h));
      c = K.mix(c, TC.rim, sst(RI - 4.5, RI - 1.5, r) * 0.8);
      let pd = 1e9;
      for (const G of LGAMES) pd = Math.min(pd, Math.hypot(G.x - x, G.z - z));
      c = K.mix(c, TC.pad, sst(PADR + 1, PADR - 2.5, pd));
      VCo[q * 3] = c[0];
      VCo[q * 3 + 1] = c[1];
      VCo[q * 3 + 2] = c[2];
    }
  for (let k = 0; k < TIDX.length; k++) {
    const i = TIDX[k];
    TP[k * 3 + 1] = HTT[i];
    TNo[k * 3] = VNo[i * 3];
    TNo[k * 3 + 1] = VNo[i * 3 + 1];
    TNo[k * 3 + 2] = VNo[i * 3 + 2];
    TCo[k * 3] = VCo[i * 3];
    TCo[k * 3 + 1] = VCo[i * 3 + 1];
    TCo[k * 3 + 2] = VCo[i * 3 + 2];
  }
  for (const n of ['position', 'normal', 'color']) terrM.geometry.getAttribute(n).needsUpdate = true;
  payMark();
}
const lUnder = lput('vil.dessous', 0, 0, 0, 0),
  lUnderK = lUnder.scale.x;
// l'eau : elle apparaît là où l'on creuse assez profond
const lWater = new THREE.Mesh(
  new THREE.CircleGeometry(1, 56),
  new THREE.MeshPhongMaterial({
    color: 0x4fb6e8,
    transparent: true,
    opacity: 0.72,
    shininess: 90,
    specular: 0xffffff,
    depthWrite: false
  })
);
lWater.rotation.x = -Math.PI / 2;
lWater.position.y = -0.75;
lob.add(lWater);
