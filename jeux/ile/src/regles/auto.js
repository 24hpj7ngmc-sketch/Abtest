// [regles/auto.js] Mode normal : des défenses se gèrent seules avec le pot commun ; conseiller d'élément ; tir auto sur cible.
// ---- mode normal : des défenses se posent, s'améliorent et s'adaptent toutes seules, payées par un pot commun
// Le pot se remplit avec l'or des ennemis tués par les défenses (les tiens comme les leurs) et un versement à chaque vague.
const nearPath = (t, p) => {
  let m = 1e9;
  for (const g of p.seg) m = Math.min(m, distSeg(t.x, t.z, g.a, g.b));
  return m;
};
const potFree = s => s.pot - (s.potHold || 0); // ce que les esclaves ont déjà promis à un chantier n'est plus raflé par les défenses automatiques
function potDo(s, fn) {
  const g = s.gold;
  s.gold = s.pot;
  const ok = fn();
  s.pot = s.gold;
  s.gold = g;
  return ok;
}
function autoDef(s, dt) {
  if (s.mode !== 'normal' || s.client || s.over) return;
  s.aiT -= dt;
  if (s.aiT > 0) return;
  s.aiT = s.phase === 'prep' ? 0.7 : 1.5;
  // menace par chemin : ce qui est annoncé avant la vague (sans les groupes cachés), puis ce qui reste à venir et ce qui marche
  const th = PATHS.map(() => ({ w: 0, el: {}, k: {} })),
    add = (p, el, k, w) => {
      if (p < 0) {
        for (let i = 0; i < th.length; i++) add(i, el, k, w / th.length);
        return;
      } // un groupe « de partout » menace les trois chemins à parts égales
      const t = th[p];
      if (!t) return;
      t.w += w;
      t.el[el] = (t.el[el] || 0) + w;
      t.k[k] = (t.k[k] || 0) + w;
    };
  if (s.phase === 'prep') {
    for (const g of s.next || [])
      if (!g.hidden) add(g.path, g.el, g.boss ? 'tank' : g.k, g.boss ? 8 : g.count * KINDS[g.k].w);
  } else {
    for (const q of s.queue) add(q.path, q.el, q.boss ? 'tank' : q.k, q.boss ? 8 : KINDS[q.k].w);
    for (const e of s.enemies) add(e.path, e.el, e.boss ? 'tank' : e.k, e.boss ? 8 : KINDS[e.k].w);
  }
  // on s'occupe du chemin le plus menacé par rapport à ce qui le couvre déjà
  const cov = PATHS.map(p => s.towers.filter(t => nearPath(t, p) < 10));
  let best = -1,
    bs = 0;
  th.forEach((t, i) => {
    const sc = t.w / (1 + cov[i].reduce((a, x) => a + x.els.length, 0));
    if (sc > bs) {
      bs = sc;
      best = i;
    }
  });
  if (best < 0) return;
  const T = th[best],
    near = cov[best],
    want = Object.keys(T.el)
      .sort((a, b) => T.el[b] - T.el[a])
      .map(e => WEAKTO[e]),
    has = ty => near.some(t => t.type === ty),
    big = k => (T.k[k] || 0) > T.w * 0.25;
  // le type répond à ce qui arrive : archer contre les aériens, canon contre les tanks et les boss, mortier contre les foreurs
  const ty =
    big('air') && !has('archer')
      ? 'archer'
      : big('tank') && !has('canon')
        ? 'canon'
        : big('dig') && !has('mortier')
          ? 'mortier'
          : TKEYS.slice().sort(
              (a, b) => near.filter(t => t.type === a).length - near.filter(t => t.type === b).length
            )[0];
  if (s.autoNew && near.length < 2 + Math.floor(s.wave / 3) && potFree(s) >= placeCost(s, ty)) {
    const p = PATHS[best];
    for (const f of [0.88, 0.74, 0.6, 0.46, 0.32, 0.2])
      for (const sd of [1, -1]) {
        const q = posAt(p, f * p.len),
          x = q[0] - q[3] * 5.5 * sd,
          z = q[1] + q[2] * 5.5 * sd;
        if (!canPlace(s, x, z) && potDo(s, () => place(s, ty, x, z, want[0]))) {
          s.towers[s.towers.length - 1].auto = true;
          return;
        }
      }
  }
  // sinon : améliorer la moins avancée de ses défenses sur ce chemin, dans l'élément qui bat ce qui arrive
  const mine = near.filter(t => t.auto && t.els.length < MAXEL * MAXLV).sort((a, b) => a.els.length - b.els.length);
  for (const t of mine) {
    const cn = e => t.els.filter(x => x === e).length,
      nd = new Set(t.els).size;
    const el = want.find(e => cn(e) < MAXLV && (cn(e) || nd < MAXEL)) || [...new Set(t.els)].find(e => cn(e) < MAXLV);
    if (el && potFree(s) >= costOf(t.type, t.els.length) && potDo(s, () => upgrade(s, t.id, el))) return;
  }
}
// ---- conseiller : l'élément le plus utile pour une défense à cet endroit, d'après ce qui arrive sur les chemins qu'elle couvre.
// Avant la vague il lit l'aperçu (sans les groupes cachés), pendant la vague ce qui reste à venir et ce qui marche. Renvoie null s'il n'a rien à dire.
function advise(s, x, z, els) {
  const near = PATHS.map((p, i) => (nearPath({ x, z }, p) < 12 ? i : -1)).filter(i => i >= 0),
    cn = e => els.filter(q => q === e).length,
    nd = new Set(els).size;
  for (const scope of [near, null]) {
    if (scope && !scope.length) continue;
    const w = {};
    let tot = 0;
    const add = (p, el, k) => {
      if (!scope || p < 0 || scope.includes(p)) {
        w[el] = (w[el] || 0) + k;
        tot += k;
      }
    };
    if (s.phase === 'prep') {
      for (const g of s.next || []) if (!g.hidden) add(g.path, g.el, g.boss ? 8 : g.count * KINDS[g.k].w);
    } else {
      for (const q of s.queue) add(q.path, q.el, q.boss ? 8 : KINDS[q.k].w);
      for (const e of s.enemies) add(e.path, e.el, e.boss ? 8 : KINDS[e.k].w);
    }
    if (!tot) continue;
    let best = null,
      bs = -1;
    for (const e of ELS) {
      const c = cn(e);
      if (c >= MAXLV || (!c && nd >= MAXEL)) continue;
      let sc = 0;
      for (const t in w) sc += w[t] * mult(e, t, false);
      sc *= 1 + 0.12 * c; // léger avantage à l'élément déjà monté
      if (sc > bs) {
        bs = sc;
        best = e;
      }
    }
    if (!best) return null;
    const top = Object.keys(w).sort((a, b) => w[b] - w[a])[0];
    return { el: best, vs: top, share: Math.round((100 * w[top]) / tot), local: !!scope };
  }
  return null;
}
// tir auto sur cible : vrai si un ennemi à portée est dans le viseur (même tolérance que l'aide à la visée)
function hasTarget(s, h) {
  const cp = Math.cos(h.pitch),
    sy = Math.sin(h.pitch),
    fx = -Math.sin(h.yaw) * cp,
    fz = -Math.cos(h.yaw) * cp,
    ey = h.y + h.eye - 0.1,
    RG = Math.min(50, 51 * (1 + (h.m.hLife || 0)) + 1.5);
  for (const e of s.enemies) {
    if (e.hp <= 0 || e.bur) continue;
    const vx = e.x - h.x,
      vy = cyOf(e) - ey,
      vz = e.z - h.z,
      l = Math.hypot(vx, vy, vz);
    if (l > RG + rOf(e) || l < 0.5) continue;
    const pr = vx * fx + vy * sy + vz * fz;
    if (pr <= 0) continue;
    if (pr / l > 0.9925 || Math.sqrt(Math.max(0, l * l - pr * pr)) < rOf(e)) return true;
  }
  return false;
}
