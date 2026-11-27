// ===================== UNE PARTIE : l'état S, les journées, la grille de voisinage =====================
// newRun crée l'état d'une partie (S) ; startDay lance une journée. Les zombies sont rangés en colonnes (S.z = Z : un tableau par champ,
// MAXZ places) ; S.act liste les places occupées, S.free les places libres.
// La grille de voisinage (cases de 3 m, refaite à chaque pas) sert aux explosions, aux flammes, aux mortiers et aux héros.
// Fournit aux autres dossiers : newRun, startDay, MAXZ, J1 (interface, affichage) ; gridBuild (tests).

// ---------------------------------------------------------------- une partie
// au plus 2600 zombies à la fois (places dans les colonnes de Z)
const MAXZ = 2600;
// les colonnes des zombies : Z.x[i], Z.hp[i]… pour le zombie de la place i
function mkZ() {
  const F = () => new Float32Array(MAXZ),
    U = () => new Uint8Array(MAXZ);
  return {
    // position (pieds) ; vie, vie au départ ; vitesse dehors (m/s)
    x: F(),
    y: F(),
    z: F(),
    hp: F(),
    hm: F(),
    sp: F(),
    // dehors : décalage en travers de sa route ; ph : phase d'animation (affichage)
    off: F(),
    ph: F(),
    // « Ils arrivent » : pied de la façade visée (aimFacade)
    tx: F(),
    tz: F(),
    // point de passage : coin de l'immeuble, sortie du hall (mode fuite), ou décalage autour du leurre
    cx: F(),
    cz: F(),
    // selon l'état : position le long de la façade (st 2) ; distance le long de l'escalier (st 7) ;
    // envahisseur (st 3) : temps qui lui reste dans sa pièce (−1 : pièce à choisir)
    u: F(),
    // écart à la façade en grimpant (st 2) ; burn : brûlure restante (s) ; yaw : orientation ; slow : ralenti restant (s)
    dw: F(),
    burn: F(),
    yaw: F(),
    slow: F(),
    // arrachage de planches en cours (affichage : 0 sinon) ; psn : poison restant (s) ; root : entrave restante (s, immobile dehors)
    tr: F(),
    psn: F(),
    root: F(),
    // hâte restante (s, cri du hurleur : +50 %) ; hcd : recharge du cri (hurleur) ou du coup de cloison (casseur)
    hst: F(),
    hcd: F(),
    // état (voir LISEZMOI.md) : 0 libre, 1 dehors, 2 grimpe une façade, 3 dans l'immeuble, 5 grimpe un mur d'avenue, 7 dans l'escalier ;
    // ty : type (ZT) ; va : tenue (0 / 1, affichage)
    st: U(),
    ty: U(),
    va: U(),
    // route (dehors) ; envahisseur : pièce visée (numéro dans ROOMS) ; wp : étape du trajet dehors (voir inWalk, outWalk)
    road: U(),
    wp: U(),
    // façade (grimpe ; sortie en mode fuite) ; dans l'escalier : sens (0 monte, 1 descend) ; dec : attiré par le leurre
    f: U(),
    dec: U(),
    // niveau (st 3) ; dans l'escalier : la volée du niveau lv à lv + 1 ; inv : envahisseur, étage visé (0 : pas un envahisseur)
    lv: U(),
    inv: U(),
    // génération de la place (+1 à chaque apparition : une tourelle reconnaît sa cible, l'hôte reconnaît le zombie touché par un invité)
    gen: new Uint16Array(MAXZ),
    // V4.3, le multi (multi.js), chez l'invité seulement : place donnée par l'hôte (le zombie y glisse) ; kt : éteint ici jusqu'à ce moment
    // (tué par l'invité, l'hôte ne le sait pas encore) ; fant : fantôme (foule lointaine : dessiné, jamais touché)
    mx: F(),
    my: F(),
    mz: F(),
    kt: F(),
    fant: U()
  };
}
// st : 0 libre · 1 marche dehors · 2 grimpe la façade · 3 dans l'immeuble, au niveau lv (toit = NLV) · 5 grimpe un mur d'avenue · 7 dans l'escalier
// une nouvelle partie : save (la sauvegarde : mode, héros, arme, arbre, plan des tourelles…), jour de départ, graine du hasard
// (au hasard si absente). L'immeuble est remis à neuf (resetBuilding) : il n'y a qu'une partie à la fois.
function newRun(save, startDay, seed) {
  const P = derive(save.lv || {});
  const S = {
    // S.P : tout ce que l'arbre change (derive) ; day : jour ; phase : 'prep' (avant le jour), 'day', 'clear' (jour tenu), 'rescue' (hélico),
    // 'won', 'dead' ; t : temps de jeu (s) ; rnd : le hasard de la partie
    P,
    day: startDay || 1,
    phase: 'prep',
    t: 0,
    rnd: mkRng(seed || (Math.random() * 1e9) | 0),
    // les zombies (Z) : act[0…nAct−1] = places occupées, free = places libres ; cap : foule simultanée maximale (l'interface l'ajuste)
    z: mkZ(),
    act: new Int32Array(MAXZ),
    nAct: 0,
    free: [],
    cap: 1600,
    // la journée : reste à faire sortir, déjà sortis, total du jour, accumulateur de sortie, moments des mastodontes ; left : restants du jour
    toSpawn: 0,
    spawned: 0,
    dayTotal: 0,
    spAcc: 0,
    bossAt: [],
    left: 0,
    // zombies tués dans la partie (kills et runKills comptent pareil : runKills pour l'interface, kills pour les tests) ; runCash : argent gagné
    kills: 0,
    runKills: 0,
    runCash: 0,
    // les événements du pas (voir LISEZMOI.md), lus et vidés par l'interface
    ev: [],
    // cadavres ; obus de mortier, missiles, bombes ; feux au sol (napalm, Brasier)
    corpses: [],
    shells: [],
    missiles: [],
    bombs: [],
    fires: [],
    // ce qui dure pour les héros (heroStep) ; flood : temps de Déluge restant ; hab : recharge de la compétence du héros
    fballs: [],
    thorns: [],
    ramparts: [],
    meteors: [],
    guards: [],
    storms: [],
    flood: 0,
    hab: 0,
    // héros (mode fuite seulement) ; decoy : le leurre posé ; ult : charge de l'ultime (0 à 1) ; recharges du missile, du leurre, de la frappe
    hero: save.mode === 'out' ? (HEROS[save.hero] ? save.hero : 'feu') : null,
    decoy: null,
    ult: 0,
    misCd: 0,
    leuCd: 0,
    airCd: 0,
    // les tourelles posées (buildTurrets) ; save : la sauvegarde (argent, arbre, plan des tourelles…), modifiée en direct
    tur: [],
    save,
    // compte à rebours de « jour tenu », temps depuis l'appel de l'hélico ; endless : partie sans fin (jour 11 et plus)
    clearT: 0,
    heliT: 0,
    endless: !!save.endlessRun,
    // 'in' = « Ils arrivent », 'out' = « Ils s'échappent » ; escaped, dayEsc : fuyards (partie, jour) ; city : vie de la ville ;
    // why : cause de la défaite ('ville' ou 'joueur') ; invN : envahisseurs apparus ; weap : arme choisie
    mode: save.mode === 'out' ? 'out' : 'in',
    escaped: 0,
    dayEsc: 0,
    city: P.hp,
    why: '',
    // V4.2 : le héros et ses balles venus du lobby (heroMods, 0 hors lobby) ; rangK : vie des zombies (rang du lobby, 1 hors lobby) ;
    // boss : mastodontes abattus ; chutes : fois où le joueur est tombé (il se relève : RELEVE)
    hm: heroMods(),
    rangK: rangK(),
    boss: 0,
    chutes: 0,
    // temps passé en journée (s) : le temps de jeu que le lobby paie (pas l'attente entre deux jours)
    jeuT: 0,
    // V4.3, le multi (multi.js) : nJoueurs : joueurs sur le toit (posé par l'interface chez l'hôte : +50 % de horde par joueur en plus) ;
    // invite : cet état est le miroir d'un invité (stepInvite au lieu de step) ; mActions, mSeq : ses actions pour l'hôte et leur numéro
    nJoueurs: 1,
    invite: false,
    mActions: [],
    mSeq: 0,
    invN: 0,
    weap: WEAP[save.weap] ? save.weap : 'fusil',
    // V4.8 : l'élément de l'arme (ses balles) : celui du lobby, sinon celui choisi au menu (save.elArme), sinon celui du héros
    elArme:
      save.mode !== 'out'
        ? null
        : ELKEYS.includes(elementArmeLobby)
          ? elementArmeLobby
          : ELKEYS.includes(save.elArme)
            ? save.elArme
            : HEROS[save.hero]
              ? save.hero
              : 'feu',
    // V4.9 : la voie du héros (lobby) ; teintT : quand l'ultime teinté pourra de nouveau marquer chaque zombie (voies.js) ; ultEl : l'élément
    // qui teinte ce qui frappe en ce moment
    voie: save.mode === 'out' && HEROS[save.hero] && (voieLobby === 'a' || voieLobby === 'b') ? voieLobby : null,
    teintT: new Float32Array(MAXZ),
    ultEl: null,
    // où est le joueur : niveau, balcon (façade, −1 sinon), volée d'escalier (−1 sinon) et position le long de celle-ci
    plv: NLV,
    pbal: -1,
    pst: -1,
    pss: 0,
    // champ de marche vers le joueur à son niveau (recalculé toutes les 0,25 s par step)
    pf: new Float32Array(NCC),
    pfT: 0,
    // masse : temps restant du coup, durée du coup, coup déjà porté ; plankT : planche en cours de pose
    swing: 0,
    swingT: 0,
    swingHit: 1,
    plankT: 0,
    // compteurs de changements (cloisons, planches) : l'affichage ne redessine que si ça a bougé
    wallVer: 0,
    plankVer: 0,
    // le joueur (p) : départ sur le toit, au nord du cabanon, face au nord
    p: {
      x: 0,
      y: H,
      z: -7,
      // vitesses ; surge : coup d'accélération au départ du sprint (0,4 s) ; spr : en sprint
      vy: 0,
      vx: 0,
      vz: 0,
      surge: 0,
      spr: false,
      // regard (yaw : 0 = vers le nord, −Z ; pitch > 0 vers le haut) ; vie ; inv : invincible encore inv secondes (Éclair de Volt)
      yaw: 0,
      pitch: -0.12,
      hp: P.hp,
      hpMax: P.hp,
      inv: 0,
      // escalier qui porte : gl = sens (1 monte, −1 descend, 0 libre), glF : passé devant la cage (pour continuer à l'étage suivant) ;
      // clb : escalade ou échelle en cours ; zip : tyrolienne en cours
      gl: 0,
      glF: false,
      clb: null,
      zip: null,
      crouch: false,
      ground: true,
      // temps depuis le dernier coup reçu (soin) ; fireT : temps avant le prochain tir possible
      hurtT: 9,
      fireT: 0,
      dead: false,
      // V4.2 : tombé, se relève sur le toit dans down secondes (mode fuite)
      down: 0
    },
    // grille de voisinage (gridBuild) ; nombre de grimpeurs par tranche de façade et par tranche de mur d'avenue (zombiesStep)
    grid: { start: new Int32Array(GN * GN + 1), items: new Int32Array(MAXZ), cell: new Int32Array(MAXZ) },
    faceBin: new Float32Array(4 * NFB),
    wallBin: new Float32Array(40)
  };
  for (let i = MAXZ - 1; i >= 0; i--) S.free.push(i);
  resetBuilding();
  // les boutiques et les passerelles n'existent qu'en mode fuite ; les rideaux de fer n'y arrêtent plus le joueur
  for (const o of BOX) {
    if (o.t === 'shop' || o.t === 'pass') o.dead = S.mode === 'out' ? 0 : 1;
    if (o.vol) o.dead = S.mode === 'out' ? 1 : 0;
  }
  for (const f of FLOORS) if (f.pass !== undefined) f.off = S.mode !== 'out';
  S.p.hp = S.p.hpMax = heroHp(S);
  buildTurrets(S);
  return S;
}

// ---------------------------------------------------------------- les journées
// V3.3 : jour 1 sans tourelle (mode fuite) : moins de zombies, qui sortent plus lentement, pour qu'on puisse le tenir seul au fusil et au héros
const J1 = { n: 70, dur: 70 };
// taille de la horde du jour, et durée de sa sortie (s)
const dayN = S => (turOff(S) ? J1.n : dayCount(S.day)),
  dayDur = S => (turOff(S) ? J1.dur : spawnDur(S.day));
// lance la journée S.day (bouton « Lancer le jour ») : compteurs, moments des mastodontes, routes qui s'ouvrent (événements road, dawn)
function startDay(S) {
  const d = S.day;
  let N = dayN(S);
  // V4.3 : à plusieurs, la horde grossit de 50 % par joueur en plus (la cadence suit : même durée de sortie)
  if (S.nJoueurs > 1) N = Math.round(N * hordeK(S));
  S.phase = 'day';
  for (const D of DOORS) {
    D.torn = 0;
    D.pd = 0;
  }
  S.dayEsc = 0;
  S.toSpawn = N;
  S.dayTotal = N;
  S.spawned = 0;
  S.spAcc = 0;
  S.left = N;
  S.dayT = 0;
  const nb = S.endless ? Math.max(1, Math.floor(d / 3)) : bossN(d);
  S.bossAt = [];
  for (let k = 0; k < nb; k++) S.bossAt.push(Math.floor(N * (0.55 + (0.4 * k) / Math.max(1, nb))));
  for (let r = 0; r < ROADS.length; r++) if (ROADS[r].day === d) S.ev.push({ k: 'road', r });
  S.ev.push({ k: 'dawn', d });
}

// ---------------------------------------------------------------- la grille de voisinage (explosions, flammes, mortiers, héros)
// cases de GC = 3 m, GN × GN cases centrées sur l'immeuble (210 m de côté) ; S.grid : start[c]…start[c+1] = les zombies de la case c dans items
const GC = 3,
  GN = 70,
  GO = (GN * GC) / 2;
// la case de voisinage d'un point (−1 hors de la grille)
const cellOf = (x, z) => {
  const cx = Math.floor((x + GO) / GC),
    cz = Math.floor((z + GO) / GC);
  return cx < 0 || cz < 0 || cx >= GN || cz >= GN ? -1 : cz * GN + cx;
};
// range les zombies actifs par case (tri par comptage) ; refait à chaque pas, après le pas des zombies
function gridBuild(S) {
  const G = S.grid,
    Z = S.z,
    st = G.start;
  st.fill(0);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      c = cellOf(Z.x[i], Z.z[i]);
    G.cell[i] = c;
    if (c >= 0) st[c + 1]++;
  }
  for (let c = 0; c < GN * GN; c++) st[c + 1] += st[c];
  const fill = new Int32Array(GN * GN);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      c = G.cell[i];
    if (c < 0) continue;
    G.items[st[c] + fill[c]++] = i;
  }
}
// appelle fn(i) pour chaque zombie des cases qui couvrent le carré (x ± r, z ± r) : à chacun de vérifier la vraie distance
function gridEach(S, x, z, r, fn) {
  const G = S.grid,
    x0 = Math.max(0, Math.floor((x - r + GO) / GC)),
    x1 = Math.min(GN - 1, Math.floor((x + r + GO) / GC)),
    z0 = Math.max(0, Math.floor((z - r + GO) / GC)),
    z1 = Math.min(GN - 1, Math.floor((z + r + GO) / GC));
  for (let cz = z0; cz <= z1; cz++)
    for (let cx = x0; cx <= x1; cx++) {
      const c = cz * GN + cx;
      for (let k = G.start[c]; k < G.start[c + 1]; k++) fn(G.items[k]);
    }
}
// combien de zombies dans la case du zombie i (le mortier vise le plus gros paquet)
const cellCount = (S, i) => {
  const c = S.grid.cell[i];
  return c < 0 ? 0 : S.grid.start[c + 1] - S.grid.start[c];
};

// la fin d'une journée : toute la horde est sortie, plus aucun zombie actif ni obus en vol → prime et « jour tenu » (phase 'clear', 3,2 s) ;
// puis le jour suivant (phase 'prep' : tourelles reposées, vie et ville remises à neuf), ou l'hélicoptère au jour 10 ('rescue') ;
// la partie est gagnée quand le joueur rejoint l'hélicoptère, posé 9 s après l'appel.
function dayEndStep(S, dt) {
  const P = S.P;
  if (S.phase === 'day' && S.toSpawn <= 0 && S.nAct === 0 && !S.shells.length) {
    const bonus = Math.round(15 * S.day * P.dayB);
    S.save.cash += bonus;
    S.runCash += bonus;
    S.phase = 'clear';
    S.clearT = 3.2;
    if (S.mode === 'out') S.save.bestF = Math.max(S.save.bestF || 0, S.day);
    else S.save.best = Math.max(S.save.best || 0, S.day);
    S.ev.push({ k: 'clear', d: S.day, bonus });
  } else if (S.phase === 'clear') {
    S.clearT -= dt;
    S.dayEsc = 0;
    if (S.clearT <= 0) {
      if (S.day === 10 && !S.endless) {
        S.phase = 'rescue';
        S.heliT = 0;
        S.ev.push({ k: 'heli' });
      } else {
        S.day++;
        S.phase = 'prep';
        if (S.mode === 'out') buildTurrets(S);
        S.p.hpMax = heroHp(S);
        S.p.hp = S.p.hpMax;
        S.city = P.hp;
        S.ev.push({ k: 'prep', d: S.day });
      }
    }
  } else if (S.phase === 'rescue') {
    S.heliT += dt;
    if (S.heliT > 9 && Math.hypot(S.p.x - HELI[0], S.p.z - HELI[1]) < 3.6) {
      S.phase = 'won';
      S.save.won = (S.save.won || 0) + 1;
      S.ev.push({ k: 'won' });
    }
  }
}
