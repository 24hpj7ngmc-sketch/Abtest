// ===================== DERNIER TOIT — les modèles du monde =====================
// Contenu : les zombies (8 tenues a–h × 6 poses : z.<tenue>.<pose>, poses w0 w1 w2 marche, c0 c1 escalade, lie à terre ; z.all = planche
// d'aperçu pour gfx/preview.js), l'immeuble (imm, volets), les cloisons cassables (cloison, trou, gravats, planche), la ville (ville),
// les barricades et les murs d'avenue (barricade, mur, nid), les quatre tourelles (tour.mg, tour.la, tour.mo, tour.fl), l'hélicoptère (heli),
// la tyrolienne et ses passerelles (tyro), la boutique (boutique), le leurre (leurre) et le missile (missile).
// Attend : le kit K (gfx/kit.js), l'objet MODELS (créé par build.py), et l'immeuble décrit par les règles (regles/) : B, H, NLV, LVY, BALD,
// BOX, FLOORS, OPEN, ROOMS, levelOf, les passerelles et tyroliennes (ZIPS, ZIPH, PASSD, PASSY, PASSW) et HELI. Les recettes ne sont
// appelées qu'au premier dessin (affichage/), quand tout est chargé : rien ici ne lit les règles au chargement.
// Fournit : MODELS[…] ci-dessus, utilisés par affichage/ (prepM, instM).
// Formes faites de graines K.make(n) et K.rng(n) : ne changer ni l'ordre des ajouts, ni les graines, ni les nombres (sinon la forme change).
// build.py retire les lignes de commentaire // de ce fichier avant de le coller dans la page.
//
// DERNIER TOIT — les modèles : zombies (plusieurs poses, pour l'affichage en masse), l'immeuble, la ville, les barricades,
// les murs d'avenue, les quatre tourelles, l'hélicoptère, le leurre et le missile. Repère : mètres, +Y en haut, les créatures regardent vers +Z.
{
  const { PAL } = K,
    PI = Math.PI;
  // ---------------------------------------------------------------- les zombies
  // quatre tenues : a = rôdeur (chemise bleu canard), b = rôdeur (chemise claire tachée), c = coureur (sweat rouge à capuche), d = colosse (bleu de travail, torse nu)
  const ZC = {
    a: { skin: 0x96a67e, skinD: 0x6c7c5a, shirt: 0x4f7f8e, shirtD: 0x33596a, pants: 0x4c3e31, shoe: 0x2a2420, hair: 0x2c241c },
    b: { skin: 0xa9ad8c, skinD: 0x7c8165, shirt: 0xc4bca6, shirtD: 0x8f8876, pants: 0x3d5679, shoe: 0x30302c, hair: 0x6a5236 },
    c: { skin: 0x8f9d7a, skinD: 0x66735a, shirt: 0xb0443a, shirtD: 0x77302a, pants: 0x2c2d32, shoe: 0xd9d5cc, hair: 0x1e1a16 },
    d: { skin: 0x86966f, skinD: 0x5e6b4f, shirt: 0xc77d31, shirtD: 0x8d5822, pants: 0xc77d31, shoe: 0x3a2c20, hair: 0x3a3530 },
    // V3.9 : quatre variantes, faites pour être reconnues de loin (vues d'en haut, depuis le toit, sur un téléphone) :
    // e = sprinteur (maigre, veste de sport jaune fluo à bandes réfléchissantes, baskets orange ; il court penché en balançant les bras)
    // f = casseur (carrure large, casque de chantier jaune, gilet orange haute visibilité, gros gants, pied-de-biche rouge à la main)
    // g = porteur (habits sombres, bonnet, gros sac d'argent vert sur le dos, billets qui dépassent, « $ » et pièces d'or lumineux)
    // h = hurleur (blouse d'hôpital pâle, peau livide, crâne chauve, bouche grande ouverte, bras écartés, tête renversée)
    e: { skin: 0x93a37c, skinD: 0x6a785a, shirt: 0xdcf524, shirtD: 0xa2bc12, pants: 0x24272d, shoe: 0xff6526, hair: 0x2a221a },
    f: {
      skin: 0x86966f,
      skinD: 0x5e6b4f,
      shirt: 0xff6a10,
      shirtD: 0xc04a06,
      pants: 0x2b3950,
      shoe: 0x6b4a2a,
      hair: 0x3a3530,
      sleeve: 0x56606c
    },
    g: { skin: 0x96a67e, skinD: 0x6c7c5a, shirt: 0x45404e, shirtD: 0x28262e, pants: 0x4c4036, shoe: 0x1e1c1a, hair: 0x16161a },
    h: { skin: 0xe8ecdc, skinD: 0xbcc3b2, shirt: 0xc8eee8, shirtD: 0x94bdb8, pants: 0xe8ecdc, shoe: 0x9aa194, hair: 0x3a3530 }
  };
  const BLOOD = 0x7a1616,
    BLOODD = 0x4a0c0c,
    EYE = 0xf2e47c,
    MOUTH = 0x2e0808;
  const REFL = 0xf4f8ee,
    HELM = 0xffd21c,
    GLOVE = 0x9c7a48,
    BAR = 0xc4221a,
    SACK = 0x5cb24a,
    SACKD = 0x2a6626,
    BILL = 0xd2f0b8,
    BILLD = 0x8cc47a,
    GOLD = 0xffc83a;
  // poses : jambes lL/lR (rotation de la cuisse autour de X, négatif = vers l'avant), genoux kL/kR, bras aL/aR, buste penché, tête
  const ZPOSE = {
    w0: { lL: -0.5, lR: 0.38, kL: 0.12, kR: 0.55, aL: -1.12, aR: -1.48, hu: 0.3, hd: 0.12 },
    w1: { lL: 0, lR: 0, kL: 0.18, kR: 0.18, aL: -1.3, aR: -1.32, hu: 0.32, hd: 0.18 },
    w2: { lL: 0.38, lR: -0.5, kL: 0.55, kR: 0.12, aL: -1.48, aR: -1.12, hu: 0.3, hd: 0.12 },
    c0: { lL: -1.15, lR: 0.15, kL: 1.7, kR: 0.35, aL: -2.95, aR: -2.2, hu: 0.06, hd: -0.25 },
    c1: { lL: 0.15, lR: -1.15, kL: 0.35, kR: 1.7, aL: -2.2, aR: -2.95, hu: 0.06, hd: -0.25 },
    lie: { lL: 0.12, lR: -0.18, kL: 0.15, kR: 0.1, aL: -2.75, aR: -2.55, hu: 0, hd: 0.7 }
  };
  // V3.9 : le sprinteur ne marche pas les bras tendus, il court : penché en avant, grande foulée, bras pliés qui balancent (y : hanches plus basses)
  const ZRUN = {
    w0: { lL: -0.9, lR: 0.62, kL: 0.35, kR: 1.15, aL: 0.75, aR: -1, hu: 0.55, hd: -0.35, y: 0.8 },
    w1: { lL: -0.15, lR: 0.05, kL: 1.25, kR: 0.3, aL: 0.1, aR: -0.25, hu: 0.55, hd: -0.35, y: 0.88 },
    w2: { lL: 0.62, lR: -0.9, kL: 1.15, kR: 0.35, aL: -1, aR: 0.75, hu: 0.55, hd: -0.35, y: 0.8 }
  };
  const ZK = 'abcdefgh';
  // une bande plate (deux faces : visible des deux côtés) dans le plan XY, posée en z : sert au « $ » du sac
  const zq = (b, x0, y0, x1, y1, z, c) =>
    b.add(
      K.face(
        [
          [x0, y0, z],
          [x1, y0, z],
          [x1, y1, z],
          [x0, y1, z]
        ],
        { dbl: true }
      ),
      { c, ch: 'g', jit: 0 }
    );
  const zombie = (kind, pose) => {
    const C = ZC[kind],
      run = kind === 'e' && ZRUN[pose],
      P = run || ZPOSE[pose],
      b = K.make(301 + ZK.indexOf(kind) * 13 + Object.keys(ZPOSE).indexOf(pose)),
      big = kind === 'd',
      thin = kind === 'c',
      spr = kind === 'e',
      cas = kind === 'f',
      por = kind === 'g',
      hur = kind === 'h',
      W = big ? 1.3 : thin ? 0.88 : spr ? 0.82 : cas ? 1.22 : hur ? 0.92 : 1,
      hipY = run ? run.y : 0.9,
      hd = P.hd + (hur && pose !== 'lie' ? -0.42 : 0),
      spread = hur ? 0.5 : 0.1,
      armK = hur ? 0.75 : 1;
    // --- jambes : cuisse, tibia (plié au genou), chaussure
    b.sym(s => {
      const l = s < 0 ? P.lL : P.lR,
        k = s < 0 ? P.kL : P.kR;
      b.group({ p: [s * 0.105 * W, hipY, 0], r: [l, 0, s * 0.04] }, b => {
        b.add(K.box(0.17 * W, 0.46, 0.19 * W, 0.9, 0.92), { p: [0, -0.23, 0], c: K.shade(C.pants, 0.9), c2: C.pants });
        b.group({ p: [0, -0.44, 0], r: [k, 0, 0] }, b => {
          b.add(K.box(0.14 * W, 0.44, 0.15 * W, 1.08, 1), { p: [0, -0.22, 0], c: K.shade(C.pants, 0.8), c2: C.pants });
          if (kind === 'b' && s > 0) b.add(K.box(0.15 * W, 0.12, 0.16 * W), { p: [0, -0.12, 0], c: C.skinD }); // jean déchiré au genou
          if (spr) {
            b.add(K.box(0.15, 0.1, 0.29, 1, 0.85), { p: [0, -0.45, 0.05], c: C.shoe });
            b.add(K.box(0.155, 0.035, 0.3), { p: [0, -0.5, 0.05], c: REFL });
          } // baskets orange, semelle blanche
          else b.add(K.box(0.13 * W, 0.09, 0.25 * W, 1, 0.85), { p: [0, -0.46, 0.045], c: C.shoe });
        });
      });
    });
    // le hurleur : le bas de sa blouse d'hôpital, sur les cuisses (jambes nues dessous)
    if (hur) b.add(K.box(0.44 * W, 0.4, 0.3 * W, 0.9, 0.92), { p: [0, hipY - 0.12, -0.01], c: C.shirtD, c2: C.shirt });
    // --- bassin, buste penché, tête, bras
    b.group({ p: [0, hipY, 0], r: [P.hu, 0, 0] }, b => {
      b.add(K.box(0.36 * W, 0.18, 0.22 * W), { p: [0, 0.06, 0], c: big ? C.pants : hur ? C.shirtD : PAL.black }); // ceinture
      if (big) {
        b.add(K.box(0.46 * W, 0.52, 0.27 * W, 1.1, 1.02), { p: [0, 0.38, 0], c: C.skinD, c2: C.skin }); // torse nu
        b.add(K.ico(0.25, 0), { p: [0, 0.27, 0.1], s: [1.25, 1, 1], c: C.skin }); // ventre
        b.add(K.box(0.46 * W, 0.3, 0.28 * W), { p: [0, 0.17, 0], c: K.shade(C.pants, 0.9), c2: C.pants }); // bavette du bleu de travail
        b.sym(s => b.add(K.box(0.06, 0.48, 0.02), { p: [s * 0.14, 0.42, 0.15], r: [0.12, 0, 0], c: C.pants })); // bretelles
        b.add(K.box(0.2, 0.14, 0.02), { p: [-0.08, 0.5, 0.16], c: BLOOD });
      } else {
        b.add(K.box(0.43 * W, 0.52, 0.25 * W, 1.1, 1.05), { p: [0, 0.38, 0], c: C.shirtD, c2: C.shirt });
        b.add(K.box(0.15, 0.12, 0.02), { p: [0.09, 0.44, 0.13 * W], r: [0, 0, 0.35], c: C.skinD }); // déchirure
        b.add(K.box(0.13, 0.2, 0.02), { p: [-0.1, 0.26, 0.13 * W], r: [0, 0, -0.2], c: BLOOD });
        b.add(K.box(0.09, 0.07, 0.02), { p: [-0.05, 0.13, 0.13 * W], c: BLOODD });
        if (thin) b.add(K.box(0.3, 0.22, 0.12), { p: [0, 0.6, -0.14], r: [-0.3, 0, 0], c: C.shirtD }); // capuche rabattue
        // bandes réfléchissantes (blanc franc) : une sur la veste du sprinteur, deux sur le gilet du casseur
        if (spr) b.add(K.box(0.46 * W + 0.014, 0.055, 0.26 * W + 0.014, 1.04, 1.02), { p: [0, 0.44, 0], c: REFL, jit: 0 });
        if (cas)
          for (const y of [0.25, 0.46])
            b.add(K.box(0.45 * W * (1 + (0.1 * (y - 0.12)) / 0.52) + 0.016, 0.05, 0.26 * W + 0.016), { p: [0, y, 0], c: REFL, jit: 0 });
        // le porteur : bretelles devant, gros sac de toile dans le dos (lien, billets qui dépassent, pièces, « $ » doré)
        if (por) {
          b.sym(s => b.add(K.box(0.06, 0.46, 0.03), { p: [s * 0.12, 0.4, 0.135], r: [0.06, 0, 0], c: 0x3a2a1c }));
          b.group({ p: [0, 0.42, -0.43], r: [-0.16, 0, 0], s: 1.18 }, b => {
            b.add(
              K.lathe(
                [
                  [0, -0.3],
                  [0.26, -0.21],
                  [0.3, 0.0],
                  [0.22, 0.22],
                  [0.07, 0.3],
                  [0.12, 0.37]
                ],
                6,
                { capT: true }
              ),
              { c: SACKD, c2: SACK }
            );
            b.add(K.cyl(0.085, 0.085, 0.05, 6), { p: [0, 0.3, 0], c: 0x5a3e22 });
            for (const q of [
              [-0.05, 0.43, 0.03, -0.4],
              [0.05, 0.45, -0.02, 0.3],
              [0, 0.46, 0.05, 0.05]
            ])
              b.add(
                K.face(
                  [
                    [-0.075, -0.1, 0],
                    [0.075, -0.1, 0],
                    [0.075, 0.1, 0],
                    [-0.075, 0.1, 0]
                  ],
                  { dbl: true }
                ),
                { p: [q[0], q[1], q[2]], r: [-0.25, q[3] * 2, q[3]], c: BILLD, c2: BILL, jit: 0 }
              ); // billets qui dépassent
            b.add(K.oct(0.05), { p: [0.08, 0.4, 0.03], c: GOLD, ch: 'g', jit: 0 });
            b.add(K.oct(0.045), { p: [-0.07, 0.39, -0.04], c: GOLD, ch: 'g', jit: 0 });
            // « $ » vu de derrière (x inversé) : barre du haut, demi-montant, barre du milieu, demi-montant, barre du bas, trait vertical
            const z = -0.312,
              X = u => -u * 1.25,
              Y = v => v * 1.2;
            zq(b, X(-0.075), Y(0.075), X(0.075), Y(0.11), z, GOLD);
            zq(b, X(-0.075), 0, X(-0.04), Y(0.11), z, GOLD);
            zq(b, X(-0.075), Y(-0.018), X(0.075), Y(0.018), z, GOLD);
            zq(b, X(0.04), Y(-0.11), X(0.075), 0, z, GOLD);
            zq(b, X(-0.075), Y(-0.11), X(0.075), Y(-0.075), z, GOLD);
            zq(b, X(-0.013), -0.17, X(0.013), 0.17, z - 0.003, GOLD);
          });
        }
      }
      // tête : cou, crâne, cheveux, mâchoire pendante, yeux pâles
      b.group({ p: [0, 0.66, 0], r: [hd, 0, kind === 'a' ? 0.2 : kind === 'b' ? -0.14 : hur ? 0.22 : 0.06] }, b => {
        b.add(K.box(0.11 * W, 0.12, 0.11 * W), { p: [0, 0.03, 0], c: C.skinD });
        b.add(K.box(0.22, 0.25, 0.24, 0.88, 0.95), { p: [0, 0.2, 0.02], c: C.skinD, c2: C.skin });
        if (cas) {
          b.add(K.dome(0.16, 8, 3), { p: [0, 0.29, 0.0], s: [1, 0.95, 1.12], c: K.shade(HELM, 0.85), c2: HELM }); // casque de chantier jaune
          b.add(K.cyl(0.19, 0.2, 0.03, 8), { p: [0, 0.29, 0.02], s: [1, 1, 1.12], c: K.shade(HELM, 0.8) });
          b.add(K.box(0.04, 0.035, 0.34), { p: [0, 0.44, 0], c: HELM });
        } else if (por)
          b.add(K.box(0.25, 0.13, 0.27, 0.9, 0.88), { p: [0, 0.33, -0.01], c: C.hair }); // bonnet
        else if (!big && !hur) b.add(K.box(0.235, 0.07, 0.255, 0.92, 0.9), { p: [0, 0.32, -0.01], c: C.hair });
        if (hur) {
          b.add(K.box(0.17, 0.07, 0.08), { p: [0, 0.03, 0.09], r: [1, 0, 0], c: C.skinD });
          b.add(K.box(0.14, 0.13, 0.03), { p: [0, 0.1, 0.13], c: MOUTH, jit: 0 });
        } // bouche grande ouverte
        else {
          b.add(K.box(0.17, 0.06, 0.08), { p: [0, 0.075, 0.1], r: [0.45, 0, 0], c: C.skinD }); // mâchoire
          b.add(K.box(0.13, 0.06, 0.03), { p: [0, 0.12, 0.135], c: MOUTH, jit: 0 });
        }
        b.sym(e => b.add(K.box(0.05, 0.04, 0.02), { p: [e * 0.055, 0.22, 0.142], c: EYE, jit: 0 }));
        b.add(K.box(0.08, 0.06, 0.02), { p: [0.06, 0.29, 0.13], c: BLOOD });
      });
      // bras tendus vers l'avant (ou levés pour grimper) ; le sprinteur plie les coudes, le hurleur les écarte
      b.sym(s => {
        const a = (s < 0 ? P.aL : P.aR) * armK;
        b.group({ p: [s * 0.27 * W, 0.56, 0], r: [a, 0, s * spread] }, b => {
          b.add(K.box(0.12 * W, 0.3, 0.13 * W, 0.95, 1), { p: [0, -0.14, 0], c: big ? C.skin : cas ? C.sleeve : C.shirt });
          const fore = b => {
            if (spr) {
              b.add(K.box(0.095 * W, 0.3, 0.1 * W, 0.85, 1), { p: [0, -0.43, 0], c: C.shirtD, c2: C.shirt });
              b.add(K.box(0.1 * W + 0.014, 0.045, 0.105 * W + 0.014), { p: [0, -0.38, 0], c: REFL, jit: 0 });
              b.add(K.box(0.1 * W, 0.11, 0.08 * W), { p: [0, -0.63, 0.01], c: C.skin });
              return;
            } // manche de la veste, bande, poing
            b.add(K.box(0.095 * W, 0.3, 0.1 * W, 0.85, 1), { p: [0, -0.43, 0], c: C.skinD, c2: C.skin });
            if (cas) {
              b.add(K.box(0.15, 0.19, 0.14, 0.9, 1), { p: [0, -0.65, 0.01], c: K.shade(GLOVE, 0.8), c2: GLOVE }); // gros gant
              if (s < 0) {
                b.add(K.box(0.05, 0.05, 0.86), { p: [0, -0.66, 0.2], c: BAR });
                b.add(K.box(0.05, 0.16, 0.05), { p: [0, -0.6, 0.62], r: [-0.5, 0, 0], c: BAR });
              }
              return;
            } // pied-de-biche
            if (por) {
              b.add(K.box(0.1 * W, 0.11, 0.08 * W), { p: [0, -0.63, 0.01], c: C.skin });
              return;
            }
            b.add(K.box(0.1 * W, 0.11, 0.06 * W), { p: [0, -0.63, 0.012], c: C.skin });
            if (hur && s > 0) b.add(K.box(0.1 * W + 0.012, 0.035, 0.105 * W + 0.012), { p: [0, -0.53, 0], c: 0xf2f2ea, jit: 0 }); // bracelet d'hôpital
            for (const q of [-0.03, 0, 0.03])
              b.add(K.box(0.018, 0.07, 0.018), { p: [q * W, -0.71, 0.02], r: [0.3, 0, 0], c: C.skinD, jit: 0 });
          };
          if (run) b.group({ p: [0, -0.28, 0], r: [-1.35, 0, 0] }, b => b.group({ p: [0, 0.28, 0] }, fore));
          else fore(b);
        });
      });
    });
    return b;
  };
  for (const k of ZK) for (const p in ZPOSE) MODELS['z.' + k + '.' + p] = () => zombie(k, p);
  MODELS['z.all'] = () => {
    const b = K.make(399);
    let x = 0;
    for (const k of ZK) {
      let z = 0;
      for (const p in ZPOSE) {
        b.use(zombie(k, p), { p: [x, 0, z] });
        z += 1.2;
      }
      x += 1.3;
    }
    return b;
  };

  // ---------------------------------------------------------------- l'immeuble (dessiné d'après regles/immeuble.js : 26 × 26 m, toit à 19,4 m depuis V1.6) : vu de près, le joueur est dessus
  const PL = 0xcdb592,
    PLD = 0xa58f6c,
    BASE = 0x7a6f63,
    LEDGE = 0xe2d7bf,
    GLASS = 0x27333d,
    FRAME = 0x5c5149,
    ROOF = 0x8b877e;
  const fp = (f, u, d) => {
    const n = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0]
    ][f];
    return [n[0] * (9 + d) - n[1] * u, n[1] * (9 + d) + n[0] * u];
  };
  const fr = f => [0, -PI / 2, PI, PI / 2][f]; // rotation qui tourne une pièce « face à +Z » vers l'extérieur de la façade f… (+Z vers −Z pour le nord)
  // L'immeuble est dessiné à partir de sa description (immeuble.js : BOX, FLOORS, OPEN, ROOMS) : ce qu'on voit est exactement ce qui arrête le joueur et les balles.
  const INTC = [0xd8cfbd, 0xc9d6c4, 0xc8d2dc, 0xe0d0c0, 0xd6cbd8, 0xd0d8c8],
    PARQ = [0x9a6b44, 0xa77c52, 0x8e7a66, 0xb08a5c, 0x7f6650, 0x9c8a72];
  const boxOf = (b, o, c, c2, ch, shrink) => {
    const s = shrink || 0;
    b.add(K.box(o.x1 - o.x0 - s, o.y1 - o.y0, o.z1 - o.z0 - s), {
      p: [(o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2, (o.z0 + o.z1) / 2],
      c,
      c2,
      ch: ch || 'm',
      jit: 0.03
    });
  };
  const meuble = (b, o) => {
    const cx = (o.x0 + o.x1) / 2,
      cz = (o.z0 + o.z1) / 2,
      y = o.y0,
      w = o.x1 - o.x0,
      d = o.z1 - o.z0,
      ry = w >= d ? 0 : PI / 2,
      L = Math.max(w, d),
      P = Math.min(w, d);
    b.group({ p: [cx, y, cz], r: [0, ry, 0] }, b => {
      const t = o.t;
      if (t === 'lit') {
        b.add(K.box(L, 0.32, P), { p: [0, 0.16, 0], c: 0x6b4a30 });
        b.add(K.box(L - 0.1, 0.16, P - 0.08), { p: [0, 0.4, 0], c: 0xe8e2d6 });
        b.add(K.box(L * 0.5, 0.08, P - 0.06), { p: [L * 0.2, 0.5, 0], c: 0x5a6f9a });
        b.add(K.box(0.35, 0.1, P * 0.6), { p: [-L / 2 + 0.25, 0.52, 0], c: 0xf4f0e8 });
        b.add(K.box(0.08, 0.9, P), { p: [-L / 2 + 0.04, 0.45, 0], c: 0x5a3e28 });
        b.add(K.box(0.5, 0.02, 0.4), { p: [L * 0.1, 0.49, 0.1], r: [0, 0.3, 0], c: 0x6e1414, jit: 0 });
      } else if (t === 'armoire') {
        b.add(K.box(L, 2, P), { p: [0, 1, 0], c: 0x7a5536, c2: 0x8f6640 });
        b.add(K.box(0.02, 1.8, P + 0.01), { p: [0, 1, 0], c: 0x4a3220 });
        for (const s of [-1, 1]) b.add(K.box(0.04, 0.12, 0.03), { p: [s * 0.08, 1.05, P / 2 + 0.01], c: 0xc9b07a, ch: 's' });
      } else if (t === 'canape') {
        b.add(K.box(L, 0.42, P), { p: [0, 0.21, 0], c: 0x5a4a6a });
        b.add(K.box(L, 0.5, 0.2), { p: [0, 0.55, -P / 2 + 0.1], c: 0x4e4060 });
        for (const s of [-1, 1]) b.add(K.box(0.18, 0.62, P), { p: [s * (L / 2 - 0.09), 0.31, 0], c: 0x4e4060 });
        b.add(K.box(0.5, 0.12, 0.4), { p: [-0.3, 0.48, 0.05], r: [0, 0.4, 0], c: 0xc9a24a });
      } else if (t === 'table_basse') {
        b.add(K.box(L, 0.06, P), { p: [0, 0.42, 0], c: 0x6b4a30 });
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) b.add(K.box(0.05, 0.4, 0.05), { p: [sx * (L / 2 - 0.06), 0.2, sz * (P / 2 - 0.06)], c: 0x4a3220 });
      } else if (t === 'meuble_tv') {
        b.add(K.box(L, 0.5, P), { p: [0, 0.25, 0], c: 0x3a2c22 });
        b.add(K.box(L * 0.85, 0.55, 0.06), { p: [0, 0.8, 0], c: 0x14181c, ch: 's' });
        b.add(K.box(L * 0.7, 0.42, 0.02), { p: [0, 0.8, 0.035], c: 0x1e2a33, jit: 0 });
      } else if (t === 'cuisine') {
        b.add(K.box(L, 0.86, P), { p: [0, 0.43, 0], c: 0xd8d2c6 });
        b.add(K.box(L + 0.02, 0.05, P + 0.02), { p: [0, 0.89, 0], c: 0x5a5550 });
        for (let k = -1; k <= 1; k++) b.add(K.box(0.02, 0.7, 0.02), { p: [(k * L) / 3, 0.45, P / 2 + 0.01], c: 0x8a8f94, ch: 's' });
        b.add(K.cyl(0.12, 0.12, 0.04, 8), { p: [-L / 4, 0.93, 0], c: 0x2a2c30 });
        b.add(K.box(0.25, 0.15, 0.2), { p: [L / 4, 0.98, 0], c: 0xb0b4b8, ch: 's' });
      } else if (t === 'table') {
        b.add(K.box(L, 0.05, P), { p: [0, 0.73, 0], c: 0x8f6640 });
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) b.add(K.box(0.05, 0.72, 0.05), { p: [sx * (L / 2 - 0.07), 0.36, sz * (P / 2 - 0.07)], c: 0x5a3e28 });
        for (const sx of [-1, 1]) {
          b.add(K.box(0.4, 0.05, 0.4), { p: [sx * (L / 2 + 0.1), 0.45, 0.3], r: [0, 0, sx * 0.9], c: 0x6b4a30 });
        }
        b.add(K.cyl(0.05, 0.05, 0.12, 6), { p: [0.2, 0.82, 0], c: 0xd8d8d0 });
      } else if (t === 'bureau') {
        b.add(K.box(L, 0.04, P), { p: [0, 0.74, 0], c: 0xd8d2c4 });
        for (const sx of [-1, 1]) b.add(K.box(0.05, 0.72, P - 0.1), { p: [sx * (L / 2 - 0.05), 0.36, 0], c: 0x6c7278, ch: 's' });
        b.add(K.box(0.55, 0.34, 0.04), { p: [0, 1.0, -P / 2 + 0.18], c: 0x1e2328, ch: 's' });
        b.add(K.box(0.5, 0.29, 0.01), { p: [0, 1.0, -P / 2 + 0.205], c: 0x3a5a78, ch: 'g', jit: 0 });
        b.add(K.box(0.4, 0.02, 0.14), { p: [0, 0.77, 0.05], c: 0x2a2c30 });
        b.add(K.box(0.46, 0.08, 0.46), { p: [0, 0.47, P / 2 + 0.1], c: 0x2e3238 });
        b.add(K.box(0.46, 0.5, 0.06), { p: [0, 0.75, P / 2 + 0.32], c: 0x2e3238 });
        b.add(K.cyl(0.03, 0.03, 0.42, 5), { p: [0, 0.22, P / 2 + 0.1], c: 0x6c7278, ch: 's' });
      } else if (t === 'plante') {
        b.add(K.cyl(0.22, 0.17, 0.42, 8), { p: [0, 0.21, 0], c: 0xb06a44, c2: 0xc27a50 });
        b.add(K.sph(0.36, 7, 5), { p: [0, 0.78, 0], s: [1, 1.25, 1], c: 0x3f7a3a, c2: 0x5a9a4a });
        b.add(K.sph(0.24, 6, 4), { p: [0.14, 1.08, -0.05], c: 0x4a8a40 });
      } else if (t === 'etagere') {
        b.add(K.box(L, o.y1 - o.y0, P), { p: [0, (o.y1 - o.y0) / 2, 0], c: 0x7a5536, c2: 0x8f6640 });
        for (let k = 1; k < 5; k++)
          for (let q = 0; q < Math.floor(L / 0.18); q++)
            b.add(K.box(0.07 + ((q * 37) % 5) * 0.01, 0.26, P * 0.7), {
              p: [-L / 2 + 0.12 + q * 0.17, k * 0.38 - 0.05, 0.02],
              c: [0x8a3a2a, 0x3a5a7a, 0x6a6a3a, 0xc9a24a, 0x4a3a5a][(q * 7 + k) % 5],
              jit: 0
            });
      } else if (t === 'banc') {
        b.add(K.box(L, 0.08, P), { p: [0, 0.44, 0], c: 0x8f6640 });
        for (const sx of [-1, 1]) b.add(K.box(0.06, 0.42, P - 0.06), { p: [sx * (L / 2 - 0.1), 0.21, 0], c: 0x3a3f45, ch: 's' });
      } else if (t === 'frigo') {
        b.add(K.box(L, 1.8, P), { p: [0, 0.9, 0], c: 0xe6e6e2, c2: 0xf2f2ee, ch: 's' });
        b.add(K.box(L + 0.01, 0.02, P + 0.01), { p: [0, 1.2, 0], c: 0x9a9a96 });
        b.add(K.box(0.03, 0.4, 0.04), { p: [L / 2 - 0.08, 1.45, P / 2 + 0.02], c: 0x8a8f94, ch: 's' });
      }
    });
  };
  MODELS['imm'] = () => {
    const b = K.make(101),
      R = K.rng(11);
    // les boîtes de la description, chacune avec sa matière
    for (const o of BOX) {
      const t = o.t,
        lv = Math.max(0, levelOf(o.y0 + 0.05));
      if (t === 'bar' || t === 'tank' || t === 'ac' || t === 'shop' || t === 'pass' || o.destr) continue; // V1.5 : les cloisons cassables (o.destr) sont dessinées à part (MODELS.cloison, affichage/cloisons.js)
      if (t === 'ext') boxOf(b, o, PLD, PL);
      else if (t === 'ext0') boxOf(b, o, K.shade(BASE, 0.85), BASE);
      else if (t === 'dalle') boxOf(b, o, 0xd9d4c8, 0xd9d4c8);
      else if (t === 'toit') boxOf(b, o, 0xb8b2a6, ROOF);
      else if (t === 'parapet') boxOf(b, o, PLD, PL);
      else if (t === 'cage' || t === 'cloison') boxOf(b, o, 0x9c978e, 0xb0aba2);
      else if (t === 'int') boxOf(b, o, K.shade(INTC[lv % 6], 0.92), INTC[lv % 6]);
      else if (t === 'hut') boxOf(b, o, PLD, PL);
      else if (t === 'hutroof') boxOf(b, o, LEDGE, LEDGE);
      else if (t === 'rail') boxOf(b, o, 0x3a3f45, 0x3a3f45, 's');
      else if (t === 'placard') boxOf(b, o, 0x6b4a30, 0x7a5536);
      else if (t === 'pilier') boxOf(b, o, 0xa8a39a, 0xbab5ac);
      else if (t === 'comptoir') {
        boxOf(b, o, 0x7a5536, 0x8f6640);
        b.add(K.box(o.x1 - o.x0 + 0.04, 0.05, o.z1 - o.z0 + 0.04), { p: [(o.x0 + o.x1) / 2, o.y1 + 0.02, (o.z0 + o.z1) / 2], c: 0x3a3530 });
      } else if (t === 'rayon') {
        boxOf(b, o, 0x6c7278, 0x7a8288, 's');
        for (let k = 1; k < 4; k++)
          for (let q = 0; q < 5; q++)
            b.add(K.box(0.18, 0.22, 0.14), {
              p: [(o.x0 + o.x1) / 2 + (R() - 0.5) * 0.3, o.y0 + k * 0.48 + 0.12, o.z0 + 0.2 + q * 0.38],
              c: [0xc9a24a, 0xb0443a, 0x3d6aa0, 0x6a9a4a][Math.floor(R() * 4)]
            });
      } else meuble(b, o);
    }
    // sols : parquet (ou carrelage) sur chaque dalle d'étage, carrelage au rez-de-chaussée
    for (const f of FLOORS) {
      if (f.ramp || f.bal !== undefined || f.st) continue;
      const x0 = Math.max(f.x0, -B + 0.3),
        x1 = Math.min(f.x1, B - 0.3),
        z0 = Math.max(f.z0, -B + 0.3),
        z1 = Math.min(f.z1, B - 0.3);
      if (x1 <= x0 || z1 <= z0) continue;
      const c = f.lv === 0 ? 0x8a857c : f.lv === NLV ? ROOF : PARQ[f.lv % 6];
      b.add(K.box(x1 - x0, 0.02, z1 - z0), { p: [(x0 + x1) / 2, f.y + 0.012, (z0 + z1) / 2], c, jit: 0.02 });
    }
    // l'escalier : marches, paliers, main courante
    for (let k = 0; k < NLV; k++) {
      const L = LVY(k),
        h = LVY(k + 1) - L,
        m = L + h / 2,
        n = 10;
      for (let i = 0; i < n; i++) {
        const za = -1.5 + (i * 3) / n;
        b.add(K.box(1.86, h / 2 / n + 0.1, 3 / n), {
          p: [-1, L + ((i + 1) * h) / 2 / n - (h / 2 / n + 0.1) / 2, za + 1.5 / n],
          c: 0x8f8a82,
          c2: 0xa8a39a
        });
        b.add(K.box(1.86, h / 2 / n + 0.1, 3 / n), {
          p: [1, m + ((i + 1) * h) / 2 / n - (h / 2 / n + 0.1) / 2, 1.5 - (i * 3) / n - 1.5 / n],
          c: 0x8f8a82,
          c2: 0xa8a39a
        });
      }
      b.add(K.box(3.9, 0.2, 1), { p: [0, m - 0.1, 2], c: 0x8f8a82, c2: 0xa8a39a });
      for (const sx of [-1, 1])
        b.add(K.box(0.05, 0.05, 3.1), {
          p: [sx * 1.93, (sx < 0 ? L + h / 4 : m + h / 4) + 0.95, 0],
          r: [sx < 0 ? -Math.atan2(h / 2, 3) : Math.atan2(h / 2, 3), 0, 0],
          c: 0x3a3f45,
          ch: 's'
        });
    }
    // façades : bandeaux entre les étages, pilastres d'angle, descentes d'eau, cadres et appuis des fenêtres, enseignes
    for (let k = 1; k <= NLV; k++)
      for (let f = 0; f < 4; f++)
        b.group({ r: [0, fr(f), 0] }, b => b.add(K.box(2 * B + 0.5, 0.2, 0.22), { p: [0, LVY(k) - 0.12, -B - 0.08], c: LEDGE }));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        b.add(K.box(0.55, H, 0.55), { p: [sx * (B - 0.05), H / 2, sz * (B - 0.05)], c: K.shade(PL, 0.92), c2: PL });
        b.add(K.cyl(0.07, 0.07, H + 0.3, 6), { p: [sx * (B + 0.14), H / 2, sz * (B - 0.6)], c: 0x7d8288, ch: 's' });
      }
    for (const o of OPEN) {
      const u = o.u,
        w = o.u1 - o.u0,
        hh = o.y1 - o.y0,
        yc = (o.y0 + o.y1) / 2;
      b.group({ r: [0, fr(o.f), 0] }, b => {
        // repère « façade nord » tourné : u = x, extérieur = −z
        if (o.k === 'fen') {
          b.add(K.box(w + 0.2, 0.12, 0.32), { p: [u, o.y0 - 0.04, -B - 0.12], c: LEDGE });
          b.add(K.box(w + 0.12, 0.1, 0.08), { p: [u, o.y1 + 0.03, -B - 0.04], c: FRAME });
          for (const s of [-1, 1]) b.add(K.box(0.07, hh, 0.08), { p: [u + s * (w / 2 + 0.02), yc, -B - 0.04], c: FRAME });
          b.add(K.box(0.05, hh, 0.05), { p: [u, yc, -B + 0.05], c: FRAME });
          if (R() < 0.45)
            for (const s of [-1, 1])
              b.add(K.box(0.4, hh, 0.05), {
                p: [u + s * (w / 2 + 0.24), yc, -B - 0.07],
                r: [0, s * 0.5, 0],
                c: R() < 0.5 ? 0x4f6a5a : 0x6b5040
              });
        } else if (o.k === 'porte') {
          b.add(K.box(w + 0.14, 0.1, 0.08), { p: [u, o.y1 + 0.03, -B - 0.04], c: FRAME });
          for (const s of [-1, 1]) b.add(K.box(0.07, hh, 0.08), { p: [u + s * (w / 2 + 0.02), yc, -B - 0.04], c: FRAME });
        } else if (o.k === 'vol')
          b.add(K.box(w + 0.3, 0.55, 0.16), {
            p: [u, o.y1 + 0.32, -B - 0.06],
            c: [0x9a2f2a, 0x2f6a52, 0x2d4f7a, 0xb07a2a][(o.f + Math.round(u) + 9) % 4]
          });
      });
    }
    // balcons (V1.7) : un caillebotis métallique qui fait le tour (on voit et on tire au travers depuis le toit), poutres, consoles, garde-corps continu
    const MET = 0x5c6268,
      MET2 = 0x70767c,
      RAIL = 0x3a3f45;
    for (const f of FLOORS) {
      if (f.bal === undefined) continue;
      const y = f.y,
        E2 = B + BALD,
        L2 = 2 * E2;
      b.group({ r: [0, fr(f.bal), 0] }, b => {
        // repère « façade nord » : u = x, extérieur = −z
        for (let d = 0.13; d < BALD - 0.05; d += 0.26)
          b.add(K.box(L2, 0.04, 0.06), { p: [0, y - 0.03, -B - d], c: MET2, c2: MET, ch: 's', jit: 0 }); // lames du caillebotis
        for (const d of [0.06, BALD - 0.06]) b.add(K.box(L2, 0.16, 0.1), { p: [0, y - 0.1, -B - d], c: MET, ch: 's', jit: 0 }); // longerons
        for (let u = -E2 + 0.6; u < E2; u += 2.6) {
          b.add(K.box(0.1, 0.14, BALD), { p: [u, y - 0.12, -B - BALD / 2], c: MET, ch: 's', jit: 0 }); // traverses et consoles
          b.add(K.box(0.08, 0.08, 1.2), { p: [u, y - 0.55, -B - 0.55], r: [-0.62, 0, 0], c: RAIL, ch: 's', jit: 0 });
        }
        const zo = -B - BALD + 0.05;
        b.add(K.box(L2, 0.06, 0.06), { p: [0, y + 1.05, zo], c: RAIL, ch: 's' });
        b.add(K.box(L2, 0.04, 0.04), { p: [0, y + 0.55, zo], c: RAIL, ch: 's', jit: 0 });
        for (let u = -E2 + 0.05; u <= E2; u += 1.3) b.add(K.box(0.05, 1.05, 0.05), { p: [u, y + 0.52, zo], c: RAIL, ch: 's', jit: 0 });
      });
    }
    // dans les pièces : tapis, lampes, tableaux, traces de sang
    for (const r of ROOMS) {
      const y = LVY(r.lv),
        cx = (r.x0 + r.x1) / 2,
        cz = (r.z0 + r.z1) / 2;
      b.add(K.box(Math.min(2.4, r.x1 - r.x0 - 1.5), 0.012, Math.min(1.6, r.z1 - r.z0 - 1.5)), {
        p: [cx, y + 0.03, cz],
        c: [0x8a3a2a, 0x3a5a7a, 0x6a6a3a][r.lv % 3],
        jit: 0
      });
      if (R() < 0.6)
        b.add(K.box(0.9 + R(), 0.01, 0.5 + R() * 0.6), {
          p: [cx + (R() - 0.5) * 2, y + 0.04, cz + (R() - 0.5) * 2],
          r: [0, R() * 3, 0],
          c: 0x5a0c0c,
          jit: 0
        });
      b.add(K.cyl(0.2, 0.12, 0.18, 8), { p: [cx, LVY(r.lv + 1) - 0.34, cz], c: 0xf2ead0, ch: 'g' });
    }
    for (let k = 1; k < NLV; k++) {
      const y = LVY(k);
      b.add(K.box(1.4, 0.01, 0.5), { p: [(R() - 0.5) * 8, y + 0.04, -4 + (R() - 0.5)], r: [0, R() * 3, 0], c: 0x5a0c0c, jit: 0 });
      for (const q of [
        [0, -4],
        [0, 4.6],
        [-4.3, 0.5],
        [4.3, 0.5]
      ])
        b.add(K.box(0.5, 0.06, 0.5), { p: [q[0], LVY(k + 1) - 0.3, q[1]], c: 0xfff0c0, ch: 'g' });
    }
    // toit : château d'eau sur pieds, climatiseurs, antenne et parabole, aire de l'hélicoptère
    for (const o of BOX) {
      if (o.t === 'tank') {
        const x = (o.x0 + o.x1) / 2,
          z = (o.z0 + o.z1) / 2;
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) b.add(K.box(0.14, 2.3, 0.14), { p: [x + sx * 0.75, H + 1.15, z + sz * 0.75], c: 0x4a4f55, ch: 's' });
        b.add(K.cyl(1, 1, 1.8, 10), { p: [x, H + 3.2, z], c: 0x8a6a4a, c2: 0xa07c58 });
        b.add(K.cone(1.1, 0.6, 10), { p: [x, H + 4.4, z], c: 0x6b5038 });
        for (const y of [H + 2.6, H + 3.8]) b.add(K.cyl(1.04, 1.04, 0.08, 10), { p: [x, y, z], c: 0x3a3f45, ch: 's' });
      }
      if (o.t === 'ac') {
        const x = (o.x0 + o.x1) / 2,
          z = (o.z0 + o.z1) / 2;
        b.add(K.box(o.x1 - o.x0, 1, o.z1 - o.z0), { p: [x, H + 0.5, z], c: 0xb9bcbd, c2: 0xd6d8d8 });
        b.add(K.cyl(0.33, 0.33, 0.04, 10), { p: [x, H + 1.02, z], c: 0x3a3f45 });
      }
    }
    b.add(K.cyl(0.05, 0.07, 4.5, 5), { p: [-1.8, H + 2.9 + 2.25, 2.2], c: 0x6c7278, ch: 's' });
    b.add(K.dome(0.55, 8, 3), { p: [1.2, H + 2.95, 1.4], r: [-1.1, 0.6, 0], c: 0xd8d8d2 });
    b.add(K.box(0.3, 0.16, 0.16), { p: [1, H + 2.35, -2.85], c: 0xfff0c0, ch: 'g' });
    b.add(K.torus(2.7, 0.11, 4, 24), { p: [HELI[0], H + 0.05, HELI[1]], r: [PI / 2, 0, 0], c: 0xe8c547, jit: 0 });
    for (const s of [-1, 1]) b.add(K.box(0.3, 0.03, 2.2), { p: [HELI[0] + s * 0.75, H + 0.05, HELI[1]], c: 0xe8c547, jit: 0 });
    b.add(K.box(1.5, 0.03, 0.3), { p: [HELI[0], H + 0.05, HELI[1]], c: 0xe8c547, jit: 0 });
    return b;
  };
  // les rideaux de fer du rez-de-chaussée : baissés (mode « ils arrivent ») ou relevés (mode « ils s'échappent »)
  MODELS['volets'] = ctx => {
    const b = K.make(111),
      open = ctx.open === '1' || ctx.open === true;
    for (const o of OPEN) {
      if (o.k !== 'vol') continue;
      const w = o.u1 - o.u0;
      b.group({ r: [0, fr(o.f), 0] }, b => {
        if (open) {
          b.add(K.box(w, 0.42, 0.4), { p: [o.u, o.y1 - 0.15, -B + 0.05], c: 0x5d646b, c2: 0x7a8288, ch: 's' });
        } else {
          b.add(K.box(w, o.y1 - o.y0, 0.1), { p: [o.u, (o.y0 + o.y1) / 2, -B + 0.05], c: 0x5d646b, c2: 0x7a8288, ch: 's' });
          for (let k = 0; k < 6; k++) b.add(K.box(w, 0.04, 0.04), { p: [o.u, o.y0 + 0.4 + k * 0.4, -B - 0.02], c: 0x464c52, jit: 0 });
        }
      });
    }
    return b;
  };
  // ---------------------------------------------------------------- V1.5 : cloisons cassables, trous, gravats, planches (dessinés en masse par affichage/cloisons.js)
  // une cloison = une boîte unité (x le long du mur, y en hauteur, z l'épaisseur), étirée à la taille de chaque panneau. ctx.lv : teinte de l'étage ; ctx.bad : abîmée
  const PLATRE = 0xeee9df,
    FISS = 0x3a332c;
  // petits motifs plats posés sur une face (z = côté) : polygone irrégulier (plâtre éclaté, trou) et fissure (bande mince). ky : tassement en hauteur
  const ngon = (b, R, cx, cy, r, n, ky, z, s, c) => {
    const P = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2,
        q = r * (0.72 + R() * 0.45);
      P.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * ky, z]);
    }
    if (s < 0) P.reverse();
    b.add(K.face(P), { c, jit: 0 });
  };
  const crack = (b, x0, y0, x1, y1, w, z, s, c) => {
    const l = Math.hypot(x1 - x0, y1 - y0) || 1,
      nx = (-(y1 - y0) / l) * w,
      ny = ((x1 - x0) / l) * w,
      P = [
        [x0 - nx, y0 - ny, z],
        [x1 - nx, y1 - ny, z],
        [x1 + nx, y1 + ny, z],
        [x0 + nx, y0 + ny, z]
      ];
    if (s < 0) P.reverse();
    b.add(K.face(P), { c, jit: 0 });
  };
  MODELS['cloison'] = ctx => {
    const lv = +ctx.lv || 0,
      bad = +ctx.bad || 0,
      C = INTC[lv % 6],
      b = K.make(121 + lv * 2 + bad),
      R = K.rng(51 + lv);
    if (!bad) {
      b.add(K.box(1, 1, 1), { c: K.shade(C, 0.96), c2: K.shade(C, 0.96), jit: 0 });
      return b;
    }
    b.add(K.box(1, 1, 1), { c: K.shade(C, 0.8), c2: K.shade(C, 0.8), jit: 0 });
    const FS = K.shade(C, 0.5);
    // sur chaque face : trois impacts (plâtre éclaté, trou sombre) d'où partent des fissures. Les y sont tassés : le panneau est étiré en hauteur (≈ 2 m pour 1 m)
    for (const s of [-1, 1])
      for (let k = 0; k < 2; k++) {
        const cx = (R() - 0.5) * 0.6,
          cy = (R() - 0.5) * 0.55;
        ngon(b, R, cx, cy, 0.07 + R() * 0.05, 8, 0.55, s * 0.512, s, PLATRE);
        ngon(b, R, cx, cy, 0.025 + R() * 0.02, 6, 0.55, s * 0.52, s, 0x2a2420);
        const n = 3 + Math.floor(R() * 3);
        for (let j = 0; j < n; j++) {
          let a = (j / n) * PI * 2 + R() * 0.8,
            x = cx,
            y = cy;
          for (let q = 0; q < 3; q++) {
            const l = 0.08 + R() * 0.1,
              nx = x + Math.cos(a) * l,
              ny = y + Math.sin(a) * l * 0.55;
            if (Math.abs(nx) > 0.47 || Math.abs(ny) > 0.47) break;
            crack(b, x, y, nx, ny, 0.0022, s * 0.516, s, FS);
            x = nx;
            y = ny;
            a += (R() - 0.5) * 1.1;
          }
        }
      }
    return b;
  };
  // trou de balle (ou de masse) posé sur une cloison : motif plat dans le plan XY, tourné vers +Z
  MODELS['trou'] = () => {
    const b = K.make(131),
      R = K.rng(61);
    ngon(b, R, 0, 0, 0.05, 9, 1, 0.001, 1, PLATRE);
    ngon(b, R, 0, 0, 0.032, 7, 1, 0.002, 1, K.shade(PLATRE, 0.86));
    ngon(b, R, 0, 0, 0.018, 6, 1, 0.003, 1, 0x221d19);
    for (let k = 0; k < 3; k++) {
      const a = k * 2.1 + R();
      crack(b, Math.cos(a) * 0.03, Math.sin(a) * 0.03, Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.0025, 0.0025, 1, FISS);
    }
    return b;
  };
  // gravats au pied d'une cloison cassée : longueur unité le long de x, posés au sol (y = 0)
  MODELS['gravats'] = () => {
    const b = K.make(141),
      R = K.rng(71);
    for (let k = 0; k < 5; k++) {
      const s = 0.05 + R() * 0.06;
      b.add(K.rock(s, k + 3, 0, 0.35), {
        p: [(R() - 0.5) * 0.85, s * 0.4, (R() - 0.5) * 0.35],
        s: [1, 0.65, 1],
        c: [0xdcd5c6, 0xc4bba9, 0xb2a998][k % 3],
        jit: 0.06
      });
    }
    for (let k = 0; k < 4; k++)
      b.add(K.box(0.1 + R() * 0.1, 0.014, 0.07 + R() * 0.06), {
        p: [(R() - 0.5) * 0.9, 0.012, (R() - 0.5) * 0.45],
        r: [0, R() * 3, (R() - 0.5) * 0.25],
        c: k % 2 ? 0xd8d1c2 : 0xc2b9a8
      });
    b.add(
      K.face([
        [-0.47, 0.004, 0.22],
        [0.47, 0.004, 0.25],
        [0.44, 0.004, -0.2],
        [0.1, 0.004, -0.27],
        [-0.45, 0.004, -0.18]
      ]),
      { c: 0xa59d8e, jit: 0 }
    ); // poussière au sol
    return b;
  };
  // planche clouée en travers d'une porte : longueur unité le long de x (étirée à la largeur de la porte), face clouée vers +Z. ctx.v : 0 bois clair, 1 bois grisé
  MODELS['planche'] = ctx => {
    const v = +ctx.v || 0,
      W = [0xa87a48, 0x9c8866][v],
      b = K.make(151 + v);
    b.add(K.box(1, 0.16, 0.035, 1, 0.9), { c: K.shade(W, 0.8), c2: W, jit: 0.05 });
    for (const q of [
      [-0.045, 0.08],
      [0.012, -0.12],
      [0.052, 0.05]
    ])
      b.add(K.box(0.86, 0.005, 0.003), { p: [q[1], q[0], 0.018], c: K.shade(W, 0.68), jit: 0 }); // veines
    b.add(K.box(0.04, 0.159, 0.002), { p: [0.48, 0, 0.018], c: K.shade(W, 0.6), jit: 0 });
    b.add(K.box(0.04, 0.159, 0.002), { p: [-0.48, 0, 0.018], c: K.shade(W, 0.6), jit: 0 }); // bouts plus sombres
    for (const x of [-0.43, 0.43])
      for (const y of [-0.042, 0.042])
        b.add(K.box(0.011, 0.014, 0.008), { p: [x + (y > 0 ? 0.006 : -0.006), y, 0.02], c: 0x34383d, jit: 0 }); // clous
    return b;
  };
  // ---------------------------------------------------------------- la ville autour : la place, les avenues, les ruelles, les immeubles
  const car = (b, o, col, wreck) =>
    b.group(o, b => {
      const c = wreck ? K.shade(col, 0.6) : col;
      b.add(K.box(1.8, 0.7, 4.2, 1, 0.96), { p: [0, 0.55, 0], c: K.shade(c, 0.85), c2: c });
      b.add(K.box(1.6, 0.55, 2.1, 0.86, 0.8), { p: [0, 1.15, -0.2], c: wreck ? 0x2a2522 : 0x2e3a44, c2: c });
      b.add(K.box(1.82, 0.2, 4.25), { p: [0, 0.3, 0], c: 0x2a2c30 });
      for (const sx of [-1, 1])
        for (const sz of [-1.35, 1.35]) b.add(K.cyl(0.34, 0.34, 0.24, 8), { p: [sx * 0.86, 0.34, sz], r: [0, 0, PI / 2], c: 0x1c1e21 });
      b.sym(s => {
        b.add(K.box(0.3, 0.16, 0.05), { p: [s * 0.6, 0.66, 2.11], c: wreck ? 0x555555 : 0xf2efe0, ch: wreck ? 'm' : 'g', jit: 0 });
        b.add(K.box(0.3, 0.14, 0.05), { p: [s * 0.6, 0.66, -2.11], c: 0x8a1a14, jit: 0 });
      });
      if (wreck) {
        b.add(K.box(1.2, 0.05, 1.6), { p: [0, 1.44, -0.2], c: 0x1a1715 });
        b.add(K.box(0.5, 0.4, 0.5), { p: [0.4, 0.9, 1.6], r: [0.3, 0.4, 0.2], c: K.shade(col, 0.4) });
      }
    });
  MODELS['ville'] = () => {
    const b = K.make(201),
      R = K.rng(23);
    // sol : asphalte, place pavée, trottoirs, marquages
    b.add(K.box(280, 0.1, 280), { p: [0, -0.06, 0], c: 0x3a3d42, jit: 0 });
    b.add(K.box(60, 0.06, 60), { p: [0, 0.0, 0], c: 0x8f8b84, c2: 0x8f8b84, jit: 0.02 });
    for (let i = -29; i <= 29; i += 4)
      for (const s of [0, 1]) {
        b.add(K.box(s ? 0.06 : 60, 0.008, s ? 60 : 0.06), { p: [s ? i : 0, 0.035, s ? 0 : i], c: 0x7c7871, jit: 0 });
      }
    for (const a of [0, PI / 2, PI, -PI / 2])
      b.group({ r: [0, a, 0] }, b => {
        for (const s of [-1, 1]) b.add(K.box(3, 0.16, 58), { p: [s * 7.6, 0.05, -60], c: 0x9a958d }); // trottoirs de l'avenue
        for (let z = -36; z > -120; z -= 6) b.add(K.box(0.18, 0.01, 3), { p: [0, 0.005, z], c: 0xe8e4d8, jit: 0 }); // pointillés
        for (let k = -5; k <= 5; k++) b.add(K.box(0.7, 0.01, 3), { p: [k * 1.2, 0.006, -31.8], c: 0xe8e4d8, jit: 0 }); // passage piéton
        // réverbères le long de l'avenue
        for (const z of [-40, -62, -84])
          for (const s of [-1, 1]) {
            b.add(K.cyl(0.08, 0.1, 6, 6), { p: [s * 8.4, 3, z], c: 0x4a4f55, ch: 's' });
            b.add(K.box(1.2, 0.1, 0.18), { p: [s * 7.9, 6, z], c: 0x4a4f55, ch: 's' });
            b.add(K.box(0.4, 0.1, 0.3), { p: [s * 7.4, 5.92, z], c: 0xfff0c0, ch: 'g' });
          }
        // voitures garées ou accidentées
        for (const z of [-44, -70, -96])
          if (R() < 0.85)
            car(
              b,
              { p: [(R() < 0.5 ? -1 : 1) * 5, 0, z + R() * 6], r: [0, (R() - 0.5) * 0.5 + (R() < 0.5 ? PI : 0), 0] },
              [0x9a2f2a, 0x2d4f7a, 0xd8d4c8, 0x3b5a3f, 0xc49a3a, 0x5c5f66][Math.floor(R() * 6)],
              R() < 0.5
            );
      });
    // les quatre ruelles en diagonale : un sol plus sombre
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        b.add(K.box(7, 0.02, 60), { p: [sx * 50, 0.004, sz * 50], r: [0, Math.atan2(sx, sz), 0], c: 0x33363a, jit: 0 });
    // immeubles : une grille de lots, sauf sur la place, les avenues et les ruelles
    const COLS = [0xb8a27f, 0x9a5a45, 0x8b8f94, 0x7f97a6, 0xc4a46a, 0xa3876a, 0x6f7a6c, 0xb07060, 0xd0c4a8];
    for (let gx = -104; gx <= 104; gx += 13)
      for (let gz = -104; gz <= 104; gz += 13) {
        const x = gx + (R() - 0.5) * 2,
          z = gz + (R() - 0.5) * 2;
        if (
          (Math.abs(x) < 38 && Math.abs(z) < 38) ||
          Math.abs(x) < 15.5 ||
          Math.abs(z) < 15.5 ||
          Math.abs(Math.abs(x) - Math.abs(z)) < 14 ||
          Math.hypot(x, z) > 140
        )
          continue;
        const w = 8.5 + R() * 3,
          d = 8.5 + R() * 3,
          fl = 2 + Math.floor(R() * (Math.hypot(x, z) < 60 ? 5 : 8)),
          h = fl * 3.3 + 1,
          col = COLS[Math.floor(R() * COLS.length)];
        b.add(K.box(w, h, d), { p: [x, h / 2, z], c: K.shade(col, 0.82), c2: col, jit: 0.02 });
        b.add(K.box(w + 0.3, 0.3, d + 0.3), { p: [x, h + 0.15, z], c: K.shade(col, 0.7) });
        b.add(K.box(w + 0.06, 3, d + 0.06), { p: [x, 1.5, z], c: K.shade(col, 0.55) });
        // bandes de fenêtres sur les faces tournées vers le centre
        for (const q of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          if (q[0] * -x + q[1] * -z < 0.2 * Math.hypot(x, z)) continue;
          const ww = q[0] ? d : w,
            o = (q[0] ? w : d) / 2 + 0.03;
          for (let k = 1; k < fl; k++) {
            const y = k * 3.3 + 1.6,
              lit = R() < 0.12;
            b.add(K.box(q[0] ? 0.06 : ww - 1.4, 1.3, q[0] ? ww - 1.4 : 0.06), {
              p: [x + q[0] * o, y, z + q[1] * o],
              c: lit ? 0xffd28a : 0x2a3540,
              ch: lit ? 'g' : 'm',
              jit: 0
            });
          }
          b.add(K.box(q[0] ? 0.08 : ww - 1, 2.2, q[0] ? ww - 1 : 0.08), {
            p: [x + q[0] * o, 1.3, z + q[1] * o],
            c: R() < 0.5 ? 0x4b5157 : 0x3a2f2a,
            jit: 0
          });
        }
        if (R() < 0.4) b.add(K.cyl(0.9, 0.9, 1.6, 8), { p: [x + (R() - 0.5) * 3, h + 1.1, z + (R() - 0.5) * 3], c: 0x7a6048 });
        if (R() < 0.5) b.add(K.box(1.6, 1, 1.2), { p: [x + (R() - 0.5) * 4, h + 0.8, z + (R() - 0.5) * 4], c: 0xb9bcbd });
      }
    // la place : arbres en bacs, bancs, poubelles, abribus, voitures abandonnées sur les bords
    for (const q of [
      [-22, -22],
      [22, -22],
      [22, 22],
      [-22, 22],
      [-14, -24],
      [14, 24],
      [-24, 14],
      [24, -14]
    ]) {
      b.add(K.box(2.2, 0.6, 2.2), { p: [q[0], 0.3, q[1]], c: 0x8a857c });
      b.add(K.cyl(0.14, 0.2, 2.6, 6), { p: [q[0], 1.9, q[1]], c: 0x5a4330 });
      b.add(K.ico(1.6, 1), { p: [q[0], 3.9, q[1]], s: [1, 0.85, 1], c: 0x3f6a35, c2: 0x5d8a45, jit: 0.08 });
    }
    for (const q of [
      [-26, -8, 0],
      [26, 8, PI],
      [-8, 26, PI / 2],
      [8, -26, -PI / 2],
      [-27, 24, 0.4],
      [25, -27, 2.1]
    ])
      car(
        b,
        { p: [q[0], 0, q[1]], r: [0, q[2], 0] },
        [0x9a2f2a, 0x2d4f7a, 0xd8d4c8, 0x3b5a3f, 0xc49a3a, 0x5c5f66][Math.floor(R() * 6)],
        true
      );
    for (const q of [
      [-12, -20],
      [12, 20],
      [-20, 12],
      [20, -12]
    ]) {
      b.add(K.box(1.8, 0.08, 0.5), { p: [q[0], 0.45, q[1]], c: 0x6b5038 });
      for (const s of [-1, 1]) b.add(K.box(0.08, 0.45, 0.45), { p: [q[0] + s * 0.8, 0.22, q[1]], c: 0x3a3f45 });
    }
    return b;
  };
  // barricade d'une route encore fermée : deux voitures en travers, blocs de béton, grillage. Regarde vers +Z (vers la place)
  MODELS['barricade'] = ctx => {
    const b = K.make(211 + (+ctx.n || 0)),
      R = K.rng(31 + (+ctx.n || 0)),
      w = +ctx.w || 12;
    car(b, { p: [-w * 0.22, 0, -0.8], r: [0, 1.4 + R() * 0.3, 0.1] }, 0x5c5f66, true);
    car(b, { p: [w * 0.25, 0, 0.4], r: [0, -1.7 + R() * 0.3, 0] }, 0x9a2f2a, true);
    for (let x = -w / 2; x <= w / 2; x += 1.9)
      b.add(K.box(1.8, 0.9, 0.6, 1, 0.5), { p: [x, 0.45, 2], r: [0, (R() - 0.5) * 0.2, 0], c: 0xb8b3a8, c2: 0xd0cbc0 });
    for (let x = -w / 2; x <= w / 2; x += 2.4) {
      b.add(K.box(0.08, 2.2, 0.08), { p: [x, 1.1, -2.4], c: 0x6c7278, ch: 's' });
    }
    b.add(K.box(w, 1.6, 0.03), { p: [0, 1.3, -2.4], c: 0x8a8f94, jit: 0 });
    for (let k = 0; k < 5; k++)
      b.add(K.box(0.7, 0.5, 0.5), { p: [(R() - 0.5) * w, 0.25, (R() - 0.5) * 2], r: [R(), R(), R()], c: 0x6a4a30 });
    return b;
  };
  // mur d'avenue (hauteur 1 : le jeu l'étire à la hauteur voulue). 15 m de long, regarde vers +Z (vers la place)
  MODELS['mur'] = () => {
    const b = K.make(221);
    for (let k = -3; k <= 3; k++) {
      b.add(K.box(2.1, 1, 1, 1, 0.92), { p: [k * 2.14, 0.5, 0], c: 0x9d988e, c2: 0xb8b3a8, jit: 0.05 });
      b.add(K.box(0.08, 1, 0.06), { p: [k * 2.14 + 1.07, 0.5, 0.52], c: 0x6f6a62, jit: 0 });
    }
    b.add(K.box(15.2, 0.06, 1.1), { p: [0, 1.01, 0], c: 0x7a756c });
    return b;
  };
  // nid de sacs de sable posé sur le mur, sous une tourelle
  MODELS['nid'] = () => {
    const b = K.make(231);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * PI * 2;
      b.add(K.box(0.55, 0.28, 0.32, 0.9, 0.8), {
        p: [Math.cos(a) * 0.75, 0.14, Math.sin(a) * 0.75],
        r: [0, -a, 0],
        c: 0xb8a476,
        c2: 0xcbb98a
      });
    }
    b.add(K.box(1.7, 0.12, 1.7), { p: [0, 0.04, 0], c: 0x6b5a3e });
    return b;
  };

  // ---------------------------------------------------------------- les tourelles : un socle fixe, une tête qui pivote (yaw), une arme qui s'incline (pitch). Bouche vers +Z.
  const socle = b => {
    b.add(K.cyl(0.55, 0.62, 0.16, 8), { p: [0, 0.08, 0], c: 0x4a4f55, ch: 's' });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * PI * 2;
      b.add(K.box(0.42, 0.2, 0.26, 0.9, 0.8), {
        p: [Math.cos(a) * 0.6, 0.26, Math.sin(a) * 0.6],
        r: [0, -a, 0],
        c: 0xb8a476,
        c2: 0xcbb98a
      });
    }
    b.add(K.cyl(0.12, 0.16, 0.62, 6), { p: [0, 0.5, 0], c: 0x3a3f45, ch: 's' });
  };
  const TURRET = {
    mg: () => {
      const base = K.make(401),
        head = K.make(402),
        gun = K.make(403);
      socle(base);
      head.group({ p: [0, 0.82, 0] }, head => {
        head.add(K.cyl(0.22, 0.22, 0.12, 8), { c: 0x3a3f45, ch: 's' });
        head.sym(s => head.add(K.box(0.06, 0.36, 0.28), { p: [s * 0.26, 0.16, 0], c: 0x4a5148 }));
        head.add(K.box(0.8, 0.5, 0.06), { p: [0, 0.28, 0.32], r: [-0.15, 0, 0], c: 0x5b6450, c2: 0x6f7a62 });
      }); // bouclier
      gun.group({ p: [0, 1.12, 0] }, gun => {
        gun.add(K.box(0.3, 0.24, 0.62), { p: [0, 0, -0.05], c: 0x2e3236, ch: 's' });
        gun.add(K.box(0.14, 0.2, 0.24), { p: [0.25, -0.04, -0.08], c: 0x4f5a3a }); // carcasse, caisse de munitions
        gun.sym(s => {
          gun.add(K.cyl(0.035, 0.035, 0.95, 6), { p: [s * 0.07, 0.02, 0.62], r: [PI / 2, 0, 0], c: 0x1e2124, ch: 's' });
          gun.add(K.cyl(0.05, 0.05, 0.12, 6), { p: [s * 0.07, 0.02, 1.06], r: [PI / 2, 0, 0], c: 0x3a3f45, ch: 's' });
        });
        gun.add(K.box(0.05, 0.09, 0.05), { p: [0, 0.16, 0.3], c: 0x1e2124 });
      });
      return {
        parts: [
          { name: 'base', b: base },
          { name: 'head', b: head, parent: 'base', pivot: [0, 0.82, 0] },
          { name: 'gun', b: gun, parent: 'head', pivot: [0, 1.12, 0] }
        ],
        tip: 1.12
      };
    },
    la: () => {
      const base = K.make(411),
        head = K.make(412),
        gun = K.make(413);
      socle(base);
      head.group({ p: [0, 0.82, 0] }, head => {
        head.add(K.cyl(0.26, 0.3, 0.16, 8), { c: 0xd8dade, ch: 's' });
        head.sym(s => head.add(K.box(0.07, 0.42, 0.34), { p: [s * 0.3, 0.2, 0], c: 0xc8ccd2, ch: 's' }));
      });
      gun.group({ p: [0, 1.12, 0] }, gun => {
        gun.add(K.box(0.42, 0.38, 0.7, 1, 0.85), { c: 0xe6e8ec, c2: 0xffffff, ch: 's' });
        gun.add(K.box(0.44, 0.06, 0.72), { p: [0, 0.06, 0], c: 0xc03040, jit: 0 });
        gun.add(K.cyl(0.13, 0.17, 0.32, 10), { p: [0, 0, 0.48], r: [PI / 2, 0, 0], c: 0x3a3f45, ch: 's' });
        gun.add(K.cyl(0.1, 0.1, 0.04, 10), { p: [0, 0, 0.65], r: [PI / 2, 0, 0], c: 0xff6070, ch: 'g', jit: 0 });
        for (let k = 0; k < 4; k++) gun.add(K.box(0.5, 0.03, 0.12), { p: [0, -0.12 + k * 0.08, -0.32], c: 0x8a9098, ch: 's' });
        gun.add(
          K.tube(
            [
              [0.2, -0.1, -0.2],
              [0.35, -0.3, -0.1],
              [0.3, -0.5, 0.05]
            ],
            0.025,
            4
          ),
          { c: 0x1e2124 }
        );
      });
      return {
        parts: [
          { name: 'base', b: base },
          { name: 'head', b: head, parent: 'base', pivot: [0, 0.82, 0] },
          { name: 'gun', b: gun, parent: 'head', pivot: [0, 1.12, 0] }
        ],
        tip: 0.7
      };
    },
    mo: () => {
      const base = K.make(421),
        head = K.make(422),
        gun = K.make(423);
      socle(base);
      head.group({ p: [0, 0.68, 0] }, head => {
        head.add(K.box(0.9, 0.08, 0.9), { c: 0x4a4f55, ch: 's' });
        head.add(K.box(0.35, 0.25, 0.25), { p: [0.35, 0.15, -0.3], c: 0x5b6a3e });
        for (let k = 0; k < 3; k++) head.add(K.cyl(0.06, 0.06, 0.3, 6), { p: [0.25 + k * 0.09, 0.42, -0.3], c: 0xb0a060, ch: 's' });
      });
      gun.group({ p: [0, 0.75, 0] }, gun => {
        gun.add(K.cyl(0.13, 0.15, 1.2, 8), { p: [0, 0.5, 0], c: 0x4f5a3a, c2: 0x66734c });
        gun.add(K.cyl(0.17, 0.17, 0.08, 8), { p: [0, 1.08, 0], c: 0x2e3236, ch: 's' });
        gun.sym(s => gun.add(K.cyl(0.025, 0.025, 0.75, 5), { p: [s * 0.22, 0.18, 0.25], r: [0.6, 0, s * 0.35], c: 0x2e3236, ch: 's' }));
      });
      return {
        parts: [
          { name: 'base', b: base },
          { name: 'head', b: head, parent: 'base', pivot: [0, 0.68, 0] },
          { name: 'gun', b: gun, parent: 'head', pivot: [0, 0.75, 0] }
        ],
        tip: 1.1
      };
    },
    fl: () => {
      const base = K.make(431),
        head = K.make(432),
        gun = K.make(433);
      socle(base);
      head.group({ p: [0, 0.82, 0] }, head => {
        head.add(K.cyl(0.22, 0.22, 0.12, 8), { c: 0x3a3f45, ch: 's' });
        head.sym(s => head.add(K.cyl(0.15, 0.15, 0.7, 8), { p: [s * 0.2, 0.42, -0.25], c: 0xb0301e, c2: 0xd04a2a, ch: 's' }));
        head.sym(s => head.add(K.dome(0.15, 8, 3), { p: [s * 0.2, 0.77, -0.25], c: 0xd04a2a, ch: 's' }));
      });
      gun.group({ p: [0, 1.12, 0] }, gun => {
        gun.add(K.box(0.2, 0.2, 0.5), { p: [0, 0, 0.1], c: 0x2e3236, ch: 's' });
        gun.add(K.cyl(0.06, 0.09, 0.6, 8), { p: [0, 0, 0.6], r: [PI / 2, 0, 0], c: 0x6c7278, ch: 's' });
        gun.add(K.cyl(0.1, 0.1, 0.06, 8), { p: [0, 0, 0.9], r: [PI / 2, 0, 0], c: 0x2e3236, ch: 's' });
        gun.add(K.ico(0.045, 0), { p: [0, -0.09, 0.92], c: 0x6ac8ff, ch: 'g' });
        gun.add(
          K.tube(
            [
              [0, -0.1, -0.1],
              [-0.1, -0.3, -0.25],
              [-0.2, -0.25, -0.35]
            ],
            0.03,
            4
          ),
          { c: 0x1e2124 }
        );
      });
      return {
        parts: [
          { name: 'base', b: base },
          { name: 'head', b: head, parent: 'base', pivot: [0, 0.82, 0] },
          { name: 'gun', b: gun, parent: 'head', pivot: [0, 1.12, 0] }
        ],
        tip: 0.92
      };
    }
  };
  for (const k in TURRET) MODELS['tour.' + k] = TURRET[k];

  // ---------------------------------------------------------------- l'hélicoptère des secours (≈ 11 m, nez vers +Z), rotor animé
  MODELS['heli'] = () => {
    const b = K.make(501),
      rot = K.make(502),
      tr = K.make(503),
      C = 0x2f4a3a,
      CL = 0x4a6a52;
    b.add(K.box(2.2, 2, 4.2, 0.9, 0.85), { p: [0, 1.7, 0.4], c: C, c2: CL });
    b.add(K.box(2, 1.5, 1.6, 0.8, 0.7), { p: [0, 1.6, 2.9], r: [0.25, 0, 0], c: 0x253038, c2: 0x9ab8c8, ch: 's' });
    b.add(K.box(0.7, 0.7, 5.5, 0.6, 0.6), { p: [0, 2.1, -3.8], c: C });
    b.add(K.box(0.12, 1.6, 1.1, 1, 0.5), { p: [0, 2.9, -6.3], r: [-0.3, 0, 0], c: CL });
    b.add(K.box(2, 0.1, 0.6), { p: [0, 2.3, -5.9], c: CL });
    b.sym(s => {
      b.add(K.box(0.12, 0.12, 4.6), { p: [s * 1.1, 0.12, 0.6], c: 0x2a2c30, ch: 's' });
      for (const z of [-0.4, 1.6]) b.add(K.box(0.08, 0.7, 0.08), { p: [s * 0.95, 0.5, z], r: [0, 0, -s * 0.3], c: 0x2a2c30, ch: 's' });
      b.add(K.box(0.04, 0.8, 1.4), { p: [s * 1.12, 1.9, 0.6], c: 0x1a2228 });
      b.add(K.box(0.04, 0.12, 1.2), { p: [s * 1.12, 1.2, 0.4], c: 0xe8e4d8, jit: 0 });
    });
    b.add(K.box(0.5, 0.5, 0.5), { p: [0, 2.9, 0], c: 0x3a3f45, ch: 's' });
    b.add(K.box(0.3, 0.12, 0.05), { p: [0, 1.2, 2.4], c: 0xffffff, ch: 'g' });
    b.add(K.box(0.2, 0.12, 0.05), { p: [0, 2.75, -6.6], c: 0xff3030, ch: 'g' });
    for (let k = 0; k < 4; k++) rot.add(K.box(0.35, 0.05, 6), { p: [0, 0, 3], r: [0, (k * PI) / 2, 0], c: 0x1e2124 });
    rot.group({ r: [0, PI / 4, 0] }, r => {});
    rot.add(K.cyl(0.2, 0.2, 0.3, 6), { c: 0x2e3236, ch: 's' });
    for (let k = 0; k < 2; k++) tr.add(K.box(0.05, 1.4, 0.18), { r: [(k * PI) / 2, 0, 0], c: 0x1e2124 });
    return {
      parts: [
        { name: 'body', b },
        { name: 'rotor', b: rot, parent: 'body', pivot: [0, 3.25, 0], anim: [{ k: 'rot', axis: 'y', spin: true, sp: 22 }] },
        { name: 'tail', b: tr, parent: 'body', pivot: [0.4, 2.9, -6.4], anim: [{ k: 'rot', axis: 'x', spin: true, sp: 30 }] }
      ]
    };
  };
  // le leurre posé au sol : boîtier, haut-parleur, antenne et lampe qui clignote (pièce à part)
  // V3.6 : les tyroliennes : poteau sur le toit, câble, passerelle d'acier au-dessus de chaque avenue (garde-corps jaunes, échelles aux pieds)
  MODELS['tyro'] = () => {
    const b = K.make(551),
      AC = 0x5d646c,
      ACD = 0x3e444b,
      JA = 0xe2b13a,
      NO = 0x1d2024;
    for (const Z of ZIPS) {
      const n = Z.n,
        t = Z.t,
        P = (d, u, y) => [Z.c[0] + n[0] * (d - PASSD) + t[0] * u, y, Z.c[2] + n[1] * (d - PASSD) + t[1] * u],
        ry = Math.atan2(n[0], n[1]);
      // poteaux (toit et passerelle) avec bras et poulie
      for (const q of [Z.a, Z.b]) {
        b.add(K.cyl(0.09, 0.11, ZIPH + 0.35, 8), { p: [q[0], q[1] + (ZIPH + 0.35) / 2, q[2]], c: ACD, c2: AC, ch: 's' });
        b.add(K.box(0.5, 0.1, 0.5), { p: [q[0], q[1] + 0.05, q[2]], c: ACD });
        b.add(K.cyl(0.13, 0.13, 0.06, 10), { p: [q[0], q[1] + ZIPH, q[2]], r: [0, ry, PI / 2], c: JA, ch: 's' });
        b.add(K.ico(0.09, 0), { p: [q[0], q[1] + ZIPH + 0.42, q[2]], c: 0xff5a3a, ch: 'g' });
      }
      // le câble (un peu épais pour qu'on le voie de loin)
      b.add(
        K.tube(
          [
            [Z.a[0], Z.a[1] + ZIPH, Z.a[2]],
            [Z.b[0], Z.b[1] + ZIPH, Z.b[2]]
          ],
          0.035,
          5
        ),
        { c: NO, jit: 0 }
      );
      // la passerelle : tablier, poutres, garde-corps jaunes, quatre pieds avec échelons
      b.group({ p: [Z.c[0], PASSY, Z.c[2]], r: [0, ry, 0] }, b => {
        b.add(K.box(PASSW * 2, 0.3, 2.5), { p: [0, -0.15, 0], c: 0x6f757c, c2: 0x8c929a });
        for (const s of [-1, 1]) {
          b.add(K.box(PASSW * 2, 0.45, 0.18), { p: [0, -0.45, s * 1.15], c: ACD, ch: 's' });
          b.add(K.box(PASSW * 2, 0.07, 0.07), { p: [0, 1.05, s * 1.2], c: JA, ch: 's' });
          b.add(K.box(PASSW * 2, 0.05, 0.05), { p: [0, 0.55, s * 1.2], c: JA, ch: 's' });
          for (let i = -6; i <= 6; i++) b.add(K.box(0.06, 1.05, 0.06), { p: [i * 1.2, 0.52, s * 1.2], c: JA, ch: 's', jit: 0 });
          for (const e of [-1, 1]) {
            b.add(K.box(0.3, PASSY, 0.3), { p: [e * (PASSW - 0.15), -PASSY / 2, s * 1.05], c: ACD, c2: AC, ch: 's' });
            for (let y = 0.5; y < PASSY; y += 0.45)
              b.add(K.box(0.5, 0.04, 0.04), { p: [e * (PASSW - 0.15), -PASSY + y, s * 1.32], c: AC, ch: 's', jit: 0 });
          }
        }
        for (let i = -5; i <= 5; i++)
          b.add(K.box(0.04, 0.4, 2.3), { p: [i * 1.35, -0.5, 0], r: [i % 2 ? 0.6 : -0.6, 0, 0], c: ACD, ch: 's', jit: 0 });
      });
    }
    return b;
  };
  // V3.5 : la boutique, façon « buy station » de Warzone : grosse caisse militaire, pupitre à écran vert, gyrophare, hologramme « $ » qui tourne au-dessus (avant = +z)
  MODELS['boutique'] = () => {
    const b = K.make(541),
      h = K.make(542),
      gy = K.make(543),
      OD = 0x4a5638,
      ODL = 0x5d6b47,
      ODD = 0x333c27,
      NO = 0x23262a,
      AC = 0x5b6168,
      JA = 0xe8b52a,
      VE = 0x3dff8e;
    // la caisse : corps, cadres renforcés, coins d'acier, bandes jaunes et noires en bas
    b.add(K.box(1.7, 0.95, 1, 0.97, 0.97), { p: [0, 0.5, 0], c: ODD, c2: OD });
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) b.add(K.box(0.12, 0.99, 0.12), { p: [sx * 0.8, 0.5, sz * 0.45], c: AC, c2: 0x7a8088, ch: 's' });
    for (const y of [0.08, 0.9]) b.add(K.box(1.74, 0.08, 1.04), { p: [0, y, 0], c: ODD });
    for (let i = 0; i < 9; i++)
      b.add(K.box(0.12, 0.07, 0.01), { p: [-0.72 + i * 0.18, 0.2, 0.506], r: [0, 0, 0.6], c: i % 2 ? NO : JA, jit: 0 });
    b.add(K.box(1.5, 0.6, 0.02), { p: [0, 0.52, 0.51], c: ODL, c2: OD });
    b.add(K.box(0.36, 0.14, 0.01), { p: [-0.5, 0.6, 0.525], c: 0xd8d2b8, jit: 0 });
    for (const sx of [-1, 1]) b.add(K.box(0.08, 0.3, 0.06), { p: [sx * 0.88, 0.6, 0], c: NO });
    // le pupitre : support incliné, écran vert lumineux, petites touches
    b.add(K.box(1.1, 0.16, 0.5), { p: [0, 1.05, -0.15], c: NO });
    b.group({ p: [0, 1.38, -0.2], r: [-0.42, 0, 0] }, b => {
      b.add(K.box(0.98, 0.6, 0.08), { c: NO, c2: 0x30343a, ch: 's' });
      b.add(K.box(0.86, 0.48, 0.01), { p: [0, 0, 0.045], c: 0x0f3a24, jit: 0 });
      b.add(K.box(0.8, 0.1, 0.012), { p: [0, 0.14, 0.05], c: VE, ch: 'g', jit: 0 });
      for (let i = 0; i < 3; i++)
        b.add(K.box(0.22, 0.14, 0.012), { p: [-0.27 + i * 0.27, -0.07, 0.05], c: i === 1 ? JA : 0x2ad07a, ch: 'g', jit: 0 });
    });
    for (let i = 0; i < 5; i++)
      b.add(K.box(0.1, 0.03, 0.08), { p: [-0.3 + i * 0.15, 1.15, 0.05], c: i % 2 ? JA : 0x2ad07a, ch: 'g', jit: 0 });
    // antenne et gyrophare
    b.add(K.cyl(0.02, 0.02, 0.7, 5), { p: [0.66, 1.45, -0.38], c: NO });
    gy.add(K.cyl(0.07, 0.08, 0.12, 8), { c: JA, ch: 'g' });
    gy.add(K.box(0.2, 0.03, 0.03), { p: [0, 0.07, 0], c: 0xfff0a0, ch: 'g', jit: 0 });
    // l'hologramme : un losange vert qui tourne, et un « $ » fait de trois barres
    h.add(K.oct(0.17), { s: [1, 1.35, 1], c: VE, ch: 'g', jit: 0 });
    h.add(K.box(0.04, 0.42, 0.04), { p: [0, 0, 0], c: 0xeafff2, ch: 'g', jit: 0 });
    return {
      parts: [
        { name: 'body', b },
        {
          name: 'holo',
          b: h,
          parent: 'body',
          pivot: [0, 2.15, 0],
          anim: [
            { k: 'rot', axis: 'y', spin: true, sp: 1.6 },
            { k: 'pos', axis: 'y', amp: 0.08, sp: 2.2 }
          ]
        },
        { name: 'gyro', b: gy, parent: 'body', pivot: [0.66, 1.84, -0.38], anim: [{ k: 'rot', axis: 'y', spin: true, sp: 5 }] }
      ]
    };
  };
  MODELS['leurre'] = () => {
    const b = K.make(511),
      l = K.make(512);
    b.add(K.box(0.5, 0.35, 0.35), { p: [0, 0.18, 0], c: 0xd8c23a, c2: 0xe8d45a });
    b.add(K.cyl(0.12, 0.12, 0.04, 10), { p: [0, 0.2, 0.18], r: [PI / 2, 0, 0], c: 0x2e3236 });
    b.add(K.cyl(0.012, 0.012, 0.6, 4), { p: [0.18, 0.65, 0], c: 0x2e3236 });
    l.add(K.ico(0.07, 0), { c: 0xff3030, ch: 'g' });
    return {
      parts: [
        { name: 'body', b },
        { name: 'lamp', b: l, parent: 'body', pivot: [-0.12, 0.42, 0], anim: [{ k: 'scl', axis: 'x', amp: 0.5, sp: 14 }] }
      ]
    };
  };
  MODELS['missile'] = () => {
    const b = K.make(521);
    b.add(K.cyl(0.14, 0.14, 1.4, 8), { p: [0, 0, 0], r: [PI / 2, 0, 0], c: 0xd8dade, ch: 's' });
    b.add(K.cone(0.14, 0.4, 8), { p: [0, 0, 0.9], r: [PI / 2, 0, 0], c: 0xb03030 });
    for (let k = 0; k < 4; k++)
      b.group({ r: [0, 0, (k * PI) / 2] }, g => g.add(K.box(0.02, 0.4, 0.35), { p: [0, 0.2, -0.6], c: 0x3a3f45 }));
    b.add(K.cyl(0.11, 0.06, 0.2, 8), { p: [0, 0, -0.8], r: [PI / 2, 0, 0], c: 0xffb050, ch: 'g' });
    return b;
  };
}
