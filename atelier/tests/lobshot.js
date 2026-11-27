// captures de l'Île céleste (lobby) rendue par le moteur d'aperçu.  usage : node tests/lobshot.js [prefixe] [scènes=vide,village]
const {chromium}=require('playwright');const path=require('path');
const pre=process.argv[2]||'shots3d/lob-',scenes=(process.argv[3]||'vide,village').split(',');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,400));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;if(!/demo/.test(location.hash))window.__nodemo=true;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 const view=async(name,x,z,tx,tz,pitch,y,hud)=>{await p.evaluate(([x,z,yaw,pitch,y])=>{const g=__g(),L=g.LB;L.x=x;L.z=z;L.yaw=yaw;L.pitch=pitch;L.y=g.hAt(x,z)+(y||0);L.vy=y?20:0;},[x,z,Math.atan2(x-tx,z-tz),pitch||0,y]);
   await p.evaluate(h=>{let s=document.getElementById('__h');if(!s){s=document.createElement('style');s.id='__h';document.head.appendChild(s);}s.textContent=h?'':'#hud,#toast{display:none!important}';},!!hud);
   if(y){await p.evaluate(([y])=>{window.__hold&&clearInterval(window.__hold);window.__hold=setInterval(()=>{const g=__g(),L=g.LB;L.y=g.hAt(L.x,L.z)+y;L.vy=0;},8);},[y]);}else await p.evaluate(()=>{window.__hold&&clearInterval(window.__hold);});
   await p.waitForTimeout(1400);await p.screenshot({path:pre+name+'.png'});};
 if(scenes.includes('demo')){await p.evaluate(()=>{const g=__g(),s=g.save;for(const k of['feu','eau','bois','relique','couronne'])s.loot[k]=1;__g().LB.on&&document.querySelector('#lHot .slot[data-t=marteau]').dispatchEvent(new PointerEvent('pointerdown'));});
  await p.evaluate(()=>{const c=()=>document.querySelector('#lSub .tchip[data-k="!demo"]').click();c();c();document.querySelector('#lHot .slot[data-t=main]').dispatchEvent(new PointerEvent('pointerdown'));});await p.waitForTimeout(600);
  const L=await p.evaluate(()=>{const L=__g().LB;return[L.x,L.z,L.yaw];});console.log('réveil',L.map(v=>v.toFixed(1)).join(' '),'· éléments',await p.evaluate(()=>__g().save.vil.length));
  await view('d1-reveil',L[0],L[1],L[0]-Math.sin(L[2])*5,L[1]-Math.cos(L[2])*5,.05,0,true);await view('d2-arrivee',0,-23,0,0,.08);await view('d3-place',0,-12,0,6,.14);await view('d4-ouest',-4,3,-15,3,.1);await view('d5-est',3,2,18,4,.12);await view('d6-haut',0,-50,0,0,-.62,34);await view('d7-large',46,-30,0,0,-.42,22);await view('d8-colline',25,13,0,0,-.2);}
 if(scenes.includes('vide')){await view('01-vide',0,-19,0,10,.02,0,true);await p.evaluate(()=>__g().lobTool('marteau'));await view('02-marteau',0,-12,0,0,-.12,0,true);await p.evaluate(()=>__g().lobTool('main'));await view('03-portails',0,-14,0,-30,.14,0,true);}
 if(scenes.includes('village')){
  await p.evaluate(()=>{const g=__g(),s=g.save;s.dev=true;for(const k of['feu','eau','bois','terre','elec','relique','couronne','sceau'])s.loot[k]=1;
    // un peu de relief : une colline à l'est, une mare à l'ouest
    const L=g.LB;for(let i=0;i<4;i++)g.lobLine(22,12,26,8,'up');g.lobLine(19,17,22,12,'up');g.lobLine(-24,14,-20,18,'down');g.lobLine(-24,14,-24,14,'down');
    const P=(k,x,z,r)=>{L.tx=x;L.tz=z;const ok=g.vilPlace(k,x,z,r);if(!ok)console.error('pose ratée '+k);};
    P('hall',0,2,Math.PI);P('maison',-14,-8,Math.PI/2+.3);P('musee',15,-9,-Math.PI/2-.3);P('armes',-13,9,Math.PI/2+.9);P('marchand',9,14,Math.PI);P('fontaine',0,-11,0);P('astre',0,20,0);
    for(const q of[[-5,-13],[5,-13],[-8,-3],[8,-3]])P('lanterne',q[0],q[1],0);for(const q of[[-22,-2],[-20,2],[-24,6],[22,-18],[10,24],[-6,24],[-28,-10]])P(q[0]%4?'arbre':'pin',q[0],q[1],q[0]);
    P('rocher',24,16,1);P('rocher',-18,22,2);P('banniere',-4,-18,0);P('banniere',4,-18,0);P('fleurs',-3,-8,0);P('fleurs',3,-8,1);P('buisson',-10,-14,0);P('statue',18,4,-1.5);P('colonne',-9,17,0);P('arche',0,-20,0);
    g.terrLocks();g.lobSync();});
  await view('10-village',0,-21,0,2,.08,0,true);await view('11-hall',0,-7.5,0,2,.2);await view('12-maison',-6.5,-5,-14,-8,.14,0,true);await view('13-musee',7,-6,15,-9,.1,0,true);await view('14-armes',-6.5,5.5,-13,9,.14);
  await view('15-marchand',9,7,9,14,.05,0,true);await view('16-colline',10,8,23,11,.12);await view('17-mare',-14,8,-23,15,-.2);await p.evaluate(()=>__g().lobTool('pelle'));await view('18-pelle',12,16,22,12,-.1,0,true);await p.evaluate(()=>__g().lobTool('main'));
  await view('19-haut',0,-46,0,0,-.6,30);await view('20-large',44,38,0,0,-.42,24);}
 console.log('images du lobby',await p.evaluate(()=>window.__lframes),'· modèles en erreur :',await p.evaluate(()=>JSON.stringify(window.__mdlErr||[])),'· shaders :',await p.evaluate(()=>JSON.stringify((window.__shaderErrors||[]).slice(0,3))));
 console.log('erreurs',errs.length);console.log([...new Set(errs)].slice(0,12).join('\n'));await b.close();})();
