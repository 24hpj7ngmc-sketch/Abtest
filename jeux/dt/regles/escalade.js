// ===================== ESCALADE, TYROLIENNES, ÉCHELLES (mode « Ils s'échappent ») =====================
// Tous trois déplacent le joueur le long d'un chemin tout fait : p.clb (escalade et échelles : une liste de points suivie en un temps donné)
// ou p.zip (tyrolienne : une position le long du câble). Pendant l'escalade, pas de collision et pas de tir.
// Fournit aux autres dossiers : zipSpot, climbSpot (interface : nom du bouton Saut) ; LADDERS (tests).

// ---------------------------------------------------------------- les tyroliennes (mode fuite)
// Au pied d'un poteau (toit ou passerelle), face au câble : Saut devient « Tyrolienne ». On glisse dans les deux sens, on peut tirer, Saut = lâcher.
function zipSpot(S) {
  const p = S.p;
  if (S.mode !== 'out' || p.dead || p.clb || p.zip || !p.ground) return null;
  const fx = -Math.sin(p.yaw),
    fz = -Math.cos(p.yaw);
  if (p.pitch < -0.4) return null;
  for (let i = 0; i < ZIPS.length; i++) {
    const zl = ZIPS[i],
      dx = zl.b[0] - zl.a[0],
      dz = zl.b[2] - zl.a[2],
      l = Math.hypot(dx, dz),
      ux = dx / l,
      uz = dz / l;
    if (Math.abs(p.y - H) < 0.3 && Math.hypot(p.x - zl.a[0], p.z - zl.a[2]) < 1.9 && fx * ux + fz * uz > 0.5) return { i, dir: 1 };
    if (Math.abs(p.y - PASSY) < 0.3 && Math.hypot(p.x - zl.b[0], p.z - zl.b[2]) < 2.2 && -(fx * ux + fz * uz) > 0.5) return { i, dir: -1 };
  }
  return null;
}
// on accroche la poulie (at : ce que zipSpot a trouvé) ; ox, oz : écart au câble, rattrapé pendant le décollage
function startZip(S, at) {
  const p = S.p,
    zl = ZIPS[at.i],
    L = Math.hypot(zl.b[0] - zl.a[0], zl.b[1] - zl.a[1], zl.b[2] - zl.a[2]);
  const q = at.dir > 0 ? zl.a : zl.b;
  p.zip = { i: at.i, dir: at.dir, s: at.dir > 0 ? 0 : L, L, v: 0, lift: 0, ox: p.x - q[0], oz: p.z - q[2] };
  p.gl = 0;
  p.vx = p.vz = p.vy = 0;
  p.ground = false;
  S.ev.push({ k: 'zip', dir: at.dir });
}
// un pas sur la tyrolienne : accélère jusqu'à 13 m/s en descente (9 en remontée), ralentit dans les 5 derniers mètres ; arrivé, on se pose.
// Position des pieds sous la poulie : le câble est ZIPH au-dessus des pieds de poteau ; on pend 0,4 m plus haut que le sol au départ (on décolle)
function zipStep(S, dt) {
  const p = S.p,
    ride = p.zip,
    zl = ZIPS[ride.i],
    top = ride.dir > 0 ? 13 : 9,
    left = ride.dir > 0 ? ride.L - ride.s : ride.s;
  ride.v = Math.min(top, ride.v + dt * (ride.dir > 0 ? 9 : 7));
  if (left < 5) ride.v = Math.max(2.5, Math.min(ride.v, left * 2.4));
  ride.lift = Math.min(1, ride.lift + dt * 4);
  ride.s = Math.max(0, Math.min(ride.L, ride.s + ride.dir * ride.v * dt));
  const u = ride.s / ride.L,
    x = zl.a[0] + (zl.b[0] - zl.a[0]) * u,
    y = zl.a[1] + (zl.b[1] - zl.a[1]) * u + 0.4 * ride.lift,
    zc = zl.a[2] + (zl.b[2] - zl.a[2]) * u;
  const hang = 1 - ride.lift,
    nx = x + ride.ox * hang,
    nz = zc + ride.oz * hang;
  p.vx = (nx - p.x) / dt;
  p.vz = (nz - p.z) / dt;
  p.x = nx;
  p.y = y;
  p.z = nz;
  if (ride.dir > 0 ? ride.s >= ride.L : ride.s <= 0) {
    p.zip = null;
    const g = floorAt(p.x, p.z, p.y + 0.1);
    p.y = g;
    p.vy = 0;
    p.vx = p.vz = 0;
    p.ground = true;
    S.ev.push({ k: 'zipend' });
  }
}
// Saut pendant le trajet = « Lâcher » : on tombe dans la rue avec 60 % de la vitesse
function zipLetGo(S) {
  const p = S.p,
    ride = p.zip,
    zl = ZIPS[ride.i],
    l = Math.hypot(zl.b[0] - zl.a[0], zl.b[2] - zl.a[2]);
  p.zip = null;
  p.vx = ((zl.b[0] - zl.a[0]) / l) * ride.v * ride.dir * 0.6;
  p.vz = ((zl.b[2] - zl.a[2]) / l) * ride.v * ride.dir * 0.6;
  p.vy = 0;
  p.ground = false;
  S.ev.push({ k: 'zipend', drop: 1 });
}
// ---------------------------------------------------------------- les échelles des passerelles (libres, sans l'Escalade)
// dans la rue au pied d'une passerelle en regardant en haut = « Grimper » ; sur la passerelle au garde-corps en regardant en bas = « Descendre »
// renvoie le geste (comme climbSpot, avec free : 1) ou null
function passSpot(S) {
  const p = S.p;
  if (S.mode !== 'out') return null;
  const fwdX = -Math.sin(p.yaw),
    fwdZ = -Math.cos(p.yaw);
  for (const zl of ZIPS) {
    const n = zl.n,
      t = zl.t,
      dx = p.x - zl.c[0],
      dz = p.z - zl.c[2],
      dn = dx * n[0] + dz * n[1],
      du = dx * t[0] + dz * t[1];
    if (Math.abs(du) > PASSW - 0.3) continue;
    const at = (d, y) => [zl.c[0] + n[0] * d + t[0] * du, y, zl.c[2] + n[1] * d + t[1] * du];
    if (p.y < 0.3 && Math.abs(dn) < 4 && p.pitch > 0.45) {
      const s = dn >= 0 ? 1 : -1;
      return {
        dir: 1,
        free: 1,
        P: [[p.x, p.y, p.z], at(s * 1.9, 0.3), at(s * 1.9, PASSY + 1.25), at(s * 0.95, PASSY + 0.8), at(s * 0.5, PASSY)]
      };
    }
    if (Math.abs(p.y - PASSY) < 0.3 && Math.abs(dn) < 1.25 && p.pitch < -0.25) {
      const s = dn >= 0 ? 1 : -1,
        facing = s * (fwdX * n[0] + fwdZ * n[1]);
      if (Math.abs(dn) > 0.35 && facing > 0.45)
        return {
          dir: -1,
          free: 1,
          P: [[p.x, p.y, p.z], at(s * 1.05, PASSY + 1.15), at(s * 1.9, PASSY + 0.8), at(s * 1.9, 1), at(s * 2.3, 0)]
        };
    }
  }
  return null;
}
// les échelles des passerelles, comme de vraies échelles : on marche dedans (joystick vers l'échelle) et on monte tout seul ;
// sur la passerelle, au-dessus d'une échelle, on pousse vers le vide et on descend. Une échelle à chaque pied (quatre par passerelle).
const LADDERS = [];
for (const zl of ZIPS)
  for (const s of [-1, 1])
    for (const e of [-1, 1]) {
      const n = zl.n,
        t = zl.t,
        P = (d, y) => [zl.c[0] + n[0] * d + t[0] * e * (PASSW - 0.15), y, zl.c[2] + n[1] * d + t[1] * e * (PASSW - 0.15)];
      LADDERS.push({
        s,
        ox: n[0] * s,
        oz: n[1] * s,
        foot: P(s * 1.75, 0),
        top: P(s * 0.75, PASSY),
        up: [P(s * 1.75, 0.25), P(s * 1.75, PASSY + 1.2), P(s * 0.95, PASSY + 0.85), P(s * 0.55, PASSY)],
        down: [P(s * 1.05, PASSY + 1.15), P(s * 1.75, PASSY + 0.6), P(s * 1.75, 0.25), P(s * 1.95, 0)]
      });
    }
// au pied d'une échelle (à 0,95 m), le joystick vers elle pendant 0,12 s : on monte tout seul ; en haut, vers le vide : on descend
function ladderAuto(S, dt, tx, tz, m) {
  const p = S.p;
  if (S.mode !== 'out' || !p.ground || m < 0.45) {
    p.ladT = 0;
    return false;
  }
  const l = Math.hypot(tx, tz) || 1,
    dx = tx / l,
    dz = tz / l;
  for (const L of LADDERS) {
    let path = null;
    if (p.y < 0.3 && Math.hypot(p.x - L.foot[0], p.z - L.foot[2]) < 0.95 && -(dx * L.ox + dz * L.oz) > 0.6) path = L.up;
    else if (Math.abs(p.y - PASSY) < 0.3 && Math.hypot(p.x - L.top[0], p.z - L.top[2]) < 0.95 && dx * L.ox + dz * L.oz > 0.6) path = L.down;
    if (path) {
      p.ladT = (p.ladT || 0) + dt;
      if (p.ladT < 0.12) return false;
      p.ladT = 0;
      startClimb(S, { dir: path === L.up ? 1 : -1, free: 1, v: 4.2, P: [[p.x, p.y, p.z], ...path] });
      return true;
    }
  }
  p.ladT = 0;
  return false;
}
// ---------------------------------------------------------------- l'escalade
// L'escalade (à débloquer : Survie → Escalade ; mode fuite) : au bord du toit ou d'un balcon, regarder vers le bas et Saut = descendre d'un étage
// (balcon du dessous, ou la rue depuis le 1er) ; sur un balcon ou dans la rue au pied de l'immeuble, regarder vers le haut et Saut = monter d'un étage.
// renvoie le geste possible ici ({ dir : 1 monter / −1 descendre, P : les points du chemin, free : sans l'Escalade }), ou null
function climbSpot(S) {
  const p = S.p;
  if (S.mode !== 'out' || p.dead || p.clb || p.zip || !p.ground) return null;
  {
    const q = passSpot(S);
    if (q) return q;
  }
  // la façade la plus proche (out : distance au-delà de son plan, négative dedans) ; facing : on lui fait face (vers l'extérieur) ;
  // at(d, y) : point à d du plan de la façade, à hauteur y, en face du joueur
  let f = 0,
    out = -1e9;
  for (let k = 0; k < 4; k++) {
    const v = FACES[k][0] * p.x + FACES[k][1] * p.z - B;
    if (v > out) {
      out = v;
      f = k;
    }
  }
  const n = FACES[f],
    t = [-n[1], n[0]],
    E = B + BALD - 0.7,
    u = Math.max(-E, Math.min(E, t[0] * p.x + t[1] * p.z)),
    facing = -(n[0] * Math.sin(p.yaw) + n[1] * Math.cos(p.yaw)),
    pitch = p.pitch;
  const at = (d, y) => [n[0] * (B + d) + t[0] * u, y, n[1] * (B + d) + t[1] * u];
  const balIdx = BALV.findIndex(l => Math.abs(p.y - LVY(l)) < 0.3),
    last = BALV.length - 1,
    y = p.y;
  // au bord du toit, face au vide, en regardant en bas : par-dessus le parapet, jusqu'au balcon du dernier étage
  if (p.y > H - 0.3 && out > -1.5 && facing > 0.45 && pitch < -0.25) {
    const yl = LVY(BALV[last]);
    return { dir: -1, P: [[p.x, p.y, p.z], at(-0.45, H + 0.9), at(0.5, H + 0.7), at(0.6, yl + 1.1), at(1.1, yl)] };
  }
  // sur un balcon : au garde-corps en regardant en bas, le balcon du dessous (ou la rue depuis le 1er) ;
  // n'importe où en regardant en haut, le balcon du dessus (ou le toit depuis le dernier)
  if (balIdx >= 0 && out > -0.05 && out < BALD) {
    if (pitch < -0.25 && facing > 0.45 && out > BALD - 1.4) {
      const q = [[p.x, p.y, p.z], at(BALD - 0.3, y + 1.15), at(BALD + 0.5, y + 0.75)];
      if (balIdx > 0) {
        const yl = LVY(BALV[balIdx - 1]);
        q.push(at(BALD + 0.5, yl + 1.3), at(BALD - 0.45, yl + 0.7), at(1.3, yl));
      } else q.push(at(BALD + 0.55, 1.1), at(BALD + 0.8, 0));
      return { dir: -1, P: q };
    }
    if (pitch > 0.45) {
      if (balIdx < last) {
        const yu = LVY(BALV[balIdx + 1]);
        return {
          dir: 1,
          P: [
            [p.x, p.y, p.z],
            at(BALD - 0.35, y + 1.1),
            at(BALD + 0.5, y + 1.4),
            at(BALD + 0.5, yu + 1.3),
            at(BALD - 0.45, yu + 0.7),
            at(1.3, yu)
          ]
        };
      }
      return { dir: 1, P: [[p.x, p.y, p.z], at(0.45, y + 0.6), at(0.4, H + 1), at(-0.55, H + 0.75), at(-1.1, H)] };
    }
  }
  // dans la rue au pied de l'immeuble, en regardant en haut : le balcon du 1er
  if (p.y < 0.3 && out > 0 && out < BALD + 2.5 && pitch > 0.45) {
    const yu = LVY(BALV[0]);
    return { dir: 1, P: [[p.x, p.y, p.z], at(BALD + 0.5, 0.5), at(BALD + 0.5, yu + 1.3), at(BALD - 0.45, yu + 0.7), at(1.3, yu)] };
  }
  return null;
}
// commence un geste d'escalade ou d'échelle : p.clb = { P points, L distances cumulées, t, T durée, dir } (vitesse c.v, sinon celle de l'Escalade)
function startClimb(S, c) {
  const p = S.p,
    L = [0];
  for (let i = 1; i < c.P.length; i++) {
    const a = c.P[i - 1],
      b = c.P[i];
    L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  p.clb = { P: c.P, L, t: 0, T: Math.max(0.6, L[L.length - 1] / (c.v || S.P.grimpe.v)), dir: c.dir };
  p.gl = 0;
  p.vx = p.vz = p.vy = 0;
  S.ev.push({ k: 'climb', dir: c.dir });
}
// un pas du geste : le long des points, en douceur (départ et arrivée lents) ; à la fin, on est posé (événement climbed)
function climbStep(S, dt) {
  const p = S.p,
    c = p.clb;
  c.t += dt;
  const r = Math.min(1, c.t / c.T),
    e = r * r * (3 - 2 * r),
    s = e * c.L[c.L.length - 1];
  let i = 1;
  while (i < c.L.length - 1 && c.L[i] < s) i++;
  const a = c.P[i - 1],
    b = c.P[i],
    u = c.L[i] > c.L[i - 1] ? (s - c.L[i - 1]) / (c.L[i] - c.L[i - 1]) : 1;
  p.x = a[0] + (b[0] - a[0]) * u;
  p.y = a[1] + (b[1] - a[1]) * u;
  p.z = a[2] + (b[2] - a[2]) * u;
  if (r >= 1) {
    p.clb = null;
    p.ground = true;
    p.vy = 0;
    S.ev.push({ k: 'climbed', dir: c.dir });
  }
}

// ---------------------------------------------------------------- V4.7 : le grappin (mode fuite, à débloquer : Survie → Tyrolienne → Grappin)
// Sa demande du 25/11 : « un grappin ». Un outil de la barre : on vise une façade, un balcon, le toit, une passerelle ou la rue, Action lance le
// crochet et l'on est tiré jusque-là (un geste d'escalade p.clb, rapide, avec le point d'accroche gr pour dessiner la corde).
// Sur une façade, on se pose sur le sol le plus proche du point touché : le balcon (ou le toit, par-dessus le parapet) juste au-dessus,
// ou juste en dessous. Pas de plafond (un sol vu d'en dessous), et rien au-delà de la portée (S.P.grap.r).
// renvoie { hit : point d'accroche, land : où l'on se pose, n : son nom, P : le chemin des pieds } ou null
function grappinVise(S) {
  const p = S.p,
    G = S.P.grap;
  if (S.mode !== 'out' || !G.on || p.dead || p.down > 0 || p.clb || p.zip) return null;
  const o = eyeP(p),
    d = viewDir(p),
    R = G.r;
  // le sol de la rue, s'il est dans la portée ; puis la première boîte qui arrête les balles (façades, parapet, balcons, cloisons)
  let t = d[1] < -1e-3 ? Math.min(R, o[1] / -d[1]) : R;
  const sol = d[1] < -1e-3 && o[1] / -d[1] <= R;
  const w = rayWallHit(o[0], o[1], o[2], d[0], d[1], d[2], t);
  let box = w.o,
    pass = false;
  t = w.t;
  // les passerelles n'arrêtent pas les balles : leur tablier se cherche à part (par-dessus ou par-dessous)
  if (Math.abs(d[1]) > 1e-3) {
    const tp = (PASSY - 0.15 - o[1]) / d[1];
    if (tp > 0.5 && tp < t)
      for (const f of FLOORS)
        if (f.pass !== undefined && !f.off) {
          const x = o[0] + d[0] * tp,
            z = o[2] + d[2] * tp;
          if (x > f.x0 - 0.4 && x < f.x1 + 0.4 && z > f.z0 - 0.4 && z < f.z1 + 0.4) {
            t = tp;
            box = null;
            pass = true;
            break;
          }
        }
  }
  if (!box && !pass && !sol) return null; // rien à attraper dans la portée
  const hit = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
  // un plafond dans l'immeuble (le dessous d'une boîte) : le crochet n'y tient pas ; dehors (le dessous d'un balcon), il passe par-dessus
  if (box && d[1] > 0 && hit[1] <= box.y0 + 0.03 && Math.abs(hit[0]) < B && Math.abs(hit[2]) < B) return null;
  if (t < 2) return null; // trop près
  const h = Math.hypot(d[0], d[2]) || 1,
    ux = d[0] / h,
    uz = d[2] / h;
  let land = null;
  if (pass) land = [Math.max(-150, Math.min(150, hit[0])), PASSY, hit[2]];
  else
    for (const k of [-0.6, 1.2, -1.5]) {
      // un peu avant le point touché (balcon, rue), puis un peu après (par-dessus un parapet), puis plus avant
      const qx = hit[0] + ux * k,
        qz = hit[2] + uz * k,
        fy = floorAt(qx, qz, hit[1] + 2.6);
      if (fy >= hit[1] - 1.6) {
        land = [qx, fy, qz];
        break;
      }
    }
  if (!land) return null;
  // le chemin des pieds : jusque sous le crochet (le long du câble), puis par-dessus le rebord s'il le faut, puis posé
  const P = [[p.x, p.y, p.z]];
  if (box) {
    const ax = hit[0] - ux * 0.45,
      az = hit[2] - uz * 0.45,
      ay = Math.max(land[1], hit[1] - 1.1);
    P.push([ax, ay, az]);
    if (land[1] > ay - 0.1) P.push([ax, land[1] + 0.7, az]);
  } else if (pass && land[1] > p.y + 0.5) P.push([land[0], land[1] + 0.7, land[2]]);
  P.push(land);
  // le nom de l'arrivée (étiquette sous le viseur)
  const dedans = Math.abs(land[0]) < B && Math.abs(land[2]) < B,
    lv = LVY(NLV) - land[1] < 0.1 ? NLV : [0, 1, 2, 3, 4].find(k => Math.abs(LVY(k) - land[1]) < 0.1);
  const n = pass
    ? 'la passerelle'
    : land[1] < 0.1
      ? dedans
        ? 'le rez-de-chaussée'
        : 'la rue'
      : lv === NLV && dedans
        ? 'le toit'
        : lv > 0
          ? (dedans ? 'le ' : 'le balcon du ') + lv + (lv === 1 ? 'er' : 'e') + (dedans ? ' étage' : '')
          : 'là';
  return { hit, land, n, P };
}
// lance le grappin visé (g : ce que grappinVise a trouvé) : le crochet part, puis l'on est tiré ; renvoie true s'il part
function useGrappin(S, g) {
  if (!g || S.grapCd > 0) return false;
  S.grapCd = S.P.grap.cd;
  startClimb(S, { dir: 0, P: g.P, v: S.P.grap.v });
  S.p.clb.gr = g.hit;
  S.ev.push({ k: 'grappin', x: g.hit[0], y: g.hit[1], z: g.hit[2] });
  return true;
}
