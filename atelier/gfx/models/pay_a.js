// DÉCORS DE PAYSAGE — thèmes CÉLESTE (cel) et PIRATE (pir) du lobby « Île céleste ».
// Pour chaque thème t : pay.<t>.arbre (v = 0,1,2) · pay.<t>.roc (v = 0,1,2) · pay.<t>.sol (v = 0,1,2) · pay.<t>.grotte · pay.<t>.monument · pay.<t>.flot (v = 0,1)
// Céleste : marbre veiné d'or, bleu nuit, cerisiers lumineux, cristaux clairs, runes.   Pirate : falaise ocre, palmiers, épaves, crâne, phare.
{
const {PAL,TAU}=K,PI=Math.PI,mix=K.mix,shade=K.shade,sin=Math.sin,cos=Math.cos;
// ---------------------------------------------------------------- nuances
const MARB=0xe9e4d8,MARBD=0xb9b2a8,MARBL=0xfbf8f0,NUIT=0x2c3a78,NUITD=0x1c2553,NUITL=0x4a5aa8,OR=PAL.gold,ORD=PAL.goldD,ORL=0xffe9a0;
const ROSE=0xf08fb8,ROSED=0xc45f8f,ROSEL=0xffd9ea,ROSEG=0xffb3d9,LUNE=0x8fd6ff,LUNEL=0xe6f6ff,LUNED=0x3f7fd8,ECO=0x4a3540,ECOL=0x7b5c62;

// ---------------------------------------------------------------- aides locales
// maillage libre : F = polygones convexes [[p0,p1,…],…] en sens anti-horaire vus de dehors. o.dbl : visibles des deux côtés
const mesh=(F,o={})=>{const v=[];for(const f of F)for(const x of K.face(f,o).v)v.push(x);return{v,n:null};};
// peau tendue entre des anneaux de points, du bas vers le haut (anneaux tournant de +Z vers +X ; un anneau d'un seul point = pointe). o.open : bande non refermée · o.inv : faces tournées vers l'intérieur
const loft=(R,o={})=>{const F=[];for(let k=0;k<R.length-1;k++){const L=R[k],U=R[k+1],n=Math.max(L.length,U.length),m=o.open?n-1:n;for(let i=0;i<m;i++){const j=(i+1)%n;
      if(U.length===1)F.push([U[0],L[i],L[j]]);else if(L.length===1)F.push([U[i],L[0],U[j]]);else F.push([U[i],L[i],L[j]],[U[i],L[j],U[j]]);}}
  if(o.capT)F.push(R[R.length-1]);if(o.capB)F.push(R[0].slice().reverse());return mesh(o.inv?F.map(f=>f.slice().reverse()):F,o);};
const pol=(a,r,y)=>[sin(a)*r,y,cos(a)*r];                                     // point autour de l'axe Y (a = 0 → +Z)
// branche ou tronc : tube lissé le long d'un chemin
const limb=(b,P,R,seg,c,c2,n,o={})=>b.add(K.tube(n?K.curve(P,n):P,R,seg,{open:o.open!==false}),Object.assign({c,c2,jit:.09},o.add||{}));
// veine d'or : suit les arêtes d'une forme (rocher) sur n pas, dans la direction dir ; à poser avec la même transformation que la forme
const vein=(sh,seed,n,r,dir=[0,-1,0])=>{const v=sh.v,N=v.length/3,rnd=K.rng(seed),P=i=>[v[i*3],v[i*3+1],v[i*3+2]],eq=(a,c)=>Math.abs(a[0]-c[0])+Math.abs(a[1]-c[1])+Math.abs(a[2]-c[2])<1e-5;
  let cur=null,bs=-1e9;for(let k=0;k<8;k++){const c=P(Math.floor(rnd()*N)),s=-(c[0]*dir[0]+c[1]*dir[1]+c[2]*dir[2])+rnd()*.6;if(s>bs){bs=s;cur=c;}}
  const path=[cur];for(let k=0;k<n;k++){let best=null;bs=-1e9;for(let i=0;i<N;i++)if(eq(P(i),cur)){const t=i-i%3;for(let q=0;q<3;q++){const c=P(t+q);if(eq(c,cur)||path.some(p=>eq(p,c)))continue;
        const l=Math.hypot(c[0]-cur[0],c[1]-cur[1],c[2]-cur[2]),s=((c[0]-cur[0])*dir[0]+(c[1]-cur[1])*dir[1]+(c[2]-cur[2])*dir[2])/l+rnd()*.9;if(s>bs){bs=s;best=c;}}}
    if(!best)break;path.push(best);cur=best;}
  return K.tube(path.map(p=>[p[0]*1.012,p[1]*1.012,p[2]*1.012]),path.map((p,i)=>i===0||i===path.length-1?r*.35:r),3);};
// rocher de marbre veiné : forme K.rock + nv veines d'or le long de ses arêtes
const marbre=(b,r,seed,det,o,nv=0,vl=5,vr=.035)=>{const sh=K.rock(r,seed,det,o.rough===undefined?.24:o.rough),tr={p:o.p,r:o.r,s:o.s};b.add(sh,Object.assign({c:o.c||MARBD,c2:o.c2||MARBL,jit:.07},tr));
  for(let i=0;i<nv;i++)b.add(vein(sh,seed*7+i*13,vl,vr/(typeof o.s==='number'?o.s:1),[sin(i*2.4)*.7,-1,cos(i*2.4)*.7]),Object.assign({c:ORD,c2:OR,ch:'s',jit:0},tr));return sh;};
// rune : traits lumineux dans le plan XY, face à +Z (≈ 1 m de haut à s = 1)
const GLY=[[[0,-.5,0,.5],[0,.5,.32,.18],[0,.05,.32,-.27]],[[0,-.5,.3,0],[.3,0,0,.5],[0,.5,-.3,0],[-.3,0,0,-.5]],[[-.25,-.5,-.25,.5],[-.25,.5,.25,.1],[.25,.1,-.25,-.1]],
  [[0,-.5,0,.5],[-.3,.2,0,.5],[.3,.2,0,.5],[-.3,-.2,.3,-.2]],[[-.28,-.5,.28,.5],[.28,-.5,-.28,.5],[-.28,.5,.28,.5]]];
const glyph=(k,dbl,w=.1)=>{const F=[];for(const s of GLY[k%GLY.length]){const dx=s[2]-s[0],dy=s[3]-s[1],l=Math.hypot(dx,dy),px=-dy/l*w/2,py=dx/l*w/2;F.push([[s[0]+px,s[1]+py,0],[s[0]-px,s[1]-py,0],[s[2]-px,s[3]-py,0],[s[2]+px,s[3]+py,0]]);}return mesh(F,{dbl});};
const rune=(b,k,p,r,s,c=LUNE,dbl)=>b.add(glyph(k,dbl),{p,r,s,c,c2:LUNEL,ch:'g',jit:0});
// cristal clair : fût à cinq pans et pointe ; g = lumineux
const cristal=(b,p,h,r,rot,g,c=LUNE)=>b.add(K.lathe([[r*.7,0],[r,h*.68],[0,h]],5),{p,r:rot,c:g?c:mix(c,0xffffff,.35),c2:0xffffff,ch:g?'g':'s',jit:.08});
// flamme (lumineuse) : deux langues

const R1=(b,g=.15,h=.6)=>({parts:[{name:'body',b}],bake:{ground:g,groundH:h}});

// ================================================================ ARBRES
// ---- Céleste 0 : cerisier sacré — tronc sombre et tors, nuages de fleurs roses, bourgeons lumineux, pétales au sol
const celArbre0=()=>{const b=K.make(7001);
  limb(b,[[0,-.15,0],[.32,1.1,.1],[-.22,2.2,-.1],[.2,3.2,.12]],[.56,.42,.34,.31,.28,.25],5,ECO,ECOL,5);
  for(const a of[.6,2.9,4.6])limb(b,[pol(a,.3,.55),pol(a+.2,.85,.1),pol(a+.5,1.35,-.05)],[.2,.13,0],4,ECO,ECOL,0);          // racines
  const M=[[-2.0,4.3,.4,1.5,11],[1.9,4.7,-.5,1.65,12],[.1,5.7,.2,1.85,13],[.6,4.1,1.9,1.3,14],[-.7,4.4,-1.8,1.35,15],[3.0,3.6,1.0,1.0,16],[-2.9,3.3,-.7,.95,17]];
  for(const q of[M[0],M[1],M[3],M[4]])limb(b,[[.2,3.0,.1],[q[0]*.5,3.6,q[2]*.5],[q[0]*.9,q[1]-.3,q[2]*.9]],[.22,.15,.08],4,ECO,ECOL,0);   // charpentières
  M.forEach((q,i)=>b.add(K.rock(q[3],q[4],0,.2),{p:[q[0],q[1],q[2]],r:[i,i*2,0],s:[1.2,.62,1.2],c:i%2?ROSE:mix(ROSE,ROSED,.5),c2:ROSEL,jit:.1}));   // nuages de fleurs
  // fleurs lumineuses : éclats semés à la surface des nuages
  {const F=[];for(let i=0;i<29;i++){const q=M[i%7],a=b.rnd()*TAU,u=b.rnd()*1.5-.5,h=Math.sqrt(1-u*u*.6),r=q[3]*1.02,x=q[0]+sin(a)*h*r*1.2,y=q[1]+u*r*.62,z=q[2]+cos(a)*h*r*1.2,w=.11+b.rnd()*.08;
      F.push([[x+cos(a)*w,y,z-sin(a)*w],[x-cos(a)*w,y,z+sin(a)*w],[x+sin(a)*w*.5,y+w*1.5,z+cos(a)*w*.5]]);}
    b.add(mesh(F,{dbl:true}),{c:ROSEG,c2:0xffffff,ch:'g',jit:.08});}
  return R1(b);};
// ---- Céleste 1 : arbre aux feuilles d'or — fût clair élancé, plateaux de feuillage doré en étages, gouttes de lumière
const celArbre1=()=>{const b=K.make(7002),TR=0xcfc4b4,TRL=0xf5efe2;
  limb(b,[[0,-.15,0],[-.15,1.6,.1],[.2,3.4,-.05],[0,5.2,.1],[.1,7.2,0]],[.5,.36,.3,.25,.2,.14],5,TR,TRL,5);
  const M=[[-1.9,3.6,.4,1.5,21],[2.0,4.5,-.5,1.7,22],[-1.3,5.6,-1.2,1.45,23],[1.4,6.3,1.1,1.5,24],[-.3,7.5,.2,1.9,25],[.3,8.6,-.1,1.0,26]];
  M.slice(0,4).forEach(q=>limb(b,[[.1,q[1]-1.5,0],[q[0]*.55,q[1]-.9,q[2]*.55],[q[0],q[1]-.15,q[2]]],[.16,.11,.06],4,TR,TRL,0));
  M.forEach((q,i)=>b.add(K.rock(q[3],q[4],0,.16),{p:[q[0],q[1],q[2]],r:[0,i*1.7,0],s:[1.15,.36,1.15],c:0xd9a83a,c2:i%2?OR:ORL,ch:'s',jit:.1}));   // plateaux dorés
  M.slice(1,4).forEach((q,i)=>b.add(K.rock(q[3]*.6,q[4]+9,0,.2),{p:[q[0]+.2,q[1]+.32,q[2]-.1],s:[1,.4,1],c:OR,c2:ORL,ch:'s',jit:.1}));
  for(const q of[[-2.6,3.0,.9],[2.9,3.9,-.2],[-1.9,5.0,-1.9],[2.2,5.7,1.6],[.8,6.8,-.9],[-1.2,6.9,1.2]])b.add(K.oct(.15),{p:q,s:[1,1.7,1],c:ORL,c2:0xffffff,ch:'g',jit:0});   // gouttes de lumière
  return R1(b);};
// ---- Céleste 2 : saule bleu nuit — tronc noueux, dôme sombre, rideaux de lianes qui s'éclairent vers le bas
const celArbre2=()=>{const b=K.make(7003),F=[];
  limb(b,[[0,-.15,0],[-.3,1.0,.15],[.25,2.2,-.1],[0,3.5,0]],[.75,.55,.45,.4,.36,.3],6,0x2b2f52,0x59608f,5);
  for(const a of[1.2,3.4,5.3])limb(b,[pol(a,.4,.6),pol(a+.3,1.2,.05),pol(a+.5,1.8,-.05)],[.26,.15,0],4,0x2b2f52,0x59608f,0);
  b.add(K.rock(2.9,31,1,.14),{p:[0,4.9,0],s:[1.15,.62,1.15],c:NUIT,c2:0x6478c8,jit:.09});b.add(K.rock(1.5,32,0,.2),{p:[-.6,6.3,.4],s:[1.1,.6,1.1],c:NUIT,c2:0x6f84d8,jit:.09});
  // rideaux : longues lames effilées qui pendent du bord du dôme
  for(let i=0;i<46;i++){const a=i/46*TAU+b.rnd()*.1,r=2.2+b.rnd()*1.1,y=4.6-(r-2.2)*.5,l=2.2+b.rnd()*2.0,w=.16+b.rnd()*.1,p=pol(a,r,y),t=pol(a+.05,r+.25,Math.max(.25,y-l));
    F.push([[p[0]+cos(a)*w,p[1],p[2]-sin(a)*w],[p[0]-cos(a)*w,p[1],p[2]+sin(a)*w],t]);}
  b.add(mesh(F,{dbl:true}),{c:0x9ff0ff,c2:NUIT,ch:'g',jit:.1});
  for(let i=0;i<7;i++){const a=i*.9+.3;b.add(K.oct(.13),{p:pol(a,2.3+(i%3)*.4,1.1+(i%4)*.5),s:[1,1.6,1],c:0xcffaff,ch:'g',jit:0});}   // lucioles
  return R1(b);};
MODELS['pay.cel.arbre']=ctx=>[celArbre0,celArbre1,celArbre2][(+ctx.v||0)%3]();

// ================================================================ ROCHERS
// ---- Céleste : marbre veiné d'or, runes, cristaux clairs. 0 : bloc de 3 m · 1 : amas de 6 m avec stèle · 2 : aiguille de 12 m, anneau de runes en lévitation
const celRoc0=()=>{const b=K.make(7101);
  marbre(b,1.5,3,1,{p:[0,1.25,0],s:[1.15,1,.95],r:[0,.4,.1]},3,5,.04);
  marbre(b,.8,5,0,{p:[1.5,.5,.7],s:[1,.8,1],r:[0,1,0]});
  cristal(b,[-1.25,.1,.9],1.5,.26,[.25,0,.4],false);cristal(b,[-1.0,.1,1.25],.9,.18,[.5,0,.1],true);
  rune(b,0,[.35,1.5,1.42],[-.25,.25,0],.7);
  return R1(b);};
const celRoc1=()=>{const b=K.make(7102);
  marbre(b,2.9,7,1,{p:[-.6,2.65,-.3],s:[1,1.05,.9],r:[0,.7,.08]},3,6,.06);
  marbre(b,1.9,9,1,{p:[2.2,1.3,.6],s:[1,.9,1],r:[.1,2,0]},1,5,.05);
  marbre(b,1.2,11,0,{p:[-2.6,.7,1.6],s:[1.1,.8,1],r:[0,.5,0]});
  // stèle dressée devant le bloc : trois runes, coiffe d'or
  b.group({p:[.9,0,2.5],r:[-.08,.25,.03]},b=>{b.add(K.box(1.3,3.4,.5,.8,.8),{p:[0,1.7,0],c:MARBD,c2:MARBL});b.add(K.box(1.15,.14,.5),{p:[0,3.45,0],c:ORD,c2:OR,ch:'s'});
    for(let i=0;i<3;i++)rune(b,i+1,[0,.9+i*.85,.26-i*.02],[0,0,0],.6);});
  cristal(b,[-2.3,1.2,2.0],2.2,.34,[.3,0,.35],false);cristal(b,[-1.7,1.0,2.4],1.3,.24,[.6,0,-.1],true);cristal(b,[3.2,1.8,-.4],1.7,.3,[-.2,0,-.55],false);cristal(b,[-.4,4.6,-.2],1.5,.3,[0,0,.2],true);
  return R1(b);};
const celRoc2=()=>{const b=K.make(7103);
  marbre(b,2.4,13,1,{p:[0,2.15,0],s:[1.2,.95,1.15],r:[0,.3,0]},2,5,.08);
  marbre(b,2.0,15,1,{p:[.2,5.4,-.1],s:[.9,2.0,.85],r:[0,1.2,.06]},2,6,.08);
  marbre(b,1.5,17,1,{p:[.55,9.6,-.2],s:[.7,2.1,.66],r:[0,2.5,.1]},2,6,.08);
  marbre(b,1.3,19,0,{p:[-2.3,.8,1.2],s:[1,.9,1]});marbre(b,1.0,21,0,{p:[2.4,.6,-1.3],s:[1,.8,1],r:[0,1,0]});
  cristal(b,[.85,11.9,-.25],2.0,.32,[0,0,-.1],true);                                             // la pointe : un cristal lumineux
  // anneau d'or et ronde de runes en lévitation autour de l'aiguille, éclats suspendus
  b.add(K.torus(2.6,.07,3,16),{p:[.3,7.2,-.1],r:[PI/2+.14,0,.1],c:ORD,c2:OR,ch:'s',jit:0});
  for(let i=0;i<6;i++){const a=i*TAU/6;rune(b,i,[.3+sin(a)*3.0,7.25+sin(a+1)*.4,-.1+cos(a)*3.0],[0,a,0],.75,LUNE,true);}
  for(const q of[[2.0,10.0,1.2,.3],[-1.6,8.9,-1.0,.24],[1.3,4.2,2.3,.28]])b.add(K.oct(q[3]),{p:[q[0],q[1],q[2]],s:[1,1.6,1],r:[.3,q[0],.2],c:MARB,c2:MARBL,jit:.08});
  cristal(b,[-2.2,.3,-1.4],2.0,.32,[-.3,0,.4],false);cristal(b,[2.5,.2,1.6],1.6,.28,[.35,0,-.4],false);cristal(b,[-1.2,.2,2.6],1.2,.22,[.5,0,.2],true);
  return R1(b);};
MODELS['pay.cel.roc']=ctx=>[celRoc0,celRoc1,celRoc2][(+ctx.v||0)%3]();

// ================================================================ DÉTAILS DE SOL
// ---- Céleste : 0 clochettes lumineuses · 1 lanterne de pierre · 2 touffe d'herbe de lune et éclats de cristal
const celSol0=()=>{const b=K.make(7201),F=[];
  [[0,0,.95,0],[.28,.1,.7,1.3],[-.25,.18,.6,2.9],[.05,-.3,.5,4.4]].forEach((q,i)=>{const a=q[3],tx=q[0]+sin(a)*.28,tz=q[1]+cos(a)*.28;
    b.add(K.tube(K.curve([[q[0],-.03,q[1]],[q[0]+sin(a)*.05,q[2]*.7,q[1]+cos(a)*.05],[tx,q[2],tz]],2),[.035,.03,.02],3,{open:true}),{c:0x3f8a6a,c2:0x9fe0b8,jit:.06});
    b.add(K.cone(.13,.26,5),{p:[tx+sin(a)*.03,q[2]-.1,tz+cos(a)*.03],r:[.5*cos(a),0,-.5*sin(a)],c:i%2?ROSEG:LUNE,c2:0xffffff,ch:'g',jit:0});                   // clochette
    for(const k of[-1,1]){const l=a+k*1.3;F.push([[q[0],0,q[1]],[q[0]+sin(l)*.3+cos(l)*.08,.22,q[1]+cos(l)*.3-sin(l)*.08],[q[0]+sin(l)*.42,.1,q[1]+cos(l)*.42]]);}});
  b.add(mesh(F,{dbl:true}),{c:0x2f7a5e,c2:0x7fd6a6,jit:.1});
  return R1(b,.1,.3);};
const celSol1=()=>{const b=K.make(7202);
  b.add(K.box(.7,.16,.7,.85,.85),{p:[0,.08,0],c:MARBD,c2:MARB});b.add(K.cyl(.13,.17,.6,6,{open:true}),{p:[0,.46,0],c:MARBD,c2:MARBL});
  b.add(K.box(.62,.1,.62),{p:[0,.8,0],c:MARB,c2:MARBL});
  b.add(K.box(.34,.34,.34),{p:[0,1.02,0],c:0xffd98a,c2:0xfff4c8,ch:'g',jit:0});                                                    // la flamme, derrière ses montants
  for(const sx of[-1,1])for(const sz of[-1,1])b.add(K.box(.08,.36,.08),{p:[sx*.2,1.03,sz*.2],c:MARBD,c2:MARB});
  b.add(K.box(.86,.3,.86,0,0),{p:[0,1.36,0],c:NUIT,c2:NUITL});b.add(K.box(.9,.05,.9),{p:[0,1.215,0],c:ORD,c2:OR,ch:'s'});
  return R1(b,.1,.3);};
const celSol2=()=>{const b=K.make(7203),F=[];
  for(let i=0;i<16;i++){const a=i/16*TAU+b.rnd()*.3,h=.45+b.rnd()*.6,l=h*(.2+b.rnd()*.5),w=.05,r0=.05+b.rnd()*.2,sx=sin(a),cx=cos(a);
    F.push([[sx*r0+cx*w,-.02,cx*r0-sx*w],[sx*r0-cx*w,-.02,cx*r0+sx*w],[sx*(r0+l),h,cx*(r0+l)]]);}
  b.add(mesh(F,{dbl:true}),{c:NUITL,c2:0xbfe9ff,jit:.12});
  cristal(b,[.3,-.02,.1],.6,.1,[.2,0,-.35],true);cristal(b,[-.25,-.02,.25],.42,.08,[.4,0,.4],true);cristal(b,[.02,-.02,-.3],.5,.09,[-.4,0,.1],false);
  for(const q of[[.4,.75,.3],[-.3,.9,-.1],[.1,1.15,.15]])b.add(K.oct(.045),{p:q,c:0xeafcff,ch:'g',jit:0});                          // poussières de lune
  return R1(b,.1,.3);};
MODELS['pay.cel.sol']=ctx=>[celSol0,celSol1,celSol2][(+ctx.v||0)%3]();
// ================================================================ GROTTES (ouverture vers +Z, adossées à une paroi côté −Z)
// anneau en arche dans un plan z = cste : n+1 points de gauche à droite en passant par le haut ; f(u) → [x,y] ; bruit : relief
const arche=(f,n,z,sx=1,sy=1,bruit=0,seed=1)=>{const R=[];for(let i=0;i<=n;i++){const q=f(i/n),k=1+bruit*K.hash3(i,Math.round(z*10),7,seed);R.push([q[0]*sx*k,q[1]*sy*(i&&i<n?k:1),z+(i&&i<n?bruit*2*K.hash3(i,3,Math.round(z*10),seed):0)]);}return R;};
// boyau sombre : anneaux du fond vers l'entrée, faces tournées vers l'intérieur, lumineux (non éclairé) → dégradé du noir (fond) à c2 (entrée), sol compris
const boyau=(b,R,c,c2)=>b.add(loft(R.map(r=>r.map(q=>[q[0],q[2],-q[1]])),{capB:true}),{r:[PI/2,0,0],c,c2,ch:'g',jit:.05});
// ---- Céleste : la porte lunaire — anneau de marbre aux runes dans un éperon d'ardoise, cristaux, lune de cristal qui tourne dans la lueur bleue
MODELS['pay.cel.grotte']=ctx=>{const b=K.make(7301),lu=K.make(7302),CY=2.6,RG=2.2,T0=2.614,N=14,AR=0x4a4763,ARL=0x9a94ad;
  const fi=u=>{const t=-T0+2*T0*u;return[sin(t)*RG,CY+cos(t)*RG];},fo=u=>{const a=PI*(1-u);return[cos(a)*5.0,Math.pow(sin(a),.7)*6.5];};
  // intérieur : boyau qui se resserre vers le fond, presque noir
  const I=[arche(fi,N,-3.6,.55),arche(fi,N,-1.6,1.1),arche(fi,N,1.2,1.15),arche(fi,N,2.6)];boyau(b,I,0x020308,0x151c3c);
  // éperon d'ardoise bleutée qui enveloppe la porte, et sa façade
  const O=[arche(fo,N,-4.0,.8,.82,.05,3),arche(fo,N,-1.2,1,1,.07,4),arche(fo,N,1.6,.96,.98,.07,5),arche(fo,N,2.7,.8,.93,.03,6)];
  b.add(loft(O,{inv:true,open:true}),{c:AR,c2:ARL,jit:.1});b.add(mesh([O[0]]),{c:AR,c2:ARL});b.add(loft([I[3],O[3]],{open:true}),{c:AR,c2:ARL,jit:.08});
  // l'anneau : claveaux de marbre, une rune sur deux, filet d'or au bord intérieur
  for(let i=0;i<16;i++){const t=-T0+(i+.5)/16*2*T0,x=sin(t)*2.62,y=CY+cos(t)*2.62;
    b.add(K.box(1.2,.84,.9+(i%2)*.12,.72,1),{p:[x,y,2.9],r:[0,0,PI-t],c:i%2?MARB:MARBL,c2:i%2?MARBD:MARB,jit:.05});
    if(i%2===0&&i>0&&i<15)rune(b,i/2,[sin(t)*2.66,CY+cos(t)*2.66,3.37],[0,0,-t],.46);}
  b.add(K.torus(RG+.02,.08,3,22,2*T0),{p:[0,CY,3.38],r:[0,0,PI/2-T0],c:ORD,c2:OR,ch:'s',jit:0});
  b.add(K.torus(3.06,.06,3,22,2*T0),{p:[0,CY,3.3],r:[0,0,PI/2-T0],c:ORD,c2:OR,ch:'s',jit:0});
  b.add(K.oct(.3),{p:[0,CY+3.2,3.3],s:[1,1.5,.7],c:LUNE,c2:0xffffff,ch:'g',jit:0});                 // gemme de clef
  // marches et seuil
  b.add(K.box(3.6,.36,1.5),{p:[0,.18,3.5],c:MARBD,c2:MARB});b.add(K.box(2.7,.36,1.1),{p:[0,.54,3.2],c:MARBD,c2:MARBL});b.add(K.box(2.3,.06,.5),{p:[0,.73,3.1],c:NUIT,c2:NUITL});
  // voile de lueur bleue dans l'ouverture, cristaux lumineux le long du boyau
  b.add(mesh([Array.from({length:12},(_,i)=>[sin(-i*TAU/12)*2.3,CY+cos(i*TAU/12)*2.3,1.6])],{dbl:true}),{c:0x02060f,c2:0x07183a,ch:'x',jit:0});
  for(const q of[[-1.9,.9,.6,1.3,-.5],[2.0,.9,-.4,1.6,.5],[-1.4,.8,-1.6,1.0,-.3],[1.2,.8,-2.2,1.2,.35]])cristal(b,[q[0],q[1],q[2]],q[3],.2,[0,0,q[4]],true);
  // blocs de marbre veiné au pied, grappes de cristaux, arbre d'or sur l'épaule
  marbre(b,1.7,31,1,{p:[-4.4,1.2,2.6],s:[1,1,.9],r:[0,.4,0]},2,5,.06);marbre(b,1.4,33,1,{p:[4.5,.95,2.4],s:[1.1,.9,1],r:[0,2,0]},2,5,.06);marbre(b,.8,35,0,{p:[3.2,.5,3.9],s:[1,.8,1]});
  for(const q of[[-3.5,2.2,3.0,2.6,.36,.45],[-4.0,2.3,2.4,1.7,.28,.8],[-2.9,1.6,3.5,1.3,.22,.2],[3.7,1.9,2.9,2.2,.32,-.5],[4.4,1.8,2.3,1.4,.24,-.85],[-1.6,6.0,1.4,1.9,.3,.25],[-2.3,5.5,1.6,1.2,.22,.6],[2.9,5.0,1.5,1.5,.26,-.5]])
    cristal(b,[q[0],q[1],q[2]],q[3],q[4],[.15,0,q[5]],q[4]<.27);
  limb(b,[[1.6,5.8,.4],[1.9,6.5,.5],[1.5,7.2,.3]],[.2,.14,.08],4,0xcfc4b4,0xf5efe2,0);
  for(const q of[[2.4,6.8,.7,1.1,41],[.9,7.4,.2,1.2,42],[1.9,7.95,.1,.7,43]])b.add(K.rock(q[3],q[4],0,.16),{p:[q[0],q[1],q[2]],s:[1.15,.36,1.15],c:0xd9a83a,c2:ORL,ch:'s',jit:.1});
  // la lune de cristal (pièce animée) : croissant, étoile et halo, en lévitation au cœur de la grotte
  lu.add(K.torus(.85,.2,4,9,PI*1.15),{p:[0,2.7,-.9],r:[0,0,PI*.42],c:LUNE,c2:0xffffff,ch:'g',jit:.04});lu.add(K.oct(.24),{p:[.45,3.0,-.9],s:[1,1.5,1],c:0xffffff,ch:'g',jit:0});
  lu.add(K.ico(1.5,0),{p:[0,2.7,-.9],c:0x071a40,ch:'x',jit:0});
  return{parts:[{name:'body',b},{name:'lune',b:lu,parent:'body',pivot:[0,2.7,-.9],anim:[{k:'rot',axis:'y',spin:true,sp:.6},{k:'pos',axis:'y',amp:.18,sp:1.2}]}],bake:{ground:.15,groundH:.6}};};
// ================================================================ MONUMENTS
// ---- Céleste : l'Arche des Géants — deux piliers colossaux, arche brisée dont les claveaux manquants flottent encore, astre d'or et ses anneaux en lévitation
MODELS['pay.cel.monument']=ctx=>{const b=K.make(7401),as=K.make(7402),an=K.make(7403),fl=K.make(7404),PX=5.1,HA=19.5,RA=PX,CA=[0,15.2,0];
  // parvis : dalle ronde à deux degrés, cercle de runes au sol, colonne de lumière qui monte vers l'astre
  b.add(K.cyl(7.4,7.7,.4,18),{p:[0,.2,0],s:[1,1,.66],c:MARBD,c2:MARB,jit:.05});b.add(K.cyl(3.4,3.6,.35,14),{p:[0,.57,0],c:NUITD,c2:NUIT});
  b.add(K.torus(2.7,.1,3,18),{p:[0,.77,0],r:[PI/2,0,0],c:LUNE,ch:'g',jit:0});b.add(K.torus(3.42,.07,3,18),{p:[0,.76,0],r:[PI/2,0,0],c:ORD,c2:OR,ch:'s',jit:0});
  for(let i=0;i<6;i++){const a=i*TAU/6+.3;rune(b,i,[sin(a)*1.9,.77,cos(a)*1.9],[-PI/2,0,-a],.8);}
  b.add(K.cyl(.5,1.1,CA[1]-2.6,8,{open:true}),{p:[0,(CA[1]-1)/2+.3,0],c:0x0b2a55,c2:0x020812,ch:'x',jit:0});
  for(const q of[[3.0,.3,1.2],[2.4,.6,1.0]])b.add(K.box(q[0],.3,q[2]),{p:[0,q[1]-.15,4.6-q[1]],c:MARBD,c2:MARB});   // marches
  // piliers : socle bleu nuit, cinq tambours de marbre cerclés d'or, runes géantes sur les deux faces, chapiteau
  b.sym(sd=>b.group({p:[sd*PX,0,0]},b=>{b.add(K.box(4.2,.8,4.2,.92,.92),{p:[0,.4,0],c:NUITD,c2:NUIT});b.add(K.box(3.6,.6,3.6,.9,.9),{p:[0,1.1,0],c:MARBD,c2:MARB});
    for(let k=0;k<5;k++){const y=1.4+k*3.44,r=1.62-k*.07;b.add(K.cyl(r-.07,r,3.44,10,{open:true,a0:k*.3}),{p:[0,y+1.72,0],c:k%2?MARB:MARBD,c2:k%2?MARBL:MARB,jit:.06});
      b.add(K.cyl(r+.1,r+.1,.3,10,{open:true,a0:k*.3}),{p:[0,y+.1,0],c:ORD,c2:OR,ch:'s',jit:.03});
      if(k<4)for(const f of[1,-1])rune(b,k+(sd>0?0:2)+(f>0?0:1),[0,y+1.8,f*(r+.03)],[0,f>0?0:PI,0],1.7);}
    b.add(K.box(3.9,.7,3.9,1,1),{p:[0,HA-.55,0],c:MARB,c2:MARBL});b.add(K.box(3.3,.5,3.3,1.18,1.18),{p:[0,HA-1.15,0],c:MARBD,c2:MARB});b.add(K.box(4.0,.14,4.0),{p:[0,HA-.13,0],c:ORD,c2:OR,ch:'s'});
    // cristaux au pied, veinures d'or du socle
    for(const q of[[sd*1.5,.3,2.2,2.8,.42,-sd*.25],[sd*.6,.3,2.6,1.6,.28,-sd*.05],[sd*1.6,.3,-2.1,2.2,.36,-sd*.3],[-sd*1.6,.6,2.4,1.3,.24,sd*.3]])cristal(b,[q[0],q[1],q[2]],q[3],q[4],[.2*Math.sign(q[2]),0,q[5]],q[4]<.3);}));
  // l'arche : claveaux encore en place (six à gauche, deux à droite), clef d'or ; le reste est tombé… ou flotte
  const clav=(B,f,o={})=>B.add(K.box(2.25,1.7,2.6,.78,1),{p:[cos(f)*RA+(o.dx||0),HA+sin(f)*RA+(o.dy||0),o.dz||0],r:[o.rx||0,o.ry||0,f+PI/2+(o.rz||0)],c:o.c||MARBD,c2:o.c2||MARB,jit:.06});
  for(let i=0;i<6;i++){const f=PI-(i+.5)*.245;clav(b,f,{c:i%2?MARB:MARBD,c2:i%2?MARBL:MARB});if(i%2===0)b.add(K.box(.5,1.74,2.7),{p:[cos(f)*RA,HA+sin(f)*RA,0],r:[0,0,f+PI/2],c:NUIT,c2:NUITL});}
  for(let i=0;i<2;i++){const f=(i+.5)*.245;clav(b,f,{c:i%2?MARB:MARBD,c2:i%2?MARBL:MARB});}
  b.add(K.box(1.2,2.1,2.8,.7,1),{p:[cos(1.725)*RA,HA+sin(1.725)*RA+.05,0],r:[0,0,1.725+PI/2],c:ORD,c2:OR,ch:'s'});                   // clef d'or, au bord de la cassure
  b.add(K.box(2.0,1.5,2.3),{p:[4.4,1.05,5.0],r:[.2,.7,.25],c:MARBD,c2:MARB});b.add(K.cyl(1.4,1.4,2.2,10),{p:[-3.9,1.3,-4.6],r:[PI/2,.5,0],c:MARBD,c2:MARBL});   // claveau et tambour tombés
  // claveaux en lévitation (pièce animée) : ils dessinent encore la courbe, un peu dispersés
  [[.62,.5,.4,.3,.2,.25],[.9,.9,.9,-.5,-.3,.5],[1.17,.3,1.3,.6,.25,-.3],[1.43,-.2,.6,-.4,.4,.2]].forEach((q,i)=>clav(fl,q[0],{dx:q[1],dy:q[2],dz:q[3],rx:q[4],rz:q[5],c:i%2?MARB:MARBD,c2:MARBL}));
  for(const q of[[2.2,HA+6.6,1.4,.4],[4.6,HA+5.4,-1.2,.3],[.8,HA+7.0,-.9,.34],[3.4,HA+2.6,1.6,.26],[5.6,HA+3.4,.9,.22]])fl.add(K.oct(q[3]),{p:[q[0],q[1],q[2]],s:[1,1.4,1],r:[.4,q[0],.3],c:MARB,c2:MARBL,jit:.08});
  // l'astre (pièce animée) : cœur d'or blanc hérissé de rayons, halo ; anneau intérieur solidaire
  as.add(K.ico(1.25,1),{p:CA,c:0xffd46a,c2:0xfffbe0,ch:'g',jit:.06});as.add(K.ico(2.3,1),{p:CA,c:0x4a3408,ch:'x',jit:0});
  for(let i=0;i<8;i++){const a=i*TAU/8,l=i%2?1.3:2.1;as.add(K.cone(.3,l,4),{p:[CA[0]+sin(a)*(1.1+l/2),CA[1],CA[2]+cos(a)*(1.1+l/2)],r:[PI/2*cos(a),0,-PI/2*sin(a)],c:OR,c2:0xfffbe0,ch:'g',jit:0});}
  for(const sy of[1,-1])as.add(K.cone(.34,2.4,4),{p:[CA[0],CA[1]+sy*2.2,CA[2]],r:[sy>0?0:PI,0,0],c:OR,c2:0xfffbe0,ch:'g',jit:0});
  as.add(K.torus(3.0,.13,4,26),{p:CA,r:[PI/2-.5,0,0],c:ORD,c2:OR,ch:'s',jit:.03});for(let i=0;i<6;i++){const a=i*TAU/6;cristal(as,[CA[0]+cos(a)*3.0,CA[1]+sin(a)*3.0*cos(PI/2-.5)-.5,CA[2]-sin(a)*3.0*sin(PI/2-.5)],1.0,.2,[0,0,0],true,i%2?LUNE:ROSEG);}
  // grand anneau extérieur gravé de runes (pièce animée), il bascule autour de l'astre
  an.add(K.torus(3.9,.16,4,30),{p:CA,c:ORD,c2:OR,ch:'s',jit:.03});
  for(let i=0;i<10;i++){const a=i*TAU/10;if(i%2)an.add(K.oct(.3),{p:[CA[0]+cos(a)*3.9,CA[1]+sin(a)*3.9,CA[2]],s:[1,1,1.6],c:ROSEG,c2:0xffffff,ch:'g',jit:0});else rune(an,i/2,[CA[0]+cos(a)*4.45,CA[1]+sin(a)*4.45,CA[2]],[0,0,a-PI/2],.8,LUNE,true);}
  return{parts:[{name:'body',b},
    {name:'astre',b:as,parent:'body',pivot:CA,anim:[{k:'rot',axis:'y',spin:true,sp:.5},{k:'pos',axis:'y',amp:.35,sp:.9}]},
    {name:'anneau',b:an,parent:'body',pivot:CA,anim:[{k:'rot',axis:'x',spin:true,sp:.38},{k:'rot',axis:'y',spin:true,sp:-.23}]},
    {name:'blocs',b:fl,parent:'body',pivot:[2.5,HA+4,0],anim:[{k:'pos',axis:'y',amp:.4,sp:.7},{k:'rot',axis:'z',amp:.04,sp:.5}]}],bake:{ground:.15,groundH:.8}};};
// ================================================================ ROCHERS FLOTTANTS (le dessus est à y = 0, la roche pend dessous)
// ---- Céleste 0 : l'îlot au cerisier — colonnes brisées, stèle runique, cristaux qui pendent · 1 : la cascade figée — bassin, chute de glace claire, arche de lune
const celFlot=v=>{const b=K.make(7501+v),R=v?2.7:3.1,AR=0x4a4763,ARL=0x9a94ad;
  b.add(K.cyl(R,R*.9,.5,10),{p:[0,-.25,0],c:0x5f8f86,c2:0xa6d6b4,jit:.06});
  b.add(K.lathe([[0,-R*1.4],[R*.3,-R*.8],[R*.7,-R*.3],[R*.93,-.45]],9),{c:AR,c2:ARL,jit:.09});
  for(let i=0;i<3;i++){const a=i*2.1+v;b.add(K.rock(R*.3,90+i+v*5,0,.25),{p:[sin(a)*R*.5,-R*(.42+i*.1),cos(a)*R*.5],c:AR,c2:ARL,jit:.08});
    cristal(b,[sin(a+1)*R*.62,-R*.42,cos(a+1)*R*.62],1.3+i*.4,.2,[PI+.15*cos(a),0,.15*sin(a)],i<2);}   // cristaux pendants
  if(!v){
    // cerisier
    limb(b,[[-.6,-.1,-.2],[-.4,.9,-.1],[-.8,1.7,.1],[-.5,2.4,0]],[.3,.22,.18,.14],5,ECO,ECOL,0);
    const M=[[-1.5,2.8,.2,1.0,11],[.2,3.1,-.4,1.15,12],[-.6,3.7,.3,1.0,13],[-.7,2.6,1.1,.8,14]],F=[];
    M.forEach((q,i)=>b.add(K.rock(q[3],q[4],0,.2),{p:[q[0],q[1],q[2]],r:[i,i*2,0],s:[1.2,.62,1.2],c:i%2?ROSE:mix(ROSE,ROSED,.5),c2:ROSEL,jit:.1}));
    for(let i=0;i<14;i++){const q=M[i%4],a=b.rnd()*TAU,u=b.rnd()*1.4-.4,h=Math.sqrt(1-u*u*.6),r=q[3]*1.02,x=q[0]+sin(a)*h*r*1.2,y=q[1]+u*r*.62,z=q[2]+cos(a)*h*r*1.2,w=.1+b.rnd()*.07;
      F.push([[x+cos(a)*w,y,z-sin(a)*w],[x-cos(a)*w,y,z+sin(a)*w],[x+sin(a)*w*.5,y+w*1.5,z+cos(a)*w*.5]]);}
    b.add(mesh(F,{dbl:true}),{c:ROSEG,c2:0xffffff,ch:'g',jit:.08});
    // colonnes brisées, tambour tombé, stèle aux runes
    for(const q of[[1.5,-.9,2.6],[2.0,.5,1.3]]){b.add(K.cyl(.3,.34,q[2],7,{open:true}),{p:[q[0],q[2]/2,q[1]],c:MARBD,c2:MARBL});b.add(K.cyl(.3,.24,.2,7),{p:[q[0],q[2]+.08,q[1]],r:[.25,0,.2],c:MARB});b.add(K.box(.9,.2,.9),{p:[q[0],.1,q[1]],c:MARBD,c2:MARB});}
    b.add(K.cyl(.3,.3,.8,7),{p:[.6,.3,1.9],r:[PI/2,.6,0],c:MARBD,c2:MARBL});
    b.add(K.torus(.42,.05,3,8),{p:[1.5,2.0,-.9],r:[PI/2,0,0],c:ORD,c2:OR,ch:'s',jit:0});
    b.group({p:[-1.7,0,-1.4],r:[-.06,.9,.05]},b=>{b.add(K.box(.8,1.7,.3,.75,.8),{p:[0,.85,0],c:MARBD,c2:MARBL});rune(b,1,[0,1.15,.16],[0,0,0],.45);rune(b,3,[0,.55,.17],[0,0,0],.45);});
  }else{
    // bassin et cascade figée qui tombe dans le vide, givre lumineux
    b.add(K.cyl(1.35,1.35,.08,8),{p:[.2,.03,.5],c:LUNED,c2:LUNE,ch:'s',jit:.05});
    {const P=[[.2,.08,1.5,.7],[.2,.05,2.55,.75],[.2,-.8,2.95,.7],[.2,-2.6,3.05,.55],[.2,-4.3,3.0,.3]],F=[];
      for(let i=0;i<4;i++){const a=P[i],c=P[i+1];F.push([[a[0]-a[3],a[1],a[2]],[c[0]-c[3],c[1],c[2]],[c[0]+c[3],c[1],c[2]],[a[0]+a[3],a[1],a[2]]]);}
      b.add(mesh(F,{dbl:true}),{c:0xffffff,c2:LUNE,ch:'s',jit:.08});
      b.add(mesh(F.slice(1).map(f=>[[f[0][0]+.3,f[0][1],f[0][2]+.04],[f[1][0]+.25,f[1][1],f[1][2]+.04],[f[1][0]+.42,f[1][1],f[1][2]+.04],[f[0][0]+.5,f[0][1],f[0][2]+.04]]),{dbl:true}),{c:0xffffff,c2:LUNEL,ch:'g',jit:0});}
    for(const q of[[-.2,-4.1,2.95,1.0,.3],[.5,-4.3,3.0,1.3,-.2],[.2,-4.0,3.2,.8,0]])cristal(b,[q[0],q[1],q[2]],q[3],.16,[PI,0,q[4]],true);     // stalactites au bout de la chute
    // arche de lune en marbre, gemme, cristaux, arbrisseau d'or
    b.add(K.torus(1.15,.2,4,10),{p:[-.5,1.25,-.9],r:[0,.5,0],c:MARBD,c2:MARBL,jit:.06});b.add(K.torus(.93,.05,3,10),{p:[-.5,1.25,-.9],r:[0,.5,0],c:ORD,c2:OR,ch:'s',jit:0});
    b.add(K.oct(.26),{p:[-.5,1.3,-.9],s:[1,1.5,1],c:LUNE,c2:0xffffff,ch:'g',jit:0});b.add(K.box(1.9,.2,.8),{p:[-.5,.1,-.9],r:[0,.5,0],c:MARBD,c2:MARB});
    cristal(b,[1.6,-.05,-1.0],1.9,.3,[.1,0,-.3],false);cristal(b,[1.9,-.05,-.4],1.1,.2,[.3,0,-.5],true);cristal(b,[-2.0,-.05,.6],1.4,.24,[.1,0,.4],false);
    limb(b,[[-1.4,-.1,1.3],[-1.6,.9,1.4],[-1.3,1.8,1.3]],[.16,.11,.06],4,0xcfc4b4,0xf5efe2,0);
    for(const q of[[-1.8,1.7,1.6,.8,41],[-1.0,2.2,1.2,.9,42]])b.add(K.rock(q[3],q[4],0,.16),{p:[q[0],q[1],q[2]],s:[1.15,.36,1.15],c:0xd9a83a,c2:ORL,ch:'s',jit:.1});}
  return{parts:[{name:'body',b}],bake:{}};};
MODELS['pay.cel.flot']=ctx=>celFlot((+ctx.v||0)%2);
}
