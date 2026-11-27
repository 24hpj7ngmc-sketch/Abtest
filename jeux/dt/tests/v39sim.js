// V3.9 : règles des variantes de zombies (mode fuite) et des deux nouvelles armes (fusil à pompe, lance-flammes)
const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(__dirname+'/../regles.js','utf8');
const ctx={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(ctx);
vm.runInContext(src+';this.API={newRun,step,startDay,H,ZT,shoot,WEAP,spawnOne,DOORS,setPlanks,LVY,gridBuild,tearDoor:typeof tearDoor!=="undefined"?tearDoor:null};',ctx);const A=ctx.API;
let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
const count=(mode,d)=>{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode},d,5);A.startDay(S);for(let k=0;k<1500&&S.toSpawn>0;k++)A.spawnOne(S);const n=new Array(8).fill(0);for(let q=0;q<S.nAct;q++)n[S.z.ty[S.act[q]]]++;return{n,S};};
{const r=count('out',2);T('jour 2 : des sprinteurs, pas encore les autres',r.n[4]>0&&r.n[5]+r.n[6]+r.n[7]===0,r.n.join(','));}
{const r=count('out',6);T('jour 6 : les 4 variantes',r.n[4]>0&&r.n[5]>0&&r.n[6]>0&&r.n[7]>0,r.n.join(','));T('elles restent minoritaires (< 15 %)',(r.n[4]+r.n[5]+r.n[6]+r.n[7])/r.S.nAct<.15);
  T('première apparition annoncée une fois par sorte',r.S.ev.filter(e=>e.k==='variant').length===4);}
{const r=count('in',6);T('« Ils arrivent » : aucune variante',r.n[4]+r.n[5]+r.n[6]+r.n[7]===0);}
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,5);A.startDay(S);for(let k=0;k<70;k++)A.spawnOne(S);let v=0;for(let q=0;q<S.nAct;q++)if(S.z.ty[S.act[q]]>=4)v++;T('jour 1 (sans tourelle) : pas de variante',v===0);}
function hitAt(w,dist){const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out',weap:w},2,7);S.phase='day';S.weap=w;const p=S.p;p.x=0;p.z=-30;p.y=0;p.yaw=0;p.pitch=0;
  S.devTy=0;A.spawnOne(S);delete S.devTy;const Z=S.z,i=S.act[S.nAct-1];Z.x[i]=0;Z.z[i]=-30-dist;Z.y[i]=0;Z.st[i]=1;Z.hp[i]=Z.hm[i]=1000;S.ev.length=0;A.gridBuild(S);
  for(let k=0;k<10;k++)A.shoot(S);return{d:(1000-Z.hp[i])/10,burn:Z.burn[i],ev:S.ev};}
{const a=hitAt('pompe',4),b=hitAt('pompe',15),c=hitAt('pompe',28);T('pompe : forte de près, faible de loin',a.d>35&&b.d<a.d&&c.d<b.d,a.d.toFixed(1)+' / '+b.d.toFixed(1)+' / '+c.d.toFixed(1));
  T('pompe : un événement de tir et des plombs',a.ev.filter(e=>e.k==='shot').length===10&&a.ev.filter(e=>e.k==='pellet').length>=30);}
{const a=hitAt('lance',5),b=hitAt('lance',13);T('lance-flammes : brûle à 5 m',a.d>2&&a.burn>2,a.d.toFixed(1)+' par tic, brûlure '+a.burn.toFixed(1)+' s');T('lance-flammes : rien à 13 m',b.d===0);}
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},6,3);A.startDay(S);for(let k=0;k<200;k++)A.spawnOne(S);S.devTy=7;A.spawnOne(S);delete S.devTy;const h=S.act[S.nAct-1];S.z.hcd[h]=.5;
  let cri=false;for(let t=0;t<30;t++){A.step(S,1/30,{f:0,r:0,yaw:0,pitch:0});if(S.ev.some(e=>e.k==='hurle'))cri=true;S.ev.length=0;}let n=0;for(let q=0;q<S.nAct;q++)if(S.z.hst[S.act[q]]>0)n++;T('hurleur : il crie et accélère les voisins',cri&&n>3,n+' accélérés');}
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},4,3);const before=S.save.cash||0;S.devTy=6;A.spawnOne(S);delete S.devTy;const i=S.act[S.nAct-1];S.z.st[i]=1;
  vm.runInContext('hurtZ',ctx)(S,i,1e6,'p');T('porteur abattu par le joueur : gros butin',(S.save.cash||0)-before>=50,((S.save.cash||0)-before).toFixed(0)+' $');}
console.log(ok+' OK, '+ko+' ratés');
