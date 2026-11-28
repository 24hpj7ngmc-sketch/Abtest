// ===================== LES VOIES (V4.9) et L'ULTIME TEINTÉ =====================
// La refonte du lobby (Abtest. V12.2, claude/refonte-roles-contrat.md, point 6) : à partir du niveau 10 de l'arbre du héros, une voie parmi
// deux, choisie au Hall du lobby (opts.voie = { id: 'a' | 'b', nom }), qui modifie son kit ; deux cases par voie dans l'arbre (spA1, spA2
// pour la voie a ; spB1, spB2 pour la b ; valeurs brutes du lobby, voir VOIES). Sans voie (S.voie null, et toujours hors lobby), le kit
// de base. Le kit de Dernier Toit étant fait pour une ville (on tire du toit sur la rue), chaque voie y est adaptée : VOIES[h][v].d dit
// ce qu'elle fait ici.
// Ultime teinté : l'ultime garde son effet et gagne celui de l'élément de l'arme (S.elArme), quand il n'est pas celui du héros : chaque
// zombie qu'il blesse reçoit l'effet des balles de cet élément (effetBalle, avec la branche bonus.balles), une fois par seconde au plus
// (S.teintT). S.ultEl est posé pendant que l'ultime frappe (useHeroUlt, et heroStep / capacites.js pour ce qui dure) ; hurtZ appelle teinte.
// Fournit : VOIES, voieDe, voieNom (interface : Guide, fin) ; les règles des voies, appelées par heros.js, armes.js, joueur.js,
// degats.js, capacites.js, multi.js.

// pour chaque héros, ses deux voies : n le nom (celui du lobby), d ce qu'elle fait dans Dernier Toit (Guide), c1, c2 ses deux cases
const VOIES = {
  terre: {
    a: {
      n: 'Gardien',
      d: 'Rempart géant : 2 m de plus de chaque côté et 50 % plus solide',
      c1: '+1 m de chaque côté par niveau',
      c2: 'les zombies qui le frappent prennent la moitié de leurs coups'
    },
    b: {
      n: 'Avant-garde',
      d: "le Rempart charge : il fonce 6 m dans la rue en renversant ce qu'il pousse, puis tient",
      c1: '+2 m de charge par niveau',
      c2: "à l'arrivée, une onde renverse aussi tout autour (5 m)"
    }
  },
  bois: {
    a: { n: 'Colosse', d: '+25 de vie', c1: '+25 de vie par niveau', c2: 'chaque coup sur un zombie à moins de 5 m te rend 2 de vie' },
    b: {
      n: 'Plongeur',
      d: "les Ronces deviennent un bond de 8 m vers ta cible : à l'arrivée, un roncier et un poison de 6 s autour",
      c1: '+2 m de bond par niveau',
      c2: 'le poison passe aux voisins (3 m) quand un empoisonné meurt'
    }
  },
  elec: {
    a: {
      n: 'Lame',
      d: 'balles et Éclair : +50 % sur un zombie isolé (personne à moins de 4 m)',
      c1: '+20 % par niveau',
      c2: 'achève un zombie que tu laisses sous 15 % de sa vie'
    },
    b: {
      n: 'Escarmoucheur',
      d: "chaque zombie tué rend 2,5 % de la recharge de l'Éclair (on en tue des centaines par jour)",
      c1: '+1,5 point par niveau',
      c2: "un zombie tué par l'Éclair le relance aussitôt"
    }
  },
  feu: {
    a: {
      n: 'Artilleur',
      d: 'tes armes portent 10 m plus loin ; le Brasier laisse un feu plus large (6 m)',
      c1: '+5 m de portée par niveau',
      c2: 'chaque météore laisse le sol en feu 4 s'
    },
    b: {
      n: 'Mage de bataille',
      d: 'une aura brûle les zombies à moins de 3 m de toi',
      c1: '+1 m par niveau',
      c2: "l'aura amortit les coups reçus (−25 %)"
    }
  },
  eau: {
    a: {
      n: 'Soigneuse',
      d: 'tous tes soins +20 % (vie qui remonte, Marée, Déluge pour la ville)',
      c1: '+15 % par niveau',
      c2: 'la Marée te pose un bouclier de 30 (10 s)'
    },
    b: {
      n: 'Entraveuse',
      d: "la Marée immobilise les zombies qu'elle touche 1,5 s (les gros, ralentis)",
      c1: '+0,5 s par niveau',
      c2: 'le Déluge immobilise aussi tous les zombies dehors à son arrivée'
    }
  },
  vent: {
    a: {
      n: 'Sniper',
      d: '+15 % de dégâts au-delà de 40 m (en plus du passif)',
      c1: '+10 % par niveau',
      c2: '1 s en visée charge un tir : ×2 et il traverse 3 zombies de plus'
    },
    b: {
      n: 'Mitrailleur',
      d: '+10 % de cadence, +10 % de plus en courant',
      c1: '+8 % en courant par niveau',
      c2: "la cadence monte tant qu'il tire (+4 % par tir, jusqu'à +40 %)"
    }
  }
};
// la voie v ('a' | 'b') du héros h est-elle jouée ?
const voieDe = (S, h, v) => S.hero === h && S.voie === v;
// « Sniper » (ou '' sans voie)
const voieNom = S => (S.hero && S.voie && VOIES[S.hero] ? VOIES[S.hero][S.voie].n : '');

// ---------------------------------------------------------------- sur les balles
// le multiplicateur de dégâts d'une balle (ou de l'Éclair) sur le zombie i, touché à dist m : Lame (isolé), Sniper (au-delà de 40 m)
function voieDegats(S, i, dist) {
  if (voieDe(S, 'vent', 'a')) return dist > 40 ? 1.15 + S.hm.spA1 : 1;
  if (!voieDe(S, 'elec', 'a')) return 1;
  const Z = S.z;
  let seul = true;
  gridEach(S, Z.x[i], Z.z[i], 4, j => {
    if (seul && j !== i && Z.st[j] !== 0 && Math.abs(Z.y[j] - Z.y[i]) < 2 && (Z.x[j] - Z.x[i]) ** 2 + (Z.z[j] - Z.z[i]) ** 2 < 16)
      seul = false;
  });
  return seul ? 1.5 + S.hm.spA1 : 1;
}
// Lame, Exécution (spA2) : le zombie i, touché et vivant sous 15 % de sa vie, est achevé
function voieAcheve(S, i) {
  const Z = S.z;
  if (!voieDe(S, 'elec', 'a') || !(S.hm.spA2 > 0) || Z.st[i] === 0 || Z.hp[i] <= 0) return false;
  if (Z.hp[i] >= 0.15 * Z.hm[i]) return false;
  S.ev.push({ k: 'acheve', x: Z.x[i], y: Z.y[i] + 1.2, z: Z.z[i] });
  return hurtZ(S, i, Z.hp[i] + 1, 'p');
}
// Artilleur : portée des armes en plus (m)
const porteeVoie = S => (voieDe(S, 'feu', 'a') ? 10 + S.hm.spA1 : 0);
// Soigneuse : les soins d'Ondine
const soinK = S => (voieDe(S, 'eau', 'a') ? 1.2 + S.hm.spA1 : 1);
// Mitrailleur : la cadence (finishP) : +10 %, +10 % (+ spB1) en courant, + la montée du tir continu (spB2 : p.rafN tirs d'affilée)
function cadenceVoie(S) {
  if (!voieDe(S, 'vent', 'b')) return 1;
  const p = S.p;
  return 1.1 + (p.spr ? 0.1 + S.hm.spB1 : 0) + (S.hm.spB2 > 0 ? Math.min(0.4, 0.04 * (p.rafN || 0)) : 0);
}
// Sniper, Tir chargé (spA2) : 1 s en visée (p.adsT, finishP) charge le prochain tir
const tirCharge = S => voieDe(S, 'vent', 'a') && S.hm.spA2 > 0 && (S.p.adsT || 0) >= 1;

// ---------------------------------------------------------------- sur le joueur (finishP, hurtP, killZ)
// à chaque pas : visée (Sniper), tir continu (Mitrailleur), bouclier (Soigneuse), aura (Mage de bataille : 4 fois par seconde, les zombies à
// moins de 3 m + spB1 brûlent 1,5 s et prennent 3 × vie du jour)
function voieJoueur(S, dt, inp) {
  const p = S.p;
  p.adsT = inp.ads && voieDe(S, 'vent', 'a') ? (p.adsT || 0) + dt : 0;
  if (!inp.fire) p.rafT = (p.rafT || 0) + dt;
  if (p.rafT > 0.5) p.rafN = 0;
  if (p.boucT > 0) {
    p.boucT -= dt;
    if (p.boucT <= 0) p.boucl = 0;
  }
  if (!voieDe(S, 'feu', 'b') || p.down > 0 || p.dead) return;
  S.auraT = (S.auraT || 0) - dt;
  if (S.auraT > 0) return;
  S.auraT = 0.25;
  const Z = S.z,
    R = 3 + S.hm.spB1;
  gridEach(S, p.x, p.z, R, i => {
    if (Z.st[i] === 0 || Z.fant[i] || Math.abs(Z.y[i] - p.y) > 2) return;
    if ((Z.x[i] - p.x) ** 2 + (Z.z[i] - p.z) ** 2 > R * R) return;
    Z.burn[i] = Math.max(Z.burn[i], 1.5);
    hurtZ(S, i, 3 * hpMul(S.day), 'p');
  });
}
// un tir part (finishP) : Mitrailleur, un de plus d'affilée
function voieTir(S) {
  S.p.rafN = (S.p.rafN || 0) + 1;
  S.p.rafT = 0;
}
// les coups reçus (hurtP) : Mage de bataille (spB2) −25 % ; Soigneuse, bouclier (p.boucl) qui absorbe d'abord ; renvoie ce qui reste
function voieCoup(S, d) {
  const p = S.p;
  if (voieDe(S, 'feu', 'b') && S.hm.spB2 > 0) d *= 0.75;
  if (p.boucl > 0) {
    const a = Math.min(p.boucl, d);
    p.boucl -= a;
    d -= a;
    if (p.boucl <= 0) p.boucT = 0;
  }
  return d;
}
// un zombie tué par le joueur (killZ, pas l'effet d'un invité) : Escarmoucheur, 2,5 % (+ spB1 / 10) de la recharge de l'Éclair rendus ;
// Plongeur (spB2) : le poison d'un empoisonné passe aux voisins à moins de 3 m (3 s)
function voieTue(S, i, own) {
  const Z = S.z;
  if (!own && voieDe(S, 'elec', 'b') && S.hab > 0)
    S.hab = Math.max(0, S.hab - (((HEROS.elec.cd * S.P.mis.cd) / 22) * (0.25 + S.hm.spB1)) / 10);
  if (voieDe(S, 'bois', 'b') && S.hm.spB2 > 0 && Z.psn[i] > 0)
    gridEach(S, Z.x[i], Z.z[i], 3, j => {
      if (j !== i && Z.st[j] !== 0 && Math.abs(Z.y[j] - Z.y[i]) < 2 && (Z.x[j] - Z.x[i]) ** 2 + (Z.z[j] - Z.z[i]) ** 2 < 9)
        Z.psn[j] = Math.max(Z.psn[j], 3);
    });
}

// Soigneuse, Bouclier d'eau : 30 de bouclier pendant 10 s (voieCoup l'use avant la vie)
function bouclier(S) {
  S.p.boucl = 30;
  S.p.boucT = 10;
  S.ev.push({ k: 'bouclier' });
}

// ---------------------------------------------------------------- les compétences
// Plongeur : les Ronces deviennent un bond vers le point visé a (8 m + spB1 au plus, arrêté par les murs, petit saut) ; à l'arrivée
// (le point visé s'il est à portée, sinon là où le bond s'arrête), un roncier de 3,5 m (4 s) et du poison 6 s, 30 × force, à moins de 3,5 m.
// bouge : faux chez l'hôte qui joue la compétence d'un invité (l'invité bouge chez lui) ; effet : faux chez l'invité (l'hôte s'en charge)
function plonge(S, a, m, pw, bouge, effet) {
  const p = S.p,
    Z = S.z,
    dx = a[0] - p.x,
    dz = a[2] - p.z,
    l = Math.hypot(dx, dz) || 1,
    L = 8 + m.spB1,
    ux = dx / l,
    uz = dz / l,
    va = Math.max(0, Math.min(L, l, rayWall(p.x, p.y + 0.55, p.z, ux, 0, uz, L + 0.45) - 0.45)),
    atteint = va >= l - 0.5,
    x1 = p.x + ux * va,
    z1 = p.z + uz * va,
    y1 = atteint ? a[1] : floorAt(x1, z1, p.y + 0.5),
    x0 = p.x,
    z0 = p.z;
  if (effet) {
    gridEach(S, x1, z1, 3.5, i => {
      if (Z.st[i] === 0 || Math.abs(Z.y[i] - y1) > 2.5 || (Z.x[i] - x1) ** 2 + (Z.z[i] - z1) ** 2 > 12.25) return;
      Z.psn[i] = Math.max(Z.psn[i], 6);
      hurtZ(S, i, 30 * pw, 'p');
    });
    S.thorns.push({ x: x1, y: y1, z: z1, r: 3.5 + m.abRad, t: 4 + m.kDur, dps: 22 * pw, pulse: 0 });
  }
  S.ev.push({ k: 'ronces', x: x1, y: y1, z: z1, r: 3.5 + m.abRad });
  if (bouge) {
    p.x = x1;
    p.z = z1;
    p.vx = ux * 4;
    p.vz = uz * 4;
    if (p.ground) {
      p.vy = 4;
      p.ground = false;
    }
    p.inv = 0.5;
    S.ev.push({ k: 'plonge', x0, z0, y: p.y, x1, y1, z1 });
  }
}
// Avant-garde : un rempart qui charge (wall.ch : mètres qui restent, à 14 m/s, vers l'extérieur) ; il pousse devant lui ce qu'il touche,
// le renverse (petits : 1,5 s à terre ; gros : ralentis) et le blesse une fois (wall.pris) ; spB2 (wall.onde) : à l'arrivée, une onde de
// 5 m renverse et blesse aussi ceux qu'il n'a pas touchés
function chargeRempart(S, wall, dt) {
  const Z = S.z,
    d = Math.min(wall.ch, 14 * dt);
  wall.x += wall.nx * d;
  wall.z += wall.nz * d;
  wall.ch -= d;
  const pris = wall.pris || (wall.pris = []),
    renverse = i => {
      if (bigZ(Z.ty[i])) Z.slow[i] = Math.max(Z.slow[i], 2);
      else Z.root[i] = Math.max(Z.root[i], 1.5);
      if (Z.st[i] === 5) {
        Z.st[i] = 1;
        Z.y[i] = 0;
      }
      if (!pris.includes(i)) {
        pris.push(i);
        hurtZ(S, i, wall.dg, 'p');
      }
    };
  gridEach(S, wall.x, wall.z, wall.half + 2, i => {
    if (!outside(Z, i) || Z.fant[i]) return;
    const side = (Z.x[i] - wall.x) * wall.nx + (Z.z[i] - wall.z) * wall.nz,
      along = (Z.x[i] - wall.x) * -wall.nz + (Z.z[i] - wall.z) * wall.nx;
    if (side < -1.2 || side > 1.3 || Math.abs(along) > wall.half + ZT[Z.ty[i]].r) return;
    // poussé devant le mur
    Z.x[i] = wall.x + wall.nx * 1.3 - wall.nz * along;
    Z.z[i] = wall.z + wall.nz * 1.3 + wall.nx * along;
    renverse(i);
  });
  if (wall.ch <= 0) {
    wall.ch = 0;
    if (wall.onde) {
      gridEach(S, wall.x, wall.z, 5, i => {
        if (outside(Z, i) && !Z.fant[i] && (Z.x[i] - wall.x) ** 2 + (Z.z[i] - wall.z) ** 2 < 25) renverse(i);
      });
      S.ev.push({ k: 'onde_roc', x: wall.x, z: wall.z, r: 5 });
    }
    wall.pris = null;
  }
}

// ---------------------------------------------------------------- l'ultime teinté
// l'élément qui teinte l'ultime du héros : celui de l'arme, s'il n'est pas l'élément choisi du héros (V5.2 : elH ; null sinon)
const teinteDe = (S, h) => (S.elArme && S.elArme !== elH(S) && ELKEYS.includes(S.elArme) ? S.elArme : null);
// hurtZ (chez l'hôte) pendant que l'ultime frappe (S.ultEl) : l'effet des balles de cet élément sur le zombie i, une fois par seconde
function teinte(S, i, dmg) {
  const el = S.ultEl,
    Z = S.z;
  if (!S.teintT || Z.st[i] === 0 || S.teintT[i] > S.t) return;
  S.teintT[i] = S.t + 1;
  S.ultEl = null;
  effetBalle(S, el, i, Math.min(dmg, 60 * hpMul(S.day)), Z.x[i], Z.y[i] + 1, Z.z[i], S.hm, 0);
  S.ultEl = el;
}
