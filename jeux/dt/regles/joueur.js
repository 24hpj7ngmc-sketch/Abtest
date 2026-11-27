// ===================== LE JOUEUR : déplacement, regard, escalier qui porte =====================
// playerStep : un pas du joueur (joystick, sprint, saut, vol libre du mode dev, collisions, sols) ; finishP : la fin commune
// (niveau, balcon, escalier, recharges, soin, tir). L'escalade, les tyroliennes et les échelles sont dans escalade.js.
// Fournit aux autres dossiers : viewDir, eyeP (affichage, interface : caméra, visée) ; shopNear (interface) ; playerStep (tests).

// ---------------------------------------------------------------- le relevé (V4.2)
// le joueur tombé se relève au point de départ, sur le toit, avec toute sa vie et 2 s d'invincibilité (événement releve : l'interface
// remet le regard face au nord)
function releve(S) {
  const p = S.p;
  p.down = 0;
  p.x = 0;
  p.y = H;
  p.z = -7;
  p.vx = p.vy = p.vz = 0;
  p.yaw = 0;
  p.pitch = -0.12;
  p.hp = p.hpMax;
  p.inv = 2;
  p.hurtT = 9;
  p.ground = true;
  p.crouch = false;
  p.surge = 0;
  p.spr = false;
  p.clb = null;
  p.zip = null;
  p.gl = 0;
  S.ev.push({ k: 'releve' });
}
// ---------------------------------------------------------------- le pas du joueur
// inp (les commandes, rempli par l'interface) : f, r (joystick avant / côté, −1…1), sprint, crouch, jump (un seul pas), fire, yaw, pitch,
// ads (V4.9 : en visée, l'arme en main)
// (le regard, déjà réglé par l'interface) ; mode dev : fly (vol libre), up, down (monter, descendre en vol).
// Ordre : escalade ou tyrolienne en cours, échelle, escalier qui porte, sinon la marche (élan, collisions, tourelles, saut, gravité, sol).
function playerStep(S, dt, inp) {
  const p = S.p;
  S.grapCd = Math.max(0, (S.grapCd || 0) - dt); // V4.7 : recharge du grappin (à toute heure)
  if (p.dead) return;
  // V4.2 : tombé (mode fuite, voir hurtP) : rien ne bouge jusqu'au relevé
  if (p.down > 0) {
    p.down -= dt;
    p.vx = p.vz = p.vy = 0;
    if (p.down <= 0) releve(S);
    return;
  }
  p.yaw = inp.yaw;
  p.pitch = inp.pitch;
  const fly = !!inp.fly;
  p.crouch = !!inp.crouch && !fly;
  let fwd = inp.f,
    side = inp.r;
  const sprinting = !!inp.sprint && !p.crouch;
  // en sprint, toujours à pleine vitesse
  if (sprinting) {
    const m = Math.hypot(fwd, side) || 1;
    fwd /= m;
    side /= m;
  }
  // le départ du sprint donne un coup d'accélération : la vitesse monte au-dessus du sprint (+35 %) puis redescend en 0,4 s
  if (sprinting && !p.spr) {
    p.surge = 0.4;
    S.ev.push({ k: 'sprint' });
  }
  p.spr = sprinting;
  p.surge = Math.max(0, p.surge - dt);
  // vitesse voulue (m/s) : accroupi 2,1, marche 4,3, sprint 7,2 (Volt 8,6), ×2,4 en vol ; (vxWant, vzWant) : la vitesse voulue, dans le monde
  // V4.2 : l'arbre du héros au lobby (S.hm) : + marche (hSpd, partout), + sprint (hSprint)
  const speed =
      (p.crouch ? 2.1 : sprinting ? (S.hero === 'elec' ? 8.6 : 7.2) * (1 + S.hm.hSprint) : 4.3) *
      (1 + S.hm.hSpd) *
      (1 + (0.35 * p.surge) / 0.4) *
      (fly ? 2.4 : 1),
    sinY = Math.sin(p.yaw),
    cosY = Math.cos(p.yaw),
    vxWant = (-sinY * fwd + cosY * side) * speed,
    vzWant = (-cosY * fwd - sinY * side) * speed;
  if (p.clb && !fly) {
    climbStep(S, dt);
    return finishP(S, dt, inp, true);
  }
  if (p.zip && !fly) {
    if (inp.jump) zipLetGo(S);
    else {
      zipStep(S, dt);
      return finishP(S, dt, inp, false);
    }
  }
  if (!fly && !inp.jump && ladderAuto(S, dt, vxWant, vzWant, Math.min(1, Math.hypot(fwd, side)))) return finishP(S, dt, inp, true);
  if (!fly && !inp.jump && glideStep(S, dt, vxWant, vzWant, speed, Math.min(1, Math.hypot(fwd, side)))) return finishP(S, dt, inp, false);
  if (fly) p.gl = 0;
  // un peu d'élan : la vitesse suit le joystick vite, mais pas d'un coup
  const follow = Math.min(1, dt * (sprinting ? 11 : 15));
  p.vx += (vxWant - p.vx) * follow;
  p.vz += (vzWant - p.vz) * follow;
  const y0 = p.y;
  p.x += p.vx * dt;
  p.z += p.vz * dt;
  if (!fly) {
    // les murs, puis les tourelles de son niveau (un cercle de 0,85 m), puis les murs encore
    collideP(p, 0.3);
    for (const t of S.tur) {
      if (t.k === 'mur' || Math.abs(SLOTS[t.slot].y - p.y) > 1) continue;
      const dx = p.x - t.x,
        dz = p.z - t.z,
        d = Math.hypot(dx, dz);
      if (d < 0.85 && d > 1e-4) {
        p.x = t.x + (dx / d) * 0.85;
        p.z = t.z + (dz / d) * 0.85;
      }
    }
    collideP(p, 0.3);
  }
  if (fly) {
    p.vy = 0;
    p.ground = false;
    p.y = Math.max(0, Math.min(90, p.y + ((inp.up ? 1 : 0) - (inp.down ? 1 : 0)) * 12 * dt));
    p.x = Math.max(-150, Math.min(150, p.x));
    p.z = Math.max(-150, Math.min(150, p.z));
  } else {
    // Saut : tyrolienne, escalade (ou échelle de passerelle) si l'on est au bon endroit, sinon un vrai saut
    if (inp.jump && p.ground) {
      const zipAt = zipSpot(S);
      if (zipAt && S.P.tyro.on) {
        startZip(S, zipAt);
        return finishP(S, dt, inp, false);
      }
      if (zipAt) S.ev.push({ k: 'tyro_lock' }); // V4.7 : la tyrolienne se débloque (Survie)
      const climbAt = climbSpot(S);
      if (climbAt && (climbAt.free || S.P.grimpe.on)) {
        startClimb(S, climbAt);
        return finishP(S, dt, inp, true);
      }
      p.gl = 0;
      p.vy = 5.4 * Math.sqrt(1 + S.hm.hJump);
      p.ground = false;
    }
    p.vy -= 15 * dt;
    p.y += p.vy * dt;
    // le sol : on s'y pose (et l'on suit les marches qui descendent de moins de 0,6 m)
    const floorY = floorAt(p.x, p.z, Math.max(p.y, y0) + 0.45);
    if (p.y <= floorY || (p.ground && p.vy <= 0 && p.y - floorY < 0.6)) {
      p.y = floorY;
      p.vy = 0;
      p.ground = true;
    } else p.ground = false;
  }
  finishP(S, dt, inp, false);
}
// fin du pas du joueur, commune à la marche, à l'escalier et à l'escalade (on ne tire pas en grimpant) : où il est (niveau, balcon,
// volée d'escalier), recharges, soin (Bandages ; Ondine : +5/s après 1,5 s sans coup), tir à la cadence de l'arme
function finishP(S, dt, inp, climbing) {
  const p = S.p;
  S.plv = levelOf(p.y);
  S.pbal = -1;
  for (let f = 0; f < 4; f++) if (FACES[f][0] * p.x + FACES[f][1] * p.z > B) S.pbal = f;
  // dans la trémie : sur quelle volée est-il (S.pst) et où (S.pss) ; à hauteur du toit, seulement côté est (là où arrive la dernière volée)
  S.pst = -1;
  if (p.x > HOLE.x0 && p.x < HOLE.x1 && p.z > HOLE.z0 && p.z < HOLE.z1) {
    const lvBelow = Math.min(NLV - 1, S.plv);
    if (p.y < H - 0.05 || p.x > 0) {
      const flight = p.y >= LVY(lvBelow) + 0.01 || lvBelow === 0 ? lvBelow : lvBelow - 1;
      S.pst = Math.max(0, flight);
      S.pss = stairParam(S.pst, p.x, p.y, p.z);
    }
  }
  if (S.hab > 0) S.hab = Math.max(0, S.hab - dt);
  if (p.inv > 0) p.inv -= dt;
  p.hurtT += dt;
  {
    // V4.9 : Soigneuse (voies.js : soinK)
    const regen = S.P.regen + (S.hero === 'eau' ? (5 + S.hm.pA) * soinK(S) : 0);
    if (regen && p.hurtT > (S.hero === 'eau' ? 1.5 : 3)) p.hp = Math.min(p.hpMax, p.hp + regen * dt);
  }
  // V4.9 : les voies (visée du Sniper, tir continu du Mitrailleur, bouclier, aura du Mage de bataille : voies.js)
  if (S.voie) voieJoueur(S, dt, inp);
  p.fireT -= dt;
  if (inp.fire && !climbing && p.fireT <= 0) {
    p.fireT = Math.max(0, p.fireT) + 1 / (S.P.rRate * weapOf(S).rate * (S.voie ? cadenceVoie(S) : 1));
    // Sniper, Tir chargé : ce tir-ci, s'il est chargé
    p.tirCh = S.voie ? tirCharge(S) : false;
    shoot(S);
    if (p.tirCh) {
      p.tirCh = false;
      p.adsT = 0;
    }
    if (S.voie) voieTir(S);
  } else if (p.fireT < 0) p.fireT = 0;
}
// ---------------------------------------------------------------- le regard
// la direction du regard (vecteur unitaire)
function viewDir(p) {
  const cp = Math.cos(p.pitch);
  return [-Math.sin(p.yaw) * cp, Math.sin(p.pitch), -Math.cos(p.yaw) * cp];
}
// la hauteur des yeux (plus bas accroupi)
function eyeY(p) {
  return p.y + (p.crouch ? EYE - 0.55 : EYE);
}
// se pencher : au bord du toit, en regardant vers le bas, l'œil passe au-dessus du parapet (pour voir et viser ceux qui grimpent)
function eyeP(p) {
  const d = viewDir(p),
    k = Math.max(0, Math.min(1, (-p.pitch - 0.3) / 0.45));
  let x = p.x,
    z = p.z,
    y = eyeY(p);
  if (!k) return [x, y, z];
  const roof = p.y > H - 0.3;
  for (let f = 0; f < 4; f++) {
    const n = FACES[f],
      o = n[0] * p.x + n[1] * p.z,
      h = n[0] * d[0] + n[1] * d[2],
      e = roof ? B : B + BALD;
    if (!roof && o < B) continue;
    if (o < e - 1.2 || h < 0.15) continue;
    const a = Math.min(1, (o - (e - 1.2)) / 0.7) * k * Math.min(1, h * 2.5);
    x += n[0] * a * 1.05;
    z += n[1] * a * 1.05;
    y -= a * 0.2;
  }
  return [x, y, z];
}
// le point visé (sol, toit ou mur), pour le missile, le leurre, la frappe et les héros : [x, y, z, distance]
function aimPoint(S, maxd) {
  const p = S.p,
    d = viewDir(p),
    o = eyeP(p);
  let t = maxd || 140;
  if (d[1] < -1e-3) t = Math.min(t, o[1] / -d[1]);
  t = rayWall(o[0], o[1], o[2], d[0], d[1], d[2], t);
  return [o[0] + d[0] * t, Math.max(0, o[1] + d[1] * t), o[2] + d[2] * t, t];
}
// ---------------------------------------------------------------- V3.4 : l'escalier qui porte
// L'escalier : un seul chemin du hall du rez-de-chaussée jusqu'au toit. Dans la cage, pousser le joystick dans le sens des marches suffit :
// on suit les volées et le palier sans frotter les murs, la caméra prend les virages. Aux étages (devant les portes), on reprend la main.
// SP : P les points du chemin, cg[i] = 1 si le point est dans la cage (0 : devant les portes d'un étage), seg les longueurs, acc les
// distances cumulées, tot la longueur totale
const SP = (() => {
  const P = [],
    cg = [];
  const add = (x, y, z, c) => {
    P.push([x, y, z]);
    cg.push(c);
  };
  for (let k = 0; k < NLV; k++) {
    const L = LVY(k),
      h = LVY(k + 1) - L,
      m = L + h / 2;
    if (k === 0) add(-1, L, -2.25, 0);
    add(-1, L, -1.5, 1);
    add(-1, m, 1.5, 1);
    add(-0.6, m, 2.02, 1);
    add(0.6, m, 2.02, 1);
    add(1, m, 1.5, 1);
    add(1, L + h, -1.5, 1);
    if (k < NLV - 1) {
      add(1, L + h, -2.25, 0);
      add(-1, L + h, -2.25, 0);
    } else {
      add(1, L + h, -2.75, 1);
      add(1, L + h, -3.4, 0);
    }
  }
  const seg = [],
    acc = [0];
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1],
      b = P[i];
    seg.push(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    acc.push(acc[i - 1] + seg[i - 1]);
  }
  return { P, cg, seg, acc, tot: acc[acc.length - 1] };
})();
// le point du chemin le plus proche de (x, y, z) (la hauteur compte double) : { i segment, t (0 à 1), d écart, s distance le long du chemin }
function spNear(x, y, z) {
  let best = null,
    bd = 1e9;
  for (let i = 0; i < SP.seg.length; i++) {
    const a = SP.P[i],
      b = SP.P[i + 1],
      vx = b[0] - a[0],
      vy = b[1] - a[1],
      vz = b[2] - a[2],
      l2 = vx * vx + vy * vy + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy + (z - a[2]) * vz) / l2)),
      d = Math.hypot(x - a[0] - vx * t, z - a[2] - vz * t) + Math.abs(y - a[1] - vy * t) * 2;
    if (d < bd) {
      bd = d;
      best = { i, t, d, s: SP.acc[i] + t * SP.seg[i] };
    }
  }
  return best;
}
// le point du chemin à la distance s : { x, y, z, i segment }
function spPos(s) {
  s = Math.max(0, Math.min(SP.tot, s));
  let i = 0;
  while (i < SP.seg.length - 1 && SP.acc[i + 1] < s) i++;
  const a = SP.P[i],
    b = SP.P[i + 1],
    u = SP.seg[i] ? (s - SP.acc[i]) / SP.seg[i] : 0;
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, z: a[2] + (b[2] - a[2]) * u, i };
}
// renvoie vrai si l'escalier a pris le déplacement en main ; tx, tz : direction voulue (monde), sp : vitesse, m : poussée du joystick (0 à 1).
// p.gl : sens du parcours (1 vers le toit, −1 vers le bas, 0 libre) ; p.glF : on est passé devant la cage (on continue vers la porte suivante)
function glideStep(S, dt, tx, tz, sp, m) {
  const p = S.p;
  // loin de la cage, ou à plus de 0,62 m du chemin : rien
  if (Math.abs(p.x) > 2.6 || p.z < -3.8 || p.z > 2.9) {
    p.gl = 0;
    return false;
  }
  const near = spNear(p.x, p.y, p.z);
  if (!near || near.d > 0.62) {
    p.gl = 0;
    return false;
  }
  const a = SP.P[near.i],
    b = SP.P[near.i + 1];
  let axX = b[0] - a[0],
    axZ = b[2] - a[2];
  const hl = Math.hypot(axX, axZ) || 1;
  axX /= hl;
  axZ /= hl;
  // (axX, axZ) : direction du segment ; cage : segment dans la cage ; front : segment devant la cage (d'une porte à l'autre)
  const cage = SP.cg[near.i] && SP.cg[near.i + 1],
    front = !cage && Math.abs(a[2] - b[2]) < 0.01;
  // joystick lâché : on reste où l'on est
  if (m < 0.2) {
    if (p.gl) {
      p.vx = p.vz = 0;
      return true;
    }
    return false;
  }
  const l = Math.hypot(tx, tz) || 1,
    along = (tx * axX + tz * axZ) / l;
  // hors de la cage (portes, devant la cage) : on n'est pris que si l'on pousse franchement dans l'axe
  if (!p.gl) {
    if (Math.abs(along) < (cage ? 0.5 : 0.75) || (!cage && near.d > 0.4)) return false;
    p.gl = along > 0 ? 1 : -1;
    p.glF = front;
  } else if (along * p.gl < -0.5) p.gl = -p.gl;
  // à un étage : tout droit en sortant de la cage = on descend du chemin ; tourné vers la porte suivante = on continue (le chemin longe la cage puis rentre)
  else if (!cage && !(p.glF && !front) && Math.abs(along) < 0.4) {
    p.gl = 0;
    return false;
  }
  if (cage) p.glF = false;
  else if (front) p.glF = true;
  // avancer le long du chemin ; l'écart au milieu des marches se résorbe (×10 par seconde)
  const s = near.s + p.gl * sp * m * dt;
  if (s <= 0.02 || s >= SP.tot - 0.02) {
    p.gl = 0;
    return false;
  }
  const from = spPos(near.s),
    to = spPos(s),
    keepOff = Math.max(0, 1 - dt * 10),
    x0 = p.x,
    z0 = p.z;
  p.x = to.x + (p.x - from.x) * keepOff;
  p.z = to.z + (p.z - from.z) * keepOff;
  p.y = to.y;
  p.vy = 0;
  p.ground = true;
  p.vx = (p.x - x0) / dt;
  p.vz = (p.z - z0) / dt;
  // la caméra suit les virages (doucement : on peut toujours regarder ailleurs)
  const segA = SP.P[to.i],
    segB = SP.P[to.i + 1],
    gx = (segB[0] - segA[0]) * p.gl,
    gz = (segB[2] - segA[2]) * p.gl;
  if (Math.hypot(gx, gz) > 0.05) {
    const yawTo = Math.atan2(-gx, -gz);
    let da = yawTo - p.yaw;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    p.yaw += da * Math.min(1, dt * 5);
  }
  return true;
}
// ---------------------------------------------------------------- les boutiques
// V3.5 : la boutique la plus proche (à 2,4 m, même étage), −1 sinon ; mode fuite seulement
const shopNear = S => {
  if (S.mode !== 'out') return -1;
  const p = S.p;
  for (let i = 0; i < SHOPS.length; i++) {
    const s = SHOPS[i];
    if (Math.abs(p.y - s.y) < 1.3 && Math.hypot(p.x - s.x, p.z - s.z) < 2.4) return i;
  }
  return -1;
};
