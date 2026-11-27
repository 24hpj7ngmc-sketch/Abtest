// mesure de couverture : node -r ./outils/covhook.js tests/run2.js   → /tmp/cov/<script>.json (quelles fonctions et quels blocs du jeu ont réellement tourné)
// puis : node outils/covmerge.js   pour la liste de ce qui n'a tourné dans aucun test
const pw=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const out='/tmp/cov/'+path.basename(process.argv[1])+'.json',map={};
const keep=cov=>{for(const e of cov){if(!/\.html/.test(e.url)||!e.source)continue;for(const f of e.functions)f.ranges.forEach((r,i)=>{const t=e.source.slice(r.startOffset,r.endOffset);if(t.length<40)return;const k=crypto.createHash('md5').update(t).digest('hex');
      const m=map[k]||(map[k]={n:f.functionName,l:t.length,c:0,b:i>0?1:0,s:t.slice(0,160)});m.c=Math.max(m.c,r.count);});}fs.writeFileSync(out,JSON.stringify(map));};
const launch=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await launch(...a),pages=[],dump=async()=>{for(const p of pages.splice(0)){try{keep(await p.coverage.stopJSCoverage());}catch(_){}}};
  const nc=b.newContext.bind(b);b.newContext=async(...x)=>{const ctx=await nc(...x),np=ctx.newPage.bind(ctx),cc=ctx.close.bind(ctx);
    ctx.newPage=async()=>{const p=await np();await p.coverage.startJSCoverage({resetOnNavigation:false,reportAnonymousScripts:false});pages.push(p);return p;};ctx.close=async()=>{await dump();return cc();};return ctx;};
  const bc=b.close.bind(b);b.close=async()=>{await dump();return bc();};return b;};
