# Brancher Dernier Toit au lobby

**V4.1 (20/11) : le côté Dernier Toit est prêt** (contrat dans `LOBBY.md`, fichier `dt-pour-lobby.js`, test `tests/lobbytest.js`). Le côté lobby est confié à Claude Fable 5.2 : sa passation est `PASSATION.md`.

Décision de Frédéric (20/11) : Dernier Toit passera sur le même moteur que le lobby, « comme le reste » ; le même jour, il a demandé de le brancher tout de suite (par Claude Fable 5.2), le travail sur le jeu continuant ici. Le moteur est déjà le même (three.js r128, kit 3D `K`, commandes universelles, moteur d'aperçu three-lite pour les tests) : ce qu'il reste, c'est le branchement.

## Côté lobby (atelier de L'Île des Cinq, `cec58513-…`, `src/tpl.html.txt`, `src/NOTES.md.txt`)
D'après ses notes (V8.7 à V9.9) :
- **Portail** : ajouter le jeu dans `LGAMES` (identifiant proposé : `'toit'`), le deuxième portail est scellé et l'attend.
- **Récompenses** : comme `lobReward` pour L'Île des Cinq, une fonction qui convertit une partie en or céleste `save.gold`, en éclats du héros et en butin `save.loot` ; records dans `save.rec.toit` ; quêtes de la taverne avec `qGame`.
- **Héros** : au lobby, chaque héros a son arbre (payé en éclats, `heroMods(el)`). Les héros de Dernier Toit portent les mêmes éléments (`feu`, `eau`, `bois`, `terre`, `elec`) : on garde leurs kits propres à l'immeuble (Brasier, Marée, Ronces, Rempart, Éclair…) et on lit les bonus de l'arbre du lobby (dégâts, recharge, vie) en plus.
- **Armes** : au lobby, une arme appartient au joueur et chaque jeu dit lesquelles il accepte (`WT[...].games`, `armMods('toit', arme)`, `armsOf('toit')`). **Décision de Frédéric (20/11) : « Les mêmes armes de ce mini-jeu, partout. »** Les 6 armes de Dernier Toit (fusil, pistolet, assaut, sniper, pompe, lance-flammes), avec leurs modèles (`gfx/models/mains.js`), deviennent les armes du lobby, de L'Île des Cinq et des mini-jeux à venir ; le système d'arbres du lobby reste.
- **Sauvegarde** : le lobby relit sa sauvegarde champ par champ (tout nouveau champ doit y être ajouté). Dernier Toit garde la sienne (`dernier-toit-v1`) pour ce qui lui est propre (arbre d'améliorations de l'immeuble, plan des tourelles, campagne).
- La page du lobby est publique (figée) : le branchement donnera une nouvelle page.

## Côté Dernier Toit (fait en V4.1)
- Le jeu tourne dans une iframe ouverte par `DernierToit.ouvrir(opts, rappels)` (fichier `dt-pour-lobby.js`, seule variable globale) : aucun nom, style ni identifiant HTML ne se heurte à ceux du lobby, et une nouvelle version se branche en remplaçant ce fichier.
- Entrée : héros, arme, jour, bonus (dégâts, cadence, critique, vie, force et recharge du héros), encoche. Sortie : un message `fin` par partie (victoire, jour, tués, fuyards, argent, raison) et `retour` (« Retour au lobby »). Détails : `LOBBY.md`.
- Dernier Toit garde sa sauvegarde (`dernier-toit-v1`) pour ce qui lui est propre (argent `$`, arbre de l'immeuble, plan des tourelles, campagne).
