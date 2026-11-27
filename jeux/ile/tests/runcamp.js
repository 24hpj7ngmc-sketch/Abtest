// La campagne vue du jeu : un niveau donné par le lobby (type, rang), ses vagues, sa difficulté, les cinq attaquants spéciaux, les décors.   usage : node tests/runcamp.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
  const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.addInitScript(()=>{window.ILE_LOBBY={heros:'eau',campagne:{el:'feu',l:1}};});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(800);
  const G=(f,a)=>p.evaluate(f,a),ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);};
 ok('la partie démarre en campagne : 20 vagues, règles du mode normal',await G(()=>{const s=__g().sim;return s.camp&&s.camp.el==='feu'&&s.camp.l===1&&s.maxW===20&&s.mode==='normal'&&s.ck===1;}));
 // le bouton Saut en partie (cassé de la V8.9 à la V9.5 par un commentaire qui avalait la fin d'une ligne : ce contrôle reste dans les tests principaux)
 {const y=async()=>G(()=>__g().sim.hero.y),y0=await y();await p.locator('#bJump').evaluate(el=>{const r=el.getBoundingClientRect(),o={bubbles:true,cancelable:true,pointerId:21,pointerType:'touch',clientX:r.left+r.width*.72,clientY:r.top+r.height*.26};el.dispatchEvent(new PointerEvent('pointerdown',o));el.dispatchEvent(new PointerEvent('pointerup',o));});
  let top=y0;for(let i=0;i<8;i++){await p.waitForTimeout(60);top=Math.max(top,await y());}ok('le bouton Saut fait sauter le héros en partie (hauteur '+(top-y0).toFixed(2)+' m)',top-y0>.5);await p.waitForTimeout(900);}
 ok('le décor du type est posé au départ (thème Feu, '+await G(()=>__g().themeG.children.length)+' maillages)',await G(()=>__g().getTheme()==='feu'&&__g().themeG.children.length>=2));
 // les vagues d'un niveau : part de l'élément du type, boss du type, difficulté par rang
 const st=await G(()=>{const g=__g(),R={};for(const l of[1,2,4]){let sd=12345+l;const s=g.setCamp(g.newSim('eau',()=>(sd=(sd*16807)%2147483647)/2147483647,{},'normal'),'feu',l);let n=0,f=0,boss=[];for(let w=1;w<=20;w++)for(const q of g.genWave(s,w)){if(q.boss)boss.push(q.el+q.bt);else{n+=q.count;if(q.el==='feu')f+=q.count;}}
   g.startWave(s);let k=0;while(!s.enemies.length&&k++<300)g.step(s,.05,{f:0,r:0});R[l]={part:f/n,boss:boss.join(','),hp:s.enemies[0].max/(g.KINDS[s.enemies[0].k]||g.KINDS.b).hp};}
   const s0=g.newSim('eau',null,{},'normal');return{R,libre:s0.camp===undefined&&s0.maxW===20};});
 ok('vagues de Feu : '+Math.round(st.R[1].part*100)+' % d\'ennemis de Feu, boss de Feu aux vagues 5, 10, 15 et 20 ('+st.R[1].boss+')',st.R[1].part>.5&&st.R[1].boss==='feu1,feu2,feu2,feu3');
 ok('difficulté : vie ×1,35 au niveau 2, ×2,4 au niveau 4',Math.abs(st.R[2].hp/st.R[1].hp-1.35)<.01&&Math.abs(st.R[4].hp/st.R[1].hp-2.4)<.01);
 ok('partie libre inchangée (20 vagues, pas de campagne)',st.libre);
 // ---------- l'attaquant spécial du Feu : l'Incendiaire (V9.3) ----------
 const inc=await G(()=>{const g=__g(),cnt=(el,camp)=>{const s=g.newSim('eau',null,{},'normal');if(camp)g.setCamp(s,el,1);const R=[];for(let w=1;w<=20;w++)R.push(g.genWave(s,w).filter(q=>q.k==='inc').reduce((a,q)=>a+q.count,0));return R;};
   const s=g.setCamp(g.newSim('eau',null,{},'normal'),'feu',1),h=s.hero;s.gold=5000;g.startWave(s);let k=0;while(s.enemies.length<2&&k++<600)g.step(s,.05,{f:0,r:0});
   s.queue.length=0;s.enemies.length=2;const[e,o]=s.enemies;e.k='inc';e.sea=null;e.x=20;e.z=10;e.hp=e.max=500;o.sea=null;o.x=20.5;o.z=10;o.hp=o.max=500;o.k='b';
   g.place(s,'canon',22,12,'eau');const t=s.towers[s.towers.length-1];if(t){t.x=21;t.z=10.5;}h.x=20.4;h.z=10.2;h.y=0;const hp0=h.hp;
   for(let i=0;i<40;i++){e.x=20;e.z=10;o.x=20.5;o.z=10;e.stun=o.stun=1;g.step(s,.05,{f:0,r:0});h.x=20.4;h.z=10.2;h.y=0;}
   const foe=s.zones.filter(z=>z.foe).length,off=t?t.off>0:null,lost=hp0-h.hp,ohp=o.hp;h.y=3;const hp1=h.hp;for(let i=0;i<20;i++){e.x=20;e.z=10;h.x=20.4;h.z=10.2;h.y=3;h.vy=0;g.step(s,.05,{f:0,r:0,fly:1});}
   return{feu:cnt('feu',1),eau:cnt('eau',1),libre:cnt('feu',0),foe,off,lost,ohp,high:hp1-h.hp,name:g.KINDS.inc.n};});
 ok('Incendiaire : seulement dans les niveaux de Feu, dès la vague 2, de plus en plus nombreux ('+inc.feu.slice(0,6).join(' ')+' … '+inc.feu[19]+')',inc.feu[0]===0&&inc.feu[1]===1&&inc.feu[19]===7&&inc.eau.every(n=>n===0)&&inc.libre.every(n=>n===0));
 ok('il laisse des flammes au sol ('+inc.foe+' flaque) : le héros dedans perd '+Math.round(inc.lost)+' PV en 2 s, la défense touchée se tait, l\'ennemi voisin n\'a rien',inc.foe>=1&&inc.lost>8&&inc.off===true&&inc.ohp===500);
 ok('en hauteur (sur un mur) le héros ne brûle pas',inc.high<=0);
 // ---------- les quatre autres attaquants spéciaux (V9.4) ----------
 const sp=await G(()=>{const g=__g(),I={f:0,r:0},mk=(el,k)=>{const s=g.setCamp(g.newSim('feu',null,{},'normal'),el,1);s.gold=9000;g.startWave(s);s.aiT=1e9;let n=0;while(s.enemies.length<3&&n++<900)g.step(s,.05,I);s.queue.length=0;s.enemies.length=3;
     const[e,a,b]=s.enemies;for(const o of s.enemies){o.sea=null;o.k='b';o.hp=o.max=100;o.stun=30;}e.k=k;e.x=20;e.z=10;a.x=23;a.z=10;b.x=32;b.z=10;s.hero.x=60;s.hero.z=60;return{s,e,a,b};},
     run=(s,t)=>{for(let i=0;i<t/.05;i++)g.step(s,.05,I);},tow=(s,x,z)=>{const n=s.towers.length;for(let i=0;i<40&&s.towers.length===n;i++)g.place(s,'canon',22+(i%8)*3,14+Math.floor(i/8)*3,'eau');const t=s.towers[n];t.x=x;t.z=z;return t;},
     who=el=>{const s=g.setCamp(g.newSim('feu',null,{},'normal'),el,1),R={};for(const w of[2,20])for(const q of g.genWave(s,w))if(!['b','tank','air','dig','ste','rng'].includes(q.k))R[q.k+w]=q.count;return R;},R={};
   R.who=['eau','elec','terre','bois'].map(who);
   {const{s,e,a,b}=mk('eau','soi');e.hp=a.hp=b.hp=50;run(s,1.2);R.soi=[e.hp,a.hp,b.hp];}
   {const{s,e}=mk('elec','bro'),t1=tow(s,24,12),t2=tow(s,34,10);run(s,.6);R.bro=[t1.off>0,t2.off>0];}
   {const{s,e}=mk('terre','gol');e.max=200;const g0=s.gold+s.pot;e.hp=0;run(s,.1);R.gol={n:s.enemies.filter(o=>o.k==='ecl').length,hp:(s.enemies.find(o=>o.k==='ecl')||{}).max,gold:s.gold+s.pot>g0,gone:!s.enemies.includes(e)};}
   {const{s,e}=mk('bois','sem');e.max=120;e.hp=0;run(s,.1);const gr=s.enemies.find(o=>o.k==='gra');R.sem={seed:!!gr,at:gr&&[gr.x,gr.z],hp:gr&&gr.max};run(s,2);R.sem.still=gr&&Math.hypot(gr.x-20,gr.z-10)<.1&&s.enemies.includes(gr);const k0=s.kills;run(s,3.3);
     const ns=s.enemies.find(o=>o.k==='sem');R.sem.back=!!ns&&ns.re===1&&ns.hp===120;R.sem.seedGone=!s.enemies.includes(gr)&&s.kills===k0;if(ns){ns.hp=0;run(s,.1);R.sem.once=!s.enemies.some(o=>o.k==='gra');}}
   {const{s,e}=mk('bois','sem');e.hp=0;run(s,.1);const gr=s.enemies.find(o=>o.k==='gra');gr.hp=0;run(s,6);R.sem.killed=!s.enemies.some(o=>o.k==='sem'||o.k==='gra');}
   {const s=g.newSim('feu',null,{},'normal');let none=true;for(let w=1;w<=20;w++)for(const q of g.genWave(s,w))if(g.CAMPT[q.k]||q.k==='gol'||q.k==='sem')none=false;R.libre=none;}return R;});
 ok('un attaquant spécial par type, dès la vague 2 : Soigneur (Eau), Brouilleur (Élec), Golem (Terre, moitié moins nombreux), Semeur (Bois)',sp.who[0].soi2===1&&sp.who[0].soi20===7&&sp.who[1].bro2===1&&sp.who[1].bro20===7&&sp.who[2].gol2===1&&sp.who[2].gol20===4&&sp.who[3].sem2===1&&sp.who[3].sem20===7&&sp.libre);
 ok('Soigneur : le voisin à 3 m reprend 8 % de vie par seconde (50 → '+sp.soi[1]+'), pas celui à 12 m ni lui-même',sp.soi[0]===50&&sp.soi[1]===58&&sp.soi[2]===50);
 ok('Brouilleur : la défense à 4,5 m se tait, celle à 14 m tire toujours',sp.bro[0]===true&&sp.bro[1]===false);
 ok('Golem : en mourant il donne son or et se casse en trois Éclats ('+sp.gol.n+', '+sp.gol.hp+' PV chacun)',sp.gol.n===3&&sp.gol.hp===36&&sp.gol.gold&&sp.gol.gone);
 ok('Semeur : il laisse une Graine immobile ('+sp.sem.hp+' PV) ; au bout de 5 s il repousse entier, une seule fois',sp.sem.seed&&sp.sem.hp===48&&sp.sem.still&&sp.sem.back&&sp.sem.seedGone&&sp.sem.once);
 ok('Semeur : graine détruite à temps, rien ne repousse',sp.sem.killed);
  await G(()=>{const g=__g();for(const e of['eau','terre','elec','bois','']){g.setTheme(e);if(g.getTheme()!==e)throw new Error('thème '+e);}});ok('les cinq décors se posent sans erreur, puis l\'île d\'origine revient (aucun maillage de thème)',await G(()=>__g().getTheme()===''&&__g().themeG.children.length===0));
  console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();process.exit(bad?1:0);})();
