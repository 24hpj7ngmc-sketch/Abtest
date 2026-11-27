// test du lobby à plusieurs (V10.5) : deux téléphones simulés tapent le même mot de salon (serveur de messages local, mqbroker.js) ; le second arrive sur l'île du premier.   usage : node tests/runmulti.js   (≈ 45 s)
const {chromium}=require('playwright');const path=require('path');const broker=require('./mqbroker.js');
(async()=>{const PORT=18940+Math.floor(Math.random()*100),B=await broker.start(PORT),b=await chromium.launch();const errs=[];let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const mk=async name=>{const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+' ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(name+' console '+m.text().slice(0,300));});
   await p.addInitScript(port=>{window.__mq=['ws://127.0.0.1:'+port+'/mqtt','ws://127.0.0.1:1/mqtt'];window.__nohv=true;},PORT);await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);return p;};
 const G=(p,f,a)=>p.evaluate(f,a),tap=async(p,s)=>{await p.locator(s).first().evaluate(el=>el.click());await p.waitForTimeout(100);},join=async(p,w)=>{await G(p,w=>{__g().netOpen();document.getElementById('mq2').value=w;document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},w);};
 const st=p=>G(p,()=>{const g=__g(),s=g.save,ls=JSON.parse(localStorage.getItem('ile5-save')||'{}');return{vis:g.VISIT.on,n:s.vil.length,font:s.vil.filter(B=>B.t==='fontaine').length,evo:s.evo,av:Object.keys(g.LN.av).length,lab:Object.values(g.LN.av).map(o=>o.l.userData.sig).join(';'),host:g.LN.host===g.LN.me,nn:g.LN.n,ls:(ls.vil||[]).length,lsF:(ls.vil||[]).filter(B=>B.t==='fontaine').length,tool:g.LB.tool,x:g.LB.x,z:g.LB.z,line:g.netLine()};});
 const A=await mk('A'),Bp=await mk('B');
 ok('le lobby tourne et la carte propose « Multi »',await G(A,()=>{const g=__g();g.lobAct;document.getElementById('mapV').hidden=false;return g.LB.on;})&&await G(A,()=>{const g=__g();return typeof g.netLine()==='string';}));await G(A,()=>{document.getElementById('mapV').hidden=true;});
 // audit : une île trafiquée (types « constructor », coordonnées énormes) ne casse rien, et on rentre chez soi intact
 {const h=await G(A,()=>{const g=__g(),n0=g.save.vil.length;g.islVisit('x',{e:3,v:[['constructor',0,0,0],['__proto__',0,0,0],['hall',1e300,0,0],['hall',0,0,3.1,99],['taverne',30,30,0,2]],t:'A99999999'},'test');const r={vis:g.VISIT.on,n:g.save.vil.length,views:g.vilV.size,evo:g.save.evo,ri:g.getRI(),tav:g.save.q.length};g.lobAct;g.islHome();return Object.assign(r,{n0,n1:g.save.vil.length,back:!g.VISIT.on});});
  ok('île trafiquée : seuls les deux bâtiments valides sont posés, sans erreur ; retour chez soi intact',h.vis&&h.n===2&&h.views===2&&h.evo===3&&h.back&&h.n1===h.n0,h);}
 // A rend son île reconnaissable : deux fontaines de plus et une butte. (Le relief se compare après un réaménagement chez A : une butte toute fraîche est un peu rabotée au prochain aménagement, chez l'hôte comme chez le visiteur.)
 const a0=await G(A,()=>{const g=__g(),s=g.save;s.dev=true;const n0=s.vil.length;let put=0;for(let x=20;x<60&&put<2;x+=6)if(g.vilPlace('fontaine',x,34,0))put++;s.dev=false;g.lobLine(-40,30,-40,30,'up',0);g.lobLine(-40,30,-40,30,'up',0);g.persist();return{n0,n:s.vil.length,put,h:g.hAt(-40,30)};});
 const b0=await G(Bp,()=>{const g=__g();g.persist();return{n:g.save.vil.length,font:g.save.vil.filter(B=>B.t==='fontaine').length,h:g.hAt(-40,30),evo:g.save.evo};});
 ok('préparation : l\'île de A a deux fontaines de plus et une butte que B n\'a pas',a0.put===2&&a0.n===a0.n0+2&&a0.h>b0.h+1,[a0,b0]);
 await G(A,()=>{const g=__g();g.netOpen();const i=document.getElementById('netName');i.value='Fred<b>!';i.dispatchEvent(new Event('input'));document.getElementById('netV').hidden=true;});
 await join(A,'ami56');await A.waitForTimeout(2600);let sa=await st(A);
 ok('A ouvre le salon : seul, chez lui («'+sa.line+'»)',!sa.vis&&sa.nn===1&&/seul/.test(sa.line),sa);
 await join(Bp,'ami56');await Bp.waitForTimeout(8500);sa=await st(A);let sb=await st(Bp);
 ok('B tape le même mot : il arrive sur l\'île de A (village et relief de A), A reste chez lui',sb.vis&&!sa.vis&&sb.n===a0.n&&sb.font===b0.font+2&&sa.host&&!sb.host&&sa.nn===2&&sb.nn===2&&Math.abs(await G(Bp,()=>__g().hAt(-40,30))-await G(A,()=>{const g=__g();g.terraPlan();g.terrDraw();return g.hAt(-40,30);}))<.05&&await G(Bp,()=>__g().hAt(-40,30))>b0.h+.5,[sa,sb,a0.h,b0.h]);
 ok('la sauvegarde de B garde SON village, pas celui de A',await G(Bp,()=>{__g().persist();return true;})&&(sb=await st(Bp)).ls===b0.n&&sb.lsF===b0.font,sb);
 ok('chacun voit l\'autre : un personnage chez A (« en visite »), un chez B (« hôte »)',sa.av===1&&sb.av===1&&/en visite/.test(sa.lab)&&/hôte/.test(sb.lab),[sa.lab,sb.lab]);
 ok('le nom de A, nettoyé (« Fredb »), est au-dessus de son héros chez B et dans la liste du salon',/^FREDB\|Braise · hôte/.test(sb.lab)&&await G(Bp,()=>{__g().netOpen();const t=document.getElementById('netL').textContent;document.getElementById('netV').hidden=true;return /Fredb · Braise/.test(t)&&/hôte · sur l.île/.test(t)&&/toi/.test(t);}),sb.lab);
 const hm=await G(Bp,()=>{const g=__g(),H=g.save.vil.find(B=>B.t==='maison');return H?Math.hypot(g.LB.x-H.x,g.LB.z-H.z):-1;});ok('B apparaît devant la maison de A ('+hm.toFixed(1)+' m)',hm>0&&hm<12);
 await G(Bp,()=>{__g().lobTool('marteau');});const tb=await G(Bp,()=>({tool:__g().LB.tool,toast:document.getElementById('toast').textContent}));ok('en visite, B ne peut pas prendre le marteau («'+tb.toast.slice(0,40)+'…»)',tb.tool==='main'&&/En visite/.test(tb.toast));
 await G(A,()=>{const g=__g();g.LB.x+=6;g.LB.z+=3;});await A.waitForTimeout(1500);
 const mv=await G(Bp,()=>{const o=Object.values(__g().LN.av)[0];return o?[o.x,o.z]:null;}),ap=await G(A,()=>[__g().LB.x,__g().LB.z]);ok('A marche : son personnage suit chez B',!!mv&&Math.hypot(mv[0]-ap[0],mv[1]-ap[1])<1.5,[mv,ap]);
 await G(A,()=>{const g=__g(),s=g.save;s.dev=true;for(let x=20;x<70;x+=5)if(g.vilPlace('statue',x,44,0))break;s.dev=false;});await A.waitForTimeout(7500);
 ok('A pose une statue : elle arrive chez B',await G(Bp,()=>__g().save.vil.some(B=>B.t==='statue')&&__g().VISIT.on));
 // A quitte le salon : B rentre chez lui ; A revient : c'est maintenant B l'hôte
 await G(A,()=>{__g().netOpen();document.getElementById('mq2Out').click();document.getElementById('netV').hidden=true;});await Bp.waitForTimeout(7500);sb=await st(Bp);
 ok('A quitte le salon : B se retrouve sur sa propre île, intacte',!sb.vis&&sb.n===b0.n&&sb.font===b0.font&&sb.av===0&&Math.abs(await G(Bp,()=>__g().hAt(-40,30))-b0.h)<.3,sb);
 await join(A,'ami56');await A.waitForTimeout(9000);sa=await st(A);sb=await st(Bp);
 ok('A revient : cette fois c\'est lui le visiteur, sur l\'île de B ; sa sauvegarde garde ses fontaines',sa.vis&&!sb.vis&&sa.n===b0.n&&sb.host&&(await G(A,()=>{__g().persist();return true;}))&&(sa=await st(A)).lsF===b0.font+2,[sa,sb]);
 // le portail en groupe : B lance une partie, A voit le bouton et le rejoint
 for(const P of[A,Bp])await P.evaluate(tl=>{IleDesCinq.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));
 await tap(Bp,'#sGrid .pick[data-el=terre]');await tap(Bp,'#sGo');await Bp.waitForTimeout(2500);
 const gb=await G(A,()=>({hid:document.getElementById('lGrp').hidden,txt:document.getElementById('lGrp').textContent}));ok('B entre dans L\'Île des Cinq : chez A le bouton «'+gb.txt+'» apparaît',!gb.hid&&/Roc est en partie/.test(gb.txt),gb);
 await A.locator('#lGrp').dispatchEvent('pointerdown');await A.waitForTimeout(6000);
 // sous charge (tous les tests ensemble) B met parfois plus longtemps à voir A : on attend jusqu'à 10 s au lieu de lire tout de suite (V12.1)
 {const hud=P=>P.frames().find(f=>f!==P.mainFrame()).evaluate(()=>document.querySelector('#sNet b').textContent),lis=async()=>[await hud(A),await hud(Bp)];let a='',c='';for(let i=0;i<40;i++){[a,c]=await lis();if(/^2 · invité/.test(a)&&/^2 · hôte/.test(c))break;await A.waitForTimeout(250);}
  ok('A touche le bouton : il rejoint la partie de B comme invité (A «'+a+'», B «'+c+'»)',/^2 · invité/.test(a)&&/^2 · hôte/.test(c)&&await G(A,()=>IleDesCinq.ouvert));}
 console.log('messages relayés',B.stats.pub,'· ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();B.close();})();
