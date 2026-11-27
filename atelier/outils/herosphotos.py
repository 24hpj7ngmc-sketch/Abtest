#!/usr/bin/env python3
# Fabrique gfx/heros-photos.js : le portrait de chaque héros (HPHOTO), tiré du modèle hero.avatar par l'outil d'aperçu, pour les cartes de héros des portails et du hall (V11.4).   usage : python3 outils/herosphotos.py
import base64, io, os, subprocess, tempfile
from PIL import Image

D = tempfile.mkdtemp()
out = []
for e in ['feu', 'eau', 'bois', 'terre', 'elec', 'vent']:
    p = os.path.join(D, e + '.png')
    subprocess.run(['node', 'gfx/preview.js', p, 'gfx/models/shared.js,gfx/models/mains.js', 'hero.avatar', 'el=' + e, 'views=portrait', 'ref=0', 'ground=0', 'bg=12303a', 'tw=600', 'th=800', 'cols=1'], check=True, stdout=subprocess.DEVNULL)
    im = Image.open(p).convert('RGB').crop((120, 40, 480, 400)).resize((144, 144), Image.LANCZOS).quantize(64)
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    out.append("%s:'data:image/png;base64,%s'" % (e, base64.b64encode(b.getvalue()).decode()))
    im.save(os.path.join(D, e + '-carte.png'))
open('gfx/heros-photos.js', 'w').write("// portraits des cinq héros pour les menus (faits par outils/herosphotos.py, ne pas éditer)\nconst HPHOTO={" + ','.join(out) + "};\n")
print('gfx/heros-photos.js', os.path.getsize('gfx/heros-photos.js'), 'octets ·', D)
