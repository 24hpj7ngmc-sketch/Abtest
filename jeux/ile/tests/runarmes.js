// test des armes (V2.0) : le choix de 3 armes et de leurs éléments au début, seulement elles en partie, l'élément contre l'ennemi, le marchand d'armes et ses effets, le multi.   usage : node tests/runarmes.js   (≈ 8 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:840,height:333},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__armesAuto=false;},{heros:'feu',arme:'sniper',mode:'hard'});await p.goto('file://'+path.resolve('construit/test.html'));
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));},
  tap=s=>p.locator(s).first().evaluate(el=>el.click()),down=s=>p.locator(s).first().evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})));
 await p.waitForTimeout(400);
 // ---------- le choix au début
 let A=await G(()=>({v:!document.getElementById('arsV').hidden,on:[...document.querySelectorAll('#arsW .wcard.on')].map(c=>c.dataset.w+c.querySelector('i').textContent).join(','),ars:__g().getArs().map(o=>o.w+':'+o.el).join(',')}));
 ok('au début de la partie, le choix des armes s\'ouvre : 3 armes prêtes, celle du lobby en n° 1, trois éléments différents ('+A.ars+')',A.v&&A.ars.startsWith('sniper:feu,')&&A.ars.split(',').length===3&&new Set(A.ars.split(',').map(x=>x.split(':')[1])).size===3,A);
 await tap('#arsW .wcard[data-w=pompe]');A=await G(()=>({m:document.getElementById('arsM').textContent,n:__g().getArs().length}));
 ok('une 4e arme est refusée, avec un mot (« '+A.m+' »)',A.n===3&&/3 armes au plus/.test(A.m));
 await tap('#arsW .wcard[data-w=assaut]');await tap('#arsW .wcard[data-w=pompe]');await tap('#arsE .ech[data-i="2"][data-e=terre]');
 A=await G(()=>__g().getArs().map(o=>o.w+':'+o.el).join(','));ok('retirer une arme, en prendre une autre, changer son élément ('+A+')',/pompe:terre$/.test(A)&&!A.includes('assaut')&&A.split(',').length===3);
 await tap('#arsGo');await p.waitForTimeout(150);
 A=await G(()=>{const g=__g(),h=g.sim.hero;return{hid:document.getElementById('arsV').hidden,chips:[...document.querySelectorAll('#sub .tchip')].map(b=>b.dataset.w).join(','),ars:g.getArs().map(o=>o.w).join(','),w:g.getWeap(),wEl:h.wEl,fire:getComputedStyle(document.getElementById('bFire')).getPropertyValue('--hero').trim()};});
 ok('« C\'est parti » : la barre du bas ne propose que ces 3 armes ('+A.chips+'), le sniper en main porte le Feu',A.hid&&A.chips===A.ars&&A.w==='sniper'&&A.wEl==='feu',A);
 await G(()=>__g().gameWeap('lance'));ok('une arme non choisie ne se prend pas',await G(()=>__g().getWeap()==='sniper'));
 const sec=await G(()=>__g().getArs()[1]);await down('#sub .tchip[data-w='+sec.w+']');await p.waitForTimeout(100);
 A=await G(()=>({w:__g().getWeap(),el:__g().sim.hero.wEl}));ok('changer d\'arme change l\'élément des balles ('+A.w+' : '+A.el+')',A.w===sec.w&&A.el===sec.el);
 // ---------- les règles, dans une partie à part : l'élément de la balle contre celui de l'ennemi, et les améliorations
 const R=await G(()=>{const g=__g(),I={f:0,r:0},R={};
   const mk=()=>{const s=g.newSim('terre',null,{},'hard');s.gold=5000;g.startWave(s);let n=0;while(s.enemies.length<5&&n++<2000)g.step(s,.05,I);s.queue.length=0;s.enemies.length=Math.min(5,s.enemies.length);for(const e of s.enemies){e.sea=null;e.hp=e.max=5000;e.stun=99;e.k='b';e.boss=false;e.arm=0;e.x=0;e.z=-40;e.slow=0;}s.hero.x=0;s.hero.z=-30;s.hero.y=0;s.hero.yaw=0;s.hero.pitch=0.03;s.m.hCrit=-5;return s;};
   const shot=(el,wu,eel)=>{const s=mk(),h=s.hero,e=s.enemies[0];e.el=eel;s.enemies.forEach((o,i)=>{if(i){o.x=[0,-2,2,0,0][i];o.z=[0,-40,-40,-42.5,-44][i];o.el=eel;}});h.wEl=el;h.wu=wu||{};h.cd=0;g.heroStep(s,h,{fire:true},.016,false);const ns=s.shots.length,sh=s.shots[0]?{el:s.shots[0].el,xp:s.shots[0].xp,ug:s.shots[0].ug}:null;s.events.length=0;let ev=[];for(let i=0;i<30;i++){g.step(s,.02,I);ev=ev.concat(s.events.map(x=>x.k));s.events.length=0;}return{d:5000-e.hp,others:s.enemies.slice(1).reduce((a,o)=>a+5000-o.hp,0),ns,sh,ev};};
   R.strong=shot('terre',{},'elec');R.neutral=shot('terre',{},'feu');R.weak=shot('terre',{},'vent');R.same=shot('terre',{},'terre');R.nopre=shot('vent',{},'feu');
   R.multi=shot('terre',{multi:2},'feu');R.expl=shot('terre',{expl:2},'feu');R.deg=shot('terre',{deg:3},'feu');R.chain=shot('terre',{chain:1},'feu');R.rico=shot('terre',{rico:2},'feu');R.brul=shot('terre',{brul:2},'feu');
   const s=mk();s.hero.wEl=null;s.hero.cd=0;g.heroStep(s,s.hero,{fire:true},.016,false);R.noEl=s.shots[0]&&s.shots[0].el;return R;});
 ok('l\'élément de la balle compte (V2.1, boucle à six) : Terre sur Élec ×'+(R.strong.d/R.neutral.d).toFixed(2)+', sur Vent ×'+(R.weak.d/R.neutral.d).toFixed(2)+', sur Terre ×'+(R.same.d/R.neutral.d).toFixed(2)+' ; prédilection de Roc ×'+(R.neutral.d/R.nopre.d).toFixed(2),R.strong.sh.el==='terre'&&Math.abs(R.strong.d/R.neutral.d-1.5)<.03&&Math.abs(R.weak.d/R.neutral.d-.75)<.03&&Math.abs(R.same.d/R.neutral.d-1)<.03&&Math.abs(R.neutral.d/R.nopre.d-1.1)<.03,R);
 ok('sans élément d\'arme (bots, esclaves), la balle garde l\'élément du héros',R.noEl==='terre');
 ok('Tirs multiples niveau 2 : 3 balles par tir ('+R.multi.ns+')',R.multi.ns===3&&R.multi.sh.ug>=2);
 ok('Balles explosives : l\'explosion blesse les voisins ('+R.expl.others.toFixed(1)+') et se voit (événement aexp)',R.expl.others>0&&R.expl.ev.includes('aexp')&&R.neutral.others===0);
 ok('Dégâts niveau 3 : +60 % ('+(R.deg.d/R.neutral.d).toFixed(2)+')',Math.abs(R.deg.d/R.neutral.d-1.6)<.05);
 ok('Chaîne électrique et Ricochet frappent d\'autres ennemis et se voient',R.chain.others>0&&R.chain.ev.includes('azap')&&R.rico.others>0&&R.rico.ev.includes('arico'));
 ok('Brûlure : la cible brûle encore après l\'impact ('+R.brul.d.toFixed(1)+' contre '+R.neutral.d.toFixed(1)+')',R.brul.d>R.neutral.d+1);
 // ---------- le marchand d'armes
 A=await G(()=>{const g=__g(),h=g.sim.hero;h.x=g.ARMP[0]+2;h.z=g.ARMP[1];return Math.hypot(g.ARMP[0],g.ARMP[1]);});await p.waitForTimeout(250);
 {const ciel=await G(()=>__g().cielOn()),vu=await p.locator('#bArmes').isVisible();
  ok('dans la vue du ciel, le bouton « Armes » d\'en haut reste caché (la boutique est en bas à gauche)',!ciel||!vu);}
 await G(()=>{window.__noCiel=true;});await p.waitForTimeout(300); // en vue normale
 ok('l\'étal du marchand d\'armes est à 12 m du cœur ; tout près, le bouton « Armes » apparaît',Math.abs(A-12)<.1&&await p.locator('#bArmes').isVisible());
 await G(()=>{window.__noCiel=false;});await p.waitForTimeout(200);
 await down('#bArmes');await p.waitForTimeout(150);
 A=await G(()=>({v:!document.getElementById('armV').hidden,tabs:document.querySelectorAll('#armTabs .tchip').length,cards:document.querySelectorAll('#armB .au').length,ov:__g().sim&&document.getElementById('act').hidden}));
 ok('le marchand d\'armes s\'ouvre : un onglet par arme choisie ('+A.tabs+'), '+A.cards+' améliorations',A.v&&A.tabs===3&&A.cards>=3);
 await G(()=>{__g().sim.gold=400;});await p.waitForTimeout(100);
 const w0=await G(()=>__g().getWeap());
 const can=await G(()=>!!document.querySelector('#armB button[data-u=expl]'));
 if(can){await tap('#armB button[data-u=expl]');await p.waitForTimeout(100);}
 A=await G(()=>({g:__g().sim.gold,L:(__g().getArmUp()[__g().getWeap()]||{}).expl,wu:__g().sim.hero.wu.expl}));
 ok('acheter « Balles explosives » : 90 or de l\'équipe, niveau 1 sur l\'arme en main ('+w0+'), le héros le porte',can&&A.g===310&&A.L===1&&A.wu===1,A);
 const t2=await G(()=>__g().getArs().find(o=>o.w!==__g().getWeap()).w);await tap('#armTabs .tchip[data-w='+t2+']');await p.waitForTimeout(100);
 A=await G(()=>({w:__g().getWeap(),wu:JSON.stringify(__g().sim.hero.wu),sel:document.querySelector('#armTabs .tchip.sel').dataset.w}));
 ok('un autre onglet prend cette arme en main ; ses améliorations à elle (aucune)',A.w===t2&&A.sel===t2&&A.wu==='{}');
 await G(()=>{__g().sim.gold=10;});await p.waitForTimeout(120);A=await G(()=>({b:document.querySelectorAll('#armB button[data-u]').length}));ok('sans or, plus rien à acheter',A.b===0);
 await tap('#armX');await p.waitForTimeout(80);ok('Retour ferme le marchand',await G(()=>document.getElementById('armV').hidden));
 // ---------- le multi
 A=await G(()=>{const g=__g(),pa={};g.armPres(pa);const o={id:'x1',el:'eau',m:{}};g.armPeer(o,{aw:[2,1],au:'000030000',aL:'21,40,99'},'x');const wu0=JSON.stringify(o.wu);const bad={el:'bois',m:{}};g.armPeer(bad,{aw:[9,'<b>'],au:'99999999999',aL:'<script>'},'y');
   const s=g.sim;s.gold=500;g.doAct(['wb',4,1,2],o);const g1=s.gold;g.doAct(['wb',4,3,2],o);const g2=s.gold;g.doAct(['wb',4,1,2],s.hero);const g3=s.gold;s.gold=50;g.doAct(['wb',4,2,2],o);const g4=s.gold;g.armPeer(o,{aw:[2,1],au:'000030000',aL:'21,40,99'},'x');return{pa:JSON.stringify(pa),wk:o.wk,wEl:o.wEl,wu0,wu:JSON.stringify(o.wu),g4,bad:[bad.wk,bad.wEl,JSON.stringify(bad.wu)].join('|'),aL:JSON.stringify(g.net?null:null),g1,g2,g3};});
 ok('multi : chacun envoie son arme, son élément, ses améliorations et son choix ('+A.pa+') ; l\'hôte les relit ('+A.wk+' '+A.wEl+' '+A.wu+'), refuse le reste',/"aw":\[\d,\d\]/.test(A.pa)&&/"au":"\d{9}"/.test(A.pa)&&/"aL":"\d\d,\d\d,\d\d"/.test(A.pa)&&A.wk==='sniper'&&A.wEl==='eau'&&A.wu0==='{}'&&A.bad==='||{}',A);
 ok('un invité qui achète : l\'hôte retire le prix de l\'or de l\'équipe (500 → '+A.g1+'), refuse un niveau impossible, ne fait rien pour ses propres achats (déjà payés), refuse sans assez d\'or (50 → '+A.g4+')',A.g1===410&&A.g2===410&&A.g3===410&&A.g4===50,A);
 ok('l\'hôte n\'accorde à un invité que les niveaux payés (annoncé expl 3, payé 1 : '+A.wu+')',A.wu==='{"expl":1}',A);
 console.log('ratés '+bad+' · erreurs '+errs.length);if(errs.length)console.log(errs.slice(0,5).join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
