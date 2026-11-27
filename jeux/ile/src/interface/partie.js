// [interface/partie.js] Une partie, du début à la fin : les bots du mode dev, begin() (tout ce qui vient de la progression est donné par le lobby), finish() (le compte rendu au lobby).
// bots joueurs du mode dev : autant de héros en plus que demandé, chacun d'un élément différent de celui du joueur, avec l'arbre de héros de la sauvegarde
function botSync() {
  if (!sim || sim.client) return;
  const n = save.dev ? Math.max(0, Math.min(4, dev.bots | 0)) : 0,
    have = Object.keys(sim.others).filter(k => sim.others[k].bot && !sim.others[k].hired);
  while (have.length > n) delete sim.others[have.pop()];
  const els = ELS.filter(e => e !== sim.hero.el);
  for (let c = have.length; c < n; c++) {
    let j = 0;
    while (sim.others['bot' + j]) j++;
    const el = els[j % els.length],
      o = botMake(sim, j, el, heroMods(el));
    o.x += sim.hero.x * 0.0;
    sim.others['bot' + j] = o;
  }
  sim.botBuild = dev.botBuild !== false;
  if (!net.n || net.n < 2) sim.players = 1 + botList(sim).length - hiredOf(sim).length;
}
// ---------- démarrer une partie ----------
// partieN : parties lancées depuis l'ouverture du cadre (« Rejouer » en lance une autre) ; butin : les chances de butin gagnées pendant la partie ([nom, chance]), que le lobby tire au sort
let partieN = 0,
  partieT0 = 0,
  butin = [],
  runObj = 0;
function begin(el, mode) {
  if (!mode) tuto = null;
  butin = [];
  runObj = 0;
  save.last = el;
  tHero = el;
  const hm0 = heroMods(el),
    B = LOBBY.bonus && typeof LOBBY.bonus === 'object' ? LOBBY.bonus : {},
    prem = partieN === 0 && !mode,
    prp = [];
  // les préparatifs du village (affûtage, provisions) et la bourse ne valent que pour la première partie de l'ouverture : le lobby les a déjà dépensés
  if (prem && B.prep && typeof B.prep === 'object') {
    const pm = B.prep.mods && typeof B.prep.mods === 'object' ? B.prep.mods : {};
    for (const k in pm) if (Number.isFinite(+pm[k])) hm0[k] = (hm0[k] || 0) + +pm[k];
    for (const t of Array.isArray(B.prep.noms) ? B.prep.noms.slice(0, 4) : []) prp.push(String(t).slice(0, 40));
  }
  {
    const cp = mode ? null : campOf();
    sim = newSim(el, null, hm0, mode || (cp ? 'normal' : gameMode()));
    if (cp) setCamp(sim, cp.el, cp.l);
    sim.cNoT = !!tuto; // le tutoriel n'a pas de chrono entre les vagues (regles/ciel.js)
  }
  sim.run = {};
  let bst = 0;
  if (prem && B.or > 0 && B.or <= 5000) {
    bst = Math.round(B.or);
    sim.gold += bst;
  }
  partieN++;
  partieT0 = performance.now();
  net.host = true;
  net.hs = Date.now();
  net.acts = [];
  net.seen = {};
  net.hlSeen = {};
  net.hl = null;
  net.wp = null;
  net.wpMine = '';
  net.lastS = null;
  net.rl = '';
  net.noHost = 0;
  net.snap = null;
  net.endT = 0;
  if (save.dev) {
    sim.god = dev.god;
    sim.heroGod = dev.hgod;
    devSetup();
    botSync();
  }
  clearViews();
  running = true;
  wavePhase = '';
  placing = false;
  inp.sneak = false;
  $('bSneak').classList.remove('on');
  $('end').hidden = true;
  setTheme(sim.camp ? sim.camp.el : '');
  aimSet(false);
  fireQ = false;
  $('hot').querySelector('.slot[data-t=pistolet] small').textContent = WT[tWeap].short;
  drawSub();
  $('bAb').firstChild.textContent = el === 'terre' && sim.m.voB ? 'Charge' : KIT[el].skill; // V2.2 : l'Avant-garde charge au lieu de dresser le Rempart
  $('bUlt').firstChild.textContent = KIT[el].ult;
  barT = performance.now();
  $('bFire').style.setProperty('--hero', elc(el));
  armBegin(el); // V2.0 : le choix des 3 armes et de leurs éléments (pas au tutoriel), puis l'élément de l'arme en main
  {
    const ent =
      (sim.camp ? campN(sim.camp) + ' · ' : '') +
      EL[el].hero +
      (EL[el].role ? ' · ' + EL[el].role : '') +
      (voieNom(el) ? ' · ' + voieNom(el) : '') +
      ' entre en jeu' +
      (bst ? ' · bourse +' + bst + ' or' : '') +
      (prp.length ? ' · ' + prp.join(' · ') : '');
    // l'écran du choix des armes est ouvert : le message attend qu'on le ferme (il passait par-dessus les cartes d'armes)
    arsEntree = $('arsV').hidden ? '' : ent;
    if (!arsEntree) {
      toast(ent);
      if (bst || prp.length) toastT = 4.5;
    }
  }
  versLobby({
    ile: 'pret',
    partie: partieN,
    heros: el,
    arme: tWeap,
    mode: sim.mode === 'hard' ? 'hard' : 'normal',
    campagne: sim.camp ? { el: sim.camp.el, l: sim.camp.l } : null,
    tuto: !!tuto,
    or: bst
  });
}
let arsEntree = ''; // le message d'entrée en jeu, gardé pendant que l'écran du choix des armes est ouvert
$('eAgain').onclick = () => versLobby({ ile: 'retour' });
$('eReplay').onclick = () => {
  $('end').hidden = true;
  begin(save.last || tHero);
};
// ---------- finir une partie : la partie dit au lobby ce qui s'est passé (message « fin »), le lobby paie et répond ce qu'il a donné (message « paie », affiché ici) ----------
function finish() {
  running = false;
  placing = false;
  const wasTuto = !!tuto;
  tuto = null;
  tutoHTML();
  const cp = sim.camp,
    win = sim.over === 'win',
    cleared = Math.max(0, win ? sim.wave : sim.wave - 1);
  $('eTitle').textContent = cp && win ? campN(cp) + ' terminé' : win ? 'Île défendue' : 'Le cœur est tombé';
  $('eText').textContent = win
    ? `Les ${sim.maxW} vagues sont repoussées, il te reste ${sim.core} points de cœur.`
    : `Tu as tenu jusqu'à la vague ${sim.wave}. Regarde bien l'aperçu : pose l'élément qui bat celui qui arrive.`;
  if (net.room && net.host) {
    net.endT = 1.5;
    net.room.presence({ s: snap(sim) }).catch(() => {});
  }
  $('eGain').textContent = '';
  versLobby({
    ile: 'fin',
    partie: partieN,
    victoire: win,
    raison: win ? 'victoire' : 'coeur',
    mode: sim.mode === 'hard' ? 'hard' : 'normal',
    campagne: cp ? { el: cp.el, l: cp.l } : null,
    vague: sim.wave,
    vagues: sim.maxW,
    passees: cleared,
    unites: cleared > 0 ? Math.round(lvl(sim, cleared)) : 0,
    tues: sim.kills,
    boss: sim.bossKills,
    objectifs: runObj,
    butin,
    coeur: sim.core,
    duree: Math.round((performance.now() - partieT0) / 1000),
    invite: !!sim.client,
    joueurs: net.n,
    hote: !!net.host,
    dev: save.dev === true,
    tuto: wasTuto,
    heros: sim.hero.el,
    arme: tWeap
  });
  $('end').hidden = false;
}
// ce que le lobby vient de donner pour cette partie : une ligne par gain, écrite telle quelle (du texte, jamais du HTML)
function paieShow(m) {
  const el = $('eGain');
  el.textContent = '';
  for (const l of Array.isArray(m.lignes) ? m.lignes.slice(0, 12) : []) {
    const sp = document.createElement('span');
    sp.className = 'tchip' + (l && l.fort ? ' sel' : '');
    sp.textContent = String(l && l.t !== undefined ? l.t : l).slice(0, 90);
    el.appendChild(sp);
  }
}
addEventListener('message', e => {
  const m = e.data;
  if (e.source === parent && m && typeof m === 'object' && m.ile === 'paie') paieShow(m);
});
