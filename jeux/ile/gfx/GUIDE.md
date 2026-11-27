# L'Île des Cinq — guide de modélisation

Tu modélises des objets 3D pour **L'Île des Cinq**, un tower defense à la première personne sur téléphone
(three.js r128, un seul fichier HTML). Les modèles sont écrits **en code JavaScript** avec un petit kit maison, `K`,
puis « cuits » en maillages colorés par sommet. Pas de fichiers 3D, pas de textures, pas de three.js dans ton code.

Tout est dans le dossier `gfx/` (chemins relatifs à ce dossier) :

| fichier | rôle | à modifier ? |
|---|---|---|
| `kit.js` | le kit `K` : formes, constructeur, cuisson, palette | **non** |
| `models/shared.js` | `SH` : motifs des cinq éléments, yeux, pierre, planches, bannière, gemme | **non** |
| `models/enemy_b.js` | **modèle de référence** (le lutin) : lis-le en premier, c'est le style et la structure attendus | non |
| `three-lite.js`, `preview.html`, `preview.js` | moteur d'aperçu local et outil de rendu | **non** |
| `models/<ton fichier>.js` | **ton travail** | oui, celui-là seulement |
| `out/` | tes images d'aperçu | oui |

Si tu trouves un défaut dans un fichier « non modifiable », contourne-le dans ton fichier et signale-le dans ton compte rendu.

## 1. Voir ce que tu fais (obligatoire)

```bash
cd gfx
node preview.js out/essai.png models/shared.js,models/enemy_b.js enemy.b el=feu
```
Puis **ouvre l'image avec l'outil Read** et regarde-la vraiment. L'outil affiche aussi le nombre de triangles par pièce et la boîte englobante.

Options utiles (`clé=valeur`) :
- `el=feu|eau|bois|terre|elec` — l'élément ; `el=all` montre les cinq versions côte à côte.
- `views=hero,back,side,close` (défaut) — aussi `front`, `top`, `large`, `turn` (8 angles). `cols=`, `tw=`, `th=` règlent la planche.
- `zoom=0.5` rapproche la caméra, `spacing=2` écarte les modèles côte à côte, `ref=0` retire le repère gris (un bloc de 1,70 m = la taille du joueur).
- `t=0.3` — instant de l'animation (pour vérifier pivots et amplitudes ; essaie deux valeurs).
- `fp=0.27,-0.23,-0.72` — vue « en main » pour les outils tenus par le joueur (cadrage exact du jeu).
- Plusieurs modèles côte à côte : `enemy.b,enemy.tank`. Plusieurs fichiers : `models/shared.js,models/monfichier.js` (toujours `shared.js` en premier).
- Toute autre `clé=valeur` arrive telle quelle (chaîne) dans `ctx` : `els=feu,feu,eau`, `lvl=2`…

La vue `hero` est celle du joueur : œil à 1,70 m. **C'est elle qui compte le plus**, avec `close`.
Le soleil vient de derrière le modèle, côté droit (direction +X, −Z) : la face avant (+Z) est donc souvent à l'ombre dans `hero`. C'est voulu : le jeu se
regarde sous tous les angles. Vérifie aussi `back` (éclairé).

**Faces manquantes ou trouées dans l'image = triangles orientés à l'envers** (le moteur n'affiche que les faces vues de l'extérieur, comme le jeu). Les formes
du kit sont toujours bien orientées ; le risque vient de `K.face`, des profils de `K.lathe`, ou d'un polygone de `K.prism` qui se recoupe.

Méthode de travail attendue : modèle → aperçu → **regarder** → corriger → recommencer, jusqu'à ce que ce soit vraiment beau. Compte 3 à 6 allers-retours par modèle.

## 2. Le kit `K`

Repère : **mètres, +Y vers le haut, le modèle est posé sur y = 0, centré en x = z = 0. Les créatures regardent vers +Z.**

### Formes (toutes centrées sur l'origine sauf mention)
```js
K.box(w,h,d, tx=1,tz=1)        // boîte ; tx,tz rétrécissent le dessus (0 = arête / pointe) → blocs taillés, toits, pyramides
K.cyl(rHaut,rBas,h, seg=8, {a0, open, arc})   // cylindre ou tronc de cône d'axe Y. seg = nombre de côtés. a0 = angle de départ (seg=4,a0=Math.PI/4 → prisme carré aligné)
K.cone(r,h, seg=8)             // pointe vers +Y
K.sph(r, ws=10, hs=7, {t0,t1}) // sphère lisse ;  K.dome(r,ws,hs) = demi-sphère (ouverte en bas)
K.ico(r, detail=0)             // icosphère : 20 faces (detail 0), 80 (1), 320 (2) → corps facettés, feuillages
K.oct(r) K.dod(r) K.tet(r)     // octaèdre (gemmes), dodécaèdre (roches), tétraèdre
K.rock(r, graine, detail=1, rough=.28)   // rocher irrégulier, reproductible
K.torus(R, r, rs=6, ts=12, arc)// anneau dans le plan XY (axe Z). Pour un anneau à plat : r:[Math.PI/2,0,0]
K.lathe([[rayon,y],…], seg=10, {capB,capT})   // profil tourné autour de Y. Points du BAS vers le HAUT ; l'extérieur est à droite quand on remonte le profil
K.prism([[x,z],…], h, {y0, taper})            // polygone du plan XZ extrudé vers +Y (étoiles, feuilles, lames, éclairs, pignons). Concave accepté
K.tube(points3D, rayon | [rayons], seg=6)     // tube le long d'un chemin (cornes, queues, lianes, tentacules). Rayon 0 au bout = pointe
K.curve(points3D, n)           // lisse un chemin (Catmull-Rom) → à donner à K.tube
K.face([p0,p1,p2,…], {dbl})    // polygone plat convexe (sens anti-horaire vu du côté visible) ; dbl:true = visible des deux côtés
```

### Constructeur
```js
const b=K.make(graine);                       // une graine par constructeur (modèle identique à chaque chargement)
b.add(forme, {p:[x,y,z], r:[rx,ry,rz], s:1.2 | [sx,sy,sz],   // position, rotation (radians, ordre XYZ comme three.js), échelle
              c:0xRRGGBB | [r,g,b], c2:couleurDuHaut,        // couleur ; avec c2 : dégradé du bas (c) vers le haut (c2) de la forme
              flat:true,                                     // facettes franches (défaut) ; flat:false = lissé (yeux, gouttes)
              ch:'m',                                        // canal : 'm' mat (défaut) · 's' brillant (métal, gemmes) · 'g' lumineux, non éclairé (yeux, braises, runes) · 'x' lueur additive transparente
              jit:.05, ao:.2});                              // jit : légère variation de teinte par face ; ao : assombrit le bas de la pièce
b.group({p,r,s}, b=>{ … });                   // sous-ensemble transformé d'un bloc (une patte, une tourelle) : les add() à l'intérieur héritent du repère
b.sym(cote=>{ … });                           // appelle deux fois : cote = 1 puis −1 (pièces gauche/droite)
b.use(autreConstructeur, {p,r,s});            // recopie un sous-modèle (une dent, une brique, une patte) autant de fois que voulu
b.rnd()                                       // hasard reproductible (0…1)
b.tris()                                      // nombre de triangles
```
Une échelle négative (miroir) est gérée : les faces restent du bon côté.

Couleurs : `K.mix(c1,c2,t)`, `K.shade(c,f)` (f < 1 fonce, > 1 éclaircit). **Utilise la palette** (§ 4), pas des couleurs inventées.

### Recette (ce que ta fonction renvoie)
```js
MODELS['famille.nom']=ctx=>{ …
  return {
    parts:[ {name:'body', b:corps},                                         // pièce racine
            {name:'arms', b:bras, parent:'body', pivot:[0,1.3,0],            // pièce animée : tourne autour de `pivot` (point du repère du modèle, au repos)
             anim:[{k:'rot', axis:'x', amp:.45, sp:7}]} ],                   // k:'rot'|'pos'|'scl' · axis · amp · sp (rad/s) · ph (phase) · base · abs:true (rebond) · spin:true (tourne en continu à sp rad/s)
    bake:{ground:.22, groundH:.7, map:{s:'m'}},   // options de cuisson : ground = ombre de contact près du sol ; map = fusionne des canaux
    scale:.86,                                    // échelle appliquée par le jeu (permet de modeler à une taille confortable)
    …infos demandées dans ta mission (barY, muzzle, etc.)
  };
};
```
Un objet fixe sans pièce animée peut renvoyer directement son constructeur : `return b;`.
**Tout se modèle dans le repère du modèle, au repos** ; le `pivot` est juste le point autour duquel la pièce tournera.

Chaque canal de chaque pièce coûte un « appel de dessin » : garde peu de pièces animées et peu de canaux (voir ta mission).

## 3. Règles de code (le fichier sera recopié tel quel dans le jeu)

- Tout ton fichier tient dans **un bloc** `{ … }` (comme `enemy_b.js`). Dedans : uniquement `const` / `let` et des fonctions fléchées. **Pas de `function nom(){}` ni de `var`** au niveau du fichier, pas d'`import`/`require`.
- N'utilise que `K`, `SH`, `MODELS`, `Math`. **Jamais `THREE`, `document`, `window`, `Math.random()`** (hasard : `b.rnd()` ou `K.rng(graine)`).
- `ctx.el` est l'élément (`'feu'|'eau'|'bois'|'terre'|'elec'`), `ctx.P = K.EL[ctx.el]` sa palette. Les autres champs de `ctx` peuvent arriver sous forme de **chaînes** (depuis l'aperçu) : convertis-les (`+ctx.lvl`, `String(ctx.els).split(',')`).
- Une fonction de modèle doit être rapide (quelques millisecondes) et sans effet de bord.
- Commente en français, brièvement : une ligne par groupe de pièces (« crête dorsale », « bouche »), comme dans la référence.

## 4. Direction artistique

**L'univers.** Une île ancienne où cinq forces — Feu, Eau, Bois, Terre, Élec — convergent vers un cristal, le cœur. Les défenseurs (le joueur) bâtissent en
**pierre taillée, bois chaud, bronze et fer sombre**, avec des cristaux et des bannières aux couleurs des éléments. Les assaillants sont des **créatures
élémentaires** sorties de portails de pierre : leur corps est fait de leur élément.

**Le style.** Low-poly stylisé : **facettes franches**, silhouettes lisibles à 40 m, détails qui récompensent le regard de près (le joueur passe à 2 m des
choses). Couleurs chaudes et franches, jamais fluo, jamais grisâtres. Beaucoup de petites pièces bien placées valent mieux qu'une grosse forme lisse :
une créature a des yeux, une bouche, des griffes, une queue ; une tour a des blocs de pierre, des poutres, des ferrures, des cordages.
Pas de sphères nues, pas de cubes nus : c'est exactement ce que le joueur ne veut plus voir.

**Les cinq éléments** — chaque modèle « élémentaire » montre son élément **par sa forme, pas seulement par sa couleur** :

| élément | couleur | matière et motifs |
|---|---|---|
| Feu | orange-rouge | braises, fissures de lave, flammes (`SH.flame`), cornes noircies |
| Eau | bleu | gouttes et bulles (`SH.drop`), nageoires, écailles, coquillages, surfaces brillantes |
| Bois | vert | écorce, feuilles et pousses (`SH.leaf`), lianes, ramures, mousse |
| Terre | ocre-brun | roche, éclats de cristal et ambre (`SH.crystal`), plaques de pierre, mousse |
| Élec | jaune | éclairs (`SH.bolt`), pointes métalliques, bobines de cuivre, arcs lumineux |

`SH.motif(b, el, {p,r,s})` pose le bon motif (≈ 0,6 m de haut à `s:1`). Tu peux en créer d'autres dans le même esprit.

**Palettes** (dans `kit.js`) :
- `K.EL[el]` → `main` (teinte de l'élément), `dark`, `deep` (très sombre), `light`, `glow` (presque blanc).
- `K.PAL` → pierre `stone stoneL stoneD stoneDD`, `moss`, `sand`, `dirt dirtD`, bois `wood woodL woodD plank`, écorce `bark barkD`, `rope`,
  métal `iron ironL steel bronze bronzeL gold goldD`, `bone boneD`, `white black`, tissu `cloth clothD cream purple purpleD`, `skin`,
  feuillage `leaf leafL leafD pine pineL pineD grass grassL`, magie `crystal crystalD rune portal portalD lava ice`.

**Lumière.** Soleil chaud assez bas + ciel bleu clair. Une face à l'ombre garde environ la moitié de sa couleur : évite les couleurs très sombres sur de
grandes surfaces (elles deviennent des trous noirs). Les canaux `g` (lumineux) restent vifs même à l'ombre : parfaits pour les yeux, les braises, les runes,
mais à petite dose.

**Aides partagées** (`SH`, à utiliser pour que tout se ressemble) : `SH.eye(b,{p,r,rot,iris,glow})` les yeux de toutes les créatures ·
`SH.bricks(b,{r,h,rows,n,y,taper})` anneau de blocs de pierre · `SH.blockWall(b,{p,r,w,h,d,rows,cols})` mur droit de blocs ·
`SH.planks(b,{p,r,w,h,d,n,vertical})` planches · `SH.banner(b,{p,r,h,w,l,c})` bannière sur hampe · `SH.gem(b,{p,s,c})` gemme taillée.

## 5. Compte rendu attendu

À la fin, écris un compte rendu **court** :
1. le chemin de ton fichier ;
2. un tableau : nom du modèle · triangles · pièces et canaux · dimensions finales · pivots/infos demandés ;
3. le chemin d'une ou deux planches d'aperçu finales qui montrent tout ton travail ;
4. ce qui s'écarte de la mission, et tout défaut trouvé dans le kit.
