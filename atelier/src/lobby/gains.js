// [lobby/gains.js] Le barème commun aux deux portails (GAINS, payOut), les noms du butin.

const LOOTN = {};
for (const L of LOOT) LOOTN[L[0]] = L[1];
for (const e of HEROS) LOOTN['etoile_' + e] = 'Étoile de ' + EL[e].hero;
// ---- LE BARÈME COMMUN (V10.2) : les deux portails paient avec la même règle, en « unités de jeu ». Une unité = 45 s de jeu environ (sur l'île : un niveau de vague, 35 à la vague 20) : 10 or céleste et 20 éclats.
// Une journée de Dernier Toit vaut sa durée (dayU : 1,6 unité au jour 1, 3,3 au jour 10 ; 24 pour les dix jours). Un boss : +40 or, +50 éclats (sur le toit, par choix : un seul aux jours 5, 8 et 10, là où Dernier Toit ajoute un mastodonte ; il en sort dix en dix jours). Une victoire : +200 or, +150 éclats.
// Le tout × le rang (PAYK : niveau de campagne sur l'île, rang sur le toit ; Difficile = ×1,5), puis × la maison (or) et × le hall (éclats). Pour un nouveau mini-jeu : compter ses unités et appeler payOut.
const GAINS = { or: 10, ecl: 20, orBoss: 40, eclBoss: 50, orWin: 200, eclWin: 150 },
  r5 = v => Math.round(v / 5) * 5,
  dayU = d => (63 + 9 * Math.min(d, 12)) / 46,
  dayBoss = d => (d === 5 || d === 8 || d >= 10 ? 1 : 0);
function payOut(el, u, boss, win, k) {
  k = k || 1;
  const gold = r5((u * GAINS.or + boss * GAINS.orBoss + (win ? GAINS.orWin : 0)) * k * kHome()),
    sh = r5((u * GAINS.ecl + boss * GAINS.eclBoss + (win ? GAINS.eclWin : 0)) * k * kHall());
  save.gold += gold;
  save.sh[el] += sh;
  return { gold, sh };
}

// les étiquettes sont redessinées quand la police du jeu est arrivée
if (document.fonts && document.fonts.ready)
  document.fonts.ready
    .then(() => {
      for (const sp of LLABS) {
        sp.userData.sig = '';
        lobText(sp, ...sp.userData.args);
      }
    })
    .catch(() => {});
// les étiquettes sont redessinées quand la police du jeu est arrivée
if (document.fonts && document.fonts.ready)
  document.fonts.ready
    .then(() => {
      for (const sp of LLABS) {
        sp.userData.sig = '';
        lobText(sp, ...sp.userData.args);
      }
    })
    .catch(() => {});
