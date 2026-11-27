// capture du lobby à la taille du téléphone (966 × 366), l'arme en main pendant la course (V12.7).   usage : node tests/armeshot.js [element=eau] [arme=assaut] [fichier=shots/lobby-arme.png]
const {chromium}=require('playwright');const path=require('path');
const el=process.argv[2]||'eau',arme=process.argv[3]||'assaut',out=process.argv[4]||'shots/lobby-arme.png';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,400));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;window.__nodemo=true;window.__nohv=true;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 await p.evaluate(([el,arme])=>{const g=__g();g.save.wel={};g.save.wel[arme]=el;g.setWeap(arme);g.lobTool('arme');const L=g.LB;L.x=0;L.z=-26;L.yaw=Math.PI;L.pitch=.02;L.y=g.hAt(L.x,L.z);
   window.__run=setInterval(()=>{g.joy.f=1;g.joy.r=0;},8);},[el,arme]);
 await p.waitForTimeout(1700);
 await p.screenshot({path:out});
 console.log('sprint',await p.evaluate(()=>{const g=__g();return JSON.stringify({spk:+g.LB.spk.toFixed(2),fov:+g.lcam.fov.toFixed(1),key:g.LA.key,err:window.__mdlErr||[]});}),'· erreurs',errs.length);console.log([...new Set(errs)].slice(0,8).join('\n'));await b.close();})();
