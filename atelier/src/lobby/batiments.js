// [lobby/batiments.js] Les panneaux des bâtiments : hall des héros, maison, marchand céleste, musée ; armesVoir (une arme exposée à l'Arsenal ouvre le panneau de la salle d'armes sur elle).
// ---- hall des héros : on y choisit qui l'on incarne. Ouvert devant un héros exposé dans la cathédrale, le panneau montre CE héros (hallVu) :
// son élément, sa voie, son arbre, et le bouton pour l'incarner ; ouvert par la porte, il montre le héros incarné
let hallVu = null;
function hallOpen(e) {
  hallVu = HEROS.includes(e) ? e : tHero;
  $('hallV').hidden = false;
  SND.play('tick');
  hallDraw();
}
// la carte d'un héros, la même au hall et aux deux portails (V11.4 ; rôles en V12.1) : portrait, nom, rôle et niveau, compétence et ultime, son élément choisi et éclats ; la toucher, c'est l'incarner
// le portrait suit le héros et son élément choisi : HPHOTO['<modèle>_<élément>'] (braise_feu, roc_eau, sylve_bois, volt_elec, ondine_vent, zephyr_terre…)
const hPicK = e =>
    ({ feu: 'braise', terre: 'roc', bois: 'sylve', elec: 'volt', eau: 'ondine', vent: 'zephyr' })[e] + '_' + elH(e),
  hPic = e => {
    const p = typeof HPHOTO === 'object' ? HPHOTO[hPicK(e)] : '';
    return p ? `<img class="hpic" src="${p}" alt="">` : '';
  };
function heroCards(id, redraw) {
  $(id).innerHTML = HEROS.map(
    e =>
      `<button class="pick${e === tHero ? ' cur' : ''}" style="--c:${hc(e)}" data-el="${e}">${hPic(e)}<b>${EL[e].hero}</b><em>${ROLE[e]} · niv. ${hLevel(e)}</em><small class="kit">${heroTag(e)}</small><small class="pts">${EL[elH(e)].n} · ${save.sh[e]} éclats${save.loot['etoile_' + e] ? ' · étoile' : ''}</small></button>`
  ).join('');
  $(id)
    .querySelectorAll('.pick')
    .forEach(
      b =>
        (b.onclick = () => {
          lobHero(b.dataset.el);
          if (redraw) redraw();
        })
    );
}
function hallDraw() {
  // panneau fermé : il montrera le héros incarné (le héros vu ne vaut que le temps d'une ouverture)
  if ($('hallV').hidden) hallVu = null;
  const e = HEROS.includes(hallVu) ? hallVu : tHero,
    me = e === tHero;
  heroCards('hallB', () => {
    hallVu = tHero;
    hallDraw();
  });
  if (!me) {
    const c = $('hallB').querySelector('.pick[data-el="' + e + '"]');
    if (c) c.classList.add('vu');
  }
  $('hallT').textContent = me
    ? 'Tu incarnes ' +
      EL[e].hero +
      ', ' +
      ROLE[e] +
      ' : ' +
      PASSIF[e] +
      '. Son kit est le même dans tous les jeux ; son élément se choisit ci-dessous (' +
      EL[elH(e)].n +
      "), et ses armes du même élément frappent 10 % plus fort. Touche un héros pour l'incarner."
    : 'Devant toi : ' +
      EL[e].hero +
      ', ' +
      ROLE[e] +
      ' : ' +
      PASSIF[e] +
      '. Son élément : ' +
      EL[elH(e)].n +
      ' (il se choisit ci-dessous). Tu incarnes ' +
      EL[tHero].hero +
      ' : touche « Incarner » ou sa carte pour jouer avec ' +
      EL[e].hero +
      '.';
  $('hallI').hidden = me;
  $('hallI').textContent = 'Incarner ' + EL[e].hero;
  $('hallA').textContent = 'Arbre de ' + EL[e].hero + ' · ' + save.sh[e] + ' éclats';
  helRow('hallEl', e, () => {
    SND.play('pure');
    lobSync();
    hallDraw();
  });
  // la voie du héros montré : deux choix à partir du niveau VOIE_NIV ; et l'ultime, qui prend l'élément de l'arme en main
  const v = voieOf(e),
    nb = hBase(e);
  $('hallVoie').innerHTML =
    `<h2>Voie de ${EL[e].hero}</h2>` +
    (nb < VOIE_NIV
      ? `<small>Au niveau ${VOIE_NIV} de son arbre (il est à ${nb}), ${EL[e].hero} choisit une voie : ${VOIES[e].a.n} ou ${VOIES[e].b.n}.</small>`
      : ['a', 'b']
          .map(
            k =>
              `<button class="tchip${k === v ? ' sel' : ''}" data-voie="${k}" style="--c:${hc(e)}"><b>${VOIES[e][k].n}</b><span>${VOIES[e][k].d}</span></button>`
          )
          .join('') +
        `<small>${v ? "Sa branche est ouverte dans son arbre. Tu peux changer de voie ici entre deux parties : rien n'est remboursé, rien n'est perdu." : 'Choisis une voie : elle ouvre sa branche dans son arbre.'}</small>`);
  $('hallVoie')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          if (setVoie(e, b.dataset.voie)) {
            SND.play('pure');
            toast(EL[e].hero + ' suit la voie ' + VOIES[e][b.dataset.voie].n);
          }
          lobSync();
          hallDraw();
        })
    );
  const A = armsOf('ile'),
    w = A.includes(tWeap) || !A.length ? tWeap : A[0];
  $('hallU').textContent =
    'Ultime teinté : ' +
    KIT[e].ult +
    " prend l'élément de ton arme en main (" +
    WT[w].short +
    ' · ' +
    EL[wEl(w, e)].n +
    '), en plus de son effet.';
}
// l'arbre est celui du héros incarné : ouvrir celui d'un autre héros, c'est l'incarner (comme les onglets de l'arbre)
$('hallA').onclick = () => {
  if (HEROS.includes(hallVu)) lobHero(hallVu);
  $('hallV').hidden = true;
  openTree('hero');
};
$('hallI').onclick = () => {
  if (HEROS.includes(hallVu)) lobHero(hallVu);
  hallDraw();
};
$('hallX').onclick = () => {
  $('hallV').hidden = true;
  hallVu = null;
};
// ---- la maison : réglages, et point de réveil
function homeOpen() {
  $('homeV').hidden = false;
  SND.play('tick');
  homeDraw();
}
function homeDraw() {
  $('homeB').innerHTML =
    `<div class="srow"><span><b>Son</b><small>Bruitages du jeu.</small></span><button class="ghost" data-a="snd">${save.snd === false ? 'Coupé' : 'Activé'}</button></div>
<div class="srow"><span><b>Mode dev</b><small>Raccourcis de test en partie ; ici, tout se pose gratuitement.</small></span><button class="ghost" data-a="dev">${save.dev ? 'Activé' : 'Désactivé'}</button></div>
<div class="srow"><span><b>Remettre l'île à plat</b><small>Efface le relief. Les bâtiments restent en place.</small></span><button class="ghost" data-a="flat">${LB.flatArm ? 'Confirmer' : 'Aplanir tout'}</button></div>`;
  $('homeB')
    .querySelectorAll('button[data-a]')
    .forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a;
          if (a === 'snd') sndToggle();
          else if (a === 'dev') devToggle();
          else if (!LB.flatArm) {
            LB.flatArm = true;
          } else {
            LB.flatArm = false;
            TH.fill(0);
            terrDraw();
            terrSave();
            vilGround();
            persist();
            toast('Île remise à plat');
          }
          homeDraw();
          lobSync();
        })
    );
}
$('homeX').onclick = () => {
  $('homeV').hidden = true;
  LB.flatArm = false;
};
// ---- marchand céleste : l'or rapporté des parties s'y dépense
const SHARD_C = 120,
  BOOST_C = 100,
  BOOST_G = 150,
  shopP = c => Math.round((c * shopK()) / 5) * 5;
function shopDraw() {
  const cur = tHero,
    row = (id, n, d, c, st) =>
      `<div class="srow"><span><b>${n}</b><small>${d}</small></span><button class="${st ? 'ghost' : 'solid'}" data-a="${id}"${st || save.gold < c ? ' disabled' : ''}>${st || c + ' or'}</button></div>`;
  $('shopB').innerHTML =
    row(
      'boost',
      'Bourse de départ',
      '+' + BOOST_G + ' or au début de ta prochaine partie.',
      shopP(BOOST_C),
      save.boost ? 'Prête' : ''
    ) +
    row(
      'shard',
      'Éclats pour ' + EL[cur].hero,
      '+100 éclats pour son arbre (il en a ' + save.sh[cur] + ').',
      shopP(SHARD_C),
      ''
    );
  setTxt('shopG', '', String(save.gold));
  $('shopB')
    .querySelectorAll('button')
    .forEach(b => (b.onclick = () => shopBuy(b.dataset.a)));
}
function shopBuy(a) {
  const pay = c => {
    if (save.gold < c) return false;
    save.gold -= c;
    return true;
  };
  if (a === 'boost') {
    if (save.boost || !pay(shopP(BOOST_C))) return;
    save.boost = 1;
    toast('Bourse de départ prête');
  } else if (a === 'shard') {
    if (!pay(shopP(SHARD_C))) return;
    save.sh[tHero] += 100;
    toast('+100 éclats pour ' + EL[tHero].hero);
  } else return;
  SND.play('coin');
  persist();
  lobSync();
  shopDraw();
}
function shopOpen() {
  $('shopV').hidden = false;
  shopDraw();
  SND.play('tick');
}
$('shopX').onclick = () => {
  $('shopV').hidden = true;
};
// ---- musée : le butin rapporté des parties
function lootOpen() {
  $('lootV').hidden = false;
  SND.play('tick');
  $('lootB').innerHTML = LOOT.map(L => {
    const n = save.loot[L[0]] || 0;
    return `<div class="lcell${n ? ' has' : ''}"><b>${L[1]}</b><small>${L[2]}</small><em>${n ? '× ' + n : 'pas encore trouvé'}</em></div>`;
  }).join('');
  $('lootS').innerHTML = HEROS.map(
    e =>
      `<span class="tchip${save.loot['etoile_' + e] ? ' sel' : ''}" style="${save.loot['etoile_' + e] ? 'border-color:' + hc(e) + ';color:' + hc(e) : ''}">Étoile de ${EL[e].hero}</span>`
  ).join('');
}
$('lootX').onclick = () => {
  $('lootV').hidden = true;
};
// ---- l'Arsenal (la salle d'armes) : devant une arme exposée, Action ouvre le panneau de la salle d'armes sur CETTE arme. Comme au panneau,
// l'arme qu'on regarde devient l'arme en main (prochaine partie, outil Arme) : sa vitrine prend la lumière la plus forte
function armesVoir(w) {
  if (!WT[w]) return;
  setWeap(w);
  openTree('arme');
  SND.play('tick');
}
