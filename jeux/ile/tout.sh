#!/bin/sh
# tous les tests de L'Île des Cinq, lancés en même temps (≈ 1 min) : ./tout.sh
# À lancer une seule fois, à la fin d'un changement. Pendant le travail : ./mktest.sh && node tests/run1.js (3 s) ou le test du sujet touché.
T=/tmp/ile-$(basename "$PWD"); mkdir -p "$T"; export ILE_TMP="$T"   # journaux à part pour chaque dossier de travail (plusieurs ateliers peuvent tourner en même temps)
./mktest.sh | tail -1
prettier --check "src/**/*.js" src/page/style.css >/dev/null 2>&1 && echo "mise en forme : bonne" || echo "mise en forme : À REFAIRE (prettier --write \"src/**/*.js\" src/page/style.css)"
python3 outils/lintcom.py | tail -3   # un « // » ajouté en milieu de ligne avale le code qui suit : zéro ligne suspecte attendue
python3 outils/noms.py manquants | head -4   # un nom utilisé mais déclaré nulle part : zéro attendu
for t in run1 run9 run10 runaj runhire runrenf runcamp runjeu runpartie runarmes runvagues; do (node tests/$t.js > $T/$t.log 2>&1; echo "$t : $(grep -c '^RATÉ' $T/$t.log) raté(s) · $(grep -i 'erreurs' $T/$t.log | tail -1 | cut -c1-90)") & done
# règles : à zéro, la simulation d'équilibre doit donner les mêmes lignes qu'avant (référence dans tests/sim-ref.out, à refaire seulement quand un changement de règles est voulu)
(rm -f $T/sim.txt; python3 outils/simbal.py >/dev/null && node $T/sim_new.js > $T/sim.txt 2>&1; cmp -s $T/sim.txt tests/sim-ref.out && echo "règles : simulation identique à la référence" || echo "règles : LA SIMULATION A CHANGÉ (diff $T/sim.txt tests/sim-ref.out)") &
wait
# le fichier à coller (dans une page vide) et le multi (deux téléphones simulés) tournent ensuite, l'un après l'autre : leurs délais ratent quand la machine est chargée
for t in runpont runmulti runciel runvent runvoies runsorts runelheros; do node tests/$t.js > $T/$t.log 2>&1; echo "$t : $(grep -c '^RATÉ' $T/$t.log) raté(s) · $(grep -i 'erreurs' $T/$t.log | tail -1 | cut -c1-90)"; done
