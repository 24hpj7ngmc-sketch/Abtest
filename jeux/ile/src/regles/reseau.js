// [regles/reseau.js] Le réseau de la partie : l'hôte met l'état du monde en compact (snap), les invités le recopient (applySnap).
// ---- réseau : l'hôte envoie l'état du monde en compact, les invités le recopient
const RUNK = [
  'mRad',
  'mDmg',
  'mCd',
  'mRange',
  'mMulti',
  'cDmg',
  'cCd',
  'cRange',
  'cRico',
  'cDouble',
  'aDmg',
  'aCd',
  'aRange',
  'aMulti',
  'strong',
  'spec',
  'fxDur',
  'coreHp',
  'goldKill',
  'waveBonus'
];
const r1 = v => Math.round(v * 10) / 10;
function snap(s) {
  return {
    t: r1(s.t),
    g: s.gold,
    c: s.core,
    w: s.wave,
    ph: s.phase === 'prep' ? 0 : 1,
    ov: s.over === 'win' ? 1 : s.over === 'lose' ? 2 : 0,
    p: s.pts,
    k: s.kills,
    b: s.bossKills,
    n: s.nid,
    gd: s.god ? 1 : 0,
    pt: Math.round(s.pot),
    md: s.mode === 'normal' ? 1 : 0,
    an: s.autoNew ? 1 : 0,
    cT: s.cT === undefined ? -1 : r1(s.cT), // vue du ciel : secondes avant la vague (-1 = pas de chrono), joueurs prêts / présents
    cR: s.cR || 0,
    cN: s.cN || 1,
    sm: s.storms.map(st => [Math.round(st.x), Math.round(st.z), st.r || BAL.stormR, ELS.indexOf(st.el || 'elec')]),
    hz: s.zones.filter(q => q.hero).map(q => [r1(q.x), r1(q.z), q.r, ELS.indexOf(q.el), r1(q.t), r1(q.pw || 1)]),
    ob: s.obj
      ? s.obj.k === 'bomb'
        ? ['b', s.obj.id, s.obj.path]
        : s.obj.k === 'zone'
          ? ['z', r1(s.obj.x), r1(s.obj.z), r1(s.obj.got), r1(s.obj.t)]
          : ['r', r1(s.obj.x), r1(s.obj.z), s.obj.car ? 1 : 0, r1(s.obj.t)]
      : 0,
    wl: s.walls.map(i => (i * 4 + s.wallSet[i]).toString(36)).join('.'),
    pi: s.pits.map(i => (i * 4 + s.pit[i]).toString(36)).join('.'),
    m: RUNK.map(k => s.m[k]),
    pu: s.pups.map(p => [PUPK.indexOf(p.k), r1(p.x), r1(p.z), r1(p.t), p.id]),
    bf: PUPT.map(k => r1(s.buff[k])),
    nx: (s.next || [])
      .map(g =>
        [g.path, ELS.indexOf(g.el), g.count, g.hidden ? 1 : 0, g.boss ? g.bt || 1 : 0, KK.indexOf(g.k || 'b')].join(',')
      )
      .join(';'),
    e: s.enemies
      .map(e =>
        [
          e.id.toString(36), // identifiant, avancée, vie et position en base 36, pour qu'il en tienne plus dans l'état
          ELS.indexOf(e.el),
          e.path,
          Math.max(0, Math.round(e.d * 10)).toString(36),
          Math.max(0, Math.ceil(e.hp)).toString(36),
          (e.boss ? 1 : 0) |
            (e.slow > 0 ? 2 : 0) |
            (e.stun > 0 ? 4 : 0) |
            (e.burn > 0 || e.wbT > 0 ? 8 : 0) |
            (e.rev > 0 ? 16 : 0) |
            ((e.bt || 0) << 5) |
            (e.bomb ? 128 : 0) |
            (e.mark > 0 ? 256 : 0),
          KK.indexOf(e.k || 'b')
        ]
          .concat([Math.round(e.x).toString(36), Math.round(e.z).toString(36)]) // la position de tous (les aériens et les foreurs ne suivent plus un chemin connu de l'invité)
          .join(',')
      )
      .join(';'),
    q: s.queue
      .map(q =>
        [
          Math.round((q.t - s.t) * 10),
          q.path,
          ELS.indexOf(q.el),
          q.boss ? q.bt || 1 : 0,
          KK.indexOf(q.k || 'b'),
          q.bomb ? 1 : 0,
          Number.isFinite(q.a) ? Math.round(q.a * 100) : '' // l'angle de sortie : un invité qui reprend la partie les fait encore arriver de partout
        ].join(',')
      )
      .join(';'),
    tw: s.towers
      .map(t =>
        [
          t.id,
          TKEYS.indexOf(t.type),
          Math.round(t.x * 10),
          Math.round(t.z * 10),
          t.els.map(e => ELS.indexOf(e)).join(''),
          (t.auto ? 1 : 0) | (Math.round((t.wy || 0) / WALLH) << 1) | (t.tmpT !== undefined ? 8 : 0),
          t.maxHp ? Math.max(1, Math.round((100 * t.hp) / t.maxHp)) : ''
        ].join(',')
      )
      .join(';'),
    vA: s.phase === 'prep' && s.varc ? [Math.round(s.varc[0] * 100), Math.round(s.varc[1] * 100)] : 0, // d'où viendra la prochaine vague (centre, largeur de l'arc, en centièmes de radian)
    ru: (s.ruins || [])
      .slice(-60)
      .map(q => Math.round(q.x * 10) + ',' + Math.round(q.z * 10))
      .join(';')
  };
}
// ce qui arrive du réseau n'est pas fiable : tout est vérifié avant d'être recopié
function applySnap(s, o) {
  if (!o || typeof o !== 'object') return;
  const num = (v, d) => (Number.isFinite(+v) ? +v : d),
    rows = x =>
      typeof x === 'string' && x
        ? x
            .split(';')
            .slice(0, 200)
            .map(r => r.split(','))
        : [];
  s.t = num(o.t, s.t);
  s.gold = num(o.g, s.gold);
  s.core = num(o.c, s.core);
  s.wave = Math.max(0, Math.min(99, num(o.w, s.wave) | 0));
  s.phase = o.ph ? 'wave' : 'prep';
  s.over = o.ov === 1 ? 'win' : o.ov === 2 ? 'lose' : null;
  s.pts = num(o.p, s.pts);
  s.kills = num(o.k, s.kills);
  s.bossKills = num(o.b, s.bossKills);
  s.nid = num(o.n, s.nid);
  s.god = !!o.gd;
  s.pot = num(o.pt, 0);
  s.mode = o.md ? 'normal' : 'hard';
  s.maxW = bal(s).waves;
  s.autoNew = o.an !== 0;
  s.cT = Math.max(-1, Math.min(999, num(o.cT, -1)));
  s.cR = Math.max(0, Math.min(16, num(o.cR, 0) | 0));
  s.cN = Math.max(1, Math.min(16, num(o.cN, 1) | 0));
  if (Array.isArray(o.hz))
    for (const v of o.hz.slice(0, 6))
      if (Array.isArray(v) && ELS[v[3]] && [v[0], v[1], v[2], v[4]].every(Number.isFinite)) {
        zoneAdd(s, v[0], v[1], Math.min(12, v[2]), ELS[v[3]], Math.min(30, v[4]));
        for (const q of s.zones)
          if (q.el === ELS[v[3]] && Math.hypot(q.x - v[0], q.z - v[1]) < 1.6) {
            q.t = Math.min(q.t, v[4] + 0.5);
            q.pw = num(v[5], 1);
          }
      }
  if (Array.isArray(o.pu))
    s.pups = o.pu
      .slice(0, 12)
      .filter(v => Array.isArray(v) && PUPK[v[0]] && [v[1], v[2], v[3], v[4]].every(Number.isFinite))
      .map(v => ({ k: PUPK[v[0]], x: v[1], z: v[2], t: v[3], id: v[4] }));
  if (Array.isArray(o.bf))
    PUPT.forEach((k, i) => {
      const v = Math.max(0, Math.min(60, num(o.bf[i], 0)));
      if (v > 0 && !(s.buff[k] > 0)) s.events.push({ k: 'pup', t: k, x: s.hero.x, z: s.hero.z, me: false, who: '' });
      s.buff[k] = v;
    });
  s.storms = Array.isArray(o.sm)
    ? o.sm
        .slice(0, 4)
        .filter(v => Array.isArray(v) && Number.isFinite(v[0] + v[1]))
        .map(v => ({
          x: v[0],
          z: v[1],
          r: Number.isFinite(v[2]) ? Math.min(40, v[2]) : BAL.stormR,
          // l'élément du lanceur (4e valeur) ; absent ou douteux : Élec, comme avant
          el: (Number.isInteger(v[3]) && ELS[v[3]]) || 'elec',
          t: 1,
          zap: 9
        }))
    : [];
  {
    const ob = o.ob,
      had = s.obj ? s.obj.k : null,
      n = i => num(ob[i], 0);
    let nw = null;
    if (Array.isArray(ob)) {
      if (ob[0] === 'b') nw = { k: 'bomb', id: n(1), path: Math.max(0, Math.min(2, n(2) | 0)) };
      else if (ob[0] === 'z') nw = { k: 'zone', x: n(1), z: n(2), got: n(3), t: n(4) };
      else if (ob[0] === 'r') nw = { k: 'relic', x: n(1), z: n(2), car: ob[3] ? 'x' : null, t: n(4) };
    }
    if ((nw ? nw.k : null) !== had && nw) s.events.push({ k: 'obj', t: 'start', o: nw.k });
    s.obj = nw;
  }
  const terr = (o.wl || '') + '|' + (o.pi || '');
  if (typeof o.wl === 'string' && terr !== s.wlS) {
    s.wlS = terr;
    const dec = (str, max) =>
      str
        ? String(str)
            .split('.')
            .map(v => parseInt(v, 36))
            .filter(v => v >= 0 && v >> 2 < GN * GN && WALK[v >> 2] && v & 3)
            .slice(0, max)
        : [];
    const ws = dec(o.wl, BAL.wallMax),
      ps = dec(o.pi, BAL.pitMax);
    s.walls = ws.map(v => v >> 2);
    s.wallSet.set(HILL);
    for (const v of ws) s.wallSet[v >> 2] = v & 3;
    s.pits = ps.map(v => v >> 2);
    s.pit.fill(0);
    for (const v of ps) s.pit[v >> 2] = Math.min(BAL.pitTop, v & 3);
    refield(s);
  }
  if (Array.isArray(o.m))
    RUNK.forEach((k, i) => {
      s.m[k] = num(o.m[i], 0);
    });
  s.next =
    s.phase === 'prep'
      ? rows(o.nx)
          .filter(r => (+r[0] === -1 || PATHS[+r[0]]) && ELS[+r[1]])
          .map(r => ({
            path: +r[0],
            el: ELS[+r[1]],
            count: num(r[2], 1),
            hidden: r[3] === '1',
            boss: +r[4] > 0,
            bt: Math.min(3, +r[4] | 0),
            k: KK[+r[5]] || 'b'
          }))
      : null;
  const old = {};
  for (const e of s.enemies) old[e.id] = e;
  const omit = new Set(
    typeof o.eo === 'string' && o.eo
      ? o.eo
          .split('.')
          .slice(0, 300)
          .map(v => parseInt(v, 36))
      : []
  ); // les ennemis vivants que l'hôte n'a pas pu mettre dans ce snap (trop gros) : on les garde tels quels
  s.enemies = rows(o.e)
    .map(r => {
      for (const i of [0, 3, 4, 7, 8]) r[i] = r[i] === undefined || r[i] === '' ? NaN : parseInt(r[i], 36); // base 36 (voir snap)
      return r;
    })
    .filter(
      r => PATHS[+r[2]] && ELS[+r[1]] && Number.isFinite(+r[0]) && Number.isFinite(+r[3]) && Number.isFinite(+r[4])
    )
    .map(r => {
      const fl = +r[5] | 0,
        boss = !!(fl & 1),
        id = +r[0],
        d = +r[3] / 10,
        kd = boss ? 'b' : KK[+r[6]] || 'b',
        K = KINDS[kd],
        bt = boss ? (fl >> 5) & 3 || 1 : 0;
      let e = old[id];
      if (!e) {
        e = {
          id,
          el: ELS[+r[1]],
          path: +r[2],
          d,
          sp: bt ? BSP[bt] : fl & 128 ? 4 : K.sp,
          bomb: !!(fl & 128),
          bt,
          el0: ELS[+r[1]],
          ph: 0,
          sum: 6,
          stomp: 8,
          k: kd,
          arm: kd === 'tank' ? bal(s).armor0 + bal(s).armorG * lvl(s, s.wave) : 0,
          rev: 0,
          atk: 0,
          bur: false,
          ang: 0,
          boss,
          off: offOf(id) * (kd === 'air' && !boss && !(fl & 128) ? 3 : 1),
          slow: 0,
          burn: 0,
          stun: 0,
          imm: 0,
          x: 0,
          z: 0,
          fm: fmOf(kd),
          tc: null,
          ox: offOf(id) * 0.7,
          oz: offOf(id * 3 + 1) * 0.7,
          dx: 0,
          dz: 0,
          rem: 1e6,
          _n: 1
        };
      }
      e.d = Math.abs(d - e.d) < 2.5 ? e.d + (d - e.d) * 0.3 : d;
      e.hp = +r[4];
      e.el = ELS[+r[1]];
      e.max = Math.max(
        enemyHp(bal(s), lvl(s, s.wave), kd, boss, s.players) *
          (bt ? bal(s).bossT[bt - 1] : 1) *
          (fl & 128 ? BAL.bombHp : 1),
        e.hp
      );
      e.slow = fl & 2 ? Math.max(e.slow, 0.4) : 0;
      e.stun = fl & 4 ? Math.max(e.stun, 0.3) : 0;
      e.burn = fl & 8 ? Math.max(e.burn, 0.4) : 0;
      e.rev = fl & 16 ? Math.max(e.rev, 0.4) : 0;
      e.mark = fl & 256 ? Math.max(e.mark || 0, 0.4) : 0;
      if (e.fm || Number.isFinite(+r[7] + +r[8])) {
        const X = +r[7],
          Z = +r[8];
        if (Number.isFinite(X + Z)) {
          if (e._n || Math.hypot(X - e.x, Z - e.z) > 5) {
            e.x = X;
            e.z = Z;
            e.tc = null;
          } else {
            e.x += (X - e.x) * 0.25;
            e.z += (Z - e.z) * 0.25;
          }
        }
        const rr = e.fm ? s.field[cellOf(e.x, e.z)] : Math.hypot(e.x, e.z);
        if (rr < 1e8) e.rem = rr;
      } else {
        const q = posAt(PATHS[e.path], e.d);
        e.x = q[0] - q[3] * e.off;
        e.z = q[1] + q[2] * e.off;
        e.rem = PATHS[e.path].len - e.d;
      }
      e._n = 0;
      return e;
    });
  if (omit.size) {
    const got = new Set(s.enemies.map(e => e.id));
    for (const id of omit) if (old[id] && !got.has(id) && s.enemies.length < 300) s.enemies.push(old[id]);
  }
  s.queue = rows(o.q)
    .filter(r => PATHS[+r[1]] && ELS[+r[2]] && Number.isFinite(+r[0]))
    .map(r => ({
      t: s.t + +r[0] / 10,
      path: +r[1],
      el: ELS[+r[2]],
      boss: +r[3] > 0,
      bt: Math.min(3, +r[3] | 0),
      k: KK[+r[4]] || 'b',
      bomb: r[5] === '1',
      a: r[6] !== undefined && r[6] !== '' && Number.isFinite(+r[6]) ? +r[6] / 100 : undefined
    }));
  // la file résumée (snap trop gros) : par groupe « élément, sorte, boss, bombe, nombre, première et dernière sortie », refaite en sorties régulières, angles étalés tout autour
  for (const r of rows(o.qs)) {
    const el = ELS[+r[0]],
      n = Math.min(200, +r[4] | 0),
      t0 = +r[5] / 10,
      t1 = +r[6] / 10;
    if (!el || !(n > 0) || !Number.isFinite(t0 + t1)) continue;
    for (let i = 0; i < n && s.queue.length < 400; i++)
      s.queue.push({
        t: s.t + t0 + (n > 1 ? ((t1 - t0) * i) / (n - 1) : 0),
        path: 0,
        el,
        boss: +r[2] > 0,
        bt: Math.min(3, +r[2] | 0),
        k: KK[+r[1]] || 'b',
        bomb: r[3] === '1',
        a: ((+r[0] * 0.13 + i * 0.6180339887) % 1) * 6.2832
      });
  }
  if (o.qs) s.queue.sort((a, b) => a.t - b.t);
  const ot = {};
  for (const t of s.towers) ot[t.id] = t;
  s.towers = rows(o.tw)
    .filter(r => TKEYS[+r[1]] && Number.isFinite(+r[0]) && Number.isFinite(+r[2]) && Number.isFinite(+r[3]))
    .map(r => {
      const id = +r[0],
        els = String(r[4] || '')
          .split('')
          .map(c => ELS[+c])
          .filter(Boolean)
          .slice(0, MAXEL * MAXLV);
      const t = ot[id] || { id, type: TKEYS[+r[1]], x: +r[2] / 10, z: +r[3] / 10, els: [], cd: 0.4, aim: 0 };
      t.els = els.length ? els : ['feu'];
      t.auto = !!(+r[5] & 1);
      t.wy = ((+r[5] >> 1) & 3) * WALLH;
      t.tmpT = +r[5] & 8 ? 1 : undefined;
      if (+r[6] > 0) {
        t.maxHp = 100;
        t.hp = +r[6];
        t.sum = 1;
      }
      return t;
    });
  if (Array.isArray(o.vA) && o.vA.length === 2 && Number.isFinite(+o.vA[0] + +o.vA[1]))
    s.varc = [Math.max(-7, Math.min(7, +o.vA[0] / 100)), Math.max(0, Math.min(6.2832, +o.vA[1] / 100))];
  s.ruins = rows(o.ru)
    .filter(r => Number.isFinite(+r[0]) && Number.isFinite(+r[1]))
    .slice(0, 200)
    .map(r => ({ id: 'ru' + r[0] + '_' + r[1], x: +r[0] / 10, z: +r[1] / 10 }));
}
// l'état envoyé doit tenir dans la limite du salon :
// 1) la file d'attente est résumée par groupes au lieu d'être jetée (le reste de la vague arrive toujours si l'hôte change) ;
// 2) s'il faut encore couper des ennemis : on garde les plus proches du cœur, puis une tranche qui tourne d'un envoi à l'autre parmi les autres
//    (ceux qui sortent de la mer finissent donc toujours par être vus), et l'on dit lesquels manquent (eo) pour que l'invité les garde.
let fitRot = 0,
  fitSent = {}; // identifiant d'ennemi → numéro du dernier envoi où il figurait
function qSum(q) {
  const G = {};
  for (const r of q.split(';')) {
    const v = r.split(','),
      key = [v[2], v[4], v[3], v[5]].join(','),
      t = +v[0];
    if (!Number.isFinite(t)) continue;
    const g = (G[key] = G[key] || [key, 0, t, t]);
    g[1]++;
    g[2] = Math.min(g[2], t);
    g[3] = Math.max(g[3], t);
  }
  return Object.values(G)
    .map(g => g[0] + ',' + g[1] + ',' + g[2] + ',' + g[3])
    .join(';');
}
function fitSnap(o, max) {
  let n = JSON.stringify(o).length;
  if (n > max && o.q) {
    const qs = qSum(o.q);
    if (qs.length < o.q.length) {
      n += qs.length + 8 - o.q.length;
      o.q = '';
      o.qs = qs;
    }
  }
  if (n > max && o.e.length) {
    const rows = o.e.split(';'),
      d = r => {
        const v = r.split(',');
        return Math.hypot(parseInt(v[7], 36) || 0, parseInt(v[8], 36) || 0);
      },
      idx = rows.map((_, i) => i).sort((a, b) => d(rows[a]) - d(rows[b])),
      fixed = n - o.e.length,
      room = Math.max(0, max - fixed - 30);
    let keep = [],
      used = 0;
    const half = room * 0.5;
    let k = 0;
    for (; k < idx.length && used + rows[idx[k]].length + 1 <= half; k++) {
      keep.push(idx[k]);
      used += rows[idx[k]].length + 1;
    }
    const idOf = i => rows[i].split(',')[0],
      omitLen = i => idOf(i).length + 1, // la place d'un identifiant manquant dans eo
      rest = idx.slice(k).sort((a, b) => (fitSent[idOf(a)] || 0) - (fitSent[idOf(b)] || 0)); // les moins récemment envoyés d'abord
    let budget = room - used - rest.reduce((a, i) => a + omitLen(i), 0);
    fitRot++;
    for (const i of rest) {
      const c = rows[i].length + 1 - omitLen(i);
      if (c > budget) break;
      keep.push(i);
      budget -= c;
    }
    for (const i of keep) fitSent[idOf(i)] = fitRot;
    if (fitRot % 200 === 0) for (const id in fitSent) if (fitSent[id] < fitRot - 400) delete fitSent[id];
    const kept = new Set(keep);
    o.e = keep.map(i => rows[i]).join(';');
    o.eo = rows
      .filter((_, i) => !kept.has(i))
      .map(r => r.split(',')[0])
      .join('.');
  }
  return o;
}
