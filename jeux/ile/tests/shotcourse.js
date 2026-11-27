// captures de la V2.3 à la taille du téléphone (966 × 366) : en marche et en sprint, l'arme à la couleur de son élément.   usage : node tests/shotcourse.js [préfixe=shots/course-] [élément=eau] [arme=assaut]   (≈ 20 s)
const {chromium}=require('playwright');const path=require('path');const pre=process.argv[2]||'shots/course-',el=process.argv[3]||'eau',arme=process.argv[4]||'assaut';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 await p.addInitScript(([el,arme])=>{window.__noCiel=true;window.__keep=true;window.ILE_LOBBY={heros:'feu',arme,elements:{[arme]:el},mode:'normal'};},[el,arme]);
 await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 await p.evaluate(()=>{const g=__g(),s=g.sim,h=s.hero;h.x=20;h.z=10;h.yaw=0.5;h.pitch=-0.02;h.y=0;s.heroGod=true;});
 const joy=y=>p.evaluate(y=>{const c=document.getElementById('game'),o={pointerId:7,clientX:60,clientY:300,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientY:y})));},y);
 await p.screenshot({path:pre+'repos.png'});
 await joy(272);await p.waitForTimeout(1100);await p.screenshot({path:pre+'marche.png'});
 await p.evaluate(()=>{const c=document.getElementById('game');c.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,clientX:60,clientY:300,bubbles:true}));});await p.waitForTimeout(600);
 await joy(220);await p.waitForTimeout(2000);await p.screenshot({path:pre+'sprint.png'});
 console.log('erreurs',errs.length,errs.slice(0,3).join(' | '));await b.close();})();
