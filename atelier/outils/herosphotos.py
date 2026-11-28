#!/usr/bin/env python3
# V12.9 : l'élément d'un héros se choisit. HPHOTO a douze portraits : un par élément pour le gardien (clé « feu », « eau »… : hero=terre, el=élément) et un par élément pour Braise (clé « braise_feu », « braise_eau »… : hero=feu, el=élément). Arguments : des clés (« braise_eau », « eau »…) ; sans argument, tout.
# Fabrique gfx/heros-photos.js : le portrait de chaque héros (HPHOTO), tiré du modèle hero.avatar par l'outil d'aperçu, pour les cartes de héros des portails et du hall (V11.4).   usage : python3 outils/herosphotos.py [élément …]
# V12.8 : hero.avatar rend Braise (gfx/models/braise.js) pour le feu. Avec des éléments en argument (ex. « feu »), seuls leurs portraits sont refaits : les autres sont repris tels quels du fichier existant.
import base64, io, os, re, subprocess, sys, tempfile
from PIL import Image

EL6 = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent']
TOUS = EL6 + ['braise_' + e for e in EL6]
FAIRE = sys.argv[1:] or TOUS
assert all(e in TOUS for e in FAIRE), FAIRE
ANCIENS = dict(re.findall(r"(\w+):'(data:image/png;base64,[A-Za-z0-9+/=]+)'", open('gfx/heros-photos.js').read())) if os.path.exists('gfx/heros-photos.js') else {}
D = tempfile.mkdtemp()
out = []
for e in TOUS:
    if e not in FAIRE and e in ANCIENS:
        out.append("%s:'%s'" % (e, ANCIENS[e]))
        continue
    p = os.path.join(D, e + '.png')
    subprocess.run(['node', 'gfx/preview.js', p, 'gfx/models/shared.js,gfx/models/braise.js,gfx/models/mains.js', 'hero.avatar', 'el=' + e.replace('braise_', ''), 'hero=' + ('feu' if e.startswith('braise_') else 'terre'), 'views=portrait', 'ref=0', 'ground=0', 'bg=12303a', 'tw=600', 'th=800', 'cols=1'], check=True, stdout=subprocess.DEVNULL)
    im = Image.open(p).convert('RGB').crop((120, 40, 480, 400)).resize((144, 144), Image.LANCZOS).quantize(64)
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    out.append("%s:'data:image/png;base64,%s'" % (e, base64.b64encode(b.getvalue()).decode()))
    im.save(os.path.join(D, e + '-carte.png'))
open('gfx/heros-photos.js', 'w').write("// portraits des héros pour les menus (gardien par élément, Braise par élément) (faits par outils/herosphotos.py, ne pas éditer)\nconst HPHOTO={" + ','.join(out) + "};\n")
print('gfx/heros-photos.js', os.path.getsize('gfx/heros-photos.js'), 'octets · refaits :', ' '.join(FAIRE), '·', D)
