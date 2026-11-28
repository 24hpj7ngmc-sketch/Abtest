// [regles/tables.js] Les tables du jeu : éléments et héros, réglages d'équilibre (BAL), campagne et attaquants spéciaux, types de défenses, chemins.
// SIX ÉLÉMENTS ET SIX RÔLES (V2.1, refonte du lobby du 27/11 : claude/refonte-roles-contrat.md). Un héros garde sa clé, qui est aussi son élément de prédilection ;
// « bois » s'affiche « Nature » ; le Vent est nouveau (Zéphyr, le Tireur). `role` : la famille du héros, façon LoL.
const ELS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
// V2.5 : l'élément d'un héros = l'élément choisi au Hall (h.ce, une des six clés) ; sans choix (ou valeur douteuse), la clé du héros. La clé h.el reste son identité (kit, voies, nom, modèle).
const elOf = h => (h && ELS.includes(h.ce) ? h.ce : h.el);
// les deux voies de chaque héros (V2.2, noms du lobby) : 'a' et 'b' ; le jeu les lit dans opts.voie
const VOIEN = {
  terre: { a: 'Gardien', b: 'Avant-garde' },
  bois: { a: 'Colosse', b: 'Plongeur' },
  elec: { a: 'Lame', b: 'Escarmoucheur' },
  feu: { a: 'Artilleur', b: 'Mage de bataille' },
  eau: { a: 'Soigneuse', b: 'Entraveuse' },
  vent: { a: 'Sniper', b: 'Mitrailleur' }
};
const EL = {
  feu: { n: 'Feu', c: '#ff6a3d', hero: 'Braise', role: 'Mage' },
  eau: { n: 'Eau', c: '#3fa9ff', hero: 'Ondine', role: 'Support' },
  bois: { n: 'Nature', c: '#5fd068', hero: 'Sylve', role: 'Combattant' },
  terre: { n: 'Terre', c: '#cf9a5c', hero: 'Roc', role: 'Tank' },
  elec: { n: 'Élec', c: '#ffd93b', hero: 'Volt', role: 'Assassin' },
  vent: { n: 'Vent', c: '#8fe6dc', hero: 'Zéphyr', role: 'Tireur' }
};
// La boucle des faiblesses, à six : Eau éteint le Feu, Feu brûle la Nature, Nature brise le Vent, Vent érode la Terre, Terre absorbe l'Élec, Élec électrocute l'Eau.
// ×1,5 contre l'élément battu (BAL.strong, plus l'arbre du marchand), ×0,75 contre celui qui nous bat (×0,5 contre un boss), ×1 sinon, même élément compris. Avant (V2.0) : boucle à cinq, ×2 / ×0,5.
const BEATS = { eau: 'feu', feu: 'bois', bois: 'vent', vent: 'terre', terre: 'elec', elec: 'eau' };
const WEAKTO = {};
for (const k in BEATS) WEAKTO[BEATS[k]] = k;
function mult(a, d, boss, st) {
  if (BEATS[a] === d) return st || 1.5;
  if (BEATS[d] === a) return boss ? 0.5 : 0.75;
  return 1;
}
const R_ISLE = 120,
  PATH_HALF = 2.1;
// ÉQUILIBRAGE : tous les chiffres qui règlent la difficulté sont ici
const BAL = {
  waves: 10,
  core: 20, // nombre de vagues, vie du cœur
  wall: 12,
  wallMax: 120,
  wallLine: 24,
  wallTop: 3,
  wallRange: 2, // mur : prix par bloc, nombre de cases maximum, longueur maximale d'une ligne, hauteur maximale en blocs, portée gagnée par étage pour une défense posée dessus
  dig: 8,
  pitTop: 2,
  pitMax: 120,
  pitSlow: 0.3,
  pitCost: 1.5, // fosse : prix par bloc creusé, profondeur maximale, nombre de cases maximum, ralentissement par niveau de profondeur, surcoût de passage pour les ennemis
  climbSp: 3.2,
  climbWait: 0.2, // escalade : vitesse de montée, temps à pousser contre l'obstacle avant de s'y agripper
  heroHp: 100,
  regen: 6,
  regenWait: 5,
  respawn: 8,
  reviveT: 3,
  hDmgG: 0.03, // héros : vie, soin par seconde après regenWait s sans coup, délai de retour, temps pour être relevé, hausse des dégâts ennemis par vague
  smashCd: 6,
  smashR: 7,
  smashT: 2, // tank : toutes les smashCd s, il met hors service smashT s la défense la plus proche à moins de smashR m
  objP: 0.6,
  zoneR: 6,
  zoneNeed: 15,
  zoneTime: 50,
  relicTime: 70,
  bombHp: 5,
  bombLeak: 5, // objectifs : chance par vague, zone (rayon, secondes à tenir, délai), délai de la relique, porteur de bombe (vie ×, dégâts au cœur)
  strong: 1.5, // la boucle des faiblesses : dégâts contre l'élément battu (×0,75 contre celui qui nous bat, dans mult)
  predi: 0.1, // prédilection : +10 % de dégâts avec une arme de l'élément du héros
  ventLift: 0.6, // balles de Vent : les petits ennemis touchés sont soulevés (immobiles) 0,6 s, plus l'arbre « Élément des balles » (eLift)
  zephCd: 14,
  zephLen: 8,
  zephPush: 6,
  zephFar: 30,
  zephK: 0.2,
  perceDmg: 90,
  perceR: 1.5,
  perceLen: 110, // Zéphyr : Rafale (recharge, longueur du bond, rayon du souffle avec kPush), passif (au-delà de zephFar m, +zephK de dégâts, +5 points par niveau pA), Tir perçant (dégâts, demi-largeur, longueur)
  // LES VOIES (V2.2) : le kit de base ne change pas, la voie le modifie (claude/refonte-roles-contrat.md, point 6). Les cases spA1… arrivent du lobby, en valeurs brutes.
  gardR: 2,
  gardK: 0.3,
  gardRef: 2, // Roc Gardien : les alliés à gardR m (+spA1) de lui prennent −30 % ; Rempart large ; spA2 : il renvoie deux fois les coups reçus au contact
  chargeLen: 6,
  chargeDmg: 60,
  chargeStun: 1.2,
  chargeCd: 18,
  chargeR: 4, // Roc Avant-garde : le Rempart devient une charge de 6 m (+spB1) qui blesse et renverse ; spB2 : renverse aussi à 4 m de l'arrivée
  colHp: 60,
  colHeal: 2,
  colR: 7, // Sylve Colosse : +60 PV (+spA1) ; spA2 : chaque balle qui touche à moins de 7 m la soigne de 2 PV
  plongeLen: 8, // Sylve Plongeur : les Ronces la font bondir jusqu'à leur point de chute, 8 m au plus (+spB1) ; spB2 : le poison passe aux voisins quand la cible meurt
  lameK: 0.3,
  lameR: 5,
  lameExe: 0.15, // Volt Lame : +30 % (+spA1) sur une cible seule (personne à 5 m) ; spA2 : achève sous 15 % de vie
  escK: 0.25, // Volt Escarmoucheur : chaque élimination rend 25 % (+spB1) de la recharge de l'Éclair ; spB2 : une élimination par l'Éclair le relance
  artiK: 0.25,
  artiFb: 8,
  fireStay: 4, // Braise Artilleur : portée des balles +25 % (+spA1 m), Brasier lancé 8 m plus loin ; spA2 : les flammes du Brasier et des Météores durent 4 s de plus
  auraR: 3,
  auraDps: 10,
  auraK: 0.25, // Braise Mage de bataille : une aura brûle à 3 m (+spB1) autour de lui ; spB2 : −25 % de dégâts reçus
  soinK: 0.3,
  shield: 30,
  shieldT: 8, // Ondine Soigneuse : la Marée soigne +30 % (+spA1) ; spA2 : elle pose un bouclier de 30 PV pour 8 s
  rootT: 1.5,
  delugeRoot: 1.5, // Ondine Entraveuse : la Marée immobilise 1,5 s (+spB1) au lieu de repousser ; spB2 : le Déluge immobilise tout ce qui marche à son arrivée
  snipFar: 40,
  snipK: 0.15,
  chargeT: 1.2,
  chargeK: 1.5, // Zéphyr Sniper : +15 % (+spA1) au-delà de 40 m ; spA2 : après 1,2 s sans tirer, le tir est chargé (×1,5, perce l'armure)
  mitK: 0.1,
  mitRamp: 0.3,
  mitRampT: 3, // Zéphyr Mitrailleur : +10 % de cadence (+spB1) en courant ; spB2 : la cadence monte jusqu'à +30 % en 3 s de tir continu
  // LES RÔLES DES ENNEMIS (V2.2) : l'assassin fonce sur un héros proche, le tireur et le mage tirent de plus loin, le tank attire les tirs des défenses
  assR: 20,
  assT: 7,
  assRest: 5,
  assSp: 1.2,
  mageR: 16,
  tirR: 14,
  touR: 7,
  touPush: 3,
  touCd: 3, // Vent, le Tourbillon : toutes les 3 s, une bourrasque pousse de 3 m vers le cœur les ennemis à 7 m de lui
  rocHp: 50,
  rocArmor: 0.7,
  rempartT: 15,
  rempartCd: 36,
  rempartH: 2,
  quakeR: 12,
  quakeDmg: 60,
  quakeT: 2.5, // Roc : vie en plus, part des dégâts au contact qu'il subit, durée, recharge et hauteur en blocs du Rempart, Séisme (rayon, dégâts, étourdissement)
  gun: 3.2,
  crit: 0.12,
  critK: 2,
  markT: 4,
  markK: 0.6, // fusil : dégâts d'une balle, chance et multiplicateur de coup critique, durée de la marque posée sur la cible, bonus de dégâts des défenses sur une cible marquée
  ultTick: 0.4,
  ultHit: 0.35,
  ultHurt: 0.8, // charge de l'ultime sur 100 : par seconde de vague, par tir qui touche, par point de vie perdu
  voltHp: -15,
  voltSprint: 1.3,
  dashCd: 16,
  dashLen: 14,
  dashDmg: 40,
  stormT: 6,
  stormR: 16,
  stormDmg: 28, // Volt : vie en moins, sprint ×, Éclair (recharge, longueur, dégâts), Orage (durée, rayon, dégâts par éclair)
  sylveSee: 20,
  ronceCd: 24,
  ronceR: 5,
  ronceT: 8,
  ronceDmg: 14,
  guardT: 15, // Sylve : distance à laquelle elle révèle les furtifs, Ronces (recharge, rayon, durée, dégâts par seconde), durée des Gardiens
  fbCd: 18,
  fbR: 6,
  fbDmg: 55,
  fbZoneT: 4,
  metN: 8,
  metR: 5,
  metDmg: 70,
  braiseSplash: 0.4, // Braise : Brasier (recharge, rayon, dégâts, durée des flammes au sol), Météores (nombre, rayon, dégâts), part des dégâts de tir qui éclabousse autour
  ondWait: 2.5,
  ondRegen: 10,
  tideCd: 22,
  tideR: 10,
  tideHeal: 35,
  tideDmg: 25,
  tideKnock: 5,
  floodT: 8,
  floodDps: 6,
  floodCore: 3, // Ondine : soin naturel (délai, par seconde), Marée (recharge, rayon, soin, dégâts, recul), Déluge (durée, dégâts par seconde, points rendus au cœur)
  boatR: 147,
  seaK: 1.7,
  raidW: 5,
  raidP: 0.45,
  raidK: 0.8,
  raidT: 10,
  canW: 3,
  canCd: 10,
  canR: 45,
  canT: 2, // navires : distance du centre de l'île, vitesse à gué (× la vitesse normale) ; navire surprise (dès la vague, chance par vague, taille de sa meute × une meute normale, délai avant qu'il débarque) ; canons (dès la vague, recharge, portée autour de la plage, durée de la panne)
  grassWide: 1.7,
  wayWide: 30,
  wayDirect: 30,
  fanW: 30,
  spawnW: 6.5,
  packMin: 4,
  packG: 0.6,
  packMax: 14,
  packGap: 0.12, // invasion : coût de l'herbe pour ceux qui coupent à travers champs, % qui coupent / qui partent en éventail (dès la vague 3), largeur de l'éventail de chaque côté, demi-largeur de sortie autour du portail, taille des meutes (base, + par vague, max), écart dans une meute
  grass: 5,
  fmK: 0.88, // marcher hors route coûte 5 fois plus (les ennemis préfèrent la route) ; fmK compense les virages coupés
  cnt0: 6,
  cntG: 3,
  gap: 0.85,
  gapG: 0, // ennemis par vague (base + par vague), écart entre deux sorties et sa baisse par vague
  goldK: 1,
  ptsW: 2, // or par ennemi (multiplicateur), points de grille par vague
  pupP: 0.035,
  pupMax: 3,
  pupLife: 28,
  pupR: 2.6,
  pupCore: 6,
  pupBoss: 0.2, // bonus à ramasser : chance par ennemi abattu, nombre maximum par vague (hors boss), secondes au sol, rayon de ramassage, points rendus au cœur (Charpentier), part de vie retirée à un boss (Bombe)
  lvK: 1,
  gold0: 130,
  wbK: 1,
  potK: 1, // lvK : de combien le niveau de difficulté monte à chaque vague · or de départ · multiplicateur des primes (fin de vague, objectifs) · part du pot sur une victime des défenses (mode normal)
  hp0: 26,
  hpG: 0.36,
  bossHp: 900,
  bossT: [1, 1.8, 2.5], // vie d'un ennemi de base vague 1, hausse par vague, vie du boss vague 5
  multi: 0.6, // vie des ennemis en plus par joueur supplémentaire (+60 %)
  esc: 0.08, // chaque défense déjà posée renchérit la suivante de 8 %
  upG: 0.35, // hausse du coût des améliorations après la 3e
  dup: 0.3, // bonus de dégâts par niveau supplémentaire d'un même élément
  armor0: 2,
  armorG: 0.4, // blindage du tank : base + par vague
  pot0: 100,
  potWave: 30,
  potWaveG: 5
}; // mode normal : pot commun des défenses au départ, puis versé à chaque vague (base + par vague)
// mode normal : 20 vagues bien plus fournies (35 jusqu'à la V7.7 : trop long, le plaisir arrivait trop tard). La montée est la même qu'avant mais resserrée :
// chaque vague fait grimper le niveau de difficulté de lvK (34/19), si bien que la vague 20 vaut l'ancienne 35. Ce qui n'est pas listé ici reprend les valeurs du dessus.
// Or (V9.9, demande de Frédéric : « l'autonomie dépense tout l'or qu'on gagne ») : ce que tuent les défenses va au pot (potK = la moitié de la valeur, comme avant ; le pot en entier rendait le jeu plus facile, mesuré), qui paie l'autonomie (défenses automatiques, améliorations auto, bots et esclaves), et plus rien au joueur ;
// ce que tuent les joueurs et les bots va en entier aux joueurs. L'or du joueur n'est plus dépensé que par lui. Avant la V9.9 : moitié-moitié, et les bots bâtissaient avec l'or du joueur.
const BALN = Object.assign({}, BAL, {
  waves: 20,
  lvK: 34 / 19,
  gold0: 200,
  wbK: 2,
  potK: 0.5,
  core: 40,
  cnt0: 12,
  cntG: 4,
  gapG: 0.013,
  goldK: 1,
  ptsW: 2,
  hpG: 0.4,
  bossHp: 1400,
  armorG: 0.2,
  pot0: 140,
  potWave: 80,
  potWaveG: 10
});
const bal = s => (s.mode === 'normal' ? BALN : BAL);
// LA CAMPAGNE (V9.1) : un niveau = un type (un élément) + un rang de difficulté. Règles du mode normal, CAMPW vagues, 85 % des groupes dominants et tous les boss sont du type (environ deux ennemis sur trois),
// les ennemis ont CAMPK[rang-1] fois plus de vie ; mêmes 20 vagues et mêmes boss que le mode normal (Frédéric, 17/11 : « la base du jeu en 20 était très bien »). setCamp se pose juste après newSim. Plus tard : attaquants spéciaux et carte par type.
const CAMPK = [1, 1.35, 1.8, 2.4],
  CAMPW = 20,
  CAMPN = CAMPK.length;
// L'attaquant spécial de chaque type (étape 2 de la campagne, un type à la fois) : il n'apparaît que dans les niveaux de ce type, à partir de la vague 2, de plus en plus nombreux.
// Feu, l'Incendiaire : toutes les 1 s il laisse une flaque de flammes (zone « foe », 4 s) qui brûle le héros au sol (FIREH toutes les 0,5 s) et fait taire les défenses qu'elle touche. Elle ne fait rien aux ennemis.
const CAMPS = { feu: 'inc', eau: 'soi', elec: 'bro', terre: 'gol', bois: 'sem', vent: 'tou' },
  CAMPC = { gol: 0.5 },
  FIRER = 2,
  FIRET = 4,
  FIREH = 4,
  FIREMAX = 24; // CAMPC : moins nombreux (le Golem compte pour quatre)
// Eau, le Soigneur : chaque seconde il rend 8 % de leur vie aux ennemis à 6 m (1,5 % aux boss), pas à lui ni aux autres Soigneurs.   Élec, le Brouilleur : les défenses à 7 m de lui ne tirent plus.
// Terre, le Golem : en mourant il se casse en trois Éclats rapides.   Bois, le Semeur : en mourant il laisse une Graine immobile ; si elle tient 5 s il repousse, une seule fois.
// Vent, le Tourbillon (V2.2) : toutes les BAL.touCd s, une bourrasque pousse vers le cœur les ennemis autour de lui (il faut l'abattre en premier).
const HEALR = 6,
  HEALK = 0.08,
  JAMR = 7,
  SEEDT = 5;
function kidOf(s, e, k, hp, i, o) {
  const id = s.nid++,
    a = i * 2.1 + id,
    c = Object.assign(
      {
        id,
        el: e.el,
        path: e.path,
        d: e.d || 0,
        hp,
        max: hp,
        sp: (KINDS[k] || KINDS.b).sp,
        k,
        arm: 0,
        rev: 0,
        atk: 0,
        bur: false,
        ang: 0,
        boss: false,
        bt: 0,
        off: offOf(id),
        slow: 0,
        burn: 0,
        stun: 0,
        x: e.x + (i ? Math.cos(a) * 0.7 : 0),
        z: e.z + (i ? Math.sin(a) * 0.7 : 0),
        fm: true,
        tc: null,
        ox: offOf(id) * 0.7,
        oz: offOf(id * 3 + 1) * 0.7,
        dx: e.dx || 0,
        dz: e.dz || 0,
        rem: e.rem,
        gy: e.gy || 0
      },
      o || {}
    );
  s.enemies.push(c);
  return c;
}
const CAMPT = {
  inc: (s, e, dt) => {
    e.ft = (e.ft || 0.5) - dt;
    if (e.ft <= 0) {
      e.ft = 1;
      foeFire(s, e);
    }
  },
  soi: (s, e, dt) => {
    e.ft = (e.ft || 1) - dt;
    if (e.ft > 0) return;
    e.ft = 1;
    let n = 0;
    for (const o of s.enemies)
      if (o !== e && o.k !== 'soi' && o.hp > 0 && o.hp < o.max && !o.sea && Math.hypot(o.x - e.x, o.z - e.z) < HEALR) {
        o.hp = Math.min(o.max, o.hp + o.max * (o.boss ? 0.015 : HEALK));
        n++;
      }
    if (n) s.events.push({ k: 'heal', x: e.x, z: e.z, r: HEALR });
  },
  bro: (s, e, dt) => {
    e.ft = (e.ft || 0.2) - dt;
    if (e.ft > 0) return;
    e.ft = 0.4;
    let n = 0;
    for (const t of s.towers)
      if (Math.hypot(t.x - e.x, t.z - e.z) < JAMR) {
        t.off = Math.max(t.off || 0, 0.6);
        n++;
      }
    e.fj = (e.fj || 0) + 1;
    if (n && e.fj % 3 === 0) s.events.push({ k: 'jam', x: e.x, z: e.z, r: JAMR });
  },
  tou: (s, e, dt) => {
    e.ft = (e.ft === undefined ? 1.5 : e.ft) - dt;
    if (e.ft > 0 || e.stun > 0) return;
    e.ft = BAL.touCd;
    let n = 0;
    for (const o of s.enemies)
      if (
        o !== e &&
        o.hp > 0 &&
        o.fm &&
        !o.sea &&
        !o.boss &&
        !(o.stun > 0) &&
        Math.hypot(o.x - e.x, o.z - e.z) < BAL.touR
      ) {
        if (o.wp) wpMove(s, o, BAL.touPush);
        else fieldMove(s, o, BAL.touPush);
        n++;
      }
    s.events.push({ k: 'gust', x: e.x, z: e.z, r: BAL.touR, n });
  },
  gra: (s, e, dt) => {
    e.stun = Math.max(e.stun, 0.5);
    e.gt = (e.gt === undefined ? SEEDT : e.gt) - dt;
    if (e.gt <= 0) {
      kidOf(s, e, 'sem', e.par || e.max * 2.6, 0, { re: 1 });
      e.hp = 0;
      e.leak = true;
      s.events.push({ k: 'regrow', x: e.x, z: e.z });
    }
  }
};
function campDeath(s, e) {
  if (e.k === 'gol') for (let i = 1; i <= 3; i++) kidOf(s, e, 'ecl', e.max * 0.18, i);
  else if (e.k === 'sem' && !e.re) kidOf(s, e, 'gra', e.max * 0.4, 0, { gt: SEEDT, par: e.max, stun: 1 });
}
function foeFire(s, e) {
  for (const q of s.zones)
    if (q.foe && Math.hypot(q.x - e.x, q.z - e.z) < 1.2) {
      q.t = q.T = FIRET;
      return;
    }
  let n = 0,
    old = -1;
  s.zones.forEach((q, i) => {
    if (q.foe) {
      n++;
      if (old < 0) old = i;
    }
  });
  if (n >= FIREMAX) s.zones.splice(old, 1);
  s.zones.push({ id: s.lid++, x: e.x, z: e.z, y: e.gy || 0, r: FIRER, el: 'feu', t: FIRET, T: FIRET, zap: 0, foe: 1 });
}
function setCamp(s, el, l) {
  s.camp = { el, l };
  s.ck = CAMPK[l - 1] || 1;
  s.maxW = CAMPW;
  s.next = genWave(s, 1);
  return s;
}
// niveau de difficulté de la vague n (compte, vie, blindage, dégâts… tout s'y réfère) et prime en or qui suit ce niveau
const lvl = (s, n) => 1 + (n - 1) * bal(s).lvK,
  wgold = (s, a, b) => Math.round((a + b * lvl(s, s.wave)) * bal(s).wbK);
// trois défenses : zone / grosse cible / tir rapide
const TYPES = {
  mortier: {
    n: 'Mortier',
    s: 'Mortier',
    costs: [50, 80, 120],
    dmg: 10,
    cd: 1.5,
    range: 15,
    rk: 2,
    splash: 3.6,
    fly: 0.7,
    h: 1.75,
    d: 'Dégâts de zone, tir lent.'
  },
  canon: {
    n: 'Canon',
    s: 'Canon',
    costs: [70, 100, 150],
    dmg: 34,
    cd: 1.8,
    range: 12,
    rk: 1.5,
    splash: 0,
    fly: 0.22,
    h: 1.6,
    d: "Gros dégâts sur l'ennemi le plus solide, portée courte."
  },
  archer: {
    n: "Tour d'archer",
    s: 'Archer',
    costs: [45, 70, 100],
    dmg: 3.4,
    cd: 0.45,
    range: 19,
    rk: 2,
    splash: 0,
    fly: 0.3,
    h: 4.9,
    d: 'Tir rapide à longue portée, une cible à la fois.'
  }
};
const TKEYS = ['mortier', 'canon', 'archer'];
const TK = { mortier: 'm', canon: 'c', archer: 'a' };
// bonus des deux grilles (héros + partie), tous à zéro par défaut
const M0 = {
  kDur: 0,
  kWide: 0,
  kLen: 0,
  kTrail: 0,
  kHeal: 0,
  uRad: 0,
  uDur: 0,
  uExtra: 0,
  uCharge: 0,
  pA: 0, // bonus des arbres de héros : compétence (k…), ultime (u…), passif (pA) ; leur sens dépend du héros
  hHp: 0,
  mRad: 0,
  mDmg: 0,
  mCd: 0,
  mRange: 0,
  mMulti: 0,
  cDmg: 0,
  cCd: 0,
  cRange: 0,
  cRico: 0,
  cDouble: 0,
  aDmg: 0,
  aCd: 0,
  aRange: 0,
  aMulti: 0,
  strong: 0,
  spec: 0,
  fxDur: 0,
  coreHp: 0,
  goldKill: 0,
  waveBonus: 0,
  hDmg: 0,
  hCd: 0,
  hLife: 0,
  hPierce: 0,
  hPel: 0,
  hSpread: 0,
  hFlame: 0,
  hCone: 0,
  hBurn: 0,
  hCrit: 0,
  hCritD: 0,
  hMark: 0,
  hSpd: 0,
  hSprint: 0,
  hJump: 0,
  abCd: 0,
  abRad: 0,
  abDmg: 0,
  hBoss: 0,
  hGold: 0,
  eFireR: 0,
  eBurn: 0,
  eSlow: 0,
  eWave: 0,
  ePois: 0,
  ePoisD: 0,
  eKnock: 0,
  eArm: 0,
  eChain: 0,
  eChainD: 0,
  ePierce: 0,
  eLift: 0, // V2.1 : les balles de Vent (ennemis traversés en plus, soulèvement plus long)
  kPush: 0,
  voA: 0,
  voB: 0,
  spA1: 0,
  spA2: 0,
  spB1: 0,
  spB2: 0, // V2.2 : la voie du héros (voA, voB : 1 si elle est choisie) et ses deux cases
  uDmg: 0 // V2.1 : Zéphyr (la Rafale repousse au départ ; Tir perçant plus fort)
}; // arme, arbre du mini-jeu (boss, prime) et arbre d'élément des balles (V9.0) : tout à zéro = les règles d'avant
// une défense porte jusqu'à 3 éléments, chacun jusqu'au niveau 3 (9 améliorations). La portée ne grandit que sur les 3 premières.
const MAXEL = 3,
  MAXLV = 3,
  stackH = L => Math.min(L, 3) * 0.75;
function costOf(type, lv) {
  const c = TYPES[type].costs;
  return lv < 3 ? c[lv] : Math.round((c[2] * (1 + BAL.upG * (lv - 2))) / 5) * 5;
}
function placeCost(s, type) {
  return (
    Math.round(
      (TYPES[type].costs[0] * (1 + bal(s).esc * s.towers.reduce((n, t) => n + (t.tmpT === undefined ? 1 : 0), 0))) / 5
    ) * 5
  );
}
function enemyHp(B, n, k, boss, pl) {
  return (
    (boss ? B.bossHp * (n / 5) : B.hp0 * (1 + B.hpG * (n - 1)) * (KINDS[k] || KINDS.b).hp) *
    (1 + B.multi * ((pl || 1) - 1))
  );
}
function rangeOf(type, lv, m) {
  const T = TYPES[type];
  return T.range + T.rk * Math.min(lv, 3) + (m ? m[TK[type] + 'Range'] : 0);
}
const PATHS = [
  {
    name: 'Nord',
    pts: [
      [0, -112],
      [-22, -84],
      [14, -56],
      [-6, -36],
      [16, -20],
      [0, 0]
    ]
  },
  {
    name: 'Est',
    pts: [
      [106, 38],
      [76, 10],
      [52, 22],
      [40, -6],
      [16, -20],
      [0, 0]
    ]
  },
  {
    name: 'Ouest',
    pts: [
      [-102, 44],
      [-72, 62],
      [-48, 28],
      [-58, 6],
      [-24, 16],
      [0, 0]
    ]
  }
];
for (const p of PATHS) {
  p.seg = [];
  p.len = 0;
  for (let i = 0; i < p.pts.length - 1; i++) {
    const a = p.pts[i],
      b = p.pts[i + 1],
      l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    p.seg.push({ a, b, l, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l, s: p.len });
    p.len += l;
  }
}
