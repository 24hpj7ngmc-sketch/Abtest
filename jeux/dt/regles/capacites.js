// ===================== LES CAPACITÉS : missile, onde de choc, leurre, frappe aérienne ; les projectiles =====================
// « Ils arrivent » : Missile (compétence) et Onde de choc (ultime) ; en mode fuite, le héros les remplace (l'interface n'appelle plus
// useMissile / useOnde quand il y a un héros ; la branche « fuite » de useOnde ne sert qu'au banc simtest.js). Leurre et Frappe aérienne sont des objets.
// projStep fait avancer ce qui est en vol : obus de mortier, missiles, bombes (frappe, météores, sous-munitions) et le leurre.
// Fournit aux autres dossiers : useMissile, useOnde, useLeurre, useAir (interface : boutons).

// ---------------------------------------------------------------- les capacités (renvoient true si elles partent)
// le missile part de l'œil vers le point visé (S.missiles), explose à l'arrivée (projStep)
function useMissile(S) {
  const P = S.P;
  if (!P.mis.on || S.misCd > 0 || S.phase !== 'day') return false;
  const aim = aimPoint(S, 160);
  S.misCd = P.mis.cd;
  const eye = eyeP(S.p);
  S.missiles.push({ x0: eye[0], y0: eye[1] + 0.4, z0: eye[2], x1: aim[0], y1: aim[1], z1: aim[2], t: 0, T: 0.35 + aim[3] / 140 });
  S.ev.push({ k: 'mlaunch' });
  return true;
}
// l'onde de choc (ultime, chargée en tuant : S.ult = 1). Toit : jette dans le vide ceux qui y sont ; dans l'immeuble : blesse et ralentit
// ceux qui sont près du joueur. « Ils arrivent » : décroche les grimpeurs (blessés d'autant plus qu'ils étaient haut) et repousse ceux
// de la place. Mode fuite : renvoie vers l'immeuble ceux du dehors (et fait redescendre ceux des murs d'avenue)
function useOnde(S) {
  const P = S.P,
    Z = S.z;
  if (!P.onde.on || S.ult < 1 || S.phase !== 'day') return false;
  S.ult = 0;
  S.ev.push({ k: 'onde' });
  const pw = P.onde.pw;
  if (S.mode === 'out') {
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k],
        st = Z.st[i];
      if (st === 3 && Z.lv[i] === NLV) {
        const dx = Z.x[i],
          dz = Z.z[i],
          l = Math.hypot(dx, dz) || 1;
        killZ(S, i, 'o', (dx / l) * 7, 4, (dz / l) * 7);
        continue;
      }
      if (st === 3 || st === 7) {
        const p = S.p;
        if (Math.hypot(Z.x[i] - p.x, Z.y[i] - p.y, Z.z[i] - p.z) < 10 && !hurtZ(S, i, Z.hm[i] * 0.6 * pw, 'o')) Z.slow[i] = 3;
        continue;
      }
      if (st !== 1 && st !== 5) continue;
      const l = Math.hypot(Z.x[i], Z.z[i]);
      if (l > 26 + 6 * pw) continue;
      if (hurtZ(S, i, 40 * pw * hpMul(S.day), 'o')) continue;
      const m = Math.max(0, Math.min(8 + 3 * pw, l - (B + 1.5)));
      Z.x[i] -= (Z.x[i] / l) * m;
      Z.z[i] -= (Z.z[i] / l) * m;
      Z.slow[i] = 2.5;
      if (st === 5) {
        Z.st[i] = 1;
        Z.y[i] = 0;
        outRoute(S, i);
      } else if (inPlaza(Z.x[i], Z.z[i]) && Z.wp[i] === 0) outRoute(S, i);
    }
    return true;
  }
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      st = Z.st[i];
    if (st === 0) continue;
    if (st === 2) {
      const n = FACES[Z.f[i]],
        dmg = Z.hm[i] * (0.4 + (1.3 * Z.y[i]) / H) * pw;
      Z.hp[i] -= dmg;
      if (Z.hp[i] <= 0) killZ(S, i, 'o', n[0] * (3 + S.rnd() * 3), 2 + S.rnd() * 2, n[1] * (3 + S.rnd() * 3));
      else {
        Z.st[i] = 1;
        Z.wp[i] = 2;
        Z.y[i] = Math.max(Z.y[i] * 0.25, 0);
        const q = facePt(Z.f[i], Z.u[i], 2.5 + S.rnd() * 3);
        Z.x[i] = q[0];
        Z.z[i] = q[1];
      }
    } else if (st === 3 && Z.lv[i] === NLV) {
      const dx = Z.x[i],
        dz = Z.z[i],
        l = Math.hypot(dx, dz) || 1;
      killZ(S, i, 'o', (dx / l) * 7, 4, (dz / l) * 7);
    } else if (st === 3 || st === 7) {
      const p = S.p;
      if (Math.hypot(Z.x[i] - p.x, Z.y[i] - p.y, Z.z[i] - p.z) < 10 && !hurtZ(S, i, Z.hm[i] * 0.6 * pw, 'o')) Z.slow[i] = 3;
    } else if (st === 1) {
      const dx = Z.x[i],
        dz = Z.z[i],
        l = Math.hypot(dx, dz);
      if (l < B + 8 + 5 * pw) {
        const k = (6 + 3 * pw) / Math.max(l, 1);
        Z.x[i] += dx * k * 0.5;
        Z.z[i] += dz * k * 0.5;
        hurtZ(S, i, 40 * pw * hpMul(S.day), 'o');
      }
    }
  }
  return true;
}
// le leurre : un appât sonore posé au sol là où l'on vise (S.decoy) ; ceux qui l'entendent (à R près) y vont, sans franchir un mur d'avenue
function useLeurre(S) {
  const P = S.P;
  if (!P.leu.on || S.leuCd > 0 || S.phase !== 'day' || S.p.down > 0) return false;
  const aim = aimPoint(S, 90);
  if (aim[1] > 0.5) return false;
  S.leuCd = P.leu.cd;
  // V4.3 : chez un invité du multi, l'hôte le pose (multi.js : action 'l')
  if (S.invite) return leurreInvite(S, aim);
  S.decoy = { x: aim[0], z: aim[2], t: P.leu.dur, R: P.leu.R };
  S.ev.push({ k: 'decoy', x: aim[0], z: aim[2] });
  return true;
}
// la frappe aérienne : une ligne de bombes le long de la direction visée, depuis le pied de l'immeuble vers l'extérieur (S.bombs)
function useAir(S) {
  const P = S.P;
  if (!P.air.on || S.airCd > 0 || S.phase !== 'day' || S.p.down > 0) return false;
  const aim = aimPoint(S, 140);
  S.airCd = P.air.cd;
  // V4.3 : chez un invité du multi, l'hôte la lance (multi.js : action 'r')
  if (S.invite) return frappeInvite(S, aim);
  const dx = aim[0],
    dz = aim[2],
    l = Math.hypot(dx, dz) || 1,
    ux = dx / l,
    uz = dz / l;
  for (let k = 0; k < P.air.n; k++) {
    const along = Math.max(B + 4, l - 10) + k * 5.5;
    S.bombs.push({ x: ux * along + (S.rnd() - 0.5) * 4, z: uz * along + (S.rnd() - 0.5) * 4, t: 1.1 + k * 0.13 });
  }
  S.ev.push({ k: 'jet', x: ux * l, z: uz * l });
  return true;
}
// ---------------------------------------------------------------- ce qui est en vol
// obus de mortier (explosion, puis sous-munitions de la Fragmentation), missiles, bombes (frappe, météores, sous-munitions), leurre
// (à la fin, il explose s'il est piégé)
function projStep(S, dt) {
  const P = S.P;
  for (const s of S.shells) {
    s.t += dt;
    if (s.t >= s.T) {
      s.done = 1;
      S.mOwn = s.own; // V4.6 : l'obus du mortier d'un invité : ses tués sont à lui
      boom(S, s.x1, s.y1 + 0.3, s.z1, s.r, s.dmg, 't', 'm');
      for (let k = 0; k < s.frag * 2; k++) {
        const a = S.rnd() * 6.28,
          d = 2 + S.rnd() * 3.5;
        S.bombs.push({
          x: s.x1 + Math.cos(a) * d,
          z: s.z1 + Math.sin(a) * d,
          t: 0.25 + S.rnd() * 0.3,
          dmg: s.dmg * 0.45,
          r: s.r * 0.6,
          small: 1,
          own: s.own
        });
      }
      S.mOwn = undefined;
    }
  }
  S.shells = S.shells.filter(s => !s.done);
  for (const m of S.missiles) {
    m.t += dt;
    if (m.t >= m.T) {
      m.done = 1;
      boom(S, m.x1, m.y1 + 0.3, m.z1, P.mis.r, P.mis.dmg, 'p', 'M');
    }
  }
  S.missiles = S.missiles.filter(m => !m.done);
  for (const b of S.bombs) {
    S.mOwn = b.own;
    b.t -= dt;
    if (b.t <= 0) {
      b.done = 1;
      // V4.9 : météore d'un ultime teinté (b.el : voies.js) ; Artilleur, Sol en feu (b.feu : 4 s de feu au sol)
      S.ultEl = b.el || null;
      // V5.3 : le météore d'un héros à l'élément choisi (b.ec : sortEffet) ; son sol en feu prend aussi cet élément
      S.sortEl = b.ec || null;
      boom(S, b.x, 0.3, b.z, b.r || 5, b.dmg || P.air.dmg, 'p', b.small ? 'm' : 'A');
      S.sortEl = null;
      S.ultEl = null;
      if (b.feu) S.fires.push({ x: b.x, z: b.z, r: 3.5, t: 4, dps: 24 * uPow(S), own: b.own, el: b.ec });
    }
  }
  S.bombs = S.bombs.filter(b => !b.done);
  S.mOwn = undefined;
  if (S.decoy) {
    S.decoy.t -= dt;
    if (S.decoy.t <= 0) {
      if (P.leu.boom) boom(S, S.decoy.x, 0.3, S.decoy.z, 7, 300 * hpMul(S.day), 'p', 'A');
      S.decoy = null;
    }
  }
}
