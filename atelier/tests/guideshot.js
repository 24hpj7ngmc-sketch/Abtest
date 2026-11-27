// captures du Guide du lobby (V10.3) à la taille de l'iPhone de Frédéric : l'accueil, un arrêt de la visite, ses sujets.   usage : node tests/guideshot.js   → shots3d/guide-*.png
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,300));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;window.__guide=true;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.addStyleTag({content:'#hud{padding:10px 62px 33px 62px!important}:root{--low:-25px!important;--edge:-62px!important}'});await p.waitForTimeout(2600);
 const G=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),shot=n=>p.screenshot({path:'shots3d/guide-'+n+'.png'});
 // face au Guide, à l'arrivée
 await G(()=>{const g=__g(),U=g.GUIDE,L=g.LB;L.yaw=Math.atan2(-(U.x-L.x),-(U.z-L.z));L.pitch=-.05;});await W(700);await shot('1-accueil');
 await p.locator('#gNext').evaluate(e=>e.click());await W(900);
 await G(()=>{const g=__g(),D=g.getGD(),L=g.LB;L.yaw=Math.atan2(-(D.p[0]-L.x),-(D.p[1]-L.z));L.pitch=.1;});await W(600);await shot('2-colonne');
 await G(()=>{const g=__g(),D=g.getGD(),U=g.GUIDE,L=g.LB;L.x=U.x+(L.x-U.x)*.0+3.2*Math.sin(1);L.z=U.z+3.2*Math.cos(1);L.y=g.hAt(L.x,L.z);L.yaw=Math.atan2(-(U.x-L.x),-(U.z-L.z));L.pitch=-.12;});await W(700);await shot('3-pres');
 await G(()=>{__g().guideEnd(false);});await W(900);await G(()=>{__g().guideTalk();});await W(400);await shot('4-sujets');
 console.log('erreurs',errs.length,errs.slice(0,5).join('\n'));await b.close();})();
