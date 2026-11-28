// MAINS — les trois objets tenus par le joueur (vus à la première personne) et l'avatar des coéquipiers.
// Repère des objets tenus : celui de la caméra (−Z devant, +X à droite, +Y en haut), origine = la poignée, au creux de la main.
{
const {PAL}=K,PI=Math.PI;
// --- petits outils : vecteurs, et angles d'Euler (ordre XYZ) d'un repère dont l'axe Y suit `d` et l'axe X regarde vers `u`
const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const frame=(d,u)=>{const Y=nrm(d),Z=nrm(crs(u,Y)),X=crs(Y,Z);return[Math.atan2(-Z[1],Z[2]),Math.asin(Math.max(-1,Math.min(1,Z[0]))),Math.atan2(-Y[0],X[0])];};
// --- cuirs du gardien (tirés de la palette)
const GANT=K.mix(PAL.dirt,PAL.sand,.36),GANT_D=K.shade(PAL.dirt,.86),CUIR=K.mix(PAL.bark,PAL.wood,.5),CUIR_D=PAL.barkD;

// ---------------------------------------------------------------- la main gantée (droite)
// Repère de la main : le manche suit l'axe Y (pouce vers +Y), la paume est à droite (+X), les doigts passent devant (−Z)
// et reviennent à gauche (−X), le poignet est derrière (+Z). ax, az : demi-largeur et demi-profondeur du manche.
const doigt=(b,ax,az,y,rf,ls)=>{const q=(f,rho,dy)=>{const a=(12+(f-12)*ls)*PI/180;return[(ax+rho)*Math.cos(a),y+dy,-(az+rho)*Math.sin(a)];};
  b.add(K.tube([q(12,.0175,0),q(98,.0125,0),q(160,.011,-.001),q(205,.0095,-.002),q(222,.008,-.002)],[rf*1.1,rf*1.22,rf*1.08,rf*.92,rf*.55],5),{c:GANT,jit:.07});};
const paume=(b,ax,yc)=>{
  b.add(K.ico(.05,0),{p:[ax+.011,yc,.034],s:[.44,.94,1],r:[0,.1,0],c:GANT,jit:.06});                      // dos de la main, des jointures au poignet
  b.add(K.ico(.023,0),{p:[-.003,yc+.02,.04],s:[1,1.15,1.1],c:GANT});                                 // éminence du pouce
  b.add(K.ico(.021,0),{p:[.006,yc-.022,.046],s:[1,1.2,1.1],c:GANT_D});};                             // talon de la main
// avant-bras : poignet en w, direction a (vers le coude), u = côté tourné vers le joueur (boucle et laçage)
const bras=(b,w,a,u,len)=>b.group({p:w,r:frame(a,u)},b=>{
  b.add(K.lathe([[.031,-.012],[.034,.004],[.036,.022],[.043,.046],[.045,.049],[.0435,.052],[.039,.052]],8),{c:GANT_D,c2:GANT});   // crispin du gant
  b.add(K.lathe([[.0355,.002],[.0398,.005],[.0398,.021],[.0355,.024]],8),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});                  // bracelet de bronze
  for(let i=0;i<5;i++){const t=-1.1+i*.55;b.add(K.oct(.0042),{p:[Math.cos(t)*.0403,.013,Math.sin(t)*.0403],c:PAL.gold,ch:'s',jit:0});}  // rivets
  b.add(K.lathe([[.0375,.048],[.04,.07],[.0425,.11],[.047,.16],[.05,len]],8,{capT:true}),{c:CUIR,c2:K.shade(CUIR,.85)});         // manche de cuir
  b.add(K.cyl(.0432,.0422,.012,8),{p:[0,.074,0],c:CUIR_D});b.add(K.box(.006,.016,.014),{p:[.0432,.074,0],c:PAL.bronzeL,ch:'s'});   // sangle et sa boucle
  for(let i=0;i<3;i++){const y=.1+i*.03,r=.0425+i*.0025;                                                                        // laçage croisé
    for(const sd of[-1,1])b.add(K.box(.004,.034,.0045),{p:[r,y,0],r:[sd*.85,0,0],c:PAL.rope,jit:0});}
  b.add(K.box(.003,len-.09,.007),{p:[.0445,.09+(len-.09)/2,0],r:[0,0,-.06],c:CUIR_D,jit:0});});                                  // fente sous les lacets

// (V10.1) les armes à feu ne sont plus ici : ce sont celles de Dernier Toit (dt/mains.js, collé par build.py après ce fichier). L'ancien pistolet à cristal est dans archive/mains.v100.js.
// ---------------------------------------------------------------- le poing refermé sur un manche rond (pelle, maillet)
const poing=(b,ra)=>{for(const q of[[.03,.0105,1],[.009,.011,1],[-.012,.0105,.97],[-.032,.0095,.88]])doigt(b,ra,ra,q[0],q[1],q[2]);
  b.add(K.tube([[.004,.028,.05],[-.016,.046,.026],[-ra-.0135,.05,-.002],[-ra-.004,.046,-.027],[-ra+.003,.044,-.033]],[.016,.0135,.0125,.0105,.006],5),{c:GANT,jit:.07});  // pouce posé au-dessus de l'index
  paume(b,ra,-.002);};
// orientation commune des outils : manche penché vers l'avant et un peu vers la gauche, doigts et pouce tournés vers le joueur
const BIAIS=frame([-.12,.8,-.59],[.855,-.12,-.5]);

// ---------------------------------------------------------------- vm.pelle : la pelle du terrassier (courte, poignée en T)
MODELS['vm.pelle']=ctx=>{const b=K.make(51),FER=PAL.ironL;
  const D=[[0,-.012],[.03,-.012],[.085,0],[.1,.065],[.094,.14],[.078,.176],[.064,.2],[.03,.223],[0,.23]],            // demi-lame droite (z, y), tranchant ébréché
    G=[[0,-.012],[.03,-.012],[.085,0],[.1,.065],[.096,.135],[.074,.19],[.036,.222],[0,.23]];                            // demi-lame gauche
  b.group({r:BIAIS},b=>{
    // manche de bois, ligatures de corde et chiffon noué
    b.add(K.cyl(.0155,.0172,.215,7),{p:[0,.0225,0],c:PAL.wood,c2:PAL.woodL});
    for(const y of[.062,.072,.082])b.add(K.cyl(.0178,.0178,.007,7),{p:[0,y,0],c:PAL.rope,jit:.08});
    b.add(K.cyl(.0192,.0192,.014,7),{p:[0,.1,0],c:PAL.cloth});
    b.add(K.box(.004,.055,.016,1,.6),{p:[-.019,.075,.012],r:[.25,0,.12],c:PAL.cloth,c2:PAL.clothD});b.add(K.box(.004,.04,.014,1,.5),{p:[-.02,.082,-.008],r:[-.3,0,.1],c:PAL.clothD});
    // poignée en T, virole de bronze
    b.add(K.cyl(.015,.015,.118,7),{p:[0,-.094,0],r:[PI/2,0,0],c:PAL.woodD,c2:PAL.wood});
    for(const sd of[-1,1])b.add(K.cyl(.0168,.0168,.012,7),{p:[0,-.094,sd*.06],r:[PI/2,0,0],c:PAL.bronze,ch:'s'});
    b.add(K.cyl(.0195,.0205,.018,7),{p:[0,-.078,0],c:PAL.bronzeL,ch:'s'});
    // douille de fer rivetée
    b.add(K.cyl(.0215,.0185,.092,7),{p:[0,.166,0],c:FER,c2:PAL.steel,ch:'s'});
    b.add(K.cyl(.0208,.0208,.012,7),{p:[0,.122,0],c:PAL.bronze,ch:'s'});
    for(const y of[.15,.185])b.add(K.oct(.005),{p:[-.0205,y,0],c:PAL.gold,ch:'s',jit:0});
    // lame de fer large, creuse (deux pans), bord usé plus clair
    b.group({p:[0,.206,0],r:[0,0,.14],s:[1,1,.92]},b=>{
      [[D,1],[G,-1]].forEach(q=>b.group({r:[0,-q[1]*.2,0]},b=>{
        b.add(K.prism(q[0].map(v=>[v[1],v[0]]),.004,{y0:-.002}),{r:[0,0,PI/2],s:[1,1,q[1]],c:PAL.steel,ch:'s',jit:.08});
        b.add(K.prism(q[0].map(v=>[.008+v[1]*.92,v[0]*.9]),.008,{y0:-.004}),{r:[0,0,PI/2],s:[1,1,q[1]],c:K.mix(FER,PAL.steel,.35),jit:.1});
        b.add(K.box(.012,.006,.05),{p:[-.003,-.011,q[1]*.056],c:PAL.iron,ch:'s'});}));                                 // rebords d'appui
      b.add(K.box(.008,.15,.016,1,.25),{p:[-.004,.068,0],c:PAL.steel,ch:'s'});                                         // nervure centrale
      for(const q of[[.15,.04,.018],[.185,-.03,.014],[.12,-.06,.012],[.2,.02,.01]])b.add(K.oct(q[2]),{p:[-.0045-Math.abs(q[1])*.2,q[0],q[1]],s:[.12,1.3,1],c:PAL.dirt,jit:.15}); // terre collée
    });
    poing(b,.0165);
    bras(b,[.018,-.004,.08],[.19,-.67,.72],[-1,.2,.3],.2);
  });
  return{parts:[{name:'body',b}],bake:{ground:0,jit:.04},hold:{p:[.825,-.315,-.65],r:[-.3,-.1,-.14]}};};
// ---------------------------------------------------------------- vm.marteau : le maillet du bâtisseur
MODELS['vm.marteau']=ctx=>{const b=K.make(61),HY=.252;
  b.group({r:BIAIS},b=>{
    // manche de bois gainé de cuir, ligatures, calotte de bronze et dragonne
    b.add(K.cyl(.0158,.018,.3,7),{p:[0,.065,0],c:PAL.wood,c2:PAL.woodL});
    b.add(K.cyl(.0172,.0188,.15,7),{p:[0,.008,0],c:CUIR_D,c2:CUIR,jit:.08});
    for(const y of[.058,.069,.08])b.add(K.cyl(.0186,.0186,.006,7),{p:[0,y,0],c:PAL.rope,jit:.08});
    b.add(K.lathe([[0,-.104],[.016,-.1],[.0215,-.09],[.0215,-.078],[.018,-.072]],7),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.tube(K.curve([[0,-.1,.012],[-.012,-.125,.03],[-.004,-.15,.05],[.012,-.132,.062],[.006,-.108,.03]],8),.0035,4),{c:CUIR_D,jit:0});
    // tête de pierre : cœur, deux frappes taillées, cercles de bronze rivetés
    b.add(K.box(.086,.09,.1),{p:[0,HY,0],c:PAL.stone,jit:.07});
    for(const sd of[-1,1]){b.add(K.box(.096,.036,.1,.84,.84),{p:[0,HY,sd*.067],r:[sd*PI/2,0,0],c:PAL.stoneL,c2:PAL.stone,jit:.07});
      b.add(K.box(.1,.104,.013),{p:[0,HY,sd*.043],c:PAL.bronze,ch:'s'});
      for(const y of[-.03,.03])b.add(K.oct(.0055),{p:[-.051,HY+y,sd*.043],c:PAL.gold,ch:'s',jit:0});}
    b.add(K.cyl(.0245,.021,.022,7),{p:[0,HY-.055,0],c:PAL.bronzeL,ch:'s'});                                            // douille sous la tête
    b.add(K.cyl(.017,.022,.012,7),{p:[0,HY+.051,0],c:PAL.bronze,ch:'s'});b.add(K.box(.008,.008,.024),{p:[0,HY+.058,0],c:PAL.iron,ch:'s'}); // coin de serrage
    b.add(K.box(.004,.03,.004),{p:[-.0435,HY+.02,-.03],r:[.5,0,0],c:PAL.stoneDD,jit:0});b.add(K.box(.004,.022,.004),{p:[-.0435,HY-.026,.026],r:[-.7,0,0],c:PAL.stoneDD,jit:0}); // fissures
    // rune gravée lumineuse, sur les deux flancs
    for(const sd of[-1,1])b.group({p:[sd*.0438,HY,0]},b=>{
      b.add(K.box(.003,.056,.007),{c:PAL.rune,ch:'g',jit:0});
      b.add(K.box(.003,.03,.006),{p:[0,.011,.011],r:[-.85,0,0],c:PAL.rune,ch:'g',jit:0});
      b.add(K.box(.003,.03,.006),{p:[0,.011,-.011],r:[.85,0,0],c:PAL.rune,ch:'g',jit:0});
      b.add(K.oct(.0055),{p:[0,-.034,0],s:[.3,1,1],c:PAL.crystal,ch:'g',jit:0});});
    poing(b,.0178);
    bras(b,[.018,-.004,.08],[.19,-.67,.72],[-1,.2,.3],.2);
  });
  return{parts:[{name:'body',b}],bake:{ground:0,jit:.04},hold:{p:[.7,-.29,-.56],r:[-.12,-.1,-.12]}};};
// ---------------------------------------------------------------- hero.avatar : le gardien vu par ses coéquipiers (≈ 1,8 m, regarde vers −Z)
MODELS['hero.avatar']=ctx=>{
  { const N = { feu: 'braise', terre: 'roc', bois: 'sylve', elec: 'volt', eau: 'ondine', vent: 'zephyr' }[ctx.hero || ctx.el], M = N && MODELS['hero.' + N]; if (M) return M(ctx); }
  const P=ctx.P||K.EL.feu,b=K.make(71),aL=K.make(72),aR=K.make(73),TUN=P.main;
  // --- bottes à revers et jambes
  b.sym(sd=>{b.add(K.box(.13,.1,.27,.85,.75),{p:[sd*.11,.05,-.035],c:CUIR_D});
    b.add(K.cyl(.068,.075,.32,6),{p:[sd*.11,.24,0],c:CUIR_D,c2:CUIR});
    b.add(K.cyl(.084,.078,.05,6),{p:[sd*.11,.41,0],c:GANT_D});
    b.add(K.cyl(.078,.07,.34,6),{p:[sd*.11,.6,0],c:PAL.dirtD});});
  // --- tunique à la couleur de l'élément : jupe galonnée, ceinture, torse, baudrier
  b.add(K.cyl(.2,.275,.36,8),{p:[0,.87,0],s:[1,1,.82],c:P.dark,c2:TUN});
  b.add(K.cyl(.28,.285,.035,8),{p:[0,.7,0],s:[1,1,.82],c:P.light});
  b.add(K.ico(.25,1),{p:[0,1.25,0],s:[1,1,.72],c:TUN,c2:K.mix(TUN,P.light,.4)});
  b.add(K.cyl(.208,.208,.065,8),{p:[0,1.04,0],s:[1,1,.8],c:PAL.woodD});
  b.add(K.box(.075,.075,.03),{p:[0,1.04,-.172],c:PAL.bronzeL,ch:'s'});
  b.add(K.box(.09,.11,.065,.9,.9),{p:[-.16,.97,-.1],c:CUIR});
  b.add(K.box(.055,.5,.02),{p:[0,1.27,-.176],r:[0,0,.6],c:CUIR_D});
  // --- camail sur les épaules, épaulière de bronze (épaule gauche), agrafe
  b.add(K.cyl(.15,.275,.14,8),{p:[0,1.47,0],s:[1,1,.8],c:P.dark,c2:TUN});
  b.add(K.dome(.118,6,3),{p:[-.3,1.44,0],s:[1,.8,1.1],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
  b.add(K.cyl(.122,.127,.025,6),{p:[-.3,1.44,0],s:[1,1,1.1],c:PAL.goldD,ch:'s'});
  b.add(K.cone(.03,.07,4),{p:[-.3,1.55,0],c:PAL.gold,ch:'s'});
  b.add(K.oct(.035),{p:[0,1.44,-.205],s:[1,1,.5],c:PAL.gold,ch:'s'});
  // --- tête : visage simple sous la capuche
  b.add(K.ico(.15,1),{p:[0,1.66,-.02],s:[.95,1.05,1],c:PAL.skin});
  b.sym(sd=>SH.eye(b,{p:[sd*.063,1.675,-.125],r:.055,rot:[0,PI-sd*.2,0]}));
  b.add(K.cone(.022,.05,4),{p:[0,1.62,-.178],r:[-PI/2,0,0],c:K.shade(PAL.skin,.86)});
  b.add(K.box(.06,.012,.02),{p:[0,1.575,-.147],c:K.shade(PAL.skin,.55),jit:0});
  b.add(K.ico(.19,1),{p:[0,1.69,.045],s:[1,1.02,1],c:P.dark,c2:TUN});
  b.add(K.cone(.1,.24,5),{p:[0,1.62,.2],r:[2.1,0,0],c:P.dark});
  // --- cape dans le dos, ourlet en pointes
  b.group({p:[0,1.47,.15],r:[-.1,0,0]},b=>{
    b.add(K.prism([[-.21,0],[.21,0],[.3,.85],[-.3,.85]],.03),{r:[PI/2,0,0],c:TUN,jit:.06});
    b.add(K.prism([[-.3,.85],[.3,.85],[.31,.95],[.2,1.06],[.1,.96],[0,1.08],[-.1,.96],[-.2,1.06],[-.31,.95]],.03),{r:[PI/2,0,0],c:P.dark,jit:.06});});
  // --- bâton en travers du dos, le motif de l'élément à son sommet
  b.group({p:[0,1.12,.27],r:[0,0,.38]},b=>{b.add(K.cyl(.018,.022,1.5,5),{c:PAL.woodD,c2:PAL.wood});
    b.add(K.cyl(.032,.026,.05,6),{p:[0,.74,0],c:PAL.bronze,ch:'s'});
    SH.motif(b,ctx.el,{p:[0,.765,0],r:[0,0,-.38],s:.36});});
  // --- bras (pièces animées) : manche de tunique, manche de cuir, bracelet de bronze, gant
  const bras2=(a,sd)=>{a.add(K.cyl(.06,.072,.27,6),{p:[sd*.3,1.3,0],c:P.dark,c2:TUN});
    a.add(K.cyl(.05,.057,.25,6),{p:[sd*.3,1.06,0],c:CUIR});
    a.add(K.cyl(.059,.059,.045,6),{p:[sd*.3,.96,0],c:PAL.bronze,ch:'s'});
    a.add(K.ico(.062,0),{p:[sd*.3,.88,-.01],s:[.8,1,1],c:GANT});};
  bras2(aL,-1);bras2(aR,1);
  // le pistolet à cristal dans la main droite
  aR.group({p:[.3,.9,-.04],r:[-.3,0,0]},b=>{b.add(K.box(.03,.085,.036),{p:[0,-.03,.012],r:[-.35,0,0],c:PAL.woodD});
    b.add(K.box(.04,.046,.075),{p:[0,.025,-.03],c:PAL.ironL,ch:'s'});
    b.add(K.cyl(.016,.019,.2,6),{p:[0,.03,-.165],r:[-PI/2,0,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
    b.add(K.cyl(.025,.022,.022,6),{p:[0,.03,-.262],r:[-PI/2,0,0],c:PAL.gold,ch:'s'});
    b.add(K.oct(.03),{p:[0,.052,-.04],s:[.8,.8,1.2],c:P.main,c2:P.glow,ch:'g',jit:.12});});
  return{parts:[{name:'body',b},{name:'armL',b:aL,parent:'body',pivot:[-.3,1.42,0],anim:[{k:'rot',axis:'x',amp:.35,sp:6}]},
      {name:'armR',b:aR,parent:'body',pivot:[.3,1.42,0],anim:[{k:'rot',axis:'x',amp:.35,sp:6,ph:PI}]}],
    bake:{ground:.2,groundH:.6,map:{s:'m'}},scale:1,labelY:2.15};};
}
