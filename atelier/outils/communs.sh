#!/bin/sh
# Les modèles communs n'ont qu'UN original ; les autres fichiers en sont des copies identiques.
#   - les six héros : atelier/gfx/models/{braise,roc,sylve,volt,ondine,zephyr}.js -> jeux/dt/gfx/models/ et jeux/ile/gfx/models/
#   - les armes en main : jeux/dt/gfx/models/mains.js -> jeux/ile/gfx/armes/mains.js et atelier/gfx/models/armes.js
# usage (depuis atelier/ ou n'importe où) :  outils/communs.sh            recopie les originaux sur les copies
#                                            outils/communs.sh --verifie   ne copie rien ; code de sortie 1 si une copie diffère (appelé par tout.sh)
cd "$(dirname "$0")/.." || exit 1
J=../jeux
PAIRES=""
for h in braise roc sylve volt ondine zephyr; do
  PAIRES="$PAIRES gfx/models/$h.js:$J/dt/gfx/models/$h.js gfx/models/$h.js:$J/ile/gfx/models/$h.js"
done
PAIRES="$PAIRES $J/dt/gfx/models/mains.js:$J/ile/gfx/armes/mains.js $J/dt/gfx/models/mains.js:gfx/models/armes.js"
bad=0
for p in $PAIRES; do
  o=${p%%:*}
  c=${p#*:}
  if cmp -s "$o" "$c"; then continue; fi
  if [ "$1" = "--verifie" ]; then
    echo "RATÉ copie différente de son original : $c (original $o)"
    bad=1
  else
    cp "$o" "$c" && echo "copié : $o -> $c"
  fi
done
[ "$1" = "--verifie" ] && [ $bad = 0 ] && echo "fichiers communs : copies identiques"
exit $bad
