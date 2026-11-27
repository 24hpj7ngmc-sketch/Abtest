// [affichage/scene.js] Le moteur de rendu de la page (renderer), les shaders partagés (ciel, mer de nuages, tourbillon des portails), les matières des lots, les modèles préparés (prepOf).
// ---------- scène ----------
const canvas = $('game'),
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
// shaders du ciel et de la mer (écrits comme pour THREE.ShaderMaterial r128)
const SKY_V = `varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const SEA_V = `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
// tourbillon des portails : bras en spirale qui tournent, cœur clair, bord fondu
const VTX_V = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const VTX_F = `varying vec2 vUv;uniform float t;uniform float on;
void main(){vec2 p=vUv*2.0-1.0;float r=length(p),a=atan(p.y,p.x);
  float s1=0.5+0.5*sin(a*3.0+r*8.0-t*2.2),s2=0.5+0.5*sin(a*5.0-r*13.0+t*3.1+1.7);
  float core=1.0-smoothstep(0.0,0.62,r),rim=1.0-smoothstep(0.84,1.0,r);
  vec3 col=mix(vec3(0.19,0.07,0.42),vec3(0.60,0.39,1.0),s1*0.75+s2*0.25);
  col=mix(col,vec3(1.0,0.87,1.0),core*(0.5+0.5*on));
  col+=vec3(0.55,0.34,0.95)*pow(s1*s2,3.0)*0.9;
  gl_FragColor=vec4(col,rim*(0.6+0.4*max(s1*s2,core)));}`;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
const PREP = new Map(); // modèles cuits, gardés tant qu'ils servent (une géométrie sert à tous les exemplaires)
function prepOf(name, ctx, key) {
  const id = name + '|' + (key === undefined ? '' : key);
  let p = PREP.get(id);
  if (!p) {
    const f = MODELS[name];
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
const elCtx = el => ({ el, P: K.EL[el] || K.EL.feu });
