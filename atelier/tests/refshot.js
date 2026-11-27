// captures de la refonte rôles et éléments (V12.1) : hall, menus des portails, arbre d'élément, arbre de Zéphyr.   usage : node tests/refshot.js [dossier]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const D=(process.argv[2]||'shots')+'/';const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(1500);const hide=()=>p.evaluate(()=>{for(const v of document.querySelectorAll('.veil'))v.hidden=true;});
 const shot=async(n,h)=>{if(h)await p.setViewportSize({width:966,height:h});await p.waitForTimeout(300);await p.screenshot({path:D+n+'.png'});if(h)await p.setViewportSize({width:966,height:366});};
 await hide();await p.evaluate(()=>{__g().hallDraw();document.getElementById('hallV').hidden=false;});await shot('ref-hall',560);
 await p.locator('#hallB .pick[data-el=vent]').evaluate(e=>e.click());await p.waitForTimeout(200);await shot('ref-hall-zephyr',560);
 await hide();await p.evaluate(()=>{__g().lobSync();document.getElementById('start').hidden=false;});await shot('ref-ile',900);
 await hide();await p.evaluate(()=>{__g().toitDraw();document.getElementById('toitV').hidden=false;});await shot('ref-toit',900);
 await hide();await p.evaluate(()=>{document.getElementById('hallA').click();});await p.waitForTimeout(400);await shot('ref-arbre-zephyr');
 console.log('erreurs',errs.length,errs.join('\n'));await b.close();})();
