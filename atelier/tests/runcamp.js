// test rapide de la campagne (V9.1) : la grille du portail (cinq types, quatre niveaux), le verrou, le départ d'un niveau, ses vagues, sa difficulté, la victoire qui ouvre le suivant.   usage : node tests/runcamp.js   (≈ 5 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(600);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);},tap=async s=>{await p.locator(s).first().evaluate(el=>el.click());await p.waitForTimeout(80);};
 await G(()=>{document.getElementById('start').hidden=false;});
 ok('grille : 6 colonnes de 4 niveaux, dans l\'ordre du dessin, le Vent en dernier',await p.locator('#sCamp .cst').count()===6&&await p.locator('#sCamp .tchip').count()===24&&(await p.locator('#sCamp .cst b').allInnerTexts()).join(' ')==='Eau Feu Élec Terre Nature Vent');
 ok('au départ seul le niveau 1 de chaque type est ouvert, et la partie libre reste choisie',await p.locator('#sCamp .tchip:not(.lock)').count()===6&&await p.locator('#sMode .tchip.sel').count()===1&&await G(()=>__g().campOf()===null));
 // V12.6 : la colonne Vent (L'Île des Cinq V2.2)
 await p.locator('#sCamp .tchip[data-s=vent1]').evaluate(e=>e.click());await p.waitForTimeout(150);{const r=await G(()=>({c:__g().campOf(),d:document.getElementById('sCampD').textContent,camps:IleDesCinq.tables.CAMPS.vent,k:(IleDesCinq.tables.KINDS.tou||{}).n}));ok('la colonne Vent s\'ouvre : niveau 1 choisi, son attaquant spécial est le Tourbillon, Nature le bat',r.c&&r.c.el==='vent'&&r.c.l===1&&/Vent · niveau 1/.test(r.d)&&/Nature les bat/.test(r.d)&&/Tourbillon/.test(r.d)&&r.camps==='tou'&&r.k==='Tourbillon',r);}
 await p.locator('#sMode .tchip[data-k=normal]').evaluate(e=>e.click());await p.waitForTimeout(150);
 await tap('#sCamp .tchip[data-s=feu2]');ok('un niveau fermé ne se choisit pas',await G(()=>__g().campOf()===null&&!__g().save.stage));
 await tap('#sCamp .tchip[data-s=feu1]');ok('Feu 1 choisi : gardé, la partie libre n\'est plus cochée, le panneau l\'explique',await G(()=>{const c=__g().campOf();return c&&c.el==='feu'&&c.l===1&&JSON.parse(localStorage.getItem('ile5-save')).stage==='feu1';})&&await p.locator('#sMode .tchip.sel').count()===0&&/Feu · niveau 1 : 20 vagues.*Eau les bat/.test(await p.locator('#sCampD').innerText()));
  // ---------- la partie se joue dans le cadre de L'Île des Cinq (V11.0) : le lobby donne le niveau, puis retient ce que le jeu lui dit à la fin
  await G(tl=>{IleDesCinq.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));await tap('#sGrid .pick[data-el=eau]');await tap('#sGo');
  for(let i=0;i<60&&!(await G(()=>{const T=__g().getIR();return!!(T&&T.pret);}));i++)await p.waitForTimeout(250);
  const fr=()=>p.frames().find(f=>f!==p.mainFrame());
  ok('la partie s\'ouvre en campagne : le jeu reçoit Feu, niveau 1',await fr().evaluate(()=>{const o=window.ILE_LOBBY;return o.campagne&&o.campagne.el==='feu'&&o.campagne.l===1&&o.heros==='eau';}));
  const FIN={ile:'fin',victoire:true,mode:'normal',campagne:{el:'feu',l:1},vague:20,vagues:20,passees:20,unites:35,tues:600,boss:4,objectifs:3,butin:[],heros:'eau',arme:'pistolet',invite:false};
  const g0=await G(()=>__g().save.gold);await fr().evaluate(m=>parent.postMessage(m,'*'),FIN);let eg='';for(let i=0;i<40;i++){await p.waitForTimeout(150);eg=await fr().evaluate(()=>document.getElementById('eGain').textContent);if(/Débloqué/.test(eg))break;}const g1=await G(()=>__g().save.gold);
  ok('victoire : Feu 2 débloqué, prime de 100 or céleste (le jeu l\'affiche : «'+eg.slice(0,60)+'»)',eg.includes('Débloqué : Feu · niveau 2')&&eg.includes('Première fois : +100 or céleste')&&g1-g0>100&&await G(()=>__g().save.camp.feu===1),{eg,d:g1-g0});
  await fr().evaluate(m=>parent.postMessage(m,'*'),FIN);for(let i=0;i<40;i++){await p.waitForTimeout(150);eg=await fr().evaluate(()=>document.getElementById('eGain').textContent);if(/Ouvert/.test(eg))break;}
  ok('rejouer un niveau déjà fini ne redonne pas la prime',!eg.includes('Première fois')&&eg.includes('Ouvert : Feu · niveau 2'));
  await fr().evaluate(()=>parent.postMessage({ile:'retour'},'*'));await p.waitForTimeout(500);
  await G(()=>{__g().drawMode();document.getElementById('start').hidden=false;});await tap('#sCamp .tchip[data-s=feu2]');
 ok('Feu 2 se choisit maintenant, Feu 1 est coché, Feu 3 reste fermé',await G(()=>{const c=__g().campOf();return c&&c.l===2;})&&(await p.locator('#sCamp .tchip[data-s=feu1]').innerText()).includes('✓')&&await p.locator('#sCamp .tchip[data-s=feu3].lock').count()===1&&/35 % plus résistants/.test(await p.locator('#sCampD').innerText()));
 await p.screenshot({path:'shots/95-campagne.png'});
 await tap('#sMode .tchip[data-k=hard]');ok('toucher un mode revient en partie libre',await G(()=>__g().campOf()===null&&__g().save.mode==='hard'));
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
