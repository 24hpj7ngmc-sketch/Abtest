# Dernier Toit dans le lobby — le contrat (V4.1, complété en V4.2, V4.3, V4.8 et V4.9)

Dernier Toit se branche au lobby **sans mélanger son code à celui du lobby** : le lobby colle un seul fichier, `dt-pour-lobby.js`
(fait par `build.py`), et le jeu tourne dans une iframe par-dessus l'île. Ainsi :
- aucun nom ne se heurte (Dernier Toit a ~390 noms globaux : `S`, `G`, `save`, `SND`, `MODELS`, `$`, `toast`… ; le lobby aussi) ;
- les styles, les identifiants HTML (`#bJump`, `#mini`…) et la 3D de chacun restent séparés ;
- **chaque nouvelle version de Dernier Toit se branche en remplaçant ce seul fichier.**

- `fin` porte en plus (V4.3) : `joueurs` (joueurs sur le toit à la fin, 1 en solo) et `hote` (vrai si ce téléphone faisait tourner la partie).
  Chacun envoie son propre `fin` : ses `tues` et son `argent` à lui ; `jour`, `depart`, `boss`, `raison` sont ceux de la partie du groupe.
  La horde grossit de 50 % par joueur en plus : à plusieurs, chacun tue donc une part de hordes plus grosses.

## Côté lobby

Coller `dt-pour-lobby.js` tel quel dans un `<script>` de la page du lobby (le fichier ne contient aucun `<` dans la page qu'il
transporte : rien ne peut fermer le script). Une seule variable globale : `DernierToit`.

```js
DernierToit.ouvrir(
  {
    heros: 'feu',          // 'feu' | 'eau' | 'bois' | 'terre' | 'elec' | 'vent' (Braise, Ondine, Sylve, Roc, Volt, Zéphyr : V4.8)
    elementArme: 'vent',   // facultatif (V4.8) : l'élément de l'arme ; sinon celui du héros
    voie: { id: 'b', nom: 'Avant-garde' },  // facultatif (V4.9) : la voie du héros ; null ou absent : son kit de base
    arme: 'pompe',         // 'fusil' | 'pistolet' | 'assaut' | 'sniper' | 'pompe' | 'lance'
    jour: 1,               // facultatif ; refusé s'il n'est pas permis (case « Raccourci »), sinon le jour le plus loin permis
    bonus: {               // facultatif : ce que le lobby apporte (arbres de l'arme et du héros, préparatifs)
      degats: 1.1,         //   × dégâts de toutes les armes à feu
      cadence: 1.05,       //   × cadence
      critique: 0.02,      //   + chance de critique (0,02 = +2 points)
      vie: 15,             //   + points de vie
      heroDegats: 1.2,     //   × force de la compétence et de l'ultime du héros
      recharge: 0.9        //   × temps de recharge de la compétence et zombies à tuer pour l'ultime (0,9 = 10 % plus vite)
    },
    encoche: { haut: 0, bas: 21, gauche: 47, droite: 0 }  // facultatif : sinon mesurée par le pont (env(safe-area-inset-*))
  },
  {
    pret(m) {},    // la partie a démarré : { dt: 'pret', heros, arme, jour }
    fin(m) {},     // une partie est finie (une fois par partie) — voir ci-dessous
    retour() {}    // le joueur a touché « Retour au lobby » : l'iframe est déjà retirée
  }
);
DernierToit.ouvert;   // vrai tant que le jeu est affiché : mettre en pause la boucle, le rendu et les sons du lobby
DernierToit.fermer(); // retirer le jeu sans attendre le joueur (aucun « fin » n'est envoyé pour une partie en cours)
```

`fin(m)` : `{ dt: 'fin', victoire, jour, tues, fuyards, argent, sansFin, raison, heros, arme }`
- `victoire` : secouru au jour 10 ; `raison` : `'secouru'`, `'ville'` (trop de fuyards), `'envahi'` (le joueur est tombé), `'abandon'` ;
- `jour` : jour atteint ; `tues` : zombies tués ; `fuyards` : zombies échappés ; `argent` : dollars gagnés dans la partie (la monnaie
  propre à Dernier Toit, gardée par le jeu pour l'arbre de l'immeuble) ;
- `sansFin` : partie sans fin (après une victoire, « Continuer sans fin » lance une nouvelle partie, qui enverra son propre `fin`) ;
- « Rejouer » à l'écran de fin relance une partie dans l'iframe : un `fin` par partie, à récompenser chacun.

## Ajouts de la V4.2 (demande du lobby : `claude/demande-dernier-toit-synchro.md`)

`DernierToit.accepte = ['rang', 'argent', 'heros', 'balles', 'niveaux']` : ce que le jeu sait lire en plus (le lobby s'y règle).
- `rang` (1 à 4, dans `opts`) : la vie de **tous** les zombies est multipliée par 1 · 1,35 · 1,8 · 2,4 dès leur sortie, donc face à toutes
  les sources de dégâts (balles, héros, tourelles, frappe). Le lobby ne doit plus diviser `degats` / `heroDegats`.
- `bonus.argent` : ajouté à l'argent `$` du joueur au début de la **première** partie de l'ouverture (pas à « Rejouer »).
- `bonus.heros` (valeurs brutes de l'arbre du héros) : `hSpd`, `hSprint` (vitesse), `hJump` (saut), `uCharge` (l'ultime se charge plus vite ;
  `recharge` ne règle plus que la compétence), `pA` (passif : éclaboussure de Braise, soin d'Ondine, poison de Sylve, peau de Roc, rebonds de
  Volt), `abRad`, `kDur`, `kWide`, `kLen`, `kHeal` (compétence), `uRad`, `uDur`, `uExtra` (ultime). Pas repris : `kTrail` (sillage de Volt).
- `bonus.balles` : `eFireR`, `eBurn`, `eSlow`, `eWave`, `ePois`, `ePoisD`, `eKnock`, `eChain`, `eChainD`. Pas repris : `eArm` (pas d'armure
  dans Dernier Toit).
- `bonus.niveaux` `{ heros, arme }` : affichés à l'écran de fin (« Rang 2 · Braise niv. 4 · Fusil à pompe niv. 3 »).
- `pret` part **à chaque nouvelle partie** (« Rejouer », « Continuer sans fin ») : `{ dt: 'pret', jour, partie, rang, argent, sansFin, heros, arme }`
  (`partie` : 1, 2, 3… depuis l'ouverture ; `argent` : la bourse versée, 0 après la première).
- `fin` porte en plus : `depart` (jour de départ de cette partie), `boss` (mastodontes abattus), `duree` (secondes passées **en journée** :
  l'attente entre deux jours ne compte pas), `chutes` (fois où le joueur est tombé), `rang`, `dev` (vrai si le mode dev a servi pendant
  la partie, ou si « Arbre au max » / « + 100 000 $ » ont servi depuis le dernier « Arbre à zéro »).
- **Mourir ne finit plus la partie** en « Ils s'échappent » : le joueur se relève sur le toit au bout de 8 s (`RELEVE`). `fin` n'arrive donc
  qu'à la chute de la ville (`raison: 'ville'`), à l'abandon, ou au secours (`'envahi'` ne reste possible qu'en « Ils arrivent », que le
  lobby n'ouvre pas). L'écran de fin est une paie (« + 12 840 $ », « Améliorer l'immeuble », « Repartir plus fort »).
- Les tailles des hordes n'ont pas changé (70 au jour 1 sans tourelle, puis 240, 420, 700, 1 100, 1 700, 2 600, 3 900, 5 800, 8 500).
- Le Guide « Règles » se tient sur le toit, près du départ (fiche à cinq onglets).

## V4.3 : le multi (plusieurs joueurs sur le même toit ; plan commun : `MULTI.md`)

`DernierToit.accepte` contient `'multi'`. Mode « Ils s'échappent » seulement ; sans `opts.multi`, rien ne change.
```js
DernierToit.ouvrir({ …, multi: { nom: 'Fred', depuis: 1732350000000, max: 3000 } }, { pret, fin, retour, etat(d) {} });
DernierToit.pairs(liste, moi);   // dix fois par seconde, tant que le jeu est ouvert
```
- `multi.nom` : le nom du joueur (nettoyé par le jeu) ; `multi.depuis` : l'heure (un nombre) où il est monté sur le toit ;
  `multi.max` (facultatif, défaut 3000) : la taille maximale de l'état publié, en caractères de JSON.
- `rappels.etat(d)` : l'état du joueur, **au plus 10 fois par seconde**, `JSON.stringify(d).length <= max` (le pont jette ce qui dépasse).
  C'est un état complet : le lobby n'envoie aux autres que le **dernier** reçu (un message perdu ne gêne pas). Le lobby n'a pas à lire `d`.
- `DernierToit.pairs(liste, moi)` : `liste` = les AUTRES joueurs sur le toit `[{ id, nom, heros, rang, depuis, etat }]` (`etat` = leur
  dernier `d`, ou `null`), `moi` = `{ id, nom, depuis }`. Le jeu vérifie tout ce qui vient de `liste` (types, tailles ; noms réduits à
  12 caractères, lettres, chiffres, espace, tiret ; jamais mis en HTML). Un joueur absent de la liste est parti.
- **Rôles** (décidés par chaque jeu, de la même façon) : l'hôte est le plus petit `depuis` parmi moi et la liste (à égalité, le plus petit
  `id` comparé en texte) ; il fait tourner la partie (zombies, tourelles, ville, jours), et son `d` porte l'instantané (`d.g`). Les autres
  sont invités : ils recopient l'instantané, ne font avancer que leur joueur, et seul l'hôte lance le jour. Si l'hôte disparaît de la liste,
  le suivant par `depuis` reprend la partie là où elle en est. Un joueur qui arrive devient invité de la partie en cours.
  **Le `depuis` doit donc être le même pour un joueur chez tous les autres**, et ne pas changer tant qu'il reste sur le toit.
- La horde grossit de 50 % par joueur en plus (chez l'hôte). Chacun reçoit **son propre** `fin` (ses tués, sa paie ; le jour est celui du
  groupe) quand la partie de l'hôte finit ; « Repartir plus fort » relance chez soi et rejoint la partie suivante de l'hôte.
- Ce qui est dessiné des autres : `joueursDistants()` dans le jeu (places lissées), voir `MULTI.md`.
- Test : `node tests/multitest.js` (deux lobbies, un facteur qui recopie l'état de l'un dans la liste de l'autre).
- V4.4 : l'état de l'hôte porte aussi `cr` (ce qu'il doit à chaque invité : tués et argent de ses compétences, ultimes, frappes) ; quelques dizaines de caractères, comptés dans `max`. Rien à faire côté lobby.
- V4.5 : seul l'écran de jeu change (au modèle de L'Île des Cinq V1.2, « l'ATH par défaut ») ; le contrat, les messages et les règles ne bougent pas. Rien à faire côté lobby, sauf recoller le fichier.
- V4.6 : à plusieurs, chacun ses tourelles. L'état publié par un invité porte deux champs de plus dans `p` : `T` (son plan de tourelles, 128 caractères au plus) et `L` (ses niveaux de tourelles, 17 caractères), soit ~150 caractères. Rien à faire côté lobby (le facteur transmet l'état tel quel), sauf recoller le fichier.
- V4.7 : rien ne change pour le lobby (contrat, messages, armes). Nouveautés propres au jeu : escalade offerte, tyrolienne à débloquer, grappin (un outil de la barre, pas une arme), trois améliorations de balles dans l'arbre de Dernier Toit. `gfx/models/mains.js` gagne `vm.grappin` (le lobby n'a pas besoin de recopier ce fichier).

## V4.8 : rôles et éléments (demande du lobby : `claude/demande-dernier-toit-roles-elements.md`, `claude/refonte-roles-contrat.md`)

`DernierToit.HEROS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent']` et `'elementArme'` dans `DernierToit.accepte`.
- **Zéphyr** (`'vent'`, le Tireur, `#8fe6dc`) : passif, +20 % de dégâts sur les balles qui touchent au-delà de 30 m (+5 points par `pA`) ;
  « Rafale », un bond en arrière de 8 m (+ `kLen` m), arrêté par les murs, permis aussi entre deux jours (comme l'Éclair de Volt),
  recharge 14 s (`recharge` du lobby) ; `kPush` : au départ, les zombies à moins de 5 m sont repoussés de 5 m ; « Tir perçant », un trait
  de l'œil dans l'axe de la vue, jusqu'au sol ou à 200 m, **à travers les murs** : chaque zombie à moins de 0,75 m (+ `uRad` / 2, plus sa
  carrure) de la ligne prend 160 × la force de l'ultime × la vie des zombies du jour, × (1 + `uDmg`). `uDmg` est lu comme une fraction
  (0,25 = +25 %), comme les autres cases.
- **`opts.elementArme`** : l'élément des balles. Inconnu ou absent : celui du héros. Les balles font l'effet de cet élément **avec la
  branche `bonus.balles`**, plus le passif du héros à ses chiffres de base (s'ils sont du même élément, l'effet ne joue qu'une fois).
  Roc et Zéphyr n'ajoutent rien sur les balles (leur passif est ailleurs). Effets : Feu, brûlure et éclaboussure ; Eau, ralenti (et
  vague avec `eWave`) ; Nature, poison ; Terre, recul (pas les gros) ; Élec, arcs vers les voisins ; **Vent : la balle traverse 1 zombie
  de plus (+ `ePierce`) et soulève les petits** (dehors : immobiles 0,6 s + `eLift` ; dedans : ralentis autant ; Colosses et
  Mastodontes jamais).
- **Prédilection** : arme de l'élément du héros, +10 % de dégâts (balles et lance-flammes). Comme l'élément par défaut est celui du héros,
  toute partie sans `elementArme` (et la page seule) a ces +10 %.
- « Nature » s'affiche à la place de « Bois » ; les héros sont présentés par leur rôle (menu, Guide, écran de fin, étiquette au-dessus des
  autres joueurs). `opts.role` n'est pas lu : le jeu a les rôles du contrat dans sa table.
- `pret` et `fin` portent `elementArme`. L'écran de fin dit « Rang 2 · Zéphyr, Tireur niv. 4 · Fusil de sniper niv. 3 de Vent ».
- Multi : la compétence et l'ultime d'un invité partent avec ses cases (`abRad`, `kDur`, `kWide`, `kLen`, `kPush`, `uRad`, `uDur`,
  `uExtra`, `uDmg`), que l'hôte applique (avant, à zéro). Ses balles de Vent soulèvent aussi chez l'hôte.
- Les zombies n'ont pas d'élément : la boucle des faiblesses à six ne joue pas.

## V4.9 : les voies et l'ultime teinté (deuxième livraison de la même demande)

`'voie'` dans `DernierToit.accepte`. `opts.voie.id` (`'a'` ou `'b'`) choisit la voie ; seules ses deux cases comptent (`spA1`, `spA2`
pour a, `spB1`, `spB2` pour b), lues dans `bonus.heros` avec les valeurs par niveau de l'atelier du lobby (`interface/roles.js`). Le kit
de Dernier Toit est fait pour une ville (on tire du toit sur la rue) : chaque voie y est adaptée. Le texte de chaque voie est dans
`regles/voies.js` (`VOIES`), affiché par le Guide.

| Héros | Voie a | Voie b |
|---|---|---|
| Roc | **Gardien** : Rempart 2 m plus large de chaque côté (+ `spA1` m), ×1,5 de solidité ; `spA2` : les zombies qui le frappent prennent la moitié de leurs coups | **Avant-garde** : le Rempart fonce 6 m (+ `spB1` m) vers l'extérieur en poussant et renversant ce qu'il touche, puis tient ; `spB2` : onde de 5 m à l'arrivée |
| Sylve | **Colosse** : +25 de vie (+ `spA1`) ; `spA2` : chaque coup sur un zombie à moins de 5 m rend 2 de vie | **Plongeur** : les Ronces deviennent un bond de 8 m (+ `spB1` m) vers le point visé ; à l'arrivée, roncier et poison 6 s ; `spB2` : le poison d'un empoisonné qui meurt passe à ses voisins (3 m) |
| Volt | **Lame** : balles et Éclair +50 % (+ `spA1`) sur un zombie isolé (personne à 4 m) ; `spA2` : achève sous 15 % de vie | **Escarmoucheur** : chaque tué rend 2,5 % de la recharge de l'Éclair (+ `spB1` / 10 : **le chiffre du lobby est divisé par 10**, on tue des centaines de zombies par jour) ; `spB2` : un tué par l'Éclair le relance |
| Braise | **Artilleur** : armes à balles +10 m de portée (+ `spA1` m) ; feu du Brasier 6 m ; `spA2` : chaque météore laisse le sol en feu 4 s | **Mage de bataille** : aura qui brûle à 3 m (+ `spB1` m) ; `spB2` : coups reçus −25 % |
| Ondine | **Soigneuse** : soins +20 % (+ `spA1`) ; `spA2` : la Marée pose un bouclier de 30 (10 s) **sur Ondine seule** (les autres joueurs : pas encore) | **Entraveuse** : la Marée immobilise 1,5 s (+ `spB1` s) les petits ; `spB2` : le Déluge immobilise tous les petits dehors à son arrivée |
| Zéphyr | **Sniper** : +15 % au-delà de 40 m (+ `spA1`) ; `spA2` : 1 s en visée charge un tir ×2 qui traverse 3 zombies de plus | **Mitrailleur** : cadence +10 %, +10 % (+ `spB1`) en courant ; `spB2` : +4 % par tir d'affilée, jusqu'à +40 % |

- **Ultime teinté** : quand l'élément de l'arme n'est pas celui du héros, chaque zombie que l'ultime blesse reçoit l'effet des balles de
  cet élément (avec la branche `bonus.balles`), une fois par seconde au plus (Séisme avec une arme de Feu : les zombies brûlent).
  Sans `elementArme` (ou avec celui du héros), l'ultime ne change pas.
- `pret` et `fin` portent `voie` (`'a'`, `'b'` ou `null`). L'écran de fin dit « Rang 2 · Roc, Tank (Avant-garde) niv. 11 · … ».
- Multi : la compétence et l'ultime d'un invité emportent aussi sa voie, ses quatre cases et l'élément de son arme ; l'hôte les joue
  avec. Limites : la Relance de l'Escarmoucheur et le bouclier des alliés ne passent pas d'un joueur à l'autre.

## Côté Dernier Toit (déjà fait, V4.1)

- `interface/lobby.js` : lit `window.DT_LOBBY` (posé par le pont avant tout script). Avec lui : pas de menu de départ, mode
  « Ils s'échappent » forcé, héros et arme du lobby, bonus posés dans `bonusLobby` (`regles/arbre.js`, appliqués à chaque calcul de
  `S.P`), encoche dans `--saT/--saB/--saL/--saR` (`style.css`), « Menu » devient « Retour au lobby ». Sans lui, rien ne change.
- La sauvegarde reste la sienne (`localStorage`, clé `dernier-toit-v1`) : argent `$`, arbre de l'immeuble (46 cases), plan des
  tourelles, campagne. L'iframe a la même origine que le lobby : même stockage, clés différentes.
- `interface/pont-lobby.js` : le pont (le modèle de `dt-pour-lobby.js`, rempli par `build.py`).
- Test : `node tests/lobbytest.js` (une page hôte minimale ouvre le jeu, vérifie héros, arme, bonus, encoche, « fin », « retour »).

## Pas encore vérifié
Le multi n'a tourné qu'entre deux cadres d'une même page (pas sur un vrai réseau, pas sur deux téléphones).
Rien de tout ça n'a tourné sur l'iPhone : deux rendus WebGL l'un sur l'autre (le lobby doit couper le sien pendant la partie),
l'encoche dans une iframe, le son (il se réveille au premier toucher dans le jeu), itch.io (l'iframe dans l'iframe d'itch).
