// vérifie le sens des faces de chaque forme (volume signé positif, normales vers l'extérieur pour les formes convexes)
const K=require('./kit.js');
const vol=s=>{let v=0;const a=s.v;for(let i=0;i<a.length;i+=9){const x1=a[i],y1=a[i+1],z1=a[i+2],x2=a[i+3],y2=a[i+4],z2=a[i+5],x3=a[i+6],y3=a[i+7],z3=a[i+8];v+=(x1*(y2*z3-z2*y3)-y1*(x2*z3-z2*x3)+z1*(x2*y3-y2*x3))/6;}return v;};
const convexOut=s=>{const a=s.v;let c=[0,0,0];for(let i=0;i<a.length;i+=3){c[0]+=a[i];c[1]+=a[i+1];c[2]+=a[i+2];}c=c.map(x=>x/(a.length/3));let bad=0;
  for(let i=0;i<a.length;i+=9){const ux=a[i+3]-a[i],uy=a[i+4]-a[i+1],uz=a[i+5]-a[i+2],vx=a[i+6]-a[i],vy=a[i+7]-a[i+1],vz=a[i+8]-a[i+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,mx=(a[i]+a[i+3]+a[i+6])/3-c[0],my=(a[i+1]+a[i+4]+a[i+7])/3-c[1],mz=(a[i+2]+a[i+5]+a[i+8])/3-c[2];if(nx*mx+ny*my+nz*mz<-1e-9)bad++;}return bad;};
const smoothOk=s=>{if(!s.n)return 'plat';const a=s.v,n=s.n;let bad=0;for(let i=0;i<a.length;i+=9){const ux=a[i+3]-a[i],uy=a[i+4]-a[i+1],uz=a[i+5]-a[i+2],vx=a[i+6]-a[i],vy=a[i+7]-a[i+1],vz=a[i+8]-a[i+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(let q=0;q<3;q++)if(nx*n[i+q*3]+ny*n[i+q*3+1]+nz*n[i+q*3+2]<-1e-9)bad++;}return bad?'NORMALES INVERSÉES '+bad:'ok';};
const T={box:K.box(2,1,3),toit:K.box(2,1,3,0,1),pyramide:K.box(2,1,2,0,0),cyl:K.cyl(1,1.5,2,8),cone:K.cone(1,2,7),coneInv:K.cyl(1,0,2,6),sph:K.sph(1,10,7),dome:K.dome(1,8,3),ico:K.ico(1),ico1:K.ico(1,1),oct:K.oct(1),dod:K.dod(1),tet:K.tet(1),
  rock:K.rock(1,3,1,.3),torus:K.torus(1,.3,6,12),lathe:K.lathe([[.5,0],[1,.5],[.8,1.2],[0,1.6]],8,{capB:true}),prismCCW:K.prism([[0,0],[1,0],[1,1],[0,1]],1),prismCW:K.prism([[0,0],[0,1],[1,1],[1,0]],1),
  etoile:K.prism([0,1,2,3,4,5,6,7,8,9].map(i=>{const a=i/10*K.TAU,r=i%2?.4:1;return[Math.cos(a)*r,Math.sin(a)*r];}),.3),pointe:K.prism([[0,0],[1,0],[1,1],[0,1]],1,{taper:0}),
  tube:K.tube([[0,0,0],[0,1,0],[.5,1.8,0],[1.2,2,0]],[.3,.25,.15,0],6),tubeY:K.tube([[0,0,0],[0,1,0]],.3,6),tubeX:K.tube([[0,0,0],[1,0,0],[2,.5,0]],.2,5)};
const convex=new Set(['box','toit','pyramide','cyl','cone','coneInv','sph','ico','ico1','oct','dod','tet','prismCCW','prismCW','pointe','tubeY']);
let fail=0;for(const k in T){const s=T[k],v=vol(s),c=convex.has(k)?convexOut(s):'-',sm=smoothOk(s);const ok=v>0&&(c==='-'||c===0)&&!String(sm).startsWith('NORM');if(!ok)fail++;console.log((ok?'ok ':'ÉCHEC ')+k.padEnd(10),'tris',String(s.v.length/9).padStart(4),'volume',v.toFixed(3),'faces vers dedans',c,'lisse',sm);}
// transformation en miroir : le volume doit rester positif après cuisson
const b=K.make(5);b.add(K.box(1,2,3),{p:[1,0,0],s:[-1,1,1],c:0xff0000}).add(K.cyl(.5,.7,1,6),{p:[0,2,0],r:[.3,.5,.2],s:[1,2,-1],flat:false});const bk=b.bake();
const bv=vol({v:Array.from(bk.ch.m.p)});console.log(bv>0?'ok ':'ÉCHEC ','miroir cuit: tris',bk.tris,'volume',bv.toFixed(3));if(!(bv>0))fail++;
// normales cuites cohérentes avec le sens des faces
{const p=bk.ch.m.p,n=bk.ch.m.n;let bad=0;for(let i=0;i<p.length;i+=9){const ux=p[i+3]-p[i],uy=p[i+4]-p[i+1],uz=p[i+5]-p[i+2],vx=p[i+6]-p[i],vy=p[i+7]-p[i+1],vz=p[i+8]-p[i+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(let q=0;q<3;q++)if(nx*n[i+q*3]+ny*n[i+q*3+1]+nz*n[i+q*3+2]<=0)bad++;}console.log(bad?'ÉCHEC ':'ok ','normales cuites vers l\'extérieur, écarts:',bad);if(bad)fail++;}
console.log(fail?'>>> '+fail+' ÉCHEC(S)':'>>> tout est bon');
