// test des panneaux de portail et de la carte (V11.3) : la croix ferme, toucher un héros le choisit sans lancer, le bouton du bas lance, les réglages sont sur la carte.   usage : node tests/runpanneau.js   (≈ 10 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];let bad=0;const ok=(n,c,x)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||x===undefined?'':' '+JSON.stringify(x)));};p.on('pageerror',e=>errs.push(e.message));
 const G=(f,a)=>p.evaluate(f,a),tap=async s=>{await p.locator(s).first().evaluate(el=>el.click());await p.waitForTimeout(120);},sv=()=>G(()=>JSON.parse(localStorage.getItem('ile5-save')||'{}'));
 await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(2000);await G(tl=>{IleDesCinq.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));
 await G(()=>{for(const v of document.querySelectorAll('.veil'))v.hidden=true;document.getElementById('start').hidden=false;});
 ok('portail de l\'île : plus de réglages (tir, son, dev, mot de salon)',await G(()=>!['sFire','sSnd','sDev','sMq','mqCode'].some(i=>document.getElementById(i))));
 await tap('#sGrid .pick[data-el=eau]');let r=await G(()=>({go:document.getElementById('sGo').textContent,vu:!document.getElementById('start').hidden,jeu:IleDesCinq.ouvert,cur:document.querySelector('#sGrid .pick.cur').dataset.el}));
 ok('toucher Ondine la choisit sans lancer la partie',r.vu&&!r.jeu&&r.cur==='eau'&&r.go==='Lancer la partie avec Ondine'&&(await sv()).last==='eau',r);
 r=await G(()=>{const g=document.getElementById('sGo').getBoundingClientRect(),x=document.getElementById('sBack').getBoundingClientRect();return{g:[g.top,g.bottom],x:[x.top,x.bottom,x.width]};});
 ok('la croix est en haut, le bouton qui lance est en bas, tous deux à l\'écran',r.x[0]>=0&&r.x[1]<80&&r.x[2]>=40&&r.g[0]>250&&r.g[1]<=390,r);
 await G(()=>{document.getElementById('start').scrollTop=9999;});r=await G(()=>{const g=document.getElementById('sGo').getBoundingClientRect(),x=document.getElementById('sBack').getBoundingClientRect();return{g:[g.top,g.bottom],x:[x.top,x.bottom]};});
 ok('après défilement ils sont toujours à l\'écran',r.x[0]>=0&&r.x[1]<80&&r.g[1]<=390&&r.g[0]>250,r);
 await tap('#sBack');ok('la croix ferme le panneau de l\'île',await G(()=>document.getElementById('start').hidden));
 await G(()=>{document.getElementById('start').hidden=false;});await tap('#sGo');for(let i=0;i<40&&!(await G(()=>IleDesCinq.ouvert));i++)await p.waitForTimeout(150);
 ok('le bouton du bas lance la partie avec Ondine',await G(()=>IleDesCinq.ouvert&&__g().getIR()&&__g().getIR().el==='eau'));
 await G(()=>{IleDesCinq.fermer();__g().ileBack();for(const v of document.querySelectorAll('.veil'))v.hidden=true;});await p.waitForTimeout(300);
 await G(()=>{__g().toitDraw();document.getElementById('toitV').hidden=false;});await tap('#dtGrid .pick[data-el=terre]');r=await G(()=>({go:document.getElementById('dtGo').textContent,vu:!document.getElementById('toitV').hidden,jeu:DernierToit.ouvert,cur:document.querySelector('#dtGrid .pick.cur').dataset.el}));
 ok('Dernier Toit : toucher Roc le choisit sans lancer',r.vu&&!r.jeu&&r.cur==='terre'&&r.go==='Lancer la partie avec Roc',r);
 await tap('#dtBack');ok('la croix ferme le panneau du toit',await G(()=>document.getElementById('toitV').hidden));
 await G(()=>{__g().lobSync();__g().toitDraw();});{const r=await G(()=>{const f=id=>[...document.querySelectorAll('#'+id+' .pick')].map(b=>[...b.children].map(c=>c.tagName+'.'+c.className).join(',')+'|'+((b.querySelector('img')||{}).naturalWidth||0)).join(' ; '),ord=id=>[...document.querySelectorAll('#'+id+' .card > *')].map(e=>e.id||(e.querySelector('h1,h2,[id]')||{}).id||(e.querySelector('h2')||{}).textContent||e.tagName).join('>');return{a:f('sGrid'),b:f('dtGrid'),h:(document.getElementById('hallB')&&(__g().hallDraw&&__g().hallDraw(),f('hallB')))||'',oa:ord('start'),ob:ord('toitV')};});
  ok('les cartes de héros sont les mêmes aux deux portails, chacune avec son portrait chargé',r.a===r.b&&r.a.split(' ; ').length===6&&r.a.split(' ; ').every(c=>c.startsWith('IMG.hpic,B.,EM.,SMALL.kit,SMALL.pts|100')),r.a.slice(0,120));
  ok('même ordre dans les deux menus : arme, son élément, héros, niveaux, bouton',/sArms>sWel>Choisis ton héros>sGrid>Campagne>sCamp/.test(r.oa)&&/dtArms>dtWel>Choisis ton héros>dtGrid>Campagne>dtRang/.test(r.ob)&&r.oa.endsWith('sGo')&&r.ob.endsWith('dtGo'),[r.oa,r.ob]);}
 await G(()=>{document.getElementById('mini').onpointerdown({preventDefault(){}});});await p.waitForTimeout(700);
 ok('carte : Son, Mode de tir, Saut auto, Mode dev, Multi',await G(()=>['snd','fire','aj','devm','net'].every(a=>document.querySelector('#mapOpt [data-a='+a+']'))));
 const L=[];for(let i=0;i<3;i++){await tap('#mapOpt [data-a=fire]');L.push((await sv()).fire+'/'+await G(()=>document.querySelector('#mapOpt [data-a=fire] b').textContent));}
 ok('carte : le mode de tir tourne entre les trois et se garde',L.join(' ')==='btn/bouton auto/100 % auto cible/auto sur cible',L);
 await tap('#mapOpt [data-a=snd]');ok('carte : le son se coupe',(await sv()).snd===false&&await G(()=>document.querySelector('#mapOpt [data-a=snd] b').textContent==='coupé'));await tap('#mapOpt [data-a=snd]');
 await tap('#mapOpt [data-a=devm]');ok('carte : le mode dev s\'active et montre ses outils',(await sv()).dev===true&&await G(()=>!!document.querySelector('#mapOpt [data-a=dev]')));await tap('#mapOpt [data-a=devm]');
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,6).join('\n'));await b.close();process.exit(bad||errs.length?1:0);})();
