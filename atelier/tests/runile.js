// L'Île des Cinq par le lobby (V11.0) : le jeu vit dans son cadre (ile/ile-pour-lobby.js). Le lobby l'ouvre avec ses bonus, paie au message « fin », garde les réglages, reprend au retour.   usage : node tests/runile.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files']});const errs=[];let bad=0;
 const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
 const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,300));});
 await p.addInitScript(()=>{window.__nohv=true;window.__autoPanel=false;});await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);
 const G=(f,a)=>p.evaluate(f,a),fr=()=>p.frames().find(f=>f!==p.mainFrame());
 await G(tl=>{IleDesCinq.troisJs=tl;},'file://'+path.resolve('gfx/three-lite.js'));
 const pret=async()=>{for(let i=0;i<60;i++){if(await G(()=>{const T=__g().getIR();return!!(T&&T.pret);}))return true;await p.waitForTimeout(250);}return false;};
 ok('L\'Île des Cinq est collée dans la page : '+await G(()=>IleDesCinq.version)+', une seule variable',await G(()=>typeof IleDesCinq==='object'&&IleDesCinq.accepte.includes('paie')&&!IleDesCinq.ouvert));
 // ---------- 1. les bonus donnés au jeu sont ceux que la partie intégrée d'avant calculait ----------
 const eq=await G(()=>{const g=__g(),s=g.save;s.hl.feu[g.HT.feu.nodes[0].id]=3;s.hl.feu[g.HT.feu.nodes[4].id]=2;const W=g.WT.sniper;s.wl.sniper[W.nodes[0].id]=2;if(W.gt&&W.gt.ile)s.wl.sniper[W.gt.ile.nodes[0].id]=1;if(W.gt&&W.gt.toit)s.wl.sniper[W.gt.toit.nodes[0].id]=4;
   const en=g.ET.nodes.find(n=>n.b==='feu');s.we[en.id]=2;g.setWeap('sniper');
   const old=g.heroMods('feu'),o=g.ileOpts('feu'),neu=Object.assign({},o.bonus.mods.feu.sniper);for(const k in W.base)neu[k]=(neu[k]||0)+W.base[k];
   const K=new Set(Object.keys(old).concat(Object.keys(neu)));let diff=[];for(const k of K)if(Math.abs((old[k]||0)-(neu[k]||0))>1e-12)diff.push(k);
   return{diff,n:K.size,armes:Object.keys(o.bonus.mods.feu),heros:Object.keys(o.bonus.mods),arme:o.arme};});
 ok('bonus : arbre du héros + cases de l\'arme + élément, puis base de l\'arme = le calcul d\'avant, sur '+eq.n+' réglages (6 héros × 6 armes donnés)',eq.diff.length===0&&eq.armes.length===6&&eq.heros.length===6&&eq.arme==='sniper',eq);
 // ---------- 2. passer le portail ----------
 await G(()=>{const g=__g(),s=g.save;s.prep={aff:10,prov:20};s.boost=1;s.mode='hard';s.stage='';s.fire='auto';g.persist();g.ileGo('feu');});
 ok('le jeu s\'ouvre dans son cadre et dit « prêt »',await pret());
 let o=await fr().evaluate(()=>window.ILE_LOBBY);
 ok('il reçoit héros, arme, mode, préparatifs, bourse, réglages et barème',o.heros==='feu'&&o.arme==='sniper'&&o.mode==='hard'&&o.campagne===null&&o.bonus.prep.mods.hDmg===0.1&&o.bonus.prep.mods.hHp===20&&o.bonus.or>0&&o.reglages.fire==='auto'&&o.gains.or===10&&o.gains.rangs.length===4&&o.encoche&&!o.multi,o&&{h:o.heros,a:o.arme,m:o.mode,p:o.bonus.prep,or:o.bonus.or,r:o.reglages,g:o.gains});
 let s=await G(()=>{const g=__g();return{prep:g.save.prep,boost:g.save.boost,pause:window.__ilePause,ouv:IleDesCinq.ouvert};});await p.waitForTimeout(300);
 ok('une fois « prêt » reçu, les préparatifs et la bourse sont dépensés ; le lobby est en pause',!s.prep.aff&&!s.prep.prov&&!s.boost&&s.ouv&&await G(()=>window.__ilePause)>s.pause);
 await p.screenshot({path:'shots/60-ile-cadre.png'});
 // ---------- 3. fin de partie : la paie est celle de la partie intégrée d'avant (165 or, 285 éclats, record 7 : relevés sur la V11.0) ----------
 const paie=async fin=>{const r=await G(a=>{const g=__g(),s=g.save,snap=JSON.stringify(s),get=()=>({gold:s.gold,sh:s.sh[a.fin.heros],rec:JSON.stringify(s.rec),camp:JSON.stringify(s.camp)});
   const restore=()=>{const o=JSON.parse(snap);for(const k in s)delete s[k];Object.assign(s,o);};
   const c0=get();g.ileFin(a.fin);const c1=get();
   return{neu:{gold:c1.gold-c0.gold,sh:c1.sh-c0.sh,rec:c1.rec}};},{fin});return r;};
 let r=await paie({ile:'fin',victoire:false,mode:'hard',campagne:null,vague:8,vagues:20,passees:7,unites:7,tues:140,boss:1,objectifs:2,butin:[],heros:'feu',arme:'sniper',invite:false});
 ok('défaite en Difficile, vague 8, 1 boss : même paie qu\'avant (+'+r.neu.gold+' or, +'+r.neu.sh+' éclats, record '+r.neu.rec+')',r.neu.gold===165&&r.neu.sh===285&&r.neu.rec==='{"hard":7}',r);
 const g1=await fr().evaluate(()=>document.getElementById('eGain').textContent);
 ok('le jeu affiche ce que le lobby a payé («'+g1.slice(0,70)+'»)',g1.includes('+'+r.neu.gold+' or céleste')&&g1.includes('+'+r.neu.sh+' éclats')&&g1.includes('Gains ×1,5'));
 // victoire en campagne (Eau, niveau 2 ouvert parce que le 1 est fini) : prime de première fois, rang ×1,25, niveau suivant ouvert
 await G(()=>{const g=__g();g.save.camp={eau:1};});
 r=await G(()=>{const g=__g(),s=g.save,g0=s.gold,sh0=s.sh.eau;g.getIR().el='eau';g.ileFin({ile:'fin',victoire:true,mode:'normal',campagne:{el:'eau',l:2},vague:20,vagues:20,passees:20,unites:35,tues:900,boss:4,objectifs:5,butin:[['eau',1],['relique',1],['dragon',1],['feu','x']],heros:'eau',arme:'sniper',invite:false});
   return{camp:s.camp.eau,gold:s.gold-g0,sh:s.sh.eau-sh0,loot:{eau:s.loot.eau||0,rel:s.loot.relique||0,cour:s.loot.couronne||0,et:s.loot.etoile_eau||0,feu:s.loot.feu||0},exp:(()=>{const u=35,k=g.PAYK[1];return Math.round((u*10+4*40+200)*k*g.kHome()/5)*5;})()};});
 ok('campagne Eau 2 gagnée : niveau enregistré, prime +200, gains ×1,25 (+'+r.gold+' or dont 200 de prime), butin tiré (boss d\'Eau, relique, couronne, étoile)',r.camp===2&&r.gold===r.exp+200&&r.sh>0&&r.loot.eau===1&&r.loot.rel===1&&r.loot.cour===1&&r.loot.et===1&&r.loot.feu===0,r);
 // des nombres impossibles : bornés à ce qu'une partie de vingt vagues peut donner
 r=await G(()=>{const g=__g(),s=g.save,g0=s.gold,sh0=s.sh.feu;g.ileFin({ile:'fin',victoire:false,mode:'normal',passees:9999,unites:1e9,tues:1e12,boss:1e6,objectifs:-5,butin:'x',heros:'feu',campagne:{el:'feu',l:77}});
   const max=Math.round((39*10+12*40)*g.kHome()/5)*5;return{gold:s.gold-g0,sh:s.sh.feu-sh0,max,camp:s.camp.feu||0};});
 ok('un message « fin » aux nombres impossibles est borné (+'+r.gold+' or au plus '+r.max+'), campagne inconnue ignorée',r.gold>0&&r.gold<=r.max&&r.camp===0,r);
 // ---------- 4. réglages et arme changés en partie ----------
 await fr().evaluate(()=>{parent.postMessage({ile:'reglages',fire:'btn',aj:true,snd:'pirate',devOpt:{god:false}},'*');parent.postMessage({ile:'arme',arme:'pompe'},'*');parent.postMessage({ile:'arme',arme:'bazooka'},'*');});await p.waitForTimeout(250);
 s=await G(()=>{const g=__g();return{fire:g.save.fire,aj:g.save.aj,w:g.getWeap()};});
 ok('le lobby garde le mode de tir, le saut auto et l\'arme choisis en partie',s.fire==='btn'&&s.aj===true&&s.w==='pompe',s);
 // ---------- 5. retour ----------
 await fr().evaluate(()=>parent.postMessage({ile:'retour'},'*'));await p.waitForTimeout(600);
 s=await G(()=>{const g=__g();return{ouv:IleDesCinq.ouvert,cadre:!!document.getElementById('ileDesCinq'),ir:g.getIR(),on:g.LB.on,d:Math.hypot(g.LB.x-g.LGAMES[0].x,g.LB.z-g.LGAMES[0].z),toast:document.getElementById('toast').textContent,f0:window.__ilePause};});await p.waitForTimeout(500);
 ok('« Retour sur l\'île » : le cadre est retiré, on se réveille devant le premier portail, le lobby reprend («'+s.toast.slice(0,60)+'»)',!s.ouv&&!s.cadre&&s.ir===null&&s.on&&s.d<9&&/De retour/.test(s.toast)&&await G(()=>window.__ilePause)===s.f0,s);
 // ---------- 6. le tuto et la campagne passent par le même chemin ----------
 await G(()=>{const g=__g();g.save.stage='feu1';g.save.mode='normal';g.ileGo('terre');});ok('campagne : le jeu s\'ouvre',await pret());
 o=await fr().evaluate(()=>window.ILE_LOBBY);ok('le niveau choisi au portail est donné au jeu (Feu 1)',o.campagne&&o.campagne.el==='feu'&&o.campagne.l===1&&o.heros==='terre'&&o.arme==='pompe',o.campagne);
 await G(()=>{IleDesCinq.fermer();__g().ileBack();});await G(()=>__g().ileTuto());ok('tuto : le jeu s\'ouvre',await pret());
 o=await fr().evaluate(()=>({t:window.ILE_LOBBY.tuto,b:!document.getElementById('tutoB').hidden}));ok('la partie guidée est demandée, et le jeu l\'affiche',o.t===true&&o.b,o);
 await fr().evaluate(()=>parent.postMessage({ile:'reglages',tuto:true},'*'));await p.waitForTimeout(200);ok('tuto fini : le lobby s\'en souvient',await G(()=>__g().save.tuto===1));
 await G(()=>{IleDesCinq.fermer();__g().ileBack();});
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.join('\n'));await b.close();process.exit(bad?1:0);})();
