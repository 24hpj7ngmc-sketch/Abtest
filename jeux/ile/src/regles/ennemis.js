// [regles/ennemis.js] Les ennemis : types, boss, composition des vagues, apparition, attaquants spéciaux de la campagne.
// types d'ennemis. hp et vitesse relatifs au basique ; w = place prise dans une vague ; g = or
const KINDS = {
  b: { n: '', r: 'Combattant', hp: 1, sp: 3.6, w: 1, g: 7 },
  tank: { n: 'Tank', r: 'Tank', hp: 4, sp: 2.3, w: 3, g: 16 },
  air: { n: 'Aérien', r: 'Tireur', hp: 0.6, sp: 4.6, w: 1, g: 8 },
  dig: { n: 'Foreur', r: 'Combattant', hp: 1.1, sp: 3.3, w: 1, g: 8 },
  ste: { n: 'Furtif', r: 'Assassin', hp: 0.8, sp: 4.1, w: 1, g: 8 },
  rng: { n: 'Mage', r: 'Mage', hp: 0.9, sp: 3.3, w: 2.5, g: 12 },
  inc: { n: 'Incendiaire', r: 'Mage', hp: 1.5, sp: 3.4, w: 2, g: 12 },
  soi: { n: 'Soigneur', r: 'Support', hp: 1.2, sp: 3.2, w: 2, g: 12 },
  bro: { n: 'Brouilleur', r: 'Support', hp: 1.3, sp: 3, w: 2, g: 12 },
  gol: { n: 'Golem', r: 'Tank', hp: 5, sp: 2.1, w: 4, g: 20 },
  ecl: { n: 'Éclat', r: 'Assassin', hp: 1, sp: 4.2, w: 1, g: 4 },
  sem: { n: 'Semeur', r: 'Combattant', hp: 1.3, sp: 3.3, w: 2, g: 10 },
  gra: { n: 'Graine', r: '', hp: 0.5, sp: 0, w: 1, g: 3 },
  tou: { n: 'Tourbillon', r: 'Support', hp: 1.3, sp: 3.6, w: 2, g: 12 }
}; // attaquants spéciaux de la campagne (un par type, voir CAMPS) : jamais dans les vagues ordinaires (pas de KUNLOCK)
// LES RÔLES (V2.2, `r`) : le comportement. Combattant : marche sur le cœur et frappe au contact. Tank : encaisse, attire les tirs des défenses (elles le visent
// en premier) et casse une défense. Assassin : fonce sur un héros proche (BAL.assR m) pendant BAL.assT s. Tireur et Mage : frappent de loin (le mage bombarde aussi le cœur).
// Support : aide les autres (soigne, brouille, pousse). L'élément de l'ennemi, lui, ne fait que sa faiblesse.
const KK = ['b', 'tank', 'air', 'dig', 'ste', 'rng', 'inc', 'soi', 'bro', 'gol', 'ecl', 'sem', 'gra', 'tou'], // l'ordre compte pour le multi : ajouter à la fin
  KUNLOCK = { tank: 2, air: 3, dig: 4, ste: 6, rng: 7 };
// trois tailles de boss : petit (1), moyen (2) qui invoque des renforts, Big Boss (3) qui change d'élément et paralyse les défenses
const BN = ['', 'Boss', 'Boss moyen', 'Big Boss'],
  BSP = [0, 2.2, 2, 1.6],
  BLEAK = [0, 10, 15, 999];
const bossTier = (s, n) => (s.maxW < 20 ? 1 : n >= s.maxW ? 3 : n >= s.maxW - 10 ? 2 : 1);
const cyOf = e => (e.boss ? [0, 2.4, 3.4, 5][e.bt || 1] : e.k === 'air' ? 8.1 : 1.1) + (e.gy || 0),
  rOf = e => (e.boss ? [0, 2.8, 3.8, 5.5][e.bt || 1] : 1.3);
// VENT (V2.1) : une balle ou une défense de Vent soulève les petits ennemis (ni boss, ni tank, ni golem, ni aérien) : ils restent en l'air, immobiles, e.lift secondes,
// puis ne peuvent plus être soulevés ni étourdis pendant une seconde (e.imm), pour qu'une rafale de balles ne les bloque pas pour toujours.
const liftable = e => !e.boss && e.k !== 'air' && e.k !== 'tank' && e.k !== 'gol' && !e.bur && !(e.imm > 0) && !e.sea;
function lift(e, t) {
  e.stun = Math.max(e.stun || 0, t);
  e.lift = Math.max(e.lift || 0, t);
  e.imm = e.stun + 1;
}
// qui peut viser quoi : le mortier ne touche pas le ciel, seul le mortier atteint un foreur enterré, un furtif n'est vu que de près ou révélé
function sees(type, e, d2) {
  if (e.k === 'air' && type === 'mortier') return false;
  if (e.bur && type !== 'mortier') return false;
  if (e.k === 'ste' && !(e.rev > 0) && d2 > 49) return false;
  return true;
}
// LES BONUS À RAMASSER (les « power-ups » d'un mode zombie) : un ennemi abattu sur l'île laisse parfois tomber un bonus, un boss toujours.
// Le premier héros qui marche dessus le déclenche pour toute l'équipe. t = durée de l'effet en secondes (0 : effet immédiat).
const PUPS = {
  or: { n: 'Or double', d: "l'or des ennemis compte double", t: 30, w: 3, i: '×2', c: '#ffcf5a' },
  fatal: { n: 'Coup fatal', d: "tes tirs et tes pouvoirs abattent d'un coup", t: 15, w: 3, i: '☠', c: '#ff7a6b' },
  fren: { n: 'Frénésie', d: 'les défenses tirent deux fois plus vite', t: 20, w: 3, i: '»', c: '#7ff3ff' },
  bombe: { n: 'Bombe', d: 'tous les ennemis présents sont balayés', t: 0, w: 2, i: '✹', c: '#ff9d3c' },
  plein: { n: 'Plein pouvoir', d: 'vie, compétence et ultime rechargés', t: 0, w: 2, i: '✚', c: '#7ddc8a' },
  charp: {
    n: 'Charpentier',
    d: 'le cœur est réparé, les défenses en panne repartent',
    t: 0,
    w: 1.5,
    i: '⚒',
    c: '#c9a877'
  }
};
const PUPK = Object.keys(PUPS),
  PUPT = PUPK.filter(k => PUPS[k].t > 0);
let FATAL = false; // FATAL : « Coup fatal » en cours, lu par hurtE et remis à jour à chaque pas
function pupDrop(s, e) {
  if (s.client || e.sea || e.nd) return;
  const i = cellOf(e.x, e.z),
    r = Math.hypot(e.x, e.z);
  if (!WALK[i] || s.pit[i] || s.wallSet[i] || s.tmpSet[i] || r > R_ISLE - 8 || r < 7) return;
  if (!e.boss) {
    if (s.pupN >= BAL.pupMax || s.rng() >= BAL.pupP) return;
    s.pupN++;
  }
  const ok = PUPK.filter(k => k !== s.pupLast && (k !== 'charp' || s.core < s.coreMax));
  let tot = 0;
  for (const k of ok) tot += PUPS[k].w;
  let v = s.rng() * tot,
    k = ok[0];
  for (const q of ok) {
    v -= PUPS[q].w;
    if (v <= 0) {
      k = q;
      break;
    }
  }
  s.pupLast = k;
  s.pups.push({ id: s.nid++, k, x: e.x, z: e.z, t: BAL.pupLife });
  s.events.push({ k: 'pupdrop', x: e.x, z: e.z, t: k });
}
function pupTake(s, p, h) {
  const P = PUPS[p.k],
    hs = [s.hero];
  for (const k in s.others) hs.push(s.others[k]);
  s.pupGot = (s.pupGot || 0) + 1;
  if (P.t) s.buff[p.k] = P.t;
  else if (p.k === 'bombe') {
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      e.lastH = true;
      e.nd = 1;
      if (e.boss) e.hp = Math.max(1, e.hp - e.max * BAL.pupBoss);
      else e.hp = 0;
    }
  } else if (p.k === 'plein') {
    for (const o of hs) {
      if (o.down > 0) {
        o.down = 0;
        o.rev = 0;
      }
      o.hp = o.maxHp;
      o.ab = 0;
      o.ult = 100;
    }
  } else if (p.k === 'charp') {
    s.core = Math.min(s.coreMax, s.core + BAL.pupCore);
    for (const t of s.towers) t.off = 0;
  }
  s.events.push({ k: 'pup', t: p.k, x: p.x, z: p.z, me: h === s.hero, who: h.bot ? EL[h.el].hero : '' });
}
function pupStep(s, dt) {
  for (const k of PUPT) if (s.buff[k] > 0) s.buff[k] = Math.max(0, s.buff[k] - dt);
  FATAL = s.buff.fatal > 0;
  if (s.client) return;
  const hs = [s.hero];
  for (const k in s.others) hs.push(s.others[k]);
  for (const p of s.pups) {
    p.t -= dt;
    if (p.t <= 0) continue;
    for (const h of hs)
      if (!(h.down > 0) && Math.hypot(h.x - p.x, h.z - p.z) < BAL.pupR && (h.y || 0) < 4) {
        pupTake(s, p, h);
        p.t = 0;
        break;
      }
  }
  s.pups = s.pups.filter(p => p.t > 0);
  FATAL = s.buff.fatal > 0;
}
function hurtE(e, d, pierce, hero) {
  if (hero && FATAL) {
    if (e.boss) d *= 3;
    else {
      d = e.hp + 1;
      pierce = true;
    }
  }
  if (!hero && e.mark > 0) d *= 1 + BAL.markK + (e.mk || 0);
  if (e.arm && !pierce) d = Math.max(d * 0.25, d - e.arm);
  e.hp -= d;
  e.lastH = !!hero;
  if (e.k === 'ste') e.rev = 2.5;
}
// LA COMPOSITION D'UNE VAGUE (V2.0) : des groupes { el, k, count } sans chemin (path: -1, « de partout »). Un à quatre éléments mélangés :
// un dominant (45 à 60 %) et les autres à parts égales. L'arc de côte d'où ils viendront est tiré en même temps (s.varc), pour que l'aperçu puisse l'annoncer.
function genWave(s, n) {
  const r = s.rng,
    groups = [],
    B = bal(s),
    L = lvl(s, n),
    L0 = n > 1 ? lvl(s, n - 1) : 0,
    total = Math.round(B.cnt0 + B.cntG * L);
  const pool = KK.filter(k => k !== 'b' && L >= KUNLOCK[k]);
  let fresh = pool.find(k => KUNLOCK[k] > L0);
  const kind = () => {
    if (fresh) {
      const k = fresh;
      fresh = null;
      return k;
    }
    return pool.length && r() < 0.45 ? pool[Math.floor(r() * pool.length)] : 'b';
  };
  const add = (el, c) => {
    if (c <= 0) return;
    const k = kind();
    groups.push({ path: -1, el, k, count: Math.max(1, Math.round(c / KINDS[k].w)) });
  };
  const ne = n === 1 ? 1 + (r() < 0.5 ? 1 : 0) : n === 2 ? 2 : 2 + Math.floor(r() * 3),
    els = [];
  els.push(s.camp && r() < 0.85 ? s.camp.el : ELS[Math.floor(r() * ELS.length)]);
  while (els.length < ne) {
    const e = ELS[Math.floor(r() * ELS.length)];
    if (!els.includes(e)) els.push(e);
  }
  const c1 = ne > 1 ? Math.round(total * (s.camp ? 0.65 + r() * 0.12 : 0.45 + r() * 0.15)) : total, // en campagne, le type du niveau domine (environ deux ennemis sur trois)
    cr = ne > 1 ? (total - c1) / (ne - 1) : 0;
  els.forEach((el, i) => {
    const c = i ? Math.round(cr) : c1;
    if (c >= 8 && r() < 0.5) {
      const h = Math.round(c * (0.35 + r() * 0.3));
      add(el, h);
      add(el, c - h);
    } else add(el, c);
  });
  if (n >= 3) groups[Math.floor(r() * groups.length)].hidden = true;
  if (n % 5 === 0)
    groups.push({
      path: -1,
      el: s.camp ? s.camp.el : ELS[Math.floor(r() * ELS.length)],
      k: 'b',
      count: 1,
      boss: true,
      bt: bossTier(s, n)
    });
  if (s.camp && CAMPS[s.camp.el] && n >= 2)
    groups.push({
      path: -1,
      el: s.camp.el,
      k: CAMPS[s.camp.el],
      count: Math.max(1, Math.round(Math.min(8, 1 + Math.floor(n / 3)) * (CAMPC[CAMPS[s.camp.el]] || 1)))
    }); // campagne : l'attaquant spécial du type
  s.varc = [r() * 6.2832 - 3.1416, n <= VAGUES.arc.length ? VAGUES.arc[n - 1] : 6.2832]; // d'où ils viendront : centre et largeur de l'arc de côte
  return groups;
}
function newSim(heroEl, rng, mods, mode) {
  const m = Object.assign({}, M0, mods),
    s = {
      m,
      mode: mode === 'normal' ? 'normal' : 'hard',
      pot: mode === 'normal' ? BALN.pot0 : 0,
      aiT: 1.5,
      autoNew: true,
      walls: [],
      wallSet: Uint8Array.from(HILL),
      pits: [],
      pit: new Uint8Array(GN * GN),
      field: FIELD0,
      fv: 0,
      maxW: (mode === 'normal' ? BALN : BAL).waves,
      pts: 2,
      kills: 0,
      bossKills: 0,
      t: 0,
      gold: (mode === 'normal' ? BALN : BAL).gold0,
      core: (mode === 'normal' ? BALN : BAL).core + m.coreHp,
      wave: 0,
      phase: 'prep',
      over: null,
      rng: rng || Math.random,
      nid: 1,
      enemies: [],
      shots: [],
      bombs: [],
      queue: [],
      events: [],
      towers: [],
      hero: {
        x: 4,
        z: 12,
        y: 0,
        vy: 0,
        eye: 1.7,
        yaw: 0,
        pitch: 0,
        el: heroEl,
        cd: 0,
        ab: 0,
        sprint: false,
        m,
        hp: heroHpOf(heroEl, m),
        maxHp: heroHpOf(heroEl, m),
        down: 0,
        hurtT: 9,
        rev: 0,
        ult: 0,
        inv: 0
      },
      others: {},
      wpay: {}, // chez l'hôte : les niveaux d'armes payés par chaque invité, { id: { arme: { amélioration: niveau } } } (audit V2.0, problème 3)
      client: false,
      lid: 1,
      zones: [],
      players: 1,
      pups: [],
      pupN: 0,
      pupLast: '',
      buff: { or: 0, fatal: 0, fren: 0 },
      obj: null,
      pend: [],
      tmp: [],
      tmpSet: new Uint8Array(GN * GN),
      storms: [],
      rain: [],
      flood: 0
    };
  s.coreMax = s.core;
  s.next = genWave(s, 1);
  return s;
}
// LES CANONS : pendant la vague, chaque navire qui croise tire de temps en temps sur la défense la plus proche à portée et la met en panne quelques secondes.
// (Le navire surprise et sa meute ont disparu en V2.0 : plus personne ne débarque d'un navire.)
function cannons(s, dt) {
  if (s.phase !== 'wave' || lvl(s, s.wave) < BAL.canW || !s.can) return;
  if (!s.queue.length && !s.enemies.some(e => e.sea)) return;
  BOATS.forEach((B, pi) => {
    s.can[pi] -= dt;
    if (s.can[pi] > 0) return;
    const P = boatAt(pi, s.t);
    let bt = null,
      bd = VAGUES.canR;
    for (const t of s.towers) {
      const d = Math.hypot(t.x - P[0], t.z - P[1]);
      if (d < bd && !(t.off > 0)) {
        bd = d;
        bt = t;
      }
    }
    if (!bt) {
      s.can[pi] = 2;
      return;
    }
    s.can[pi] = BAL.canCd * (0.8 + s.rng() * 0.4);
    bt.off = BAL.canT;
    s.events.push({ k: 'cannon', bx: P[0], bz: P[1], x: bt.x, z: bt.z, y: bt.wy || 0 });
  });
}
// LE DÉPART D'UNE VAGUE (V2.0) : tous les ennemis dans une seule file d'attente, mélangés (plus de meutes, plus d'un élément par côté),
// qui sortent un par un à un rythme régulier mais pas mécanique, chacun en un point de la côte : les angles suivent le nombre d'or (deux sorties de suite
// tombent loin l'une de l'autre et la côte se remplit sans trou), sur l'arc annoncé par l'aperçu. Une corne au départ, une autre pour chaque boss.
function startWave(s) {
  if (s.phase !== 'prep' || s.over) return false;
  s.wave++;
  s.phase = 'wave';
  s.horns = [];
  s.pupN = 0;
  const B = bal(s),
    n = s.wave,
    gap = Math.max(0.4, B.gap - B.gapG * lvl(s, n)) * VAGUES.flow, // une seule file pour toute l'île : la vague s'étale (avant, trois chemins lâchaient chacun ses meutes)
    A = s.varc || [s.rng() * 6.2832, 6.2832],
    u0 = s.rng(),
    list = [],
    boss = [];
  for (const g of s.next || []) {
    if (g.boss) boss.push({ t: 0, el: g.el, boss: true, bt: g.bt || 1, k: 'b' });
    else for (let i = 0; i < g.count; i++) list.push({ t: 0, el: g.el, boss: false, k: g.k || 'b' });
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(s.rng() * (i + 1)),
      x = list[i];
    list[i] = list[j];
    list[j] = x;
  }
  const angle = i => {
    const f = (u0 + i * 0.6180339887) % 1;
    return A[0] + (A[1] >= 6.28 ? f * 6.2832 : (f - 0.5) * A[1]) + (s.rng() - 0.5) * 0.12;
  };
  let t = s.t + 1.5;
  list.forEach((q, i) => {
    q.t = t;
    q.a = angle(i);
    q.path = sectOf(q.a);
    s.queue.push(q);
    t += gap * (1 + (s.rng() - 0.5) * VAGUES.jit);
  });
  boss.forEach((q, i) => {
    q.t = s.t + 6 + i * 4;
    q.a = angle(list.length + i);
    q.path = sectOf(q.a);
    s.queue.push(q);
    s.horns.push({ t: q.t - 1.2, x: Math.cos(q.a) * R_ISLE, z: Math.sin(q.a) * R_ISLE });
  });
  s.horns.push({ t: s.t + 0.3, x: Math.cos(A[0]) * R_ISLE, z: Math.sin(A[0]) * R_ISLE });
  s.horns.sort((a, b) => a.t - b.t);
  s.can = BOATS.map((_, i) => 4 + i * 2);
  s.queue.sort((a, b) => a.t - b.t);
  s.next = null;
  if (s.wave >= 2 && !s.client && s.rng() < BAL.objP) newObj(s);
  return true;
}
