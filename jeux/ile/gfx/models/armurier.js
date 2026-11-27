// ARMURIER — le marchand d'armes de L'Île des Cinq (V2.0) : le PNJ (tablier de cuir, bonnet, marteau de forge à la main) et son râtelier d'armes avec une enclume.
// pnj.armurier : 1,7 m, regarde vers −Z, origine aux pieds ; mêmes pièces animées que pnj.villageois. set.ratelier : 2 m de large (le long de x), face vers −Z.
{
const {PAL}=K,PI=Math.PI;
const SOL={ground:.18,groundH:.8};
const fixe=b=>{const cuire=b.bake;b.bake=o=>cuire(Object.assign({},SOL,o));return b;};
const CUIR=0x6b4426,CUIRD=0x4a2e18,BRAISE=0xff7a2e;
MODELS['pnj.armurier']=ctx=>{const r=MODELS['pnj.villageois']({v:1}),b=r.parts[0].b,aR=r.parts[4].b;
  b.add(K.dome(.255,7,3),{p:[0,1.47,.02],c:CUIRD,c2:CUIR,jit:.04});                                  // bonnet de cuir
  b.add(K.cyl(.258,.258,.05,7,{open:true}),{p:[0,1.5,.02],c:PAL.cloth,jit:0});                       // bandeau rouge
  b.add(K.box(.46,.72,.04),{p:[0,.74,-.215],c:CUIR,c2:CUIRD,jit:.03});                                // tablier de forge
  b.add(K.box(.52,.07,.07),{p:[0,.88,-.2],c:CUIRD,jit:0}).add(K.box(.07,.07,.08),{p:[0,.88,-.24],c:PAL.goldD,jit:0});   // ceinture et boucle
  b.add(K.box(.1,.16,.05),{p:[.17,.66,-.24],c:CUIRD,jit:.02});                                         // poche à outils
  aR.add(K.cyl(.024,.024,.56,5),{p:[.33,.6,-.06],r:[.35,0,0],c:PAL.woodD});                          // manche du marteau
  aR.add(K.box(.22,.12,.12),{p:[.33,.34,-.15],r:[.35,0,0],c:PAL.iron,jit:.03});                       // tête du marteau
  return r;};
MODELS['set.ratelier']=ctx=>{const b=K.make(951);
  for(const x of[-.95,.95])b.add(K.box(.13,1.55,.13,.8,.8),{p:[x,.77,0],c:PAL.woodD,c2:PAL.wood,jit:.05});   // montants
  b.add(K.box(2.1,.1,.16),{p:[0,1.38,0],c:PAL.wood,jit:.05}).add(K.box(2.1,.1,.34),{p:[0,.34,.06],c:PAL.plank,jit:.05});
  [[-.6,0x3fa9ff],[0,0xff6a3d],[.6,0x5fd068]].forEach(([x,col])=>{                                    // trois armes debout, une gemme d'élément chacune
    b.add(K.box(.07,1.1,.07),{p:[x,.98,.03],r:[.16,0,0],c:PAL.iron});
    b.add(K.box(.13,.42,.1),{p:[x,.55,.11],r:[.16,0,0],c:PAL.woodL});
    b.add(K.box(.12,.12,.16),{p:[x,.86,.07],r:[.16,0,0],c:PAL.ironL});
    b.add(K.oct(.07),{p:[x,1.12,0],c:col,ch:'g',jit:0});});
  b.add(K.cyl(.3,.34,.55,7),{p:[1.75,.27,.25],c:PAL.barkD,c2:PAL.bark,jit:.04});                     // billot et enclume
  b.add(K.box(.62,.18,.26),{p:[1.75,.64,.25],c:PAL.iron,jit:.02}).add(K.cone(.13,.3,4),{p:[2.15,.66,.25],r:[0,0,-PI/2],c:PAL.iron});
  b.add(K.box(.3,.12,.2),{p:[1.75,.49,.25],c:PAL.ironL});
  b.add(K.cyl(.22,.26,.3,7),{p:[-1.7,.15,.3],c:PAL.stoneD,c2:PAL.stone});b.add(K.ico(.17,0),{p:[-1.7,.34,.3],c:BRAISE,ch:'g',jit:.04});   // brasero de forge
  return fixe(b);};
}
