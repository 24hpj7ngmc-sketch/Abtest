// le jeu ouvert seul (comme dans son cadre) : il démarre tout de suite une partie avec ce que le lobby a donné, et prévient le lobby
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let bad=0;
  const ok=(c,t)=>{if(!c){bad++;console.log('RATÉ '+t);}};
  const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,220)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  await p.addInitScript(()=>{window.__msgs=[];window.ILE_LOBBY={heros:'terre',arme:'sniper',bonus:{mods:{terre:{sniper:{hDmg:0.5,pasUnNombre:'x'}}},prep:{mods:{hHp:20},noms:['+20 PV']},or:50}};
    const pm=window.postMessage.bind(window);window.postMessage=(m,o)=>{if(m&&m.ile)window.__msgs.push(m);return pm(m,o);};});
  await p.goto('file://'+path.resolve('construit/test.html'));await p.waitForTimeout(900);
  await p.screenshot({path:'shots/01-jeu.png'});
  const s=await p.evaluate(()=>{const g=__g();return{f:window.__frames,el:g.sim.hero.el,arme:g.getWeap(),wave:g.sim.wave,msgs:window.__msgs.map(m=>m.ile),pret:window.__msgs.find(m=>m.ile==='pret'),mods:g.heroMods('terre'),hp:g.sim.hero.maxHp||g.sim.hero.hpMax};});
  console.log('en jeu: images rendues',s.f,'· héros',s.el,'· arme',s.arme,'· messages',s.msgs.join(','),'· mods',JSON.stringify(s.mods));
  ok(s.f>5,'le jeu ne tourne pas');ok(s.el==='terre','héros donné par le lobby');ok(s.arme==='sniper','arme donnée par le lobby');
  ok(s.pret&&s.pret.partie===1&&s.pret.heros==='terre'&&s.pret.arme==='sniper','message « pret »');
  ok(Math.abs(s.mods.hDmg-(0.5+3.4))<1e-9&&s.mods.pasUnNombre===undefined,'bonus du lobby + base de l\'arme, valeurs non numériques jetées');
  console.log('erreurs',errs.length);
  console.log(errs.join('\n'));await b.close();process.exit(bad?1:0);})();
