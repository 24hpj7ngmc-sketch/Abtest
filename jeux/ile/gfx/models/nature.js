// VÉGÉTATION ET ÉLÉMENTS NATURELS de L'Île des Cinq : arbres, sous-bois, roches, mer et ciel (modèles « nat.* »).
// Objets fixes d'un seul canal (m), semés par centaines : la richesse vient des silhouettes, des dégradés et de la variation par face.
{
const {PAL,TAU}=K,PI=Math.PI,mix=K.mix,shade=K.shade,sin=Math.sin,cos=Math.cos;
// ------------------------------------------------------------------ aides locales
// maillage libre au format des formes du kit : F = polygones convexes [[p0,p1,p2,…],…], sens anti-horaire vus de dehors.
// o.dbl : visibles des deux côtés · o.from : point intérieur → chaque facette est retournée au besoin pour regarder vers l'extérieur
const mesh=(F,o={})=>{const v=[];for(let f of F){if(o.from){const a=f[0],b=f[1],c=f[2],q=o.from,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
      if((uy*vz-uz*vy)*(a[0]-q[0])+(uz*vx-ux*vz)*(a[1]-q[1])+(ux*vy-uy*vx)*(a[2]-q[2])<0)f=f.slice().reverse();}
    for(const x of K.face(f,o).v)v.push(x);}return{v,n:null};};
// peau tendue entre des anneaux de points, du bas vers le haut (chaque anneau tourne de +Z vers +X, comme K.cyl ; un anneau d'un seul point = pointe). o.open : bande non refermée
const loft=(R,o={})=>{const F=[];for(let k=0;k<R.length-1;k++){const L=R[k],U=R[k+1],n=Math.max(L.length,U.length),m=o.open?n-1:n;for(let i=0;i<m;i++){const j=(i+1)%n;
      if(U.length===1)F.push([U[0],L[i],L[j]]);else if(L.length===1)F.push([U[i],L[0],U[j]]);else F.push([U[i],L[i],L[j]],[U[i],L[j],U[j]]);}}
  if(o.capT)F.push(R[R.length-1]);if(o.capB)F.push(R[0].slice().reverse());return mesh(F,o);};
const pol=(a,r,y)=>[sin(a)*r,y,cos(a)*r];                                    // point autour de l'axe Y (a = 0 → +Z)
const lp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);                                // point entre deux points
// tronc : anneaux horizontaux [y, rayon, x, z] du bas vers le haut, un peu irréguliers et vrillés
const stem=(rnd,seg,L,o={})=>loft(L.map((q,k)=>{const R=[];for(let i=0;i<seg;i++){const a=k*.4+i/seg*TAU,r=q[1]*(1+(rnd()-.5)*(o.w===undefined?.14:o.w));R.push([(q[2]||0)+sin(a)*r,q[0],(q[3]||0)+cos(a)*r]);}return R;}),o);
// racines apparentes : n arêtes qui descendent du tronc (rayon r, à la hauteur h) et s'enfoncent dans le sol à la distance len
const roots=(b,n,r,h,len,c,c2,o={})=>{for(let i=0;i<n;i++){const a=(o.a0||0)+(i+(b.rnd()-.5)*.5)/n*TAU,l=len*(.65+b.rnd()*.7),hh=h*(.7+b.rnd()*.6),d=o.w||.5,da=(b.rnd()-.5)*.5,
    T=pol(a,r*.7,hh),M=pol(a+da*.4,r+l*.36,hh*.4),E=pol(a+da,r+l,-.07),BL=pol(a-d,r*1.02,-.05),BR=pol(a+d,r*1.02,-.05);
    b.add(mesh([[T,BL,M],[M,BL,E],[T,M,BR],[M,E,BR]],{from:pol(a,r+l*.3,-.3)}),{c,c2,jit:.07});}};
// étage de conifère : jupe étoilée. n pointes (rayon R, tombant de dr) alternées avec n creux (rayon R·k) ; sommet à +h.
// sh > 0 : épaule intermédiaire (profil en ombrelle). Renvoie [dessus, dessous] : le dessous (entonnoir rentrant) se voit quand on passe sous l'arbre
const tier=(rnd,n,R,h,dr,k,sh=0)=>{const A=[0,h,0],C=[0,h*.35,0],V=[],S=[],T=[],U=[];
  for(let i=0;i<2*n;i++){const tip=i%2===0,a=(i+(tip?(rnd()-.5)*.5:0))/(2*n)*TAU,r=tip?R*(.84+rnd()*.3):R*k*(.9+rnd()*.2);V.push(pol(a,r,tip?-dr*(.55+rnd()*.9):0));if(tip)S.push(pol(a,r*sh,h*.42));}
  for(let i=0;i<2*n;i++){const j=(i+1)%(2*n);U.push([C,V[j],V[i]]);if(!sh)T.push([A,V[i],V[j]]);}
  if(sh)for(let i=0;i<n;i++){const j=(i+1)%n,t0=V[2*i],va=V[2*i+1],t1=V[(2*i+2)%(2*n)];T.push([A,S[i],S[j]],[S[i],t0,va],[S[i],va,S[j]],[S[j],va,t1]);}
  return[mesh(T),mesh(U)];};
// masse arrondie à facettes (feuillage, mousse, nuage) de rayon ≈ 1 : icosphère d = 0 (20 faces) ou 1 (80), ou octasphère d = 'o' (32), tournée et bosselée selon la graine.
// cut : tout ce qui est sous y = cut est aplati sur ce plan (base plate), le dessous étant refait en éventail (cap = false : pas de dessous, pour ce qui est posé au sol)
const blob=(seed,d=0,rough=.18,cut=-9,cap=true)=>{const v=(d==='o'?K.oct(1,1):K.ico(1,d)).v,rnd=K.rng(seed*31+7),m=K.trs([0,0,0],[rnd()*TAU,rnd()*TAU,rnd()*TAU]),P=[],F=[],C=[0,cut,0];
  for(let i=0;i<v.length;i+=3){const k=1+rough*K.hash3(Math.round(v[i]*1e3),Math.round(v[i+1]*1e3),Math.round(v[i+2]*1e3),seed),x=v[i]*k,y=v[i+1]*k,z=v[i+2]*k;
    P.push([m[0]*x+m[1]*y+m[2]*z,Math.max(cut,m[4]*x+m[5]*y+m[6]*z),m[8]*x+m[9]*y+m[10]*z]);}
  for(let i=0;i<P.length;i+=3){const T=[P[i],P[i+1],P[i+2]],lo=T.map(p=>p[1]<=cut);if(lo[0]&&lo[1]&&lo[2])continue;F.push(T);
    if(cap)for(let e=0;e<3;e++)if(lo[e]&&lo[(e+1)%3])F.push([T[(e+1)%3],T[e],C]);}
  return mesh(F);};
// couture entre deux couronnes de tailles différentes (L en bas, U en haut, rangées par angle croissant ; oL, oU : décalages de phase)
const stitch=(F,L,U,oL=0,oU=0)=>{const nL=L.length,nU=U.length;let i=0,j=0;while(i<nU||j<nL){const pu=(i+1+oU)/nU,pl=(j+1+oL)/nL;
    if(i>=nU||(j<nL&&pl<=pu)){F.push([U[i%nU],L[j%nL],L[(j+1)%nL]]);j++;}else{F.push([U[i%nU],L[j%nL],U[(i+1)%nU]]);i++;}}};
// masse de feuillage économe (rayon ≈ 1, du sommet y = 1 à l'équateur y = 0) : sommet, couronne haute (n1 points), couronne large (n2 points).
// Renvoie [dôme, dessous] : le dessous est un cône plat de profondeur `under`, ou une couronne basse de n3 points + fond (masse plus ronde ; fan = false : sans fond, pour ce qui est posé au sol)
const puff=(seed,n1=5,n2=8,rough=.16,under=-.4,n3=0,fan=true)=>{const rnd=K.rng(seed*13+5),j=()=>1+(rnd()*2-1)*rough,A=rnd()*TAU,F=[],G=[],T=[(rnd()-.5)*.35,j(),(rnd()-.5)*.35],R1=[],R2=[],R3=[];
  for(let i=0;i<n1;i++)R1.push(pol(A+(i+(rnd()-.5)*.4)/n1*TAU,.68*j(),.66*j()));
  for(let i=0;i<n2;i++)R2.push(pol(A+(i-.5+(rnd()-.5)*.4)/n2*TAU,j(),(rnd()-.5)*.3));
  for(let i=0;i<n1;i++)F.push([T,R1[i],R1[(i+1)%n1]]);stitch(F,R2,R1,-.5,0);
  const B=[(rnd()-.5)*.2,under,(rnd()-.5)*.2];let L=R2;if(n3){for(let i=0;i<n3;i++)R3.push(pol(A+(i+(rnd()-.5)*.4)/n3*TAU,.62*j(),under*.62*j()));stitch(G,R3,R2,0,-.5);L=R3;}
  if(fan)for(let i=0;i<L.length;i++)G.push([B,L[(i+1)%L.length],L[i]]);
  return[mesh(F),mesh(G)];};
// enveloppe convexe d'un nuage de points → grandes facettes planes (roches anguleuses). noB : sans les faces tournées vers le sol (cachées)
const hull=(V,noB)=>{const N=V.length,F=[],seen={},sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)for(let k=j+1;k<N;k++){let n=cr(sub(V[j],V[i]),sub(V[k],V[i]));const l=Math.hypot(n[0],n[1],n[2]);if(l<1e-9)continue;n=n.map(x=>x/l);
    const d=dt(n,V[i]),on=[];let pos=0,neg=0;for(let q=0;q<N&&!(pos&&neg);q++){const e=dt(n,V[q])-d;if(e>1e-6)pos++;else if(e<-1e-6)neg++;else on.push(q);}
    if(pos&&neg)continue;if(pos)n=n.map(x=>-x);const key=on.join(',');if(seen[key])continue;seen[key]=1;if(noB&&n[1]<-.85)continue;
    const c=[0,0,0];for(const q of on)for(let a=0;a<3;a++)c[a]+=V[q][a]/on.length;const u=sub(V[on[0]],c),ul=Math.hypot(u[0],u[1],u[2]),ux=u.map(x=>x/ul),vx=cr(n,ux),ang=q=>Math.atan2(dt(sub(V[q],c),vx),dt(sub(V[q],c),ux)),P=on.slice().sort((p,q)=>ang(p)-ang(q)).map(q=>V[q]);
    for(let ch=true;ch&&P.length>3;){ch=false;for(let q=0;q<P.length;q++){const a=P[(q+P.length-1)%P.length],m=P[q],e=P[(q+1)%P.length];if(dt(cr(sub(m,a),sub(e,m)),n)<=1e-9){P.splice(q,1);ch=true;break;}}}   // sommets saillants seulement
    F.push(P);}
  return mesh(F);};
// bloc de roche (rayon ≈ 1) : n points semés sur une sphère, rabotés par des plans [nx,ny,nz,distance] qui taillent de grandes facettes ; coupé au ras du sol en y = y0 (dessous ouvert)
const cragPts=(seed,n,cuts=[],y0=-.5)=>{const rnd=K.rng(seed*17+3),V=[];
  for(let i=0;i<n;i++){const u=rnd()*2-1,a=rnd()*TAU,r=Math.sqrt(1-u*u),k=.84+rnd()*.3;let p=[cos(a)*r*k,u*k,sin(a)*r*k];
    for(const c of cuts){const l=Math.hypot(c[0],c[1],c[2]),e=(p[0]*c[0]+p[1]*c[1]+p[2]*c[2])/l-c[3];if(e>0)p=[p[0]-e*c[0]/l,p[1]-e*c[1]/l,p[2]-e*c[2]/l];}
    if(p[1]<y0)p[1]=y0;V.push(p);}
  return V;};
const crag=(seed,n,cuts,y0)=>hull(cragPts(seed,n,cuts,y0),true);
// nuances : écorces (assez claires pour rester lisibles à l'ombre des feuillages), verts de conifère
// brins d'herbe : n lames pointues en éventail autour de (x,z), hautes de h, visibles des deux côtés (2 triangles par brin)
const tuft=(b,x,z,n,h,c,c2,sp=.5,y=-.03)=>{const F=[];for(let i=0;i<n;i++){const a=(i+b.rnd()*.7)/n*TAU,hh=h*(.55+.45*b.rnd()),l=hh*sp*(.4+b.rnd()),w=.02+.02*b.rnd(),r0=.02+.04*b.rnd(),sx=sin(a),cx=cos(a);
    F.push([[x+sx*r0+cx*w,y,z+cx*r0-sx*w],[x+sx*r0-cx*w,y,z+cx*r0+sx*w],[x+sx*(r0+l),y+hh,z+cx*(r0+l)]]);}
  b.add(mesh(F,{dbl:true}),{c,c2,jit:.14});};
const GRASS_D=mix(PAL.grass,PAL.leafD,.35),GRASS_L=mix(PAL.grassL,PAL.gold,.14);
// roche : granit chaud, plus clair sur le dessus
const ROCK=shade(mix(PAL.stone,PAL.sand,.3),.86),ROCKD=mix(PAL.stoneD,PAL.dirt,.3),ROCKL=shade(mix(PAL.stone,PAL.sand,.38),.96),MOSS_D=mix(PAL.moss,PAL.leafD,.35),MOSS_L=mix(PAL.moss,PAL.leafL,.4);
const BARK=mix(PAL.bark,PAL.woodL,.5),BARKD=mix(PAL.barkD,PAL.bark,.75),PINE_D=mix(PAL.pineD,PAL.pine,.6),PINE_U=mix(PAL.pineL,PAL.bark,.4),PINE_UL=mix(PAL.pineL,PAL.leafL,.5);
// houppier : masses de feuillage [x,y,z, sx,sy,sz, graine, n1,n2, ton (0 sombre … 1 clair), dessous, n3], dégradées de cD (flancs) à cL (dessus).
// Le dessous ne reçoit jamais le soleil : il est peint en clair (cU, feuilles vues par transparence) pour ne pas devenir un trou noir quand on passe sous l'arbre
const crown=(b,L,cD,cL,cU,o={})=>L.forEach((q,i)=>{const t=q[9]===undefined?.5:q[9],[top,und]=puff(q[6],q[7]||5,q[8]||8,o.rough===undefined?.16:o.rough,q[10]===undefined?-.4:q[10],q[11]||0),tr={r:[0,i*2.1,0],s:[q[3],q[4],q[5]]};
  b.group({p:[q[0],q[1],q[2]],r:[0,0,o.tilt||0]},b=>{b.add(top,Object.assign({c:shade(cD,.92+.16*t),c2:mix(mix(cD,cL,.55),cL,t),jit:o.jit||.11},tr));b.add(und,Object.assign({c:mix(cU,cD,.45),c2:cU,jit:.1},tr));});});
// ------------------------------------------------------------------ CONIFÈRES
// étages : [y du bord, rayon, hauteur, tombé, pointes] du bas vers le haut ; pointes claires, cœur sombre, dessous brun-vert
const pineTiers=(b,L,o={})=>{const N=L.length;L.forEach((q,i)=>{const t=N>1?i/(N-1):1,[top,und]=tier(b.rnd,q[4]||6,q[1],q[2],q[3],o.k||.6,o.sh||0),j=()=>(b.rnd()-.5)*.14,tr={p:[j(),q[0],j()],r:[j(),i*1.9,j()]};
    b.add(top,Object.assign({c:mix(PAL.pine,PAL.pineL,.45+.4*t),c2:mix(PINE_D,PAL.pine,.2+.8*t),jit:.12},tr));
    b.add(und,Object.assign({c:PINE_UL,c2:PINE_U,jit:.1},tr));});};
// sapin élancé : six étages serrés, flèche fine
MODELS['nat.pin1']=()=>{const b=K.make(101);
  b.add(stem(b.rnd,5,[[-.06,.3],[.35,.2],[2.8,.16],[7.4,.05]]),{c:BARKD,c2:BARK});
  roots(b,4,.21,.5,.5,BARKD,BARK);
  pineTiers(b,[[2.75,1.75,1.75,.42,6],[3.75,1.55,1.65,.38,6],[4.75,1.3,1.55,.34,6],[5.7,1.05,1.45,.3,5],[6.6,.8,1.35,.26,5],[7.45,.55,1.1,.2,5]]);
  b.add(K.cone(.2,.95,4,{open:true}),{p:[0,8.52,0],c:PAL.pine,c2:PAL.pineL,jit:.1});   // flèche
  return b;};
// sapin trapu : quatre larges étages en ombrelle, aux pointes tombantes
MODELS['nat.pin2']=()=>{const b=K.make(102);
  b.add(stem(b.rnd,6,[[-.06,.46],[.4,.3],[2.6,.25],[5.4,.07]]),{c:BARKD,c2:BARK});
  roots(b,5,.31,.6,.7,BARKD,BARK);
  pineTiers(b,[[2.95,2.5,1.9,.7,7],[3.9,2.05,1.75,.6,7],[4.8,1.5,1.5,.5,6],[5.55,.9,1.15,.35,5]],{sh:.5,k:.74});
  return b;};
// vieux pin maritime : tronc tordu, plateaux de feuillage, cime sèche et dégarnie
MODELS['nat.pin3']=()=>{const b=K.make(103);
  b.add(K.tube(K.curve([[0,-.1,0],[.28,1.3,.1],[-.2,2.7,0],[.3,4.1,-.15],[.75,5.2,-.1]],5),[.4,.3,.25,.22,.19,.15],5,{open:true}),{c:BARKD,c2:BARK,jit:.09});
  roots(b,4,.3,.65,.75,BARKD,BARK);
  // charpentières
  b.add(K.tube([[.02,3.3,0],[-.9,4.15,.3],[-1.6,4.5,.45]],[.13,.1,.06],4,{open:true}),{c:BARK,jit:.08});
  b.add(K.tube([[.45,4.5,-.1],[1.3,5.1,-.5],[1.9,5.4,-.6]],[.12,.09,.06],4,{open:true}),{c:BARK,jit:.08});
  // cime sèche : le tronc continue, nu et pointu, avec un chicot
  b.add(K.tube([[.75,5.2,-.1],[.95,6.2,.05],[.78,7.0,.1],[.95,7.7,.2]],[.14,.1,.06,0],4,{open:true}),{c:BARK,c2:PAL.boneD,jit:.08});
  b.add(K.tube([[.92,6.25,.05],[1.4,6.7,.3],[1.55,7.1,.35]],[.05,.035,0],3,{open:true}),{c:PAL.boneD,jit:.06});
  b.add(K.tube([[.2,2.75,.05],[.7,3.0,.75],[.9,3.45,1.15]],[.07,.045,0],3,{open:true}),{c:BARK,c2:PAL.boneD,jit:.06});     // branche morte basse
  // plateaux de feuillage
  crown(b,[[-1.65,4.45,.5,1.75,1.0,1.5,3,5,9,.4],[1.85,5.4,-.65,1.55,.95,1.35,5,5,9,.7],[.35,5.35,.05,1.5,1.05,1.4,8,5,9,1],[-.3,4.95,-1.2,1.15,.8,1.05,11,4,7,.2]],PINE_D,mix(PAL.pine,PAL.pineL,.75),PINE_UL);
  return b;};
// ------------------------------------------------------------------ FEUILLUS
const OAK_D=mix(PAL.leafD,PAL.leaf,.3),OAK_L=mix(PAL.leaf,PAL.leafL,.4),LEAF_U=mix(PAL.leafL,PAL.grassL,.3);
// chêne : fût épais, trois charpentières, grosse ramure en six masses
MODELS['nat.arbre1']=()=>{const b=K.make(111);
  b.add(stem(b.rnd,5,[[-.08,.66],[.4,.43],[1.4,.36,.03],[2.45,.33,.06,.03]]),{c:BARKD,c2:BARK,jit:.09});
  roots(b,5,.44,.7,.85,BARKD,BARK);
  b.add(K.tube([[0,2.2,0],[-1.05,3.2,.3],[-1.8,3.95,.5]],[.22,.15,.09],4,{open:true}),{c:BARK,jit:.08});
  b.add(K.tube([[.08,2.3,0],[.9,3.4,-.5],[1.55,4.3,-.8]],[.2,.14,.09],4,{open:true}),{c:BARK,jit:.08});
  b.add(K.tube([[.03,2.3,.05],[.25,3.5,.8],[.3,4.5,1.3]],[.19,.13,.08],4,{open:true}),{c:BARK,jit:.08});
  crown(b,[[.1,5.1,.05,2.25,2.0,2.1,21,6,10,1],[-2.0,3.95,.5,1.7,1.45,1.6,22,5,8,.45],[1.8,4.3,-.9,1.65,1.4,1.5,23,5,8,.6],[.4,4.15,1.7,1.5,1.35,1.4,24,5,8,.35],[-.75,4.4,-1.7,1.5,1.3,1.4,25,5,8,.5],[1.95,3.6,1.0,1.25,1.05,1.15,26,4,7,.15]],OAK_D,OAK_L,LEAF_U);
  return b;};
// palme : nervure arquée dans le plan YZ (de l'origine vers +Z), section en toit (arête et deux bords tombants). L longueur, w demi-largeur, up élan, dr retombée de la pointe.
// Renvoie [dessus, dessous]
const frond=(L,w,up,dr,n=3,fold=.45)=>{const P=K.curve([[0,0,0],[0,up,L*.36],[0,up*.62,L*.74],[0,-dr,L]],n),R=[],U=[];
  for(let k=0;k<n;k++){const q=P[k],t=k/n,h=w*Math.pow(sin(PI*(.14+.86*t)),.7),a=[h,q[1]-h*fold,q[2]],c=[-h,q[1]-h*fold,q[2]];R.push([a,q,c]);U.push([c,a]);}
  R.push([P[n]]);U.push([P[n]]);return[loft(R,{open:true}),loft(U,{open:true})];};
// bouleau : fût blanc et fin marqué de noir, feuillage clair en petites masses retombantes
MODELS['nat.arbre2']=()=>{const b=K.make(112),W=mix(PAL.bone,PAL.stoneL,.25),WD=mix(PAL.boneD,PAL.stone,.3),DK=mix(PAL.black,PAL.barkD,.5),
    L=[[-.08,.3,0,0],[.5,.17,.02,0],[2.4,.14,.12,.04],[4.4,.105,-.06,.0],[6.2,.07,.07,-.05],[7.5,.025,.02,0]],R=L.map(q=>[0,1,2,3,4].map(i=>[q[2]+sin(i/5*TAU)*q[1],q[0],q[3]+cos(i/5*TAU)*q[1]]));
  b.add(loft(R),{c:WD,c2:W,jit:.06});
  // marques noires de l'écorce : petits éclats posés sur les pans du fût
  [[1,0,.35,.9],[1,2,.7,.7],[1,3,.2,.6],[2,1,.3,.8],[2,4,.62,.9],[3,0,.45,.8],[1,4,.12,.75]].forEach(q=>{const k=q[0],i=q[1],j=(i+1)%5,at=(u,v)=>{const pt=lp(lp(R[k][i],R[k][j],u),lp(R[k+1][i],R[k+1][j],u),v),ax=lp(L[k],L[k+1],v),d=Math.hypot(pt[0]-ax[2],pt[2]-ax[3]);
      return[pt[0]+(pt[0]-ax[2])/d*.012,pt[1],pt[2]+(pt[2]-ax[3])/d*.012];},w=q[3]*.42,h=.05+.04*q[3];
    b.add(mesh([[at(.5-w,q[2]),at(.5+w,q[2]-h*.3/1.5),at(.5+w*.1,q[2]+h)]],{from:[L[k][2],L[k][0]+1,L[k][3]]}),{c:DK,jit:0});});
  roots(b,3,.17,.32,.4,WD,W);
  // rameaux sombres
  [[.1,3.9,.03,-.95,4.5,-.35],[.0,3.4,0,.95,4.1,.5],[-.03,5.0,0,-.75,5.7,.3],[.03,4.3,.02,.1,4.85,.95]].forEach(q=>b.add(K.tube([[q[0],q[1],q[2]],[q[3],q[4],q[5]]],[.05,.025],3,{open:true}),{c:mix(DK,PAL.bark,.5),jit:.05}));
  crown(b,[[.02,6.55,0,.95,1.4,.95,31,5,8,1,-.55],[-.85,5.6,.3,.95,1.15,.9,32,5,8,.7,-.6,4],[.95,5.35,-.3,1.0,1.2,.9,33,5,8,.8,-.6,4],[-1.0,4.4,-.4,.9,1.05,.85,34,4,7,.35,-.7,4],[1.0,4.0,.5,.9,1.0,.85,35,4,7,.3,-.7,4],[.1,4.75,1.0,.8,.95,.75,36,4,7,.5,-.7,4]],
    mix(PAL.leaf,PAL.grassL,.45),mix(PAL.leafL,PAL.grassL,.3),mix(PAL.leafL,PAL.gold,.12),{jit:.12});
  return b;};
// arbre couché par le vent : tronc penché, houppier étiré en drapeau sous le vent, rameaux nus côté vent
MODELS['nat.arbre3']=()=>{const b=K.make(113),G=mix(PAL.leaf,PAL.moss,.35);
  b.add(K.tube(K.curve([[0,-.1,0],[.22,1.0,.02],[.85,2.0,.08],[1.75,2.75,.1],[2.7,3.2,.02]],5),[.4,.3,.26,.22,.18,.13],5,{open:true}),{c:BARKD,c2:BARK,jit:.09});
  roots(b,4,.3,.55,.75,BARKD,BARK,{a0:-1.2});
  b.add(K.tube([[1.2,2.35,.08],[1.75,3.3,-.35],[2.2,3.9,-.5]],[.13,.09,.05],4,{open:true}),{c:BARK,jit:.08});
  b.add(K.tube([[2.0,2.9,.1],[2.9,3.1,.8],[3.6,3.3,1.0]],[.11,.08,.05],4,{open:true}),{c:BARK,jit:.08});
  b.add(K.tube([[.85,2.0,.08],[.5,2.85,.3],[.45,3.4,.22]],[.065,.04,0],3,{open:true}),{c:BARK,c2:PAL.boneD,jit:.06});     // rameaux nus, au vent
  b.add(K.tube([[.5,1.55,.04],[.05,2.2,-.3],[-.1,2.6,-.35]],[.055,.035,0],3,{open:true}),{c:BARK,c2:PAL.boneD,jit:.06});
  crown(b,[[3.0,3.7,0,2.1,1.25,1.6,41,6,10,.9],[4.65,3.95,.25,1.45,.85,1.1,42,5,8,.6],[1.85,4.1,-.45,1.45,1.05,1.25,43,5,8,1],[3.75,3.3,-.95,1.3,.8,1.0,44,4,7,.3],[3.45,3.35,1.15,1.25,.8,1.0,45,4,7,.4]],
    mix(PAL.leafD,G,.5),mix(G,PAL.leafL,.45),mix(PAL.leafL,PAL.grassL,.3),{tilt:.2});
  return b;};
// palmier de plage : stipe courbé et annelé, bouquet de palmes retombantes, une palme sèche, noix de coco
MODELS['nat.palmier']=()=>{const b=K.make(114),TR=mix(PAL.bark,PAL.sand,.45),TRD=mix(PAL.barkD,PAL.dirt,.6),P=K.curve([[0,-.15,0],[.5,1.2,.05],[1.15,2.6,.08],[1.5,4.0,.05],[1.55,5.25,0]],7),C=P[7],
    GD=mix(PAL.leafD,PAL.leaf,.5),GL=mix(PAL.leaf,PAL.leafL,.55),GU=mix(PAL.leafL,PAL.grassL,.4);
  b.add(K.tube(P,[.38,.27,.21,.235,.19,.21,.165,.18],5,{open:true}),{c:TRD,c2:TR,jit:.11});
  b.add(K.lathe([[0,-.32],[.23,0],[0,.4]],5),{p:C,c:TR,c2:GD,jit:.08});                     // cœur du bouquet
  // palmes : [angle, longueur, demi-largeur, élan, retombée]
  [[.2,2.7,.46,.75,1.1],[1.25,2.9,.48,.7,1.5],[2.3,2.6,.45,.85,.9],[3.3,2.9,.48,.65,1.4],[4.35,2.65,.46,.8,1.0],[5.35,2.8,.47,.7,1.3],[.8,1.9,.34,1.3,-.3],[2.9,1.8,.33,1.4,-.4],[4.9,1.85,.33,1.25,-.2]].forEach((q,i)=>{const[top,und]=frond(q[1],q[2],q[3],q[4]);
    b.add(top,{p:C,r:[0,q[0],0],c:i<6?GD:mix(GD,GL,.4),c2:GL,jit:.1});b.add(und,{p:C,r:[0,q[0],0],c:mix(GU,GD,.4),c2:GU,jit:.08});});
  {const[top,und]=frond(2.3,.4,.25,2.3),D=mix(PAL.woodL,PAL.sand,.3);b.add(top,{p:C,r:[0,3.85,0],c:PAL.wood,c2:D,jit:.1});b.add(und,{p:C,r:[0,3.85,0],c:D,jit:.08});}   // palme sèche qui pend
  [[.17,-.3,.12],[-.16,-.34,.1],[.02,-.36,-.19]].forEach(q=>b.add(K.sph(.145,5,3),{p:[C[0]+q[0],C[1]+q[1],C[2]+q[2]],r:[q[0],q[1]*9,q[2]],c:PAL.woodD,c2:mix(PAL.wood,PAL.moss,.35),jit:.08}));   // noix de coco
  return b;};
// arbre mort blanchi par le sel : fourche nue, branche cassée net, creux sombre
MODELS['nat.arbreMort']=()=>{const b=K.make(115),DW=mix(PAL.boneD,PAL.stone,.3),DL=mix(PAL.bone,PAL.stoneL,.35),tw=(P,R,n=3)=>b.add(K.tube(P,R,n,{open:true}),{c:DW,c2:DL,jit:.07});
  b.add(K.tube(K.curve([[0,-.1,0],[.1,.9,.04],[-.1,1.7,0],[.05,2.35,.06]],3),[.36,.26,.22,.19],5,{open:true}),{c:mix(DW,PAL.bark,.35),c2:DL,jit:.09});
  roots(b,5,.27,.5,.8,mix(DW,PAL.bark,.35),DW);
  tw(K.curve([[.02,2.2,.05],[-.5,2.9,.2],[-.78,3.5,.12],[-.62,4.1,-.1]],3),[.17,.115,.07,0],4);                              // maîtresse branche gauche, jusqu'à la cime
  b.add(K.tube([[.05,2.2,.05],[.7,2.8,-.15],[1.2,3.1,-.32]],[.16,.12,.095],4),{c:DW,c2:DL,jit:.07});                       // maîtresse branche droite, cassée net
  tw([[-.5,2.9,.2],[-1.25,3.15,.5],[-1.75,3.6,.55]],[.075,.05,0]);tw([[-.75,3.45,.12],[-.4,3.75,-.4],[-.45,4.2,-.7]],[.06,.04,0]);
  tw([[.7,2.8,-.15],[.85,3.4,.3],[1.2,3.85,.45]],[.07,.045,0]);tw([[.02,1.75,.02],[.55,2.0,.6],[.75,2.45,.9]],[.07,.045,0]);tw([[-.06,1.3,0],[-.55,1.55,-.45],[-.7,1.95,-.6]],[.06,.035,0]);
  b.add(K.oct(.11),{p:[.05,1.15,.21],s:[1,1.7,.5],c:mix(PAL.barkD,PAL.black,.3),jit:0});                                     // creux
  return b;};
// souche : coupe aux cernes visibles, éclat de bois resté debout, racines, jeune pousse
MODELS['nat.souche']=()=>{const b=K.make(116),disc=(r,y,c,x=0,z=0)=>b.add(K.face([0,1,2,3,4,5,6].map(i=>pol(i/7*TAU+r*9,r*(.9+.2*b.rnd()),y)).map(q=>[q[0]+x,q[1],q[2]+z])),{c,jit:.04});
  b.add(stem(b.rnd,7,[[-.05,.5],[.2,.37],[.5,.34]],{w:.12,capT:true}),{c:BARKD,c2:BARK,jit:.08});
  roots(b,5,.37,.3,.5,BARKD,BARK);
  disc(.28,.504,PAL.woodL);disc(.215,.508,PAL.plank,.01,.01);disc(.15,.512,PAL.woodL,.02,.01);disc(.085,.516,PAL.wood,.03,.02);        // cernes
  b.add(mesh([[[-.33,.45,.02],[-.24,.45,-.17],[-.3,.82,-.1]],[[-.24,.45,-.17],[-.2,.45,.06],[-.3,.82,-.1]],[[-.2,.45,.06],[-.33,.45,.02],[-.3,.82,-.1]]],{from:[-.26,.5,-.03]}),{c:BARK,c2:PAL.woodL,jit:.06});   // éclat
  // jeune pousse : deux feuilles
  b.add(mesh([[[.3,.02,.3],[.32,.02,.33],[.36,.34,.4]],[[.36,.33,.4],[.5,.47,.36],[.42,.36,.5]],[[.36,.33,.4],[.3,.44,.52],[.27,.37,.38]]],{dbl:true}),{c:PAL.leaf,c2:PAL.leafL,jit:.1});
  return b;};
// tronc couché (le long de X) : fût creux, coussins de mousse, moignon de branche, champignons en console
MODELS['nat.tronc']=()=>{const b=K.make(117),ry=(x,r,cy,n=7,a0=0)=>{const R=[];for(let i=0;i<n;i++){const a=a0+i/n*TAU;R.push([x,cy+r*sin(a)*(.94+.12*b.rnd()),-r*cos(a)*(.94+.12*b.rnd())]);}return R;},
    R=[ry(-1.5,.33,.27),ry(-.1,.3,.25,7,.2),ry(1.5,.26,.22,7,.4)];
  b.add(loft(R),{c:BARKD,c2:BARK,jit:.09});
  b.add(K.face(R[2]),{c:PAL.wood,jit:.03});b.add(K.face(R[0].slice().reverse()),{c:PAL.wood,jit:.03});                              // coupes
  b.add(K.face(ry(1.504,.19,.225)),{c:PAL.woodL,jit:.04});b.add(K.face(ry(1.508,.1,.23)),{c:PAL.plank,jit:.04});                     // cernes
  b.add(K.face(ry(-1.504,.22,.265).reverse()),{c:mix(PAL.barkD,PAL.black,.45),jit:0});                                             // creux
  b.add(K.cyl(.05,.085,.34,5,{open:true}),{p:[.55,.52,-.14],r:[-.5,0,.25],c:BARKD,c2:BARK});b.add(K.cone(.05,.07,5,{open:true}),{p:[.587,.685,-.235],r:[-.5,0,.25],c:PAL.woodL,jit:.04});   // moignon de branche
  // coussins de mousse
  [[-.75,.5,.03,.5,.13,.27,51],[.2,.47,-.1,.32,.1,.2,52],[1.0,.42,.06,.3,.1,.2,53]].forEach(q=>b.add(puff(q[6],4,6,.2)[0],{p:[q[0],q[1],q[2]],s:[q[3],q[4],q[5]],c:mix(PAL.moss,PAL.leafD,.35),c2:mix(PAL.moss,PAL.leafL,.4),jit:.12}));
  // champignons en console : demi-lunes crème à liseré roux
  [[-.35,.3,.27,.2,0],[-.1,.2,.28,.15,.4]].forEach(q=>{const N=4,T=[],c=[q[0],q[1]+.03,q[2]-.02];for(let i=0;i<=N;i++){const a=-PI/2+q[4]+i/N*PI;T.push([q[0]+sin(a)*q[3],q[1]-.015*Math.abs(i-2),q[2]+cos(a)*q[3]*.85]);}
    const F=[];for(let i=0;i<N;i++)F.push([c,T[i],T[i+1]],[[c[0],c[1]-.09,c[2]-.03],T[i+1],T[i]]);b.add(mesh(F),{c:PAL.bronzeL,c2:PAL.cream,jit:.06});});
  return b;};
// ------------------------------------------------------------------ SOUS-BOIS
// point à la surface d'une motte (centre q[0..2], rayons q[3..5]) dans la direction (angle autour a, angle depuis le sommet t)
const onLump=(q,a,t,k=.9)=>[q[0]+q[3]*sin(t)*sin(a)*k,q[1]+q[4]*cos(t)*k,q[2]+q[5]*sin(t)*cos(a)*k];
// buisson rond à baies rouges : trois mottes de feuillage posées au sol
MODELS['nat.buisson1']=()=>{const b=K.make(121),D=mix(PAL.leafD,PAL.leaf,.4),L=mix(PAL.leaf,PAL.leafL,.5),M=[[0,.52,0,.72,.68,.68,61],[.58,.02,.3,.5,.55,.46,62],[-.5,.02,-.32,.46,.5,.44,63]],
    lump=(q,n1,n2,n3,t)=>{const[top,und]=puff(q[6],n1,n2,.17,-1,n3,false),tr={p:[q[0],q[1],q[2]],r:[0,q[6],0],s:[q[3],q[4],q[5]]};
      b.add(top,Object.assign({c:shade(D,.95+.1*t),c2:mix(D,L,.5+.5*t),jit:.12},tr));if(n3)b.add(und,Object.assign({c:mix(PAL.leafD,PAL.barkD,.3),c2:D,jit:.1},tr));};
  lump(M[0],5,8,5,1);lump(M[1],4,6,0,.4);lump(M[2],4,6,0,.2);
  // baies, posées sur le feuillage : [motte, angle autour, angle depuis le sommet]
  [[0,.4,.35],[0,1.9,.75],[0,3.3,.6],[0,4.6,.95],[0,5.6,1.25],[0,2.6,1.3],[1,.9,.7],[1,2.2,1.1],[2,3.9,.6],[2,5.3,1.05]].forEach((q,i)=>b.add(K.tet(.07),{p:onLump(M[q[0]],q[1],q[2]),r:[i,i*2.3,i*.7],c:PAL.clothD,c2:mix(PAL.cloth,PAL.gold,.25),jit:.06}));
  return b;};
// ajonc : touffe épineuse hérissée de pointes, piquée de fleurs jaune d'or
MODELS['nat.buisson2']=()=>{const b=K.make(122),D=mix(PAL.pine,PAL.moss,.3),L=mix(PAL.pineL,PAL.moss,.5),M=[0,.42,0,.6,.5,.56];
  {const[top,und]=puff(71,4,7,.2,-1,4,false),tr={p:[0,.42,0],s:[.6,.5,.56]};b.add(top,Object.assign({c:D,c2:L,jit:.12},tr));b.add(und,Object.assign({c:mix(D,PAL.barkD,.4),c2:D,jit:.1},tr));}
  // rameaux épineux : [angle autour, inclinaison, longueur, départ] — une fleur sur le flanc de certains
  [[.3,.2,.75,.55],[1.5,.55,.7,.4],[2.6,.3,.85,.5],[3.7,.6,.65,.38],[4.8,.25,.8,.52],[5.6,.7,.6,.36],[.95,.95,.55,.3],[3.1,1.0,.55,.28],[4.3,-.05,.9,.6]].forEach((q,i)=>b.group({r:[0,q[0],0]},b=>{const y=q[3]+cos(q[1])*q[2]*.42,z=sin(q[1])*(q[2]*.42+.22);
    b.add(K.cone(.11,q[2],4,{open:true}),{p:[0,y,z],r:[q[1],0,0],c:D,c2:mix(L,PAL.leafL,.4),jit:.12});
    if(i%3!==2)b.add(K.tet(.065),{p:[.045,y+cos(q[1])*q[2]*.12,z+sin(q[1])*q[2]*.12+.04],r:[i,i*1.7,0],c:PAL.gold,c2:mix(PAL.gold,PAL.white,.3),jit:.05});}));
  [[.6,.9],[2.6,1.1],[4.6,.9]].forEach((q,i)=>b.add(K.tet(.065),{p:onLump(M,q[0],q[1],.97),r:[i*2,i,i*.6],c:PAL.gold,c2:mix(PAL.gold,PAL.white,.3),jit:.05}));
  return b;};
// fougère : rosette de frondes arquées (rubans à deux faces), grandes dehors, jeunes et dressées au cœur
MODELS['nat.fougere']=()=>{const b=K.make(123),F=[];
  for(let i=0;i<8;i++){const big=i<5,a=(big?i/5:(i-5)/3+.17)*TAU+b.rnd()*.4,k=big?.85+.3*b.rnd():.55,sx=sin(a),cx=cos(a),
      P=(big?[[.03,-.03,.012],[.2,.34,.085],[.44,.47,.07],[.74,.27,0]]:[[.02,-.03,.01],[.1,.3,.06],[.2,.52,.05],[.3,.62,0]]).map(q=>[[sx*q[0]*k+cx*q[2],q[1]*k,cx*q[0]*k-sx*q[2]],[sx*q[0]*k-cx*q[2],q[1]*k,cx*q[0]*k+sx*q[2]]]);
    F.push([P[0][0],P[0][1],P[1][1],P[1][0]],[P[1][0],P[1][1],P[2][1],P[2][0]],[P[2][0],P[2][1],P[3][0]]);}
  b.add(mesh(F,{dbl:true}),{c:mix(PAL.leafD,PAL.leaf,.4),c2:mix(PAL.leafL,PAL.pineL,.35),jit:.14});
  return b;};
// touffe d'herbe : huit brins pointus en éventail
MODELS['nat.herbe']=()=>{const b=K.make(124);tuft(b,0,0,8,.5,GRASS_D,GRASS_L,.36);return b;};
// fleurs des champs — tige à trois pans, feuilles et pétales à deux faces
const stalk=(b,P,r=.011)=>b.add(K.tube(P,[r,r*.7],3,{open:true}),{c:GRASS_D,c2:PAL.grassL,jit:.08});
const leaves=(b,L)=>b.add(mesh(L.map(q=>[[q[0]*.12,-.02,q[1]*.12],[q[0]*.55-q[1]*.2,q[2]*.6,q[1]*.55+q[0]*.2],[q[0],q[2],q[1]]]),{dbl:true}),{c:GRASS_D,c2:PAL.leafL,jit:.12});
// corolle en étoile : n pétales autour du cœur, relevés en coupe
const corolla=(b,p,r,n,R,cup,c,c2)=>b.group({p,r},b=>{const F=[];for(let i=0;i<n;i++){const a=i/n*TAU,d=.5/n*TAU;F.push([pol(a-d,R*.5,0),pol(a+d,R*.5,0),pol(a,R,cup)]);}b.add(mesh(F,{dbl:true}),{c,c2,jit:.1});});
// marguerite jaune : deux corolles plates à cœur orangé
MODELS['nat.fleur1']=()=>{const b=K.make(125),Y=mix(PAL.gold,PAL.goldD,.25);
  stalk(b,[[0,-.02,0],[.03,.38,.02]]);stalk(b,[[.01,.12,.01],[-.1,.26,.06]],.008);leaves(b,[[.13,.05,.14],[-.1,-.1,.12]]);
  corolla(b,[.03,.385,.02],[.3,0,-.15],7,.125,.035,Y,mix(PAL.gold,PAL.white,.25));b.add(K.cone(.034,.035,4,{open:true}),{p:[.035,.4,.025],r:[.3,0,-.15],c:PAL.bronze,c2:PAL.lava,jit:.06});
  corolla(b,[-.1,.265,.06],[-.2,0,.5],3,.08,.025,Y,mix(PAL.gold,PAL.white,.25));
  return b;};
// digitale rose : grappe de clochettes pendantes le long d'une hampe
MODELS['nat.fleur2']=()=>{const b=K.make(126),PK=mix(mix(PAL.cloth,PAL.purple,.3),PAL.white,.42),PD=mix(PAL.cloth,PAL.purple,.4);
  stalk(b,[[0,-.02,0],[.04,.5,0]],.012);leaves(b,[[.15,.04,.12],[-.12,.1,.1],[.02,-.15,.13]]);
  [[.16,.9,.055],[.24,3.2,.05],[.31,5.3,.045],[.38,1.6,.038],[.44,4.0,.03]].forEach(q=>b.group({p:[.04*q[0]/.5,q[0],0],r:[0,q[1],0]},b=>b.add(K.cone(q[2],q[2]*2.1,4,{open:true}),{p:[0,0,q[2]*.9],r:[-.9,0,0],c:PK,c2:PD,jit:.08})));
  b.add(K.tet(.022),{p:[.042,.51,0],c:PD,jit:.05});
  return b;};
// aigrette blanc-bleuté : pompon duveteux sur sa collerette
MODELS['nat.fleur3']=()=>{const b=K.make(127),IC=mix(PAL.ice,K.EL.eau.light,.35);
  stalk(b,[[0,-.02,0],[-.02,.33,.03]]);leaves(b,[[.12,-.06,.1],[-.11,.09,.13]]);
  b.add(blob(7,0,.16),{p:[-.02,.4,.03],s:.075,c:IC,c2:PAL.white,jit:.07});
  corolla(b,[-.02,.335,.03],[0,0,0],3,.075,-.025,PAL.grass,PAL.grassL);
  return b;};
// ------------------------------------------------------------------ ROCHES
const rock=(b,sh,o)=>b.add(sh,Object.assign({c:ROCKD,c2:ROCK,jit:.1},o));
const moss=(b,q)=>b.add(puff(q[6],4,6,.2)[0],{p:[q[0],q[1],q[2]],r:[q[7]||0,0,q[8]||0],s:[q[3],q[4],q[5]],c:MOSS_D,c2:MOSS_L,jit:.12});   // coussin de mousse [x,y,z, sx,sy,sz, graine, rx,rz]
// bloc anguleux : un grand éclat dressé, un second appuyé contre lui, un fragment tombé
MODELS['nat.rocher1']=()=>{const b=K.make(131);
  rock(b,crag(3,20,[[1,.25,.1,.55],[-.5,.8,.25,.6],[.1,.3,1,.6],[-1,.1,-.3,.7]]),{p:[0,.62,0],r:[0,.4,.08],s:[.72,1.2,.62],c2:ROCKL});
  rock(b,crag(8,13,[[.6,.7,0,.5],[0,.2,-1,.6]]),{p:[.62,.3,.28],r:[0,1.9,-.12],s:[.5,.62,.42]});
  rock(b,crag(12,9,[[0,1,.3,.5]]),{p:[-.55,.12,.5],r:[0,.7,0],s:[.26,.24,.2]});
  moss(b,[.66,.52,.3,.3,.14,.26,81,0,-.25]);tuft(b,-.25,.62,3,.34,GRASS_D,GRASS_L);
  return b;};
// pierre plate : dalle à peine inclinée, calée sur deux pierres
MODELS['nat.rocher2']=()=>{const b=K.make(132);
  rock(b,crag(5,22,[[0,1,0,.3],[1,.2,.2,.8],[-.3,0,1,.75]],-.3),{p:[0,.3,0],r:[.05,.3,.09],s:[.95,.62,.72],c2:ROCKL});
  rock(b,crag(9,11,[[0,1,.2,.45]]),{p:[.78,.14,-.42],r:[0,2.2,0],s:[.36,.3,.3]});
  rock(b,crag(14,9,[[.3,1,0,.4]]),{p:[-.7,.1,.52],r:[0,1.1,0],s:[.24,.2,.2]});
  moss(b,[-.3,.46,-.2,.34,.09,.26,82,.05,.09]);tuft(b,.55,.6,3,.3,GRASS_D,GRASS_L);
  return b;};
// amas de trois : un gros, un moyen, un petit, épaule contre épaule
MODELS['nat.rocher3']=()=>{const b=K.make(133);
  rock(b,crag(21,17,[[.4,1,.1,.62],[1,.1,-.4,.7],[-.6,.3,.7,.7]]),{p:[-.22,.44,-.1],r:[0,.9,0],s:[.68,.88,.6],c2:ROCKL});
  rock(b,crag(24,14,[[-.2,1,.3,.55],[.2,.2,1,.65]]),{p:[.52,.3,.26],r:[0,2.7,.1],s:[.48,.6,.44]});
  rock(b,crag(27,11,[[.2,1,-.2,.5]]),{p:[.02,.18,.62],r:[0,4.1,0],s:[.3,.36,.28]});
  moss(b,[.5,.6,.24,.3,.11,.26,83,0,.1]);tuft(b,-.72,.42,3,.32,GRASS_D,GRASS_L);
  return b;};
// caillou de bord de chemin, et son éclat
MODELS['nat.caillou']=()=>{const b=K.make(134);
  rock(b,crag(31,9,[[.2,1,.1,.45]]),{p:[0,.085,0],r:[0,.5,0],s:[.17,.17,.13],c2:ROCKL});
  rock(b,crag(35,6,[],-.4),{p:[.15,.035,.1],r:[0,2,0],s:[.07,.08,.06]});
  return b;};
// gros bloc erratique : chape de mousse qui épouse le sommet, touffe d'herbe, coussins, pierres au pied
MODELS['nat.rocherMousse']=()=>{const b=K.make(135),V=cragPts(41,28,[[.3,1,.1,.7],[1,.15,.2,.72],[-.7,.2,.6,.75],[-.2,.1,-1,.78],[.5,-.2,-.8,.8]]),tr={p:[0,.86,0],r:[0,.5,0],s:[1.5,1.72,1.3]};
  rock(b,hull(V,true),Object.assign({c2:ROCKL},tr));
  b.add(hull(V.filter(q=>q[1]>.2).map(q=>[q[0]*1.045,q[1]*1.04+.01,q[2]*1.045]),true),Object.assign({c:MOSS_D,c2:MOSS_L,jit:.12},tr));          // chape de mousse
  tuft(b,.25,.2,8,.55,GRASS_D,GRASS_L,.4,2.02);                                                                                 // touffe au sommet
  moss(b,[-1.25,.75,.55,.42,.16,.34,84,.2,.5]);moss(b,[1.0,.5,-.95,.36,.14,.3,85,-.3,-.4]);
  rock(b,crag(43,11,[[0,1,.2,.45]]),{p:[1.55,.2,.75],r:[0,1.3,0],s:[.44,.42,.36]});rock(b,crag(46,9,[[.2,1,0,.4]]),{p:[-1.5,.13,-.7],r:[0,2.6,0],s:[.3,.27,.26]});
  tuft(b,1.2,1.25,3,.36,GRASS_D,GRASS_L);
  return b;};
// champignons : bouquet de trois amanites — pied crème, lamelles claires, chapeau rouge taché de blanc (taches lumineuses, canal g)
MODELS['nat.champi']=()=>{const b=K.make(141),
    shroom=(x,z,h,R,ch,seg,rx,rz,spots)=>b.group({p:[x,-.02,z],r:[rx,0,rz]},b=>{
      b.add(K.cyl(R*.2,R*.32,h,seg>5?5:4,{open:true}),{p:[0,h/2,0],c:PAL.boneD,c2:PAL.cream,jit:.06});                             // pied
      b.add(K.lathe([[0,h-R*.25],[R,h]],seg),{c:PAL.boneD,c2:PAL.cream,jit:.05});                                                 // lamelles
      b.add(K.lathe([[R,h],[R*.62,h+ch*.7],[0,h+ch]],seg),{c:PAL.clothD,c2:mix(PAL.cloth,PAL.lava,.2),jit:.08});                  // chapeau
      spots.forEach(q=>{const k=q[0],A=pol(k/seg*TAU,R,h),B=pol((k+1)/seg*TAU,R,h),C=pol(k/seg*TAU,R*.62,h+ch*.7),D=pol((k+1)/seg*TAU,R*.62,h+ch*.7),
          at=(u,v)=>{const t=lp(lp(A,B,u),lp(C,D,u),v),d=Math.hypot(t[0],t[1]-h,t[2]);return[t[0]*(1+.008/d),t[1]+(t[1]-h)*.008/d+.002,t[2]*(1+.008/d)];},w=q[3]*.2;
        b.add(mesh([[at(q[1]-w,q[2]-w*.8),at(q[1]+w,q[2]-w*.5),at(q[1],q[2]+w*1.1)]],{from:[0,h,0]}),{c:PAL.white,ch:'g',jit:0});});});
  shroom(0,0,.27,.15,.1,6,.06,-.05,[[0,.5,.4,1],[2,.45,.55,.8],[3,.6,.3,.9],[5,.4,.5,1]]);
  shroom(.2,.1,.17,.105,.075,6,.1,-.3,[[1,.5,.45,1],[3,.5,.4,.9],[4,.55,.6,.8]]);
  shroom(-.14,.15,.1,.07,.06,5,.25,.3,[[0,.5,.45,1],[2,.5,.5,1],[3,.5,.4,.9]]);
  tuft(b,-.05,-.14,3,.2,GRASS_D,GRASS_L);
  return b;};
// roseaux : trois massettes brunes sur leurs tiges, parmi de longues feuilles en lame
MODELS['nat.roseaux']=()=>{const b=K.make(142),G=mix(PAL.grass,PAL.moss,.4);
  [[0,0,.03,-.02,1.6],[.13,.08,.16,.1,1.32],[-.1,.1,-.2,.14,1.08]].forEach((q,i)=>{const h=q[4],dx=(q[2]-q[0])/h,dz=(q[3]-q[1])/h,at=y=>[q[0]+dx*y,y,q[1]+dz*y];
    b.add(K.tube([at(-.03),at(h)],[.016,.008],3,{open:true}),{c:GRASS_D,c2:mix(G,PAL.sand,.3),jit:.08});                              // tige
    b.add(K.lathe([[.036,0],[.036,.24],[0,.3]],4,{a0:i}),{p:at(h-.44),r:[dz,0,-dx],c:PAL.woodD,c2:mix(PAL.wood,PAL.bronze,.4),jit:.1});});  // massette
  tuft(b,.02,.04,8,1.25,GRASS_D,mix(PAL.grassL,PAL.sand,.25),.2);
  return b;};
// ------------------------------------------------------------------ MER ET CIEL
// nuage d'été : moutons à facettes posés sur une base plate, blancs dessus, gris-bleu doux dessous. L = [x,y,z, sx,sy,sz, graine, n1,n2]
const CLOUD_T=shade(PAL.white,.93),CLOUD_S=mix(PAL.ice,PAL.stoneL,.3),CLOUD_U=mix(PAL.white,PAL.ice,.6);
const cloud=(seed,L)=>{const b=K.make(seed);L.forEach((q,i)=>{const[top,und]=puff(q[6],q[7]||6,q[8]||10,.13,-.14),tr={p:[q[0],q[1],q[2]],r:[0,i*1.7,0],s:[q[3],q[4],q[5]]};
    b.add(top,Object.assign({c:CLOUD_S,c2:CLOUD_T,jit:.035},tr));b.add(und,Object.assign({c:CLOUD_U,c2:CLOUD_S,jit:.03},tr));});return b;};
// cumulus ramassé : un grand dôme coiffé d'une bosse, entouré de moutons
MODELS['nat.nuage1']=()=>cloud(171,[[0,0,0,5.2,4.6,4.2,1],[-5.4,-.15,.6,4.2,3.3,3.6,2],[5.2,.1,-.4,4.6,3.7,3.8,3],[-9.2,0,-.3,2.5,1.8,2.3,4],[9.3,.15,.5,2.3,1.6,2.1,5],[1.5,-.1,3.1,3.4,2.5,2.8,6],[-2.2,.1,-3,3.6,2.9,2.9,7],[1.9,2.9,.2,2.9,2.7,2.6,8]]);
// nuage étiré : longue traîne à deux bosses, plus basse
MODELS['nat.nuage2']=()=>cloud(172,[[-7.6,0,0,3.6,2.3,3.0,11],[-3.3,.1,.5,4.5,3.5,3.6,12],[1.6,-.1,-.4,3.8,2.4,3.2,13],[6.1,.1,.3,4.3,3.1,3.4,14],[10,0,0,2.3,1.4,2.0,15],[-10.6,.1,.2,1.8,1.05,1.6,16],[-1,-.1,2.6,3.0,1.9,2.4,17],[4.2,0,-2.6,3.2,2.1,2.5,18]]);
// aiguille de roche : anneaux irréguliers qui se resserrent et dérivent jusqu'à la pointe (de y0 à h)
const needle=(rnd,x,z,h,r,lx,lz,seg=5,y0=-1.2)=>{const R=[[0,1],[.38,.72],[.74,.4]].map((q,k)=>{const ring=[];for(let i=0;i<seg;i++){const a=k*.5+(i+(rnd()-.5)*.5)/seg*TAU,rr=r*q[1]*(.75+.5*rnd());
      ring.push([x+lx*q[0]+sin(a)*rr,y0+(h-y0)*q[0]+(k?(rnd()-.5)*h*.08:0),z+lz*q[0]+cos(a)*rr]);}return ring;});
  R.push([[x+lx,h,z+lz]]);return loft(R);};
const REEF_D=mix(PAL.stoneDD,PAL.stoneD,.6),REEF=mix(PAL.stoneD,PAL.stone,.6);
// écueil : cinq aiguilles de roche sombre sur un socle élargi (le socle descend sous y = 0, niveau de la mer)
MODELS['nat.recif']=()=>{const b=K.make(152),rnd=b.rnd,ring=(n,r,y)=>{const R=[];for(let i=0;i<n;i++)R.push(pol((i+(rnd()-.5)*.4)/n*TAU,r*(.8+.4*rnd()),y));return R;};
  b.add(loft([ring(9,4.7,-1.5),ring(9,3.1,.28)],{capT:true}),{c:mix(REEF_D,PAL.pineD,.3),c2:REEF_D,jit:.1});                      // socle, verdi d'algues
  [[0,0,6,1.35,.5,.2],[1.9,.6,4.2,1.05,.9,.3],[-1.7,.9,3.3,1.0,-.6,.4],[-.4,-1.8,2.5,.95,-.2,-.7],[2.5,-1.5,1.5,.75,.3,-.3]].forEach((q,i)=>
    b.add(needle(rnd,q[0],q[1],q[2],q[3],q[4],q[5]),{c:REEF_D,c2:i?REEF:mix(REEF,PAL.boneD,.45),jit:.11}));                       // la plus haute est blanchie par les oiseaux
  [[-2.9,.2,-1.2,.8,13,51],[3.3,.15,1.6,.7,11,52],[.6,.12,2.9,.6,10,53]].forEach(q=>b.add(crag(q[5],q[4],[[.2,1,.1,.5]]),{p:[q[0],q[1],q[2]],r:[0,q[5],0],s:[q[3],q[3]*.8,q[3]*.85],c:REEF_D,c2:REEF,jit:.1}));
  return b;};
// îlot lointain (origine au niveau de la mer) : falaise à l'ouest, dôme herbu, plage à l'est, aiguilles au large, arbres minuscules
MODELS['nat.ilot']=()=>{const b=K.make(151),rnd=b.rnd,N=18,H=14.6,O=[-4,1],RK=[],SD=[],GR=[],R=[[],[],[],[],[],[]],W=[];
  for(let i=0;i<N;i++){const a=i/N*TAU,sx=sin(a),cz=cos(a),w=.5-.5*sx,R0=(.9+.2*rnd())/Math.hypot(sx/20.5,cz/14),hc=1.3+w*w*(7.6+2.4*rnd())+rnd()*.7,   // w : 1 côté falaise (−X) … 0 côté plage (+X)
      P=(k,y)=>[sx*R0*k+O[0]*(1-k),y,cz*R0*k+O[1]*(1-k)];W.push(w);
    R[0].push(P(1,-1.5));R[1].push(P(.95+.04*rnd(),.5+.5*rnd()));R[2].push(P(.86+.08*rnd()-.06*(1-w),.7+hc*(.4+.2*rnd())*w));R[3].push(P(.8-.12*(1-w)+.05*rnd(),hc));
    R[4].push(P(.56+.07*rnd(),hc+(H-hc)*(.6+.14*rnd())));R[5].push(P(.3+.07*rnd(),hc+(H-hc)*(.9+.07*rnd())));}
  for(let k=0;k<5;k++)for(let i=0;i<N;i++){const j=(i+1)%N,L=R[k],U=R[k+1],T=k>2?GR:(W[i]+W[j]<.2&&k>0?SD:RK);T.push([U[i],L[i],L[j]],[U[i],L[j],U[j]]);}
  for(let i=0;i<N;i++)GR.push([[O[0],H,O[1]],R[5][i],R[5][(i+1)%N]]);
  b.add(mesh(RK),{c:mix(ROCKD,PAL.stoneDD,.3),c2:shade(mix(PAL.stoneL,PAL.sand,.45),.9),jit:.1});                                 // falaises
  b.add(mesh(SD),{c:shade(PAL.sand,.8),c2:shade(PAL.sand,.95),jit:.05});                                                         // plage
  b.add(mesh(GR),{c:mix(PAL.grass,PAL.leafD,.3),c2:PAL.grassL,jit:.09});                                                         // dôme herbu
  // aiguilles au large de la falaise, blocs éboulés au pied
  b.add(needle(rnd,-24.5,4.5,8,2.5,-1,.6,5,-1.5),{c:REEF_D,c2:ROCK,jit:.11});b.add(needle(rnd,-22.5,-6,4.6,1.9,.6,-.5,5,-1.5),{c:REEF_D,c2:ROCK,jit:.11});
  [[12,1.7,61],[14,1.3,62],[16,1.5,63],[10,1.2,64]].forEach(q=>{const c=R[1][q[0]];b.add(crag(q[2],11,[[.2,1,0,.5]]),{p:[c[0]*1.03,.4,c[2]*1.03],r:[0,q[2],0],s:[q[1]*1.2,q[1],q[1]],c:REEF_D,c2:ROCK,jit:.1});});
  // affleurements dans l'herbe
  [[4,13,2.2,71],[4,2,1.8,72],[5,8,1.5,73],[3,6,1.6,74]].forEach(q=>{const c=R[q[0]][q[1]];b.add(crag(q[3],12,[[.3,1,.1,.5]]),{p:[c[0],c[1]+q[2]*.25,c[2]],r:[0,q[3],0],s:[q[2]*1.3,q[2],q[2]],c:ROCKD,c2:ROCKL,jit:.1});});
  // arbres minuscules : pins à deux étages et feuillus en boule, posés sur les arêtes du relief [anneau, secteur, position vers l'anneau suivant, taille, 1 = pin]
  [[3,3,.5,1.1,1],[3,4,.75,1.3,1],[4,5,.3,1,1],[3,6,.6,1.2,0],[4,1,.4,1.15,1],[3,0,.55,1.3,0],[3,16,.6,1.1,1],[4,15,.5,1.25,0],[3,14,.5,1,1],[4,10,.35,1.2,1],[3,8,.7,1.1,0],[4,3,.8,.9,1]].forEach(q=>{const c=lp(R[q[0]][q[1]],R[q[0]+1][q[1]],q[2]),h=q[3];
    if(q[4]){b.add(K.cone(1.05*h,2.2*h,5,{open:true}),{p:[c[0],c[1]+1.0*h,c[2]],c:PINE_D,c2:PAL.pine,jit:.1});b.add(K.cone(.75*h,1.9*h,5,{open:true}),{p:[c[0],c[1]+2.3*h,c[2]],r:[0,.6,0],c:PAL.pine,c2:PAL.pineL,jit:.1});}
    else b.add(puff(q[1]+80,4,6,.18)[0],{p:[c[0],c[1]+.3*h,c[2]],s:[1.6*h,2.1*h,1.5*h],c:OAK_D,c2:OAK_L,jit:.11});});
  return b;};
// mouette en vol (regarde vers +Z, origine au centre du corps) : corps fuselé, bec jaune, ailes coudées à pointe noire — grises dessus, blanches dessous
MODELS['nat.mouette']=()=>{const body=K.make(161),WH=shade(PAL.white,.95),GY=mix(PAL.stoneL,PAL.stone,.55),BK=mix(PAL.black,PAL.iron,.4),
    wing=sd=>{const w=K.make(162),P=(x,y,z)=>[sd*x,y,z],A=P(.05,.02,.075),B=P(.05,.02,-.09),C=P(.32,.075,.1),D=P(.33,.06,-.045),E=P(.52,.05,.04),F=P(.5,.04,-.085),T=P(.66,.03,-.13),Q=[[A,C,D,B],[C,E,F,D]];
      w.add(mesh(Q,{from:[0,-9,0]}),{c:GY,jit:.05});w.add(mesh(Q,{from:[0,9,0]}),{c:WH,jit:.03});w.add(mesh([[E,T,F]],{dbl:true}),{c:BK,jit:0});return w;};
  body.add(K.lathe([[0,-.2],[.03,-.14],[.062,-.02],[.058,.07],[.036,.135],[.04,.175],[0,.215]],5),{r:[PI/2,0,0],s:[1.2,1,.9],c:WH,jit:.04});             // corps et tête
  body.add(mesh([[[-.045,.058,.06],[.045,.058,.06],[.03,.05,-.1],[-.03,.05,-.1]]],{from:[0,-9,0]}),{c:GY,jit:.04});                                       // manteau gris
  body.add(K.cone(.016,.07,3,{open:true}),{p:[0,-.005,.245],r:[PI/2,0,0],c:PAL.goldD,c2:PAL.gold,jit:.04});                                              // bec
  body.add(mesh([[[0,.012,-.16],[.07,.01,-.3],[-.07,.01,-.3]]],{dbl:true}),{c:WH,jit:.03});                                                               // queue en éventail
  body.sym(sd=>body.add(mesh([[[sd*.036,.012,.172],[sd*.034,.022,.186],[sd*.038,.004,.186]]],{dbl:true}),{c:BK,jit:0}));                                  // œil
  return{parts:[{name:'body',b:body},{name:'wingL',b:wing(1),parent:'body',pivot:[.05,.02,0],anim:[{k:'rot',axis:'z',amp:.5,sp:6}]},
      {name:'wingR',b:wing(-1),parent:'body',pivot:[-.05,.02,0],anim:[{k:'rot',axis:'z',amp:-.5,sp:6}]}]};};
}
