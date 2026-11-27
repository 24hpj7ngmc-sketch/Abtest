// V4.3 : repris tel quel de l'atelier du lobby (src/gfx/models/shared.js) ; sert à hero.avatar (gfx/models/mains.js), le corps des autres joueurs.
// SH : motifs et matériaux partagés par tous les modèles de L'Île des Cinq (cohérence visuelle).
// Chaque fonction AJOUTE des pièces au constructeur `b` (K.make()), à l'endroit demandé par o = {p:[x,y,z], r:[rx,ry,rz], s:taille}.
var SH=(()=>{
const {PAL,EL,TAU}=K;
const at=(b,o,fn)=>b.group({p:o.p||[0,0,0],r:o.r||[0,0,0],s:o.s===undefined?1:o.s},fn);
// ---- les cinq éléments : un motif reconnaissable par élément (≈ 0,6 m de haut à s = 1, posé sur son point bas)
const flame=(b,o={})=>at(b,o,b=>{const E=EL.feu;   // touffe de flammes : langues effilées, du rouge sombre au jaune
  [[0,0,0,1,0],[.16,0,.05,.68,.5],[-.15,0,-.04,.6,-.6],[.02,0,-.16,.5,1.4],[-.03,0,.17,.46,2.2]].forEach((q,i)=>{
    b.add(K.cone(.14,.62,5),{p:[q[0],.31*q[3],q[2]],r:[.12*Math.sin(q[4]),q[4],.16*Math.cos(q[4]*2)],s:[q[3],q[3],q[3]],c:i?E.main:E.dark,c2:E.glow,ch:'g',jit:0});});
  b.add(K.ico(.13,0),{p:[0,.08,0],c:E.dark,ch:'g',jit:.08});});
const drop=(b,o={})=>at(b,o,b=>{const E=EL.eau;    // goutte d'eau et bulles, brillantes
  b.add(K.lathe([[0,0],[.17,.1],[.21,.24],[.15,.4],[.05,.55],[0,.64]],7),{c:E.main,c2:E.glow,ch:'s',flat:false,jit:0});
  b.add(K.sph(.07,6,4),{p:[.2,.34,.06],c:E.light,ch:'s',flat:false,jit:0}).add(K.sph(.05,6,4),{p:[-.17,.2,-.1],c:E.glow,ch:'s',flat:false,jit:0}).add(K.sph(.035,5,3),{p:[.06,.56,.16],c:E.glow,ch:'s',flat:false,jit:0});});
const leaf=(b,o={})=>at(b,o,b=>{const E=EL.bois,L=[[0,-.5],[.16,-.18],[.13,.2],[0,.5],[-.13,.2],[-.16,-.18]]; // pousse : trois feuilles et un bourgeon
  b.add(K.cyl(.025,.04,.3,5),{p:[0,.15,0],c:PAL.barkD});
  [[0,.42,0,.25,0,.75],[.5,.3,.2,-.5,2.1,.62],[-.45,.28,-.15,-.55,4.2,.58]].forEach((q,i)=>b.group({p:[0,.26,0],r:[0,q[4],0]},b=>b.add(K.prism(L,.03),{p:[0,.24*q[5],.2*q[5]],r:[-1.05+q[0]*.2,0,0],s:[q[5],1,q[5]],c:i===1?E.main:i?E.light:E.glow})));
  b.add(K.ico(.06,0),{p:[0,.33,0],c:E.glow,ch:'g',jit:0});});
const crystal=(b,o={})=>at(b,o,b=>{const E=EL.terre; // éclats de roche et gemme d'ambre
  [[0,0,0,1,0,0],[.17,0,.04,.62,.35,-.5],[-.16,0,.06,.55,-.3,.55],[.02,0,-.17,.48,-.5,-.1]].forEach((q,i)=>b.group({p:[q[0],0,q[2]],r:[q[4],i*1.3,q[5]]},b=>{
    b.add(K.cyl(.1*q[3],.13*q[3],.34*q[3],5),{p:[0,.17*q[3],0],c:i%2?PAL.stoneD:PAL.dirt,c2:E.main});b.add(K.cone(.1*q[3],.22*q[3],5),{p:[0,.45*q[3],0],c:E.main,c2:E.light});}));
  b.add(K.oct(.09),{p:[.08,.2,.14],s:[1,1.5,1],c:0xffb347,ch:'s',jit:0});});
const bolt=(b,o={})=>at(b,o,b=>{const E=EL.elec;     // éclair en zigzag et sa bobine
  const Z=[[-.02,0],[.16,.26],[.05,.27],[.2,.62],[-.1,.3],[.03,.29],[-.14,0]];
  b.add(K.prism(Z,.07),{p:[0,.07,.035],r:[-Math.PI/2,0,0],c:E.main,c2:E.glow,ch:'g',jit:0});
  b.add(K.torus(.1,.03,5,8),{p:[0,.05,0],r:[Math.PI/2,0,0],c:PAL.bronze,ch:'s'}).add(K.cyl(.05,.07,.1,6),{p:[0,.05,0],c:PAL.iron});});
const gust=(b,o={})=>at(b,o,b=>{const E=EL.vent;     // rafale : trois anneaux qui montent en se resserrant, et une pointe (V12.1, Zéphyr)
  [[.15,.1,-.3],[.11,.28,.25],[.07,.44,-.2]].forEach((q,i)=>b.add(K.torus(q[0],.024,5,10),{p:[0,q[1],0],r:[Math.PI/2+q[2],0,0],c:i===1?E.main:E.light,c2:E.glow,ch:'g',jit:0}));
  b.add(K.cone(.05,.16,5),{p:[0,.6,0],c:E.glow,ch:'g',jit:0});});
const MOTIF={feu:flame,eau:drop,bois:leaf,terre:crystal,elec:bolt,vent:gust};
const motif=(b,el,o)=>(MOTIF[el]||flame)(b,o);
// ---- visage : un œil = blanc bombé + pupille, tous deux « lumineux » (canal g) pour rester lisibles à contre-jour. o.r : rayon, o.rot : orientation, o.iris : couleur de la pupille (défaut noir), o.glow : œil d'une seule couleur
const eye=(b,o={})=>{const r=o.r||.15;at(b,{p:o.p,r:o.rot},b=>{if(o.glow!==undefined){b.add(K.sph(r,7,5),{c:o.glow,ch:'g',flat:false,jit:0});return;}
  b.add(K.sph(r,7,5),{c:0xf6f3ea,ch:'g',flat:false,jit:0}).add(K.sph(r*.5,6,4),{p:[0,0,r*.8],s:[1,1,.5],c:o.iris===undefined?0x14181c:o.iris,ch:'g',flat:false,jit:0});});};
// ---- pierre taillée : anneau de blocs décalés d'un rang sur l'autre (tours rondes, margelles). o : {r, h, rows, n, y, c, taper (rayon du haut / rayon du bas)}
const bricks=(b,o)=>{const rows=o.rows||3,n=o.n||10,h=o.h||1.5,rh=h/rows,y0=o.y||0,tp=o.taper===undefined?1:o.taper,cols=o.c?[o.c]:[PAL.stone,PAL.stoneL,PAL.stoneD,PAL.stone];
  for(let k=0;k<rows;k++){const r=o.r*(1+(tp-1)*(k+.5)/rows),w=TAU*r/n*.96,d=o.d||.42;for(let i=0;i<n;i++){const a=(i+(k%2)*.5)/n*TAU,j=b.rnd();
      b.add(K.box(w,rh*.94,d,1,.9),{p:[Math.sin(a)*(r-d/2),y0+(k+.5)*rh,Math.cos(a)*(r-d/2)],r:[0,a,0],c:K.shade(cols[Math.floor(j*cols.length)%cols.length],.92+j*.16),jit:.03});}}};
// mur droit de blocs. o : {w, h, d, rows, cols, c}  — centré en x, posé sur y = 0
const blockWall=(b,o)=>at(b,o,b=>{const rows=o.rows||3,cols=o.cols||4,rh=o.h/rows,cw=o.w/cols,pal=o.c?[o.c]:[PAL.stone,PAL.stoneL,PAL.stoneD];
  for(let k=0;k<rows;k++){const off=k%2?cw/2:0;for(let i=-1;i<cols;i++){let x0=-o.w/2+i*cw+off,x1=x0+cw;x0=Math.max(x0,-o.w/2);x1=Math.min(x1,o.w/2);if(x1-x0<.05)continue;const j=b.rnd();
      b.add(K.box((x1-x0)*.97,rh*.95,o.d*(.94+j*.08)),{p:[(x0+x1)/2,(k+.5)*rh,0],c:K.shade(pal[Math.floor(j*pal.length)%pal.length],.92+j*.16),jit:.03});}}});
// planches côte à côte. o : {w, h, d, n, c, vertical}
const planks=(b,o)=>at(b,o,b=>{const n=o.n||4;for(let i=0;i<n;i++){const j=b.rnd(),c=K.shade(o.c||PAL.wood,.88+j*.24);
    if(o.vertical)b.add(K.box(o.w/n*.93,o.h,o.d),{p:[-o.w/2+(i+.5)*o.w/n,0,0],c,jit:.03});else b.add(K.box(o.w,o.h/n*.93,o.d),{p:[0,-o.h/2+(i+.5)*o.h/n,0],c,jit:.03});}});
// bannière : hampe + tissu à pointe. o : {h (hauteur de la hampe), w, l (longueur du tissu), c}
const banner=(b,o={})=>at(b,o,b=>{const h=o.h||2,w=o.w||.55,l=o.l||.9,c=o.c||PAL.cloth;
  b.add(K.cyl(.035,.045,h,5),{p:[0,h/2,0],c:PAL.woodD}).add(K.oct(.07),{p:[0,h+.05,0],c:PAL.gold,ch:'s'});
  b.add(K.prism([[0,0],[w,0],[w,l*.8],[w/2,l],[0,l*.8]],.03),{p:[.03,h-.08,-.015],r:[Math.PI/2,0,0],c,c2:K.shade(c,.72)});
  b.add(K.box(w*.9,.05,.035),{p:[.03+w/2,h-.3,-.025],c:PAL.gold,ch:'s'});});
// gemme taillée (brillante). o.c : couleur
const gem=(b,o={})=>at(b,o,b=>b.add(K.oct(.5),{s:[1,1.45,1],c:o.c===undefined?PAL.crystal:o.c,c2:0xffffff,ch:'s',jit:.1}));
return{at,flame,drop,leaf,crystal,bolt,motif,eye,bricks,blockWall,planks,banner,gem};
})();
