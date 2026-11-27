// NAVIRE — le vaisseau de guerre des envahisseurs, à l'ancre au large de chaque chemin (L'Île des Cinq). Les ennemis débarquent de son pont.
// Origine à la ligne de flottaison, au centre ; la proue regarde vers +Z (vers l'île). Longueur 24 m, mât à 18 m.
{
const {PAL,TAU}=K,PI=Math.PI;
const HP=[[0,1],[.5,.74],[.86,.36],[1,-.2],[.9,-.68],[.6,-.92],[-.6,-.92],[-.9,-.68],[-1,-.2],[-.86,.36],[-.5,.74]];
MODELS['set.navire']=ctx=>{const b=K.make(77),KL=0x17121c,WD=0x2c2132,W=0x4b3a4c,WL=0x7a6068,DK=0x6a5648,SA=0x4a1528,SB=0x1d1420,GL=0xb07bff,BR=0x8a6a3a;
  const P=k=>HP.map(q=>[q[0]*3.7*k,q[1]*12*(.9+.1*k)]),wAt=z=>3.7*(z>4?Math.max(.15,1-(z-4)/9):z<-8?.9-(-8-z)/9:1);
  // coque : carène sombre sous l'eau, bordé, lisse claire, pont
  b.add(K.prism(P(.55),1.5,{y0:-1.6}),{c:KL,c2:WD,jit:.06});b.add(K.prism(P(1),2.1,{y0:-.1}),{c:WD,c2:W,jit:.07});b.add(K.prism(P(1.05),.26,{y0:1.95}),{c:WL,c2:W,jit:.04});b.add(K.prism(P(.94),.07,{y0:2.2}),{c:DK,c2:0x54443a,jit:.05});
  for(const y of[.55,1.25])b.add(K.prism(P(1.02),.07,{y0:y}),{c:KL,jit:.03});                                           // préceintes
  // boucliers le long du bord, alternés
  for(let i=0;i<7;i++){const z=-8+i*2.6;for(const sd of[1,-1])b.add(K.cyl(.62,.62,.14,8),{p:[sd*(wAt(z)*1.02+.08),1.7,z],r:[0,0,PI/2],c:i%2?SA:SB,c2:i%2?0x6a2238:0x2c2230,jit:.03});
    for(const sd of[1,-1])b.add(K.oct(.16),{p:[sd*(wAt(z)*1.02+.2),1.7,z],c:BR,ch:'s'});}
  // proue : un cou dressé, une tête de bête aux yeux qui brillent, des cornes
  b.add(K.tube([[0,1.6,10.4],[0,3.6,12.5],[0,6.2,12.9],[0,8.1,11.8]],[.62,.5,.4,.34],6),{c:WD,c2:W,jit:.05});
  b.add(K.box(1.15,1,1.9,.55,.7),{p:[0,8.2,12.5],r:[.5,0,0],c:W,c2:WL,jit:.05});b.add(K.box(.7,.4,1.3,.6,.5),{p:[0,7.55,13.3],r:[.75,0,0],c:WD,jit:.04});
  for(const sd of[1,-1]){b.add(K.oct(.2),{p:[sd*.5,8.55,12.95],c:GL,ch:'g'});b.add(K.tube([[sd*.45,8.7,12],[sd*1.1,9.6,11.4],[sd*1.25,10.6,11.9]],[.2,.13,0],5),{c:0xd8cdb8,jit:.03});
    for(let k=0;k<3;k++)b.add(K.cone(.1,.4,4),{p:[sd*.28,7.3-k*.02,13.0+k*.32],r:[PI,0,0],c:0xe8dfcc});}
  // poupe : la queue qui remonte en volute
  b.add(K.tube([[0,1.6,-10.6],[0,3.8,-12.2],[0,6,-11.9],[0,6.6,-10.8],[0,5.9,-10.3]],[.55,.44,.34,.26,.14],6),{c:WD,c2:W,jit:.05});b.add(K.oct(.3),{p:[0,5.6,-10.5],c:GL,ch:'g'});
  // château arrière et barre
  b.add(K.box(5.2,1.1,4.2),{p:[0,2.8,-8.2],c:WD,c2:W,jit:.05});b.add(K.box(5.5,.14,4.5),{p:[0,3.42,-8.2],c:DK,jit:.04});for(const sd of[1,-1])b.add(K.box(.16,.9,4.3),{p:[sd*2.6,3.9,-8.2],c:WL,jit:.03});
  b.add(K.torus?K.torus(.55,.07,5,10):K.cyl(.55,.55,.08,10),{p:[0,4.3,-7],r:[0,0,0],c:BR,ch:'s'});
  // mât, vergues, grande voile déchirée à bandes, rune lumineuse
  b.add(K.cyl(.2,.36,16.5,8),{p:[0,2.2+8.25,-.8],c:WD,c2:W,jit:.03});b.add(K.cyl(.12,.12,10.4,6),{p:[0,16.6,-.8],r:[0,0,PI/2],c:WD});b.add(K.cyl(.1,.1,9.2,6),{p:[0,7,-.8],r:[0,0,PI/2],c:WD});
  for(let k=0;k<5;k++){const u=(k-2)/2,h=9.3-(k%2)*.5-(k===4?1.6:0);b.add(K.box(1.98,h,.1),{p:[u*3.96,16.5-h/2,-.8+.75-Math.abs(u)*.75],r:[0,-u*.32,0],c:k%2?SB:SA,c2:k%2?0x2a1e2c:0x6a1c36,jit:.03});}
  b.add(K.oct(1),{p:[0,12.2,.02],s:[1.5,2.1,.08],c:GL,c2:0xe6d4ff,ch:'g'});b.add(K.oct(1),{p:[0,12.2,.06],s:[.5,.8,.1],c:SB});
  b.add(K.cyl(.5,.62,.9,7),{p:[0,17.4,-.8],c:WD,c2:W});b.add(K.box(.08,1.5,2.4),{p:[0,19,-2.1],c:SA,c2:0x6a1c36,jit:.03});b.add(K.cyl(.05,.05,2.6,4),{p:[0,18.9,-.8],c:WD});
  // haubans
  for(const q of[[0,2.4,10.3],[0,3.4,-9.8],[3.5,2.3,-2.2],[-3.5,2.3,-2.2],[3.5,2.3,.8],[-3.5,2.3,.8]])b.add(K.tube([[0,17,-.8],q],.045,4),{c:KL});
  // lanternes violettes, tonneaux, planches de débarquement à la proue
  for(const q of[[2.4,3.1,6.5],[-2.4,3.1,6.5],[2.2,4.3,-6.4],[-2.2,4.3,-6.4]]){b.add(K.cyl(.05,.05,1,4),{p:[q[0],q[1]-.5,q[2]],c:KL});b.add(K.oct(.26),{p:q,c:GL,c2:0xe6d4ff,ch:'g'});}
  for(const q of[[1.9,2.65,2.8],[-2.1,2.65,3.6],[1.4,2.65,-4.4]])b.add(K.cyl(.48,.48,.86,8),{p:q,c:0x5a4636,c2:0x7a6048,jit:.04});
  for(const sd of[1,-1])b.add(K.box(1.3,.12,7),{p:[sd*2.1,.75,11.2],r:[.36,sd*.22,0],c:DK,c2:0x54443a,jit:.05});
  return b;};
}
