// dev.js — le bouton DEV sous la mini-carte (seulement en mode dev, pendant une partie) et son panneau d'outils (le jeu continue) :
// vol libre, invincible, vitesse ×1/×2/×4, jours auto, arbre au max / à zéro, poser les tourelles, argent, tuer tout, sauter des jours,
// faire venir des envahisseurs, un mastodonte, les 4 variantes, images/s. Options gardées dans save.devOpt.
// Utilise des règles : killZ, spawnOne, startDay, buildTurrets, derive, heroHp, NODES, SLOTS, slotOn ; des sons : SND.
// Les tests appellent devSpawn, flying et lisent devO ; devtest passe par de vrais appuis sur #devB et #devP.

// ---------------------------------------------------------------- bouton DEV sous la mini-carte
// seulement en mode dev : les outils sans passer par la carte, le jeu continue
// devOpen : panneau ouvert ; fps… : compteur d'images ; devAutoT : attente avant le jour auto ;
// jumpHeld / sneakHeld : Saut / Sneak tenus (vol libre)
let devOpen = false,
  fpsAcc = 0,
  fpsN = 0,
  fpsT = 0,
  devAutoT = 0,
  jumpHeld = false,
  sneakHeld = false;
const devO = Object.assign({ speed: 1, auto: false, fly: false, god: false }, save.devOpt || {});
// vol libre en cours (mode dev, partie lancée)
const flying = () => !!(save.dev && devO.fly && running);
function devKeep() {
  save.devOpt = devO;
  store();
}
function devKill() {
  for (let k = 0; k < S.nAct; k++) killZ(S, S.act[k], 'd');
  S.toSpawn = 0;
}
// aller au jour `jour` : pendant le jour, il s'arrête et le suivant (`jour`) vient après l'aube
function devDay(jour) {
  devKill();
  if (S.phase === 'day') S.day = jour - 1;
  else S.day = jour;
  toast('Jour ' + jour + (S.phase === 'day' ? " après l'aube" : ''));
}
// faire apparaître `nombre` zombies tout de suite (lance le jour si besoin) ; `champs` passés aux règles le temps de l'apparition
// (devTy : type forcé, devInv : envahisseurs) ; rend le nombre apparu
function devSpawn(nombre, champs) {
  if (S.phase === 'prep') startDay(S);
  Object.assign(S, champs);
  S.toSpawn += nombre;
  let faits = 0;
  for (; faits < nombre; faits++) if (!spawnOne(S)) break;
  delete S.devTy;
  delete S.devInv;
  return faits;
}
// remplit les emplacements libres jusqu'à la limite, types débloqués en alternance (pas de mortier dans les couloirs) ; rend le nombre posé
function devFill() {
  const plan = save.layout || (save.layout = {}),
    types = ['mg', 'la', 'fl', 'mo'].filter(t => S.P[t] && S.P[t].on);
  let posees = Object.keys(plan).length,
    ajoutees = 0;
  for (const s of SLOTS) {
    if (posees >= S.P.turrets) break;
    if (plan[s.id] || !slotOn(S.P, s, S.mode)) continue;
    const possibles = s.k === 'int' ? types.filter(t => t !== 'mo') : types;
    if (!possibles.length) continue;
    plan[s.id] = possibles[ajoutees % possibles.length];
    ajoutees++;
    posees++;
  }
  buildTurrets(S);
  store();
  return ajoutees;
}
// refait le panneau (après chaque appui : les libellés montrent l'état)
function devBuild() {
  const panneau = $('devP');
  panneau.innerHTML = '';
  const bouton = (texte, action, allume) => {
    const btn = document.createElement('button');
    btn.innerHTML = texte;
    if (allume) btn.classList.add('on');
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!S) return;
      action();
      devKeep();
      SND.play('click');
      devBuild();
    });
    panneau.appendChild(btn);
  };
  bouton('Vol libre : <b>' + (devO.fly ? 'oui' : 'non') + '</b> <small>(ou 2 × Saut)</small>', toggleFly, devO.fly);
  bouton(
    'Invincible : <b>' + (devO.god ? 'oui' : 'non') + '</b>',
    () => {
      devO.god = !devO.god;
      godMode = devO.god;
      S.god = godMode;
    },
    devO.god
  );
  bouton(
    'Vitesse : <b>×' + devO.speed + '</b>',
    () => {
      devO.speed = devO.speed === 1 ? 2 : devO.speed === 2 ? 4 : 1;
    },
    devO.speed > 1
  );
  bouton(
    'Jours auto : <b>' + (devO.auto ? 'oui' : 'non') + '</b>',
    () => {
      devO.auto = !devO.auto;
    },
    devO.auto
  );
  bouton('Arbre au max', () => {
    for (const n of NODES) save.lv[n.id] = n.max;
    save.devDon = true;
    S.P = derive(save.lv);
    buildTurrets(S);
    subBuild();
    store();
    toast('Arbre au maximum : tout est débloqué (gardé dans ta sauvegarde)');
  });
  // V3.8 : l'inverse, pour retrouver l'arbre d'un nouveau joueur (l'argent n'est pas rendu)
  bouton('Arbre à zéro', () => {
    save.lv = { root: 1 };
    save.devDon = false;
    S.P = derive(save.lv);
    S.p.hpMax = heroHp(S);
    S.p.hp = Math.min(S.p.hp, S.p.hpMax);
    buildTurrets(S);
    if (tool !== 'fusil' && tool !== 'marteau') setTool('fusil');
    subBuild();
    store();
    toast('Arbre remis à zéro, comme un nouveau joueur');
  });
  bouton('Poser les tourelles', () => {
    const n = devFill();
    toast(n ? n + ' tourelles posées' : "Plus d'emplacement libre (limite " + S.P.turrets + ')');
  });
  bouton('+ 100 000 $', () => {
    save.cash += 1e5;
    save.devDon = true;
    store();
  });
  bouton('Tuer tous les zombies', () => {
    devKill();
  });
  bouton('Jour suivant', () => {
    devKill();
    if (S.phase === 'prep') startDay(S);
  });
  bouton('Aller au jour 6', () => devDay(6));
  bouton('Aller au jour 9', () => devDay(9));
  bouton('20 envahisseurs', () => {
    const n = devSpawn(20, { devInv: S.mode === 'out' });
    toast(n + (S.mode === 'out' ? ' envahisseurs dans le hall' : ' zombies'));
  });
  bouton('Un mastodonte', () => {
    devSpawn(1, { devTy: 3 });
    toast('Un mastodonte arrive');
  });
  bouton('Les 4 variantes', () => {
    if (S.mode !== 'out') {
      toast("Variantes : mode « Ils s'échappent »");
      return;
    }
    for (const t of [4, 5, 6, 7]) devSpawn(1, { devTy: t });
    toast('Sprinteur, casseur, porteur, hurleur');
  });
  bouton(
    'Images/s : <b>' + (save.fps ? 'oui' : 'non') + '</b>',
    () => {
      save.fps = !save.fps;
      store();
    },
    save.fps
  );
  panneau.classList.toggle('on', devOpen);
  $('devB').classList.toggle('open', devOpen);
}
$('devB').addEventListener('pointerdown', e => {
  e.preventDefault();
  e.stopPropagation();
  devOpen = !devOpen;
  SND.play('click');
  devBuild();
});
// appelé à chaque image : bouton visible seulement en mode dev pendant une partie ;
// compteur d'images moyenné sur 0,5 s (temps réel entre deux images)
function devTick(dt) {
  // V4.2 : une partie jouée avec le mode dev (même un instant) est marquée : le lobby ne la paie pas (lobbyFin)
  if (save.dev && running && S) S.devUse = true;
  const montre = !!save.dev && running && !ov();
  $('devB').classList.toggle('on', montre);
  if (!montre && devOpen) {
    devOpen = false;
    devBuild();
  }
  const compteur = $('fps');
  compteur.classList.toggle('on', montre && !!save.fps);
  if (montre && save.fps && dt > 0) {
    fpsAcc += dt;
    fpsN++;
    fpsT += dt;
    if (fpsT >= 0.5) {
      compteur.textContent = Math.round(fpsN / fpsAcc) + ' img/s';
      fpsAcc = fpsN = fpsT = 0;
    }
  }
}
