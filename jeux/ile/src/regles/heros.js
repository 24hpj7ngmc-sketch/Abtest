// [regles/heros.js] Les six héros : passif, compétence et ultime de chacun (le même kit dans tous les jeux du projet).
// la compétence de chaque héros
function ability(s, h, a) {
  h = h || s.hero;
  if (h.el === 'terre') return h.m.voB ? charge(s, h, a) : rempart(s, h); // V2.2 : Avant-garde, le Rempart devient une charge
  if (h.el === 'elec') return dash(s, h, a);
  if (h.el === 'bois') return brambles(s, h, a);
  if (h.el === 'feu') return fireball(s, h, a);
  if (h.el === 'vent') return rafale(s, h, a);
  return tide(s, h, a);
}
const offOf = id => ((id * 7919) % 240) / 100 - 1.2;
// le kit de chaque héros : compétence, ultime, et son rôle en tête de `tag` (V2.1 : les rôles du lobby, façon LoL)
const KIT = {
    terre: { skill: 'Rempart', ult: 'Séisme', tag: 'Tank · Rempart · Séisme' },
    elec: { skill: 'Éclair', ult: 'Orage', tag: 'Assassin · Éclair · Orage' },
    bois: { skill: 'Ronces', ult: 'Gardiens', tag: 'Combattant · Ronces · Gardiens' },
    feu: { skill: 'Brasier', ult: 'Météores', tag: 'Mage · Brasier · Météores' },
    eau: { skill: 'Marée', ult: 'Déluge', tag: 'Support · Marée · Déluge' },
    vent: { skill: 'Rafale', ult: 'Tir perçant', tag: 'Tireur · Rafale · Tir perçant' }
  },
  HPB = { terre: BAL.rocHp, elec: BAL.voltHp };
// ---- Volt (Élec), le mobile. Passif : sprint plus rapide, tirs qui sautent sur un voisin, mais moins de vie. Compétence : Éclair. Ultime : Orage.
// Éclair : il file tout droit sur BAL.dashLen m, s'arrête contre un obstacle, électrocute ce qu'il traverse et ne peut pas être touché un instant.
// `a` porte la position de départ envoyée par un invité, pour que l'hôte frappe au bon endroit.
function dash(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.dashCd - h.m.abCd;
  let x = h.x,
    z = h.z,
    yaw = h.yaw;
  if (a && [a[1], a[2], a[3]].every(Number.isFinite) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40) {
    x = a[1];
    z = a[2];
    yaw = a[3];
  }
  const fx = -Math.sin(yaw),
    fz = -Math.cos(yaw),
    y = h.y || 0;
  let d = 0;
  for (; d < BAL.dashLen + h.m.kLen; d += 0.5) {
    const nx = x + fx * (d + 0.5),
      nz = z + fz * (d + 0.5);
    if (topAt(s, nx, nz) > y + 0.3 || Math.hypot(nx, nz) > R_ISLE - 3) break;
  }
  const ex = x + fx * d,
    ez = z + fz * d;
  {
    // V2.2 : Lame (spA2) achève sous 15 % de vie ; Escarmoucheur : chaque élimination rend une part de la recharge, et avec spB2 une élimination relance l'Éclair.
    // Chez un invité, l'hôte frappe ; l'invité ne fait qu'estimer les éliminations pour sa propre recharge.
    const dmg = BAL.dashDmg * (1 + h.m.abDmg) * (1 + 0.08 * (lvl(s, s.wave) - 1));
    let kills = 0;
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || e.k === 'air') continue;
      if (distSeg(e.x, e.z, [x, z], [ex, ez]) < 2.6 + (e.boss ? 2 : 0)) {
        const dd = dmg * mult('elec', e.el, e.boss, BAL.strong + s.m.strong);
        if (s.client) {
          if (e.hp - dd <= 0) kills++;
          continue;
        }
        hurtE(e, dd, false, true);
        e.slow = Math.max(e.slow, 1);
        if (h.m.voA && h.m.spA2 && !e.boss && e.hp > 0 && e.hp < e.max * BAL.lameExe) e.hp = 0;
        if (e.hp <= 0) kills++;
      }
    }
    if (h === s.hero && h.m.voB && kills)
      h.ab = h.m.spB2 ? 0 : Math.max(0, h.ab - kills * (BAL.escK + h.m.spB1) * BAL.dashCd);
  }
  if (!s.client) {
    if (h.m.kTrail) {
      for (let k = 1; k <= 3; k++) zoneAdd(s, x + ((ex - x) * k) / 4, z + ((ez - z) * k) / 4, 3, 'elec', 3);
      for (const q of s.zones) if (q.el === 'elec' && distSeg(q.x, q.z, [x, z], [ex, ez]) < 1) q.hero = 1;
    }
  }
  if (h === s.hero) {
    h.x = ex;
    h.z = ez;
    h.inv = 0.5;
  }
  s.events.push({ k: 'dash', x, z, ex, ez });
  return true;
}
// Orage : un nuage reste BAL.stormT s là où il est lancé et foudroie 3 ennemis toutes les 0,4 s dans son rayon, aériens compris.
function storm(s, h) {
  if (s.over) return false;
  if (!s.client)
    s.storms.push({ x: h.x, z: h.z, t: BAL.stormT + h.m.uDur, r: BAL.stormR + h.m.uRad, zap: 0, tn: tintEl(h) });
  s.events.push({ k: 'storm', x: h.x, z: h.z });
  return true;
}
// ---- Sylve (Bois), le contrôle. Passif : elle voit les furtifs de loin et ses tirs empoisonnent. Compétence : Ronces. Ultime : Gardiens.
// Ronces : un grand roncier là où elle vise (a[4],a[5]), qui blesse, ralentit et entrave par à-coups tout ce qui le traverse au sol.
function brambles(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.ronceCd - h.m.abCd;
  let tx = h.x - Math.sin(h.yaw) * 8,
    tz = h.z - Math.cos(h.yaw) * 8;
  if (a && Number.isFinite(a[4]) && Number.isFinite(a[5]) && Math.hypot(a[4] - h.x, a[5] - h.z) < 26) {
    tx = a[4];
    tz = a[5];
  }
  if (h.m.voB) {
    // V2.2, Plongeur : elle bondit vers le point visé (BAL.plongeLen m au plus, +spB1), s'arrête contre un obstacle, et les Ronces poussent là où elle retombe
    const x0 = a && Number.isFinite(a[1]) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40 ? a[1] : h.x,
      z0 = a && Number.isFinite(a[2]) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40 ? a[2] : h.z,
      L = Math.hypot(tx - x0, tz - z0) || 1,
      ux = (tx - x0) / L,
      uz = (tz - z0) / L,
      y = h.y || 0;
    let d = 0;
    for (; d < Math.min(L, BAL.plongeLen + h.m.spB1); d += 0.5) {
      const nx = x0 + ux * (d + 0.5),
        nz = z0 + uz * (d + 0.5);
      if (topAt(s, nx, nz) > y + 0.3 || Math.hypot(nx, nz) > R_ISLE - 3) break;
    }
    tx = x0 + ux * d;
    tz = z0 + uz * d;
    if (h === s.hero) {
      h.x = tx;
      h.z = tz;
      h.inv = 0.4;
    }
    s.events.push({ k: 'plonge', x: x0, z: z0, ex: tx, ez: tz });
  }
  if (!s.client) {
    zoneAdd(s, tx, tz, BAL.ronceR + h.m.abRad, 'bois', BAL.ronceT + h.m.kDur);
    for (const q of s.zones)
      if (q.el === 'bois' && Math.hypot(q.x - tx, q.z - tz) < 1.6) {
        q.hero = 1;
        q.pw = (BAL.ronceDmg / 3) * (1 + h.m.abDmg) * (1 + 0.08 * (lvl(s, s.wave) - 1));
      }
  }
  s.events.push({ k: 'ronce', x: tx, z: tz });
  return true;
}
// Gardiens : trois tours d'archer Bois de niveau 3 (flèches empoisonnées) poussent autour d'elle et disparaissent au bout de BAL.guardT s. Elles sont gratuites et ne s'améliorent pas.
function guardians(s, h) {
  if (s.over) return false;
  if (!s.client) {
    let n = 0;
    for (const R of [5, 8, 11])
      for (let k = 0; k < 8 && n < 3 + h.m.uExtra; k++) {
        const a = k * 0.785 + R,
          x = h.x + Math.cos(a) * R,
          z = h.z + Math.sin(a) * R;
        if (canPlace(s, x, z) || s.wallSet[cellOf(x, z)]) continue;
        s.towers.push({
          id: s.nid++,
          type: 'archer',
          x,
          z,
          els: tintEl(h) ? ['bois', tintEl(h), tintEl(h)] : ['bois', 'bois', 'bois'], // ultime teinté (V2.2) : les flèches gagnent l'élément de l'arme
          cd: 0.3,
          aim: 0,
          wy: 0,
          tmpT: BAL.guardT + h.m.uDur
        });
        n++;
      }
  }
  s.events.push({ k: 'guard', x: h.x, z: h.z });
  return true;
}
// ---- Braise (Feu), les dégâts. Passif : ses tirs enflamment et éclaboussent autour de la cible. Compétence : Brasier. Ultime : Météores.
// Brasier : une boule de feu explose là où il vise (a[4],a[5]) et laisse des flammes au sol.
function fireball(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.fbCd - h.m.abCd;
  const art = h.m.voA ? BAL.artiFb + h.m.spA1 : 0; // V2.2, Artilleur : le Brasier part plus loin
  let tx = h.x - Math.sin(h.yaw) * (10 + art),
    tz = h.z - Math.cos(h.yaw) * (10 + art);
  if (a && Number.isFinite(a[4]) && Number.isFinite(a[5]) && Math.hypot(a[4] - h.x, a[5] - h.z) < 26 + art) {
    tx = a[4];
    tz = a[5];
  }
  if (!s.client) {
    const d = BAL.fbDmg * (1 + h.m.abDmg) * (1 + 0.08 * (lvl(s, s.wave) - 1)),
      FR = BAL.fbR + h.m.abRad;
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || e.k === 'air' || Math.hypot(e.x - tx, e.z - tz) > FR + (e.boss ? 1.5 : 0)) continue;
      hurtE(e, d * mult('feu', e.el, e.boss, BAL.strong + s.m.strong), false, true);
      e.burn = Math.max(e.burn, 3);
    }
    zoneAdd(s, tx, tz, FR * 0.7, 'feu', BAL.fbZoneT + (h.m.voA && h.m.spA2 ? BAL.fireStay : 0)); // Artilleur (spA2) : les flammes restent plus longtemps
    for (const q of s.zones)
      if (q.el === 'feu' && Math.hypot(q.x - tx, q.z - tz) < 1.6) {
        q.hero = 1;
        q.pw = 1 + 0.08 * (lvl(s, s.wave) - 1);
      }
  }
  s.events.push({ k: 'fball', x: tx, z: tz });
  return true;
}
// Météores : BAL.metN météores tombent un par un, où qu'il soit, sur l'ennemi le plus avancé vers le cœur. Les aériens sont touchés aussi.
function meteors(s, h) {
  if (s.over) return false;
  if (!s.client)
    s.rain.push({
      n: BAL.metN + h.m.uExtra,
      t: 0.3,
      r: BAL.metR + h.m.uRad,
      fz: h.m.voA && h.m.spA2 ? BAL.fireStay : 0, // Artilleur : chaque météore laisse des flammes au sol
      tn: tintEl(h)
    });
  s.events.push({ k: 'rain' });
  return true;
}
// ---- Ondine (Eau), le soutien. Passif : elle se soigne vite et ses tirs ralentissent. Compétence : Marée. Ultime : Déluge.
// Les soins aux autres joueurs passent par le réseau : chacun gère la vie de son propre héros (`mine` signale au jeu qu'il faut prévenir les coéquipiers).
// Marée : une vague autour d'elle soigne les héros, repousse, ralentit et blesse les ennemis au sol.
function tide(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.tideCd - h.m.abCd;
  const R = BAL.tideR + h.m.abRad;
  let x = h.x,
    z = h.z;
  if (a && Number.isFinite(a[1]) && Number.isFinite(a[2]) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40) {
    x = a[1];
    z = a[2];
  }
  if (!s.client) {
    const d = BAL.tideDmg * (1 + h.m.abDmg) * (1 + 0.08 * (lvl(s, s.wave) - 1));
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.k === 'air' || Math.hypot(e.x - x, e.z - z) > R) continue;
      hurtE(e, d * mult('eau', e.el, e.boss, BAL.strong + s.m.strong), false, true);
      e.slow = Math.max(e.slow, 3);
      if (h.m.voB) {
        // V2.2, Entraveuse : la Marée immobilise au lieu de repousser (les boss sont seulement ralentis)
        if (!e.boss && !e.bur) {
          e.stun = Math.max(e.stun, BAL.rootT + h.m.spB1);
          e.imm = e.stun + 1;
        }
      } else if (!e.boss && !e.bur) knock(s, e, BAL.tideKnock + h.m.kLen);
      if (e.k === 'ste') e.rev = 4;
    }
  }
  const heal = (BAL.tideHeal + h.m.kHeal) * (h.m.voA ? 1 + BAL.soinK + h.m.spA1 : 1), // V2.2, Soigneuse : soins renforcés, et un bouclier avec spA2
    sh = h.m.voA && h.m.spA2 ? BAL.shield : 0;
  if (h === s.hero) {
    h.hp = Math.min(h.maxHp, h.hp + heal);
    if (sh) {
      h.shd = Math.max(h.shd || 0, sh);
      h.shT = BAL.shieldT;
    }
  }
  s.events.push({ k: 'tide', x, z, r: R, heal, sh, mine: h === s.hero });
  return true;
}
// Déluge : pendant BAL.floodT s, tous les ennemis au sol de l'île sont ralentis et rongés par l'eau ; le cœur récupère des points ; tous les héros sont soignés et relevés.
function deluge(s, h) {
  if (s.over) return false;
  if (!s.client) {
    s.flood = BAL.floodT + h.m.uDur;
    s.core = Math.min(s.coreMax, s.core + BAL.floodCore + h.m.uExtra);
    const gr = s.enemies.filter(e => e.hp > 0 && e.k !== 'air' && !e.sea);
    if (h.m.voB && h.m.spB2)
      for (const e of gr)
        if (!e.boss && !e.bur) {
          e.stun = Math.max(e.stun, BAL.delugeRoot); // V2.2, Entraveuse : le Déluge immobilise à son arrivée
          e.imm = e.stun + 1;
        }
    tintUlt(s, h, gr, 0, 0, 0);
  }
  if (h === s.hero) h.hp = h.maxHp;
  s.events.push({ k: 'deluge', mine: h === s.hero });
  return true;
}
// ---- Zéphyr (Vent), le Tireur (V2.1). Passif : ses balles font plus mal au-delà de BAL.zephFar m (+20 %, +5 points par niveau). Compétence : Rafale. Ultime : Tir perçant.
// Rafale : une rafale le porte en arrière sur BAL.zephLen m (+kLen), s'arrête contre un obstacle ; avec kPush, elle repousse aussi les ennemis proches au départ.
function rafale(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.zephCd - h.m.abCd;
  let x = h.x,
    z = h.z,
    yaw = h.yaw;
  if (a && [a[1], a[2], a[3]].every(Number.isFinite) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40) {
    x = a[1];
    z = a[2];
    yaw = a[3];
  }
  const bx = Math.sin(yaw),
    bz = Math.cos(yaw),
    y = h.y || 0;
  let d = 0;
  for (; d < BAL.zephLen + h.m.kLen; d += 0.5) {
    const nx = x + bx * (d + 0.5),
      nz = z + bz * (d + 0.5);
    if (topAt(s, nx, nz) > y + 0.3 || Math.hypot(nx, nz) > R_ISLE - 3) break;
  }
  const ex = x + bx * d,
    ez = z + bz * d;
  if (!s.client && h.m.kPush)
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || e.boss || e.k === 'air') continue;
      if (Math.hypot(e.x - x, e.z - z) < BAL.zephPush) knock(s, e, 5);
    }
  if (h === s.hero) {
    h.x = ex;
    h.z = ez;
    h.inv = 0.4;
  }
  s.events.push({ k: 'rafale', x, z, ex, ez });
  return true;
}
// Tir perçant : un trait de vent qui part de lui dans la direction visée, sur BAL.perceLen m, et traverse tout ce qui est sur sa ligne (aériens compris).
function perce(s, h) {
  if (s.over) return false;
  const fx = -Math.sin(h.yaw),
    fz = -Math.cos(h.yaw),
    L = BAL.perceLen,
    ex = h.x + fx * L,
    ez = h.z + fz * L,
    W = BAL.perceR + (h.m.uRad || 0),
    el = h.wEl || elOf(h);
  if (!s.client) {
    const d = BAL.perceDmg * (1 + (h.m.uDmg || 0)) * (1 + 0.08 * (lvl(s, s.wave) - 1));
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur) continue;
      if (distSeg(e.x, e.z, [h.x, h.z], [ex, ez]) < W + rOf(e)) {
        hurtE(e, d * mult(el, e.el, e.boss, BAL.strong + s.m.strong), true, true);
        e.mark = BAL.markT;
        if (e.hp > 0) tintUlt(s, h, [e], 0, 0, -1);
      }
    }
  }
  s.events.push({ k: 'perce', x: h.x, z: h.z, ex, ez, w: W, el });
  return true;
}
const ULT = { terre: quake, elec: storm, bois: guardians, feu: meteors, eau: deluge, vent: perce };
// L'ULTIME TEINTÉ (V2.2) : l'ultime garde son effet et gagne celui de l'élément de l'arme en main (le Séisme de Roc avec une arme de feu devient un séisme de lave).
// tintEl : l'élément qui teinte (rien si l'arme est de l'élément du héros) ; tintUlt l'applique aux ennemis touchés. r > 0 : un cercle à montrer ; r = 0 : toute l'île ; r < 0 : rien à montrer.
const tintEl = h => (h.wEl && ELS.includes(h.wEl) && h.wEl !== elOf(h) ? h.wEl : '');
function tintUlt(s, h, es, x, z, r, el) {
  el = el || tintEl(h);
  if (!el || s.client) return;
  let n = 0;
  for (const e of es) {
    if (e.hp <= 0) continue;
    if (el === 'feu') {
      e.burn = Math.max(e.burn, 3);
      e.bk = Math.max(e.bk || 1, 1.5);
    } else if (el === 'eau') e.slow = Math.max(e.slow, 3);
    else if (el === 'bois') {
      e.poi = Math.max(e.poi || 0, 4);
      e.pk = Math.max(e.pk || 1, 1.5);
    } else if (el === 'terre') {
      if (e.boss) e.slow = Math.max(e.slow, 2);
      else if (!(e.imm > 0)) {
        e.stun = Math.max(e.stun, 1);
        e.imm = e.stun + 1;
      }
    } else if (el === 'elec') {
      if (n++ < 6) {
        hurtE(
          e,
          18 * (1 + 0.08 * (lvl(s, s.wave) - 1)) * mult('elec', e.el, e.boss, BAL.strong + s.m.strong),
          false,
          true
        );
        s.events.push({ k: 'arc', x: e.x, z: e.z });
      }
    } else if (el === 'vent' && liftable(e)) lift(e, 1.2);
  }
  if (r >= 0) s.events.push({ k: 'tint', x, z, r, el });
}
// ---- Roc (Terre), le tank. Passif : plus de vie, coups au contact amortis. Compétence : Rempart. Ultime : Séisme.
// Rempart : un vrai mur de 5 blocs de large et 2 de haut dressé 5 m devant lui, qui disparaît tout seul. Il ne peut pas fermer le passage ; s'il ne tient pas à 5, on essaie à 3, puis à 1.
function rempart(s, h) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.rempartCd - h.m.abCd;
  if (s.client) return true; // chez un invité, c'est l'hôte qui pose les blocs
  const fx = -Math.sin(h.yaw),
    fz = -Math.cos(h.yaw),
    cx = h.x + fx * 5,
    cz = h.z + fz * 5,
    want = [
      ...new Set(
        (h.m.kWide || h.m.voA ? [0, -1, 1, -2, 2, -3, 3] : [0, -1, 1, -2, 2]).map(
          (
            k // V2.2, Gardien : un Rempart plus large
          ) => cellOf(cx - fz * k * CELL, cz + fx * k * CELL)
        )
      )
    ].filter(i => !s.wallSet[i] && !s.pit[i] && !cellWhy(s, i));
  for (const set of [want, want.slice(0, 5), want.slice(0, 3), want.slice(0, 1)]) {
    if (!set.length) continue;
    for (const i of set) s.wallSet[i] = BAL.rempartH;
    const D = fieldOf(s.wallSet, s.pit);
    if (passOk(D) && !cutOff(s, D)) {
      for (const i of set) {
        s.walls.push(i);
        s.tmpSet[i] = 1;
        s.tmp.push({ i, t: BAL.rempartT + h.m.kDur });
        s.events.push({ k: 'wallup', x: cellX(i), z: cellZ(i) });
      }
      s.field = D;
      s.fv++;
      reland(s);
      return true;
    }
    for (const i of set) s.wallSet[i] = 0;
  }
  h.ab = 1;
  s.events.push({ k: 'nowall' });
  return false;
}
// Séisme : blesse et étourdit tout ce qui marche autour de lui (les boss sont seulement ralentis), déterre les foreurs, révèle les furtifs. Les aériens y échappent.
function quake(s, h) {
  if (s.over) return false;
  const d = BAL.quakeDmg * (1 + 0.08 * (lvl(s, s.wave) - 1)),
    QR = BAL.quakeR + h.m.uRad,
    QT = BAL.quakeT + h.m.uDur,
    hit = [];
  for (const e of s.enemies) {
    if (e.hp <= 0 || e.k === 'air' || Math.hypot(e.x - h.x, e.z - h.z) > QR + (e.boss ? 2 : 0)) continue;
    hurtE(e, d * mult('terre', e.el, e.boss, BAL.strong + s.m.strong), true, true);
    if (e.boss) e.slow = Math.max(e.slow, QT);
    else {
      e.stun = Math.max(e.stun, QT);
      e.imm = e.stun + 1;
    }
    if (e.k === 'ste') e.rev = 4;
    hit.push(e);
  }
  tintUlt(s, h, hit, h.x, h.z, QR);
  s.events.push({ k: 'quake', x: h.x, z: h.z, r: QR });
  return true;
}
// ---- Roc, voie Avant-garde (V2.2) : le Rempart devient une charge. Il fonce sur BAL.chargeLen m (+spB1), s'arrête contre un obstacle,
// blesse et renverse (étourdit) ce qu'il traverse ; avec spB2, il renverse aussi tout ce qui est à BAL.chargeR m de son point d'arrivée. Recharge : BAL.chargeCd s.
function charge(s, h, a) {
  if (h.ab > 0 || s.over) return false;
  h.ab = BAL.chargeCd - h.m.abCd;
  let x = h.x,
    z = h.z,
    yaw = h.yaw;
  if (a && [a[1], a[2], a[3]].every(Number.isFinite) && Math.hypot(a[1] - h.x, a[2] - h.z) < 40) {
    x = a[1];
    z = a[2];
    yaw = a[3];
  }
  const fx = -Math.sin(yaw),
    fz = -Math.cos(yaw),
    y = h.y || 0;
  let d = 0;
  for (; d < BAL.chargeLen + h.m.spB1; d += 0.5) {
    const nx = x + fx * (d + 0.5),
      nz = z + fz * (d + 0.5);
    if (topAt(s, nx, nz) > y + 0.3 || Math.hypot(nx, nz) > R_ISLE - 3) break;
  }
  const ex = x + fx * d,
    ez = z + fz * d;
  if (!s.client) {
    const dmg = BAL.chargeDmg * (1 + h.m.abDmg) * (1 + 0.08 * (lvl(s, s.wave) - 1));
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || e.k === 'air') continue;
      const on = distSeg(e.x, e.z, [x, z], [ex, ez]) < 2.4 + (e.boss ? 2 : 0),
        end = h.m.spB2 && Math.hypot(e.x - ex, e.z - ez) < BAL.chargeR + (e.boss ? 2 : 0);
      if (!on && !end) continue;
      hurtE(e, dmg * mult('terre', e.el, e.boss, BAL.strong + s.m.strong), false, true);
      if (e.boss) e.slow = Math.max(e.slow, 2);
      else {
        knock(s, e, 4);
        e.stun = Math.max(e.stun, BAL.chargeStun);
        e.imm = e.stun + 1;
      }
    }
  }
  if (h === s.hero) {
    h.x = ex;
    h.z = ez;
    h.inv = 0.5;
  }
  s.events.push({ k: 'charge', x, z, ex, ez, r: h.m.spB2 ? BAL.chargeR : 0 });
  return true;
}
