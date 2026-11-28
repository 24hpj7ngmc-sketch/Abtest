// capture du Hall des héros avec Braise en Eau (V12.9), à la taille du téléphone (966 × 366).   usage : node tests/hallshot.js [fichier=shots/hall-element.png]
const {chromium}=require('playwright');const path=require('path');
const out=process.argv[2]||'shots/hall-element.png';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,300));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;window.__nodemo=true;window.__nohv=true;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 await p.evaluate(()=>{const g=__g();for(const v of document.querySelectorAll('.veil'))v.hidden=true;g.setHEl('feu','eau');g.lobSync();g.hallDraw();document.getElementById('hallV').hidden=false;});
 await p.evaluate(()=>{document.getElementById('hallEl').scrollIntoView({block:'end'});});await p.waitForTimeout(900);await p.screenshot({path:out});
 console.log('capture',out,'· erreurs',errs.length);console.log([...new Set(errs)].slice(0,6).join('\n'));await b.close();})();
