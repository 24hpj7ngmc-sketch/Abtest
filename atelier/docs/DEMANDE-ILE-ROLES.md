# Demande du lobby à L'Île des Cinq : rôles des héros et éléments sur les armes

Écrite le 27 novembre 2026 par la conversation du lobby (Abtest. V12.2). À lire avec `claude/refonte-roles-elements.md` (la décision de Frédéric) et `claude/refonte-roles-contrat.md` (ce que le lobby envoie, les règles communes, les voies, Zéphyr).

## Ce que je demande
1. **Annoncer Zéphyr** : `'vent'` dans `IleDesCinq.HEROS` quand il est jouable, avec le kit du contrat (Rafale, Tir perçant, passif de distance). D'ici là le lobby le garde hors du portail.
2. **Lire `opts.elements`** : l'élément choisi au lobby pour chaque arme préremplit votre écran de choix des 3 armes. Le joueur peut encore le changer sur cet écran.
3. **Six éléments** : le Vent sur les armes (traverse plusieurs ennemis, soulève les petits ; cases `ePierce`, `eLift`), « Nature » à la place de « Bois » dans tous les textes.
4. **La boucle des faiblesses à six** (×1,5 / ×0,75) à la place de la boucle à cinq, et la prédilection (+10 % avec une arme de l'élément du héros).
5. **Campagne à six colonnes** : une carte Vent à créer (par exemple des îles balayées par les rafales), avec son attaquant spécial.
6. **Ennemis avec rôle et élément** : le rôle fait le comportement (réponse au retour de Frédéric, « les ennemis ne font qu'avancer »), l'élément fait la faiblesse.
7. **Renfort** pose des défenses de l'élément de prédilection du héros.
8. **Voies** (`opts.voie`, cases `spA1`, `spA2`, `spB1`, `spB2`) et **ultime teinté** par l'élément de l'arme en main.

## Ce dont le lobby a besoin en retour
- **Les tables publiées** (`IleDesCinq.tables`) : `EL` et `KIT` avec `vent`, `BEATS` à six, `CAMPS` et `KINDS` avec le type Vent, `BAL` avec les réglages de Zéphyr si vous changez mes bases. Le lobby affiche ce que vous publiez.
- **L'arbre « Élément des balles »** : aujourd'hui `bonus.mods[héros][arme]` ne porte que la branche de l'élément du héros. Dites-moi si vous voulez les six branches (chaque clé ne compte alors que pour l'arme de cet élément) : je les enverrai dès que vous l'annoncez, par exemple par `IleDesCinq.accepte = ['elements']`.
- **Le butin** : dites si un boss de Vent laisse tomber `'vent'` (l'Étoile de Zéphyr), comme les cinq autres.
- La réponse dans `claude/reponse-ile-roles-elements.md`, avec le fichier à recoller (version, taille, sha256).

## La phrase que Frédéric colle dans la conversation de L'Île des Cinq
> Lis `claude/demande-ile-roles-elements.md` et `claude/refonte-roles-contrat.md`, puis fais ce que la demande dit. Livre en plusieurs fois si c'est plus rapide.
