// ROC — le héros Tank, vu par ses coéquipiers. Fichier commun, sur le modèle de braise.js (même interface, même recette).
// Même gabarit que le gardien : ≈ 1,85 m (crête du casque), origine aux pieds, regarde vers −Z ; plus large que les autres (≈ 1,2 m avec le bouclier).
// Pièces : body, armL, armR (pivots aux épaules, comme le gardien), puis motR (la magie de l'élément au-dessus du poing droit, qui pulse).
// En plus de la recette : jambes = nombre de premiers objets de body qui sont les jambes (jambe droite x > 0, puis la gauche, autant
// chacune) ; mainD = nombre d'objets du bras droit à garder quand il tient une arme (ce qui suit est tenu en main).
// ctx.arme : il tient une arme (lobby, Dernier Toit) : bras le long du corps, sans la magie du poing, le bouclier passe dans le dos.
// Langage des formes : blocs carrés et plaques superposées (épaulières énormes, plastron, tassettes, grand bouclier au bras gauche).
// Couleurs : 60 % plaques dans les tons de l'élément, 30 % acier et cuir, 10 % or ; canal 'g' pour la gemme du plastron, du bouclier, la magie.
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    OR_D = PAL.goldD,
    CUIR = 0x6b4030,
    CUIR_D = 0x46291e,
    PEAU = PAL.skin,
    HY = 1.655;
  // l'élément se choisit : toute la palette vient de K.EL[ctx.el] (sans élément : la Terre, son élément d'origine)
  let ELK, E, PL, PL_D, PL_L, FER, FER_D, TISSU, TISSU_D, MOUST;
  const palRoc = el => {
    ELK = K.EL[el] ? el : 'terre';
    E = K.EL[ELK];
    PL = K.mix(E.main, E.dark, 0.68);
    PL_D = K.mix(E.dark, E.deep, 0.5);
    PL_L = E.main;
    FER = K.mix(0x737b84, E.dark, 0.15);
    FER_D = K.mix(PAL.ironL, E.deep, 0.25);
    TISSU = K.mix(E.dark, E.deep, 0.3);
    TISSU_D = K.mix(E.deep, PAL.black, 0.3);
    MOUST = K.mix(0x8a4a22, E.dark, 0.3);
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
  // nappe : surface souple d'un seul tenant, f(u, v) → [x, y, z] ; dedans : la face tournée vers le corps
  const nappe = (f, nu, nv, dedans) => {
    const v = [],
      P = [];
    for (let j = 0; j <= nv; j++) {
      const row = [];
      for (let i = 0; i <= nu; i++) row.push(f(i / nu, j / nv));
      P.push(row);
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = P[j][i],
          c = P[j][i + 1],
          d = P[j + 1][i + 1],
          e = P[j + 1][i];
        if (dedans) v.push(...a, ...c, ...d, ...a, ...d, ...e);
        else v.push(...a, ...d, ...c, ...a, ...e, ...d);
      }
    return { v, n: null };
  };
  // le grand bouclier : écu à pans coupés, bord d'or, plaque de l'élément, chevron, umbo et gemme lumineuse (face vers −Z)
  const ECU = [
    [-0.25, 0.3],
    [0.25, 0.3],
    [0.28, 0.24],
    [0.28, -0.06],
    [0.17, -0.27],
    [0, -0.38],
    [-0.17, -0.27],
    [-0.28, -0.06],
    [-0.28, 0.24]
  ];
  const CHEVRON = [
    [-0.2, 0.02],
    [0, 0.16],
    [0.2, 0.02],
    [0.2, -0.06],
    [0, 0.08],
    [-0.2, -0.06]
  ];
  const bouclier = (b, o) =>
    b.group(o, b => {
      plaque(b, ECU, 0.05, { p: [0, 0, 0.03], c: OR_D, c2: OR, ch: 's' });
      plaque(b, ECU, 0.03, { p: [0, 0.005, -0.02], s: [0.86, 0.86, 1], c: PL_D, c2: PL });
      plaque(b, CHEVRON, 0.015, { p: [0, -0.05, -0.05], c: PL_L });
      b.add(K.cyl(0.085, 0.1, 0.04, 8), { p: [0, 0.07, -0.06], r: [-PI / 2, 0, 0], c: OR, ch: 's' });
      b.add(K.oct(0.06), { p: [0, 0.07, -0.09], s: [1, 1.25, 0.6], c: E.main, c2: E.glow, ch: 'g', jit: 0 });
    });
  MODELS['hero.roc'] = ctx => {
    palRoc(ctx && ctx.el);
    const arme = !!(ctx && ctx.arme),
      b = K.make(2701),
      aL = K.make(2702),
      aR = K.make(2703),
      mR = K.make(2704);
    // --- jambes (les premiers objets de body) : soleret, grève, genouillère, galon d'or, cuissard d'acier
    b.sym(sd => {
      const x = sd * 0.15;
      b.add(K.box(0.19, 0.13, 0.34, 0.8, 0.7), { p: [x, 0.065, -0.05], c: PL_D, c2: PL });
      b.add(K.cyl(0.1, 0.115, 0.3, 6), { p: [x, 0.28, 0], c: PL_D, c2: PL });
      b.add(K.cyl(0.12, 0.124, 0.035, 6), { p: [x, 0.145, 0], c: OR, ch: 's' });
      b.add(K.ico(0.095, 0), { p: [x, 0.46, -0.05], s: [1.05, 0.95, 0.9], c: PL_L, c2: PL });
      b.add(K.cyl(0.12, 0.1, 0.32, 6), { p: [x, 0.62, 0], c: FER_D, c2: FER });
    });
    const jambes = b.items.length;
    // --- tassettes, ourlet d'or, ceinture et boucle à gemme, tabard de l'élément
    b.add(K.cyl(0.3, 0.355, 0.24, 8), { p: [0, 0.86, 0], s: [1, 1, 0.78], c: PL_D, c2: PL });
    b.add(K.cyl(0.357, 0.362, 0.03, 8), { p: [0, 0.745, 0], s: [1, 1, 0.78], c: OR, ch: 's' });
    b.add(K.cyl(0.305, 0.305, 0.1, 8), { p: [0, 1.0, 0], s: [1, 1, 0.8], c: CUIR });
    b.add(K.box(0.14, 0.12, 0.04), { p: [0, 1.0, -0.25], c: OR, ch: 's' });
    b.add(K.oct(0.035), { p: [0, 1.0, -0.275], s: [1, 1.2, 0.6], c: E.main, c2: E.glow, ch: 'g', jit: 0 });
    plaque(
      b,
      [
        [-0.12, 0],
        [0.12, 0],
        [0.13, -0.32],
        [0, -0.4],
        [-0.13, -0.32]
      ],
      0.02,
      { p: [0, 0.95, -0.275], r: [0.12, 0, 0], c: OR, ch: 's' }
    );
    plaque(
      b,
      [
        [-0.1, -0.01],
        [0.1, -0.01],
        [0.11, -0.3],
        [0, -0.37],
        [-0.11, -0.3]
      ],
      0.02,
      { p: [0, 0.95, -0.285], r: [0.12, 0, 0], c: TISSU, c2: K.mix(TISSU, PL, 0.35) }
    );
    plaque(b, CHEVRON, 0.012, { p: [0, 0.8, -0.322], r: [0.12, 0, 0], s: 0.62, c: OR, ch: 's' });
    // --- torse massif, sangle d'acier, plastron bombé liseré d'or et sa gemme, gorgerin
    b.add(K.cyl(0.36, 0.29, 0.46, 8), { p: [0, 1.27, 0], s: [1, 1, 0.78], c: PL, c2: K.mix(PL, PL_L, 0.3) });
    b.add(K.cyl(0.305, 0.31, 0.045, 8), { p: [0, 1.08, 0], s: [1, 1, 0.8], c: FER });
    const PEC = [
      [-0.2, 0],
      [0.2, 0],
      [0.23, -0.1],
      [0.13, -0.24],
      [0, -0.28],
      [-0.13, -0.24],
      [-0.23, -0.1]
    ];
    plaque(b, PEC, 0.03, { p: [0, 1.47, -0.245], r: [-0.18, 0, 0], c: OR, ch: 's' });
    plaque(b, PEC, 0.03, {
      p: [0, 1.46, -0.255],
      r: [-0.18, 0, 0],
      s: [0.88, 0.88, 1],
      c: PL_L,
      c2: K.mix(PL_L, E.light, 0.4)
    });
    b.add(K.torus(0.045, 0.012, 4, 8), { p: [0, 1.33, -0.31], r: [-0.18, 0, 0], c: OR, ch: 's' });
    b.add(K.oct(0.045), { p: [0, 1.33, -0.315], s: [1, 1.3, 0.6], c: E.main, c2: E.glow, ch: 'g', jit: 0 });
    b.add(K.cyl(0.19, 0.28, 0.14, 8), { p: [0, 1.52, 0.01], s: [1, 1, 0.85], c: PL_D, c2: PL });
    b.add(K.cyl(0.195, 0.2, 0.025, 8), { p: [0, 1.59, 0.01], s: [1, 1, 0.85], c: OR, ch: 's' });
    // --- épaulières énormes et basses : coque, bord d'or, deux lames dessous, trois rivets
    b.sym(sd =>
      b.group({ p: [sd * 0.43, 1.5, 0], r: [0, 0, -sd * 0.3] }, b => {
        b.add(K.cyl(0.2, 0.235, 0.09, 7), { p: [sd * 0.02, -0.07, 0], s: [1.1, 1, 1.1], c: PL_D, c2: PL });
        b.add(K.dome(0.23, 7, 3), { s: [1.1, 0.7, 1.1], c: PL, c2: PL_L });
        b.add(K.cyl(0.24, 0.245, 0.035, 7), { p: [0, -0.005, 0], s: [1.1, 1, 1.1], c: OR, ch: 's' });
        [-0.09, 0, 0.09].forEach(z => b.add(K.oct(0.024), { p: [0, 0.155, z], c: OR, ch: 's' }));
      })
    );
    // --- tête (un peu grande : groupe agrandi) : visage rond et jovial, yeux, sourcils épais, joues, gros nez, moustache, sourire
    b.add(K.cyl(0.075, 0.085, 0.1, 6), { p: [0, 1.56, -0.01], c: K.shade(PEAU, 0.85) });
    b.group({ p: [0, HY, 0], s: 1.1 }, b => {
      b.add(K.sph(0.16, 9, 7), { p: [0, 0, -0.03], s: [1.02, 1, 0.95], c: PEAU, flat: false, jit: 0 });
      b.sym(sd => {
        SH.eye(b, { p: [sd * 0.058, 0.008, -0.16], r: 0.04, rot: [0, PI - sd * 0.22, 0], iris: 0x2a1a0c });
        b.add(K.box(0.062, 0.022, 0.02), {
          p: [sd * 0.062, 0.062, -0.158],
          r: [0, -sd * 0.2, sd * 0.1],
          c: MOUST,
          jit: 0
        });
        b.add(K.sph(0.026, 5, 3), {
          p: [sd * 0.1, -0.04, -0.14],
          s: [1, 0.6, 0.4],
          c: 0xf0937a,
          flat: false,
          jit: 0
        });
        b.add(
          K.tube(
            K.curve(
              [
                [sd * 0.004, -0.042, -0.188],
                [sd * 0.045, -0.052, -0.18],
                [sd * 0.088, -0.045, -0.158],
                [sd * 0.108, -0.016, -0.138]
              ],
              4
            ),
            [0.013, 0.016, 0.015, 0.011, 0.006, 0.002],
            5
          ),
          { c: MOUST, jit: 0 }
        );
      });
      b.add(K.cone(0.026, 0.05, 4), { p: [0, -0.015, -0.2], r: [-PI / 2, 0, 0], c: K.shade(PEAU, 0.88) });
      b.add(K.torus(0.046, 0.012, 3, 8, PI), { p: [0, -0.088, -0.158], r: [-0.3, 0, PI], c: 0x7a2a1a, jit: 0 });
      // --- casque ouvert : calotte, bord d'or, couvre-joues, visière relevée (bandeau courbe sur le front), crête en aileron
      b.add(K.dome(0.2, 9, 4), { p: [0, 0.015, 0], r: [0.32, 0, 0], s: [1.03, 1, 1.08], c: PL, c2: PL_L });
      b.add(K.torus(0.2, 0.016, 4, 14), {
        p: [0, 0.015, 0],
        r: [PI / 2 + 0.32, 0, 0],
        s: [1.03, 1.08, 1],
        c: OR,
        ch: 's'
      });
      b.sym(sd =>
        b.add(K.box(0.035, 0.14, 0.14, 1, 0.75), {
          p: [sd * 0.18, -0.03, 0.01],
          r: [0.12, 0, sd * 0.1],
          c: PL_D,
          c2: PL
        })
      );
      b.add(K.torus(0.212, 0.03, 4, 9, PI * 0.8), {
        p: [0, 0.03, 0],
        r: [-PI / 2 + 1.05, 0, PI / 2 - PI * 0.4],
        s: [1.03, 1.03, 1.3],
        c: PL_L,
        c2: K.mix(PL_L, E.light, 0.3)
      });
      b.sym(sd => b.add(K.oct(0.03), { p: [sd * 0.205, 0.03, -0.01], c: OR, ch: 's' }));
      b.group({ p: [0, 0.015, 0], r: [0.32, 0, 0], s: [0.45, 1, 1] }, b =>
        b.add(
          K.tube(
            [-1.0, -0.5, 0, 0.5, 0.95].map(a => [0, 0.2 * Math.cos(a), -0.215 * Math.sin(a)]),
            [0.025, 0.045, 0.05, 0.045, 0.025],
            5
          ),
          { c: OR_D, c2: OR, ch: 's' }
        )
      );
    });
    // --- cape courte dans le dos, tons sombres de l'élément, doublure ; ourlet droit
    const capeF = (u, v) => {
      const a = (u - 0.5) * 2.2,
        r = 0.33 + 0.08 * v;
      return [Math.sin(a) * r * 1.05, 1.5 - 0.75 * v, 0.05 + Math.cos(a) * r * 0.72 + 0.08 * v * v];
    };
    b.add(nappe(capeF, 8, 3, false), { c: TISSU, c2: K.mix(TISSU, PL, 0.3), jit: 0.05 });
    b.add(nappe(capeF, 8, 3, true), { c: TISSU_D, jit: 0.05 });
    b.add(
      K.tube(
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => capeF(k / 8, 1)),
        0.016,
        4
      ),
      { c: OR, ch: 's' }
    );
    plaque(b, CHEVRON, 0.012, { p: [0, 1.2, 0.45], r: [-0.12, PI, 0], s: 0.68, c: OR, ch: 's' });
    // le bouclier, dans le dos quand il tient une arme
    if (arme) bouclier(b, { p: [0, 1.12, 0.4], r: [0.08, PI, 0], s: 0.95 });
    // --- bras (pièces animées) : manche d'acier, coude, canon d'avant-bras, manchette d'or, gantelet carré
    const bras = (a, sd) => {
      const S = [sd * 0.42, 1.44, 0],
        gauche = sd < 0,
        C = arme ? [sd * 0.44, 1.15, 0.01] : gauche ? [sd * 0.46, 1.17, 0.04] : [sd * 0.46, 1.16, 0.02],
        W = arme ? [sd * 0.44, 0.96, -0.01] : gauche ? [sd * 0.46, 1.12, -0.2] : [sd * 0.47, 0.98, -0.12],
        H = arme ? [sd * 0.44, 0.88, -0.01] : gauche ? [sd * 0.46, 1.1, -0.28] : [sd * 0.475, 0.92, -0.18],
        dy = W[1] - C[1],
        dz = W[2] - C[2],
        th = Math.atan2(-dz, -dy);
      a.add(K.tube([S, [sd * 0.44, 1.3, 0.01], C], [0.105, 0.1, 0.092], 6), { c: FER_D, c2: FER });
      a.add(K.cyl(0.11, 0.105, 0.09, 6), { p: [sd * 0.44, 1.27, 0.01], c: PL_D, c2: PL });
      a.add(K.ico(0.08, 0), { p: C, c: PL_L, c2: PL });
      a.add(K.tube([C, W], [0.09, 0.098], 6), { c: PL, c2: PL_L });
      a.add(K.cyl(0.104, 0.104, 0.035, 6), { p: W, r: [th, 0, 0], c: OR, ch: 's' });
      a.group({ p: H, r: [th, 0, 0] }, a => {
        a.add(K.box(0.15, 0.15, 0.15, 0.9, 0.9), { c: PL_D, c2: PL });
        if (arme || sd > 0)
          a.add(K.box(0.16, 0.05, 0.08), { p: [0, -0.05, -0.05], c: FER, c2: K.mix(FER, 0xffffff, 0.2) });
        a.add(K.box(0.05, 0.08, 0.06), { p: [-sd * 0.08, 0.0, -0.04], r: [0, 0, sd * 0.3], c: PL_D });
      });
    };
    bras(aL, -1);
    bras(aR, 1);
    // le grand bouclier au bras gauche, face tournée vers l'extérieur et l'avant
    if (!arme) bouclier(aL, { p: [-0.58, 1.08, -0.12], r: [0, 0.95, 0] });
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
    // --- la magie de l'élément au-dessus du poing droit (pièce animée : elle pulse) : motif de shared.js et éclats
    if (!arme) {
      SH.motif(mR, ELK, { p: [0.475, 1.0, -0.18], r: [0, 0.6, 0], s: 0.42 });
      [
        [0.05, 0.3, 0.02, 0.018],
        [-0.05, 0.36, -0.01, 0.014],
        [0.015, 0.43, 0.03, 0.011]
      ].forEach(q => mR.add(K.oct(q[3]), { p: [0.475 + q[0], 1.0 + q[1], -0.18 + q[2]], c: E.glow, ch: 'g', jit: 0 }));
      parts.push({
        name: 'motR',
        b: mR,
        parent: 'armR',
        pivot: [0.475, 1.0, -0.18],
        anim: [{ k: 'scl', axis: 'y', amp: 0.3, sp: 9 }]
      });
    }
    return { parts, bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } }, scale: 1, labelY: 2.2, jambes, mainD };
  };
}
