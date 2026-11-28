// ===================== DERNIER TOIT — l'affichage 3D (three.js r128 + kit K) : les outils communs =====================
// L'affichage est découpé en fichiers par sujet (liste et ordre : affichage/ordre.txt ; carte complète : affichage/LISEZMOI.md).
// Il ne fait que dessiner : il lit l'état de la partie S (règles, regles/) et ses événements S.ev, sans jamais rien y écrire.
// Ce fichier : les objets three.js partagés (renderer, scene, camera, lumières), l'état de l'affichage G, de petites courbes
// (lerp, ease…), la préparation des modèles (prepM, instM) et les réserves d'objets dessinés en masse (IPool).
// Attend : THREE (three.js r128, ou gfx/three-lite.js dans les tests), K (gfx/kit.js), MODELS (gfx/models/).
// Fournit à l'interface : camera (lue aussi par les sons), renderer et scene (lus par les tests).
//
// G : tout l'état de l'affichage (réserves, temps, secousses, objet en main…), rempli par gfxInit (boucle.js) et les xxxInit des autres
// fichiers. Ses champs gardent leurs noms d'origine : plusieurs tests les lisent (G.z, G.P, G.vm, G.vmFlash, G.tr, G.fl, G.flash…).
let renderer,
  scene,
  camera,
  hemi,
  sun,
  G = {};
// courbes : lerp de a à b ; ease = départ et arrivée en douceur ; easeO = arrivée en douceur ; easeB = dépasse un peu puis revient (rebond)
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const easeO = t => 1 - (1 - t) * (1 - t),
  easeB = t => {
    t -= 1;
    return 1 + t * t * (2.7 * t + 1.7);
  };
// matière additive (lueurs, éclairs, traçantes) : couleur c, presque opaque, n'écrit pas la profondeur
const matAdd = c =>
  new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
// un modèle de MODELS préparé par le kit (géométries cuites), gardé en cache par nom et par ctx (ex. prepM('volets', { open: '1' }))
const prepC = {};
function prepM(name, ctx) {
  const k = name + (ctx ? JSON.stringify(ctx) : '');
  if (!prepC[k]) {
    const rec = MODELS[name](Object.assign({ K }, ctx || {}));
    prepC[k] = K.prep(rec, rec.bake || {});
    prepC[k].rec = rec;
  }
  return prepC[k];
}
// une copie du modèle à poser dans la scène (pièces animées : o.userData.nodes ; K.pose(o, t) pour l'animer)
function instM(name, ctx, o) {
  return K.inst(prepM(name, ctx), o || { cast: false, recv: false });
}
// écrit dans a la matrice n° k (16 nombres) : position (x, y, z), cap (yaw, autour de Y) puis tangage (pitch, autour de X), échelles sx, sy, sz
function setM(a, k, x, y, z, yaw, pitch, sx, sy, sz) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch),
    o = k * 16;
  a[o] = c * sx;
  a[o + 1] = 0;
  a[o + 2] = -s * sx;
  a[o + 3] = 0;
  a[o + 4] = s * sp * sy;
  a[o + 5] = cp * sy;
  a[o + 6] = c * sp * sy;
  a[o + 7] = 0;
  a[o + 8] = s * cp * sz;
  a[o + 9] = -sp * sz;
  a[o + 10] = c * cp * sz;
  a[o + 11] = 0;
  a[o + 12] = x;
  a[o + 13] = y;
  a[o + 14] = z;
  a[o + 15] = 1;
}
// la même chose avec un roulis (rotation autour de l'axe Z de l'objet, appliquée en premier) : planches de biais, planches qui volent
function setMR(a, k, x, y, z, yaw, pitch, roll, sx, sy, sz) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch),
    cr = Math.cos(roll),
    sr = Math.sin(roll),
    o = k * 16;
  a[o] = (cr * c + sr * s * sp) * sx;
  a[o + 1] = sr * cp * sx;
  a[o + 2] = (sr * c * sp - cr * s) * sx;
  a[o + 3] = 0;
  a[o + 4] = (cr * s * sp - sr * c) * sy;
  a[o + 5] = cr * cp * sy;
  a[o + 6] = (sr * s + cr * c * sp) * sy;
  a[o + 7] = 0;
  a[o + 8] = s * cp * sz;
  a[o + 9] = -sp * sz;
  a[o + 10] = c * cp * sz;
  a[o + 11] = 0;
  a[o + 12] = x;
  a[o + 13] = y;
  a[o + 14] = z;
  a[o + 15] = 1;
}
// une réserve d'objets dessinés en masse : un seul maillage instancié (un seul appel de dessin), cap copies au plus.
// À chaque image : begin(), puis add(…) / addR(…) pour chaque copie (au-delà de cap, ignorées), puis end() (rien d'affiché si aucune).
// add : position, cap, tangage, échelles (sy et sz valent sx si absents) ; addR : avec un roulis en plus.
class IPool {
  constructor(geo, mat, cap) {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.frustumCulled = false;
    if (m.instanceMatrix.setUsage) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.m = m;
    this.a = m.instanceMatrix.array;
    this.cap = cap;
    this.n = 0;
    m.count = 0;
    m.visible = false;
    scene.add(m);
  }
  begin() {
    this.n = 0;
  }
  add(x, y, z, yaw, pitch, sx, sy, sz) {
    if (this.n >= this.cap) return;
    setM(this.a, this.n++, x, y, z, yaw, pitch, sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
  }
  addR(x, y, z, yaw, pitch, roll, sx, sy, sz) {
    if (this.n >= this.cap) return;
    setMR(this.a, this.n++, x, y, z, yaw, pitch, roll, sx, sy, sz);
  }
  end() {
    const im = this.m.instanceMatrix;
    this.m.count = this.n;
    this.m.visible = this.n > 0;
    if (this.n || this.last) {
      if (im.updateRange) {
        im.updateRange.offset = 0;
        im.updateRange.count = Math.max(16, this.n * 16);
      }
      im.needsUpdate = true;
    }
    this.last = this.n;
  }
}
