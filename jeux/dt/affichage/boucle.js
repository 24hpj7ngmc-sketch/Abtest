// ===================== DERNIER TOIT — l'affichage : mise en place et boucle d'image =====================
// gfxInit crée tout ce qui sera dessiné (une fois, au chargement), gfxFrame dessine une image, gfxResize suit la taille de l'écran.
// Ordre des xxxInit : celui de la création des objets three.js avant le découpage (il ne change rien à l'image, mais on le garde).
// Ordre des xxxFrame : celui d'avant le découpage, à garder : les effets qui tirent au hasard (Math.random) ou qui émettent des
// particules doivent passer dans le même ordre, et partStep (qui fait vivre les particules) après toutes les émissions de l'image.
// Attend des règles : l'état S (S.p le joueur, S.z les zombies, S.phase, S.left, S.dayTotal…) et eyeP (l'œil du joueur).
// Fournit à l'interface : gfxInit(canvas), gfxFrame(S, dt, V), gfxResize(largeur, hauteur) ; gfxEvent est dans evenements.js.
//   V = ce que la boucle de l'interface sait en plus de S : { sprint, tool (objet en main : fusil, pistolet, assaut, sniper, pompe, lance,
//   marteau, masse, leurre, frappe), scope (lunette : objet en main caché), hammer, aim (emplacement de tourelle visé, −1 sinon),
//   ptype (type de tourelle choisi au marteau), door (porte visée au marteau, −1 sinon), ads (en visée), zoom, bob, bobT (balancement de la marche) }
//   dt = 0 quand le jeu est en pause (menus) : l'image est redessinée sans que rien n'avance.
// Pour les tests : window.__cam = { x, y, z, yaw, pitch } place la caméra où l'on veut (l'objet en main est alors caché).

function gfxInit(cv) {
  K.init(THREE);
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc4dc);
  scene.fog = new THREE.Fog(0xa9c8d8, 45, 165);
  camera = new THREE.PerspectiveCamera(68, 1, 0.05, 420);
  camera.rotation.order = 'YXZ';
  scene.add(camera);
  hemi = new THREE.HemisphereLight(0xe2efff, 0x6a6a62, 0.72);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff0d2, 0.95);
  sun.position.set(60, 80, -40);
  scene.add(sun);
  scene.add(sun.target);
  decorInit(); // decor.js : ville, immeuble, volets, barricades, murs d'avenue
  zombiesInit(); // zombies.js : 8 tenues × 6 poses
  sangInit(); // particules.js : taches de sang
  particulesInit(); // particules.js : sang, étincelles, feu, fumée, poussière, plâtre, bois…
  cloisonsInit(); // cloisons.js : cloisons, trous, gravats, planches
  // une boîte de 1 m le long de z (de 0 à 1) : traçantes des balles et rayons laser des tourelles (la même géométrie)
  const boite = new THREE.BoxGeometry(1, 1, 1);
  boite.translate(0, 0, 0.5);
  tracantesInit(boite); // particules.js
  tourellesInit(boite); // tourelles.js : rayons laser
  flashInit(); // particules.js : éclairs d'explosion
  porteeInit(); // tourelles.js : portée de la tourelle visée au marteau
  ondeInit(); // decor.js : l'onde de choc
  marquesInit(); // tourelles.js : cercles des emplacements
  objetsInit(); // decor.js : hélicoptère, leurre, tyroliennes, boutiques
  mainsInit(); // armes.js : objets en main
  guideInit(); // guide.js : le Guide « Règles » sur le toit (V4.2)
  joueursInit(); // joueurs.js : les autres joueurs (multi, V4.3)
  // effets de caméra : coup de masse (mk), secousse (shake) ; horloge de l'affichage (time) ; heure du ciel (sky)
  G.mk = 0;
  G.time = 0;
  G.sky = 0;
  G.shake = 0;
}

function gfxResize(w, h) {
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// une image (ordre à garder, voir en tête)
function gfxFrame(S, dt, V) {
  cielFrame(S, dt);
  cameraFrame(S, dt, V);
  cloisonsSync(S);
  G.time += dt;
  const porte = cloisonsFrame(S, dt, V); // cloisons.js (renvoie la porte visée au marteau)
  zombiesFrame(S); // zombies.js : vivants et corps
  sangFrame(S); // particules.js
  tracantesFrame(dt); // particules.js
  tourellesFrame(S, dt); // tourelles.js
  projectilesFrame(S, dt); // tourelles.js : obus de mortier, missiles
  objetsFrame(S); // decor.js : leurre, boutiques, tyroliennes, hélicoptère
  grappinFrame(S); // armes.js : la corde du grappin (V4.7)
  guideFrame(S, dt); // guide.js : le Guide « Règles » (V4.2 ; aucun tirage au hasard)
  joueursFrame(S, dt); // joueurs.js : les autres joueurs (multi, V4.3 ; aucun tirage au hasard)
  decorFrame(S); // decor.js : volets, barricades, murs d'avenue
  porteeFrame(S, V); // tourelles.js : portée et emplacements (marteau en main)
  ondeFrame(dt); // decor.js
  flashFrame(dt); // particules.js
  feuxFrame(S); // particules.js : feux au sol (napalm…)
  hfxFrame(S, dt); // heros-image.js : effets des héros
  zvFrame(S, dt); // variantes.js : effets des variantes de zombies
  partStep(dt); // particules.js : toutes les particules émises avant avancent et sont dessinées
  const vm = mainsFrame(S, dt, V, porte); // armes.js : l'objet en main
  gunFx(S, dt, vm); // tirs.js : la pompe, la veilleuse et le jet du lance-flammes
  reculFrame(dt); // armes.js
  if (window.__cam) {
    const c = window.__cam;
    camera.position.set(c.x, c.y, c.z);
    camera.rotation.y = c.yaw;
    camera.rotation.x = c.pitch;
    for (const k in G.vm) G.vm[k].visible = false;
  }
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- le ciel
// trois ciels : après-midi (0), soir (1), nuit (2) ; skyMix(t) mélange les deux voisins (t de 0 à 2) : fond, brouillard, lumières
const SKY = [
  { bg: 0x9cc4dc, fog: 0xa9c8d8, h: 0.72, s: 0.95, sc: 0xfff0d2, hc: 0xe2efff },
  { bg: 0xe6a070, fog: 0xd89a78, h: 0.6, s: 0.8, sc: 0xffb070, hc: 0xffd0b0 },
  { bg: 0x2a3350, fog: 0x343c58, h: 0.42, s: 0.35, sc: 0x9ab0ff, hc: 0x8090c0 }
];
function skyMix(t) {
  const i = t < 1 ? 0 : 1,
    u = t < 1 ? t : t - 1,
    a = SKY[i],
    b = SKY[i + 1],
    melange = (x, y) => {
      const A = new THREE.Color(x),
        Bc = new THREE.Color(y);
      return A.lerp(Bc, u);
    };
  scene.background.copy(melange(a.bg, b.bg));
  scene.fog.color.copy(melange(a.fog, b.fog));
  hemi.intensity = lerp(a.h, b.h, u);
  sun.intensity = lerp(a.s, b.s, u);
  sun.color.copy(melange(a.sc, b.sc));
  hemi.color.copy(melange(a.hc, b.hc));
}
// l'après-midi en préparation, le soir tombe au fil de la horde, l'aube revient quand le jour est tenu (les héros teintent le ciel ensuite : hxCielFrame)
function cielFrame(S, dt) {
  let heure = 0;
  if (S.phase === 'day') heure = Math.min(2, 0.25 + 1.6 * (1 - S.left / Math.max(1, S.dayTotal)));
  else if (S.phase === 'clear' || S.phase === 'dead') heure = G.sky;
  G.sky += (heure - G.sky) * Math.min(1, dt * (S.phase === 'prep' ? 1.5 : 0.8));
  skyMix(G.sky);
}

// ---------------------------------------------------------------- la caméra
// à l'œil du joueur (suivi doux), secousses (G.shake : explosions, cloisons, masse…), recul de l'arme, coup de masse (G.mk),
// coup au départ du sprint ou du bond de Volt (G.kick) et sprint lissé (G.spk) : roulis au rythme des pas, champ de vision élargi
function cameraFrame(S, dt, V) {
  const p = S.p;
  G.shake = Math.max(0, G.shake - dt * 1.4);
  const secousse = G.shake * G.shake;
  G.mk = Math.max(0, G.mk - dt * 5);
  G.kick = Math.max(0, (G.kick || 0) - dt * 2.6);
  G.spk = lerp(G.spk || 0, V.sprint ? 1 : 0, Math.min(1, dt * 7));
  const oeil = eyeP(p);
  G.eye = G.eye || oeil.slice();
  for (let a = 0; a < 3; a++) G.eye[a] += (oeil[a] - G.eye[a]) * Math.min(1, dt * 12 + (dt ? 0 : 1));
  camera.position.set(
    G.eye[0] + (Math.random() - 0.5) * secousse * 0.6,
    G.eye[1] + (V.bob || 0) + (Math.random() - 0.5) * secousse * 0.6,
    G.eye[2] + (Math.random() - 0.5) * secousse * 0.6
  );
  camera.rotation.y = p.yaw;
  camera.rotation.x = p.pitch + G.recoil * 0.012 - G.mk * G.mk * 0.035 - Math.sin(G.kick * Math.PI) * 0.045;
  camera.rotation.z = Math.sin((V.bobT || 0) * 0.5) * 0.014 * G.spk;
  // champ de vision : 68° ; zoom de la visée ; +8° en sprint et un coup de +9° au départ
  const fov = V.zoom > 1 ? 68 / V.zoom : 68 + 8 * G.spk + 9 * Math.sin(Math.min(1, G.kick * 1.25) * Math.PI * 0.5) * G.kick;
  if (Math.abs(camera.fov - fov) > 0.1) {
    camera.fov = lerp(camera.fov, fov, Math.min(1, dt * 14));
    camera.updateProjectionMatrix();
  }
}
