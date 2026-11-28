// [regles/carte.js] La carte : arrivées tout autour de l'île, navires qui croisent au large, grille du terrain et chemins des ennemis (champs de distance), murs et relief vus par les règles.
// chaque ennemi surgit de la mer en un point de la côte tiré pour lui, puis gagne la plage à gué (e.sea = son point d'accostage) ; on peut lui tirer dessus pendant ce temps.
// Les trois chemins restent les routes de l'île ; e.path ne dit plus d'où sort un ennemi mais son « secteur » (le chemin dont la plage est la plus proche par l'angle).
const VAGUES = {
  arc: [Math.PI, 1.5 * Math.PI], // largeur de l'arc de côte d'où ils arrivent aux vagues 1 et 2 (180°, 270°) ; ensuite, tout le tour
  flow: 0.85, // une sortie toutes les flow × BAL.gap secondes (≈ 1,2 par seconde au début, jusqu'à 3,5 en fin de partie) : la vague s'étale, rien ne sort d'un coup
  jit: 0.6, // irrégularité des sorties : chaque écart vaut l'écart moyen × (1 ± jit / 2)
  seaD: 15, // ils surgissent à tant de mètres au large de leur plage
  boatR: 150, // les navires : distance du centre de l'île
  boatW: 0.011, // vitesse de croisière des navires (radians par seconde : un tour en 9 min 30)
  canR: 72, // portée de leurs canons
  coastN: 48, // la côte, vue par les règles : 48 points
  coastMin: 12 // il en faut au moins 12 d'où l'on peut atteindre le cœur (un quart de la côte) : murs et remparts ne ferment jamais l'île
};
// LES NAVIRES. Ce ne sont plus des portails : la flotte ennemie croise loin au large (personne n'en débarque) et ses canons mettent parfois une défense en panne.
// Leur position ne dépend que du temps de la partie : l'hôte et les invités les voient au même endroit sans rien s'envoyer.
const BOATS = PATHS.map(p => {
  const a = p.pts[0],
    l = Math.hypot(a[0], a[1]);
  return [(a[0] / l) * BAL.boatR, (a[1] / l) * BAL.boatR];
});
function boatAt(i, t) {
  const a = Math.atan2(BOATS[i][1], BOATS[i][0]) + (t || 0) * VAGUES.boatW;
  return [Math.cos(a) * VAGUES.boatR, Math.sin(a) * VAGUES.boatR, a];
}
// hauteur des pieds hors de l'île : la plage qui descend, l'eau jusqu'à la taille, puis le large où ils surgissent de sous l'eau
const seaY = (x, z, B) => {
  if (B && Math.hypot(x - B[0], z - B[1]) < 10.5) return 0.9;
  const r = Math.hypot(x, z);
  return r <= R_ISLE - 5 ? 0 : -1.5 * Math.min(1, (r - (R_ISLE - 5)) / 7) - Math.max(0, r - (R_ISLE + 3)) * 0.22;
};
// le tracé d'un aérien ou d'un foreur : en ligne droite de sa plage A au cœur, au format d'un chemin (lu par posAt)
function lineTrack(A) {
  const l = Math.hypot(A[0], A[1]) || 1;
  return { pts: [A, [0, 0]], seg: [{ a: A, b: [0, 0], l, dx: -A[0] / l, dz: -A[1] / l, s: 0 }], len: l };
}
// le secteur d'un angle : le chemin dont la plage est la plus proche (0 Nord, 1 Est, 2 Ouest)
const PATHA = PATHS.map(p => Math.atan2(p.pts[0][1], p.pts[0][0]));
function sectOf(a) {
  let b = 0,
    bd = 9;
  PATHA.forEach((q, i) => {
    const d = Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q)));
    if (d < bd) {
      bd = d;
      b = i;
    }
  });
  return b;
}
function posAt(p, d) {
  d = Math.max(0, Math.min(p.len - 1e-4, d));
  for (const g of p.seg) {
    if (d <= g.s + g.l) {
      const u = d - g.s;
      return [g.a[0] + g.dx * u, g.a[1] + g.dz * u, g.dx, g.dz];
    }
  }
  const g = p.seg[p.seg.length - 1];
  return [g.b[0], g.b[1], g.dx, g.dz];
}
function distSeg(x, z, a, b) {
  const vx = b[0] - a[0],
    vz = b[1] - a[1];
  let t = ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t);
}
function distPaths(x, z) {
  let m = 1e9;
  for (const p of PATHS) for (const g of p.seg) m = Math.min(m, distSeg(x, z, g.a, g.b));
  return m;
}

// ---- terrain : une grille de cases de 4 m. Les ennemis au sol suivent le chemin le moins coûteux vers le cœur ;
// la route coûte 1, l'herbe BAL.grass, un mur est infranchissable. Sans mur, ils restent donc sur la route.
const CELL = 4,
  GN = 64,
  GH = (GN * CELL) / 2,
  NB = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];
const cellOf = (x, z) =>
  Math.max(0, Math.min(GN - 1, Math.floor((x + GH) / CELL))) +
  GN * Math.max(0, Math.min(GN - 1, Math.floor((z + GH) / CELL)));
const cellX = i => (i % GN) * CELL - GH + CELL / 2,
  cellZ = i => Math.floor(i / GN) * CELL - GH + CELL / 2;
const WALK = new Uint8Array(GN * GN),
  COST = new Float32Array(GN * GN);
for (let i = 0; i < GN * GN; i++) {
  const x = cellX(i),
    z = cellZ(i);
  WALK[i] = Math.hypot(x, z) <= R_ISLE - 4 ? 1 : 0;
  COST[i] = distPaths(x, z) <= PATH_HALF + 1 ? 1 : BAL.grass;
}
function fieldOf(W, P, G, T) {
  const D = new Float32Array(GN * GN).fill(1e9),
    q = [],
    C = G ? i => (COST[i] === 1 ? 1 : G) * (T && T[i] ? 4 : 1) : i => COST[i];
  for (let i = 0; i < GN * GN; i++)
    if (Math.hypot(cellX(i), cellZ(i)) < 4) {
      D[i] = 0;
      q.push(i);
    }
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi],
      cx = i % GN,
      cz = (i / GN) | 0,
      d = D[i];
    for (let k = 0; k < 8; k++) {
      const nx = cx + NB[k][0],
        nz = cz + NB[k][1];
      if (nx < 0 || nz < 0 || nx >= GN || nz >= GN) continue;
      const j = nx + nz * GN;
      if (!WALK[j] || W[j]) continue;
      if (k >= 4) {
        const a = nx + cz * GN,
          b = cx + nz * GN;
        if (!WALK[a] || W[a] || !WALK[b] || W[b]) continue;
      } // pas de passage en diagonale entre deux murs
      const nd =
        d +
        (CELL *
          (k >= 4 ? 1.414 : 1) *
          (C(i) * (P ? 1 + BAL.pitCost * P[i] : 1) + C(j) * (P ? 1 + BAL.pitCost * P[j] : 1))) /
          2;
      if (nd < D[j] - 1e-4) {
        D[j] = nd;
        q.push(j);
      }
    }
  }
  return D;
}
// collines : des plateaux naturels de 1 à 3 blocs, les mêmes pour tous les joueurs. Elles suivent les règles d'un mur (on saute sur 1 bloc, on grimpe 2,
// une défense posée dessus voit plus loin, les ennemis au sol les contournent) mais on ne peut ni les creuser ni les rehausser.
const HILL = new Uint8Array(GN * GN);
(function () {
  let sd = 4242,
    n = 0;
  const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const used = {};
  for (let k = 0; k < 900 && n < 10; k++) {
    const sec = k % 10,
      a = (sec + r()) * 0.6283,
      d = 34 + r() * 64,
      cx = Math.cos(a) * d,
      cz = Math.sin(a) * d,
      R = 7 + r() * 8,
      top = R > 11 ? 3 : 2;
    if (used[sec] || distPaths(cx, cz) < R * 0.6 + 8) continue;
    let bad = false;
    for (const p of PATHS) if (Math.hypot(cx - p.pts[0][0], cz - p.pts[0][1]) < R + 16) bad = true;
    if (bad) continue;
    for (let i = 0; i < GN * GN; i++) {
      if (!WALK[i]) continue;
      const x = cellX(i),
        z = cellZ(i),
        q = Math.hypot(x - cx, z - cz) / R + 0.16 * Math.sin(x * 0.9 + cz) * Math.cos(z * 0.7 + cx);
      if (q > 1 || distPaths(x, z) < 7.5 || Math.hypot(x, z) > R_ISLE - 12 || Math.hypot(x, z) < 18) continue;
      HILL[i] = Math.max(HILL[i], q < 0.36 && top > 2 ? 3 : q < 0.66 ? 2 : 1);
    }
    used[sec] = 1;
    n++;
  }
})();
const FIELD0 = fieldOf(HILL),
  fmOf = k => k !== 'air' && k !== 'dig'; // les aériens et les foreurs ignorent les murs : ils gardent le tracé d'origine
function refield(s) {
  s.field = fieldOf(s.wallSet, s.pit);
  s.fv++;
  reland(s);
}
// un ennemi qui marche encore dans la mer n'est jamais « enfermé » : si un mur coupe sa plage du cœur, il en reçoit une autre
function reland(s) {
  if (s.client) return;
  for (const e of s.enemies)
    if (e.sea && e.fm && s.field[cellOf(e.sea[0], e.sea[1])] >= 1e8) {
      const L = landAt(s, Math.atan2(e.sea[1], e.sea[0]));
      e.sea = [L[0], L[1]];
    }
}
// un ennemi au sol posé sur l'île est-il coupé du cœur sur la carte D ? Ceux qui sont encore dans la mer ne comptent pas (ils changent de plage)
const cutOff = (s, D) => s.enemies.some(e => e.fm && !e.sea && D[cellOf(e.x, e.z)] >= 1e8);
// L'INVASION. Les ennemis ne marchent pas à la queue leu leu : ils arrivent de toute la côte et se répartissent sur trois façons d'avancer.
//   0 = par la route (front large) · 1 = à travers champs en suivant à peu près la route · 2 = en éventail : chacun file d'abord vers son propre point de passage,
//   loin de la route (jusqu'à fanW m de côté), puis fond droit sur le cœur. C'est ce qui fait un front large au lieu d'une file.
// Chaque façon a son champ de distances ; les deux dernières contournent les défenses posées au sol. Recalculés quand un mur ou une défense change.
function fieldsOf(s) {
  const sig = s.fv + '|' + s.towers.length + '|' + (s.towers.length ? s.towers[s.towers.length - 1].id : 0);
  if (s.fA && s.fSig === sig) return s.fA;
  s.fSig = sig;
  const T = new Uint8Array(GN * GN);
  for (const t of s.towers) if (!t.wy) T[cellOf(t.x, t.z)] = 1;
  s.fT = T;
  return (s.fA = [s.field, fieldOf(s.wallSet, s.pit, BAL.grassWide, T), fieldOf(s.wallSet, s.pit, 1, T)]);
}
// LA PLAGE D'UN ENNEMI : on part du large dans la direction a et l'on avance vers le cœur jusqu'à la première case libre d'où le cœur est atteignable.
// Un mur sur la côte ferme cette direction (on ne l'enjambe pas à gué) : on essaie alors des angles voisins, de plus en plus loin. Renvoie [x, z, angle].
function landAt(s, a) {
  for (let k = 0; k < 34; k++) {
    // tout le tour de l'île, du plus près au plus loin (V2.0 : 24 essais, soit ±131°, laissaient des angles sans plage ouverte)
    const b = a + (k ? (k & 1 ? 1 : -1) * Math.ceil(k / 2) * 0.19 : 0),
      cx = Math.cos(b),
      cz = Math.sin(b);
    for (let d = R_ISLE - 6; d >= 60; d -= 2) {
      const i = cellOf(cx * d, cz * d);
      if (!WALK[i]) continue;
      if (s.wallSet[i] || s.tmpSet[i]) break;
      if (s.field[i] < 1e8) return [cx * d, cz * d, b];
      break;
    }
  }
  // dernier recours : le point de côte ouvert le plus proche par l'angle (il y en a toujours au moins VAGUES.coastMin)
  let best = -1,
    bd = 9;
  COAST.forEach((i, k) => {
    if (!(s.field[i] < 1e8)) return;
    const b = (k / VAGUES.coastN) * 6.2832,
      d = Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
    if (d < bd) {
      bd = d;
      best = k;
    }
  });
  if (best >= 0) {
    const b = (best / VAGUES.coastN) * 6.2832;
    return [Math.cos(b) * (R_ISLE - 8), Math.sin(b) * (R_ISLE - 8), b];
  }
  const p = PATHS[sectOf(a)].pts[0];
  return [p[0], p[1], Math.atan2(p[1], p[0])];
}
// combien des 48 points de la côte mènent encore au cœur, sur une carte de distances D (fieldOf) : passOk = assez pour que l'île ne soit jamais fermée
const COAST = Array.from({ length: VAGUES.coastN }, (_, k) => {
  const a = (k / VAGUES.coastN) * 6.2832;
  return cellOf(Math.cos(a) * (R_ISLE - 8), Math.sin(a) * (R_ISLE - 8));
});
const coastOpen = D => COAST.reduce((n, i) => n + (D[i] < 1e8 ? 1 : 0), 0),
  passOk = D => coastOpen(D) >= VAGUES.coastMin;
// part des ennemis qui quittent la route, selon la vague (rien de trop tôt : la vague 1 apprend à défendre un chemin)
const wayOf = (id, n) => {
  const h = (id * 37) % 100,
    d = n >= 3 ? BAL.wayDirect : n === 2 ? BAL.wayDirect * 0.4 : 0,
    w = n >= 3 ? BAL.wayWide : n === 2 ? BAL.wayWide * 0.8 : BAL.wayWide * 0.6;
  return h < d ? 2 : h < d + w ? 1 : 0;
};
// point de passage d'un ennemi « en éventail » : à mi-chemin entre son portail et le cœur, décalé sur le côté
function fanPoint(p, id) {
  const px = p.pts[0][0],
    pz = p.pts[0][1],
    l = Math.hypot(px, pz) || 1,
    f = 0.4 + (((id * 53) % 100) / 100) * 0.22,
    a = (offOf(id * 11 + 5) / 1.2) * BAL.fanW;
  let x = px * (1 - f) - (pz / l) * a,
    z = pz * (1 - f) + (px / l) * a;
  const r = Math.hypot(x, z),
    m = R_ISLE - 12;
  if (r > m) {
    x *= m / r;
    z *= m / r;
  }
  return [x, z];
}
// marche en ligne droite vers le point de passage ; contourne un obstacle (mur, colline, défense) par le côté, et renonce s'il est enfermé ou s'il a trop tourné
function wpMove(s, e, mv) {
  const dx = e.wp[0] - e.x,
    dz = e.wp[1] - e.z,
    l = Math.hypot(dx, dz),
    D = s.field,
    T = s.fT;
  e.wl -= mv;
  if (l < 5 || e.wl <= 0) {
    e.wp = null;
    e.tc = null;
    return fieldMove(s, e, mv);
  }
  const ok = (vx, vz) => {
    const i = cellOf(e.x + vx * 2.4, e.z + vz * 2.4);
    return D[i] < 1e8 && !(T && T[i]);
  };
  let ux = dx / l,
    uz = dz / l;
  if (!ok(ux, uz)) {
    const sn = 0.866 * (e.id & 1 ? 1 : -1);
    let vx = ux * 0.5 - uz * sn,
      vz = ux * sn + uz * 0.5;
    if (!ok(vx, vz)) {
      vx = ux * 0.5 + uz * sn;
      vz = -ux * sn + uz * 0.5;
      if (!ok(vx, vz)) {
        e.wp = null;
        e.tc = null;
        return fieldMove(s, e, mv);
      }
    }
    ux = vx;
    uz = vz;
  }
  e.x += ux * mv;
  e.z += uz * mv;
  e.dx = ux;
  e.dz = uz;
}
// Un mur est un bloc plein de WALLH de haut : il arrête les ennemis au sol et le héros, on peut sauter dessus, marcher dessus et y poser une défense.
const WALLH = 1.6; // hauteur d'un bloc ; s.wallSet[case] = nombre de blocs empilés (0 = pas de mur)
// s.pit[case] = profondeur creusée (0 = pas de fosse). Le sol sous les pieds du héros est le point le plus haut qu'il touche.
let SOLID = null; // obstacles du décor (arbres, rochers, statues, sanctuaire) : fonction (x, z, hauteur des pieds) fournie par l'affichage ; on peut toujours en sortir si l'on s'y retrouve
const topAt = (s, x, z) => {
  const a = cellOf(x + 0.4, z + 0.4),
    b = cellOf(x - 0.4, z + 0.4),
    c = cellOf(x + 0.4, z - 0.4),
    d = cellOf(x - 0.4, z - 0.4);
  return (
    WALLH * Math.max(s.wallSet[a] - s.pit[a], s.wallSet[b] - s.pit[b], s.wallSet[c] - s.pit[c], s.wallSet[d] - s.pit[d])
  );
};
// cases traversées par la ligne A → B, reliées par leurs côtés (pas de trou en diagonale)
function lineCells(a, b) {
  let x = a % GN,
    z = (a / GN) | 0;
  const x1 = b % GN,
    z1 = (b / GN) | 0,
    sx = x < x1 ? 1 : -1,
    sz = z < z1 ? 1 : -1,
    dx = 2 * Math.abs(x1 - x),
    dz = 2 * Math.abs(z1 - z),
    out = [a];
  let err = (dx - dz) / 2;
  for (let n = (dx + dz) / 2; n > 0; n--) {
    if (err > 0 || (err === 0 && dx >= dz)) {
      x += sx;
      err -= dz;
    } else {
      z += sz;
      err += dx;
    }
    out.push(x + z * GN);
  }
  return out;
}
function cellWhy(s, i) {
  const cx = cellX(i),
    cz = cellZ(i);
  if (!WALK[i]) return "Hors de l'île";
  if (Math.hypot(cx, cz) < 9) return 'Trop près du cœur';
  for (const t of s.towers)
    if (!t.wy && Math.abs(t.x - cx) < 3.6 && Math.abs(t.z - cz) < 3.6) return "Trop près d'une défense";
  for (const e of s.enemies) if (e.fm && cellOf(e.x, e.z) === i) return 'Un ennemi est dessus';
  return '';
}
