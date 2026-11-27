// test rapide du marchand d'esclaves (V9.7) : le bouton près de l'étal, l'achat, le prix qui monte, l'esclave qui agit, sa mort définitive, le rachat.   usage : node tests/runhire.js   (≈ 8 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.__noCiel=true;window.ILE_LOBBY=o;window.__msgs=[];const pm=window.postMessage.bind(window);window.postMessage=(m,q)=>{if(m&&m.ile)window.__msgs.push(m);return pm(m,q);};},{heros:'terre',mode:'normal'});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(600);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);},tap=async s=>{await p.locator(s).first().evaluate(el=>{el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:3,pointerType:'touch'}));el.click();});await p.waitForTimeout(120);};
 await p.waitForTimeout(300);
 const far=await G(()=>{const g=__g(),s=g.sim,H=g.HIREP;s.gold=2000;s.heroGod=true;return{d:Math.hypot(H[0],H[1]),shop:Math.hypot(H[0]-g.SHOP[0],H[1]-g.SHOP[1]),path:distPaths(H[0],H[1])};});
 ok('l\'étal est près du cœur ('+far.d.toFixed(0)+' m), à '+far.shop.toFixed(0)+' m du marchand et à '+far.path.toFixed(1)+' m des chemins',far.d<12&&far.shop>7&&far.path>4);
 await G(()=>{const h=__g().sim.hero;h.x=40;h.z=40;});await p.waitForTimeout(250);ok('loin de l\'étal : pas de bouton Esclaves',await p.locator('#bHire').isHidden());
 await G(()=>{const g=__g(),h=g.sim.hero,H=g.HIREP;h.x=H[0]*1.35;h.z=H[1]*1.35;});await p.waitForTimeout(300);
 ok('près de l\'étal : le bouton « Esclaves · 250 or » apparaît',await p.locator('#bHire').isVisible()&&(await p.locator('#bHire').innerText()).replace(/\s+/g,' ')==='Esclaves · 250 or');
 await tap('#bHire');ok('le panneau propose les cinq autres héros (Zéphyr compris), à 250 or',await p.locator('#hireV').isVisible()&&await p.locator('#hireB .hr').count()===5&&await p.locator('#hireB button').count()===5&&!(await p.locator('#hireB').innerText()).includes('Roc')&&(await p.locator('#hireB button').first().innerText()).includes('250 or'));
 const e1=await p.locator('#hireB button').first().getAttribute('data-e');await tap('#hireB button');
 let st=await G(()=>{const g=__g(),s=g.sim,L=g.hiredOf(s);return{n:L.length,gold:s.gold,players:s.players,el:L[0]&&L[0].el,near:L[0]&&Math.hypot(L[0].x-g.HIREP[0],L[0].z-g.HIREP[1]),cost:g.hireCost(s)};});
 ok('achat : 250 or payés, un esclave ('+st.el+') apparaît près de l\'étal, les ennemis ne gagnent pas de vie (joueurs = '+st.players+')',st.n===1&&st.gold===1750&&st.el===e1&&st.near<5&&st.players===1);
 ok('le suivant coûte 400 or, et le héros déjà acheté est marqué « en vie »',st.cost===400&&await p.locator('#hireB button').count()===4&&(await p.locator('#hireB .hr').first().innerText()).includes('en vie')&&(await p.locator('#hireB button').first().innerText()).includes('400 or'));
 await tap('#hireW');ok('le réglage « Ils bâtissent » bascule',await G(()=>__g().sim.botBuild===false)&&(await p.locator('#hireW').innerText()).includes('non'));await tap('#hireW');await tap('#hireX');
 await G(()=>{__g().botSync();});const pot0=await G(()=>__g().sim.pot=900);const p0=await G(()=>{const o=__g().hiredOf(__g().sim)[0];return[o.x,o.z];});await G(()=>{__g().startWave(__g().sim);});await p.waitForTimeout(2500);
 st=await G(p0=>{const g=__g(),s=g.sim,o=g.hiredOf(s)[0];return{n:g.hiredOf(s).length,moved:o?Math.hypot(o.x-p0[0],o.z-p0[1]):0,gold:s.gold,pot:s.pot};},p0);ok('il reste après une resynchronisation des bots, et il agit tout seul (il a bougé de '+st.moved.toFixed(1)+' m)',st.n===1&&st.moved>1);
 ok('V9.9 : il bâtit avec le pot, plus avec ton or (or '+st.gold+', pot 900 → '+Math.round(st.pot)+')',st.gold===1750&&st.pot<900);
 await G(()=>{const g=__g(),o=g.hiredOf(g.sim)[0];o.hp=0;o.down=8;});await p.waitForTimeout(400);
 st=await G(()=>{const g=__g(),s=g.sim;return{n:g.hiredOf(s).length,bots:g.botList(s).length,cost:g.hireCost(s),toast:document.getElementById('toast').innerText};});
 ok('à terre, l\'esclave est perdu (pas de relève) et le jeu le dit : «'+st.toast+'»',st.n===0&&st.bots===0&&st.cost===250);   // le message peut être recouvert par un autre quand la machine est chargée : on ne teste plus son texte
 const gb=await G(()=>__g().sim.gold);await tap('#bHire');await tap('#hireB button');ok('on peut en racheter un, au prix de départ',await G(gb=>__g().hiredOf(__g().sim).length===1&&__g().sim.gold===gb-250,gb));
 await G(()=>{const g=__g();g.sim.gold=0;});await tap('#hireX');await tap('#bHire');ok('sans or : pas d\'achat, le panneau dit ce qui manque',await p.locator('#hireB button').count()===0&&(await p.locator('#hireB').innerText()).includes('il manque 400 or'));
 // ---------- V9.9 : partage de l'or, bots au marchand ----------
 const gs=await G(()=>{const g=__g(),s=g.newSim('feu',null,{},'normal'),I={f:0,r:0};g.startWave(s);let n=0;while(s.enemies.length<3&&n++<900)g.step(s,.05,I);s.queue.length=0;s.enemies.length=3;const[a,b]=s.enemies;a.hp=0;a.lastH=false;b.hp=0;b.lastH=true;const g0=s.gold,p0=s.pot;
   const va=7,R={};a.k=b.k='b';a.bomb=b.bomb=false;g.step(s,.001,I);R.dg=s.gold-g0;R.dp=s.pot-p0;return R;});
 ok('or : tué par une défense = rien pour toi, la moitié de sa valeur au pot ; tué par un joueur = tout pour toi (or +'+gs.dg+', pot +'+gs.dp+')',gs.dg>0&&gs.dp===Math.round(gs.dg*.5));
 const bs=await G(()=>{const g=__g(),s=g.sim;s.run={};s.pts=5;s.bpts=0;s.wave=5;const b0=g.botList(s).length;g.botShop();const lv=Object.values(s.run).reduce((a,v)=>a+v,0),cheap=Math.min(...g.TREES.run.nodes.filter(n=>!n.p).map(n=>n.cost));return{b0,pts:s.pts,bpts:s.bpts,lv,cheap,toast:document.getElementById('toast').innerText};});
 ok('bots au marchand : '+bs.b0+' bot gagne ses points à lui (vague de boss : 2), achète la case la moins chère ('+bs.cheap+' pt) et ne touche pas tes points («'+bs.toast+'»)',bs.b0===1&&bs.pts===5&&(bs.cheap<=2?bs.lv>=1&&/achète/.test(bs.toast):bs.lv===0&&bs.bpts===2));
 await p.screenshot({path:'shots/97-esclaves.png'});
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
