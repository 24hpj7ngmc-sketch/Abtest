// [interface/tables.js] Les tables de L'Île des Cinq dont le lobby se sert pour ses textes (arbres des héros et des armes, panneau du portail, renom).
// ---------- Les règles du jeu ne sont plus dans cette page (V11.1) : elles vivent dans ile/ile-pour-lobby.js. Le jeu publie ses tables dans IleDesCinq.tables ;
// quand il en donne une, c'est elle qui fait foi. Depuis L'Île des Cinq V1.1 il les donne toutes (claude/demande-ile-tables.md et claude/reponse-ile-tables.md) :
// la copie ci-dessous, relevée sur les règles V1.0 le 23/11/2026, n'est plus qu'un secours si une table manquait un jour. tests/runtables.js vérifie que rien ne retombe sur elle.
const ILET = (typeof IleDesCinq === 'object' && IleDesCinq && IleDesCinq.tables) || {};
// ce que le jeu donne n'est pris que s'il a la forme de la copie (mêmes clés, mêmes types, nombres finis) ; le reste vient de la copie
const ileGarde = (t, copie) => {
    if (Array.isArray(copie))
      return Array.isArray(t) && t.length === copie.length && t.every((v, i) => typeof v === typeof copie[i])
        ? t
        : copie;
    if (copie && typeof copie === 'object') {
      const o = {};
      for (const k in copie) o[k] = ileGarde(t && typeof t === 'object' ? t[k] : undefined, copie[k]);
      return o;
    }
    return typeof t === typeof copie && (typeof t !== 'number' || Number.isFinite(t)) ? t : copie;
  },
  ileTab = (nom, copie) => ileGarde(ILET[nom], copie);
// les cinq éléments de la campagne et leurs héros ; qui bat qui (BEATS[a] = b : a bat b ; la boucle à six depuis L'Île des Cinq V2.1) et qui craint qui
const ELS = ['feu', 'eau', 'bois', 'terre', 'elec'],
  EL = ileTab('EL', {
    feu: { n: 'Feu', c: '#ff6a3d', hero: 'Braise' },
    eau: { n: 'Eau', c: '#3fa9ff', hero: 'Ondine' },
    bois: { n: 'Nature', c: '#5fd068', hero: 'Sylve' },
    terre: { n: 'Terre', c: '#cf9a5c', hero: 'Roc' },
    elec: { n: 'Élec', c: '#ffd93b', hero: 'Volt' }
  }),
  BEATS = ileTab('BEATS', { eau: 'feu', feu: 'bois', bois: 'vent', vent: 'terre', terre: 'elec', elec: 'eau' }),
  WEAKTO = {};
for (const k in BEATS) WEAKTO[BEATS[k]] = k;
// la campagne : résistance des ennemis par niveau, nombre de niveaux par type, vagues par niveau, attaquant spécial de chaque type et son nom
const CAMPK = ileTab('CAMPK', [1, 1.35, 1.8, 2.4]),
  CAMPN = ileTab('CAMPN', 4),
  CAMPW = ileTab('CAMPW', 20),
  CAMPS = ileTab('CAMPS', { feu: 'inc', eau: 'soi', elec: 'bro', terre: 'gol', bois: 'sem', vent: 'tou' }),
  KINDS = ileTab('KINDS', {
    inc: { n: 'Incendiaire' },
    soi: { n: 'Soigneur' },
    bro: { n: 'Brouilleur' },
    gol: { n: 'Golem' },
    sem: { n: 'Semeur' },
    tou: { n: 'Tourbillon' }
  });
// le style de chaque héros : sa compétence, son ultime, son étiquette
const KIT = ileTab('KIT', {
  terre: { skill: 'Rempart', ult: 'Séisme', tag: 'Tank · Rempart · Séisme' },
  elec: { skill: 'Éclair', ult: 'Orage', tag: 'Assassin · Éclair · Orage' },
  bois: { skill: 'Ronces', ult: 'Gardiens', tag: 'Combattant · Ronces · Gardiens' },
  feu: { skill: 'Brasier', ult: 'Météores', tag: 'Mage · Brasier · Météores' },
  eau: { skill: 'Marée', ult: 'Déluge', tag: 'Support · Marée · Déluge' }
});
// les réglages d'équilibre cités dans les textes du lobby (BAL : la base ; BALN : le mode normal)
const BAL = ileTab('BAL', {
    braiseSplash: 0.4,
    crit: 0.12,
    critK: 2,
    dashCd: 16,
    dashLen: 14,
    dup: 0.3,
    fbCd: 18,
    fbR: 6,
    floodCore: 3,
    floodT: 8,
    guardT: 15,
    gun: 3.2,
    heroHp: 100,
    markK: 0.6,
    metN: 8,
    metR: 5,
    ondRegen: 10,
    quakeR: 12,
    quakeT: 2.5,
    rempartCd: 36,
    rempartT: 15,
    rocArmor: 0.7,
    ronceCd: 24,
    ronceR: 5,
    ronceT: 8,
    stormR: 16,
    stormT: 6,
    tideCd: 22,
    tideHeal: 35,
    tideKnock: 5,
    voltSprint: 1.3
  }),
  BALN = ileTab('BALN', { waves: 20 });
