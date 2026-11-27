// ===================== DERNIER TOIT — l'affichage : les autres joueurs (multi, V4.3) =====================
// Chaque entrée de joueursDistants() (interface/multi.js : { id, nom, heros, arme, x, y, z, yaw, pitch, tire, aTerre }, positions déjà
// lissées ; y = hauteur des pieds ; yaw 0 = regarde vers −Z, comme le joueur local) est dessinée à chaque image :
// - le corps : le gardien de L'Île des Cinq vu par ses coéquipiers (MODELS['hero.avatar'], gfx/models/mains.js, avec ses motifs
//   SH de gfx/models/shared.js, repris tel quel de l'atelier du lobby), aux couleurs de l'élément du héros. La recette
//   'joueur.corps' ci-dessous en détache les deux jambes (pour la marche) et retire le pistolet à cristal de sa main droite ;
// - son arme en main : le modèle vm.<arme> (gfx/models/mains.js), gants et manches aux couleurs du héros, tenue à deux mains et
//   pointée selon yaw et pitch ; marche (jambes, bras qui suivent l'arme, petit rebond) quand il se déplace, immobile sinon ;
//   couché sur le dos quand il est tombé (aTerre) ;
// - son nom au-dessus de la tête : une étiquette toujours tournée vers la caméra (canevas, comme celle du Guide), fond nuit,
//   liseré et nom à la couleur de l'élément, de taille constante à l'écran (lisible sur 966 × 366, de près comme de loin) ;
// - quand il tire : un éclair de bouche et une courte traînée dans la direction du regard, au rythme de son arme ; le lance-flammes
//   fait un jet orange continu.
// Aucun tirage au hasard (les autres effets de l'image restent identiques) ; aucune allocation pendant une image quand rien ne
// change (les objets d'un joueur sont créés à son arrivée, ou quand son héros ou son arme change).
// À son départ (absent de la liste), on retire ses objets de la scène et on libère ce qui n'appartient qu'à lui (le canevas de
// l'étiquette : texture et matière). Les géométries du corps et des armes restent dans le cache du kit (prepM : une par héros et
// une par arme, partagées) et celles de l'éclair et de la traînée sont communes (JR) : rien ne s'accumule.
// Attend : joueursDistants (interface/multi.js ; absente = aucun joueur), HEROS (règles, couleur des héros), camera, scene, prepM,
// instM, matAdd, G.time ; MODELS['hero.avatar'], MODELS['vm.…'].
// Fournit : MODELS['joueur.corps'], joueursInit (gfxInit), joueursFrame (gfxFrame) ; G.joueurs (les joueurs dessinés, lus par
// tests/joueurstest.js : { id, nom, heros, arme, root, lab, flash, trait, … }).

// JOUEURS_MAX : au plus tant de joueurs dessinés (la liste n'est pas fiable) ; JOUEUR_LAB : taille de l'étiquette (m), hauteur de son
// milieu au-dessus des pieds (debout, couché), distance (m) à laquelle elle a cette taille : elle garde ensuite la même taille à
// l'écran (lettres hautes de ≈ 17 px sur 966 × 366), sans devenir plus petite que min ni plus grande que max fois
const JOUEURS_MAX = 8,
  JOUEUR_LAB = { w: 1.8, h: 0.45, y: 2.25, yTerre: 0.6, vue: 4.5, min: 0.5, max: 10 },
  JOUEUR_HEROS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'],
  // par arme : t = temps entre deux coups (s), L = longueur de la traînée (m), w = son épaisseur (m) ; le lance-flammes : un jet continu
  JOUEUR_ARMES = {
    fusil: { t: 0.15, L: 30, w: 0.03 },
    pistolet: { t: 0.3, L: 24, w: 0.03 },
    assaut: { t: 0.09, L: 30, w: 0.03 },
    sniper: { t: 0.9, L: 60, w: 0.045 },
    pompe: { t: 0.85, L: 12, w: 0.06 },
    lance: { t: 0, L: 3.2, w: 0.14, jet: true }
  },
  // l'éclair de bouche reste visible tant de secondes à chaque coup, la traînée tant de secondes (elle file vers l'avant)
  JOUEUR_ECLAIR = 0.05,
  JOUEUR_TRAIT = 0.07;
// l'état des joueurs dessinés : l (la liste, aussi G.joueurs), n (numéro de l'image, pour repérer les absents), les géométries et
// matières communes (traînée, jet, éclair), un vecteur de calcul
const JR = { l: [], n: 0 };

// ---------------------------------------------------------------- le modèle du corps
// Le gardien (hero.avatar, ≈ 1,8 m, origine aux pieds, regarde vers −Z), sans y toucher : ses 8 premières pièces sont les jambes
// (b.sym : jambe droite x > 0 puis jambe gauche), elles deviennent les pièces legR et legL (pivot aux hanches) ; les 5 dernières
// pièces du bras droit sont son pistolet à cristal, retirées (le joueur tient sa vraie arme). Graines 1311 et 1312 (neuves).
MODELS['joueur.corps'] = ctx => {
  const el = JOUEUR_HEROS.indexOf(ctx.el) >= 0 ? ctx.el : 'feu',
    r = MODELS['hero.avatar']({ P: K.EL[el], el }),
    corps = r.parts[0].b,
    brasD = r.parts[2].b,
    jG = K.make(1311),
    jD = K.make(1312),
    jambes = corps.items.splice(0, 8);
  for (let i = 0; i < 4; i++) jD.items.push(jambes[i]);
  for (let i = 4; i < 8; i++) jG.items.push(jambes[i]);
  brasD.items.splice(4);
  return {
    parts: [
      { name: 'body', b: corps },
      { name: 'legL', b: jG, parent: 'body', pivot: [-0.11, 0.76, 0] },
      { name: 'legR', b: jD, parent: 'body', pivot: [0.11, 0.76, 0] },
      { name: 'armL', b: r.parts[1].b, parent: 'body', pivot: [-0.3, 1.42, 0] },
      { name: 'armR', b: brasD, parent: 'body', pivot: [0.3, 1.42, 0] }
    ],
    bake: r.bake
  };
};

// ---------------------------------------------------------------- mise en place
function joueursInit() {
  JR.l = [];
  JR.n = 0;
  // traînée : une boîte de 1 m le long de z (de 0 à 1) ; jet du lance-flammes : une boule allongée le long de z (de 0 à 2)
  JR.boite = new THREE.BoxGeometry(1, 1, 1);
  JR.boite.translate(0, 0, 0.5);
  JR.boule = new THREE.IcosahedronGeometry(1, 1);
  JR.boule.translate(0, 0, 1);
  JR.eclat = new THREE.IcosahedronGeometry(0.05, 0);
  JR.matTrait = matAdd(0xffe9a0);
  JR.matJet = matAdd(0xff8a30);
  JR.matJet.opacity = 0.5;
  JR.matEclat = matAdd(0xffd070);
  JR.matEclatJet = matAdd(0xffa040);
  JR.v = new THREE.Vector3();
  G.joueurs = JR.l;
  // les polices de la page arrivent après coup : les étiquettes se redessinent quand elles sont là
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(
      () => {
        for (const r of JR.l) joueurTexte(r);
      },
      () => {}
    );
}

// ---------------------------------------------------------------- petits outils
// un nombre fini, sinon d (la liste n'est pas fiable)
const joueurNb = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
// le nom affiché : texte sans caractères de contrôle, 12 caractères au plus (déjà nettoyé par l'interface : par sécurité)
function joueurNom(n) {
  const s = Array.from(String(n === undefined || n === null ? '' : n).replace(/[\u0000-\u001f\u007f-\u009f]/g, ''))
    .slice(0, 12)
    .join('')
    .trim();
  return s || 'Joueur';
}
// couleurs des manches et des gants de son arme, comme celles du joueur local (interface/menu.js, heroGear)
function joueurGants(h) {
  const c = typeof HEROS !== 'undefined' && HEROS[h] && HEROS[h].c ? parseInt(HEROS[h].c.slice(1), 16) : K.EL[h].main,
    manche = K.mix(c, 0x30353b, 0.5);
  return { sleeve: K.hex(manche), sleeveD: K.hex(K.shade(manche, 0.65)), glove: 0x3a3732, gloveD: 0x24221f };
}
// l'étiquette : un canevas de 384 × 96 (fond nuit, liseré et nom à la couleur de l'élément, V4.8 : le rôle dessous), comme celle du Guide
function joueurTexte(r) {
  const c = r.lab.userData.c,
    g = c.getContext('2d'),
    E = K.EL[r.heros],
    rr = 20,
    hexa = v => '#' + ('00000' + v.toString(16)).slice(-6);
  g.clearRect(0, 0, 384, 96);
  // V4.8 : le nom, et dessous le rôle du héros (« Tireur ») à la couleur de l'élément
  const role = typeof HEROS !== 'undefined' && HEROS[r.heros] ? HEROS[r.heros].role : '';
  g.font = "700 26px 'Chakra Petch',sans-serif";
  const lr = role ? g.measureText(role).width : 0;
  g.font = '700 ' + (role ? 44 : 54) + "px 'Chakra Petch',sans-serif";
  // le cadre épouse le nom (centré, de 120 à 374 px de large)
  const lg = Math.max(120, Math.min(374, Math.max(g.measureText(r.nom).width, lr) + 48)),
    x0 = 192 - lg / 2,
    x1 = 192 + lg / 2;
  g.fillStyle = 'rgba(10,14,40,.74)';
  g.beginPath();
  g.moveTo(x0 + rr, 5);
  g.arcTo(x1, 5, x1, 91, rr);
  g.arcTo(x1, 91, x0, 91, rr);
  g.arcTo(x0, 91, x0, 5, rr);
  g.arcTo(x0, 5, x1, 5, rr);
  g.fill();
  g.strokeStyle = hexa(E.main);
  g.lineWidth = 4;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = hexa(E.light);
  g.fillText(r.nom, 192, role ? 38 : 50, 340);
  if (role) {
    g.font = "700 26px 'Chakra Petch',sans-serif";
    g.fillStyle = hexa(E.main);
    g.fillText(role, 192, 74, 340);
  }
  r.lab.userData.t.needsUpdate = true;
  r.labH = r.heros;
}

// ---------------------------------------------------------------- arrivée, changements, départ
// un joueur qui arrive : son étiquette, son éclair, sa traînée (le corps et l'arme viennent avec son héros et son arme)
function joueurAjoute(e) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 96;
  const t = new THREE.CanvasTexture(c),
    lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })),
    trait = new THREE.Mesh(JR.boite, JR.matTrait),
    flash = new THREE.Mesh(JR.eclat, JR.matEclat);
  lab.userData = { c, t };
  trait.rotation.order = 'YXZ';
  trait.visible = false;
  flash.visible = false;
  scene.add(lab);
  scene.add(trait);
  const r = {
    id: e.id,
    nom: null,
    heros: null,
    labH: null,
    arme: null,
    root: null,
    nodes: null,
    visee: null,
    gun: null,
    tip: null,
    lab,
    trait,
    flash,
    x: joueurNb(e.x, 0),
    z: joueurNb(e.z, 0),
    ph: 0,
    w: 0,
    couche: e.aTerre ? 1 : 0,
    tirT: 0,
    tirait: false,
    vu: 0
  };
  JR.l.push(r);
  return r;
}
// son corps (au premier passage et quand son héros change) : le gardien à la couleur de l'élément, et le pivot de visée
// (à l'épaule droite, tourné selon pitch) qui porte l'arme ; l'arme est refaite ensuite (ses gants suivent le héros)
function joueurCorps(r, h) {
  if (r.root) scene.remove(r.root);
  r.heros = h;
  r.root = instM('joueur.corps', { el: h });
  r.root.rotation.order = 'YXZ';
  r.nodes = r.root.userData.nodes;
  r.nodes.armL.rotation.order = r.nodes.armR.rotation.order = 'YXZ';
  r.visee = new THREE.Group();
  r.visee.position.set(0.12, 1.4, 0);
  r.root.add(r.visee);
  scene.add(r.root);
  r.arme = null;
}
// son arme (au premier passage et quand elle change) : vm.<arme> un peu réduite, la poignée devant l'épaule droite ; l'éclair à la bouche
function joueurArme(r, a) {
  if (r.gun) r.visee.remove(r.gun);
  const pr = prepM('vm.' + a, { H: joueurGants(r.heros) }),
    A = JOUEUR_ARMES[a];
  r.arme = a;
  r.gun = K.inst(pr, { cast: false, recv: false });
  r.gun.scale.setScalar(0.9);
  r.gun.position.set(0.07, -0.06, -0.42);
  r.visee.add(r.gun);
  r.tip = pr.tip || [0, 0.06, -0.5];
  r.gun.add(r.flash);
  r.flash.position.set(r.tip[0], r.tip[1], r.tip[2]);
  r.flash.material = A.jet ? JR.matEclatJet : JR.matEclat;
  r.trait.geometry = A.jet ? JR.boule : JR.boite;
  r.trait.material = A.jet ? JR.matJet : JR.matTrait;
}
// un joueur parti : ses objets quittent la scène ; son étiquette (canevas, texture, matière) est libérée
function joueurRetire(i) {
  const r = JR.l[i];
  if (r.root) scene.remove(r.root);
  scene.remove(r.lab);
  scene.remove(r.trait);
  r.lab.material.map.dispose();
  r.lab.material.dispose();
  JR.l.splice(i, 1);
}

// ---------------------------------------------------------------- une image
function joueursFrame(S, dt) {
  let liste = null;
  // la liste vient d'un autre fichier (et du réseau) : une erreur là-bas ne doit pas arrêter l'image
  try {
    liste = typeof joueursDistants === 'function' ? joueursDistants() : null;
  } catch (_) {
    liste = null;
  }
  JR.n++;
  const n = liste && liste.length ? Math.min(liste.length, JOUEURS_MAX) : 0;
  for (let i = 0; i < n; i++) {
    const e = liste[i];
    if (!e || (typeof e.id !== 'string' && typeof e.id !== 'number')) continue;
    let r = null;
    for (let k = 0; k < JR.l.length; k++) if (JR.l[k].id === e.id) r = JR.l[k];
    if (r && r.vu === JR.n) continue;
    if (!r) r = joueurAjoute(e);
    r.vu = JR.n;
    joueurPose(r, e, dt);
  }
  for (let i = JR.l.length - 1; i >= 0; i--) if (JR.l[i].vu !== JR.n) joueurRetire(i);
}
// un joueur : héros, arme et nom à jour, puis la pose (place, marche, visée, chute), l'étiquette, l'éclair et la traînée
function joueurPose(r, e, dt) {
  const h = JOUEUR_HEROS.indexOf(e.heros) >= 0 ? e.heros : 'feu',
    a = Object.prototype.hasOwnProperty.call(JOUEUR_ARMES, e.arme) ? e.arme : 'fusil';
  if (h !== r.heros) joueurCorps(r, h);
  if (a !== r.arme) joueurArme(r, a);
  const nom = joueurNom(e.nom);
  if (nom !== r.nom || r.labH !== r.heros) {
    r.nom = nom;
    joueurTexte(r);
  }
  const x = joueurNb(e.x, r.x),
    y = joueurNb(e.y, 0),
    z = joueurNb(e.z, r.z),
    yaw = joueurNb(e.yaw, 0),
    pitch = Math.max(-1.2, Math.min(1.2, joueurNb(e.pitch, 0))),
    tombe = !!e.aTerre;
  // la marche : vitesse au sol d'après le déplacement de l'image (un saut de plus de 3 m = une téléportation, pas un pas)
  let pas = Math.hypot(x - r.x, z - r.z);
  if (pas > 3) pas = 0;
  r.x = x;
  r.z = z;
  if (dt > 0) {
    const marche = !tombe && pas / dt > 0.5 ? 1 : 0;
    r.w += (marche - r.w) * Math.min(1, dt * 8);
    r.couche += ((tombe ? 1 : 0) - r.couche) * Math.min(1, dt * 6);
    r.ph += pas * 2.6;
  }
  const k = r.couche,
    debout = 1 - k,
    s = Math.sin(r.ph),
    w = r.w * debout,
    N = r.nodes,
    R = r.root;
  // couché sur le dos (rotation de π/2 autour de x : la tête part derrière lui, le visage vers le ciel), un peu relevé
  R.position.set(x, y + Math.abs(Math.cos(r.ph)) * 0.05 * w + k * 0.22, z);
  R.rotation.set(k * Math.PI * 0.5, yaw, 0);
  N.legL.rotation.x = s * 0.55 * w;
  N.legR.rotation.x = -s * 0.55 * w;
  // l'arme suit pitch ; les bras la tiennent (main droite à la poignée, main gauche devant) ; couché : l'arme sur la poitrine
  r.visee.rotation.x = pitch * debout - 1.4 * k;
  const bras = (Math.PI * 0.5 + pitch * 0.9) * debout;
  N.armR.rotation.set(bras - 0.18 * debout, 0.25 * debout, 0);
  N.armL.rotation.set(bras - 0.12 * debout + s * 0.05 * w, -0.62 * debout, 0);
  // l'étiquette : au-dessus de la tête (couché : au-dessus de sa poitrine), de taille constante à l'écran pour rester lisible
  const lx = x + Math.sin(yaw) * 0.9 * k,
    ly = y + JOUEUR_LAB.y * debout + JOUEUR_LAB.yTerre * k,
    lz = z + Math.cos(yaw) * 0.9 * k,
    d = Math.hypot(lx - camera.position.x, ly - camera.position.y, lz - camera.position.z),
    g = Math.min(JOUEUR_LAB.max, Math.max(JOUEUR_LAB.min, d / JOUEUR_LAB.vue));
  r.lab.position.set(lx, ly, lz);
  r.lab.scale.set(JOUEUR_LAB.w * g, JOUEUR_LAB.h * g, 1);
  joueurTir(r, !!e.tire && !tombe, yaw, pitch, dt);
}
// le tir : un coup tous les A.t secondes tant qu'il tire (le premier tout de suite) ; à chaque coup, l'éclair de bouche
// (JOUEUR_ECLAIR s) et la traînée qui file vers l'avant (JOUEUR_TRAIT s) ; le lance-flammes : jet et lueur continus, qui vacillent
function joueurTir(r, tire, yaw, pitch, dt) {
  const A = JOUEUR_ARMES[r.arme];
  if (!tire) {
    r.tirait = false;
    r.flash.visible = r.trait.visible = false;
    return;
  }
  if (!r.tirait) r.tirT = 0;
  else r.tirT += dt;
  r.tirait = true;
  const t = A.jet ? 0 : r.tirT % A.t,
    vac = 0.5 + 0.5 * Math.sin(G.time * 47 + r.ph),
    eclair = A.jet || t < JOUEUR_ECLAIR,
    trait = A.jet || t < JOUEUR_TRAIT;
  r.flash.visible = eclair;
  if (eclair) r.flash.scale.setScalar(A.jet ? 2.2 + vac : r.arme === 'pompe' ? 3.2 : 2.2 + vac * 0.6);
  r.trait.visible = trait;
  if (!trait) return;
  // bout du canon dans le monde, direction du regard
  r.root.updateMatrixWorld(true);
  const o = JR.v.set(r.tip[0], r.tip[1], r.tip[2]).applyMatrix4(r.gun.matrixWorld),
    cp = Math.cos(pitch),
    dx = -Math.sin(yaw) * cp,
    dy = Math.sin(pitch),
    dz = -Math.cos(yaw) * cp,
    u = A.jet ? 0 : t / JOUEUR_TRAIT,
    L = A.jet ? A.L * (0.85 + 0.15 * vac) : A.L;
  r.trait.position.set(o.x + dx * L * u * 0.6, o.y + dy * L * u * 0.6, o.z + dz * L * u * 0.6);
  r.trait.rotation.y = Math.atan2(dx, dz);
  r.trait.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz));
  if (A.jet) r.trait.scale.set(A.w * (0.8 + 0.3 * vac), A.w * (0.8 + 0.3 * vac), L * 0.5);
  else r.trait.scale.set(A.w, A.w, L * 0.4);
}
