// captures des armes (V2.0) à la taille de la page itch.io dans Safari (840 × 333) : le choix au début, le marchand d'armes, un tir amélioré.   usage : node tests/shotarmes.js [préfixe=shots/armes-]   (≈ 40 s)
const {chromium}=require('playwright');const path=require('path');const pre=process.argv[2]||'shots/armes-';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:840,height:333},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 await p.addInitScript(()=>{window.__keep=true;window.__armesAuto=false;window.ILE_LOBBY={heros:'eau',arme:'assaut',mode:'normal'};});
 await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(3000);
 await p.screenshot({path:pre+'choix.png'});
 await p.evaluate(()=>document.getElementById('arsGo').click());await p.waitForTimeout(300);
 await p.evaluate(()=>{const g=__g(),s=g.sim,h=s.hero;s.gold=640;h.x=g.ARMP[0]+2.5;h.z=g.ARMP[1]+1;h.yaw=Math.atan2(h.x-g.ARMP[0],h.z-g.ARMP[1]);g.armBuy('multi');g.armBuy('expl');g.armBuy('deg');g.openArmes();});await p.waitForTimeout(700);
 await p.screenshot({path:pre+'marchand.png'});
 await p.evaluate(()=>{const g=__g(),s=g.sim,h=s.hero;document.getElementById('armX').click();s.gold=2000;g.armBuy('multi');g.armBuy('expl');g.armBuy('chain');g.armBuy('chain');s.heroGod=true;g.startWave(s);});
 await p.evaluate(()=>{const g=__g(),s=g.sim,h=s.hero,I={f:0,r:0};let n=0;while(s.enemies.length<8&&s.queue.length&&n++<4000)g.step(s,.05,I);s.queue.length=0;h.x=0;h.z=30;h.y=0;h.yaw=0;h.pitch=-0.07;let k=0;for(const e of s.enemies){e.sea=null;e.k='b';e.x=-5+(k%4)*3.2;e.z=14-Math.floor(k/4)*3;e.stun=60;e.hp=e.max=4000;k++;}g.inp.fire=true;});
 for(let i=0;i<3;i++){await p.waitForTimeout(300+i*90);await p.screenshot({path:pre+'tir'+(i||'')+'.png'});}
 await p.evaluate(()=>{__g().inp.fire=false;});
 console.log('erreurs',errs.length,errs.slice(0,3).join(' | '));await b.close();})();
