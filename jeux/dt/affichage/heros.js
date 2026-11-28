// ===================== DERNIER TOIT — l'affichage : effets des héros, les réserves et les petits outils =====================
// Braise (feu), Ondine (eau), Sylve (bois), Roc (terre), Volt (élec), Zéphyr (vent, V4.8). Dessin seulement : les règles sont dans regles/.
// Tout vit dans des réserves fixes créées au premier besoin (hfxInit : IPool, Float32Array, quelques maillages) : rien n'est créé pendant
// une image, le nombre d'objets est plafonné (HXN), aucune lumière ajoutée. Trois fichiers : ici les réserves et les outils (anneau au sol,
// sol brûlé, arc électrique, pic de terre, voile coloré) ; heros-evenements.js (hfxEvent : ce qui part d'un coup) ;
// heros-image.js (hfxFrame : ce qui dure, redessiné à chaque image depuis l'état des règles).
// Attend des règles : B, BALD, PLAZA, ROADS (flaques du Sanctuaire), outside, S.z, S.act / S.nAct, S.p ; les modèles hx.* (heros-modeles.js).
// Fournit : HX (lu par tests/herofx.js), HXC, HXN, hfxInit, hxSync et les outils hx… (lus par les deux autres fichiers des héros).

// couleur de chaque élément (voile coloré des ultimes)
const HXC = { feu: 0xff6a3d, eau: 0x3fa9ff, bois: 0x5fd068, terre: 0xcf9a5c, elec: 0xffd93b, vent: 0x8fe6dc };
// V5.3 : l'élément choisi du héros fait les couleurs de ses sorts (« seul le type de dégâts et les animations changent »).
// HXE : l'élément qui remplace celui du sort qu'on dessine (null : le sort garde ses couleurs d'origine, V5.2) ; hxSk le pose d'après l'élément
// choisi (ec, absent : celui d'origine) et celui d'origine du sort (nat) ; hxK donne la sorte de particule (feu, eau, feuille, pierre, étincelle,
// souffle) de l'élément qui remplace ; hxC la couleur (role : main, dark, light, glow) de l'élément qui remplace, sinon la couleur d'origine o.
// ELI : le rang de chaque élément (0 : sort d'origine, dans les tableaux de données des réserves)
let HXE = null;
const HXMAIN = { feu: 'fire', eau: 'water', bois: 'leaf', terre: 'rock', elec: 'spark', vent: 'gust' },
  HXPART = { fire: 1, water: 1, leaf: 1, rock: 1, spark: 1, gust: 1, mist: 1 },
  ELI = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
const hxSk = (ec, nat) => (HXE = ec && ec !== nat && K.EL[ec] ? ec : null),
  hxK = k => (HXE && HXPART[k] ? HXMAIN[HXE] : k),
  hxC = (o, role) => (HXE ? K.EL[HXE][role] : o),
  // le rang (1 à 6) d'un élément qui remplace, 0 sinon (données des réserves) ; et l'inverse
  hxI = e => (e && ELI.indexOf(e) >= 0 ? ELI.indexOf(e) + 1 : 0),
  hxE = i => (i > 0 ? ELI[i - 1] : null);
const HXN = {
  met: 12,
  arc: 40,
  seg: 360,
  arw: 24,
  dash: 4,
  sco: 24,
  spk: 48,
  ring: 8,
  wave: 2,
  wall: 6,
  rain: 240,
  pud: 40,
  bush: 13,
  wet: 220,
  beam: 3
};
// plafonds : météores, arcs électriques, segments d'arcs, flèches, traînées du bond, taches de sol brûlé, pics, anneaux, vagues, remparts,
// gouttes de pluie, flaques, touffes par roncier, reflets sous les zombies ralentis, traits du Tir perçant (V4.8)
let HX = null;
// HX : réserves (fbC fbG fbT boules de feu, glow lueur au sol, metR metG metT mark météores, bush bushD tring ronces, treeM treeG arbres,
// arw arwT flèches, wallA wallB rempart, spk pics, cloud sring orage, boltY boltW arcs, dash bond, sco sol brûlé, wet reflets, rain pluie,
// pud flaques) ; données (metD, arcD, arwD, dashD, scoD, spkD, rainD, pudD : un enregistrement de taille fixe par objet, voir les outils) ;
// age : âge de chaque objet des règles (roncier, gardien, orage) ; fw, mw, sw : Sanctuaire, météores, orage lissés (teintes du ciel) ;
// vT, vD, vA, vC : voile coloré (temps, durée, force, couleur) ; rings, waves, walls : anneaux au sol, vagues, remparts suivis.
function hfxInit() {
  const T3 = THREE,
    R = Math.random;
  const addM = (c, o) =>
    new T3.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T3.AdditiveBlending, depthWrite: false });
  const decal = (c, o) =>
    new T3.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: o,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3
    });
  const ground = c => new T3.MeshLambertMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const ico = new T3.IcosahedronGeometry(1, 1),
    oct = new T3.OctahedronGeometry(1, 0),
    bx = new T3.BoxGeometry(1, 1, 1),
    bxz = new T3.BoxGeometry(1, 1, 1),
    cone = new T3.CylinderGeometry(0, 1, 1, 6, 1, true);
  const disc = new T3.CircleGeometry(1, 22),
    rg = new T3.RingGeometry(0.84, 1, 56),
    cyl = new T3.CylinderGeometry(1, 1, 1, 32, 1, true);
  // boîte de 0 à 1 le long de z (segments d'arc, traînées) ; cône couché, large en z = 0 (la tête), pointu en z = 1 (la queue)
  bxz.translate(0, 0, 0.5);
  cone.rotateX(Math.PI / 2);
  cone.translate(0, 0, 0.5);
  disc.rotateX(-Math.PI / 2);
  rg.rotateX(-Math.PI / 2);
  cyl.translate(0, 0.5, 0);
  const forme = (n, ch, ctx) => prepM(n, ctx).parts[0].gs[ch || 'm'],
    reserve = (g, m, c) => new IPool(g, m, c);
  HX = {
    age: new WeakMap(),
    fbC: reserve(ico, new T3.MeshBasicMaterial({ color: 0xfff1b8 }), 6),
    fbG: reserve(ico, addM(0xff6a3d, 0.7), 6),
    fbT: reserve(cone, addM(0xff8a3a, 0.5), 6),
    glow: reserve(disc, addM(0xff5a1e, 0.42), 8),
    metR: reserve(forme('hx.meteore', 'g'), K.MAT.g, HXN.met),
    metG: reserve(ico, addM(0xff7a2e, 0.5), HXN.met),
    metT: reserve(cone, addM(0xffa040, 0.5), HXN.met),
    mark: reserve(rg, addM(0xff4a2a, 0.75), HXN.met),
    bush: reserve(forme('hx.ronce'), K.MAT.m, 3 * HXN.bush),
    bushD: reserve(disc, ground(0x34502a), 3),
    treeM: reserve(forme('hx.arbre'), K.MAT.m, 4),
    treeG: reserve(forme('hx.arbre', 'g'), K.MAT.g, 4),
    arw: reserve(forme('hx.fleche', 'g'), K.MAT.g, HXN.arw),
    arwT: reserve(cone, addM(0x8dff86, 0.55), HXN.arw),
    wallA: reserve(forme('hx.rempart', 'm', { bad: 0 }), K.MAT.m, HXN.wall),
    wallB: reserve(forme('hx.rempart', 'm', { bad: 1 }), K.MAT.m, HXN.wall),
    spk: reserve(forme('hx.pic'), K.MAT.m, HXN.spk),
    cloud: reserve(forme('hx.nuage'), K.MAT.m, 3),
    sring: reserve(rg, addM(0xffd93b, 0.4), 3),
    boltY: reserve(bxz, addM(0xffe36a, 0.85), HXN.seg),
    boltW: reserve(bxz, addM(0xffffff, 0.95), HXN.seg),
    dash: reserve(cone, addM(0xffd93b, 0.42), HXN.dash),
    tring: reserve(rg, addM(0x7dff6a, 0.5), 3),
    sco: reserve(disc, ground(0x2b221c), HXN.sco),
    wet: reserve(rg, addM(0x3fa9ff, 0.55), HXN.wet),
    rain: reserve(bx, new T3.MeshBasicMaterial({ color: 0xd6ecff, transparent: true, opacity: 0.45, depthWrite: false }), HXN.rain),
    pud: reserve(disc, decal(0x2f6f9f, 0.5), HXN.pud),
    // V4.8 : le Tir perçant de Zéphyr (enveloppe turquoise et cœur blanc, une boîte de 0 à 1 le long de z)
    beam: reserve(bxz, addM(0x8fe6dc, 0.55), HXN.beam),
    beamW: reserve(bxz, addM(0xffffff, 0.9), HXN.beam),
    beamD: new Float32Array(HXN.beam * 9),
    beamC: 0,
    // V4.8 : zombies soulevés par une balle de Vent (affichage seulement) : début et fin, au temps des règles (S.t), par place
    lev0: new Float32Array(MAXZ),
    lev1: new Float32Array(MAXZ),
    metD: new Float32Array(HXN.met * 7),
    arcD: new Float32Array(HXN.arc * 9),
    arwD: new Float32Array(HXN.arw * 9),
    dashD: new Float32Array(HXN.dash * 7),
    scoD: new Float32Array(HXN.sco * 4).fill(99),
    spkD: new Float32Array(HXN.spk * 6).fill(9),
    rainD: new Float32Array(HXN.rain * 3),
    pudD: new Float32Array(HXN.pud * 3),
    arcC: 0,
    arwC: 0,
    dashC: 0,
    scoC: 0,
    spkC: 0,
    rings: [],
    waves: [],
    walls: [],
    fw: 0,
    mw: 0,
    sw: 0,
    vT: 9,
    vD: 1,
    vA: 0,
    vC: 0xffffff,
    // V5.3 : les modèles et réserves d'un autre élément (créés au premier besoin : hxPool), et la forme / la réserve pour les faire
    alt: {},
    forme,
    reserve,
    cT: new T3.Color(),
    cB: new T3.Color(0x56738c),
    cF: new T3.Color(0x6a8399),
    cM: new T3.Color(0xd8794a),
    cS: new T3.Color(0x3d4352)
  };
  // la pluie du Sanctuaire tourne autour de la caméra ; les flaques sont posées une fois pour toutes (place et avenues)
  for (let i = 0; i < HXN.rain; i++) {
    let x = 0,
      z = 0;
    while (Math.abs(x) < 1.8 && Math.abs(z) < 1.8) {
      x = (R() - 0.5) * 40;
      z = (R() - 0.5) * 40;
    }
    HX.rainD[i * 3] = x;
    HX.rainD[i * 3 + 1] = (R() - 0.5) * 30;
    HX.rainD[i * 3 + 2] = z;
  }
  for (let i = 0; i < HXN.pud; i++) {
    const o = i * 3;
    if (i % 2) {
      const a = R() * 6.283,
        d = B + BALD + 2 + R() * (PLAZA - B - BALD - 2);
      HX.pudD[o] = Math.cos(a) * d;
      HX.pudD[o + 1] = Math.sin(a) * d;
    } else {
      const r = ROADS[(i >> 1) % 4],
        t = R() * 50,
        s = (R() - 0.5) * r.w * 0.8;
      HX.pudD[o] = r.b[0] - r.dx * t + r.px * s;
      HX.pudD[o + 1] = r.b[1] - r.dz * t + r.pz * s;
    }
    HX.pudD[o + 2] = 0.8 + R() * 1.6;
  }
  for (let i = 0; i < HXN.ring; i++) {
    const m = new T3.Mesh(rg, addM(0xffffff, 0.9));
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    HX.rings.push({ m, t: 9, T: 1, r0: 1, r1: 2, a: 1 });
  }
  for (let i = 0; i < HXN.wave; i++) {
    const w = {
      t: 9,
      x: 0,
      y: 0,
      z: 0,
      r: 8,
      c: new T3.Mesh(
        cyl,
        new T3.MeshBasicMaterial({ color: 0x3fa9ff, transparent: true, opacity: 0.6, depthWrite: false, side: T3.DoubleSide })
      ),
      f: new T3.Mesh(cyl, addM(0xe2f6ff, 0.9)),
      d: new T3.Mesh(disc, decal(0x9fd8ff, 0.45))
    };
    w.f.material.side = T3.DoubleSide;
    for (const k of ['c', 'f', 'd']) {
      w[k].visible = false;
      scene.add(w[k]);
    }
    HX.waves.push(w);
  }
  for (let i = 0; i < HXN.wall; i++)
    HX.walls.push({ on: 0, id: 0, x: 0, z: 0, nx: 0, nz: 1, half: 4.5, age: 0, fin: -1, broke: 0, hp: 1, hp1: 1, seen: 0 });
  // particules propres aux héros : gouttes, feuilles, brume de poison, éclats de pierre
  G.P.water = mkPart(oct, new T3.MeshLambertMaterial({ color: 0x7cc6ff, emissive: 0x1d4f80 }), 500, -14);
  G.P.leaf = mkPart(oct, new T3.MeshLambertMaterial({ color: 0x6fcf5f, emissive: 0x1a3d14 }), 300, -2.5, [1, 0.2, 0.65]);
  G.P.mist = mkPart(new T3.IcosahedronGeometry(1, 0), addM(0x7dff5a, 0.3), 240, 0.5);
  G.P.mist.fade = 1;
  G.P.rock = mkPart(oct, new T3.MeshLambertMaterial({ color: 0x8f6a44 }), 280, -15, [1, 0.75, 0.9]);
  // V4.8 : souffle de Zéphyr (Bond, balles de Vent, Tir perçant)
  G.P.gust = mkPart(new T3.IcosahedronGeometry(1, 0), addM(0x8fe6dc, 0.28), 260, 1.2);
  G.P.gust.fade = 1;
  // voile coloré sur les bords de l'écran (ultime, bond de Volt, Sanctuaire) : un plan collé devant la caméra, dégradé radial
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const cx = cv.getContext('2d'),
    gr = cx.createRadialGradient(64, 64, 20, 64, 64, 80);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.22)');
  gr.addColorStop(1, 'rgba(255,255,255,1)');
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 128, 128);
  HX.vig = new T3.Mesh(
    new T3.PlaneGeometry(2, 2),
    new T3.MeshBasicMaterial({
      map: new T3.CanvasTexture(cv),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  HX.vig.position.set(0, 0, -0.1);
  HX.vig.renderOrder = 30;
  HX.vig.frustumCulled = false;
  HX.vig.visible = false;
  camera.add(HX.vig);
  // vrai three.js : les matières des effets sont compilées tout de suite (sinon petit à-coup au premier ultime sur le téléphone) ; l'aperçu local n'en a pas besoin
  if (renderer.compile)
    try {
      renderer.compile(scene, camera);
    } catch (_) {}
}
// nouvelle partie (nouvel S) : on oublie ce qui était en cours (météores en vol, murs, arcs, flèches, sol brûlé, pluie, voile)
function hxSync(S) {
  if (HX.S === S) return;
  HX.S = S;
  HX.metD.fill(0);
  HX.arcD.fill(0);
  HX.arwD.fill(0);
  HX.dashD.fill(0);
  HX.beamD.fill(0);
  HX.lev1.fill(0);
  HX.scoD.fill(99);
  HX.spkD.fill(9);
  HX.fw = HX.mw = HX.sw = 0;
  HX.arcEl = HX.dashEl = HX.mEc = null;
  HX.vT = 9;
  for (const q of HX.rings) {
    q.t = 9;
    q.T = 1;
    q.m.visible = false;
  }
  for (const w of HX.waves) {
    w.t = 9;
    w.c.visible = w.f.visible = w.d.visible = false;
  }
  for (const w of HX.walls) w.on = 0;
}
// ---- petits outils (prennent toujours une place dans une réserve fixe ; la plus ancienne est reprise si tout est pris)
// un anneau au sol en (x, y, z) qui s'élargit de r0 à r1 en T secondes, couleur c, opacité a ; nb : mélange normal (sombre) au lieu d'additif
function hxRing(x, y, z, r0, r1, T, c, a, nb) {
  let w = HX.rings[0],
    best = -1;
  for (const q of HX.rings) {
    if (q.t >= q.T) {
      w = q;
      break;
    }
    if (q.t / q.T > best) {
      best = q.t / q.T;
      w = q;
    }
  }
  w.t = 0;
  w.T = T;
  w.r0 = r0;
  w.r1 = r1;
  w.a = a;
  w.m.position.set(x, y, z);
  w.m.scale.set(r0, 1, r0);
  w.m.material.color.setHex(c);
  w.m.material.opacity = a;
  w.m.material.blending = nb ? THREE.NormalBlending : THREE.AdditiveBlending;
  w.m.visible = true;
}
// une tache de sol brûlé (14 s) ; HX.scoD, 4 nombres : x, z, taille, âge
function hxScorch(x, z, s) {
  const o = (HX.scoC++ % HXN.sco) * 4,
    D = HX.scoD;
  D[o] = x;
  D[o + 1] = z;
  D[o + 2] = s * (0.85 + Math.random() * 0.3);
  D[o + 3] = 0;
}
// un arc électrique de (x0, y0, z0) à (x1, y1, z1), pendant T secondes ; kd : 0 saut de balle, 1 foudre de l'orage, 2 bond de Volt ;
// HX.arcD, 9 nombres : départ, arrivée, âge, durée, sorte
function hxArc(x0, y0, z0, x1, y1, z1, T, kd) {
  const o = (HX.arcC++ % HXN.arc) * 9,
    A = HX.arcD;
  A[o] = x0;
  A[o + 1] = y0;
  A[o + 2] = z0;
  A[o + 3] = x1;
  A[o + 4] = y1;
  A[o + 5] = z1;
  A[o + 6] = 0;
  A[o + 7] = T;
  A[o + 8] = kd;
}
// un pic de terre de l'Onde de choc en (x, z), taille s, qui jaillit après dl secondes ; HX.spkD, 6 nombres : x, z, temps (négatif = en attente), taille, cap, élément (V5.3)
function hxSpike(x, z, s, dl) {
  const o = (HX.spkC++ % HXN.spk) * 6,
    D = HX.spkD;
  D[o] = x;
  D[o + 1] = z;
  D[o + 2] = -Math.max(0, dl);
  D[o + 3] = s;
  D[o + 4] = Math.random() * 6.283;
  // V5.3 : l'élément qui remplace (rang ; 0 : le pic de terre d'origine)
  D[o + 5] = hxI(HXE);
}
// le voile coloré sur les bords de l'écran : couleur c, force a, durée T
function hxVig(c, a, T) {
  HX.vC = c;
  HX.vA = a;
  HX.vT = 0;
  HX.vD = T;
}
// un segment d'arc (enveloppe jaune et cœur blanc), épaisseur w ; appelé par hxElecFrame entre begin() et end() des réserves boltY / boltW
function hxSeg(x0, y0, z0, x1, y1, z1, w) {
  const ex = x1 - x0,
    ey = y1 - y0,
    ez = z1 - z0,
    h = Math.hypot(ex, ez),
    l = Math.hypot(h, ey);
  if (l < 0.01) return;
  const yw = Math.atan2(ex, ez),
    pt = -Math.atan2(ey, h);
  HX.boltY.add(x0, y0, z0, yw, pt, w, w, l);
  HX.boltW.add(x0, y0, z0, yw, pt, w * 0.32, w * 0.32, l);
}
// V4.8 : un trait du Tir perçant de (x0, y0, z0) à (x1, y1, z1), largeur w, 0,6 s ; HX.beamD, 9 nombres : départ, arrivée, âge, durée, largeur
function hxBeam(x0, y0, z0, x1, y1, z1, w) {
  const o = (HX.beamC++ % HXN.beam) * 9,
    D = HX.beamD;
  D[o] = x0;
  D[o + 1] = y0;
  D[o + 2] = z0;
  D[o + 3] = x1;
  D[o + 4] = y1;
  D[o + 5] = z1;
  D[o + 6] = 0;
  D[o + 7] = 0.6;
  D[o + 8] = w;
}
// un météore touche le sol : deux anneaux, sol brûlé, éclats de roche et flammes (V5.3 : à l'élément qui remplace, HXE ; pas de sol brûlé)
function hxMeteorHit(x, z) {
  const R = Math.random;
  hxRing(x, 0.14, z, 1.2, 11, 0.75, hxC(0xff6a3d, 'main'), 1);
  hxRing(x, 0.16, z, 0.5, 6, 0.35, hxC(0xfff0b0, 'glow'), 0.9);
  if (!HXE) hxScorch(x, z, 5.2);
  for (let i = 0; i < 14; i++) {
    const a = R() * 6.283,
      v = 3 + R() * 7;
    emit(hxK('rock'), x, 0.6, z, Math.cos(a) * v, 5 + R() * 7, Math.sin(a) * v, 1.6 + R(), 0.16 + R() * 0.14, 0.1);
    emit(hxK('fire'), x, 0.8, z, Math.cos(a) * v * 1.3, 3 + R() * 6, Math.sin(a) * v * 1.3, 0.5 + R() * 0.4, 0.3, 0.04);
  }
}
// Onde de choc de Roc : onde au sol depuis l'immeuble, pics de terre sous les zombies (puis au hasard sur la place), poussière, secousse courte
function hxSeisme(S) {
  const R = Math.random,
    Z = S.z;
  G.shake = Math.max(G.shake, 0.9);
  hxRing(0, 0.15, 0, B + 2, 44, 1.1, hxC(0x5a3a1e, 'dark'), 0.9, 1);
  hxRing(0, 0.16, 0, B + 2, 30, 1.5, hxC(0xcf9a5c, 'main'), 0.9);
  let n = 0;
  for (let q = 0; q < S.nAct && n < 30; q++) {
    const i = S.act[q];
    if (!outside(Z, i)) continue;
    const d = Math.hypot(Z.x[i], Z.z[i]);
    if (d > 38) continue;
    hxSpike(Z.x[i] + (R() - 0.5) * 0.8, Z.z[i] + (R() - 0.5) * 0.8, 1 + R() * 0.6, (d - B) / 40);
    n++;
  }
  for (; n < 40; n++) {
    const a = R() * 6.283,
      d = B + BALD + 2 + R() * 20;
    hxSpike(Math.cos(a) * d, Math.sin(a) * d, 0.8 + R() * 0.6, (d - B) / 40);
  }
  for (let i = 0; i < 50; i++) {
    const a = R() * 6.283,
      d = B + BALD + 1 + R() * 30;
    emit('dust', Math.cos(a) * d, 0.2, Math.sin(a) * d, (R() - 0.5) * 2, 2 + R() * 4, (R() - 0.5) * 2, 1.1, 0.25, 0.06);
    if (i % 3 === 0) emit('pdust', Math.cos(a) * d, 0.6, Math.sin(a) * d, R() - 0.5, 0.6, R() - 0.5, 1.6, 0.6, 1.8);
  }
}
// V5.3 : une réserve de modèle (nom : wallA, wallB, bush, treeM, treeG, arw, spk, metR) à la couleur de l'élément el qui remplace celui du sort
// (null : la réserve d'origine, la même que depuis la V5.2). Les autres éléments sont créés au premier besoin ; hxAltBegin / hxAltEnd les vident et
// les dessinent à chaque image (hfxFrame).
function hxPool(nom, el) {
  if (!el) return HX[nom];
  const A = HX.alt[el] || (HX.alt[el] = {});
  if (A[nom]) return A[nom];
  const f = HX.forme,
    m = K.MAT,
    D = {
      wallA: () => HX.reserve(f('hx.rempart', 'm', { bad: 0, el }), m.m, HXN.wall),
      wallB: () => HX.reserve(f('hx.rempart', 'm', { bad: 1, el }), m.m, HXN.wall),
      bush: () => HX.reserve(f('hx.ronce', 'm', { el }), m.m, 3 * HXN.bush),
      treeM: () => HX.reserve(f('hx.arbre', 'm', { el }), m.m, 4),
      treeG: () => HX.reserve(f('hx.arbre', 'g', { el }), m.g, 4),
      arw: () => HX.reserve(f('hx.fleche', 'g', { el }), m.g, HXN.arw),
      spk: () => HX.reserve(f('hx.pic', 'm', { el }), m.m, HXN.spk),
      metR: () => HX.reserve(f('hx.meteore', 'g', { el }), m.g, HXN.met)
    };
  A[nom] = D[nom]();
  A[nom].begin();
  return A[nom];
}
function hxAltBegin() {
  for (const e in HX.alt) for (const n in HX.alt[e]) HX.alt[e][n].begin();
}
function hxAltEnd() {
  for (const e in HX.alt) for (const n in HX.alt[e]) HX.alt[e][n].end();
}
// V5.3 : change la couleur d'une réserve additive si besoin (c : couleur d'origine ; role : celle de l'élément qui remplace)
function hxTeinte(pool, c, role) {
  const h = HXE ? K.EL[HXE][role] : c;
  if (pool.m.material.color.getHex() !== h) pool.m.material.color.setHex(h);
}
