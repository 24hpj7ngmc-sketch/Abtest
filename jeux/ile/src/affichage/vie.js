// [affichage/vie.js] La vie du décor et des vues, appelée à chaque image par la boucle (worldTick, skyTick, viewsTick).
// ---------- vie du décor et des vues : appelé à chaque image par la boucle ----------
function worldTick(dt, now) {
  const t = now / 1000;
  seaU.t.value = t;
  clouds.rotation.y += dt * 0.006;
  coreGlow.scale.setScalar(8.5 + Math.sin(now / 400) * 1.2 + coreHit * 6);
  if (coreHit > 0) coreHit = Math.max(0, coreHit - dt);
  if (coreN.crystal) {
    coreM.rotation.y += dt * 0.8;
    coreM.position.y = coreY + Math.sin(now / 600) * 0.3;
    coreM.scale.setScalar(1 + coreHit * 0.45);
    coreMat.emissive.setHex(coreHit > 0 ? 0xb02a2a : 0x0b3f4c);
  }
  for (const g of live) K.pose(g, t, 0, 1);
  portals.forEach((p, pi) => {
    const on = sim && sim.phase === 'wave' && sim.queue.length ? 1 : 0,
      P = boatAt(pi, sim ? sim.t : t),
      ry = Math.atan2(-Math.sin(P[2]), Math.cos(P[2])); // cap : la tangente au cercle qu'il décrit
    p.on += (on - p.on) * Math.min(1, dt * 4);
    p.gl.scale.setScalar(5 + p.on * 7 + Math.sin(now / 260) * 0.6);
    p.v.position.set(P[0], -1.3 + Math.sin(t * 0.8 + p.ph) * 0.22, P[1]);
    p.v.rotation.set(Math.sin(t * 0.6 + p.ph) * 0.025, ry, Math.sin(t * 0.9 + p.ph + 1) * 0.04);
    p.fo.position.set(P[0], -1.26, P[1]);
    p.fo.rotation.z = ry;
    const k = 1 + Math.sin(t * 1.3 + p.ph) * 0.05;
    p.fo.scale.set(4.6 * k, 12.6 * k, 1);
  });
  for (const q of gulls) {
    const a = q.ph + t * q.sp,
      g = q.g;
    g.position.set(q.cx + Math.cos(a) * q.R, q.y + Math.sin(t * 0.5 + q.ph) * 1.5, q.cz + Math.sin(a) * q.R);
    g.rotation.set(0, (q.sp > 0 ? 0 : Math.PI) - a, q.sp > 0 ? -0.3 : 0.3);
    K.pose(g, t, q.ph, 0.3 + 0.7 * Math.max(0, Math.sin(t * 0.45 + q.ph)));
  }
  if (boat) {
    boat.position.y = -1.3 + Math.sin(t * 1.1) * 0.06;
    boat.rotation.set(Math.sin(t * 0.9) * 0.04, boat.userData.ry, Math.sin(t * 1.3 + 1) * 0.05);
  }
  {
    const hx = camera.position.x,
      hz = camera.position.z,
      W = 34,
      im = motes.im;
    for (let i = 0; i < motes.n; i++) {
      const b = motes.b[i],
        x = ((((b[0] + t * 0.35 * Math.cos(b[3]) - hx) % W) + W) % W) - W / 2 + hx,
        z = ((((b[2] + t * 0.35 * Math.sin(b[3]) - hz) % W) + W) % W) - W / 2 + hz;
      DUM.position.set(x, 0.5 + b[1] + Math.sin(t * 0.6 + b[3]) * 0.4, z);
      DUM.rotation.set(t * b[4], t * 0.7, 0);
      DUM.scale.setScalar(b[4] * (0.7 + 0.3 * Math.sin(t * 2 + b[3] * 3)));
      DUM.updateMatrix();
      im.setMatrixAt(i, DUM.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }
}
function skyTick() {
  sky.position.set(camera.position.x, camera.position.y, camera.position.z);
  const hp = sim && running ? sim.hero : null,
    tx = hp ? hp.x : 0,
    tz = hp ? hp.z : 0;
  sun.target.position.set(tx, 0, tz);
  sun.position.set(tx + SUN.x * 200, SUN.y * 200, tz + SUN.z * 200);
}
const SHOTM = { mortier: 'shot.bomb', canon: 'shot.ball', archer: 'shot.arrow' };
function viewsTick(dt, now, h) {
  if (ghost.visible) ghostSet(placeType, elOf(h));
  sync(views.ru, sim.ruins || [], ruinView, () => {});
  sync(views.t, sim.towers, towerGroup, (t, v) => {
    const u = v.userData;
    if (t.maxHp) {
      if (!u.hpB) {
        u.hpB = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: hpTex(), color: 0x7ddc8a, depthTest: false, transparent: true })
        );
        u.hpB.position.y = u.signY ? u.signY - 9.9 : 3.4;
        u.hpB.renderOrder = 5;
        v.add(u.hpB);
      }
      const k = Math.max(0.03, Math.min(1, t.hp / t.maxHp));
      u.hpB.scale.set(3 * k, 0.34, 1);
      u.hpB.material.color.setHex(k < 0.35 ? 0xff5a4a : k < 0.7 ? 0xffcf5a : 0x7ddc8a);
    } // barre de vie d'une défense de renfort
    if (u.lvl !== t.els.length) {
      const n = towerGroup(t);
      scene.remove(v);
      u.kill();
      n.userData.age = 0.12;
      n.userData.fresh = false;
      upFx(t, true);
      return n;
    }
    if (u.auto !== !!t.auto) {
      u.auto = !!t.auto;
      v.remove(u.sign);
      u.sign.userData.tex.dispose();
      u.sign.material.dispose();
      u.sign = towerSign(t);
      u.sign.position.y = u.signY;
      v.add(u.sign);
    }
    animTower(t, v, dt);
  });
  fired = {};
  newT = 0;
  sync(views.e, sim.enemies, enemyView, (e, v) => animEnemy(e, v, dt));
  dying = dying.filter(q => {
    q.t += dt;
    const u = q.t / 0.26;
    if (u >= 1) {
      scene.remove(q.v);
      return false;
    }
    q.v.scale.setScalar((1 + 0.5 * u) * (1 - u * u * u));
    q.v.position.y += dt * 2.2;
    q.v.rotation.y += dt * 9;
    return true;
  });
  sync(
    views.o,
    Object.keys(sim.others).map(k => sim.others[k]),
    mateView,
    (o, v) => mateTick(o, v, dt)
  );
  {
    const wk = sim.fv + '|' + sim.walls.length;
    if (wk !== wallK) {
      wallK = wk;
      wallL = sim.walls.map(i => ({ id: i }));
    }
  }
  sync(views.w, wallL, wallView, (w, v) => wallTick(w, v, dt)); // la liste des murs n'est refaite que quand un mur change
  {
    const ob = sim.obj;
    objG.visible = !!ob && ob.k !== 'bomb';
    if (objG.visible) {
      const zr = ob.k === 'zone' ? BAL.zoneR : 1.3;
      objG.position.set(ob.x, 0, ob.z);
      objRing.scale.set(zr, zr, 1);
      objCol.scale.set(ob.k === 'zone' ? zr : 0.45, 1, ob.k === 'zone' ? zr : 0.45);
      objGem.visible = ob.k === 'relic';
      objGem.position.y = (ob.car ? 2.7 : 1.4) + Math.sin(now / 300) * 0.2;
      objGem.rotation.y += dt * 2;
    }
  }
  sync(views.pu, sim.pups, pupView, (p, v) => pupTick(p, v, now));
  sync(
    views.st,
    sim.storms.map(st => ({ id: Math.round(st.x) * 1000 + Math.round(st.z), x: st.x, z: st.z, r: st.r || BAL.stormR })),
    stormView,
    (st, v) => {
      v.position.set(st.x, 0, st.z);
      v.children[0].scale.set(st.r * 0.8, 1, st.r * 0.8);
      v.children[1].scale.set(st.r, st.r, 1);
      v.children[0].rotation.y += dt * 0.6;
    }
  );
  if (pitFv !== sim.fv) drawPits();
  sync(views.z, sim.zones, zoneView, (z, v) => animZone(z, v, dt));
  sync(
    views.s,
    sim.shots,
    b => {
      const m = new THREE.Mesh(shotG, elBasic[b.el]),
        s = new THREE.Sprite(glowE[b.el]);
      m.userData.gs = 1.7 + Math.min(5, b.ug || 0) * 0.32; // V2.0 : plus l'arme est améliorée, plus la balle brille
      s.scale.setScalar(m.userData.gs);
      m.add(s);
      scene.add(m);
      if (!b.q) SND.at('shot', b.x, b.z, b.mine ? tWeap : b.l0 ? 'pompe' : 'fusil');
      if (b.l0) m.scale.setScalar(0.55);
      return m;
    },
    (b, v) => {
      v.position.set(b.x, b.y, b.z);
      // près de la caméra, le halo de nos propres balles reste petit : avec cadence et tirs multiples, il faisait une tache au viseur (audit écran n° 10)
      if (b.mine) {
        const d = Math.hypot(b.x - camera.position.x, b.y - camera.position.y, b.z - camera.position.z);
        v.children[0].scale.setScalar(v.userData.gs * Math.min(1, 0.2 + d / 14));
      }
    }
  );
  // projectiles des défenses : ils partent de la bouche du tube, la bombe en cloche, le boulet et le carreau tout droit
  sync(
    views.b,
    sim.bombs,
    b => {
      const pu = pureOf(b.els),
        el = pu || b.els[0],
        m = mdlOf(SHOTM[b.type] || 'shot.ball', elCtx(el), el, { cast: false }),
        tw = twAt.get(Math.round(b.x0 * 10) + '_' + Math.round(b.z0 * 10)),
        u = m.userData;
      if (pu) {
        const s = new THREE.Sprite(glowE[pu]);
        s.scale.setScalar(b.type === 'archer' ? 1.3 : 2.2);
        m.add(s);
        m.scale.multiplyScalar(b.type === 'mortier' ? 1.4 : 1.25);
      }
      u.pu = pu;
      u.p0 = tw ? muzzleOf(tw, Math.atan2(b.tx - b.x0, b.tz - b.z0)) : [b.x0, b.h0, b.z0];
      u.sp = [Math.random() * 8 - 4, Math.random() * 8 - 4];
      m.visible = false;
      scene.add(m);
      return m;
    },
    (b, v) => {
      const u = Math.max(0, b.u),
        arc = b.type === 'mortier',
        ty = arc ? 0.3 : 1.1,
        p = v.userData.p0;
      v.visible = b.u >= 0;
      v.position.set(
        p[0] + (b.tx - p[0]) * u,
        p[1] + (ty - p[1]) * u + (arc ? 28 * u * (1 - u) : 0),
        p[2] + (b.tz - p[2]) * u
      );
      if (b.type === 'archer') v.lookAt(b.tx, ty, b.tz);
      else {
        v.rotation.x += dt * v.userData.sp[0];
        v.rotation.z += dt * v.userData.sp[1];
      }
      if (v.userData.pu && b.u > 0 && Math.random() < dt * 45)
        burst(v.position.x, v.position.y, v.position.z, v.userData.pu, 1, 0.12);
    }
  );
  parts = parts.filter(p => {
    p.t += dt;
    if (p.t >= p.life) {
      scene.remove(p.m);
      return false;
    }
    const m = p.m.position,
      u = p.t / p.life;
    if (p.g) p.vy -= p.g * dt;
    m.x += p.vx * dt;
    m.y += p.vy * dt;
    m.z += p.vz * dt;
    if (p.g && m.y < (p.fl === undefined ? 0.15 : p.fl)) {
      if (p.fl !== undefined && p.fl < -50) {
      } else {
        m.y = p.fl === undefined ? 0.15 : p.fl;
        p.vy *= -0.4;
      }
    }
    p.m.scale.setScalar(p.puff ? p.s * (0.35 + 0.65 * u) * (u < 0.7 ? 1 : (1 - u) / 0.3) + 0.02 : p.s * (1 - u) + 0.02);
    return true;
  });
  beams = beams.filter(b => {
    b.t += dt;
    const u = b.t / b.dur;
    if (u >= 1) {
      scene.remove(b.m);
      b.m.material.dispose();
      return false;
    }
    const s = b.w * (1 - u * u) * (1 + 0.25 * Math.sin(u * 34));
    b.m.scale.set(s, 1, s);
    b.m.material.opacity = 0.85 * (1 - u);
    return true;
  });
  fx = fx.filter(f => {
    f.t += dt;
    const u = f.t / f.dur;
    if (u >= 1) {
      scene.remove(f.m);
      return false;
    }
    f.m.scale.setScalar(0.3 + f.r * u);
    f.m.material.opacity = 1 - u;
    return true;
  });
  // le marchand suit le joueur du regard ; une étoile dorée flotte au-dessus de lui quand il reste des points à dépenser
  npc.rotation.y = Math.atan2(h.x - npc.position.x, h.z - npc.position.z);
  shopGlow.visible = running && sim.pts > 0;
  shopGlow.position.y = 5 + Math.sin(now / 300) * 0.2;
}
