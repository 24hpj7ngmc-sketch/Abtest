// V1.5, sons : chaque nouveau son est rendu hors ligne (OfflineAudioContext) dans Chromium ; on vérifie qu'il sort quelque chose, sans erreur, et que la distance l'atténue
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();const src=fs.readFileSync(__dirname+'/../sons/sound.js','utf8');
  const r=await p.evaluate(async src=>{
    // play() et at() avalent les erreurs : on les fait remonter ; et le contexte hors ligne compte comme « en marche »
    const code=src.replace(/ac\.state\s*===\s*['"]running['"]\s*&&/,"").replace(/try\s*\{\s*(\w+)\[n\]\(a\);?\s*\}\s*catch\s*\(_\)\s*\{\s*\}/g,"try{$1[n](a);}catch(e){errs.push(n+' : '+e.message);}")+'\nreturn SND;';
    const errs=[],out={};await new Promise(r=>setTimeout(r,600));   // les sons limités en cadence (ok(k,ms)) refusent si performance.now() est encore trop petit
    async function render(f){let off=null;window.AudioContext=function(){off=new OfflineAudioContext(2,44100*1.6,44100);return off;};
      const SND=new Function('save','camera','errs',code)({snd:true},{position:{x:0,y:1.6,z:0},rotation:{y:0}},errs);SND.resume();f(SND);
      const buf=await off.startRendering();let s=0,pk=0,n=0,zc=0;for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<22050;i++){s+=d[i]*d[i];pk=Math.max(pk,Math.abs(d[i]));n++;if(i<22050){s+=0;}if(c===0&&i>0&&i<13230&&(d[i]>0)!==(d[i-1]>0))zc++;}}
      return{rms:Math.sqrt(s/n),pk,zc};}
    out.fond=await render(()=>{});
    const L=[['wallhit',S=>S.at('wallhit',0,-3,0,1.5)],['wallbreak',S=>S.at('wallbreak',0,-3,0,1.5)],['swing',S=>S.play('swing')],['masse (zombie)',S=>S.at('masse',0,-1.2,1,1.1)],
      ['masse (mur)',S=>S.at('masse',0,-1.2,2,1.1)],['plank',S=>S.at('plank',0,-2,0,1.1)],['tear',S=>S.at('tear',0,-3,0,1.1)],['tear loin (40 m)',S=>S.at('tear',40,0,0,1.1)],['réf. shot',S=>S.play('shot')],['réf. place',S=>S.play('place')],['réf. kill',S=>S.play('kill')],['réf. hit',S=>S.play('hit')]];
    for(const[n,f]of L)out[n]=await render(f);return{out,errs};},src);
  let ok=0,ko=0;const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const f=r.out.fond;console.log('fond (vent)',f.rms.toFixed(4));
  console.log('fond crête',f.pk.toFixed(3));for(const k in r.out){if(k==='fond')continue;if(/^réf/.test(k)){console.log(k,'rms',r.out[k].rms.toFixed(4),'crête',r.out[k].pk.toFixed(3));continue;}const q=r.out[k];T('son '+k,(q.rms>f.rms*1.25||q.pk>f.pk*2)&&q.pk<1.01,'rms '+q.rms.toFixed(4)+', crête '+q.pk.toFixed(3));}
  T('masse dans un mur plus sourde (moins de passages par zéro)',r.out['masse (mur)'].zc<r.out['masse (zombie)'].zc,r.out['masse (mur)'].zc+' < '+r.out['masse (zombie)'].zc);
  T('tear : plus faible de loin',r.out['tear loin (40 m)'].rms<r.out['tear'].rms,r.out['tear loin (40 m)'].rms.toFixed(4)+' < '+r.out['tear'].rms.toFixed(4));
  T('aucune erreur dans les sons',!r.errs.length,r.errs.join(' | '));
  console.log(ok+' OK, '+ko+' ratés');await b.close();})();
