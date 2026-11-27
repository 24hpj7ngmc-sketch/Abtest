// LES DÉFENSES de L'Île des Cinq : la Bombarde (tower.mortier), le Canon (tower.canon), la Tour de guet (tower.archer),
// le mur que bâtit le joueur (wall) et les trois projectiles (shot.bomb, shot.ball, shot.arrow).
// Une défense = un socle fixe, une pile d'anneaux d'éléments (un par amélioration), puis les parties hautes. Pièces : base (fixe), head (pivote), barrel (recule).
{
const {PAL,EL,TAU}=K,PI=Math.PI,HP=PI/2,sin=Math.sin,cos=Math.cos;
const pol=(a,r,y)=>[sin(a)*r,y,cos(a)*r];                     // point d'un cercle horizontal (angle 0 = +Z, comme SH.bricks)
// ctx.els : liste des éléments achetés (tableau, ou chaîne "feu,feu,eau" depuis l'aperçu). Renvoie aussi les éléments regroupés et les spécialités (≥ 3 fois)
const readEls=ctx=>{let els=Array.isArray(ctx.els)?ctx.els:String(ctx.els||ctx.el||'feu').split(',');els=els.map(e=>String(e).trim()).filter(e=>EL[e]).slice(0,9);if(!els.length)els=['feu'];
  const ord=[...new Set(els)],L=els.length;return{els,L,SH:Math.min(L,3)*.75,grp:[].concat(...ord.map(e=>els.filter(x=>x===e))),spec:ord.filter(e=>els.filter(x=>x===e).length>=3).slice(0,3),E1:EL[els[0]]};};
// profil dessiné dans le plan (z,y) puis extrudé le long de x, de x0 à x1 (flasques, cales, plaques de bouclier, corbeaux)
const flank=(b,pts,x0,x1,o)=>b.add(K.prism(pts.map(p=>[p[1],p[0]]),x1-x0),Object.assign({p:[x1,0,0],r:[0,0,HP]},o));
// dalle de fondation carrée à pans coupés : demi-côté a, rayon rd sur les diagonales
const dalle=(b,a,rd,h,c)=>{const k=rd*Math.SQRT2-a;b.add(K.prism([[k,a],[a,k],[a,-k],[k,-a],[-k,-a],[-a,-k],[-a,k],[-k,a]],h,{taper:.975}),{c:c||PAL.stoneD,c2:PAL.stone,jit:.06});};
// touffe de mousse (posée sur son point bas)
const moss=(b,p,s,seed,sy)=>b.add(K.rock(1,seed,0,.3),{p:[p[0],p[1]+s*(sy||.4)*.5,p[2]],r:[0,seed*1.7,0],s:[s,s*(sy||.4),s*.8],c:K.shade(PAL.moss,.8),c2:K.shade(PAL.moss,1.15),jit:.1});
// rivet : petite pyramide de fer, pointe le long de la normale n ('x','-x','y','z','-z')
const RIV={x:[0,0,-HP],'-x':[0,0,HP],y:[0,0,0],z:[HP,0,0],'-z':[-HP,0,0]};
const rivet=(b,p,n,s,c)=>b.add(K.cone(s||.035,(s||.035)*.9,4,{open:true}),{p,r:RIV[n],c:c===undefined?PAL.ironL:c,ch:'s',jit:0});
// ---- pile d'anneaux d'éléments : un anneau d'émail par amélioration, serti entre des cerclages de bronze, avec ses gemmes.
// Jusqu'à 3 anneaux (0,75 m chacun) : carreaux d'émail taillés en pointe douce, posés en quinconce. Au-delà les anneaux s'affinent : bandes à facettes (≈ 45 triangles l'une).
const stack=(b,q,y0,R,seg)=>{const L=q.L,bh=q.SH/L,rich=L<=3,nG=L<=2?seg/2:L===3?seg/3:L<=5?2:1,gs=rich?.17:Math.min(.14,bh*.44);
  const hoop=(y,big)=>{const h=rich?(big?.11:.08):Math.max(.045,bh*(big?.28:.18)),e=.06;
    if(rich&&big)b.add(K.lathe([[R,y-h/2-.025],[R+e,y-h/2+.01],[R+e,y+h/2-.01],[R,y+h/2+.025]],seg),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    else b.add(K.cyl(R+e,R+e,h,seg,{open:true}),{p:[0,y,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});};
  if(rich)b.add(K.cyl(R-.06,R-.06,q.SH,seg,{open:true}),{p:[0,y0+q.SH/2,0],c:K.mix(PAL.bronze,PAL.black,.6),jit:0});                    // fond des joints
  q.grp.forEach((e,k)=>{const E=EL[e],ya=y0+k*bh,ym=ya+bh/2,w=TAU*R/seg*.965;
    if(rich)for(let i=0;i<seg;i++){const j=b.rnd();b.group({r:[0,(i+.5*(k%2))/seg*TAU,0]},b=>b.add(K.box(w,.1,bh-.1,.88,.9),{p:[0,ym,R-.05],r:[HP,0,0],c:K.shade(E.main,.88+j*.2),ch:'s',jit:.05}));}
    else b.add(K.cyl(R,R,bh,seg,{open:true,a0:(k%2)*PI/seg}),{p:[0,ym,0],c:E.main,ch:'s',jit:.1});
    hoop(ya,k===0||q.grp[k-1]!==e);                                                                                                        // cerclage épais entre deux éléments différents
    for(let i=0;i<nG;i++)SH.gem(b,{p:pol((i+.5*(k%2)*(rich?seg/nG-1:1))/nG*TAU+(rich?0:k*.9+.3),R+.01,ym),s:gs,c:E.glow});});
  hoop(y0+q.SH,true);};
// emblème d'un élément (défense spécialisée) : le motif dans sa vasque de bronze ; console = scellée à une façade
const emblem=(b,el,a,r,y,s,console)=>b.group({p:pol(a,r,y),r:[0,a,0]},b=>{
  if(console)b.add(K.box(.2,.2,.34,.6,.3),{p:[0,-.12,-.16],s:[1,-1,1],c:PAL.stoneD});
  b.add(K.lathe([[.07,-.04],[.2,.04],[.23,.12],[.17,.12]],6),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
  SH.motif(b,el,{p:[0,.1,0],s});});
// bombe de fer avec son bouchon de mèche
const bomb=(b,p,r,rot)=>b.group({p,r:rot||[0,0,0]},b=>{b.add(K.ico(r,0),{c:PAL.iron,c2:PAL.ironL,jit:.08});b.add(K.cyl(r*.2,r*.26,r*.3,5),{p:[0,r*.92,0],c:PAL.bronze,ch:'s'});});
// tonnelet de poudre cerclé de fer
const keg=(b,p,s,rot)=>b.group({p,r:rot||[0,0,0],s},b=>{b.add(K.lathe([[.2,0],[.26,.2],[.26,.4],[.2,.6],[.16,.56]],8,{capB:true}),{c:PAL.woodD,c2:PAL.woodL,jit:.08}).add(K.lathe([[.16,.56],[0,.56]],8),{c:PAL.wood});
  for(const y of[.13,.47])b.add(K.cyl(.245,.245,.05,8,{open:true}),{p:[0,y,0],c:PAL.ironL,ch:'s'});});

// =====================================================================================================================
// LA BOMBARDE — bastion rond et trapu, gros mortier de bronze sur affût de bois pivotant
MODELS['tower.mortier']=ctx=>{const q=readEls(ctx),E1=q.E1,base=K.make(41),head=K.make(42),bar=K.make(43),y0=.8,y1=y0+q.SH,R=1.35,yd=y1+.12,h0=yd+.08,T=[0,y1+.56,-.14];
  // --- dalle à pans coupés et marche ronde
  dalle(base,1.95,2.36,.1);
  base.add(K.lathe([[1.9,.04],[1.9,.2],[1.5,.2]],12),{c:PAL.stoneD,c2:PAL.stone,jit:.06});
  // --- socle : deux assises de gros blocs, joints sombres, glacis de pierre claire
  base.add(K.cyl(1.58,1.66,.6,12,{open:true}),{p:[0,.5,0],c:PAL.stoneDD});
  SH.bricks(base,{r:1.74,h:.54,rows:2,n:12,y:.2,taper:.94,d:.5});
  base.add(K.lathe([[1.72,.72],[1.72,.77],[R+.05,.84]],12),{c:PAL.stoneL,jit:.04});
  // --- anneaux d'éléments
  stack(base,q,y0,R,12);
  // --- couronnement : corbeaux, tablette, terrasse et créneaux
  for(let i=0;i<12;i++)base.group({r:[0,i/12*TAU,0]},b=>flank(b,[[R+.03,y1+.03],[1.72,y1+.03],[R+.03,y1-.14]],-.09,.09,{c:PAL.stoneD,jit:.06}));
  base.add(K.lathe([[R+.02,y1+.02],[1.74,y1+.02],[1.77,y1+.05],[1.77,yd],[.9,yd]],12),{c:PAL.stone,c2:PAL.stoneL,jit:.05});
  for(let i=0;i<8;i++){const a=(i+.5)/8*TAU,j=base.rnd();base.add(K.box(.64,.36,.4,.9,.85),{p:pol(a,1.57,yd+.18),r:[0,a,0],c:K.shade(j>.5?PAL.stone:PAL.stoneL,.92+j*.14),jit:.04});}
  [1.2,4.3].forEach((a,i)=>bomb(base,pol(a,1.52,yd+.18),.18,[.3,i,0]));                                                                    // bombes prêtes dans deux créneaux
  // --- au pied : pile de bombes, rouleau de corde et seau, tonnelet et écouvillon, mousse
  [[-.2,0,-.12],[.2,0,-.12],[0,0,.23],[0,.33,0]].forEach((d,i)=>bomb(base,[1.42+d[0],.3+d[1],1.42+d[2]],.2,[i*.4,i*1.3,.3*i]));
  base.add(K.torus(.25,.07,4,8),{p:[-1.56,.17,1.3],r:[HP,0,0],c:PAL.rope,jit:.08}).add(K.torus(.23,.07,4,8),{p:[-1.56,.29,1.3],r:[HP,.4,0],c:K.shade(PAL.rope,.9),jit:.08});
  base.group({p:[-1.2,.1,1.68]},b=>{b.add(K.lathe([[.14,0],[.19,.3],[.16,.3]],7,{capB:true}),{c:PAL.wood,c2:PAL.woodL}).add(K.lathe([[.16,.3],[.15,.24],[0,.24]],7),{c:EL.eau.dark,ch:'s'});     // seau d'eau
    b.add(K.cyl(.185,.185,.04,7,{open:true}),{p:[0,.22,0],c:PAL.ironL,ch:'s'}).add(K.torus(.17,.015,3,5,PI),{p:[0,.3,0],r:[0,.5,0],c:PAL.iron,ch:'s'});});
  keg(base,[-1.48,.1,-1.42],1,[0,.6,0]);
  base.add(K.cyl(.03,.03,1.5,5),{p:[-1.1,.8,-1.78],r:[.3,0,-.12],c:PAL.woodL}).add(K.cyl(.09,.09,.24,6),{p:[-1.02,1.5,-1.56],r:[.3,0,-.12],c:PAL.cream,jit:.1});        // écouvillon
  [[.4,1.84,.3],[2.4,1.84,.26],[3.4,1.8,.34],[4.9,1.86,.28],[5.9,1.82,.24]].forEach((m,i)=>moss(base,pol(m[0],m[1],.19),m[2],i+3));
  moss(base,[1.5,.09,-1.42],.24,9,.3);moss(base,[.9,.09,1.84],.2,11,.3);
  // --- bannière au premier élément (à l'arrière) et emblèmes des spécialités sur les créneaux
  SH.banner(base,{p:pol(PI,1.57,yd),h:2.1,c:E1.main});
  q.spec.forEach((e,i)=>emblem(base,e,[.5,3.5,6.5][i]/8*TAU,1.57,yd+.4,1.2));
  // --- affût (pivote) : plateau tournant cerclé de fer, deux flasques de chêne ferrées, entretoises, coin de mire, levier
  head.add(K.cyl(1,1.04,.08,12),{p:[0,yd+.04,0],c:PAL.woodD,c2:PAL.wood}).add(K.cyl(1.05,1.05,.05,12,{open:true}),{p:[0,yd+.045,0],c:PAL.ironL,ch:'s'});
  head.sym(sd=>{flank(head,[[-.84,h0],[.86,h0],[.86,h0+.2],[.5,h0+.25],[.18,h0+.47],[-.46,h0+.47],[-.64,h0+.3],[-.84,h0+.27]],sd>0?.48:-.72,sd>0?.72:-.48,{c:PAL.wood,jit:.07});
    head.add(K.box(.28,.05,.56),{p:[sd*.6,h0+.495,-.14],c:PAL.iron,ch:'s'});                                                                // susbande du tourillon
    head.add(K.cyl(.13,.13,.05,8),{p:[sd*.745,T[1],T[2]],r:[0,0,HP],c:PAL.bronzeL,ch:'s'});
    for(const z of[-.7,.68]){head.add(K.box(.03,.2,.1),{p:[sd*.73,h0+.11,z],c:PAL.iron,ch:'s'});rivet(head,[sd*.745,h0+.16,z],sd>0?'x':'-x');rivet(head,[sd*.745,h0+.06,z],sd>0?'x':'-x');}});
  head.add(K.cyl(.1,.1,1.46,6),{p:T,r:[0,0,HP],c:PAL.ironL,ch:'s'});                                                                          // tourillons
  head.add(K.box(1,.24,.2),{p:[0,h0+.13,-.7],c:PAL.woodD}).add(K.box(1,.18,.18),{p:[0,h0+.1,.74],c:PAL.woodD});                              // entretoises
  flank(head,[[.22,h0],[.66,h0],[.66,h0+.14],[.5,h0+.42],[.38,h0+.42],[.22,h0+.14]],-.3,.3,{c:PAL.woodL,jit:.06});                          // coin de mire
  head.add(K.cyl(.03,.04,1.25,5),{p:[.3,h0+.5,-1.02],r:[-.95,0,0],c:PAL.woodL});                                                              // levier de pointage
  // --- tube de bronze (recule le long de son axe) : culasse ronde, renfort, volée, bourrelet de bouche, anses
  bar.group({p:T,r:[PI/6,0,0]},b=>{
    b.add(K.lathe([[0,-.4],[.22,-.35],[.36,-.2],[.4,0],[.44,.1],[.39,.2],[.39,.48],[.47,.56],[.47,.7],[.51,.76],[.37,.76]],10),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.lathe([[.37,.76],[.35,.26],[0,.26]],10),{c:PAL.black,jit:0});                                                                    // âme
    b.add(K.cyl(.455,.455,.14,10,{open:true}),{p:[0,.03,0],c:PAL.ironL,ch:'s'});                                                             // frette des tourillons
    b.sym(sd=>b.add(K.tube([[sd*.15,.24,-.38],[sd*.15,.29,-.5],[sd*.15,.41,-.5],[sd*.15,.46,-.38]],.028,4),{c:PAL.bronzeL,ch:'s'}));         // anses
    b.add(K.cyl(.05,.065,.1,5),{p:[0,-.16,-.4],r:[-HP,0,0],c:PAL.iron,ch:'s'});});                                                           // lumière
  return{parts:[{name:'base',b:base},{name:'head',b:head,pivot:[0,yd,0]},{name:'barrel',b:bar,parent:'head',pivot:T}],
    bake:{ground:.18,groundH:.8},kick:{part:'barrel',v:[0,-.28*cos(PI/6),-.28*sin(PI/6)]},muzzle:[0,T[1]+.76*cos(PI/6),T[2]+.76*sin(PI/6)],topY:yd+2.22,els:q.els};};

// =====================================================================================================================
// LE CANON — socle étroit couronné de fer denté, affût à plaques de bouclier, long tube de bronze fretté de fer
MODELS['tower.canon']=ctx=>{const q=readEls(ctx),E1=q.E1,base=K.make(51),head=K.make(52),bar=K.make(53),y0=1.05,y1=y0+q.SH,R=1.08,yd=y1+.1,h0=yd+.08,yA=y1+.8;
  // --- dalle à pans coupés et marche
  dalle(base,1.72,2.3,.1);
  base.add(K.lathe([[1.56,.04],[1.56,.18],[1.3,.18]],10),{c:PAL.stoneD,c2:PAL.stone,jit:.06});
  // --- socle étroit : trois assises en léger fruit, glacis clair
  base.add(K.cyl(1.25,1.36,.84,10,{open:true}),{p:[0,.6,0],c:PAL.stoneDD});
  SH.bricks(base,{r:1.44,h:.8,rows:3,n:10,y:.18,taper:.9,d:.45});
  base.add(K.lathe([[1.3,.96],[1.3,1.02],[R+.05,1.09]],10),{c:PAL.stoneL,jit:.04});
  // --- anneaux d'éléments
  stack(base,q,y0,R,10);
  // --- couronnement : tablette de pierre et couronne dentée en fer (la crémaillère sur laquelle l'affût pivote)
  base.add(K.lathe([[R+.02,y1],[1.3,y1],[1.34,y1+.04],[1.34,yd],[.7,yd]],10),{c:PAL.stone,c2:PAL.stoneL,jit:.05});
  base.add(K.lathe([[1.34,y1+.02],[1.41,y1+.02],[1.41,y1+.16],[1.3,y1+.16]],16),{c:PAL.iron,c2:PAL.ironL,ch:'s'});
  for(let i=0;i<16;i++)base.group({r:[0,(i+.5)/16*TAU,0]},b=>b.add(K.box(.22,.17,.1,.5,.8),{p:[0,y1+.24,1.365],r:[.14,0,0],c:PAL.ironL,ch:'s',jit:.08}));
  // --- au pied : pyramide de boulets, tonnelet de poudre et refouloir, mousse
  [[-.18,0,-.18],[.18,0,-.18],[-.18,0,.18],[.18,0,.18],[0,.26,0]].forEach((d,i)=>base.add(K.ico(.18,0),{p:[1.36+d[0],.28+d[1],1.36+d[2]],r:[i,i*2,0],c:PAL.iron,c2:PAL.ironL,jit:.1}));
  keg(base,[-1.42,.1,1.3],1,[0,.9,0]);
  base.add(K.cyl(.03,.03,1.7,5),{p:[-1.0,.95,1.5],r:[-.3,0,.2],c:PAL.woodL}).add(K.cyl(.08,.08,.2,6),{p:[-1.16,1.74,1.26],r:[-.3,0,.2],c:PAL.woodD});          // refouloir
  [[1.5,1.52,.3],[2.9,1.5,.26],[4.2,1.54,.3],[5.6,1.5,.24]].forEach((m,i)=>moss(base,pol(m[0],m[1],.17),m[2],i+21));
  moss(base,[-1.5,.09,-1.45],.26,27,.3);moss(base,[.7,.09,1.6],.2,29,.3);
  // --- bannière au premier élément, sur une hampe bridée à la couronne (sous le passage du tube), et emblèmes sur consoles
  base.group({p:pol(1.9,1.5,.18),r:[0,1.9-HP,0]},b=>{SH.banner(b,{h:y1+.07,c:E1.main});b.add(K.box(.12,.06,.2),{p:[-.08,y1-.1,0],c:PAL.iron,ch:'s'});});
  q.spec.forEach((e,i)=>emblem(base,e,[.6,3.0,-1.5][i],R+.3,y1-.48,1.15,true));
  // --- affût (pivote) : plateau tournant, longerons, plaques de bouclier en chêne ferré, tourillons dans leur collier, vis de pointage, bragues
  head.add(K.cyl(.95,1,.08,10),{p:[0,yd+.04,0],c:PAL.woodD,c2:PAL.wood}).add(K.cyl(1.01,1.01,.05,10,{open:true}),{p:[0,yd+.045,0],c:PAL.ironL,ch:'s'});
  head.sym(sd=>{const n=sd>0?'x':'-x';head.add(K.box(.2,.2,1.9),{p:[sd*.36,h0+.1,0],c:PAL.woodD,jit:.07});
    flank(head,[[-.85,h0+.02],[.9,h0+.02],[1.08,h0+.5],[.82,h0+1.16],[-.4,h0+1.16],[-.85,h0+.7]],sd>0?.5:-.6,sd>0?.6:-.5,{c:PAL.wood,jit:.07});
    head.add(K.box(.03,.08,1.62),{p:[sd*.615,h0+.26,.08],c:PAL.iron,ch:'s'}).add(K.box(.03,.08,1.14),{p:[sd*.615,h0+1.02,.2],c:PAL.iron,ch:'s'});
    for(const z of[-.6,-.1,.4,.85])rivet(head,[sd*.63,h0+.26,z],n,.04);for(const z of[-.25,.2,.65])rivet(head,[sd*.63,h0+1.02,z],n,.04);
    head.add(K.cyl(.2,.25,.08,8),{p:[sd*.64,yA,0],r:[0,0,-sd*HP],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'}).add(K.cyl(.09,.09,.08,6),{p:[sd*.7,yA,0],r:[0,0,HP],c:PAL.iron,ch:'s'});   // bossette et tête de tourillon
    head.add(K.tube([[sd*.5,yA-.12,-.62],[sd*.32,yA-.04,-.98],[sd*.07,yA,-1.02]],.035,4),{c:PAL.rope,jit:.08});});                        // bragues de chanvre
  head.add(K.cyl(.12,.12,1.3,6),{p:[0,yA,0],r:[0,0,HP],c:PAL.ironL,ch:'s'});
  head.group({p:[0,yA,0],r:[HP,0,0]},b=>b.add(K.lathe([[.41,-.12],[.46,-.09],[.46,.09],[.41,.12]],10),{c:PAL.iron,c2:PAL.ironL,ch:'s'}));  // collier des tourillons
  head.add(K.box(.92,.16,.18),{p:[0,h0+.1,.82],c:PAL.wood}).add(K.box(.92,.16,.18),{p:[0,h0+.1,-.82],c:PAL.wood});
  head.add(K.cyl(.04,.04,.3,5),{p:[0,h0+.2,-.72],c:PAL.ironL,ch:'s'}).add(K.cyl(.14,.14,.03,6),{p:[0,h0+.14,-.72],c:PAL.bronze,ch:'s'});    // vis de pointage
  head.add(K.cyl(.13,.13,.07,6),{p:[1.16,y1+.37,-.36],c:PAL.bronze,ch:'s'}).add(K.cyl(.025,.025,.46,4),{p:[1.16,y1+.6,-.36],c:PAL.iron,ch:'s'}).add(K.box(.3,.04,.04),{p:[1.04,y1+.84,-.36],c:PAL.woodL})
    .add(K.box(.56,.07,.1),{p:[.86,h0+.2,-.36],c:PAL.iron,ch:'s'});                                                                           // pignon et manivelle sur la crémaillère
  // --- tube (recule vers -Z) : bouton de culasse, renforts frettés de fer, volée, bouche évasée, lumière
  bar.group({p:[0,yA,0],r:[HP,0,0]},b=>{
    b.add(K.lathe([[0,-1.16],[.1,-1.13],[.13,-1.05],[.08,-.98],[.3,-.95],[.4,-.88],[.4,-.2],[.37,-.16],[.37,.55],[.4,.6],[.34,.66],[.28,1.72],[.32,1.78],[.3,1.86],[.38,2.12],[.38,2.2],[.22,2.2]],10),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.lathe([[.22,2.2],[.2,1.5],[0,1.5]],10),{c:PAL.black,jit:0});                                                                     // âme
    [[-.72,.415,.12],[-.4,.415,.12],[.3,.385,.1],[1.0,.335,.1]].forEach(f=>b.add(K.cyl(f[1],f[1],f[2],10,{open:true}),{p:[0,f[0],0],c:PAL.iron,c2:PAL.ironL,ch:'s'}));   // frettes de fer
    b.add(K.cyl(.04,.055,.08,5),{p:[0,-.56,-.42],r:[-HP,0,0],c:PAL.iron,ch:'s'});});                                                         // lumière
  return{parts:[{name:'base',b:base},{name:'head',b:head,pivot:[0,yd,0]},{name:'barrel',b:bar,parent:'head',pivot:[0,yA,0]}],
    bake:{ground:.18,groundH:.8},kick:{part:'barrel',v:[0,0,-.6]},muzzle:[0,yA,2.2],topY:h0+1.16,els:q.els};};

// =====================================================================================================================
// LA TOUR DE GUET — haute tour de pierre et de charpente, plate-forme à garde-corps, toit de bardeaux, baliste sur pivot
MODELS['tower.archer']=ctx=>{const q=readEls(ctx),E1=q.E1,base=K.make(61),head=K.make(62),bar=K.make(63),y0=4.2,y1=y0+q.SH,R=.92,yp=y1+.3,ye=yp+1.92,yb=yp+.66,rv=1.1,O8={a0:PI/8};
  // --- dalle et marche
  dalle(base,1.6,2.05,.1);
  base.add(K.lathe([[1.5,.04],[1.5,.16],[1.2,.16]],9),{c:PAL.stoneD,c2:PAL.stone,jit:.06});
  // --- pied de pierre : quatre assises en fruit, meurtrières
  base.add(K.cyl(1.11,1.27,2.16,9,{open:true}),{p:[0,1.24,0],c:PAL.stoneDD});
  SH.bricks(base,{r:1.36,h:2.16,rows:4,n:9,y:.16,taper:.84,d:.42});
  for(const a of[2.1,-2.1])base.add(K.box(.1,.5,.08),{p:pol(a,1.2,1.52),r:[0,a,0],c:PAL.black,jit:0});
  // --- porte cintrée : piédroits, arc de pierre, vantail de planches ferré
  base.add(K.cyl(.5,.5,.26,6,{a0:HP,arc:PI}),{p:[0,1.2,1.27],r:[HP,0,0],c:PAL.stoneL,jit:.06}).add(K.cyl(.36,.36,.2,6,{a0:HP,arc:PI}),{p:[0,1.2,1.33],r:[HP,0,0],c:PAL.woodD});
  base.sym(sd=>base.add(K.box(.16,1.06,.26),{p:[sd*.42,.68,1.27],c:PAL.stoneL,jit:.06}));
  SH.planks(base,{p:[0,.68,1.36],w:.68,h:1.04,d:.12,n:3,vertical:true,c:PAL.wood});
  for(const y of[.45,.98])base.add(K.box(.5,.07,.03),{p:[-.06,y,1.43],c:PAL.iron,ch:'s'});
  base.add(K.torus(.07,.018,3,6),{p:[.2,.72,1.44],c:PAL.bronzeL,ch:'s'}).add(K.box(.92,.1,.3),{p:[0,.19,1.42],c:PAL.stone});
  // --- étage de charpente : huit poteaux, sablières, hourdis clair, poutres en croix et meurtrières en croix
  base.add(K.cyl(rv-.06,rv-.06,1.88,8,{a0:PI/8,open:true}),{p:[0,3.26,0],c:K.mix(PAL.cream,PAL.sand,.45),jit:.05});
  for(const y of[2.3,4.04])base.add(K.lathe([[rv-.1,y],[rv+.06,y],[rv+.06,y+.16],[rv-.1,y+.16]],8,O8),{c:PAL.woodD,jit:.07});
  for(let i=0;i<8;i++){const a=i*PI/4;base.add(K.box(.16,1.6,.16),{p:pol(a+PI/8,rv-.02,3.25),r:[0,a+PI/8,0],c:PAL.wood,jit:.07});
    base.group({p:pol(a,1.0,3.25),r:[0,a,0]},b=>{if(i%2)for(const s of[1,-1])b.add(K.box(.1,1.7,.06),{r:[0,0,s*.4],c:PAL.woodD,jit:.07});
      else b.add(K.box(.11,.62,.05),{c:PAL.black,jit:0}).add(K.box(.3,.09,.05),{p:[0,.06,0],c:PAL.black,jit:0});});}
  // --- anneaux d'éléments
  stack(base,q,y0,R,8);
  // --- plate-forme : encorbellement, poutres maîtresses débordantes, plancher, cadre et garde-corps
  base.add(K.lathe([[R+.02,y1],[1.22,y1+.2],[.5,y1+.2]],8,O8),{c:PAL.woodD,jit:.07});
  base.add(K.box(3.06,.16,.18),{p:[0,y1+.13,0],c:PAL.wood}).add(K.box(.18,.16,3.06),{p:[0,y1+.13,0],c:PAL.wood});
  SH.planks(base,{p:[0,yp-.045,0],w:2.6,h:.09,d:2.6,n:7,vertical:true,c:PAL.plank});
  for(const s of[1,-1]){base.add(K.box(2.76,.14,.1),{p:[0,yp-.06,s*1.33],c:PAL.woodD}).add(K.box(.1,.14,2.76),{p:[s*1.33,yp-.06,0],c:PAL.woodD});
    base.add(K.box(2.5,.07,.07),{p:[0,yp+.46,s*1.3],c:PAL.wood}).add(K.box(.07,.07,2.5),{p:[s*1.3,yp+.46,0],c:PAL.wood});
    for(const t of[-.43,.43])base.add(K.box(.07,.44,.07),{p:[t,yp+.22,s*1.3],c:PAL.woodD}).add(K.box(.07,.44,.07),{p:[s*1.3,yp+.22,t],c:PAL.woodD});
    // poteaux du toit, sablières hautes
    for(const t of[1,-1])base.add(K.box(.14,1.92,.14),{p:[s*1.3,yp+.96,t*1.3],c:PAL.wood,jit:.07});
    base.add(K.box(2.86,.12,.12),{p:[0,ye-.06,s*1.3],c:PAL.woodD}).add(K.box(.12,.12,2.86),{p:[s*1.3,ye-.06,0],c:PAL.woodD});}
  // --- toit conique en bardeaux (couleur du premier élément) : trois jupes décalées, sous-face de bois, épi de faîtage et bannière
  [[[1.8,.05],[2,0],[1.25,.64]],[[1.25,.62],[1.42,.56],[.66,1.2]],[[.66,1.18],[.82,1.12],[0,1.82]]].forEach((t,i)=>
    base.add(K.lathe(t.map(p=>[p[0],ye+p[1]]),10,{a0:i*PI/10}),{c:K.mix(E1.main,E1.light,.25),c2:K.mix(E1.main,E1.dark,.45),jit:.1}));
  base.add(K.lathe([[0,ye+.9],[1.8,ye+.05]],10),{c:PAL.woodD,jit:.06});
  base.add(K.lathe([[.1,0],[.16,.1],[.06,.22],[.1,.34],[0,.6]],6),{p:[0,ye+1.72,0],c:PAL.goldD,c2:PAL.gold,ch:'s'});
  SH.banner(base,{p:[0,ye+1.9,0],h:1.15,c:E1.main});
  // --- au pied : caisse de carreaux hissée par un palan, mousse
  base.add(K.box(.5,.36,.44),{p:[1.36,.28,.9],r:[0,.3,0],c:PAL.wood,jit:.08}).add(K.tube([[1.36,yp-.1,.9],[1.36,.46,.9]],.022,4),{c:PAL.rope});
  for(const d of[-.1,.08])base.add(K.cyl(.02,.02,.7,4),{p:[1.36+d,.6,.9+d],r:[.2,0,d*3],c:PAL.woodL}).add(K.cone(.04,.12,4),{p:[1.36+d*1.4,1.0,.97+d],r:[.2,0,d*3],c:PAL.steel,ch:'s'});
  [[.9,1.42,.28],[2.6,1.4,.3],[4.0,1.42,.26],[5.3,1.4,.3]].forEach((m,i)=>moss(base,pol(m[0],m[1],.15),m[2],i+31,.3));
  // --- emblèmes des spécialités : vasques au bout des poutres maîtresses
  q.spec.forEach((e,i)=>emblem(base,e,[-HP,HP,PI][i],1.52,y1+.25,1.2));
  // --- baliste (pivote) : trépied, arbrier, grand arc, corde bandée, treuil
  head.add(K.cyl(.1,.16,.46,6),{p:[0,yp+.23,0],c:PAL.woodD}).add(K.cyl(.14,.14,.06,6),{p:[0,yp+.47,0],c:PAL.ironL,ch:'s'});
  for(const a of[PI/3,PI,-PI/3])head.add(K.tube([[0,yp+.4,0],pol(a,.55,yp+.02)],.04,4),{c:PAL.wood});
  head.add(K.box(.2,.14,2.1),{p:[0,yp+.56,.05],c:PAL.wood,jit:.07}).add(K.box(.3,.2,.1),{p:[0,yp+.56,1.08],c:PAL.iron,ch:'s'}).add(K.box(.14,.1,.16),{p:[0,yb,-.7],c:PAL.ironL,ch:'s'});
  head.sym(sd=>{head.add(K.tube(K.curve([[sd*.1,yb-.06,1.05],[sd*.6,yb-.05,.98],[sd*1.15,yb-.04,.72],[sd*1.52,yb-.03,.34]],5),[.075,.07,.06,.05,.04,.03],5),{c:PAL.woodL,c2:PAL.wood,jit:.08});
    head.add(K.tube([[sd*1.52,yb-.03,.34],[sd*.05,yb-.02,-.62]],.014,3),{c:PAL.rope,jit:0});                                               // corde bandée
    head.add(K.tube([[sd*.1,yb-.1,.3],[sd*.62,yb-.07,.95]],.02,3),{c:PAL.iron,ch:'s'});                                                    // tirants de fer
    head.add(K.box(.04,.34,.04),{p:[sd*.31,yp+.56,-.92],r:[sd*.6,0,0],c:PAL.iron,ch:'s'});});                                             // manivelles du treuil
  head.add(K.cyl(.08,.08,.56,6),{p:[0,yp+.56,-.92],r:[0,0,HP],c:PAL.woodD});
  // --- chariot et carreau (reculent)
  bar.add(K.box(.14,.05,.5),{p:[0,yb-.04,-.42],c:PAL.woodL}).add(K.box(.1,.09,.06),{p:[0,yb,-.66],c:PAL.iron,ch:'s'});
  bar.add(K.cyl(.028,.028,1.6,5),{p:[0,yb,.45],r:[HP,0,0],c:PAL.woodL}).add(K.cone(.07,.26,4),{p:[0,yb,1.33],r:[HP,0,0],c:PAL.steel,ch:'s'});
  bar.add(K.face([[0,yb-.11,-.38],[0,yb-.11,-.1],[0,yb+.11,-.16],[0,yb+.11,-.38]],{dbl:true}),{c:E1.light}).add(K.face([[-.11,yb,-.38],[-.11,yb,-.16],[.11,yb,-.16],[.11,yb,-.38]],{dbl:true}),{c:E1.light});
  return{parts:[{name:'base',b:base},{name:'head',b:head,pivot:[0,yp,0]},{name:'barrel',b:bar,parent:'head',pivot:[0,yb,0]}],
    bake:{ground:.18,groundH:.8},kick:{part:'barrel',v:[0,0,-.25]},muzzle:[0,yb,1.46],topY:ye+3.17,els:q.els};};

// =====================================================================================================================
// LE MUR — une case de 4 m × 4 m, 1 à 3 niveaux de 1,6 m. Faces à fleur de la case (x, z = ±2), dessus plat à y = lvl × 1,6.
// Chaque niveau : une assise haute de longs blocs, une assise basse de blocs courts (joints décalés), puis un bandeau ; dalles de couronnement au sommet.
MODELS['wall']=ctx=>{const lvl=Math.max(1,Math.min(3,Math.round(+ctx.lvl||1))),H=lvl*1.6,b=K.make(71),g=.018,pal=[PAL.stone,PAL.stoneL,PAL.stoneD,PAL.stone];
  // bloc donné par son emprise : ses faces au bord de la case restent à fleur (ou en retrait de `rec`), les autres laissent un joint
  const blk=(x0,x1,z0,z1,ya,yb,o={})=>{const j=b.rnd(),rec=o.rec||0,ed=(v,lo)=>Math.abs(Math.abs(v)-2)<1e-6?v-Math.sign(v)*rec:v+(lo?g:-g),X0=ed(x0,1),X1=ed(x1,0),Z0=ed(z0,1),Z1=ed(z1,0),c=o.c||K.shade(pal[Math.floor(j*4)%4],.92+j*.16);
    b.add(K.box(X1-X0,yb-ya-(o.top?g:2*g)*.6,Z1-Z0),{p:[(X0+X1)/2,(ya+yb)/2+(o.top?g*.3:0),(Z0+Z1)/2],c:o.moss?K.mix(c,PAL.moss,.6):c,c2:c,jit:.035});};
  b.add(K.box(3.88,H-.03,3.88),{p:[0,(H-.03)/2,0],c:PAL.stoneDD,jit:0});                                                                    // cœur sombre : le fond des joints
  for(let k=0;k<lvl;k++){const ya=k*1.6,yb=ya+.8,yc=ya+1.44,lo=k===0;
    for(const sx of[1,-1]){const X=(a,c)=>sx>0?[a,c]:[-c,-a];
      for(const sz of[1,-1]){const Z=(a,c)=>sz>0?[a,c]:[-c,-a];
        blk(...X(0,2),...Z(1,2),ya,yb,{moss:lo&&sx*sz>0,rec:lo&&sx>0&&sz>0?.045:0});                                                         // longs blocs d'angle
        blk(...X(.7,2),...Z(1.35,2),yb,yc);blk(...X(1.35,2),...Z(0,1.35),yb,yc);}                                                           // blocs courts : angle et parement
      blk(...X(1,2),-1,1,ya,yb,{moss:lo&&sx<0});blk(-.7,.7,...X(1.35,2),yb,yc);}
    if(k<lvl-1)blk(-2,2,-2,2,yc,ya+1.6,{c:K.shade(PAL.stoneL,.96)});                                                                       // bandeau entre deux niveaux
    else{blk(-2,-.5,0,2,yc,H,{top:1,c:PAL.stoneL});blk(-.5,2,0,2,yc,H,{top:1,c:K.shade(PAL.stoneL,.93)});blk(-2,.5,-2,0,yc,H,{top:1,c:K.shade(PAL.stoneL,.95)});blk(.5,2,-2,0,yc,H,{top:1,c:PAL.stoneL});}}   // dalles de couronnement
  b.add(K.rock(1,5,0,.3),{p:[1.05,.42,1.968],s:[.6,.3,.02],c:PAL.moss,jit:.12}).add(K.rock(1,8,0,.3),{p:[1.968,.36,1.3],s:[.02,.26,.45],c:K.shade(PAL.moss,.9),jit:.12});   // mousse au pied
  return b;};

// =====================================================================================================================
// LES PROJECTILES (petits, vus en vol)
// bombe de mortier : boule de fer cerclée, col de bronze, mèche et braise
MODELS['shot.bomb']=ctx=>{const b=K.make(81),P=ctx.P||EL.feu;
  b.add(K.ico(.45,1),{c:PAL.iron,c2:PAL.ironL,jit:.08}).add(K.cyl(.468,.468,.1,10,{open:true}),{c:PAL.bronze,c2:PAL.bronzeL,jit:.06});
  b.add(K.cyl(.09,.13,.12,6),{p:[0,.46,0],c:PAL.bronze}).add(K.tube([[0,.5,0],[.05,.63,.02],[.15,.71,.06]],.03,4),{c:PAL.rope});
  b.add(K.ico(.085,0),{p:[.17,.73,.07],c:P.main,c2:P.glow,ch:'g',jit:0});return b;};
// boulet de canon : fonte sombre, couture de moulage chauffée à blanc (teinte de l'élément)
MODELS['shot.ball']=ctx=>{const b=K.make(82),P=ctx.P||EL.feu;
  b.add(K.ico(.34,1),{c:PAL.iron,c2:PAL.ironL,jit:.09}).add(K.cyl(.35,.35,.05,10,{open:true}),{r:[.5,0,.3],c:P.main,c2:P.glow,ch:'g',jit:0});return b;};
// carreau de baliste : 1,1 m le long de Z, pointe de fer vers +Z, empennage à l'arrière, bague lumineuse
MODELS['shot.arrow']=ctx=>{const b=K.make(83),P=ctx.P||EL.feu;
  b.add(K.cyl(.025,.025,.8,5),{p:[0,0,-.1],r:[HP,0,0],c:PAL.woodL}).add(K.cone(.07,.28,4),{p:[0,0,.41],r:[HP,0,0],c:PAL.steel,jit:.08});
  for(let k=0;k<3;k++)b.add(K.face([[0,.02,-.26],[0,.11,-.36],[0,.11,-.55],[0,.02,-.5]],{dbl:true}),{r:[0,0,k*TAU/3],c:PAL.cream,jit:.06});
  b.add(K.oct(.05),{p:[0,0,.25],c:P.glow,ch:'g',jit:0});return b;};
}
