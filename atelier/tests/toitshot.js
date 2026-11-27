// captures du deuxième portail (V10.1) à la taille de l'iPhone de Frédéric : le portail, son panneau, la salle d'armes, Dernier Toit ouvert, l'écran de retour.   usage : node tests/toitshot.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,300));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.addStyleTag({content:'#hud{padding:10px 62px 33px 62px!important}:root{--low:-25px!important;--edge:-62px!important}'});await p.waitForTimeout(2500);
 const G=(f,a)=>p.evaluate(f,a);await G(tl=>{DernierToit.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));
 await G(()=>{const g=__g(),P=g.LGAMES[1],L=g.LB;L.x=P.x+Math.sin(P.ry)*9;L.z=P.z+Math.cos(P.ry)*9;L.y=g.hAt(L.x,L.z);L.yaw=P.ry+Math.PI;L.pitch=.12;});await p.waitForTimeout(900);await p.screenshot({path:'shots3d/toit-1-portail.png'});
 await G(()=>__g().toitOpen());await p.waitForTimeout(500);await p.screenshot({path:'shots3d/toit-2-panneau.png'});
 await G(()=>{document.getElementById('toitV').hidden=true;__g().openTree('arme');});await p.waitForTimeout(600);await p.screenshot({path:'shots3d/toit-3-armes.png'});
 await G(()=>{document.getElementById('tree').hidden=true;document.getElementById('start').hidden=false;__g().lobSync();});await p.waitForTimeout(400);await p.screenshot({path:'shots3d/toit-4-ile.png'});
 await G(()=>{document.getElementById('start').hidden=true;__g().toitGo('terre');});await p.waitForTimeout(5000);await p.screenshot({path:'shots3d/toit-5-jeu.png'});
 const f=p.frames().find(fr=>fr!==p.mainFrame());await f.evaluate(()=>{parent.postMessage({dt:'fin',victoire:false,jour:4,tues:800,heros:'terre',arme:'pompe'},'*');parent.postMessage({dt:'retour'},'*');});await p.waitForTimeout(900);await p.screenshot({path:'shots3d/toit-6-retour.png'});
 console.log('erreurs',errs.length,errs.slice(0,5).join('\n'));await b.close();})();
