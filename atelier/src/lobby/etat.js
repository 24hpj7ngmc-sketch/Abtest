// [lobby/etat.js] L'état du lobby (LB), ce qu'affiche le haut de l'écran, l'entrée et la sortie du lobby, le point d'apparition.
// ---- état du lobby
const LB = {
  env: 0,
  eye: 1.7,
  hm: null,
  on: false,
  x: 0,
  z: -19,
  y: 0,
  vy: 0,
  yaw: Math.PI,
  pitch: 0,
  bob: 0,
  spk: 0,
  spr: false,
  mg: 0,
  pas: 0,
  near: null,
  sig: '',
  seen: false,
  fov: 72,
  tool: 'main',
  item: CATK[0],
  rot: 0,
  mode: 'up',
  dig: false,
  flatH: 0,
  tx: 0,
  tz: 0,
  ok: false,
  why: '',
  dirty: 0
};
if (!Number.isFinite(save.gold)) save.gold = 300;
if (!save.loot || typeof save.loot !== 'object') save.loot = {};
const lootN = () => LOOT.filter(L => save.loot[L[0]] > 0).length,
  hasB = t => myVil().some(B => B.t === t);
function lobSync() {
  ilCheck();
  envSet(1);
  setTxt('lVer', '', 'V@VERSION@');
  const cur = tHero;
  {
    const L = save.evo || 1;
    setTxt('lRen', '', (VISIT.on ? 'En visite · ' : '') + 'Évolution ' + L + ' / 6');
  }
  setTxt('lHero', '', EL[cur].hero + ' · niv. ' + hLevel(cur));
  setTxt('lGold', '', String(save.gold));
  setTxt('lSh', '', String(save.sh[cur]));
  if (museeV) {
    for (const V of museeV.userData.loot) V.it.visible = save.loot[V.k] > 0;
    lobText(
      museeV.userData.lab,
      'MUSÉE',
      lootN() + ' / ' + LOOT.length + ' artefacts · niv. ' + bLv('musee'),
      '#ffcf5a'
    );
  }
  if (hallV) lobText(hallV.userData.lab, 'HALL DES HÉROS', EL[cur].hero + ' · hall niv. ' + bLv('hall'), elc(cur));
  $('sGrid')
    .querySelectorAll('.pick')
    .forEach(b => b.classList.toggle('cur', b.dataset.el === cur));
  goTxt('sGo', typeof IleDesCinq === 'object' ? IleDesCinq : null, cur);
  {
    const A = armsOf('ile');
    if (!A.includes(tWeap) && A.length) setWeap(A[0]); // ce jeu n'accepte pas l'arme en main : on prend la première qu'il accepte
    $('sArms').innerHTML =
      '<span>Ton arme</span>' +
      A.map(
        w =>
          `<button class="tchip${w === tWeap ? ' sel' : ''}" data-w="${w}">${wPic(w)}${WT[w].short} · niv. ${wLevel(w)}</button>`
      ).join('');
    $('sArms')
      .querySelectorAll('.tchip')
      .forEach(
        b =>
          (b.onclick = () => {
            setWeap(b.dataset.w);
            lobSync();
          })
      );
    welRow('sWel', tWeap, lobSync);
  }
  {
    const P = prepText();
    $('sPrep').textContent = P.length
      ? 'Tu emportes : ' + P.join(' · ') + '.'
      : "Rien à emporter pour l'instant : le marchand, la salle d'armes et le verger te préparent de quoi partir mieux armé.";
  }
  LB.sig = '';
  LB.hm = null;
  lobBar();
}
// le bouton qui lance la partie : il le dit quand le jeu ne connaît pas encore le héros incarné (Zéphyr, V12.1)
function goTxt(id, J, el) {
  const ok = jeuHeros(J, el);
  $(id).textContent = ok ? 'Lancer la partie avec ' + EL[el].hero : EL[el].hero + " n'est pas encore dans ce jeu";
  $(id).classList.toggle('off', !ok);
}
function lobHero(el) {
  if (tHero !== el) {
    tHero = el;
    save.last = el;
    persist();
    SND.play('pure');
    toast('Tu incarnes ' + EL[el].hero);
  }
  lobSync();
}
const LPAN = ['start', 'shopV', 'lootV', 'hallV', 'homeV', 'upV', 'tavV', 'renV', 'toitV', 'guideV', 'netV'],
  lobOv = () => LPAN.some(id => !$(id).hidden) || !$('tree').hidden || !$('mapV').hidden || !$('end').hidden;
function lobSpawn(from) {
  if (from === 'game' || from === 'toit') {
    const G = LGAMES[from === 'toit' ? 1 : 0];
    LB.x = G.x + Math.sin(G.ry) * 6.5;
    LB.z = G.z + Math.cos(G.ry) * 6.5;
    LB.yaw = G.ry + Math.PI;
  } else {
    const H = save.vil.find(B => B.t === 'maison');
    if (H) {
      LB.x = H.x + Math.sin(H.r) * 6.2;
      LB.z = H.z + Math.cos(H.r) * 6.2;
      LB.yaw = H.r + Math.PI;
    } else {
      LB.x = 0;
      LB.z = -19;
      LB.yaw = Math.PI;
    }
  }
  LB.pitch = 0;
  LB.y = walkAt(LB.x, LB.z, 1e9);
  LB.vy = 0;
}
function lobbyEnter(from) {
  if (!save.big) {
    save.big = 1;
    if (save.vil.length && !window.__nodemo) {
      save.demo = 1;
      vilMigrate();
      setTimeout(() => {
        toast('Nouvelle île, dix fois plus grande : ton village est réinstallé sur le nouveau plan');
        toastT = 7;
      }, 700);
    }
  }
  if (!save.demo) {
    save.demo = 1;
    if (!save.vil.length && !window.__nodemo) vilDemo();
    else persist();
  }
  // un village déjà installé reçoit le Verger céleste (V8.6) sur sa parcelle, une seule fois
  if (!save.vg) {
    save.vg = 1;
    if (save.vil.length && CAT.verger && !hasB('verger') && !window.__nodemo) {
      const p = PLOTS[TPLOT.verger],
        d0 = save.dev;
      save.dev = true;
      const ok = !vilWhy('verger', p.x, p.z) && vilPlace('verger', p.x, p.z, -p.a);
      save.dev = d0;
      if (ok)
        setTimeout(() => {
          toast("Nouveau bâtiment : le Verger céleste, à l'est du village");
          toastT = 6;
        }, 900);
    }
    persist();
  }
  hvGrow();
  ilCheck();
  LB.on = true;
  document.documentElement.classList.add('lobby');
  for (const id of LPAN.concat(['end', 'mapV', 'tree'])) $(id).hidden = true;
  if (from === 'game' || !LB.seen) lobSpawn(from);
  inp.sneak = false;
  $('bSneak').classList.remove('on');
  lobTool('main');
  barT = performance.now();
  joy.id = null;
  joy.f = joy.r = 0;
  joy.full = 0;
  $('knob').style.transform = '';
  $('joy').classList.remove('sprint');
  lobSync();
  if (window.__autoPanel) $('start').hidden = false;
  else if (!LB.seen && from !== 'game')
    toast(save.vil.length ? 'Bienvenue sur ton île' : 'Ton île est vide : prends le marteau pour bâtir');
  LB.seen = true;
}
