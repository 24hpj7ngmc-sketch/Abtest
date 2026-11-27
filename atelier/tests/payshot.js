// captures du paysage par thème.  usage : node tests/payshot.js [prefixe] [thèmes=1,2,3,4,5] [renom en défis=100] [vues=a,b,c,d,e]
const {chromium}=require('playwright');const path=require('path');
const pre=process.argv[2]||'shots3d/pay-',ths=(process.argv[3]||'1').split(',').map(Number),qd=+(process.argv[4]||100),vs=(process.argv[5]||'a,b,c,d,e').split(',');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,400));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 await p.evaluate(qd=>{const g=__g();g.save.qd=qd;g.save.dev=true;for(const B of g.save.vil)if(g.CAT[B.t].up)B.l=5;g.lobSync();},qd);await p.waitForTimeout(800);
 const view=async(name,x,z,tx,tz,pitch,y)=>{await p.evaluate(([x,z,yaw,pitch,y])=>{const g=__g(),L=g.LB;L.x=x;L.z=z;L.yaw=yaw;L.pitch=pitch;window.__hold&&clearInterval(window.__hold);window.__hold=setInterval(()=>{const g=__g(),L=g.LB;L.y=g.hAt(L.x,L.z)+(y||0);L.vy=0;},8);
     let s=document.getElementById('__h');if(!s){s=document.createElement('style');s.id='__h';document.head.appendChild(s);}s.textContent='#hud,#toast,#lobH{display:none!important}';},[x,z,Math.atan2(x-tx,z-tz),pitch||0,y]);await p.waitForTimeout(1300);await p.screenshot({path:pre+name+'.png'});};
 for(const th of ths){await p.evaluate(th=>{const g=__g();g.lobSync();},th);await p.waitForTimeout(900);
  const I=await p.evaluate(()=>{const g=__g(),P=g.PAY;return{RI:g.getRI(),H:g.getMH(),th:P.th,riv:P.riv.length,sc:P.sc.map(S=>S.kn+S.v+':'+S.n).join(' '),cave:P.caveAt,flots:P.flots.length,pnj:P.pnj.length,mon:!!P.mon,err:P.err||0,calls:g.renderer.info.render.calls,tris:Math.round(g.renderer.info.render.triangles)};});console.log('thème',th,JSON.stringify(I));const R=I.RI;
  if(vs.includes('a'))await view(th+'a-arrivee',0,-(R-16),0,10,.1,0);
  if(vs.includes('b'))await view(th+'b-large',-R*.2,-(R+38),0,6,-.2,24);
  if(vs.includes('c'))await view(th+'c-riviere',-R*.72,-R*.42,0,10,.16,2);
  if(vs.includes('d')&&I.cave)await view(th+'d-grotte',I.cave[0]+(I.cave[0])*.9,10+(I.cave[1]-10)*1.75,I.cave[0],I.cave[1],.12,1.2);
  if(vs.includes('e'))await view(th+'e-monument',-R*.45,R*.2,-(R+24)*.86,(R+24)*.51,.22,3);
  if(vs.includes('f'))await view(th+'f-village',6,-14,0,6,.05,0);}
 console.log('modèles en erreur :',await p.evaluate(()=>JSON.stringify(window.__mdlErr||[])),'· shaders :',await p.evaluate(()=>JSON.stringify((window.__shaderErrors||[]).slice(0,3))));console.log('erreurs',errs.length);console.log([...new Set(errs)].slice(0,12).join('\n'));await b.close();})();
