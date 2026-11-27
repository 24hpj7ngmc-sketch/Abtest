// test de l'outil Arme du lobby (V12.7) : l'outil dans la barre, l'arme en main à la couleur de son élément, « Montrer », la course comme dans Dernier Toit, le cadre de couleur sur les photos d'armes, ce que voit un autre joueur (multi), et ce qu'on refuse venant du réseau.   usage : node tests/runarme.js   (≈ 40 s)
const {chromium}=require('playwright');const path=require('path');const broker=require('./mqbroker.js');
(async()=>{const PORT=19140+Math.floor(Math.random()*100),B=await broker.start(PORT),b=await chromium.launch();const errs=[];let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const mk=async name=>{const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+' ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(name+' console '+m.text().slice(0,300));});
   await p.addInitScript(port=>{window.__mq=['ws://127.0.0.1:'+port+'/mqtt','ws://127.0.0.1:1/mqtt'];window.__nohv=true;window.__autoPanel=false;},PORT);await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);return p;};
 const G=(p,f,a)=>p.evaluate(f,a),join=async(p,w)=>{await G(p,w=>{__g().netOpen();document.getElementById('mq2').value=w;document.getElementById('mq2Go').click();document.getElementById('netV').hidden=true;},w);};
 const A=await mk('A');
 // ---------- l'outil dans la barre ----------
 ok('la barre a quatre outils : Main, Marteau, Pelle, Arme',(await A.locator('#lHot .slot small').allInnerTexts()).join('|')==='Main|Marteau|Pelle|Arme');
 ok('les modèles du lobby gagnent : hero.avatar est celui du lobby (graine 71) et hero.avatar.arme existe',await G(A,()=>{const M=__g().MODELS;return /K\.make\(71\)/.test(M['hero.avatar'].toString())&&typeof M['hero.avatar.arme']==='function'&&['pistolet','assaut','sniper','fusil','pompe','lance'].every(a=>typeof M['vm.'+a]==='function');}));
 await G(A,()=>{const g=__g();g.save.wel={};g.setWeap('pistolet');});
 ok('avant de la prendre : aucune arme devant la caméra',await G(A,()=>{const L=__g().LA;return !L.g||!L.g.visible;}));
 await A.locator('#lHot .slot[data-t=arme]').dispatchEvent('pointerdown');await A.waitForTimeout(900);
 const st=()=>G(A,()=>{const g=__g(),L=g.LA,o=L.g,col=[0,0,0];let n=0;o&&o.traverse(m=>{const c=m.geometry&&m.geometry.attributes&&m.geometry.attributes.color;if(c){for(let i=0;i<c.count;i++){col[0]+=c.array[i*3];col[1]+=c.array[i*3+1];col[2]+=c.array[i*3+2];n++;}}});
   return{tool:g.LB.tool,vis:!!o&&o.visible,inCam:!!o&&o.parent===g.lcam,key:L.key,up:L.up,col:col.map(v=>n?v/n:0),n,label:document.getElementById('aLab').textContent,act:document.getElementById('bFire').textContent,err:window.__mdlErr||[]};});
 let s0=await st();
 ok('prendre l\'outil Arme : le pistolet est devant la caméra, levé («'+s0.label+'»)',s0.tool==='arme'&&s0.vis&&s0.inCam&&s0.up>.99&&/Pistolet/.test(s0.label)&&/Montrer/.test(s0.act)&&!s0.err.length,s0);
 ok('sans choix d\'élément : l\'élément du héros joué (feu)',/^pistolet\|feu\|feu$/.test(s0.key),s0.key);
 // ---------- la couleur selon l'élément ----------
 const cols={};for(const e of['feu','eau','bois','terre','elec','vent']){await G(A,e=>{__g().save.wel.pistolet=e;},e);await A.waitForTimeout(250);const s=await st();cols[e]=s.col;ok('élément '+e+' : l\'arme est refaite à sa couleur («'+s.key+'»)',s.key.startsWith('pistolet|'+e+'|'),s.key);}
 const ds=(a,c)=>Math.hypot(a[0]-c[0],a[1]-c[1],a[2]-c[2]);const es=Object.keys(cols);let mn=9;for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++)mn=Math.min(mn,ds(cols[es[i]],cols[es[j]]));
 ok('les six éléments donnent six couleurs d\'arme différentes (écart minimal '+mn.toFixed(3)+')',mn>.004,cols);
 await G(A,()=>{const g=__g();g.setWeap('sniper');g.save.wel={sniper:'vent'};});await A.waitForTimeout(250);s0=await st();
 ok('le choix de la salle d\'armes suit : sniper de Vent',/^sniper\|vent\|feu$/.test(s0.key)&&s0.vis,s0.key);
 // ---------- Montrer ----------
 await G(A,()=>{const g=__g();g.setWeap('pistolet');g.save.wel={pistolet:'eau'};});await A.waitForTimeout(300);
 const r0=await G(A,()=>{const o=__g().LA.g;return[o.position.x,o.rotation.y];});
 await A.locator('#bFire').dispatchEvent('pointerdown');await A.waitForTimeout(750);
 const rm=await G(A,()=>{const L=__g().LA,o=L.g;return{ins:L.ins,x:o.position.x,ry:o.rotation.y,pub:__g().armePub()};});
 ok('Action = Montrer : l\'arme se lève et pivote sur son flanc (rotation '+rm.ry.toFixed(2)+' rad, au centre x '+rm.x.toFixed(2)+')',rm.ins>0&&rm.ry>r0[1]+.9&&rm.x<r0[0]-.12,[r0,rm]);
 await A.waitForTimeout(1100);const rf=await G(A,()=>{const L=__g().LA,o=L.g;return{ins:L.ins,x:o.position.x,ry:o.rotation.y};});
 ok('au bout d\'environ 1,5 s elle est revenue',rf.ins===-1&&Math.abs(rf.ry-r0[1])<.05&&Math.abs(rf.x-r0[0])<.02,rf);
 ok('pas de tir au lobby : Action n\'a rien tiré, aucune erreur',await G(A,()=>!(window.__mdlErr||[]).length));
 // ---------- la course comme dans Dernier Toit ----------
 const run=await G(A,async()=>{const g=__g(),sleep=ms=>new Promise(r=>setTimeout(r,ms));let steps=0;const p0=g.SND.play;g.SND.play=n=>{if(n==='step')steps++;return p0.call(g.SND,n);};
   const base={fov:g.lcam.fov,ry:g.LA.g.rotation.y,rx:g.LA.g.rotation.x,y:g.LA.g.position.y};g.LB.pitch=0;
   // marche (joystick à moitié)
   g.joy.f=.9;g.joy.r=0;g.joy.full=0;await sleep(1200);const walk={spk:g.LB.spk,fov:g.lcam.fov,steps,bob:g.LB.bob,ry:g.LA.g.rotation.y};
   // sprint (joystick à fond)
   const s1=steps;g.joy.f=1;g.joy.r=0;let roll=0;const t0=performance.now();while(performance.now()-t0<1600){roll=Math.max(roll,Math.abs(g.lcam.rotation.z));await sleep(16);}
   const sp={spk:g.LB.spk,fov:g.lcam.fov,steps:steps-s1,roll,ry:g.LA.g.rotation.y,rx:g.LA.g.rotation.x,y:g.LA.g.position.y,x:g.LA.g.position.x,rz:g.LA.g.rotation.z};
   g.joy.f=0;g.joy.full=0;await sleep(900);const rest={spk:g.LB.spk,fov:g.lcam.fov,roll:g.lcam.rotation.z};g.SND.play=p0;return{base,walk,sp,rest};});
 ok('à la marche : des pas (bruit à chaque demi-période), pas de sprint ('+run.walk.steps+' pas en 1,2 s)',run.walk.steps>=2&&run.walk.steps<=6&&run.walk.spk<.05&&Math.abs(run.walk.fov-run.base.fov)<.5,run.walk);
 ok('au sprint : champ de vision +8° ('+run.sp.fov.toFixed(1)+' contre '+run.base.fov.toFixed(1)+'), roulis de caméra '+run.sp.roll.toFixed(3)+' (≤ 0,014), plus de pas',run.sp.spk>.95&&run.sp.fov>run.base.fov+7&&run.sp.roll>.005&&run.sp.roll<=.0141&&run.sp.steps>=3,run.sp);
 ok('au sprint : l\'arme est baissée et tournée sur le côté (ry +'+(run.sp.ry-run.base.ry).toFixed(2)+', rx '+(run.sp.rx-run.base.rx).toFixed(2)+')',run.sp.ry-run.base.ry>.35&&run.sp.rx-run.base.rx<-.25&&run.sp.y<run.base.y-.04,run.sp);
 ok('à l\'arrêt : tout revient (spk, champ de vision, roulis)',run.rest.spk<.02&&Math.abs(run.rest.fov-run.base.fov)<.3&&Math.abs(run.rest.roll)<.001,run.rest);
 // ---------- le cadre de couleur sur les photos d'armes (salle d'armes, portails) ----------
 await G(A,()=>{const g=__g();g.lobTool('main');g.save.wel={pistolet:'terre',assaut:'vent'};g.setWeap('pistolet');g.openTree('arme');});await A.waitForTimeout(200);
 const fr=await G(A,()=>[...document.querySelectorAll('#tArms .ray:not(.tabs) button[data-w]')].map(b=>{const i=b.querySelector('img.wpic');return[b.dataset.w,i?i.getAttribute('style'):null];}));
 const cl=await G(A,()=>({terre:__g().EL?0:0}));
 ok('salle d\'armes : chaque arme a sa photo encadrée de la couleur de son élément',fr.length>=6&&fr.every(q=>q[1]&&/--ec:#/.test(q[1]))&&fr.find(q=>q[0]==='pistolet')[1].includes('#')&&fr.find(q=>q[0]==='assaut')[1].includes('#8fe6dc'),fr);
 await G(A,()=>{document.getElementById('treeV')&&(document.getElementById('treeV').hidden=true);document.querySelectorAll('.panel,[id$=V]').forEach(e=>{if(e.id==='treeV'||e.id==='tree')e.hidden=true;});});
 await G(A,()=>{document.getElementById('start').hidden=false;__g().lobSync();});
 const fp=await G(A,()=>[...document.querySelectorAll('#sArms button[data-w] img.wpic')].map(i=>i.getAttribute('style')));
 ok('panneau du premier portail : les photos portent la couleur de l\'élément de chaque arme',fp.length>=3&&fp.every(q=>/--ec:#/.test(q)),fp);
 await G(A,()=>{document.getElementById('start').hidden=true;});
 // ---------- ce que refuse le réseau ----------
 const bad1=await G(A,()=>{const g=__g(),f=g.armeNet;return['__proto__|feu','pistolet|constructor','pistolet|<b>x</b>','toString|feu','pistolet','pistolet|feu|x',123,null,{a:1},'x'.repeat(40),'pistolet|FEU'].map(v=>f(v));});
 ok('armeNet refuse tout ce qui n\'est pas « arme|élément » de la liste',bad1.every(v=>v===null)&&await G(A,()=>{const r=__g().armeNet('pompe|bois');return r&&r.a==='pompe'&&r.el==='bois';}),bad1);
 // ---------- multi : B voit l'arme de A ----------
 const Bp=await mk('B');
 await join(A,'arme56');await A.waitForTimeout(2600);await join(Bp,'arme56');await Bp.waitForTimeout(8500);
 const vB=()=>G(Bp,()=>{const g=__g(),o=Object.values(g.LN.av)[0];return o?{aw:o.aw,vis:!!o.vis,gun:!!o.gun,ix:o.ix,exT:o.exT,n:Object.keys(g.LN.av).length,err:window.__mdlErr||[]}:null;});
 let vb=await vB();ok('A sans l\'outil Arme : B voit son avatar sans arme (téléphone qui n\'envoie rien)',!!vb&&vb.aw===''&&!vb.vis,vb);
 await G(A,()=>{const g=__g();g.setWeap('assaut');g.save.wel={assaut:'elec'};g.lobTool('arme');});await Bp.waitForTimeout(1500);vb=await vB();
 ok('A prend l\'arme : B voit un avatar avec le fusil d\'assaut d\'Éclair dans la main',!!vb&&vb.aw==='assaut|elec'&&vb.vis&&vb.gun&&!vb.err.length,vb);
 const colB=await G(Bp,()=>{const o=Object.values(__g().LN.av)[0],c=[0,0,0];let n=0;o.gun.traverse(m=>{const q=m.geometry&&m.geometry.attributes&&m.geometry.attributes.color;if(q)for(let i=0;i<q.count;i++){c[0]+=q.array[i*3];c[1]+=q.array[i*3+1];c[2]+=q.array[i*3+2];n++;}});return c.map(v=>v/n);});
 const colA=await G(A,()=>{const o=__g().LA.g,c=[0,0,0];let n=0;o.traverse(m=>{const q=m.geometry&&m.geometry.attributes&&m.geometry.attributes.color;if(q)for(let i=0;i<q.count;i++){c[0]+=q.array[i*3];c[1]+=q.array[i*3+1];c[2]+=q.array[i*3+2];n++;}});return c.map(v=>v/n);});
 ok('la couleur de l\'arme chez B est celle de l\'élément choisi par A (même teinte que chez A)',ds(colA,colB)<.02,[colA,colB]);
 await G(A,()=>{__g().armeShow();});await Bp.waitForTimeout(700);const vi=await vB();
 ok('A montre son arme : B voit l\'inspection (ix, chronomètre lancé)',!!vi&&vi.ix===1&&vi.exT>0,vi);
 await Bp.waitForTimeout(1600);
 await G(A,()=>{__g().lobTool('main');});await Bp.waitForTimeout(1500);vb=await vB();
 ok('A reprend la main : l\'arme disparaît de l\'avatar chez B, sans doublon',!!vb&&vb.aw===''&&!vb.vis&&vb.n===1,vb);
 console.log('messages relayés',B.stats.pub,'· ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();B.close();})();
