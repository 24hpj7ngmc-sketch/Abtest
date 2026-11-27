// BESTIAIRE 2 — le Spectre (furtif), le Mage (tireur à distance) et les trois boss : la Brute, le Seigneur invocateur, le Titan des Cinq.
// Même structure que le lutin : pièces nommées, pivots, animation décrite par des données. Chaque créature montre son élément par sa forme.
{
const {PAL,EL,TAU}=K,PI=Math.PI,S=Math.sin,C=Math.cos;
// ---------------------------------------------------------------- aides locales
// anneau de n points : fn(angle, i) → [x,y,z]
const ring=(n,fn)=>{const o=[];for(let i=0;i<n;i++)o.push(fn(i/n*TAU,i));return o;};
// peau facettée tendue entre des anneaux de points (tissus, capuches, membres). Anneaux donnés le long de l'axe, points tournant de +Z vers +X (comme le kit) : faces vers l'extérieur.
// o.c : couleur, ou fonction (k,i) → couleur de l'anneau k (dégradé d'un anneau au suivant) · o.inv : faces vers l'intérieur (doublure) · o.cap0 / o.cap1 : ferme le début / la fin
const loft=(b,R,o={})=>{const n=R[0].length,col=typeof o.c==='function'?o.c:()=>o.c;
  for(let k=0;k<R.length-1;k++)for(let i=0;i<n;i++){const j=(i+1)%n,A=R[k+1][i],B=R[k][i],D=R[k][j],E=R[k+1][j],up=A[1]+E[1]>=B[1]+D[1];
    b.add(K.face(o.inv?[E,D,B,A]:[A,B,D,E]),{c:col(up?k:k+1,i),c2:col(up?k+1:k,i),ch:o.ch,jit:o.jit});}
  if(o.cap0)b.add(K.face(o.inv?R[0]:R[0].slice().reverse()),{c:col(0,0),ch:o.ch,jit:o.jit});
  if(o.cap1){const q=R[R.length-1];b.add(K.face(o.inv?q.slice().reverse():q),{c:col(R.length-1,0),ch:o.ch,jit:o.jit});}return b;};
// anneaux posés le long d'un chemin (à donner à loft). rad(k,a,i) : rayon du point i de l'anneau k ; up : direction du point 0 (a = 0)
const sweep=(path,n,rad,up)=>{const L=path.length,sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],nz=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];},dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  let N=up||[0,1,0];const out=[];
  for(let k=0;k<L;k++){const T=nz(k===0?sub(path[1],path[0]):k===L-1?sub(path[k],path[k-1]):sub(path[k+1],path[k-1]));N=nz(sub(N,T.map(x=>x*dt(N,T))));const B=[T[1]*N[2]-T[2]*N[1],T[2]*N[0]-T[0]*N[2],T[0]*N[1]-T[1]*N[0]],c=path[k];
    out.push(ring(n,(a,i)=>{const r=rad(k,a,i);return[c[0]+(N[0]*C(a)+B[0]*S(a))*r,c[1]+(N[1]*C(a)+B[1]*S(a))*r,c[2]+(N[2]*C(a)+B[2]*S(a))*r];}));}
  return out;};
// arc électrique : tube brisé et lumineux entre deux points (n segments, écart amp, épaisseur w)
const zap=(b,p,q,n,amp,w,c)=>{const pts=[];for(let i=0;i<=n;i++){const t=i/n,j=i&&i<n?amp:0;pts.push([p[0]+(q[0]-p[0])*t+(b.rnd()-.5)*j,p[1]+(q[1]-p[1])*t+(b.rnd()-.5)*j,p[2]+(q[2]-p[2])*t+(b.rnd()-.5)*j]);}
  b.add(K.tube(pts,pts.map((_,i)=>i&&i<n?w:0),3),{c,ch:'g',jit:0});};
// feuille pliée le long de sa nervure (visible des deux côtés) : base à l'origine, pointe vers +Y, longueur 1
const leaf=(b,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{b.add(K.face([[0,0,0],[.3,.42,.1],[0,1,0]],{dbl:true}),{c:o.c,c2:o.c2}).add(K.face([[0,0,0],[0,1,0],[-.3,.42,.1]],{dbl:true}),{c:K.shade(o.c,.82),c2:o.c2});});

// éventail de facettes double face entre le point o et les points successifs (nageoire, crête, membrane)
const fan=(b,o,pts,c,c2,ch)=>{for(let i=0;i<pts.length-1;i++)b.add(K.face([o,pts[i],pts[i+1]],{dbl:true}),{c:i%2?K.shade(c,.8):c,c2,ch:ch||'s'});};

// ================================================================ LE SPECTRE (furtif) — silhouette encapuchonnée qui flotte, lanterne à l'image de son élément
MODELS['enemy.ste']=ctx=>{const P=ctx.P,el=ctx.el,body=K.make(21),arms=K.make(22),lan=K.make(23),dk=K.mix(P.deep,PAL.black,.6),dk2=K.mix(P.deep,PAL.black,.25);
  // --- robe : une seule coque qui s'évase et finit en lambeaux pointus (ourlet en dents de scie, doublure sombre)
  const N=18,tl=[.5,.26,.42,.2,.56,.3,.46,.22,.36],ov=(y,rx,rz,cz)=>ring(N,a=>[S(a)*rx,y,cz+C(a)*rz]);
  const hem=ring(N,(a,i)=>{const t=i%2?tl[(i-1)/2]:0,f=1+t*.3;return[S(a)*.52*f,.72-t,-.16+C(a)*.47*f-t*.35];});
  const R=[hem,ov(.82,.5,.45,-.14),ov(1.15,.36,.3,-.05),ov(1.5,.4,.3,0),ov(1.76,.3,.24,.02)];
  loft(body,R,{c:k=>[P.light,P.main,P.dark,P.dark,P.deep][k]});
  if(el==='feu')loft(body,R.slice(0,2),{inv:true,c:k=>k?P.dark:PAL.lava,ch:'g'});else loft(body,R.slice(0,2),{inv:true,c:()=>dk});   // feu : l'intérieur de la robe rougeoie
  // --- camail déchiré sur les épaules
  const M=12,me=ring(M,(a,i)=>{const t=i%2?.2:0;return[S(a)*(.57+t*.4),1.5-t,.02+C(a)*(.4+t*.4)];}),ms=ring(M,a=>[S(a)*.5,1.74,.02+C(a)*.33]);
  loft(body,[me,ms,ring(M,a=>[S(a)*.2,1.9,.04+C(a)*.2])],{c:k=>[P.main,P.dark,P.deep][k]});loft(body,[me,ms],{inv:true,c:()=>dk});
  body.add(K.oct(.055),{p:[0,1.6,.44],s:[1,1.3,.6],c:P.main,c2:P.glow,ch:'g',jit:0});                                                    // agrafe du camail
  body.add(K.cyl(.375,.375,.05,9,{open:true}),{p:[0,1.15,-.05],s:[1,1,.84],c:PAL.rope}).add(K.oct(.05),{p:[.16,1.15,.23],c:PAL.rope});   // corde nouée à la taille
  body.add(K.cyl(.016,.016,.24,3),{p:[.15,1.02,.25],r:[.1,0,.1],c:PAL.rope}).add(K.cyl(.016,.016,.18,3),{p:[.2,1.05,.24],r:[.1,0,-.2],c:PAL.rope});
  // --- capuche : coque ouverte vers l'avant, pointe qui retombe, intérieur noir où brillent deux yeux
  const HP=[0,2.02,.05],HR=[.2,0,0];
  body.group({p:HP,r:HR},b=>{const H=10,hr=(z,w,h,dy,pk)=>ring(H,a=>[S(a)*w,(dy||0)+C(a)*h,z+(pk||0)*Math.max(0,C(a))]),lip=hr(.3,.24,.29,-.01,.1);
    loft(b,[lip,hr(.34,.31,.37,0,.13),hr(.1,.38,.41,0,.03),hr(-.16,.33,.35,.03),hr(-.38,.2,.2,.08),hr(-.56,.09,.09,.0),ring(H,()=>[0,-.26,-.7])],{c:k=>[P.light,P.main,P.dark,P.dark,P.dark,P.deep,P.deep][k]});
    loft(b,[lip,hr(.1,.27,.3),ring(H,()=>[0,0,-.12])],{inv:true,c:()=>dk});
    b.sym(sd=>b.group({p:[sd*.105,.01,.14],r:[0,0,sd*.32],s:[1.3,.62,.7]},b=>SH.eye(b,{r:.075,glow:P.glow})));});
  // --- bras (pièce animée) : manches pendantes, mains griffues
  const arm=pa=>{const sw=sweep(pa,6,(k,a,i)=>i===3?[.1,.13,.26,.42][k]:[.1,.11,.13,.18][k]);
    loft(arms,sw,{c:k=>[P.deep,P.dark,P.dark,P.main][k]});loft(arms,sw.slice(2),{inv:true,c:()=>dk2,cap0:true});};
  arm([[.38,1.64,0],[.56,1.46,.22],[.6,1.4,.48],[.6,1.42,.68]]);arm([[-.38,1.64,0],[-.6,1.44,.16],[-.64,1.52,.4],[-.58,1.74,.54]]);
  const claw=(b,p,r,l)=>b.group({p,r},b=>b.add(K.cone(.028,l,4),{p:[0,l/2,0],c:PAL.boneD,c2:PAL.bone,jit:0}));
  arms.group({p:[-.56,1.78,.58],r:[-1.05,-.25,0]},b=>{b.add(K.ico(.085,0),{p:[0,0,.05],s:[1,.6,1.2],c:P.deep,c2:P.main});          // main dressée, doigts en éventail
    for(let k=0;k<4;k++){const u=k-1.5;claw(b,[u*.04,0,.12],[PI/2+.45+Math.abs(u)*.1,0,-u*.34],.27);}claw(b,[.08,-.01,.02],[PI/2+.5,0,-1.3],.16);});
  arms.group({p:[.6,1.43,.74]},b=>{b.add(K.ico(.09,0),{s:[1,.85,1.15],c:P.deep,c2:P.main});                                        // poing fermé sur l'anse
    for(let k=0;k<3;k++)claw(b,[(k-1)*.05,-.03,.08],[PI-.5,0,0],.1);});
  // --- lanterne (pièce animée, pendue au poing) : cage et marque de l'élément
  const LP=[.6,1.38,.76],fr={feu:PAL.iron,eau:PAL.steel,bois:PAL.woodD,terre:PAL.stoneD,elec:PAL.bronze}[el]||PAL.iron;
  lan.group({p:[LP[0],LP[1]-.56,LP[2]]},b=>{b.add(K.cyl(.012,.012,.14,3),{p:[0,.5,0],c:fr}).add(K.oct(.035),{p:[0,.45,0],c:PAL.bronzeL});
    b.add(K.cone(.17,.12,6),{p:[0,.39,0],c:fr,c2:K.shade(fr,1.6)}).add(K.cyl(.13,.1,.05,6),{p:[0,.025,0],c:fr});
    for(let k=0;k<4;k++){const a=k/4*TAU+.78;b.add(K.cyl(.011,.011,.3,3,{open:true}),{p:[S(a)*.115,.19,C(a)*.115],c:fr});}
    SH.motif(b,el,{p:[0,.05,0],s:.44});});
  // --- la marque de l'élément dans la silhouette
  const tips=hem.filter((_,i)=>i%2),hood=fn=>body.group({p:HP,r:HR},fn),X={
    feu:()=>{hood(b=>[[0,.2,-.5,.34,-.5],[.05,.14,-.64,.24,-.9],[-.05,.3,-.36,.22,-.2]].forEach(q=>b.add(K.cone(.075,q[3],5),{p:[q[0],q[1],q[2]],r:[q[4],0,0],c:EL.feu.main,c2:EL.feu.glow,ch:'g',jit:0})));   // la pointe de la capuche brûle
      for(let i=0;i<7;i++){const a=body.rnd()*TAU,h=body.rnd();body.add(K.tet(.03+.02*body.rnd()),{p:[S(a)*(.7-h*.2),.3+h*1.1,-.2+C(a)*(.65-h*.2)],r:[a,h*3,0],c:i%2?PAL.lava:EL.feu.glow,ch:'g',jit:0});}},   // braises
    eau:()=>{hood(b=>{fan(b,[0,.3,-.1],[[0,.4,.3],[0,.6,.12],[0,.48,0],[0,.68,-.22],[0,.48,-.34],[0,.3,-.52]],P.main,P.glow);                                  // crête dorsale
        b.sym(sd=>fan(b,[sd*.33,-.04,.02],[[sd*.5,.24,-.1],[sd*.68,.06,-.24],[sd*.6,-.16,-.34],[sd*.4,-.26,-.2]],P.main,P.glow));});                               // nageoires de la capuche
      [1,4,6].forEach(i=>body.add(K.lathe([[0,0],[.045,.035],[.03,.09],[0,.16]],5),{p:[tips[i][0],tips[i][1]-.14,tips[i][2]],c:P.light,c2:P.glow,ch:'s',flat:false,jit:0}));   // gouttes qui tombent des lambeaux
      [[-.5,1.0,.36,.05],[-.62,1.22,.2,.035],[.34,.62,.5,.04]].forEach(q=>body.add(K.ico(q[3],0),{p:[q[0],q[1],q[2]],c:P.light,c2:P.glow,ch:'s',jit:0}));},       // bulles
    bois:()=>{body.sym(sd=>{body.add(K.tube([[sd*.2,2.3,.12],[sd*.36,2.46,.06],[sd*.38,2.66,.14]],[.04,.03,.012],4),{c:PAL.barkD,c2:PAL.bark});                    // ramure de brindilles
        body.add(K.tube([[sd*.35,2.44,.07],[sd*.54,2.52,.0],[sd*.6,2.64,-.04]],[.026,.02,.008],4),{c:PAL.bark});
        leaf(body,{p:[sd*.38,2.64,.14],r:[.5,0,-sd*.5],s:.2,c:P.main,c2:P.glow});leaf(body,{p:[sd*.6,2.62,-.04],r:[-.3,0,-sd*1.1],s:.18,c:P.main,c2:P.light});});
      me.forEach((q,i)=>{if(i%2)leaf(body,{p:[q[0]*.96,q[1]+.1,q[2]*.96],r:[0,Math.atan2(q[0],q[2]),PI-.5],s:.24,c:P.dark,c2:P.light});});                        // feuilles au bord du camail
      const vi=ring(9,(a,i)=>[S(a*1.5+.6)*(.5-i*.012),.86+i*.085,-.1+i*.012+C(a*1.5+.6)*(.44-i*.014)]);body.add(K.tube(K.curve(vi,9),.026,4),{c:PAL.bark,c2:PAL.moss});       // liane enroulée
      [2,4,6].forEach(i=>leaf(body,{p:vi[i],r:[0,Math.atan2(vi[i][0],vi[i][2]+.1),-1.2],s:.2,c:P.main,c2:P.glow}));},
    terre:()=>{body.sym(sd=>{body.add(K.rock(.15,sd+3,0,.3),{p:[sd*.44,1.76,.0],c:PAL.stoneD,c2:P.main});                                                          // roche et cristaux sur les épaules
        [[.5,1.9,.02,.2,.5],[.4,1.93,-.1,.15,.2],[.56,1.8,.1,.13,.9]].forEach(q=>body.add(K.oct(.055),{p:[sd*q[0],q[1],q[2]],r:[0,q[4],-sd*q[4]],s:[1,q[3]/.055,1],c:P.main,c2:P.glow,ch:'s'}));});
      hood(b=>[[0,.4,.0,.2],[0,.36,-.2,.16],[0,.26,-.38,.12]].forEach((q,i)=>b.add(K.oct(.05),{p:[q[0],q[1],q[2]],r:[-.3-i*.25,0,0],s:[1,q[3]/.05,1],c:P.dark,c2:P.light,ch:'s'})));},
    elec:()=>{hood(b=>{b.add(K.cyl(.012,.022,.36,4),{p:[0,.55,.02],c:PAL.ironL,ch:'s'});for(let k=0;k<3;k++)b.add(K.cyl(.05,.05,.03,5),{p:[0,.44+k*.065,.02],c:PAL.bronze,ch:'s'});   // paratonnerre et bobine
        b.add(K.oct(.045),{p:[0,.75,.02],c:EL.elec.glow,ch:'g',jit:0});});
      body.sym(sd=>{body.add(K.cone(.05,.26,5),{p:[sd*.47,1.86,.02],r:[0,0,-sd*.5],c:PAL.iron,c2:PAL.steel,ch:'s'});
        zap(body,[sd*.53,1.97,.02],[sd*.02,2.74,.2],5,.26,.016,EL.elec.light);});
      [0,3,5,7].forEach(i=>body.add(K.tet(.04),{p:[tips[i][0],tips[i][1]-.03,tips[i][2]],c:EL.elec.glow,ch:'g',jit:0}));}};
  (X[el]||X.feu)();
  return{parts:[{name:'body',b:body},{name:'arms',b:arms,parent:'body',pivot:[0,1.66,0],anim:[{k:'rot',axis:'x',amp:.25,sp:3}]},
      {name:'lantern',b:lan,parent:'arms',pivot:LP,anim:[{k:'rot',axis:'x',amp:.3,sp:3,ph:2.6}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:1,barY:2.85,r:.75};};

// ================================================================ LE MAGE (tireur à distance) — robe, grand chapeau pointu, barbe, fioles, bâton à foyer élémentaire
MODELS['enemy.rng']=ctx=>{const P=ctx.P,el=ctx.el,body=K.make(31),staff=K.make(32),orb=K.make(33),br=K.mix(PAL.white,P.glow,.5),brD=K.mix(br,P.main,.35);
  // --- robe en cloche : plis à l'ourlet, galon doré, étole claire, pieds pointus qui dépassent
  const N=10,rb=(y,r,w)=>ring(N,(a,i)=>{const f=r*(1+(i%2?-w:w));return[S(a)*f,y,C(a)*f*.9];}),R=[rb(.03,.57,.09),rb(.14,.54,.08),rb(.5,.44,.04),rb(.84,.35,0),rb(1.1,.37,0),rb(1.3,.22,0)];
  loft(body,R.slice(0,2),{c:PAL.goldD});loft(body,R.slice(1),{c:k=>[P.deep,P.dark,P.dark,P.main,P.main][k]});
  const st=k=>[1,9].map(i=>[R[k][0][0]*.52+R[k][i][0]*.5,R[k][0][1],R[k][0][2]*.52+R[k][i][2]*.5]);
  for(let k=1;k<3;k++){const A=st(k),B=st(k+1);body.add(K.face([B[0],A[0],A[1],B[1]].reverse()),{c:P.main,c2:P.light});}
  body.add(K.oct(.07),{p:[0,.36,.5],r:[-.25,0,0],s:[1,1.3,.3],c:P.glow,ch:'g',jit:0});
  body.sym(sd=>body.group({p:[sd*.2,.085,.42],r:[0,sd*.3,0]},b=>b.add(K.cone(.11,.36,4),{p:[0,0,.16],r:[PI/2,0,PI/4],s:[1,1,.75],c:P.deep,c2:K.shade(P.deep,1.7)})));
  // --- ceinture, boucle, trois fioles lumineuses, rouleau de parchemin dans le dos
  body.add(K.cyl(.37,.37,.08,N,{open:true}),{p:[0,.84,0],s:[1,1,.9],c:PAL.woodD}).add(K.box(.12,.12,.04),{p:[0,.84,.335],c:PAL.gold,ch:'s'});
  [-1.05,-.5,.62].forEach((a,i)=>body.group({p:[S(a)*.41,.63,C(a)*.37],r:[0,a,0]},b=>{b.add(K.lathe([[.058,0],[.018,.12],[.018,.17]],4,{capB:true,capT:true}),{c:i%2?P.main:P.light,c2:P.glow,ch:'g',jit:.1});
    b.add(K.tet(.028),{p:[0,.19,0],c:PAL.wood});}));
  body.add(K.cyl(.05,.05,.42,5),{p:[.02,.9,-.38],r:[0,0,1.2],c:PAL.cream,c2:PAL.sand});
  // --- grosse tête : yeux, sourcils broussailleux, long nez, oreilles pointues, crocs, moustache
  body.add(K.dod(.35),{p:[0,1.5,.04],r:[.3,0,0],s:[1.06,.94,1],c:P.main,c2:P.light});
  body.sym(sd=>{SH.eye(body,{p:[sd*.15,1.56,.31],r:.1,rot:[-.05,sd*.2,0]});
    body.add(K.cone(.055,.3,4),{p:[sd*.2,1.7,.33],r:[.15,0,-sd*1.25],s:[1,1,.7],c:brD,c2:br});
    body.add(K.prism([[0,0],[.36,.12],[.08,.26]],.05),{p:[sd*.3,1.5,.02],r:[PI/2,sd>0?0:PI,sd*.35],c:P.main,c2:P.dark});
    body.add(K.cone(.03,.1,4),{p:[sd*.09,1.335,.4],r:[PI,0,0],c:PAL.white,jit:0});
    body.add(K.tube([[sd*.02,1.42,.41],[sd*.17,1.4,.38],[sd*.3,1.28,.32]],[.055,.05,0],4),{c:brD,c2:br});});
  body.add(K.cone(.075,.28,5),{p:[0,1.47,.45],r:[1.8,0,0],c:P.light,c2:P.main});
  // --- barbe en pointe, à étages
  [[0,1.42,.34,.15,.66,0],[.12,1.42,.32,.12,.5,.22],[-.12,1.42,.32,.12,.5,-.22],[.23,1.44,.26,.1,.36,.5],[-.23,1.44,.26,.1,.36,-.5]].forEach(q=>body.group({p:[q[0],q[1],q[2]],r:[PI-.14,0,q[5]]},b=>b.add(K.cone(q[3],q[4],4),{p:[0,q[4]/2-.06,0],s:[1,1,.6],c:br,c2:brD})));
  // --- grand chapeau pointu : large bord, pointe qui casse, ruban et boucle
  const HP=[0,1.75,-.02],HR=[-.2,0,.07],hat=fn=>body.group({p:HP,r:HR},fn),TP=[.3,.74,-.46];
  hat(b=>{b.add(K.lathe([[0,0],[.63,-.08],[.67,-.04],[.3,.05]],8),{c:P.deep,c2:P.dark});
    b.add(K.tube([[0,.02,0],[0,.24,-.02],[.02,.44,-.08],[.07,.62,-.2],[.16,.74,-.34],TP],[.3,.25,.19,.13,.07,0],6),{c:P.dark,c2:P.main});
    b.add(K.cyl(.285,.305,.09,6,{open:true}),{p:[0,.1,-.008],c:PAL.goldD,ch:'s'}).add(K.box(.11,.12,.04),{p:[0,.1,.285],c:PAL.gold,ch:'s'});});
  // --- bras gauche : grimoire ouvert tenu à bout de bras
  const sl=(b,pa)=>{const sw=sweep(pa,5,(k,a,i)=>[.1,.11,.15][k]);loft(b,sw,{c:k=>[P.main,P.dark,P.deep][k],cap1:true});};
  sl(body,[[-.3,1.18,.02],[-.52,1.0,.14],[-.6,1.02,.36]]);body.add(K.ico(.09,0),{p:[-.62,1.04,.44],c:P.light});
  body.group({p:[-.62,1.12,.5],r:[-.5,.3,0]},b=>b.sym(sd=>{b.add(K.box(.2,.03,.28),{p:[sd*.1,.02,0],r:[0,0,sd*.3],c:P.deep});b.add(K.box(.17,.03,.24),{p:[sd*.095,.045,0],r:[0,0,sd*.3],c:PAL.cream});}));
  // --- bras droit et bâton (pièce animée) : bois noueux, griffes qui tiennent le foyer de l'élément
  const SX=.64,SZ=.5;sl(staff,[[.3,1.18,.02],[.54,1.0,.16],[.62,1.06,.38]]);staff.add(K.ico(.1,0),{p:[SX-.01,1.08,SZ-.03],c:P.light});
  staff.add(K.tube(K.curve([[SX,.16,SZ+.02],[SX+.02,.7,SZ],[SX-.02,1.3,SZ+.01],[SX+.01,1.84,SZ]],4),[.03,.036,.04,.042,.05],4),{c:PAL.woodD,c2:PAL.wood});
  const pc={feu:PAL.iron,eau:P.light,bois:PAL.bark,terre:PAL.stoneD,elec:PAL.bronze}[el]||PAL.iron,pr={feu:[.2,.2,.3],eau:[.22,.1,.36],bois:[.16,.2,.24],terre:[.2,.24,.2],elec:[.22,.22,.34]}[el]||[.2,.2,.3];
  staff.group({p:[SX+.01,1.84,SZ]},b=>{for(let k=0;k<3;k++){const a=k/3*TAU+.5;b.add(K.tube([[0,-.04,0],[S(a)*pr[0],.06,C(a)*pr[0]],[S(a)*pr[1],pr[2],C(a)*pr[1]]],[.04,.035,0],4),{c:pc,c2:K.shade(pc,1.4)});}
    SH.motif(b,el,{p:[0,.04,0],s:.62});});
  // --- orbe lumineuse (pièce animée) qui flotte devant le bâton
  const OP=[.8,1.56,.8];orb.add(K.dod(.1),{p:OP,c:P.main,c2:P.glow,ch:'g',jit:.14});
  for(let k=0;k<3;k++){const a=k/3*TAU+.4;orb.add(K.tet(.035),{p:[OP[0]+S(a)*.17,OP[1]+C(a*2)*.07,OP[2]+C(a)*.17],r:[a,a*2,0],c:P.glow,ch:'g',jit:0});}
  // --- la marque de l'élément : pointe et bord du chapeau
  const X={feu:()=>hat(b=>{[[0,.1,0,.24],[.05,.06,.04,.15],[-.04,.05,-.04,.13]].forEach(q=>b.add(K.cone(.055,q[3],5),{p:[TP[0]+q[0],TP[1]+q[1],TP[2]+q[2]],c:EL.feu.main,c2:EL.feu.glow,ch:'g',jit:0}));   // la pointe du chapeau brûle
      for(let i=0;i<4;i++){const a=1+i*1.5;b.add(K.tet(.03),{p:[S(a)*.5,.02,C(a)*.5],r:[a,a,0],c:PAL.lava,ch:'g',jit:0});}}),                                                    // braises sur le bord
    eau:()=>hat(b=>{b.add(K.lathe([[0,0],[.05,.04],[.035,.1],[0,.18]],5),{p:[TP[0],TP[1]-.2,TP[2]],c:P.light,c2:P.glow,ch:'s',flat:false,jit:0});                               // goutte qui perle à la pointe
      fan(b,[.02,.4,-.2],[[0,.12,-.3],[0,.3,-.58],[.01,.36,-.42],[.02,.52,-.64],[.04,.52,-.46],[.08,.7,-.62],[.1,.68,-.4]],P.main,P.glow);}),                                                                              // nageoire dorsale du chapeau
    bois:()=>hat(b=>{leaf(b,{p:TP,r:[0,0,-.9],s:.24,c:P.main,c2:P.glow});leaf(b,{p:TP,r:[-.6,0,.2],s:.2,c:P.main,c2:P.light});                                                    // feuilles à la pointe, champignon sur le bord
      b.add(K.cyl(.025,.03,.1,4),{p:[-.44,.04,.14],c:PAL.cream}).add(K.cone(.08,.07,5),{p:[-.44,.12,.14],c:PAL.cloth,c2:PAL.cream});}),
    terre:()=>hat(b=>{b.add(K.oct(.05),{p:[TP[0]+.03,TP[1]+.02,TP[2]-.03],r:[0,0,-1.1],s:[1,3,1],c:P.main,c2:P.glow,ch:'s'});                                                    // cristal à la pointe, éclats sur le bord
      [[-.46,.06,.1,.5],[.4,.08,-.3,-.4],[-.3,.1,-.42,.2]].forEach(q=>b.add(K.oct(.05),{p:[q[0],q[1],q[2]],r:[q[3],0,q[3]],s:[1,2.2,1],c:PAL.stoneD,c2:P.light,ch:'s'}));}),
    elec:()=>hat(b=>{b.add(K.oct(.045),{p:TP,c:PAL.steel,ch:'s'});zap(b,TP,[.36,.2,-.3],3,.16,.014,EL.elec.light);                                                                // pointe de métal, arc, bobine autour du chapeau
      b.add(K.cyl(.2,.215,.045,6,{open:true}),{p:[.02,.44,-.08],r:[-.44,0,-.1],c:PAL.bronze,ch:'s'}).add(K.cyl(.14,.155,.045,6,{open:true}),{p:[.07,.62,-.2],r:[-.71,0,-.44],c:PAL.bronze,ch:'s'});})};
  (X[el]||X.feu)();
  return{parts:[{name:'body',b:body},{name:'staff',b:staff,parent:'body',pivot:[.32,1.18,0],anim:[{k:'rot',axis:'x',amp:.2,sp:3}]},
      {name:'orb',b:orb,parent:'staff',pivot:OP,anim:[{k:'pos',axis:'y',amp:.12,sp:3}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:1,barY:2.7,r:.75,muzzle:OP};};

// ---------------------------------------------------------------- aides des boss (vus de tout près : peaux fermées, détails posés sur les facettes, habillage par élément)
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const cen=q=>{const c=[0,0,0];for(const p of q)for(let a=0;a<3;a++)c[a]+=p[a]/q.length;return c;};
// point d'une peau (anneaux R) : anneau kf et indice u fractionnaires → {p : point décalé de off vers l'extérieur, n : normale, r : rotation qui dresse +Y selon la normale}
const onL=(R,kf,u,off)=>{kf=Math.max(0,Math.min(R.length-1,kf));const k=Math.min(R.length-2,Math.floor(kf)),t=kf-k,n=R[0].length,fu=Math.floor(u),f=u-fu,i=((fu%n)+n)%n,j=(i+1)%n,
    pt=q=>[0,1,2].map(a=>q[i][a]+(q[j][a]-q[i][a])*f),A=pt(R[k]),B=pt(R[k+1]),cA=cen(R[k]),cB=cen(R[k+1]),p=[0,1,2].map(a=>A[a]+(B[a]-A[a])*t),nn=nrm([0,1,2].map(a=>p[a]-cA[a]-(cB[a]-cA[a])*t)),d=off||0;
  return{p:[p[0]+nn[0]*d,p[1]+nn[1]*d,p[2]+nn[2]*d],n:nn,r:[Math.atan2(nn[2],nn[1]),0,-Math.asin(nn[0])]};};
// ruban posé sur une peau, de (k0,u0) à (k1,u1), demi-largeur w=[wk,wu] en indices ; découpé le long des arêtes pour épouser les facettes (sangles, veines, cicatrices)
const band=(b,R,k0,u0,k1,u1,w,o={})=>{let ts=[0,1];const cut=(a,z)=>{if(z!==a)for(let q=Math.ceil(Math.min(a,z));q<=Math.max(a,z);q++)ts.push((q-a)/(z-a));};cut(k0,k1);cut(u0,u1);
  ts=ts.filter(x=>x>=0&&x<=1).sort((x,y)=>x-y).filter((x,i,a)=>!i||x-a[i-1]>.002);const off=o.off===undefined?.012:o.off,Q=(s,g)=>onL(R,k0+(k1-k0)*s+g*w[0],u0+(u1-u0)*s+g*w[1],off);
  for(let i=0;i<ts.length-1;i++){const A=Q(ts[i],-1).p,B=Q(ts[i],1).p,D=Q(ts[i+1],1).p,E=Q(ts[i+1],-1).p,m=Q((ts[i]+ts[i+1])/2,0).n,ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=E[0]-A[0],vy=E[1]-A[1],vz=E[2]-A[2];
    b.add(K.face((uy*vz-uz*vy)*m[0]+(uz*vx-ux*vz)*m[1]+(ux*vy-uy*vx)*m[2]<0?[E,D,B,A]:[A,B,D,E]),{c:o.c,c2:o.c2,ch:o.ch,jit:o.jit});}};
// membre : peau fermée le long d'un chemin (rayons rd et couleurs c, un par anneau) ; renvoie ses anneaux pour y poser des détails
const limb=(b,pa,rd,n,c,up)=>{const R=sweep(pa,n,k=>rd[k],up);loft(b,R,{c:k=>c[Math.min(c.length-1,k)],cap0:true,cap1:true});return R;};
// tronc : peau fermée d'anneaux [y, rx, rz avant, rz arrière, cz] ; col(k,i) : couleur de la facette
const trunk=(b,n,sp,col,ch)=>{const R=sp.map(q=>ring(n,a=>[S(a)*q[1],q[0],q[4]+C(a)*(C(a)>0?q[2]:q[3])]));loft(b,R,{c:col,cap0:true,cap1:true,ch});return R;};
// drap double face tendu entre des rangées de points (cape, col, manche pendante) ; c(k) : couleur de la rangée k
const sheet=(b,rows,c,ch)=>{for(let k=0;k<rows.length-1;k++)for(let j=0;j<rows[k].length-1;j++){const A=rows[k][j],B=rows[k+1][j],D=rows[k+1][j+1],E=rows[k][j+1],up=A[1]+E[1]>=B[1]+D[1];
    b.add(K.face([A,B,D,E],{dbl:true}),{c:c(up?k+1:k),c2:c(up?k:k+1),ch});}};
// matière des armures [sombre, claire] et des cornes [base, pointe] selon l'élément
const MET={feu:[PAL.iron,PAL.ironL],eau:[PAL.steel,PAL.ice],bois:[PAL.bark,PAL.woodL],terre:[PAL.stoneD,PAL.stoneL],elec:[PAL.bronze,PAL.bronzeL]};
const HORN={feu:[PAL.black,PAL.boneD],eau:[EL.eau.dark,EL.eau.glow],bois:[PAL.barkD,PAL.woodL],terre:[PAL.stoneDD,PAL.stoneL],elec:[PAL.iron,PAL.steel]};
// pointe de l'élément dressée vers +Y (≈ 1 m à s:1) : cheminée et flammes / nageoire à rayons / branche feuillue / cristal / mât à bobine
const spire=(b,el,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{const E=EL[el]||EL.feu;
  if(el==='eau'){fan(b,[0,0,0],[[0,.5,.26],[0,1,-.12],[0,.62,-.3],[0,.78,-.5],[0,.3,-.56],[0,0,-.4]],E.main,E.glow);b.add(K.cone(.05,1,3),{p:[0,.5,-.06],r:[-.12,0,0],c:E.dark,c2:E.light});}
  else if(el==='bois'){b.add(K.tube([[0,0,0],[.04,.4,.02],[-.05,.72,.06],[0,.95,0]],[.09,.07,.05,.02],4),{c:PAL.barkD,c2:PAL.bark}).add(K.tube([[.03,.4,.02],[.24,.58,.04],[.3,.78,0]],[.045,.035,.012],3),{c:PAL.bark});
    leaf(b,{p:[0,.93,0],r:[.4,0,.3],s:.36,c:E.main,c2:E.glow});leaf(b,{p:[.3,.76,0],r:[-.3,0,-.8],s:.3,c:E.dark,c2:E.light});}
  else if(el==='terre'){b.add(K.cyl(.12,.17,.6,5),{p:[0,.3,0],c:PAL.stoneD,c2:E.main,ch:'s'}).add(K.cone(.12,.4,5),{p:[0,.8,0],c:E.main,c2:E.glow,ch:'s'}).add(K.oct(.09),{p:[.16,.2,.05],r:[0,0,-.5],s:[1,2.6,1],c:E.dark,c2:E.light,ch:'s'});}
  else if(el==='elec'){b.add(K.cyl(.035,.06,.86,4,{open:true}),{p:[0,.43,0],c:PAL.iron,c2:PAL.steel,ch:'s'});for(let k=0;k<2;k++)b.add(K.cyl(.13,.13,.08,5),{p:[0,.32+k*.2,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.oct(.1),{p:[0,.93,0],c:E.light,c2:E.glow,ch:'g',jit:.1});}
  else{b.add(K.cyl(.13,.2,.3,5),{p:[0,.15,0],c:PAL.black,c2:E.deep});[[0,0,.7,0],[.07,.03,.42,.6],[-.06,-.04,.36,-.7]].forEach(q=>b.add(K.cone(.13,q[2],5),{p:[q[0],.26+q[2]/2,q[1]],r:[0,q[3],q[3]*.15],c:E.main,c2:E.glow,ch:'g',jit:0}));}});
// petit détail de surface (≈ 0,15 m, +Y vers l'extérieur) : braise / coquillage / champignon / éclat de cristal / rivet
const stud=(b,el,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{const E=EL[el]||EL.feu;
  if(el==='eau')b.add(K.cone(.07,.1,5),{p:[0,.04,0],c:E.light,c2:E.glow,ch:'s'});
  else if(el==='bois'){b.add(K.cyl(.02,.028,.09,4),{p:[0,.045,0],c:PAL.cream}).add(K.cone(.075,.06,5),{p:[0,.11,0],c:PAL.cloth,c2:PAL.cream});}
  else if(el==='terre')b.add(K.oct(.05),{p:[0,.05,0],s:[1,2.2,1],c:E.main,c2:E.glow,ch:'s'});
  else if(el==='elec')b.add(K.cyl(.04,.055,.05,5),{p:[0,.02,0],c:PAL.steel,ch:'s'});
  else b.add(K.oct(.06),{p:[0,.01,0],c:PAL.lava,c2:E.glow,ch:'g',jit:.12});});
// veine de l'élément sur une peau (suite de points [k,u]) : lave / filet d'eau / mousse / ambre / filament électrique
const vein=(b,el,R,pts,w)=>{const E=EL[el]||EL.feu,o={feu:{c:PAL.lava,c2:E.glow,ch:'g'},eau:{c:E.light,c2:E.glow,ch:'s'},bois:{c:PAL.moss,c2:PAL.leafL},terre:{c:0xffb347,c2:E.glow,ch:'s'},elec:{c:E.light,c2:E.glow,ch:'g'}}[el]||{c:PAL.lava,ch:'g'};
  for(let i=0;i<pts.length-1;i++)band(b,R,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],w,o);};
// épaulière (côté +X) : deux plaques bombées fermées qui se chevauchent, rivets, pointes de métal et pointe de l'élément
const pauldron=(b,el,M,p,s)=>b.group({p,r:[0,0,-.42],s},b=>{const pl=[[0,.06],[.36,-.04],[.43,.01],[.3,.24],[0,.35]];
  b.add(K.lathe(pl,8),{c:M[0],c2:M[1],ch:'s',ao:.2}).add(K.lathe(pl,8),{p:[.25,-.2,0],r:[0,0,-.55],s:.8,c:M[0],c2:M[1],ch:'s',ao:.2});
  for(let i=0;i<6;i++){const a=i/6*TAU+.5;b.add(K.tet(.04),{p:[S(a)*.39,.07,C(a)*.39],c:PAL.bronzeL,ch:'s'});}
  for(const z of[-.2,.2])b.add(K.cone(.06,.26,5),{p:[.12,.3,z],r:[z*2,0,-.5],c:M[1],c2:PAL.steel,ch:'s'});
  spire(b,el,{p:[-.04,.3,0],r:[0,0,.25],s:.6});});
// poing (jointures vers +Z) : bloc facetté, quatre doigts repliés, pouce, bande de métal à pointes
const fist=(b,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{b.add(K.dod(.28),{s:[1,.92,1.08],c:o.c,c2:o.c2});
  for(let k=0;k<4;k++){const x=(k-1.5)*.125;b.add(K.box(.115,.2,.16,.85,.85),{p:[x,-.15,.2],r:[.5,0,0],c:o.c,c2:o.c2}).add(K.cone(.05,.14,4),{p:[x,.03,.34],r:[PI/2,0,0],c:o.m[1],ch:'s'});}
  b.add(K.box(.54,.1,.1),{p:[0,.02,.27],c:o.m[0],ch:'s'}).add(K.box(.13,.13,.26,.8,.8),{p:[-.27,-.06,.1],r:[0,-.5,0],c:o.c,c2:o.c2});});
// corne annelée le long d'un chemin
const horn=(b,pts,r0,o)=>{const q=K.curve(pts,7);b.add(K.tube(q,q.map((_,i)=>i===7?0:r0*(1-i/7.7)*(i%2?1.1:1)),5),o);};

// ================================================================ BOSS 1 — LA BRUTE : ogre de guerre cornu, épaulières de plaques, crâne à la ceinture, poings énormes
MODELS['boss.1']=ctx=>{const P=ctx.P,el=ctx.el,M=MET[el]||MET.feu,hc=HORN[el]||HORN.feu,body=K.make(41),jaw=K.make(42),aL=K.make(43),aR=K.make(44);
  // --- jambes arquées : pieds à trois orteils griffus, fer de cheville, sangle, genouillère à pointe, veine de l'élément
  body.sym(sd=>body.group({s:[sd,1,1]},b=>{const L=limb(b,[[.3,1.04,0],[.39,.82,.08],[.46,.6,.14],[.46,.4,.05],[.44,.2,.03]],[.3,.29,.22,.24,.18],8,[P.dark,P.main,P.dark,P.dark,P.deep],[0,0,1]);
    b.add(K.box(.42,.22,.5,.8,.75),{p:[.45,.11,.06],c:P.deep,c2:P.dark});
    for(const j of[-1,0,1])b.group({p:[.45+j*.135,0,.26],r:[0,j*.22+.08,0]},b=>b.add(K.box(.13,.16,.26,.85,.7),{p:[0,.08,.1],c:P.deep,c2:P.dark}).add(K.cone(.058,.22,4),{p:[0,.075,.3],r:[1.78,0,0],c:PAL.boneD,c2:PAL.bone,jit:0}));
    b.add(K.cone(.07,.18,4),{p:[.45,.1,-.24],r:[-1.9,0,0],c:PAL.boneD,jit:0});
    b.add(K.cyl(.215,.23,.1,8,{open:true}),{p:[.44,.25,.03],c:M[0],c2:M[1],ch:'s'}).add(K.cyl(.255,.265,.07,8,{open:true}),{p:[.46,.47,.06],c:PAL.woodD});
    b.add(K.box(.3,.3,.12,.55,.6),{p:[.46,.62,.32],r:[.2,0,0],c:M[0],c2:M[1],ch:'s'}).add(K.cone(.07,.26,5),{p:[.46,.68,.46],r:[1.2,0,0],c:M[1],ch:'s'});
    b.add(K.box(.24,.26,.07,.8,1),{p:[.46,.4,.27],r:[.28,0,0],c:M[0],c2:M[1],ch:'s'});
    vein(b,el,L,[[.3,6.6],[1.2,5.8],[2,6.5]],[0,.12]);const s=onL(L,1,.6,0);stud(b,el,{p:s.p,r:s.r,s:1.5});}));
  // --- torse en barrique : ventre clair, bosse du dos, sangles croisées, cicatrice
  const TR=trunk(body,12,[[.86,.36,.3,.3,0],[1,.5,.4,.38,0],[1.14,.53,.44,.4,.02],[1.36,.58,.54,.44,.06],[1.62,.72,.5,.5,.1],[1.84,.74,.42,.52,.13],[1.98,.42,.34,.4,.18]],
    (k,i)=>K.mix([P.dark,P.dark,P.dark,P.main,P.main,P.main,P.dark][k],P.light,k>1&&k<6?(i===0||i===11?.6:i===1||i===10?.25:0):0));
  band(body,TR,2.1,10.7,5.3,13.5,[0,.3],{c:PAL.woodD,c2:PAL.wood,off:.02});band(body,TR,2.1,1.3,5.3,-1.5,[0,.3],{c:PAL.woodD,c2:PAL.wood,off:.025});
  {const s=onL(TR,3.72,0,.03);body.add(K.cyl(.1,.1,.05,6),{p:s.p,r:s.r,c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});}
  band(body,TR,2.7,.3,3.1,1.5,[.07,0],{c:P.deep});
  // --- ceinture cloutée, crâne aux yeux qui brillent, pagne et tassettes
  body.add(K.cyl(.55,.57,.17,12,{open:true}),{p:[0,1.12,.03],s:[1,1,.8],c:PAL.woodD,c2:PAL.wood});
  for(let i=1;i<12;i++){const s=onL(TR,1.9,i,.045);body.add(K.tet(.045),{p:s.p,r:[i,i,0],c:PAL.bronzeL,ch:'s'});}
  body.group({p:[0,1.1,.5]},b=>{b.add(K.dod(.16),{s:[1,.95,.8],c:PAL.boneD,c2:PAL.bone}).add(K.box(.17,.09,.1,.8,.9),{p:[0,-.15,.02],c:PAL.boneD});
    b.sym(sd=>b.add(K.oct(.05),{p:[sd*.065,.02,.115],c:P.main,c2:P.glow,ch:'g',jit:0}).add(K.cone(.045,.2,4),{p:[sd*.17,.1,0],r:[0,0,-sd*.9],c:PAL.boneD,c2:PAL.bone}));
    for(const x of[-.05,0,.05])b.add(K.tet(.03),{p:[x,-.1,.07],c:PAL.white,jit:0});});
  const hide=K.mix(PAL.dirtD,P.deep,.35);
  body.add(K.prism([[-.22,0],[.22,0],[.26,.42],[0,.62],[-.26,.42]],.035),{p:[0,1.04,.4],r:[PI/2-.1,0,0],c:hide,c2:PAL.dirt});SH.gem(body,{p:[0,.78,.5],s:.15,c:P.main});
  body.add(K.prism([[-.24,0],[.24,0],[.28,.4],[0,.56],[-.28,.4]],.035),{p:[0,1.04,-.4],r:[PI/2+.1,0,0],c:hide,c2:PAL.dirt});
  body.sym(sd=>{body.add(K.box(.34,.38,.06,.7,1),{p:[sd*.53,.9,.04],r:[0,sd*PI/2,-sd*.12],c:M[0],c2:M[1],ch:'s'});
    for(const z of[-.1,.1])body.add(K.tet(.035),{p:[sd*.565,1,z],c:PAL.bronzeL,ch:'s'});
    body.group({s:[sd,1,1]},b=>pauldron(b,el,M,[.86,1.84,.1],1));});
  // --- tête basse entre les épaules : arcades lourdes, petits yeux, groin à anneau, crocs, oreilles déchirées, grandes cornes baguées, marque de l'élément
  body.add(K.ico(.31,1),{p:[0,2.02,.44],s:[1.1,.96,1],c:P.main,c2:P.light}).add(K.box(.3,.2,.24,.8,.75),{p:[0,1.93,.72],r:[.1,0,0],c:P.main,c2:P.light}).add(K.box(.5,.12,.3,.9,.9),{p:[0,1.84,.6],c:P.dark});
  body.sym(sd=>{SH.eye(body,{p:[sd*.15,2.06,.69],r:.07,rot:[0,sd*.25,0]});
    body.add(K.box(.3,.13,.22,.85,.7),{p:[sd*.16,2.16,.64],r:[.3,sd*.2,-sd*.36],c:P.dark,c2:P.main}).add(K.oct(.035),{p:[sd*.07,1.93,.84],c:P.deep,jit:0});
    body.add(K.prism([[0,0],[.34,.12],[.3,.2],[.2,.2],[.08,.3]],.05),{p:[sd*.3,2.04,.4],r:[PI/2,sd>0?0:PI,sd*.4],c:P.main,c2:P.dark});
    for(const x of[.08,.19])body.add(K.cone(.04,.12,4),{p:[sd*x,1.75,.7],r:[PI,0,0],c:PAL.white,jit:0});
    horn(body,[[sd*.24,2.2,.4],[sd*.52,2.3,.34],[sd*.74,2.42,.46],[sd*.72,2.58,.68]],.125,{c:hc[0],c2:hc[1]});
    body.add(K.cyl(.125,.135,.06,6,{open:true}),{p:[sd*.36,2.245,.375],r:[0,0,-sd*1.2],c:M[1],ch:'s'});});
  body.add(K.torus(.07,.016,4,7),{p:[0,1.85,.86],r:[.2,0,0],c:PAL.gold,ch:'s'});SH.motif(body,el,{p:[0,2.28,.4],s:.6});
  // --- mâchoire (pièce animée) : menton carré, défenses, dents du bas
  jaw.add(K.box(.52,.2,.42,.9,.88),{p:[0,1.66,.6],c:P.dark,c2:P.main}).add(K.box(.3,.12,.22,.8,.8),{p:[0,1.52,.72],r:[PI,0,0],c:P.dark});
  jaw.sym(sd=>{jaw.add(K.tube(K.curve([[sd*.2,1.7,.74],[sd*.28,1.86,.85],[sd*.31,2,.87],[sd*.27,2.1,.8]],5),[.075,.07,.06,.045,.03,0],5),{c:PAL.boneD,c2:PAL.bone});
    for(const x of[.05,.13])jaw.add(K.cone(.035,.1,4),{p:[sd*x,1.8,.77],c:PAL.white,jit:0});});
  // --- bras (pièces animées) : biceps, coude à éperon, avant-bras en massue, brassard à pointes, poing ferré
  const arm=b=>{const U=limb(b,[[.86,1.82,.1],[.98,1.52,.04],[1.04,1.24,0]],[.25,.27,.2],8,[P.main,P.main,P.dark],[0,0,1]),F=limb(b,[[1.04,1.26,0],[1.05,1.02,.1],[1.02,.8,.2]],[.2,.28,.24],8,[P.dark,P.main,P.dark],[0,0,1]);
    b.add(K.dod(.2),{p:[1.05,1.25,-.03],c:P.dark}).add(K.cone(.08,.26,5),{p:[1.08,1.22,-.24],r:[-1.9,0,0],c:PAL.boneD,c2:PAL.bone});
    b.add(K.cyl(.265,.285,.2,8),{p:[1.025,.84,.18],r:[.4,0,0],c:M[0],c2:M[1],ch:'s'});
    for(let i=0;i<4;i++)b.group({p:[1.025,.84,.18],r:[.4,i/4*TAU+.4,0]},b=>b.add(K.cone(.05,.14,4),{p:[0,0,.31],r:[PI/2,0,0],c:M[1],ch:'s'}));
    fist(b,{p:[1,.56,.3],r:[.35,0,0],c:P.dark,c2:P.main,m:M});
    vein(b,el,U,[[.3,6.3],[1,5.6],[1.8,6.3]],[0,.13]);vein(b,el,F,[[.2,6],[1,6.6],[1.7,5.9]],[0,.13]);
    const s=onL(F,1,4.6,0);stud(b,el,{p:s.p,r:s.r,s:1.5});
    if(el==='eau')fan(b,[1.1,1.2,-.1],[[1.22,1.32,-.5],[1.32,1.02,-.58],[1.22,.82,-.38],[1.1,.8,-.12]],P.main,P.glow);};
  arm(aL);aR.group({s:[-1,1,1]},arm);
  // --- la marque de l'élément : crête dorsale, veines sur la poitrine et dans le dos, détails semés
  [[0,1.92,-.3,.85],[0,1.64,-.42,.7],[0,1.38,-.4,.5]].forEach(q=>spire(body,el,{p:[q[0],q[1],q[2]],r:[-.95,0,0],s:q[3]}));
  body.sym(sd=>{const u=x=>sd>0?x:12-x;spire(body,el,{p:[sd*.4,1.84,-.34],r:[-.8,0,-sd*.5],s:.5});
    vein(body,el,TR,[[5.6,u(1.5)],[4.8,u(1.2)],[4.2,u(1.9)],[3.4,u(1.4)],[2.6,u(1.8)]],[0,.09]);vein(body,el,TR,[[5.5,u(5.2)],[4.5,u(4.6)],[3.5,u(5)],[2.4,u(4.5)]],[0,.09]);
    for(const q of[[4.5,4],[4.6,2.6]]){const s=onL(TR,q[0],u(q[1]),0);stud(body,el,{p:s.p,r:s.r,s:1.6});}});
  return{parts:[{name:'body',b:body},{name:'jaw',b:jaw,parent:'body',pivot:[0,1.84,.42],anim:[{k:'rot',axis:'x',amp:.09,sp:2.5,base:.07}]},
      {name:'armL',b:aL,parent:'body',pivot:[.86,1.8,.1],anim:[{k:'rot',axis:'x',amp:.3,sp:2.5}]},{name:'armR',b:aR,parent:'body',pivot:[-.86,1.8,.1],anim:[{k:'rot',axis:'x',amp:.3,sp:2.5,ph:PI}]}],
    bake:{ground:.2,groundH:.7},scale:.92,barY:2.75,r:1.25};};

// ================================================================ BOSS 2 — LE SEIGNEUR INVOCATEUR : robe et cuirasse, masque d'os, couronne de cornes, cape, bâton-totem, anneau de pierres runiques
MODELS['boss.2']=ctx=>{const P=ctx.P,el=ctx.el,M=MET[el]||MET.feu,hc=HORN[el]||HORN.feu,body=K.make(51),aL=K.make(52),aR=K.make(53),rg=K.make(54),br=K.mix(PAL.white,P.glow,.5),gold={c:PAL.goldD,c2:PAL.gold,ch:'s',off:.03};
  // --- robe longue à plis, galon doré, surjupe en pointes, panneau brodé de runes
  const N=16,rr=(y,rx,rz,w)=>ring(N,(a,i)=>{const f=1+(i%2?-w:w);return[S(a)*rx*f,y,C(a)*rz*f];});
  const RB=[rr(.02,.62,.58,.09),rr(.16,.58,.54,.08),rr(.6,.47,.43,.04),rr(1,.38,.33,0),rr(1.3,.42,.33,0),rr(1.56,.46,.31,0),rr(1.72,.2,.2,0)];
  loft(body,RB.slice(0,2),{c:PAL.goldD,ch:'s',cap0:true});loft(body,RB.slice(1),{c:k=>[P.deep,P.dark,P.dark,P.main,P.main,P.dark][k],cap1:true});
  loft(body,[ring(N,(a,i)=>{const t=i%2?.2:0;return[S(a)*(.55+t*.25),.64-t,C(a)*(.51+t*.25)];}),rr(1.02,.4,.35,0)],{c:k=>[P.light,P.main][k]});
  body.group({p:[0,1.01,.375],r:[PI/2-.44,0,0]},b=>{b.add(K.prism([[-.2,0],[.2,0],[.24,.5],[0,.68],[-.24,.5]],.03),{c:P.deep,c2:P.dark}).add(K.box(.46,.04,.06),{p:[0,.02,.03],c:PAL.goldD,c2:PAL.gold,ch:'s'});
    [.17,.34,.5].forEach((z,k)=>b.add(K.oct(.065-k*.01),{p:[0,.036,z],s:[1,.25,1.5],c:P.main,c2:P.glow,ch:'g',jit:0}));});
  for(let i=0;i<N;i+=2){const s=onL(RB,.5,i,.02);body.add(K.oct(.05),{p:s.p,r:s.r,s:[1,.3,1.3],c:P.main,c2:P.glow,ch:'g',jit:0});}                                   // runes serties dans le galon
  // --- ceinture d'or à gemme, crânes en pendeloque
  body.add(K.cyl(.41,.4,.1,N,{open:true}),{p:[0,1.03,0],s:[1,1,.88],c:PAL.goldD,c2:PAL.gold,ch:'s'});SH.gem(body,{p:[0,1.03,.38],s:.2,c:P.main});
  body.sym(sd=>body.group({p:[sd*.34,.86,.27]},b=>{b.add(K.cyl(.012,.012,.2,3),{p:[0,.1,0],c:PAL.ironL}).add(K.dod(.085),{s:[1,1,.9],c:PAL.boneD,c2:PAL.bone});
    for(const x of[-.035,.035])b.add(K.oct(.026),{p:[x,.01,.07],c:P.glow,ch:'g',jit:0});}));
  // --- cuirasse à facettes, chevrons d'or et gemme, épaulières
  const CU=trunk(body,10,[[1.08,.4,.36,.34,0],[1.3,.48,.39,.36,.01],[1.56,.53,.36,.35,.01],[1.7,.26,.24,.24,.01]],k=>K.mix(M[0],M[1],[.15,.5,.9,.5][k]),'s');
  body.sym(sd=>{band(body,CU,2.5,sd*1.7,1.25,0,[0,.16],gold);body.group({s:[sd,1,1]},b=>pauldron(b,el,M,[.52,1.64,0],.72));});
  {const s=onL(CU,1.25,0,.02);SH.gem(body,{p:s.p,s:.15,c:P.glow});}
  for(let i=0;i<10;i++){const s=onL(CU,.25,i+.5,.012);body.add(K.tet(.03),{p:s.p,r:[i,i,0],c:PAL.bronzeL,ch:'s'});}
  // --- cape à grand col, ourlet en pointes, runes brodées dans le dos
  const cp=(y,R,sp,w,zz)=>{const o=[];for(let j=0;j<9;j++){const th=PI+(j/8-.5)*sp,f=1+(j%2?w:-w);o.push([S(th)*R*f,y+(zz&&j%2?zz:0),C(th)*R*f*.92-.04]);}return o;};
  sheet(body,[cp(2.16,.46,1.9,0,.14),cp(1.72,.33,2.3,0),cp(1.4,.52,2.7,.03),cp(.9,.66,2.8,.06),cp(.36,.8,2.7,.09),cp(.1,.9,2.6,.1,.2)],k=>[P.light,P.dark,P.dark,P.dark,P.main,P.light][k]);
  [[1.25,-.55,.1],[.98,-.6,.13],[.72,-.655,.1]].forEach(q=>body.add(K.oct(q[2]),{p:[0,q[0],q[1]],r:[.21,0,0],s:[1,1.5,.22],c:P.main,c2:P.glow,ch:'g',jit:0}));
  // --- tête : masque d'os au long museau, yeux qui brillent dans les orbites, crocs, barbe tressée, oreilles en pointe
  body.add(K.ico(.24,1),{p:[0,1.98,.05],s:[.95,1.12,1],c:P.dark,c2:P.main}).add(K.box(.38,.22,.16,.8,.9),{p:[0,2.06,.2],r:[-.12,0,0],c:PAL.boneD,c2:PAL.bone});
  body.add(K.box(.2,.2,.24,.75,.7),{p:[0,1.93,.3],r:[.35,0,0],c:PAL.boneD,c2:PAL.bone}).add(K.oct(.03),{p:[0,1.9,.43],s:[1.4,1,.6],c:P.deep,jit:0}).add(K.box(.26,.1,.22,.85,.85),{p:[0,1.79,.2],r:[PI,0,0],c:P.dark,c2:P.main});
  body.sym(sd=>{body.add(K.oct(.075),{p:[sd*.1,2.05,.265],s:[1.1,.9,.5],c:PAL.black,jit:0});body.group({p:[sd*.1,2.05,.29],r:[0,0,sd*.3],s:[1.2,.7,.7]},b=>SH.eye(b,{r:.05,glow:P.glow}));
    body.add(K.oct(.018),{p:[sd*.1,2.05,.327],s:[.5,1.5,.4],c:P.deep,ch:'g',jit:0});
    for(const x of[.04,.1,.16])body.add(K.cone(.022,.09,4),{p:[sd*x,1.845,.3-x*.5],r:[PI,0,0],c:PAL.white,jit:0});
    body.add(K.cone(.024,.09,4),{p:[sd*.11,1.83,.27],c:PAL.white,jit:0}).add(K.cone(.04,.2,4),{p:[sd*.2,1.92,.2],r:[PI-.5,0,sd*.3],c:PAL.boneD,c2:PAL.bone});
    body.group({s:[sd,1,1]},b=>b.add(K.prism([[0,0],[.4,.16],[.08,.2]],.04),{p:[.2,1.98,.04],r:[-PI/2,0,0],c:P.dark,c2:P.main}));});
  body.add(K.tube([[0,1.74,.26],[0,1.52,.4],[0,1.3,.44],[0,1.12,.41]],[.075,.065,.045,0],5),{c:K.shade(br,.8),c2:br});
  for(const q of[[1.5,.405,.075],[1.3,.44,.055]])body.add(K.cyl(q[2],q[2],.04,5,{open:true}),{p:[0,q[0],q[1]],r:[.4,0,0],c:PAL.gold,ch:'s'});
  // --- couronne de cornes : bandeau d'or, gemme frontale, six cornes
  body.add(K.cyl(.255,.27,.09,10,{open:true}),{p:[0,2.16,.05],c:PAL.goldD,c2:PAL.gold,ch:'s'});SH.gem(body,{p:[0,2.18,.31],s:.13,c:P.glow});
  body.sym(sd=>[[.55,.4,.34,2.62],[1.5,.52,.5,2.52],[2.5,.42,.36,2.44]].forEach(q=>{const x=sd*S(q[0]),z=C(q[0]);
    body.add(K.tube([[x*.2,2.14,.05+z*.2],[x*.34,2.27,.05+z*.34],[x*q[1],2.4,.05+z*q[1]],[x*q[2],q[3],.05+z*q[2]]],[.06,.052,.036,0],5),{c:hc[0],c2:hc[1]});}));
  // --- bras gauche (pièce animée) : manche, brassard, main serrée sur le bâton-totem
  const SX=.96,SZ=.5;limb(aL,[[.5,1.6,0],[.74,1.3,.1],[.9,1.3,.38]],[.15,.14,.16],7,[P.main,P.dark,P.deep],[0,1,0]);
  aL.add(K.cyl(.17,.18,.14,7),{p:[.84,1.3,.28],r:[PI/2,0,-.52],c:M[0],c2:M[1],ch:'s'}).add(K.dod(.11),{p:[SX-.01,1.31,SZ-.02],c:P.dark,c2:P.main});
  sheet(aL,[[[.7,1.2,.06],[.9,1.2,.4]],[[.74,.84,.2],[.78,.9,.27]]],k=>k?P.main:P.dark);
  aL.add(K.cyl(.045,.055,1.8,6),{p:[SX,1.1,SZ],c:PAL.woodD,c2:PAL.wood}).add(K.cone(.06,.14,6),{p:[SX,.19,SZ],r:[PI,0,0],c:M[0],ch:'s'});
  aL.group({p:[SX,0,SZ]},b=>{for(const y of[.6,1.5])b.add(K.cyl(.066,.066,.07,6,{open:true}),{p:[0,y,0],c:PAL.rope});
    b.add(K.box(.24,.24,.22,.9,.9),{p:[0,1.72,0],c:PAL.woodD,c2:PAL.wood}).add(K.box(.2,.05,.06),{p:[0,1.66,.1],c:PAL.black});                                   // tête du bas : gueule à crocs
    b.add(K.box(.2,.2,.2,.8,.8),{p:[0,1.95,0],c:PAL.wood,c2:PAL.plank}).add(K.cone(.07,.2,4),{p:[0,1.93,.17],r:[PI/2+.4,0,0],c:PAL.goldD,c2:PAL.gold,ch:'s'});     // tête du haut : rapace
    b.sym(sd=>{b.add(K.oct(.04),{p:[sd*.065,1.77,.115],c:P.main,c2:P.glow,ch:'g',jit:0}).add(K.cone(.025,.08,4),{p:[sd*.07,1.675,.13],c:PAL.bone,jit:0}).add(K.oct(.035),{p:[sd*.06,1.99,.1],c:P.main,c2:P.glow,ch:'g',jit:0});
      b.group({s:[sd,1,1]},b=>{b.add(K.prism([[0,0],[.42,.1],[.4,-.04],[.26,-.02],[.24,-.12],[.1,-.08]],.04),{p:[.1,1.96,.02],r:[-PI/2,0,0],c:P.dark,c2:P.light});    // ailes ouvertes
        b.add(K.cyl(.008,.008,.22,3),{p:[.44,1.86,0],c:PAL.rope});leaf(b,{p:[.44,1.76,0],r:[PI,0,0],s:.24,c:P.main,c2:P.glow});                                     // plume en pendeloque
        b.add(K.tube([[.08,2.04,0],[.25,2.14,0],[.23,2.38,0]],[.045,.04,0],5),{c:hc[0],c2:hc[1]});});});                                                           // cornes du sommet
    SH.motif(b,el,{p:[0,2.05,0],s:.75});});
  // --- bras droit (pièce animée) : main ouverte, griffes dressées, l'élément invoqué au creux de la paume
  aR.group({s:[-1,1,1]},b=>{limb(b,[[.5,1.6,0],[.8,1.36,.12],[.92,1.6,.4]],[.15,.14,.13],7,[P.main,P.dark,P.deep],[0,1,0]);
    b.add(K.cyl(.15,.16,.14,7),{p:[.884,1.53,.316],r:[.86,0,-.315],c:M[0],c2:M[1],ch:'s'});sheet(b,[[[.76,1.3,.08],[.9,1.5,.36]],[[.8,.98,.2],[.84,1.06,.28]]],k=>k?P.main:P.dark);
    b.group({p:[.94,1.66,.46],r:[-.9,0,-.2]},b=>{b.add(K.dod(.1),{s:[1,.55,1.1],c:P.dark,c2:P.main});
      for(let k=0;k<4;k++){const u=k-1.5;b.group({p:[u*.05,0,.09],r:[PI/2-.5-Math.abs(u)*.1,0,-u*.3]},b=>b.add(K.cone(.028,.24,4),{p:[0,.12,0],c:P.main,c2:PAL.bone,jit:0}));}
      b.group({p:[-.1,0,0],r:[PI/2-.4,0,1.2]},b=>b.add(K.cone(.028,.16,4),{p:[0,.08,0],c:P.main,c2:PAL.bone,jit:0}));});
    SH.motif(b,el,{p:[.94,1.76,.52],s:.42});});
  // --- anneau de pierres runiques (pièce animée, tourne autour de la taille) : huit menhirs gravés reliés par un cercle de lumière
  rg.add(K.torus(1.32,.018,3,24),{p:[0,1.02,0],r:[PI/2,0,0],c:P.main,c2:P.glow,ch:'g',jit:0});
  for(let i=0;i<8;i++){const a=i/8*TAU,st=[PAL.stone,PAL.stoneL,PAL.stoneD][i%3],g={c:P.main,c2:P.glow,ch:'g',jit:0};
    rg.group({p:[S(a)*1.32,1.02+(i%2?.07:-.05),C(a)*1.32],r:[(i%3-1)*.12,a,i%2?.1:-.08]},b=>{b.add(K.box(.26,.5,.15,.72,.8),{c:K.shade(st,.82),c2:st,jit:.08}).add(K.box(.2,.1,.13,.8,.8),{p:[.02,-.29,0],r:[PI,0,.2],c:K.shade(st,.8)});
      for(const z of[.078,-.078]){const q=i%4;if(q===0)b.add(K.oct(.07),Object.assign({p:[0,.02,z],s:[1,1.5,.2]},g));
        else if(q===1)b.add(K.box(.03,.22,.02),Object.assign({p:[0,.04,z]},g)).add(K.oct(.03),Object.assign({p:[0,-.13,z],s:[1,1,.4]},g));
        else if(q===2)for(const t of[-.6,.6])b.add(K.box(.03,.16,.02),Object.assign({p:[t*.07,.03,z],r:[0,0,t]},g));
        else b.add(K.box(.03,.22,.02),Object.assign({p:[0,.02,z]},g)).add(K.box(.14,.03,.02),Object.assign({p:[0,.06,z]},g));}});}
  for(let i=0;i<8;i++){const a=(i+.5)/8*TAU;rg.add(K.tet(.05),{p:[S(a)*1.3,1.02+(i%2?-.12:.14),C(a)*1.3],r:[a,i,0],c:PAL.stoneD,c2:PAL.stoneL});}
  // --- la marque de l'élément : veines au bas de la robe, pointes dans le dos, détails sur la cuirasse
  for(let i=0;i<4;i++){const u=2.6+i*3.6;vein(body,el,RB,[[1.05,u],[1.4,u+.4],[1.8,u-.2],[2.15,u+.2]],[0,.1]);}
  body.sym(sd=>{spire(body,el,{p:[sd*.3,1.66,-.3],r:[-.6,0,-sd*.35],s:.75});const s=onL(CU,1.6,sd*1.5,0);stud(body,el,{p:s.p,r:s.r,s:1.3});});
  return{parts:[{name:'body',b:body},{name:'armL',b:aL,parent:'body',pivot:[.5,1.58,0],anim:[{k:'rot',axis:'x',amp:.26,sp:2.5}]},{name:'armR',b:aR,parent:'body',pivot:[-.5,1.58,0],anim:[{k:'rot',axis:'x',amp:.3,sp:2.5,ph:PI}]},
      {name:'ring',b:rg,parent:'body',pivot:[0,1.02,0],anim:[{k:'rot',axis:'y',spin:true,sp:.8}]}],
    bake:{ground:.2,groundH:.7},scale:.92,barY:2.55,r:1,ringR:1.21};};

// ================================================================ BOSS 3 — LE TITAN DES CINQ : colosse aux jambes de piliers, cœur lumineux, couronne aux cinq gemmes, les cinq éléments en orbite
const ELS=['feu','eau','bois','terre','elec'];
MODELS['boss.3']=ctx=>{const P=ctx.P,el=ctx.el,Z=.875,ST=[K.mix(PAL.stoneD,P.dark,.4),K.mix(PAL.stoneL,P.light,.35)],SM=K.mix(PAL.stone,P.main,.35),GD=[PAL.goldD,PAL.gold],body=K.make(61),aL=K.make(62),aR=K.make(63),ob=K.make(64),ht=K.make(65),gl={c:P.main,c2:P.glow,ch:'g',jit:0},HP=[0,1.64,.6];
  body.group({s:Z},()=>{
  // --- jambes comme des piliers : socle de blocs, orteils ferrés d'or, base, fût cannelé, bandeau de runes, chapiteau
  body.sym(sd=>body.group({s:[sd,1,1]},b=>{const X=.42;SH.blockWall(b,{p:[X,0,.04],w:.66,h:.22,d:.72,rows:2,cols:3,c:SM});
    for(const j of[-1,0,1])b.add(K.box(.17,.17,.22,.85,.7),{p:[X+j*.2,.085,.48],c:ST[0],c2:SM}).add(K.cone(.06,.16,4),{p:[X+j*.2,.07,.63],r:[1.7,0,0],c:GD[0],c2:GD[1],ch:'s'});
    b.add(K.cyl(.32,.36,.1,10),{p:[X,.27,0],c:ST[0],c2:SM});
    const F=[.32,.66,1].map((y,k)=>ring(12,(a,i)=>{const r=[.28,.262,.28][k]*(i%2?.9:1);return[X+S(a)*r,y,C(a)*r];}));loft(b,F,{c:k=>[ST[0],SM,ST[1]][k]});
    b.add(K.cyl(.3,.3,.11,12,{open:true}),{p:[X,.66,0],c:PAL.stoneDD,c2:ST[0]});
    for(let i=0;i<6;i++){const a=i/6*TAU+.26;b.add(K.oct(.045),Object.assign({p:[X+S(a)*.305,.66,C(a)*.305],r:[0,a,0],s:[1,1.1,.3]},gl));}
    b.add(K.cyl(.37,.29,.12,10),{p:[X,1.02,0],c:SM,c2:ST[1]}).add(K.box(.7,.08,.7),{p:[X,1.11,0],c:ST[1]});
    vein(b,el,F,[[.1,1.2],[.6,1.9],[1.2,1.3],[1.9,1.8]],[0,.14]);vein(b,el,F,[[.2,4.4],[.9,5.1],[1.8,4.5]],[0,.14]);
    const s=onL(F,1.5,3,0);stud(b,el,{p:s.p,r:s.r,s:1.6});}));
  // --- bassin : ceinture de blocs de pierre, médaillon d'or aux cinq éléments, tassettes gravées
  SH.bricks(body,{r:.6,h:.2,rows:1,n:10,y:1.14,d:.2,c:SM});
  body.group({p:[0,1.24,.6]},b=>{b.add(K.cyl(.19,.19,.06,10),{r:[PI/2,0,0],c:GD[0],c2:GD[1],ch:'s'});
    ELS.forEach((e,i)=>{const a=i/5*TAU;b.add(K.oct(.04),{p:[S(a)*.115,C(a)*.115,.035],s:[1,1,.5],c:EL[e].main,c2:EL[e].glow,ch:'g',jit:0});});b.add(K.oct(.05),Object.assign({p:[0,0,.04],s:[1,1,.5]},gl));});
  for(const z of[.38,-.38])body.add(K.box(.36,.44,.08,.7,1),{p:[0,.93,z],r:[PI+(z>0?-.12:.12),0,0],c:ST[0],c2:ST[1]});
  body.add(K.oct(.07),Object.assign({p:[0,.95,.435],s:[1,1.5,.25]},gl));
  // --- torse : cœur serti dans sa couronne de roche et ses griffes d'or, côtes, poitrail, plaques du ventre, dalle dorsale aux cinq runes
  const TR=trunk(body,12,[[1.06,.5,.44,.42,0],[1.2,.54,.46,.44,0],[1.42,.64,.48,.46,.02],[1.66,.84,.5,.5,.04],[1.86,.8,.42,.46,.05],[1.98,.36,.3,.32,.06]],
    (k,i)=>K.mix([P.dark,P.dark,P.main,P.main,P.main,P.dark][k],P.light,k>0&&k<5&&(i===0||i===11)?.4:0));
  body.group({p:[0,1.64,.53]},b=>{b.add(K.cyl(.27,.27,.06,10),{r:[PI/2,0,0],c:PAL.black,c2:P.deep}).add(K.torus(.28,.065,5,10),{p:[0,0,.04],c:ST[0],c2:ST[1]});
    for(let i=0;i<5;i++){const a=i/5*TAU+.63;b.add(K.box(.09,.13,.1,.7,.8),{p:[S(a)*.3,C(a)*.3,.08],r:[0,0,PI-a],c:GD[0],c2:GD[1],ch:'s'});}});
  body.sym(sd=>{const u=x=>sd>0?x:12-x;for(const kv of[2.45,2.85,3.25])band(body,TR,kv,u(.95),kv+.12,u(2.4),[.09,0],{c:ST[1],c2:SM,off:.03});
    vein(body,el,TR,[[2.3,u(1)],[1.6,u(1.4)],[.9,u(.9)],[.2,u(1.3)]],[0,.1]);vein(body,el,TR,[[3.6,u(1.3)],[4.2,u(1.8)],[4.8,u(1.5)]],[0,.1]);vein(body,el,TR,[[4.5,u(4.3)],[3.5,u(4.7)],[2.4,u(4.3)],[1.2,u(4.8)]],[0,.1]);
    for(const q of[[2.2,2.6],[3.4,3.6],[1.4,4]]){const s=onL(TR,q[0],u(q[1]),0);stud(body,el,{p:s.p,r:s.r,s:1.7});}
    body.group({s:[sd,1,1]},b=>pauldron(b,el,ST,[.9,1.9,.02],1.2));spire(body,el,{p:[sd*.36,1.92,-.38],r:[-.6,0,-sd*.4],s:.7});});
  body.add(K.box(.9,.16,.16,.9,.8),{p:[0,1.9,.36],r:[-.35,0,0],c:SM,c2:ST[1]});
  [[1.4,.5,.42],[1.27,.475,.36]].forEach(q=>body.add(K.box(q[2],.12,.1,.9,.9),{p:[0,q[0],q[1]],c:ST[0],c2:SM}).add(K.tet(.035),{p:[0,q[0],q[1]+.06],c:GD[1],ch:'s'}));
  body.add(K.box(.86,.62,.12,.8,.85),{p:[0,1.6,-.48],r:[.08,0,0],c:ST[0],c2:ST[1]});
  ELS.forEach((e,i)=>{const a=i/5*TAU;body.add(K.oct(.06),{p:[S(a)*.2,1.6+C(a)*.2,-.55],s:[1,1.4,.3],c:EL[e].main,c2:EL[e].glow,ch:'g',jit:0});});
  spire(body,el,{p:[0,2,-.32],r:[-.5,0,0],s:.9});
  // --- tête casquée : yeux qui brillent sous la visière, nasal, mâchoire à dents de pierre, col
  body.add(K.cyl(.3,.36,.12,10),{p:[0,1.99,.06],c:ST[0],c2:SM}).add(K.ico(.26,1),{p:[0,2.16,.1],s:[1,1.08,1],c:P.dark,c2:P.main});
  body.add(K.box(.5,.1,.2,.9,.75),{p:[0,2.28,.27],r:[.2,0,0],c:SM,c2:ST[1]}).add(K.box(.08,.26,.1,.8,.8),{p:[0,2.17,.36],c:SM,c2:ST[1]});
  body.add(K.box(.36,.16,.22,.85,.85),{p:[0,1.98,.24],r:[PI,0,0],c:ST[0],c2:SM}).add(K.box(.3,.07,.06),{p:[0,2.055,.345],c:PAL.black});
  body.sym(sd=>{body.add(K.box(.1,.34,.3,.85,.9),{p:[sd*.25,2.13,.12],c:ST[0],c2:ST[1]});
    body.group({p:[sd*.115,2.18,.33],r:[0,0,sd*.25],s:[1.2,.7,.7]},b=>SH.eye(b,{r:.055,glow:P.glow}));body.add(K.oct(.02),{p:[sd*.115,2.18,.372],s:[.5,1.5,.4],c:P.deep,ch:'g',jit:0});
    for(const x of[.045,.125])body.add(K.box(.06,.07,.05,.8,.8),{p:[sd*x,2.085,.365],r:[PI,0,0],c:PAL.bone,jit:0}).add(K.box(.06,.06,.05,.8,.8),{p:[sd*(x+.04),2.025,.37],c:PAL.bone,jit:0});});
  // --- couronne aux cinq gemmes des cinq éléments (celle de l'élément du moment, plus grosse, au front)
  body.add(K.cyl(.28,.3,.1,10,{open:true}),{p:[0,2.37,.1],c:GD[0],c2:GD[1],ch:'s'});
  const i0=Math.max(0,ELS.indexOf(el));
  for(let i=0;i<5;i++){const e=ELS[(i0+i)%5],a=i/5*TAU,f=i?1:1.35;body.group({p:[S(a)*.29,2.4,.1+C(a)*.29],r:[0,a,0]},b=>
      b.add(K.box(.12,.18*f,.07,.25,1),{p:[0,.09*f,0],c:GD[0],c2:GD[1],ch:'s'}).add(K.oct(.07*f),{p:[0,.18*f+.05,0],s:[1,1.45,1],c:EL[e].main,c2:EL[e].glow,ch:'g',jit:.12}));}
  });
  // --- le cœur (pièce animée qui bat) : gemme à facettes et ses cinq rayons, aux couleurs de l'élément du moment
  ht.group({s:Z},()=>{ht.add(K.dod(.17),{p:HP,c:P.main,c2:P.glow,ch:'g',jit:.16});
    for(let i=0;i<5;i++){const a=i/5*TAU;ht.add(K.cone(.045,.16,4),{p:[HP[0]+S(a)*.2,HP[1]+C(a)*.2,HP[2]+.01],r:[0,0,-a],c:P.main,c2:P.glow,ch:'g',jit:0});}});
  // --- bras (pièces animées) : biceps, coude de pierre, gantelet cannelé cerclé d'or et de runes, poing ferré d'or
  const arm=b=>{const U=limb(b,[[.94,1.86,0],[1.05,1.58,0],[1.09,1.34,0]],[.27,.26,.2],8,[P.main,P.main,P.dark],[0,0,1]);
    b.add(K.dod(.21),{p:[1.1,1.32,-.02],c:ST[0],c2:ST[1]});
    const G=sweep([[1.09,1.3,0],[1.09,1.05,.06],[1.09,.8,.15]],12,(k,a,i)=>[.22,.3,.31][k]*(i%2?.92:1),[0,0,1]);loft(b,G,{c:k=>[ST[0],SM,ST[1]][k],cap0:true,cap1:true});
    for(const q of[[1.2,.02,.275],[.86,.13,.325]])b.add(K.cyl(q[2],q[2],.07,12,{open:true}),{p:[1.09,q[0],q[1]],r:[.33,0,0],c:GD[0],c2:GD[1],ch:'s'});
    for(let i=0;i<6;i++){const s=onL(G,1,i*2,.012);b.add(K.oct(.045),Object.assign({p:s.p,r:s.r,s:[1,.3,1.3]},gl));}
    fist(b,{p:[1.09,.56,.22],r:[.3,0,0],s:1.12,c:P.dark,c2:P.main,m:GD});
    vein(b,el,U,[[.2,6.2],[1,5.6],[1.8,6.3]],[0,.13]);const s=onL(G,.5,7,0);stud(b,el,{p:s.p,r:s.r,s:1.6});};
  aL.group({s:Z},arm);aR.group({s:[-Z,Z,Z]},arm);
  // --- les cinq éléments en orbite (pièce animée) : chaque marque sur son socle de pierre flottant, suivie d'une traînée de lumière
  const OR=1.9/Z;ELS.forEach((e,i)=>ob.group({r:[0,i/5*TAU,0],s:Z},b=>{const E=EL[e];
    b.add(K.cyl(.2,.11,.14,6),{p:[0,1.5,OR],c:PAL.stoneD,c2:PAL.stoneL}).add(K.cyl(.215,.215,.04,6,{open:true}),{p:[0,1.55,OR],c:GD[0],c2:GD[1],ch:'s'}).add(K.cone(.09,.16,4),{p:[0,1.36,OR],r:[PI,0,0],c:PAL.stoneDD,c2:PAL.stoneD});
    SH.motif(b,e,{p:[0,1.57,OR],s:.95});
    b.group({r:[0,-PI/2,0]},b=>b.add(K.torus(OR,.022,3,6,.55),{p:[0,1.5,0],r:[PI/2,0,0],c:E.main,c2:E.glow,ch:'g',jit:0}));}));
  return{parts:[{name:'body',b:body},{name:'heart',b:ht,parent:'body',pivot:[HP[0]*Z,HP[1]*Z,HP[2]*Z],anim:['x','y','z'].map(axis=>({k:'scl',axis,amp:.1,sp:3.2}))},
      {name:'armL',b:aL,parent:'body',pivot:[.94*Z,1.84*Z,0],anim:[{k:'rot',axis:'x',amp:.3,sp:2.5}]},{name:'armR',b:aR,parent:'body',pivot:[-.94*Z,1.84*Z,0],anim:[{k:'rot',axis:'x',amp:.3,sp:2.5,ph:PI}]},
      {name:'orbs',b:ob,parent:'body',pivot:[0,1.55*Z,0],anim:[{k:'rot',axis:'y',spin:true,sp:1.1}]}],
    bake:{ground:.2,groundH:.7},scale:1,barY:2.85,r:1.05,orbR:1.9};};
}

// L'INCENDIAIRE (V9.3) — attaquant spécial du type Feu : le lutin de base, plus gros, avec une hotte de braises sur le dos, deux cornes et une torche. Bâti sur le modèle de référence.
{
const {PAL}=K;
MODELS['enemy.inc']=ctx=>{const m=MODELS['enemy.b'](ctx),P=ctx.P,body=m.parts[0].b,arms=m.parts[1].b,dk=K.mix(P.deep,PAL.black,.55);
  body.add(K.cyl(.34,.26,.7,7),{p:[0,1.2,-.62],r:[-.18,0,0],c:dk});                              // la hotte
  body.add(K.cyl(.37,.37,.08,7),{p:[0,1.56,-.68],r:[-.18,0,0],c:PAL.bone,jit:0});                 // son cerclage
  body.add(K.ico(.3,0),{p:[0,1.66,-.7],c:P.glow,jit:0});                                         // les braises
  for(const a of[[-.12,.5],[.14,.62],[0,.8]])body.add(K.cone(.11,a[1],5),{p:[a[0],1.8+a[1]/2,-.72],c:P.glow,c2:P.light,jit:0});   // les flammes
  body.sym(sd=>body.add(K.cone(.09,.42,5),{p:[sd*.34,2.42,-.05],r:[0,0,-sd*.5],c:dk,jit:0}));     // deux cornes
  arms.add(K.cyl(.045,.045,.8,5),{p:[.93,.85,.3],r:[.5,0,0],c:PAL.bone});                        // la torche, dans la main droite
  arms.add(K.cone(.13,.36,5),{p:[.93,1.32,.52],r:[.5,0,0],c:P.glow,c2:P.light,jit:0});
  m.scale=1.08;m.barY=3.1;m.r=.9;return m;};
}

// LES AUTRES ATTAQUANTS SPÉCIAUX DE LA CAMPAGNE (V9.4), tous bâtis sur le lutin de base sauf la Graine.
{
const {PAL}=K,base=ctx=>{const m=MODELS['enemy.b'](ctx);return{m,P:ctx.P,body:m.parts[0].b,arms:m.parts[1].b};};
// le Soigneur (Eau) : une auréole, une grosse goutte claire sur le dos, un orbe de soin dans la main
MODELS['enemy.soi']=ctx=>{const{m,P,body,arms}=base(ctx);
  body.add(K.torus(.46,.055,5,14),{p:[0,2.95,-.02],r:[Math.PI/2,0,0],c:P.glow,jit:0});
  body.add(K.ico(.36,1),{p:[0,1.35,-.62],s:[1,1.25,1],c:P.light,c2:P.glow});body.add(K.cone(.2,.45,6),{p:[0,1.95,-.62],c:P.light,jit:0});
  arms.add(K.ico(.24,1),{p:[.93,.5,.45],c:P.glow,jit:0});m.barY=3.3;return m;};
// le Brouilleur (Élec) : une antenne à trois branches sur la tête, un boîtier sombre sur le dos
MODELS['enemy.bro']=ctx=>{const{m,P,body}=base(ctx),dk=K.mix(P.deep,PAL.black,.5);
  body.add(K.box(.62,.66,.34),{p:[0,1.25,-.62],c:dk});body.add(K.box(.3,.12,.06),{p:[0,1.4,-.81],c:P.glow,jit:0});
  body.add(K.cyl(.035,.045,.95,5),{p:[0,2.95,-.1],c:PAL.bone});body.add(K.oct(.17),{p:[0,3.52,-.1],c:P.glow,jit:0});
  body.sym(sd=>{body.add(K.cyl(.025,.025,.5,4),{p:[sd*.22,3.1,-.1],r:[0,0,-sd*.9],c:PAL.bone});body.add(K.oct(.09),{p:[sd*.43,3.27,-.1],c:P.light,jit:0});});
  m.barY=3.8;return m;};
// le Golem (Terre) : le lutin en très gros, des rochers sur les épaules, le dos et la tête
MODELS['enemy.gol']=ctx=>{const{m,body}=base(ctx);
  body.sym(sd=>body.add(K.rock(.46,7,1),{p:[sd*.78,1.62,-.05],c:PAL.stone,c2:PAL.stoneD}));
  body.add(K.rock(.55,11,1),{p:[0,1.35,-.55],c:PAL.stoneD,c2:PAL.stoneDD});body.add(K.rock(.34,5,1),{p:[0,2.5,-.05],c:PAL.stoneL,c2:PAL.stone});
  m.scale=1.75;m.barY=5.7;m.r=1.5;return m;};
// l'Éclat (Terre) : un petit lutin coiffé d'un caillou
MODELS['enemy.ecl']=ctx=>{const{m,body}=base(ctx);body.add(K.rock(.3,3,1),{p:[0,2.4,-.05],c:PAL.stoneL,c2:PAL.stone});m.scale=.55;m.barY=1.95;m.r=.5;return m;};
// le Semeur (Bois) : une pousse à deux feuilles sur la tête, un sac de graines sur le dos
MODELS['enemy.sem']=ctx=>{const{m,P,body}=base(ctx);
  body.add(K.cyl(.035,.05,.5,5),{p:[0,2.6,-.05],c:P.light});body.sym(sd=>body.add(K.cone(.16,.5,4),{p:[sd*.2,2.95,-.05],r:[0,0,-sd*1],c:P.glow,c2:P.light,jit:0}));
  body.add(K.ico(.4,1),{p:[0,1.25,-.62],s:[1,1.15,.9],c:PAL.woodL,c2:PAL.wood});for(const a of[[-.14,1.62],[.12,1.66],[0,1.72]])body.add(K.ico(.12,0),{p:[a[0],a[1],-.62],c:P.glow,jit:0});
  m.barY=3.3;return m;};
// le Tourbillon (Vent, V2.2) : le lutin pris dans une colonne de vent qui tourne autour de lui, un entonnoir sur le dos
MODELS['enemy.tou']=ctx=>{const{m,P,body}=base({el:'vent',P:ctx.P}),sw=K.make(78);
  body.add(K.cone(.42,.9,7),{p:[0,1.3,-.66],r:[Math.PI,0,0],c:P.light,c2:P.glow});
  for(let i=0;i<3;i++)sw.add(K.torus(.85+i*.22,.05,4,16),{p:[0,.6+i*.75,0],r:[Math.PI/2+(i-1)*.18,0,(i-1)*.25],c:i%2?P.glow:P.light,jit:0});
  m.parts.push({name:'swirl',b:sw,parent:'body',pivot:[0,0,0],anim:[{k:'rot',axis:'y',spin:true,sp:5}]});m.barY=3.4;return m;};
// la Graine (Bois) : une grosse graine posée au sol, d'où sort une pousse
MODELS['enemy.gra']=ctx=>{const P=ctx.P,body=K.make(77);
  body.add(K.ico(.5,1),{p:[0,.5,0],s:[1,1.3,1],c:PAL.woodL,c2:PAL.wood,ao:.15});body.add(K.cyl(.045,.06,.55,5),{p:[0,1.35,0],c:P.light});
  body.sym(sd=>body.add(K.cone(.17,.5,4),{p:[sd*.2,1.72,0],r:[0,0,-sd*1],c:P.glow,c2:P.light,jit:0}));
  return{parts:[{name:'body',b:body,pivot:[0,0,0],anim:[{k:'rot',axis:'z',amp:.08,sp:5}]}],bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:1,barY:2.4,r:.6};};
}
