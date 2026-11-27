// [regles/terrassement.js] Murs et fosses : vérifier puis poser une ligne de murs, creuser, et ce que ça change pour les ennemis et le héros.
// vérifie une ligne de murs de A à B : renvoie la raison du refus (vide si c'est bon), les cases à construire et le prix
// vérifie une ligne de A à B : un bloc de plus sur chaque case (nouvelle case, étage supplémentaire, ou fosse qu'on rebouche d'un niveau)
function checkWalls(s, x0, z0, x1, z1) {
  const all = lineCells(cellOf(x0, z0), cellOf(x1, z1)),
    cells = all.filter(i => s.wallSet[i] < BAL.wallTop),
    fresh = cells.filter(i => !s.wallSet[i] && !s.pit[i]),
    r = { why: '', all: (cells.length ? cells : all).slice(0, BAL.wallLine), cells, cost: cells.length * BAL.wall };
  if (all.length > BAL.wallLine) {
    r.why = 'Ligne trop longue';
    return r;
  }
  if (!cells.length) {
    r.why = 'Hauteur maximale';
    return r;
  }
  for (const i of cells) {
    const w = HILL[i]
      ? 'Colline : pas de mur ici'
      : s.tmpSet[i]
        ? 'Rempart en place'
        : s.wallSet[i]
          ? s.towers.some(t => t.wy && cellOf(t.x, t.z) === i)
            ? 'Une défense est dessus'
            : ''
          : s.pit[i]
            ? ''
            : cellWhy(s, i);
    if (w) {
      r.why = w;
      return r;
    }
  }
  if (s.walls.length + fresh.length > BAL.wallMax) {
    r.why = 'Maximum de murs atteint';
    return r;
  }
  if (fresh.length) {
    for (const i of fresh) s.wallSet[i] = 1;
    const D = fieldOf(s.wallSet, s.pit);
    for (const i of fresh) s.wallSet[i] = 0; // un mur ne peut jamais fermer l'île : il faut qu'un quart de la côte au moins mène encore au cœur (V2.0)
    if (!passOk(D)) {
      r.why = 'Bloquerait le passage';
      return r;
    }
    if (cutOff(s, D)) {
      r.why = 'Enfermerait des ennemis';
      return r;
    }
  }
  return r;
}
function addWalls(s, x0, z0, x1, z1) {
  const c = checkWalls(s, x0, z0, x1, z1);
  if (c.why || s.gold < c.cost) return false;
  s.gold -= c.cost;
  for (const i of c.cells) {
    if (s.pit[i]) {
      if (--s.pit[i] <= 0) s.pits.splice(s.pits.indexOf(i), 1);
    } else {
      if (!s.wallSet[i]) s.walls.push(i);
      s.wallSet[i]++;
    }
  }
  refield(s);
  return true;
}
// creuser = l'inverse : un bloc de moins sur chaque case. Sur un mur, on retire l'étage du dessus (remboursé à moitié) ; au sol, on creuse une fosse.
// Une fosse ne bloque pas : les ennemis au sol la traversent au ralenti, et le héros doit sauter pour en sortir.
function digWhy(s, i) {
  const cx = cellX(i),
    cz = cellZ(i),
    d = Math.hypot(cx, cz);
  if (!WALK[i] || d > R_ISLE - 10) return 'Trop près du bord';
  if (d < 9) return 'Trop près du cœur';
  for (const t of s.towers) if (Math.abs(t.x - cx) < 3.6 && Math.abs(t.z - cz) < 3.6) return "Trop près d'une défense";
  return '';
}
function checkDig(s, x0, z0, x1, z1) {
  const all = lineCells(cellOf(x0, z0), cellOf(x1, z1)),
    cells = all.filter(i => s.wallSet[i] || s.pit[i] < BAL.pitTop),
    r = { why: '', all: (cells.length ? cells : all).slice(0, BAL.wallLine), cells, cost: 0 };
  if (all.length > BAL.wallLine) {
    r.why = 'Ligne trop longue';
    return r;
  }
  if (!cells.length) {
    r.why = 'Profondeur maximale';
    return r;
  }
  let nw = 0;
  for (const i of cells) {
    if (HILL[i]) {
      r.why = 'Colline : on ne creuse pas ici';
      return r;
    }
    if (s.tmpSet[i]) {
      r.why = 'Rempart en place';
      return r;
    }
    if (s.wallSet[i]) {
      if (s.towers.some(t => t.wy && cellOf(t.x, t.z) === i)) {
        r.why = 'Une défense est dessus';
        return r;
      }
      r.cost -= Math.floor(BAL.wall / 2);
    } else {
      const w = digWhy(s, i);
      if (w) {
        r.why = w;
        return r;
      }
      r.cost += BAL.dig;
      if (!s.pit[i]) nw++;
    }
  }
  if (s.pits.length + nw > BAL.pitMax) r.why = 'Maximum de fosses atteint';
  return r;
}
function dig(s, x0, z0, x1, z1) {
  const c = checkDig(s, x0, z0, x1, z1);
  if (c.why || s.gold < c.cost) return false;
  s.gold -= c.cost;
  for (const i of c.cells) {
    if (s.wallSet[i]) {
      if (--s.wallSet[i] <= 0) s.walls.splice(s.walls.indexOf(i), 1);
    } else {
      if (!s.pit[i]) s.pits.push(i);
      s.pit[i]++;
    }
  }
  refield(s);
  return true;
}
// avance un ennemi au sol de mv mètres, de case en case, vers la case voisine la plus proche du cœur
function fieldMove(s, e, mv) {
  const D = (s.fA && s.fA[e.fk || 0]) || s.field;
  for (let guard = 0; mv > 1e-4 && guard < 4; guard++) {
    if (e.tc == null || e.fv !== s.fv) {
      const i = cellOf(e.x, e.z),
        cx = i % GN,
        cz = (i / GN) | 0;
      let best = -1,
        bd = D[i];
      e.fv = s.fv;
      for (let k = 0; k < 8; k++) {
        const nx = cx + NB[k][0],
          nz = cz + NB[k][1];
        if (nx < 0 || nz < 0 || nx >= GN || nz >= GN) continue;
        const j = nx + nz * GN;
        if (D[j] >= 1e8) continue;
        if (k >= 4 && (D[nx + cz * GN] >= 1e8 || D[cx + nz * GN] >= 1e8)) continue;
        if (D[j] < bd - 1e-4) {
          bd = D[j];
          best = j;
        }
      }
      e.tc = best;
    }
    if (e.tc < 0) return;
    const cx = cellX(e.tc),
      cz = cellZ(e.tc),
      fr = D[cellOf(cx + e.ox, cz + e.oz)] < 1e8,
      dx = cx + (fr ? e.ox : 0) - e.x,
      dz = cz + (fr ? e.oz : 0) - e.z,
      l = Math.hypot(dx, dz);
    if (l < 0.3) {
      e.tc = null;
      continue;
    }
    const st = Math.min(mv, l);
    e.x += (dx / l) * st;
    e.z += (dz / l) * st;
    e.dx = dx / l;
    e.dz = dz / l;
    mv -= st;
    if (st >= l - 1e-6) e.tc = null;
  }
}
function knock(s, e, m) {
  if (!e.fm) {
    e.d = Math.max(0, e.d - m);
    return;
  }
  const x = e.x - (e.dx || 0) * m,
    z = e.z - (e.dz || 0) * m,
    i = cellOf(x, z);
  if (WALK[i] && !s.wallSet[i] && s.field[i] < 1e8) {
    e.x = x;
    e.z = z;
    e.tc = null;
  }
}
