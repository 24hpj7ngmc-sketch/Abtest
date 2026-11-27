// test du Vent et de Zéphyr (V2.1) : six éléments, boucle à six, opts.elements qui préremplit le choix des armes, la Rafale, le Tir perçant, les balles de Vent (traversent, soulèvent les petits), Renfort de l'élément du héros.   usage : node tests/runvent.js   (≈ 6 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:840,height:333},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__armesAuto=false;},{heros:'vent',arme:'sniper',mode:'hard',elements:{sniper:'vent',fusil:'feu',assaut:'bois',pompe:'zzz'}});await p.goto('file://'+path.resolve('construit/test.html'));
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 await p.waitForTimeout(400);
 let A=await G(()=>({ars:__g().getArs().map(o=>o.w+':'+o.el).join(','),star:[...document.querySelectorAll('#arsE .ech')].filter(x=>x.textContent.includes('★')).map(x=>x.dataset.e).join(','),n:document.querySelectorAll('#arsE .erow:first-child .ech').length,names:[...document.querySelectorAll('#arsE .erow:first-child .ech')].map(x=>x.textContent).join(' ')}));
 ok('opts.elements préremplit le choix : '+A.ars+' ; six éléments ('+A.names+'), l\'étoile sur le Vent',A.ars==='sniper:vent,fusil:feu,assaut:bois'&&A.n===6&&/Nature/.test(A.names)&&!/Bois/.test(A.names)&&A.star==='vent,vent,vent',A);
 A=await G(()=>{const g=__g(),m=g.mult;return[m('vent','terre'),m('bois','vent'),m('vent','bois'),m('vent','vent'),m('terre','vent',true),m('eau','feu')];});
 ok('×1,5 / ×0,75 / ×1 (même élément) / ×0,5 contre un boss qui nous bat : '+A.join(' '),A.join(',')==='1.5,1.5,0.75,1,0.5,1.5',A);
 await p.locator('#arsGo').evaluate(el=>el.click());await p.waitForTimeout(150);
 A=await G(()=>({b:document.getElementById('bAb').firstChild.textContent,u:document.getElementById('bUlt').firstChild.textContent}));ok('les boutons : '+A.b+' · '+A.u,A.b==='Rafale'&&A.u==='Tir perçant',A);
 const R=await G(()=>{const g=__g(),I={f:0,r:0},R={};
   const mk=(el,m)=>{const s=g.newSim(el||'vent',null,m||{},'hard');s.gold=5000;g.startWave(s);let n=0;while(s.enemies.length<5&&n++<2000)g.step(s,.05,I);s.queue.length=0;s.enemies.length=Math.min(5,s.enemies.length);for(const e of s.enemies){e.sea=null;e.hp=e.max=5000;e.stun=99;e.k='b';e.boss=false;e.arm=0;e.x=0;e.z=-40;e.slow=0;e.el='feu';}s.hero.x=0;s.hero.z=-30;s.hero.y=0;s.hero.yaw=0;s.hero.pitch=0.03;s.m.hCrit=-5;return s;};
   // la Rafale : un bond en arrière, recharge 14 s ; avec kPush elle repousse les voisins
   {const s=mk();const h=s.hero,z0=h.z,x0=h.x;s.enemies.forEach((e,i)=>{e.x=h.x+[1.5,-1.5,0,9,0][i];e.z=h.z+[1,1,-2,9,30][i];});const e0=[s.enemies[0].x,s.enemies[0].z];g.ability(s,h,null);R.raf={d:Math.hypot(h.x-x0,h.z-z0),ab:h.ab,ev:s.events.some(e=>e.k==='rafale'),still:Math.hypot(s.enemies[0].x-e0[0],s.enemies[0].z-e0[1])};
    const s2=mk('vent',{kPush:1,kLen:2,abCd:2});const h2=s2.hero,z2=h2.z,x2=h2.x;s2.enemies.forEach((e,i)=>{e.x=h2.x+[1.5,-1.5,0,9,0][i];e.z=h2.z+[1,1,-2,9,30][i];e.stun=0;});const f0=[s2.enemies[0].x,s2.enemies[0].z];g.ability(s2,h2,null);for(let i=0;i<10;i++)g.step(s2,.03,I);R.raf2={d:Math.hypot(h2.x-x2,h2.z-z2),ab:h2.ab,pushed:Math.hypot(s2.enemies[0].x-f0[0],s2.enemies[0].z-f0[1])};}
   // le Tir perçant : tout ce qui est sur la ligne, rien à côté
   {const s=mk();const h=s.hero;s.enemies.forEach((e,i)=>{e.x=[0,0.8,0,6,0][i];e.z=h.z-[10,30,60,20,0][i]-(i===4?-15:0);});g.perce(s,h);R.perce={hp:s.enemies.map(e=>5000-e.hp),ev:s.events.find(e=>e.k==='perce')};}
   // les balles de Vent : elles traversent plusieurs ennemis en ligne et soulèvent les petits (pas un tank)
   const shot=(el,lineK)=>{const s=mk('feu');const h=s.hero;s.enemies.forEach((e,i)=>{e.x=0;e.z=-40-i*2.5;e.stun=0;if(lineK&&i===1)e.k=lineK;});h.wEl=el;h.wu={};h.cd=0;g.heroStep(s,h,{fire:true},.016,false);const sh=s.shots[0];let lift=[];for(let i=0;i<30;i++){g.step(s,.02,I);if(i===8)lift=s.enemies.map(e=>+(e.lift>0));}return{hit:sh?sh.hit.length:0,lift};};
   R.vent=shot('vent');R.terre=shot('terre');R.tank=shot('vent','tank');
   // Renfort : des défenses de l'élément du héros
   {const s=mk();const h=s.hero;h.x=-30;h.z=40;h.sm=0;const n=s.towers.length;(window.__g().renfortF||(()=>0))(s,h);R.ren=s.towers.slice(n).map(t=>t.els.join('+'));}
   return R;});
 ok('Rafale : bond de '+R.raf.d.toFixed(1)+' m, recharge '+R.raf.ab+' s, les voisins ne bougent pas sans la case « repousse »',R.raf.d>7&&R.raf.d<8.6&&R.raf.ab===14&&R.raf.ev&&R.raf.still<0.05,R.raf);
 ok('Rafale avec l\'arbre : bond de '+R.raf2.d.toFixed(1)+' m, recharge '+R.raf2.ab.toFixed(1)+' s, le voisin repoussé de '+R.raf2.pushed.toFixed(1)+' m',R.raf2.d>R.raf.d+1&&R.raf2.ab>11.5&&R.raf2.ab<=12&&R.raf2.pushed>1,R.raf2);
 ok('Tir perçant : les trois ennemis sur la ligne touchés ('+R.perce.hp.slice(0,3).map(x=>x.toFixed(0)).join(', ')+'), pas celui à 6 m à côté ni celui derrière',R.perce.hp[0]>50&&R.perce.hp[1]>50&&R.perce.hp[2]>50&&R.perce.hp[3]===0&&R.perce.hp[4]===0&&R.perce.ev,R.perce);
 ok('balle de Vent : elle traverse ('+R.vent.hit+' ennemis touchés, contre '+R.terre.hit+' en Terre) et soulève les petits ('+R.vent.lift.join('')+'), pas le tank ('+R.tank.lift.join('')+')',R.vent.hit>=2&&R.terre.hit===1&&R.vent.lift[0]===1&&R.tank.lift[1]===0,R);
 if(R.ren.length)ok('Renfort de Zéphyr : '+R.ren.join(', '),R.ren.every(x=>x==='vent'),R.ren);
 const E=await G(()=>{const g=__g(),s=g.sim;s.events.push({k:'rafale',x:0,z:0,ex:5,ez:5},{k:'perce',x:0,z:0,ex:0,ez:-50,w:1.5,el:'vent'});return 1;});await p.waitForTimeout(300);
 ok('les effets de la Rafale et du Tir perçant s\'affichent sans erreur',!errs.length,errs);
 console.log('ratés',bad,'· erreurs',errs.length);for(const e of errs)console.log(e);await b.close();process.exit(bad||errs.length?1:0);})();
