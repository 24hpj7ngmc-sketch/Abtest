// V3.5 : boutiques façon Warzone (toit et rez-de-chaussée) : le bouton « Boutique » n'apparaît qu'à côté ; captures
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const cdp=await ctx.newCDPSession(p);const tap=async sel=>{const bb=await (await p.$(sel)).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+bb.width/2,y:bb.y+bb.height/2,id:5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const vis=()=>p.isVisible('#bTree');
  await p.evaluate(()=>{__dt.save.mode='out';__dt.newGame(1);document.getElementById('big').style.display='none';});await p.waitForTimeout(500);
  T('mode fuite, loin d\'une boutique (départ) : pas de bouton',!(await vis()));
  // vue depuis le départ vers la boutique du toit
  await p.evaluate(()=>{const P=__dt.S.p,s=SHOPS[0];P.yaw=Math.atan2(-(s.x-P.x),-(s.z-P.z));P.pitch=-.15;});await p.waitForTimeout(500);await p.screenshot({path:'shots/102-boutique-toit.png'});
  await p.evaluate(()=>{const P=__dt.S.p,s=SHOPS[0];P.x=s.x-1.6;P.z=s.z;P.yaw=-Math.PI/2;P.pitch=-.2;});await p.waitForTimeout(400);
  T('à côté de la boutique du toit : « Boutique »',await vis()&&(await p.textContent('#bTree'))==='Boutique');
  await p.screenshot({path:'shots/103-boutique-pres.png'});
  await tap('#bTree');await p.waitForTimeout(400);T('elle ouvre les améliorations (jeu en pause)',await p.isVisible('#tree')&&await p.evaluate(()=>!running));
  await tap('#tClose');await p.waitForTimeout(300);T('on referme : le jeu reprend',!(await p.isVisible('#tree'))&&await p.evaluate(()=>running));
  await p.evaluate(()=>{startDay(__dt.S);});await p.waitForTimeout(300);T('pendant le jour aussi',await vis());
  await p.evaluate(()=>{const P=__dt.S.p;P.x=0;P.z=-7;});await p.waitForTimeout(300);T('on s\'éloigne : le bouton disparaît',!(await vis()));
  await p.evaluate(()=>{const P=__dt.S.p,s=SHOPS[1];P.x=s.x+1.7;P.y=0;P.z=s.z+.3;P.yaw=Math.PI/2;P.pitch=-.15;});await p.waitForTimeout(500);
  T('au rez-de-chaussée, à côté de l\'autre : « Boutique »',await vis());await p.screenshot({path:'shots/104-boutique-rdc.png'});
  T('la boutique est solide',await p.evaluate(()=>{const P=__dt.S.p,s=SHOPS[1],x0=P.x;for(let i=0;i<60;i++)playerStep(__dt.S,1/60,{f:1,r:0,yaw:Math.PI/2,pitch:0,sprint:false});return P.x>s.x+.4;}));
  T('carte : la grande carte se dessine',await p.evaluate(()=>{openMap();const ok=!!document.getElementById('mapC');document.getElementById('mapV').hidden=true;return ok;}));
  // Ils arrivent : pas de boutique, le bouton revient entre deux jours
  await p.evaluate(()=>{__dt.save.mode='in';__dt.newGame(2);document.getElementById('big').style.display='none';});await p.waitForTimeout(500);
  T('Ils arrivent : « Améliorations » entre deux jours, boutiques absentes et pas solides',await vis()&&(await p.textContent('#bTree'))==='Améliorations'&&await p.evaluate(()=>BOX.filter(o=>o.t==='shop').every(o=>o.dead)));
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
