// BESTIAIRE 1 — trois ennemis de L'Île des Cinq : le Bélier (enemy.tank), la Raie des vents (enemy.air), le Foreur (enemy.dig).
// Même structure que le lutin (enemy_b.js) : pièces nommées, pivots, animation décrite par des données. ctx = {el, P}.
{
const {PAL}=K,PI=Math.PI;
// ---------- petits outils de géométrie (un point = [x,y,z])
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],unit=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];};
const mid=q=>{const c=[0,0,0];for(const p of q)for(let a=0;a<3;a++)c[a]+=p[a]/q.length;return c;};
const aim=d=>{d=unit(d);return[Math.atan2(d[2],d[1]),0,-Math.asin(d[0])];};          // rotation qui couche l'axe +Y d'une forme sur la direction d
// facette orientée : `ref` est un point situé du côté caché (l'intérieur du volume) ; la diagonale part toujours du premier point
const facet=(b,q,ref,o)=>{let n=crs(sub(q[1],q[0]),sub(q[2],q[0]));if(Math.hypot(n[0],n[1],n[2])<1e-9&&q.length>3)n=crs(sub(q[2],q[0]),sub(q[3],q[0]));
  b.add(K.face(dot(n,sub(mid(q),ref))<0?[q[0]].concat(q.slice(1).reverse()):q),o);};
// peau tendue entre des couronnes de points (même nombre de points partout). o : options de b.add ou fonction (i,k,centre)=>options. cl : couronnes fermées
const skin=(b,R,o,cl,ref)=>{for(let i=0;i<R.length-1;i++){const A=R[i],B=R[i+1],n=A.length,rf=ref||mid(A.concat(B));
  for(let k=0;k<(cl?n:n-1);k++){const k1=(k+1)%n,q=[A[k],A[k1],B[k1],B[k]],c=mid(q);facet(b,c[0]>1e-6?[q[1],q[2],q[3],q[0]]:q,rf,typeof o==='function'?o(i,k,c):o);}}};
// éventail : referme une couronne sur un point
const fan=(b,R,tip,o,cl,ref)=>{const n=R.length,rf=ref||mid(R);for(let k=0;k<(cl?n:n-1);k++){const q=[R[k],R[(k+1)%n],tip];facet(b,q,rf,typeof o==="function"?o(0,k,mid(q)):o);}};
// pointe (cône) plantée en p et dirigée vers d
const spike=(b,p,d,r,h,seg,o)=>{d=unit(d);b.add(K.cone(r,h,seg),Object.assign({p:[p[0]+d[0]*h/2,p[1]+d[1]*h/2,p[2]+d[2]*h/2],r:aim(d)},o));};
// point et normale d'une plaque (grille de couronnes ouvertes) : u = 0…1 de la première à la dernière couronne, v = -1…1 d'un bord à l'autre
const at=(R,u,v)=>{const m=R.length-1,n=R[0].length-1,fu=Math.min(m-1e-6,Math.max(0,u)*m),fv=Math.min(n-1e-6,Math.max(0,(v+1)/2)*n),i=Math.floor(fu),k=Math.floor(fv);
  return lerp(lerp(R[i][k],R[i][k+1],fv-k),lerp(R[i+1][k],R[i+1][k+1],fv-k),fu-i);};
const ma=(a,b,k)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];                              // a + k·b
const nrm=(R,u,v)=>{const e=.03,p=at(R,u,v);let n=crs(sub(at(R,u+e,v),at(R,u-e,v)),sub(at(R,u,v+e),at(R,u,v-e)));if(dot(n,[p[0],p[1]-.5,0])<0)n=[-n[0],-n[1],-n[2]];return unit(n);};

// ruban posé sur une surface (2 triangles), de p à q, large de w ; `up` ≈ normale de la surface ; dia : en losange (fissure pointue)
const ribbon=(b,p,q,w,up,o,dia)=>{const s=unit(crs(sub(q,p),up)),m=mid([p,q]),L=x=>ma(x,up,.015);
  facet(b,dia?[L(p),L(ma(m,s,w/2)),L(q),L(ma(m,s,-w/2))]:[L(ma(p,s,-w/2)),L(ma(q,s,-w/2)),L(ma(q,s,w/2)),L(ma(p,s,w/2))],ma(m,up,-1),o);};
// couture le long d'une arête de la grille d'une plaque : du sommet (i0,k0) au sommet (i1,k1)
const seam=(b,R,i0,k0,i1,k1,w,o,dia)=>ribbon(b,R[i0][k0],R[i1][k1],w,nrm(R,(i0+i1)/2/(R.length-1),(k0+k1)/(R[0].length-1)-1),o,dia);
// feuille pliée en V (4 triangles, visible des deux côtés) : part de p vers d, `up` = côté du dessus
const leafAt=(b,p,d,up,L,W,o)=>{d=unit(d);const s=unit(crs(d,up)),m=ma(ma(p,d,L*.42),up,L*.14);b.add(K.face([p,ma(m,s,W),ma(p,d,L),ma(m,s,-W)],{dbl:true}),o);};
// flammèche : deux langues de feu lumineuses
const flamelet=(b,p,s,P)=>b.group({p,s},b=>{b.add(K.cone(.1,.44,4),{p:[0,.2,0],c:P.main,c2:P.glow,ch:'g',jit:0}).add(K.cone(.07,.27,4),{p:[.09,.11,.03],r:[.1,.6,-.3],c:P.dark,c2:P.light,ch:'g',jit:0});});
// éclat de cristal à cinq pans (15 triangles), planté en p et dirigé vers d
const shard=(b,p,d,r,h,o)=>b.add(K.lathe([[r*.8,0],[r,h*.6],[0,h]],5),Object.assign({p,r:aim(d)},o));

// =====================================================================================================================
// LE BÉLIER (enemy.tank) — scarabée-rhinocéros cuirassé à six pattes : trois plaques de carapace, tête basse, corne-bélier
// =====================================================================================================================
const arch=(z,w,y0,h)=>{const r=[];for(let i=0;i<7;i++){const a=-PI/2+i*PI/6,s=Math.sin(a),c=Math.max(0,Math.cos(a));r.push([w*Math.sign(s)*Math.pow(Math.abs(s),.8),y0+h*Math.pow(c,.8),z]);}return r;};
// ce qui change d'un élément à l'autre. S = {A,B,C : les trois plaques (grilles 3 × 7 points), HP : le chemin de la corne}
const tankDeco={
  feu:(b,P,S)=>{const g={c:K.mix(PAL.lava,P.glow,.7),ch:'g',jit:0};                                                        // croûte de lave : fissures lumineuses, flammes
    [[S.B,1,1,1,2],[S.B,1,2,1,3],[S.B,1,3,1,4],[S.B,1,4,1,5],[S.B,0,2,1,2],[S.B,1,4,2,4],[S.B,1,1,2,1],[S.B,0,5,1,5],[S.B,1,2,2,3],[S.A,1,2,1,3],[S.A,1,3,1,4],[S.A,1,3,2,3],[S.A,0,1,1,2],[S.C,1,2,1,3],[S.C,1,3,1,4],[S.C,0,2,1,2],[S.C,0,4,1,4],[S.C,1,5,2,5]]
      .forEach(q=>seam(b,q[0],q[1],q[2],q[3],q[4],.075,g,true));
    SH.flame(b,{p:ma(at(S.B,.5,0),[0,1,0],-.03),s:1.05});flamelet(b,at(S.A,.6,0),.8,P);flamelet(b,at(S.C,.45,0),.85,P);},
  eau:(b,P,S)=>{const rib={c:P.light,jit:.03};                                                                             // coquille côtelée, voile dorsale, nageoires
    for(const k of[1,2,4,5]){seam(b,S.B,0,k,1,k,.05,rib);seam(b,S.B,1,k,2,k,.05,rib);}
    for(const k of[2,3,4]){seam(b,S.A,1,k,2,k,.045,rib);seam(b,S.C,0,k,1,k,.045,rib);}
    const R=[0,.34,.68,1].map(u=>ma(at(S.B,u,0),[0,1,0],-.05)),T=[.3,.58,.5,.28].map((h,j)=>ma(R[j],[0,h,-.2],1));
    for(let j=0;j<3;j++)b.add(K.face([R[j],R[j+1],T[j+1],ma(mid([T[j],T[j+1]]),[0,1,0],-.12),T[j]],{dbl:true}),{c:j%2?P.glow:P.light,jit:.03});
    b.sym(sd=>{const r=[.45,.72,1].map(u=>at(S.B,u,sd*.72)),t=[[sd*.4,.22,-.25],[sd*.62,.14,-.38],[sd*.3,0,-.32]].map((d,j)=>ma(r[j],d,1));
      for(let j=0;j<2;j++)b.add(K.face([r[j],r[j+1],t[j+1],t[j]],{dbl:true}),{c:j?P.light:P.glow,jit:.03});});
    b.add(K.face([[0,.52,-1.2],[0,.92,-1.5],[0,.47,-1.38],[0,.14,-1.47]],{dbl:true}),{c:P.light});                         // nageoire de queue
    SH.drop(b,{p:at(S.A,.62,0),s:.8});},
  bois:(b,P,S)=>{const bk={c:PAL.bark,jit:.06};                                                                            // écorce, crête de feuilles, ronce
    for(const k of[1,2,4,5]){seam(b,S.B,0,k,1,k,.07,bk);seam(b,S.B,1,k,2,k,.07,bk);}
    SH.leaf(b,{p:at(S.A,.6,0),s:.9});
    [[S.B,.08,.5],[S.B,.4,.62],[S.B,.72,.56],[S.B,1,.44],[S.C,.5,.34]].forEach((q,j)=>{const sd=j%2?1:-1;leafAt(b,ma(at(q[0],q[1],0),[0,1,0],-.06),[sd*.22,1,-.35],[sd,0,0],q[2],q[2]*.36,{c:j%2?P.light:P.glow,jit:.03});});
    const V=K.curve([at(S.A,.55,-.75),at(S.B,.15,-.5),at(S.B,.55,.3),at(S.B,.95,.55),at(S.C,.6,.75)].map(p=>ma(p,[0,1,0],.03)),6);
    b.add(K.tube(V,.045,3),{c:PAL.bark});[1,2,4,5].forEach(j=>spike(b,V[j],[V[j][0]*.5,1,j%2?.4:-.4],.04,.17,3,{c:PAL.bone,jit:0}));},
  terre:(b,P,S)=>{const cr={c:P.main,c2:P.glow,jit:.08};                                                                   // dalles de roche, cristaux d'ambre
    SH.crystal(b,{p:ma(at(S.B,.5,0),[0,1,0],-.03),s:1.2});
    [[S.A,.6,-.35,.5],[S.B,.2,.5,.42],[S.B,.85,-.45,.46],[S.C,.5,.2,.4]].forEach(q=>{const n=nrm(q[0],q[1],q[2]);shard(b,at(q[0],q[1],q[2]),[n[0],n[1]+.5,n[2]],.09,q[3],cr);});
    [[S.A,.75,.55,.2,3],[S.B,.5,-.78,.22,5],[S.B,.75,.8,.19,7],[S.C,.35,-.6,.2,9]].forEach(q=>b.add(K.rock(q[3],q[4],0,.3),{p:at(q[0],q[1],q[2]),s:[1.2,.7,1.2],c:q[4]%4===1?PAL.stone:PAL.stoneL,jit:.08}));},
  elec:(b,P,S)=>{                                                                                                          // plaques rivetées, bobines de cuivre, éclair
    for(const q of[[S.A,.6,-.5],[S.A,.6,.5],[S.B,.12,-.72],[S.B,.12,-.25],[S.B,.12,.25],[S.B,.12,.72],[S.B,.88,-.72],[S.B,.88,-.25],[S.B,.88,.25],[S.B,.88,.72]])b.add(K.tet(.06),{p:at(q[0],q[1],q[2]),c:PAL.steel,jit:0});
    SH.bolt(b,{p:at(S.B,.5,0),s:1.15});
    b.sym(sd=>{const p=at(S.B,.5,sd*.55),n=nrm(S.B,.5,sd*.55);b.group({p,r:aim([n[0]*.6,1,0])},b=>{for(let j=0;j<3;j++)b.add(K.cyl(.07,.12,.09,5,{open:true}),{p:[0,.05+j*.09,0],c:j%2?PAL.bronzeL:PAL.bronze});
        b.add(K.cyl(.035,.035,.2,4,{open:true}),{p:[0,.38,0],c:PAL.iron}).add(K.oct(.075),{p:[0,.5,0],c:P.glow,ch:'g',jit:0});});});
    b.add(K.lathe([[.13,-.035],[.215,0],[.13,.035]],5),{p:S.HP[1],r:aim(sub(S.HP[2],S.HP[0])),c:PAL.bronze});}};
MODELS['enemy.tank']=ctx=>{const P=ctx.P,el=ctx.el,body=K.make(31),LA=K.make(32),LB=K.make(33);
  // style par élément : plaques (bas, haut), tranche des plaques, corne (base, pointe)
  const ST={feu:{lo:K.mix(P.deep,P.dark,.3),hi:K.mix(P.dark,P.main,.12),edge:{c:PAL.lava,c2:P.glow,ch:'g',jit:0},horn:[K.mix(P.deep,PAL.black,.5),K.mix(P.dark,PAL.lava,.6)]},
    eau:{lo:P.dark,hi:P.main,edge:{c:P.glow},horn:[P.light,PAL.white]},bois:{lo:P.dark,hi:P.main,edge:{c:PAL.barkD},horn:[PAL.barkD,PAL.plank]},
    terre:{lo:P.dark,hi:P.main,edge:{c:PAL.stoneD},horn:[PAL.stoneD,PAL.stoneL]},elec:{lo:P.dark,hi:P.main,edge:{c:PAL.iron},horn:[PAL.iron,PAL.steel]}},st=ST[el]||ST.feu;
  // --- carapace : trois plaques ; celle du milieu chevauche les deux autres (tranches visibles de face comme de dos)
  const A=[arch(.76,.42,.56,.38),arch(.52,.74,.42,.78),arch(.2,.83,.36,.93)],B=[arch(.23,.91,.3,1.08),arch(-.2,.94,.28,1.17),arch(-.62,.9,.3,1.1)],C=[arch(-.59,.81,.36,.95),arch(-.92,.66,.42,.66),arch(-1.14,.38,.5,.32)];
  const plate=(i,k,c)=>({c:K.mix(st.lo,st.hi,Math.max(0,Math.min(1,(c[1]-.4)/.95))),jit:.09});
  skin(body,A,plate);skin(body,B,plate);skin(body,C,plate);
  skin(body,[B[0],A[2]],st.edge,false,[0,.3,-1.5]);skin(body,[B[2],C[0]],st.edge,false,[0,.3,1.5]);
  fan(body,A[0],[0,.72,.8],plate);fan(body,C[2],[0,.56,-1.24],plate);
  for(const R of[A,B,C])for(const k of[0,6])for(let i=0;i<2;i++){const d=[k?.07:-.07,-.08,0];facet(body,[R[i][k],R[i+1][k],ma(R[i+1][k],d,1),ma(R[i][k],d,1)],[0,.6,R[i][k][2]],{c:P.deep});}   // ourlet du bord
  body.add(K.box(1.5,.34,1.8,.8,.85),{p:[0,.36,-.2],r:[PI,0,0],c:K.mix(P.dark,P.light,.5)});                             // ventre
  body.sym(sd=>{for(const u of[.12,.5,.88]){const p=at(B,u,sd);spike(body,[p[0]-sd*.04,p[1]+.1,p[2]],[sd,-.15,0],.08,.2,3,{c:PAL.bone,jit:0});}   // pointes du bord
    spike(body,at(A,.55,sd*.6),[sd*.8,.6,.35],.09,.36,4,{c:PAL.boneD,c2:PAL.bone});});                                    // cornes d'épaule
  // --- tête basse : crâne en coin, mâchoire, mandibules
  const hl=(z,w,yT,yB,wT,wB,yM)=>[[-wT,yT,z],[wT,yT,z],[w,yM,z],[wB,yB,z],[-wB,yB,z],[-w,yM,z]];
  const H=[hl(.5,.5,.92,.32,.34,.36,.64),hl(.9,.45,.84,.36,.3,.3,.6),hl(1.12,.3,.66,.38,.19,.2,.52)];
  skin(body,H,(i,k,c)=>({c:K.mix(P.dark,P.main,k===0?.9:k===3?.1:.55),jit:.07}),true);fan(body,H[2],[0,.5,1.25],{c:P.main},true);
  body.add(K.box(.5,.13,.56,.85,.8),{p:[0,.25,.94],r:[.2,0,0],c:P.deep});                                                // mâchoire
  for(const x of[-.2,-.07,.07,.2])spike(body,[x,.28,1.15],[0,1,.15],.05,.17,3,{c:PAL.bone,jit:0});                        // dents du bas
  body.sym(sd=>{spike(body,[sd*.15,.4,1.1],[0,-1,.1],.055,.18,3,{c:PAL.white,jit:0});                                     // crocs
    body.add(K.tube([[sd*.42,.44,.9],[sd*.53,.36,1.18],[sd*.36,.32,1.4],[sd*.15,.35,1.46]],[.09,.08,.055,0],4),{c:PAL.boneD,c2:PAL.bone});   // mandibules
    SH.eye(body,{p:[sd*.34,.69,.98],r:.09,rot:[0,sd*.9,0]});
    body.add(K.box(.28,.08,.2),{p:[sd*.32,.8,1.0],r:[.25,sd*.5,sd*.45],c:P.deep});});                                     // arcade
  const HP=K.curve([[0,.7,.95],[0,.78,1.2],[0,.94,1.4],[0,1.2,1.47]],5);
  body.add(K.tube(HP,[.2,.19,.16,.12,.07,0],5),{c:st.horn[0],c2:st.horn[1]});                                             // corne-bélier
  body.add(K.tube([[0,.56,-1.1],[0,.44,-1.27],[0,.32,-1.36]],[.14,.09,0],4),{c:P.dark});                                 // queue
  (tankDeco[el]||tankDeco.feu)(body,P,{A,B,C,HP});
  // --- six pattes trapues en deux trépieds : cuisse, genou à éperon, tibia, deux griffes
  const leg=(b,sd,zh,f)=>{const zk=zh+f*.1,zf=zh+f*.2;b.add(K.tube([[sd*.5,.46,zh],[sd*.93,.62,zk],[sd*.98,.13,zf]],[.17,.2,.13],5),{c:P.dark,c2:P.main});
    spike(b,[sd*.95,.7,zk],[sd*.6,.8,0],.1,.26,3,{c:P.deep});
    spike(b,[sd*.98,.14,zf],[sd*.1,-.35,.9],.09,.3,3,{c:PAL.bone,jit:0});spike(b,[sd*.98,.14,zf],[sd*.6,-.35,.7],.09,.3,3,{c:PAL.bone,jit:0});};
  [.42,-.12,-.66].forEach((z,j)=>{leg(j%2?LB:LA,1,z,1-j);leg(j%2?LA:LB,-1,z,1-j);});
  return{parts:[{name:'body',b:body},{name:'legsA',b:LA,parent:'body',pivot:[0,.46,-.12],anim:[{k:'rot',axis:'x',amp:.3,sp:5,ph:0}]},
      {name:'legsB',b:LB,parent:'body',pivot:[0,.46,-.12],anim:[{k:'rot',axis:'x',amp:.3,sp:5,ph:PI}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:.93,barY:2.1,r:1.2};};

// =====================================================================================================================
// LA RAIE DES VENTS (enemy.air) — raie manta, chauve-souris et wyverne : corps plat, ailes à membranes, queue à motif
// Le joueur la voit d'en dessous : ventre clair annelé, emblème lumineux, os sombres sur membranes claires.
// =====================================================================================================================
// membrane à deux faces : dessus cT, dessous cB
const memb=(b,q,cT,cB,o)=>{const n=crs(sub(q[1],q[0]),sub(q[2],q[0])),up=n[1]>=0?q:[q[0]].concat(q.slice(1).reverse());
  b.add(K.face(up),Object.assign({c:cT},o));b.add(K.face([up[0]].concat(up.slice(1).reverse())),Object.assign({c:cB},o));};
// bord de fuite de l'aile par élément : pointe T, creux, doigt F2, creux, doigt F3, creux (x, z) — flammes, raie lisse, feuille, dalle, éclair
const rayEdge={feu:[[1.9,-.38],[1.42,-.26],[1.5,-.95],[1.05,-.46],[.92,-1.02],[.58,-.46]],eau:[[1.9,-.42],[1.6,-.5],[1.42,-.8],[1.15,-.76],[.88,-.9],[.6,-.66]],
  bois:[[1.9,-.25],[1.55,-.42],[1.4,-.85],[1.12,-.64],[.86,-.92],[.6,-.58]],terre:[[1.85,-.15],[1.7,-.5],[1.4,-.78],[1.16,-.7],[.9,-.85],[.62,-.62]],
  elec:[[1.9,-.36],[1.38,-.2],[1.52,-.9],[1.0,-.4],[.95,-1.0],[.56,-.38]]};
// emblème du ventre (contour x,z) : se lit d'en dessous
const rayGlyph={feu:[[0,.34],[.07,.12],[.15,.2],[.14,-.02],[.08,-.2],[-.08,-.2],[-.15,-.02],[-.1,.14],[-.04,.06]],eau:[[0,.32],[.1,.08],[.14,-.08],[.1,-.2],[0,-.26],[-.1,-.2],[-.14,-.08],[-.1,.08]],
  bois:[[0,-.26],[.13,-.06],[.1,.12],[0,.32],[-.1,.12],[-.13,-.06]],terre:[[0,.32],[.13,.08],[.07,-.24],[-.07,-.24],[-.13,.08]],elec:[[-.02,-.3],[.16,-.04],[.05,-.03],[.2,.32],[-.1,0],[.03,-.01],[-.14,-.3]]};
MODELS['enemy.air']=ctx=>{const P=ctx.P,el=rayEdge[ctx.el]?ctx.el:'feu',body=K.make(41),WL=K.make(42),WR=K.make(43);
  const bone={feu:P.deep,eau:P.dark,bois:PAL.barkD,terre:PAL.stoneD,elec:PAL.iron}[el];
  // --- corps : couronnes de 8 points (0 dos, 2 et 6 flancs, 4 ventre), du museau à la base de la queue
  const rl=(z,w,y,hT,hB)=>[[0,y+hT,z],[w*.62,y+hT*.72,z],[w,y,z],[w*.6,y-hB*.92,z],[0,y-hB,z],[-w*.6,y-hB*.92,z],[-w,y,z],[-w*.62,y+hT*.72,z]];
  const R=[rl(.98,.2,.72,.08,.07),rl(.72,.36,.73,.17,.13),rl(.4,.42,.74,.25,.2),rl(0,.42,.74,.27,.22),rl(-.38,.38,.74,.2,.18),rl(-.6,.16,.74,.1,.09)];
  skin(body,R,(i,k,c)=>k===3||k===4?{c:i===0?P.deep:K.mix(P.light,P.glow,i%2?.8:.3),jit:.03}:k===2||k===5?{c:K.mix(P.main,P.light,.6),jit:.05}:{c:K.mix(P.dark,P.main,k===0||k===7?.85:.45),jit:.07},true);
  fan(body,R[0],[0,.71,1.08],(i,k)=>({c:k>1&&k<6?P.light:P.main}),true);fan(body,R[5],[0,.74,-.7],{c:P.dark},true);
  body.add(K.prism(rayGlyph[el],.03),{p:[0,.5,.1],c:K.mix(P.light,P.glow,.6),ch:'g',jit:0});                            // emblème lumineux sous le ventre
  // --- tête : mâchoire, crocs, lobes de raie, cornes, yeux
  body.add(K.box(.34,.06,.46,.75,.6),{p:[0,.565,.8],r:[.2,0,0],c:P.light});                                             // mâchoire
  body.sym(sd=>{spike(body,[sd*.11,.66,.99],[0,-1,.1],.035,.15,3,{c:PAL.white,jit:0});spike(body,[sd*.2,.64,.84],[0,-1,0],.03,.11,3,{c:PAL.white,jit:0});   // crocs
    spike(body,[sd*.09,.56,.98],[0,1,.2],.028,.1,3,{c:PAL.bone,jit:0});
    body.add(K.tube([[sd*.3,.7,.78],[sd*.37,.66,1.0],[sd*.27,.6,1.15]],[.07,.055,0],4),{c:P.dark,c2:P.main});            // lobes céphaliques
    body.add(K.tube([[sd*.2,.9,.52],[sd*.3,1.0,.3],[sd*.34,1.04,.08]],[.065,.05,0],4),{c:PAL.boneD,c2:PAL.bone});        // cornes couchées
    SH.eye(body,{p:[sd*.36,.72,.7],r:.1,rot:[.4,sd*1.05,0]});
    body.add(K.box(.2,.06,.22),{p:[sd*.34,.83,.72],r:[.1,sd*.2,sd*-.35],c:P.deep});});                                   // arcade
  // --- queue en fouet et motif de l'élément au bout
  body.add(K.tube(K.curve([[0,.74,-.5],[0,.7,-.72],[0,.72,-.9],[0,.8,-1.02]],4),[.1,.08,.065,.05,.04],4),{c:P.dark,c2:P.main});
  SH.motif(body,el,{p:[0,.8,-1.0],r:[-1.2,0,0],s:.75});
  // --- ailes : bras, trois doigts, membranes (dessus sombre, dessous clair)
  const wing=(b,sd)=>{const E=rayEdge[el],pt=(q,y)=>[sd*q[0],y,q[1]],A=[sd*.36,.74,.5],Bq=[sd*.36,.74,-.38],W=[sd*1.05,.85,.42],T=pt(E[0],.7),F2=pt(E[2],.68),F3=pt(E[4],.68);
    [[W,T,pt(E[1],.72)],[W,pt(E[1],.72),F2],[W,F2,pt(E[3],.7)],[W,pt(E[3],.7),F3],[W,F3,pt(E[5],.7)],[W,pt(E[5],.7),Bq],[W,Bq,A]].forEach((q,j)=>memb(b,q,K.mix(P.dark,P.main,[.95,.7,.85,.55,.7,.45,.6][j]),K.mix(P.light,P.glow,[.6,.3,.5,.2,.4,.15,.3][j]),{jit:.04}));
    b.add(K.tube([[sd*.34,.76,.44],[sd*.72,.83,.5],W],[.085,.075,.06],4),{c:bone});                                      // bras
    for(const F of[T,F2,F3])b.add(K.tube([W,ma(mid([W,F]),[0,1,0],.05),F],[.05,.04,0],3),{c:bone});                      // doigts
    spike(b,W,[sd*.3,.25,1],.05,.2,3,{c:PAL.bone,jit:0});};                                                              // griffe du poignet
  wing(WL,1);wing(WR,-1);
  return{parts:[{name:'body',b:body},{name:'wingL',b:WL,parent:'body',pivot:[.36,.74,0],anim:[{k:'rot',axis:'z',amp:.5,sp:11}]},
      {name:'wingR',b:WR,parent:'body',pivot:[-.36,.74,0],anim:[{k:'rot',axis:'z',amp:-.5,sp:11}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:1,barY:1.4,r:1.2};};

// =====================================================================================================================
// LE FOREUR (enemy.dig) — taupe-tatou : dos en bandes de cuirasse, vrille en spirale sur le museau, pattes de terrassier
// =====================================================================================================================
// vrille le long de +Z : cône (base en z0, axe à la hauteur y) + filet en spirale à deux pans
const drillBit=(b,y,z0,r0,L,turns,core,thr)=>{b.add(K.cone(r0,L,8),{p:[0,y,z0+L/2],r:[PI/2,0,0],c:core[0],c2:core[1],jit:.06});
  const n=Math.round(turns*8),pt=(j,dr,dz)=>{const t=j/n,a=t*turns*2*PI,rc=r0*(1-t*.96)+dr*(1-t*.55);return[Math.cos(a)*rc,y+Math.sin(a)*rc,z0+t*L*.96+dz];};
  for(let j=0;j<n;j++){const ax=[0,y,z0+(j+.5)/n*L];facet(b,[pt(j,.13,0),pt(j+1,.13,0),pt(j+1,-.02,.08),pt(j,-.02,.08)],ax,{c:thr[1],jit:.04});
    facet(b,[pt(j,.13,0),pt(j+1,.13,0),pt(j+1,-.02,-.08),pt(j,-.02,-.08)],ax,{c:thr[0],jit:.04});}};
// griffe plate de terrassier (pyramide aplatie, 6 triangles) plantée en p et dirigée vers d
const claw=(b,p,d,w,h,t,o)=>{d=unit(d);b.add(K.box(w,h,t,0,0),Object.assign({p:ma(p,d,h/2),r:aim(d)},o));};
// ce qui change d'un élément à l'autre. G = {S,T,U,V : les quatre bandes du dos, de l'épaule à la croupe}
const digDeco={
  feu:(b,P,G)=>{const g={c:K.mix(PAL.lava,P.glow,.7),ch:'g',jit:0};                                                        // croûte de lave fissurée, flammes sur l'échine
    [[G.S,1,2,1,3],[G.S,1,3,1,4],[G.S,0,2,1,2],[G.S,1,4,2,4],[G.T,0,2,1,2],[G.T,0,4,1,4],[G.U,0,1,1,1],[G.U,0,3,1,3],[G.U,0,5,1,5],[G.V,1,2,1,3],[G.V,1,3,1,4],[G.V,0,3,1,3]].forEach(q=>seam(b,q[0],q[1],q[2],q[3],q[4],.07,g,true));
    SH.flame(b,{p:ma(at(G.S,.6,0),[0,1,0],-.03),s:.85});flamelet(b,at(G.T,.6,0),.8,P);flamelet(b,at(G.U,.6,0),.75,P);flamelet(b,at(G.V,.4,0),.7,P);},
  eau:(b,P,G)=>{const rib={c:P.light,jit:.03};                                                                             // coquille côtelée, crête de nageoire, palmes
    for(const R of[G.T,G.U])for(const k of[1,2,4,5])seam(b,R,0,k,1,k,.05,rib);
    for(const k of[2,4]){seam(b,G.S,1,k,2,k,.045,rib);seam(b,G.V,0,k,1,k,.045,rib);}
    const Rr=[at(G.T,.1,0),at(G.T,.9,0),at(G.U,.6,0),at(G.V,.3,0)].map(p=>ma(p,[0,1,0],-.05)),Tp=[.2,.36,.34,.2].map((h,j)=>ma(Rr[j],[0,h,-.16],1));
    for(let j=0;j<3;j++)b.add(K.face([Rr[j],Rr[j+1],Tp[j+1],ma(mid([Tp[j],Tp[j+1]]),[0,1,0],-.08),Tp[j]],{dbl:true}),{c:j%2?P.glow:P.light,jit:.03});
    SH.drop(b,{p:at(G.S,.6,0),s:.75});
    b.add(K.face([[0,.5,-1.3],[0,.86,-1.62],[0,.46,-1.5],[0,.14,-1.6]],{dbl:true}),{c:P.light});                           // nageoire de queue
    b.sym(sd=>{const r0=at(G.V,.1,sd*.72),r1=at(G.V,.6,sd*.72);b.add(K.face([r0,r1,ma(r1,[sd*.26,.04,-.3],1),ma(r0,[sd*.34,.12,-.22],1)],{dbl:true}),{c:P.glow,jit:.03});});},
  bois:(b,P,G)=>{const bk={c:PAL.bark,jit:.06};                                                                            // écorce, crête de feuilles, épines
    for(const R of[G.T,G.U])for(const k of[1,2,4,5])seam(b,R,0,k,1,k,.07,bk);
    SH.leaf(b,{p:at(G.S,.6,0),s:.85});
    [[G.T,.3,.4],[G.T,.9,.46],[G.U,.6,.42],[G.V,.3,.36],[G.V,.7,.28]].forEach((q,j)=>{const sd=j%2?1:-1;leafAt(b,ma(at(q[0],q[1],0),[0,1,0],-.05),[sd*.22,1,-.4],[sd,0,0],q[2],q[2]*.36,{c:j%2?P.light:P.glow,jit:.03});});
    b.sym(sd=>{for(const q of[[G.S,.75,.75],[G.T,.6,.8],[G.U,.6,.8]])spike(b,at(q[0],q[1],sd*q[2]),[sd,.6,-.1],.045,.18,3,{c:PAL.bone,jit:0});});},
  terre:(b,P,G)=>{const cr={c:P.main,c2:P.glow,jit:.08};                                                                   // dalles de roche, cristaux d'ambre
    SH.crystal(b,{p:ma(at(G.S,.6,0),[0,1,0],-.03),s:.95});
    [[G.T,.6,0,.36],[G.U,.5,.12,.4],[G.V,.3,-.1,.34],[G.U,.4,-.6,.3],[G.T,.5,.62,.3]].forEach(q=>{const n=nrm(q[0],q[1],q[2]);shard(b,at(q[0],q[1],q[2]),[n[0],n[1]+.6,n[2]-.2],.08,q[3],cr);});
    [[G.S,.8,.62,.17,3],[G.V,.3,-.6,.18,5],[G.U,.6,.72,.16,7]].forEach(q=>b.add(K.rock(q[3],q[4],0,.3),{p:at(q[0],q[1],q[2]),s:[1.2,.7,1.2],c:q[4]%4===1?PAL.stone:PAL.stoneL,jit:.08}));},
  elec:(b,P,G)=>{                                                                                                          // bandes rivetées, bobines de cuivre, éclair
    for(const R of[G.T,G.U])for(const v of[-.7,-.25,.25,.7])b.add(K.tet(.055),{p:at(R,.75,v),c:PAL.steel,jit:0});
    SH.bolt(b,{p:at(G.S,.6,0),s:.85});
    b.sym(sd=>{const p=at(G.U,.4,sd*.5),n=nrm(G.U,.4,sd*.5);b.group({p,r:aim([n[0]*.6,1,0])},b=>{for(let j=0;j<3;j++)b.add(K.cyl(.06,.1,.08,5,{open:true}),{p:[0,.04+j*.08,0],c:j%2?PAL.bronzeL:PAL.bronze});
        b.add(K.cyl(.03,.03,.14,4,{open:true}),{p:[0,.31,0],c:PAL.iron}).add(K.oct(.065),{p:[0,.4,0],c:P.glow,ch:'g',jit:0});});});}};
MODELS['enemy.dig']=ctx=>{const P=ctx.P,el=digDeco[ctx.el]?ctx.el:'feu',body=K.make(51),drill=K.make(52),claws=K.make(53),AY=.62;
  // style par élément : bandes (bas, haut), tranche des bandes, vrille (âme base/pointe, filet), bague du museau
  const ST={feu:{lo:K.mix(P.deep,P.dark,.3),hi:K.mix(P.dark,P.main,.12),edge:{c:PAL.lava,c2:P.glow,ch:'g',jit:0},core:[P.deep,K.mix(P.dark,P.main,.5)],thr:[PAL.lava,P.glow],ring:P.deep},
    eau:{lo:P.dark,hi:P.main,edge:{c:P.glow},core:[P.light,PAL.white],thr:[P.dark,P.main],ring:P.light},bois:{lo:P.dark,hi:P.main,edge:{c:PAL.barkD},core:[PAL.wood,PAL.woodL],thr:[PAL.leafD,P.main],ring:PAL.bark},
    terre:{lo:P.dark,hi:P.main,edge:{c:PAL.stoneD},core:[PAL.stoneD,PAL.stoneL],thr:[P.main,P.glow],ring:PAL.stoneD},elec:{lo:P.dark,hi:P.main,edge:{c:PAL.iron},core:[PAL.iron,PAL.steel],thr:[PAL.bronze,PAL.bronzeL],ring:PAL.bronze}},st=ST[el];
  // --- dos : quatre bandes de cuirasse qui se chevauchent comme des tuiles (tranches visibles de dos et de profil)
  const S=[arch(.42,.5,.62,.5),arch(.2,.66,.42,.84),arch(-.08,.72,.36,.98)],T=[arch(-.06,.66,.4,.9),arch(-.4,.74,.34,1.04)],U=[arch(-.38,.68,.38,.94),arch(-.72,.72,.36,.98)],V=[arch(-.7,.65,.4,.86),arch(-.98,.52,.44,.6),arch(-1.16,.3,.5,.28)];
  [S,T,U,V].forEach((R,j)=>skin(body,R,(i,k,c)=>({c:K.shade(K.mix(st.lo,st.hi,Math.max(0,Math.min(1,(c[1]-.4)/.85))),j%2?1.1:.94),jit:.09})));
  [[S[2],T[0]],[T[1],U[0]],[U[1],V[0]]].forEach(q=>skin(body,q,st.edge,false,[0,.3,q[0][0][2]+1.5]));
  fan(body,S[0],[0,.9,.46],{c:st.lo});fan(body,V[2],[0,.56,-1.24],{c:st.lo});
  body.add(K.box(1.1,.4,1.7,.8,.85),{p:[0,.42,-.4],r:[PI,0,0],c:K.mix(P.dark,P.light,.5)});                              // ventre
  // --- tête : crâne en coin, bague du museau, mâchoire à défenses, petits yeux
  const dl=(z,w,yT,yB,wT,wB,yM)=>[[-wT,yT,z],[wT,yT,z],[w,yM,z],[wB,yB,z],[-wB,yB,z],[-w,yM,z]];
  const H=[dl(.3,.52,1.12,.3,.32,.34,.72),dl(.6,.46,1.06,.34,.3,.28,AY),dl(.8,.36,.98,.4,.24,.2,AY)];
  skin(body,H,(i,k,c)=>({c:K.mix(P.dark,P.main,k===0?.95:k===3?.15:.6),jit:.07}),true);fan(body,H[2],[0,AY,.86],{c:P.dark},true);
  body.add(K.cyl(.34,.4,.18,7),{p:[0,AY,.86],r:[PI/2,0,0],c:st.ring,jit:.08});                                          // bague où s'emmanche la vrille
  body.add(K.box(.4,.12,.36,.85,.75),{p:[0,.28,.58],r:[.1,0,0],c:P.deep});                                              // mâchoire
  body.sym(sd=>{spike(body,[sd*.37,.34,.74],[sd*.45,.55,.7],.055,.28,4,{c:PAL.boneD,c2:PAL.bone});                            // défenses
    SH.eye(body,{p:[sd*.29,1.06,.64],r:.085,rot:[-.15,sd*.5,0]});
    body.add(K.box(.22,.06,.17),{p:[sd*.27,1.15,.68],r:[.25,sd*.4,sd*.45],c:P.deep});                                     // arcade
    spike(body,[sd*.42,1.0,.48],[sd*.6,1,-.3],.07,.16,3,{c:P.deep});});                                                    // oreilles
  // --- pattes arrière et courte queue
  body.sym(sd=>{body.add(K.tube([[sd*.45,.5,-.62],[sd*.64,.44,-.52],[sd*.66,.13,-.42]],[.18,.19,.13],5),{c:P.dark,c2:P.main});
    spike(body,[sd*.66,.13,-.42],[sd*.1,-.3,.9],.07,.24,3,{c:PAL.bone,jit:0});spike(body,[sd*.66,.13,-.42],[sd*.6,-.3,.7],.07,.24,3,{c:PAL.bone,jit:0});});
  body.add(K.tube([[0,.52,-1.16],[0,.4,-1.36],[0,.46,-1.5]],[.12,.085,0],4),{c:P.dark,c2:P.main});
  body.sym(sd=>{for(const R of[T,U])spike(body,ma(R[1][sd>0?6:0],[-sd*.03,.05,.03],1),[sd,-.5,-.2],.06,.16,3,{c:PAL.bone,jit:0});});          // pointes au bord des bandes
  digDeco[el](body,P,{S,T,U,V});
  // --- vrille (pièce qui tourne sur son axe Z)
  drillBit(drill,AY,.94,.33,1.0,2.5,st.core,st.thr);
  // --- pattes avant de terrassier (pièce animée) : bras, paume en pelle, quatre griffes plates
  claws.sym(sd=>{claws.add(K.tube([[sd*.52,.8,.3],[sd*.72,.62,.6],[sd*.7,.46,.9]],[.17,.17,.14],5),{c:P.dark,c2:P.main});
    claws.add(K.box(.36,.14,.32,.85,.8),{p:[sd*.7,.4,1.0],r:[.5,0,0],c:P.dark});spike(claws,[sd*.74,.68,.58],[sd*.6,.7,-.35],.06,.2,3,{c:PAL.bone,jit:0});   // paume en pelle, éperon du coude
    for(const k of[-1.5,-.5,.5,1.5])claw(claws,[sd*.7+k*.085,.36,1.1],[k*.06,-.5,.85],.085,.42,.06,{c:PAL.bone,c2:PAL.white,jit:.03});});
  return{parts:[{name:'body',b:body},{name:'drill',b:drill,parent:'body',pivot:[0,AY,.94],anim:[{k:'rot',axis:'z',spin:true,sp:14}]},
      {name:'claws',b:claws,parent:'body',pivot:[0,.8,.3],anim:[{k:'rot',axis:'x',amp:.4,sp:9}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:1,barY:2.1,r:1};};
}
