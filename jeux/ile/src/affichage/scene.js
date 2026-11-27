// [affichage/scene.js] La scène 3D de la partie : matériaux du ciel et de la mer, caméra, lumières, modèles préparés par élément.
// ---------- scène ----------
const canvas = $('game'),
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
// shaders du ciel et de la mer (écrits comme pour THREE.ShaderMaterial r128)
const SKY_V = `varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const SKY_F = `varying vec3 vDir;uniform vec3 sunDir;uniform vec3 tint;
void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);
  vec3 col=mix(vec3(0.76,0.90,0.95),vec3(0.16,0.46,0.86),pow(h,0.5));
  col=mix(col,vec3(0.98,0.93,0.82),0.35*pow(1.0-h,6.0));
  float s=max(dot(d,sunDir),0.0);
  col+=vec3(1.0,0.90,0.66)*(pow(s,10.0)*0.22+pow(s,160.0)*0.7);
  col=mix(col,vec3(1.0,0.99,0.93),smoothstep(0.9990,0.9996,s));
  gl_FragColor=vec4(col*tint,1.0);}`;
const SEA_V = `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const SEA_F = `varying vec3 vW;uniform float t;uniform vec3 sunDir;uniform vec3 fogCol;uniform float shore;
vec2 wv(vec2 p,vec2 d,float k,float sp,float a){return d*(a*k*cos(k*dot(d,p)+sp*t));}
void main(){vec3 toC=cameraPosition-vW;float dist=length(toC);vec3 V=toC/dist;vec2 p=vW.xz;
  float fade=1.0/(1.0+dist*0.012);
  vec2 g=wv(p,vec2(0.80,0.60),0.21,1.1,0.55)+wv(p,vec2(-0.55,0.83),0.33,1.5,0.32)+wv(p,vec2(0.28,-0.96),0.74,2.1,0.13)
        +(wv(p,vec2(-0.91,-0.41),1.9,3.2,0.045)+wv(p,vec2(0.62,0.78),3.3,4.3,0.022)+wv(p,vec2(-0.2,0.98),5.1,5.6,0.012))*fade*1.6;
  vec3 n=normalize(vec3(-g.x,1.0,-g.y));
  float r=length(p);float sh=smoothstep(shore+70.0,shore,r);
  vec3 base=mix(vec3(0.03,0.27,0.46),vec3(0.10,0.58,0.64),sh);
  vec3 R=reflect(-V,n);R.y=abs(R.y);
  vec3 sky=mix(vec3(0.76,0.90,0.95),vec3(0.16,0.46,0.86),pow(R.y,0.5));
  float fres=0.04+0.80*pow(1.0-max(dot(n,V),0.0),4.0);
  vec3 col=mix(base,sky,fres);
  float s=max(dot(R,sunDir),0.0);
  col+=vec3(1.0,0.92,0.72)*(pow(s,260.0)*2.6+pow(s,28.0)*0.22);
  float ang=atan(p.y,p.x);
  float edge=r-shore+sin(t*0.9+ang*17.0)*0.9+sin(t*0.6-ang*41.0)*0.5;
  float foam=smoothstep(3.2,0.0,edge)*(0.86+0.14*sin(t*2.0+ang*37.0+r*1.3));
  foam+=0.35*smoothstep(1.4,0.0,abs(edge-6.0-2.0*sin(t*0.5)))*sh;
  col=mix(col,vec3(1.0),clamp(foam,0.0,1.0)*0.85);
  col=mix(col,fogCol,smoothstep(150.0,520.0,dist));
  gl_FragColor=vec4(col,1.0);}`;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// soleil : une seule direction pour la lumière, les ombres, le disque dans le ciel et le reflet sur la mer
const SUN = new THREE.Vector3(50, 46, -64).normalize(),
  HORIZON = 0xc2e6f2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(HORIZON);
scene.fog = new THREE.Fog(HORIZON, 120, 480);
const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 700);
camera.rotation.order = 'YXZ';
scene.add(camera);
const hemi = new THREE.HemisphereLight(0xe2efff, 0x8c9478, 0.68);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 1.0);
sun.position.set(SUN.x * 200, SUN.y * 200, SUN.z * 200);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.05;
{
  const c = sun.shadow.camera;
  c.left = -80;
  c.right = 80;
  c.top = 80;
  c.bottom = -80;
  c.near = 1;
  c.far = 460;
}
scene.add(sun);
scene.add(sun.target);
// tous les objets du jeu sont des modèles du kit : maillages colorés par sommet, quatre matières en tout (mate, brillante, lumineuse, lueur)
K.init(THREE);
const PAL = K.PAL,
  DUM = new THREE.Object3D();
// matières réservées aux lots (InstancedMesh) : on ne partage jamais une matière entre un lot et un objet simple, three.js choisit son programme d'après le premier dessiné
const MATI = {
  m: new THREE.MeshLambertMaterial({ vertexColors: true }),
  s: new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 55, specular: 0x9aa7b4 }),
  g: new THREE.MeshBasicMaterial({ vertexColors: true }),
  x: new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
};
// ce que le héros ne traverse pas : [rayon, hauteur, taille minimale] par modèle. Les buissons, l'herbe, les barrières et les lanternes se traversent.
const SOLR = {
    'nat.pin': [0.38, 9],
    'nat.arbre': [0.42, 9],
    'nat.arbreMort': [0.3, 5],
    'nat.rocherMousse': [1.45, 2.5],
    'nat.rocher': [0.62, 0.95, 1.05],
    'set.statue': [0.95, 5],
    'set.colonne': [0.62, 3.2],
    'set.caisses': [0.85, 1.7]
  },
  SOL = [[0, 0, 4.95, 99]];
const PREP = new Map(); // modèles cuits, gardés tant qu'ils servent (une géométrie sert à tous les exemplaires)
const ALT = {
  'enemy.dig': 'enemy.tank',
  'boss.1': 'enemy.tank',
  'boss.2': 'enemy.rng',
  'boss.3': 'enemy.ste',
  'tower.canon': 'tower.mortier',
  'tower.archer': 'tower.mortier'
}; // tant qu'un modèle manque, un proche parent le remplace
function prepOf(name, ctx, key) {
  const id = name + '|' + (key === undefined ? '' : key);
  let p = PREP.get(id);
  if (!p) {
    const f = MODELS[name] || MODELS[ALT[name]];
    let rec = null;
    try {
      rec = f ? f(ctx || {}) : null;
      if (rec) p = K.prep(rec, typeof rec.bake === 'function' ? {} : rec.bake || {});
    } catch (e) {
      (window.__mdlErr = window.__mdlErr || []).push(name + ' : ' + e.message);
      p = null;
    }
    if (!p) p = K.prep(K.make(1).add(K.box(1, 1, 1, 0.8, 0.8), { p: [0, 0.5, 0], c: PAL.stone }), {});
    p.id = id;
    p.use = 0;
    PREP.set(id, p);
  }
  return p;
}
function prepFree(p) {
  if (--p.use > 0) return;
  for (const q of p.parts) for (const k in q.gs) q.gs[k].dispose();
  PREP.delete(p.id);
}
const elCtx = el => ({ el, P: K.EL[el] || K.EL.feu });
// les ennemis du Vent (V2.1) : la palette du Vent sur l'allure des ennemis de l'Eau (leurs modèles n'ont pas encore de décor « vent » à eux)
const elCtxE = el => (el === 'vent' ? { el: 'eau', P: K.EL.vent } : elCtx(el));
