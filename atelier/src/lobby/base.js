// [lobby/base.js] L'Île céleste, le lobby : sa scène à part (ciel, nuages, lumière, caméra), étiquettes, îlots lointains ; VISIT (visite chez un autre joueur).
// ---------- l'Île céleste : le lobby. Chaque joueur y bâtit son village, sculpte son relief, et part de là pour les mini-jeux ----------
// Une scène à part (sa lumière, son ciel, sa caméra). On s'y promène avec les mêmes commandes que dans les mini-jeux.
// VISIT (V10.5) : en visite sur l'île d'un autre joueur, save.vil et save.evo sont ceux de l'hôte le temps de la visite ; les siens attendent dans VISIT.mine. Voir « LE LOBBY À PLUSIEURS ».
const VISIT = (window.__visit = { on: false, mine: null, peer: '' });
const LSKY_F = `varying vec3 vDir;uniform vec3 sunDir;uniform float t;uniform vec3 cTop;uniform vec3 cMid;uniform vec3 cHor;uniform vec3 cAur;uniform vec3 cSun;uniform float kStar;
void main(){vec3 d=normalize(vDir);float h=d.y;
  vec3 col=mix(cMid,cTop,smoothstep(0.05,0.7,h));col=mix(cHor,col,smoothstep(-0.14,0.3,h));
  float s=max(dot(d,sunDir),0.0);col+=cSun*(pow(s,8.0)*0.28+pow(s,90.0)*0.7);
  col=mix(col,vec3(1.0,0.97,0.9),smoothstep(0.9988,0.9995,s));
  vec3 q=d*85.0,c=floor(q),f=fract(q)-0.5;float r=fract(sin(dot(c,vec3(12.9898,78.233,37.719)))*43758.5453);
  float st=step(0.982,r)*smoothstep(0.24,0.0,length(f))*(0.55+0.45*sin(t*2.0+r*90.0));
  col+=vec3(1.0,0.96,0.9)*st*smoothstep(0.02,0.4,h)*1.3*kStar;
  float au=sin(d.x*5.0+sin(d.z*3.0+t*0.2)*1.5)*0.5+0.5;
  col+=cAur*au*smoothstep(0.16,0.4,h)*smoothstep(0.8,0.42,h)*0.16;
  gl_FragColor=vec4(col,1.0);}`;
const LCLD_F = `varying vec3 vW;uniform float t;uniform vec3 fogCol;uniform vec3 cLo;uniform vec3 cHi;uniform vec3 cGl;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hh(i),hh(i+vec2(1.0,0.0)),f.x),mix(hh(i+vec2(0.0,1.0)),hh(i+vec2(1.0,1.0)),f.x),f.y);}
void main(){vec2 p=vW.xz*0.011+vec2(t*0.012,t*0.005);float v=nn(p)*0.5+nn(p*2.1+3.0)*0.3+nn(p*4.3+7.0)*0.2;
  vec3 col=mix(cLo,cHi,smoothstep(0.3,0.74,v));
  col=mix(col,cGl,smoothstep(0.62,0.9,v)*0.5);
  col=mix(col,fogCol,smoothstep(110.0,520.0,length(vW.xz)));
  gl_FragColor=vec4(col,1.0);}`;
const LFOG = 0xb9a0cf,
  LSUN = new THREE.Vector3(-0.42, 0.1, -0.9).normalize();
const lob = new THREE.Scene();
lob.background = new THREE.Color(LFOG);
lob.fog = new THREE.Fog(LFOG, 110, 680);
const lcam = new THREE.PerspectiveCamera(72, 1, 0.1, 900);
lcam.rotation.order = 'YXZ';
lob.add(lcam);
const lHemi = new THREE.HemisphereLight(0xd9dcff, 0x7a6aa0, 0.82),
  lSunL = new THREE.DirectionalLight(0xffe6cc, 0.78),
  lRimL = new THREE.DirectionalLight(0xff9d8a, 0.3);
lob.add(lHemi);
lSunL.position.set(60, 110, 90);
lob.add(lSunL);
lRimL.position.set(LSUN.x * 100, 30, LSUN.z * 100);
lob.add(lRimL);
const V3 = h => {
    const c = new THREE.Color(h);
    return new THREE.Vector3(c.r, c.g, c.b);
  },
  lskyU = {
    sunDir: { value: LSUN },
    t: { value: 0 },
    cTop: { value: V3(0x0f123d) },
    cMid: { value: V3(0x5447a3) },
    cHor: { value: V3(0xffbda3) },
    cAur: { value: V3(0x33bf9e) },
    cSun: { value: V3(0xffcc9e) },
    kStar: { value: 1 }
  },
  lsky = new THREE.Mesh(
    new THREE.SphereGeometry(700, 24, 12),
    new THREE.ShaderMaterial({
      uniforms: lskyU,
      vertexShader: SKY_V,
      fragmentShader: LSKY_F,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false
    })
  );
lsky.renderOrder = -10;
lsky.frustumCulled = false;
lob.add(lsky);
const lcldU = {
  t: { value: 0 },
  fogCol: { value: new THREE.Color(LFOG) },
  cLo: { value: V3(0x574f9e) },
  cHi: { value: V3(0xffdedb) },
  cGl: { value: V3(0xffc7a8) }
};
{
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(800, 40),
    new THREE.ShaderMaterial({ uniforms: lcldU, vertexShader: SEA_V, fragmentShader: LCLD_F })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = -34;
  m.renderOrder = -4;
  lob.add(m);
}
const llive = []; // modèles articulés du sanctuaire
const lput = (name, x, y, z, ry, ctx, key, par) => {
  const g = mdlOf(name, ctx, key, { cast: false });
  g.position.set(x, y, z);
  g.rotation.y = ry || 0;
  (par || lob).add(g);
  if (g.userData.prep.parts.some(q => q.anim)) llive.push(g);
  return g;
};
// étiquette à deux lignes, qu'on peut réécrire (niveau du héros, compte du butin…)
function lobLabel(w, h) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 128;
  const t = new THREE.CanvasTexture(c),
    sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sp.scale.set(w || 4.4, h || (w || 4.4) / 3, 1);
  sp.userData = { c, t, sig: '' };
  return sp;
}
const LLABS = new Set();
function lobText(sp, a, b, col) {
  const sig = a + '|' + b + '|' + col;
  if (sp.userData.sig === sig) return;
  sp.userData.sig = sig;
  sp.userData.args = [a, b, col];
  LLABS.add(sp);
  const c = sp.userData.c,
    g = c.getContext('2d');
  g.clearRect(0, 0, 384, 128);
  g.fillStyle = 'rgba(10,14,40,.74)';
  g.beginPath();
  const r = 22;
  g.moveTo(r, 6);
  g.arcTo(378, 6, 378, 122, r);
  g.arcTo(378, 122, 6, 122, r);
  g.arcTo(6, 122, 6, 6, r);
  g.arcTo(6, 6, 378, 6, r);
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 3;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = col;
  g.font = '700 ' + (b ? 50 : 58) + "px 'Chakra Petch',sans-serif";
  g.fillText(a, 192, b ? 46 : 66, 356);
  if (b) {
    g.fillStyle = '#ecf7f8';
    g.font = "600 30px 'Barlow',sans-serif";
    g.fillText(b, 192, 96, 356);
  }
  sp.userData.t.needsUpdate = true;
}

// îlots à la dérive et nuages autour de l'île
const lIsles = [
  [-78, 8, -84, 0],
  [86, -4, -48, 1],
  [64, 12, 82, 2],
  [-92, -8, 40, 1],
  [10, 20, -132, 2],
  [-40, 2, 104, 0],
  [116, 6, 20, 0]
].map((q, i) => {
  const g = lput('lob.ilot', q[0], q[1], q[2], i * 1.3, { v: q[3] }, q[3]);
  g.scale.multiplyScalar(1.6 + ((i * 37) % 10) / 12);
  return { g, y: q[1], ph: i * 1.7, p: q };
});
for (let i = 0; i < 16; i++) {
  const a = i * 2.4 + 0.5,
    r = 150 + ((i * 53) % 110),
    g = lput(i % 2 ? 'nat.nuage1' : 'nat.nuage2', Math.cos(a) * r, -14 - ((i * 31) % 14), Math.sin(a) * r, a);
  g.scale.multiplyScalar(2.2 + ((i * 17) % 10) / 6);
}
