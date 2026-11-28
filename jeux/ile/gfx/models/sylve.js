// SYLVE — la héroïne Combattante, vue par ses coéquipiers. Fichier commun, sur le modèle de braise.js (même interface, même recette).
// Même gabarit que le gardien : ≈ 1,8 m, origine aux pieds, regarde vers −Z ; plus fine que Braise, épaules étroites.
// Pièces : body, armL, armR (pivots aux épaules, comme le gardien), puis motL (la magie de l'élément dans la main gauche, qui pulse).
// En plus de la recette : pas (multiplicateur de l'amplitude de marche des jambes, 1 par défaut ; les longues robes en veulent moins) ; jambes = nombre de premiers objets de body qui sont les jambes (jambe droite x > 0, puis la gauche, autant
// chacune) ; mainD = nombre d'objets du bras droit à garder quand elle tient une arme (ce qui suit est tenu en main).
// ctx.arme : elle tient une arme (lobby, Dernier Toit) : bras le long du corps, sans la magie de la main.
// Langage des formes : flèches et feuilles pointues (tassettes en feuilles, épaulière d'écailles, lames croisées, longue tresse au vent).
// Couleurs : 60 % cuir teint et feuilles dans les tons de l'élément, 30 % cuir naturel, peau et cheveux prune sombre (qui ne se confondent avec aucun élément), 10 % or et acier.
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    OR_D = PAL.goldD,
    CUIR = 0x7a4a30,
    CUIR_D = 0x4a2c1e,
    ACIER = PAL.steel,
    PEAU = 0xf0c49a,
    HY = 1.66;
  // l'élément se choisit : toute la palette vient de K.EL[ctx.el] (sans élément : le Bois, son élément d'origine)
  let ELK, E, PL, PL_D, PL_L, LEG, FOUL, CHEVEUX, CHEVEUX_D;
  const palSylve = el => {
    ELK = K.EL[el] ? el : 'bois';
    E = K.EL[ELK];
    PL = K.mix(E.main, E.dark, 0.45);
    PL_D = K.mix(E.dark, E.deep, 0.3);
    PL_L = K.mix(E.main, E.light, 0.4);
    LEG = K.mix(K.mix(E.dark, E.deep, 0.5), 0x4a3a30, 0.4);
    FOUL = K.mix(E.main, E.light, 0.6);
    // cheveux prune sombre, la même dans les six éléments : seule teinte qui se détache de l'armure feu, bois, eau, terre, foudre ou vent
    CHEVEUX = 0x4a3668;
    CHEVEUX_D = 0x2a1d3d;
  };
  // plaque : polygone [[x, y], …] dans le plan de face, épaisseur ep vers l'avant (−Z) à partir de o.p
  const plaque = (b, pts, ep, o) =>
    b.group({ p: o.p, r: o.r || [0, 0, 0], s: o.s || 1 }, b =>
      b.add(K.prism(pts, ep), {
        r: [-PI / 2, 0, 0],
        c: o.c,
        c2: o.c2,
        ch: o.ch,
        jit: o.jit === undefined ? 0.04 : o.jit
      })
    );
  // feuille pointue vers le bas (tassettes, écailles) : de y = 0 à y = −1, largeur 0,6
  const FEUILLE = [
    [-0.22, 0],
    [0.22, 0],
    [0.3, -0.45],
    [0, -1],
    [-0.3, -0.45]
  ];
  // une lame courte : lame d'acier en losange allongé, garde d'or, poignée de cuir, pommeau lumineux (le long de +Y)
  const LAME = [
    [-0.03, 0],
    [0.03, 0],
    [0.036, 0.37],
    [0, 0.5],
    [-0.036, 0.37]
  ];
  const lame = (b, o) =>
    b.group(o, b => {
      plaque(b, LAME, 0.012, { p: [0, 0, 0.006], c: ACIER, c2: 0xe8eef2, ch: 's', jit: 0 });
      b.add(K.box(0.14, 0.025, 0.035), { p: [0, 0, 0], c: OR, ch: 's' });
      b.add(K.cyl(0.016, 0.018, 0.11, 5), { p: [0, -0.068, 0], c: CUIR_D });
      b.add(K.oct(0.024), { p: [0, -0.135, 0], s: [1, 1.3, 1], c: E.main, c2: E.glow, ch: 'g', jit: 0 });
    });
  MODELS['hero.sylve'] = ctx => {
    palSylve(ctx && ctx.el);
    const arme = !!(ctx && ctx.arme),
      b = K.make(2801),
      aL = K.make(2802),
      aR = K.make(2803),
      mL = K.make(2804);
    // --- jambes (les premiers objets de body) : botte à revers en feuille, genouillère, jambière
    b.sym(sd => {
      const x = sd * 0.1;
      b.add(K.box(0.115, 0.09, 0.26, 0.85, 0.65), { p: [x, 0.045, -0.035], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.066, 0.07, 0.34, 6), { p: [x, 0.26, 0], c: CUIR_D, c2: CUIR });
      plaque(b, FEUILLE, 0.015, {
        p: [x + sd * 0.01, 0.37, -0.07],
        r: [PI - 0.15, 0, sd * 0.25],
        s: [0.32, 0.16, 1],
        c: PL,
        c2: PL_L
      });
      b.add(K.oct(0.055), { p: [x, 0.47, -0.055], s: [0.9, 1.3, 0.6], c: PL_L, c2: E.light });
      b.add(K.cyl(0.074, 0.064, 0.36, 6), { p: [x, 0.6, 0], c: LEG });
    });
    const jambes = b.items.length;
    // --- hanches, ceinture et boucle en feuille d'or, tassettes en feuilles pointues tout autour
    b.add(K.cyl(0.175, 0.195, 0.16, 8), { p: [0, 0.89, 0], s: [1, 1, 0.8], c: LEG });
    b.add(K.cyl(0.185, 0.19, 0.06, 8), { p: [0, 0.99, 0], s: [1, 1, 0.8], c: CUIR });
    plaque(b, FEUILLE, 0.015, { p: [0, 1.035, -0.155], s: [0.16, 0.09, 1], c: OR, ch: 's' });
    [-1.25, -0.62, 0, 0.62, 1.25, PI - 0.55, PI, PI + 0.55].forEach((a, i) =>
      b.group({ p: [Math.sin(a) * 0.18, 0.975, -Math.cos(a) * 0.145], r: [0, -a, 0] }, b =>
        plaque(b, FEUILLE, 0.014, {
          p: [0, 0, 0],
          r: [0.22, 0, 0],
          s: [0.36, i === 2 || i === 6 ? 0.3 : 0.24, 1],
          c: i % 2 ? PL_D : PL,
          c2: i % 2 ? PL : PL_L
        })
      )
    );
    // --- torse athlétique : corselet de cuir teint, plastron d'écailles en V liseré d'or, baudrier des lames
    b.add(K.cyl(0.205, 0.165, 0.4, 8), { p: [0, 1.22, 0], s: [1, 1, 0.74], c: PL, c2: K.mix(PL, PL_L, 0.25) });
    plaque(
      b,
      [
        [-0.13, 0],
        [0.13, 0],
        [0, -0.22]
      ],
      0.02,
      { p: [0, 1.42, -0.135], r: [-0.12, 0, 0], c: OR, ch: 's' }
    );
    plaque(
      b,
      [
        [-0.105, -0.01],
        [0.105, -0.01],
        [0, -0.185]
      ],
      0.02,
      { p: [0, 1.42, -0.145], r: [-0.12, 0, 0], c: PL_L }
    );
    b.add(K.box(0.05, 0.56, 0.02), { p: [0.0, 1.22, -0.143], r: [-0.04, 0, -0.72], c: CUIR_D });
    b.add(K.oct(0.022), { p: [0.095, 1.33, -0.152], c: OR, ch: 's' });
    // --- foulard noué au cou : col, nœud sur le côté, deux rubans courts
    b.add(K.cyl(0.1, 0.135, 0.08, 8), { p: [0, 1.47, 0], s: [1, 1, 0.85], c: FOUL, c2: K.mix(FOUL, E.light, 0.4) });
    b.add(K.oct(0.04), { p: [0.085, 1.455, -0.105], s: [1, 0.8, 0.7], c: FOUL });
    [
      [0.07, 0.25],
      [0.1, -0.2]
    ].forEach(q =>
      plaque(
        b,
        [
          [-0.022, 0],
          [0.022, 0],
          [0.03, -0.12],
          [0, -0.09],
          [-0.03, -0.12]
        ],
        0.012,
        { p: [q[0], 1.45, -0.115], r: [-0.25, 0, q[1]], c: FOUL, c2: K.mix(FOUL, E.light, 0.4) }
      )
    );
    // --- épaulière gauche d'écailles en feuilles (trois feuilles qui descendent vers l'extérieur) ; cuir à droite
    b.group({ p: [-0.27, 1.47, 0] }, b => {
      b.add(K.dome(0.1, 6, 2), { s: [1.1, 0.7, 1.1], c: CUIR, c2: K.mix(CUIR, PL, 0.3) });
      [
        [-0.065, 0.85],
        [0.065, 0.85],
        [0, 1]
      ].forEach((q, i) =>
        b.group({ p: [-0.01, 0.045, q[0]], r: [0, PI / 2, 0] }, b =>
          plaque(b, FEUILLE, 0.018, {
            p: [0, 0, 0],
            r: [0.85, 0, i === 2 ? 0 : i ? -0.3 : 0.3],
            s: [0.3 * q[1], 0.21 * q[1], 1],
            c: i === 2 ? PL_L : PL,
            c2: i === 2 ? E.light : PL_L
          })
        )
      );
      b.add(K.oct(0.025), { p: [-0.03, 0.08, 0], c: OR, ch: 's' });
    });
    b.add(K.dome(0.085, 6, 2), { p: [0.27, 1.46, 0], s: [1.1, 0.7, 1.1], c: CUIR, c2: K.mix(CUIR, OR, 0.15) });
    // --- deux lames courtes croisées dans le dos, gardes et pommeaux au niveau des épaules
    b.sym(sd => lame(b, { p: [sd * 0.14, 1.41, 0.2 + sd * 0.012], r: [-0.12, 0, PI - sd * 0.5] }));
    b.add(K.box(0.08, 0.08, 0.03), { p: [0, 1.15, 0.19], r: [0, 0, PI / 4], c: CUIR_D });
    // --- tête : visage doux, grands yeux à cils, nez fin, sourire, oreilles pointues, frange, serre-tête et sa feuille
    b.add(K.cyl(0.055, 0.065, 0.1, 6), { p: [0, 1.53, 0], c: K.shade(PEAU, 0.85) });
    b.add(K.sph(0.152, 9, 7), { p: [0, HY, -0.03], s: [0.95, 1.02, 0.95], c: PEAU, flat: false, jit: 0 });
    b.sym(sd => {
      SH.eye(b, {
        p: [sd * 0.055, HY + 0.008, -0.155],
        r: 0.041,
        rot: [0, PI - sd * 0.22, 0],
        iris: K.mix(E.dark, 0x1c2a16, 0.3)
      });
      b.add(K.box(0.035, 0.014, 0.012), {
        p: [sd * 0.086, HY + 0.04, -0.148],
        r: [0, -sd * 0.35, sd * 0.5],
        c: 0x2a1810,
        jit: 0
      });
      b.add(K.box(0.046, 0.011, 0.014), {
        p: [sd * 0.058, HY + 0.07, -0.152],
        r: [0, -sd * 0.2, -sd * 0.18],
        c: CHEVEUX_D,
        jit: 0
      });
      b.add(K.sph(0.024, 5, 3), {
        p: [sd * 0.093, HY - 0.035, -0.132],
        s: [1, 0.6, 0.4],
        c: 0xf2907e,
        flat: false,
        jit: 0
      });
      b.add(K.cone(0.03, 0.1, 4), {
        p: [sd * 0.155, HY + 0.01, 0.0],
        r: [0.5, 0, -sd * 1.15],
        s: [1, 1, 0.45],
        c: PEAU,
        c2: K.shade(PEAU, 1.05)
      });
    });
    b.add(K.cone(0.015, 0.032, 4), { p: [0, HY - 0.02, -0.18], r: [-PI / 2, 0, 0], c: K.shade(PEAU, 0.9) });
    b.add(K.torus(0.03, 0.008, 3, 6, PI), { p: [0, HY - 0.058, -0.152], r: [-0.25, 0, PI], c: 0xb03a3a, jit: 0 });
    // --- cheveux : calotte, frange balayée sur le côté, serre-tête d'or et feuille lumineuse
    b.add(K.ico(0.168, 1), { p: [0, HY + 0.035, 0.03], s: [1.0, 1.0, 1.06], c: CHEVEUX_D, c2: CHEVEUX });
    [
      [-0.1, 0.11, 0.12],
      [-0.04, 0.13, 0.13],
      [0.025, 0.125, 0.11],
      [0.085, 0.105, 0.08]
    ].forEach(q =>
      b.add(K.cone(0.045, q[2], 4), {
        p: [q[0], HY + q[1], -0.125],
        r: [PI + 0.45, 0, -1.0],
        s: [1, 1, 0.45],
        c: CHEVEUX,
        c2: K.mix(CHEVEUX, 0xffd9a0, 0.2)
      })
    );
    b.sym(sd =>
      b.add(
        K.tube(
          K.curve(
            [
              [sd * 0.118, HY + 0.09, -0.11],
              [sd * 0.15, HY - 0.0, -0.105],
              [sd * 0.145, HY - 0.1, -0.08],
              [sd * 0.12, HY - 0.17, -0.06]
            ],
            5
          ),
          [0.035, 0.038, 0.034, 0.028, 0.02, 0.01],
          5
        ),
        { c: CHEVEUX, c2: K.mix(CHEVEUX, 0xffd9a0, 0.15), jit: 0.03 }
      )
    );
    b.add(K.torus(0.163, 0.009, 3, 10, PI), {
      p: [0, HY + 0.085, -0.02],
      r: [-PI / 2 - 0.35, 0, PI],
      s: [1.02, 1.1, 1],
      c: OR,
      ch: 's'
    });
    plaque(b, FEUILLE, 0.012, {
      p: [-0.075, HY + 0.155, -0.14],
      r: [-0.45, 0.3, 0.4],
      s: [0.11, 0.085, 1],
      c: E.main,
      c2: E.glow,
      ch: 'g',
      jit: 0
    });
    // --- longue tresse au vent : nattes en chapelet qui partent de la nuque, rubans, mèche finale
    const TRESSE = K.curve(
      [
        [0, HY - 0.01, 0.15],
        [0.02, HY - 0.13, 0.22],
        [0.0, 1.36, 0.3],
        [-0.06, 1.2, 0.37],
        [-0.1, 1.04, 0.46]
      ],
      10
    );
    b.add(K.ico(0.075, 0), { p: [0, HY - 0.0, 0.13], s: [1.1, 1, 0.9], c: CHEVEUX_D, c2: CHEVEUX });
    TRESSE.forEach((p, i) => {
      if (i === 0) return;
      const r = 0.058 - i * 0.0025;
      b.add(K.ico(r, 0), {
        p,
        r: [0.3, 0, i % 2 ? 0.55 : -0.55],
        s: [1.05, 1.45, 0.85],
        c: i % 2 ? CHEVEUX : CHEVEUX_D,
        c2: CHEVEUX
      });
    });
    const fin = TRESSE[TRESSE.length - 1];
    b.add(K.cyl(0.03, 0.03, 0.04, 6), { p: [fin[0], fin[1] - 0.04, fin[2]], c: OR, ch: 's' });
    b.add(K.cone(0.045, 0.13, 5), {
      p: [fin[0], fin[1] - 0.12, fin[2] + 0.01],
      r: [PI, 0, 0],
      c: CHEVEUX,
      c2: CHEVEUX_D
    });
    // --- bras (pièces animées) : épaule nue, brassard de cuir, feuille sur l'avant-bras, bracelet d'or, main un peu grande
    const bras = (a, sd) => {
      const S = [sd * 0.275, 1.43, 0],
        gauche = sd < 0,
        C = arme ? [sd * 0.3, 1.15, 0.01] : gauche ? [sd * 0.33, 1.2, 0.04] : [sd * 0.32, 1.16, 0.03],
        W = arme ? [sd * 0.3, 0.97, -0.01] : gauche ? [sd * 0.31, 1.15, -0.2] : [sd * 0.31, 1.02, -0.15],
        H = arme ? [sd * 0.3, 0.9, -0.01] : gauche ? [sd * 0.305, 1.16, -0.27] : [sd * 0.3, 0.99, -0.215],
        dy = W[1] - C[1],
        dz = W[2] - C[2],
        th = Math.atan2(-dz, -dy);
      a.add(K.tube([S, [sd * 0.3, 1.3, 0.02], C], [0.058, 0.052, 0.046], 6), { c: K.shade(PEAU, 0.95), c2: PEAU });
      a.add(K.tube([C, W], [0.05, 0.058], 6), { c: CUIR, c2: K.mix(CUIR, 0xffffff, 0.1) });
      a.group({ p: [(C[0] + W[0]) / 2 + sd * 0.045, (C[1] + W[1]) / 2, (C[2] + W[2]) / 2], r: [th - PI, 0, 0] }, a =>
        plaque(a, FEUILLE, 0.012, { p: [0, 0.1, 0], r: [0, (sd * PI) / 2, 0], s: [0.22, 0.2, 1], c: PL, c2: PL_L })
      );
      a.add(K.cyl(0.062, 0.062, 0.025, 6), { p: W, r: [th, 0, 0], c: OR, ch: 's' });
      a.add(K.ico(0.06, 1), {
        p: H,
        r: [th, 0, 0],
        s: arme ? [0.8, 1.05, 1] : [0.9, 1.05, 0.75],
        c: PEAU,
        c2: K.shade(PEAU, 1.04)
      });
      a.add(K.cone(0.02, 0.055, 4), { p: [H[0] - sd * 0.05, H[1] + 0.01, H[2] - 0.01], r: [th, 0, sd * 0.9], c: PEAU });
    };
    bras(aL, -1);
    bras(aR, 1);
    const parts = [
      { name: 'body', b },
      {
        name: 'armL',
        b: aL,
        parent: 'body',
        pivot: [-0.3, 1.42, 0],
        anim: [{ k: 'rot', axis: 'x', amp: 0.35, sp: 6 }]
      },
      {
        name: 'armR',
        b: aR,
        parent: 'body',
        pivot: [0.3, 1.42, 0],
        anim: [{ k: 'rot', axis: 'x', amp: 0.35, sp: 6, ph: PI }]
      }
    ];
    const mainD = aR.items.length;
    // --- la magie de l'élément dans la main gauche levée (pièce animée : elle pulse) : motif de shared.js, vrille lumineuse, éclats
    if (!arme) {
      const M = [-0.305, 1.2, -0.275];
      SH.motif(mL, ELK, { p: M, r: [0, -0.5, 0], s: 0.34 });
      mL.add(K.torus(0.075, 0.009, 3, 10), {
        p: [M[0], M[1] + 0.05, M[2]],
        r: [PI / 2 - 0.3, 0, 0],
        c: E.light,
        c2: E.glow,
        ch: 'g',
        jit: 0
      });
      [
        [-0.05, 0.28, 0.02, 0.016],
        [0.05, 0.33, -0.01, 0.013],
        [-0.015, 0.4, 0.03, 0.01]
      ].forEach(q => mL.add(K.oct(q[3]), { p: [M[0] + q[0], M[1] + q[1], M[2] + q[2]], c: E.glow, ch: 'g', jit: 0 }));
      parts.push({
        name: 'motL',
        b: mL,
        parent: 'armL',
        pivot: M,
        anim: [{ k: 'scl', axis: 'y', amp: 0.3, sp: 10 }]
      });
    }
    return {
      parts,
      bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } },
      scale: 1,
      labelY: 2.15,
      jambes,
      pas: 1,
      mainD
    };
  };
}
