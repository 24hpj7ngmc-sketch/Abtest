// V1.5 : cloisons cassables, masse, planches (mode « Ils s'échappent »)
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={cellX,cellZ,newRun,step,startDay,shoot,useMasse,doorPick,plankStep,PANELS,DOORS,STDOOR,LVY,NLV,WALK,cellI,FUP,ROOMS,SLOTS,spawnOne};',c);const A=c.A;
let ok=0,ko=0;const T=(n,b,x)=>{b?ok++:ko++;console.log((b?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
const inp={f:0,r:0,yaw:0,pitch:0};
// 1. balles perdues : le joueur au 2e étage tire dans une cloison
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,3);const p=S.p;
 const o=A.PANELS.find(o=>o.lv===2&&o.tier==='milieu'&&o.ax==='x'&&o.x0>-6&&o.x1<-3);   // cloison le long de x (normale z) : le morceau du milieu (1 à 2 m)
 p.x=(o.x0+o.x1)/2;p.z=(o.z0+o.z1)/2+1.6;p.y=A.LVY(2);S.plv=2;p.yaw=0;p.pitch=-.05;   // regarde vers −z, à hauteur de poitrine
 let n=0;while(!o.dead&&n<40){A.shoot(S);n++;}T('tirs pour ouvrir une fenêtre (milieu)',o.dead,n+' tirs, hp '+o.hp);
 const ob=A.PANELS.find(q=>q.lv===2&&q.tier==='bas'&&q.x0===o.x0&&q.z0===o.z0),oh=A.PANELS.find(q=>q.lv===2&&q.tier==='haut'&&q.x0===o.x0&&q.z0===o.z0);
 T('le bas et le haut tiennent',!ob.dead&&!oh.dead&&ob.hp===ob.hp0);
 const band=o2=>{let n=0;for(let x=o2.x0+.1;x<o2.x1;x+=.25){const cc=A.cellI(x,(o2.z0+o2.z1)/2);if(cc>=0&&A.WALK[o2.lv][cc])n++;}return n;};
 for(let k=0;k<6;k++)A.step(S,.05,inp);T('une fenêtre n\'ouvre pas de passage',band(o)===0,band(o)+' cases');
 const q0={x:(o.x0+o.x1)/2,z:(o.z0+o.z1)/2+.6};Object.assign(p,q0);for(let k=0;k<30;k++)A.step(S,.05,{f:1,r:0,yaw:0,pitch:0});T('le joueur ne passe pas par la fenêtre',p.z>o.z1,'z '+p.z.toFixed(2)+' (mur à '+o.z1.toFixed(2)+')');
 {A.startDay(S);let i=-1;for(let k=0;k<50&&i<0;k++)A.spawnOne(S);const Z=S.z;for(let k=0;k<S.nAct;k++){const j=S.act[k];if(i<0)i=j;else Z.st[j]=0;}
  Z.st[i]=3;Z.lv[i]=2;Z.ty[i]=0;Z.x[i]=(o.x0+o.x1)/2;Z.z[i]=o.z0-.45;Z.y[i]=A.LVY(2);p.x=Z.x[i];p.z=o.z1+.45;p.y=A.LVY(2);const hp0=p.hp;for(let k=0;k<20;k++)c.zBite(S,i,.05);
  T('pas de morsure par la fenêtre',p.hp===hp0,'vie '+p.hp.toFixed(1));Z.st[i]=0;S.phase='prep';}
 p.z=(o.z0+o.z1)/2+1.6;p.pitch=-.75;let n2=0;while(!ob.dead&&n2<40){A.shoot(S);n2++;}T('puis le bas : le passage s\'ouvre',ob.dead&&(()=>{for(let k=0;k<6;k++)A.step(S,.05,inp);return band(o)>0;})(),n2+' tirs, '+band(o)+' cases ouvertes');
 const ev=S.ev.filter(e=>e.k==='wallhit'||e.k==='wallbreak');T('évènements wallhit/wallbreak',ev.some(e=>e.k==='wallbreak'),ev.length);
 const free=o2=>{let n=0;for(let x=o2.x0+.1;x<o2.x1;x+=.25)for(let z=o2.z0-.3;z<=o2.z1+.3;z+=.25){const cc=A.cellI(x,z);if(cc>=0&&A.WALK[o2.lv][cc])n++;}return n;};
 let opened=0,tried=0;for(const o2 of A.PANELS){if(o2.lv!==3||o2.tier!=='bas'||tried>=10)continue;tried++;const b=free(o2);o2.dead=1;o2.hp=0;const om=A.PANELS.find(q=>q.lv===3&&q.tier==='milieu'&&q.x0===o2.x0&&q.z0===o2.z0);om.dead=1;om.hp=0;c.NAVDIRTY_=1;
   vm.runInContext('NAVDIRTY[3]=1;navFlush();',c);if(free(o2)>b)opened++;}
 T('casser le bas et le milieu d\'une cloison ouvre un passage',opened>=7,opened+' / '+tried+' (les autres ont un meuble devant)');}
// 2. mode « Ils arrivent » : les murs ne bougent pas
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'in'},1,3);const p=S.p;const o=A.PANELS.find(o=>o.lv===2&&o.tier==='milieu'&&o.ax==='x'&&o.x0>-6&&o.x1<-3);
 p.x=(o.x0+o.x1)/2;p.z=(o.z0+o.z1)/2+1.6;p.y=A.LVY(2);S.plv=2;p.yaw=0;p.pitch=-.05;for(let k=0;k<40;k++)A.shoot(S);T('mode « Ils arrivent » : mur intact',!o.dead&&o.hp===o.hp0);}
// 3. masse
{const S=A.newRun({cash:0,lv:{root:1,s_hp:1,s_arm:1,w_masse:1},layout:{},mode:'out'},1,3);const p=S.p;
 const o=A.PANELS.find(o=>o.lv===1&&o.tier==='milieu'&&o.ax==='x'&&o.x0>-6&&o.x1<-3);p.x=(o.x0+o.x1)/2;p.z=(o.z0+o.z1)/2+1.1;p.y=A.LVY(1);S.plv=1;p.yaw=0;p.pitch=0;
 let sw=0;for(let k=0;k<200&&!o.dead;k++){if(A.useMasse(S))sw++;A.step(S,.05,{...inp,yaw:0,pitch:0});}T('masse à hauteur d\'yeux : casse le milieu, pas le bas',o.dead&&!A.PANELS.find(q=>q.lv===1&&q.tier==='bas'&&q.x0===o.x0&&q.z0===o.z0).dead,sw+' coups');
 // zombie devant
 const S2=A.newRun({cash:0,lv:{root:1,s_hp:1,s_arm:1,w_masse:1},layout:{},mode:'out'},1,4);S2.god=true;const q=S2.p;q.x=0;q.z=-5.6;q.y=A.LVY(5);S2.plv=5;q.yaw=0;q.pitch=0;
 A.startDay(S2);let i=-1;for(let k=0;k<50&&i<0;k++){A.spawnOne(S2);}const Z=S2.z;for(let k=0;k<S2.nAct;k++){const j=S2.act[k];if(i<0){i=j;}else Z.st[j]=0;}
 Z.st[i]=3;Z.lv[i]=5;Z.x[i]=0;Z.z[i]=-6.8;Z.y[i]=A.LVY(5);Z.ty[i]=0;Z.hp[i]=40;const k0=S2.kills;A.useMasse(S2);for(let k=0;k<20;k++)A.step(S2,.05,{...inp,yaw:0,pitch:0});
 T('masse : tue un rôdeur devant',S2.kills>k0,'kills '+(S2.kills-k0));
 const S3=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,3);T('masse verrouillée sans le nœud',!A.useMasse(S3));}
// 4. planches et arrachage
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},6,5);S.god=true;const p=S.p;const D=A.DOORS.find(d=>d.kind==='piece'&&d.lv===2);
 p.y=A.LVY(2);S.plv=2;p.x=D.cx+(D.ax==='x'?0:1.6);p.z=D.cz+(D.ax==='x'?1.6:0);p.pitch=-.2;p.yaw=Math.atan2(-(D.cx-p.x),-(D.cz-p.z));
 const id=A.doorPick(S);T('doorPick trouve la porte regardée',id===D.id,id+' / '+D.id);
 for(let k=0;k<200;k++)A.plankStep(S,.05,id);T('5 planches max',D.planks===5,D.planks);
 const SD=A.STDOOR[1].up;SD.planks=5;S.save.cash=0;
 // escalier barricadé au 1er : les envahisseurs doivent arracher
 A.startDay(S);let t=0,torn=0;for(;t<120;t+=.05){A.step(S,.05,inp);torn+=S.ev.filter(e=>e.k==='tear').length;S.ev.length=0;if(SD.planks===0)break;}
 T('les envahisseurs arrachent les planches de l\'escalier',SD.planks<5,'reste '+SD.planks+' après '+t.toFixed(0)+' s, '+torn+' planches arrachées');
 const pay0=S.save.cash;SD.planks;const id2=SD.id;p.x=SD.cx;p.z=SD.cz-1.5;p.y=A.LVY(1);S.plv=1;for(let k=0;k<12;k++)A.plankStep(S,.05,id2);T('replanter une planche arrachée rapporte',S.save.cash>pay0,(S.save.cash-pay0)+' $');}
// 5. explosions : dedans ça casse, dehors ça ne traverse pas la façade
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,3);vm.runInContext('this.boom_=boom;',c);
 const o=A.PANELS.find(o=>o.lv===2&&o.tier==='bas'&&o.ax==='x'&&A.WALK[2][A.cellI((o.x0+o.x1)/2,(o.z0+o.z1)/2-1)]);c.boom_(S,(o.x0+o.x1)/2,o.y0+1,(o.z0+o.z1)/2-1,6.5,160,'p','M');
 const dead=A.PANELS.filter(q=>q.dead).length;T('missile dans un étage : des cloisons cassent',o.dead&&dead>=2,dead+' panneaux');
 const S2=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},1,3);vm.runInContext('this.B_=B;',c);c.boom_(S2,c.B_+.4,A.LVY(2)+.3,1.3,2,160,'p','M');   // collée au pilier, dehors : la cloison juste derrière ne prend rien
 T('missile contre la façade : rien dedans',A.PANELS.every(q=>q.hp===q.hp0),A.PANELS.filter(q=>q.hp<q.hp0).length+' panneaux touchés');}
// 6. le joueur enfermé dans une pièce barricadée du 1er : ils arrachent les planches de la porte de la pièce
{const S=A.newRun({cash:0,lv:{root:1},layout:{},mode:'out'},6,8);S.god=true;const r=A.ROOMS.find(r=>r.lv===1);const p=S.p;p.x=(r.x0+r.x1)/2;p.z=(r.z0+r.z1)/2;p.y=A.LVY(1);S.plv=1;
 for(const D of A.DOORS)if(D.lv===1&&D.kind==='piece')D.planks=5;vm.runInContext('for(let lv=0;lv<=NLV;lv++)navRebuild(lv);',c);A.startDay(S);
 const kinds={};let t=0;for(;t<150;t+=.05){A.step(S,.05,{f:0,r:0,yaw:0,pitch:0});for(const e of S.ev)if(e.k==='tear'){const k=A.DOORS[e.door].kind;kinds[k]=(kinds[k]||0)+1;}S.ev.length=0;p.x=(r.x0+r.x1)/2;p.z=(r.z0+r.z1)/2;}
 T('pièce barricadée : planches de porte arrachées',(kinds.piece||0)>0,JSON.stringify(kinds));}
console.log(ok+' OK, '+ko+' ratés');
