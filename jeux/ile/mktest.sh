#!/bin/sh
# assemble le jeu puis fabrique les deux pages de test, dans construit/ : test3d.html (rendu par le moteur d'aperçu) et test.html (même page, sans dessin : rapide, pour les tests d'interface)
set -e
python3 build.py | tail -1
python3 outils/mk3d.py construit/fragment.html construit/test3d.html >/dev/null
python3 - <<'PY'
h=open('construit/test3d.html').read()
a='<body>';assert a in h
h=h.replace(a,'<body><script>if(window.__armesAuto===undefined)window.__armesAuto=true;</script>',1)   # V2.0 : les tests sautent le choix des armes (armes par défaut)
open('construit/test3d.html','w').write(h)
open('construit/test.html','w').write(h.replace(a,'<body><script>window.__norender=true;</script>',1))
PY
node --check construit/all.js && echo "syntaxe ok"
