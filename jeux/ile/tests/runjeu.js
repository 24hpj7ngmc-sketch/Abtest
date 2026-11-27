// En partie : changer d'arme (les six armes, leurs réglages donnés par le lobby), les recharges, le Guide près du cœur et sa fiche « Règles ».   usage : node tests/runjeu.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
  const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  // le lobby donne, pour chaque arme, ce que ses arbres apportent : ici le sniper a deux niveaux de « Dégâts du tir » (+0,2)
  await p.addInitScript(()=>{window.__noCiel=true;window.ILE_LOBBY={heros:'feu',arme:'pistolet',bonus:{mods:{feu:{pistolet:{},sniper:{hDmg:0.2}}}}};});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(800);
  const G=(f,a)=>p.evaluate(f,a),W=ms=>p.waitForTimeout(ms),ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 await G(()=>__g().setArs([{w:'pistolet',el:'feu'},{w:'sniper',el:'eau'},{w:'fusil',el:'bois'}]));await p.waitForTimeout(100); // V2.0 : seulement les 3 armes choisies au début de la partie
 const m0=await G(()=>JSON.stringify(__g().sim.m));const chips=await p.locator('#sub .tchip').allInnerTexts();
 ok('en partie, l\'outil Arme en main : la sous-barre propose les 3 armes choisies, avec leur élément ('+chips.join(', ')+')',await p.locator('#sub').isVisible()&&chips.join('|')==='Pistolet · Feu|Sniper · Eau|Fusil · Nature'&&await p.locator('#sub .tchip.sel').innerText()==='Pistolet · Feu');
 await p.locator('#sub .tchip[data-w=sniper]').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})));await p.waitForTimeout(150);
 const ms=await G(()=>{const g=__g(),m=g.sim.m;return{w:g.getWeap(),hCd:m.hCd,hDmg:m.hDmg,lab:document.querySelector('#hot .slot[data-t=pistolet] small').textContent,same:m===g.sim.hero.m};});
 ok('toucher Sniper : arme changée, son profil et son arbre entrent dans les réglages (cadence '+ms.hCd.toFixed(2)+', dégâts +'+ms.hDmg.toFixed(2)+'), la barre l\'affiche',ms.w==='sniper'&&Math.abs(ms.hCd-(-2.2))<.01&&ms.hDmg>3.4&&ms.lab==='Sniper'&&ms.same);
 await p.locator('#sub .tchip[data-w=pistolet]').evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})));await p.waitForTimeout(150);
 const back=await G(m0=>{const a=JSON.parse(m0),b=__g().sim.m;return Object.keys(a).every(k=>Math.abs((a[k]||0)-(b[k]||0))<1e-9);},m0);ok('revenir au Pistolet remet exactement les réglages de départ',back&&await G(()=>__g().getWeap()==='pistolet'));
 await G(()=>{const g=__g();g.send(['ab']);});await p.waitForTimeout(120);const ab=await G(()=>__g().sim.hero.ab);ok('recharge de la compétence doublée (Brasier : '+ab.toFixed(1)+' s, 9 s avant)',ab>17&&ab<=18.01);
  // ---------- le Guide en partie : le même personnage qu'au lobby, « Règles »
 const r0=await G(()=>{const g=__g();return{near:g.getRulesNear(),btn:!document.getElementById('bRules').hidden,d:Math.hypot(g.RULEP[0],g.RULEP[1]),dS:Math.hypot(g.RULEP[0]-g.SHOP[0],g.RULEP[1]-g.SHOP[1]),dH:Math.hypot(g.RULEP[0]-g.HIREP[0],g.RULEP[1]-g.HIREP[1])};});
 ok('le Guide se tient à 10 m du cœur, à l\'écart du marchand et du marchand d\'esclaves ; loin de lui, pas de bouton',Math.abs(r0.d-10)<.1&&r0.dS>4&&r0.dH>4&&!r0.btn,r0);
 await G(()=>{const g=__g(),h=g.sim.hero;h.x=g.RULEP[0]+2;h.z=g.RULEP[1];});await W(400);
 ok('près de lui : le bouton « Règles » apparaît',await p.locator('#bRules').isVisible());
 await p.locator('#bRules').dispatchEvent('pointerdown');await W(300);
 const r1=await G(()=>({vis:!document.getElementById('guideV').hidden,title:document.getElementById('guT').textContent,tabs:[...document.querySelectorAll('#guTabs .tchip')].map(b=>b.textContent).join('|'),act:document.getElementById('guA').hidden?'':document.getElementById('guA').textContent,first:document.querySelector('#guB .srow small').textContent}));
 ok('la fiche de règles : cinq onglets toujours dans le même ordre, et le tuto pas à pas proposé avant la première vague',r1.vis&&/Règles · L.Île des Cinq/.test(r1.title)&&r1.tabs==='Le but|Perdre|Commandes|Ce jeu|Ce que ça rapporte'&&r1.act==='Tuto pas à pas'&&/20 vagues en Normal, 10 en Difficile/.test(r1.first),r1);
 await p.locator('#guTabs .tchip[data-k="4"]').evaluate(e=>e.click());await W(150);
 ok('onglet « Ce que ça rapporte » : les vrais chiffres du barème',/10 or céleste et 20 éclats/.test(await p.locator('#guB').innerText())&&/×1,25/.test(await p.locator('#guB').innerText()));
 await p.locator('#guX').evaluate(e=>e.click());
  console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();process.exit(bad?1:0);})();
