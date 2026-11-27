// MONDE — monuments, vestiges et mobilier de L'Île des Cinq : sanctuaire du cœur, portail, étal et marchand, ruines, ponton, barque…
// Tout est en pierre claire patinée, bronze, bois chaud ; les runes et les cristaux sont lumineux (canal g) ou brillants (canal s).
{
const {PAL,EL,TAU}=K,PI=Math.PI,ELS=['feu','eau','bois','terre','elec'];
const SOL={ground:.18,groundH:.8};                                             // ombre de contact de tout ce qui est posé au sol
// objet fixe : on renvoie le constructeur ; sa cuisson applique l'ombre de contact par défaut
const fixe=b=>{const cuire=b.bake;b.bake=o=>cuire(Object.assign({},SOL,o));return b;};
// teintes de pierre : calcaire chaud (la pierre grise seule est trop froide à l'ombre)
const CALC=K.mix(PAL.stoneL,PAL.sand,.36),CALCD=K.mix(PAL.stone,PAL.sand,.24),PIERRES=[PAL.stone,PAL.stoneL,CALC,CALCD];
const lueur=el=>el==='terre'?K.mix(EL.terre.main,EL.terre.glow,.35):EL[el].main;   // couleur des runes d'un élément (l'ocre pur est trop terne)

// ---- gravures : un trait = un quad plat du plan XY local, visible côté +Z (2 triangles)
const trait=(b,x0,y0,x1,y1,w,o)=>{const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,ex=dx/l*w*.4,ey=dy/l*w*.4,nx=-dy/l*w/2,ny=dx/l*w/2;x0-=ex;y0-=ey;x1+=ex;y1+=ey;
  b.add(K.face([[x0-nx,y0-ny,0],[x1-nx,y1-ny,0],[x1+nx,y1+ny,0],[x0+nx,y0+ny,0]]),o);};
// runes de l'île : chaque glyphe = quelques lignes brisées dans un carré de côté 1
const GLY=[[[[0,-.5],[0,.5],[.34,.2]],[[0,.08],[.34,-.22]]],[[[-.28,-.5],[-.28,.5],[.28,.12],[.28,-.5]]],[[[-.2,-.5],[-.2,.5]],[[-.2,.32],[.26,0],[-.2,-.32]]],
  [[[.26,.5],[-.26,0],[.26,-.5]]],[[[-.3,-.5],[.3,.5]],[[-.3,.5],[.3,-.5]]],[[[0,-.5],[0,.5]],[[-.3,.5],[0,.1],[.3,.5]]],
  [[[0,.5],[.3,.15],[0,-.2],[-.3,.15],[0,.5]],[[-.3,-.5],[0,-.2],[.3,-.5]]],[[[0,-.5],[0,.5]],[[-.3,.18],[0,.5],[.3,.18]]],[[[-.28,-.5],[-.28,.5],[.28,-.5],[.28,.5]]],
  [[[-.3,-.5],[-.3,.5],[0,.12],[.3,.5],[.3,-.5]]],[[[0,.5],[.3,0],[0,-.5],[-.3,0],[0,.5]]],[[[-.3,.12],[0,.5],[.3,.12]],[[-.3,-.42],[0,-.04],[.3,-.42]]],
  [[[-.28,-.5],[-.28,.5]],[[.28,-.5],[.28,.5]],[[-.28,.25],[.28,-.25]]],[[[0,-.5],[0,.5]],[[-.3,-.1],[0,-.5],[.3,-.1]],[[-.22,.3],[.22,.3]]]];
// sceaux des cinq éléments (flamme, goutte, arbre, roche, éclair)
const SCEAU={feu:[[[-.4,-.45],[0,.5],[.4,-.45],[-.4,-.45]],[[-.16,-.45],[0,-.02],[.16,-.45]]],eau:[[[0,.5],[.34,-.08],[0,-.5],[-.34,-.08],[0,.5]],[[-.14,-.12],[0,-.28],[.14,-.12]]],
  bois:[[[0,-.5],[0,.5]],[[-.32,.42],[0,.1],[.32,.42]],[[-.32,.02],[0,-.28],[.32,.02]]],terre:[[[0,.5],[.4,0],[0,-.5],[-.4,0],[0,.5]],[[-.4,0],[.4,0]],[[-.2,-.25],[.2,-.25]]],
  elec:[[[.2,.5],[-.24,.04],[.2,.04],[-.2,-.5]],[[-.36,.38],[-.2,.5]],[[.36,-.38],[.2,-.5]]]};
const glyphe=(b,g,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{for(const L of(typeof g==='number'?GLY[g%GLY.length]:g))for(let k=0;k<L.length-1;k++)trait(b,L[k][0],L[k][1],L[k+1][0],L[k+1][1],o.w||.12,{c:o.c,ch:o.ch||'g',jit:0});});
// polygone plat posé à la hauteur y, visible du dessus (dalles, incrustations) ; pts = [[x,z],…] dans un sens quelconque
const plat=(b,pts,y,o)=>{let s=0;const n=pts.length;for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];s+=p[1]*q[0]-p[0]*q[1];}const P=s>0?pts:pts.slice().reverse();b.add(K.face(P.map(p=>[p[0],y,p[1]])),o);};
// repère « au sol » tourné de l'angle a : x = tangent, y = vers l'extérieur, normale vers le haut → pour trait() et glyphe()
const ausol=(b,a,y,fn)=>b.group({p:[0,y,0],r:[0,a,0]},b=>b.group({r:[-PI/2,0,PI]},fn));
// ---- gemme taillée : anneaux de n sommets, décalés d'un demi-pas quand le 3e nombre vaut 1 → facettes triangulaires. prof = [[rayon, y, décalage],…] de bas en haut (rayon 0 = pointe)
// sel(rang, i, t) : ne garde que certaines facettes (pour en passer quelques-unes en lumineux)
const taille=(prof,n,sel)=>{const v=[],P=(q,i)=>{const a=(i+(q[2]?.5:0))/n*TAU;return[q[0]*Math.sin(a),q[1],q[0]*Math.cos(a)];},T=(k,i,t,a,b,c)=>{if(!sel||sel(k,i,t))v.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);};
  for(let k=0;k<prof.length-1;k++){const A=prof[k],B=prof[k+1];for(let i=0;i<n;i++){
      if(A[0]<1e-6)T(k,i,0,P(B,i),P(A,0),P(B,i+1));else if(B[0]<1e-6)T(k,i,0,P(A,i),P(A,i+1),P(B,0));
      else if(!A[2]===!B[2]){T(k,i,0,P(B,i),P(A,i),P(B,i+1));T(k,i,1,P(A,i),P(A,i+1),P(B,i+1));}
      else if(B[2]){T(k,i,0,P(A,i),P(A,i+1),P(B,i));T(k,i,1,P(B,i),P(A,i+1),P(B,i+1));}
      else{T(k,i,0,P(A,i),P(A,i+1),P(B,i+1));T(k,i,1,P(B,i),P(A,i),P(B,i+1));}}}
  return{v,n:null};};
// cristal brut : prisme à n pans terminé en pointe (h : hauteur, r : rayon), posé sur son pied
const cristal=(h,r,n=5)=>taille([[r*.55,0,0],[r,h*.16,0],[r*.82,h*.7,1],[0,h,0]],n);
// ---- pierre : couronne de blocs taillés en coin (trapèzes jointifs vus de dessus, sans chevauchement), entre les rayons r0 et r1
const couronne=(b,o)=>{const n=o.n,a0=o.a0||0,g=o.gap===undefined?.012:o.gap,cs=o.c||PIERRES,pt=(r,a)=>[r*Math.sin(a),r*Math.cos(a)];
  for(let i=0;i<n;i++){const a=a0+(i+g)/n*TAU,e=a0+(i+1-g)/n*TAU,j=b.rnd(),dh=(o.dh||0)*(b.rnd()-.5);
    b.add(K.prism([pt(o.r1,a),pt(o.r1,e),pt(o.r0,e),pt(o.r0,a)],o.h+dh,{y0:o.y,taper:o.taper===undefined?.97:o.taper}),{c:K.shade(cs[Math.floor(j*cs.length)%cs.length],.93+j*.14),jit:.03});}};
// touffe de mousse : galet aplati
const mousse=(b,p,s,g)=>b.add(K.rock(1,g||3,0,.3),{p,s:[s,s*.28,s*.8],r:[0,(g||3)*1.7,0],c:PAL.moss,c2:K.mix(PAL.moss,PAL.leafL,.5),jit:.08});

// =====================================================================================================================
// LE SANCTUAIRE DU CŒUR — estrade à gradins, cercle de runes, cinq piliers élémentaires, le grand cristal et ses éclats
// =====================================================================================================================
// un pilier (repère local : pied du pilier, +z vers l'extérieur de l'estrade)
const pilier=(b,el)=>{const E=EL[el],G=lueur(el),a=.31,c=.075,OCT=[[a-c,a],[a,a-c],[a,c-a],[a-c,-a],[c-a,-a],[-a,c-a],[-a,a-c],[c-a,a]],ti=Math.atan(a*.2/1.64);
  b.add(K.box(1,.2,1,.93,.93),{p:[0,.1,0],c:PAL.stoneD});b.add(K.box(.84,.16,.84,.9,.9),{p:[0,.28,0],c:PAL.stone});                  // socle à deux assises
  b.add(K.prism(OCT,1.64,{y0:.36,taper:.8}),{c:CALCD,c2:CALC,jit:.04});                                                             // fût monolithe à pans coupés
  b.add(K.box(.68,.07,.68),{p:[0,.47,0],c:PAL.bronze,ch:'s'}).add(K.box(.56,.07,.56),{p:[0,1.88,0],c:PAL.bronzeL,ch:'s'});           // frettes de bronze
  b.add(K.box(.52,.2,.52,1.5,1.5),{p:[0,2.1,0],c:PAL.stone}).add(K.box(.86,.1,.86,.95,.95),{p:[0,2.25,0],c:PAL.stoneL});            // chapiteau évasé et tailloir
  // face extérieure : cartouche sombre et trois runes ; face intérieure : conduit lumineux qui descend du cristal vers le cœur
  b.group({p:[0,1.18,a*.9+.012],r:[-ti,0,0]},b=>{trait(b,0,-.62,0,.62,.27,{c:PAL.stoneDD,jit:0});for(let k=0;k<3;k++)glyphe(b,k*5+ELS.indexOf(el)*3,{p:[0,.4-k*.4,.012],s:.24,c:G,w:.15});});
  b.group({p:[0,1.18,-a*.9-.012],r:[ti,PI,0]},b=>{trait(b,0,-.66,0,.62,.2,{c:PAL.stoneDD,jit:0});b.group({p:[0,0,.012]},b=>{trait(b,0,-.66,0,.62,.05,{c:G,c2:E.glow,ch:'g',jit:0});
      glyphe(b,10,{p:[0,.3,0],s:.17,c:E.glow,w:.2});glyphe(b,10,{p:[0,-.25,0],s:.17,c:E.glow,w:.2});});});
  for(const sd of[1,-1])b.group({p:[sd*(a*.9+.012),1.18,0],r:[0,sd*PI/2,sd*ti]},b=>{trait(b,0,-.5,0,.5,.045,{c:PAL.stoneDD,jit:0});glyphe(b,ELS.indexOf(el)*2+(sd>0?7:2),{p:[0,.05,.004],s:.2,c:PAL.stoneDD,ch:'m',w:.16});});   // flancs : rainure et rune gravée
  // couronne de bronze, cristal de l'élément et son motif au sommet
  for(let k=0;k<4;k++)b.group({r:[0,PI/4+k*PI/2,0]},b=>b.add(K.box(.1,.36,.07,.35,.5),{p:[0,2.45,.33],r:[-.55,0,0],c:PAL.bronze,c2:PAL.bronzeL,ch:'s'}));
  b.add(taille([[0,0,0],[.2,.13,0],[.27,.3,1],[.21,.52,0],[.11,.7,1],[0,.84,0]],6),{p:[0,2.27,0],c:E.main,c2:E.glow,ch:'s',jit:.1});
  SH.motif(b,el,{p:[0,2.97,0],s:.72});};
// un brasero de bronze sur son pied de pierre
const brasero=b=>{b.add(K.lathe([[.27,0],[.2,.13]],6,{capT:true}),{c:PAL.stoneD});b.add(K.cyl(.045,.07,.62,5,{open:true}),{p:[0,.44,0],c:PAL.iron,ch:'s'});
  b.add(K.lathe([[.05,.7],[.25,.77],[.37,.92],[.35,.98],[.29,.92],[0,.88]],7),{c:PAL.bronze,c2:PAL.bronzeL,ch:'s'});
  b.add(K.ico(.2,0),{p:[0,.9,0],s:[1.2,.45,1.2],c:EL.feu.dark,c2:PAL.lava,ch:'g',jit:.1});SH.flame(b,{p:[0,.93,0],s:.62});};
MODELS['set.coeur']=ctx=>{const b=K.make(51),cr=K.make(52),sh=K.make(53),H=1.4,h=H/3,RP=3.5,pillars=[];
  // --- estrade : trois gradins de blocs taillés (un noyau sombre bouche les joints)
  [[4.7,30,0],[4.36,25,.5],[4.02,20,-.5]].forEach((q,k)=>{b.add(K.lathe([[q[0]-.07,k*h],[q[0]-.07,(k+1)*h-.02]],q[1],{a0:q[2]*TAU/q[1]}),{c:PAL.stoneDD,jit:0});
    couronne(b,{r0:q[0]-.62,r1:q[0],y:k*h,h,n:q[1],a0:q[2]*TAU/q[1],c:k===2?[CALC,PAL.stoneL,CALCD]:[PAL.stoneL,CALC,CALCD,PAL.stone]});});
  // --- sol de l'estrade : dalles rayonnantes, anneau sombre des runes, médaillon central
  b.add(K.lathe([[3.5,H-.04],[0,H-.04]],20),{c:PAL.stoneDD,jit:0});
  couronne(b,{r0:2.74,r1:3.42,y:H-.13,h:.13,n:20,dh:.014,taper:.975,c:[CALC,PAL.stoneL,CALCD]});
  couronne(b,{r0:2.04,r1:2.74,y:H-.13,h:.134,n:20,taper:.98,c:[PAL.stoneD,K.shade(PAL.stoneD,1.1)]});
  couronne(b,{r0:1.22,r1:2.04,y:H-.13,h:.13,n:10,dh:.014,taper:.975,c:[CALC,PAL.stoneL]});
  b.add(K.lathe([[1.22,H-.13],[1.22,H+.008],[0,H+.008]],10),{c:PAL.stoneD,jit:.02});
  // --- gravures lumineuses : deux cercles, vingt runes, l'étoile à cinq branches, et un canal par élément du pilier vers le centre
  b.add(K.lathe([[2.7,H+.02],[2.64,H+.02]],40),{c:PAL.rune,ch:'g',jit:0}).add(K.lathe([[2.14,H+.02],[2.08,H+.02]],40),{c:PAL.rune,ch:'g',jit:0}).add(K.lathe([[1.14,H+.024],[1.08,H+.024]],30),{c:PAL.rune,ch:'g',jit:0});
  for(let i=0;i<20;i++)ausol(b,(i+.5)/20*TAU,H+.02,b=>glyphe(b,i*3+1,{p:[0,2.39,0],r:[0,0,PI],s:.36,c:PAL.rune,w:.13}));
  for(let i=0;i<5;i++){const a=i*TAU/5,e=(i+2)*TAU/5;plat(b,[[1.08*Math.sin(a)-.03*Math.cos(a),1.08*Math.cos(a)+.03*Math.sin(a)],[1.08*Math.sin(a)+.03*Math.cos(a),1.08*Math.cos(a)-.03*Math.sin(a)],
      [1.08*Math.sin(e)+.03*Math.cos(e),1.08*Math.cos(e)-.03*Math.sin(e)],[1.08*Math.sin(e)-.03*Math.cos(e),1.08*Math.cos(e)+.03*Math.sin(e)]],H+.024,{c:PAL.rune,ch:'g',jit:0});}
  ELS.forEach((el,i)=>ausol(b,i*TAU/5,H+.022,b=>{trait(b,0,1.16,0,2.06,.07,{c:PAL.rune,c2:lueur(el),ch:'g',jit:0});trait(b,0,2.16,0,2.62,.07,{c:lueur(el),ch:'g',jit:0});trait(b,0,2.72,0,3.0,.09,{c:lueur(el),ch:'g',jit:0});}));
  // --- cinq piliers en pentagone (feu, eau, bois, terre, élec), chacun sur son contrefort qui coupe les gradins et porte le sceau de l'élément
  ELS.forEach((el,i)=>{const a=i*TAU/5;pillars.push({el,x:+(RP*Math.sin(a)).toFixed(3),z:+(RP*Math.cos(a)).toFixed(3)});
    b.group({r:[0,a,0]},b=>{SH.blockWall(b,{p:[0,0,3.8],r:[0,PI/2,0],w:1.6,h:1.52,d:1.16,rows:3,cols:3});b.add(K.box(1.26,.1,1.7,.96,.97),{p:[0,1.57,3.8],c:PAL.stoneL});
      b.add(K.box(.8,1.06,.1,.9,.8),{p:[0,.8,4.61],c:CALC,jit:.03});glyphe(b,SCEAU[el],{p:[0,.82,4.672],s:.56,c:lueur(el),w:.13});
      b.group({p:[0,1.62,RP]},b=>pilier(b,el));});
    // --- un brasero entre deux piliers, et des runes sur la contremarche du haut
    b.group({r:[0,a+TAU/10,0]},b=>{b.group({p:[0,H,3.72]},brasero);});
    for(const q of[-1,1])b.group({r:[0,a+TAU/10+q*TAU/20,0]},b=>glyphe(b,i*2+q+4,{p:[0,2.5*h,3.986],s:.27,c:PAL.rune,w:.14}));});
  // --- mousse et herbes sur les marches
  [[.5,4.36,h],[1.9,4.12,2*h],[2.6,4.36,h],[3.5,4.12,2*h],[4.5,4.36,h],[5.6,4.12,2*h],[5.9,4.36,h]].forEach((q,i)=>mousse(b,[q[1]*Math.sin(q[0]),q[2],q[1]*Math.cos(q[0])],.17+.04*(i%3),i+2));
  // --- jeunes cristaux qui percent entre les dalles
  [[.95,4.4,h,.46],[2.25,4.1,2*h,.36],[3.95,4.4,h,.42],[5.2,4.1,2*h,.34]].forEach((q,i)=>b.group({p:[q[1]*Math.sin(q[0]),q[2]-.03,q[1]*Math.cos(q[0])],r:[0,i*1.9,0]},b=>{
    b.add(cristal(q[3],q[3]*.24),{r:[.12,0,-.1],c:PAL.crystalD,c2:PAL.crystal,ch:'s',jit:.1}).add(cristal(q[3]*.6,q[3]*.17),{p:[.1,0,.04],r:[.3,0,-.55],c:PAL.crystalD,c2:PAL.crystal,ch:'s',jit:.1}).add(cristal(q[3]*.45,q[3]*.14),{p:[-.08,0,.06],r:[.45,0,.5],c:PAL.crystalD,c2:PAL.rune,ch:'s',jit:.1});}));
  // --- le grand cristal : gemme taillée à ceinture, noyau lumineux, éclats soudés (c'est le jeu qui le fait tourner et flotter)
  cr.group({p:[0,4,0]},cr=>{const G8=[[0,-1.82,0],[.3,-1.3,0],[.58,-.62,1],[.84,.08,0],[.84,.3,0],[.66,.82,1],[.42,1.3,0],[.18,1.62,1],[0,1.8,0]],
      W=(k,i,t)=>(k===2&&t===1&&i%2===0)||(k===4&&t===0&&i%2===1)||(k===6&&t===1&&i%4===1);        // facettes « fenêtres » : le noyau lumineux y affleure
    cr.add(taille(G8,8,(k,i,t)=>k<3&&!W(k,i,t)),{c:PAL.crystalD,c2:PAL.crystal,ch:'s',jit:.12});          // culasse
    cr.add(taille(G8,8,(k,i,t)=>k>3&&!W(k,i,t)),{c:PAL.crystal,c2:0xeaffff,ch:'s',jit:.12});              // couronne
    cr.add(taille(G8,8,W),{c:PAL.rune,c2:0xffffff,ch:'g',jit:.04});
    cr.add(K.lathe([[.84,.08],[.74,.08]],8),{c:PAL.crystalD,ch:'s'}).add(K.lathe([[.74,.3],[.84,.3]],8),{c:PAL.crystalD,ch:'s'});   // ceinture en creux : lèvres + noyau
    cr.add(taille([[.78,.08,0],[.78,.3,0]],8),{c:PAL.rune,c2:0xffffff,ch:'g',jit:.04});
    [[.4,.2,.5,.52,1.25,.2],[2.5,.05,.46,.66,1,.17],[4.4,.25,.48,.42,1.45,.22],[1.4,.1,.5,2.6,1.1,.18],[3.5,0,.48,2.75,.9,.15],[5.5,.05,.44,2.5,1.3,.2],[3.3,.5,.4,.3,.8,.12],[.2,-.5,.4,2.9,.7,.11]].forEach(q=>
      cr.group({r:[0,q[0],0]},cr=>cr.add(cristal(q[4],q[5],6),{p:[0,q[1],q[2]],r:[q[3],0,0],c:q[3]>1.5?PAL.crystal:PAL.crystalD,c2:q[3]>1.5?PAL.crystalD:0xd8fbff,ch:'s',jit:.12})));});
  // --- les éclats en orbite
  [[0,3.2,.62],[1.1,4.7,.5],[2.2,3.75,.74],[3.2,4.95,.46],[4.2,3.35,.58],[5.3,4.4,.66]].forEach((q,i)=>sh.group({p:[2.3*Math.sin(q[0]),q[1],2.3*Math.cos(q[0])],r:[.5*Math.sin(i*2.1),q[0],.45*Math.cos(i*1.3)]},sh=>{
    sh.add(taille([[0,-q[2]/2,0],[q[2]*.2,-q[2]*.1,0],[q[2]*.16,q[2]*.18,1],[0,q[2]/2,0]],5),{c:PAL.crystalD,c2:0xd8fbff,ch:'s',jit:.12});}));
  return{parts:[{name:'base',b},{name:'crystal',b:cr,parent:'base',pivot:[0,4,0]},{name:'shards',b:sh,parent:'base',pivot:[0,4,0],anim:[{k:'rot',axis:'y',spin:true,sp:.5}]}],
    bake:SOL,pillars,topY:5.15};};

// =====================================================================================================================
// LE PORTAIL — arche en fer à cheval d'où sortent les ennemis (ouverture ronde libre : rayon ≥ 3,4 m autour de (0, 3.2, 0))
// =====================================================================================================================
// bloc vu de face : polygone [[x,y],…] extrudé en z. bloc2 : centré, chanfreiné vers l'avant et l'arrière ; bloc1 : de z0 vers l'avant, chanfreiné à l'avant
const bloc2=(b,poly,d,tp,o)=>{b.add(K.prism(poly.map(p=>[p[0],-p[1]]),d/2,{taper:tp}),Object.assign({r:[PI/2,0,0]},o));b.add(K.prism(poly,d/2,{taper:tp}),Object.assign({r:[-PI/2,0,0]},o));};
const bloc1=(b,poly,z0,d,tp,o)=>b.add(K.prism(poly.map(p=>[p[0],-p[1]]),d,{y0:z0,taper:tp}),Object.assign({r:[PI/2,0,0]},o));
// amas de cristaux bruts
const amas=(b,p,s,c,c2,ry)=>b.group({p,r:[0,ry||0,0],s},b=>{[[0,0,1,0,0],[.2,.05,.62,.5,-.35],[-.18,.08,.55,.35,.5],[.04,-.2,.5,-.6,.1],[-.1,.2,.4,.7,.3]].forEach((q,i)=>b.add(cristal(q[2],q[2]*.2),{p:[q[0],0,q[1]],r:[q[3],i*1.3,q[4]],c,c2,ch:'s',jit:.12}));});
// lierre : une tige le long d'un chemin et des feuilles plates tournées vers l'avant (+z)
const lierre=(b,pts,o={})=>{const P=K.curve(pts,o.n||10),r=o.r||.035,L=[[0,0,0],[.09,.08,0],[0,.22,0],[-.09,.08,0]];b.add(K.tube(P,P.map((p,i)=>r*(1-.8*i/(P.length-1))),4),{c:PAL.barkD,c2:PAL.leafD});
  P.forEach(p=>{for(let k=0;k<(o.k||2);k++){const s=(o.s||1)*(.7+b.rnd()*.7);b.add(K.face(L,{dbl:true}),{p:[p[0]+(b.rnd()-.5)*.24,p[1]+(b.rnd()-.5)*.24,p[2]+.03+b.rnd()*.05],r:[(b.rnd()-.5)*.9,(b.rnd()-.5)*.9,b.rnd()*TAU],s,c:[PAL.leaf,PAL.leafL,PAL.leafD,PAL.moss][Math.floor(b.rnd()*4)],jit:.06});}});};
MODELS['set.portail']=ctx=>{const b=K.make(61),fl=K.make(62),CY=3.2,RI=3.45,RO=4.35,D=1.4,N=15,A=118*PI/180,da=2*A/N,V=PAL.portal,VD=K.mix(PAL.portalD,PAL.portal,.45),VL=K.mix(PAL.portal,0xffffff,.45),
    pt=(r,a)=>[r*Math.sin(a),CY+r*Math.cos(a)],RS=3.47,xi=y=>Math.sqrt(RS*RS-(CY-y)*(CY-y));
  // --- voussoirs : quatorze claveaux taillés en coin, une rune violette sur chaque face, un liseré lumineux au bord de l'ouverture
  for(let i=0;i<N;i++){if(i===7)continue;const a0=-A+i*da,a1=a0+da,am=a0+da/2,j=b.rnd(),m=pt(3.92,am);
    bloc2(b,[pt(RI,a0),pt(RI,a1),pt(RO,a1),pt(RO,a0)],D+(i%2)*.1,.93,{c:K.shade(i%2?CALC:PAL.stoneL,.9+j*.16),jit:.04});
    glyphe(b,i*5+2,{p:[m[0],m[1],D/2+(i%2)*.05+.014],r:[0,0,-am],s:.46,c:V,w:.13});glyphe(b,i*3+1,{p:[m[0],m[1],-D/2-(i%2)*.05-.014],r:[0,PI,am],s:.46,c:V,w:.13});
    for(const sd of[1,-1])b.group({p:[0,CY,sd*(D/2+(i%2)*.05+.014)],r:[0,sd>0?0:PI,sd>0?-am:am]},b=>trait(b,-.33,RI+.1,.33,RI+.1,.05,{c:VL,ch:'g',jit:0}));}
  // --- clef de voûte sculptée : masque cornu aux yeux violets, gemme au front
  bloc2(b,[pt(RI,-da/2),pt(RI,da/2),pt(4.8,da/2),[0,8.2],pt(4.8,-da/2)],1.8,.9,{c:PAL.stone,jit:.04});
  b.add(K.box(1.02,.2,.3,.92,.6),{p:[0,7.74,.93],r:[.3,0,0],c:PAL.stoneD}).add(K.box(.2,.48,.26,.5,.5),{p:[0,7.38,.93],c:PAL.stoneL});                        // arcade et nez
  b.sym(sd=>{b.add(K.oct(1),{p:[sd*.25,7.55,.9],r:[0,0,sd*.38],s:[.17,.085,.07],c:VL,ch:'g',jit:0});b.add(K.box(.3,.36,.16,.7,.7),{p:[sd*.33,7.2,.88],r:[0,0,sd*.22],c:PAL.stoneD});
    b.add(K.tube(K.curve([[sd*.42,7.86,.5],[sd*.95,8,.56],[sd*1.24,8.3,.5],[sd*1.18,8.58,.44]],5),[.17,.15,.12,.09,.05,0],5),{c:PAL.boneD,c2:PAL.bone});});       // cornes
  b.add(taille([[0,-.2,0],[.13,-.04,0],[.13,.06,1],[0,.24,0]],6),{p:[0,7.97,.92],r:[.2,0,0],c:V,c2:VL,ch:'s',jit:.1});glyphe(b,6,{p:[0,7.45,-.914],r:[0,PI,0],s:.7,c:V,w:.12});
  // --- socles massifs : assises de gros blocs dont la face intérieure suit le cercle de l'ouverture
  b.sym(sd=>{const X=q=>[sd*q[0],q[1]];
    [[0,.6,[2.9,4],5],[.6,1.2,[3.45,4.3],4.95],[1.2,1.8,[3.9],4.9],[1.8,2.3,[4.2],4.85]].forEach((q,k)=>{const y0=q[0],y1=q[1],xs=q[2].concat([q[3]]);
      bloc1(b,[[xi(y0),y0],[xs[0],y0],[xs[0],y1],[xi(y1),y1],[xi((y0+y1)/2),(y0+y1)/2]].map(X),-1.05,2.1,.96,{c:K.shade(PIERRES[(k+1)%4],.92+b.rnd()*.14),jit:.04});
      for(let i=0;i<xs.length-1;i++)bloc1(b,[[xs[i],y0],[xs[i+1],y0],[xs[i+1],y1],[xs[i],y1]].map(X),-1.05,2.1+(i+k)%2*.06,.96,{c:K.shade(PIERRES[(k+i)%4],.92+b.rnd()*.14),jit:.04});});
    bloc1(b,[[3.37,2.3],[5.04,2.3],[5.04,2.52],[3.42,2.52]].map(X),-1.12,2.24,.97,{c:PAL.stoneL,jit:.04});                                                // couvertine
    glyphe(b,sd>0?9:5,{p:[sd*4.42,1.2,1.07],s:.78,c:V,w:.12});b.group({p:[sd*4.42,1.2,1.064]},b=>trait(b,0,-.52,0,.52,.8,{c:PAL.stoneDD,jit:0}));           // grande rune du socle
    amas(b,[sd*4.64,2.5,.25],.95,VD,VL,sd*.8);amas(b,[sd*5.25,0,.5],.7,VD,VL,sd*2.2);                                                                    // cristaux violets
    b.add(K.box(.56,1.5,.56,.62,.62),{p:[sd*3.7,.75,2.75],r:[0,sd*.3,0],c:CALCD,c2:CALC});b.add(K.box(.7,.14,.7,.9,.9),{p:[sd*3.7,.07,2.75],r:[0,sd*.3,0],c:PAL.stoneD});   // bornes du parvis
    glyphe(b,sd>0?3:12,{p:[sd*3.7-sd*.066,.82,2.75+.214],r:[-.07,sd*.3,0],s:.3,c:V,w:.15});});
  // --- dalles du parvis (devant) et du seuil arrière — rien sous l'arche même
  [[0,1.62,1.9,1.3],[-1.92,1.5,1.5,1.2],[1.95,1.55,1.6,1.1],[-.95,2.9,1.7,1.1],[1.02,2.95,1.8,1.2],[-2.75,2.75,1.3,1],[2.8,2.8,1.2,1],[0,-1.6,2,1.2],[-1.9,-1.5,1.4,1.1],[1.9,-1.55,1.5,1.1]].forEach((q,i)=>
    b.add(K.box(q[2],.09,q[3],.94,.94),{p:[q[0],.045,q[1]],r:[0,(b.rnd()-.5)*.16,0],c:K.shade(PIERRES[i%4],.95+b.rnd()*.12),jit:.04}));
  // --- racines à gauche, lierre à droite, mousse et éboulis
  b.add(K.tube(K.curve([[-5.7,0,.9],[-5.15,.5,1.16],[-4.6,1.3,1.13],[-4.25,2.2,1.16],[-3.95,2.8,.95],[-3.7,3.5,.78]],8),[.17,.15,.13,.11,.1,.08,.06,.04,.015],5),{c:PAL.bark,c2:PAL.wood});
  b.add(K.tube(K.curve([[-3.1,0,1.7],[-3,.5,1.13],[-3.4,1.2,1.11],[-3.9,1.7,1.11],[-4.6,2.05,1.13],[-5,2.6,.9]],7),[.14,.12,.1,.09,.07,.05,.03,.012],5),{c:PAL.bark,c2:PAL.wood});
  lierre(b,[[5.05,.1,.7],[4.95,1.2,1.09],[4.55,2.45,1.15],[4.3,3.2,.76],[4.42,4.3,.78],[4.05,5.2,.78],[3.4,5.9,.78]],{n:12});
  mousse(b,[-4.2,2.52,-.3],.4,4);mousse(b,[3.9,2.52,-.5],.3,6);mousse(b,[-2.2,7.05,.2],.3,8);mousse(b,[1.5,7.42,-.2],.26,9);
  b.add(K.rock(.34,5,0,.3),{p:[-5.4,.2,-.7],c:PAL.stone}).add(K.rock(.22,7,0,.3),{p:[5.5,.12,-.4],c:CALCD}).add(K.rock(.26,9,0,.3),{p:[2.7,.14,-1.5],c:PAL.stoneL});
  // --- cristaux flottants au-dessus de la clef (pièce animée)
  [[0,9.02,1,0],[-.72,8.72,.6,.25],[.7,8.8,.52,-.3]].forEach((q,i)=>fl.group({p:[q[0],q[1],0],r:[0,i*.9,q[3]],s:q[2]},fl=>{const G=[[0,-.58,0],[.2,-.16,0],[.25,.1,1],[.13,.4,0],[0,.6,0]],W=(k,j,t)=>k===1&&t===1&&j%2===0;
    fl.add(taille(G,6,(k,j,t)=>!W(k,j,t)),{c:VD,c2:VL,ch:'s',jit:.12}).add(taille(G,6,W),{c:VL,c2:0xffffff,ch:'g',jit:0});}));
  return{parts:[{name:'base',b},{name:'crystals',b:fl,parent:'base',pivot:[0,8.9,0],anim:[{k:'pos',axis:'y',amp:.15,sp:2}]}],bake:SOL,center:[0,CY,0],rIn:3.4};};

// =====================================================================================================================
// MOBILIER PARTAGÉ — caisse, tonneau, sac, fiole, lanterne de fer
// =====================================================================================================================
const caisse=(b,o)=>b.group({p:o.p,r:o.r},b=>{const a=o.a||.6,h=o.h||a,t=a*.11;b.add(K.box(a*.92,h*.96,a*.92),{p:[0,h/2,0],c:o.c||PAL.wood,jit:.06});
  b.add(K.box(a,t,a),{p:[0,t/2,0],c:PAL.woodD}).add(K.box(a,t,a),{p:[0,h-t/2,0],c:PAL.plank});                                    // cadres du bas et du haut
  for(const sx of[-1,1])for(const sz of[-1,1])b.add(K.box(t,h-2*t,t),{p:[sx*(a-t)/2,h/2,sz*(a-t)/2],c:PAL.woodD});});             // montants
const tonneau=(b,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{b.add(K.lathe([[.27,0],[.34,.28],[.34,.56],[.27,.84],[.23,.84],[.23,.79],[0,.79]],8),{c:PAL.wood,c2:PAL.woodL,jit:.08});
  for(const y of[.15,.69])b.add(K.cyl(.325,.325,.07,8,{open:true}),{p:[0,y,0],c:PAL.ironL,ch:o.ch||'m'});});                      // cercles de fer
const sac=(b,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{b.add(K.lathe([[0,0],[.21,.03],[.26,.2],[.19,.42],[.07,.5],[.11,.58]],6,{capT:true}),{c:o.c||PAL.rope,c2:PAL.cream,jit:.08});
  b.add(K.cyl(.08,.08,.035,5,{open:true}),{p:[0,.5,0],c:PAL.dirt});});
const fiole=(b,o)=>b.group({p:o.p,s:o.s},b=>{b.add(K.lathe([[.045,0],[.056,.05],[.02,.12],[.021,.17]],5,{capB:true}),{c:o.c,c2:K.mix(o.c,0xffffff,.55),ch:o.ch||'s',jit:.06});b.add(K.cone(.027,.05,4),{p:[0,.185,0],c:PAL.plank});});
// lanterne de fer : origine au crochet ; le verre lumineux est centré 0,27 m plus bas
const lanterne=(b,o)=>b.group({p:o.p,r:o.r,s:o.s},b=>{b.add(K.torus(.03,.009,3,5),{p:[0,-.03,0],c:PAL.iron}).add(K.cyl(0,.15,.1,4,{a0:PI/4}),{p:[0,-.11,0],c:PAL.iron});
  b.add(K.box(.17,.22,.17,.9,.9),{p:[0,-.27,0],c:PAL.goldD,c2:PAL.cream,ch:'g',jit:.04}).add(K.box(.24,.03,.24),{p:[0,-.395,0],c:PAL.iron}).add(K.box(.2,.02,.2),{p:[0,-.155,0],c:PAL.ironL});
  for(const sx of[-1,1])for(const sz of[-1,1])b.add(K.cyl(.012,.012,.24,3,{open:true}),{p:[sx*.095,-.27,sz*.095],c:PAL.iron});});
// =====================================================================================================================
// L'ÉTAL DU MARCHAND — le client est du côté +Z ; l'espace x −0,6…0,6 / z −0,9…0,3 reste libre pour le marchand
// =====================================================================================================================
MODELS['set.etal']=ctx=>{const b=K.make(71),TH=Math.atan2(.75,2.22),RAY=[PAL.cloth,PAL.cream];
  // --- tapis : bordure sombre, champ rouge, losanges crème, franges
  b.add(K.box(2.9,.024,2.46),{p:[0,.012,.02],c:PAL.clothD,jit:.03});plat(b,[[-1.32,-1.12],[1.32,-1.12],[1.32,1.16],[-1.32,1.16]],.03,{c:PAL.cloth,jit:.03});
  for(let i=-3;i<=3;i++)plat(b,[[i*.36,1.0],[i*.36+.1,1.08],[i*.36,1.16],[i*.36-.1,1.08]],.036,{c:i%2?PAL.gold:PAL.cream,jit:0});
  for(const sz of[-1,1])b.add(K.box(2.8,.016,.06),{p:[0,.008,.02+sz*1.25],c:PAL.cream});
  // --- comptoir : façade de planches, flancs, plateau épais, plinthe et bandeau
  SH.planks(b,{p:[0,.5,.9],w:3.1,h:.88,d:.06,n:9,vertical:true,c:PAL.wood});
  for(const sd of[1,-1])SH.planks(b,{p:[sd*1.53,.5,.64],r:[0,PI/2,0],w:.52,h:.88,d:.05,n:2,vertical:true,c:PAL.wood});
  b.add(K.box(3.34,.07,.36),{p:[0,.975,.84],c:PAL.woodL,jit:.05}).add(K.box(3.34,.07,.35),{p:[0,.972,.5],c:PAL.plank,jit:.05});
  b.add(K.box(3.18,.09,.05),{p:[0,.1,.94],c:PAL.woodD}).add(K.box(3.18,.06,.05),{p:[0,.9,.94],c:PAL.woodD});
  // --- chemin de comptoir violet à pointe, galon et médaillon dorés
  b.add(K.box(.98,.02,.72),{p:[0,1.02,.67],c:PAL.purple});bloc1(b,[[-.49,1.03],[.49,1.03],[.49,.6],[0,.42],[-.49,.6]],1.014,.022,1,{c:PAL.purple,jit:.03});
  b.group({p:[0,0,1.04]},b=>{trait(b,-.49,.62,0,.44,.04,{c:PAL.gold,ch:'s',jit:0});trait(b,.49,.62,0,.44,.04,{c:PAL.gold,ch:'s',jit:0});});
  b.add(K.cyl(.12,.12,.02,8),{p:[0,.78,1.045],r:[PI/2,0,0],c:PAL.gold,ch:'s'});glyphe(b,10,{p:[0,.78,1.058],s:.13,c:PAL.goldD,ch:'s',w:.2});
  // --- quatre poteaux, pannes et chevrons
  for(const sx of[-1,1]){b.add(K.cyl(.05,.06,2.27,6),{p:[sx*1.64,1.135,1.06],c:PAL.woodD}).add(K.cyl(.05,.06,3.02,6),{p:[sx*1.64,1.51,-1.16],c:PAL.woodD});
    b.add(K.box(.07,.07,2.5),{p:[sx*1.64,2.67,-.05],r:[TH,0,0],c:PAL.wood});}
  b.add(K.box(3.42,.08,.08),{p:[0,2.28,1.06],c:PAL.wood}).add(K.box(3.42,.08,.08),{p:[0,3.02,-1.16],c:PAL.wood});
  // --- auvent rayé rouge et crème, lambrequin à pointes
  b.group({p:[0,2.72,0],r:[TH,0,0]},b=>{for(let i=0;i<9;i++)b.add(K.box(.392,.03,2.72),{p:[(i-4)*.4,0,0],c:RAY[i%2],jit:.04});});
  for(let i=0;i<9;i++)b.add(K.face([[-.2,0,0],[.2,0,0],[.2,-.15,0],[0,-.27,0],[-.2,-.15,0]],{dbl:true}),{p:[(i-4)*.4,2.262,1.292],c:RAY[(i+1)%2],jit:.04});
  // --- fond de l'étal : dosseret de planches, buffet bas et deux étagères
  SH.planks(b,{p:[0,1.64,-1.23],w:3.2,h:1.5,d:.05,n:5,c:PAL.wood});SH.planks(b,{p:[0,.44,-1.2],w:3.2,h:.86,d:.06,n:3,c:PAL.woodD});
  b.add(K.box(3.2,.05,.34),{p:[0,.885,-1.08],c:PAL.plank}).add(K.box(3.1,.045,.3),{p:[0,1.4,-1.07],c:PAL.woodL}).add(K.box(3.1,.045,.3),{p:[0,1.92,-1.07],c:PAL.woodL});
  // --- fioles et gemmes aux couleurs des cinq éléments, sur les étagères et le comptoir
  ELS.forEach((el,i)=>{const x=[-1.32,-1,-.68,.68,1.0][i];fiole(b,{p:[x,1.943,-1.05],s:1.5,c:EL[el].main});SH.gem(b,{p:[[-1.3,-.95,.62,.96,1.3][i],1.52,-1.05],s:.17,c:EL[el].main});
    b.add(K.cyl(.05,.07,.04,5),{p:[[-1.3,-.95,.62,.96,1.3][i],1.44,-1.05],c:PAL.woodD});
    SH.gem(b,{p:[-1.36+i*.17,1.1,.74],s:.1,c:EL[el].main});});
  fiole(b,{p:[1.32,1.943,-1.05],s:1.5,c:PAL.portal});b.add(K.box(.84,.03,.2),{p:[-1.02,1.025,.74],c:PAL.woodD});                      // présentoir des gemmes
  fiole(b,{p:[-1.3,1.01,.5],s:1.25,c:EL.bois.main});fiole(b,{p:[-1.14,1.01,.46],s:1,c:EL.feu.main});fiole(b,{p:[-.62,.91,-1.05],s:1.6,c:EL.eau.main});fiole(b,{p:[.62,.91,-1.02],s:1.6,c:EL.elec.main});
  b.add(K.box(.3,.2,.2),{p:[-1.25,1.01,-1.06],c:PAL.wood}).add(K.box(.32,.07,.22,.8,.7),{p:[-1.25,1.14,-1.06],c:PAL.woodD}).add(K.box(.06,.07,.03),{p:[-1.25,1.08,-.95],c:PAL.gold,ch:'s'});   // coffret
  for(let k=0;k<3;k++)b.add(K.box(.07,.26,.2),{p:[-.62+k*.08,1.555,-1.07],r:[0,0,k===2?-.2:0],c:[PAL.clothD,PAL.leafD,PAL.purpleD][k]});                // livres
  for(let k=0;k<3;k++)b.add(K.cyl(.035,.035,.3,5),{p:[1.22,.94+k%2*.06,-1.12+k*.07],r:[0,0,PI/2],c:PAL.cream});                                         // rouleaux
  // --- balance de bronze : une gemme d'un côté, des pièces de l'autre
  b.group({p:[1.02,1.01,.68],r:[0,-.35,0]},b=>{b.add(K.cyl(.07,.1,.03,6),{p:[0,.015,0],c:PAL.bronze,ch:'s'}).add(K.cyl(.014,.02,.38,5,{open:true}),{p:[0,.22,0],c:PAL.bronze,ch:'s'}).add(K.oct(.032),{p:[0,.43,0],c:PAL.gold,ch:'s'});
    b.group({p:[0,.39,0],r:[0,0,.13]},b=>{b.add(K.box(.54,.018,.018),{c:PAL.bronzeL,ch:'s'});
      for(const sd of[-1,1])b.group({p:[sd*.26,0,0],r:[0,0,-.13]},b=>{for(let k=0;k<3;k++)b.add(K.tube([[0,0,0],[.09*Math.sin(k*2.1),-.2,.09*Math.cos(k*2.1)]],.005,3,{open:true}),{c:PAL.bronzeL,ch:'s'});
        b.add(K.cyl(.1,.06,.03,6),{p:[0,-.215,0],c:PAL.bronze,ch:'s'});
        if(sd<0)SH.gem(b,{p:[0,-.15,0],s:.1,c:PAL.crystal});else for(let k=0;k<3;k++)b.add(K.cyl(.03,.03,.012,6),{p:[(k-1)*.03,-.195+k*.012,(k%2)*.03],c:PAL.gold,ch:'s'});});});});
  for(let k=0;k<4;k++)b.add(K.cyl(.035,.035,.014,6),{p:[.5+(k%2)*.012,1.017+k*.014,.82],c:PAL.gold,ch:'s'});b.add(K.cyl(.035,.035,.014,6),{p:[.6,1.017,.76],c:PAL.gold,ch:'s'});   // pile de pièces
  // --- caisses et sac à gauche, tonneau aux tapis roulés à droite
  caisse(b,{p:[-1.24,0,-.4],a:.56,r:[0,.12,0]});caisse(b,{p:[-1.27,.56,-.42],a:.4,r:[0,-.3,0],c:PAL.plank});sac(b,{p:[-1.22,0,.1],s:.9});
  tonneau(b,{p:[1.22,0,-.38],s:.95});[[PAL.cloth,.1,.5],[PAL.purple,-.08,-.3],[PAL.cream,.04,1.9]].forEach((q,k)=>b.add(K.cyl(.06,.06,.95,6),{p:[1.22+q[1],1.1,-.38+(k-1)*.09],r:[.12*Math.cos(q[2]),0,.16*Math.sin(q[2])],c:q[0],jit:.06}));
  sac(b,{p:[1.26,0,.12],s:.75,r:[0,1,0],c:PAL.sand});
  // --- lanterne suspendue, enseigne à la pièce d'or au-dessus de l'entrée
  lanterne(b,{p:[1.25,2.24,1.06]});lanterne(b,{p:[-1.25,2.24,1.06],s:.85});
  b.group({p:[0,2.58,1.1],r:[.1,0,0]},b=>{b.add(K.box(1.34,.46,.05),{c:PAL.woodL,jit:.05}).add(K.box(1.42,.06,.07),{p:[0,.23,0],c:PAL.woodD}).add(K.box(1.42,.06,.07),{p:[0,-.23,0],c:PAL.woodD});
    b.add(K.cyl(.15,.15,.03,8),{p:[0,0,.035],r:[PI/2,0,0],c:PAL.gold,ch:'s'});glyphe(b,6,{p:[0,0,.054],s:.17,c:PAL.goldD,ch:'s',w:.18});
    SH.gem(b,{p:[-.42,0,.03],s:.19,c:PAL.crystal});fiole(b,{p:[.42,-.13,.05],s:1.5,c:PAL.portal});
    for(const sx of[-1,1])b.add(K.box(.05,.34,.05),{p:[sx*.55,-.36,-.02],c:PAL.woodD});});
  return{parts:[{name:'body',b}],bake:SOL,npc:[0,-.3]};};
// =====================================================================================================================
// LE MARCHAND — vieux mage jovial : robe violette, grand chapeau pointu, barbe blanche, gros nez ; il salue du bras droit
// =====================================================================================================================
MODELS['set.marchand']=ctx=>{const b=K.make(81),hd=K.make(82),ar=K.make(83),V=PAL.purple,VD=PAL.purpleD,SK=PAL.skin;
  // --- robe en cloche, ourlet et col dorés, parement, ceinture à boucle, étoiles brodées
  b.add(K.lathe([[.4,0],[.41,.05],[.36,.3],[.36,.62],[.37,.82],[.33,1.02],[.25,1.18],[.15,1.28],[.09,1.31]],9),{c:VD,c2:V,jit:.06});
  b.add(K.lathe([[.405,0],[.428,.06],[.398,.13]],9),{c:PAL.goldD,ch:'s'}).add(K.lathe([[.17,1.25],[.2,1.29],[.12,1.33]],9),{c:PAL.gold,ch:'s'});
  b.add(K.lathe([[.372,.7],[.392,.745],[.372,.79]],9),{c:PAL.dirtD}).add(K.box(.11,.11,.035),{p:[0,.745,.385],c:PAL.gold,ch:'s'}).add(K.box(.05,.05,.04),{p:[0,.745,.39],c:PAL.dirtD});
  [[-.16,.42,.33,.05],[.14,.24,.36,.04],[-.05,.56,.37,.035],[.2,.52,.31,.045]].forEach(q=>b.add(K.oct(1),{p:[q[0],q[1],q[2]],s:[q[3],q[3],.012],c:PAL.gold,ch:'s',jit:0}));
  b.sym(sd=>{b.add(K.box(.15,.09,.28,.8,.45),{p:[sd*.15,.045,.34],c:PAL.dirtD});b.add(K.cone(.04,.1,4),{p:[sd*.15,.1,.47],r:[-.6,0,0],c:PAL.dirtD});});       // souliers à pointe
  // --- sacoche en bandoulière sur la hanche gauche
  b.add(K.tube([[-.2,1.2,.15],[.03,1.02,.35],[.28,.84,.3],[.4,.72,.1]],.026,4),{c:PAL.dirt});
  b.group({p:[.43,.6,.1],r:[0,.45,-.08]},b=>{b.add(K.box(.26,.24,.12,.92,.9),{c:PAL.dirt,jit:.06}).add(K.box(.27,.11,.13),{p:[0,.085,.005],c:PAL.dirtD}).add(K.box(.055,.06,.02),{p:[0,.03,.07],c:PAL.gold,ch:'s'});});
  // --- bras gauche replié : il tient une fiole lumineuse ; bague
  b.add(K.tube([[.25,1.19,0],[.43,.98,.06],[.36,.9,.3]],[.1,.1,.125],6),{c:VD,c2:V});b.add(K.cyl(.13,.13,.04,6),{p:[.355,.895,.31],r:[1.3,0,0],c:PAL.goldD,ch:'s'});
  b.add(K.ico(.075,0),{p:[.345,.89,.38],c:SK});b.add(K.cyl(.03,.03,.014,5,{open:true}),{p:[.4,.9,.42],r:[0,0,.6],c:PAL.gold,ch:'s'});
  b.add(K.lathe([[.04,0],[.052,.05],[.02,.11],[.02,.16]],5,{capB:true}),{p:[.33,.93,.4],c:PAL.crystalD,c2:PAL.rune,ch:'g',jit:.04});b.add(K.cone(.026,.05,4),{p:[.33,1.105,.4],c:PAL.plank});
  // --- tête (pièce animée) : visage, gros nez, yeux, sourcils, moustache, grande barbe, oreilles, cheveux
  hd.add(K.ico(.215,1),{p:[0,1.5,.02],s:[1,1.02,.98],c:SK,c2:K.mix(SK,0xffffff,.18),jit:.03});
  hd.add(K.sph(.078,6,4),{p:[0,1.465,.235],s:[1,.95,1.15],c:K.mix(SK,PAL.cloth,.32),flat:false,jit:0});
  hd.add(K.box(.1,.03,.04),{p:[0,1.375,.2],c:PAL.clothD});                                                                             // sourire sous la moustache
  hd.sym(sd=>{SH.eye(hd,{p:[sd*.097,1.555,.178],r:.07,rot:[-.1,sd*.22,0]});
    hd.add(K.box(.14,.05,.07,.9,.8),{p:[sd*.105,1.645,.19],r:[.1,sd*.2,sd*.3],c:PAL.white});
    hd.add(K.cone(.075,.3,5),{p:[sd*.15,1.395,.2],r:[.25,0,-sd*1.9],c:PAL.white,c2:PAL.bone});
    hd.add(K.box(.05,.11,.07,.7,.7),{p:[sd*.215,1.5,.01],c:K.mix(SK,PAL.cloth,.15)});
    hd.add(K.cone(.11,.36,5),{p:[sd*.17,1.27,.1],r:[PI-.1,0,-sd*.28],c:PAL.white,c2:PAL.boneD});
    hd.add(K.ico(.1,0),{p:[sd*.17,1.47,-.1],s:[1,1.5,1],c:PAL.white});});
  hd.add(K.cone(.21,.66,7),{p:[0,1.1,.16],r:[PI+.14,0,0],s:[1,1,.72],c:PAL.white,c2:PAL.boneD});hd.add(K.cone(.13,.4,5),{p:[0,1.2,.25],r:[PI+.3,0,0],c:PAL.white,c2:PAL.bone});
  // --- grand chapeau pointu : bord large, cône cabossé, pointe qui retombe, ruban doré à boucle, étoiles
  hd.add(K.lathe([[.2,1.63],[.44,1.6],[.46,1.635],[.225,1.705],[.17,1.87],[.1,1.99]],9),{c:VD,c2:V,jit:.06});
  hd.add(K.tube(K.curve([[0,1.96,0],[.02,2.08,-.03],[.1,2.15,-.08],[.21,2.12,-.11]],4),[.105,.08,.055,.03,0],5),{c:V});
  hd.add(K.lathe([[.228,1.7],[.24,1.735],[.205,1.77]],9),{c:PAL.goldD,ch:'s'}).add(K.box(.09,.085,.03),{p:[0,1.735,.225],r:[-.3,0,0],c:PAL.gold,ch:'s'});
  hd.add(K.oct(1),{p:[.13,1.88,.1],r:[-.3,.9,0],s:[.04,.04,.012],c:PAL.gold,ch:'s',jit:0}).add(K.oct(1),{p:[-.1,1.82,.14],r:[-.3,-.6,0],s:[.03,.03,.012],c:PAL.gold,ch:'s',jit:0});
  // --- bras droit levé (pièce animée) : large manche, main ouverte, deux bagues
  ar.add(K.tube([[-.25,1.19,0],[-.47,1.22,.04],[-.6,1.45,.1],[-.62,1.63,.12]],[.1,.1,.125,.15],6),{c:VD,c2:V});ar.add(K.cyl(.155,.15,.045,6),{p:[-.622,1.645,.122],r:[.1,0,.08],c:PAL.goldD,ch:'s'});
  ar.add(K.ico(.08,0),{p:[-.63,1.73,.13],s:[1,1.1,.55],c:SK});
  for(let k=0;k<4;k++)ar.add(K.box(.032,.1+(k===1||k===2?.02:0),.03,.8,.8),{p:[-.63+(k-1.5)*.04,1.83+(k===1||k===2?.01:0),.13],r:[0,0,-(k-1.5)*.13],c:SK});
  ar.add(K.box(.032,.085,.03,.8,.8),{p:[-.545,1.75,.14],r:[0,0,-1],c:SK});
  ar.add(K.cyl(.024,.024,.018,5,{open:true}),{p:[-.61,1.805,.13],c:PAL.gold,ch:'s'}).add(K.oct(.018),{p:[-.61,1.805,.155],c:PAL.cloth,ch:'s'});
  ar.add(K.cyl(.024,.024,.018,5,{open:true}),{p:[-.69,1.8,.13],r:[0,0,.2],c:PAL.gold,ch:'s'}).add(K.oct(.018),{p:[-.69,1.8,.155],c:PAL.crystal,ch:'s'});
  return{parts:[{name:'body',b},{name:'arm',b:ar,parent:'body',pivot:[-.26,1.2,0],anim:[{k:'rot',axis:'z',amp:.25,sp:3}]},{name:'head',b:hd,parent:'body',pivot:[0,1.3,0],anim:[{k:'rot',axis:'z',amp:.06,sp:1.5}]}],
    bake:{ground:.18,groundH:.8},scale:.9};};

// =====================================================================================================================
// VESTIGES ET MOBILIER — objets fixes semés sur l'île
// =====================================================================================================================
// pierre levée gravée : une version par élément (grande rune lumineuse devant, motif de l'élément au sommet)
MODELS['set.monolithe']=ctx=>{const b=K.make(91),el=EL[ctx.el]?ctx.el:'feu',G=lueur(el);
  b.add(K.prism([[-.62,.3],[-.42,.48],[.44,.48],[.7,.05],[.5,-.42],[-.1,-.5],[-.6,-.28]],2.25,{taper:.82}),{c:CALCD,c2:PAL.stoneL,jit:.07});          // pierre dressée, en deux pans
  b.add(K.prism([[-.52,.26],[-.34,.4],[.36,.4],[.56,.03],[.4,-.36],[-.1,-.42],[-.5,-.24]],1.3,{y0:2.2,taper:.42}),{p:[.02,0,-.01],r:[0,0,.025],c:PAL.stoneL,c2:CALC,jit:.07});
  b.group({p:[0,1.3,.447],r:[-.039,0,0]},b=>{trait(b,0,-.72,0,.72,.74,{c:PAL.stoneD,jit:0});glyphe(b,SCEAU[el],{p:[0,.05,.012],s:.92,c:G,w:.11});                  // cartouche et grande rune
    glyphe(b,ELS.indexOf(el)*3+2,{p:[0,-.58,.012],s:.2,c:G,w:.16});});
  for(const sd of[1,-1])glyphe(b,ELS.indexOf(el)+(sd>0?4:8),{p:[sd*.3,2.62,.345],r:[-.2,0,0],s:.2,c:PAL.stoneD,ch:'m',w:.16});                           // petites runes gravées
  SH.motif(b,el,{p:[.02,3.48,-.02],s:.62});
  mousse(b,[-.5,.5,.2],.3,3);mousse(b,[.45,2.2,-.1],.24,5);mousse(b,[.2,0,.55],.34,7);
  b.add(K.rock(.3,4,0,.3),{p:[-.75,.14,.25],c:PAL.stone}).add(K.rock(.2,6,0,.3),{p:[.7,.08,.45],c:CALCD});
  return fixe(b);};
// lanterne de chemin : poteau à potence, lanterne de fer à lueur chaude. lamp = centre du verre
MODELS['set.lanterne']=ctx=>{const b=K.make(95);
  b.add(K.cyl(.065,.09,2.6,6),{p:[0,1.3,0],r:[0,0,.02],c:PAL.woodD,c2:PAL.wood}).add(K.cone(.1,.13,4),{p:[-.05,2.66,0],c:PAL.woodD});
  b.add(K.box(.78,.07,.07),{p:[.3,2.44,0],c:PAL.wood}).add(K.box(.52,.05,.05),{p:[.17,2.22,0],r:[0,0,.8],c:PAL.wood});                                  // potence et jambe de force
  b.add(K.cyl(.09,.09,.08,6,{open:true}),{p:[-.045,2.3,0],c:PAL.rope}).add(K.cyl(.008,.008,.12,3,{open:true}),{p:[.6,2.35,0],c:PAL.iron});
  lanterne(b,{p:[.6,2.3,0],s:1.15});
  b.add(K.rock(.22,3,0,.3),{p:[.13,.08,.1],c:PAL.stone}).add(K.rock(.18,5,0,.3),{p:[-.14,.06,-.08],c:CALCD});
  return{parts:[{name:'body',b}],bake:SOL,lamp:[.6,1.99,0]};};
// statue de gardien : silhouette encapuchonnée, épée pointe en bas, gemme lumineuse sur la poitrine
MODELS['set.statue']=ctx=>{const b=K.make(94),PA=K.mix(PAL.stone,PAL.moss,.2),PB=K.mix(PAL.stoneL,PAL.moss,.1),PD=K.mix(PAL.stoneD,PAL.moss,.2);
  b.add(K.box(1.75,.3,1.75,.95,.95),{p:[0,.15,0],c:PAL.stoneD}).add(K.box(1.42,.56,1.42,.97,.97),{p:[0,.58,0],c:PAL.stone}).add(K.box(1.58,.15,1.58,.94,.94),{p:[0,.93,0],c:PAL.stoneL});   // socle à trois assises
  for(let k=0;k<3;k++)glyphe(b,k*4+3,{p:[(k-1)*.38,.58,.705],s:.26,c:PAL.stoneDD,ch:'m',w:.15});
  b.add(K.lathe([[.64,1],[.57,1.3],[.48,2],[.46,2.6],[.54,3],[.44,3.24],[.2,3.4]],8),{s:[1,1,.8],c:PA,c2:PB,jit:.06});                                    // robe
  for(const q of[[-.26,.3],[.03,.42],[.3,.28]])b.add(K.box(.09,1.5,.09,.6,.6),{p:[q[0],1.76,q[1]],r:[.07,0,q[0]*.12],c:PD});                              // plis
  b.add(K.lathe([[.5,2.42],[.53,2.5],[.5,2.58]],8),{s:[1,1,.82],c:PD});                                                                                 // ceinture
  b.add(K.box(1.3,.34,.64,.72,.7),{p:[0,3.14,-.02],c:PB}).add(K.box(1.0,.9,.12,.8,.6),{p:[0,2.6,-.38],r:[.08,0,0],c:PD});                                // mantelet, cape
  b.sym(sd=>{b.add(K.box(.36,.2,.5,.8,.8),{p:[sd*.56,3.3,0],r:[0,0,-sd*.25],c:PA});                                                                    // épaulières
    b.add(K.tube([[sd*.56,3.12,.06],[sd*.5,2.62,.34],[sd*.13,2.36,.52]],[.2,.17,.14],6),{c:PA,c2:PB});});                                               // bras
  b.add(K.lathe([[.3,3.28],[.37,3.52],[.35,3.76],[.2,3.96],[0,4.02]],7),{s:[1,1,1.12],p:[0,0,.02],c:PA,c2:PB,jit:.06});                                  // capuchon
  b.add(K.box(.36,.4,.1,.8,1),{p:[0,3.56,.36],c:PAL.stoneDD}).add(K.box(.5,.1,.16,.9,.6),{p:[0,3.8,.36],r:[.3,0,0],c:PB});                               // visage dans l'ombre, bord du capuchon
  b.add(K.box(.36,.2,.24),{p:[0,2.34,.54],c:PB});                                                                                                       // mains jointes sur la garde
  bloc1(b,[[-.12,2.12],[.12,2.12],[.12,1.26],[0,1.02],[-.12,1.26]],.5,.07,1,{c:K.mix(PAL.stoneL,PAL.white,.4)});                                                            // épée : lame, garde, fusée, pommeau
  b.add(K.box(.74,.1,.14),{p:[0,2.16,.535],c:PD}).add(K.cyl(.05,.05,.3,5),{p:[0,2.52,.535],c:PD}).add(K.oct(.1),{p:[0,2.72,.535],c:PB});
  b.add(K.cyl(.13,.13,.05,6),{p:[0,2.92,.4],r:[PI/2-.12,0,0],c:PAL.bronze}).add(K.oct(1),{p:[0,2.92,.43],s:[.085,.11,.05],c:PAL.rune,ch:'g',jit:0});         // gemme lumineuse sertie
  mousse(b,[-.5,1,.45],.3,3);mousse(b,[.45,3.3,-.1],.22,5);mousse(b,[.62,.3,.6],.26,8);
  lierre(b,[[-.95,0,.5],[-.74,.5,.72],[-.5,1,.74],[-.42,1.6,.44],[-.5,2.2,.42]],{n:7});
  return fixe(b);};
// colonne antique brisée : tambours cannelés, chapiteau tombé à côté
MODELS['set.colonne']=ctx=>{const b=K.make(92);
  b.add(K.box(1.1,.2,1.1,.94,.94),{p:[0,.1,0],c:PAL.stoneD}).add(K.lathe([[.5,.2],[.52,.27],[.42,.36]],8),{c:PAL.stone});
  [[.4,.6],[.385,.6],[.37,.6],[.355,.52]].forEach((q,k)=>{const y=.36+k*.6,a0=k*.25,r=q[0];b.add(K.lathe([[r,y],[r-.012,y+q[1]]],8,{capT:true,a0}),{c:[CALC,PAL.stoneL,CALCD,PAL.stoneL][k],jit:.06});
    for(let i=0;i<8;i++)b.group({r:[0,a0+(i+.5)/8*TAU,0]},b=>b.group({p:[0,y+q[1]/2,r*.924+.004]},b=>trait(b,0,-q[1]*.4,0,q[1]*.4,.07,{c:PAL.stoneD,jit:0})));});    // cannelures
  b.add(K.cyl(.14,.33,.34,5),{p:[.05,2.86,-.04],r:[.1,.4,.12],c:CALCD});                                                                                  // cassure
  b.group({p:[1.05,.3,.45],r:[1.25,.5,.3]},b=>{b.add(K.box(.92,.16,.92),{p:[0,.2,0],c:PAL.stoneL});b.add(K.lathe([[.34,-.1],[.45,.12]],8),{c:CALC});});   // chapiteau tombé
  b.add(K.cyl(.34,.35,.5,8),{p:[-.95,.33,.6],r:[PI/2,0,.7],c:CALCD,jit:.06}).add(K.rock(.2,4,0,.3),{p:[.4,.1,.95],c:PAL.stone});
  return fixe(b);};
// arche en ruine : deux piliers, linteau fendu, un bloc tombé
MODELS['set.arche']=ctx=>{const b=K.make(93);
  b.sym(sd=>{b.add(K.box(1.02,.3,1.02,.94,.94),{p:[sd*1.5,.15,0],c:PAL.stoneD});
    for(let k=0;k<4;k++)b.add(K.box(.8-k*.015,.74,.8-k*.015,.97,.97),{p:[sd*1.5+(b.rnd()-.5)*.04,.67+k*.75,(b.rnd()-.5)*.04],r:[0,(b.rnd()-.5)*.1,0],c:K.shade(PIERRES[(k+(sd>0?1:2))%4],.94+b.rnd()*.1),jit:.05});
    b.add(K.box(.72,.22,.72,1.3,1.3),{p:[sd*1.5,3.41,0],c:PAL.stoneL});glyphe(b,sd>0?5:2,{p:[sd*1.5,1.42,.41],s:.34,c:PAL.stoneDD,ch:'m',w:.15});});
  bloc2(b,[[-2.05,3.52],[.1,3.52],[.3,3.7],[.05,3.84],[.24,4.02],[-2.05,4.02]],.84,.95,{c:CALC,jit:.05});                                                // linteau : moitié gauche
  b.group({p:[1.9,3.52,0],r:[0,0,.09]},b=>bloc2(b,[[-1.42,0],[.15,0],[.15,.5],[-1.3,.5],[-1.52,.32],[-1.28,.2]],.84,.95,{c:PAL.stoneL,jit:.05}));          // moitié droite, affaissée
  for(let k=0;k<3;k++)glyphe(b,k*5+1,{p:[-1.5+k*.55,3.77,.436],s:.3,c:PAL.rune,w:.14});
  b.add(K.box(.8,.5,.74,.95,.95),{p:[.5,.2,1.25],r:[.25,.5,.12],c:CALCD}).add(K.rock(.3,5,0,.3),{p:[-.4,.14,.9],c:PAL.stone}).add(K.rock(.2,8,0,.3),{p:[1.1,.1,1.5],c:PAL.stoneL}).add(K.rock(.24,2,0,.3),{p:[2.3,.1,-.5],c:CALCD});
  mousse(b,[-1.5,4.02,.1],.34,3);mousse(b,[1.2,3.98,-.1],.26,6);mousse(b,[.55,.5,1.25],.24,9);
  lierre(b,[[-2.15,0,.3],[-1.98,.8,.43],[-1.7,1.7,.44],[-1.75,2.6,.44],[-1.4,3.4,.44],[-.8,3.8,.45]],{n:9});
  return fixe(b);};
// amas de caisses, tonneau et sacs
MODELS['set.caisses']=ctx=>{const b=K.make(96);
  caisse(b,{p:[-.35,0,-.12],a:.8,r:[0,.2,0]});caisse(b,{p:[-.32,.8,-.14],a:.58,r:[0,-.35,0],c:PAL.plank});caisse(b,{p:[-.36,1.38,-.12],a:.42,r:[0,.5,0]});
  tonneau(b,{p:[.6,0,.22]});sac(b,{p:[.05,0,.62],s:1.05,r:[0,.6,.12]});sac(b,{p:[-.72,0,.56],s:.85,r:[.2,2,0],c:PAL.sand});
  return fixe(b);};
// tronçon de clôture de 4 m (le long de x) : trois poteaux, deux lisses, le tout un peu de travers
MODELS['set.barriere']=ctx=>{const b=K.make(97);
  [-1.86,0,1.86].forEach((x,i)=>{b.add(K.box(.14,1.18+i%2*.08,.14,.7,.7),{p:[x,.59+i%2*.04,0],r:[(i-1)*.04,i*.5,(1-i)*.05],c:PAL.woodD,c2:PAL.wood,jit:.06});
    b.add(K.cyl(.11,.11,.07,4,{open:true}),{p:[x,.88,.02],r:[0,PI/4,0],c:PAL.rope});});
  [[-.95,.45,.03,.02],[.93,.47,-.035,-.03],[-.93,.86,-.03,.03],[.95,.84,.045,.01]].forEach((q,i)=>b.add(K.box(2+i%2*.06,.11,.045),{p:[q[0],q[1],.085],r:[0,q[3],q[2]],c:i%2?PAL.plank:PAL.wood,jit:.06}));
  b.add(K.box(.9,.1,.04),{p:[.6,.3,.16],r:[.25,.1,.5],c:PAL.plank});                                                                                     // une lisse tombée
  return fixe(b);};
// poteau indicateur : trois planches fléchées (vers le cœur, le portail, l'étal)
MODELS['set.panneau']=ctx=>{const b=K.make(98),F=[[-.5,-.11],[.36,-.11],[.56,0],[.36,.11],[-.5,.11]];
  b.add(K.cyl(.06,.08,2.2,6),{p:[0,1.1,0],r:[0,0,-.02],c:PAL.woodD,c2:PAL.wood}).add(K.cone(.09,.12,4),{p:[.04,2.25,0],c:PAL.woodD});
  [[1.95,.15,.04,1,PAL.crystal,10],[1.66,-.3,-.05,-1,PAL.portal,6],[1.38,.7,.03,1,PAL.gold,4]].forEach((q,i)=>b.group({p:[0,q[0],0],r:[0,q[1],q[2]]},b=>b.group({s:[q[3],1,1]},b=>{
    bloc1(b,F,.07,.045,1,{c:i%2?PAL.plank:PAL.woodL,jit:.06});glyphe(b,q[5],{p:[-.08,0,.12],s:.15,c:q[4],ch:'m',w:.22});trait(b,.12,0,.36,0,.03,{c:q[4],jit:0});})));
  b.add(K.rock(.2,3,0,.3),{p:[.12,.07,.08],c:PAL.stone}).add(K.rock(.16,5,0,.3),{p:[-.12,.05,-.06],c:CALCD});
  return fixe(b);};
// ponton de bois sur pilotis : 10 m le long de z (de −5 à +5), tablier à y = 0,5, pilotis jusqu'à y = −2
MODELS['set.ponton']=ctx=>{const b=K.make(99);
  for(let i=0;i<22;i++){const j=b.rnd();b.add(K.box(2.36+j*.1,.06,.42),{p:[(j-.5)*.05,.5+(i%3)*.004,-4.773+i*.4545],r:[0,(b.rnd()-.5)*.03,0],c:K.shade(i%4===1?PAL.woodL:PAL.plank,.86+j*.22),jit:.04});}   // planches du tablier
  for(const sx of[-1,1]){b.add(K.box(.12,.14,9.9),{p:[sx*.95,.4,0],c:PAL.woodD});
    [-4.6,-2.3,0,2.3,4.6].forEach((z,k)=>{b.add(K.cyl(.1,.125,2.95+(k%2)*.14,6),{p:[sx*1.07,-.525+(k%2)*.07,z],r:[0,k*.4,sx*.015],c:PAL.barkD,c2:PAL.wood,jit:.06});                            // pilotis
      if(k%2===0)b.add(K.cyl(.115,.115,.07,6,{open:true}),{p:[sx*1.07,.72,z],c:PAL.rope});});}
  [-4.6,-2.3,0,2.3,4.6].forEach(z=>b.add(K.box(2.2,.1,.1),{p:[0,.32,z],c:PAL.woodD}));                                                                  // traverses
  [[.82,3.5],[-.82,-1.2]].forEach(q=>{b.add(K.cyl(.085,.105,.4,6),{p:[q[0],.73,q[1]],c:PAL.iron}).add(K.cyl(.14,.11,.07,6),{p:[q[0],.96,q[1]],c:PAL.ironL});});   // bittes d'amarrage
  b.add(K.torus(.24,.055,4,8),{p:[-.55,.585,3.9],r:[PI/2,0,0],c:PAL.rope});                                                                              // glène de cordage
  b.add(K.tube(K.curve([[.82,.82,3.5],[1,.7,3.9],[1.1,.55,4.3],[1.07,.75,4.6]],6),.028,3,{open:true}),{c:PAL.rope});                                    // amarre
  return fixe(b);};
// barque de pêche : 3,6 m le long de z (proue en +z), origine à la ligne de flottaison
MODELS['set.barque']=ctx=>{const b=K.make(100),Z=[-1.75,-1.2,-.4,.5,1.25,1.8],GW=[.42,.62,.72,.66,.4,0],GY=[.42,.36,.33,.36,.46,.62],CW=[.3,.46,.54,.48,.26,0],CY=[-.05,-.12,-.14,-.12,-.04,.14],KY=[-.12,-.2,-.22,-.2,-.1,.14];
  for(let i=0;i<5;i++)for(const sd of[1,-1]){const j=b.rnd();                                                                                            // coque : fond et bordé, visibles dedans et dehors
    b.add(K.face([[0,KY[i],Z[i]],[0,KY[i+1],Z[i+1]],[sd*CW[i+1],CY[i+1],Z[i+1]],[sd*CW[i],CY[i],Z[i]]],{dbl:true}),{c:K.shade(PAL.woodD,1+j*.2),jit:.05});
    b.add(K.face([[sd*CW[i],CY[i],Z[i]],[sd*CW[i+1],CY[i+1],Z[i+1]],[sd*GW[i+1],GY[i+1],Z[i+1]],[sd*GW[i],GY[i],Z[i]]],{dbl:true}),{c:K.shade(i%2?PAL.wood:PAL.plank,.9+j*.2),jit:.05});}
  b.add(K.face([[0,KY[0],Z[0]],[CW[0],CY[0],Z[0]],[GW[0],GY[0],Z[0]],[-GW[0],GY[0],Z[0]],[-CW[0],CY[0],Z[0]]],{dbl:true}),{c:PAL.wood,jit:.05});          // tableau arrière
  for(const sd of[1,-1])b.add(K.tube(Z.map((z,i)=>[sd*GW[i],GY[i]+.01,z]),.04,4),{c:PAL.woodL});                                                         // plat-bord
  b.add(K.box(.08,.52,.1),{p:[0,.44,1.8],r:[.35,0,0],c:PAL.woodD}).add(K.box(.07,.1,3.4),{p:[0,-.2,-.05],c:PAL.woodD});                                  // étrave et quille
  b.add(K.box(1.3,.05,.26),{p:[0,.2,-.62],c:PAL.plank}).add(K.box(1.22,.05,.26),{p:[0,.22,.58],c:PAL.plank}).add(K.box(.62,.05,.3),{p:[0,.28,-1.5],c:PAL.woodL}).add(K.box(.74,.03,2.5),{p:[0,-.1,-.2],c:PAL.plank});   // bancs et plancher
  [[.36,.3,.12,-.1],[-.2,.26,-.08,.06]].forEach((q,i)=>b.group({p:[q[0],q[1],-.1],r:[q[2],q[3],0]},b=>{b.add(K.cyl(.024,.024,2.3,4),{r:[PI/2,0,0],c:PAL.woodL});b.add(K.box(.15,.02,.5),{p:[0,0,1.3],c:PAL.plank});}));   // rames
  b.sym(sd=>b.add(K.box(.05,.12,.05),{p:[sd*.71,.4,-.2],c:PAL.iron}));                                                                                  // tolets
  b.add(K.torus(.15,.04,3,6),{p:[0,-.04,1.05],r:[PI/2,0,0],c:PAL.rope}).add(K.cyl(.2,.16,.2,6),{p:[.2,.02,-1.1],c:PAL.rope,c2:PAL.cream});                // cordage et panier
  return fixe(b);};
// relique à ramasser : calice d'or serti, gemme lumineuse flottant dans la coupe (origine au centre de l'objet)
MODELS['obj.relique']=ctx=>{const b=K.make(101);
  b.add(K.lathe([[.2,-.45],[.22,-.42],[.08,-.36],[.05,-.2],[.1,-.14],[.05,-.08],[.065,-.02],[.2,.1],[.27,.28],[.26,.32],[.22,.27],[0,.1]],7,{capB:true}),{c:PAL.goldD,c2:PAL.gold,ch:'s',jit:.08});
  for(let k=0;k<4;k++)b.add(K.oct(.035),{p:[.1*Math.sin(k*PI/2+.4),-.14,.1*Math.cos(k*PI/2+.4)],c:[PAL.cloth,PAL.crystal,PAL.portal,EL.bois.main][k],ch:'s'});
  b.add(taille([[0,-.13,0],[.1,-.02,0],[.1,.03,1],[0,.16,0]],6),{p:[0,.3,0],c:PAL.crystal,c2:0xffffff,ch:'g',jit:.06});
  return b;};
}
