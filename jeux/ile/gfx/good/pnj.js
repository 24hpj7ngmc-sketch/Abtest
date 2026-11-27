// PNJ — les habitants du village, pour les cinq thèmes (1 Céleste · 2 Pirate · 3 Dragon · 4 Cristal · 5 Astral).
// pnj.villageois : ctx.th 1-5, ctx.v 0-2. 1,7 m, regarde vers −Z, origine aux pieds. Pièces : corps (racine), legL, legR, armL, armR (marche).
// pnj.animal     : ctx.th 1-5. Un petit animal par thème, regarde vers −Z, 1 ou 2 pièces animées.
{
const {PAL,TAU}=K,PI=Math.PI;
const NOIRC=0x15181d,OR=PAL.gold,ORD=PAL.goldD;
const PEAUX=[PAL.skin,0xc68e60,0xf2cfaa,0x9a6a45];
const borne=(x,a,b)=>Math.max(a,Math.min(b,x));
const HY=1.45,HR=.21;                       // centre et rayon de la tête
// ---------------------------------------------------------------- aides communes
// tête ronde et visage simple (deux yeux, nez, sourire), tourné vers −Z
const tete=(b,sk)=>{b.add(K.sph(HR,7,4),{p:[0,HY,0],s:[1,.96,1],c:sk,flat:false,jit:0});
  b.sym(sd=>b.add(K.oct(.034),{p:[sd*.078,HY+.025,-.186],s:[1,1.3,.5],c:NOIRC,jit:0}));
  b.add(K.cone(.028,.065,4),{p:[0,HY-.025,-.21],r:[-PI/2,0,0],c:K.shade(sk,.86),jit:0});
  b.add(K.box(.085,.016,.02),{p:[0,HY-.085,-.178],c:K.shade(sk,.5),jit:0});};
// jambe : botte + jambe + revers éventuel. o : {jam, bot, rev}
const jambe=(l,sd,o)=>{const x=sd*.115;l.add(K.box(.15,.11,.28,.86,.75),{p:[x,.055,-.03],c:o.bot,jit:.04});
  l.add(K.cyl(.082,.07,.52,5,{open:true}),{p:[x,.36,0],c:o.jam,c2:o.jam2||o.jam});
  if(o.rev!==undefined)l.add(K.cyl(.092,.08,.07,5,{open:true}),{p:[x,.15,0],c:o.rev,jit:0});};
// bras : manche + poignet + main. o : {man, rev, main}
const bras=(a,sd,x,o)=>{a.add(K.cyl(.074,.062,.4,5),{p:[sd*x,1.0,0],c:o.man,c2:o.man2||o.man});
  if(o.rev!==undefined)a.add(K.cyl(.07,.07,.06,5,{open:true}),{p:[sd*x,.83,0],c:o.rev,jit:0});
  a.add(K.ico(.068,0),{p:[sd*x,.755,-.008],s:[.85,1,1],c:o.main,jit:.04});};
// buste trapu (épaules larges, 6 pans, un pan bien à plat devant : z ≈ −0,16 G)
const buste=(b,G,c,c2)=>b.add(K.cyl(.25*G,.215*G,.62,6,{a0:PI/6}),{p:[0,.93,0],s:[1,1,.8],c,c2:c2===undefined?c:c2,jit:.05});
const anneau=(b,y,rt,rb,h,c,o={})=>b.add(K.cyl(rt,rb,h,o.seg||6,{open:true,a0:PI/6}),{p:[0,y,o.z||0],s:[1,1,o.sz||.8],c,c2:o.c2===undefined?c:o.c2,ch:o.ch||'m',jit:o.jit===undefined?.04:o.jit});

// ---------------------------------------------------------------- pnj.villageois
MODELS['pnj.villageois']=ctx=>{const th=1,v=borne(Math.round(+ctx.v||0),0,2),b=K.make(800+th*10+v),lL=K.make(801+th*10+v),lR=K.make(802+th*10+v),aL=K.make(803+th*10+v),aR=K.make(804+th*10+v);
  const G=[1,1.16,.9][v],sk=PEAUX[(th*2+v)%4];let L,A;     // G : corpulence · L, A : habits des jambes et des bras
  {   // ---------------- Céleste : toge claire, galons d'or
    const T=[0xf3ecdc,0xdfe6f6,0xf2dfe6][v],TD=K.shade(T,.8),AC=[OR,0x4a5aa8,0xc9952a][v];
    buste(b,G,TD,T);anneau(b,.55,.215*G,.3*G,.34,TD,{c2:T});                                         // toge : buste et jupe longue
    anneau(b,.4,.305*G,.31*G,.045,OR,{jit:0});anneau(b,.74,.225*G,.225*G,.06,OR,{jit:0});            // ourlet et ceinture d'or
    b.add(K.box(.13,.6,.05),{p:[.02,.98,-.158*G],r:[0,0,.5],c:AC,jit:.03});                           // drapé en travers du buste
    b.add(K.oct(.05),{p:[-.17*G,1.21,-.14*G],s:[1,1,.6],c:OR,jit:0});                                  // agrafe à l'épaule
    tete(b,sk);
    if(v===0){b.add(K.dome(HR+.012,7,2),{p:[0,HY+.03,.02],c:0x6a4a2c,jit:.05});                        // cheveux bruns, couronne de laurier d'or
      b.add(K.cyl(.215,.225,.04,7,{open:true}),{p:[0,HY+.09,.02],r:[.18,0,0],c:OR,jit:0});
      b.sym(sd=>b.add(K.cone(.03,.09,3),{p:[sd*.19,HY+.14,-.05],r:[-.5,0,-sd*.3],c:OR,jit:0}));
    }else if(v===1){b.add(K.dome(HR+.03,7,3),{p:[0,HY+.02,.03],s:[1,1,1.05],c:0x3a4a98,c2:0x4a5aa8,jit:.04});   // voile bleu nuit galonné, corpulente
      b.add(K.box(.36,.4,.05,.8,1),{p:[0,HY-.2,.19],r:[.15,0,0],c:0x3a4a98});
      b.add(K.cyl(.243,.243,.03,7,{open:true}),{p:[0,HY+.03,.03],c:OR,jit:0});
      b.add(K.oct(.035),{p:[0,HY+.13,-.2],s:[1,1.3,.6],c:OR,jit:0});
    }else{b.add(K.cyl(.19,.215,.07,7,{open:true}),{p:[0,HY+.03,.03],c:PAL.white,jit:.03});               // ancien : couronne de cheveux blancs, barbe, diadème
      b.add(K.cone(.11,.24,5),{p:[0,HY-.2,-.13],r:[PI-.25,0,0],c:PAL.white,c2:0xd8d4c8,jit:.04});
      b.add(K.cyl(.2,.2,.03,7,{open:true}),{p:[0,HY+.115,0],r:[.2,0,0],c:OR,jit:0});b.add(K.oct(.035),{p:[0,HY+.15,-.19],c:0x7ff3ff,jit:0});
      b.add(K.prism([[-.2,0],[.2,0],[.27,.75],[-.27,.75]],.03),{p:[0,1.2,.21*G],r:[PI/2-.12,0,0],c:0xc9952a,c2:OR,jit:.05});}   // cape d'or dans le dos
    L={jam:sk,bot:[0xb58652,0x8f6236,0xb58652][v],rev:OR};A={man:sk,man2:T,rev:OR,main:sk};
  }
  // --- jambes et bras (pièces animées : la marche)
  jambe(lL,-1,L);jambe(lR,1,L);const ax=.25*G+.07;bras(aL,-1,ax,A);bras(aR,1,ax,A);
  const an=ph=>[{k:'rot',axis:'x',amp:.5,sp:6,ph}];
  return{parts:[{name:'corps',b},
      {name:'legL',b:lL,parent:'corps',pivot:[-.115,.62,0],anim:an(0)},{name:'legR',b:lR,parent:'corps',pivot:[.115,.62,0],anim:an(PI)},
      {name:'armL',b:aL,parent:'corps',pivot:[-ax,1.2,0],anim:an(PI)},{name:'armR',b:aR,parent:'corps',pivot:[ax,1.2,0],anim:an(0)}],
    bake:{ground:.1,groundH:.3,map:{s:'m',x:'g'}},h:1.7,r:.35};};

// ---------------------------------------------------------------- pnj.animal
const renard=()=>{const b=K.make(861),t=K.make(862),q=K.make(863),W=0xf6f3ea,WD=0xcfd6e6,LU=0x9ff6ff;   // renard blanc à queue lumineuse (≈ 0,6 m)
  b.add(K.sph(.16,6,4),{p:[0,.3,.06],s:[1,1,1.85],c:WD,c2:W,flat:false,jit:0});
  b.add(K.cone(.13,.2,5),{p:[0,.32,-.2],r:[-1.9,0,0],c:W,jit:.04});                                           // jabot
  for(const sd of[1,-1])for(const z of[-.14,.26]){b.add(K.cyl(.04,.032,.2,4,{open:true}),{p:[sd*.085,.12,z],c:W,c2:WD});b.add(K.box(.07,.04,.1,.8,.8),{p:[sd*.085,.02,z-.015],c:0x3a4a78,jit:0});}   // pattes aux bouts bleu nuit
  b.add(K.cyl(.1,.11,.035,6,{open:true}),{p:[0,.37,-.2],r:[-.6,0,0],c:OR,jit:0});                              // collier d'or
  // tête (animée : elle hoche)
  t.add(K.sph(.125,6,4),{p:[0,.47,-.3],s:[1,.92,1],c:W,flat:false,jit:0});
  t.add(K.cone(.07,.17,5),{p:[0,.44,-.44],r:[-PI/2-.1,0,0],c:W,c2:WD,jit:.03});t.add(K.oct(.024),{p:[0,.435,-.53],c:NOIRC,jit:0});
  t.sym(sd=>{t.add(K.cone(.05,.15,4),{p:[sd*.075,.6,-.27],r:[.1,0,-sd*.25],c:W,c2:0x3a4a78,jit:.03});t.add(K.oct(.024),{p:[sd*.06,.495,-.405],s:[.6,1.2,.6],c:0xffcf5a,ch:'g',jit:0});});
  // queue en panache (animée), le bout luit
  q.add(K.tube([[0,.33,.33],[0,.4,.52],[0,.53,.66],[0,.64,.69]],[.05,.11,.115,.08],5),{c:WD,c2:W,jit:.04});
  q.add(K.tube([[0,.63,.69],[0,.74,.68],[0,.83,.62]],[.085,.06,0],5),{c:LU,c2:0xffffff,ch:'g',jit:0});
  return{parts:[{name:'corps',b},{name:'tete',b:t,parent:'corps',pivot:[0,.4,-.22],anim:[{k:'rot',axis:'x',amp:.1,sp:2.2},{k:'rot',axis:'y',amp:.25,sp:.9}]},
    {name:'queue',b:q,parent:'corps',pivot:[0,.33,.33],anim:[{k:'rot',axis:'y',amp:.45,sp:3.5}]}],bake:{ground:.1,groundH:.2},h:.9};};
MODELS['pnj.animal']=ctx=>renard();
// pnj.guide (V10.3) : le Guide. Le même personnage partout — « Guide » au lobby, « Règles » dans chaque mini-jeu — pour qu'on sache au premier regard que c'est lui qui explique.
// C'est l'habitant céleste mince, avec un chapeau pointu doré à étoile, une écharpe bleue et un livre dans la main droite. Mêmes pièces que pnj.villageois (marche).
MODELS['pnj.guide']=ctx=>{const r=MODELS['pnj.villageois']({v:0}),b=r.parts[0].b,aR=r.parts[4].b,BLEU=0x3fa7c9;
  b.add(K.cyl(.31,.31,.035,10),{p:[0,HY+.175,0],c:OR,jit:0});
  b.add(K.cone(.2,.44,8),{p:[0,HY+.4,0],c:OR,c2:ORD,jit:.02});
  b.add(K.oct(.075),{p:[0,HY+.7,0],c:0xfff3b0,ch:'g',jit:0});
  b.add(K.cyl(.2,.22,.11,6,{open:true,a0:PI/6}),{p:[0,1.21,0],s:[1,1,.82],c:BLEU,jit:.03});
  b.add(K.box(.09,.3,.04),{p:[.09,1.02,-.19],r:[0,0,-.12],c:BLEU,jit:.02});
  aR.add(K.box(.21,.27,.07),{p:[.32,.73,-.11],r:[.25,0,0],c:0x7a3b2e,jit:.02});aR.add(K.box(.17,.23,.075),{p:[.32,.73,-.11],r:[.25,0,0],c:0xf3ead2,jit:0});
  return r;};
}
