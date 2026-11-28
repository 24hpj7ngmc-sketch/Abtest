// [interface/roles.js] La refonte « rôles des héros, éléments sur les armes » (V12.1, claude/refonte-roles-elements.md) : six héros, six rôles, six éléments.
// ---------- Le rôle, c'est qui tu es ; l'élément, c'est comment tu frappes. Un héros se reconnaît toujours à sa clé (Braise = 'feu'…), qui reste son identité ; son élément se choisit (V12.9, elH)
// (Braise = 'feu', Sylve = 'bois'…) ; Zéphyr ('vent') est le sixième. Tout ceci est au lobby : un mini-jeu ne connaît Zéphyr, le Vent et l'élément par arme
// que lorsqu'il l'annonce (demandes claude/demande-<jeu>-roles-elements.md). ELS reste la liste des cinq éléments que connaissent les jeux collés.
EL.bois.n = 'Nature';
EL.vent = { n: 'Vent', c: '#8fe6dc', hero: 'Zéphyr' };
KIT.vent = { skill: 'Bond', ult: 'Tir perçant', tag: 'Tireur · Bond · Tir perçant' };
const HEROS = ELS.concat('vent'),
  ROLE = { terre: 'Tank', bois: 'Combattant', elec: 'Assassin', feu: 'Mage', eau: 'Support', vent: 'Tireur' },
  // la boucle des faiblesses à six, telle que la fiche la fixe (chacun bat le suivant) ; les jeux collés appliquent encore la leur (BEATS, à cinq)
  BOUCLE = ['eau', 'feu', 'bois', 'vent', 'terre', 'elec'],
  // le passif de chaque héros, en une ligne, pour le Hall
  PASSIF = {
    terre: 'encaisse mieux les coups au contact',
    bois: 'ses tirs empoisonnent',
    elec: 'ses tirs sautent sur un voisin',
    feu: 'ses tirs éclaboussent autour de la cible',
    eau: 'se soigne en continu',
    vent: 'frappe plus fort de loin'
  },
  heroTag = e => KIT[e].skill + ' · ' + KIT[e].ult;
// un jeu collé accepte-t-il ce héros ? Il le dit dans sa liste HEROS ; sans liste, il ne connaît que les cinq premiers
const jeuHeros = (J, e) => (J && Array.isArray(J.HEROS) ? J.HEROS.includes(e) : ELS.includes(e));
// LES SPÉCIALISATIONS (V12.2) : deux voies par héros, à choisir au Hall à partir du niveau VOIE_NIV. Le kit de base ne change pas, la voie le modifie, partout ;
// chaque voie ouvre sa propre branche dans l'arbre du héros (deux cases : [nom, niveaux, prix, bonus, valeur par niveau, affichage, case finale ?]).
// Les effets se jouent dans les mini-jeux, qui reçoivent la voie et ses cases ; noms des voies : la fiche ; chiffres : premier jet du lobby.
const VOIE_NIV = 10,
  VOIES = {
    terre: {
      a: {
        n: 'Gardien',
        d: 'le Rempart devient un grand bouclier qui protège les alliés derrière lui',
        c: [
          ['Bouclier élargi', 3, 90, 'spA1', 1, L => 'protège ' + (2 + L) + ' m derrière le Rempart'],
          ['Rempart renvoyeur', 1, 250, 'spA2', 1, L => (L ? 'renvoie une part des coups reçus' : 'ne renvoie rien'), 1]
        ]
      },
      b: {
        n: 'Avant-garde',
        d: 'le Rempart devient une charge qui renverse',
        c: [
          ['Élan de la charge', 3, 90, 'spB1', 2, L => 'charge sur ' + (6 + 2 * L) + ' m'],
          [
            'Onde de choc',
            1,
            250,
            'spB2',
            1,
            L => (L ? "renverse aussi autour du point d'arrivée" : 'ne renverse que sur le passage'),
            1
          ]
        ]
      }
    },
    bois: {
      a: {
        n: 'Colosse',
        d: 'beaucoup de vie, se soigne au contact',
        c: [
          ['Vie du Colosse', 3, 90, 'spA1', 25, L => '+' + 25 * L + ' PV'],
          ['Sève', 1, 250, 'spA2', 1, L => (L ? 'se soigne en frappant au contact' : 'ne se soigne pas au contact'), 1]
        ]
      },
      b: {
        n: 'Plongeur',
        d: 'bondit sur sa cible, son poison se propage',
        c: [
          ['Portée du bond', 3, 90, 'spB1', 2, L => "bondit jusqu'à " + (8 + 2 * L) + ' m'],
          [
            'Poison contagieux',
            1,
            250,
            'spB2',
            1,
            L => (L ? 'le poison passe aux voisins' : 'le poison reste sur la cible'),
            1
          ]
        ]
      }
    },
    elec: {
      a: {
        n: 'Lame',
        d: 'un énorme coup sur une cible isolée',
        c: [
          ['Coup de grâce', 3, 90, 'spA1', 0.2, L => '+' + 20 * L + ' % sur une cible isolée'],
          ['Exécution', 1, 250, 'spA2', 1, L => (L ? 'achève les cibles sous 15 % de vie' : "n'achève pas"), 1]
        ]
      },
      b: {
        n: 'Escarmoucheur',
        d: 'chaque élimination recharge sa compétence',
        c: [
          ['Recharge sur élimination', 3, 90, 'spB1', 0.15, L => 'rend ' + (25 + 15 * L) + ' % de la recharge'],
          [
            'Enchaînement',
            1,
            250,
            'spB2',
            1,
            L => (L ? 'une élimination pendant la Fulgurance le relance' : 'pas de relance'),
            1
          ]
        ]
      }
    },
    feu: {
      a: {
        n: 'Artilleur',
        d: 'très longue portée, zones en feu au sol',
        c: [
          ["Portée d'artillerie", 3, 90, 'spA1', 5, L => '+' + 5 * L + ' m de portée'],
          ['Sol en feu', 1, 250, 'spA2', 1, L => (L ? 'les zones restent en feu 4 s' : "le feu s'éteint aussitôt"), 1]
        ]
      },
      b: {
        n: 'Mage de bataille',
        d: 'au cœur de la mêlée, une aura qui brûle autour',
        c: [
          ['Aura brûlante', 3, 90, 'spB1', 1, L => 'brûle à ' + (3 + L) + ' m autour'],
          [
            'Braises protectrices',
            1,
            250,
            'spB2',
            1,
            L => (L ? "l'aura réduit les coups reçus" : 'aucune protection'),
            1
          ]
        ]
      }
    },
    eau: {
      a: {
        n: 'Soigneuse',
        d: 'soins et boucliers renforcés',
        c: [
          ['Soins renforcés', 3, 90, 'spA1', 0.15, L => '+' + 15 * L + ' % de soin'],
          [
            "Bouclier d'eau",
            1,
            250,
            'spA2',
            1,
            L => (L ? 'la Répulsion pose un bouclier sur les alliés' : 'pas de bouclier'),
            1
          ]
        ]
      },
      b: {
        n: 'Entraveuse',
        d: 'piège et immobilise',
        c: [
          ['Durée du piège', 3, 90, 'spB1', 0.5, L => 'immobilise ' + f(1.5 + 0.5 * L, 1) + ' s'],
          [
            'Lame de fond',
            1,
            250,
            'spB2',
            1,
            L => (L ? 'le Sanctuaire immobilise à son arrivée' : "le Sanctuaire n'immobilise pas"),
            1
          ]
        ]
      }
    },
    vent: {
      a: {
        n: 'Sniper',
        d: 'des dégâts énormes de très loin',
        c: [
          ['Tir lointain', 3, 90, 'spA1', 0.1, L => '+' + 10 * L + ' % au-delà de 40 m'],
          ['Tir chargé', 1, 250, 'spA2', 1, L => (L ? "un tir chargé perce l'armure" : 'pas de tir chargé'), 1]
        ]
      },
      b: {
        n: 'Mitrailleur',
        d: 'tir rapide, bonus en courant',
        c: [
          ['Cadence en course', 3, 90, 'spB1', 0.08, L => '+' + 8 * L + ' % de cadence en courant'],
          ['Tir continu', 1, 250, 'spB2', 1, L => (L ? "la cadence monte tant qu'il tire" : 'cadence fixe'), 1]
        ]
      }
    }
  };
