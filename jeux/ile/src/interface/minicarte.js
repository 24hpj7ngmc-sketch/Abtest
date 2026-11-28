// [interface/minicarte.js] La mini-carte de la partie.
// ---------- mini-carte ----------
const mg = $('mini').getContext('2d');
let miniT = 0;
const HCELL = [];
for (let i = 0; i < GN * GN; i++) if (HILL[i]) HCELL.push(i);
const miniBg = {}; // fond de carte par taille (208 : mini-carte, 720 : grande carte) : île, routes et collines ne changent jamais
function miniBack(px) {
  let c = miniBg[px];
  if (c) return c;
  c = miniBg[px] = document.createElement('canvas');
  c.width = c.height = px;
  const mg = c.getContext('2d'),
    S = 208,
    k = S / 2 / (R_ISLE + 8),
    X = x => S / 2 + x * k,
    Z = z => S / 2 + z * k;
  mg.setTransform(px / 208, 0, 0, px / 208, 0, 0);
  mg.fillStyle = 'rgba(111,181,101,.85)';
  mg.beginPath();
  mg.arc(S / 2, S / 2, R_ISLE * k, 0, 7);
  mg.fill();
  mg.strokeStyle = '#d9b98a';
  mg.lineWidth = 4;
  mg.lineJoin = 'round';
  for (const p of PATHS) {
    mg.beginPath();
    p.pts.forEach((q, i) => (i ? mg.lineTo(X(q[0]), Z(q[1])) : mg.moveTo(X(q[0]), Z(q[1]))));
    mg.stroke();
  }
  for (const i of HCELL) {
    mg.fillStyle = HILL[i] > 2 ? '#3f7a44' : HILL[i] > 1 ? '#4c8a4c' : '#5a9a55';
    mg.fillRect(X(cellX(i)) - 1.75, Z(cellZ(i)) - 1.75, 3.5, 3.5);
  }
  return c;
}
function drawMini(mg, px, big) {
  const S = 208,
    k = S / 2 / (R_ISLE + 8),
    X = x => S / 2 + x * k,
    Z = z => S / 2 + z * k;
  mg.setTransform(1, 0, 0, 1, 0, 0);
  mg.clearRect(0, 0, px, px);
  mg.drawImage(miniBack(px), 0, 0);
  mg.setTransform(px / 208, 0, 0, px / 208, 0, 0);
  mg.lineJoin = 'round';
  mg.fillStyle = '#4a3524';
  for (const i of sim.pits) mg.fillRect(X(cellX(i)) - 1.7, Z(cellZ(i)) - 1.7, 3.4, 3.4);
  mg.fillStyle = '#39424a';
  for (const i of sim.walls) mg.fillRect(X(cellX(i)) - 1.7, Z(cellZ(i)) - 1.7, 3.4, 3.4);
  mg.fillStyle = '#7ff3ff';
  mg.beginPath();
  mg.arc(S / 2, S / 2, 6, 0, 7);
  mg.fill();
  {
    const a = X(RULEP[0]),
      b = Z(RULEP[1]);
    mg.fillStyle = '#ffcf5a';
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    mg.moveTo(a, b - 4);
    mg.lineTo(a + 4, b);
    mg.lineTo(a, b + 4);
    mg.lineTo(a - 4, b);
    mg.closePath();
    mg.fill();
    mg.stroke();
  }
  {
    const a = X(HIREP[0]),
      b = Z(HIREP[1]);
    mg.fillStyle = '#c79bff';
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    mg.moveTo(a, b - 5);
    mg.lineTo(a + 5, b);
    mg.lineTo(a, b + 5);
    mg.lineTo(a - 5, b);
    mg.closePath();
    mg.fill();
    mg.stroke();
  }
  {
    const a = X(ARMP[0]),
      b = Z(ARMP[1]);
    mg.fillStyle = '#ff9a5a';
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    mg.moveTo(a, b - 5);
    mg.lineTo(a + 5, b);
    mg.lineTo(a, b + 5);
    mg.lineTo(a - 5, b);
    mg.closePath();
    mg.fill();
    mg.stroke();
  }
  {
    const a = X(SHOP[0]),
      b = Z(SHOP[1]);
    mg.fillStyle = '#ffcf5a';
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    mg.moveTo(a, b - 5);
    mg.lineTo(a + 5, b);
    mg.lineTo(a, b + 5);
    mg.lineTo(a - 5, b);
    mg.closePath();
    mg.fill();
    mg.stroke();
  }
  for (const p of sim.pups) {
    if (p.t < 6 && Math.sin(sim.t * 10) < 0) continue;
    const a = X(p.x),
      b = Z(p.z),
      r = 7 + Math.sin(sim.t * 5) * 1.5;
    mg.fillStyle = PUPS[p.k].c;
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = i * 0.7854,
        q = i % 2 ? r * 0.45 : r;
      mg[i ? 'lineTo' : 'moveTo'](a + Math.sin(an) * q, b - Math.cos(an) * q);
    }
    mg.closePath();
    mg.fill();
    mg.stroke();
  }
  for (const t of sim.towers) {
    mg.fillStyle = elc(t.els[0]);
    mg.strokeStyle = '#10202a';
    mg.lineWidth = 1.5;
    mg.beginPath();
    const a = X(t.x),
      b = Z(t.z);
    if (t.type === 'canon') mg.arc(a, b, 8, 0, 7);
    else if (t.type === 'archer') {
      mg.moveTo(a, b - 10);
      mg.lineTo(a + 9, b + 7);
      mg.lineTo(a - 9, b + 7);
      mg.closePath();
    } else mg.rect(a - 7, b - 7, 14, 14);
    mg.fill();
    mg.stroke();
    mg.fillStyle = '#10202a';
    mg.font = '700 13px sans-serif';
    mg.textAlign = 'center';
    mg.fillText(t.els.length, a, b + (t.type === 'archer' ? 6 : 4.5));
  }
  if (sim.phase === 'prep' && sim.next && sim.next.length) {
    // l'aperçu sur la côte : l'arc d'où ils viendront, coloré selon les éléments annoncés (un trait par ennemi, éléments mêlés)
    const A = sim.varc || [0, 6.2832],
      gs = sim.next.filter(g => !g.boss),
      cols = [];
    for (const g of gs) for (let i = 0; i < Math.min(g.count, 30); i++) cols.push(g.hidden ? '#ecf7f8' : elc(g.el));
    const N = Math.max(1, cols.length),
      full = A[1] >= 6.28,
      R = R_ISLE * 1.02,
      blink = Math.sin(sim.t * 6) > -0.3;
    if (blink)
      for (let i = 0; i < N; i++) {
        const f = (i * 0.6180339887) % 1,
          a = A[0] + (full ? f * 6.2832 : (f - 0.5) * A[1]);
        mg.fillStyle = cols[(i * 7) % N];
        mg.beginPath();
        mg.arc(X(Math.cos(a) * R), Z(Math.sin(a) * R), 4.5, 0, 7);
        mg.fill();
      }
    for (const g of sim.next.filter(q => q.boss)) {
      mg.fillStyle = elc(g.el);
      mg.beginPath();
      mg.arc(X(Math.cos(A[0]) * R), Z(Math.sin(A[0]) * R), 9, 0, 7);
      mg.fill();
    }
  }
  {
    const ship = (x, z, col, n) => {
        mg.fillStyle = col;
        mg.beginPath();
        mg.moveTo(x - 7, z + 1);
        mg.lineTo(x + 7, z + 1);
        mg.lineTo(x + 4.5, z + 5);
        mg.lineTo(x - 4.5, z + 5);
        mg.closePath();
        mg.fill();
        mg.beginPath();
        mg.moveTo(x - 0.5, z - 8);
        mg.lineTo(x + 6, z - 0.5);
        mg.lineTo(x - 0.5, z - 0.5);
        mg.closePath();
        mg.fill();
        if (n) {
          mg.font = '700 ' + (big ? 9 : 12) + 'px sans-serif';
          mg.textAlign = 'center';
          mg.fillStyle = '#fff';
          mg.fillText(String(n), x, z + (big ? 15 : 17));
        }
      },
      kk = (R_ISLE + 1) / VAGUES.boatR;
    BOATS.forEach((_, i) => {
      const P = boatAt(i, sim.t);
      ship(X(P[0] * kk), Z(P[1] * kk), sim.phase === 'wave' && sim.queue.length ? '#c9a2ff' : '#6c6480', 0);
    }); // les navires qui croisent au large (on ne débarque plus d'eux : le nombre d'ennemis à venir est en haut à droite)
  }
  for (const e of sim.enemies) {
    mg.fillStyle = elc(e.el);
    mg.beginPath();
    mg.arc(X(e.x), Z(e.z), e.boss ? 8 : e.bomb ? 6 : 5, 0, 7);
    mg.fill();
    // un contour sombre : un Bois sur l'herbe ou un Terre sur un chemin restent visibles ; les bombes gardent le leur, blanc
    mg.strokeStyle = e.bomb ? '#fff' : '#10202a';
    mg.lineWidth = 2;
    mg.stroke();
  }
  if (sim.obj && sim.obj.k !== 'bomb') {
    mg.strokeStyle = '#ffcf5a';
    mg.lineWidth = 2.5;
    mg.beginPath();
    mg.arc(X(sim.obj.x), Z(sim.obj.z), sim.obj.k === 'zone' ? 7 : 4, 0, 7);
    mg.stroke();
  }
  const h = sim.hero;
  mg.save();
  mg.translate(X(h.x), Z(h.z));
  mg.rotate(-h.yaw);
  mg.fillStyle = '#fff';
  mg.strokeStyle = '#10202a';
  mg.lineWidth = 2;
  mg.beginPath();
  mg.moveTo(0, -10);
  mg.lineTo(7, 8);
  mg.lineTo(0, 4);
  mg.lineTo(-7, 8);
  mg.closePath();
  mg.fill();
  mg.stroke();
  mg.restore();
  for (const k in sim.others) {
    const o = sim.others[k];
    mg.fillStyle = elc(elOf(o));
    mg.strokeStyle = '#fff';
    mg.lineWidth = 1.5;
    mg.beginPath();
    mg.arc(X(o.x), Z(o.z), 4.5, 0, 7);
    mg.fill();
    mg.stroke();
  } // coéquipiers
  if (big) {
    mg.font = '700 7px sans-serif';
    mg.textAlign = 'center';
    mg.fillStyle = '#ecf7f8';
    PATHS.forEach(p => mg.fillText(p.name.toUpperCase(), X(p.pts[0][0] * 0.8), Z(p.pts[0][1] * 0.8)));
  }
  mg.font = '700 ' + (big ? 9 : 21) + "px 'Chakra Petch',sans-serif";
  mg.textAlign = 'center';
  mg.textBaseline = 'middle';
  mg.lineWidth = big ? 2.5 : 5;
  mg.strokeStyle = 'rgba(8,28,38,.9)';
  mg.fillStyle = '#fff';
  const cr = big ? 99 : 88;
  [
    ['N', 0, -1],
    ['E', 1, 0],
    ['S', 0, 1],
    ['O', -1, 0]
  ].forEach(c => {
    const x = S / 2 + c[1] * cr,
      y = S / 2 + c[2] * cr + 1;
    mg.strokeText(c[0], x, y);
    mg.fillText(c[0], x, y);
  });
  mg.textBaseline = 'alphabetic';
}
