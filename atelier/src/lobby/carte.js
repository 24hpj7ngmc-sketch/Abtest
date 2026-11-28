// [lobby/carte.js] La carte du lobby : mini-carte, grande carte et options.
// ---- la carte du lobby : on touche la mini-carte (en haut à gauche, comme en partie) pour voir l'île en grand ; les petits réglages y sont rangés
const mg = $('mini').getContext('2d'),
  mapC = $('mapC'),
  mapG = mapC.getContext('2d');
const LMC = {
  hall: '#ffcf5a',
  maison: '#7cf07a',
  musee: '#c9a2ff',
  armes: '#ff8a6a',
  shop: '#6fc8ff',
  mine: '#ffe9a8',
  taverne: '#ffb26b',
  verger: '#9be27a'
};
function lobView() {
  let r = 50;
  const f = (x, z) => {
    const d = Math.hypot(x, z) + 16;
    if (d > r) r = d;
  };
  for (const B of save.vil) if (CAT[B.t].act) f(B.x, B.z);
  for (const G of LGAMES) f(G.x, G.z);
  f(LB.x, LB.z);
  return Math.min(r, RI + 8);
}
function lobMini(g, px, big) {
  const S = 208,
    k = S / 2 / lobView(),
    X = x => S / 2 + x * k,
    Z = z => S / 2 + z * k;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, px, px);
  g.setTransform(px / 208, 0, 0, px / 208, 0, 0);
  g.lineJoin = g.lineCap = 'round';
  g.save();
  g.beginPath();
  g.arc(S / 2, S / 2, S / 2, 0, 7);
  g.clip();
  g.fillStyle = 'rgba(111,181,101,.85)';
  g.beginPath();
  g.arc(S / 2, S / 2, RI * k, 0, 7);
  g.fill();
  if (MASS.h > 3) {
    g.fillStyle = 'rgba(128,120,160,.9)';
    g.beginPath();
    g.arc(X(MASS.x), Z(MASS.z), MASS.r * k, 0, 7);
    g.fill();
  }
  g.strokeStyle = '#e4dcf6';
  g.lineWidth = big ? 1.5 : 2.6;
  g.beginPath();
  for (const e of ROADS.edges) {
    g.moveTo(X(e.ax), Z(e.az));
    g.lineTo(X(e.bx), Z(e.bz));
  }
  g.stroke();
  g.strokeStyle = '#10202a';
  g.lineWidth = 1.5;
  for (const B of save.vil) {
    const C = CAT[B.t],
      a = X(B.x),
      b = Z(B.z);
    if (!C.act) {
      if (big) {
        g.fillStyle = 'rgba(16,32,42,.55)';
        g.fillRect(a - 0.9, b - 0.9, 1.8, 1.8);
      }
      continue;
    }
    const r = B.t === 'hall' ? (big ? 5 : 8) : big ? 3.6 : 6;
    g.fillStyle = LMC[C.act] || '#ecf7f8';
    g.beginPath();
    if (B.t === 'hall') {
      g.moveTo(a, b - r);
      g.lineTo(a + r, b);
      g.lineTo(a, b + r);
      g.lineTo(a - r, b);
      g.closePath();
    } else g.rect(a - r * 0.8, b - r * 0.8, r * 1.6, r * 1.6);
    g.fill();
    g.stroke();
    if (hvLabel(B)) {
      g.strokeStyle = '#ffcf5a';
      g.lineWidth = big ? 1.6 : 3;
      g.beginPath();
      g.arc(a, b, r + (big ? 3.5 : 6), 0, 7);
      g.stroke();
      g.strokeStyle = '#10202a';
      g.lineWidth = 1.5;
    }
  } // cercle doré : quelque chose à ramasser
  if (GUIDE.g) {
    const a = X(GUIDE.x),
      b = Z(GUIDE.z),
      r = big ? 3 : 5;
    g.fillStyle = '#ffcf5a';
    g.beginPath();
    g.moveTo(a, b - r);
    g.lineTo(a + r, b);
    g.lineTo(a, b + r);
    g.lineTo(a - r, b);
    g.closePath();
    g.fill();
    g.stroke();
  }
  if (GD && GD.p) {
    const a = X(GD.p[0]),
      b = Z(GD.p[1]),
      r = (big ? 6 : 11) + (big ? 2 : 4) * Math.sin(performance.now() / 260);
    g.strokeStyle = '#ffcf5a';
    g.lineWidth = big ? 2 : 3.5;
    g.beginPath();
    g.arc(a, b, r, 0, 7);
    g.stroke();
    g.strokeStyle = '#10202a';
    g.lineWidth = 1.5;
  }
  for (const G of LGAMES) {
    const a = X(G.x),
      b = Z(G.z);
    g.fillStyle = G.open ? '#7ff3ff' : '#6c6480';
    g.beginPath();
    g.arc(a, b, big ? 4 : 6.5, 0, 7);
    g.fill();
    g.stroke();
  }
  for (const k in LN.av) {
    const o = LN.av[k];
    g.fillStyle = elc(o.ee || o.el);
    g.strokeStyle = '#fff';
    g.lineWidth = big ? 1 : 2;
    g.beginPath();
    g.arc(X(o.x), Z(o.z), big ? 3 : 5.5, 0, 6.283);
    g.fill();
    g.stroke();
  }
  g.save();
  g.translate(X(LB.x), Z(LB.z));
  g.rotate(-LB.yaw);
  if (big) g.scale(0.6, 0.6);
  g.fillStyle = '#fff';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -10);
  g.lineTo(7, 8);
  g.lineTo(0, 4);
  g.lineTo(-7, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  if (big) {
    g.font = '700 6px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(8,28,38,.9)';
    g.fillStyle = '#ecf7f8';
    // un nom ne recouvre jamais un autre : on essaie au-dessus, en dessous, puis plus loin
    const used = [],
      lab = (n, x, y) => {
        const w = g.measureText(n).width / 2 + 2;
        for (const dy of [-7, 11, -15, 19, -23]) {
          const yy = y + dy;
          if (!used.some(u => Math.abs(u[0] - x) < u[2] + w && Math.abs(u[1] - yy) < 7.5)) {
            used.push([x, yy, w]);
            g.strokeText(n, x, yy);
            g.fillText(n, x, yy);
            return;
          }
        }
      };
    for (const G of LGAMES) lab(G.n, X(G.x), Z(G.z));
    for (const B of save.vil) {
      const C = CAT[B.t];
      if (C.act) lab(C.n.toUpperCase(), X(B.x), Z(B.z));
    }
  }
  g.restore();
  g.font = '700 ' + (big ? 9 : 21) + "px 'Chakra Petch',sans-serif";
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = big ? 2.5 : 5;
  g.strokeStyle = 'rgba(8,28,38,.9)';
  g.fillStyle = '#fff';
  const cr = big ? 99 : 88;
  [
    ['N', 0, -1],
    ['E', 1, 0],
    ['S', 0, 1],
    ['O', -1, 0]
  ].forEach(c => {
    const x = S / 2 + c[1] * cr,
      y = S / 2 + c[2] * cr + 1;
    g.strokeText(c[0], x, y);
    g.fillText(c[0], x, y);
  });
  g.textBaseline = 'alphabetic';
}
function lobBig() {
  const b = $('mapBox'),
    s = Math.max(120, Math.min(b.clientWidth, b.clientHeight)) + 'px';
  if (mapC.style.width !== s) mapC.style.width = mapC.style.height = s;
  lobMini(mapG, 720, true);
}
function lobMapDraw() {
  const act = save.vil.filter(B => CAT[B.t].act).length;
  $('mapOpt').innerHTML =
    `<h2>Île céleste</h2><p>Évolution ${save.evo || 1} / 6 · ${act} bâtiment${act > 1 ? 's' : ''} · ${$('lVer').textContent}</p>
    <button class="ob" data-a="snd"><span>Son</span><b>${save.snd === false ? 'coupé' : 'activé'}</b></button>
    <button class="ob" data-a="fire"><span>Mode de tir</span><b>${FM[fireMode()]}</b></button>
    <button class="ob" data-a="aj"><span>Saut auto</span><b>${save.aj ? 'oui' : 'non'}</b></button>
    <button class="ob" data-a="devm"><span>Mode dev</span><b>${save.dev ? 'activé' : 'désactivé'}</b></button>
    <button class="ob" data-a="net"><span>Multi</span><b>${netLine()}</b></button>
    ${save.dev && !VISIT.on ? '<button class="ob" data-a="dev"><span>Outils dev</span></button>' : ''}
    <button class="solid" data-a="close">Reprendre</button>`;
  $('mapOpt')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a;
          if (a === 'snd') sndToggle();
          else if (a === 'fire') fireNext();
          else if (a === 'aj') {
            save.aj = !save.aj;
            persist();
          } else if (a === 'devm') {
            devToggle();
            lobSync();
          } else if (a === 'dev') {
            $('mapV').hidden = true;
            $('lDevP').hidden = false;
            ldevDraw();
            return;
          } else if (a === 'net') {
            $('mapV').hidden = true;
            netOpen();
            return;
          } else if (a === 'close') {
            $('mapV').hidden = true;
            return;
          }
          lobMapDraw();
        })
    );
}
function lobMapOpen(e) {
  if (e) e.preventDefault();
  if (lobOv()) return;
  lGuard = performance.now() + 450;
  $('lDevP').hidden = true;
  $('mapV').hidden = false;
  lobMapDraw();
  lobBig();
  SND.play('tick');
}
$('mini').onpointerdown = e => {
  if (LB.on) lobMapOpen(e);
};
