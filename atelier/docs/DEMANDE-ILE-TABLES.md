# Demande à la conversation de L'Île des Cinq : publier six tables de plus

Écrite le 23 novembre 2026 par la conversation du lobby (Abtest. V11.1). Copie dans l'atelier du lobby : `docs/DEMANDE-ILE-TABLES.md`.

## Pourquoi
Depuis la V11.1, la page du lobby ne contient plus aucune règle de L'Île des Cinq : tout vit dans `ile-pour-lobby.js`. Mais plusieurs textes du lobby citent des chiffres du jeu : les arbres des héros et des armes (« 3,2 dégâts par balle », « Recharge du Rempart 36 s »…), le panneau du premier portail (campagne, attaquant spécial), le renom.

Le lobby lit ces chiffres dans `IleDesCinq.tables`. Le jeu y publie aujourd'hui `ELS, EL, BEATS, CAMPK, CAMPS, CAMPT`. Pour le reste, le lobby garde une copie, relevée sur les règles V1.0 (`src/interface/tables.js` de son atelier). **Si un de ces chiffres change dans le jeu, le texte du lobby devient faux sans que personne le voie.**

## La demande
Ajouter six lignes à `src/TABLES` : **`BAL`, `BALN`, `KIT`, `KINDS`, `CAMPN`, `CAMPW`**.

Rien d'autre ne change : le lobby prend une table du jeu dès qu'elle est là, valeur par valeur, et garde sa copie pour ce qui manque ou n'a pas la bonne forme (nombre fini là où il attend un nombre, texte là où il attend un texte).

## Ce que le lobby y lit, exactement
- `BAL` (31 nombres) : `gun, crit, critK, markK, dup, heroHp, voltSprint, rocArmor, braiseSplash, ondRegen`, `rempartCd, rempartT, quakeR, quakeT`, `dashCd, dashLen, stormR, stormT`, `ronceCd, ronceR, ronceT, guardT`, `fbCd, fbR, metN, metR`, `tideCd, tideHeal, tideKnock, floodT, floodCore`.
- `BALN.waves` (le nombre de vagues du mode normal, pour le renom).
- `KIT[héros]` : `skill`, `ult`, `tag` (trois textes par héros).
- `KINDS[clé].n` pour les cinq attaquants spéciaux de `CAMPS` (`inc, soi, bro, gol, sem`).
- `CAMPN` (niveaux par type) et `CAMPW` (vagues par niveau) : deux nombres.

Publier les tables entières convient très bien : le lobby ignore ce qu'il ne connaît pas, et les fonctions disparaissent toutes seules au passage en JSON.

## Ce n'est pas urgent
Tant qu'aucun de ces chiffres ne change, les textes du lobby sont justes. **Si l'un d'eux doit changer avant que les tables soient publiées, le dire au lobby par fiche.**

## La réponse attendue
`claude/reponse-ile-tables.md`, avec la version du fichier à recoller, sa taille et son sha256, et la phrase que Frédéric collera dans la conversation du lobby.

## La phrase que Frédéric colle dans la conversation de L'Île des Cinq
> Lis `claude/demande-ile-tables.md` et fais ce qu'elle demande.
