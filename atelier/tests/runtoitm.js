// test du multi de Dernier Toit par le lobby (V10.6, Dernier Toit V4.4) : deux téléphones simulés dans le même salon ; l'un monte sur le toit, l'autre le rejoint par le bouton ;
// le lobby fait le facteur (état de l'un → liste de l'autre) ; la paie à plusieurs se fait au temps joué.   usage : node tests/runtoitm.js   (≈ 50 s)
const {chromium}=require('playwright');const path=require('path');const broker=require('./mqbroker.js');
(async()=>{const PORT=19140+Math.floor(Math.random()*100),B=await broker.start(PORT),b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const mk=async name=>{const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+' ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(name+' console '+m.text().slice(0,300));});
   await p.addInitScript(port=>{window.__mq=['ws://127.0.0.1:'+port+'/mqtt'];window.__nohv=true;window.__autoPanel=false;},PORT);await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);
   await p.evaluate(tl=>{DernierToit.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));return p;};
 const G=(p,f,a)=>p.evaluate(f,a),join=(p,w,nm)=>G(p,q=>{const g=__g();g.netOpen();const i=document.getElementById('netName');i.value=q[1];i.dispatchEvent(new Event('input'));document.getElementById('mq2').value=q[0];document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},[w,nm]);
 const fr=p=>p.frames().find(f=>f!==p.mainFrame()),pret=async p=>{for(let i=0;i<60;i++){if(await G(p,()=>{const T=__g().getTR();return!!(T&&T.pret);}))return true;await p.waitForTimeout(250);}return false;};
 const A=await mk('A'),Bp=await mk('B');
 ok('Dernier Toit collé annonce « multi » et offre pairs()',await G(A,()=>Array.isArray(DernierToit.accepte)&&DernierToit.accepte.includes('multi')&&typeof DernierToit.pairs==='function'),await G(A,()=>[DernierToit.version,DernierToit.accepte]));
 await join(A,'toit56','Fred');await A.waitForTimeout(3600);await join(Bp,'toit56','Lea');await Bp.waitForTimeout(8000);
 ok('B est en visite chez A, pas de bouton tant que personne n\'est parti',await G(Bp,()=>__g().VISIT.on&&document.getElementById('lGrp').hidden));
 // A monte sur le toit
 await G(A,()=>{__g().toitGo('feu');});ok('A : Dernier Toit s\'ouvre',await pret(A));await Bp.waitForTimeout(1500);
 const gb=await G(Bp,()=>({hid:document.getElementById('lGrp').hidden,txt:document.getElementById('lGrp').textContent}));ok('chez B, le bouton «'+gb.txt+'»',!gb.hid&&/Fred est sur le toit · Rejoindre/.test(gb.txt),gb);
 const la=await fr(A).evaluate(()=>({m:window.DT_LOBBY.multi,actif:typeof MULTI==='object'&&MULTI.actif,n:MULTI.pairs.size,hote:MULTI.hote}));
 ok('A a reçu multi {nom, depuis} ; seul sur le toit, il est l\'hôte',la.m&&la.m.nom==='Fred'&&la.m.depuis>0&&la.actif&&la.n===0&&la.hote===true,la);
 // B le rejoint par le bouton
 await Bp.locator('#lGrp').dispatchEvent('pointerdown');ok('B touche le bouton : Dernier Toit s\'ouvre chez lui',await pret(Bp));await Bp.waitForTimeout(3500);
 const a2=await fr(A).evaluate(()=>({n:MULTI.pairs.size,hote:MULTI.hote,noms:[...MULTI.pairs.values()].map(o=>o.nom).join(),etat:[...MULTI.pairs.values()].every(o=>o.etat&&typeof o.etat==='object')})),b2=await fr(Bp).evaluate(()=>({n:MULTI.pairs.size,hote:MULTI.hote,noms:[...MULTI.pairs.values()].map(o=>o.nom).join(),etat:[...MULTI.pairs.values()].every(o=>o.etat&&typeof o.etat==='object'),g:[...MULTI.pairs.values()].some(o=>o.etat&&o.etat.g!==undefined)}));
 ok('le facteur passe : chacun voit l\'autre sur le toit avec son état (A voit Lea, B voit Fred)',a2.n===1&&b2.n===1&&a2.noms==='Lea'&&b2.noms==='Fred'&&a2.etat&&b2.etat,[a2,b2]);
 ok('A reste l\'hôte, B est invité et reçoit l\'instantané de la partie',a2.hote===true&&b2.hote===false&&b2.g,[a2,b2]);
 ok('le lobby de B sait que l\'hôte joue au rang 1',await G(Bp,()=>__g().getTR().hostR===1));
 // V10.7 : un gros état (tous les zombies) passe, et part moins souvent qu'un petit. Un troisième téléphone, C, se dit sur le toit sans ouvrir le jeu : seul son état d'essai part.
 ok('Dernier Toit a reçu la taille permise et la prend comme budget : 24 000 caractères',la.m.max===24000&&await fr(A).evaluate(()=>MULTI.max===24000)&&await fr(Bp).evaluate(()=>MULTI.max===24000),la.m);
 {const C=await mk('C');await join(C,'toit56','Zoe');await C.waitForTimeout(4500);
  const n=await G(C,async()=>{const g=__g();g.LB.on=false;g.lobNetSt('toit',{tt:Date.now()+5e5,tr:1,el:'eau',nm:'Zoe',dn:null});const big={g:'z'.repeat(15000),gros:1},n0=g.LN.dnN||0;for(let i=0;i<12;i++){g.toitEtat(big);await new Promise(r=>setTimeout(r,100));}return(g.LN.dnN||0)-n0;});
  let got=0;for(let i=0;i<30&&!got;i++){got=await G(Bp,()=>{for(const p of __g().net.room.peers()){const pr=p.presence;if(pr&&pr.nm==='Zoe'&&pr.st==='toit'&&pr.dn&&pr.dn.gros===1&&typeof pr.dn.g==='string')return pr.dn.g.length;}return 0;});if(!got)await Bp.waitForTimeout(100);}
  ok('un état de 15 000 caractères arrive entier au lobby d\'un autre joueur du toit (qui le remet à Dernier Toit), envoyé '+n+' fois en 1,2 s au lieu de 12',got===15000&&n>=2&&n<=5,[got,n]);
  ok('au-delà de 24 000 caractères, l\'état est refusé',await G(C,()=>{const g=__g(),n=g.LN.dnN||0;g.LN.dnT=0;g.toitEtat({g:'z'.repeat(24500)});return(g.LN.dnN||0)===n;}));
  let trois=false;for(let i=0;i<30&&!trois;i++){trois=await fr(A).evaluate(()=>MULTI.pairs.size===2)&&await fr(Bp).evaluate(()=>MULTI.pairs.size===2);if(!trois)await A.waitForTimeout(150);}ok('à trois : A et B voient chacun deux autres joueurs sur le toit',trois);await C.close();await A.waitForTimeout(6500);}
 // la paie à plusieurs : au temps joué
 const dif=async(p,f)=>{const s0=await G(p,()=>{const T=__g().getTR();return[T.days,T.gold,T.sh];});await f();await p.waitForTimeout(350);const s1=await G(p,()=>{const T=__g().getTR();return[T.days,T.gold,T.sh,T.multi];});return[s1[0]-s0[0],s1[1]-s0[1],s1[2]-s0[2],s1[3]];};
 const y1=await dif(Bp,()=>fr(Bp).evaluate(()=>parent.postMessage({dt:'fin',victoire:false,jour:4,depart:1,tues:300,duree:260,joueurs:2,hote:false,raison:'ville'},'*')));
 ok('B, 260 s de jour jouées jusqu\'au jour 4, 300 tués : 3 journées payées (les tués seuls n\'en auraient couvert aucune)',y1[0]===3&&y1[1]>0&&y1[2]>0&&y1[3]===2,y1);
 const y2=await dif(Bp,()=>fr(Bp).evaluate(()=>parent.postMessage({dt:'fin',victoire:false,jour:7,depart:1,tues:400,duree:120,joueurs:2,hote:false,raison:'ville'},'*')));
 ok('B arrivé en cours de route (120 s jouées, jour 7) : une seule journée payée, pas les six',y2[0]===1,y2);
 const y3=await dif(Bp,()=>fr(Bp).evaluate(()=>parent.postMessage({dt:'fin',victoire:false,jour:7,depart:1,tues:5,duree:900,joueurs:2,hote:false,raison:'ville'},'*')));
 ok('B resté à regarder (5 tués) : rien',y3[0]===0&&y3[1]===0,y3);
 // retour : B reparaît au lobby, toujours en visite ; A est toujours sur le toit
 await fr(Bp).evaluate(()=>parent.postMessage({dt:'retour'},'*'));await Bp.waitForTimeout(2500);
 const e=await G(Bp,()=>({on:__g().LB.on,vis:__g().VISIT.on,end:!document.getElementById('end').hidden,gain:document.getElementById('eGain').textContent,grp:document.getElementById('lGrp').textContent}));
 ok('B revient au lobby (toujours chez A) avec sa paie : «'+e.gain.slice(0,90)+'…»',e.on&&e.vis&&e.end&&/À 2 sur le toit : payé au temps joué/.test(e.gain),e);
 await Bp.waitForTimeout(3000);ok('chez A, B a quitté le toit : il redevient seul',await fr(A).evaluate(()=>MULTI.pairs.size===0&&MULTI.hote===true));
 console.log('messages relayés',B.stats.pub,'· ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();B.close();})();
