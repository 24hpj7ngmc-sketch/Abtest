// ===================== DERNIER TOIT — l'affichage : le décor et les objets du monde =====================
// La ville et l'immeuble (dessinés une fois : leur forme vient de gfx/models/toit.js, d'après regles/immeuble.js), les volets du
// rez-de-chaussée (baissés « Ils arrivent », relevés « Ils s'échappent »), les barricades des routes pas encore ouvertes, les murs
// d'avenue et leurs nids (améliorations « Murs »), puis les objets : leurre, hélicoptère des secours, tyroliennes et passerelles,
// boutiques (mode fuite seulement), et l'anneau de l'onde de choc.
// Attend des règles : ROADS, roadOpen, SLOTS, SHOPS, HELI, H ; S.mode, S.phase, S.day, S.P.mur / S.P.murH, S.decoy, S.heliT, S.t.
// Fournit : decorInit, objetsInit, ondeInit (appelés par gfxInit), objetsFrame, decorFrame, ondeFrame (appelés par gfxFrame).
// L'onde est lancée par l'événement 'onde' (evenements.js), la barricade qui saute par 'road'.

// la ville, l'immeuble, les volets (deux versions, l'une cachée), une barricade par route, les murs des 4 avenues, les nids de tourelle sur les murs
function decorInit() {
  G.ville = instM('ville');
  scene.add(G.ville);
  G.imm = instM('imm');
  scene.add(G.imm);
  G.vol = { o: instM('volets', { open: '1' }), c: instM('volets', { open: '0' }) };
  scene.add(G.vol.o);
  scene.add(G.vol.c);
  G.barr = ROADS.map((r, i) => {
    const o = instM('barricade', { n: i, w: r.w > 8 ? 14 : 7 });
    o.position.set(r.b[0] - r.dx * 3, 0, r.b[1] - r.dz * 3);
    o.rotation.y = Math.atan2(r.dx, r.dz);
    scene.add(o);
    return o;
  });
  G.murs = ROADS.slice(0, 4).map(r => {
    const o = instM('mur');
    o.position.set(r.b[0] - r.dx * 0.1, 0, r.b[1] - r.dz * 0.1);
    o.rotation.y = Math.atan2(r.dx, r.dz);
    o.visible = false;
    scene.add(o);
    return o;
  });
  G.nids = SLOTS.filter(s => s.k === 'mur').map(s => {
    const o = instM('nid');
    o.position.set(s.x, 0, s.z);
    o.visible = false;
    scene.add(o);
    return o;
  });
}
// l'hélicoptère, le leurre, les tyroliennes avec leurs passerelles (un seul modèle pour les 4), les boutiques ; tous cachés au départ
function objetsInit() {
  G.heli = instM('heli');
  G.heli.visible = false;
  scene.add(G.heli);
  G.decoy = instM('leurre');
  G.decoy.visible = false;
  scene.add(G.decoy);
  // V3.6 : les tyroliennes ; V3.5 : les boutiques (mode fuite seulement)
  G.tyro = instM('tyro');
  G.tyro.visible = false;
  scene.add(G.tyro);
  G.shops = SHOPS.map(s => {
    const o = instM('boutique');
    o.position.set(s.x, s.y, s.z);
    o.rotation.y = s.ry;
    o.visible = false;
    scene.add(o);
    return o;
  });
}
// l'onde de choc : un anneau lumineux qui s'élargit autour de l'immeuble, à mi-hauteur
function ondeInit() {
  G.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.25, 4, 40), matAdd(0x9fd8ff));
  G.ring.rotation.x = -Math.PI / 2;
  G.ring.visible = false;
  scene.add(G.ring);
  G.ringT = 9;
}
// le leurre (animé) ; boutiques et tyroliennes en mode fuite ; l'hélicoptère qui arrive en 9 s (secours, victoire) et soulève la poussière du toit
function objetsFrame(S) {
  const T = S.t;
  G.decoy.visible = !!S.decoy;
  if (S.decoy) {
    G.decoy.position.set(S.decoy.x, 0, S.decoy.z);
    K.pose(G.decoy, T);
  }
  for (const o of G.shops) {
    o.visible = S.mode === 'out';
    if (o.visible) K.pose(o, T);
  }
  G.tyro.visible = S.mode === 'out';
  if (S.phase === 'rescue' || S.phase === 'won') {
    G.heli.visible = true;
    const u = Math.min(1, S.heliT / 9),
      e = 1 - Math.pow(1 - u, 3);
    G.heli.position.set(lerp(-20, HELI[0], e), lerp(60, H, e) + (u < 1 ? Math.sin(T * 2) * 0.3 : 0), lerp(-160, HELI[1], e));
    G.heli.rotation.y = lerp(0.3, 0, e);
    K.pose(G.heli, T);
    if (u > 0.6)
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * 6.28;
        emit('dust', HELI[0] + Math.cos(a) * 3, H + 0.3, HELI[1] + Math.sin(a) * 3, Math.cos(a) * 6, 0.5, Math.sin(a) * 6, 0.6, 0.12, 0.3);
      }
  } else G.heli.visible = false;
}
// volets selon le mode ; une barricade disparaît quand sa route est ouverte (dès le jour de son ouverture, une fois le jour lancé) ;
// murs d'avenue et nids à la hauteur achetée
function decorFrame(S) {
  G.vol.o.visible = S.mode === 'out';
  G.vol.c.visible = S.mode !== 'out';
  G.barr.forEach((o, r) => {
    o.visible = !(roadOpen(r, S.day) && (S.phase !== 'prep' || ROADS[r].day < S.day));
  });
  const hauteurMur = S.P.murH;
  G.murs.forEach(o => {
    o.visible = !!S.P.mur;
    o.scale.set(1, hauteurMur, 1);
  });
  G.nids.forEach(o => {
    o.visible = !!S.P.mur;
    o.position.y = hauteurMur;
  });
}
// l'onde de choc : 0,8 s, de 2 à 42 m, en s'effaçant
function ondeFrame(dt) {
  if (G.ringT < 1) {
    G.ringT += dt * 1.3;
    const r = 2 + G.ringT * 40;
    G.ring.scale.set(r, r, 1);
    G.ring.position.set(0, H * 0.5, 0);
    G.ring.material.opacity = 1 - G.ringT;
    if (G.ringT >= 1) G.ring.visible = false;
  }
}
