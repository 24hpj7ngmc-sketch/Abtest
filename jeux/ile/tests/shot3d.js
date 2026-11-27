// captures du jeu rendu par le moteur d'aperçu.  usage : node tests/shot3d.js [page] [prefixe] [hero] [scènes=world,towers,enemies,boss,hands]
const {chromium}=require('playwright');const path=require('path');
const page=process.argv[2]||'test3d.html',pre=process.argv[3]||'shots3d/v',hero=process.argv[4]||'terre',scenes=(process.argv[5]||'world').split(',');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,400));});
 await p.addInitScript(h=>{window.__keep=true;window.ILE_LOBBY={heros:h};},hero);await p.goto('file://'+path.resolve(page.includes('/')?page:'construit/'+page));await p.waitForTimeout(3500);
 const hud=process.env.HUD?'':'#hud,#mark,#toast,#hurt{display:none!important}';if(hud)await p.addStyleTag({content:hud});
 const view=async(name,x,z,yaw,pitch,y,wait)=>{await p.evaluate(([x,z,yaw,pitch,y])=>{const g=__g(),s=g.sim;s.heroGod=true;s.god=true;s.hero.x=x;s.hero.z=z;s.hero.yaw=yaw;s.hero.pitch=pitch;s.hero.y=y||0;s.hero.vy=0;g.save.dev=true;g.dev.fly=!!y;},[x,z,yaw,pitch,y]);await p.waitForTimeout(wait||1300);await p.screenshot({path:pre+name+'.png'});};
 // regarder un point (tx,tz) depuis (x,z) : yaw tel que la caméra (qui regarde vers -Z à yaw 0) vise la cible
 const look=(name,x,z,tx,tz,pitch,y,wait)=>view(name,x,z,Math.atan2(x-tx,z-tz),pitch||0,y,wait);
 if(scenes.includes('world')){
  await view('01-depart',4,12,0,0);
  await look('02-coeur',7,17,0,0,.12);
  await look('03-marchand',...await p.evaluate(()=>{const S=__g().SHOP,k=1.75;return[S[0]*k+2,S[1]*k+2,S[0],S[1]];}),.02);
  await look('04-portail-nord',-4,-92,0,-112,.1);
  await look('05-chemin',10,-44,-6,-36,-.05);
  await look('06-statue',...await p.evaluate(()=>{const g=__g(),q=g.posAt(g.PATHS[2],g.PATHS[2].len-24);return[q[0]+3,q[1]+2,q[0]-q[2]*14,q[1]-q[3]*14];}),.05);
  await look('07-colline',...await p.evaluate(()=>{const g=__g();let best=null;for(let i=0;i<g.HILL.length;i++)if(g.HILL[i]>=2){best=i;break;}const x=g.cellX(best),z=g.cellZ(best),r=Math.hypot(x,z);return[x*(r-16)/r,z*(r-16)/r,x,z];}),.08);
  await look('08-plage',26,118,31,132,-.12);
  await look('09-haut',0,60,0,0,-.75,46);
  await look('10-large',-60,-70,0,0,-.35,30);}
 if(scenes.includes('towers')){
  await p.evaluate(()=>{const g=__g(),s=g.sim;s.gold=99999;const T=[['mortier',9,-3,['feu']],['canon',15,-9,['eau','eau','elec']],['archer',21,-3,['bois','bois','bois','terre','terre','terre','feu','feu','feu']],['mortier',9,-12,['terre','terre','terre','feu']],['canon',26,-12,['feu']],['archer',15,2,['elec']]];
    for(const t of T){g.place(s,t[0],t[1],t[2],t[3][0]);const tw=s.towers[s.towers.length-1];for(let i=1;i<t[3].length;i++)g.upgrade(s,tw.id,t[3][i]);}});
  await p.waitForTimeout(1500);
  await look('20-tours',14,10,16,-6,.1);await look('21-tours-pres',12.5,-.5,9,-3,.12);await look('22-canon',17,-4.5,15,-9,.1);await look('23-archer',25,3,21,-3,.38);await look('24-tours-haut',16,6,16,-6,-.55,16);
  await p.evaluate(()=>{const g=__g(),s=g.sim;g.setTool('marteau');});await view('25-fantome',4,12,.6,-.12);await p.evaluate(()=>__g().setTool('pistolet'));}
 if(scenes.includes('enemies')||scenes.includes('boss')||scenes.includes('kinds')){
  await p.evaluate(sc=>{const g=__g(),s=g.sim;g.startWave(s);s.queue.length=0;s.enemies.length=0;const E=['feu','eau','bois','terre','elec'];let n=0;
    if(sc.includes('enemies')||sc.includes('kinds'))for(const k of['b','tank','air','dig','ste','rng'])for(let i=0;i<5;i++)s.queue.push({t:s.t,path:2,el:E[i],boss:false,k,slot:n++});
    if(sc.includes('boss'))for(let bt=1;bt<=3;bt++)s.queue.push({t:s.t,path:2,el:E[bt+1],boss:true,bt,k:'b',slot:100+bt});},scenes);
  await p.waitForTimeout(400);
  // on range les ennemis en rangs sur la prairie, face au joueur, et on les fige
  await p.evaluate(()=>{const g=__g(),s=g.sim;s.enemies.forEach((e,i)=>{e.frz=true;});window.__frz=setInterval(()=>{const s=__g().sim;let i=0,b=0;for(const e of s.enemies){if(e.boss){e.x=-30+b*22;e.z=70;b++;}else{const row=Math.floor(i/5),col=i%5;e.x=-9+col*4.5;e.z=34+row*5;i++;}e.ang=Math.PI;e.sp=0;e.fm=true;e.tc=-1;e.rev=e.k==='ste'&&(e.id%2)?9:0;e.hp=e.max*(e.id%3?1:.6);e.d=0;e.dx=0;e.dz=-1;e.bur=false;e.atk=0;}},16);});
  await p.waitForTimeout(900);
  if(scenes.includes('enemies')){await view('30-ennemis',0,22,Math.PI,-.02);await view('31-rang1',-4,29,Math.PI+.3,-.08);await view('32-rang2',4,39.5,Math.PI-.3,-.05);await view('33-air',0,44,Math.PI,.5);await view('34-rang-fond',-3,54.5,Math.PI+.25,-.08);await view('35-haut',0,30,Math.PI,-.6,14);}
  if(scenes.includes('kinds')){await view('36-tank',-3,35.5,Math.PI+.25,-.1);await view('37-air',-2,39,Math.PI,.85);await view('38-air-loin',-14,30,Math.PI-.75,.3);await view('39-dig',3,45,Math.PI-.3,-.12);}
  if(scenes.includes('boss')){await view('40-boss',-8,40,Math.PI,.22);await view('41-boss1',-30,58,Math.PI,.3);await view('42-boss3',14,45,Math.PI,.42);}
  await p.evaluate(()=>clearInterval(window.__frz));}
 if(scenes.includes('walls')){
  await p.evaluate(()=>{const g=__g(),s=g.sim;s.gold=99999;g.addWalls(s,-14,22,-2,22);g.addWalls(s,-14,22,-10,22);g.addWalls(s,-14,22,-14,22);g.addWalls(s,-14,22,-14,22);g.addWalls(s,-2,26,-2,34);g.dig(s,6,24,14,24);g.dig(s,10,24,14,24);g.place(s,'canon',-14,22,'feu');});
  await p.waitForTimeout(1500);await look('60-murs',-4,34,-9,22,.05);await look('61-fosse',10,31,10,24,-.45);await look('62-murs-haut',2,40,-2,24,-.5,12);}
 if(scenes.includes('hands')){await view('50-pistolet',4,12,0,0);await p.evaluate(()=>__g().setTool('pelle'));await view('51-pelle',4,12,0,0);await p.evaluate(()=>__g().setTool('marteau'));await view('52-marteau',4,12,0,0);await p.evaluate(()=>__g().setTool('pistolet'));await view('53-pistolet-bas',4,12,.8,-.5);}
 console.log('rendu',await p.evaluate(()=>JSON.stringify(__g().renderer.info)),'· modèles en erreur :',await p.evaluate(()=>JSON.stringify(window.__mdlErr||[])),'· shaders :',await p.evaluate(()=>JSON.stringify((window.__shaderErrors||[]).slice(0,3))));
 console.log('erreurs',errs.length);console.log([...new Set(errs)].slice(0,12).join('\n'));await b.close();})();
