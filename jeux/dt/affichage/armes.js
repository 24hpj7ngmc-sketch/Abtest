// ===================== DERNIER TOIT — l'affichage : l'objet en main =====================
// Les objets tenus devant la caméra (modèles de gfx/models/mains.js) : les 6 armes à feu (fusil, pistolet, assaut, sniper, pompe, lance),
// le marteau, la masse, le leurre, la radio de la frappe aérienne. Changement d'objet (il descend puis remonte), visée (l'arme vient sur
// le réticule), balancement de la marche, recul, sprint (arme baissée, de travers), objet qui recule près d'un mur, coup de masse,
// coups de marteau sur les planches. Les effets des tirs (éclair de bouche, pompe, lance-flammes) sont dans tirs.js.
// Attend des règles : S.p, S.swing, S.swingT (coup de masse), S.plankT (planche en cours), viewDir, rayWall ; de l'interface : V.tool, V.ads,
// V.scope, V.bobT, et l'appel gfxGuns(couleurs) quand le héros change (interface : heroGear).
// Fournit : gfxGuns (interface), mainsInit (gfxInit), mainsFrame et reculFrame (gfxFrame), G.vm / G.vmCur / G.tip / G.aimP / G.vmPos (lus par tirs.js et les tests).

// les objets en main (cachés), leurs poses de repos [x, y, z, rx, ry, rz], puis les armes à feu (gfxGuns) et l'éclair de bouche
function mainsInit() {
  G.vm = {};
  for (const [k, n] of [
    ['marteau', 'vm.marteau'],
    ['masse', 'vm.masse'],
    ['leurre', 'vm.leurre'],
    ['frappe', 'vm.radio'],
    ['grappin', 'vm.grappin'] // V4.7
  ]) {
    const o = instM(n);
    o.visible = false;
    camera.add(o);
    G.vm[k] = o;
  }
  G.vmPos = {
    marteau: [0.3, -0.28, -0.5, -0.12, -0.1, -0.12],
    masse: MS_REST,
    leurre: [0.26, -0.22, -0.42, 0.2, 0.3, 0],
    frappe: [0.25, -0.22, -0.4, 0.2, 0.4, 0],
    grappin: [0.24, -0.24, -0.42, 0.04, 0.06, 0]
  };
  // V4.7 : la corde du grappin (une boîte étirée, de la main au crochet) et le crochet planté
  {
    const bo = new THREE.BoxGeometry(1, 1, 1);
    bo.translate(0, 0, 0.5);
    G.corde = new IPool(bo, new THREE.MeshLambertMaterial({ color: 0x2b2420 }), 1);
    G.crochet = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshLambertMaterial({ color: 0xc8ccd0 }));
    G.crochet.visible = false;
    scene.add(G.crochet);
    G.v3b = new THREE.Vector3();
  }
  G.recoil = 0;
  G.swap = 0;
  G.vmCur = '';
  // les six armes à feu (modèles modernes de mains.js) : pose à la hanche, visée et bout du canon viennent de leur recette ; gants et manches aux couleurs de G.H
  G.gun = { fusil: 1, pistolet: 1, assaut: 1, sniper: 1, pompe: 1, lance: 1 };
  G.tip = {};
  G.aimP = {};
  // V3.9 : jet du lance-flammes en cours (fl), temps depuis le dernier coup de fusil à pompe (pump), vecteur de travail, numéro d'image
  G.fl = { t: 0, L: 10, wall: 0, n: 0, acc: 0, acs: 0 };
  G.pump = { t: 9 };
  G.v3 = new THREE.Vector3();
  G.fr = 0;
  G.vmFlash = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), matAdd(0xffd070));
  G.vmFlash.visible = false;
  gfxGuns(G.H);
  G.vm.fusil.add(G.vmFlash);
  G.vmFlash.position.set(G.tip.fusil[0], G.tip.fusil[1], G.tip.fusil[2]);
}
// V4.7 : pendant la traction du grappin (S.p.clb.gr : le point d'accroche), la corde va du bout du grappin au crochet
function grappinFrame(S) {
  const c = S.p.clb,
    gr = c && c.gr;
  G.corde.begin();
  G.crochet.visible = !!gr;
  if (gr) {
    const vm = G.vm.grappin,
      v = G.v3b;
    if (vm && vm.visible && vm.localToWorld) {
      v.set(0, 0.08, -0.36);
      vm.localToWorld(v);
    } else v.set(camera.position.x, camera.position.y - 0.3, camera.position.z);
    const dx = gr[0] - v.x,
      dy = gr[1] - v.y,
      dz = gr[2] - v.z;
    G.corde.add(v.x, v.y, v.z, Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)), 0.03, 0.03, Math.hypot(dx, dy, dz));
    G.crochet.position.set(gr[0], gr[1], gr[2]);
  }
  G.corde.end();
}
// les armes en main aux couleurs du héros : hc = {sleeve, sleeveD, glove, gloveD} (0xrrggbb ou '#rrggbb' ; rien = gris neutres).
// À rappeler quand le héros change. Les armes, le marteau et la masse sont refaits (gants et manches), l'objet en main reste visible.
function gfxGuns(hc) {
  G.H = hc || null;
  for (const k in G.gun) {
    const pr = prepM('vm.' + k, hc ? { H: hc } : null),
      old = G.vm[k],
      o = K.inst(pr, { cast: false, recv: false });
    o.visible = old ? old.visible : false;
    if (old) {
      camera.remove(old);
      if (G.vmFlash.parent === old) o.add(G.vmFlash);
    }
    camera.add(o);
    G.vm[k] = o;
    G.tip[k] = pr.tip || [0, 0.06, -0.3];
    G.aimP[k] = pr.aim || [0, -0.1, -0.4];
    G.vmPos[k] = pr.hold || [0.22, -0.2, -0.5, 0, 0, 0];
  }
  for (const k of ['marteau', 'masse']) {
    const o = K.inst(prepM('vm.' + k, hc ? { H: hc } : null), { cast: false, recv: false }),
      old = G.vm[k];
    o.visible = old ? old.visible : false;
    if (old) camera.remove(old);
    camera.add(o);
    G.vm[k] = o;
  }
  if (G.gun[G.vmCur]) {
    const t = G.tip[G.vmCur];
    G.vmFlash.position.set(t[0], t[1], t[2]);
  }
}
// l'objet en main à chaque image : changement (descend puis remonte), pose (repos ou visée), balancement, recul, masse, marteau, sprint, mur ;
// renvoie l'objet en main (ou undefined)
function mainsFrame(S, dt, V, porte) {
  const p = S.p;
  if (V.tool !== G.vmCur && G.vmNext !== V.tool) {
    G.vmNext = V.tool;
    G.swap = G.vmCur ? Math.max(G.swap, 0) : 1;
  }
  if (G.vmNext) {
    G.swap += dt * 7;
    if (G.swap >= 1) {
      for (const k in G.vm) G.vm[k].visible = false;
      G.vmCur = G.vmNext;
      G.vmNext = null;
      G.swap = -1;
      if (G.gun[G.vmCur]) {
        G.vm[G.vmCur].add(G.vmFlash);
        const t = G.tip[G.vmCur];
        G.vmFlash.position.set(t[0], t[1], t[2]);
      }
    }
  } else if (G.swap < 0) G.swap = Math.min(0, G.swap + dt * 6);
  const vm = G.vm[G.vmCur];
  if (vm) {
    vm.visible = !V.scope;
    const pose = G.vmPos[G.vmCur],
      vise = V.ads && G.gun[G.vmCur] ? 1 : 0,
      baisse = Math.abs(G.swap) * 0.35,
      poseVisee = G.aimP[G.vmCur] || G.aimP.fusil;
    G.ads = lerp(G.ads || 0, vise, Math.min(1, dt * 12));
    // en visée, pas de balancement : la ligne de mire reste sur le réticule
    const balance = 1 - G.ads;
    vm.position.set(
      lerp(pose[0], poseVisee[0], G.ads) + Math.sin((V.bobT || 0) * 0.5) * 0.008 * balance,
      lerp(pose[1], poseVisee[1], G.ads) - baisse + Math.abs(Math.cos((V.bobT || 0) * 0.5)) * 0.006 * balance,
      lerp(pose[2], poseVisee[2], G.ads) + G.recoil * 0.035
    );
    vm.rotation.set(pose[3] * (1 - G.ads) + G.recoil * 0.06, pose[4] * (1 - G.ads), pose[5] * (1 - G.ads));
    if (G.vmCur === 'masse') masseAnim(vm, S);
    else if (G.vmCur === 'marteau' && porte && S.plankT > 0) hammerTap(vm, S);
    // en sprint : l'arme baissée, de travers, qui balance (moins pendant un coup de masse)
    if (G.spk > 0.01 && !(G.ads > 0.05)) {
      const course = G.spk * (1 - 0.6 * (S.swing > 0 ? 1 : 0));
      vm.position.x += 0.05 * course;
      vm.position.y -= 0.07 * course + Math.abs(Math.sin((V.bobT || 0) * 0.5)) * 0.02 * course;
      vm.position.z += 0.05 * course;
      vm.rotation.x -= 0.38 * course;
      vm.rotation.y += 0.55 * course;
      vm.rotation.z += 0.3 * course + Math.sin((V.bobT || 0) * 0.5) * 0.06 * course;
    }
    // un mur à moins de 1,2 m devant : l'objet recule vers la caméra (il ne traverse pas le mur)
    const regard = viewDir(p),
      mur = rayWall(G.eye[0], G.eye[1], G.eye[2], regard[0], regard[1], regard[2], 1.2);
    G.near = lerp(G.near || 0, Math.max(0, 1 - mur), Math.min(1, dt * 18 + (dt ? 0 : 1)));
    if (G.near > 0.005) {
      vm.position.z += G.near * 0.75;
      vm.position.y -= G.near * 0.12;
      vm.position.x -= G.near * 0.08;
    }
  }
  return vm;
}
// fin d'image : le recul retombe, l'éclair de bouche s'éteint
function reculFrame(dt) {
  G.recoil = Math.max(0, G.recoil - dt * 14);
  if (G.vmFlashT > 0) {
    G.vmFlashT -= dt;
    if (G.vmFlashT <= 0) G.vmFlash.visible = false;
  }
}
// V1.5 : la masse en main. Repos, puis d'après S.swing / S.swingT : armer (la tête part derrière l'épaule), frapper (l'impact tombe à 35 %), rester, revenir.
// Chaque pose = décalage [x, y, z, rx, ry, rz] ajouté à la pose de repos.
const MS_REST = [0.46, -0.36, -0.52, 0.25, 0.9, -0.45],
  MS_0 = [0, 0, 0, 0, 0, 0],
  MS_UP = [0.12, 0.14, 0.02, 0.3, 0.1, -0.9],
  MS_HIT = [-0.3, 0.14, -0.16, -0.75, 0.4, 0.55],
  MS_FOL = [-0.33, 0.09, -0.17, -0.9, 0.4, 0.65];
// le coup de masse : armer (0 à 24 %), frapper (jusqu'à 35 %), suivre (jusqu'à 48 %), revenir
function masseAnim(vm, S) {
  const u = S.swingT > 0 && S.swing > 0 ? 1 - S.swing / S.swingT : 0;
  if (u <= 0) return;
  let de, vers, t;
  if (u < 0.24) {
    de = MS_0;
    vers = MS_UP;
    t = ease(u / 0.24);
  } else if (u < 0.35) {
    de = MS_UP;
    vers = MS_HIT;
    t = (u - 0.24) / 0.11;
    t *= t;
  } else if (u < 0.48) {
    de = MS_HIT;
    vers = MS_FOL;
    t = ease((u - 0.35) / 0.13);
  } else {
    de = MS_FOL;
    vers = MS_0;
    t = ease((u - 0.48) / 0.52);
  }
  vm.position.x += lerp(de[0], vers[0], t);
  vm.position.y += lerp(de[1], vers[1], t);
  vm.position.z += lerp(de[2], vers[2], t);
  vm.rotation.x += lerp(de[3], vers[3], t);
  vm.rotation.y += lerp(de[4], vers[4], t);
  vm.rotation.z += lerp(de[5], vers[5], t);
}
// le marteau cloue : deux coups par planche (la planche est posée au second)
function hammerTap(vm, S) {
  const k = (S.plankT * 4) % 1,
    a = k < 0.72 ? Math.sin(((k / 0.72) * Math.PI) / 2) * 0.5 : (1 - (k - 0.72) / 0.28) * 0.5;
  vm.rotation.x += a;
  vm.position.y += a * 0.04;
}
