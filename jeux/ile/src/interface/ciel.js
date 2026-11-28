// [interface/ciel.js] La vue du ciel entre deux vagues (V2.0) : la caméra monte façon Clash of Clans, on pose, on améliore, on mure et on creuse au doigt, puis « Prêt ».
// Demande de Frédéric (25/11) : « à chaque fin de vague, l'écran se dézoome pour passer à une vue comme dans CoC, du ciel, et on a genre 30 s pour placer de nouvelles
// défenses, améliorer les existantes et construire des murs / trous ». Le chrono et les prêts sont dans regles/ciel.js ; tout ce qu'on fait passe par les actions de send()
// (pl, up, wl, dg, rdy), comme en vue normale : chez un invité, c'est l'hôte qui pose. En vue normale, marteau et pelle restent (sa réponse du 25/11).
// Un doigt : toucher = choisir (sol ou défense), glisser = déplacer la vue (outil Défense) ou tracer de A à B (outils Mur et Fosse). Deux doigts : déplacer et pincer pour zoomer.
const CIELP = -0.98, // inclinaison de la vue du ciel (≈ 56° sous l'horizon)
  CIELH = [26, 170, 72]; // hauteur de la caméra : la plus basse, la plus haute (toute l'île), celle de départ
// Les boutiques qu'on ouvre depuis le ciel, puisqu'on ne peut pas marcher jusqu'aux étals : { n: nom, f: fonction qui ouvre, b: petit texte (facultatif) }.
// Une boutique de plus = une ligne de plus ici (nom, ce qui l'ouvre, le petit texte doré) — la rangée est refaite à chaque montée.
const CIEL_BOUTIQUES = [
  {
    n: 'Marchand',
    f: () => openTree(),
    b: () => sim.pts + (sim.pts > 1 ? ' pts' : ' pt')
  },
  {
    n: 'Esclaves',
    f: () => {
      $('mapV').hidden = true;
      $('hireV').hidden = false;
      hireDraw();
    },
    b: () => hiredOf(sim).length + ' / ' + HIREMAX
  },
  {
    n: 'Armes', // le marchand d'armes (interface/arsenal.js), branché à la fusion des chantiers
    f: () => openArmes()
  }
];
const ciel = {
  on: false,
  k: 0, // 0 = vue normale, 1 = vue du ciel (la montée et la descente passent entre les deux)
  fx: 0,
  fz: 0,
  h: CIELH[2],
  yaw: 0,
  tool: 'def', // def (défense), mur, fos (fosse)
  type: 'mortier',
  sel: null, // { x, z } : un endroit où poser ; { t: id } : une défense à améliorer
  a: -1, // case de départ d'un tracé (mur, fosse)
  b: -1,
  lk: '',
  lc: null,
  me: false, // moi, prêt
  pts: {},
  g: null, // geste à deux doigts { d, h, mx, my }
  self: null,
  bk: '',
  t0: 0, // l'heure de la montée : « Prêt » attend la fin de la montée et 1,5 s (audit écran n° 1)
  mt: 0, // l'heure de mon dernier « Prêt », et le compte des prêts à ce moment-là (à plusieurs, en attendant la réponse de l'hôte)
  mr: 0,
  wk: '' // la place de la roulette autour de l'endroit touché (audit écran n° 9)
};
const CIELT = { def: 'Défense', mur: 'Mur', fos: 'Fosse' };
const cielOn = () => !!(ciel.on && sim && running);
// la vue du ciel tant que la partie prépare la vague suivante ; pendant le tutoriel, seulement à ses étapes « ciel » (après la vague 1, sans chrono)
// (window.__noCiel : réservé aux tests des gestes de la vue normale pendant la préparation)
const cielWant = () =>
  !!(
    running &&
    sim &&
    sim.phase === 'prep' &&
    !sim.over &&
    (!tuto || (TUTO[tuto.i] && TUTO[tuto.i].ciel)) &&
    !window.__noCiel
  );
// repère doré sous la défense choisie
const cielSel = new THREE.Mesh(
  new THREE.RingGeometry(3.1, 3.7, 40),
  new THREE.MeshBasicMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.95, depthWrite: false })
);
cielSel.rotation.x = -Math.PI / 2;
cielSel.visible = false;
scene.add(cielSel);
// l'arc de côte d'où viendra la vague (vagues 1 et 2), dessiné sur l'eau pendant le ciel (audit écran n° 11) ; refait (nouvel objet) quand l'arc change
const cielArcM = new THREE.MeshBasicMaterial({ color: 0xffcf5a, transparent: true, opacity: 0.8, depthWrite: false });
let cielArc = null;
function cielArcTick() {
  const A = sim.varc,
    k = A && A[1] < 6.28 ? A[0].toFixed(3) + '/' + A[1].toFixed(3) : '';
  if (!cielArc || cielArc.userData.k !== k) {
    if (cielArc) {
      scene.remove(cielArc);
      cielArc.geometry.dispose();
    }
    // le jeu compte l'angle a de (cos a, sin a) en x, z ; l'anneau couché (rotation x de −90°) met (cos t, sin t) en (x, −z) : t = −a
    cielArc = new THREE.Mesh(
      k
        ? new THREE.RingGeometry(R_ISLE + 3, R_ISLE + 11, 48, 1, -(A[0] + A[1] / 2), A[1])
        : new THREE.RingGeometry(1, 2, 3),
      cielArcM
    );
    cielArc.rotation.x = -Math.PI / 2;
    cielArc.position.y = 2.5; // au-dessus des vagues de la mer, dessiné après elle
    cielArc.renderOrder = 10;
    cielArc.userData.k = k;
    scene.add(cielArc);
    // à la couleur de l'élément le plus nombreux de la vague (le doré se confondait avec le sable)
    const g = (sim.next || []).filter(q => !q.hidden).sort((a, b) => b.count - a.count)[0];
    cielArcM.color.set(g ? elc(g.el) : '#ffcf5a');
  }
  cielArc.visible = !!k;
}
// la roulette autour de l'endroit touché (audit écran n° 9) : un demi-cercle de cinq boutons au-dessus du point, gardé dans l'écran,
// au-dessus de la rangée du bas, des boutiques et de « Prêt » ; null = la remettre au coin (vue normale)
const CIELWR = 82; // le bouton conseillé grossit : de la place entre les six (V2.1 : 72 pour cinq)
function cielWheelAt(P) {
  const w = $('wheel');
  if (!P) {
    if (ciel.wk) {
      ciel.wk = '';
      w.classList.remove('at');
      w.style.left = w.style.top = '';
      wheelB.forEach((b, k) => {
        b.style.left = b.style.top = '';
        b.style.right = WPOS[k][0] - 23 + 'px';
        b.style.bottom = WPOS[k][1] - 23 + 'px';
      });
    }
    return;
  }
  const hi = $('hudIn'),
    W = hi.clientWidth,
    H = hi.clientHeight,
    sp = cielScreen(P[0], P[1], P[2]);
  if (!sp) return;
  const low = $('cLow').offsetTop,
    shopR = $('cShops').offsetWidth + 8,
    shopT = H - $('cShops').offsetHeight,
    rdyL = W - $('cReady').offsetWidth - 8,
    rdyT = H - $('cReady').offsetHeight,
    wv = $('wave'),
    top = wv.offsetParent ? wv.offsetTop + wv.offsetHeight : 0,
    R = CIELWR;
  let x = Math.max(R + 30, Math.min(W - R - 30, sp[0] - hi.offsetLeft)),
    y = sp[1] - hi.offsetTop,
    yMax = low - 27;
  if (x - R - 23 < shopR) yMax = Math.min(yMax, shopT - 27);
  if (x + R + 23 > rdyL) yMax = Math.min(yMax, rdyT - 27);
  y = Math.min(yMax, Math.max(top + R + 31, y));
  const k = Math.round(x) + '/' + Math.round(y);
  if (k === ciel.wk) return;
  ciel.wk = k;
  w.classList.add('at');
  w.style.left = Math.round(x) + 'px';
  w.style.top = Math.round(y) + 'px';
  wheelB.forEach((b, i) => {
    const a = Math.PI - (i * Math.PI) / (wheelB.length - 1);
    b.style.right = b.style.bottom = 'auto';
    b.style.left = Math.round(Math.cos(a) * R - 23) + 'px';
    b.style.top = Math.round(-Math.sin(a) * R - 23) + 'px';
  });
}
// un point du monde à l'écran (pixels de la scène), avec la caméra du ciel ; null s'il est derrière
function cielScreen(x, y, z) {
  const W = canvas.clientWidth || 1,
    H = canvas.clientHeight || 1,
    ty = Math.tan((camera.fov * Math.PI) / 360),
    yw = camera.rotation.y,
    p = camera.rotation.x,
    f = [-Math.cos(p) * Math.sin(yw), Math.sin(p), -Math.cos(p) * Math.cos(yw)],
    r = [Math.cos(yw), 0, -Math.sin(yw)],
    u = [Math.sin(p) * Math.sin(yw), Math.cos(p), Math.sin(p) * Math.cos(yw)],
    d = [x - camera.position.x, y - camera.position.y, z - camera.position.z],
    zc = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
  if (zc < 0.5) return null;
  const nx = (d[0] * r[0] + d[2] * r[2]) / (zc * ty * camera.aspect),
    ny = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / (zc * ty);
  return [((nx + 1) / 2) * W, ((1 - ny) / 2) * H];
}
// ---- la rangée d'outils, les choix, les boutiques, Prêt ----
$('cBar').innerHTML = Object.keys(CIELT)
  .map(k => `<button class="slot" data-c="${k}"><small>${CIELT[k]}</small></button>`)
  .join('');
$('cBar')
  .querySelectorAll('button')
  .forEach(b =>
    b.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      cielTool(b.dataset.c);
    })
  );
function cielTool(k) {
  ciel.tool = k;
  ciel.sel = null;
  ciel.a = ciel.b = -1;
  ciel.lk = '';
  cielSubDraw();
}
function cielSubDraw() {
  const el = $('cSub');
  for (const b of $('cBar').children) b.classList.toggle('sel', b.dataset.c === ciel.tool);
  if (ciel.tool === 'def') {
    el.innerHTML = TKEYS.map(
      k => `<button class="tchip${k === ciel.type ? ' sel' : ''}" data-k="${k}">${TYPES[k].s} · <b></b></button>`
    ).join('');
    el.querySelectorAll('button').forEach(b =>
      b.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        ciel.type = b.dataset.k;
        if (ciel.sel && ciel.sel.t !== undefined) ciel.sel = null;
        cielSubDraw();
      })
    );
  } else
    el.innerHTML = `<span class="tchip sel">${ciel.tool === 'mur' ? 'Mur · ' + BAL.wall : 'Fosse · ' + BAL.dig} or le bloc</span>`;
  ciel.bk = '';
}
function cielShopsDraw() {
  $('cShops').innerHTML = CIEL_BOUTIQUES.map(
    (s, i) => `<button class="panel" data-i="${i}">${s.n}<b></b></button>`
  ).join('');
  $('cShops')
    .querySelectorAll('button')
    .forEach(b =>
      b.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        const s = CIEL_BOUTIQUES[+b.dataset.i];
        if (s && running && !ov()) s.f();
      })
    );
  ciel.bk = '';
}
// « Prêt » est sous le pouce qui tirait pendant la vague (audit écran n° 1) : rien pendant la montée et 1,5 s après,
// et deux appuis rapprochés quand cet appui lancerait la vague (seul, ou dernier à ne pas être prêt), comme Compétence et Ultime.
// Retirer son « Prêt » ne demande qu'un appui.
function cielPretOk(ev) {
  if (ciel.k < 1 || performance.now() - ciel.t0 < 1500) return false;
  if (ciel.me || (sim.cR || 0) < (sim.cN || 1) - 1) return true;
  return dbl(ev);
}
$('cRules').addEventListener('pointerdown', ev => {
  ev.preventDefault();
  if (cielOn() && !ov()) rulesShow();
});
$('cReady').addEventListener('pointerdown', ev => {
  ev.preventDefault();
  if (!cielOn() || ov()) return;
  if (!cielPretOk(ev)) return;
  ciel.mt = performance.now();
  ciel.mr = sim.cR || 0;
  ciel.me = !ciel.me;
  ciel.rw = sim.wave + 1; // la vague pour laquelle on est prêt : un invité le redit dans sa présence (rd), l'hôte le relit à chaque image
  send(['rdy', ciel.me ? 1 : 0]);
  SND.play('coin');
});
// ---- monter, descendre ----
function cielEnter() {
  const h = sim.hero;
  ciel.on = true;
  ciel.me = false;
  ciel.sel = null;
  ciel.a = ciel.b = -1;
  ciel.pts = {};
  ciel.g = null;
  ciel.t0 = performance.now();
  // nord en haut, comme la mini-carte (audit écran n° 11 : en suivant le regard du héros, l'île tournait à chaque montée) ;
  // la caméra part toujours des yeux du héros et se place au-dessus de lui
  ciel.yaw = 0;
  ciel.fx = h.x;
  ciel.fz = h.z;
  ciel.h = CIELH[2];
  // plus de mouvement ni de tir : le héros attend en bas
  joy.id = null;
  joy.f = joy.r = 0;
  joy.full = 0;
  $('knob').style.transform = '';
  $('joy').classList.remove('on');
  for (const k in looks) delete looks[k];
  fireTouch = false;
  aimSet(false);
  if (tool !== 'pistolet') setTool('pistolet');
  cielShopsDraw();
  cielSubDraw();
  $('hud').classList.add('ciel');
  $('cielH').hidden = false;
}
function cielLeave() {
  ciel.on = false;
  ciel.sel = null;
  ciel.a = ciel.b = -1;
  ciel.pts = {};
  ciel.g = null;
  $('hud').classList.remove('ciel');
  $('cielH').hidden = true;
  $('cTime').hidden = true;
  cielSel.visible = false;
  if (cielArc) cielArc.visible = false;
  cielWheelAt(null);
  if (wheelCtx && !placing) {
    wheelCtx = null;
    $('wheel').hidden = true;
  }
  // à plusieurs, la vague peut partir pendant qu'une boutique est ouverte : on la referme (audit écran n° 5)
  for (const id of ['armV', 'hireV', 'tree']) $(id).hidden = true;
}
// ---- caméra ----
const cielEase = u => u * u * (3 - 2 * u);
function cielSky() {
  const d = ciel.h / Math.tan(-CIELP);
  return [ciel.fx + Math.sin(ciel.yaw) * d, ciel.h, ciel.fz + Math.cos(ciel.yaw) * d];
}
// le point du sol sous un point de l'écran (x, y en pixels de la scène)
function cielGround(x, y) {
  const W = canvas.clientWidth || 1,
    H = canvas.clientHeight || 1,
    nx = (x / W) * 2 - 1,
    ny = 1 - (y / H) * 2,
    ty = Math.tan((camera.fov * Math.PI) / 360),
    yw = camera.rotation.y,
    p = camera.rotation.x,
    f = [-Math.cos(p) * Math.sin(yw), Math.sin(p), -Math.cos(p) * Math.cos(yw)],
    r = [Math.cos(yw), 0, -Math.sin(yw)],
    u = [Math.sin(p) * Math.sin(yw), Math.cos(p), Math.sin(p) * Math.cos(yw)],
    dx = f[0] + r[0] * nx * ty * camera.aspect + u[0] * ny * ty,
    dy = f[1] + r[1] * nx * ty * camera.aspect + u[1] * ny * ty,
    dz = f[2] + r[2] * nx * ty * camera.aspect + u[2] * ny * ty;
  if (dy > -0.02) return null;
  const t = -camera.position.y / dy;
  return [camera.position.x + dx * t, camera.position.z + dz * t];
}
// combien de mètres au sol pour un pixel d'écran, au milieu de la vue
const cielMpp = () =>
  (2 * (ciel.h / Math.sin(-CIELP)) * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, canvas.clientHeight);
function cielPan(dx, dy) {
  const m = cielMpp(),
    cy = Math.cos(ciel.yaw),
    sy = Math.sin(ciel.yaw),
    fwd = (dy * m) / Math.sin(-CIELP);
  // glisser le doigt vers la droite emmène le sol avec lui : on regarde plus à gauche
  ciel.fx += -cy * dx * m - sy * fwd;
  ciel.fz += sy * dx * m - cy * fwd;
  const l = Math.hypot(ciel.fx, ciel.fz),
    L = R_ISLE + 10;
  if (l > L) {
    ciel.fx *= L / l;
    ciel.fz *= L / l;
  }
}
// ---- le doigt dans le ciel (appelé par tactile.js) ----
function cielDown(e, x, y) {
  ciel.pts[e.pointerId] = { x, y, x0: x, y0: y, mv: false };
  const ids = Object.keys(ciel.pts);
  if (ids.length === 2) {
    const [p, q] = ids.map(i => ciel.pts[i]);
    ciel.g = { d: Math.hypot(p.x - q.x, p.y - q.y) || 1, h: ciel.h, mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2 };
    ciel.a = ciel.b = -1; // un second doigt annule le tracé en cours
    for (const i of ids) ciel.pts[i].mv = true;
    return;
  }
  if (ids.length === 1 && ciel.tool !== 'def' && !ov()) {
    const G = cielGround(x, y);
    if (G) {
      ciel.a = ciel.b = cellOf(G[0], G[1]);
      ciel.sel = null;
    }
  }
}
function cielMove(e, x, y) {
  const p = ciel.pts[e.pointerId];
  if (!p) return;
  const ox = p.x,
    oy = p.y;
  p.x = x;
  p.y = y;
  if (Math.hypot(x - p.x0, y - p.y0) > 9) p.mv = true;
  const ids = Object.keys(ciel.pts);
  if (ids.length >= 2 && ciel.g) {
    const [a, b] = ids.slice(0, 2).map(i => ciel.pts[i]),
      d = Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mx = (a.x + b.x) / 2,
      my = (a.y + b.y) / 2;
    ciel.h = Math.max(CIELH[0], Math.min(CIELH[1], (ciel.g.h * ciel.g.d) / d));
    cielPan(mx - ciel.g.mx, my - ciel.g.my);
    ciel.g.mx = mx;
    ciel.g.my = my;
    return;
  }
  if (ciel.a >= 0) {
    const G = cielGround(x, y);
    if (G) ciel.b = cellOf(G[0], G[1]);
    return;
  }
  if (ciel.tool === 'def' && p.mv) cielPan(x - ox, y - oy);
}
function cielUp(e, x, y) {
  const p = ciel.pts[e.pointerId];
  if (!p) return;
  delete ciel.pts[e.pointerId];
  if (Object.keys(ciel.pts).length < 2) ciel.g = null;
  if (ov() || e.type === 'pointercancel') {
    ciel.a = ciel.b = -1;
    return;
  }
  if (ciel.a >= 0) {
    cielLine();
    return;
  }
  if (!p.mv && ciel.tool === 'def') cielTap(x, y);
}
// toucher le sol : un endroit où poser ; toucher une défense : l'améliorer
function cielTap(x, y) {
  const G = cielGround(x, y);
  if (!G) return;
  let bt = null,
    bd = Math.max(3.2, cielMpp() * 26); // de loin, une défense se touche du bout du doigt
  for (const t of sim.towers) {
    if (t.tmpT !== undefined) continue;
    const d = Math.hypot(t.x - G[0], t.z - G[1]);
    if (d < bd) {
      bd = d;
      bt = t;
    }
  }
  if (bt && bd < 4.5) ciel.sel = { t: bt.id };
  else ciel.sel = { x: G[0], z: G[1] };
}
// relâcher un tracé : les murs ou la fosse de A à B (une seule case si l'on n'a pas glissé)
function cielLine() {
  const a = ciel.a,
    b = ciel.b,
    k = ciel.tool;
  ciel.a = ciel.b = -1;
  ciel.lk = '';
  const c = (k === 'mur' ? checkWalls : checkDig)(sim, cellX(a), cellZ(a), cellX(b), cellZ(b));
  if (c.why) {
    toast(c.why);
    return;
  }
  if (sim.gold < c.cost) {
    toast("Pas assez d'or");
    return;
  }
  send([k === 'mur' ? 'wl' : 'dg', cellX(a), cellZ(a), cellX(b), cellZ(b)]);
}
// ---- une image (appelée par la boucle, après la vue normale et avant le rendu) ----
function cielTick(dt, now) {
  const want = cielWant();
  if (want && !ciel.on) cielEnter();
  else if (!want && ciel.on) cielLeave();
  ciel.k = Math.max(0, Math.min(1, ciel.k + (ciel.on ? dt / 1.1 : -dt / 0.8)));
  if (!sim || !running) ciel.k = 0;
  const h = sim && sim.hero;
  // le héros vu d'en haut (en vue normale on ne se voit pas)
  if (h && (!ciel.self || ciel.self.userData.el !== h.el + '|' + elOf(h))) {
    if (ciel.self) scene.remove(ciel.self);
    ciel.self = mateView({ el: h.el, ce: h.ce, x: h.x, z: h.z });
    ciel.self.userData.el = h.el + '|' + elOf(h);
  }
  if (ciel.self && h) {
    ciel.self.visible = ciel.k > 0.25;
    if (ciel.self.visible) mateTick({ x: h.x, y: h.y, z: h.z, yaw: h.yaw, down: h.down > 0 }, ciel.self, dt);
  }
  if (ciel.k <= 0) return;
  const e = cielEase(ciel.k),
    S = cielSky(),
    P0 = camera.position,
    dy = ciel.yaw - camera.rotation.y,
    da = Math.atan2(Math.sin(dy), Math.cos(dy));
  camera.position.set(P0.x + (S[0] - P0.x) * e, P0.y + (S[1] - P0.y) * e, P0.z + (S[2] - P0.z) * e);
  camera.rotation.y += da * e;
  camera.rotation.x += (CIELP - camera.rotation.x) * e;
  gun.visible = false;
  for (const k in held) held[k].visible = false;
  if (!ciel.on) return;
  cielHud(now);
}
function cielHud(now) {
  // une défense vient d'apparaître là où l'on posait : on la garde choisie, pour l'améliorer tout de suite
  if (ciel.sel && ciel.sel.t === undefined)
    for (const t of sim.towers)
      if (t.tmpT === undefined && Math.hypot(t.x - ciel.sel.x, t.z - ciel.sel.z) < 1.5) {
        ciel.sel = { t: t.id };
        break;
      }
  const T = ciel.sel && ciel.sel.t !== undefined ? sim.towers.find(t => t.id === ciel.sel.t) : null;
  if (ciel.sel && ciel.sel.t !== undefined && !T) ciel.sel = null;
  let wc = null;
  if (T) {
    wc = { t: T, type: T.type, els: T.els, cost: costOf(T.type, T.els.length), why: '' };
    if (T.els.length >= MAXEL * MAXLV) wc.why = 'Niveau maximum';
    cielSel.visible = true;
    cielSel.position.set(T.x, (T.wy || 0) + 0.25, T.z);
    cielSel.material.color.setHex(0xffcf5a);
  } else cielSel.visible = false;
  cielSel.scale.setScalar(Math.max(1, ciel.h / 45)); // de haut, l'anneau grandit pour rester visible (audit écran n° 19)
  if (ciel.sel && !T) {
    let x = ciel.sel.x,
      z = ciel.sel.z,
      gy = 0;
    const ci = cellOf(x, z);
    if (sim.wallSet[ci]) {
      x = cellX(ci);
      z = cellZ(ci);
      gy = sim.wallSet[ci] * WALLH;
    }
    gx = x;
    gz = z;
    placeType = ciel.type;
    gWhy = canPlace(sim, x, z);
    wc = { place: true, type: ciel.type, els: [], cost: placeCost(sim, ciel.type), why: gWhy };
    ghost.position.set(x, gy, z);
    gRing.scale.setScalar((rangeOf(ciel.type, 1, sim.m) + BAL.wallRange * Math.round(gy / WALLH)) / 17);
    ghostMat.color.setHex(gWhy ? 0xff6b5a : 0x7cf07a);
    ghost.visible = true;
    ghostSet(ciel.type, elOf(sim.hero));
    // l'endroit choisi se voit de haut : l'anneau, vert ou rouge selon que la pose est permise (audit écran n° 19)
    cielSel.visible = true;
    cielSel.position.set(x, gy + 0.25, z);
    cielSel.material.color.setHex(gWhy ? 0xff6b5a : 0x7cf07a);
  } else ghost.visible = false;
  // le tracé en cours (mur, fosse) : les blocs fantômes et leur prix
  let lt = '';
  if (ciel.a >= 0 && ciel.b >= 0) {
    const key = ciel.tool + ciel.a + '/' + ciel.b + '/' + sim.fv + '/' + sim.towers.length;
    if (key !== ciel.lk) {
      ciel.lk = key;
      ciel.lc = (ciel.tool === 'mur' ? checkWalls : checkDig)(
        sim,
        cellX(ciel.a),
        cellZ(ciel.a),
        cellX(ciel.b),
        cellZ(ciel.b)
      );
    }
    const c = ciel.lc;
    ghostWs.forEach((m, k) => {
      const i = c.all[k];
      m.visible = i !== undefined;
      if (m.visible)
        m.position.set(
          cellX(i),
          Math.max(0.12 - WALLH / 2, (sim.wallSet[i] - sim.pit[i] + (ciel.tool === 'mur' ? 0.5 : -0.5)) * WALLH),
          cellZ(i)
        );
    });
    ghostMat.color.setHex(c.why || sim.gold < c.cost ? 0xff6b5a : 0x7cf07a);
    lt =
      c.why ||
      (ciel.tool === 'mur' ? 'Mur' : 'Fosse') + ' · ' + gold(c.cost) + (sim.gold < c.cost ? " · pas assez d'or" : '');
    $('cHint').classList.toggle('warn', !!c.why || sim.gold < c.cost);
  } else hideGW();
  wheelCtx = wc;
  $('wheel').hidden = !wc;
  $('wheelL').hidden = true;
  if (wc) {
    drawWheel(wc);
    cielWheelAt(T ? [T.x, (T.wy || 0) + 1, T.z] : [ghost.position.x, ghost.position.y, ghost.position.z]);
  }
  // la ligne d'aide : ce qui est choisi, sinon comment faire
  if (!lt) {
    if (wc) {
      lt = (T && !wc.why ? 'Améliorer · ' : '') + $('wheelL').textContent; // audit écran n° 14 : dire qu'on améliore
      $('cHint').classList.toggle('warn', $('wheelL').classList.contains('warn'));
    } else {
      $('cHint').classList.remove('warn');
      lt =
        ciel.tool === 'def'
          ? 'Touche le sol ou une défense · glisse pour bouger'
          : ciel.tool === 'mur'
            ? 'Glisse de A à B pour monter un mur · 2 doigts : bouger'
            : 'Glisse de A à B pour creuser · 2 doigts : bouger';
    }
  }
  setTxt('cHint', '', lt);
  // coûts des choix, boutiques, Prêt
  if (ciel.tool === 'def')
    for (const b of $('cSub').children) {
      const v = String(placeCost(sim, b.dataset.k)),
        q = b.lastChild,
        on = b.dataset.k === (T ? T.type : ciel.type); // la pastille suit la défense choisie (audit écran n° 14)
      if (q.textContent !== v) q.textContent = v;
      if (b._s !== on) {
        b._s = on;
        b.classList.toggle('sel', on);
      }
    }
  cielArcTick();
  {
    const sk = CIEL_BOUTIQUES.map(s => (s.b ? s.b() : '')).join('|');
    if (sk !== ciel.bk) {
      ciel.bk = sk;
      [...$('cShops').children].forEach((b, i) => {
        const s = CIEL_BOUTIQUES[i];
        b.lastChild.textContent = s && s.b ? ' · ' + s.b() : '';
      });
    }
  }
  const t = sim.cT,
    n = sim.cN || 1,
    // juste après mon appui, l'hôte n'a pas encore répondu : je me compte moi-même (audit écran n° 22)
    r =
      ciel.me && n > 1 && performance.now() - ciel.mt < 1500
        ? Math.min(n, Math.max(sim.cR || 0, ciel.mr + 1))
        : sim.cR || 0,
    rb = $('cReady'),
    sm = rb.classList.contains('arm')
      ? 'Touche encore'
      : (t >= 0 ? Math.ceil(t) + ' s' : 'vague ' + (sim.wave + 1)) +
        (n > 1 ? ' · ' + r + (r > 1 ? ' prêts' : ' prêt') + ' sur ' + n : '');
  setTxt('cReady', 'b', ciel.me ? 'Prêt ✓' : 'Prêt');
  setTxt('cReady', 'small', sm);
  // le chrono en grand dans le titre de l'aperçu, et par-dessus une boutique ouverte (audit écran n° 5 et 22)
  if ($('wT')) setTxt('wT', '', t >= 0 ? 'dans ' + Math.ceil(t) + ' s' : 'aperçu');
  {
    const shop =
        !$('armV').hidden || !$('hireV').hidden || !$('tree').hidden || !$('guideV').hidden || !$('mapV').hidden,
      ct = $('cTime'),
      on = shop && t >= 0;
    if (ct.hidden === on) ct.hidden = !on;
    if (on) {
      setTxt('cTime', '', 'Vague ' + (sim.wave + 1) + ' dans ' + Math.ceil(t) + ' s');
      ct.classList.toggle('hurry', t <= 5);
    }
  }
  if (rb._m !== ciel.me) {
    rb._m = ciel.me;
    rb.classList.toggle('on', ciel.me);
  }
  const hurry = t >= 0 && t <= 5;
  if (rb._h !== hurry) {
    rb._h = hurry;
    rb.classList.toggle('hurry', hurry);
  }
}
