// [regles/ciel.js] La vue du ciel vue par les règles : le chrono de 30 s entre deux vagues et les joueurs « Prêts ». L'affichage est dans interface/ciel.js.
// Demande de Frédéric (25/11) : « à chaque fin de vague, l'écran se dézoome pour passer à une vue comme dans CoC, du ciel, et on a genre 30 s pour placer de nouvelles défenses,
// améliorer les existantes et construire des murs / trous ». La vague part au bout de 30 s, ou plus tôt quand tous les joueurs ont appuyé sur Prêt.
// Avant la vague 1 : pas de chrono, on part quand tout le monde est prêt. Pendant le tutoriel (s.cNoT) : pas de chrono non plus.
// Seul l'hôte décide ; les invités reçoivent le chrono et le compte des prêts par snap (clés cT, cR, cN).
const CIEL = {
  prepT: 30, // secondes de vue du ciel entre deux vagues
  wait1: 30 // à plusieurs, avant la vague 1 : au bout de tant de secondes d'attente, un chrono de prepT démarre (un coéquipier absent ne bloque pas l'équipe)
};
// les joueurs humains présents : l'hôte (« h ») et les coéquipiers qui ne sont pas des bots
const cielIds = s =>
  ['h'].concat(
    Object.keys(s.others)
      .filter(k => !s.others[k].bot && s.others[k].id !== undefined)
      .map(k => s.others[k].id)
  );
// un joueur dit qu'il est prêt (ou ne l'est plus) ; h = le héros qui agit (sim.hero chez l'hôte, un coéquipier sinon)
function cielReady(s, h, on) {
  if (s.phase !== 'prep' || s.over) return;
  const id = h === s.hero ? 'h' : h && h.id;
  if (id === undefined || id === null) return;
  s.cRdy = s.cRdy || {};
  if (on) s.cRdy[id] = 1;
  else delete s.cRdy[id];
}
// un pas de la vue du ciel, à la fin de step()
function cielStep(s, dt) {
  if (s.phase !== 'prep' || s.over) {
    s.cW = -1;
    return;
  }
  if (s.client) {
    if (s.cT > 0) s.cT = Math.max(0, s.cT - dt); // l'invité fait défiler le chrono entre deux instantanés de l'hôte
    return;
  }
  if (s.cW !== s.wave) {
    // une nouvelle préparation commence : chrono neuf (sauf avant la vague 1 et pendant le tutoriel), personne n'est prêt
    s.cW = s.wave;
    s.cT = s.wave >= 1 && !s.cNoT ? CIEL.prepT : -1;
    s.cRdy = {};
    s.cA = 0;
  }
  const ids = cielIds(s);
  s.cN = ids.length;
  s.cA = (s.cA || 0) + dt;
  if (s.cT < 0 && s.wave === 0 && s.cN > 1 && !s.cNoT && s.cA >= CIEL.wait1) s.cT = CIEL.prepT; // audit V2.0, problème 14
  s.cR = ids.filter(id => s.cRdy && s.cRdy[id]).length;
  if (s.cR >= s.cN && s.cN > 0) {
    startWave(s);
    return;
  }
  if (s.cT > 0) {
    s.cT -= dt;
    if (s.cT <= 0) {
      s.cT = 0;
      startWave(s);
    }
  }
}
