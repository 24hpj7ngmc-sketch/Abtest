// test court de la V10.2 (« tout raccord ») : le barème commun aux deux portails, les rangs qui paient, les bonus complets du héros, la bourse, les défis de la taverne et le renom
// qui comptent les deux jeux.   usage : node tests/runsync.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0;
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(()=>{window.__autoPanel=false;window.__nodemo=true;window.__nomount=true;window.__flat=true;window.__nohv=true;});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,x)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(x!==undefined&&!c?' — '+JSON.stringify(x):''));};
 const TL='file://'+path.resolve('gfx/three-lite.js');await G(tl=>{DernierToit.troisJs=tl;},TL);
 const pret=()=>p.waitForFunction(()=>{const T=__g().getTR();return T&&T.pret;},null,{timeout:30000}).catch(()=>{});
 // ---------- 1. le barème commun
 const P=await G(()=>{const g=__g(),s=g.save,o={};const d=f=>{const a=s.gold,b=s.sh.feu;f();return[s.gold-a,s.sh.feu-b];};
   o.k=[g.kHome(),g.kHall()];o.pay=d(()=>g.payOut('feu',20,4,true,1));o.pay2=d(()=>g.payOut('feu',20,4,true,2));
   o.ile=d(()=>g.payOut('feu',35,4,true,1));o.camp3=d(()=>g.payOut('feu',35,4,true,g.PAYK[2]));
   o.u=[+g.dayU(1).toFixed(3),+g.dayU(10).toFixed(3),[1,2,3,4,5,6,7,8,9,10].reduce((a,x)=>a+g.dayBoss(x),0)];return o;});
 ok('barème : 20 unités, 4 boss, victoire → 560 or et 750 éclats ; rang ×2 → le double',P.k.join()==='1,1'&&P.pay.join()==='560,750'&&P.pay2.join()==='1120,1500',P);
 ok('île, partie libre gagnée (35 unités, 4 boss) : 710 or, 1050 éclats, comme la partie intégrée d\'avant',P.ile.join()==='710,1050',P);
 ok('île, campagne niveau 3 : gains ×1,5 (1065 or, 1575 éclats)',P.camp3.join()==='1065,1575',P);
 ok('toit : une journée vaut sa durée (1,57 unité au jour 1, 3,33 au jour 10), 3 boss sur dix jours',P.u.join()==='1.565,3.326,3',P.u);
 // ---------- 2. le héros complet, la bourse
 const B=await G(()=>{const g=__g(),s=g.save;s.hl.terre.v1=2;s.hl.terre.v4=1;s.hl.terre.u3=1;s.we.t1=2;s.boost=1;const b=g.toitBonus('terre','pistolet');return{b,boost:s.boost};});
 ok('bonus : tout l\'arbre du héros part (vitesse, vie, charge de l\'ultime), avec ses balles d\'élément et les niveaux',Math.abs(B.b.heros.hSpd-.12)<1e-9&&B.b.heros.hHp===20&&Math.abs(B.b.heros.uCharge-.15)<1e-9&&Math.abs(B.b.balles.eKnock-1.2)<1e-9&&B.b.niveaux.heros===4&&B.b.vie===20,B.b);
 await G(()=>{const g=__g();g.toitOpen();});await p.waitForTimeout(200);
 const pan=await G(()=>({prep:document.getElementById('dtPrep').textContent,rang:[...document.querySelectorAll('#dtRang .tchip')].map(b=>b.className.replace('tchip','').trim()+':'+b.textContent).join('|'),txt:document.querySelector('#dtRangD').textContent}));
 ok('panneau : quatre rangs (le 1 choisi, les autres fermés) ; avec Dernier Toit V4.2 la bourse part et l\'arbre du héros compte',pan.rang==='sel:1|lock:2|lock:3|lock:4'&&/bourse \+150/.test(pan.prep)&&!/reste pour l.île/.test(pan.prep)&&/comptent aussi/.test(pan.prep)&&!/pas encore/.test(pan.prep),pan);
 await p.locator('#dtRang .tchip[data-l="3"]').evaluate(el=>el.click());
 ok('un rang fermé ne se choisit pas',await G(()=>__g().toitRang()===1&&__g().save.toit.sel===1));
 // ---------- 3. les rangs : le 1 fini ouvre le 2, qui est plus dur et paie plus
 await G(()=>{document.getElementById('toitV').hidden=true;__g().toitGo('terre');});await pret();
 let f=p.frames().find(fr=>fr!==p.mainFrame());const o1=await f.evaluate(()=>({d:window.DT_LOBBY.bonus.degats,a:window.DT_LOBBY.bonus.argent}));
 const s0=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre,boost:s.boost,star:s.loot.etoile_terre||0};});
 await f.evaluate(()=>parent.postMessage({dt:'fin',victoire:true,jour:10,tues:25000,heros:'terre',arme:'pistolet',sansFin:false,raison:'secouru'},'*'));await p.waitForTimeout(200);
 const s1=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre,r:s.toit.r,star:s.loot.etoile_terre||0};});
 ok('rang 1 : dégâts intacts, bourse de 150 donnée au toit et dépensée une fois la partie ouverte',o1.d===1&&o1.a===150&&s0.boost===0,[o1,s0]);
 ok('secouru au rang 1 : 565 or + 100 de prime, 790 éclats, étoile de Roc, rang 2 ouvert',s1.gold-s0.gold===665&&s1.sh-s0.sh===790&&s1.r===1&&s1.star===1&&s0.star===0,[s0,s1]);
 await f.evaluate(()=>parent.postMessage({dt:'retour'},'*'));await p.waitForTimeout(400);
 const e1=await G(()=>document.getElementById('eGain').textContent);ok('écran de retour : « Débloqué : rang 2 » et la prime',/Débloqué : rang 2/.test(e1)&&/Première fois : \+100/.test(e1),e1);
 await p.locator('#eAgain').evaluate(el=>el.click());
 await G(()=>{const g=__g();g.save.toit.sel=2;g.toitOpen();});await p.waitForTimeout(200);
 const pan2=await G(()=>({rang:[...document.querySelectorAll('#dtRang .tchip')].map(b=>b.className.replace('tchip','').trim()+':'+b.textContent).join('|'),txt:document.querySelector('#dtRangD').textContent}));
 ok('panneau : rang 1 coché, rang 2 choisi, « zombies +35 % de vie · gains ×1,25 » (plus d\'exception pour les tourelles)',pan2.rang==='done:1 ✓|sel:2|lock:3|lock:4'&&/\+35 % de vie/.test(pan2.txt)&&!/tourelles/.test(pan2.txt)&&/gains ×1,25/.test(pan2.txt),pan2);
 await G(()=>{document.getElementById('toitV').hidden=true;__g().toitGo('terre');});await pret();f=p.frames().find(fr=>fr!==p.mainFrame());
 const o2=await f.evaluate(()=>({d:window.DT_LOBBY.bonus.degats,h:window.DT_LOBBY.bonus.heroDegats,rg:window.DT_LOBBY.rang}));const s2=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre};});
 await f.evaluate(()=>parent.postMessage({dt:'fin',victoire:true,jour:10,tues:25000,heros:'terre',arme:'pistolet',sansFin:false,raison:'secouru'},'*'));await p.waitForTimeout(200);
 const s3=await G(()=>{const s=__g().save;return{gold:s.gold,sh:s.sh.terre,r:s.toit.r};});
 ok('rang 2 : c\'est Dernier Toit qui durcit les zombies, le lobby ne divise plus les dégâts',o2.d===1&&o2.h===1&&o2.rg===2,o2);
 ok('secouru au rang 2 : gains ×1,25 (705 or + 200 de prime, 985 éclats), rang 3 ouvert',s3.gold-s2.gold===905&&s3.sh-s2.sh===985&&s3.r===2,[s2,s3]);
 await f.evaluate(()=>parent.postMessage({dt:'retour'},'*'));await p.waitForTimeout(400);await p.locator('#eAgain').evaluate(el=>el.click());
 // ---------- 4. Dernier Toit collé dans la page annonce tout ce que le lobby lui confie (les contournements pour les anciennes versions ont été retirés en V10.8)
 ok('Dernier Toit annonce ce qu\'il sait lire : rang, argent, heros, balles, niveaux, multi',await G(()=>Array.isArray(DernierToit.accepte)&&['rang','argent','heros','balles','niveaux','multi'].every(k=>DernierToit.accepte.includes(k))),await G(()=>DernierToit.accepte));
 // ---------- 5. la taverne et le renom comptent les deux portails
 const Q=await G(()=>{const g=__g(),s=g.save;s.vil.push({t:'taverne'});const q0=s.q;s.q=[{k:'zomb',n:400,g:80,p:0},{k:'jours',n:4,g:80,p:0},{k:'win',n:2,g:220,p:0}];g.qGame({game:'toit',kills:300,units:3,days:3,win:false,fini:true,el:'feu'});const a=s.q.map(q=>q.p).join();
   g.qGame({game:'ile',kills:999,boss:2,units:20,win:true,hard:false,obj:1,fini:true,el:'feu'});const b=s.q.map(q=>q.p).join();s.q=[{k:'kills',n:80,g:80,p:0},{k:'waves',n:12,g:80,p:0},{k:'secours',n:1,g:200,p:0}];g.qGame({game:'toit',kills:300,units:24,days:10,win:true,fini:true,el:'feu'});const c=s.q.map(q=>q.p).join();
   s.q=[{k:'hero',n:1,g:70,p:0,el:'feu'}];g.qGame({game:'ile',kills:9,boss:0,units:3,win:false,hard:false,obj:0,fini:false,el:'feu'});const h0=s.q[0].p;g.qGame({game:'toit',kills:9,units:5,days:3,win:false,fini:true,el:'feu'});const h1=s.q[0].p;
   const t=Object.keys(g.QT).map(k=>g.QT[k].t(g.QT[k].n[0],'feu')).join(' | ');s.q=q0;s.vil.pop();const r0=g.renom().rec;const keep=s.rec.toit;s.rec.toit=0;const r1=g.renom().rec;s.rec.toit=keep;return{a,b,c,t,dr:r0-r1,rt:keep,h:[h0,h1]};});
 ok('défis : zombies et jours avancent sur le toit, pas sur l\'île ; « gagner » avance partout ; les défis de l\'île n\'avancent pas sur le toit',Q.a==='300,3,0'&&Q.b==='300,3,1'&&Q.c==='0,0,1',Q);
 ok('défi du héros : il faut trois vagues ou trois jours tenus, pas « trois unités »',Q.h.join()==='0,1',Q.h);
 ok('défis : chacun dit où il se fait',/sur l'île/.test(Q.t)&&/sur le toit/.test(Q.t)&&/île ou toit/.test(Q.t),Q.t);
 ok('renom : le record du toit compte (7 par jour tenu)',Q.rt===10&&Q.dr===70,Q);
 // ---------- 6. la sauvegarde garde le rang du toit
 // ---------- 5 bis. on n'est payé que pour des journées que les zombies tués rendent possibles (audit : « Rejouer » au jour 7 puis abandon payait 6 jours)
 await G(()=>{__g().toitGo('feu');});await pret();f=p.frames().find(fr=>fr!==p.mainFrame());const x0=await G(()=>{const s=__g().save;return[s.gold,s.sh.feu];});
 const fin=o=>f.evaluate(o=>parent.postMessage(Object.assign({dt:'fin',victoire:false,heros:'feu',arme:'pistolet',sansFin:false,raison:'abandon'},o),'*'),o),dif=async()=>{await p.waitForTimeout(150);const a=await G(()=>{const s=__g().save;return[s.gold,s.sh.feu];});const d=[a[0]-x0[0],a[1]-x0[1]];x0[0]=a[0];x0[1]=a[1];return d.join();};
 await fin({jour:3,tues:330});const y1=await dif();await fin({jour:7,tues:0});const y2=await dif();await fin({jour:8,tues:2700});const y3=await dif();await fin({jour:10,tues:3,victoire:true});const y4=await dif();await fin({jour:10,tues:25000,victoire:'false'});const y5=await dif();
 const tr=await G(()=>{const T=__g().getTR();return[T.n,T.days,T.win,__g().save.toit.r];});
 ok('première partie : 2 jours tenus avec 330 tués → payés (2 × rang choisi)',y1!=='0,0',y1);
 ok('« Rejouer » au jour 7 puis abandon sans rien tuer : rien',y2==='0,0',y2);
 ok('« Rejouer » au jour 7, un jour tenu avec 2 700 tués : un seul jour payé, pas les six d\'avant',y3!=='0,0'&&tr[1]===3+9,[y3,tr]);
 ok('victoire avec 3 zombies tués (jours sautés) : rien, pas de rang ouvert ; « victoire » doit être un vrai booléen',y4==='0,0'&&tr[2]===false&&tr[3]===2,[y4,tr]);
 await fin({jour:6,depart:5,tues:99999});const y6=await dif();await fin({jour:9,depart:1,tues:99999,dev:true});const y7=await dif();const tr2=await G(()=>{const T=__g().getTR();return[T.days,T.dev===true];});
 ok('« depart » (V4.2) : parti du jour 5, tombé au jour 6 → un seul jour payé, même avec des tués à foison',y6!=='0,0'&&tr2[0]===tr[1]+1,[y6,tr,tr2]);
 ok('partie en mode dev : rien n\'est payé ni compté',y7==='0,0'&&tr2[1],[y7,tr2]);
 await f.evaluate(()=>parent.postMessage({dt:'retour'},'*'));await p.waitForTimeout(300);await p.locator('#eAgain').evaluate(el=>el.click());
 // ---------- 6. la sauvegarde garde le rang du toit, et se nettoie
 await G(()=>{__g().persist();});await p.reload();await p.waitForTimeout(900);
 ok('après rechargement : rang 2 fini, rang choisi et record gardés',await G(()=>{const s=__g().save;return s.toit.r===2&&s.toit.sel===2&&s.rec.toit===10;}),await G(()=>__g().save.toit));
 await G(()=>{const r=JSON.parse(localStorage.getItem('ile5-save'));r.toit={r:'1',sel:2.5};localStorage.setItem('ile5-save',JSON.stringify(r));});await p.reload();await p.waitForTimeout(900);
 ok('une sauvegarde trafiquée (rang « 1 » en texte, choix 2,5) est remise d\'aplomb',await G(()=>{const T=__g().save.toit;return T.r===1&&T.sel===3&&__g().toitRang()===2;}),await G(()=>__g().save.toit));
 console.log('runsync : ratés',bad,'· erreurs',errs.length,errs.slice(0,6).join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
