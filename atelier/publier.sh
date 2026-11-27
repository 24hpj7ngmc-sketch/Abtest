#!/bin/sh
# Assemble la page puis la met à la racine du dépôt (index.html = l'appli GitHub Pages). À lancer depuis atelier/.
set -e
./mktest.sh | tail -1
cp construit/publie.html ../index.html
echo "index.html : $(grep -o '<title>[^<]*' ../index.html | cut -c8-) · $(wc -c < ../index.html) octets"
