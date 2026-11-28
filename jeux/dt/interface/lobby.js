// lobby.js — Dernier Toit lancé depuis le lobby, dans un cadre (iframe). Le contrat complet est dans LOBBY.md.
// Le lobby colle la page de Dernier Toit dans une iframe (srcdoc) et pose, avant tout script, window.DT_LOBBY = { heros, arme, jour,
// bonus, encoche, … }. Dans ce cas : pas de menu de départ (le lobby en tient lieu), la partie démarre tout de suite en « Ils s'échappent »,
// « pret » part à chaque nouvelle partie, « fin » à chaque partie finie, et « Retour au lobby » remplace « Menu » à l'écran de fin.
// Sans window.DT_LOBBY (la page seule, toit.html), rien ne change. Ce que le jeu lit des options est annoncé par DernierToit.accepte
// (pont-lobby.js) : la tenir à jour.
// Fournit : LOBBY (les options reçues, ou null), lobbyPret (appelé par boucle.js au lancement), lobbyPartie (newGame), lobbyFin (showEnd),
// lobbyLigne (l'écran de fin).
// Utilise des règles : HEROS, WEAP, bonusLobby (regles/arbre.js) ; de l'interface : save, newGame, startDays, store.

const LOBBY = (() => {
  const o = window.DT_LOBBY;
  return o && typeof o === 'object' ? o : null;
})();
// un message au lobby : { dt: 'pret' | 'fin' | 'retour', … } (rien hors lobby)
function versLobby(m) {
  if (!LOBBY || window.parent === window) return;
  try {
    window.parent.postMessage(m, '*');
  } catch (_) {}
}
// les bords de l'écran à éviter (encoche, coins arrondis), en pixels : le lobby les mesure chez lui et les passe,
// car une iframe ne reçoit pas toujours env(safe-area-inset-*) ; ils remplacent alors ceux du navigateur (voir style.css, --sa…)
function lobbyEncoche(e) {
  if (!e || typeof e !== 'object') return;
  const st = document.documentElement.style;
  for (const [cle, nom] of [
    ['haut', '--saT'],
    ['bas', '--saB'],
    ['gauche', '--saL'],
    ['droite', '--saR']
  ])
    if (typeof e[cle] === 'number' && isFinite(e[cle])) st.setProperty(nom, Math.max(0, Math.min(200, e[cle])) + 'px');
}
// au lancement (boucle.js) : vrai si la partie a été lancée pour le lobby (le menu de départ ne s'ouvre pas)
function lobbyPret() {
  if (!LOBBY) return false;
  save.mode = 'out';
  if (HEROS[LOBBY.heros]) save.hero = LOBBY.heros;
  if (WEAP[LOBBY.arme]) save.weap = LOBBY.arme;
  // V4.8 : l'élément de l'arme emportée (sinon celui du héros : newRun)
  elementArmeLobby = ELKEYS.includes(LOBBY.elementArme) ? LOBBY.elementArme : null;
  // V5.2 : l'élément choisi du héros (sinon sa clé)
  elHerosLobby = ELKEYS.includes(LOBBY.elHeros) ? LOBBY.elHeros : null;
  // V4.9 : la voie du héros (opts.voie = { id: 'a' | 'b', nom } ou null)
  voieLobby = LOBBY.voie && (LOBBY.voie.id === 'a' || LOBBY.voie.id === 'b') ? LOBBY.voie.id : null;
  bonusLobby = LOBBY.bonus && typeof LOBBY.bonus === 'object' ? LOBBY.bonus : null;
  rangLobby = Math.max(1, Math.min(4, Math.round(+LOBBY.rang) || 1));
  lobbyEncoche(LOBBY.encoche);
  $('eMenu').textContent = 'Retour au lobby';
  // le jour de départ : celui demandé s'il est permis (case « Raccourci » de l'arbre), sinon le plus loin permis
  const jours = startDays();
  newGame(jours.includes(LOBBY.jour) ? LOBBY.jour : Math.max(...jours));
  return true;
}
// chaque nouvelle partie (la première, « Rejouer », « Continuer sans fin ») : la bourse du marchand à la première seulement, puis « pret »
let lobbyN = 0;
function lobbyPartie() {
  if (!LOBBY) return;
  lobbyN++;
  let argent = 0;
  if (lobbyN === 1 && bonusLobby) {
    argent = Math.round(bonusNb(bonusLobby.argent, 0, 0, 1e6));
    if (argent) {
      save.cash = (save.cash || 0) + argent;
      store();
      toast('Bourse du marchand : +' + fmt(argent) + ' $', 2600);
    }
  }
  if (S.rangK > 1)
    setTimeout(
      () => toast('Rang ' + rangLobby + ' : zombies ×' + String(S.rangK).replace('.', ',') + ' de vie', 2600),
      argent ? 2800 : 600
    );
  versLobby({
    dt: 'pret',
    heros: save.hero,
    arme: save.weap,
    elementArme: S.elArme || null,
    elHeros: S.elHeros || null,
    voie: S.voie || null,
    jour: S.day,
    partie: lobbyN,
    rang: rangLobby,
    argent,
    sansFin: !!S.endless
  });
}
// « Rang 2 · Braise, Mage niv. 4 · Fusil à pompe niv. 3 » (écran de fin) : rien hors lobby (l'élément des balles : heroLigne, menu.js)
function lobbyLigne() {
  if (!LOBBY) return '';
  const n = bonusLobby && bonusLobby.niveaux && typeof bonusLobby.niveaux === 'object' ? bonusLobby.niveaux : {},
    niv = v => (Number.isFinite(+v) && +v > 0 ? ' niv. ' + Math.round(+v) : ''),
    h = HEROS[S.hero],
    w = WEAP[S.weap];
  return (
    [
      'Rang ' + rangLobby,
      h ? heroRole(S.hero) + (S.voie ? ' (' + voieNom(S) + ')' : '') + niv(n.heros) : '',
      w ? w.n + niv(n.arme) + (S.elArme ? ' ' + ELDE[S.elArme] : '') : ''
    ]
      .filter(Boolean)
      .join(' · ') + " — tes gains pour l'île sont comptés au lobby."
  );
}
// la fin d'une partie, envoyée une seule fois par partie (showEnd peut être rappelé en revenant de l'arbre)
function lobbyFin(won) {
  if (!LOBBY || !S || S.lobbyEnvoye) return;
  S.lobbyEnvoye = true;
  versLobby({
    dt: 'fin',
    victoire: !!won,
    jour: S.day,
    depart: S.depart || 1,
    tues: S.runKills,
    fuyards: S.escaped,
    argent: S.runCash,
    boss: S.boss,
    duree: Math.round(S.jeuT),
    chutes: S.chutes,
    rang: rangLobby,
    dev: !!S.devUse,
    // V4.3 : la partie à plusieurs : joueurs sur le toit à la fin (1 en solo), et si ce téléphone était l'hôte
    joueurs: MULTI.actif ? 1 + MULTI.pairs.size : 1,
    hote: !(MULTI.actif && !MULTI.hote),
    sansFin: !!S.endless,
    raison: won ? 'secouru' : S.abandon ? 'abandon' : S.why === 'joueur' ? 'envahi' : S.mode === 'out' ? 'ville' : 'submerge',
    heros: S.hero,
    arme: S.weap,
    elementArme: S.elArme || null,
    voie: S.voie || null
  });
}
// le lobby peut changer l'encoche en cours de route (téléphone tourné) : { dt: 'encoche', haut, bas, gauche, droite }
window.addEventListener('message', e => {
  const m = e.data;
  if (LOBBY && m && m.dt === 'encoche' && e.source === window.parent) lobbyEncoche(m);
});
