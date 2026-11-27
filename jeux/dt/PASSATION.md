# Passation — brancher Dernier Toit au lobby (pour Claude Fable 5.2)

Écrit le 20/11/2026 par la conversation qui fait Dernier Toit (Claude Opus 5.5), à la demande de Frédéric :
« Les mêmes armes de ce mini-jeu, partout. Tu peux préparer ton partage sur Fable 5.2. Je lui transmets et il intègre le jeu au
lobby. (On continuera de taffer ensemble sur ce jeu ici après.) »

**Ta mission** : mettre Dernier Toit derrière le deuxième portail du lobby (scellé aujourd'hui), et faire des armes de Dernier Toit
les armes de tout le jeu. Dernier Toit lui-même continue d'avancer dans l'autre conversation : tu le branches, tu ne le modifies pas.

## 1. Frédéric, et comment travailler avec lui
- Il joue uniquement sur son **iPhone 17, dans l'appli Claude** (écran 966 × 366 dans l'appli, tactile). Parfois sur itch.io.
- Réponds **en français, court, le résultat d'abord**. Dis franchement ce qui n'a pas été vérifié (rien n'est jamais testé sur son téléphone).
- **N'envoie que la page du jeu** ; l'atelier (sources) se mentionne en une ligne au plus, jamais envoyé.
- Titre de page versionné, augmenté à chaque publication (le lobby : « Abtest. Vx.y » ; il en est à V9.9 dans l'atelier).
- Pas de questions inutiles : fais des choix sensés et dis-les. Quand tu proposes une liste numérotée, il répond par le numéro (« 2 go »).
  Son clavier corrige parfois ses mots (« au lac » = « au max »).
- Quand il demande de « ranger » quelque chose dans un bouton, il faut l'enlever de là où c'était.
- Ce que tu dessines doit marcher comme ça en a l'air (une échelle se monte, une porte s'ouvre).
- **Commandes universelles** : la même disposition partout (lobby, L'Île des Cinq, Dernier Toit) — ne pas en inventer d'autres.
- Agents : deux ou trois à la fois au plus, avec audit.

## 2. Ses décisions (à respecter)
1. **Dernier Toit « sur le même moteur que le lobby, comme le reste »** (20/11). C'est déjà le même moteur (three.js r128, kit `K`,
   commandes universelles) ; il reste le branchement.
2. **« Les mêmes armes de ce mini-jeu, partout »** (20/11) : les 6 armes de Dernier Toit, en style moderne « classique », deviennent les
   armes du lobby, de L'Île des Cinq et de tout mini-jeu à venir (La Ruée des Reliques le jour où elle sera branchée). Détail au §5.
3. **Le système d'armes du lobby reste** (17/11) : une arme appartient au joueur, se monte à la salle d'armes (arbre Général, arbre
   par mini-jeu, arbre d'élément), et chaque mini-jeu dit lesquelles il accepte (`WT[...].games`, `armMods(jeu, arme)`, `armsOf(jeu)`).
4. Dans Dernier Toit, on ne travaille que le mode **« Ils s'échappent »** ; « Ils arrivent » est figé (gardé, pas retiré). Au portail : ne
   propose que « Ils s'échappent » (le pont le force).
5. **L'objectif final est le lobby à plusieurs** (ses amis sur son île, héros choisis ensemble, portail en groupe) : ne rien bâtir qui
   l'empêche. Dernier Toit est solo pour l'instant.

## 3. Où sont les choses
- **Docs du projet Jv** (à lire d'abord) : `claude/ile-des-cinq-fabrication.md` (lobby + L'Île des Cinq, pages, comment reconstruire
  l'atelier du lobby), `claude/lobby-idee.md`, `claude/dernier-toit-fabrication.md`, `claude/reliques-fabrication.md`.
- **Lobby + L'Île des Cinq, atelier V9.9** (sources) : slug `cec58513-b242-4574-b778-d19d66980ac2`
  (https://claude.ai/artifact/SXv8KoLtRswBeXwxWdvzFj). Page du jeu V9.7 : publique, donc figée (https://claude.ai/artifact/LkBTseH2BjbsA6832HEC3J).
- **Dernier Toit, atelier V4.1** : slug `6b1ef180-3c29-4b72-babd-cd51fc116ec4` (https://claude.ai/artifact/EED8CeDSzcvtjiZUkd9i4s).
  Ce qu'il te faut :
  - `src/dt-pour-lobby.js` — **le jeu entier à coller dans le lobby** (~380 Ko, une seule variable globale `DernierToit`) ;
  - `src/LOBBY.md.txt` — le contrat (entrée, bonus, messages de fin) ; lis-le en entier ;
  - `src/gfx/models/mains.js` — les modèles des 6 armes tenues en main ; `src/affichage/armes.js` — comment Dernier Toit les tient,
    vise, recule, pompe et crache la flamme ; `src/gfx/photos.js` — leurs photos (`WPHOTO`, PNG 240 × 90) ;
    `src/regles/armes.js` — leurs profils ; `src/sons/sound.js` — un son de tir par arme et la boucle du lance-flammes.
  - Récupérer des fichiers : `list_files` (slug), puis `read_file` avec `paths` (32 au plus par appel) : ils arrivent sur le disque
    sous des noms au hasard, reconnais-les par leur sha256. Les `.md`, `.py`, `.html` y portent un `.txt` en plus.
- **Dernier Toit, page du jeu V4.1** (privée, seule) : https://claude.ai/artifact/S9h27b9tyeDbFXezXbN97a — pour essayer le jeu seul.

## 4. Contraintes du compte
- Réseau coupé : tu peux **lire** toutes ces pages, mais **pas republier** une page créée par une autre conversation. Tu créeras donc
  une **nouvelle page pour le lobby** (et un nouvel atelier). Une page passée en public ne se republie plus jamais.
- Pas de `pip` ni de `npm` ; playwright, chromium, sharp, prettier (`/opt/node-tools`), esbuild (`/opt/npm-tools`) sont déjà là.
- `publish_files` refuse les fichiers sous `/tmp` : travaille sous `/home/claude`.

## 5. Les armes partout
Les 6 armes (clés, noms au menu, profils de Dernier Toit en multiplicateurs de son fusil) :

| clé | nom | dégâts | cadence | portée | particularité |
|---|---|---|---|---|---|
| `fusil` | Fusil | 1 | 1 | 150 m | la référence, polyvalent |
| `pistolet` | Pistolet | 1,4 | 0,86 | 60 m | +5 % critique |
| `assaut` | Fusil d'assaut | 0,7 | 1,95 | 50 m | rafales légères |
| `sniper` | Fusil de sniper | 4,6 | 0,27 | 160 m | traverse 1 zombie, lunette (tenir Tir vise, relâcher tire) |
| `pompe` | Fusil à pompe | 0,62 × 8 plombs | 0,22 | 30 m | gerbe, dégâts qui baissent avec la distance |
| `lance` | Lance-flammes | 0,38 | 2,7 | 10 m | cône (~22°), enflamme, pas de critique |

Ce que je te propose (choix à lui annoncer, il tranchera s'il veut autre chose) :
- **Apparence** : les modèles en main du lobby et de L'Île des Cinq (`vm.pistolet`, `vm.assaut`, `vm.sniper`) sont remplacés par ceux de
  Dernier Toit. `mains.js` de Dernier Toit est un bloc `{ … }` (ses outils ne fuient pas) : colle-le après les modèles du lobby et
  n'en garde que les 6 armes (`vm.fusil`, `vm.pistolet`, `vm.assaut`, `vm.sniper`, `vm.pompe`, `vm.lance`) ; laisse au lobby son marteau,
  sa pelle et le reste. Gants et manches : `ctx.H = { sleeve, sleeveD, glove, gloveD }` (couleurs), gris neutres sans `H`.
  Chaque arme rend aussi `hold`, `aim`, `tip` (et `pump` pour la pompe) : position en main, position visée, bout du canon — vérifie que
  l'affichage du lobby les lit, ou reprends la logique d'`affichage/armes.js`. Les formes viennent de graines `K.make(n)` : ne change ni
  l'ordre des ajouts, ni les graines.
- **Progression** : Pistolet, Assaut et Sniper gardent leur entrée `WT`, leurs arbres et la sauvegarde des joueurs ; Fusil, Fusil à pompe
  et Lance-flammes s'ajoutent à `WT` (avec `mkArm`). Les six ont `games: ['ile', 'toit']`.
- **Dans L'Île des Cinq** : les trois nouvelles armes demandent leur façon de tirer (gerbe de plombs pour la pompe, cône qui brûle pour
  le lance-flammes) ; chiffres en premier jet, pris sur les rapports ci-dessus, à dire comme tels.
- **Photos** (salle d'armes, panneau du portail) : `WPHOTO` de `gfx/photos.js`.

## 6. Brancher Dernier Toit au portail
1. Reconstruis l'atelier du lobby (marche à suivre dans `claude/ile-des-cinq-fabrication.md`, « Pour reprendre »), lis son `NOTES.md`.
2. Ajoute `dt-pour-lobby.js` **comme un fichier à part de l'atelier du lobby, collé tel quel par sa construction** (ne le modifie jamais :
   une nouvelle version de Dernier Toit = remplacer ce fichier, rien d'autre).
3. Portail : `LGAMES`, identifiant `'toit'`, nom « Dernier Toit ». Le panneau du portail remplace le menu de Dernier Toit : héros (les
   5 éléments), arme parmi `armsOf('toit')` avec son niveau, ce qu'on emporte (préparatifs), « Entrer ».
   À l'entrée : `DernierToit.ouvrir({ heros, arme, bonus }, { fin, retour })`, et **mets le lobby en pause** tant que
   `DernierToit.ouvert` (boucle, rendu WebGL, sons) : deux rendus 3D en même temps sur l'iPhone, c'est trop.
4. **Bonus** : convertis ce que le lobby donne en champs de `bonus` (voir `LOBBY.md`) : arbre Général et arbre `toit` de l'arme →
   `degats`, `cadence`, `critique` ; arbre du héros (`heroMods`) → `heroDegats`, `recharge`, `vie` ; affûtage → `degats` ×1,1 ;
   provisions → `vie` +15. La portée et l'arbre d'élément ne sont pas repris par Dernier Toit pour l'instant (ses héros ont déjà leurs
   effets de balles) : dis-le.
5. **Récompenses** : `fin(m)` arrive une fois par partie. Fais l'équivalent de `lobReward` : or céleste `save.gold`, éclats du héros,
   butin `save.loot`, record `save.rec.toit` (meilleur jour), quêtes de la taverne (`qGame`), réserves des bâtiments qui se remplissent
   « à chaque partie terminée ». Base-toi surtout sur `jour` et `victoire` (l'argent de Dernier Toit grimpe très vite d'un jour à l'autre) ;
   chiffres en premier jet. Ajoute les nouveaux champs à la relecture de la sauvegarde du lobby (elle relit champ par champ).
6. `retour()` : l'iframe est déjà retirée ; reprends le lobby devant le portail, avec ce qu'il a gagné affiché.
7. Teste comme `tests/lobbytest.js` de Dernier Toit (page hôte, iframe, messages), plus les tests du lobby (`./mktest.sh`, `node run1.js`).

## 7. Pièges connus
- Un commentaire `//` en milieu de ligne a déjà avalé du code au moment de coller les fichiers : vérifie la syntaxe de la page finale.
- `three-lite` (le moteur d'aperçu des tests) n'est pas le vrai three.js r128 : la page publiée charge le vrai.
- Rien n'a tourné sur l'iPhone : deux WebGL, l'encoche dans une iframe (le pont la mesure dans la page du lobby et la passe), le son (il se
  réveille au premier toucher dans le jeu), itch.io (iframe dans l'iframe d'itch).
- Le lobby ne doit jamais toucher `localStorage['dernier-toit-v1']` (la sauvegarde du jeu, même origine que le lobby).

## 8. Livraison
- Une **nouvelle page** pour le lobby (« Abtest. V10.0 » ou la suivante), un nouvel atelier ; mets à jour `claude/ile-des-cinq-fabrication.md`
  (nouveaux liens, ce qui a été fait) et la section « Lobby » de `claude/dernier-toit-fabrication.md` (lien du lobby qui contient Dernier Toit,
  version de `dt-pour-lobby.js` collée).
- Message à Frédéric : court, en français ; ce qui marche, ce qui n'a pas été vérifié, tes choix (§5) à confirmer.
- Pour la suite : quand Dernier Toit avancera dans l'autre conversation, son atelier aura un nouveau `src/dt-pour-lobby.js` (même contrat) ;
  le brancher = remplacer le fichier et republier le lobby. Si le lobby a besoin d'un changement dans Dernier Toit (nouveau champ de bonus,
  nouveau message), demande-le par Frédéric à l'autre conversation plutôt que de modifier le fichier.
