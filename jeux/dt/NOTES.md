# Dernier Toit — notes de fabrication (V1.0, 19/11/2026)

## V5.2 (28/11/2026) : l'élément du héros se choisit
Décision de Frédéric : « Braise est mage, mais pas de feu. On peut choisir son élément. » Pour les six héros : la clé reste l'identité (kit, voies, rôle, modèle), l'élément
choisi (opts.elHeros, S.elHeros, helper elH dans regles/heros.js) fait les couleurs, la prédilection +10 %, l'élément d'arme par défaut, l'effet du héros sur les balles,
l'ultime teinté et les textes. Multi : champ `eh` à côté de `e`. gfx/models/mains.js : `(ctx.hero || ctx.el) === 'feu'` pour le modèle de Braise (palette de ctx.el).
Test : tests/elheros.js. Empreinte inchangée. Non vérifié : le vrai three.js r128, le téléphone, le vrai lobby (l'envoi de opts.elHeros).

## V5.1 (28/11/2026) : Braise, le Mage de feu, a son propre modèle 3D
Demande de Frédéric : « Modélise-le vraiment en 3D. » `gfx/models/braise.js` (MODELS['hero.braise'], fichier commun aux trois jeux, collé par build.py après mains.js) ;
`hero.avatar` le rend quand `el = 'feu'` (une ligne en tête). `joueur.corps` (affichage/joueurs.js) demande la variante `arme: 1` (bras tendus, sans flammes) et lit
dans la recette `jambes` (12 pièces de jambes, droite puis gauche) et `mainD` (pièces du bras droit gardées) ; sans ces champs, le gardien comme avant (8 et 4).
Règles, sons, écran, réseau inchangés. Non vérifié : le vrai three.js r128 et le téléphone.

## V5.0 (28/11/2026) : des couleurs d'armes pour chaque élément
Demande de Frédéric : « Des couleurs d'armes pour chaque élément. » L'arme en main (et celle des autres joueurs en multi) prend la couleur de l'élément de l'arme
(opts.elementArme du lobby, sinon le choix du menu, sinon le héros) : modèles `vm.*` teintés par `ctx.el` (gfx/models/mains.js), cache de `prepM` par élément.
Réseau : champ `e` (élément de l'arme) dans l'état publié, vérifié à la réception. Règles, sons, écran et commandes inchangés.

Demande de Frédéric : « Recrée-moi le jeu Wait, They Can Climb le plus fidèlement possible, à la 1re personne. Ça nous servira de base pour un projet à venir. »
Nom propre (« Dernier Toit ») : le titre et les visuels du jeu d'origine appartiennent à son studio (babia). Les mécaniques sont reprises.

## Le jeu d'origine (ce qu'on en sait : page Steam, itch.io, démo)
Tower defense incrémental. Seul sur le toit d'un immeuble au centre de la carte. Tourelles sur le toit et les façades, puis des murs pour s'étendre.
Fusil du joueur. Capacités : onde de choc, missile, leurre « et plus ». Plus de 100 000 zombies, certains courent, d'autres sont lents, tous grimpent.
Mitrailleuses, lasers, mortiers, lance-flammes, chacun amélioré, avec des capacités spéciales. Plus on avance, plus de routes s'ouvrent.
10 jours à tenir avant les secours ; la horde grossit chaque jour (jusqu'à 256 000). Arbre d'améliorations. Une seule carte qui change. Du sang.

## Ce qu'on a fait
- Boucle : partie = jours 1 à 10. Mort → on garde l'argent → arbre → on repart (jour 1, ou 3/5/7 avec « Raccourci »). Jour 10 tenu → hélico → victoire → « sans fin » (jour 11+, ×1,4/jour).
- Horde par jour : 120, 240, 420, 700, 1100, 1700, 2600, 3900, 5800, 8500 (25 080 en tout). PV ×1,3 par jour. Foule simultanée limitée (700 à 2200, s'adapte aux images par seconde).
- Routes : Nord (j1), Est (j2), Sud (j3), Ouest (j4), puis 4 ruelles en diagonale (j6 à 9). Une barricade saute quand la route s'ouvre.
- Escalade : les zombies grimpent les façades, plus vite quand ils s'entassent (bonus jusqu'à ×2,6), passent le parapet et foncent sur le joueur.
- Zombies : rôdeur (2 tenues), coureur, colosse, mastodonte (jours 5, 8, 10).
- 24 emplacements : 8 toit, 8 balcons (dispos dès le départ), 8 sur les murs d'avenue (« Murs »). Nombre de tourelles limité par « Tourelle +1 ».
- Tourelles : mitrailleuse, laser (traverse tout sur sa ligne), mortier (vise le plus gros paquet), lance-flammes (cône, brûlure). Spéciaux : double canon, prisme, fragmentation, napalm.
- Fusil : tir au bouton Action ou auto sur cible (option, oui par défaut), Viser (bouton libre, ×1,5). Se pencher au bord du toit (l'œil passe au-dessus du parapet) pour viser ceux qui grimpent.
- Capacités : Missile (Compétence, double appui), Onde de choc (Ultime, se charge en tuant), Leurre et Frappe aérienne (objets de la barre d'outils).
- Arbre : 43 cases (fusil, tourelles, spéciaux, capacités, survie, butin, immeuble). Les tués par le joueur rapportent le double.
- Commandes universelles de L'Île des Cinq, à l'identique. Carte (mini-carte touchée) avec son, tir auto, vitesse caméra, mode dev (+100 000 $, tout au max, tuer tout, invincible, jour suivant), abandon.
- Ciel : après-midi en préparation, le soir tombe au fil de la horde, l'aube revient quand le jour est tenu.

## Équilibre (simulé, `node simtest.js <précision> <parties>`)
Joueur simulé qui tire bien : jours atteints 2, 3, 5, 6, 8, puis victoire à la 6e partie (~1 h). Joueur qui ne tire jamais : nettement plus lent (jour 5 à la 4e partie). Jamais joué en vrai.

## Fichiers
- `tpl.html` page, interface, commandes, arbre, boucle · `sim.js` règles (testables sans navigateur) · `scene.js` affichage 3D · `sound.js` sons.
- `gfx/kit.js` (kit K de L'Île des Cinq), `gfx/models/mains.js` (mains, marteau, + vm.fusil, vm.leurre, vm.radio), `gfx/models/toit.js` (zombies 4 tenues × 6 poses, immeuble, ville, barricade, mur, nid, 4 tourelles, hélico, leurre, missile).
- `python3 build.py` → `toit.html`, `publie.html` (la page publiée), `test3d.html` (avec `gfx/three-lite.js` à la place de three.js).
- Tests : `run1.js` (accueil, pose, jour), `run3.js` (horde qui grimpe), `run4.js` (vue extérieure), `run5.js` (arbre, carte), `run6.js` (partie entière accélérée jusqu'à la victoire), `run7.js` (balcon, mort). Captures dans `shots/`, taille 966 × 366 (son iPhone dans l'appli).
- Aperçu d'un modèle : `cd gfx && node preview.js out/x.png models/toit.js z.all`.

## Jamais vérifié
Le vrai three.js r128 sur iPhone (tout a tourné sous three-lite) ; la fluidité avec 1 500 zombies ; les sons ; l'équilibre avec un vrai joueur.

## Idées non faites
Multijoueur ; branchement au lobby (Île céleste) ; plus de types de zombies ; améliorations visibles sur les tourelles ; fin « inattendue » du jeu d'origine (inconnue).

## V1.1 (19/11) — mode « Ils s'échappent » (son idée)
Sa demande : « Si les vagues, au lieu d'arriver vers l'immeuble, en sortent ? On est sur le toit et on les voit partir au lieu de venir. » Pas de thème narratif pour l'instant.
- Second mode, au choix sur l'écran d'accueil (« Ils arrivent » / « Ils s'échappent »), `save.mode` = 'in' | 'out'. Même argent, même arbre ; meilleur jour à part (`save.bestF`).
- Ils sortent par les rideaux de fer du rez-de-chaussée (70 %) ou sautent des fenêtres (30 %), filent vers le débouché d'une rue ouverte (la plus proche 65 % du temps), escaladent le mur d'avenue s'il existe, puis courent jusqu'au bout de la rue.
- Chaque fuyard abîme la jauge « Ville » (les PV du joueur) : rôdeur 5, coureur 4, colosse 18, mastodonte 60. Ville à 0 = défaite. Gilet, Bandages, Blindage servent à la ville.
- Tourelles : priorité à ceux qui sont le plus loin du centre. Onde de choc : les renvoie vers l'immeuble et les sonne. Barbelés : aussi en haut des murs (les deux modes).
- Repères au bord de l'écran : « n s'enfuient · Est, Sud ». Code : `outRoute`, `outWalk`, `escapeZ`, `ESC` (sim.js) ; `edgeOut`, `OUT`, `bestOf`, `TUTO_OUT` (tpl.html). Test : `run8.js` ; banc : `node simtest.js 0.6 8 out`.
- Banc simulé : défaite au jour 2 la première fois, victoire à la 7e partie (~45 min). Jamais joué en vrai.

## V1.2 (19/11) — immeuble plus haut, intérieur praticable (sa demande : « rajouter des étages » et « créer l'intérieur et le rendre praticable »)
- (V1.2 : 7 niveaux, toit à 24,6 m — remplacé en V1.3 par RdC + 4 étages, sa décision.)
- `immeuble.js` décrit tout l'immeuble (chargé avant `sim.js`, dans le bloc SIM) : `BOX` (murs, dalles, meubles ; `b` arrête les balles, `p` arrête le joueur ; `bar` = barrière invisible aux fenêtres, rideaux, parapet, balcons), `FLOORS` (sols, rampes d'escalier, balcons), `OPEN` (fenêtres, portes de balcon, rideaux), `ROOMS` (36 pièces). Le modèle `imm` est dessiné à partir de ces listes.
- Escalier central (deux volées + palier par niveau) depuis le cabanon du toit (porte au nord) jusqu'au rez-de-chaussée. Étages : couloir autour de la cage, 6 pièces meublées (chambre, salon ou cuisine). Rez-de-chaussée : hall de magasins (piliers, comptoirs, rayons), rideaux de fer baissés (« Ils arrivent ») ou relevés (« Ils s'échappent »).
- Balcons praticables aux 2e et 5e étages (2 par façade, porte-fenêtre), tourelle posée sur un côté. Se pencher marche au bord du toit et au bord des balcons.
- Le joueur : collisions (`collideP`), sols et marches (`floorAt`), niveau affiché en haut à droite (Toit, 6e… RdC). Les murs arrêtent les balles (`rayWall`) ; les tourelles ne voient pas l'intérieur ; leur portée compte moins la hauteur (tir plongeant).
- Mode « Ils arrivent », si le joueur descend : ceux qui grimpent glissent vers la fenêtre la plus proche de son étage et entrent ; sur un balcon, ils y montent ; ceux du toit prennent l'escalier. Dans l'immeuble, ils suivent une grille de cases de 50 cm par niveau (`WALK`, `FUP`, `FDOWN`, champ vers le joueur recalculé 4×/s), et l'escalier (`STAIRS`, état 7). Joueur arrêté dans l'escalier : ils viennent l'y chercher (`pst`, `pss`).
- Mode « Ils s'échappent » : ceux du bas sortent de l'intérieur du hall par les rideaux relevés ; les autres sautent des fenêtres des 6 étages.
- Escalade plus rapide (×1,5) pour compenser la hauteur. Banc : « arrivent » victoire à la 6e partie (~1 h), « s'échappent » à la 7e (~45 min).
- Tests : `geotest.js` (grilles, sols), `insidetest.js` (descendre l'escalier, ils entrent par les fenêtres), `stairtest.js` (pas d'impasse dans l'escalier), `run9.js` (captures de l'intérieur).

## V1.3 (19/11) — rez-de-chaussée + 4 étages (sa correction : « 5 étages suffira », puis « RdC + 4 étages »)
- `NLV=5` dans immeuble.js : toit à 17,6 m. Balcons aux 2e et 4e étages (`BALV=[2,4]`). Escalade : rôdeur 1, coureur 1,8, colosse 0,62, mastodonte 0,52 m/s.

## V1.4 (19/11) — l'invasion des étages, mode « Ils s'échappent » seulement
Ses mots : « À partir de la vague 6, des zombies commencent petit à petit à envahir les étages. Ce qui crée une nouvelle zone de gameplay : la défense. » Puis : **« On travaille uniquement dans le mode ils s'enfuient »** — ne plus toucher au mode « Ils arrivent » (resté comme en V1.3).
- À partir du jour 6 (`INV_DAY`), une part de ceux qui sortent du hall (`invShare` : 4 % au jour 6, +2,5 %/jour, 20 % au plus) montent l'escalier au lieu de fuir (`Z.inv` = étage visé). Ils occupent un étage (se postent dans une pièce 9 à 18 s, champ `ROOMS[].F`), puis montent d'un étage, sans dépasser `invCap(jour)` : 2e étage au jour 6, 3e au 7, 4e au 8, **toit à partir du jour 9**. Code : `invadeStep`.
- Ils comptent dans la journée : tant qu'ils occupent un étage, le jour ne finit pas → il faut les déloger. Sur le même niveau que le joueur, ils l'attaquent.
- Deux jauges en mode fuite : **Ville** (les fuyards, `S.city`, `hurtCity`) et **Vie** (le joueur mordu, `hurtP`). Défaite « Envahi » si la vie tombe à 0 (`S.why`).
- **8 emplacements de tourelle dans les couloirs** (2 par étage, nord-ouest et sud-est ; `k:'int'`, ids 24 à 31), seulement en mode fuite (`slotOn(P,s,mode)`). Mitrailleuse, laser, lance-flammes (pas de mortier). Elles ne voient que leur étage et l'escalier qui y arrive, pas à travers les murs (`turretPickIn`, `insideSeen`).
- Onde de choc : jette du toit ceux qui y sont, sonne ceux qui sont près du joueur dans les étages.
- Messages : « Ils envahissent le 2e étage ! », annonce au jour 6, « dans l'immeuble n » dans le panneau du haut. Chiffres du haut resserrés (Ville, Vie, $, Jour, Niv.).
- Banc (`node simtest.js 0.6 8 out`, le joueur simulé reste sur le toit, pose des tourelles de couloir) : défaites aux jours 2, 3, 4, 5, 6, 6 puis victoire à la 7e partie (~45 min). `invtest.js` : jour 6 sans tourelle de couloir, 36 envahisseurs restent au 2e et la journée ne finit pas ; avec, ils sont nettoyés. `run10.js` : captures (couloir au marteau, invasion au 2e).

## V1.5 (19/11) — cloisons cassables, masse, planches (mode « Ils s'échappent » seulement)
Ses mots : « on peut détruire les murs (un peu comme dans R6S) … ils se détruisent avec les balles perdues et une arme masse qu'on pourra débloquer dans l'arbre », « barricader les portes avec des planches (comme dans Call of Duty Zombies) », « mets autant d'agents que tu as besoin, prévois des audits ».
- Contrat commun : `CONTRAT-V15.md` (données, fonctions, évènements). Production : règles par moi, deux agents en parallèle (visuel ; interface et son), puis deux auditeurs (règles/interface ; rendu/perf/ressenti).
- `immeuble.js` : les cloisons intérieures sont découpées en 472 panneaux d'≈1 m (`PANELS`, 8 pv, étages `bas` 0–2 m / `haut` / `linteau`). 34 portes barricadables (`DOORS` : 24 de pièces, 9 d'escalier « montée »/« arrivée », 1 du cabanon). Chemins : Dijkstra à tas (`bfs`) avec un coût en plus (`COST`, +10) sur les portes barricadées ; `navRebuild(lv)` (≈18 ms sur PC) appelé par `navFlush`, un niveau par pas.
- `sim.js` : balle perdue (qui ne s'arrête pas sur un zombie) = 1 dégât au panneau touché ; explosions = dégât/14 aux panneaux proches, pas à travers les murs porteurs ; casser un panneau `bas` ouvre un passage. Masse (`w_masse` 150 $, `w_masse_pw`, `w_masse_sp`, branche Survie) : coup en arc 2,3 m, 45 dégâts, 6 aux murs (×1,3 par Masse lourde). Planches : marteau sur une porte, action tenue, 1 planche / 0,5 s, 5 max ; replanter une planche arrachée rapporte. Les zombies arrachent 1 planche en 1,6 s (gros ×2), deux au plus par porte, et mordent à travers. Le joueur et les balles passent entre les planches.
- Tests : `v15test.js` (règles), `v15ui.js` (interface tactile), `sndtest.js` (sons rendus hors ligne), `essais15/` (captures de l'agent visuel).
- Audits (deux auditeurs, lecture seule, sur copies) puis corrections : poursuite directe seulement si le chemin est court (`S.pf<8`, sinon ils traversaient les cloisons et ignoraient les planches) ; pas de morsure à travers un mur ; pas de passage depuis l'embrasure (test du plan de la porte) ; argent des planches plafonné à 5 par porte et par jour ; recul de la masse arrêté par les murs ; envahisseur du toit qui devient chasseur (plus d'aller-retour) ; boîtes à forme unique + liste par niveau (`WLIST`) → recalcul de la marche ≈0,4 ms ; masse : murs à 1,45 m ; changer d'outil annule le coup. Visuel : objet en main qui recule près d'un mur, zombie d'escalier dessiné derrière ses planches, planches arrachées posées sur le vrai sol, cloisons de teinte unie (plus de bande à 2 m) et qui se chevauchent de 2 mm, fissures plus claires, poussière plus légère, panneau du jour à moitié effacé quand on vise une porte, toast « Ils arrachent tes planches ! » protégé. Marteau : la porte passe avant un emplacement de tourelle à plus de 3,2 m.
- Restent : motif d'impacts identique sur tous les panneaux abîmés ; petits liserés possibles aux joints ; à 844×390 l'étiquette d'action recouvre la case Frappe (son écran : 966×366, correct).

## V1.6 (19/11) — un immeuble plus grand, moins oppressant (sa demande : « je me sens à l'étroit dans l'immeuble, refais-en un plus grand, moins oppressant »)
- `immeuble.js` : 26 × 26 m (`B=13`, avant 18 × 18), rez-de-chaussée 4,2 m, étages 3,8 m (`G0`, `FH`), toit à 19,4 m. 9 grandes fenêtres par façade et par étage (1,5 × 2,05 m), 3 rideaux de fer de 3,6 m par façade.
- Chaque étage : un grand hall autour de l'escalier (3,9 à 4,9 m de large, bancs, plantes, 4 plafonniers), 9 pièces le long des façades (`R1=6.5` : bandes de 6,2 m de profondeur), portes de 1,3 m, passages entre pièces d'angle. À l'ouest, un plateau de bureaux (8 postes). Les cloisons tombent sur les trumeaux entre fenêtres (±3,9, ±6,5, z = 1,3).
- L'escalier, le cabanon et les portes d'escalier n'ont pas bougé (mêmes `SA`, `SB`, `HUTIN`, `STAIRS`). Grille de marche 52 × 52 cases (`NC` calculé), tous les niveaux joignables d'un seul tenant.
- Toit : emplacements de tourelle aux coins (±10,6) et aux bords (±10,8), balcons à u = ±5,2 (tourelles à ±6,2), hélico en (6,8 ; 6,8), château d'eau et clims repoussés, départ du joueur en (0 ; −7). Tourelles de couloir en (−4,3 ; −4,1) et (4,3 ; 4,6).
- Mode « Ils arrivent » : même immeuble (une seule description) ; l'escalade est accélérée de H/17,6 (`CLK`) pour garder la même durée qu'avant. Banc : « arrivent » victoire à la 7e partie (~1 h 07), « s'échappent » à la 7e (~44 min), comme avant.
- Nouveaux meubles : bureau (écran, chaise), plante, étagère à livres, banc. Décors de façade (bandeaux, pilastres, cadres) calculés depuis `B`.

## V1.7 (19/11) — balcons tout autour (sa demande : « les balcons doivent être sur les 4 côtés et de la longueur entière de chaque côté. Mieux pour le gameplay »)
- Aux 2e et 4e étages (`BALV`), un balcon continu de 2,4 m (`BALD`) fait le tour de l'immeuble, coins compris ; garde-corps continu. Choix : un **caillebotis métallique** (lames espacées) pour que, depuis le toit, on voie et on tire toujours la rue au pied de l'immeuble (les balcons n'arrêtent pas les balles, comme avant).
- Une porte-fenêtre par pièce de façade (`balDoor` : u = −7,8, 0, 7,8, plus 2,6 sur la façade est), les meubles les évitent.
- 16 emplacements de tourelle de balcon (8 anciens, numéros 8 à 15 inchangés ; 8 nouveaux, numéros 32 à 39), posés à 1,75 m de la façade : on passe entre la tourelle et le mur.
- Grille de marche étendue aux balcons (`GB=B+BALD`, 62 × 62 cases) : les envahisseurs vont chercher le joueur sur le balcon par les portes-fenêtres (jamais à travers la façade, `baltest.js`).
- Mode fuite : ceux qui sautent au-dessus du 1er partent du bord du balcon ; ceux qui contournent l'immeuble passent par un coin qu'ils atteignent sans le traverser (avant, certains coupaient les coins à travers l'immeuble).
- Banc : « s'échappent » victoire à la 7e partie (~44 min), « arrivent » à la 6e (~57 min). Captures : `run11.js`.

## V1.8 (19/11) — balcons à tous les étages (sa question : « Pourquoi un étage sans balcon ? » — aucune raison, reste de l'ancien immeuble)
- `BALV=[1,2,3,4]` : le balcon qui fait le tour existe au 1er, 2e, 3e et 4e. Portes-fenêtres à chaque étage.
- Emplacements de balcon : les numéros 8-15 et 32-39 gardent leur étage (2e et 4e, écrits en dur) ; 16 nouveaux au 1er et au 3e (numéros 40 à 55). 32 en tout.
- Caillebotis plus ajouré (lames de 6 cm tous les 26 cm) : quatre balcons superposés, la rue au pied de l'immeuble reste visible depuis le toit.
- Tous les sauteurs partent du bord du balcon. Banc : « s'échappent » 7e ou 8e partie (44 à 56 min selon le tirage), « arrivent » 6e (~57 min).

## V1.9 (19/11) — le sprint (sa remarque : « Le sprint ne marche pas »)
- Pas de panne trouvée dans l'aperçu (vrais appuis tactiles : 6,4 m/s à fond). Causes probables sur son téléphone : Sneak resté allumé (c'est un interrupteur, et le sprint était coupé accroupi), seuil exigeant (92 % de la course et vers l'avant), écart peu sensible (+49 %).
- Maintenant : le sprint part à 85 % de la course vers l'avant et tient tant que le pouce reste vers l'avant (`sprintOn`, relâché sous 25 % vers l'avant) ; il relève le joueur s'il était accroupi ; toujours pleine vitesse en sprint (7,2 m/s au lieu de 6,4) ; champ de vision élargi (68° → 76°) ; pas de sprint en visée (comme L'Île des Cinq). Test : `sprinttest.js`.

## V2.0 (19/11) — le ressenti du sprint (ses mots : « il n'y a pas d'à-coup à l'accélération… le ressenti n'est pas là »)
- `sim.js` : le joueur a maintenant une vitesse (`p.vx`, `p.vz`) qui suit le joystick vite mais pas d'un coup (15/s en marche, 11/s en sprint). Au départ du sprint, un coup d'accélération : +35 % qui retombe en 0,4 s (`p.surge`), et l'évènement `sprint`.
- `scene.js` : au départ, la caméra pique un peu vers l'avant et le champ de vision donne un coup (+9°) avant de se poser à +8° ; en sprint, l'arme se baisse et se met de travers en balançant, la caméra roule légèrement au rythme des pas (`G.kick`, `G.spk`).
- `tpl.html` / `sound.js` : balancement plus ample en sprint, un souffle et deux appuis au départ (`dash`).
- Captures : `shots/80-marche.png`, `81-sprint-depart.png`, `82-sprint.png` (`sprinttest.js`).

## V2.1 (19/11) — casser les murs en deux (sa demande, capture annotée : « casser les murs en 2 … on casse que le milieu, on crée pas de passage mais de la vision pour tirer »)
- Chaque morceau de cloison a trois étages : `bas` (0 à 1 m, 6 pv), `milieu` (1 à 2 m, 6 pv), `haut` (2 m au plafond, 8 pv) ; `linteau` au-dessus des portes inchangé. 1 140 panneaux.
- Casser le milieu seul = une **fenêtre de tir** : on voit et on tire, mais ni le joueur ni les zombies ne passent, et les zombies ne mordent pas par-dessus le bas (morsure testée à 0,85 m). Il faut le bas ET le milieu pour ouvrir un passage (la marche est recalculée dès que l'un des deux tombe).
- La masse frappe dans l'axe du regard seulement (avant : aussi à hauteur de taille) : viser la poitrine fait une fenêtre, viser bas casse le bas.
- Tests : `v15test.js` (fenêtre, pas de passage, pas de morsure, puis passage), `v15ui.js` (masse sur un milieu). Capture : `shots/83-fenetre-de-tir.png`.

## V2.2 (19/11) — les armes déjà faites (sa demande : « il serait l'heure d'ajouter les armes qu'on a déjà dev précédemment »)
- Les trois armes de L'Île des Cinq (V8.8-V9.0) : **Pistolet**, **Fusil d'assaut**, **Fusil de sniper**, en plus du Fusil. Mêmes modèles en main (`vm.pistolet`, `vm.assaut`, `vm.sniper`, déjà dans `gfx/models/mains.js`), cristal couleur acier (pas d'élément ici), mêmes zooms (×1,35, ×1,5, ×4) et même lunette du sniper (Tir tenu = lunette, relâché = le coup part ; pas de tir auto au sniper).
- Mode « Ils s'échappent » seulement ; « Ils arrivent » garde le Fusil. Disponibles tout de suite. Choix : Fusil en main, sous-barre de 4 puces (comme les tourelles au marteau), gardé dans la sauvegarde (`save.weap`).
- `sim.js` : table `WEAP` (multiplicateurs du Fusil : dégâts, cadence, portée, critique, perforation, dégâts aux cloisons, zoom, recul), `weapOf(S)`. Profils : Fusil 10 × 4,5/s, 150 m · Pistolet ×1,4 × 0,86, 60 m, +5 % critique · Assaut ×0,7 × 1,95 (≈ 8,8/s), 50 m · Sniper ×4,6 × 0,27, 160 m, +13 % critique (×3), traverse un zombie de plus, 3 dégâts aux cloisons. L'arbre « Fusil » vaut pour toutes. Les arbres d'armes du lobby ne sont pas repris (jeu non branché au lobby).
- Son de tir par arme, recul par arme, éclair au bout du canon de chaque arme. Test : `armes.js` (choix, lunette, cadence, mode « arrivent »).

## V2.3 (19/11) — bouton DEV sous la mini-carte (sa demande : « ajoute-moi un bouton dev en dessous de la minimap lorsqu'il est activé »)
- `#devB` (pastille rose « DEV ») sous la mini-carte, seulement quand le mode dev est activé (carte → réglages) et pendant une partie. Un appui ouvre `#devP` (deux colonnes, le jeu continue) : Images/s affichées ou cachées (`save.fps`, compteur moyenné sur 0,5 s à droite du bouton, sur le temps réel entre deux images), + 100 000 $, Tout au maximum, Invincible, Tuer tous les zombies, Jour suivant. Un nouvel appui sur DEV referme. Les mêmes outils restent dans la carte.
- Test : `devtest.js`. Capture : `shots/95-dev.png`.

## V2.4 (19/11) — outils dev rangés dans le bouton DEV (ses mots, énervé : « Enlève-moi ce charabia dans la minimap. Je t'ai demandé un bouton pour ranger ça… De plus mon mode fly ? Arbre max etc ? »)
- Erreur de ma part en V2.3 : j'avais laissé les outils dev dans la grande carte en plus du bouton. **La carte ne garde que l'interrupteur « Mode dev »** ; tous les outils sont dans le bouton DEV.
- Panneau DEV (3 colonnes, le jeu continue, réglages gardés dans `save.devOpt`), sur le modèle de L'Île des Cinq : Vol libre (Saut tenu monte, Sneak tenu descend, ×2,4, traverse tout, `inp.fly/up/down` dans `playerStep`), Invincible (gardé d'une partie à l'autre), Vitesse ×1/×2/×4 (plusieurs pas de simulation par image), Jours auto (lance le jour après 2 s de préparation), Arbre au max, Poser les tourelles (jusqu'à la limite, types en alternance, pas de mortier dans les couloirs), + 100 000 $, Tuer tous les zombies, Jour suivant, Aller au jour 6, Aller au jour 9, 20 envahisseurs (`S.devInv`), Un mastodonte (`S.devTy`), Images/s.
- Test : `devtest.js` (16 contrôles, vrais appuis). Capture : `shots/95-dev.png`.
- Leçon : quand il demande de « ranger » quelque chose dans un bouton, l'enlever de là où c'était ; et reprendre d'office les outils dev de L'Île des Cinq (vol libre, arbre max…) plutôt que le strict minimum.

## V2.5 (19/11) — portée des tourelles affichée (sa question : « c'est pas un peu fort que les tourelles ont un rayon d'attaque illimité ? » ; réponse : non, portées fixes — mitrailleuse 28 m (48 max), laser 36, mortier 9-62, lance-flammes 8,5 (13,7 max), la hauteur ne compte qu'à 12 % ; sa vidéo était avec l'arbre au max. Il a choisi l'option 1 : afficher la portée ; pas de baisse des portées pour l'instant)
- `sim.js` : `turretReach(S,s,ty)` → `{r, rmin, y}` : portée ramenée au sol (r² = portée² − 0,12 × hauteur²), distance minimale du mortier, hauteur du cercle (sol dehors, plancher de l'étage pour les couloirs).
- `scene.js` : au marteau, sur l'emplacement visé, disque pâle + bord (couleur du type, pulsé) et, pour le mortier, cercle de la distance minimale ; dessinés sans test de profondeur (vus à travers le parapet).
- `tpl.html` : la grande carte trace un cercle de portée autour de chaque tourelle posée (pointillés pour le minimum du mortier). La mini-carte n'en a pas.
- Sa vidéo (jour 7, mode dev, vol libre) : **60 img/s** sur son iPhone avec 40 zombies dans l'immeuble et l'arbre au max.
- Attention (déjà vu dans L'Île des Cinq) : un commentaire `//` ajouté en fin de ligne a avalé le code qui suivait sur la même ligne et cassé la page ; corrigé avant publication. Règle : commentaire sur sa propre ligne, ou seulement en fin réelle de ligne.
- Test : `portee.js`. Captures : `shots/96-portee-marteau.png`, `97-portee-dessus.png`, `98-portee-carte.png`.

## V3.0 (19/11) — menu façon L'Île des Cinq, héros, armes classiques (sa demande : « le menu… similaire à celui de l'île des 5 ; également les héros, élément important de notre jeu dans sa globalité ; les armes… refais-les-moi toutes en classique »)
- **Menu** (`#start`, `showStart`) : titre + Améliorations ; texte court ; une ligne Mode (Ils arrivent / Ils s'échappent) + Arme (4 puces, mode fuite) ; « Pars avec ton héros, ou touches-en un autre » + **Entrer** ; grille de 5 cartes `.pick` (nom à la couleur du héros, élément · rôle, kit en or, passif) : **toucher une carte choisit le héros et lance la partie** (comme le portail de L'Île des Cinq) ; Départ (jours) + chiffres ; Son et Mode dev en bas. En « Ils arrivent » : pas de cartes, une note (survivant d'origine, Missile + Onde). `save.hero`, `save.weap`.
- **Héros** (mode fuite seulement, `HEROS` dans `sim.js`) — les 5 éléments de L'Île des Cinq, kits refaits pour l'immeuble et la fuite :
  - **Braise** (Feu, Dégâts) : balles qui enflamment + éclaboussure ; *Brasier* (boule de feu, explosion puis flammes au sol) ; *Météores* (8 météores sur les zombies les plus près de s'échapper).
  - **Ondine** (Eau, Soutien) : soin rapide (+5/s après 1,5 s sans coup), balles qui ralentissent ; *Marée* (vague qui repousse vers l'immeuble) ; *Déluge* (8 s : dehors ralentis et rongés, ville et joueur soignés).
  - **Sylve** (Bois, Contrôle) : balles empoisonnées ; *Ronces* (roncier qui blesse, ralentit, entrave) ; *Gardiens* (3 arbres aux sorties chargées, flèches empoisonnées, 15 s).
  - **Roc** (Terre, Tank) : +50 PV, coups ×0,75 ; *Rempart* (mur de pierre dans la rue, retient la horde ; « Vise la rue » sinon) ; *Séisme* (secousse autour de l'immeuble).
  - **Volt** (Élec, Mobile) : sprint 8,6, balles qui sautent sur un voisin, −15 PV ; *Éclair* (bond de 14 m arrêté par les murs, invincible 0,6 s, utilisable aussi entre deux jours) ; *Orage*.
  - Compétence = bouton Missile (nom du héros, liseré à sa couleur, recharge en s) ; ultime = bouton Onde (charge en tuant). Double appui comme avant. La recharge suit l'amélioration du Missile, la puissance suit Missile (dégâts) et Onde (puissance) ; pas besoin de les débloquer.
  - `useHeroSkill`, `useHeroUlt`, `heroOnHit`, `heroStep`, `rampartBlock`, `heroHp`. Zombies : `psn` (poison), `root` (entrave). Joueur : `p.inv` (invincible).
- Tests : `herotest.js` (16), `menutest.js` (16). Captures : `shots/96-menu.png`, `97-hero-hud.png`, `98-menu-in.png`.
- **Armes classiques** (sa phrase : « je n'avais pas demandé de design de L'Île des Cinq, refais-les-moi toutes en classique ») : `gfx/models/mains.js` réécrit les 4 armes en armes modernes génériques (aucun modèle réel) — Pistolet polymère noir à deux mains ; Assaut sable, garde-main à rail, chargeur courbe, point rouge ; Sniper vert armée, longue lunette, levier à boule, bipied ; Fusil noir, viseur holographique. Gants tactiques et manches de veste (`manche`, `paumeM`, `ctx.H`). `vmArme` et l'ancien fusil supprimés. Le **marteau** (pierre à runes) devient un marteau de charpentier (tête d'acier, panne fendue, manche fibre jaune, poignée caoutchouc) ; la masse et le marteau prennent les mêmes bras (`bras` → `manche`).
- `scene.js` : `gfxGuns(hc)` refait les 4 armes + marteau + masse avec les couleurs `hc` ; tenue, visée et bout du canon viennent de la recette (`hold`, `aim`, `tip`). Plus de balancement en visée (la mire montait de ~14 px). `tpl.html` : `heroGear()` à chaque partie : manches à la couleur du héros (mélangée 50 % avec un gris), gants sombres ; gris sans héros.

## V3.1 (19/11) — menu : choisir sans lancer, photos des armes (ses demandes : « choisir son héros ne doit pas lancer la partie, cliquer sur le bouton commencer oui » ; « mettre des photos sur les armes dans le menu ? »)
- Toucher un héros ou une arme les **choisit** (entourés), sans lancer. **Commencer** (en haut à droite, à côté d'Améliorations) lance la partie ; la ligne du titre reste collée en haut quand on fait défiler la carte.
- Ordre : texte, Mode, « Choisis ton héros » (5 cartes), « Choisis ton arme » (4 cartes : photo, nom à la couleur de l'arme, dégâts · tirs/s · portée de base), jours, chiffres, Son / Mode dev. « Ils arrivent » : ni héros ni armes.
- Photos : `photos.js` rend chaque arme seule (gants et manches retirés grâce à une couleur témoin), de profil, sur fond magenta ; `photos.py` rend le fond transparent, recadre en 240 × 90, réduit la palette → `gfx/photos.js` (`WPHOTO`, ≈ 13 Ko, ajouté par build.py). À relancer (`node photos.js && python3 photos.py && python3 build.py`) si un modèle d'arme change.
- Test : `menutest.js` (18). Capture : `shots/96-menu-choix.png`.

## V3.2 (19/11) — la campagne affichée au menu (sa demande : « dans le menu de l'île des 5 il y a tout plein de niveaux, ajoute-les ici aussi ; n'ajoute pas de map derrière, laisse que le niveau 1 jouable, c'est juste pour afficher dans le menu, on complétera plus tard »)
- Bloc « Campagne » repris de L'Île des Cinq (mêmes styles `#sCamp`) : 5 colonnes Eau, Feu, Élec, Terre, Bois (couleurs des héros), 4 niveaux chacune, le 1 en bas et plus gros, niveaux fermés grisés, ✓ sur les niveaux finis, choisi en or. Mode fuite seulement, entre les héros et les armes.
- Choix de ma part : les cinq niveaux 1 sont ouverts et jouent tous la ville actuelle (aucune carte ajoutée) ; les niveaux 2 à 4 sont fermés (« bientôt »). `CAMPL=1` = nombre de niveaux ouverts par type. `save.stage` ('eau1'…), `save.camp[type]` = plus haut niveau fini (marqué au jour 10 tenu, hors partie sans fin). Rien d'autre ne dépend du niveau choisi pour l'instant.
- Test : `menutest.js` (22). Capture : `shots/99-campagne.png`.

## V3.3 (20/11) — jour 1 sans tourelle (sa demande : « il faudrait spawn sans tourelle j1, elle fait tout le boulot »)
- Mode fuite, partie qui commence au jour 1 (hors sans fin) : **aucune tourelle le jour 1** (`turOff(S)` dans `sim.js` ; `buildTurrets` ne pose rien). Le Marteau refuse (« Jour 1 : pas de tourelle, c'est à toi de jouer. Elles arrivent au jour 2. »). Les tourelles du plan (`save.layout`, gardé tel quel) reviennent au début du jour 2. Départ au jour 2 ou plus : comme avant. « Ils arrivent » : inchangé.
- Pour qu'on puisse le tenir seul, le jour 1 sans tourelle est plus petit : **70 zombies qui sortent en 70 s** (au lieu de 120 en 37 s) — `J1` dans `sim.js`, `dayN`, `dayDur`. Banc (joueur simulé qui se sert aussi de son héros, 6 parties par héros) : précision 0,35 → Braise, Sylve et Volt passent 6/6, Ondine 5/6, Roc 2/6 ; précision 0,5 → tous 6/6 (ville 81-100). 120/37 s était impossible à 0,35 pour Roc et Volt. Script : `/tmp/j1.js` (non gardé), idée reprise dans `simtest.js`.
- Tutoriel du mode fuite : « Le premier jour, pas de tourelle : ton héros et ton arme. Touche « Lancer le jour ». »
- **`simtest.js` réparé** : le joueur simulé du mode fuite se plaçait encore au bord de l'ancien toit (6,5 m) depuis l'immeuble agrandi (V1.6) et ne touchait plus rien (0 tué). Il se place maintenant à B − 1,6 m. Les bancs d'équilibre du mode fuite faits entre V1.6 et V3.2 n'étaient donc pas fiables.
- `herofx.js` : le contrôle du son de la flèche a raté une fois sur cinq (bruit tiré au hasard, sous le seuil) ; à surveiller, rien de cassé.

## V3.4 (20/11) — l'escalier qui porte, l'escalade (ses mots : « les escaliers ne sont pas assez agréables et fluides à utiliser ; rester bloqué sur le toit / balcon c'est frustrant. Faudrait un système d'escalade ? Peut-être à débloquer »)
- **Escalier qui porte** (les deux modes : l'immeuble et les déplacements sont communs) : `SP` = un seul chemin du hall du rez-de-chaussée au toit (volée A, palier, volée B, devant de la cage, porte suivante… puis cabanon). `glideStep` : dans la cage, pousser le joystick dans le sens des marches (|cos| > 0,5) suffit — on suit le chemin à la vitesse de marche ou de sprint, sans frotter les murs, l'écart au milieu des marches se résorbe (×10/s), la caméra prend les virages (×5/s, on peut regarder ailleurs). Joystick lâché : on reste où l'on est. Pousser à l'envers : on repart dans l'autre sens.
  - À chaque étage, en sortant de la cage : **tout droit = on sort dans le hall** (le chemin lâche) ; **un coup de caméra de 90° vers la porte voisine = on continue** (le chemin longe la cage et rentre par la porte suivante ; `glF`). Hors de la cage, on n'est pris que si l'on pousse franchement dans l'axe (|cos| > 0,75, à moins de 0,4 m). Saut : on lâche le chemin.
  - Banc (`/tmp/esc/glide2.js`) : rez-de-chaussée → toit en 15 s avec un coup de caméra par étage ; avant seul = un étage puis sortie.
- **Escalade** (mode fuite ; case **Escalade** de la branche Survie, après Gilet, 120 $, niveau 2 = plus vite : 5,5 → 8,5 m/s le long du geste) : `climbSpot` / `startClimb` / `climbStep`.
  - Au bord du toit (à 1,5 m du parapet) ou d'un balcon (à 1,4 m du garde-corps), face au vide et **en regardant vers le bas** : **Saut devient « Descendre »** → par-dessus le garde-corps, jusqu'au balcon du dessous (ou la rue depuis le 1er). Sur un balcon (n'importe où) ou dans la rue au pied de l'immeuble (à moins de 4,9 m de la façade), **en regardant vers le haut** : **« Grimper »** → balcon du dessus (par l'extérieur du garde-corps), ou le toit depuis le 4e (par le mur). Environ 1,2 à 1,5 s par étage au niveau 1.
  - Pendant le geste : on ne tire pas, l'arme est baissée (pose du sprint), aucune collision (on passe les barrières invisibles), on atterrit à 1,3 m de la façade.
  - Pas débloquée : le bouton reste « Saut » ; le premier Saut à un bon endroit affiche « Escalade : à débloquer dans Améliorations (branche Survie) » (une fois par partie).
- `sim.js` : la fin de `playerStep` est devenue `finishP` (commune à la marche, à l'escalier et à l'escalade). Joueur : `gl`, `glF`, `clb`.
- Test : `climbtest.js` (9). Captures : `shots/100-escalade.png`, `101-arbre-escalade.png`.

## V3.5 (20/11) — les boutiques (sa demande : « tu vois dans Warzone en multi, il y a des grosses caisses au sol en mode boutique ? Il faudra ça pour les améliorations ! Une sur le toit et une tout en bas »)
- Mode fuite : deux **boutiques** façon « buy station » de Warzone (`SHOPS` dans `immeuble.js`) : sur le toit (4,6 ; −4,6, à droite du départ, écran tourné vers lui) et au **rez-de-chaussée** dans le hall (−4,4 ; −4,6, à gauche de la sortie de l'escalier). Caisse militaire vert olive, bandes jaunes et noires, pupitre à écran vert lumineux, gyrophare, losange « $ » vert qui tourne au-dessus (`MODELS.boutique` dans `gfx/models/toit.js`). Boîte solide pour le joueur et les zombies (`t:'shop'`), mais pas pour les balles ; absente en « Ils arrivent » (`o.dead`).
- **En partie, les améliorations ne s'achètent plus qu'aux boutiques** : à 2,4 m d'une boutique (même étage), le bouton du haut à droite apparaît, nommé « Boutique », **à tout moment** (entre deux jours et pendant le jour) ; il ouvre l'arbre (le jeu se met en pause). Ailleurs, pas de bouton (`treeBtn`). Au menu et à l'écran de fin, « Améliorations » reste. « Ils arrivent » : inchangé (bouton entre deux jours).
- Carte et mini-carte : un carré vert (« $ » sur la grande carte) à chaque boutique, plein sur ton étage.
- Message du jour 2 (premières parties) : « Pour dépenser ton argent : va à une boutique, sur le toit ou au rez-de-chaussée ».
- `shopNear(S)` dans `sim.js`. Test : `shoptest.js` (10). Captures : `shots/102-boutique-toit.png`, `103-boutique-pres.png`, `104-boutique-rdc.png`.

## V3.6 (20/11) — les tyroliennes (ma liste d'idées, son choix : « 5 go »)
- Mode fuite : **4 tyroliennes**, une par avenue (`ZIPS` dans `immeuble.js`). Poteau au bord du toit (à 1,1 m du parapet, 3,5 m à droite du milieu de la façade), câble jusqu'à une **passerelle d'acier qui enjambe l'avenue** à 57 m de l'immeuble (tablier de 15 × 2,5 m à 7 m de haut, garde-corps jaunes, quatre pieds avec échelons ; `MODELS.tyro` dans `gfx/models/toit.js`). Passerelles et poteaux absents en « Ils arrivent » (`o.dead`, `FLOORS[].off`).
- Au pied d'un poteau, face au câble (regard pas trop bas) : **Saut devient « Tyrolienne »**. On glisse dans les deux sens : descente vers la passerelle ≈ 5 s (jusqu'à 13 m/s), remontée ≈ 6 s (9 m/s), ralenti à l'arrivée. **On peut tirer en glissant.** Saut pendant le trajet = **« Lâcher »** : on tombe dans la rue (pas de dégâts de chute).
- Les **échelles des passerelles sont libres** (pas besoin de l'Escalade) : dans la rue au pied d'une passerelle en regardant en haut = « Grimper » ; sur la passerelle au garde-corps en regardant en bas = « Descendre ». L'escalade de l'immeuble reste à débloquer.
- Cartes : les câbles en traits dorés, les passerelles en rectangles.
- Bouton Saut : les noms longs (Tyrolienne, Descendre) passent en 11,5 px pour tenir dans le quart de rond.
- `sim.js` : `zipSpot`, `startZip`, `zipStep`, `zipLetGo`, `passSpot` (échelles, `free:1`). Joueur : `zip`. Test : `ziptest.js` (5) ; banc `/tmp/esc/zip.js` (4 tyroliennes aller-retour, lâcher, échelles). Captures : `shots/105-tyrolienne-depart.png` à `108-carte-tyroliennes.png`.
- Idées restantes de la même liste : bonus façon CoD Zombies, largage façon Warzone, zombies spéciaux du mode fuite, Pack-a-Punch à la boutique. Possible aussi : des emplacements de tourelle sur les passerelles.

## V3.7 (20/11) — ses trois demandes : « fais fonctionner les échelles que tu as mises en bas des tyros » ; « on ne peut pas sortir / entrer de l'immeuble par le rdc (mur invisible) » ; « mode dev : fly = double tap on / double tap off »
- **Échelles des passerelles = de vraies échelles** (`LADDERS`, `ladderAuto` dans `sim.js`) : 4 par passerelle (une à chaque pied, côté extérieur). Au pied, joystick vers l'échelle (cos > 0,6, à moins de 0,95 m, 0,12 s) : **on monte tout seul**, par-dessus le garde-corps, sur le tablier (≈ 2,7 s). Sur la passerelle au-dessus d'une échelle, joystick vers le vide : **on descend**. Pas de bouton, pas besoin de l'Escalade ; « Grimper / Descendre » en regardant + Saut marche toujours. Banc : 16 échelles sur 16 dans les deux sens.
- **Rez-de-chaussée ouvert en mode fuite** : la barrière invisible des rideaux de fer (ouvertures « vol », 3,6 m de large) est marquée `vol:1` et retirée en « Ils s'échappent » (les rideaux y sont relevés). « Ils arrivent » : inchangé (on ne sort pas).
- **Mode dev : deux appuis rapides sur Saut (< 0,35 s) = vol libre oui / non** (comme dans Minecraft), `toggleFly` ; le bouton du panneau DEV reste (« ou 2 × Saut »). Sans le mode dev : rien.
- Test : `v37test.js` (6). Captures : `shots/109-echelle.png`, `110-rideau-rdc.png`.

## V3.8 (20/11) — « Arbre à zéro » en mode dev (sa question : « on commence la boutique au max ou c'est moi ? »)
- Réponse : ce n'est pas le jeu, c'est sa sauvegarde : le bouton DEV « Arbre au max » écrit tous les niveaux dans la sauvegarde, pour de bon. Un nouveau joueur commence avec l'arbre vide.
- Ajout dans le panneau DEV : **« Arbre à zéro »** (`save.lv = {root:1}`, PV et tourelles recalculés, retour au Fusil si l'outil en main n'est plus débloqué ; l'argent n'est pas rendu). Le toast d'« Arbre au max » précise maintenant « gardé dans ta sauvegarde ».
- **Nouvelle page du jeu (20/11, son choix « Nouvelle page »)** : l'ancienne (`b89aa525-…`, lien Po9jSk1RHqKvTXMHmkAKrj) est passée en public, donc figée en V3.7. La V3.8 est sur une **nouvelle page privée** : https://claude.ai/artifact/S9h27b9tyeDbFXezXbN97a — slug `cbab1451-766d-41d1-a3db-c7c87cd19f85`, version `1795141290-e0c3`. Sauvegarde neuve (chaque page a la sienne). C'est désormais elle qu'on republie.

## V3.9 (20/11) — variantes de zombies, fusil à pompe, lance-flammes (sa demande : « ajoute les variantes de zombie ; ajoute nouvelle arme : fusil à pompe / lance-flammes »)
- **Variantes** (mode fuite seulement ; jamais le jour 1 sans tourelle ; `ZT[4..7]`, `VARD`, `ESC` étendu) — tirées à la place d'un rôdeur :
  - **Sprinteur** (4) dès le jour 2 (2 %/jour, 8 % au plus) : 10 PV, 6,3 m/s, fuyard qui coûte 6 à la ville.
  - **Casseur** (5) dès le jour 4 (jusqu'à 6 %) : 90 PV, costaud (×1,12), arrache les planches 4× plus vite, frappe le Rempart de Roc ×2,5, et **à l'intérieur cogne les cloisons qu'il a devant lui** (3 de dégâts toutes les 0,9 s : il ouvre des passages). Peut envahir les étages (comme toutes les variantes : la condition d'envahisseur est passée de `ty<3` à `ty!==3`).
  - **Porteur** (6) dès le jour 3 (jusqu'à 3 %) : 55 PV, 2,3 m/s, **30 $ (60 $ abattu par le joueur)**, mais 12 de dégâts à la ville s'il s'échappe.
  - **Hurleur** (7) dès le jour 5 (jusqu'à 2,5 %) : 40 PV ; toutes les 6 à 8 s il crie (`hurle`) : les zombies à 12 m (même hauteur) prennent 4 s de **hâte** (+50 % de vitesse, `Z.hst`).
  - La première de chaque sorte dans une partie est annoncée (`variant` → toast « SPRINTEUR : il fonce vers la sortie, abats-le vite »…). Bouton DEV « Les 4 variantes ».
- **Armes** (`WEAP.pompe`, `WEAP.lance`, choisies au menu comme les autres, 6 cartes sur 3 colonnes) :
  - **Fusil à pompe** : 8 plombs en gerbe (±4,3°), 6,2 de dégâts chacun au départ, pleins jusqu'à 6 m puis baisse jusqu'à 30 % à 30 m ; ~1 tir/s ; casse bien les cloisons (×2,2). Banc : 47 de dégâts par tir à 4 m, 21 à 15 m, 5 à 28 m (fusil : 10). `shootOne` (ancien corps de `shoot`) sert à chaque plomb ; événements `shot` (w:'pompe') + `pellet` par plomb.
  - **Lance-flammes** : 12 tics/s, cône de 10 m (~22°), 3,8 par tic à chaque zombie dans le cône sans mur devant (40 au plus par tic) + 2,5 s de brûlure ; ne casse pas les cloisons. `flameShoot` ; événement `shot` (w:'lance', flame:1).
- Test des règles : `v39sim.js` (12).
- **Apparence et effets** (deux agents en parallèle) :
  - Zombies (`gfx/models/toit.js` : tenues `e`–`h`, `ZRUN` ; `scene.js` : `ZSETS='abcdefgh'`, `zSet`, `ZPool`, section `zv…`) : **Sprinteur** veste jaune fluo à bandes, poses de course penchées ; **Casseur** casque jaune, gilet orange, gros gants, pied-de-biche ; **Porteur** gros sac d'argent **vert** avec « $ » et pièces dorées lumineuses (reflet qui scintille, billets qui tombent, gerbe de billets à sa mort) ; **Hurleur** blouse d'hôpital pâle, bouche ouverte, bras écartés ; cri = deux anneaux rouges qui s'élargissent à 12 m + son strident (`hurle`) ; zombies accélérés : yeux rouges et traînée (plafonnés). ≈ +20 appels de dessin quand tout est à l'écran. Test `variantes.js` (20). Captures `115`–`118`.
  - Armes (`mains.js` : `vm.pompe` 2 558 triangles, `vm.lance` 2 574 ; `scene.js` : `pompeShot`, `pelletFx`, `flameTic`, `gunFx`) : pompe = gros éclair, garde-main qui recule et revient (0,14 → 0,48 s), traçantes fines des plombs, sang ou poussière ; lance = jet de flammes depuis la buse jusqu'au point visé (≈ 55 flammes au plus), flammes écrasées sur les murs, veilleuse qui vacille. Sons : détonation + clac-clac calé sur la pompe ; souffle en boucle pour le lance. Photos du menu refaites (`photos.js` : `nophoto`, `photo:-1` pour photographier le flanc du réservoir). Test `armes2.js` (21). Captures `111`–`114` (+ b/c).
- Corrigé pendant la vérification : les **sauteurs des fenêtres** (surtout les sprinteurs, très rapides) pouvaient repasser au-dessus d'un balcon en tombant (`baltest.js`) : en l'air, ils restent au-delà du bord des balcons (`outWalk`). `herotest.js` : les passifs visent maintenant de vrais zombies (viser une zone fixe ne touchait plus rien depuis que le tirage des variantes a changé le hasard).

## V4.0 (20/11) — le grand nettoyage (sa demande : « s'que penses-tu du code de jeu ? » → ma proposition de nettoyage avant de le brancher un jour au lobby, sur le même moteur ; « Go » ; il a choisi de **garder « Ils arrivent » figé**)
- **Aucun changement de jeu**, sauf les corrections listées plus bas. Filet de sécurité : `tests/empreinte.js` (7 parties fixes rejouées au chiffre près), `tests/images.js` (21 situations 3D au pixel près), `tests/ecrans.js` (14 écrans d'interface au pixel près), et tous les anciens tests (`tests/tout.js`).
- **Nouvelle organisation** (voir `ARCHITECTURE.md`) : `regles/` (17 fichiers), `affichage/` (15), `sons/`, `interface/` (11 + `style.css` + `page.html`), `gfx/`, `tests/`, `outils/`. Chaque dossier a son `ordre.txt` et son `LISEZMOI.md`. Code mis en forme (prettier), commenté en français, noms locaux clairs, code mort retiré (`gfx/models/shared.js` et `enemy_b.js`, sons jamais joués, variables jamais lues…). Dépôt **git** local. Page publiée passée par esbuild (espaces retirés) : ~357 Ko.
- Fait par trois agents en parallèle (règles / affichage + sons + modèles / interface), sur un contrat commun (`CONTRAT-NETTOYAGE.md`), puis vérifié ici.
- **Corrections trouvées pendant le nettoyage** (commits à part) :
  - un achat à la boutique ramenait la vie max à la valeur de base (Roc perdait ses +50, Volt retrouvait ses 15) ;
  - le message « NOUVELLE ROUTE » disait « La est est ouverte » → « L'avenue Est est ouverte » ;
  - le panneau du jour (« Jour N · Lancer le jour ») passait sous les chiffres du haut à droite sur un écran étroit : il descend sous leur rangée ;
  - le **coup de caméra au départ du sprint**, prévu en V2.0 (sa remarque « pas d'à-coup à l'accélération »), n'avait jamais été branché : il l'est ;
  - les « gros » zombies sont une table (`BIG` : colosse, mastodonte, casseur) : sprinteur, porteur et hurleur ne passent plus pour gros (le Séisme les entrave au lieu de seulement les ralentir ; Météores et mortier ne les visent plus en priorité) — empreinte régénérée, seule la partie de Roc change ;
  - les taches de sang s'effacent à chaque nouvelle partie ;
  - le joueur mordu s'entend (le son existait depuis le début sans être joué).
- **Points fragiles notés, non corrigés** (détail dans `regles/LISEZMOI.md`) : tourelles laser et lance-flammes muettes (pas d'événement de tir) ; le cri du hurleur touche un carré et non un cercle ; en mode fuite, 65 % des zombies prennent la rue la plus proche (le bonus de la route du jour ne joue que sur le reste) ; `save.kills` jamais compté ; plusieurs tests de page attendent des durées fixes (ils échouent quand la machine est très chargée).

## V4.1 (20/11) — prêt pour le lobby (sa demande : « Les mêmes armes de ce mini-jeu, partout. Tu peux préparer ton partage sur Fable 5.2. Je lui transmets et il intègre le jeu au lobby. On continuera de taffer ensemble sur ce jeu ici après. »)
- **Décision** : les 6 armes de Dernier Toit deviennent les armes de tout le jeu (lobby, L'Île des Cinq, mini-jeux à venir) ; le système d'arbres d'armes du lobby reste.
- **Le branchement côté Dernier Toit** (contrat : `LOBBY.md`) : `build.py` écrit `dt-pour-lobby.js` (~380 Ko, une seule variable globale `DernierToit`), que le lobby colle tel quel ; `DernierToit.ouvrir(opts, rappels)` ouvre le jeu dans une iframe par-dessus l'île. Choix : l'iframe plutôt que mélanger les codes (≈ 390 noms globaux, des identifiants HTML communs comme `#bJump`), et pour qu'une nouvelle version se branche en remplaçant un seul fichier.
- Dans le jeu : `interface/lobby.js` (pas de menu de départ, « Ils s'échappent » forcé, héros et arme du lobby, « Retour au lobby », un message `fin` par partie), `bonusLobby` dans `regles/arbre.js` (dégâts, cadence, critique, vie, force et recharge du héros, gardés à chaque recalcul de `S.P`), encoche passée par le lobby (`--saT/--saB/--saL/--saR` dans `style.css`, car une iframe ne reçoit pas toujours `env(safe-area-inset-*)`). Sans lobby, rien ne change (empreinte, images, écrans identiques).
- Test : `tests/lobbytest.js` (page hôte minimale : lancement, bonus, encoche, abandon → un seul `fin`, retour, deuxième ouverture, page seule inchangée).
- `PASSATION.md` : la passation à Claude Fable 5.2 (aussi dans le projet Jv : `claude/passation-dernier-toit-lobby.md`).
- Pas vérifié : rien de tout ça sur l'iPhone (deux rendus WebGL, encoche dans une iframe, son, itch.io).

## V4.2 (23/11) — tout raccord avec le lobby (demande du lobby, `claude/demande-dernier-toit-synchro.md`, sa consigne : « fais tout ce qu'elle demande, en commençant par les points 6 et 7 »)
- **Point 6, mourir ≠ perdre** (sa demande du 22/11) : les deux voies combinées. En « Ils s'échappent », le joueur tombé se relève tout seul sur le toit au bout de `RELEVE` = 8 s (comme le héros de L'Île des Cinq), avec toute sa vie et 2 s d'invincibilité ; pendant ce temps rien ne bouge, pas de tir ni de compétence, la horde file (c'est le prix). Voile « Tu es tombé · De retour sur le toit dans N s ». Seule la ville finit la partie. L'écran de fin devient une **paie** : « + N $ » en gros, « Améliorer l'immeuble » en premier bouton, « Repartir plus fort ». « Ils arrivent » (figé) garde la défaite. Règles : `p.down`, `releve` (joueur.js), `hurtP` (degats.js), événements `tombe` / `releve`.
- **Point 7, le Guide « Règles »** : le personnage du lobby (`gfx/models/pnj.js`, tel quel) sur le toit près du départ, étiquette « RÈGLES », bouton « Règles » quand on est près de lui, fiche à cinq onglets (Le but · Perdre · Commandes · Ce jeu · Ce que ça rapporte), tutoriel lançable depuis la fiche. Fait par un agent sur une copie à part, fusionné ensuite (voir le commit).
- **Points 0 à 4** : `DernierToit.accepte`, rang (`RANGK`, `S.rangK` : vie des zombies), arbre du héros et balles (`heroMods`, `S.hm`), bourse (`bonus.argent`), niveaux (écran de fin), `pret` à chaque partie, `fin` avec `depart`, `boss`, `duree` (temps en journée, `S.jeuT`), `chutes`, `rang`, `dev` (`S.devUse`, `save.devDon`). Contrat : `LOBBY.md`.
- **Point 5** (où vit la progression) : rien changé, l'argent `$` et l'arbre de l'immeuble restent dans Dernier Toit (piste 2, la lecture du lobby, conforme à sa phrase « gagner de l'argent pour rejouer plus fort »).
- Sans lobby, les parties sont les mêmes au chiffre près (`tests/empreinte.js`), sauf la mort en mode fuite.
- Tests : `tests/synchrotest.js` (19 vérifications), `tests/guidetest.js`.

## V4.3 (23/11) — le multi sur le toit (demande du lobby `claude/demande-dernier-toit-multi.md`, lobby V10.5 ; Frédéric : « Go », « mets autant d'agents que nécessaire, mais fais très vite »)
- Plan commun : `MULTI.md`. Trois agents en parallèle sur trois copies du dépôt, puis fusion : règles (`regles/multi.js`), interface et réseau (`interface/multi.js`, pont), affichage des autres joueurs (`affichage/joueurs.js`, corps `hero.avatar` du lobby avec `gfx/models/shared.js` repris tel quel).
- Rôles : l'hôte (plus petit `depuis`) fait tourner la vraie partie ; les invités recopient son instantané (jusqu'à ~266 zombies proches + ~185 lointains en 3 000 caractères au jour 10, où ~1 600 sont en vie) et ne font avancer que leur joueur ; leurs coups, compétences, ultimes, leurres, frappes, planches passent par l'hôte en actions numérotées. L'hôte part → le suivant reprend (`reprendHote`). Horde +50 % par joueur en plus (`hordeK`, `S.nJoueurs`).
- Chacun garde ses tués et son argent, et envoie son propre `fin` (avec `joueurs`, `hote`).
- Pas fait : les zombies dans l'immeuble ne chassent que l'hôte ; les tués par la compétence/l'ultime d'un invité ne lui rapportent rien ; les balles d'un invité n'abîment pas les cloisons ; chez l'invité, seules les explosions de l'hôte sont recopiées (pas ses traçantes ni ses éclairs).
- Tests : `tests/multiregles.js` (45), `tests/multitest.js` (deux cadres et un facteur, 34, avec les vraies règles), `tests/joueurstest.js` (23). Rien sur un vrai réseau ni sur deux téléphones.

## V4.4 (23/11) — les trous du multi comblés (sa demande : « Go faire ça ! »)
- **Les zombies de l'immeuble chassent aussi les invités** : l'interface de l'hôte pose `S.mInvites` (places reçues) ; `majCibles` (regles/multi.js, appelée par boucle.js) en fait des cibles avec niveau, volée d'escalier et champ de marche ; `insideStep` / `stairStep` prennent la cible la plus proche (`mCible`, même étage d'abord). Les morsures des invités restent calculées chez eux.
- **Les tués des compétences, ultimes, leurres et frappes d'un invité lui reviennent** : pendant l'action (`mAction`) `S.mOwn` = son id, et les effets créés (boules de feu, feux, ronces, météores et leurs bombes, gardiens, orages, bombes, Déluge) portent `own` ; `killZ` met ces tués et leur argent dans `S.mCredits[id]` au lieu de les donner à l'hôte ; l'hôte publie `cr: { id: [tués, argent] }` dans son état, l'invité ajoute la différence à ses tués et à son argent.
- **Ses balles et sa masse abîment les cloisons** : `wallDmg` chez l'invité → action `['m', seq, morceau, dégâts, …]` → `wallDmg` chez l'hôte ; l'instantané montre la cloison cassée à tous.
- Sans multi, rien ne change (`tests/empreinte.js`). Tests : `tests/multiregles.js` (49), `tests/multitest.js` (35).


## V4.5 (24/11) — l'écran de jeu au modèle de L'Île des Cinq V1.2 (sa demande : « Lis `claude/mini-jeu-contrat-lobby.md`, section "L'ATH par défaut", et mets l'écran de Dernier Toit au modèle de L'Île des Cinq V1.2 » ; sa décision du 24/11 : « Dès qu'on crée un nouveau monde on part sur celui-ci »)
- Modèle relevé sur le fichier du lobby de L'Île des Cinq V1.2 (atelier `63994a55-…`, `ile-pour-lobby.js`, ouvert dans une page hôte et capturé à 844 × 390 et 840 × 333) et sur son `style.css`.
- **Haut** : plus de bandeau « JOUR N · X restants · Vivants · tués · échappés · dans l'immeuble » pendant le jour (`#wave.vide`) ; le panneau ne sert plus qu'entre deux jours (aperçu, « Lancer le jour »), au jour tenu et à l'arrivée de l'hélico. Les zombies restants sont un chiffre de plus en haut à droite (« Zombies », `#sLeft`, pendant le jour), et ceux entrés dans l'immeuble aussi (« Dedans », `#sIn`, en rouge, seulement s'il y en a : l'écart voulu par ce jeu, l'invasion des étages étant sa zone de défense). Chiffres plus serrés (14 px, petites légendes 10 px). Le bouton Boutique / Améliorations, plus petit, pâlit quand rien n'est achetable et se dore sinon (comme le Marchand).
- **Vie** : en mode fuite, plus de chiffre « Vie » en haut (la Ville reste) ; la vie est une barre fine sans chiffres, tout en bas sous la barre d'outils. « Ils arrivent » garde le chiffre « Vie » en haut (la vie y est la partie).
- **Gauche / milieu** : l'étiquette d'action n'est plus un pavé à gauche des boutons : une ligne sans cadre sous le viseur (« Toit · bord nord · Mitrailleuse »), orange quand la pose est refusée. Le joystick est à peine visible au repos (0,32) et s'allume sous le pouce.
- **Bas** : barre d'outils et choix des tourelles un peu plus petits (cases 54 × 40).
- Fiche « Règles », Ce jeu, « Dans l'immeuble » : une phrase sur le chiffre « Dedans ».
- Règles inchangées (`tests/empreinte.js`). Nouveaux : `tests/athtest.js` (11 vérifications), `tests/shothud.js` (captures aux tailles de son téléphone, comme celui de L'Île des Cinq). `tests/sprinttest.js` lit maintenant la classe `sprint` parmi d'autres (le joystick porte aussi `on`). Références des écrans refaites (`ecrans.js --ref`).
- **Non vérifié** : rien sur son téléphone. Les commandes universelles ne bougent pas (pas de Renfort ici : il est propre à L'Île des Cinq).
- Test fragile vu en passant (pas lié à cette version, aucun son touché) : `sndtest` « masse dans un mur plus sourde » rate environ une fois sur cinq, même seul (bruit tiré au hasard) ; le relancer seul avant de conclure.

## V4.6 (25/11) — à plusieurs, chacun ses tourelles
- Son retour (25/11, 03 h 52, à deux sur itch.io, capture à l'appui : « 2 sur le toit », jour 3, Ville 12, marteau sur « Toit · bord est · Mortier → Laser » sans tourelle dessus) : « À 2 c'est pas mal mais on n'a pas dépassé la vague 3. Les mortiers et tout sont invisibles, voire inactifs je crois. Ça ne m'a pas permis d'avoir une analyse plus poussée, vu que c'était relativement dur sans défense. »
- Cause : il était invité ; seul le plan de l'hôte était posé dans la partie (MULTI.md : « l'immeuble (tourelles, planches) est celui de l'hôte »). Ses 10 tourelles n'existaient que sur son écran de marteau.
- Correction : l'invité publie son plan et ses niveaux de tourelles ; l'hôte les pose après les siennes sur les emplacements libres, les fait tirer avec les chiffres de l'invité et lui compte leurs tués (détail : MULTI.md, « V4.6 »). Un emplacement pris par la tourelle d'un autre est marqué au marteau. Solo inchangé (`empreinte`).
- En passant : l'étiquette sous le viseur avait un espace de trop avant le « · » (vu sur sa capture).
- Non vérifié : rien à deux téléphones ni sur un vrai réseau ; seulement deux cadres dans une page (multitest).
- Piège vu en refaisant les références des écrans : `ecrans.js --ref` a une fois capturé l'écran 11 avec la mini-carte pas encore redessinée (celle de « Ils arrivent »). Après un `--ref`, regarder `tests/ecrans-ref/11-hud-fuite.png` (mini-carte avec les tyroliennes) avant de valider.

## V4.7 (25/11) — escalade offerte, tyrolienne à débloquer, grappin, balles spéciales
- Sa demande (25/11, 19 h 44) : « Il faudrait aussi que sauter d'étage en étage soit gratuit de base, et la tyrolienne, elle est déblocable. Et si tu peux ajouter des améliorations d'arme fun, des nouvelles armes, un grappin etc. »
- **Escalade offerte** (plus de case ; `S.P.grimpe.on` toujours vrai, 5,5 m/s). **Tyrolienne** à débloquer à sa place dans l'arbre (case `m_tyro`, Survie, 120 $ ; `S.P.tyro.on` ; sans elle, au poteau, Saut reste un saut et un message dit où la débloquer). Conversion au chargement (interface/sauvegarde.js) : qui avait l'ancienne Escalade garde la Tyrolienne, et son niveau 2 (264 $) lui est rendu.
- **Grappin** (case `m_grap`, Survie, après la Tyrolienne, 450 $ ; niveau 2 : 45 m au lieu de 30, plus vite, recharge 0,8 s au lieu de 1,5) : un sixième outil de la barre (mode fuite). On vise une façade, un balcon (même par en dessous), le toit, une passerelle ou la rue ; l'étiquette sous le viseur dit où il mène (« Grappin · vers le balcon du 3e ») ou « rien à attraper ». Action : traction (un geste d'escalade rapide, `p.clb` avec `gr` = point d'accroche), corde et crochet dessinés (affichage/armes.js `grappinFrame`). Sur une façade, on se pose sur le sol le plus proche du point touché (balcon au-dessus ou juste en dessous, toit par-dessus le parapet). Pas de plafond dans l'immeuble (par une fenêtre, on touche souvent le plafond d'un étage : rien). Règles : regles/escalade.js `grappinVise`, `useGrappin` ; modèle `vm.grappin` (gfx/models/mains.js).
- **Trois balles spéciales** (branche Fusil, valent pour toutes les armes à balles, mode fuite) : **Arc électrique** (`f_arc`, sous Calibre : une balle sur cinq qui touche lance un éclair vers 2 zombies proches, +1 par niveau, 80 % des dégâts) ; **Ricochet** (`f_rico`, après Perforant : quand la balle tue, elle rebondit sur le plus proche, 70 % des dégâts, et repart si elle tue encore ; 1 rebond par niveau) ; **Balles incendiaires** (`f_feu`, après Balles explosives : 8 % par niveau d'enflammer, et le feu gagne les voisins). Pour la pompe : ricochet et arc sur le premier plomb seulement. Règles : regles/armes.js `shootOne`, `balleSaute`.
- **Nouvelles armes : non.** Question posée (armes pour tout le jeu, ou armes de partie à la boutique) ; sa réponse (25/11) : « Oublie les nouvelles armes ».
- Tests : `tests/v47regles.js` (19, règles), `tests/grappintest.js` (7, page + captures shots/grappin-*.png) ; `climbtest`, `ziptest` revus (escalade sans case, tyrolienne à débloquer). Écrans refaits (arbre : Tyrolienne à la place d'Escalade).
- Non vérifié : rien sur son téléphone.

## V4.8 (27/11) — rôles et éléments, première livraison : Zéphyr, l'élément de l'arme, le Vent, la prédilection
- La demande du lobby (Abtest. V12.2, `claude/demande-dernier-toit-roles-elements.md`, avec `claude/refonte-roles-contrat.md`) ; sa phrase : « Lis … puis fais ce que la demande dit. Livre en plusieurs fois si c'est plus rapide. »
- **Zéphyr** (`vent`, Tireur, `#8fe6dc`) : passif +20 % au-delà de 30 m (balles ; +5 points par `pA`) ; **Rafale** (`rafale()`, regles/heros.js) : bond en arrière de 8 m (+ `kLen`), arrêté par les murs, petit saut, permis entre deux jours comme l'Éclair, pas en grimpant ni sur la tyrolienne ; `kPush` repousse de 5 m ce qui est à moins de 5 m du départ ; **Tir perçant** (`tirPercant()`) : la ligne de l'œil (jusqu'au sol ou 200 m), à travers les murs ; 160 × force de l'ultime × vie du jour × (1 + `uDmg`), largeur 1,5 m + `uRad`. Corps des autres joueurs : `hero.avatar` palette `vent`, motif `gust` (kit.js et models/shared.js recopiés de l'atelier du lobby).
- **L'élément de l'arme** (`S.elArme`) : celui du lobby (`opts.elementArme` → `elementArmeLobby`), sinon celui du menu (« Balles : », sous les armes, `save.elArme`), sinon celui du héros. `heroOnHit` → `effetBalle` : l'effet de l'élément de l'arme avec la branche `bonus.balles`, plus le passif du héros à ses chiffres de base (pas Roc ni Zéphyr). **Vent** : +1 zombie traversé (+ `ePierce`), les petits soulevés (dehors : `Z.root` 0,6 s + `eLift` ; dedans : ralentis ; affichage : ils montent de 55 cm, HX.lev0 / lev1).
- **Prédilection** : arme de l'élément du héros, +10 % (balles et lance-flammes, `predilK`). Par défaut l'élément est celui du héros : **toutes les parties avec héros font 10 % de plus qu'en V4.7** (empreinte refaite : seules « fuite j6 Sylve lance-flammes » et « fuite j9 Ondine assaut » bougent, vérifié en remettant ×1).
- **Nature** à la place de Bois ; rôles du contrat (Braise Mage, Ondine Support, Sylve Combattant, Roc Tank, Volt Assassin, Zéphyr Tireur) : cartes du menu (rôle d'abord, six colonnes), Guide (« Ton héros » : nom, rôle, élément, passif ; nouvelle entrée « Les éléments »), écran de fin (« Zéphyr, Tireur · balles de Vent (+10 %) » ; au lobby « Zéphyr, Tireur niv. 4 · Fusil de sniper niv. 3 de Vent »), étiquette des autres joueurs (nom, et le rôle dessous).
- Lobby : `DernierToit.HEROS` avec `vent`, `'elementArme'` dans `accepte` ; `pret` et `fin` portent `elementArme`. Multi : la compétence et l'ultime d'un invité emportent ses cases (`MHMA`, regles/multi.js) ; un coup d'invité peut porter l'effet 8 (soulevé).
- Tests : `tests/v48regles.js` (21, règles), `tests/rolestest.js` (13, page hôte du lobby) ; `menutest` (6 héros, les balles au choix, Zéphyr), `synchrotest` (accepte, ligne de fin) ; empreinte refaite.
- Deuxième livraison (à faire) : les voies (`opts.voie`, `spA1`…`spB2`), l'ultime teinté par l'élément de l'arme.
- Non vérifié : rien sur son téléphone ; le Tir perçant et la Rafale vus seulement sous three-lite.

## V4.9 (27/11 au soir) — rôles et éléments, deuxième livraison : les voies et l'ultime teinté
- Sa réponse « Go » à « Je passe à la deuxième livraison ? ». Le point 6 de `claude/demande-dernier-toit-roles-elements.md` ; les valeurs par niveau des cases sont celles de l'atelier du lobby (`interface/roles.js`, copie dans `/home/claude/lobby-ref`) : Roc spA1 1, spB1 2 ; Sylve spA1 25, spB1 2 ; Volt spA1 0,2, spB1 0,15 ; Braise spA1 5, spB1 1 ; Ondine spA1 0,15, spB1 0,5 ; Zéphyr spA1 0,1, spB1 0,08 ; les cases 2 valent 1. `spA1` plafonné à 100 (la vie du Colosse), les autres à 30.
- **Nouveau fichier `regles/voies.js`** : `VOIES` (nom, effet ici, deux cases), `voieDe`, et toutes les règles des voies, appelées depuis heros.js (compétences, ultimes, rempart), armes.js (`voieDegats`, `voieAcheve`, portée, tir chargé), joueur.js (`voieJoueur`, `cadenceVoie`, `voieTir`, `soinK`), degats.js (`voieCoup`, `voieTue`, `teinte`), capacites.js (météores teintés, Sol en feu). `S.voie` (newRun, depuis `voieLobby` : `opts.voie.id`) ; `heroMods` ne garde que les cases de la voie jouée.
- Les adaptations à la ville (le tableau complet est dans `LOBBY.md`, « V4.9 ») : Gardien = rempart plus large et plus solide (+ renvoi) ; Avant-garde = rempart qui charge 6 m dans la rue (`chargeRempart`, `wall.ch`) ; Colosse = +25 vie (+ soin au contact) ; Plongeur = les Ronces deviennent un bond (`plonge`, téléporté comme l'Éclair) ; Lame = +50 % sur un isolé (+ exécution sous 15 %) ; Escarmoucheur = 2,5 % de recharge par tué (**le chiffre du lobby / 10**) (+ relance) ; Artilleur = +10 m de portée des armes à balles (pas le lance-flammes : sa flamme dessinée ne suit pas), feu du Brasier 6 m (+ météores qui laissent du feu) ; Mage de bataille = aura de 3 m (+ coups −25 %) ; Soigneuse = soins +20 % (+ bouclier de 30, Ondine seule ; barre bleue sur la vie, `#hpS`) ; Entraveuse = la Marée immobilise (+ Déluge qui immobilise) ; Sniper = +15 % au-delà de 40 m (+ tir chargé : 1 s en visée, réticule turquoise, `inp.ads`) ; Mitrailleur = cadence +10 %, +10 % en courant (+ montée jusqu'à +40 %).
- **Ultime teinté** : seulement si l'élément de l'arme n'est pas celui du héros (sans `elementArme`, rien ne change : l'empreinte n'a pas bougé). `S.ultEl` posé pendant que l'ultime frappe (et sur ce qui dure : météores, Déluge `S.floodEl`, gardiens, orages) ; `hurtZ` → `teinte` → `effetBalle` (une fois par seconde par zombie, `S.teintT` ; dégâts de l'effet plafonnés à 60 × vie du jour). Affichage : second anneau et second voile à la couleur de l'élément.
- Lobby : `'voie'` dans `accepte` ; `pret` et `fin` portent `voie` ; écran de fin « Roc, Tank (Avant-garde) niv. 11 » ; Guide « Ta voie, … ». Multi : actions `c` / `u` + voie et élément de l'arme (a[10], a[11]), `MHMA` + les quatre cases ; les remparts sont à leur auteur (`MOWN`).
- Tests : `tests/v49regles.js` (38), `rolestest` (22 : + Roc en Avant-garde depuis la page du lobby, réticule du Sniper, aura, barre du bouclier).
- Non vérifié : rien sur son téléphone ; les voies n'existent qu'au lobby (pas de choix au menu de la page seule).
