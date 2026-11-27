const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];const ctx=await b.newContext({viewport:{width:750,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.ILE_LOBBY={heros:'feu',tuto:true};});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(600);
 const fire=async sel=>{await p.locator(sel).first().evaluate(el=>{const o={bubbles:true,cancelable:true,pointerId:5,pointerType:'touch'};if(['bFree','bAb','bUlt','cReady'].includes(el.id)){el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));}el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));el.click();});await p.waitForTimeout(250);};
 const st=async n=>{const s=await p.evaluate(()=>__g().tuto?__g().tuto.i:-1);console.log(n,'→ étape',s+1,'«'+(await p.locator('#tutoB span').innerText().catch(()=>'—')).slice(0,95)+'»');};
 await st('départ');await p.screenshot({path:'shots/31-tuto1.png'});
 await p.evaluate(()=>{const s=__g().sim;s.hero.x+=2;});await p.waitForTimeout(100);for(let i=0;i<8;i++){await p.evaluate(()=>{__g().sim.hero.x+=2;});await p.waitForTimeout(60);}await st('bouger');
 for(let i=0;i<8;i++){await p.evaluate(()=>{__g().sim.hero.yaw+=.25;});await p.waitForTimeout(60);}await st('regarder');await p.screenshot({path:'shots/32-tuto3.png'});
 await fire('#hot .slot[data-t=marteau]');await st('marteau');
 await p.evaluate(()=>{const s=__g().sim,q=posAt(PATHS[0],.5*PATHS[0].len);s.hero.x=q[0]+7;s.hero.z=q[1];s.hero.pitch=-.5;});await p.waitForTimeout(300);
 for(let k=0;k<5&&(await p.evaluate(()=>__g().tuto.i))===3;k++){await p.evaluate(()=>{__g().sim.hero.yaw+=1.2;});await p.waitForTimeout(200);await fire('#wheel .wb >> nth=0');}await st('poser');await p.screenshot({path:'shots/33-tuto5.png'});
 await fire('#go');await st('lancer');await fire('#hot .slot[data-t=pistolet]');
 await p.waitForTimeout(6000);await p.evaluate(()=>{const s=__g().sim;if(s.enemies[0])s.enemies[0].mark=4;});await p.waitForTimeout(300);await st('marquer');
 await p.evaluate(()=>{const s=__g().sim;for(const e of s.enemies)e.hp=0;s.queue.length=0;});await p.waitForTimeout(1500);await st('fin de vague');
 // V2.0 : deux étapes dans la vue du ciel (sans chrono) : poser au doigt, puis « Prêt »
 await p.waitForTimeout(1800);{const c=await p.evaluate(()=>({on:__g().ciel.on,i:__g().tuto.i,t:__g().sim.cT}));console.log(c.on&&c.t<0?'ok  le tuto monte dans le ciel après la vague 1, sans chrono':'RATÉ le tuto ne monte pas dans le ciel sans chrono '+JSON.stringify(c));}
 await p.evaluate(()=>{const g=__g(),q=posAt(PATHS[1],.45*PATHS[1].len);g.ciel.sel={x:q[0]+7,z:q[1]+3};});await p.waitForTimeout(300);
 for(let k=0;k<5&&(await p.evaluate(()=>__g().tuto.i))===7;k++){await fire('#wheel .wb >> nth='+k);if((await p.evaluate(()=>__g().tuto.i))===7)await p.evaluate(()=>{const g=__g();g.ciel.sel={x:g.ciel.sel.x+4,z:g.ciel.sel.z+4};});}await st('ciel : poser');
 await fire('#cReady');await p.waitForTimeout(500);{const c=await p.evaluate(()=>({ph:__g().sim.phase,on:__g().ciel.on}));console.log(c.ph==='wave'?'ok  deux appuis sur Prêt lancent la vague 2 du tuto':'RATÉ Prêt ne lance pas la vague du tuto '+JSON.stringify(c));}await st('ciel : prêt');
 await p.evaluate(()=>{const s=__g().sim;upgrade(s,s.towers[0].id,s.towers[0].els[0]);});await p.waitForTimeout(300);await st('améliorer');
 await p.evaluate(()=>{const s=__g().sim;addWalls(s,30,30,38,30);});await p.waitForTimeout(300);await st('mur');
 await fire('#bAb');await st('compétence');await p.screenshot({path:'shots/34-tuto-ult.png'});await fire('#bUlt');await p.waitForTimeout(300);await st('ultime');await p.screenshot({path:'shots/35-tuto-fin.png'});
 await fire('#tutoSkip');console.log('terminé: tuto',await p.evaluate(()=>__g().tuto),'· sauvegarde',await p.evaluate(()=>__g().save.tuto),'· cœur invincible',await p.evaluate(()=>__g().sim.god),'· erreurs',errs.length,errs[0]||'');await b.close();})();
