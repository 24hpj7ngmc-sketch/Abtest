// Lance tous les tests et fait le bilan.   node tests/tout.js        (tout, ~15 min ; images.js et ecrans.js comparent l'image au pixel près)
//                                           node tests/tout.js vite   (sans les tests 3D, ~1 min)
// Un test « vérifie » s'il finit par « N OK, M ratés » ; « erreurs 0 » = aucune erreur dans la page ; les autres sont des bancs qui affichent des chiffres.
const {spawnSync}=require('child_process'),path=require('path');
const R=path.join(__dirname,'..');
// règles seules (Node, rapides)
const REGLES=['empreinte','v15test','herotest','v39sim','baltest','geotest','insidetest','invtest','stairtest','multiregles','v47regles','v48regles','v49regles'];
// dans la page de test (Chromium + moteur d'aperçu, lents)
const PAGE=['run1','v15ui','armes','armes2','devtest','menutest','herofx','climbtest','shoptest','ziptest','v37test','variantes','portee','sndtest','sprinttest','images','ecrans','lobbytest','synchrotest','guidetest','joueurstest','multitest','athtest','grappintest','rolestest'];
const vite=process.argv.includes('vite'),liste=vite?REGLES:REGLES.concat(PAGE);
let bilan=[],echec=0;
for(const t of liste){const t0=Date.now(),r=spawnSync('node',[path.join(__dirname,t+'.js')],{cwd:R,encoding:'utf8',timeout:600000});
  const out=(r.stdout||'')+(r.stderr||''),m=out.match(/(\d+) OK, (\d+) ratés/),er=out.match(/erreurs (\d+)/),pageErr=/erreurs 0/.test(out)?0:(er?+er[1]:null);
  const rates=out.split('\n').filter(l=>l.startsWith('RATÉ'));
  let etat;if(r.status!==0&&!m)etat='PLANTÉ';else if(m)etat=+m[2]===0&&pageErr!==1?'ok':'RATÉ';else etat=pageErr===0||pageErr===null?'banc':'RATÉ';
  if(etat==='PLANTÉ'||etat==='RATÉ')echec++;
  bilan.push((etat==='ok'?'OK   ':etat==='banc'?'banc ':etat.padEnd(5))+' '+t.padEnd(12)+(m?m[1]+' OK '+m[2]+' ratés':'')+(er?' · erreurs '+er[1]:'')+' · '+((Date.now()-t0)/1000).toFixed(0)+' s');
  for(const l of rates)bilan.push('        '+l);
  if(etat==='PLANTÉ')bilan.push('        '+out.split('\n').filter(Boolean).slice(-3).join(' | ').slice(0,300));
  console.log(bilan.slice(-1-rates.length-(etat==='PLANTÉ'?1:0)).join('\n'));}
console.log('\n'+(echec?echec+' test(s) en échec':'tout passe')+' — '+liste.length+' tests');process.exit(echec?1:0);
