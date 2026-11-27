// ===================== LES ZOMBIES DEHORS : apparition, routes, fuite, escalade des façades et des murs =====================
// spawnOne fait apparaître un zombie : « Ils arrivent », au bout d'une route ; « Ils s'échappent », par un rideau de fer du rez-de-chaussée
// ou en sautant d'une fenêtre (une part, à partir du jour 6, envahit les étages : zombies-dedans.js).
// Fuite : outRoute / outWalk les mènent au débouché de leur rue (par un coin de l'immeuble si besoin), au mur d'avenue, puis au bout de la rue (escapeZ).
// Arrivée : aimFacade choisit une façade, puis ils grimpent (Z.st 2) jusqu'au parapet, ou entrent par une fenêtre si le joueur est dans les étages.
// Fournit aux autres dossiers : spawnOne, inPlaza (interface : outils dev, repères).

// ---------------------------------------------------------------- l'apparition
// fait apparaître un zombie (false s'il n'y a plus de place). Ordre des tirages au hasard : route, type, variante, position, tenue…
// (à ne pas changer : l'empreinte le verrait)
function spawnOne(S) {
  const Z = S.z,
    d = S.day,
    i = S.free.pop();
  if (i === undefined) return false;
  // la route, au hasard parmi les ouvertes : les avenues pèsent plus que les ruelles, celle qui s'ouvre aujourd'hui ×1,6
  const open = [];
  let wTotal = 0;
  for (let r = 0; r < ROADS.length; r++)
    if (roadOpen(r, d)) {
      const w = (ROADS[r].w > 8 ? 1 : 0.7) * (ROADS[r].day === d && d > 1 ? 1.6 : 1);
      open.push([r, w]);
      wTotal += w;
    }
  let pick = S.rnd() * wTotal,
    r = open[0][0];
  for (const o of open) {
    pick -= o[1];
    if (pick <= 0) {
      r = o[0];
      break;
    }
  }
  const R = ROADS[r];
  // le type : colosses (dès le jour 3) et coureurs de plus en plus nombreux ; en mode fuite, un rôdeur peut devenir une variante
  const roll = S.rnd(),
    pRun = Math.min(0.32, 0.07 * (d - 1)),
    pBig = d >= 3 ? Math.min(0.09, 0.018 * (d - 2)) : 0;
  let ty = roll < pBig ? 2 : roll < pBig + pRun ? 1 : 0;
  if (S.mode === 'out' && ty === 0 && !turOff(S)) {
    const roll2 = S.rnd(),
      pSprint = d >= 2 ? Math.min(0.08, 0.02 * d) : 0,
      pCasseur = d >= 4 ? Math.min(0.06, 0.012 * (d - 2)) : 0,
      pPorteur = d >= 3 ? Math.min(0.03, 0.008 * (d - 1)) : 0,
      pHurleur = d >= 5 ? Math.min(0.025, 0.006 * (d - 3)) : 0;
    ty =
      roll2 < pSprint
        ? 4
        : roll2 < pSprint + pCasseur
          ? 5
          : roll2 < pSprint + pCasseur + pPorteur
            ? 6
            : roll2 < pSprint + pCasseur + pPorteur + pHurleur
              ? 7
              : 0;
  }
  // outils dev : type imposé (S.devTy), envahisseurs forcés (S.devInv)
  if (S.devTy !== undefined) ty = S.devTy;
  if (ty >= 4 && !(S.seenTy & (1 << ty))) {
    S.seenTy = (S.seenTy || 0) | (1 << ty);
    S.ev.push({ k: 'variant', ty });
  }
  // le moment d'un mastodonte (startDay a fixé S.bossAt)
  if (S.bossAt.length && S.spawned >= S.bossAt[0]) {
    S.bossAt.shift();
    ty = 3;
    S.ev.push({ k: 'boss', r });
  }
  const T = ZT[ty],
    back = S.rnd() * 10,
    off = (S.rnd() * 2 - 1) * (R.w / 2 - 0.6);
  Z.x[i] = R.a[0] - R.dx * back + R.px * off;
  Z.z[i] = R.a[1] - R.dz * back + R.pz * off;
  Z.y[i] = 0;
  Z.off[i] = off;
  Z.road[i] = r;
  Z.wp[i] = 0;
  Z.st[i] = 1;
  Z.ty[i] = ty;
  Z.va[i] = S.rnd() < 0.5 ? 1 : 0;
  Z.inv[i] = 0;
  if (S.mode === 'out') {
    // ils sortent par les rideaux de fer du rez-de-chaussée, ou sautent d'une fenêtre ; la plupart fuient par la rue la plus proche
    const face = Math.floor(S.rnd() * 4),
      fromWin = !S.devInv && S.rnd() < 0.3,
      jumpLv = 1 + Math.floor(S.rnd() * (NLV - 1)),
      u = fromWin
        ? WU[Math.floor(S.rnd() * WU.length)] + (S.rnd() - 0.5) * 0.6
        : SU[Math.floor(S.rnd() * SU.length)] + (S.rnd() - 0.5) * 2.6,
      // devant la façade : sous la fenêtre (au-dessus du 1er, au-delà du garde-corps du balcon), ou devant le rideau
      outPt = facePt(face, u, fromWin ? (jumpLv < BALV[0] ? 0.45 : BALD + 0.35) : 0.5 + S.rnd() * 0.7);
    // 65 % prennent la rue ouverte la plus proche
    if (S.rnd() < 0.65) {
      let bd = 1e9;
      for (const o of open) {
        const b = ROADS[o[0]].b,
          dd = Math.hypot(b[0] - outPt[0], b[1] - outPt[1]);
        if (dd < bd) {
          bd = dd;
          Z.road[i] = o[0];
        }
      }
    }
    const R2 = ROADS[Z.road[i]];
    Z.off[i] = (S.rnd() * 2 - 1) * (R2.w / 2 - 0.6);
    Z.f[i] = face;
    if (fromWin) {
      Z.x[i] = outPt[0];
      Z.z[i] = outPt[1];
      Z.y[i] = LVY(jumpLv) + 0.9;
      outRoute(S, i);
    } else {
      const a = facePt(face, u, -1.2 - S.rnd() * 2);
      Z.x[i] = a[0];
      Z.z[i] = a[1];
      Z.y[i] = 0;
      Z.cx[i] = outPt[0];
      Z.cz[i] = outPt[1];
      Z.wp[i] = 4;
      // à partir du jour 6, une part de ceux du hall envahissent les étages (jamais les mastodontes)
      if (S.devInv || (d >= INV_DAY && ty !== 3 && S.rnd() < invShare(d))) {
        Z.inv[i] = 1;
        Z.st[i] = 3;
        Z.lv[i] = 0;
        Z.u[i] = -1;
      }
    }
  }
  // la vie : ×1,3 par jour (et +15 % par jour après le 5e pour les mastodontes)
  Z.hm[i] = Z.hp[i] = T.hp * hpMul(d) * (ty === 3 ? 1 + 0.15 * (d - 5) : 1) * S.rangK;
  Z.sp[i] = T.sp * (0.85 + S.rnd() * 0.3);
  Z.ph[i] = S.rnd() * 6.28;
  Z.burn[i] = 0;
  Z.psn[i] = 0;
  Z.root[i] = 0;
  Z.slow[i] = 0;
  Z.hst[i] = 0;
  Z.hcd[i] = 2 + S.rnd() * 3;
  Z.dec[i] = 0;
  Z.tr[i] = 0;
  Z.dw[i] = 0.3 + S.rnd() * 1.1;
  Z.gen[i]++;
  if (Z.inv[i]) {
    S.act[S.nAct++] = i;
    S.spawned++;
    S.toSpawn--;
    S.invN = (S.invN || 0) + 1;
    return true;
  }
  Z.yaw[i] = S.mode === 'out' ? Math.atan2(FACES[Z.f[i]][0], FACES[Z.f[i]][1]) : Math.atan2(R.dx, R.dz);
  S.act[S.nAct++] = i;
  S.spawned++;
  S.toSpawn--;
  return true;
}

// ---------------------------------------------------------------- outils communs
// le segment (x0, z0) → (x1, z1) traverse-t-il le carré |x| < h, |z| < h (l'immeuble) ? (découpage de Liang-Barsky)
function segHitsBox(x0, z0, x1, z1, h) {
  let t0 = 0,
    t1 = 1;
  const dx = x1 - x0,
    dz = z1 - z0;
  for (const [p, q] of [
    [-dx, x0 + h],
    [dx, h - x0],
    [-dz, z0 + h],
    [dz, h - z0]
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 < t1;
}
// (x, z) est-il sur la place (en deçà des débouchés des routes) ?
const inPlaza = (x, z) => Math.abs(x) < PLAZA + 0.5 && Math.abs(z) < PLAZA + 0.5;

// ---------------------------------------------------------------- la fuite (mode « Ils s'échappent »)
// Étapes (Z.wp) : 4 sortir du hall (vers cx, cz, devant le rideau) ; 1 aller à un coin de l'immeuble (cx, cz) ; 2 aller au débouché de sa rue ;
// 0 courir jusqu'au bout de la rue, où il s'échappe (escapeZ). Au débouché d'une avenue fermée par un mur, il l'escalade (Z.st 5).
// le chemin jusqu'au débouché de sa rue (par un coin de l'immeuble si la ligne droite le traverse)
function outRoute(S, i) {
  const Z = S.z,
    R = ROADS[Z.road[i]],
    mx = R.b[0] + R.px * Z.off[i] + R.dx * 0.8,
    mz = R.b[1] + R.pz * Z.off[i] + R.dz * 0.8;
  Z.wp[i] = 2;
  // la ligne droite traverse l'immeuble (on passe sous les balcons) : passer par le coin qui fait le chemin le plus court sans traverser l'immeuble
  // (à défaut, le plus proche) ; arrivé au coin, on recommence
  if (segHitsBox(Z.x[i], Z.z[i], mx, mz, B + 0.3)) {
    let bestLen = 1e9,
      bx = 0,
      bz = 0,
      nearLen = 1e9;
    const c = B + BALD + 0.8;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const x = sx * c,
          z = sz * c,
          d0 = Math.hypot(x - Z.x[i], z - Z.z[i]);
        if (d0 < 1) continue;
        const d = d0 + Math.hypot(mx - x, mz - z);
        if (d0 < nearLen && bestLen === 1e9) {
          nearLen = d0;
          bx = x;
          bz = z;
        }
        if (segHitsBox(Z.x[i], Z.z[i], x, z, B + 0.3)) continue;
        if (d < bestLen) {
          bestLen = d;
          bx = x;
          bz = z;
        }
      }
    Z.cx[i] = bx;
    Z.cz[i] = bz;
    Z.wp[i] = 1;
  }
}
// un fuyard arrive au bout de sa rue : il s'échappe, la ville en souffre (ESC)
function escapeZ(S, i) {
  const Z = S.z,
    ty = Z.ty[i];
  S.escaped++;
  S.dayEsc++;
  // V4.3 : la rue du dernier fuyard (l'instantané du multi la donne aux invités, pour leur message)
  S.escR = Z.road[i];
  S.left--;
  S.ev.push({ k: 'escape', r: Z.road[i], ty });
  Z.st[i] = 0;
  Z.hp[i] = 0;
  hurtCity(S, ESC[ty] * (S.day > 10 ? 1 + 0.1 * (S.day - 10) : 1));
}
// un pas dehors en mode fuite (Z.st 1) : vers le leurre s'il en entend un (pas à travers un mur d'avenue), sinon l'étape suivante (Z.wp) ;
// les sauteurs des fenêtres tombent (9 m/s) en restant au-delà des balcons
function outWalk(S, i, dt, pace) {
  const Z = S.z,
    R = ROADS[Z.road[i]],
    dec = S.decoy,
    wallOn = S.P.mur;
  let tx, tz;
  if (Z.y[i] > 0) Z.y[i] = Math.max(0, Z.y[i] - 9 * dt);
  if (
    dec &&
    (Z.dec[i] ||
      (Math.abs(Z.x[i] - dec.x) < dec.R &&
        Math.abs(Z.z[i] - dec.z) < dec.R &&
        (!wallOn || !R.wall || inPlaza(Z.x[i], Z.z[i]) === inPlaza(dec.x, dec.z))))
  ) {
    if (!Z.dec[i]) {
      Z.dec[i] = 1;
      Z.cx[i] = (S.rnd() - 0.5) * 3;
      Z.cz[i] = (S.rnd() - 0.5) * 3;
    }
    tx = dec.x + Z.cx[i];
    tz = dec.z + Z.cz[i];
  } else {
    if (Z.dec[i]) {
      Z.dec[i] = 0;
      if (inPlaza(Z.x[i], Z.z[i])) outRoute(S, i);
      else Z.wp[i] = 0;
    }
    if (Z.wp[i] === 1 || Z.wp[i] === 4) {
      tx = Z.cx[i];
      tz = Z.cz[i];
    } else if (Z.wp[i] === 2) {
      tx = R.b[0] + R.px * Z.off[i] + R.dx * 0.8;
      tz = R.b[1] + R.pz * Z.off[i] + R.dz * 0.8;
    } else {
      tx = R.a[0] + R.px * Z.off[i] - R.dx * 14;
      tz = R.a[1] + R.pz * Z.off[i] - R.dz * 14;
    }
  }
  const dx = tx - Z.x[i],
    dz = tz - Z.z[i],
    dl = Math.hypot(dx, dz),
    sp = Z.sp[i] * pace * dt;
  if (dl > 0.05) {
    Z.yaw[i] = Math.atan2(dx, dz);
    const m = Math.min(dl, sp);
    Z.x[i] += (dx / dl) * m;
    Z.z[i] += (dz / dl) * m;
  }
  // V3.9 : en l'air (sauteur des fenêtres), on ne repasse pas au-dessus des balcons : les sprinteurs, très rapides, y arrivaient avant de toucher le sol
  if (Z.y[i] > 0.05) {
    const ax = Math.abs(Z.x[i]),
      az = Math.abs(Z.z[i]),
      balEdge = B + BALD + 0.25;
    if (Math.max(ax, az) < balEdge) {
      if (ax >= az) Z.x[i] = Math.sign(Z.x[i]) * balEdge;
      else Z.z[i] = Math.sign(Z.z[i]) * balEdge;
    }
  }
  if (dl < 0.45 && !Z.dec[i]) {
    if (Z.wp[i] === 4 || Z.wp[i] === 1) outRoute(S, i);
    else if (Z.wp[i] === 2) {
      if (R.wall && wallOn) {
        Z.st[i] = 5;
        Z.y[i] = 0;
        Z.x[i] = R.b[0] + R.px * Z.off[i] + R.dx * 0.7;
        Z.z[i] = R.b[1] + R.pz * Z.off[i] + R.dz * 0.7;
        Z.yaw[i] = Math.atan2(-R.dx, -R.dz);
      } else Z.wp[i] = 0;
    } else escapeZ(S, i);
  }
}

// ---------------------------------------------------------------- l'arrivée (« Ils arrivent ») : la place, puis les façades
// Étapes (Z.wp) : 0 aller au débouché de sa route ; 3 choisir une façade ; 1 passer d'abord par un coin de l'immeuble (cx, cz) ;
// 2 aller au pied de la façade (tx, tz), puis grimper (Z.st 2). Au débouché d'une avenue fermée par un mur, il l'escalade (Z.st 5).
// un pas dehors (Z.st 1) : vers le leurre s'il en entend un, sinon l'étape suivante
function inWalk(S, i, dt, pace) {
  const Z = S.z,
    dec = S.decoy,
    wallOn = S.P.mur;
  let tx, tz;
  const R = ROADS[Z.road[i]];
  if (Z.y[i] > 0) Z.y[i] = Math.max(0, Z.y[i] - 9 * dt);
  if (
    dec &&
    (Z.dec[i] ||
      (Math.abs(Z.x[i] - dec.x) < dec.R &&
        Math.abs(Z.z[i] - dec.z) < dec.R &&
        (!wallOn || !R.wall || inPlaza(Z.x[i], Z.z[i]) === inPlaza(dec.x, dec.z))))
  ) {
    if (!Z.dec[i]) {
      Z.dec[i] = 1;
      Z.cx[i] = (S.rnd() - 0.5) * 3;
      Z.cz[i] = (S.rnd() - 0.5) * 3;
    }
    tx = dec.x + Z.cx[i];
    tz = dec.z + Z.cz[i];
  } else {
    if (Z.dec[i]) {
      Z.dec[i] = 0;
      if (inPlaza(Z.x[i], Z.z[i]) && Z.wp[i] === 0) Z.wp[i] = 3;
      if (Z.wp[i] > 0) aimFacade(S, i, nearFaces(Z.x[i], Z.z[i]));
    }
    if (Z.wp[i] === 0) {
      tx = R.b[0] + R.px * Z.off[i];
      tz = R.b[1] + R.pz * Z.off[i];
    } else if (Z.wp[i] === 3) {
      aimFacade(S, i, R.faces.length ? R.faces : nearFaces(Z.x[i], Z.z[i]));
      tx = Z.tx[i];
      tz = Z.tz[i];
    } else if (Z.wp[i] === 1) {
      tx = Z.cx[i];
      tz = Z.cz[i];
    } else {
      tx = Z.tx[i];
      tz = Z.tz[i];
    }
  }
  const dx = tx - Z.x[i],
    dz = tz - Z.z[i],
    dl = Math.hypot(dx, dz),
    sp = Z.sp[i] * pace * dt;
  if (dl > 0.05) {
    Z.yaw[i] = Math.atan2(dx, dz);
    const m = Math.min(dl, sp);
    Z.x[i] += (dx / dl) * m;
    Z.z[i] += (dz / dl) * m;
  }
  if (dl < 0.45 && !Z.dec[i]) {
    if (Z.wp[i] === 0) {
      if (R.wall && wallOn) {
        Z.st[i] = 5;
        Z.y[i] = 0;
        Z.x[i] = R.b[0] + R.px * Z.off[i] - R.dx * 0.7;
        Z.z[i] = R.b[1] + R.pz * Z.off[i] - R.dz * 0.7;
        Z.yaw[i] = Math.atan2(R.dx, R.dz);
      } else {
        Z.wp[i] = 3;
      }
    } else if (Z.wp[i] === 1) Z.wp[i] = 2;
    else if (Z.wp[i] === 2) {
      Z.st[i] = 2;
      Z.y[i] = 0;
      const n = FACES[Z.f[i]];
      Z.yaw[i] = Math.atan2(-n[0], -n[1]);
    }
  }
}
// vise une façade depuis là où l'on est : d'abord un coin de l'immeuble si la ligne droite traverse le bâtiment
function aimFacade(S, i, faces) {
  const Z = S.z,
    f = faces[Math.floor(S.rnd() * faces.length) % faces.length];
  let u;
  const n = FACES[f];
  const along = -n[1] * Z.x[i] + n[0] * Z.z[i];
  u = clamp(along * 0.5 + (S.rnd() * 2 - 1) * 5.5, -B + 0.5, B - 0.5);
  const p = facePt(f, u, 0.15),
    p2 = facePt(f, u, 0.7);
  Z.f[i] = f;
  Z.u[i] = u;
  Z.tx[i] = p[0];
  Z.tz[i] = p[1];
  if (segHitsBox(Z.x[i], Z.z[i], p2[0], p2[1], B + 0.3)) {
    const sx = n[0] !== 0 ? Math.sign(n[0]) : Math.sign(Z.x[i]) || 1,
      sz = n[1] !== 0 ? Math.sign(n[1]) : Math.sign(Z.z[i]) || 1;
    Z.cx[i] = sx * (B + BALD + 0.8);
    Z.cz[i] = sz * (B + BALD + 0.8);
    Z.wp[i] = 1;
  } else Z.wp[i] = 2;
}
// les façades devant lesquelles on se trouve (à moins d'1 m en deçà de leur plan, ou au-delà) ; à défaut, celle qui est le plus en face
function nearFaces(x, z) {
  const out = [];
  for (let f = 0; f < 4; f++) {
    const n = FACES[f];
    if (n[0] * x + n[1] * z > B - 1) out.push(f);
  }
  if (!out.length) {
    let b = 0,
      bv = -1e9;
    for (let f = 0; f < 4; f++) {
      const v = FACES[f][0] * x + FACES[f][1] * z;
      if (v > bv) {
        bv = v;
        b = f;
      }
    }
    out.push(b);
  }
  return out;
}
// « Ils arrivent » : un zombie qui grimpe une façade (Z.st 2), plus vite quand ils s'entassent (S.faceBin) ; les barbelés du haut blessent.
// Si le joueur est descendu dans les étages, il glisse vers la fenêtre la plus proche, à son étage, et entre (Z.st 3) ;
// sur le balcon du joueur, il l'enjambe ; sinon il passe le parapet et arrive sur le toit.
function facadeStep(S, i, dt, pace) {
  const Z = S.z,
    p = S.p,
    P = S.P,
    T = ZT[Z.ty[i]],
    faceBin = S.faceBin;
  const bin = Z.f[i] * NFB + clamp(Math.floor((Z.u[i] + B) / 1.5), 0, NFB - 1),
    pile = Math.min(1.6, faceBin[bin] * 0.07);
  if (P.barb && Z.y[i] > H - 2.6) {
    pace *= 0.5;
    if (hurtZ(S, i, P.barb * hpMul(S.day) * dt * 0.35, 't')) return;
  }
  Z.y[i] += T.cl * CLK * (1 + pile) * pace * dt;
  // le joueur est dans les étages : la fenêtre visée est à son étage (au moins le 1er)
  if (S.plv < NLV || Z.inv[i]) {
    const winLv = S.plv < NLV ? Math.max(1, S.plv) : Z.inv[i],
      winY = LVY(winLv) + 0.9;
    // le joueur est sur le balcon de cette façade, à moins de 2,6 m le long : il l'enjambe
    if (
      S.plv < NLV &&
      S.pbal === Z.f[i] &&
      Z.y[i] >= LVY(S.plv) - 0.4 &&
      Math.abs(-FACES[Z.f[i]][1] * p.x + FACES[Z.f[i]][0] * p.z - Z.u[i]) < 2.6
    ) {
      Z.st[i] = 3;
      Z.lv[i] = S.plv;
      const r = facePt(Z.f[i], Z.u[i], 0.9);
      Z.x[i] = r[0];
      Z.z[i] = r[1];
      Z.y[i] = LVY(S.plv);
      return;
    }
    // à hauteur de la fenêtre : il glisse vers la plus proche (0,9 m/s de côté) et entre (événement win)
    if (Z.y[i] < winY + 0.3) {
      let winU = 0,
        bd = 1e9;
      for (const u of WU) {
        const d = Math.abs(u - Z.u[i]);
        if (d < bd) {
          bd = d;
          winU = u;
        }
      }
      const toWin = winU - Z.u[i];
      Z.u[i] += Math.sign(toWin) * Math.min(Math.abs(toWin), 0.9 * dt);
      if (Z.y[i] >= winY - 0.2 && Math.abs(toWin) < 0.35) {
        Z.st[i] = 3;
        Z.lv[i] = winLv;
        const r = facePt(Z.f[i], winU, -1);
        Z.x[i] = r[0];
        Z.z[i] = r[1];
        Z.y[i] = LVY(winLv);
        S.ev.push({ k: 'win', x: r[0], y: LVY(winLv) + 1, z: r[1], lv: winLv, inv: S.plv >= NLV });
        return;
      }
    }
  }
  // collé à la façade, de plus en plus près en montant ; au-dessus du parapet, il passe sur le toit (événement over)
  const q = facePt(Z.f[i], Z.u[i], Z.dw[i] * Math.max(0.25, 1 - Z.y[i] / (H * 1.3)));
  Z.x[i] = q[0];
  Z.z[i] = q[1];
  if (Z.y[i] >= H + PAR - 0.25) {
    Z.st[i] = 3;
    Z.lv[i] = NLV;
    const r = facePt(Z.f[i], Z.u[i], -0.9);
    Z.x[i] = r[0];
    Z.z[i] = r[1];
    Z.y[i] = H;
    S.ev.push({ k: 'over', x: r[0], z: r[1] });
  }
}

// ---------------------------------------------------------------- les murs d'avenue (les deux modes)
// un zombie qui escalade le mur d'une avenue (Z.st 5) : plus vite quand ils s'entassent ; les barbelés du haut blessent et ralentissent ;
// en haut, il redescend de l'autre côté (vers la ville en mode fuite, vers l'immeuble sinon)
function wallClimbStep(S, i, dt, pace) {
  const Z = S.z,
    P = S.P,
    T = ZT[Z.ty[i]],
    wallBin = S.wallBin,
    wallH = P.murH;
  const R = ROADS[Z.road[i]],
    pile = Math.min(1.6, wallBin[Z.road[i] * 10 + clamp(Math.floor((Z.off[i] + WALLHALF) / 1.5), 0, 9)] * 0.07);
  if (P.barb && Z.y[i] > wallH - 1.2) {
    pace *= 0.5;
    if (hurtZ(S, i, P.barb * hpMul(S.day) * dt * 0.35, 't')) return;
  }
  Z.y[i] += T.cl * (1 + pile) * pace * dt;
  if (Z.y[i] >= wallH) {
    Z.st[i] = 1;
    Z.y[i] = wallH;
    if (S.mode === 'out') {
      Z.x[i] -= R.dx * 1.7;
      Z.z[i] -= R.dz * 1.7;
      Z.wp[i] = 0;
    } else {
      Z.x[i] += R.dx * 1.7;
      Z.z[i] += R.dz * 1.7;
      Z.wp[i] = 3;
    }
  }
}
