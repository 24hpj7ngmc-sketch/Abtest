// bonus à ramasser : chaque effet, la limite par vague, et des parties de bots qui les ramassent
{const s=newSim('feu',mk(11),{},'normal');const ok=(n,c)=>console.log((c?'ok  ':'RATÉ ')+n);s.heroGod=true;
 const give=k=>{s.pups.push({id:s.nid++,k,x:s.hero.x,z:s.hero.z,t:20});step(s,1/30,{f:0,r:0});return s.events.filter(e=>e.k==='pup'&&e.t===k).length;};
 place(s,'mortier',20,20,'eau');startWave(s);for(let i=0;i<30*14;i++)step(s,1/30,{f:0,r:0});s.events.length=0;
 const n0=s.enemies.length;ok('des ennemis sont là ('+n0+')',n0>5);
 ok('or double déclenché',give('or')===1&&s.buff.or>29);
 {const e=s.enemies.find(e=>e.hp>0);const g0=s.gold+s.pot;hurtE(e,9999,true,true);step(s,1/30,{f:0,r:0});const d=s.gold+s.pot-g0;ok('un ennemi abattu rapporte double ('+d+' pour '+KINDS[e.k].g+')',d>=KINDS[e.k].g*2);}
 ok('coup fatal déclenché',give('fatal')===1&&s.buff.fatal>14);
 {const e=s.enemies.find(e=>e.hp>3);hurtE(e,.1,false,true);ok('un tir abat d\'un coup',e.hp<=0);}
 {const e=s.enemies.find(e=>e.hp>3);hurtE(e,.1,false,false);ok('une défense ne profite pas du coup fatal',e.hp>0);}
 ok('frénésie déclenchée',give('fren')===1&&s.buff.fren>19);
 {const t=s.towers[0];t.cd=1;t.off=0;step(s,1/30,{f:0,r:0});ok('les défenses rechargent deux fois plus vite',Math.abs(1-t.cd-2/30)<.002||t.cd>1);}
 s.hero.hp=5;s.hero.ab=7;s.hero.ult=3;ok('plein pouvoir',give('plein')===1&&s.hero.hp===s.hero.maxHp&&s.hero.ab===0&&s.hero.ult===100);
 s.core=10;s.towers[0].off=5;ok('charpentier',give('charp')===1&&s.core===10+BAL.pupCore&&s.towers[0].off===0);
 {const n=s.enemies.filter(e=>e.hp>0).length,k0=s.kills;give('bombe');step(s,1/30,{f:0,r:0});ok('bombe : '+n+' ennemis balayés, il en reste '+s.enemies.length+' (ceux sortis depuis)',s.kills-k0>=n-1&&n>3);}
 for(let i=0;i<30*40;i++)step(s,1/30,{f:0,r:0});ok('les effets s\'éteignent',s.buff.or===0&&s.buff.fatal===0&&s.buff.fren===0&&!FATAL);
 s.pups.push({id:s.nid++,k:'or',x:60,z:60,t:1});for(let i=0;i<40;i++)step(s,1/30,{f:0,r:0});ok('un bonus oublié disparaît',!s.pups.length);
 const sn=snap(s);s.pups.push({id:s.nid++,k:'fren',x:30,z:10,t:9});s.buff.or=12;const s2=newSim('eau',mk(3),{},'normal');s2.client=true;applySnap(s2,JSON.parse(JSON.stringify(snap(s))));ok('un invité reçoit bonus et effets',s2.pups.length===1&&s2.pups[0].k==='fren'&&s2.buff.or===12);}
// combien en tombe par vague (héros planté au cœur qui tue tout : personne ne ramasse)
{const s=newSim('feu',mk(5),{},'normal');s.god=true;let per=[],mx=0;for(let w=1;w<=10;w++){startWave(s);let d=0,g=0;while(s.phase==='wave'&&g++<30*400){for(const e of s.enemies)if(!e.sea&&e.hp>0&&s.rng()<.02)hurtE(e,1e6,true,true);step(s,1/30,{f:0,r:0});d+=s.events.filter(e=>e.k==='pupdrop').length;s.events.length=0;}per.push(d);mx=Math.max(mx,d);}
 console.log((mx<=BAL.pupMax+1?'ok  ':'RATÉ ')+'bonus tombés par vague (10 vagues, 1 boss) : '+per.join(' '));}
function runBots(mode,nb,N){let w=0,wv=0,co=0,got=0,T=0;for(let sd=1;sd<=N;sd++){const s=newSim('feu',mk(sd*7919),{},mode);const els=ELS.filter(e=>e!=='feu');for(let j=0;j<nb;j++){const o=botMake(s,j,els[j%4],{});s.others['bot'+j]=o;}s.players=1+nb;
  let g=0,pt=0;while(!s.over&&g++<3000000){if(s.phase==='prep'){pt+=1/30;if(pt>(mode==='normal'?7:14)){pt=0;startWave(s);}}step(s,1/30,{f:0,r:0});s.events.length=0;T+=1/30;}
  if(s.over==='win')w++;wv+=s.wave;co+=s.core;got+=s.pupGot||0;}
  return (mode+' · '+nb+' bot'+(nb>1?'s':'')).padEnd(18)+': gagne '+w+'/'+N+' · vague moy '+(wv/N).toFixed(1)+' · cœur '+(co/N).toFixed(1)+' · bonus ramassés '+(got/N).toFixed(0)+' · '+(T/N/60).toFixed(0)+' min';}
console.log(runBots('normal',2,3));console.log(runBots('hard',2,3));console.log(runBots('normal',0,2));
