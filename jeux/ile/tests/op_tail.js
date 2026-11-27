// avant-postes des bots : parties sans aide du joueur, avec et sans avant-poste (BOTCFG.out).
// Le cœur est rendu inépuisable : on compte ce qu'il aurait perdu sur toute la partie (mesure stable, là où gagné/perdu ne départage rien).
//   node /tmp/sim_opg.js <mode> <bots> <graines> <hpG> [clé=valeur de BOTCFG ...]
function runOp(mode,nb,N,tag){let lost=0,T=0,ops=0,otw=0,wl=0,pi=0,bad=0,stuck=0,tw=0,gold=0,per=[];for(let sd=1;sd<=N;sd++){const s=newSim('feu',mk(sd*7919),{},mode);const els=ELS.filter(e=>e!=='feu');for(let j=0;j<nb;j++){const o=botMake(s,j,els[j%4],{});s.others['bot'+j]=o;}s.players=1+nb;s.core=s.coreMax=1e6;
  let g=0,pt=0;const last={};while(!s.over&&g++<3000000){if(s.phase==='prep'){pt+=1/30;if(pt>(mode==='normal'?7:14)){pt=0;startWave(s);}}step(s,1/30,{f:0,r:0});s.events.length=0;T+=1/30;
    if(g%90===0)for(const o of botList(s)){if(!Number.isFinite(o.x+o.z+o.y+o.hp+o.yaw))bad++;const q=last[o.id];if(q&&s.phase==='wave'&&s.enemies.length>3&&Math.hypot(q[0]-o.x,q[1]-o.z)<.05&&!(o.down>0)&&!o.inp.fire)stuck++;last[o.id]=[o.x,o.z];}}
  lost+=1e6-s.core;per.push(Math.round(1e6-s.core));wl+=s.walls.length;pi+=s.pits.length;tw+=s.towers.length;gold+=s.gold;for(let L=0;L<3;L++){const O=opOf(s,L);if(O&&opBuilt(s,O)){ops++;otw+=s.towers.filter(t=>Math.hypot(t.x-O.C[0],t.z-O.C[1])<21).length;}}}
  return (tag+' '+mode+' · '+nb+' bot'+(nb>1?'s':'')).padEnd(24)+': cœur perdu '+(lost/N).toFixed(1)+' ['+per.join(' ')+'] · avant-postes '+(ops/N).toFixed(1)+' (défenses '+(otw/N).toFixed(1)+') · défenses '+(tw/N).toFixed(0)+' · murs '+(wl/N).toFixed(0)+' fosses '+(pi/N).toFixed(0)+' · or restant '+(gold/N).toFixed(0)+' · immobiles '+stuck+(bad?' · NaN!':'')+' · '+(T/N/60).toFixed(0)+' min';}
const A=process.argv,mode=A[2]||'normal',nb=+(A[3]||1),N=+(A[4]||4);if(A[5])BALN.hpG=+A[5];BAL.pupP=0;   // sans bonus : ils brouillent la mesure
for(const kv of A.slice(6)){const[k,v]=kv.split('=');BOTCFG[k]=v==='true'?true:v==='false'?false:isNaN(+v)?v:+v;}
const tag=A.slice(6).join(' ')||'réglage normal';console.log(runOp(mode,nb,N,tag));
