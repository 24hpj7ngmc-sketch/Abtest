#!/usr/bin/env python3
# Fabrique le paquet « appli » (V12.0) : construit/abtest-appli.zip = index.html (la page publiée) + manifest.webmanifest + les icônes.
# Déposé sur un hébergement où la page est seule (Netlify, GitHub Pages), le jeu s'installe sur l'écran d'accueil et s'ouvre en plein écran.   usage : python3 outils/mkappli.py
import json, math, os, zipfile
from PIL import Image, ImageDraw

def icone(n):
    S = 4
    im = Image.new('RGB', (n * S, n * S), '#0d2a37')
    d = ImageDraw.Draw(im)
    u = n * S / 100
    # ciel en dégradé
    for y in range(n * S):
        k = y / (n * S)
        d.line([(0, y), (n * S, y)], fill=(int(13 + 20 * (1 - k)), int(42 + 50 * (1 - k)), int(55 + 60 * (1 - k))))
    # l'île qui flotte : herbe, puis roche en pointe
    d.polygon([(22 * u, 52 * u), (78 * u, 52 * u), (66 * u, 66 * u), (56 * u, 82 * u), (50 * u, 90 * u), (43 * u, 80 * u), (33 * u, 66 * u)], fill='#8a6a48')
    d.polygon([(33 * u, 66 * u), (66 * u, 66 * u), (56 * u, 82 * u), (50 * u, 90 * u), (43 * u, 80 * u)], fill='#6b5038')
    d.rounded_rectangle([18 * u, 44 * u, 82 * u, 55 * u], radius=5 * u, fill='#5fd068')
    # le portail doré
    d.rounded_rectangle([42 * u, 22 * u, 58 * u, 46 * u], radius=8 * u, outline='#ffcf5a', width=int(3.2 * u))
    # les cinq éléments en arc au-dessus
    for i, c in enumerate(['#3fa9ff', '#ff6a3d', '#ffd93b', '#cf9a5c', '#5fd068']):
        a = math.radians(205 + i * 32.5)
        x, y = 50 * u + 34 * u * math.cos(a), 44 * u + 30 * u * math.sin(a)
        d.ellipse([x - 4.2 * u, y - 4.2 * u, x + 4.2 * u, y + 4.2 * u], fill=c)
    return im.resize((n, n), Image.LANCZOS)

os.makedirs('appli', exist_ok=True)
for n in (180, 192, 512):
    icone(n).save('appli/icon-%d.png' % n, optimize=True)
json.dump({
    'name': 'Abtest', 'short_name': 'Abtest', 'lang': 'fr', 'start_url': './', 'scope': './', 'display': 'fullscreen', 'display_override': ['fullscreen', 'standalone'],
    'orientation': 'landscape', 'background_color': '#0d2a37', 'theme_color': '#0d2a37',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}],
}, open('appli/manifest.webmanifest', 'w'), ensure_ascii=False, indent=1)
z = zipfile.ZipFile('construit/abtest-appli.zip', 'w', zipfile.ZIP_DEFLATED)
z.write('construit/publie.html', 'index.html')
for f in ('manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'):
    z.write('appli/' + f, f)
z.close()
print('construit/abtest-appli.zip', os.path.getsize('construit/abtest-appli.zip'), 'octets')
