// [interface/arsenal.js] Tes armes dans la partie (V2.0) : le choix de 3 armes et de leur élément au début, le marchand d'armes, les effets des améliorations à l'écran, et ce que le multi en dit.
// Les règles (éléments des balles, améliorations, prix) sont dans regles/armes.js. Ici : l'état de la page pour soi (arsenal, armUp), les écrans, les effets.
const WTK = Object.keys(WT),
  WDESC = {
    pistolet: 'polyvalent',
    assaut: 'rafales rapides',
    sniper: 'très précis, lent',
    fusil: 'longue portée',
    pompe: 'à bout portant',
    lance: 'brûle de près'
  },
  // silhouettes des six armes (vue de profil, canon vers la droite), viewBox 0 0 48 20
  WSVG = {
    pistolet: '<path d="M8 6h26v5H22l-2 2h-3l-2 6h-6l2-8H8z"/>',
    assaut: '<path d="M2 7l8-1h28l2-1h6v3h-6v3H30l-2 7h-5l1-7h-6l-3 7h-5l2-7H9L2 12z"/>',
    sniper: '<path d="M1 9l9-1h37v2H31v2H21l-2 6h-5l1-6H9L1 13zM16 4h12v3H16z"/>',
    fusil: '<path d="M2 8l9-1h34v3H25v2h-6l-2 5h-5l2-5H10L2 13z"/>',
    pompe: '<path d="M3 8l9-1h33v4H40v2H26v-2h-6l-2 6h-5l2-6H11L3 13z"/>',
    lance: '<path d="M4 5h12v11H4zM16 8h20l4-2h6v6h-6l-4-2H26l-2 7h-5l1-7h-4z"/>'
  };
IC.crit = '<circle cx="12" cy="12" r="7"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>';
IC.boom = '<path d="M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z"/>';
IC.flame = '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 3 3 5 1-2 1-5 0-9z"/>';
let arsHero = '';
let arsenal = [], // [{ w: arme, el: élément }] : 1 à 3 armes, choisies au début de la partie (« Rejouer » garde le choix)
  armUp = {}, // { arme: { id: niveau } } : ce que j'ai acheté au marchand d'armes dans cette partie
  armNear = false,
  armEfT = 0;
const armOf = w => arsenal.find(o => o.w === w);
// le premier élément pas encore pris, en partant de celui du héros
function armNextEl(list, el) {
  const i0 = Math.max(0, ELS.indexOf(el));
  for (let k = 0; k < ELS.length; k++) {
    const e = ELS[(i0 + k) % ELS.length];
    if (!list.some(o => o.el === e)) return e;
  }
  return el;
}
// l'élément que le joueur a choisi au lobby pour cette arme (opts.elements, V2.1 : salle d'armes ou portail), sinon rien
const lobbyEl = w =>
  LOBBY.elements && typeof LOBBY.elements === 'object' && ELS.includes(LOBBY.elements[w]) ? LOBBY.elements[w] : null;
// sans choix (tutoriel, tests) : l'arme du lobby, puis deux autres ; chacune avec l'élément choisi au lobby, sinon celui du héros pour la première et des éléments différents pour les autres
function armDefault(el) {
  const w0 = WT[tWeap] ? tWeap : 'pistolet',
    out = [{ w: w0, el: lobbyEl(w0) || el }];
  for (const w of ['fusil', 'assaut', 'sniper', 'pompe', 'pistolet'])
    if (out.length < 3 && !out.some(o => o.w === w)) out.push({ w, el: lobbyEl(w) || armNextEl(out, el) });
  return out;
}
// le héros porte l'élément et les améliorations de l'arme en main (les règles les lisent à chaque tir)
function armApply() {
  if (!sim) return;
  const h = sim.hero,
    a = armOf(tWeap);
  h.wk = tWeap;
  h.wEl = a ? a.el : h.el;
  h.wu = Object.assign({}, armUp[tWeap] || {});
  $('bFire').style.setProperty('--hero', elc(h.wEl));
  setGun(h.wEl); // le cristal de l'arme en main prend la couleur de son élément
}
// au début de chaque partie (appelé par begin)
function armBegin(el) {
  armUp = {};
  arsHero = el; // l'élément de prédilection du héros : une étoile sur l'écran du choix (V2.1)
  const ok = arsenal.length > 0 && arsenal.length <= 3 && arsenal.every(o => WT[o.w] && ELS.includes(o.el));
  if (!ok) arsenal = armDefault(el);
  if (!armOf(tWeap)) gameWeap(arsenal[0].w);
  armApply();
  drawSub();
  if (!tuto && !window.__armesAuto) arsOpen();
}
// ---------- l'écran du choix des armes ----------
function arsOpen() {
  $('arsV').hidden = false;
  $('arsM').hidden = true;
  arsDraw();
}
function arsMsg(t) {
  $('arsM').textContent = t;
  $('arsM').hidden = false;
}
function arsDraw() {
  $('arsW').innerHTML = WTK.map(w => {
    const i = arsenal.findIndex(o => o.w === w),
      a = arsenal[i];
    return `<button class="wcard${a ? ' on' : ''}" data-w="${w}"${a ? ` style="--c:${EL[a.el].c}"` : ''}><svg viewBox="0 0 48 20">${WSVG[w]}</svg><b>${WT[w].short}</b><small>${WDESC[w]}</small>${a ? `<i>${i + 1}</i>` : ''}</button>`;
  }).join('');
  $('arsE').innerHTML = arsenal
    .map(
      (a, i) =>
        `<div class="erow"><span class="en"><i>${i + 1}</i>${WT[a.w].short}</span><span class="ebs">${ELS.map(e => `<button class="ech${a.el === e ? ' on' : ''}" style="--c:${EL[e].c}" data-i="${i}" data-e="${e}">${EL[e].n}${e === arsHero ? '★' : ''}</button>`).join('')}</span></div>`
    )
    .join('');
  arsTeam();
  $('arsGo').disabled = !arsenal.length;
}
// les choix des coéquipiers (ce qu'ils envoient en direct) ; armTick la refait toutes les demi-secondes pendant que l'écran est ouvert (audit écran n° 17)
function arsTeam() {
  const now = performance.now(),
    tm = [];
  for (const k in net.aL) {
    const q = net.aL[k];
    if (now - q.t < 3000 && q.l.length)
      tm.push(
        `<b style="color:${EL[q.el].c}">${EL[q.el].hero}</b> ${q.l.map(o => WT[o.w].short + ' ' + EL[o.el].n).join(' · ')}`
      );
  }
  $('arsC').innerHTML = tm.length ? 'Coéquipiers : ' + tm.join(' — ') : '';
  $('arsC').hidden = !tm.length;
}
let arsTeamT = 0;
$('arsW').addEventListener('click', ev => {
  const b = ev.target.closest('.wcard');
  if (!b) return;
  const w = b.dataset.w,
    i = arsenal.findIndex(o => o.w === w);
  if (i >= 0) {
    if (arsenal.length < 2) return arsMsg('Garde au moins une arme.');
    arsenal.splice(i, 1);
  } else {
    if (arsenal.length >= 3) return arsMsg('3 armes au plus : touche une arme choisie pour la retirer.');
    arsenal.push({ w, el: lobbyEl(w) || armNextEl(arsenal, sim ? sim.hero.el : 'feu') });
  }
  $('arsM').hidden = true;
  arsDraw();
});
$('arsE').addEventListener('click', ev => {
  const b = ev.target.closest('.ech');
  if (!b) return;
  const a = arsenal[+b.dataset.i];
  if (a && ELS.includes(b.dataset.e)) a.el = b.dataset.e;
  arsDraw();
});
$('arsGo').onclick = () => {
  if (!arsenal.length) return;
  $('arsV').hidden = true;
  if (!armOf(tWeap)) gameWeap(arsenal[0].w);
  armApply();
  drawSub();
  const a = armOf(tWeap);
  if (a && arsEntree) {
    toast(arsEntree + ' · ' + WT[a.w].short + ' ' + EL[a.el].n + ' en main');
    toastT = 4.5;
  } else if (a)
    toast(WT[a.w].short + ' ' + EL[a.el].n + ' en main · tu changes d’arme dans la barre du bas, pendant la vague');
  arsEntree = '';
};
// ---------- le marchand d'armes ----------
function openArmes() {
  if (!running || !sim) return;
  $('mapV').hidden = true;
  $('armV').hidden = false;
  armDraw();
}
function armDraw() {
  if (!sim) return;
  const w = tWeap,
    a = armOf(w),
    col = a ? EL[a.el].c : '#ecf7f8',
    up = armUp[w] || {};
  $('armG').textContent = sim.gold;
  $('armTabs').innerHTML = arsenal
    .map(
      o =>
        `<button class="tchip${o.w === w ? ' sel' : ''}" data-w="${o.w}" style="--c:${EL[o.el].c}"><i></i>${WT[o.w].short} · ${EL[o.el].n}</button>`
    )
    .join('');
  $('armB').innerHTML = ARMUP.filter(u => armOk(w, u.id))
    .map(u => {
      const L = up[u.id] || 0,
        mx = L >= u.max,
        c = u.cost[L],
        poor = !mx && sim.gold < c;
      let pips = '';
      for (let i = 0; i < u.max; i++) pips += `<i class="${i < L ? 'on' : ''}"></i>`;
      return `<div class="au${L ? ' own' : ''}" style="--c:${col}"><span class="ai">${ico(u.ico)}</span><span class="at"><b>${u.n}</b><small>${mx ? u.v(L, w) : u.v(L, w) + ' › ' + u.v(L + 1, w)}</small><span class="pips">${pips}</span></span>${mx ? '<span class="tchip sel">Max</span>' : poor ? `<span class="tchip">${c} or</span>` : `<button class="solid" data-u="${u.id}">${c} or</button>`}</div>`;
    })
    .join('');
}
$('armTabs').addEventListener('click', ev => {
  const b = ev.target.closest('.tchip');
  if (!b || !armOf(b.dataset.w)) return;
  gameWeap(b.dataset.w);
  armDraw();
});
$('armB').addEventListener('click', ev => {
  const b = ev.target.closest('button[data-u]');
  if (b) armBuy(b.dataset.u);
});
$('armX').onclick = () => {
  $('armV').hidden = true;
};
// acheter pour l'arme en main : l'hôte paie tout de suite ; un invité paie de son côté et prévient l'hôte, qui retire l'or de l'équipe
function armBuy(id) {
  if (!running || !sim || !armOk(tWeap, id)) return;
  const i = ARMUP.findIndex(u => u.id === id),
    up = armUp[tWeap] || (armUp[tWeap] = {}),
    L = up[id] || 0,
    c = armCost(id, L);
  if (i < 0 || !c) return;
  if (sim.gold < c) {
    toast('Il manque ' + (c - sim.gold) + ' or');
    return;
  }
  if (!net.host) {
    // un invité demande ; l'hôte paie et tient le compte : le niveau n'arrive qu'avec sa réponse (armPaid), jamais avant (audit V2.0, problème 3)
    send(['wb', i, L + 1, WTK.indexOf(tWeap)]);
    return;
  }
  if (!armPay(sim, id, L)) return;
  up[id] = L + 1;
  armGot(tWeap, i, L + 1);
}
// un niveau vient d'être acquis : l'arme se met à jour, et ça se voit
function armGot(w, i, L) {
  armApply();
  SND.play('coin');
  const h = sim.hero;
  burst(h.x, h.y + 1.4, h.z, h.wEl, 16, 1.2);
  ringFx(h.x, h.z, 3, h.wEl, 0.5);
  toast(WT[w].short + ' : ' + ARMUP[i].n + ' niveau ' + L);
  if (!$('armV').hidden) armDraw();
}
// les niveaux payés, tels que l'hôte les tient (présence de l'hôte, clé wp) : « arme:chiffres » séparés par des points, un chiffre par ligne d'ARMUP
function wpayEnc(P) {
  const o = {};
  for (const id in P)
    o[id] = Object.keys(P[id])
      .filter(w => WTK.includes(w))
      .map(w => WTK.indexOf(w) + ':' + ARMUP.map(u => P[id][w][u.id] || 0).join(''))
      .join('.');
  return o;
}
function wpayDec(o, base) {
  const P = Object.assign({}, base || {});
  if (!o || typeof o !== 'object') return P;
  for (const id of Object.keys(o).slice(0, 16)) {
    if (typeof o[id] !== 'string' || id.length > 40) continue;
    const W = {};
    for (const g of o[id].split('.').slice(0, 6)) {
      const [wi, ds] = g.split(':'),
        w = WTK[+wi];
      if (!w || typeof ds !== 'string') continue;
      W[w] = {};
      ARMUP.forEach((u, k) => {
        const v = +ds[k];
        if (v > 0 && v <= u.max) W[w][u.id] = v;
      });
    }
    P[id] = W;
  }
  return P;
}
// chez un invité : l'hôte a répondu ; nos niveaux deviennent les siens (un achat refusé, faute d'or, disparaît)
function armPaid(str) {
  if (net.host || typeof str !== 'string' || str === net.wpMine) return;
  net.wpMine = str;
  const mine = wpayDec({ x: str }).x || {};
  let got = null;
  for (const o of arsenal) {
    const w = o.w,
      was = armUp[w] || {},
      now = mine[w] || {};
    ARMUP.forEach((u, i) => {
      if ((now[u.id] || 0) > (was[u.id] || 0)) got = [w, i, now[u.id]];
    });
    armUp[w] = Object.assign({}, now);
  }
  if (got) armGot(got[0], got[1], got[2]);
  else armApply();
}
$('bArmes').onpointerdown = () => {
  if (armNear) openArmes();
};
// ---------- le multi : chacun dit à tous l'arme qu'il tient, son élément et ses améliorations ; l'hôte s'en sert pour calculer ses tirs ----------
// aw : [arme, élément] (indices) · au : les niveaux des améliorations de l'arme en main, un chiffre par ligne de ARMUP · aL : son choix d'armes (« 13,24,50 »)
function armPres(pa) {
  const h = sim.hero;
  pa.aw = [WTK.indexOf(tWeap), ELS.indexOf(h.wEl || h.el)];
  pa.au = ARMUP.map(u => armL(h, u.id)).join('');
  pa.aL = arsenal.map(o => WTK.indexOf(o.w) + '' + ELS.indexOf(o.el)).join(',');
}
// ce qui vient d'un autre téléphone : vérifié avant usage
function armPeer(o, pr, peer) {
  const aw = pr.aw;
  if (Array.isArray(aw) && WTK[aw[0]] && ELS[aw[1]]) {
    o.wk = WTK[aw[0]];
    o.wEl = ELS[aw[1]];
  } else {
    o.wk = null;
    o.wEl = null;
  }
  const wu = {},
    paid = net.host && o.wk ? ((sim.wpay || {})[o.id] || {})[o.wk] || {} : null; // l'hôte n'accorde que ce qui a été payé
  if (typeof pr.au === 'string' && pr.au.length <= ARMUP.length)
    ARMUP.forEach((u, i) => {
      const v = Math.min(+pr.au[i], paid ? paid[u.id] || 0 : 9);
      if (v > 0 && v <= u.max) wu[u.id] = v;
    });
  o.wu = wu;
  const l = [];
  if (typeof pr.aL === 'string' && pr.aL.length <= 12)
    for (const q of pr.aL.split(',')) {
      const w = WTK[+q[0]],
        e = ELS[+q[1]];
      if (q.length === 2 && w && e && l.length < 3) l.push({ w, el: e });
    }
  net.aL[peer] = { el: o.el, l, t: performance.now() };
}
// ---------- les effets à l'écran ----------
const armZ = [],
  armSegG = new THREE.BoxGeometry(1, 1, 1);
function armSeg(x1, y1, z1, x2, y2, z2, col, w, dur) {
  const m = new THREE.Mesh(
    armSegG,
    new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  m.lookAt(x2, y2, z2);
  m.scale.set(w, w, Math.hypot(x2 - x1, y2 - y1, z2 - z1) || 0.01);
  scene.add(m);
  armZ.push({ m, t: 0, dur, w, s: 0 });
}
// un éclair en zigzag entre deux ennemis
function armBolt(x1, y1, z1, x2, y2, z2) {
  let px = x1,
    py = y1,
    pz = z1;
  for (let i = 1; i <= 4; i++) {
    const u = i / 4,
      j = i < 4 ? 0.7 : 0,
      x = x1 + (x2 - x1) * u + (Math.random() - 0.5) * j,
      y = y1 + (y2 - y1) * u + (Math.random() - 0.5) * j,
      z = z1 + (z2 - z1) * u + (Math.random() - 0.5) * j;
    armSeg(px, py, pz, x, y, z, 0xfff6b0, 0.18, 0.3); // plus épais et plus long, pour qu'on le voie à côté des explosions (audit écran n° 10)
    px = x;
    py = y;
    pz = z;
  }
  burst(x2, y2, z2, 'elec', 4, 0.6);
}
// explosion : un éclair de lumière qui gonfle, une onde au sol, une gerbe.
// Audit écran n° 10 : le halo plein éblouissait et cachait le viseur et les cibles ; il est plus petit, plus transparent, et pas plus de 4 à la fois.
const armBoomM = {};
for (const e of ELS) armBoomM[e] = glowM(new THREE.Color(elc(e)).getHex(), 0.4);
let armBoomN = 0;
function armBoom(ev) {
  ringFx(ev.x, ev.z, ev.r * 1.1, ev.el, 0.32);
  burst(ev.x, ev.y, ev.z, ev.el, 6, 1.1);
  if (armBoomN >= 4) return;
  const sp = new THREE.Sprite(armBoomM[ev.el] || armBoomM.feu);
  sp.position.set(ev.x, ev.y, ev.z);
  sp.scale.setScalar(ev.r * 0.6);
  scene.add(sp);
  armBoomN++;
  armZ.push({ m: sp, t: 0, dur: 0.2, s: ev.r * 0.9, boom: 1 });
}
function armTick(dt) {
  if (!$('arsV').hidden && (arsTeamT -= dt) <= 0) {
    arsTeamT = 0.5;
    arsTeam();
  }
  for (let i = armZ.length - 1; i >= 0; i--) {
    const z = armZ[i];
    z.t += dt;
    const k = 1 - z.t / z.dur;
    if (k <= 0) {
      if (z.boom) armBoomN--;
      scene.remove(z.m);
      if (!z.s && z.m.material.dispose) z.m.material.dispose(); // les éclats d'explosion partagent le matériau de leur élément : on ne le jette pas
      armZ.splice(i, 1);
      continue;
    }
    if (z.s) z.m.scale.setScalar(z.s * (0.45 + 0.55 * (1 - k)));
    else {
      z.m.material.opacity = 0.95 * k;
      z.m.scale.x = z.m.scale.y = z.w * (0.4 + 0.6 * k);
    }
  }
}
// l'efficacité de la dernière balle sur chaque ennemi touché (pour la couleur des chiffres : reperes.js)
const armEfOf = new Map();
function armEfCol(id) {
  const ef = armEfOf.get(id);
  return ef === 2 ? '#ffe066' : ef === 0 ? '#8fa3aa' : null;
}
function armEv(ev) {
  if (ev.k === 'aexp') {
    if (armZ.length < 60) armBoom(ev);
    if (ev.m !== false) SND.at('boom', ev.x, ev.z, Math.min(3, ev.r));
  } else if (ev.k === 'arico') {
    if (armZ.length < 60)
      armSeg(ev.x1, ev.y1, ev.z1, ev.x2, ev.y2, ev.z2, new THREE.Color(elc(ev.el)).getHex(), 0.1, 0.18);
    burst(ev.x2, ev.y2, ev.z2, ev.el, 3, 0.5);
  } else if (ev.k === 'azap') {
    if (armZ.length < 60) armBolt(ev.x1, ev.y1, ev.z1, ev.x2, ev.y2, ev.z2);
    SND.at('zap', ev.x2, ev.z2);
  } else if (ev.k === 'hit' && ev.m && ev.id !== undefined) {
    armEfOf.set(ev.id, ev.ef);
    if (armEfOf.size > 300) armEfOf.delete(armEfOf.keys().next().value);
    const now = performance.now();
    if ((ev.ef === 2 || ev.ef === 0) && now - armEfT > 1100) {
      armEfT = now;
      floater(
        ev.x,
        ev.y + 1.5,
        ev.z,
        ev.ef === 2 ? 'Efficace !' : 'Peu efficace',
        ev.ef === 2 ? elc(sim.hero.wEl || sim.hero.el) : '#8fa3aa',
        ev.ef === 2 ? 14 : 11,
        1
      );
    }
  }
}
