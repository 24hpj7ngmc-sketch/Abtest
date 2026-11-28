# interface/ — la page de Dernier Toit et son code

Tout ce qui se voit et se touche par-dessus la 3D : les commandes tactiles, la barre d'outils, le HUD, les messages, le menu de départ,
l'écran de fin, l'arbre d'améliorations, les cartes, le panneau DEV, le tutoriel, la boucle de chaque image et la sauvegarde.

- `page.html` ne garde que le **squelette HTML** et les **marqueurs** que `build.py` remplace : `/*@CSS@*/` (dans le `<style>`) ← `style.css` ;
  dans le `<script>` : `/*@UI@*/` ← les fichiers de `ordre.txt`, puis `/*@GFX@*/` (kit 3D K, modèles, photos des armes), `/*@SIM@*/` (`regles/`),
  `/*@SOUND@*/` (`sons/`), `/*@SCENE@*/` (`affichage/`).
- Tout partage **une seule portée globale** (pas de modules) : l'interface appelle les fonctions des règles et de l'affichage par leur nom,
  et les tests appellent beaucoup de fonctions de l'interface par leur nom. **Un nom utilisé hors de `interface/` ne se renomme pas.**
- Garde-fous : `node tests/ecrans.js` (14 captures fixes de l'interface, sans la 3D, comparées pixel par pixel à `tests/ecrans-ref/`),
  les tests d'interface (`v15ui`, `menutest`, `devtest`, `shoptest`, `climbtest`, `ziptest`, `v37test`, `sprinttest`), et `node tests/tout.js`.

## L'ordre de chargement (à connaître avant d'ajouter du code)

L'interface est collée **avant** la 3D, les règles et les sons, parce que les sons lisent `save.snd` dès le chargement
(`sons/` crée `SND` tout de suite). Conséquences :

1. `sauvegarde.js` vient en premier (`$`, `save`).
2. **Au chargement, le code de l'interface ne doit utiliser aucune constante (`const`, `let`) des autres dossiers** : `HEROS`, `WEAP`, `SND`,
   `camera`… n'existent pas encore. Seulement dans des fonctions appelées plus tard (les `function` des autres dossiers sont remontées
   par JavaScript, mais elles utilisent elles-mêmes des constantes pas encore prêtes : ne les appelez pas au chargement non plus).
3. Le lancement (`gfxInit`, `newRun`, `showStart`, la boucle, `window.__dt`) est à la fin de `boucle.js`, dans un `queueMicrotask` :
   il part juste après la fin du script, quand tout est défini, avant la première image.
4. Ce qui s'exécute au chargement dans l'interface : la lecture de la sauvegarde, les écouteurs posés sur les boutons de la page,
   les 4 étiquettes des repères au bord de l'écran, le contexte 2D de la mini-carte, les options DEV (`devO`). L'ordre des fichiers compte
   pour les écouteurs posés sur un même bouton : ceux des boutons (`commandes.js`, en haut) passent avant ceux de la caméra (`pDown`, plus bas).

## La carte des fichiers

Dans l'ordre de `ordre.txt` (lignes après mise en forme prettier) :

| Fichier | Lignes | Ce qu'il contient |
|---|---|---|
| `sauvegarde.js` | 106 | `$`, la sauvegarde (`SAVEK`, `save`, `store`), `fmt`, `setTxt`, l'état partagé de l'interface (`S`, `running`, `tool`, `ads`, `joy`…) |
| `menu.js` | 296 | `newGame`, `dayLine`, `ov`, `hideAll`, la campagne (`CAMPO`, `campOf`), le menu de départ `showStart`, l'écran de fin `showEnd` |
| `hud.js` | 377 | `toast`, `bigMsg`, les gains qui flottent (`floater`), `treeBtn`, `prepUI`, `uiTick` (chaque image : chiffres, panneau du jour, noms des boutons, Action), les repères au bord (`edgeTick`, `edgeOut`), `onTarget` (tir auto) |
| `outils.js` | 190 | La barre d'outils (`TOOLS`, `hotBuild`, `hotTick`), `setTool`, `setWeap`, la sous-barre (`subBuild`), la visée au marteau (`pickSlot`, `doorName`) |
| `commandes.js` | 437 | Les commandes universelles : double appui (`dbl`), `padSet`, Action (`padAct`, `placeAct`), bouton libre (`padFree`), quart de rond, Saut (vol libre DEV au double appui, `toggleFly`), Sneak, Compétence / Ultime (`heroSk`, `heroUl`), `fit` (portrait), joystick et caméra (`pDown`, `pMove`, `pUp`, `turn`), clavier (`keys`) |
| `carte.js` | 219 | `drawMap` (mini-carte et grande carte), `openMap`, `mapDraw` (réglages : Son, Tir auto, Caméra, Mode dev, Abandonner) |
| `dev.js` | 201 | Le bouton DEV et son panneau (`devO`, `devBuild`, `devTick`, `devSpawn`, `devFill`, `devDay`, `devKill`), `flying` |
| `arbre.js` | 277 | L'arbre : `nodeVal` (valeurs affichées), `openTree`, `treeDraw`, la fiche `tInfo` (Acheter), le glisser de la carte |
| `evenements.js` | 155 | `events` : chaque événement des règles (`S.ev`) → affichage (`gfxEvent`), sons, messages, fin de partie |
| `tutoriel.js` | 65 | `TUTO`, `TUTO_OUT`, `tutoTick` ; V4.2 : `tutoPossible`, `tutoStart` (relancé depuis la fiche des règles) |
| `lobby.js` | 69 | V4.1 : lancé depuis le lobby (`window.DT_LOBBY`) : `LOBBY`, `lobbyPret`, `lobbyFin`, `versLobby` (voir `LOBBY.md`) |
| `regles.js` | 307 | V4.2 : le Guide « Règles » : sa place sur le toit (`GUIDEP`), le bouton « Règles » à côté de lui (`guideNear`, `rulesBtn`), la fiche à cinq onglets (`rulesOpen`, `guideShow`, `#guideV`, en pause comme l'arbre), son contenu (`CMDS` commun à tous les jeux, `RULES_TOIT`) |
| `multi.js` | 520 | Le multi (lancé du lobby avec `multi`, voir `MULTI.md` et `LOBBY.md`) : `MULTI` (rôle, pairs, taille), `nomPropre`, les listes du lobby (`multiPairs`, tout vérifié), `multiAvant` (instantané chez l'invité, actions des invités et `S.nJoueurs` chez l'hôte, reprise d'hôte), `multiTick` (publication 10 fois/s, autres joueurs lissés, compteur « N sur le toit », bouton du jour de l'invité), `joueursDistants()` (pour l'affichage) |
| `boucle.js` | 210 | `frame` (la boucle) et le lancement |
| `style.css` | 1350 | Tout le style (un seul fichier : `build.py` n'en colle qu'un) |

Chaque fichier commence par ce qu'il contient, ce qu'il utilise des règles, de l'affichage et des sons, et ce que les tests y appellent.

## Les commandes universelles (règle de Frédéric : la même disposition dans tous ses jeux)

Reprises à l'identique de L'Île des Cinq, téléphone en paysage :

```
haut :   (mini-carte)   [ panneau du jour / Lancer le jour ]   [Ville $ Jour Zombies Dedans Niv.]
         [DEV]          (entre deux jours seulement)                             [Boutique]
milieu :                              (réticule)
                                  « étiquette d'action »                (Ultime)
                                                                  (Compétence)
bas :    ( joystick )        [sous-barre]                                    ╱  Saut
                        [Fusil Masse Marteau Leurre Frappe]       (libre) (Sneak) ╱ Tir
                                  [—— vie ——]
```
**V4.5 : l'ATH au modèle de L'Île des Cinq V1.2** (décision de Frédéric du 24/11, `claude/mini-jeu-contrat-lobby.md`, « L'ATH par défaut ») :
pas de bandeau pendant le jour (le panneau du haut ne sert qu'entre deux jours, au jour tenu et à l'hélico ; `#wave.vide`) ; les zombies
restants (`#sLeft`) et ceux entrés dans l'immeuble (`#sIn`, en rouge, seulement s'il y en a) sont des chiffres de plus en haut à droite ;
la vie est une barre fine sans chiffres sous la barre d'outils (`#hp`, `order: 3`), et le chiffre « Vie » du haut ne reste que dans
« Ils arrivent » ; l'étiquette d'action est une ligne sans cadre sous le viseur (`#aLab`, orange si la pose est refusée) ; le joystick est
à peine visible au repos et s'allume sous le pouce (`#joy.on`) ; barre d'outils et choix des tourelles un peu plus petits ; chiffres et
bouton Boutique / Améliorations plus serrés, le bouton pâli quand rien n'est achetable (`#bTree.has`). Captures aux tailles de son
téléphone : `node tests/shothud.js` ; vérifications : `tests/athtest.js`.
(schéma approximatif : le quart de rond Tir / Saut occupe le coin bas droit, coupé en diagonale ; l'arc Sneak → Compétence → Ultime
monte le long de son bord)

- **Pouce gauche** : le joystick, n'importe où dans le coin bas gauche (40 % de la largeur, sous les 30 % du haut) ; poussé presque
  à fond vers l'avant, on sprinte (et on se relève de Sneak).
- **Pouce droit** : la caméra, partout ailleurs, y compris en glissant depuis un bouton rond (les boutons passent aussi le doigt à `pDown`).
- **Quart de rond** dans le coin bas droit (`#padMain`), coupé en diagonale : **Tir / Action** dessous (`#bFire`), **Saut** dessus (`#bJump`,
  qui devient Grimper, Descendre, Tyrolienne, Lâcher au bon endroit). Un appui près de la diagonale va au bon côté.
- **Le long de l'arc** : **Sneak** (interrupteur), **Compétence** (Missile, ou la compétence du héros), **Ultime** (Onde, ou l'ultime du héros) ;
  Compétence et Ultime demandent **deux appuis** (le premier arme le bouton, liseré blanc).
- **Bouton libre** à gauche de l'arc (`#bFree`) : Viser au fusil (un appui), Retirer une tourelle au marteau (deux appuis) ; caché sinon.
  L'**étiquette d'action** (`#aLab`, une ligne sous le viseur depuis la V4.5) dit ce que fait Action ici (« Toit · bord nord », « Barricader »…).
- **Barre d'outils** en bas au centre ; elle s'estompe 3,5 s après le dernier appui quand le fusil est en main.
- Petits écrans (moins de 800 px, classe `sm`) : les boutons rapetissent ; portrait (classe `rot`) : toute la page tourne de 90°.

## Le cycle d'une image (`frame`, dans `boucle.js`)

1. Temps : `dt` plafonné à 0,05 s ; multi (`multiAvant`, rien sans multi) ; compteur DEV (`devTick`) ; la foule s'adapte aux images/s (`S.cap`, 700 à 2 200 zombies en même temps).
2. **Si la partie tourne** (`running` et aucun écran par-dessus, `ov()`) :
   - **entrées** : joystick ou clavier (`f`, `r`), sprint, tir auto (`onTarget`, toutes les 0,08 s), tir tenu, sniper (lunette tant que Tir est tenu,
     le coup part au relâché), masse et planches tenues ;
   - **règles** : `step(S, dt, entrées)` (2 ou 4 fois avec la vitesse DEV) ; en multi, l'invité fait `stepInvite` (une fois) ; jours auto DEV
     (pas chez l'invité) ; balancement et bruit des pas ;
   - **événements** : `events()` (sons, messages, fin de partie) ;
   - **HUD** : `uiTick(dt)` (chiffres, panneau du jour, boutons, Action, réticule, repères), puis `tutoTick(dt)` ;
   - grognements au hasard, hélico, sauvegarde automatique toutes les 10 s.
   - V4.3 : sinon, l'hôte d'une partie à plusieurs qui a ouvert un écran fait quand même un pas sans ses commandes (`multiHoteOccupe`).
3. **Toujours** : `multiTick` (multi seulement), réticule qui revient, gains qui flottent (`flosTick`), **affichage** 3D (`gfxFrame(S, dt, {outil, visée, emplacement visé…})`),
   lunette, mini-carte (toutes les 0,12 s).

## La sauvegarde

Dans le `localStorage` du navigateur, une seule clé : **`dernier-toit-v1`** (chaque page publiée a la sienne), un objet JSON écrit par `store()`
(après chaque choix, achat, fin de journée, et toutes les 10 s en partie). Valeurs par défaut dans `sauvegarde.js`.

| Champ | Ce que c'est | Écrit par |
|---|---|---|
| `cash` | argent | règles (gains), arbre (achats), DEV |
| `lv` | niveaux de l'arbre `{ root: 1, f_dmg: 2… }` | arbre, DEV |
| `layout` | plan des tourelles : numéro d'emplacement → type (`mg`, `la`, `mo`, `fl`) | marteau, DEV |
| `best`, `bestF`, `bestEnd` | meilleur jour « Ils arrivent », « Ils s'échappent », sans fin | règles, écran de fin |
| `runs`, `runsOut`, `won`, `kills` | parties lancées (dont mode fuite), sauvetages ; `kills` n'est plus tenu | `newGame`, règles |
| `endlessRun` | la partie en cours est sans fin | `newGame` (lu par les règles) |
| `mode`, `hero`, `weap`, `stage`, `camp` | choix du menu : mode `'in'` / `'out'`, héros, arme, niveau de campagne ; niveaux finis par type | menu, victoire |
| `snd`, `auto`, `sens`, `dev`, `fps` | réglages : son, tir auto sur cible, vitesse de la caméra (0,7 / 1 / 1,35 / 1,7), mode dev, images/s | menu, grande carte, DEV |
| `devOpt` | options du panneau DEV : `fly`, `god`, `speed`, `auto` | DEV |

## Comment ajouter…

**Un bouton (HUD).** L'ajouter dans `page.html` (dans `#hudIn` ; dans `#pads` s'il appartient aux commandes), son style dans `style.css`
(position absolue dans le calque), son écouteur dans le fichier de son sujet (`commandes.js` pour une commande : `pointerdown` +
`e.preventDefault()`, `dbl(e)` s'il faut deux appuis, `if (!running || ov()) return;` s'il n'agit qu'en partie), et son état à chaque image
dans `uiTick` (`setTxt` / `setLbl` / `classList.toggle` : ne toucher la page que si quelque chose change). Pour qu'il laisse aussi tourner
la caméra, l'ajouter à la liste des boutons de la boucle `for (const el of [canvas, $('bFire'), …])` de `commandes.js`.

**Une page (un écran par-dessus le jeu).** Un `<div id="…" class="veil" hidden><div class="card">…</div></div>` dans `page.html`
(`.veil` couvre tout l'écran, `.card` est le panneau) ; une fonction qui le remplit et le montre (comme `showStart`, `openMap`) ;
**l'ajouter à `hideAll()` et à `ov()`** (`menu.js`) pour que la partie se mette en pause tant qu'il est ouvert et qu'il se ferme au lancement ;
un bouton Retour qui le cache (et remet `running = true` si on l'a ouvert en partie, comme l'arbre). Ajouter une capture à `tests/ecrans.js`.

**Une option DEV.** Dans `devBuild()` (`dev.js`) : `bouton('Nom : <b>' + (devO.x ? 'oui' : 'non') + '</b>', () => { devO.x = !devO.x; }, devO.x)`.
Le panneau se refait et `devO` est gardé dans `save.devOpt` après chaque appui ; une valeur par défaut se met dans
`Object.assign({ speed: 1, … }, save.devOpt)`. Si l'option agit à chaque image, la lire dans `frame` (`boucle.js`), comme `devO.speed`
ou `devO.auto`. Un outil qui ne fait qu'une action (comme « + 100 000 $ ») n'a pas besoin de `devO`.

## Ce que les tests utilisent (à ne pas renommer)

Par leur nom, dans la page : `S`, `running`, `tool`, `ptype`, `ads` (écrit), `bob`, `bobT`, `showStart`, `newGame`, `openTree`, `openMap`, `showEnd`,
`setTool`, `setWeap`, `uiTick`, `events`, `devSpawn`, `devO`, `flying`, `window.__frames`, et `window.__dt` (`S`, `save`, `newGame`, `startDay`,
`openTree`, `setTool`, `store`, `treeSel`, `ui`). Et beaucoup d'ids et de classes : `#bJump`, `#bFire`, `#padMain`, `#hot .slot[data-k]`,
`#sGrid .pick`, `#sArms .wpk`, `#sCamp .tchip`, `#devB`, `#devP button`, `#tInfo .fx`, `#bTree`, `#tClose`, `#mapV`, `#big`, `.ver`…

## Hors de la page
`pont-lobby.js` n'est pas collé dans la page : c'est le modèle de `dt-pour-lobby.js` (le jeu pour le lobby), que `build.py` remplit avec la page publiée. Contrat : `LOBBY.md` à la racine.
V4.3 : le pont fait suivre `DernierToit.pairs(liste, moi)` au jeu (`{ dt: 'pairs', liste, moi }`) et l'état publié par le jeu (`{ dt: 'etat', d }`)
à `rappels.etat(d)`, s'il ne dépasse pas `opts.multi.max`.

## Le multi (`multi.js`)
- Rien ne s'exécute sans `LOBBY.multi` (`MULTI.actif` faux) : `node tests/empreinte.js` et les captures ne changent pas.
- **Tout ce qui vient du lobby est vérifié** dans `etatPropre` et `multiPairs` (nombres bornés, textes courts, 16 joueurs, 8 actions) ; un nom
  ne s'affiche qu'après `nomPropre`, et seulement par `textContent` (`toast`).
- Les fonctions des règles du multi (`encodeInstantane`, `appliqueInstantane`, `stepInvite`, `appliqueActions`, `reprendHote`) ne sont
  appelées que si elles existent, dans un `try` (une erreur s'écrit dans la console, la partie continue).
- Chez l'invité : la fin de partie vient de l'instantané (phase `dead` / `won`, vue en cours depuis `newGame`) → `showEnd` → son propre `fin` ;
  une partie déjà finie chez l'hôte n'est pas recopiée (« attends qu'il en relance une »).
- Boucliers : `multiBoucliers` (avant chaque pas) lit le champ `B` publié par les autres (`etatPropre` le vérifie : 5 nombres bornés) et pose le bouclier de la Soigneuse (`bouclierAllie`) à celui qui est dans la zone.
- Test : `node tests/multitest.js`, et `tests/v56page.js` (boucliers, sons des sorts).
