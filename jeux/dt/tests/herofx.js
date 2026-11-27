// V3.0 : effets visuels des héros — chaque compétence et chaque ultime se voit depuis le toit, les réserves se vident ensuite,
// une capture par héros (compétence) et une par ultime, puis un petit banc : 300 images avec les 5 ultimes (et les 5 compétences) actifs.
// Le jeu est mis en pause (running = false) et on avance nous-mêmes : pas de simulation → évènements → dessin, au pas de 1/30 s.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(800);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  // outils dans la page : avancer n pas (dessin ou non), viser un point, trouver la foule, compter ce qui reste affiché
  await p.evaluate(()=>{
    const V={sprint:false,tool:'fusil',scope:false,hammer:false,aim:-1,ptype:'mg',door:-1,ads:false,zoom:1,bob:0,bobT:0};
    window.__adv=(n,draw)=>{const S=__dt.S,r0=renderer.render;if(!draw)renderer.render=()=>{};
      try{for(let k=0;k<n;k++){step(S,1/30,{f:0,r:0,yaw:S.p.yaw,pitch:S.p.pitch});events();gfxFrame(S,1/30,V);}}finally{renderer.render=r0;}};
    window.__aim=(x,y,z)=>{const p=__dt.S.p;for(let k=0;k<4;k++){const e=eyeP(p),dx=x-e[0],dy=y-e[1],dz=z-e[2];p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz));}};
    window.__crowd=(cx,cz)=>{const S=__dt.S,Z=S.z;let best=-1,bd=1e9;for(let q=0;q<S.nAct;q++){const i=S.act[q];if(Z.st[i]!==1||Math.max(Math.abs(Z.x[i]),Math.abs(Z.z[i]))<B+BALD+4)continue;const d=Math.hypot(Z.x[i]-cx,Z.z[i]-cz);if(d<bd){bd=d;best=i;}}
      return best<0?[cx,0,cz]:[Z.x[best],0,Z.z[best]];};
    window.__live=()=>{const o={};for(const k of['tring','fbC','fbG','fbT','glow','metR','metG','metT','mark','bush','bushD','treeM','treeG','arw','arwT','wallA','wallB','spk','cloud','sring','boltY','boltW','dash','sco','wet','rain','pud'])if(HX[k].n)o[k]=HX[k].n;
      for(const k of['water','leaf','mist','rock'])if(G.P[k].n)o['p.'+k]=G.P[k].n;HX.rings.forEach((r,i)=>{if(r.m.visible)o['ring'+i]=1;});HX.waves.forEach((w,i)=>{if(w.c.visible)o['wave'+i]=1;});if(HX.vig.visible)o.voile=1;return o;};
    // objets dessinés (≈ appels de dessin) : maillages visibles dont tous les parents sont visibles
    window.__draws=()=>{let n=0;const walk=(o,v)=>{v=v&&o.visible;if(!v)return;if(o.isMesh&&!(o.isInstancedMesh&&o.count===0))n++;for(const c of o.children)walk(c,v);};walk(scene,true);return n;};
    window.__setup=(h,day,sec)=>{const s=__dt.save;s.runs=5;s.mode='out';s.hero=h;s.weap='fusil';s.layout={};__dt.newGame(day);running=false;const S=__dt.S;S.god=true;__dt.startDay(S);
      document.getElementById('big').style.display='none';
      for(let i=0;i<30*sec;i++){step(S,1/30,{f:0,r:0,yaw:0,pitch:0});if(S.ev.length>4000)S.ev.length=0;}S.ev.length=0;
      Object.assign(S.p,{x:0,y:H,z:-B+.8,yaw:0,pitch:-.4,vx:0,vz:0,vy:0});return S.nAct;};});
  const shot=async n=>{await p.evaluate(()=>{__adv(1,true);try{uiTick(1/30);}catch(_){}document.getElementById('wave').style.display='none';});await p.screenshot({path:'shots/'+n+'.png'});};
  const live=()=>p.evaluate(()=>__live());
  const H=process.env.SEUL?process.env.SEUL.split(','):['feu','eau','bois','terre','elec'];
  for(const h of H){
    const n=await p.evaluate(h=>__setup(h,1,36),h);await p.evaluate(()=>{__adv(2,true);});
    // compétence : visée sur la foule de l'avenue nord (Volt : bond le long du toit, puis demi-tour pour voir la traînée)
    let okS;
    if(h==='elec'){okS=await p.evaluate(()=>{const S=__dt.S;Object.assign(S.p,{x:8,z:-6,yaw:Math.PI/2,pitch:-.05});S.hab=0;return useHeroSkill(S);});
      await p.evaluate(()=>{__adv(2,false);const S=__dt.S;S.p.yaw=-Math.PI/2;S.p.pitch=-.18;__adv(1,true);});}
    else{okS=await p.evaluate(h=>{const c=__crowd(0,h==='terre'?-50:-54);__aim(c[0],0,c[2]);const S=__dt.S;S.hab=0;return useHeroSkill(S);},h);}
    const sk={feu:6,eau:11,bois:20,terre:14,elec:0}[h];
    await p.evaluate(k=>__adv(k,false),sk);const L1=await live();
    const want={feu:['fbG','fbC'],eau:['wave0','p.water'],bois:['bush','bushD'],terre:['wallA'],elec:['dash','boltY']}[h];
    if(h==='feu'){await p.evaluate(()=>{let k=0;while(__dt.S.fballs.length&&k++<60)__adv(1,false);__adv(4,false);});}
    const L1b=await live();await shot('h-'+h);
    T(h+' : compétence lancée et visible',okS&&want.every(k=>L1[k]||L1b[k]),JSON.stringify(L1)+(h==='feu'?' → '+JSON.stringify(L1b):''));
    if(h==='feu')T('feu : flammes au sol et sol brûlé après l\'explosion',L1b.glow>0&&L1b.sco>0,JSON.stringify(L1b));
    // ultime
    const okU=await p.evaluate(h=>{const S=__dt.S;Object.assign(S.p,{x:0,y:H,z:-B+.8});const c=h==='terre'?[0,0,-31]:__crowd(0,-52);__aim(c[0],0,c[2]);
      if(h==='feu'||h==='elec')for(let k=0;k<6;k++){const c2=__crowd(0,-36-k*5);__aim(c2[0],1,c2[2]);shoot(S);}
      __aim(c[0],0,c[2]);if(h==='elec'){S.p.pitch+=.12;}S.ult=1;const r=useHeroUlt(S);__adv(1,false);window.__sh=G.shake;return r;},h);
    const uk={feu:22,eau:40,bois:40,terre:20,elec:14}[h];await p.evaluate(k=>__adv(k,false),uk);
    const L2=await live();const sh=await p.evaluate(()=>__sh),dc=await p.evaluate(()=>__draws());await shot('h-'+h+'-ult');
    const wantU={feu:['metR','metT','mark'],eau:['rain','pud','wet'],bois:['treeM','treeG'],terre:['spk'],elec:['cloud','sring']}[h];
    T(h+' : ultime lancé et visible',okU&&wantU.every(k=>L2[k]),JSON.stringify(L2)+(h==='terre'?' secousse '+sh.toFixed(2):'')+' · objets dessinés '+dc);
    // flèches et éclairs sont brefs : on les guette sur 90 images
    if(h==='bois'||h==='elec'){const k=h==='bois'?'arw':'boltY',m=await p.evaluate(k=>{let m=0;for(let i=0;i<90;i++){__adv(1,false);m=Math.max(m,HX[k].n);}return m;},k);
      T(h==='bois'?'bois : les gardiens tirent des flèches':'elec : la foudre tombe (arcs)',m>0,'au plus '+m+(h==='bois'?' flèches':' segments')+' à la fois');}
    // tout s'éteint : 24 s plus tard, plus rien d'affiché par les héros (réserves à zéro, anneaux et vagues cachés)
    if(process.env.SEUL)continue;
    await p.evaluate(()=>__adv(30*24,false));const L4=await live();
    T(h+' : tout disparaît ensuite',Object.keys(L4).length===0,JSON.stringify(L4));}
  if(process.env.SEUL){console.log(errs.length?errs.join('\n'):'erreurs 0');await b.close();return;}
  // deux zooms : la vue de haut d'un rempart cassé et d'un roncier (pour juger les modèles)
  await p.evaluate(()=>{__setup('terre',1,36);const S=__dt.S;__aim(0,0,-40);S.hab=0;useHeroSkill(S);__adv(25,false);window.__cam={x:S.ramparts[0].x+9,y:6,z:S.ramparts[0].z+9,yaw:Math.PI/4,pitch:-.35};});
  await shot('h-terre-zoom');
  await p.evaluate(()=>{const S=__dt.S,W=S.ramparts[0];W.hp=W.hp0*.4;__adv(4,false);});await shot('h-terre-zoom-abime');
  await p.evaluate(()=>{window.__cam=null;__setup('bois',1,36);const S=__dt.S;__aim(0,0,-40);S.hab=0;useHeroSkill(S);__adv(30,false);const Th=S.thorns[0];window.__cam={x:Th.x+8,y:5,z:Th.z+8,yaw:Math.PI/4,pitch:-.4};});
  await shot('h-bois-zoom');
  await p.evaluate(()=>{const S=__dt.S;S.ult=1;useHeroUlt(S);__adv(45,false);const g=S.guards[0];window.__cam={x:g.x+10,y:5,z:g.z+10,yaw:Math.PI/4,pitch:0};});
  await shot('h-bois-zoom-arbre');
  await p.evaluate(()=>{window.__cam=null;});
  // banc : jour 6 (beaucoup de zombies dehors), 300 images sans les héros puis 300 avec les 5 compétences et les 5 ultimes relancés toutes les 100 images
  const bench=await p.evaluate(()=>{__setup('feu',6,70);const S=__dt.S,Z=S.z;
    // la horde ne doit pas fondre pendant la mesure (sinon « après » dessinerait moins de zombies qu'« avant ») : vie énorme, réglage de test seulement
    for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.hp[i]=Z.hm[i]=1e9;}
    const c=__crowd(0,-40);__aim(c[0],0,c[2]);
    let tH=0,tP=0;const hf=window.hfxFrame,ps=window.partStep;window.hfxFrame=(a,b)=>{const t=performance.now();hf(a,b);tH+=performance.now()-t;};window.partStep=dt=>{const t=performance.now();ps(dt);tP+=performance.now()-t;};
    const run=(n,fire)=>{tH=0;tP=0;const t0=performance.now();for(let k=0;k<n;k++){if(fire&&k%100===0)fire();__adv(1,false);}return{ms:(performance.now()-t0)/n,hfx:tH/n,part:tP/n};};
    const all=()=>{for(const h of HKEYS){S.hero=h;S.hab=0;useHeroSkill(S);S.ult=1;useHeroUlt(S);}S.hero='eau';
      for(let q=0;q<S.nAct;q++){const i=S.act[q];Z.burn[i]=3;Z.psn[i]=3;Z.slow[i]=3;}};
    const nz=()=>{let o=0;for(let q=0;q<S.nAct;q++)if(Z.st[S.act[q]]===1)o++;return o;};
    S.hero='eau';const a=run(300,null),zA=nz(),dA=__draws();
    const bb=run(300,all),zB=nz(),dB=__draws(),L=__live();
    // la même chose avec le vrai rendu (SwiftShader : le dessin est fait par le processeur, chiffres seulement comparatifs)
    // (lecture d'un pixel après chaque image : on attend vraiment la fin du dessin)
    const gl=renderer.getContext?renderer.getContext():renderer.gl,px=new Uint8Array(4),rr=()=>{const t0=performance.now();for(let k=0;k<20;k++){__adv(1,true);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}return(performance.now()-t0)/20;};
    S.hero='feu';const r1=rr();all();const r2=rr();
    window.hfxFrame=hf;window.partStep=ps;
    return{a,b:bb,zA,zB,dA,dB,act:S.nAct,L,r1,r2};});
  console.log('banc (300 images, sans dessin GPU) : sans héros '+bench.a.ms.toFixed(2)+' ms/image (effets héros '+bench.a.hfx.toFixed(3)+', particules '+bench.a.part.toFixed(3)+') · zombies dehors '+bench.zA+' · objets dessinés '+bench.dA);
  console.log('                                     5 ultimes + 5 compétences : '+bench.b.ms.toFixed(2)+' ms/image (effets héros '+bench.b.hfx.toFixed(3)+', particules '+bench.b.part.toFixed(3)+') · zombies dehors '+bench.zB+' · objets dessinés '+bench.dB);
  console.log('   en cours à la fin : '+JSON.stringify(bench.L));
  console.log('   avec le rendu SwiftShader (20 images) : '+bench.r1.toFixed(1)+' → '+bench.r2.toFixed(1)+' ms/image');
  T('banc : le coût JS des effets reste petit',bench.b.hfx<2.5,bench.b.hfx.toFixed(3)+' ms/image');
  // les sons des héros, rendus hors ligne (comme sndtest.js) : chacun sort quelque chose, sans erreur, sans saturer
  const snd=await p.evaluate(async src=>{const code=src.replace(/ac\.state\s*===\s*['"]running['"]\s*&&/,"").replace(/try\s*\{\s*(\w+)\[n\]\(a\);?\s*\}\s*catch\s*\(_\)\s*\{\s*\}/g,"try{$1[n](a);}catch(e){errs.push(n+' : '+e.message);}")+'\nreturn SND;';
    const errs=[],out={},A0=window.AudioContext;await new Promise(r=>setTimeout(r,600));
    async function render(f){let off=null;window.AudioContext=function(){off=new OfflineAudioContext(2,44100*1.6,44100);return off;};
      const SND=new Function('save','camera','errs',code)({snd:true},{position:{x:0,y:1.6,z:0},rotation:{y:0}},errs);SND.resume();f(SND);
      const buf=await off.startRendering();let s=0,pk=0,n=0;for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<buf.length;i++){s+=d[i]*d[i];pk=Math.max(pk,Math.abs(d[i]));n++;}}return{rms:Math.sqrt(s/n),pk};}
    out.fond=await render(()=>{});
    const L=[['fireball',S=>S.play('fireball')],['meteor',S=>S.at('meteor',0,-30,0,25)],['vague',S=>S.at('vague',0,-20,0,0)],['ronces',S=>S.at('ronces',0,-20,0,0)],['fleche',S=>S.at('fleche',0,-15,0,5)],
      ['rempart',S=>S.at('rempart',0,-20,0,0)],['eboul',S=>S.at('eboul',0,-20,0,0)],['enfonce',S=>S.at('enfonce',0,-20,0,0)],['zap',S=>S.at('zap',0,-10,0,1)],['tonnerre',S=>S.at('tonnerre',0,-25,0,1)],
      ['eclair',S=>S.play('eclair')],['ult feu',S=>S.play('ult','feu')],['ult eau (pluie)',S=>S.play('ult','eau')],['ult bois',S=>S.play('ult','bois')],['ult terre (séisme)',S=>S.play('ult','terre')],['ult elec',S=>S.play('ult','elec')]];
    for(const[n,f]of L)out[n]=await render(f);window.AudioContext=A0;return{out,errs};},require('fs').readFileSync(__dirname+'/../sons/sound.js','utf8'));
  const sf=snd.out.fond,bad=[];for(const k in snd.out){if(k==='fond')continue;const q=snd.out[k];if(!((q.rms>sf.rms*1.25||q.pk>sf.pk*2)&&q.pk<1.01))bad.push(k+' (rms '+q.rms.toFixed(4)+', crête '+q.pk.toFixed(3)+')');}
  console.log('sons : '+Object.keys(snd.out).filter(k=>k!=='fond').map(k=>k+' '+snd.out[k].pk.toFixed(2)).join(' · '));
  T('16 sons de héros audibles, sans saturation',bad.length===0,bad.join(' ; ')||'fond '+sf.rms.toFixed(4));T('aucune erreur dans les sons',!snd.errs.length,snd.errs.join(' | '));
  console.log(errs.length?errs.join('\n'):'erreurs 0');T('pas d\'erreur de page',errs.length===0);console.log(ok+' OK, '+ko+' ratés');await b.close();})();
