// [regles/armes.js] Les armes du joueur dans la partie : l'élément de chaque arme, et les améliorations du marchand d'armes (tirs multiples, explosions, ricochets, chaînes…).
// Au début de la partie, chacun choisit jusqu'à 3 armes et un élément pour chacune (interface/arsenal.js). Le héros porte alors, pour l'arme en main :
//   h.wk : l'arme (clé de WT) · h.wEl : son élément (celui des balles : il compte contre l'élément de l'ennemi, Eau › Feu › Bois › Terre › Élec › Eau) · h.wu : { id: niveau } ses améliorations.
// Sans h.wEl (bots, esclaves, anciennes parties), les balles gardent l'élément du héros : les règles d'avant.
// Les effets propres au héros (chaîne de Volt, poison de Sylve, éclats de Braise, eau d'Ondine, recul de Roc) restent liés au héros, pas à l'arme.
// Les améliorations s'achètent avec l'or de l'équipe, pour soi, arme par arme, et repartent à zéro à chaque partie.
const ARMUP = [
  { id: 'deg', n: 'Dégâts', ico: 'dmg', max: 3, cost: [70, 140, 220], v: L => (L ? '+' + L * 20 + ' %' : 'de base') },
  { id: 'cad', n: 'Cadence', ico: 'spd', max: 3, cost: [60, 120, 200], v: L => (L ? '+' + L * 15 + ' %' : 'de base') },
  {
    id: 'crit',
    n: 'Coups critiques',
    ico: 'crit',
    max: 3,
    cost: [60, 120, 180],
    v: L => (L ? '+' + L * 8 + ' % · ×' + (2 + L * 0.25).toFixed(2).replace('.', ',') : 'de base')
  },
  {
    id: 'multi',
    n: 'Tirs multiples',
    ico: 'multi',
    max: 2,
    cost: [110, 220],
    v: (L, w) =>
      w === 'pompe'
        ? 8 + L * 3 + ' plombs'
        : L
          ? L + 1 + ' balles (+' + L + ' à ' + Math.round(ARMK.multiK * 100) + ' %)'
          : '1 balle' // libellés seulement
  },
  {
    id: 'expl',
    n: 'Balles explosives',
    ico: 'boom',
    max: 3,
    cost: [90, 170, 260],
    v: L => (L ? 'rayon ' + (ARMK.xr0 + ARMK.xrL * L).toFixed(1).replace('.', ',') + ' m' : 'non')
  },
  {
    id: 'perf',
    n: 'Perforantes',
    ico: 'pierce',
    max: 3,
    cost: [50, 100, 160],
    v: L => (L ? '+' + L + ' ennemi' + (L > 1 ? 's' : '') + ' traversé' + (L > 1 ? 's' : '') : 'non')
  },
  {
    id: 'rico',
    n: 'Ricochet',
    ico: 'rico',
    max: 3,
    cost: [70, 140, 220],
    v: L => (L ? L + ' rebond' + (L > 1 ? 's' : '') : 'non')
  },
  {
    id: 'chain',
    n: 'Chaîne électrique',
    ico: 'bolt',
    max: 3,
    cost: [80, 160, 250],
    v: L => (L ? L + 1 + ' éclairs' : 'non')
  },
  {
    id: 'brul',
    n: 'Brûlure',
    ico: 'flame',
    max: 3,
    cost: [50, 100, 160],
    v: L => (L ? 'brûle ' + String(ARMK.bt0 + L).replace('.', ',') + ' s' : 'non')
  }
];
const ARMK = {
  deg: 0.2, // + dégâts par niveau
  cad: 0.15, // + cadence par niveau
  crit: 0.08,
  critD: 0.25, // + chance de critique, + multiplicateur des critiques, par niveau
  multiK: 0.6,
  multiA: 0.05, // tirs multiples : dégâts d'une balle en plus (× ceux de la balle du milieu), écart de l'éventail (radians)
  pelL: 3, // fusil à pompe : plombs en plus par niveau de « Tirs multiples »
  xr0: 1.4,
  xrL: 0.8,
  xk0: 0.25,
  xkL: 0.15, // explosion : rayon (base + par niveau), part des dégâts de la balle (base + par niveau)
  rR: 10,
  rK: 0.6, // ricochet : portée d'un rebond, part des dégâts
  zR: 6.5,
  zK: 0.35, // chaîne : portée d'un éclair, part des dégâts
  bt0: 1.5,
  bdK: 0.7,
  bdL: 0.35 // brûlure : durée (base + 1 s par niveau) ; elle fait bdK × les dégâts de la balle par seconde, +bdL par niveau au-delà du premier, selon l'élément
};
const ARMLANCE = ['deg', 'cad', 'brul']; // le lance-flammes n'a pas de balles : seulement ces trois-là
const armOk = (w, id) => w !== 'lance' || ARMLANCE.includes(id);
const armL = (h, id) => (h.wu && h.wu[id]) || 0;
const armUpOf = id => ARMUP.find(u => u.id === id);
const armCost = (id, L) => {
  const u = armUpOf(id);
  return u && L < u.max ? u.cost[L] : 0;
};
// au tir : ce que les améliorations changent à une balle qui part (b est déjà rempli par heroStep).
// side : une balle en plus des tirs multiples, ou un plomb après le premier. explosion, ricochet et chaîne ne partent que de la balle principale.
function armShot(h, b, side) {
  if (!h.wu) return b;
  const dg = armL(h, 'deg'),
    cr = armL(h, 'crit');
  if (dg) b.dmg *= 1 + ARMK.deg * dg;
  if (cr) {
    b.cr += ARMK.crit * cr;
    b.ck += ARMK.critD * cr;
  }
  b.left += armL(h, 'perf');
  b.xp = side ? 0 : armL(h, 'expl');
  b.rc = side ? 0 : armL(h, 'rico');
  b.zc = side ? 0 : armL(h, 'chain');
  b.br = armL(h, 'brul');
  b.ug = dg + cr + b.xp + b.rc + b.zc + b.br + armL(h, 'perf') + armL(h, 'multi'); // pour l'affichage : une balle améliorée brille plus fort
  return b;
}
// à l'impact : explosion, ricochets, chaîne électrique, brûlure (après les dégâts de la balle elle-même).
// explosion, ricochet et chaîne seulement au premier ennemi touché par la balle (une balle perforante ne les répète pas) ;
// la brûlure suit les dégâts de la balle et l'élément (avant : une brûlure fixe, la même pour toutes les armes).
function armHit(s, b, e) {
  const SK = BAL.strong + s.m.strong;
  if (b.br) {
    e.wbT = Math.max(e.wbT || 0, ARMK.bt0 + b.br);
    e.wbD = Math.max(e.wbD || 0, b.dmg * ARMK.bdK * (1 + ARMK.bdL * (b.br - 1)) * mult(b.el, e.el, e.boss, SK));
  }
  if (b.hit.length) return;
  if (b.xp) {
    const r = ARMK.xr0 + ARMK.xrL * b.xp,
      k = ARMK.xk0 + ARMK.xkL * b.xp;
    for (const o of s.enemies)
      if (o !== e && o.hp > 0 && !o.bur && (o.k === 'air') === (e.k === 'air') && Math.hypot(o.x - e.x, o.z - e.z) < r)
        hurtE(o, b.dmg * k * mult(b.el, o.el, o.boss, SK), false, true);
    s.events.push({ k: 'aexp', x: e.x, y: cyOf(e), z: e.z, r, el: b.el });
  }
  if (b.rc) {
    let fr = e;
    const done = [e.id];
    for (let n = 0; n < b.rc; n++) {
      let nx = null,
        bd = ARMK.rR;
      for (const o of s.enemies) {
        if (o.hp <= 0 || o.bur || done.includes(o.id) || b.hit.includes(o.id)) continue;
        const d = Math.hypot(o.x - fr.x, o.z - fr.z);
        if (d < bd) {
          bd = d;
          nx = o;
        }
      }
      if (!nx) break;
      done.push(nx.id);
      hurtE(nx, b.dmg * ARMK.rK * mult(b.el, nx.el, nx.boss, SK), false, true);
      nx.mark = BAL.markT;
      s.events.push({
        k: 'arico',
        x1: fr.x,
        y1: cyOf(fr),
        z1: fr.z,
        x2: nx.x,
        y2: cyOf(nx),
        z2: nx.z,
        el: b.el,
        m: !!b.mine
      });
      fr = nx;
    }
  }
  if (b.zc) {
    const used = [e];
    for (let n = 0; n <= b.zc; n++) {
      const fr = used[used.length - 1];
      let nx = null,
        bd = ARMK.zR;
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
      hurtE(nx, b.dmg * ARMK.zK * mult(b.el, nx.el, nx.boss, SK), false, true);
      if (!(nx.stun > 0) && !nx.boss) nx.slow = Math.max(nx.slow, 0.4);
      s.events.push({ k: 'azap', x1: fr.x, y1: cyOf(fr), z1: fr.z, x2: nx.x, y2: cyOf(nx), z2: nx.z });
    }
  }
}
// l'achat : l'or de l'équipe paie (l'hôte décide, voir l'action 'wb' dans interface/bots-marchand.js). Rend le prix payé, 0 si refusé.
function armPay(s, id, L) {
  const c = armCost(id, L);
  if (!c || s.gold < c) return 0; // pas assez d'or : refusé, jamais de paiement partiel
  s.gold -= c;
  return c;
}
