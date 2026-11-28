// [regles/bots.js] Les bots joueurs — le chef de chantier, et ce que fait un bot à chaque instant (botTick).
// le chef de chantier : répartit les chemins entre les bots, puis donne à chaque bot libre son prochain chantier (l'or déjà promis à un chantier est mis de côté)
function botPlan(s, dt) {
  s.botT = (s.botT || 0) - dt;
  if (s.botT > 0 || s.over) return;
  s.botT = s.phase === 'prep' ? 0.4 : 1;
  const bots = botList(s);
  bots.forEach((o, k) => {
    const B = o.bot;
    if (B.lane === undefined) B.lane = k % 3;
    if (bots.length < 3 && s.phase === 'prep' && B.lw !== s.wave) {
      B.lw = s.wave;
      const used = bots.filter(q => q !== o).map(q => q.bot.lane);
      let bl = B.lane,
        bw = laneThreat(s, B.lane).w * 1.5 + 0.01;
      for (let L = 0; L < 3; L++)
        if (!used.includes(L)) {
          const w = laneThreat(s, L).w;
          if (w > bw) {
            bw = w;
            bl = L;
          }
        }
      B.lane = bl;
    }
  });
  if (s.botBuild === false) return;
  const jobs = () => bots.map(o => o.bot.job).filter(Boolean),
    taken = (x, z) => jobs().some(j => Math.hypot(j.x - x, j.z - z) < 4.5);
  const guardedL = bots.map(q => q.bot.lane),
    laneLv = L => {
      const Z = botLaneInfo(s, L);
      return s.towers.reduce(
        (a, t) =>
          a + (t.tmpT === undefined && Math.hypot(t.x - Z.x - Z.tx * 4, t.z - Z.z - Z.tz * 4) < 21 ? t.els.length : 0),
        0
      );
    };
  for (const o of bots) {
    if (o.bot.job || o.down > 0) continue;
    const avail = (s.mode === 'normal' ? s.pot : s.gold) - jobs().reduce((a, j) => a + j.c, 0); // en mode normal les bots bâtissent avec le pot, plus avec l'or du joueur

    // son chemin d'abord ; mais tant qu'il reste des chemins sans gardien, il s'occupe de celui qui est le plus menacé par rapport à ce qui le défend déjà
    let WL = o.bot.lane,
      ws = -1;
    for (let L = 0; L < 3; L++) {
      if (L !== o.bot.lane && guardedL.includes(L)) continue;
      const sc = ((laneThreat(s, L).w + 2) / (1 + laneLv(L))) * (L === o.bot.lane ? 1.3 : 1);
      if (sc > ws) {
        ws = sc;
        WL = L;
      }
    }
    let J = botJob(s, o, WL, avail, taken);
    if (!J && WL !== o.bot.lane) J = botJob(s, o, o.bot.lane, avail, taken);
    if (!J) {
      const guarded = bots.map(q => q.bot.lane),
        others = [0, 1, 2]
          .filter(L => L !== o.bot.lane)
          .sort(
            (a, b) =>
              (guarded.includes(a) ? 1 : 0) - (guarded.includes(b) ? 1 : 0) || laneThreat(s, b).w - laneThreat(s, a).w
          ); // son chemin est à jour : il aide d'abord les chemins sans gardien
      for (const L of others) {
        J = botJob(s, o, L, avail, taken);
        if (J) break;
      }
    }
    if (!J && s.wave >= 3) {
      const pc = placeCost(s, 'mortier'),
        ring = s.towers.filter(t => t.tmpT === undefined && Math.hypot(t.x, t.z) < 26).length;
      if (avail >= pc && ring < 1 + Math.floor(s.wave / 3))
        for (let k = 0; k < 8 && !J; k++) {
          const a = k * 0.785 + s.wave * 0.37,
            x = Math.cos(a) * 18,
            z = Math.sin(a) * 18;
          if (!canPlace(s, x, z) && !taken(x, z))
            J = {
              k: 'pl',
              ty: 'mortier',
              x,
              z,
              el: o.bot.el0 || 'feu',
              c: pc,
              say: 'un Mortier près du cœur, pour ceux qui passent à travers champs'
            };
        }
    }
    if (J && !J.wait) {
      J.t = 40;
      o.bot.job = J;
      o.bot.alt = !o.bot.alt; // un chantier sur deux : terrassement d'abord (botJob)
    }
  }
  s.potHold = s.mode === 'normal' ? jobs().reduce((a, j) => a + j.c, 0) : 0; // le pot promis aux chantiers des bots : le mode auto ne le dépense pas (auto.js)
}
// ce que fait un bot à cet instant : il remplit o.inp (avancer, tirer, sauter) et tourne la tête ; heroStep fait le reste
function botThink(s, o, dt) {
  const B = o.bot,
    I = o.inp,
    en = s.enemies,
    hs = botHeroes(s),
    low = o.hp < o.maxHp * 0.38,
    L = B.lane || 0;
  I.f = 0;
  I.r = 0;
  I.fire = false;
  I.sprint = false;
  I.jump = false;
  let goal = null,
    near = 1e9,
    nearE = null;
  for (const e of en) {
    if (e.hp <= 0 || e.bur || e.k === 'air') continue;
    const d = Math.hypot(e.x - o.x, e.z - o.z);
    if (d < near) {
      near = d;
      nearE = e;
    }
  }
  const busy = K =>
      s.queue.some(q => q.path === K) ||
      en.some(e => e.path === K && e.hp > 0) ||
      (s.phase === 'prep' && (s.next || []).some(g => g.path === K || g.path < 0)),
    quiet = (s.bcfg || BOTCFG).help !== false && !busy(L); // son chemin est calme : il part aider les autres
  // sa cible : d'abord un ennemi de sa zone de tir qui n'est pas encore marqué (le plus solide), sinon le plus avancé vers le cœur à portée
  B.t -= dt;
  if (B.t <= 0 || !B.tg || B.tg.hp <= 0 || B.tg.bur || s.enemies.indexOf(B.tg) < 0) {
    B.t = 0.3;
    let best = null,
      bs = -1e9;
    const mates = [];
    for (const q of botList(s)) if (q !== o && q.bot.tg) mates.push(q.bot.tg);
    for (const e of en) {
      if (e.hp <= 0 || e.bur || (e.k === 'ste' && !(e.rev > 0))) continue;
      const d = Math.hypot(e.x - o.x, e.z - o.z);
      if (d > (e.path === L || quiet ? 150 : 80)) continue;
      const EZ = botLaneInfo(s, e.path),
        EO = opOf(s, e.path),
        zone =
          Math.hypot(e.x - EZ.x - EZ.tx * 6, e.z - EZ.z - EZ.tz * 6) < 20 ||
          (!!EO && (s.bcfg || BOTCFG).outMark && Math.hypot(e.x - EO.C[0], e.z - EO.C[1]) < 15 && opBuilt(s, EO));
      const sc =
        -e.rem * 0.9 -
        d * 1.1 +
        (zone && !(e.mark > 1) ? 9 : 0) +
        (e.path === L ? 5 : 0) +
        (e.bomb ? 80 : 0) +
        (BEATS[o.el] === e.el ? 10 : 0) +
        (e.boss ? 15 : 0) +
        (e === B.tg ? 6 : 0) -
        mates.filter(q => q === e).length * (e.boss ? 0 : 14);
      if (sc > bs) {
        bs = sc;
        best = e;
      }
    }
    B.tg = best;
  }
  const tg = B.tg,
    first = (x, z) => {
      const me = Math.hypot(x - o.x, z - o.z);
      return !botList(s).some(h => h !== o && !(h.down > 0) && Math.hypot(x - h.x, z - h.z) < me - 0.01);
    };
  // 1) un coéquipier à terre : le bot le plus proche va le relever
  const dn = hs.find(h => h !== o && h.down > 0);
  if (dn && !low && first(dn.x, dn.z)) goal = [dn.x, dn.z, 1.5, 1];
  // 2) l'objectif de la vague : tenir la zone, ou rapporter la relique au cœur
  const ob = s.obj;
  if (!goal && ob && ob.k !== 'bomb' && !low) {
    if (ob.k === 'zone') {
      if (first(ob.x, ob.z)) goal = [ob.x, ob.z, 2, 1];
    } else if (ob.car === B.key) goal = [0, 0, 5, 1];
    else if (!ob.car && first(ob.x, ob.z)) goal = [ob.x, ob.z, 0.8, 1];
  }
  // 2 bis) un bonus traîne au sol : il le laisse d'abord au joueur, puis va le chercher s'il est le mieux placé (un bonus profite à toute l'équipe)
  if (!goal && !low && s.pups.length) {
    let bp = null,
      bd = 60;
    for (const p of s.pups) {
      const d = Math.hypot(p.x - o.x, p.z - o.z),
        dj = s.hero.down > 0 ? 1e9 : Math.hypot(p.x - s.hero.x, p.z - s.hero.z);
      if (d < bd && (p.t < BAL.pupLife - 9 || dj > 45) && d < dj + 25 && first(p.x, p.z)) {
        bd = d;
        bp = p;
      }
    }
    if (bp) {
      goal = [bp.x, bp.z, 1, 1];
      if (!B.toldP) {
        B.toldP = 1;
        botSay(s, o, "je ramasse le bonus : il profite à toute l'équipe");
      }
    }
  }
  // 3) son chantier passe avant le tir : il y court, puis pose, améliore, monte le mur ou creuse sur place
  if (!goal && B.job) {
    const j = B.job;
    j.t -= dt;
    if (j.t <= 0) {
      B.job = null;
      if (j.op && ++j.op.fail > 8) j.op.dead = true;
    } else if (Math.hypot(j.x - o.x, j.z - o.z) < (j.op ? 11 : 8.5)) {
      let ok = false;
      const pay = fn => (s.mode === 'normal' ? potDo(s, fn) : fn());
      const g0 = s.mode === 'normal' ? s.pot : s.gold;
      if (j.k === 'pl') ok = pay(() => place(s, j.ty, j.x, j.z, j.el));
      else if (j.k === 'up') ok = pay(() => upgrade(s, j.id, j.el));
      else if (j.k === 'wl') {
        ok = pay(() => addWalls(s, j.a[0], j.a[1], j.b[0], j.b[1]));
        const w = ok ? '' : checkWalls(s, j.a[0], j.a[1], j.b[0], j.b[1]).why;
        if (w && !j.op && !j.arc && !/ennemi|Enfermerait/.test(w))
          botLaneInfo(s, j.L === undefined ? L : j.L).noW[j.sd] = 1;
      } else if (j.k === 'dg') {
        ok = pay(() => dig(s, j.a[0], j.a[1], j.b[0], j.b[1]));
        const w = ok ? '' : checkDig(s, j.a[0], j.a[1], j.b[0], j.b[1]).why;
        if (w && !j.op && !j.row && !/ennemi|Enfermerait/.test(w))
          botLaneInfo(s, j.L === undefined ? L : j.L).noD = true;
      } // V2.0 : un chantier raté faute d'or (l'or promis dépensé ailleurs entre-temps) n'est plus rayé pour toujours : seul un refus du terrain l'est
      if (!ok && j.op && ++j.op.fail > 8) j.op.dead = true;
      if (ok) {
        const spent = g0 - (s.mode === 'normal' ? s.pot : s.gold),
          tr = j.k === 'wl' || j.k === 'dg',
          back = tr ? Math.round(spent * BOTT.rab) : 0; // V2.0 : un bot qui terrasse ne paie que les matériaux
        if (s.mode === 'normal') s.pot += back;
        else s.gold += back;
        s.bspend = s.bspend || { t: 0, d: 0 };
        s.bspend[tr ? 't' : 'd'] += spent - back;
      }
      if (ok && j.say) botSay(s, o, j.say);
      B.job = null;
    } else if (
      s.phase === 'prep' ||
      near > 9 ||
      !tg ||
      (j.op && !en.some(e => e.hp > 0 && !e.bur && e.k !== 'air' && Math.hypot(e.x - j.x, e.z - j.z) < 8))
    )
      goal = [j.x, j.z, j.op ? 8 : 6.5, 1];
  }
  // 4) le combat : viser, tirer pour marquer, tenir sa zone de tir (ou barrer la route à ce qui file vers le cœur)
  const fx = -Math.sin(o.yaw),
    fz = -Math.cos(o.yaw),
    cnt = (x, z, r) => {
      let n = 0;
      for (const e of en)
        if (e.hp > 0 && !e.bur && e.k !== 'air' && Math.hypot(e.x - x, e.z - z) < r) n += e.boss ? 3 : 1;
      return n;
    };
  if (tg) {
    const dx = tg.x - o.x,
      dz = tg.z - o.z,
      d = Math.hypot(dx, dz) || 1,
      ya = Math.atan2(-dx, -dz) - o.yaw,
      da = Math.atan2(Math.sin(ya), Math.cos(ya));
    o.yaw += da * Math.min(1, dt * 14);
    o.pitch = Math.atan2(cyOf(tg) - (o.y + o.eye - 0.1), d);
    I.fire = d < 48 && Math.abs(da) < 0.25;
    if (I.fire && s.towers.length && s.phase === 'wave' && !B.told) {
      B.told = 1;
      botSay(s, o, 'je tire sur les ennemis pour les marquer : nos défenses leur font plus mal');
    }
    if (o.ab <= 0 && s.phase === 'wave') {
      let use = false;
      if (o.el === 'feu') use = cnt(o.x + fx * 10, o.z + fz * 10, BAL.fbR) >= 3;
      else if (o.el === 'bois') use = cnt(o.x + fx * 8, o.z + fz * 8, BAL.ronceR) >= 3;
      else if (o.el === 'elec') {
        let n = 0;
        for (const e of en) {
          if (e.hp <= 0 || e.bur || e.k === 'air') continue;
          const ax = e.x - o.x,
            az = e.z - o.z,
            u = ax * fx + az * fz;
          if (u > 1 && u < BAL.dashLen && Math.abs(ax * fz - az * fx) < 2.6) n += e.boss ? 3 : 1;
        }
        use = n >= 3 && !low && !goal;
      } else if (o.el === 'eau')
        use =
          o.hp < o.maxHp * 0.6 ||
          hs.some(
            h => h !== o && !(h.down > 0) && h.hp < h.maxHp * 0.5 && Math.hypot(h.x - o.x, h.z - o.z) < BAL.tideR
          ) ||
          cnt(o.x, o.z, BAL.tideR) >= 4;
      else if (o.el === 'vent')
        use = cnt(o.x, o.z, 5) >= 2 && !goal; // Zéphyr : le Bond l'éloigne des ennemis trop proches
      else use = false; // Roc garde son Rempart : un mur de plus au mauvais endroit gênerait la zone de tir
      if (use && ability(s, o) && o.el === 'eau')
        for (const h of hs)
          if (!(h.down > 0) && Math.hypot(h.x - o.x, h.z - o.z) < BAL.tideR)
            h.hp = Math.min(h.maxHp, h.hp + BAL.tideHeal + (o.m.kHeal || 0));
    }
  } // la Répulsion d'un bot soigne tous les héros autour de lui
  if (o.ult >= 100 && s.phase === 'wave' && ULT[o.el]) {
    const N = en.filter(e => e.hp > 0).length,
      boss = en.some(e => e.boss && e.hp > 0);
    const go =
      o.el === 'terre'
        ? cnt(o.x, o.z, BAL.quakeR) >= 5
        : o.el === 'elec'
          ? cnt(o.x, o.z, BAL.stormR) >= 5
          : o.el === 'eau'
            ? N >= 10 || boss || s.core < s.coreMax * 0.4
            : o.el === 'vent'
              ? botLine(en, o, fx, fz) >= 4 || boss // Zéphyr : le Tir perçant quand au moins 4 ennemis sont sur sa ligne de visée
              : N >= 8 || boss;
    if (go) {
      o.ult = 0;
      ULT[o.el](s, o);
      if (o.el === 'eau')
        for (const h of hs) {
          if (h.down > 0) {
            h.down = 0;
            h.rev = 0;
          }
          h.hp = h.maxHp;
        }
    }
  }
  if (!goal && tg && s.phase === 'wave') {
    const guarded = tg.path !== L && !quiet && botList(s).some(q => q !== o && q.bot.lane === tg.path && !(q.down > 0));
    if (!guarded) {
      const l = Math.hypot(tg.x, tg.z) || 1,
        R0 = tg.boss ? rOf(tg) + 11 : tg.k === 'rng' ? 14 : tg.k === 'air' ? 11 : 12.5;
      let gx = tg.x - (tg.x / l) * R0 + (tg.z / l) * B.side * 3,
        gz = tg.z - (tg.z / l) * R0 - (tg.x / l) * B.side * 3;
      const gr = Math.hypot(gx, gz),
        mx = tg.path === L ? Math.min(R_ISLE - 9, 24 + (s.bcfg || BOTCFG).adv) : R_ISLE - 9;
      if (gr > mx) {
        gx *= mx / gr;
        gz *= mx / gr;
      }
      goal = [gx, gz, 1.5, 0];
    }
  }
  if (!goal) {
    let lk = null;
    for (const e of en) if (e.hp > 0 && !e.bur && e.rem < 34 && (!lk || e.rem < lk.rem)) lk = e; // un ennemi file vers le cœur : le bot le plus proche lui barre la route
    if (lk && first(lk.x, lk.z)) {
      const l = Math.hypot(lk.x, lk.z) || 1,
        R0 = lk.boss ? rOf(lk) + 10 : 11;
      goal = [lk.x - (lk.x / l) * Math.min(R0, l * 0.8), lk.z - (lk.z / l) * Math.min(R0, l * 0.8), 1.5, 0];
    }
  }
  if (!goal) {
    let PL = L;
    if (quiet) {
      let bn = 0;
      for (let K = 0; K < 3; K++) {
        const n = en.filter(e => e.path === K && e.hp > 0).length + s.queue.filter(q => q.path === K).length;
        if (n > bn) {
          bn = n;
          PL = K;
        }
      }
    } // son chemin est calme : il va prêter main-forte au plus chargé
    const P = botLaneInfo(s, PL),
      k = PL === L ? 12 : 17,
      PO = opOf(s, PL);
    goal =
      PO && (s.bcfg || BOTCFG).outPost && opBuilt(s, PO) && s.phase === 'wave'
        ? [PO.Q[0] + PO.t[0] * 15 + PO.n[0] * B.side * 5, PO.Q[1] + PO.t[1] * 15 + PO.n[1] * B.side * 5, 2, 0]
        : [P.x + P.tx * k + P.nx * B.side * 4, P.z + P.tz * k + P.nz * B.side * 4, 2, 0];
  } // son avant-poste est bâti : il se poste à la sortie du couloir
  // trop près d'un ennemi au sol, ou blessé : il recule (sauf s'il relève quelqu'un)
  if (nearE && (near < 5.5 || (low && near < 18)) && !(goal && goal[3] && dn)) {
    const ax = (o.x - nearE.x) / (near || 1),
      az = (o.z - nearE.z) / (near || 1);
    goal = [o.x + ax * 9 - az * B.side * 3 - o.x * 0.04, o.z + az * 9 + ax * B.side * 3 - o.z * 0.04, 1, 0];
  }
  const wx = goal[0] - o.x,
    wz = goal[1] - o.z,
    w = Math.hypot(wx, wz);
  if (w > goal[2]) {
    let ux = wx / w,
      uz = wz / w;
    if (!tg) {
      const ya = Math.atan2(-ux, -uz) - o.yaw;
      o.yaw += Math.atan2(Math.sin(ya), Math.cos(ya)) * Math.min(1, dt * 8);
      o.pitch *= 0.9;
    }
    const rise = (vx, vz) => topAt(s, o.x + vx * 2.2, o.z + vz * 2.2) - o.y,
      r0 = rise(ux, uz),
      inS = SOLID !== null && SOLID(o.x, o.z, o.y),
      sol = (vx, vz) =>
        SOLID !== null &&
        !inS &&
        (SOLID(o.x + vx * 1.3, o.z + vz * 1.3, o.y) || SOLID(o.x + vx * 2.6, o.z + vz * 2.6, o.y)),
      bad = (vx, vz) => rise(vx, vz) > 2 * WALLH + 0.05 || sol(vx, vz);
    if (bad(ux, uz)) {
      let done = false;
      for (const an of [0.7, -0.7, 1.3, -1.3, 1.9, -1.9]) {
        const c = Math.cos(an * B.side),
          sn = Math.sin(an * B.side),
          vx = ux * c - uz * sn,
          vz = ux * sn + uz * c;
        if (!bad(vx, vz)) {
          ux = vx;
          uz = vz;
          done = true;
          break;
        }
      }
      if (!done) I.jump = true;
    } else if (r0 > 0.3 && r0 <= WALLH + 0.05) I.jump = true; // arbre, rocher, mur trop haut : il contourne par le premier côté libre   // mur trop haut : de biais ; un bloc : il saute ; deux blocs : il pousse et grimpe
    B.st += dt;
    if (B.st > 0.8) {
      if (Math.hypot(o.x - B.px, o.z - B.pz) < 0.6) {
        B.side = -B.side;
        B.av = 1;
        I.jump = true;
      }
      B.px = o.x;
      B.pz = o.z;
      B.st = 0;
    }
    if (B.av > 0) {
      B.av -= dt;
      const px = -uz * B.side,
        pz = ux * B.side;
      ux = ux * 0.4 + px;
      uz = uz * 0.4 + pz;
      const l = Math.hypot(ux, uz) || 1;
      ux /= l;
      uz /= l;
    } // coincé : il part de côté
    const f2 = -Math.sin(o.yaw),
      z2 = -Math.cos(o.yaw);
    I.f = ux * f2 + uz * z2;
    I.r = ux * Math.cos(o.yaw) - uz * Math.sin(o.yaw);
    I.sprint = w > 14 && !(tg && near < 9 && !goal[3]);
  } else {
    B.st = 0;
    B.px = o.x;
    B.pz = o.z;
  }
}
// le nombre d'ennemis sur la ligne de visée d'un bot (pour le Tir perçant de Zéphyr), les boss comptent triple
function botLine(en, o, fx, fz) {
  let n = 0;
  for (const e of en) {
    if (e.hp <= 0 || e.bur) continue;
    const ax = e.x - o.x,
      az = e.z - o.z,
      u = ax * fx + az * fz;
    if (u > 1 && u < BAL.perceLen && Math.abs(ax * fz - az * fx) < BAL.perceR + 1.5) n += e.boss ? 3 : 1;
  }
  return n;
}
function botTick(s, dt) {
  if (s.client) return;
  const L = botList(s);
  if (!L.length) return;
  if (s.botBuild !== false && (s.bcfg || BOTCFG).out) opSearch(s);
  botPlan(s, dt);
  for (const o of L) {
    if (o.hired && o.down > 0) {
      delete s.others[o.bot.key];
      s.events.push({ k: 'hireDead', el: o.el, x: o.x, z: o.z });
      continue;
    } // un esclave à terre est perdu
    if (heroLife(s, o, dt)) {
      botThink(s, o, dt);
      heroStep(s, o, o.inp, dt, true);
    } else {
      o.inp.fire = false;
      o.bot.tg = null;
    }
  }
}
