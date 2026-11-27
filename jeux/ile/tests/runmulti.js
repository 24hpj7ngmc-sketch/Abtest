// Le multi de la partie, vu du jeu : deux téléphones simulés, ce test joue le facteur à la place du lobby (« etat » de l'un → « pairs » de l'autre).   usage : node tests/runmulti.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
 const ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);};
 const ouvre=async(nom,heros,max)=>{const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(nom+' ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(nom+' console '+m.text().slice(0,200));});
  await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__etat=null;window.__etatN=0;window.__etatMax=0;window.__etat0=0;const pm=window.postMessage.bind(window);
   window.postMessage=(m,q)=>{if(m&&m.ile==='etat'){window.__etat=JSON.stringify(m.d);if(!window.__etatN)window.__etat0=performance.now();window.__etatN++;window.__etatMax=Math.max(window.__etatMax,window.__etat.length);}return pm(m,q);};},{heros,multi:{nom,depuis:Date.now(),max}});
  await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(500);return p;};
 const MAX=2800,A=await ouvre('Ana','feu',MAX);await A.waitForTimeout(400);const B=await ouvre('Bob','eau',MAX);
 // le facteur : dix fois par seconde, l'état de chacun est donné à l'autre (comme le fera le lobby)
 let go=true,aLa=true;const lit=p=>p.evaluate(()=>window.__etat).catch(()=>null),donne=(p,e,id,nom,heros,moi)=>p.evaluate(o=>window.postMessage({ile:'pairs',liste:o.e?[{id:o.id,nom:o.nom,heros:o.heros,etat:JSON.parse(o.e)}]:[],moi:{id:o.moi}},'*'),{e,id,nom,heros,moi}).catch(()=>{});
 const facteur=(async()=>{while(go){const ea=aLa?await lit(A):null,eb=await lit(B);if(aLa)await donne(A,eb,'B','Bob','eau','A');await donne(B,ea,'A','Ana','feu','B');await new Promise(r=>setTimeout(r,100));}})();
 await A.waitForTimeout(2500);
 const st=p=>p.evaluate(()=>{const g=__g(),s=g.sim;return{n:g.net.n,host:g.net.host,client:!!s.client,wave:s.wave,en:s.enemies.length,others:Object.keys(s.others||{}).length,tw:s.towers.length,max:window.__etatMax,envois:window.__etatN,par:window.__etatN/Math.max(1,(performance.now()-window.__etat0)/1000),gold:s.gold};});
 let a=await st(A),c=await st(B);
 ok('les deux parties se voient : 2 joueurs chacun (A '+a.n+', B '+c.n+')',a.n===2&&c.n===2);
 ok('la partie la plus ancienne fait foi : A est l\'hôte, B l\'invité',a.host&&!a.client&&!c.host&&c.client);
 ok('chacun voit l\'autre héros sur l\'île',a.others===1&&c.others===1);
 // l'hôte pose une défense et lance la vague : l'invité les voit
 await A.evaluate(()=>{const g=__g(),s=g.sim;s.gold=5000;const q=g.posAt(g.PATHS[0],.5*g.PATHS[0].len);for(let k=0;k<40&&!s.towers.length;k++)g.place(s,'archer','feu',q[0]+6+k*.5,q[1]+3);});
 await B.waitForTimeout(600);await B.evaluate(()=>__g().send(['go']));   // c'est l'invité qui lance la vague : son action passe par l'hôte
 await A.waitForTimeout(7500);a=await st(A);c=await st(B);
 ok('l\'invité lance la vague : son action arrive chez l\'hôte, et la vague revient chez lui (hôte : vague '+a.wave+', '+a.en+' ennemis ; invité : vague '+c.wave+', '+c.en+' ennemis)',a.wave===1&&c.wave===1&&a.en>0&&c.en>0);
 {const pos=p=>p.evaluate(()=>__g().sim.enemies.map(e=>[e.id,e.x,e.z]));const pa=await pos(A),pb=await pos(B),mb=new Map(pb.map(e=>[e[0],e]));let n=0,far=0;for(const e of pa){const q=mb.get(e[0]);if(!q)continue;n++;if(Math.hypot(e[1]-q[1],e[2]-q[2])>8)far++;}const an=pa.map(e=>Math.atan2(e[2],e[1])),sp=an.length?Math.max(...an)-Math.min(...an):0;
  ok('l\'invité voit les ennemis là où l\'hôte les a ('+n+' en commun, '+far+' à plus de 8 m), sortis de plusieurs points de la côte (écart '+sp.toFixed(1)+' rad)',n>=3&&far<=1&&sp>0.5);}
 ok('l\'invité voit la défense posée par l\'hôte ('+a.tw+' / '+c.tw+')',a.tw>=1&&c.tw===a.tw);
 ok('l\'état envoyé tient dans la taille permise (le plus gros : '+a.max+' caractères, permis '+MAX+') et part au plus dix fois par seconde ('+a.envois+' envois, '+a.par.toFixed(1)+' par seconde)',a.max>0&&a.max<=MAX&&a.par<=10.6);
 // l'hôte s'en va : l'invité reprend la partie
 aLa=false;await A.context().close();await B.waitForTimeout(4500);c=await st(B);
 ok('l\'hôte parti, l\'invité reprend la partie (hôte : '+c.host+', joueurs : '+c.n+', vague '+c.wave+')',c.host&&!c.client&&c.n===1);
 go=false;await facteur;
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.join('\n'));await b.close();process.exit(bad?1:0);})();
