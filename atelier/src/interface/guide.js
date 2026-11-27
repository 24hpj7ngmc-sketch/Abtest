// [interface/guide.js] Le panneau commun du Guide (#guideV) : un titre, des onglets, des lignes, un bouton facultatif (guideShow). Les sujets du Guide du lobby sont dans lobby/guide.js.
// ---------- LE GUIDE, PARTOUT (V10.3) : un seul panneau (#guideV) sert au Guide du lobby (ses sujets, lobby/guide.js) et au même personnage en « Règles » dans chaque mini-jeu.
// Une fiche de règles est toujours rangée pareil, cinq onglets dans cet ordre : Le but · Perdre · Commandes · Ce jeu · Ce que ça rapporte.
// guideShow(titre, onglets, i, bouton) : onglets = [[nom, [[titre de ligne, texte], …]], …] ; bouton = [texte, fonction] facultatif, à gauche de « Retour ».
let guTab = 0;
function guideShow(title, tabs, i, act) {
  guTab = Math.max(0, Math.min(tabs.length - 1, i || 0));
  $('guT').textContent = title;
  $('guTabs').innerHTML = tabs
    .map((T, k) => `<button class="tchip${k === guTab ? ' sel' : ''}" data-k="${k}">${T[0]}</button>`)
    .join('');
  $('guTabs')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          SND.play('tick');
          guideShow(title, tabs, +b.dataset.k, act);
        })
    );
  $('guB').innerHTML = tabs[guTab][1]
    .map(R => `<div class="srow"><span><b>${R[0]}</b><small>${R[1]}</small></span></div>`)
    .join('');
  const ba = $('guA');
  ba.hidden = !act;
  if (act) {
    ba.textContent = act[0];
    ba.onclick = act[1];
  }
  $('guideV').hidden = false;
}
$('guX').onclick = () => {
  $('guideV').hidden = true;
};
