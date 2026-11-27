// [affichage/entites.js] Les entités : tirs, barres de vie, ruines, bonus à ramasser, ennemis (enemyView).
// ---------- entités ----------
const shotG = new THREE.SphereGeometry(0.2, 8, 6),
  barBg = new THREE.SpriteMaterial({ color: 0x10202a }),
  barFg = new THREE.SpriteMaterial({ color: 0x7cf07a }),
  ringG = new THREE.RingGeometry(0.86, 1, 36);
const views = {
  e: new Map(),
  s: new Map(),
  b: new Map(),
  t: new Map(),
  o: new Map(),
  z: new Map(),
  w: new Map(),
  st: new Map(),
  pu: new Map(),
  ru: new Map()
};
let HPTEX = null;
function hpTex() {
  if (!HPTEX) {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 4, 4);
    HPTEX = new THREE.CanvasTexture(c);
  }
  return HPTEX;
} // un carré blanc, teinté par la matière : la barre de vie des défenses de renfort
// une ruine (V10.0) : ce qui reste d'une défense de renfort détruite ; un tas de pierres sombres et deux poutres, cuit en un seul maillage
function ruinView(q) {
  const sd = (Math.abs(Math.round(q.x * 7 + q.z * 13)) % 900) + 1,
    b = K.make(sd),
    rnd = K.rng(sd);
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.28,
      d = rnd() * 1.5,
      r = 0.45 + rnd() * 0.5;
    b.add(K.rock(r, 1 + Math.floor(rnd() * 11), 1), {
      p: [Math.cos(a) * d, r * 0.5, Math.sin(a) * d],
      c: 0x5a5650,
      c2: 0x3a3632
    });
  }
  for (let i = 0; i < 2; i++)
    b.add(K.box(0.22, 0.22, 2.2 + rnd()), {
      p: [rnd() - 0.5, 0.5 + i * 0.25, rnd() - 0.5],
      r: [0.35 * (i ? 1 : -1), rnd() * 6.28, 0.2],
      c: 0x4a3524
    });
  const m = new THREE.Mesh(K.geo(b.bake({ jit: 0.08, ground: 0.25, groundH: 1 }).ch.m), K.MAT.m);
  m.castShadow = m.receiveShadow = true;
  m.position.set(q.x, 0, q.z);
  m.userData.kill = () => m.geometry.dispose();
  scene.add(m);
  return m;
}
// un bonus au sol : une pastille qui flotte et tourne, un halo, un anneau et une colonne de lumière pour le repérer de loin. Tout est partagé par type : rien à libérer.
const PUPV = {},
  pupColG = new THREE.CylinderGeometry(0.55, 0.55, 26, 10, 1, true),
  pupRingG = new THREE.TorusGeometry(1.25, 0.07, 6, 28);
function pupKit(k) {
  if (PUPV[k]) return PUPV[k];
  const P = PUPS[k],
    c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(64, 64, 56, 0, 7);
  g.fillStyle = 'rgba(8,28,38,.92)';
  g.fill();
  g.lineWidth = 9;
  g.strokeStyle = P.c;
  g.stroke();
  g.fillStyle = P.c;
  g.font = '700 ' + (P.i.length > 1 ? 58 : 70) + 'px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(P.i, 64, 69);
  const col = new THREE.Color(P.c).getHex(),
    tex = new THREE.CanvasTexture(c);
  return (PUPV[k] = {
    ico: new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }),
    glow: glowM(col, 0.75),
    col: new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    }),
    ring: new THREE.MeshBasicMaterial({ color: col })
  });
}
function pupView(p) {
  const K = pupKit(p.k),
    g = new THREE.Group(),
    col = new THREE.Mesh(pupColG, K.col),
    ring = new THREE.Mesh(pupRingG, K.ring),
    gl = new THREE.Sprite(K.glow),
    ic = new THREE.Sprite(K.ico);
  col.position.y = 13;
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;
  gl.scale.setScalar(4.6);
  ic.scale.setScalar(2.1);
  g.add(col);
  g.add(ring);
  g.add(gl);
  g.add(ic);
  g.userData = { ic, gl, ring, ph: Math.random() * 6 };
  g.position.set(p.x, typeof topAt === 'function' ? Math.max(0, topAt(sim, p.x, p.z)) : 0, p.z);
  scene.add(g);
  if (typeof SND !== 'undefined') SND.at('pupdrop', p.x, p.z);
  return g;
}
function pupTick(p, v, now) {
  const u = v.userData,
    y = 1.75 + Math.sin(now / 260 + u.ph) * 0.22;
  u.ic.position.y = y;
  u.gl.position.y = y;
  u.gl.scale.setScalar(4.6 + Math.sin(now / 170 + u.ph) * 0.7);
  u.ring.scale.setScalar(1 + Math.sin(now / 210 + u.ph) * 0.08);
  v.visible = p.t > 6 || Math.sin(now / 70) > -0.2;
}
let fx = [];
// les ennemis : un modèle par type, décliné dans les cinq éléments (la forme change avec l'élément, pas seulement la couleur)
const KMDL = {
    b: 'enemy.b',
    tank: 'enemy.tank',
    air: 'enemy.air',
    dig: 'enemy.dig',
    ste: 'enemy.ste',
    rng: 'enemy.rng',
    inc: 'enemy.inc',
    soi: 'enemy.soi',
    bro: 'enemy.bro',
    gol: 'enemy.gol',
    ecl: 'enemy.ecl',
    sem: 'enemy.sem',
    gra: 'enemy.gra',
    tou: 'enemy.tou'
  },
  flashM = new THREE.MeshBasicMaterial({ color: 0xffffff });
const flashMs = { m: flashM, s: flashM, g: K.MAT.g, x: K.MAT.x },
  ghostMsE = {
    m: new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false }),
    g: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false }),
    x: K.MAT.x
  };
ghostMsE.s = ghostMsE.m;
const moundG = K.geo(
  K.make(9)
    .add(K.rock(1, 5, 1, 0.22), { s: [1.5, 0.42, 1.5], c: PAL.dirtD, c2: PAL.dirt })
    .add(K.rock(0.5, 8, 0, 0.3), { p: [0.9, 0.1, 0.5], c: PAL.stoneD })
    .add(K.rock(0.4, 3, 0, 0.3), { p: [-0.8, 0.1, -0.7], c: PAL.dirt })
    .bake({ jit: 0.1 }).ch.m
);
// les volants se voient surtout d'en dessous, où il n'arrive presque pas de lumière : leur matière luit un peu de la couleur de leur élément
const airM = {};
for (const e of ELS)
  airM[e] = {
    m: new THREE.MeshLambertMaterial({ vertexColors: true, emissive: K.hex(K.shade(K.EL[e].main, 0.4)) }),
    s: K.MAT.s,
    g: K.MAT.g,
    x: K.MAT.x
  };
const bombMdl = () => {
  const m = mdlOf('shot.bomb', elCtx('feu'), 'feu', { cast: false });
  m.scale.multiplyScalar(1.7);
  return m;
};
function enemyView(e) {
  const g = new THREE.Group(),
    k = e.boss ? [3, 3, 4.4, 7][e.bt || 1] : 1,
    kind = e.boss ? 'boss' : KMDL[e.k] ? e.k : 'b',
    pr = prepOf(e.boss ? 'boss.' + (e.bt || 1) : KMDL[kind], elCtxE(e.el), e.el);
  const nm = kind === 'air' ? airM[e.el] : K.MAT,
    mdl = K.inst(pr, { mats: nm }),
    sc = (pr.scale || 1) * k;
  mdl.scale.setScalar(sc);
  g.add(mdl);
  let mound = null;
  if (kind === 'dig') {
    mound = new THREE.Mesh(moundG, K.MAT.m);
    mound.visible = false;
    mound.receiveShadow = true;
    g.add(mound);
  }
  const barY = (pr.barY || pr.max[1] * (pr.scale || 1) + 0.4) * k,
    bg = new THREE.Sprite(barBg),
    fg = new THREE.Sprite(barFg);
  bg.scale.set(1.9 * k, 0.26 * k, 1);
  bg.position.y = fg.position.y = barY;
  bg.visible = fg.visible = false;
  g.add(bg);
  g.add(fg);
  g.userData = {
    fg,
    bg,
    k,
    sc,
    mdl,
    ms: meshesOf(mdl),
    mound,
    kind,
    el: e.el,
    mode: 0,
    gh: false,
    nm,
    die: () => {
      const u = g.userData;
      if (dying.length > 40 || !u.mdl.visible) {
        scene.remove(g);
        return;
      }
      u.fg.visible = u.bg.visible = false;
      if (u.mound) u.mound.visible = false;
      for (const me of u.ms) {
        me.material = flashMs[me.userData.ch];
        me.castShadow = false;
      }
      dying.push({ v: g, t: 0 });
    }
  };
  if (e.boss && sim.t > 0.5) SND.play('boss');
  if (e.bomb) {
    const bm = bombMdl(),
      gl = new THREE.Sprite(glowM(0xff3020, 0.9));
    bm.position.y = barY + 0.5;
    gl.scale.setScalar(2.4);
    bm.add(gl);
    g.add(bm);
    g.userData.bomb = gl;
    bg.position.y = fg.position.y = barY + 1.5;
  }
  scene.add(g);
  return g;
}
