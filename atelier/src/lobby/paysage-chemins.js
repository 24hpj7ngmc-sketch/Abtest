// [lobby/paysage-chemins.js] Le paysage : rubans pavés des chemins, parvis, montagne, rochers qui planent, monument, astre.
// ---- les chemins : rubans pavés entre les parvis, parvis ronds sous chaque bâtiment à rôle, anneaux des parcelles libres. Un seul maillage, une seule matière.
function payRoads() {
  const P = PAY;
  if (P.road) {
    P.root.remove(P.road);
    P.road.geometry.dispose();
    P.road = null;
  }
  const pos = [],
    col = [],
    mid = K.mix(TC.pad, TC.sand, 0.25),
    edge = K.mix(TC.rockD, TC.pad, 0.4),
    drk = K.mix(TC.rockD, TC.pad, 0.15),
    V = (x, z, c, dy) => {
      pos.push(x, hAt(x, z) + (dy || 0.11), z);
      col.push(c[0], c[1], c[2]);
    },
    quad = (a, b, c, d) => {
      V(...a);
      V(...b);
      V(...c);
      V(...b);
      V(...d);
      V(...c);
    };
  ROADS.edges.forEach((e, k) => {
    const vx = e.bx - e.ax,
      vz = e.bz - e.az,
      L = Math.hypot(vx, vz),
      n = Math.max(1, Math.round(L / 2)),
      px = -vz / L,
      pz = vx / L,
      O = e.trail
        ? [
            [-1.5, edge],
            [-1.05, mid],
            [1.05, mid],
            [1.5, edge]
          ]
        : [
            [-2.4, edge],
            [-1.8, mid],
            [1.8, mid],
            [2.4, edge]
          ],
      dy = 0.11 + 0.012 * (k % 4);
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 1) / n,
        ax = e.ax + vx * t0,
        az = e.az + vz * t0,
        bx = e.ax + vx * t1,
        bz = e.az + vz * t1;
      for (let j = 0; j < 3; j++) {
        const o0 = O[j],
          o1 = O[j + 1],
          c0 = j === 1 ? (i % 2 ? mid : K.mix(mid, edge, 0.18)) : o0[1],
          c1 = j === 1 ? c0 : o1[1];
        quad(
          [ax + px * o0[0], az + pz * o0[0], c0, dy],
          [ax + px * o1[0], az + pz * o1[0], c1, dy],
          [bx + px * o0[0], bz + pz * o0[0], c0, dy],
          [bx + px * o1[0], bz + pz * o1[0], c1, dy]
        );
      }
    }
  });
  const ring = (x, z, r0, r1, c0, c1, dy) => {
    const n = Math.max(20, Math.round(r1 * 3.2));
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.2832,
        a1 = ((i + 1) / n) * 6.2832;
      quad(
        [x + Math.sin(a0) * r0, z + Math.cos(a0) * r0, c0, dy],
        [x + Math.sin(a0) * r1, z + Math.cos(a0) * r1, c1, dy],
        [x + Math.sin(a1) * r0, z + Math.cos(a1) * r0, c0, dy],
        [x + Math.sin(a1) * r1, z + Math.cos(a1) * r1, c1, dy]
      );
    }
  };
  for (const n of ROADS.nodes) {
    if (n.gate) continue;
    const r0 = Math.max(1, (n.R - (n.hall ? 7 : 3)) * 0.55);
    ring(n.x, n.z, r0, n.R - 0.7, mid, mid, 0.1);
    ring(n.x, n.z, n.R - 0.7, n.R, edge, edge, 0.1);
    if (n.hall) {
      ring(n.x, n.z, n.R - 3.6, n.R - 3.1, drk, drk, 0.13);
    }
  }
  for (const p of PLOTS)
    if (Math.hypot(p.x, p.z) < RI - 16 && !save.vil.some(B => Math.hypot(B.x - p.x, B.z - p.z) < 11)) {
      ring(p.x, p.z, 6.5, 7.3, edge, edge, 0.1);
      ring(p.x, p.z, 0.6, 1.5, drk, drk, 0.1);
    }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry(),
    nor = new Float32Array(pos.length);
  for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
  P.road = new THREE.Mesh(g, P.roadM);
  P.road.frustumCulled = false;
  P.root.add(P.road);
  // lanternes le long des chemins, en quinconce
  if (P.lamp) {
    let n = 0;
    for (const e of ROADS.edges) {
      const vx = e.bx - e.ax,
        vz = e.bz - e.az,
        L = Math.hypot(vx, vz),
        px = -vz / L,
        pz = vx / L;
      for (let d = 7, k = 0; d < L - 4 && n < P.lampN; d += e.trail ? 22 : 13, k++) {
        const sd = k % 2 ? 1 : -1,
          x = e.ax + (vx / L) * d + px * sd * (e.trail ? 2.3 : 3.3),
          z = e.az + (vz / L) * d + pz * sd * (e.trail ? 2.3 : 3.3);
        if (save.vil.some(B => Math.hypot(B.x - x, B.z - z) < rOf(B) + 0.8)) continue;
        DUM.position.set(x, hAt(x, z), z);
        DUM.rotation.set(0, Math.atan2(-px * sd, -pz * sd), 0);
        DUM.scale.setScalar(P.lampS);
        DUM.updateMatrix();
        for (const im of P.lamp) im.setMatrixAt(n, DUM.matrix);
        n++;
      }
    }
    for (const im of P.lamp) {
      im.count = n;
      im.visible = n > 0;
      im.instanceMatrix.needsUpdate = true;
    }
  }
}
// une rivière : un ruban qui suit le relief depuis le bord du sommet jusqu'au bord de l'île, puis tombe dans le vide
function payRivers() {
  const P = PAY,
    H = MHc,
    n = MASS.h > 3 ? Math.min(MASS.riv.length, H >= 22 ? 3 : H >= 12 ? 2 : H >= 3 ? 1 : 0) : 0;
  for (const R of P.riv) {
    P.root.remove(R.m);
    R.m.geometry.dispose();
  }
  P.riv = [];
  for (let k = 0; k < n; k++) {
    const V = MASS.riv[k],
      d = [V[2], V[3]],
      px = -d[1],
      pz = d[0],
      pts = [],
      s0 = Math.max(3, MASS.s0 || MASS.r * 0.2),
      mx = V[4] || 1e9;
    let s = s0,
      rim = false;
    for (; ; s += 1.5) {
      const off = Math.sin(s * 0.11 + k * 2.1) * 2.2 * sst(0, 12, s - s0),
        x = V[0] + d[0] * s + px * off,
        z = V[1] + d[1] * s + pz * off,
        r = Math.hypot(x, z);
      if (r > RI - 0.4) {
        rim = true;
        break;
      }
      if (pts.length > 230 || s - s0 > mx || (s - s0 > 8 && r < CORE && Math.hypot(V[0], V[1]) > CORE)) break;
      if (s - s0 > 8 && hAt(x, z) < -0.7) {
        pts.push([x, z, 2.2]);
        break;
      }
      pts.push([x, z, Math.min(2.2, 0.9 + pts.length * 0.03)]);
    }
    if (pts.length < 6) continue;
    const L = pts.length,
      E = pts[L - 1],
      er = Math.hypot(E[0], E[1]),
      ox = E[0] / er,
      oz = E[1] / er,
      drop = rim
        ? [
            [0.5, -0.4, 1],
            [1.1, -3, 1],
            [1.5, -9, 0.9],
            [1.8, -18, 0.6],
            [2, -30, 0.3],
            [2.1, -44, 0]
          ]
        : [],
      N = L + drop.length,
      pos = new Float32Array(N * 6),
      nor = new Float32Array(N * 6),
      uv = new Float32Array(N * 4);
    let len = 0,
      py = 0;
    for (let i = 0; i < N; i++) {
      let x,
        z,
        y,
        w,
        st = 0,
        al = 1;
      if (i < L) {
        [x, z, w] = pts[i];
        const a = pts[Math.max(0, i - 1)],
          b = pts[Math.min(L - 1, i + 1)],
          tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
          qx = -(b[1] - a[1]) / tl,
          qz = (b[0] - a[0]) / tl;
        const yl = hAt(x + qx * w, z + qz * w),
          yr = hAt(x - qx * w, z - qz * w),
          yc = hAt(x, z);
        y = yc;
        st = Math.min(1, Math.abs(hAt(a[0], a[1]) - hAt(b[0], b[1])) / (tl * 0.9));
        if (i > 0) len += Math.hypot(1.5, y - py);
        py = y;
        pos.set(
          [
            x + qx * w,
            Math.max(yl, yc - 0.3) + 0.14,
            z + qz * w,
            x - qx * w,
            Math.max(yr, yc - 0.3) + 0.14,
            z - qz * w
          ],
          i * 6
        );
        al = sst(0, 3, i) * (rim ? 1 : sst(L - 1, L - 5, i));
      } else {
        const D = drop[i - L];
        x = E[0] + ox * D[0];
        z = E[1] + oz * D[0];
        y = D[1];
        w = 1.7 + (i - L) * 0.25;
        len += Math.abs(y - py) * 0.8 + 0.4;
        py = y;
        st = 1;
        al = D[2];
        pos.set([x - oz * w, y, z + ox * w, x + oz * w, y, z - ox * w], i * 6);
      }
      nor.set([st, al, 0, st, al, 0], i * 6);
      uv.set([0, len / 4, 1, len / 4], i * 4);
    }
    const idx = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const P3 = new Float32Array(idx.length * 3),
      N3 = new Float32Array(idx.length * 3),
      U2 = new Float32Array(idx.length * 2);
    idx.forEach((q, j) => {
      P3.set(pos.subarray(q * 3, q * 3 + 3), j * 3);
      N3.set(nor.subarray(q * 3, q * 3 + 3), j * 3);
      U2.set(uv.subarray(q * 2, q * 2 + 2), j * 2);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P3, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N3, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
    const m = new THREE.Mesh(g, P.rivM);
    m.frustumCulled = false;
    P.root.add(m);
    P.riv.push({ m, pts });
  }
}
// la grotte : sur un flanc de la montagne, bouche tournée vers le dehors. Elle se déplace si un bâtiment prend sa place.
function payCave() {
  const P = PAY,
    H = MHc,
    name = 'pay.' + PTH[P.th] + '.grotte',
    CX = MASS.cave[0],
    CZ = MASS.cave[1];
  if (P.cave) {
    P.root.remove(P.cave);
    const i = llive.indexOf(P.cave);
    if (i >= 0) llive.splice(i, 1);
    P.cave = null;
  }
  P.caveAt = P.caveF = null;
  if (H < 8 || MASS.h < 6 || !payHas(name)) return;
  const Rm = MASS.cave[2];
  let best = null;
  for (const f of [0.82, 0.68, 0.54])
    for (const d of PCAVE) {
      const s = Rm * f,
        x = CX + d[0] * s,
        z = CZ + d[1] * s,
        bx = x - d[0] * 4,
        bz = z - d[1] * 4;
      if (Math.hypot(x, z) > RI - 14) continue;
      if (payNearRoad(x, z, 7)) continue;
      if (LGAMES.some(G => Math.hypot(G.x - x, G.z - z) < PADR + 12)) continue;
      if (save.vil.some(B => Math.hypot(B.x - bx, B.z - bz) < (rOf(B) > 1.5 ? rOf(B) * 1.25 + 6 : 3.5))) continue;
      const sl = (hAt(x - d[0] * 5, z - d[1] * 5) - hAt(x + d[0] * 5, z + d[1] * 5)) / 10;
      if (sl < 0.12) continue;
      const sc = Math.abs(sl - 0.55);
      if (!best || sc < best.sc) best = { sc, d, x, z, bx, bz };
    }
  if (best) {
    const { d, x, z, bx, bz } = best,
      g = mdlOf(name, {}, '', { cast: false });
    g.position.set(
      x,
      Math.min(hAt(x, z), hAt(x + d[0] * 3, z + d[1] * 3) + 0.25, hAt(x + d[0] * 5, z + d[1] * 5) + 0.7) - 0.3,
      z
    );
    g.rotation.y = Math.atan2(d[0], d[1]);
    P.root.add(g);
    P.cave = g;
    P.caveAt = [bx, bz];
    P.caveF = [x + d[0] * 8, z + d[1] * 8];
    if (g.userData.prep.parts.some(q => q.anim)) llive.push(g);
  }
}
// rochers qui planent autour du sommet, monument sur son île, astre
function payFlots() {
  const P = PAY,
    name = 'pay.' + PTH[P.th] + '.flot',
    n = payHas(name) ? Math.max(0, Math.min(5, Math.floor((MHc - 5) / 5))) : 0;
  while (P.flots.length > n) P.root.remove(P.flots.pop().g);
  while (P.flots.length < n) {
    const i = P.flots.length,
      g = mdlOf(name, { v: i % 2 }, 'v' + (i % 2), { cast: false });
    g.scale.multiplyScalar(0.9 + hsh(i, 91) * 0.5);
    P.root.add(g);
    P.flots.push({ g, a: i * 1.37 + 0.6, r: 10 + i * 6, h: 12 + i * 3.5, ph: i * 2.1 });
  }
}
function payMon() {
  const P = PAY,
    name = 'pay.' + PTH[P.th] + '.monument';
  if (P.mon && P.monTh !== P.th) {
    P.monG.remove(P.mon);
    const i = llive.indexOf(P.mon);
    if (i >= 0) llive.splice(i, 1);
    P.mon = null;
  }
  if (!P.mon && payHas(name)) {
    P.mon = mdlOf(name, {}, '', { cast: false });
    P.monG.add(P.mon);
    P.monTh = P.th;
    if (P.mon.userData.prep.parts.some(q => q.anim)) llive.push(P.mon);
  }
  const R = RI + 38;
  P.monG.scale.setScalar(2.6);
  P.monG.position.set(-R * 0.86, 12, R * 0.51);
  P.monG.rotation.y = Math.atan2(0.86, -0.51);
  P.monY = 12;
  P.monG.visible = true;
  P.monRock.material.color.setRGB(TC.rock[0], TC.rock[1], TC.rock[2]);
  P.monRock2.material.color.setRGB(TC.rock[0] * 0.72, TC.rock[1] * 0.72, TC.rock[2] * 0.72);
  P.monTop.material.color.setRGB(TC.a[0], TC.a[1], TC.a[2]);
}
function paySky() {
  const P = PAY,
    S = PSKY[P.th];
  P.skyG.visible = !!S[1];
  if (!S[1]) return;
  P.skyB.material.color.setHex(S[0]);
  P.skyB.scale.setScalar(S[1]);
  P.skyR.visible = !!S[2];
  if (S[2]) {
    P.skyR.material.color.setHex(S[2]);
    P.skyR.scale.setScalar(S[1]);
  }
  P.skyM.visible = !!S[3];
  P.skyM.scale.setScalar(S[1]);
  P.skyM.position.set(-2.6 * S[1], 0.9 * S[1], 0.4 * S[1]);
}
