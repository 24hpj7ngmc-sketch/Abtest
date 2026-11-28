# Les sources du lobby (Abtest)

Le jeu livré est une seule page. `build.py` la fabrique en mettant bout à bout les fichiers ci-dessous, **dans l'ordre de `ORDRE`** (un fichier peut se servir de ce qui est déclaré au-dessus de lui), puis colle devant les deux mini-jeux, tels quels : `ile/ile-pour-lobby.js` (L'Île des Cinq) et `dt/dt-pour-lobby.js` (Dernier Toit).

- `page/page.html` : l'enveloppe (les panneaux, les boutons). `page/style.css` : la feuille de style.
- Tout le reste est du JavaScript, mis en forme par prettier (`.prettierrc.json` à la racine ; `prettier --write "src/**/*.js" src/page/style.css` après une modification).
- Les modèles 3D du lobby sont à part, dans `gfx/`.
- **Depuis la V11.1 il n'y a plus aucune règle de mini-jeu ici** : ni partie, ni ennemis, ni défenses. Ce que le lobby a besoin de savoir de L'Île des Cinq pour ses textes est dans `interface/tables.js`.


## interface/

La page : tables, base, arbres des héros et des armes, réglages du portail, commandes, multi, boucle.

- `tables.js` (25 lignes) : Les tables de L'Île des Cinq dont le lobby se sert pour ses textes (héros, campagne, réglages d'équilibre) : lues dans `IleDesCinq.tables`, le jeu collé fait foi.
- `roles.js` (187 lignes) : Les six héros et leurs rôles (Zéphyr, le Vent), les voies (spécialisations).
- `progression.js` (347 lignes) : La base de la page : $, setTxt, toast, couleurs, icônes ; la grille d'amélioration et l'arbre de chaque héros ; la sauvegarde (save, persist).
- `armes.js` (906 lignes) : Les six armes : profils, arbres (Général, par mini-jeu, Élément des balles), ce qu'une arme apporte dans un jeu (armMods).
- `modes.js` (129 lignes) : Les réglages (son, mode de tir et mode dev se changent sur la carte) et ceux du premier portail : mode de jeu (normal, difficile), campagne et ses niveaux ; rangs qui paient (PAYK) ; options du mode dev (dev), son.

## sons/

Les sons du lobby.

- `sound.js` (184 lignes) : Les sons du lobby : un fond sonore et quelques bruitages, tous fabriqués à la volée par le navigateur (aucun fichier son).

## affichage/

Ce que le lobby garde du rendu commun : moteur, shaders partagés, modèles préparés.

- `scene.js` (62 lignes) : Le moteur de rendu de la page (renderer), les shaders partagés (ciel, mer de nuages, tourbillon des portails), les matières des lots, les modèles préparés (prepOf).
- `modeles.js` (80 lignes) : Des modèles aux objets affichés (mdlOf), textures et halos, petits outils de hasard et de bruit (hsh, vn, sst).

## interface/

La page : tables, base, arbres des héros et des armes, réglages du portail, commandes, multi, boucle.

- `commandes.js` (114 lignes) : Les commandes universelles au lobby : Action et Saut dans le coin, Sneak et le bouton libre le long de l'arc ; l'état des commandes (joystick, regard, saut, sneak).
- `multi.js` (331 lignes) : Le multi : le salon de la page (dans Claude) ou un mot de salon relayé par MQTT (ailleurs) — net, mqRoom, mqJoin ; netTick à chaque image.
- `tactile.js` (99 lignes) : Les commandes tactiles : joystick, regard, doigts multiples, rotation de l'écran.

## lobby/

L'Île céleste : le lobby, son village, ses bâtiments, le Guide, les deux portails (L'Île des Cinq, Dernier Toit), le multi.

- `base.js` (160 lignes) : L'Île céleste, le lobby : sa scène à part (ciel, nuages, lumière, caméra), étiquettes, îlots lointains ; VISIT (visite chez un autre joueur).
- `terrain.js` (174 lignes) : Le terrain de l'île : grille de sommets sculptable, hauteurs, rayon selon l'évolution, la liste des mini-jeux (LGAMES), couleurs du sol, mer de nuages.
- `portails.js` (147 lignes) : Les portails sur leur parvis au nord, la montagne, les parcelles et le relief de base de l'île (terraBase).
- `chemins.js` (283 lignes) : Le réseau de chemins entre les bâtiments, les parcelles, et l'aménagement du sol qui en découle (terraPlan).
- `village.js` (628 lignes) : Le village : catalogue des bâtiments (CAT), poser, ranger, améliorer, recaler sur le sol, village de départ.
- `evolution.js` (65 lignes) : Le renom et la seule progression : l'évolution de l'île (niveau du Hall), qui agrandit l'île.
- `recoltes.js` (173 lignes) : Les récoltes : chaque bâtiment qui produit a une réserve, qu'on ramasse en passant ; préparatifs pour la prochaine partie.
- `taverne.js` (216 lignes) : La taverne et ses défis ; le panneau du renom.
- `etat.js` (187 lignes) : L'état du lobby (LB), ce qu'affiche le haut de l'écran, l'entrée et la sortie du lobby, le point d'apparition.
- `guide.js` (445 lignes) : Le Guide du lobby : la visite pas à pas du village, ses sujets quand on lui reparle.
- `toit.js` (346 lignes) : Dernier Toit derrière le deuxième portail : panneau, bonus emportés, ouverture, paie au retour (toitFin), écran de retour.
- `outils.js` (355 lignes) : La barre d'outils du lobby : main, marteau, pelle ; viser, tracer, agir (lobAct).
- `arme.js` (109 lignes) : L'outil Arme : l'arme du joueur en main à la couleur de son élément, qui suit la course et recule devant un mur (lobRayon) ; « Montrer » ; ce que les autres joueurs en voient (armeNet, armePub).
- `dev.js` (111 lignes) : Le mode dev du lobby : raccourcis de test.
- `carte.js` (261 lignes) : La carte du lobby : mini-carte, grande carte et tous les réglages (son, mode de tir, saut auto, mode dev, multi).
- `batiments.js` (206 lignes) : Les panneaux des bâtiments : hall des héros, maison, marchand céleste, musée.
- `gains.js` (41 lignes) : Le barème commun aux deux portails (GAINS, payOut), les noms du butin.
- `boucle.js` (424 lignes) : La boucle du lobby : se déplacer (obstacles : lobCercles), tourner, ramasser les récoltes, dessiner (lobbyTick).
- `multi.js` (595 lignes) : Le lobby à plusieurs : tous ceux du salon sur l'île de l'hôte (islVisit, islHome), les autres joueurs affichés, le bouton Rejoindre (lobNet).
- `toit-multi.js` (66 lignes) : Le relais du multi pour Dernier Toit : le lobby fait le facteur entre les téléphones (toitEtat, toitNet).
- `ile.js` (287 lignes) : L'Île des Cinq derrière le premier portail : le jeu tourne dans son cadre (ile/ile-pour-lobby.js) ; le lobby l'ouvre, lui donne ses bonus, paie au message « fin », fait le facteur du multi.
- `paysage.js` (303 lignes) : Le paysage de l'île : végétation, rochers, rivières et cascades, semés selon le relief.
- `paysage-chemins.js` (367 lignes) : Le paysage : rubans pavés des chemins, parvis, montagne, rochers qui planent, monument, astre.
- `habitants.js` (211 lignes) : Les habitants du village : ils vont d'un bâtiment à l'autre par les chemins.
- `paysage-vie.js` (76 lignes) : Le paysage : reconstruction quand l'île change, et sa vie à chaque image.

## interface/

La page : tables, base, arbres des héros et des armes, réglages du portail, commandes, multi, boucle.

- `guide.js` (34 lignes) : Le panneau commun du Guide (#guideV) : un titre, des onglets, des lignes, un bouton facultatif (guideShow). Les sujets du Guide du lobby sont dans lobby/guide.js.
- `boucle.js` (37 lignes) : La boucle de la page : resize, frame() (une image du lobby, ou la pause quand un mini-jeu est ouvert dans son cadre), démarrage.

L'ordre d'assemblage mêle les dossiers : tables et début de l'interface, modèles 3D, sons, rendu commun, commandes et multi, lobby, panneau du Guide et boucle (voir `ORDRE`).
