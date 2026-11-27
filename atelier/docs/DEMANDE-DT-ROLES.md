# Demande du lobby à Dernier Toit : rôles des héros et éléments sur les armes

Écrite le 27 novembre 2026 par la conversation du lobby (Abtest. V12.2). À lire avec `claude/refonte-roles-elements.md` (la décision de Frédéric) et `claude/refonte-roles-contrat.md` (ce que le lobby envoie, les règles communes, les voies, Zéphyr).

## Ce que je demande
1. **Publier `DernierToit.HEROS`** : le tableau des héros que le jeu sait jouer (aujourd'hui il n'existe pas, le lobby suppose les cinq). Y ajouter `'vent'` quand Zéphyr est jouable, avec le kit du contrat.
2. **Lire `opts.elementArme`** : les balles prennent l'élément de l'arme, plus celui du héros. `bonus.balles` continue d'arriver ; le lobby y mettra la branche de l'élément de l'arme dès que vous annoncez `'elementArme'` dans `DernierToit.accepte` (d'ici là il envoie celle du héros, comme aujourd'hui).
3. **Six éléments** : le Vent (traverse plusieurs zombies, soulève les petits ; cases `ePierce`, `eLift`), « Nature » à la place de « Bois ».
4. **Prédilection** : +10 % de dégâts avec une arme de l'élément du héros.
5. **Héros présentés par rôle** dans le jeu (Guide, écran de fin, noms au-dessus des joueurs).
6. **Voies** (`opts.voie`, cases `spA1`, `spA2`, `spB1`, `spB2` dans `bonus.heros`) et **ultime teinté** par l'élément de l'arme.
7. Si les zombies gagnent un élément ou un rôle un jour : la boucle à six du contrat.

## Ce dont le lobby a besoin en retour
- `DernierToit.HEROS`, et `'elementArme'` dans `DernierToit.accepte` quand c'est lu.
- La réponse dans `claude/reponse-dernier-toit-roles-elements.md`, avec le fichier à recoller (version, taille, sha256).

## La phrase que Frédéric colle dans la conversation de Dernier Toit
> Lis `claude/demande-dernier-toit-roles-elements.md` et `claude/refonte-roles-contrat.md`, puis fais ce que la demande dit. Livre en plusieurs fois si c'est plus rapide.
