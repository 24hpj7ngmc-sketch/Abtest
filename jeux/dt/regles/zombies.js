// ===================== LES ZOMBIES : le pas de chacun, les effets, les cadavres =====================
// zombiesStep : pour chaque zombie actif, les effets (brûlure, poison, entrave, ralenti, hâte), les cris du hurleur et les coups du casseur,
// puis le pas selon son état Z.st (dehors : zombies-dehors.js ; dans l'immeuble et l'escalier : zombies-dedans.js), et les feux de napalm.
// compact range S.act après les morts ; corpsesStep fait tomber les cadavres.
// Rien n'est utilisé hors des règles.

// ---------------------------------------------------------------- le pas des zombies
// pace : l'allure du zombie pendant ce pas (×0,55 s'il est ralenti, ×1,5 s'il est pressé par un hurleur), passée à chaque pas d'état
function zombiesStep(S, dt) {
  const Z = S.z,
    P = S.P,
    faceBin = S.faceBin,
    wallBin = S.wallBin;
  // combien grimpent par tranche de 1,5 m de chaque façade et de chaque mur d'avenue : plus ils s'entassent, plus ils montent vite
  faceBin.fill(0);
  wallBin.fill(0);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] === 2) faceBin[Z.f[i] * NFB + clamp(Math.floor((Z.u[i] + B) / 1.5), 0, NFB - 1)]++;
    else if (Z.st[i] === 5) wallBin[Z.road[i] * 10 + clamp(Math.floor((Z.off[i] + WALLHALF) / 1.5), 0, 9)]++;
  }
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      st = Z.st[i];
    if (st === 0) continue;
    // les effets : brûlure (comptée aux tourelles), poison (au joueur), entrave (dehors : il ne bouge pas), ralenti, hâte
    if (Z.burn[i] > 0) {
      Z.burn[i] -= dt;
      if (hurtZ(S, i, (4 + P.fl.dps * 0.18) * dt, 't')) continue;
    }
    if (Z.psn[i] > 0) {
      Z.psn[i] -= dt;
      if (hurtZ(S, i, (3 + P.rDmg * 0.45) * (1 + S.hm.ePoisD) * dt, 'p')) continue;
    }
    if (Z.root[i] > 0 && (st === 1 || st === 5)) {
      Z.root[i] -= dt;
      continue;
    }
    let pace = 1;
    if (Z.slow[i] > 0) {
      Z.slow[i] -= dt;
      pace = 0.55;
    }
    if (Z.hst[i] > 0) {
      Z.hst[i] -= dt;
      pace *= 1.5;
    }
    // le hurleur crie toutes les 6 à 8 s : 4 s de hâte aux zombies proches (cases de voisinage à ±12 m, à 3 m de hauteur près), sauf les mastodontes
    if (Z.ty[i] === 7 && (st === 1 || st === 3)) {
      Z.hcd[i] -= dt;
      if (Z.hcd[i] <= 0) {
        Z.hcd[i] = 6 + S.rnd() * 2;
        const x = Z.x[i],
          y = Z.y[i],
          z = Z.z[i];
        gridEach(S, x, z, 12, j => {
          if (j !== i && Z.st[j] && Z.ty[j] !== 3 && Math.abs(Z.y[j] - y) < 3) Z.hst[j] = Math.max(Z.hst[j], 4);
        });
        S.ev.push({ k: 'hurle', x, y: y + 1.6, z });
      }
    }
    // dans l'immeuble, le casseur cogne la cloison qu'il a devant lui (3 de dégâts toutes les 0,9 s)
    if (Z.ty[i] === 5 && st === 3) {
      Z.hcd[i] -= dt;
      if (Z.hcd[i] <= 0) {
        Z.hcd[i] = 0.9;
        const fx = Math.sin(Z.yaw[i]),
          fz = Math.cos(Z.yaw[i]),
          r = rayWallHit(Z.x[i], Z.y[i] + 0.9, Z.z[i], fx, 0, fz, 1.1);
        if (r.o && r.o.destr && !r.o.dead) {
          wallDmg(S, r.o, 3, Z.x[i] + fx * r.t, Z.y[i] + 0.9, Z.z[i] + fz * r.t);
          S.ev.push({ k: 'wallhit', x: Z.x[i] + fx * r.t, y: Z.y[i] + 0.9, z: Z.z[i] + fz * r.t });
        }
      }
    }
    // la phase d'animation, puis le pas selon l'état
    Z.ph[i] += dt * (st === 2 || st === 5 ? 3.2 : Z.sp[i] * 2.2);
    if (st === 1 && S.mode === 'out') {
      const px = Z.x[i],
        pz = Z.z[i];
      outWalk(S, i, dt, pace);
      if (S.ramparts.length && Z.y[i] < 0.5) rampartBlock(S, i, px, pz, dt);
    } else if (st === 1) inWalk(S, i, dt, pace);
    else if (st === 5) wallClimbStep(S, i, dt, pace);
    else if (st === 2) facadeStep(S, i, dt, pace);
    else if (st === 3) insideStep(S, i, dt, pace);
    else if (st === 7) stairStep(S, i, dt, pace);
  }
  // les feux au sol (napalm des lance-flammes, flammes de l'Orbe) brûlent ceux qui marchent dedans
  for (const f of S.fires) {
    S.mOwn = f.own;
    f.t -= dt;
    gridEach(S, f.x, f.z, f.r, j => {
      if (Z.st[j] === 1 && Z.y[j] < 0.5) {
        const dx = Z.x[j] - f.x,
          dz = Z.z[j] - f.z;
        if (dx * dx + dz * dz < f.r * f.r) {
          // V5.3 : un feu au sol d'un autre élément (f.el : l'Orbe d'un héros à l'élément choisi) applique l'effet de cet élément au lieu de brûler
          if (!f.el) Z.burn[j] = Math.max(Z.burn[j], 1);
          S.sortEl = f.el;
          hurtZ(S, j, f.dps * dt, 't');
          S.sortEl = null;
        }
      }
    });
  }
  S.fires = S.fires.filter(f => f.t > 0);
  S.mOwn = undefined;
}
// enlève de S.act les morts et les échappés (Z.st 0) et rend leurs places à S.free
function compact(S) {
  const Z = S.z;
  let n = 0;
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] !== 0) S.act[n++] = i;
    else S.free.push(i);
  }
  S.nAct = n;
}
// les cadavres tombent jusqu'au sol (événement land) ; le plus vieux disparaît après 9 s
function corpsesStep(S, dt) {
  for (const c of S.corpses) {
    c.t += dt;
    if (!c.land) {
      c.vy -= 18 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.z += c.vz * dt;
      c.rot += dt * (3 + Math.abs(c.vx) + Math.abs(c.vz));
      const fl = floorAt(c.x, c.z, c.y + 0.05);
      if (c.y <= fl) {
        c.y = fl;
        c.land = 1;
        S.ev.push({ k: 'land', x: c.x, y: fl, z: c.z, big: bigZ(c.ty) });
      }
    }
  }
  if (S.corpses.length && S.corpses[0].t > 9) S.corpses.shift();
}
