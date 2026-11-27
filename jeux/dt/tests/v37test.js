// V3.7 : échelles des passerelles (on marche dedans), rideaux du rez-de-chaussée ouverts en mode fuite, vol libre au double appui sur Saut (mode dev)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const dbl=()=>p.evaluate(()=>{const e=document.getElementById('bJump');for(let k=0;k<2;k++){e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:20+k}));e.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:20+k}));}});
  await p.evaluate(()=>{__dt.save.mode='out';__dt.save.dev=true;devO.fly=false;__dt.newGame(2);document.getElementById('big').style.display='none';});await p.waitForTimeout(400);
  await dbl();await p.waitForTimeout(200);T('mode dev : double appui sur Saut = vol libre',await p.evaluate(()=>devO.fly===true&&flying()));
  await dbl();await p.waitForTimeout(200);T('encore un double appui = vol coupé',await p.evaluate(()=>devO.fly===false));
  await p.evaluate(()=>{__dt.save.dev=false;});await dbl();await p.waitForTimeout(200);T('sans le mode dev : rien',await p.evaluate(()=>devO.fly===false));
  // échelle : on se place au pied, face à l'échelle, joystick vers l'avant (on simule la poussée sans faire tourner la boucle)
  const up=await p.evaluate(()=>{running=false;const S=__dt.S,P=S.p,L=LADDERS[0];P.x=L.foot[0]+L.ox*1.2;P.z=L.foot[2]+L.oz*1.2;P.y=0;P.ground=true;P.yaw=Math.atan2(L.ox,L.oz);P.pitch=.15;
    for(let i=0;i<60;i++)playerStep(S,1/60,{f:1,r:0,yaw:P.yaw,pitch:P.pitch,sprint:false});return !!P.clb;});
  T('au pied d\'une échelle, en avançant : on monte',up);await p.evaluate(()=>{running=true;});await p.waitForTimeout(600);await p.screenshot({path:'shots/109-echelle.png'});
  await p.waitForFunction(()=>!__dt.S.p.clb,null,{timeout:10000});T('arrivé sur la passerelle',await p.evaluate(()=>Math.abs(__dt.S.p.y-PASSY)<.05));
  // rez-de-chaussée : sortir par un rideau
  const outd=await p.evaluate(()=>{running=false;const S=__dt.S,P=S.p;P.x=0;P.y=0;P.z=-8;P.yaw=0;for(let i=0;i<150;i++)playerStep(S,1/60,{f:1,r:0,yaw:0,pitch:0,sprint:false});return P.z;});
  T('rez-de-chaussée : on sort par le rideau (mode fuite)',outd<-13.5,outd.toFixed(1));
  await p.evaluate(()=>{running=true;const P=__dt.S.p;P.x=0;P.z=-17;P.yaw=Math.PI;P.pitch=0;});await p.waitForTimeout(500);await p.screenshot({path:'shots/110-rideau-rdc.png'});
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
