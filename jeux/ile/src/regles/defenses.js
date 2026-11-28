// [regles/defenses.js] Les défenses : Renfort et ses ruines, pose libre, amélioration, spécialisation, zones d'effet, impact d'un tir.
// pose libre : partout sur l'île sauf sur les chemins
// LE RENFORT (V10.0, demande de Frédéric) : la 3e capacité, propre à ce mini-jeu. renfort(s, h) fait apparaître SUMN défenses de types tirés au hasard, de l'élément du héros, à des emplacements
// valides tirés autour de lui, gratuites, d'un niveau qui suit la partie. Recharge SUMCD dans h.sm. Ces défenses-là, et elles seules, ont des points de vie (t.hp, t.maxHp) :
// un ennemi à terre qui passe à moins de SIEGER s'arrête et la frappe (SIEGED par seconde, quatre fois plus pour un boss, SIEGEN attaquants au plus à la fois).
// Détruite, elle laisse une ruine (s.ruins) : canPlace refuse tout ce qui est à moins de RUINR. Les ruines restent jusqu'à la fin de la partie : les bons emplacements se font rares.
const SUMN = 3,
  SUMCD = 60,
  SUMHP = 260,
  SIEGER = 4.6,
  SIEGED = 8,
  SIEGEN = 4,
  RUINR = 3;
function renfort(s, h) {
  h = h || s.hero;
  if (h.sm > 0 || s.over || h.down > 0) return false;
  const r = s.rng,
    lv = Math.max(1, Math.min(MAXLV, 1 + Math.floor(s.wave / 7)));
  let n = 0;
  for (let k = 0; k < 60 && n < SUMN; k++) {
    const a = r() * 6.2832,
      d = 3.5 + r() * 6,
      x = h.x + Math.cos(a) * d,
      z = h.z + Math.sin(a) * d;
    if (canPlace(s, x, z) || s.wallSet[cellOf(x, z)] || HILL[cellOf(x, z)]) continue;
    s.towers.push({
      id: s.nid++,
      type: TKEYS[Math.floor(r() * TKEYS.length)],
      x,
      z,
      els: Array(lv).fill(elOf(h)),
      cd: 0.4,
      aim: 0,
      wy: 0,
      hp: SUMHP,
      maxHp: SUMHP,
      sum: 1
    });
    n++;
  }
  if (!n) return false;
  h.sm = SUMCD;
  s.events.push({ k: 'renfort', x: h.x, z: h.z, el: elOf(h), n });
  return true;
}
function ruinOf(s, t) {
  (s.ruins = s.ruins || []).push({ id: s.nid++, x: t.x, z: t.z });
  s.events.push({ k: 'ruin', x: t.x, z: t.z, el: t.els[0] });
}
function canPlace(s, x, z) {
  const r = Math.hypot(x, z);
  if (r > R_ISLE - 5) return "Hors de l'île";
  if (r < 7) return 'Trop près du cœur';
  if (s.ruins) for (const q of s.ruins) if (Math.hypot(q.x - x, q.z - z) < RUINR) return 'Sur des ruines';
  const onW = s.wallSet[cellOf(x, z)];
  if (s.pit[cellOf(x, z)]) return 'Dans une fosse';
  if (s.tmpSet[cellOf(x, z)]) return 'Sur un rempart';
  if (!onW && distPaths(x, z) < PATH_HALF + 2.1) return 'Sur le chemin';
  for (const t of s.towers)
    if (Math.hypot(t.x - x, t.z - z) < (onW && t.wy ? 3.9 : 4.6)) return "Trop près d'une défense";
  return '';
}
function place(s, type, x, z, el) {
  const c = placeCost(s, type),
    ci = cellOf(x, z),
    onW = s.wallSet[ci];
  if (onW) {
    x = cellX(ci);
    z = cellZ(ci);
  } // sur un mur, la défense se cale au centre du bloc
  if (s.gold < c || canPlace(s, x, z)) return false;
  s.gold -= c;
  s.towers.push({ id: s.nid++, type, x, z, els: [el], cd: 0.4, aim: 0, wy: onW * WALLH });
  return true;
}
function upgrade(s, id, el) {
  const t = s.towers.find(t => t.id === id);
  if (!t || t.tmpT !== undefined || t.sum) return false;
  const lv = t.els.length,
    c = t.els.filter(e => e === el).length,
    c$ = costOf(t.type, lv);
  if (!ELS.includes(el) || c >= MAXLV || (!c && new Set(t.els).size >= MAXEL) || s.gold < c$) return false;
  s.gold -= c$;
  t.els.push(el);
  return true;
}
function tdmg(s, els, cnt, e, base) {
  let d = 0;
  for (const el of els)
    d += base * (1 + (cnt[el] - 1) * (BAL.dup + s.m.spec)) * mult(el, e.el, e.boss, BAL.strong + s.m.strong);
  return d;
}
function pures(els) {
  const c = {};
  for (const e of els) c[e] = (c[e] || 0) + 1;
  return ELS.filter(e => c[e] >= MAXLV);
}
const pureOf = els => pures(els)[0] || null;
// spécialisation (3 fois le même élément) : un effet propre à chaque défense et à chaque élément
const FXN = {
  mortier: {
    feu: 'Obus incendiaires',
    eau: 'Obus-geysers',
    bois: 'Obus à ronces',
    terre: 'Cratères',
    elec: 'Obus-orages',
    vent: 'Obus-tornades'
  },
  canon: {
    feu: 'Boulets rouges',
    eau: 'Canon à pression',
    bois: 'Boulets-racines',
    terre: 'Perce-blindage',
    elec: 'Boulets foudre',
    vent: 'Boulets-rafales'
  },
  archer: {
    feu: 'Flèches enflammées',
    eau: 'Flèches de givre',
    bois: 'Flèches empoisonnées',
    terre: 'Flèches lourdes',
    elec: 'Flèches conductrices',
    vent: 'Flèches sifflantes'
  }
};

const ZDUR = { feu: 4, eau: 5, bois: 4, terre: 6, elec: 3, vent: 3 };
function zoneAdd(s, x, z, r, el, t) {
  for (const q of s.zones)
    if (q.el === el && Math.hypot(q.x - x, q.z - z) < 1.5) {
      q.t = Math.max(q.t, t);
      q.T = Math.max(q.T, t);
      q.r = Math.max(q.r, r);
      return;
    }
  s.zones.push({ id: s.lid++, x, z, r, el, t, T: t, zap: 0 });
  if (s.zones.length > 40) s.zones.shift();
}
function impact(s, b) {
  const T = TYPES[b.type],
    m = s.m,
    els = b.els,
    cnt = {};
  els.forEach(e => (cnt[e] = (cnt[e] || 0) + 1));
  const mort = b.type === 'mortier',
    can = b.type === 'canon',
    arch = b.type === 'archer';
  const P = {};
  for (const e in cnt) if (cnt[e] >= MAXLV) P[e] = 1; // chaque élément monté au niveau 3 apporte son effet, et ils se cumulent
  const base = T.dmg * (1 + m[TK[b.type] + 'Dmg']),
    fxd = 1 + m.fxDur,
    sp = T.splash * (mort ? 1 + m.mRad : 1);
  const R = P.terre ? (sp ? sp * 1.6 : 2.4) : sp,
    hit = new Set(),
    tg = T.splash ? null : s.enemies.find(e => e.id === b.tid && e.hp > 0 && !e.bur);
  if (!R && !tg) return;
  const hurt = (e, k) => {
    hurtE(e, tdmg(s, els, cnt, e, base) * k, !!P.terre);
    hit.add(e);
    if (P.feu) {
      e.burn = (can ? 4 : 3) * fxd;
      e.bk = can ? 2 : 1;
    }
    if (P.eau) {
      e.slow = 2.5 * fxd;
      if (can && e === tg) knock(s, e, e.boss ? 1.5 : 4);
    }
    if (P.vent) {
      // Vent (V2.1) : soulève les petits ennemis ; le canon repousse sa cible ; la flèche traverse (plus bas)
      if (liftable(e)) lift(e, (can ? 1.2 : 0.8) * fxd);
      if (can && e === tg) knock(s, e, e.boss ? 1.5 : 5);
    }
    if (P.bois) {
      if (arch) e.poi = 4 * fxd;
      else if (e.boss) e.slow = 1.5 * fxd;
      else if (!(e.imm > 0)) {
        e.stun = (can ? 1.5 : 0.8) * fxd;
        e.imm = e.stun + 1.4;
      }
    }
  };
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    let ok = e === tg,
      k = 1;
    if (!ok && R && e.k !== 'air' && (mort || !e.bur)) {
      const rr = R + (e.boss ? 1.5 : 0),
        dx = e.x - b.tx,
        dz = e.z - b.tz;
      ok = dx * dx + dz * dz <= rr * rr;
      if (e.bur && !P.terre) k = 0.5;
    }
    if (ok) hurt(e, k);
  }
  if (can && tg) {
    let from = tg;
    for (let i = 0; i < m.cRico; i++) {
      let nx = null,
        bd = 8;
      for (const e of s.enemies) {
        if (e.hp <= 0 || e.bur || hit.has(e)) continue;
        const d = Math.hypot(e.x - from.x, e.z - from.z);
        if (d < bd) {
          bd = d;
          nx = e;
        }
      }
      if (!nx) break;
      hurt(nx, 0.6);
      s.events.push({ k: 'boom', x: nx.x, z: nx.z, r: 1.2, el: els[0] });
      from = nx;
    }
  }
  if (arch && P.vent && tg) {
    // Flèches sifflantes : la flèche traverse et touche l'ennemi suivant, derrière la cible
    let nx = null,
      bd = 5;
    for (const e of s.enemies) {
      if (e.hp <= 0 || e.bur || hit.has(e)) continue;
      const d = Math.hypot(e.x - tg.x, e.z - tg.z);
      if (d < bd) {
        bd = d;
        nx = e;
      }
    }
    if (nx) hurt(nx, 0.7);
  }
  if (P.elec) {
    s.enemies
      .filter(e => !hit.has(e) && e.hp > 0 && !e.bur)
      .map(e => [Math.hypot(e.x - b.tx, e.z - b.tz), e])
      .filter(a => a[0] < 10)
      .sort((a, b) => a[0] - b[0])
      .slice(0, can ? 3 : 2)
      .forEach(a => {
        hurtE(a[1], tdmg(s, els, cnt, a[1], base) * (can ? 0.6 : 0.5));
        if (!arch) s.events.push({ k: 'arc', x: a[1].x, z: a[1].z });
      });
  }
  if (can && P.feu && tg && tg.hp <= 0) {
    for (const e of s.enemies) {
      if (e === tg || e.hp <= 0 || e.bur || e.k === 'air' || hit.has(e)) continue;
      if (Math.hypot(e.x - tg.x, e.z - tg.z) < 3.5) hurt(e, 0.5);
    }
    s.events.push({ k: 'boom', x: tg.x, z: tg.z, r: 3.5, el: 'feu' });
  }
  if (mort) for (const el in P) zoneAdd(s, b.tx, b.tz, R, el, ZDUR[el] * fxd);
  if (R || can) s.events.push({ k: 'boom', x: b.tx, z: b.tz, r: R || 1.4, el: els[0] });
}
