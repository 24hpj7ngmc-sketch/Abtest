// [regles/joueur.js] Le joueur dans la partie : objectifs de vague, héros blessé ou à terre, lance-flammes, déplacement et tir (heroStep).
// ---- objectifs de vague : à partir de la vague 2, une partie des vagues en propose un. Seul l'hôte les fait avancer.
// bomb : un porteur de bombe rapide et solide à abattre avant le cœur. zone : rester dans un cercle. relic : aller chercher une relique sur la route et la ramener au cœur.
const OBJN = { bomb: 'Porteur de bombe', zone: 'Zone à tenir', relic: 'Relique' };
function newObj(s, force) {
  const r = s.rng,
    k = force || ['bomb', 'zone', 'relic'][Math.floor(r() * 3)];
  if (k === 'bomb') {
    const path = Math.floor(r() * 3);
    s.queue.push({ t: s.t + 7, path, el: ELS[Math.floor(r() * ELS.length)], boss: false, k: 'b', bomb: true });
    s.queue.sort((a, b) => a.t - b.t);
    s.obj = { k, path, id: 0 };
  } else if (k === 'zone') {
    let x = 40,
      z = 40;
    for (let i = 0; i < 40; i++) {
      const a = r() * 6.283,
        d = 35 + r() * 50;
      x = Math.cos(a) * d;
      z = Math.sin(a) * d;
      if (distPaths(x, z) > 8) break;
    }
    s.obj = { k, x, z, got: 0, t: BAL.zoneTime };
  } else {
    const p = PATHS[Math.floor(r() * 3)],
      q = posAt(p, (0.35 + r() * 0.25) * p.len);
    s.obj = { k, x: q[0], z: q[1], car: null, t: BAL.relicTime };
  }
  s.events.push({ k: 'obj', t: 'start', o: k });
}
function objEnd(s, win, gold) {
  const o = s.obj;
  if (!o) return;
  s.obj = null;
  if (win) {
    s.gold += gold;
    if (o.k !== 'bomb') s.pts += 1;
  }
  s.events.push({ k: 'obj', t: win ? 'win' : 'fail', o: o.k, g: win ? gold : 0 });
}
function objStep(s, dt) {
  const o = s.obj;
  if (!o || o.k === 'bomb') return;
  const hs = [['me', s.hero]];
  for (const k in s.others) hs.push([k, s.others[k]]);
  o.t -= dt;
  if (o.k === 'zone') {
    if (hs.some(h => !h[1].down && Math.hypot(h[1].x - o.x, h[1].z - o.z) < BAL.zoneR)) o.got += dt;
    if (o.got >= BAL.zoneNeed) objEnd(s, true, wgold(s, 40, 6));
    else if (o.t <= 0) objEnd(s, false, 0);
    return;
  }
  let c = o.car ? hs.find(h => h[0] === o.car) : null;
  if (c && c[1].down > 0) c = null; // un porteur à terre lâche la relique sur place
  if (!c) {
    o.car = null;
    c = hs.find(h => !(h[1].down > 0) && Math.hypot(h[1].x - o.x, h[1].z - o.z) < 2.5) || null;
    if (c) o.car = c[0];
  }
  if (c) {
    o.x = c[1].x;
    o.z = c[1].z;
    if (Math.hypot(o.x, o.z) < 7) {
      objEnd(s, true, wgold(s, 60, 8));
      return;
    }
  }
  if (o.t <= 0) objEnd(s, false, 0);
}
// ---- le héros en danger. Chaque joueur gère la vie de son propre héros ; les autres la reçoivent par le réseau.
const HDMG = { b: 4, tank: 14, dig: 7, ste: 10 },
  HBOSS = [0, 18, 26, 40]; // dégâts au contact, avant la hausse par vague
function hurtHero(s, h, d) {
  if (h.down > 0 || s.heroGod || h.inv > 0) return;
  d *= 1 + BAL.hDmgG * (lvl(s, s.wave) - 1);
  // V2.2, les voies qui protègent : Mage de bataille (spB2), un Roc Gardien tout près, puis le bouclier d'eau de la Soigneuse
  if (h.el === 'feu' && h.m.voB && h.m.spB2) d *= 1 - BAL.auraK;
  if (gardNear(s, h)) d *= 1 - BAL.gardK;
  if (h.shd > 0) {
    const a = Math.min(h.shd, d);
    h.shd -= a;
    d -= a;
    if (d <= 0) return;
  }
  h.hp -= d;
  h.ult = Math.min(100, h.ult + d * BAL.ultHurt * (1 + h.m.uCharge));
  h.hurtT = 0;
  if (h === s.hero) s.events.push({ k: 'ouch' });
  if (h.hp <= 0) {
    h.hp = 0;
    h.down = BAL.respawn;
    h.rev = 0;
    s.events.push(h === s.hero ? { k: 'down' } : { k: 'downB', el: h.el });
  }
}
// un Roc de la voie Gardien protège les alliés à BAL.gardR m (+spA1) de lui (pas lui-même)
function gardNear(s, h) {
  const hs = [s.hero];
  for (const k in s.others) hs.push(s.others[k]);
  for (const o of hs)
    if (
      o !== h &&
      o.el === 'terre' &&
      o.m &&
      o.m.voA &&
      !(o.down > 0) &&
      Math.hypot(o.x - h.x, o.z - h.z) < BAL.gardR + (o.m.spA1 || 0)
    )
      return true;
  return false;
}
// la vie de départ d'un héros : la base, l'arbre du lobby, le bonus de son rôle (Roc, Volt), et la voie Colosse de Sylve (V2.2)
const heroHpOf = (el, m) =>
  BAL.heroHp + (m.hHp || 0) + (HPB[el] || 0) + (el === 'bois' && m.voA ? BAL.colHp + (m.spA1 || 0) : 0);
// renvoie vrai si le héros est debout. À terre : il revient au cœur après BAL.respawn s, ou plus vite si un coéquipier reste à côté de lui.
function heroLife(s, h, dt) {
  if (h.down > 0) {
    let near = h !== s.hero && !(s.hero.down > 0) && Math.hypot(s.hero.x - h.x, s.hero.z - h.z) < 3; // le joueur peut relever un bot
    for (const k in s.others) {
      const o = s.others[k];
      if (!o.down && Math.hypot(o.x - h.x, o.z - h.z) < 3) {
        near = true;
        break;
      }
    }
    h.rev = near ? h.rev + dt : 0;
    h.down -= dt;
    h.eye += (0.45 - h.eye) * Math.min(1, dt * 6);
    if (h.rev >= BAL.reviveT) {
      h.down = 0;
      h.rev = 0;
      h.hp = h.maxHp * 0.5;
      h.hurtT = 0;
      if (h === s.hero) s.events.push({ k: 'up' });
    } else if (h.down <= 0) {
      h.down = 0;
      h.hp = h.maxHp;
      h.x = 4;
      h.z = 12;
      h.y = 0;
      h.vy = 0;
      h.hurtT = 9;
      if (h === s.hero) s.events.push({ k: 'up' });
    }
    return h.down <= 0;
  }
  h.hurtT += dt;
  if (h.inv > 0) h.inv -= dt;
  if (s.phase === 'wave') h.ult = Math.min(100, h.ult + BAL.ultTick * (1 + h.m.uCharge) * dt);
  const fast = h.el === 'eau';
  if (h.hurtT > (fast ? BAL.ondWait : BAL.regenWait) && h.hp < h.maxHp)
    h.hp = Math.min(h.maxHp, h.hp + (fast ? BAL.ondRegen + h.m.pA : BAL.regen) * dt);
  return true;
}
// un héros : déplacement (seulement le sien) puis tir. Les coéquipiers arrivent déjà placés par le réseau.
// LANCE-FLAMMES (V10.1, arme de Dernier Toit) : pas de balle ; à chaque tic, tout ennemi dans le cône devant (demi-angle hCone, portée 51 m × (1 + hLife)) prend les dégâts et s'enflamme. Pas de critique.
function flameShot(s, h, d, ey) {
  const m = h.m,
    R = 51 * (1 + m.hLife),
    cc = Math.cos(m.hCone || 0.38),
    dmg = BAL.gun * (1 + m.hDmg) * (1 + ARMK.deg * armL(h, 'deg')),
    el = h.wEl || h.el,
    bu = armL(h, 'brul');
  let n = 0;
  if (!s.client)
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || n >= 40) continue;
      const vx = e.x - h.x,
        vy = cyOf(e) - ey,
        vz = e.z - h.z,
        l = Math.hypot(vx, vy, vz),
        r = rOf(e);
      if (l > R + r || l < 0.05 || (l > r && (vx * d[0] + vy * d[1] + vz * d[2]) / l < cc)) continue;
      n++;
      hurtE(
        e,
        dmg *
          mult(el, e.el, e.boss, BAL.strong + s.m.strong) *
          (e.boss ? 1 + (m.hBoss || 0) : 1) *
          (h.wEl && h.wEl === h.el ? 1 + BAL.predi : 1),
        false,
        true
      );
      e.burn = Math.max(e.burn, 2.5 + (m.hBurn || 0) + (el === 'feu' ? m.eBurn || 0 : 0) + bu);
      if (bu) e.bk = Math.max(e.bk || 1, 1 + ARMK.bk * bu);
      e.mk = m.hMark || 0;
      e.mark = BAL.markT;
      if (el === 'eau' || h.el === 'eau') e.slow = Math.max(e.slow, 1.2 + (el === 'eau' ? m.eSlow || 0 : 0));
      if (el === 'bois' || h.el === 'bois') {
        e.poi = Math.max(e.poi || 0, 2.5 + (el === 'bois' ? m.ePois || 0 : 0));
        e.pk = 1 + (el === 'bois' ? m.ePoisD || 0 : 0);
      }
      if ((el === 'vent' || h.el === 'vent') && liftable(e))
        lift(e, BAL.ventLift * 0.5 + (el === 'vent' ? m.eLift || 0 : 0));
    }
  if (n && h === s.hero) h.ult = Math.min(100, h.ult + BAL.ultHit * 0.35 * (1 + m.uCharge));
  s.events.push({ k: 'flame', x: h.x, y: ey, z: h.z, dx: d[0], dy: d[1], dz: d[2], r: R, m: h === s.hero, n, el });
}
// plombs : pleins jusqu'à 6 m, puis de moins en moins, jusqu'à 30 % en bout de portée (comme dans Dernier Toit)
const fallK = b => {
  if (!b.l0) return 1;
  const R = 60 * b.l0,
    t = (b.l0 - b.life) * 60;
  return Math.max(0.3, 1 - (Math.max(0, t - 6) / Math.max(1, R - 6)) * 0.7);
};
function heroStep(s, h, inp, dt, move) {
  const m = h.m,
    fx = -Math.sin(h.yaw),
    fz = -Math.cos(h.yaw);
  if (move) {
    h.sprint = !!inp.sprint && !inp.sneak;
    const sp =
        (inp.sneak ? 4 : h.sprint ? 14.5 * (1 + m.hSprint) * (h.el === 'elec' ? BAL.voltSprint : 1) : 9) * (1 + m.hSpd),
      rx = Math.cos(h.yaw),
      rz = -Math.sin(h.yaw);
    const fl = inp.fly ? 2.2 : 1,
      fc = 1;
    const mx = (fx * inp.f * fc + rx * inp.r) * sp * fl * dt,
      mz = (fz * inp.f * fc + rz * inp.r) * sp * fl * dt,
      hit = (x, z) =>
        !inp.fly && (topAt(s, x, z) > h.y + 0.3 || (SOLID !== null && SOLID(x, z, h.y) && !SOLID(h.x, h.z, h.y)));
    if (!hit(h.x + mx, h.z + mz)) {
      h.x += mx;
      h.z += mz;
    } else if (!hit(h.x + mx, h.z)) h.x += mx;
    else if (!hit(h.x, h.z + mz)) h.z += mz; // on se cogne au mur et on glisse le long
    // 1 bloc de haut : il faut sauter. 2 blocs : en poussant contre l'obstacle, le héros s'agrippe et grimpe. 3 blocs : trop haut, il faut une marche.
    let climb = false;
    if (!inp.fly && (mx || mz)) {
      const bt = topAt(s, h.x + mx, h.z + mz),
        rise = bt - topAt(s, h.x, h.z);
      if (bt > h.y + 0.3 && rise > WALLH + 0.05 && rise <= 2 * WALLH + 0.05) {
        h.cl = (h.cl || 0) + dt;
        climb = h.cl > BAL.climbWait;
      } else h.cl = 0;
    } else h.cl = 0;
    const hr = Math.hypot(h.x, h.z),
      lim = inp.fly ? R_ISLE + 150 : R_ISLE - 3;
    if (hr > lim) {
      h.x *= lim / hr;
      h.z *= lim / hr;
    }
    if (inp.fly) {
      h.vy = 0;
      h.y = Math.max(0, Math.min(160, h.y + ((inp.up ? 1 : 0) - (inp.down ? 1 : 0)) * 16 * dt));
    } else {
      const gr = topAt(s, h.x, h.z);
      if (inp.jump && h.y <= gr + 0.01) h.vy = 9.2 * Math.sqrt(1 + m.hJump);
      if (climb) {
        h.vy = 0;
        h.y += BAL.climbSp * dt;
      } else {
        h.vy -= 22 * dt;
        h.y += h.vy * dt;
      }
      if (h.y <= gr) {
        h.y = gr;
        h.vy = 0;
      }
    } // le dessus d'un mur est un sol
    h.eye += ((inp.sneak ? 1.1 : 1.7) - h.eye) * Math.min(1, dt * 12);
  }
  h.cd -= dt;
  h.ab = Math.max(0, h.ab - dt);
  if (h.shT > 0 && (h.shT -= dt) <= 0) h.shd = 0; // le bouclier d'eau s'efface
  // V2.2 : vitesse mesurée (aussi pour un coéquipier, dont on ne reçoit que la position), temps depuis le dernier tir, durée du tir continu
  const mvd =
    Math.hypot(h.x - (h.px === undefined ? h.x : h.px), h.z - (h.pz === undefined ? h.z : h.pz)) / Math.max(dt, 1e-3);
  h.px = h.x;
  h.pz = h.z;
  h.lsT = (h.lsT || 0) + dt;
  h.ftT = inp.fire ? (h.ftT || 0) + dt : 0;
  if (h.sm > 0) h.sm = Math.max(0, h.sm - dt);
  const ey = h.y + h.eye - 0.1;
  if (inp.fire && h.cd <= 0) {
    const mit =
        h.el === 'vent' && m.voB
          ? 1 + (mvd > 3 ? BAL.mitK + m.spB1 : 0) + (m.spB2 ? BAL.mitRamp * Math.min(1, h.ftT / BAL.mitRampT) : 0)
          : 1, // Zéphyr Mitrailleur : plus vite en courant, et de plus en plus vite en tirant (spB2)
      chg = h.el === 'vent' && m.voA && m.spA2 && h.lsT >= BAL.chargeT; // Zéphyr Sniper : après une pause, le tir est chargé
    h.lsT = 0;
    h.cd = Math.max(h.cd, -dt) + (0.26 * (1 - m.hCd)) / (1 + ARMK.cad * armL(h, 'cad')) / mit; // cadence : le profil de l'arme et du lobby, puis le marchand d'armes ; le reste de l'image est gardé (audit V2.0, problème 10 : la cadence ne dépend plus des images par seconde)
    const cp = Math.cos(h.pitch),
      sy = Math.sin(h.pitch);
    let d = [fx * cp, sy, fz * cp],
      best = 0.9925;
    for (const e of s.enemies) {
      if (e.bur) continue;
      const vx = e.x - h.x,
        vy = cyOf(e) - ey,
        vz = e.z - h.z,
        l = Math.hypot(vx, vy, vz);
      if (l > 50 || l < 0.5) continue;
      const dot = (vx * fx * cp + vy * sy + vz * fz * cp) / l;
      if (dot > best) {
        best = dot;
        d = [vx / l, vy / l, vz / l];
      }
    }
    if (m.hFlame > 0) flameShot(s, h, d, ey);
    else {
      const ML = armL(h, 'multi'),
        NP = m.hPel > 0 ? Math.round(m.hPel) + ARMK.pelL * ML : 1,
        NF = m.hPel > 0 ? 0 : ML, // tirs multiples : des balles en plus, en éventail de part et d'autre (le fusil à pompe gagne des plombs)
        el = h.wEl || h.el,
        we = el, // V2.1 : la balle porte l'effet de l'élément de l'arme (avec sa branche de l'arbre « Élément des balles »)
        he = h.el, // … et celui du héros (son passif : chaîne de Volt, poison de Sylve, éclats de Braise, ralenti d'Ondine)
        has = x => we === x || he === x,
        L0 =
          0.85 * (1 + m.hLife) * (h.el === 'feu' && m.voA ? 1 + BAL.artiK : 1) +
          (h.el === 'feu' && m.voA ? m.spA1 / 60 : 0), // Braise Artilleur : plus de portée
        d0 = d,
        rl = Math.hypot(d0[0], d0[2]) || 1,
        rx = -d0[2] / rl,
        rz = d0[0] / rl,
        ux = -rz * d0[1],
        uy = rz * d0[0] - rx * d0[2],
        uz = rx * d0[1];
      // fusil à pompe : chaque plomb part dans un disque de rayon hSpread autour de la visée ; l0 garde sa portée de départ (les dégâts baissent avec la distance), q fait taire les plombs après le premier
      for (let pn = 0; pn < NP + NF; pn++) {
        if (pn >= NP) {
          const a = ARMK.multiA * (pn - NP < 1 ? 1 : -1) * (1 + Math.floor((pn - NP) / 2)),
            ca = Math.cos(a),
            sa = Math.sin(a);
          d = [d0[0] * ca - d0[2] * sa, d0[1], d0[0] * sa + d0[2] * ca];
        } else if (NP > 1) {
          const an = s.rng() * 6.2832,
            rr = m.hSpread * Math.sqrt(s.rng()),
            ca = Math.cos(an) * rr,
            sa = Math.sin(an) * rr,
            x = d0[0] + rx * ca + ux * sa,
            y = d0[1] + uy * sa,
            z = d0[2] + rz * ca + uz * sa,
            l = Math.hypot(x, y, z);
          d = [x / l, y / l, z / l];
        }
        const sh = {
          id: s.lid++,
          x: h.x + d[0],
          y: ey + d[1],
          z: h.z + d[2],
          d,
          life: L0,
          l0: NP > 1 ? L0 : 0,
          q: pn > 0 ? 1 : 0,
          el,
          dmg:
            BAL.gun *
            (1 + m.hDmg) *
            (pn >= NP ? ARMK.multiK : 1) *
            (h.wEl && h.wEl === h.el ? 1 + BAL.predi : 1) *
            (chg ? BAL.chargeK : 1), // prédilection (V2.1) : arme de l'élément du héros, +10 % ; tir chargé du Sniper (V2.2)
          left: 1 + m.hPierce + (has('vent') ? 1 + (we === 'vent' ? m.ePierce || 0 : 0) : 0), // Vent : la balle traverse un ennemi de plus (et ePierce)
          lift: has('vent') ? BAL.ventLift + (we === 'vent' ? m.eLift || 0 : 0) : 0, // Vent : soulève les petits ennemis touchés
          ox: h.x,
          oz: h.z,
          zf: h.el === 'vent' ? BAL.zephK + (h.m.pA || 0) : 0, // Zéphyr : plus de dégâts au-delà de BAL.zephFar m (passif)
          cr: BAL.crit + m.hCrit,
          ck: BAL.critK + m.hCritD,
          mk: m.hMark,
          hit: [],
          mine: h === s.hero,
          chain: has('elec') ? 1 + (he === 'elec' ? h.m.pA : 0) + (we === 'elec' ? m.eChain : 0) : 0,
          cd: 0.5 + (we === 'elec' ? m.eChainD : 0),
          pois: has('bois') ? 2.5 + (he === 'bois' ? h.m.pA : 0) + (we === 'bois' ? m.ePois : 0) : 0,
          pk: 1 + (we === 'bois' ? m.ePoisD : 0),
          fire: has('feu') ? BAL.braiseSplash + (he === 'feu' ? h.m.pA : 0) : 0,
          fr: 2.5 + (we === 'feu' ? m.eFireR : 0),
          bt: 2 + (we === 'feu' ? m.eBurn : 0),
          wet: has('eau') ? 1.2 + (we === 'eau' ? m.eSlow : 0) : 0,
          wr: we === 'eau' ? m.eWave : 0,
          kn: we === 'terre' ? m.eKnock : 0,
          ap: (we === 'terre' && m.eArm > 0) || chg,
          // V2.2, les voies : Sniper (sf, plus fort au-delà de BAL.snipFar m), Lame (iso : cible seule ; exe : achève), Escarmoucheur (esc),
          // Colosse (col : se soigne en touchant de près), Plongeur (psp : le poison passe aux voisins)
          sf: h.el === 'vent' && m.voA ? BAL.snipK + m.spA1 : 0,
          iso: h.el === 'elec' && m.voA ? BAL.lameK + m.spA1 : 0,
          exe: h.el === 'elec' && m.voA && m.spA2 ? 1 : 0,
          esc: h.el === 'elec' && m.voB ? BAL.escK + m.spB1 : 0,
          col: h.el === 'bois' && m.voA && m.spA2 ? 1 : 0,
          psp: h.el === 'bois' && m.voB && m.spB2 ? 1 : 0,
          bb: m.hBoss
        };
        s.shots.push(armShot(h, sh, pn > 0));
      }
    }
  }
} // l'élément de l'arme et celui du héros donnent leur effet aux balles ; seule la branche de l'élément de l'arme compte dans l'arbre « Élément des balles »
