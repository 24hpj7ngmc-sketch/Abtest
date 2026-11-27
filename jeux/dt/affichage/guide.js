// ===================== DERNIER TOIT — l'affichage : le Guide « Règles » (V4.2) =====================
// Le même personnage que le Guide du lobby (MODELS['pnj.guide'], gfx/models/pnj.js, repris tel quel : 1,7 m, origine aux pieds,
// il regarde vers −Z) se tient sur le toit, tout près du départ (GUIDEP, interface/regles.js), sous une étiquette « RÈGLES » :
// un panneau toujours tourné vers la caméra, dessiné comme les étiquettes du lobby (fond bleu nuit, liseré et titre dorés).
// Mode « Ils s'échappent » seulement. Il se tourne lentement vers le joueur quand celui-ci est à moins de 15 m ; il piétine un peu
// (sa marche, à peine) pendant qu'il tourne, et reste immobile sinon. Aucune collision (rien dans les règles), aucun tirage au hasard.
// Attend : GUIDEP (interface/regles.js), H (règles), S.mode, S.p ; MODELS['pnj.guide'].
// Fournit : guideInit (appelé par gfxInit), guideFrame (appelé par gfxFrame) ; G.guide (le personnage), G.guideLab (l'étiquette), G.guideYaw.

// GUIDE_VUE : distance (m) sous laquelle il se tourne vers le joueur ; GUIDE_TOUR : vitesse de rotation la plus grande (rad/s) ;
// GUIDE_LAB : taille de l'étiquette (m) et hauteur de son milieu au-dessus de ses pieds
const GUIDE_VUE = 15,
  GUIDE_TOUR = 1.5,
  GUIDE_LAB = { w: 1.6, h: 0.53, y: 2.5 };
// l'étiquette : un canevas de 384 × 128 (titre doré, petite ligne claire), comme lobText au lobby
function guideTexte(sp, titre, sous) {
  const c = sp.userData.c,
    g = c.getContext('2d'),
    r = 22,
    or = '#ffcf5a';
  g.clearRect(0, 0, 384, 128);
  g.fillStyle = 'rgba(10,14,40,.74)';
  g.beginPath();
  g.moveTo(r, 6);
  g.arcTo(378, 6, 378, 122, r);
  g.arcTo(378, 122, 6, 122, r);
  g.arcTo(6, 122, 6, 6, r);
  g.arcTo(6, 6, 378, 6, r);
  g.fill();
  g.strokeStyle = or;
  g.lineWidth = 3;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = or;
  g.font = '700 ' + (sous ? 50 : 58) + "px 'Chakra Petch',sans-serif";
  g.fillText(titre, 192, sous ? 46 : 66, 356);
  if (sous) {
    g.fillStyle = '#ecf7f8';
    g.font = "600 30px 'Barlow',sans-serif";
    g.fillText(sous, 192, 96, 356);
  }
  sp.userData.t.needsUpdate = true;
}
// le personnage et son étiquette, cachés jusqu'à la première image en mode fuite
function guideInit() {
  G.guide = instM('pnj.guide');
  G.guide.visible = false;
  scene.add(G.guide);
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 128;
  const t = new THREE.CanvasTexture(c);
  G.guideLab = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  G.guideLab.scale.set(GUIDE_LAB.w, GUIDE_LAB.h, 1);
  G.guideLab.userData = { c, t };
  G.guideLab.visible = false;
  scene.add(G.guideLab);
  const ecrire = () => guideTexte(G.guideLab, 'RÈGLES', 'le Guide');
  ecrire();
  // les polices de la page arrivent après coup : l'étiquette se redessine quand elles sont là
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ecrire, () => {});
  G.guideYaw = null;
  G.guideW = 0;
}
// une image : visible en mode fuite ; il se tourne vers le joueur proche (au plus GUIDE_TOUR rad/s, plus doucement à l'approche)
function guideFrame(S, dt) {
  const on = S.mode === 'out';
  G.guide.visible = G.guideLab.visible = on;
  if (!on) return;
  const p = S.p,
    dx = p.x - GUIDEP.x,
    dz = p.z - GUIDEP.z,
    vers = Math.atan2(-dx, -dz);
  if (G.guideYaw === null) G.guideYaw = vers;
  let tourne = false;
  if (Math.hypot(dx, p.y - H, dz) < GUIDE_VUE) {
    const ecart = Math.atan2(Math.sin(vers - G.guideYaw), Math.cos(vers - G.guideYaw)),
      pas = dt * Math.min(GUIDE_TOUR, 0.3 + Math.abs(ecart) * 2);
    G.guideYaw += Math.max(-pas, Math.min(pas, ecart));
    tourne = Math.abs(ecart) > 0.06;
  }
  G.guideW += ((tourne ? 0.4 : 0) - G.guideW) * Math.min(1, dt * 6);
  G.guide.position.set(GUIDEP.x, H, GUIDEP.z);
  G.guide.rotation.y = G.guideYaw;
  K.pose(G.guide, G.time, 0, G.guideW);
  G.guideLab.position.set(GUIDEP.x, H + GUIDE_LAB.y, GUIDEP.z);
}
