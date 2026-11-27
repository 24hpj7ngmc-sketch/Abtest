// K : l'atelier de modélisation de L'Île des Cinq.
// On empile des formes simples (chacune avec sa position, sa rotation, sa taille et sa couleur), puis on « cuit »
// le tout en UN maillage coloré par sommet : des centaines de pièces pour un seul appel de dessin.
// Repère : mètres, +Y vers le haut. Triangles orientés vers l'extérieur (sens anti-horaire vu de dehors).
// Seule dépendance à three.js : BufferGeometry / BufferAttribute (dans K.geo) et les matières de K.init.
const K=(()=>{
const TAU=Math.PI*2;
// ---------------------------------------------------------------- couleurs
const rgb=c=>Array.isArray(c)?c:[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255];
const mix=(a,b,t)=>{a=rgb(a);b=rgb(b);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];};
const shade=(c,f)=>{c=rgb(c);return[c[0]*f,c[1]*f,c[2]*f];};                 // f<1 : plus sombre, f>1 : plus clair
const hex=c=>{c=rgb(c);const q=v=>Math.max(0,Math.min(255,Math.round(v*255)));return q(c[0])<<16|q(c[1])<<8|q(c[2]);};
// générateur pseudo-aléatoire reproductible (même modèle à chaque chargement)
const rng=seed=>{let s=(seed|0)||1;s=(s*2654435761)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};};
const hash3=(x,y,z,seed)=>{let h=Math.sin(x*127.1+y*311.7+z*74.7+seed*19.19)*43758.5453;return(h-Math.floor(h))*2-1;};
// ---------------------------------------------------------------- matrices 3x4 (lignes) : m = T·R·S, R = Rx·Ry·Rz comme three.js
const ID=[1,0,0,0,0,1,0,0,0,0,1,0];
function trs(p,r,s){p=p||[0,0,0];r=r||[0,0,0];s=s===undefined?[1,1,1]:typeof s==='number'?[s,s,s]:s;
  const a=Math.cos(r[0]),b=Math.sin(r[0]),c=Math.cos(r[1]),d=Math.sin(r[1]),e=Math.cos(r[2]),f=Math.sin(r[2]);
  const R=[c*e,-c*f,d, a*f+b*e*d,a*e-b*f*d,-b*c, b*f-a*e*d,b*e+a*f*d,a*c];
  return[R[0]*s[0],R[1]*s[1],R[2]*s[2],p[0], R[3]*s[0],R[4]*s[1],R[5]*s[2],p[1], R[6]*s[0],R[7]*s[1],R[8]*s[2],p[2]];}
function mul(a,b){const o=new Array(12);for(let r=0;r<3;r++){const a0=a[r*4],a1=a[r*4+1],a2=a[r*4+2];for(let c=0;c<4;c++)o[r*4+c]=a0*b[c]+a1*b[4+c]+a2*b[8+c];o[r*4+3]+=a[r*4+3];}return o;}
const det=m=>m[0]*(m[5]*m[10]-m[6]*m[9])-m[1]*(m[4]*m[10]-m[6]*m[8])+m[2]*(m[4]*m[9]-m[5]*m[8]);
// ---------------------------------------------------------------- formes : {v:[x,y,z…] triangles, n:[…] normales lisses}
const S=(v,n)=>({v,n});
function quad(v,n,a,b,c,d,na,nb,nc,nd){v.push(a[0],a[1],a[2],b[0],b[1],b[2],d[0],d[1],d[2],b[0],b[1],b[2],c[0],c[1],c[2],d[0],d[1],d[2]);if(n){na=na||[0,1,0];nb=nb||na;nc=nc||na;nd=nd||na;n.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nd[0],nd[1],nd[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2],nd[0],nd[1],nd[2]);}}
function tri(v,n,a,b,c,na,nb,nc){v.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);if(n){na=na||[0,1,0];nb=nb||na;nc=nc||na;n.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2]);}}
// boîte centrée. tx,tz : le dessus est rétréci (1 = boîte, 0 = arête ou pointe) → blocs taillés, toits, pyramides
function box(w=1,h=1,d=1,tx=1,tz=1){const v=[],n=[],x=w/2,y=h/2,z=d/2,X=x*tx,Z=z*tz,A=[-x,-y,-z],B=[x,-y,-z],C=[x,-y,z],D=[-x,-y,z],E=[-X,y,-Z],F=[X,y,-Z],G=[X,y,Z],H=[-X,y,Z];
  quad(v,n,A,B,C,D,[0,-1,0]);if(X>1e-6&&Z>1e-6)quad(v,n,H,G,F,E,[0,1,0]);
  const side=(a,b,c,d2,nn)=>{if(Math.hypot(c[0]-d2[0],c[1]-d2[1],c[2]-d2[2])<1e-6)tri(v,n,a,b,c,nn);else quad(v,n,a,b,c,d2,nn);};
  side(D,C,G,H,[0,0,1]);side(B,A,E,F,[0,0,-1]);side(C,B,F,G,[1,0,0]);side(A,D,H,E,[-1,0,0]);return S(v,n);}
// cylindre / tronc de cône d'axe Y, centré. seg côtés. o.a0 : angle de départ ; o.open : sans couvercles ; o.arc : portion de tour
function cyl(rt=1,rb=1,h=1,seg=8,o={}){const v=[],n=[],a0=o.a0||0,arc=o.arc||TAU,y=h/2,sl=(rb-rt)/h;
  for(let i=0;i<seg;i++){const t0=a0+i/seg*arc,t1=a0+(i+1)/seg*arc,s0=Math.sin(t0),c0=Math.cos(t0),s1=Math.sin(t1),c1=Math.cos(t1),l=Math.hypot(1,sl),n0=[s0/l,sl/l,c0/l],n1=[s1/l,sl/l,c1/l];
    const T0=[rt*s0,y,rt*c0],T1=[rt*s1,y,rt*c1],B0=[rb*s0,-y,rb*c0],B1=[rb*s1,-y,rb*c1];
    if(rt<1e-6)tri(v,n,T0,B0,B1,n0,n0,n1);else if(rb<1e-6)tri(v,n,T0,B0,T1,n0,n0,n1);else quad(v,n,T0,B0,B1,T1,n0,n0,n1,n1);
    if(!o.open){if(rt>1e-6)tri(v,n,[0,y,0],T0,T1,[0,1,0]);if(rb>1e-6)tri(v,n,[0,-y,0],B1,B0,[0,-1,0]);}}
  return S(v,n);}
const cone=(r=1,h=1,seg=8,o)=>cyl(0,r,h,seg,o);
// sphère par méridiens (lisse). o.t0,o.t1 : calotte (angles depuis le pôle nord, en radians)
function sph(r=1,ws=10,hs=7,o={}){const v=[],n=[],t0=o.t0||0,t1=o.t1===undefined?Math.PI:o.t1,P=(u,w)=>{const th=t0+w*(t1-t0),ph=u*TAU,q=[-Math.cos(ph)*Math.sin(th),Math.cos(th),Math.sin(ph)*Math.sin(th)];return q;};
  for(let iy=0;iy<hs;iy++)for(let ix=0;ix<ws;ix++){const a=P((ix+1)/ws,iy/hs),b=P(ix/ws,iy/hs),c=P(ix/ws,(iy+1)/hs),d=P((ix+1)/ws,(iy+1)/hs),m=q=>[q[0]*r,q[1]*r,q[2]*r];
    if(iy!==0||t0>1e-6)tri(v,n,m(a),m(b),m(d),a,b,d);if(iy!==hs-1||t1<Math.PI-1e-6)tri(v,n,m(b),m(c),m(d),b,c,d);}
  return S(v,n);}
const dome=(r=1,ws=10,hs=4)=>sph(r,ws,hs,{t1:Math.PI/2});   // demi-sphère ouverte en bas
// polyèdres réguliers : enveloppe convexe des sommets, subdivisée `detail` fois et projetée sur la sphère
function hull(V){const N=V.length,F=[],seen=new Set(),sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)for(let k=j+1;k<N;k++){let nr=cr(sub(V[j],V[i]),sub(V[k],V[i]));const l=Math.hypot(nr[0],nr[1],nr[2]);if(l<1e-9)continue;nr=nr.map(x=>x/l);let d=dt(nr,V[i]);if(d<0){nr=nr.map(x=>-x);d=-d;}
    let ok=true;const on=[];for(let q=0;q<N;q++){const s=dt(nr,V[q])-d;if(s>1e-6){ok=false;break;}if(s>-1e-6)on.push(q);}if(!ok)continue;const key=on.join(',');if(seen.has(key))continue;seen.add(key);
    const c=[0,0,0];for(const q of on)for(let a=0;a<3;a++)c[a]+=V[q][a]/on.length;const u=sub(V[on[0]],c),ul=Math.hypot(u[0],u[1],u[2]),ux=u.map(x=>x/ul),vx=cr(nr,ux);
    on.sort((p,q)=>Math.atan2(dt(sub(V[p],c),vx),dt(sub(V[p],c),ux))-Math.atan2(dt(sub(V[q],c),vx),dt(sub(V[q],c),ux)));for(let q=1;q<on.length-1;q++)F.push([V[on[0]],V[on[q]],V[on[q+1]]]);}
  return F;}
function poly(verts,r,detail){const nz=p=>{const l=Math.hypot(p[0],p[1],p[2]);return[p[0]/l,p[1]/l,p[2]/l];},md=(a,b)=>nz([(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]);let F=hull(verts.map(nz));
  for(let i=0;i<detail;i++){const G=[];for(const f of F){const a=f[0],b=f[1],c=f[2],ab=md(a,b),bc=md(b,c),ca=md(c,a);G.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}F=G;}
  const v=[],n=[];for(const f of F)for(const p of f){v.push(p[0]*r,p[1]*r,p[2]*r);n.push(p[0],p[1],p[2]);}return S(v,n);}
const PH=(1+Math.sqrt(5))/2,RP=1/PH;
const ICO=[[-1,PH,0],[1,PH,0],[-1,-PH,0],[1,-PH,0],[0,-1,PH],[0,1,PH],[0,-1,-PH],[0,1,-PH],[PH,0,-1],[PH,0,1],[-PH,0,-1],[-PH,0,1]];
const DOD=[[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,-RP,-PH],[0,-RP,PH],[0,RP,-PH],[0,RP,PH],[-RP,-PH,0],[-RP,PH,0],[RP,-PH,0],[RP,PH,0],[-PH,0,-RP],[PH,0,-RP],[-PH,0,RP],[PH,0,RP]];
const ico=(r=1,detail=0)=>poly(ICO,r,detail),oct=(r=1,detail=0)=>poly([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],r,detail),dod=(r=1)=>poly(DOD,r,0),tet=(r=1)=>poly([[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],r,0);
// rocher : icosphère dont chaque sommet est poussé ou tiré (même graine = même rocher). rough : 0 lisse … 0.5 très accidenté
function rock(r=1,seed=1,detail=1,rough=.28){const s=poly(ICO,1,detail),v=s.v;for(let i=0;i<v.length;i+=3){const k=1+rough*hash3(Math.round(v[i]*1e3),Math.round(v[i+1]*1e3),Math.round(v[i+2]*1e3),seed);v[i]*=r*k;v[i+1]*=r*k;v[i+2]*=r*k;}return S(v,null);}
// tore dans le plan XY (axe Z), comme three.js. R : rayon de l'anneau, r : rayon du tube
function torus(R=1,r=.3,rs=6,ts=12,arc=TAU){const v=[],n=[],P=(i,j)=>{const u=i/ts*arc,w=j/rs*TAU,cx=Math.cos(u),sx=Math.sin(u),cw=Math.cos(w),sw=Math.sin(w);return[[(R+r*cw)*cx,(R+r*cw)*sx,r*sw],[cw*cx,cw*sx,sw]];};
  for(let j=1;j<=rs;j++)for(let i=1;i<=ts;i++){const a=P(i-1,j),b=P(i-1,j-1),c=P(i,j-1),d=P(i,j);quad(v,n,a[0],b[0],c[0],d[0],a[1],b[1],c[1],d[1]);}return S(v,n);}
// profil tourné autour de Y : pts = [[rayon, y], …] DE BAS EN HAUT. o.capB / o.capT : fermer le bas / le haut
function lathe(pts,seg=10,o={}){const v=[],n=[],a0=o.a0||0;
  for(let k=0;k<pts.length-1;k++){const r0=pts[k][0],y0=pts[k][1],r1=pts[k+1][0],y1=pts[k+1][1],dr=r1-r0,dy=y1-y0,l=Math.hypot(dr,dy)||1,nr=dy/l,ny=-dr/l;if(r0<1e-6&&r1<1e-6)continue;
    for(let i=0;i<seg;i++){const t0=a0+i/seg*TAU,t1=a0+(i+1)/seg*TAU,s0=Math.sin(t0),c0=Math.cos(t0),s1=Math.sin(t1),c1=Math.cos(t1),n0=[nr*s0,ny,nr*c0],n1=[nr*s1,ny,nr*c1],T0=[r1*s0,y1,r1*c0],T1=[r1*s1,y1,r1*c1],B0=[r0*s0,y0,r0*c0],B1=[r0*s1,y0,r0*c1];
      if(r1<1e-6)tri(v,n,T0,B0,B1,n0,n0,n1);else if(r0<1e-6)tri(v,n,T0,B0,T1,n0,n0,n1);else quad(v,n,T0,B0,B1,T1,n0,n0,n1,n1);}}
  const cap=(k,up)=>{const r=pts[k][0],y=pts[k][1];if(r<1e-6)return;for(let i=0;i<seg;i++){const t0=a0+i/seg*TAU,t1=a0+(i+1)/seg*TAU,A=[r*Math.sin(t0),y,r*Math.cos(t0)],B=[r*Math.sin(t1),y,r*Math.cos(t1)];if(up)tri(v,n,[0,y,0],A,B,[0,1,0]);else tri(v,n,[0,y,0],B,A,[0,-1,0]);}};
  if(o.capB)cap(0,false);if(o.capT)cap(pts.length-1,true);return S(v,n);}
// polygone (dans le plan XZ : pts = [[x,z], …]) extrudé vers le haut de y0 à y0+h. o.taper : le dessus est rétréci autour du centre
function earcut(P){const n=P.length,ix=[];let a=0;for(let i=0;i<n;i++){const p=P[i],q=P[(i+1)%n];a+=p[0]*q[1]-q[0]*p[1];}const idx=[];for(let i=0;i<n;i++)idx.push(a>0?i:n-1-i);
  const cr=(o,p,q)=>(p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0]),inT=(p,a,b,c)=>cr(a,b,p)>=-1e-9&&cr(b,c,p)>=-1e-9&&cr(c,a,p)>=-1e-9;let guard=0;
  while(idx.length>3&&guard++<5000){let cut=false;for(let i=0;i<idx.length;i++){const i0=idx[(i+idx.length-1)%idx.length],i1=idx[i],i2=idx[(i+1)%idx.length];if(cr(P[i0],P[i1],P[i2])<=1e-12)continue;let ok=true;
      for(const j of idx){if(j===i0||j===i1||j===i2)continue;if(inT(P[j],P[i0],P[i1],P[i2])){ok=false;break;}}if(!ok)continue;ix.push(i0,i1,i2);idx.splice(i,1);cut=true;break;}if(!cut)break;}
  if(idx.length===3)ix.push(idx[0],idx[1],idx[2]);return ix;}   // triangles en sens anti-horaire dans le plan (x,z) mathématique
function prism(pts,h=1,o={}){const v=[],n=[],y0=o.y0||0,y1=y0+h,tp=o.taper===undefined?1:o.taper,N=pts.length;let cx=0,cz=0;for(const p of pts){cx+=p[0]/N;cz+=p[1]/N;}
  const top=pts.map(p=>[cx+(p[0]-cx)*tp,cz+(p[1]-cz)*tp]),ix=earcut(pts);let ar=0;for(let i=0;i<N;i++){const p=pts[i],q=pts[(i+1)%N];ar+=p[0]*q[1]-q[0]*p[1];}
  // dans le plan (x,z), « anti-horaire mathématique » est horaire vu d'au-dessus (+Y) : on retourne pour le dessus
  for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];if(tp>1e-6)tri(v,n,[top[a][0],y1,top[a][1]],[top[c][0],y1,top[c][1]],[top[b][0],y1,top[b][1]],[0,1,0]);tri(v,n,[pts[a][0],y0,pts[a][1]],[pts[b][0],y0,pts[b][1]],[pts[c][0],y0,pts[c][1]],[0,-1,0]);}
  for(let i=0;i<N;i++){const j=(i+1)%N,a=ar>0?i:j,b=ar>0?j:i,A=[pts[a][0],y0,pts[a][1]],B=[pts[b][0],y0,pts[b][1]],C=[top[b][0],y1,top[b][1]],D=[top[a][0],y1,top[a][1]],ex=B[0]-A[0],ez=B[2]-A[2],l=Math.hypot(ex,ez)||1,nn=[ez/l,0,-ex/l];
    if(tp<1e-6)tri(v,n,B,A,D,nn);else quad(v,n,B,A,D,C,nn);}
  return S(v,n);}
// courbe lissée passant par les points (Catmull-Rom), rééchantillonnée en `n` segments
function curve(pts,n=12){const out=[],L=pts.length,g=i=>pts[Math.max(0,Math.min(L-1,i))];for(let k=0;k<=n;k++){const u=k/n*(L-1),i=Math.min(L-2,Math.floor(u)),t=u-i,p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2),q=[];
    for(let a=0;a<3;a++)q[a]=.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t*t+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t*t*t);out.push(q);}return out;}
// tube le long d'un chemin de points 3D. rad : rayon, ou tableau de rayons (un par point ; 0 = pointe). Cornes, queues, lianes, anses
function tube(path,rad=.1,seg=6,o={}){const v=[],n=[],L=path.length,R=i=>Array.isArray(rad)?rad[Math.min(rad.length-1,i)]:rad,sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],nz=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];},cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const rings=[];let T0=nz(sub(path[1],path[0])),N0=Math.abs(T0[1])<.9?nz(cr(T0,[0,1,0])):nz(cr(T0,[1,0,0]));
  for(let i=0;i<L;i++){const T=nz(i===0?sub(path[1],path[0]):i===L-1?sub(path[i],path[i-1]):sub(path[i+1],path[i-1]));N0=nz(sub(N0,T.map(x=>x*dt(N0,T))));const B=cr(T,N0),ring=[],r=R(i);
    for(let k=0;k<seg;k++){const a=k/seg*TAU,c=Math.cos(a),s=Math.sin(a),d=[N0[0]*c+B[0]*s,N0[1]*c+B[1]*s,N0[2]*c+B[2]*s];ring.push([[path[i][0]+d[0]*r,path[i][1]+d[1]*r,path[i][2]+d[2]*r],d]);}rings.push({ring,T,r,c:path[i]});}
  for(let i=0;i<L-1;i++)for(let k=0;k<seg;k++){const k1=(k+1)%seg,a=rings[i].ring[k],b=rings[i].ring[k1],c=rings[i+1].ring[k1],d=rings[i+1].ring[k];
    if(rings[i+1].r<1e-6)tri(v,n,a[0],b[0],c[0],a[1],b[1],c[1]);else if(rings[i].r<1e-6)tri(v,n,a[0],c[0],d[0],a[1],c[1],d[1]);else quad(v,n,a[0],b[0],c[0],d[0],a[1],b[1],c[1],d[1]);}
  const cap=(g,flip)=>{if(g.r<1e-6)return;const nn=flip?g.T.map(x=>-x):g.T;for(let k=0;k<seg;k++){const k1=(k+1)%seg;if(flip)tri(v,n,g.c,g.ring[k1][0],g.ring[k][0],nn);else tri(v,n,g.c,g.ring[k][0],g.ring[k1][0],nn);}};
  if(!o.open){cap(rings[0],true);cap(rings[L-1],false);}return S(v,n);}
// polygone plat quelconque donné par ses sommets 3D (convexe, sens anti-horaire vu du côté visible). o.dbl : visible des deux côtés
function face(pts,o={}){const v=[],n=[];for(let i=1;i<pts.length-1;i++){tri(v,n,pts[0],pts[i],pts[i+1]);if(o.dbl)tri(v,n,pts[0],pts[i+1],pts[i]);}return S(v,null);}
// ---------------------------------------------------------------- constructeur
// b.add(forme,{p:[x,y,z], r:[rx,ry,rz], s:taille ou [sx,sy,sz], c:couleur, c2:couleur du haut (dégradé), flat:true, ch:'m'|'s'|'g'|'x', jit, ao})
function make(seed=1){const items=[],stack=[ID];let cur=ID;const rnd=rng(seed);
  const B={items,rnd,
    add(shape,o={}){items.push({shape,m:mul(cur,trs(o.p,o.r,o.s)),o});return B;},
    group(o,fn){stack.push(cur);cur=mul(cur,trs(o.p,o.r,o.s));fn(B);cur=stack.pop();return B;},
    sym(fn){fn(1);fn(-1);return B;},                                  // pièces symétriques gauche/droite : fn(côté) avec côté = 1 puis -1
    use(other,o={}){const m=mul(cur,trs(o.p,o.r,o.s));for(const it of other.items)items.push({shape:it.shape,m:mul(m,it.m),o:o.c!==undefined?Object.assign({},it.o,{c:o.c,c2:undefined}):it.o});return B;}, // recopie un autre constructeur (transformé)
    tris(){let t=0;for(const it of items)t+=it.shape.v.length/9;return t;},
    bake(bo={}){return bake(items,bo,seed);}};
  return B;}
function bake(items,bo,seed){const J=bo.jit===undefined?.05:bo.jit,gr=bo.ground||0,gh=bo.groundH||.9,og=bo.origin||[0,0,0],rnd=rng(seed*7+3),ch={},mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];let total=0;
  const remap=bo.map||{};for(const it of items){const o=it.o,m=it.m,sv=it.shape.v,sn=it.shape.n,k0=o.ch||'m',key=remap[k0]||k0,flat=o.flat!==false||!sn,flip=det(m)<0,c1=rgb(o.c===undefined?0xffffff:o.c),c2=o.c2===undefined?null:rgb(o.c2),jit=o.jit===undefined?J:o.jit,ao=o.ao||0;
    const C=ch[key]||(ch[key]={p:[],n:[],c:[]}),jm=new Map();let y0=1e9,y1=-1e9;if(c2||ao)for(let i=1;i<sv.length;i+=3){if(sv[i]<y0)y0=sv[i];if(sv[i]>y1)y1=sv[i];}
    // matrice des normales : cofacteurs de la partie 3x3 (inverse transposée à un facteur près)
    const k=[m[5]*m[10]-m[6]*m[9],m[6]*m[8]-m[4]*m[10],m[4]*m[9]-m[5]*m[8],m[2]*m[9]-m[1]*m[10],m[0]*m[10]-m[2]*m[8],m[1]*m[8]-m[0]*m[9],m[1]*m[6]-m[2]*m[5],m[2]*m[4]-m[0]*m[6],m[0]*m[5]-m[1]*m[4]],sg=flip?-1:1;
    for(let t=0;t<sv.length;t+=9){const P=[],Nn=[],Cc=[];
      for(let q=0;q<3;q++){const i=t+q*3,x=sv[i],y=sv[i+1],z=sv[i+2],X=m[0]*x+m[1]*y+m[2]*z+m[3],Y=m[4]*x+m[5]*y+m[6]*z+m[7],Z=m[8]*x+m[9]*y+m[10]*z+m[11];P.push([X,Y,Z]);
        if(!flat){const a=sn[i],b=sn[i+1],c=sn[i+2];let nx=(k[0]*a+k[1]*b+k[2]*c)*sg,ny=(k[3]*a+k[4]*b+k[5]*c)*sg,nz=(k[6]*a+k[7]*b+k[8]*c)*sg;const l=Math.hypot(nx,ny,nz)||1;Nn.push([nx/l,ny/l,nz/l]);}
        let col=c1;if(c2){const u=y1>y0?(y-y0)/(y1-y0):0;col=[c1[0]+(c2[0]-c1[0])*u,c1[1]+(c2[1]-c1[1])*u,c1[2]+(c2[2]-c1[2])*u];}
        let f=1;if(ao){const u=y1>y0?(y-y0)/(y1-y0):1;f*=1-ao*(1-u);}if(gr){const u=Math.max(0,Math.min(1,Y/gh));f*=1-gr*(1-u)*(1-u);}Cc.push([col[0]*f,col[1]*f,col[2]*f]);
        if(X<mn[0])mn[0]=X;if(Y<mn[1])mn[1]=Y;if(Z<mn[2])mn[2]=Z;if(X>mx[0])mx[0]=X;if(Y>mx[1])mx[1]=Y;if(Z>mx[2])mx[2]=Z;}
      if(flip){let tmp=P[1];P[1]=P[2];P[2]=tmp;tmp=Cc[1];Cc[1]=Cc[2];Cc[2]=tmp;if(!flat){tmp=Nn[1];Nn[1]=Nn[2];Nn[2]=tmp;}}
      const ux=P[1][0]-P[0][0],uy=P[1][1]-P[0][1],uz=P[1][2]-P[0][2],vx=P[2][0]-P[0][0],vy=P[2][1]-P[0][1],vz=P[2][2]-P[0][2];let fx=uy*vz-uz*vy,fy=uz*vx-ux*vz,fz=ux*vy-uy*vx;const fl=Math.hypot(fx,fy,fz);if(fl<1e-12)continue;fx/=fl;fy/=fl;fz/=fl;
      let jf=1;if(jit){const jk=Math.round(fx*40)+','+Math.round(fy*40)+','+Math.round(fz*40)+','+Math.round((fx*P[0][0]+fy*P[0][1]+fz*P[0][2])*200);jf=jm.get(jk);if(jf===undefined){jf=1+(rnd()*2-1)*jit;jm.set(jk,jf);}}
      for(let q=0;q<3;q++){C.p.push(P[q][0]-og[0],P[q][1]-og[1],P[q][2]-og[2]);if(flat)C.n.push(fx,fy,fz);else C.n.push(Nn[q][0],Nn[q][1],Nn[q][2]);C.c.push(Math.min(1,Cc[q][0]*jf),Math.min(1,Cc[q][1]*jf),Math.min(1,Cc[q][2]*jf));}total++;}}
  const out={tris:total,min:mn,max:mx,ch:{}};for(const key in ch)out.ch[key]={p:new Float32Array(ch[key].p),n:new Float32Array(ch[key].n),c:new Float32Array(ch[key].c)};return out;}
// ---------------------------------------------------------------- passage à three.js
let T3=null,MAT=null;
function init(THREE,o={}){T3=THREE;MAT={m:new THREE.MeshLambertMaterial({vertexColors:true}),s:new THREE.MeshPhongMaterial({vertexColors:true,shininess:55,specular:0x9aa7b4}),
  g:new THREE.MeshBasicMaterial({vertexColors:true}),x:new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})};return MAT;}
function geo(c){const g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(c.p,3));g.setAttribute('normal',new T3.BufferAttribute(c.n,3));g.setAttribute('color',new T3.BufferAttribute(c.c,3));return g;}
// transforme un résultat de cuisson en géométries three (une par canal). À garder en cache : une géométrie sert à autant d'objets qu'on veut
function geos(baked){const o={};for(const k in baked.ch)o[k]=geo(baked.ch[k]);return o;}
// crée l'objet affichable : un Group avec un Mesh par canal. o.cast / o.recv : ombres portées / reçues. o.mats : matières de remplacement par canal
function obj(gs,o={}){const g=new T3.Group();g.userData.meshes=[];for(const k in gs){const me=new T3.Mesh(gs[k],(o.mats&&o.mats[k])||MAT[k]);me.userData.ch=k;if(k==='m'||k==='s'){me.castShadow=o.cast!==false;me.receiveShadow=o.recv!==false;}g.add(me);g.userData.meshes.push(me);}return g;}
// ---------------------------------------------------------------- modèles articulés
// Une « recette » = {parts:[{name, b:constructeur, parent:'nom', pivot:[x,y,z], anim:[…]}], …infos libres}. Tout est modelé dans le repère du modèle,
// au repos ; `pivot` est le point (dans ce même repère) autour duquel la pièce tourne. Un simple constructeur vaut une recette à une seule pièce.
// prep() cuit les pièces (à faire une fois, puis garder), inst() fabrique un exemplaire affichable, pose() l'anime.
function prep(recipe,bo={}){if(recipe&&recipe.items)recipe={parts:[{name:'body',b:recipe}]};const out=Object.assign({},recipe,{parts:[],tris:0,min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]});
  for(const p of recipe.parts){const pv=p.pivot||[0,0,0],bk=p.b.bake(Object.assign({},bo,p.bake||{},{origin:pv}));out.tris+=bk.tris;for(let a=0;a<3;a++){out.min[a]=Math.min(out.min[a],bk.min[a]);out.max[a]=Math.max(out.max[a],bk.max[a]);}
    out.parts.push({name:p.name,parent:p.parent||null,pivot:pv,anim:p.anim||null,gs:geos(bk),tris:bk.tris,cast:p.cast});}return out;}
function inst(pr,o={}){const root=new T3.Group(),nodes={};for(const p of pr.parts){const g=obj(p.gs,{cast:p.cast===undefined?o.cast:p.cast,recv:o.recv,mats:o.mats});g.userData.anim=p.anim;g.userData.pivot=p.pivot;nodes[p.name]=g;}
  for(const p of pr.parts){const g=nodes[p.name],par=p.parent&&nodes[p.parent],pp=par?par.userData.pivot:[0,0,0];g.position.set(p.pivot[0]-pp[0],p.pivot[1]-pp[1],p.pivot[2]-pp[2]);g.userData.rest=[g.position.x,g.position.y,g.position.z];(par||root).add(g);}
  root.userData.nodes=nodes;root.userData.prep=pr;return root;}
// anim : [{k:'rot'|'pos'|'scl', axis:'x'|'y'|'z', amp, sp (rad/s), ph (phase), base, abs:true (rebond |sin|), spin:true (rotation continue à sp rad/s)}]
function pose(root,t,ph=0,w=1){const nodes=root.userData.nodes;for(const k in nodes){const g=nodes[k],an=g.userData.anim;if(!an)continue;const r=g.userData.rest;
    for(const a of an){const u=t*(a.sp||1)+(a.ph||0)+ph,sv=a.spin?u:(a.abs?Math.abs(Math.sin(u)):Math.sin(u))*(a.amp===undefined?1:a.amp)*w,base=a.base||0;
      if(a.k==='pos')g.position[a.axis]=r[a.axis==='x'?0:a.axis==='y'?1:2]+base+sv;else if(a.k==='scl')g.scale[a.axis]=1+base+sv;else g.rotation[a.axis]=base+sv;}}}
// ---------------------------------------------------------------- palette commune (cohérence d'un modèle à l'autre)
const EL={feu:{main:0xff6a3d,dark:0x9a2f14,deep:0x4a1408,light:0xffa35e,glow:0xffe08a},eau:{main:0x3fa9ff,dark:0x1b5fa8,deep:0x0e2f5c,light:0x8fd2ff,glow:0xd9f6ff},
  bois:{main:0x5fd068,dark:0x2a7a3c,deep:0x17432a,light:0x9ee88f,glow:0xe6ffb0},terre:{main:0xcf9a5c,dark:0x7d5730,deep:0x46301c,light:0xe8c08a,glow:0xffe6b0},elec:{main:0xffd93b,dark:0xa5820f,deep:0x4f3d0a,light:0xffee8c,glow:0xffffff},
  vent:{main:0x8fe6dc,dark:0x3f8f88,deep:0x1f4a47,light:0xc8f5ef,glow:0xffffff}};
const PAL={stone:0x8a9099,stoneL:0xa9aeb5,stoneD:0x636a73,stoneDD:0x474d55,moss:0x6f9a4a,sand:0xdcc890,dirt:0x8a6a44,dirtD:0x5c452c,
  wood:0x8f6236,woodL:0xb58652,woodD:0x5e3f22,bark:0x6e4f33,barkD:0x4a3421,plank:0xa87a48,rope:0xc9b07a,
  iron:0x3a4249,ironL:0x5a646d,steel:0xaab4bd,bronze:0xb07a3a,bronzeL:0xd9a55a,gold:0xffcf5a,goldD:0xc9952a,
  bone:0xe9e2cc,boneD:0xb9ae90,white:0xf4f1e8,black:0x1c2127,cloth:0xd9503f,clothD:0x9a2f2a,cream:0xf3e6c8,purple:0x6a4fb3,purpleD:0x3b2a6b,skin:0xe8b98a,
  leaf:0x4f9a4c,leafL:0x6fbd5d,leafD:0x2f7d45,pine:0x2f7d45,pineL:0x48a25a,pineD:0x215c35,grass:0x5d9a4c,grassL:0x74b05c,
  crystal:0x7ff3ff,crystalD:0x1fa6c0,rune:0x9ff6ff,portal:0x8a5cff,portalD:0x4b2d7a,lava:0xff7a2e,ice:0xcfeeff};
return{TAU,rgb,mix,shade,hex,rng,hash3,trs,mul,box,cyl,cone,sph,dome,ico,oct,dod,tet,rock,torus,lathe,prism,curve,tube,face,make,bake,init,geo,geos,obj,prep,inst,pose,EL,PAL,get MAT(){return MAT;}};
})();
if(typeof module!=='undefined')module.exports=K;
