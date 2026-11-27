// [interface/hud.js] L'état de la partie côté page (sim, outil en main), la barre d'outils, la roulette des éléments, les entrées, les textes du HUD.
// ---------- état & HUD ----------
let sim = null,
  running = false,
  nearT = null,
  nearA = null,
  toastT = 0,
  placing = false,
  gx = 0,
  gz = 0,
  gWhy = '',
  placeType = 'mortier',
  gKey = '',
  gChk = { why: '', all: [], cells: [], cost: 0 },
  wallA = -1;
const isLine = k => k === 'mur' || k === 'pelle',
  gold = c => (c < 0 ? '+' + -c : c) + ' or';
// ---------- barre d'outils : trois objets, toujours un en main ----------
// Pistolet : on tire. Pelle : creuser ou monter un mur. Marteau : construire une défense. On ne tire qu'avec le pistolet.
const TOOLS = { pistolet: 'Pistolet', pelle: 'Pelle', marteau: 'Marteau' },
  hotSlots = [];
let tool = 'pistolet',
  hamType = 'mortier',
  shMode = 'pelle',
  swing = 0;
// Changer d'arme en partie (V9.9) : l'outil Arme en main, la sous-barre propose les armes de ce mini-jeu. Le profil et l'arbre de l'ancienne arme sortent des réglages du héros, ceux de la nouvelle y entrent.
function gameWeap(w) {
  if (!running || !sim || !WT[w] || w === tWeap || (arsenal.length && !armOf(w))) return;
  const el = sim.hero.el,
    o = heroMods(el);
  setWeap(w);
  const n = heroMods(el);
  for (const k of new Set(Object.keys(o).concat(Object.keys(n))))
    sim.m[k] = (sim.m[k] || 0) + (n[k] || 0) - (o[k] || 0);
  aimSet(false);
  fireQ = false;
  $('hot').querySelector('.slot[data-t=pistolet] small').textContent = WT[w].short;
  armApply();
  drawSub();
  if (!$('armV').hidden) armDraw();
}
function drawSub() {
  const el = $('sub');
  if (tool === 'pistolet') {
    const L = arsenal.length ? arsenal : Object.keys(WT).map(w => ({ w, el: '' })); // V2.0 : seulement les armes choisies au début, à la couleur de leur élément
    el.hidden = L.length < 2;
    el.innerHTML = L.map(
      o =>
        `<button class="tchip wch${o.w === tWeap ? ' sel' : ''}" data-w="${o.w}"${o.el ? ` style="--c:${EL[o.el].c}"` : ''}>${WT[o.w].short}${o.el ? ' · ' + EL[o.el].n : ''}</button>`
    ).join('');
    el.querySelectorAll('.tchip').forEach(b =>
      b.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        gameWeap(b.dataset.w);
      })
    );
    return;
  }
  el.hidden = false;
  const opts =
    tool === 'marteau'
      ? TKEYS.map(k => [k, TYPES[k].s])
      : [
          ['pelle', 'Fosse'], // le même mot que dans le ciel (audit écran n° 21)
          ['mur', 'Mur']
        ];
  el.innerHTML = opts
    .map(o => `<button class="tchip${o[0] === placeType ? ' sel' : ''}" data-k="${o[0]}">${o[1]} · <b></b></button>`)
    .join('');
  el.querySelectorAll('.tchip').forEach(b =>
    b.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      const k = b.dataset.k;
      if (tool === 'marteau') hamType = k;
      else shMode = k;
      placeType = k;
      wallA = -1;
      gKey = '';
      drawSub();
    })
  );
}
function setTool(k) {
  if (k !== tool) aimSet(false);
  tool = k;
  placing = k !== 'pistolet';
  wallA = -1;
  gKey = '';
  if (placing) placeType = k === 'marteau' ? hamType : shMode;
  drawSub();
}
$('hot').innerHTML = Object.keys(TOOLS)
  .map(
    k =>
      `<button class="slot" data-t="${k}"><canvas width="48" height="48"></canvas><small>${TOOLS[k]}</small></button>`
  )
  .join('');
$('hot')
  .querySelectorAll('.slot')
  .forEach(b => {
    const k = b.dataset.t,
      g = b.querySelector('canvas').getContext('2d');
    hotSlots.push(b);
    g.fillStyle = '#ecf7f8';
    g.beginPath();
    if (k === 'pelle') {
      g.rect(21, 4, 6, 22);
      g.moveTo(10, 24);
      g.lineTo(38, 24);
      g.lineTo(34, 38);
      g.lineTo(24, 45);
      g.lineTo(14, 38);
      g.closePath();
    } else if (k === 'marteau') {
      g.rect(7, 6, 34, 15);
      g.rect(21, 21, 6, 23);
    } else {
      g.rect(5, 13, 38, 11);
      g.rect(9, 24, 11, 17);
    }
    g.fill();
    b.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (!running) return;
      if (tool === k) {
        wallA = -1;
        gKey = '';
        return;
      }
      setTool(k);
    });
  }); // retoucher la pelle efface le point A
// ---------- roulette des éléments : pose (outil en main) ou amélioration (près d'une défense), sans arrêter le jeu ----------
let wheelCtx = null,
  wheelAdv = -1;
const WPOS = [
  [258, 24],
  [248, 74],
  [229, 121],
  [201, 164],
  [165, 200],
  [122, 228]
]; // un second arc, plus large que celui des petits boutons ; le Vent (V2.1) prend une sixième place, au même pas, au bout de l'arc
function wheelGo(k) {
  const w = wheelCtx,
    e = ELS[k];
  if (!w || !running || !e) return;
  const c = w.els.filter(x => x === e).length;
  if (w.why) {
    toast(w.why);
    return;
  }
  if (c >= MAXLV) {
    toast('Niveau maximum');
    return;
  }
  if (!c && new Set(w.els).size >= MAXEL) {
    toast('Déjà 3 éléments');
    return;
  }
  if (sim.gold < w.cost) {
    toast("Pas assez d'or");
    return;
  }
  if (w.place) send(['pl', TKEYS.indexOf(w.type), r1(gx), r1(gz), k]);
  else send(['up', w.t.id, k]);
}
const wheelB = ELS.map((e, k) => {
  const b = document.createElement('button');
  b.className = 'wb';
  b.style.setProperty('--c', elc(e));
  b.style.right = WPOS[k][0] - 23 + 'px';
  b.style.bottom = WPOS[k][1] - 23 + 'px';
  b.innerHTML = `${EL[e].n}<small></small>`;
  b.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    wheelGo(k);
  });
  $('wheel').appendChild(b);
  return b;
});
function drawWheel(w) {
  const nd = new Set(w.els).size,
    cn = e => w.els.filter(x => x === e).length,
    poor = sim.gold < w.cost,
    wl = $('wheelL'),
    adv = w.why ? null : advise(sim, w.place ? gx : w.t.x, w.place ? gz : w.t.z, w.els);
  let nx = null;
  ELS.forEach((e, k) => {
    const c = cn(e),
      full = c >= MAXLV,
      noRoom = !c && nd >= MAXEL,
      b = wheelB[k],
      lab = full ? 'max' : noRoom ? 'complet' : w.place ? 'poser' : c ? c + ' → ' + (c + 1) : 'ajouter';
    if (b._l !== lab) {
      b._l = lab;
      b.lastChild.textContent = lab;
    }
    b.classList.toggle('off', full || noRoom || poor || !!w.why);
    b.classList.toggle('adv', !!adv && adv.el === e);
    if (c === MAXLV - 1 && !nx) nx = e;
  });
  wheelAdv = w.why ? -1 : adv ? ELS.indexOf(adv.el) : ELS.findIndex(e => cn(e) < MAXLV && (cn(e) > 0 || nd < MAXEL)); // l'élément que pose ou monte le bouton Action
  setTxt(
    'wheelL',
    '',
    w.why ||
      TYPES[w.type].s +
        ' · ' +
        w.cost +
        ' or' +
        (poor
          ? ' · il manque ' + (w.cost - sim.gold)
          : adv
            ? ' · conseil : ' +
              EL[adv.el].n +
              (BEATS[adv.el] === adv.vs
                ? ' contre ' + EL[adv.vs].n + ' (' + adv.share + ' %)'
                : ", le mieux qu'il reste")
            : nx
              ? ' · ' + EL[nx].n + ' 3 : ' + FXN[w.type][nx]
              : '')
  );
  const warn = !!w.why || poor;
  if (wl._w !== warn) {
    wl._w = warn;
    wl.classList.toggle('warn', warn); // pose refusée ou or qui manque : en orange
  }
}
const inp = { f: 0, r: 0, fire: false, jump: false, sneak: false, sprint: false };
const joy = { id: null, x0: 0, y0: 0, f: 0, r: 0, full: 0 };
const looks = {};
let fireTouch = false,
  jumpQ = false,
  jumpHeld = false,
  sneakHeld = false;
const flying = () => !!(save.dev && dev.fly);
const cache = {};
function setTxt(id, sel, v) {
  const k = id + sel;
  if (cache[k] === v) return;
  cache[k] = v;
  (sel ? $(id).querySelector(sel) : $(id)).textContent = v;
}
function toast(t) {
  $('toast').textContent = t;
  $('toast').classList.add('on');
  toastT = 2.2;
}
function chip(g) {
  if (g.boss)
    return `<span class="chip boss" style="--c:${elc(g.el)}"><i></i>${BN[g.bt || 1].toUpperCase()} ${EL[g.el].n}</span>`;
  if (g.hidden) return `<span class="chip"><i></i>? ×${g.count}</span>`;
  return `<span class="chip" style="--c:${elc(g.el)}"><i></i>${KINDS[g.k] && KINDS[g.k].n ? KINDS[g.k].n + ' ' : ''}${EL[g.el].n} ×${g.count}</span>`;
}
// l'aperçu de la vague (V2.0) : d'où ils viendront (de partout, ou d'un côté de l'île aux vagues 1 et 2), puis les ennemis par élément, tous mêlés
const COTES = ['Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest', 'Nord', 'Nord-Est'],
  coteOf = a => COTES[((Math.round(a / 0.7854) % 8) + 8) % 8];
function apercuRows() {
  const A = sim.varc || [0, 6.2832],
    m = {};
  for (const g of sim.next || []) {
    const k = [g.el, g.k, g.hidden ? 1 : 0, g.boss ? g.bt || 1 : 0].join();
    if (m[k]) m[k].count += g.count;
    else m[k] = Object.assign({}, g);
  } // deux groupes pareils (même élément, même type) n'en font qu'un
  const gs = Object.values(m).sort((a, b) => (b.boss ? 1e3 : b.count) - (a.boss ? 1e3 : a.count)),
    lim = cielWant() ? 2 : 99, // dans le ciel, une seule rangée : les deux plus gros groupes, puis « +N » ennemis (audit écran n° 7)
    more = gs.slice(lim).reduce((n, g) => n + (g.boss ? 1 : g.count), 0);
  return `<div class="wr"><span class="wp">${A[1] >= 6.28 ? 'Partout' : coteOf(A[0])}</span><span class="wc">${gs
    .slice(0, lim)
    .map(chip)
    .join('')}${more ? `<span class="chip more">+${more}</span>` : ''}</span></div>`;
}
let wavePhase = '';
function drawWave() {
  const w = $('wave'),
    tu = tutoHTML();
  if (sim.phase === 'prep') {
    const n = sim.wave + 1;
    if (tuto && tuto.i < 2) w.innerHTML = tu;
    else
      w.innerHTML =
        tu +
        `<div class="wh">Vague ${n} · <span id="wT">aperçu</span></div>` + // dans le ciel, « dans 29 s » (interface/ciel.js)
        apercuRows() +
        (tuto && tuto.i >= 4 && !cielWant() ? `<button id="go">Lancer la vague</button>` : ''); // V2.0 : la vague part par « Prêt » dans la vue du ciel (le tuto aussi, à ses étapes « ciel »)
    if ($('go')) $('go').onpointerdown = () => send(['go']);
  } else
    w.innerHTML =
      tu +
      `<div id="objL" hidden></div><div id="bossL" hidden><span id="bossN"></span><div class="bbar"><i id="bossF"></i></div></div>`; // « Vague N » et les ennemis restants sont dans les chiffres en haut à droite (V1.2)
}
