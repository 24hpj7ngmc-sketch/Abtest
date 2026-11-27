// test rapide des arbres d'une arme (V9.0) : l'écran de la salle d'armes (onglets Général / mini-jeu / Élément), les achats, la sauvegarde.   usage : node tests/runarm.js   (≈ 5 s)
// (l'effet des cases dans les règles se teste dans l'atelier de L'Île des Cinq)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(600);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);},tap=async s=>{await p.locator(s).first().evaluate(el=>el.click());await p.waitForTimeout(60);};
 // ---------- l'écran : quatre onglets ----------
 await G(()=>{const g=__g();g.save.we={};g.save.wl.pistolet={m1:1};g.save.gold=5000;g.openTree('arme');});await p.waitForTimeout(150);
 const tabs=()=>p.locator('#tArms .ray.tabs .tchip').allInnerTexts(),nodes=()=>p.locator('#tMap button.tn').evaluateAll(E=>E.map(e=>e.getAttribute('aria-label')));
 ok('quatre onglets : Général, L\'Île des Cinq, Dernier Toit, Élément',(await tabs()).join('|')==='Général|L\'Île des Cinq|Dernier Toit|Élément · niv. 0');let N=await nodes();
 ok('Général : 6 cases, sans la Marque ('+N.length+')',N.length===6&&!N.includes('Marque renforcée')&&N.includes('Dégâts du tir'));
 await tap('#tArms .tchip[data-tab=ile]');N=await nodes();ok('L\'Île des Cinq : Marque (niveau gardé), Tueur de boss, Prime de chasse',N.join('|')==='Marque renforcée|Tueur de boss|Prime de chasse'&&await p.locator('#tMap button.tn[data-id=m1]').evaluate(e=>e.classList.contains('own')));
 await tap('#tMap button.tn[data-id=b1]');await tap('#tBuy');ok('achat de « Tueur de boss » : payé en or céleste, gardé avec l\'arme',await G(()=>{const g=__g();return g.save.wl.pistolet.b1===1&&g.save.gold<5000&&JSON.parse(localStorage.getItem('ile5-save')).wl.pistolet.b1===1;}));
 await tap('#tArms .tchip[data-tab=el]');N=await nodes();ok('Élément : 12 cases, six branches dont le Vent ('+N.length+')',N.length===12&&N.includes('Balles explosives')&&N.includes('Balles lourdes')&&N.includes('Balles traversantes')&&(await p.locator('#tTitle').textContent()).startsWith('Élément des balles'));
 await tap('#tMap button.tn[data-id=f1]');await tap('#tBuy');ok('achat de « Balles explosives » : gardé dans la sauvegarde, commun aux armes',await G(()=>{const g=__g();return g.save.we.f1===1&&JSON.parse(localStorage.getItem('ile5-save')).we.f1===1&&g.heroMods('feu').eFireR===.7&&!g.heroMods('eau').eFireR;}));
 await tap('#tArms .tchip[data-w=sniper]');ok('changer d\'arme garde l\'onglet Élément et ses niveaux',await G(()=>__g().getTab()==='el'&&__g().getWeap()==='sniper')&&await p.locator('#tMap button.tn[data-id=f1]').evaluate(e=>e.classList.contains('own')));
 await tap('#tArms .tchip[data-tab=ile]');ok('le sniper a son propre arbre de L\'Île des Cinq, à zéro',(await nodes()).length===3&&!(await p.locator('#tMap button.tn[data-id=b1]').evaluate(e=>e.classList.contains('own'))));
  // (changer d'arme en partie, recharges doublées : ces contrôles ont suivi le jeu dans son atelier — tests/runpartie.js de L'Île des Cinq)
 await p.screenshot({path:'shots/91-arbres.png'});
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
