// ===================== LES DÉGÂTS : zombies, joueur, ville, cloisons, explosions =====================
// hurtZ / killZ : un zombie blessé, tué (argent, charge de l'ultime, cadavre, événements) ; hurtP : le joueur mordu ; hurtCity : la ville
// (mode fuite) ; wallDmg : un panneau de cloison touché ; boom : une explosion (zombies et cloisons proches).
// src (qui a fait le coup) : 'p' le joueur (argent ×2), 't' une tourelle, 'o' l'onde de choc.
// Fournit aux autres dossiers : killZ (interface : outil dev « tuer tous les zombies ») ; hurtZ (tests).

// ---------------------------------------------------------------- les zombies
// blesse le zombie i ; renvoie true s'il en meurt
function hurtZ(S, i, dmg, src) {
  // V4.3 : chez un invité du multi, le coup part vers l'hôte (multi.js)
  if (S.invite) return hurtInvite(S, i, dmg, src);
  const Z = S.z;
  if (Z.st[i] === 0 || Z.hp[i] <= 0) return false;
  // V4.9 : pendant un ultime teinté, l'effet de l'élément de l'arme (voies.js)
  if (S.ultEl) teinte(S, i, dmg);
  // V5.3 : pendant un sort à l'élément choisi, l'effet de cet élément (heros.js : sortEffet)
  if (S.sortEl) sortEffet(S, i, dmg);
  Z.hp[i] -= dmg;
  if (Z.hp[i] <= 0) {
    killZ(S, i, src);
    return true;
  }
  return false;
}
// le zombie i meurt : prime (×2 si c'est le joueur), charge de l'ultime, cadavre (vx, vy, vz : sa vitesse de départ ; par défaut, un grimpeur
// tombe en arrière), événements ; sa place sera rendue par compact à la fin du pas
function killZ(S, i, src, vx, vy, vz) {
  const Z = S.z,
    T = ZT[Z.ty[i]],
    cash = T.cash * S.P.cash * (src === 'p' ? 2 : 1),
    // V4.4 : multi, chez l'hôte : un tué par l'effet d'un invité (sa compétence, son ultime, sa frappe…) est mis à son compte
    // (S.mCredits[id], publié à l'invité), pas à celui de l'hôte ; sans multi, S.mOwn est toujours vide
    own = S.mOwn;
  if (own) {
    const cr = (S.mCredits || (S.mCredits = {}))[own] || (S.mCredits[own] = { k: 0, c: 0 });
    cr.k++;
    cr.c += cash;
  } else {
    S.save.cash = (S.save.cash || 0) + cash;
    S.runCash += cash;
    S.runKills++;
    if (S.P.onde.on || S.hero) S.ult = Math.min(1, S.ult + (1 + S.hm.uCharge) / S.P.onde.need);
  }
  // V4.9 : les voies (Escarmoucheur, recharge rendue ; Plongeur, le poison passe aux voisins)
  if (S.voie) voieTue(S, i, own);
  S.kills++;
  S.left--;
  const st = Z.st[i],
    faceN = st === 2 ? FACES[Z.f[i]] : null;
  addCorpse(
    S,
    Z.x[i],
    Z.y[i] + (st === 3 || st === 7 ? 0.02 : 0),
    Z.z[i],
    Z.yaw[i],
    vx !== undefined ? vx : faceN ? faceN[0] * 1.2 : 0,
    vy !== undefined ? vy : st === 2 ? 1 : 0,
    vz !== undefined ? vz : faceN ? faceN[1] * 1.2 : 0,
    Z.ty[i],
    Z.va[i],
    st
  );
  if (Z.ty[i] === 3) {
    S.boss++;
    S.ev.push({ k: 'bossdead', x: Z.x[i], y: Z.y[i], z: Z.z[i] });
  }
  // un grimpeur tué en hauteur laisse parfois une traînée de sang sur la façade
  if (st === 2 && Z.y[i] > 2 && S.rnd() < 0.3) S.ev.push({ k: 'wk', f: Z.f[i], u: Z.u[i], y: Z.y[i] + 0.9 });
  if (src === 'p' && !own) S.ev.push({ k: 'pkill', x: Z.x[i], y: Z.y[i] + 1.2 * T.sc, z: Z.z[i], c: cash });
  Z.st[i] = 0;
  Z.hp[i] = 0;
}
// un cadavre (520 au plus : le plus vieux disparaît) ; il tombe dans corpsesStep
function addCorpse(S, x, y, z, yaw, vx, vy, vz, ty, va, st) {
  if (S.corpses.length >= 520) S.corpses.shift();
  S.corpses.push({ x, y, z, yaw, vx, vy, vz, ty, va, t: 0, rot: 0, land: 0, st });
}
// une explosion de rayon r en (x, y, z) : dégâts pleins au centre, moitié au bord ; les cadavres qu'elle fait sont projetés ;
// en mode fuite, elle abîme aussi les cloisons proches. kind (affichage, sons) : 's' balle explosive, 'm' obus de mortier ou sous-munition,
// 'M' missile, 'A' bombe de la frappe aérienne, météore ou leurre piégé, 'B' Orbe ('b' par défaut, jamais utilisé)
function boom(S, x, y, z, r, dmg, src, kind) {
  const ev = { k: 'boom', x, y, z, r, kind: kind || 'b' };
  // V5.3 : un sort à l'élément choisi (S.sortEl) : l'affichage dessine l'explosion à sa palette
  if (S.sortEl) ev.ec = S.sortEl;
  S.ev.push(ev);
  // V4.3 : chez l'hôte du multi, les dernières explosions partent dans l'instantané (S.mBooms, créé par encodeInstantane)
  if (S.mBooms) {
    S.mBoomN = ((S.mBoomN || 0) + 1) & 255;
    S.mBooms.push({ id: S.mBoomN, x, y, z, r, kind: kind || 'b', t: S.t });
    if (S.mBooms.length > 32) S.mBooms.shift();
  }
  const Z = S.z;
  boomWalls(S, x, y, z, r, dmg);
  gridEach(S, x, z, r + 1.5, i => {
    if (Z.st[i] === 0) return;
    const T = ZT[Z.ty[i]],
      dx = Z.x[i] - x,
      dy = Z.y[i] + T.sc - y,
      dz = Z.z[i] - z,
      d = Math.hypot(dx, dy, dz);
    if (d > r + T.r) return;
    const falloff = 1 - 0.5 * Math.min(1, d / r);
    if (hurtZ(S, i, dmg * falloff, src) && S.corpses.length) {
      const corpse = S.corpses[S.corpses.length - 1],
        push = 6 / (d + 1);
      corpse.vx += dx * push * 0.4;
      corpse.vz += dz * push * 0.4;
      corpse.vy += 3 + push;
      corpse.land = 0;
    }
  });
}
// ---------------------------------------------------------------- le joueur et la ville
// V4.2 (sa demande du 22/11 : « mourir ne doit pas ressembler à une défaite ») : en mode fuite, le joueur tombé se relève tout seul
// sur le toit au bout de RELEVE secondes (comme le héros de L'Île des Cinq) ; la horde file pendant ce temps. Seule la ville finit la partie.
const RELEVE = 8;
// le joueur mordu (rien en mode invincible, ni pendant la Fulgurance, ni tombé) ; à 0 : il tombe (mode fuite, événement tombe),
// ou c'est la défaite (« Ils arrivent », why = 'joueur')
function hurtP(S, dmg) {
  const p = S.p;
  if (p.dead || p.down > 0 || S.god || p.inv > 0) return;
  // V4.9 : les voies (Mage de bataille, coups amortis ; Soigneuse, bouclier)
  p.hp -= voieCoup(S, dmg * S.P.armor * (S.hero === 'terre' ? Math.max(0.4, 0.75 - S.hm.pA) : 1));
  p.hurtT = 0;
  if (p.hp <= 0 && S.mode === 'out') {
    p.hp = 0;
    p.down = RELEVE;
    S.chutes++;
    p.clb = null;
    p.zip = null;
    p.gl = 0;
    p.vx = p.vz = 0;
    S.ev.push({ k: 'tombe', t: RELEVE });
  } else if (p.hp <= 0) {
    p.hp = 0;
    p.dead = true;
    S.why = 'joueur';
    S.phase = 'dead';
    S.ev.push({ k: 'dead' });
  }
}
// mode fuite : la ville abîmée par un fuyard (le Blindage protège aussi la ville) ; à 0, défaite (why = 'ville')
function hurtCity(S, dmg) {
  if (S.god || S.p.dead) return;
  S.city -= dmg * S.P.armor;
  if (S.city <= 0) {
    S.city = 0;
    S.p.down = 0;
    S.p.dead = true;
    S.why = 'ville';
    S.phase = 'dead';
    S.ev.push({ k: 'dead' });
  }
}
// ---------------------------------------------------------------- les cloisons (mode « Ils s'échappent »)
// un morceau de cloison o touché en (x, y, z) : renvoie true s'il casse (événements wallhit / wallbreak)
function wallDmg(S, o, dmg, x, y, z) {
  if (!o.destr || o.dead) return false;
  // V4.3 : chez un invité du multi, les cloisons sont celles de l'hôte : on ne voit que l'impact
  if (S.invite) {
    // V4.4 : le coup part vers l'hôte (action 'm'), qui casse la cloison pour tous
    murInvite(S, o, dmg);
    S.ev.push({ k: 'wallhit', pid: o.pid, x, y, z, hp: o.hp / o.hp0 });
    return false;
  }
  const broke = hitPanel(o, dmg);
  S.wallVer++;
  S.ev.push(
    broke ? { k: 'wallbreak', pid: o.pid, x, y, z, lv: o.lv, tier: o.tier } : { k: 'wallhit', pid: o.pid, x, y, z, hp: o.hp / o.hp0 }
  );
  return broke;
}
// une explosion abîme les morceaux de cloison à moins de 0,8 r (dmg / 14, moins au bord), sauf derrière un autre mur
function boomWalls(S, x, y, z, r, dmg) {
  if (S.mode !== 'out' || Math.abs(x) > B + r || Math.abs(z) > B + r || y > H + r) return;
  for (const o of PANELS) {
    if (o.dead) continue;
    // (qx, qy, qz) : le point du morceau le plus proche de l'explosion
    const qx = Math.max(o.x0, Math.min(o.x1, x)),
      qy = Math.max(o.y0, Math.min(o.y1, y)),
      qz = Math.max(o.z0, Math.min(o.z1, z)),
      dist = Math.hypot(qx - x, qy - y, qz - z);
    if (dist > r * 0.8) continue;
    const wdmg = (dmg / 14) * (1 - (0.5 * dist) / (r * 0.8));
    if (wdmg <= 0.2) continue;
    // pas à travers un autre mur
    if (dist > 0.05) {
      const hit = rayWallHit(x, y, z, (qx - x) / dist, (qy - y) / dist, (qz - z) / dist, dist);
      if (hit.o && hit.o !== o && hit.t < dist - 0.05) continue;
    }
    wallDmg(S, o, wdmg, qx, qy, qz);
  }
}
