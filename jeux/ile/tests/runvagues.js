// Les vagues de la V2.0 : ennemis qui surgissent de partout, un par un et mêlés ; navires qui croisent ; aperçu par élément ; esclaves qui creusent et murent.   usage : node tests/runvagues.js (≈ 15 s, après ./mktest.sh)
// Les règles sont lues dans le jeu assemblé (construit/all.js, entre //<SIM> et //</SIM>), comme le banc d'équilibre ; l'aperçu, lui, est regardé dans la page.
const fs = require('fs'),
  path = require('path'),
  vm = require('vm');
const all = fs.readFileSync('construit/all.js', 'utf8'),
  SIM = all.slice(all.indexOf('//<SIM>'), all.indexOf('//</SIM>'));
let bad = 0;
const ok = (n, c) => {
  if (!c) bad++;
  console.log((c ? 'ok  ' : 'RATÉ ') + n);
};
const ctx = { console, Math, Date, JSON, Object, Array, Number, String, Set, Map, Uint8Array, Float32Array, Int16Array, Infinity, NaN, isFinite };
vm.createContext(ctx);
vm.runInContext(SIM + '\nfunction mk(seed){let x=seed;return()=>(x=(x*16807)%2147483647)/2147483647;}', ctx);
const R = code => vm.runInContext(code, ctx);
// 1) une vague du milieu de partie, en Normal : la file d'attente
const q = R(`(() => {
  const s = newSim('feu', mk(4242), {}, 'normal');
  for (let n = 0; n < 4; n++) { startWave(s); s.queue.length = 0; s.enemies.length = 0; s.phase = 'prep'; s.next = genWave(s, s.wave + 1); }
  const nx = s.next.map(g => ({ path: g.path, el: g.el, n: g.count })), arc = s.varc.slice();
  startWave(s);
  return { nx, arc, q: s.queue.filter(e => !e.boss).map(e => ({ t: e.t, a: e.a, el: e.el, p: e.path })) };
})()`);
const ts = q.q.map(e => e.t),
  gaps = ts.slice(1).map((t, i) => t - ts[i]),
  oct = new Set(q.q.map(e => Math.floor(((Math.atan2(Math.sin(e.a), Math.cos(e.a)) + Math.PI) / (2 * Math.PI)) * 8) % 8)),
  sects = new Set(q.q.map(e => e.p)),
  chg = q.q.slice(1).filter((e, i) => e.el !== q.q[i].el).length,
  els = new Set(q.q.map(e => e.el)),
  jump = q.q.slice(1).map((e, i) => Math.abs(Math.atan2(Math.sin(e.a - q.q[i].a), Math.cos(e.a - q.q[i].a))));
ok(
  "l'aperçu de la vague 5 n'est plus rangé par chemin (groupes « de partout »), et l'arc annoncé fait tout le tour (" + q.arc[1].toFixed(2) + ' rad)',
  q.nx.length && q.nx.every(g => g.path === -1) && q.arc[1] >= 6.28
);
ok(
  'un par un : ' + ts.length + ' sorties, jamais deux ensemble (écart le plus court ' + Math.min(...gaps).toFixed(2) + ' s, moyen ' + (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2) + ' s)',
  ts.length > 10 && Math.min(...gaps) > 0.05
);
ok('tout autour de la côte : ' + oct.size + ' huitièmes de l\'île sur 8, les trois secteurs', oct.size >= 7 && sects.size === 3);
ok(
  'deux sorties de suite tombent loin l\'une de l\'autre (écart moyen ' + (jump.reduce((a, b) => a + b, 0) / jump.length).toFixed(2) + ' rad)',
  jump.reduce((a, b) => a + b, 0) / jump.length > 1
);
ok('éléments mêlés : ' + els.size + ' éléments, ' + chg + ' changements d\'élément sur ' + (q.q.length - 1) + ' sorties', els.size < 2 || chg > (q.q.length - 1) * 0.3);
// 2) première vague : un côté de l'île (180°), et les ennemis surgissent de la mer
const w1 = R(`(() => {
  const s = newSim('feu', mk(77), {}, 'hard');
  const arc = s.varc.slice();
  startWave(s);
  const firsts = [], landed = {};
  let maxBoat = 0;
  for (let k = 0; k < 30 * 25; k++) {
    step(s, 1 / 30, { f: 0, r: 0 });
    for (const e of s.enemies) {
      if (!firsts.some(f => f.id === e.id)) firsts.push({ id: e.id, r: Math.hypot(e.x, e.z), gy: e.gy, a: Math.atan2(e.z, e.x) });
      if (!e.sea && WALK[cellOf(e.x, e.z)]) landed[e.id] = 1;
    }
  }
  const b0 = boatAt(0, 0), b1 = boatAt(0, 60);
  return { arc, firsts, landed: Object.keys(landed).length, boat: Math.hypot(b0[0] - b1[0], b0[1] - b1[1]), boatR: Math.hypot(b1[0], b1[1]) };
})()`);
const dev = w1.firsts.map(f => Math.abs(Math.atan2(Math.sin(f.a - w1.arc[0]), Math.cos(f.a - w1.arc[0]))));
ok(
  'vague 1 : ils viennent d\'un côté de l\'île (arc de ' + Math.round((w1.arc[1] * 180) / Math.PI) + '°, écart au centre au plus ' + Math.round((Math.max(...dev) * 180) / Math.PI) + '°)',
  Math.abs(w1.arc[1] - Math.PI) < 0.01 && Math.max(...dev) < w1.arc[1] / 2 + 0.35
);
ok(
  'ils surgissent de la mer (au large à ' + Math.min(...w1.firsts.map(f => f.r)).toFixed(0) + ' m au moins, sous l\'eau : ' + Math.max(...w1.firsts.map(f => f.gy)).toFixed(1) + ' m) puis prennent pied sur l\'île (' + w1.landed + ' / ' + w1.firsts.length + ')',
  w1.firsts.length >= 5 && w1.firsts.every(f => f.r > R_ISLE_OK() && f.gy < -1) && w1.landed >= 3
);
function R_ISLE_OK() {
  return R('R_ISLE') + 4;
}
ok('les navires croisent au large (' + w1.boat.toFixed(0) + ' m parcourus en une minute, à ' + w1.boatR.toFixed(0) + ' m du centre) : personne n\'en débarque', w1.boat > 30 && w1.boatR > 140);
// 3) les murs ne ferment jamais l'île : on mure la côte sauf un quart (100°), puis un mur qui en boucherait une partie est refusé ; ailleurs, on bâtit
const ring = R(`(() => {
  const s = newSim('feu', mk(5), {}, 'hard');
  s.gold = 1e6;
  for (let i = 0; i < GN * GN; i++) {
    const x = cellX(i), z = cellZ(i), r = Math.hypot(x, z), a = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
    if (WALK[i] && r >= 103 && r <= 113 && !(a > 0 && a < 100)) s.wallSet[i] = 1; // comme une colline : hors du compte des murs
  }
  refield(s);
  const open = coastOpen(s.field),
    P = d => [Math.cos((d * Math.PI) / 180) * 112.5, Math.sin((d * Math.PI) / 180) * 112.5],
    a = P(2), b = P(33),
    c1 = checkWalls(s, a[0], a[1], b[0], b[1]),
    c2 = checkWalls(s, -40, 10, -40, 22);
  return { open, w1: c1.why, w2: c2.why };
})()`);
ok('une côte presque murée garde son dernier quart : le mur qui le boucherait est refusé (« ' + ring.w1 + ' » ; ' + ring.open + ' points de côte ouverts), un mur à l\'intérieur passe (« ' + ring.w2 + ' »)', ring.w1 === 'Bloquerait le passage' && ring.open >= 12 && ring.w2 === '');
// audit V2.0 (problèmes 1 et 4) : un ennemi encore dans la mer ne fait pas refuser un mur ; toute plage donnée à un ennemi mène au cœur
const wade = R(`(() => {
  const s = newSim('feu', mk(77), {}, 'normal');
  s.gold = 1e5; s.god = true;
  startWave(s);
  let k = 0;
  while (!s.enemies.some(e => e.sea && e.fm) && k++ < 3000) step(s, 1 / 30, { f: 0, r: 0 });
  let why = null;
  for (let a = 0; a < 6.28 && why === null; a += 0.3) {
    const x = Math.cos(a) * 52, z = Math.sin(a) * 52, c = checkWalls(s, x, z, x + 8, z);
    if (!c.why || c.why === 'Enfermerait des ennemis') why = c.why || '';
  }
  let cut = 0;
  for (let d = 0; d < 360; d += 3) { const L = landAt(s, (d * Math.PI) / 180); if (s.field[cellOf(L[0], L[1])] >= 1e8) cut++; }
  return { sea: s.enemies.some(e => e.sea && e.fm), why, cut };
})()`);
ok('un ennemi encore dans la mer ne fait pas refuser un mur (« ' + wade.why + ' ») ; plages coupées du cœur : ' + wade.cut, wade.sea && wade.why === '' && wade.cut === 0);
// 4) deux esclaves, de l'or : ils creusent et murent
const sl = R(`(() => {
  const s = newSim('feu', mk(31), {}, 'hard');
  s.heroGod = true;
  ['eau', 'bois'].forEach((el, j) => { const o = botMake(s, 10 + j, el, {}); o.hired = 1; s.others['bot' + (10 + j)] = o; });
  const w0 = s.walls.length;
  let pt = 0;
  for (let k = 0; k < 30 * 400 && s.wave < 6 && !s.over; k++) {
    if (s.phase === 'prep') { pt += 1 / 30; if (pt > 14) { pt = 0; s.gold += 500; startWave(s); } }
    step(s, 1 / 30, { f: 0, r: 0 });
  }
  return { walls: s.walls.length - w0, pits: s.pits.length, ring: ringOf(s).filter(A => lineCells(cellOf(A.a[0], A.a[1]), cellOf(A.b[0], A.b[1])).every(i => s.wallSet[i])).length, wave: s.wave };
})()`);
ok('deux esclaves en 5 vagues : ' + sl.walls + ' cases de mur, ' + sl.pits + ' cases de fosse, ' + sl.ring + ' pans de la ceinture', sl.walls >= 12 && sl.pits >= 10 && sl.ring >= 2);
// 5) dans la page : l'aperçu par élément, d'où ils viennent
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.addInitScript(() => (window.ILE_LOBBY = { heros: 'feu', mode: 'normal' }));
  await p.goto('file://' + path.resolve('construit/test.html'));
  await p.waitForTimeout(1200);
  const t = await p.evaluate(() => document.getElementById('wave').innerText.replace(/\s+/g, ' '));
  ok('l\'aperçu dit d\'où ils viennent et ce qui arrive, par élément (« ' + t.slice(0, 90) + ' »)', /Est|Ouest|Nord|Sud|Partout/i.test(t) && /(Feu|Eau|Bois|Terre|Élec) ×\d/.test(t) && !/rien/.test(t));
  await b.close();
  console.log('runvagues : ' + bad + ' raté(s) · erreurs ' + errs.length + (errs.length ? ' ' + errs.join(' | ') : ''));
  process.exit(bad ? 1 : 0);
})();
