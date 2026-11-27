// captures des deux menus de portail côte à côte et du hall (V11.4), pour vérifier qu'ils se ressemblent.   usage : node tests/menushot.js [dossier]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const D=(process.argv[2]||'shots')+'/';const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:844,height:900},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(1500);const hide=()=>p.evaluate(()=>{for(const v of document.querySelectorAll('.veil'))v.hidden=true;});
 await hide();await p.evaluate(()=>{__g().lobSync();document.getElementById('start').hidden=false;});await p.waitForTimeout(400);await p.screenshot({path:D+'menu-ile.png'});
 await hide();await p.evaluate(()=>{__g().toitDraw();document.getElementById('toitV').hidden=false;});await p.waitForTimeout(300);await p.screenshot({path:D+'menu-toit.png'});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);await p.screenshot({path:D+'menu-toit-tel.png'});
 await hide();await p.evaluate(()=>{document.getElementById('start').hidden=false;});await p.waitForTimeout(300);await p.screenshot({path:D+'menu-ile-tel.png'});
 console.log('erreurs',errs.length,errs.join('\n'));await b.close();})();
