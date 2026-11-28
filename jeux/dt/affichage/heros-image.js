// ===================== DERNIER TOIT — l'affichage : effets des héros, ce qui dure (à chaque image) =====================
// Redessiné à chaque image depuis l'état des règles : S.fballs (boules de feu), S.fires (flammes au sol), S.meteors, S.thorns (ronciers),
// S.guards (gardiens), S.ramparts, S.storms, S.flood (Sanctuaire), et les zombies (Z.burn en feu, Z.psn empoisonnés, Z.slow ralentis).
// hfxFrame est appelé par gfxFrame (avant partStep), et lu par tests/herofx.js. Les sous-fonctions passent dans l'ordre d'avant le découpage
// (elles tirent au hasard et émettent des particules : l'ordre compte).
// Fournit : hfxFrame. Attend : HX (heros.js), ZT, S.hero, camera, scene, hemi, sun.
function hfxFrame(S, dt) {
  if (!HX) hfxInit();
  hxSync(S);
  // V5.3 : les modèles des autres éléments (hxPool) sont vidés ici et dessinés à la fin
  hxAltBegin();
  const meteores = hxFeuFrame(S, dt);
  hxBoisFrame(S, dt);
  hxTerreFrame(S, dt);
  const orage = hxElecFrame(S, dt);
  hxVentFrame(dt);
  hxAuraFrame(S, dt);
  hxAnneauxFrame(dt);
  hxSolBruleFrame(dt);
  hxZombiesFrame(S);
  const deluge = hxDelugeFrame(S, dt);
  hxCielFrame(S, dt, meteores, orage, deluge);
  hxAltEnd();
  HXE = null;
}
// Braise : boules de feu, flammes au sol de l'Orbe, météores ; renvoie 1 si un météore est en vol
function hxFeuFrame(S, dt) {
  const R = Math.random,
    T = G.time;
  // Braise : boules de feu en vol (grossissent en partant, traînée de flammes)
  HX.fbC.begin();
  HX.fbG.begin();
  HX.fbT.begin();
  for (const f of S.fballs) {
    // V5.3 : l'élément choisi qui remplace le feu (f.ec) : la couleur de la boule, de sa lueur et de sa traînée
    hxSk(f.ec, 'feu');
    hxTeinte(HX.fbC, 0xfff1b8, 'glow');
    hxTeinte(HX.fbG, 0xff6a3d, 'main');
    hxTeinte(HX.fbT, 0xff8a3a, 'light');
    const u = Math.min(1, f.t / f.T),
      dx = f.x1 - f.x0,
      dy = f.y1 - f.y0,
      dz = f.z1 - f.z0,
      h = Math.hypot(dx, dz),
      l = Math.hypot(h, dy) || 1,
      k = Math.min(1.4, l * 0.3) / l;
    const x0 = f.x0 + dx * k,
      y0 = f.y0 + dy * k,
      z0 = f.z0 + dz * k,
      x = x0 + (f.x1 - x0) * u,
      y = y0 + (f.y1 + 0.3 - y0) * u + Math.sin(u * Math.PI) * Math.min(3, l * 0.05),
      z = z0 + (f.z1 - z0) * u,
      s = 0.8 * Math.min(1, 0.25 + u * 6);
    HX.fbC.add(x, y, z, T * 9, T * 7, s * 0.55);
    HX.fbG.add(x, y, z, T * 5, T * 3, s * (1.05 + 0.12 * Math.sin(T * 47)));
    HX.fbT.add(x, y, z, Math.atan2(-dx, -dz), -Math.atan2(-dy, h), s * 0.8, s * 0.8, Math.min(6, l * u + 0.2));
    for (let i = 0; i < 3; i++)
      emit(
        hxK('fire'),
        x + (R() - 0.5) * 0.5 * s,
        y + (R() - 0.5) * 0.5 * s,
        z + (R() - 0.5) * 0.5 * s,
        (R() - 0.5) * 1.5,
        (R() - 0.5) * 1.5 + 0.6,
        (R() - 0.5) * 1.5,
        0.3 + R() * 0.2,
        0.3 * s + 0.12,
        0.04
      );
    if (R() < 0.4) emit('smoke', x, y, z, (R() - 0.5) * 0.6, 0.8, (R() - 0.5) * 0.6, 1, 0.15, 0.5);
  }
  HX.fbC.end();
  HX.fbG.end();
  HX.fbT.end();
  // flammes au sol de l'Orbe (les feux de rayon ≥ 4 m ; ceux du lance-flammes gardent leur dessin) : lueur au sol, flammes, fumée
  HX.glow.begin();
  for (const f of S.fires) {
    if (f.r < 4) continue;
    // V5.3 : un feu au sol d'un autre élément (f.el) : sa lueur et ses flammes à la couleur de cet élément
    hxSk(f.el, 'feu');
    hxTeinte(HX.glow, 0xff5a1e, 'main');
    const a = Math.min(1, f.t / 1.2),
      q = f.r * (0.92 + 0.08 * Math.sin(T * 11 + f.x)) * a;
    HX.glow.add(f.x, 0.07, f.z, 0, 0, q, 1, q);
    for (let i = 0; i < 3; i++) {
      if (R() > a) continue;
      const b = R() * 6.283,
        rr = Math.sqrt(R()) * f.r * 0.9;
      emit(
        hxK('fire'),
        f.x + Math.cos(b) * rr,
        0.12,
        f.z + Math.sin(b) * rr,
        (R() - 0.5) * 0.6,
        1.6 + R() * 2.6,
        (R() - 0.5) * 0.6,
        0.45 + R() * 0.4,
        0.3 + R() * 0.22,
        0.04
      );
    }
    if (R() < 0.3 * a)
      emit('smoke', f.x + (R() - 0.5) * f.r, 1.4, f.z + (R() - 0.5) * f.r, (R() - 0.5) * 0.5, 1.3 + R(), (R() - 0.5) * 0.5, 1.8, 0.4, 1.3);
  }
  HX.glow.end();
  HXE = null;
  // Météores : la roche tombe du ciel (de derrière l'immeuble vers la rue), traînée, cible au sol qui se resserre
  HX.metR.begin();
  HX.metG.begin();
  HX.metT.begin();
  HX.mark.begin();
  const M = HX.metD;
  let meteore = 0;
  for (let j = 0; j < HXN.met; j++) {
    const o = j * 7;
    if (M[o + 2] <= 0) continue;
    M[o + 2] -= dt;
    // V5.3 : l'élément qui remplace le feu pour ce météore (M[o + 6] : son rang)
    HXE = hxE(M[o + 6]);
    hxTeinte(HX.metG, 0xff7a2e, 'main');
    hxTeinte(HX.metT, 0xffa040, 'light');
    hxTeinte(HX.mark, 0xff4a2a, 'main');
    if (M[o + 2] <= 0) {
      hxMeteorHit(M[o], M[o + 1]);
      continue;
    }
    meteore = 1;
    const u = 1 - M[o + 2] / M[o + 3],
      ex = M[o + 4] - M[o],
      ez = M[o + 5] - M[o + 1],
      ey = 56,
      h = Math.hypot(ex, ez),
      l = Math.hypot(h, ey),
      x = M[o] + ex * (1 - u),
      y = 0.6 + ey * (1 - u),
      z = M[o + 1] + ez * (1 - u),
      mk = 1.8 + 4.6 * (1 - u);
    hxPool('metR', HXE).add(x, y, z, T * 4 + j, T * 3 + j, 1.25);
    HX.metG.add(x, y, z, 0, 0, 2.4 + 0.35 * Math.sin(T * 41 + j));
    HX.metT.add(x, y, z, Math.atan2(ex, ez), -Math.atan2(ey, h), 1.7, 1.7, Math.min(18, l * u + 0.5));
    HX.mark.add(M[o], 0.15, M[o + 1], T * 2, 0, mk, 1, mk);
    for (let i = 0; i < 2; i++)
      emit(
        hxK('fire'),
        x + (R() - 0.5) * 1.2,
        y + (R() - 0.5) * 1.2,
        z + (R() - 0.5) * 1.2,
        (R() - 0.5) * 2,
        (R() - 0.5) * 2 + 2,
        (R() - 0.5) * 2,
        0.45,
        0.8,
        0.12
      );
    if (R() < 0.7) emit('smoke', x, y + 0.5, z, R() - 0.5, 0.6, R() - 0.5, 1.6, 0.7, 2);
  }
  HX.metR.end();
  HX.metG.end();
  HX.metT.end();
  HX.mark.end();
  HXE = null;
  return meteore;
}
// Sylve : ronciers, gardiens, flèches
function hxBoisFrame(S, dt) {
  const R = Math.random;
  // Entraves : les touffes poussent l'une après l'autre (du centre vers le bord), sursautent à chaque entrave, puis se fanent
  HX.bush.begin();
  HX.bushD.begin();
  HX.tring.begin();
  for (const Th of S.thorns) {
    // V5.3 : l'élément choisi qui remplace la Nature (Th.ec) : touffes, disque et anneau à sa palette
    hxSk(Th.ec, 'bois');
    hxTeinte(HX.bushD, 0x34502a, 'dark');
    hxTeinte(HX.tring, 0x7dff6a, 'light');
    const bush = hxPool('bush', HXE);
    let a = HX.age.get(Th) || 0;
    a += dt;
    HX.age.set(Th, a);
    const fd = Math.min(1, Th.t / 0.7),
      pul = Math.max(0, (Th.pulse - 0.8) / 0.2),
      N = HXN.bush,
      dk = Th.r * Math.min(1, a / 0.3) * (0.5 + 0.5 * fd);
    HX.bushD.add(Th.x, Th.y + 0.05, Th.z, 0, 0, dk, 1, dk);
    const er = dk * (1.02 + 0.06 * pul);
    HX.tring.add(Th.x, Th.y + 0.1, Th.z, 0, 0, er, 1, er);
    for (let k = 0; k < N; k++) {
      const an = k * 2.39996 + Th.x * 0.37,
        rr = Th.r * 0.9 * Math.sqrt((k + 0.5) / N),
        g = Math.max(0, Math.min(1, a * 2.6 - (k / N) * 0.7)),
        hv = ((k * 37 + 11) % 23) / 23,
        s = (0.8 + 0.55 * hv) * (g > 0 ? easeB(g) : 0) * fd * (1 + 0.2 * pul);
      if (s <= 0.01) continue;
      bush.add(
        Th.x + Math.cos(an) * rr,
        Th.y - (1 - fd) * 0.6,
        Th.z + Math.sin(an) * rr,
        an * 2.3 + hv * 4,
        0,
        s * 1.15,
        s * (0.85 + 0.5 * hv),
        s * 1.15
      );
    }
    if (pul > 0.9)
      for (let i = 0; i < 5; i++) {
        const b = R() * 6.283,
          d = R() * Th.r;
        emit(
          hxK('leaf'),
          Th.x + Math.cos(b) * d,
          Th.y + 1,
          Th.z + Math.sin(b) * d,
          (R() - 0.5) * 2,
          1.5 + R() * 2,
          (R() - 0.5) * 2,
          1.3,
          0.12,
          0.08,
          Th.y
        );
      }
    if (R() < 0.12)
      emit(hxK('leaf'), Th.x + (R() - 0.5) * Th.r, Th.y + 1.2, Th.z + (R() - 0.5) * Th.r, R() - 0.5, 0.4, R() - 0.5, 1.5, 0.1, 0.08, Th.y);
  }
  HX.bush.end();
  HX.bushD.end();
  HX.tring.end();
  HXE = null;
  // Gardiens : l'arbre jaillit du sol (rebond), perd des feuilles, puis rentre sous terre à la fin
  HX.treeM.begin();
  HX.treeG.begin();
  for (const Gd of S.guards) {
    hxSk(Gd.ec, 'bois');
    const treeM = hxPool('treeM', HXE),
      treeG = hxPool('treeG', HXE);
    let a = HX.age.get(Gd) || 0;
    a += dt;
    HX.age.set(Gd, a);
    const g = Math.min(1, a / 1.1),
      fd = Math.min(1, Gd.t / 0.8),
      sy = easeB(g) * fd,
      sx = (0.3 + 0.7 * easeO(Math.min(1, a / 0.8))) * fd,
      yw = Gd.x * 0.13 + Gd.z * 0.07;
    if (sy <= 0.01) continue;
    treeM.add(Gd.x, 0, Gd.z, yw, 0, sx, sy, sx);
    treeG.add(Gd.x, 0, Gd.z, yw, 0, sx, sy, sx);
    if (a < 1.2) {
      for (let i = 0; i < 2; i++) {
        const b = R() * 6.283;
        emit(
          hxK('leaf'),
          Gd.x + Math.cos(b) * 2,
          1 + R() * 6 * sy,
          Gd.z + Math.sin(b) * 2,
          Math.cos(b) * 2,
          1 + R() * 2,
          Math.sin(b) * 2,
          1.5,
          0.16,
          0.1
        );
      }
      if (R() < 0.5)
        emit('dust', Gd.x + (R() - 0.5) * 2, 0.1, Gd.z + (R() - 0.5) * 2, (R() - 0.5) * 3, 1 + R() * 2, (R() - 0.5) * 3, 0.8, 0.2, 0.05);
    } else if (R() < 0.05)
      emit(hxK('leaf'), Gd.x + (R() - 0.5) * 3, 4 + R() * 3, Gd.z + (R() - 0.5) * 3, R() - 0.5, 0.2, R() - 0.5, 2.4, 0.13, 0.1);
  }
  HX.treeM.end();
  HX.treeG.end();
  HXE = null;
  // flèches des gardiens : vol tendu et rapide, traînée verte, petit nuage de poison à l'arrivée
  HX.arw.begin();
  HX.arwT.begin();
  const W = HX.arwD;
  for (let j = 0; j < HXN.arw; j++) {
    const o = j * 9;
    if (W[o + 6] >= W[o + 7]) continue;
    W[o + 6] += dt;
    // V5.3 : l'élément qui remplace la Nature pour cette flèche (W[o + 8] : son rang)
    HXE = hxE(W[o + 8]);
    hxTeinte(HX.arwT, 0x8dff86, 'light');
    const dx = W[o + 3] - W[o],
      dy = W[o + 4] - W[o + 1],
      dz = W[o + 5] - W[o + 2],
      h = Math.hypot(dx, dz),
      l = Math.hypot(h, dy);
    if (W[o + 6] >= W[o + 7]) {
      for (let i = 0; i < 5; i++)
        emit(hxK('mist'), W[o + 3], W[o + 4], W[o + 5], (R() - 0.5) * 1.5, 0.3 + R(), (R() - 0.5) * 1.5, 0.9, 0.2, 0.5);
      emit(hxK('leaf'), W[o + 3], W[o + 4], W[o + 5], (R() - 0.5) * 2, 1 + R() * 2, (R() - 0.5) * 2, 1, 0.1, 0.06);
      continue;
    }
    const u = W[o + 6] / W[o + 7],
      x = W[o] + dx * u,
      y = W[o + 1] + dy * u,
      z = W[o + 2] + dz * u,
      yw = Math.atan2(dx, dz),
      pt = -Math.atan2(dy, h);
    hxPool('arw', HXE).add(x, y, z, yw, pt, 1.3);
    HX.arwT.add(x, y, z, yw + Math.PI, -pt, 0.16, 0.16, Math.min(5, l * u + 0.1));
  }
  HX.arw.end();
  HX.arwT.end();
  HXE = null;
}
// Roc : remparts, pics de l'Onde de choc
function hxTerreFrame(S, dt) {
  const R = Math.random;
  // Rempart : un enregistrement par mur (par id), qui survit à sa fin le temps de s'enfoncer ; il sort du sol en rebondissant
  for (const Wl of S.ramparts) {
    let w = null;
    for (const q of HX.walls)
      if (q.on && q.id === Wl.id) {
        w = q;
        break;
      }
    if (!w) {
      for (const q of HX.walls)
        if (!q.on) {
          w = q;
          break;
        }
      if (!w) continue;
      w.on = 1;
      w.id = Wl.id;
      w.x = Wl.x;
      w.z = Wl.z;
      w.nx = Wl.nx;
      w.nz = Wl.nz;
      w.half = Wl.half;
      w.age = 0;
      w.fin = -1;
      w.broke = 0;
      w.hp1 = 1;
      // V5.3 : l'élément choisi qui remplace la Terre (Wl.ec)
      w.ec = Wl.ec || null;
    }
    w.hp = Wl.hp / Wl.hp0;
    w.seen = 1;
    // V4.9 : Avant-garde, le rempart qui charge : il suit sa place, et soulève de la poussière
    if (Math.abs(Wl.x - w.x) + Math.abs(Wl.z - w.z) > 0.01) {
      const tx = -w.nz,
        tz = w.nx;
      for (let i = 0; i < 3; i++) {
        const u = (R() * 2 - 1) * w.half;
        emit('dust', Wl.x + tx * u, 0.2, Wl.z + tz * u, w.nx * (2 + R() * 3), 0.6 + R() * 1.5, w.nz * (2 + R() * 3), 0.9, 0.35, 0.06);
      }
      w.x = Wl.x;
      w.z = Wl.z;
    }
  }
  HX.wallA.begin();
  HX.wallB.begin();
  for (const w of HX.walls) {
    if (!w.on) continue;
    hxSk(w.ec, 'terre');
    if (!w.seen && w.fin < 0) w.fin = 0;
    w.seen = 0;
    w.age += dt;
    let y = 0;
    const tx = -w.nz,
      tz = w.nx;
    if (w.fin >= 0) {
      w.fin += dt;
      if (w.broke || w.fin > 1) {
        w.on = 0;
        continue;
      }
      y = -2.9 * ease(w.fin);
      if (R() < 0.6) {
        const u = (R() * 2 - 1) * w.half;
        emit('dust', w.x + tx * u, 0.15, w.z + tz * u, (R() - 0.5) * 2, 1 + R() * 1.5, (R() - 0.5) * 2, 0.8, 0.25, 0.06);
      }
    } else {
      if (w.age < 0.5) {
        y = -2.9 * (1 - easeB(w.age / 0.5));
        for (let i = 0; i < 2; i++) {
          const u = (R() * 2 - 1) * w.half,
            s = R() < 0.5 ? -1 : 1;
          emit(
            hxK('rock'),
            w.x + tx * u + w.nx * s * 0.7,
            0.2,
            w.z + tz * u + w.nz * s * 0.7,
            w.nx * s * 2 + (R() - 0.5),
            3 + R() * 3,
            w.nz * s * 2 + (R() - 0.5),
            1,
            0.1,
            0.06
          );
        }
      }
      // les zombies qui tapent dessus en font sauter des éclats ; à mi-vie il se fissure (modèle abîmé) dans un nuage de pierres
      if (w.hp < w.hp1 - 0.002 && R() < 0.35) {
        const u = (R() * 2 - 1) * w.half;
        emit(hxK('rock'), w.x + tx * u, 0.4 + R() * 1.6, w.z + tz * u, (R() - 0.5) * 3, 1 + R() * 2, (R() - 0.5) * 3, 1, 0.09, 0.06);
      }
      if (w.hp < 0.5 && w.hp1 >= 0.5)
        for (let i = 0; i < 14; i++) {
          const u = (R() * 2 - 1) * w.half;
          emit(hxK('rock'), w.x + tx * u, 1 + R() * 1.6, w.z + tz * u, (R() - 0.5) * 4, 2 + R() * 3, (R() - 0.5) * 4, 1.4, 0.13, 0.08);
          emit('pdust', w.x + tx * u, 1.5, w.z + tz * u, R() - 0.5, 0.4, R() - 0.5, 1.2, 0.4, 1.2);
        }
      w.hp1 = w.hp;
    }
    hxPool(w.hp < 0.5 ? 'wallB' : 'wallA', HXE).add(w.x, y, w.z, Math.atan2(-w.nx, -w.nz), 0, w.half / 4.5, 1, 1);
  }
  HX.wallA.end();
  HX.wallB.end();
  HXE = null;
  // pics de terre de l'Onde de choc : ils jaillissent en vague (retard selon la distance), tiennent, puis rentrent
  HX.spk.begin();
  const D = HX.spkD;
  for (let j = 0; j < HXN.spk; j++) {
    const o = j * 6;
    if (D[o + 2] >= 1.5) continue;
    HXE = hxE(D[o + 5]);
    const t0 = D[o + 2];
    D[o + 2] += dt;
    const t = D[o + 2];
    if (t < 0) continue;
    if (t0 <= 0 && t > 0)
      for (let i = 0; i < 3; i++) emit(hxK('rock'), D[o], 0.3, D[o + 1], (R() - 0.5) * 4, 3 + R() * 4, (R() - 0.5) * 4, 1.2, 0.12, 0.08);
    const e = t < 0.16 ? easeB(t / 0.16) : t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.6),
      s = D[o + 3];
    if (e <= 0.01) continue;
    hxPool('spk', HXE).add(D[o], 0, D[o + 1], D[o + 4], 0, s * (0.6 + 0.4 * Math.min(1, e)), s * e, s * (0.6 + 0.4 * Math.min(1, e)));
  }
  HX.spk.end();
  HXE = null;
}
// Volt : orages (renvoie leur force, 0 à 1, pour assombrir le ciel), arcs électriques, traînée du bond
function hxElecFrame(S, dt) {
  const R = Math.random,
    T = G.time;
  // Déchaînement : nuage sombre qui tourne lentement, cercle de la zone au sol, lueurs dans le nuage
  HX.cloud.begin();
  HX.sring.begin();
  let orage = 0;
  for (const O of S.storms) {
    // V5.3 : l'élément choisi qui remplace l'Élec (O.ec) : cercle au sol et lueurs du nuage
    hxSk(O.ec, 'elec');
    hxTeinte(HX.sring, 0xffd93b, 'main');
    let a = HX.age.get(O) || 0;
    a += dt;
    HX.age.set(O, a);
    const e = easeO(Math.max(0, Math.min(1, a / 0.7, O.t / 0.7)));
    orage = Math.max(orage, e);
    HX.cloud.add(O.x, O.y + 27 + Math.sin(T * 0.8) * 0.4, O.z, a * 0.12, 0, 1.5 * e, 1.1 * e, 1.5 * e);
    const rr = O.r * (0.6 + 0.4 * e);
    HX.sring.add(O.x, O.y + 0.14, O.z, 0, 0, rr, 1, rr);
    if (R() < 0.06 * e) flashAt(O.x + (R() - 0.5) * 14, O.y + 26, O.z + (R() - 0.5) * 14, 6, hxC(0xfff2a0, 'glow'), 0.16);
  }
  HX.cloud.end();
  HX.sring.end();
  HXE = null;
  // arcs électriques en zigzag, retirés au hasard à chaque image (ça scintille) ; 0 : saut de balle, 1 : foudre de l'orage, 2 : bond de Volt
  HX.boltY.begin();
  HX.boltW.begin();
  // V5.3 : les arcs d'un sort à l'élément choisi (HX.arcEl, posé par l'événement) prennent sa couleur ; sans arc de sort vivant, les jaunes d'origine
  HXE = HX.arcEl || null;
  hxTeinte(HX.boltY, 0xffe36a, 'light');
  HXE = null;
  const A = HX.arcD;
  let vivants = 0;
  for (let j = 0; j < HXN.arc; j++) {
    const o = j * 9;
    if (A[o + 6] >= A[o + 7]) continue;
    A[o + 6] += dt;
    if (A[o + 6] >= A[o + 7]) continue;
    vivants++;
    const kd = A[o + 8],
      n = kd === 1 ? 10 : kd === 2 ? 7 : 5,
      fade = 1 - A[o + 6] / A[o + 7],
      x0 = A[o],
      y0 = A[o + 1],
      z0 = A[o + 2],
      dx = A[o + 3] - x0,
      dy = A[o + 4] - y0,
      dz = A[o + 5] - z0,
      L = Math.hypot(dx, dy, dz),
      amp = kd === 1 ? 1.6 : Math.min(0.6, L * 0.09),
      w = (kd === 1 ? 0.45 : kd === 2 ? 0.12 : 0.14) * (0.5 + 0.5 * fade);
    let px = x0,
      py = y0,
      pz = z0;
    for (let s = 1; s <= n; s++) {
      const u = s / n,
        jt = s < n ? amp : 0,
        qx = x0 + dx * u + (R() - 0.5) * 2 * jt,
        qy = y0 + dy * u + (kd === 1 ? 0 : (R() - 0.5) * 2 * jt),
        qz = z0 + dz * u + (R() - 0.5) * 2 * jt;
      hxSeg(px, py, pz, qx, qy, qz, w);
      px = qx;
      py = qy;
      pz = qz;
    }
  }
  HX.boltY.end();
  HX.boltW.end();
  if (!vivants) HX.arcEl = null;
  // traînée lumineuse du bond de Volt : un cône couché, large là où le bond a commencé, pointu sur le joueur (rien d'éblouissant sous la caméra)
  HX.dash.begin();
  HXE = HX.dashEl || null;
  hxTeinte(HX.dash, 0xffd93b, 'main');
  HXE = null;
  const DS = HX.dashD;
  let vd = 0;
  for (let j = 0; j < HXN.dash; j++) {
    const o = j * 7;
    if (DS[o + 5] >= DS[o + 6]) continue;
    vd++;
    DS[o + 5] += dt;
    const u = Math.min(1, DS[o + 5] / DS[o + 6]),
      w = 0.55 * (1 - u),
      ex = DS[o + 3] - DS[o],
      ez = DS[o + 4] - DS[o + 2],
      l = Math.hypot(ex, ez);
    if (l < 0.1 || w <= 0) continue;
    HX.dash.add(DS[o], DS[o + 1], DS[o + 2], Math.atan2(ex, ez), 0, w, w * 0.45, l);
  }
  HX.dash.end();
  if (!vd) HX.dashEl = null;
  return orage;
}
// V4.9 : Mage de bataille (voie b de Braise) : des flammes courent sur le cercle de l'aura, autour des pieds
function hxAuraFrame(S, dt) {
  if (S.hero !== 'feu' || S.voie !== 'b' || S.p.down > 0) return;
  HX.auraA = (HX.auraA || 0) + dt * 30;
  const p = S.p,
    R = 3 + (S.hm.spB1 || 0),
    sol = floorY(p.x, p.y + 0.3, p.z);
  for (; HX.auraA >= 1; HX.auraA--) {
    const a = Math.random() * 6.283;
    hxSk(elH(S), 'feu');
    emit(hxK('fire'), p.x + Math.cos(a) * R, sol + 0.1, p.z + Math.sin(a) * R, 0, 1 + Math.random(), 0, 0.35, 0.12, 0.02, sol);
  }
  HXE = null;
}
// V4.8 : Zéphyr : les traits du Tir perçant (s'amincissent en 0,6 s ; le cœur blanc s'éteint plus vite)
function hxVentFrame(dt) {
  const D = HX.beamD;
  HX.beam.begin();
  HX.beamW.begin();
  for (let j = 0; j < HXN.beam; j++) {
    const o = j * 9;
    if (D[o + 6] >= D[o + 7]) continue;
    D[o + 6] += dt;
    const u = Math.min(1, D[o + 6] / D[o + 7]),
      ex = D[o + 3] - D[o],
      ey = D[o + 4] - D[o + 1],
      ez = D[o + 5] - D[o + 2],
      h = Math.hypot(ex, ez),
      l = Math.hypot(h, ey);
    if (l < 0.1) continue;
    const yw = Math.atan2(ex, ez),
      pt = -Math.atan2(ey, h),
      w = D[o + 8] * (1 - u) * (1 - u);
    if (w <= 0.01) continue;
    // départ un peu devant l'œil (rien d'éblouissant sous la caméra)
    const k = Math.min(0.8, 1.2 / l);
    HX.beam.add(D[o] + ex * k, D[o + 1] + ey * k, D[o + 2] + ez * k, yw, pt, w, w, l * (1 - k));
    if (u < 0.5) HX.beamW.add(D[o] + ex * k, D[o + 1] + ey * k, D[o + 2] + ez * k, yw, pt, w * 0.3, w * 0.3, l * (1 - k));
  }
  HX.beam.end();
  HX.beamW.end();
}
// les anneaux au sol (tous les héros) et les vagues de la Répulsion d'Ondine
function hxAnneauxFrame(dt) {
  const R = Math.random;
  // anneaux au sol (ondes), vagues de la Répulsion
  for (const q of HX.rings) {
    if (q.t >= q.T) continue;
    q.t += dt;
    const u = Math.min(1, q.t / q.T),
      r = q.r0 + (q.r1 - q.r0) * easeO(u);
    q.m.scale.set(r, 1, r);
    q.m.material.opacity = q.a * (1 - u) * (1 - u * 0.3);
    if (q.t >= q.T) q.m.visible = false;
  }
  for (const w of HX.waves) {
    if (w.t >= 1.1) continue;
    w.t += dt;
    const u = Math.min(1, w.t / 1.1);
    if (u >= 1) {
      w.c.visible = w.f.visible = w.d.visible = false;
      continue;
    }
    const r = 1.5 + (w.r * 1.05 - 1.5) * easeO(u),
      h = 0.3 + 2.6 * Math.pow(Math.sin(Math.min(1, u * 1.25) * Math.PI), 0.8),
      op = 1 - u * u;
    // V5.3 : les gouttes de la vague suivent l'élément qui remplace l'Eau (w.el)
    HXE = w.el || null;
    w.c.visible = w.f.visible = w.d.visible = true;
    w.c.position.set(w.x, w.y, w.z);
    w.c.scale.set(r, h, r);
    w.c.material.opacity = 0.55 * op;
    w.f.position.set(w.x, w.y + h * 0.82, w.z);
    w.f.scale.set(r * 1.02, h * 0.22, r * 1.02);
    w.f.material.opacity = 0.85 * op;
    w.d.position.set(w.x, w.y + 0.06, w.z);
    w.d.scale.set(r, 1, r);
    w.d.material.opacity = 0.4 * op;
    for (let i = 0; i < 4; i++) {
      const b = R() * 6.283;
      emit(
        hxK('water'),
        w.x + Math.cos(b) * r,
        w.y + h * (0.6 + R() * 0.5),
        w.z + Math.sin(b) * r,
        Math.cos(b) * (2 + R() * 3),
        2 + R() * 4,
        Math.sin(b) * (2 + R() * 3),
        0.8 + R() * 0.4,
        0.14 + R() * 0.08,
        0.05,
        w.y
      );
    }
    HXE = null;
  }
}
// les taches de sol brûlé
function hxSolBruleFrame(dt) {
  // sol brûlé (boule de feu, météores, foudre) : 14 s puis il se résorbe
  HX.sco.begin();
  const SD = HX.scoD;
  for (let j = 0; j < HXN.sco; j++) {
    const o = j * 4;
    if (SD[o + 3] >= 14) continue;
    SD[o + 3] += dt;
    const a = SD[o + 3],
      s = SD[o + 2] * (a < 0.25 ? a / 0.25 : a > 11 ? Math.max(0, (14 - a) / 3) : 1);
    if (s > 0.01) HX.sco.add(SD[o], 0.045 + j * 0.0005, SD[o + 1], j * 1.7, 0, s, 1, s);
  }
  HX.sco.end();
}
// les zombies touchés : flammes (tous, même sans héros), brume de poison et reflet bleu (avec un héros ; V4.8 : reflet aussi avec une arme d'Eau)
function hxZombiesFrame(S) {
  const R = Math.random,
    T = G.time,
    Z = S.z;
  // zombies : en feu (petites flammes), empoisonnés (brume verte), ralentis par Ondine (reflet bleu sous les pieds) ; nombre d'émissions plafonné par image
  HX.wet.begin();
  let nb = 0,
    nm = 0,
    nw = 0;
  const hero = !!S.hero,
    eau = elH(S) === 'eau' || S.elArme === 'eau';
  for (let q = 0; q < S.nAct; q++) {
    const i = S.act[q],
      st = Z.st[i];
    if (st === 0) continue;
    if (Z.burn[i] > 0 && nb < 6 && R() < 0.22) {
      nb++;
      const sc = ZT[Z.ty[i]].sc;
      emit(
        'fire',
        Z.x[i] + (R() - 0.5) * 0.45 * sc,
        Z.y[i] + (0.5 + R() * 1.1) * sc,
        Z.z[i] + (R() - 0.5) * 0.45 * sc,
        (R() - 0.5) * 0.5,
        1.3 + R() * 1.2,
        (R() - 0.5) * 0.5,
        0.35 + R() * 0.2,
        0.16 * sc,
        0.03
      );
    }
    if (!hero) continue;
    if (Z.psn[i] > 0 && nm < 6 && R() < 0.15) {
      nm++;
      const sc = ZT[Z.ty[i]].sc;
      emit(
        'mist',
        Z.x[i] + (R() - 0.5) * 0.5 * sc,
        Z.y[i] + (0.4 + R() * 1.2) * sc,
        Z.z[i] + (R() - 0.5) * 0.5 * sc,
        (R() - 0.5) * 0.3,
        0.4 + R() * 0.4,
        (R() - 0.5) * 0.3,
        0.9 + R() * 0.5,
        0.12 * sc,
        0.35 * sc
      );
    }
    if (eau && Z.slow[i] > 0 && (st === 1 || st === 3) && nw < HXN.wet) {
      nw++;
      const sc = ZT[Z.ty[i]].sc * (0.95 + 0.08 * Math.sin(T * 6 + i));
      HX.wet.add(Z.x[i], Z.y[i] + 0.06, Z.z[i], 0, 0, sc * 0.75, 1, sc * 0.75);
    }
  }
  HX.wet.end();
}
// Ondine : le Sanctuaire (renvoie sa force lissée, 0 à 1)
function hxDelugeFrame(S, dt) {
  const R = Math.random;
  // Sanctuaire : pluie autour de la caméra, flaques sur la place et les avenues, ciel bleu-gris
  const fl = S.flood > 0 ? 1 : 0;
  // V5.3 : l'élément choisi qui remplace l'Eau (S.floodEc) : pluie, flaques, gouttes
  hxSk(S.floodEc, 'eau');
  hxTeinte(HX.rain, 0xd6ecff, 'light');
  hxTeinte(HX.pud, 0x2f6f9f, 'dark');
  HX.fw += (fl - HX.fw) * Math.min(1, dt * (fl ? 1.5 : 0.8));
  const fw = HX.fw;
  HX.rain.begin();
  HX.pud.begin();
  if (fw > 0.02) {
    const c = camera.position,
      RD = HX.rainD,
      n = Math.round(HXN.rain * Math.min(1, fw * 1.3)),
      PD = HX.pudD;
    for (let i = 0; i < n; i++) {
      const o = i * 3;
      RD[o + 1] -= dt * 24;
      if (RD[o + 1] < -15) RD[o + 1] += 30;
      HX.rain.add(c.x + RD[o], c.y + RD[o + 1], c.z + RD[o + 2], 0.3, 0.12, 0.035, 1.3, 0.035);
    }
    for (let i = 0; i < HXN.pud; i++) {
      const o = i * 3,
        s = PD[o + 2] * Math.min(1, fw * 1.2);
      HX.pud.add(PD[o], 0.04, PD[o + 1], i, 0, s, 1, s * 0.8);
    }
    for (let i = 0; i < 3; i++) {
      if (R() > fw) continue;
      const o = Math.floor(R() * HXN.pud) * 3;
      emit(
        hxK('water'),
        PD[o] + (R() - 0.5) * PD[o + 2],
        0.1,
        PD[o + 1] + (R() - 0.5) * PD[o + 2],
        (R() - 0.5) * 0.8,
        1.2 + R() * 1.4,
        (R() - 0.5) * 0.8,
        0.35,
        0.07,
        0.03
      );
    }
  }
  HX.rain.end();
  HX.pud.end();
  HXE = null;
  return fw;
}
// le ciel et le voile coloré, d'après le Sanctuaire, les météores et l'orage (après le ciel du jour : cielFrame)
function hxCielFrame(S, dt, meteores, orage, deluge) {
  // teintes du ciel (après skyMix) : bleu-gris sous le Sanctuaire, rougeoyant pendant les Météores, sombre sous le Déchaînement
  HX.mw += ((meteores || S.meteors.length ? 1 : 0) - HX.mw) * Math.min(1, dt * 2);
  HX.sw += (orage - HX.sw) * Math.min(1, dt * 2);
  if (deluge > 0.005) {
    // V5.3 : sous le Sanctuaire d'un autre élément, le ciel prend sa palette
    hxSk(S.floodEc, 'eau');
    HX.cB.setHex(0x56738c);
    HX.cF.setHex(0x6a8399);
    if (HXE) {
      HX.cB.lerp(HX.cT.setHex(K.EL[HXE].dark), 0.6);
      HX.cF.lerp(HX.cT.setHex(K.EL[HXE].main), 0.4);
    }
    HXE = null;
    scene.background.lerp(HX.cB, deluge * 0.5);
    scene.fog.color.lerp(HX.cF, deluge * 0.55);
    hemi.intensity *= 1 - 0.2 * deluge;
    sun.intensity *= 1 - 0.45 * deluge;
  }
  if (HX.mw > 0.005) {
    // V5.3 : sous les Météores d'un autre élément, le ciel prend sa palette
    if (S.meteors.length) HX.mEc = S.meteors[0].ec;
    hxSk(HX.mEc, 'feu');
    HX.cM.setHex(hxC(0xd8794a, 'main'));
    HXE = null;
    scene.background.lerp(HX.cM, HX.mw * 0.25);
    scene.fog.color.lerp(HX.cM, HX.mw * 0.18);
  }
  if (HX.sw > 0.005) {
    scene.background.lerp(HX.cS, HX.sw * 0.3);
    scene.fog.color.lerp(HX.cS, HX.sw * 0.22);
    sun.intensity *= 1 - 0.25 * HX.sw;
  }
  // voile coloré : éclair d'ultime / bond (monte vite, s'efface), sinon léger voile bleu pendant le Sanctuaire
  let voile = 0,
    couleur = HX.vC;
  if (HX.vT < HX.vD) {
    HX.vT += dt;
    const u = Math.min(1, HX.vT / HX.vD);
    voile = HX.vA * (u < 0.12 ? u / 0.12 : (1 - u) / 0.88);
  }
  if (deluge * 0.22 > voile) {
    voile = deluge * 0.22;
    couleur = S.floodEc && K.EL[S.floodEc] ? K.EL[S.floodEc].main : HXC.eau;
  }
  HX.vig.visible = voile > 0.01;
  if (HX.vig.visible) {
    HX.vig.material.opacity = Math.min(1, voile);
    HX.vig.material.color.setHex(couleur);
    const vh = 0.1 * Math.tan((camera.fov * Math.PI) / 360) * 1.05;
    HX.vig.scale.set(vh * camera.aspect, vh, 1);
  }
}
