# Refonte rôles et éléments : ce que le lobby donne, ce que chaque mini-jeu doit faire

Écrit le 27 novembre 2026 par la conversation du lobby (Abtest. V12.2), pour toutes les conversations de mini-jeu. La décision de Frédéric est dans `claude/refonte-roles-elements.md` : à lire d'abord. Cette fiche-ci en donne la partie technique, commune à tous les jeux. La demande propre à chaque jeu est dans `claude/demande-<jeu>-roles-elements.md`.

**Le lobby est prêt (V12.2).** Tant qu'un jeu n'a pas changé, rien ne casse : il reçoit des champs en plus qu'il ignore, et le lobby ne lui envoie jamais un héros qu'il n'annonce pas.

## 1. Ce qui existe au lobby depuis la V12.2
- **Six héros, six rôles.** Un héros garde sa clé : `feu` Braise (Mage), `eau` Ondine (Support), `bois` Sylve (Combattant), `terre` Roc (Tank), `elec` Volt (Assassin), et **`vent` Zéphyr (Tireur)**, nouveau. La clé est aussi son élément de prédilection.
- **Six éléments** : `feu`, `eau`, `bois` (affiché « Nature », plus « Bois »), `terre`, `elec`, `vent`.
- **Un élément par arme**, choisi par le joueur à la salle d'armes ou au portail. S'il n'a rien choisi, l'arme prend l'élément de prédilection du héros joué.
- **Spécialisations** : à partir du niveau 10 de l'arbre du héros, une voie parmi deux, choisie au Hall. Elle ouvre une branche de deux cases dans son arbre.
- **Zéphyr ne passe un portail que si le jeu l'annonce** (point 2).

## 2. Ce que le jeu doit annoncer
- **`Jeu.HEROS`** : un tableau des clés de héros que le jeu sait jouer. Le lobby y cherche `'vent'`. Sans tableau `HEROS`, il considère que le jeu ne connaît que les cinq premiers, et le bouton du portail dit « Zéphyr n'est pas encore dans ce jeu ».
- Le jeu doit toujours accepter les cinq anciens héros.

## 3. Ce que le lobby envoie en plus dans `opts`
| Champ | Valeur | Pour quoi |
|---|---|---|
| `heros` | peut valoir `'vent'` une fois annoncé | Zéphyr |
| `role` | `'Tank'`, `'Combattant'`, `'Assassin'`, `'Mage'`, `'Support'`, `'Tireur'` | à afficher |
| `voie` | `null`, ou `{ id: 'a' ou 'b', nom: 'Gardien' }` | la spécialisation du héros joué |
| `elements` (L'Île des Cinq) | `{ pistolet: 'feu', fusil: 'vent', … }`, une clé par arme acceptée | l'élément choisi pour chaque arme |
| `elementArme` (Dernier Toit, Percée Céleste) | une clé d'élément | l'élément de l'arme emportée |

Les cases des arbres arrivent comme avant, dans les valeurs brutes de l'arbre du héros (L'Île des Cinq : `bonus.mods[héros][arme]` ; Dernier Toit : `bonus.heros`). Clés nouvelles :
- **Zéphyr** : `abCd` (recharge de la Rafale, −1 s par niveau, base 14 s), `kLen` (longueur du bond, +2 m, base 8 m), `kPush` (1 : la Rafale repousse les ennemis proches au départ), `uDmg` (Tir perçant, +25 % par niveau), `uRad` (largeur du tir, +0,5 m, base 1,5 m), `uCharge`, `pA` (passif, +5 points par niveau, base +20 % au-delà de 30 m), plus les cases Corps communes.
- **Voies** : `spA1`, `spA2` (voie a) ou `spB1`, `spB2` (voie b). Seules les cases de la voie choisie sont envoyées. Leur sens dépend du héros (tableau du point 6).
- **Balles de Vent** (arbre « Élément des balles ») : `ePierce` (ennemis traversés en plus, base 1), `eLift` (durée du soulèvement des petits ennemis, +0,4 s par niveau, base 0,6 s).

Tous ces chiffres sont un premier jet du lobby. Un jeu qui veut d'autres bases le dit dans sa réponse : le lobby affiche ces textes, il les recopiera.

## 4. Les règles à appliquer dans le jeu
- **Le kit d'un héros est le même dans tous les jeux** : passif, compétence, ultime. Le bouton libre de l'arc reste propre au jeu.
- **Les balles prennent l'élément de l'arme**, plus celui du héros. Effets : Feu, explosion et brûlure ; Eau, ralentit et petite vague ; Nature, poison ; Terre, recul et armure ; Élec, rebonds en chaîne ; **Vent, traverse plusieurs ennemis et soulève les petits**. Seule la branche de l'élément de l'arme compte dans l'arbre « Élément des balles ».
- **Prédilection** : arme du même élément que le héros, +10 % de dégâts.
- **La boucle des faiblesses, à six** : Eau bat Feu, Feu bat Nature, Nature bat Vent, Vent bat Terre, Terre bat Élec, Élec bat Eau. ×1,5 contre l'élément battu, ×0,75 contre celui qui nous bat. Elle remplace l'ancienne boucle à cinq (où Nature battait Terre).
- **Les ennemis ont un rôle** (comportement : le tank encaisse, l'assassin fonce sur les joueurs, le mage tape de loin…) **et un élément** (faiblesse).
- **Ultime teinté** : l'ultime garde son effet et gagne celui de l'élément de l'arme en main (le Séisme de Roc avec une arme de feu devient un séisme de lave).
- **Affichage** : « Nature » partout à la place de « Bois » ; les héros présentés par leur rôle.

## 5. Zéphyr, le Tireur (proposition de la fiche)
- Passif : plus de dégâts plus la cible est loin.
- Compétence, « Rafale » : un bond en arrière porté par une rafale.
- Ultime, « Tir perçant » : un tir qui traverse tout sur sa ligne.
- Couleur `#8fe6dc`. Son modèle est `hero.avatar` avec la palette `vent` ; le motif `vent` (`gust`) est dans `gfx/models/shared.js` de l'atelier du lobby, la palette dans `gfx/kit.js`.

## 6. Les voies (le kit de base ne change pas, la voie le modifie)
| Héros | Voie a | Voie b |
|---|---|---|
| Roc | **Gardien** : le Rempart devient un grand bouclier qui protège les alliés derrière. `spA1` : +1 m protégé par niveau (base 2 m). `spA2` : renvoie une part des coups. | **Avant-garde** : le Rempart devient une charge qui renverse. `spB1` : +2 m de charge (base 6 m). `spB2` : renverse aussi à l'arrivée. |
| Sylve | **Colosse** : beaucoup de vie, se soigne au contact. `spA1` : +25 PV. `spA2` : se soigne en frappant au contact. | **Plongeur** : bondit sur sa cible, poison qui se propage. `spB1` : +2 m de bond (base 8 m). `spB2` : le poison passe aux voisins. |
| Volt | **Lame** : énorme coup sur une cible isolée. `spA1` : +20 %. `spA2` : achève sous 15 % de vie. | **Escarmoucheur** : chaque élimination recharge sa compétence. `spB1` : +15 points (base 25 % de la recharge). `spB2` : une élimination pendant l'Éclair le relance. |
| Braise | **Artilleur** : très longue portée, zones en feu au sol. `spA1` : +5 m de portée. `spA2` : les zones restent en feu 4 s. | **Mage de bataille** : au cœur de la mêlée, aura qui brûle. `spB1` : +1 m d'aura (base 3 m). `spB2` : l'aura réduit les coups reçus. |
| Ondine | **Soigneuse** : soins et boucliers renforcés. `spA1` : +15 % de soin. `spA2` : la Marée pose un bouclier sur les alliés. | **Entraveuse** : piège et immobilise. `spB1` : +0,5 s (base 1,5 s). `spB2` : le Déluge immobilise à son arrivée. |
| Zéphyr | **Sniper** : dégâts énormes de très loin. `spA1` : +10 % au-delà de 40 m. `spA2` : un tir chargé perce l'armure. | **Mitrailleur** : tir rapide, bonus en courant. `spB1` : +8 % de cadence en courant. `spB2` : la cadence monte tant qu'il tire. |

Sans voie (`voie: null`), le héros joue son kit de base.

## 7. La réponse attendue de chaque jeu
Une fiche `claude/reponse-<jeu>-roles-elements.md` : ce qui est fait, ce qui ne l'est pas, les chiffres changés, et le fichier à recoller (version, taille, sha256). Le jeu peut livrer en plusieurs fois (par exemple Zéphyr et l'élément par arme d'abord, les voies ensuite) : dire dans la réponse ce que contient chaque livraison.
