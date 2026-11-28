// ===================== DERNIER TOIT — l'affichage : les tirs du joueur (dessin seulement : les règles sont dans regles/) =====================
// Un tir ('shot') : recul de l'arme ; fusil, pistolet, assaut, sniper : éclair de bouche, traçante, sang ou poussière à l'impact ;
// Fusil à pompe : gros éclair, fumée, la pompe qui recule et revient, une traçante fine par plomb ('pellet') ;
// Lance-flammes : jet de flammes de la buse au point visé (12 tics par seconde), flammes écrasées sur les murs, veilleuse qui vacille.
// Rien n'est créé pendant une image : tout va dans les réserves de particules communes (fire, spark, smoke, pdust, dust, blood) et les traçantes,
// avec un plafond ici ; aucune lumière ajoutée (la lueur de la buse est l'éclair de bouche G.vmFlash, teinté orange).
// Attend des règles : les événements 'shot' (w, x, y, z, hit, kill, flame) et 'pellet' (x, y, z, hit), WEAP (kick, range), eyeP, viewDir.
// Fournit : tirEvent et pelletFx (gfxEvent), gunFx (gfxFrame) ; flameTic et gunFx sont lus par tests/armes2.js.

// un tir du joueur
function tirEvent(ev, S) {
  G.recoil = (WEAP[ev.w] || WEAP.fusil).kick;
  // le lance-flammes n'a ni éclair de bouche, ni traçante, ni impact de balle (voir flameTic)
  if (ev.flame) flameTic(ev, S);
  // le fusil à pompe (gros éclair, fumée, la pompe) ; ses plombs arrivent par 'pellet'
  else if (ev.w === 'pompe') pompeShot(ev, S);
  else {
    G.vmFlash.visible = true;
    G.vmFlashT = ev.w === 'sniper' ? 0.07 : 0.045;
    G.vmFlash.scale.setScalar(1);
    G.vmFlash.material.color.setHex(0xffd070);
    const p = S.p,
      d = viewDir(p),
      e = eyeP(p),
      o = [e[0] + Math.cos(p.yaw) * 0.18, e[1] - 0.16, e[2] - Math.sin(p.yaw) * 0.18];
    G.tr.push({ x0: o[0] + d[0] * 0.8, y0: o[1] + d[1] * 0.8, z0: o[2] + d[2] * 0.8, x1: ev.x, y1: ev.y, z1: ev.z, t: 0 });
    if (ev.hit) bloodBurst(ev.x, ev.y, ev.z, ev.kill ? 10 : 4, false);
    else
      for (let i = 0; i < 4; i++)
        emit('dust', ev.x, ev.y + 0.05, ev.z, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0.4, 0.07, 0.02);
  }
}
// bout du canon de l'arme en main, dans le monde (une fois par image) ; sans arme visible : devant l'épaule droite, comme les traçantes
function gunTipW(S) {
  if (G.tipW && G.tipWf === G.fr) return G.tipW;
  G.tipWf = G.fr;
  const k = G.vmCur,
    vm = G.vm[k],
    t = G.tip[k];
  if (vm && t && G.gun[k] && vm.visible) {
    camera.updateMatrixWorld(true);
    G.v3.set(t[0], t[1], t[2]).applyMatrix4(vm.matrixWorld);
    G.tipW = [G.v3.x, G.v3.y, G.v3.z];
  } else {
    const p = S.p,
      d = viewDir(p),
      e = eyeP(p);
    G.tipW = [e[0] + Math.cos(p.yaw) * 0.18 + d[0] * 0.8, e[1] - 0.16 + d[1] * 0.8, e[2] - Math.sin(p.yaw) * 0.18 + d[2] * 0.8];
  }
  return G.tipW;
}
// un coup de fusil à pompe : gros éclair étiré, étincelles et fumée claire à la bouche, petite secousse ; la pompe part (gunFx)
function pompeShot(ev, S) {
  const R = Math.random,
    o = gunTipW(S),
    d = viewDir(S.p);
  G.vmFlash.visible = true;
  G.vmFlashT = 0.06;
  G.vmFlash.scale.set(1.7, 1.7, 2.4);
  G.vmFlash.rotation.z = R() * 6.28;
  G.vmFlash.material.color.setHex(0xffc464);
  G.pump.t = 0;
  G.shake = Math.max(G.shake, 0.16);
  for (let i = 0; i < 5; i++) {
    const v = 3 + R() * 4;
    emit(
      'fire',
      o[0] + d[0] * 0.06,
      o[1] + d[1] * 0.06,
      o[2] + d[2] * 0.06,
      d[0] * v + (R() - 0.5) * 1.6,
      d[1] * v + (R() - 0.5) * 1.6,
      d[2] * v + (R() - 0.5) * 1.6,
      0.05 + R() * 0.04,
      0.035,
      0.09 + R() * 0.04
    );
  }
  for (let i = 0; i < 5; i++) {
    const v = 5 + R() * 7;
    emit(
      'spark',
      o[0] + d[0] * 0.05,
      o[1] + d[1] * 0.05,
      o[2] + d[2] * 0.05,
      d[0] * v + (R() - 0.5) * 2.5,
      d[1] * v + (R() - 0.5) * 2.5 + 0.5,
      d[2] * v + (R() - 0.5) * 2.5,
      0.07 + R() * 0.05,
      0.022,
      0.006
    );
  }
  for (let i = 0; i < 2; i++) {
    const v = 0.8 + R() * 1.2;
    emit(
      'pdust',
      o[0] + d[0] * 0.15,
      o[1] + d[1] * 0.15,
      o[2] + d[2] * 0.15,
      d[0] * v + (R() - 0.5) * 0.3,
      d[1] * v + 0.3 + R() * 0.3,
      d[2] * v + (R() - 0.5) * 0.3,
      0.5 + R() * 0.3,
      0.03,
      0.12 + R() * 0.05
    );
  }
}
// un plomb : traçante fine depuis la bouche ; touché = un peu de sang, sinon poussière et une étincelle renvoyées vers le tireur (rien pour un plomb perdu en l'air)
function pelletFx(ev, S) {
  const R = Math.random,
    o = gunTipW(S),
    dx = ev.x - o[0],
    dy = ev.y - o[1],
    dz = ev.z - o[2],
    l = Math.hypot(dx, dy, dz) || 1,
    e = eyeP(S.p);
  if (G.tr.length < 220)
    G.tr.push({
      x0: o[0] + (dx / l) * 0.4,
      y0: o[1] + (dy / l) * 0.4,
      z0: o[2] + (dz / l) * 0.4,
      x1: ev.x,
      y1: ev.y,
      z1: ev.z,
      t: 0,
      w: 0.016
    });
  if (ev.hit) {
    bloodBurst(ev.x, ev.y, ev.z, 3, false);
    return;
  }
  if (Math.hypot(ev.x - e[0], ev.y - e[1], ev.z - e[2]) > WEAP.pompe.range - 0.3) return;
  const fl = floorY(ev.x, ev.y, ev.z),
    nx = -dx / l,
    nz = -dz / l;
  for (let i = 0; i < 2; i++)
    emit(
      'dust',
      ev.x,
      ev.y + 0.03,
      ev.z,
      nx * 1.2 + (R() - 0.5) * 1.6,
      0.8 + R() * 1.5,
      nz * 1.2 + (R() - 0.5) * 1.6,
      0.3 + R() * 0.15,
      0.05,
      0.015,
      fl
    );
  if (R() < 0.6)
    emit(
      'spark',
      ev.x,
      ev.y + 0.02,
      ev.z,
      nx * 2.5 + (R() - 0.5) * 3,
      1 + R() * 2,
      nz * 2.5 + (R() - 0.5) * 3,
      0.16 + R() * 0.1,
      0.03,
      0.006,
      fl
    );
}
// un tic du lance-flammes (12 par seconde) : longueur du jet (mur, plancher, ou 10 m ; la rue l'arrête aussi), le jet reste allumé 0,13 s ;
// s'il bute sur une surface, les flammes s'y écrasent et s'étalent, avec une lueur de temps en temps
function flameTic(ev, S) {
  const jet = G.fl,
    R = Math.random,
    e = eyeP(S.p),
    d = viewDir(S.p);
  let L = Math.hypot(ev.x - e[0], ev.y - e[1], ev.z - e[2]);
  if (d[1] < -0.01) L = Math.min(L, (e[1] - 0.02) / -d[1]);
  jet.L = Math.max(0.5, L);
  jet.wall = L < WEAP.lance.range - 0.15 ? 1 : 0;
  jet.t = 0.13;
  jet.n++;
  if (!jet.wall) return;
  const x = e[0] + d[0] * L,
    y = e[1] + d[1] * L,
    z = e[2] + d[2] * L,
    // k : tout est plus petit quand le mur est tout près
    k = Math.min(1, L / 8);
  for (let i = 0; i < 2; i++) {
    const a = R() * 6.283,
      v = (0.6 + R() * 1.6) * (0.4 + k);
    emit(
      'fire',
      x - d[0] * 0.15,
      y - d[1] * 0.15 + 0.05,
      z - d[2] * 0.15,
      Math.cos(a) * v - d[0] * 0.5,
      (0.4 + R() * 1.2) * (0.5 + k * 0.5),
      Math.sin(a) * v - d[2] * 0.5,
      0.28 + R() * 0.18,
      0.06 + 0.2 * k,
      0.14 + 0.36 * k
    );
  }
  // de temps en temps de la fumée (tout près : fumée claire et transparente), et une lueur
  if (jet.n % 3 === 0 && R() < 0.7)
    emit(
      L < 6 ? 'pdust' : 'smoke',
      x - d[0] * 0.3,
      y + 0.2,
      z - d[2] * 0.3,
      (R() - 0.5) * 0.5,
      0.8 + R() * 0.6,
      (R() - 0.5) * 0.5,
      0.9 + R() * 0.4,
      0.08 + 0.08 * k,
      0.25 + 0.35 * k
    );
  if (jet.n % 4 === 0) flashAt(x - d[0] * 0.3, y - d[1] * 0.3 + 0.1, z - d[2] * 0.3, 0.15 + 0.4 * k, 0xff7a2e, 0.14);
}
// à chaque image, après la pose de l'arme : la pompe (le garde-main recule de 0,14 à 0,30 s, tient, revient de 0,34 à 0,48 s ; l'arme penche un peu),
// la veilleuse qui vacille, et le jet tant que les tics arrivent : de la buse vers le point visé (œil + regard × longueur du dernier tic),
// flammes qui grossissent et s'écartent en route (cône), cœur jaune près de la buse, langue de feu et fumée au bout. Au plus ~45 particules à la fois.
function gunFx(S, dt, vm) {
  G.fr++;
  const R = Math.random,
    jet = G.fl;
  if (G.pump.t < 1) G.pump.t += dt;
  if (vm && G.vmCur === 'pompe') {
    const nd = vm.userData.nodes.pompe,
      u = G.pump.t,
      course = (vm.userData.prep && vm.userData.prep.pump) || 0.085;
    let recul = 0;
    if (u > 0.14 && u < 0.3) recul = ease((u - 0.14) / 0.16);
    else if (u >= 0.3 && u < 0.34) recul = 1;
    else if (u >= 0.34 && u < 0.48) recul = 1 - ease((u - 0.34) / 0.14);
    if (nd) nd.position.z = recul * course;
    vm.rotation.z += recul * 0.06;
    vm.rotation.x += recul * 0.03;
    vm.position.y -= recul * 0.006;
  }
  if (vm && G.vmCur === 'lance') {
    const nd = vm.userData.nodes.veil;
    if (nd) {
      const f = jet.t > 0 ? 1.25 + R() * 0.2 : 0.82 + 0.16 * Math.sin(G.time * 19) + 0.1 * Math.sin(G.time * 31.7) + R() * 0.14;
      nd.scale.set(f, f * (0.85 + R() * 0.35), f);
      nd.rotation.x = (R() - 0.5) * 0.3;
    }
  }
  if (jet.t <= 0) return;
  jet.t -= dt;
  const d = viewDir(S.p),
    o = gunTipW(S),
    ex = G.eye[0] + d[0] * jet.L,
    ey = G.eye[1] + d[1] * jet.L,
    ez = G.eye[2] + d[2] * jet.L;
  let jx = ex - o[0],
    jy = ey - o[1],
    jz = ez - o[2];
  const L = Math.hypot(jx, jy, jz) || 1;
  jx /= L;
  jy /= L;
  jz /= L;
  G.vmFlash.visible = true;
  G.vmFlashT = 0.05;
  G.vmFlash.material.color.setHex(0xff7a26);
  const fs = 1.2 + R() * 0.6;
  G.vmFlash.scale.set(fs, fs, fs * 1.7);
  const TL = 0.3,
    W = Math.min(0.75, L * 0.07);
  jet.acc += dt * 170;
  let n = Math.min(10, Math.floor(jet.acc));
  jet.acc -= n;
  if (G.P.fire.cap - G.P.fire.n < 150) n = 0; // on laisse toujours de la place aux autres feux
  for (let i = 0; i < n; i++) {
    const u = Math.pow(R(), 1.25) * 0.95,
      T = TL * (1 - u) + 0.03,
      v = (L / TL) * (0.92 + R() * 0.16),
      qx = R() - 0.5,
      qy = R() - 0.5,
      qz = R() - 0.5,
      w = W * 2 * (0.6 + R() * 0.5);
    emit(
      'fire',
      o[0] + jx * u * L + qx * w * u,
      o[1] + jy * u * L + qy * w * u,
      o[2] + jz * u * L + qz * w * u,
      jx * v + (qx * w) / TL,
      jy * v + (qy * w) / TL,
      jz * v + (qz * w) / TL,
      T,
      0.045 + 0.042 * u * L,
      0.07 + 0.042 * L * (0.85 + R() * 0.3)
    );
  }
  jet.acs += dt * 60;
  const m = Math.min(4, Math.floor(jet.acs));
  jet.acs -= m;
  for (let i = 0; i < m; i++) {
    const u = R() * 0.2,
      v = L / TL;
    emit(
      'spark',
      o[0] + jx * u * L,
      o[1] + jy * u * L,
      o[2] + jz * u * L,
      jx * v,
      jy * v,
      jz * v,
      0.04 + R() * 0.03,
      0.035 + 0.03 * u * L,
      0.06 + 0.03 * L * 0.25
    );
  }
  if (jet.wall) return;
  if (R() < dt * 30)
    emit(
      'fire',
      ex + (R() - 0.5) * W,
      ey + (R() - 0.5) * W * 0.6,
      ez + (R() - 0.5) * W,
      jx * 2 + (R() - 0.5) * 1.5,
      1.2 + R() * 1.5,
      jz * 2 + (R() - 0.5) * 1.5,
      0.25 + R() * 0.2,
      0.3,
      0.5
    );
  if (R() < dt * 7)
    emit(
      'smoke',
      ex + (R() - 0.5) * W,
      ey + 0.3,
      ez + (R() - 0.5) * W,
      (R() - 0.5) * 0.6,
      1 + R() * 0.8,
      (R() - 0.5) * 0.6,
      1 + R() * 0.5,
      0.15,
      0.55 + R() * 0.3
    );
}
