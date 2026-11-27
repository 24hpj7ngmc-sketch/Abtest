# Équilibre hors navigateur : assemble les règles actuelles (src/regles/, lues dans le jeu assemblé all.js entre //<SIM> et //</SIM> : lancer ./mktest.sh avant) avec le joueur simulé de t52.js, puis lance :
import os
#   python3 outils/simbal.py && node /tmp/sim_new.js | tail -6
# Donne : victoires par mode avec / sans aide du héros, et la mesure de l'invasion (largeur du front, ennemis immobiles).
t=open('tests/t52.js').read();s=open('construit/all.js').read()
tail=t[t.index('// joueur simulé'):t.index('function bot')];k=t.index('function bot');m=t.index('\n// ',k+10);bot=t[k:m];eq=t[t.index('// 4) équilibre'):]
extra=open('/tmp/sim_keep.js').read() if False else ''
a=s.index('//<SIM>');b=s.index('//</SIM>')
INV=r"""
// 5) invasion : largeur du front et absence de blocage
{const s=newSim('feu',mk(5),{},'hard');s.god=true;s.wave=5;s.next=genWave(s,6);startWave(s);let wmax=0,nmax=0,stuck=0;const last={};
 for(let g=0;g<30*150&&s.phase==='wave';g++){step(s,1/30,{f:0,r:0});if(g%30===0){for(let pi=0;pi<3;pi++){const E=s.enemies.filter(e=>e.path===pi&&e.fm);if(E.length>3){const P=PATHS[pi].pts[0],l=Math.hypot(P[0],P[1]),ls=E.map(e=>(-e.x*P[1]+e.z*P[0])/l);wmax=Math.max(wmax,Math.max(...ls)-Math.min(...ls));}}nmax=Math.max(nmax,s.enemies.length);
   for(const e of s.enemies){const q=last[e.id];if(q&&Math.hypot(q[0]-e.x,q[1]-e.z)<.05&&!(e.stun>0)&&!(e.k==='rng'&&Math.hypot(e.x,e.z)<=16)&&!(e.chT>0))stuck++;last[e.id]=[e.x,e.z];}}}
 const ways=[0,0,0];let n=0;for(let id=1;id<=3000;id++){ways[wayOf(id,6)]++;n++;}
 console.log('invasion vague 6 : front le plus large',wmax.toFixed(0),'m · ennemis en même temps',nmax,'· immobiles',stuck,'· répartition route/champs/éventail',ways.map(w=>Math.round(w/n*100)+' %').join(' / '),'· fin',s.phase,s.over);}
"""
open(os.environ.get('ILE_TMP','/tmp')+'/sim_new.js','w').write(s[a:b]+'\n'+tail+bot+'\n'+eq+INV);print('ok '+os.environ.get('ILE_TMP','/tmp')+'/sim_new.js')
# bots joueurs : node /tmp/sim_bots.js | tail -4
open(os.environ.get('ILE_TMP','/tmp')+'/sim_bots.js','w').write(s[a:b]+'\n'+tail+bot+'\n'+open('tests/simbots_tail.js').read());print('ok /tmp/sim_bots.js')
