// test de la vue du ciel (V2.0) : elle arrive entre les vagues, on pose / améliore / mure / creuse au doigt, Prêt lance la vague, le chrono de 30 s, la redescente ; puis à deux.   usage : node tests/runciel.js   (≈ 25 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);};
 const ouvre=async(nom,o,W,H)=>{const ctx=await b.newContext({viewport:{width:W||840,height:H||333},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(nom+' ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(nom+' console '+m.text().slice(0,200));});
  await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__etat=null;const pm=window.postMessage.bind(window);window.postMessage=(m,q)=>{if(m&&m.ile==='etat')window.__etat=JSON.stringify(m.d);return pm(m,q);};},o);
  await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(500);return p;};
 const G=(p,f,a)=>p.evaluate(f,a);
 const doigt=(p,type,x,y,id)=>p.evaluate(([type,x,y,id])=>{document.getElementById('game').dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',clientX:x,clientY:y}));},[type,x,y,id]);
 const tape=async(p,x,y)=>{await doigt(p,'pointerdown',x,y,11);await doigt(p,'pointerup',x,y,11);};
 const press=(p,s)=>p.locator(s).first().evaluate(el=>{const r=el.getBoundingClientRect(),o={bubbles:true,cancelable:true,pointerId:5,pointerType:'touch',clientX:r.left+r.width/2,clientY:r.top+r.height/2};el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));});
 // un point de l'écran où l'on peut poser (le sol sous le doigt, vérifié par les règles)
 const libre=p=>G(p,()=>{const g=__g(),s=g.sim,W=innerWidth,H=innerHeight;for(let y=0.35;y<0.7;y+=0.04)for(let x=0.3;x<0.75;x+=0.03){const P=g.cielGround(x*W,y*H);if(P&&!g.canPlace(s,P[0],P[1])&&!s.wallSet[g.cellOf(P[0],P[1])])return[x*W,y*H];}return null;});
 // --- seul ---
 const p=await ouvre('solo',{heros:'feu',mode:'normal'});await p.waitForTimeout(1500);
 let r=await G(p,()=>{const g=__g(),s=g.sim,v=id=>{const e=document.getElementById(id);return!!e&&getComputedStyle(e).display!=='none'&&!e.hidden;};return{ciel:document.getElementById('hud').classList.contains('ciel'),h:v('cielH'),joy:v('joy'),pads:v('pads'),act:v('act'),cT:s.cT,lab:document.getElementById('cReady').innerText.replace(/\s+/g,' ').trim(),cy:g.camera.position.y,ph:s.phase,shops:document.querySelectorAll('#cShops button').length};});
 ok('au début, avant la vague 1 : la vue du ciel est là, sans chrono (« '+r.lab+' »), la caméra est en haut ('+r.cy.toFixed(0)+' m)',r.ciel&&r.h&&r.cT===-1&&/^Prêt vague 1$/.test(r.lab)&&r.cy>40&&r.ph==='prep');
 ok('la vue normale se range : ni joystick, ni arc, ni barre d\'outils ; les boutiques sont là ('+r.shops+')',!r.joy&&!r.pads&&!r.act&&r.shops>=2);
 await G(p,()=>{__g().sim.gold=2000;});
 const A=await libre(p);ok('un endroit libre se trouve sous le doigt',!!A);
 await tape(p,A[0],A[1]);await p.waitForTimeout(250);
 r=await G(p,()=>{const g=__g();return{sel:g.ciel.sel,wheel:!document.getElementById('wheel').hidden,ctx:g.wheelCtx&&g.wheelCtx.place,n:g.sim.towers.length,gold:g.sim.gold};});
 ok('toucher le sol choisit l\'endroit et ouvre la roulette des éléments',!!r.sel&&r.sel.t===undefined&&r.wheel&&r.ctx);
 await press(p,'#wheel .wb.adv');await p.waitForTimeout(250);
 let q=await G(p,()=>{const g=__g(),s=g.sim;return{n:s.towers.length,gold:s.gold,sel:g.ciel.sel,els:s.towers.length?s.towers[s.towers.length-1].els.length:0};});
 ok('un appui sur l\'élément conseillé : la défense est posée ('+(r.gold-q.gold)+' or), et reste choisie pour l\'améliorer',q.n===r.n+1&&q.gold<r.gold&&q.sel&&q.sel.t!==undefined);
 await press(p,'#wheel .wb.adv');await p.waitForTimeout(250);
 r=await G(p,()=>{const s=__g().sim;return s.towers[s.towers.length-1].els.length;});
 ok('un second appui l\'améliore (niveau '+r+')',r===2);
 // un mur, en glissant de A à B
 await press(p,'#cBar [data-c=mur]');await p.waitForTimeout(150);
 const L=await G(p,()=>{const g=__g(),s=g.sim,W=innerWidth,H=innerHeight;for(let y=0.4;y<0.72;y+=0.04)for(let x=0.25;x<0.6;x+=0.03){const a=g.cielGround(x*W,y*H),b=g.cielGround((x+0.12)*W,y*H);if(!a||!b)continue;const ca=g.cellOf(a[0],a[1]),cb=g.cellOf(b[0],b[1]);if(ca===cb)continue;const c=g.checkWalls?g.checkWalls(s,g.cellX(ca),g.cellZ(ca),g.cellX(cb),g.cellZ(cb)):null;if(c&&!c.why&&c.cost<=s.gold)return[x*W,y*H,(x+0.12)*W,y*H,c.cells.length];}return null;});
 ok('une ligne de murs possible se trouve à l\'écran',!!L);
 const w0=await G(p,()=>__g().sim.walls.length);
 await doigt(p,'pointerdown',L[0],L[1],12);for(let k=1;k<=4;k++)await doigt(p,'pointermove',L[0]+(L[2]-L[0])*k/4,L[1],12);await p.waitForTimeout(120);
 r=await G(p,()=>({a:__g().ciel.a,hint:document.getElementById('cHint').textContent}));
 await doigt(p,'pointerup',L[2],L[3],12);await p.waitForTimeout(250);
 const w1=await G(p,()=>__g().sim.walls.length);
 ok('outil Mur : glisser de A à B montre le prix (« '+r.hint+' ») puis monte '+(w1-w0)+' bloc(s) au relâcher',r.a>=0&&/Mur · \d+ or/.test(r.hint)&&w1-w0===L[4]);
 await press(p,'#cBar [data-c=fos]');await p.waitForTimeout(150);
 const F=await libre(p),p0=await G(p,()=>__g().sim.pits.length);await tape(p,F[0],F[1]);await p.waitForTimeout(250);
 ok('outil Fosse : toucher creuse une case',await G(p,()=>__g().sim.pits.length)===p0+1);
 await press(p,'#cShops button');await p.waitForTimeout(200);
 ok('le bouton Marchand du ciel ouvre la boutique de la partie',await G(p,()=>!document.getElementById('tree').hidden));
 await G(p,()=>{document.getElementById('tree').hidden=true;});
 // Prêt : un seul appui ne lance rien (seul, c'est deux appuis rapprochés : le pouce qui tirait est juste là), le second lance la vague, la caméra redescend
 await press(p,'#cReady');await p.waitForTimeout(150);
 r=await G(p,()=>({ph:__g().sim.phase,lab:document.getElementById('cReady').innerText.replace(/\s+/g,' ').trim()}));
 ok('seul, un appui sur Prêt ne lance rien et demande le second (« '+r.lab+' »)',r.ph==='prep'&&/Touche encore/.test(r.lab));
 await press(p,'#cReady');await p.waitForTimeout(1500);
 r=await G(p,()=>{const g=__g(),v=id=>getComputedStyle(document.getElementById(id)).display!=='none';return{ph:g.sim.phase,w:g.sim.wave,ciel:document.getElementById('hud').classList.contains('ciel'),pads:v('pads'),k:g.ciel.k,cy:g.camera.position.y};});
 ok('Prêt (seul) lance la vague 1 ; la caméra redescend sur le héros (hauteur '+r.cy.toFixed(1)+' m) et la vue normale revient',r.ph==='wave'&&r.w===1&&!r.ciel&&r.pads&&r.k===0&&r.cy<4);
 // fin de vague : 30 s, puis la vague suivante part seule
 await G(p,()=>{const s=__g().sim;s.queue.length=0;for(const e of s.enemies)e.hp=0;});await p.waitForTimeout(500);
 r=await G(p,()=>({ph:__g().sim.phase,t:__g().sim.cT,lab:document.getElementById('cReady').innerText.replace(/\s+/g,' ').trim()}));
 ok('après la vague : la vue du ciel revient avec son chrono (« '+r.lab+' »)',r.ph==='prep'&&r.t>25&&r.t<=30&&/^Prêt \d+ s$/.test(r.lab));
 // l'accident de l'audit : deux appuis juste après la fin de vague, pendant la montée, ne lancent rien
 await press(p,'#cReady');await press(p,'#cReady');await p.waitForTimeout(200);
 ok('juste après la fin de vague, Prêt ne répond pas (la caméra monte encore) : les 30 s restent',await G(p,()=>__g().sim.phase==='prep'&&!__g().ciel.me));
 await G(p,()=>{__g().sim.cT=0.4;});await p.waitForTimeout(800);
 ok('au bout du chrono, la vague 2 part toute seule',await G(p,()=>__g().sim.phase==='wave'&&__g().sim.wave===2));
 await p.context().close();
 // --- à deux : l'invité est prêt, l'hôte pas encore ; puis les deux ---
 const X=await ouvre('Ana',{heros:'feu',mode:'normal',multi:{nom:'Ana',depuis:Date.now(),max:2800}});await X.waitForTimeout(300);
 const Y=await ouvre('Bob',{heros:'eau',mode:'normal',multi:{nom:'Bob',depuis:Date.now(),max:2800}});
 let go=true;const lit=q=>q.evaluate(()=>window.__etat).catch(()=>null),donne=(q,e,id,nom,heros,moi)=>q.evaluate(o=>window.postMessage({ile:'pairs',liste:o.e?[{id:o.id,nom:o.nom,heros:o.heros,etat:JSON.parse(o.e)}]:[],moi:{id:o.moi}},'*'),{e,id,nom,heros,moi}).catch(()=>{});
 const facteur=(async()=>{while(go){const ea=await lit(X),eb=await lit(Y);await donne(X,eb,'B','Bob','eau','A');await donne(Y,ea,'A','Ana','feu','B');await new Promise(r=>setTimeout(r,100));}})();
 await X.waitForTimeout(2500);
 await press(Y,'#cReady');await X.waitForTimeout(1200);
 const sA=await G(X,()=>({ph:__g().sim.phase,r:__g().sim.cR,n:__g().sim.cN})),lb=await G(Y,()=>document.getElementById('cReady').innerText.replace(/\s+/g,' ').trim());
 ok('à deux : l\'invité appuie sur Prêt, l\'hôte le sait (prêts '+sA.r+'/'+sA.n+'), la vague attend ; chez l\'invité « '+lb+' »',sA.ph==='prep'&&sA.r===1&&sA.n===2&&/1 prêt sur 2/.test(lb));
 await G(Y,()=>{__g().sim.gold=2000;});const B=await libre(Y);const t0=await G(X,()=>__g().sim.towers.length);
 await G(X,()=>{__g().sim.gold=2000;});await X.waitForTimeout(400);
 await tape(Y,B[0],B[1]);await Y.waitForTimeout(200);await press(Y,'#wheel .wb.adv');await X.waitForTimeout(1200);
 ok('l\'invité pose une défense depuis le ciel : elle apparaît chez l\'hôte',await G(X,()=>__g().sim.towers.length)===t0+1);
 await press(X,'#cReady');await press(X,'#cReady');await X.waitForTimeout(1800); // le dernier à être prêt lance la vague : deux appuis
 const fa=await G(X,()=>__g().sim.wave),fb=await G(Y,()=>({w:__g().sim.wave,c:document.getElementById('hud').classList.contains('ciel')}));
 ok('l\'hôte aussi prêt : la vague 1 part chez les deux, la vue du ciel se range chez l\'invité',fa===1&&fb.w===1&&!fb.c);
 go=false;await facteur;
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,6).join('\n'));await b.close();process.exit(bad?1:0);})();
