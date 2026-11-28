// Le fichier à coller (construit/ile-pour-lobby.js) dans une page vide qui joue le lobby : le jeu s'ouvre dans son cadre, parle au lobby, se ferme.   usage : node tests/runpont.js
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0;
 const ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);};
 const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|fonts/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 fs.writeFileSync('construit/pont-test.html','<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0;background:#234"><p id=lob>le lobby</p><script>'+fs.readFileSync('construit/ile-pour-lobby.js','utf8')+'\nwindow.IleDesCinq=IleDesCinq;</script></body></html>');
 await p.goto('file://'+path.resolve('construit/pont-test.html'));
 const v=await p.evaluate(()=>({v:IleDesCinq.version,a:IleDesCinq.accepte.join(),t:Object.keys(IleDesCinq.tables).join(),o:IleDesCinq.ouvert,g:Object.keys(window).filter(k=>/^(sim|BAL|newSim|begin|save)$/.test(k)).length}));
 ok('une seule variable globale, IleDesCinq '+v.v+' (accepte : '+v.a+' ; tables : '+v.t+')',/^V\d+\.\d+$/.test(v.v)&&v.a.includes('multi')&&['ELS','BAL','BALN','KIT','KINDS','CAMPN','CAMPW'].every(n=>v.t.split(',').includes(n))&&!v.o&&v.g===0);
 const z=await p.evaluate(()=>{const I=IleDesCinq,T=I.tables;return{heros:(I.HEROS||[]).join(','),acc:I.accepte.includes('elements'),beats:JSON.stringify(T.BEATS),kit:T.KIT.vent&&T.KIT.vent.skill+' · '+T.KIT.vent.ult,nat:T.EL.bois.n,role:T.EL.vent.role,bal:[T.BAL.strong,T.BAL.predi,T.BAL.zephCd,T.BAL.zephLen,T.BAL.zephFar,T.BAL.zephK].join(' '),camp:T.CAMPS.vent,tou:T.KINDS.tou&&T.KINDS.tou.n+' ('+T.KINDS.tou.r+')',ste:T.KINDS.ste.r};});
 ok('V2.1-2.2 : Zéphyr annoncé ('+z.heros+'), « elements » accepté, boucle à six, KIT du Vent ('+z.kit+'), « '+z.nat+' », Zéphyr '+z.role+', BAL '+z.bal+' ; campagne du Vent : '+z.tou+' ; le Furtif est '+z.ste,z.heros==='feu,eau,bois,terre,elec,vent'&&z.acc&&z.beats==='{"eau":"feu","feu":"bois","bois":"vent","vent":"terre","terre":"elec","elec":"eau"}'&&z.kit==='Bond · Tir perçant'&&z.nat==='Nature'&&z.role==='Tireur'&&z.bal==='1.5 0.1 14 8 30 0.2'&&z.camp==='tou'&&z.tou==='Tourbillon (Support)'&&z.ste==='Assassin',z);
 await p.evaluate(tl=>{IleDesCinq.troisJs=tl;window.__m=[];const r={};for(const k of['pret','fin','reglages','arme','etat'])r[k]=m=>window.__m.push([k,m]);r.retour=()=>window.__m.push(['retour']);
  IleDesCinq.ouvrir({heros:'bois',arme:'pompe',mode:'normal',encoche:{haut:0,bas:21,gauche:59,droite:59},multi:{nom:'Ana',depuis:1,max:2800},bonus:{mods:{bois:{pompe:{hDmg:0.2}}}}},r);},'file://'+path.resolve('gfx/three-lite.js'));
 for(let i=0;i<60&&!(await p.evaluate(()=>window.__m.some(x=>x[0]==='pret')&&window.__m.some(x=>x[0]==='etat')));i++)await p.waitForTimeout(250);
 const f=p.frames().find(x=>x!==p.mainFrame());
 let s=await p.evaluate(()=>({o:IleDesCinq.ouvert,c:!!document.getElementById('ileDesCinq'),m:window.__m.map(x=>x[0]),pret:(window.__m.find(x=>x[0]==='pret')||[])[1]}));
 ok('ouvrir : le cadre est là, le jeu répond « pret » (héros '+(s.pret&&s.pret.heros)+', arme '+(s.pret&&s.pret.arme)+')',s.o&&s.c&&s.pret&&s.pret.heros==='bois'&&s.pret.arme==='pompe');
 ok('multi : l\'état du joueur remonte au lobby (rappel « etat »)',s.m.includes('etat'));
 const enc=await f.evaluate(()=>{const cs=getComputedStyle(document.documentElement);return[cs.getPropertyValue('--enc-gauche').trim(),cs.getPropertyValue('--enc-bas').trim(),getComputedStyle(document.getElementById('hud')).paddingLeft];});
 ok('l\'encoche mesurée par le lobby est appliquée dans le jeu ('+enc.join(' · ')+')',enc[0]==='59px'&&enc[1]==='21px'&&enc[2]==='59px');
 // V2.0 : le choix des armes s'ouvre au début de la partie, l'arme du lobby en première
 const ars=await f.evaluate(()=>({v:!document.getElementById('arsV').hidden,first:'1',w:([...document.querySelectorAll('#arsW .wcard.on')].find(c=>c.querySelector('i').textContent==='1')||{dataset:{}}).dataset.w,n:document.querySelectorAll('#arsW .wcard.on').length}));
 ok('le choix des armes s\'ouvre au début de la partie : '+ars.n+' armes proposées, l\'arme du lobby ('+ars.w+') en première',ars.v&&ars.n===3&&ars.w==='pompe'&&ars.first==='1');
 await f.locator('#arsGo').tap();await p.waitForTimeout(200);
 ok('« C\'est parti » ferme le choix',await f.evaluate(()=>document.getElementById('arsV').hidden));
 await p.screenshot({path:'shots/41-pont.png'});
 // fin de partie, paie, retour
 await f.locator('#mini').tap();await f.locator('#mapOpt [data-a=quit]').tap();await p.waitForTimeout(200);await f.locator('#mapOpt [data-a=quit]').tap();await p.waitForTimeout(500);
 s=await p.evaluate(()=>({o:IleDesCinq.ouvert,c:!!document.getElementById('ileDesCinq'),m:window.__m.map(x=>x[0])}));
 ok('abandon dans le jeu : le cadre se retire, le lobby reçoit « retour » (sans « fin »)',!s.o&&!s.c&&s.m.includes('retour')&&!s.m.includes('fin'));
 // rouvrir puis fermer d'autorité ; un message venu d'ailleurs que le cadre est ignoré
 await p.evaluate(()=>{window.__m=[];IleDesCinq.ouvrir({heros:'feu'},{pret:m=>window.__m.push(['pret',m]),fin:m=>window.__m.push(['fin',m])});window.postMessage({ile:'fin',victoire:true},'*');});for(let i=0;i<60&&!(await p.evaluate(()=>window.__m.some(x=>x[0]==='pret')));i++)await p.waitForTimeout(250);
 s=await p.evaluate(()=>({m:window.__m.map(x=>x[0])}));ok('un faux message « fin » venu de la page du lobby est ignoré',s.m.includes('pret')&&!s.m.includes('fin'));
 await p.evaluate(()=>IleDesCinq.fermer());ok('fermer : plus de cadre',await p.evaluate(()=>!IleDesCinq.ouvert&&!document.getElementById('ileDesCinq')));
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.join('\n'));await b.close();process.exit(bad?1:0);})();
