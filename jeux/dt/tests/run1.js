// essai rapide : accueil, partie, pose d'une tourelle, un jour lancé ; captures à la taille du téléphone ; zéro erreur attendue
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|fonts/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(1500);
  await p.screenshot({path:'shots/01-accueil.png'});
  await p.locator('#sGo').tap();await p.waitForTimeout(1200);
  await p.screenshot({path:'shots/02-toit.png'});
  // marteau, regarder vers un coin, poser
  await p.evaluate(()=>{__dt.setTool('marteau');const S=__dt.S;S.p.yaw=Math.atan2(-(-7-S.p.x),-(-7-S.p.z));S.p.pitch=-.45;});
  await p.waitForTimeout(500);await p.screenshot({path:'shots/03-marteau.png'});
  {const r=await p.locator('#padMain').boundingBox();await p.touchscreen.tap(r.x+r.width*.3,r.y+r.height*.85);}await p.waitForTimeout(300);
  console.log('tourelles posées',await p.evaluate(()=>__dt.S.tur.length));
  await p.evaluate(()=>{__dt.setTool('fusil');__dt.startDay(__dt.S);const S=__dt.S;S.p.yaw=0;S.p.pitch=-.25;});
  await p.waitForTimeout(9000);
  await p.screenshot({path:'shots/04-jour.png'});
  // avancer le temps : on accélère la partie pour voir des zombies grimper
  await p.evaluate(()=>{const S=__dt.S;for(let i=0;i<900;i++){step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:S.p.pitch});S.ev.length=0;}S.p.x=0;S.p.z=-8.3;S.p.yaw=0;S.p.pitch=-1.1;});
  await p.waitForTimeout(1500);await p.screenshot({path:'shots/05-facade.png'});
  const st=await p.evaluate(()=>{const S=__dt.S;let c=[0,0,0,0,0,0];for(let k=0;k<S.nAct;k++)c[S.z.st[S.act[k]]]++;return{phase:S.phase,act:S.nAct,st:c,kills:S.runKills,hp:Math.round(S.p.hp),fr:window.__frames};});
  console.log(JSON.stringify(st));
  console.log('erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
