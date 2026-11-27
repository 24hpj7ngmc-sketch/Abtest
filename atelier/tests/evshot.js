// captures des évolutions de l'île.  usage : node tests/evshot.js [prefixe] [évolutions=1..6] [défis=100] [vues=a,b,c,d]
const {chromium}=require('playwright');const path=require('path');
const pre=process.argv[2]||'shots3d/evo-',ths=(process.argv[3]||'1,2,3,4,5,6').split(',').map(Number),qd=+(process.argv[4]||100),vs=(process.argv[5]||'a,b,c,d').split(',');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,400));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(2500);
 await p.evaluate(qd=>{const g=__g();g.save.qd=qd;g.save.dev=true;g.lobSync();},qd);await p.waitForTimeout(800);
 const view=async(name,x,z,tx,tz,pitch,y)=>{await p.evaluate(([x,z,yaw,pitch,y])=>{const g=__g(),L=g.LB;L.x=x;L.z=z;L.yaw=yaw;L.pitch=pitch;window.__hold&&clearInterval(window.__hold);window.__hold=setInterval(()=>{const g=__g(),L=g.LB;L.y=g.hAt(L.x,L.z)+(y||0);L.vy=0;},8);
     let s=document.getElementById('__h');if(!s){s=document.createElement('style');s.id='__h';document.head.appendChild(s);}s.textContent='#hud,#toast,#lobH{display:none!important}';},[x,z,Math.atan2(x-tx,z-tz),pitch||0,y]);await p.waitForTimeout(1400);await p.screenshot({path:pre+name+'.png'});};
 for(const th of ths){await p.evaluate(th=>{const g=__g();for(const B of g.save.vil)if(g.CAT[B.t].up)B.l=Math.max(B.l||1,th);g.lobSync();},th);await p.waitForTimeout(1500);
  const I=await p.evaluate(()=>{const g=__g(),P=g.PAY;let mn=1e9,mx=-1e9;for(let x=-230;x<=230;x+=6)for(let z=-230;z<=230;z+=6)if(Math.hypot(x,z)<g.getRI()-6){const h=g.hAt(x,z);mn=Math.min(mn,h);mx=Math.max(mx,h);}
    return{env:g.LB.env,RI:g.getRI(),H:g.getMH(),min:+mn.toFixed(1),max:+mx.toFixed(1),th:P.th,riv:P.riv.length,vis:P.sc.reduce((a,S)=>a+S.n,0),val:P.val.length,cave:!!P.cave,flots:P.flots.length,pnj:P.pnj.length,roads:g.ROADS.edges.length,err:P.err||0,calls:g.renderer.info.render.calls,tris:Math.round(g.renderer.info.render.triangles)};});console.log('évolution',th,JSON.stringify(I));const R=I.RI;
  if(vs.includes('a'))await view(th+'a-arrivee',0,-36,0,0,.12,0);
  if(vs.includes('b'))await view(th+'b-ciel-nord',0,-(R+70),0,10,-.42,95);
  if(vs.includes('c'))await view(th+'c-ciel-est',R*.9,-R*.55,0,20,-.5,120);
  if(vs.includes('d'))await view(th+'d-balade',40,-52,10,40,.1,0);
  if(vs.includes('e'))await view(th+'e-sud',-22,66,10,R,.16,3);
  if(vs.includes('f'))await view(th+'f-place',-16,-22,6,6,.14,0);}
 console.log('modèles en erreur :',await p.evaluate(()=>JSON.stringify(window.__mdlErr||[])),'· shaders :',await p.evaluate(()=>JSON.stringify((window.__shaderErrors||[]).slice(0,3))));console.log('erreurs',errs.length);console.log([...new Set(errs)].slice(0,12).join('\n'));await b.close();})();
