// [lobby/chemins.js] Le réseau de chemins entre les bâtiments, les parcelles, et l'aménagement du sol qui en découle (terraPlan).
// ---- le réseau de chemins : chaque bâtiment à rôle a son parvis rond ; un arbre couvrant relie tous les parvis (le Hall d'abord), plus quelques bouclages entre voisins. Les portails sont reliés au Hall.
const ROADS = { nodes: [], edges: [], adj: [] };
function roadPlan() {
  const N = [],
    E = [];
  N.push({ x: 0, z: PZ, R: PADR + 2, b: null, gate: 1 });
  for (const B of save.vil) {
    const C = CAT[B.t];
    if (!C || !C.up) continue;
    N.push({ x: B.x, z: B.z, R: rOf(B) + (B.t === 'hall' ? 7 : 3), b: B, hall: B.t === 'hall' });
  }
  const n = N.length,
    D = (i, j) => Math.hypot(N[i].x - N[j].x, N[i].z - N[j].z),
    W = (i, j) => {
      const a = N[i],
        b = N[j];
      return D(i, j) * (a.gate || b.gate ? (a.hall || b.hall ? 0.5 : 4) : a.hall || b.hall ? 0.8 : 1);
    },
    adj = N.map(() => []),
    link = (i, j) => {
      E.push([i, j]);
      adj[i].push(j);
      adj[j].push(i);
    };
  if (n > 1) {
    const inT = new Uint8Array(n);
    let s = N.findIndex(q => q.hall);
    if (s < 0) s = 0;
    inT[s] = 1;
    for (let c = 1; c < n; c++) {
      let bi = -1,
        bj = -1,
        bw = 1e9;
      for (let i = 0; i < n; i++)
        if (inT[i])
          for (let j = 0; j < n; j++)
            if (!inT[j]) {
              const w = W(i, j);
              if (w < bw) {
                bw = w;
                bi = i;
                bj = j;
              }
            }
      inT[bj] = 1;
      link(bi, bj);
    }
    const hop = (a, b) => {
        const d = new Float32Array(n).fill(1e9),
          Q = [a];
        d[a] = 0;
        while (Q.length) {
          const i = Q.shift();
          for (const j of adj[i])
            if (d[j] > d[i] + D(i, j)) {
              d[j] = d[i] + D(i, j);
              Q.push(j);
            }
        }
        return d[b];
      },
      P = [];
    for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) if (D(i, j) < 48) P.push([D(i, j), i, j]);
    P.sort((a, b) => a[0] - b[0]);
    let ex = 0;
    for (const p of P) {
      if (ex >= n) break;
      if (adj[p[1]].includes(p[2])) continue;
      if (hop(p[1], p[2]) > 1.7 * p[0]) {
        link(p[1], p[2]);
        ex++;
      }
    }
  }
  ROADS.nodes = N;
  ROADS.adj = adj;
  ROADS.edges = [];
  for (const e of E) {
    const a = N[e[0]],
      b = N[e[1]],
      d = D(e[0], e[1]);
    if (d < a.R + b.R + 1) continue;
    const ux = (b.x - a.x) / d,
      uz = (b.z - a.z) / d;
    ROADS.edges.push({
      i: e[0],
      j: e[1],
      ax: a.x + ux * a.R,
      az: a.z + uz * a.R,
      bx: b.x - ux * b.R,
      bz: b.z - uz * b.R
    });
  }
  // le sentier : de la Grand-Place jusqu'au pied du grand relief de l'évolution (il franchit l'eau ou la lave sur un remblai)
  const hi = N.findIndex(q => q.hall);
  if (hi >= 0 && MASS.h > 3) {
    const h = N[hi],
      d = Math.hypot(MASS.x - h.x, MASS.z - h.z);
    if (d > MASS.r + h.R + 25) {
      const ux = (MASS.x - h.x) / d,
        uz = (MASS.z - h.z) / d;
      ROADS.edges.push({
        i: hi,
        j: -1,
        trail: 1,
        ax: h.x + ux * h.R,
        az: h.z + uz * h.R,
        bx: MASS.x - ux * MASS.r,
        bz: MASS.z - uz * MASS.r
      });
    }
  }
}
// ---- aménagement : le sol se met de niveau sous chaque parvis et chaque parcelle libre, et les chemins sont nivelés d'un bout à l'autre (remblai sur l'eau, tranchée dans les pentes)
function terraPlan() {
  MHtop = 0;
  for (let i = 0; i < NV; i++) TW[i] = MH0[i] + TH[i];
  if (VILOK) {
    roadPlan();
    const smp = (x, z) => {
        const fx = Math.max(0, Math.min(VN - 1e-4, (x + VH) / VC)),
          fz = Math.max(0, Math.min(VN - 1e-4, (z + VH) / VC)),
          i = fx | 0,
          j = fz | 0,
          u = fx - i,
          v = fz - j;
        return (
          (TW[i + j * VW] * (1 - u) + TW[i + 1 + j * VW] * u) * (1 - v) +
          (TW[i + (j + 1) * VW] * (1 - u) + TW[i + 1 + (j + 1) * VW] * u) * v
        );
      },
      box = (x0, x1, z0, z1, fn) => {
        const i0 = Math.max(0, Math.floor((x0 + VH) / VC)),
          i1 = Math.min(VN, Math.ceil((x1 + VH) / VC)),
          j0 = Math.max(0, Math.floor((z0 + VH) / VC)),
          j1 = Math.min(VN, Math.ceil((z1 + VH) / VC));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(i + j * VW, -VH + i * VC, -VH + j * VC);
      },
      flat = (x, z, R1, R2, h) =>
        box(x - R2, x + R2, z - R2, z + R2, (q, px, pz) => {
          const d = Math.hypot(px - x, pz - z);
          if (d < R2) TW[q] = tlerp(TW[q], h, d < R1 ? 1 : sst(R2, R1, d));
        });
    for (const P of PLOTS)
      if (!save.vil.some(B => Math.hypot(B.x - P.x, B.z - P.z) < 11))
        flat(P.x, P.z, 8, 17, Math.max(0.45, smp(P.x, P.z)));
    const FL = [];
    for (const B of save.vil) {
      const R = rOf(B);
      if (R <= 1.5) continue;
      const up = CAT[B.t].up,
        Ra = R + (B.t === 'hall' ? 7 : up ? 3 : 0.5),
        h = Math.max(0.45, smp(B.x, B.z));
      FL.push([B.x, B.z, Ra, h]);
      flat(B.x, B.z, Ra + 1.5, Ra + (up ? 11 : 6), h);
    }
    for (const f of FL) flat(f[0], f[1], f[2] + 1.5, f[2] + 5, f[3]);
    for (const e of ROADS.edges) {
      const ha = smp(e.ax, e.az),
        hb = smp(e.bx, e.bz),
        vx = e.bx - e.ax,
        vz = e.bz - e.az,
        l2 = vx * vx + vz * vz || 1;
      box(
        Math.min(e.ax, e.bx) - 11,
        Math.max(e.ax, e.bx) + 11,
        Math.min(e.az, e.bz) - 11,
        Math.max(e.az, e.bz) + 11,
        (q, px, pz) => {
          const t = Math.max(0, Math.min(1, ((px - e.ax) * vx + (pz - e.az) * vz) / l2)),
            d = Math.hypot(px - e.ax - vx * t, pz - e.az - vz * t);
          if (d < 11) TW[q] = tlerp(TW[q], Math.max(0.45, ha + (hb - ha) * t), d < 4.2 ? 1 : sst(11, 4.2, d));
        }
      );
    }
    for (const f of FL) flat(f[0], f[1], f[2] + 0.6, f[2] + 4, f[3]);
  }
  for (let i = 0; i < NV; i++) {
    MH[i] = TW[i] - TH[i];
    if (TW[i] > MHtop) MHtop = TW[i];
  }
}
function mountSet(H) {
  MHc = Math.max(0, H || 0);
  terraBase();
  terraPlan();
}
function terrSetR(R) {
  RI = R;
  for (let i = 0; i < NV; i++) {
    const x = -VH + (i % VW) * VC,
      z = -VH + Math.floor(i / VW) * VC,
      r = Math.hypot(x, z),
      k = r > RI ? RI / r : 1;
    VPX[i] = x * k;
    VPZ[i] = z * k;
    TFIX[i] = r > RI - 5 || LGAMES.some(G => Math.hypot(G.x - x, G.z - z) < PADR) ? 1 : 0;
    if (TFIX[i]) TH[i] = 0;
  }
  TIDX = [];
  for (let j = 0; j < VN; j++)
    for (let i = 0; i < VN; i++) {
      if (Math.hypot(-VH + (i + 0.5) * VC, -VH + (j + 0.5) * VC) > RI + VC) continue;
      const a = i + j * VW,
        b = a + 1,
        c = a + VW + 1,
        d = a + VW;
      TIDX.push(a, d, b, b, d, c);
    }
  const n = TIDX.length,
    uv = new Float32Array(n * 2),
    g = new THREE.BufferGeometry();
  TP = new Float32Array(n * 3);
  TNo = new Float32Array(n * 3);
  TCo = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const i = TIDX[k];
    TP[k * 3] = VPX[i];
    TP[k * 3 + 2] = VPZ[i];
    uv[k * 2] = VPX[i] / 9;
    uv[k * 2 + 1] = VPZ[i] / 9;
  }
  g.setAttribute('position', new THREE.BufferAttribute(TP, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(TNo, 3));
  g.setAttribute('color', new THREE.BufferAttribute(TCo, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  terrM.geometry.dispose();
  terrM.geometry = g;
  lUnder.scale.setScalar((lUnderK * RI) / 38);
  for (const I of lIsles) {
    const k = (RI + 40) / 78;
    I.g.position.x = I.p[0] * k;
    I.g.position.z = I.p[2] * k;
  }
  lWater.scale.setScalar(RI - 1.2);
  LOBS.length = 0;
  for (const G of LGAMES) {
    G.v.position.set(G.x, 0, G.z);
    G.lab.position.set(G.x, 10.9, G.z);
    const c = Math.cos(G.ry),
      s = Math.sin(G.ry);
    for (const sd of [1, -1]) LOBS.push([G.x + c * sd * 4.1, G.z - s * sd * 4.1, 1.3]);
  }
  mountSet(MHc);
  terrDraw();
}
MHc = MTH[Math.max(1, Math.min(6, save.evo || 1))];
terrSetR(ILR[Math.max(1, Math.min(6, save.evo || 1)) - 1]);
// poussières d'étoiles qui montent, et étoiles filantes
const lmotes = (() => {
  const n = 110,
    im = new THREE.InstancedMesh(
      K.geo(K.make(1).add(K.oct(0.045), { c: 0xfff2c4 }).bake({ jit: 0 }).ch.m),
      new THREE.MeshBasicMaterial({ color: 0xfff2c4 }),
      n
    ),
    b = [];
  for (let i = 0; i < n; i++)
    b.push([(hsh(i, 1) - 0.5) * 76, hsh(i, 2) * 14, (hsh(i, 3) - 0.5) * 76, hsh(i, 4) * 6.28, 0.5 + hsh(i, 5)]);
  im.frustumCulled = false;
  lob.add(im);
  return { im, b, n };
})();
const lShoot = [];
for (let i = 0; i < 3; i++) {
  const m = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowT,
      color: 0xfff6dc,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    })
  );
  m.scale.set(26, 0.9, 1);
  m.visible = false;
  lob.add(m);
  lShoot.push({ m, t: 0, T: 1, p: [0, 0, 0], v: [0, 0, 0] });
}
let lShootT = 3;
