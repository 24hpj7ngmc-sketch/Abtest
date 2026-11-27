// [affichage/ambiance.js] Autour du joueur : pollen, défenses et leurs signes, fantôme de pose, murs et fosses affichés, l'arme en main (setGun, handsTick).
// grains de pollen qui flottent dans la lumière autour du joueur (un seul lot, déplacé à chaque image)
const motes = (() => {
  const n = 44,
    im = new THREE.InstancedMesh(
      K.geo(K.make(1).add(K.oct(0.03), { c: 0xffffff }).bake({ jit: 0 }).ch.m),
      new THREE.MeshBasicMaterial({
        color: 0xfff3c4,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      n
    ),
    b = [];
  let s = 5;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) b.push([r() * 34, r() * 6, r() * 34, r() * 6.28, 0.6 + r() * 0.8]);
  im.frustumCulled = false;
  scene.add(im);
  return { im, b, n };
})();
const elBasic = {},
  glowE = {};
for (const e of ELS) {
  const c = new THREE.Color(elc(e)).getHex();
  elBasic[e] = new THREE.MeshBasicMaterial({ color: c });
  glowE[e] = glowM(c, 0.95);
}
// panneau flottant au-dessus de chaque défense : forme = type, pastilles = niveaux et éléments. Lisible de loin, visible à travers le décor.
const beamG = new THREE.CylinderGeometry(0.13, 0.13, 12, 6),
  pillarG = new THREE.CylinderGeometry(1, 1, 70, 12, 1, true),
  beamMat = {};
for (const e of ELS)
  beamMat[e] = new THREE.MeshBasicMaterial({
    color: new THREE.Color(elc(e)).getHex(),
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    fog: false
  });
function towerSign(t) {
  const c = document.createElement('canvas');
  c.width = 176;
  c.height = 64;
  const g = c.getContext('2d'),
    ord = [...new Set(t.els)],
    any = pures(t.els).length > 0;
  g.beginPath();
  g.moveTo(32, 2);
  g.lineTo(144, 2);
  g.arc(144, 32, 30, -Math.PI / 2, Math.PI / 2);
  g.lineTo(32, 62);
  g.arc(32, 32, 30, Math.PI / 2, Math.PI * 1.5);
  g.closePath();
  g.fillStyle = 'rgba(8,28,38,.88)';
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = any ? '#ffcf5a' : 'rgba(236,247,248,.35)';
  g.stroke();
  g.fillStyle = '#ecf7f8';
  g.beginPath();
  if (t.type === 'canon') g.arc(34, 32, 15, 0, 7);
  else if (t.type === 'archer') {
    g.moveTo(34, 15);
    g.lineTo(51, 48);
    g.lineTo(17, 48);
    g.closePath();
  } else g.rect(20, 18, 28, 28);
  g.fill();
  if (t.auto || t.tmpT !== undefined) {
    g.fillStyle = '#10202a';
    g.font = '700 17px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(t.tmpT !== undefined ? 'G' : 'A', 34, t.type === 'archer' ? 39 : 33);
  } // A = défense automatique
  // une pastille par élément, avec son niveau dedans ; cerclée d'or au niveau 3
  g.font = '700 20px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < MAXEL; i++) {
    const x = 78 + i * 32,
      e = ord[i];
    g.beginPath();
    if (e) {
      const n = t.els.filter(q => q === e).length;
      g.arc(x, 32, 13, 0, 7);
      g.fillStyle = elc(e);
      g.fill();
      if (n >= MAXLV) {
        g.lineWidth = 3;
        g.strokeStyle = '#fff';
        g.stroke();
      }
      g.fillStyle = '#10202a';
      g.fillText(n, x, 33);
    } else {
      g.arc(x, 32, 10, 0, 7);
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(236,247,248,.4)';
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c),
    sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false })
    );
  sp.renderOrder = 10;
  sp.userData.tex = tex;
  return sp;
}
// les défenses : un modèle par type, qui grandit et change avec ses éléments (anneaux de couleur, emblèmes, bannière). La tête pivote vers la cible, le tube recule au tir.
const TWM = { mortier: 'tower.mortier', canon: 'tower.canon', archer: 'tower.archer' },
  twAt = new Map(),
  twKey = t => Math.round(t.x * 10) + '_' + Math.round(t.z * 10);
const grouped = els => {
  const ord = [...new Set(els)];
  return els.slice().sort((a, b) => ord.indexOf(a) - ord.indexOf(b));
};
function towerGroup(t) {
  const g = new THREE.Group(),
    L = t.els.length,
    grp = grouped(t.els),
    pr = prepOf(TWM[t.type], { els: grp, el: grp[0], P: K.EL[grp[0]] }, grp.join(''));
  pr.use++;
  const mdl = K.inst(pr),
    N = mdl.userData.nodes,
    u = g.userData;
  g.position.set(t.x, t.wy || 0, t.z);
  g.add(mdl);
  u.pr = pr;
  u.head = N.head || null;
  u.km = (pr.kick && N[pr.kick.part]) || N.barrel || null;
  u.kv = (pr.kick && pr.kick.v) || [0, 0, -0.4];
  u.kb = u.km ? u.km.position.clone() : null;
  u.muz = pr.muzzle || [0, TYPES[t.type].h + stackH(L), 0];
  if (u.head) u.head.rotation.y = t.aim || 0;
  const topY = pr.topY || pr.max[1],
    bm = new THREE.Mesh(beamG, beamMat[t.els[0]]);
  bm.position.y = topY + 6.5;
  g.add(bm);
  u.sign = towerSign(t);
  u.signY = topY + 9;
  u.sign.position.y = u.signY;
  g.add(u.sign);
  u.signPop = 1.2;
  u.fresh = true;
  u.lvl = L;
  u.type = t.type;
  u.auto = !!t.auto;
  u.age = 0;
  u.kick = 0;
  u.key = twKey(t);
  twAt.set(u.key, g);
  u.kill = () => {
    u.sign.userData.tex.dispose();
    u.sign.material.dispose();
    prepFree(pr);
    if (twAt.get(u.key) === g) twAt.delete(u.key);
  };
  if (clearDecor(t.x, t.z, 2.9) && sim && sim.t > 1) burst(t.x, 1.5, t.z, 'bois', 6, 0.9);
  g.scale.setScalar(0.05);
  scene.add(g);
  return g;
}
// bouche du tube d'une défense, dans le monde (là où naissent les projectiles et l'éclair du tir)
function muzzleOf(v, aim) {
  const m = v.userData.muz,
    c = Math.cos(aim),
    s = Math.sin(aim);
  return [v.position.x + m[0] * c + m[2] * s, v.position.y + m[1], v.position.z - m[0] * s + m[2] * c];
}
// fantôme de pose : la silhouette de la défense choisie, verte si l'endroit convient, rouge sinon
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x7cf07a, transparent: true, opacity: 0.5, depthWrite: false });
const ghost = new THREE.Group(),
  ghostMs = { m: ghostMat, s: ghostMat, g: ghostMat, x: ghostMat };
let ghostB = null;
function ghostSet(type, el) {
  const k = type + el;
  if (ghost.userData.k === k) return;
  ghost.userData.k = k;
  if (ghostB) {
    ghost.remove(ghostB);
    prepFree(ghostB.userData.prep);
  }
  const pr = prepOf(TWM[type] || TWM.mortier, { els: [el], el, P: K.EL[el] }, el);
  pr.use++;
  ghostB = K.inst(pr, { cast: false, recv: false, mats: ghostMs });
  ghost.add(ghostB);
}
const gRing = new THREE.Mesh(new THREE.RingGeometry(16.6, 17, 64), ghostMat);
gRing.rotation.x = -Math.PI / 2;
gRing.position.y = 0.2;
ghost.add(gRing);
ghost.visible = false;
scene.add(ghost);
// repère d'objectif : colonne dorée visible de loin, cercle au sol, gemme pour la relique
const objG = new THREE.Group(),
  objRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffcf5a })),
  objGem = mdlOf('obj.relique'),
  objCol = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 60, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffcf5a,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    })
  );
objRing.rotation.x = Math.PI / 2;
objRing.position.y = 0.22;
objCol.position.y = 30;
objG.add(objRing);
objG.add(objCol);
objG.add(objGem);
objG.visible = false;
scene.add(objG);
// murs : des blocs de pierre taillée, d'un à trois niveaux. Les remparts du héros de la Terre sont teintés d'ocre.
const wallG = new THREE.BoxGeometry(CELL, WALLH, CELL),
  ghostWs = [];
for (let i = 0; i < BAL.wallLine; i++) {
  const m = new THREE.Mesh(wallG, ghostMat);
  m.visible = false;
  scene.add(m);
  ghostWs.push(m);
}
const hideGW = () => {
    for (const m of ghostWs) m.visible = false;
  },
  wallGeo = lv => prepOf('wall', { lvl: lv }, lv).parts[0].gs.m,
  rempartM = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0xf0c890 });
function wallView(w) {
  const m = new THREE.Mesh(wallGeo(1), sim.tmpSet[w.id] ? rempartM : K.MAT.m);
  m.position.set(cellX(w.id), 0, cellZ(w.id));
  m.scale.y = 0.05;
  m.userData.lv = 0;
  m.castShadow = true;
  m.receiveShadow = true;
  clearDecor(m.position.x, m.position.z, 3.1);
  scene.add(m);
  return m;
}
function wallTick(w, v, dt) {
  const lv = sim.wallSet[w.id] || 1,
    u = v.userData;
  if (u.lv !== lv) {
    v.geometry = wallGeo(lv);
    v.scale.y = Math.max(0.05, u.lv / lv);
    u.lv = lv;
  }
  if (v.scale.y < 1) v.scale.y = Math.min(1, v.scale.y + dt * 5);
}
// fosses : le sol reste une surface plate. Sur chaque case creusée, un carré invisible repousse la profondeur au plus loin,
// ce qui laisse voir l'intérieur de la fosse (fond et parois) dessiné juste après, avec ce qui se trouve dedans.
const pitPunch = new THREE.ShaderMaterial({
  vertexShader:
    'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w*0.99999;}',
  fragmentShader: 'void main(){gl_FragColor=vec4(0.0);}',
  depthFunc: THREE.AlwaysDepth,
  depthWrite: true,
  colorWrite: false
});
const pitTile = new THREE.PlaneGeometry(CELL, CELL),
  pitSide = new THREE.PlaneGeometry(CELL, WALLH),
  pitFloorM = new THREE.MeshLambertMaterial({ map: tex(128, '#4a3524', ['#3f2c1d', '#5a4230'], 120, 3, 10, 1) }),
  pitWallM = new THREE.MeshLambertMaterial({ map: tex(128, '#6b4f33', ['#5c432b', '#7a5c3d'], 120, 3, 10, 1) }),
  pitGroup = new THREE.Group();
scene.add(pitGroup);
let pitFv = -1;
function drawPits() {
  pitFv = sim.fv;
  while (pitGroup.children.length) pitGroup.remove(pitGroup.children[0]);
  for (const i of sim.pits) {
    const d = sim.pit[i],
      x = cellX(i),
      z = cellZ(i),
      cx = i % GN,
      cz = (i / GN) | 0;
    if (!d) continue;
    clearDecor(x, z, 3.1);
    const hole = new THREE.Mesh(pitTile, pitPunch);
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(x, 0.1, z);
    hole.renderOrder = -3;
    hole.frustumCulled = false;
    pitGroup.add(hole);
    const fl = new THREE.Mesh(pitTile, pitFloorM);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(x, -d * WALLH, z);
    fl.receiveShadow = true;
    pitGroup.add(fl);
    [
      [1, 0, -Math.PI / 2],
      [-1, 0, Math.PI / 2],
      [0, 1, Math.PI],
      [0, -1, 0]
    ].forEach(s => {
      const nx = cx + s[0],
        nz = cz + s[1],
        nd = nx < 0 || nz < 0 || nx >= GN || nz >= GN ? 0 : sim.pit[nx + nz * GN];
      if (nd >= d) return; // pas de paroi entre deux fosses qui se touchent
      const w = new THREE.Mesh(pitSide, pitWallM);
      w.scale.y = d - nd;
      w.position.set(x + (s[0] * CELL) / 2, (-(d + nd) / 2) * WALLH, z + (s[1] * CELL) / 2);
      w.rotation.y = s[2];
      w.receiveShadow = true;
      pitGroup.add(w);
    });
  }
}
// ce que le gardien tient en main : son pistolet à cristal (à la couleur de son élément), la pelle ou le maillet
const gun = new THREE.Group(),
  held = {},
  HOLD = {
    pistolet: { p: [0.27, -0.23, -0.72], r: [0, 0.07, 0] },
    pelle: { p: [0.32, -0.3, -0.62], r: [-0.45, -0.25, 0] },
    marteau: { p: [0.32, -0.3, -0.62], r: [-0.15, -0.25, 0.15] }
  };
const tip = new THREE.Sprite(glowM(0xffffff, 0.9));
let gunN = {},
  gunEl = null;
tip.visible = false;
camera.add(gun);
const holdOf = (pr, k) =>
  pr.hold
    ? { p: [pr.hold.p[0] - (k === 'marteau' ? 0.2 : 0.225), pr.hold.p[1], pr.hold.p[2]], r: pr.hold.r || [0, 0, 0] }
    : HOLD[k]; // les modèles sont cadrés pour le coin droit, sous les boutons : on les ramène vers le centre
let aimK = 0,
  AIMP = [0, -0.094, -0.46],
  pumpT = 9,
  gunCd0 = 0;
// gants et manches des armes de Dernier Toit, aux cuirs du gardien (les mêmes que sur la pelle et le maillet du lobby)
const GUNH = {
  glove: K.hex(K.mix(K.PAL.dirt, K.PAL.sand, 0.36)),
  gloveD: K.hex(K.shade(K.PAL.dirt, 0.86)),
  sleeve: K.hex(K.mix(K.PAL.bark, K.PAL.wood, 0.5)),
  sleeveD: K.hex(K.PAL.barkD)
};
function setGun(el) {
  const key = el + '|' + tWeap;
  if (gunEl === key) return;
  gunEl = key; // le modèle en main dépend du héros (couleur du cristal) et de l'arme choisie
  while (gun.children.length) gun.remove(gun.children[0]);
  const m = mdlOf(
      MODELS['vm.' + WT[tWeap].vm] ? 'vm.' + WT[tWeap].vm : 'vm.pistolet',
      Object.assign(elCtx(el), { H: GUNH }),
      el,
      { cast: false }
    ),
    pr = m.userData.prep;
  gun.add(m);
  gunN = m.userData.nodes || {};
  // les armes de Dernier Toit donnent leur pose à la hanche [x, y, z, rx, ry, rz], leur position en visée (la mire sous le réticule) et le bout du canon
  HOLD.pistolet = Array.isArray(pr.hold) ? { p: pr.hold.slice(0, 3), r: pr.hold.slice(3, 6) } : holdOf(pr, 'pistolet');
  AIMP = pr.aim || [0, -0.094, -0.46];
  gun.userData.pump = pr.pump || 0.085;
  tip.material = glowE[el];
  const tp = pr.tip || [0, 0.02, -0.36],
    sc = pr.scale || 1;
  tip.position.set(tp[0] * sc, tp[1] * sc, tp[2] * sc);
  gun.add(tip);
}
for (const k of ['pelle', 'marteau']) {
  const m = mdlOf('vm.' + k, null, undefined, { cast: false }),
    g = new THREE.Group();
  g.add(m);
  HOLD[k] = holdOf(m.userData.prep, k);
  g.visible = false;
  camera.add(g);
  held[k] = g;
}
// V2.3 : en course (c = facteur de sprint lissé, 0 à 1), l'objet en main est baissé, tourné sur le côté, et balance avec les pas (la pose de Dernier Toit)
function runPose(m, c) {
  if (c <= 0.01) return;
  const w = Math.sin(bob * 0.5);
  m.position.x += 0.05 * c;
  m.position.y -= 0.07 * c + Math.abs(w) * 0.02 * c;
  m.position.z += 0.05 * c;
  m.rotation.x -= 0.38 * c;
  m.rotation.y += 0.55 * c;
  m.rotation.z += 0.3 * c + w * 0.06 * c;
}
function handsTick(h, dt) {
  const cd0 = 0.26 * (1 - (h.m.hCd || 0)),
    kw = Math.min(0.14, cd0 * 0.6),
    kick = Math.max(0, Math.min(1, (h.cd - (cd0 - kw)) / kw)),
    H = HOLD.pistolet;
  feelTick(h, dt);
  if (tool === 'pistolet' && !calm) camera.rotation.x += kick * 0.014 * (WT[tWeap].kick || 1); // le recul dure au plus 0,14 s après le tir, quelle que soit la cadence de l'arme   // le recul fait tressaillir la visée
  aimK += ((aimOn() ? 1 : 0) - aimK) * Math.min(1, dt * 14);
  gun.visible = tool === 'pistolet' && !!gunEl && !(WT[tWeap].scope && aimK > 0.55); // derrière la lunette on ne voit plus l'arme

  if (gun.visible) {
    const a = aimK,
      q = 1 - a;
    gun.position.set(
      H.p[0] * q + AIMP[0] * a + Math.sin(bob * 0.5) * 0.008 * q,
      H.p[1] * q + AIMP[1] * a + Math.abs(Math.cos(bob * 0.5)) * 0.006 * q,
      H.p[2] * q + AIMP[2] * a + kick * 0.06 * (1 - 0.5 * a)
    );
    gun.rotation.set((H.r[0] || 0) * q + kick * 0.11 * (1 - 0.6 * a), (H.r[1] || 0) * q, (H.r[2] || 0) * q); // en visée l'arme vient au centre, la mire sous le réticule
    if (gunN.crystal) gunN.crystal.scale.setScalar(1 + kick * 0.7);
    tip.visible = kick > 0.03 && !(h.m.hFlame > 0);
    tip.scale.setScalar(0.04 + kick * 0.42);
    if (h.cd > gunCd0 + 0.05) pumpT = 0;
    gunCd0 = h.cd;
    pumpT += dt;
    if (gunN.pompe) {
      const u = pumpT,
        E = x => x * x * (3 - 2 * x),
        rc =
          u > 0.14 && u < 0.3
            ? E((u - 0.14) / 0.16)
            : u >= 0.3 && u < 0.34
              ? 1
              : u >= 0.34 && u < 0.48
                ? 1 - E((u - 0.34) / 0.14)
                : 0;
      gunN.pompe.position.z = rc * gun.userData.pump;
      gun.rotation.z += rc * 0.06;
      gun.rotation.x += rc * 0.03;
      gun.position.y -= rc * 0.006;
    }
    runPose(gun, a > 0.05 ? 0 : spk);
  }
  swing = Math.max(0, swing - dt * 4);
  for (const k in held) {
    const m = held[k],
      Q = HOLD[k];
    m.visible = tool === k;
    if (m.visible) {
      m.position.set(Q.p[0] + Math.sin(bob * 0.5) * 0.008, Q.p[1] + Math.abs(Math.cos(bob * 0.5)) * 0.006, Q.p[2]);
      m.rotation.set((Q.r[0] || 0) - swing * (k === 'pelle' ? 0.9 : 1.2), Q.r[1] || 0, Q.r[2] || 0);
      runPose(m, spk * (1 - 0.6 * (swing > 0 ? 1 : 0)));
    }
  }
} // petit coup d'outil à chaque action
