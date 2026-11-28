// test de l'élément choisi du héros (V12.9) : Braise en Eau au Hall (avatar, portrait, prédilection, portails), vieille sauvegarde, vu par un autre joueur.   usage : node tests/runhel.js   (≈ 25 s)
const {chromium}=require('playwright');const path=require('path');const broker=require('./mqbroker.js');
(async()=>{const PORT=19340+Math.floor(Math.random()*100),B=await broker.start(PORT),b=await chromium.launch();const errs=[];let bad=0;
 const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const mk=async(name,old)=>{const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();
   p.on('pageerror',e=>errs.push(name+' ERREUR '+e.message.slice(0,300)+' '+String(e.stack).split('\n').slice(1,4).join('|')));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(name+' console '+m.text().slice(0,300));});
   await p.addInitScript(([port,old])=>{window.__mq=['ws://127.0.0.1:'+port+'/mqtt','ws://127.0.0.1:1/mqtt'];window.__nohv=true;window.__autoPanel=false;if(old&&!localStorage.getItem('ile5-save'))localStorage.setItem('ile5-save',JSON.stringify({last:'feu',weap:'pistolet'}));},[PORT,old]);
   await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(1800);return p;};
 const G=(p,f,a)=>p.evaluate(f,a),tap=async(p,s)=>{await p.locator(s).first().evaluate(el=>el.click());await p.waitForTimeout(150);};
 // ancienne sauvegarde (sans champ hel) : Braise reste en Feu
 const O=await mk('O',1);
 let r=await G(O,()=>{const g=__g();return{hel:JSON.stringify(g.save.hel),e:g.elH('feu'),w:g.wEl('pistolet','feu'),t:g.getHero()};});
 ok('vieille sauvegarde : le champ est créé vide, Braise reste en Feu, l\'arme sans choix aussi',r.hel==='{}'&&r.e==='feu'&&r.w==='feu'&&r.t==='feu',r);
 await O.context().close();
 // le Hall
 const A=await mk('A');
 await G(A,()=>{const g=__g();g.save.wel={};g.setWeap('pistolet');for(const v of document.querySelectorAll('.veil'))v.hidden=true;g.hallDraw();document.getElementById('hallV').hidden=false;});
 r=await G(A,()=>[...document.querySelectorAll('#hallEl .tchip')].map(b=>b.textContent+(b.classList.contains('sel')?'*':'')).join(' '));
 ok('au Hall, Braise a sa rangée « Son élément » : six pastilles, Feu coché et marqué de son étoile',/^Son élément/.test(await G(A,()=>document.getElementById('hallEl').textContent))&&r==='Feu ★* Eau Nature Terre Élec Vent',r);
 const col=p=>G(p,()=>0);
 const before=await G(A,()=>{const h=__g().save;return{p:document.querySelector('#hallB .pick[data-el=feu] img').src.length,c:document.querySelector('#hallB .pick[data-el=feu]').style.getPropertyValue('--c')};});
 await tap(A,'#hallEl .tchip[data-hel=eau]');await A.waitForTimeout(600);
 r=await G(A,()=>{const g=__g(),H=document.querySelector('#hallB .pick[data-el=feu]'),av=g.getHallV().userData.heroes.find(h=>h.el==='feu');
   const mean=o=>{const c=[0,0,0];let n=0;o.traverse(m=>{const a=m.geometry&&m.geometry.attributes&&m.geometry.attributes.color;if(a)for(let i=0;i<a.count;i++){c[0]+=a.getX(i);c[1]+=a.getY(i);c[2]+=a.getZ(i);n++;}});return c.map(v=>n?v/n:0);};
   return{s:JSON.parse(localStorage.getItem('ile5-save')).hel,c:H.style.getPropertyValue('--c'),pic:H.querySelector('img').src.length,pts:H.querySelector('.pts').textContent.split(' · ')[0],t:document.getElementById('hallT').textContent,col:mean(av.av),ee:av.ee,eau:g.EL.eau.c,hero:g.getHero(),mdl:av.av.userData.prep.id};});
 ok('choisir Eau pour Braise : gardé dans la sauvegarde, couleur et nom de la carte en Eau',r.s&&r.s.feu==='eau'&&r.c.trim()===r.eau&&r.pts==='Eau',r);
 ok('le portrait de la carte est celui de Braise en Eau (pas celui de Braise en Feu)',r.pic>2000&&r.pic!==before.p);
 const rouge=r.col[0]>r.col[2];
 ok('l\'avatar du Hall est Braise (modèle propre, clé feu|eau) et il est bleu : plus de bleu que de rouge ('+r.col.map(v=>v.toFixed(2))+')',r.ee==='eau'&&/\|feu\|eau$/.test(r.mdl)&&!rouge,r);
 ok('le texte du Hall dit son élément (Eau) et les +10 %',/Braise, Mage/.test(r.t)&&/\(Eau\)/.test(r.t)&&/10 %/.test(r.t),r.t);
 // la prédilection suit : l'arme sans choix prend Eau ; ★ sur Eau dans la salle d'armes
 r=await G(A,()=>{const g=__g();return{w:g.wEl('pistolet'),w2:g.wEl('assaut','feu')};});
 ok('l\'arme sans choix prend l\'élément choisi du héros (Eau), pas la clé (Feu)',r.w==='eau'&&r.w2==='eau',r);
 await G(A,()=>{for(const v of document.querySelectorAll('.veil'))v.hidden=true;__g().lobSync();document.getElementById('start').hidden=false;});
 r=await G(A,()=>[...document.querySelectorAll('#sWel .tchip')].map(b=>b.textContent+(b.classList.contains('sel')?'*':'')).join(' '));
 ok('au portail de l\'île : « Son élément » de l\'arme : Eau coché, étoile sur Eau',/Eau ★\*/.test(r)&&!/Feu ★/.test(r),r);
 await G(A,()=>{__g().save.wel={pistolet:'feu'};});
 r=await G(A,()=>{const g=__g();return{o:g.ileOpts('feu'),w:g.wEl('pistolet','feu')};});
 ok('arme réglée sur Feu, héros en Eau : l\'arme garde son choix (Feu), le lobby envoie elHeros = eau et heros = feu',r.w==='feu'&&r.o.elHeros==='eau'&&r.o.heros==='feu'&&r.o.elements.pistolet==='feu',[r.o.elHeros,r.o.heros]);
 // le portail du toit
 await G(A,()=>{const g=__g();g.save.wel={};for(const v of document.querySelectorAll('.veil'))v.hidden=true;g.toitDraw();document.getElementById('toitV').hidden=false;window.__dtO=null;const o=DernierToit.ouvrir;DernierToit.ouvrir=function(a,c){window.__dtO=JSON.parse(JSON.stringify(a));return o.apply(this,arguments);};});
 await tap(A,'#dtGo');for(let i=0;i<40&&!(await G(A,()=>DernierToit.ouvert));i++)await A.waitForTimeout(150);
 r=await G(A,()=>{const o=window.__dtO||{};return{h:o.heros,e:o.elHeros,a:o.elementArme};});
 ok('au portail du toit : elHeros = eau part avec heros = feu ; l\'arme sans choix y est en Eau',r.h==='feu'&&r.e==='eau'&&r.a==='eau',r);
 await G(A,()=>{DernierToit.fermer&&DernierToit.fermer();__g().toitBack&&__g().toitBack();for(const v of document.querySelectorAll('.veil'))v.hidden=true;});await A.waitForTimeout(500);
 // un autre joueur voit Braise en bleu
 const C=await mk('C');
 await G(A,w=>{__g().netOpen();document.getElementById('mq2').value=w;document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},'helhel');
 await G(C,w=>{__g().netOpen();document.getElementById('mq2').value=w;document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},'helhel');
 await G(A,()=>{const g=__g();g.lobHero&&g.lobHero('feu');g.save.hel={feu:'eau'};g.lobSync();for(const v of document.querySelectorAll('.veil'))v.hidden=true;});
 let seen=null;for(let i=0;i<60&&!seen;i++){await C.waitForTimeout(300);seen=await G(C,()=>{const g=__g(),k=Object.keys(g.LN.av);if(!k.length)return null;const o=g.LN.av[k[0]];
   const c=[0,0,0];let n=0;o.m.traverse(m=>{const a=m.geometry&&m.geometry.attributes&&m.geometry.attributes.color;if(a)for(let i=0;i<a.count;i++){c[0]+=a.getX(i);c[1]+=a.getY(i);c[2]+=a.getZ(i);n++;}});return{el:o.el,ee:o.ee,col:c.map(v=>n?v/n:0)};});}
 ok('un autre joueur voit Braise (feu) en Eau : présence vérifiée, avatar bleu ('+(seen?seen.col.map(v=>v.toFixed(2)):'')+')',seen&&seen.el==='feu'&&seen.ee==='eau'&&seen.col[2]>seen.col[0],seen);
 // champ faux : l'émetteur ne l'envoie pas (elH vérifie contre les six clés), le récepteur non plus ne l'accepte pas : retour à la clé du héros
 await G(A,()=>{const g=__g();g.save.hel={feu:'zz'};g.lobSync();});
 let s2=null;for(let i=0;i<40&&!(s2&&s2.ee==='feu');i++){await C.waitForTimeout(300);s2=await G(C,()=>{const g=__g(),k=Object.keys(g.LN.av);if(!k.length)return null;const o=g.LN.av[k[0]];return{el:o.el,ee:o.ee};});}
 ok('un champ faux (zz) n\'est pas un élément : l\'autre joueur voit Braise en Feu',s2&&s2.el==='feu'&&s2.ee==='feu',s2);
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,6).join('\n'));await b.close();await broker.stop&&broker.stop(B);process.exit(bad||errs.length?1:0);})();
