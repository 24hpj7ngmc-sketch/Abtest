// L'ARSENAL — la salle d'armes du lobby (MODELS['vil.armes']) : une armurerie-forteresse de pierre massive et de poutres, toit de tuiles cuites, forge qui fume.
// On y entre à pied : la grande porte en plein cintre (côté +Z) est ouverte, la halle est praticable, les six armes du joueur y sont exposées comme des pièces
// de collection, chacune sur son présentoir, et la forge vivante est au fond (foyer, enclume, soufflet, bac de trempe). Le modèle ne change jamais de place.
// ctx.lvl (1 à 6, le niveau du bâtiment) : 1 l'atelier du forgeron · 2 les vitrines (verre, laiton), lustres, bannières · 3 la forge s'agrandit (appentis, meule,
//   foyer double, cheminée couronnée) · 4 la tour de guet · 5 les remparts (créneaux, bretèche au-dessus de la porte, échauguette) · 6 les dorures et les six bannières.
// En plus de la recette : spots (les six présentoirs : w, x, y, z, s, plaque [x, y, z, ry]), col (obstacles au sol : cercles [x, z, r] du repère du modèle),
//   porte [x, z] (devant la porte), forge [x, y, z] (le foyer), lab [x, y, z] (l'étiquette), rad (rayon de l'emprise).
// MODELS['arm.expo'] : une arme exposée, seule (le modèle en main vm.* de armes.js, sans gants ni manches ; ctx.a = l'arme, ctx.el = son élément).
{
  const { PAL, TAU } = K,
    PI = Math.PI;
  const PIER = 0xd3c3a6,
    PIERL = 0xe9ddc4,
    PIERD = 0xa89878,
    PIERDD = 0x7e715c,
    TUIL = 0xa8492c,
    TUILL = 0xd06a3c,
    BOIS = PAL.wood,
    BOISL = PAL.woodL,
    BOISD = PAL.woodD,
    FER = PAL.iron,
    FERL = PAL.ironL,
    LAI = PAL.bronze,
    LAIL = PAL.bronzeL,
    OR = PAL.gold,
    ORD = PAL.goldD,
    BRAISE = 0xff7a2e,
    BRAISEL = 0xffd27a,
    ORANGE = 0xe8743a,
    ORANGED = 0xa8452a,
    VITRE = 0xffc56b,
    VERRE = 0x0c1a22;
  const ELK = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
  // les mesures de la halle (repère du modèle, la porte côté +Z) : demi-largeur intérieure, épaisseur des murs, façade et mur du fond, hauteurs
  const W = 4.5,
    T = 0.8,
    WC = W + T / 2,
    WO = W + T,
    ZF = 4.7,
    ZB = -4.5,
    ZI = ZF - T / 2,
    ZJ = ZB + T / 2,
    Y0 = 0.15,
    HM = 6.2,
    HF = 10.5,
    DH = HM - 5.6,
    DP = 1.5,
    DY = 3.3;
  // les six présentoirs : trois le long de chaque mur, face à l'allée ; le lance-flammes près de la forge
  const PZ = [2.75, 0.4, -1.95],
    PX = 3.25,
    QUI = [
      ['pistolet', 1, 0],
      ['assaut', 1, 1],
      ['sniper', 1, 2],
      ['fusil', -1, 0],
      ['pompe', -1, 1],
      ['lance', -1, 2]
    ];
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
  // un arc en plein cintre de rayon r, de (−r, y0) à (r, y0) par le haut
  const cintre = (r, y0, n) => {
    const P = [];
    for (let i = 0; i <= n; i++) {
      const t = PI - (PI * i) / n;
      P.push([r * Math.cos(t), y0 + r * Math.sin(t)]);
    }
    return P;
  };
  // fenêtre en plein cintre : largeur w, montants jusqu'à hs (contour pour K.prism)
  const baie = (w, hs, n) => [[w / 2, 0], ...cintre(w / 2, hs, n).reverse(), [-w / 2, 0]];
  // l'écu des armes : un bouclier à pointe (contour), largeur w, hauteur h
  const ecu = (w, h) => [
    [-w / 2, h * 0.5],
    [w / 2, h * 0.5],
    [w / 2, -h * 0.05],
    [w * 0.36, -h * 0.3],
    [0, -h * 0.5],
    [-w * 0.36, -h * 0.3],
    [-w / 2, -h * 0.05]
  ];

  const arsenal = ctx => {
    const L = Math.max(1, Math.min(6, Math.round(+ctx.lvl || 1))),
      b = K.make(511),
      d = K.make(512),
      fe = K.make(513),
      so = K.make(514),
      fu = K.make(515),
      spots = [],
      col = [],
      dor = L >= 6,
      vit = L >= 2,
      gr = L >= 3,
      TR = dor ? OR : LAI,
      TRch = 's',
      cerc = (x, z, r) => col.push([+x.toFixed(2), +z.toFixed(2), r]),
      chaine = (x0, z0, x1, z1, r) => {
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.5));
        for (let i = 0; i <= n; i++) cerc(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, r);
      };

    // ---- le socle de la halle, les marches, le dallage de grandes pierres, le tapis de l'allée jusqu'à l'enclume
    b.add(K.box(2 * WO + 0.4, Y0, ZF - ZB + T + 0.3), {
      p: [0, Y0 / 2, (ZF + ZB) / 2],
      c: PIERDD,
      c2: PIERD,
      jit: 0.02
    });
    b.add(K.box(4.6, Y0, 0.9), { p: [0, Y0 / 2, ZF + T / 2 + 0.45], c: PIERD, c2: PIER });
    b.add(K.box(5.4, Y0 / 2, 0.8), { p: [0, Y0 / 4, ZF + T / 2 + 1.3], c: PIERDD, c2: PIERD });
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++) {
        const dz = (ZI - ZJ) / 6;
        b.add(K.box(1.46, 0.04, dz - 0.04), {
          p: [-W + 0.75 + i * 1.5, Y0 + 0.02, ZJ + dz * (j + 0.5)],
          c: (i * 7 + j * 3) % 4 ? 0xa59a88 : 0x8d8373,
          jit: 0.05
        });
      }
    d.add(K.box(1.6, 0.03, ZI - ZJ - 2.2), {
      p: [0, Y0 + 0.055, (ZI + ZJ + 2.2) / 2 + 0.25],
      c: ORANGED,
      c2: 0xc0532e,
      jit: 0
    });
    for (const sd of [1, -1])
      d.add(K.box(0.07, 0.035, ZI - ZJ - 2.2), {
        p: [sd * 0.76, Y0 + 0.06, (ZI + ZJ + 2.2) / 2 + 0.25],
        c: dor ? OR : 0xe8b04a,
        ch: 's',
        jit: 0
      });

    // ---- les murs : pierre massive, soubassement à bossages, chaînes d'angle, cordon et corniche ; façade percée de la grande porte
    for (const sd of [1, -1]) {
      b.add(K.box(T, HM, ZF - ZB + T), { p: [sd * WC, HM / 2, (ZF + ZB) / 2], c: PIERD, c2: PIER, jit: 0.025 });
      b.add(K.box(T + 0.3, 1.1, ZF - ZB + T + 0.3), {
        p: [sd * WC, 0.55, (ZF + ZB) / 2],
        c: PIERDD,
        c2: PIERD,
        jit: 0.03
      });
      b.add(K.box(T + 0.5, 0.32, ZF - ZB + T + 0.5), {
        p: [sd * WC, HM - 0.12, (ZF + ZB) / 2],
        c: dor ? ORD : PIERD,
        c2: dor ? OR : PIERL,
        ch: dor ? 's' : 'm',
        jit: 0
      });
      b.add(K.box(T + 0.14, 0.14, ZF - ZB + T + 0.14), { p: [sd * WC, 2.4, (ZF + ZB) / 2], c: PIERD, jit: 0 });
      // bossages du soubassement
      for (let i = 0; i < 9; i++)
        b.add(K.box(0.14, 0.42, 0.95, 0.7, 0.85), {
          p: [sd * (WO + 0.16), 0.55 + (i % 2 ? 0.02 : -0.02), ZB + 0.1 + i * 1.07],
          r: [0, 0, sd * (PI / 2)],
          c: PIERD,
          jit: 0.06
        });
      // chaînes d'angle (façade et fond)
      for (const z of [ZF + T / 2, ZB - T / 2])
        for (let i = 0; i < 5; i++)
          b.add(K.box(i % 2 ? 0.55 : 0.9, 0.8, i % 2 ? 0.9 : 0.55), {
            p: [
              sd * (WO - (i % 2 ? 0.2 : 0.38)) + sd * 0.06,
              1.55 + i * 0.85,
              z + (z > 0 ? 1 : -1) * (i % 2 ? 0.38 : 0.2) - (z > 0 ? 1 : -1) * 0.3
            ],
            c: PIERL,
            jit: 0.04
          });
      // lésènes : une bande de pierre au droit de chaque ferme (sauf sous la tour)
      for (const z of PZ)
        if (!(sd < 0 && L >= 4 && z > 2))
          b.add(K.box(0.3, HM - 1.3, 0.7), {
            p: [sd * (WO + 0.12), (HM + 1.1) / 2 - 0.1, z],
            c: PIERD,
            c2: PIERL,
            jit: 0.03
          });
      // façade : un trumeau de chaque côté de la porte
      b.add(K.box(WO - DP, HM, T), { p: [sd * (DP + (WO - DP) / 2), HM / 2, ZF], c: PIERD, c2: PIER, jit: 0.025 });
      b.add(K.box(WO - DP + 0.15, 1.1, T + 0.3), {
        p: [sd * (DP + (WO - DP) / 2 + 0.07), 0.55, ZF],
        c: PIERDD,
        c2: PIERD,
        jit: 0.03
      });
      // fond : le mur entier
      chaine(sd * WC, ZB, sd * WC, ZF + T / 2, 0.6);
      chaine(sd * (DP + 0.55), ZF, sd * WO, ZF, 0.6);
    }
    b.add(K.box(2 * WO, HM, T), { p: [0, HM / 2, ZB], c: PIERD, c2: PIER, jit: 0.025 });
    b.add(K.box(2 * WO + 0.3, 1.1, T + 0.3), { p: [0, 0.55, ZB], c: PIERDD, c2: PIERD, jit: 0.03 });
    b.add(K.box(2 * WO + 0.5, 0.32, T + 0.5), {
      p: [0, HM - 0.12, ZB],
      c: dor ? ORD : PIERD,
      c2: dor ? OR : PIERL,
      ch: dor ? 's' : 'm',
      jit: 0
    });
    chaine(-WC, ZB, WC, ZB, 0.6);
    // au-dessus de la porte : l'arc en plein cintre (3 m de large, 4,8 m sous la clé), ses claveaux, la clé à l'écu
    {
      const A = cintre(DP, DY, 8);
      plaque(b, [...A, [DP, HM], [-DP, HM]], T, { p: [0, 0, ZF], c: PIERD, c2: PIER, jit: 0.02 });
      for (let i = 0; i < 9; i++) {
        const t = PI - (PI * (i + 0.5)) / 9,
          r = DP + 0.28;
        b.add(K.box(0.5, i === 4 ? 0.75 : 0.55, 0.22, 1, 1), {
          p: [Math.cos(t) * r, DY + Math.sin(t) * r, ZF + T / 2 + 0.08],
          r: [0, 0, t - PI / 2],
          c: i === 4 ? (dor ? OR : PIERL) : i % 2 ? PIERL : PIER,
          ch: i === 4 && dor ? 's' : 'm',
          jit: 0.03
        });
      }
      for (const sd of [1, -1])
        b.add(K.box(0.5, DY, 0.24), {
          p: [sd * (DP + 0.25), DY / 2, ZF + T / 2 + 0.07],
          c: PIER,
          c2: PIERL,
          jit: 0.03
        });
      // les embrasures de la porte (épaisseur du mur), en bois
      for (const sd of [1, -1]) b.add(K.box(0.12, DY, T), { p: [sd * (DP - 0.06), DY / 2, ZF], c: BOISD, jit: 0 });
    }

    // ---- la grande porte : deux battants de chêne ouverts vers l'extérieur, pentures de fer, clous
    b.sym(sd =>
      b.group({ p: [sd * DP, Y0, ZF + T / 2 + 0.06], r: [0, sd * 2.0, 0], s: [sd, 1, 1] }, b => {
        const A = [];
        for (let i = 0; i <= 5; i++) {
          const t = (PI / 2) * (i / 5);
          A.push([-DP + DP * Math.cos(t), DY - Y0 + DP * Math.sin(t)]);
        }
        plaque(b, [[0, 0], ...A, [-DP, 0]], 0.14, { p: [0, 0, 0], c: BOISD, c2: BOIS, jit: 0.04 });
        for (let i = 1; i < 4; i++)
          b.add(K.box(0.04, DY - 0.2, 0.17), { p: [-i * 0.38, (DY - 0.2) / 2, 0], c: BOISD, jit: 0 });
        for (const y of [0.6, 1.8, 3.0]) b.add(K.box(1.35, 0.13, 0.19), { p: [-0.68, y, 0], c: FER, ch: 's', jit: 0 });
        for (const y of [0.6, 1.8, 3.0])
          for (let i = 0; i < 4; i++) b.add(K.oct(0.035), { p: [-0.2 - i * 0.33, y, 0.1], c: FERL, ch: 's', jit: 0 });
        b.add(K.torus(0.13, 0.03, 4, 8), { p: [-1.2, 1.6, 0.12], c: dor ? OR : FERL, ch: 's', jit: 0 });
      })
    );
    for (const sd of [1, -1]) {
      cerc(sd * (DP + 0.75 * 0.42), ZF + T / 2 + 0.75 * 0.9, 0.42);
      cerc(sd * (DP + 1.35 * 0.42), ZF + T / 2 + 1.35 * 0.9, 0.35);
    }

    // ---- fenêtres : deux baies en plein cintre sur chaque mur latéral (lumière chaude), meurtrières du fond
    for (const sd of [1, -1])
      for (const z of [1.6, -0.8]) {
        plaque(b, baie(1.05, 1.45, 6), T + 0.08, {
          p: [sd * WC, 2.55, z],
          ry: PI / 2,
          c: dor ? OR : PIERL,
          ch: dor ? 's' : 'm',
          jit: 0
        });
        plaque(b, baie(0.8, 1.35, 6), T + 0.14, {
          p: [sd * WC, 2.65, z],
          ry: PI / 2,
          c: vit ? VITRE : 0x5a4a3a,
          c2: vit ? 0xffe3a8 : 0x3a2f25,
          ch: vit ? 'g' : 'm',
          jit: 0
        });
        b.add(K.box(T + 0.18, 0.05, 0.82), { p: [sd * WC, 3.5, z], c: FER, jit: 0 });
        b.add(K.box(T + 0.18, 1.7, 0.05), { p: [sd * WC, 3.45, z], c: FER, jit: 0 });
        b.add(K.box(0.3, 0.12, 1.2), { p: [sd * (WO + 0.1), 2.5, z], c: PIERL, jit: 0 });
      }

    // ---- les pignons et le toit de tuiles à deux pans (rangs de tuiles), faîtage ; aux remparts (niv. 5), le toit se cache derrière les créneaux
    const ex = L >= 5 ? WC : WO + 0.55,
      ey = L >= 5 ? HM + 0.15 : HM - 0.2,
      Lz = ZF - ZB + T + (L >= 5 ? 0.2 : 1.2),
      cz = (ZF + ZB) / 2;
    for (const z of [ZF, ZB])
      plaque(
        b,
        [
          [-WO - 0.25, 0],
          [WO + 0.25, 0],
          [0, HF - HM + 0.3]
        ],
        T,
        { p: [0, HM, z], c: PIERD, c2: PIER, jit: 0.02 }
      );
    {
      const sl = Math.hypot(ex, HF - ey),
        al = Math.atan2(HF - ey, ex);
      for (const sd of [1, -1]) {
        b.add(K.box(sl + 0.25, 0.34, Lz), {
          p: [(sd * ex) / 2, (ey + HF) / 2, cz],
          r: [0, 0, -sd * al],
          c: PAL.plank,
          c2: TUIL,
          jit: 0.04
        });
        for (let i = 0; i < 6; i++) {
          const u = (i + 0.4) / 6.3,
            x = sd * ex * (1 - u),
            y = ey + (HF - ey) * u;
          b.add(K.box(0.85, 0.1, Lz + 0.05), {
            p: [x + sd * Math.sin(al) * 0.18, y + Math.cos(al) * 0.18, cz],
            r: [0, 0, -sd * al],
            c: i % 2 ? TUILL : TUIL,
            c2: i % 2 ? 0xe07c48 : TUILL,
            jit: 0.06
          });
        }
      }
      b.add(K.box(0.42, 0.42, Lz + 0.2), {
        p: [0, HF + 0.12, cz],
        r: [0, 0, PI / 4],
        c: dor ? OR : FER,
        c2: dor ? OR : FERL,
        ch: 's',
        jit: 0
      });
      // épis de faîtage
      for (const z of [cz - Lz / 2 - 0.05, cz + Lz / 2 + 0.05]) {
        b.add(K.cyl(0.05, 0.08, 0.9, 5), { p: [0, HF + 0.6, z], c: dor ? OR : FER, ch: 's', jit: 0 });
        b.add(K.oct(0.16), { p: [0, HF + 1.15, z], s: [1, 1.5, 1], c: dor ? OR : LAIL, ch: 's', jit: 0 });
      }
    }

    // ---- l'écu des armes au pignon : bouclier orange cerclé, enclume et deux marteaux croisés
    {
      const y = 8.35,
        z = ZF + T / 2 + 0.06;
      plaque(b, ecu(1.95, 2.25), 0.16, { p: [0, y, z], c: dor ? ORD : FER, c2: dor ? OR : FERL, ch: 's', jit: 0 });
      plaque(b, ecu(1.65, 1.95), 0.24, { p: [0, y + 0.02, z], c: ORANGED, c2: ORANGE, jit: 0.02 });
      b.add(K.box(0.8, 0.18, 0.12), { p: [0, y - 0.05, z + 0.16], c: dor ? OR : FERL, ch: 's', jit: 0 });
      b.add(K.box(0.36, 0.22, 0.12), { p: [0, y - 0.24, z + 0.16], c: dor ? OR : FERL, ch: 's', jit: 0 });
      b.add(K.box(0.6, 0.12, 0.12), { p: [0, y - 0.4, z + 0.16], c: dor ? OR : FERL, ch: 's', jit: 0 });
      b.add(K.cone(0.09, 0.32, 4), {
        p: [0.55, y - 0.05, z + 0.16],
        r: [0, 0, -PI / 2],
        c: dor ? OR : FERL,
        ch: 's',
        jit: 0
      });
      for (const sd of [1, -1]) {
        b.add(K.box(0.07, 1.1, 0.08), { p: [sd * 0.22, y + 0.35, z + 0.2], r: [0, 0, sd * 0.6], c: BOISL, jit: 0 });
        b.add(K.box(0.36, 0.2, 0.14), {
          p: [sd * 0.53, y + 0.78, z + 0.2],
          r: [0, 0, sd * 0.6],
          c: dor ? OR : PAL.steel,
          ch: 's',
          jit: 0
        });
      }
    }

    // ---- les torches de la porte, l'enseigne pendue à l'angle (une enclume d'or sur un panneau)
    for (const sd of [1, -1]) {
      b.add(K.box(0.1, 0.1, 0.45), { p: [sd * 2.1, 2.55, ZF + T / 2 + 0.22], c: FER, jit: 0 });
      b.add(K.cyl(0.11, 0.06, 0.32, 6), { p: [sd * 2.1, 2.72, ZF + T / 2 + 0.42], c: FER, ch: 's', jit: 0 });
      fe.add(K.cone(0.12, 0.42, 5), {
        p: [sd * 2.1, 3.05, ZF + T / 2 + 0.42],
        c: BRAISE,
        c2: BRAISEL,
        ch: 'g',
        jit: 0
      });
    }
    {
      const x = WO + 0.05,
        z = ZF + 0.1;
      b.add(K.box(1.3, 0.09, 0.09), { p: [x + 0.6, 4.1, z], c: FER, ch: 's', jit: 0 });
      b.add(K.box(0.07, 0.6, 0.07), { p: [x + 0.25, 3.82, z], r: [0, 0, 0.75], c: FER, ch: 's', jit: 0 });
      for (const dx of [0.35, 1.05]) b.add(K.cyl(0.012, 0.012, 0.3, 3), { p: [x + dx, 3.92, z], c: FER, jit: 0 });
      b.add(K.box(0.95, 0.66, 0.07), { p: [x + 0.7, 3.45, z], c: BOISD, c2: BOIS, jit: 0.03 });
      b.add(K.box(1.02, 0.07, 0.1), { p: [x + 0.7, 3.8, z], c: dor ? OR : LAI, ch: 's', jit: 0 });
      for (const sz of [1, -1]) {
        b.add(K.box(0.42, 0.11, 0.05), { p: [x + 0.7, 3.47, z + sz * 0.05], c: OR, ch: 's', jit: 0 });
        b.add(K.box(0.2, 0.14, 0.05), { p: [x + 0.7, 3.34, z + sz * 0.05], c: OR, ch: 's', jit: 0 });
        b.add(K.box(0.34, 0.07, 0.05), { p: [x + 0.7, 3.24, z + sz * 0.05], c: OR, ch: 's', jit: 0 });
      }
    }

    // ---- la cheminée de la forge, adossée au mur du fond : souche de pierre, couronne, braises au sommet ; la fumée (pièce animée)
    const HC = gr ? 14.0 : 12.8,
      zc = ZB - T / 2 - 0.62;
    b.add(K.box(2.2, 1.1, 1.4), { p: [0, 0.55, zc], c: PIERDD, c2: PIERD, jit: 0.03 });
    b.add(K.box(2.0, HC - 1.6, 1.24, 0.82, 0.86), {
      p: [0, 1.1 + (HC - 1.6) / 2 - 0.5, zc],
      c: PIERD,
      c2: PIER,
      jit: 0.03
    });
    for (let i = 0; i < 4; i++)
      b.add(K.box(2.1 - i * 0.08, 0.14, 1.32 - i * 0.04), { p: [0, 2.6 + i * 2.2, zc], c: PIERL, jit: 0 });
    b.add(K.box(1.95, 0.4, 1.3), { p: [0, HC - 0.6, zc], c: PIERD, c2: PIERL, jit: 0 });
    b.add(K.box(1.3, 0.12, 0.72), { p: [0, HC - 0.36, zc], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0 });
    if (gr) {
      for (const ax of [1, -1])
        for (const az of [1, -1])
          b.add(K.box(0.3, 0.5, 0.3), { p: [ax * 0.82, HC - 0.15, zc + az * 0.5], c: PIERL, jit: 0 });
      b.add(K.box(1.95, 0.1, 1.3), { p: [0, HC + 0.12, zc], c: dor ? OR : FER, ch: 's', jit: 0 });
    }
    cerc(0, zc, 1.05);
    cerc(-0.7, zc, 0.7);
    cerc(0.7, zc, 0.7);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1,
        y = HC + 0.4 + i * 0.75,
        r = 0.18 + i * 0.12;
      fu.add(K.ico(0.32 + i * 0.1, 0), {
        p: [Math.sin(a) * r, y, zc + Math.cos(a) * r],
        r: [i, i * 2, 0],
        c: K.mix(0x8a8790, 0xe8e6ee, i / 6),
        jit: 0.05
      });
    }

    // ---- dedans : les fermes de charpente (entrait, arbalétriers, poinçon, jambes de force), les pannes, le faîtage
    {
      const yE = HM - 0.35;
      for (const z of PZ) {
        d.add(K.box(2 * W + 0.2, 0.32, 0.3), { p: [0, yE, z], c: BOISD, c2: BOIS, jit: 0.03 });
        d.add(K.box(0.26, HF - yE - 0.3, 0.26), { p: [0, (yE + HF - 0.3) / 2, z], c: BOISD, c2: BOIS, jit: 0.03 });
        for (const sd of [1, -1]) {
          const x0 = sd * (W - 0.2),
            y0 = yE + 0.1,
            x1 = 0,
            y1 = HF - 0.45,
            ln = Math.hypot(x1 - x0, y1 - y0);
          d.add(K.box(ln, 0.26, 0.24), {
            p: [(x0 + x1) / 2, (y0 + y1) / 2, z],
            r: [0, 0, Math.atan2(y1 - y0, x1 - x0)],
            c: BOISD,
            c2: BOIS,
            jit: 0.03
          });
          d.add(K.box(1.9, 0.16, 0.16), { p: [sd * 0.85, yE + 0.95, z], r: [0, 0, -sd * 0.75], c: BOIS, jit: 0.03 });
          // l'aisselier et le corbeau de pierre sous l'entrait
          d.add(K.box(0.4, 0.3, 0.42, 1, 0.7), { p: [sd * (W - 0.15), yE - 0.3, z], r: [PI, 0, 0], c: PIERL, jit: 0 });
          d.add(K.box(1.1, 0.14, 0.14), { p: [sd * (W - 0.55), yE - 0.5, z], r: [0, 0, sd * 0.7], c: BOISD, jit: 0 });
        }
        d.add(K.box(0.24, 0.06, 0.34), { p: [0, yE - 0.18, z], c: FER, jit: 0 });
        // la lampe de mise en valeur, sous l'entrait, au-dessus du présentoir de chaque côté
        for (const sd of [1, -1]) {
          d.add(K.cyl(0.18, 0.1, 0.22, 6), { p: [sd * PX, yE - 0.3, z], c: dor ? OR : FER, ch: 's', jit: 0 });
          d.add(K.cyl(0.15, 0.15, 0.03, 6), { p: [sd * PX, yE - 0.42, z], c: 0xfff2c4, ch: 'g', jit: 0 });
        }
      }
      for (const sd of [1, -1])
        for (const u of [0.33, 0.66]) {
          const x = sd * (W - 0.2) * (1 - u),
            y = yE + 0.1 + (HF - 0.45 - yE - 0.1) * u + 0.12;
          d.add(K.box(0.2, 0.2, ZI - ZJ), { p: [x, y, (ZI + ZJ) / 2], c: BOIS, jit: 0.03 });
        }
      d.add(K.box(0.26, 0.26, ZI - ZJ), { p: [0, HF - 0.45, (ZI + ZJ) / 2], c: BOISD, jit: 0.03 });
    }

    // ---- la forge au fond : le foyer de pierre (braises, flammes), la hotte qui monte dans la cheminée, l'enclume, le soufflet, le bac de trempe, le mur d'outils
    const HW = gr ? 3.0 : 2.2,
      zf = ZJ + 0.7;
    {
      d.add(K.box(HW + 0.3, 0.85, 1.4), { p: [0, Y0 + 0.42, zf], c: PIERDD, c2: PIERD, jit: 0.03 });
      d.add(K.box(HW + 0.45, 0.14, 1.55), { p: [0, Y0 + 0.9, zf], c: PIERL, jit: 0 });
      d.add(K.box(HW - 0.2, 0.14, 1.0), { p: [0, Y0 + 0.98, zf + 0.05], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0.05 });
      for (let i = 0; i < 9; i++)
        d.add(K.oct(0.1 + ((i * 7) % 3) * 0.03), {
          p: [-HW / 2 + 0.35 + ((i * 0.37) % 1) * (HW - 0.7), Y0 + 1.08, zf - 0.3 + ((i * 0.61) % 1) * 0.6],
          r: [i, i * 0.7, 0],
          c: 0x2a2320,
          jit: 0.05
        });
      // les flammes du foyer (canal lumineux) : elles dansent (pièce animée)
      for (let i = 0; i < (gr ? 5 : 3); i++) {
        const x = -HW / 2 + 0.5 + (i * (HW - 1.0)) / ((gr ? 5 : 3) - 1);
        fe.add(K.cone(0.22 - (i % 2) * 0.05, 0.75 - (i % 2) * 0.2, 5), {
          p: [x, Y0 + 1.42 - (i % 2) * 0.1, zf + 0.05],
          r: [0, i, 0],
          c: BRAISE,
          c2: BRAISEL,
          ch: 'g',
          jit: 0
        });
      }
      // la hotte : pyramide de pierre qui rejoint le mur du fond, poutre-manteau, rangée de fers
      d.add(K.box(HW + 0.5, HM - 2.4, 1.5, 0.55, 0.55), {
        p: [0, (HM + 2.4) / 2, ZJ + 0.6],
        c: PIERD,
        c2: PIER,
        jit: 0.03
      });
      d.add(K.box(HW + 0.7, 0.3, 0.3), { p: [0, 2.45, zf + 0.62], c: BOISD, c2: BOIS, jit: 0.03 });
      for (let i = 0; i < 5; i++)
        d.add(K.box(0.04, 0.4, 0.04), { p: [-0.8 + i * 0.4, 2.15, zf + 0.72], c: FER, ch: 's', jit: 0 });
      for (let k = 0; k < (gr ? 3 : 2); k++)
        d.add(K.oct(0.16), { p: [-0.6 + k * 0.6, 2.82, zf + 0.79], c: K.EL[ELK[k * 2]].main, ch: 'g', jit: 0 });
      chaine(-HW / 2 - 0.1, zf + 0.2, HW / 2 + 0.1, zf + 0.2, 0.75);
    }
    // l'enclume sur son billot, le marteau, un lingot rougeoyant, des étincelles
    {
      const z = -1.0;
      d.add(K.cyl(0.4, 0.46, 0.62, 8), { p: [0, Y0 + 0.31, z], c: PAL.barkD, c2: PAL.bark, jit: 0.04 });
      d.add(K.box(0.55, 0.22, 0.42, 0.75, 0.8), { p: [0, Y0 + 0.73, z], c: FER, ch: 's', jit: 0 });
      d.add(K.box(0.3, 0.2, 0.28), { p: [0, Y0 + 0.92, z], c: FER, ch: 's', jit: 0 });
      d.add(K.box(0.95, 0.22, 0.4), { p: [0.05, Y0 + 1.12, z], c: FERL, c2: PAL.steel, ch: 's', jit: 0 });
      d.add(K.cone(0.17, 0.55, 6), {
        p: [0.79, Y0 + 1.12, z],
        r: [0, 0, -PI / 2],
        c: FERL,
        c2: PAL.steel,
        ch: 's',
        jit: 0
      });
      d.add(K.box(0.42, 0.06, 0.1), { p: [-0.1, Y0 + 1.26, z + 0.05], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0 });
      d.add(K.box(0.24, 0.12, 0.13), { p: [0.25, Y0 + 1.3, z - 0.1], r: [0, 0.5, 0], c: PAL.steel, ch: 's', jit: 0 });
      d.add(K.cyl(0.03, 0.03, 0.5, 5), { p: [0.4, Y0 + 1.27, z + 0.08], r: [0, 0.5, PI / 2 - 0.1], c: BOISL, jit: 0 });
      for (let i = 0; i < 6; i++)
        d.add(K.oct(0.025), {
          p: [-0.2 + i * 0.09, Y0 + 1.4 + (i % 3) * 0.12, z + (i % 2) * 0.1],
          c: 0xffe08a,
          ch: 'g',
          jit: 0
        });
      cerc(0, z, 0.62);
      cerc(0.55, z, 0.4);
    }
    // le soufflet (pièce animée : sa planche du haut monte et descend), sur son bâti, à gauche du foyer
    {
      const x = -HW / 2 - 0.95,
        z = zf + 0.1;
      d.add(K.box(0.16, 0.7, 0.16), { p: [x - 0.5, Y0 + 0.35, z], c: BOISD, jit: 0 });
      d.add(K.box(0.16, 0.7, 0.16), { p: [x + 0.5, Y0 + 0.35, z], c: BOISD, jit: 0 });
      d.add(K.box(1.3, 0.08, 0.75, 1, 1), { p: [x, Y0 + 0.74, z], c: BOIS, jit: 0.03 });
      d.add(K.box(1.15, 0.3, 0.62, 0.85, 0.85), { p: [x, Y0 + 0.92, z], c: 0x7a4a2c, c2: 0x9a6038, jit: 0.04 });
      d.add(K.cyl(0.05, 0.08, 0.6, 5), { p: [x + 0.85, Y0 + 0.86, z], r: [0, 0, -PI / 2], c: LAI, ch: 's', jit: 0 });
      so.add(K.box(1.3, 0.07, 0.75), { p: [x, Y0 + 1.1, z], c: BOIS, c2: BOISL, jit: 0.03 });
      so.add(K.box(0.07, 0.07, 0.6), { p: [x - 0.75, Y0 + 1.16, z], c: BOISD, jit: 0 });
      so.add(K.cyl(0.03, 0.03, 0.55, 4), { p: [x - 0.75, Y0 + 1.16, z], r: [PI / 2, 0, 0], c: BOISL, jit: 0 });
      cerc(x, z, 0.75);
    }
    // le bac de trempe (eau), à droite du foyer, et le mur d'outils (marteaux, tenailles) au-dessus
    {
      const x = HW / 2 + 0.9,
        z = zf + 0.05;
      d.add(K.box(0.85, 0.6, 1.2), { p: [x, Y0 + 0.3, z], c: BOISD, c2: BOIS, jit: 0.04 });
      d.add(K.box(0.7, 0.04, 1.05), { p: [x, Y0 + 0.55, z], c: 0x3fa9ff, c2: 0x8fd2ff, ch: 's', jit: 0 });
      for (const dz of [-0.45, 0.45]) d.add(K.box(0.9, 0.06, 0.06), { p: [x, Y0 + 0.45, z + dz], c: FER, jit: 0 });
      cerc(x, z, 0.75);
      d.add(K.box(1.4, 1.1, 0.06), { p: [x, 2.0, ZJ + 0.04], c: BOISD, c2: BOIS, jit: 0.03 });
      for (let i = 0; i < 4; i++) {
        const xx = x - 0.5 + i * 0.33;
        d.add(K.cyl(0.025, 0.025, 0.5, 4), { p: [xx, 1.9, ZJ + 0.12], c: BOISL, jit: 0 });
        d.add(K.box(i % 2 ? 0.08 : 0.2, i % 2 ? 0.3 : 0.1, 0.1), {
          p: [xx, 2.18, ZJ + 0.12],
          c: PAL.steel,
          ch: 's',
          jit: 0
        });
      }
    }
    // la meule d'affûtage (niv. 3) : c'est là que l'affûtage se prépare
    if (gr) {
      const x = 2.05,
        z = -0.35;
      d.add(K.box(0.9, 0.12, 0.5), { p: [x, Y0 + 0.06, z], c: BOISD, jit: 0 });
      for (const dz of [-0.2, 0.2]) d.add(K.box(0.1, 0.75, 0.08), { p: [x, Y0 + 0.45, z + dz], c: BOIS, jit: 0 });
      d.add(K.cyl(0.42, 0.42, 0.16, 10), {
        p: [x, Y0 + 0.82, z],
        r: [PI / 2, 0, 0],
        c: 0xb8ad98,
        c2: 0xd8cdb6,
        jit: 0.04
      });
      d.add(K.cyl(0.03, 0.03, 0.6, 4), { p: [x, Y0 + 0.82, z], r: [PI / 2, 0, 0], c: FER, ch: 's', jit: 0 });
      d.add(K.box(0.45, 0.05, 0.05), { p: [x - 0.1, Y0 + 0.82, z + 0.32], r: [0, 0, -0.5], c: FER, ch: 's', jit: 0 });
      for (let i = 0; i < 5; i++)
        d.add(K.oct(0.02), {
          p: [x - 0.42 - i * 0.07, Y0 + 0.82 + (i % 2) * 0.08, z + 0.05],
          c: 0xffe08a,
          ch: 'g',
          jit: 0
        });
      cerc(x, z, 0.55);
    }

    // ---- les six présentoirs : socle de pierre, colonne, table cerclée de laiton, pupitre de la plaque côté allée ; aux vitrines (niv. 2) une cloche de verre
    for (const [w, sd, j] of QUI) {
      const x = sd * PX,
        z = PZ[j],
        yt = Y0 + 0.88;
      d.add(K.box(1.25, 0.14, 1.25), { p: [x, Y0 + 0.07, z], c: PIERDD, c2: PIERD, jit: 0.02 });
      d.add(K.cyl(0.46, 0.52, 0.18, 8, { a0: PI / 8 }), { p: [x, Y0 + 0.23, z], c: PIERD, c2: PIERL, jit: 0.02 });
      d.add(K.cyl(0.27, 0.33, 0.48, 8, { a0: PI / 8 }), {
        p: [x, Y0 + 0.56, z],
        c: vit ? 0x5a3424 : BOISD,
        c2: vit ? 0x8a5232 : BOIS,
        jit: 0.02
      });
      d.add(K.cyl(0.64, 0.4, 0.12, 10), {
        p: [x, yt - 0.06, z],
        c: vit ? 0x4a3024 : BOISD,
        c2: vit ? 0x7a4a30 : BOISL,
        jit: 0
      });
      d.add(K.torus(0.64, 0.03, 3, 14), { p: [x, yt, z], r: [PI / 2, 0, 0], c: TR, ch: TRch, jit: 0 });
      for (const r of [0.35, 0.79])
        d.add(K.torus(0.3 + r * 0.05, 0.025, 3, 10), { p: [x, Y0 + r, z], r: [PI / 2, 0, 0], c: TR, ch: 's', jit: 0 });
      // le pupitre de la plaque, incliné vers l'allée
      d.add(K.box(0.07, 0.5, 0.07), { p: [x - sd * 0.8, Y0 + 0.25, z], c: FER, ch: 's', jit: 0 });
      d.add(K.box(0.05, 0.3, 0.64), { p: [x - sd * 0.82, Y0 + 0.55, z], r: [0, 0, sd * 0.55], c: TR, ch: 's', jit: 0 });
      if (vit) {
        d.add(K.cyl(0.6, 0.6, 0.95, 12, { open: true }), {
          p: [x, yt + 0.48, z],
          c: VERRE,
          c2: 0x183644,
          ch: 'x',
          jit: 0
        });
        d.add(K.torus(0.61, 0.035, 3, 14), { p: [x, yt + 0.96, z], r: [PI / 2, 0, 0], c: TR, ch: 's', jit: 0 });
        d.add(K.cyl(0.36, 0.62, 0.18, 12), { p: [x, yt + 1.05, z], c: TR, c2: dor ? 0xfff2c4 : LAIL, ch: 's', jit: 0 });
        d.add(K.oct(0.09), {
          p: [x, yt + 1.24, z],
          s: [1, 1.5, 1],
          c: dor ? 0xfff2c4 : OR,
          ch: dor ? 'g' : 's',
          jit: 0
        });
        for (let k = 0; k < 4; k++) {
          const a = PI / 4 + (k * PI) / 2;
          d.add(K.cyl(0.018, 0.018, 0.95, 4), {
            p: [x + Math.sin(a) * 0.61, yt + 0.48, z + Math.cos(a) * 0.61],
            c: TR,
            ch: 's',
            jit: 0
          });
        }
      }
      cerc(x, z, 0.75);
      cerc(x - sd * 0.8, z, 0.35);
      // l'arme flotte au-dessus de la table ; la plaque est posée sur le pupitre, face à l'allée
      spots.push({ w, x, y: yt + 0.42, z, sd, plaque: [x - sd * 0.845, Y0 + 0.565, z, -sd * (PI / 2), 0.55] });
    }

    // ---- les râteliers muraux de part et d'autre de la porte (fusils de bois, lances), les caisses de munitions, les écus des six éléments (niv. 2)
    for (const sd of [1, -1]) {
      const x = sd * 3.1,
        z = ZI - 0.12;
      d.add(K.box(1.8, 0.1, 0.22), { p: [x, 0.95, z], c: BOIS, jit: 0.03 });
      d.add(K.box(1.8, 0.1, 0.18), { p: [x, 2.0, z], c: BOIS, jit: 0.03 });
      for (let i = 0; i < 5; i++) {
        const xx = x - 0.7 + i * 0.35;
        d.add(K.box(0.09, 0.6, 0.1), { p: [xx, 0.75, z - 0.02], c: BOISD, jit: 0.03 });
        d.add(K.box(0.05, 1.3, 0.06), { p: [xx, 1.65, z - 0.02], c: i % 2 ? FER : PAL.steel, ch: 's', jit: 0 });
      }
      chaine(x - 0.7, z - 0.1, x + 0.7, z - 0.1, 0.4);
      // les caisses de munitions, dans les coins du fond
      const cx = sd * 3.75,
        cz = ZJ + 0.5;
      d.add(K.box(0.9, 0.6, 0.65), { p: [cx, Y0 + 0.3, cz], c: OD(0), c2: OD(1), jit: 0.04 });
      d.add(K.box(0.7, 0.5, 0.55), {
        p: [cx + sd * 0.05, Y0 + 0.86, cz],
        r: [0, 0.2, 0],
        c: OD(0),
        c2: OD(1),
        jit: 0.04
      });
      d.add(K.box(0.92, 0.06, 0.67), { p: [cx, Y0 + 0.45, cz], c: FER, jit: 0 });
      d.add(K.box(0.3, 0.12, 0.02), { p: [cx, Y0 + 0.3, cz + 0.33], c: 0xffe08a, jit: 0 });
      cerc(cx, cz, 0.6);
      if (vit)
        for (let k = 0; k < 3; k++) {
          const el = ELK[sd > 0 ? k : 3 + k],
            E = K.EL[el],
            zz = PZ[k];
          d.add(K.cyl(0.42, 0.42, 0.08, 10), {
            p: [sd * (W - 0.05), 4.45 + DH, zz],
            r: [0, 0, PI / 2],
            c: E.dark,
            c2: E.main,
            jit: 0
          });
          d.add(K.torus(0.42, 0.045, 3, 12), {
            p: [sd * (W - 0.1), 4.45 + DH, zz],
            r: [0, PI / 2, 0],
            c: TR,
            ch: 's',
            jit: 0
          });
          d.add(K.oct(0.1), { p: [sd * (W - 0.12), 4.45 + DH, zz], c: E.glow, ch: 'g', jit: 0 });
          for (const r of [0.6, -0.6])
            d.add(K.box(0.06, 1.1, 0.06), {
              p: [sd * (W - 0.15), 4.45 + DH, zz],
              r: [r, 0, 0],
              c: PAL.steel,
              ch: 's',
              jit: 0
            });
        }
    }
    // les lustres de fer (deux), bougies allumées
    if (vit)
      for (const z of [1.6, -0.8]) {
        d.add(K.cyl(0.02, 0.02, HF - 5.6, 4), { p: [0, (HF + 5.6) / 2 - 0.4, z], c: FER, jit: 0 });
        d.add(K.torus(0.6, 0.05, 3, 10), { p: [0, 5.2, z], r: [PI / 2, 0, 0], c: dor ? OR : FER, ch: 's', jit: 0 });
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6;
          d.add(K.cyl(0.04, 0.04, 0.18, 4), {
            p: [Math.sin(a) * 0.6, 5.32, z + Math.cos(a) * 0.6],
            c: PAL.cream,
            jit: 0
          });
          d.add(K.oct(0.06), {
            p: [Math.sin(a) * 0.6, 5.5, z + Math.cos(a) * 0.6],
            s: [1, 1.6, 1],
            c: 0xffe08a,
            ch: 'g',
            jit: 0
          });
        }
      }

    // ---- dehors, devant la façade : la cible d'entraînement, les caisses et les tonneaux
    {
      b.group({ p: [3.85, 0, ZF + T / 2 + 1.5], r: [0, -0.5, 0] }, b => {
        for (const sd of [1, -1])
          b.add(K.box(0.09, 1.7, 0.09), { p: [sd * 0.45, 0.82, -0.1], r: [-0.2, 0, sd * 0.08], c: BOIS, jit: 0 });
        b.add(K.box(0.09, 1.6, 0.09), { p: [0, 0.75, -0.45], r: [0.45, 0, 0], c: BOISD, jit: 0 });
        b.add(K.cyl(0.58, 0.58, 0.16, 12), {
          p: [0, 1.3, 0],
          r: [PI / 2 - 0.2, 0, 0],
          c: PAL.rope,
          c2: PAL.sand,
          jit: 0.03
        });
        [0.46, 0.32, 0.18].forEach((r, i) =>
          b.add(K.cyl(r, r, 0.17 + i * 0.01, 12), {
            p: [0, 1.3, 0],
            r: [PI / 2 - 0.2, 0, 0],
            c: i % 2 ? PAL.white : PAL.cloth,
            jit: 0
          })
        );
        b.add(K.cyl(0.07, 0.07, 0.2, 8), { p: [0, 1.3, 0], r: [PI / 2 - 0.2, 0, 0], c: OR, ch: 's', jit: 0 });
      });
      cerc(3.85, ZF + T / 2 + 1.45, 0.75);
      b.add(K.box(1.0, 0.75, 0.8), {
        p: [-3.7, 0.37, ZF + T / 2 + 1.3],
        r: [0, 0.15, 0],
        c: OD(0),
        c2: OD(1),
        jit: 0.04
      });
      b.add(K.box(0.75, 0.6, 0.6), {
        p: [-3.65, 1.05, ZF + T / 2 + 1.25],
        r: [0, -0.2, 0],
        c: OD(0),
        c2: OD(1),
        jit: 0.04
      });
      b.add(K.box(0.3, 0.14, 0.02), { p: [-3.7, 0.4, ZF + T / 2 + 1.72], c: 0xffe08a, jit: 0 });
      b.add(K.cyl(0.36, 0.32, 0.85, 9), { p: [-4.6, 0.43, ZF + T / 2 + 0.75], c: BOIS, c2: BOISL, jit: 0.04 });
      b.add(K.torus(0.35, 0.03, 3, 10), { p: [-4.6, 0.65, ZF + T / 2 + 0.75], r: [PI / 2, 0, 0], c: FER, jit: 0 });
      cerc(-3.7, ZF + T / 2 + 1.3, 0.75);
      cerc(-4.6, ZF + T / 2 + 0.75, 0.45);
    }

    // ---- niveau 2 : les bannières orange de l'arsenal sur la façade (aux dorures, six bannières aux couleurs des éléments)
    const banniere = (x, c, c2, h) => {
      const y = 5.6 + DH * 0.5;
      b.add(K.box(0.85, 0.07, 0.07), { p: [x, y + 0.05, ZF + T / 2 + 0.1], c: dor ? OR : FER, ch: 's', jit: 0 });
      b.add(K.box(0.7, h, 0.04), { p: [x, y - h / 2, ZF + T / 2 + 0.08], c: c2, c2: c, jit: 0.02 });
      b.add(
        K.prism(
          [
            [-0.35, 0],
            [0.35, 0],
            [0.35, -0.45],
            [0, -0.22],
            [-0.35, -0.45]
          ],
          0.04
        ),
        {
          p: [x, y - h, ZF + T / 2 + 0.06],
          r: [PI / 2, 0, 0],
          s: [1, 1, -1],
          c: c2,
          jit: 0
        }
      );
      b.add(K.oct(0.1), {
        p: [x, y - h * 0.4, ZF + T / 2 + 0.12],
        c: dor ? OR : 0xffe08a,
        ch: dor ? 's' : 'm',
        jit: 0
      });
    };
    if (dor) ELK.forEach((el, i) => banniere((i < 3 ? -1 : 1) * (2.55 + (i % 3)), K.EL[el].main, K.EL[el].dark, 1.9));
    else if (vit) for (const sd of [1, -1]) banniere(sd * 3.6, ORANGE, ORANGED, 2.2);

    // ---- niveau 3 : la forge s'agrandit — l'appentis contre le mur droit (poteaux, toit de tuiles), le tas de charbon, le bois, un second foyer
    if (gr) {
      const x0 = WO,
        x1 = 6.95,
        z0 = -4.15,
        z1 = -1.75;
      for (const z of [z0, (z0 + z1) / 2, z1]) {
        b.add(K.box(0.22, 2.7, 0.22), { p: [x1 - 0.12, 1.35, z], c: BOISD, c2: BOIS, jit: 0.03 });
        b.add(K.box(0.3, 0.2, 0.3), { p: [x1 - 0.12, 0.1, z], c: PIERD, jit: 0 });
        cerc(x1 - 0.12, z, 0.3);
      }
      b.add(K.box(0.2, 0.2, z1 - z0 + 0.3), { p: [x1 - 0.12, 2.72, (z0 + z1) / 2], c: BOISD, jit: 0 });
      const al = Math.atan2(4.6 - 2.8, x1 - x0),
        sl = Math.hypot(x1 - x0 + 0.3, 4.6 - 2.8);
      b.add(K.box(sl, 0.2, z1 - z0 + 0.5), {
        p: [(x0 + x1) / 2 + 0.05, 3.72, (z0 + z1) / 2],
        r: [0, 0, -al],
        c: PAL.plank,
        c2: TUIL,
        jit: 0.05
      });
      for (let i = 0; i < 3; i++)
        b.add(K.box(0.65, 0.08, z1 - z0 + 0.55), {
          p: [x0 + 0.5 + i * 0.7, 4.38 - i * 0.48, (z0 + z1) / 2],
          r: [0, 0, -al],
          c: i % 2 ? TUILL : TUIL,
          jit: 0.05
        });
      // le second foyer : un four de pierre bas, gueule rougeoyante
      b.add(K.box(1.3, 1.1, 1.2), { p: [6.2, 0.55, -3.45], c: PIERDD, c2: PIERD, jit: 0.03 });
      b.add(K.cyl(0.55, 0.65, 0.5, 8), { p: [6.2, 1.35, -3.45], c: PIERD, c2: PIER, jit: 0.03 });
      b.add(K.box(0.6, 0.45, 0.06), { p: [6.2, 0.6, -2.84], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0 });
      b.add(K.cyl(0.22, 0.26, 3.6, 6), { p: [6.2, 3.3, -3.45], c: PIERD, c2: PIER, jit: 0.03 });
      b.add(K.cyl(0.3, 0.3, 0.2, 6), { p: [6.2, 5.2, -3.45], c: FER, ch: 's', jit: 0 });
      cerc(6.2, -3.45, 0.8);
      // le charbon et le bois de chauffe
      for (let i = 0; i < 7; i++)
        b.add(K.rock(0.28, 30 + i, 0, 0.3), {
          p: [6.4 + (i % 3) * 0.22 - 0.2, 0.2 + Math.floor(i / 3) * 0.2, -2.3 + (i % 2) * 0.3],
          c: 0x2e2a2a,
          jit: 0.05
        });
      for (let i = 0; i < 6; i++)
        b.add(K.cyl(0.11, 0.11, 1.0, 6), {
          p: [5.85 + (i % 3) * 0.24, 0.13 + Math.floor(i / 3) * 0.2, -1.95],
          r: [0, 0, PI / 2 + 0.02 * i],
          s: [1, 1, 1],
          c: PAL.bark,
          c2: PAL.woodL,
          jit: 0.05
        });
      cerc(6.3, -2.15, 0.7);
    }

    // ---- niveau 4 : la tour de guet, à l'angle avant gauche (meurtrières, mâchicoulis, créneaux, guérite au toit pointu, drapeau)
    if (L >= 4) {
      const x = -6.1,
        z = 3.3,
        w = 2.4,
        H1 = 12.4;
      b.add(K.box(w + 0.3, 1.2, w + 0.3), { p: [x, 0.6, z], c: PIERDD, c2: PIERD, jit: 0.03 });
      b.add(K.box(w, H1, w, 0.94, 0.94), { p: [x, H1 / 2, z], c: PIERD, c2: PIER, jit: 0.025 });
      for (const y of [4.0, 8.2]) b.add(K.box(w + 0.1, 0.16, w + 0.1), { p: [x, y, z], c: PIERL, jit: 0 });
      for (const [fx, fz] of [
        [0, 1],
        [-1, 0],
        [0, -1]
      ])
        for (const y of [2.6, 6.2, 10.2]) {
          b.add(K.box(fz ? 0.16 : 0.08, 0.85, fz ? 0.08 : 0.16), {
            p: [x + fx * (w / 2 - 0.05), y, z + fz * (w / 2 - 0.05)],
            c: y > 10 ? VITRE : 0x2a2320,
            ch: y > 10 ? 'g' : 'm',
            jit: 0
          });
        }
      // mâchicoulis : corbeaux et parapet en encorbellement, huit merlons
      for (let i = 0; i < 4; i++)
        for (let k = 0; k < 3; k++) {
          const a = (i * PI) / 2,
            u = (k - 1) * 0.85;
          b.add(K.box(0.24, 0.45, 0.3, 1, 0.5), {
            p: [
              x + Math.sin(a) * (w / 2 + 0.05) + Math.cos(a) * u,
              H1 - 0.05,
              z + Math.cos(a) * (w / 2 + 0.05) - Math.sin(a) * u
            ],
            r: [PI, a, 0],
            c: PIERL,
            jit: 0
          });
        }
      b.add(K.box(w + 0.8, 0.55, w + 0.8), { p: [x, H1 + 0.45, z], c: PIERD, c2: PIER, jit: 0.02 });
      for (let i = 0; i < 4; i++)
        for (let k = 0; k < 2; k++) {
          const a = (i * PI) / 2,
            u = k ? 0.75 : -0.75;
          b.add(K.box(0.6, 0.7, 0.3), {
            p: [
              x + Math.sin(a) * (w / 2 + 0.25) + Math.cos(a) * u,
              H1 + 1.05,
              z + Math.cos(a) * (w / 2 + 0.25) - Math.sin(a) * u
            ],
            r: [0, a, 0],
            c: PIERD,
            c2: PIERL,
            jit: 0.03
          });
        }
      // la guérite : quatre poteaux, toit de tuiles en pyramide, épi et drapeau
      for (const ax of [1, -1])
        for (const az of [1, -1])
          b.add(K.box(0.16, 1.7, 0.16), { p: [x + ax * 0.75, H1 + 1.55, z + az * 0.75], c: BOISD, jit: 0 });
      b.add(K.cone(1.7, 2.3, 4), { p: [x, H1 + 3.55, z], r: [0, PI / 4, 0], c: TUIL, c2: TUILL, jit: 0.04 });
      b.add(K.cyl(0.03, 0.04, 2.2, 4), { p: [x, H1 + 5.6, z], c: dor ? OR : FER, ch: 's', jit: 0 });
      b.add(K.oct(0.14), { p: [x, H1 + 6.75, z], s: [1, 1.5, 1], c: dor ? OR : LAIL, ch: 's', jit: 0 });
      b.add(
        K.prism(
          [
            [0, 0],
            [1.3, -0.12],
            [1.05, 0.35],
            [1.3, 0.8],
            [0, 0.7]
          ],
          0.04
        ),
        {
          p: [x + 0.04, H1 + 5.9, z],
          r: [PI / 2, 0, 0],
          s: [1, 1, -1],
          c: dor ? OR : ORANGED,
          c2: dor ? 0xfff2c4 : ORANGE,
          ch: dor ? 's' : 'm',
          jit: 0
        }
      );
      // aux dorures, une girouette d'or en forme d'enclume
      if (dor) b.add(K.box(0.5, 0.18, 0.12, 0.6, 1), { p: [x, H1 + 4.75, z], c: OR, ch: 's', jit: 0 });
      for (const ax of [1, -1]) for (const az of [1, -1]) cerc(x + ax * 0.55, z + az * 0.55, 0.85);
    }

    // ---- niveau 5 : les remparts — créneaux sur les murs latéraux, la bretèche au-dessus de la porte, l'échauguette à l'angle avant droit, deux braseros
    if (L >= 5) {
      for (const sd of [1, -1]) {
        for (let i = 0; i < 8; i++) {
          const z = ZB + 0.1 + i * ((ZF - ZB) / 7);
          if (sd < 0 && L >= 4 && z > 1.9) continue;
          b.add(K.box(0.42, 0.75, 0.62), { p: [sd * (WO - 0.2), HM + 0.35, z], c: PIERD, c2: PIERL, jit: 0.03 });
        }
        b.add(K.box(0.42, 0.25, ZF - ZB + T), { p: [sd * (WO - 0.2), HM + 0.05, (ZF + ZB) / 2], c: PIERD, jit: 0 });
      }
      // la bretèche : un balcon de pierre sur corbeaux, ses créneaux
      const z = ZF + T / 2;
      for (let i = 0; i < 5; i++)
        b.add(K.box(0.24, 0.55, 0.6, 1, 0.4), {
          p: [-1.6 + i * 0.8, 5.2 + DH, z + 0.25],
          r: [PI, 0, 0],
          c: PIERL,
          jit: 0
        });
      b.add(K.box(4.0, 0.9, 0.7), { p: [0, 5.95 + DH, z + 0.35], c: PIERD, c2: PIER, jit: 0.02 });
      for (let i = 0; i < 4; i++)
        b.add(K.box(0.6, 0.6, 0.72), { p: [-1.5 + i * 1.0, 6.7 + DH, z + 0.35], c: PIERD, c2: PIERL, jit: 0.03 });
      for (let i = 0; i < 3; i++)
        b.add(K.box(0.12, 0.45, 0.04), { p: [-1.0 + i * 1.0, 5.95 + DH, z + 0.71], c: 0x2a2320, jit: 0 });
      // l'échauguette : une tourelle ronde en encorbellement, toit conique
      {
        const x = WO - 0.15,
          zz = ZF + T / 2 - 0.15;
        b.add(K.cone(0.8, 1.2, 8), { p: [x, 4.6 + DH, zz], r: [PI, 0, 0], c: PIERD, c2: PIERL, jit: 0.03 });
        b.add(K.cyl(0.8, 0.8, 2.4, 8), { p: [x, 6.4 + DH, zz], c: PIERD, c2: PIER, jit: 0.03 });
        b.add(K.cyl(0.9, 0.9, 0.18, 8), { p: [x, 7.65 + DH, zz], c: dor ? OR : PIERL, ch: dor ? 's' : 'm', jit: 0 });
        b.add(K.box(0.1, 0.6, 0.06), {
          p: [x + 0.55, 6.5 + DH, zz + 0.55],
          r: [0, PI / 4, 0],
          c: VITRE,
          ch: 'g',
          jit: 0
        });
        b.add(K.cone(1.0, 2.1, 8), { p: [x, 8.8 + DH, zz], c: TUIL, c2: TUILL, jit: 0.04 });
        b.add(K.oct(0.12), { p: [x, 9.95 + DH, zz], s: [1, 1.5, 1], c: dor ? OR : LAIL, ch: 's', jit: 0 });
      }
      // deux braseros sur pied devant la porte
      for (const sd of [1, -1]) {
        const x = sd * 2.55,
          zz = ZF + T / 2 + 1.25;
        b.add(K.cyl(0.08, 0.14, 1.0, 5), { p: [x, 0.5, zz], c: FER, ch: 's', jit: 0 });
        b.add(K.cyl(0.38, 0.2, 0.3, 8), {
          p: [x, 1.12, zz],
          c: dor ? OR : FER,
          c2: dor ? 0xfff2c4 : FERL,
          ch: 's',
          jit: 0
        });
        b.add(K.cyl(0.32, 0.32, 0.05, 8), { p: [x, 1.27, zz], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0 });
        fe.add(K.cone(0.24, 0.6, 5), { p: [x, 1.55, zz], c: BRAISE, c2: BRAISEL, ch: 'g', jit: 0 });
        cerc(x, zz, 0.42);
      }
    }

    // ---- niveau 6 : les dorures — chaînes d'angle d'or, statues de chevaliers d'or de part et d'autre des marches
    if (dor)
      for (const sd of [1, -1]) {
        const x = sd * 4.45,
          z = ZF + T / 2 + 1.4;
        b.add(K.box(0.9, 0.8, 0.9), { p: [x, 0.4, z], c: PIERD, c2: PIERL, jit: 0.02 });
        b.add(K.box(0.95, 0.1, 0.95), { p: [x, 0.83, z], c: OR, ch: 's', jit: 0 });
        b.group({ p: [x, 0.88, z], r: [0, sd * 0.35, 0] }, b => {
          for (const k of [1, -1])
            b.add(K.box(0.16, 0.7, 0.2), { p: [k * 0.12, 0.35, 0], c: ORD, c2: OR, ch: 's', jit: 0 });
          b.add(K.box(0.5, 0.65, 0.3, 0.85, 0.85), { p: [0, 1.02, 0], c: ORD, c2: OR, ch: 's', jit: 0 });
          b.add(K.sph(0.15, 8, 6), { p: [0, 1.5, 0], c: OR, ch: 's', jit: 0 });
          b.add(K.cone(0.05, 0.3, 4), { p: [0, 1.75, 0], c: OR, ch: 's', jit: 0 });
          b.add(K.box(0.08, 1.5, 0.08), { p: [-sd * 0.32, 1.0, 0.18], c: OR, ch: 's', jit: 0 });
          b.add(K.cone(0.07, 0.3, 4), { p: [-sd * 0.32, 1.9, 0.18], c: 0xfff2c4, ch: 'g', jit: 0 });
          plaque(b, ecu(0.45, 0.6), 0.06, { p: [sd * 0.3, 1.0, 0.2], c: ORD, c2: OR, ch: 's', jit: 0 });
        });
        cerc(x, z, 0.62);
      }

    const D = ZF + T / 2;
    return {
      parts: [
        { name: 'body', b },
        { name: 'dedans', b: d, parent: 'body' },
        {
          name: 'feu',
          b: fe,
          parent: 'body',
          pivot: [0, Y0 + 1.0, zf],
          anim: [{ k: 'scl', axis: 'y', amp: 0.12, sp: 11 }]
        },
        {
          name: 'soufflet',
          b: so,
          parent: 'body',
          pivot: [-HW / 2 - 0.95 + 0.65, Y0 + 1.1, zf + 0.1],
          anim: [{ k: 'rot', axis: 'z', amp: 0.09, sp: 2.2 }]
        },
        {
          name: 'fumee',
          b: fu,
          parent: 'body',
          pivot: [0, HC, zc],
          anim: [
            { k: 'rot', axis: 'y', spin: true, sp: 0.35 },
            { k: 'scl', axis: 'y', amp: 0.08, sp: 0.9 }
          ]
        }
      ],
      bake: { ground: 0.12, groundH: 0.6 },
      spots,
      col,
      porte: [0, D + 2.0],
      forge: [0, Y0 + 1.3, zf + 0.2],
      lab: [0, L >= 4 ? 17.6 : 14.2, ZF],
      rad: 8.7
    };
  };
  // les caisses de munitions, vert armée
  const OD = k => (k ? 0x7a8452 : 0x56603f);
  MODELS['vil.armes'] = arsenal;

  // une arme exposée : le modèle en main sans les gants ni les manches (couleur témoin, comme les photos du menu), teinté par son élément
  MODELS['arm.expo'] = ctx => {
    const S0 = 0x010203,
      a = String(ctx.a || 'pistolet'),
      f = MODELS['vm.' + a] || MODELS['vm.pistolet'],
      rec = f({ el: ctx.el, H: { sleeve: S0, sleeveD: S0, glove: S0, gloveD: S0 } });
    for (const pt of rec.parts) {
      const it = pt.b.items;
      for (let i = it.length - 1; i >= 0; i--) {
        const o = it[i].o;
        if (o.c === S0 || o.c2 === S0 || o.nophoto) it.splice(i, 1);
      }
    }
    return rec;
  };
}
