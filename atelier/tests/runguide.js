// test court de la V10.3 : le Guide du lobby (accueil, visite où l'on fait les gestes, Passer, cadeau, sujets) et le même personnage en « Règles » dans L'Île des Cinq.   usage : node tests/runguide.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(()=>{window.__autoPanel=false;window.__guide=true;window.__nomount=true;window.__flat=true;});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(900);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,x)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(x!==undefined&&!c?' — '+JSON.stringify(x):''));},W=ms=>p.waitForTimeout(ms);
 const st=()=>G(()=>{const g=__g(),D=g.getGD();return{i:D?D.i:-1,n:D?D.L.length:0,bub:!document.getElementById('gBub').hidden,head:document.getElementById('gHead').textContent,txt:document.getElementById('gTxt').textContent,btn:document.getElementById('gNext').hidden?'':document.getElementById('gNext').textContent,pil:g.GUIDE.pil?g.GUIDE.pil.visible:null,p:D&&D.p?D.p.map(v=>+v.toFixed(1)):null};});
 const goto=(x,z)=>G(q=>{const g=__g(),L=g.LB;L.x=q[0];L.z=q[1];L.y=g.hAt(L.x,L.z);},[x,z]),seen=id=>G(async id=>{document.getElementById(id).hidden=false;await new Promise(r=>setTimeout(r,120));document.getElementById(id).hidden=true;},id);
 // ---------- l'accueil
 const s0=await st(),g0=await G(()=>{const g=__g(),U=g.GUIDE,H=g.save.vil.find(B=>B.t==='maison');return{has:!!U.g,dH:Math.hypot(U.x-H.x,U.z-H.z),dP:Math.hypot(U.x-g.LB.x,U.z-g.LB.z),free:!g.save.vil.some(B=>Math.hypot(U.x-B.x,U.z-B.z)<5&&Math.hypot(U.x-B.x,U.z-B.z)<({hall:6.6,maison:4.6}[B.t]||0)),vil:g.save.vil.filter(B=>['hall','maison','armes','marchand','verger','musee','mine','taverne'].includes(B.t)).map(B=>B.t).sort().join(),gold:g.save.gold,guide:g.save.guide||0};});
 ok('première venue : le Guide est là, près de la maison et du joueur, hors des bâtiments',g0.has&&g0.dH<14&&g0.dP<9&&g0.free,g0);
 ok('il prend la parole tout seul : bulle « LE GUIDE · 1 / 11 », bouton « C\'est parti », bouton « Passer »',s0.i===0&&s0.n===11&&s0.bub&&s0.head==='LE GUIDE · 1 / 11'&&/Bienvenue/.test(s0.txt)&&/parti/.test(s0.btn)&&await p.locator('#gSkip').isVisible(),s0);
 ok('village de départ : pas encore de mine ni de taverne, donc pas d\'arrêt pour elles',g0.vil==='armes,hall,maison,marchand,musee,verger',g0.vil);
 await p.locator('#gNext').evaluate(e=>e.click());await W(700);
 // ---------- la visite : chaque étape ne passe que lorsque le geste est fait
 let s=await st();ok('arrêt 2, le Hall : la colonne de lumière est devant lui, le Guide s\'y est rendu',s.i===1&&s.pil===true&&/Hall des héros/.test(s.txt)&&!s.btn&&await G(()=>{const g=__g(),H=g.save.vil.find(B=>B.t==='hall'),D=g.getGD();return Math.hypot(D.p[0]-H.x,D.p[1]-H.z)<12&&Math.hypot(g.GUIDE.x-D.p[0],g.GUIDE.z-D.p[1])<4;}),s);
 await W(500);ok('sans le geste, la visite n\'avance pas',(await st()).i===1);
 // le vrai geste pour le Hall : aller devant, main en main, toucher Action, puis refermer
 await G(()=>{const g=__g(),H=g.save.vil.find(B=>B.t==='hall'),L=g.LB;L.x=H.x+Math.sin(H.r)*8.4;L.z=H.z+Math.cos(H.r)*8.4;L.y=g.hAt(L.x,L.z);L.yaw=H.r+Math.PI;});await W(300);
 {const bb=await p.locator('#padMain').boundingBox();await p.touchscreen.tap(bb.x+bb.width*.28,bb.y+bb.height*.74);await W(650);}
 const h1=await G(()=>({hall:!document.getElementById('hallV').hidden,bub:!document.getElementById('gBub').hidden}));ok('Action devant le Hall l\'ouvre ; la bulle se cache derrière le panneau',h1.hall&&!h1.bub,h1);
 ok('panneau ouvert : pas encore validé',(await st()).i===1);await p.locator('#hallX').evaluate(e=>e.click());await W(300);
 s=await st();ok('panneau refermé : arrêt 3, la Salle d\'armes',s.i===2&&/Salle d.armes/.test(s.txt)&&s.bub,s);
 await G(()=>__g().openTree('arme'));await W(200);await G(()=>{document.getElementById('tree').hidden=true;});await W(300);
 s=await st();ok('arrêt 4, le Marchand',s.i===3&&/Marchand/.test(s.txt),s);await seen('shopV');await W(300);
 s=await st();const v0=await G(()=>({prov:__g().save.prep.prov||0,st:__g().save.hv.s.verger}));ok('arrêt 5, le Verger : des provisions sont prêtes exprès',s.i===4&&/Verger/.test(s.txt)&&v0.prov===0&&v0.st>=1,[s,v0]);
 await G(()=>{const g=__g(),V=g.save.vil.find(B=>B.t==='verger'),L=g.LB;L.x=V.x+Math.sin(V.r)*7;L.z=V.z+Math.cos(V.r)*7;L.y=g.hAt(L.x,L.z);});await W(500);
 s=await st();ok('passer devant le Verger ramasse les provisions : arrêt 6, le Musée',s.i===5&&/Musée/.test(s.txt)&&await G(()=>__g().save.prep.prov>0),s);await seen('lootV');await W(300);
 s=await st();ok('arrêt 7, améliorer la Maison',s.i===6&&/Améliorer/.test(s.txt),s);await seen('upV');await W(300);
 s=await st();ok('arrêt 8, l\'évolution, puis le Marteau',s.i===7&&/évolution/.test(s.txt)&&/Marteau/.test(s.txt),s);await G(()=>__g().lobTool('marteau'));await W(300);
 s=await st();ok('arrêt 9 : reprendre la Main',s.i===8&&/Main/.test(s.txt),s);await G(()=>__g().lobTool('main'));await W(300);
 s=await st();ok('arrêt 10, les portails',s.i===9&&/portails/.test(s.txt),s);await G(()=>{const g=__g(),P=g.LGAMES[1],L=g.LB;L.x=P.x+Math.sin(P.ry)*7;L.z=P.z+Math.cos(P.ry)*7;L.y=g.hAt(L.x,L.z);});await W(400);
 s=await st();ok('dernier arrêt : le bilan, bouton « Terminer »',s.i===10&&s.btn==='Terminer'&&/or céleste/.test(s.txt),s);
 await p.locator('#gNext').evaluate(e=>e.click());await W(800);
 const e1=await G(()=>{const g=__g(),U=g.GUIDE,H=g.save.vil.find(B=>B.t==='maison');return{gd:g.getGD(),gold:g.save.gold,guide:g.save.guide,bub:!document.getElementById('gBub').hidden,pil:U.pil.visible,home:Math.hypot(U.x-H.x,U.z-H.z)};});
 ok('visite finie : +100 or céleste, bulle et colonne éteintes, le Guide est rentré près de la maison',e1.gd===null&&e1.gold-g0.gold===100&&e1.guide===2&&!e1.bub&&!e1.pil&&e1.home<14,e1);
 // ---------- lui reparler : ses sujets
 await G(()=>{const g=__g(),U=g.GUIDE,L=g.LB;L.x=U.x+2.2;L.z=U.z;L.y=g.hAt(L.x,L.z);L.yaw=Math.PI/2;});await W(400);
 ok('près de lui, main en main : « Parler · Le Guide »',/Le Guide/.test(await p.locator('#aLab b').innerText()),await p.locator('#aLab b').innerText());
 {const bb=await p.locator('#padMain').boundingBox();await p.touchscreen.tap(bb.x+bb.width*.28,bb.y+bb.height*.74);await W(650);}
 const t1=await G(()=>({vis:!document.getElementById('guideV').hidden,tabs:[...document.querySelectorAll('#guTabs .tchip')].map(b=>b.textContent).join('|'),rows:document.querySelectorAll('#guB .srow').length,act:document.getElementById('guA').hidden?'':document.getElementById('guA').textContent}));
 ok('Action lui parle : cinq sujets, et « Refaire la visite »',t1.vis&&t1.tabs==="L'île|Bâtiments|Héros|Armes|Portails"&&t1.rows>=5&&t1.act==='Refaire la visite',t1);
 await p.locator('#guTabs .tchip[data-k="1"]').evaluate(e=>e.click());await W(150);
 const t2=await G(()=>[...document.querySelectorAll('#guB .srow b')].map(b=>b.textContent).join(' | '));ok('sujet Bâtiments : les huit bâtiments, avec leur niveau ou l\'évolution qui les ouvre',/Hall des héros · niveau 1/.test(t2)&&/Mine d.étoiles · à l.évolution 2/.test(t2)&&/Taverne · à l.évolution 3/.test(t2)&&t2.split('|').length===8,t2);
 const und=await G(()=>{const g=__g();return JSON.stringify(g.guideTopics());});ok('aucun texte cassé (undefined, NaN) dans les sujets',!/undefined|NaN|\[object/.test(und));
 // ---------- refaire, puis passer : pas de second cadeau
 await p.locator('#guA').evaluate(e=>e.click());await W(400);s=await st();ok('« Refaire la visite » la relance à l\'arrêt 1',s.i===0&&s.bub&&await G(()=>document.getElementById('guideV').hidden),s);
 await p.locator('#gSkip').evaluate(e=>e.click());await W(400);
 ok('« Passer » l\'arrête tout de suite, sans cadeau',await G(g1=>{const g=__g();return g.getGD()===null&&document.getElementById('gBub').hidden&&g.save.gold===g1&&g.save.guide===2;},e1.gold));
  // (le Guide en partie et sa fiche « Règles » ont suivi le jeu dans son atelier — tests/runpartie.js de L'Île des Cinq)
 // ---------- la sauvegarde : la visite ne se relance pas toute seule
 await p.reload();await W(1000);ok('après rechargement : la visite ne se relance pas, le Guide est toujours là',await G(()=>{const g=__g();return g.getGD()===null&&document.getElementById('gBub').hidden&&!!g.GUIDE.g&&g.save.guide===2;}));
 console.log('runguide : ratés',bad,'· erreurs',errs.length,errs.slice(0,6).join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
