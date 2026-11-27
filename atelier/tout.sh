#!/bin/sh
# les tests du lobby, lancés en même temps (≈ 3 min 30) : ./tout.sh      (les tests des règles et de la partie de chaque mini-jeu vivent dans l'atelier du mini-jeu)
# À lancer une seule fois, à la fin d'un changement. Pendant le travail : ./mktest.sh && node tests/runarm.js (3 s) ou le test du sujet touché.
./mktest.sh | tail -1
prettier --check "src/**/*.js" src/page/style.css >/dev/null 2>&1 && echo "mise en forme : bonne" || echo "mise en forme : À REFAIRE (prettier --write \"src/**/*.js\" src/page/style.css)"
python3 outils/lintcom.py | tail -3   # un « // » ajouté en milieu de ligne avale le code qui suit : zéro ligne suspecte attendue
L="runtables runpanneau runroles runarm runarme runcamp runtoit runsync runguide runile"
for t in $L; do (node tests/$t.js > /tmp/tout-$t.log 2>&1; echo "$t : $(grep -c '^RATÉ' /tmp/tout-$t.log) raté(s) · $(grep -i 'erreurs' /tmp/tout-$t.log | tail -1 | cut -c1-90)") & done
wait
# les tests à plusieurs téléphones simulés tournent ensuite, à trois seulement : leurs délais de réseau ratent quand la machine est chargée
for t in runmq runmulti runtoitm runilem; do (node tests/$t.js > /tmp/tout-$t.log 2>&1; echo "$t : $(grep -c '^RATÉ' /tmp/tout-$t.log) raté(s) · $(grep -i 'erreurs' /tmp/tout-$t.log | tail -1 | cut -c1-90)") & done
wait
# le test du lobby tourne seul, après les autres : ses appuis sont chronométrés et ratent quand la machine est chargée
node tests/runlob.js > /tmp/tout-runlob.log 2>&1; echo "runlob : $(grep -c '^RATÉ' /tmp/tout-runlob.log) raté(s) · $(grep -i 'erreurs' /tmp/tout-runlob.log | tail -1 | cut -c1-90)"
