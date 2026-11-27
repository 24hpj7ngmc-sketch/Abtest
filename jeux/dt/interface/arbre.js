// arbre.js — l'arbre d'améliorations, ouvert depuis le menu, l'écran de fin, ou en partie (« Améliorations » entre deux jours,
// « Boutique » en mode fuite) : la carte des cases qu'on fait glisser, la case choisie et sa fiche (valeur actuelle → suivante, prix,
// Acheter). La partie est en pause tant qu'il est ouvert.
// Utilise des règles : NODES / NODE (les cases : position, branche, niveau max, prérequis), nodeCost, derive (améliorations dérivées P),
// buildTurrets, START_DAYS, PANELS ; des sons : SND.
// Les tests appellent openTree (aussi par __dt.openTree), __dt.treeSel (choisir une case) et lisent #tInfo.

// ---------------------------------------------------------------- l'arbre d'améliorations
// couleur et nom de chaque branche
const BR = {
  base: '#f1ece2',
  fusil: '#ff8a5a',
  tour: '#ffcf5a',
  spec: '#ff5ad0',
  cap: '#6ac8ff',
  vie: '#7bd88f',
  eco: '#e8d06a',
  imm: '#c9a27a'
};
const BRN = { fusil: 'Fusil', tour: 'Tourelles', spec: 'Spéciaux', cap: 'Capacités', vie: 'Survie', eco: 'Butin', imm: 'Immeuble' };
// TU : écart entre deux cases (px) ; (TOX, TOY) : position de la racine sur la carte de l'arbre (1200 × 1050 px)
const TU = 118,
  TOX = 470,
  TOY = 440;
// treeFrom : d'où l'arbre a été ouvert ('start' | 'end' | 'run') ; tSel : case choisie ; tPan : décalage de la carte ;
// tDrag : le doigt qui la fait glisser
let treeFrom = 'start',
  tSel = 'root',
  tPan = { x: 0, y: 0 },
  tDrag = null;
// la valeur d'une case avec les niveaux `niveaux` (« 5.0 tirs/s ») : sert à montrer « maintenant → au niveau suivant »
function nodeVal(id, niveaux) {
  const P = derive(niveaux),
    niv = k => niveaux[k] || 0,
    pourcent = v => Math.round(v * 100) + ' %',
    chiffre = v => v.toFixed(v < 10 ? 1 : 0);
  switch (id) {
    case 'root':
      return '';
    case 'f_dmg':
      return chiffre(P.rDmg) + ' dégâts';
    case 'f_rate':
      return P.rRate.toFixed(1) + ' tirs/s';
    case 'f_crit':
      return pourcent(P.rCrit);
    case 'f_pierce':
      return P.rPierce + ' zombie' + (P.rPierce > 1 ? 's' : '');
    case 'f_exp':
      return P.rExp ? pourcent(P.rExp) + ' des dégâts' : 'non';
    case 't_slot':
      return P.turrets + ' tourelles';
    case 'mg_dmg':
      return chiffre(P.mg.dmg) + ' / balle';
    case 'mg_rate':
      return P.mg.rate.toFixed(1) + ' balles/s';
    case 'mg_range':
      return P.mg.range + ' m';
    case 'mg_twin':
      return niv(id) ? 'oui' : 'non';
    case 'la_unl':
    case 'mo_unl':
    case 'fl_unl':
    case 'a_mis':
    case 'a_leu':
    case 'a_onde':
    case 'a_air':
    case 'b_mur':
    case 'a_leu_boom':
      return niv(id) ? 'débloqué' : 'verrouillé';
    case 'la_dmg':
      return chiffre(P.la.dps) + ' / s';
    case 'la_ramp':
      return '+' + pourcent(P.la.ramp);
    case 'la_prism':
      return P.la.beams + ' rayon' + (P.la.beams > 1 ? 's' : '');
    case 'mo_dmg':
      return chiffre(P.mo.dmg) + ' / obus';
    case 'mo_rad':
      return P.mo.rad.toFixed(1) + ' m';
    case 'mo_frag':
      return P.mo.frag * 2 + ' sous-munitions';
    case 'fl_dmg':
      return chiffre(P.fl.dps) + ' / s';
    case 'fl_range':
      return P.fl.range.toFixed(1) + ' m';
    case 'fl_nap':
      return niv(id) ? 'niveau ' + niv(id) : 'non';
    case 'a_mis_dmg':
      return chiffre(P.mis.dmg) + ' dégâts';
    case 'a_mis_cd':
      return P.mis.cd.toFixed(1) + ' s';
    case 'a_leu_dur':
      return P.leu.dur + ' s';
    case 'a_onde_ch':
      return P.onde.need + ' zombies';
    case 'a_onde_pw':
      return '×' + P.onde.pw.toFixed(1);
    case 'a_air_n':
      return P.air.n + ' bombes';
    case 's_hp':
      return P.hp + ' PV';
    case 's_reg':
      return P.regen + ' PV/s';
    case 's_arm':
      return '−' + Math.round((1 - P.armor) * 100) + ' %';
    case 'e_cash':
      return '×' + P.cash.toFixed(2);
    case 'e_day':
      return '×' + P.dayB.toFixed(1);
    case 'e_start':
      return 'jour ' + START_DAYS[niv(id)];
    case 'b_murh':
      return P.murH.toFixed(1) + ' m';
    case 'b_barb':
      return P.barb ? chiffre(P.barb) + ' / s' : 'non';
    case 'w_masse':
      return niv(id) ? 'débloquée' : 'verrouillée';
    case 'w_masse_pw': {
      // coups de masse pour casser un panneau de cloison neuf
      const coups = Math.ceil(((PANELS[0] || {}).hp0 || 8) / P.masse.wall - 1e-6);
      return (Math.round(P.masse.dmg) + ' dégâts · ' + coups + ' coup' + (coups > 1 ? 's' : '') + '/mur').replace(/ /g, ' ');
    }
    case 'w_masse_sp':
      return P.masse.swing.toFixed(2) + ' s par coup';
  }
  return '';
}
// une case est visible si sa case d'avant est achetée ; « teaser » (cercle « ? ») si c'est celle d'encore avant qui l'est
const visible = n => !n.req || (save.lv[n.req] || 0) > 0,
  teaser = n => n.req && !visible(n) && (!NODE[n.req].req || (save.lv[NODE[n.req].req] || 0) > 0);
// ouvrir l'arbre depuis 'start' (menu), 'end' (écran de fin) ou 'run' (en partie : pause) ; la racine est centrée,
// +6 : le contour de sélection de la branche masse (x = −4,15) ne touche pas la légende
function openTree(from) {
  treeFrom = from;
  $('tree').hidden = false;
  $('start').hidden = true;
  $('endV').hidden = true;
  if (from === 'run') running = false;
  const larg = rot ? innerHeight : innerWidth,
    haut = rot ? innerWidth : innerHeight,
    zoom = Math.max(0.62, Math.min(1, haut / 560));
  tPan = { x: larg / 2 - (TOX + 60) * zoom + 6, y: haut / 2 - (TOY - 10) * zoom };
  treeDraw();
}
// tZ : échelle de la carte (petits écrans : jusqu'à 0,62)
let tZ = 1;
// redessine les traits entre cases (SVG), les cases (boutons ronds, carrés pour les spéciaux), l'argent, la légende et la fiche
function treeDraw() {
  const carte = $('tMap');
  tZ = Math.max(0.62, Math.min(1, (rot ? innerWidth : innerHeight) / 560));
  carte.style.transform = `translate(${tPan.x}px,${tPan.y}px) scale(${tZ})`;
  let traits = '';
  for (const n of NODES) {
    if (!n.req || (!visible(n) && !teaser(n))) continue;
    const parent = NODE[n.req];
    traits += `<line x1="${TOX + parent.x * TU}" y1="${TOY + parent.y * TU}" x2="${TOX + n.x * TU}" y2="${TOY + n.y * TU}" stroke="${(save.lv[n.id] || 0) > 0 ? BR[n.b] : 'rgba(255,255,255,.18)'}" stroke-width="${(save.lv[n.id] || 0) > 0 ? 3 : 2}"/>`;
  }
  $('tSvg').innerHTML = traits;
  carte.querySelectorAll('.tn').forEach(e => e.remove());
  for (const n of NODES) {
    const niv = save.lv[n.id] || 0,
      vis = visible(n),
      te = teaser(n);
    if (!vis && !te) continue;
    const btn = document.createElement('button');
    const achetable = vis && niv < n.max && save.cash >= nodeCost(n, niv);
    btn.className =
      'tn' +
      (n.b === 'spec' ? ' spec' : '') +
      (n.id === 'root' ? ' root' : '') +
      (!vis ? ' lock' : '') +
      (niv > 0 ? ' own' : '') +
      ((niv >= n.max && n.max > 1) || (n.max === 1 && niv > 0 && n.id !== 'root') ? ' max' : '') +
      (achetable ? ' can' : '') +
      (tSel === n.id ? ' sel' : '');
    btn.style.left = TOX + n.x * TU + 'px';
    btn.style.top = TOY + n.y * TU + 'px';
    btn.style.setProperty('--c', BR[n.b]);
    btn.innerHTML = `<span>${n.n}</span><em>${n.id === 'root' ? '' : niv + '/' + n.max}</em>`;
    btn.dataset.id = n.id;
    carte.appendChild(btn);
  }
  $('tCash').textContent = fmt(save.cash) + ' $';
  $('tLeg').innerHTML = Object.keys(BRN)
    .map(k => `<span style="--c:${BR[k]}"><i></i>${BRN[k]}</span>`)
    .join('');
  tInfo();
}
// la fiche de la case choisie ; « Acheter » prend l'argent, monte le niveau et applique tout de suite à la partie en cours
function tInfo() {
  const n = NODE[tSel],
    niv = save.lv[n.id] || 0,
    fiche = $('tInfo');
  if (!visible(n)) {
    fiche.innerHTML = "<h2>?</h2><p>Achète la case d'avant pour découvrir celle-ci.</p>";
    return;
  }
  const apres = Object.assign({}, save.lv);
  apres[n.id] = niv + 1;
  const valeur = nodeVal(n.id, save.lv),
    suivante = niv < n.max ? nodeVal(n.id, apres) : '';
  const prix = nodeCost(n, niv);
  // « Raccourci » (e_start) : chaque niveau demande d'avoir déjà atteint son jour de départ
  let verrou = '';
  if (n.id === 'e_start' && niv < n.max && bestOf() < START_DAYS[niv + 1]) verrou = "Atteins d'abord le jour " + START_DAYS[niv + 1] + '.';
  fiche.innerHTML =
    `<h2 style="color:${BR[n.b]}">${n.n}</h2><p>${n.d}</p>` +
    (n.id === 'root'
      ? ''
      : `<div class="fx">${valeur}${suivante ? ' → <i>' + suivante + '</i>' : ''}</div><p>Niveau ${niv} / ${n.max}</p>`) +
    (n.id === 'root'
      ? ''
      : niv >= n.max
        ? '<button class="solid" disabled>Au maximum</button>'
        : verrou
          ? `<p style="color:var(--danger)">${verrou}</p>`
          : `<button class="solid" id="tBuy"${save.cash < prix ? ' disabled' : ''}>Acheter · ${fmt(prix)} $</button>`);
  const btnAcheter = $('tBuy');
  if (btnAcheter)
    btnAcheter.onclick = () => {
      if (save.cash < prix) return;
      save.cash -= prix;
      save.lv[n.id] = niv + 1;
      store();
      SND.play('buy');
      if (S) {
        S.P = derive(save.lv);
        // la vie max garde le bonus du héros (Roc +50, Volt −15) : avant la V4.0, un achat la ramenait à la valeur de base
        if (S.phase === 'prep') {
          S.p.hpMax = heroHp(S);
          S.p.hp = S.p.hpMax;
        } else {
          S.p.hpMax = heroHp(S);
          S.p.hp = Math.min(S.p.hp, S.p.hpMax);
        }
        buildTurrets(S);
      }
      treeDraw();
    };
}
// faire glisser la carte de l'arbre (au-delà de 8 px) ; un appui sans glisser choisit la case touchée
const tm = $('tree');
tm.addEventListener('pointerdown', e => {
  if (e.target.closest('#tInfo,#tTop,#tClose,#tLeg')) return;
  e.preventDefault();
  tDrag = { id: e.pointerId, x: px(e), y: py(e), x0: tPan.x, y0: tPan.y, moved: false, node: e.target.closest('.tn') };
  try {
    tm.setPointerCapture(e.pointerId);
  } catch (_) {}
});
tm.addEventListener('pointermove', e => {
  if (!tDrag || e.pointerId !== tDrag.id) return;
  const dx = px(e) - tDrag.x,
    dy = py(e) - tDrag.y;
  if (Math.hypot(dx, dy) > 8) tDrag.moved = true;
  if (tDrag.moved) {
    tPan.x = tDrag.x0 + dx;
    tPan.y = tDrag.y0 + dy;
    $('tMap').style.transform = `translate(${tPan.x}px,${tPan.y}px) scale(${tZ})`;
  }
});
tm.addEventListener('pointerup', e => {
  if (!tDrag || e.pointerId !== tDrag.id) return;
  if (!tDrag.moved && tDrag.node) {
    tSel = tDrag.node.dataset.id;
    SND.play('click');
    treeDraw();
  }
  tDrag = null;
});
// « Retour » : on revient d'où l'on vient (la partie reprend, l'écran de fin, ou le menu)
$('tClose').onclick = () => {
  $('tree').hidden = true;
  if (treeFrom === 'run') {
    running = true;
    subBuild();
  } else if (treeFrom === 'end') (($('endV').hidden = false), showEnd(S.phase === 'won'));
  else showStart();
};
