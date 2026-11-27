// V3.9 : les variantes de zombies se reconnaissent au premier coup d'œil (sprinteur, casseur, porteur, hurleur) — modèles et effets.
// Captures 966×366 : les 4 variantes de près à côté d'un rôdeur (115), depuis le toit au milieu de la foule (116), le cri du hurleur (117),
// la mort d'un porteur (118). Vérifie les réserves (tenues e-h, canal lumineux), le cri, la hâte, les billets, le son ; puis un banc au jour 6.
// BANC_SEUL=1 : seulement le banc.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|fonts/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(900);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  // outils dans la page : avancer n pas (simulation, évènements, dessin), préparer une partie en pause, poser un zombie où l'on veut
  await p.evaluate(()=>{
    const V={sprint:false,tool:'fusil',scope:false,hammer:false,aim:-1,ptype:'mg',door:-1,ads:false,zoom:1,bob:0,bobT:0};
    window.__V=V;
    window.__adv=(n,draw,sim)=>{const S=__dt.S,r0=renderer.render;if(!draw)renderer.render=()=>{};
      try{for(let k=0;k<n;k++){if(sim!==false)step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:S.p.pitch});events();gfxFrame(S,1/30,V);}}finally{renderer.render=r0;}};
    window.__setup=(day,sec,seed)=>{const s=__dt.save;s.runs=5;s.runsOut=5;s.mode='out';s.hero='feu';s.weap='fusil';s.layout={};__dt.newGame(day);running=false;const S=__dt.S;S.rnd=mkRng(seed||777);S.god=true;__dt.startDay(S);
      document.getElementById('big').style.display='none';
      for(let i=0;i<30*sec;i++){step(S,1/30,{f:0,r:0,yaw:0,pitch:0});if(S.ev.length>4000)S.ev.length=0;}S.ev.length=0;if(!sec)S.toSpawn=0;   // sec = 0 : personne d'autre ne sort
      Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.4,vx:0,vz:0,vy:0});return S.nAct;};
    // un zombie de type ty, dehors, qui marche vers le bout de l'avenue nord (r = 0) ; yaw donné ou vers le nord
    window.__put=(ty,x,z,yaw)=>{const S=__dt.S,Z=S.z;S.devTy=ty;S.toSpawn++;if(!spawnOne(S)){delete S.devTy;return -1;}delete S.devTy;const i=S.act[S.nAct-1];
      Z.x[i]=x;Z.z[i]=z;Z.y[i]=0;Z.st[i]=1;Z.inv[i]=0;Z.road[i]=0;Z.off[i]=x;Z.wp[i]=0;Z.yaw[i]=yaw===undefined?Math.PI:yaw;Z.hp[i]=Z.hm[i]=1e9;return i;};
    window.__draws=()=>{let n=0;const walk=(o,v)=>{v=v&&o.visible;if(!v)return;if(o.isMesh&&!(o.isInstancedMesh&&o.count===0))n++;for(const c of o.children)walk(c,v);};walk(scene,true);return n;};});
  // hud = false : sans l'interface (pour juger les modèles de près)
  const shot=async(n,hud)=>{await p.evaluate(h=>{for(const id of['wave','toast','big'])try{document.getElementById(id).style.display='none';}catch(_){}document.getElementById('hud').style.visibility=h===false?'hidden':'';},hud);await p.screenshot({path:'shots/'+n+'.png'});};
  // ---------------------------------------------------------------- banc : jour 6, beaucoup de zombies dehors (dont ~9 % de variantes), « avant » / « après » dans la même page
  // avant = les variantes dessinées en colosses (ZTY), sans leurs effets (zvFrame, zvEvent neutralisés) ; après = tout. Mesures alternées (A B A B) : la machine
  // est partagée avec d'autres essais, seuls les écarts entre A et B comptent.
  const banc=async()=>{const r=await p.evaluate(()=>{window.__cam=null;__setup(6,60,4242);const S=__dt.S,Z=S.z;
    for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.hp[i]=Z.hm[i]=1e9;}   // la horde ne fond pas pendant la mesure (réglage de test seulement)
    const cnt=()=>{const o={tot:0,v:0,hst:0};for(let q=0;q<S.nAct;q++){const i=S.act[q];if(!Z.st[i])continue;o.tot++;if(Z.ty[i]>=4)o.v++;if(Z.hst[i]>0)o.hst++;}return o;};
    let tG=0,tZ=0;const gf=window.gfxFrame,zf=window.zvFrame,ze=window.zvEvent,on=typeof ZTY!=='undefined';
    window.gfxFrame=(a,b,c)=>{const t=performance.now();gf(a,b,c);tG+=performance.now()-t;};const zw=(a,b)=>{const t=performance.now();zf(a,b);tZ+=performance.now()-t;};
    const mode=v=>{if(!on)return;for(let t=4;t<8;t++)ZTY[t]=v?'abcdefgh'[t]:'d';window.zvFrame=v?zw:()=>{};window.zvEvent=v?ze:()=>{};
      if(!v){for(const k of['eye','trail','glint']){ZV[k].begin();ZV[k].end();}for(const w of ZV.rings){w.t=9;w.m.visible=w.w.visible=false;}}};
    const run=n=>{tG=0;tZ=0;const t0=performance.now();__adv(n,false);return{ms:(performance.now()-t0)/n,gfx:tG/n,zv:tZ/n};};
    const gl=renderer.getContext?renderer.getContext():renderer.gl,px=new Uint8Array(4),rr=n=>{const t0=performance.now();for(let k=0;k<n;k++){__adv(1,true);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}return(performance.now()-t0)/n;};
    const A={ms:0,gfx:0,zv:0,r:0,d:0},Bm={ms:0,gfx:0,zv:0,r:0,d:0},add=(o,q)=>{o.ms+=q.ms/3;o.gfx+=q.gfx/3;o.zv+=q.zv/3;};
    mode(1);run(30);rr(2);
    for(let k=0;k<3;k++){mode(0);add(A,run(120));A.r+=rr(6)/3;A.d=__draws();mode(1);add(Bm,run(120));Bm.r+=rr(6)/3;Bm.d=__draws();}
    window.gfxFrame=gf;mode(1);window.zvFrame=zf;return{A,B:Bm,c0:cnt(),act:S.nAct};});
    const f=q=>q.ms.toFixed(2)+' ms/image dont affichage '+q.gfx.toFixed(2)+' ms'+(q.zv?' (effets des variantes '+q.zv.toFixed(3)+' ms)':'')+' · rendu SwiftShader '+q.r.toFixed(0)+' ms · objets dessinés '+q.d;
    console.log('banc jour 6 · zombies '+r.c0.tot+' dont variantes '+r.c0.v+', pressés '+r.c0.hst+' (3 × 120 images JS + 3 × 6 images rendues, alternées)');
    console.log('   avant (variantes en colosses, sans effets) : '+f(r.A));console.log('   après (tenues e-h, effets)                 : '+f(r.B));return r;};
  if(process.env.BANC_SEUL){await banc();console.log(errs.length?errs.join('\n'):'erreurs 0');await b.close();return;}
  // ---------------------------------------------------------------- réserves : 8 tenues × 6 poses, canal lumineux pour e, f, g
  const pools=await p.evaluate(()=>{const o={n:0,g:'',cap:{}};for(const k in G.z){o.n++;if(G.z[k].g)o.g+=k[0];}o.g=[...new Set(o.g)].join('');for(const k of'adefgh')o.cap[k]=G.z[k+'w1'].cap+'/'+G.z[k+'lie'].cap;
    o.set=[0,1,2,3,4,5,6,7].map(t=>zSet(t,0)).join('')+zSet(0,1);return o;});
  T('48 réserves (8 tenues × 6 poses)',pools.n===48,pools.n);T('pièces lumineuses (canal g) : le porteur seulement',pools.g==='g',pools.g);
  T('type → tenue : 0 a, 1 c, 2 d, 3 d, 4 e, 5 f, 6 g, 7 h (rôdeur bis b)',pools.set==='acddefghb',pools.set);console.log('   capacités (vivants/corps) : '+JSON.stringify(pools.cap));
  // ---------------------------------------------------------------- 115 : de près, un rôdeur puis les 4 variantes côte à côte
  const pres=await p.evaluate(()=>{__setup(4,0,11);const S=__dt.S,Z=S.z,L=[[0,'rôdeur'],[4,'sprinteur'],[5,'casseur'],[6,'porteur'],[7,'hurleur']],ids=[];
    L.forEach((q,k)=>{const i=__put(q[0],3.6-k*1.8,-20,2.05);Z.va[i]=0;Z.ph[i]=.2;ids.push(i);});
    window.__cam={x:-.2,y:1.45,z:-24.4,yaw:Math.PI,pitch:-.05};__adv(1,true,false);const o={};for(const k of'aefgh')o[k]=G.z[k+'w0'].n;return o;});
  await shot('115-variantes-pres',false);T('de près : chaque tenue dessinée (a, e, f, g, h)',Object.values(pres).every(n=>n===1),JSON.stringify(pres));
  // même chose, de dos (le sac du porteur, le gilet, les bandes)
  await p.evaluate(()=>{const S=__dt.S,Z=S.z;for(let q=0;q<S.nAct;q++)Z.yaw[S.act[q]]=-.55;__adv(1,true,false);});await shot('115b-variantes-dos',false);
  // ---------------------------------------------------------------- 116 : depuis le toit, au milieu de la foule (deux de chaque, entre 8 et 30 m du pied de l'immeuble)
  const toit=await p.evaluate(()=>{window.__cam=null;const n0=__setup(5,22,5);const S=__dt.S,Z=S.z;
    const P=[[4,-5,-27],[4,6,-36],[5,-2,-31],[5,7,-26],[6,3,-29],[6,-8,-37],[7,-4,-40],[7,2,-24]];for(const q of P)__put(q[0],q[1],q[2]);
    for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.hcd[i]=Math.max(Z.hcd[i],30);}   // pas de cri pendant cette capture
    Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.82});__adv(12,true);let out=0;for(let q=0;q<S.nAct;q++)if(Z.st[S.act[q]]===1)out++;
    const o={zombies:out};for(const k of'efgh')o[k]=['w0','w1','w2','c0','c1'].reduce((s,p)=>s+G.z[k+p].n,0);return o;});
  await shot('116-variantes-toit');T('du toit : les 8 variantes dessinées au milieu de la foule',toit.e>=2&&toit.f>=2&&toit.g>=2&&toit.h>=2,JSON.stringify(toit));
  // ---------------------------------------------------------------- 117 : le cri du hurleur (onde, zombies pressés : yeux rouges, traînées), vu du toit
  const cri=await p.evaluate(()=>{__setup(5,0,9);const S=__dt.S,Z=S.z,R=mkRng(3);const hx=1.5,hz=-30,h=__put(7,hx,hz);
    const near=[];for(let k=0;k<16;k++){const a=R()*6.283,d=2+R()*8;near.push(__put(k%5?0:1,hx+Math.cos(a)*d,hz+Math.sin(a)*d));}
    for(let k=0;k<8;k++){const a=R()*6.283,d=15+R()*6;__put(0,hx+Math.cos(a)*d,hz+Math.sin(a)*d*.6);}
    for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.ph[i]=R()*6;Z.hcd[i]=i===h?.01:30;}
    Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.82});gridBuild(S);let ev=0;step(S,1/30,{f:0,r:0,yaw:0,pitch:-.82});for(const e of S.ev)if(e.k==='hurle')ev++;
    events();gfxFrame(S,1/30,__V);__adv(8,true);
    const hs=near.filter(i=>Z.hst[i]>0).length,rv=ZV.rings.filter(w=>w.m.visible).length,r=ZV.rings.find(w=>w.m.visible);
    return{ev,hs,near:near.length,rings:rv,r:r?r.m.scale.x:0,eye:ZV.eye.n,trail:ZV.trail.n,flash:G.flash.filter(f=>f.m.visible).length};});
  await shot('117-hurleur');
  T('le hurleur crie (événement hurle)',cri.ev===1,cri.ev);T('les zombies à moins de 12 m sont pressés',cri.hs===cri.near,cri.hs+' / '+cri.near);
  T('onde visible qui s\'élargit (r ≈ 6 m après 0,3 s)',cri.rings>=1&&cri.r>3&&cri.r<10,'anneaux '+cri.rings+', rayon '+cri.r.toFixed(1)+' m');
  T('pressés : yeux rouges et traînées',cri.eye>=cri.hs&&cri.trail>0,'yeux '+cri.eye+', traînées '+cri.trail);
  const fin=await p.evaluate(()=>{__adv(30,false);const S=__dt.S,Z=S.z;const a={rings:ZV.rings.filter(w=>w.m.visible).length};__adv(30*4,false);
    let h=0;for(let q=0;q<S.nAct;q++)if(Z.hst[S.act[q]]>0)h++;return Object.assign(a,{hst:h,eye:ZV.eye.n,trail:ZV.trail.n});});
  T('l\'onde est courte (finie après 1 s)',fin.rings===0,JSON.stringify(fin));T('la hâte passe : plus d\'yeux rouges 5 s après',fin.hst===0&&fin.eye===0&&fin.trail===0,JSON.stringify(fin));
  // plafond : 300 zombies pressés d'un coup → yeux et traînées plafonnés
  const cap=await p.evaluate(()=>{const S=__dt.S,Z=S.z;for(let k=0;k<300;k++)__put(0,(k%20)*1.2-12,-20-Math.floor(k/20)*1.2);for(let q=0;q<S.nAct;q++)Z.hst[S.act[q]]=3;__adv(1,false,false);return{eye:ZV.eye.n,trail:ZV.trail.n,max:ZVN};});
  T('yeux et traînées plafonnés',cap.eye<=cap.max.eye&&cap.trail<=cap.max.trail,JSON.stringify(cap));
  // ---------------------------------------------------------------- 118 : le porteur (or qui tombe du sac), puis sa mort : gerbe de billets
  const por=await p.evaluate(()=>{__setup(5,0,13);const S=__dt.S,Z=S.z,i=__put(6,-1,-24);Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.82});
    let mx=0,gl=0;for(let k=0;k<60;k++){__adv(1,false);mx=Math.max(mx,G.P.gold.n);gl=Math.max(gl,ZV.glint.n);}const vivant={or:mx,billets:G.P.bill.n,reflet:gl};
    Z.hp[i]=1;const x=Z.x[i],z=Z.z[i];hurtZ(S,i,5,'p');let pk=0;for(const e of S.ev)if(e.k==='pkill')pk=e.c;__adv(1,false);const b0=G.P.bill.n;__adv(10,true);
    window.__cam={x:x+4.5,y:5,z:z-6.5,yaw:Math.atan2(4.5,-6.5),pitch:-.45};__adv(1,true,false);
    return{vivant,b0,pk,corps:G.z.glie.n};});
  await shot('118-porteur-mort',false);
  T('porteur vivant : reflet d\'or qui scintille, de l\'or tombe de son sac',por.vivant.or>0&&por.vivant.reflet===2,JSON.stringify(por.vivant));T('porteur abattu : gerbe de billets',por.b0>=20,'billets '+por.b0+', butin '+por.pk+' $');T('son corps garde le sac (tenue g à terre)',por.corps===1,por.corps);
  await p.evaluate(()=>{window.__cam=null;});
  // les corps des autres variantes gardent leur tenue
  const corps=await p.evaluate(()=>{__setup(5,0,17);const S=__dt.S;for(const t of[4,5,7]){const i=__put(t,t-6,-22);S.z.hp[i]=1;hurtZ(S,i,5,'t');}__adv(1,false);return{e:G.z.elie.n,f:G.z.flie.n,h:G.z.hlie.n,d:G.z.dlie.n};});
  T('corps : sprinteur, casseur, hurleur dans leur tenue',corps.e===1&&corps.f===1&&corps.h===1&&corps.d===0,JSON.stringify(corps));
  // bouton DEV « Les 4 variantes » : une de chaque, dessinées
  const dev=await p.evaluate(()=>{__setup(5,0,19);for(const t of[4,5,6,7])devSpawn(1,{devTy:t});__adv(2,false);const o={};for(const k of'efgh')o[k]=['w0','w1','w2','c0','c1'].reduce((s,p)=>s+G.z[k+p].n,0);return o;});
  T('devSpawn : les 4 variantes apparaissent dessinées',Object.values(dev).every(n=>n===1),JSON.stringify(dev));
  // le son du cri : branché dans events(), audible, sans saturer (rendu hors ligne, comme herofx.js)
  T('events() joue le cri (branche hurle)',await p.evaluate(()=>/k\s*===\s*['"]hurle['"]\s*\)\s*SND\.at\(\s*['"]hurle['"]/.test(events.toString())));
  const snd=await p.evaluate(async src=>{const code=src.replace(/ac\.state\s*===\s*['"]running['"]\s*&&/,"").replace(/try\s*\{\s*(\w+)\[n\]\(a\);?\s*\}\s*catch\s*\(_\)\s*\{\s*\}/g,"try{$1[n](a);}catch(e){errs.push(n+' : '+e.message);}")+'\nreturn SND;';
    const errs=[],out={},A0=window.AudioContext;
    async function render(f){let off=null;window.AudioContext=function(){off=new OfflineAudioContext(2,44100*1.4,44100);return off;};
      const SND=new Function('save','camera','errs',code)({snd:true},{position:{x:0,y:1.6,z:0},rotation:{y:0}},errs);SND.resume();f(SND);
      const buf=await off.startRendering();let s=0,pk=0,n=0;for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<buf.length;i++){s+=d[i]*d[i];pk=Math.max(pk,Math.abs(d[i]));n++;}}return{rms:Math.sqrt(s/n),pk};}
    out.fond=await render(()=>{});out.pres=await render(S=>S.at('hurle',0,-8,0,1.6));out.loin=await render(S=>S.at('hurle',0,-40,0,1.6));window.AudioContext=A0;return{out,errs};},require('fs').readFileSync(__dirname+'/../sons/sound.js','utf8'));
  const so=snd.out;console.log('   son du cri : fond rms '+so.fond.rms.toFixed(4)+' · à 8 m rms '+so.pres.rms.toFixed(4)+' crête '+so.pres.pk.toFixed(2)+' · à 40 m rms '+so.loin.rms.toFixed(4));
  T('cri audible, plus fort de près, sans saturation',so.pres.rms>so.fond.rms*1.5&&so.pres.rms>so.loin.rms&&so.pres.pk<1.01&&!snd.errs.length,snd.errs.join(' | '));
  // ---------------------------------------------------------------- banc
  await banc();
  console.log(errs.length?errs.join('\n'):'erreurs 0');T('pas d\'erreur de page',errs.length===0);console.log(ok+' OK, '+ko+' ratés');await b.close();})();
