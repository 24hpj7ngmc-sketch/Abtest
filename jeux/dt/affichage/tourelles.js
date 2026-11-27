// ===================== DERNIER TOIT — l'affichage : les tourelles, leurs tirs, les projectiles, la portée au marteau =====================
// Chaque tourelle posée (S.tur) a son modèle (tour.mg, tour.la, tour.mo, tour.fl : gfx/models/toit.js) dont la tête pivote (cap) et
// l'arme s'incline, en suivant doucement la visée des règles ; laser : rayons lumineux jusqu'aux cibles ; lance-flammes : jet de flammes ;
// mitrailleuse : étincelle à la bouche (les traçantes arrivent par l'événement 'tracer'). Obus de mortier en cloche, missiles du joueur.
// Marteau en main : un cercle sur chaque emplacement libre ou pris, et la portée de la tourelle visée (disque, bord pulsé ; pour le
// mortier, la distance minimale), vue à travers le parapet.
// Attend des règles : S.tur (slot, ty, x, y, z, ry, rp, beams, flame, ti, flash), S.shells, S.missiles, SLOTS, slotOn, turretReach, TT (couleurs),
// S.P (murH : hauteur des murs d'avenue) ; et de l'interface : save.layout (plan des tourelles), V.hammer, V.aim, V.ptype.
// Fournit : tourellesInit, porteeInit, marquesInit (gfxInit) ; tourellesFrame, projectilesFrame, porteeFrame (gfxFrame).
// Plafonds : 40 rayons laser à la fois.

// rayons laser (enveloppe rouge, cœur blanc), les modèles de tourelle (G.tur, par emplacement) et les missiles en vol (G.miss)
function tourellesInit(boite) {
  G.beam = new IPool(boite, matAdd(0xff4a5e), 40);
  G.beamCore = new IPool(boite, matAdd(0xffffff), 40);
  G.tur = {};
  G.miss = [];
}
// V2.5 : la portée de la tourelle visée au marteau, en cercle au sol (disque pâle + bord ; pour le mortier, aussi la distance minimale),
// vue à travers le parapet et l'immeuble (depthTest coupé)
function porteeInit() {
  G.rng = {};
  for (const k of ['fill', 'edge', 'min']) {
    const geo = k === 'fill' ? new THREE.CircleGeometry(1, 72) : new THREE.RingGeometry(k === 'edge' ? 0.975 : 0.965, 1, 96);
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: 0xffcf5a,
        transparent: true,
        opacity: k === 'fill' ? 0.08 : 0.75,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    m.renderOrder = 3;
    scene.add(m);
    G.rng[k] = m;
  }
}
// un cercle par emplacement de tourelle (visible marteau en main)
function marquesInit() {
  const rg = new THREE.TorusGeometry(0.75, 0.07, 4, 24);
  rg.rotateX(Math.PI / 2);
  G.marks = SLOTS.map(s => {
    const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
    m.position.set(s.x, s.y + 0.06, s.z);
    m.visible = false;
    m.renderOrder = 3;
    scene.add(m);
    return m;
  });
}
// les tourelles posées : modèle créé (ou remplacé si le type change) à la volée, retiré quand la tourelle disparaît ; tête et arme qui suivent
// la visée (×10/s) ; effets de tir. Le mortier est posé plus haut (son socle est plus court).
function tourellesFrame(S, dt) {
  const enJeu = {};
  G.beam.begin();
  G.beamCore.begin();
  for (const t of S.tur) {
    let modele = G.tur[t.slot];
    if (!modele || modele.userData.ty !== t.ty) {
      if (modele) scene.remove(modele);
      modele = instM('tour.' + t.ty);
      modele.userData.ty = t.ty;
      modele.userData.ry = t.ry;
      modele.userData.rp = 0;
      scene.add(modele);
      G.tur[t.slot] = modele;
    }
    enJeu[t.slot] = 1;
    modele.position.set(t.x, t.y - (t.ty === 'mo' ? 0.7 : 1.05), t.z);
    const pieces = modele.userData.nodes;
    let ecart = t.ry - modele.userData.ry;
    while (ecart > Math.PI) ecart -= 6.283;
    while (ecart < -Math.PI) ecart += 6.283;
    modele.userData.ry += ecart * Math.min(1, dt * 10);
    modele.userData.rp += (t.rp - modele.userData.rp) * Math.min(1, dt * 10);
    pieces.head.rotation.y = modele.userData.ry;
    pieces.gun.rotation.x = t.ty === 'mo' ? 0.45 : -modele.userData.rp;
    if (t.ty === 'la') {
      const bout = [t.x, t.y, t.z];
      for (const cible of t.beams) {
        const dx = cible[0] - bout[0],
          dy = cible[1] - bout[1],
          dz = cible[2] - bout[2],
          l = Math.hypot(dx, dy, dz),
          yw = Math.atan2(dx, dz),
          pt = -Math.atan2(dy, Math.hypot(dx, dz)),
          w = 0.13 + Math.random() * 0.05;
        G.beam.add(bout[0], bout[1], bout[2], yw, pt, w, w, l);
        G.beamCore.add(bout[0], bout[1], bout[2], yw, pt, w * 0.35, w * 0.35, l);
        if (Math.random() < 0.3)
          emit(
            'spark',
            cible[0],
            cible[1],
            cible[2],
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4,
            0.25,
            0.06,
            0.01
          );
      }
    }
    if (t.ty === 'fl' && t.flame > 0 && t.ti >= 0) {
      const cp = Math.cos(t.rp);
      for (let k = 0; k < 3; k++) {
        const v = 10 + Math.random() * 4,
          sp = 0.12;
        emit(
          'fire',
          t.x + Math.sin(t.ry) * 0.9 * cp,
          t.y + Math.sin(t.rp) * 0.9,
          t.z + Math.cos(t.ry) * 0.9 * cp,
          (Math.sin(t.ry) * cp + (Math.random() - 0.5) * sp) * v,
          (Math.sin(t.rp) + (Math.random() - 0.5) * sp) * v,
          (Math.cos(t.ry) * cp + (Math.random() - 0.5) * sp) * v,
          0.55 + Math.random() * 0.2,
          0.12,
          0.6
        );
      }
    }
    if (t.ty === 'mg' && t.flash > 0 && Math.random() < 0.5)
      emit('spark', t.x + Math.sin(t.ry) * 1.15, t.y + 0.05, t.z + Math.cos(t.ry) * 1.15, 0, 0, 0, 0.05, 0.18, 0.05);
  }
  for (const s in G.tur)
    if (!enJeu[s]) {
      scene.remove(G.tur[s]);
      delete G.tur[s];
    }
  G.beam.end();
  G.beamCore.end();
}
// obus de mortier (en cloche, une particule « shell » par image et de la fumée), missiles (modèle orienté vers la cible, flammes et fumée)
function projectilesFrame(S, dt) {
  for (const s of S.shells) {
    const u = s.t / s.T,
      x = lerp(s.x0, s.x1, u),
      z = lerp(s.z0, s.z1, u),
      y = lerp(s.y0, s.y1, u) + Math.sin(u * Math.PI) * (8 + s.T * 10);
    emit('shell', x, y, z, 0, 0, 0, dt * 1.01, 0.16, 0.16);
    if (Math.random() < 0.4) emit('smoke', x, y, z, 0, 0, 0, 0.4, 0.08, 0.2);
  }
  while (G.miss.length < S.missiles.length) {
    const o = instM('missile');
    scene.add(o);
    G.miss.push(o);
  }
  G.miss.forEach((o, i) => {
    const m = S.missiles[i];
    o.visible = !!m;
    if (!m) return;
    const u = m.t / m.T,
      x = lerp(m.x0, m.x1, u),
      y = lerp(m.y0, m.y1, u) + Math.sin(u * Math.PI) * 3,
      z = lerp(m.z0, m.z1, u);
    o.position.set(x, y, z);
    o.lookAt(m.x1, m.y1, m.z1);
    emit('fire', x, y, z, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, 0.25, 0.25, 0.05);
    emit('smoke', x, y, z, 0, 0.5, 0, 0.8, 0.15, 0.4);
  });
}
// marteau en main : portée de la tourelle visée (celle du plan, sinon le type choisi) et cercles des emplacements (couleur du type posé,
// doré et pulsé pour l'emplacement visé ; sur les murs d'avenue, à la hauteur des murs)
function porteeFrame(S, V) {
  const T = S.t,
    hauteurMur = S.P.murH;
  {
    const s = V.hammer && V.aim >= 0 ? SLOTS[V.aim] : null,
      ty = s ? (save.layout || {})[s.id] || V.ptype : null,
      portee = s && ty ? turretReach(S, s, ty) : null;
    for (const k in G.rng) G.rng[k].visible = false;
    if (portee && portee.r > 0) {
      const couleur = new THREE.Color(TT[ty].c),
        pouls = 0.75 + 0.25 * Math.sin(performance.now() * 0.006);
      for (const k of ['fill', 'edge']) G.rng[k].material.color.copy(couleur);
      G.rng.edge.material.opacity = 0.55 + 0.3 * pouls;
      for (const k of ['fill', 'edge']) {
        const m = G.rng[k];
        m.visible = true;
        m.position.set(s.x, portee.y + (k === 'edge' ? 0.02 : 0), s.z);
        m.scale.set(portee.r, portee.r, 1);
      }
      if (portee.rmin > 0) {
        const m = G.rng.min;
        m.visible = true;
        m.material.color.copy(couleur);
        m.position.set(s.x, portee.y + 0.03, s.z);
        m.scale.set(portee.rmin, portee.rmin, 1);
      }
    }
  }
  G.marks.forEach((m, i) => {
    const s = SLOTS[i],
      actif = V.hammer && slotOn(S.P, s, S.mode);
    m.visible = actif;
    if (!actif) return;
    m.position.y = (s.k === 'mur' ? hauteurMur : s.y) + 0.06;
    const ty = (save.layout || {})[i],
      vise = V.aim === i;
    m.material.color.setHex(vise ? 0xffcf5a : ty ? parseInt(TT[ty].c.slice(1), 16) : 0xffffff);
    m.material.opacity = vise ? 1 : 0.75;
    const k = vise ? 1.25 + Math.sin(T * 8) * 0.08 : 1;
    m.scale.set(k, 1, k);
  });
}
