// boucle.js — la boucle de chaque image (frame) et le lancement de la page.
// Une image : compteur DEV → foule adaptée aux images/s → si la partie tourne : entrées (joystick, clavier, sprint, tir auto, sniper,
// masse, planches) → règles (step, plusieurs fois en vitesse DEV ×2/×4) → événements (sons, messages) → HUD (uiTick) → tutoriel →
// grognements, sauvegarde auto ; puis toujours : réticule, gains qui flottent, affichage 3D (gfxFrame), lunette, mini-carte.
// Utilise des règles : step, useMasse, plankStep, startDay, newRun, weapOf, WEAP ; de l'affichage : gfxInit, gfxFrame ; des sons : SND.
// V4.3 (multi, multi.js) : multiAvant avant le pas ; l'invité fait stepInvite au lieu de step (une fois, sans la vitesse DEV) ;
// l'hôte occupé par un écran fait quand même avancer la partie ; multiTick à chaque image (publication, autres joueurs lissés).
// Les tests lisent window.__frames (images dessinées) et passent par window.__dt (voir en bas).

// ---------------------------------------------------------------- la boucle
// saveT : sauvegarde auto toutes les 10 s ; last : heure de l'image d'avant ; fpsA : images/s moyennes ; capNow : zombies en même temps
// (S.cap, 700 à 2200) ; prT : revue de capNow toutes les 2 s ; miniT : prochaine mini-carte ; stepT : dernier pas (son)
let saveT = 10,
  last = performance.now(),
  fpsA = 60,
  capNow = 1400,
  prT = 0,
  miniT = 0,
  stepT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dtReel = (now - last) / 1000;
  let dt = Math.min(0.05, dtReel);
  last = now;
  if (!S) return;
  multiAvant();
  devTick(dtReel);
  fpsA += (1 / Math.max(dt, 1e-3) - fpsA) * 0.05;
  // la foule s'adapte au téléphone : moins de zombies en même temps si les images ralentissent
  prT += dt;
  if (prT > 2) {
    prT = 0;
    if (fpsA < 38 && capNow > 700) capNow -= 150;
    else if (fpsA > 54 && capNow < 2200) capNow += 100;
    S.cap = capNow;
  }
  if (running && !ov()) {
    // entrées : le joystick, sinon le clavier (f : avance, r : côté, entre −1 et 1)
    const clavAvant = (keys['z'] || keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0),
      clavCote = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['q'] || keys['a'] || keys['arrowleft'] ? 1 : 0);
    // sprint : joystick poussé presque à fond vers l'avant ; il tient tant qu'on garde le pouce vers l'avant.
    // Il relève le joueur s'il était accroupi (Sneak) ; pas pendant la visée
    const f = joy.id !== null ? joy.f : clavAvant,
      r = joy.id !== null ? joy.r : clavCote,
      force = Math.hypot(f, r);
    if (force > 0.85 && f > 0.4) sprintOn = true;
    else if (f < 0.25 || force < 0.45) sprintOn = false;
    if (ads && tool === 'fusil') sprintOn = false;
    if (sprintOn && sneak) {
      sneak = false;
      $('bSneak').classList.remove('on');
    }
    const sprinte = sprintOn;
    $('joy').classList.toggle('sprint', sprinte);
    // tir : tenu (bouton ou F), ou tir auto sur cible (réglage, pas au sniper)
    const arme = weapOf(S),
      sniper = tool === 'fusil' && !!arme.scope;
    autoT -= dt;
    if (autoT <= 0) {
      autoT = 0.08;
      autoOn = tool === 'fusil' && !sniper && onTarget();
    }
    const tenu = firing || !!keys['f'];
    let fire = tool === 'fusil' && !sniper && (tenu || (save.auto && autoOn));
    // sniper : Tir tenu ouvre la lunette ; relâché, le coup part (il attend la fin du rechargement, 0,9 s au plus)
    if (sniper) {
      if (tenu && !snipe) {
        snipe = true;
        snipeAds = ads;
        ads = true;
      } else if (!tenu && snipe) {
        snipe = false;
        ads = snipeAds;
        fireQ = performance.now();
      }
      if (fireQ && performance.now() - fireQ > 900) fireQ = 0;
      fire = !!fireQ;
    } else {
      snipe = false;
      fireQ = 0;
    }
    const fireT0 = S.p.fireT;
    // action tenue (comme le tir) : la masse enchaîne les coups ; le marteau sur une porte pose une planche toutes les 0,5 s
    if (tool === 'masse' && tenu) useMasse(S);
    plankStep(S, dt, tool === 'marteau' && tenu && aimSlot < 0 && aimDoor >= 0 ? aimDoor : -1);
    // règles : un pas (ou 2, 4 avec la vitesse DEV) ; vol libre DEV : Saut tenu monte, Sneak tenu descend
    // V4.3 : l'invité ne fait avancer que son joueur (stepInvite, règles du multi), sans la vitesse DEV
    const invite = multiInvite(),
      avance = invite ? stepInvite : step,
      vol = flying(),
      pas = save.dev && !invite ? devO.speed : 1;
    for (let i = 0; i < pas; i++)
      avance(S, dt, {
        f,
        r,
        sprint: sprinte,
        crouch: sneak && !vol,
        jump: jumpQ && i === 0,
        fire,
        ads: ads && tool === 'fusil',
        yaw: S.p.yaw,
        pitch: S.p.pitch,
        fly: vol,
        up: vol && jumpHeld,
        down: vol && sneakHeld
      });
    jumpQ = false;
    multiTir(S.p.fireT > fireT0 + 1e-6);
    // DEV « Jours auto » : le jour se lance après 2 s de préparation (pas chez l'invité : c'est l'hôte qui lance le jour)
    if (save.dev && devO.auto && S.phase === 'prep' && !multiInvite()) {
      devAutoT += dt;
      if (devAutoT > 2) {
        devAutoT = 0;
        startDay(S);
      }
    } else devAutoT = 0;
    // le coup du sniper est parti : plus en attente
    if (fireQ && S.p.fireT > fireT0 + 1e-6) fireQ = 0;
    // balancement de la marche et bruit des pas
    const marche = Math.hypot(f, r);
    if (marche > 0.1 && S.p.ground) {
      bobT += dt * (sprinte ? 13 : 9) * marche;
      const pasNo = Math.floor(bobT / Math.PI);
      if (pasNo !== stepT) {
        stepT = pasNo;
        SND.play('step');
      }
    }
    bob = Math.sin(bobT) * (sprinte ? 0.06 : 0.035) * Math.min(1, marche);
    events();
    uiTick(dt);
    tutoTick(dt);
    // un grognement au hasard dans la foule toutes les 1,2 à 3,7 s
    groanT -= dt;
    if (groanT <= 0 && S.nAct > 0) {
      groanT = 1.2 + Math.random() * 2.5;
      const i = S.act[Math.floor(Math.random() * S.nAct)];
      SND.at('groan', S.z.x[i], S.z.z[i], 0, S.z.y[i]);
    }
    if (S.phase === 'rescue' && Math.random() < 0.5) SND.play('heli');
    saveT -= dt;
    if (saveT <= 0) {
      saveT = 10;
      store();
    }
  } else if (multiHoteOccupe()) {
    // V4.3 : l'hôte a ouvert un écran (arbre, carte, règles) : la partie des autres avance quand même, sans ses commandes
    step(S, dt, { f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
    events();
  }
  multiTick(dt);
  if (crossT > 0) {
    crossT -= dt;
    if (crossT <= 0) $('cross').className = '';
  }
  flosTick(dt);
  // l'affichage 3D : ce qu'il lui faut savoir de l'interface (outil en main, visée, emplacement visé, balancement…)
  gfxFrame(S, running && !ov() ? dt : 0, {
    sprint: (sprintOn || !!S.p.clb) && running && !ov(),
    tool: tool === 'fusil' ? (weapOf(S) === WEAP.fusil ? 'fusil' : S.weap) : tool,
    scope: ads && tool === 'fusil' && !!weapOf(S).scope,
    hammer: tool === 'marteau',
    aim: aimSlot,
    ptype,
    door: tool === 'marteau' && aimSlot < 0 ? aimDoor : -1,
    ads: ads && tool === 'fusil',
    zoom: ads && tool === 'fusil' ? weapOf(S).zoom : 1,
    bob,
    bobT
  });
  $('scope').classList.toggle('on', running && ads && tool === 'fusil' && !!weapOf(S).scope);
  miniT -= dt;
  if (miniT <= 0) {
    miniT = 0.12;
    drawMap(mg, S, 208, 95, false);
  }
  window.__frames = (window.__frames || 0) + 1;
}
// ---------------------------------------------------------------- lancement
// La 3D, les règles et les sons sont collés APRÈS l'interface (voir page.html : l'interface doit venir d'abord, car les sons lisent
// `save` dès le chargement) : le lancement attend donc la fin du script (queueMicrotask : juste après, avant toute image).
// Aucun code de l'interface ne doit utiliser une constante des autres dossiers au chargement : seulement dans des fonctions.
queueMicrotask(() => {
  gfxInit(canvas);
  fit();
  hotBuild();
  S = newRun(save, 1);
  running = false;
  // V4.1 : lancé depuis le lobby (lobby.js), la partie démarre tout de suite ; sinon, le menu de départ
  if (!lobbyPret()) showStart();
  requestAnimationFrame(frame);
  // pour les tests (Playwright) : la partie, la sauvegarde et quelques fonctions
  window.__dt = {
    get S() {
      return S;
    },
    save,
    newGame,
    startDay,
    openTree,
    setTool,
    store,
    treeSel: id => {
      tSel = id;
      treeDraw();
    },
    get ui() {
      return { tool, aimSlot, aimDoor, firing };
    }
  };
});
