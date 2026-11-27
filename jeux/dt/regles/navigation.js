// ===================== LA MARCHE À L'INTÉRIEUR : grilles, chemins, escalier des zombies =====================
// Chaque niveau (toit et balcons compris) a une grille de cases de 50 cm : WALK (case praticable), COST (coût en plus : portes barricadées),
// DCELL (case dans l'embrasure d'une porte). bfs calcule des champs de distance (Dijkstra) : FUP (vers l'escalier qui monte), FDOWN
// (vers l'escalier qui descend), ROOMS[].F (vers le milieu de chaque pièce), S.pf (vers le joueur, recalculé 4 fois par seconde dans step).
// Un zombie suit un champ en allant vers la case voisine la plus basse. Casser un bas de cloison ou poser / perdre toutes les planches
// d'une porte marque le niveau à recalculer (NAVDIRTY) ; navFlush le refait, un niveau par pas.
// Les zombies dans l'escalier suivent STAIRS[k] (le chemin de la volée A au palier puis à la volée B, du niveau k au niveau k+1).
// Rien n'est utilisé hors des règles, sauf par les tests (WALK, FUP, FDOWN, NC, cellI, cellX, cellZ, STAIRS, navRebuild, navFlush, NAVDIRTY).

// ---------------------------------------------------------------- la grille : des cases de 50 cm par niveau (toit compris)
// CS : côté d'une case ; la grille couvre l'immeuble et ses balcons (de −GB à GB) : NC × NC cases (NCC en tout), numérotées c = j·NC + i
const CS = 0.5,
  GB = B + BALD,
  NC = Math.ceil((2 * GB) / CS),
  NCC = NC * NC;
// cellI : la case d'un point (−1 hors de la grille) ; cellX, cellZ : le milieu d'une case
const cellI = (x, z) => {
    const i = Math.floor((x + GB) / CS),
      j = Math.floor((z + GB) / CS);
    return i < 0 || j < 0 || i >= NC || j >= NC ? -1 : j * NC + i;
  },
  cellX = c => -GB + ((c % NC) + 0.5) * CS,
  cellZ = c => -GB + (Math.floor(c / NC) + 0.5) * CS;
// par niveau : WALK[lv][c] = 1 si la case est praticable ; COST[lv][c] = coût en plus pour y passer (porte barricadée) ;
// DCELL[lv][c] = numéro de porte + 1 si la case est dans l'embrasure d'une porte
const WALK = [],
  COST = [],
  DCELL = [];
// WLIST[lv] : les boîtes qui gênent la marche à ce niveau (retenues au premier calcul ; une cloison cassée y reste, marquée dead)
const WLIST = [];
// remplit w pour le niveau lv : 1 si un zombie peut s'y tenir (dans l'immeuble ou sur un balcon, hors de la trémie de l'escalier,
// à plus de 22 cm de toute boîte qui arrête le joueur entre 0,3 et 1,5 m au-dessus du sol)
function walkOf(lv, w) {
  const floorY = LVY(lv),
    lim = lv === NLV ? B - 0.45 : B - 0.32;
  w.fill(0);
  const boxes = WLIST[lv] || (WLIST[lv] = BOX.filter(o => o.p && o.t !== 'bar' && o.y1 > floorY + 0.3 && o.y0 < floorY + 1.5));
  const hasBal = BALV.includes(lv);
  for (let c = 0; c < NCC; c++) {
    const x = cellX(c),
      z = cellZ(c),
      ring = Math.max(Math.abs(x), Math.abs(z));
    if (ring > lim && !(hasBal && ring < B + BALD - 0.3)) continue;
    if (x > HOLE.x0 - 0.05 && x < HOLE.x1 + 0.05 && z > HOLE.z0 && z < HOLE.z1 + 0.15) continue;
    let ok = 1;
    for (const o of boxes) {
      if (o.dead) continue;
      if (x > o.x0 - 0.22 && x < o.x1 + 0.22 && z > o.z0 - 0.22 && z < o.z1 + 0.22) {
        ok = 0;
        break;
      }
    }
    w[c] = ok;
  }
  return w;
}
// au chargement : les grilles de chaque niveau, et les embrasures des portes
for (let lv = 0; lv <= NLV; lv++) {
  WALK.push(walkOf(lv, new Uint8Array(NCC)));
  COST.push(new Float32Array(NCC));
  const dc = new Int16Array(NCC);
  for (const d of DOORS) {
    if (d.lv !== lv) continue;
    for (let c = 0; c < NCC; c++) {
      const x = cellX(c),
        z = cellZ(c);
      if (x > d.x0 - 0.3 && x < d.x1 + 0.3 && z > d.z0 - 0.35 && z < d.z1 + 0.35) dc[c] = d.id + 1;
    }
  }
  DCELL.push(dc);
}
// le tas binaire de bfs (partagé) : HP_ les cases, HK_ leurs distances
const HP_ = new Int32Array(NCC * 8),
  HK_ = new Float32Array(NCC * 8);
// plus court chemin (Dijkstra, petit tas binaire) sur la grille d'un niveau, avec le coût en plus des portes barricadées :
// renvoie (dans out, s'il est donné) la distance de chaque case aux cases goals (1 par pas droit, 1,414 en diagonale ; 1e9 = injoignable).
// On ne coupe pas un coin : une diagonale demande ses deux cases voisines praticables.
function bfs(lv, goals, out) {
  const walk = WALK[lv],
    cost = COST[lv],
    dist = out || new Float32Array(NCC);
  dist.fill(1e9);
  let heapN = 0;
  const push = (c, k) => {
    let i = heapN++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (HK_[p] <= k) break;
      HP_[i] = HP_[p];
      HK_[i] = HK_[p];
      i = p;
    }
    HP_[i] = c;
    HK_[i] = k;
  };
  const pop = () => {
    const c = HP_[0],
      lc = HP_[--heapN],
      lk = HK_[heapN];
    let i = 0;
    for (;;) {
      let m = 2 * i + 1;
      if (m >= heapN) break;
      if (m + 1 < heapN && HK_[m + 1] < HK_[m]) m++;
      if (HK_[m] >= lk) break;
      HP_[i] = HP_[m];
      HK_[i] = HK_[m];
      i = m;
    }
    HP_[i] = lc;
    HK_[i] = lk;
    return c;
  };
  for (const g of goals)
    if (g >= 0) {
      dist[g] = 0;
      push(g, 0);
    }
  while (heapN > 0) {
    const k0 = HK_[0],
      c = pop();
    if (k0 > dist[c]) continue;
    const i = c % NC,
      j = (c - i) / NC;
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        if (!a && !b) continue;
        const ii = i + a,
          jj = j + b;
        if (ii < 0 || jj < 0 || ii >= NC || jj >= NC) continue;
        const m = jj * NC + ii;
        if (!walk[m]) continue;
        if (a && b && (!walk[j * NC + ii] || !walk[jj * NC + i])) continue;
        const nd = dist[c] + (a && b ? 1.414 : 1) + cost[m];
        if (nd < dist[m] && heapN < HP_.length) {
          dist[m] = nd;
          push(m, nd);
        }
      }
  }
  return dist;
}
// la case praticable la plus proche de (x, z) au niveau lv (−1 s'il n'y en a aucune)
const nearWalk = (lv, x, z) => {
  let c = cellI(x, z);
  if (c >= 0 && WALK[lv][c]) return c;
  let best = -1,
    bd = 1e9;
  for (let k = 0; k < NCC; k++)
    if (WALK[lv][k]) {
      const d = Math.hypot(cellX(k) - x, cellZ(k) - z);
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
  return best;
};
// les entrées de l'escalier : SA (on monte, volée A, côté ouest) et SB (on arrive d'en bas, volée B, côté est) ; sur le toit, l'intérieur du cabanon
const SA = [-1, -2.05],
  SB = [1, -2.05],
  HUTIN = [1, -2.2];
// FUP[lv] : champ vers l'escalier qui monte (null au toit) ; FDOWN[lv] : vers l'escalier qui descend (null au rez-de-chaussée)
const FUP = [],
  FDOWN = [];
for (let lv = 0; lv <= NLV; lv++) {
  FUP.push(lv < NLV ? bfs(lv, [nearWalk(lv, SA[0], SA[1])]) : null);
  FDOWN.push(lv > 0 ? bfs(lv, [nearWalk(lv, lv === NLV ? HUTIN[0] : SB[0], lv === NLV ? HUTIN[1] : SB[1])]) : null);
}
// ROOMS[].F : champ vers le milieu de chaque pièce (les envahisseurs s'y postent)
for (const r of ROOMS) r.F = bfs(r.lv, [nearWalk(r.lv, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)]);
// chaque case de l'embrasure d'une porte barricadée coûte 10 de plus : les zombies font le tour si c'est moins long, sinon ils arrachent les planches
const PLANK_COST = 10;
// recalcule la marche d'un niveau (une cloison est tombée, une porte a gagné ou perdu toutes ses planches) et ses champs
function navRebuild(lv) {
  walkOf(lv, WALK[lv]);
  const cost = COST[lv],
    dc = DCELL[lv];
  for (let c = 0; c < NCC; c++) cost[c] = dc[c] && DOORS[dc[c] - 1].planks > 0 ? PLANK_COST : 0;
  if (FUP[lv]) bfs(lv, [nearWalk(lv, SA[0], SA[1])], FUP[lv]);
  if (FDOWN[lv]) bfs(lv, [nearWalk(lv, lv === NLV ? HUTIN[0] : SB[0], lv === NLV ? HUTIN[1] : SB[1])], FDOWN[lv]);
  for (const r of ROOMS) if (r.lv === lv) bfs(lv, [nearWalk(lv, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)], r.F);
}
// au début d'une partie : immeuble intact, aucune planche
function resetBuilding() {
  for (const o of PANELS) {
    o.dead = 0;
    o.hp = o.hp0;
  }
  for (const d of DOORS) {
    d.planks = 0;
    d.torn = 0;
    d.pd = 0;
    d.tt = 0;
    d.tAt = -1;
  }
  NAVDIRTY.fill(0);
  for (let lv = 0; lv <= NLV; lv++) navRebuild(lv);
}
// NAVDIRTY[lv] = 1 : la marche du niveau lv est à recalculer
const NAVDIRTY = new Uint8Array(NLV + 1);
// appelé à chaque pas : recalcule un seul niveau marqué (pas de gros à-coup)
function navFlush() {
  for (let lv = 0; lv <= NLV; lv++)
    if (NAVDIRTY[lv]) {
      NAVDIRTY[lv] = 0;
      navRebuild(lv);
      return;
    }
}
// un panneau de cloison prend des coups ; s'il casse, renvoie true (et la marche du niveau sera recalculée si c'était un bas ou un milieu)
function hitPanel(o, dmg) {
  if (!o || !o.destr || o.dead) return false;
  o.hp -= dmg;
  if (o.hp > 0) return false;
  o.dead = 1;
  o.hp = 0;
  if (o.tier === 'bas' || o.tier === 'milieu') NAVDIRTY[o.lv] = 1;
  return true;
}
// planches : n en plus (ou en moins) sur une porte ; la marche n'est recalculée que si la porte passe de 0 à quelque chose (ou l'inverse)
function setPlanks(d, n) {
  const was = d.planks > 0;
  d.planks = Math.max(0, Math.min(PLANKS_MAX, n));
  if (was !== d.planks > 0) NAVDIRTY[d.lv] = 1;
}
// le chemin d'une volée à l'autre, du niveau k au niveau k+1 (pour les zombies dans l'escalier) : volée A, palier, volée B
function stairPath(k) {
  const L = LVY(k),
    h = LVY(k + 1) - L,
    m = L + h / 2;
  return [
    [-1, L, -1.5],
    [-1, m, 1.5],
    [-0.5, m, 2],
    [0.5, m, 2],
    [1, m, 1.5],
    [1, L + h, -1.5]
  ];
}
// STAIRS[k] : { P : points du chemin, seg : longueur de chaque segment, tot : longueur totale }
const STAIRS = [];
for (let k = 0; k < NLV; k++) {
  const P = stairPath(k),
    seg = [];
  let tot = 0;
  for (let i = 1; i < P.length; i++) {
    const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]);
    seg.push(l);
    tot += l;
  }
  STAIRS.push({ P, seg, tot });
}
// où en est-on sur l'escalier k (distance le long du chemin) quand on est au point (x, y, z)
function stairParam(k, x, y, z) {
  const St = STAIRS[k];
  let best = 0,
    bd = 1e9,
    acc = 0;
  for (let i = 0; i < St.seg.length; i++) {
    const a = St.P[i],
      b = St.P[i + 1],
      vx = b[0] - a[0],
      vy = b[1] - a[1],
      vz = b[2] - a[2],
      l2 = vx * vx + vy * vy + vz * vz;
    let u = l2 ? ((x - a[0]) * vx + (y - a[1]) * vy + (z - a[2]) * vz) / l2 : 0;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const d = Math.hypot(a[0] + vx * u - x, a[1] + vy * u - y, a[2] + vz * u - z);
    if (d < bd) {
      bd = d;
      best = acc + u * St.seg[i];
    }
    acc += St.seg[i];
  }
  return best;
}
// le point de l'escalier k à la distance s le long du chemin
function stairPos(k, s) {
  const St = STAIRS[k];
  s = Math.max(0, Math.min(St.tot, s));
  for (let i = 0; i < St.seg.length; i++) {
    if (s <= St.seg[i] || i === St.seg.length - 1) {
      const u = St.seg[i] ? Math.min(1, s / St.seg[i]) : 0,
        a = St.P[i],
        b = St.P[i + 1];
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    }
    s -= St.seg[i];
  }
  return St.P[St.P.length - 1];
}
