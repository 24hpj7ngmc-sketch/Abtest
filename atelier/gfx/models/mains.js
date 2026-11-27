// MAINS — les trois objets tenus par le joueur (vus à la première personne) et l'avatar des coéquipiers.
// Repère des objets tenus : celui de la caméra (−Z devant, +X à droite, +Y en haut), origine = la poignée, au creux de la main.
{
const {PAL}=K,PI=Math.PI;
// --- cuirs du gardien (tirés de la palette)
const GANT=K.mix(PAL.dirt,PAL.sand,.36),GANT_D=K.shade(PAL.dirt,.86),CUIR=K.mix(PAL.bark,PAL.wood,.5),CUIR_D=PAL.barkD;
                                  // fente sous les lacets

// ---------------------------------------------------------------- hero.avatar : le gardien vu par ses coéquipiers (≈ 1,8 m, regarde vers −Z)
MODELS['hero.avatar']=ctx=>{const P=ctx.P||K.EL.feu,b=K.make(71),aL=K.make(72),aR=K.make(73),TUN=P.main;
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
