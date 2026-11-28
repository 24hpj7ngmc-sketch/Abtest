// [interface/progression.js] La base de la page : $, setTxt, toast, couleurs, icônes ; la grille d'amélioration et l'arbre de chaque héros ; la sauvegarde (save, persist).
const $ = id => document.getElementById(id);
// un texte de l'écran n'est réécrit que s'il a changé
const cache = {};
function setTxt(id, sel, v) {
  const k = id + sel;
  if (cache[k] === v) return;
  cache[k] = v;
  (sel ? $(id).querySelector(sel) : $(id)).textContent = v;
}
// le message qui passe en bas de l'écran ; toastT : les secondes qu'il lui reste (décomptées par la boucle du lobby)
let toastT = 0;
function toast(t) {
  $('toast').textContent = t;
  $('toast').classList.add('on');
  toastT = 2.2;
}
const r1 = v => Math.round(v * 10) / 10;
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
  $('start').querySelector('.card').innerHTML =
    "<h1>L'Île des Cinq</h1><p>Le moteur 3D n'a pas pu se charger. Recharge la page avec une connexion active.</p>";
  return;
}
const elc = e => EL[e].c,
  dot = e => `<b style="color:${elc(e)}">${EL[e].n}</b>`;
// la boucle des faiblesses telle que le jeu la publie (BEATS) : à six depuis L'Île des Cinq V2.1 ; dessinée plus bas, quand EL.vent existe (roles.js)
function cycleDraw() {
  const L = ['eau'];
  for (let i = 0; i < 7 && BEATS[L[L.length - 1]]; i++) {
    L.push(BEATS[L[L.length - 1]]);
    if (L[L.length - 1] === 'eau') break;
  }
  $('sCycle').innerHTML = L.filter(e => EL[e])
    .map(dot)
    .join('<span>bat</span>');
}
cycleDraw();

// ---------- grilles d'amélioration ----------
// hero : gardée d'une partie à l'autre, payée en éclats. (La grille « run » du marchand de partie a suivi L'Île des Cinq dans son atelier.)
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
  hero: {
    title: 'Grille des héros',
    unit: 'éclats',
    close: 'Retour',
    grow: true,
    br: { t: { a: -90, c: '#ffcf5a', n: 'Tir' }, v: { a: 150, c: '#7ddc8a', n: 'Mobilité' } },
    nodes: [
      N(
        't1',
        't',
        1,
        0,
        null,
        'dmg',
        'Dégâts du tir',
        3,
        60,
        'hDmg',
        0.15,
        L =>
          f(BAL.gun * (1 + 0.15 * L), 1) + ' dégâts · marque la cible : défenses +' + Math.round(BAL.markK * 100) + ' %'
      ),
      N(
        't2',
        't',
        2,
        0,
        't1',
        'cd',
        'Cadence de tir',
        3,
        80,
        'hCd',
        0.08,
        L => f(0.26 * (1 - 0.08 * L), 2) + ' s entre deux tirs'
      ),
      N(
        't3',
        't',
        3,
        0,
        't2',
        'pierce',
        'Tir perforant',
        1,
        300,
        'hPierce',
        1,
        L => (L ? 'traverse 1 ennemi' : 'ne traverse pas'),
        1
      ),
      N('t4', 't', 2, 1, 't1', 'range', 'Portée du tir', 2, 70, 'hLife', 0.15, L => f(51 * (1 + 0.15 * L), 0) + ' m'),
      N('v1', 'v', 1, 0, null, 'spd', 'Vitesse de marche', 3, 50, 'hSpd', 0.06, L => f(9 * (1 + 0.06 * L), 1) + ' m/s'),
      N(
        'v2',
        'v',
        2,
        0,
        'v1',
        'spd',
        'Vitesse de sprint',
        2,
        70,
        'hSprint',
        0.08,
        L => f(14.5 * (1 + 0.08 * L), 1) + ' m/s'
      ),
      N(
        'v3',
        'v',
        2,
        1,
        'v1',
        'jump',
        'Hauteur de saut',
        2,
        50,
        'hJump',
        0.15,
        L => f(1.92 * (1 + 0.15 * L), 2) + ' m'
      ),
      N('v4', 'v', 3, 0, 'v2', 'heart', 'Points de vie', 3, 70, 'hHp', 20, L => BAL.heroHp + 20 * L + ' PV')
    ]
  }
};
let save = { shards: 300, lv: {}, hl: null };
try {
  const r = JSON.parse(localStorage.getItem('ile5-save'));
  if (r && typeof r.shards === 'number')
    save = {
      shards: r.shards,
      lv: r.lv || {},
      dev: !!r.dev,
      devOpt: r.devOpt || {},
      fire: r.fire,
      mode: r.mode,
      snd: r.snd,
      hl: r.hl,
      last: r.last,
      sh: r.sh,
      tuto: r.tuto,
      gold: r.gold,
      loot: r.loot,
      boost: r.boost,
      vil: r.vil,
      terr: r.terr,
      wl: r.wl,
      wmig: r.wmig,
      demo: r.demo,
      rec: r.rec,
      q: r.q,
      qd: r.qd,
      evo: r.evo,
      big: r.big,
      aj: !!r.aj,
      hv: r.hv,
      prep: r.prep,
      vg: r.vg,
      weap: r.weap,
      we: r.we,
      stage: r.stage,
      camp: r.camp,
      toit: r.toit,
      guide: r.guide,
      wel: r.wel,
      hel: r.hel,
      voie: r.voie
    };
} catch (_) {}
// chaque héros a sa propre progression ; une ancienne sauvegarde commune est recopiée sur les cinq pour les cases Tir et Corps
if (!save.hl || typeof save.hl !== 'object') {
  save.hl = {};
  for (const e of HEROS) {
    save.hl[e] = {};
    for (const k in save.lv || {}) if (/^[tv]\d$/.test(k)) save.hl[e][k] = save.lv[k];
  }
}
for (const e of HEROS) if (!save.hl[e]) save.hl[e] = {};
// chaque héros a sa propre réserve d'éclats ; l'ancienne réserve commune est donnée une fois à chacun
if (!save.sh || typeof save.sh !== 'object') save.sh = {};
for (const e of HEROS) if (!Number.isFinite(save.sh[e])) save.sh[e] = save.shards;
const persist = () => {
  try {
    const V = window.__visit;
    localStorage.setItem(
      'ile5-save',
      JSON.stringify(V && V.on && V.mine ? Object.assign({}, save, { vil: V.mine.vil, evo: V.mine.evo }) : save)
    );
  } catch (_) {}
};
// ---------- un arbre par héros : Tir et Corps sont les mêmes cases pour tous, Compétence, Ultime et Passif sont propres à chacun ----------
// chaque ligne : [nom, niveaux, prix, bonus, valeur par niveau, affichage, case finale ?]
const HSPEC = {
  terre: {
    k: [
      ['Recharge du Rempart', 3, 60, 'abCd', 1.5, L => f(BAL.rempartCd - 1.5 * L, 1) + ' s'],
      ['Durée du Rempart', 2, 80, 'kDur', 3, L => BAL.rempartT + 3 * L + ' s'],
      ['Rempart élargi', 1, 250, 'kWide', 1, L => (L ? 7 : 5) + ' blocs de large', 1]
    ],
    u: [
      ["Rayon de l'Onde de choc", 2, 90, 'uRad', 2, L => BAL.quakeR + 2 * L + ' m'],
      ["Étourdissement de l'Onde de choc", 2, 90, 'uDur', 0.5, L => f(BAL.quakeT + 0.5 * L, 1) + ' s'],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [
      [
        'Peau de pierre',
        3,
        80,
        'pA',
        0.05,
        L => 'coups au contact −' + Math.round((1 - BAL.rocArmor + 0.05 * L) * 100) + ' %'
      ]
    ]
  },
  elec: {
    k: [
      ['Recharge de la Fulgurance', 3, 60, 'abCd', 1, L => BAL.dashCd - L + ' s'],
      ['Longueur de la Fulgurance', 2, 80, 'kLen', 3, L => BAL.dashLen + 3 * L + ' m'],
      ['Sillage électrique', 1, 250, 'kTrail', 1, L => (L ? "laisse un champ d'orage 3 s" : 'aucun sillage'), 1]
    ],
    u: [
      ['Durée du Déchaînement', 2, 90, 'uDur', 2, L => BAL.stormT + 2 * L + ' s'],
      ['Rayon du Déchaînement', 2, 90, 'uRad', 3, L => BAL.stormR + 3 * L + ' m'],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [['Tirs en chaîne', 2, 120, 'pA', 1, L => 'saute sur ' + (1 + L) + ' voisin' + (L ? 's' : '')]]
  },
  bois: {
    k: [
      ['Recharge des Entraves', 3, 60, 'abCd', 1.5, L => f(BAL.ronceCd - 1.5 * L, 1) + ' s'],
      ['Rayon des Entraves', 2, 80, 'abRad', 1.5, L => f(BAL.ronceR + 1.5 * L, 1) + ' m'],
      ['Durée des Entraves', 2, 90, 'kDur', 2, L => BAL.ronceT + 2 * L + ' s']
    ],
    u: [
      ['Durée des Gardiens', 2, 90, 'uDur', 5, L => BAL.guardT + 5 * L + ' s'],
      ['Quatrième Gardien', 1, 250, 'uExtra', 1, L => 3 + L + ' Gardiens', 1],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [['Poison tenace', 2, 100, 'pA', 1.5, L => f(2.5 + 1.5 * L, 1) + ' s de poison par tir']]
  },
  feu: {
    k: [
      ["Recharge de l'Orbe", 3, 60, 'abCd', 1, L => BAL.fbCd - L + ' s'],
      ["Rayon de l'Orbe", 2, 80, 'abRad', 1.5, L => f(BAL.fbR + 1.5 * L, 1) + ' m'],
      ["Puissance de l'Orbe", 3, 90, 'abDmg', 0.25, L => '+' + 25 * L + ' %']
    ],
    u: [
      ['Météores en plus', 2, 110, 'uExtra', 2, L => BAL.metN + 2 * L + ' météores'],
      ['Rayon des Météores', 2, 90, 'uRad', 1, L => BAL.metR + L + ' m'],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [
      [
        'Éclaboussures',
        2,
        100,
        'pA',
        0.15,
        L => Math.round((BAL.braiseSplash + 0.15 * L) * 100) + ' % des dégâts autour de la cible'
      ]
    ]
  },
  eau: {
    k: [
      ['Recharge de la Répulsion', 3, 60, 'abCd', 1.5, L => f(BAL.tideCd - 1.5 * L, 1) + ' s'],
      ['Soin de la Répulsion', 3, 80, 'kHeal', 10, L => BAL.tideHeal + 10 * L + ' PV'],
      ['Recul de la Répulsion', 2, 80, 'kLen', 2, L => BAL.tideKnock + 2 * L + ' m']
    ],
    u: [
      ['Durée du Sanctuaire', 2, 90, 'uDur', 2, L => BAL.floodT + 2 * L + ' s'],
      ['Cœur soigné', 2, 120, 'uExtra', 1, L => '+' + (BAL.floodCore + L) + ' au cœur'],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [['Source vive', 2, 100, 'pA', 3, L => BAL.ondRegen + 3 * L + ' PV par seconde']]
  },
  // Zéphyr, le Tireur (V12.1) : chiffres du lobby en premier jet, aucun jeu collé ne le joue encore
  vent: {
    k: [
      ['Recharge du Bond', 3, 60, 'abCd', 1, L => 14 - L + ' s'],
      ['Longueur du bond', 2, 80, 'kLen', 2, L => 8 + 2 * L + ' m'],
      [
        'Bond qui repousse',
        1,
        250,
        'kPush',
        1,
        L => (L ? 'repousse les ennemis proches au départ' : 'ne repousse pas'),
        1
      ]
    ],
    u: [
      ['Puissance du Tir perçant', 3, 90, 'uDmg', 0.25, L => '+' + 25 * L + ' %'],
      ['Largeur du Tir perçant', 2, 90, 'uRad', 0.5, L => f(1.5 + 0.5 * L, 1) + ' m'],
      ["Charge de l'ultime", 2, 100, 'uCharge', 0.15, L => '+' + 15 * L + ' %']
    ],
    p: [['Œil de lynx', 3, 80, 'pA', 0.05, L => '+' + (20 + 5 * L) + ' % de dégâts au-delà de 30 m']]
  }
};
