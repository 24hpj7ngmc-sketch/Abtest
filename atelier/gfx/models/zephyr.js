// ZÉPHYR — le héros Tireur, vu par ses coéquipiers. Fichier commun, comme braise.js (même interface, même gabarit).
// ≈ 1,8 m (plume du chapeau ≈ 2,15 m), origine aux pieds, regarde vers −Z. Pièces : body, armL, armR (pivots aux épaules, comme le
// gardien), puis magR (la magie de l'élément au-dessus de la main droite, qui tourne). En plus de la recette : jambes (premiers objets
// de body : jambe droite puis gauche, autant chacune) ; mainD (objets du bras droit à garder quand il tient une arme).
// Sans arme, il tient son arc dans la main gauche (au Hall). ctx.arme : bras le long du corps, sans l'arc ni la magie.
// Langage des formes : lignes verticales et pointes qui filent vers l'arrière (pans du manteau, foulard, plume, flèches du carquois).
// Couleurs : 60 % élément (manteau, chapeau), 30 % cuir et crème (bottes, carquois, chemise, doublure), 10 % or et bronze.
// L'élément se choisit : toute la palette vient de ctx.el (sans élément : le Vent, son élément d'origine).
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    BRONZE = PAL.bronze,
    BRONZE_L = PAL.bronzeL,
    CUIR = 0x6b4030,
    CUIR_L = 0x93603e,
    CUIR_D = 0x46291e,
    PEAU = PAL.skin,
    HY = 1.67;
  let ELK, E, MANT, MANT_D, MANT_L, DOUBL, CHEMISE, PANT, CHEV, FOUL, FOUL_D;
  // plafond : assombrit une couleur trop claire (palettes pâles comme le Vent : pas de tache blanche sur le ciel)
  const plafond = (c, L) => {
    const q = K.mix(c, c, 0),
      l = 0.3 * q[0] + 0.59 * q[1] + 0.11 * q[2];
    return l > L ? K.shade(q, L / l) : q;
  };
  const palZephyr = el => {
    ELK = K.EL[el] ? el : 'vent';
    E = K.EL[ELK];
    MANT = K.mix(E.main, E.dark, 0.45);
    MANT_D = K.mix(E.dark, E.deep, 0.3);
    MANT_L = E.main;
    DOUBL = plafond(K.mix(0xe8dcc4, E.light, 0.3), 0.8);
    CHEMISE = plafond(K.mix(0xf0e6d0, E.light, 0.15), 0.82);
    PANT = K.mix(0x5a4a3c, E.deep, 0.35);
    CHEV = K.mix(E.main, E.light, 0.35);
    FOUL = plafond(E.light, 0.84);
    FOUL_D = K.mix(E.main, E.light, 0.4);
  };
  // plaque : polygone [[x, y], …] dans le plan de face, épaisseur ep vers l'avant (−Z) à partir de o.p
  const plaque = (b, pts, ep, o) =>
    b.group({ p: o.p, r: o.r || [0, 0, 0] }, b =>
      b.add(K.prism(pts, ep), { r: [-PI / 2, 0, 0], c: o.c, ch: o.ch, jit: o.jit === undefined ? 0.04 : o.jit })
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
  // les deux faces d'une nappe (dehors, dedans), chacune sa couleur
  const nappe2 = (b, f, nu, nv, o1, o2) => {
    b.add(nappe(f, nu, nv, false), o1);
    b.add(nappe(f, nu, nv, true), o2);
  };
  // orientation qui pointe l'axe +Y d'une forme de A vers B (rotation XYZ du kit)
  const vise = (A, B) => {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]],
      l = Math.hypot(d[0], d[1], d[2]) || 1;
    return [Math.atan2(d[2] / l, d[1] / l), 0, -Math.asin(d[0] / l)];
  };
  MODELS['hero.zephyr'] = ctx => {
    palZephyr(ctx && ctx.el);
    const arme = !!(ctx && ctx.arme),
      b = K.make(2621),
      aL = K.make(2622),
      aR = K.make(2623),
      mR = K.make(2624);
    // --- jambes (les premiers objets de body) : pied de botte, tige haute, revers, pantalon ajusté
    b.sym(sd => {
      const x = sd * 0.1;
      b.add(K.box(0.12, 0.09, 0.27, 0.85, 0.7), { p: [x, 0.045, -0.04], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.066, 0.074, 0.42, 6), { p: [x, 0.29, 0], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.088, 0.076, 0.08, 6), { p: [x, 0.52, 0], c: CUIR_L });
      b.add(K.cyl(0.076, 0.068, 0.3, 6), { p: [x, 0.69, 0], c: PANT });
    });
    const jambes = b.items.length;
    // --- bassin, ceinture de cuir à boucle d'or, longue-vue à la hanche droite
    b.add(K.cyl(0.19, 0.17, 0.2, 8), { p: [0, 0.9, 0], s: [1, 1, 0.8], c: PANT });
    b.add(K.cyl(0.198, 0.2, 0.06, 8, { open: true }), { p: [0, 1.03, 0], s: [1, 1, 0.8], c: CUIR_D });
    b.add(K.box(0.06, 0.05, 0.02), { p: [0, 1.03, -0.163], c: OR, ch: 's' });
    b.group({ p: [0.215, 0.92, -0.06], r: [0.15, 0, 0.45] }, b => {
      b.add(K.cyl(0.032, 0.032, 0.13, 6), { p: [0, 0.06, 0], c: BRONZE, c2: BRONZE_L, ch: 's' });
      b.add(K.cyl(0.027, 0.027, 0.1, 6), { p: [0, -0.05, 0], c: OR, ch: 's' });
      b.add(K.cyl(0.023, 0.023, 0.07, 6), { p: [0, -0.13, 0], c: BRONZE, ch: 's' });
      b.add(K.cyl(0.036, 0.034, 0.02, 6), { p: [0, 0.13, 0], c: CUIR_D });
    });
    // --- pans du manteau : fendus devant et au milieu du dos, ils s'évasent et filent en deux pointes vers l'arrière
    const panF = sd => (u, v) => {
      const a = sd * (0.05 + 2.3 * u),
        dos = Math.max(0, Math.cos(a)),
        r = 0.21 + 0.13 * v,
        y = 1.04 - v * (0.66 + 0.1 * Math.pow(dos, 3)) + 0.04 * v * v * dos;
      return [Math.sin(a) * r, y, Math.cos(a) * r * 0.82 + 0.24 * Math.pow(v, 1.6) * dos];
    };
    b.add(nappe(panF(1), 8, 4, false), { c: MANT_D, c2: MANT, jit: 0.04 });
    b.add(nappe(panF(1), 8, 4, true), { c: K.shade(DOUBL, 0.8), c2: DOUBL, jit: 0.04 });
    b.add(nappe(panF(-1), 8, 4, true), { c: MANT_D, c2: MANT, jit: 0.04 });
    b.add(nappe(panF(-1), 8, 4, false), { c: K.shade(DOUBL, 0.8), c2: DOUBL, jit: 0.04 });
    // liseré d'or le long de l'ourlet et du bord avant de chaque pan
    b.sym(sd => {
      const L = [];
      for (let k = 0; k <= 4; k++) L.push(panF(sd)(1, k / 4));
      for (let k = 7; k >= 0; k--) L.push(panF(sd)(k / 8, 1));
      b.add(K.tube(L, 0.012, 3), { c: OR, ch: 's', jit: 0 });
    });
    // --- torse : le manteau ajusté, chemise crème en V, revers, deux rangs de boutons d'or, baudrier du carquois
    b.add(K.cyl(0.232, 0.19, 0.44, 8), { p: [0, 1.25, 0], s: [1, 1, 0.74], c: MANT, c2: K.mix(MANT, MANT_L, 0.3) });
    plaque(
      b,
      [
        [-0.1, 0],
        [0.1, 0],
        [0.06, -0.2],
        [0.035, -0.4],
        [-0.035, -0.4],
        [-0.06, -0.2]
      ],
      0.02,
      { p: [0, 1.45, -0.16], r: [-0.12, 0, 0], c: CHEMISE }
    );
    b.sym(sd => {
      plaque(
        b,
        [
          [sd * 0.1, 0],
          [sd * 0.16, -0.02],
          [sd * 0.07, -0.2],
          [sd * 0.04, -0.4],
          [sd * 0.025, -0.4],
          [sd * 0.05, -0.2]
        ],
        0.02,
        { p: [0, 1.45, -0.168], r: [-0.12, 0, 0], c: MANT_D }
      );
      [1.32, 1.2].forEach(y =>
        b.add(K.oct(0.014), { p: [sd * 0.075, y, -0.192 + (1.45 - y) * 0.11], c: OR, ch: 's', jit: 0 })
      );
    });
    b.add(K.box(0.05, 0.62, 0.02), { p: [-0.02, 1.25, -0.178], r: [-0.08, 0, -0.62], c: CUIR, c2: CUIR_L });
    b.add(K.box(0.05, 0.03, 0.026), { p: [0.07, 1.37, -0.19], r: [-0.08, 0, -0.62], c: OR, ch: 's' });
    // --- épaulière d'archer en cuir sur l'épaule gauche (côté arc) : coque ronde, bord d'or, deux sangles
    b.group({ p: [-0.27, 1.47, 0], r: [0, 0, 0.35] }, b => {
      b.add(K.dome(0.115, 7, 2), { s: [1, 0.6, 1.05], c: CUIR, c2: CUIR_L });
      b.add(K.cyl(0.117, 0.12, 0.022, 7, { open: true }), { s: [1, 1, 1.05], c: OR, ch: 's' });
      b.add(K.box(0.02, 0.03, 0.2), { p: [0.02, 0.045, 0], c: CUIR_D });
    });
    // --- carquois dans le dos : étui de cuir, bagues d'or, quatre flèches empennées qui dépassent au-dessus de l'épaule droite
    b.group({ p: [0.06, 1.24, 0.215], r: [0.18, 0, -0.42] }, b => {
      b.add(K.cyl(0.075, 0.06, 0.56, 6), { c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.08, 0.08, 0.035, 6, { open: true }), { p: [0, 0.26, 0], c: OR, ch: 's' });
      b.add(K.cyl(0.066, 0.066, 0.03, 6, { open: true }), { p: [0, -0.2, 0], c: OR, ch: 's' });
      [
        [-0.03, 0.02, 0.36],
        [0.025, -0.025, 0.4],
        [0.03, 0.03, 0.33],
        [-0.02, -0.03, 0.43]
      ].forEach((q, i) => {
        b.add(K.cyl(0.007, 0.007, 0.16, 3), { p: [q[0], q[2] - 0.06, q[1]], c: PAL.woodL });
        b.add(K.cone(0.03, 0.1, 3), {
          p: [q[0], q[2] + 0.06, q[1]],
          s: [1, 1, 0.3],
          r: [0, i * 0.8, 0],
          c: i % 2 ? FOUL_D : MANT_L,
          c2: FOUL,
          jit: 0
        });
      });
    });
    // --- col relevé du manteau (ouvert devant), foulard noué et son long pan qui flotte derrière
    nappe2(
      b,
      (u, v) => {
        const a = (u - 0.5) * 4.2,
          r = 0.15 + 0.035 * v;
        return [Math.sin(a) * r, 1.46 + 0.14 * v, Math.cos(a) * r * 0.85 + 0.01];
      },
      10,
      1,
      { c: MANT_D, c2: MANT, jit: 0.04 },
      { c: K.shade(MANT_D, 0.9), jit: 0.04 }
    );
    b.add(K.torus(0.095, 0.038, 5, 8), {
      p: [0, 1.5, -0.005],
      r: [PI / 2, 0, 0],
      s: [1, 0.85, 1],
      c: FOUL_D,
      c2: FOUL
    });
    b.add(K.oct(0.04), { p: [-0.06, 1.46, -0.105], s: [1, 0.8, 0.7], c: FOUL });
    const panFoul = (x0, y0, z0, dx, dy, dz, w, ond) => (u, v) => {
      const l = w * (1 - 0.65 * v);
      return [
        x0 + dx * v + 0.03 * Math.sin(v * PI * 2 + ond),
        y0 + dy * v + (u - 0.5) * l + 0.03 * Math.sin(v * PI * 3 + ond),
        z0 + dz * v
      ];
    };
    nappe2(b, panFoul(-0.06, 1.47, 0.08, -0.12, -0.12, 0.5, 0.1, 0), 1, 6, { c: FOUL_D, c2: FOUL }, { c: FOUL_D });
    nappe2(b, panFoul(-0.07, 1.43, -0.11, -0.05, -0.22, -0.03, 0.07, 1), 1, 3, { c: FOUL_D, c2: FOUL }, { c: FOUL_D });
    // --- tête : même famille de visage que Braise, sourcils assurés, sourire en coin
    b.add(K.cyl(0.055, 0.065, 0.1, 6), { p: [0, 1.54, 0], c: K.shade(PEAU, 0.85) });
    b.add(K.sph(0.158, 9, 7), { p: [0, HY, -0.035], s: [0.97, 1.02, 0.95], c: PEAU, flat: false, jit: 0 });
    b.sym(sd => {
      SH.eye(b, { p: [sd * 0.057, HY + 0.012, -0.163], r: 0.041, rot: [0, PI - sd * 0.22, 0], iris: 0x2a1c12 });
      b.add(K.box(0.056, 0.016, 0.016), {
        p: [sd * 0.06, HY + 0.07 + (sd > 0 ? 0.008 : 0), -0.16],
        r: [0, -sd * 0.2, sd * (sd > 0 ? 0.18 : -0.06)],
        c: K.shade(CUIR_D, 0.9),
        jit: 0
      });
      b.add(K.sph(0.024, 5, 3), {
        p: [sd * 0.098, HY - 0.035, -0.14],
        s: [1, 0.6, 0.4],
        c: 0xe8907a,
        flat: false,
        jit: 0
      });
    });
    b.add(K.cone(0.019, 0.042, 4), { p: [0, HY - 0.022, -0.196], r: [-PI / 2, 0, 0], c: K.shade(PEAU, 0.88) });
    b.add(K.torus(0.032, 0.008, 3, 6, PI), {
      p: [0.008, HY - 0.06, -0.165],
      r: [-0.25, 0, PI - 0.18],
      c: 0x7a2a1a,
      jit: 0
    });
    // --- cheveux : mèches rebelles sous le chapeau, chassées vers l'arrière par le vent
    b.add(K.ico(0.168, 1), { p: [0, HY + 0.02, 0.04], s: [1.02, 0.95, 1.05], c: K.shade(CHEV, 0.8), c2: CHEV });
    [
      [-0.145, 0.0, -0.02, 2.0, -0.5, 0.13],
      [0.145, 0.0, -0.02, 2.0, 0.5, 0.13],
      [-0.1, 0.0, 0.11, 2.2, -0.35, 0.16],
      [0.1, 0.0, 0.11, 2.2, 0.35, 0.16],
      [0.0, 0.02, 0.15, 2.0, 0, 0.17],
      [-0.075, 0.115, -0.15, 0.55, 0.9, 0.08]
    ].forEach(q =>
      b.add(K.cone(0.05, q[5], 4), {
        p: [q[0], HY + q[1], q[2]],
        r: [q[3], 0, q[4]],
        s: [1, 1, 0.45],
        c: K.shade(CHEV, 0.85),
        c2: CHEV
      })
    );
    // --- chapeau de voyage : calotte, bandeau, bord relevé à gauche, lunettes d'aviateur sur le bandeau, grande plume
    b.group({ p: [0, HY + 0.075, 0.0], r: [-0.08, 0, 0.06] }, b => {
      b.add(
        K.lathe(
          [
            [0.17, 0],
            [0.165, 0.06],
            [0.145, 0.12],
            [0.1, 0.158],
            [0, 0.168]
          ],
          8
        ),
        { c: MANT_D, c2: MANT }
      );
      b.add(K.cyl(0.172, 0.172, 0.04, 8, { open: true }), { p: [0, 0.03, 0], c: CUIR });
      const bordF = (u, v) => {
        const a = u * PI * 2,
          r = 0.155 + 0.15 * v,
          g = Math.max(0, -Math.sin(a));
        return [Math.sin(a) * r, 0.005 + 0.11 * g * g * v - 0.02 * v * v * (1 - g), Math.cos(a) * r];
      };
      nappe2(b, bordF, 14, 1, { c: MANT_D, c2: MANT }, { c: K.shade(MANT_D, 0.85) });
      const BORD = [];
      for (let k = 0; k <= 14; k++) BORD.push(bordF(k / 14, 1));
      b.add(K.tube(BORD, 0.011, 3, { open: true }), { c: OR, ch: 's', jit: 0 });
      // lunettes d'aviateur posées sur le bandeau
      b.sym(sd =>
        b.group({ p: [sd * 0.052, 0.045, -0.162], r: [-PI / 2 + 0.35, 0, 0] }, b => {
          b.add(K.cyl(0.04, 0.042, 0.035, 7), { c: BRONZE, c2: BRONZE_L, ch: 's' });
          b.add(K.dome(0.031, 7, 2), { p: [0, 0.017, 0], c: E.light, c2: E.glow, ch: 's', jit: 0 });
        })
      );
      b.add(K.box(0.03, 0.016, 0.014), { p: [0, 0.045, -0.17], c: BRONZE, ch: 's' });
      // la plume : un tube aplati qui monte et file en arrière, et une petite plume d'or
      b.group({ p: [-0.16, 0.05, 0.03], r: [0, 0.25, 0], s: [0.32, 1, 1] }, b => {
        b.add(
          K.tube(
            K.curve(
              [
                [0, 0, 0],
                [-0.02, 0.15, 0.04],
                [0, 0.32, 0.12],
                [0.02, 0.44, 0.26],
                [0.03, 0.48, 0.4]
              ],
              7
            ),
            [0.015, 0.04, 0.05, 0.052, 0.048, 0.04, 0.026, 0.012, 0],
            5
          ),
          { c: MANT_L, c2: E.glow }
        );
        b.add(
          K.tube(
            K.curve(
              [
                [0.02, 0, 0.02],
                [0.0, 0.12, 0.1],
                [0.02, 0.22, 0.22]
              ],
              4
            ),
            [0.01, 0.03, 0.032, 0.02, 0],
            4
          ),
          { c: OR, ch: 's' }
        );
      });
    });
    // --- bras (pièces animées) : manche du manteau, revers crème et bouton d'or, gant de cuir ; à gauche, le brassard d'archer
    const bras = (a, sd) => {
      const S = [sd * 0.27, 1.46, 0],
        C = arme ? [sd * 0.31, 1.15, 0] : [sd * 0.33, 1.17, 0.02],
        W = arme ? [sd * 0.31, 0.98, -0.01] : sd < 0 ? [sd * 0.35, 1.0, -0.07] : [sd * 0.37, 1.03, -0.15],
        H = arme ? [sd * 0.3, 0.9, -0.01] : sd < 0 ? [sd * 0.355, 0.935, -0.09] : [sd * 0.375, 1.0, -0.215],
        rw = vise(W, C),
        u = [(C[0] - W[0]) * 0.2, (C[1] - W[1]) * 0.2, (C[2] - W[2]) * 0.2];
      a.add(K.tube([S, [sd * 0.31, 1.32, 0.01], C], [0.07, 0.066, 0.06], 6), { c: MANT, c2: K.mix(MANT, MANT_L, 0.3) });
      a.add(K.tube([C, W], [0.06, 0.056], 6), { c: MANT });
      a.add(K.cyl(0.066, 0.078, 0.07, 6), { p: [W[0] + u[0], W[1] + u[1], W[2] + u[2]], r: rw, c: DOUBL });
      a.add(K.oct(0.013), {
        p: [W[0] + u[0] * 1.2 + sd * 0.075, W[1] + u[1] * 1.2, W[2] + u[2] * 1.2 - 0.01],
        c: OR,
        ch: 's',
        jit: 0
      });
      a.add(K.ico(0.07, 1), {
        p: H,
        r: rw,
        s: arme ? [0.85, 1, 1] : [0.9, 1.05, 0.8],
        c: CUIR_L,
        c2: K.mix(CUIR_L, PEAU, 0.2)
      });
      a.add(K.cone(0.023, 0.062, 4), {
        p: [H[0] - sd * 0.058, H[1] + 0.01, H[2] - 0.01],
        r: [rw[0], 0, sd * 0.9],
        c: CUIR_L
      });
    };
    bras(aL, -1);
    bras(aR, 1);
    // --- l'arc (au Hall seulement) : bois sombre à poignée de l'élément, pointes d'or, corde ; tenu droit dans la main gauche
    if (!arme)
      aL.group({ p: [-0.36, 0.95, -0.1], r: [0, -0.9, 0.06] }, b => {
        const A = [
          [0, -0.68, 0.03],
          [0, -0.6, -0.03],
          [0, -0.42, -0.075],
          [0, -0.2, -0.065],
          [0, 0, -0.035],
          [0, 0.2, -0.065],
          [0, 0.42, -0.075],
          [0, 0.6, -0.03],
          [0, 0.68, 0.03]
        ];
        b.add(
          K.tube(
            K.curve(A, 12),
            [0.01, 0.016, 0.02, 0.024, 0.027, 0.03, 0.03, 0.03, 0.027, 0.024, 0.02, 0.016, 0.01],
            5
          ),
          {
            c: PAL.woodD,
            c2: PAL.wood
          }
        );
        b.add(K.cyl(0.034, 0.034, 0.12, 6), { p: [0, 0, -0.035], c: MANT_D, c2: MANT });
        [1, -1].forEach(s =>
          b.add(K.cone(0.018, 0.06, 4), { p: [0, s * 0.69, 0.035], r: [s > 0 ? 0.5 : PI - 0.5, 0, 0], c: OR, ch: 's' })
        );
        b.add(K.cyl(0.004, 0.004, 1.34, 3), { p: [0, 0, 0.03], c: DOUBL });
      });
    // --- la magie de l'élément au-dessus de la main droite (pièce animée : elle tourne) et deux étincelles
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
      SH.motif(mR, ELK, { p: [0.375, 1.05, -0.215], r: [0, 0.5, 0], s: 0.4 });
      [
        [0.05, 0.3, 0.02, 0.016],
        [-0.04, 0.37, -0.02, 0.012]
      ].forEach(q =>
        mR.add(K.oct(q[3]), { p: [0.375 + q[0], 1.05 + q[1], -0.215 + q[2]], c: E.glow, ch: 'g', jit: 0 })
      );
      parts.push({
        name: 'magR',
        b: mR,
        parent: 'armR',
        pivot: [0.375, 1.05, -0.215],
        anim: [{ k: 'rot', axis: 'y', sp: 2.5, spin: true }]
      });
    }
    return { parts, bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } }, scale: 1, labelY: 2.4, jambes, mainD };
  };
}
