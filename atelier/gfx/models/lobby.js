// L'ÎLE CÉLESTE — le lobby : une île qui flotte au-dessus des nuages, où chaque joueur bâtit son village et sculpte son relief.
// vil.dessous (roche sous l'île), vil.hall, vil.maison, vil.musee, vil.armes, vil.fontaine (bâtiments), lob.astre (astrolabe),
// lob.socle + lob.butin (trophées du musée), lob.etoile, lob.banniere, lob.ilot (îlots à la dérive), lob.sceau (chaînes du portail fermé)
{
const {PAL,TAU}=K,PI=Math.PI;
const MARB=0xe9e4d8,MARBD=0xcfc8ba,NUIT=0x2c3a78,NUITD=0x1c2553,NUITL=0x4a5aa8,ORC=PAL.gold,ROSE=0xe7c7d8;
const ELK=['feu','eau','bois','terre','elec'];
// angle du héros k autour du centre : le premier est au sud (+Z), face à l'arrivée
const angOf=k=>k*TAU/5;

// ---------------------------------------------------------------- lob.astre : l'astrolabe du centre — une étoile de cristal dans trois anneaux d'or qui tournent
MODELS['lob.astre']=ctx=>{const b=K.make(321),st=K.make(322),r1=K.make(323),r2=K.make(324),r3=K.make(325),CY=4.3;
  // --- estrade bleu nuit à deux degrés, filets d'or, cinq griffes de bronze qui montent vers l'étoile
  b.add(K.cyl(3.3,3.5,.3,24),{p:[0,.15,0],c:NUITD,c2:NUIT});b.add(K.torus(3.32,.06,5,32),{p:[0,.3,0],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});
  b.add(K.cyl(2.4,2.55,.3,24),{p:[0,.45,0],c:NUIT,c2:NUITL});b.add(K.torus(2.42,.05,5,28),{p:[0,.6,0],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});
  b.add(K.cyl(.9,1.3,.5,10),{p:[0,.85,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
  for(let k=0;k<5;k++){const a=angOf(k)+TAU/10,s=Math.sin(a),c=Math.cos(a);
    b.add(K.tube(K.curve([[s*1.1,.9,c*1.1],[s*2.0,1.7,c*2.0],[s*2.25,2.9,c*2.25],[s*1.75,3.7,c*1.75]],8),[.16,.14,.12,.1,.09,.07,.05,.03,0],5),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.oct(.16),{p:[s*2.42,.72,c*2.42],s:[1,1.5,1],c:K.EL[ELK[k]].main,ch:'g',jit:0});}
  // --- l'étoile : deux pyramides et huit pointes, cristal clair
  st.add(K.oct(.62),{p:[0,CY,0],s:[1,1.7,1],c:0xbfe9ff,c2:0xffffff,ch:'s',jit:.06});
  for(let i=0;i<4;i++){const a=i*TAU/4;st.add(K.cone(.2,.95,4),{p:[Math.sin(a)*.72,CY,Math.cos(a)*.72],r:[PI/2*Math.cos(a),0,-PI/2*Math.sin(a)],c:0xdaf3ff,c2:0xffffff,ch:'s',jit:0});
    const d=a+TAU/8;st.add(K.cone(.12,.55,4),{p:[Math.sin(d)*.5,CY,Math.cos(d)*.5],r:[PI/2*Math.cos(d),0,-PI/2*Math.sin(d)],c:0xfff2c4,ch:'g',jit:0});}
  st.add(K.ico(.3,1),{p:[0,CY,0],c:0xffffff,ch:'g',jit:0});
  // --- trois anneaux : chacun tourne autour d'un axe différent
  r1.add(K.torus(2.05,.07,6,36),{p:[0,CY,0],c:ORC,ch:'s',jit:0});for(let i=0;i<8;i++){const a=i*TAU/8;r1.add(K.oct(.1),{p:[Math.cos(a)*2.05,CY+Math.sin(a)*2.05,0],c:0xfff2c4,ch:'g',jit:0});}
  r2.add(K.torus(1.7,.06,6,32),{p:[0,CY,0],r:[PI/2,0,0],c:PAL.bronzeL,ch:'s',jit:0});r2.add(K.ico(.14,1),{p:[1.7,CY,0],c:0x8fd6ff,ch:'g',jit:0});
  r3.add(K.torus(1.36,.05,6,28),{p:[0,CY,0],r:[0,PI/2,0],c:ORC,ch:'s',jit:0});r3.add(K.ico(.11,1),{p:[0,CY+1.36,0],c:ROSE,ch:'g',jit:0});
  return{parts:[{name:'base',b},
    {name:'star',b:st,parent:'base',pivot:[0,CY,0],anim:[{k:'rot',axis:'y',spin:true,sp:.7},{k:'pos',axis:'y',amp:.18,sp:1.3}]},
    {name:'r1',b:r1,parent:'base',pivot:[0,CY,0],anim:[{k:'rot',axis:'y',spin:true,sp:.45}]},
    {name:'r2',b:r2,parent:'base',pivot:[0,CY,0],anim:[{k:'rot',axis:'x',spin:true,sp:.6}]},
    {name:'r3',b:r3,parent:'base',pivot:[0,CY,0],anim:[{k:'rot',axis:'z',spin:true,sp:-.8}]}],bake:{ground:.15,groundH:.6},cy:CY};};

// ---------------------------------------------------------------- lob.butin : un trophée rapporté d'une partie (ctx.kind), ≈ 0,7 m, posé sur y = 0
MODELS['lob.butin']=ctx=>{const k=String(ctx.kind||'feu'),b=K.make(341),E=K.EL[k]||K.EL.feu;
  if(k==='feu'){   // Corne de braise : corne noircie, veines de lave, flammèche
    b.add(K.cyl(.2,.24,.1,8),{p:[0,.05,0],c:PAL.iron});
    b.add(K.tube(K.curve([[0,.08,0],[.06,.32,.02],[.2,.54,.02],[.3,.74,-.04],[.22,.9,-.1]],10),[.17,.16,.145,.13,.115,.1,.08,.06,.045,.03,0],6),{c:E.deep,c2:0x40302c});
    for(let i=0;i<4;i++)b.add(K.torus(.15-i*.027,.018,4,10),{p:[.03+i*.07,.22+i*.15,.02],r:[PI/2,0,.35+i*.12],c:E.main,ch:'g',jit:0});
    SH.flame(b,{p:[-.2,.08,.12],s:.5});}
  else if(k==='eau'){   // Écaille des marées : grande écaille nacrée en éventail
    b.add(K.cyl(.2,.25,.1,8),{p:[0,.05,0],c:PAL.stone});
    b.add(K.prism([[0,0],[.3,.16],[.4,.46],[.3,.76],[0,.9],[-.3,.76],[-.4,.46],[-.3,.16]],.07),{p:[0,.1,.035],r:[-PI/2,0,0],c:E.dark,c2:E.glow,ch:'s',jit:.04});
    for(const q of[[0,.3,.2],[-.17,.5,.14],[.17,.5,.14],[0,.68,.12]])b.add(K.torus(q[2],.016,4,10,PI),{p:[q[0],q[1],.08],c:E.glow,ch:'g',jit:0});
    SH.drop(b,{p:[.24,.1,.14],s:.45});}
  else if(k==='bois'){   // Ramure ancienne : bois de cerf moussu, jeunes pousses
    b.add(K.cyl(.19,.24,.12,7),{p:[0,.06,0],c:PAL.barkD,c2:PAL.bark});
    b.sym(sd=>{b.add(K.tube(K.curve([[sd*.05,.1,0],[sd*.16,.34,.02],[sd*.33,.56,0],[sd*.38,.84,-.04]],8),[.075,.07,.06,.055,.05,.04,.03,.02,0],5),{c:PAL.boneD,c2:PAL.bone});
      b.add(K.tube([[sd*.2,.4,.01],[sd*.36,.42,.1],[sd*.46,.56,.14]],[.045,.035,0],5),{c:PAL.bone});b.add(K.tube([[sd*.34,.6,0],[sd*.2,.72,-.06],[sd*.16,.86,-.08]],[.04,.03,0],5),{c:PAL.bone});});
    b.add(K.ico(.1,0),{p:[.08,.14,.1],s:[1.3,.6,1.2],c:PAL.moss});SH.leaf(b,{p:[0,.1,-.02],s:.5});}
  else if(k==='terre'){   // Cœur de roche : géode fendue, ambre à l'intérieur
    b.add(K.rock(.36,77,1,.3),{p:[0,.3,0],s:[1.1,.85,1],c:PAL.stoneD,c2:PAL.dirt});
    b.add(K.oct(.2),{p:[.04,.44,.2],s:[1,1.4,.8],c:0xffb347,c2:0xffe2a0,ch:'s',jit:.05});b.add(K.oct(.11),{p:[-.14,.36,.24],s:[1,1.5,.8],c:0xffc56b,ch:'s',jit:.05});
    SH.crystal(b,{p:[-.08,.5,-.1],s:.7});}
  else if(k==='elec'){   // Bobine d'orage : spires de cuivre autour d'une tige de fer, éclair au sommet
    b.add(K.cyl(.24,.28,.08,8),{p:[0,.04,0],c:PAL.iron,c2:PAL.ironL,ch:'s'});b.add(K.cyl(.05,.06,.74,6),{p:[0,.45,0],c:PAL.iron,ch:'s'});
    for(let i=0;i<6;i++)b.add(K.torus(.17-i*.012,.035,5,12),{p:[0,.14+i*.085,0],r:[PI/2,0,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s',jit:.03});
    b.add(K.ico(.09,1),{p:[0,.86,0],c:E.glow,ch:'g',jit:0});SH.bolt(b,{p:[.2,.1,.14],s:.5});}
  else if(k==='couronne'){   // Couronne des trente-cinq vagues : cercle d'or, cinq fleurons aux couleurs des éléments
    b.add(K.box(.56,.1,.56),{p:[0,.05,0],c:PAL.purpleD,c2:PAL.purple});b.add(K.cyl(.26,.26,.22,10,{open:true}),{p:[0,.24,0],c:PAL.goldD,c2:ORC,ch:'s'});
    b.add(K.torus(.27,.03,5,14),{p:[0,.14,0],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});b.add(K.torus(.27,.025,5,14),{p:[0,.35,0],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});
    ELK.forEach((el,i)=>{const a=i*TAU/5,x=Math.sin(a)*.27,z=Math.cos(a)*.27;b.add(K.cone(.07,.26,4),{p:[x,.48,z],r:[0,a,0],c:ORC,ch:'s',jit:0});b.add(K.oct(.05),{p:[x*1.08,.25,z*1.08],c:K.EL[el].main,ch:'g',jit:0});});
    b.add(K.cyl(.24,.24,.04,10),{p:[0,.2,0],c:PAL.purple});}
  else if(k==='sceau'){   // Sceau de l'île : médaillon de pierre dressé, étoile à cinq branches gravée
    b.add(K.box(.5,.1,.3),{p:[0,.05,0],c:PAL.stoneD,c2:PAL.stone});
    b.add(K.cyl(.36,.36,.09,14),{p:[0,.48,0],r:[PI/2,0,0],c:PAL.stone,c2:PAL.stoneL});b.add(K.torus(.36,.035,5,16),{p:[0,.48,0],c:ORC,ch:'s',jit:0});
    const S=[];for(let i=0;i<10;i++){const a=i*TAU/10,r=i%2?.11:.27;S.push([Math.sin(a)*r,Math.cos(a)*r]);}
    b.add(K.prism(S,.04),{p:[0,.48,.03],r:[PI/2,0,0],c:0xff9d5c,c2:0xffe2a0,ch:'g',jit:0});}
  else{   // Relique oubliée : idole d'or sur son coussin
    b.add(K.box(.5,.12,.5),{p:[0,.06,0],c:PAL.clothD,c2:PAL.cloth});
    b.add(K.lathe([[.0,.12],[.17,.14],[.2,.26],[.1,.36],[.08,.46],[.16,.56],[.15,.66],[.06,.74],[0,.76]],8),{c:PAL.goldD,c2:ORC,ch:'s',jit:.03});
    b.sym(sd=>b.add(K.oct(.035),{p:[sd*.06,.62,.14],c:0x7ff3ff,ch:'g',jit:0}));b.add(K.oct(.06),{p:[0,.3,.2],c:PAL.rune,ch:'g',jit:0});}
  return{parts:[{name:'body',b}],bake:{}};};

// ---------------------------------------------------------------- lob.banniere : grande bannière d'un héros (ctx.el), embellissement acheté au marchand
MODELS['lob.banniere']=ctx=>{const P=ctx.P||K.EL.feu,b=K.make(361);
  b.add(K.cyl(.22,.28,.3,8),{p:[0,.15,0],c:PAL.stone,c2:MARBD});
  SH.banner(b,{p:[0,.25,0],h:4.6,w:1.05,l:2.3,c:P.main});
  SH.motif(b,ctx.el||'feu',{p:[.55,3.2,.06],s:.8});
  return{parts:[{name:'body',b}],bake:{}};};

// ---------------------------------------------------------------- lob.ilot : îlot de roche à la dérive (ctx.v = 0, 1 ou 2), ruine et cristaux dessus
MODELS['lob.ilot']=ctx=>{const v=+ctx.v||0,b=K.make(371+v),R=[5,3.4,6.5][v%3];
  b.add(K.cyl(R,R*.92,.5,14),{p:[0,-.25,0],c:0x7c8f6a,c2:0x9fb884,jit:.05});
  b.add(K.lathe([[0,-R*1.5],[R*.3,-R*.85],[R*.7,-R*.3],[R*.93,-.45]],12),{c:0x4a4763,c2:0x8f8aa3,jit:.06});
  for(let i=0;i<5;i++){const a=b.rnd()*TAU,r=R*(.35+b.rnd()*.5);b.add(K.rock(R*.2+b.rnd()*R*.14,500+i+v*9,1,.3),{p:[Math.sin(a)*r,-R*.45-b.rnd()*R*.4,Math.cos(a)*r],c:0x55516f,c2:0x9a94ad});}
  if(v%3===0){for(const q of[[-1.6,0,5.2],[1.5,.4,3.1],[.2,-1.9,1.6]])b.add(K.cyl(.42,.48,q[2],8),{p:[q[0],q[2]/2,q[1]],c:MARBD,c2:MARB});b.add(K.box(4.3,.5,1,1,1),{p:[-.05,4.4,.2],r:[0,.12,.37],c:MARB});}
  else if(v%3===1){for(let i=0;i<4;i++){const a=i*1.7,l=1.2+b.rnd()*1.8;b.add(K.oct(.4),{p:[Math.sin(a)*1.1,l*.6,Math.cos(a)*1.1],s:[.8,l*1.5,.8],r:[.2*Math.sin(a),0,.25*Math.cos(a)],c:0x8fd6ff,c2:0xf2fbff,ch:'g',jit:.05});}}
  else{b.add(K.cyl(1.5,1.7,.5,10),{p:[0,.25,0],c:MARBD,c2:MARB});for(let i=0;i<6;i++){const a=i*TAU/6,h=i%3===0?1.4:4.2;b.add(K.cyl(.28,.32,h,7),{p:[Math.sin(a)*3.8,h/2,Math.cos(a)*3.8],c:MARBD,c2:MARB});}
    b.add(K.oct(.5),{p:[0,2.2,0],s:[1,1.6,1],c:ROSE,c2:0xffffff,ch:'g',jit:.04});}
  return{parts:[{name:'body',b}],bake:{}};};

// ---------------------------------------------------------------- lob.sceau : chaînes et cadenas qui barrent un portail encore fermé (centré sur le tourbillon)
MODELS['lob.sceau']=ctx=>{const b=K.make(381);
  for(const sd of[1,-1])for(let i=0;i<13;i++){const t=i/12-.5,x=t*6.2,y=sd*t*4.6;b.add(K.torus(.2,.055,4,8),{p:[x,y,0],r:[i%2?PI/2:0,0,sd*.64],s:[1.25,1,1],c:PAL.iron,c2:PAL.ironL,ch:'s',jit:.04});}
  b.add(K.box(.95,.8,.3,1,1),{p:[0,-.12,.14],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});b.add(K.torus(.3,.07,5,10,PI),{p:[0,.28,.14],c:PAL.iron,ch:'s',jit:0});
  b.add(K.oct(.13),{p:[0,-.1,.32],s:[1,1.4,.5],c:0xb48cff,ch:'g',jit:0});
  return{parts:[{name:'body',b}],bake:{}};};

const TOIT=0x33457f,TOITL=0x4b61a6,CREPI=0xefe6d2,CREPID=0xd8ccb2;
// ---------------------------------------------------------------- vil.dessous : la roche sous l'île (rayon 38 m), ses blocs et ses cristaux
MODELS['vil.dessous']=ctx=>{const b=K.make(401),R=38;
  b.add(K.cyl(R,R-.6,1.6,56,{open:true}),{p:[0,-.8,0],c:0x6d6a86,c2:0x9c97b0,jit:.05});
  b.add(K.lathe([[0,-34],[5,-24],[13,-14.5],[24,-7],[34,-2.6],[R-.6,-1.5]],32),{c:0x45425f,c2:0x8f8aa3,jit:.06});
  for(let i=0;i<22;i++){const a=b.rnd()*TAU,t=b.rnd(),r=8+t*27,y=-17+t*14;b.add(K.rock(2+b.rnd()*3,600+i,1,.3),{p:[Math.sin(a)*r,y,Math.cos(a)*r],s:[1,1.3,1],c:0x55516f,c2:0x9a94ad});}
  for(let i=0;i<16;i++){const a=i*TAU/16+.3,r=12+b.rnd()*20,l=1.8+b.rnd()*3.4;b.add(K.oct(.6),{p:[Math.sin(a)*r,-8-b.rnd()*7-l,Math.cos(a)*r],s:[.7,l*1.6,.7],c:0x8fd6ff,c2:0xe6f6ff,ch:'g',jit:.05});}
  return{parts:[{name:'body',b}],bake:{jit:.02}};};

// ---------------------------------------------------------------- vil.hall : le hall des héros — rotonde de marbre à dix colonnes, coupole bleu nuit ; les six héros se tiennent dedans (spots)
const hallTemple=ctx=>{const b=K.make(411),spots=[];
  b.add(K.cyl(6.1,6.4,.3,24),{p:[0,.15,0],c:PAL.stone,c2:MARBD});b.add(K.cyl(5.4,5.6,.3,24),{p:[0,.45,0],c:MARBD,c2:MARB});
  b.add(K.cyl(4.9,4.9,.04,24),{p:[0,.62,0],c:NUIT,jit:0});b.add(K.torus(4.92,.06,5,32),{p:[0,.63,0],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});
  // colonnes cannelées, base et chapiteau
  for(let i=0;i<10;i++){const a=i*TAU/10+TAU/20,x=Math.sin(a)*4.9,z=Math.cos(a)*4.9;
    b.add(K.box(.8,.22,.8),{p:[x,.71,z],r:[0,a,0],c:MARBD});b.add(K.cyl(.26,.31,4.3,8),{p:[x,2.95,z],c:MARBD,c2:MARB});b.add(K.box(.78,.24,.78,1,1),{p:[x,5.2,z],r:[0,a,0],c:MARB,c2:0xffffff});
    b.add(K.torus(.3,.04,4,8),{p:[x,4.95,z],r:[PI/2,0,0],c:ORC,ch:'s',jit:0});}
  // entablement, frise d'or, coupole et son étoile
  b.add(K.cyl(5.5,5.5,.5,24,{open:true}),{p:[0,5.57,0],c:MARB,c2:0xffffff});b.add(K.cyl(5.5,5.5,.04,24),{p:[0,5.33,0],c:MARBD,jit:0});b.add(K.cyl(5.7,5.5,.14,24),{p:[0,5.88,0],c:ORC,ch:'s',jit:0});
  b.add(K.dome(5.2,24,6),{p:[0,5.95,0],s:[1,.62,1],c:TOIT,c2:TOITL,jit:.04});
  for(let i=0;i<10;i++){const a=i*TAU/10;b.add(K.tube([[Math.sin(a)*5.2,5.97,Math.cos(a)*5.2],[Math.sin(a)*3.9,8.15,Math.cos(a)*3.9],[Math.sin(a)*1.6,9.1,Math.cos(a)*1.6]],[.07,.06,.05],4),{c:ORC,ch:'s',jit:0});}
  b.add(K.cyl(.5,.9,.5,8),{p:[0,9.3,0],c:ORC,ch:'s'});b.add(K.oct(.5),{p:[0,10.2,0],s:[1,1.7,1],c:0xbfe9ff,c2:0xffffff,ch:'g',jit:.04});
  // au centre : vasque où brûle une flamme d'étoile ; six plinthes, une par héros
  b.add(K.cyl(.9,.6,.7,10),{p:[0,.98,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});b.add(K.ico(.42,1),{p:[0,1.55,0],s:[1,1.3,1],c:0xfff2c4,ch:'g',jit:0});
  // V13.2 : six plinthes (Zéphyr, le Vent, a la sienne), espacées de 60°
  [...ELK,'vent'].forEach((el,k)=>{const a=k*TAU/6,x=Math.sin(a)*3,z=Math.cos(a)*3,E=K.EL[el];spots.push({el,x,z,y:1.02,a});
    b.add(K.cyl(.72,.82,.38,10),{p:[x,.82,z],c:MARBD,c2:MARB});b.add(K.torus(.76,.045,4,14),{p:[x,1.0,z],r:[PI/2,0,0],c:E.main,ch:'g',jit:0});
    b.add(K.prism([[-.3,3.9],[0,4.75],[.3,3.9]],.03),{p:[0,.65,0],r:[0,a,0],c:E.main,ch:'g',jit:0});});
  return{parts:[{name:'body',b}],bake:{ground:.15,groundH:.6},spots,rad:6.6};};

MODELS['vil.hall']=hallTemple;

// ---------------------------------------------------------------- vil.maison : la maison du joueur — soubassement de pierre, colombages, toit bleu, cheminée, lanterne (porte côté +Z)
const maison1=ctx=>{const b=K.make(421);
  SH.blockWall(b,{p:[0,0,2.2],w:6,h:.9,d:.4,rows:2,cols:6});SH.blockWall(b,{p:[0,0,-2.2],w:6,h:.9,d:.4,rows:2,cols:6});
  SH.blockWall(b,{p:[3,0,0],r:[0,PI/2,0],w:4.4,h:.9,d:.4,rows:2,cols:5});SH.blockWall(b,{p:[-3,0,0],r:[0,PI/2,0],w:4.4,h:.9,d:.4,rows:2,cols:5});
  b.add(K.box(5.9,2.5,4.3),{p:[0,2.1,0],c:CREPID,c2:CREPI});
  // colombages : poteaux, sablières et croix
  for(const x of[-2.95,-1,1,2.95])for(const z of[2.17,-2.17])b.add(K.box(.2,2.5,.1),{p:[x,2.1,z],c:PAL.woodD});
  for(const z of[2.17,-2.17]){b.add(K.box(6.1,.2,.12),{p:[0,.95,z],c:PAL.woodD});b.add(K.box(6.1,.2,.12),{p:[0,3.3,z],c:PAL.woodD});}
  for(const x of[2.97,-2.97]){for(const z of[-2.1,0,2.1])b.add(K.box(.1,2.5,.2),{p:[x,2.1,z],c:PAL.woodD});b.add(K.box(.12,.2,4.5),{p:[x,3.3,0],c:PAL.woodD});b.add(K.box(.1,.16,2.9),{p:[x,2.1,1.05],r:[.86,0,0],c:PAL.wood});b.add(K.box(.1,.16,2.9),{p:[x,2.1,-1.05],r:[-.86,0,0],c:PAL.wood});}
  // toit à deux pans (faîte le long de X), pignons, rives d'or
  b.add(K.box(6.9,2.5,5.4,1,0),{p:[0,4.6,0],c:TOIT,c2:TOITL,jit:.05});b.add(K.box(7,.14,.2),{p:[0,5.87,0],c:ORC,ch:'s'});
  for(const sd of[1,-1]){b.add(K.box(7,.12,.22),{p:[0,3.42,sd*2.72],c:PAL.woodD});for(let i=0;i<7;i++)b.add(K.box(.9,.05,.95),{p:[-2.85+i*.95,4.25+((i%2)*.02),sd*1.75],r:[sd*.745,0,0],c:i%2?TOITL:TOIT,jit:.04});}
  // porte ronde, marche, heurtoir
  b.add(K.box(1.5,.25,1),{p:[0,.12,2.75],c:PAL.stone,c2:PAL.stoneL});b.add(K.box(1.2,2.1,.14),{p:[0,1.95,2.2],c:PAL.wood,c2:PAL.woodL});b.add(K.cyl(.6,.6,.14,10,{arc:PI}),{p:[0,3,2.2],r:[PI/2,0,0],c:PAL.woodL});
  for(const x of[-.35,0,.35])b.add(K.box(.04,2,.03),{p:[x,1.95,2.28],c:PAL.woodD,jit:0});b.add(K.torus(.09,.025,4,8),{p:[.35,2,2.3],c:ORC,ch:'s',jit:0});
  // fenêtres éclairées, volets, jardinières
  for(const q of[[-2,2.2,0],[2,2.2,0],[-1.6,-2.2,PI],[1.6,-2.2,PI]])b.group({p:[q[0],2.2,q[1]],r:[0,q[2],0]},b=>{b.add(K.box(.95,1.05,.1),{c:0xffd98a,ch:'g',jit:0});b.add(K.box(1.1,.1,.14),{p:[0,.56,0],c:PAL.woodD});b.add(K.box(1.1,.1,.14),{p:[0,-.56,0],c:PAL.woodD});
    b.add(K.box(.07,1.05,.13),{c:PAL.woodD});b.add(K.box(.95,.07,.13),{c:PAL.woodD});b.sym(sd=>b.add(K.box(.36,1.05,.06),{p:[sd*.68,0,.03],c:TOITL}));
    b.add(K.box(1.05,.2,.28),{p:[0,-.72,.16],c:PAL.wood});for(let i=0;i<4;i++)b.add(K.ico(.11,0),{p:[-.36+i*.24,-.56,.18],c:[0xff8fb0,0xffe27a,0xffffff,0xb7a0ff][i],jit:.05});});
  // cheminée et sa braise, lanterne de porte
  b.add(K.box(.8,2.6,.8,.9,.9),{p:[1.9,5.1,-.9],c:PAL.stone,c2:PAL.stoneL});b.add(K.box(.95,.16,.95),{p:[1.9,6.45,-.9],c:PAL.stoneD});b.add(K.ico(.2,0),{p:[1.9,6.6,-.9],c:0xffb347,ch:'g',jit:0});
  b.add(K.box(.08,.08,.5),{p:[.95,3.05,2.45],c:PAL.iron});b.add(K.box(.22,.3,.22),{p:[.95,2.82,2.66],c:0xffd27a,ch:'g',jit:0});b.add(K.box(.28,.06,.28),{p:[.95,3,2.66],c:PAL.iron});
  return{parts:[{name:'body',b}],bake:{ground:.18,groundH:.7},rad:4.6,lamp:[.95,2.82,2.66]};};

// ---------------------------------------------------------------- vil.musee : le musée des artefacts — temple à fronton, terrasse devant avec huit socles (slots) pour le butin (façade côté +Z)
const musee1=ctx=>{const b=K.make(431),slots=[];
  b.add(K.box(11,.3,9.6),{p:[0,.15,.6],c:PAL.stone,c2:MARBD});b.add(K.box(10.2,.3,6.2),{p:[0,.45,-1],c:MARBD,c2:MARB});
  // murs du fond et des côtés, salle bleu nuit, colonnade de façade
  b.add(K.box(9.2,4.2,.4),{p:[0,2.7,-3.7],c:MARBD,c2:MARB});for(const sd of[1,-1])b.add(K.box(.4,4.2,4.6),{p:[sd*4.4,2.7,-1.6],c:MARBD,c2:MARB});
  b.add(K.box(8.4,3.9,.1),{p:[0,2.6,-3.45],c:NUITD,c2:NUIT});
  for(let i=0;i<6;i++){const x=-4.4+i*1.76;b.add(K.box(.74,.2,.74),{p:[x,.7,1.7],c:MARBD});b.add(K.cyl(.25,.3,3.8,8),{p:[x,2.7,1.7],c:MARBD,c2:MARB});b.add(K.box(.74,.2,.74),{p:[x,4.7,1.7],c:MARB,c2:0xffffff});}
  // entablement, fronton triangulaire avec l'étoile, toit
  b.add(K.box(10,.5,6.2),{p:[0,5.05,-.9],c:MARB,c2:0xffffff});b.add(K.box(10.1,.1,6.3),{p:[0,5.34,-.9],c:ORC,ch:'s',jit:0});
  b.add(K.box(10.2,1.9,6.4,0,1),{p:[0,6.34,-.9],c:TOIT,c2:TOITL,jit:.04});
  b.add(K.prism([[-4.7,0],[4.7,0],[0,1.6]],.16),{p:[0,5.42,2.18],r:[PI/2,0,0],s:[1,1,-1],c:MARB,c2:0xffffff});
  {const S=[];for(let i=0;i<10;i++){const a=i*TAU/10,r=i%2?.2:.5;S.push([Math.sin(a)*r,Math.cos(a)*r]);}b.add(K.prism(S,.08),{p:[0,6,2.3],r:[PI/2,0,0],c:ORC,ch:'g',jit:0});}
  // dans la salle : une grande urne et deux tentures
  b.add(K.lathe([[.0,.6],[.5,.62],[.62,1.2],[.4,1.9],[.3,2.2],[.44,2.4],[0,2.42]],10),{p:[0,0,-2.3],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
  for(const sd of[1,-1])b.add(K.box(1.3,3,.06),{p:[sd*2.6,2.9,-3.38],c:PAL.purpleD,c2:PAL.purple});
  // terrasse : huit socles en deux volées de quatre, de part et d'autre de l'allée
  for(let i=0;i<8;i++){const x=(i<4?-4.75+i*1.15:1.3+(i-4)*1.15),z=3.9;slots.push([x,1.25,z]);
    b.add(K.box(.8,.14,.8),{p:[x,.37,z],c:PAL.stone});b.add(K.cyl(.26,.31,.72,8),{p:[x,.8,z],c:MARBD,c2:MARB});b.add(K.box(.7,.1,.7),{p:[x,1.2,z],c:MARB,c2:0xffffff});}
  b.add(K.box(1.6,.04,3.6),{p:[0,.32,3.4],c:PAL.purple,c2:PAL.purpleD,jit:0});
  return{parts:[{name:'body',b}],bake:{ground:.15,groundH:.6},slots,rad:6.9};};

// ---------------------------------------------------------------- vil.armes : la salle d'armes — forge de pierre, grande cheminée, enclume, râtelier d'épées et cinq boucliers aux couleurs des héros (façade côté +Z)
const armes1=ctx=>{const b=K.make(441);
  b.add(K.box(8,.3,7),{p:[0,.15,.3],c:PAL.stoneD,c2:PAL.stone});
  SH.blockWall(b,{p:[0,.3,-2.6],w:7,h:3.4,d:.5,rows:6,cols:7});for(const sd of[1,-1])SH.blockWall(b,{p:[sd*3.3,.3,-.6],r:[0,PI/2,0],w:4,h:3.4,d:.5,rows:6,cols:4});
  // avancée de façade sur deux poteaux, auvent, toit d'ardoise
  for(const sd of[1,-1]){b.add(K.box(.36,3.4,.36),{p:[sd*3.3,2,2.2],c:PAL.woodD,c2:PAL.wood});b.add(K.box(.3,.3,1.2),{p:[sd*3.3,3.3,1.75],r:[.6,0,0],c:PAL.wood});}
  b.add(K.box(7.3,.3,.36),{p:[0,3.72,2.2],c:PAL.woodD});
  b.add(K.box(8.2,2.3,6.2,1,0),{p:[0,4.95,-.2],c:0x3a3f52,c2:0x5a6079,jit:.05});b.add(K.box(8.3,.14,.2),{p:[0,6.12,-.2],c:PAL.iron,ch:'s'});
  // cheminée de forge : foyer rougeoyant, conduit, braises
  b.add(K.box(2,2.2,1.5),{p:[-2,1.4,-1.7],c:PAL.stoneD,c2:PAL.stone});b.add(K.box(1.3,.9,.2),{p:[-2,1.25,-.95],c:0xff7a2e,c2:0xffd27a,ch:'g',jit:0});
  b.add(K.box(1.2,5,1.1,.8,.8),{p:[-2,5,-1.8],c:PAL.stoneD,c2:PAL.stone});b.add(K.box(1.3,.2,1.2),{p:[-2,7.55,-1.8],c:PAL.stoneDD});b.add(K.ico(.3,0),{p:[-2,7.75,-1.8],c:0xff9d5c,ch:'g',jit:0});
  // enclume sur son billot, marteau, seau
  b.add(K.cyl(.42,.46,.7,8),{p:[-.2,.65,.9],c:PAL.barkD,c2:PAL.bark});b.add(K.box(.9,.22,.4),{p:[-.2,1.22,.9],c:PAL.iron,c2:PAL.ironL,ch:'s'});b.add(K.box(.5,.2,.32,.7,1),{p:[-.2,1.05,.9],c:PAL.iron,ch:'s'});b.add(K.cone(.14,.5,5),{p:[.45,1.22,.9],r:[0,0,-PI/2],c:PAL.ironL,ch:'s'});
  b.add(K.box(.3,.2,.2),{p:[-.35,1.44,.86],r:[0,.4,0],c:PAL.steel,ch:'s'});b.add(K.cyl(.035,.035,.55,5),{p:[-.12,1.44,.96],r:[0,.4,PI/2],c:PAL.wood});
  // râtelier d'épées contre le mur, boucliers des cinq héros sous l'auvent
  b.add(K.box(2.4,.12,.3),{p:[1.8,1.1,-2.2],c:PAL.wood});b.add(K.box(2.4,.12,.3),{p:[1.8,2.3,-2.2],c:PAL.wood});
  for(let i=0;i<5;i++){const x=.9+i*.45;b.add(K.box(.09,1.5,.03),{p:[x,1.9,-2.15],c:PAL.steel,c2:0xf2f6fa,ch:'s',jit:0});b.add(K.box(.34,.07,.08),{p:[x,1.12,-2.15],c:ORC,ch:'s'});b.add(K.cyl(.035,.035,.3,5),{p:[x,.94,-2.15],c:PAL.woodD});}
  ELK.forEach((el,i)=>{const x=-2.8+i*1.4,E=K.EL[el];b.add(K.cyl(.46,.46,.1,10),{p:[x,3.72,2.42],r:[PI/2,0,0],c:E.dark,c2:E.main});b.add(K.torus(.46,.05,4,12),{p:[x,3.72,2.46],c:PAL.ironL,ch:'s',jit:0});b.add(K.ico(.12,0),{p:[x,3.72,2.52],c:E.glow,ch:'g',jit:0});});
  // mannequin d'entraînement, tonneau d'eau
  b.add(K.cyl(.08,.1,1.9,6),{p:[2.6,1.25,1.4],c:PAL.wood});b.add(K.box(1.3,.12,.12),{p:[2.6,1.75,1.4],c:PAL.wood});b.add(K.ico(.28,1),{p:[2.6,2.35,1.4],c:PAL.rope});b.add(K.cyl(.34,.3,.9,8),{p:[2.6,1.35,1.4],c:PAL.rope,c2:PAL.sand});
  b.add(K.cyl(.4,.36,.9,9),{p:[1.2,.75,1.9],c:PAL.wood,c2:PAL.woodL});b.add(K.cyl(.36,.36,.03,9),{p:[1.2,1.17,1.9],c:0x3fa9ff,ch:'s',jit:0});
  return{parts:[{name:'body',b}],bake:{ground:.18,groundH:.7},rad:5.4};};

// ---------------------------------------------------------------- vil.fontaine : fontaine d'étoiles — bassin rond, vasque, eau claire, étoile qui tourne
MODELS['vil.fontaine']=ctx=>{const b=K.make(451),st=K.make(452);
  SH.bricks(b,{r:2.1,h:.6,rows:1,n:14,y:0,d:.45,c:MARBD});b.add(K.cyl(2.2,2.2,.1,18),{p:[0,.63,0],c:MARB,c2:0xffffff});b.add(K.cyl(1.72,1.72,.06,18),{p:[0,.67,0],c:NUITD,jit:0});
  b.add(K.cyl(1.7,1.7,.04,18),{p:[0,.5,0],c:0x5fc4ff,c2:0xbfe9ff,ch:'s',jit:0});
  b.add(K.lathe([[.0,.4],[.45,.42],[.3,.9],[.22,1.5],[.3,1.62],[.95,1.9],[1,2],[.2,2.0]],12),{c:MARBD,c2:MARB});b.add(K.cyl(.86,.86,.03,12),{p:[0,1.97,0],c:0x8fd6ff,ch:'s',jit:0});
  for(let i=0;i<5;i++){const a=i*TAU/5;b.add(K.tube([[Math.sin(a)*.9,1.95,Math.cos(a)*.9],[Math.sin(a)*1.25,1.5,Math.cos(a)*1.25],[Math.sin(a)*1.4,.6,Math.cos(a)*1.4]],[.05,.045,.03],4),{c:0xbfe9ff,ch:'g',jit:0});}
  st.add(K.oct(.26),{p:[0,2.75,0],s:[1,1.7,1],c:0xfff2c4,c2:0xffffff,ch:'g',jit:0});for(let i=0;i<4;i++){const a=i*TAU/4;st.add(K.cone(.08,.36,4),{p:[Math.sin(a)*.3,2.75,Math.cos(a)*.3],r:[PI/2*Math.cos(a),0,-PI/2*Math.sin(a)],c:ORC,ch:'s',jit:0});}
  return{parts:[{name:'body',b},{name:'star',b:st,parent:'body',pivot:[0,2.75,0],anim:[{k:'rot',axis:'y',spin:true,sp:.9},{k:'pos',axis:'y',amp:.1,sp:1.6}]}],bake:{ground:.15,groundH:.5},rad:2.4};};

// ---------------------------------------------------------------- vil.mine : la mine d'étoiles — butte de roche, galerie étayée, wagonnet de cristaux (entrée côté +Z). Elle rapporte de l'or céleste à chaque partie.
const mine1=ctx=>{const b=K.make(461),CR=0x8fd6ff,CRL=0xe6f6ff;
  b.add(K.rock(3.6,81,1,.26),{p:[0,1.5,-1.2],s:[1.25,.85,1.05],c:0x6d6a86,c2:0x9c97b0});b.add(K.rock(2.2,82,1,.3),{p:[-2.9,.9,-.2],c:0x5d5a78,c2:0x8f8aa3});b.add(K.rock(2,83,1,.3),{p:[3,.8,-.4],c:0x5d5a78,c2:0x8f8aa3});
  // galerie : cadre de poutres, fond noir, lanterne
  b.add(K.box(2.3,2.5,.5),{p:[0,1.25,2.05],c:0x15131f,jit:0});for(const sd of[1,-1])b.add(K.box(.34,2.9,.4),{p:[sd*1.3,1.45,2.3],r:[0,0,-sd*.07],c:PAL.woodD,c2:PAL.wood});b.add(K.box(3.3,.36,.44),{p:[0,2.95,2.3],c:PAL.wood,c2:PAL.woodL});
  b.add(K.box(.2,.3,.2),{p:[1.05,2.5,2.6],c:0xffd27a,ch:'g',jit:0});
  // rails, wagonnet plein de cristaux
  for(const sd of[1,-1])b.add(K.box(.09,.08,3.6),{p:[sd*.5,.06,3.7],c:PAL.iron,ch:'s'});for(let i=0;i<5;i++)b.add(K.box(1.5,.07,.2),{p:[0,.03,2.3+i*.75],c:PAL.woodD});
  b.add(K.box(1.3,.7,1.7,1.15,1.1),{p:[0,.68,4.3],c:PAL.wood,c2:PAL.woodL});b.sym(sd=>{for(const z of[3.75,4.85])b.add(K.cyl(.22,.22,.1,8),{p:[sd*.62,.26,z],r:[0,0,PI/2],c:PAL.iron,ch:'s'});});
  for(let i=0;i<6;i++)b.add(K.oct(.2+b.rnd()*.14),{p:[-.35+b.rnd()*.7,1.12+b.rnd()*.2,3.8+b.rnd()*1],s:[1,1.5,1],r:[b.rnd(),b.rnd()*3,b.rnd()],c:CR,c2:CRL,ch:'g',jit:.05});
  // veines de cristal dans la roche : plus il y a de niveaux, plus il y en a
  const N=5;for(let i=0;i<N;i++){const a=-1.9+i*3.8/Math.max(1,N-1),l=.7+b.rnd()*1.1+(i%3===0?.6:0);b.add(K.oct(.3),{p:[Math.sin(a)*3.9,1.5+b.rnd()*1.9,-1+Math.cos(a)*2.3],s:[.8,l*1.5,.8],r:[.5*Math.cos(a),0,-.5*Math.sin(a)],c:CR,c2:CRL,ch:'g',jit:.05});}
  return{parts:[{name:'body',b}],bake:{ground:.18,groundH:.7},rad:5};};

// ---------------------------------------------------------------- vil.taverne : la taverne des défis — auberge à étage en encorbellement, enseigne, tonneaux, table dehors (porte côté +Z)
const taverne1=ctx=>{const b=K.make(471);
  SH.blockWall(b,{p:[0,0,2.6],w:7.4,h:2.7,d:.45,rows:5,cols:7});SH.blockWall(b,{p:[0,0,-2.6],w:7.4,h:2.7,d:.45,rows:5,cols:7});for(const sd of[1,-1])SH.blockWall(b,{p:[sd*3.7,0,0],r:[0,PI/2,0],w:5.2,h:2.7,d:.45,rows:5,cols:5});
  // étage en bois qui déborde, colombages, toit rouge sombre
  b.add(K.box(8.2,.3,6.4),{p:[0,2.85,0],c:PAL.woodD});b.add(K.box(7.9,2.5,6.1),{p:[0,4.25,0],c:CREPID,c2:CREPI});
  for(const x of[-3.95,-1.4,1.4,3.95])for(const z of[3.07,-3.07])b.add(K.box(.22,2.5,.1),{p:[x,4.25,z],c:PAL.woodD});for(const z of[3.07,-3.07]){b.add(K.box(8.1,.2,.12),{p:[0,5.45,z],c:PAL.woodD});b.add(K.box(2.6,.14,.1),{p:[-2.7,4.25,z],r:[0,0,.75],c:PAL.wood});b.add(K.box(2.6,.14,.1),{p:[2.7,4.25,z],r:[0,0,-.75],c:PAL.wood});}
  b.add(K.box(9,2.9,7.2,1,0),{p:[0,6.95,0],c:0x7a2f2a,c2:0xa8473c,jit:.05});b.add(K.box(9.1,.14,.2),{p:[0,8.42,0],c:PAL.woodD});
  // porte, fenêtres éclairées, cheminée
  b.add(K.box(1.5,2.2,.16),{p:[0,1.1,2.85],c:PAL.wood,c2:PAL.woodL});b.add(K.box(1.8,.2,.22),{p:[0,2.3,2.85],c:PAL.woodD});b.add(K.box(2,.2,1.1),{p:[0,.1,3.4],c:PAL.stone});
  for(const q of[[-2.4,1.5,2.86],[2.4,1.5,2.86],[-2.2,4.3,3.1],[0,4.3,3.1],[2.2,4.3,3.1]]){b.add(K.box(1,1,.1),{p:q,c:0xffc56b,ch:'g',jit:0});b.add(K.box(.07,1,.13),{p:q,c:PAL.woodD});b.add(K.box(1,.07,.13),{p:q,c:PAL.woodD});}
  b.add(K.box(1,3.4,1,.9,.9),{p:[-2.8,8,-1.2],c:PAL.stone,c2:PAL.stoneL});b.add(K.ico(.22,0),{p:[-2.8,9.8,-1.2],c:0xffb347,ch:'g',jit:0});
  // enseigne à la chope, tonneaux, table et bancs
  b.add(K.box(.1,.1,1.5),{p:[3.2,3.6,3.6],c:PAL.iron});b.add(K.box(.08,.9,1),{p:[3.2,3,3.9],c:PAL.wood,c2:PAL.woodL});b.add(K.cyl(.2,.17,.4,7),{p:[3.27,3,3.9],c:ORC,ch:'s'});b.add(K.cyl(.2,.2,.08,7),{p:[3.27,3.24,3.9],c:PAL.cream});
  for(const q of[[-3.2,3.6],[-2.3,3.9],[-2.8,3.75,1]])b.add(K.cyl(.42,.38,.95,9),{p:[q[0],q[2]?1.42:.48,q[1]],c:PAL.wood,c2:PAL.woodL});
  b.add(K.box(2.2,.12,1),{p:[2.2,.85,4.6],c:PAL.woodL});for(const sd of[1,-1]){b.add(K.box(.14,.85,.9),{p:[2.2+sd*.9,.42,4.6],c:PAL.woodD});b.add(K.box(2.2,.1,.36),{p:[2.2,.48,4.6+sd*.9],c:PAL.wood});}
  b.add(K.cyl(.1,.09,.2,6),{p:[1.8,1,4.5],c:ORC,ch:'s'});b.add(K.cyl(.1,.09,.2,6),{p:[2.6,1,4.75],c:ORC,ch:'s'});
  return{parts:[{name:'body',b}],bake:{ground:.18,groundH:.7},rad:5.6};};

MODELS['vil.maison']=maison1;

MODELS['vil.musee']=musee1;

MODELS['vil.armes']=armes1;

MODELS['vil.marchand']=ctx=>MODELS['set.etal'](ctx);

// ---------------------------------------------------------------- vil.verger : le verger céleste — trois arbres à fruits d'or, enclos de bois, appentis à toit bleu nuit, charrette et paniers (entrée côté +Z). Il prépare des provisions pour la prochaine partie.
const verger1=ctx=>{const b=K.make(487),FR=0xffd27a,FRL=0xfff0b8,LF=K.mix(PAL.leaf,PAL.leafL,.45),LFD=K.mix(PAL.leafD,PAL.leaf,.35),LFU=K.mix(PAL.leafL,PAL.grassL,.5);
  // un arbre fruitier : tronc tordu, deux charpentières, ramure en quatre masses, fruits d'or qui luisent
  const arbre=(x,z,h,ry,sd)=>b.group({p:[x,0,z],r:[0,ry,0],s:h},g=>{
    g.add(K.tube(K.curve([[0,-.1,0],[.12,.8,.05],[-.1,1.6,0],[.05,2.3,.05]],4),[.3,.22,.18,.15,.12],5,{open:true}),{c:PAL.barkD,c2:PAL.bark,jit:.09});
    g.add(K.tube([[-.05,1.5,0],[-.7,2.1,.2],[-1.05,2.5,.3]],[.13,.09,.06],4,{open:true}),{c:PAL.bark,jit:.08});g.add(K.tube([[.02,1.7,0],[.65,2.3,-.3],[.95,2.7,-.4]],[.12,.09,.06],4,{open:true}),{c:PAL.bark,jit:.08});
    for(const q of[[0,3.05,0,1.35,.95],[-1.05,2.75,.3,1.0,.8],[.95,2.95,-.4,1.05,.8],[.1,2.6,.75,.9,.7],[-.2,2.7,-.85,.95,.7]])g.add(K.ico(q[3],1),{p:[q[0],q[1],q[2]],s:[1,q[4],1],r:[g.rnd(),g.rnd()*3,g.rnd()],c:LFD,c2:q[1]>2.9?LFU:LF,jit:.08});
    for(let i=0;i<12;i++){const a=sd+i*2.4,y=2.2+((i*5)%7)*.2,r=(y>3.2?.75:1.25)+((i*7)%5)*.09;g.add(K.oct(.19),{p:[Math.sin(a)*r,y,Math.cos(a)*r],s:[1,1.2,1],c:FR,c2:FRL,ch:'g',jit:0});}});
  arbre(-2.6,-1.3,1.4,.4,.3);arbre(2.5,-2.0,1.55,2.1,1.1);arbre(-.2,-3.3,1.3,4,2.2);
  // enclos : piquets et deux lisses, ouvert devant (+Z)
  const N=18;for(let i=0;i<N;i++){const a=i*TAU/N+TAU/36;if(Math.abs(a-TAU)<.5||a<.5)continue;const x=Math.sin(a)*4.6,z=Math.cos(a)*4.6;b.add(K.box(.16,.95+b.rnd()*.12,.16,.7,.7),{p:[x,.48,z],r:[0,a,0],c:PAL.woodD,c2:PAL.wood,jit:.06});
    const a2=a+TAU/N;if(Math.abs(a2-TAU)<.5||a2<.5||i===N-1)continue;const x2=Math.sin(a2)*4.6,z2=Math.cos(a2)*4.6,l=Math.hypot(x2-x,z2-z);for(const y of[.38,.74])b.add(K.box(l,.08,.07),{p:[(x+x2)/2,y,(z+z2)/2],r:[0,Math.atan2(-(z2-z),x2-x),0],c:PAL.wood,c2:PAL.woodL,jit:.05});}
  // portillon : deux poteaux, traverse, lanterne
  for(const sd of[1,-1])b.add(K.box(.24,2.3,.24),{p:[sd*1.15,1.15,4.55],c:PAL.woodD,c2:PAL.wood});b.add(K.box(2.8,.2,.26),{p:[0,2.35,4.55],c:PAL.wood,c2:PAL.woodL});b.add(K.box(.2,.28,.2),{p:[0,2.08,4.55],c:0xffd27a,ch:'g',jit:0});
  // appentis : quatre poteaux, toit bleu nuit à deux pans, étagère de paniers
  b.group({p:[2.7,0,1.5],r:[0,-.5,0]},g=>{for(const sx of[1,-1])for(const sz of[1,-1])g.add(K.box(.16,1.9,.16),{p:[sx*.95,.95,sz*.7],c:PAL.woodD,c2:PAL.wood});
    g.add(K.box(2.5,.6,1.9,.05,1),{p:[0,2.2,0],c:NUITD,c2:NUIT,jit:.05});g.add(K.box(2.3,.09,1.7),{p:[0,1.88,0],c:PAL.wood});g.add(K.box(1.9,.08,1.1),{p:[0,.7,0],c:PAL.plank,c2:PAL.woodL});
    for(const q of[[-.6,.92,.1],[.05,.92,-.15],[.65,.92,.15]]){g.add(K.cyl(.26,.2,.36,8),{p:q,c:PAL.rope,c2:PAL.cream,jit:.05});for(let i=0;i<4;i++)g.add(K.oct(.11),{p:[q[0]-.1+g.rnd()*.2,1.12+g.rnd()*.06,q[2]-.1+g.rnd()*.2],c:FR,c2:FRL,ch:'g',jit:0});}});
  // charrette : caisse, deux roues, timon, récolte
  b.group({p:[-2.2,0,2.3],r:[0,.7,0]},g=>{g.add(K.box(1.5,.5,.95,1.12,1.08),{p:[0,.72,0],c:PAL.wood,c2:PAL.woodL});for(const sd of[1,-1])g.add(K.cyl(.36,.36,.09,10),{p:[0,.36,sd*.55],r:[PI/2,0,0],c:PAL.woodD,c2:PAL.iron});
    g.add(K.box(1.3,.07,.07),{p:[1.35,.5,0],r:[0,0,-.18],c:PAL.woodD});for(let i=0;i<7;i++)g.add(K.oct(.13),{p:[-.5+g.rnd()*1,1.02+g.rnd()*.1,-.3+g.rnd()*.6],c:FR,c2:FRL,ch:'g',jit:0});});
  // échelle contre le premier arbre, panier au pied
  b.group({p:[-1.75,0,-.75],r:[.28,.9,0]},g=>{for(const sd of[1,-1])g.add(K.box(.07,2.5,.07),{p:[sd*.24,1.25,0],c:PAL.wood});for(let i=0;i<5;i++)g.add(K.box(.5,.05,.06),{p:[0,.4+i*.45,0],c:PAL.woodL});});
  b.add(K.cyl(.3,.23,.4,8),{p:[.9,.2,2.6],c:PAL.rope,c2:PAL.cream,jit:.05});for(let i=0;i<5;i++)b.add(K.oct(.12),{p:[.8+b.rnd()*.2,.44+b.rnd()*.06,2.5+b.rnd()*.2],c:FR,c2:FRL,ch:'g',jit:0});
  // fruits tombés dans l'herbe
  for(let i=0;i<6;i++){const a=b.rnd()*TAU,r=1+b.rnd()*2.6;b.add(K.oct(.11),{p:[Math.sin(a)*r,.1,Math.cos(a)*r-.6],c:FR,c2:FRL,ch:'g',jit:0});}
  return{parts:[{name:'body',b}],bake:{ground:.18,groundH:.7},rad:5};};

MODELS['vil.mine']=mine1;

MODELS['vil.verger']=verger1;

MODELS['vil.taverne']=taverne1;

}
