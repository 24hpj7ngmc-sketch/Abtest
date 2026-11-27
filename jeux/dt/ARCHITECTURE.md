# Dernier Toit — architecture (V4.2 ; nettoyage du 20/11 en V4.0)

Jeu mobile à la 1re personne (joué sur iPhone, en paysage, dans l'appli Claude) : une horde sort d'un immeuble et fuit par les rues (« Ils s'échappent », le mode sur lequel on travaille) ; l'ancien mode « Ils arrivent » (ils escaladent les façades) est gardé figé. Moteur : three.js r128 + kit 3D maison `K`, le même que le lobby et L'Île des Cinq.

## Les dossiers
| Dossier | Rôle | Guide |
|---|---|---|
| `regles/` (19 fichiers) | Les règles : immeuble, navigation, zombies dehors et dedans, joueur, escalier, escalade, tyroliennes, armes, tourelles, héros, voies des héros, capacités, arbre. **Aucune 3D** : tournent aussi sous Node (tests). | `regles/LISEZMOI.md` (événements `S.ev`, glossaire `S`/`Z`/`p`/`P`, comment ajouter une arme, une variante, un héros, une case) |
| `affichage/` (17 fichiers) | La 3D : ciel, ville, immeuble, cloisons, zombies instanciés, armes en main, tirs, particules, tourelles, effets des héros et des variantes, le Guide (`guide.js`, V4.2), les autres joueurs (`joueurs.js`, V4.3). Lit `S`, traite `S.ev`. | `affichage/LISEZMOI.md` (ce qui est lu, budgets, ordre d'une image) |
| `sons/` | Le synthé WebAudio `SND` (aucun fichier son). | en tête de `sound.js` |
| `interface/` (14 fichiers + `style.css` + `page.html`) | Commandes universelles, HUD, menu, arbre, carte, DEV, tutoriel, sauvegarde, lancement depuis le lobby (`lobby.js`), fiche « Règles » du Guide (`regles.js`, V4.2), le multi (`multi.js`, V4.3 : rôles, publication, instantané, `joueursDistants`), boucle. `pont-lobby.js` : modèle de `dt-pour-lobby.js`. | `interface/LISEZMOI.md` (commandes, cycle, sauvegarde) |
| `gfx/` | Kit `K` et moteur d'aperçu `three-lite` (partagés avec les autres jeux : ne pas modifier ici), modèles (`models/mains.js`, `models/toit.js`, `models/pnj.js` : le Guide, et `models/shared.js` : les motifs `SH` du corps des autres joueurs, repris tels quels du lobby), photos des armes (`photos.js`, généré par `outils/`). | en tête des fichiers |
| `tests/` | Les tests (voir plus bas). `tests/vieux/` : anciens bancs. | en tête de chaque test |
| `outils/` | Photos des armes du menu : `node outils/photos.js && python3 outils/photos.py`. | |

Tout est collé dans **une seule portée globale** par `python3 build.py`, dans l'ordre des `ordre.txt` de chaque dossier : l'interface d'abord (`/*@UI@*/`, son lancement est différé d'une micro-tâche), puis le kit et les modèles, les règles, les sons, l'affichage. Sorties : `publie.html` (la page publiée, espaces retirés par esbuild), `test3d.html` (tests, three-lite), `regles.js` (règles seules, tests Node), `toit.html`.

## Une image
`interface/boucle.js` : entrées tactiles → `step(S, dt, inp)` (règles ; en multi, `stepInvite` chez l'invité, voir `MULTI.md`) → événements `S.ev` → `gfxEvent` (3D) et `events` (sons, messages) → `gfxFrame` (3D) → `uiTick` (HUD).

## Les tests
- `node tests/tout.js` : tout (~15 min) ; `node tests/tout.js vite` : règles seules (~1 min).
- `tests/empreinte.js` : rejoue 7 parties fixes et compare l'état final au chiffre près. **Tout changement voulu des règles** se fait dans un commit à part, avec `--ref`, et se dit dans le message.
- `tests/images.js` (21 situations 3D, temps et hasard figés) et `tests/ecrans.js` (14 écrans d'interface) : comparent au pixel près (`--ref` pour les références, après un changement voulu).
- Les autres : règles (v15test, herotest, v39sim, baltest…) et page (v15ui, armes, armes2, menutest, devtest, climbtest, shoptest, ziptest, v37test, variantes, herofx, sndtest, sprinttest, portee, lobbytest, synchrotest, guidetest, multitest).

## L'historique
- `git log` (dépôt local depuis le 20/11) ; `NOTES.md` : toutes les versions, avec les mots de Frédéric ; `CONTRAT-NETTOYAGE.md` : les règles du nettoyage ; `LOBBY.md` : le contrat du branchement au lobby (V4.1) ; `PASSATION.md` : la passation à Claude Fable 5.2 ; `BRANCHEMENT.md` : le plan pour le brancher au lobby.
