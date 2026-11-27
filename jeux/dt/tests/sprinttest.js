// le sprint au joystick (vrais appuis tactiles) : pousser presque à fond vers l'avant, il tient, il relève de Sneak, pas en visée
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>{__dt.save.runs=5;__dt.save.mode='out';__dt.newGame(1);document.getElementById('big').style.display='none';});await p.waitForTimeout(500);
  const cdp=await ctx.newCDPSession(p);const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+' — '+x);};
  const run=async(path_,ms,before)=>{await p.evaluate(()=>{Object.assign(__dt.S.p,{x:-11,z:-11.5,y:LVY(5),yaw:-Math.PI/2,pitch:0});});if(before)await before();
    await touch('touchStart',[{x:120,y:250,id:3}]);for(const [dx,dy] of path_){await touch('touchMove',[{x:120+dx,y:250-dy,id:3}]);await p.waitForTimeout(60);}
    const t0=await p.evaluate(()=>[__dt.S.p.x,__dt.S.t]);await p.waitForTimeout(ms);
    const t1=await p.evaluate(()=>{const j=document.getElementById('joy').classList;return[__dt.S.p.x,__dt.S.t,j.contains('sprint')?'sprint':'',__dt.S.p.crouch,j.contains('on')];});await touch('touchEnd',[]);await p.waitForTimeout(200);
    const apres=await p.evaluate(()=>document.getElementById('joy').classList.contains('on'));
    return {v:(t1[0]-t0[0])/(t1[1]-t0[1]),cls:t1[2],crouch:t1[3],allume:t1[4]&&!apres};};
  let r=await run([[0,20],[0,30]],600);T('à mi-course : on marche',r.v>2&&r.v<4.4&&!r.cls,r.v.toFixed(2)+' m/s');
  T('V4.5 : le joystick s\'allume sous le pouce et s\'éteint quand il part',r.allume,String(r.allume));
  r=await run([[0,20],[0,40]],600);T('poussé presque à fond : on court',r.v>6.3&&r.cls==='sprint',r.v.toFixed(2)+' m/s');
  r=await run([[0,20],[0,44],[0,30]],600);T('le pouce revient un peu : on court toujours',r.v>7&&r.cls==='sprint',r.v.toFixed(2)+' m/s');
  r=await run([[0,44]],600,async()=>{const s=await p.$('#bSneak');const bb=await s.boundingBox();await touch('touchStart',[{x:bb.x+bb.width/2,y:bb.y+bb.height/2,id:5}]);await touch('touchEnd',[]);await p.waitForTimeout(150);});
  T('accroupi (Sneak) puis poussé à fond : il se relève et court',r.v>7&&!r.crouch,r.v.toFixed(2)+' m/s, accroupi '+r.crouch);
  // captures : marche, départ du sprint (le coup), sprint établi
  await p.evaluate(()=>{Object.assign(__dt.S.p,{x:-11,z:-11.5,y:LVY(5),yaw:-Math.PI/2,pitch:-.1});});
  await touch('touchStart',[{x:120,y:250,id:3}]);await touch('touchMove',[{x:120,y:225,id:3}]);await p.waitForTimeout(700);await p.screenshot({path:'shots/80-marche.png'});
  await touch('touchMove',[{x:120,y:206,id:3}]);await p.waitForTimeout(120);await p.screenshot({path:'shots/81-sprint-depart.png'});
  await p.waitForTimeout(900);await p.screenshot({path:'shots/82-sprint.png'});await touch('touchEnd',[]);
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
