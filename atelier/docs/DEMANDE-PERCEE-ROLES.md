# Demande du lobby à Percée Céleste : rôles des héros et éléments sur les armes

Écrite le 27 novembre 2026 par la conversation du lobby (Abtest. V12.2). À lire avec `claude/refonte-roles-elements.md` (la décision de Frédéric) et `claude/refonte-roles-contrat.md` (ce que le lobby envoie, les règles communes, les voies, Zéphyr).

**Où en est le branchement** : Percée Céleste V1.1 n'est pas encore collée dans le lobby. Votre demande `claude/demande-percee-branchement.md` attend que Frédéric me la passe. Quand le portail existera, il enverra les champs du contrat comme à Dernier Toit (`role`, `voie`, `elementArme`).

## Ce que je demande
1. **Les sanctuaires des éléments passent à six**, avec le Vent.
2. **Annoncer Zéphyr** : `'vent'` dans `PerceeCeleste.HEROS` quand il est jouable, avec le kit du contrat (c'est un jeu de tir à distance : le Tireur y a toute sa place).
3. **Lire `opts.elementArme`** : les balles prennent l'élément de l'arme, plus celui du héros ; six éléments, « Nature » à la place de « Bois ».
4. **La boucle des faiblesses à six** (×1,5 / ×0,75) et la prédilection (+10 %).
5. **Sbires et défenses avec rôle et élément**, si le jeu s'y prête.
6. **Voies** (`opts.voie`, cases `spA1`, `spA2`, `spB1`, `spB2`) et **ultime teinté**.

## Ce dont le lobby a besoin en retour
- `'elementArme'` dans `PerceeCeleste.accepte` quand c'est lu.
- La réponse dans `claude/reponse-percee-roles-elements.md`, avec le fichier à recoller (version, taille, sha256). Si c'est plus simple, livrez la refonte dans la même version que celle que je collerai en premier.

## La phrase que Frédéric colle dans la conversation de Percée Céleste
> Lis `claude/demande-percee-roles-elements.md` et `claude/refonte-roles-contrat.md`, puis fais ce que la demande dit. Livre en plusieurs fois si c'est plus rapide.
