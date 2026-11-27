// [interface/base.js] La base de la page : $, le lien avec le lobby (LOBBY, versLobby), les réglages, couleurs, icônes, et l'arbre du marchand de la partie (TREES.run).
const $ = id => document.getElementById(id);
window.addEventListener('error', e => {
  let d = $('errL');
  if (!d) {
    d = document.createElement('div');
    d.id = 'errL';
    d.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#7a1010;color:#fff;font:12px sans-serif;padding:4px 8px';
    document.body.appendChild(d);
  }
  d.textContent = 'Erreur : ' + e.message + ' (ligne ' + e.lineno + ')';
});
if (!window.THREE) {
  document.body.insertAdjacentHTML(
    'beforeend',
    '<div style="position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#10202a;color:#fff;font:16px sans-serif;padding:24px;text-align:center">Le moteur 3D n\'a pas pu se charger. Reviens au lobby et réessaie avec une connexion active.</div>'
  );
  return;
}
// ---------- le lien avec le lobby ----------
// L'Île des Cinq tourne dans un cadre ouvert par le lobby (ile-pour-lobby.js, contrat dans LOBBY.md). Le lobby pose window.ILE_LOBBY avant tout script :
// le héros, l'arme, le mode, le niveau de campagne, les bonus de la progression (déjà calculés : la partie ne connaît ni les arbres ni la sauvegarde du lobby),
// les réglages, et de quoi jouer à plusieurs. La partie répond par des messages : versLobby({ ile: 'pret' | 'fin' | 'retour' | 'etat' | 'reglages' | 'arme' }).
const LOBBY = window.ILE_LOBBY && typeof window.ILE_LOBBY === 'object' ? window.ILE_LOBBY : {};
const versLobby = m => {
  try {
    parent.postMessage(m, '*');
  } catch (_) {}
};
// Les réglages (son, mode de tir, saut auto, options du mode dev) viennent du lobby à l'ouverture ; changés en partie, ils lui sont renvoyés (persist) : c'est lui qui les garde.
const save = (() => {
  const r = LOBBY.reglages && typeof LOBBY.reglages === 'object' ? LOBBY.reglages : {};
  return {
    snd: r.snd === false ? false : undefined,
    fire: typeof r.fire === 'string' ? r.fire : undefined,
    aj: r.aj === true,
    devOpt: r.devOpt && typeof r.devOpt === 'object' ? r.devOpt : {},
    dev: LOBBY.dev === true,
    last: ELS.includes(LOBBY.heros) ? LOBBY.heros : 'feu'
  };
})();
// L'encoche du téléphone : dans un cadre, la page ne reçoit pas toujours les bords à éviter. Le lobby les mesure et les donne (à l'ouverture, puis quand on tourne le téléphone).
function encoche(e) {
  if (!e || typeof e !== 'object') return;
  for (const k of ['haut', 'bas', 'gauche', 'droite']) {
    const v = +e[k];
    if (Number.isFinite(v) && v >= 0 && v <= 200)
      document.documentElement.style.setProperty('--enc-' + k, Math.round(v) + 'px');
  }
}
encoche(LOBBY.encoche);
addEventListener('message', e => {
  if (e.source === parent && e.data && typeof e.data === 'object' && e.data.ile === 'encoche') encoche(e.data);
});
const persist = () =>
  versLobby({
    ile: 'reglages',
    snd: save.snd,
    fire: save.fire,
    aj: save.aj,
    devOpt: save.devOpt,
    tuto: save.tuto === 1
  });
const elc = e => EL[e].c;

// ---------- l'arbre du marchand de la partie : remis à zéro à chaque partie, payé en points ----------
const f = (v, d) => v.toFixed(d).replace('.', ',');
const IC = {
  core: '<path d="M12 3l7 9-7 9-7-9z"/>',
  rad: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>',
  dmg: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  cd: '<path d="M7 5v14M12 5v14M17 5v14"/>',
  range: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  multi: '<path d="M4 9h13l-3-3M4 16h13l-3 3"/>',
  rico: '<path d="M3 6l7 8 4-5 7 9"/>',
  dbl: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
  wave: '<path d="M5 13a7 7 0 0 1 14 0M2 13a10 10 0 0 1 20 0"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/>',
  spd: '<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>',
  jump: '<path d="M12 20V6M6 11l6-6 6 6"/>',
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.4-7 10-7 10z"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  stack: '<path d="M5 7h14M5 12h14M5 17h14"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  pierce: '<path d="M3 12h18M16 7l5 5-5 5M9 6v12"/>'
};
const ico = k => `<svg viewBox="0 0 24 24">${IC[k]}</svg>`;
const N = (id, b, s, o, p, k, n, max, cost, key, inc, v, cap) => ({
  id,
  b,
  s,
  o,
  p,
  k,
  n,
  max,
  cost,
  key,
  inc,
  v,
  cap
});
const TREES = {
  run: {
    title: 'Boutique du marchand',
    unit: 'points',
    close: 'Reprendre la partie',
    grow: false,
    br: {
      m: { a: -162, c: '#f0a04b', n: 'Mortier' },
      c: { a: -90, c: '#9db7c9', n: 'Canon' },
      a: { a: -18, c: '#7ddc8a', n: 'Archer' },
      e: { a: 54, c: '#b99cff', n: 'Éléments' },
      k: { a: 126, c: '#ff8fa3', n: 'Cœur' }
    },
    nodes: [
      N(
        'm1',
        'm',
        1,
        0,
        null,
        'rad',
        "Zone d'impact du mortier",
        3,
        1,
        'mRad',
        0.12,
        L => f(3.6 * (1 + 0.12 * L), 2) + ' m'
      ),
      N(
        'm2',
        'm',
        2,
        0,
        'm1',
        'dmg',
        'Dégâts du mortier',
        3,
        1,
        'mDmg',
        0.15,
        L => f(10 * (1 + 0.15 * L), 1) + ' par élément'
      ),
      N('m3', 'm', 3, 0, 'm2', 'multi', 'Multi-mortier', 2, 3, 'mMulti', 1, L => 1 + L + ' obus par tir', 1),
      N('m4', 'm', 2, 1, 'm1', 'range', 'Portée du mortier', 2, 1, 'mRange', 1.5, L => f(17 + 1.5 * L, 1) + ' m'),
      N(
        'c1',
        'c',
        1,
        0,
        null,
        'dmg',
        'Dégâts du canon',
        3,
        1,
        'cDmg',
        0.15,
        L => f(34 * (1 + 0.15 * L), 1) + ' par élément'
      ),
      N('c2', 'c', 2, 0, 'c1', 'rico', 'Ricochet du canon', 2, 2, 'cRico', 1, L =>
        L ? L + (L > 1 ? ' rebonds' : ' rebond') + ' à 60 %' : 'aucun rebond'
      ),
      N(
        'c3',
        'c',
        3,
        0,
        'c2',
        'dbl',
        'Double canon',
        1,
        3,
        'cDouble',
        1,
        L => (L ? '2 boulets par tir' : '1 boulet par tir'),
        1
      ),
      N(
        'c4',
        'c',
        2,
        1,
        'c1',
        'cd',
        'Cadence du canon',
        3,
        1,
        'cCd',
        0.08,
        L => f(1.8 * (1 - 0.08 * L), 2) + ' s entre deux tirs'
      ),
      N(
        'a1',
        'a',
        1,
        0,
        null,
        'cd',
        'Cadence des archers',
        3,
        1,
        'aCd',
        0.08,
        L => f(0.45 * (1 - 0.08 * L), 2) + ' s entre deux tirs'
      ),
      N(
        'a2',
        'a',
        2,
        0,
        'a1',
        'dmg',
        'Dégâts des archers',
        3,
        1,
        'aDmg',
        0.15,
        L => f(3.4 * (1 + 0.15 * L), 1) + ' par élément'
      ),
      N(
        'a3',
        'a',
        3,
        0,
        'a2',
        'multi',
        'Double flèche',
        1,
        3,
        'aMulti',
        1,
        L => (L ? '2 flèches sur 2 cibles' : '1 flèche'),
        1
      ),
      N('a4', 'a', 2, 1, 'a1', 'range', 'Portée des archers', 2, 1, 'aRange', 2, L => 21 + 2 * L + ' m'),
      N('e1', 'e', 1, 0, null, 'bolt', 'Dégâts super efficaces', 2, 2, 'strong', 0.15, L => '×' + f(2 + 0.15 * L, 2)),
      N(
        'e2',
        'e',
        2,
        0,
        'e1',
        'stack',
        'Bonus de spécialisation',
        2,
        2,
        'spec',
        0.05,
        L => '+' + Math.round((BAL.dup + 0.05 * L) * 100) + " % par niveau d'élément"
      ),
      N('e3', 'e', 2, 1, 'e1', 'clock', 'Durée des effets', 2, 1, 'fxDur', 0.25, L => '+' + 25 * L + ' %'),
      N('k1', 'k', 1, 0, null, 'heart', 'Solidité du cœur', 3, 1, 'coreHp', 4, L => '+' + 4 * L + ' PV'),
      N('k2', 'k', 2, 0, 'k1', 'coin', 'Or par ennemi', 2, 2, 'goldKill', 1, L => 7 + L + ' or'),
      N('k3', 'k', 2, 1, 'k1', 'coin', 'Prime de fin de vague', 2, 1, 'waveBonus', 15, L => '+' + 15 * L + ' or')
    ]
  }
};
