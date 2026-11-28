# Le multi sur le toit (V4.3) — le plan partagé par les trois chantiers

**Fait (V4.3, 23/11).** Écarts avec ce plan, fixés par les chantiers : les actions sont `[type, seq, …]` (voir regles/multi.js) ; la place cible des zombies chez l'invité est `Z.mx/my/mz` (`Z.ty` est déjà le type) ; l'invité publie ses actions par `actionsInvite(S, max)`. Le détail à jour : regles/LISEZMOI.md (« V4.3 : le multi »), interface/LISEZMOI.md, LOBBY.md.

**Ajouts de la V5.6** : fin facultative de l'instantané (l'élément choisi des sorts, 3 bits par objet) et champ `B` de l'état publié `p` (`[numéro, x, y, z, rayon]` : la Répulsion d'une Soigneuse, 3 s) ; détails dans `regles/LISEZMOI.md` et `LOBBY.md`.

Demande : `claude/demande-dernier-toit-multi.md` (projet Jv), lobby « Abtest. V10.5 ». Frédéric : « Go », « fais très vite ».
Mode « Ils s'échappent » seulement, et seulement lancé depuis le lobby (`LOBBY.multi`). Sans multi, **rien ne change** : `tests/empreinte.js`
doit rester identique, tous les tests actuels doivent passer.

## Le tuyau (déjà décidé avec le lobby)
- Le lobby ouvre `DernierToit.ouvrir({ …, multi: { nom, depuis, max } }, { pret, fin, retour, etat })`. `max` (facultatif, défaut 3000) :
  taille maximale de l'état en caractères de JSON.
- Dix fois par seconde, le lobby appelle `DernierToit.pairs(liste, moi)` : `liste` = les AUTRES joueurs sur le toit
  `[{ id, nom, heros, rang, depuis, etat }]` (`etat` = leur dernier `d` publié, ou `null`), `moi` = `{ id, nom, depuis }`.
  **Tout ce qui vient de `liste` est non fiable** (types, tailles, texte) : tout vérifier, ne jamais injecter de texte en HTML sans nettoyer.
- Le cadre publie son état par `versLobby({ dt: 'etat', d })` au plus 10 fois par seconde ; `JSON.stringify(d).length <= max`, sinon il est jeté.
  C'est un **état complet, pas un événement** : le dernier remplace le précédent, un message peut se perdre.
- `DernierToit.accepte` gagne `'multi'`.

## Les rôles
- **L'hôte** = le plus petit `depuis` parmi moi et les pairs (à égalité : le plus petit `id`, comparé en texte). Il fait tourner la vraie
  partie (`step`) : zombies, tourelles, ville, jours. Le rang, les hordes et l'immeuble (tourelles, planches) sont les siens.
- **Les invités** ne simulent ni zombies ni tourelles : ils recopient l'instantané de l'hôte (`appliqueInstantane`) et ne font avancer
  que leur propre joueur (`stepInvite`). Leurs coups, compétences, ultimes, leurres, frappes passent par l'hôte sous forme d'actions.
- Si l'hôte disparaît de la liste, le suivant par `depuis` devient hôte et reprend la partie depuis son miroir (`reprendHote`).
- Un joueur qui arrive voit un hôte qui a déjà un instantané : il devient invité de la partie en cours (pas de seconde partie). Il démarre
  quand même par `newGame` (pour avoir un `S` complet), puis le premier instantané reçu remplace le jour, la ville, les zombies.

## L'état publié `d` (par chaque joueur)
```
d = { v: 1, p: P, g: G? }        // g seulement chez l'hôte
P = { n: nom, h: heros, w: arme, x, y, z, a: yaw, b: pitch,   // nombres arrondis à 2 décimales
      f: 1|0 (tire en ce moment), dn: 1|0 (tombé), hp: 0..100 (pour cent), k: zombies tués (cette partie),
      A: [[seq, type, …données]]  // ses 8 dernières actions au plus, seq croissant ; l'hôte exécute celles dont seq > dernier vu
    }
G = chaîne compacte faite par encodeInstantane (règles), lue par appliqueInstantane
```
Types d'actions (règles, `appliqueActions`) : `['h', seq, slot, gen, degats]` coup sur un zombie (balle, masse, lance-flammes…),
`['c', seq, x, y, z, yaw, pitch]` compétence lancée depuis cette pose, `['u', seq, x, y, z, yaw, pitch]` ultime, `['l', seq, x, z]` leurre,
`['r', seq, x, z]` frappe aérienne. (La forme exacte est fixée par le chantier « règles » ; l'interface ne fait que transporter `A`.)

## Chantier 1 — règles (`regles/multi.js`, tout en Node, aucune 3D, aucun DOM)
- `Z.gen` : un compteur par case de zombie, augmenté à chaque sortie (pour qu'un coup ne touche pas un autre zombie qui a pris la case).
- `encodeInstantane(S, invites, max)` → chaîne. `invites` = `[{ x, y, z }]`. Contenu : jour, phase, temps du jour, ville et son max, zombies
  sortis / à sortir, fuyards, ult de l'hôte inutile ; les tourelles (place, type, orientation, tire) ; **les zombies proches des invités et de
  l'hôte** (case, génération, place à 0,25 m près, étage/hauteur, type, état, vie en fraction, orientation), autant que le budget le permet, les
  plus proches d'abord ; puis **une foule lointaine** (place grossière seulement) avec ce qui reste de budget. Alphabet sûr pour JSON
  (A–Z a–z 0–9 - _). Viser ~7 caractères par zombie proche, ~4 par zombie lointain.
- `appliqueInstantane(S, G)` chez l'invité : met à jour `S.day`, `S.phase`, `S.dayT`, `S.city`, les tourelles, et les tableaux `Z` : les
  zombies proches deviennent actifs avec une **cible** de place (`Z.tx/ty/tz`, l'invité glisse vers elle) ; les lointains deviennent des
  **fantômes** (`Z.fant[i] = 1` : dessinés, jamais touchés) ; les cases absentes sont éteintes. Rien d'autre de `S` n'est touché.
- `stepInvite(S, dt, inp)` : le pas de l'invité : `playerStep` (déplacements, tir), relevé, glissement des zombies vers leur cible, morsures
  locales (un zombie proche collé au joueur le mord comme `hurtP`), effets qui s'éteignent. Aucun spawn, aucune IA, aucune tourelle.
  **Chez l'invité, `hurtZ` ne tue pas pour de vrai** : il retire la vie localement (retour visuel), compte le tué et l'argent si la vie
  tombe à 0 (le zombie est éteint localement), et **ajoute l'action `h`** à `S.mActions` (avec `S.mSeq`). `S.invite = true` marque l'invité.
  Compétence, ultime, leurre, frappe chez l'invité : n'exécutent rien localement (sauf son et message), ajoutent l'action correspondante.
- `appliqueActions(S, joueur, A)` chez l'hôte : exécute les actions nouvelles d'un invité (`joueur.vu` = dernier seq exécuté) : coup →
  `hurtZ` si la case a toujours la même génération ; compétence/ultime/leurre/frappe → exécutés depuis la pose de l'invité (échange
  temporaire de `S.p`, `S.hero`, `S.hm`, `S.P` le temps de l'appel ; garder les dégâts du héros de l'invité si possible, sinon ceux de l'hôte).
- `S.nJoueurs` (posé par l'interface chez l'hôte, 1 par défaut) : **la horde grossit de 50 % par joueur en plus** (nombre total du jour et
  cadence de sortie) ; rien ne change à 1.
- `reprendHote(S)` : l'ancien invité devient hôte : les fantômes deviennent de vrais zombies (dehors, remis sur leur route), les cibles
  deviennent les places, `S.invite = false`.
- Test Node `tests/multiregles.js` (format de fin « N OK, M ratés ») : encode/applique aller-retour fidèle, budget respecté, coup d'un invité
  appliqué par l'hôte, mauvaise génération ignorée, horde ×1,5 à deux joueurs, empreinte inchangée à un joueur, reprise d'hôte.

## Chantier 2 — interface et réseau (`interface/multi.js`, `interface/pont-lobby.js`, petites retouches)
- Pont : `accepte` + `'multi'` ; `pairs(liste, moi)` fait suivre `{ dt: 'pairs', liste, moi }` dans le cadre ; le message `{ dt: 'etat', d }`
  du cadre appelle `rappels.etat(d)`.
- `interface/multi.js` : `MULTI = { actif, moi, pairs (Map id → { id, nom, heros, rang, depuis, etat, vu, dernier }), hote, hoteId, max }`,
  le choix du rôle, la publication toutes les 100 ms (avec contrôle de taille : l'instantané reçoit le budget restant), l'application du
  dernier instantané de l'hôte, les actions des invités chez l'hôte (`appliqueActions`), le changement d'hôte (`reprendHote`), `S.nJoueurs`.
  Dans `interface/boucle.js` : l'invité appelle `stepInvite` au lieu de `step`.
- `joueursDistants()` → `[{ id, nom, heros, arme, x, y, z, yaw, pitch, tire, aTerre }]`, positions **interpolées** (lissées) : c'est ce que
  l'affichage dessine.
- Interface : seul l'hôte lance le jour (chez l'invité, le bouton dit « L'hôte lance le jour » et ne fait rien) ; un petit compteur
  « 3 sur le toit » ; des messages courts à l'arrivée et au départ d'un joueur et au changement d'hôte ; chez l'invité, la fin de partie vient
  de l'instantané (phase `dead` ou `won`) → `showEnd` → son propre `fin` (ses `tues`, le jour du groupe). Chaque joueur garde sa paie.
- Test de page `tests/multitest.js` : une page hôte avec **deux cadres** Dernier Toit (deux `depuis`) et un facteur qui recopie l'`etat` de
  l'un dans la `liste` de l'autre dix fois par seconde. Vérifier : rôles, l'invité voit les zombies de l'hôte, un tir de l'invité tue chez
  l'hôte, la ville est la même, le jour se lance chez les deux, l'hôte part → l'invité reprend, fin chez les deux.

## Chantier 3 — affichage des autres joueurs (`affichage/joueurs.js`)
- Pour chaque entrée de `joueursDistants()` : un corps (le modèle du héros s'il existe en 3e personne, sinon un corps simple aux couleurs
  de l'élément), son arme en main (petite version), son **nom au-dessus** (étiquette lisible sur 966 × 366, texte nettoyé), un éclair de
  bouche et une traînée quand il tire, couché quand il est tombé. Ajout et retrait sans fuite (dispose).
- Les zombies fantômes (`Z.fant[i] = 1`) sont dessinés comme les autres : rien à faire si l'affichage lit déjà `Z`.
- Test : `tests/joueurstest.js` (page, `joueursDistants` remplacée par une liste factice) + une capture `shots/joueurs.png` regardée.

## V4.6 — chacun ses tourelles (retour de Frédéric du 25/11, à deux sur itch.io : « les mortiers et tout sont invisibles, voire inactifs »)
- Avant : seul le plan de l'hôte était posé. L'invité voyait ses emplacements (« 10 / 10 tourelles », « Mortier → Laser ») mais aucune
  de ses tourelles n'existait dans la partie : ni dessinée, ni simulée.
- Maintenant, l'invité publie dans `P` : `T` = son plan (`planCode(save.layout)`, 2 caractères de l'alphabet par tourelle : emplacement,
  type) et `L` = ses niveaux de tourelles (`niveauxCode(save.lv)`, un chiffre en base 36 par case de `MTUR_LV`). `etatPropre` les lit
  (`planLit`, `niveauxLit` : mal formés → ignorés ; niveaux bornés au maximum de chaque case).
- L'hôte (`multiAvant`) en fait `S.mTurInv = [{ id, plan, P: statsTourelles(L) }]` (invités dans l'ordre de `depuis`) et rappelle
  `buildTurrets` quand un plan, des niveaux ou la liste changent (`S.mTurSig`). `buildTurrets` pose d'abord les tourelles de l'hôte, puis
  celles de chaque invité sur les emplacements libres, dans la limite de SES tourelles et des types qu'IL a débloqués ; chaque tourelle
  d'invité porte `own` (son id) et `PP` (ses chiffres). `turretsStep` tire avec `t.PP || S.P` et met `S.mOwn = t.own` : les tués vont à
  l'invité (`S.mCredits`, comme ses compétences) ; obus de mortier, sous-munitions et napalm gardent `own`. (Les brûlures qui durent
  après le jet restent à l'hôte.)
- Chez l'invité, `buildTurrets` ne fait rien : ses tourelles et celles des autres arrivent par l'instantané (section tourelles, inchangée).
- Marteau : un emplacement occupé par la tourelle d'un autre joueur est marqué « pris » (`tourelleAutre`), on ne peut pas y poser.
- Tests : `multiregles.js` (+11), `multitest.js` (+2 : deux cadres, l'hôte pose les tourelles de Bob, Bob les voit).

