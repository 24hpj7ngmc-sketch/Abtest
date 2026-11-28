#!/usr/bin/env python3
# V13.2 : HPHOTO a 36 portraits (les six héros × les six éléments, clé « braise_feu », « roc_eau »…), tirés de leurs modèles propres ; plus de portraits du gardien. 100 px, 32 couleurs (poids du fichier ≈ 150 Ko). Arguments : des clés (« roc_eau ») ou un nom de héros (« roc »).
# V12.9 : l'élément d'un héros se choisit. HPHOTO a douze portraits : un par élément pour le gardien (clé « feu », « eau »… : hero=terre, el=élément) et un par élément pour Braise (clé « braise_feu », « braise_eau »… : hero=feu, el=élément). Arguments : des clés (« braise_eau », « eau »…) ; sans argument, tout.
# Fabrique gfx/heros-photos.js : le portrait de chaque héros (HPHOTO), tiré du modèle hero.avatar par l'outil d'aperçu, pour les cartes de héros des portails et du hall (V11.4).   usage : python3 outils/herosphotos.py [élément …]
# V12.8 : hero.avatar rend Braise (gfx/models/braise.js) pour le feu. Avec des éléments en argument (ex. « feu »), seuls leurs portraits sont refaits : les autres sont repris tels quels du fichier existant.
import base64, io, os, re, subprocess, sys, tempfile
from PIL import Image

EL6 = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent']
# V13.2 : un portrait par héros et par élément (36) : clé « <modèle>_<élément> » (braise_feu, roc_eau, sylve_bois, volt_elec, ondine_vent, zephyr_terre…) ; hero = l'identité (feu, terre, bois, elec, eau, vent)
HEROS = [('braise', 'feu'), ('roc', 'terre'), ('sylve', 'bois'), ('volt', 'elec'), ('ondine', 'eau'), ('zephyr', 'vent')]
TOUS = [n + '_' + e for n, _ in HEROS for e in EL6]
CLE = {n: h for n, h in HEROS}
ZOOM = {'volt': '1.3'}   # Volt a le buste penché : sa tête sortait du cadre, on recule la caméra
TAILLE, COULEURS = 100, 32
# arguments : des clés (« roc_eau »), ou un nom de héros (« roc » : ses six portraits) ; sans argument, tout
FAIRE = [k for a in sys.argv[1:] for k in (TOUS if False else ([a] if a in TOUS else [t for t in TOUS if t.startswith(a + '_')]))] or TOUS
assert all(e in TOUS for e in FAIRE), FAIRE
ANCIENS = dict(re.findall(r"(\w+):'(data:image/png;base64,[A-Za-z0-9+/=]+)'", open('gfx/heros-photos.js').read())) if os.path.exists('gfx/heros-photos.js') else {}
D = tempfile.mkdtemp()
FICHIERS = 'gfx/models/shared.js,' + ','.join('gfx/models/%s.js' % n for n, _ in HEROS) + ',gfx/models/mains.js'
out = []
for e in TOUS:
    if e not in FAIRE and e in ANCIENS:
        out.append("%s:'%s'" % (e, ANCIENS[e]))
        continue
    p = os.path.join(D, e + '.png')
    n, el = e.split('_')
    subprocess.run(['node', 'gfx/preview.js', p, FICHIERS, 'hero.avatar', 'el=' + el, 'hero=' + CLE[n], 'views=portrait', 'ref=0', 'ground=0', 'bg=12303a', 'zoom=' + ZOOM.get(n, '1'), 'tw=600', 'th=800', 'cols=1'], check=True, stdout=subprocess.DEVNULL)
    im = Image.open(p).convert('RGB').crop((120, 40, 480, 400)).resize((TAILLE, TAILLE), Image.LANCZOS).quantize(COULEURS)
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    out.append("%s:'data:image/png;base64,%s'" % (e, base64.b64encode(b.getvalue()).decode()))
    im.save(os.path.join(D, e + '-carte.png'))
open('gfx/heros-photos.js', 'w').write("// portraits des héros pour les menus (les six héros, chacun dans les six éléments : clé héros_élément) (faits par outils/herosphotos.py, ne pas éditer)\nconst HPHOTO={" + ','.join(out) + "};\n")
print('gfx/heros-photos.js', os.path.getsize('gfx/heros-photos.js'), 'octets · refaits :', ' '.join(FAIRE), '·', D)
