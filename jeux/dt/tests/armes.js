// V2.2 : les armes (mode « Ils s'échappent ») — choix par la sous-barre, en main, visée, lunette du sniper, tir ; captures 966×366
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>{__dt.save.runs=5;__dt.save.mode='out';__dt.save.weap='fusil';__dt.newGame(3);document.getElementById('big').style.display='none';document.getElementById('wave').style.display='none';
    Object.assign(__dt.S.p,{x:0,z:-12.2,y:LVY(5),yaw:0,pitch:-.45});});
  const cdp=await ctx.newCDPSession(p);const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
  const tap=async sel=>{const bb=await (await p.$(sel)).boundingBox();await touch('touchStart',[{x:bb.x+bb.width/2,y:bb.y+bb.height/2,id:9}]);await touch('touchEnd',[]);await p.waitForTimeout(120);};
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const chips=await p.evaluate(()=>[...document.querySelectorAll('#sub button')].map(b=>b.textContent));T('sous-barre : 6 armes',chips.join(',')==='Fusil,Pistolet,Assaut,Sniper,Pompe,Flammes',chips.join(','));
  for(const w of['pistolet','assaut','sniper']){await tap('#hot .slot[data-k="fusil"]');await tap(`#sub button[data-w="${w}"]`);await p.waitForTimeout(700);
    const st=await p.evaluate(()=>({w:__dt.S.weap,lab:document.querySelector('#hot .slot[data-k="fusil"] small').textContent,save:__dt.save.weap}));T('choisir '+w,st.w===w&&st.save===w,JSON.stringify(st));
    await p.screenshot({path:'shots/90-'+w+'.png'});}
  // sniper : Tir tenu = lunette, relâché = un coup
  await p.evaluate(()=>{__dt.startDay(__dt.S);});await p.waitForTimeout(300);
  const fb=await (await p.$('#bFire')).boundingBox();const k0=await p.evaluate(()=>__dt.S.ev.length);
  const n0=await p.evaluate(()=>{window.__shots=0;const S=__dt.S;const o=S.ev.push.bind(S.ev);S.ev.push=e=>{if(e.k==='shot')window.__shots++;return o(e);};return 0;});
  await touch('touchStart',[{x:fb.x+fb.width*.3,y:fb.y+fb.height*.75,id:4}]);await p.waitForTimeout(700);
  const sc=await p.evaluate(()=>({scope:document.getElementById('scope').classList.contains('on'),shots:window.__shots}));await p.screenshot({path:'shots/93-sniper-lunette.png'});
  T('sniper : Tir tenu ouvre la lunette sans tirer',sc.scope&&sc.shots===0,JSON.stringify(sc));
  await touch('touchEnd',[]);await p.waitForTimeout(500);const sc2=await p.evaluate(()=>({scope:document.getElementById('scope').classList.contains('on'),shots:window.__shots}));
  T('sniper : relâché, un seul coup part et la lunette se ferme',!sc2.scope&&sc2.shots===1,JSON.stringify(sc2));
  // assaut : cadence
  await tap('#hot .slot[data-k="fusil"]');await tap('#sub button[data-w="assaut"]');await p.waitForTimeout(500);await p.evaluate(()=>{document.getElementById('act').classList.remove('quiet');});
  await p.evaluate(()=>{window.__shots=0;});await touch('touchStart',[{x:fb.x+fb.width*.3,y:fb.y+fb.height*.75,id:4}]);const t0=await p.evaluate(()=>__dt.S.t);await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>({n:window.__shots,t:__dt.S.t}));await touch('touchEnd',[]);T('assaut : environ 8,8 tirs par seconde',r.n/(r.t-t0)>7&&r.n/(r.t-t0)<10.5,(r.n/(r.t-t0)).toFixed(1)+' tirs/s');
  // visée de l'assaut
  await tap('#bFree');await p.waitForTimeout(600);await p.screenshot({path:'shots/94-assaut-visee.png'});await tap('#bFree');
  // mode « Ils arrivent » : pas de choix
  await p.evaluate(()=>{__dt.save.mode='in';__dt.newGame(1);});await p.waitForTimeout(300);const inSub=await p.evaluate(()=>({hid:document.getElementById('sub').hidden,w:weapOf(__dt.S).short}));
  T('« Ils arrivent » : le fusil seul, pas de sous-barre',inSub.hid&&inSub.w==='Fusil',JSON.stringify(inSub));
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
