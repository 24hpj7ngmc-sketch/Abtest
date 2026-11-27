// avant-postes, conditions réelles (bonus compris, joueur immobile) : node /tmp/sim_op2.js <bots> <graines> [clé=valeur de BOTCFG]  — assemblé par opsim.sh
const A=process.argv,nb=+(A[2]||2),N=+(A[3]||4);for(const kv of A.slice(4)){const[k,v]=kv.split('=');BOTCFG[k]=v==='true'?true:v==='false'?false:isNaN(+v)?v:+v;}
let out=[],W=0,TL=0,dS=0,dN=0;for(let sd=1;sd<=N;sd++){const s=newSim('feu',mk(sd*7919),{},'normal');const els=ELS.filter(e=>e!=='feu');for(let j=0;j<nb;j++){const o=botMake(s,j,els[j%4],{});s.others['bot'+j]=o;}s.players=1+nb;
let g=0,pt=0,c0=s.core,lk=0;
while(!s.over&&g++<3000000){if(s.phase==='prep'){pt+=1/30;if(pt>7){pt=0;startWave(s);}}step(s,1/30,{f:0,r:0});for(const ev of s.events){if(ev.k==='dead'){dS+=Math.hypot(ev.x,ev.z);dN++;}}s.events.length=0;if(s.core<c0)lk+=c0-s.core;c0=s.core;}
out.push((s.over==='win'?'G':'P'+s.wave)+':'+lk);if(s.over==='win')W++;TL+=lk;}
console.log((A.slice(4).join(' ')||'réglage normal').padEnd(26),nb+' bots · gagne '+W+'/'+N+' · cœur perdu en cours de partie '+(TL/N).toFixed(1)+' ['+out.join(' ')+'] · ennemis abattus à '+(dS/dN).toFixed(0)+' m du cœur en moyenne');
