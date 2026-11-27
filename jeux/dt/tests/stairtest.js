// le joueur s'arrête au milieu de l'escalier : les zombies doivent venir le chercher (pas d'impasse)
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={newRun,step,startDay,H};',c);const A=c.A;
for(const where of[[1,0,'toit → volée B'],[-1,0,'volée A du 5e']]){const save={cash:0,lv:{root:1},layout:{},best:0};const S=A.newRun(save,2,9);
  const go=(tx,tz,n)=>{for(let i=0;i<n;i++){const p=S.p,dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);if(l<.25)break;A.step(S,1/30,{f:1,r:0,yaw:Math.atan2(-dx,-dz),pitch:0});S.ev.length=0;}};
  go(1,-4,200);go(1,-2.2,100);go(1,-1.6,60);if(where[0]>0)go(1,0,60);else{go(1,1.4,120);go(0,2,60);go(-1,1.4,60);go(-1,-1.8,120);go(-1,-2.2,30);go(-1,0,60);}
  A.startDay(S);const hp0=S.p.hp;let hurt=-1;for(let t=0;t<200*30&&S.phase==='day';t++){A.step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:0});S.ev.length=0;if(S.p.hp<hp0&&hurt<0)hurt=t/30;}
  console.log(where[2],': joueur y',S.p.y.toFixed(1),'pst',S.pst,'· premier coup',hurt.toFixed(0),'s · phase',S.phase);}
