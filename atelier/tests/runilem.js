// Le multi de L'Île des Cinq par le lobby (V11.0) : deux téléphones simulés dans le même salon ; l'un passe le portail, l'autre le rejoint par le bouton ;
// le lobby fait le facteur (état de l'un → liste de l'autre), comme pour Dernier Toit.   usage : node tests/runilem.js   (≈ 40 s)
const {chromium}=require('playwright');const path=require('path');const broker=require('./mqbroker.js');
// L'Île des Cinq V2.0 : passer l'écran des armes (« C'est parti »), puis « Prêt » dans la vue du ciel (« Prêt » bascule et n'est accepté qu'une fois la vue du ciel en place : on appuie jusqu'à ce que ce soit pris ; le dernier prêt attend de voir l'autre prêt, puis confirme par deux appuis ; les deux appuis partent de la page elle-même à 0,13 s d'écart : envoyés un par un depuis le test, ils arrivent parfois à plus de 0,42 s l'un de l'autre et le bouton se réarme sans fin ; dès que le bouton est allumé on n'appuie plus, un appui de plus l'annulerait)
const ilePret=async(f,dernier)=>{await f.evaluate(()=>{const a=document.getElementById('arsGo'),v=document.getElementById('arsV');if(a&&v&&!v.hidden)a.click();});const W=ms=>new Promise(r=>setTimeout(r,ms)),E=()=>f.evaluate(()=>{const r=document.getElementById('cReady');return{ciel:!!document.querySelector('.ciel'),on:!!r&&r.classList.contains('on'),t:r?r.textContent:''};});if(dernier)for(let i=0;i<60&&!/[1-9] prêts? sur/.test((await E()).t);i++)await W(250);const P=()=>f.evaluate(()=>{const r=document.getElementById('cReady');if(r)r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});for(let i=0;i<60;i++){const e=await E();if(!e.ciel||(!dernier&&e.on))return;if(e.on){await W(500);continue;}if(dernier)await f.evaluate(async()=>{const r=document.getElementById('cReady'),t=()=>r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));t();await new Promise(z=>setTimeout(z,130));t();});else await P();await W(700);}};
(async()=>{const PORT=19340+Math.floor(Math.random()*100),B=await broker.start(PORT),b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const mk=async name=>{const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+' ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(name+' console '+m.text().slice(0,300));});
   await p.addInitScript(port=>{window.__mq=['ws://127.0.0.1:'+port+'/mqtt'];window.__nohv=true;window.__autoPanel=false;},PORT);await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);
   await p.evaluate(tl=>{IleDesCinq.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));return p;};
 const G=(p,f,a)=>p.evaluate(f,a),join=(p,w,nm)=>G(p,q=>{const g=__g();g.netOpen();const i=document.getElementById('netName');i.value=q[1];i.dispatchEvent(new Event('input'));document.getElementById('mq2').value=q[0];document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},[w,nm]);
 const fr=p=>p.frames().find(f=>f!==p.mainFrame()),pret=async p=>{for(let i=0;i<60;i++){if(await G(p,()=>{const T=__g().getIR();return!!(T&&T.pret);}))return true;await p.waitForTimeout(250);}return false;};
 const hud=p=>fr(p).evaluate(()=>({n:document.querySelector('#sNet b').textContent,vis:!document.getElementById('sNet').hidden,vague:document.querySelector('#sWave b').textContent,go:!!document.getElementById('go')}));
 const A=await mk('A'),Bp=await mk('B');
 await join(A,'ile'+PORT,'Fred');await A.waitForTimeout(3600);await join(Bp,'ile'+PORT,'Lea');await Bp.waitForTimeout(8000);
 ok('B est en visite chez A, pas de bouton tant que personne n\'est parti',await G(Bp,()=>__g().VISIT.on&&document.getElementById('lGrp').hidden));
 // A passe le premier portail
 await G(A,()=>{__g().ileGo('feu');});ok('A : L\'Île des Cinq s\'ouvre',await pret(A));await Bp.waitForTimeout(1800);
 const oa=await fr(A).evaluate(()=>window.ILE_LOBBY.multi);ok('le jeu de A reçoit le multi (nom, ordre d\'arrivée, taille permise '+(oa&&oa.max)+')',oa&&oa.nom==='Fred'&&oa.depuis>0&&oa.max>=2800,oa);
 const gb=await G(Bp,()=>({hid:document.getElementById('lGrp').hidden,txt:document.getElementById('lGrp').textContent}));ok('chez B, le bouton «'+gb.txt+'»',!gb.hid&&/Fred est en partie · Rejoindre/.test(gb.txt),gb);
 // B le rejoint par le bouton
 await G(Bp,()=>{document.getElementById('lGrp').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true}));});ok('B : le bouton ouvre L\'Île des Cinq',await pret(Bp));
 let a,c;for(let i=0;i<40;i++){await A.waitForTimeout(500);a=await hud(A);c=await hud(Bp);if(/^2/.test(a.n)&&/^2/.test(c.n)&&a.vis&&c.vis)break;}
 ok('les deux jeux se voient à travers le lobby : 2 joueurs chez chacun (A «'+a.n+'», B «'+c.n+'»)',a.vis&&c.vis&&/^2/.test(a.n)&&/^2/.test(c.n),[a,c]);
 const dn=await G(A,()=>{const g=__g(),ps=g.net.room.peers();return ps.map(p=>({moi:p.isMe&&p.sameTab,st:p.presence&&p.presence.st,dn:p.presence&&p.presence.dn?JSON.stringify(p.presence.dn).length:0}));});
 ok('dans le salon : les deux sont « en partie », et l\'état de B arrive chez A ('+dn.map(x=>x.dn).join(' / ')+' caractères)',dn.length===2&&dn.every(x=>x.st==='play')&&dn.some(x=>!x.moi&&x.dn>50),dn);
 // A (l'hôte, parti le premier) lance la vague : B la voit
 await ilePret(fr(Bp),false);await ilePret(fr(A),true);for(let i=0;i<30;i++){await A.waitForTimeout(500);a=await hud(A);c=await hud(Bp);if(/^1\//.test(a.vague)&&/^1\//.test(c.vague))break;}
 ok('l\'hôte lance la vague, l\'invité la voit (A «'+a.vague+'», B «'+c.vague+'»)',/^1\//.test(a.vague)&&/^1\//.test(c.vague),[a,c]);
 // B revient au lobby : A repasse à un joueur ; B garde son île de visite
 await fr(Bp).evaluate(()=>parent.postMessage({ile:'retour'},'*'));await A.waitForTimeout(5000);a=await hud(A);
 const sb=await G(Bp,()=>({ouv:IleDesCinq.ouvert,on:__g().LB.on,visit:__g().VISIT.on}));
 ok('B revenu au lobby (toujours en visite chez A) ; A joue de nouveau seul («'+a.n+'» joueur affiché : '+a.vis+')',!sb.ouv&&sb.on&&sb.visit&&(!a.vis||/^1/.test(a.n)),[a,sb]);
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.join('\n'));await b.close();B.close&&B.close();process.exit(bad?1:0);})();
