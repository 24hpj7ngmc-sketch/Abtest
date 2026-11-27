// banc d'équilibre : un joueur simulé enchaîne les parties, dépense son argent, et l'on note le jour atteint à chaque partie
const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(__dirname+'/../regles.js','utf8');
const ctx={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(ctx);vm.runInContext(src+';this.API={newRun,step,startDay,derive,NODES,NODE,nodeCost,ZT,FACES,B,H,EYE,dayCount,useMissile,useOnde,aimPoint,SLOTS,ROADS,eyeP};',ctx);
const A=ctx.API;
function botOut(S,acc){const p=S.p,Z=S.z;let best=-1,bs=-1e9;const cnt=new Array(8).fill(0);
  for(let k=0;k<S.nAct;k++){const i=S.act[k];if(!Z.st[i])continue;if(Z.st[i]===3||Z.st[i]===7){if(Z.st[i]===3&&Z.lv[i]===5){const d=Math.hypot(Z.x[i]-p.x,Z.z[i]-p.z);if(d<10&&1000-d>bs){bs=1000-d;best=i;}}continue;}const l=Math.hypot(Z.x[i],Z.z[i]);cnt[Z.road[i]]+=l>20?1:0;if(l>105)continue;const sc=l;if(sc>bs){bs=sc;best=i;}}
  const r=cnt.indexOf(Math.max(...cnt)),R=A.ROADS[r],want=[-R.dx*(A.B-1.6),-R.dz*(A.B-1.6)];const dx=want[0]-p.x,dz=want[1]-p.z,dl=Math.hypot(dx,dz);let f=0,rr=0,yaw=p.yaw,pitch=p.pitch;
  if(best>=0){const T=A.ZT[Z.ty[best]],e=A.eyeP(p),tx=Z.x[best]-e[0],ty=Z.y[best]+1.05*T.sc-e[1],tz=Z.z[best]-e[2];yaw=Math.atan2(-tx,-tz);pitch=Math.atan2(ty,Math.hypot(tx,tz));const n=(1-acc)*.25;yaw+=(Math.random()-.5)*n;pitch+=(Math.random()-.5)*n;}
  if(dl>.4){const wx=dx/dl,wz=dz/dl,sy=Math.sin(yaw),cy=Math.cos(yaw);f=-(wx*sy+wz*cy);rr=wx*cy-wz*sy;}
  if(S.misCd<=0&&S.P.mis.on&&S.phase==='day'&&best>=0&&Math.random()<.02){S.p.yaw=yaw;S.p.pitch=pitch;A.useMissile(S);}
  if(S.ult>=1&&S.P.onde.on&&S.nAct>40)A.useOnde(S);
  return{f,r:rr,sprint:dl>3,crouch:false,jump:false,fire:best>=0&&Math.random()<acc,yaw,pitch};}
function bot(S,acc){if(S.mode==='out')return botOut(S,acc);const p=S.p,Z=S.z;let best=-1,bs=-1e9;let fc=[0,0,0,0];
  for(let k=0;k<S.nAct;k++){const i=S.act[k];if(Z.st[i]===2)fc[Z.f[i]]++;}
  let face=fc.indexOf(Math.max(...fc));const n=A.FACES[face];
  const want=Math.max(...fc)>2?[n[0]*(A.B-.6),n[1]*(A.B-.6)]:[0,0];
  for(let k=0;k<S.nAct;k++){const i=S.act[k];const st=Z.st[i];if(!st)continue;let sc;const d=Math.hypot(Z.x[i]-p.x,Z.z[i]-p.z);
    if(st===3)sc=5000-d;else if(st===2)sc=(Z.f[i]===face&&Math.hypot(p.x-want[0],p.z-want[1])<1.5)?3000+Z.y[i]*10:-1;else sc=1000-d;if(sc>bs){bs=sc;best=i;}}
  const dx=want[0]-p.x,dz=want[1]-p.z,dl=Math.hypot(dx,dz);let f=0,r=0,yaw=p.yaw,pitch=p.pitch;
  if(best>=0){const T=A.ZT[Z.ty[best]],tx=Z.x[best]-p.x,ty=Z.y[best]+1.05*T.sc-(p.y+A.EYE),tz=Z.z[best]-p.z;yaw=Math.atan2(-tx,-tz);pitch=Math.atan2(ty,Math.hypot(tx,tz));
    const e=(1-acc)*.25;yaw+=(Math.random()-.5)*e;pitch+=(Math.random()-.5)*e;}
  // déplacement vers le bord voulu, en repère de la caméra
  if(dl>.4){const wx=dx/dl,wz=dz/dl,sy=Math.sin(yaw),cy=Math.cos(yaw);f=-(wx*sy+wz*cy);r=wx*cy-wz*sy;}
  if(S.misCd<=0&&S.P.mis.on&&S.phase==='day'&&best>=0&&Math.random()<.02){S.p.yaw=yaw;S.p.pitch=pitch;A.useMissile(S);}
  if(S.ult>=1&&S.P.onde.on&&(Math.max(...fc)>25||S.p.hp<S.p.hpMax*.4))A.useOnde(S);
  return{f,r,sprint:dl>3,crouch:false,jump:false,fire:best>=0&&Math.random()<acc,yaw,pitch};}
function play(save,acc,startD){const S=A.newRun(save,startD||1,(Math.random()*1e9)|0);A.startDay(S);let t=0;const dt=1/30;const dayT=[];let d0=0;
  while(S.phase!=='dead'&&S.phase!=='won'){A.step(S,dt,bot(S,acc));S.ev.length=0;t+=dt;
    if(S.phase==='prep'){dayT.push(Math.round(t-d0));d0=t;if(S.day>save.maxDay)break;A.startDay(S);}
    if(S.phase==='rescue'){S.phase='won';}
    if(t>3600)break;}
  return{escx:S.escaped,day:S.day,phase:S.phase,t:Math.round(t),cash:Math.round(S.runCash),kills:S.runKills,dayT,hp:Math.round(S.p.hp)};}
// achats : on achète la case la moins chère dans une liste de priorités, tant qu'on peut
const PRI=['t_slot','mg_dmg','f_dmg','s_hp','e_cash','mg_rate','a_mis','f_rate','la_unl','la_dmg','mo_unl','mo_dmg','s_reg','s_arm','mo_rad','f_crit','a_mis_dmg','e_day','b_mur','mg_range','la_ramp','fl_unl','fl_dmg','a_onde','a_onde_ch','b_barb','f_pierce','a_mis_cd','mg_twin','fl_range','mo_frag','la_prism','f_exp','b_murh','a_onde_pw','fl_nap'];
function shop(save){let bought=0;for(;;){let best=null,bc=1e18;for(const id of PRI){const n=A.NODE[id],lv=save.lv[id]||0;if(lv>=n.max)continue;if(n.req&&!(save.lv[n.req]>0))continue;const c=A.nodeCost(n,lv);if(c<bc){bc=c;best=id;}}
  if(!best||bc>save.cash)break;save.cash-=bc;save.lv[best]=(save.lv[best]||0)+1;bought++;}
  // pose : toutes les tourelles débloquées, mitrailleuses d'abord sur le toit, puis lasers/mortiers
  const P=A.derive(save.lv);save.layout={};const types=['mg'];if(P.la.on)types.push('la');if(P.mo.on)types.push('mo');if(P.fl.on)types.push('fl');
  const order=[4,5,6,7,0,1,24,26,2,3,25,27,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,28,29,30,31];let k=0;
  for(const s of order){const sl=A.SLOTS[s];if(!sl||sl.k==='balcon'&&!P.bal||sl.k==='mur'&&!P.mur||sl.k==='int'&&save.mode!=='out')continue;if(k>=P.turrets)break;
    const ty=sl.k==='int'?(P.fl.on?'fl':'mg'):sl.k==='balcon'?(P.fl.on&&k%2?'fl':P.la.on?'la':'mg'):sl.k==='mur'?(P.mo.on?'mo':'mg'):(P.mo.on&&k%3===2?'mo':P.la.on&&k%3===1?'la':'mg');save.layout[s]=ty;k++;}
  return bought;}
const acc=+(process.argv[2]||.6),runs=+(process.argv[3]||14);
const save={cash:0,lv:{root:1},layout:{4:'mg',0:'mg'},best:0,maxDay:10,mode:process.argv[4]||'in'};let tot=0;
for(let r=1;r<=runs;r++){const st=(save.lv.e_start||0)>0?[1,3,5,7][Math.min(save.lv.e_start,3)]:1;const res=play(save,acc,Math.min(st,Math.max(1,save.best)));tot+=res.t;save.best=Math.max(save.best,res.day-(res.phase==='dead'?1:0));
  const b=shop(save);console.log(`partie ${r} : jour ${res.day} ${res.phase==='won'?'GAGNÉ':''} · ${res.t}s (total ${Math.round(tot/60)} min) · tués ${res.kills} · échappés ${res.escx} · gagné ${res.cash}$ · jours ${res.dayT.join(',')} · achats ${b} · reste ${Math.round(save.cash)}$`);
  if(res.phase==='won')break;}
console.log('niveaux',JSON.stringify(save.lv));
