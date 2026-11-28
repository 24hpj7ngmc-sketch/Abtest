// commandes.js — les commandes tactiles universelles (les mêmes dans tous les jeux de Frédéric, reprises de L'Île des Cinq) :
//   pouce gauche : joystick (moitié gauche basse de l'écran) ; pouce droit : caméra partout ailleurs, même avec un doigt sur un bouton ;
//   coin bas droit : quart de rond coupé en diagonale, Tir / Action en bas, Saut en haut (#padMain, #bFire, #bJump) ;
//   le long de l'arc : Sneak, Compétence (Missile ou celle du héros), Ultime (Onde ou celui du héros) ;
//   à gauche de l'arc : le bouton libre (Viser, Retirer…), et l'étiquette d'action (ce que fait Action ici).
// Deux appuis rapides pour Compétence, Ultime et le bouton libre (sauf Viser) ; Sneak et Viser à un appui. Clavier pour essayer sur ordinateur.
// Utilise des règles : useMissile, useOnde, useLeurre, useAir, useHeroSkill, useHeroUlt, startDay, buildTurrets, placedCount, turOff,
// SLOTS, TT, HEROS, weapOf ; de l'affichage : renderer, gfxResize ; des sons : SND.
// Les tests passent par de vrais appuis tactiles sur ces boutons (v15ui, sprinttest, devtest, v37test…) : ids et classes à garder.

// ---------------------------------------------------------------- les petits boutons
// deux appuis pour Missile, Onde et le bouton libre ; Sneak et Viser à un appui
// double appui : le premier arme le bouton (liseré blanc), le second dans les 0,42 s déclenche (vrai) ; un autre bouton désarme le premier
const DBL = 420;
let dblId = '',
  dblT = 0;
function dbl(e) {
  const btn = e.currentTarget,
    now = performance.now();
  if (dblId === btn.id && now - dblT < DBL) {
    dblId = '';
    clearTimeout(btn._at);
    btn.classList.remove('arm');
    return true;
  }
  if (dblId && dblId !== btn.id) $(dblId).classList.remove('arm');
  dblId = btn.id;
  dblT = now;
  btn.classList.add('arm');
  clearTimeout(btn._at);
  btn._at = setTimeout(() => btn.classList.remove('arm'), DBL);
  return false;
}
// noms et états du bouton Action (Tir), du bouton libre et de l'étiquette d'action ; ne touche la page que si quelque chose change
//   action / actionSous : texte du bouton Tir ; cls : '' | 'go' (doré) | 'poor' (grisé) | 'idle' (estompé)
//   libre / libreSous / libreOn : bouton libre ('' = caché), allumé ou non ; etiq / etiqSous / etiqRouge : l'étiquette à côté
function padSet(action, actionSous, cls, libre, libreSous, libreOn, etiq, etiqSous, etiqRouge) {
  const btnTir = $('bFire'),
    btnLibre = $('bFree'),
    etiquette = $('aLab');
  setTxt('bFire', 'b', action);
  setTxt('bFire', 'small', actionSous || '');
  if (btnTir._c !== cls) {
    btnTir._c = cls;
    btnTir.classList.toggle('go', cls === 'go');
    btnTir.classList.toggle('poor', cls === 'poor');
    btnTir.classList.toggle('idle', cls === 'idle');
  }
  if (btnLibre._v !== !libre) {
    btnLibre._v = !libre;
    btnLibre.classList.toggle('vh', !libre);
  }
  if (libre) {
    setTxt('bFree', 'b', libre);
    setTxt('bFree', 'small', libreSous || '');
  }
  if (btnLibre._o !== !!libreOn) {
    btnLibre._o = !!libreOn;
    btnLibre.classList.toggle('on', !!libreOn);
  }
  const sansEtiq = !etiq && !etiqSous;
  if (etiquette.hidden !== sansEtiq) etiquette.hidden = sansEtiq;
  if (!sansEtiq) {
    setTxt('aLab', 'b', etiq || '');
    setTxt('aLab', 'small', etiqSous || '');
  }
  if (etiquette._p !== !!etiqRouge) {
    etiquette._p = !!etiqRouge;
    etiquette.classList.toggle('poor', !!etiqRouge);
  }
}
// Action : tirer (fusil, tenu), frapper (masse, tenu), poser / remplacer une tourelle ou barricader une porte (marteau, tenu),
// lancer le leurre ou la frappe
function padAct(e) {
  if (!running || ov()) return;
  // masse : les coups partent dans la boucle tant que c'est tenu
  if (tool === 'masse') {
    if (!S.P.masse.on) {
      toast('Masse : à débloquer dans les améliorations (Survie)');
      SND.play('no');
    }
    return;
  }
  // marteau : une porte visée, les planches se posent dans la boucle tant que c'est tenu
  if (tool === 'marteau') {
    if (aimSlot < 0 && aimDoor >= 0) return;
    placeAct();
    return;
  }
  if (tool === 'leurre') {
    if (!S.P.leu.on) return;
    if (S.phase !== 'day') {
      toast('Le leurre sert pendant le jour');
      return;
    }
    if (S.leuCd > 0) {
      SND.play('no');
      return;
    }
    if (useLeurre(S)) {
      SND.play('decoy');
      setTool('fusil');
    } else toast('Vise le sol');
    return;
  }
  // V4.7 : le grappin : on est tiré jusqu'au point visé (à toute heure)
  if (tool === 'grappin') {
    if (!S.P.grap.on) return;
    if (S.grapCd > 0) {
      SND.play('no');
      return;
    }
    const g = grappinVise(S);
    if (!g) {
      toast('Rien à attraper ici (' + S.P.grap.r + ' m au plus)');
      SND.play('no');
      return;
    }
    useGrappin(S, g);
    return;
  }
  if (tool === 'frappe') {
    if (!S.P.air.on) return;
    if (S.phase !== 'day') {
      toast('La frappe sert pendant le jour');
      return;
    }
    if (S.airCd > 0) {
      SND.play('no');
      return;
    }
    if (useAir(S)) {
      SND.play('jet');
      toast('Frappe aérienne en approche !');
      setTool('fusil');
    }
    return;
  }
}
// marteau sur un emplacement : poser ou remplacer une tourelle du type choisi (plan gardé dans save.layout)
// V4.6 : à plusieurs, la tourelle d'un autre joueur posée sur l'emplacement slot (sinon null) : chez l'hôte, une tourelle d'invité
// (t.own) ; chez l'invité, une tourelle de l'instantané de l'hôte qui n'est pas celle de son plan
function tourelleAutre(slot) {
  for (const t of S.tur) if (t.slot === slot) return t.own !== undefined || (S.invite && save.layout[slot] !== t.ty) ? t : null;
  return null;
}
function placeAct() {
  const P = S.P;
  if (turOff(S)) {
    toast("Jour 1 : pas de tourelle, c'est à toi de jouer. Elles arrivent au jour 2.", 2600);
    SND.play('no');
    return;
  }
  if (aimSlot < 0) {
    toast(S.mode === 'out' ? 'Vise un cercle blanc, ou une porte de près' : 'Vise un emplacement (cercle blanc)');
    return;
  }
  if (tourelleAutre(aimSlot)) {
    toast("Pris : la tourelle d'un autre joueur est ici");
    SND.play('no');
    return;
  }
  const emp = SLOTS[aimSlot],
    posee = save.layout[aimSlot];
  if (posee === ptype) {
    toast('Déjà une ' + TT[ptype].n.toLowerCase() + ' ici');
    return;
  }
  if (emp.k === 'int' && ptype === 'mo') {
    toast('Pas de mortier dans les couloirs');
    SND.play('no');
    return;
  }
  if (!posee && placedCount(save) >= P.turrets) {
    toast('Plus de tourelle libre : retires-en une, ou achète « Tourelle +1 »');
    SND.play('no');
    return;
  }
  save.layout[aimSlot] = ptype;
  buildTurrets(S);
  store();
  SND.play('place');
  toast((posee ? 'Remplacée par ' : '') + TT[ptype].n + ' · ' + emp.n);
}
// bouton libre : Viser (fusil, un appui) ; Retirer la tourelle visée (marteau, deux appuis)
function padFree(e) {
  e.preventDefault();
  if (!running || ov()) return;
  if (tool === 'fusil') {
    ads = !ads;
    return;
  }
  if (!dbl(e)) return;
  if (tool === 'marteau' && aimSlot >= 0 && save.layout[aimSlot]) {
    delete save.layout[aimSlot];
    buildTurrets(S);
    store();
    SND.play('remove');
    toast('Tourelle retirée');
  }
}
$('bFire').addEventListener('pointerdown', e => {
  firing = true;
  $('bFire').classList.add('on');
  padAct(e);
});
for (const ev of ['pointerup', 'pointercancel'])
  $('bFire').addEventListener(ev, () => {
    firing = false;
    $('bFire').classList.remove('on');
  });
$('bFree').addEventListener('pointerdown', padFree);
// le quart de rond : un appui le long de la diagonale va au bouton du bon côté (Tir dessous, Saut dessus), même sur le bord de l'autre
$('padMain').addEventListener(
  'pointerdown',
  e => {
    if (!e.isTrusted) return;
    const rect = e.currentTarget.getBoundingClientRect(),
      u = rot ? (e.clientY - rect.top) / rect.height : (e.clientX - rect.left) / rect.width,
      v = rot ? (rect.right - e.clientX) / rect.width : (e.clientY - rect.top) / rect.height,
      cible = $(v > u ? 'bFire' : 'bJump');
    if (Math.abs(v - u) < 0.06 || e.target === cible || cible.contains(e.target)) return;
    e.stopPropagation();
    e.preventDefault();
    cible.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        isPrimary: e.isPrimary,
        clientX: e.clientX,
        clientY: e.clientY
      })
    );
  },
  true
);
// tout appui sur la zone d'action réveille la barre d'outils (elle s'efface après 3,5 s)
$('act').addEventListener(
  'pointerdown',
  () => {
    barT = performance.now();
  },
  true
);
// mode dev : deux appuis rapides sur Saut = vol libre oui / non (comme dans Minecraft)
let jumpTapT = 0;
function toggleFly() {
  devO.fly = !devO.fly;
  if (devO.fly) {
    sneak = false;
    $('bSneak').classList.remove('on');
  }
  devKeep();
  if (devOpen) devBuild();
  toast(devO.fly ? 'Vol libre : Saut monte, Sneak descend, on traverse tout' : 'Vol coupé');
}
$('bJump').addEventListener('pointerdown', () => {
  jumpQ = true;
  jumpHeld = true;
  if (save.dev && running) {
    const maintenant = performance.now();
    if (maintenant - jumpTapT < 350) {
      jumpTapT = 0;
      jumpQ = false;
      toggleFly();
    } else jumpTapT = maintenant;
  }
});
// Sneak : interrupteur (accroupi oui / non) ; en vol libre, tenu = descendre
$('bSneak').addEventListener('pointerdown', e => {
  e.preventDefault();
  sneakHeld = true;
  if (flying()) return;
  sneak = !sneak;
  $('bSneak').classList.toggle('on', sneak);
});
for (const id of ['bJump', 'bSneak'])
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave'])
    $(id).addEventListener(ev, () => {
      if (id === 'bJump') jumpHeld = false;
      else sneakHeld = false;
    });
// héros (mode fuite) : compétence et ultime à la place du Missile et de l'Onde
function heroSk() {
  const hero = HEROS[S.hero];
  if (S.hab > 0) {
    SND.play('no');
    return;
  }
  if (S.hero !== 'elec' && S.hero !== 'vent' && S.phase !== 'day') {
    toast(hero.sk + ' sert pendant le jour');
    return;
  }
  if (useHeroSkill(S)) SND.play(S.hero === 'elec' || S.hero === 'vent' ? 'dash' : 'launch');
}
function heroUl() {
  const hero = HEROS[S.hero];
  if (S.ult < 1) {
    toast(hero.ul + ' se charge en tuant des zombies');
    return;
  }
  if (S.phase !== 'day') {
    toast(hero.ul + ' sert pendant le jour');
    return;
  }
  if (useHeroUlt(S)) {
    SND.play('onde');
    bigMsg(hero.ul.toUpperCase(), hero.n, 'gold', 1200);
  }
}
// change le nom d'un bouton rond (son premier nœud de texte, avant le <small>) seulement s'il a changé
function setLbl(id, texte) {
  const btn = $(id);
  if (btn._l !== texte) {
    btn._l = texte;
    btn.firstChild.nodeValue = texte;
  }
}
$('bAb').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!dbl(e) || !running || ov()) return;
  if (S.hero) {
    heroSk();
    return;
  }
  if (!S.P.mis.on) {
    toast('Missile : à débloquer dans les améliorations');
    return;
  }
  if (S.phase !== 'day') {
    toast('Le missile sert pendant le jour');
    return;
  }
  if (S.misCd > 0) {
    SND.play('no');
    return;
  }
  if (useMissile(S)) SND.play('launch');
});
$('bUlt').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!dbl(e) || !running || ov()) return;
  if (S.hero) {
    heroUl();
    return;
  }
  if (!S.P.onde.on) {
    toast('Onde de choc : à débloquer dans les améliorations');
    return;
  }
  if (S.ult < 1) {
    toast("L'onde se charge en tuant des zombies");
    return;
  }
  if (useOnde(S)) {
    SND.play('onde');
    bigMsg('ONDE DE CHOC', '', 'gold', 1200);
  }
});
// « Lancer le jour » (panneau du haut) et le bouton d'améliorations / boutique (haut à droite)
$('go').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!running || !S || S.phase !== 'prep') return;
  // V4.3 (multi) : seul l'hôte lance le jour
  if (multiInvite()) {
    toast("C'est l'hôte qui lance le jour");
    return;
  }
  startDay(S);
});
$('bTree').addEventListener('click', () => openTree('run'));

// ---------------------------------------------------------------- toucher
// joystick à gauche, caméra partout ailleurs (même avec un doigt sur un bouton)
// téléphone tenu en portrait : la page tourne de 90° (classe rot sur <html>) et les coordonnées des doigts aussi (px, py)
let rot = false;
const stage = $('stage'),
  canvas = $('game');
function fit() {
  rot = innerHeight > innerWidth;
  document.documentElement.classList.toggle('rot', rot);
  stage.style.width = rot ? innerHeight + 'px' : '';
  stage.style.height = rot ? innerWidth + 'px' : '';
  const larg = rot ? innerHeight : innerWidth,
    haut = rot ? innerWidth : innerHeight;
  document.documentElement.classList.toggle('sm', larg < 800);
  if (renderer) gfxResize(larg, haut);
}
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 200));
const px = e => (rot ? e.clientY : e.clientX),
  py = e => (rot ? innerWidth - e.clientX : e.clientY);
// tourner la caméra de (dx, dy) pixels ; plus lent en visée (zoom), selon le réglage « Caméra »
function turn(dx, dy) {
  if (!S) return;
  const zoom = ads && tool === 'fusil' ? weapOf(S).zoom : 1,
    vitesse = (0.0055 * (save.sens || 1)) / Math.pow(zoom, 0.8);
  S.p.yaw -= dx * vitesse;
  S.p.pitch = Math.max(-1.45, Math.min(1.3, S.p.pitch - dy * vitesse));
}
// un doigt se pose : sur le canevas, dans le coin bas gauche (40 % de large, sous les 30 % du haut) → joystick ; sinon → caméra
function pDown(e) {
  if (!running || ov()) return;
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch (_) {}
  const x = px(e),
    y = py(e),
    larg = rot ? innerHeight : innerWidth,
    haut = rot ? innerWidth : innerHeight;
  if (e.currentTarget === canvas && joy.id === null && x < larg * 0.4 && y > haut * 0.3) {
    joy.id = e.pointerId;
    joy.x0 = x;
    joy.y0 = y;
    // le joystick, à peine visible au repos, s'allume sous le pouce (comme dans L'Île des Cinq)
    $('joy').classList.add('on');
    return;
  }
  looks[e.pointerId] = { x, y };
}
// le joystick plafonne à 44 px du point de départ
function pMove(e) {
  const x = px(e),
    y = py(e);
  if (e.pointerId === joy.id) {
    const dx = x - joy.x0,
      dy = y - joy.y0,
      long = Math.hypot(dx, dy),
      rayon = 44,
      k = long > rayon ? rayon / long : 1;
    joy.r = (dx * k) / rayon;
    joy.f = (-dy * k) / rayon;
    $('knob').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    return;
  }
  const doigt = looks[e.pointerId];
  if (!doigt) return;
  turn(x - doigt.x, y - doigt.y);
  doigt.x = x;
  doigt.y = y;
}
function pUp(e) {
  if (e.pointerId === joy.id) {
    joy.id = null;
    joy.f = joy.r = 0;
    $('knob').style.transform = '';
    $('joy').classList.remove('on');
  }
  delete looks[e.pointerId];
}
// les boutons ronds laissent aussi tourner la caméra en glissant (enregistrés après leurs propres écouteurs)
for (const el of [canvas, $('bFire'), $('bJump'), $('bFree'), $('bSneak'), $('bAb'), $('bUlt')]) {
  el.addEventListener('pointerdown', pDown);
  el.addEventListener('pointermove', pMove);
  el.addEventListener('pointerup', pUp);
  el.addEventListener('pointercancel', pUp);
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
// clavier (pour essayer sur ordinateur) : ZQSD / flèches, espace, F = Action, 1 Fusil, 2 Marteau, 3 Masse
const keys = {};
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = 1;
  if (e.key === ' ') jumpQ = true;
  if (e.key === '1') setTool('fusil');
  if (e.key === '2') setTool('marteau');
  if (e.key === '3' && S && toolOk(TOOLS[1])) setTool('masse');
});
addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = 0;
});
