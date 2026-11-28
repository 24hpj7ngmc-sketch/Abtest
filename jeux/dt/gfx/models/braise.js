// BRAISE — le héros Mage de feu, vu par ses coéquipiers (V12.8). Fichier commun : copié à l'identique dans jeux/dt/gfx/models/ et jeux/ile/gfx/models/.
// Même gabarit que le gardien (hero.avatar) : ≈ 1,8 m (pointe de la capuche ≈ 2,1 m), origine aux pieds, regarde vers −Z.
// Pièces : body, armL, armR (pivots aux épaules, comme le gardien), puis flamL et flamR (les flammes des mains, qui vacillent).
// En plus de la recette : jambes = nombre de premiers objets de body qui sont les jambes (jambe droite x > 0, puis la gauche, autant
// chacune) ; mainD = nombre d'objets du bras droit à garder quand il tient une arme (ce qui suit est tenu en main).
// ctx.arme : il tient une arme (lobby, Dernier Toit) : bras tendus le long du corps, sans les flammes.
// Langage des formes : triangles et pointes qui montent (capuche, épaulières, ourlets en langues de feu).
// Couleurs : 60 % rouge profond et brique, 30 % orange braise, 10 % or ; canal 'g' (lumineux) pour les flammes, runes et braises.
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    OR_D = PAL.goldD,
    CUIR = 0x6b4030,
    GANT = 0x93603e,
    CUIR_D = 0x46291e,
    PEAU = PAL.skin,
    HY = 1.67;
  // V12.9 : Braise est Mage, son élément se choisit au Hall : la tenue, les flammes et les runes prennent la palette de ctx.el.
  // Au Feu, les couleurs d'origine à l'identique. palBraise(el) remplit les couleurs ci-dessous avant chaque fabrication.
  let ELK, E, ROUGE, ROUGE_D, BRIQUE, ORANGE, ORANGE_L, FEU, JUPE, DOUBLURE, PANT, CHEVEUX;
  const palBraise = el => {
    const feu = !K.EL[el] || el === 'feu';
    ELK = feu ? 'feu' : el;
    E = K.EL[ELK];
    ROUGE = feu ? 0xc0322a : K.mix(E.main, E.dark, 0.55);
    ROUGE_D = feu ? 0x82201a : K.mix(E.dark, E.deep, 0.45);
    BRIQUE = E.dark;
    ORANGE = E.main;
    ORANGE_L = E.light;
    FEU = E.glow;
    JUPE = K.mix(ORANGE, ROUGE, 0.45);
    DOUBLURE = K.mix(ORANGE, BRIQUE, 0.35);
    PANT = feu ? 0x5a2a22 : K.mix(0x3a3530, E.deep, 0.5);
    CHEVEUX = feu ? 0xe0521f : K.mix(E.main, E.light, 0.25);
  };
  // plaque : polygone [[x, y], …] dans le plan de face, épaisseur ep vers l'avant (−Z) à partir de o.p
  const plaque = (b, pts, ep, o) =>
    b.group({ p: o.p, r: o.r || [0, 0, 0] }, b =>
      b.add(K.prism(pts, ep), { r: [-PI / 2, 0, 0], c: o.c, ch: o.ch, jit: o.jit === undefined ? 0.04 : o.jit })
    );
  // nappe : surface souple d'un seul tenant, f(u, v) → [x, y, z], u de gauche à droite, v de haut en bas ; dedans : la face tournée vers le corps
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
  // langue de feu : cône aplati à quatre pans ; base c, pointe c2 ; o.bas : pointe vers le bas
  const langue = (b, p, r, l, o) =>
    b.add(K.cone(r, l, 4), {
      p,
      r: o.r || (o.bas ? [PI, 0, 0] : [0, 0, 0]),
      s: [1, 1, o.ep || 0.4],
      c: o.c,
      c2: o.c2,
      ch: o.ch,
      jit: 0
    });
  MODELS['hero.braise'] = ctx => {
    palBraise(ctx && ctx.el);
    const arme = !!ctx.arme,
      b = K.make(2601),
      aL = K.make(2602),
      aR = K.make(2603),
      fL = K.make(2604),
      fR = K.make(2605);
    // --- jambes (les premiers objets de body) : botte, revers à deux flammes, pantalon
    b.sym(sd => {
      const x = sd * 0.11;
      b.add(K.box(0.135, 0.1, 0.28, 0.85, 0.7), { p: [x, 0.05, -0.04], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.07, 0.078, 0.3, 6), { p: [x, 0.24, 0], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.09, 0.08, 0.06, 6), { p: [x, 0.41, 0], c: BRIQUE, c2: ORANGE });
      langue(b, [x + sd * 0.045, 0.47, -0.045], 0.035, 0.1, { r: [-0.35, 0, -sd * 0.35], c: ORANGE, c2: FEU });
      langue(b, [x - sd * 0.01, 0.47, -0.075], 0.03, 0.08, { r: [-0.45, 0, sd * 0.1], c: ORANGE, c2: FEU });
      b.add(K.cyl(0.08, 0.072, 0.34, 6), { p: [x, 0.6, 0], c: PANT });
    });
    const jambes = b.items.length;
    // --- jupe de la robe, ourlet d'or, ceinture, boucle-braise, talisman, grimoire
    b.add(K.cyl(0.205, 0.27, 0.34, 8), { p: [0, 0.86, 0], s: [1, 1, 0.8], c: JUPE, c2: ROUGE });
    b.add(K.cyl(0.272, 0.278, 0.03, 8), { p: [0, 0.7, 0], s: [1, 1, 0.8], c: OR, ch: 's' });
    b.add(K.cyl(0.212, 0.214, 0.075, 8), { p: [0, 1.03, 0], s: [1, 1, 0.8], c: CUIR });
    b.add(K.cyl(0.052, 0.052, 0.026, 8), { p: [0, 1.03, -0.178], r: [PI / 2, 0, 0], c: OR, ch: 's' });
    b.add(K.oct(0.03), { p: [0, 1.03, -0.195], s: [1, 1.2, 0.6], c: ORANGE, c2: FEU, ch: 'g', jit: 0 });
    b.add(K.torus(0.022, 0.007, 4, 8), { p: [-0.14, 0.975, -0.14], r: [0, 0.5, 0], c: OR, ch: 's' });
    b.add(K.oct(0.036), { p: [-0.14, 0.925, -0.145], s: [0.8, 1.3, 0.6], c: ORANGE, c2: FEU, ch: 'g', jit: 0 });
    b.add(K.box(0.1, 0.13, 0.05), { p: [0.2, 0.94, -0.03], r: [0, 0.45, 0.05], c: CUIR_D, c2: CUIR });
    b.add(K.box(0.104, 0.02, 0.054), { p: [0.2, 0.94, -0.03], r: [0, 0.45, 0.05], c: OR, ch: 's' });
    // --- tabard devant : liseré d'or, emblème de flamme, ourlet en trois langues de feu
    plaque(
      b,
      [
        [-0.12, 0],
        [0.12, 0],
        [0.13, -0.33],
        [-0.13, -0.33]
      ],
      0.02,
      { p: [0, 0.99, -0.205], r: [-0.08, 0, 0], c: OR, ch: 's' }
    );
    plaque(
      b,
      [
        [-0.1, -0.01],
        [0.1, -0.01],
        [0.11, -0.31],
        [-0.11, -0.31]
      ],
      0.02,
      { p: [0, 0.99, -0.215], r: [-0.08, 0, 0], c: ROUGE }
    );
    plaque(
      b,
      [
        [0, -0.05],
        [0.038, -0.03],
        [0.046, 0.005],
        [0.03, 0.04],
        [0.018, 0.02],
        [0.008, 0.075],
        [-0.008, 0.03],
        [-0.026, 0.05],
        [-0.04, 0.012],
        [-0.045, -0.015],
        [-0.032, -0.038]
      ],
      0.012,
      { p: [0, 0.88, -0.232], r: [-0.08, 0, 0], c: OR, ch: 's', jit: 0 }
    );
    [-0.075, 0, 0.075].forEach((x, i) =>
      langue(b, [x, 0.6 - (i === 1 ? 0.05 : 0.02), -0.24], 0.045, i === 1 ? 0.16 : 0.1, {
        bas: 1,
        c: ORANGE,
        c2: FEU,
        r: [PI + 0.08, 0, 0]
      })
    );
    // --- torse, plastron orange en V liseré d'or, camail et son galon
    b.add(K.cyl(0.265, 0.205, 0.44, 8), { p: [0, 1.25, 0], s: [1, 1, 0.74], c: ROUGE, c2: K.mix(ROUGE, ORANGE, 0.2) });
    plaque(
      b,
      [
        [-0.14, 0],
        [0.14, 0],
        [0, -0.24]
      ],
      0.02,
      { p: [0, 1.43, -0.17], r: [-0.12, 0, 0], c: OR, ch: 's' }
    );
    plaque(
      b,
      [
        [-0.11, -0.01],
        [0.11, -0.01],
        [0, -0.2]
      ],
      0.02,
      { p: [0, 1.43, -0.18], r: [-0.12, 0, 0], c: ORANGE }
    );
    b.add(K.cyl(0.16, 0.29, 0.15, 8), { p: [0, 1.47, 0], s: [1, 1, 0.8], c: ROUGE_D, c2: ROUGE });
    b.add(K.cyl(0.292, 0.296, 0.026, 8), { p: [0, 1.395, 0], s: [1, 1, 0.8], c: OR, ch: 's' });
    // --- épaulières en flammes : coque brique, bord d'or, trois langues qui montent vers l'extérieur
    b.sym(sd =>
      b.group({ p: [sd * 0.31, 1.47, 0] }, b => {
        b.add(K.dome(0.13, 6, 3), { s: [1.05, 0.8, 1.15], c: BRIQUE, c2: ORANGE });
        b.add(K.cyl(0.137, 0.142, 0.03, 6), { p: [0, -0.005, 0], s: [1, 1, 1.15], c: OR, ch: 's' });
        [
          [0, 0.85, 0.07],
          [-0.07, 0.66, 0.055],
          [0.07, 0.58, 0.05]
        ].forEach(q =>
          b.add(
            K.tube(
              K.curve(
                [
                  [sd * 0.03, 0.04, q[0]],
                  [sd * 0.09 * q[1], 0.13 * q[1], q[0]],
                  [sd * 0.12 * q[1], 0.23 * q[1], q[0] * 1.1],
                  [sd * 0.1 * q[1], 0.31 * q[1], q[0] * 1.2],
                  [sd * 0.17 * q[1], 0.38 * q[1], q[0] * 1.2]
                ],
                5
              ),
              [q[2], q[2] * 0.95, q[2] * 0.8, q[2] * 0.6, q[2] * 0.35, q[2] * 0.15, 0],
              4
            ),
            { c: K.mix(ORANGE, ROUGE, 0.35), c2: FEU, ch: 'g', jit: 0.05 }
          )
        );
      })
    );
    // --- tête : visage rond et souriant, yeux brillants, sourcils, joues, mèches de feu
    b.add(K.cyl(0.06, 0.07, 0.1, 6), { p: [0, 1.53, 0], c: K.shade(PEAU, 0.85) });
    b.add(K.sph(0.158, 9, 7), { p: [0, HY, -0.035], s: [0.97, 1.02, 0.95], c: PEAU, flat: false, jit: 0 });
    b.sym(sd => {
      SH.eye(b, { p: [sd * 0.057, HY + 0.012, -0.163], r: 0.041, rot: [0, PI - sd * 0.22, 0], iris: 0x3b1a0c });
      b.add(K.box(0.052, 0.014, 0.016), {
        p: [sd * 0.06, HY + 0.072, -0.16],
        r: [0, -sd * 0.2, -sd * 0.12],
        c: 0x8a2a14,
        jit: 0
      });
      b.add(K.sph(0.026, 5, 3), {
        p: [sd * 0.098, HY - 0.035, -0.14],
        s: [1, 0.6, 0.4],
        c: 0xf0937a,
        flat: false,
        jit: 0
      });
    });
    b.add(K.cone(0.019, 0.042, 4), { p: [0, HY - 0.022, -0.196], r: [-PI / 2, 0, 0], c: K.shade(PEAU, 0.88) });
    b.add(K.torus(0.032, 0.008, 3, 6, PI), { p: [0, HY - 0.06, -0.165], r: [-0.25, 0, PI], c: 0x7a2a1a, jit: 0 });
    const MECHES = [
      [-0.1, 0.55, 0.08],
      [-0.045, 0.2, 0.07],
      [0.08, -0.45, 0.075]
    ];
    for (const q of MECHES) {
      const r = [PI - 0.7, 0, q[1]];
      langue(b, [q[0], HY + 0.118, -0.148], 0.03, q[2], { r, c: ORANGE, c2: CHEVEUX, ep: 0.5 });
    }
    // --- capuche : calotte, bord d'or autour du visage, pointe qui monte puis s'enroule en arrière comme une flamme
    b.add(K.ico(0.2, 1), { p: [0, HY + 0.035, 0.05], s: [1.06, 1.04, 1.1], c: ROUGE_D, c2: ROUGE });
    b.add(K.torus(0.152, 0.016, 4, 12, PI * 1.3), { p: [0, HY + 0.01, -0.13], r: [0, 0, -PI * 0.15], c: OR, ch: 's' });
    b.add(
      K.tube(
        K.curve(
          [
            [0, HY + 0.15, 0.07],
            [0, HY + 0.3, 0.12],
            [0, HY + 0.4, 0.22],
            [0, HY + 0.42, 0.33],
            [0, HY + 0.37, 0.42]
          ],
          6
        ),
        [0.13, 0.105, 0.075, 0.05, 0.03, 0.015, 0],
        6
      ),
      { c: ROUGE_D, c2: ROUGE }
    );
    langue(b, [0, HY + 0.155, -0.175], 0.045, 0.09, { bas: 1, r: [PI + 0.5, 0, 0], c: ROUGE, c2: OR });
    // --- cape : nappe courbe, rouge dehors, doublure brique dedans, ourlet en langues de feu
    const capeF = (u, v) => {
      const a = (u - 0.5) * 2.4,
        r = 0.26 + 0.12 * v;
      return [Math.sin(a) * r * 1.05, 1.47 - 1.0 * v, 0.03 + Math.cos(a) * r * 0.75 + 0.12 * v * v];
    };
    b.add(nappe(capeF, 8, 4, false), { c: ROUGE, c2: ROUGE_D, jit: 0.05 });
    b.add(nappe(capeF, 8, 4, true), { c: DOUBLURE, c2: BRIQUE, jit: 0.05 });
    const FLAMME = [
      [0, -0.05],
      [0.038, -0.03],
      [0.046, 0.005],
      [0.03, 0.04],
      [0.018, 0.02],
      [0.008, 0.075],
      [-0.008, 0.03],
      [-0.026, 0.05],
      [-0.04, 0.012],
      [-0.045, -0.015],
      [-0.032, -0.038]
    ];
    b.group({ p: [0, 1.08, 0.285], r: [-0.2, PI, 0], s: 2.6 }, b => {
      plaque(b, FLAMME, 0.006, { p: [0, 0, 0], c: OR, ch: 's', jit: 0 });
      plaque(b, FLAMME, 0.006, { p: [0, -0.004, -0.004], r: [0, 0, 0], c: ORANGE, jit: 0 });
    });
    for (let k = 0; k <= 8; k++) {
      const p = capeF(k / 8, 1),
        a = (k / 8 - 0.5) * 2.4,
        l = [0.12, 0.2, 0.13, 0.24, 0.15, 0.24, 0.13, 0.2, 0.12][k];
      b.group({ p: [p[0], p[1] + 0.01, p[2]], r: [0, a, 0] }, b =>
        langue(b, [0, -l / 2, 0], 0.058, l, { bas: 1, r: [PI - 0.15, 0, 0], c: ORANGE, c2: FEU, ep: 0.3 })
      );
    }
    // --- bras (pièces animées) : manche, manchette évasée orange, gant à runes lumineuses
    const bras = (a, sd) => {
      const S = [sd * 0.3, 1.45, 0],
        C = arme ? [sd * 0.315, 1.15, 0] : [sd * 0.345, 1.16, 0.01],
        W = arme ? [sd * 0.31, 0.98, -0.01] : [sd * 0.36, 1.02, -0.17],
        H = arme ? [sd * 0.3, 0.9, -0.01] : [sd * 0.365, 0.995, -0.235],
        dx = W[1] - C[1],
        dz = W[2] - C[2],
        th = Math.atan2(-dz, -dx);
      a.add(K.tube([S, [sd * 0.33, 1.3, 0.005], C], [0.078, 0.072, 0.064], 6), { c: ROUGE, c2: ROUGE_D });
      a.add(K.tube([C, W], [0.064, 0.06], 6), { c: ROUGE });
      a.add(K.cyl(0.062, 0.09, 0.08, 6), {
        p: [W[0], W[1] + 0.02 * Math.cos(th), W[2] + 0.02 * Math.sin(th)],
        r: [th, 0, 0],
        c: ORANGE
      });
      a.add(K.cyl(0.092, 0.094, 0.018, 6), {
        p: [W[0], W[1] - 0.02 * Math.cos(th), W[2] - 0.02 * Math.sin(th)],
        r: [th, 0, 0],
        c: OR,
        ch: 's'
      });
      a.add(K.ico(0.074, 1), {
        p: H,
        r: [th, 0, 0],
        s: arme ? [0.85, 1, 1] : [0.9, 1.05, 0.75],
        c: GANT,
        c2: K.mix(GANT, ORANGE, 0.25)
      });
      a.add(K.cone(0.024, 0.065, 4), {
        p: [H[0] - sd * 0.06, H[1] + 0.01, H[2] - 0.01],
        r: [th, 0, sd * 0.9],
        c: GANT
      });
      a.add(K.torus(0.06, 0.008, 3, 8), {
        p: [W[0], W[1], W[2]],
        r: [th + PI / 2, 0, 0],
        c: ORANGE_L,
        c2: FEU,
        ch: 'g',
        jit: 0
      });
      a.add(K.oct(0.03), {
        p: arme ? [H[0] + sd * 0.06, H[1] + 0.01, H[2]] : [H[0], H[1] + 0.045, H[2]],
        s: arme ? [0.4, 1, 1] : [1, 0.35, 1],
        c: ORANGE,
        c2: FEU,
        ch: 'g',
        jit: 0
      });
    };
    bras(aL, -1);
    bras(aR, 1);
    // --- flammes vivantes au-dessus des mains (pièces animées : elles vacillent), et quelques braises
    const flamme = (f, sd) => {
      const x = sd * 0.365;
      // la magie de l'élément au-dessus de la main : flamme, goutte, pousse, cristal, éclair ou rafale (motifs de shared.js)
      SH.motif(f, ELK, { p: [x, 1.05, -0.24], r: [0, sd * 0.6, 0], s: 0.42 });
      [
        [0.04, 0.3, 0.02, 0.018],
        [-0.05, 0.36, -0.01, 0.014],
        [0.015, 0.43, 0.03, 0.011]
      ].forEach(q => f.add(K.oct(q[3]), { p: [x + sd * q[0], 1.05 + q[1], -0.24 + q[2]], c: FEU, ch: 'g', jit: 0 }));
    };
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
    if (!arme) {
      flamme(fL, -1);
      flamme(fR, 1);
      parts.push(
        {
          name: 'flamL',
          b: fL,
          parent: 'armL',
          pivot: [-0.365, 1.05, -0.24],
          anim: [{ k: 'scl', axis: 'y', amp: 0.35, sp: 11 }]
        },
        {
          name: 'flamR',
          b: fR,
          parent: 'armR',
          pivot: [0.365, 1.05, -0.24],
          anim: [{ k: 'scl', axis: 'y', amp: 0.35, sp: 13, ph: 2 }]
        }
      );
    }
    return { parts, bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } }, scale: 1, labelY: 2.2, jambes, mainD };
  };
}
