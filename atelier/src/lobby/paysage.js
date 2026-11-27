// [lobby/paysage.js] Le paysage de l'île : végétation, rochers, rivières et cascades, semés selon le relief.
// =====================================================================================================================
// LE PAYSAGE de l'île : il suit le thème du village (Céleste, Pirate, Dragon, Cristal, Astral).
//  · végétation, rochers et détails semés sur l'île (ils s'écartent des bâtiments, des parvis et des rivières)
//  · rivières qui dévalent la montagne en cascades puis se jettent dans le vide au bord de l'île (eau, lave, glace, énergie)
//  · une grotte dans le flanc de la montagne, des rochers qui planent autour du sommet
//  · un monument géant sur son île à côté, un astre dans le ciel
//  · les habitants : ils vont de porte en porte, s'arrêtent, saluent le joueur ; quelques animaux
// Tout se reconstruit seul (payMark) quand le relief, la montagne, le village ou le thème changent.
// =====================================================================================================================
var PAY = null;
function payMark() {
  if (PAY) PAY.dirty = Math.max(PAY.dirty, 0.25);
}
const PTH = [null, 'cel'];
// rivières : couleurs, vitesse, opacité, glace figée
const PFX = [null, { a: 0x2f8fe0, b: 0xf2fdff, sp: 1.5, op: 0.84, ice: 0 }];
// astre du ciel : [couleur, rayon, anneau (0 = aucun), couleur de l'anneau, petite lune]
const PSKY = [null, [0xfff0d2, 46, 0xffd98a, 0]];
const PAY_V = `varying vec2 vUv;varying vec2 vS;void main(){vUv=uv;vS=normal.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const PAY_F = `varying vec2 vUv;varying vec2 vS;uniform float t;uniform float sp;uniform float op;uniform float ice;uniform vec3 cA;uniform vec3 cB;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hh(i),hh(i+vec2(1.0,0.0)),f.x),mix(hh(i+vec2(0.0,1.0)),hh(i+vec2(1.0,1.0)),f.x),f.y);}
void main(){float y=vUv.y-t*sp;float a=nn(vec2(vUv.x*5.0,y*1.5));float b=nn(vec2(vUv.x*11.0+3.0,y*3.6+a*1.5));
  float st=smoothstep(0.38,0.82,a*0.6+b*0.5);float foam=clamp(vS.x,0.0,1.0);
  vec3 col=mix(cA,cB,clamp(st*0.62+foam*0.5+ice*0.3*b,0.0,1.0));
  float ed=smoothstep(0.0,0.18,vUv.x)*smoothstep(1.0,0.82,vUv.x);
  gl_FragColor=vec4(col,clamp(op*ed*vS.y*(0.74+0.26*st+foam*0.2),0.0,1.0));}`;
// directions des trois rivières, depuis le sommet
const PCAVE = [
  [0.26, -0.966],
  [0.62, -0.785],
  [-0.3, -0.954],
  [0.9, 0.44],
  [-0.62, 0.785],
  [-0.98, 0.2]
]; // flancs possibles pour la grotte (le premier libre gagne)
PAY = (() => {
  const P = {
    dirty: 0.01,
    th: 0,
    sig: '',
    obs: [],
    val: [],
    sx: 1e9,
    sz: 1e9,
    root: new THREE.Group(),
    sc: [],
    scT: [],
    riv: [],
    rivU: {
      t: { value: 0 },
      sp: { value: 1.5 },
      op: { value: 0.84 },
      ice: { value: 0 },
      cA: { value: V3(0x2f8fe0) },
      cB: { value: V3(0xf2fdff) }
    },
    cave: null,
    mon: null,
    flots: [],
    pnj: [],
    sky: null,
    cand: []
  };
  lob.add(P.root);
  // points candidats du semis, tirés une fois pour toutes (l'île peut grandir jusqu'à 76 m) : [x, z, genre, variante, angle, taille]
  for (let i = 0; i < 900; i++) {
    const a = hsh(i, 71) * 6.2832,
      r = 12 + Math.sqrt(hsh(i, 72)) * 220,
      q = hsh(i, 73),
      kd = q < 0.42 ? 0 : q < 0.54 ? 1 : q < 0.62 ? 2 : q < 0.65 ? 3 : 4;
    P.cand.push([
      Math.cos(a) * r,
      Math.sin(a) * r,
      kd,
      Math.floor(hsh(i, 74) * 3) % 3,
      hsh(i, 75) * 6.2832,
      (0.9 + hsh(i, 76) * 0.55) * (kd === 0 ? 1.2 : 1)
    ]);
  }
  P.roadM = new THREE.MeshLambertMaterial({
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  if (MODELS['set.lanterne']) {
    const pr = prepOf('set.lanterne');
    P.lampN = 140;
    P.lampS = (pr.scale || 1) * 1.25;
    P.lamp = [];
    for (const p of pr.parts)
      for (const k in p.gs) {
        const im = new THREE.InstancedMesh(p.gs[k], MATI[k], P.lampN);
        im.frustumCulled = false;
        im.count = 0;
        P.root.add(im);
        P.lamp.push(im);
      }
  }
  P.rivM = new THREE.ShaderMaterial({
    uniforms: P.rivU,
    vertexShader: PAY_V,
    fragmentShader: PAY_F,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  // l'île du monument : un grand rocher en pointe, juste à côté de l'île, qui flotte un peu plus haut
  P.monG = new THREE.Group();
  P.monRock = new THREE.Mesh(
    new THREE.CylinderGeometry(12.5, 1.2, 24, 9, 3),
    new THREE.MeshLambertMaterial({ color: 0x8d88a6, flatShading: true })
  );
  P.monRock.position.y = -12.2;
  P.monG.add(P.monRock);
  P.monRock2 = new THREE.Mesh(
    new THREE.CylinderGeometry(9.5, 3.5, 13, 7, 2),
    new THREE.MeshLambertMaterial({ color: 0x6d6886, flatShading: true })
  );
  P.monRock2.position.set(1.5, -9, -1);
  P.monRock2.rotation.y = 0.5;
  P.monRock2.scale.set(1.25, 1, 1.1);
  P.monG.add(P.monRock2);
  P.monTop = new THREE.Mesh(
    new THREE.CylinderGeometry(12.5, 12.9, 0.5, 9),
    new THREE.MeshLambertMaterial({ color: 0x5d9a58 })
  );
  P.monTop.position.y = -0.2;
  P.monG.add(P.monTop);
  P.monG.visible = false;
  P.monY = 7;
  P.root.add(P.monG);
  // l'astre : loin dans le ciel, hors brume
  P.skyG = new THREE.Group();
  P.skyB = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshLambertMaterial({ color: 0xffffff, fog: false })
  );
  P.skyG.add(P.skyB);
  P.skyR = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.95, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  P.skyR.rotation.set(1.25, 0.3, 0);
  P.skyG.add(P.skyR);
  P.skyM = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10),
    new THREE.MeshLambertMaterial({ color: 0xff9be8, fog: false })
  );
  P.skyM.position.set(-2.6, 0.9, 0.4);
  P.skyG.add(P.skyM);
  P.skyG.position.set(250, 235, 400);
  lob.add(P.skyG);
  return P;
})();
const payHas = n => !!MODELS[n];
// un exemplaire par (modèle, canal) en InstancedMesh : tout le semis d'un thème tient en une vingtaine d'appels de dessin
function payScatterMake(th) {
  const P = PAY,
    t = PTH[th];
  for (const S of P.sc)
    for (const m of S.ims) {
      P.root.remove(m);
      if (m.dispose) m.dispose();
    }
  P.sc = [];
  const kinds = [
    ['arbre', 0],
    ['arbre', 1],
    ['arbre', 2],
    ['roc', 0],
    ['roc', 1],
    ['roc', 2],
    ['sol', 0],
    ['sol', 1],
    ['sol', 2]
  ];
  for (const [kn, v] of kinds) {
    const name = 'pay.' + t + '.' + kn;
    if (!payHas(name)) continue;
    const pr = prepOf(name, { v }, 'v' + v),
      n = P.cand.filter(
        c =>
          (kn === 'arbre'
            ? c[2] === 0
            : kn === 'sol'
              ? c[2] === 4
              : kn === 'roc' && (v === 2 ? c[2] === 3 : v === 1 ? c[2] === 2 : c[2] === 1)) &&
          (kn === 'roc' || c[3] === v)
      ).length,
      ims = [];
    if (!n) continue;
    for (const p of pr.parts)
      for (const k in p.gs) {
        const im = new THREE.InstancedMesh(p.gs[k], MATI[k], n);
        im.frustumCulled = false;
        im.count = 0;
        im.userData.pv = p.pivot;
        P.root.add(im);
        ims.push(im);
      }
    P.sc.push({ kn, v, ims, sc: pr.scale || 1, n: 0 });
  }
}
const payType = c =>
  c[2] === 0 ? ['arbre', c[3]] : c[2] === 4 ? ['sol', c[3]] : ['roc', c[2] === 3 ? 2 : c[2] === 2 ? 1 : 0];
function payNearRiv(x, z, d) {
  for (const R of PAY.riv)
    for (let i = 0; i < R.pts.length; i += 3) {
      const p = R.pts[i];
      if (Math.hypot(p[0] - x, p[1] - z) < d + p[2]) return true;
    }
  return false;
}
function payNearRoad(x, z, d) {
  for (const e of ROADS.edges) {
    const vx = e.bx - e.ax,
      vz = e.bz - e.az,
      l2 = vx * vx + vz * vz || 1,
      t = Math.max(0, Math.min(1, ((x - e.ax) * vx + (z - e.az) * vz) / l2));
    if (Math.hypot(x - e.ax - vx * t, z - e.az - vz * t) < d + 2.8) return true;
  }
  for (const n of ROADS.nodes) if (Math.hypot(x - n.x, z - n.z) < n.R + d + 0.6) return true;
  for (const p of PLOTS) if (Math.hypot(x - p.x, z - p.z) < 8.5 + d) return true;
  return false;
}
function payScatter() {
  const P = PAY;
  P.obs.length = 0;
  P.val = [];
  const by = {};
  for (const S of P.sc) by[S.kn + S.v] = S;
  for (const c of P.cand) {
    const [x, z] = c,
      r = Math.hypot(x, z),
      [kn, v] = payType(c),
      S = by[kn + v];
    if (!S || r > RI - (kn === 'roc' && v === 2 ? 12 : 7)) continue;
    const big = kn === 'roc' ? [1.8, 3.2, 4.2][v] : kn === 'arbre' ? 1.6 : 0.6;
    if (LGAMES.some(G => Math.hypot(G.x - x, G.z - z) < PADR + 2.5 + big)) continue;
    const h = hAt(x, z);
    if (h < -0.3) continue;
    const sl = Math.max(Math.abs(hAt(x + 2, z) - hAt(x - 2, z)), Math.abs(hAt(x, z + 2) - hAt(x, z - 2))) / 4;
    if (kn === 'arbre' && sl > 0.6) continue;
    if (kn === 'sol' && sl > 1) continue;
    if (kn === 'roc' && sl > 1.6) continue;
    if (save.vil.some(B => Math.hypot(B.x - x, B.z - z) < rOf(B) * 1.25 + big + 1.2)) continue;
    if (payNearRoad(x, z, big)) continue;
    if (payNearRiv(x, z, big + 0.6)) continue;
    if (
      P.caveAt &&
      (Math.hypot(P.caveAt[0] - x, P.caveAt[1] - z) < 8 + big || Math.hypot(P.caveF[0] - x, P.caveF[1] - z) < 9 + big)
    )
      continue;
    P.val.push([
      c,
      S,
      h - (kn === 'roc' ? 0.25 + sl * 1.3 * (v + 1) : 0.05 + sl * 0.4),
      kn === 'sol' ? 62 : kn === 'roc' && v === 2 ? 210 : 112
    ]);
    if (kn === 'roc' && v > 0) P.obs.push([x, z, v === 2 ? 1.9 : 1.5]);
  }
  payScatterShow();
}
// n'affiche que ce qui est assez près du joueur (les grands pitons se voient de loin)
function payScatterShow() {
  const P = PAY;
  P.sx = LB.x;
  P.sz = LB.z;
  for (const S of P.sc) S.n = 0;
  for (const V of P.val) {
    const c = V[0],
      S = V[1];
    if (Math.hypot(c[0] - LB.x, c[1] - LB.z) > V[3]) continue;
    const s = c[5] * S.sc,
      cs = Math.cos(c[4]),
      sn = Math.sin(c[4]);
    for (const im of S.ims) {
      const pv = im.userData.pv;
      DUM.position.set(c[0] + (pv[0] * cs + pv[2] * sn) * s, V[2] + pv[1] * s, c[1] + (-pv[0] * sn + pv[2] * cs) * s);
      DUM.rotation.set(0, c[4], 0);
      DUM.scale.setScalar(s);
      DUM.updateMatrix();
      im.setMatrixAt(S.n, DUM.matrix);
    }
    S.n++;
  }
  for (const S of P.sc)
    for (const im of S.ims) {
      im.count = S.n;
      im.visible = S.n > 0;
      im.instanceMatrix.needsUpdate = true;
    }
}
