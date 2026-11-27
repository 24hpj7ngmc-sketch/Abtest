// [interface/armes.js] Les six armes telles que la partie les connaît (modèle, recul, zoom, profil de base), les bonus venus du lobby (heroMods), et le panneau du marchand.
// ---------- les armes ----------
// Les mêmes six armes dans tout le projet. Ici : ce que chacune est DANS L'ÎLE DES CINQ. `base` : son profil, ajouté aux réglages du héros (hCd cadence, hDmg dégâts, hLife portée,
// hCrit critique, hPierce traverse un ennemi, hMark marque, hPel/hSpread plombs en gerbe, hFlame/hCone cône de feu) ; le pistolet est la référence (profil vide).
// `vm` : le modèle en main (vm.<nom>) ; `kick` : le recul ; `zoom` : le grossissement en visée ; `scope` : lunette plein écran, tenir Tir vise et le coup part au relâcher.
// Les améliorations des armes et des héros sont au lobby : elles arrivent déjà additionnées dans LOBBY.bonus.mods[héros][arme].
const WT = {
  pistolet: { title: 'Pistolet', short: 'Pistolet', vm: 'pistolet', kick: 1, zoom: 1.35, base: {} },
  assaut: {
    title: "Fusil d'assaut",
    short: 'Assaut',
    vm: 'assaut',
    kick: 0.55,
    zoom: 1.5,
    base: { hCd: 0.55, hDmg: -0.42, hLife: -0.2, hCrit: -0.04 }
  },
  sniper: {
    title: 'Fusil de sniper',
    short: 'Sniper',
    vm: 'sniper',
    kick: 2.2,
    zoom: 4,
    scope: true,
    base: { hCd: -2.2, hDmg: 3.4, hLife: 1, hCrit: 0.13, hCritD: 0.5, hPierce: 1, hMark: 0.2 }
  },
  fusil: {
    title: 'Fusil',
    short: 'Fusil',
    vm: 'fusil',
    kick: 1,
    zoom: 1.5,
    base: { hCd: 0.14, hDmg: -0.29, hLife: 0.875, hCrit: -0.05 }
  },
  pompe: {
    title: 'Fusil à pompe',
    short: 'Pompe',
    vm: 'pompe',
    kick: 2.4,
    zoom: 1.25,
    base: { hCd: -2.9, hDmg: -0.557, hLife: -0.5, hCrit: -0.05, hPel: 8, hSpread: 0.075 }
  },
  lance: {
    title: 'Lance-flammes',
    short: 'Flammes',
    vm: 'lance',
    kick: 0.12,
    zoom: 1.1,
    base: { hCd: 0.68, hDmg: -0.73, hLife: -0.833, hCrit: -1, hFlame: 1, hCone: 0.38 }
  }
};
let tWeap = WT[LOBBY.arme] ? LOBBY.arme : 'pistolet'; // l'arme en main : choisie au lobby, changeable en partie (le lobby en est prévenu)
function setWeap(w) {
  if (!WT[w] || w === tWeap) return;
  tWeap = w;
  versLobby({ ile: 'arme', arme: w });
}
let tHero = save.last;
// les réglages d'un héros dans cette partie : ce que le lobby a calculé pour lui avec l'arme en main (arbres du héros, de l'arme, élément des balles), plus le profil de base de l'arme
function heroMods(el) {
  const B =
      LOBBY.bonus && typeof LOBBY.bonus === 'object' && LOBBY.bonus.mods && typeof LOBBY.bonus.mods === 'object'
        ? LOBBY.bonus.mods
        : {},
    t = B[el] && typeof B[el] === 'object' && B[el][tWeap] && typeof B[el][tWeap] === 'object' ? B[el][tWeap] : {},
    m = {};
  for (const k in t) if (Number.isFinite(+t[k])) m[k] = +t[k];
  for (const k in WT[tWeap].base) m[k] = (m[k] || 0) + WT[tWeap].base[k];
  // V2.2 : la voie du héros joué (opts.voie, 'a' ou 'b') ; seules les deux cases de sa branche comptent. Un autre héros (un esclave) joue son kit de base.
  const vo = el === LOBBY.heros && LOBBY.voie && typeof LOBBY.voie === 'object' ? LOBBY.voie.id : null;
  m.voA = vo === 'a' ? 1 : 0;
  m.voB = vo === 'b' ? 1 : 0;
  if (!m.voA) m.spA1 = m.spA2 = 0;
  if (!m.voB) m.spB1 = m.spB2 = 0;
  return m;
}
// le nom de la voie du héros joué, pour l'afficher (« Roc · Tank · Gardien »)
const voieNom = el =>
  el === LOBBY.heros && LOBBY.voie && typeof LOBBY.voie === 'object' && (LOBBY.voie.id === 'a' || LOBBY.voie.id === 'b')
    ? String(LOBBY.voie.nom || VOIEN[el][LOBBY.voie.id]).slice(0, 24)
    : '';
// ---------- le panneau du marchand : l'arbre de la partie (TREES.run), payé avec les points gagnés en jouant ----------
let tSel = null;
const tTree = () => TREES.run,
  tLv = id => sim.run[id] || 0,
  tCur = () => sim.pts,
  tCost = (tr, n, L) => (tr.grow ? n.cost * (L + 1) : n.cost);
function tPos(tr, n, s, o) {
  const C = { x: 470, y: 320 };
  if (!n) return C;
  const a = (tr.br[n.b || n].a * Math.PI) / 180,
    dx = Math.cos(a),
    dy = Math.sin(a);
  s = s || n.s;
  o = o === undefined ? n.o : o;
  return { x: C.x + (dx * s * 92 - dy * o * 80) * 1.2, y: C.y + (dy * s * 92 + dx * o * 80) * 0.82 };
}
function drawTree() {
  const tr = tTree(),
    by = {};
  tr.nodes.forEach(n => (by[n.id] = n));
  let svg = '',
    html = `<div class="tn root" style="left:470px;top:320px;--c:#7ff3ff">${ico('core')}</div>`;
  for (const n of tr.nodes) {
    const a = tPos(tr, n.p ? by[n.p] : null),
      b = tPos(tr, n),
      L = tLv(n.id),
      open = !n.p || tLv(n.p) > 0,
      c = tr.br[n.b].c;
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${L > 0 ? c : '#33464f'}" stroke-width="3"/>`;
    let pips = '';
    for (let i = 0; i < n.max; i++) pips += `<i class="${i < L ? 'on' : ''}"></i>`;
    html += `<button class="tn${n.cap ? ' cap' : ''}${open ? '' : ' lock'}${L > 0 ? ' own' : ''}${L >= n.max ? ' max' : ''}${tSel === n.id ? ' sel' : ''}" data-id="${n.id}" aria-label="${n.n}" style="left:${b.x}px;top:${b.y}px;--c:${c}">${ico(n.k)}<span class="pips">${pips}</span></button>`;
  }
  for (const k in tr.br) {
    const p = tPos(tr, k, tr.lab || 3.85, 0);
    html += `<div class="tl" style="left:${p.x}px;top:${p.y}px;--c:${tr.br[k].c}">${tr.br[k].n}</div>`;
  }
  $('tMap').innerHTML = `<svg viewBox="0 0 940 640">${svg}</svg>` + html;
  $('tMap')
    .querySelectorAll('button.tn')
    .forEach(
      b =>
        (b.onclick = () => {
          tSel = b.dataset.id;
          drawTree();
        })
    );
  $('tSh').textContent = tCur();
  const n = by[tSel],
    el = $('tInfo');
  if (!n) {
    el.innerHTML = `<div class="ti-h">Touche une case pour voir son effet. Fais glisser pour parcourir la grille.</div>`;
    return;
  }
  const L = tLv(n.id),
    mx = L >= n.max,
    cost = tCost(tr, n, L),
    open = !n.p || tLv(n.p) > 0,
    cur = tCur();
  const why = mx
    ? 'Niveau maximum atteint.'
    : !open
      ? "Débloque d'abord : " + by[n.p].n + '.'
      : cur < cost
        ? 'Il te manque ' + (cost - cur) + ' ' + tr.unit + '.'
        : '';
  el.innerHTML =
    `<div class="ti-n">${n.n}</div><div class="ti-v">${mx ? n.v(L) : n.v(L) + ' > ' + n.v(L + 1)}</div><div class="ti-r"><span>${mx ? '' : cost + ' ' + tr.unit}</span><span>${L} / ${n.max}</span></div>` +
    (why ? `<div class="ti-h">${why}</div>` : `<button class="solid" id="tBuy">Acheter</button>`);
  if (!why)
    $('tBuy').onclick = () => {
      send(['rb', n.id]);
      drawTree();
    };
}
function openTree() {
  tSel = null;
  const tr = tTree();
  $('tTitle').textContent = tr.title;
  $('tUnit').textContent = tr.unit;
  $('tClose').textContent = net.n > 1 && tr.close === 'Reprendre la partie' ? 'Retour' : tr.close; // à plusieurs, la partie ne s'arrête pas (audit écran n° 22)
  $('tree').hidden = false;
  drawTree();
  const sc = $('tScroll');
  sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  sc.scrollTop = (sc.scrollHeight - sc.clientHeight) / 2;
}
$('tClose').onclick = () => {
  $('tree').hidden = true;
};
$('bGrid').onpointerdown = () => {
  if (!running) return;
  if (shopNear) openTree();
  else toast("Le marchand t'attend près du cœur");
};
