// [regles/bots-chantier.js] Les bots joueurs (mode dev, esclaves) — ce qu'ils bâtissent : avant-poste, couloirs, choix du prochain chantier.
// ---- BOTS JOUEURS (mode dev). Un bot est un vrai héros de plus dans s.others (clé « bot0 », « bot1 »…) : il se déplace, tire, utilise sa compétence et son ultime,
// relève les coéquipiers, s'occupe des objectifs et pose / améliore des défenses avec l'or commun. Les ennemis s'en prennent à lui comme au joueur.
// Tout se décide ici (botThink) puis passe par heroStep, comme pour un joueur : un bot n'a aucun passe-droit.
function botMake(s, i, el, mods) {
  const m = Object.assign({}, M0, mods || {}),
    a = i * 2.2 + 0.8,
    hp = heroHpOf(el, m);
  return {
    id: 'bot' + i + el,
    bot: { i, key: 'bot' + i, t: 0, tg: null, job: null, px: 0, pz: 0, st: 0, side: i % 2 ? 1 : -1, av: 0 },
    x: Math.cos(a) * 9,
    z: Math.sin(a) * 9,
    y: 0,
    vy: 0,
    eye: 1.7,
    yaw: a,
    pitch: 0,
    el,
    cd: 0,
    ab: 0,
    sprint: false,
    m,
    hp,
    maxHp: hp,
    down: 0,
    hurtT: 9,
    rev: 0,
    ult: 0,
    inv: 0,
    inp: { f: 0, r: 0, fire: false, sprint: false, sneak: false, jump: false }
  };
}
// LES ESCLAVES (V9.7, demande de Frédéric) : des bots achetés en partie au marchand d'esclaves, payés en or. Ce sont des bots comme les autres (même intelligence), marqués `hired`.
// Différences : ils ne comptent pas comme des joueurs (les ennemis ne gagnent pas de vie), et un esclave à terre est perdu (pas de relève : on en rachète un). Plus tard : une amélioration pour les relever.
const HIREC = 250,
  HIREK = 150,
  HIREMAX = 4;
function hire(s, el, mods, x, z) {
  const L = hiredOf(s),
    c = hireCost(s);
  if (s.client || L.length >= HIREMAX || s.gold < c || !ELS.includes(el) || L.some(o => o.el === el)) return null;
  let j = 10;
  while (s.others['bot' + j]) j++;
  const o = botMake(s, j, el, mods);
  o.hired = 1;
  o.x = x;
  o.z = z;
  s.others['bot' + j] = o;
  s.gold -= c;
  s.events.push({ k: 'hire', el });
  return o;
}
const hiredOf = s => botList(s).filter(o => o.hired),
  hireCost = s => HIREC + HIREK * hiredOf(s).length;
const botList = s => {
    const L = [];
    for (const k in s.others) if (s.others[k].bot) L.push(s.others[k]);
    return L;
  },
  botHeroes = s => [s.hero].concat(botList(s));
// le héros qu'un ennemi peut frapper : le plus proche encore debout, joueur ou bot
function heroNear(s, e, hs) {
  let b = null,
    bd = 1e9;
  for (const h of hs || botHeroes(s)) {
    if (h.down > 0) continue;
    const d = Math.hypot(e.x - h.x, e.z - h.z);
    if (d < bd) {
      bd = d;
      b = h;
    }
  }
  return b;
}
// CE QU'UN BOT MONTRE (il sert de modèle aux nouveaux joueurs) : chacun garde un chemin. Il y bâtit sa « zone de tir » dans l'ordre d'un bon joueur :
//   deux défenses contre l'élément annoncé · un mur de chaque côté du chemin pour rabattre ceux qui coupent à travers champs · une fosse devant les défenses pour les ralentir sous les tirs
//   · améliorations (même élément jusqu'à 3) et nouvelles défenses, dont une tour posée sur le mur (elle voit plus loin) · puis il aide les chemins sans gardien et ceinture le cœur.
// Pendant la vague il se tient dans sa zone et tire pour MARQUER les ennemis (les défenses leur font plus mal), en changeant de cible dès qu'elle est marquée.
const BOTCFG = {
  wall: 'chic',
  dig: true,
  wallW: 2,
  adv: 90,
  out: true,
  outW: 6,
  outCap: 2,
  outBase: 2,
  outPost: true,
  outMark: true,
  outShare: 0.2,
  outN: 0
}; // réglages des bots : type de mur près du cœur (none, funnel, chic), fosse, vague à partir de laquelle ils terrassent, avance maximale devant leur zone ;
// avant-poste : oui/non, vague de départ (+3 en mode difficile), défenses au sol au plus, défenses de base, le bot s'y poste, il y marque, part de l'or du chemin, nombre d'avant-postes (0 = un par bot)
function botLaneInfo(s, L) {
  s.bkz = s.bkz || [];
  if (s.bkz[L]) return s.bkz[L];
  const p = PATHS[L];
  let d = 0;
  for (; d < p.len - 12; d += 1) {
    const q = posAt(p, d);
    if (Math.hypot(q[0], q[1]) <= 24) break;
  }
  const q = posAt(p, d);
  return (s.bkz[L] = { d, x: q[0], z: q[1], tx: q[2], tz: q[3], nx: -q[3], nz: q[2], noW: {}, noD: false });
}
function laneThreat(s, L) {
  const T = { w: 0, el: {}, k: {}, n: 0 },
    add = (el, k, w) => {
      T.w += w;
      T.n++;
      T.el[el] = (T.el[el] || 0) + w;
      T.k[k] = (T.k[k] || 0) + w;
    };
  if (s.phase === 'prep') {
    for (const g of s.next || [])
      if ((g.path === L || g.path < 0) && !g.hidden)
        add(g.el, g.boss ? 'tank' : g.k, ((g.boss ? 8 : g.count * KINDS[g.k].w) * (g.path < 0 ? 1 : 3)) / 3); // « de partout » : un tiers par chemin
  } else {
    for (const q of s.queue) if (q.path === L) add(q.el, q.boss ? 'tank' : q.k, q.boss ? 8 : KINDS[q.k].w);
    for (const e of s.enemies)
      if (e.path === L && e.hp > 0) add(e.el, e.boss ? 'tank' : e.k, e.boss ? 8 : KINDS[e.k].w);
  }
  return T;
}
const botSay = (s, o, txt) => {
  if ((s.sayT || 0) > s.t) return;
  s.sayT = s.t + 3.5;
  s.events.push({ k: 'say', el: o.el, t: txt });
};
// ---- L'AVANT-POSTE. Le cœur était bien gardé mais rien n'était bâti plus avant, là où il y a toute la place pour tendre un piège.
// À mi-chemin, chaque bot monte un « goulet » : deux murs en entonnoir, ouverts vers la plage, rabattent la route, ceux qui coupent à travers champs et l'éventail
// vers un couloir de 8 m entre deux murs, cerné de défenses. Le couloir peut être creusé : les ennemis y pataugent (70 % puis 40 % de leur vitesse).
// Le bot ne devine rien : il essaie des dizaines de tracés sur la carte des trajets ennemis (fieldOf) et garde celui où les ennemis passent le plus de temps sous le feu.
// Une fosse trop profonde fait fuir les ennemis par l'extérieur de l'entonnoir (ils comptent le détour) : la profondeur est donc essayée aussi, pas décidée d'avance.
// La recherche avance d'un petit pas par image (opSearch) pour ne jamais figer le jeu.
function opGeo(s, L, d, W, U) {
  const p = PATHS[L],
    q = posAt(p, d),
    Q = [q[0], q[1]],
    t = [q[2], q[3]],
    n = [-q[3], q[2]],
    at = (u, v) => [Q[0] + t[0] * u + n[0] * v, Q[1] + t[1] * u + n[1] * v];
  const far = i => {
      const x = cellX(i),
        z = cellZ(i);
      return WALK[i] && Math.hypot(x, z) >= 9;
    },
    free = i =>
      far(i) &&
      !s.wallSet[i] &&
      !s.pit[i] &&
      COST[i] !== 1 &&
      !s.towers.some(T => !T.wy && Math.abs(T.x - cellX(i)) < 3.6 && Math.abs(T.z - cellZ(i)) < 3.6);
  const run = (a, b, skip) => {
    const all = lineCells(cellOf(a[0], a[1]), cellOf(b[0], b[1])).filter(i => !skip || !skip.includes(i));
    let cells = [];
    for (const i of all) {
      if (!free(i)) break;
      cells.push(i);
    }
    while (cells.length > 1) {
      const ln = lineCells(cells[0], cells[cells.length - 1]);
      if (ln.length === cells.length && ln.every(free)) break;
      cells.pop();
    } // la ligne demandée à addWalls doit couvrir exactement ces cases
    return {
      cells,
      a: cells.length ? [cellX(cells[0]), cellZ(cells[0])] : null,
      b: cells.length ? [cellX(cells[cells.length - 1]), cellZ(cells[cells.length - 1])] : null,
      stop: all[cells.length]
    };
  };
  const walls = [],
    own = [],
    tops = [];
  let gm = 0;
  for (const sd of [1, -1]) {
    let nk = null,
      g = 0;
    for (const gg of [8, 10, 12]) {
      const r = run(at(8, gg * sd), at(0, gg * sd));
      if (r.cells.length >= 2 && r.stop === undefined) {
        nk = r;
        g = gg;
        break;
      }
    }
    if (!nk) return null; // le mur du couloir, au plus près de la route sans mordre dessus
    walls.push(nk);
    own.push(...nk.cells);
    tops.push(nk.cells[nk.cells.length > 2 ? 1 : 0]);
    gm = Math.max(gm, g);
    const ar = run(at(0, g * sd), at(-U, W * sd), nk.cells);
    if (ar.cells.length >= 2) {
      walls.push(ar);
      own.push(...ar.cells);
    } else if (!(ar.stop !== undefined && s.wallSet[ar.stop])) return null;
  } // un bras peut manquer si une colline ferme déjà ce côté
  if (new Set(own).size !== own.length || own.length > 34) return null;
  const pitOk = i =>
      far(i) &&
      !own.includes(i) &&
      !s.wallSet[i] &&
      !HILL[i] &&
      Math.hypot(cellX(i), cellZ(i)) <= R_ISLE - 10 &&
      !s.towers.some(T => Math.abs(T.x - cellX(i)) < 3.6 && Math.abs(T.z - cellZ(i)) < 3.6),
    rows = [],
    pc = [];
  for (const u of [0, 4, 8]) {
    const all = lineCells(cellOf(...at(u, -gm)), cellOf(...at(u, gm))),
      k = all.indexOf(cellOf(...at(u, 0)));
    if (k < 0 || !pitOk(all[k])) continue;
    let a = k,
      b = k;
    while (a > 0 && pitOk(all[a - 1])) a--;
    while (b < all.length - 1 && pitOk(all[b + 1])) b++;
    const ln = lineCells(all[a], all[b]);
    if (!ln.every(pitOk) || ln.every(i => pc.includes(i))) continue;
    pc.push(...ln);
    rows.push({ cells: ln, a: [cellX(all[a]), cellZ(all[a])], b: [cellX(all[b]), cellZ(all[b])] });
  }
  return {
    L,
    d,
    W,
    U,
    Q,
    t,
    n,
    C: at(4, 0),
    at: at(14, gm + 2),
    walls,
    rows,
    own,
    slots: [
      [4, gm + 7],
      [4, -gm - 7],
      [14, gm + 2],
      [14, -gm - 2],
      [13, gm + 10],
      [13, -gm - 10],
      [22, 7],
      [22, -7]
    ].map(v => at(v[0], v[1])),
    tops,
    depth: 0,
    nr: 0,
    fail: 0,
    dead: false
  };
}
// part des ennemis du chemin qui passeraient par le couloir (0 à 1) si ce tracé était bâti avec nr rangées de fosse de profondeur dp : la route compte pour 40 %, à travers champs 30 %, l'éventail 30 %
function opCover(s, G, nr, dp) {
  const p = PATHS[G.L],
    W = Uint8Array.from(s.wallSet),
    P = Uint8Array.from(s.pit),
    T = s.fT || new Uint8Array(GN * GN);
  for (const i of G.own) W[i] = 1;
  for (let k = 0; k < (nr || 0) && k < G.rows.length; k++) for (const i of G.rows[k].cells) P[i] = dp;
  const F0 = fieldOf(W, P);
  if (!passOk(F0)) return 0;
  const F1 = fieldOf(W, P, BAL.grassWide, T),
    F2 = fieldOf(W, P, 1, T),
    hit = (x, z) => Math.hypot(x - G.C[0], z - G.C[1]) < 7;
  const trace = (F, x, z) => {
    let i = cellOf(x, z);
    for (let k = 0; k < 400; k++) {
      if (hit(cellX(i), cellZ(i))) return 1;
      if (F[i] < 8) return 0;
      const cx = i % GN,
        cz = (i / GN) | 0;
      let b = -1,
        bf = F[i];
      for (let m = 0; m < 8; m++) {
        const nx = cx + NB[m][0],
          nz = cz + NB[m][1];
        if (nx < 0 || nz < 0 || nx >= GN || nz >= GN) continue;
        const j = nx + nz * GN;
        if (!WALK[j] || W[j]) continue;
        if (m >= 4) {
          const a = nx + cz * GN,
            c = cx + nz * GN;
          if (!WALK[a] || W[a] || !WALK[c] || W[c]) continue;
        }
        if (F[j] < bf) {
          bf = F[j];
          b = j;
        }
      }
      if (b < 0) return 0;
      i = b;
    }
    return 0;
  };
  const bx = p.pts[0][0],
    bz = p.pts[0][1],
    bl = Math.hypot(bx, bz) || 1,
    sp = a => [bx - (bz / bl) * a - (bx / bl) * 6, bz + (bx / bl) * a - (bz / bl) * 6];
  let c1 = 0,
    c2 = 0;
  for (const a of [-6, -3, 0, 3, 6]) {
    const q = sp(a);
    c1 += trace(F1, q[0], q[1]) / 5;
  }
  for (let id = 1; id <= 14; id++) {
    const q = sp(offOf(id) * 5),
      w = fanPoint(p, id),
      l = Math.hypot(w[0] - q[0], w[1] - q[1]) || 1;
    let x = q[0],
      z = q[1],
      got = 0;
    for (let m = 0; m < l && !got; m += 2) {
      const nx = q[0] + ((w[0] - q[0]) * m) / l,
        nz = q[1] + ((w[1] - q[1]) * m) / l,
        i = cellOf(nx, nz);
      if (W[i] || F2[i] >= 1e8) break;
      x = nx;
      z = nz;
      if (hit(x, z)) got = 1;
    }
    c2 += (got || trace(F2, x, z)) / 14;
  }
  return 0.4 * trace(F0, bx, bz) + 0.3 * c1 + 0.3 * c2;
}
const OPV = [
  [0, 0],
  [3, 1],
  [1, 2],
  [3, 2]
]; // fosses essayées : aucune, 3 rangées peu profondes, 1 rangée profonde, 3 rangées profondes
function opLane(s, L) {
  const Z = botLaneInfo(s, L);
  if (Z.os) return Z.os;
  const p = PATHS[L],
    list = [];
  for (let d = 24; d < p.len - 34; d += 4) {
    const q = posAt(p, d),
      r = Math.hypot(q[0], q[1]);
    if (r < 40 || r > 76 || Math.hypot(q[0] - p.pts[0][0], q[1] - p.pts[0][1]) < 50) continue;
    for (const W of [28, 38, 48]) for (const U of [6, 16, 26]) list.push([d, W, U]);
  }
  return (Z.os = { list, i: 0, v: 0, G: null, best: null, bs: 0, done: !list.length });
}
// un petit pas de recherche : un tracé de plus (murs seuls), ou une profondeur de fosse de plus pour le tracé en cours. Valeur d'un tracé = part des ennemis captés
// × mètres parcourus sous le feu des défenses du goulet (30 m, plus ce que la fosse leur fait perdre). Il faut capter au moins 70 % du chemin pour mériter le chantier.
function opSearch(s) {
  for (let L = 0; L < 3; L++) {
    const os = opLane(s, L);
    if (os.done) continue;
    if (!os.G) {
      const c = os.list[os.i++];
      if (os.i >= os.list.length) os.end = 1;
      const G = opGeo(s, L, c[0], c[1], c[2]);
      if (G) {
        os.G = G;
        os.v = 0;
      } else {
        if (os.end) os.done = true;
        continue;
      }
    }
    const G = os.G,
      V = OPV[os.v++],
      cv = V[0] && G.rows.length < Math.min(V[0], 1) ? 0 : opCover(s, G, V[0], V[1]),
      nr = Math.min(V[0], G.rows.length),
      val = cv * (30 + nr * 4 * (1 / (1 - BAL.pitSlow * V[1]) - 1)) - 0.12 * G.own.length;
    if (cv >= 0.7 && val > os.bs) {
      os.bs = val;
      os.best = Object.assign({}, G, { cover: cv, nr, depth: V[1] });
    }
    if (os.v >= OPV.length || (os.v === 1 && cv < 0.7)) {
      os.G = null;
      if (os.end) os.done = true;
    }
    return;
  }
} // des murs qui captent mal ne capteront pas mieux avec une fosse
// un avant-poste par bot, pas plus (sans tireur pour marquer, un avant-poste rapporte peu) : les chemins où le tracé vaut le plus passent d'abord
const opOf = (s, L) => {
    const os = botLaneInfo(s, L).os;
    if (!os || !os.done || !os.best || os.best.dead) return null;
    const C = s.bcfg || BOTCFG,
      nb = C.outN || botList(s).length;
    if (nb < 3) {
      let rk = 0;
      for (let K = 0; K < 3; K++) {
        const q = botLaneInfo(s, K).os;
        if (!q || !q.done) return null;
        if (K !== L && q.best && !q.best.dead && (q.bs > os.bs || (q.bs === os.bs && K < L))) rk++;
      }
      if (rk >= nb) return null;
    }
    return os.best;
  },
  opBuilt = (s, O) => !!O && O.walls.every(w => w.cells.every(i => s.wallSet[i]));
// ---- LE TERRASSEMENT (V2.0, demande de Frédéric : « les esclaves font très peu de trous et de murs, il faudrait qu'ils en fassent plus »).
// Les ennemis arrivent désormais de toute la côte. Chaque bot, sur son secteur :
//   · monte, arc après arc, une CEINTURE de murs à BOTT.ringR m du cœur, entre les routes : elle rabat ceux qui coupent à travers champs vers les trois routes,
//     donc vers les zones de tir. Chaque route garde sa porte (BOTT.gate m de chaque côté) ;
//   · creuse des RANGÉES de fosses en travers de la route, de la porte de la ceinture jusqu'à sa zone de tir, puis les approfondit : on y patauge sous les tirs ;
// Tout passe par checkWalls / checkDig : jamais de quoi fermer l'île (un quart de la côte doit toujours mener au cœur) ni enfermer un ennemi.
const BOTT = {
  ringR: 36,
  gate: 9,
  arc: 9.5,
  rows: [30, 26, 44],
  rowW: [6, 4, 2],
  share: 0.45,
  share0: 0.2,
  shareW: 5,
  rab: 0.5,
  minT: 3,
  minW: 2
};
// rayon de la ceinture, demi-largeur de chaque porte, longueur d'un arc (m) ; rayons des rangées de fosses (loin de la ceinture : un mur ne rebouche jamais une fosse
// du même bot, une fosse ne ronge jamais un de ses murs), demi-largeurs essayées ; part au plus de ce que les bots dépensent qui va au terrassement (45 %) ;
// rabais : un esclave travaille pour rien, il ne paie que les matériaux (la moitié du prix d’un mur ou d’une fosse).
// d'abord défendre. Pas de terrassement avant d'avoir minT défenses de niveau 2 sur son chemin ni avant la préparation de la vague minW + 1,
// et pas plus de share0 (20 %) de l'or dans la terre jusqu'à la vague shareW (5), share (45 %) ensuite.
function ringOf(s) {
  if (s.bring) return s.bring;
  const gates = PATHS.map(p => {
      let d = 0;
      for (; d < p.len; d += 0.5) {
        const q = posAt(p, d);
        if (Math.hypot(q[0], q[1]) <= BOTT.ringR) return Math.atan2(q[1], q[0]);
      }
      return Math.atan2(p.pts[0][1], p.pts[0][0]);
    }),
    G = gates.slice().sort((a, b) => a - b),
    gw = BOTT.gate / BOTT.ringR,
    st = BOTT.arc / BOTT.ringR,
    arcs = [];
  G.forEach((g, i) => {
    let a = g + gw;
    const end = (i + 1 < G.length ? G[i + 1] : G[0] + 6.2832) - gw;
    while (a < end - st * 0.3) {
      const b = Math.min(end, a + st),
        A = [Math.cos(a) * BOTT.ringR, Math.sin(a) * BOTT.ringR],
        B = [Math.cos(b) * BOTT.ringR, Math.sin(b) * BOTT.ringR],
        m = (a + b) / 2,
        L = sectOf(m),
        gd = Math.min(...gates.map(q => Math.abs(Math.atan2(Math.sin(m - q), Math.cos(m - q))))),
        cs = lineCells(cellOf(A[0], A[1]), cellOf(B[0], B[1]));
      let run = [];
      const flush = () => {
        if (run.length && lineCells(run[0], run[run.length - 1]).length === run.length)
          arcs.push({
            a: [cellX(run[0]), cellZ(run[0])],
            b: [cellX(run[run.length - 1]), cellZ(run[run.length - 1])],
            L,
            gd,
            dead: 0
          });
        run = [];
      };
      for (const i of cs) {
        if (HILL[i] || !WALK[i]) flush();
        else run.push(i);
      }
      flush(); // une colline coupe l'arc : elle fait mur à sa place
      a = b;
    }
  });
  arcs.sort((p, q) => p.gd - q.gd); // en partant des portes : ce qui rabat vers la route d'abord
  return (s.bring = arcs);
}
// les rangées de fosses du chemin L : en travers de la route, aux rayons BOTT.rows ; la plus large qui passe (les défenses gardent 3,6 m de terre ferme autour d'elles)
function rowsOf(s, L) {
  const Z = botLaneInfo(s, L);
  if (Z.rows) return Z.rows;
  const p = PATHS[L];
  Z.rows = BOTT.rows.map(R => {
    let d = 0;
    for (; d < p.len; d += 0.5) {
      const q = posAt(p, d);
      if (Math.hypot(q[0], q[1]) <= R) return { q, dead: 0 };
    }
    return { q: posAt(p, 0), dead: 1 };
  });
  return Z.rows;
}
function terraJob(s, o, L, nm) {
  const temp = w => /ennemi|Enfermerait/.test(w || ''),
    S = s.bspend || { t: 0, d: 0 };
  if (S.t > (s.wave < BOTT.shareW ? BOTT.share0 : BOTT.share) * (S.t + S.d)) return null; // la part de l'or des bots qui va dans la terre (voir BOTT)
  const rowJob = deep => {
    for (const r of rowsOf(s, L)) {
      if (r.dead) continue;
      const q = r.q;
      let any = false;
      for (const w of BOTT.rowW) {
        const ax = q[0] + q[3] * w,
          az = q[1] - q[2] * w,
          bx = q[0] - q[3] * w,
          bz = q[1] + q[2] * w,
          c = checkDig(s, ax, az, bx, bz);
        const lc = lineCells(cellOf(ax, az), cellOf(bx, bz));
        if (lc.some(i => s.wallSet[i])) continue; // jamais de fosse qui rongerait un mur
        if (!deep && lc.some(i => s.pit[i])) {
          any = true;
          break;
        } // premier passage : une rangée neuve à la fois ; on approfondit après la ceinture
        if (/Profondeur/.test(c.why)) {
          any = true;
          break;
        } // rangée finie : au fond
        if (c.why || c.cost <= 0) {
          if (temp(c.why)) any = true;
          continue;
        }
        return {
          k: 'dg',
          a: [ax, az],
          b: [bx, bz],
          x: q[0] - q[2] * 4,
          z: q[1] - q[3] * 4,
          c: c.cost,
          row: r,
          say:
            (c.cells.some(i => s.pit[i])
              ? 'je creuse plus profond la fosse en travers du chemin '
              : 'je creuse une fosse en travers du chemin ') +
            nm +
            ' : ceux qui arrivent y pataugent sous nos tirs'
        };
      }
      if (!any) r.dead = 1;
    }
    return null;
  };
  const R1 = rowJob(false);
  if (R1) return R1;
  for (const A of ringOf(s)) {
    if (A.dead || A.L !== L) continue;
    const c = checkWalls(s, A.a[0], A.a[1], A.b[0], A.b[1]);
    if (/Hauteur/.test(c.why)) continue;
    if (c.cells.length && c.cells.every(i => s.wallSet[i])) continue; // arc déjà monté
    if (c.cells.some(i => s.pit[i])) continue; // il ne rebouche pas une fosse
    if (c.why) {
      if (!temp(c.why)) A.dead = 1;
      continue;
    }
    return {
      k: 'wl',
      a: A.a,
      b: A.b,
      x: ((A.a[0] + A.b[0]) / 2) * 0.86,
      z: ((A.a[1] + A.b[1]) / 2) * 0.86,
      c: c.cost,
      arc: A,
      say:
        'un pan de la ceinture de murs : ceux qui arrivent à travers champs sont rabattus vers la route du chemin ' + nm
    };
  }
  return rowJob(true);
}
// le prochain chantier d'un bot sur le chemin L (null : rien à faire, ou il économise pour l'étape suivante)
function botJob(s, o, L, avail, taken) {
  const Z = botLaneInfo(s, L),
    T = laneThreat(s, L),
    want = Object.keys(T.el)
      .sort((a, b) => T.el[b] - T.el[a])
      .map(e => WEAKTO[e]),
    el0 = want[0] || o.bot.el0 || 'feu';
  o.bot.el0 = el0;
  const C = s.bcfg || BOTCFG,
    O = C.out ? opOf(s, L) : null,
    inO = t =>
      !!O &&
      Math.hypot(t.x - O.C[0], t.z - O.C[1]) < 21 &&
      Math.hypot(t.x - O.C[0], t.z - O.C[1]) < Math.hypot(t.x - Z.x - Z.tx * 4, t.z - Z.z - Z.tz * 4),
    tw = s.towers.filter(
      t => t.tmpT === undefined && Math.hypot(t.x - Z.x - Z.tx * 4, t.z - Z.z - Z.tz * 4) < 21 && !inO(t)
    ),
    ow = O ? s.towers.filter(t => t.tmpT === undefined && inO(t)) : [],
    has = ty => tw.some(t => t.type === ty),
    big = k => (T.k[k] || 0) > T.w * 0.25,
    nm = PATHS[L].name;
  const ty =
      big('air') && !has('archer')
        ? 'archer'
        : big('tank') && !has('canon')
          ? 'canon'
          : big('dig') && !has('mortier')
            ? 'mortier'
            : ['mortier', 'archer', 'canon']
                .slice()
                .sort((a, b) => tw.filter(t => t.type === a).length - tw.filter(t => t.type === b).length)[0],
    pc = placeCost(s, ty);
  const SL = [
      [4, 5.5],
      [4, -5.5],
      [11, 5.5],
      [11, -5.5],
      [4, 12.5],
      [4, -12.5],
      [11, 12.5],
      [11, -12.5],
      [-13, 6.5],
      [-13, -6.5]
    ],
    placeJob = () => {
      for (let k = 0; k < SL.length; k++) {
        const x = Z.x + Z.tx * SL[k][0] + Z.nx * SL[k][1],
          z = Z.z + Z.tz * SL[k][0] + Z.nz * SL[k][1];
        if (!canPlace(s, x, z) && !taken(x, z))
          return {
            k: 'pl',
            ty,
            x,
            z,
            el: el0,
            c: pc,
            say:
              'je pose ' +
              (ty === 'archer' ? "une Tour d'archer" : ty === 'canon' ? 'un Canon' : 'un Mortier') +
              ' ' +
              EL[el0].n +
              ' au chemin ' +
              nm +
              (T.n ? ' : ' + EL[el0].n + ' bat ' + EL[BEATS[el0]].n : '')
          };
      }
      return null;
    };
  const wallJob = sd => {
    if (C.wall === 'none' || Z.noW[sd]) return null;
    if (C.wall === 'chic') {
      const wx = Z.x - Z.tx * 5,
        wz = Z.z - Z.tz * 5;
      if (sd < 0 || s.wallSet[cellOf(wx, wz)]) return null;
      let why = '';
      for (const len of [8, 6]) {
        const ax = wx - Z.nx * len,
          az = wz - Z.nz * len,
          bx = wx + Z.nx * len,
          bz = wz + Z.nz * len,
          c = checkWalls(s, ax, az, bx, bz);
        why = c.why;
        if (!c.why && c.cells.length >= 3)
          return {
            k: 'wl',
            a: [ax, az],
            b: [bx, bz],
            x: Z.x,
            z: Z.z,
            c: c.cost,
            sd,
            say: 'un mur en travers du chemin ' + nm + ' : ils doivent en faire le tour, sous le feu de nos défenses'
          };
      }
      if (!/ennemi/.test(why)) Z.noW[sd] = why || 1;
      return null;
    } // refus dû à un ennemi de passage : il réessaiera
    if (s.wallSet[cellOf(Z.x + Z.nx * 10.5 * sd, Z.z + Z.nz * 10.5 * sd)]) return null;
    for (const len of [30, 24, 18]) {
      const ax = Z.x + Z.nx * 6.5 * sd,
        az = Z.z + Z.nz * 6.5 * sd,
        bx = Z.x + Z.nx * len * sd,
        bz = Z.z + Z.nz * len * sd,
        c = checkWalls(s, ax, az, bx, bz);
      if (!c.why && c.cells.length >= 3)
        return {
          k: 'wl',
          a: [ax, az],
          b: [bx, bz],
          x: ax + Z.tx * 3,
          z: az + Z.tz * 3,
          c: c.cost,
          sd,
          say: 'un mur au bord du chemin ' + nm + ' : il rabat vers nos défenses ceux qui coupent à travers champs'
        };
    }
    Z.noW[sd] = 1;
    return null;
  };
  const digJob = () => {
    if (!C.dig || Z.noD || s.pit[cellOf(Z.x - Z.tx * 13, Z.z - Z.tz * 13)]) return null;
    const c = checkDig(s, Z.x - Z.tx * 9.5, Z.z - Z.tz * 9.5, Z.x - Z.tx * 17, Z.z - Z.tz * 17);
    if (c.why || c.cost <= 0) {
      Z.noD = true;
      return null;
    }
    return {
      k: 'dg',
      a: [Z.x - Z.tx * 9.5, Z.z - Z.tz * 9.5],
      b: [Z.x - Z.tx * 17, Z.z - Z.tz * 17],
      x: Z.x - Z.tx * 6,
      z: Z.z - Z.tz * 6,
      c: c.cost,
      say: 'je creuse une fosse devant les défenses du chemin ' + nm + ' : elle ralentit les ennemis sous les tirs'
    };
  };
  const upJob = TW => {
    const mine = (TW || tw)
      .filter(t => t.els.length < MAXEL * MAXLV && !taken(t.x, t.z))
      .sort((a, b) => a.els.length - b.els.length);
    for (const t of mine) {
      const cn = e => t.els.filter(x => x === e).length,
        nd = new Set(t.els).size,
        el =
          [...new Set(t.els)].find(e => cn(e) < MAXLV && want.includes(e)) ||
          want.find(e => cn(e) < MAXLV && (cn(e) || nd < MAXEL)) ||
          [...new Set(t.els)].find(e => cn(e) < MAXLV);
      if (el)
        return {
          k: 'up',
          id: t.id,
          el,
          x: t.x,
          z: t.z,
          c: costOf(t.type, t.els.length),
          say:
            "j'améliore " +
            (cn(el) === 2
              ? 'une défense en ' + EL[el].n + ' pour la troisième fois : elle gagne son effet spécial'
              : 'une défense ' + (TW ? "de l'avant-poste " : 'du chemin ') + nm + ' en ' + EL[el].n)
        };
    }
    return null;
  };
  const wallTower = () => {
    for (const sd of [1, -1]) {
      const i =
        C.wall === 'chic'
          ? cellOf(Z.x - Z.tx * 5 + Z.nx * 7 * sd, Z.z - Z.tz * 5 + Z.nz * 7 * sd)
          : cellOf(Z.x + Z.nx * 6.5 * sd, Z.z + Z.nz * 6.5 * sd);
      if (s.wallSet[i] && !s.towers.some(t => cellOf(t.x, t.z) === i) && !taken(cellX(i), cellZ(i)))
        return {
          k: 'pl',
          ty: 'archer',
          x: cellX(i),
          z: cellZ(i),
          el: el0,
          c: placeCost(s, 'archer'),
          say: "une Tour d'archer posée sur le mur : en hauteur, elle tire plus loin"
        };
    }
    return null;
  };
  // l'avant-poste, dans l'ordre : les murs du couloir et de l'entonnoir, la fosse du couloir, un Mortier et un Canon de part et d'autre, tous deux au niveau 2, puis un Archer sur le mur
  const no = ow.length,
    minO = no ? Math.min(...ow.map(t => t.els.length)) : 0,
    capO = Math.min(C.outCap, 2 + Math.floor((s.wave - C.outW) / 2)),
    oW = C.outW + (s.mode === 'hard' ? 3 : 0),
    temp = w => /ennemi|Enfermerait/.test(w);
  const tagO = J => {
      if (J) J.op = O;
      return J;
    },
    opTower = () => {
      const ty2 = !ow.some(t => t.type === 'mortier')
          ? 'mortier'
          : !ow.some(t => t.type === 'canon')
            ? 'canon'
            : !ow.some(t => t.type === 'archer')
              ? 'archer'
              : ['mortier', 'canon', 'archer']
                  .slice()
                  .sort((a, b) => ow.filter(t => t.type === a).length - ow.filter(t => t.type === b).length)[0],
        c = placeCost(s, ty2);
      if (ty2 === 'archer')
        for (const i of O.tops)
          if (s.wallSet[i] && !s.towers.some(t => cellOf(t.x, t.z) === i) && !taken(cellX(i), cellZ(i)))
            return {
              k: 'pl',
              ty: ty2,
              x: cellX(i),
              z: cellZ(i),
              el: el0,
              c,
              say: "une Tour d'archer sur le mur du couloir : en hauteur, elle tire plus loin"
            };
      for (const q of O.slots)
        if (!canPlace(s, q[0], q[1]) && !taken(q[0], q[1]))
          return {
            k: 'pl',
            ty: ty2,
            x: q[0],
            z: q[1],
            el: el0,
            c,
            say:
              'je pose ' +
              (ty2 === 'canon' ? 'un Canon' : ty2 === 'archer' ? "une Tour d'archer" : 'un Mortier') +
              ' ' +
              EL[el0].n +
              " à l'avant-poste " +
              nm +
              ' : tout ce qui passe le couloir est sous son feu'
          };
      return null;
    };
  const opJob = () => {
    if (!O || s.wave < oW) return null;
    for (const w of O.walls) {
      if (w.cells.every(i => s.wallSet[i])) continue;
      const c = checkWalls(s, w.a[0], w.a[1], w.b[0], w.b[1]);
      if (c.why) {
        if (!temp(c.why)) O.dead = true;
        return null;
      }
      return {
        k: 'wl',
        a: w.a,
        b: w.b,
        x: O.at[0],
        z: O.at[1],
        c: c.cost,
        op: O,
        say:
          'je monte un avant-poste sur le chemin ' +
          nm +
          ' : deux murs en entonnoir rabattent tout le monde vers un seul couloir'
      };
    }
    for (const r of O.rows.slice(0, O.nr)) {
      if (r.dead || r.cells.every(i => s.pit[i] >= O.depth)) continue;
      const c = checkDig(s, r.a[0], r.a[1], r.b[0], r.b[1]);
      if (c.why || c.cost <= 0) {
        if (!temp(c.why)) r.dead = 1;
        continue;
      }
      return {
        k: 'dg',
        a: r.a,
        b: r.b,
        x: O.at[0],
        z: O.at[1],
        c: c.cost,
        op: O,
        say: "je creuse le couloir de l'avant-poste " + nm + ' : ils y pataugent, bien groupés, sous nos tirs'
      };
    }
    if (no < C.outBase) return tagO(opTower());
    if (no && minO < 2) return tagO(upJob(ow));
    if (!ow.some(t => t.type === 'archer') && no < capO + 1) return tagO(opTower());
    return null;
  };
  const opMore = () =>
      opBuilt(s, O)
        ? tagO(no < capO && minO >= 2 ? opTower() || upJob(ow) : upJob(ow) || (no < capO ? opTower() : null))
        : null,
    sum = TW => TW.reduce((a, t) => a + t.els.length, 0);
  const n = tw.length,
    cap = 2 + Math.floor(s.wave / 2),
    minLv = n ? Math.min(...tw.map(t => t.els.length)) : 0;
  let J = null;
  const terra = () => (s.wave >= BOTT.minW && n >= BOTT.minT && minLv >= 2 ? terraJob(s, o, L, nm) : null); // la ceinture et les fosses, une fois le chemin défendu (BOTT)
  if (n < 2) J = placeJob();
  if (!J && minLv < 2) J = upJob(); // d'abord deux défenses au niveau 2
  if (!J && o.bot.alt) J = terra(); // puis un chantier sur deux est du terrassement (o.bot.alt bascule à chaque chantier, voir botPlan)
  if (!J && s.wave >= C.wallW) J = wallJob(1) || wallJob(-1);
  if (!J && s.wave >= C.wallW + 1) J = digJob();
  if (!J && s.wave >= C.wallW + 1 && n < cap + 1) J = wallTower();
  if (!J) J = opJob();
  const core = () => (n < cap && minLv >= 2 ? placeJob() || upJob() : upJob() || (n < cap ? placeJob() : null));
  if (!J)
    J = opBuilt(s, O) && sum(ow) < (sum(tw) * C.outShare) / (1 - C.outShare) ? opMore() || core() : core() || opMore(); // ensuite il fait grandir ensemble sa zone de tir et son avant-poste
  if (!J || J.c > avail) J = terra() || J; // rien d'autre (ou pas encore de quoi le payer) : il terrasse
  if (J) J.L = L;
  return J && J.c <= avail ? J : J ? { wait: 1 } : null;
}
