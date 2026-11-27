# L'Île des Cinq — la fiche du mini-jeu (projet Jv)

## En bref
- **Le jeu** : tower defense à la première personne, premier mini-jeu du projet de Frédéric (« Abtest »). On défend le cœur d'une île pendant vingt vagues (dix en Difficile) : six héros, six éléments (Eau › Feu › Nature › Vent › Terre › Élec › Eau), trois défenses, murs et fosses, marchand de la partie, esclaves, campagne à quatre rangs par élément, partie à plusieurs.
- **Où il vit** : dans sa propre conversation et son propre atelier depuis le 23/11/2026. Avant, il était écrit dans la page du lobby.
- **Ce qu'il livre** : un seul fichier, `ile-pour-lobby.js`, que la conversation du lobby colle tel quel derrière le premier portail. Le contrat : `LOBBY.md` dans l'atelier.
- **Version** : V2.2 (27/11/2026), fin de la refonte « rôles et éléments » du lobby : voies des six héros (`opts.voie`), ultime teinté par l'élément de l'arme, rôles des ennemis (l'Assassin fonce sur les héros, le Tank attire les tirs…), colonne Vent de la campagne (carte d'îles venteuses, le Tourbillon).
- **V2.1** (27/11/2026), première moitié de la refonte « rôles et éléments » du lobby (`claude/demande-ile-roles-elements.md`, réponse `claude/reponse-ile-roles-elements.md`) : six éléments (Vent ajouté, « Nature » au lieu de « Bois »), boucle à six ×1,5 / ×0,75, prédilection +10 %, Zéphyr le Tireur (Rafale, Tir perçant), balles de Vent qui traversent et soulèvent, `opts.elements` qui préremplit le choix des armes. La V2.2 apportera la colonne Vent de la campagne, les rôles des ennemis, les voies et l'ultime teinté.
- **V2.0** (25/11/2026), refonte voulue par Frédéric après une partie à deux (« on ne fait que tirer ») : choix de 3 armes avec un élément chacune au début ; vue du ciel entre deux vagues (30 s, ou moins quand tous sont Prêt ; on y pose, améliore, mure et creuse au doigt) ; ennemis qui sortent de la mer tout autour de l'île, un par un, éléments mélangés ; marchand d'armes (tirs multiples, explosions, chaîne…) ; esclaves qui creusent et murent beaucoup plus. Avant : V1.2 (24/11) Renfort sur l'arc et écran allégé ; V1.1 six tables pour le lobby ; V1.0 (23/11) sortie du lobby.

## Les liens
- **Atelier du jeu** : https://claude.ai/artifact/DJLSiHKvEtyHLZR8T8Zf8j — slug `63994a55-e1b3-4f88-9141-66d159e82d88` (publié le 23/11 au soir par la conversation de L'Île des Cinq ; sa version courante se lit avec `get_artifact`) — privé, ne jamais le passer en public. La livraison y est sous `atelier/livraison/ile-pour-lobby.js`. L'ancien atelier (slug `4d42a657-8f25-4e17-8edb-7085c01c463f`) n'est plus tenu à jour.
- **Page d'essai du jeu seul** (sans lobby, solo, rien n'est gardé) : https://claude.ai/artifact/Q8FaePxAhs6FiycbATbWHH — slug `bb456180-562c-49f3-a9d2-406f7e96f654`, privée. C'est `ile-pour-lobby.js` collé dans une petite page (héros, arme, voie, mode ou campagne du Vent, bouton Jouer). La republier à chaque version que Frédéric veut essayer.
- **Le lobby** : voir `claude/ile-des-cinq-fabrication.md` (fiche du lobby) et `claude/mini-jeu-contrat-lobby.md` (contrat commun des mini-jeux).

## Qui fait quoi
- **Cette conversation** : les règles, l'équilibre, l'affichage, le HUD et le multi de L'Île des Cinq. Elle ne modifie jamais le lobby.
- **La conversation du lobby** : l'or céleste, les éclats, les arbres des héros et des armes, la campagne (quels niveaux sont ouverts), les défis, le butin, les réglages gardés, le réseau. Elle ne modifie jamais ce jeu : elle remplace le fichier.
- **Le jeu ne garde rien.** Le lobby lui donne tout à l'ouverture et paie quand il dit « fin ».

## Pour reprendre dans une nouvelle conversation
Le dossier de travail n'existe pas dans une nouvelle conversation. Il faut le reconstruire depuis l'atelier :
1. `list_files` avec le slug de l'atelier, puis `read_file` avec `paths` (32 chemins au plus par appel). Les fichiers arrivent sous des noms au hasard : les reconnaître par leur sha256.
2. Les copier dans `/home/claude/ile/` en retirant le préfixe `atelier/` et le suffixe `.txt` ; `atelier/prettierrc.json` redevient `.prettierrc.json`. Rendre les `.sh` exécutables ; `mkdir -p shots shots3d construit`.
3. Lire `NOTES.md` : son premier bloc dit tout (dossiers, tests, livraison, façon de travailler avec Frédéric).
4. `./mktest.sh` doit finir par « syntaxe ok », `node tests/run1.js` par « erreurs 0 ».
5. Une conversation ne peut modifier que les pages qu'elle a créées : publier un nouvel atelier privé, et mettre son lien ici.

## Livrer une version au lobby
`./tout.sh` sans raté, publier l'atelier, mettre cette fiche à jour, puis donner à Frédéric la phrase à copier dans la conversation du lobby : « Recolle `livraison/ile-pour-lobby.js` Vx.y depuis l'atelier de L'Île des Cinq. »

## Règles de travail avec Frédéric
- Il travaille depuis son iPhone 17, dans l'appli Claude, sans ordinateur. Réponses en français, courtes, le résultat d'abord. Dire franchement ce qui n'a pas été vérifié : rien n'est jamais essayé sur son téléphone d'ici.
- Faire exactement ce qui est demandé. Si c'est ambigu, une question courte ; il répond aux listes numérotées par le numéro.
- Les commandes universelles ne changent pas (seule exception voulue par lui : Renfort, cinquième bouton de l'arc). Il joue surtout dans Safari sur itch.io, où la page ne fait qu'environ 840 × 333 px. Le format de vingt vagues ne se raccourcit pas. Les tests restent courts et ciblés.
- Agents : deux ou trois au plus, et seulement s'il le demande.

## Ce qui reste ouvert
- V2.0 à V2.2 jamais essayées sur son téléphone ni à deux pour de vrai ; équilibre réglé par simulation seulement (« tout en défenses » 2 victoires sur 8 en Normal, « ne fait que tirer » 0). Le dossier de travail est un dépôt git (branches des chantiers).
- Il trouve le jeu « trop facile » : passe sur la difficulté à faire avec lui.
- Ennemis volants peu visibles ; esclave mort qui ne se relève pas ; les invités ne voient ni les bots ni le navire surprise.
- Les textes de la fiche « Règles » ne sont pas relus.
- Les scripts de capture panneau par panneau et le test des parties entières sont à refaire pour le jeu seul.
