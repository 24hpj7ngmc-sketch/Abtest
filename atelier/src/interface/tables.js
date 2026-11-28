// [interface/tables.js] Les tables de L'Île des Cinq dont le lobby se sert pour ses textes (arbres des héros et des armes, panneau du portail, renom).
// Les règles du jeu ne sont pas dans cette page : elles vivent dans ile/ile-pour-lobby.js, qui publie ses tables dans IleDesCinq.tables (claude/reponse-ile-tables.md).
// Le jeu est collé avec le lobby, il fait foi : un chiffre changé dans le jeu se voit dans les textes du lobby au recollage suivant.
const ILET = IleDesCinq.tables,
  // une table indexée par clé, réduite aux clés voulues (et aux champs voulus s'il y en a)
  pris = (t, cles, champs) => {
    const o = {};
    for (const k of cles) o[k] = champs ? Object.fromEntries(champs.map(c => [c, t[k][c]])) : t[k];
    return o;
  };
// les cinq éléments de la campagne et leurs héros ; qui bat qui (BEATS[a] = b : a bat b ; la boucle à six)
const ELS = ['feu', 'eau', 'bois', 'terre', 'elec'],
  EL = pris(ILET.EL, ELS, ['n', 'c', 'hero']),
  BEATS = ILET.BEATS;
// la campagne : résistance des ennemis par niveau, nombre de niveaux par type, vagues par niveau, attaquant spécial de chaque type et son nom
const CAMPK = ILET.CAMPK,
  CAMPN = ILET.CAMPN,
  CAMPW = ILET.CAMPW,
  CAMPS = ILET.CAMPS,
  KINDS = pris(ILET.KINDS, Object.values(CAMPS), ['n']);
// le style de chaque héros : sa compétence, son ultime, son étiquette
const KIT = pris(ILET.KIT, ELS, ['skill', 'ult', 'tag']);
// les réglages d'équilibre cités dans les textes du lobby (BAL : la base ; BALN : le mode normal)
const BAL = ILET.BAL,
  BALN = ILET.BALN;
