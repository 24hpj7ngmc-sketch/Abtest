// ===================== L'IMMEUBLE : niveaux, façades, escalier, étages, balcons, boutiques, passerelles =====================
// Une seule description sert à tout : collisions du joueur, balles arrêtées par les murs, marche des zombies, et dessin (gfx/models/toit.js).
// Repère : mètres, +Y en haut, immeuble centré sur l'origine ; façades à x = ±B et z = ±B (murs de 30 cm vers l'intérieur) ; le nord est vers −Z.
// Niveau 0 = rez-de-chaussée (4,2 m sous plafond), puis 4 étages de 3,8 m, toit à H (niveau NLV).
// V1.6 : immeuble agrandi (26 × 26 m au lieu de 18 × 18), plafonds plus hauts, grandes fenêtres, un grand hall autour de l'escalier à chaque étage.
// Tout est construit au chargement, dans des listes : BOX (boîtes), FLOORS (sols), OPEN (ouvertures des façades), ROOMS (pièces),
// PANELS (morceaux de cloison cassables, aussi dans BOX), DOORS (portes qu'on peut barricader), puis SHOPS (boutiques) et ZIPS (tyroliennes).
// Fournit aux autres dossiers : B, NLV, LVY, H, FACES, FACEN, facePt, BALD, BOX, FLOORS, OPEN, ROOMS, PANELS, DOORS, PLANKS_MAX,
//   SHOPS, ZIPS, PASSD, PASSY, PASSW, ZIPH (affichage, interface, et gfx/models/toit.js qui dessine l'immeuble à partir de ces listes).

// B : demi-largeur de l'immeuble ; NLV : nombre de niveaux sous le toit (le toit est le niveau NLV) ; G0, FH : hauteur du rez-de-chaussée, d'un étage ;
// LVY(k) : hauteur du sol du niveau k ; H : hauteur du toit
const B = 13,
  NLV = 5,
  G0 = 4.2,
  FH = 3.8,
  LVY = k => (k <= 0 ? 0 : G0 + (k - 1) * FH),
  H = LVY(NLV);
// les quatre façades (normale vers l'extérieur), dans l'ordre nord, est, sud, ouest : f = 0…3 partout
const FACES = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0]
  ],
  FACEN = ['nord', 'est', 'sud', 'ouest'];
// point (x, z) dans le repère d'une façade f : u le long de la façade (0 au milieu), d vers l'extérieur depuis le plan de la façade
const facePt = (f, u, d) => {
  const n = FACES[f];
  return [n[0] * (B + d) - n[1] * u, n[1] * (B + d) + n[0] * u];
};
// WALLT : épaisseur des façades ; WU : milieux des 9 fenêtres d'une façade (étages) ; SU : milieux des 3 rideaux de fer (rez-de-chaussée) ;
// BALV : niveaux qui ont un balcon ; BALU : portes-fenêtres de balcon (u) ; BALD : profondeur des balcons
const WALLT = 0.3,
  WU = [-10.4, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4],
  SU = [-7.8, 0, 7.8],
  BALV = [1, 2, 3, 4],
  BALU = [-7.8, 0, 7.8],
  BALD = 2.4;
// V1.7-1.8 : à chaque étage, un balcon (caillebotis métallique de 2,4 m) fait tout le tour de l'immeuble ; une porte-fenêtre par pièce de façade
const balDoor = (f, u) => BALU.includes(u) || (f === 1 && u === 2.6);
// les bandes de pièces vont de ±6,5 m à la façade ; dedans, le hall autour de l'escalier
const R1 = 6.5;
// trémie de l'escalier, au centre
const HOLE = { x0: -2, x1: 2, z0: -1.5, z1: 2.5 };
// FLOORS : sols { x0, x1, z0, z1, lv, y } ; rampe d'escalier : ramp, ya (en z0), yb (en z1), st 'A' / 'B' (volées), 'P' (palier) ;
//   bal : façade d'un balcon ; pass : passerelle d'une tyrolienne ; off : sol absent (passerelles en « Ils arrivent »)
// OPEN : ouvertures des façades { f, lv, u, u0, u1, y0, y1, k : 'vol' rideau de fer, 'fen' fenêtre, 'porte' porte-fenêtre de balcon }
// ROOMS : pièces { lv, x0, x1, z0, z1, n (NO, N, NE…), kind (chambre, salon, cuisine, bureau), F (champ de marche vers son milieu) }
// DOORS : portes { id, lv, kind : 'piece' / 'escalier' / 'toit', sens ('montée' / 'arrivée'), x0…z1, cx, cz, ax, y, planks, torn, pd, tt, tAt, tn }
const BOX = [],
  FLOORS = [],
  OPEN = [],
  ROOMS = [],
  PANELS = [],
  DOORS = [];
// une boîte : x0…x1, y0…y1, z0…z1 ; b : arrête les balles ; p : arrête le joueur et compte pour la marche des zombies (sauf t = 'bar') ;
// t : nature (pour le dessin : 'ext', 'int', 'cage', 'bar' = barrière invisible…) ; o : champs en plus (destr : cassable, hp, tier, lv, pid
// pour les cloisons ; vol : barrière d'un rideau de fer, retirée en mode fuite) ; dead : retirée (cloison cassée, objet absent du mode)
function addBox(x0, x1, y0, y1, z0, z1, b, p, t, o) {
  const q = {
    x0: Math.min(x0, x1),
    x1: Math.max(x0, x1),
    y0,
    y1,
    z0: Math.min(z0, z1),
    z1: Math.max(z0, z1),
    b,
    p,
    t,
    f: -1,
    rot: 0,
    destr: 0,
    hp: 0,
    hp0: 0,
    lv: -1,
    tier: '',
    ax: '',
    pid: -1,
    dead: 0
  };
  if (o) Object.assign(q, o);
  BOX.push(q);
  return q;
}
// boîte dans le repère d'une façade : u le long de la façade, d vers l'extérieur depuis le plan de la façade
function faceBox(f, u0, u1, y0, y1, d0, d1, b, p, t, o) {
  const a = facePt(f, u0, d0),
    q = facePt(f, u1, d1);
  return addBox(a[0], q[0], y0, y1, a[1], q[1], b, p, t, Object.assign({ f }, o || {}));
}
// ---------------------------------------------------------------- la construction (au chargement)
(() => {
  // --- façades : piliers, allèges et linteaux autour des ouvertures (rideaux de fer en bas, fenêtres, portes de balcon)
  for (let k = 0; k < NLV; k++) {
    const y0 = LVY(k),
      y1 = LVY(k + 1) - 0.25,
      h = y1 - y0,
      t = k ? 'ext' : 'ext0';
    for (let f = 0; f < 4; f++) {
      const op = [];
      if (k === 0) for (const u of SU) op.push({ u0: u - 1.8, u1: u + 1.8, v0: 0, v1: 3, k: 'vol', u });
      else
        for (const u of WU) {
          const bal = BALV.includes(k) && balDoor(f, u);
          op.push(
            bal
              ? { u0: u - 0.65, u1: u + 0.65, v0: 0, v1: 2.55, k: 'porte', u }
              : { u0: u - 0.75, u1: u + 0.75, v0: 0.75, v1: 2.8, k: 'fen', u }
          );
        }
      let u = -B;
      for (const o of op) {
        if (o.u0 > u) faceBox(f, u, o.u0, y0, y1, -WALLT, 0, 1, 1, t);
        if (o.v0 > 0) faceBox(f, o.u0, o.u1, y0, y0 + o.v0, -WALLT, 0, 1, 1, t);
        if (o.v1 < h) faceBox(f, o.u0, o.u1, y0 + o.v1, y1, -WALLT, 0, 1, 1, t);
        // on ne sort pas par les fenêtres ni par les rideaux (V3.7 : en mode fuite, les rideaux relevés laissent passer)
        if (o.k !== 'porte') faceBox(f, o.u0, o.u1, y0 + o.v0, y0 + o.v1 + 0.3, -WALLT, 0, 0, 1, 'bar', o.k === 'vol' ? { vol: 1 } : null);
        OPEN.push({ f, lv: k, u: o.u, u0: o.u0, u1: o.u1, y0: y0 + o.v0, y1: y0 + o.v1, k: o.k });
        u = o.u1;
      }
      if (u < B) faceBox(f, u, B, y0, y1, -WALLT, 0, 1, 1, t);
    }
  }
  // --- dalles (plafond dessous, sol dessus) avec la trémie de l'escalier ; toit
  const rects = e => [
    [-e, e, -e, HOLE.z0],
    [-e, e, HOLE.z1, e],
    [-e, HOLE.x0, HOLE.z0, HOLE.z1],
    [HOLE.x1, e, HOLE.z0, HOLE.z1]
  ];
  for (let k = 1; k <= NLV; k++) {
    const y = LVY(k);
    for (const r of rects(B)) addBox(r[0], r[1], y - 0.25, y, r[2], r[3], 1, 0, k === NLV ? 'toit' : 'dalle');
    for (const r of rects(B)) FLOORS.push({ x0: r[0], x1: r[1], z0: r[2], z1: r[3], y, lv: k });
  }
  FLOORS.push({ x0: -B, x1: B, z0: -B, z1: B, y: 0, lv: 0 });
  // --- parapet du toit (et une barrière invisible plus haute : on ne saute pas du toit)
  for (let f = 0; f < 4; f++) {
    faceBox(f, -B, B, H, H + 0.75, -0.3, 0, 1, 0, 'parapet');
    faceBox(f, -B, B, H, H + 3, -0.3, 0, 0, 1, 'bar');
  }
  // --- l'escalier : deux volées par niveau, un palier au fond ; la cage monte jusqu'au cabanon du toit
  for (let k = 0; k < NLV; k++) {
    const L = LVY(k),
      h = LVY(k + 1) - L,
      m = L + h / 2,
      top = k === NLV - 1 ? H + 2.7 : LVY(k + 1);
    FLOORS.push({ x0: -1.94, x1: -0.06, z0: -1.5, z1: 1.5, ramp: 1, ya: L, yb: m, lv: k, st: 'A' });
    FLOORS.push({ x0: -1.94, x1: 1.94, z0: 1.5, z1: 2.5, y: m, lv: k, st: 'P' });
    FLOORS.push({ x0: 0.06, x1: 1.94, z0: -1.5, z1: 1.5, ramp: 1, ya: L + h, yb: m, lv: k, st: 'B' });
    addBox(-2.15, -2, L, top, -1.5, 2.65, 1, 1, 'cage');
    addBox(2, 2.15, L, top, -1.5, 2.65, 1, 1, 'cage');
    addBox(-2.15, 2.15, L, top, 2.5, 2.65, 1, 1, 'cage');
    addBox(-0.06, 0.06, L, k === NLV - 1 ? H + 1.1 : LVY(k + 1), -1.5, 1.5, 1, 1, 'cloison');
    const yt = LVY(k + 1) - 0.25;
    for (const q of [
      [-2.15, -1.85],
      [-0.25, 0.25],
      [1.85, 2.15]
    ])
      addBox(q[0], q[1], L, yt, -1.64, -1.5, 1, 1, 'cage');
    for (const q of [
      [-1.85, -0.25, 'montée'],
      [0.25, 1.85, 'arrivée']
    ]) {
      addBox(q[0], q[1], L + 2.2, yt, -1.64, -1.5, 1, 1, 'cage');
      if (k || q[2] === 'montée')
        DOORS.push({
          lv: k,
          kind: 'escalier',
          sens: q[2],
          x0: q[0],
          x1: q[1],
          z0: -1.64,
          z1: -1.5,
          cx: (q[0] + q[1]) / 2,
          cz: -1.57,
          ax: 'x'
        });
    }
  }
  DOORS.push({ lv: NLV, kind: 'toit', x0: 0.1, x1: 1.9, z0: -2.8, z1: -2.65, cx: 1, cz: -2.72, ax: 'x' });
  // un placard sous la première volée
  addBox(0.08, 1.94, 0, 1.5, -1.5, 1.45, 1, 1, 'placard');
  // --- le cabanon sur le toit : la porte est au nord, côté arrivée de l'escalier
  addBox(-2.3, -2, H, H + 2.7, -2.8, -1.5, 1, 1, 'hut');
  addBox(2, 2.3, H, H + 2.7, -2.8, -1.5, 1, 1, 'hut');
  addBox(-2.3, 0.1, H, H + 2.7, -2.8, -2.65, 1, 1, 'hut');
  addBox(1.9, 2.3, H, H + 2.7, -2.8, -2.65, 1, 1, 'hut');
  addBox(0.1, 1.9, H + 2.15, H + 2.7, -2.8, -2.65, 1, 1, 'hut');
  addBox(-2.45, 2.45, H + 2.7, H + 2.9, -2.95, 2.8, 1, 1, 'hutroof');
  addBox(-2, -0.06, H, H + 1.1, -1.56, -1.44, 1, 1, 'rail');
  addBox(-9.6, -7.6, H, H + 4.2, -9.8, -7.8, 1, 1, 'tank');
  addBox(-8, -6.6, H, H + 1, 9.4, 10.4, 1, 1, 'ac');
  addBox(-5.4, -4, H, H + 1, 9.4, 10.4, 1, 1, 'ac');
  addBox(6, 7.4, H, H + 1, -10.6, -9.6, 1, 1, 'ac');
  // --- les étages : cloisons cassables (IW : épaisseur, DW × DH : portes) ; lvOfY : le niveau d'une hauteur
  const IW = 0.14,
    DW = 1.3,
    DH = 2.3;
  const lvOfY = y => {
    let k = 0;
    while (k < NLV && LVY(k + 1) <= y + 0.01) k++;
    return k;
  };
  // un morceau de cloison cassable (a, b : début et fin le long du mur ; ax : 'x' si le mur court le long de x)
  // V2.1 : trois étages par morceau — bas (0 à 1 m), milieu (1 à 2 m : le casser seul fait une fenêtre de tir sans ouvrir de passage), haut (2 m au plafond)
  const panel = (ax, c, a, b, ya, yb, tier, lv) => {
    const hp = tier === 'bas' || tier === 'milieu' ? 6 : 8,
      o =
        ax === 'x'
          ? addBox(a, b, ya, yb, c - IW / 2, c + IW / 2, 1, 1, 'int', { destr: 1, hp, hp0: hp, lv, tier, ax })
          : addBox(c - IW / 2, c + IW / 2, ya, yb, a, b, 1, 1, 'int', { destr: 1, hp, hp0: hp, lv, tier, ax });
    o.pid = PANELS.length;
    PANELS.push(o);
  };
  // une longueur de cloison de a à b, découpée en morceaux d'environ 1 m (chacun en trois : bas, milieu, haut)
  const run = (ax, c, a, b, y0, y1, lv) => {
    const n = Math.max(1, Math.round((b - a) / 1));
    for (let i = 0; i < n; i++) {
      const s0 = a + ((b - a) * i) / n,
        s1 = a + ((b - a) * (i + 1)) / n;
      panel(ax, c, s0, s1, y0, y0 + 1, 'bas', lv);
      panel(ax, c, s0, s1, y0 + 1, y0 + 2, 'milieu', lv);
      panel(ax, c, s0, s1, y0 + 2, y1, 'haut', lv);
    }
  };
  // un mur de a0 à a1 (à c sur l'autre axe), percé de portes de DW (milieux dans doors) : un linteau au-dessus de chacune, et une entrée dans DOORS
  const wall = (ax, c, a0, a1, doors, y0, y1) => {
    const lv = lvOfY(y0);
    let a = a0;
    for (const d of doors) {
      if (d - DW / 2 > a) run(ax, c, a, d - DW / 2, y0, y1, lv);
      panel(ax, c, d - DW / 2, d + DW / 2, y0 + DH, y1, 'linteau', lv);
      DOORS.push(
        ax === 'x'
          ? { lv, kind: 'piece', x0: d - DW / 2, x1: d + DW / 2, z0: c - IW / 2, z1: c + IW / 2, cx: d, cz: c, ax }
          : { lv, kind: 'piece', x0: c - IW / 2, x1: c + IW / 2, z0: d - DW / 2, z1: d + DW / 2, cx: c, cz: d, ax }
      );
      a = d + DW / 2;
    }
    if (a < a1) run(ax, c, a, a1, y0, y1, lv);
  };
  const wallZ = (z, x0, x1, doors, y0, y1) => wall('x', z, x0, x1, doors, y0, y1),
    wallX = (x, z0, z1, doors, y0, y1) => wall('z', x, z0, z1, doors, y0, y1);
  const E = B - 0.3;
  // chaque étage : un grand hall autour de l'escalier, neuf pièces le long des façades (portes de 1,3 m), des passages entre pièces d'angle
  for (let k = 1; k < NLV; k++) {
    const y0 = LVY(k),
      y1 = LVY(k + 1) - 0.25;
    wallZ(-R1, -E, E, [-9.6, -5.2, 0, 5.2], y0, y1);
    wallZ(R1, -E, E, [-5.2, 0, 5.2, 9.6], y0, y1);
    wallX(-R1, -R1, R1, [-3.25, 3.25], y0, y1);
    wallX(R1, -R1, R1, [-2.6, 3.9], y0, y1);
    for (const x of [-3.9, 3.9]) {
      wallX(x, -E, -R1, [], y0, y1);
      wallX(x, R1, E, [], y0, y1);
    }
    wallZ(1.3, R1, E, [], y0, y1);
    // pièces : rectangle et nom ; les meubles évitent les portes
    for (const r of [
      { x0: -E, x1: -3.9, z0: -E, z1: -R1, n: 'NO' },
      { x0: -3.9, x1: 3.9, z0: -E, z1: -R1, n: 'N' },
      { x0: 3.9, x1: E, z0: -E, z1: -R1, n: 'NE' },
      { x0: -E, x1: -3.9, z0: R1, z1: E, n: 'SO' },
      { x0: -3.9, x1: 3.9, z0: R1, z1: E, n: 'S' },
      { x0: 3.9, x1: E, z0: R1, z1: E, n: 'SE' },
      { x0: -E, x1: -R1, z0: -R1, z1: R1, n: 'O' },
      { x0: R1, x1: E, z0: -R1, z1: 1.3, n: 'EN' },
      { x0: R1, x1: E, z0: 1.3, z1: R1, n: 'ES' }
    ])
      ROOMS.push(Object.assign({ lv: k }, r));
  }
  // --- meubles (ils arrêtent le joueur, pas les balles), tirés au hasard mais toujours les mêmes
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (const r of ROOMS) {
    // wide : pièce plus large que profonde (les meubles se tournent)
    const y = LVY(r.lv),
      cx = (r.x0 + r.x1) / 2,
      cz = (r.z0 + r.z1) / 2,
      wx = r.x1 - r.x0,
      wz = r.z1 - r.z0,
      wide = wx > wz;
    const kind = r.n === 'O' ? 'bureau' : ['chambre', 'salon', 'cuisine', 'chambre', 'salon'][Math.floor(rnd() * 5)];
    r.kind = kind;
    // les portes de la pièce (et ses portes-fenêtres de balcon), que les meubles évitent
    const doorPts = DOORS.concat(
      OPEN.filter(o => o.k === 'porte').map(o => {
        const q = facePt(o.f, o.u, -0.6);
        return { lv: o.lv, cx: q[0], cz: q[1] };
      })
    ).filter(d => d.lv === r.lv && d.cx >= r.x0 - 0.3 && d.cx <= r.x1 + 0.3 && d.cz >= r.z0 - 0.3 && d.cz <= r.z1 + 0.3);
    const free = (x, z, m) => doorPts.every(d => Math.hypot(x - d.cx, z - d.cz) > m);
    // coins de la pièce, en écartant ceux des portes
    const corners = [
      [r.x0 + 0.8, r.z0 + 0.8],
      [r.x1 - 0.8, r.z0 + 0.8],
      [r.x0 + 0.8, r.z1 - 0.8],
      [r.x1 - 0.8, r.z1 - 0.8]
    ].filter(c => free(c[0], c[1], 2.4));
    const pick = () => (corners.length ? corners.splice(Math.floor(rnd() * corners.length), 1)[0] : null);
    // une boîte de demi-tailles hx, hz centrée près de (x, z), gardée à l'intérieur de la pièce et loin des portes
    const put = (x, z, hx, hz, h, b, t) => {
      x = Math.max(r.x0 + hx + 0.08, Math.min(r.x1 - hx - 0.08, x));
      z = Math.max(r.z0 + hz + 0.08, Math.min(r.z1 - hz - 0.08, z));
      if (!free(x, z, 1.6 + Math.max(hx, hz))) return;
      addBox(x - hx, x + hx, y, y + h, z - hz, z + hz, b, 1, t, { rot: wx > wz ? 0 : 1 });
    };
    // pose un meuble dans un coin libre tiré au hasard (s'il en reste)
    const atCorner = (f, ...a) => {
      const c = pick();
      if (c) f(c, ...a);
    };
    if (kind === 'bureau') {
      // plateau de bureaux : deux rangées de postes, une étagère, des plantes
      for (const dx of [-1.5, 1.5]) for (const zz of [-4.2, -1.4, 1.4, 4.2]) put(cx + dx, cz + zz, 0.4, 0.7, 0.75, 0, 'bureau');
      atCorner(c => put(c[0], c[1], 0.3, 0.3, 1.2, 0, 'plante'));
      atCorner(c => put(c[0], c[1], 0.3, 0.3, 1.2, 0, 'plante'));
      put(r.x0 + 0.3, cz, 0.2, 1, 1.9, 1, 'etagere');
    } else {
      if (kind === 'chambre') {
        atCorner(c => put(c[0], c[1], wide ? 1 : 0.75, wide ? 0.75 : 1, 0.55, 0, 'lit'));
        atCorner(c => put(c[0], c[1], wide ? 0.5 : 0.3, wide ? 0.3 : 0.5, 2, 1, 'armoire'));
        atCorner(c => put(c[0], c[1], wide ? 0.6 : 0.2, wide ? 0.2 : 0.6, 1.9, 1, 'etagere'));
      } else if (kind === 'salon') {
        atCorner(c => put(c[0], c[1], wide ? 0.9 : 0.45, wide ? 0.45 : 0.9, 0.8, 0, 'canape'));
        put(cx, cz, 0.5, 0.35, 0.45, 0, 'table_basse');
        atCorner(c => put(c[0], c[1], wide ? 0.4 : 0.25, wide ? 0.25 : 0.4, 1.1, 0, 'meuble_tv'));
        atCorner(c => put(c[0], c[1], 0.3, 0.3, 1.2, 0, 'plante'));
      } else {
        atCorner(c => put(c[0], c[1], wide ? 0.9 : 0.32, wide ? 0.32 : 0.9, 0.9, 0, 'cuisine'));
        put(cx, cz, 0.6, 0.45, 0.75, 0, 'table');
        atCorner(c => put(c[0], c[1], 0.35, 0.35, 1.8, 1, 'frigo'));
        atCorner(c => put(c[0], c[1], 0.3, 0.3, 1.2, 0, 'plante'));
      }
    }
  }
  // --- le hall de chaque étage : bancs contre la cage d'escalier, plantes
  for (let k = 1; k < NLV; k++) {
    const y = LVY(k);
    addBox(-2.65, -2.2, y, y + 0.45, -0.4, 1.4, 0, 1, 'banc');
    addBox(2.2, 2.65, y, y + 0.45, -0.4, 1.4, 0, 1, 'banc');
    for (const x of [-3, 3]) addBox(x - 0.3, x + 0.3, y, y + 1.2, -6.2, -5.6, 0, 1, 'plante');
    for (const x of [-2.6, 2.6]) addBox(x - 0.3, x + 0.3, y, y + 1.2, 5.6, 6.2, 0, 1, 'plante');
  }
  // --- rez-de-chaussée : hall de magasins, piliers, comptoirs, rayonnages
  for (const q of [
    [-R1, -R1],
    [R1, -R1],
    [-R1, R1],
    [R1, R1],
    [-R1, 0],
    [R1, 0]
  ])
    addBox(q[0] - 0.3, q[0] + 0.3, 0, G0, q[1] - 0.3, q[1] + 0.3, 1, 1, 'pilier');
  addBox(-10.6, -7, 0, 1.05, -10.4, -9.6, 0, 1, 'comptoir');
  addBox(7, 10.6, 0, 1.05, 9.6, 10.4, 0, 1, 'comptoir');
  addBox(-3, 3, 0, 1.05, 9.8, 10.6, 0, 1, 'comptoir');
  for (const q of [
    [9.8, -9],
    [9.8, -4.5],
    [-9.8, 4.5],
    [-9.8, 9],
    [4, -9.5],
    [-4, -9.5]
  ])
    addBox(q[0] - 0.35, q[0] + 0.35, 0, 1.9, q[1] - 1, q[1] + 1, 1, 1, 'rayon');
  // --- balcons : tout le tour de l'immeuble aux étages BALV, garde-corps continu (et barrière invisible au-dessus) ; les coins se recouvrent
  for (let f = 0; f < 4; f++)
    for (const lv of BALV) {
      const y = LVY(lv),
        E2 = B + BALD,
        a = facePt(f, -E2, 0),
        q = facePt(f, E2, BALD);
      FLOORS.push({
        x0: Math.min(a[0], q[0]),
        x1: Math.max(a[0], q[0]),
        z0: Math.min(a[1], q[1]),
        z1: Math.max(a[1], q[1]),
        y,
        lv,
        bal: f
      });
      faceBox(f, -E2, E2, y, y + 2.6, BALD - 0.05, BALD + 0.05, 0, 1, 'bar');
    }
})();
// V3.5 : les boutiques (comme les « buy stations » de Warzone) : une sur le toit, une au rez-de-chaussée ; on s'en approche pour ouvrir les améliorations
// ry : sens de la façade avant (le modèle regarde vers +z quand ry = 0)
const SHOPS = [
  { x: 4.6, y: H, z: -4.6, ry: -Math.PI / 2, n: 'le toit' },
  { x: -4.4, y: 0, z: -4.6, ry: Math.PI / 2, n: 'le rez-de-chaussée' }
];
for (const s of SHOPS) {
  const ax = Math.abs(Math.sin(s.ry)) > 0.5;
  addBox(s.x - (ax ? 0.5 : 0.85), s.x + (ax ? 0.5 : 0.85), s.y, s.y + 1.2, s.z - (ax ? 0.85 : 0.5), s.z + (ax ? 0.85 : 0.5), 0, 1, 'shop');
}
// V3.6 : les tyroliennes (comme dans Warzone) : du bord du toit jusqu'à une passerelle qui enjambe chaque avenue, à 57 m de l'immeuble (mode fuite)
// ZIPS[i] : f façade, n normale, t direction le long de la façade ; a = pied du poteau sur le toit, b = pied du poteau sur la passerelle,
// c = milieu de la passerelle ; le câble passe ZIPH au-dessus des pieds de poteau ; on y glisse dans les deux sens.
// PASSD : distance du milieu des passerelles au centre ; PASSY : hauteur du tablier ; PASSW : demi-longueur du tablier ; ZIPU : décalage des poteaux
const PASSD = 57.25,
  PASSY = 7,
  PASSW = 7.5,
  ZIPU = 3.5,
  ZIPH = 2.4,
  ZIPS = [];
// une passerelle par avenue : tablier, garde-corps, quatre pieds ; at(d, u) : point à d du centre le long de la normale, à u de côté
for (let f = 0; f < 4; f++) {
  const n = FACES[f],
    t = [-n[1], n[0]],
    at = (d, u) => [n[0] * d + t[0] * u, n[1] * d + t[1] * u],
    ax = Math.abs(n[0]) > 0.5;
  const a = at(B - 1.1, ZIPU),
    b = at(PASSD - 0.6, ZIPU),
    c = at(PASSD, 0),
    hx = ax ? 1.25 : PASSW,
    hz = ax ? PASSW : 1.25;
  ZIPS.push({ f, n, t, a: [a[0], H, a[1]], b: [b[0], PASSY, b[1]], c: [c[0], PASSY, c[1]] });
  FLOORS.push({ x0: c[0] - hx, x1: c[0] + hx, z0: c[1] - hz, z1: c[1] + hz, y: PASSY, lv: -1, pass: f, off: 0 });
  addBox(c[0] - hx, c[0] + hx, PASSY - 0.3, PASSY, c[1] - hz, c[1] + hz, 0, 0, 'pass');
  // garde-corps des deux grands côtés (on peut sauter par-dessus, ou descendre / grimper par les échelles des pieds)
  for (const s of [-1, 1]) {
    const q = at(PASSD + s * 1.2, 0);
    addBox(
      ax ? q[0] - 0.05 : c[0] - hx,
      ax ? q[0] + 0.05 : c[0] + hx,
      PASSY,
      PASSY + 1.05,
      ax ? c[1] - hz : q[1] - 0.05,
      ax ? c[1] + hz : q[1] + 0.05,
      0,
      1,
      'pass'
    );
  }
  for (const s of [-1, 1])
    for (const e of [-1, 1]) {
      const q = at(PASSD + s * 1.05, e * (PASSW - 0.15));
      addBox(q[0] - 0.15, q[0] + 0.15, 0, PASSY, q[1] - 0.15, q[1] + 0.15, 1, 1, 'pass');
    }
}
// portes barricadables : les planches arrêtent les zombies (pas les balles, pas le joueur, qui se faufile)
DOORS.forEach((d, i) => {
  d.id = i;
  d.planks = 0;
  d.torn = 0;
  d.y = LVY(d.lv);
});
// au plus 5 planches par porte
const PLANKS_MAX = 5;
// STDOOR[lv] : les portes de l'escalier au niveau lv : up (« montée », devant la volée A qui monte), arr (« arrivée », où l'on arrive d'en bas)
const STDOOR = [];
for (let lv = 0; lv <= NLV; lv++)
  STDOOR.push({
    up: DOORS.find(d => d.lv === lv && d.sens === 'montée') || null,
    arr: DOORS.find(d => d.lv === lv && d.sens === 'arrivée') || null
  });
