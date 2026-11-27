# Brancher un mini-jeu au lobby : le contrat commun

Écrit le 23 novembre 2026 par la conversation du lobby (Abtest. V10.8), mis à jour le soir même (V11.0 : L'Île des Cinq a sa propre conversation et suit ce contrat ; son `LOBBY.md` est un second modèle, pour un jeu qui ne garde aucune sauvegarde). À lire par toute conversation qui fabrique un mini-jeu du projet Jv.

## L'organisation (décision de Frédéric, 23/11)
- **Une conversation pour le lobby** (l'Île céleste) : elle branche tous les mini-jeux, tient la progression permanente (héros, armes, village), la paie, le multi entre téléphones.
- **Une conversation par mini-jeu** : elle fabrique son jeu et le livre sous la forme d'un seul fichier à coller.
- Les conversations ne se parlent pas. **Frédéric fait le messager**, avec des fiches dans le projet Jv :
  - `claude/<jeu>-fabrication.md` : la fiche de reprise du mini-jeu (où sont ses pages, où il en est) ;
  - `claude/demande-<jeu>-<sujet>.md` : ce que l'un demande à l'autre ; `claude/reponse-<jeu>-<sujet>.md` : la réponse, avec le fichier à recoller (version, taille, sha256).
- Le lobby ne modifie jamais le fichier d'un mini-jeu ; un mini-jeu ne modifie jamais le lobby. Un changement du contrat se demande par fiche.

## Où en sont les jeux
| Jeu | Conversation | État |
|---|---|---|
| L'Île céleste (lobby) | celle du lobby (`claude/ile-des-cinq-fabrication.md`) | V12.6 : sa page ne contient plus aucune règle de mini-jeu ; elle lit dans `IleDesCinq.tables` les chiffres du jeu qu'elle affiche |
| L'Île des Cinq (tower defense) | la sienne depuis le 23/11 (`claude/ile-jeu-fabrication.md`) | branchée, V2.2 (collée dans le lobby V12.6 ; Zéphyr, élément par arme, boucle à six, voies, ultime teinté, campagne à six colonnes ; 3 armes au début, vue du ciel entre les vagues), multi ; fichier `ile-pour-lobby.js`, variable `IleDesCinq` |
| Dernier Toit (zombies) | la sienne (`claude/dernier-toit-fabrication.md`) | branché, V4.9 (collé dans le lobby V12.5 ; Zéphyr, l'élément de l'arme, les voies et l'ultime teinté y jouent ; écran au modèle de L'Île des Cinq V1.2), multi |
| Percée Céleste (trois voies, façon LoL) | la sienne (`claude/percee-fabrication.md`) | V1.1 prête, pas encore branchée (`claude/demande-percee-branchement.md`) |
| La Ruée des Reliques | la sienne (`claude/reliques-fabrication.md`) | pas branchée ; à mettre à ce contrat |

**Refonte en cours (27/11) : six héros avec un rôle, Zéphyr et le Vent, un élément par arme, spécialisations, ultime teinté.** Le lobby est prêt (V12.2) ; ce que chaque jeu doit lire et faire est dans `claude/refonte-roles-contrat.md`, la demande propre à chaque jeu dans `claude/demande-<jeu>-roles-elements.md`.

## Ce que livre un mini-jeu
1. **Un seul fichier `<jeu>-pour-lobby.js`**, collé tel quel dans la page du lobby. Le jeu tourne dans un cadre (iframe) par-dessus l'île : ses noms, ses styles et sa 3D ne touchent pas ceux du lobby.
   - Une seule variable globale, au nom du jeu (exemple : `DernierToit`).
   - Aucun `</script` dans le fichier. Seules adresses extérieures permises : three.js r128 sur cdnjs et Google Fonts. Aucun appel réseau.
   - Sa propre clé de sauvegarde dans `localStorage` (exemple : `dernier-toit-v1`). Il ne lit ni n'écrit jamais `ile5-save` (le lobby) ni la clé d'un autre jeu.
2. **`LOBBY.md`** à côté : le contrat tel que le jeu le suit vraiment, tenu à jour à chaque version.
3. Les deux dans **l'atelier privé du mini-jeu** (une page Claude de sauvegarde), sous `src/`. La fiche de réponse donne le slug, la version, la taille et le sha256 du fichier : le lobby les vérifie avant de coller.

## L'interface (la même pour tous les jeux)
Le modèle qui marche est Dernier Toit : son `LOBBY.md` fait foi pour le détail (atelier `6b1ef180-3c29-4b72-babd-cd51fc116ec4`, `src/LOBBY.md.txt`).

```js
Jeu.version;                 // 'V4.4'
Jeu.accepte;                 // ce que le jeu sait lire, ex. ['rang','argent','heros','balles','niveaux','multi']
Jeu.troisJs;                 // adresse de three.js, que les tests remplacent par un moteur local
Jeu.ouvrir(opts, rappels);   // affiche le jeu par-dessus l'île, sans menu de départ
Jeu.ouvert;                  // vrai tant que le jeu est affiché (le lobby coupe sa boucle, son rendu, ses sons)
Jeu.fermer();                // retire le jeu sans attendre le joueur
Jeu.pairs(liste, moi);       // multi : les autres joueurs, dix fois par seconde
```

**`opts`, ce que le lobby apporte** :
- `heros` : `feu`, `eau`, `bois`, `terre`, `elec` (Braise, Ondine, Sylve, Roc, Volt) ; `arme` : `pistolet`, `fusil`, `assaut`, `sniper`, `pompe`, `lance` ;
- `rang` : 1 à 4. Le jeu durcit lui-même ses ennemis (vie × 1 · 1,35 · 1,8 · 2,4) ;
- `bonus` : `degats`, `cadence`, `critique`, `vie`, `heroDegats`, `recharge`, `argent` (bourse du marchand, une fois), `heros` (valeurs brutes de l'arbre du héros), `balles` (élément des balles), `niveaux` `{heros, arme}` à afficher ;
- `multi` : `{nom, depuis, max}` quand un salon est ouvert (voir plus bas) ;
- `encoche` : marges de l'écran, sinon mesurées par le jeu.

**`rappels`, ce que le jeu renvoie** :
- `pret(m)` à chaque partie qui démarre ; `retour()` quand le joueur revient au lobby ; `etat(d)` pour le multi ;
- `fin(m)`, une fois par partie, avec au moins :
  - `victoire` (vrai ou faux) et `raison` (un mot : `secouru`, `ville`, `abandon`…) ;
  - **`duree` : les secondes de jeu réel de CE joueur** (pas les attentes, pas les menus). **C'est la base de la paie** ;
  - `boss` : gros ennemis abattus ; `tues` : ennemis tués par ce joueur (le lobby ne paie pas quelqu'un qui regarde) ;
  - l'avancée dans la partie, pour le record et les défis (pour Dernier Toit : `jour`, `depart`) ;
  - `rang`, `heros`, `arme`, `joueurs` (nombre de joueurs à la fin), `hote`, `dev` (vrai si un mode de triche a servi : partie non payée).

## Ce qui est commun à tout le projet (décisions de Frédéric)
- **Les commandes universelles** : mini-carte en haut à gauche (on la touche pour la grande carte et les options) ; chiffres de la partie en haut à droite ; barre d'outils en bas au centre ; Action et Saut dans le coin bas droit, Sneak, Compétence, Ultime et un bouton libre le long de l'arc ; rien au-dessus de Saut (le pouce droit y tourne la caméra). Détail dans `claude/ile-des-cinq-fabrication.md`.
- **L'ATH par défaut (décision de Frédéric, 24/11)** : l'écran de jeu de L'Île des Cinq V1.2 est le modèle. « Dès qu'on crée un nouveau monde on part sur celui-ci. » Tout nouveau mini-jeu reprend cet affichage tel quel (pas de bandeau de vague, étiquette sous le viseur, vie en barre fine, joystick discret, boutons sur l'arc) et ne s'en écarte que pour ce que son jeu exige ; le détail est dans l'atelier de L'Île des Cinq (`claude/ile-jeu-fabrication.md`). Même règle pour le menu du portail : celui de L'Île des Cinq (lobby V11.5) est le modèle, section par section.
- **Les mêmes cinq héros et les mêmes six armes partout**, avec leurs modèles (ceux de Dernier Toit, `src/gfx/models/mains.js` et `photos.js` de son atelier). Une arme et un héros se montent au lobby et valent dans tous les jeux.
- **La progression permanente est au lobby.** Un mini-jeu peut garder sa monnaie et ses améliorations « de partie en partie », mais l'or céleste, les éclats de héros, les niveaux d'armes, les reliques et les rangs sont donnés par le lobby à partir de `fin`.
- **Le barème du lobby** (le même pour tous les jeux) : 10 or céleste et 20 éclats du héros par tranche de 46 secondes de jeu, +40 / +50 par boss, +200 / +150 par victoire, le tout × 1 / 1,25 / 1,5 / 2 selon le rang. Un jeu qui veut afficher ces gains sur son écran de fin recopie ces chiffres ; si le lobby les change, il le dit par fiche.
- **Le Guide** : le même personnage dans chaque jeu (chapeau pointu doré, écharpe bleue, livre), étiquette « RÈGLES », fiche à cinq onglets toujours dans cet ordre : Le but · Perdre · Commandes · Ce jeu · Ce que ça rapporte.
- **L'écran** : iPhone tenu à l'horizontale, page d'environ 966 × 366 px, marges d'encoche d'environ 62 px à gauche et à droite, 23 px en bas. Tout en français. Frédéric travaille uniquement depuis son téléphone : rien n'est jamais testé sur l'appareil par Claude, le dire.

## Le multi
Le jeu, dans son cadre, ne voit pas le réseau : **le lobby fait le facteur** entre les téléphones du même salon.
- Le jeu envoie son **état complet** par `rappels.etat(d)`, au plus dix fois par seconde. Le dernier envoyé remplace le précédent ; un message peut se perdre ; un gros état est transmis moins souvent (2 à 4 fois par seconde au-delà de 10 000 caractères).
- Taille maximale : `opts.multi.max` caractères de JSON (24 000 hors de Claude, 2 800 dans la page Claude).
- Le lobby appelle `Jeu.pairs(liste, moi)` dix fois par seconde : `liste` = les autres joueurs qui sont dans ce jeu, `[{id, nom, heros, rang, depuis, etat}]` ; `moi` = `{id, nom, depuis}`.
- **L'hôte est le plus petit `depuis`** (à égalité, le plus petit `id` comparé en texte) : son téléphone fait tourner la partie et met l'instantané dans son état ; les autres le recopient et envoient leurs actions numérotées dans le leur. Si l'hôte part, le suivant reprend. Un joueur qui arrive rejoint la partie en cours.
- **Tout ce qui vient de `liste` est non fiable** : vérifier types et tailles, ne jamais le mettre dans du HTML.
- Chaque téléphone envoie son propre `fin`.

## Ce que le lobby fait pour chaque jeu branché
Un portail sur l'île et son panneau (arme, héros, rang, ce qu'on emporte, record), l'ouverture du jeu, la paie et l'écran de retour, les défis de la taverne, le record dans le renom, le bouton « X est en partie · Rejoindre » pour le groupe, la ligne du joueur dans la liste du salon.

## Tester sans le lobby
Une page hôte minimale qui colle le fichier, appelle `Jeu.ouvrir(...)` et affiche ce que reçoivent `pret`, `fin`, `retour`. Pour le multi : deux cadres côte à côte et un script qui recopie l'état de l'un dans la liste de l'autre, avec deux `depuis` différents.

## Le premier message à coller dans une nouvelle conversation de mini-jeu
> Tu fabriques le mini-jeu « <nom> » du projet Jv. Lis d'abord `claude/mini-jeu-contrat-lobby.md` (le contrat commun avec le lobby) et, s'il existe, `claude/<jeu>-fabrication.md`. Tu livres un seul fichier `<jeu>-pour-lobby.js` plus son `LOBBY.md`, dans ton atelier privé, et tu écris `claude/reponse-<jeu>-<sujet>.md` quand c'est prêt à coller. Tu ne touches pas au lobby : ce que tu attends de lui, écris-le dans `claude/demande-<jeu>-<sujet>.md`.
