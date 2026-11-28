// VOLT — le héros Assassin, vu par ses coéquipiers. Fichier commun, sur le modèle de braise.js (même interface, même recette).
// Même gabarit que le gardien : ≈ 1,8 m, origine aux pieds, regarde vers −Z ; fin, le buste penché en avant (prêt à bondir).
// Pièces : body, armL, armR (pivots aux épaules, comme le gardien), puis motL et motR (la magie de l'élément qui crépite dans les mains).
// En plus de la recette : jambes = nombre de premiers objets de body qui sont les jambes (jambe droite x > 0, puis la gauche, autant
// chacune) ; mainD = nombre d'objets du bras droit à garder quand il tient une arme (ce qui suit est tenu en main).
// ctx.arme : il tient une arme (lobby, Dernier Toit) : bras le long du corps, sans la magie des mains (les lames d'avant-bras restent).
// Langage des formes : pointes et zigzags (capuche à pointe, masque, écharpe qui flotte en éclair, lames d'avant-bras, genouillères pointues).
// Couleurs : 60 % tenue sombre dans les tons de l'élément, 30 % écharpe et liserés vifs de l'élément, 10 % acier et or ; canal 'g' pour la magie.
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    CUIR_D = 0x3a2a22,
    ACIER = PAL.steel,
    PEAU = PAL.skin,
    HY = 1.66,
    PENCHE = -0.1;
  // l'élément se choisit : toute la palette vient de K.EL[ctx.el] (sans élément : l'Élec, son élément d'origine)
  let ELK, E, TEN, TEN_D, TEN_L, VIF, VIF_D, VESTE, CHEV;
  const palVolt = el => {
    ELK = K.EL[el] ? el : 'elec';
    E = K.EL[ELK];
    TEN = K.mix(E.deep, 0x343a44, 0.7);
    TEN_D = K.mix(E.deep, 0x252a31, 0.72);
    TEN_L = K.mix(E.dark, 0x5a6470, 0.6);
    VIF = E.main;
    VIF_D = K.mix(E.main, E.dark, 0.45);
    VESTE = K.mix(E.main, E.dark, 0.3);
    CHEV = K.mix(E.light, 0xffffff, 0.35);
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
  // nappe : surface souple d'un seul tenant, f(u, v) → [x, y, z] ; dedans : l'autre face
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
  // éclair en zigzag (emblème) dans le plan de face, ≈ 0,3 de haut
  const ECLAIR = [
    [-0.02, -0.15],
    [0.07, 0.0],
    [0.015, 0.0],
    [0.06, 0.15],
    [-0.06, -0.01],
    [-0.005, -0.01],
    [-0.05, -0.15]
  ];
  // lame d'avant-bras : lame courbe le long du bras, pointe vers l'arrière, fil lumineux de l'élément (le long de +Y)
  const LAME = [
    [-0.022, 0],
    [0.028, 0],
    [0.05, 0.16],
    [0.03, 0.3],
    [-0.005, 0.38],
    [0.0, 0.24],
    [-0.02, 0.1]
  ];
  MODELS['hero.volt'] = ctx => {
    palVolt(ctx && ctx.el);
    const arme = !!(ctx && ctx.arme),
      b = K.make(2901),
      aL = K.make(2902),
      aR = K.make(2903),
      mL = K.make(2904),
      mR = K.make(2905);
    // --- jambes (les premiers objets de body) : botte pointue, bandes de cuir, genouillère en pointe, jambière
    b.sym(sd => {
      const x = sd * 0.1;
      b.add(K.box(0.11, 0.09, 0.25, 0.8, 0.6), { p: [x, 0.045, -0.03], c: TEN_D, c2: TEN });
      b.add(K.cone(0.05, 0.12, 4), { p: [x, 0.04, -0.19], r: [-PI / 2, 0, 0], s: [1.1, 1, 0.6], c: TEN_D, c2: TEN_L });
      b.add(K.cyl(0.062, 0.068, 0.34, 6), { p: [x, 0.26, 0], c: TEN, c2: TEN_L });
      plaque(
        b,
        [
          [-0.05, 0],
          [0.05, 0],
          [0.035, 0.1],
          [0, 0.2],
          [-0.035, 0.1]
        ],
        0.03,
        { p: [x, 0.38, -0.06], r: [0.25, 0, 0], c: VIF_D, c2: VIF }
      );
      b.add(K.cyl(0.072, 0.062, 0.36, 6), { p: [x, 0.6, 0], c: TEN_D, c2: TEN });
      plaque(b, ECLAIR, 0.012, {
        p: [x + sd * 0.066, 0.62, 0],
        r: [0, (-sd * PI) / 2, 0],
        s: [0.5, 0.95, 1],
        c: VIF,
        c2: E.light,
        jit: 0
      });
    });
    const jambes = b.items.length;
    // --- le haut du corps est penché en avant (rotation autour des hanches)
    b.group({ p: [0, 0.9, 0], r: [PENCHE, 0, 0] }, b =>
      b.group({ p: [0, -0.9, 0] }, b => {
        // --- hanches, ceinture à boucle-éclair, pan d'étoffe sur le côté, dague au flanc droit
        b.add(K.cyl(0.17, 0.185, 0.16, 8), { p: [0, 0.88, 0], s: [1, 1, 0.8], c: TEN_D, c2: TEN });
        b.add(K.cyl(0.18, 0.185, 0.055, 8), { p: [0, 0.97, 0], s: [1, 1, 0.8], c: CUIR_D });
        plaque(b, ECLAIR, 0.02, { p: [0, 0.97, -0.15], s: 0.33, c: VIF, c2: E.glow, ch: 'g', jit: 0 });
        plaque(
          b,
          [
            [-0.05, 0],
            [0.05, 0],
            [0.06, -0.2],
            [0.02, -0.14],
            [0, -0.3],
            [-0.03, -0.16],
            [-0.06, -0.24]
          ],
          0.012,
          { p: [-0.15, 0.95, -0.06], r: [0.1, 0.9, 0.12], c: VIF_D, c2: VIF }
        );
        b.group({ p: [0.18, 0.9, 0.05], r: [0.3, 0, 2.5] }, b => {
          b.add(K.cyl(0.024, 0.03, 0.2, 5), { p: [0, 0.1, 0], c: CUIR_D });
          b.add(K.box(0.08, 0.02, 0.03), { p: [0, -0.005, 0], c: OR, ch: 's' });
          b.add(K.cyl(0.013, 0.015, 0.08, 5), { p: [0, -0.05, 0], c: TEN_D });
          b.add(K.oct(0.018), { p: [0, -0.1, 0], c: VIF, c2: E.glow, ch: 'g', jit: 0 });
        });
        // --- torse fin : combinaison ajustée, éclair au cœur, bandes croisées, épaulière gauche à bord en dents
        b.add(K.cyl(0.2, 0.16, 0.42, 8), { p: [0, 1.2, 0], s: [1, 1, 0.72], c: K.mix(VESTE, E.dark, 0.3), c2: VESTE });
        b.add(K.cyl(0.165, 0.17, 0.05, 8), { p: [0, 1.015, 0], s: [1, 1, 0.74], c: TEN_D });
        b.add(K.box(0.035, 0.5, 0.015), { p: [0, 1.2, -0.13], r: [-0.05, 0, 0.6], c: CUIR_D });
        b.add(K.box(0.035, 0.5, 0.015), { p: [0, 1.2, -0.128], r: [-0.05, 0, -0.6], c: CUIR_D });
        b.add(K.oct(0.03), { p: [0, 1.21, -0.14], s: [1, 1, 0.5], c: OR, ch: 's' });
        plaque(b, ECLAIR, 0.015, { p: [0.085, 1.33, -0.135], r: [-0.1, -0.35, 0], s: 0.42, c: TEN_D, c2: TEN, jit: 0 });
        b.group({ p: [-0.27, 1.44, -0.01], r: [0, 0, 0.35] }, b => {
          b.add(K.dome(0.105, 6, 2), { s: [1.15, 0.6, 1.15], c: TEN_L, c2: K.mix(TEN_L, VIF, 0.25) });
          b.add(K.cyl(0.12, 0.124, 0.025, 6), { p: [0, -0.005, 0], s: [1, 1, 1.05], c: VIF, c2: E.light });
          [-0.06, 0, 0.06].forEach((z, i) =>
            b.add(K.cone(0.03, i === 1 ? 0.1 : 0.075, 4), {
              p: [-0.1, -0.04, z],
              r: [PI, 0, -0.35],
              s: [1, 1, 0.5],
              c: VIF,
              c2: VIF_D
            })
          );
        });
        // --- écharpe : tour du cou, puis deux longs pans qui flottent derrière en ondulant, bouts taillés en éclair
        b.add(K.cyl(0.11, 0.14, 0.1, 8), { p: [0, 1.48, 0.0], s: [1, 1, 0.9], c: VIF_D, c2: VIF });
        const pan = (L, lar, dy, dx, ph) => {
          const f = (u, v) => {
            const a = 1.3 * u * u + 0.2 * Math.sin(u * 5 + ph),
              w = (v - 0.5) * lar * (1 - 0.3 * u),
              z = 0.1 + u * L,
              y = 1.49 + dy * u * u - 0.07 * Math.sin(u * 6 + ph) * u - w * Math.cos(a),
              x = 0.04 + dx * u + 0.04 * Math.sin(u * 4 + ph) + w * Math.sin(a);
            return [x, y, z];
          };
          b.add(nappe(f, 9, 1, false), { c: VIF_D, c2: VIF, jit: 0.04 });
          b.add(nappe(f, 9, 1, true), { c: VIF_D, jit: 0.04 });
          const p = f(1, 0.5);
          b.add(K.cone(lar * 0.4, 0.14, 4), {
            p: [p[0], p[1], p[2] + 0.06],
            r: [PI / 2, 0, 0.6],
            s: [1, 1, 0.25],
            c: VIF,
            c2: E.light
          });
        };
        pan(0.66, 0.14, -0.22, 0.14, 0);
        pan(0.5, 0.12, -0.34, 0.05, 1.8);
        // --- tête (dans le buste penché) : visage, yeux vifs, sourcils en accent, mèches claires
        b.add(K.cyl(0.055, 0.065, 0.1, 6), { p: [0, 1.53, 0], c: K.shade(PEAU, 0.85) });
        b.add(K.sph(0.152, 9, 7), { p: [0, HY, -0.03], s: [0.96, 1.02, 0.95], c: PEAU, flat: false, jit: 0 });
        b.sym(sd => {
          SH.eye(b, {
            p: [sd * 0.056, HY + 0.012, -0.155],
            r: 0.04,
            rot: [0, PI - sd * 0.22, 0],
            iris: K.mix(E.dark, 0x1a1410, 0.4)
          });
          b.add(K.box(0.055, 0.014, 0.016), {
            p: [sd * 0.06, HY + 0.072, -0.152],
            r: [0, -sd * 0.2, sd * 0.1],
            c: K.mix(CHEV, 0x3a2a20, 0.5),
            jit: 0
          });
        });
        // --- masque sur le bas du visage, liseré vif
        b.add(K.sph(0.158, 9, 4, { t0: PI * 0.58, t1: PI * 0.9 }), {
          p: [0, HY - 0.005, -0.035],
          r: [0, -PI / 2, 0],
          s: [1.0, 1.04, 0.98],
          c: TEN_D,
          c2: TEN
        });
        b.add(K.torus(0.152, 0.01, 3, 10, PI), {
          p: [0, HY - 0.038, -0.04],
          r: [PI / 2 + 0.1, 0, PI],
          s: [1.04, 1.02, 1],
          c: VIF
        });
        // --- capuche courte : calotte, bord vif autour du visage, pointe qui part en arrière, mèches claires qui dépassent
        b.add(K.ico(0.19, 1), { p: [0, HY + 0.03, 0.04], s: [1.03, 1.0, 1.08], c: VIF_D, c2: VIF });
        b.add(K.torus(0.152, 0.016, 4, 12, PI * 1.3), {
          p: [0, HY + 0.005, -0.13],
          r: [0, 0, -PI * 0.15],
          c: TEN_D,
          c2: TEN
        });
        b.add(
          K.tube(
            K.curve(
              [
                [0, HY + 0.12, 0.1],
                [0, HY + 0.17, 0.22],
                [0, HY + 0.16, 0.33],
                [0, HY + 0.2, 0.44]
              ],
              5
            ),
            [0.1, 0.08, 0.055, 0.035, 0.018, 0],
            5
          ),
          { c: VIF_D, c2: VIF }
        );
        [
          [-0.07, 0.5, 0.09],
          [-0.015, 0.1, 0.1],
          [0.05, -0.35, 0.085],
          [0.1, -0.7, 0.06]
        ].forEach(q =>
          b.add(K.cone(0.032, q[2], 4), {
            p: [q[0], HY + 0.12, -0.14],
            r: [PI - 0.55, 0, q[1]],
            s: [1, 1, 0.45],
            c: CHEV,
            c2: K.mix(CHEV, E.glow, 0.5)
          })
        );
      })
    );
    // --- bras (pièces animées) : manche ajustée, bandes, gant, lame d'avant-bras pointée vers l'arrière
    const bras = (a, sd) => {
      const S = [sd * 0.27, 1.42, -0.05],
        C = arme ? [sd * 0.29, 1.15, -0.03] : [sd * 0.31, 1.18, 0.04],
        W = arme ? [sd * 0.29, 0.97, -0.04] : [sd * 0.33, 1.03, -0.14],
        H = arme ? [sd * 0.29, 0.9, -0.04] : [sd * 0.335, 0.99, -0.2],
        dy = W[1] - C[1],
        dz = W[2] - C[2],
        th = Math.atan2(-dz, -dy);
      a.add(K.tube([S, [sd * 0.29, 1.3, -0.01], C], [0.058, 0.052, 0.046], 6), { c: TEN, c2: TEN_L });
      a.add(K.tube([C, W], [0.046, 0.052], 6), { c: TEN_D, c2: TEN });
      [0.3, 0.65].forEach(t =>
        a.add(K.cyl(0.055, 0.055, 0.02, 6), {
          p: [C[0] + (W[0] - C[0]) * t, C[1] + dy * t, C[2] + dz * t],
          r: [th, 0, 0],
          c: VIF_D
        })
      );
      a.add(K.ico(0.058, 1), {
        p: H,
        r: [th, 0, 0],
        s: arme ? [0.8, 1.05, 1] : [0.9, 1.05, 0.75],
        c: CUIR_D,
        c2: K.mix(CUIR_D, TEN, 0.4)
      });
      a.add(K.cone(0.02, 0.055, 4), {
        p: [H[0] - sd * 0.05, H[1] + 0.01, H[2] - 0.01],
        r: [th, 0, sd * 0.9],
        c: CUIR_D
      });
      a.group({ p: [W[0] + sd * 0.05, W[1], W[2]], r: [th, 0, 0] }, a => {
        plaque(a, LAME, 0.01, {
          p: [0, -0.02, 0.0],
          r: [0, (sd * PI) / 2, 0],
          c: ACIER,
          c2: 0xe8eef2,
          ch: 's',
          jit: 0
        });
        a.add(K.box(0.03, 0.1, 0.05), { p: [-sd * 0.01, 0.0, 0], c: CUIR_D });
      });
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
    // --- la magie de l'élément qui crépite dans les deux mains (pièces animées : elle vibre vite) : motif de shared.js et étincelles
    const magie = (m, sd) => {
      const M = [sd * 0.335, 1.02, -0.21];
      SH.motif(m, ELK, { p: M, r: [0, sd * 0.7, sd * 0.25], s: 0.36 });
      [
        [0.05, 0.12, 0.02, 0.015],
        [-0.06, 0.2, -0.02, 0.012],
        [0.02, 0.27, 0.03, 0.01]
      ].forEach(q =>
        m.add(K.oct(q[3]), { p: [M[0] + sd * q[0], M[1] + q[1], M[2] + q[2]], c: E.glow, ch: 'g', jit: 0 })
      );
    };
    if (!arme) {
      magie(mL, -1);
      magie(mR, 1);
      parts.push(
        {
          name: 'motL',
          b: mL,
          parent: 'armL',
          pivot: [-0.335, 1.02, -0.21],
          anim: [{ k: 'scl', axis: 'y', amp: 0.4, sp: 17 }]
        },
        {
          name: 'motR',
          b: mR,
          parent: 'armR',
          pivot: [0.335, 1.02, -0.21],
          anim: [{ k: 'scl', axis: 'y', amp: 0.4, sp: 19, ph: 2 }]
        }
      );
    }
    return { parts, bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } }, scale: 1, labelY: 2.15, jambes, mainD };
  };
}
