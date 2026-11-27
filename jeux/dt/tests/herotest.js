// V3.0 : les héros (règles) — chaque compétence et chaque ultime fait son effet, les passifs agissent, « Ils arrivent » sans héros
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={newRun,step,startDay,useHeroSkill,useHeroUlt,shoot,HEROS,HKEYS,LVY,H,B,ROADS,eyeP};',c);const A=c.A;
let ok=0,ko=0;const T=(n,b,x)=>{b?ok++:ko++;console.log((b?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
const inp={f:0,r:0,yaw:0,pitch:0};
const run=(hero,day,sec,fn)=>{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out',hero},day,7);S.god=true;A.startDay(S);for(let t=0;t<sec;t+=.05){A.step(S,.05,{...inp,yaw:S.p.yaw,pitch:S.p.pitch});if(fn)fn(S,t);}return S;};
// vise la rue nord depuis le bord du toit
const aimN=S=>{Object.assign(S.p,{x:0,z:-A.B+.8,y:A.H,yaw:0,pitch:-.55});};
for(const h of A.HKEYS){const H=A.HEROS[h];
  const S=run(h,4,20);const k0=S.kills;aimN(S);S.hab=0;const ok1=A.useHeroSkill(S);const ev=[];for(let t=0;t<6;t+=.05){A.step(S,.05,{...inp,yaw:S.p.yaw,pitch:S.p.pitch});for(const e of S.ev)ev.push(e.k);S.ev.length=0;}
  T(H.n+' : '+H.sk,ok1&&S.hab>0,'recharge '+S.hab.toFixed(1)+' s · tués pendant 6 s : '+(S.kills-k0)+' · évènements '+[...new Set(ev)].filter(k=>!/shot|land|esc|wk/.test(k)).join(','));
  S.ult=1;aimN(S);const k1=S.kills;const ok2=A.useHeroUlt(S);const ev2=[];for(let t=0;t<9;t+=.05){A.step(S,.05,{...inp,yaw:S.p.yaw,pitch:S.p.pitch});for(const e of S.ev)ev2.push(e.k);S.ev.length=0;}
  T(H.n+' : '+H.ul,ok2,'tués pendant 9 s : '+(S.kills-k1)+' · évènements '+[...new Set(ev2)].filter(k=>!/shot|land|esc|wk/.test(k)).join(','));}
// vie des héros
{const r=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out',hero:'terre'},1,1),v=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out',hero:'elec'},1,1);T('Roc +50 de vie, Volt −15',r.p.hpMax===150&&v.p.hpMax===85,r.p.hpMax+' / '+v.p.hpMax);}
// « Ils arrivent » : pas de héros
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'in',hero:'feu'},1,1);T('« Ils arrivent » : pas de héros',S.hero===null&&!A.useHeroSkill(S));}
// passifs : Braise enflamme, Ondine ralentit, Sylve empoisonne
for(const [h,f] of [['feu','burn'],['eau','slow'],['bois','psn']]){const S=run(h,3,12);aimN(S);let n=0;
  // V3.9 : on vise de vrais zombies dans la rue (les positions dépendent du hasard, viser une zone fixe ne touchait plus rien)
  const tg=[];for(let k=0;k<S.nAct;k++){const i=S.act[k];if(S.z.st[i]===1&&S.z.y[i]<.5)tg.push(i);}
  for(let k=0;k<40&&tg.length;k++){const i=tg[k%tg.length],e=A.eyeP(S.p),dx=S.z.x[i]-e[0],dy=S.z.y[i]+1.05-e[1],dz=S.z.z[i]-e[2];S.p.yaw=Math.atan2(-dx,-dz);S.p.pitch=Math.atan2(dy,Math.hypot(dx,dz));A.shoot(S);}
  for(let k=0;k<S.nAct;k++)if(S.z[f][S.act[k]]>0)n++;T('passif '+A.HEROS[h].n+' ('+f+')',n>0,n+' zombies');}
// le rempart retient la horde
{const S=run('terre',3,25);aimN(S);S.hab=0;A.useHeroSkill(S);const W=S.ramparts[0];let held=0;for(let t=0;t<6;t+=.05){A.step(S,.05,{...inp,yaw:S.p.yaw,pitch:S.p.pitch});}
 T('le rempart retient la horde',W&&W.hp<W.hp0,W?('mur à '+W.x.toFixed(0)+','+W.z.toFixed(0)+' · vie '+W.hp.toFixed(0)+' / '+W.hp0.toFixed(0)):'pas de mur');}
console.log(ok+' OK, '+ko+' ratés');
