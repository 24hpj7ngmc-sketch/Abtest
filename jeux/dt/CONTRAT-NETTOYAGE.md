# Contrat du nettoyage (V4.0) — à lire en entier avant de toucher au code

Demande de Frédéric (20/11) : faire une passe de nettoyage de Dernier Toit avant de le brancher un jour au lobby (même moteur : three.js r128 + kit K + commandes universelles). Il a choisi de **garder le mode « Ils arrivent » figé** (les deux modes restent jouables, à l'identique).

## La règle d'or : le jeu ne change pas
- **Aucun changement de comportement.** Ni règle, ni chiffre, ni ordre des tirages au hasard (`S.rnd()`), ni affichage, ni son, ni interface. C'est une passe de lisibilité et de rangement, pas une nouvelle version du jeu.
- `node tests/empreinte.js` rejoue 7 parties fixes et compare l'état final, au chiffre près : il doit rester à **7 OK** après chacune de tes étapes. Ne régénère JAMAIS la référence (`--ref`).
- `node tests/tout.js` (tous les tests, ~10 min) ou `node tests/tout.js vite` (règles seules, ~1 min) doit finir par « tout passe ».
- Avance par petites étapes : une étape = un changement + `python3 build.py` + les tests qui la concernent + un commit **de tes seuls fichiers** : `git add <ton dossier> && git commit -m "…" -- <ton dossier>` (jamais `git add -A` : trois agents travaillent en même temps dans le même dépôt ; si git dit que `index.lock` existe, attends 2 s et recommence). Si un test casse, `git diff <ton dossier>` pour trouver la cause, ou revenir en arrière.
- Les autres agents reconstruisent la page en même temps que toi : si un test casse sur une erreur qui vient d'un autre dossier (erreur de syntaxe ailleurs, etc.), attends une minute, reconstruis et relance avant de conclure.

## La structure (déjà en place)
- `regles/` les règles (aucune 3D : tournent aussi sous Node), `affichage/` la 3D, `sons/` le synthé, `interface/` la page (`page.html`) et son code, `gfx/` le kit 3D K, les modèles (`gfx/models/mains.js` armes et outils en main, `gfx/models/toit.js` immeuble, ville, zombies, objets), les photos des armes, le moteur d'aperçu des tests.
- Chaque dossier a un `ordre.txt` : la liste de ses fichiers dans l'ordre où `build.py` les colle. **Tout partage une seule portée globale** (pas de modules ES) : une fonction définie dans `regles/` est appelée telle quelle par `affichage/` et `interface/`.
- `build.py` n'est à modifier par personne d'autre que la session principale. Sorties : `toit.html`, `publie.html` (espaces retirés par esbuild), `test3d.html` (tests), `regles.js` (règles seules, pour les tests Node).
- Tests dans `tests/` (lance-les depuis la racine : `node tests/x.js`). `tests/vieux/` : anciens bancs, à ignorer.

## Ce qu'on attend du nettoyage, dans ton dossier
1. **Découper** chaque gros fichier en fichiers par sujet (≈ 200 à 600 lignes après mise en forme), listés dans `ordre.txt`. L'ordre compte seulement pour ce qui s'exécute au chargement (constantes, tables, code de haut niveau) : les déclarations `function` sont remontées par JavaScript, pas les `const`/`let`.
2. **Mettre en forme** avec prettier (hors ligne) : `node /opt/node-tools/node_modules/prettier/bin/prettier.cjs --write <fichiers>` (réglages dans `.prettierrc.json`, lignes de 140). Attention : prettier ne doit pas casser l'ASI ni les commentaires ; vérifie toujours avec les tests.
3. **Commenter en français** : en tête de chaque fichier, à quoi il sert et ce qu'il fournit aux autres dossiers ; une ligne au-dessus de chaque fonction non évidente ; garder les commentaires utiles existants (mentions de version « V3.4 : … » utiles pour l'historique, à garder courtes).
4. **Nommer clairement** : les noms courts du cœur restent (ils sont partout et documentés dans le glossaire) : `S` (état de la partie), `Z` / `S.z` (tableaux des zombies), `p` / `S.p` (joueur), `P` / `S.P` (améliorations dérivées de l'arbre), `ZT` (types de zombies), `B`, `H`, `LVY`, `NLV`… Les **variables locales** cryptiques peuvent être renommées si c'est sûr. **Un nom utilisé hors de ton dossier ne se renomme pas** (vérifie avec `grep -rn "nom" regles affichage sons interface gfx tests`).
5. **Retirer le code mort** : seulement ce qui n'est appelé nulle part (vérifie dans tous les dossiers et dans les tests). Dans le doute, garde.
6. **Ne pas toucher aux dossiers des autres** (trois agents travaillent en parallèle : règles / affichage + sons + modèles / interface). Si tu as besoin d'un changement ailleurs, note-le dans ton rapport.

## Pièges connus
- Un commentaire `//` inséré au milieu d'une ligne avale tout ce qui suit (arrivé deux fois). Après prettier, les commentaires sont sur leur ligne : garde-les ainsi.
- Les tests de page tournent sur SwiftShader (lent : 2 cœurs, partagés avec les autres agents). Ne lance que les tests utiles à ton étape, `tests/tout.js` à la fin.
- Les tests qui lisent le texte d'une fonction (`fn.toString()`) doivent tolérer espaces et guillemets (esbuild met des guillemets doubles).
- `S.rnd()` : ne jamais changer le nombre ni l'ordre des appels (l'empreinte le verrait).
