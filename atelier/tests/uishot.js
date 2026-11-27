// captures des commandes universelles du lobby (V8.1, gros bouton en diagonale V8.2), à la taille de l'iPhone 17 dans l'appli (874 × 331), et contrôle des chevauchements.
// usage : node tests/uishot.js [prefixe] [largeur] [hauteur]   ou   node tests/uishot.js iphone   (les mesures relevées sur la capture de Frédéric : 966 × 366, marges du téléphone comprises)
const {chromium}=require('playwright');const path=require('path');
const IPH=process.argv[2]==='iphone',pre=IPH?'shots3d/iph-':process.argv[2]||'shots3d/ui-',W=IPH?966:+process.argv[3]||874,H=IPH?366:+process.argv[4]||331;
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
 const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true,deviceScaleFactor:1.5});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,300));});
 await p.addInitScript(()=>{window.__keep=true;window.__autoPanel=false;});await p.goto('file://'+path.resolve('construit/test3d.html'));if(IPH)await p.addStyleTag({content:'#hud{padding:10px 62px 33px 62px!important}:root{--low:-25px!important;--edge:-62px!important}'});await p.waitForTimeout(2500);
 const G=f=>p.evaluate(f),tap=async s=>{const l=p.locator(s).first();if(!(await l.isVisible())){console.log('  non visible :',s);return;}await l.evaluate(el=>{const r=el.getBoundingClientRect(),q=el.id==='bFire'?[.28,.74]:el.id==='bJump'?[.72,.26]:[.5,.5],o={bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',clientX:r.left+r.width*q[0],clientY:r.top+r.height*q[1]};const top=document.elementFromPoint(o.clientX,o.clientY);if(top!==el&&!el.contains(top))console.error('COUVERT '+(el.id||el.className)+' par '+(top&&(top.id||top.className)));if(['bFree','bAb','bUlt'].includes(el.id)){el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));}el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));el.click();});await p.waitForTimeout(450);};
 // les éléments visibles de l'interface ne doivent ni se chevaucher ni sortir de l'écran
 const IDS=['mini','lTop','joy','lHot','lSub','bFree','bSneak','padMain','aLab','toast'];
 const check=async name=>{const r=await p.evaluate(([IDS,W,H])=>{const R=[];for(const id of IDS){const el=document.getElementById(id);if(!el)continue;const cs=getComputedStyle(el),b=el.getBoundingClientRect();if(el.hidden||cs.display==='none'||cs.visibility==='hidden'||!b.width||!b.height||(id==='toast'&&cs.opacity==='0'))continue;R.push([id,b.left,b.top,b.right,b.bottom]);}
     const out=[];for(const a of R){if(a[1]<-.5||a[2]<-.5||a[3]>W+.5||a[4]>H+.5)out.push(a[0]+' sort de l\'écran');}
     const RND=['bFree','bSneak','bAb','bUlt','joy'],hit=(a,c)=>{if(!(a[1]<c[3]-1&&c[1]<a[3]-1&&a[2]<c[4]-1&&c[2]<a[4]-1))return false;
       const q=a[0]==='padMain'?[a,c]:c[0]==='padMain'?[c,a]:null;if(q&&RND.includes(q[1][0]))return Math.hypot(q[0][3]-(q[1][1]+q[1][3])/2,q[0][4]-(q[1][2]+q[1][4])/2)<q[0][3]-q[0][1]+(q[1][3]-q[1][1])/2-1;   // le bouton du coin est un quart de rond centré sur son coin bas-droit
       if(RND.includes(a[0])&&RND.includes(c[0]))return Math.hypot((a[1]+a[3]-c[1]-c[3])/2,(a[2]+a[4]-c[2]-c[4])/2)<(a[3]-a[1]+c[3]-c[1])/2-1;return true;};   // deux boutons ronds : on compare les cercles, pas les carrés
     for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],c=R[j];if(hit(a,c))out.push(a[0]+' × '+c[0]);}
     document.querySelectorAll('#wheel .wb').forEach((w,k)=>{const el=document.getElementById('wheel');if(el.hidden)return;const b=w.getBoundingClientRect();if(b.top<0||b.right>W)out.push('roulette '+k+' sort de l\'écran');for(const a of R){if(a[0]==='wheelL')continue;if(hit(['joy',b.left,b.top,b.right,b.bottom],a))out.push('roulette '+k+' × '+a[0]);}});
     return out;},[IDS,W,H]);console.log((r.length?'CHEVAUCHEMENT ':'ok  ')+name+(r.length?' : '+r.join(' · '):''));};
 const shot=async name=>{await p.waitForTimeout(700);await check(name);await p.screenshot({path:pre+name+'.png'});};
 const lgo=async(x,z,yaw,pitch)=>{await p.evaluate(([x,z,yaw,pitch])=>{const g=__g(),L=g.LB;L.x=x;L.z=z;L.y=g.hAt(x,z);L.yaw=yaw;L.pitch=pitch||0;},[x,z,yaw,pitch]);await p.waitForTimeout(300);};
 const front=async(t,d)=>{const q=await p.evaluate(([t,d])=>{const B=__g().save.vil.find(B=>B.t===t);return[B.x+Math.sin(B.r)*d,B.z+Math.cos(B.r)*d,B.r+Math.PI];},[t,d]);await lgo(q[0],q[1],q[2],.1);};
 // ---------- lobby ----------
 await p.waitForTimeout(2800);await shot('01-lobby-repos');
 await front('hall',9);await shot('02-lobby-hall');
 await tap('#lHot .slot[data-t=marteau]');await G(()=>{__g().LB.pitch=-.3;});await shot('03-lobby-marteau');
 await tap('#lHot .slot[data-t=pelle]');await shot('04-lobby-pelle');
 await tap('#lHot .slot[data-t=main]');{const q=await p.evaluate(()=>{const B=__g().save.vil.find(B=>B.t==='verger');return[B.x+Math.sin(B.r)*17,B.z+Math.cos(B.r)*17,B.r];});await lgo(q[0],q[1],q[2],.08);await shot('04b-lobby-verger');await lgo(q[0]-Math.sin(q[2])*9,q[1]-Math.cos(q[2])*9,q[2],.12);await p.waitForTimeout(600);await shot('04c-lobby-recolte');}   // le verger vu de face, puis de près (les provisions sont ramassées en passant)
 await tap('#lHot .slot[data-t=main]');await G(()=>{__g().save.dev=true;});await tap('#mini');await p.waitForTimeout(300);await p.screenshot({path:pre+'05-lobby-carte.png'});
 console.log('carte du lobby ouverte',await p.locator('#mapV').isVisible(),'· options',await p.locator('#mapOpt button').count());
 await tap('#mapOpt [data-a=dev]');console.log('outils dev ouverts depuis la carte',await p.locator('#lDevP').isVisible());await p.screenshot({path:pre+'06-lobby-dev.png'});await tap('#lDevP [data-a=x]');
 console.log('erreurs',errs.length);console.log([...new Set(errs)].slice(0,12).join('\n'));await b.close();})();
