// [affichage/themes.js] Les thèmes de la campagne : un décor par type (Feu, Eau, Terre, Élec, Nature, Vent) — ciel, lumière, sol, volcans, étangs, cristaux.
// ---------- LES THÈMES DE LA CAMPAGNE (V9.5) : on doit comprendre au premier regard dans quel type on est, sans aller dans le détail (demande de Frédéric) ----------
// Même île, mêmes chemins, mêmes règles. Un thème change : la teinte du ciel et du brouillard, la lumière, la teinte du sol, les familles de végétation cachées,
// et pose quelques éléments (volcans et lave, étangs et rivières, rochers et crevasses, cristaux, arbres géants). Les gros éléments arrêtent le héros (SOL) ; la lave et l'eau sont un simple dessin.
// setTheme(type) est appelé au début de chaque partie ; '' = l'île d'origine (partie libre).
const THEMES = {
  feu: {
    sky: [1.22, 0.62, 0.42],
    fog: 0xd08a62,
    g: [0.86, 0.42, 0.38],
    cap: 0x4a2a24,
    sun: 0xffb070,
    si: 0.95,
    hem: 0.6,
    hide: /^nat\.(pin|arbre\d|buisson|fleur|fougere|herbe|champi|palmier|roseaux)/
  },
  eau: {
    sky: [0.78, 1, 1.12],
    fog: 0xa9dcee,
    g: [0.62, 0.98, 1.42],
    cap: 0x3d9c8c,
    sun: 0xf2f8ff,
    si: 1,
    hem: 0.72,
    hide: null
  },
  terre: {
    sky: [1.12, 0.96, 0.74],
    fog: 0xe3cfa2,
    g: [1.5, 0.72, 0.8],
    cap: 0xa98a5c,
    sun: 0xffe2b0,
    si: 1.05,
    hem: 0.66,
    hide: /^nat\.(pin|arbre\d|buisson|fleur|fougere|herbe|champi|roseaux|palmier)/
  },
  elec: {
    sky: [0.5, 0.44, 0.74],
    fog: 0x6f6796,
    g: [0.92, 0.62, 1.22],
    cap: 0x564a6c,
    sun: 0xe9dcff,
    si: 0.72,
    hem: 0.56,
    hide: /^nat\.(pin|arbre\d|buisson|fleur|fougere|herbe|champi|palmier|roseaux)/
  },
  vent: {
    sky: [0.9, 1.08, 1.14],
    fog: 0xc6e4e2,
    g: [0.98, 1.06, 0.72],
    cap: 0x9db8a6,
    sun: 0xf4fbff,
    si: 1.04,
    hem: 0.76,
    hide: /^nat\.(arbre\d|buisson|fleur|champi|palmier)/
  },
  bois: {
    sky: [0.8, 1.06, 0.8],
    fog: 0xb2d8a6,
    g: [0.5, 0.82, 0.5],
    cap: 0x2f6a36,
    sun: 0xf3ffd8,
    si: 0.92,
    hem: 0.7,
    hide: null
  }
};
const themeG = new THREE.Group();
scene.add(themeG);
let themeNow = null,
  themeSol = [];
function themeSpots(n, seed, r0, r1, minPath, gap, taken) {
  const rnd = K.rng(seed),
    out = [];
  for (let k = 0; k < n * 60 && out.length < n; k++) {
    const a = rnd() * 6.2832,
      r = r0 + rnd() * (r1 - r0),
      x = Math.cos(a) * r,
      z = Math.sin(a) * r,
      c = cellOf(x, z);
    if (HILL[c] || distPaths(x, z) < minPath || Math.hypot(x - SHOP[0], z - SHOP[1]) < 10) continue;
    if ((taken || []).concat(out).some(q => Math.hypot(q[0] - x, q[1] - z) < gap)) continue;
    out.push([x, z, rnd(), rnd()]);
  }
  return out;
}
// un ruban au sol (rivière d'eau ou de lave) : il part du rivage entre deux chemins et serpente vers le centre ; il s'interrompt sous les chemins et les collines
function themeRivers(b, col, ch, w) {
  const A = BOATS.map(B => Math.atan2(B[1], B[0])).sort((p, q) => p - q);
  for (let i = 0; i < A.length; i++) {
    const a0 = A[i],
      a1 = i + 1 < A.length ? A[i + 1] : A[0] + 6.2832,
      am = (a0 + a1) / 2;
    let L = [],
      R = [];
    const flush = () => {
      if (L.length > 1) b.add(K.prism(L.concat(R.slice().reverse()), 0.05, { y0: 0.04 }), { c: col, ch, jit: 0 });
      L = [];
      R = [];
    };
    for (let r = R_ISLE - 7; r >= 30; r -= 3) {
      const a = am + 0.1 * Math.sin(r * 0.085 + i * 2.1),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r,
        ww = w * (0.7 + 0.5 * (r / R_ISLE));
      if (HILL[cellOf(x, z)] || distPaths(x, z) < ww + 2.6) {
        flush();
        continue;
      }
      const tx = -Math.sin(a),
        tz = Math.cos(a);
      L.push([x + (tx * ww) / 2, z + (tz * ww) / 2]);
      R.push([x - (tx * ww) / 2, z - (tz * ww) / 2]);
    }
    flush();
  }
}
function setTheme(el) {
  el = THEMES[el] ? el : '';
  if (themeNow === el) return;
  themeNow = el;
  const T = THEMES[el] || { sky: [1, 1, 1], fog: HORIZON, g: [1, 1, 1], sun: 0xfff0d2, si: 1, hem: 0.68, hide: null };
  sky.material.uniforms.tint.value.set(T.sky[0], T.sky[1], T.sky[2]);
  scene.background.setHex(T.fog);
  scene.fog.color.setHex(T.fog);
  seaU.fogCol.value.setHex(T.fog);
  grassM.color.setRGB(T.g[0], T.g[1], T.g[2]);
  sun.color.setHex(T.sun);
  sun.intensity = T.si;
  hemi.intensity = T.hem;
  for (const n in SOWN) for (const im of SOWN[n]) im.visible = !(T.hide && T.hide.test(n));
  while (themeG.children.length) {
    const m = themeG.children[0];
    themeG.remove(m);
    if (m.userData.own) m.geometry.dispose();
  }
  for (const q of themeSol) {
    const i = SOL.indexOf(q);
    if (i >= 0) SOL.splice(i, 1);
  }
  themeSol = [];
  if (!el) return;
  const b = K.make(900 + el.length * 7 + el.charCodeAt(0)),
    solid = (x, z, r, h) => {
      const q = [x, z, r, h];
      SOL.push(q);
      themeSol.push(q);
    };
  for (let i = 0; i < GN * GN; i++)
    if (HILL[i]) b.add(K.box(CELL, 0.08, CELL), { p: [cellX(i), HILL[i] * WALLH + 0.03, cellZ(i)], c: T.cap, jit: 0 }); // le dessus des collines prend la teinte du thème
  if (el === 'feu') {
    const V = themeSpots(10, 11, 40, 106, 12, 17);
    for (const v of V) {
      const r = 5 + v[2] * 3.5,
        h = 6 + v[3] * 5;
      b.add(K.cyl(r * 0.34, r, h, 9), { p: [v[0], h / 2, v[1]], c: 0x2e2422, c2: 0x5a3a30 });
      b.add(K.cyl(r * 0.28, r * 0.3, 0.5, 9), { p: [v[0], h + 0.05, v[1]], c: 0xff7a1e, ch: 'g', jit: 0 });
      b.add(K.cyl(r * 1.25, r * 1.25, 0.06, 10), { p: [v[0], 0.07, v[1]], c: 0xff5a14, ch: 'g', jit: 0 });
      solid(v[0], v[1], r * 0.8, h);
    } // un anneau de lave au pied
    themeRivers(b, 0xff5a14, 'g', 3.4);
    for (const v of themeSpots(16, 12, 26, 104, 5, 8, V))
      b.add(K.cyl(2 + v[2] * 2.2, 2 + v[2] * 2.2, 0.06, 10), {
        p: [v[0], 0.06, v[1]],
        s: [1, 1, 0.6 + v[3] * 0.4],
        c: 0xff6a1e,
        ch: 'g',
        jit: 0
      });
    for (const v of themeSpots(34, 13, 24, 108, 4, 5))
      b.add(K.rock(0.7 + v[2] * 1.3, 3 + Math.floor(v[3] * 9), 1), { p: [v[0], 0.3, v[1]], c: 0x2a2220, c2: 0x4a302a });
  } else if (el === 'eau') {
    themeRivers(b, 0x3fa9ff, 's', 5);
    const P = themeSpots(20, 21, 22, 106, 5, 12);
    for (const v of P) {
      const r = 5 + v[2] * 6,
        sz = 0.6 + v[3] * 0.4;
      b.add(K.cyl(r, r, 0.06, 14), { p: [v[0], 0.06, v[1]], s: [1, 1, sz], c: 0x3fa9ff, ch: 's', jit: 0 });
      b.add(K.cyl(r + 0.5, r + 0.5, 0.04, 14), { p: [v[0], 0.03, v[1]], s: [1, 1, sz], c: 0xcdb98a, jit: 0 });
      for (let k = 0; k < 3; k++) {
        const a = v[2] * 6 + k * 2.2,
          d = r * 0.5;
        b.add(K.cyl(0.5, 0.5, 0.05, 7), {
          p: [v[0] + Math.cos(a) * d, 0.12, v[1] + Math.sin(a) * d * sz],
          c: 0x4f9a52,
          jit: 0
        });
      }
    }
    {
      const RZ = [];
      for (const v of P) {
        const r = 5 + v[2] * 6;
        for (let k = 0; k < 5; k++) {
          const a = v[3] * 6 + k * 1.26;
          RZ.push([
            v[0] + Math.cos(a) * (r + 0.4),
            0,
            v[1] + Math.sin(a) * (r + 0.4) * (0.6 + v[3] * 0.4),
            a,
            1.5 + ((k * 7) % 3) * 0.3
          ]);
        }
      }
      sow('nat.roseaux', RZ, { par: themeG, cast: false });
    } // des roseaux au bord des étangs
    for (const v of themeSpots(14, 22, 28, 108, 4, 6, P))
      b.add(K.rock(0.6 + v[2] * 0.9, 2 + Math.floor(v[3] * 9), 1), {
        p: [v[0], 0.25, v[1]],
        c: 0x6f8f9a,
        c2: 0x4d6d7a
      });
  } else if (el === 'terre') {
    const M = themeSpots(11, 31, 38, 106, 11, 15);
    for (const v of M) {
      const r = 3.2 + v[2] * 3;
      b.add(K.rock(r, 5 + Math.floor(v[3] * 9), 1), {
        p: [v[0], r * 0.55, v[1]],
        s: [1, 0.75 + v[3] * 0.5, 1],
        c: 0x9a7a52,
        c2: 0x6e5236
      });
      solid(v[0], v[1], r * 0.85, r * 1.2);
    }
    for (const v of themeSpots(56, 32, 22, 110, 3.5, 4, M))
      b.add(K.rock(0.6 + v[2] * 1.5, 1 + Math.floor(v[3] * 12), 1), {
        p: [v[0], 0.3, v[1]],
        c: 0xa98a62,
        c2: 0x7a5c3c
      });
    for (const v of themeSpots(44, 33, 20, 108, 3, 4))
      b.add(K.box(0.22, 0.05, 2 + v[2] * 3.5), { p: [v[0], 0.05, v[1]], r: [0, v[3] * 6.28, 0], c: 0x4a3524, jit: 0 });
  } else if (el === 'elec') {
    const C = themeSpots(28, 41, 24, 106, 5.5, 9);
    for (const v of C) {
      const n = 3 + Math.floor(v[2] * 2.99);
      for (let k = 0; k < n; k++) {
        const a = v[3] * 6 + k * 2.4,
          d = k ? 1.1 + k * 0.25 : 0,
          h = (k ? 2.2 : 4.5) + v[2] * 3.2,
          r = k ? 0.5 : 0.85;
        b.add(K.cyl(0, r, h, 5), {
          p: [v[0] + Math.cos(a) * d, h / 2, v[1] + Math.sin(a) * d],
          r: [k ? 0.28 * Math.cos(a) : 0, 0, k ? -0.28 * Math.sin(a) : 0],
          c: 0xffe45c,
          c2: 0xb58a1a,
          ch: 's'
        });
      }
      b.add(K.cyl(2.4, 2.4, 0.05, 10), { p: [v[0], 0.05, v[1]], c: 0x2e2a44, jit: 0 });
      b.add(K.oct(0.38), { p: [v[0], 6.1 + v[2] * 3.2, v[1]], c: 0xfff6b0, ch: 'g', jit: 0 });
    }
    for (const v of themeSpots(16, 42, 26, 108, 4, 6, C))
      b.add(K.rock(0.6 + v[2] * 1.1, 4 + Math.floor(v[3] * 9), 1), { p: [v[0], 0.3, v[1]], c: 0x4a4466, c2: 0x2e2a44 });
  } else if (el === 'vent') {
    // VENT (V2.2) : des îles balayées par les rafales. Arches de roche creusées par le vent, moulins, fanions couchés, traînées d'herbe pâle, toutes dans le sens du vent.
    const W = 0.6,
      wx = Math.cos(W),
      wz = Math.sin(W),
      A = themeSpots(8, 61, 38, 104, 12, 16);
    for (const v of A) {
      const h = 5 + v[2] * 3,
        g = 3.2 + v[3] * 1.6,
        a = W + Math.PI / 2;
      for (const sd of [-1, 1]) {
        const px = v[0] + Math.cos(a) * g * sd,
          pz = v[1] + Math.sin(a) * g * sd;
        b.add(K.rock(1.1 + v[3] * 0.4, 7 + Math.floor(v[2] * 9), 1), {
          p: [px, h / 2, pz],
          s: [0.9, h / 2.2, 0.9],
          c: 0xb9b19a,
          c2: 0x8c8470
        });
        solid(px, pz, 1.1, h);
      }
      b.add(K.box(g * 2 + 2.4, 1.3, 2), { p: [v[0], h + 0.3, v[1]], r: [0, -a, 0], c: 0xc4bca4, c2: 0x9a927c });
    } // une arche : deux piliers et un linteau
    const M = themeSpots(6, 62, 44, 102, 10, 14, A);
    for (const v of M) {
      const h = 7 + v[2] * 2;
      b.add(K.cyl(1.1, 1.7, h, 8), { p: [v[0], h / 2, v[1]], c: 0xe9e2cf, c2: 0xc9c0a8 });
      b.add(K.cone(1.6, 1.8, 8), { p: [v[0], h + 0.9, v[1]], c: 0x6f8c8a, c2: 0x4f6866 });
      const hx = v[0] - wx * 1.7,
        hz = v[1] - wz * 1.7;
      for (let k = 0; k < 4; k++)
        b.add(K.box(0.5, 5.2, 0.12), {
          p: [hx, h - 0.4, hz],
          r: [0, -W + Math.PI / 2, k * 1.5708 + v[3]],
          c: 0xf6f1e2,
          c2: 0x8fe6dc
        });
      solid(v[0], v[1], 1.7, h);
    } // des moulins, ailes face au vent
    for (const v of themeSpots(22, 63, 24, 108, 4, 6, A.concat(M))) {
      const h = 2.6 + v[2] * 1.6;
      b.add(K.cyl(0.07, 0.09, h, 5), { p: [v[0], h / 2, v[1]], c: 0x6e5a44 });
      b.add(K.box(1.5, 0.5, 0.04), {
        p: [v[0] + wx * 0.75, h - 0.35, v[1] + wz * 0.75],
        r: [0, -W, -0.12],
        c: 0x8fe6dc,
        c2: 0x3f8f88,
        jit: 0
      });
    } // des fanions couchés par le vent
    for (const v of themeSpots(44, 64, 22, 110, 3, 3.5))
      b.add(K.cyl(0.5, 0.5, 0.04, 8), {
        p: [v[0], 0.05, v[1]],
        r: [0, -W, 0],
        s: [5 + v[2] * 5, 1, 0.5],
        c: 0xe9f0cf,
        jit: 0
      }); // des traînées d'herbe pâle dans le sens du vent
    for (const v of themeSpots(18, 65, 26, 108, 4, 6, A.concat(M)))
      b.add(K.rock(0.5 + v[2] * 0.8, 3 + Math.floor(v[3] * 9), 1), {
        p: [v[0], 0.25, v[1]],
        c: 0xb0a890,
        c2: 0x857d68
      });
  } else if (el === 'bois') {
    const G = themeSpots(18, 51, 30, 106, 8, 12);
    sow(
      'nat.arbre1',
      G.map(v => [v[0], 0, v[1], v[2] * 6.28, 2.3 + v[3] * 0.9]),
      { par: themeG }
    );
    for (const v of G) solid(v[0], v[1], 1.1, 12);
    const Mu = themeSpots(16, 52, 24, 104, 5, 8, G);
    sow(
      'nat.champi',
      Mu.map(v => [v[0], 0, v[1], v[2] * 6.28, 7 + v[3] * 5]),
      { par: themeG }
    );
    for (const v of Mu) solid(v[0], v[1], 0.7, 3);
    sow(
      'nat.fougere',
      themeSpots(46, 53, 24, 110, 3, 3).map(v => [v[0], 0, v[1], v[2] * 6.28, 1.6 + v[3] * 1.2]),
      { par: themeG, cast: false }
    );
    for (const v of themeSpots(10, 54, 30, 104, 5, 9, G.concat(Mu)))
      b.add(K.cyl(2.2 + v[2] * 2, 2.2 + v[2] * 2, 0.05, 9), {
        p: [v[0], 0.05, v[1]],
        s: [1, 1, 0.7],
        c: 0x3f7a3a,
        c2: 0x5aa04a,
        jit: 0
      });
  }
  const bk = b.bake({ jit: 0.06, ground: 0.25, groundH: 1.2 });
  for (const ch in bk.ch) {
    const m = new THREE.Mesh(K.geo(bk.ch[ch]), K.MAT[ch]);
    m.userData.own = true;
    m.castShadow = m.receiveShadow = ch === 'm' || ch === 's';
    themeG.add(m);
  }
}
const clouds = new THREE.Group();
scene.add(clouds);
const gulls = [];
let boat = null;
(function () {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647,
    TA = 6.2832,
    keep = [
      [0, 0, 10.5],
      [SHOP[0], SHOP[1], 5.5],
      [4, 12, 2.5]
    ];
  for (const p of PATHS) keep.push([p.pts[0][0], p.pts[0][1], 8.5]);
  const clear = (x, z) => {
    for (const k of keep) if (Math.hypot(x - k[0], z - k[1]) < k[2]) return false;
    return Math.hypot(x, z) < R_ISLE - 5;
  };
  const free = (x, z, min) => distPaths(x, z) >= min && !HILL[cellOf(x, z)] && clear(x, z);
  const spot = (min, rin) => {
    for (let k = 0; k < 40; k++) {
      const a = rnd() * TA,
        r = (rin || 0) + Math.sqrt(rnd()) * (R_ISLE - 7 - (rin || 0)),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (free(x, z, min)) return [x, z];
    }
    return null;
  };
  const L = {},
    lay = (n, x, y, z, ry, s, rx, rz) => {
      (L[n] = L[n] || []).push([x, y, z, ry === undefined ? rnd() * TA : ry, s || 1, rx || 0, rz || 0]);
    },
    pick = a => a[Math.floor(rnd() * a.length)];
  // --- les cinq pierres levées, alignées sur les cinq piliers du cœur : on tourne le sanctuaire pour qu'aucune ne tombe sur un chemin
  {
    const pil = (
      coreV.userData.prep.pillars || ELS.map((el, i) => ({ el, x: Math.sin((i * TA) / 5), z: Math.cos((i * TA) / 5) }))
    ).map(q => ({ el: q.el, a: Math.atan2(q.x, q.z) }));
    let best = 0,
      bd = -1;
    for (let k = 0; k < 72; k++) {
      const ry = (k * TA) / 72;
      let m = 1e9;
      for (const q of pil) {
        const x = Math.sin(q.a + ry) * 27,
          z = Math.cos(q.a + ry) * 27;
        m = Math.min(m, HILL[cellOf(x, z)] ? 0 : distPaths(x, z));
      }
      if (m > bd) {
        bd = m;
        best = ry;
      }
    }
    coreV.rotation.y = best;
    for (const q of pil) {
      const x = Math.sin(q.a + best) * 27,
        z = Math.cos(q.a + best) * 27;
      put('set.monolithe', x, 0, z, q.a + best + Math.PI, elCtx(q.el), q.el);
      keep.push([x, z, 3.2]);
      SOL.push([x, z, 0.85, 5]);
    }
  }
  // --- le long des chemins : lanternes, statues de gardiens, barrières, poteaux indicateurs
  const lampPr = prepOf('set.lanterne'),
    lampA = lampPr.lamp ? Math.atan2(lampPr.lamp[0], lampPr.lamp[2]) : 0,
    lamps = [];
  PATHS.forEach((p, pi) => {
    let side = pi % 2 ? 1 : -1;
    for (let d = 13; d < p.len - 10; d += 29) {
      const q = posAt(p, p.len - d);
      side = -side;
      for (const sd of [side, -side]) {
        const x = q[0] - q[3] * sd * (PATH_HALF + 1.5),
          z = q[1] + q[2] * sd * (PATH_HALF + 1.5);
        if (
          distPaths(x, z) < PATH_HALF + 1.1 ||
          !clear(x, z) ||
          HILL[cellOf(x, z)] ||
          lamps.some(l => Math.hypot(l[0] - x, l[1] - z) < 9)
        )
          continue;
        lamps.push([x, z]);
        lay('set.lanterne', x, 0, z, Math.atan2(q[3] * sd, -q[2] * sd) - lampA);
        keep.push([x, z, 1.4]);
        break;
      }
    }
    {
      const q = posAt(p, p.len - 33);
      for (const sd of [1, -1]) {
        const x = q[0] - q[3] * sd * (PATH_HALF + 3.2),
          z = q[1] + q[2] * sd * (PATH_HALF + 3.2);
        if (distPaths(x, z) < PATH_HALF + 2.6 || HILL[cellOf(x, z)]) continue;
        lay('set.statue', x, 0, z, Math.atan2(-q[2], -q[3]));
        keep.push([x, z, 3]);
        break;
      }
    }
    for (const d of [52, 88]) {
      const q = posAt(p, p.len - d),
        sd = rnd() < 0.5 ? 1 : -1,
        x = q[0] - q[3] * sd * (PATH_HALF + 2),
        z = q[1] + q[2] * sd * (PATH_HALF + 2);
      if (distPaths(x, z) >= PATH_HALF + 1.6 && clear(x, z) && !HILL[cellOf(x, z)]) {
        lay('set.barriere', x, 0, z, Math.atan2(-q[3], q[2]) + (rnd() - 0.5) * 0.12);
        keep.push([x, z, 2.4]);
      }
    }
    {
      const q = posAt(p, 22),
        sd = pi % 2 ? 1 : -1,
        x = q[0] - q[3] * sd * (PATH_HALF + 1.7),
        z = q[1] + q[2] * sd * (PATH_HALF + 1.7);
      if (distPaths(x, z) >= PATH_HALF + 1.3) {
        lay('set.panneau', x, 0, z, Math.atan2(q[2], q[3]) + 0.4);
        keep.push([x, z, 1.5]);
      }
    }
  });
  // --- autour du marchand : caisses et tonneaux ; près du cœur : colonnade en ruine
  {
    const c = Math.cos(shopRy),
      s = Math.sin(shopRy);
    for (const o of [
      [-3.1, -0.4],
      [3, -1.3]
    ]) {
      const x = SHOP[0] + o[0] * c + o[1] * s,
        z = SHOP[1] - o[0] * s + o[1] * c;
      if (distPaths(x, z) > PATH_HALF + 1.2) lay('set.caisses', x, 0, z, shopRy + rnd() * 0.8 - 0.4, 0.85);
    }
  }
  for (let i = 0; i < 11; i++) {
    const a = (i * TA) / 11 + 0.21,
      r = 15.5 + rnd() * 2.5,
      x = Math.sin(a) * r,
      z = Math.cos(a) * r;
    if (distPaths(x, z) < PATH_HALF + 2.4 || !clear(x, z)) continue;
    lay('set.colonne', x, 0, z, rnd() * TA, 0.9 + rnd() * 0.3);
    keep.push([x, z, 2.2]);
  }
  for (let i = 0; i < 5; i++) {
    const q = spot(7, 30);
    if (q) {
      lay('set.colonne', q[0], 0, q[1], rnd() * TA, 0.85 + rnd() * 0.35);
      keep.push([q[0], q[1], 2.2]);
    }
  }
  for (let i = 0; i < 3; i++) {
    const q = spot(9, 42);
    if (q) {
      lay('set.arche', q[0], 0, q[1], rnd() * TA);
      keep.push([q[0], q[1], 4.2]);
    }
  }
  // --- bosquets : chaque bosquet a son essence dominante (pins ou feuillus) ; arbres isolés entre deux
  const PIN = ['nat.pin1', 'nat.pin2', 'nat.pin3'],
    LEAF = ['nat.arbre1', 'nat.arbre2', 'nat.arbre3'],
    trees = [],
    groves = [];
  const tree = (x, z, names, s) => {
    for (const t of trees) if (Math.hypot(x - t[0], z - t[1]) < 3.3) return;
    if (!free(x, z, 5.4)) return;
    trees.push([x, z]);
    lay(pick(names), x, 0, z, undefined, s);
  };
  for (let g = 0; g < 17; g++) {
    const c = spot(9, 14);
    if (!c) continue;
    const pine = rnd() < 0.5,
      n = 5 + Math.floor(rnd() * 7);
    groves.push(c);
    GROVES.push([c[0], c[1], 5.5 + n * 0.55, pine]);
    for (let i = 0; i < n; i++) {
      const a = rnd() * TA,
        r = Math.sqrt(rnd()) * (5.5 + n * 0.55);
      tree(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, rnd() < 0.84 === pine ? PIN : LEAF, 0.8 + rnd() * 0.5);
    }
  }
  for (let i = 0; i < 34; i++) {
    const q = spot(5.6, 12);
    if (q) tree(q[0], q[1], rnd() < 0.45 ? PIN : LEAF, 0.9 + rnd() * 0.55);
  }
  for (let i = 0; i < 6; i++) {
    const q = spot(6, 20);
    if (q) lay('nat.arbreMort', q[0], 0, q[1], undefined, 0.9 + rnd() * 0.4);
  }
  // --- sous-bois : buissons et fougères au pied des bosquets, champignons contre les troncs, souches et troncs couchés
  const near = (c, r0, r1) => {
    const a = rnd() * TA,
      r = r0 + rnd() * (r1 - r0);
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r];
  };
  for (let i = 0; i < 84; i++) {
    const q = i < 52 && groves.length ? near(pick(groves), 2, 11) : spot(4.2);
    if (q && free(q[0], q[1], 4.2))
      lay(rnd() < 0.6 ? 'nat.buisson1' : 'nat.buisson2', q[0], 0, q[1], undefined, 0.75 + rnd() * 0.6);
  }
  for (let i = 0; i < 76; i++) {
    const q = groves.length ? near(pick(groves), 1.5, 10) : spot(4);
    if (q && free(q[0], q[1], 3.6)) lay('nat.fougere', q[0], 0, q[1], undefined, 0.8 + rnd() * 0.6);
  }
  for (let i = 0; i < 24 && trees.length; i++) {
    const q = near(pick(trees), 0.9, 1.7);
    if (free(q[0], q[1], 3.4)) lay('nat.champi', q[0], 0, q[1], undefined, 0.8 + rnd() * 0.5);
  }
  for (let i = 0; i < 10; i++) {
    const q = spot(5);
    if (q) lay('nat.souche', q[0], 0, q[1], undefined, 0.9 + rnd() * 0.4);
  }
  for (let i = 0; i < 8; i++) {
    const q = spot(6);
    if (q) {
      lay('nat.tronc', q[0], 0, q[1], undefined, 0.9 + rnd() * 0.3);
      keep.push([q[0], q[1], 2]);
    }
  }
  // --- rochers : blocs isolés, éboulis au pied des collines, cailloux au bord des chemins
  for (let i = 0; i < 9; i++) {
    const q = spot(6.5);
    if (q) {
      lay('nat.rocherMousse', q[0], 0, q[1], undefined, 0.8 + rnd() * 0.5);
      keep.push([q[0], q[1], 2.6]);
    }
  }
  for (let i = 0; i < 54; i++) {
    const q = spot(4);
    if (q) lay(pick(['nat.rocher1', 'nat.rocher2', 'nat.rocher3']), q[0], 0, q[1], undefined, 0.6 + rnd() * 0.9);
  }
  for (let i = 0; i < GN * GN; i++) {
    const h = HILL[i];
    if (!h) continue;
    const cx = i % GN,
      cz = (i / GN) | 0;
    for (const s of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const lo = HILL[cx + s[0] + (cz + s[1]) * GN] || 0;
      if (lo >= h || rnd() < 0.45) continue;
      const x = cellX(i) + s[0] * (CELL / 2 + 0.25) + (s[0] ? 0 : (rnd() - 0.5) * 3.4),
        z = cellZ(i) + s[1] * (CELL / 2 + 0.25) + (s[1] ? 0 : (rnd() - 0.5) * 3.4);
      if (distPaths(x, z) > PATH_HALF + 1)
        lay(pick(['nat.rocher1', 'nat.rocher3', 'nat.rocher2']), x, lo * WALLH, z, undefined, 0.45 + rnd() * 0.6);
    }
  }
  for (const p of PATHS)
    for (const g of p.seg)
      for (let u = 0.6; u < g.l; u += 0.9 + rnd() * 1.6)
        for (const sd of [1, -1])
          if (rnd() < 0.62) {
            const o = sd * (PATH_HALF + 0.3 + rnd() * 0.5),
              x = g.a[0] + g.dx * u - g.dz * o,
              z = g.a[1] + g.dz * u + g.dx * o;
            if (distPaths(x, z) > PATH_HALF + 0.1 && Math.hypot(x, z) > 6)
              lay('nat.caillou', x, 0, z, undefined, 0.7 + rnd() * 1.1);
          }
  // --- clairières : fleurs par taches d'une même espèce, touffes d'herbe partout (jusque sur les collines)
  for (let i = 0; i < 30; i++) {
    const c = spot(3.4),
      nm = pick(['nat.fleur1', 'nat.fleur2', 'nat.fleur3']);
    if (!c) continue;
    for (let k = 0; k < 7; k++) {
      const q = near(c, 0, 3.2);
      if (free(q[0], q[1], 3)) lay(nm, q[0], 0, q[1], undefined, 0.8 + rnd() * 0.5);
    }
  }
  for (let i = 0; i < 760; i++) {
    const a = rnd() * TA,
      r = Math.sqrt(rnd()) * (R_ISLE - 6),
      x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    if (distPaths(x, z) < 2.9 || !clear(x, z)) continue;
    lay('nat.herbe', x, HILL[cellOf(x, z)] * WALLH, z, undefined, 0.7 + rnd() * 0.9);
  }
  // --- plage : palmiers, roseaux à la limite de l'eau, bois flotté ; au large : écueils et îlots dans la brume
  for (let i = 0; i < 17; i++) {
    const a = rnd() * TA,
      r = R_ISLE - 0.5 + rnd() * 3.2;
    lay('nat.palmier', Math.sin(a) * r, -0.12, Math.cos(a) * r, undefined, 0.85 + rnd() * 0.4);
  }
  for (let i = 0; i < 36; i++) {
    const a = rnd() * TA,
      r = 125.1 + rnd() * 1.1;
    lay('nat.roseaux', Math.sin(a) * r, -0.72 - (r - 125.2) * 0.49, Math.cos(a) * r, undefined, 0.8 + rnd() * 0.5);
  }
  for (let i = 0; i < 7; i++) {
    const a = rnd() * TA,
      r = 120 + rnd() * 3;
    lay(
      pick(['nat.rocher2', 'nat.tronc', 'nat.rocher1']),
      Math.sin(a) * r,
      -0.12,
      Math.cos(a) * r,
      undefined,
      0.6 + rnd() * 0.5
    );
  }
  for (let i = 0; i < 10; i++) {
    const a = rnd() * TA,
      r = 142 + rnd() * 95;
    lay('nat.recif', Math.sin(a) * r, -1.3, Math.cos(a) * r, undefined, 0.6 + rnd() * 0.8);
  }
  [
    [0.9, 360, 1.1],
    [2.7, 410, 1.4],
    [4.6, 340, 0.9]
  ].forEach(q => lay('nat.ilot', Math.sin(q[0]) * q[1], -1.3, Math.cos(q[0]) * q[1], rnd() * TA, q[2]));
  // --- le ponton et sa barque, au sud
  {
    const a = 0.24,
      sx = Math.sin(a),
      cz = Math.cos(a);
    lay('set.ponton', sx * 125.6, -0.62, cz * 125.6, a);
    lay('set.caisses', sx * 121.4 + cz * 1.9, -0.12, cz * 121.4 - sx * 1.9, a + 0.6, 0.8);
    boat = put('set.barque', sx * 132.5 + cz * 2.6, -1.3, cz * 132.5 - sx * 2.6, a + 1.2);
    boat.userData.ry = a + 1.2;
  }
  // --- on sème : un lot par modèle. Ce qui peut gêner une construction est noté pour pouvoir s'effacer
  const SMALL = /herbe|fleur|caillou|champi|roseaux/;
  for (const n in L) sow(n, L[n], { reg: !/recif|ilot|palmier|roseaux|ponton/.test(n), cast: !SMALL.test(n) });
  // --- nuages : amas blancs qui dérivent lentement autour de l'île
  {
    const cm = { m: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }) },
      C = {};
    for (let i = 0; i < 15; i++) {
      const a = rnd() * TA,
        r = 150 + rnd() * 290,
        n = rnd() < 0.5 ? 'nat.nuage1' : 'nat.nuage2';
      (C[n] = C[n] || []).push([Math.cos(a) * r, 72 + rnd() * 52, Math.sin(a) * r, rnd() * TA, 1.5 + rnd() * 2.1]);
    }
    for (const n in C) sow(n, C[n], { mats: cm, cast: false, recv: false, par: clouds });
  }
  // --- mouettes : elles tournent au-dessus de la côte en battant des ailes, puis planent
  for (let i = 0; i < 6; i++) {
    const g = mdlOf('nat.mouette', null, undefined, { cast: false, recv: false }),
      a = rnd() * TA,
      r = 70 + rnd() * 52;
    g.scale.multiplyScalar(1.7);
    scene.add(g);
    gulls.push({
      g,
      cx: Math.cos(a) * r,
      cz: Math.sin(a) * r,
      R: 14 + rnd() * 24,
      y: 15 + rnd() * 17,
      sp: (0.16 + rnd() * 0.14) * (rnd() < 0.5 ? 1 : -1),
      ph: rnd() * TA
    });
  }
})();
mkGround();
mkHills();
SOLID = (x, z, y) => {
  for (const q of SOL) if (y < q[3] && Math.hypot(x - q[0], z - q[1]) < q[2] + 0.35) return true;
  const c0 = cellOf(x, z),
    cx = c0 % GN,
    cz = (c0 / GN) | 0;
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) {
      const nx = cx + a,
        nz = cz + b;
      if (nx < 0 || nz < 0 || nx >= GN || nz >= GN) continue;
      const l = DEC.get(nx + nz * GN);
      if (l)
        for (const d of l)
          if (d.r && d.ims[0].visible && y < d.h && Math.hypot(x - d.x, z - d.z) < d.r + 0.35) return true;
    }
  return false;
}; // un décor caché par le thème ne bloque plus
