// hud.js — le HUD pendant la partie : messages (toast, grand message, gains qui flottent), chiffres du haut, panneau du jour,
// noms et états des boutons (uiTick, appelé à chaque image), repères au bord de l'écran, réticule et tir auto (onTarget).
// Utilise des règles : HEROS, NLV, SLOTS, DOORS, PLANKS_MAX, TT, ZT, ROADS, FACES, FACEN, B, H, weapOf, shopNear, zipSpot, climbSpot,
// doorPick, placedCount, inPlaza, viewDir, eyeP, rayWall ; de l'affichage : camera (pour placer les gains à l'écran).
// Les tests appellent uiTick et lisent #toast, #big, #bJump, #aLab…

// ---------------------------------------------------------------- messages
// petit message sous le centre de l'écran (ms : durée, 2,2 s par défaut)
let toastT = null;
function toast(texte, ms) {
  const el = $('toast');
  el.textContent = texte;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), ms || 2200);
}
// grand message au tiers haut (cls : '' | 'red' | 'gold')
let bigT = null;
function bigMsg(titre, sous, cls, ms) {
  const el = $('big');
  el.querySelector('b').textContent = titre;
  el.querySelector('small').textContent = sous || '';
  el.className = 'on ' + (cls || '');
  clearTimeout(bigT);
  bigT = setTimeout(() => (el.className = cls || ''), ms || 2600);
}
// un point du monde → l'écran (−1 à 1 sur chaque axe), avec la caméra de l'affichage ; z = 9 s'il est derrière
function proj(x, y, z) {
  const c = camera.position,
    vx = x - c.x,
    vy = y - c.y,
    vz = z - c.z,
    cy = Math.cos(camera.rotation.y),
    sy = Math.sin(camera.rotation.y),
    cp = Math.cos(camera.rotation.x),
    sp = Math.sin(camera.rotation.x);
  const x1 = vx * cy - vz * sy,
    z1 = vx * sy + vz * cy,
    y2 = vy * cp + z1 * sp,
    z2 = -vy * sp + z1 * cp;
  if (z2 > -0.1) return { x: 9, y: 9, z: 9 };
  const f = Math.tan((camera.fov * Math.PI) / 360);
  return { x: x1 / (-z2 * f * camera.aspect), y: y2 / (-z2 * f), z: 0 };
}
// les gains qui flottent au-dessus d'un zombie abattu (« +12 $ ») : 8 au plus, réutilisés
const flos = [];
function floater(x, y, z, txt) {
  const ecran = proj(x, y, z);
  if (ecran.z > 1 || Math.abs(ecran.x) > 1.1 || Math.abs(ecran.y) > 1.1) return;
  let bulle = flos.find(f => f.t <= 0);
  if (!bulle) {
    if (flos.length >= 8) return;
    bulle = { el: document.createElement('div'), t: 0 };
    bulle.el.className = 'flo';
    $('floats').appendChild(bulle.el);
    flos.push(bulle);
  }
  const larg = $('hudIn').clientWidth,
    haut = $('hudIn').clientHeight;
  bulle.x = (ecran.x * 0.5 + 0.5) * larg;
  bulle.y = (-ecran.y * 0.5 + 0.5) * haut;
  bulle.t = 0.9;
  bulle.el.textContent = txt;
  bulle.el.style.display = 'block';
}
// fait monter et s'effacer les gains (0,9 s)
function flosTick(dt) {
  for (const bulle of flos) {
    if (bulle.t <= 0) continue;
    bulle.t -= dt;
    bulle.el.style.left = bulle.x + 'px';
    bulle.el.style.top = bulle.y - (0.9 - bulle.t) * 40 + 'px';
    bulle.el.style.opacity = Math.min(1, bulle.t * 2.5);
    if (bulle.t <= 0) bulle.el.style.display = 'none';
  }
}

// ---------------------------------------------------------------- l'interface pendant la partie
// le bouton du haut à droite : « Améliorations » entre deux jours (« Ils arrivent ») ;
// V3.5 : en mode fuite, les améliorations s'achètent aux boutiques (toit, rez-de-chaussée) :
// « Boutique » n'apparaît qu'à côté d'une boutique, à tout moment
function treeBtn() {
  const btn = $('bTree');
  if (!S) {
    btn.hidden = true;
    return;
  }
  if (S.mode === 'out') {
    const boutique = shopNear(S);
    btn.hidden = !(boutique >= 0 && S.phase !== 'dead' && S.phase !== 'won' && !S.p.clb);
    if (btn._t !== 'Boutique') {
      btn._t = 'Boutique';
      btn.textContent = 'Boutique';
    }
  } else {
    btn.hidden = S.phase !== 'prep';
    if (btn._t !== 'Améliorations') {
      btn._t = 'Améliorations';
      btn.textContent = 'Améliorations';
    }
  }
  // V4.5 (comme le Marchand de L'Île des Cinq V1.2) : le bouton pâlit quand rien n'est achetable, et se dore sinon.
  // Recalculé seulement quand l'argent ou l'arbre changent.
  if (!btn.hidden) {
    let niveaux = 0;
    for (const id in save.lv) niveaux += save.lv[id] || 0;
    const cle = save.cash + ':' + niveaux;
    if (btn._k !== cle) {
      btn._k = cle;
      btn.classList.toggle(
        'has',
        NODES.some(n => {
          const niv = save.lv[n.id] || 0;
          return visible(n) && niv < n.max && save.cash >= nodeCost(n, niv);
        })
      );
    }
  }
}
// au début de chaque préparation (et d'une partie) : sous-barre et bouton d'améliorations
function prepUI() {
  subBuild();
  treeBtn();
}
// à chaque image pendant la partie : chiffres, panneau du jour, noms des boutons, Action selon l'outil, réticule, voile rouge, repères
function uiTick(dt) {
  const p = S.p,
    P = S.P;
  // chiffres du haut (Ville en mode fuite, Vie, $, Jour, Niveau)
  setTxt('sLv', 'b', S.plv >= NLV ? 'Toit' : S.plv === 0 ? 'RdC' : S.plv + 'e');
  $('sCity').hidden = S.mode !== 'out';
  if (S.mode === 'out') {
    setTxt('sCity', 'b', String(Math.ceil(S.city)));
    $('sCity').classList.toggle('low', S.city < ((S.invite && S.mVilleMax) || S.P.hp) * 0.3);
  }
  // V4.5 (écran au modèle de L'Île des Cinq V1.2) : en mode fuite, la vie n'est plus qu'une barre fine sous la barre d'outils ;
  // le chiffre reste en haut dans « Ils arrivent », où la vie du joueur est la partie
  $('sHp').hidden = S.mode === 'out';
  setTxt('sHp', 'b', String(Math.ceil(p.hp)));
  $('sHp').classList.toggle('low', p.hp < p.hpMax * 0.3);
  setTxt('sCash', 'b', fmt(save.cash));
  setTxt('sDay', 'b', S.day + (S.endless ? '' : '/10'));
  $('hpF').style.width = (p.hp / p.hpMax) * 100 + '%';
  // V4.9 : le bouclier (Soigneuse)
  $('hpS').style.width = Math.min(100, ((p.boucl || 0) / p.hpMax) * 100) + '%';
  $('hp').classList.toggle('low', p.hp < p.hpMax * 0.3);
  setTxt('hpT', '', Math.ceil(p.hp) + ' / ' + Math.round(p.hpMax));
  // panneau du haut. V4.5 : pendant le jour, plus de bandeau : les zombies restants et ceux entrés dans l'immeuble sont des chiffres
  // de plus en haut à droite ; le panneau ne sert qu'entre deux jours (aperçu, « Lancer le jour »), au jour tenu et à l'hélico
  const phase = S.phase;
  $('go').hidden = phase !== 'prep';
  $('wBar').hidden = true;
  $('wave').classList.toggle('vide', phase === 'day');
  $('sLeft').hidden = phase !== 'day';
  if (phase === 'day') setTxt('sLeft', 'b', fmt(Math.max(0, S.left)));
  let dedans = 0;
  if (phase === 'day')
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k],
        etat = S.z.st[i];
      if (etat === 7 || (etat === 3 && S.z.lv[i] < NLV)) dedans++;
    }
  $('sIn').hidden = !dedans;
  if (dedans) setTxt('sIn', 'b', String(dedans));
  treeBtn();
  rulesBtn(); // V4.2 : « Règles » à côté du Guide (regles.js)
  if (phase === 'prep') {
    setTxt('wT', '', 'JOUR ' + S.day + (S.endless ? ' (sans fin)' : ''));
    $('wI').innerHTML =
      dayLine(S.day).replace(/(nouvelle route : .*)/, '<em>$1</em>') +
      (S.mode === 'out' ? "<br>Ils vont sortir de l'immeuble : couvre les sorties." : '<br>Pose tes tourelles, puis lance le jour.');
  } else if (phase === 'clear') {
    setTxt('wT', '', 'JOUR ' + S.day + ' TENU');
    $('wI').textContent = 'Le soleil se lève…';
  } else if (phase === 'rescue') {
    setTxt('wT', '', "L'HÉLICO ARRIVE");
    $('wI').textContent = S.heliT < 9 ? 'Tiens bon encore un peu…' : "Cours jusqu'à l'hélicoptère !";
  }
  // boutons
  // tyrolienne et escalade : Saut change de nom au bon endroit (V4.7 : l'escalade est offerte, la tyrolienne se débloque)
  {
    const fuite = S.mode === 'out' && !flying(),
      tyro = fuite && S.P.tyro.on ? zipSpot(S) : null,
      prise = fuite && !tyro ? climbSpot(S) : null,
      escalade = prise && (prise.free || S.P.grimpe.on) ? prise : null;
    setLbl('bJump', S.p.zip ? 'Lâcher' : tyro ? 'Tyrolienne' : escalade ? (escalade.dir > 0 ? 'Grimper' : 'Descendre') : 'Saut');
    $('bJump').classList.toggle('clb', !!(escalade || tyro || S.p.zip));
  }
  // compétence et ultime : ceux du héros (mode fuite), sinon Missile et Onde
  const btnComp = $('bAb'),
    btnUlt = $('bUlt');
  if (S.hero) {
    const hero = HEROS[S.hero];
    setLbl('bAb', hero.sk);
    setLbl('bUlt', hero.ul);
    btnComp.style.borderColor = S.hab > 0 ? '' : hero.c;
    btnComp.classList.toggle('idle', S.hab > 0);
    setTxt('bAb', 'small', S.hab > 0 ? Math.ceil(S.hab) + ' s' : 'prêt');
    btnUlt.classList.toggle('rdy', S.ult >= 1);
    btnUlt.classList.remove('idle');
    setTxt('bUlt', 'small', Math.floor(S.ult * 100) + ' %');
  } else {
    setLbl('bAb', 'Missile');
    setLbl('bUlt', 'Onde');
    btnComp.style.borderColor = '';
    btnComp.classList.toggle('idle', !P.mis.on || S.misCd > 0);
    setTxt('bAb', 'small', !P.mis.on ? '—' : S.misCd > 0 ? Math.ceil(S.misCd) + ' s' : 'prêt');
    btnUlt.classList.toggle('rdy', P.onde.on && S.ult >= 1);
    btnUlt.classList.toggle('idle', !P.onde.on);
    setTxt('bUlt', 'small', !P.onde.on ? '—' : Math.floor(S.ult * 100) + ' %');
  }
  // Action et bouton libre selon l'outil en main
  if (tool === 'fusil') {
    const arme = weapOf(S);
    if (arme.scope) padSet('Tir', snipe ? 'relâche' : 'tiens', '', 'Viser', '', ads, 'Sniper', 'tiens Tir : lunette · relâche : tir');
    else padSet('Tir', autoOn ? 'auto' : '', '', 'Viser', '', ads);
  } else if (tool === 'masse') {
    padSet('Frapper', '', '', '', '', false, 'Masse', 'casse les cloisons');
  } else if (tool === 'marteau') {
    aimSlot = pickSlot();
    aimDoor = doorPick(S);
    // un emplacement et une porte visés : la porte passe avant un emplacement lointain (vu par l'embrasure)
    if (aimSlot >= 0 && aimDoor >= 0) {
      const emp = SLOTS[aimSlot],
        oeil = eyeP(S.p);
      if (Math.hypot(emp.x - oeil[0], emp.y - oeil[1], emp.z - oeil[2]) < 3.2) aimDoor = -1;
      else aimSlot = -1;
    }
    if (aimSlot >= 0 && tourelleAutre(aimSlot)) {
      // V4.6 : à plusieurs, la tourelle d'un autre joueur occupe l'emplacement
      const posee = save.layout[aimSlot];
      padSet('—', '', 'idle', posee ? 'Retirer' : '', '', false, SLOTS[aimSlot].n, "pris par la tourelle d'un autre joueur", true);
    } else if (aimSlot >= 0) {
      const emp = SLOTS[aimSlot],
        posee = save.layout[aimSlot],
        plein = !posee && placedCount(save) >= P.turrets;
      padSet(
        posee === ptype ? '—' : posee ? 'Remplacer' : 'Poser',
        '',
        plein ? 'poor' : 'go',
        posee ? 'Retirer' : '',
        '',
        false,
        emp.n,
        posee ? TT[posee].n + (posee !== ptype ? ' → ' + TT[ptype].n : '') : plein ? 'plus de tourelle libre' : 'vide → ' + TT[ptype].n,
        plein
      );
    } else if (aimDoor >= 0) {
      const porte = DOORS[aimDoor],
        plein = porte.planks >= PLANKS_MAX;
      padSet(
        'Barricader',
        plein ? 'Complet' : porte.planks + ' / ' + PLANKS_MAX,
        plein ? 'idle' : 'go',
        '',
        '',
        false,
        doorName(porte),
        plein ? 'barricadée' : firing || keys['f'] ? 'on cloue…' : 'maintiens appuyé'
      );
    } else padSet('Poser', '', 'idle', '', '', false, '', S.mode === 'out' ? 'Vise un cercle blanc ou une porte' : 'Vise un cercle blanc');
  } else if (tool === 'leurre') {
    const recharge = S.leuCd;
    padSet(
      'Lancer',
      recharge > 0 ? Math.ceil(recharge) + ' s' : '',
      recharge > 0 || phase !== 'day' ? 'idle' : 'go',
      '',
      '',
      false,
      'Leurre',
      'attire la horde au sol'
    );
  } else if (tool === 'grappin') {
    // V4.7 : le grappin : où il mène, sous le viseur
    const recharge = S.grapCd || 0,
      g = S.p.clb ? null : grappinVise(S);
    padSet(
      'Lancer',
      recharge > 0 ? recharge.toFixed(1) + ' s' : '',
      g && recharge <= 0 ? 'go' : 'idle',
      '',
      '',
      false,
      'Grappin',
      S.p.clb ? '' : g ? 'vers ' + g.n : 'rien à attraper (' + S.P.grap.r + ' m)',
      !g && !S.p.clb
    );
  } else if (tool === 'frappe') {
    const recharge = S.airCd;
    padSet(
      'Appeler',
      recharge > 0 ? Math.ceil(recharge) + ' s' : '',
      recharge > 0 || phase !== 'day' ? 'idle' : 'go',
      '',
      '',
      false,
      'Frappe aérienne',
      'vise une rue'
    );
  }
  if (tool !== 'marteau') aimSlot = aimDoor = -1;
  // le panneau du jour ne cache pas la porte qu'on barricade
  $('wave').classList.toggle('mini', aimDoor >= 0 && aimSlot < 0);
  hotTick();
  // réticule, douleur
  const reticule = $('cross');
  reticule.classList.toggle('ads', ads && tool === 'fusil');
  reticule.classList.toggle('on', autoOn);
  // V4.9 : Sniper, le tir est chargé
  reticule.classList.toggle('charge', !!(S.voie && tirCharge(S)));
  if (p.hp > lastHp) hurtAcc = 0;
  if (p.hp < lastHp) {
    hurtV = Math.min(1, hurtV + (lastHp - p.hp) / 25 + 0.15);
    // V4.0 : le joueur mordu s'entend enfin (le son existait sans être joué) : un coup sourd tous les 3 PV perdus, au plus toutes les 0,2 s
    hurtAcc += lastHp - p.hp;
    if (hurtAcc >= 3) {
      hurtAcc = 0;
      SND.play('hurt');
    }
  }
  lastHp = p.hp;
  hurtV = Math.max(0, hurtV - dt * 0.9);
  $('hurt').style.opacity = Math.max(hurtV, p.hp < p.hpMax * 0.25 ? 0.35 + Math.sin(performance.now() / 180) * 0.15 : 0);
  edgeTick();
}
// mode fuite : les rues où ils sont nombreux à filer (hors de la vue), sur les bords de l'écran (les 4 côtés groupent les 8 rues)
function edgeOut() {
  const Z = S.z,
    parRue = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] && !inPlaza(Z.x[i], Z.z[i])) parRue[Z.road[i]]++;
  }
  const cotes = [[], [], [], []];
  for (let r = 0; r < 8; r++) {
    if (!parRue[r]) continue;
    const rue = ROADS[r],
      angle = Math.atan2(-(rue.b[0] - S.p.x), -(rue.b[1] - S.p.z)) - S.p.yaw,
      ecart = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(ecart) < 0.55) continue;
    cotes[ecart > 0 ? 0 : 1].push([rue.n, parRue[r]]);
  }
  for (let k = 0; k < 4; k++) {
    const el = edgeEls[k],
      liste = cotes[k];
    if (!liste || !liste.length) {
      el.hidden = true;
      continue;
    }
    el.hidden = false;
    const nombre = liste.reduce((somme, q) => somme + q[1], 0);
    el.textContent =
      (k === 0 ? '◀ ' : '') + nombre + " s'enfuient · " + liste.map(q => q[0].replace('ruelle ', '')).join(', ') + (k === 1 ? ' ▶' : '');
    el.style.left = k === 0 ? '120px' : '';
    el.style.right = k === 1 ? '250px' : '';
  }
}
// repères au bord de l'écran (4 étiquettes réutilisées) : « Ils arrivent », là où ils arrivent en haut des façades
const edgeEls = [0, 1, 2, 3].map(() => {
  const el = document.createElement('div');
  el.className = 'edge';
  el.hidden = true;
  $('edges').appendChild(el);
  return el;
});
// une image sur six seulement
let edgeT = 0;
function edgeTick() {
  if ((edgeT += 1) % 6) return;
  const Z = S.z,
    parFace = [0, 0, 0, 0];
  if (S.mode === 'out') {
    edgeOut();
    return;
  }
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] === 2 && Z.y[i] > H - 5) parFace[Z.f[i]]++;
  }
  for (let face = 0; face < 4; face++) {
    const el = edgeEls[face],
      nombre = parFace[face];
    if (!nombre) {
      el.hidden = true;
      continue;
    }
    const fx = FACES[face][0] * B,
      fz = FACES[face][1] * B,
      angle = Math.atan2(-(fx - S.p.x), -(fz - S.p.z)) - S.p.yaw;
    let ecart = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(ecart) < 0.55) {
      el.hidden = true;
      continue;
    }
    el.hidden = false;
    el.textContent = (ecart > 0 ? '◀ ' : '') + nombre + ' en haut · ' + FACEN[face] + (ecart < 0 ? ' ▶' : '');
    el.style.left = ecart > 0 ? '120px' : '';
    el.style.right = ecart < 0 ? '250px' : '';
  }
}
// le réticule devient rouge quand un zombie est dans l'axe (et tire tout seul si « tir auto sur cible ») ; les murs arrêtent la vue
function onTarget() {
  const p = S.p,
    dir = viewDir(p),
    oeil = eyeP(p),
    Z = S.z;
  let portee = Math.min(150, weapOf(S).range);
  if (dir[1] < -1e-3) portee = Math.min(portee, oeil[1] / -dir[1]);
  portee = rayWall(oeil[0], oeil[1], oeil[2], dir[0], dir[1], dir[2], portee);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] === 0) continue;
    const type = ZT[Z.ty[i]],
      cx = Z.x[i] - oeil[0],
      cy = Z.y[i] + 1.05 * type.sc - oeil[1],
      cz = Z.z[i] - oeil[2],
      dist = cx * dir[0] + cy * dir[1] + cz * dir[2];
    if (dist < 0.3 || dist > portee + 0.4) continue;
    const ecart2 = cx * cx + cy * cy + cz * cz - dist * dist,
      tol = type.r * 1.05 + 0.15 + dist * 0.014;
    if (ecart2 < tol * tol) return true;
  }
  return false;
}
