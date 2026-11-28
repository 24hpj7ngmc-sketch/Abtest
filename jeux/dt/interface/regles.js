// regles.js — V4.2 : le Guide « Règles ». Le même personnage que le Guide du lobby (gfx/models/pnj.js, MODELS['pnj.guide'], dessiné par
// affichage/guide.js) se tient sur le toit, tout près du départ, sous une étiquette « RÈGLES » (mode « Ils s'échappent » seulement).
// À moins de 3,5 m de lui, le bouton « Règles » apparaît en haut à droite, comme « Boutique » à côté d'une boutique ; la grande carte a
// aussi sa ligne « Règles ». La fiche (#guideV) est rangée comme dans tous les jeux de Frédéric, cinq onglets dans cet ordre :
// Le but · Perdre · Commandes · Ce jeu · Ce que ça rapporte. La partie est en pause tant qu'elle est ouverte (comme l'arbre : running = false).
// Le bouton à gauche de « Retour » relance le tuto pas à pas (tutoriel.js) quand il peut partir (jour 1, avant de lancer le jour).
// Fournit : GUIDEP, GUIDER (où il se tient, à quelle distance le bouton apparaît : lus aussi par affichage/guide.js et la mini-carte),
//   guideNear, rulesBtn (appelé par uiTick), rulesOpen (bouton, grande carte), guideShow, CMDS, RULES_TOIT.
// Utilise des règles : H, ROADS, J1, dayCount, bossN, INV_DAY, invCap, NLV, HEROS, ELKEYS, ELNOM, ELFX, WKEYS, PLANKS_MAX, ZIPS, NODES, RELEVE (s'il existe) ;
// de l'interface : LOBBY (lobby.js), tutoPossible et tutoStart (tutoriel.js), openMap (carte.js) ; des sons : SND.
// Tout est lu dans des fonctions (les constantes des autres dossiers n'existent pas encore au chargement de l'interface).
// Les tests (tests/guidetest.js) appellent rulesOpen, guideNear, RULES_TOIT et lisent #bRules, #guideV, #guTabs, #guB, #guA, #guX.

// ---------------------------------------------------------------- où se tient le Guide
// sur le toit (à la hauteur H), à 4,5 m du départ du joueur (x 0, z −7, face au nord), sur sa gauche : vu du départ, son étiquette passe
// entre la mini-carte et le panneau du jour ; loin de la boutique, du château d'eau, de l'emplacement de tourelle « bord nord » (3 m),
// du poteau de la tyrolienne nord (6,5 m) et du bord du toit (2,6 m). Le bouton « Règles » apparaît à moins de GUIDER m.
const GUIDEP = { x: -3, z: -10.4 },
  GUIDER = 3.5;
// le joueur est-il près du Guide (sur le toit, à moins de GUIDER) ? mode fuite seulement
function guideNear() {
  if (!S || S.mode !== 'out') return false;
  const p = S.p;
  return Math.abs(p.y - H) < 1.3 && Math.hypot(p.x - GUIDEP.x, p.z - GUIDEP.z) < GUIDER;
}
// à chaque image (uiTick) : « Règles » n'apparaît qu'à côté du Guide, comme « Boutique » à côté d'une boutique
function rulesBtn() {
  const btn = $('bRules'),
    montre = running && guideNear() && S.phase !== 'dead' && S.phase !== 'won' && !S.p.clb && !S.p.zip;
  if (btn.hidden === montre) btn.hidden = !montre;
}

// ---------------------------------------------------------------- la fiche des règles (le même panneau qu'au lobby)
// guideShow(titre, onglets, i, bouton) : onglets = [[nom, [[titre de ligne, texte], …]], …] ; i : l'onglet ouvert ;
// bouton = [texte, fonction] facultatif, à gauche de « Retour »
let guTab = 0;
function guideShow(titre, onglets, i, bouton) {
  guTab = Math.max(0, Math.min(onglets.length - 1, i || 0));
  $('guT').textContent = titre;
  $('guTabs').innerHTML = onglets
    .map((T, k) => `<button class="tchip${k === guTab ? ' sel' : ''}" data-k="${k}">${T[0]}</button>`)
    .join('');
  $('guTabs')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          SND.play('click');
          guideShow(titre, onglets, +b.dataset.k, bouton);
        })
    );
  $('guB').innerHTML = onglets[guTab][1].map(R => `<div class="srow"><span><b>${R[0]}</b><small>${R[1]}</small></span></div>`).join('');
  $('guB').scrollTop = 0;
  const ba = $('guA');
  ba.hidden = !bouton;
  if (bouton) {
    ba.textContent = bouton[0];
    ba.onclick = bouton[1];
  }
  $('guideV').hidden = false;
}
// d'où la fiche a été ouverte : 'jeu' (bouton « Règles ») ou 'carte' (grande carte : « Retour » y ramène)
let guFrom = 'jeu';
// ouvrir la fiche (en partie, mode fuite) : la partie se met en pause, comme dans l'arbre
function rulesOpen(depuis) {
  if (!running || !S || S.mode !== 'out') return;
  guFrom = depuis === 'carte' ? 'carte' : 'jeu';
  $('mapV').hidden = true;
  running = false;
  if (guFrom === 'jeu') SND.play('click');
  guideShow(
    'Règles · Dernier Toit',
    RULES_TOIT(),
    0,
    tutoPossible()
      ? [
          'Tuto pas à pas',
          () => {
            guFrom = 'jeu';
            rulesClose();
            tutoStart();
          }
        ]
      : null
  );
}
// « Retour » : la partie reprend (ou la grande carte revient, si on venait d'elle)
function rulesClose() {
  $('guideV').hidden = true;
  running = true;
  if (guFrom === 'carte') openMap();
}
$('guX').onclick = () => {
  SND.play('click');
  rulesClose();
};
$('bRules').addEventListener('click', () => {
  if (!ov()) rulesOpen('jeu');
});

// ---------------------------------------------------------------- le contenu
// les commandes sont les mêmes partout (décision du 17/11) : le texte commun à tous les jeux, repris tel quel
const CMDS = [
  [
    'Bouger et regarder',
    "Pouce gauche : le joystick, poussé à fond vers l'avant pour sprinter. Pouce droit : glisse sur l'écran pour tourner la tête."
  ],
  ['Le bouton du coin', "En bas à droite, coupé en deux : Action en bas (tirer, poser, ouvrir, selon l'outil en main), Saut en haut."],
  [
    'Les petits boutons',
    "Le long de l'arc : Sneak (un appui), Compétence et Ultime (deux appuis rapprochés). Le bouton libre, en bas, change selon la situation : Viser, Améliorer, Renfort…"
  ],
  ["La barre d'outils", "En bas au milieu : elle s'efface quand tu ne t'en sers pas et revient au toucher."],
  ['La carte', 'En haut à gauche. Touche-la pour la grande carte et les réglages (son, mode de tir, saut auto, abandon).']
];
// ce qui diffère ici du texte commun (commandes.js, hud.js, carte.js)
const CMDS_TOIT = [
  [
    'Sur le toit : les boutons',
    "Action tire, frappe, pose, cloue ou lance, selon l'outil. Le bouton libre sert à Viser (fusil, un appui) et à Retirer une tourelle (marteau, deux appuis) ; Saut devient Grimper, Descendre, Tyrolienne ou Lâcher au bon endroit."
  ],
  [
    'Sur le toit : les réglages',
    "La grande carte règle le son, le tir auto sur cible, la vitesse de la caméra et le mode dev ; elle rouvre ces règles et permet d'abandonner. Pas de saut auto ici."
  ]
];
// les gains du lobby (c'est le lobby qui les paie, d'après le message « fin » : voir LOBBY.md) : à tenir à jour avec lui
// or, ecl : or céleste et éclats par tranche de « tranche » secondes de jeu ; …Boss : par mastodonte ; …Win : secouru ;
// rangs : gains par rang de difficulté (1 à 4) ; vie : vie des zombies par rang
const GAINS_LOBBY = {
  or: 10,
  ecl: 20,
  tranche: 45,
  orBoss: 40,
  eclBoss: 50,
  orWin: 200,
  eclWin: 150,
  rangs: [1, 1.25, 1.5, 2],
  vie: [1, 1.35, 1.8, 2.4]
};
// les cinq onglets, refaits à chaque ouverture (les chiffres viennent des tables du jeu : ils suivent si on les change)
function RULES_TOIT() {
  const JOURS = 10, // regles/partie.js : l'hélicoptère vient après le jour 10
    nb = n => Math.round(n).toLocaleString('fr-FR'),
    x = v => '×' + String(v).replace('.', ','),
    releve = typeof RELEVE === 'number' ? RELEVE : 8,
    hero = HEROS[S && S.hero] || HEROS.feu,
    besoin = Math.round(S ? S.P.onde.need : 150),
    avenues = ROADS.filter(r => r.wall),
    ruelles = ROADS.filter(r => !r.wall),
    jourDe = l => [Math.min(...l.map(r => r.day)), Math.max(...l.map(r => r.day))];
  let jBoss = 1,
    jToit = INV_DAY;
  while (jBoss < JOURS && !bossN(jBoss)) jBoss++;
  while (jToit < 30 && invCap(jToit) < NLV) jToit++;
  const [a0, a1] = jourDe(avenues),
    [r0, r1] = jourDe(ruelles),
    G = GAINS_LOBBY;
  return [
    [
      'Le but',
      [
        [
          'Arrête la horde',
          "Chaque jour, la horde sort de l'immeuble sous tes pieds et fuit par les rues. Depuis le toit, abats-les avant qu'ils ne s'échappent."
        ],
        [
          'Tiens ' + JOURS + ' jours',
          'Le jour ' + JOURS + " tenu, l'hélicoptère vient te chercher : rejoins son aire, le cercle jaune du toit."
        ],
        [
          'Jour après jour',
          'Rien ne presse entre deux jours : la horde ne sort que quand tu touches « Lancer le jour », en haut. Elle grossit : ' +
            nb(J1.n) +
            ' zombies le jour 1, ' +
            nb(dayCount(JOURS)) +
            ' le jour ' +
            JOURS +
            '.'
        ],
        [
          'Et après',
          'Secouru, tu peux continuer sans fin : on repart au jour ' +
            (JOURS + 1) +
            ', la horde grossit encore chaque jour, sans hélicoptère.'
        ]
      ]
    ],
    [
      'Perdre',
      [
        ['La ville', "Chaque zombie qui s'échappe abîme la jauge Ville (en haut) ; à zéro, la partie est finie."],
        [
          'Toi',
          'Si tu tombes, tu te relèves tout seul sur le toit au bout de ' +
            releve +
            ' secondes : tu ne perds pas la partie, mais la horde file pendant ce temps.'
        ],
        ["Rien n'est perdu", "Ton argent est gardé d'une partie à l'autre ; l'arbre de l'immeuble te fait repartir plus fort."]
      ]
    ],
    ['Commandes', CMDS.concat(CMDS_TOIT)],
    [
      'Ce jeu',
      [
        [
          "Les rues s'ouvrent",
          'Une avenue de plus chaque jour (' +
            avenues.map(r => r.n).join(', ') +
            ', jours ' +
            a0 +
            ' à ' +
            a1 +
            '), puis une ruelle par jour, du jour ' +
            r0 +
            ' au jour ' +
            r1 +
            '.'
        ],
        [
          'Tes tourelles',
          'Marteau en main : vise un cercle blanc, puis Action. Ton plan est gardé ; le jour 1 se joue sans tourelle, elles arrivent au jour 2.'
        ],
        [
          'Les boutiques',
          "Une sur le toit, une au rez-de-chaussée : « Boutique » n'apparaît qu'à côté, et c'est seulement là qu'on achète les améliorations."
        ],
        [
          'Ton héros',
          hero.n +
            ', ' +
            hero.role +
            ' (' +
            // V5.2 : l'élément choisi
            (S && S.hero ? ELNOM[elH(S)] : hero.el) +
            '). Un passif (' +
            hero.pas.charAt(0).toLowerCase() +
            hero.pas.slice(1) +
            '), une compétence (' +
            hero.sk +
            ' : deux appuis, puis une recharge) et un ultime (' +
            hero.ul +
            ') qui se charge à chaque zombie abattu : il en faut ' +
            besoin +
            '.' +
            // V4.9 : sa voie (lobby) ; l'ultime teinté par l'élément de l'arme
            (S && S.voie && VOIES[S.hero] ? ' Ta voie, ' + VOIES[S.hero][S.voie].n + ' : ' + VOIES[S.hero][S.voie].d + '.' : '') +
            " Avec une arme d'un autre élément, l'ultime en prend l'effet."
        ],
        [
          'Les armes et leurs éléments',
          WKEYS.length +
            " armes au choix : fusil en main, change d'arme dans la petite barre au-dessus des outils. La branche Fusil de l'arbre les renforce toutes. " +
            "Tes balles prennent l'élément de ton arme (au menu, ou celui choisi au lobby ; sinon celui de ton héros), plus l'effet du héros. " +
            ELKEYS.map(e => ELNOM[e] + ' : elles ' + ELFX[e]).join(' ; ') +
            // V5.2 : l'élément choisi du héros
            ". Arme de l'élément choisi pour ton héros" +
            (S && S.hero ? ' (' + ELNOM[elH(S)] + ')' : '') +
            ' : +10 % de dégâts.'
        ],
        [
          "Dans l'immeuble",
          'Dès le jour ' +
            INV_DAY +
            ', une partie de la horde monte dans les étages (le toit au jour ' +
            jToit +
            ") ; le chiffre « Dedans », en haut, dit combien sont entrés. Marteau sur une porte : maintiens Action pour clouer jusqu'à " +
            PLANKS_MAX +
            ' planches ; la Masse, à débloquer, casse les cloisons.'
        ],
        [
          'Escalade, tyroliennes et grappin',
          "Au bord du toit ou d'un balcon, regarde en bas et touche Saut : tu passes au balcon du dessous, ou à la rue (regarde en haut pour remonter). Avec la case Tyrolienne, au poteau du bord du toit, Saut devient « Tyrolienne » : " +
            ZIPS.length +
            ' câbles filent vers les passerelles des avenues. Le Grappin (après la Tyrolienne) est un outil : vise un balcon, le toit, une passerelle ou la rue, touche Action, et il te tire jusque-là.'
        ],
        [
          'Zombies à part',
          "Le sprinteur fonce vers la sortie, le casseur arrache les planches, le porteur emporte un sac d'argent (gros butin), le hurleur accélère ses voisins. Des mastodontes dès le jour " +
            jBoss +
            '.'
        ],
        [
          'Leurre et frappe aérienne',
          "Deux objets à débloquer dans l'arbre, pour le jour : le leurre attire la horde au sol, la frappe lâche une ligne de bombes le long de la rue visée."
        ]
      ]
    ],
    [
      'Ce que ça rapporte',
      [
        [
          'Ton argent',
          "Chaque zombie abattu rapporte des $ (le double si c'est toi qui l'abats), chaque jour tenu une prime. Cet argent est gardé d'une partie à l'autre ; il paie l'arbre de l'immeuble (" +
            NODES.filter(n => n.id !== 'root').length +
            ' cases), aux boutiques.'
        ]
      ].concat(
        typeof LOBBY !== 'undefined' && LOBBY
          ? [
              [
                'Pour ton île',
                G.or +
                  ' or céleste et ' +
                  G.ecl +
                  ' éclats de ton héros par tranche de ' +
                  G.tranche +
                  ' secondes de jeu environ, +' +
                  G.orBoss +
                  ' et +' +
                  G.eclBoss +
                  ' par mastodonte abattu, +' +
                  G.orWin +
                  ' et +' +
                  G.eclWin +
                  ' si tu es secouru.'
              ],
              [
                'Plus dur, mieux payé',
                'Rangs 1 à ' +
                  G.rangs.length +
                  ' : gains ' +
                  G.rangs.map(x).join(' · ') +
                  ' ; zombies plus résistants à chaque rang (vie ' +
                  G.vie.map(x).join(' · ') +
                  ').'
              ],
              ['Le butin', "Secouru, tu gagnes une Relique et l'Étoile de ton héros."],
              ['Ton village', 'Chaque partie finie remplit les réserves de tes bâtiments.']
            ]
          : [
              [
                'Depuis le lobby',
                "Joué depuis le lobby (deuxième portail), chaque partie rapporte aussi de l'or céleste et des éclats pour ton île."
              ]
            ]
      )
    ]
  ];
}
