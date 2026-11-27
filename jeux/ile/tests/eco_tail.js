// économie : or gagné par le joueur et par le pot sur une partie (joueur simulé qui bâtit, héros qui tire)
function runEco(mode,hero,N){const out=[];for(let sd=1;sd<=N;sd++){const s=newSim('feu',mk(sd*7919),{},mode),st={i:0};let g=0,pt=0,inc=0,pin=0,T=0,pw=[],lw=0,li=0;
  while(!s.over&&g++<4000000){if(s.phase==='prep'){pt+=1/30;bot(s,st,'mixte');if(mode!=='normal'||pt>6){pt=0;if(s.wave===1||s.wave===5||s.wave===10||s.wave===15||s.wave===20)pw.push('v'+s.wave+':'+Math.round(inc));startWave(s);}}
    if(hero){const c=s.enemies.filter(e=>!e.bur);if(c.length){const e=c.reduce((a,b)=>a.rem<b.rem?a:b);hurtE(e,hero/30*(1+lvl(s,s.wave)*.05),true,true);}}
    const g0=s.gold,p0=s.pot;step(s,1/30,{f:0,r:0});if(s.gold>g0)inc+=s.gold-g0;if(s.pot>p0)pin+=s.pot-p0;T+=1/30;}
  out.push(s.over+' v'+s.wave+' cœur '+s.core+' · '+(T/60).toFixed(0)+' min · or joueur '+Math.round(inc)+' ('+Math.round(inc/Math.max(1,s.wave))+'/vague) · pot '+Math.round(pin)+' · défenses '+s.towers.length+' · bonus '+(s.pupGot||0)+' · '+pw.join(' '));}
  return mode+' héros '+hero+'\n  '+out.join('\n  ');}
console.log(runEco('normal',30,2));console.log(runEco('hard',15,2));
