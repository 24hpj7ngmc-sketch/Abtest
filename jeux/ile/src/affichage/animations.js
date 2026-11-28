// [affichage/animations.js] Animations des ennemis et des défenses, rayons, éclairs, orage (calculées à l'affichage : les règles n'en dépendent pas).
// ---------- animations (tout est calculé à l'affichage, les règles du jeu n'en dépendent pas) ----------
const calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let parts = [],
  fired = {},
  coreHit = 0,
  shake = 0,
  dying = [];
function animEnemy(e, v, dt) {
  let u = v.userData,
    nv = null;
  const t = sim.t,
    ph = e.id * 1.7,
    st = e.stun > 0,
    w = st ? 0 : 1;
  if (u.el !== e.el) {
    const n = enemyView(e),
      q = n.userData;
    q.age = 1;
    q.hp = e.hp;
    q.dig = u.dig;
    q.flash = 0;
    q.gy = u.gy;
    scene.remove(v);
    v = nv = n;
    u = q;
  } // le Titan change d'élément : on change de modèle
  if (u.age === undefined) {
    u.age = 0;
    u.hp = e.hp;
    u.dig = e.bur ? 1 : 0;
    u.flash = 0;
  }
  u.age += dt;
  if (e.hp < u.hp - 0.5) u.flash = 0.09;
  u.hp = e.hp;
  if (u.flash > 0) u.flash -= dt;
  const pop = Math.min(1, u.age / 0.3);
  v.scale.setScalar(0.2 + 0.8 * (1 - Math.pow(1 - pop, 3))); // sort du portail en grossissant
  K.pose(u.mdl, t, ph, w);
  const m = u.mdl,
    sc = u.sc;
  let y = 0,
    hide = false;
  if (u.kind === 'b') {
    const hop = Math.abs(Math.sin(t * 7 + ph)),
      sq = 0.07 * (1 - hop) * w;
    y = hop * 0.2 * w;
    m.scale.set(sc * (1 + sq), sc * (1 - sq * 1.4), sc * (1 + sq));
  } // sautille en s'écrasant
  else if (u.kind === 'tank') {
    m.rotation.z = Math.sin(t * 5 + ph) * 0.035 * w;
    y = Math.abs(Math.sin(t * 5 + ph)) * 0.05 * w;
  } // se dandine lourdement
  else if (u.kind === 'air') {
    y = 7 + Math.sin(t * 2 + ph) * 0.5;
    m.rotation.z = Math.sin(t * 1.7 + ph) * 0.16;
    m.rotation.x = Math.sin(t * 2 + ph + 1.2) * 0.07;
  } // plane en se balançant
  else if (u.kind === 'dig') {
    u.dig += ((e.bur ? 1 : 0) - u.dig) * Math.min(1, dt * 6);
    m.position.y = -2.7 * u.dig;
    m.rotation.x = 0.5 * u.dig; // plonge sous terre, une taupinière le trahit
    m.visible = u.dig < 0.95;
    u.mound.visible = u.dig > 0.05;
    u.mound.scale.set(0.75 * u.dig, 0.8 * u.dig * (1 + 0.15 * Math.sin(t * 18)), 0.75 * u.dig);
    hide = u.dig >= 0.5;
  } else if (u.kind === 'ste') {
    m.rotation.z = Math.sin(t * 2 + ph) * 0.09 * w;
    y = 0.15 + Math.sin(t * 3 + ph) * 0.15;
    u.gh = !(e.rev > 0);
    hide = u.gh;
  } // flotte, à demi invisible tant qu'il n'est pas révélé
  else if (u.kind === 'rng') {
    y = Math.abs(Math.sin(t * 6 + ph)) * 0.1 * w;
  } else if (u.kind === 'boss') {
    m.rotation.y = Math.sin(t * 0.9) * 0.18;
    m.rotation.z = Math.sin(t * 2.5) * 0.03 * w;
    m.scale.setScalar(sc * (1 + 0.025 * Math.sin(t * 3)));
    y = Math.abs(Math.sin(t * 2.5)) * 0.06 * u.k * w;
  }
  if (u.bomb) u.bomb.material.opacity = Math.sin(t * 12) > 0 ? 0.95 : 0.15;
  {
    const rr = Math.hypot(e.x, e.z),
      st = u.kind === 'air' || rr >= 4.7 ? 0 : rr < 4.02 ? 1.4 : rr < 4.36 ? 0.933 : 0.467;
    u.gy = (u.gy || 0) + ((e.gy || 0) + st + (e.lift > 0 ? 1.8 : 0) - (u.gy || 0)) * Math.min(1, dt * 8); // soulevé par le Vent : il flotte au-dessus du sol
  }
  if (u.kind !== 'air') {
    const wet = (e.gy || 0) < -0.5 && Math.hypot(e.x, e.z) > R_ISLE - 4;
    if (wet && !u.wet) splash(e.x, e.z, e.boss ? 14 : 7, e.boss ? 1.6 : 1);
    u.wet = wet;
    if (wet) {
      u.wt = (u.wt || 0) - dt;
      if (u.wt <= 0) {
        u.wt = 0.3 + Math.random() * 0.15;
        splash(e.x, e.z, 2, 0.55);
      }
    }
  }
  v.position.set(e.x, y + u.gy, e.z);
  v.rotation.set(0, e.ang || 0, st ? Math.sin(t * 40) * 0.06 : 0); // tremble quand il est entravé
  const mode = u.flash > 0 ? 1 : u.gh ? 2 : 0;
  if (u.mode !== mode) {
    u.mode = mode;
    const mats = mode === 1 ? flashMs : mode === 2 ? ghostMsE : u.nm;
    for (const me of u.ms) {
      me.material = mats[me.userData.ch];
      if (me.userData.ch !== 'g' && me.userData.ch !== 'x') me.castShadow = mode !== 2;
    }
  } // éclair blanc quand il prend un coup
  const f = Math.max(0, e.hp / e.max),
    bar = f < 0.999 && !hide;
  u.fg.visible = u.bg.visible = bar;
  if (bar) u.fg.scale.set(1.8 * u.k * f + 0.001, 0.18 * u.k, 1);
  return nv;
}
function animTower(t, v, dt) {
  const u = v.userData;
  u.age += dt;
  const p = Math.min(1, u.age / 0.35),
    q = p - 1;
  v.scale.setScalar(Math.max(0.05, 1 + 2.70158 * q * q * q + 1.70158 * q * q)); // rebond à la pose
  const cd = Math.hypot(camera.position.x - t.x, camera.position.y, camera.position.z - t.z);
  u.signPop = Math.max(0, u.signPop - dt * 2.2); // le panneau garde la même taille à l'écran, de près comme de loin
  const sw = Math.max(2.6, cd * 0.15) * (1 + u.signPop);
  u.sign.scale.set(sw, (sw * 64) / 176, 1);
  u.sign.position.y = u.signY + Math.min(12, cd * 0.05);
  if (u.fresh) {
    u.fresh = false;
    if (sim.t > 1 && newT++ < 3) upFx(t, false);
  }
  u.sign.material.opacity = t.off > 0 ? 0.3 : 1;
  if (u.head) u.head.rotation.y = t.aim || 0;
  if (fired[t.id]) {
    u.kick = 1;
    SND.at(t.type, t.x, t.z);
    const mz = muzzleOf(v, t.aim || 0);
    flash(mz[0], mz[1], mz[2], t.type === 'archer' ? 0.9 : t.type === 'canon' ? 2.6 : 2.1, t.els[0]);
    if (t.type !== 'archer') smoke(mz[0], mz[1], mz[2], t.type === 'canon' ? 3 : 2);
  }
  u.kick = Math.max(0, u.kick - dt * 5);
  const k = u.kick * u.kick;
  if (u.km) u.km.position.set(u.kb.x + u.kv[0] * k, u.kb.y + u.kv[1] * k, u.kb.z + u.kv[2] * k);
} // recul au tir
// pose ou amélioration : colonne de lumière de la couleur de l'élément, onde au sol, gerbe d'étincelles. Visible depuis toute l'île.
let beams = [],
  newT = 0;
function upFx(t, up) {
  const L0 = t.els.length,
    el = t.els[L0 - 1],
    L = t.els.filter(e => e === el).length,
    pure = up && L >= MAXLV ? el : null,
    far = m => {
      m.material.fog = false;
      return m;
    };
  const pillar = (col, w, dur) => {
    const m = new THREE.Mesh(
      pillarG,
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      })
    );
    m.position.set(t.x, 35, t.z);
    scene.add(m);
    beams.push({ m, t: 0, dur, w });
  };
  pillar(new THREE.Color(elc(el)).getHex(), up ? 1.3 + L * 0.6 : 1, up ? 1.4 : 0.7);
  ringFx(t.x, t.z, up ? 8 + L * 4 : 6, el, up ? 0.8 : 0.45);
  far(fx[fx.length - 1].m);
  burst(t.x, 3, t.z, el, up ? 8 + L * 6 : 8, up ? 1.5 : 1);
  if (pure) {
    pillar(0xffffff, 4.2, 1.8);
    ringFx(t.x, t.z, 30, el, 1.2);
    far(fx[fx.length - 1].m);
    ringFx(t.x, t.z, 18, el, 0.9);
    far(fx[fx.length - 1].m);
    burst(t.x, 5, t.z, el, 24, 2);
    shake = Math.max(shake, 0.25);
  }
  SND.at(pure ? 'pure' : up ? 'up' : 'place', t.x, t.z, L);
  if (pure && !calm) slowT = 0.4;
  if (up && (pure || !t.auto))
    toast(pure ? FXN[t.type][pure] + ' débloqués' : TYPES[t.type].s + ' · ' + EL[el].n + ' niveau ' + L);
}
// la couleur claire d'un élément pour les colonnes de lumière (V2.6 : météores et éclairs de l'élément choisi)
const boltCol = el => (K.EL[el] || K.EL.elec).light;
function bolt(x, z, col) {
  const m = new THREE.Mesh(
    pillarG,
    new THREE.MeshBasicMaterial({
      color: col || 0xfff3a0,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    })
  );
  m.position.set(x, 35, z);
  scene.add(m);
  beams.push({ m, t: 0, dur: 0.2, w: 0.35 });
}
// nuage d'orage : un disque sombre au-dessus de la zone et son cercle au sol
const stormG = new THREE.CylinderGeometry(1, 1, 0.8, 24),
  stormM = new THREE.MeshBasicMaterial({ color: 0x2a2f45, transparent: true, opacity: 0.75, depthWrite: false }),
  stormR = new THREE.TorusGeometry(1, 0.02, 6, 48),
  stormRM = new THREE.MeshBasicMaterial({ color: 0xffe45c });
// le nuage et son cercle prennent la palette de l'élément choisi (dark pour le nuage, main pour le cercle) ; Élec : les couleurs d'avant
const stormMs = {};
function stormView(o) {
  const g = new THREE.Group(),
    el = o && o.el && o.el !== 'elec' && K.EL[o.el] ? o.el : '';
  if (el && !stormMs[el])
    stormMs[el] = [
      new THREE.MeshBasicMaterial({ color: K.EL[el].dark, transparent: true, opacity: 0.75, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: K.EL[el].light })
    ];
  const c = new THREE.Mesh(stormG, el ? stormMs[el][0] : stormM),
    r = new THREE.Mesh(stormR, el ? stormMs[el][1] : stormRM);
  c.scale.set(BAL.stormR * 0.8, 1, BAL.stormR * 0.8);
  c.position.y = 17;
  r.rotation.x = Math.PI / 2;
  r.position.y = 0.25;
  r.scale.set(BAL.stormR, BAL.stormR, 1);
  g.add(c);
  g.add(r);
  scene.add(g);
  return g;
}
