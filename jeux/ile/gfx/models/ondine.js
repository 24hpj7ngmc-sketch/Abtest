// ONDINE — l'héroïne Support, vue par ses coéquipiers. Fichier commun, comme braise.js (même interface, même gabarit).
// ≈ 1,8 m, origine aux pieds, regarde vers −Z. Pièces : body, armL, armR (pivots aux épaules, comme le gardien), puis magL et magR
// (la magie de soin au-dessus des paumes, qui flotte). En plus de la recette : jambes (premiers objets de body : jambe droite puis
// gauche, autant chacune) ; mainD (objets du bras droit à garder quand elle tient une arme).
// ctx.arme : elle tient une arme : bras le long du corps, sans la magie des mains.
// Langage des formes : courbes, vagues et rondeurs (robe en cloche à plusieurs pans, châle rond, longs cheveux ondulés).
// Couleurs : 60 % élément (robe, cheveux), 30 % crème irisée (jupon, châle, plastron), 10 % or (diadème, liserés, lanterne).
// L'élément se choisit : toute la palette vient de ctx.el (sans élément : l'Eau, son élément d'origine).
{
  const { PAL } = K,
    PI = Math.PI,
    OR = PAL.gold,
    OR_D = PAL.goldD,
    PEAU = PAL.skin,
    HY = 1.67;
  let ELK, E, ROBE, ROBE_D, ROBE_L, CREME, CREME_D, JUPON, CHALE, CHEV, CHEV_L, LUEUR;
  // plafond : assombrit une couleur trop claire (palettes pâles comme le Vent : pas de tache blanche sur le ciel)
  const plafond = (c, L) => {
    const q = K.mix(c, c, 0),
      l = 0.3 * q[0] + 0.59 * q[1] + 0.11 * q[2];
    return l > L ? K.shade(q, L / l) : q;
  };
  const palOndine = el => {
    ELK = K.EL[el] ? el : 'eau';
    E = K.EL[ELK];
    ROBE = plafond(E.main, 0.66);
    ROBE_D = K.mix(ROBE, E.dark, 0.6);
    ROBE_L = plafond(K.mix(E.main, E.light, 0.5), 0.74);
    CREME = plafond(K.mix(0xeee2cc, E.light, 0.3), 0.8);
    CREME_D = plafond(K.mix(0xcfbea2, E.main, 0.3), 0.68);
    JUPON = plafond(K.mix(CREME, E.light, 0.45), 0.8);
    CHALE = plafond(K.mix(E.light, 0xf4ecdc, 0.3), 0.8);
    CHEV = K.mix(E.dark, E.deep, 0.25);
    CHEV_L = K.mix(E.dark, E.main, 0.55);
    LUEUR = plafond(E.glow, 0.9);
  };
  // plaque : polygone [[x, y], …] dans le plan de face, épaisseur ep vers l'avant (−Z) à partir de o.p
  const plaque = (b, pts, ep, o) =>
    b.group({ p: o.p, r: o.r || [0, 0, 0] }, b =>
      b.add(K.prism(pts, ep), { r: [-PI / 2, 0, 0], c: o.c, ch: o.ch, jit: o.jit === undefined ? 0.04 : o.jit })
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
  // orientation qui pointe l'axe +Y d'une forme de A vers B (rotation XYZ du kit)
  const vise = (A, B) => {
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]],
      l = Math.hypot(d[0], d[1], d[2]) || 1;
    return [Math.atan2(d[2] / l, d[1] / l), 0, -Math.asin(d[0] / l)];
  };
  MODELS['hero.ondine'] = ctx => {
    palOndine(ctx && ctx.el);
    const arme = !!(ctx && ctx.arme),
      b = K.make(2611),
      aL = K.make(2612),
      aR = K.make(2613),
      mL = K.make(2614),
      mR = K.make(2615);
    // --- jambes (les premiers objets de body) : chausson à bout rond, jambe sous la robe
    b.sym(sd => {
      const x = sd * 0.1;
      b.add(K.box(0.11, 0.08, 0.23, 0.8, 0.6), { p: [x, 0.04, -0.05], c: CREME_D, c2: CREME });
      b.add(K.cyl(0.065, 0.06, 0.6, 6), { p: [x, 0.38, 0], c: CREME_D });
    });
    const jambes = b.items.length;
    // --- jupon crème en cloche, son ourlet clair
    b.add(
      K.lathe(
        [
          [0.4, 0.1],
          [0.37, 0.36],
          [0.28, 0.74],
          [0.205, 1.05]
        ],
        10
      ),
      {
        s: [1, 1, 0.82],
        c: K.shade(JUPON, 0.85),
        c2: JUPON
      }
    );
    b.add(K.cyl(0.405, 0.41, 0.04, 10, { open: true }), { p: [0, 0.11, 0], s: [1, 1, 0.82], c: ROBE_L });
    // --- robe ouverte devant : un grand pan qui s'évase et traîne un peu derrière, ourlet en vagues, doublure claire
    const A0 = 2.9;
    const robeF = (u, v) => {
      const A = A0 - 0.38 * v,
        a = (u - 0.5) * 2 * A,
        dos = Math.max(0, Math.cos(a)),
        r = 0.218 + 0.205 * Math.pow(v, 1.3) + 0.03 * Math.sin(v * PI),
        y = 1.05 - v * (0.86 + 0.06 * dos) + 0.03 * Math.sin(u * PI * 8) * Math.pow(v, 6);
      return [Math.sin(a) * r, y, Math.cos(a) * r * 0.82 + 0.07 * v * v * dos];
    };
    b.add(nappe(robeF, 16, 5, false), { c: ROBE_D, c2: ROBE, jit: 0.04 });
    b.add(nappe(robeF, 16, 5, true), { c: ROBE_L, c2: CREME, jit: 0.04 });
    // liseré d'or le long de l'ourlet en vagues
    const ourlet = [];
    for (let k = 0; k <= 16; k++) {
      const p = robeF(k / 16, 1);
      ourlet.push([p[0] * 1.01, p[1] + 0.008, p[2] * 1.01]);
    }
    b.add(K.tube(ourlet, 0.014, 3), { c: OR, ch: 's', jit: 0 });
    // --- basque à la taille : pan court en pointe devant, liseré d'or
    const basqueF = (u, v) => {
      const a = (u - 0.5) * 2 * PI,
        devant = Math.pow(Math.max(0, -Math.cos(a)), 3),
        r = 0.222 + 0.1 * v,
        y = 1.07 - v * (0.17 + 0.1 * devant) + 0.02 * Math.sin(u * PI * 10) * v;
      return [Math.sin(a) * r, y, Math.cos(a) * r * 0.84];
    };
    b.add(nappe(basqueF, 16, 2, false), { c: ROBE_D, c2: ROBE, jit: 0.04 });
    // --- ceinture, médaillon de soin (disque d'or, goutte brillante)
    b.add(K.cyl(0.208, 0.21, 0.07, 8, { open: true }), { p: [0, 1.07, 0], s: [1, 1, 0.82], c: CREME });
    b.add(K.cyl(0.05, 0.05, 0.022, 7), { p: [0, 1.07, -0.18], r: [PI / 2, 0, 0], c: OR, ch: 's' });
    b.add(K.oct(0.028), { p: [0, 1.07, -0.195], s: [0.9, 1.25, 0.6], c: E.light, c2: LUEUR, ch: 'g', jit: 0 });
    // --- lanterne de soin à la hanche gauche : chaînette, chapeau, cage d'or, cœur lumineux
    b.group({ p: [-0.27, 0.86, -0.12], r: [0, 0.5, 0] }, b => {
      b.add(K.box(0.012, 0.06, 0.012), { p: [0, 0.15, 0], c: OR_D, ch: 's' });
      b.add(K.cone(0.055, 0.05, 6), { p: [0, 0.1, 0], c: OR, ch: 's' });
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * PI * 2 + PI / 3;
        b.add(K.box(0.01, 0.12, 0.01), { p: [Math.sin(a) * 0.04, 0.02, Math.cos(a) * 0.04], c: OR_D, ch: 's' });
      }
      b.add(K.oct(0.036), { p: [0, 0.02, 0], s: [1, 1.35, 1], c: E.light, c2: LUEUR, ch: 'g', jit: 0 });
      b.add(K.cyl(0.05, 0.04, 0.025, 6, { open: true }), { p: [0, -0.045, 0], c: OR, ch: 's' });
      b.add(K.cone(0.018, 0.04, 4), { p: [0, -0.075, 0], r: [PI, 0, 0], c: OR, ch: 's' });
    });
    // --- nœud dans le dos de la ceinture : deux boucles et deux rubans qui tombent sur la robe
    b.group({ p: [0, 1.07, 0.18] }, b => {
      b.sym(sd => {
        b.add(K.cone(0.055, 0.13, 4), {
          p: [sd * 0.065, 0.015, 0.01],
          r: [0, 0, sd * 1.75],
          s: [1, 1, 0.45],
          c: CHALE,
          c2: CREME_D
        });
        b.add(K.cone(0.04, 0.34, 4), {
          p: [sd * 0.035, -0.18, 0.045],
          r: [PI - 0.22, 0, -sd * 0.1],
          s: [1, 1, 0.35],
          c: CHALE,
          c2: CREME_D
        });
      });
      b.add(K.oct(0.032), { s: [1, 1, 0.6], c: OR, ch: 's' });
    });
    // --- buste ajusté, plastron crème en cœur liseré d'or
    b.add(K.cyl(0.235, 0.19, 0.42, 8), { p: [0, 1.25, 0], s: [1, 1, 0.74], c: ROBE, c2: ROBE_L });
    plaque(
      b,
      [
        [-0.13, 0],
        [-0.05, 0.02],
        [0, -0.02],
        [0.05, 0.02],
        [0.13, 0],
        [0.07, -0.2],
        [0, -0.3],
        [-0.07, -0.2]
      ],
      0.02,
      { p: [0, 1.42, -0.16], r: [-0.1, 0, 0], c: OR, ch: 's' }
    );
    plaque(
      b,
      [
        [-0.11, -0.01],
        [-0.045, 0.008],
        [0, -0.03],
        [0.045, 0.008],
        [0.11, -0.01],
        [0.058, -0.19],
        [0, -0.275],
        [-0.058, -0.19]
      ],
      0.02,
      { p: [0, 1.42, -0.17], r: [-0.1, 0, 0], c: CREME }
    );
    // --- châle rond sur les épaules : il tombe en deux pans devant, ourlet en vagues, doublure à la couleur de l'élément
    const A1 = 2.78;
    const chaleF = (u, v) => {
      const a = (u - 0.5) * 2 * A1,
        devant = Math.pow(Math.abs(a) / A1, 5),
        r = 0.13 + 0.245 * (1 - Math.pow(1 - v, 2)),
        y = 1.565 - 0.27 * Math.pow(v, 1.2) - 0.22 * devant * v + 0.02 * Math.cos(u * PI * 12) * v * v;
      return [Math.sin(a) * r * 1.02, y, Math.cos(a) * r * 0.8 + 0.01];
    };
    b.add(nappe(chaleF, 14, 3, false), { c: K.shade(CHALE, 0.82), c2: CHALE, jit: 0.04 });
    b.add(nappe(chaleF, 14, 3, true), { c: ROBE_D, c2: ROBE, jit: 0.04 });
    // agrafe du châle : petite goutte d'or au col
    b.add(K.oct(0.03), { p: [0, 1.5, -0.13], s: [1, 1.2, 0.6], c: OR, ch: 's' });
    // --- tête : visage rond et doux, mêmes yeux que Braise, cils, sourcils fins, joues, sourire
    b.add(K.cyl(0.055, 0.065, 0.1, 6), { p: [0, 1.54, 0], c: K.shade(PEAU, 0.85) });
    b.add(K.sph(0.158, 9, 7), { p: [0, HY, -0.035], s: [0.97, 1.02, 0.95], c: PEAU, flat: false, jit: 0 });
    b.sym(sd => {
      SH.eye(b, {
        p: [sd * 0.057, HY + 0.012, -0.163],
        r: 0.042,
        rot: [0, PI - sd * 0.22, 0],
        iris: K.mix(E.deep, 0x101820, 0.3)
      });
      b.add(K.box(0.05, 0.01, 0.014), {
        p: [sd * 0.062, HY + 0.075, -0.158],
        r: [0, -sd * 0.2, sd * 0.16],
        c: K.shade(CHEV, 0.8),
        jit: 0
      });
      b.add(K.cone(0.012, 0.04, 3), {
        p: [sd * 0.098, HY + 0.04, -0.15],
        r: [0, 0, -sd * 1.0],
        c: 0x241812,
        jit: 0
      });
      b.add(K.sph(0.026, 5, 3), {
        p: [sd * 0.098, HY - 0.035, -0.14],
        s: [1, 0.6, 0.4],
        c: 0xf3a08e,
        flat: false,
        jit: 0
      });
    });
    b.add(K.cone(0.016, 0.036, 4), { p: [0, HY - 0.022, -0.194], r: [-PI / 2, 0, 0], c: K.shade(PEAU, 0.9) });
    b.add(K.torus(0.03, 0.008, 3, 6, PI), { p: [0, HY - 0.058, -0.165], r: [-0.25, 0, PI], c: 0xa0383a, jit: 0 });
    // --- chevelure : calotte, frange en deux mèches, deux longues mèches devant les épaules, cinq ondulées dans le dos
    b.add(K.ico(0.178, 1), { p: [0, HY + 0.03, 0.035], s: [1.05, 1.03, 1.08], c: CHEV, c2: CHEV_L });
    b.sym(sd => {
      b.add(
        K.tube(
          K.curve(
            [
              [sd * 0.01, HY + 0.165, -0.1],
              [sd * 0.08, HY + 0.13, -0.158],
              [sd * 0.135, HY + 0.06, -0.16],
              [sd * 0.16, HY - 0.03, -0.13]
            ],
            5
          ),
          [0.04, 0.045, 0.042, 0.035, 0.026, 0.014],
          5
        ),
        { c: CHEV, c2: CHEV_L }
      );
      const L = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        L.push([sd * (0.16 + 0.03 * t + 0.025 * Math.sin(t * PI * 2.5)), HY - 0.02 - 0.42 * t, -0.07 - 0.07 * t]);
      }
      b.add(K.tube(L, [0.045, 0.05, 0.048, 0.045, 0.04, 0.03, 0], 5), { c: CHEV, c2: CHEV_L });
    });
    for (let i = 0; i < 4; i++) {
      const x0 = (i - 1.5) * 0.07,
        L = [];
      for (let k = 0; k <= 5; k++) {
        const t = k / 5;
        L.push([
          x0 * (1 + 0.8 * t) + 0.035 * Math.sin(t * PI * 2.6 + i * 1.3),
          HY + 0.06 - (0.6 + 0.05 * (i % 2)) * t,
          0.1 + 0.19 * Math.sin(t * PI * 0.75) - 0.03 * t
        ]);
      }
      b.add(K.tube(L, [0.085, 0.1, 0.092, 0.078, 0.05, 0], 5), { c: CHEV, c2: CHEV_L });
    }
    // --- diadème d'or discret sur le front, goutte brillante au milieu
    b.group({ p: [0, HY + 0.1, 0.0], r: [-0.12, 0, 0] }, b =>
      b.group({ r: [0, PI * 0.1, 0] }, b =>
        b.add(K.torus(0.17, 0.011, 3, 8, PI * 0.8), { r: [-PI / 2, 0, 0], s: [1.04, 1, 1], c: OR, ch: 's' })
      )
    );
    b.add(K.oct(0.028), { p: [0, HY + 0.125, -0.182], s: [0.85, 1.35, 0.6], c: E.light, c2: LUEUR, ch: 'g', jit: 0 });
    b.sym(sd =>
      b.add(K.cone(0.016, 0.05, 4), { p: [sd * 0.05, HY + 0.13, -0.17], r: [-0.3, 0, -sd * 0.35], c: OR, ch: 's' })
    );
    // --- bras (pièces animées) : manche ajustée, manche évasée en cloche (dehors et doublure), main nue, bracelet d'or
    const bras = (a, sd) => {
      const S = [sd * 0.26, 1.46, 0],
        C = arme ? [sd * 0.315, 1.15, 0] : [sd * 0.36, 1.17, 0.0],
        W = arme ? [sd * 0.31, 0.98, -0.01] : [sd * 0.42, 1.04, -0.16],
        H = arme ? [sd * 0.3, 0.9, -0.01] : [sd * 0.44, 1.01, -0.225],
        rw = vise(W, C),
        L = Math.hypot(C[0] - W[0], C[1] - W[1], C[2] - W[2]);
      a.add(K.tube([S, [sd * 0.33, 1.32, 0.005], C], [0.06, 0.07, 0.06], 6), { c: ROBE, c2: ROBE_L });
      const M = [(W[0] + C[0]) / 2, (W[1] + C[1]) / 2, (W[2] + C[2]) / 2];
      a.add(K.cyl(0.062, 0.125, L * 1.05, 7, { open: true }), { p: M, r: rw, c: ROBE_D, c2: ROBE });
      a.add(
        K.lathe(
          [
            [0.058, L * 0.52],
            [0.118, -L * 0.52]
          ],
          7
        ),
        { p: M, r: rw, c: CREME, c2: CREME_D }
      );
      a.group(
        { p: [M[0] + (W[0] - C[0]) * 0.52, M[1] + (W[1] - C[1]) * 0.52, M[2] + (W[2] - C[2]) * 0.52], r: rw },
        a => a.add(K.cyl(0.128, 0.128, 0.022, 7, { open: true }), { c: OR, ch: 's' })
      );
      a.add(K.tube([C, W], [0.045, 0.04], 5), { c: K.shade(PEAU, 0.92) });
      a.add(K.cyl(0.046, 0.046, 0.022, 6, { open: true }), { p: W, r: rw, c: OR, ch: 's' });
      a.add(K.ico(0.066, 1), { p: H, r: rw, s: arme ? [0.85, 1, 1] : [0.95, 0.85, 0.75], c: PEAU });
      a.add(K.cone(0.022, 0.06, 4), {
        p: [H[0] - sd * 0.055, H[1] + 0.01, H[2] - 0.01],
        r: [rw[0], 0, sd * 0.9],
        c: PEAU
      });
    };
    bras(aL, -1);
    bras(aR, 1);
    // --- la magie de soin au-dessus des paumes (pièces animées : elle flotte) : le motif de l'élément et trois étincelles
    const magie = (f, sd) => {
      const x = sd * 0.445;
      SH.motif(f, ELK, { p: [x, 1.07, -0.235], r: [0, sd * 0.5, 0], s: 0.36 });
      [
        [0.06, 0.25, 0.02, 0.016],
        [-0.05, 0.31, -0.02, 0.012],
        [0.02, 0.37, 0.03, 0.01]
      ].forEach(q => f.add(K.oct(q[3]), { p: [x + sd * q[0], 1.07 + q[1], -0.235 + q[2]], c: LUEUR, ch: 'g', jit: 0 }));
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
      magie(mL, -1);
      magie(mR, 1);
      parts.push(
        {
          name: 'magL',
          b: mL,
          parent: 'armL',
          pivot: [-0.445, 1.07, -0.235],
          anim: [{ k: 'pos', axis: 'y', amp: 0.025, sp: 3 }]
        },
        {
          name: 'magR',
          b: mR,
          parent: 'armR',
          pivot: [0.445, 1.07, -0.235],
          anim: [{ k: 'pos', axis: 'y', amp: 0.025, sp: 3, ph: 1.5 }]
        }
      );
    }
    return { parts, bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } }, scale: 1, labelY: 2.15, jambes, mainD };
  };
}
