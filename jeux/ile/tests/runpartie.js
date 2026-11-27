// La partie vue du lobby : ce qu'elle reçoit (window.ILE_LOBBY), ce qu'elle renvoie (pret, fin, reglages, arme, retour) et ce qu'elle affiche de la paie.   usage : node tests/runpartie.js
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
 const ok=(n,c)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n);};
 const ouvre=async lobby=>{const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.addInitScript(o=>{window.ILE_LOBBY=o;window.__msgs=[];const pm=window.postMessage.bind(window);window.postMessage=(m,q)=>{if(m&&m.ile)window.__msgs.push(m);return pm(m,q);};},lobby);
  await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(700);return p;};
 const msgs=(p,k)=>p.evaluate(k=>window.__msgs.filter(m=>m.ile===k),k);
 const tap=async(p,s)=>{await p.locator(s).tap({timeout:4000});await p.waitForTimeout(350);};
 // ---------- 1. une partie difficile, avec bonus du lobby, perdue à la vague 4 ----------
 let p=await ouvre({heros:'eau',arme:'assaut',mode:'hard',bonus:{mods:{eau:{assaut:{hDmg:0.3,hHp:15}}},prep:{mods:{hDmg:0.1,hHp:20},noms:['+10 % de dégâts','+20 PV']},or:80},reglages:{snd:false,fire:'auto',aj:true}});
 let s=await p.evaluate(()=>{const g=__g(),s=g.sim;return{mode:s.mode,el:s.hero.el,gold:s.gold,aj:g.save.aj,snd:g.save.snd,dmg:s.m.hDmg,camp:s.camp||null,run:!document.getElementById('end').hidden};});
 let pr=(await msgs(p,'pret'))[0];
 ok('la partie démarre seule, avec le héros, l\'arme et le mode du lobby ('+s.el+', '+(pr&&pr.arme)+', '+s.mode+')',s.el==='eau'&&s.mode==='hard'&&pr&&pr.arme==='assaut'&&pr.mode==='hard'&&pr.partie===1&&!s.run);
 ok('les réglages du lobby sont repris (saut auto, son coupé)',s.aj===true&&s.snd===false);
 const base=await p.evaluate(()=>{const g=__g();return g.WT.assaut.base.hDmg;});
 ok('bonus : arbre du lobby + base de l\'arme + préparation ('+(+s.dmg).toFixed(2)+')',Math.abs(s.dmg-(0.3+base+0.1))<1e-9);
 ok('message « pret » : il dit la bourse reçue ('+(pr&&pr.or)+')',pr&&pr.or===80);
 await p.evaluate(()=>{const s=__g().sim;s.wave=4;s.kills=37;s.bossKills=1;s.core=0;});await p.waitForTimeout(500);
 let fin=(await msgs(p,'fin'))[0];
 ok('message « fin » : défaite à la vague 4, 3 vagues passées, '+(fin&&fin.unites)+' unités, 37 tués, 1 boss',fin&&fin.victoire===false&&fin.raison==='coeur'&&fin.vague===4&&fin.passees===3&&fin.unites>0&&fin.tues===37&&fin.boss===1&&fin.mode==='hard'&&fin.campagne===null&&fin.heros==='eau'&&fin.arme==='assaut'&&fin.partie===1&&fin.invite===false&&Array.isArray(fin.butin));
 ok('l\'écran de fin est affiché, sans gain tant que le lobby n\'a rien dit',await p.evaluate(()=>!document.getElementById('end').hidden&&document.getElementById('eGain').textContent===''));
 await p.evaluate(()=>window.postMessage({ile:'paie',lignes:[{t:'+30 or céleste',fort:true},{t:'<img src=x onerror=window.__pirate=1> +60 éclats'},{t:42},null]},'*'));await p.waitForTimeout(200);
 const g=await p.evaluate(()=>({t:document.getElementById('eGain').textContent,n:document.querySelectorAll('#eGain img').length,pir:window.__pirate||0}));
 ok('la paie du lobby s\'affiche, en texte seulement («'+g.t.slice(0,60)+'»)',g.t.includes('+30 or céleste')&&g.t.includes('+60 éclats')&&g.n===0&&!g.pir);
 await p.screenshot({path:'shots/40-fin.png'});
 await tap(p,'#eReplay');pr=(await msgs(p,'pret'))[1];
 s=await p.evaluate(()=>({gold:__g().sim.gold,dmg:__g().sim.m.hDmg,end:document.getElementById('end').hidden}));
 ok('« Rejouer » : une deuxième partie, sans la bourse ni la préparation (déjà dépensées)',pr&&pr.partie===2&&pr.or===0&&Math.abs(s.dmg-(0.3+base))<1e-9&&s.end);
 // l'arme changée en partie est dite au lobby
 await p.evaluate(()=>__g().gameWeap('sniper'));const ar=(await msgs(p,'arme')).pop();ok('changer d\'arme en partie prévient le lobby',ar&&ar.arme==='sniper');
 // abandon : retour sans « fin »
 await tap(p,'#mini');await tap(p,'#mapOpt [data-a=quit]');await tap(p,'#mapOpt [data-a=quit]');
 ok('abandon par la carte : « retour » sans nouvelle « fin »',(await msgs(p,'retour')).length===1&&(await msgs(p,'fin')).length===1);
 await p.context().close();
 // ---------- 2. un niveau de campagne gagné ----------
 p=await ouvre({heros:'terre',campagne:{el:'feu',l:3},dev:true});
 s=await p.evaluate(()=>{const s=__g().sim;return{camp:s.camp&&{el:s.camp.el,l:s.camp.l},maxW:s.maxW,dev:__g().save.dev};});
 ok('campagne : le niveau donné par le lobby est joué (Feu, rang 3)',s.camp&&s.camp.el==='feu'&&s.camp.l===3&&s.dev===true);
 await p.evaluate(()=>{const s=__g().sim;s.wave=s.maxW;s.over='win';});await p.waitForTimeout(500);
 fin=(await msgs(p,'fin'))[0];
 ok('« fin » : victoire, campagne Feu 3, toutes les vagues passées, partie de développeur signalée',fin&&fin.victoire===true&&fin.raison==='victoire'&&fin.campagne&&fin.campagne.el==='feu'&&fin.campagne.l===3&&fin.passees===fin.vagues&&fin.dev===true);
 await tap(p,'#eAgain');ok('« Retour sur l\'île » : message « retour »',(await msgs(p,'retour')).length===1);
 await p.context().close();
 // ---------- 3. des options abîmées ne cassent rien ----------
 p=await ouvre({heros:'dragon',arme:42,mode:{},campagne:{el:'feu',l:99},bonus:'x',reglages:[1],gains:null,multi:0});
 s=await p.evaluate(()=>{const g=__g();return{el:g.sim.hero.el,w:g.getWeap(),mode:g.sim.mode,camp:g.sim.camp||null,f:window.__frames};});
 ok('options abîmées : la partie démarre quand même ('+s.el+', '+s.w+', '+s.mode+')',s.f>3&&s.el==='feu'&&s.mode==='normal'&&!s.camp&&typeof s.w==='string');
 await p.context().close();
 console.log('ratés',bad,'· erreurs',errs.length);console.log(errs.join('\n'));await b.close();process.exit(bad?1:0);})();
