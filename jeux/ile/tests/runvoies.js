// test de la V2.2 : les voies des six héros (opts.voie, spA1…spB2), l'ultime teinté par l'élément de l'arme, les rôles des ennemis, la colonne Vent de la campagne (Tourbillon).   usage : node tests/runvoies.js   (≈ 8 s)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const errs=[];let bad=0;const ctx=await b.newContext({viewport:{width:840,height:333},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
 await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__armesAuto=true;},{heros:'terre',arme:'pistolet',mode:'normal',voie:{id:'b',nom:'Avant-garde'},bonus:{mods:{terre:{pistolet:{spB1:4,spB2:1,spA1:3}}}}});await p.goto('file://'+path.resolve('construit/test.html'));
 const G=(f,a)=>p.evaluate(f,a),ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 await p.waitForTimeout(400);
 let A=await G(()=>{const g=__g(),m=g.heroMods('terre');return{voA:m.voA,voB:m.voB,spA1:m.spA1,spB1:m.spB1,nom:g.voieNom('terre'),autre:g.voieNom('feu'),b:document.getElementById('bAb').firstChild.textContent};});
 ok('opts.voie lu : voie b de Roc ('+A.nom+'), seules les cases de la voie b gardées (spA1 '+A.spA1+', spB1 '+A.spB1+'), bouton « '+A.b+' »',A.voB===1&&A.voA===0&&A.spA1===0&&A.spB1===4&&A.nom==='Avant-garde'&&A.autre===''&&A.b==='Charge',A);
 const R=await G(()=>{const g=__g(),I={f:0,r:0},R={},lv=1;
   const mk=(el,m,n)=>{const s=g.newSim(el,null,m||{},'normal');s.gold=5000;s.aiT=1e9;g.startWave(s);let k=0;while(s.enemies.length<(n||5)&&k++<3000)g.step(s,.05,I);s.queue.length=0;s.enemies.length=Math.min(n||5,s.enemies.length);for(const e of s.enemies){e.sea=null;e.hp=e.max=5000;e.stun=0;e.k='b';e.boss=false;e.arm=0;e.slow=0;e.el='feu';e.x=0;e.z=-60;e.fm=true;}const h=s.hero;h.x=0;h.z=-30;h.y=0;h.yaw=0;h.pitch=0.03;s.m.hCrit=-5;return s;};
   const fire=(s,h,n)=>{const sh=[];for(let i=0;i<(n||1);i++){h.cd=0;g.heroStep(s,h,{fire:true},.016,false);sh.push(s.shots[s.shots.length-1]);}return sh;};
   // Roc, Avant-garde : la charge, renverse sur le passage et à l'arrivée (spB2)
   {const s=mk('terre',{voB:1,spB1:4,spB2:1});const h=s.hero,z0=h.z;s.enemies.forEach((e,i)=>{e.x=[0,0.5,3,-12,0][i];e.z=h.z-[4,8,10.5,5,30][i];});g.ability(s,h,null);R.charge={d:z0-h.z,ab:h.ab,st:s.enemies.map(e=>+(e.stun>0)),wall:s.walls.length};}
   // Roc, Gardien : un allié près de lui prend 30 % de moins ; il renvoie les coups (spA2)
   {const s=mk('feu',{});s.others.x={el:'terre',m:{voA:1,spA1:1,spA2:1},x:s.hero.x+2,z:s.hero.z,y:0};const h=s.hero;h.hp=100;g.hurtHero(s,h,10);const a=100-h.hp;delete s.others.x;h.hp=100;g.hurtHero(s,h,10);R.gard={avec:a,sans:100-h.hp};
    const s2=mk('terre',{voA:1,spA2:1},1);const e=s2.enemies[0];e.x=s2.hero.x+2;e.z=s2.hero.z;e.ha=0;s2.hero.hp=999;s2.hero.maxHp=999;for(let i=0;i<3;i++)g.step(s2,.05,I);R.gard.renvoi=Math.round(5000-e.hp);}
   // Sylve, Colosse : plus de vie ; Plongeur : elle bondit, les Entraves poussent là où elle retombe
   {R.col=[g.heroHpOf('bois',{}),g.heroHpOf('bois',{voA:1,spA1:50})];const s=mk('bois',{voB:1,spB1:2});const h=s.hero,x0=h.x,z0=h.z;g.ability(s,h,[0,h.x,h.z,0,h.x,h.z-20]);const zn=s.zones.find(q=>q.el==='bois');R.plonge={d:Math.hypot(h.x-x0,h.z-z0),zone:zn?Math.hypot(zn.x-h.x,zn.z-h.z):99};}
   // Volt, Lame : +30 % sur une cible seule, achève sous 15 % ; Escarmoucheur : une élimination rend de la recharge
   {const s=mk('elec',{voA:1,spA2:1},2);const[e,o]=s.enemies;e.x=0;e.z=-40;o.x=30;o.z=-40;const sh=fire(s,s.hero)[0];R.lame={iso:sh.iso,exe:sh.exe};
    for(let i=0;i<20;i++)g.step(s,.02,I);R.lame.seule=5000-e.hp;
    const s2=mk('elec',{},2);const[e2,o2]=s2.enemies;e2.x=0;e2.z=-40;o2.x=30;o2.z=-40;fire(s2,s2.hero);for(let i=0;i<20;i++)g.step(s2,.02,I);R.lame.base=5000-e2.hp;
    const s3=mk('elec',{voA:1,spA2:1},1);const e3=s3.enemies[0];e3.x=0;e3.z=-40;e3.hp=e3.max*0.15+1;fire(s3,s3.hero);for(let i=0;i<20;i++)g.step(s3,.02,I);R.lame.acheve=!s3.enemies.includes(e3);
    const s4=mk('elec',{voB:1},1);const e4=s4.enemies[0];e4.x=0;e4.z=-40;e4.hp=1;s4.hero.ab=10;fire(s4,s4.hero);for(let i=0;i<20;i++)g.step(s4,.02,I);R.esc=+s4.hero.ab.toFixed(1);}
   // Braise, Artilleur : plus de portée ; Mage de bataille : l'aura brûle autour de lui
   {const s=mk('feu',{voA:1,spA1:5});const a=fire(s,s.hero)[0].life;const s2=mk('feu',{});const b=fire(s2,s2.hero)[0].life;R.arti=[+(a*60).toFixed(0),+(b*60).toFixed(0)];
    const s3=mk('feu',{voB:1},2);const[e,o]=s3.enemies;e.x=s3.hero.x+2;e.z=s3.hero.z;o.x=s3.hero.x+10;o.z=s3.hero.z;e.stun=o.stun=99;for(let i=0;i<20;i++)g.step(s3,.05,I);R.aura=[Math.round(5000-e.hp),Math.round(5000-o.hp)];}
   // Ondine, Soigneuse : soin renforcé et bouclier ; Entraveuse : la Répulsion immobilise
   {const s=mk('eau',{voA:1,spA2:1});const h=s.hero;h.hp=10;g.tide(s,h,null);R.soin={hp:Math.round(h.hp-10),shd:h.shd};h.hp=100;g.hurtHero(s,h,10);R.soin.apres=h.hp;
    const s2=mk('eau',{voB:1,spB1:0.5},1);const e=s2.enemies[0];e.x=s2.hero.x+3;e.z=s2.hero.z;g.tide(s2,s2.hero,null);R.entr=+e.stun.toFixed(1);}
   // Zéphyr, Sniper : bonus au-delà de 40 m, tir chargé après une pause ; Mitrailleur : plus vite en courant
   {const s=mk('vent',{voA:1,spA2:1});const h=s.hero;h.lsT=5;const a=fire(s,h,2);R.snip={sf:a[0].sf,c1:+(a[0].dmg/a[1].dmg).toFixed(2),ap:!!a[0].ap};
    const s2=mk('vent',{voB:1,spB1:0.08});const h2=s2.hero;h2.cd=0;h2.px=h2.x;h2.pz=h2.z;h2.x+=0.5;g.heroStep(s2,h2,{fire:true},.05,false);const c1=h2.cd;const s3=mk('vent',{});const h3=s3.hero;h3.cd=0;g.heroStep(s3,h3,{fire:true},.05,false);R.mit=+(h3.cd/c1).toFixed(2);}
   // l'ultime teinté : l'Onde de choc de Roc avec une arme de Feu brûle ; avec une arme de Terre, rien de plus
   {const s=mk('terre',{},2);const h=s.hero;h.wEl='feu';s.enemies.forEach((e,i)=>{e.x=h.x+2+i;e.z=h.z;});g.quake(s,h);R.tint={brule:s.enemies.map(e=>+(e.burn>0)),ev:s.events.some(v=>v.k==='tint'&&v.el==='feu')};
    const s2=mk('terre',{},1);s2.hero.wEl='terre';s2.enemies[0].x=s2.hero.x+2;s2.enemies[0].z=s2.hero.z;g.quake(s2,s2.hero);R.tint.terre=s2.events.some(v=>v.k==='tint');
    const s3=mk('eau',{},2);s3.hero.wEl='terre';g.deluge(s3,s3.hero);R.tint.deluge=s3.enemies.map(e=>+(e.stun>0));}
   // les rôles : l'assassin fonce sur le héros, le tank attire les tirs
   {const s=mk('feu',{},1);const e=s.enemies[0];e.k='ste';e.x=s.hero.x+15;e.z=s.hero.z;const d0=Math.hypot(e.x-s.hero.x,e.z-s.hero.z);for(let i=0;i<20;i++)g.step(s,.05,I);R.ass=[+d0.toFixed(1),+Math.hypot(e.x-s.hero.x,e.z-s.hero.z).toFixed(1)];
    const s2=mk('feu',{},2);g.place(s2,'archer',20,20,'feu');const t=s2.towers[0];const[a,b2]=s2.enemies;a.k='b';a.x=t.x+3;a.z=t.z;a.rem=5;b2.k='tank';b2.x=t.x+6;b2.z=t.z;b2.rem=50;a.stun=b2.stun=99;t.cd=0;for(let i=0;i<3;i++)g.step(s2,.05,I);R.tank=s2.bombs.length?(s2.bombs[0].tid===b2.id?'tank':'autre'):(t?'pas de tir':'pas de défense');}
   // la campagne du Vent : le Tourbillon arrive dès la vague 2 et pousse ses voisins vers le cœur
   {const s=g.setCamp(g.newSim('feu',null,{},'normal'),'vent',1);const w2=g.genWave(s,2);R.camp={tou:w2.some(q=>q.k==='tou'&&q.el==='vent'),role:g.KINDS.tou.r,nom:g.KINDS.tou.n,roles:Object.keys(g.KINDS).filter(k=>k!=='gra').every(k=>g.KINDS[k].r)};
    const s2=mk('feu',{},3);const[t,a,c]=s2.enemies;t.k='tou';t.ft=0;t.x=40;t.z=10;a.x=43;a.z=10;c.x=60;c.z=10;for(const e of[t,a,c])e.stun=0;for(const e of[t,a,c])e.tc=null;const pa=[a.x,a.z],pc=[c.x,c.z];for(let i=0;i<2;i++)g.step(s2,.02,I);R.gust=[+Math.hypot(a.x-pa[0],a.z-pa[1]).toFixed(1),+Math.hypot(c.x-pc[0],c.z-pc[1]).toFixed(1),s2.events.some(v=>v.k==='gust')];}
   return R;});
 ok('Roc Avant-garde : charge de '+R.charge.d.toFixed(1)+' m (recharge '+R.charge.ab+' s, pas de mur), renverse '+R.charge.st.join(''),R.charge.d>9.5&&R.charge.d<10.6&&R.charge.ab===18&&R.charge.wall===0&&R.charge.st.join('')==='11100'.slice(0,3)+'00',R.charge);
 ok('Roc Gardien : un allié près de lui prend '+R.gard.avec.toFixed(1)+' au lieu de '+R.gard.sans.toFixed(1)+' ; renvoi au contact : '+R.gard.renvoi,Math.abs(R.gard.avec/R.gard.sans-0.7)<0.02&&R.gard.renvoi>0,R.gard);
 ok('Sylve Colosse : '+R.col[0]+' → '+R.col[1]+' PV ; Plongeur : bond de '+R.plonge.d.toFixed(1)+' m, Entraves à '+R.plonge.zone.toFixed(1)+' m',R.col[1]-R.col[0]===110&&R.plonge.d>9.4&&R.plonge.d<10.6&&R.plonge.zone<0.5,R);
 ok('Volt Lame : cible seule ×'+(R.lame.seule/R.lame.base).toFixed(2)+', achève sous 15 % ('+R.lame.acheve+') ; Escarmoucheur : recharge 10 → '+R.esc+' s',R.lame.seule/R.lame.base>1.25&&R.lame.acheve&&R.esc<7,R);
 ok('Braise Artilleur : portée '+R.arti[0]+' m contre '+R.arti[1]+' ; Mage de bataille : l\'aura brûle à 2 m ('+R.aura[0]+'), pas à 10 m ('+R.aura[1]+')',R.arti[0]>R.arti[1]*1.2&&R.aura[0]>0&&R.aura[1]===0,R);
 ok('Ondine Soigneuse : soin +'+R.soin.hp+', bouclier '+R.soin.shd+' (un coup de 10 : '+R.soin.apres+' PV) ; Entraveuse : immobilisé '+R.entr+' s',R.soin.hp>45&&R.soin.shd>0&&R.soin.apres===100&&R.entr>=2,R);
 ok('Zéphyr Sniper : +'+Math.round(R.snip.sf*100)+' % au loin, tir chargé ×'+R.snip.c1+' qui perce l\'armure ; Mitrailleur : cadence ×'+R.mit+' en courant',R.snip.sf===0.15&&Math.abs(R.snip.c1-1.5)<0.01&&R.snip.ap&&R.mit>1.15,R);
 ok('ultime teinté : Onde de choc + arme de Feu, ils brûlent ('+R.tint.brule.join('')+') ; arme de Terre, rien de plus ('+R.tint.terre+') ; Sanctuaire + arme de Terre, ils sont étourdis ('+R.tint.deluge.join('')+')',R.tint.brule.join('')==='11'&&R.tint.ev&&!R.tint.terre&&R.tint.deluge.join('')==='11',R.tint);
 ok('rôles : l\'Assassin fonce sur le héros ('+R.ass[0]+' → '+R.ass[1]+' m) ; le Tank attire le tir de l\'archer ('+R.tank+')',R.ass[1]<R.ass[0]-3&&R.tank==='tank',R);
 ok('campagne du Vent : le '+R.camp.nom+' ('+R.camp.role+') à la vague 2, tous les ennemis ont un rôle ; sa bourrasque pousse le voisin de '+R.gust[0]+' m vers le cœur, pas celui de loin ('+R.gust[1]+' m)',R.camp.tou&&R.camp.role==='Support'&&R.camp.roles&&R.gust[0]>2.5&&R.gust[1]<0.6&&R.gust[2],R);
 console.log('ratés',bad,'· erreurs',errs.length);for(const e of errs)console.log(e);await b.close();process.exit(bad||errs.length?1:0);})();
