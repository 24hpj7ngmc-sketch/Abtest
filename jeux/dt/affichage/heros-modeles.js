// ===================== DERNIER TOIT — l'affichage : les modèles des effets des héros =====================
// Modèles low-poly cuits une fois par le kit, comme le décor (mais rangés ici, avec leurs effets) : le rempart de Roc (entier, abîmé),
// la touffe de ronces et l'arbre gardien de Sylve, la flèche des gardiens, le météore de Braise, le pic de l'Onde de choc, le nuage d'orage de Volt.
// Attend : K (gfx/kit.js), MODELS ; exécuté au chargement (les recettes, elles, ne sont appelées qu'au premier ultime ou compétence).
// Fournit : MODELS['hx.rempart'], ['hx.ronce'], ['hx.arbre'], ['hx.fleche'], ['hx.meteore'], ['hx.pic'], ['hx.nuage'] (lus par heros.js).
// V5.3 : ctx.el (facultatif) : un autre élément que celui du héros d'origine habille le modèle (palette K.EL ; absent : comme avant).
// Formes faites de graines K.make(n) et K.rng(n) : ne changer ni l'ordre des ajouts, ni les graines, ni les nombres.
// le rempart de Roc : trois rangées de blocs en quinconce (9 m × 2,6 m × 1,1 m), des pointes de roche dessus, la terre soulevée au pied. bad : abîmé
MODELS['hx.rempart'] = ctx => {
  const bad = +ctx.bad || 0,
    b = K.make(941 + bad),
    R = K.rng(77 + bad * 5),
    al = ctx.el && ctx.el !== 'terre' && K.EL[ctx.el],
    E = al || K.EL.terre,
    cols = al
      ? [E.main, K.mix(E.main, E.dark, 0.3), K.mix(E.main, E.dark, 0.55), E.light, K.mix(E.light, E.dark, 0.3)]
      : [E.main, 0xb7844c, 0x9c7044, E.light, 0xa98a62];
  for (let r = 0; r < 3; r++) {
    const n = r % 2 ? 5 : 6,
      w = 9 / n,
      h = 0.87,
      y = r * h + h / 2;
    for (let i = 0; i < n; i++) {
      const c = cols[Math.floor(R() * cols.length)],
        gone = bad && r === 2 && R() < 0.5,
        tl = bad ? (R() - 0.5) * 0.35 : (R() - 0.5) * 0.06,
        dz = (R() - 0.5) * 0.08,
        dx = bad ? (R() - 0.5) * 0.2 : 0,
        dy = bad && r === 2 ? 0.12 + R() * 0.2 : 0;
      if (gone) continue;
      b.add(K.box(w - 0.08, h - 0.06, 1.04 + R() * 0.14, 0.9, 0.92), {
        p: [-4.5 + w * (i + 0.5) + dx, y - dy, dz],
        r: [tl * 0.4, 0, tl],
        c,
        c2: K.mix(c, 0xffffff, 0.16)
      });
    }
  }
  for (let i = 0; i < 5; i++) {
    if (bad && i % 2) continue;
    b.add(K.rock(0.42 + R() * 0.22, 11 + i, 1, 0.35), {
      p: [-3.6 + i * 1.8 + (R() - 0.5) * 0.5, 2.66, (R() - 0.5) * 0.3],
      s: [1, 1.3, 0.85],
      c: E.dark,
      c2: E.light
    });
  }
  b.sym(s => {
    for (let i = 0; i < 6; i++)
      b.add(K.rock(0.5 + R() * 0.3, 31 + i + (s > 0 ? 7 : 0), 1, 0.3), {
        p: [-4 + i * 1.6, 0.02, s * (0.72 + R() * 0.2)],
        s: [1.3, 0.5, 1],
        c: al ? E.dark : 0x6e5236,
        c2: E.main
      });
  });
  if (bad)
    for (let i = 0; i < 6; i++)
      b.add(K.rock(0.22 + R() * 0.2, 51 + i, 0, 0.3), {
        p: [-4 + R() * 8, 0.12, (R() < 0.5 ? -1 : 1) * (0.95 + R() * 0.6)],
        c: E.dark,
        c2: E.main
      });
  return b;
};
// une touffe de ronces : tiges arquées hérissées d'épines rouges, une boule de feuillage sombre, quelques feuilles
MODELS['hx.ronce'] = ctx => {
  const b = K.make(951),
    R = K.rng(91),
    al = ctx && ctx.el && ctx.el !== 'bois' && K.EL[ctx.el],
    E = al || K.EL.bois;
  b.add(K.dome(0.6, 7, 3), { s: [1, 0.8, 1], c: E.deep, c2: E.dark });
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * K.TAU + R() * 0.5,
      l = 0.9 + R() * 0.7,
      h = 0.8 + R() * 0.9,
      ca = Math.cos(a),
      sa = Math.sin(a),
      path = K.curve(
        [
          [0, 0, 0],
          [ca * l * 0.25, h * 0.75, sa * l * 0.25],
          [ca * l * 0.7, h, sa * l * 0.7],
          [ca * l, h * 0.45, sa * l]
        ],
        6
      );
    b.add(K.tube(path, [0.08, 0.07, 0.06, 0.05, 0.04, 0.025, 0], 5), { c: E.deep, c2: E.dark });
    for (let j = 1; j < 6; j++)
      b.add(K.cone(0.04, 0.2, 4), { p: path[j], r: [R() * 6.3, R() * 6.3, R() * 6.3], c: al ? E.glow : 0xb0503a });
    const q = path[3];
    b.add(K.oct(0.15), { p: [q[0], q[1] + 0.05, q[2]], s: [1.4, 0.35, 0.8], r: [0, -a, 0], c: R() < 0.5 ? E.main : E.light });
  }
  return b;
};
// arbre gardien de Sylve : tronc et racines, trois étages de feuillage taillé, un cristal vert lumineux au sommet (canal 'g') d'où partent les flèches
MODELS['hx.arbre'] = ctx => {
  const b = K.make(961),
    R = K.rng(97),
    al = ctx && ctx.el && ctx.el !== 'bois' && K.EL[ctx.el],
    E = al || K.EL.bois,
    P = K.PAL;
  b.add(K.cyl(0.34, 0.6, 3.6, 7), { p: [0, 1.8, 0], c: P.barkD, c2: P.bark });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * K.TAU + 0.4;
    b.add(K.cone(0.32, 1.5, 5), {
      p: [Math.cos(a) * 0.55, 0.25, Math.sin(a) * 0.55],
      r: [Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25],
      c: P.barkD,
      c2: P.bark
    });
  }
  for (const q of [
    [2.4, 2.8, 3.7, E.deep, E.dark],
    [1.9, 2.4, 5.1, E.dark, E.main],
    [1.3, 2.1, 6.3, E.main, E.light]
  ])
    b.add(K.cone(q[0], q[1], 7), { p: [0, q[2], 0], r: [0, R(), 0], c: q[3], c2: q[4] });
  b.add(K.oct(0.42), { p: [0, 7.9, 0], s: [1, 1.5, 1], c: E.light, c2: E.glow, ch: 'g' });
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * K.TAU;
    b.add(K.oct(0.14), { p: [Math.cos(a) * 0.75, 7.6, Math.sin(a) * 0.75], c: E.glow, ch: 'g' });
  }
  return b;
};
// flèche verte lumineuse (pointe vers +z)
MODELS['hx.fleche'] = ctx => {
  const b = K.make(971),
    E = (ctx && ctx.el && K.EL[ctx.el]) || K.EL.bois;
  b.add(K.box(0.07, 0.07, 1.3), { c: E.light, ch: 'g' });
  b.add(K.cone(0.12, 0.36, 4), { p: [0, 0, 0.8], r: [Math.PI / 2, 0, 0], c: E.glow, ch: 'g' });
  for (let k = 0; k < 3; k++)
    b.group({ r: [0, 0, (k * K.TAU) / 3] }, g => g.add(K.box(0.02, 0.16, 0.3), { p: [0, 0.09, -0.55], c: E.main, ch: 'g' }));
  return b;
};
// météore : roche en fusion (sombre en bas, incandescente en haut), non éclairée pour qu'elle brille
MODELS['hx.meteore'] = ctx => {
  const b = K.make(981),
    al = ctx && ctx.el && ctx.el !== 'feu' && K.EL[ctx.el];
  b.add(K.rock(1, 7, 1, 0.32), al ? { c: al.dark, c2: al.light, ch: 'g' } : { c: 0x7a1e0c, c2: 0xffb050, ch: 'g' });
  return b;
};
// pic de terre de l'Onde de choc
MODELS['hx.pic'] = ctx => {
  const b = K.make(991),
    al = ctx && ctx.el && ctx.el !== 'terre' && K.EL[ctx.el],
    E = al || K.EL.terre;
  b.add(K.cone(0.75, 2.2, 5), { p: [0, 1.1, 0], c: E.dark, c2: E.light });
  b.add(K.cone(0.4, 1.3, 5), { p: [0.55, 0.65, 0.2], r: [0, 0, -0.35], c: E.dark, c2: E.main });
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * K.TAU + 0.5;
    b.add(K.rock(0.32, 61 + k, 0, 0.3), {
      p: [Math.cos(a) * 0.8, 0.08, Math.sin(a) * 0.8],
      s: [1, 0.6, 1],
      c: al ? E.dark : 0x6e5236,
      c2: E.main
    });
  }
  return b;
};
// nuage d'orage de Volt : une dizaine de boules aplaties, sombres dessous
MODELS['hx.nuage'] = () => {
  const b = K.make(1001),
    R = K.rng(66);
  for (let k = 0; k < 11; k++) {
    const a = k * 2.4,
      d = k ? 2 + R() * 4.5 : 0,
      s = 2.2 + R() * 1.8;
    b.add(K.ico(s, 1), { p: [Math.cos(a) * d, (R() - 0.3) * 1.2, Math.sin(a) * d], s: [1.15, 0.62, 1.05], c: 0x2a2f3b, c2: 0x6b7385 });
  }
  return b;
};
