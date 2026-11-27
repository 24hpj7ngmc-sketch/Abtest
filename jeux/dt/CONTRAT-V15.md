# Dernier Toit V1.5 — contrat commun (cloisons cassables, masse, planches)

Tout ce qui suit ne vaut que pour le mode « Ils s'échappent » (`S.mode==='out'`). Le mode « Ils arrivent » (`'in'`) reste tel quel (V1.3) : pas de masse, pas de planches, les murs ne cassent pas.

## Déjà fait (ne pas modifier sans prévenir) : `immeuble.js`, `sim.js`

### Données de l'immeuble (globales, `immeuble.js`)
- `PANELS[]` : les cloisons intérieures, découpées en panneaux d'environ 1 m. Chaque panneau est une boîte de `BOX` :
  `{x0,x1,y0,y1,z0,z1, t:'int', destr:1, hp, hp0:8, dead:0|1, lv, tier:'bas'|'haut'|'linteau', ax:'x'|'z', pid}`
  - `tier` : `'bas'` = 0 à 2 m (le casser ouvre un passage), `'haut'` = 2 m au plafond, `'linteau'` = au-dessus d'une porte.
  - `ax:'x'` : le panneau s'étend le long de x (épaisseur en z) ; `'z'` : l'inverse.
  - `dead=1` : cassé, ne bloque plus rien, ne doit plus être dessiné.
- `DOORS[]` : les embrasures barricadables.
  `{id, lv, kind:'piece'|'escalier'|'toit', sens:'montée'|'arrivée' (escaliers), x0,x1,z0,z1, cx,cz, y (sol du niveau), ax, planks (0…5), torn}`
  - L'embrasure fait 2,2 m de haut depuis `y`. `ax` comme pour les panneaux.
- `PLANKS_MAX=5`.
- Fonctions : `rayWallHit(ox,oy,oz,dx,dy,dz,tmax)` → `{t,o}` ; `hitPanel(o,dmg)` ; `setPlanks(d,n)` ; `resetBuilding()` (appelé par `newRun`) ; `navFlush()`.

### Règles (`sim.js`)
- `S.P.masse` = `{on, dmg, wall, swing (durée d'un coup, s), reach}`. Nœuds de l'arbre : `w_masse` (débloque), `w_masse_pw` (Masse lourde), `w_masse_sp` (Élan), branche `'vie'`.
- `useMasse(S)` → `true` si un coup part (sinon déjà en train de frapper, pas débloquée, ou pas le bon mode). Appeler chaque image tant que le bouton est tenu : ça enchaîne les coups.
- `S.swing` (temps restant du coup en cours, 0 = rien), `S.swingT` (durée totale). L'impact arrive à 35 % du coup.
- `doorPick(S)` → numéro de la porte regardée (à moins de 2,6 m, même niveau, en vue) ou `-1`. Toujours `-1` hors mode `'out'`.
- `plankStep(S,dt,id)` : à appeler chaque image tant que l'action est tenue sur une porte (`id`), sinon avec `-1`. Une planche toutes les 0,5 s, jusqu'à 5. Renvoie `true` à l'image où une planche est posée.
- Le joueur passe à travers ses planches ; les balles aussi. Les zombies, non : ils arrachent une planche en 1,6 s (deux fois plus vite pour les gros), deux zombies au plus travaillent ensemble sur une porte.
- Compteurs de version pour le dessin : `S.wallVer` (augmente à chaque dégât de panneau), `S.plankVer` (à chaque planche posée ou arrachée). Un nouvel objet `S` (nouvelle partie) repart d'un immeuble intact.
- `Z.tr[i]` : > 0 pendant que ce zombie arrache une planche (0 sinon). `Z.atk[i]` augmente aussi pendant l'arrachage.

### Évènements (`S.ev`, consommés par `gfxEvent` dans scene.js et par la boucle d'évènements de tpl.html)
| k | champs | quand |
|---|---|---|
| `wallhit` | `pid,x,y,z,hp` (hp restant 0…1) | une balle, une explosion ou la masse abîme un panneau |
| `wallbreak` | `pid,x,y,z,lv,tier` | un panneau casse |
| `swing` | — | un coup de masse part |
| `masse` | `n` (zombies touchés), `wall` (0/1), `x,y,z` (point d'impact devant le joueur) | à l'impact |
| `plank` | `door,n,x,y,z,pay` (`pay` = argent gagné, 0 ou plus) | une planche posée |
| `tear` | `door,n,x,y,z` | un zombie arrache une planche |

## À faire

### Agent « visuel » — fichiers : `scene.js`, `gfx/models/toit.js`, `gfx/models/mains.js` (et rien d'autre)
1. `MODELS['imm']` ne cuit plus les boîtes `o.destr` : les panneaux sont dessinés à part.
2. Panneaux dynamiques (InstancedMesh, mêmes teintes que les cloisons actuelles) : intact, abîmé (`hp<hp0*.5` : plus sombre, impacts), cassé = caché. Mise à jour seulement quand `S.wallVer` change ou quand `S` change.
3. Éclats : `wallhit` = petits éclats de plâtre + poussière ; `wallbreak` = gravats qui tombent + nuage de poussière.
4. Planches (InstancedMesh) : pour chaque porte, `planks` planches de bois en travers de l'embrasure, légèrement de biais (alternance), entre 0,4 et 1,9 m. Mise à jour quand `S.plankVer` change. `plank` : petit choc ; `tear` : une planche qui s'envole + échardes.
5. Fantôme de la prochaine planche : `gfxFrame(S,dt,opts)` recevra `opts.door` (id ou -1) quand le marteau vise une porte ; dessiner la planche suivante en transparent (si `planks<5`).
6. Masse en main : `vm.masse` dans mains.js (manche bois + tête acier), affichée quand `opts.tool==='masse'` ; animation d'après `S.swing/S.swingT` (armer, frapper, revenir) ; petite secousse caméra à l'impact (`masse` avec `n>0` ou `wall`).

### Agent « interface et son » — fichiers : `tpl.html`, `sound.js` (et rien d'autre)
1. Outil « Masse » dans la barre (après le Fusil), visible seulement en mode `'out'`, verrouillé tant que `S.P.masse.on` est 0. Action tenue = `useMasse(S)` chaque image. Pavé : « Frapper ».
2. Marteau en mode `'out'` : chaque image `doorPick(S)` ; si une porte est visée, le pavé affiche « Barricader » avec `n / 5` (ou « Complet »), et l'action tenue appelle `plankStep(S,dt,id)` (sinon `plankStep(S,dt,-1)`). Passer `door:id` à `gfxFrame`. Les emplacements de tourelle gardent la priorité s'ils sont visés.
3. Arbre : textes de valeur (`nodeVal`) pour `w_masse`, `w_masse_pw`, `w_masse_sp` ; vérifier que les nœuds en x = −4,15 tiennent à l'écran.
4. Toasts courts : première planche arrachée de la partie (« Ils arrachent tes planches ! ») ; au jour 6 en mode `'out'`, une astuce « Marteau sur une porte : maintiens pour barricader ».
5. Sons (sound.js, synthèse WebAudio comme le reste) : `wallhit`, `wallbreak`, `swing`, `masse` (plus sourd si `wall`), `plank` (deux coups de marteau), `tear` (bois qui craque) ; spatialisés avec `SND.at` quand il y a une position.
6. Titre : « Dernier Toit. V1.5 ».

## Tests
- `python3 build.py` puis `node v15test.js` (règles), `node run1.js` (fumée), `node run10.js` (couloirs, invasion).
- Écran de test : 966×366 (iPhone 17 en paysage). `window.__dt` pour les crochets de débogage.
