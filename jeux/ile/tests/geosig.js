// signature de la géométrie des modèles (pour prouver qu'un nettoyage ne change pas les formes).  usage : node tests/geosig.js > /tmp/geo.txt   puis diff
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await(await b.newContext({viewport:{width:844,height:390}})).newPage();
 await p.addInitScript(()=>{window.__keep=true;});await p.goto('file://'+path.resolve('construit/test3d.html'));await p.waitForTimeout(1500);
 const out=await p.evaluate(()=>{const g=__g(),K=g.K,M=g.MODELS,res=[];
  const sig=o=>{let h=2166136261,n=0;const seen=new Set(),num=v=>{h=Math.imul(h^(Math.round(v*1000)|0),16777619)>>>0;n++;},walk=(v,d)=>{if(v==null||d>9)return;const t=typeof v;if(t==='number'){if(Number.isFinite(v))num(v);return;}if(t==='string'){for(let i=0;i<v.length;i++)num(v.charCodeAt(i));return;}if(t==='boolean'){num(v?1:0);return;}if(t!=='object')return;
     if(seen.has(v))return;seen.add(v);if(ArrayBuffer.isView(v)){for(let i=0;i<v.length;i++)num(v[i]);return;}if(Array.isArray(v)){for(const q of v)walk(q,d+1);return;}for(const k of Object.keys(v).sort()){if(k==='uuid'||k==='id'||k[0]==='_')continue;walk(v[k],d+1);}};walk(o,0);return h.toString(16)+':'+n;};
  const els=['feu','eau','bois','terre','elec'],C=[];
  for(const n of Object.keys(M).sort()){if(/^vil\./.test(n))C.push([n,{lvl:1}],[n,{}]);else if(n==='pnj.villageois')for(let v=0;v<3;v++)C.push([n,{th:1,v}]);else if(n==='pnj.animal')C.push([n,{th:1}],[n,{}]);
    else if(/^pay\.cel\./.test(n))for(let v=0;v<3;v++)C.push([n,{v}]);else if(/^pay\./.test(n))continue;else if(n==='lob.butin')for(const k of['relique','couronne','sceau','etoile_feu','x'])C.push([n,{kind:k}]);else if(n==='lob.ilot')for(let v=0;v<4;v++)C.push([n,{v}]);
    else if(/^(enemy|boss|tower|hero|vm|shot|wall|lob\.(astre|banniere|etoile))/.test(n)){for(const el of els)C.push([n,{el,P:K.EL[el],els:[el],lvl:1}]);C.push([n,{el:'feu',P:K.EL.feu,els:['feu','feu','eau'],lvl:3}]);}
    else{C.push([n,{}]);for(let v=1;v<4;v++)C.push([n,{v}]);}}
  for(const [n,ctx] of C){let s='';try{const rec=M[n](ctx);s=sig(rec);}catch(e){s='ERREUR '+e.message;}res.push(n+' '+JSON.stringify(ctx,(k,v)=>k==='P'?undefined:v)+' '+s);}return res;});
 console.log(out.join('\n'));await b.close();})();
