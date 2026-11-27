// MODÈLE DE RÉFÉRENCE — le lutin élémentaire (ennemi de base, type « b »).
// Il sert d'exemple de style et de structure pour tous les autres modèles : pièces nommées, pivots, animation décrite par des données.
{
const {PAL}=K;
// ctx : {el:'feu'|'eau'|'bois'|'terre'|'elec', P:palette de l'élément (main, dark, deep, light, glow)}
MODELS['enemy.b']=ctx=>{const P=ctx.P,body=K.make(11),arms=K.make(12);
  // --- jambes courtes et grands pieds griffus
  body.sym(sd=>{body.add(K.cyl(.17,.2,.5,6),{p:[sd*.3,.3,0],c:P.dark});
    body.add(K.box(.36,.2,.62,.8,.75),{p:[sd*.32,.1,.14],c:P.deep});
    for(const k of[-1,0,1])body.add(K.cone(.05,.16,4),{p:[sd*.32+k*.11,.07,.47],r:[1.45,0,0],c:PAL.bone,jit:0});});
  // --- torse en poire, ventre clair, petite queue
  body.add(K.ico(.66,1),{p:[0,.98,0],s:[1,1.08,.92],c:P.dark,c2:P.main,ao:.15});
  body.add(K.sph(.46,7,5),{p:[0,.9,.3],s:[1,1.05,.6],c:P.light,flat:false,jit:0});
  body.add(K.tube(K.curve([[0,.75,-.5],[0,.6,-.9],[0,.85,-1.15],[0,1.2,-1.1]],6),[.12,.1,.08,.06,.04,.03,0],5),{c:P.dark});
  for(let i=0;i<3;i++)body.add(K.cone(.1,.26,4),{p:[0,1.05+i*.26,-.55+i*.07],r:[-1.1,0,0],c:P.deep});   // crête dorsale
  // --- grosse tête
  body.add(K.ico(.58,1),{p:[0,1.78,.06],s:[1.06,.92,.98],c:P.main,c2:P.light});
  body.sym(sd=>{SH.eye(body,{p:[sd*.24,1.86,.5],r:.17,rot:[-.05,sd*.22,0]});
    body.add(K.box(.3,.07,.12),{p:[sd*.25,2.07,.52],r:[.2,sd*.15,-sd*.42],c:P.deep});                               // sourcil froncé
    body.add(K.prism([[0,0],[.34,.1],[.08,.3]],.05),{p:[sd*.52,1.74,.02],r:[Math.PI/2,sd>0?0:Math.PI,sd*.5],c:P.main,c2:P.dark}); // oreille pointue
    body.add(K.tube(K.curve([[sd*.3,2.18,.02],[sd*.5,2.42,-.02],[sd*.56,2.68,.06],[sd*.44,2.86,.16]],5),[.11,.095,.075,.05,.028,0],5),{c:PAL.boneD,c2:PAL.bone});});
  body.add(K.box(.44,.16,.2,.82,1),{p:[0,1.54,.5],r:[.15,0,0],c:P.deep});                                             // bouche
  body.sym(sd=>body.add(K.cone(.05,.14,4),{p:[sd*.13,1.56,.6],r:[Math.PI,0,0],c:PAL.white,jit:0}));                    // deux crocs
  SH.motif(body,ctx.el,{p:[0,2.26,-.06],s:.8});                                                                       // la marque de son élément, sur le crâne
  // --- bras (pièce animée : ils se balancent autour des épaules)
  arms.sym(sd=>{arms.add(K.tube([[sd*.6,1.3,.02],[sd*.86,1.0,.08],[sd*.92,.68,.2]],[.13,.11,.1],5),{c:P.main,c2:P.dark});
    arms.add(K.ico(.2,0),{p:[sd*.93,.56,.24],c:P.deep});
    for(const k of[-1,0,1])arms.add(K.cone(.045,.17,4),{p:[sd*.93+k*.09,.44,.36],r:[2.2,0,0],c:PAL.bone,jit:0});});
  return{parts:[{name:'body',b:body},{name:'arms',b:arms,parent:'body',pivot:[0,1.3,0],anim:[{k:'rot',axis:'x',amp:.45,sp:7}]}],
    bake:{ground:.22,groundH:.7,map:{s:'m',x:'g'}},scale:.86,barY:2.75,r:.8};};
}
