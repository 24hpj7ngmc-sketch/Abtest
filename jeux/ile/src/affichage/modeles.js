// [affichage/modeles.js] Des modèles aux objets affichés (mdlOf), textures et halos, le sol de l'île et la mer, les étiquettes.
// un exemplaire affichable (pièces articulées comprises), à l'échelle prévue par le modèle
function mdlOf(name, ctx, key, o) {
  const p = prepOf(name, ctx, key),
    g = K.inst(p, o || {});
  if (p.scale) g.scale.setScalar(p.scale);
  return g;
}
const meshesOf = g => {
  const l = [];
  for (const n in g.userData.nodes) for (const me of g.userData.nodes[n].userData.meshes) l.push(me);
  return l;
};
// texture de grain fabriquée sur place : elle multiplie la couleur des sommets (herbe, sable, terre) et se répète sans raccord visible
function tex(w, base, cols, n, r0, r1, rep) {
  const c = document.createElement('canvas');
  c.width = c.height = w;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, w, w);
  let s = 11 + n;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const x = r() * w,
      y = r() * w,
      q = r0 + r() * (r1 - r0);
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = 0.22 + r() * 0.4;
    for (const dx of [-w, 0, w])
      for (const dy of [-w, 0, w]) {
        g.beginPath();
        g.arc(x + dx, y + dy, q, 0, 7);
        g.fill();
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  return t;
}
// halo lumineux : sert aux étincelles, aux tirs et à la lueur du cœur
const glowT = (() => {
  const n = 96,
    d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - (n - 1) / 2, y - (n - 1) / 2) / (n / 2),
        a = r >= 1 ? 0 : Math.pow(1 - r, 1.6),
        i = (y * n + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.round(a * 255);
    }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
})();
const glowM = (col, op) =>
  new THREE.SpriteMaterial({
    map: glowT,
    color: col,
    transparent: true,
    opacity: op === undefined ? 1 : op,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
const add = (g, m, x, y, z) => {
  const me = new THREE.Mesh(g, m);
  me.position.set(x || 0, y || 0, z || 0);
  scene.add(me);
  return me;
};
// bruit doux (le même à chaque chargement) pour faire varier les teintes du sol
const hsh = (i, j) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn = (x, z) => {
  const i = Math.floor(x),
    j = Math.floor(z),
    u = x - i,
    v = z - j,
    a = u * u * (3 - 2 * u),
    b = v * v * (3 - 2 * v);
  return (hsh(i, j) * (1 - a) + hsh(i + 1, j) * a) * (1 - b) + (hsh(i, j + 1) * (1 - a) + hsh(i + 1, j + 1) * a) * b;
};
const sst = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// maillage posé à plat (normales vers le haut), couleurs par sommet, grain plaqué vu de dessus
function flatGeo(P, C, per) {
  const g = new THREE.BufferGeometry(),
    n = P.length / 3,
    N = new Float32Array(P.length),
    U = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    N[i * 3 + 1] = 1;
    U[i * 2] = P[i * 3] / per;
    U[i * 2 + 1] = P[i * 3 + 2] / per;
  }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return g;
}
const planarUV = (g, per) => {
  const p = g.getAttribute('position').array,
    n = p.length / 3,
    U = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    U[i * 2] = p[i * 3] / per;
    U[i * 2 + 1] = p[i * 3 + 2] / per;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  return g;
};
const GROUND = []; // mer, plage, herbe et routes : dessinés en premier pour que les fosses puissent les percer
const low = m => {
  m.renderOrder = -4;
  m.receiveShadow = true;
  GROUND.push(m);
  return m;
};
// mer : vagues, reflet du ciel, scintillement du soleil et écume au bord de la plage
const seaU = {
  t: { value: 0 },
  sunDir: { value: SUN },
  fogCol: { value: new THREE.Color(HORIZON) },
  shore: { value: R_ISLE + 6.4 }
};
const sea = low(
  add(
    new THREE.CircleGeometry(700, 48),
    new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: SEA_V, fragmentShader: SEA_F }),
    0,
    -1.3,
    0
  )
);
sea.rotation.x = -Math.PI / 2;
// plage : sable sec en haut, sable mouillé à la limite de l'eau, pente qui plonge sous la mer
{
  const b = K.make(3),
    sm = { flat: false, jit: 0 };
  b.add(
    K.lathe(
      [
        [136, -4.6],
        [126.9, -1.55]
      ],
      96
    ),
    Object.assign({ c: 0x8f8660, c2: 0xa8996a }, sm)
  );
  b.add(
    K.lathe(
      [
        [126.9, -1.55],
        [125.2, -0.72]
      ],
      96
    ),
    Object.assign({ c: 0xa8996a, c2: 0xc9b47c }, sm)
  );
  b.add(
    K.lathe(
      [
        [125.2, -0.72],
        [123.6, -0.13]
      ],
      96
    ),
    Object.assign({ c: 0xc9b47c, c2: 0xe0cf98 }, sm)
  );
  b.add(
    K.lathe(
      [
        [123.6, -0.13],
        [117, -0.1]
      ],
      96
    ),
    Object.assign({ c: 0xe0cf98, c2: 0xe4d49f }, sm)
  );
  low(
    add(
      planarUV(K.geo(b.bake({ jit: 0 }).ch.m), 7),
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        map: tex(256, '#f3efe6', ['#e2dccd', '#ffffff', '#d6cfbd'], 700, 1, 4, 1)
      })
    )
  );
}
const grassM = new THREE.MeshLambertMaterial({
  vertexColors: true,
  map: tex(256, '#f1f4ea', ['#dfe7d2', '#ffffff', '#d0dcc2', '#f7fbef'], 900, 1.2, 5, 1)
});
// herbe : une nappe dont la teinte varie doucement (clairières, herbe usée près des chemins, terre battue autour du cœur, sable au bord)
const GC = {
    a: K.rgb(0x4f8847),
    b: K.rgb(0x74ad59),
    dry: K.rgb(0x9aab5a),
    worn: K.rgb(0x9a9a5e),
    plaza: K.rgb(0xa59d80),
    sand: K.rgb(0xd9c88f),
    wood: K.rgb(0x3f7440),
    pine: K.rgb(0x58763f)
  },
  GROVES = [];
function groundCol(x, z) {
  const r = Math.hypot(x, z),
    n1 = vn(x * 0.045 + 7, z * 0.045 + 3),
    n2 = vn(x * 0.11 + 31, z * 0.11 + 17),
    n3 = vn(x * 0.31, z * 0.31);
  let c = K.mix(GC.a, GC.b, sst(0.22, 0.82, n1 * 0.7 + n3 * 0.3));
  c = K.mix(c, GC.dry, sst(0.6, 0.9, n2) * 0.65);
  for (const g of GROVES) {
    const d = Math.hypot(x - g[0], z - g[1]);
    if (d < g[2] + 5) c = K.mix(c, g[3] ? GC.pine : GC.wood, sst(g[2] + 5, g[2] - 3, d + (n3 - 0.5) * 5) * 0.6);
  }
  c = K.mix(c, GC.worn, sst(PATH_HALF + 4.5, PATH_HALF + 0.3, distPaths(x, z)) * 0.7);
  c = K.mix(c, GC.plaza, sst(11.5, 5.5, r) * 0.85);
  return K.mix(c, GC.sand, sst(107, 118, r + (n3 - 0.5) * 7));
}
function mkGround() {
  const N = 96,
    RG = R_ISLE - 2,
    S = (RG * 2) / N,
    P = [],
    C = [],
    V = [],
    put = v => {
      P.push(v[0], 0, v[1]);
      C.push(v[2][0], v[2][1], v[2][2]);
    };
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++) {
      let x = -RG + i * S,
        z = -RG + j * S;
      const r = Math.hypot(x, z);
      if (r > RG) {
        x *= RG / r;
        z *= RG / r;
      }
      V.push([x, z, groundCol(x, z)]);
    }
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      if (Math.hypot(-RG + (i + 0.5) * S, -RG + (j + 0.5) * S) > RG + S) continue;
      const a = V[i + j * (N + 1)],
        b = V[i + 1 + j * (N + 1)],
        c = V[i + 1 + (j + 1) * (N + 1)],
        d = V[i + (j + 1) * (N + 1)];
      put(a);
      put(d);
      put(b);
      put(b);
      put(d);
      put(c);
    }
  low(add(flatGeo(P, C, 11), grassM));
  const sk = K.make(4).add(
    K.lathe(
      [
        [R_ISLE - 0.4, -0.2],
        [RG, 0]
      ],
      96
    ),
    { c: 0xb7ad7c, c2: 0xcbbd86, flat: false, jit: 0 }
  );
  low(add(K.geo(sk.bake({ jit: 0 }).ch.m), K.MAT.m));
}
// chemins de terre battue : bords irréguliers, milieu plus clair (là où passent les colonnes d'ennemis)
{
  const P = [],
    C = [],
    cc = [K.rgb(0x8d7046), K.rgb(0xb08d5e), K.rgb(0xc6a577)],
    OF = [-1, -0.58, 0, 0.58, 1],
    col = (x, z, k) => K.shade(cc[k], 0.9 + 0.2 * vn(x * 0.4 + 5, z * 0.4 + 9)),
    pt = (x, z, k, y) => {
      P.push(x, y || 0, z);
      const c = col(x, z, k);
      C.push(c[0], c[1], c[2]);
    },
    wob = (x, z) => PATH_HALF + 0.25 + (vn(x * 0.55 + 2, z * 0.55 + 8) - 0.5) * 0.9;
  for (const p of PATHS) {
    for (const g of p.seg) {
      const n = Math.max(1, Math.round(g.l / 1.6)),
        row = [];
      for (let k = 0; k <= n; k++) {
        const u = (g.l * k) / n,
          x = g.a[0] + g.dx * u,
          z = g.a[1] + g.dz * u,
          w = wob(x, z);
        row.push(
          OF.map((o, q) => {
            const s = q === 0 || q === 4 ? w * o : PATH_HALF * o;
            return [x - g.dz * s, z + g.dx * s, q === 0 || q === 4 ? 0 : q === 2 ? 2 : 1];
          })
        );
      }
      for (let k = 0; k < n; k++)
        for (let q = 0; q < 4; q++) {
          const a = row[k][q],
            b = row[k][q + 1],
            c = row[k + 1][q + 1],
            d = row[k + 1][q];
          pt(a[0], a[1], a[2]);
          pt(b[0], b[1], b[2]);
          pt(d[0], d[1], d[2]);
          pt(b[0], b[1], b[2]);
          pt(c[0], c[1], c[2]);
          pt(d[0], d[1], d[2]);
        }
      // rond-point à chaque coude, pour fermer l'angle entre deux tronçons
      for (let k = 0; k < 14; k++) {
        const a0 = (k / 14) * 6.2832,
          a1 = ((k + 1) / 14) * 6.2832,
          r0 = wob(g.a[0] + Math.cos(a0) * 2, g.a[1] + Math.sin(a0) * 2),
          r1 = wob(g.a[0] + Math.cos(a1) * 2, g.a[1] + Math.sin(a1) * 2);
        pt(g.a[0], g.a[1], 2, 0.012);
        pt(g.a[0] + Math.cos(a1) * r1, g.a[1] + Math.sin(a1) * r1, 0, 0.012);
        pt(g.a[0] + Math.cos(a0) * r0, g.a[1] + Math.sin(a0) * r0, 0, 0.012);
      }
    }
  }
  const m = low(
    add(
      flatGeo(P, C, 5),
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        map: tex(256, '#f2ede4', ['#ddd3c2', '#fffaf0', '#cdbfa8', '#e9e0d0'], 800, 1, 4.5, 1),
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -2
      })
    )
  );
  m.position.y = 0.06;
}
function label(txt, col) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(8,28,38,.78)';
  g.fillRect(0, 0, 256, 64);
  g.font = '700 38px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = col;
  g.fillText(txt, 128, 34);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) }));
  sp.scale.set(12, 3, 1);
  return sp;
}
