// [lobby/habitants.js] Les habitants du village : ils vont d'un bâtiment à l'autre par les chemins.
// ---- les habitants
const pnjDoor = B => {
  const R = rOf(B) + 1.5,
    a = B.r + (Math.random() - 0.5) * 0.7;
  return [B.x + Math.sin(a) * R, B.z + Math.cos(a) * R];
};
const pnjFree = (x, z) => {
  if (Math.hypot(x, z) > RI - 4.5 || hAt(x, z) < -0.5) return false;
  for (const B of save.vil) {
    if (CAT[B.t].pass) continue;
    if (Math.hypot(x - B.x, z - B.z) < Math.max(0.5, rOf(B) * (B.t === 'hall' ? 1 : 0.8)) + 1) return false;
  }
  for (const o of LOBS) if (Math.hypot(x - o[0], z - o[1]) < o[2] + 1) return false;
  for (const o of PAY.obs) if (Math.hypot(x - o[0], z - o[1]) < o[2] + 1) return false;
  return true;
};
// trajet d'un habitant : il rejoint le parvis le plus proche puis suit les chemins de parvis en parvis jusqu'à la porte visée
function pnjRoute(N, B) {
  const R = ROADS,
    nj = R.nodes.findIndex(q => q.b === B);
  let ni = -1,
    bd = 1e9;
  R.nodes.forEach((q, i) => {
    const d = Math.hypot(q.x - N.x, q.z - N.z);
    if (d < bd && !q.gate) {
      bd = d;
      ni = i;
    }
  });
  if (nj < 0 || ni < 0 || ni === nj) return [pnjDoor(B)];
  const prev = new Int16Array(R.nodes.length).fill(-1),
    Q = [ni];
  prev[ni] = ni;
  while (Q.length) {
    const i = Q.shift();
    if (i === nj) break;
    for (const j of R.adj[i])
      if (prev[j] < 0) {
        prev[j] = i;
        Q.push(j);
      }
  }
  if (prev[nj] < 0) return [pnjDoor(B)];
  const seq = [];
  for (let i = nj; i !== ni; i = prev[i]) seq.unshift([prev[i], i]);
  const pts = [];
  for (const [a, b] of seq) {
    const e = R.edges.find(e => (e.i === a && e.j === b) || (e.i === b && e.j === a));
    if (!e) continue;
    const j = (Math.random() - 0.5) * 2.4,
      vx = e.bx - e.ax,
      vz = e.bz - e.az,
      L = Math.hypot(vx, vz) || 1,
      ox = (-vz / L) * j,
      oz = (vx / L) * j;
    if (e.i === a) pts.push([e.ax + ox, e.az + oz], [e.bx + ox, e.bz + oz]);
    else pts.push([e.bx + ox, e.bz + oz], [e.ax + ox, e.az + oz]);
  }
  pts.push(pnjDoor(B));
  return pts;
}
function pnjGoal(N) {
  const role = save.vil.filter(B => CAT[B.t].up),
    home = role.find(B => B.id === N.home);
  if (N.an) {
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * 6.2832,
        r = 2 + Math.random() * 9,
        x = N.hx + Math.cos(a) * r,
        z = N.hz + Math.sin(a) * r;
      if (pnjFree(x, z)) return [x, z];
    }
    return [N.x, N.z];
  }
  if (!role.length) {
    const a = Math.random() * 6.2832,
      r = Math.random() * RI * 0.45;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }
  N.path = pnjRoute(N, home && Math.random() < 0.4 ? home : role[Math.floor(Math.random() * role.length)]);
  return N.path.shift();
}
function pnjMake() {
  const P = PAY,
    th = P.th,
    role = save.vil.filter(B => CAT[B.t].up);
  for (const N of P.pnj) P.root.remove(N.g);
  P.pnj = [];
  const mv = 'pnj.villageois',
    ma = 'pnj.animal';
  if (!payHas(mv)) return;
  const n = Math.min(12, 4 + role.length);
  for (let i = 0; i < n + 3; i++) {
    const an = i >= n;
    if (an && !payHas(ma)) break;
    const v = i % 3,
      g = an ? mdlOf(ma, { th }, 't' + th, { cast: false }) : mdlOf(mv, { th, v }, 't' + th + 'v' + v, { cast: false }),
      B = role.length ? role[i % role.length] : null,
      p = B ? pnjDoor(B) : [(hsh(i, 5) - 0.5) * 20, -10 + (hsh(i, 6) - 0.5) * 14];
    const N = {
      g,
      an,
      x: p[0],
      z: p[1],
      y: 0,
      tx: p[0],
      tz: p[1],
      wait: hsh(i, 7) * 5,
      w: 0,
      ry: hsh(i, 8) * 6.28,
      ph: i * 1.9,
      home: B ? B.id : -1,
      hx: p[0],
      hz: p[1],
      sp: an ? 2.1 : 1.25 + hsh(i, 9) * 0.5
    };
    N.y = hAt(N.x, N.z);
    P.root.add(g);
    P.pnj.push(N);
  }
}
function pnjTick(dt, t) {
  const P = PAY;
  for (const N of P.pnj) {
    const dp = Math.hypot(LB.x - N.x, LB.z - N.z);
    let face = null;
    if (!N.an && dp < 3.4 && LB.on) {
      N.wait = Math.max(N.wait, 0.6);
      face = [LB.x - N.x, LB.z - N.z];
    }
    if (N.wait > 0) {
      N.wait -= dt;
      N.w += (0 - N.w) * Math.min(1, dt * 8);
      if (N.wait <= 0) {
        const q = pnjGoal(N);
        N.tx = q[0];
        N.tz = q[1];
      }
    } else {
      let dx = N.tx - N.x,
        dz = N.tz - N.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.7 && N.path && N.path.length) {
        const q = N.path.shift();
        N.tx = q[0];
        N.tz = q[1];
        N.stuck = 0;
      } else if (d < 0.5 || (N.stuck || 0) > 3) {
        N.wait = N.an ? 1 + Math.random() * 3 : 2.5 + Math.random() * 7;
        N.stuck = 0;
        N.path = null;
      } else {
        dx /= d;
        dz /= d;
        let nx = N.x + dx * N.sp * dt,
          nz = N.z + dz * N.sp * dt;
        for (const B of save.vil) {
          const C = CAT[B.t];
          if (C.pass) continue;
          // la cathédrale du Hall et l'Arsenal occupent tout leur cercle (tours, abside, appentis) : les habitants en font le tour
          const br = Math.max(0.5, rOf(B) * (CAT[B.t].fix ? 1 : 0.8)) + 0.45,
            ex = nx - B.x,
            ez = nz - B.z,
            e = Math.hypot(ex, ez);
          if (e < br && e > 1e-3) {
            nx = B.x + (ex / e) * br + (-ez / e) * N.sp * dt * 0.8;
            nz = B.z + (ez / e) * br + (ex / e) * N.sp * dt * 0.8;
          }
        }
        for (const O of [LOBS, P.obs])
          for (const o of O) {
            const ex = nx - o[0],
              ez = nz - o[1],
              e = Math.hypot(ex, ez),
              br = o[2] + 0.5;
            if (e < br && e > 1e-3) {
              nx = o[0] + (ex / e) * br;
              nz = o[1] + (ez / e) * br;
            }
          }
        const r = Math.hypot(nx, nz);
        if (r > RI - 3.5) {
          nx *= (RI - 3.5) / r;
          nz *= (RI - 3.5) / r;
          N.stuck = (N.stuck || 0) + dt * 2;
        }
        const mx = nx - N.x,
          mz = nz - N.z,
          mv = Math.hypot(mx, mz);
        N.stuck = Math.max(
          0,
          (N.stuck || 0) + (mv < N.sp * dt * 0.45 || mx * dx + mz * dz < mv * 0.2 ? dt : -dt * 0.5)
        );
        N.x = nx;
        N.z = nz;
        face = mv > 1e-4 ? [mx, mz] : [dx, dz];
        N.w += (1 - N.w) * Math.min(1, dt * 6);
      }
    }
    N.y += (walkAt(N.x, N.z, N.y) - N.y) * Math.min(1, dt * 12);
    if (face) {
      let da = Math.atan2(-face[0], -face[1]) - N.ry;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      N.ry += da * Math.min(1, dt * 7);
    }
    N.g.position.set(N.x, N.y, N.z);
    N.g.rotation.y = N.ry;
    N.g.visible = dp < 60;
    if (N.g.visible) K.pose(N.g, t, N.ph, N.an ? 0.35 + 0.65 * N.w : N.w);
  }
}
