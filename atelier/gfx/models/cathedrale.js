// LA CATHÉDRALE DES HÉROS — le Hall des héros du lobby (MODELS['vil.hall']) : pierre claire, toit d'ardoise bleue, vitraux aux six couleurs.
// On y entre à pied : la grande porte (côté +Z) est ouverte, la nef est praticable, les six héros y sont exposés comme au musée Grévin,
// chacun sur son socle, dans sa niche, derrière un cordon de velours. Le modèle ne change jamais de taille ni de place : seul l'extérieur s'embellit.
// ctx.lvl (1 à 6, l'évolution de l'île) : 1 chapelle (clocheton, verres clairs) · 2 vitraux et rosace aux six couleurs, lanternes · 3 contreforts
//   et pinacles · 4 deux tours de façade · 5 la flèche · 6 les dorures (arêtes, statues d'or, étoile de cristal, bannières).
// En plus de la recette : spots (les six socles : el, x, y, z, ry, plaque [x, y, z, ry]), col (obstacles au sol : cercles [x, z, r] du repère du modèle),
//   porte [x, z] (devant la porte), lab [x, y, z] (l'étiquette), rad (rayon de l'emprise).
{
  const { PAL, TAU } = K,
    PI = Math.PI;
  const PIER = 0xf4ecdc,
    PIERD = 0xddd0b8,
    PIERDD = 0xbcae94,
    MARB = 0xe9e4d8,
    MARBB = 0xb9c0d6,
    ARD = 0x33457f,
    ARDL = 0x4b61a6,
    NUIT = 0x2c3a78,
    NUITD = 0x1c2553,
    NUITL = 0x4a5aa8,
    OR = PAL.gold,
    ORD = PAL.goldD,
    VEL = 0xb3243f,
    VELD = 0x7a1430,
    TAPIS = 0xa82a45,
    VERRE = 0xdff1ff;
  const ELK = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
  // les mesures de la nef (repère du modèle, la porte côté +Z) : demi-largeur intérieure, épaisseur des murs, façade, naissance de l'abside, hauteurs
  const W = 4.5,
    T = 0.7,
    WC = W + T / 2,
    WO = W + T,
    ZF = 7.0,
    ZA = -3.8,
    Y0 = 0.12,
    HM = 8.0,
    HV = 7.0,
    HK = 10.2,
    HF = 13.4;
  // les six expositions (z des niches), les piliers engagés entre elles, et qui se tient où : face à face, Feu et Eau, Nature et Terre, Élec et Vent
  const NZ = [4.2, 1.0, -2.2],
    PZ = [5.85, 2.6, -0.6, ZA],
    SX = 3.4,
    QUI = [
      ['feu', 1, 0],
      ['eau', -1, 0],
      ['bois', 1, 1],
      ['terre', -1, 1],
      ['elec', 1, 2],
      ['vent', -1, 2]
    ];
  // arc brisé de portée 2w et de flèche h, de (−w, 0) à (w, 0) par (0, h) : deux arcs de cercle centrés sur la ligne des naissances
  const ogive = (w, h, n) => {
    const c = (h * h - w * w) / (2 * w),
      r = c + w,
      ta = Math.acos(-c / r),
      P = [];
    for (let i = 0; i <= n; i++) {
      const t = PI + ((ta - PI) * i) / n;
      P.push([c + r * Math.cos(t), r * Math.sin(t)]);
    }
    for (let i = n - 1; i >= 0; i--) P.push([-P[i][0], P[i][1]]);
    return P;
  };
  // lancette : fenêtre droite de largeur w jusqu'à hs, puis pointe de flèche ha (contour pour K.prism)
  const lancette = (w, hs, ha, n) => [
    [-w / 2, 0],
    [w / 2, 0],
    ...ogive(w / 2, ha, n)
      .reverse()
      .map(q => [q[0], q[1] + hs])
  ];
  // nappe de triangles qui regardent vers un point (voûtes vues de dessous, sols) : G = grille de points 3D [i][j]
  const nappe = (G, vers) => {
    const v = [],
      tri = (a, b, c) => {
        const ux = b[0] - a[0],
          uy = b[1] - a[1],
          uz = b[2] - a[2],
          wx = c[0] - a[0],
          wy = c[1] - a[1],
          wz = c[2] - a[2],
          nx = uy * wz - uz * wy,
          ny = uz * wx - ux * wz,
          nz = ux * wy - uy * wx,
          q = vers([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]),
          s = nx * (q[0] - a[0]) + ny * (q[1] - a[1]) + nz * (q[2] - a[2]);
        if (s >= 0) v.push(...a, ...b, ...c);
        else v.push(...a, ...c, ...b);
      };
    for (let i = 0; i < G.length - 1; i++)
      for (let j = 0; j < G[i].length - 1; j++) {
        tri(G[i][j], G[i + 1][j], G[i + 1][j + 1]);
        tri(G[i][j], G[i + 1][j + 1], G[i][j + 1]);
      }
    return { v, n: null };
  };
  // pièce plate dans le plan d'un mur : contour [x, y] extrudé sur l'épaisseur th, centré sur le plan ; ry tourne le mur (0 = façade, ±π/2 = murs latéraux)
  const plaque = (b, contour, th, o) =>
    b.group({ p: o.p, r: [0, o.ry || 0, 0] }, b =>
      b.add(K.prism(contour, th), {
        p: [0, 0, -th / 2],
        r: [PI / 2, 0, 0],
        s: [1, 1, -1],
        c: o.c,
        c2: o.c2,
        ch: o.ch,
        jit: o.jit
      })
    );
  // les sommets intérieurs de l'abside (demi-décagone de rayon W centré en z = ZA), de la naissance droite à la naissance gauche
  const AT = [];
  for (let k = 0; k <= 5; k++) AT.push(PI / 2 + (k * PI) / 5);
  const absP = (r, t) => [r * Math.sin(t), ZA + r * Math.cos(t)];

  const cathedrale = ctx => {
    const L = Math.max(1, Math.min(6, Math.round(+ctx.lvl || 1))),
      b = K.make(411),
      spots = [],
      col = [],
      dor = L >= 6,
      vit = L >= 2,
      TR = dor ? OR : PIERDD,
      cerc = (x, z, r) => col.push([+x.toFixed(2), +z.toFixed(2), r]),
      chaine = (x0, z0, x1, z1, r) => {
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.5));
        for (let i = 0; i <= n; i++) cerc(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, r);
      };
    // couleur d'un vitrail : verre clair à la chapelle, l'élément ensuite
    const verre = (el, k) => (vit ? K.mix(K.EL[el].main, K.EL[el].light, k || 0) : K.mix(VERRE, K.EL[el].light, 0.18));

    // ---- socle de la nef et de l'abside, marches, dallage en damier, tapis central
    b.add(K.box(2 * WO + 0.5, Y0, ZF + 0.35 - ZA), {
      p: [0, Y0 / 2, (ZF + 0.35 + ZA) / 2],
      c: PIERDD,
      c2: PIERD,
      jit: 0.02
    });
    b.add(K.cyl(WO + 0.3, WO + 0.3, Y0, 5, { a0: PI / 2, arc: PI }), {
      p: [0, Y0 / 2, ZA],
      c: PIERDD,
      c2: PIERD,
      jit: 0.02
    });
    b.add(K.box(5.6, Y0, 1.1), { p: [0, Y0 / 2, ZF + 0.9], c: PIERD, c2: PIER });
    b.add(K.box(6.4, Y0 / 2, 0.9), { p: [0, Y0 / 4, ZF + 1.9], c: PIERDD, c2: PIERD });
    {
      const nx = 6,
        nz = 7,
        dz = (ZF - T / 2 - ZA) / nz;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const x0 = -W + i * 1.5,
            z0 = ZA + j * dz,
            y = Y0 + 0.005;
          b.add(
            nappe(
              [
                [
                  [x0, y, z0],
                  [x0, y, z0 + dz]
                ],
                [
                  [x0 + 1.5, y, z0],
                  [x0 + 1.5, y, z0 + dz]
                ]
              ],
              q => [q[0], q[1] + 1, q[2]]
            ),
            { c: (i + j) % 2 ? MARB : MARBB, jit: 0.04 }
          );
        }
      // le sol de l'abside, une étoile d'or au centre
      const G = [AT.map(t => [0, Y0 + 0.005, ZA]), AT.map(t => [absP(W, t)[0], Y0 + 0.005, absP(W, t)[1]])];
      b.add(
        nappe(G, q => [q[0], q[1] + 1, q[2]]),
        { c: MARBB, jit: 0.04 }
      );
      const S = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12,
          r = i % 2 ? 0.45 : 1.1;
        S.push([Math.sin(a) * r, Math.cos(a) * r]);
      }
      b.add(K.prism(S, 0.02), { p: [0, Y0, ZA - 0.6], c: OR, ch: 's', jit: 0 });
    }
    b.add(K.box(1.9, 0.03, ZF + 1.4 - ZA + 0.3), {
      p: [0, Y0 + 0.015, (ZF + 1.4 + ZA - 0.3) / 2],
      c: VELD,
      c2: TAPIS,
      jit: 0
    });
    for (const sd of [1, -1])
      b.add(K.box(0.08, 0.035, ZF + 1.4 - ZA + 0.3), {
        p: [sd * 0.92, Y0 + 0.02, (ZF + 1.4 + ZA - 0.3) / 2],
        c: OR,
        ch: 's',
        jit: 0
      });

    // ---- les murs : nef, façade (porte en arc brisé), abside polygonale ; soubassement, cordons, corniche
    for (const sd of [1, -1]) {
      b.add(K.box(T, HM, ZF + T / 2 - ZA), {
        p: [sd * WC, HM / 2, (ZF + T / 2 + ZA) / 2],
        c: PIERD,
        c2: PIER,
        jit: 0.025
      });
      b.add(K.box(T + 0.24, 0.9, ZF + T / 2 - ZA + 0.24), {
        p: [sd * WC, 0.45, (ZF + T / 2 + ZA) / 2],
        c: PIERDD,
        c2: PIERD,
        jit: 0.03
      });
      b.add(K.box(T + 0.16, 0.18, ZF + T / 2 - ZA + 0.16), {
        p: [sd * WC, 4.4, (ZF + T / 2 + ZA) / 2],
        c: PIERD,
        jit: 0
      });
      b.add(K.box(T + 0.5, 0.3, ZF + T / 2 - ZA + 0.5), {
        p: [sd * WC, HM - 0.1, (ZF + T / 2 + ZA) / 2],
        c: PIERD,
        c2: PIER,
        jit: 0
      });
      // façade : un trumeau de chaque côté de la porte, coins en pierres d'angle
      b.add(K.box(WO - 1.6, HM, T), { p: [sd * (1.6 + (WO - 1.6) / 2), HM / 2, ZF], c: PIERD, c2: PIER, jit: 0.025 });
      b.add(K.box(WO - 1.6 + 0.12, 0.9, T + 0.24), {
        p: [sd * (1.6 + (WO - 1.6) / 2 + 0.06), 0.45, ZF],
        c: PIERDD,
        c2: PIERD,
        jit: 0.03
      });
      for (let i = 0; i < 6; i++)
        b.add(K.box(i % 2 ? 0.5 : 0.8, 0.62, 0.12), {
          p: [sd * (WO - (i % 2 ? 0.25 : 0.4)), 1.3 + i * 0.85, ZF + T / 2 + 0.05],
          c: PIER,
          jit: 0.04
        });
      chaine(sd * WC, ZA, sd * WC, ZF + T / 2, 0.6);
      chaine(sd * 1.95, ZF, sd * WO, ZF, 0.6);
    }
    // au-dessus de la porte : le mur laisse une ouverture en arc brisé (3,2 m de large, 5,6 m sous la clé)
    {
      const A = ogive(1.6, 1.8, 6).map(q => [q[0], q[1] + 3.8]);
      plaque(b, [...A, [1.6, HM], [-1.6, HM]], T, { p: [0, 0, ZF], c: PIERD, c2: PIER, jit: 0.02 });
      // voussures : trois arcs brisés autour de la porte, des colonnettes, le tympan d'étoile
      for (let k = 0; k < 3; k++) {
        const w = 1.7 + k * 0.28,
          P = ogive(w, 1.9 + k * 0.22, 5).map(q => [q[0], q[1] + 3.8, ZF + T / 2 + 0.06]);
        b.add(K.tube([[-w, Y0, ZF + T / 2 + 0.06], ...P, [w, Y0, ZF + T / 2 + 0.06]], 0.1, 4), {
          c: k === 1 ? (dor ? OR : PIERDD) : PIER,
          ch: k === 1 && dor ? 's' : 'm',
          jit: 0
        });
      }
      b.add(K.box(2 * WO + 0.3, 0.22, 0.26), { p: [0, 6.9, ZF + T / 2 + 0.08], c: PIERD, c2: PIER, jit: 0 });
    }
    // l'abside : cinq pans de mur, un contrefort plat à chaque angle
    for (let k = 0; k < 5; k++) {
      const a = absP(W, AT[k]),
        c = absP(W, AT[k + 1]),
        tm = (AT[k] + AT[k + 1]) / 2,
        len = Math.hypot(c[0] - a[0], c[1] - a[1]),
        ox = Math.sin(tm) * (T / 2),
        oz = Math.cos(tm) * (T / 2),
        mx = (a[0] + c[0]) / 2 + ox,
        mz = (a[1] + c[1]) / 2 + oz;
      b.add(K.box(len + 0.36, HM, T), { p: [mx, HM / 2, mz], r: [0, tm, 0], c: PIERD, c2: PIER, jit: 0.025 });
      b.add(K.box(len + 0.6, 0.9, T + 0.24), { p: [mx, 0.45, mz], r: [0, tm, 0], c: PIERDD, c2: PIERD, jit: 0.03 });
      b.add(K.box(len + 0.8, 0.3, T + 0.5), { p: [mx, HM - 0.1, mz], r: [0, tm, 0], c: PIERD, c2: PIER, jit: 0 });
      chaine(a[0] + ox * 2 * 0.7, a[1] + oz * 2 * 0.7, c[0] + ox * 2 * 0.7, c[1] + oz * 2 * 0.7, 0.6);
    }

    // ---- la grande porte : deux battants de bois ouverts vers l'extérieur, pentures de fer
    b.sym(sd =>
      b.group({ p: [sd * 1.62, Y0, ZF + T / 2 + 0.08], r: [0, sd * 2.2, 0], s: [sd, 1, 1] }, b => {
        const A = ogive(1.6, 1.8, 6)
          .slice(7)
          .map(q => [q[0] - 1.6, q[1] + 3.7]);
        plaque(b, [[0, 0], ...A.reverse(), [-1.55, 0]], 0.12, { p: [0, 0, 0], c: PAL.wood, c2: PAL.woodL, jit: 0.04 });
        for (let i = 0; i < 3; i++)
          b.add(K.box(0.05, 3.6 + i * 0.4, 0.15), { p: [-0.4 - i * 0.4, 1.8 + i * 0.2, 0], c: PAL.woodD, jit: 0 });
        for (const y of [0.9, 2.5, 3.5])
          b.add(K.box(1.2, 0.1, 0.17), { p: [-0.6, y, 0], c: PAL.iron, ch: 's', jit: 0 });
        b.add(K.torus(0.12, 0.025, 4, 8), { p: [-1.3, 1.9, 0.1], c: OR, ch: 's', jit: 0 });
      })
    );
    for (const sd of [1, -1]) {
      cerc(sd * (1.62 + 0.75 * 0.59), ZF + T / 2 + 0.75 * 0.8, 0.45);
      cerc(sd * (1.62 + 1.4 * 0.59), ZF + T / 2 + 1.4 * 0.8, 0.35);
    }

    // ---- fenêtres : une lancette au-dessus de chaque niche (couleur de son héros), cinq dans l'abside, et la rosace de la façade
    const lancN = lancette(1.0, 1.3, 0.75, 4),
      lancA = lancette(1.15, 2.6, 0.85, 4);
    for (const [el, sd, j] of QUI) {
      const z = NZ[j];
      plaque(
        b,
        lancN.map(q => [q[0] * 1.18, q[1] * 1.06]),
        T + 0.08,
        { p: [sd * WC, 4.85, z], ry: PI / 2, c: dor ? OR : PIERDD, ch: dor ? 's' : 'm', jit: 0 }
      );
      plaque(b, lancN, T + 0.14, {
        p: [sd * WC, 4.95, z],
        ry: PI / 2,
        c: verre(el, 0),
        c2: verre(el, 0.55),
        ch: 'g',
        jit: 0
      });
      b.add(K.box(T + 0.18, 0.05, 1.0), { p: [sd * WC, 5.75, z], c: NUITD, jit: 0 });
      b.add(K.box(T + 0.18, 2.0, 0.05), { p: [sd * WC, 5.95, z], c: NUITD, jit: 0 });
    }
    for (let k = 0; k < 5; k++) {
      const tm = (AT[k] + AT[k + 1]) / 2,
        m = absP(W * Math.cos(PI / 10) + T / 2, tm),
        cs = [ELK[k], ELK[(k + 1) % 6], ELK[(k + 2) % 6]];
      plaque(
        b,
        lancA.map(q => [q[0] * 1.16, q[1] * 1.04]),
        T + 0.08,
        { p: [m[0], 3.1, m[1]], ry: tm, c: dor ? OR : PIERDD, ch: dor ? 's' : 'm', jit: 0 }
      );
      // trois panneaux de couleur l'un sur l'autre, séparés par des plombs
      plaque(b, lancA, T + 0.14, {
        p: [m[0], 3.2, m[1]],
        ry: tm,
        c: verre(cs[0]),
        c2: verre(cs[0], 0.4),
        ch: 'g',
        jit: 0
      });
      b.group({ p: [m[0], 0, m[1]], r: [0, tm, 0] }, b => {
        b.add(K.box(1.15, 0.95, T + 0.16), {
          p: [0, 4.63, 0],
          c: verre(cs[1]),
          c2: verre(cs[1], 0.4),
          ch: 'g',
          jit: 0
        });
        b.add(K.box(1.15, 0.95, T + 0.16), {
          p: [0, 3.68, 0],
          c: verre(cs[2]),
          c2: verre(cs[2], 0.4),
          ch: 'g',
          jit: 0
        });
        for (const y of [4.15, 5.1]) b.add(K.box(1.18, 0.06, T + 0.2), { p: [0, y, 0], c: NUITD, jit: 0 });
        b.add(K.box(0.06, 3.3, T + 0.2), { p: [0, 4.85, 0], c: NUITD, jit: 0 });
      });
    }
    {
      const RY = 8.8,
        RR = 1.3,
        th = T + 0.2;
      b.add(K.cyl(RR + 0.25, RR + 0.25, th + 0.06, 12), {
        p: [0, RY, ZF],
        r: [PI / 2, 0, 0],
        c: dor ? OR : PIERD,
        c2: PIER,
        ch: dor ? 's' : 'm',
        jit: 0
      });
      b.add(K.cyl(RR, RR, th + 0.1, 12), {
        p: [0, RY, ZF],
        r: [PI / 2, 0, 0],
        c: vit ? 0x6a58c8 : VERRE,
        ch: 'g',
        jit: 0
      });
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12,
          el = ELK[i % 6],
          x = Math.sin(a) * RR * 0.62,
          y = Math.cos(a) * RR * 0.62;
        const pe = [
          [0, -0.28],
          [0.15, -0.12],
          [0.17, 0.06],
          [0.1, 0.2],
          [0, 0.3],
          [-0.1, 0.2],
          [-0.17, 0.06],
          [-0.15, -0.12]
        ].map(q => [x + Math.sin(a) * q[1] + Math.cos(a) * q[0], RY + y + Math.cos(a) * q[1] - Math.sin(a) * q[0]]);
        plaque(b, pe, th + 0.14, { p: [0, 0, ZF], c: verre(el, 0.2), ch: 'g', jit: 0 });
        b.add(K.box(0.07, RR, th + 0.16), {
          p: [Math.sin(a + PI / 12) * RR * 0.5, RY + Math.cos(a + PI / 12) * RR * 0.5, ZF],
          r: [0, 0, -(a + PI / 12)],
          c: NUITD,
          jit: 0
        });
      }
      b.add(K.cyl(0.32, 0.32, th + 0.2, 10), { p: [0, RY, ZF], r: [PI / 2, 0, 0], c: OR, ch: vit ? 'g' : 's', jit: 0 });
      b.add(K.torus(RR + 0.25, 0.08, 3, 16), {
        p: [0, RY, ZF + th / 2 + 0.05],
        c: dor ? OR : PIERDD,
        ch: dor ? 's' : 'm',
        jit: 0
      });
    }

    // ---- le pignon de façade et le toit d'ardoise à deux pans (rangs d'ardoises), la croupe de l'abside, le faîte
    plaque(
      b,
      [
        [-WO - 0.35, 0],
        [WO + 0.35, 0],
        [0, HF - HM + 0.25]
      ],
      T,
      { p: [0, HM, ZF], c: PIERD, c2: PIER, jit: 0.02 }
    );
    b.add(K.box(0.35, 0.3, 0.9), { p: [0, HF + 0.3, ZF], c: PIERD, jit: 0 });
    {
      const ex = WO + 0.4,
        ey = HM - 0.1,
        sl = Math.hypot(ex, HF - ey),
        al = Math.atan2(HF - ey, ex),
        Lz = ZF - ZA,
        cz = (ZF + ZA) / 2;
      for (const sd of [1, -1]) {
        b.add(K.box(sl + 0.2, 0.32, Lz), {
          p: [(sd * ex) / 2, (ey + HF) / 2, cz],
          r: [0, 0, -sd * al],
          c: ARD,
          c2: ARDL,
          jit: 0.04
        });
        for (let i = 0; i < 5; i++) {
          const u = (i + 0.5) / 5.4,
            x = sd * ex * (1 - u),
            y = ey + (HF - ey) * u;
          b.add(K.box(0.9, 0.08, Lz + 0.04), {
            p: [x + sd * Math.sin(al) * 0.17, y + Math.cos(al) * 0.17, cz],
            r: [0, 0, -sd * al],
            c: i % 2 ? ARDL : ARD,
            jit: 0.05
          });
        }
      }
      b.add(K.box(0.36, 0.3, Lz + 0.5), {
        p: [0, HF + 0.08, cz],
        r: [0, 0, PI / 4],
        s: [1, 1, 1],
        c: dor ? OR : ARDL,
        ch: dor ? 's' : 'm',
        jit: 0
      });
      b.add(K.cyl(0, ex, HF - ey, 5, { a0: PI / 2, arc: PI, open: true }), {
        p: [0, (ey + HF) / 2, ZA],
        c: ARD,
        c2: ARDL,
        jit: 0.04
      });
      for (let k = 1; k < 5; k++) {
        const t = AT[k];
        b.add(
          K.tube(
            [
              [Math.sin(t) * ex, ey + 0.08, ZA + Math.cos(t) * ex],
              [0, HF + 0.08, ZA]
            ],
            0.09,
            4
          ),
          { c: dor ? OR : ARDL, ch: dor ? 's' : 'm', jit: 0 }
        );
      }
    }

    // ---- le clocheton du pignon : deux piles, une cloche d'or, un toit pointu, une étoile
    {
      const y = HF + 0.4;
      for (const sd of [1, -1]) b.add(K.box(0.3, 1.6, 0.5), { p: [sd * 0.5, y + 0.8, ZF], c: PIERD, c2: PIER });
      b.add(K.box(1.4, 0.25, 0.65), { p: [0, y + 1.7, ZF], c: PIERD });
      b.add(
        K.lathe(
          [
            [0.32, y + 0.5],
            [0.3, y + 0.62],
            [0.2, y + 1.05],
            [0.06, y + 1.3],
            [0, y + 1.32]
          ],
          8
        ),
        { p: [0, 0, ZF], c: ORD, c2: OR, ch: 's', jit: 0 }
      );
      b.add(K.cone(0.95, 1.5, 4), { p: [0, y + 2.55, ZF], r: [0, PI / 4, 0], c: ARD, c2: ARDL });
      b.add(K.oct(0.22), { p: [0, y + 3.5, ZF], s: [1, 1.6, 1], c: OR, ch: vit ? 'g' : 's', jit: 0 });
    }

    // ---- à l'intérieur : la voûte bleu nuit semée d'étoiles, ses arcs doubleaux, la demi-coupole de l'abside
    {
      const pr = ogive(W, HK - HV, 5).map(q => [q[0], q[1] + HV]),
        ver = q => [0, 4, q[2]];
      b.add(
        nappe(
          pr.map(q => [
            [q[0], q[1], ZA],
            [q[0], q[1], ZF - T / 2]
          ]),
          ver
        ),
        { c: NUITD, c2: NUITL, jit: 0.04 }
      );
      const hp = pr.slice(0, 6);
      b.add(
        nappe(
          hp.map(q => AT.map(t => [-q[0] * Math.sin(t), q[1], ZA - q[0] * Math.cos(t)])),
          () => [0, 4, ZA]
        ),
        { c: NUITD, c2: NUITL, jit: 0.04 }
      );
      // arcs doubleaux au droit des piliers, nervures de l'abside, clefs d'or
      for (const z of PZ)
        b.add(
          K.tube(
            pr.map(q => [q[0] * 0.985, q[1] - 0.04, z]),
            0.14,
            4
          ),
          { c: dor ? OR : PIERD, ch: dor ? 's' : 'm', jit: 0 }
        );
      for (let k = 1; k < 5; k++) {
        const t = AT[k];
        b.add(
          K.tube(
            hp.map(q => [-q[0] * 0.98 * Math.sin(t), q[1] - 0.05, ZA - q[0] * 0.98 * Math.cos(t)]),
            0.12,
            4
          ),
          { c: dor ? OR : PIERD, ch: dor ? 's' : 'm', jit: 0 }
        );
      }
      for (const z of PZ) b.add(K.oct(0.24), { p: [0, HK - 0.12, z], c: OR, ch: 's', jit: 0 });
      // les étoiles de la voûte
      const r = K.rng(97);
      for (let i = 0; i < 28; i++) {
        const u = 0.08 + r() * 0.84,
          k = Math.floor(u * (pr.length - 1)),
          f = u * (pr.length - 1) - k,
          a = pr[k],
          c = pr[k + 1],
          x = a[0] + (c[0] - a[0]) * f,
          y = a[1] + (c[1] - a[1]) * f,
          z = ZA + 0.3 + r() * (ZF - T / 2 - ZA - 0.6);
        b.add(K.oct(0.07 + r() * 0.05), { p: [x * 0.97, y - 0.06, z], c: 0xfff2c4, ch: 'g', jit: 0 });
      }
      // piliers engagés (la nef), corniche intérieure sous la voûte
      for (const sd of [1, -1]) {
        for (const z of PZ) {
          b.add(K.cyl(0.36, 0.4, HV - Y0, 8), { p: [sd * (W - 0.1), (HV + Y0) / 2, z], c: PIERD, c2: PIER, jit: 0.02 });
          b.add(K.box(0.95, 0.35, 0.95), { p: [sd * (W - 0.1), Y0 + 0.17, z], c: PIERDD, jit: 0 });
          b.add(K.box(1.0, 0.4, 1.0, 0.8, 0.8), {
            p: [sd * (W - 0.1), HV - 0.2, z],
            r: [PI, 0, 0],
            c: dor ? OR : PIER,
            ch: dor ? 's' : 'm',
            jit: 0
          });
          cerc(sd * (W - 0.15), z, 0.55);
        }
        b.add(K.box(0.2, 0.16, ZF - T / 2 - ZA), {
          p: [sd * (W - 0.05), HV - 0.02, (ZF - T / 2 + ZA) / 2],
          c: dor ? OR : PIERDD,
          ch: dor ? 's' : 'm',
          jit: 0
        });
      }
      // deux lustres : couronne d'or, six flammes, chaîne
      for (const z of [ZA + 0.2, 2.6]) {
        b.add(K.cyl(0.02, 0.02, HK - 4.6, 4), { p: [0, (HK + 4.6) / 2, z], c: PAL.iron, jit: 0 });
        b.add(K.torus(0.75, 0.05, 3, 10), { p: [0, 4.6, z], r: [PI / 2, 0, 0], c: OR, ch: 's', jit: 0 });
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6;
          b.add(K.cyl(0.05, 0.05, 0.22, 4), {
            p: [Math.sin(a) * 0.75, 4.74, z + Math.cos(a) * 0.75],
            c: PAL.cream,
            jit: 0
          });
          b.add(K.oct(0.08), {
            p: [Math.sin(a) * 0.75, 4.95, z + Math.cos(a) * 0.75],
            s: [1, 1.6, 1],
            c: 0xffe08a,
            ch: 'g',
            jit: 0
          });
        }
      }
    }

    // ---- l'autel de l'abside : deux marches, la table de marbre, la vasque où brûle la flamme d'étoile
    {
      const z = ZA - 2.3;
      b.add(K.box(3.6, 0.1, 2.2), { p: [0, Y0 + 0.05, z], c: PIERD, c2: PIER });
      b.add(K.box(2.2, 0.95, 1.0), { p: [0, Y0 + 0.57, z], c: MARBB, c2: MARB });
      b.add(K.box(2.4, 0.12, 1.2), { p: [0, Y0 + 1.1, z], c: MARB, jit: 0 });
      b.add(K.box(1.5, 0.55, 0.04), { p: [0, Y0 + 0.6, z + 0.52], c: OR, ch: 's', jit: 0 });
      b.add(K.cyl(0.55, 0.32, 0.4, 10), { p: [0, Y0 + 1.36, z], c: PAL.bronze, c2: PAL.bronzeL, ch: 's' });
      b.add(K.ico(0.3, 1), { p: [0, Y0 + 1.75, z], s: [1, 1.35, 1], c: 0xfff2c4, ch: 'g', jit: 0 });
      cerc(0, z, 1.35);
      // le retable : une étoile d'or à six branches, une gemme de chaque élément au bout des branches
      const zr = ZA - 3.55,
        yr = 3.15,
        S = [];
      b.add(K.cyl(0.12, 0.16, yr - 0.6, 6), { p: [0, (yr - 0.6) / 2 + Y0, zr], c: ORD, c2: OR, ch: 's', jit: 0 });
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12,
          r = i % 2 ? 0.52 : 1.05;
        S.push([Math.sin(a) * r, Math.cos(a) * r]);
      }
      plaque(
        b,
        S.map(q => [q[0], q[1] + yr]),
        0.12,
        { p: [0, 0, zr], c: ORD, c2: OR, ch: 's', jit: 0 }
      );
      plaque(
        b,
        S.map(q => [q[0] * 0.5, q[1] * 0.5 + yr]),
        0.18,
        { p: [0, 0, zr], c: 0xfff2c4, ch: 'g', jit: 0 }
      );
      ELK.forEach((el, i) => {
        const a = (i * TAU) / 6;
        b.add(K.oct(0.13), {
          p: [Math.sin(a) * 1.05, yr + Math.cos(a) * 1.05, zr + 0.08],
          c: K.EL[el].main,
          ch: 'g',
          jit: 0
        });
      });
      // deux grands chandeliers d'or, cierges allumés
      for (const sd of [1, -1]) {
        b.add(K.cyl(0.05, 0.07, 1.5, 5), { p: [sd * 1.55, Y0 + 0.85, z], c: OR, ch: 's', jit: 0 });
        b.add(K.cyl(0.22, 0.18, 0.1, 6), { p: [sd * 1.55, Y0 + 0.15, z], c: ORD, ch: 's', jit: 0 });
        b.add(K.cyl(0.07, 0.07, 0.4, 5), { p: [sd * 1.55, Y0 + 1.8, z], c: PAL.cream, jit: 0 });
        b.add(K.oct(0.08), { p: [sd * 1.55, Y0 + 2.08, z], s: [1, 1.7, 1], c: 0xffe08a, ch: 'g', jit: 0 });
      }
      // les tentures bleu nuit de l'abside, sous les vitraux, frangées d'or
      for (let k = 0; k < 5; k++) {
        const tm = (AT[k] + AT[k + 1]) / 2,
          m = absP(W * Math.cos(PI / 10) - 0.04, tm);
        b.group({ p: [m[0], 0, m[1]], r: [0, tm, 0] }, b => {
          b.add(K.box(2.3, 2.0, 0.05), { p: [0, 1.95, 0], c: NUITD, c2: NUIT, jit: 0.02 });
          b.add(K.box(2.36, 0.09, 0.08), { p: [0, 2.96, 0], c: OR, ch: 's', jit: 0 });
          b.add(K.box(2.3, 0.07, 0.07), { p: [0, 0.98, 0], c: ORD, jit: 0 });
        });
      }
    }

    // ---- les six expositions : niche bleu nuit, socle de marbre et d'or, plaque, cordon de velours sur trois potelets dorés
    const niche = lancette(2.1, 3.0, 1.2, 5);
    for (const [el, sd, j] of QUI) {
      const z = NZ[j],
        x = sd * SX,
        E = K.EL[el];
      plaque(
        b,
        niche.map(q => [q[0] * 1.14, q[1] * 1.05]),
        0.1,
        { p: [sd * (W - 0.02), Y0, z], ry: PI / 2, c: dor ? OR : PIERD, ch: dor ? 's' : 'm', jit: 0 }
      );
      plaque(b, niche, 0.14, {
        p: [sd * (W - 0.02), Y0, z],
        ry: PI / 2,
        c: NUITD,
        c2: K.mix(NUIT, E.dark, 0.35),
        jit: 0.03
      });
      b.add(K.oct(0.13), { p: [sd * (W - 0.12), Y0 + 4.05, z], s: [0.5, 1.4, 1], c: E.main, ch: 'g', jit: 0 });
      // le socle : base carrée, fût à huit pans (un pan face à l'allée, pour la plaque), table, filet d'or
      b.add(K.box(1.6, 0.16, 1.6), { p: [x, Y0 + 0.08, z], c: PIERDD, c2: PIERD, jit: 0 });
      b.add(K.cyl(0.62, 0.7, 0.42, 8, { a0: PI / 8 }), { p: [x, Y0 + 0.37, z], c: MARBB, c2: MARB, jit: 0.02 });
      b.add(K.cyl(0.74, 0.74, 0.1, 8, { a0: PI / 8 }), { p: [x, Y0 + 0.63, z], c: MARB, jit: 0 });
      b.add(K.torus(0.745, 0.03, 3, 12), { p: [x, Y0 + 0.69, z], r: [PI / 2, 0, 0], c: OR, ch: 's', jit: 0 });
      b.add(K.box(0.04, 0.28, 0.66), {
        p: [x - sd * 0.62, Y0 + 0.37, z],
        r: [0, 0, -sd * 0.19],
        c: OR,
        ch: 's',
        jit: 0
      });
      // le cordon : trois potelets en arc devant le socle, deux longueurs de velours qui pendent
      const pts = [-1, 0, 1].map(k => [x - sd * 1.12 * Math.cos(k * 1.0), z + 1.12 * Math.sin(k * 1.0)]);
      for (const q of pts) {
        b.add(K.cyl(0.14, 0.17, 0.05, 5), { p: [q[0], Y0 + 0.025, q[1]], c: ORD, ch: 's', jit: 0 });
        b.add(K.cyl(0.03, 0.035, 0.92, 4), { p: [q[0], Y0 + 0.5, q[1]], c: OR, ch: 's', jit: 0 });
        b.add(K.oct(0.06), { p: [q[0], Y0 + 0.98, q[1]], c: OR, ch: 's', jit: 0 });
      }
      for (let k = 0; k < 2; k++) {
        const a = pts[k],
          c = pts[k + 1],
          P = [];
        for (let i = 0; i <= 5; i++) {
          const u = i / 5;
          P.push([a[0] + (c[0] - a[0]) * u, Y0 + 0.9 - Math.sin(u * PI) * 0.2, a[1] + (c[1] - a[1]) * u]);
        }
        b.add(K.tube(P, 0.032, 4), { c: VEL, c2: VELD, jit: 0 });
      }
      cerc(x, z, 1.28);
      // le héros regarde l'allée, un peu tourné vers la porte ; sa plaque est sur le pan du socle face à l'allée
      const dx = -sd * Math.cos(0.32),
        dz = Math.sin(0.32);
      spots.push({
        el,
        x,
        y: Y0 + 0.68,
        z,
        ry: Math.atan2(-dx, -dz),
        plaque: [x - sd * 0.655, Y0 + 0.37, z, -sd * (PI / 2)]
      });
    }

    // ---- dès la chapelle : deux lanternes de part et d'autre de la porte, deux jardinières fleuries au bas des marches
    for (const sd of [1, -1]) {
      b.add(K.box(0.9, 0.45, 0.6), { p: [sd * 3.75, 0.22, ZF + 2.1], c: PIERD, c2: PIER, jit: 0.03 });
      b.add(K.box(0.8, 0.08, 0.5), { p: [sd * 3.75, 0.46, ZF + 2.1], c: PAL.dirt, jit: 0 });
      for (let i = 0; i < 5; i++)
        b.add(K.ico(0.13, 0), {
          p: [sd * 3.75 - 0.3 + i * 0.15, 0.56 + (i % 2) * 0.06, ZF + 2.1 + (i % 2 ? 0.1 : -0.1)],
          c: [0xff8fb0, 0xffe27a, 0xffffff, 0xb7a0ff, 0x8fe6dc][i],
          jit: 0.05
        });
      b.add(K.ico(0.22, 0), { p: [sd * 3.75, 0.55, ZF + 2.1], s: [1.6, 0.6, 1], c: PAL.leafL, jit: 0.05 });
      cerc(sd * 3.75, ZF + 2.1, 0.55);
    }
    {
      for (const sd of [1, -1]) {
        b.add(K.box(0.08, 0.08, 0.5), { p: [sd * 2.55, 3.5, ZF + T / 2 + 0.2], c: PAL.iron, jit: 0 });
        b.add(K.box(0.3, 0.42, 0.3), { p: [sd * 2.55, 3.22, ZF + T / 2 + 0.42], c: 0xffd98a, ch: 'g', jit: 0 });
        b.add(K.cone(0.26, 0.24, 4), {
          p: [sd * 2.55, 3.55, ZF + T / 2 + 0.42],
          r: [0, PI / 4, 0],
          c: PAL.iron,
          ch: 's',
          jit: 0
        });
      }
    }

    // ---- niveau 3 : contreforts à ressauts le long de la nef et autour de l'abside, chacun coiffé d'un pinacle
    const pinacle = (x, y, z, s) => {
      b.add(K.box(0.6 * s, 0.9 * s, 0.6 * s), { p: [x, y + 0.45 * s, z], c: PIERD, c2: PIER });
      b.add(K.cone(0.42 * s, 1.6 * s, 4), {
        p: [x, y + 1.7 * s, z],
        r: [0, PI / 4, 0],
        c: dor ? ORD : PIERD,
        c2: dor ? OR : PIER,
        ch: dor ? 's' : 'm'
      });
      b.add(K.oct(0.12 * s), { p: [x, y + 2.6 * s, z], s: [1, 1.5, 1], c: OR, ch: dor ? 'g' : 's', jit: 0 });
    };
    if (L >= 3) {
      const contrefort = (x, z, ry) =>
        b.group({ p: [x, 0, z], r: [0, ry, 0] }, b => {
          b.add(K.box(0.85, 5.4, 1.3), { p: [0, 2.7, 0.55], c: PIERD, c2: PIER, jit: 0.03 });
          b.add(K.box(0.85, 1.4, 1.3, 1, 0.2), { p: [0, 6.1, 0.55], c: PIERD, c2: PIER, jit: 0.03 });
          b.add(K.box(0.7, 2.2, 0.8), { p: [0, 7.2, 0.25], c: PIERD, c2: PIER, jit: 0.03 });
          b.add(K.box(0.95, 0.9, 1.45), { p: [0, 0.45, 0.58], c: PIERDD, c2: PIERD, jit: 0.03 });
        });
      for (const sd of [1, -1])
        for (const z of PZ.slice(1)) {
          contrefort(sd * WO, z, (sd * PI) / 2);
          pinacle(sd * (WO + 0.25), HM + 0.3, z, 1);
          cerc(sd * (WO + 0.75), z, 0.7);
        }
      for (let k = 1; k < 5; k++) {
        const t = AT[k],
          q = absP(W + T, t);
        contrefort(q[0], q[1], t);
        const p = absP(W + T + 0.25, t);
        pinacle(p[0], HM + 0.3, p[1], 1);
        const c = absP(W + T + 0.75, t);
        cerc(c[0], c[1], 0.7);
      }
      // aux coins de la façade (avant les tours) : deux contreforts d'angle
      if (L < 4)
        for (const sd of [1, -1]) {
          contrefort(sd * (WO - 0.43), ZF + T / 2, 0);
          pinacle(sd * (WO - 0.43), HM + 0.3, ZF + T / 2 + 0.2, 1.1);
          cerc(sd * (WO - 0.43), ZF + T / 2 + 0.7, 0.7);
        }
    }

    // ---- niveau 4 : deux tours de façade (beffroi ajouré, corniche, flèche d'ardoise, épi d'or)
    if (L >= 4)
      for (const sd of [1, -1]) {
        const x = sd * 6.0,
          z = 6.1,
          w = 2.8,
          H1 = HM + 0.6,
          H2 = 13.4,
          H3 = 19.6;
        b.add(K.box(w, H1, w), { p: [x, H1 / 2, z], c: PIERD, c2: PIER, jit: 0.025 });
        b.add(K.box(w + 0.24, 0.9, w + 0.24), { p: [x, 0.45, z], c: PIERDD, c2: PIERD, jit: 0.03 });
        b.add(K.box(w + 0.3, 0.3, w + 0.3), { p: [x, H1, z], c: PIERD, c2: PIER, jit: 0 });
        b.add(K.box(w - 0.3, H2 - H1, w - 0.3), { p: [x, (H1 + H2) / 2, z], c: PIERD, c2: PIER, jit: 0.025 });
        for (let f = 0; f < 4; f++) {
          const a = (f * PI) / 2,
            ox = Math.sin(a) * ((w - 0.3) / 2 + 0.01),
            oz = Math.cos(a) * ((w - 0.3) / 2 + 0.01);
          plaque(b, lancette(0.95, 1.9, 0.6, 3), 0.06, {
            p: [x + ox, H1 + 0.8, z + oz],
            ry: a,
            c: NUITD,
            c2: NUIT,
            jit: 0
          });
          plaque(b, lancette(0.5, 0.6, 0.3, 3), 0.05, {
            p: [x + ox * 1.01, 1.9, z + oz * 1.01],
            ry: a,
            c: verre(ELK[(f + (sd > 0 ? 0 : 3)) % 6]),
            ch: 'g',
            jit: 0
          });
        }
        b.add(K.box(w + 0.1, 0.35, w + 0.1), {
          p: [x, H2, z],
          c: dor ? OR : PIERD,
          c2: PIER,
          ch: dor ? 's' : 'm',
          jit: 0
        });
        for (const ax of [1, -1])
          for (const az of [1, -1]) pinacle(x + ax * (w / 2 - 0.1), H2 + 0.17, z + az * (w / 2 - 0.1), 0.75);
        b.add(K.cone(1.6, H3 - H2, 4), {
          p: [x, (H2 + H3) / 2 + 0.2, z],
          r: [0, PI / 4, 0],
          c: ARD,
          c2: ARDL,
          jit: 0.04
        });
        b.add(K.cyl(0.03, 0.05, 1.2, 4), { p: [x, H3 + 0.7, z], c: OR, ch: 's', jit: 0 });
        b.add(K.oct(0.22), { p: [x, H3 + 1.35, z], s: [1, 1.5, 1], c: OR, ch: dor ? 'g' : 's', jit: 0 });
        for (const ax of [1, -1]) for (const az of [1, -1]) cerc(x + ax * 0.75, z + az * 0.75, 1.0);
      }

    // ---- niveau 5 : la flèche de la croisée, sur le faîte, au-dessus des derniers héros (lanterne ajourée, flèche à crochets, étoile de cristal)
    if (L >= 5) {
      const z = -1.0,
        y0 = HF - 1.8,
        y1 = HF + 2.6,
        y2 = 26.5;
      b.add(K.cyl(1.25, 1.35, y1 - y0, 8, { a0: PI / 8 }), { p: [0, (y0 + y1) / 2, z], c: PIERD, c2: PIER, jit: 0.02 });
      for (let f = 0; f < 8; f++) {
        const a = (f * TAU) / 8;
        plaque(b, lancette(0.5, 1.2, 0.4, 3), 0.05, {
          p: [Math.sin(a) * 1.2, y0 + 1.6, z + Math.cos(a) * 1.2],
          ry: a,
          c: f % 2 ? NUITD : verre(ELK[f % 6]),
          ch: f % 2 ? 'm' : 'g',
          jit: 0
        });
        b.add(K.cone(0.16, 0.9, 4), {
          p: [Math.sin(a + PI / 8) * 1.32, y1 + 0.35, z + Math.cos(a + PI / 8) * 1.32],
          c: dor ? OR : PIERD,
          ch: dor ? 's' : 'm',
          jit: 0
        });
      }
      b.add(K.cyl(1.4, 1.4, 0.25, 8, { a0: PI / 8 }), {
        p: [0, y1, z],
        c: dor ? OR : PIERD,
        ch: dor ? 's' : 'm',
        jit: 0
      });
      b.add(K.cone(1.15, y2 - y1, 8), { p: [0, (y1 + y2) / 2, z], r: [0, PI / 8, 0], c: ARD, c2: ARDL, jit: 0.04 });
      for (let i = 1; i < 6; i++) {
        const u = i / 6,
          r = 1.15 * (1 - u),
          y = y1 + (y2 - y1) * u;
        for (let f = 0; f < 8; f += 2)
          b.add(K.cone(0.09, 0.32, 4), {
            p: [Math.sin((f * TAU) / 8) * r, y, z + Math.cos((f * TAU) / 8) * r],
            c: OR,
            ch: 's',
            jit: 0
          });
      }
      b.add(K.ico(0.28, 0), { p: [0, y2 + 0.2, z], c: OR, ch: 's', jit: 0 });
      b.add(K.oct(dor ? 0.75 : 0.5), {
        p: [0, y2 + (dor ? 1.3 : 1.0), z],
        s: [1, 1.6, 1],
        c: 0xbfe9ff,
        c2: 0xffffff,
        ch: 'g',
        jit: 0.04
      });
    }

    // ---- niveau 6 : les dorures — statues d'or devant la façade, crête de fleurons sur le faîte, bannières des six héros aux tours
    if (dor) {
      for (let i = 0; i < 9; i++)
        b.add(K.cone(0.13, 0.5, 4), {
          p: [0, HF + 0.45, ZA + 0.6 + i * ((ZF - ZA - 1.2) / 8)],
          c: OR,
          ch: 's',
          jit: 0
        });
      for (const sd of [1, -1]) {
        const x = sd * 3.9,
          z = ZF + T / 2 + 0.35;
        b.add(K.box(0.7, 2.6, 0.5), { p: [x, 1.3, z - 0.05], c: PIERD, c2: PIER });
        b.add(K.cone(0.42, 1.5, 6), { p: [x, 3.35, z], c: ORD, c2: OR, ch: 's' });
        b.add(K.ico(0.2, 1), { p: [x, 4.25, z], c: OR, ch: 's', jit: 0 });
        b.sym(s2 =>
          b.add(
            K.prism(
              [
                [0, 0],
                [0.6, 0.5],
                [0.75, 1.3],
                [0.3, 0.9]
              ],
              0.05
            ),
            {
              p: [x + s2 * 0.12, 3.2, z - 0.12],
              r: [PI / 2, 0, 0],
              s: [s2, 1, -1],
              c: OR,
              c2: 0xfff2c4,
              ch: 's',
              jit: 0
            }
          )
        );
        b.add(K.torus(0.17, 0.025, 4, 10), { p: [x, 4.6, z], r: [PI / 2, 0, 0], c: 0xfff2c4, ch: 'g', jit: 0 });
        cerc(x, z, 0.5);
        for (let k = 0; k < 3; k++) {
          const el = ELK[(sd > 0 ? 0 : 3) + k],
            bz = 6.1 + (k - 1) * 0.85;
          b.add(K.box(0.05, 2.6, 0.7), { p: [sd * 7.43, 5.9, bz], c: K.EL[el].dark, c2: K.EL[el].main, jit: 0 });
          b.add(K.box(0.05, 0.45, 0.7, 1, 0), { p: [sd * 7.43, 4.38, bz], r: [PI, 0, 0], c: K.EL[el].dark, jit: 0 });
          b.add(K.box(0.08, 0.08, 0.86), { p: [sd * 7.45, 7.2, bz], c: OR, ch: 's', jit: 0 });
          b.add(K.oct(0.12), { p: [sd * 7.47, 6.3, bz], c: K.EL[el].glow, ch: 'g', jit: 0 });
        }
      }
    }

    return {
      parts: [{ name: 'body', b }],
      bake: { ground: 0.12, groundH: 0.6 },
      spots,
      col,
      porte: [0, ZF + 2.4],
      lab: [0, L >= 4 ? 22 : 17.6, ZF],
      rad: 10.6
    };
  };
  MODELS['vil.hall'] = cathedrale;
}
