#!/bin/sh
# assemble le banc des avant-postes : outils/opsim.sh puis node /tmp/sim_opg.js normal 1 4 .45 out=false
python3 - <<'P'
t=open('tests/t52.js').read();s=open('construit/all.js').read()
tail=t[t.index('// joueur simulé'):t.index('function bot')]
a=s.index('//<SIM>');b=s.index('//</SIM>')
open('/tmp/sim_opg.js','w').write(s[a:b]+'\n'+tail+'\n'+open('tests/op_tail.js').read())
open('/tmp/sim_op2.js','w').write(s[a:b]+'\n'+tail+'\n'+open('tests/op_tail2.js').read())
P
