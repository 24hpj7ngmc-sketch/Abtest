# L'Île des Cinq — le contrat avec le lobby

Ce document accompagne `ile-pour-lobby.js`. Il dit tout ce que le lobby a besoin de savoir pour brancher le jeu. Il suit le contrat commun des mini-jeux (`claude/mini-jeu-contrat-lobby.md` dans le projet Jv).

## En deux phrases
Le jeu arrive en **un seul fichier**, `ile-pour-lobby.js`, à coller tel quel dans un `<script>` de la page du lobby. Il crée **une seule variable**, `IleDesCinq` ; le jeu tourne dans un cadre (iframe) plein écran, avec sa 3D, ses sons et ses noms à lui.

Le jeu **n'écrit aucune sauvegarde**. Tout ce qui dure reste au lobby : or céleste, éclats, arbres des héros et des armes, campagne, défis, butin, réglages.

## V2.6 (28/11/2026) — les sorts suivent l'élément choisi du héros
Rien ne change dans le contrat (`opts`, `rappels`, tables). `IleDesCinq.version` vaut `'V2.6'`. Avec `opts.elHeros`, la compétence et l'ultime des six héros gardent leur mécanique et leurs chiffres, mais leurs dégâts prennent l'élément choisi (boucle des faiblesses, effet d'état de cet élément : le Feu brûle, l'Eau ralentit, la Nature empoisonne, la Terre étourdit, l'Élec rebondit, le Vent soulève les petits) et leurs animations, zones au sol comprises, sa couleur. Les noms des sorts ne changent pas. L'ultime teinté par l'arme s'ajoute comme avant. Sans `elHeros`, bots et esclaves : rien ne change (simulation à graine fixe identique).

## V2.5 (28/11/2026) — l'élément du héros se choisit (contrat V12.9)
- **Nouveau** : `opts.elHeros`, une des six clés (`feu eau bois terre elec vent`). Absent ou inconnu : la clé du héros, comme avant. Annoncé dans `IleDesCinq.accepte` (`'elHeros'`). `IleDesCinq.version` vaut `'V2.5'`.
- La clé `opts.heros` reste l'identité (kit, voies, rôle, nom, modèle, butin, records). L'élément choisi remplace la clé là où elle servait d'élément pour le héros du joueur : couleurs de l'avatar, de l'arme et de l'interface, bonus de prédilection (+10 % si l'élément de l'arme = l'élément choisi), élément d'une arme sans choix (écran des 3 armes, `opts.elements`), effets propres du héros (ralenti, poison, soulèvement, chaîne, éclats), Renfort, teinte de l'ultime. Les armes gardent leur élément choisi.
- Pas changé : les dégâts de la compétence et de l'ultime (le Feu de Braise reste du Feu), les bots et esclaves (leur clé est leur élément).
- Multi : chaque joueur met `ce` (l'élément choisi, vérifié contre les six clés) dans sa présence ; absent ou douteux, la clé du héros (un vieux téléphone garde son apparence). Modèle : `hero.avatar` reçoit `{ P, el: élément choisi, hero: clé }`.
- Sans `elHeros`, les règles sont inchangées (même simulation à graine fixe, comparée avec la V2.4).

## V2.4 (28/11/2026)
Rien ne change dans le contrat. `IleDesCinq.version` vaut `'V2.4'`. Les coéquipiers, bots et esclaves qui incarnent Braise (feu) sont dessinés avec son propre modèle 3D, `MODELS['hero.braise']` (`gfx/models/braise.js`, le même fichier que celui du lobby et de Dernier Toit).

## V2.3 (28/11/2026)
Rien ne change dans le contrat (`opts`, `rappels`, tables). `IleDesCinq.version` vaut `'V2.3'`. Côté joueur : la course est celle de Dernier Toit (balancement, roulis, champ de vision, arme baissée en sprint) et chaque arme en main prend la couleur de son élément (`opts.elements` ou le choix du début de partie ; sans élément : celui du héros).

## L'interface

| | |
|---|---|
| `IleDesCinq.version` | `'V2.6'` |
| `IleDesCinq.HEROS`, `.ARMES` | les clés acceptées |
| `IleDesCinq.accepte` | ce que le jeu sait lire : `mode, campagne, tuto, bonus, gains, reglages, multi, paie, elements, voie` |
| `IleDesCinq.tables` | des tables du jeu en lecture seule (voir plus bas) |
| `IleDesCinq.ouvrir(opts, rappels)` | lance le jeu par-dessus le lobby |
| `IleDesCinq.ouvert` | vrai tant que le cadre est là : le lobby met en pause sa boucle, son rendu, ses sons |
| `IleDesCinq.paie(lignes)` | après `fin` : ce que le lobby vient de payer, que le jeu affiche sur son écran de fin |
| `IleDesCinq.pairs(liste, moi)` | multi : les autres joueurs, dix fois par seconde |
| `IleDesCinq.fermer()` | retire le cadre sans attendre le joueur |
| `IleDesCinq.troisJs` | tests seulement : une autre adresse pour three.js |

## Ce que le lobby donne : `opts`

Tout est facultatif. Une valeur absente ou abîmée est remplacée par le réglage par défaut : le jeu démarre toujours.

- `heros` : `'feu' | 'eau' | 'bois' | 'terre' | 'elec' | 'vent'` (défaut `feu`). **Depuis la V2.1**, `'vent'` (Zéphyr, le Tireur) est jouable : `IleDesCinq.HEROS` le contient.
- `elHeros` (**V2.5**) : l'élément choisi du héros joué, une des six clés ; voir « V2.5 ». Absent ou inconnu : la clé du héros.
- `elements` (**V2.1**) : `{ pistolet: 'feu', fusil: 'vent', … }`, l'élément choisi au lobby pour chaque arme. Il préremplit l'écran du choix des 3 armes (le joueur peut encore changer). Une clé inconnue ou un élément inconnu est ignoré : l'arme prend alors l'élément du héros pour la n° 1, un autre élément libre pour les suivantes.
- `voie` (**V2.2**) : `null` ou `{ id: 'a' | 'b', nom }`, la voie du héros joué. Elle modifie son kit (voir « Les voies » plus bas) ; seules les cases de sa branche (`spA1`, `spA2` ou `spB1`, `spB2`, dans `bonus.mods[héros][arme]`) comptent. Le nom s'affiche à l'entrée (« Roc · Tank · Avant-garde entre en jeu »).
- `role` : pas lu ; le jeu affiche le rôle depuis ses propres tables (`EL[x].role`).
- `arme` : `'pistolet' | 'assaut' | 'sniper' | 'fusil' | 'pompe' | 'lance'` (défaut `pistolet`). **Depuis la V2.0**, c'est la première des 3 armes proposées sur l'écran de choix que le jeu montre lui-même au début de chaque partie (jusqu'à 3 armes, un élément par arme). Le tutoriel n'a pas cet écran (armes par défaut).
- `mode` : `'normal' | 'hard'`.
- `campagne` : `{ el, l }` (type du niveau, rang 1 à 4) ou `null` pour une partie libre. Un niveau se joue avec les règles du mode normal.
- `tuto` : `true` lance la partie guidée (cœur invincible, règles du mode difficile).
- `dev` : `true` autorise les outils de développeur dans la carte.
- `bonus.mods` : `{ <héros>: { <arme>: { hDmg: 0.2, … } } }`. Ce que les arbres du lobby apportent à ce héros avec cette arme. Le jeu y ajoute lui-même le **profil de base de l'arme** (cadence, dégâts, portée : c'est lui qui en est maître). Donner les six héros et les six armes : le joueur peut changer d'arme en partie. Seules les valeurs numériques sont lues. **Depuis la V2.1**, l'arbre « Élément des balles » peut porter les six branches à la fois (`eFireR`, `eBurn` Feu ; `eSlow`, `eWave` Eau ; `ePois`, `ePoisD` Nature ; `eKnock`, `eArm` Terre ; `eChain`, `eChainD` Élec ; `ePierce`, `eLift` Vent) : le jeu n'applique que la branche de l'élément de l'arme en main. Zéphyr lit `abCd`, `kLen`, `kPush`, `uDmg`, `uRad`, `uCharge`, `pA` (bases du contrat du lobby).
- `bonus.prep` : `{ mods: { hDmg, hHp }, noms: ['affûtage +10 %'] }`. Les préparatifs du village. Appliqués à la **première partie** seulement.
- `bonus.or` : une bourse d'or de départ (5 000 au plus), première partie seulement.
- `gains` : le barème du lobby, `{ or, ecl, orBoss, eclBoss, orWin, eclWin, rangs: [1, 1.25, 1.5, 2] }`. Le jeu ne paie rien : il s'en sert pour l'onglet « Ce que ça rapporte » de sa fiche de règles.
- `reglages` : `{ snd, fire, aj, devOpt }`. Son coupé (`snd: false`), mode de tir (`'btn' | 'auto' | 'cible'`), saut auto, options du mode dev.
- `multi` : `{ nom, depuis, max }`. Présent, il allume la partie à plusieurs. `max` est la taille permise de l'état, en caractères de JSON (défaut 3 000).
- `encoche` : `{ haut, bas, gauche, droite }` en pixels. Si elle manque, le pont la mesure dans la page du lobby.

## Ce que le jeu répond : `rappels`

- `pret(m)` à chaque partie qui démarre (« Rejouer » compris) : `{ partie, heros, arme, mode, campagne, tuto, or }`. `partie` vaut 1 pour la première. C'est le moment de dépenser pour de bon les préparatifs et la bourse.
- `fin(m)` une fois par partie finie :

  `{ partie, victoire, raison: 'victoire' | 'coeur', mode, campagne, vague, vagues, passees, unites, tues, boss, objectifs, butin, coeur, duree, invite, joueurs, hote, dev, tuto, heros, arme }`

  - `passees` : les vagues repoussées. `unites` : leur valeur en unités de jeu du barème commun (35 pour vingt vagues).
  - `butin` : `[[clé, chance], …]`, ce qui est tombé pendant la partie (un élément pour un boss, `'relique'` pour un objectif). **Le lobby tire au sort**, avec son bonus du musée.
  - `invite` : vrai si le joueur a rejoint la partie d'un autre.
  - Le lobby borne chaque nombre avant de payer. Un abandon n'envoie pas `fin`.
- `retour()` : le joueur a touché « Retour sur l'île » ou a abandonné. Le cadre est déjà retiré.
- `reglages(m)` : un réglage a changé en partie, `{ snd, fire, aj, devOpt, tuto }`. `tuto: true` = partie guidée finie ou passée.
- `arme(m)` : `{ arme }`, l'arme a changé en partie. Depuis la V2.0, il part aussi après l'écran de choix du début (l'arme n° 1 choisie). Dans `fin(m)`, `arme` est l'arme en main à la fin.
- `etat(d)` : multi seulement, l'état complet du joueur, dix fois par seconde au plus.

## La paie
Le jeu ne connaît ni l'or céleste ni les éclats. À la réception de `fin`, le lobby paie, puis appelle `IleDesCinq.paie([{ t: '+165 or céleste', fort: true }, …])`. Le jeu écrit ces lignes sur son écran de fin, **en texte seulement** (douze lignes au plus).

## Le multi
Le jeu ne voit pas le réseau : le lobby fait le facteur, comme pour Dernier Toit.
- Jeu → lobby : `etat(d)`, à publier tel quel dans le salon.
- Lobby → jeu : `IleDesCinq.pairs(liste, moi)`, dix fois par seconde, avec les **autres** joueurs qui sont dans ce jeu : `[{ id, nom, heros, rang, depuis, etat }]`, et `moi = { id, nom, depuis }`.
- Le jeu choisit seul son hôte (la partie la plus ancienne), recopie son état, lui envoie ses actions, et reprend la partie si l'hôte s'en va.
- Tout ce qui vient de `pairs` vient d'autres téléphones : le jeu vérifie chaque valeur et n'en écrit aucune comme du HTML.

## Les tables
`IleDesCinq.tables` donne des tables tirées des règles à la construction, pour les textes du lobby : `ELS`, `EL`, `BEATS`, `CAMPK`, `CAMPS`, `CAMPT`, et depuis la V1.1 `BAL` (réglages communs : arme, critiques, kits des héros), `BALN` (mode normal ; `BALN.waves` = 20), `KIT` (`skill`, `ult`, `tag` de chaque héros), `KINDS` (les types d'ennemis ; `KINDS[clé].n` = le nom), `CAMPN` (4 niveaux par type) et `CAMPW` (20 vagues par niveau). Les tables passent entières, en JSON : les fonctions n'y sont pas. La liste est dans `src/TABLES` : une ligne de plus suffit pour en ajouter une.

**V2.1** : six éléments. `ELS` = `feu, eau, bois, terre, elec, vent` (l'ordre compte pour le multi : ne rien insérer avant `vent`) ; `EL.bois.n` = « Nature » ; `EL[x].role` = le rôle du héros ; `BEATS` = la boucle à six (Eau › Feu › Nature › Vent › Terre › Élec › Eau) ; `BAL.strong` = 1,5 (×0,75 dans l'autre sens, ×0,5 pour un boss, ×1 contre le même élément) ; `BAL.predi` = 0,1 (prédilection) ; Zéphyr : `BAL.zephCd` 14, `zephLen` 8, `zephPush` 6, `zephFar` 30, `zephK` 0,2, `perceDmg` 90, `perceR` 1,5, `perceLen` 110 ; balles de Vent : `ventLift` 0,6 s. **V2.2** : colonne Vent de la campagne, `CAMPS.vent` = `'tou'` (le Tourbillon : toutes les 3 s, une bourrasque pousse de 3 m vers le cœur les ennemis à 7 m de lui) ; `campagne: { el: 'vent', l }` est accepté, avec sa carte (îles balayées par les rafales). Chaque type d'ennemi a un rôle : `KINDS[clé].r` (`Combattant`, `Tank`, `Assassin`, `Tireur`, `Mage`, `Support` ; la Graine n'en a pas), et le « Tireur » ennemi (`rng`) s'appelle maintenant « Mage ». Les réglages des voies et des rôles sont dans `BAL` (`gardR`… `touCd`).

## Les voies (V2.2)
Le kit de base ne change pas, la voie le modifie. Chiffres de base du jeu ; les cases du lobby s'y ajoutent.
| Héros | Voie a | Voie b |
|---|---|---|
| Roc | **Gardien** : Rempart large (7 blocs) ; les alliés à 2 m (+`spA1`) de lui prennent −30 %. `spA2` : il renvoie deux fois les coups reçus au contact. | **Avant-garde** : le Rempart devient une charge de 6 m (+`spB1`), recharge 18 s, qui blesse et renverse. `spB2` : renverse aussi à 4 m de l'arrivée. |
| Sylve | **Colosse** : +60 PV (+`spA1`). `spA2` : chaque balle qui touche à moins de 7 m la soigne de 2 PV. | **Plongeur** : les Ronces la font bondir jusqu'à leur point de chute (8 m, +`spB1`). `spB2` : quand un ennemi empoisonné par elle meurt, son poison passe à 3 voisins. |
| Volt | **Lame** : +30 % (+`spA1`) sur une cible seule (personne à 5 m). `spA2` : ses balles et l'Éclair achèvent sous 15 % de vie. | **Escarmoucheur** : chaque élimination rend 25 % (+`spB1`) de la recharge de l'Éclair. `spB2` : une élimination par l'Éclair le relance. |
| Braise | **Artilleur** : portée des balles +25 % (+`spA1` m), Brasier lancé 8 m plus loin. `spA2` : les flammes du Brasier et des Météores durent 4 s de plus. | **Mage de bataille** : une aura brûle à 3 m (+`spB1`) autour de lui. `spB2` : −25 % de dégâts reçus. |
| Ondine | **Soigneuse** : la Marée soigne +30 % (+`spA1`). `spA2` : elle pose un bouclier de 30 PV (8 s) sur elle et les alliés touchés. | **Entraveuse** : la Marée immobilise 1,5 s (+`spB1`) au lieu de repousser. `spB2` : le Déluge immobilise tout ce qui marche à son arrivée. |
| Zéphyr | **Sniper** : +15 % (+`spA1`) au-delà de 40 m. `spA2` : après 1,2 s sans tirer, le tir est chargé (×1,5, perce l'armure). | **Mitrailleur** : +10 % de cadence (+`spB1`) en courant. `spB2` : la cadence monte jusqu'à +30 % en 3 s de tir continu. |

**L'ultime teinté** : l'ultime garde son effet et gagne celui de l'élément de l'arme en main (rien de plus si l'arme est de l'élément du héros) : Feu, brûle ; Eau, ralentit ; Nature, empoisonne ; Terre, étourdit ; Élec, foudroie ; Vent, soulève les petits. Les Gardiens de Sylve tirent alors des flèches de cet élément.

## Ce qui est garanti
- **V2.0 (25/11/2026)** : le jeu ouvre lui-même deux écrans à lui, sans rien demander au lobby : le choix des 3 armes au début de la partie, puis la vue du ciel entre deux vagues (30 s, ou moins quand tous sont « Prêt »). L'interface, les messages et la paie ne changent pas ; `duree` reste le temps de jeu réel de ce joueur (les écrans de choix et du ciel en font partie, comme l'ancienne préparation).
- Les **commandes universelles** : mêmes boutons aux mêmes endroits qu'au lobby (mini-carte en haut à gauche, chiffres en haut à droite, quart de rond Action / Saut dans le coin, Sneak, Compétence, Ultime le long de l'arc). Depuis la V1.2, ce jeu ajoute un cinquième bouton sur l'arc, **Renfort**, au-dessus de l'Ultime (choix de Frédéric, 24/11). Rien à faire côté lobby.
- **Vingt vagues** en Normal et en campagne, dix en Difficile (`BAL.waves`).
- Les messages vers le lobby portent tous la clé `ile` ; ceux du lobby aussi (`pairs`, `paie`, `encoche`).
- Le pont n'écoute que son propre cadre : un message venu d'ailleurs est ignoré.
