// ===================== LES TOURELLES : emplacements, pose, visée, tir =====================
// SLOTS : tous les emplacements (toit, balcons, murs d'avenue, couloirs) ; leur numéro (id) est gardé dans la sauvegarde (save.layout),
// donc on n'en change jamais l'ordre : les nouveaux s'ajoutent à la fin. buildTurrets pose S.tur d'après le plan ; turretsStep les fait tirer.
// Fournit aux autres dossiers : SLOTS, slotOn, turOff, buildTurrets, placedCount, turretReach (affichage, interface : marteau, carte).

// ---------------------------------------------------------------- les emplacements (SLOTS)
// un emplacement : id (= sa place dans SLOTS), k : 'toit' / 'balcon' / 'mur' / 'int' (couloir), x, y, z, n : nom affiché ;
// f : façade (balcons) ; lv : niveau (balcons, couloirs) ; r : route (murs d'avenue).
// Numéros : 0-7 toit, 8-15 balcons (2e et 4e), 16-23 murs d'avenue, 24-31 couloirs, 32-39 balcons qui font le tour, 40-55 balcons du 1er et du 3e.
const SLOTS = [];
for (const q of [
  [-10.6, -10.6, 'coin nord-ouest'],
  [10.6, -10.6, 'coin nord-est'],
  [10.6, 10.6, 'coin sud-est'],
  [-10.6, 10.6, 'coin sud-ouest'],
  [0, -10.8, 'bord nord'],
  [10.8, 0, 'bord est'],
  [0, 10.8, 'bord sud'],
  [-10.8, 0, 'bord ouest']
])
  SLOTS.push({ id: SLOTS.length, k: 'toit', x: q[0], y: H, z: q[1], n: 'Toit · ' + q[2] });
// un emplacement de balcon : q = [u le long de la façade, niveau, complément du nom]
const addBalSlot = (f, q) => {
  const p = facePt(f, q[0], BALD - 0.65);
  SLOTS.push({
    id: SLOTS.length,
    k: 'balcon',
    f,
    x: p[0],
    y: LVY(q[1]),
    z: p[1],
    lv: q[1],
    n: 'Balcon ' + FACEN[f] + ' (' + q[1] + 'e étage' + (q[2] || '') + ')'
  });
};
for (let f = 0; f < 4; f++)
  for (const q of [
    [-5.2, 2],
    [5.2, 4]
  ])
    addBalSlot(f, q);
// les deux emplacements de couloir de chaque étage (ajoutés plus bas, numéros 24 à 31)
const INTSL = [
  [-4.3, -4.1, 'nord-ouest'],
  [4.3, 4.6, 'sud-est']
];
for (let r = 0; r < 4; r++)
  for (const s of [-1, 1]) {
    const R = ROADS[r];
    SLOTS.push({
      id: SLOTS.length,
      k: 'mur',
      r,
      x: R.b[0] + R.px * 4.6 * s - R.dx * 0.1,
      y: 0,
      z: R.b[1] + R.pz * 4.6 * s - R.dz * 0.1,
      n: 'Mur ' + R.n.toLowerCase() + (s < 0 ? ' (gauche)' : ' (droite)')
    });
  }
// les couloirs, mode fuite seulement
for (let lv = 1; lv < NLV; lv++)
  for (const q of INTSL)
    SLOTS.push({ id: SLOTS.length, k: 'int', lv, x: q[0], y: LVY(lv), z: q[1], n: 'Couloir ' + lv + 'e étage (' + q[2] + ')' });
// 8 emplacements de plus sur les balcons qui font le tour (numéros à la suite : les anciennes sauvegardes gardent leurs tourelles)
for (let f = 0; f < 4; f++)
  for (const q of [
    [5.2, 2, ', autre côté'],
    [-5.2, 4, ', autre côté']
  ])
    addBalSlot(f, q);
// balcons au 1er et au 3e aussi (numéros 40 à 55)
for (const lv of [1, 3]) for (let f = 0; f < 4; f++) for (const u of [-5.2, 5.2]) addBalSlot(f, [u, lv]);
// l'emplacement s est-il utilisable (arbre P, mode m) ? toit toujours, couloirs en mode fuite, murs avec la case Murs
const slotOn = (P, s, m) => s.k === 'toit' || (s.k === 'int' && m === 'out') || (s.k === 'balcon' && P.bal) || (s.k === 'mur' && P.mur);
// en mode fuite, le jour 1 se joue sans tourelle ; celles du plan reviennent au jour 2
const turOff = S => S.mode === 'out' && S.day === 1 && !S.endless;
// pose S.tur d'après le plan (save.layout : id d'emplacement → type), dans la limite S.P.turrets, en gardant l'état des tourelles inchangées.
// Une tourelle : slot, ty ('mg' / 'la' / 'mo' / 'fl'), x, y, z (bouche), k, f ; cd : recharge ; ti, tg : cible (zombie, et sa génération Z.gen) ;
// re : temps avant de rechoisir la cible ; ont : temps passé sur la cible (laser) ; ry, rp, flash, beams, flame : pour l'affichage.
// V4.6 (à plusieurs, chez l'hôte) : après les siennes, les tourelles de chaque invité (S.mTurInv : [{ id, plan, P }], posé par l'interface
// d'après ce que publie l'invité, regles/multi.js) sur les emplacements encore libres, dans la limite de SES tourelles et des types qu'IL a
// débloqués ; chacune garde les chiffres (PP) et le compte (own) de son propriétaire : turretsStep tire avec ses chiffres et ses tués lui
// reviennent (killZ, S.mCredits). Chez l'invité (S.invite), rien : ses tourelles viennent de l'instantané de l'hôte.
function buildTurrets(S) {
  if (S.invite) return;
  if (turOff(S)) {
    S.tur = [];
    return;
  }
  const layout = S.save.layout || {},
    old = {};
  for (const t of S.tur) old[t.slot] = t;
  S.tur = [];
  const pris = new Set();
  // pose la tourelle de type ty sur l'emplacement s, pour own (undefined : l'hôte, avec S.P) ; garde l'objet s'il est déjà là, au même
  function pose(s, ty, own, PP) {
    const o =
      old[s.id] && old[s.id].ty === ty && old[s.id].own === own
        ? old[s.id]
        : {
            slot: s.id,
            ty,
            cd: S.rnd() * 0.5,
            ti: -1,
            tg: 0,
            ry: Math.atan2(-s.x, -s.z) + Math.PI,
            rp: 0,
            flash: 0,
            beams: [],
            flame: 0,
            ont: 0,
            re: 0
          };
    const y = s.k === 'mur' ? S.P.murH : s.y;
    o.x = s.x;
    o.y = y + (ty === 'mo' ? 0.7 : 1.05);
    o.z = s.z;
    o.k = s.k;
    o.f = s.f;
    if (own === undefined) {
      delete o.own;
      delete o.PP;
    } else {
      o.own = own;
      o.PP = PP;
    }
    pris.add(s.id);
    S.tur.push(o);
  }
  let nPlaced = 0;
  for (const s of SLOTS) {
    const ty = layout[s.id];
    if (!ty || !S.P[ty] || !S.P[ty].on || !slotOn(S.P, s, S.mode) || nPlaced >= S.P.turrets || (s.k === 'int' && ty === 'mo')) continue;
    nPlaced++;
    pose(s, ty);
  }
  if (Array.isArray(S.mTurInv))
    for (const g of S.mTurInv) {
      let n = 0;
      for (const s of SLOTS) {
        const ty = g.plan[s.id];
        if (
          !ty ||
          pris.has(s.id) ||
          !g.P[ty] ||
          !g.P[ty].on ||
          !slotOn(S.P, s, S.mode) ||
          n >= g.P.turrets ||
          (s.k === 'int' && ty === 'mo')
        )
          continue;
        n++;
        pose(s, ty, g.id, g.P);
      }
    }
}
// nombre de tourelles dans le plan (posées ou non)
const placedCount = save => Object.keys(save.layout || {}).length;

// ---------------------------------------------------------------- la visée et le tir
// une tourelle de couloir voit le zombie i s'il est à son étage, ou dans l'escalier qui y monte ou qui en part
function insideSeen(S, t, i) {
  const Z = S.z,
    s = SLOTS[t.slot],
    st = Z.st[i];
  return (st === 3 && Z.lv[i] === s.lv) || (st === 7 && (Z.lv[i] === s.lv || Z.lv[i] === s.lv - 1));
}
// cible d'une tourelle de couloir : parmi les 6 plus proches à portée (la cible actuelle compte 2 m plus près), la première sans mur devant
function turretPickIn(S, t, range) {
  const Z = S.z,
    cand = [];
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (!insideSeen(S, t, i)) continue;
    const dx = Z.x[i] - t.x,
      dy = Z.y[i] + 1 - t.y,
      dz = Z.z[i] - t.z,
      d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < range * range) cand.push([d2 - (t.ti === i && t.tg === Z.gen[i] ? 4 : 0), i]);
  }
  cand.sort((a, b) => a[0] - b[0]);
  for (let q = 0; q < cand.length && q < 6; q++) {
    const i = cand[q][1],
      vx = Z.x[i] - t.x,
      vy = Z.y[i] + 1 - t.y,
      vz = Z.z[i] - t.z,
      l = Math.hypot(vx, vy, vz) || 1;
    if (rayWall(t.x, t.y, t.z, vx / l, vy / l, vz / l, l) >= l - 0.3) return i;
  }
  return -1;
}
// portée d'une tourelle de type ty posée sur l'emplacement s, ramenée au sol (la hauteur ne compte qu'à 12 %) : r et, pour le mortier, rmin ; y = hauteur du cercle à dessiner
function turretReach(S, s, ty) {
  const C = S.P[ty];
  if (!C) return null;
  const inside = s.k === 'int',
    yTur = (s.k === 'mur' ? S.P.murH : s.y) + (ty === 'mo' ? 0.7 : 1.05),
    dy = inside ? 0 : yTur - 1,
    hLoss = inside ? 0 : 0.12 * dy * dy,
    r = Math.sqrt(Math.max(0, C.range * C.range - hLoss)),
    rMin = ty === 'mo' ? Math.sqrt(Math.max(0, C.rmin * C.rmin - hLoss)) : 0;
  return { r, rmin: rMin, y: inside ? s.y + 0.05 : 0.06 };
}
// cible d'une tourelle du dehors (−1 si aucune) : le meilleur score parmi ceux à portée (la hauteur compte à 12 %) qu'elle peut voir.
// Mortier (mode 'mo') : le plus gros paquet (cellCount), au sol, au-delà de la distance minimale. Sinon, mode fuite : ceux qui escaladent
// un mur, puis les plus loin du centre ; « Ils arrivent » : ceux sur le toit, puis ceux qui grimpent (les plus hauts), sur un mur, dans la rue.
// Garder la même cible vaut 40 points.
function turretPick(S, t, range, mode) {
  const Z = S.z,
    s = SLOTS[t.slot];
  if (s.k === 'int') return turretPickIn(S, t, range);
  let best = -1,
    bestScore = -1e9;
  const r2 = range * range,
    faceN = s.k === 'balcon' ? FACES[s.f] : null;
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      st = Z.st[i];
    if (st === 0 || st === 7 || (st === 3 && Z.lv[i] < NLV)) continue;
    const T = ZT[Z.ty[i]],
      dx = Z.x[i] - t.x,
      dy = Z.y[i] + T.sc - t.y,
      dz = Z.z[i] - t.z,
      d2 = dx * dx + dy * dy * 0.12 + dz * dz;
    if (d2 > r2) continue;
    if (faceN && (Z.x[i] - s.x) * faceN[0] + (Z.z[i] - s.z) * faceN[1] < -0.6) continue;
    if (s.k === 'toit' && st === 2 && (Z.x[i] - s.x) * (Z.x[i] - s.x) + (Z.z[i] - s.z) * (Z.z[i] - s.z) < 4 && Z.y[i] < H - 3) continue;
    let score;
    if (mode === 'mo') {
      if (st === 3 || (st === 2 && Z.y[i] > 3.5) || d2 < S.P.mo.rmin * S.P.mo.rmin) continue;
      score = cellCount(S, i) * 10 - Math.sqrt(d2) * 0.15 + (bigZ(Z.ty[i]) ? 15 : 0);
    } else {
      const d = Math.sqrt(d2);
      score =
        S.mode === 'out'
          ? st === 5
            ? 1800 + Z.y[i] * 20 - d
            : 1000 + Math.hypot(Z.x[i], Z.z[i]) * 4 - d * 0.3
          : st === 3
            ? 3000 - d
            : st === 2
              ? 2000 + Z.y[i] * 30 - d
              : st === 5
                ? 1500 + Z.y[i] * 20 - d
                : 1000 - Math.hypot(Z.x[i], Z.z[i]) * 3 - d * 0.3;
    }
    if (t.ti === i && t.tg === Z.gen[i]) score += 40;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
// carré de la distance du point p au segment ab
function segDist2(px, py, pz, ax, ay, az, bx, by, bz) {
  const vx = bx - ax,
    vy = by - ay,
    vz = bz - az,
    wx = px - ax,
    wy = py - ay,
    wz = pz - az,
    l = vx * vx + vy * vy + vz * vz;
  let t = l > 0 ? (wx * vx + wy * vy + wz * vz) / l : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = wx - vx * t,
    dy = wy - vy * t,
    dz = wz - vz * t;
  return dx * dx + dy * dy + dz * dz;
}
// toutes les tourelles, à chaque pas (elles ne tirent que le jour) : rechoisir la cible toutes les 0,2 s (ou si elle est morte),
// la perdre si elle sort de portée ou de vue, puis tirer selon le type : mitrailleuse (balles), laser (rayons qui blessent tout sur leur ligne),
// mortier (un obus, S.shells, explosion dans projStep), lance-flammes (cône, brûlure, napalm au sol)
function turretsStep(S, dt) {
  const Z = S.z,
    P = S.P;
  const fight = S.phase === 'day';
  for (const t of S.tur) {
    t.flash = Math.max(0, t.flash - dt);
    t.cd = Math.max(-0.05, t.cd - dt);
    t.re -= dt;
    // C : les chiffres de ce type de tourelle (S.P.mg, S.P.la…) ; V4.6 : ceux de son propriétaire si c'est la tourelle d'un invité (PP),
    // et ses tués vont à son compte (S.mOwn, lu par killZ)
    const C = (t.PP || P)[t.ty];
    S.mOwn = t.own;
    if (!fight) {
      t.beams.length = 0;
      t.flame = 0;
      continue;
    }
    const valid = t.ti >= 0 && Z.st[t.ti] !== 0 && Z.gen[t.ti] === t.tg;
    if (t.re <= 0 || !valid) {
      t.re = 0.2;
      const i = turretPick(S, t, C.range, t.ty === 'mo' ? 'mo' : '');
      if (i !== t.ti || !valid) {
        t.ont = 0;
      }
      t.ti = i;
      t.tg = i >= 0 ? Z.gen[i] : 0;
    }
    const i = t.ti;
    if (i < 0 || Z.st[i] === 0) {
      t.beams.length = 0;
      t.flame = 0;
      continue;
    }
    const T = ZT[Z.ty[i]],
      ax = Z.x[i] - t.x,
      ay = Z.y[i] + T.sc - t.y,
      az = Z.z[i] - t.z,
      dl = Math.hypot(ax, ay, az);
    // cible perdue : hors de portée, ou (dehors) dans l'immeuble, ou (couloir) plus à son étage
    const inside = t.k === 'int';
    if (
      Math.hypot(ax, ay * (inside ? 1 : 0.35), az) > C.range + 1 ||
      (inside ? !insideSeen(S, t, i) : Z.st[i] === 7 || (Z.st[i] === 3 && Z.lv[i] < NLV))
    ) {
      t.ti = -1;
      continue;
    }
    t.ry = Math.atan2(ax, az);
    t.rp = Math.atan2(ay, Math.hypot(ax, az));
    if (t.ty === 'mg') {
      while (t.cd <= 0) {
        t.cd += 1 / C.rate;
        t.flash = 0.06;
        S.ev.push({ k: 'tracer', x0: t.x, y0: t.y, z0: t.z, x1: Z.x[i], y1: Z.y[i] + T.sc, z1: Z.z[i], ty: 'mg' });
        if (hurtZ(S, i, C.dmg, 't')) break;
      }
    } else if (t.ty === 'la') {
      // le rayon chauffe (Surchauffe) ; le Prisme ajoute des rayons sur d'autres cibles à portée
      t.ont += dt;
      const dmg = C.dps * (1 + C.ramp * Math.min(1, t.ont / 2.5)) * dt;
      t.beams.length = 0;
      const targets = [i];
      if (C.beams > 1) {
        for (let k = 0; k < S.nAct && targets.length < C.beams; k++) {
          const j = S.act[k];
          if (Z.st[j] === 0 || targets.includes(j)) continue;
          const dx = Z.x[j] - t.x,
            dz = Z.z[j] - t.z,
            dy = Z.y[j] - t.y;
          if (dx * dx + dy * dy + dz * dz < C.range * C.range && (j * 7 + targets.length) % 5 === 0) targets.push(j);
        }
      }
      for (const j of targets) {
        const Tj = ZT[Z.ty[j]],
          ex = Z.x[j],
          ey = Z.y[j] + Tj.sc,
          ez = Z.z[j],
          vx = ex - t.x,
          vy = ey - t.y,
          vz = ez - t.z,
          l = Math.hypot(vx, vy, vz) || 1,
          L = t.k === 'int' ? l + 0.4 : Math.min(C.range * 1.6, l + 8),
          bx = t.x + (vx / l) * L,
          by = t.y + (vy / l) * L,
          bz = t.z + (vz / l) * L;
        t.beams.push([bx, by, bz]);
        for (let k = 0; k < S.nAct; k++) {
          const q = S.act[k];
          if (Z.st[q] === 0) continue;
          const Tq = ZT[Z.ty[q]];
          if (segDist2(Z.x[q], Z.y[q] + Tq.sc, Z.z[q], t.x, t.y, t.z, bx, by, bz) < (Tq.r + 0.25) * (Tq.r + 0.25)) hurtZ(S, q, dmg, 't');
        }
      }
    } else if (t.ty === 'mo') {
      if (t.cd <= 0) {
        t.cd = C.reload;
        t.flash = 0.15;
        const lead = Z.st[i] === 1 ? Z.sp[i] * 0.8 : 0,
          yw = Z.yaw[i];
        const x1 = Z.x[i] + Math.sin(yw) * lead,
          z1 = Z.z[i] + Math.cos(yw) * lead,
          flight = 1 + Math.hypot(x1 - t.x, z1 - t.z) / 60;
        S.shells.push({
          x0: t.x,
          y0: t.y + 0.5,
          z0: t.z,
          x1,
          y1: Math.max(0, Z.y[i]),
          z1,
          t: 0,
          T: flight,
          dmg: C.dmg,
          r: C.rad,
          frag: C.frag,
          own: t.own
        });
        S.ev.push({ k: 'mortar', x: t.x, z: t.z });
      }
    } else if (t.ty === 'fl') {
      t.flame = Math.min(1, t.flame + dt * 4);
      if (t.cd > 0) continue;
      t.cd = 0.1;
      const ux = ax / dl,
        uy = ay / dl,
        uz = az / dl,
        R = C.range;
      gridEach(S, t.x, t.z, R + 1, j => {
        if (Z.st[j] === 0) return;
        const Tj = ZT[Z.ty[j]],
          vx = Z.x[j] - t.x,
          vy = Z.y[j] + Tj.sc - t.y,
          vz = Z.z[j] - t.z,
          l = Math.hypot(vx, vy, vz);
        if (l > R + Tj.r || l < 0.01) return;
        if ((vx * ux + vy * uy + vz * uz) / l < 0.86 || (t.k === 'int' && Math.abs(vy) > 1.8)) return;
        Z.burn[j] = Math.max(Z.burn[j], 2.2);
        hurtZ(S, j, C.dps * 0.1, 't');
      });
      if (C.nap && Z.y[i] < 0.5 && S.fires.length < 40 && S.rnd() < 0.25)
        S.fires.push({ x: Z.x[i], z: Z.z[i], r: 1.8 + 0.4 * C.nap, t: 3 + 1.5 * C.nap, dps: C.dps * 0.35 * C.nap, own: t.own });
    }
  }
  S.mOwn = undefined;
}
