// le joueur descend au 3e étage : les zombies doivent entrer (fenêtres, escalier) et l'atteindre ; le joueur doit pouvoir descendre l'escalier
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={newRun,step,startDay,LVY,NLV,H,levelOf,STAIRS};',c);const A=c.A;
const save={cash:0,lv:{root:1},layout:{},best:0};const S=A.newRun(save,1,3);
// 1) descendre à pied : du toit, entrer dans le cabanon, prendre l'escalier jusqu'au 3e
const go=(tx,tz,n)=>{for(let i=0;i<n;i++){const p=S.p,dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);if(l<.25)break;const yaw=Math.atan2(-dx,-dz);A.step(S,1/30,{f:1,r:0,yaw,pitch:0});S.ev.length=0;}};
go(1,-4,200);go(1,-2.2,100);go(1,-1.6,60);go(1,1.4,120);go(0,2,60);go(-1,1.4,60);go(-1,-1.8,120);console.log('après une volée : y',S.p.y.toFixed(2),'niveau',S.plv,'(toit',A.H,')');
for(let k=0;k<3;k++){go(-1,-2.2,30);go(1,-2.0,60);go(1,1.4,120);go(0,2,60);go(-1,1.4,60);go(-1,-1.8,120);}
console.log('après 4 descentes : y',S.p.y.toFixed(2),'niveau',S.plv);
go(-5.5,-6.5,300);console.log('dans la pièce nord-ouest : x',S.p.x.toFixed(1),'z',S.p.z.toFixed(1),'y',S.p.y.toFixed(2));
// 2) la horde arrive : le joueur reste là (sans tirer)
A.startDay(S);let firstIn=-1,hurtAt=-1;const hp0=S.p.hp;
for(let t=0;t<140*30&&S.phase==='day';t++){A.step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:0});for(const e of S.ev)if(e.k==='win'&&firstIn<0)firstIn=t/30;S.ev.length=0;if(S.p.hp<hp0&&hurtAt<0)hurtAt=t/30;if(S.phase==='dead')break;}
let st={};for(let k=0;k<S.nAct;k++){const i=S.act[k];const key=S.z.st[i]+(S.z.st[i]===3?'@'+S.z.lv[i]:'');st[key]=(st[key]||0)+1;}
console.log('première entrée par une fenêtre',firstIn,'s · premier coup reçu',hurtAt,'s · phase',S.phase,'· états',JSON.stringify(st));
