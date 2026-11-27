# Demande à la conversation « Dernier Toit » — tout raccord avec le lobby

Écrit le 21/11/2026 par la conversation du lobby (Claude Fable 5.2), complété le 22/11 (point 6) et le 23/11 (point 7, lobby « Abtest. V10.3 »), à transmettre par Frédéric.

**Sa demande du 21/11** : « J'aimerais qu'on taff sur toute la synchro, que tout soit raccord et que tout ait un sens, toujours dans l'objectif de farm pour le lobby / héros. » Il a dit « Go » pour quatre chantiers : un seul barème de gains, le héros qui vaut pareil partout, le village qui sert aux deux portails, une difficulté qui monte (des rangs). Le côté lobby est fait. Ce qui suit ne peut se faire que dans Dernier Toit.

Rien ici n'est bloquant : le lobby V10.3 marche avec Dernier Toit V4.1 tel quel. Chaque point indique ce que le lobby fait en attendant. **Dans l'ordre d'utilité : le point 6 (la mort du joueur), le point 7 (le Guide « Règles »), le point 4 (jour de départ et mode dev dans les messages), le point 1 (le rang).**

## 6. Sa demande du 22/11 : mourir ne doit pas ressembler à une défaite
Ses mots, dits à la conversation du lobby (c'est un changement de Dernier Toit, donc il t'est transmis) : « Sur Dernier Toit (toujours ils s'enfuient). Quand on meurt, il faudrait un respawn auto, ou quelque chose qui nous fait comprendre qu'on n'a pas perdu le jeu, mais gagné de l'argent pour rejouer plus fort. »
- Aujourd'hui (V4.1) : le joueur tué déclenche l'écran de fin, avec « La horde t'a eu au jour N. Ton argent est gardé : améliore-toi et repars. » Le fond y est, mais ça se lit comme une défaite.
- Il propose deux voies, à lui faire trancher ou à combiner :
  1. **Respawn auto** : en « Ils s'échappent », la mort du joueur ne finit pas la partie ; il réapparaît sur le toit après quelques secondes (les zombies continuent de filer pendant ce temps, c'est ça le prix). Seule la jauge Ville finit la partie.
  2. **Un écran de paie plutôt qu'un écran de défaite** : pas de « La horde t'a eu », mais ce qu'on a gagné en gros (l'argent qui se compte), l'arbre ouvert tout de suite ou à un bouton, et « Repartir plus fort ».
- Ce que ça change pour le lobby : rien à faire de son côté. S'il y a respawn, `fin` n'arrive plus à la mort du joueur mais seulement quand la ville tombe, sur abandon, ou au secours : c'est compatible avec le contrat. Garder un seul `fin` par partie.
- Pour mémoire, dans L'Île des Cinq le héros tombé se relève seul au bout de 8 secondes, et seule la vie du cœur finit la partie.

## 7. Sa demande du 22/11 : le tuto général — le Guide, en « Règles » dans chaque mini-jeu
Ses mots : « J'aimerais travailler sur un tuto général ! Les vraies règles du lobby / des jeux. Je pensais à un PNJ qui nous accueille dans le lobby, nous explique les bâtiments, les améliorations etc. Dans les mini-jeux un PNJ "règle", qui combine toutes les règles de chaque jeu. » Il a validé le principe : **le même personnage partout**, pour qu'on sache au premier regard que c'est lui qui explique.
- **Fait côté lobby (V10.3)** : le Guide accueille le joueur sur l'île et lui fait faire la visite du village (chaque arrêt ne passe que lorsque le geste est fait, bouton « Passer »). Dans L'Île des Cinq, le même personnage se tient près du cœur sous l'étiquette « RÈGLES » ; on s'approche, un bouton « Règles » apparaît, et ouvre la fiche du jeu.
- **Demandé dans Dernier Toit** :
  1. **Le même personnage**, au point de départ du joueur sur le toit, avec une étiquette « RÈGLES » au-dessus de la tête. Son modèle est dans l'atelier du lobby (slug `cec58513-b242-4574-b778-d19d66980ac2`), fichier `src/gfx/models/pnj.js` : `MODELS['pnj.guide']` (il s'appuie sur `MODELS['pnj.villageois']` du même fichier ; même kit `K`). C'est l'habitant céleste mince avec un chapeau pointu doré à étoile, une écharpe bleue et un livre dans la main droite. Ne change pas son allure.
  2. **Une fiche de règles rangée comme partout : cinq onglets, dans cet ordre** — **Le but · Perdre · Commandes · Ce jeu · Ce que ça rapporte.** Des lignes courtes : un titre, une ou deux phrases. Le modèle est `RULES.ile` dans `src/tpl.html.txt` du même atelier (bloc « LE GUIDE, PARTOUT »), avec le texte commun des commandes (`CMDS`), à reprendre tel quel puisque les commandes sont universelles.
  3. Pour « Ce que ça rapporte », les chiffres du lobby : 10 or céleste et 20 éclats du héros par tranche de 45 secondes de jeu environ, +40 et +50 par boss, +200 et +150 si l'on est secouru ; rangs ×1, ×1,25, ×1,5, ×2 ; une Relique et l'Étoile du héros quand on est secouru ; les réserves du village se remplissent à chaque partie finie. Plus ce qui reste dans Dernier Toit : l'argent `$` gardé et l'arbre de l'immeuble.
  4. Pour « Perdre » : l'écrire d'après ce qui sortira du point 6.
  5. Comment l'ouvrir : comme dans L'Île des Cinq, un bouton « Règles » qui apparaît quand on est près de lui (à ta main s'il y a mieux dans ton interface). Le tutoriel pas à pas existant peut se lancer depuis la fiche.
- **En attendant** : le Guide du lobby dit au joueur que « sur le toit, je n'y suis pas encore ». Préviens quand c'est fait, pour que cette phrase soit retirée.

## 0. Comment le lobby sait ce que Dernier Toit sait lire
Ajouter à l'objet `DernierToit` (dans `dt-pour-lobby.js`) une liste fixe, lisible avant `ouvrir` :

`DernierToit.accepte = ['rang', 'argent', 'heros', 'balles', 'niveaux']` — seulement les noms réellement pris en compte.

Le lobby la lit déjà (`dtCan(nom)`), et change de conduite tout seul le jour où un nom y figure. Sans cette liste, il fait comme aujourd'hui.

## 1. Le rang (`rang`)
- Le lobby envoie `ouvrir({ heros, arme, rang, bonus }, …)`, `rang` de 1 à 4. Être secouru au rang n ouvre le rang n + 1 ; les gains du lobby sont multipliés par 1 / 1,25 / 1,5 / 2.
- **Demandé** : au rang n, les zombies ont leur vie multipliée par 1 / 1,35 / 1,8 / 2,4 (les mêmes chiffres que les niveaux de campagne de L'Île des Cinq), **pour toutes les sources de dégâts** (balles, compétence, ultime, tourelles, frappe aérienne…). Libre à toi d'y ajouter du nombre ou de la vitesse si ça joue mieux.
- **En attendant** : tant que `accepte` ne contient pas `'rang'`, le lobby divise `bonus.degats` et `bonus.heroDegats` par ce même chiffre. Vérifié dans le vrai jeu : balles, compétence et ultime sont bien divisés, **les tourelles ne le sont pas** ; le rang est donc moins dur qu'annoncé. Dès que `'rang'` est annoncé, le lobby n'y touche plus.

## 2. Le héros vaut pareil partout (`bonus.heros`, `bonus.balles`, `bonus.niveaux`)
Le lobby envoie déjà, en plus des six champs connus :
- `bonus.heros` : tout l'arbre du héros au hall, en valeurs brutes. Clés communes : `hSpd` (vitesse de marche, +0,06 par niveau = +6 %), `hSprint` (+8 % par niveau), `hJump` (+15 % par niveau), `hHp` (PV, déjà dans `vie`), `abCd` (secondes de recharge en moins, déjà dans `recharge`), `uCharge` (+0,15 par niveau = l'ultime se charge 15 % plus vite), `pA` (passif du héros). Selon le héros : `abRad` (rayon de la compétence, m), `abDmg` (déjà dans `heroDegats`), `kDur` (durée, s), `kWide`, `kLen`, `kTrail`, `kHeal`, `uRad`, `uDur`, `uExtra`.
- `bonus.balles` : l'arbre « Élément des balles » de la salle d'armes pour ce héros : feu `eFireR` (rayon d'explosion, m en plus), `eBurn` (s) ; eau `eSlow` (s), `eWave` ; bois `ePois` (s), `ePoisD` ; terre `eKnock` (m), `eArm` ; élec `eChain` (rebonds), `eChainD`.
- `bonus.niveaux` : `{ heros, arme }`, les niveaux affichés au lobby.
- **Demandé** : appliquer ce qui a un sens dans Dernier Toit, au minimum la vitesse (`hSpd`, `hSprint`), la charge de l'ultime (`uCharge`, à séparer de `recharge`, qui règle aujourd'hui les deux), le rayon et la durée de la compétence, et l'effet des balles ; afficher le niveau du héros et de l'arme quelque part en jeu (HUD ou écran de fin). Annoncer `'heros'`, `'balles'`, `'niveaux'` dans `accepte` selon ce qui est fait.
- **En attendant** : seuls dégâts, cadence, critique, vie, force et recharge de la compétence comptent ; le panneau du portail le dit au joueur.

## 3. La bourse du marchand (`bonus.argent`)
- Au lobby, le marchand vend une « bourse de départ » (+150 or au début de la prochaine partie de L'Île des Cinq).
- **Demandé** : `bonus.argent` (nombre) ajouté à l'argent de départ de la partie. Annoncer `'argent'`.
- **En attendant** : la bourse n'est ni envoyée ni dépensée au deuxième portail ; elle reste pour l'île.

## 4. Les messages — un audit du lobby a trouvé un vrai trou ici
- **Le trou** : « Rejouer (jour N) » repart du jour le plus loin permis par la case Raccourci (3, 5 ou 7) sans le dire au lobby (`pret` n'est envoyé qu'à l'ouverture). Le lobby payait donc les jours 1 à 6 d'une partie relancée au jour 7 et abandonnée aussitôt, en boucle.
- **Ce que le lobby fait en attendant** : il ne paie une journée que si les zombies tués (`tues`) couvrent 70 % des hordes des journées comptées. **Il a donc recopié les tailles de hordes** (70 au jour 1, puis 240, 420, 700, 1 100, 1 700, 2 600, 3 900, 5 800, 8 500, ×1,4 ensuite) : préviens si elles changent.
- **Demandé, dans `fin`** : `depart` (jour de départ de cette partie), `boss` (mastodontes abattus), `duree` (secondes jouées), et **`dev: true` si le mode dev a servi** (jour sauté, zombies tués d'un bouton, invincibilité, argent ou arbre donnés) : le lobby ne paiera pas ces parties. Aujourd'hui « Mode dev » est offert à tout joueur dans « Carte et réglages », et une victoire arrive en une minute.
- **Demandé aussi** : `pret` à chaque nouvelle partie (« Rejouer », « Continuer sans fin »), avec son `jour`.
- Le barème du lobby compte en temps de jeu ; il l'estime aujourd'hui (une journée d ≈ 63 + 9 d secondes) et compte un boss aux jours 5, 8 et 10 alors que tu en sors dix en dix jours : avec `duree` et `boss`, il comptera juste.

## 5. La décision de fond, à voir avec Frédéric : où vit la progression permanente
Dernier Toit garde d'une partie à l'autre son argent `$` et son arbre de 46 cases. C'est une deuxième progression, qui ne passe pas par le lobby, alors qu'il veut que tout le farm serve « le lobby / héros ». Je lui ai posé la question le 21/11 ; il a lancé les quatre chantiers sans y répondre. **Le 22/11, il décrit lui-même la boucle de Dernier Toit comme « gagner de l'argent pour rejouer plus fort » : il tient donc à l'argent gardé (piste 2 ci-dessous). C'est ma lecture ; je la lui ai dite, il n'a pas corrigé.** Les pistes :
1. L'argent `$` reste, mais il n'est qu'une monnaie de partie (remis à zéro à chaque partie, comme l'or de L'Île des Cinq), et l'arbre de l'immeuble se paie au lobby, en or céleste, comme les arbres d'armes. C'est la plus « raccord », mais les dix jours sont réglés sur un arbre qui grossit de partie en partie : gros rééquilibrage.
2. Tout reste comme aujourd'hui, et Dernier Toit rend au lobby une part de ce qu'il gagne (c'est déjà le cas : or céleste, éclats, record). Le plus simple, mais deux progressions cohabitent.
3. Entre les deux : l'arbre de l'immeuble reste dans Dernier Toit, mais certaines de ses branches (tourelles, survie) se débloquent par le niveau du village ou du héros au lobby.

## Ce que le lobby fait déjà (pour mémoire)
- Barème commun aux deux portails (`payOut` dans `lobby.js`) : 10 or céleste et 20 éclats du héros par unité de jeu (≈ 45 s), +40 / +50 par boss, +200 / +150 par victoire, × rang, × maison et hall. Dix jours tenus au rang 1 ≈ 565 or et 790 éclats ; vingt vagues de l'île ≈ 710 et 1 050 pour une partie plus longue.
- Secouru : une Relique oubliée et l'Étoile du héros au musée ; le record (jours tenus) compte dans le renom ; la taverne a des défis du toit (« Abats N zombies », « Tiens N jours », « Sois secouru »).
- Affûtage, provisions et bourse ne sont dépensés que lorsque le jeu a dit `pret`.
- Tout le détail : `claude/ile-des-cinq-fabrication.md`, « Tout raccord (V10.2) » et « Le Guide (V10.3) », et le contrat inchangé `LOBBY.md`.
