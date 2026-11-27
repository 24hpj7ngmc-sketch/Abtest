// test court de la V10.1 : les six armes de Dernier Toit partout (règles de la pompe et du lance-flammes, modèles, photos) et Dernier Toit derrière le deuxième portail
// (panneau, bonus, cadre ouvert, lobby en pause, récompenses à chaque « fin », retour devant le portail).   usage : node tests/runtoit.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0,step='';
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>{if(step!=='secours')errs.push(step+' : ERREUR '+e.message.slice(0,220));});p.on('console',m=>{if(step!=='secours'&&m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(step+' : console '+m.text().slice(0,200));});
 await p.addInitScript(()=>{window.__autoPanel=false;window.__nodemo=true;window.__nomount=true;window.__flat=true;window.__nohv=true;});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,x)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(x!==undefined&&!c?' — '+JSON.stringify(x):''));},vis=s=>p.locator(s).isVisible(),txt=s=>p.locator(s).innerText();
 await G(tl=>{DernierToit.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));
 // ---------- les armes
 step='armes';
 const A=await G(()=>{const g=__g();return{ile:g.armsOf('ile').join(),toit:g.armsOf('toit').join(),vm:Object.keys(g.MODELS).filter(k=>k.startsWith('vm.')).length,
   tabs:Object.keys(g.WT.pompe.gt).join(),lance:g.WT.lance.nodes.map(n=>n.id).join()};});
 ok('les six armes servent dans les deux jeux',A.ile==='pistolet,assaut,sniper,fusil,pompe,lance'&&A.toit===A.ile,A);
 ok('plus aucun modèle d\'arme en main dans la page du lobby (ils sont dans les mini-jeux)',A.vm===0,A);
 ok('chaque arme a son arbre de Dernier Toit ; le lance-flammes n\'a ni critique ni perforant, il a sa brûlure',A.tabs==='ile,toit'&&A.lance==='d1,c1,r1,x1',A);
 // ---------- le portail
 step='portail';
 const pos=await G(()=>{const g=__g(),P=g.LGAMES[1];return[P.id,P.open,P.x+Math.sin(P.ry)*6.5,P.z+Math.cos(P.ry)*6.5,P.ry+Math.PI];});
 await G(q=>{const g=__g(),L=g.LB;L.x=q[2];L.z=q[3];L.y=g.hAt(L.x,L.z);L.yaw=q[4];L.pitch=0;},pos);await p.waitForTimeout(400);
 ok('deuxième portail ouvert : « Entrer · Dernier Toit »',pos[0]==='toit'&&pos[1]===true&&(await txt('#aLab b')).includes('Dernier Toit'),await txt('#aLab b'));
 await G(()=>{const g=__g(),sv=g.save;sv.wl.pompe.d1=1;sv.wl.pompe.td=2;sv.wl.pompe.tx=1;sv.hl.terre.v4=1;sv.prep={aff:10,prov:15};g.setWeap('pompe');g.lobSync();});
 {const bb=await p.locator('#padMain').boundingBox();await p.touchscreen.tap(bb.x+bb.width*.28,bb.y+bb.height*.74);await p.waitForTimeout(500);}
 const pan=await G(()=>({vis:!document.getElementById('toitV').hidden,arms:document.querySelectorAll('#dtArms .tchip').length,pics:document.querySelectorAll('#dtArms .tchip img').length,heroes:document.querySelectorAll('#dtGrid .pick').length,sel:(document.querySelector('#dtArms .tchip.sel')||{}).dataset?.w,go:document.getElementById('dtGo').textContent,prep:document.getElementById('dtPrep').textContent}));
 ok('panneau de Dernier Toit : six armes avec leur photo, six héros, l\'arme en main cochée',pan.vis&&pan.arms===6&&pan.pics===6&&pan.heroes===6&&pan.sel==='pompe'&&pan.go.includes('Braise')&&pan.prep.includes('vie +15'),pan);
 const B=await G(()=>__g().toitBonus('terre','pompe'));
 // pompe : base −0,557 de dégâts, d1 = +0,07 ; arbre du toit +12 % ; affûtage +10 % ; critique +2 pts ; vie 20 (arbre) + 15 (provisions)
 ok('bonus : dégâts (arbre général × arbre du toit × affûtage), critique, vie ; rien d\'autre',Math.abs(B.degats-(0.513/0.443)*1.12*1.1)<.01&&B.cadence===1&&B.critique===.02&&B.vie===35&&B.heroDegats===1&&B.recharge===1,B);
 const g0=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre,rel:s.loot.relique||0,rec:s.rec.toit||0};});
 await p.locator('#dtGrid .pick[data-el=terre]').evaluate(el=>el.click());await p.locator('#dtGo').evaluate(el=>el.click());await p.waitForFunction(()=>{const T=__g().getTR();return T&&T.pret;},null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(600);
 const f=p.frames().find(fr=>fr!==p.mainFrame());
 const st=await G(()=>({pret:!!__g().getTR().pret,open:DernierToit.ouvert,cadre:!!document.getElementById('dernierToit'),pan:document.getElementById('toitV').hidden,prep:JSON.stringify(__g().save.prep),fr:__g().LGAMES[0].u.t.value,pa:window.__dtPause||0}));
 await p.waitForTimeout(400);const st2=await G(()=>({fr:__g().LGAMES[0].u.t.value,pa:window.__dtPause||0}));
 ok('Entrer : le jeu s\'ouvre dans son cadre et dit « prêt », le panneau se ferme, les préparatifs sont consommés',st.open&&st.cadre&&st.pan&&st.prep==='{}'&&!!f&&st.pret,st);
 ok('le lobby est en pause pendant la partie (plus de calcul ni de dessin)',st2.fr===st.fr&&st2.pa>st.pa,[st,st2]);
 const inF=f?await f.evaluate(()=>({o:window.DT_LOBBY,hero:typeof __dt==='object'&&__dt.S?__dt.S.hero:null,weap:typeof __dt==='object'&&__dt.S?__dt.S.weap:null,mode:typeof __dt==='object'&&__dt.S?__dt.S.mode:null,menu:!document.getElementById('start').hidden,run:typeof running!=='undefined'?running:null})):{};
 ok('Dernier Toit a reçu le héros, l\'arme et les bonus, et joue sans son menu, en « Ils s\'échappent »',inF.o&&inF.o.heros==='terre'&&inF.o.arme==='pompe'&&Math.abs(inF.o.bonus.degats-B.degats)<1e-9&&inF.o.bonus.vie===35&&inF.hero==='terre'&&inF.weap==='pompe'&&inF.mode==='out'&&inF.menu===false,inF);
 // une partie perdue au jour 4 (3 jours tenus), puis « Retour au lobby »
 step='fin';
 await f.evaluate(()=>parent.postMessage({dt:'fin',victoire:false,jour:4,tues:800,fuyards:9,argent:5000,sansFin:false,raison:'ville',heros:'terre',arme:'pompe'},'*'));await p.waitForTimeout(300);
 const g1=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre,rec:s.rec.toit||0,tr:__g().getTR()};});
 ok('fin d\'une partie : 3 jours tenus (5,3 unités du barème) → +55 or céleste, +105 éclats pour Roc, record 3',g1.gold-g0.gold===55&&g1.sh-g0.sh===105&&g1.rec===3&&g1.tr.n===1,[g0,g1]);
 await f.evaluate(()=>parent.postMessage({dt:'retour'},'*'));await p.waitForTimeout(700);
 const bk=await G(()=>{const g=__g(),P=g.LGAMES[1];return{open:DernierToit.ouvert,cadre:!!document.getElementById('dernierToit'),end:!document.getElementById('end').hidden,title:document.getElementById('eTitle').textContent,gain:document.getElementById('eGain').textContent,rep:!document.getElementById('eReplay'),d:Math.hypot(g.LB.x-P.x,g.LB.z-P.z),ov:g.lobOv(),fr:g.LGAMES[0].u.t.value};});
 await p.waitForTimeout(400);const fr2=await G(()=>__g().LGAMES[0].u.t.value);
 ok('retour : le cadre est retiré, le lobby reprend devant le deuxième portail, les gains sont affichés',!bk.open&&!bk.cadre&&bk.end&&bk.title.includes('Dernier Toit')&&bk.gain.includes('+55 or')&&bk.gain.includes('+105 éclats')&&bk.rep&&bk.d<8&&bk.ov&&fr2>bk.fr,bk);
 await p.locator('#eAgain').evaluate(el=>el.click());await p.waitForTimeout(300);
 ok('« Retour sur l\'île » ferme l\'écran, sans changer de portail (plus de bouton « Rejouer » : il était celui de la partie intégrée)',await G(()=>{const g=__g(),P=g.LGAMES[1];return document.getElementById('end').hidden&&g.LB.on&&Math.hypot(g.LB.x-P.x,g.LB.z-P.z)<8&&!g.lobOv();}));
 // une victoire (départ au jour 1, secouru au jour 10), deux parties dans la même visite, puis une partie quittée tout de suite
 step='victoire';
 const g2b=await G(()=>__g().save.sh.feu);await G(()=>__g().toitGo('feu'));await p.waitForFunction(()=>{const T=__g().getTR();return T&&T.pret;},null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(300);const f2=p.frames().find(fr=>fr!==p.mainFrame());
 await f2.evaluate(()=>{parent.postMessage({dt:'fin',victoire:true,jour:10,tues:25000,fuyards:3,argent:99999,sansFin:false,raison:'secouru',heros:'feu',arme:'pompe'},'*');parent.postMessage({dt:'fin',victoire:false,jour:1,tues:4,fuyards:0,argent:10,sansFin:false,raison:'abandon',heros:'feu',arme:'pompe'},'*');});await p.waitForTimeout(300);
 const g2=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.feu,rel:s.loot.relique||0,rec:s.rec.toit||0,n:__g().getTR().n,rg:s.toit.r};});
 ok('victoire : 10 jours → +565 or céleste (+100 de prime, rang 1 fini), +790 éclats, une relique, record 10 ; la partie quittée au jour 1 ne rapporte rien',g2.gold-g1.gold===665&&g2.sh-g2b===790&&g2.rel-g0.rel===1&&g2.rec===10&&g2.n===2&&g2.rg===1,[g1,g2]);
 await f2.evaluate(()=>parent.postMessage({dt:'retour'},'*'));await p.waitForTimeout(500);
 ok('la sauvegarde du lobby garde le record ; celle de Dernier Toit n\'est pas touchée par le lobby',await G(()=>{const r=JSON.parse(localStorage.getItem('ile5-save'));return r.rec.toit===10&&!/dernier-toit/.test(JSON.stringify(Object.keys(r)));}));
 await p.locator('#eAgain').evaluate(el=>el.click());
 // l'issue de secours : un cadre qui ne démarre pas (three.js introuvable) laisse un bouton du lobby pour revenir
 step='secours';await G(()=>{DernierToit.troisJs='file:///introuvable.js';const st=window.setTimeout;window.setTimeout=(f,ms)=>st(f,ms===12000?900:ms);__g().save.prep={aff:10};__g().toitGo('eau');window.setTimeout=st;});await p.waitForSelector('#dtSos',{timeout:15000}).catch(()=>{});
 ok('si Dernier Toit ne démarre pas, un bouton du lobby permet de revenir sur l\'île',await vis('#dtSos'));await p.locator('#dtSos').evaluate(el=>el.click());await p.waitForTimeout(300);
 ok('ce bouton ferme le cadre et rend la main au lobby ; l\'affûtage n\'a pas été dépensé pour rien',await G(()=>__g().save.prep.aff===10&&!DernierToit.ouvert&&!document.getElementById('dtSos')&&!document.getElementById('dernierToit')&&document.getElementById('end').hidden&&!__g().lobOv()));
 console.log('runtoit : ratés',bad,'· erreurs',errs.length,errs.slice(0,6).join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
