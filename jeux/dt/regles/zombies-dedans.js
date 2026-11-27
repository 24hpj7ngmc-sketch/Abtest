// ===================== LES ZOMBIES DANS L'IMMEUBLE : chasse, invasion des étages, escalier, portes et planches =====================
// insideStep : un zombie à un niveau (Z.st 3) va vers le joueur (champ S.pf), ou vers l'escalier s'il est à un autre niveau (FUP / FDOWN),
// et le mord à portée (zBite). invadeStep : un envahisseur (mode fuite) monte d'étage en étage et se poste dans les pièces.
// stairStep : un zombie dans l'escalier (Z.st 7) suit le chemin STAIRS. Portes : les planches les arrêtent, ils les arrachent (tearDoor).
// Fournit aux autres dossiers : doorPick, plankStep (interface : le marteau sur une porte).

// ---------------------------------------------------------------- la marche dans l'immeuble
// suivre un champ de marche : la case voisine (parmi les 8) où le champ F est le plus bas, s'il l'est plus que sur la case c ; −1 sinon
function fieldNext(F, c) {
  let best = -1,
    bd = c >= 0 ? F[c] : 1e9;
  if (c >= 0) {
    const ci = c % NC,
      cj = (c - ci) / NC;
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        const ii = ci + a,
          jj = cj + b;
        if (ii < 0 || jj < 0 || ii >= NC || jj >= NC) continue;
        const n = jj * NC + ii;
        if (F[n] < bd) {
          bd = F[n];
          best = n;
        }
      }
  }
  return best;
}
// le zombie i mord le joueur s'il est assez près, à peu près à sa hauteur (en mode fuite, pas à travers un mur ni par-dessus un bas de cloison)
function zBite(S, i, dt) {
  const Z = S.z,
    p = S.p,
    T = ZT[Z.ty[i]],
    dy = p.y - Z.y[i];
  const dist = Math.hypot(p.x - Z.x[i], p.z - Z.z[i]);
  if (
    Math.abs(dy) < 1.3 &&
    dist < 1.25 * Math.max(1, T.sc * 0.8) &&
    (S.mode !== 'out' ||
      dist < 0.05 ||
      rayWall(Z.x[i], Z.y[i] + 0.85, Z.z[i], (p.x - Z.x[i]) / dist, 0, (p.z - Z.z[i]) / dist, dist) >= dist - 0.05)
  ) {
    hurtP(S, T.dps * dt * (S.day > 10 ? 1 + 0.1 * (S.day - 10) : 1));
  }
}
// un envahisseur (mode fuite, Z.inv = étage visé) qui n'est pas à l'étage du joueur : il monte par l'escalier jusqu'à son étage, puis va
// se poster au milieu d'une pièce tirée au hasard (Z.road) pendant 9 à 18 s (Z.u), puis vise l'étage du dessus (sans dépasser invCap)
function invadeStep(S, i, dt, pace) {
  const Z = S.z,
    T = ZT[Z.ty[i]],
    lv = Z.lv[i],
    c = cellI(Z.x[i], Z.z[i]);
  let field, tx, tz;
  Z.tr[i] = 0;
  // pas encore à son étage : vers l'escalier qui monte (devant, il arrache les planches de la porte, puis y entre)
  if (lv < Z.inv[i] || lv === 0) {
    field = FUP[lv];
    if (c >= 0 && field[c] < 1.6) {
      const door = STDOOR[lv].up;
      if (door && door.planks > 0) {
        tearDoor(S, i, door, dt);
        Z.y[i] = LVY(lv);
        return;
      }
      Z.st[i] = 7;
      Z.lv[i] = lv;
      Z.f[i] = 0;
      Z.u[i] = 0;
      return;
    }
  } else {
    if (Z.u[i] < 0) {
      const rooms = ROOMS.filter(r => r.lv === lv),
        r = rooms[Math.floor(S.rnd() * rooms.length)];
      Z.road[i] = ROOMS.indexOf(r);
      Z.u[i] = 9 + S.rnd() * 9;
    }
    field = ROOMS[Z.road[i]].F;
    Z.u[i] -= dt;
    if (Z.u[i] <= 0) {
      if (Z.inv[i] < invCap(S.day)) Z.inv[i]++;
      else Z.u[i] = -1;
    }
  }
  const best = fieldNext(field, c);
  if (best >= 0) {
    tx = cellX(best);
    tz = cellZ(best);
  } else if (c >= 0 && field[c] < 1e9) {
    // au fond du champ (au milieu de sa pièce) : il y reste posté
    return;
  } else {
    const n = nearWalk(lv, Z.x[i], Z.z[i]);
    tx = n >= 0 ? cellX(n) : 0;
    tz = n >= 0 ? cellZ(n) : 0;
  }
  if (doorGate(S, i, lv, tx, tz, dt)) return;
  const dx = tx - Z.x[i],
    dz = tz - Z.z[i],
    dl = Math.hypot(dx, dz);
  if (dl > 0.05) {
    Z.yaw[i] = Math.atan2(dx, dz);
    const m = Math.min(dl, T.sp * 1.1 * pace * dt);
    Z.x[i] += (dx / dl) * m;
    Z.z[i] += (dz / dl) * m;
  }
  Z.y[i] = LVY(lv);
}
// un zombie à un niveau de l'immeuble (Z.st 3, toit compris). Envahisseur loin du joueur : invadeStep. Sinon, il chasse le joueur :
// tout droit s'il est à moins de 3 m (en mode fuite, seulement si le chemin est court : S.pf < 8, pour ne pas traverser les cloisons),
// sinon par le champ S.pf à son niveau, ou par l'escalier (FUP / FDOWN) vers le niveau du joueur (ou vers la volée où il se trouve).
// Les portes barricadées l'arrêtent (doorGate) ; il mord à portée (zBite).
function insideStep(S, i, dt, pace) {
  const Z = S.z,
    T = ZT[Z.ty[i]],
    lv = Z.lv[i];
  // V4.4 (multi, chez l'hôte) : la cible peut être un invité (mCible, regles/multi.js) : sa place, son niveau, sa volée, son champ
  let p = S.p,
    playerLv = S.plv,
    pst = S.pst,
    pf = S.pf;
  if (S.mCibles && S.mCibles.length) {
    const c = mCible(S, i);
    if (c) {
      p = c;
      playerLv = c.lv;
      pst = c.pst;
      pf = c.pf;
    }
  }
  let tx, tz;
  Z.tr[i] = 0;
  // un envahisseur arrivé sur le toit devient un chasseur
  if (Z.inv[i] && lv === NLV && playerLv < NLV) Z.inv[i] = 0;
  if (Z.inv[i] && lv !== playerLv && lv < NLV) {
    invadeStep(S, i, dt, pace);
    return;
  }
  const toPx = p.x - Z.x[i],
    toPz = p.z - Z.z[i];
  const cell0 = S.mode === 'out' ? cellI(Z.x[i], Z.z[i]) : -1;
  if (
    lv === playerLv &&
    Math.abs(p.y - Z.y[i]) < 1.6 &&
    toPx * toPx + toPz * toPz < 9 &&
    (S.mode !== 'out' || (pst < 0 && cell0 >= 0 && pf[cell0] < 8))
  ) {
    tx = p.x;
    tz = p.z;
  } else {
    const up = pst >= 0 ? lv <= pst : lv < playerLv,
      down = pst >= 0 ? lv > pst : lv > playerLv,
      field = up ? FUP[lv] : down ? FDOWN[lv] : pf;
    const c = cellI(Z.x[i], Z.z[i]);
    if (!field) {
      tx = p.x;
      tz = p.z;
    } else if ((up || down) && c >= 0 && field[c] < 1.6) {
      // devant l'escalier : arracher les planches de la porte, puis entrer dans la volée (Z.st 7 ; Z.f : 0 monte, 1 descend)
      const door = up ? STDOOR[lv].up : lv < NLV ? STDOOR[lv].arr : null;
      if (door && door.planks > 0) {
        tearDoor(S, i, door, dt);
        Z.y[i] = LVY(lv);
        zBite(S, i, dt);
        return;
      }
      if (up) {
        Z.st[i] = 7;
        Z.lv[i] = lv;
        Z.f[i] = 0;
        Z.u[i] = 0;
      } else {
        Z.st[i] = 7;
        Z.lv[i] = lv - 1;
        Z.f[i] = 1;
        Z.u[i] = STAIRS[lv - 1].tot;
      }
      return;
    } else {
      const best = fieldNext(field, c);
      if (best >= 0) {
        tx = cellX(best);
        tz = cellZ(best);
      } else if (c >= 0 && field[c] < 1e9) {
        tx = p.x;
        tz = p.z;
      } else {
        const n = nearWalk(lv, Z.x[i], Z.z[i]);
        tx = n >= 0 ? cellX(n) : 0;
        tz = n >= 0 ? cellZ(n) : 0;
      }
    }
  }
  if (doorGate(S, i, lv, tx, tz, dt)) {
    zBite(S, i, dt);
    return;
  }
  const dx = tx - Z.x[i],
    dz = tz - Z.z[i],
    dl = Math.hypot(dx, dz);
  if (dl > 0.05) {
    Z.yaw[i] = Math.atan2(dx, dz);
    // il s'arrête à 0,7 m du joueur
    const m = Math.min(Math.max(0, dl - (tx === p.x ? 0.7 : 0)), T.rs * pace * dt);
    Z.x[i] += (dx / dl) * m;
    Z.z[i] += (dz / dl) * m;
  }
  Z.y[i] = LVY(lv);
  zBite(S, i, dt);
}
// un zombie dans l'escalier (Z.st 7) : il suit la volée k = Z.lv (Z.u : distance le long du chemin STAIRS[k]) aux 3/4 de sa vitesse ;
// si le joueur est sur cette volée, il va vers lui (et s'arrête à 0,6 m) ; une porte barricadée au bout l'arrête ; arrivé, il repasse en Z.st 3
function stairStep(S, i, dt, pace) {
  const Z = S.z,
    T = ZT[Z.ty[i]],
    k = Z.lv[i],
    St = STAIRS[k];
  let dir = Z.f[i] ? -1 : 1;
  Z.tr[i] = 0;
  // V4.4 : un invité sur cette volée compte aussi (l'hôte d'abord)
  let pss = S.pst === k ? S.pss : null;
  if (pss === null && S.mCibles) for (const c of S.mCibles) if (c.pst === k) pss = c.pss;
  if (pss !== null) {
    const gap = pss - Z.u[i];
    dir = gap > 0 ? 1 : -1;
    if (Math.abs(gap) > 0.6) Z.u[i] += dir * Math.min(Math.abs(gap) - 0.6, T.rs * 0.75 * pace * dt);
  } else Z.u[i] += dir * T.rs * 0.75 * pace * dt;
  const pos = stairPos(k, Z.u[i]),
    ahead = stairPos(k, Z.u[i] + dir * 0.3);
  Z.x[i] = pos[0];
  Z.y[i] = pos[1];
  Z.z[i] = pos[2];
  if (ahead[0] !== pos[0] || ahead[2] !== pos[2]) Z.yaw[i] = Math.atan2(ahead[0] - pos[0], ahead[2] - pos[2]);
  const door =
    dir > 0 && Z.u[i] >= St.tot - 0.25 ? (k + 1 < NLV ? STDOOR[k + 1].arr : null) : dir < 0 && Z.u[i] <= 0.25 ? STDOOR[k].up : null;
  if (door && door.planks > 0) {
    Z.u[i] = dir > 0 ? St.tot - 0.25 : 0.25;
    const stop = stairPos(k, Z.u[i]);
    Z.x[i] = stop[0];
    Z.y[i] = stop[1];
    Z.z[i] = stop[2];
    tearDoor(S, i, door, dt);
    zBite(S, i, dt);
    return;
  }
  if (dir > 0 && Z.u[i] >= St.tot) {
    Z.st[i] = 3;
    Z.lv[i] = k + 1;
    Z.y[i] = LVY(k + 1);
    const e = k + 1 === NLV ? HUTIN : SB;
    Z.x[i] = e[0];
    Z.z[i] = e[1];
    Z.u[i] = -1;
    if (Z.inv[i] && k + 1 < NLV) S.ev.push({ k: 'inv', lv: k + 1 });
  } else if (dir < 0 && Z.u[i] <= 0) {
    Z.st[i] = 3;
    Z.lv[i] = k;
    Z.y[i] = LVY(k);
    Z.x[i] = SA[0];
    Z.z[i] = SA[1];
    Z.u[i] = -1;
  }
  zBite(S, i, dt);
}
// ---------------------------------------------------------------- les portes et les planches (mode « Ils s'échappent »)
// la porte que le joueur regarde (marteau en main, à 2,6 m au plus, à son niveau, sans mur devant), ou −1
function doorPick(S) {
  if (S.mode !== 'out') return -1;
  const p = S.p,
    d = viewDir(p),
    e = eyeP(p);
  let best = -1,
    bestCos = 0.8;
  for (const door of DOORS) {
    if (door.lv !== S.plv) continue;
    const cy = door.y + 1.1,
      vx = door.cx - e[0],
      vy = cy - e[1],
      vz = door.cz - e[2],
      l = Math.hypot(vx, vy, vz);
    if (l > 2.6 || l < 0.2) continue;
    const c = (vx * d[0] + vy * d[1] + vz * d[2]) / l;
    if (c <= bestCos) continue;
    if (rayWall(e[0], e[1], e[2], vx / l, vy / l, vz / l, l) < l - 0.35) continue;
    bestCos = c;
    best = door.id;
  }
  return best;
}
// planches : bouton d'action maintenu sur la porte id → une planche toutes les 0,5 s ; replanter une planche arrachée rapporte
// (5 au plus par porte et par jour : D.pd)
function plankStep(S, dt, id) {
  if (id < 0 || S.mode !== 'out') {
    S.plankT = 0;
    return false;
  }
  const door = DOORS[id];
  if (door.planks >= PLANKS_MAX) {
    S.plankT = 0;
    return false;
  }
  S.plankT += dt;
  if (S.plankT < 0.5) return false;
  S.plankT = 0;
  // V4.3 : chez un invité du multi, les planches sont celles de l'hôte (multi.js : action 'k')
  if (S.invite) return plancheInvite(S, id);
  setPlanks(door, door.planks + 1);
  S.plankVer++;
  let pay = 0;
  if (door.torn > 0 && (door.pd || 0) < PLANKS_MAX) {
    door.torn--;
    door.pd = (door.pd || 0) + 1;
    pay = Math.max(1, Math.round(S.P.cash));
    S.save.cash = (S.save.cash || 0) + pay;
    S.runCash += pay;
  }
  S.ev.push({ k: 'plank', door: id, n: door.planks, x: door.cx, y: door.y + 1.1, z: door.cz, pay });
  return true;
}
// les zombies arrachent les planches : 1,6 s par planche pour un rôdeur, deux fois plus vite pour les gros, quatre pour le casseur ;
// deux à la fois au plus par porte (D.tt : avancement, D.tn : arracheurs de ce pas)
function tearDoor(S, i, door, dt) {
  const Z = S.z,
    T = ZT[Z.ty[i]];
  Z.yaw[i] = Math.atan2(door.cx - Z.x[i], door.cz - Z.z[i]);
  if (door.tAt !== S.t) {
    door.tAt = S.t;
    door.tn = 0;
  }
  if (++door.tn <= 2) door.tt = (door.tt || 0) + dt * (Z.ty[i] === 5 ? 4 : T.sc > 1.2 ? 2 : 1);
  Z.tr[i] = (door.tt || 0) + 0.01;
  if (door.tt >= 1.6) {
    door.tt = 0;
    setPlanks(door, door.planks - 1);
    door.torn++;
    S.plankVer++;
    S.ev.push({ k: 'tear', door: door.id, n: door.planks, x: door.cx, y: door.y + 1.1, z: door.cz });
  }
}
// le pas qu'il va faire (vers tx, tz) passe-t-il une porte barricadée ? alors il arrache au lieu d'avancer (renvoie true)
function doorGate(S, i, lv, tx, tz, dt) {
  const Z = S.z,
    dx = tx - Z.x[i],
    dz = tz - Z.z[i],
    dl = Math.hypot(dx, dz);
  if (dl < 0.01) return false;
  const stepLen = Math.min(dl, 0.45);
  const nx = Z.x[i] + (dx / dl) * stepLen,
    nz = Z.z[i] + (dz / dl) * stepLen,
    c0 = cellI(Z.x[i], Z.z[i]),
    c1 = cellI(nx, nz);
  if (c1 < 0) return false;
  const id = DCELL[lv][c1] || (c0 >= 0 ? DCELL[lv][c0] : 0);
  if (!id) return false;
  const door = DOORS[id - 1];
  if (door.planks <= 0) return false;
  // déjà dans l'embrasure : bloqué seulement s'il franchit le plan des planches
  if (c0 >= 0 && DCELL[lv][c0] === id) {
    const side0 = door.ax === 'x' ? Z.z[i] - door.cz : Z.x[i] - door.cx,
      side1 = door.ax === 'x' ? nz - door.cz : nx - door.cx;
    if (side0 * side1 > 0) return false;
  }
  tearDoor(S, i, door, dt);
  Z.y[i] = LVY(lv);
  return true;
}
