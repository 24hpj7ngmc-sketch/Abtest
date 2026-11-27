// V2.5, interface : barre d'outils avec la Masse, masse tenue devant une cloison, marteau tenu devant une porte (5 planches), arbre, toasts ; captures 966×366
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];let ok=0,ko=0;
  const T=(n,c,x)=>{c?ok++:ko++;console.log((c?'OK  ':'RATÉ')+' '+n+(x!==undefined?' — '+x:''));};
  const ctx=await b.newContext({viewport:{width:966,height:366},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push('ERREUR '+e.message.slice(0,300)));p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load|fonts/.test(m.text()))errs.push('console '+m.text().slice(0,200));});
  const cdp=await ctx.newCDPSession(p);
  const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:7}]});
  const firePt=async()=>{const r=await p.locator('#padMain').boundingBox();return[r.x+r.width*.3,r.y+r.height*.85];};
  const slotTap=async k=>{const r=await p.locator(`#hot .slot[data-k="${k}"]`).boundingBox();await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);};
  const txt=sel=>p.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent:'';},sel);
  const rect=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e||e.hidden||!e.offsetParent&&getComputedStyle(e).position!=='fixed')return null;const r=e.getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom};},sel);
  const inter=(a,c)=>a&&c&&a.l<c.r-1&&c.l<a.r-1&&a.t<c.b-1&&c.t<a.b-1;
  const inView=a=>a&&a.l>=0&&a.t>=0&&a.r<=966&&a.b<=366;
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(900);
  T('titre V4.9',(await p.title())==='Dernier Toit. V4.9',await p.title());
  T('accueil V4.9',(await txt('.ver'))==='V4.9');

  // ---- mode « Ils arrivent » : pas de masse dans la barre
  await p.evaluate(()=>{const s=__dt.save;s.runs=5;s.runsOut=5;s.mode='in';s.lv.w_masse=1;__dt.newGame(1);document.getElementById('big').style.display='none';});
  await p.waitForTimeout(300);
  T('mode « arrivent » : Masse cachée',await p.evaluate(()=>document.querySelector('#hot .slot[data-k="masse"]').hidden));
  // ---- mode « Ils s'échappent », masse pas encore achetée : visible mais verrouillée
  await p.evaluate(()=>{const s=__dt.save;s.mode='out';delete s.lv.w_masse;__dt.newGame(1);});await p.waitForTimeout(300);
  T('mode fuite : Masse visible et verrouillée',await p.evaluate(()=>{const e=document.querySelector('#hot .slot[data-k="masse"]');return !e.hidden&&e.classList.contains('lock');}));
  await slotTap('masse');await p.waitForTimeout(150);
  T('masse verrouillée : pas prise',(await p.evaluate(()=>__dt.ui.tool))==='fusil',await txt('#toast'));
  await p.screenshot({path:'shots/50-barre-masse-verrou.png'});

  // ---- masse débloquée (save.lv), devant une cloison du 1er étage
  await p.evaluate(()=>{const s=__dt.save;Object.assign(s.lv,{s_hp:1,s_arm:1,w_masse:1});s.cash=5000;__dt.newGame(1);const S=__dt.S;S.god=true;
    const o=PANELS.find(o=>o.lv===1&&o.tier==='milieu'&&o.ax==='x'&&o.x0>-6&&o.x1<-3);window.__o=o;Object.assign(S.p,{x:(o.x0+o.x1)/2,z:(o.z0+o.z1)/2+1.1,y:LVY(1),yaw:0,pitch:-.05});S.plv=1;});
  await p.waitForTimeout(300);
  await slotTap('masse');await p.waitForTimeout(400);
  T('Masse prise au toucher',(await p.evaluate(()=>__dt.ui.tool))==='masse');
  T('pavé « Frapper »',(await txt('#bFire b'))==='Frapper',await txt('#bFire b'));
  await p.screenshot({path:'shots/51-masse-cloison.png'});
  {const [x,y]=await firePt();await touch('touchStart',x,y);
    let t=0,shot=false;for(;t<8000;t+=100){await p.waitForTimeout(100);const st=await p.evaluate(()=>({dead:__o.dead,hp:__o.hp,hp0:__o.hp0}));
      if(!shot&&st.hp<st.hp0){shot=true;await p.screenshot({path:'shots/52-masse-coup.png'});}if(st.dead)break;}
    await p.waitForTimeout(250);await p.screenshot({path:'shots/53-masse-casse.png'});await touch('touchEnd');
    const st=await p.evaluate(()=>({dead:__o.dead,wv:__dt.S.wallVer,ui:__dt.ui}));T('masse tenue : la cloison casse',st.dead===1,(t/1000).toFixed(1)+' s, wallVer '+st.wv);
    T('lâché : plus d\'action tenue',!st.ui.firing);}

  // ---- marteau devant une porte du 2e étage : maintenir jusqu'à 5 planches
  const D=await p.evaluate(()=>{const S=__dt.S,D=DOORS.find(d=>d.kind==='piece'&&d.lv===2);const p=S.p;p.y=LVY(2);S.plv=2;p.x=D.cx+(D.ax==='x'?0:1.6);p.z=D.cz+(D.ax==='x'?1.6:0);p.pitch=-.2;p.yaw=Math.atan2(-(D.cx-p.x),-(D.cz-p.z));return{id:D.id,planks:D.planks};});
  await slotTap('marteau');await p.waitForTimeout(500);
  T('marteau : porte visée',(await p.evaluate(()=>__dt.ui.aimDoor))===D.id,await p.evaluate(()=>__dt.ui.aimDoor)+' / '+D.id);
  T('pavé « Barricader 0 / 5 »',(await txt('#bFire b'))==='Barricader'&&(await txt('#bFire small'))==='0 / 5',(await txt('#bFire b'))+' | '+(await txt('#bFire small'))+' | '+(await txt('#aLab')));
  await p.screenshot({path:'shots/54-marteau-porte.png'});
  {const [x,y]=await firePt();await touch('touchStart',x,y);await p.waitForTimeout(1300);await p.screenshot({path:'shots/55-marteau-cloue.png'});
    let n=0;for(let t=0;t<6000;t+=100){await p.waitForTimeout(100);n=await p.evaluate(id=>DOORS[id].planks,D.id);if(n>=5)break;}
    await p.waitForTimeout(300);await touch('touchEnd');T('marteau tenu : 5 planches',n===5,n);}
  await p.waitForTimeout(200);
  T('pavé « Complet »',(await txt('#bFire small'))==='Complet',await txt('#bFire small'));
  await p.screenshot({path:'shots/56-porte-complete.png'});
  // pas de chevauchement en bas de l'écran
  {const hot=await rect('#hot'),lab=await rect('#aLab'),sub=await rect('#sub'),joy=await rect('#joy'),fr=await rect('#bFree'),pm=await rect('#padMain');
    T('barre, étiquette, pavé dans l\'écran',[hot,lab,pm,joy].every(inView),JSON.stringify({hot,lab}));
    T('barre et étiquette ne se chevauchent pas',!inter(hot,lab)&&!inter(sub,lab)&&!inter(hot,joy)&&!inter(lab,pm),'barre '+Math.round(hot.l)+'…'+Math.round(hot.r)+', étiquette '+(lab?Math.round(lab.l)+'…'+Math.round(lab.r):'—'));}
  // un emplacement de tourelle visé garde la priorité
  await p.evaluate(()=>{const S=__dt.S,s=SLOTS.find(s=>s.k==='int'&&s.lv===2);Object.assign(S.p,{x:s.x+2.2,z:s.z,y:LVY(2)});S.p.yaw=Math.atan2(-(s.x-S.p.x),-(s.z-S.p.z));S.p.pitch=-.45;});
  await p.waitForTimeout(400);T('emplacement de tourelle prioritaire',await p.evaluate(()=>__dt.ui.aimSlot>=0&&__dt.ui.aimDoor<0),JSON.stringify(await p.evaluate(()=>__dt.ui))+' '+(await txt('#bFire b')));
  {const hot=await rect('#hot'),lab=await rect('#aLab');T('étiquette d\'emplacement (longue) sans chevauchement',!inter(hot,lab)&&inView(lab),await txt('#aLab'));}
  await p.screenshot({path:'shots/57-marteau-emplacement.png'});

  // ---- toasts : première planche arrachée, astuce du jour 6
  await p.evaluate(()=>{const S=__dt.S;S.ev.push({k:'tear',door:0,n:4,x:S.p.x,y:S.p.y+1,z:S.p.z});});await p.waitForTimeout(150);
  T('toast « Ils arrachent tes planches ! »',(await txt('#toast'))==='Ils arrachent tes planches !',await txt('#toast'));
  await p.evaluate(()=>{const S=__dt.S;S.ev.push({k:'tear',door:0,n:3,x:S.p.x,y:S.p.y+1,z:S.p.z});document.getElementById('toast').textContent='';});await p.waitForTimeout(150);
  T('… une seule fois par partie',(await txt('#toast'))==='');
  await p.evaluate(()=>{__dt.newGame(6);});for(let k=0;k<40&&!(await txt('#toast'));k++)await p.waitForTimeout(150);
  T('astuce au jour 6',(await txt('#toast'))==='Marteau sur une porte : maintiens pour barricader',await txt('#toast'));
  await p.screenshot({path:'shots/58-astuce-jour6.png'});

  // ---- l'arbre : les nouveaux nœuds
  await p.evaluate(()=>{const s=__dt.save;s.cash=5000;s.lv.w_masse_pw=1;__dt.openTree('run');__dt.treeSel('w_masse_pw');});await p.waitForTimeout(400);
  const nodes=await p.evaluate(()=>['w_masse','w_masse_pw','w_masse_sp'].map(id=>{const e=document.querySelector(`.tn[data-id="${id}"]`);if(!e)return null;const r=e.getBoundingClientRect();return{id,l:r.left,t:r.top,r:r.right,b:r.bottom,txt:e.textContent};}));
  const leg=await rect('#tLeg'),info=await rect('#tInfo'),top=await rect('#tTop'),close=await rect('#tClose');
  const grow=(a,m)=>({l:a.l-m,t:a.t-m,r:a.r+m,b:a.b+m});   // 6 px : le contour de sélection
  for(const n of nodes)T('nœud '+(n&&n.id)+' à l\'écran, rien dessus',n&&inView(n)&&!inter(grow(n,6),leg)&&!inter(n,info)&&!inter(n,top)&&!inter(n,close),n&&(Math.round(n.l)+','+Math.round(n.t)+' '+n.txt+' · légende jusqu\'à '+Math.round(leg.r)));
  T('valeur Masse lourde',/dégâts/.test(await txt('#tInfo .fx')),await txt('#tInfo .fx'));
  await p.screenshot({path:'shots/59-arbre-masse.png'});
  await p.evaluate(()=>__dt.treeSel('w_masse_sp'));await p.waitForTimeout(200);T('valeur Élan',/s par coup/.test(await txt('#tInfo .fx')),await txt('#tInfo .fx'));
  await p.screenshot({path:'shots/60-arbre-elan.png'});
  await p.evaluate(()=>__dt.treeSel('w_masse'));await p.waitForTimeout(200);T('valeur Masse',(await txt('#tInfo .fx'))==='débloquée',await txt('#tInfo .fx'));
  console.log(ok+' OK, '+ko+' ratés');console.log('erreurs',errs.length);console.log(errs.slice(0,8).join('\n'));await b.close();})();
