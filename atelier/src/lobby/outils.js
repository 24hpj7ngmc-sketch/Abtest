// [lobby/outils.js] La barre d'outils du lobby : main, marteau, pelle ; viser, tracer, agir (lobAct).
// ---- barre d'outils du lobby : la main (entrer, parler), le marteau (bâtir, ranger), la pelle (monter, creuser, aplanir le terrain)
const LTOOLS = { main: 'Main', marteau: 'Marteau', pelle: 'Pelle', arme: 'Arme' },
  LMODES = { up: 'Monter', down: 'Creuser', flat: 'Aplanir' };
$('lHot').innerHTML = Object.keys(LTOOLS)
  .map(
    k =>
      `<button class="slot" data-t="${k}"><canvas width="48" height="48"></canvas><small>${LTOOLS[k]}</small></button>`
  )
  .join('');
$('lHot')
  .querySelectorAll('.slot')
  .forEach(b => {
    const k = b.dataset.t,
      g = b.querySelector('canvas').getContext('2d');
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
    } else if (k === 'arme') {
      // un pistolet de profil : le canon, la culasse, la poignée et le pontet
      g.rect(4, 11, 40, 11);
      g.rect(8, 22, 14, 4);
      g.moveTo(26, 22);
      g.lineTo(37, 22);
      g.lineTo(32, 42);
      g.lineTo(23, 42);
      g.closePath();
    } else {
      g.rect(14, 20, 22, 22);
      for (let i = 0; i < 4; i++) g.rect(14 + i * 5.7, 7 + (i % 3 ? 0 : 4), 4.6, 16);
      g.rect(6, 24, 9, 6);
    }
    g.fill();
    b.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (LB.tool === k) {
        LB.a = null;
        LB.sig = '';
        return;
      }
      lobTool(k);
    });
  }); // retoucher la pelle efface le point A
function lobBar() {
  const el = $('lSub');
  el.hidden = LB.tool === 'main' || LB.tool === 'arme';
  for (const b of $('lHot').children) b.classList.toggle('sel', b.dataset.t === LB.tool);
  if (el.hidden) return;
  if (LB.tool === 'pelle')
    el.innerHTML = Object.keys(LMODES)
      .map(k => `<button class="tchip${k === LB.mode ? ' sel' : ''}" data-k="${k}">${LMODES[k]}</button>`)
      .join('');
  else
    el.innerHTML = CATK.map(k => {
      const C = CAT[k],
        done = C.u && hasB(k),
        lock = C.lv && !save.dev && C.lv > (save.evo || 1);
      return `<button class="tchip${k === LB.item ? ' sel' : ''}${done || lock ? ' done' : ''}" data-k="${k}">${C.n}${lock ? ' · évol. ' + C.lv : C.u ? (done ? ' · posé' : '') : ' · <b>' + C.c + '</b>'}</button>`;
    }).join('');
  if (LB.tool === 'marteau')
    el.innerHTML += `<button class="tchip sp" data-k="!demo">${LB.arm === 'demo' ? 'Confirmer : remplace tout' : "Village d'exemple"}</button><button class="tchip sp" data-k="!clear">${LB.arm === 'clear' ? 'Confirmer : tout ranger' : 'Tout ranger'}</button>`;
  el.querySelectorAll('.tchip').forEach(b =>
    b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k[0] === '!') {
        const a = k.slice(1);
        if (LB.arm !== a) {
          LB.arm = a;
          lobBar();
          return;
        }
        LB.arm = '';
        if (a === 'demo') {
          vilDemo();
          lobSpawn();
          toast("Village d'exemple installé");
        } else {
          vilClear();
          toast('Île vidée');
        }
        lobBar();
        LB.sig = '';
        return;
      }
      LB.arm = '';
      if (LB.tool === 'pelle') {
        LB.mode = k;
        LB.a = null;
      } else {
        LB.item = k;
        LB.rot = 0;
      }
      lobBar();
      LB.sig = '';
    })
  );
  const s = el.querySelector('.sel');
  if (s && LB.tool === 'marteau' && s.scrollIntoView)
    try {
      s.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (_) {}
}
function lobTool(k) {
  if (VISIT.on && k !== 'main' && k !== 'arme') {
    toast(VISITNO);
    toastT = 3.5;
    k = 'main';
  }
  LB.arm = '';
  LB.tool = k;
  LB.a = null;
  LB.sig = '';
  if (k === 'marteau' && CAT[LB.item].u && hasB(LB.item)) {
    const f = CATK.find(q => !(CAT[q].u && hasB(q)) && !(CAT[q].lv > (save.evo || 1) && !save.dev));
    if (f) LB.item = f;
  }
  if (LB.dirty && k !== 'pelle') {
    terrSave();
    persist();
    LB.dirty = 0;
  }
  lobBar();
}
// fantôme de pose et anneau de la pelle
const lGhostM = new THREE.MeshBasicMaterial({ color: 0x7cf07a, transparent: true, opacity: 0.5, depthWrite: false }),
  lGhostMs = { m: lGhostM, s: lGhostM, g: lGhostM, x: lGhostM },
  lGhost = new THREE.Group();
lGhost.visible = false;
lob.add(lGhost);
const BRUSH = 3.2,
  lRing = new THREE.Mesh(
    new THREE.TorusGeometry(BRUSH, 0.07, 6, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffcf5a,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
lRing.renderOrder = 5;
lRing.rotation.x = Math.PI / 2;
lRing.visible = false;
lob.add(lRing);
const lRingA = new THREE.Mesh(lRing.geometry, lRing.material),
  lBar3 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.35), lRing.material);
lRingA.rotation.x = Math.PI / 2;
lRingA.renderOrder = lBar3.renderOrder = 5;
lRingA.visible = lBar3.visible = false;
lob.add(lRingA);
lob.add(lBar3);
function lGhostSet(k) {
  if (lGhost.userData.k === k) return;
  lGhost.userData.k = k;
  while (lGhost.children.length) lGhost.remove(lGhost.children[0]);
  const C = CAT[k],
    g = K.inst(prepOf(C.ms[0], C.el ? elCtx(tHero) : undefined, C.el ? tHero : undefined), {
      cast: false,
      recv: false,
      mats: lGhostMs
    }),
    p = g.userData.prep;
  if (p.scale) g.scale.setScalar(p.scale);
  lGhost.add(g);
}
// point visé sur le terrain : on suit le regard jusqu'à toucher le sol (au plus `max` mètres devant soi)
function lobAim() {
  const cp = Math.cos(LB.pitch),
    dx = -Math.sin(LB.yaw),
    dz = -Math.cos(LB.yaw),
    dy = Math.sin(LB.pitch),
    ey = LB.y + LB.eye;
  let d = 16;
  if (dy < -0.05)
    for (d = 3; d < 16; d += 0.3) {
      if (ey + dy * d <= hAt(LB.x + dx * cp * d, LB.z + dz * cp * d)) break;
    }
  const g = Math.max(3, Math.min(16, d * (dy < -0.05 ? cp : 1)));
  LB.tx = LB.x + dx * g;
  LB.tz = LB.z + dz * g;
}
// pelle : Monter ajoute un cran (1,6 m) à l'endroit visé, Creuser en retire un, Aplanir ramène le sol à la hauteur de ses pieds. Un appui = une fois ; doigt maintenu = à la chaîne.
const LSTEP = 1.6,
  LLINE = 96,
  LBR = 6.4;
function lobLineWhy(ax, az, bx, bz) {
  if (Math.hypot(bx - ax, bz - az) > LLINE) return 'Tracé trop long';
  if (Math.hypot(bx, bz) > RI - 2 || Math.hypot(ax, az) > RI - 2) return "Hors de l'île";
  return '';
}
function lobLine(ax, az, bx, bz, m, href) {
  if (lobLineWhy(ax, az, bx, bz)) return false;
  const vx = bx - ax,
    vz = bz - az,
    l2 = vx * vx + vz * vz,
    hA = href === undefined ? hAt(ax, az) : href;
  let ch = false;
  for (let i = 0; i < TH.length; i++) {
    if (TLOCK[i]) continue;
    const x = -VH + (i % VW) * VC,
      z = -VH + Math.floor(i / VW) * VC;
    let t = l2 > 0 ? ((x - ax) * vx + (z - az) * vz) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - ax - vx * t, z - az - vz * t);
    if (d >= LBR) continue;
    const w = 0.5 + 0.5 * Math.cos((Math.PI * d) / LBR);
    let hh = TH[i];
    if (m === 'up') hh += LSTEP * w;
    else if (m === 'down') hh -= LSTEP * w;
    else hh += (hA - MH[i] - hh) * Math.min(1, w * 1.6);
    hh = Math.max(TMIN, Math.min(TMAX, hh));
    if (hh !== TH[i]) {
      TH[i] = hh;
      ch = true;
    }
  }
  if (ch) {
    terrDraw();
    terrSave();
    vilGround();
    persist();
    SND.play('stone');
  }
  return ch;
}
function lobAct(n) {
  const N = LB.near;
  if (lobOv()) return;
  if (LB.tool === 'marteau') {
    if (n === 1) {
      if (vilPlace(LB.item, LB.tx, LB.tz, LB.yaw + LB.rot)) {
        const C = CAT[LB.item];
        if (C.u) {
          const f = CATK.find(q => !(CAT[q].u && hasB(q)) && !(CAT[q].lv > (save.evo || 1) && !save.dev));
          if (f) LB.item = f;
          lobBar();
          toast(C.n + ' : posé');
        }
      } else if (LB.why) toast(LB.why);
    } else if (n === 2) LB.rot += Math.PI / 4;
    else if (n === 3 && LB.takeB) {
      const B = LB.takeB;
      vilTake(B);
      toast(CAT[B.t].n + ' : rangé' + (B.c ? ' · +' + B.c + ' or' : ''));
    }
    return;
  }
  if (LB.tool === 'arme') {
    if (n === 1) armeShow();
    return;
  }
  if (LB.tool === 'main' && n === 2) {
    if (N && N.B) {
      if (VISIT.on) {
        toast(VISITNO);
        toastT = 3.5;
      } else upOpen(N.B);
    }
    return;
  }
  if (LB.tool === 'pelle') {
    if (n !== 1) return;
    const w = lobLineWhy(LB.tx, LB.tz, LB.tx, LB.tz);
    if (w) {
      toast(w);
      return;
    }
    LB.flatH = LB.y;
    LB.last = [LB.tx, LB.tz];
    if (!lobLine(LB.tx, LB.tz, LB.tx, LB.tz, LB.mode, LB.flatH)) toast('Rien à modifier ici');
    return;
  }
  if (!N) return;
  if (N.k === 'guide') {
    guideTalk();
    return;
  }
  if (VISIT.on && N.B && !myB(N.B)) {
    toast("Tu n'as pas encore ce bâtiment sur ton île : ici, il ne s'ouvre pas pour toi");
    toastT = 3.5;
    return;
  }
  if (N.k === 'portal') {
    if (!N.G.open) toast('Ce portail est encore scellé');
    else if (N.G.id === 'toit') toitOpen();
    else {
      $('start').hidden = false;
      SND.play('tick');
    }
  } else if (N.k === 'hall') hallOpen();
  else if (N.k === 'armes') openTree('arme');
  else if (N.k === 'musee') lootOpen();
  else if (N.k === 'shop') shopOpen();
  else if (N.k === 'maison') homeOpen();
  else if (N.k === 'taverne') tavOpen();
  else if (N.k === 'mine' || N.k === 'verger') {
    if (VISIT.on) {
      toast(VISITNO);
      toastT = 3.5;
    } else upOpen(N.B);
  }
}
// les boutons du lobby répondent dès que le doigt se pose (même avec l'autre pouce sur le joystick) ; le « clic » qui suit ne doit pas traverser vers le panneau qui vient de s'ouvrir
let lGuard = 0;
document.addEventListener(
  'click',
  e => {
    if (performance.now() < lGuard) {
      e.stopPropagation();
      e.preventDefault();
    }
  },
  true
);
// au lobby, le bouton Action fait l'action 1 de l'outil en main (entrer, poser, modeler) et le bouton libre l'action 2 ou 3 (améliorer, tourner, ranger) : voir padAct et padFree
function lobPress(n, e) {
  e.preventDefault();
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch (_) {}
  lGuard = performance.now() + 450;
  lobAct(n);
  if (n === 1 && LB.tool === 'pelle' && !lobOv()) {
    LB.hold = true;
    LB.holdId = e.pointerId;
  }
}
// pelle : un appui modifie le terrain une fois, là où l'on regarde ; en gardant le doigt appuyé, on continue à la chaîne à mesure que le point visé se déplace
for (const ev of ['pointerup', 'pointercancel'])
  window.addEventListener(
    ev,
    e => {
      if (LB.hold && e.pointerId === LB.holdId) LB.hold = false;
    },
    true
  );
$('sBack').onclick = () => {
  $('start').hidden = true;
};
$('dtBack').onclick = () => {
  $('toitV').hidden = true;
};
$('dtGo').onclick = () => toitGo(tHero);
$('sGo').onclick = () => ileGo(tHero);
