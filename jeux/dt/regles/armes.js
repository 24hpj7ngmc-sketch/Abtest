// ===================== LES ARMES DU JOUEUR : fusil, pistolet, assaut, sniper, pompe, lance-flammes, masse =====================
// WEAP : les profils (multiplicateurs du fusil) ; shoot : un tir (appelé par finishP à la cadence de l'arme) ; la masse : un coup en arc
// qui frappe les zombies proches et casse les cloisons visées.
// Fournit aux autres dossiers : WEAP, WKEYS, weapOf (affichage, interface : choix de l'arme, photos, sons) ; useMasse (interface).

// V2.2 : les armes de L'Île des Cinq (mode « Ils s'échappent » ; « Ils arrivent » garde le fusil). Le fusil est la référence ; l'arbre « Fusil »
// (Calibre, Cadence, Œil de lynx, Perforant, Balles explosives) vaut pour toutes.
// n, short : noms (menu, barre) ; dmg et rate multiplient les dégâts et la cadence du fusil (S.P.rDmg, S.P.rRate) ; range : portée (m) ;
// crit : chance de critique en plus ; critK : multiplicateur du critique ; pierce : zombies traversés en plus ; wall : dégâts d'une balle perdue
// dans une cloison ; zoom : grossissement en visée ; kick : recul (affichage) ; scope : lunette (tenir Tir vise, relâcher tire : interface) ;
// pellets, spread : plombs et dispersion (pompe) ; flame, cone : lance-flammes et demi-angle du cône
const WEAP = {
  fusil: { n: 'Fusil', short: 'Fusil', dmg: 1, rate: 1, range: 150, crit: 0, critK: 2.5, pierce: 0, wall: 1, zoom: 1.5, kick: 1 },
  pistolet: {
    n: 'Pistolet',
    short: 'Pistolet',
    dmg: 1.4,
    rate: 0.86,
    range: 60,
    crit: 0.05,
    critK: 2.5,
    pierce: 0,
    wall: 1,
    zoom: 1.35,
    kick: 1
  },
  assaut: {
    n: "Fusil d'assaut",
    short: 'Assaut',
    dmg: 0.7,
    rate: 1.95,
    range: 50,
    crit: -0.02,
    critK: 2.5,
    pierce: 0,
    wall: 0.6,
    zoom: 1.5,
    kick: 0.55
  },
  sniper: {
    n: 'Fusil de sniper',
    short: 'Sniper',
    dmg: 4.6,
    rate: 0.27,
    range: 160,
    crit: 0.13,
    critK: 3,
    pierce: 1,
    wall: 3,
    zoom: 4,
    kick: 2.2,
    scope: 1
  },
  // V3.9 : fusil à pompe (8 plombs en gerbe, dégâts qui baissent avec la distance, casse bien les cloisons) et lance-flammes (cône de 10 m, enflamme)
  pompe: {
    n: 'Fusil à pompe',
    short: 'Pompe',
    dmg: 0.62,
    rate: 0.22,
    range: 30,
    crit: 0,
    critK: 2,
    pierce: 0,
    wall: 2.2,
    zoom: 1.25,
    kick: 2.4,
    pellets: 8,
    spread: 0.075
  },
  lance: {
    n: 'Lance-flammes',
    short: 'Flammes',
    dmg: 0.38,
    rate: 2.7,
    range: 10,
    crit: -1,
    critK: 1,
    pierce: 0,
    wall: 0,
    zoom: 1.1,
    kick: 0.12,
    flame: 1,
    cone: 0.38
  }
};
// l'ordre des armes au menu
const WKEYS = ['fusil', 'pistolet', 'assaut', 'sniper', 'pompe', 'lance'];
// l'arme en main (toujours le fusil en « Ils arrivent »)
const weapOf = S => WEAP[S.mode === 'out' && WEAP[S.weap] ? S.weap : 'fusil'];
// V3.9 : le lance-flammes : tout ce qui est dans le cône devant (10 m, ~22°), sans mur entre deux, brûle (40 zombies au plus par tic)
function flameShoot(S, W) {
  const p = S.p,
    P = S.P,
    d = viewDir(p),
    o = eyeP(p),
    Z = S.z,
    R = W.range,
    cosCone = Math.cos(W.cone);
  let nHit = 0,
    kill = false;
  gridEach(S, o[0] + d[0] * R * 0.5, o[2] + d[2] * R * 0.5, R * 0.6 + 1, i => {
    if (Z.st[i] === 0 || Z.fant[i] || nHit >= 40) return;
    const T = ZT[Z.ty[i]],
      vx = Z.x[i] - o[0],
      vy = Z.y[i] + T.sc - o[1],
      vz = Z.z[i] - o[2],
      l = Math.hypot(vx, vy, vz);
    if (l > R + T.r || l < 0.05 || (vx * d[0] + vy * d[1] + vz * d[2]) / l < cosCone) return;
    if (rayWall(o[0], o[1], o[2], vx / l, vy / l, vz / l, l) < l - T.r - 0.1) return;
    nHit++;
    Z.burn[i] = Math.max(Z.burn[i], 2.5);
    const dg = P.rDmg * W.dmg * predilK(S);
    if (S.hero) heroOnHit(S, i, dg, Z.x[i], Z.y[i] + 1, Z.z[i]);
    if (hurtZ(S, i, dg, 'p')) kill = true;
  });
  const t = rayWall(o[0], o[1], o[2], d[0], d[1], d[2], R);
  S.ev.push({
    k: 'shot',
    x: o[0] + d[0] * t,
    y: o[1] + d[1] * t,
    z: o[2] + d[2] * t,
    hit: nHit > 0,
    kill,
    crit: false,
    w: 'lance',
    flame: 1
  });
}
// un tir de l'arme en main (appelé par finishP à sa cadence) : lance-flammes, gerbe de plombs (pompe), ou une balle ; pousse l'événement 'shot'
function shoot(S) {
  const p = S.p,
    W = weapOf(S);
  if (S.mode === 'out' && W.flame) return flameShoot(S, W);
  if (S.mode === 'out' && W.pellets) {
    const yaw0 = p.yaw,
      pitch0 = p.pitch;
    let anyHit = false,
      anyKill = false,
      anyCrit = false,
      firstEv = null;
    // chaque plomb part dans une direction tirée au hasard dans un disque de rayon spread autour du regard
    for (let k = 0; k < W.pellets; k++) {
      const a = S.rnd() * 6.283,
        r = W.spread * Math.sqrt(S.rnd());
      p.yaw = yaw0 + Math.cos(a) * r;
      p.pitch = pitch0 + Math.sin(a) * r;
      const e = shootOne(S, W, k);
      if (!firstEv) firstEv = e;
      anyHit = anyHit || e.hit;
      anyKill = anyKill || e.kill;
      anyCrit = anyCrit || e.crit;
    }
    p.yaw = yaw0;
    p.pitch = pitch0;
    S.ev.push({ k: 'shot', x: firstEv.x, y: firstEv.y, z: firstEv.z, hit: anyHit, kill: anyKill, crit: anyCrit, w: 'pompe', pellets: 1 });
    return;
  }
  const e = shootOne(S, W, -1);
  S.ev.push(e);
}
// une balle (ou un plomb du fusil à pompe : pellet ≥ 0, son numéro) ; renvoie l'événement du tir sans le pousser.
// La balle s'arrête au premier mur (ou au sol) ; elle touche les zombies proches de sa ligne, du plus près au plus loin, jusqu'à pierce
// (−25 % à chaque zombie traversé) ; si elle n'est pas arrêtée par un zombie et finit dans une cloison, elle l'abîme (mode fuite).
function shootOne(S, W, pellet) {
  const p = S.p,
    P = S.P,
    d = viewDir(p),
    o = eyeP(p),
    Z = S.z,
    // V4.8 : les balles de Vent traversent un zombie de plus (+ ePierce, la branche du lobby)
    pierce0 = P.rPierce + W.pierce + (S.elArme === 'vent' ? 1 + (S.hm.ePierce || 0) : 0),
    // V4.8 : prédilection (arme de l'élément du héros : +10 %) ; Zéphyr frappe plus fort de loin (+20 % au-delà de 30 m, +5 points par pA)
    predil = predilK(S),
    loinK = S.hero === 'vent' ? 1.2 + 0.05 * (S.hm.pA || 0) : 1,
    // V4.9 : Sniper, tir chargé (×2, 3 zombies de plus) : voies.js
    charge = S.p.tirCh ? 1 : 0,
    pierce = pierce0 + 3 * charge;
  // V4.9 : Artilleur, plus de portée
  let tWall = W.range + porteeVoie(S);
  if (d[1] < -1e-3) tWall = Math.min(tWall, o[1] / -d[1]);
  const wallHit = rayWallHit(o[0], o[1], o[2], d[0], d[1], d[2], tWall);
  tWall = wallHit.t;
  // les zombies dont la poitrine passe à moins de tol de la ligne (un peu plus large au loin), avant le mur
  const hits = [];
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    // V4.3 : les fantômes du multi (foule lointaine chez un invité) ne se touchent pas
    if (Z.st[i] === 0 || Z.fant[i]) continue;
    const T = ZT[Z.ty[i]],
      cx = Z.x[i] - o[0],
      cy = Z.y[i] + 1.05 * T.sc - o[1],
      cz = Z.z[i] - o[2],
      t = cx * d[0] + cy * d[1] + cz * d[2];
    if (t < 0.3 || t > tWall + 0.4) continue;
    const miss2 = cx * cx + cy * cy + cz * cz - t * t,
      tol = T.r * 1.15 + 0.2 + t * 0.018;
    if (miss2 > tol * tol) continue;
    hits.push([t, i]);
  }
  hits.sort((a, b) => a[0] - b[0]);
  let end = null,
    kill = false,
    crit = false,
    first = true,
    pierceMul = 1,
    tue = -1;
  for (let h = 0; h < hits.length && h < pierce; h++) {
    const i = hits[h][1],
      c = S.rnd() < P.rCrit + W.crit;
    crit = crit || c;
    // plombs : pleins jusqu'à 6 m, puis de moins en moins jusqu'à 30 % à la portée
    const dmg =
      P.rDmg *
      W.dmg *
      (c ? W.critK : 1) *
      pierceMul *
      predil *
      (hits[h][0] > 30 ? loinK : 1) *
      (1 + charge) *
      (S.voie ? voieDegats(S, i, hits[h][0]) : 1) *
      (W.pellets ? Math.max(0.3, 1 - (Math.max(0, hits[h][0] - 6) / (W.range - 6)) * 0.7) : 1);
    pierceMul *= 0.75;
    if (S.hero) heroOnHit(S, i, dmg, Z.x[i], Z.y[i] + 1, Z.z[i]);
    const x = Z.x[i],
      y = Z.y[i] + 1.05 * ZT[Z.ty[i]].sc,
      z = Z.z[i];
    if (first) end = [x, y, z];
    first = false;
    // V4.7 : balles incendiaires (le feu posé avant le coup part aussi vers l'hôte chez un invité)
    if (P.rFeu && S.mode === 'out' && S.rnd() < P.rFeu / (W.pellets || 1)) {
      Z.burn[i] = Math.max(Z.burn[i], 3.5);
      S.ev.push({ k: 'allume', x, y, z });
    }
    // V4.9 : Lame, Exécution (voies.js)
    if (hurtZ(S, i, dmg, 'p') || (S.voie && voieAcheve(S, i))) {
      kill = true;
      tue = i;
    }
    if (P.rExp) boom(S, x, y, z, 1.7, P.rDmg * W.dmg * P.rExp * (c ? W.critK : 1), 'p', 's');
  }
  // V4.7 : ricochet et arc électrique (mode fuite ; pour la pompe, seul le premier plomb)
  if (S.mode === 'out' && pellet <= 0 && hits.length) {
    const deja = hits.slice(0, pierce).map(h => h[1]);
    if (P.rRico && tue >= 0) balleSaute(S, tue, P.rRico, P.rDmg * W.dmg * 0.7, 0.7, deja, true);
    if (P.rArc && (S.arcN = (S.arcN || 0) + 1) % 5 === 0) balleSaute(S, hits[0][1], P.rArc, P.rDmg * W.dmg * 0.8, 1, deja, false);
  }
  if (!end) {
    const t = Math.min(tWall, 150);
    end = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
  }
  // balle perdue dans une cloison
  if (hits.length < pierce && wallHit.o && wallHit.o.destr && S.mode === 'out')
    wallDmg(S, wallHit.o, W.wall, o[0] + d[0] * tWall, o[1] + d[1] * tWall, o[2] + d[2] * tWall);
  // les trois premiers plombs, et ceux qui touchent, ont leur traçante
  if (pellet >= 0 && (pellet < 3 || hits.length)) S.ev.push({ k: 'pellet', x: end[0], y: end[1], z: end[2], hit: hits.length > 0 });
  return { k: 'shot', x: end[0], y: end[1], z: end[2], hit: hits.length > 0, kill, crit, w: S.mode === 'out' ? S.weap : 'fusil', charge };
}
// V4.7 : une balle qui saute de zombie en zombie, à partir du zombie de, vers le plus proche pas encore touché (9 m au plus, même étage) :
// n sauts au plus, dmg au premier, × k à chaque saut. Ricochet (rico) : traçante, et le saut ne continue que si le précédent a tué ;
// arc électrique : éclair, et il continue toujours.
function balleSaute(S, de, n, dmg, k, deja, rico) {
  const Z = S.z;
  for (let s = 0; s < n; s++) {
    let best = -1,
      bd = 81;
    gridEach(S, Z.x[de], Z.z[de], 9, j => {
      if (Z.st[j] === 0 || Z.fant[j] || Z.hp[j] <= 0 || deja.includes(j) || Math.abs(Z.y[j] - Z.y[de]) > 2.5) return;
      const dx = Z.x[j] - Z.x[de],
        dz = Z.z[j] - Z.z[de],
        d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        best = j;
      }
    });
    if (best < 0) return;
    deja.push(best);
    const y0 = Z.y[de] + 1.05 * ZT[Z.ty[de]].sc,
      y1 = Z.y[best] + 1.05 * ZT[Z.ty[best]].sc;
    S.ev.push(
      rico
        ? { k: 'tracer', x0: Z.x[de], y0, z0: Z.z[de], x1: Z.x[best], y1, z1: Z.z[best], ty: 'rico' }
        : { k: 'zap', x0: Z.x[de], y0, z0: Z.z[de], x1: Z.x[best], y1, z1: Z.z[best], small: 1 }
    );
    const mort = hurtZ(S, best, dmg, 'p');
    if (rico && !mort) return;
    de = best;
    dmg *= k;
  }
}
// la masse (mode fuite, à débloquer) : lance un coup (S.swing décompte sa durée) ; il porte au tiers du geste (masseHit, appelé par step)
function useMasse(S) {
  const P = S.P;
  if (!P.masse.on || S.mode !== 'out' || S.swing > 0 || S.p.dead || S.p.down > 0 || S.phase === 'dead' || S.phase === 'won') return false;
  S.swing = S.swingT = P.masse.swing;
  S.swingHit = 0;
  S.ev.push({ k: 'swing' });
  return true;
}
// le coup de masse : frappe les zombies à portée devant soi (grimpeurs, dans l'immeuble, dans l'escalier ; pas à travers un mur)
// et recule d'un demi-mètre ceux de l'immeuble qui y survivent ; en mode fuite, casse les morceaux de cloison visés
function masseHit(S) {
  const p = S.p,
    P = S.P,
    Z = S.z,
    reach = P.masse.reach,
    fx = -Math.sin(p.yaw),
    fz = -Math.cos(p.yaw),
    eye = eyeP(p);
  let nHit = 0,
    wall = 0;
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k],
      st = Z.st[i];
    if (st !== 2 && st !== 3 && st !== 7) continue;
    const T = ZT[Z.ty[i]],
      dx = Z.x[i] - p.x,
      dz = Z.z[i] - p.z,
      dy = Z.y[i] + T.sc - (p.y + 1),
      dh = Math.hypot(dx, dz);
    if (dh > reach + T.r || Math.abs(dy) > 1.6 || (dh > 0.05 && (dx * fx + dz * fz) / dh < 0.45)) continue;
    // pas à travers un mur
    if (rayWall(eye[0], eye[1] - 0.4, eye[2], dx / (dh || 1), 0, dz / (dh || 1), dh) < dh - T.r - 0.1) continue;
    nHit++;
    if (!hurtZ(S, i, P.masse.dmg, 'p') && st === 3) {
      const room = 0.5 + T.r,
        c = cellI(Z.x[i] + fx * 0.5, Z.z[i] + fz * 0.5);
      if (rayWall(Z.x[i], Z.y[i] + 1, Z.z[i], fx, 0, fz, room) >= room - 0.01 && c >= 0 && WALK[Z.lv[i]][c]) {
        Z.x[i] += fx * 0.5;
        Z.z[i] += fz * 0.5;
      }
    }
  }
  if (S.mode === 'out') {
    // trois rayons depuis l'œil (dans l'axe du regard, et à ±0,38 rad de côté), portée 1,45 m : on casse ce qu'on vise
    const seen = new Set();
    for (const a of [-0.38, 0, 0.38]) {
      const ya = p.yaw + a,
        cp = Math.cos(p.pitch),
        dx = -Math.sin(ya) * cp,
        dy = Math.sin(p.pitch),
        dz = -Math.cos(ya) * cp;
      const r = rayWallHit(eye[0], eye[1], eye[2], dx, dy, dz, Math.min(reach, 1.45));
      if (!r.o || !r.o.destr || r.o.dead || seen.has(r.o)) continue;
      seen.add(r.o);
      wall = 1;
      wallDmg(S, r.o, P.masse.wall, eye[0] + dx * r.t, eye[1] + dy * r.t, eye[2] + dz * r.t);
    }
  }
  S.ev.push({ k: 'masse', n: nHit, wall, x: p.x + fx * 1.2, y: p.y + 1.1, z: p.z + fz * 1.2 });
}
