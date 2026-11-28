# Le code de L'Île des Cinq, fichier par fichier

Le jeu est une seule page, assemblée par `build.py` à partir des fichiers ci-dessous, dans l'ordre de `src/ORDRE`. Chaque fichier commence par une ligne qui dit ce qu'il contient.

- `src/page/page.html` : l'enveloppe de la page (HUD, panneaux). `src/page/style.css` : la feuille de style.
- `src/pont-lobby.js` : le pont vers le lobby. Il n'est PAS dans la page du jeu : `build.py` y met la page, la version et les tables, et écrit `construit/ile-pour-lobby.js`.
- `src/TABLES` : les tables de règles que le lobby peut lire (`IleDesCinq.tables`).
- `src/ORDRE` : l'ordre d'assemblage. Un fichier ne peut se servir, à son chargement, que de ce qui est au-dessus de lui.

## Les règles (`src/regles/`) — sans affichage, testables hors navigateur

- `regles/tables.js` : Les tables du jeu : éléments et héros, réglages d'équilibre (BAL), campagne et attaquants spéciaux, types de défenses, chemins.
- `regles/carte.js` : La carte : arrivées tout autour de l'île, navires qui croisent au large, grille du terrain et chemins des ennemis (champs de distance), murs et relief vus par les règles.
- `regles/terrassement.js` : Murs et fosses : vérifier puis poser une ligne de murs, creuser, et ce que ça change pour les ennemis et le héros.
- `regles/ennemis.js` : Les ennemis : types, boss, composition des vagues, apparition, attaquants spéciaux de la campagne.
- `regles/defenses.js` : Les défenses : Renfort et ses ruines, pose libre, amélioration, spécialisation, zones d'effet, impact d'un tir.
- `regles/armes.js` : Les armes du joueur dans la partie : l'élément de chaque arme, et les améliorations du marchand d'armes (tirs multiples, explosions, ricochets, chaînes…).
- `regles/heros.js` : Les six héros : passif, compétence et ultime de chacun (le même kit dans tous les jeux du projet).
- `regles/joueur.js` : Le joueur dans la partie : objectifs de vague, héros blessé ou à terre, lance-flammes, déplacement et tir (heroStep).
- `regles/bots-chantier.js` : Les bots joueurs (mode dev, esclaves) — ce qu'ils bâtissent : avant-poste, couloirs, choix du prochain chantier.
- `regles/bots.js` : Les bots joueurs — le chef de chantier, et ce que fait un bot à chaque instant (botTick).
- `regles/boucle.js` : step() : un pas de la partie (vague, ennemis, défenses, effets, bonus, fin). C'est le cœur des règles.
- `regles/ciel.js` : La vue du ciel vue par les règles : le chrono de 30 s entre deux vagues et les joueurs « Prêts ». L'affichage est dans interface/ciel.js.
- `regles/auto.js` : Mode normal : des défenses se gèrent seules avec le pot commun ; conseiller d'élément ; tir auto sur cible.
- `regles/reseau.js` : Le réseau de la partie : l'hôte met l'état du monde en compact (snap), les invités le recopient (applySnap).

## L'interface (`src/interface/`)

- `interface/base.js` : La base de la page : $, le lien avec le lobby (LOBBY, versLobby), les réglages, couleurs, icônes, et l'arbre du marchand de la partie (TREES.run).
- `interface/armes.js` : Les six armes telles que la partie les connaît (modèle, recul, zoom, profil de base), les bonus venus du lobby (heroMods), et le panneau du marchand.
- `interface/arsenal.js` : Tes armes dans la partie : le choix de 3 armes et de leur élément au début, le marchand d'armes, les effets des améliorations à l'écran, et ce que le multi en dit.
- `interface/modes.js` : Le mode de tir (bouton, auto, auto sur cible), le mode de jeu reçu du lobby, et le mode dev de la partie.
- `interface/hud.js` : L'état de la partie côté page (sim, outil en main), la barre d'outils, la roulette des éléments, les entrées, les textes du HUD.
- `interface/commandes.js` : Les commandes universelles : Action et Saut dans le coin, Sneak, Compétence, Ultime, Renfort et le bouton libre le long de l'arc.
- `interface/tutoriel.js` : Le tutoriel pas à pas de L'Île des Cinq : une vraie partie guidée, cœur invincible.
- `interface/partie.js` : Une partie, du début à la fin : les bots du mode dev, begin() (tout ce qui vient de la progression est donné par le lobby), finish() (le compte rendu au lobby).
- `interface/multi.js` : Le multi vu de la partie : l'état du réseau (net), et le salon que le lobby tient pour elle (MULTI : le lobby fait le facteur entre les téléphones).
- `interface/bots-marchand.js` : Les bots au marchand en fin de vague, puis netTick : qui est l'hôte de la partie, envois et réceptions à chaque image.
- `interface/tactile.js` : Les commandes tactiles : joystick, regard, doigts multiples, rotation de l'écran.
- `interface/minicarte.js` : La mini-carte de la partie.
- `interface/carte.js` : La grande carte et les options de la partie (on y entre en touchant la mini-carte).
- `interface/guide.js` : Le Guide partout : le panneau commun (#guideV), la fiche « Règles » de L'Île des Cinq et ses cinq onglets, le Guide près du cœur.
- `interface/reperes.js` : Repères à l'écran : nombres qui s'envolent, triangles et flèches vers les ennemis hors du champ.
- `interface/ciel.js` : La vue du ciel entre deux vagues : la caméra monte façon Clash of Clans, on pose, on améliore, on mure et on creuse au doigt, puis « Prêt ».
- `interface/boucle.js` : La boucle de la page : resize, frame() (une image : entrées, règles, affichage, HUD), démarrage.

## Les sons (`src/sons/`)

- `sons/sound.js` : Sons et sensations : tous les bruitages sont fabriqués à la volée ; ce que chaque événement du jeu fait entendre et vibrer.

## L'affichage 3D (`src/affichage/`)

- `affichage/scene.js` : La scène 3D de la partie : matériaux du ciel et de la mer, caméra, lumières, modèles préparés par élément.
- `affichage/modeles.js` : Des modèles aux objets affichés (mdlOf), textures et halos, le sol de l'île et la mer, les étiquettes.
- `affichage/decor.js` : Le décor de l'île : ciel, cœur, navires et écume, étals (marchand, esclaves, Guide), végétation semée puis écartée là où l'on bâtit, collines.
- `affichage/armurier.js` : L'étal du marchand d'armes : à 12 m du cœur, loin des chemins et des autres étals. On s'en approche, le bouton « Armes » apparaît (interface/arsenal.js).
- `affichage/themes.js` : Les thèmes de la campagne : un décor par type (Feu, Eau, Terre, Élec, Nature, Vent) — ciel, lumière, sol, volcans, étangs, cristaux.
- `affichage/ambiance.js` : Autour du joueur : pollen, défenses et leurs signes, fantôme de pose, murs et fosses affichés, l'arme en main (setGun, handsTick).
- `affichage/entites.js` : Les entités : tirs, barres de vie, ruines, bonus à ramasser, ennemis (enemyView).
- `affichage/animations.js` : Animations des ennemis et des défenses, rayons, éclairs, orage (calculées à l'affichage : les règles n'en dépendent pas).
- `affichage/effets.js` : Effets : gerbes, flammes, éclaboussures, canons, fumée, zones au sol, coéquipiers ; sync() aligne les vues sur l'état de la partie.
- `affichage/vie.js` : La vie du décor et des vues, appelée à chaque image par la boucle (worldTick, skyTick, viewsTick).

## Les modèles 3D (`gfx/`)

- `gfx/kit.js` : le kit de modélisation (formes → maillages colorés par sommet). `gfx/models/*.js` : un modèle par objet du jeu, dont les six héros (`braise`, `roc`, `sylve`, `volt`, `ondine`, `zephyr`). Ces modèles sont communs aux trois jeux : un autre atelier les gère et les recopie, on ne les modifie pas ici.
- `gfx/armes/mains.js` : les six armes du projet, venues telles quelles de l'atelier de Dernier Toit (teintées par `ctx.el`). On ne le modifie pas ici : on le remplace.
- `gfx/three-lite.js` : le moteur d'aperçu des tests (remplace three.js, que les tests ne peuvent pas télécharger).
