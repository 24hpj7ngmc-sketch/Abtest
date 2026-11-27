// V3.4 : escalade (Saut devient Descendre / Grimper au bord, une fois débloquée) et escalier qui porte ; captures
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const cdp=await ctx.newCDPSession(p);
  const tap=async sel=>{const bb=await (await p.$(sel)).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+bb.width*.75,y:bb.y+bb.height*.3,id:5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const lbl=()=>p.evaluate(()=>document.getElementById('bJump').firstChild.nodeValue);
  await p.evaluate(()=>{__dt.save.mode='out';__dt.save.lv={root:1};__dt.newGame(2);document.getElementById('big').style.display='none';const P=__dt.S.p;P.x=3;P.z=-11.8;P.y=H;P.yaw=0;P.pitch=-.6;});await p.waitForTimeout(400);
  T('V4.7 : sans aucune case, au bord du toit en regardant en bas : « Descendre »',await lbl()==='Descendre',await lbl());
  await tap('#bJump');await p.waitForTimeout(350);await p.screenshot({path:'shots/100-escalade.png'});await p.waitForFunction(()=>!__dt.S.p.clb,null,{timeout:8000});await p.waitForTimeout(200);
  T('descendu sur le balcon du 4e',await p.evaluate(()=>Math.abs(__dt.S.p.y-LVY(4))<.05&&__dt.S.p.z<-13),await p.evaluate(()=>__dt.S.p.y.toFixed(2)+' '+__dt.S.p.z.toFixed(2)));
  await p.evaluate(()=>{__dt.S.p.pitch=.7;});await p.waitForTimeout(250);T('sur le balcon en regardant en haut : « Grimper »',await lbl()==='Grimper',await lbl());
  await p.evaluate(()=>{__dt.S.p.pitch=0;});await p.waitForTimeout(250);T('ailleurs : « Saut »',await lbl()==='Saut');
  await p.evaluate(()=>{__dt.S.p.pitch=.7;});await p.waitForTimeout(250);await tap('#bJump');await p.waitForTimeout(300);await p.waitForFunction(()=>!__dt.S.p.clb,null,{timeout:8000});await p.waitForTimeout(200);
  T('remonté sur le toit',await p.evaluate(()=>Math.abs(__dt.S.p.y-H)<.05),await p.evaluate(()=>__dt.S.p.y.toFixed(2)));
  // l'arbre : la case Escalade
  T('V4.7 : escalade offerte (plus de case), la Tyrolienne à sa place',await p.evaluate(()=>!NODES.some(n=>n.id==='m_grimpe')&&NODES.some(n=>n.id==='m_tyro'&&n.req==='s_hp')&&derive({root:1}).grimpe.on&&!derive({root:1}).tyro.on));
  await p.evaluate(()=>openTree('run'));await p.waitForTimeout(400);await p.screenshot({path:'shots/101-arbre-escalade.png'});
  // escalier : dans la cage, pousser vers l'avant suffit à monter d'un étage
  const y0=await p.evaluate(()=>{document.getElementById('tree').hidden=true;running=false;const S=__dt.S,P=S.p;P.x=-1;P.y=0;P.z=-2.6;P.yaw=Math.PI;P.pitch=0;P.gl=0;
    for(let i=0;i<210;i++)playerStep(S,1/60,{f:1,r:0,yaw:P.yaw,pitch:0,sprint:false});return P.y;});
  T('escalier : avant tenu, on arrive au 1er',Math.abs(y0-LVY1())<.05,y0);
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
function LVY1(){return 4.2;}
