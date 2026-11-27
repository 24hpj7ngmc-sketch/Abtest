#!/bin/sh
# toutes les simulations de règles, dans un dossier : ./simall.sh /tmp/apres   (à comparer avec diff -r : les règles n'ont pas bougé si tout est identique)
D=${1:-/tmp/simres}; mkdir -p $D
python3 build.py >/dev/null && python3 outils/simbal.py >/dev/null && outils/opsim.sh && python3 - <<'P'
t=open('tests/t52.js').read();s=open('construit/all.js').read()
tail=t[t.index('// joueur simulé'):t.index('function bot')];k=t.index('function bot');m=t.index('\n// ',k+10);bot=t[k:m]
a=s.index('//<SIM>');b=s.index('//</SIM>')
open('/tmp/sim_pup.js','w').write(s[a:b]+'\n'+tail+bot+'\n'+open('tests/pup_tail.js').read())
P
node /tmp/sim_new.js > $D/equilibre.txt 2>&1 &
node /tmp/sim_bots.js > $D/bots.txt 2>&1 &
node /tmp/sim_pup.js > $D/bonus.txt 2>&1 &
node /tmp/sim_op2.js 2 3 > $D/avantpostes2.txt 2>&1 &
node /tmp/sim_op2.js 3 2 > $D/avantpostes3.txt 2>&1 &
node /tmp/sim_opg.js hard 1 2 .45 > $D/difficile.txt 2>&1 &
wait; wc -l $D/*.txt | tail -1
