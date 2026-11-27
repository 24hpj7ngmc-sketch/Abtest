# Demande à la conversation de Dernier Toit : le multi sur le toit

Écrite le 23 novembre 2026 par la conversation du lobby (Abtest. V10.5). À transmettre par Frédéric.

## Pourquoi
Demande de Frédéric (23/11) : « ajouter le multi partout, même dans le lobby ; chacun spawn dans le même lobby ». Depuis la V10.5 du lobby :
- tous les joueurs d'un même salon sont sur la même île (celle du premier arrivé), se voient, et passent le portail de L'Île des Cinq ensemble ;
- **Dernier Toit reste solo** : on y part seul, les autres voient « sur le toit » dans la liste du salon. Il manque le multi dans Dernier Toit lui-même, et ça ne peut se faire que chez toi.

Le lobby ne modifie toujours pas `dt-pour-lobby.js`. Il a déjà posé son côté du tuyau ; il ne s'en sert que si Dernier Toit l'annonce.

## Ce que le lobby fait déjà (V10.5), rien à lui demander
Dernier Toit tourne dans son cadre et ne voit pas le salon : le lobby fait le facteur.

1. **Il regarde `DernierToit.accepte`.** Tant que la liste ne contient pas `'multi'`, rien ne change : partie solo comme aujourd'hui.
2. **À l'ouverture**, si `'multi'` est annoncé et qu'un salon est ouvert, il ajoute `multi: {nom, depuis}` au premier argument de `DernierToit.ouvrir` :
   - `nom` : le nom choisi par le joueur (12 caractères au plus, lettres, chiffres, espace, tiret ; peut être vide) ;
   - `depuis` : un nombre qui ordonne les arrivées sur le toit dans ce salon. **Le plus petit `depuis` est l'hôte de la partie.**
3. **Il passe un rappel `etat`** dans le second argument de `DernierToit.ouvrir` (à côté de `pret`, `fin`, `retour`). Quand le cadre envoie `{dt:'etat', d: …}`, il faut appeler `etat(d)` : le lobby publie `d` tel quel dans le salon. C'est **un état complet, pas un événement** : le dernier envoyé remplace le précédent, un nouveau venu le reçoit, un message peut se perdre. Limites : `d` doit tenir en **3 000 caractères de JSON** (au-delà il est ignoré) et ne pas partir plus de **dix fois par seconde**.
4. **Dix fois par seconde, pendant que Dernier Toit est ouvert**, il appelle `DernierToit.pairs(liste, moi)` si cette fonction existe :
   - `liste` : les AUTRES joueurs du salon qui sont sur le toit, `[{id, nom, heros, rang, depuis, etat}]` ; `etat` est le dernier `d` publié par ce joueur (ou `null`) ; `heros` vaut `feu`, `eau`, `bois`, `terre` ou `elec` ; `rang` de 1 à 4 ;
   - `moi` : `{id, nom, depuis}`.
   - Un joueur qui quitte le toit ou le salon disparaît de la liste (au plus 5 s après une coupure).
5. Le salon passe par des serveurs de messages publics (hors de Claude) ou par le salon de la page (dans Claude) : **tout ce qui arrive dans `liste` est non fiable** (types, tailles, texte). Ne rien injecter en HTML sans nettoyer.

## Ce qui est demandé à Dernier Toit
1. Ajouter `'multi'` à `DernierToit.accepte` et la fonction `DernierToit.pairs(liste, moi)`, qui fait suivre la liste dans le cadre.
2. Faire remonter `{dt:'etat', d}` du cadre vers le rappel `etat`.
3. **La partie à plusieurs elle-même**, en « Ils s'échappent ». Le modèle qui marche déjà dans L'Île des Cinq, à reprendre si tu n'as pas mieux :
   - le joueur au plus petit `depuis` est l'hôte : son téléphone fait tourner les zombies, les tourelles, la ville, les jours ;
   - l'hôte met dans son `etat` un instantané compact de la partie (jour, ville, zombies proches avec place et vie, tourelles) ; les invités le recopient plusieurs fois par seconde et ne simulent rien ;
   - chaque joueur met dans son `etat` sa place, son regard, son arme, s'il tire, s'il est à terre, et la liste numérotée de ses dernières actions (tirs qui touchent, achats, poses) ; l'hôte exécute celles qu'il n'a pas encore vues ;
   - si l'hôte s'en va, le suivant par `depuis` reprend la partie à partir du dernier instantané ;
   - un joueur qui arrive en cours de route entre dans la partie en cours (pas de seconde partie à côté) ; le rang de la partie est celui de l'hôte.
4. Les autres joueurs se voient (le modèle du héros et leur nom au-dessus).
5. **`fin` reste par joueur** : chaque téléphone envoie son propre `fin` au lobby, avec ses propres `tues` et les jours tenus par le groupe ; le lobby paie chacun avec le barème actuel, sans changement. Si tu veux que le groupe soit payé autrement (partage, prime de groupe), dis-le dans ta réponse : le barème est côté lobby.
6. Les hordes et les prix peuvent tenir compte du nombre de joueurs (c'est toi qui équilibres).

## Ce que le lobby fera à la réponse
- Recoller `src/dt-pour-lobby.js` (et `LOBBY.md`).
- Ajouter en haut de l'écran le bouton « X est sur le toit · Rejoindre », comme pour L'Île des Cinq.
- Si un point du contrat ci-dessus te gêne (taille de `etat`, cadence, forme de la liste), propose autre chose dans ta réponse (`claude/reponse-dernier-toit-multi.md`) : le côté lobby tient en une vingtaine de lignes (`toitEtat` et `toitNet` dans `lobby.js`), il se change vite.

## Pour tester sans le lobby
Dans une page de test, simuler le facteur : deux cadres Dernier Toit ouverts côte à côte, et un petit script qui recopie le `etat` de l'un dans la `liste` de l'autre dix fois par seconde, avec deux `depuis` différents.
