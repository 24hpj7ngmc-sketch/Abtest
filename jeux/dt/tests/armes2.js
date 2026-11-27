// V3.9 : fusil à pompe et lance-flammes — en main (hanche, visée sur le réticule), pompe, plombs, jet de flammes, veilleuse, sons, coût d'une image ; captures 966×366
// Le jeu est mis en pause (running = false) et on avance nous-mêmes au pas de 1/30 s : simulation → événements → dessin (comme herofx.js).
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|fonts/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  await p.evaluate(()=>{
    // ce que la boucle du jeu passe à gfxFrame (outil, visée), puis : avancer n pas (dessin ou non), tirer ou non
    window.__V=()=>{const S=__dt.S,W=weapOf(S);return{sprint:false,tool:tool==='fusil'?(W===WEAP.fusil?'fusil':S.weap):tool,scope:false,hammer:false,aim:-1,ptype:'mg',door:-1,ads:ads&&tool==='fusil',zoom:ads&&tool==='fusil'?W.zoom:1,bob:0,bobT:0};};
    window.__adv=(n,draw,fire)=>{const S=__dt.S,r0=renderer.render;if(!draw)renderer.render=()=>{};
      try{for(let k=0;k<n;k++){step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:S.p.pitch,fire:!!fire});events();gfxFrame(S,1/30,__V());}}finally{renderer.render=r0;}};
    window.__aim=(x,y,z)=>{const p=__dt.S.p;for(let k=0;k<4;k++){const e=eyeP(p),dx=x-e[0],dy=y-e[1],dz=z-e[2];p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz));}};
    // écart (en pixels de l'écran) entre le réticule (centre) et un point de l'arme en main donné dans le repère du modèle
    window.__px=(q)=>{const vm=G.vm[G.vmCur];vm.updateMatrix();const v=new THREE.Vector3(q[0],q[1],q[2]).applyMatrix4(vm.matrix),c=camera,t=Math.tan(c.fov*Math.PI/360),W=innerWidth,Hh=innerHeight;
      return{dx:v.x/-v.z/(t*c.aspect)*W/2,dy:-v.y/-v.z/t*Hh/2,z:v.z};};
    window.__cover=()=>{const P=G.P.fire,d=P.d,c=camera,f=innerHeight/2/Math.tan(c.fov*Math.PI/360);camera.updateMatrixWorld(true);const v=new THREE.Vector3();let a=0;
      for(let i=0;i<P.n;i++){const o=i*12,u=d[o+6]/d[o+7],s=d[o+8]+(d[o+9]-d[o+8])*u;v.set(d[o],d[o+1],d[o+2]).applyMatrix4(c.matrixWorldInverse);if(v.z>-.05)continue;const r=s/-v.z*f;a+=Math.PI*r*r;}return a/(innerWidth*innerHeight);};
    window.__hide=()=>{for(const id of['big','wave','toast'])if(document.getElementById(id))document.getElementById(id).style.display='none';};
    const s=__dt.save;s.runs=5;s.mode='out';s.weap='pompe';s.hero='feu';s.layout={};__dt.newGame(2);running=false;const S=__dt.S;S.god=true;__dt.startDay(S);__hide();
    for(let i=0;i<30*14;i++){step(S,1/30,{f:0,r:0,yaw:0,pitch:0});if(S.ev.length>4000)S.ev.length=0;}S.ev.length=0;
    // compteur des événements (par sorte ; les tics du lance-flammes à part, et ceux qui touchent)
    window.__cnt={};const o=S.ev.push.bind(S.ev);S.ev.push=e=>{const c=__cnt;c[e.k]=(c[e.k]||0)+1;if(e.flame){c.flame=(c.flame||0)+1;if(e.hit)c.flamehit=(c.flamehit||0)+1;}return o(e);};});
  const shot=async n=>{await p.evaluate(()=>{__hide();try{uiTick(1/30);}catch(_){}});await p.screenshot({path:'shots/'+n+'.png'});};
  const roof=()=>p.evaluate(()=>{Object.assign(__dt.S.p,{x:1.5,y:H,z:-B+2.6,yaw:.1,pitch:-.33,vx:0,vy:0,vz:0});ads=false;});

  // ---------------- fusil à pompe
  await roof();await p.evaluate(()=>__adv(14,true));
  let st=await p.evaluate(()=>({w:__dt.S.weap,cur:G.vmCur,vis:G.vm.pompe.visible,node:!!G.vm.pompe.userData.nodes.pompe,tris:G.vm.pompe.userData.prep.tris,h:G.vmPos.pompe,a:G.aimP.pompe,t:G.tip.pompe}));
  T('pompe en main (modèle, pièce « pompe »)',st.w==='pompe'&&st.cur==='pompe'&&st.vis&&st.node,JSON.stringify(st));
  T('pompe : budget 2 000 – 2 600 triangles',st.tris>=2000&&st.tris<=2600,st.tris+' triangles');
  await shot('111-pompe');
  // l'éclair est au bout du canon
  let fl=await p.evaluate(()=>{const f=G.vmFlash,t=G.tip.pompe;return{par:f.parent===G.vm.pompe,d:Math.hypot(f.position.x-t[0],f.position.y-t[1],f.position.z-t[2])};});
  T('pompe : l\'éclair de bouche est au bout du canon',fl.par&&fl.d<1e-6,JSON.stringify(fl));
  // visée : la ligne de mire (œilleton et guidon, à SY) tombe sur le réticule
  await p.evaluate(()=>{ads=true;__adv(16,true);});
  let ad=await p.evaluate(()=>{const SY=-G.aimP.pompe[1];return{ads:G.ads,near:G.near,rear:__px([0,SY,.018]),front:__px([0,SY,-.618])};});
  T('pompe en visée : œilleton et guidon sur le réticule (< 1,5 px)',ad.ads>.99&&Math.abs(ad.rear.dx)<1.5&&Math.abs(ad.rear.dy)<1.5&&Math.abs(ad.front.dx)<1.5&&Math.abs(ad.front.dy)<1.5,
    'œilleton '+ad.rear.dx.toFixed(2)+' / '+ad.rear.dy.toFixed(2)+' px, guidon '+ad.front.dx.toFixed(2)+' / '+ad.front.dy.toFixed(2)+' px (G.ads '+ad.ads.toFixed(3)+')');
  // le point orange du guidon, vu au centre de l'image (lecture des pixels juste après le dessin)
  let pix=await p.evaluate(()=>{__adv(1,true);const gl=renderer.getContext?renderer.getContext():renderer.gl,W=gl.drawingBufferWidth,Hh=gl.drawingBufferHeight,R=24,a=new Uint8Array((2*R+1)*(2*R+1)*4);
    gl.readPixels(Math.round(W/2)-R,Math.round(Hh/2)-R,2*R+1,2*R+1,gl.RGBA,gl.UNSIGNED_BYTE,a);let n=0,sx=0,sy=0;
    for(let j=0;j<=2*R;j++)for(let i=0;i<=2*R;i++){const o=(j*(2*R+1)+i)*4;if(a[o]>150&&a[o]>a[o+1]*1.4&&a[o+1]>40&&a[o+2]<100){n++;sx+=i-R;sy+=j-R;}}return{n,x:n?sx/n:0,y:n?-sy/n:0,W,Hh};});
  T('pompe en visée : le point orange du guidon est au centre de l\'image',pix.n>0&&Math.abs(pix.x)<3&&Math.abs(pix.y)<3,JSON.stringify(pix));
  await shot('112-pompe-visee');
  // un coup : éclair agrandi, plombs (traçantes fines), puis la pompe recule et revient
  await p.evaluate(()=>{ads=false;__adv(10,false);Object.assign(__dt.S.p,{pitch:-.5});});
  const c1=await p.evaluate(()=>{G.tr.length=0;__cnt={};__adv(1,true,true);return{ev:{shot:__cnt.shot,pellet:__cnt.pellet},tr:G.tr.filter(t=>t.w).length,fl:G.vmFlash.visible,sc:G.vmFlash.scale.x,col:G.vmFlash.material.color.getHex().toString(16)};});
  await shot('112b-pompe-tir');
  T('pompe : un tir, ses plombs (traçantes fines), gros éclair',c1.ev.shot===1&&c1.ev.pellet>=3&&c1.tr>=3&&c1.fl&&c1.sc>1.5,JSON.stringify(c1));
  const pm=await p.evaluate(()=>{const nd=G.vm.pompe.userData.nodes.pompe,z=[];for(let k=0;k<18;k++){__adv(1,k===8,false);z.push(+nd.position.z.toFixed(3));}return z;});
  await shot('112c-pompe-pompe');
  const zmax=Math.max(...pm);T('pompe : le garde-main recule (~8,5 cm) puis revient',zmax>.07&&pm[pm.length-1]===0&&pm[2]===0,pm.join(' '));

  // ---------------- lance-flammes
  await p.evaluate(()=>{setWeap('lance');__dt.S.p.fireT=0;__adv(14,true);});await roof();await p.evaluate(()=>__adv(2,true));
  st=await p.evaluate(()=>({w:__dt.S.weap,cur:G.vmCur,vis:G.vm.lance.visible,node:!!G.vm.lance.userData.nodes.veil,tris:G.vm.lance.userData.prep.tris,h:G.vmPos.lance,a:G.aimP.lance,t:G.tip.lance}));
  T('lance-flammes en main (modèle, veilleuse)',st.w==='lance'&&st.cur==='lance'&&st.vis&&st.node,JSON.stringify(st));
  T('lance-flammes : budget 2 000 – 2 600 triangles',st.tris>=2000&&st.tris<=2600,st.tris+' triangles');
  const vf=await p.evaluate(()=>{const nd=G.vm.lance.userData.nodes.veil,s=[];for(let k=0;k<6;k++){__adv(1,false);s.push(+nd.scale.x.toFixed(3));}return s;});
  T('la veilleuse vacille (sans tirer)',new Set(vf).size>3&&Math.min(...vf)>.6&&Math.max(...vf)<1.3,vf.join(' '));
  await p.evaluate(()=>__adv(1,true));await shot('113-lance');
  fl=await p.evaluate(()=>{const f=G.vmFlash,t=G.tip.lance;return{par:f.parent===G.vm.lance,d:Math.hypot(f.position.x-t[0],f.position.y-t[1],f.position.z-t[2])};});
  T('lance-flammes : la lueur est au bout de la buse',fl.par&&fl.d<1e-6,JSON.stringify(fl));
  await p.evaluate(()=>{ads=true;__adv(16,true);});
  ad=await p.evaluate(()=>{const SY=-G.aimP.lance[1];return{ads:G.ads,rear:__px([0,SY,.02]),front:__px([0,SY,-.565])};});
  T('lance-flammes en visée : cran et guidon sur le réticule (< 1,5 px)',ad.ads>.99&&Math.abs(ad.rear.dx)<1.5&&Math.abs(ad.rear.dy)<1.5&&Math.abs(ad.front.dx)<1.5&&Math.abs(ad.front.dy)<1.5,
    'cran '+ad.rear.dx.toFixed(2)+' / '+ad.rear.dy.toFixed(2)+' px, guidon '+ad.front.dx.toFixed(2)+' / '+ad.front.dy.toFixed(2)+' px');
  await shot('113b-lance-visee');
  // le jet vers la rue : au pied de l'immeuble (avenue nord), face à des zombies à ~6 m
  const fire=await p.evaluate(()=>{ads=false;const S=__dt.S,Z=S.z;let best=-1,bd=1e9;for(let q=0;q<S.nAct;q++){const i=S.act[q];if(Z.st[i]!==1||Z.y[i]>.5)continue;const d=Math.hypot(Z.x[i],Z.z[i]+B+9);if(d<bd){bd=d;best=i;}}
    const zx=best>=0?Z.x[best]:0,zz=best>=0?Z.z[best]:-B-12;Object.assign(S.p,{x:zx+1.2,y:0,z:zz+6.5,vx:0,vy:0,vz:0});__aim(zx,1,zz);S.p.pitch-=.05;__adv(3,false);
    __cnt={};G.tr.length=0;
    __adv(18,false,true);__adv(1,true,true);let burn=0;for(let q=0;q<S.nAct;q++)if(Z.burn[S.act[q]]>0)burn++;
    return{ev:{shot:__cnt.shot,flame:__cnt.flame,touche:__cnt.flamehit||0,tues:__cnt.pkill||0},tr:G.tr.length,couv:+__cover().toFixed(2),fire:G.P.fire.n,spark:G.P.spark.n,smoke:G.P.smoke.n,flame:G.fl.t>0,L:+G.fl.L.toFixed(2),glow:G.vmFlash.visible,col:G.vmFlash.material.color.getHex().toString(16),burn,zd:+bd.toFixed(1)};});
  await shot('114-lance-tir');
  T('lance-flammes : ~12 tics par seconde, pas de traçante',fire.ev.flame>=7&&fire.ev.flame<=9&&fire.ev.shot===fire.ev.flame&&fire.tr===0,JSON.stringify(fire.ev)+' en 0,63 s · traçantes '+fire.tr);
  T('lance-flammes : jet de flammes, cœur, lueur orange à la buse, zombies en feu',fire.flame&&fire.fire>=15&&fire.glow&&fire.col==='ff7a26'&&fire.ev.touche>0,JSON.stringify(fire));
  // le jet vu du toit, vers la rue (il s'arrête à 10 m, dans le vide)
  await roof();await p.evaluate(()=>{const S=__dt.S;Object.assign(S.p,{z:-B+.8,pitch:-.62});__adv(12,false,true);__adv(1,true,true);window.__c118=__cover();});await shot('114b-lance-toit');
  console.log('   (du toit, penché sur la rue : jet de '+(await p.evaluate(()=>G.fl.L.toFixed(1)))+' m, flammes sur '+(await p.evaluate(()=>(__c118*100).toFixed(0)))+' % de l\'écran)');
  // on lâche : le jet s'éteint, la lueur aussi, la veilleuse reprend
  const off=await p.evaluate(()=>{__adv(12,false,false);return{t:G.fl.t,glow:G.vmFlash.visible};});
  T('Tir relâché : le jet et la lueur s\'éteignent',off.t<=0&&!off.glow,JSON.stringify(off));
  // retour à une arme classique : éclair normal (taille et couleur)
  const back=await p.evaluate(()=>{setWeap('fusil');__dt.S.p.fireT=0;__adv(12,false);__adv(1,false,true);return{cur:G.vmCur,sc:G.vmFlash.scale.x,col:G.vmFlash.material.color.getHex().toString(16)};});
  T('fusil après : éclair normal',back.cur==='fusil'&&back.sc===1&&back.col==='ffd070',JSON.stringify(back));

  // ---------------- coût d'une image : jour 6 (horde dehors), lance-flammes en main, sans tirer puis en tirant sans arrêt ; puis la même chose sans les effets V3.9 (« avant »)
  const bench=await p.evaluate(()=>{const s=__dt.save;s.weap='lance';__dt.newGame(6);running=false;const S=__dt.S;S.god=true;__dt.startDay(S);__hide();
    for(let i=0;i<30*70;i++){step(S,1/30,{f:0,r:0,yaw:0,pitch:0});if(S.ev.length>4000)S.ev.length=0;}S.ev.length=0;const Z=S.z;
    for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.hp[i]=Z.hm[i]=1e9;Z.sp[i]=0;}   // la horde ne fond pas et ne s'en va pas pendant la mesure
    Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.62});__adv(12,false);
    let tg=0,tp=0;const gf=window.gunFx,ft=window.flameTic,ps=window.partStep;window.partStep=dt=>{const t=performance.now();ps(dt);tp+=performance.now()-t;};
    const fxOn=on=>{window.gunFx=on?(a,b,c)=>{const t=performance.now();gf(a,b,c);tg+=performance.now()-t;}:()=>{};window.flameTic=on?ft:()=>{};};
    const run=(n,fire)=>{tg=0;tp=0;const t0=performance.now();let mx=0;for(let k=0;k<n;k++){__adv(1,false,fire);mx=Math.max(mx,G.P.fire.n);}return{ms:(performance.now()-t0)/n,gun:tg/n,part:tp/n,fireMax:mx};};
    const nz=()=>{let o=0;for(let q=0;q<S.nAct;q++)if(Z.st[S.act[q]]===1)o++;return o;};
    const gl=renderer.getContext?renderer.getContext():renderer.gl,px=new Uint8Array(4),rr=(n,fire)=>{const t0=performance.now();for(let k=0;k<n;k++){__adv(1,true,fire);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}return(performance.now()-t0)/n;};
    const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1],C={a:[],b:[],c:[],r1:[],r2:[],r3:[]},K={};
    fxOn(true);run(60,true);rr(3,true);   // mise en route
    for(let rep=0;rep<3;rep++){fxOn(true);const a=run(150,false);C.a.push(a.ms);const bb=run(150,true);C.b.push(bb.ms);K.b=bb;fxOn(false);const c=run(150,true);C.c.push(c.ms);K.c=c;
      fxOn(true);C.r1.push(rr(8,false));C.r2.push(rr(8,true));fxOn(false);C.r3.push(rr(8,true));}
    fxOn(true);window.partStep=ps;const zn=nz();
    return{a:{ms:med(C.a)},b:{ms:med(C.b),gun:K.b.gun,part:K.b.part,fireMax:K.b.fireMax},c:{ms:med(C.c),part:K.c.part,fireMax:K.c.fireMax},r1:med(C.r1),r2:med(C.r2),r3:med(C.r3),zn,act:S.nAct};});
  console.log('banc (sans dessin GPU, médiane de 3 × 150 images), '+bench.zn+' zombies dehors ('+bench.act+' actifs) :');
  console.log('   lance-flammes en main, sans tirer : '+bench.a.ms.toFixed(2)+' ms/image');
  console.log('   en tirant sans arrêt            : '+bench.b.ms.toFixed(2)+' ms/image (dont gunFx '+bench.b.gun.toFixed(3)+', particules '+bench.b.part.toFixed(3)+' ; flammes à la fois au plus '+bench.b.fireMax+')');
  console.log('   en tirant, sans les effets V3.9 : '+bench.c.ms.toFixed(2)+' ms/image (particules '+bench.c.part.toFixed(3)+' ; flammes au plus '+bench.c.fireMax+')');
  console.log('   avec le rendu SwiftShader (médiane de 3 × 8 images) : sans tirer '+bench.r1.toFixed(1)+' · en tirant '+bench.r2.toFixed(1)+' · en tirant sans les effets '+bench.r3.toFixed(1)+' ms/image');
  T('banc : le jet coûte peu en JS (< 0,3 ms/image) et reste plafonné',bench.b.gun<.3&&bench.b.fireMax<700-120,bench.b.gun.toFixed(3)+' ms/image');

  // ---------------- sons (rendus hors ligne, comme herofx.js) : audibles, sans saturer, même avec les 12 tics du lance-flammes empilés sur d'autres tirs
  const snd=await p.evaluate(async src=>{const code=src.replace(/ac\.state\s*===\s*['"]running['"]\s*&&/,"").replace(/try\s*\{\s*(\w+)\[n\]\(a\);?\s*\}\s*catch\s*\(_\)\s*\{\s*\}/g,"try{$1[n](a);}catch(e){errs.push(n+' : '+e.message);}")+'\nreturn SND;';
    const errs=[],out={},A0=window.AudioContext;
    // tics : instants (s) où l'on rappelle g (rendu suspendu à ces instants) ; a0, a1 : fenêtre où l'on mesure le niveau tenu (rms2)
    async function render(f,dur,tics,g,a0,a1){let off=null;window.AudioContext=function(){off=new OfflineAudioContext(2,Math.round(44100*(dur||1.2)),44100);return off;};
      const SND=new Function('save','camera','errs',code)({snd:true},{position:{x:0,y:1.6,z:0},rotation:{y:0}},errs);SND.resume();f(SND);
      for(const t of tics||[])off.suspend(t).then(()=>{g(SND);off.resume();});
      const buf=await off.startRendering();let s=0,pk=0,n=0,s2=0,n2=0;for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<buf.length;i++){s+=d[i]*d[i];pk=Math.max(pk,Math.abs(d[i]));n++;if(a1&&i>=a0*44100&&i<a1*44100){s2+=d[i]*d[i];n2++;}}}
      return{rms:Math.sqrt(s/n),pk,rms2:n2?Math.sqrt(s2/n2):0};}
    const T12=[];for(let k=1;k<12;k++)T12.push(Math.round(k/12*44100/128)*128/44100);const L=S=>S.play('shot','lance');
    out.fond=await render(()=>{});out.fusil=await render(S=>S.play('shot','fusil'),1.2,null,null,0,.1);out.pompe=await render(S=>S.play('shot','pompe'));
    out.lance=await render(L,1.6,T12,L,.3,.9);
    out.tout=await render(S=>{L(S);S.play('shot','pompe');S.play('shot','sniper');S.play('shot','fusil');},1.6,T12,S=>{L(S);if(Math.random()<.3)S.play('shot','pompe');},.3,.9);
    window.AudioContext=A0;return{out,errs};},require('fs').readFileSync(__dirname+'/../sons/sound.js','utf8'));
  const so=snd.out;console.log('sons : '+Object.keys(so).map(k=>k+' rms '+so[k].rms.toFixed(4)+' crête '+so[k].pk.toFixed(3)+(so[k].rms2?' (tenu '+so[k].rms2.toFixed(4)+')':'')).join(' · '));
  T('sons pompe et lance-flammes audibles, sans saturation',so.pompe.rms>so.fond.rms*1.25&&so.lance.rms>so.fond.rms*1.25&&so.pompe.pk<1.01&&so.lance.pk<1.01&&so.tout.pk<1.01,'crêtes '+so.pompe.pk.toFixed(3)+' / '+so.lance.pk.toFixed(3)+' / tout '+so.tout.pk.toFixed(3));
  T('lance-flammes (12 tics/s pendant 1 s) plus doux qu\'un coup de fusil',so.lance.pk<so.fusil.pk&&so.lance.rms2<so.fusil.rms2,'crête '+so.lance.pk.toFixed(3)+' < '+so.fusil.pk.toFixed(3)+', niveau tenu '+so.lance.rms2.toFixed(4)+' < '+so.fusil.rms2.toFixed(4));
  T('aucune erreur dans les sons',!snd.errs.length,snd.errs.join(' | '));
  console.log(errs.length?errs.join('\n'):'erreurs 0');T('pas d\'erreur de page',errs.length===0);console.log(ok+' OK, '+ko+' ratés');await b.close();})();
