// [affichage/effets.js] Effets : gerbes, flammes, éclaboussures, canons, fumée, zones au sol, coéquipiers ; sync() aligne les vues sur l'état de la partie.
// étincelles : des points de lumière qui jaillissent, retombent et rebondissent
function burst(x, y, z, el, n, pw) {
  for (let i = 0; i < n && parts.length < 150; i++) {
    const m = new THREE.Sprite(glowE[el]);
    m.position.set(x, y, z);
    m.scale.setScalar(0.8);
    scene.add(m);
    const a = Math.random() * 6.283,
      sp = (2 + Math.random() * 4) * pw;
    parts.push({
      m,
      vx: Math.cos(a) * sp,
      vy: (3 + Math.random() * 5) * pw,
      vz: Math.sin(a) * sp,
      t: 0,
      life: 0.5 + Math.random() * 0.4,
      s: 0.8,
      g: 18
    });
  }
}
// le jet du lance-flammes (événement 'flame', douze par seconde) : quatre flammes par tic, de la bouche vers le bout de la portée
const flameM = [glowM(0xffc04a, 0.85), glowM(0xff7a22, 0.8), glowM(0xff4a12, 0.65)],
  FV = new THREE.Vector3();
function flameFx(ev) {
  const R = Math.random,
    sp = 22;
  let x0 = ev.x + ev.dx * 0.9,
    y0 = ev.y + ev.dy * 0.9,
    z0 = ev.z + ev.dz * 0.9;
  if (ev.m && gun.visible) {
    tip.getWorldPosition(FV);
    x0 = FV.x;
    y0 = FV.y;
    z0 = FV.z;
  } // son propre jet part du bout du canon, pas du milieu de l'écran
  const tx = ev.x + ev.dx * ev.r,
    ty = ev.y + ev.dy * ev.r,
    tz = ev.z + ev.dz * ev.r,
    L = Math.hypot(tx - x0, ty - y0, tz - z0) || 1,
    ux = (tx - x0) / L,
    uy = (ty - y0) / L,
    uz = (tz - z0) / L;
  for (let i = 0; i < 4 && parts.length < 150; i++) {
    const m = new THREE.Sprite(flameM[i % 3]),
      j = 0.24;
    m.position.set(x0, y0, z0);
    m.scale.setScalar(0.05);
    scene.add(m);
    parts.push({
      m,
      vx: (ux + (R() - 0.5) * j) * sp,
      vy: (uy + (R() - 0.5) * j) * sp + 0.8,
      vz: (uz + (R() - 0.5) * j) * sp,
      t: 0,
      life: (L / sp) * (0.75 + R() * 0.45),
      s: 1.3 + R() * 1.5,
      puff: 1
    });
  }
}
// éclair de bouche d'une défense, et bouffée de fumée qui monte en gonflant
const flashMat = {},
  smokeM = new THREE.SpriteMaterial({
    map: glowT,
    color: 0x8d9296,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });
for (const e of ELS) flashMat[e] = glowM(K.hex(K.mix(K.EL[e].glow, 0xfff0c0, 0.5)), 0.95);
// éclaboussures : gouttes blanches qui retombent dans l'eau, et un rond d'écume qui s'élargit à la surface
const splM = glowM(0xe6f8ff, 0.9);
let canToastW = 0;
function splash(x, z, n, pw) {
  if (n >= 6 && typeof SND !== 'undefined') SND.at('splash', x, z);
  for (let i = 0; i < n && parts.length < 150; i++) {
    const m = new THREE.Sprite(splM);
    m.position.set(x, -1.2, z);
    m.scale.setScalar(0.55);
    scene.add(m);
    const a = Math.random() * 6.283,
      sp = (1 + Math.random() * 2.6) * pw;
    parts.push({
      m,
      vx: Math.cos(a) * sp,
      vy: (3.5 + Math.random() * 4) * pw,
      vz: Math.sin(a) * sp,
      t: 0,
      life: 0.45 + Math.random() * 0.35,
      s: 0.55,
      g: 18,
      fl: -1.3
    });
  }
  if (fx.length < 60) {
    const m = new THREE.Mesh(
      ringG,
      new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, -1.24, z);
    scene.add(m);
    fx.push({ m, r: 1.2 + pw * 1.6, t: 0, dur: 0.55 });
  }
}
// coup de canon d'un navire : éclair et fumée à bord, boulet en cloche, puis l'impact sur la défense
function cannonFx(ev) {
  const l = Math.hypot(ev.bx, ev.bz) || 1,
    x0 = ev.bx - (ev.bx / l) * 9,
    z0 = ev.bz - (ev.bz / l) * 9,
    T = 0.75,
    y1 = (ev.y || 0) + 2.2;
  flash(x0, 3.2, z0, 7, 'feu');
  smoke(x0, 3.4, z0, 5);
  if (typeof SND !== 'undefined') SND.at('cannon', x0, z0);
  if (parts.length < 170) {
    const m = new THREE.Sprite(flashMat.feu);
    m.position.set(x0, 3, z0);
    scene.add(m);
    parts.push({
      m,
      vx: (ev.x - x0) / T,
      vy: (y1 - 3) / T + 9 * T,
      vz: (ev.z - z0) / T,
      t: 0,
      life: T,
      s: 1.5,
      g: 18,
      fl: -99
    });
  }
  setTimeout(() => {
    if (!sim || sim.over) return;
    ringFx(ev.x, ev.z, 5, 'feu', 0.5);
    burst(ev.x, y1, ev.z, 'feu', 12, 1.3);
    smoke(ev.x, y1, ev.z, 5);
    if (typeof SND !== 'undefined') SND.at('stone', ev.x, ev.z);
    if (Math.hypot(camera.position.x - ev.x, camera.position.z - ev.z) < 26) shake = Math.max(shake, 0.3);
  }, T * 1000);
}
function flash(x, y, z, s, el) {
  if (parts.length > 170) return;
  const m = new THREE.Sprite(flashMat[el] || flashMat.feu);
  m.position.set(x, y, z);
  scene.add(m);
  parts.push({ m, vx: 0, vy: 0, vz: 0, t: 0, life: 0.11, s, g: 0 });
}
function smoke(x, y, z, n) {
  for (let i = 0; i < n && parts.length < 170; i++) {
    const m = new THREE.Sprite(smokeM);
    m.position.set(x + (Math.random() - 0.5) * 0.4, y + (Math.random() - 0.5) * 0.3, z + (Math.random() - 0.5) * 0.4);
    scene.add(m);
    parts.push({
      m,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1 + Math.random() * 0.9,
      vz: (Math.random() - 0.5) * 0.8,
      t: 0,
      life: 0.7 + Math.random() * 0.5,
      s: 1.5 + Math.random(),
      g: 0,
      puff: 1
    });
  }
}
// zones au sol : brasier, flaque, ronces, cratère, champ d'orage
const zDiscG = new THREE.CircleGeometry(1, 30),
  zRimG = new THREE.TorusGeometry(1, 0.09, 6, 30),
  ZCOL = { feu: 0xff7a2e, eau: 0x3fa9ff, bois: 0x2f7d3a, terre: 0x3d2c1e, elec: 0xffe45c, vent: 0x8fe6dc };
function zoneView(z) {
  const g = new THREE.Group(),
    dm = new THREE.MeshBasicMaterial({
      color: z.foe ? 0xd4281c : ZCOL[z.el],
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    }),
    rm = new THREE.MeshBasicMaterial({
      color: z.foe ? 0x3a0a0a : z.el === 'terre' ? 0x8a6a44 : ZCOL[z.el], // flammes ennemies (Incendiaire) : rouge sombre cerclé de noir
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
  const d = new THREE.Mesh(zDiscG, dm);
  d.rotation.x = -Math.PI / 2;
  d.position.y = 0.09;
  g.add(d);
  const r = new THREE.Mesh(zRimG, rm);
  r.rotation.x = Math.PI / 2;
  r.position.y = z.el === 'terre' ? 0.22 : 0.1;
  if (z.el === 'terre') r.scale.z = 3;
  g.add(r);
  g.position.set(z.x, 0, z.z);
  g.userData = {
    dm,
    rm,
    kill: () => {
      dm.dispose();
      rm.dispose();
    }
  };
  scene.add(g);
  return g;
}
function animZone(z, v, dt) {
  const u = v.userData,
    life = Math.min(1, z.t / 0.6),
    grow = Math.min(1, (z.T - z.t) / 0.25 + 0.3),
    s = z.r * grow;
  v.scale.set(s, 1, s);
  const base =
    z.el === 'terre' ? 0.85 : z.el === 'elec' ? 0.25 + 0.3 * Math.random() : 0.42 + 0.1 * Math.sin(sim.t * 6 + z.id);
  u.dm.opacity = base * life;
  u.rm.opacity = 0.9 * life;
  if (z.el === 'feu' && Math.random() < dt * 10) {
    const a = Math.random() * 6.283,
      r = Math.random() * z.r;
    burst(z.x + Math.cos(a) * r, 0.2, z.z + Math.sin(a) * r, 'feu', 1, 0.45);
  } else if (z.el === 'elec' && Math.random() < dt * 4) {
    const a = Math.random() * 6.283,
      r = Math.random() * z.r;
    burst(z.x + Math.cos(a) * r, 0.3, z.z + Math.sin(a) * r, 'elec', 1, 0.6);
  }
}
// les coéquipiers : un gardien de l'île aux couleurs de son élément, son nom au-dessus de la tête
function mateView(o) {
  const g = new THREE.Group(),
    ce = elOf(o),
    m = mdlOf('hero.avatar', Object.assign(elCtx(ce), { hero: o.el }), o.el + '|' + ce),
    pr = m.userData.prep;
  g.add(m);
  const l = label(EL[o.el].hero + (o.bot ? ' · bot' : ''), elc(ce));
  l.scale.set(3.4, 0.85, 1);
  l.position.y = (pr.labelY || pr.max[1] * (pr.scale || 1)) + 0.55;
  g.add(l);
  g.userData = { mdl: m, px: o.x, pz: o.z, w: 0 };
  scene.add(g);
  return g;
}
function mateTick(o, v, dt) {
  const u = v.userData,
    sp = Math.hypot(o.x - u.px, o.z - u.pz) / Math.max(dt, 0.001);
  u.px = o.x;
  u.pz = o.z;
  u.w += ((sp > 0.5 ? 1 : 0.12) - u.w) * Math.min(1, dt * 8);
  K.pose(u.mdl, sim.t, o.x * 0.3 + o.z * 0.3, u.w);
  v.position.set(o.x, o.y + Math.abs(Math.sin(sim.t * 6 + o.x * 0.3 + o.z * 0.3)) * 0.05 * u.w, o.z);
  v.rotation.y = o.yaw;
  v.rotation.z = o.down ? 1.45 : 0;
}
const SEEN = new Set(); // réutilisé à chaque appel de sync (neuf appels par image) au lieu d'un Set neuf à chaque fois
function sync(map, list, make, upd) {
  const seen = SEEN;
  seen.clear();
  for (const o of list) {
    seen.add(o.id);
    let v = map.get(o.id);
    if (!v) {
      v = make(o);
      map.set(o.id, v);
    }
    const nv = upd(o, v);
    if (nv) map.set(o.id, nv);
  }
  for (const [id, v] of map)
    if (!seen.has(id)) {
      if (v.userData && v.userData.die) v.userData.die();
      else scene.remove(v);
      if (v.userData && v.userData.kill) v.userData.kill();
      map.delete(id);
    }
}
function ringFx(x, z, r, el, dur) {
  const m = new THREE.Mesh(
    ringG,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(elc(el)).getHex(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.25, z);
  scene.add(m);
  fx.push({ m, r, t: 0, dur: dur || 0.4 });
}
let wallK = '',
  wallL = [];
function clearViews() {
  wallK = '';
  for (const k in views) {
    for (const v of views[k].values()) {
      scene.remove(v);
      if (v.userData && v.userData.kill) v.userData.kill();
    }
    views[k].clear();
  }
  pitFv = -1;
  fx.forEach(f => scene.remove(f.m));
  fx = [];
  parts.forEach(p => scene.remove(p.m));
  parts = [];
  beams.forEach(b => scene.remove(b.m));
  beams = [];
  dying.forEach(q => scene.remove(q.v));
  dying = [];
  restoreDecor();
}
