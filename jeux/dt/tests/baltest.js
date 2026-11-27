// V1.7 : balcons tout autour. Le joueur sur un balcon : les envahisseurs passent par les portes-fenêtres, jamais à travers la façade
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={newRun,step,startDay,LVY,B,BALD,OPEN,facePt,SLOTS,floorAt};',c);const A=c.A;
let ok=0,ko=0;const T=(n,b,x)=>{b?ok++:ko++;console.log((b?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
// 1. on fait le tour du balcon du 2e à pied
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,3);const p=S.p,y=A.LVY(2),d=A.B+1.2;Object.assign(p,{x:2.6,z:-A.B+.6,y});   // dans la pièce nord, devant la porte-fenêtre (u = 0 : x = 0)
 p.x=0;let yaw=0;const go=(tx,tz,n)=>{for(let k=0;k<n;k++){const dx=tx-p.x,dz=tz-p.z;yaw=Math.atan2(-dx,-dz);A.step(S,.05,{f:1,r:0,yaw,pitch:0});}};
 go(0,-d,60);const out=Math.abs(p.z)>A.B;go(d,-d,200);go(d,d,300);go(-d,d,300);go(-d,-d,300);go(0,-d,200);
 T('sortir par la porte-fenêtre et faire tout le tour du balcon',out&&Math.hypot(p.x-0,p.z+d)<.6&&Math.abs(p.y-y)<.05,'x '+p.x.toFixed(2)+' z '+p.z.toFixed(2)+' y '+p.y.toFixed(2));
 go(0,-A.B-3.5,60);T('le garde-corps retient',Math.abs(p.z)<A.B+A.BALD&&Math.abs(p.y-y)<.05,'z '+p.z.toFixed(2));}
// 2. jour 7 : le joueur sur le balcon nord du 2e, entre deux portes ; les envahisseurs viennent par les portes-fenêtres
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},7,5);S.god=true;const p=S.p;Object.assign(p,{x:4,z:-A.B-1.2,y:A.LVY(2)});S.plv=2;A.startDay(S);
 const Z=S.z,doors=A.OPEN.filter(o=>o.k==='porte'&&o.lv===2),side=new Uint8Array(Z.x.length),gen=new Uint16Array(Z.x.length);let cross=0,bad=0,onBal=0;
 for(let t=0;t<160;t+=.05){A.step(S,.05,{f:0,r:0,yaw:0,pitch:0});p.x=4;p.z=-A.B-1.2;
  for(let k=0;k<S.nAct;k++){const i=S.act[k];if(gen[i]!==Z.gen[i]){gen[i]=Z.gen[i];side[i]=0;}if(Z.st[i]!==3||Z.lv[i]!==2){side[i]=0;continue;}const m=Math.max(Math.abs(Z.x[i]),Math.abs(Z.z[i]));
    const sd=m<A.B-.35?1:m>A.B+.05?2:0;if(sd===2)onBal++;if(sd&&side[i]&&sd!==side[i]){cross++;if(!doors.some(o=>{const q=A.facePt(o.f,o.u,0);return Math.hypot(q[0]-Z.x[i],q[1]-Z.z[i])<1.6;}))bad++;}if(sd)side[i]=sd;}}
 T('envahisseurs sur le balcon',onBal>0,onBal+' pas sur le balcon');T('passages par la façade : seulement aux portes-fenêtres',bad===0,cross+' passages, '+bad+' hors porte');}
// 3. sauteurs : aucun ne traverse un balcon
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},4,9);A.startDay(S);const Z=S.z;let thr=0,n=0;
 for(let t=0;t<40;t+=.05){A.step(S,.05,{f:0,r:0,yaw:0,pitch:0});for(let k=0;k<S.nAct;k++){const i=S.act[k];if(Z.st[i]!==1||Z.y[i]<=.05)continue;n++;
   const m=Math.max(Math.abs(Z.x[i]),Math.abs(Z.z[i]));for(const lv of[1,2,3,4]){const by=A.LVY(lv);if(m<A.B+A.BALD&&m>A.B&&Z.y[i]<by-.05&&Z.y[i]>by-1.6)thr++;}}}
 T('sauteurs : pas à travers les balcons',thr===0,thr+' sur '+n+' positions en l\'air');}
// 4. emplacements de tourelle des balcons : 16, tous sur le caillebotis
{const b=A.SLOTS.filter(s=>s.k==='balcon');T('32 emplacements de balcon, sur le balcon',b.length===32&&b.every(s=>Math.abs(A.floorAt(s.x,s.z,s.y+.3)-s.y)<.01),b.length+' · ids '+b.map(s=>s.id).join(','));}
console.log(ok+' OK, '+ko+' ratés');
