# affichage/ — l'affichage 3D de Dernier Toit

Tout ce qui se voit : la ville, l'immeuble, les zombies, l'objet en main, les tourelles, les effets (sang, feu, fumée, éclats…),
les héros, les variantes de zombies. three.js r128 et le kit 3D `K` (`gfx/kit.js`) ; dans les tests, `gfx/three-lite.js` remplace three.js.

- **L'affichage ne fait que dessiner** : il lit l'état de la partie `S` et ses événements `S.ev`, il n'écrit jamais dans `S`
  (les règles tournent sans lui, sous Node). Son état à lui est dans `G` (et `HX` pour les héros, `ZV` pour les variantes).
- **Rien n'est créé pendant une image** : tout ce qui est dessiné en nombre vit dans des réserves fixes créées au départ
  (`IPool` : un maillage instancié = un appel de dessin ; particules : un `Float32Array` par sorte). Une réserve pleine refuse ou
  reprend la plus ancienne place ; les plafonds sont écrits en tête de chaque fichier. Aucune lumière n'est ajoutée en cours de partie.
- Les fichiers sont collés dans l'ordre de `ordre.txt` et partagent **une seule portée globale** avec `regles/`, `sons/` et `interface/`.
  L'ordre ne compte que pour ce qui s'exécute au chargement (ici seulement les `MODELS['hx.…']` de `heros-modeles.js`, et des constantes).
  **Un nom utilisé hors d'`affichage/` ne se renomme pas** (`gfxInit`, `gfxFrame`, `gfxEvent`, `gfxGuns`, `gfxResize`, `camera`, et ce
  que lisent les tests : `G` et ses champs, `HX`, `ZV`, `ZVN`, `ZTY`, `zSet`, `partStep`, `hfxFrame`, `zvFrame`, `zvEvent`, `gunFx`, `flameTic`).
- Garde-fou : `node tests/images.js` (21 captures fixes, temps et hasard figés) doit donner 0 pixel changé après un nettoyage.

## La carte des fichiers

Dans l'ordre de `ordre.txt` (lignes après mise en forme prettier) :

| Fichier | Lignes | Ce qu'il contient |
|---|---|---|
| `outils.js` | 133 | `renderer`, `scene`, `camera`, `hemi`, `sun`, l'état `G` ; courbes `lerp`, `ease`, `easeO`, `easeB` ; `matAdd` (matière additive) ; `prepM` / `instM` (modèles de `MODELS` préparés par le kit, en cache) ; `setM` / `setMR` (matrices) ; `IPool` (réserve instanciée) |
| `boucle.js` | 153 | `gfxInit` (crée tout), `gfxResize`, `gfxFrame` (une image : appelle les `…Frame` de chaque fichier dans l'ordre), le ciel (`SKY`, `skyMix`, `cielFrame`), la caméra (`cameraFrame` : suivi de l'œil, secousses, recul, sprint, champ de vision) |
| `decor.js` | 126 | Ville, immeuble, volets, barricades, murs d'avenue et nids ; hélicoptère, leurre, tyroliennes, boutiques ; anneau de l'onde de choc |
| `cloisons.js` | 497 | Cloisons cassables (entières, abîmées, tombées → gravats), trous de balles, planches clouées, planche fantôme du marteau, planches arrachées qui volent ; `cloisonsEvent` (wallhit, wallbreak, plank, tear) |
| `zombies.js` | 95 | Les 48 réserves de zombies (8 tenues × 6 poses), `zSet` (tenue d'un type), dessin des vivants et des corps |
| `particules.js` | 251 | Particules (`mkPart`, `emit`, `partStep`), sang (`bloodBurst`, `splatAt`, `wallSplat`), éclairs (`flashAt`), traçantes, feux au sol, `floorY` |
| `tourelles.js` | 212 | Modèles des tourelles qui suivent la visée, rayons laser, flammes, obus de mortier, missiles ; portée et cercles des emplacements au marteau |
| `armes.js` | 193 | L'objet en main : `gfxGuns` (armes aux couleurs du héros), changement d'objet, visée, balancement, recul, sprint, recul près d'un mur, coup de masse, coups de marteau |
| `tirs.js` | 339 | Les tirs du joueur : `tirEvent` (éclair de bouche, traçante, impact), fusil à pompe (`pompeShot`, `pelletFx`), lance-flammes (`flameTic`), `gunFx` (pompe, veilleuse, jet) |
| `evenements.js` | 131 | `gfxEvent` : le tri des événements vers les fichiers, et les effets simples (explosions, chutes, onde, barricade, aube, masse…) |
| `heros-modeles.js` | 158 | Les modèles des effets des héros (`hx.rempart`, `hx.ronce`, `hx.arbre`, `hx.fleche`, `hx.meteore`, `hx.pic`, `hx.nuage`) |
| `heros.js` | 366 | Héros : plafonds `HXN`, couleurs `HXC`, réserves `HX` (`hfxInit`), petits outils (`hxRing`, `hxScorch`, `hxArc`, `hxSpike`, `hxVig`, `hxSeg`, `hxMeteorHit`, `hxSeisme`) |
| `heros-evenements.js` | 275 | `hfxEvent` : ce qui part d'un coup (boule de feu, météore, vague, ronces, flèche, rempart, foudre, bond, ultime) |
| `heros-image.js` | 668 | `hfxFrame` : ce qui dure, par héros (`hxFeuFrame`, `hxBoisFrame`, `hxTerreFrame`, `hxElecFrame`…), le Déluge, les teintes du ciel, le voile coloré |
| `variantes.js` | 230 | Variantes de zombies : cri du hurleur, yeux et traînées des pressés, or et billets du porteur (`zvEvent`, `zvFrame`) |
| `guide.js` | 88 | V4.2 : le Guide « Règles » sur le toit (mode fuite) : `MODELS['pnj.guide']` (gfx/models/pnj.js) à `GUIDEP` (interface/regles.js), étiquette « RÈGLES » (sprite), se tourne vers le joueur à moins de 15 m (`guideInit`, `guideFrame`, `G.guide`, `G.guideLab`) |
| `joueurs.js` | 345 | V4.3 (multi) : les autres joueurs, lus dans `joueursDistants()` (interface/multi.js ; absente = personne) : corps `MODELS['joueur.corps']` (le gardien `hero.avatar` du lobby aux couleurs de l'élément, jambes détachées pour la marche, sans son pistolet), arme `vm.<arme>` tenue à deux mains selon yaw et pitch, couché quand il est à terre, étiquette du nom (sprite, taille constante à l'écran), éclair de bouche et traînée quand il tire, jet du lance-flammes ; ajout, changement de héros ou d'arme, retrait (`joueursInit`, `joueursFrame`, `JR`, `G.joueurs`) |

Les modèles du monde et des objets en main sont dans `gfx/models/` (`toit.js`, `mains.js` ; `pnj.js` et `shared.js` repris tels quels du lobby) ;
les sons dans `sons/sound.js`.

## Le branchement avec l'interface

- `gfxInit(canvas)` une fois au chargement ; `gfxResize(largeur, hauteur)` quand l'écran change.
- `gfxEvent(ev, S)` pour chaque événement de `S.ev`, **avant** `gfxFrame` (l'interface joue ensuite le son et vide `S.ev`).
- `gfxFrame(S, dt, V)` à chaque image ; `dt = 0` en pause (l'image est redessinée, rien n'avance). `V` = ce que l'interface sait en plus :
  `{ sprint, tool, scope, hammer, aim, ptype, door, ads, zoom, bob, bobT }` (objet en main, lunette, marteau, emplacement et porte visés,
  type de tourelle choisi, visée, zoom, balancement de la marche).
- `gfxGuns(couleurs)` quand le héros change (manches et gants : `{ sleeve, sleeveD, glove, gloveD }`, rien = gris).
- Pour les tests : `window.__cam = { x, y, z, yaw, pitch }` place la caméra où l'on veut.

### L'ordre d'une image (`gfxFrame`)

ciel → caméra → cloisons et planches → zombies et corps → sang → traçantes → tourelles → projectiles → objets (leurre, boutiques,
tyroliennes, hélicoptère) → Guide (sans hasard) → autres joueurs (sans hasard) → décor (volets, barricades, murs) → portée au marteau → onde → éclairs → feux au sol → héros → variantes →
**`partStep`** → objet en main → `gunFx` → recul → rendu.

Cet ordre est celui d'avant le découpage et il compte : les effets tirent au hasard (`Math.random`) et émettent des particules ;
changer leur ordre change l'image (le hasard ne tombe plus pareil) ; `partStep` doit venir après toutes les émissions de l'image ;
les éclairs (`flashFrame`) avant les héros (un éclair d'orage émis par `hxElecFrame` ne doit pas vieillir dans la même image).

## Ce que l'affichage lit

**Dans `S`** : `S.p` (joueur : x, y, z, yaw, pitch ; via `eyeP`, `viewDir`), `S.t`, `S.phase`, `S.mode`, `S.day`, `S.left`, `S.dayTotal`, `S.hero`,
`S.P` (`mur`, `murH`), `S.z` (zombies : `x y z yaw st ty va ph tr hst burn psn slow`), `S.act` / `S.nAct`, `S.corpses`, `S.tur`, `S.shells`,
`S.missiles`, `S.decoy`, `S.heliT`, `S.fires`, `S.fballs`, `S.meteors`, `S.thorns`, `S.guards`, `S.ramparts`, `S.storms`, `S.flood`,
`S.wallVer`, `S.plankVer`, `S.plankT`, `S.swing`, `S.swingT`.
États des zombies `st` : 0 libre · 1 marche dehors · 2 grimpe la façade · 3 dans l'immeuble · 5 grimpe un mur d'avenue · 7 dans l'escalier.

**Des règles** (noms globaux) : `B`, `H`, `BALD`, `PLAZA`, `FACES`, `facePt`, `LVY`, `levelOf`, `floorAt`, `rayWall`, `PANELS`, `DOORS`,
`PLANKS_MAX`, `ROADS`, `roadOpen`, `SLOTS`, `slotOn`, `turretReach`, `TT`, `SHOPS`, `HELI`, `ZT`, `MAXZ`, `WEAP`, `outside`, `eyeP`, `viewDir`.
**De l'interface** : `save.layout` (plan des tourelles, pour la portée au marteau), `GUIDEP` (la place du Guide),
`joueursDistants()` (V4.3, les autres joueurs : `[{ id, nom, heros, arme, x, y, z, yaw, pitch, tire, aTerre }]`, positions lissées ;
tout y est vérifié : nombres finis, héros et arme connus sinon feu et fusil, nom sans caractères de contrôle coupé à 12, 8 joueurs au plus). **Du reste** : `THREE`, `K`, `MODELS`.

## Les événements `S.ev` traités

| Événement | Effet | Fichier |
|---|---|---|
| `shot` | recul ; éclair de bouche, traçante, sang ou poussière (fusil, pistolet, assaut, sniper) ; pompe ; tic du lance-flammes (`flame`) | `tirs.js` |
| `pellet` | un plomb du fusil à pompe : traçante fine, sang ou poussière | `tirs.js` |
| `tracer` | traçante d'une tourelle, parfois du sang | `evenements.js` |
| `boom` | explosion : éclair, flammes, fumée, poussière, taches, secousse (`kind` 'M' missile, 'A' frappe, 'm' mortier, 's' fragmentation, 'B' boule de feu : en plus anneau de feu et sol brûlé) | `evenements.js`, `heros-evenements.js` |
| `land` | un zombie tombé : tache, sang | `evenements.js` |
| `wk` | sang sur une façade | `evenements.js` |
| `onde` | onde de choc : anneau, secousse, poussière | `evenements.js`, `decor.js` |
| `road` | une barricade saute | `evenements.js` |
| `dawn` | mode fuite : poussière au pied des façades, secousse | `evenements.js` |
| `over` | un zombie passe le parapet : poussière | `evenements.js` |
| `masse` | coup de masse qui porte : secousse, sang | `evenements.js` |
| `wallhit`, `wallbreak` | cloison touchée (trou, plâtre) ou tombée (gravats, nuage) | `cloisons.js` |
| `plank`, `tear` | planche clouée (poussière, copeaux) ou arrachée (elle s'envole, échardes) | `cloisons.js` |
| `brasier0`, `meteor`, `maree`, `ronces`, `fleche`, `rempart`, `rempart_fin`, `zap`, `eclair`, `hult` | effets des héros | `heros-evenements.js` |
| `hurle` | cri du hurleur : anneaux, bouffée rouge | `variantes.js` |

Tous les autres événements (`pkill`, `escape`, `prep`, `clear`, `dead`, `sprint`…) ne concernent que l'interface et les sons.

## Les budgets

Mesurés sur les 21 captures de `tests/images.js` (`node tests/images.js --mesure`, moteur d'aperçu three-lite, qui ne retire pas ce qui
est hors champ : le vrai three.js en dessine moins) :

- **Appels de dessin** : 44 (toit au départ) à ~90 en pleine action (héros, foule du toit), jusqu'à ~140 avec tourelles, missile,
  onde et hélicoptère. Une réserve vide n'est pas dessinée. Les variantes ajoutent ≈ 20 appels quand tout est à l'écran (V3.9).
- **Triangles** : ~100 k au calme (la ville ≈ 30 k, l'immeuble ≈ 44 k), 180 à 280 k avec la foule et les effets.
  Modèles : zombie ≈ 370 à 460, tourelle 350 à 450, arme en main 1 700 à 2 600 (pompe 2 558, lance 2 574), marteau ≈ 1 000,
  masse ≈ 1 400, tyroliennes ≈ 6 100 (les 4), rempart ≈ 1 560.
- **Particules** (capacité par sorte) : blood 900, fire 700, water 500, plaster 420, spark 400, smoke 400, pdust 360, dust 300, leaf 300,
  rock 280, rubble 260, bill 260, mist 240, wood 240, gold 220, shell 60. Taches de sang 700 au sol + 260 sur les façades ; traçantes 260 ;
  éclairs 14 ; trous 360 ; planches en vol 10 ; rayons laser 40 ; zombies `MAXZ` (2 600) par tenue a–d, 640 pour e–h ; corps 560 / 240.
  Le lance-flammes laisse toujours 150 places de feu aux autres ; héros et variantes plafonnent leurs émissions par image.
- Sa vidéo (V2.5) : 60 images/s sur son iPhone, jour 7, 40 zombies dans l'immeuble, arbre au max.
- **Autres joueurs** (V4.3, `joueurs.js`) : par joueur 12 à 14 appels de dessin (corps et arme 11, étiquette ; éclair et traînée
  quand il tire) et 2 900 à 3 850 triangles (corps ≈ 1 200 à 1 260, arme 1 700 à 2 600) ; 4 joueurs ≈ 50 appels. Les géométries du corps (une par
  héros) et des armes (une par arme et par héros) sont cuites une fois et partagées (cache `prepM`) ; par joueur, seuls son canevas
  d'étiquette, sa texture et sa matière lui appartiennent : libérés (`dispose`) à son départ. Aucune allocation par image.

## Ajouter…

**Un modèle** : une recette `MODELS['nom'] = ctx => { const b = K.make(graine) … return b; }` dans `gfx/models/toit.js` (monde) ou
`gfx/models/mains.js` (en main ; renvoyer aussi `hold`, `aim`, `tip` pour une arme) — une graine `K.make(n)` neuve (pas déjà prise
dans les deux fichiers ni au lobby), puis `instM('nom')` (un objet) ou `new IPool(prepM('nom').parts[0].gs.m, K.MAT.m, capacité)` (en masse).
Aperçu : `cd gfx && node preview.js out/x.png models/toit.js nom`. Une arme : aussi `outils/photos.js` (photo du menu).
Ne jamais changer l'ordre des ajouts, les graines ou les nombres d'un modèle existant : sa forme changerait.

**Un effet** : créer ses réserves dans le `…Init` du fichier du sujet (ou dans `hfxInit` / `zvInit`), le déclencher depuis l'événement
(`gfxEvent` → la branche du sujet), le faire vivre dans le `…Frame` du sujet. Réutiliser les particules communes (`emit`) plutôt
que d'en créer ; plafonner (constante en tête de fichier) ; pas de `new` ni de lumière pendant une image. Un nouvel appel dans
`gfxFrame` se place **à la fin de la partie qui émet** (avant `partStep`) pour ne pas déplacer les tirages au hasard des autres ;
il change alors les images de référence : relancer `node tests/images.js --ref` seulement après avoir regardé les captures.

**Un son** : une entrée dans `SONS` (`sons/sound.js`) faite de `tone()` et `noise()` (et `cadence()` pour limiter les rafales),
puis `SND.play('nom')` ou `SND.at('nom', x, z, a, y)` dans l'interface (`interface/evenements.js`), au même endroit que l'effet.

## Vérifier

- `node tests/images.js` : 21 captures (toit, rue et variantes, intérieur, tyrolienne, les 8 objets en main, les 5 héros, tourelles,
  hélicoptère), comparées pixel par pixel à `tests/images-ref/` ; `--ref` les réécrit (après un changement **voulu** de l'image),
  `--page=…` vise une autre page, `SEUL=armes,heros` ne joue que certaines situations, `--mesure` donne les budgets.
- Sons : `node tests/sndtest.js`, et les parties sons de `tests/armes2.js`, `tests/herofx.js`, `tests/variantes.js`.
- Effets : `tests/armes2.js` (pompe, lance-flammes), `tests/herofx.js` (héros), `tests/variantes.js` (variantes), `tests/portee.js`.
- Autres joueurs : `tests/joueurstest.js` (liste factice de 3 joueurs : création, places, étiquettes, marche, tir, à terre, changements,
  départ, liste abîmée) et sa capture `shots/joueurs.png`.

## À savoir (points fragiles)

- **Le coup de caméra au départ du sprint ne marche pas** (depuis V2.0) : `gfxEvent` n'a jamais transmis l'événement `sprint`
  (l'ancienne branche `G.kick = 1` n'était jamais atteinte ; retirée au nettoyage). Seul le bond de Volt donne ce coup. À brancher
  si on le veut (une ligne dans `gfxEvent`) — ce serait un changement d'image, donc hors nettoyage.
- Les tests lisent beaucoup de champs de `G` (`G.z`, `G.P`, `G.vm`, `G.vmFlash`, `G.tr`, `G.fl`, `G.tip`, `G.aimP`, `G.ads`, `G.flash`…)
  et remplacent des fonctions globales pour les chronométrer (`gfxFrame`, `partStep`, `hfxFrame`, `zvFrame`, `zvEvent`, `gunFx`,
  `flameTic`) : elles doivent rester des `function` globales appelées par leur nom.
- `hfxInit` et `zvInit` se font au premier événement ou à la première image (tirages au hasard compris).
- Les taches de sang ne sont pas effacées entre deux parties (seules les cloisons, les trous et les planches repartent à neuf).
- La portée au marteau pulse avec `performance.now()` (pas avec le temps du jeu) : elle continue de battre en pause.
