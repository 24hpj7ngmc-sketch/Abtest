# Brief — décors de paysage par thème (lobby « Île céleste »)

## Contexte
Jeu web sur téléphone (three.js r128), vue à la première personne. Le lobby est une île qui flotte dans le ciel, avec une grande montagne en terrasses (jusqu'à 30 m) au centre. Le joueur y bâtit un village. Le village a cinq **thèmes** (skins) ; le décor entier doit suivre le thème. Le commanditaire (Frédéric) trouve le rendu actuel « propre mais cheap » : il veut des paysages **improbables, incroyables, magnifiques, « badass »** — montagne, neige, cascades, grottes, tout est possible.

Les cinq thèmes et leur direction :
- `cel` **Céleste** : île sacrée au crépuscule. Marbre, or, bleu nuit, cerisiers et arbres aux feuilles lumineuses, arches de géants, rochers qui flottent, cristaux clairs, runes.
- `pir` **Pirate** : île tropicale en plein jour. Rocher en forme de crâne, palmiers, épaves, phare, cordages, tonneaux, coffres, sable, lagon turquoise.
- `dra` **Dragon** : volcan la nuit. Basalte noir, lave orange vif (lumineuse), obsidienne, os géants, squelette de dragon colossal, arbres calcinés, braises.
- `cri` **Cristal** : monde gelé. Glace bleutée, neige, cristaux géants lumineux, sapins enneigés, stalactites, arches de glace.
- `ast` **Astral** : monde extraterrestre de nuit. Acier sombre, néons cyan (0x4af0ff) et magenta (0xff4fd8), monolithes, plantes bioluminescentes, anneaux en orbite, antigravité.

## Technique : l'atelier « K »
Les modèles sont écrits en code avec le kit `K` : on empile des formes simples colorées, cuites en un maillage par matière. **Lis d'abord `gfx/GUIDE.md` en entier**, puis `gfx/models/enemy_b.js` (modèle de référence commenté) et parcours `gfx/models/lobby.js` (bâtiments du village : même niveau de finition attendu, voire mieux ; tu peux recopier ses petites fonctions d'aide — `hull`, `tusk`, `spire`, `pylon`, `skull`… — dans ton fichier, car elles ne sont pas globales).

- Unités : mètres, +Y vers le haut, l'origine du modèle est au sol, au centre.
- Canaux de matière (`ch`) : `'m'` mat (défaut), `'s'` brillant (métal, cristal, eau), `'g'` lumineux (lave, néon, cristal qui brille), `'x'` lueur additive transparente.
- Animation : une pièce animée = une entrée dans `parts` avec `anim:[{k:'rot'|'pos'|'scl',axis,amp,sp,spin,ph}]`. Chaque pièce animée coûte un appel de dessin : **peu de pièces animées, mais bien choisies**.
- `SH` (gfx/models/shared.js) est global : motifs des éléments, bannières, briques…
- Un fichier de modèles s'écrit dans un bloc `{ const {PAL,TAU}=K,PI=Math.PI; … MODELS['nom']=ctx=>{ … return{parts:[…],bake:{…}}; }; }`.
- **N'utilise que ce que GUIDE.md et kit.js documentent.** En cas de doute sur une signature, lis `gfx/kit.js`.

## Aperçu (obligatoire : regarde tes modèles)
Depuis `gfx/` :
```
node --check models/TONFICHIER.js
node preview.js out/NOM.png models/shared.js,models/TONFICHIER.js pay.cel.arbre,pay.cel.roc v=1 views=hero,back tw=520 th=420
```
(`clé=valeur` passe des paramètres dans `ctx` ; `views=hero,back,top,close` ; la sortie affiche le nombre de triangles.) Ouvre l'image produite avec l'outil de lecture d'images, juge-la, corrige, recommence. Un modèle que tu n'as pas regardé n'est pas fini. Si l'aperçu signale une erreur de modèle, corrige-la.

## Règles de qualité
- Silhouette forte et lisible de loin ; proportions généreuses ; beaucoup de pièces plutôt que quelques gros blocs ; variations de teinte (`c` → `c2`) ; détails lumineux (`'g'`) bien placés.
- Pas de faces coplanaires qui scintillent (décale de 2 cm), rien qui flotte sans raison, rien sous y = 0 sauf des racines/fondations (≤ 0,5 m).
- Respecte les budgets de triangles indiqués.
- Écris en français des commentaires courts qui disent ce que représente chaque groupe de pièces.
- Ne modifie AUCUN fichier existant. N'écris que ton ou tes fichiers.

## Rendu attendu
À la fin, réponds en quelques lignes : fichier(s) écrit(s), liste des modèles avec leur nombre de triangles et de pièces animées, et tout doute ou limite.
