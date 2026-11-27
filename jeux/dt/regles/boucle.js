// ===================== UN PAS DE JEU =====================
// step(S, dt, inp) fait avancer la partie de dt secondes (au plus 0,05) avec les commandes inp ; l'interface l'appelle à chaque image
// (plusieurs fois en vitesse ×2 / ×4 du mode dev), puis lit et vide S.ev (les événements, voir LISEZMOI.md).
// Fournit aux autres dossiers : step (interface).

// Le cycle d'un pas : le joueur (déplacement, tir) → le coup de masse → la marche recalculée (un niveau au plus) → la journée (sortie
// de la horde, recharges) → le champ vers le joueur (4 fois par seconde) → les zombies → la grille de voisinage → les tourelles →
// ce qui est en vol → les héros → le rangement des morts → les cadavres → la fin de la journée.
function step(S, dt, inp) {
  if (dt > 0.05) dt = 0.05;
  S.t += dt;
  if (S.phase === 'dead' || S.phase === 'won') return;
  playerStep(S, dt, inp);
  // le coup de masse porte au tiers du geste
  if (S.swing > 0) {
    S.swing -= dt;
    if (!S.swingHit && S.swingT - S.swing >= S.swingT * 0.35) {
      S.swingHit = 1;
      masseHit(S);
    }
    if (S.swing < 0) S.swing = 0;
  }
  navFlush();
  // pendant le jour : la horde sort au rythme de la journée (dayN zombies en dayDur secondes), sans dépasser S.cap à la fois ;
  // les recharges du missile, du leurre et de la frappe ne baissent que le jour
  if (S.phase === 'day') {
    S.dayT += dt;
    S.jeuT += dt;
    if (S.toSpawn > 0) {
      S.spAcc += (dt * S.dayTotal) / dayDur(S);
      while (S.spAcc >= 1 && S.toSpawn > 0 && S.nAct < S.cap) {
        S.spAcc -= 1;
        if (!spawnOne(S)) break;
      }
      if (S.spAcc > 4) S.spAcc = 4;
    }
    S.misCd = Math.max(0, S.misCd - dt);
    S.leuCd = Math.max(0, S.leuCd - dt);
    S.airCd = Math.max(0, S.airCd - dt);
  }
  // le champ de marche vers le joueur, à son niveau (toutes les 0,25 s, ou tout de suite s'il a changé de niveau)
  S.pfT -= dt;
  if (S.pfT <= 0 || S.pfLv !== S.plv) {
    S.pfT = 0.25;
    S.pfLv = S.plv;
    bfs(S.plv, [nearWalk(S.plv, S.p.x, S.p.z)], S.pf);
  }
  // V4.4 (multi, chez l'hôte) : les invités aussi sont chassés dans l'immeuble (regles/multi.js)
  if (S.mInvites && S.mInvites.length) majCibles(S, dt);
  else if (S.mCibles && S.mCibles.length) S.mCibles = [];
  zombiesStep(S, dt);
  gridBuild(S);
  turretsStep(S, dt);
  projStep(S, dt);
  heroStep(S, dt);
  compact(S);
  corpsesStep(S, dt);
  dayEndStep(S, dt);
}
