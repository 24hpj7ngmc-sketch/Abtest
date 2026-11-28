// V3.0 : menu façon L'Île des Cinq, cartes de héros, armes, boutons du héros
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const cdp=await ctx.newCDPSession(p);
  const tapAt=async(x,y,id=1)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const tap=async sel=>{const e=await p.$(sel);await e.scrollIntoViewIfNeeded();const bb=await e.boundingBox();await tapAt(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(120);};
  await p.evaluate(()=>{__dt.save.mode='out';__dt.save.runs=3;__dt.save.hero='feu';__dt.save.weap='fusil';showStart();});await p.waitForTimeout(300);
  await p.screenshot({path:'shots/96-menu.png'});
  T('6 cartes de héros (V4.8 : Zéphyr), le rôle d\'abord',(await p.$$('#sGrid .pick')).length===6&&await p.evaluate(()=>document.querySelector('#sGrid .pick[data-h="vent"] em').textContent==='Tireur · Vent'&&document.querySelector('#sGrid .pick[data-h="bois"] em').textContent==='Combattant · Nature'));
  T('V4.8 : les balles au choix (celles du héros, puis six éléments), « +10 % » sur celui du héros',await p.evaluate(()=>{const b=[...document.querySelectorAll('#sElA button')];return b.length===7&&b[0].classList.contains('sel')&&/Feu \+10 %/.test(b[1].textContent)&&b[3].textContent==='Nature'&&/Balles de Feu : elles brûlent/.test(document.getElementById('sElD').textContent);}));
  T('6 cartes d\'armes avec photo',await p.isVisible('#sArms')&&(await p.$$('#sArms .wpk')).length===6&&await p.evaluate(()=>[...document.querySelectorAll('#sArms img')].every(i=>i.complete&&i.naturalWidth===240)));
  const txt=await p.textContent('#sGrid');T('noms et kits affichés',/Braise/.test(txt)&&/Volt/.test(txt)&&/Météores/.test(txt),txt.slice(0,80));
  const card=await (await p.$('#start .card')).boundingBox();T('la carte tient en largeur',card.width<=966,JSON.stringify(card));
  // campagne : 5 types × 4 niveaux, seuls les 1 s'ouvrent
  T('campagne : 5 colonnes, 20 niveaux, 5 ouverts',await p.evaluate(()=>document.querySelectorAll('#sCamp .cst').length===5&&document.querySelectorAll('#sCamp .tchip').length===20&&document.querySelectorAll('#sCamp .tchip:not(.lock)').length===5));
  await tap('#sCamp .tchip[data-s="feu3"]');T('niveau fermé : rien ne change',await p.evaluate(()=>__dt.save.stage!=='feu3'&&!running));
  await tap('#sCamp .tchip[data-s="feu1"]');T('Feu 1 choisi (entouré)',await p.evaluate(()=>__dt.save.stage==='feu1'&&document.querySelector('#sCamp .tchip.sel').dataset.s==='feu1'&&!running));
  await p.evaluate(()=>{__dt.save.camp={terre:1};showStart();});T('niveau fini : coché',/✓/.test(await p.textContent('#sCamp .tchip[data-s="terre1"]')));
  await p.evaluate(()=>{__dt.save.camp={};showStart();document.getElementById('sCamp').scrollIntoView();});await p.waitForTimeout(150);await p.screenshot({path:'shots/99-campagne.png'});
  await tap('#sArms .wpk[data-w="sniper"]');T('choisir une arme au menu',await p.evaluate(()=>__dt.save.weap==='sniper'));
  await tap('#sGrid .pick[data-h="elec"]');await p.waitForTimeout(300);
  T('toucher un héros le choisit sans lancer',await p.evaluate(()=>!running&&__dt.save.hero==='elec'&&!document.getElementById('start').hidden&&document.querySelector('#sGrid .pick.cur').dataset.h==='elec'));
  T('l\'arme choisie reste entourée',await p.evaluate(()=>document.querySelector('#sArms .wpk.cur').dataset.w==='sniper'));
  await p.screenshot({path:'shots/96-menu-choix.png'});
  await tap('#sGo');await p.waitForTimeout(500);
  T('Commencer lance la partie avec ce héros',await p.evaluate(()=>running&&__dt.S.hero==='elec'&&__dt.S.weap==='sniper'),await p.evaluate(()=>__dt.S.hero+' '+__dt.S.weap));
  await p.evaluate(()=>document.getElementById('big').style.display='none');await p.waitForTimeout(200);
  T('bouton compétence = Fulgurance',(await p.textContent('#bAb')).startsWith('Fulgurance'));T('bouton ultime = Déchaînement',(await p.textContent('#bUlt')).startsWith('Déchaînement'));
  T('Volt : 85 PV',await p.evaluate(()=>__dt.S.p.hpMax===__dt.S.P.hp-15),await p.evaluate(()=>__dt.S.p.hpMax));
  const x0=await p.evaluate(()=>[__dt.S.p.x,__dt.S.p.z]);const bb=await (await p.$('#bAb')).boundingBox();
  await p.evaluate(()=>{const e=document.getElementById('bAb');for(let k=0;k<2;k++)e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:7+k}));});await p.waitForTimeout(400);
  // (SwiftShader est lent : deux vrais touchers arrivent à 1 s d'écart, d'où les événements directs)
  const x1=await p.evaluate(()=>[__dt.S.p.x,__dt.S.p.z,__dt.S.hab]);T('double tap : Fulgurance fait bondir',Math.hypot(x1[0]-x0[0],x1[1]-x0[1])>3,Math.hypot(x1[0]-x0[0],x1[1]-x0[1]).toFixed(1)+' m, recharge '+x1[2].toFixed(1)+' s');
  await p.waitForTimeout(300);T('recharge affichée',/\d+ s/.test(await p.textContent('#bAb small')),await p.textContent('#bAb small'));
  await p.evaluate(()=>{__dt.S.ult=1;});await p.waitForTimeout(200);T('ultime prêt : bouton doré',await p.evaluate(()=>document.getElementById('bUlt').classList.contains('rdy')));
  await p.screenshot({path:'shots/97-hero-hud.png'});
  // Roc : 150 PV ; Ils arrivent : pas de héros
  await p.evaluate(()=>{__dt.save.hero='terre';__dt.newGame(1);});await p.waitForTimeout(300);T('Roc : +50 PV',await p.evaluate(()=>__dt.S.p.hpMax===__dt.S.P.hp+50));
  await p.evaluate(()=>{__dt.save.mode='in';showStart();});await p.waitForTimeout(250);await p.screenshot({path:'shots/98-menu-in.png'});
  T('Ils arrivent : pas de cartes, une note',(await p.$$('#sGrid .pick')).length===0&&/survivant/.test(await p.textContent('#sGrid'))&&!(await p.isVisible('#sArms'))&&!(await p.isVisible('#sArmT')));
  await tap('#sGo');await p.waitForTimeout(400);T('Ils arrivent : pas de héros, Missile',await p.evaluate(()=>running&&__dt.S.hero===null)&&(await p.textContent('#bAb')).startsWith('Missile'));
  await p.evaluate(()=>{__dt.save.mode='out';showStart();});await p.waitForTimeout(200);
  // V4.8 : Zéphyr, des balles de Vent choisies au menu
  await tap('#sGrid .pick[data-h="vent"]');await tap('#sElA button[data-e="vent"]');
  T('choisir des balles de Vent',await p.evaluate(()=>__dt.save.elArme==='vent'&&document.querySelector('#sElA button.sel').dataset.e==='vent'&&/traversent/.test(document.getElementById('sElD').textContent)));
  await p.screenshot({path:'shots/96-menu-zephyr.png'});
  await tap('#sGo');await p.waitForTimeout(500);await p.evaluate(()=>document.getElementById('big').style.display='none');await p.waitForTimeout(200);
  T('Zéphyr : Bond et Tir perçant, balles de Vent',await p.evaluate(()=>running&&__dt.S.hero==='vent'&&__dt.S.elArme==='vent')&&(await p.textContent('#bAb')).startsWith('Bond')&&(await p.textContent('#bUlt')).startsWith('Tir perçant'));
  const r0=await p.evaluate(()=>[__dt.S.p.x,__dt.S.p.z]);
  await p.evaluate(()=>{const e=document.getElementById('bAb');for(let k=0;k<2;k++)e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:17+k}));});await p.waitForTimeout(400);
  const r1=await p.evaluate(()=>[__dt.S.p.x,__dt.S.p.z,__dt.S.hab]);T('double tap : le Bond fait reculer (avant le jour aussi)',Math.hypot(r1[0]-r0[0],r1[1]-r0[1])>3&&r1[2]>10,Math.hypot(r1[0]-r0[0],r1[1]-r0[1]).toFixed(1)+' m');
  await p.evaluate(()=>{__dt.save.elArme=null;__dt.save.hero='feu';});
  await p.evaluate(()=>{__dt.save.mode='out';showStart();});await p.waitForTimeout(200);
  const sb=await p.$('#sSnd'),dv=await p.$('#sDev');T('boutons Son et Mode dev',!!sb&&!!dv&&/Son/.test(await sb.textContent()));
  console.log(errs.length?errs.join('\n'):'erreurs 0');console.log(ok+' OK, '+ko+' ratés');await b.close();})();
