// test de la V2.3 : la pose de course (l'arme baisse et tourne en sprint, revient à la marche ; roulis et champ de vision) et la couleur de l'arme selon son élément.   usage : node tests/runcourse.js   (≈ 25 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.__noCiel=true;window.ILE_LOBBY=o;},{heros:'feu',arme:'pistolet',elements:{pistolet:'eau',fusil:'terre'}});await p.goto('file://'+path.resolve('construit/test3d.html'));
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 await p.waitForTimeout(500);
 // la couleur moyenne des sommets de l'arme en main : [rouge, bleu]
 const col=()=>G(()=>{const g=__g();let r=0,bl=0,n=0;g.gun.traverse(o=>{const a=o.geometry&&o.geometry.attributes&&o.geometry.attributes.color;if(a)for(let i=0;i<a.count;i++){r+=a.getX(i);bl+=a.getZ(i);n++;}});return {r:r/n,b:bl/n,n,id:g.gun.children[0]&&g.gun.children[0].userData.prep&&g.gun.children[0].userData.prep.id,e:g.sim.hero.wEl,w:g.getWeap()};});
 let c=await col();ok('arme n° 1 (pistolet) en main à l\'élément choisi au lobby (eau) : modèle « '+c.id+' »',c.e==='eau'&&/^vm\.pistolet\|eau$/.test(c.id||''),c);
 const eau=c;
 await G(()=>__g().gameWeap('fusil'));await p.waitForTimeout(200);c=await col();
 ok('changer d\'arme change la couleur : fusil en Terre, plus chaud (rouge moins bleu) que le pistolet d\'Eau',c.w==='fusil'&&c.e==='terre'&&/^vm\.fusil\|terre$/.test(c.id||'')&&c.r-c.b>eau.r-eau.b+0.05,c);
 await G(()=>__g().gameWeap('pistolet'));await p.waitForTimeout(200);c=await col();
 ok('retour au pistolet : de nouveau Eau (cache par arme et par élément)',c.id==='vm.pistolet|eau'&&Math.abs(c.b-eau.b)<1e-6,c);
 const ids=await G(()=>[...__g().PREP.keys()].filter(k=>/^vm\.(pistolet|fusil)\|/.test(k)).sort().join(','));
 ok('le cache distingue les éléments ('+ids+')',/vm\.fusil\|terre/.test(ids)&&/vm\.pistolet\|eau/.test(ids));
 // sans élément connu : celui du héros (feu)
 await G(()=>{const g=__g();g.setArs([{w:'pistolet',el:'feu'}]);});await p.waitForTimeout(100);c=await col();
 ok('pistolet en Feu : plus chaud que le même pistolet en Eau',c.id==='vm.pistolet|feu'&&c.r-c.b>eau.r-eau.b+0.05,c);
 await G(()=>{const g=__g();g.setArs([{w:'pistolet',el:'eau'},{w:'fusil',el:'terre'}]);});await p.waitForTimeout(100);
 // la pose : repos
 const pose=()=>G(()=>{const g=__g(),o=g.gun,r=g.getRun();return {y:o.position.y,x:o.position.x,ry:o.rotation.y,rx:o.rotation.x,spk:r.spk,fov:r.fov,rz:r.rz,bob:r.bob};});
 await G(()=>{const g=__g(),s=g.sim,h=s.hero;h.x=20;h.z=10;h.yaw=0;h.pitch=0;h.y=0;s.heroGod=true;});await p.waitForTimeout(600);
 const rest=await pose();ok('au repos : spk 0',rest.spk<0.01,rest);
 const joy=async y=>{await G(y=>{const c=document.getElementById('game'),o={pointerId:7,clientX:60,clientY:300,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointermove',Object.assign({},o,{clientY:y})));},y);};
 const lache=()=>G(()=>{const c=document.getElementById('game');c.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,clientX:60,clientY:300,bubbles:true}));c.dispatchEvent(new PointerEvent('pointercancel',{pointerId:7,clientX:60,clientY:300,bubbles:true}));});
 // marche : demi-course du joystick
 await joy(272);await p.waitForTimeout(900);const mar=await pose();
 const sprintMarche=await G(()=>__g().sim.hero.sprint);
 ok('en marche : pas de sprint, spk reste bas, le balancement avance',!sprintMarche&&mar.spk<0.2&&mar.bob>rest.bob,{mar,sprintMarche});
 await lache();await p.waitForTimeout(500);
 // sprint : joystick à fond
 await joy(220);await p.waitForTimeout(1800);const spr=await pose();
 ok('en sprint : l\'arme est baissée (y '+spr.y.toFixed(3)+' < '+rest.y.toFixed(3)+'), tournée (ry +'+(spr.ry-rest.ry).toFixed(2)+'), penchée vers le bas (rx '+(spr.rx-rest.rx).toFixed(2)+')',spr.spk>0.85&&spr.y<rest.y-0.05&&spr.ry-rest.ry>0.4&&spr.rx-rest.rx<-0.3,{rest,spr});
 ok('en sprint : champ de vision +8° ('+spr.fov.toFixed(1)+' contre '+rest.fov.toFixed(1)+')',spr.fov-rest.fov>6);
 let rzMax=0;for(let i=0;i<20;i++){await p.waitForTimeout(60);rzMax=Math.max(rzMax,Math.abs((await pose()).rz));}
 ok('en sprint : roulis de la caméra (max '+rzMax.toFixed(4)+', au plus 0,014)',rzMax>0.003&&rzMax<=0.0141);
 await lache();await p.waitForTimeout(1500);const apres=await pose();
 ok('on s\'arrête : l\'arme remonte à sa place (y '+apres.y.toFixed(3)+' pour '+rest.y.toFixed(3)+')',Math.abs(apres.y-rest.y)<0.012&&Math.abs(apres.ry-rest.ry)<0.05&&apres.spk<0.02,{rest,apres});
 // le marteau et la pelle baissent aussi
 await G(()=>{__g().setTool('marteau');});await p.waitForTimeout(300);
 const outil=()=>G(()=>{const m=__g().held.marteau;return {y:m.position.y,ry:m.rotation.y};});
 const o0=await outil();await joy(220);await p.waitForTimeout(1800);const o1=await outil();
 ok('le marteau en main baisse aussi en sprint (y '+o1.y.toFixed(3)+' contre '+o0.y.toFixed(3)+')',o1.y<o0.y-0.05&&o1.ry-o0.ry>0.4,{o0,o1});
 await lache();
 console.log('erreurs',errs.length,errs.slice(0,3).join(' | '));if(errs.length)bad++;console.log(bad?'RATÉS '+bad:'tout est ok');await b.close();process.exit(bad?1:0);})();
