// V2.5 : cercle de portée au sol quand on vise un emplacement au marteau, et cercles sur la grande carte
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  await p.evaluate(()=>{const s=__dt.save;s.runs=5;s.mode='out';s.lv={root:1,t_slot:4,mo_unl:1,la_unl:1};s.layout={0:'mg',4:'mg',2:'la',8:'mo'};__dt.newGame(3);document.getElementById('big').style.display='none';document.getElementById('wave').style.display='none';
    __dt.setTool('marteau');const S=__dt.S,sl=SLOTS[1];Object.assign(S.p,{x:sl.x*.55,z:sl.z*.55,y:LVY(5),yaw:Math.atan2(-(sl.x-sl.x*.55),-(sl.z-sl.z*.55)),pitch:-.55});});
  await p.waitForTimeout(900);const st=await p.evaluate(()=>__dt.ui);T('le marteau vise l\'emplacement',st&&st.aimSlot===1,JSON.stringify(st));
  await p.screenshot({path:'shots/96-portee-marteau.png'});
  const vis=await p.evaluate(()=>{const S=__dt.S,s=SLOTS[1],R=turretReach(S,s,'mg');return {r:R.r.toFixed(1)};});T('portée mitrailleuse du toit ramenée au sol',+vis.r>26&&+vis.r<28,vis.r+' m');
  // vue de haut pour voir tout le cercle
  await p.evaluate(()=>{window.__cam={x:0,y:70,z:12,yaw:0,pitch:-1.25};});await p.waitForTimeout(900);await p.screenshot({path:'shots/97-portee-dessus.png'});
  await p.evaluate(()=>{window.__cam=null;openMap();});await p.waitForTimeout(500);await p.screenshot({path:'shots/98-portee-carte.png'});
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
