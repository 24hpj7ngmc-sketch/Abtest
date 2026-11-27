// [regles/boucle.js] step() : un pas de la partie (vague, ennemis, défenses, effets, bonus, fin). C'est le cœur des règles.
function step(s, dt, inp) {
  if (s.over) return;
  s.t += dt;
  pupStep(s, dt);
  const h0 = s.hero;
  if (heroLife(s, h0, dt)) heroStep(s, h0, inp, dt, true);
  autoDef(s, dt);
  if (s.tmp.length && !s.client) {
    let ch = false;
    for (const w of s.tmp) {
      w.t -= dt;
      if (w.t <= 0) {
        ch = true;
        s.tmpSet[w.i] = 0;
        if (s.wallSet[w.i]) {
          s.wallSet[w.i] = 0;
          const k = s.walls.indexOf(w.i);
          if (k >= 0) s.walls.splice(k, 1);
        }
      }
    }
    if (ch) {
      s.tmp = s.tmp.filter(w => w.t > 0);
      refield(s);
    }
  } // les remparts s'effacent
  if (!s.client && s.towers.some(t => t.hp <= 0)) {
    for (const t of s.towers) if (t.hp <= 0) ruinOf(s, t);
    s.towers = s.towers.filter(t => !(t.hp <= 0));
  } // une défense de renfort détruite laisse une ruine à sa place
  const SG = s.client ? [] : s.towers.filter(t => t.hp !== undefined);
  for (const t of SG) t.sgN = 0; // les défenses de renfort, seules à pouvoir être attaquées
  if (!s.client && s.towers.some(t => t.tmpT !== undefined)) {
    for (const t of s.towers) if (t.tmpT !== undefined) t.tmpT -= dt;
    s.towers = s.towers.filter(t => !(t.tmpT <= 0));
  } // les Gardiens se fanent
  if (s.flood > 0 && !s.client) s.flood -= dt;
  if (s.rain.length && !s.client) {
    for (const r of s.rain) {
      r.t -= dt;
      if (r.t > 0) continue;
      r.t = 0.45;
      r.n--;
      let tg = null;
      for (const e of s.enemies) if (e.hp > 0 && !e.bur && (!tg || e.rem < tg.rem)) tg = e;
      if (!tg) continue;
      const d = BAL.metDmg * (1 + 0.08 * (lvl(s, s.wave) - 1)),
        x = tg.x,
        z = tg.z;
      const hit = [];
      for (const e of s.enemies)
        if (e.hp > 0 && !e.bur && Math.hypot(e.x - x, e.z - z) < (r.r || BAL.metR) + (e.boss ? 1.5 : 0)) {
          hurtE(e, d * mult('feu', e.el, e.boss, BAL.strong + s.m.strong), false, true);
          e.burn = Math.max(e.burn, 3);
          hit.push(e);
        }
      if (r.tn) tintUlt(s, null, hit, x, z, -1, r.tn); // ultime teinté (V2.2)
      if (r.fz) {
        zoneAdd(s, x, z, (r.r || BAL.metR) * 0.6, 'feu', r.fz); // Artilleur (spA2) : le météore laisse des flammes
        for (const q of s.zones) if (q.el === 'feu' && Math.hypot(q.x - x, q.z - z) < 1.6) q.hero = 1;
      }
      s.events.push({ k: 'meteor', x, z, r: r.r || BAL.metR, tn: r.tn || '' });
    }
    s.rain = s.rain.filter(r => r.n > 0);
  }
  if (s.storms.length && !s.client) {
    for (const st of s.storms) {
      st.t -= dt;
      st.zap -= dt;
      if (st.zap > 0) continue;
      st.zap = 0.4;
      const c = s.enemies.filter(e => e.hp > 0 && !e.bur && Math.hypot(e.x - st.x, e.z - st.z) < (st.r || BAL.stormR));
      for (let i = 0; i < 3 && c.length; i++) {
        const e = c.splice(Math.floor(s.rng() * c.length), 1)[0];
        hurtE(
          e,
          BAL.stormDmg * (1 + 0.08 * (lvl(s, s.wave) - 1)) * mult('elec', e.el, e.boss, BAL.strong + s.m.strong),
          false,
          true
        );
        s.events.push({ k: 'bolt2', x: e.x, z: e.z, tn: st.tn || '' });
        if (st.tn) tintUlt(s, null, [e], 0, 0, -1, st.tn); // ultime teinté (V2.2)
      }
    }
    s.storms = s.storms.filter(st => st.t > 0);
  }
  if (s.pend.length) {
    for (const p of s.pend) {
      for (const o of s.enemies)
        if (o.hp > 0 && o.k !== 'air' && Math.hypot(o.x - p.x, o.z - p.z) < p.r) hurtE(o, p.d, true, true);
      s.events.push({ k: 'boom', x: p.x, z: p.z, r: p.r, el: 'feu' });
    }
    s.pend.length = 0;
  }
  for (const k in s.others) {
    const o = s.others[k];
    if (!o.bot) heroStep(s, o, o.inp, dt, false);
  }
  auraStep(s, dt);
  botTick(s, dt);
  // apparitions (V2.0) : chacun surgit de la mer face à sa plage, n'importe où sur la côte, et gagne la terre à gué
  while (!s.client && s.queue.length && s.queue[0].t <= s.t) {
    const q = s.queue.shift(),
      n = lvl(s, s.wave);
    const K = KINDS[q.k] || KINDS.b,
      B = bal(s),
      bt = q.boss ? q.bt || 1 : 0,
      hp = enemyHp(B, n, q.k, q.boss, s.players) * (bt ? B.bossT[bt - 1] : 1) * (q.bomb ? BAL.bombHp : 1) * (s.ck || 1);
    const id = s.nid++,
      horde = !q.boss && !q.bomb,
      fm0 = fmOf(q.boss ? 'b' : q.k),
      ok0 = horde ? 1.2 : 0.7,
      a0 = Number.isFinite(q.a) ? q.a : PATHA[q.path || 0] + offOf(id) * 0.3,
      L = landAt(s, a0),
      sect = sectOf(L[2]),
      ux = Math.cos(L[2]),
      uz = Math.sin(L[2]),
      la = offOf(id * 5 + 2) * 2.5,
      sx = L[0] + ux * VAGUES.seaD - uz * la,
      sz = L[1] + uz * VAGUES.seaD + ux * la,
      tk = fm0 ? null : lineTrack([L[0] - uz * offOf(id) * 2, L[1] + ux * offOf(id) * 2]);
    s.enemies.push({
      id,
      el: q.el,
      path: sect,
      d: 0,
      hp,
      max: hp,
      sp: bt ? BSP[bt] : q.bomb ? 4 : K.sp,
      bomb: !!q.bomb,
      bt,
      el0: q.el,
      ph: 0,
      sum: 6,
      stomp: 8,
      k: q.boss ? 'b' : KINDS[q.k] ? q.k : 'b',
      arm: !q.boss && q.k === 'tank' ? B.armor0 + B.armorG * n : 0,
      rev: 0,
      atk: 0,
      bur: false,
      ang: Math.atan2(-ux, -uz),
      boss: q.boss,
      off: tk ? 0 : offOf(id) * (horde && q.k === 'air' ? 3 : 1),
      slow: 0,
      burn: 0,
      stun: 0,
      x: sx,
      z: sz,
      sea: fm0 ? [L[0], L[1]] : [tk.pts[0][0], tk.pts[0][1]],
      tk,
      fm: fm0,
      fk: horde && fm0 ? wayOf(id, s.wave) : 0,
      sb: null,
      wp: null,
      wl: 0,
      tc: null,
      ox: offOf(id) * ok0,
      oz: offOf(id * 3 + 1) * ok0,
      dx: -ux,
      dz: -uz,
      gy: q.k === 'air' && !q.boss ? 0 : seaY(sx, sz, null),
      rem: Math.hypot(sx, sz)
    });
    if (q.bomb && s.obj && s.obj.k === 'bomb') s.obj.id = id;
  }
  // cornes de brume (une seconde avant chaque meute) et canons des navires
  if (!s.client) {
    while (s.horns && s.horns.length && s.horns[0].t <= s.t) {
      const h = s.horns.shift();
      s.events.push({ k: 'horn', x: h.x, z: h.z });
    }
    cannons(s, dt);
  }
  // ennemis
  if (!s.client) fieldsOf(s);
  const HS = s.client ? null : botHeroes(s), // la liste des héros debout ou non, faite une fois par pas (elle l'était pour chaque ennemi)
    AH = s.client ? null : HS.concat(Object.values(s.others).filter(o => !o.bot)); // … et tous les héros, coéquipiers compris (V2.2 : les assassins les chassent)
  for (const e of s.enemies) {
    const p = e.tk || PATHS[e.path];
    if (CAMPT[e.k] && e.hp > 0 && !e.sea && !s.client) CAMPT[e.k](s, e, dt);
    if (e.burn > 0) {
      e.burn -= dt;
      e.hp -= 6 * (e.bk || 1) * dt;
    } else e.bk = 1;
    if (e.wbT > 0) {
      e.wbT -= dt;
      e.hp -= e.wbD * dt;
    } else e.wbD = 0; // la brûlure des armes du marchand (regles/armes.js)
    if (e.poi > 0) {
      e.poi -= dt;
      e.hp -= 4 * (e.pk || 1) * dt;
    } else e.pk = 1;
    if (e.kb > 0) e.kb -= dt;
    if (e.rev > 0) e.rev -= dt;
    if (e.mark > 0) e.mark -= dt;
    const hold = e.k === 'rng' && Math.hypot(e.x, e.z) <= 16; // le tireur s'arrête à portée du cœur et le bombarde
    if (s.flood > 0 && e.k !== 'air') {
      e.slow = Math.max(e.slow, 0.25);
      if (!s.client) e.hp -= BAL.floodDps * (1 + 0.08 * (lvl(s, s.wave) - 1)) * mult('eau', e.el, e.boss) * dt;
    } // Déluge
    let sg = null;
    if (SG.length && e.hp > 0 && !e.sea && !e.bur && e.k !== 'air' && e.k !== 'gra')
      for (const t of SG)
        if (t.hp > 0 && t.sgN < SIEGEN && Math.hypot(t.x - e.x, t.z - e.z) < SIEGER + (e.boss ? 1.5 : 0)) {
          sg = t;
          t.sgN++;
          break;
        }
    if (sg && !(e.stun > 0)) {
      sg.hp -= SIEGED * (e.boss ? 4 : 1) * dt;
      e.ang = Math.atan2(sg.x - e.x, sg.z - e.z);
    } // il s'arrête et frappe la défense de renfort
    if (e.imm > 0) e.imm -= dt;
    let mv = 0;
    if (e.lift > 0) e.lift -= dt; // soulevé par le Vent (il est aussi étourdi le même temps : lift() le fait)
    if (e.stun > 0) e.stun -= dt;
    else if (!hold && !sg) mv = e.sp * (e.slow > 0 ? 0.6 : 1) * dt;
    if (e.slow > 0) e.slow -= dt;
    if (hold && e.hp > 0 && !(e.stun > 0)) {
      e.atk = (e.atk || 0) + dt;
      if (e.atk >= 5) {
        e.atk = 0;
        if (!s.god && !s.client) s.core -= 1;
        s.events.push({ k: 'bolt', x: e.x, z: e.z, el: e.el });
      }
    }
    if (!e.sea && e.fm && !s.client && !WALK[cellOf(e.x, e.z)]) {
      const L = landAt(s, Math.atan2(e.z, e.x));
      e.sea = [L[0], L[1]];
    } // filet de sécurité : un ennemi au sol hors de l'île regagne la plage la plus proche
    else if (!e.sea && e.fm && !s.client && s.field[cellOf(e.x, e.z)] >= 1e8 && Math.hypot(e.x, e.z) > R_ISLE - 14) {
      const a = Math.atan2(e.z, e.x),
        L = landAt(s, a);
      e.x = Math.cos(a) * (R_ISLE + 4);
      e.z = Math.sin(a) * (R_ISLE + 4);
      e.sea = [L[0], L[1]];
    } // autre filet (audit V2.0, problème 4) : sur une plage coupée du cœur, il repart à l'eau vers une plage ouverte
    if (e.sea) {
      const dx = e.sea[0] - e.x,
        dz = e.sea[1] - e.z,
        l = Math.hypot(dx, dz),
        m = mv * BAL.seaK;
      if (l <= m + 0.3) {
        if (e.fm) {
          e.x = e.sea[0];
          e.z = e.sea[1];
        }
        e.sea = null;
        e.tc = null;
      } else {
        e.x += (dx / l) * m;
        e.z += (dz / l) * m;
        e.dx = dx / l;
        e.dz = dz / l;
        e.rem = Math.hypot(e.x, e.z);
      }
      e.gy = e.k === 'air' ? 0 : seaY(e.x, e.z, null);
    } // débarquement
    else if (e.fm) {
      const pd = s.pit[cellOf(e.x, e.z)];
      e.gy = Math.hypot(e.x, e.z) > R_ISLE - 5 ? seaY(e.x, e.z, null) : -pd * WALLH;
      if (mv > 0) {
        const m2 = mv * BAL.fmK * (1 - BAL.pitSlow * pd),
          ch = AH && !e.boss && ASSN[e.k] ? assTarget(s, e, AH, dt) : null;
        if (!(ch && chaseMove(s, e, ch, m2 * BAL.assSp))) {
          if (e.wp) wpMove(s, e, m2);
          else fieldMove(s, e, m2);
        }
      }
      const r = ((s.fA && s.fA[e.fk || 0]) || s.field)[cellOf(e.x, e.z)];
      if (r < 1e8) e.rem = r;
    } // au sol : suit le terrain, contourne les murs
    else if (s.client && !e.tk) {
      e.d += mv;
      const r = Math.hypot(e.x, e.z) || 1;
      if (r > 1) {
        e.x -= (e.x / r) * mv;
        e.z -= (e.z / r) * mv;
      }
      e.dx = -e.x / r;
      e.dz = -e.z / r;
      e.rem = r;
    } // chez l'invité : il file droit sur le cœur entre deux nouvelles de l'hôte
    else {
      e.d += mv;
      const q = posAt(p, e.d);
      e.x = q[0] - q[3] * e.off;
      e.z = q[1] + q[2] * e.off;
      e.dx = q[2];
      e.dz = q[3];
      e.rem = p.len - e.d;
    } // aérien ou foreur : en ligne droite de sa plage au cœur (V2.0 ; avant, le tracé d'un chemin)
    e.bur = !e.sea && e.k === 'dig' && (e.d + e.id * 7) % 30 < 18 && e.rem > 10; // le foreur avance sous terre 18 m, ressort 12 m
    if (e.dx || e.dz) e.ang = Math.atan2(e.dx, e.dz);
    if (e.k === 'ste' && !(e.rev > 0.4)) {
      if (Math.hypot(e.x - h0.x, e.z - h0.z) < (h0.el === 'bois' ? BAL.sylveSee : 9)) e.rev = 0.5;
      else
        for (const k in s.others) {
          const o = s.others[k];
          if (Math.hypot(e.x - o.x, e.z - o.z) < (o.el === 'bois' ? BAL.sylveSee : 9)) {
            e.rev = 0.5;
            break;
          }
        }
    }
    const ht = s.client ? h0 : heroNear(s, e, HS);
    if (ht && !ht.down && e.hp > 0 && !e.bur && !(e.stun > 0)) {
      e.ha = (e.ha || 0) - dt; // les ennemis s'en prennent au héros : tir pour le tireur et l'aérien, coup au contact pour les autres
      if (e.ha <= 0) {
        const dh = Math.hypot(e.x - ht.x, e.z - ht.z);
        if (e.k === 'rng' && dh < BAL.mageR) {
          e.ha = 2;
          hurtHero(s, ht, 6);
          s.events.push({ k: 'zap', x: e.x, z: e.z, el: e.el });
        } else if (e.k === 'air' && dh < BAL.tirR) {
          e.ha = 1.5;
          hurtHero(s, ht, 3);
          s.events.push({ k: 'zap', x: e.x, z: e.z, el: e.el });
        } else if (e.k !== 'air' && dh < (e.boss ? rOf(e) + 2.5 : 4) && ht.y - (e.gy || 0) < 1.2) {
          e.ha = e.boss ? 1.2 : 0.9;
          const hd = (e.boss ? HBOSS[e.bt || 1] : HDMG[e.k] || 6) * (ht.el === 'terre' ? BAL.rocArmor - ht.m.pA : 1);
          hurtHero(s, ht, hd);
          if (ht.el === 'terre' && ht.m.voA && ht.m.spA2) {
            // Roc Gardien (spA2) : il renvoie les coups. Chez un invité, l'interface le dit à l'hôte (action 'rf')
            const rd = hd * BAL.gardRef * (1 + BAL.hDmgG * (lvl(s, s.wave) - 1));
            if (s.client) s.events.push({ k: 'reflect', id: e.id, d: Math.round(rd) });
            else hurtE(e, rd, true, true);
            s.events.push({ k: 'refl', x: e.x, z: e.z });
          }
        }
      }
    } // perché sur un mur, on est hors de portée des coups
    if (e.k === 'tank' && !s.client && e.hp > 0 && !(e.stun > 0)) {
      e.sm = (e.sm === undefined ? BAL.smashCd * 0.6 : e.sm) - dt; // le tank met hors service la défense la plus proche
      if (e.sm <= 0) {
        let bt = null,
          bd = BAL.smashR;
        for (const t of s.towers) {
          const d = Math.hypot(t.x - e.x, t.z - e.z);
          if (d < bd && !(t.off > 0)) {
            bd = d;
            bt = t;
          }
        }
        if (bt) {
          e.sm = BAL.smashCd;
          bt.off = BAL.smashT;
          s.events.push({ k: 'smash', x: bt.x, z: bt.z });
        } else e.sm = 0;
      }
    } // prêt dès qu'une défense passe à portée
    if ((e.fm || !e.tk ? e.rem <= 0.5 : e.d >= p.len - 0.5) && e.hp > 0) {
      e.hp = -1e9;
      e.leak = true;
      if (!s.god && !s.client) s.core -= e.boss ? BLEAK[e.bt || 1] : e.bomb ? BAL.bombLeak : 1;
      s.events.push({ k: 'leak' });
      if (e.bomb && !s.client) objEnd(s, false, 0);
    }
  }
  // boss moyens et Big Boss (l'hôte décide, les invités recopient)
  if (!s.client)
    for (const e of s.enemies.slice()) {
      if (!(e.bt > 1) || e.hp <= 0) continue;
      if (e.bt === 2 && !e.sea) {
        e.sum -= dt;
        if (e.sum <= 0) {
          e.sum = 6;
          const hp = enemyHp(bal(s), lvl(s, s.wave), 'b', false, s.players) * (s.ck || 1); // trois renforts de son élément toutes les 6 s
          for (let i = 0; i < 3; i++) {
            const id = s.nid++;
            s.enemies.push({
              id,
              el: e.el,
              path: e.path,
              d: 0,
              hp,
              max: hp,
              sp: KINDS.b.sp,
              k: 'b',
              arm: 0,
              rev: 0,
              atk: 0,
              bur: false,
              ang: 0,
              boss: false,
              bt: 0,
              off: offOf(id),
              slow: 0,
              burn: 0,
              stun: 0,
              x: e.x - (e.dx || 0) * (2 + i * 1.5),
              z: e.z - (e.dz || 0) * (2 + i * 1.5),
              fm: true,
              tc: null,
              ox: offOf(id) * 0.7,
              oz: offOf(id * 3 + 1) * 0.7,
              dx: e.dx || 0,
              dz: e.dz || 0,
              rem: e.rem
            });
          }
          s.events.push({ k: 'summon', x: e.x, z: e.z, el: e.el });
        }
      } else {
        const ph = Math.min(ELS.length - 1, Math.floor((1 - e.hp / e.max) * ELS.length)); // passe par les six éléments, un par sixième de vie
        if (ph !== e.ph) {
          e.ph = ph;
          e.el = ELS[(ELS.indexOf(e.el0) + ph) % ELS.length];
          s.events.push({ k: 'shift', x: e.x, z: e.z, el: e.el });
        }
        e.stomp -= dt;
        if (e.stomp <= 0) {
          e.stomp = 10;
          for (const t of s.towers) if (Math.hypot(t.x - e.x, t.z - e.z) < 18) t.off = 3;
          s.events.push({ k: 'stomp', x: e.x, z: e.z, el: e.el });
        }
      }
    } // paralyse 3 s les défenses à 18 m, toutes les 10 s
  // zones laissées au sol par les mortiers spécialisés
  for (const z of s.zones) {
    z.t -= dt;
    z.zap -= dt;
    if (z.foe) {
      if (z.zap <= 0) {
        z.zap = 0.5;
        const h = s.hero;
        if (Math.hypot(h.x - z.x, h.z - z.z) < z.r && h.y - (z.y || 0) < 1.2) hurtHero(s, h, FIREH);
        for (const t of s.towers) if (Math.hypot(t.x - z.x, t.z - z.z) < z.r + 0.6) t.off = Math.max(t.off || 0, 0.7);
      }
      continue;
    } // flammes d'un Incendiaire
    const zapNow = z.el === 'elec' && z.zap <= 0;
    let zn = 0;
    if (zapNow) z.zap = 0.8;
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.k === 'air' || (e.bur && z.el !== 'terre')) continue;
      const rr = z.r + (e.boss ? 1.5 : 0);
      if ((e.x - z.x) ** 2 + (e.z - z.z) ** 2 > rr * rr) continue;
      if (z.el === 'feu') {
        e.hp -= 8 * (z.pw || 1) * mult('feu', e.el, e.boss, BAL.strong + s.m.strong) * dt;
        e.burn = Math.max(e.burn, 0.6);
      } else if (z.el === 'eau' || z.el === 'terre') e.slow = Math.max(e.slow, 0.3);
      else if (z.el === 'bois') {
        e.hp -= 3 * (z.pw || 1) * dt;
        if (z.hero) e.slow = Math.max(e.slow, 0.3);
        if (!e.boss && !(e.imm > 0)) {
          e.stun = 0.8;
          e.imm = 2.2;
        }
      } else if (z.el === 'vent') {
        e.slow = Math.max(e.slow, 0.3); // tourbillon de Vent (V2.1) : ralentit et soulève les petits ennemis qui y entrent
        if (liftable(e)) lift(e, 0.6);
      } else if (z.el === 'elec' && zapNow && zn < 3) {
        zn++;
        hurtE(e, 6 * mult('elec', e.el, e.boss, BAL.strong + s.m.strong));
        s.events.push({ k: 'arc', x: e.x, z: e.z });
      }
    }
  }
  s.zones = s.zones.filter(z => z.t > 0);
  // tirs du héros
  for (const b of s.shots) {
    const x0 = b.x,
      y0 = b.y,
      z0 = b.z,
      sx = b.d[0] * 60 * dt,
      sy = b.d[1] * 60 * dt,
      sz = b.d[2] * 60 * dt,
      sl = sx * sx + sy * sy + sz * sz || 1e-9;
    b.x += sx;
    b.y += sy;
    b.z += sz;
    b.life -= dt;
    if (b.y < -4) b.life = 0;
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || b.hit.includes(e.id)) continue;
      const r = rOf(e),
        cy = cyOf(e),
        u = Math.max(0, Math.min(1, ((e.x - x0) * sx + (cy - y0) * sy + (e.z - z0) * sz) / sl)); // le choc est cherché sur tout le trajet du pas, pas seulement à son bout (audit V2.0, problème 10)
      if ((e.x - x0 - sx * u) ** 2 + (cy - y0 - sy * u) ** 2 + (e.z - z0 - sz * u) ** 2 < r * r) {
        const cr = s.rng() < (b.cr === undefined ? BAL.crit : b.cr),
          ef = mult(b.el, e.el, e.boss, BAL.strong + s.m.strong),
          od = Math.hypot(e.x - b.ox, e.z - b.oz),
          far =
            (b.zf && od > BAL.zephFar ? 1 + b.zf : 1) * // Zéphyr : plus fort de loin
            (b.sf && od > BAL.snipFar ? 1 + b.sf : 1) * // … et encore plus en Sniper (V2.2)
            (b.iso && isolated(s, e) ? 1 + b.iso : 1); // Volt Lame : une cible seule (V2.2)
        hurtE(
          e,
          b.dmg * fallK(b) * (cr ? b.ck || BAL.critK : 1) * ef * far * (e.boss ? 1 + (b.bb || 0) : 1),
          !!b.ap,
          true
        );
        e.mk = b.mk || 0;
        if (b.exe && !e.boss && e.hp > 0 && e.hp < e.max * BAL.lameExe) e.hp = 0; // Volt Lame (spA2) : achève
        if (b.mine && b.col && Math.hypot(e.x - s.hero.x, e.z - s.hero.z) < BAL.colR)
          s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + BAL.colHeal); // Sylve Colosse (spA2) : se soigne en frappant de près
        if (b.mine && b.esc && e.hp <= 0) s.hero.ab = Math.max(0, s.hero.ab - b.esc * BAL.dashCd); // Volt Escarmoucheur : une élimination rend de la recharge
        if (b.lift && liftable(e)) lift(e, b.lift); // balles de Vent : les petits ennemis sont soulevés
        s.events.push({
          k: 'hit',
          x: e.x,
          y: cy,
          z: e.z,
          c: cr,
          m: !!b.mine,
          dead: e.hp <= 0,
          id: e.id,
          ef: ef > 1 ? 2 : ef < 1 ? 0 : 1
        }); // ef : l'élément de la balle contre celui de l'ennemi (2 efficace, 0 peu efficace), pour les chiffres à l'écran
        e.mark = BAL.markT;
        if (b.mine) s.hero.ult = Math.min(100, s.hero.ult + BAL.ultHit * (1 + s.hero.m.uCharge));
        if (b.pois) {
          e.poi = Math.max(e.poi || 0, b.pois);
          e.pk = b.pk || 1;
          if (b.psp) e.psp = 1; // Sylve Plongeur (spB2) : ce poison passera aux voisins
        }
        if (b.wet) {
          e.slow = Math.max(e.slow, b.wet);
          if (b.wr)
            for (const o of s.enemies)
              if (o !== e && o.hp > 0 && !o.bur && Math.hypot(o.x - e.x, o.z - e.z) < 2.5)
                o.slow = Math.max(o.slow, b.wet * 0.5);
        }
        if (b.kn && !e.boss && !(e.kb > 0)) {
          knock(s, e, b.kn);
          e.kb = 0.8;
        } // balles lourdes de Roc : un recul au plus toutes les 0,8 s par ennemi
        if (b.fire) {
          const fr = b.fr || 2.5;
          e.burn = Math.max(e.burn, b.bt || 2);
          s.events.push({ k: 'expl', x: e.x, z: e.z, r: fr });
          for (const o of s.enemies)
            if (o !== e && o.hp > 0 && !o.bur && Math.hypot(o.x - e.x, o.z - e.z) < fr)
              hurtE(o, b.dmg * b.fire * mult(b.el, o.el, o.boss, BAL.strong + s.m.strong), false, true);
        } // passif de Braise
        if (b.chain) {
          const used = [e];
          for (let c = 0; c < b.chain; c++) {
            let nx = null,
              bd = 6;
            const fr = used[used.length - 1];
            for (const o of s.enemies) {
              if (used.includes(o) || o.hp <= 0 || o.bur) continue;
              const d = Math.hypot(o.x - fr.x, o.z - fr.z);
              if (d < bd) {
                bd = d;
                nx = o;
              }
            }
            if (!nx) break;
            used.push(nx);
            nx.mark = BAL.markT;
            hurtE(nx, b.dmg * (b.cd || 0.5) * mult(b.el, nx.el, nx.boss, BAL.strong + s.m.strong), false, true);
            s.events.push({ k: 'arc', x: nx.x, z: nx.z });
          }
        }
        if (b.xp || b.rc || b.zc || b.br) armHit(s, b, e); // améliorations du marchand d'armes
        b.hit.push(e.id);
        if (--b.left <= 0) b.life = 0;
        break;
      }
    }
  }
  s.shots = s.shots.filter(b => b.life > 0);
  // mortiers
  for (const t of s.towers) {
    if (t.off > 0) {
      t.off -= dt;
      continue;
    }
    t.cd -= dt * (s.buff.fren > 0 ? 2 : 1);
    if (t.cd > 0) continue;
    const T = TYPES[t.type],
      m = s.m,
      R = rangeOf(t.type, t.els.length, m) + BAL.wallRange * Math.round((t.wy || 0) / WALLH);
    let tg = null,
      bp = -1e9,
      t2 = null,
      b2 = -1e9;
    for (const e of s.enemies) {
      if (e.hp <= 0) continue;
      const d2 = (e.x - t.x) ** 2 + (e.z - t.z) ** 2;
      if (d2 <= R * R && sees(t.type, e, d2)) {
        const pr = (t.type === 'canon' ? e.hp : -e.rem) + (e.k === 'tank' || e.k === 'gol' ? 1e6 : 0); // rôle Tank (V2.2) : il attire les tirs
        if (pr > bp) {
          b2 = bp;
          t2 = tg;
          bp = pr;
          tg = e;
        } else if (pr > b2) {
          b2 = pr;
          t2 = e;
        }
      }
    }
    if (!tg) continue;
    t.cd = T.cd * (1 - m[TK[t.type] + 'Cd']);
    t.aim = Math.atan2(tg.x - t.x, tg.z - t.z);
    s.events.push({ k: 'fire', id: t.id });
    const shot = (e, off, delay) => {
      let tx = e.x,
        tz = e.z;
      if (T.splash) {
        const lead = (e.stun > 0 ? 0 : e.sp * (e.slow > 0 ? 0.6 : 1) * T.fly) + off;
        tx = e.x + (e.dx || 0) * lead;
        tz = e.z + (e.dz || 0) * lead;
      }
      s.bombs.push({
        id: s.lid++,
        type: t.type,
        tid: e.id,
        x0: t.x,
        z0: t.z,
        h0: T.h + stackH(t.els.length) + (t.wy || 0),
        tx,
        tz,
        u: -delay,
        els: t.els.slice()
      });
    };
    shot(tg, 0, 0);
    if (t.type === 'mortier') for (let i = 0; i < m.mMulti; i++) shot(tg, i ? -3.8 : 3.8, 0.15 * (i + 1));
    if (t.type === 'canon' && m.cDouble) shot(tg, 0, 0.6);
    if (t.type === 'archer' && m.aMulti && t2) shot(t2, 0, 0);
  }
  for (const b of s.bombs) {
    const T = TYPES[b.type];
    b.u += dt / T.fly;
    if (!T.splash) {
      const e = s.enemies.find(e => e.id === b.tid);
      if (e) {
        b.tx = e.x;
        b.tz = e.z;
      }
    }
    if (b.u >= 1) impact(s, b);
  }
  s.bombs = s.bombs.filter(b => b.u < 1);
  // morts
  for (const e of s.enemies)
    if (e.hp <= 0 && !e.leak) {
      const gv = Math.max(
        1,
        Math.round(
          (e.boss
            ? 120 * (e.bt || 1)
            : (KINDS[e.k] || KINDS.b).g + s.m.goldKill + (e.lastH ? s.hero.m.hGold || 0 : 0)) *
            bal(s).goldK *
            (s.buff.or > 0 ? 2 : 1)
        )
      );
      pupDrop(s, e);
      const pk = s.mode === 'normal' && !e.lastH ? bal(s).potK : 0,
        gp = Math.round(gv * pk),
        gm = pk > 0 ? 0 : gv;
      s.pot += gp;
      s.gold += gm;
      s.kills++;
      if (e.bomb && !s.client) {
        s.pend.push({ x: e.x, z: e.z, r: 7, d: e.max * 0.35 });
        objEnd(s, true, wgold(s, 30, 5));
      }
      if (e.boss) s.bossKills++;
      s.events.push({
        k: 'dead',
        x: e.x,
        z: e.z,
        el: e.el,
        boss: e.boss,
        bt: e.bt,
        air: e.k === 'air',
        g: gm,
        pot: pk > 0
      });
      if (!s.client && (e.k === 'gol' || e.k === 'sem')) campDeath(s, e);
      if (!s.client && e.psp && e.poi > 0) {
        let n = 0;
        for (const o of s.enemies)
          if (o !== e && o.hp > 0 && !o.bur && n < 3 && Math.hypot(o.x - e.x, o.z - e.z) < 4) {
            o.poi = Math.max(o.poi || 0, e.poi + 1);
            o.pk = Math.max(o.pk || 1, e.pk || 1);
            o.psp = 1;
            n++;
          }
        if (n) s.events.push({ k: 'pspread', x: e.x, z: e.z });
      } // Sylve Plongeur (spB2) : le poison passe aux voisins
    }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  cielStep(s, dt); // la vue du ciel : chrono de 30 s et joueurs prêts entre deux vagues (regles/ciel.js)
  if (s.client) return; // un invité ne décide ni des vagues ni de la fin : l'hôte l'envoie
  objStep(s, dt);
  if (s.core <= 0) {
    s.core = 0;
    s.over = 'lose';
    return;
  }
  if (s.phase === 'wave' && !s.queue.length && !s.enemies.length) {
    if (s.obj) objEnd(s, false, 0);
    s.gold += wgold(s, 30, 5) + s.m.waveBonus;
    if (s.mode === 'normal') s.pot += bal(s).potWave + bal(s).potWaveG * lvl(s, s.wave);
    s.pts += bal(s).ptsW * (s.wave % 5 === 0 ? 2 : 1);
    s.events.push({ k: 'clear' });
    if (s.wave >= s.maxW) {
      s.over = 'win';
      return;
    }
    s.phase = 'prep';
    s.next = genWave(s, s.wave + 1);
  }
}
// LES RÔLES DES ENNEMIS (V2.2). L'assassin (le Furtif, l'Éclat) : un héros debout et au sol à BAL.assR m ou moins, il quitte sa route et fonce sur lui
// pendant BAL.assT s, puis souffle BAL.assRest s. Il va tout droit et reprend sa route si un mur ou une colline le bloque.
const ASSN = { ste: 1, ecl: 1 };
function assTarget(s, e, hs, dt) {
  if (e.crT > 0) {
    e.crT -= dt;
    return null;
  }
  let b = null,
    bd = e.chT > 0 ? BAL.assR * 1.5 : BAL.assR;
  for (const h of hs) {
    if (h.down > 0 || (h.y || 0) > 1.5) continue;
    const d = Math.hypot(h.x - e.x, h.z - e.z);
    if (d < bd) {
      bd = d;
      b = h;
    }
  }
  if (!b) {
    if (e.chT > 0) e.crT = BAL.assRest;
    e.chT = 0;
    return null;
  }
  if (!(e.chT > 0)) e.chT = BAL.assT;
  e.chT -= dt;
  if (e.chT <= 0) {
    e.crT = BAL.assRest;
    return null;
  }
  return b;
}
function chaseMove(s, e, h, m) {
  const dx = h.x - e.x,
    dz = h.z - e.z,
    l = Math.hypot(dx, dz);
  if (l < 2.2) {
    e.dx = dx / (l || 1);
    e.dz = dz / (l || 1);
    return true;
  } // au contact : il s'arrête et frappe
  const k = Math.min(m, l - 2) / l,
    nx = e.x + dx * k,
    nz = e.z + dz * k,
    i = cellOf(nx, nz);
  if (!WALK[i] || s.wallSet[i]) return false;
  e.x = nx;
  e.z = nz;
  e.dx = dx / l;
  e.dz = dz / l;
  return true;
}
// Braise, voie Mage de bataille (V2.2) : une aura brûle les ennemis à BAL.auraR m (+spB1) de lui. L'hôte blesse ; chacun montre l'aura de son héros.
function auraStep(s, dt) {
  const hs = [s.hero];
  for (const k in s.others) hs.push(s.others[k]);
  s.auT = (s.auT || 0) - dt;
  const show = s.auT <= 0;
  if (show) s.auT = 0.6;
  for (const h of hs) {
    if (h.el !== 'feu' || !h.m || !h.m.voB || h.down > 0) continue;
    const R = BAL.auraR + (h.m.spB1 || 0);
    if (show && h === s.hero) s.events.push({ k: 'aura', x: h.x, z: h.z, r: R });
    if (s.client) continue;
    const d = BAL.auraDps * (1 + 0.08 * (lvl(s, s.wave) - 1)) * dt;
    for (const e of s.enemies)
      if (e.hp > 0 && !e.bur && e.k !== 'air' && Math.hypot(e.x - h.x, e.z - h.z) < R + (e.boss ? 1.5 : 0)) {
        hurtE(e, d * mult('feu', e.el, e.boss, BAL.strong + s.m.strong), false, true);
        e.burn = Math.max(e.burn, 1);
      }
  }
}
// Volt, voie Lame (V2.2) : une cible est seule quand aucun autre ennemi n'est à BAL.lameR m d'elle
function isolated(s, e) {
  for (const o of s.enemies) if (o !== e && o.hp > 0 && Math.hypot(o.x - e.x, o.z - e.z) < BAL.lameR) return false;
  return true;
}
