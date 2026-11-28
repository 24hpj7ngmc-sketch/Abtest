// ===================== DERNIER TOIT — les modèles tenus en main (vus à la première personne) =====================
// Contenu : les 6 armes à feu (vm.fusil, vm.pistolet, vm.assaut, vm.sniper, vm.pompe, vm.lance), le marteau (vm.marteau), la masse (vm.masse),
// le leurre (vm.leurre), la radio de la frappe aérienne (vm.radio) et le grappin (vm.grappin, V4.7), avec les gants et les manches du joueur.
// Repris de L'Île des Cinq : vm.pelle (pas utilisée par Dernier Toit) et hero.avatar (l'avatar des coéquipiers ; V4.3 : le corps des
// autres joueurs, affichage/joueurs.js ; il a besoin de SH, gfx/models/shared.js, repris tel quel de l'atelier du lobby).
// Attend : le kit K (gfx/kit.js) et l'objet MODELS (créé par build.py) ; aucune donnée des règles.
// Fournit : MODELS['vm.…'] (ctx.H = couleurs des gants et des manches, voir teinte) ; les armes rendent aussi hold, aim, tip (et pump pour la pompe),
// lus par affichage/armes.js (gfxGuns), et nophoto / photo, lus par outils/photos.js (photos du menu).
// Formes faites de graines K.make(n) et K.rng(n) : ne changer ni l'ordre des ajouts, ni les graines, ni les nombres (sinon la forme change).
// build.py retire les lignes de commentaire // de ce fichier avant de le coller dans la page.
//
// MAINS — les objets tenus par le joueur (vus à la première personne) et l'avatar des coéquipiers.
// Repère des objets tenus : celui de la caméra (−Z devant, +X à droite, +Y en haut), origine = la poignée, au creux de la main.
{
  const { PAL } = K,
    PI = Math.PI;
  // --- petits outils : vecteurs, et angles d'Euler (ordre XYZ) d'un repère dont l'axe Y suit `d` et l'axe X regarde vers `u`
  const nrm = a => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const frame = (d, u) => {
    const Y = nrm(d),
      Z = nrm(crs(u, Y)),
      X = crs(Y, Z);
    return [Math.atan2(-Z[1], Z[2]), Math.asin(Math.max(-1, Math.min(1, Z[0]))), Math.atan2(-Y[0], X[0])];
  };
  // --- cuirs du gardien (tirés de la palette)
  const GANT = K.mix(PAL.dirt, PAL.sand, 0.36),
    GANT_D = K.shade(PAL.dirt, 0.86),
    CUIR = K.mix(PAL.bark, PAL.wood, 0.5),
    CUIR_D = PAL.barkD;

  // ---------------------------------------------------------------- la main gantée (droite)
  // Repère de la main : le manche suit l'axe Y (pouce vers +Y), la paume est à droite (+X), les doigts passent devant (−Z)
  // et reviennent à gauche (−X), le poignet est derrière (+Z). ax, az : demi-largeur et demi-profondeur du manche.
  const doigt = (b, ax, az, y, rf, ls, c = GANT, j = 0.07) => {
    const q = (f, rho, dy) => {
      const a = ((12 + (f - 12) * ls) * PI) / 180;
      return [(ax + rho) * Math.cos(a), y + dy, -(az + rho) * Math.sin(a)];
    };
    b.add(
      K.tube(
        [q(12, 0.0175, 0), q(98, 0.0125, 0), q(160, 0.011, -0.001), q(205, 0.0095, -0.002), q(222, 0.008, -0.002)],
        [rf * 1.1, rf * 1.22, rf * 1.08, rf * 0.92, rf * 0.55],
        5
      ),
      { c, jit: j }
    );
  };
  const paume = (b, ax, yc, c = GANT, cD = GANT_D) => {
    b.add(K.ico(0.05, 0), { p: [ax + 0.011, yc, 0.034], s: [0.44, 0.94, 1], r: [0, 0.1, 0], c, jit: 0.06 }); // dos de la main, des jointures au poignet
    b.add(K.ico(0.023, 0), { p: [-0.003, yc + 0.02, 0.04], s: [1, 1.15, 1.1], c }); // éminence du pouce
    b.add(K.ico(0.021, 0), { p: [0.006, yc - 0.022, 0.046], s: [1, 1.2, 1.1], c: cD });
  }; // talon de la main
  // avant-bras : poignet en w, direction a (vers le coude), u = côté tourné vers le joueur (boucle et laçage)
  // avant-bras des outils : même gant tactique et même manche de veste que les armes (V3.0), couleurs du héros si H est donné
  const bras = (b, w, a, u, len, H) => manche(b, w, a, u, len, H || teinte(null));

  // ---------------------------------------------------------------- le poing refermé sur un manche rond (pelle, maillet)
  const poing = (b, ra, c = GANT, cD = GANT_D) => {
    for (const q of [
      [0.03, 0.0105, 1],
      [0.009, 0.011, 1],
      [-0.012, 0.0105, 0.97],
      [-0.032, 0.0095, 0.88]
    ])
      doigt(b, ra, ra, q[0], q[1], q[2], c);
    b.add(
      K.tube(
        [
          [0.004, 0.028, 0.05],
          [-0.016, 0.046, 0.026],
          [-ra - 0.0135, 0.05, -0.002],
          [-ra - 0.004, 0.046, -0.027],
          [-ra + 0.003, 0.044, -0.033]
        ],
        [0.016, 0.0135, 0.0125, 0.0105, 0.006],
        5
      ),
      { c, jit: 0.07 }
    ); // pouce posé au-dessus de l'index
    paume(b, ra, -0.002, c, cD);
  };
  // orientation commune des outils : manche penché vers l'avant et un peu vers la gauche, doigts et pouce tournés vers le joueur
  const BIAIS = frame([-0.12, 0.8, -0.59], [0.855, -0.12, -0.5]);

  // ================================================================ DERNIER TOIT : les armes à feu en main (pistolet, fusil d'assaut, fusil de précision, fusil)
  // Armes modernes génériques (aucun modèle réel). Repère : origine = la main droite sur la poignée pistolet, −Z devant, +Y en haut.
  // Chaque recette donne aussi, pour affichage/armes.js (gfxGuns) : hold = pose à la hanche [x, y, z, rx, ry, rz] devant la caméra ;
  // aim = position en visée (sans rotation : la ligne de mire, à la hauteur SY, tombe sur l'axe de la caméra, donc sur le réticule) ; tip = bout du canon.
  // Gants et manches aux couleurs du héros : ctx.H = {sleeve, sleeveD, glove, gloveD} (0xrrggbb ou '#rrggbb') ; gris neutres sans héros.
  // Photo du menu (photos.js) : une forme marquée nophoto n'y est pas ; photo:-1 = vue du flanc gauche (l'image est ensuite retournée, bouche à droite).
  const HDEF = { sleeve: 0x3a4047, sleeveD: 0x272b30, glove: 0x6b655b, gloveD: 0x3f3b35 };
  const hexa = c => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c);
  const teinte = ctx => {
    const H = Object.assign({}, HDEF),
      h = ctx && ctx.H;
    if (h) for (const k in HDEF) if (h[k] !== undefined && h[k] !== null) H[k] = hexa(h[k]);
    return H;
  };
  // polymère noir, acier bruni, sable, vert armée, verre (additif : on voit au travers), point rouge
  const NO = 0x26292d,
    NO_L = 0x383c42,
    NO_D = 0x17181b,
    AC = 0x434950,
    AC_L = 0x69717a,
    AC_D = 0x2c3035,
    SA = 0xa48b62,
    SA_L = 0xbea57b,
    SA_D = 0x7d6849,
    OD = 0x56603f,
    OD_L = 0x69744f,
    OD_D = 0x3d4530,
    VERRE = 0x0e2a36,
    ROUGE = 0xff3424;
  // V5.0 : la couleur de l'élément de l'arme (ctx.el, une clé de K.EL) teinte la carcasse (polymère), les pièces sable et vert armée ;
  // l'acier, le verre, les gants ne changent pas. Sans ctx.el (ou clé inconnue) : les couleurs d'avant, à l'identique (même forme, mêmes graines).
  const coulEl = ctx => {
    const E = ctx && ctx.el && K.EL[ctx.el];
    if (!E) return [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D];
    return [
      K.mix(NO, E.main, 0.6),
      K.mix(NO_L, E.light, 0.55),
      K.mix(NO_D, E.dark, 0.35),
      K.mix(SA, E.main, 0.55),
      K.mix(SA_L, E.light, 0.5),
      K.mix(SA_D, E.dark, 0.45),
      K.mix(OD, E.main, 0.55),
      K.mix(OD_L, E.light, 0.5),
      K.mix(OD_D, E.dark, 0.45)
    ];
  };
  const ZR = [-PI / 2, 0, 0]; // couche l'axe Y d'une forme le long de −Z : le haut d'un cylindre ou d'un profil tourné regarde vers l'avant
  // tube creux le long de Z (optiques) : ext et int = profils [[rayon, distance vers l'avant], …] de l'arrière vers l'avant, p = centre de l'arrière
  const creux = (b, ext, int, p, o) => b.add(K.lathe([int[0], ...ext, ...int.slice().reverse()], 10), Object.assign({ p, r: ZR }, o));
  // avant-bras : poignet du gant à patte auto-agrippante, manche de veste et son poignet. w : poignet, a : vers le coude, u : côté tourné vers le joueur
  const manche = (b, w, a, u, len, H) =>
    b.group({ p: w, r: frame(a, u) }, b => {
      b.add(
        K.lathe(
          [
            [0.029, -0.014],
            [0.032, 0.004],
            [0.0345, 0.022],
            [0.0375, 0.036],
            [0.038, 0.044],
            [0.033, 0.046]
          ],
          8
        ),
        { c: H.gloveD, c2: H.glove, jit: 0.03 }
      );
      b.add(K.box(0.009, 0.024, 0.03), { p: [0.033, 0.022, 0], r: [0, 0, -0.12], c: H.gloveD, jit: 0 });
      b.add(
        K.lathe(
          [
            [0.033, 0.03],
            [0.0465, 0.036],
            [0.049, 0.064],
            [0.047, 0.08],
            [0.051, 0.1],
            [0.054, 0.16],
            [0.052, 0.175],
            [0.0565, 0.19],
            [0.059, len]
          ],
          8,
          { capT: true }
        ),
        { c: K.mix(H.sleeveD, H.sleeve, 0.6), c2: H.sleeve, jit: 0.03 }
      );
      b.add(K.cyl(0.0498, 0.0498, 0.013, 8), { p: [0, 0.05, 0], c: H.sleeveD, jit: 0.02 });
      b.add(K.box(0.009, 0.032, 0.018), { p: [0.05, 0.05, 0], c: H.sleeveD, jit: 0 });
    });
  // dos de la main plus lisse (gant), éminence du pouce, talon ; pad : coque de protection des jointures
  const paumeM = (b, ax, yc, H, pad) => {
    b.add(K.ico(0.05, 1), { p: [ax + 0.011, yc, 0.034], s: [0.44, 0.94, 1], r: [0, 0.1, 0], c: H.glove, jit: 0.025 });
    b.add(K.ico(0.023, 0), { p: [-0.003, yc + 0.02, 0.04], s: [1, 1.15, 1.1], c: H.glove, jit: 0.03 });
    b.add(K.ico(0.021, 0), { p: [0.006, yc - 0.022, 0.046], s: [1, 1.2, 1.1], c: H.gloveD, jit: 0.03 });
    if (pad) b.add(K.box(0.009, 0.048, 0.024), { p: [ax + 0.031, yc, 0.016], r: [0, 0.1, 0], c: H.gloveD, jit: 0 });
  };
  // poing ganté sur un manche rond de rayon ra (index en haut, pouce par-dessus)
  const poingM = (b, ra, H) => {
    for (const q of [
      [0.03, 0.0105, 1],
      [0.009, 0.011, 1],
      [-0.012, 0.0105, 0.97],
      [-0.032, 0.0095, 0.88]
    ])
      doigt(b, ra, ra, q[0], q[1], q[2], H.glove, 0.035);
    b.add(
      K.tube(
        [
          [0.004, 0.028, 0.05],
          [-0.016, 0.046, 0.026],
          [-ra - 0.0135, 0.05, -0.002],
          [-ra - 0.004, 0.046, -0.027],
          [-ra + 0.003, 0.044, -0.033]
        ],
        [0.016, 0.0135, 0.0125, 0.0105, 0.006],
        5
      ),
      { c: H.glove, jit: 0.035 }
    );
    paumeM(b, ra, -0.002, H, true);
  };
  // main droite sur la poignée pistolet (repère de la poignée penché de TH ; ax, az : demi-largeur et demi-profondeur), index sur la détente, pouce sur la carcasse
  const mainD = (b, H, TH, ax, az, index, pouce) => {
    b.group({ r: [TH, 0, 0] }, b => {
      for (const y of [0.004, -0.017, -0.037]) doigt(b, ax, az, y, y < -0.03 ? 0.0095 : 0.0105, y < -0.03 ? 0.88 : 1, H.glove, 0.035);
      paumeM(b, ax, -0.006, H, false);
    });
    b.add(K.tube(index, [0.0112, 0.0118, 0.0102, 0.0088, 0.0055], 5), { c: H.glove, jit: 0.035 });
    b.add(K.tube(pouce, [0.0155, 0.013, 0.0118, 0.0102, 0.006], 5), { c: H.glove, jit: 0.035 });
  };
  // main gauche refermée sur une poignée verticale (miroir de la main droite) : p = milieu de la prise, ra = rayon ; w, a, u, len : l'avant-bras (repère de l'arme)
  const mainG = (b, H, p, ra, w, a, u, len) =>
    b.group({ p, s: [-1, 1, 1] }, b => {
      poingM(b, ra, H);
      manche(b, [-w[0] + p[0], w[1] - p[1], w[2] - p[2]], [-a[0], a[1], a[2]], [-u[0], u[1], u[2]], len, H);
    });
  // main gauche sous un fût (paume dessous, pouce le long du flanc gauche, doigts remontant à droite) : z = milieu de la main, yb = dessous du fût, hw = demi-largeur
  const mainSous = (b, H, z, yb, hw, a, len) => {
    const G = H.glove,
      D = H.gloveD;
    b.add(K.ico(0.026, 0), { p: [-0.004, yb - 0.011, z + 0.004], s: [1.15, 0.6, 1.45], c: G, jit: 0.03 }); // paume
    b.add(K.ico(0.02, 0), { p: [-hw - 0.006, yb - 0.006, z + 0.026], s: [0.8, 1, 1.2], c: D }); // talon de la main
    b.add(
      K.tube(
        [
          [-hw - 0.008, yb - 0.004, z + 0.03],
          [-hw - 0.011, yb + 0.012, z + 0.006],
          [-hw - 0.009, yb + 0.026, z - 0.022],
          [-hw - 0.006, yb + 0.032, z - 0.044]
        ],
        [0.0125, 0.0112, 0.0098, 0.006],
        5
      ),
      { c: G, jit: 0.035 }
    ); // pouce
    for (let i = 0; i < 4; i++) {
      const zz = z - 0.026 + i * 0.0175,
        r = i === 3 ? 0.0082 : 0.0095;
      b.add(
        K.tube(
          [
            [0.004, yb - 0.014, zz],
            [hw + 0.009, yb - 0.008, zz - 0.002],
            [hw + 0.012, yb + 0.016, zz - 0.004],
            [hw + 0.006, yb + 0.034, zz - 0.006]
          ],
          [r * 1.15, r * 1.1, r, r * 0.6],
          5
        ),
        { c: G, jit: 0.035 }
      );
    }
    manche(b, [-hw - 0.012, yb - 0.016, z + 0.05], a, [-0.75, 0.55, 0.35], len, H);
  };
  // pontet : boucle sous la carcasse, de z0 (arrière) à z1 (avant), du bas de la carcasse yc jusqu'à yb
  const pontet = (b, z0, z1, yc, yb, c) =>
    b.add(
      K.tube(
        [
          [0, yc, z0],
          [0, yb + 0.006, z0 - 0.004],
          [0, yb, z0 - 0.016],
          [0, yb, z1 + 0.012],
          [0, yb + 0.008, z1],
          [0, yc, z1 - 0.002]
        ],
        0.0033,
        4
      ),
      { c }
    );

  // ---------------------------------------------------------------- vm.pistolet : pistolet semi-automatique (carcasse de polymère, culasse d'acier, organes de visée à points blancs), tenu à deux mains
  MODELS['vm.pistolet'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(91),
      TH = -0.36,
      BY = 0.058,
      SY = 0.0845;
    // culasse : stries arrière, fenêtre d'éjection, bouche du canon
    b.add(K.box(0.025, 0.028, 0.185, 0.88, 1), { p: [0, 0.062, -0.058], c: AC_D, c2: AC, ch: 's' });
    for (let i = 0; i < 6; i++) b.add(K.box(0.0262, 0.019, 0.0022), { p: [0, 0.0605, 0.029 - i * 0.0056], c: NO_D, jit: 0 });
    b.add(K.box(0.011, 0.0014, 0.036), { p: [0.003, 0.0763, -0.024], c: NO_D, jit: 0 });
    b.add(K.box(0.009, 0.0012, 0.03), { p: [0.003, 0.0768, -0.026], c: AC_L, ch: 's', jit: 0 });
    b.add(K.cyl(0.0068, 0.0068, 0.006, 8), { p: [0, BY, -0.152], r: ZR, c: AC_L, ch: 's' });
    b.add(K.cyl(0.0046, 0.0046, 0.002, 8), { p: [0, BY, -0.1556], r: ZR, c: 0x0a0a0b, ch: 'g', jit: 0 });
    // hausse (deux lames, cran au milieu) et guidon, points blancs : leur sommet est à SY
    b.sym(sd => {
      b.add(K.box(0.0068, 0.0085, 0.008), { p: [sd * 0.0055, SY - 0.00425, 0.025], c: NO_D });
      b.add(K.box(0.0022, 0.0022, 0.001), { p: [sd * 0.0055, SY - 0.0035, 0.0292], c: 0xf2f0e6, ch: 'g', jit: 0 });
    });
    b.add(K.box(0.0034, 0.0085, 0.006), { p: [0, SY - 0.00425, -0.142], c: NO_D });
    b.add(K.box(0.0022, 0.0022, 0.001), { p: [0, SY - 0.0035, -0.1388], c: 0xf2f0e6, ch: 'g', jit: 0 });
    // carcasse : cache-poussière et son rail, flancs au-dessus de la poignée, queue de castor, arrêtoir de culasse, levier de démontage
    b.add(K.box(0.023, 0.017, 0.118), { p: [0, 0.0395, -0.087], c: NO, c2: NO_L });
    for (let i = 0; i < 3; i++) b.add(K.box(0.0236, 0.003, 0.006), { p: [0, 0.0305, -0.104 - i * 0.016], c: NO_D, jit: 0 });
    b.add(K.box(0.024, 0.017, 0.072), { p: [0, 0.0395, 0.004], c: NO, c2: NO_L });
    b.add(K.box(0.022, 0.01, 0.026), { p: [0, 0.038, 0.046], r: [-0.25, 0, 0], c: NO });
    b.add(K.box(0.002, 0.005, 0.03), { p: [-0.0124, 0.0445, -0.038], c: AC_D, ch: 's', jit: 0 });
    b.add(K.box(0.002, 0.006, 0.009), { p: [-0.0124, 0.039, -0.064], c: AC_D, ch: 's', jit: 0 });
    // pontet carré, détente
    pontet(b, -0.03, -0.086, 0.033, 0.004, NO);
    b.add(K.box(0.005, 0.017, 0.005), { p: [0, 0.021, -0.05], r: [0.25, 0, 0], c: NO_D });
    // poignée texturée et talon du chargeur (repère de la poignée)
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.045, 0],
            [0, 0, 0.002],
            [0, -0.045, 0.005],
            [0, -0.06, 0.006]
          ],
          [0.021, 0.0215, 0.022, 0.022],
          6
        ),
        { s: [0.66, 1, 1], c: NO, c2: NO_L }
      );
      b.add(K.box(0.027, 0.008, 0.044), { p: [0, -0.066, 0.006], c: NO_D });
    });
    // main droite (index sur la détente, pouce haut sous la culasse) ; main gauche par-dessus : doigts sur ceux de la main droite, pouce vers l'avant
    mainD(
      b,
      H,
      TH,
      0.0145,
      0.022,
      [
        [0.027, 0.03, -0.012],
        [0.024, 0.028, -0.034],
        [0.013, 0.024, -0.048],
        [0.003, 0.021, -0.051],
        [-0.002, 0.02, -0.049]
      ],
      [
        [0.004, 0.032, 0.045],
        [-0.013, 0.043, 0.022],
        [-0.02, 0.045, -0.006],
        [-0.019, 0.043, -0.03],
        [-0.017, 0.042, -0.04]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    b.group({ r: [TH, 0, 0], s: [-1, 1, 1] }, b => {
      for (const y of [-0.002, -0.021, -0.04]) doigt(b, 0.027, 0.037, y, y < -0.03 ? 0.0098 : 0.0108, 0.92, H.glove, 0.035);
      paumeM(b, 0.03, -0.016, H, true);
    });
    b.add(
      K.tube(
        [
          [-0.04, 0.014, 0.03],
          [-0.034, 0.024, 0.004],
          [-0.026, 0.031, -0.022],
          [-0.022, 0.033, -0.042]
        ],
        [0.0145, 0.0125, 0.0105, 0.006],
        5
      ),
      { c: H.glove, jit: 0.035 }
    );
    manche(b, [-0.046, -0.012, 0.06], [-0.55, -0.45, 0.7], [-0.6, 0.6, 0.5], 0.45, H);
    return {
      parts: [{ name: 'body', b }],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.17, -0.13, -0.4, 0.05, 0.28, 0.1],
      aim: [0, -SY, -0.38],
      tip: [0, BY, -0.16]
    };
  };

  // ---------------------------------------------------------------- vm.assaut : fusil d'assaut compact (carcasse sable, garde-main à rail, chargeur courbe, viseur point rouge), poignée avant
  MODELS['vm.assaut'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(92),
      TH = -0.36,
      BY = 0.088,
      SY = 0.15;
    // boîtiers inférieur et supérieur, puits de chargeur, levier d'armement, arrêtoir, sélecteur
    b.add(K.box(0.03, 0.036, 0.18), { p: [0, 0.053, -0.04], c: SA_D, c2: SA });
    b.add(K.box(0.032, 0.036, 0.19), { p: [0, 0.089, -0.045], c: SA, c2: SA_L });
    b.add(K.box(0.033, 0.03, 0.054), { p: [0, 0.03, -0.101], c: SA_D, c2: SA });
    b.add(K.box(0.03, 0.008, 0.016), { p: [0, 0.103, 0.058], c: NO_D });
    b.add(K.box(0.01, 0.008, 0.012), { p: [-0.019, 0.103, 0.062], c: NO_D });
    b.add(K.box(0.002, 0.016, 0.008), { p: [-0.0162, 0.052, -0.072], c: NO_D, jit: 0 });
    b.add(K.box(0.002, 0.005, 0.016), { p: [-0.0162, 0.06, 0.006], c: NO_D, jit: 0 });
    // rail supérieur continu et ses crans sur le garde-main
    b.add(K.box(0.021, 0.01, 0.47), { p: [0, 0.112, -0.175], c: NO_D, ch: 's' });
    for (let k = 0; k < 11; k++) b.add(K.box(0.023, 0.003, 0.007), { p: [0, 0.1175, -0.175 - k * 0.02], c: NO, jit: 0 });
    // garde-main octogonal à fentes, canon, cache-flamme fendu
    b.add(K.cyl(0.025, 0.025, 0.27, 8, { a0: PI / 8 }), { p: [0, BY, -0.275], r: ZR, c: SA, jit: 0.05 });
    for (const z of [-0.18, -0.23, -0.28, -0.33, -0.38])
      b.sym(sd => b.add(K.box(0.002, 0.008, 0.032), { p: [sd * 0.0234, BY, z], c: NO_D, jit: 0 }));
    b.add(K.cyl(0.0085, 0.0085, 0.095, 8), { p: [0, BY, -0.457], r: ZR, c: NO_D, ch: 's' });
    b.add(K.cyl(0.012, 0.012, 0.046, 8, { a0: PI / 8 }), { p: [0, BY, -0.527], r: ZR, c: AC_D, ch: 's' });
    for (let k = 0; k < 3; k++)
      b.group({ p: [0, BY, -0.535], r: [0, 0, (k * PI) / 3] }, g => g.add(K.box(0.026, 0.0028, 0.02), { c: NO_D, jit: 0 }));
    // hausse et guidon de secours, rabattus
    b.add(K.box(0.018, 0.007, 0.022), { p: [0, 0.1205, 0.04], c: NO_D });
    b.add(K.box(0.016, 0.008, 0.02), { p: [0, 0.121, -0.395], c: NO_D });
    // viseur point rouge : embase haute, tube creux (on vise au travers), tourelles, verre teinté, point rouge sur l'axe
    b.add(K.box(0.022, 0.018, 0.036), { p: [0, 0.126, -0.026], c: NO_D, ch: 's' });
    creux(
      b,
      [
        [0.0185, 0],
        [0.0195, 0.006],
        [0.0195, 0.042],
        [0.0212, 0.048],
        [0.0212, 0.056]
      ],
      [
        [0.0158, 0],
        [0.0164, 0.006],
        [0.0164, 0.042],
        [0.0182, 0.048],
        [0.0182, 0.056]
      ],
      [0, SY, 0.004],
      { c: NO, ch: 's' }
    );
    b.add(K.cyl(0.0075, 0.0075, 0.008, 8), { p: [0, SY + 0.022, -0.022], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0075, 0.0075, 0.008, 8), { p: [0.022, SY, -0.022], r: [0, 0, PI / 2], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0165, 0.0165, 0.0012, 10), { p: [0, SY, -0.04], r: ZR, c: VERRE, ch: 'x', jit: 0 });
    b.add(K.oct(0.0017), { p: [0, SY, -0.039], c: ROUGE, ch: 'g', jit: 0 });
    // crosse télescopique : tube, corps, plaque de couche
    b.add(K.cyl(0.0145, 0.0145, 0.12, 8), { p: [0, 0.08, 0.11], r: ZR, c: NO_D, ch: 's' });
    b.add(
      K.prism(
        [
          [0.064, 0.088],
          [0.099, 0.088],
          [0.097, 0.212],
          [0.006, 0.212],
          [0.05, 0.13]
        ],
        0.03,
        { y0: -0.015 }
      ),
      { r: [0, 0, PI / 2], c: SA_D }
    );
    b.add(K.box(0.032, 0.094, 0.012), { p: [0, 0.052, 0.218], c: NO_D });
    // chargeur courbe (trois tronçons) et sa semelle
    b.add(K.box(0.026, 0.05, 0.05), { p: [0, -0.006, -0.104], r: [0.1, 0, 0], c: NO, c2: NO_L });
    b.add(K.box(0.025, 0.05, 0.048), { p: [0, -0.052, -0.114], r: [0.28, 0, 0], c: NO });
    b.add(K.box(0.029, 0.01, 0.052), { p: [0, -0.08, -0.124], r: [0.38, 0, 0], c: NO_D });
    // pontet, détente, poignée pistolet, poignée avant et son collier
    pontet(b, -0.034, -0.074, 0.036, 0.006, SA_D);
    b.add(K.box(0.005, 0.017, 0.005), { p: [0, 0.024, -0.05], r: [0.25, 0, 0], c: NO_D });
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.046, 0],
            [0, 0, 0.003],
            [0, -0.048, 0.008],
            [0, -0.064, 0.01]
          ],
          [0.019, 0.02, 0.021, 0.021],
          6
        ),
        { s: [0.68, 1, 1], c: NO, c2: NO_L }
      );
      b.add(K.box(0.026, 0.008, 0.04), { p: [0, -0.068, 0.01], c: NO_D });
    });
    b.add(K.box(0.024, 0.01, 0.032), { p: [0, 0.062, -0.25], c: NO_D });
    b.add(K.cyl(0.0128, 0.0142, 0.072, 8), { p: [0, 0.026, -0.25], c: NO, c2: NO_L });
    b.add(K.cyl(0.015, 0.015, 0.008, 8), { p: [0, -0.012, -0.25], c: NO_D });
    // les mains
    mainD(
      b,
      H,
      TH,
      0.0145,
      0.022,
      [
        [0.027, 0.029, -0.01],
        [0.024, 0.028, -0.032],
        [0.013, 0.025, -0.047],
        [0.003, 0.022, -0.05],
        [-0.002, 0.021, -0.048]
      ],
      [
        [0.004, 0.032, 0.045],
        [-0.013, 0.044, 0.024],
        [-0.021, 0.047, 0],
        [-0.02, 0.047, -0.022],
        [-0.018, 0.046, -0.032]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    mainG(b, H, [0, 0.02, -0.25], 0.0138, [-0.018, 0.014, -0.175], [-0.35, -0.7, 0.62], [-0.6, 0.6, 0.5], 0.45);
    return {
      parts: [{ name: 'body', b }],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.22, -0.235, -0.47, 0.14, 0.07, 0.08],
      aim: [0, -SY, -0.15],
      tip: [0, BY, -0.552]
    };
  };

  // ---------------------------------------------------------------- vm.sniper : fusil de précision à verrou (crosse vert armée, longue lunette, bipied replié, levier de culasse à boule)
  MODELS['vm.sniper'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(93),
      TH = -0.3,
      BY = 0.082,
      SY = 0.148;
    // crosse : fût, logement du mécanisme, crosse à appui-joue, talon, plaque de couche
    b.add(K.box(0.038, 0.042, 0.37, 0.82, 1), { p: [0, 0.052, -0.27], c: OD_D, c2: OD });
    b.add(K.box(0.04, 0.045, 0.17), { p: [0, 0.054, 0], c: OD_D, c2: OD });
    b.add(
      K.prism(
        [
          [0.04, 0.085],
          [0.085, 0.085],
          [0.093, 0.24],
          [0.004, 0.24],
          [0.03, 0.15]
        ],
        0.032,
        { y0: -0.016 }
      ),
      { r: [0, 0, PI / 2], c: OD_D }
    );
    b.add(K.box(0.026, 0.008, 0.12), { p: [0, 0.093, 0.175], c: NO_D });
    b.add(K.box(0.034, 0.094, 0.014), { p: [0, 0.049, 0.247], c: NO_D });
    // boîtier, arrière de culasse, rail, levier de culasse à droite et sa boule
    b.add(K.cyl(0.0165, 0.0165, 0.19, 10), { p: [0, BY, -0.005], r: ZR, c: AC, ch: 's' });
    b.add(K.cyl(0.011, 0.0135, 0.03, 8), { p: [0, BY, 0.103], r: ZR, c: AC_D, ch: 's' });
    b.add(K.box(0.024, 0.006, 0.2), { p: [0, BY + 0.019, -0.01], c: NO_D, ch: 's' });
    b.add(
      K.tube(
        [
          [0.012, BY, 0.06],
          [0.032, BY - 0.004, 0.064],
          [0.047, BY - 0.016, 0.07]
        ],
        0.0042,
        6
      ),
      { c: AC_L, ch: 's' }
    );
    b.add(K.ico(0.0095, 1), { p: [0.05, BY - 0.02, 0.072], c: NO_D, ch: 's' });
    // canon lourd, frein de bouche à évents
    b.add(K.cyl(0.0105, 0.0125, 0.62, 8), { p: [0, BY, -0.41], r: ZR, c: NO_D, ch: 's' });
    b.add(K.cyl(0.0155, 0.0155, 0.055, 8, { a0: PI / 8 }), { p: [0, BY, -0.747], r: ZR, c: AC_D, ch: 's' });
    b.sym(sd => {
      for (const z of [-0.735, -0.75, -0.765]) b.add(K.box(0.004, 0.012, 0.007), { p: [sd * 0.0145, BY, z], c: NO_D, jit: 0 });
    });
    // bipied replié vers l'avant sous le fût
    b.add(K.box(0.034, 0.014, 0.03), { p: [0, 0.026, -0.415], c: NO_D, ch: 's' });
    b.sym(sd => {
      b.add(K.cyl(0.0045, 0.0045, 0.2, 6), { p: [sd * 0.011, 0.021, -0.52], r: ZR, c: NO_D, ch: 's' });
      b.add(K.box(0.011, 0.009, 0.016), { p: [sd * 0.011, 0.021, -0.625], c: NO_D });
    });
    // chargeur, pontet, détente, poignée
    b.add(K.box(0.026, 0.028, 0.072), { p: [0, 0.022, -0.12], c: NO });
    pontet(b, -0.032, -0.078, 0.032, 0.006, NO);
    b.add(K.box(0.005, 0.017, 0.005), { p: [0, 0.02, -0.05], r: [0.25, 0, 0], c: NO_D });
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.044, 0],
            [0, 0, 0.003],
            [0, -0.048, 0.008],
            [0, -0.064, 0.01]
          ],
          [0.02, 0.021, 0.022, 0.022],
          6
        ),
        { s: [0.7, 1, 1], c: OD_D, c2: OD }
      );
    });
    // lunette : colliers sur le rail, tube, oculaire, cloche d'objectif, tourelles (hauteur, dérive, mise au point à gauche)
    for (const z of [0.035, -0.075]) {
      b.add(K.box(0.02, 0.028, 0.014), { p: [0, 0.117, z], c: NO_D, ch: 's' });
      b.add(K.cyl(0.0185, 0.0185, 0.014, 10), { p: [0, SY, z], r: ZR, c: NO_D, ch: 's' });
    }
    b.add(
      K.lathe(
        [
          [0, 0],
          [0.017, 0],
          [0.021, 0.012],
          [0.021, 0.05],
          [0.0155, 0.075],
          [0.0155, 0.26],
          [0.023, 0.3],
          [0.0255, 0.31],
          [0.0255, 0.36],
          [0, 0.36]
        ],
        10
      ),
      { p: [0, SY, 0.115], r: ZR, c: NO, ch: 's' }
    );
    b.add(K.cyl(0.0168, 0.0168, 0.002, 10), { p: [0, SY, 0.1155], r: ZR, c: 0x0d1a22, ch: 'g', jit: 0 });
    b.add(K.cyl(0.022, 0.022, 0.002, 10), { p: [0, SY, -0.2455], r: ZR, c: 0x3b7590, ch: 'g', jit: 0 });
    b.add(K.cyl(0.0105, 0.0105, 0.022, 10), { p: [0, SY + 0.025, -0.03], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0112, 0.0112, 0.004, 10), { p: [0, SY + 0.034, -0.03], c: AC_L, ch: 's' });
    b.add(K.cyl(0.0105, 0.0105, 0.02, 10), { p: [0.024, SY, -0.03], r: [0, 0, PI / 2], c: NO_D, ch: 's' });
    b.add(K.cyl(0.014, 0.014, 0.012, 10), { p: [-0.021, SY, -0.03], r: [0, 0, PI / 2], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0144, 0.0144, 0.003, 10), { p: [-0.026, SY, -0.03], r: [0, 0, PI / 2], c: AC_L, ch: 's' });
    // les mains
    mainD(
      b,
      H,
      TH,
      0.015,
      0.022,
      [
        [0.027, 0.029, -0.012],
        [0.024, 0.027, -0.033],
        [0.013, 0.023, -0.047],
        [0.003, 0.02, -0.05],
        [-0.002, 0.019, -0.048]
      ],
      [
        [0.004, 0.03, 0.045],
        [-0.013, 0.042, 0.024],
        [-0.022, 0.045, 0],
        [-0.022, 0.045, -0.02],
        [-0.02, 0.045, -0.03]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    mainSous(b, H, -0.3, 0.031, 0.0175, [-0.35, -0.7, 0.62], 0.45);
    return {
      parts: [{ name: 'body', b }],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.22, -0.235, -0.47, 0.14, 0.07, 0.08],
      aim: [0, -SY, -0.2],
      tip: [0, BY, -0.78]
    };
  };

  // ---------------------------------------------------------------- vm.fusil : fusil de combat semi-automatique, « le fusil » du jeu (noir, long garde-main, chargeur droit, viseur holographique et sans loupe)
  MODELS['vm.fusil'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(81),
      TH = -0.36,
      BY = 0.088,
      SY = 0.148;
    // boîtiers, puits, levier d'armement, arrêtoir, sélecteur
    b.add(K.box(0.031, 0.038, 0.18), { p: [0, 0.052, -0.04], c: NO, c2: NO_L });
    b.add(K.box(0.033, 0.036, 0.19), { p: [0, 0.089, -0.045], c: NO, c2: NO_L, ch: 's' });
    b.add(K.box(0.034, 0.03, 0.056), { p: [0, 0.03, -0.102], c: NO });
    b.add(K.box(0.03, 0.008, 0.016), { p: [0, 0.103, 0.058], c: NO_D });
    b.add(K.box(0.01, 0.008, 0.012), { p: [-0.019, 0.103, 0.062], c: NO_D });
    b.add(K.box(0.002, 0.016, 0.008), { p: [-0.0167, 0.052, -0.072], c: AC_D, jit: 0 });
    b.add(K.box(0.002, 0.005, 0.016), { p: [-0.0167, 0.06, 0.006], c: AC_L, ch: 's', jit: 0 });
    b.add(K.box(0.002, 0.014, 0.05), { p: [0.0167, 0.09, -0.05], c: 0x9a7a36, ch: 's', jit: 0 });
    // rail supérieur et crans, long garde-main à fentes
    b.add(K.box(0.021, 0.01, 0.55), { p: [0, 0.112, -0.215], c: NO_D, ch: 's' });
    for (let k = 0; k < 14; k++) b.add(K.box(0.023, 0.003, 0.007), { p: [0, 0.1175, -0.17 - k * 0.021], c: NO_L, jit: 0 });
    b.add(K.cyl(0.026, 0.026, 0.35, 8, { a0: PI / 8 }), { p: [0, BY, -0.315], r: ZR, c: NO, jit: 0.05 });
    for (const z of [-0.18, -0.23, -0.28, -0.33, -0.38, -0.43])
      b.sym(sd => b.add(K.box(0.002, 0.008, 0.032), { p: [sd * 0.0243, BY, z], c: NO_D, jit: 0 }));
    b.add(K.box(0.003, 0.012, 0.06), { p: [-0.0245, BY - 0.012, -0.3], c: AC_L, ch: 's', jit: 0 });
    // canon, frein de bouche à évents
    b.add(K.cyl(0.0092, 0.0092, 0.12, 8), { p: [0, BY, -0.55], r: ZR, c: NO_D, ch: 's' });
    b.add(K.cyl(0.0145, 0.0145, 0.055, 8, { a0: PI / 8 }), { p: [0, BY, -0.637], r: ZR, c: AC_D, ch: 's' });
    b.sym(sd => {
      for (const z of [-0.625, -0.64, -0.655]) b.add(K.box(0.004, 0.011, 0.007), { p: [sd * 0.0135, BY, z], c: NO_D, jit: 0 });
    });
    // viseur holographique : socle, montants, capot, vitres teintées, réticule rouge (anneau et point) sur l'axe
    b.add(K.box(0.03, 0.016, 0.07), { p: [0, 0.125, -0.03], c: NO_D, ch: 's' });
    b.sym(sd => b.add(K.box(0.005, 0.032, 0.05), { p: [sd * 0.0165, SY - 0.002, -0.035], c: NO, ch: 's' }));
    b.add(K.box(0.038, 0.006, 0.056), { p: [0, SY + 0.017, -0.035], c: NO, ch: 's' });
    for (const z of [-0.011, -0.059]) b.add(K.box(0.028, 0.026, 0.001), { p: [0, SY, z], c: VERRE, ch: 'x', jit: 0 });
    b.add(K.torus(0.0042, 0.0005, 3, 12), { p: [0, SY, -0.058], c: ROUGE, ch: 'g', jit: 0 });
    b.add(K.oct(0.0011), { p: [0, SY, -0.058], c: ROUGE, ch: 'g', jit: 0 });
    // crosse fixe à appui-joue, plaque de couche
    b.add(K.cyl(0.015, 0.015, 0.1, 8), { p: [0, 0.08, 0.1], r: ZR, c: NO_D, ch: 's' });
    b.add(
      K.prism(
        [
          [0.058, 0.09],
          [0.1, 0.09],
          [0.097, 0.232],
          [0.004, 0.232],
          [0.04, 0.15]
        ],
        0.032,
        { y0: -0.016 }
      ),
      { r: [0, 0, PI / 2], c: NO }
    );
    b.add(K.box(0.034, 0.096, 0.012), { p: [0, 0.05, 0.238], c: NO_D });
    // chargeur droit, pontet, détente, poignée
    b.add(K.box(0.028, 0.1, 0.062), { p: [0, -0.032, -0.108], r: [0.06, 0, 0], c: NO_D, c2: NO });
    b.add(K.box(0.031, 0.01, 0.066), { p: [0, -0.083, -0.111], r: [0.06, 0, 0], c: NO_D });
    pontet(b, -0.034, -0.074, 0.036, 0.006, NO);
    b.add(K.box(0.005, 0.017, 0.005), { p: [0, 0.024, -0.05], r: [0.25, 0, 0], c: AC_L, ch: 's' });
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.046, 0],
            [0, 0, 0.003],
            [0, -0.048, 0.008],
            [0, -0.064, 0.01]
          ],
          [0.019, 0.02, 0.021, 0.021],
          6
        ),
        { s: [0.68, 1, 1], c: NO, c2: NO_L }
      );
      b.add(K.box(0.026, 0.008, 0.04), { p: [0, -0.068, 0.01], c: NO_D });
    });
    // les mains
    mainD(
      b,
      H,
      TH,
      0.0145,
      0.022,
      [
        [0.027, 0.029, -0.01],
        [0.024, 0.028, -0.032],
        [0.013, 0.025, -0.047],
        [0.003, 0.022, -0.05],
        [-0.002, 0.021, -0.048]
      ],
      [
        [0.004, 0.032, 0.045],
        [-0.013, 0.044, 0.024],
        [-0.021, 0.047, 0],
        [-0.02, 0.047, -0.022],
        [-0.018, 0.046, -0.032]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    mainSous(b, H, -0.29, BY - 0.024, 0.024, [-0.35, -0.7, 0.62], 0.45);
    return {
      parts: [{ name: 'body', b }],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.22, -0.235, -0.47, 0.14, 0.07, 0.08],
      aim: [0, -SY, -0.17],
      tip: [0, BY, -0.668]
    };
  };

  // ---------------------------------------------------------------- V3.9 vm.pompe : fusil à pompe tactique (boîtier noir, canon et tube magasin dessous, garde-main coulissant strié,
  // crosse fixe, porte-cartouches sur le flanc gauche, mire à œilleton et guidon). Le garde-main et la main gauche forment la pièce « pompe » : affichage/tirs.js (gunFx) la fait reculer puis revenir après chaque tir.
  MODELS['vm.pompe'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(95),
      pb = K.make(96),
      TH = -0.36,
      BY = 0.094,
      MY = 0.063,
      SY = 0.13,
      ROUGE_C = 0x9c2a20,
      LAITON = 0xc49a48;
    // boîtier : bloc principal, dessus arrondi, fenêtre d'éjection (à droite), fenêtre de chargement (dessous), sûreté, arrêtoir de culasse
    b.add(K.box(0.034, 0.07, 0.205), { p: [0, 0.077, -0.058], c: NO, c2: NO_L, ch: 's' });
    b.add(K.cyl(0.017, 0.017, 0.205, 8, { arc: PI, a0: -PI / 2 }), { p: [0, 0.112, -0.058], r: ZR, s: [1, 1, 0.45], c: NO_L, ch: 's' });
    b.add(K.box(0.002, 0.022, 0.056), { p: [0.0172, 0.09, -0.07], c: NO_D, jit: 0 });
    b.add(K.box(0.0016, 0.016, 0.048), { p: [0.0176, 0.09, -0.07], c: AC_L, ch: 's', jit: 0 });
    b.add(K.box(0.024, 0.003, 0.07), { p: [0, 0.0415, -0.115], c: NO_D, jit: 0 });
    b.add(K.cyl(0.0045, 0.0045, 0.038, 6), { p: [0, 0.108, 0.02], r: [0, 0, PI / 2], c: AC_D, ch: 's' });
    b.add(K.box(0.002, 0.006, 0.01), { p: [0.0172, 0.06, -0.135], c: AC_L, ch: 's', jit: 0 });
    // canon, bouche, âme ; tube magasin, bouchon, collier qui tient le canon au tube
    b.add(K.cyl(0.0105, 0.0105, 0.5, 10), { p: [0, BY, -0.41], r: ZR, c: AC_D, ch: 's' });
    b.add(K.cyl(0.0122, 0.0122, 0.014, 10), { p: [0, BY, -0.654], r: ZR, c: NO_D, ch: 's' });
    b.add(K.cyl(0.0078, 0.0078, 0.002, 8), { p: [0, BY, -0.6615], r: ZR, c: 0x0a0a0b, ch: 'g', jit: 0 });
    b.add(K.cyl(0.0115, 0.0115, 0.445, 8), { p: [0, MY, -0.38], r: ZR, c: NO_D, ch: 's' });
    b.add(K.cyl(0.0132, 0.0118, 0.026, 8), { p: [0, MY, -0.612], r: ZR, c: NO, ch: 's' });
    b.add(K.cyl(0.0062, 0.0062, 0.006, 6), { p: [0, MY, -0.627], r: ZR, c: AC_L, ch: 's' });
    b.add(K.box(0.03, 0.05, 0.016), { p: [0, (BY + MY) / 2, -0.575], c: NO, ch: 's' });
    b.add(K.cyl(0.0035, 0.0035, 0.034, 6), { p: [0, (BY + MY) / 2, -0.575], r: [0, 0, PI / 2], c: AC_L, ch: 's' });
    // mire : œilleton (anneau, entre deux oreilles) sur le boîtier ; guidon (lame à point orange, entre deux oreilles) au bout du canon : leur sommet / centre est à SY
    b.add(K.box(0.028, 0.012, 0.022), { p: [0, 0.118, 0.018], c: NO_D, ch: 's' });
    b.sym(sd => b.add(K.box(0.0045, 0.026, 0.018), { p: [sd * 0.0118, SY - 0.003, 0.018], c: NO_D, ch: 's' }));
    b.add(K.torus(0.0072, 0.0019, 4, 12), { p: [0, SY, 0.018], c: NO_D, ch: 's', jit: 0 });
    b.add(K.box(0.004, 0.006, 0.006), { p: [0, SY - 0.0098, 0.018], c: NO_D, jit: 0 });
    b.add(K.cyl(0.0124, 0.0124, 0.018, 8), { p: [0, BY, -0.618], r: ZR, c: NO_D, ch: 's' });
    b.add(K.box(0.0048, 0.024, 0.008), { p: [0, SY - 0.012, -0.618], c: NO_D });
    b.add(K.box(0.0044, 0.0044, 0.002), { p: [0, SY - 0.0026, -0.6136], c: 0xff7a22, ch: 'g', jit: 0 });
    b.sym(sd => b.add(K.box(0.003, 0.018, 0.014), { p: [sd * 0.0085, BY + 0.02, -0.618], c: NO_D, jit: 0 }));
    // porte-cartouches sur le flanc gauche : plaque et quatre cartouches rouges, culot de laiton en haut
    b.add(K.box(0.004, 0.034, 0.098), { p: [-0.0192, 0.088, -0.062], c: NO_D, jit: 0 });
    for (let i = 0; i < 4; i++) {
      const z = -0.026 - i * 0.024;
      b.add(K.cyl(0.0098, 0.0098, 0.05, 8), { p: [-0.031, 0.083, z], c: ROUGE_C, c2: K.mix(ROUGE_C, 0xffffff, 0.18) });
      b.add(K.cyl(0.0104, 0.0104, 0.011, 8), { p: [-0.031, 0.1135, z], c: LAITON, ch: 's' });
      b.add(K.box(0.0024, 0.04, 0.004), { p: [-0.0222, 0.086, z - 0.012], c: NO, jit: 0 });
    }
    // crosse fixe (profil : dessus presque droit, talon, ligne du dessous qui remonte vers la poignée), plaque de couche, anneau de bretelle
    b.add(
      K.prism(
        [
          [0.044, 0.044],
          [0.115, 0.044],
          [0.108, 0.272],
          [-0.012, 0.282],
          [-0.008, 0.25],
          [0.038, 0.1]
        ],
        0.034,
        { y0: -0.017 }
      ),
      { r: [0, 0, PI / 2], c: NO }
    );
    b.add(K.box(0.036, 0.124, 0.016), { p: [0, 0.049, 0.285], r: [-0.04, 0, 0], c: NO_D });
    for (const y of [0.0, 0.03, 0.06, 0.09])
      b.add(K.box(0.0372, 0.004, 0.017), { p: [0, y, 0.2855], r: [-0.04, 0, 0], c: 0x101113, jit: 0 });
    b.add(K.torus(0.007, 0.0018, 3, 8), { p: [0, -0.014, 0.25], r: [0, PI / 2, 0], c: AC_L, ch: 's', jit: 0 });
    // pontet, détente, poignée pistolet et son talon
    pontet(b, -0.034, -0.074, 0.042, 0.006, NO);
    b.add(K.box(0.005, 0.018, 0.005), { p: [0, 0.032, -0.05], r: [0.25, 0, 0], c: AC_L, ch: 's' });
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.048, 0],
            [0, 0, 0.003],
            [0, -0.048, 0.008],
            [0, -0.064, 0.01]
          ],
          [0.019, 0.02, 0.021, 0.021],
          6
        ),
        { s: [0.68, 1, 1], c: NO, c2: NO_L }
      );
      b.add(K.box(0.026, 0.008, 0.04), { p: [0, -0.068, 0.01], c: NO_D });
    });
    // main droite sur la poignée
    mainD(
      b,
      H,
      TH,
      0.0145,
      0.022,
      [
        [0.027, 0.031, -0.01],
        [0.024, 0.03, -0.032],
        [0.013, 0.027, -0.047],
        [0.003, 0.024, -0.05],
        [-0.002, 0.023, -0.048]
      ],
      [
        [0.004, 0.034, 0.045],
        [-0.013, 0.046, 0.024],
        [-0.021, 0.049, 0],
        [-0.02, 0.049, -0.022],
        [-0.018, 0.048, -0.032]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    // --- pièce « pompe » : garde-main strié autour du tube magasin (de −0,25 à −0,42 au repos), barres d'armement qui entrent dans le boîtier, main gauche dessous
    pb.add(K.cyl(0.0232, 0.0232, 0.17, 10), { p: [0, MY + 0.002, -0.335], r: ZR, s: [1, 1, 1.05], c: NO, c2: NO_L });
    for (let i = 0; i < 13; i++) {
      const z = -0.262 - i * 0.0122;
      if (z < -0.29 && z > -0.38) continue;
      pb.add(K.cyl(0.0242, 0.0242, 0.0045, 10, { open: true }), { p: [0, MY + 0.002, z], r: ZR, s: [1, 1, 1.05], c: NO_D, jit: 0 });
    }
    for (const z of [-0.25, -0.42])
      pb.add(K.cyl(0.0248, 0.0225, 0.01, 10), { p: [0, MY + 0.002, z], r: z < -0.3 ? ZR : [PI / 2, 0, 0], s: [1, 1, 1.05], c: NO_D });
    pb.sym(sd => pb.add(K.box(0.003, 0.007, 0.13), { p: [sd * 0.0118, MY + 0.016, -0.2], c: AC_L, ch: 's', jit: 0 }));
    mainSous(pb, H, -0.335, MY - 0.022, 0.0232, [-0.35, -0.7, 0.62], 0.45);
    return {
      parts: [
        { name: 'body', b },
        { name: 'pompe', b: pb, parent: 'body', pivot: [0, 0, 0] }
      ],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.22, -0.235, -0.47, 0.14, 0.07, 0.08],
      aim: [0, -SY, -0.17],
      tip: [0, BY, -0.668],
      pump: 0.085
    };
  };

  // ---------------------------------------------------------------- V3.9 vm.lance : lance-flammes moderne (boîtier de vanne noir, lance d'acier, écran thermique ajouré, buse évasée et sa veilleuse,
  // réservoir de carburant rouge sur le flanc gauche avec son manomètre, bouteille de gaz sous la lance, tuyau qui descend vers le dos). Poignée pistolet + poignée avant.
  // La flamme de la veilleuse est la pièce « veil » (pivot à sa base) : affichage/tirs.js (gunFx) la fait vaciller.
  MODELS['vm.lance'] = ctx => {
    const H = teinte(ctx),
      [NO, NO_L, NO_D, SA, SA_L, SA_D, OD, OD_L, OD_D] = coulEl(ctx),
      b = K.make(97),
      vb = K.make(98),
      TH = -0.36,
      BY = 0.086,
      SY = 0.128,
      VY = BY - 0.025,
      RJ = 0x8e2b20,
      RJ_L = 0xc04a32,
      LAITON = 0xc49a48,
      CAO = 0x1c1e21,
      JAUNE = 0xd9a21e;
    const TX = -0.052,
      TY = 0.05; // axe du réservoir rouge (flanc gauche)
    // boîtier de vanne : bloc, capot, bouton d'allumage (orange, sous le pouce), culot arrière
    b.add(K.box(0.036, 0.064, 0.21), { p: [0, 0.072, -0.055], c: NO, c2: NO_L, ch: 's' });
    b.add(K.box(0.03, 0.01, 0.17), { p: [0, 0.109, -0.06], c: NO_D, ch: 's' });
    b.add(K.box(0.003, 0.009, 0.014), { p: [-0.0185, 0.086, -0.03], c: 0xff5a24, ch: 'g', jit: 0 });
    b.add(K.box(0.002, 0.014, 0.04), { p: [0.0182, 0.08, -0.09], c: AC_L, ch: 's', jit: 0 });
    b.add(K.cyl(0.016, 0.019, 0.022, 8), { p: [0, 0.074, 0.061], r: [PI / 2, 0, 0], c: NO_D, ch: 's' });
    // lance d'acier, bague de réglage, écran thermique ajouré
    b.add(K.cyl(0.0115, 0.0115, 0.47, 8), { p: [0, BY, -0.385], r: ZR, c: AC, c2: AC_L, ch: 's' });
    b.add(K.cyl(0.0155, 0.0155, 0.014, 8), { p: [0, BY, -0.2], r: ZR, c: LAITON, ch: 's' });
    b.add(K.cyl(0.021, 0.021, 0.2, 10), { p: [0, BY, -0.5], r: ZR, c: NO_D, c2: NO, ch: 's' });
    for (const z of [-0.445, -0.495, -0.545])
      b.sym(sd => b.add(K.box(0.002, 0.009, 0.03), { p: [sd * 0.0202, BY, z], c: 0x0c0d0f, jit: 0 }));
    for (const z of [-0.445, -0.495, -0.545]) b.add(K.box(0.008, 0.002, 0.03), { p: [0, BY + 0.0202, z], c: 0x0c0d0f, jit: 0 });
    // buse évasée (lèvre rentrante), teinte bleuie par la chaleur, âme noire
    b.add(
      K.lathe(
        [
          [0.0125, 0],
          [0.0138, 0.008],
          [0.0138, 0.028],
          [0.0172, 0.044],
          [0.0198, 0.06],
          [0.0206, 0.07],
          [0.0158, 0.07],
          [0.0138, 0.058]
        ],
        8
      ),
      { p: [0, BY, -0.6], r: ZR, c: AC_L, c2: 0x5d5a78, ch: 's' }
    );
    b.add(K.cyl(0.0136, 0.0136, 0.002, 8), { p: [0, BY, -0.66], r: ZR, c: 0x0a0a0b, ch: 'g', jit: 0 });
    // allumeur sous la buse : boîtier, tube de la veilleuse
    b.add(K.box(0.012, 0.013, 0.05), { p: [0, VY - 0.002, -0.62], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0036, 0.0036, 0.032, 6), { p: [0, VY, -0.659], r: ZR, c: AC_L, ch: 's' });
    // mire : cran arrière sur le capot, guidon à point orange sur l'écran thermique (sommets à SY)
    b.add(K.box(0.022, 0.006, 0.012), { p: [0, 0.117, 0.02], c: NO_D, ch: 's' });
    b.sym(sd => b.add(K.box(0.0045, 0.016, 0.008), { p: [sd * 0.0058, SY - 0.008, 0.02], c: NO_D, ch: 's' }));
    b.add(K.box(0.0042, SY - BY - 0.021, 0.006), { p: [0, (SY + BY + 0.021) / 2, -0.565], c: NO_D });
    b.add(K.box(0.0034, 0.0034, 0.002), { p: [0, SY - 0.0022, -0.5616], c: 0xff7a22, ch: 'g', jit: 0 });
    // réservoir de carburant rouge sur le flanc gauche (fonds bombés), deux colliers qui le tiennent au boîtier, bande jaune
    b.add(
      K.lathe(
        [
          [0, 0],
          [0.0175, 0.005],
          [0.027, 0.024],
          [0.027, 0.156],
          [0.0175, 0.175],
          [0, 0.18]
        ],
        8
      ),
      { p: [TX, TY, -0.07], r: ZR, c: RJ, c2: RJ_L, ch: 's' }
    );
    for (const z of [-0.1, -0.215]) {
      b.add(K.cyl(0.0282, 0.0282, 0.01, 8, { open: true }), { p: [TX, TY, z], r: ZR, c: NO_D, jit: 0 });
      b.add(K.box(0.022, 0.01, 0.01), { p: [-0.026, TY + 0.004, z], c: NO_D, jit: 0 });
    }
    b.add(K.cyl(0.028, 0.028, 0.02, 8, { open: true }), { p: [TX, TY, -0.158], r: ZR, c: JAUNE, jit: 0 });
    // à l'avant du réservoir : bouchon de laiton et tuyau d'alimentation qui rejoint la bague de la lance
    b.add(K.cyl(0.0085, 0.0085, 0.01, 6), { p: [TX, TY, -0.254], r: ZR, c: LAITON, ch: 's' });
    b.add(
      K.tube(
        K.curve(
          [
            [TX + 0.01, TY + 0.012, -0.244],
            [TX + 0.012, TY + 0.03, -0.262],
            [-0.026, BY + 0.004, -0.236],
            [-0.014, BY + 0.006, -0.205]
          ],
          5
        ),
        0.0052,
        5
      ),
      { c: CAO, jit: 0.04 }
    );
    // à l'arrière : détendeur de laiton, manomètre tourné vers le haut (cadran blanc, aiguille rouge), petit tuyau vers le boîtier
    b.add(K.box(0.016, 0.016, 0.016), { p: [TX, TY, -0.064], c: LAITON, ch: 's' });
    b.add(K.cyl(0.0128, 0.0128, 0.006, 8), { p: [TX, TY + 0.013, -0.064], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0108, 0.0108, 0.002, 8), { p: [TX, TY + 0.0165, -0.064], c: 0xe9e5d8, ch: 'g', jit: 0 });
    b.add(K.box(0.0016, 0.0012, 0.009), { p: [TX + 0.0015, TY + 0.0178, -0.0655], r: [0, 0.7, 0], c: 0xd8261c, ch: 'g', jit: 0 });
    b.add(
      K.tube(
        [
          [TX + 0.008, TY + 0.002, -0.056],
          [-0.034, TY + 0.012, -0.04],
          [-0.02, 0.078, -0.038]
        ],
        0.0038,
        5
      ),
      { c: CAO, jit: 0.04 }
    );
    // bouteille de gaz sous la lance (devant le pontet) et son robinet
    b.add(
      K.lathe(
        [
          [0, 0],
          [0.011, 0.003],
          [0.0165, 0.014],
          [0.0165, 0.11],
          [0.012, 0.12],
          [0.006, 0.124]
        ],
        6
      ),
      { p: [0, 0.02, -0.215], r: [PI / 2, 0, 0], c: AC_L, c2: 0xb9c1c7, ch: 's' }
    );
    b.add(K.cyl(0.006, 0.006, 0.014, 6), { p: [0, 0.02, -0.086], r: [PI / 2, 0, 0], c: LAITON, ch: 's' });
    b.add(K.box(0.024, 0.008, 0.012), { p: [0, 0.04, -0.15], c: NO_D, jit: 0 });
    // tuyau principal : sort du culot arrière, descend sous la poignée et part vers le dos (hors de l'écran)
    b.add(
      K.tube(
        K.curve(
          [
            [0, 0.074, 0.07],
            [0, 0.07, 0.1],
            [0.012, 0.02, 0.13],
            [0.03, -0.08, 0.15],
            [0.05, -0.2, 0.17],
            [0.07, -0.32, 0.2]
          ],
          6
        ),
        0.0112,
        5
      ),
      { c: CAO, c2: 0x2a2d31, jit: 0.04, nophoto: 1 }
    );
    // pontet, détente, poignée pistolet ; poignée avant sous la lance (collier, poignée, embout)
    pontet(b, -0.034, -0.074, 0.04, 0.006, NO);
    b.add(K.box(0.005, 0.018, 0.005), { p: [0, 0.03, -0.05], r: [0.25, 0, 0], c: AC_L, ch: 's' });
    b.group({ r: [TH, 0, 0] }, b => {
      b.add(
        K.tube(
          [
            [0, 0.046, 0],
            [0, 0, 0.003],
            [0, -0.048, 0.008],
            [0, -0.064, 0.01]
          ],
          [0.019, 0.02, 0.021, 0.021],
          6
        ),
        { s: [0.68, 1, 1], c: NO, c2: NO_L }
      );
      b.add(K.box(0.026, 0.008, 0.04), { p: [0, -0.068, 0.01], c: NO_D });
    });
    b.add(K.box(0.024, 0.012, 0.032), { p: [0, BY - 0.017, -0.35], c: NO_D, ch: 's' });
    b.add(K.cyl(0.0128, 0.0142, 0.072, 8), { p: [0, 0.026, -0.35], c: NO, c2: NO_L });
    b.add(K.cyl(0.015, 0.015, 0.008, 8), { p: [0, -0.012, -0.35], c: NO_D });
    // les mains
    mainD(
      b,
      H,
      TH,
      0.0145,
      0.022,
      [
        [0.027, 0.029, -0.01],
        [0.024, 0.028, -0.032],
        [0.013, 0.025, -0.047],
        [0.003, 0.022, -0.05],
        [-0.002, 0.021, -0.048]
      ],
      [
        [0.004, 0.032, 0.045],
        [-0.013, 0.044, 0.024],
        [-0.021, 0.047, 0],
        [-0.02, 0.047, -0.022],
        [-0.018, 0.046, -0.032]
      ]
    );
    manche(b, [0.014, 0.008, 0.085], [0.12, -0.5, 0.86], [-0.8, 0.5, 0.3], 0.45, H);
    mainG(b, H, [0, 0.02, -0.35], 0.0138, [-0.018, 0.014, -0.275], [-0.35, -0.7, 0.62], [-0.6, 0.6, 0.5], 0.45);
    // --- pièce « veil » : la flamme de la veilleuse (cœur bleu, langue orange penchée vers le haut, halo additif)
    vb.add(K.ico(0.0034, 0), { p: [0, VY, -0.677], c: 0x9fd4ff, ch: 'g', jit: 0 });
    vb.add(K.cone(0.0048, 0.017, 6), { p: [0, VY + 0.003, -0.684], r: [-PI / 2 + 0.45, 0, 0], c: 0xffb347, ch: 'g', jit: 0 });
    vb.add(K.ico(0.011, 0), { p: [0, VY + 0.002, -0.682], s: [1, 1, 1.4], c: 0xff7a22, ch: 'x', jit: 0, nophoto: 1 });
    return {
      parts: [
        { name: 'body', b },
        { name: 'veil', b: vb, parent: 'body', pivot: [0, VY, -0.676] }
      ],
      bake: { ground: 0, jit: 0.03 },
      hold: [0.22, -0.235, -0.47, 0.14, 0.07, 0.08],
      aim: [0, -SY, -0.2],
      tip: [0, BY, -0.672],
      veil: [0, VY, -0.676],
      photo: -1
    };
  };

  // ---------------------------------------------------------------- vm.pelle : la pelle du terrassier (courte, poignée en T)
  MODELS['vm.pelle'] = ctx => {
    const b = K.make(51),
      FER = PAL.ironL;
    const D = [
        [0, -0.012],
        [0.03, -0.012],
        [0.085, 0],
        [0.1, 0.065],
        [0.094, 0.14],
        [0.078, 0.176],
        [0.064, 0.2],
        [0.03, 0.223],
        [0, 0.23]
      ], // demi-lame droite (z, y), tranchant ébréché
      G = [
        [0, -0.012],
        [0.03, -0.012],
        [0.085, 0],
        [0.1, 0.065],
        [0.096, 0.135],
        [0.074, 0.19],
        [0.036, 0.222],
        [0, 0.23]
      ]; // demi-lame gauche
    b.group({ r: BIAIS }, b => {
      // manche de bois, ligatures de corde et chiffon noué
      b.add(K.cyl(0.0155, 0.0172, 0.215, 7), { p: [0, 0.0225, 0], c: PAL.wood, c2: PAL.woodL });
      for (const y of [0.062, 0.072, 0.082]) b.add(K.cyl(0.0178, 0.0178, 0.007, 7), { p: [0, y, 0], c: PAL.rope, jit: 0.08 });
      b.add(K.cyl(0.0192, 0.0192, 0.014, 7), { p: [0, 0.1, 0], c: PAL.cloth });
      b.add(K.box(0.004, 0.055, 0.016, 1, 0.6), { p: [-0.019, 0.075, 0.012], r: [0.25, 0, 0.12], c: PAL.cloth, c2: PAL.clothD });
      b.add(K.box(0.004, 0.04, 0.014, 1, 0.5), { p: [-0.02, 0.082, -0.008], r: [-0.3, 0, 0.1], c: PAL.clothD });
      // poignée en T, virole de bronze
      b.add(K.cyl(0.015, 0.015, 0.118, 7), { p: [0, -0.094, 0], r: [PI / 2, 0, 0], c: PAL.woodD, c2: PAL.wood });
      for (const sd of [-1, 1])
        b.add(K.cyl(0.0168, 0.0168, 0.012, 7), { p: [0, -0.094, sd * 0.06], r: [PI / 2, 0, 0], c: PAL.bronze, ch: 's' });
      b.add(K.cyl(0.0195, 0.0205, 0.018, 7), { p: [0, -0.078, 0], c: PAL.bronzeL, ch: 's' });
      // douille de fer rivetée
      b.add(K.cyl(0.0215, 0.0185, 0.092, 7), { p: [0, 0.166, 0], c: FER, c2: PAL.steel, ch: 's' });
      b.add(K.cyl(0.0208, 0.0208, 0.012, 7), { p: [0, 0.122, 0], c: PAL.bronze, ch: 's' });
      for (const y of [0.15, 0.185]) b.add(K.oct(0.005), { p: [-0.0205, y, 0], c: PAL.gold, ch: 's', jit: 0 });
      // lame de fer large, creuse (deux pans), bord usé plus clair
      b.group({ p: [0, 0.206, 0], r: [0, 0, 0.14], s: [1, 1, 0.92] }, b => {
        [
          [D, 1],
          [G, -1]
        ].forEach(q =>
          b.group({ r: [0, -q[1] * 0.2, 0] }, b => {
            b.add(
              K.prism(
                q[0].map(v => [v[1], v[0]]),
                0.004,
                { y0: -0.002 }
              ),
              { r: [0, 0, PI / 2], s: [1, 1, q[1]], c: PAL.steel, ch: 's', jit: 0.08 }
            );
            b.add(
              K.prism(
                q[0].map(v => [0.008 + v[1] * 0.92, v[0] * 0.9]),
                0.008,
                { y0: -0.004 }
              ),
              { r: [0, 0, PI / 2], s: [1, 1, q[1]], c: K.mix(FER, PAL.steel, 0.35), jit: 0.1 }
            );
            b.add(K.box(0.012, 0.006, 0.05), { p: [-0.003, -0.011, q[1] * 0.056], c: PAL.iron, ch: 's' });
          })
        ); // rebords d'appui
        b.add(K.box(0.008, 0.15, 0.016, 1, 0.25), { p: [-0.004, 0.068, 0], c: PAL.steel, ch: 's' }); // nervure centrale
        for (const q of [
          [0.15, 0.04, 0.018],
          [0.185, -0.03, 0.014],
          [0.12, -0.06, 0.012],
          [0.2, 0.02, 0.01]
        ])
          b.add(K.oct(q[2]), { p: [-0.0045 - Math.abs(q[1]) * 0.2, q[0], q[1]], s: [0.12, 1.3, 1], c: PAL.dirt, jit: 0.15 }); // terre collée
      });
      poing(b, 0.0165);
      bras(b, [0.018, -0.004, 0.08], [0.19, -0.67, 0.72], [-1, 0.2, 0.3], 0.2);
    });
    return { parts: [{ name: 'body', b }], bake: { ground: 0, jit: 0.04 }, hold: { p: [0.825, -0.315, -0.65], r: [-0.3, -0.1, -0.14] } };
  };
  // ---------------------------------------------------------------- vm.marteau : le maillet du bâtisseur
  MODELS['vm.marteau'] = ctx => {
    const H = teinte(ctx),
      b = K.make(61),
      HY = 0.252,
      AC = 0x4b535b,
      ACL = 0x7d878f,
      FR = 0xb9c1c7,
      FB = 0xd99a1e,
      FBL = 0xe8b443,
      CA = 0x1d2023;
    b.group({ r: BIAIS }, b => {
      // manche en fibre de verre jaune, poignée de caoutchouc noir à rainures, embout
      b.add(K.cyl(0.0145, 0.0165, 0.3, 8), { p: [0, 0.075, 0], c: FB, c2: FBL, jit: 0.03 });
      b.add(K.cyl(0.0185, 0.0195, 0.15, 8), { p: [0, 0.004, 0], c: CA, c2: 0x2b2f33, jit: 0.04 });
      for (const y of [-0.03, 0.0, 0.03]) b.add(K.cyl(0.0198, 0.0198, 0.006, 8), { p: [0, y, 0], c: 0x121416, jit: 0 });
      b.add(K.cyl(0.0175, 0.021, 0.016, 8), { p: [0, -0.078, 0], c: 0x121416 });
      b.add(K.cyl(0.0168, 0.0168, 0.02, 8), { p: [0, 0.09, 0], c: CA, jit: 0 });
      // tête d'acier : bloc, col, face de frappe ronde polie d'un côté, panne fendue recourbée de l'autre
      b.add(K.box(0.034, 0.044, 0.06), { p: [0, HY, 0], c: AC, c2: ACL, ch: 's', jit: 0.03 });
      b.add(K.cyl(0.0175, 0.0195, 0.05, 8), { p: [0, HY, 0.052], r: [PI / 2, 0, 0], c: AC, c2: ACL, ch: 's' });
      b.add(K.cyl(0.0205, 0.0205, 0.012, 8), { p: [0, HY, 0.082], r: [PI / 2, 0, 0], c: FR, ch: 's', jit: 0 });
      for (const sd of [-1, 1])
        b.add(
          K.tube(
            [
              [sd * 0.008, HY + 0.012, -0.026],
              [sd * 0.009, HY + 0.006, -0.058],
              [sd * 0.01, HY - 0.012, -0.088],
              [sd * 0.011, HY - 0.038, -0.106]
            ],
            [0.011, 0.009, 0.006, 0.0025],
            5
          ),
          { c: AC, c2: ACL, ch: 's', jit: 0.02 }
        );
      b.add(K.cyl(0.0185, 0.0175, 0.03, 8), { p: [0, HY - 0.034, 0], c: AC, ch: 's' });
      b.add(K.box(0.01, 0.006, 0.018), { p: [0, HY + 0.024, 0], c: 0x2e3338, ch: 's', jit: 0 });
      poing(b, 0.0178, H.glove, H.gloveD);
      bras(b, [0.018, -0.004, 0.08], [0.19, -0.67, 0.72], [-1, 0.2, 0.3], 0.2, H);
    });
    return { parts: [{ name: 'body', b }], bake: { ground: 0, jit: 0.04 }, hold: { p: [0.7, -0.29, -0.56], r: [-0.12, -0.1, -0.12] } };
  };
  // ---------------------------------------------------------------- hero.avatar : le gardien vu par ses coéquipiers (≈ 1,8 m, regarde vers −Z)
  MODELS['hero.avatar'] = ctx => {
    // V5.1 : les six héros ont leur modèle (MODELS['hero.braise'], roc, sylve, volt, ondine, zephyr : gfx/models/, communs aux trois jeux) ; l'identité (ctx.hero) choisit, le gardien sert de repli
    { const N = { feu: 'braise', terre: 'roc', bois: 'sylve', elec: 'volt', eau: 'ondine', vent: 'zephyr' }[ctx.hero || ctx.el], M = N && MODELS['hero.' + N]; if (M) return M(ctx); }
    const P = ctx.P || K.EL.feu,
      b = K.make(71),
      aL = K.make(72),
      aR = K.make(73),
      TUN = P.main;
    // --- bottes à revers et jambes
    b.sym(sd => {
      b.add(K.box(0.13, 0.1, 0.27, 0.85, 0.75), { p: [sd * 0.11, 0.05, -0.035], c: CUIR_D });
      b.add(K.cyl(0.068, 0.075, 0.32, 6), { p: [sd * 0.11, 0.24, 0], c: CUIR_D, c2: CUIR });
      b.add(K.cyl(0.084, 0.078, 0.05, 6), { p: [sd * 0.11, 0.41, 0], c: GANT_D });
      b.add(K.cyl(0.078, 0.07, 0.34, 6), { p: [sd * 0.11, 0.6, 0], c: PAL.dirtD });
    });
    // --- tunique à la couleur de l'élément : jupe galonnée, ceinture, torse, baudrier
    b.add(K.cyl(0.2, 0.275, 0.36, 8), { p: [0, 0.87, 0], s: [1, 1, 0.82], c: P.dark, c2: TUN });
    b.add(K.cyl(0.28, 0.285, 0.035, 8), { p: [0, 0.7, 0], s: [1, 1, 0.82], c: P.light });
    b.add(K.ico(0.25, 1), { p: [0, 1.25, 0], s: [1, 1, 0.72], c: TUN, c2: K.mix(TUN, P.light, 0.4) });
    b.add(K.cyl(0.208, 0.208, 0.065, 8), { p: [0, 1.04, 0], s: [1, 1, 0.8], c: PAL.woodD });
    b.add(K.box(0.075, 0.075, 0.03), { p: [0, 1.04, -0.172], c: PAL.bronzeL, ch: 's' });
    b.add(K.box(0.09, 0.11, 0.065, 0.9, 0.9), { p: [-0.16, 0.97, -0.1], c: CUIR });
    b.add(K.box(0.055, 0.5, 0.02), { p: [0, 1.27, -0.176], r: [0, 0, 0.6], c: CUIR_D });
    // --- camail sur les épaules, épaulière de bronze (épaule gauche), agrafe
    b.add(K.cyl(0.15, 0.275, 0.14, 8), { p: [0, 1.47, 0], s: [1, 1, 0.8], c: P.dark, c2: TUN });
    b.add(K.dome(0.118, 6, 3), { p: [-0.3, 1.44, 0], s: [1, 0.8, 1.1], c: PAL.bronze, c2: PAL.bronzeL, ch: 's' });
    b.add(K.cyl(0.122, 0.127, 0.025, 6), { p: [-0.3, 1.44, 0], s: [1, 1, 1.1], c: PAL.goldD, ch: 's' });
    b.add(K.cone(0.03, 0.07, 4), { p: [-0.3, 1.55, 0], c: PAL.gold, ch: 's' });
    b.add(K.oct(0.035), { p: [0, 1.44, -0.205], s: [1, 1, 0.5], c: PAL.gold, ch: 's' });
    // --- tête : visage simple sous la capuche
    b.add(K.ico(0.15, 1), { p: [0, 1.66, -0.02], s: [0.95, 1.05, 1], c: PAL.skin });
    b.sym(sd => SH.eye(b, { p: [sd * 0.063, 1.675, -0.125], r: 0.055, rot: [0, PI - sd * 0.2, 0] }));
    b.add(K.cone(0.022, 0.05, 4), { p: [0, 1.62, -0.178], r: [-PI / 2, 0, 0], c: K.shade(PAL.skin, 0.86) });
    b.add(K.box(0.06, 0.012, 0.02), { p: [0, 1.575, -0.147], c: K.shade(PAL.skin, 0.55), jit: 0 });
    b.add(K.ico(0.19, 1), { p: [0, 1.69, 0.045], s: [1, 1.02, 1], c: P.dark, c2: TUN });
    b.add(K.cone(0.1, 0.24, 5), { p: [0, 1.62, 0.2], r: [2.1, 0, 0], c: P.dark });
    // --- cape dans le dos, ourlet en pointes
    b.group({ p: [0, 1.47, 0.15], r: [-0.1, 0, 0] }, b => {
      b.add(
        K.prism(
          [
            [-0.21, 0],
            [0.21, 0],
            [0.3, 0.85],
            [-0.3, 0.85]
          ],
          0.03
        ),
        { r: [PI / 2, 0, 0], c: TUN, jit: 0.06 }
      );
      b.add(
        K.prism(
          [
            [-0.3, 0.85],
            [0.3, 0.85],
            [0.31, 0.95],
            [0.2, 1.06],
            [0.1, 0.96],
            [0, 1.08],
            [-0.1, 0.96],
            [-0.2, 1.06],
            [-0.31, 0.95]
          ],
          0.03
        ),
        { r: [PI / 2, 0, 0], c: P.dark, jit: 0.06 }
      );
    });
    // --- bâton en travers du dos, le motif de l'élément à son sommet
    b.group({ p: [0, 1.12, 0.27], r: [0, 0, 0.38] }, b => {
      b.add(K.cyl(0.018, 0.022, 1.5, 5), { c: PAL.woodD, c2: PAL.wood });
      b.add(K.cyl(0.032, 0.026, 0.05, 6), { p: [0, 0.74, 0], c: PAL.bronze, ch: 's' });
      SH.motif(b, ctx.el, { p: [0, 0.765, 0], r: [0, 0, -0.38], s: 0.36 });
    });
    // --- bras (pièces animées) : manche de tunique, manche de cuir, bracelet de bronze, gant
    const bras2 = (a, sd) => {
      a.add(K.cyl(0.06, 0.072, 0.27, 6), { p: [sd * 0.3, 1.3, 0], c: P.dark, c2: TUN });
      a.add(K.cyl(0.05, 0.057, 0.25, 6), { p: [sd * 0.3, 1.06, 0], c: CUIR });
      a.add(K.cyl(0.059, 0.059, 0.045, 6), { p: [sd * 0.3, 0.96, 0], c: PAL.bronze, ch: 's' });
      a.add(K.ico(0.062, 0), { p: [sd * 0.3, 0.88, -0.01], s: [0.8, 1, 1], c: GANT });
    };
    bras2(aL, -1);
    bras2(aR, 1);
    // le pistolet à cristal dans la main droite
    aR.group({ p: [0.3, 0.9, -0.04], r: [-0.3, 0, 0] }, b => {
      b.add(K.box(0.03, 0.085, 0.036), { p: [0, -0.03, 0.012], r: [-0.35, 0, 0], c: PAL.woodD });
      b.add(K.box(0.04, 0.046, 0.075), { p: [0, 0.025, -0.03], c: PAL.ironL, ch: 's' });
      b.add(K.cyl(0.016, 0.019, 0.2, 6), { p: [0, 0.03, -0.165], r: [-PI / 2, 0, 0], c: PAL.bronze, c2: PAL.bronzeL, ch: 's' });
      b.add(K.cyl(0.025, 0.022, 0.022, 6), { p: [0, 0.03, -0.262], r: [-PI / 2, 0, 0], c: PAL.gold, ch: 's' });
      b.add(K.oct(0.03), { p: [0, 0.052, -0.04], s: [0.8, 0.8, 1.2], c: P.main, c2: P.glow, ch: 'g', jit: 0.12 });
    });
    return {
      parts: [
        { name: 'body', b },
        { name: 'armL', b: aL, parent: 'body', pivot: [-0.3, 1.42, 0], anim: [{ k: 'rot', axis: 'x', amp: 0.35, sp: 6 }] },
        { name: 'armR', b: aR, parent: 'body', pivot: [0.3, 1.42, 0], anim: [{ k: 'rot', axis: 'x', amp: 0.35, sp: 6, ph: PI }] }
      ],
      bake: { ground: 0.2, groundH: 0.6, map: { s: 'm' } },
      scale: 1,
      labelY: 2.15
    };
  };
  // ---------------------------------------------------------------- DERNIER TOIT V1.5 : vm.masse, la masse à deux mains (manche de bois, tête d'acier)
  // Même repère que le maillet : origine = la main droite, en haut du manche ; la tête est au-dessus, la main gauche tout en bas.
  MODELS['vm.masse'] = ctx => {
    const H = teinte(ctx),
      b = K.make(84),
      AC = 0x4b535b,
      ACL = 0x7d878f,
      FR = 0xb9c1c7,
      HY = 0.33;
    b.group({ r: BIAIS }, b => {
      // manche de bois (du talon à la tête), poignée gainée de caoutchouc noir, pommeau
      b.add(K.cyl(0.0165, 0.0195, 0.86, 8), { p: [0, -0.08, 0], c: PAL.woodD, c2: PAL.woodL });
      b.add(K.cyl(0.0215, 0.0215, 0.17, 8), { p: [0, -0.41, 0], c: 0x24272b, jit: 0.06 });
      for (const y of [-0.36, -0.41, -0.46]) b.add(K.cyl(0.0222, 0.0222, 0.006, 8), { p: [0, y, 0], c: 0x16181b, jit: 0 });
      b.add(K.cyl(0.025, 0.021, 0.025, 8), { p: [0, -0.505, 0], c: 0x16181b });
      b.add(K.box(0.004, 0.06, 0.012), { p: [0.0175, 0.1, 0], c: K.shade(PAL.wood, 0.6), jit: 0 });
      b.add(K.box(0.004, 0.04, 0.01), { p: [-0.017, 0.2, 0.004], c: K.shade(PAL.wood, 0.6), jit: 0 }); // rayures du manche
      // tête d'acier : bloc à huit pans, chanfreins, deux faces de frappe usées (claires), coin de serrage, éclats de plâtre collés
      b.group({ p: [0, HY, 0], r: [0, -0.585, 0] }, b => {
        b.add(K.cyl(0.05, 0.05, 0.19, 8, { a0: PI / 8 }), { r: [PI / 2, 0, 0], c: AC, c2: ACL, ch: 's' });
        for (const s of [-1, 1]) {
          b.add(K.cyl(0.045, 0.0515, 0.028, 8, { a0: PI / 8 }), { p: [0, 0, s * 0.109], r: [(s * PI) / 2, 0, 0], c: AC, ch: 's' });
          b.add(K.cyl(0.044, 0.044, 0.006, 8, { a0: PI / 8 }), { p: [0, 0, s * 0.124], r: [PI / 2, 0, 0], c: FR, ch: 's', jit: 0 });
        }
        b.add(K.cyl(0.0525, 0.0525, 0.012, 8, { a0: PI / 8 }), { p: [0, 0, 0.06], r: [PI / 2, 0, 0], c: 0x2e3338, ch: 's' });
        b.add(K.cyl(0.0525, 0.0525, 0.012, 8, { a0: PI / 8 }), { p: [0, 0, -0.06], r: [PI / 2, 0, 0], c: 0x2e3338, ch: 's' });
        b.add(K.box(0.026, 0.012, 0.04), { p: [0, 0.05, 0], c: 0x22262a, ch: 's' });
        for (const q of [
          [0.03, 0.02, 0.126],
          [-0.02, -0.015, 0.126],
          [0.01, -0.03, -0.126]
        ])
          b.add(K.oct(0.008), { p: q, s: [1, 1, 0.3], c: 0xe8e2d4, jit: 0.1 });
      });
      b.add(K.cyl(0.0225, 0.019, 0.03, 8), { p: [0, HY - 0.06, 0], c: 0x2e3338, ch: 's' }); // collerette sous la tête
      poing(b, 0.0185, H.glove, H.gloveD);
      bras(b, [0.018, -0.004, 0.08], [-0.47, -0.82, -0.33], [-1, 0.2, 0.3], 0.46, H); // avant-bras long : il sort de l'écran pendant le coup
      b.group({ p: [0, -0.42, 0], s: [-1, 1, 1] }, b => poing(b, 0.0215, H.glove, H.gloveD)); // main gauche (miroir), en bas du manche
    });
    return { parts: [{ name: 'body', b }], bake: { ground: 0, jit: 0.04 } };
  };
  // le leurre tenu en main, et la radio de la frappe aérienne
  MODELS['vm.leurre'] = () => {
    const b = K.make(82);
    b.add(K.box(0.12, 0.09, 0.09), { c: 0xd8c23a, c2: 0xe8d45a });
    b.add(K.cyl(0.03, 0.03, 0.01, 8), { p: [0, 0, -0.047], r: [PI / 2, 0, 0], c: 0x2e3236 });
    b.add(K.cyl(0.003, 0.003, 0.14, 4), { p: [0.04, 0.11, 0], c: 0x2e3236 });
    b.add(K.ico(0.014, 0), { p: [-0.03, 0.055, 0], c: 0xff3030, ch: 'g' });
    poing(b, 0.03);
    return { parts: [{ name: 'body', b }], bake: { ground: 0 } };
  };
  MODELS['vm.radio'] = () => {
    const b = K.make(83);
    b.add(K.box(0.06, 0.15, 0.035), { p: [0, 0.04, 0], c: 0x2e3236, c2: 0x3e4246, ch: 's' });
    b.add(K.cyl(0.006, 0.004, 0.12, 5), { p: [0.02, 0.17, 0], c: 0x1e2124 });
    b.add(K.box(0.04, 0.03, 0.004), { p: [0, 0.09, -0.019], c: 0x7adf8a, ch: 'g', jit: 0 });
    for (let k = 0; k < 3; k++) b.add(K.box(0.04, 0.004, 0.004), { p: [0, 0.03 - k * 0.012, -0.019], c: 0x1e2124, jit: 0 });
    poing(b, 0.028);
    return { parts: [{ name: 'body', b }], bake: { ground: 0 } };
  };
  // V4.7 (Dernier Toit) : le grappin tenu en main : corps et poignée de pistolet, tube de lancement, bobine jaune, crochet à trois griffes
  MODELS['vm.grappin'] = () => {
    const b = K.make(91);
    b.add(K.box(0.05, 0.06, 0.19), { p: [0, 0.06, -0.07], c: 0x3a3f45, c2: 0x4a5058, ch: 's' });
    b.add(K.box(0.034, 0.1, 0.045), { p: [0, 0, 0], r: [0.25, 0, 0], c: 0x2a2d31 });
    b.add(K.cyl(0.024, 0.024, 0.15, 8), { p: [0, 0.08, -0.22], r: [PI / 2, 0, 0], c: 0x6b7178, ch: 's' });
    b.add(K.cyl(0.028, 0.028, 0.035, 10), { p: [0, 0.075, -0.06], r: [0, 0, PI / 2], c: 0xffb020, ch: 'g', jit: 0 });
    b.add(K.cyl(0.007, 0.007, 0.05, 6), { p: [0, 0.08, -0.31], r: [PI / 2, 0, 0], c: 0xb8bec4 });
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.5;
      b.add(K.box(0.008, 0.008, 0.045), {
        p: [Math.cos(a) * 0.022, 0.08 + Math.sin(a) * 0.022, -0.345],
        r: [-Math.sin(a) * 0.7, Math.cos(a) * 0.7, 0],
        c: 0xd0d5da,
        ch: 's'
      });
    }
    poing(b, 0.028);
    return { parts: [{ name: 'body', b }], bake: { ground: 0 } };
  };
}
