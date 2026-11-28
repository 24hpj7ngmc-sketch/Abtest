// [affichage/decor.js] Le décor de l'île : ciel, cœur, navires et écume, étals (marchand, esclaves, Guide), végétation semée puis écartée là où l'on bâtit, collines.
// ciel : dégradé, disque du soleil et son halo
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(600, 24, 12),
  new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: SUN }, tint: { value: new THREE.Vector3(1, 1, 1) } },
    vertexShader: SKY_V,
    fragmentShader: SKY_F,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false
  })
);
sky.renderOrder = -10;
sky.frustumCulled = false;
scene.add(sky);
const live = []; // décor articulé (cristaux qui flottent, bras du marchand…) : posé à chaque image
const put = (name, x, y, z, ry, ctx, key, o) => {
  if (!MODELS[name]) {
    const e = new THREE.Group();
    e.userData = { nodes: {}, prep: { parts: [] } };
    return e;
  }
  const g = mdlOf(name, ctx, key, o);
  g.position.set(x, y, z);
  g.rotation.y = ry || 0;
  scene.add(g);
  if (g.userData.prep.parts.some(q => q.anim)) live.push(g);
  return g;
};
// écume autour d'une coque : un anneau blanc allongé posé sur l'eau, qui respire
const foamG = new THREE.RingGeometry(0.86, 1.12, 28),
  foamM = new THREE.MeshBasicMaterial({
    color: 0xeafaff,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false
  });
function foamOf() {
  const m = new THREE.Mesh(foamG, foamM);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(4.6, 12.6, 1);
  return m;
}
// navires : la flotte ennemie croise au large (boatAt) ; personne n'en débarque. Ses lanternes s'embrasent pendant la vague, quand ses canons tirent.
const portals = [];
PATHS.forEach((p, pi) => {
  const B = BOATS[pi],
    ry = Math.atan2(-B[0], -B[1]),
    v = put('set.navire', B[0], -1.3, B[1], ry, undefined, undefined, { cast: false });
  v.userData.ry = ry;
  const gl = new THREE.Sprite(glowM(0xa77bff, 0.5));
  gl.position.set(0, 12.2, 0.6);
  gl.scale.setScalar(7);
  v.add(gl);
  const fo = foamOf();
  fo.position.set(B[0], -1.26, B[1]);
  fo.rotation.z = ry;
  scene.add(fo);
  portals.push({ v, gl, fo, on: 0, ph: pi * 2.1 });
});
// le cœur : le grand cristal sur son sanctuaire, entouré des cinq piliers des éléments
const coreV = put('set.coeur', 0, 0, 0, 0),
  coreN = coreV.userData.nodes,
  coreM = coreN.crystal || coreV,
  coreY = coreM.position.y;
const coreMat = new THREE.MeshPhongMaterial({
  vertexColors: true,
  shininess: 90,
  specular: 0xffffff,
  emissive: 0x0b3f4c
});
for (const me of coreN.crystal ? coreN.crystal.userData.meshes : []) if (me.userData.ch === 's') me.material = coreMat;
const coreGlow = new THREE.Sprite(glowM(0x7ff3ff, 0.5));
coreGlow.position.set(0, 4, 0);
coreGlow.scale.setScalar(9);
scene.add(coreGlow);
{
  const pl = new THREE.PointLight(0x7ff3ff, 0.9, 28);
  pl.position.set(0, 4.6, 0);
  scene.add(pl);
}
// le marchand : c'est chez lui qu'on dépense les points gagnés à chaque vague. Il se tient près du cœur, du côté le plus éloigné des chemins.
const SHOP = (() => {
  let b = [7.6, 0],
    bd = -1;
  for (let i = 0; i < 16; i++) {
    const a = i * 0.3927,
      x = Math.cos(a) * 7.6,
      z = Math.sin(a) * 7.6,
      dd = distPaths(x, z);
    if (dd > bd) {
      bd = dd;
      b = [x, z];
    }
  }
  return b;
})();
// le marchand d'esclaves : le meilleur emplacement à 10 m du cœur, loin des chemins et du marchand
const HIREP = (() => {
  let b = [-7, -7],
    bd = -1;
  for (let i = 0; i < 24; i++) {
    const a = i * 0.2618,
      x = Math.cos(a) * 10,
      z = Math.sin(a) * 10,
      dd = Math.min(distPaths(x, z), Math.hypot(x - SHOP[0], z - SHOP[1]) / 2.2);
    if (dd > bd) {
      bd = dd;
      b = [x, z];
    }
  }
  return b;
})();
{
  const ry = Math.atan2(HIREP[0], HIREP[1]),
    c = Math.cos(ry),
    s = Math.sin(ry),
    at = (u, v) => [HIREP[0] + u * c + v * s, HIREP[1] - u * s + v * c];
  for (const u of [-1.5, 1.5]) {
    const q = at(u, 1.1);
    put('set.barriere', q[0], 0, q[1], ry);
  }
  {
    const q = at(1.9, -0.4);
    put('set.caisses', q[0], 0, q[1], ry + 0.5);
  }
  {
    const q = at(-2.1, -0.2);
    put('set.lanterne', q[0], 0, q[1], ry);
  }
  {
    const q = at(0, -0.3);
    put('pnj.villageois', q[0], 0, q[1], ry, { v: 2 }, 'hire');
  }
  const l = label('ESCLAVES', '#c79bff');
  l.scale.set(3.2, 0.8, 1);
  l.position.set(HIREP[0], 4.1, HIREP[1]);
  scene.add(l);
  SOL.push([HIREP[0], HIREP[1], 1.6, 4]);
}
// le Guide, « Règles » en partie : à 10 m du cœur, loin des chemins, du marchand et du marchand d'esclaves
const RULEP = (() => {
  let b = [7, 7],
    bd = -1;
  for (let i = 0; i < 24; i++) {
    const a = i * 0.2618 + 0.13,
      x = Math.cos(a) * 10,
      z = Math.sin(a) * 10,
      dd = Math.min(
        distPaths(x, z),
        Math.hypot(x - SHOP[0], z - SHOP[1]) / 2.2,
        Math.hypot(x - HIREP[0], z - HIREP[1]) / 2.2
      );
    if (dd > bd) {
      bd = dd;
      b = [x, z];
    }
  }
  return b;
})();
{
  const ry = Math.atan2(RULEP[0], RULEP[1]);
  put('pnj.guide', RULEP[0], 0, RULEP[1], ry, {}, 'guide');
  {
    const q = [RULEP[0] + Math.cos(ry) * 1.3, RULEP[1] - Math.sin(ry) * 1.3];
    put('set.lanterne', q[0], 0, q[1], ry);
  }
  const l = label('RÈGLES', '#ffcf5a');
  l.scale.set(2.8, 0.7, 1);
  l.position.set(RULEP[0], 3.1, RULEP[1]);
  scene.add(l);
  SOL.push([RULEP[0], RULEP[1], 0.7, 3]);
}
const shopRy = Math.atan2(SHOP[0], SHOP[1]),
  stall = put('set.etal', SHOP[0], 0, SHOP[1], shopRy),
  npcAt = (() => {
    const q = stall.userData.prep.npc || [0, -0.3],
      c = Math.cos(shopRy),
      s = Math.sin(shopRy);
    return [stall.position.x + q[0] * c + q[1] * s, stall.position.z - q[0] * s + q[1] * c];
  })();
SOL.push([SHOP[0], SHOP[1], 1.85, 4]);
const npc = put('set.marchand', npcAt[0], 0, npcAt[1], shopRy),
  shopGlow = new THREE.Sprite(glowM(0xffcf5a, 0.8));
{
  const l = label('MARCHAND', '#ffcf5a');
  l.scale.set(3.2, 0.8, 1);
  l.position.set(SHOP[0], 4.1, SHOP[1]);
  scene.add(l);
  shopGlow.position.set(SHOP[0], 5, SHOP[1]);
  shopGlow.scale.setScalar(2.2);
  shopGlow.visible = false;
  scene.add(shopGlow);
}
// décor semé en lots (un lot dessine tous les exemplaires d'un modèle d'un coup, pour rester léger sur téléphone)
const SOWN = {};
const DEC = new Map(),
  GONE = []; // DEC : case → décor posé dessus, pour l'escamoter là où l'on bâtit
function sow(name, list, o) {
  o = o || {};
  if (!list.length || !MODELS[name]) return null;
  const pr = prepOf(name, o.ctx, o.key),
    ims = [],
    sc = pr.scale || 1;
  for (const part of pr.parts)
    for (const ch in part.gs) {
      const im = new THREE.InstancedMesh(part.gs[ch], (o.mats && o.mats[ch]) || MATI[ch], list.length);
      list.forEach((q, i) => {
        DUM.position.set(q[0], q[1], q[2]);
        DUM.rotation.set(q[5] || 0, q[3] || 0, q[6] || 0);
        DUM.scale.setScalar(sc * (q[4] || 1));
        DUM.updateMatrix();
        im.setMatrixAt(i, DUM.matrix);
      });
      im.frustumCulled = false;
      im.castShadow = o.cast !== false && (ch === 'm' || ch === 's');
      im.receiveShadow = o.recv !== false && (ch === 'm' || ch === 's');
      (o.par || scene).add(im);
      ims.push(im);
    }
  if (!o.par) (SOWN[name] = SOWN[name] || []).push(...ims); // gardé par nom : un thème de campagne peut cacher une famille de décor
  if (o.reg) {
    const so = SOLR[name] || SOLR[name.replace(/\d$/, '')];
    list.forEach((q, i) => {
      const c = cellOf(q[0], q[2]);
      let l = DEC.get(c);
      if (!l) DEC.set(c, (l = []));
      l.push({
        ims,
        i,
        x: q[0],
        z: q[2],
        q,
        sc,
        r: so && (q[4] || 1) >= (so[2] || 0) ? so[0] * (q[4] || 1) : 0,
        h: so ? q[1] + so[1] * (q[4] || 1) : 0
      });
    });
  }
  return pr;
}
const hideDec = d => {
  DUM.position.set(0, -50, 0);
  DUM.rotation.set(0, 0, 0);
  DUM.scale.setScalar(0.0001);
  DUM.updateMatrix();
  for (const im of d.ims) {
    im.setMatrixAt(d.i, DUM.matrix);
    im.instanceMatrix.needsUpdate = true;
  }
};
// on bâtit ou on creuse ici : les arbres, buissons et rochers qui gênent disparaissent (ils reviennent à la partie suivante)
function clearDecor(x, z, r) {
  const c0 = cellOf(x, z),
    cx = c0 % GN,
    cz = (c0 / GN) | 0;
  let n = 0;
  for (let a = -1; a <= 1; a++)
    for (let b = -1; b <= 1; b++) {
      const nx = cx + a,
        nz = cz + b;
      if (nx < 0 || nz < 0 || nx >= GN || nz >= GN) continue;
      const l = DEC.get(nx + nz * GN);
      if (!l) continue;
      for (let k = l.length - 1; k >= 0; k--) {
        const d = l[k];
        if (Math.hypot(d.x - x, d.z - z) < r) {
          hideDec(d);
          l.splice(k, 1);
          GONE.push(d);
          n++;
        }
      }
    }
  return n;
}
function restoreDecor() {
  for (const d of GONE) {
    const q = d.q;
    DUM.position.set(q[0], q[1], q[2]);
    DUM.rotation.set(q[5] || 0, q[3] || 0, q[6] || 0);
    DUM.scale.setScalar(d.sc * (q[4] || 1));
    DUM.updateMatrix();
    for (const im of d.ims) {
      im.setMatrixAt(d.i, DUM.matrix);
      im.instanceMatrix.needsUpdate = true;
    }
    const c = cellOf(d.x, d.z);
    let l = DEC.get(c);
    if (!l) DEC.set(c, (l = []));
    l.push(d);
  }
  GONE.length = 0;
}
// collines : falaises de roche à facettes coiffées d'herbe. Le dessus reste plat (on marche et on bâtit dessus) et les parois restent à l'aplomb des cases
// (à 20 cm près, pour que la caméra n'entre jamais dans la roche). Les points partagés par deux parois bougent ensemble : pas de jour entre elles.
function mkHills() {
  const b = K.make(77),
    TP = [],
    TC = [],
    hAt = (cx, cz) => (cx < 0 || cz < 0 || cx >= GN || cz >= GN ? 0 : HILL[cx + cz * GN]),
    key = (x, y, z) => Math.round(x * 2) + '_' + Math.round(y * 5) + '_' + Math.round(z * 2),
    dir = new Map(),
    pin = new Set(),
    sides = [];
  for (let i = 0; i < GN * GN; i++) {
    const h = HILL[i];
    if (!h) continue;
    const cx = i % GN,
      cz = (i / GN) | 0,
      x = cellX(i),
      z = cellZ(i),
      y = h * WALLH;
    for (const s of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ]) {
      const nh = hAt(cx + s[0], cz + s[1]);
      if (nh >= h) continue;
      const cols = [-2, 0, 2].map(t => [x + s[0] * 2 + s[1] * t, z + s[1] * 2 - s[0] * t]),
        n = (h - nh) * 2;
      sides.push({ cols, y0: nh * WALLH, n });
      for (const c of cols) {
        for (let j = 0; j <= n; j++) {
          const k = key(c[0], nh * WALLH + j * 0.8, c[1]),
            d = dir.get(k) || [0, 0];
          d[0] += s[0];
          d[1] += s[1];
          dir.set(k, d);
        }
        pin.add(key(c[0], y, c[1]));
      }
    }
    for (const q of [
      [-2, -2],
      [-2, 2],
      [2, -2],
      [2, -2],
      [-2, 2],
      [2, 2]
    ]) {
      const c = K.shade(groundCol(x + q[0], z + q[1]), 1 + 0.05 * h);
      TP.push(x + q[0], y, z + q[1]);
      TC.push(c[0], c[1], c[2]);
    }
  }
  const at = (c, y) => {
    const k = key(c[0], y, c[1]);
    if (pin.has(k)) return [c[0], y, c[1]];
    const d = dir.get(k),
      l = Math.hypot(d[0], d[1]) || 1,
      a = (hsh(c[0] * 1.31 + y * 7.1, c[1] * 1.73 - y * 3.3) - 0.45) * 0.38;
    return [c[0] + (d[0] / l) * a, y, c[1] + (d[1] / l) * a];
  };
  for (const sd of sides)
    for (let j = 0; j < sd.n; j++) {
      const v = [],
        y0 = sd.y0 + j * 0.8,
        y1 = y0 + 0.8,
        top = j === sd.n - 1;
      for (let q = 0; q < 2; q++) {
        const A = at(sd.cols[q], y0),
          B = at(sd.cols[q + 1], y0),
          C = at(sd.cols[q + 1], y1),
          D = at(sd.cols[q], y1);
        v.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
      b.add(
        { v, n: null },
        top ? { c: 0x8f8a78, c2: 0x5f9a4a, jit: 0.07 } : { c: j ? 0x8d8777 : 0x77705f, c2: 0x9a9484, jit: 0.1 }
      );
    } // la bande du haut verdit : l'herbe déborde sur la roche
  if (sides.length) {
    const m = add(K.geo(b.bake({ jit: 0.08, ground: 0.3, groundH: 1.3 }).ch.m), K.MAT.m),
      t = add(flatGeo(TP, TC, 11), grassM);
    m.castShadow = t.castShadow = true;
    m.receiveShadow = t.receiveShadow = true;
  }
}
// décor : bosquets, clairières fleuries, rochers, vestiges de l'ancienne civilisation, plage, mer et ciel
