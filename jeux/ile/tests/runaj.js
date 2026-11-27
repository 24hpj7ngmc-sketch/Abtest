// test en partie du saut auto (réglage dans la carte) et du double appui sur les petits boutons (V8.4 ; Sneak à un seul appui depuis la V8.5).   usage : node tests/runaj.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.__noCiel=true;window.ILE_LOBBY=o;window.__msgs=[];const pm=window.postMessage.bind(window);window.postMessage=(m,q)=>{if(m&&m.ile)window.__msgs.push(m);return pm(m,q);};},{heros:'terre'});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(600);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);},tap=async s=>{await p.locator(s).tap({timeout:4000});await p.waitForTimeout(350);};
 const raw=async s=>{const bb=await p.locator(s).boundingBox();await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);};   // l'ultime prêt bat comme un cœur : on le touche à ses coordonnées
 await p.waitForTimeout(300);
 // un mur d'un bloc en travers, six mètres devant le héros, sur un terrain plat (20, 10)
 const built=await G(()=>{const g=__g(),s=g.sim,h=s.hero;s.gold=5000;h.x=20;h.z=10;h.yaw=0;h.pitch=0;h.y=0;return g.addWalls(s,16,4,24,4);});ok('mur posé devant le héros',built);
 const push=async ms=>{await p.evaluate(()=>{const c=document.getElementById('game'),o={pointerId:7,clientX:60,clientY:300,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientY:230})));});
   let top=0;for(let t=0;t<ms;t+=60){await p.waitForTimeout(60);top=Math.max(top,await G(()=>__g().sim.hero.y));}
   await p.evaluate(()=>{document.getElementById('game').dispatchEvent(new PointerEvent('pointerup',{pointerId:7,bubbles:true}));});await p.waitForTimeout(200);return top;};
 const reset=()=>G(()=>{const h=__g().sim.hero;h.x=20;h.z=10;h.yaw=0;h.pitch=0;h.y=0;h.vy=0;});
 ok('saut auto coupé par défaut',await G(()=>!__g().save.aj));
 let top=await push(1500),z=await G(()=>__g().sim.hero.z);ok('sans saut auto : le héros bute contre le mur (z = '+z.toFixed(1)+', hauteur max '+top.toFixed(2)+' m)',z>3&&top<.3);
 await reset();await tap('#mini');ok('option « Saut auto » dans la carte',(await p.locator('#mapOpt [data-a=aj]').innerText()).replace(/\s+/g,' ')==='Saut auto non');await tap('#mapOpt [data-a=aj]');
 ok('option passée à oui et gardée en mémoire',(await p.locator('#mapOpt [data-a=aj]').innerText()).includes('oui')&&await G(()=>__g().save.aj===true&&window.__msgs.some(m=>m.ile==='reglages'&&m.aj===true)));await tap('#mapOpt [data-a=close]');
 top=await push(1500);z=await G(()=>__g().sim.hero.z);ok('avec saut auto : le héros saute le mur tout seul (z = '+z.toFixed(1)+', hauteur max '+top.toFixed(2)+' m)',z<1.5&&top>1.5);
 // accroupi : pas de saut auto
 await reset();await G(()=>{__g().inp.sneak=true;});top=await push(1500);z=await G(()=>__g().sim.hero.z);ok('accroupi : pas de saut auto (z = '+z.toFixed(1)+')',z>3&&top<.3);await G(()=>{__g().inp.sneak=false;});
 // ---- petits boutons : deux appuis
 await reset();await G(()=>{const h=__g().sim.hero;h.ab=0;h.ult=100;});await p.waitForTimeout(200);
 await tap('#bAb');await p.waitForTimeout(500);ok('un seul appui sur la compétence : rien ne part',await G(()=>__g().sim.hero.ab===0));
 await p.locator('#bAb').tap();await p.waitForTimeout(120);await p.locator('#bAb').tap();await p.waitForTimeout(300);ok('deux appuis rapprochés : la compétence part',await G(()=>__g().sim.hero.ab>0));
 await raw('#bUlt');await p.waitForTimeout(700);ok('un seul appui sur l\'ultime : rien ne part',await G(()=>__g().sim.hero.ult>=100));
 await raw('#bUlt');await p.waitForTimeout(120);await raw('#bUlt');await p.waitForTimeout(300);ok('deux appuis rapprochés : l\'ultime part',await G(()=>__g().sim.hero.ult<60));
 await tap('#bSneak');await p.waitForTimeout(300);ok('Sneak répond au premier appui',await G(()=>__g().inp.sneak===true));await tap('#bSneak');await p.waitForTimeout(300);ok('un deuxième appui relève le héros',await G(()=>__g().inp.sneak===false));
 // un doigt posé sur un petit bouton puis glissé tourne la caméra
 const y0=await G(()=>__g().sim.hero.yaw);await p.evaluate(()=>{const e=document.getElementById('bAb'),r=e.getBoundingClientRect(),o={pointerId:9,clientX:r.left+20,clientY:r.top+20,bubbles:true,cancelable:true};e.dispatchEvent(new PointerEvent('pointerdown',o));e.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientX:o.clientX-80})));e.dispatchEvent(new PointerEvent('pointerup',Object.assign({},o,{clientX:o.clientX-80})));});
 await p.waitForTimeout(700);ok('glisser depuis un petit bouton tourne la caméra',Math.abs(await G(()=>__g().sim.hero.yaw)-y0)>.2);
 // ---- la visée (V8.9) : bouton libre « Viser » à un seul appui, zoom, caméra plus lente ; au sniper, tenir Tir ouvre la lunette et relâcher tire
 const A=()=>G(()=>{const g=__g(),a=g.getAim();a.on=g.aimOn();a.zoom=g.aimZoom();a.cd=g.sim.hero.cd;a.nb=g.sim.bullets?g.sim.bullets.length:-1;a.tool=g.tool;return a;}),drag=async()=>{const y=await G(()=>__g().sim.hero.yaw);
   await p.evaluate(()=>{const c=document.getElementById('game'),o={pointerId:11,clientX:600,clientY:150,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientX:540})));c.dispatchEvent(new PointerEvent('pointerup',Object.assign({},o,{clientX:540})));});await p.waitForTimeout(150);return Math.abs(await G(()=>__g().sim.hero.yaw)-y);};
 await reset();await G(()=>{const g=__g();g.setTool('pistolet');g.sim.enemies.length=0;});await p.waitForTimeout(400);let a=await A();
 ok('l\'arme en main : le bouton libre propose « Viser »',a.freeK==='aim'&&await p.locator('#bFree').isVisible()&&(await p.locator('#bFree').innerText()).trim().startsWith('Viser'));
 const f0=a.fov,d0=await drag();await tap('#bFree');await p.waitForTimeout(500);a=await A();const d1=await drag();
 ok('un seul appui : on vise, la vue zoome (champ '+f0.toFixed(0)+'° → '+a.fov.toFixed(0)+'°)',a.aim&&a.on&&a.fov<f0-12&&await p.locator('#bFree').evaluate(e=>e.classList.contains('on'))&&await p.locator('#cross').evaluate(e=>e.classList.contains('ads')));
 ok('en visée la caméra tourne moins vite ('+d0.toFixed(3)+' → '+d1.toFixed(3)+')',d1<d0*.9&&d1>d0*.5);ok('pas de lunette au pistolet',await p.locator('#scope').isHidden());
 await tap('#bFree');await p.waitForTimeout(500);a=await A();ok('un deuxième appui arrête la visée, le champ revient ('+a.fov.toFixed(0)+'°)',!a.aim&&!a.on&&Math.abs(a.fov-f0)<1.5);
 await tap('#bFree');await G(()=>__g().setTool('marteau'));await p.waitForTimeout(300);a=await A();ok('changer d\'outil arrête la visée, le bouton Viser disparaît',!a.aim&&a.freeK!=='aim');
 await G(()=>{const g=__g();g.setTool('pistolet');g.setWeap('sniper');g.sim.hero.cd=0;});await p.waitForTimeout(300);await tap('#bFree');await p.waitForTimeout(500);a=await A();const d2=await drag();
 ok('sniper : Viser ouvre la lunette (champ '+a.fov.toFixed(0)+'°), la caméra tourne bien moins vite ('+d2.toFixed(3)+')',a.on&&a.zoom===4&&a.fov<26&&await p.locator('#scope').isVisible()&&d2<d0*.45);await p.screenshot({path:'shots/90-lunette-test.png'});
 await tap('#bFree');await p.waitForTimeout(400);ok('lunette refermée',await p.locator('#scope').isHidden());
 // tenir Tir : lunette, pas de coup ; relâcher : un coup
 const hold=down=>p.evaluate(d=>{const e=document.getElementById('bFire'),r=e.getBoundingClientRect(),o={pointerId:13,pointerType:'touch',clientX:r.left+r.width*.28,clientY:r.top+r.height*.74,bubbles:true,cancelable:true};e.dispatchEvent(new PointerEvent(d?'pointerdown':'pointerup',o));},down);
 await G(()=>{__g().sim.hero.cd=0;});const n0=(await A()).nb;await hold(true);await p.waitForTimeout(700);a=await A();
 ok('sniper : tenir Tir ouvre la lunette sans tirer',a.aimHold&&a.on&&a.cd<=0&&a.nb===n0&&await p.locator('#scope').isVisible());
 await hold(false);await p.waitForTimeout(120);a=await A();ok('relâcher : le coup part (un seul), la lunette se referme',!a.aimHold&&!a.on&&a.cd>0&&!a.fireQ&&await p.locator('#scope').isHidden());
 await p.waitForTimeout(900);const n1=(await A()).cd;await G(()=>{__g().sim.hero.cd=0;});await p.waitForTimeout(500);ok('pas de deuxième coup sans nouvel appui',(await A()).cd<=0);
 await G(()=>{__g().setWeap('pistolet');__g().sim.hero.cd=0;});await hold(true);await p.waitForTimeout(300);a=await A();ok('pistolet : tenir Tir tire tout de suite, sans lunette',a.cd>0&&!a.aimHold&&await p.locator('#scope').isHidden());await hold(false);
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
