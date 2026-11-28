// [interface/guide.js] Le Guide partout : le panneau commun (#guideV), la fiche « Règles » de L'Île des Cinq et ses cinq onglets, le Guide près du cœur.
// deux mémoires de la boucle d'affichage (interface/boucle.js) : le marchand est-il à portée, et les points du joueur à la dernière image
let shopNear = false,
  lastPts = 0;
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
// les commandes sont les mêmes partout (décision du 17/11) : un seul texte, repris par chaque fiche
const CMDS = [
  [
    'Bouger et regarder',
    "Pouce gauche : le joystick, poussé à fond vers l'avant pour sprinter. Pouce droit : glisse sur l'écran pour tourner la tête."
  ],
  [
    'Le bouton du coin',
    "En bas à droite, coupé en deux : Action en bas (tirer, poser, ouvrir, selon l'outil en main), Saut en haut."
  ],
  [
    'Les petits boutons',
    "Le long de l'arc : Sneak (un appui), puis Compétence, Ultime et Renfort (deux appuis rapprochés). Le bouton libre, en bas, change selon la situation : Viser, Auto, Boutique…"
  ],
  ["La barre d'outils", "En bas au milieu : elle s'efface quand tu ne t'en sers pas et revient au toucher."],
  [
    'La carte',
    'En haut à gauche. Touche-la pour la grande carte et les options (mode de tir, saut auto, boutiques, règles, abandon).'
  ]
];
// le barème du lobby, pour l'onglet « Ce que ça rapporte » : le lobby le donne à l'ouverture (LOBBY.gains) ; à défaut, celui du 23/11/2026
const GAINS = Object.assign(
    { or: 10, ecl: 20, orBoss: 40, eclBoss: 50, orWin: 200, eclWin: 150, rangs: [1, 1.25, 1.5, 2] },
    LOBBY.gains && typeof LOBBY.gains === 'object' ? LOBBY.gains : {}
  ),
  PAYK = Array.isArray(GAINS.rangs) && GAINS.rangs.length >= 4 ? GAINS.rangs : [1, 1.25, 1.5, 2],
  pct = k => '×' + String(Math.round(k * 100) / 100).replace('.', ',');
const RULES = {
  ile: () => [
    [
      'Le but',
      [
        [
          "Protège le cœur de l'île",
          "Les ennemis surgissent de la mer tout autour de l'île, un par un et mêlés, puis marchent vers le cœur. Tiens " +
            BALN.waves +
            ' vagues en Normal, ' +
            BAL.waves +
            ' en Difficile.'
        ],
        [
          'Les boss',
          'Un boss aux vagues 5, 10 et 15, le Big Boss à la dernière. En campagne, chaque type a aussi son attaquant spécial : Incendiaire (Feu), Soigneur (Eau), Brouilleur (Élec), Golem (Terre), Semeur (Nature), Tourbillon (Vent, il pousse ses voisins vers le cœur).'
        ],
        [
          'Entre deux vagues',
          "La caméra monte dans le ciel : l'aperçu annonce ce qui arrive et de quel côté (vague 1 : une moitié de la côte, vague 2 : les trois quarts, ensuite de partout). Pose, améliore, mure et creuse au doigt. La vague part au bout de " +
            CIEL.prepT +
            ' s, ou plus tôt quand tout le monde a touché « Prêt ». Avant la première vague, pas de chrono.'
        ]
      ]
    ],
    [
      'Perdre',
      [
        [
          'Le cœur',
          "Chaque ennemi qui l'atteint lui retire 1 point de vie, un boss beaucoup plus. À zéro, la partie est finie."
        ],
        [
          'Ton héros',
          "S'il tombe, il se relève tout seul au bout de " +
            BAL.respawn +
            ' secondes : tu ne perds pas la partie, seulement du temps.'
        ],
        ["Rien n'est perdu", "Même battu, tu rapportes de l'or céleste et des éclats pour les vagues repoussées."]
      ]
    ],
    ['Commandes', CMDS],
    [
      'Ce jeu',
      [
        [
          'Six éléments',
          'Eau bat Feu, Feu bat Nature, Nature bat Vent, Vent bat Terre, Terre bat Élec, Élec bat Eau : ×' +
            String(BAL.strong).replace('.', ',') +
            " de dégâts. Dans l'autre sens : ×0,75. Contre son propre élément : normal. Une arme de l'élément de ton héros" +
            (sim && sim.hero
              ? ' (' + EL[elOf(sim.hero)].n + ', celui que tu as choisi : sa prédilection)'
              : ' (sa prédilection)') +
            ' : +' +
            Math.round(BAL.predi * 100) +
            ' %.'
        ],
        [
          'Les ennemis',
          "Chacun a un rôle et un élément. Le rôle fait ce qu'il fait : le Combattant marche et frappe, le Tank encaisse et attire les tirs des défenses, l'Assassin (Furtif, Éclat) fonce sur un héros proche, le Tireur (Aérien) et le Mage tirent de loin, le Support aide les autres. L'élément ne fait que sa faiblesse."
        ],
        [
          'Voie et ultime',
          "La voie choisie au Hall des héros modifie le kit (par exemple, le Rempart de Roc devient une charge en Avant-garde). L'ultime gagne l'effet de l'élément de l'arme en main : le Séisme avec une arme de Feu brûle, avec une arme d'Eau ralentit."
        ],
        [
          'Le marteau',
          "Pose une défense (mortier, canon ou archer) au bord d'un chemin et donne-lui un élément avec la roulette. Chaque défense monte jusqu'au niveau " +
            MAXLV +
            '.'
        ],
        [
          'La pelle',
          "Trace un mur ou une fosse, en deux points : Action pour le point A, encore Action pour le point B. Un mur ne ferme jamais l'île : un quart de la côte doit toujours mener au cœur."
        ],
        [
          'La vue du ciel',
          "Entre deux vagues, nord en haut comme la mini-carte. Outil Défense : touche le sol pour poser, une défense pour l'améliorer, puis choisis l'élément sur la roulette qui s'ouvre à cet endroit. Outils Mur et Fosse : glisse du doigt de A à B. Un doigt fait glisser la vue (outil Défense), deux doigts la déplacent et pincent pour zoomer. Les boutiques sont en bas à gauche, les règles en haut à droite. Seul, deux appuis sur « Prêt » lancent la vague."
        ],
        [
          'Tes armes',
          "Au début de la partie, tu choisis jusqu'à 3 armes et un élément pour chacune : c'est l'élément de tes balles. Tu passes de l'une à l'autre dans la barre du bas. Ton tir marque aussi sa cible : tes défenses lui font " +
            Math.round(BAL.markK * 100) +
            ' % de dégâts en plus pendant ' +
            BAL.markT +
            ' secondes.'
        ],
        [
          "Le marchand d'armes",
          "Son étal est près du cœur (« ARMES »), et dans la vue du ciel c'est le bouton « Armes », en bas à gauche. Avec l'or de l'équipe, il améliore l'arme que tu tiens, pour toi seul : dégâts, cadence, critiques, tirs multiples, balles explosives, perforantes, ricochet, chaîne électrique, brûlure. Tout repart à zéro à la fin de la partie."
        ],
        [
          "L'or de la partie",
          "Tu le gagnes en tuant toi-même ; il paie défenses, murs, fosses, esclaves et le marchand d'armes, et ne sort pas de la partie. En Normal, ce que tuent les défenses remplit un pot commun qui bâtit tout seul."
        ],
        [
          'Près du cœur',
          "Le marchand (améliorations de la partie, payées en points de vague), le marchand d'armes, le marchand d'esclaves (des héros qui se battent avec toi), et moi."
        ],
        [
          'Les navires',
          "La flotte ennemie croise au large : personne n'en débarque, mais ses canons mettent parfois une défense en panne quelques secondes. Les ennemis, eux, surgissent de la mer n'importe où sur la côte."
        ],
        [
          'Renfort',
          "Deux appuis sur le bouton Renfort, en haut de l'arc : trois défenses gratuites de ton élément, toutes les " +
            SUMCD +
            ' secondes. Elles seules peuvent être détruites, et laissent une ruine.'
        ],
        [
          'Les bonus',
          'Certains ennemis en lâchent un : or double, coup fatal, frénésie, bombe, plein pouvoir, charpentier. Marche dessus.'
        ]
      ]
    ],
    [
      'Ce que ça rapporte',
      [
        [
          'Or céleste et éclats',
          'Pour ton île : ' +
            GAINS.or +
            ' or céleste et ' +
            GAINS.ecl +
            ' éclats de ton héros par niveau de vague repoussée (35 à la vague 20), +' +
            GAINS.orBoss +
            ' et +' +
            GAINS.eclBoss +
            ' par boss, +' +
            GAINS.orWin +
            ' et +' +
            GAINS.eclWin +
            ' pour la victoire.'
        ],
        [
          'Plus dur, mieux payé',
          'Campagne : niveau 2 ' +
            pct(PAYK[1]) +
            ', niveau 3 ' +
            pct(PAYK[2]) +
            ', niveau 4 ' +
            pct(PAYK[3]) +
            ". Difficile : ×1,5. La maison augmente l'or, le hall les éclats."
        ],
        [
          'Le butin',
          "Une victoire donne la Couronne (Normal) ou le Sceau (Difficile), et l'Étoile de ton héros la première fois. Les objectifs de vague peuvent donner une relique."
        ],
        [
          'Ton village',
          "Chaque partie finie remplit les réserves de tes bâtiments : à ramasser en passant devant, de retour sur l'île."
        ]
      ]
    ]
  ]
};
// le Guide en partie : il se tient près du cœur (RULEP, affichage/decor.js). On s'approche, le bouton « Règles » apparaît en haut à droite, sous « Esclaves ».
// Au tout début d'une partie (avant la première vague), il propose aussi le tuto pas à pas.
let rulesNear = false;
function rulesOpen() {
  if (!running) return;
  if (!rulesNear) {
    toast("Le Guide t'attend près du cœur, sous son chapeau doré");
    return;
  }
  rulesShow();
}
// la fiche, d'où qu'on l'ouvre : près du Guide, depuis le ciel (bouton « Règles »), depuis les options de la carte (audit écran n° 6)
function rulesShow() {
  if (!running) return;
  $('mapV').hidden = true;
  SND.play('tick');
  guideShow(
    "Règles · L'Île des Cinq",
    RULES.ile(),
    0,
    !tuto && !sim.client && sim.wave === 0 && sim.phase === 'prep'
      ? [
          'Tuto pas à pas',
          () => {
            $('guideV').hidden = true;
            tutoStart();
          }
        ]
      : null
  );
}
$('bRules').onpointerdown = rulesOpen;
// le marchand d'esclaves : son étal est près du cœur (HIREP, dans affichage/decor.js). On s'approche, le bouton « Esclaves » apparaît en haut à droite, sous « Marchand ».
let hireNear = false;
function hireDraw() {
  const L = hiredOf(sim),
    c = hireCost(sim),
    full = L.length >= HIREMAX;
  $('hireG').textContent = sim.gold;
  $('hireT').textContent =
    'Un esclave se bat à tes côtés comme un bot : il garde un chemin, tire, ramasse les bonus' +
    (sim.botBuild !== false
      ? ', bâtit et améliore des défenses, creuse des fosses et monte des murs avec ' +
        (sim.mode === 'normal' ? 'le pot commun (pas ton or)' : 'ton or')
      : '') +
    ". S'il tombe, il est perdu : reviens en racheter un. " +
    L.length +
    ' / ' +
    HIREMAX +
    ' en vie.';
  $('hireB').innerHTML = ELS.filter(e => e !== sim.hero.el)
    .map(e => {
      const have = L.some(o => o.el === e),
        why = have ? 'en vie' : full ? 'complet' : sim.gold < c ? 'il manque ' + (c - sim.gold) + ' or' : '';
      return `<div class="hr" style="--c:${EL[e].c}"><span><b>${EL[e].hero}</b> · ${EL[e].n}<small>${KIT[e].skill} · ${KIT[e].ult}</small></span>${why ? `<span class="tchip${have ? ' sel' : ''}">${why}</span>` : `<button class="solid" data-e="${e}">Acheter · ${c} or</button>`}</div>`;
    })
    .join('');
  $('hireB')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          if (sim.client) {
            toast("Seul l'hôte de la partie peut acheter");
            return;
          }
          const e = b.dataset.e,
            a = Math.atan2(HIREP[1], HIREP[0]) + (hiredOf(sim).length - 1.5) * 0.5,
            o = hire(sim, e, heroMods(e), HIREP[0] + Math.cos(a) * 3.2, HIREP[1] + Math.sin(a) * 3.2);
          if (o) SND.play('coin');
          hireDraw();
        })
    );
  $('hireW').textContent = 'Ils bâtissent : ' + (sim.botBuild !== false ? 'oui' : 'non');
}
function hireOpen() {
  if (!running) return;
  if (!hireNear) {
    toast("Le marchand d'esclaves t'attend près du cœur");
    return;
  }
  $('mapV').hidden = true;
  $('hireV').hidden = false;
  hireDraw();
}
$('bHire').onpointerdown = hireOpen;
$('hireX').onclick = () => {
  $('hireV').hidden = true;
};
$('hireW').onclick = () => {
  dev.botBuild = sim.botBuild === false;
  sim.botBuild = dev.botBuild;
  hireDraw();
};
let fovNow = 72,
  hurtF = 0,
  perfT = 0,
  perfN = 0,
  gfxLv = 2;
