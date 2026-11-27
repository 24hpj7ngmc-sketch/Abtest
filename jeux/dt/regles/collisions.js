// ===================== COLLISIONS : sols, murs, balles =====================
// Requêtes sur l'immeuble décrit dans immeuble.js : à quel niveau est une hauteur, quel sol sous un point, le joueur contre les boîtes,
// et la distance d'un rayon (balle, regard) jusqu'au premier mur.
// Fournit aux autres dossiers : levelOf (affichage, modèles), floorAt (affichage), rayWall (affichage, interface).

// le niveau (0 à NLV) d'une hauteur y : le plus haut dont le sol est à moins de 0,6 m au-dessus de y
const levelOf = y => {
  let k = NLV;
  while (k > 0 && LVY(k) > y + 0.6) k--;
  return k;
};
// la hauteur du plus haut sol sous (x, z) qui ne dépasse pas ymax (0 s'il n'y en a pas) ; les rampes d'escalier montent avec z
function floorAt(x, z, ymax) {
  let best = -1e9;
  for (const f of FLOORS) {
    if (f.off || x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue;
    const y = f.ramp ? f.ya + ((z - f.z0) / (f.z1 - f.z0)) * (f.yb - f.ya) : f.y;
    if (y <= ymax && y > best) best = y;
  }
  return best === -1e9 ? 0 : best;
}
// le joueur (un cercle de rayon r, du sol à 1,7 m) contre les boîtes qui l'arrêtent : repoussé hors de chacune, au plus court
function collideP(p, r) {
  const yb = p.y + 0.15,
    yt = p.y + 1.7;
  for (const o of BOX) {
    if (!o.p || o.dead || o.y1 <= yb || o.y0 >= yt) continue;
    if (p.x + r <= o.x0 || p.x - r >= o.x1 || p.z + r <= o.z0 || p.z - r >= o.z1) continue;
    const cx = p.x < o.x0 ? o.x0 : p.x > o.x1 ? o.x1 : p.x,
      cz = p.z < o.z0 ? o.z0 : p.z > o.z1 ? o.z1 : p.z,
      dx = p.x - cx,
      dz = p.z - cz,
      d = Math.hypot(dx, dz);
    if (d > 1e-6) {
      if (d < r) {
        p.x = cx + (dx / d) * r;
        p.z = cz + (dz / d) * r;
      }
    } else {
      // le centre est dans la boîte : on sort par le côté le plus proche
      const toX0 = p.x - o.x0,
        toX1 = o.x1 - p.x,
        toZ0 = p.z - o.z0,
        toZ1 = o.z1 - p.z,
        least = Math.min(toX0, toX1, toZ0, toZ1);
      if (least === toX0) p.x = o.x0 - r;
      else if (least === toX1) p.x = o.x1 + r;
      else if (least === toZ0) p.z = o.z0 - r;
      else p.z = o.z1 + r;
    }
  }
}
// une balle (un rayon) : distance jusqu'au premier mur qu'elle touche. BBOX : les boîtes qui arrêtent les balles (toutes construites au chargement)
const BBOX = BOX.filter(o => o.b);
// la boîte touchée par le dernier rayWall(…, keep)
let RHIT = null;
// comme rayWall, mais renvoie aussi la boîte touchée : { t : distance, o : boîte ou null }
function rayWallHit(ox, oy, oz, dx, dy, dz, tmax) {
  RHIT = null;
  const t = rayWall(ox, oy, oz, dx, dy, dz, tmax, 1);
  return { t, o: RHIT };
}
// distance (au plus tmax) du point o, dans la direction d, jusqu'à la première boîte qui arrête les balles (méthode des tranches) ;
// keep : retenir la boîte touchée dans RHIT
function rayWall(ox, oy, oz, dx, dy, dz, tmax, keep) {
  let best = tmax;
  const ix = 1 / (dx || 1e-9),
    iy = 1 / (dy || 1e-9),
    iz = 1 / (dz || 1e-9);
  for (const o of BBOX) {
    if (o.dead) continue;
    let t0 = (o.x0 - ox) * ix,
      t1 = (o.x1 - ox) * ix;
    if (t0 > t1) {
      const q = t0;
      t0 = t1;
      t1 = q;
    }
    let u0 = (o.y0 - oy) * iy,
      u1 = (o.y1 - oy) * iy;
    if (u0 > u1) {
      const q = u0;
      u0 = u1;
      u1 = q;
    }
    if (u0 > t0) t0 = u0;
    if (u1 < t1) t1 = u1;
    if (t0 > t1) continue;
    let w0 = (o.z0 - oz) * iz,
      w1 = (o.z1 - oz) * iz;
    if (w0 > w1) {
      const q = w0;
      w0 = w1;
      w1 = q;
    }
    if (w0 > t0) t0 = w0;
    if (w1 < t1) t1 = w1;
    if (t0 > t1 || t1 < 0) continue;
    const t = t0 > 0 ? t0 : 0;
    if (t < best) {
      best = t;
      if (keep) RHIT = o;
    }
  }
  return best;
}
