// ===================== LES HÉROS (mode « Ils s'échappent ») : Braise, Ondine, Sylve, Roc, Volt, Zéphyr (V4.8) =====================
// Les héros de L'Île des Cinq, adaptés à la ville (« Ils arrivent » garde Missile et Onde de choc).
// Chaque héros : un passif (sur ses balles ou sur lui), une compétence (double appui, recharge) et un ultime (double appui, se charge en tuant).
// Les cases Ogive / Rechargement (missile) renforcent la compétence du héros ; Charge rapide / Souffle (onde) renforcent son ultime.
// Les passifs qui ne sont pas sur les balles sont écrits ailleurs : Ondine (soin rapide : finishP), Roc (+50 vie : heroHp ; coups ×0,75 : hurtP),
// Volt (sprint 8,6 m/s : playerStep ; −15 vie : heroHp).
// Ce qui dure (S.fballs, S.thorns, S.ramparts, S.meteors, S.flood, S.guards, S.storms) avance dans heroStep, à chaque pas.
// Fournit aux autres dossiers : HEROS, HKEYS, ELKEYS, ELNOM, ELDE, ELFX, heroRole, heroHp, outside (affichage, interface : menu, boutons) ;
// useHeroSkill, useHeroUlt (interface) ; lignePercant, rafale (multi.js).

// un héros (clé = élément, gardée dans save.hero) : n nom, el élément, c couleur, role ; sk, ul : noms de la compétence et de l'ultime ;
// cd : recharge de la compétence (s, réduite par la case Rechargement) ; pas, skd, uld : descriptions du passif, de la compétence, de l'ultime (menu)
const HEROS = {
  feu: {
    n: 'Braise',
    el: 'Feu',
    c: '#ff6a3d',
    role: 'Mage',
    sk: 'Orbe',
    ul: 'Météores',
    cd: 11,
    pas: 'Tes balles enflamment et éclaboussent autour de la cible',
    skd: 'Une boule de feu là où tu vises : explosion, puis flammes au sol',
    uld: "Huit météores tombent un par un sur les zombies les plus près de s'échapper"
  },
  eau: {
    n: 'Ondine',
    el: 'Eau',
    c: '#3fa9ff',
    role: 'Support',
    sk: 'Répulsion',
    ul: 'Sanctuaire',
    cd: 13,
    pas: 'Tu te soignes vite et tes balles ralentissent',
    skd: "Une vague déferle là où tu vises : elle repousse vers l'immeuble, ralentit et blesse",
    uld: '8 s : tous les zombies dehors ralentis et rongés ; la ville et toi, soignés'
  },
  bois: {
    n: 'Sylve',
    el: 'Nature',
    c: '#5fd068',
    role: 'Combattant',
    sk: 'Entraves',
    ul: 'Gardiens',
    cd: 12,
    pas: 'Tes balles empoisonnent',
    skd: 'Un grand roncier là où tu vises : il blesse, ralentit et entrave par à-coups',
    uld: 'Trois arbres gardiens poussent aux sorties les plus chargées et tirent des flèches empoisonnées (15 s)'
  },
  terre: {
    n: 'Roc',
    el: 'Terre',
    c: '#cf9a5c',
    role: 'Tank',
    sk: 'Rempart',
    ul: 'Onde de choc',
    cd: 15,
    pas: 'Plus de vie (+50), coups encaissés amortis',
    skd: 'Un mur de pierre en travers de la rue que tu vises : la horde bute dessus',
    uld: "Le sol tremble autour de l'immeuble : zombies blessés et étourdis (les gros seulement ralentis)"
  },
  elec: {
    n: 'Volt',
    el: 'Élec',
    c: '#ffd93b',
    role: 'Assassin',
    sk: 'Fulgurance',
    ul: 'Déchaînement',
    cd: 9,
    pas: 'Sprint plus rapide, balles qui sautent sur un voisin, moins de vie (−15)',
    skd: 'Tu files tout droit sur 14 m en électrocutant ce que tu traverses, intouchable un instant',
    uld: "Un nuage d'orage là où tu vises foudroie trois zombies toutes les 0,4 s (6 s)"
  },
  // V4.8 (refonte du lobby V12.2, claude/refonte-roles-contrat.md) : Zéphyr, le Tireur, élément Vent
  vent: {
    n: 'Zéphyr',
    el: 'Vent',
    c: '#8fe6dc',
    role: 'Tireur',
    sk: 'Bond',
    ul: 'Tir perçant',
    cd: 14,
    pas: 'Plus de dégâts plus la cible est loin (+20 % au-delà de 30 m)',
    skd: 'Un bond en arrière de 8 m, porté par une rafale',
    uld: 'Un tir géant qui traverse tout sur sa ligne, murs compris'
  }
};
// l'ordre des héros au menu (V4.8 : Zéphyr en sixième)
const HKEYS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
// V4.8 : les six éléments (une arme en porte un ; un héros a le sien, sa prédilection) et leurs noms ; « bois » s'affiche « Nature »
const ELKEYS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'],
  ELNOM = { feu: 'Feu', eau: 'Eau', bois: 'Nature', terre: 'Terre', elec: 'Élec', vent: 'Vent' },
  // « balles de Feu », « balles d'Eau »… et ce que font les balles de chaque élément (menu, Guide, écran de fin)
  ELDE = { feu: 'de Feu', eau: "d'Eau", bois: 'de Nature', terre: 'de Terre', elec: "d'Élec", vent: 'de Vent' },
  ELFX = {
    feu: 'brûlent et éclaboussent autour',
    eau: 'ralentissent',
    bois: 'empoisonnent',
    terre: 'repoussent (pas les gros)',
    elec: 'sautent sur un voisin',
    vent: 'traversent un zombie de plus et soulèvent les petits'
  };
// V4.8 : un héros présenté par son rôle (« Braise, Mage »)
// V5.2 : l'élément choisi du héros (S.elHeros, venu du lobby : opts.elHeros) ; absent ou inconnu : la clé du héros. La clé reste son identité
// (kit, voies, rôle, nom) ; l'élément choisi est celui de ses couleurs, de sa prédilection et de l'effet qu'il ajoute aux balles
const elH = S => (S && ELKEYS.includes(S.elHeros) ? S.elHeros : S && S.hero);
const heroRole = h => (HEROS[h] ? HEROS[h].n + ', ' + HEROS[h].role : '');
// la vie du joueur avec son héros
// (V4.9 : Colosse, la voie a de Sylve : +25, + spA1)
const heroHp = S => S.P.hp + (S.hero === 'terre' ? 50 : S.hero === 'elec' ? -15 : 0) + (voieDe(S, 'bois', 'a') ? 25 + S.hm.spA1 : 0);
// puissance de la compétence (Ogive : 1 au niveau 0) et de l'ultime (Souffle)
const hPow = S => S.P.mis.dmg / 160,
  uPow = S => S.P.onde.pw;
// le zombie i est-il dehors, au sol ou sur un mur d'avenue (Z.st 1 ou 5) ?
const outside = (Z, i) => {
  const st = Z.st[i];
  return st === 1 || st === 5;
};
// Ce que fait une balle qui touche le zombie i (dmg : dégâts de la balle, x,y,z : point d'impact). V4.8 (refonte du lobby) : « les balles
// prennent l'élément de l'arme, plus celui du héros ». L'élément de l'arme (S.elArme) joue avec la branche « Élément des balles » du lobby
// (S.hm.eFireR…) ; le passif du héros joue à ses chiffres de base (+ pA, l'arbre du héros) ; s'ils sont du même élément, l'effet ne joue
// qu'une fois (avec la branche et pA). Roc (Terre) et Zéphyr (Vent) n'ont pas de passif sur les balles (vie et coups amortis ; dégâts de
// loin, armes.js).
const HM_ZERO = {};
function heroOnHit(S, i, dmg, x, y, z) {
  const Z = S.z,
    // V5.2 : l'effet propre du héros est celui de son élément choisi
    hk = elH(S);
  if (!hk || Z.st[i] === 0) return;
  const ea = S.elArme || hk,
    m = S.hm;
  effetBalle(S, ea, i, dmg, x, y, z, m, ea === hk ? m.pA : 0);
  if (ea !== hk && hk !== 'terre' && hk !== 'vent') effetBalle(S, hk, i, dmg, x, y, z, HM_ZERO, m.pA);
  // V4.9 : Colosse, Sève (spA2) : un coup sur un zombie à moins de 5 m rend 2 de vie
  if (m.spA2 > 0 && voieDe(S, 'bois', 'a') && (Z.x[i] - S.p.x) ** 2 + (Z.z[i] - S.p.z) ** 2 < 25 && Math.abs(Z.y[i] - S.p.y) < 2.5)
    S.p.hp = Math.min(S.p.hpMax, S.p.hp + 2);
}
// l'effet d'un élément sur une balle : b = la branche du lobby (valeurs brutes ; HM_ZERO : chiffres de base), pA = le passif du héros.
// Feu : brûlure et éclaboussure (35 % autour) ; Eau : ralenti (et vague de froid) ; Nature : poison ; Terre : recul (dehors, pas les
// gros) ; Élec : arcs vers les voisins (50 %) ; Vent : soulève les petits (V4.8 ; la traversée de plusieurs zombies est dans shootOne)
function effetBalle(S, el, i, dmg, x, y, z, b, pA) {
  const Z = S.z,
    v = k => b[k] || 0;
  if (Z.st[i] === 0) return;
  if (el === 'feu') {
    Z.burn[i] = Math.max(Z.burn[i], 2.5 + v('eBurn'));
    const R = 1.8 + v('eFireR'),
      R2 = v('eFireR') ? R * R : 3.2,
      k = 0.35 + pA;
    gridEach(S, x, z, R, j => {
      if (j !== i && Z.st[j] !== 0 && Math.abs(Z.y[j] - Z.y[i]) < 1.5) {
        const dx = Z.x[j] - x,
          dz = Z.z[j] - z;
        if (dx * dx + dz * dz < R2) hurtZ(S, j, dmg * k, 'p');
      }
    });
  } else if (el === 'eau') {
    Z.slow[i] = Math.max(Z.slow[i], 1.6 + v('eSlow'));
    // Vague de froid (eWave) : ralentit aussi à 2,5 m autour
    if (v('eWave') > 0)
      gridEach(S, x, z, 2.5, j => {
        if (j !== i && Z.st[j] !== 0 && Math.abs(Z.y[j] - Z.y[i]) < 1.5 && (Z.x[j] - x) ** 2 + (Z.z[j] - z) ** 2 < 6.25)
          Z.slow[j] = Math.max(Z.slow[j], 1.6 + v('eSlow'));
      });
  } else if (el === 'bois') Z.psn[i] = Math.max(Z.psn[i], 4 + v('ePois') + pA);
  else if (el === 'terre') {
    // balles lourdes : repoussent la cible (dehors, pas les gros) dans l'axe du tir (V4.8 : 0,6 m de base + eKnock)
    const rec = 0.6 + v('eKnock');
    if (outside(Z, i) && Z.st[i] === 1 && !bigZ(Z.ty[i])) {
      const dx = Z.x[i] - S.p.x,
        dz = Z.z[i] - S.p.z,
        l = Math.hypot(dx, dz) || 1;
      Z.x[i] += (dx / l) * rec;
      Z.z[i] += (dz / l) * rec;
      if (S.mode === 'out') outRoute(S, i);
    }
  } else if (el === 'elec') {
    // arcs sur les plus proches voisins (50 % des dégâts) ; plus de voisins (pA, eChain), arcs plus forts (eChainD)
    const n = 1 + Math.round(pA + v('eChain')),
      k = 0.5 + v('eChainD'),
      pris = [];
    for (let a = 0; a < n; a++) {
      let best = -1,
        bd = 36;
      gridEach(S, Z.x[i], Z.z[i], 6, j => {
        if (j === i || Z.st[j] === 0 || Math.abs(Z.y[j] - Z.y[i]) > 2.5 || pris.includes(j)) return;
        const dx = Z.x[j] - Z.x[i],
          dz = Z.z[j] - Z.z[i],
          d = dx * dx + dz * dz;
        if (d < bd) {
          bd = d;
          best = j;
        }
      });
      if (best < 0) break;
      pris.push(best);
      S.ev.push({ k: 'zap', x0: Z.x[i], y0: Z.y[i] + 1.1, z0: Z.z[i], x1: Z.x[best], y1: Z.y[best] + 1.1, z1: Z.z[best], small: 1 });
      hurtZ(S, best, dmg * k, 'p');
    }
  } else if (el === 'vent') {
    // soulève les petits : dehors, immobiles 0,6 s (+ eLift ; l'entrave ne joue que dans la rue) ; dedans, ralentis autant
    const d = 0.6 + v('eLift');
    if (bigZ(Z.ty[i])) return;
    if (outside(Z, i)) {
      if (Z.root[i] < d - 0.05) {
        Z.root[i] = d;
        S.mLeve = i; // chez un invité du multi : le coup qui part (hurtInvite) le dit à l'hôte
        S.ev.push({ k: 'souleve', i, d, x: Z.x[i], y: Z.y[i], z: Z.z[i] });
      }
    } else Z.slow[i] = Math.max(Z.slow[i], d);
  }
}
// V4.8 : prédilection : une arme de l'élément du héros fait 10 % de dégâts en plus (balles et lance-flammes)
// V5.2 : l'élément choisi du héros (elH)
const predilK = S => (S.hero && S.elArme === elH(S) ? 1.1 : 1);
// V5.3 : l'élément qui remplace celui du sort : l'élément choisi du héros quand il n'est pas sa clé ; null : le sort est comme avant (V5.2)
const elS = S => {
  const e = elH(S);
  return S.hero && e !== S.hero ? e : null;
};
// V5.3 : pendant que le sort frappe (S.sortEl), hurtZ appelle sortEffet : l'effet des balles de cet élément (chiffres de base) sur le zombie i,
// une fois par seconde et par zombie (S.sortT). Même mécanique que l'ultime teinté (voies.js : teinte), avec ses propres garde-fous
function sortEffet(S, i, dmg) {
  const el = S.sortEl,
    Z = S.z;
  if (!S.sortT || Z.st[i] === 0 || S.sortT[i] > S.t) return;
  S.sortT[i] = S.t + 1;
  const u = S.ultEl;
  S.sortEl = null;
  S.ultEl = null;
  effetBalle(S, el, i, Math.min(dmg, 60 * hpMul(S.day)), Z.x[i], Z.y[i] + 1, Z.z[i], HM_ZERO, 0);
  S.ultEl = u;
  S.sortEl = el;
}
// Bond (Zéphyr) : un bond en arrière de 8 m (+ kLen), arrêté par les murs, avec un petit saut ; kPush (et pousse : faux chez un invité
// du multi, l'hôte s'en charge) : au départ, les zombies à moins de 5 m sont repoussés de 5 m (dehors, pas les gros ; ceux d'un mur
// d'avenue en tombent ; dedans, ralentis 1,5 s)
function rafale(S, m, pousse) {
  const p = S.p,
    Z = S.z,
    bx = Math.sin(p.yaw),
    bz = Math.cos(p.yaw),
    L = 8 + m.kLen,
    dash = Math.max(0, Math.min(L, rayWall(p.x, p.y + 0.55, p.z, bx, 0, bz, L + 0.45) - 0.45)),
    x0 = p.x,
    z0 = p.z;
  if (pousse && m.kPush > 0)
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (Z.st[i] === 0 || Math.abs(Z.y[i] - p.y) > 2.2 || bigZ(Z.ty[i])) continue;
      const dx = Z.x[i] - x0,
        dz = Z.z[i] - z0,
        l = Math.hypot(dx, dz);
      if (l > 5) continue;
      if (!outside(Z, i)) {
        Z.slow[i] = Math.max(Z.slow[i], 1.5);
        continue;
      }
      const ux = l > 0.05 ? dx / l : -bx,
        uz = l > 0.05 ? dz / l : -bz;
      Z.x[i] += ux * 5;
      Z.z[i] += uz * 5;
      if (Z.st[i] === 5) {
        Z.st[i] = 1;
        Z.y[i] = 0;
      }
      if (S.mode === 'out') outRoute(S, i);
    }
  p.x += bx * dash;
  p.z += bz * dash;
  p.vx = bx * 5;
  p.vz = bz * 5;
  if (p.ground) {
    p.vy = 3.5;
    p.ground = false;
  }
  p.inv = 0.4;
  S.ev.push({ k: 'rafale', x0, y: p.y + 1, z0, x1: p.x, z1: p.z, ec: elH(S) });
}
// Tir perçant (Zéphyr) : la ligne du tir, de l'œil dans l'axe de la vue, jusqu'au sol ou à 200 m (les murs ne l'arrêtent pas) ;
// [x0, y0, z0, x1, y1, z1, longueur, dx, dy, dz]
function lignePercant(p) {
  const o = eyeP(p),
    d = viewDir(p);
  let L = 200;
  if (d[1] < -1e-3) L = Math.min(L, o[1] / -d[1]);
  return [o[0], o[1], o[2], o[0] + d[0] * L, o[1] + d[1] * L, o[2] + d[2] * L, L, d[0], d[1], d[2]];
}
// tout zombie à moins de la demi-largeur (0,75 m + uRad / 2, plus sa carrure) de la ligne prend 160 × puissance × vie du jour (+ uDmg)
function tirPercant(S, m, pw) {
  const Z = S.z,
    l = lignePercant(S.p),
    w = 1.5 + m.uRad,
    dmg = 160 * pw * hpMul(S.day) * (1 + m.uDmg);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] === 0 || Z.fant[i]) continue;
    const T = ZT[Z.ty[i]],
      vx = Z.x[i] - l[0],
      vy = Z.y[i] + T.sc - l[1],
      vz = Z.z[i] - l[2],
      t = Math.max(0, Math.min(l[6], vx * l[7] + vy * l[8] + vz * l[9])),
      ex = vx - l[7] * t,
      ey = vy - l[8] * t,
      ez = vz - l[9] * t,
      r = w / 2 + T.r;
    if (ex * ex + ey * ey + ez * ez < r * r) hurtZ(S, i, dmg, 'p');
  }
  S.ev.push({ k: 'percant', x0: l[0], y0: l[1], z0: l[2], x1: l[3], y1: l[4], z1: l[5], w, ec: elH(S) });
}
// compétence du héros (bouton Compétence, double appui) ; renvoie true si elle part. Pendant le jour seulement, sauf la Fulgurance de Volt
// et le Bond de Zéphyr (V4.8 : bond en arrière, rafale()).
// Fulgurance : bond de 14 m (arrêté par les murs), électrocute ce qu'il traverse ; les autres visent aimPoint : Orbe (boule de feu, S.fballs),
// Répulsion (vague : ralentit, blesse, repousse vers l'immeuble), Entraves (roncier, S.thorns), Rempart (mur dans la rue, S.ramparts ; refusé ailleurs)
function useHeroSkill(S) {
  const h = S.hero;
  if (!h || S.hab > 0 || S.p.dead || S.p.down > 0 || S.phase === 'dead' || S.phase === 'won') return false;
  if (h !== 'elec' && h !== 'vent' && S.phase !== 'day') return false;
  // V4.8 : pas de Bond en grimpant ni sur la tyrolienne
  if (h === 'vent' && (S.p.clb || S.p.zip)) return false;
  const hero = HEROS[h],
    pw = hPow(S),
    cd = (hero.cd * S.P.mis.cd) / 22,
    Z = S.z,
    m = S.hm,
    // V5.3 : l'élément choisi qui remplace celui du sort (null : comme avant)
    ec = elS(S);
  // V4.3 : chez un invité du multi, l'hôte l'exécute (multi.js : action 'c')
  if (S.invite) return skillInvite(S, h, cd);
  if (h === 'elec') {
    // Fulgurance : un bond horizontal de 14 m, arrêté par les murs
    const p = S.p,
      fx = -Math.sin(p.yaw),
      fz = -Math.cos(p.yaw),
      reach = rayWall(p.x, p.y + 0.55, p.z, fx, 0, fz, 14 + m.kLen) - 0.45,
      dash = Math.max(0, reach),
      x0 = p.x,
      z0 = p.z,
      x1 = p.x + fx * dash,
      z1 = p.z + fz * dash;
    let tue = false;
    S.sortEl = ec;
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (Z.st[i] === 0 || Math.abs(Z.y[i] - p.y) > 2.2) continue;
      const ax = Z.x[i] - x0,
        az = Z.z[i] - z0,
        t = Math.max(0, Math.min(dash, ax * fx + az * fz)),
        ex = ax - fx * t,
        ez = az - fz * t;
      if (ex * ex + ez * ez < 5) {
        Z.slow[i] = Math.max(Z.slow[i], 2);
        // V4.9 : Lame (isolé : +50 %, Exécution)
        if (hurtZ(S, i, 70 * pw * voieDegats(S, i, 0), 'p') || voieAcheve(S, i)) tue = true;
      }
    }
    S.sortEl = null;
    p.x = x1;
    p.z = z1;
    p.vx = fx * 7;
    p.vz = fz * 7;
    p.inv = 0.6;
    // V4.9 : Escarmoucheur, Relance (spB2) : un zombie tué par la Fulgurance le relance
    S.hab = tue && voieDe(S, 'elec', 'b') && m.spB2 > 0 ? 0.3 : cd;
    S.ev.push({ k: 'eclair', x0, y: p.y + 1, z0, x1, z1, ec: elH(S) });
    if (S.hab < 1) S.ev.push({ k: 'relance' });
    return true;
  }
  if (h === 'vent') {
    S.sortEl = ec;
    rafale(S, m, true);
    S.sortEl = null;
    S.hab = cd;
    return true;
  }
  const a = aimPoint(S, 160),
    gx = a[0],
    gy = a[1],
    gz = a[2];
  if (h === 'feu') {
    const e = eyeP(S.p);
    // V4.9 : Artilleur : le feu au sol fait 6 m (au lieu de 4,2)
    S.fballs.push({
      x0: e[0] + 0.2,
      y0: e[1] - 0.1,
      z0: e[2],
      x1: gx,
      y1: gy,
      z1: gz,
      t: 0,
      T: 0.3 + a[3] / 90,
      pw,
      r: 5 + m.abRad,
      feuR: voieDe(S, 'feu', 'a') ? 6 : 4.2,
      ec
    });
    S.ev.push({ k: 'brasier0', ec: elH(S) });
  } else if (h === 'eau') {
    const R = 8,
      piege = voieDe(S, 'eau', 'b') ? 1.5 + m.spB1 : 0;
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (Z.st[i] === 0 || Math.abs(Z.y[i] - gy) > 2.5) continue;
      const dx = Z.x[i] - gx,
        dz = Z.z[i] - gz;
      if (dx * dx + dz * dz > R * R) continue;
      // V5.3 : le ralentissement est l'effet de l'Eau : avec un autre élément choisi, c'est le sien (sortEffet)
      if (!ec) Z.slow[i] = Math.max(Z.slow[i], 3.5);
      S.sortEl = ec;
      const mort = hurtZ(S, i, 55 * pw, 'p');
      S.sortEl = null;
      if (mort) continue;
      // V4.9 : Entraveuse : immobilisés 1,5 s (+ spB1), dehors ; les gros restent ralentis
      if (piege && outside(Z, i) && !bigZ(Z.ty[i])) Z.root[i] = Math.max(Z.root[i], piege);
      if (outside(Z, i)) {
        const l = Math.hypot(Z.x[i], Z.z[i]) || 1,
          rec = Math.min(6 + m.kLen, Math.max(0, l - (B + BALD + 1)));
        Z.x[i] -= (Z.x[i] / l) * rec;
        Z.z[i] -= (Z.z[i] / l) * rec;
        if (Z.st[i] === 5) {
          Z.st[i] = 1;
          Z.y[i] = 0;
        }
        if (S.mode === 'out') outRoute(S, i);
      }
    }
    if (m.kHeal) S.p.hp = Math.min(S.p.hpMax, S.p.hp + m.kHeal * soinK(S));
    // V4.9 : Soigneuse, Bouclier d'eau (spA2) : 30, 10 s
    if (voieDe(S, 'eau', 'a') && m.spA2 > 0) bouclierMaree(S, gx, gy, gz, R);
    S.ev.push({ k: 'maree', x: gx, y: gy, z: gz, r: R, ec: elH(S) });
  } else if (h === 'bois' && voieDe(S, 'bois', 'b')) plonge(S, a, m, pw, true, true);
  else if (h === 'bois') {
    S.thorns.push({ x: gx, y: gy, z: gz, r: 5.2 + m.abRad, t: 6 + m.kDur, dps: 22 * pw, pulse: 0, ec });
    S.ev.push({ k: 'ronces', x: gx, y: gy, z: gz, r: 5.2 + m.abRad, ec: elH(S) });
  } else if (h === 'terre') {
    if (gy > 0.8) {
      S.ev.push({ k: 'refus', why: 'Vise la rue' });
      return false;
    }
    const l = Math.hypot(gx, gz) || 1,
      nx = gx / l,
      nz = gz / l;
    // V4.9 : Gardien (2 m de plus de chaque côté + spA1, ×1,5 de solidité ; spA2 : renvoie la moitié des coups) ; Avant-garde (il charge
    // 6 m + spB1 vers l'extérieur, chargeRempart ; spB2 : onde à l'arrivée)
    const gard = voieDe(S, 'terre', 'a'),
      avg = voieDe(S, 'terre', 'b'),
      half = 4.5 + m.kWide + (gard ? 2 + m.spA1 : 0),
      hp = 450 * pw * (gard ? 1.5 : 1);
    S.ramparts.push({
      x: gx,
      z: gz,
      nx,
      nz,
      half,
      t: 14 + m.kDur,
      hp,
      hp0: hp,
      id: (S.rid = (S.rid || 0) + 1),
      renvoi: gard && m.spA2 > 0 ? 0.5 : 0,
      ch: avg ? 6 + m.spB1 : 0,
      onde: avg && m.spB2 > 0 ? 1 : 0,
      dg: 30 * pw * hpMul(S.day),
      ec
    });
    S.ev.push({ k: 'rempart', x: gx, z: gz, nx, nz, half, ch: avg ? 6 + m.spB1 : 0, ec: elH(S) });
  }
  S.hab = cd;
  return true;
}
// ultime du héros (bouton Ultime, double appui ; S.ult chargé à 1 en tuant). Météores (S.meteors), Sanctuaire (S.flood ; ville et joueur soignés),
// Gardiens (trois arbres aux sorties les plus chargées, S.guards), Onde de choc (immédiat : dehors blessés, entravés ou ralentis ; dedans, près du
// joueur, blessés), Déchaînement (S.storms, là où l'on vise), Tir perçant (V4.8, immédiat : tirPercant)
function useHeroUlt(S) {
  const h = S.hero;
  if (!h || S.ult < 1 || S.phase !== 'day' || S.p.down > 0) return false;
  // V4.3 : chez un invité du multi, l'hôte l'exécute (multi.js : action 'u')
  if (S.invite) return ultInvite(S, h);
  S.ult = 0;
  const pw = uPow(S),
    Z = S.z,
    m = S.hm,
    // V4.9 : ultime teinté (voies.js : l'élément de l'arme s'il n'est pas celui du héros), posé sur ce qui dure, et ici pour l'immédiat
    el = teinteDe(S, h),
    // V5.3 : l'élément choisi qui remplace celui du sort (null : comme avant)
    ec = elS(S);
  S.ultEl = el;
  if (h === 'feu')
    // V4.9 : Artilleur, Sol en feu (spA2) : chaque météore laisse le sol en feu 4 s
    S.meteors.push({
      n: Math.round(8 * pw) + Math.round(m.uExtra),
      t: 0,
      r: 5.5 + m.uRad,
      el,
      ec,
      feu: voieDe(S, 'feu', 'a') && m.spA2 > 0 ? 1 : 0
    });
  else if (h === 'eau') {
    S.floodOwn = undefined;
    S.flood = 8 * Math.sqrt(pw) + m.uDur;
    S.floodEl = el;
    S.floodEc = ec;
    S.city = Math.min(S.P.hp, S.city + (15 * pw + 5 * m.uExtra) * soinK(S));
    S.p.hp = S.p.hpMax;
    // V4.9 : Entraveuse, Lame de fond (spB2) : à son arrivée, tous les petits dehors immobilisés 1,5 s (+ spB1)
    if (voieDe(S, 'eau', 'b') && m.spB2 > 0)
      for (let k = 0; k < S.nAct; k++) {
        const i = S.act[k];
        if (outside(Z, i) && !bigZ(Z.ty[i])) Z.root[i] = Math.max(Z.root[i], 1.5 + m.spB1);
      }
  } else if (h === 'bois') {
    const perRoad = ROADS.map((R, r) => [0, r]);
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (outside(Z, i)) perRoad[Z.road[i]][0]++;
    }
    perRoad.sort((a, b) => b[0] - a[0]);
    for (const q of perRoad.slice(0, 3 + Math.round(m.uExtra))) {
      const R = ROADS[q[1]];
      S.guards.push({
        x: R.b[0] - R.dx * 3 + R.px * (R.w / 2 + 1.5),
        z: R.b[1] - R.dz * 3 + R.pz * (R.w / 2 + 1.5),
        t: 15 * Math.sqrt(pw) + m.uDur,
        cd: S.rnd() * 0.4,
        pw,
        el,
        ec
      });
    }
  } else if (h === 'terre') {
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      const st = Z.st[i];
      if (st === 0) continue;
      if (outside(Z, i) && Math.hypot(Z.x[i], Z.z[i]) < 30 + 8 * (pw - 1) + m.uRad) {
        S.sortEl = ec;
        const mort = hurtZ(S, i, 40 * pw * hpMul(S.day), 'p');
        S.sortEl = null;
        if (mort) continue;
        // V5.3 : l'étourdissement est l'effet de la Terre : avec un autre élément choisi, c'est le sien (sortEffet)
        // V5.4 (sa décision du 28/11) : l'Onde de choc étourdit quel que soit l'élément choisi ; l'effet de l'élément s'ajoute
        if (bigZ(Z.ty[i])) Z.slow[i] = Math.max(Z.slow[i], 3);
        else Z.root[i] = 2.5 + m.uDur;
        if (st === 5) {
          Z.st[i] = 1;
          Z.y[i] = 0;
          if (S.mode === 'out') outRoute(S, i);
        }
      } else if ((st === 3 || st === 7) && Math.hypot(Z.x[i] - S.p.x, Z.y[i] - S.p.y, Z.z[i] - S.p.z) < 12) {
        S.sortEl = ec;
        const mort = hurtZ(S, i, 90 * pw, 'p');
        S.sortEl = null;
        if (!mort) Z.root[i] = 2;
      }
    }
  } else if (h === 'elec') {
    const a = aimPoint(S, 160);
    S.storms.push({ x: a[0], y: a[1], z: a[2], t: 6 * Math.sqrt(pw) + m.uDur, r: 16 + m.uRad, zap: 0, pw, el, ec });
  } else if (h === 'vent') {
    S.sortEl = ec;
    tirPercant(S, m, pw);
    S.sortEl = null;
  }
  S.ultEl = null;
  S.ev.push({ k: 'hult', h, el, ec: elH(S) });
  return true;
}
// ce qui dure, à chaque pas : boules de feu (explosion à l'arrivée, flammes au sol), ronciers, remparts (fin : temps ou casse),
// météores (un toutes les 0,32 s sur le plus loin dehors ; les gros comptent 8 m de plus), déluge, gardiens (une flèche toutes les 0,55 s), orages (3 éclairs / 0,4 s)
function heroStep(S, dt) {
  const Z = S.z;
  // V4.4 (multi) : f.own, th.own… = l'invité qui a lancé l'effet (vide sinon) : ses tués sont à son compte (killZ, S.mOwn)
  for (const f of S.fballs) {
    S.mOwn = f.own;
    f.t += dt;
    if (f.t >= f.T) {
      f.done = 1;
      S.sortEl = f.ec;
      boom(S, f.x1, f.y1 + 0.3, f.z1, f.r, 130 * f.pw, 'p', 'B');
      S.sortEl = null;
      // V5.3 : le feu au sol prend l'élément choisi (el : sa couleur et son effet, zombies.js)
      if (f.y1 < 0.8) S.fires.push({ x: f.x1, z: f.z1, r: f.feuR || 4.2, t: 5, dps: 24 * f.pw, own: f.own, el: f.ec });
    }
  }
  S.fballs = S.fballs.filter(f => !f.done);
  S.mOwn = undefined;
  for (const th of S.thorns) {
    S.mOwn = th.own;
    th.t -= dt;
    th.pulse -= dt;
    const root = th.pulse <= 0;
    if (root) th.pulse = 1;
    gridEach(S, th.x, th.z, th.r, i => {
      if (Z.st[i] === 0 || Math.abs(Z.y[i] - th.y) > 2.5) return;
      const dx = Z.x[i] - th.x,
        dz = Z.z[i] - th.z;
      if (dx * dx + dz * dz > th.r * th.r) return;
      // V5.3 : le ralentissement est l'effet de la Nature (ici, celui de l'élément choisi s'il est autre : sortEffet)
      if (!th.ec) Z.slow[i] = Math.max(Z.slow[i], 0.3);
      if (root && Z.ty[i] < 3) Z.root[i] = Math.max(Z.root[i], 0.45);
      S.sortEl = th.ec;
      hurtZ(S, i, th.dps * dt, 'p');
      S.sortEl = null;
    });
  }
  S.thorns = S.thorns.filter(th => th.t > 0);
  S.mOwn = undefined;
  for (const wall of S.ramparts) {
    // V4.9 : Avant-garde : le rempart qui charge (voies.js)
    if (wall.ch > 0) {
      S.mOwn = wall.own;
      chargeRempart(S, wall, dt);
      S.mOwn = undefined;
    }
    wall.t -= dt;
    if (wall.t <= 0 || wall.hp <= 0) {
      wall.done = 1;
      S.ev.push({ k: 'rempart_fin', id: wall.id, x: wall.x, z: wall.z, broke: wall.hp <= 0, ec: wall.ec || 'terre' });
    }
  }
  S.ramparts = S.ramparts.filter(wall => !wall.done);
  for (const met of S.meteors) {
    S.mOwn = met.own;
    met.t -= dt;
    if (met.t > 0 || met.n <= 0) continue;
    met.t = 0.32;
    met.n--;
    let best = -1,
      bd = -1;
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (!outside(Z, i)) continue;
      const d = Math.hypot(Z.x[i], Z.z[i]) + (bigZ(Z.ty[i]) ? 8 : 0);
      if (d > bd) {
        bd = d;
        best = i;
      }
    }
    if (best >= 0) {
      S.bombs.push({
        x: Z.x[best],
        z: Z.z[best],
        t: 0.55,
        dmg: 240 * uPow(S),
        r: met.r || 5.5,
        met: 1,
        own: met.own,
        el: met.el,
        ec: met.ec,
        feu: met.feu
      });
      S.ev.push({ k: 'meteor', x: Z.x[best], z: Z.z[best], t: 0.55, ec: met.ec || 'feu' });
    }
  }
  S.meteors = S.meteors.filter(met => met.n > 0);
  S.mOwn = undefined;
  if (S.flood > 0) {
    S.mOwn = S.floodOwn;
    S.ultEl = S.floodEl || null;
    S.flood -= dt;
    for (let k = 0; k < S.nAct; k++) {
      const i = S.act[k];
      if (!outside(Z, i)) continue;
      // V5.3 : le ralentissement est l'effet de l'Eau (ici, celui de l'élément choisi s'il est autre : sortEffet)
      if (!S.floodEc) Z.slow[i] = Math.max(Z.slow[i], 0.25);
      S.sortEl = S.floodEc;
      hurtZ(S, i, Z.hm[i] * 0.035 * uPow(S) * dt, 'p');
      S.sortEl = null;
    }
    S.ultEl = null;
  }
  for (const gd of S.guards) {
    S.mOwn = gd.own;
    gd.t -= dt;
    gd.cd -= dt;
    if (gd.cd > 0) continue;
    gd.cd = 0.55;
    let best = -1,
      bd = 24 * 24;
    gridEach(S, gd.x, gd.z, 24, i => {
      if (!outside(Z, i)) return;
      const dx = Z.x[i] - gd.x,
        dz = Z.z[i] - gd.z,
        d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) {
      S.ev.push({ k: 'fleche', x0: gd.x, y0: 5, z0: gd.z, x1: Z.x[best], y1: Z.y[best] + 1.1, z1: Z.z[best], ec: gd.ec || 'bois' });
      // V5.3 : le poison est l'effet de la Nature (ici, celui de l'élément choisi s'il est autre : sortEffet)
      if (!gd.ec) Z.psn[best] = Math.max(Z.psn[best], 4);
      S.ultEl = gd.el || null;
      S.sortEl = gd.ec;
      hurtZ(S, best, 34 * gd.pw, 'p');
      S.sortEl = null;
      S.ultEl = null;
    }
  }
  S.guards = S.guards.filter(gd => gd.t > 0);
  S.mOwn = undefined;
  for (const storm of S.storms) {
    S.mOwn = storm.own;
    storm.t -= dt;
    storm.zap -= dt;
    if (storm.zap > 0) continue;
    storm.zap = 0.4;
    const cand = [];
    gridEach(S, storm.x, storm.z, storm.r, i => {
      if (Z.st[i] === 0) return;
      const dx = Z.x[i] - storm.x,
        dz = Z.z[i] - storm.z;
      if (dx * dx + dz * dz < storm.r * storm.r) cand.push(i);
    });
    for (let n = 0; n < 3 && cand.length; n++) {
      const i = cand.splice(Math.floor(S.rnd() * cand.length), 1)[0];
      S.ev.push({
        k: 'zap',
        x0: Z.x[i] + (S.rnd() - 0.5) * 4,
        y0: Z.y[i] + 26,
        z0: Z.z[i] + (S.rnd() - 0.5) * 4,
        x1: Z.x[i],
        y1: Z.y[i] + 1,
        z1: Z.z[i],
        ec: storm.ec || 'elec'
      });
      S.ultEl = storm.el || null;
      S.sortEl = storm.ec;
      hurtZ(S, i, 48 * storm.pw, 'p');
      S.sortEl = null;
      S.ultEl = null;
    }
  }
  S.storms = S.storms.filter(storm => storm.t > 0);
  S.mOwn = undefined;
}
// le rempart arrête ceux qui marchent dehors : un zombie dont le pas traverse le mur revient en arrière et tape dessus
function rampartBlock(S, i, px, pz, dt) {
  const Z = S.z;
  for (const wall of S.ramparts) {
    const side0 = (px - wall.x) * wall.nx + (pz - wall.z) * wall.nz,
      side1 = (Z.x[i] - wall.x) * wall.nx + (Z.z[i] - wall.z) * wall.nz;
    if (Math.abs(side0) > 1.2 && Math.abs(side1) > 1.2 && side0 * side1 > 0) continue;
    const along = (Z.x[i] - wall.x) * -wall.nz + (Z.z[i] - wall.z) * wall.nx;
    if (Math.abs(along) > wall.half + ZT[Z.ty[i]].r) continue;
    if (side0 * side1 <= 0 || Math.abs(side1) < 0.6) {
      const side = side0 >= 0 ? 1 : -1;
      Z.x[i] = wall.x + wall.nx * side * 0.65 + -wall.nz * along;
      Z.z[i] = wall.z + wall.nz * side * 0.65 + wall.nx * along;
      const coup = ZT[Z.ty[i]].dps * dt * (Z.ty[i] === 5 ? 2.5 : 1);
      wall.hp -= coup;
      // V4.9 : Gardien, Rempart renvoyeur : la moitié du coup revient au zombie
      if (wall.renvoi) {
        S.mOwn = wall.own;
        hurtZ(S, i, coup * wall.renvoi, 'p');
        S.mOwn = undefined;
      }
      return true;
    }
  }
  return false;
}
