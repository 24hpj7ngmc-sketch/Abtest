# regles/ — les règles de Dernier Toit

Tout ce qui décide de la partie : l'immeuble, les zombies, le joueur, les armes, les tourelles, les héros, l'arbre, les journées.
**Aucune 3D ici** : ces fichiers tournent aussi sous Node (les tests chargent `regles.js`, que `build.py` fabrique en les collant).

- Les fichiers sont collés dans l'ordre de `ordre.txt` et partagent **une seule portée globale** avec `affichage/`, `sons/` et `interface/`
  (pas de modules) : une fonction définie ici est appelée telle quelle là-bas. **Un nom utilisé hors de `regles/` ne se renomme pas.**
- L'ordre de `ordre.txt` ne compte que pour ce qui s'exécute au chargement (constantes, tables, construction de l'immeuble) :
  les `function` sont remontées par JavaScript, pas les `const`.
- Garde-fou : `python3 build.py && node tests/empreinte.js` rejoue 7 parties fixes et compare l'état final au chiffre près (7 OK).
  Tout ce qui change une règle, un chiffre ou **l'ordre des tirages `S.rnd()`** la fait échouer.

## La carte des fichiers

Dans l'ordre de `ordre.txt` (lignes après mise en forme prettier ; 18 fichiers depuis la V4.3, 19 depuis la V4.9) :

| Fichier | Lignes | Ce qu'il contient | Ce qu'il fournit aux autres dossiers |
|---|---|---|---|
| `immeuble.js` | 462 | Géométrie de l'immeuble, construite au chargement : façades, dalles, parapet, escalier et cabanon, cloisons cassables (`PANELS`), portes à planches (`DOORS`), pièces et meubles, balcons, boutiques (`SHOPS`), tyroliennes et passerelles (`ZIPS`) | `B`, `NLV`, `LVY`, `H`, `FACES`, `FACEN`, `facePt`, `BALD`, `BOX`, `FLOORS`, `OPEN`, `ROOMS`, `PANELS`, `DOORS`, `PLANKS_MAX`, `SHOPS`, `ZIPS`, `PASSD`, `PASSY`, `PASSW`, `ZIPH` (affichage, interface, `gfx/models/toit.js` qui dessine l'immeuble avec ces listes) |
| `collisions.js` | 106 | Niveau d'une hauteur, sol sous un point, le joueur contre les boîtes, rayon jusqu'au premier mur | `levelOf`, `floorAt`, `rayWall` |
| `navigation.js` | 292 | Grilles de marche de 50 cm par niveau, `bfs` (Dijkstra), champs `FUP` / `FDOWN` / `ROOMS[].F`, recalcul quand une cloison tombe ou qu'une porte est barricadée, chemin `STAIRS` des zombies dans l'escalier | (tests seulement) |
| `tables.js` | 100 | Constantes (`PAR`, `PLAZA`, `EYE`, `CLK`…), hasard `mkRng`, routes `ROADS`, hélico `HELI`, types de zombies `ZT`, annonces `VARD`, dégâts à la ville `ESC`, journées (`DAYN`, `hpMul`…), invasion (`INV_DAY`…), types de tourelles `TT` | `PLAZA`, `ROADS`, `roadOpen`, `HELI`, `ZT`, `VARD`, `dayCount`, `INV_DAY`, `TT`, `TKEYS` |
| `arbre.js` | 408 | Les cases de l'arbre `NODES` et `derive` (l'arbre → `S.P`) | `NODES`, `NODE`, `nodeCost`, `START_DAYS`, `derive` |
| `armes.js` | 289 | Table des armes `WEAP`, le tir (`shoot`, `shootOne`, `flameShoot`), la masse (`useMasse`, `masseHit`) | `WEAP`, `WKEYS`, `weapOf`, `useMasse` |
| `tourelles.js` | 376 | Emplacements `SLOTS`, pose (`buildTurrets`), visée (`turretPick`…) et tir (`turretsStep`), portée affichée (`turretReach`) | `SLOTS`, `slotOn`, `turOff`, `buildTurrets`, `placedCount`, `turretReach` |
| `heros.js` | 693 | Les six héros `HEROS` (V4.8 : Zéphyr), les six éléments (`ELKEYS`, `ELNOM`) ; balles (`heroOnHit` → `effetBalle` : élément de l'arme + passif du héros ; `predilK`), compétences (`useHeroSkill`, `rafale`), ultimes (`useHeroUlt`, `tirPercant`), ce qui dure (`heroStep`), le rempart (`rampartBlock`) | `HEROS`, `HKEYS`, `ELKEYS`, `ELNOM`, `ELDE`, `ELFX`, `heroRole`, `heroHp`, `outside`, `useHeroSkill`, `useHeroUlt` |
| `voies.js` | 294 | V4.9 : les voies du héros (`VOIES`, `voieDe`, `voieNom` ; leurs règles : `voieDegats`, `voieAcheve`, `voieJoueur`, `voieCoup`, `voieTue`, `cadenceVoie`, `tirCharge`, `porteeVoie`, `soinK`, `bouclier`, `plonge`, `chargeRempart`) et l'ultime teinté (`teinteDe`, `teinte`, appelée par `hurtZ` pendant `S.ultEl`) | `VOIES`, `voieDe`, `voieNom`, `tirCharge` (interface) |
| `partie.js` | 343 | L'état d'une partie (`mkZ`, `newRun`), les journées (`startDay`, `dayEndStep`), la grille de voisinage (`gridBuild`, `gridEach`) | `newRun`, `startDay`, `MAXZ`, `J1` |
| `degats.js` | 172 | Dégâts : zombies (`hurtZ`, `killZ`), explosions (`boom`), joueur (`hurtP`), ville (`hurtCity`), cloisons (`wallDmg`, `boomWalls`) | `killZ` (outil dev), `hurtZ` (tests) |
| `zombies.js` | 135 | Le pas des zombies (`zombiesStep` : effets, hurleur, casseur, puis le pas selon l'état), feux au sol, `compact`, cadavres | — |
| `zombies-dehors.js` | 541 | Apparition (`spawnOne`), fuite (`outRoute`, `outWalk`, `escapeZ`), arrivée (`inWalk`, `aimFacade`, `facadeStep`), murs d'avenue (`wallClimbStep`) | `spawnOne`, `inPlaza` |
| `zombies-dedans.js` | 351 | Dans l'immeuble : chasse (`insideStep`), invasion (`invadeStep`), escalier (`stairStep`), morsure (`zBite`), portes et planches (`doorPick`, `plankStep`, `tearDoor`, `doorGate`) | `doorPick`, `plankStep` |
| `joueur.js` | 343 | Le pas du joueur (`playerStep`, `finishP`), le regard (`viewDir`, `eyeP`, `aimPoint`), l'escalier qui porte (`SP`, `glideStep`), les boutiques (`shopNear`) | `viewDir`, `eyeP`, `shopNear` |
| `escalade.js` | 276 | Tyroliennes (`zipSpot`…), échelles des passerelles (`LADDERS`, `ladderAuto`), escalade (`climbSpot`, `startClimb`, `climbStep`) | `zipSpot`, `climbSpot` |
| `capacites.js` | 181 | Missile, onde de choc, leurre, frappe aérienne ; ce qui est en vol (`projStep`) | `useMissile`, `useOnde`, `useLeurre`, `useAir` |
| `boucle.js` | 55 | `step` : un pas de jeu | `step` |
| `multi.js` | 1146 | V4.3, le multi : l'instantané de l'hôte (`encodeInstantane` / `appliqueInstantane`), le pas de l'invité (`stepInvite`), ses gestes en actions (`hurtInvite`, `skillInvite`…), les actions chez l'hôte (`appliqueActions`), la reprise (`reprendHote`) | `encodeInstantane`, `appliqueInstantane`, `stepInvite`, `appliqueActions`, `actionsInvite`, `reprendHote`, `hordeK` (interface) |

Ce qui est construit **au chargement**, dans cet ordre : l'immeuble (`BOX`, `FLOORS`…), `BBOX`, les grilles et les champs de marche,
les routes (`ROADS` complétées), `SLOTS` (l'ordre des emplacements est leur numéro dans la sauvegarde), `SP` (escalier qui porte), `LADDERS`.

## Le cycle d'une image

L'interface (`interface/boucle.js`), à chaque image : règle le regard (`S.p.yaw`, `S.p.pitch`), appelle `useMasse` (masse tenue) et
`plankStep` (marteau tenu sur une porte), puis `step(S, dt, inp)` (deux ou quatre fois en vitesse ×2 / ×4 du mode dev), avec
`inp` = les commandes (joystick `f`, `r`, `sprint`, `crouch`, `jump`, `fire`, regard `yaw`, `pitch` ; mode dev : `fly`, `up`, `down`).
Ensuite `events()` (`interface/evenements.js`) lit `S.ev` (les événements du pas), passe chacun à l'affichage (`gfxEvent`), joue les sons
et les messages, et vide la liste. L'affichage dessine l'état (`S`, `Z`, `S.tur`…) directement.

`step` (boucle.js), dans l'ordre :

1. `dt` plafonné à 0,05 s ; rien si la partie est finie (`'dead'`, `'won'`).
2. `playerStep` : escalade / tyrolienne en cours, échelle, escalier qui porte, sinon la marche (élan, collisions, tourelles, saut, gravité) ;
   puis `finishP` : niveau, balcon, volée d'escalier du joueur, recharges, soin, **tir** (`shoot`) à la cadence de l'arme.
3. Le coup de masse en cours porte au tiers du geste (`masseHit`).
4. `navFlush` : recalcule la marche d'**un** niveau marqué (cloison tombée, porte barricadée ou débarricadée).
5. Pendant le jour : la horde sort (`spawnOne`, `dayN` zombies en `dayDur` secondes, `S.cap` au plus à la fois) ; recharges des capacités.
6. Toutes les 0,25 s (ou si le joueur change de niveau) : le champ de marche vers le joueur `S.pf`.
7. `zombiesStep` : effets, hurleur, casseur, puis le pas de chacun selon `Z.st` ; feux au sol.
8. `gridBuild` (grille de voisinage) → `turretsStep` → `projStep` (obus, missiles, bombes, leurre) → `heroStep`.
9. `compact` (les places des morts et des échappés redeviennent libres) → `corpsesStep` (les cadavres tombent).
10. `dayEndStep` : fin de journée (prime, `'clear'`), jour suivant (`'prep'`) ou hélicoptère (`'rescue'`), victoire (`'won'`).

Phases (`S.phase`) : `'prep'` (entre deux jours : on pose, on achète ; « Lancer le jour » appelle `startDay`) → `'day'` → `'clear'` (3,2 s)
→ `'prep'` du jour suivant, ou `'rescue'` après le jour 10 → `'won'`. `'dead'` à tout moment (ville à 0 ; vie à 0 en « Ils arrivent » seulement : en mode fuite, le joueur tombe et se relève, V4.2).

## Les événements (`S.ev`)

Chaque événement est un objet `{ k: 'nom', … }` poussé pendant le pas ; l'interface les lit tous après `step`, puis vide la liste.
Coordonnées en mètres (repère de l'immeuble). Colonne « Sert à » : « aff » = `affichage/` (`gfxEvent` : effets 3D) ;
« int » = `interface/evenements.js` (sons joués par `SND`, messages, toasts, gains qui flottent, fin de partie).

| `k` | Champs | Produit par | Sert à |
|---|---|---|---|
| `shot` | `x, y, z` (point d'arrivée), `hit`, `kill`, `crit`, `w` (arme), `pellets` (pompe), `flame` (lance-flammes) | `shoot` (armes.js) | aff (éclair, traçante, recul), int (son de l'arme, réticule) |
| `pellet` | `x, y, z`, `hit` | `shootOne` (les plombs du fusil à pompe : les 3 premiers et ceux qui touchent) | aff (traçantes des plombs) |
| `tracer` | `x0, y0, z0` → `x1, y1, z1`, `ty` | `turretsStep` (une balle de mitrailleuse) | aff (traçante, sang), int (son placé) |
| `mortar` | `x, z` | `turretsStep` (départ d'un obus) | int (son) |
| `boom` | `x, y, z, r`, `kind` (`'s'` balle explosive, `'m'` obus ou sous-munition, `'M'` missile, `'A'` bombe, météore ou leurre piégé, `'B'` Brasier) | `boom` (degats.js) | aff (explosion), int (son, plus gros pour `'A'` et `'M'`) |
| `pkill` | `x, y, z`, `c` (argent gagné) | `killZ`, quand le joueur a tué | int (pièce, gain qui flotte) |
| `bossdead` | `x, y, z` | `killZ` (un mastodonte) | int (grand message) |
| `wk` | `f, u, y` (façade, place, hauteur) | `killZ` (grimpeur tué en hauteur, 30 % des fois) | aff (traînée de sang sur la façade) |
| `land` | `x, y, z`, `big` | `corpsesStep` (un cadavre touche le sol) | aff |
| `boss` | `r` (route) | `spawnOne` (un mastodonte sort) | int (son, toast) |
| `variant` | `ty` | `spawnOne` (première variante de chaque sorte dans la partie) | int (son, toast `VARD`) |
| `hurle` | `x, y, z` | `zombiesStep` (cri du hurleur) | aff (anneaux rouges), int (son placé) |
| `escape` | `r, ty` | `escapeZ` (un fuyard s'échappe) | int (son, toast) |
| `over` | `x, z` | `facadeStep` (un grimpeur passe le parapet) | aff, int (grognement) |
| `win` | `x, y, z, lv`, `inv` | `facadeStep` (un grimpeur entre par une fenêtre) | int (grognement, toast « Ils entrent par les fenêtres ! ») |
| `inv` | `lv` | `stairStep` (un envahisseur arrive à un étage) | int (toast « Ils envahissent le 2e étage ! », son) |
| `road` | `r` | `startDay` (une route s'ouvre) | aff (la barricade saute), int (son, grand message) |
| `dawn` | `d` | `startDay` | aff (mode fuite), int (sirène, grand message) |
| `clear` | `d`, `bonus` | `dayEndStep` (jour tenu) | int (son, « Jour tenu », sauvegarde) |
| `prep` | `d` | `dayEndStep` (jour suivant) | int (panneau de préparation, conseils) |
| `heli` | — | `dayEndStep` (après le jour 10) | int (grand message) |
| `won` | — | `dayEndStep` (le joueur rejoint l'hélico) | int (campagne, sauvegarde, écran de victoire) |
| `dead` | — | `hurtP` (« Ils arrivent »), `hurtCity` | int (son, sauvegarde, écran de fin ; la cause est dans `S.why`) |
| `tombe` | `t` (s avant le relevé) | `hurtP` (mode fuite, V4.2 : le joueur tombe, `p.down = RELEVE`) | int (son, voile « Tu es tombé ») |
| `releve` | — | `releve` (joueur.js) | int (grand message « De retour ») |
| `sprint` | — | `playerStep` (départ du sprint) | int (son) |
| `grimpe_lock` | — | `playerStep` (Saut à un endroit d'escalade, sans la case Escalade) | int (toast « à débloquer », une fois) |
| `climb` / `climbed` | `dir` (1 monte, −1 descend) | `startClimb` / `climbStep` | int (`climb` : son) ; `climbed` : personne ne l'écoute aujourd'hui |
| `zip` / `zipend` | `dir` / `drop` (lâché) | `startZip` / `zipStep`, `zipLetGo` | int (`zip` : son) ; `zipend` : personne ne l'écoute aujourd'hui |
| `swing` | — | `useMasse` | int (son) |
| `masse` | `n` (zombies touchés), `wall` (cloison touchée), `x, y, z` | `masseHit` | aff, int (son) |
| `wallhit` | `pid` (morceau), `x, y, z`, `hp` (reste, 0 à 1) | `wallDmg` ; aussi `zombiesStep` (casseur, sans `pid` ni `hp`) | aff (fissures, poussière), int (son) |
| `wallbreak` | `pid`, `x, y, z`, `lv`, `tier` | `wallDmg` (un morceau casse) | aff (le morceau disparaît, gravats), int (son) |
| `plank` | `door`, `n` (planches), `x, y, z`, `pay` | `plankStep` (une planche posée) | aff, int (son, gain) |
| `tear` | `door`, `n`, `x, y, z` | `tearDoor` (une planche arrachée) | aff, int (son, toast « Ils arrachent tes planches ! » une fois) |
| `mlaunch` | — | `useMissile` | rien (le son part du bouton ; le missile est dessiné d'après `S.missiles`) |
| `onde` | — | `useOnde` | aff (l'onde ; le son part du bouton) |
| `decoy` | `x, z` | `useLeurre` | rien (le leurre est dessiné d'après `S.decoy`) |
| `jet` | `x, z` | `useAir` | personne ne l'écoute aujourd'hui (le son part du bouton) |
| `refus` | `why` | `useHeroSkill` (Rempart hors de la rue) | int (son, toast) |
| `brasier0` | — | `useHeroSkill` (Braise) | aff, int (son) |
| `maree` | `x, y, z, r` | `useHeroSkill` (Ondine) | aff, int (son placé) |
| `ronces` | `x, y, z, r` | `useHeroSkill` (Sylve) | aff, int (son placé) |
| `rempart` | `x, z, nx, nz, half` | `useHeroSkill` (Roc) | aff (le mur), int (son placé) |
| `rempart_fin` | `id, x, z`, `broke` | `heroStep` | aff, int (son : éboulé ou enfoncé) |
| `eclair` | `x0, z0` → `x1, z1`, `y` | `useHeroSkill` (Volt) | aff, int (son) |
| `hult` | `h` (héros), `el` (V4.9 : l'élément qui teinte l'ultime, sinon null) | `useHeroUlt` | aff, int (son) |
| `meteor` | `x, z`, `t` (temps de chute) | `heroStep` (Météores) | aff, int (son placé) |
| `fleche` | `x0, y0, z0` → `x1, y1, z1` | `heroStep` (Gardiens) | aff, int (son placé) |
| `zap` | `x0, y0, z0` → `x1, y1, z1`, `small` | `heroOnHit` (Volt : `small`), `heroStep` (Orage) | aff, int (son : arc ou tonnerre) |
| `rafale` | `x0, z0` → `x1, z1`, `y` | `useHeroSkill` (Zéphyr, V4.8 : `rafale`) | aff, int (son) |
| `percant` | `x0, y0, z0` → `x1, y1, z1`, `w` (largeur) | `useHeroUlt` (Zéphyr : `tirPercant`) | aff, int (son) |
| `souleve` | `i` (place du zombie), `d` (durée), `x, y, z` | `effetBalle` (balle de Vent) | aff (il décolle) |
| `plonge` | `x0, z0, y` → `x1, y1, z1` | `plonge` (V4.9, Plongeur) | aff, int (son) |
| `onde_roc` | `x, z, r` | `chargeRempart` (Avant-garde, à l'arrivée) | aff, int (son) |
| `acheve` | `x, y, z` | `voieAcheve` (Lame, Exécution) | aff, int (son) |
| `relance` | — | `useHeroSkill` (Escarmoucheur : l'Éclair relancé) | int (message) |
| `bouclier` | — | `bouclier` (Soigneuse) | aff, int (son) |

## Glossaire des noms courts

**L'état**
- `S` : l'état d'une partie (`newRun`). Les champs sont commentés dans `newRun` (partie.js). Les plus utilisés : `S.day`, `S.phase`,
  `S.mode` (`'in'` = « Ils arrivent », `'out'` = « Ils s'échappent »), `S.t`, `S.rnd()` (le hasard de la partie), `S.ev`, `S.save`
  (la sauvegarde : `cash`, `lv` niveaux de l'arbre, `layout` plan des tourelles, `mode`, `hero`, `weap`, `best`, `bestF`, `won`, `endlessRun`),
  `S.tur` (tourelles), `S.city` (vie de la ville), `S.ult` (charge de l'ultime), `S.hero`, `S.weap`, `S.plv` / `S.pbal` / `S.pst` / `S.pss`
  (où est le joueur : niveau, balcon, volée d'escalier, position sur la volée), `S.pf` (champ de marche vers le joueur), `S.god` (invincible, dev).
- `Z` = `S.z` : les zombies, **en colonnes** : `Z.x[i]`, `Z.hp[i]`… pour la place `i` (0 à `MAXZ` − 1). `S.act[0…S.nAct−1]` : les places occupées ;
  `S.free` : les libres. Colonnes commentées dans `mkZ` (partie.js).
- `p` = `S.p` : le joueur (position aux pieds, `yaw` 0 = nord, `pitch` > 0 vers le haut, `vx/vy/vz`, `hp`, `gl` / `glF` escalier qui porte,
  `clb` escalade, `zip` tyrolienne, `inv` invincible, `ground`, `crouch`). Champs commentés dans `newRun`.
- `P` = `S.P` : ce que l'arbre change, calculé par `derive(save.lv)` : `rDmg`, `rRate`, `rCrit`, `rPierce`, `rExp` (fusil, vaut pour toutes
  les armes), `turrets`, `mg` / `la` / `mo` / `fl` (tourelles, `on` = débloquée), `hp`, `regen`, `armor`, `cash`, `dayB`, `grimpe`, `masse`,
  `bal`, `mur`, `murH`, `barb`, `mis`, `onde`, `leu`, `air`.
- `inp` : les commandes d'un pas (voir le cycle).

**L'état d'un zombie : `Z.st`**
- `0` libre (mort ou échappé : la place sera rendue par `compact`) ;
- `1` dehors, au sol (« Ils arrivent » : `inWalk` ; mode fuite : `outWalk`) ;
- `2` grimpe une façade (« Ils arrivent » : `facadeStep`) ;
- `3` dans l'immeuble, au niveau `Z.lv` (toit = `NLV`) : `insideStep` (ou `invadeStep` pour un envahisseur) ;
- `5` escalade le mur d'une avenue (`wallClimbStep`) ;
- `7` dans l'escalier, sur la volée du niveau `Z.lv` au niveau `Z.lv + 1` (`stairStep`).
- (4 et 6 n'existent pas : anciens numéros.)

**Les étapes du trajet dehors : `Z.wp`**
- « Ils arrivent » : `0` vers le débouché de sa route → `3` choisir une façade → `1` passer par un coin de l'immeuble → `2` aller au pied
  de la façade, puis grimper.
- Mode fuite : `4` sortir du hall par un rideau de fer → `1` passer par un coin → `2` aller au débouché de sa rue → `0` courir jusqu'au bout
  de la rue, où il s'échappe.

**Colonnes qui changent de sens selon l'état** : `Z.u` (place le long de la façade en grimpant ; distance le long de l'escalier ;
temps restant dans sa pièce pour un envahisseur, −1 : à choisir) ; `Z.f` (façade ; dans l'escalier : 0 monte, 1 descend) ;
`Z.road` (route ; pour un envahisseur : numéro de sa pièce dans `ROOMS`) ; `Z.inv` (envahisseur : étage visé ; 0 sinon).

**Types et tables**
- `ZT` : types de zombies, `Z.ty` = indice : `0` rôdeur, `1` coureur, `2` colosse, `3` mastodonte ; variantes (mode fuite) : `4` sprinteur,
  `5` casseur, `6` porteur, `7` hurleur. Champs : `hp`, `sp` (vitesse dehors), `cl` (escalade), `rs` (vitesse dedans), `dps` (morsure),
  `cash`, `sc` (taille), `r` (rayon).
- `WEAP` / `WKEYS` : les armes (`fusil`, `pistolet`, `assaut`, `sniper`, `pompe`, `lance`) ; `weapOf(S)` l'arme en main (fusil en « Ils arrivent »).
- `HEROS` / `HKEYS` : les héros par élément (`feu` Braise, `eau` Ondine, `bois` Sylve, `terre` Roc, `elec` Volt).
- `NODES` / `NODE` : les cases de l'arbre (`id`, `max`, `c`, `g`, `req`, `x`, `y`, `b`).
- `TT` / `TKEYS` : les tourelles (`mg` mitrailleuse, `la` laser, `mo` mortier, `fl` lance-flammes).
- `SLOTS` : les emplacements de tourelle (`k` : `toit`, `balcon`, `mur`, `int` couloir). Leur numéro est gardé dans `save.layout` : n'en
  changer jamais l'ordre, ajouter à la fin.
- `ROADS` : les routes (`a` bout, `b` débouché sur la place, `dx/dz` direction vers la place, `px/pz` en travers, `w` largeur, `wall` avenue).
- `src` d'un dégât : `'p'` joueur (argent ×2), `'t'` tourelle, `'o'` onde de choc.

**L'immeuble**
- `B` = 13 : demi-largeur (façades à x = ±B, z = ±B) ; `H` : hauteur du toit ; `NLV` = 5 : le toit est le niveau 5 (0 = rez-de-chaussée) ;
  `LVY(k)` : hauteur du sol du niveau k ; `G0`, `FH` : hauteurs du rez-de-chaussée et d'un étage.
- `FACES[f]` : normale de la façade f (0 nord, 1 est, 2 sud, 3 ouest) ; `facePt(f, u, d)` : point à `u` le long de la façade et `d` devant elle.
- `BALD` : profondeur des balcons (`BALV` : les niveaux à balcon) ; `WU`, `SU` : fenêtres, rideaux de fer ; `HOLE` : trémie de l'escalier ;
  `R1` : limite des pièces de façade ; `SA`, `SB`, `HUTIN` : entrées de l'escalier.
- `BOX` (boîtes : `b` arrête les balles, `p` arrête le joueur, `t` nature, `dead` absente), `FLOORS`, `OPEN`, `ROOMS`, `PANELS`, `DOORS`, `STDOOR`.
- Grilles de marche : `CS` (50 cm), `NC` × `NC` cases (`NCC`), `cellI` / `cellX` / `cellZ`, `WALK`, `COST`, `DCELL`, `FUP`, `FDOWN`, `STAIRS`.
- Grille de voisinage (dehors comme dedans, cases de 3 m) : `GC`, `GN`, `S.grid`, `gridEach`.

## Marches à suivre

Après chaque changement : `python3 build.py && node tests/empreinte.js`. Un changement voulu des règles fait échouer l'empreinte :
c'est normal, mais seule la session principale décide de régénérer la référence (`--ref`), une fois le changement validé.

### Ajouter une arme
1. `armes.js` : une entrée dans `WEAP` (clé courte, ex. `arbalete`) avec tous les champs (`dmg` et `rate` sont des multiplicateurs du
   fusil ; `range`, `crit`, `critK`, `pierce`, `wall`, `zoom`, `kick`), et sa clé dans `WKEYS` (ordre du menu).
2. Si elle tire autrement qu'une balle (gerbe, cône…) : une branche dans `shoot`, sur le modèle de `pellets` (pompe) ou `flame` (`flameShoot`).
   Le tir garde l'événement `shot` avec `w` = la clé de l'arme.
3. Hors des règles (à demander aux autres dossiers) : le modèle en main (`gfx/models/mains.js`, `vm.<clé>`), la tenue et les effets
   (`affichage/`), le son de tir (`sons/`, `SND.play('shot', w)`), la photo du menu (`outils/photos.js` → `gfx/photos.js`), la carte du menu.
4. Elle n'existe qu'en mode fuite (`weapOf`) ; le choix est gardé dans `save.weap`. Test : sur le modèle de `tests/armes2.js`.

### Ajouter une variante de zombie
1. `tables.js` : une entrée à la fin de `ZT` (indice 8 : `Z.ty` tient jusqu'à 255, `S.seenTy` jusqu'à 31), sa phrase dans `VARD`,
   ce qu'elle coûte à la ville dans `ESC` (même indice).
2. `zombies-dehors.js`, `spawnOne` : sa chance d'apparaître dans le tirage des variantes (mode fuite, à la place d'un rôdeur). Ajouter un
   **nouveau** `S.rnd()` change toutes les parties : préférer réutiliser le tirage `roll2` existant.
3. Son comportement : dans `zombiesStep` (comme le cri du hurleur ou les coups du casseur), ou dans le pas de son état (`outWalk`,
   `insideStep`…). Les « gros » se testent avec `bigZ(ty)` (table `BIG` : colosse, mastodonte, casseur ; V4.0), et `ty !== 3` exclut le mastodonte.
4. Hors des règles : la tenue et les poses (`gfx/models/toit.js`, `affichage/` : `ZSETS`), les sons, le toast (`interface/`), le bouton DEV
   « Les 4 variantes ».

### Ajouter un héros
1. `heros.js` : une entrée dans `HEROS` (clé, `n`, `el`, `c`, `role`, `sk`, `ul`, `cd`, et les trois descriptions) et sa clé dans `HKEYS`.
2. Son passif : sur les balles dans `heroOnHit` ; sur lui dans `heroHp` (vie), `hurtP` (coups reçus), `playerStep` (vitesse), `finishP` (soin).
3. Sa compétence : une branche dans `useHeroSkill` (ce qui dure va dans une liste de `S` créée dans `newRun` et avance dans `heroStep`) ;
   son ultime : une branche dans `useHeroUlt`. Puissance : `hPow(S)` (compétence) et `uPow(S)` (ultime). Pousser un événement pour l'affichage.
4. Hors des règles : la carte du menu et les boutons (`interface/`), les effets (`affichage/heros-evenements.js`), les sons.

### Ajouter une case à l'arbre
1. `arbre.js` : une entrée dans `NODES` (`id` unique, gardé dans `save.lv` ; `req` : la case qu'il faut avoir ; `x`, `y` : sa place sur la
   carte, sans chevaucher les autres ; `c`, `g` : prix ; `b` : branche).
2. Son effet : un champ calculé dans `derive` (`g('id')` = son niveau), puis lu là où il sert (`S.P.<champ>`).
3. L'interface dessine l'arbre d'après `NODES` : rien d'autre à faire pour qu'elle apparaisse (vérifier sa place à l'écran).

## Points fragiles connus (non corrigés : le nettoyage ne change pas le jeu)
- `Z.ty >= 2` veut dire « gros » (colosse, mastodonte) dans le Séisme (gros seulement ralentis), les Météores (+8 m), le mortier (+15)
  et `land.big` ; depuis la V3.9, les variantes (4 à 7) passent aussi pour « grosses ».
- Le casseur qui cogne une cloison pousse deux `wallhit` (un par `wallDmg`, un sans `pid`).
- Le cri du hurleur touche les zombies des cases de voisinage à ±12 m (un carré, sans vraie distance).
- L'annonce d'une variante (`variant`) peut partir pour un zombie qui devient aussitôt un mastodonte.
- « Ils arrivent » : à moins de 3 m, un zombie va droit sur le joueur et le mord même à travers une cloison (mode figé, laissé tel quel).
- La branche « mode fuite » de `useOnde` n'est plus appelée par le jeu (les héros remplacent l'onde) ; seul `tests/simtest.js` s'en sert.
- Événements que personne n'écoute : `climbed`, `zipend`, `jet`.

## V4.2 : le lobby dans les règles
- `RANGK`, `rangLobby`, `rangK()` (arbre.js) : le rang du lobby ; `S.rangK` multiplie la vie des zombies à leur sortie (`spawnOne`).
- `heroMods()` (arbre.js) → `S.hm` : l'arbre du héros et l'élément des balles venus du lobby, 0 partout hors lobby. Lus dans `playerStep`
  (vitesse, saut), `finishP` (soin d'Ondine), `killZ` (charge de l'ultime), `hurtP` (peau de Roc), `heroOnHit` (balles), `useHeroSkill`,
  `useHeroUlt`, `heroStep` (rayon des boules de feu et des météores), `zombiesStep` (poison).
- `RELEVE` (degats.js), `p.down`, `releve` (joueur.js) : la chute et le relevé ; `S.chutes`, `S.boss`, `S.jeuT` (temps en journée) : comptés pour le lobby.

## V4.3 : le multi
Plan commun : `MULTI.md` (racine). Mode « Ils s'échappent » seulement. **Sans multi, rien ne change** : `S.invite` faux et `S.nJoueurs` 1
(valeurs de `newRun`), aucune fonction de `multi.js` n'est appelée ; `tests/empreinte.js` reste à 7 OK, et `tests/multiregles.js` vérifie
qu'un hôte qui publie son instantané joue exactement la même partie.

**Les rôles.** L'hôte appelle `step` (la vraie partie) ; l'invité appelle `stepInvite(S, dt, inp)` au lieu de `step` et pose `S.invite = true`.
Chez l'hôte, l'interface pose `S.nJoueurs` (joueurs sur le toit) : `startDay` fait `N × hordeK(S)` zombies (1 + 0,5 par joueur en plus, 8 au
plus) ; la cadence suit (même durée de sortie).

**L'API** (tout ce qui vient d'un autre joueur est vérifié : types, bornes, tailles ; rien ne plante, une donnée invalide est ignorée) :
- `encodeInstantane(S, invites, max)` → chaîne ; `invites` = `[{ x, y, z }]` ; `JSON.stringify(chaîne).length <= max` toujours (chaîne vide
  si `max` est trop petit : moins de ~50 caractères). Bilan dans `S.mStat = { actifs, proches, lointains, car }`.
- `appliqueInstantane(S, G)` → `true`, ou `false` sans rien toucher si `G` n'est pas valable.
- `stepInvite(S, dt, inp)` : le pas de l'invité (mêmes `inp` que `step`).
- `actionsInvite(S, max)` → les actions à mettre dans `P.A` : les 8 dernières au plus, JSON ≤ `max`, par `seq` croissant (elles sont alors
  « closes » : un coup suivant ouvre une nouvelle action).
- `appliqueActions(S, joueur, A)` chez l'hôte → nombre d'actions exécutées. `joueur.vu` = dernier `seq` exécuté : **à laisser absent à la
  création** (au premier appel, on se cale sur les actions déjà présentes sans les rejouer — utile après un changement d'hôte ; `A` vide :
  `vu = 0`) ; un `seq` plus petit que `vu` (l'invité a recommencé sa partie) remet `vu` à 0. `joueur.heros` sert si l'action n'a pas de héros.
- `reprendHote(S)` : l'invité devient hôte (renvoie `false` s'il ne l'était pas) ; ensuite, `step` comme un hôte.

**Les actions** (`S.mActions`, `S.mSeq` ; 16 gardées, 3 s au plus ; type d'abord, puis `seq`) :
| Action | Forme | Chez l'hôte |
|---|---|---|
| coup | `['h', seq, place, gén, dégâts, effets, place, gén, dégâts, effets, …]` (un pas = une action, 40 zombies au plus, dégâts additionnés par zombie ; `gén` = `Z.gen & 15` ; effets : 1 brûle, 2 empoisonné, 4 ralenti, 8 soulevé — V4.8, balle de Vent) | `hurtZ(…, 'p')` si `Z.gen & 15` est toujours `gén`, effets posés comme le passif (8 : `Z.root` 0,6 s, dehors, pas les gros) |
| compétence | `['c', seq, x, y, z, yaw, pitch, héros, puissance, cases, voie, élément]` (puissance = `hPow` de l'invité ; V4.8 : cases = ses valeurs de `MHMA` ; V4.9 : sa voie `'a'`/`'b'`/`''` et l'élément de son arme) | `useHeroSkill` depuis cette pose, avec sa voie et son élément |
| ultime | `['u', seq, x, y, z, yaw, pitch, héros, puissance, cases, voie, élément]` (puissance = `uPow` de l'invité ; le reste : idem) | `useHeroUlt` depuis cette pose (ultime teinté par son élément) |
| leurre | `['l', seq, x, z, durée, rayon]` | `S.decoy` posé là (le jour seulement) |
| frappe | `['r', seq, x, z, bombes, dégâts]` | comme `useAir`, depuis ce point visé |
| planche | `['k', seq, porte]` | une planche de plus sur `DOORS[porte]` |

Compétence et ultime chez l'hôte : `S.p` (une copie avec la pose de l'invité), `S.hero` (le sien), `S.hm` (bonus du lobby à 0, sauf les cases
`MHMA` envoyées par l'invité depuis la V4.8 : `abRad`, `kDur`, `kWide`, `kLen`, `kPush`, `uRad`, `uDur`, `uExtra`, `uDmg`), `S.P` (avec
sa puissance), `S.hab` (0), `S.ult` (1) sont échangés le temps de l'appel puis tous remis, même en cas d'erreur (`try` / `finally`). La recharge
de l'invité se compte chez lui. Pour **toutes** les actions d'un invité, l'argent, `runKills`, `runCash` et la charge de l'ultime de l'hôte sont
remis comme avant, et les événements `pkill`, `brasier0`, `refus`, `hult`, `eclair`, `rafale` (son voile, ses pièces) retirés : l'invité compte ses
tués et son argent chez lui (`killZ` local). `S.kills`, `S.left`, `S.boss` comptent pour la partie. Ce qui dure (boule de feu, ronces,
météores, bombes, gardiens, orage, Déluge) avance ensuite chez l'hôte comme le sien.

**Chez l'invité** (`S.invite`) : `hurtZ` → `hurtInvite` (vie baissée ici, action `h`, à 0 : `killZ` local puis éteint 1,5 s, `Z.kt`) ;
`useHeroSkill` → `skillInvite` (action `c` ; ici : le bond de Volt, le soin d'Ondine, les effets `maree` / `ronces` / `rempart` / `brasier0` /
`eclair`, le refus du Rempart hors de la rue) ; `useHeroUlt` → `ultInvite` (action `u`, `hult`, soin du Déluge) ; `useLeurre` /
`useAir` → actions `l` / `r` (événements `decoy`, `jet`) ; `plankStep` → action `k` ; `wallDmg` ne casse rien (événement `wallhit` seul).
Les fantômes ne se touchent pas (`shootOne`, `flameShoot` les sautent).

**L'instantané** (6 bits par caractère, A–Z a–z 0–9 - _ ; le format commence par sa version, 1) : en-tête (jour, phase, cause de la défaite,
partie sans fin, rang, temps du jour, hélico, ville et son max, à sortir, sortis, total, restants, fuyards de la partie et du jour, rue du
dernier fuyard `S.escR`, moments des mastodontes, mur d'avenue et sa hauteur, Déluge) ; puis, si la place le permet : tourelles (place,
type, orientation, inclinaison, tire), planches, effets (leurre, remparts, ronciers, gardiens, orages), explosions des 0,6 dernières
secondes (numérotées, `S.mBooms` chez l'hôte), un quart des cloisons (à tour de rôle) ; puis les zombies, triés du plus proche d'un joueur
au plus loin (la hauteur compte double) : les **proches** (place en écarts, génération, x / z à 0,25 m, état, hauteur, type, vie en 16es,
orientation en 16es de tour, effets ; ~40 bits ≈ 7 caractères), jusqu'à 65 % de la place (plus s'il en reste), puis la **foule lointaine**
(x / z à 1 m, hauteur et état s'il n'est pas au sol dehors, type ; ~26 bits ≈ 4 caractères). Jour 10 (1 600 actifs), 3 000 caractères :
**266 proches** (jusqu'à ~38 m) **+ ~185 lointains** ; 1 500 caractères : 127 + 50 ; 6 000 : 544 + 489. Tout tient en proches tant qu'il y a
moins de ~400 zombies (jour 4 : 246 zombies en 1 700 caractères).

**Ce que `appliqueInstantane` fait chez l'invité** : `S.day`, `S.phase`, `S.why`, `S.endless`, `S.dayT`, `S.heliT`, `S.city`, `S.mVilleMax`
(la vie maxi de la ville de l'hôte : `S.P.hp` reste celle de l'invité, c'est aussi sa vie), `S.toSpawn`, `S.spawned`, `S.dayTotal`, `S.left`,
`S.escaped`, `S.dayEsc`, `S.bossAt`, `S.P.mur`, `S.P.murH`, `S.flood`, `S.mRangK` ; `S.tur` (objets complets, gardés d'un instantané à l'autre ;
`t.mTire` : la tourelle tire) ; les planches (`setPlanks`, `S.plankVer`) ; les cloisons (`o.dead`, `S.wallVer`, marche recalculée) ;
`S.decoy`, `S.ramparts`, `S.thorns`, `S.guards`, `S.storms` (mêmes objets d'un instantané à l'autre : l'affichage garde leur âge) ; les
zombies : proches actifs (`Z.fant = 0`) avec une cible `Z.mx / Z.my / Z.mz` (`MULTI.md` disait `Z.tx/ty/tz` : `Z.ty` est le type), la vie
prise au plus bas des deux (la sienne baisse avant que l'hôte le sache) ; lointains en fantômes (`Z.fant = 1`) ; les places absentes
éteintes ; `S.act`, `S.nAct`, `S.free` refaits. Événements poussés comme step l'aurait fait : `dawn` (+ `road`), `clear` (avec **la prime de
l'invité**, ajoutée à son argent), `prep` (vie remise), `heli`, `won`, `dead` (`p.dead`), `escape` (rue du dernier fuyard), `variant` (première
de chaque sorte), `boss`, `boom` (explosions de l'hôte pas encore vues) ; un proche qui disparaît loin du bout des rues laisse un cadavre.

**Ce que `stepInvite` fait** : `playerStep` (déplacement, tir), coup de masse, `navFlush`, temps du jour et recharges (leurre, frappe), les
zombies glissent vers leur cible (en ~0,1 s ; orientation = sens de la marche ; animation selon le chemin fait ; sauté de plus de 8 m : posé
d'un coup), morsures des proches dans l'immeuble et l'escalier (`zBite`), effets qui s'éteignent, traçantes des mitrailleuses qui tirent,
`gridBuild`, `compact`, `corpsesStep`. Aucune sortie de horde, aucune IA, aucune tourelle, aucun projectile.

**`reprendHote`** : les cibles deviennent les places, les fantômes de vrais zombies (vitesse du type, vie pleine) ; dehors : remis sur la
route la plus proche (`mSurRoute` : sur la place, `outRoute` vers le débouché le plus proche ; dans une rue, il court vers son bout ; sur un
mur d'avenue, ce mur) ; dans l'immeuble : envahisseur de l'étage où il est ; dans l'escalier : il continue de monter ; tourelles sans cible,
marche de tous les niveaux à recalculer (`NAVDIRTY`), champ du joueur tout de suite. Les planches arrachées du jour (`torn`) sont perdues.

**Colonnes et champs ajoutés** : `Z.mx`, `Z.my`, `Z.mz`, `Z.kt`, `Z.fant` (mkZ) ; `S.nJoueurs`, `S.invite`, `S.mActions`, `S.mSeq` (newRun) ;
`S.mStat`, `S.mBooms`, `S.mBoomN`, `S.mMurC` (hôte) ; `S.mVu`, `S.mVilleMax`, `S.mRangK`, `S.mBoomVu`, `S.mPris`, `S.mProche` (invité) ;
`S.escR` (escapeZ). Test : `node tests/multiregles.js`.

**Limites connues** : les zombies de l'immeuble chassent l'hôte seulement ; les tués des compétences, ultimes, leurres et frappes d'un
invité ne lui rapportent rien (l'hôte les compte pour la partie, et touche l'argent de ce qui dure) ; ses balles n'abîment pas les cloisons ;
les traçantes, éclairs, flèches, météores de l'hôte ne sont pas recopiés (seulement les explosions) ; les bonus du lobby de l'invité ne
valent pas pour sa compétence exécutée chez l'hôte (sa puissance, si).

## V4.4 : le multi, suite
- `majCibles(S, dt)`, `mCible(S, i)` (multi.js) : les invités chassés dans l'immeuble (`S.mInvites` posé par l'interface, `S.mCibles`).
- `S.mOwn` (l'invité auteur de l'effet en cours), `own` sur les effets, `S.mCredits` (killZ) : ses tués lui reviennent ; `S.floodOwn` pour le Déluge.
- Action `'m'` (cloisons) : `murInvite` chez l'invité, `mAction` chez l'hôte.

