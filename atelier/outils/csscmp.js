// Compare les feuilles de style de deux pages telles que le navigateur les comprend (règle par règle). usage : node csscmp.js ancienne.html nouvelle.html
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const get=async f=>{const p=await b.newPage();await p.route('**/*',r=>r.request().url().startsWith('file:')?r.continue():r.abort());await p.goto('file://'+path.resolve(f)).catch(()=>{});
  const r=await p.evaluate(()=>[...document.styleSheets].map(s=>{try{return[...s.cssRules].map(r=>r.cssText);}catch(e){return['?'];}}));await p.close();return r;};
 const A=await get(process.argv[2]),B=await get(process.argv[3]);await b.close();// les variables (--x) gardent leur texte brut : on ne compte ni les espaces ni le zéro devant la virgule
 const norm=t=>t.replace(/\s+/g,'').replace(/(^|[^\d.])0\.(\d)/g,'$1.$2'),a=A.flat().map(norm),c=B.flat().map(norm);let i=0;while(i<a.length&&i<c.length&&a[i]===c[i])i++;
 if(i===a.length&&i===c.length){console.log('feuilles de style identiques ('+a.length+' règles)');process.exit(0);}console.log('DIFFÉRENTES à la règle',i,'sur',a.length,'/',c.length,'\n ancien  :',a[i],'\n nouveau :',c[i]);process.exit(1);})();
