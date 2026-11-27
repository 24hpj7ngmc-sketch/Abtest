// Empreinte des règles : rejoue des parties fixes (même graine, mêmes gestes) et résume l'état à la fin.
// Le nettoyage du code ne doit RIEN changer : l'empreinte doit rester identique, au chiffre près.
// node tests/empreinte.js            → compare à tests/empreinte-ref.json
// node tests/empreinte.js --ref      → (ré)écrit la référence (seulement avant un changement voulu des règles)
const fs=require('fs'),vm=require('vm'),path=require('path');
const RACINE=path.join(__dirname,'..');
const src=fs.existsSync(path.join(RACINE,'regles.js'))?fs.readFileSync(path.join(RACINE,'regles.js'),'utf8'):fs.readFileSync(path.join(RACINE,'immeuble.js'),'utf8')+fs.readFileSync(path.join(RACINE,'sim.js'),'utf8');
function charge(){const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
  vm.runInContext(src+';this.A={newRun,step,startDay,useHeroSkill,useHeroUlt,H,B,LVY,BALV,NODES,derive};',c);return c.A;}
const r4=v=>Math.round(v*1e4)/1e4;
function resume(S){const Z=S.z,o={jour:S.day,phase:S.phase,act:S.nAct,tues:S.kills,fuyards:S.escaped,ville:r4(S.city||0),argent:r4(S.save.cash||0),
    p:[r4(S.p.x),r4(S.p.y),r4(S.p.z),r4(S.p.hp)],tur:(S.tur||[]).map(t=>r4(t.hp||0)).join(','),ult:r4(S.ult||0)};
  let h=2166136261;const mix=v=>{const s=String(r4(v));for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}};
  for(let k=0;k<S.nAct;k++){const i=S.act[k];mix(Z.x[i]);mix(Z.y[i]);mix(Z.z[i]);mix(Z.hp[i]);mix(Z.st[i]);mix(Z.ty[i]);}
  o.zombies=h.toString(16);return o;}
// une partie : graine fixe, le joueur au bord du toit nord tourne lentement et tire sans arrêt ; compétence / ultime de temps en temps
function partie(nom,save,jour,secondes,opts){const A=charge(),S=A.newRun(Object.assign({cash:0,lv:{root:1},layout:{4:'mg',0:'mg'}},save),jour,1234);S.god=true;
  if(opts&&opts.arbre)for(const n of A.NODES)S.save.lv[n.id]=n.max;if(opts&&opts.arbre){S.P=A.derive(S.save.lv);}
  A.startDay(S);const ev={};let t=0,k=0;Object.assign(S.p,{x:2,z:-A.B+1,y:A.H});
  while(t<secondes){const yaw=Math.sin(t*.37)*.9,pitch=-.45-.15*Math.sin(t*.23);S.p.yaw=yaw;S.p.pitch=pitch;
    if(S.hero&&k%90===0){S.hab=0;A.useHeroSkill(S);}if(S.hero&&k%300===150){S.ult=1;A.useHeroUlt(S);}
    A.step(S,1/30,{f:k%200<40?.6:0,r:0,yaw,pitch,fire:true,sprint:false});for(const e of S.ev)ev[e.k]=(ev[e.k]||0)+1;S.ev.length=0;t+=1/30;k++;}
  const o=resume(S);o.evenements=Object.keys(ev).sort().map(k=>k+':'+ev[k]).join(' ');return[nom,o];}
const P=[
  partie('fuite j1 Braise fusil',{mode:'out',hero:'feu'},1,40),
  partie('fuite j4 Roc pompe',{mode:'out',hero:'terre',weap:'pompe'},4,40),
  partie('fuite j6 Sylve lance-flammes',{mode:'out',hero:'bois',weap:'lance'},6,40),
  partie('fuite j7 Volt sniper arbre max',{mode:'out',hero:'elec',weap:'sniper'},7,40,{arbre:1}),
  partie('fuite j9 Ondine assaut',{mode:'out',hero:'eau',weap:'assaut'},9,40),
  partie('arrivent j2',{mode:'in'},2,40),
  partie('arrivent j6 arbre max',{mode:'in'},6,40,{arbre:1}),
];
const now=Object.fromEntries(P),REF=path.join(__dirname,'empreinte-ref.json');
if(process.argv.includes('--ref')){fs.writeFileSync(REF,JSON.stringify(now,null,1));console.log('référence écrite :',Object.keys(now).length,'parties');for(const[k,v]of P)console.log(' ',k,'→',v.tues,'tués,',v.fuyards,'fuyards, zombies',v.zombies);process.exit(0);}
const ref=JSON.parse(fs.readFileSync(REF,'utf8'));let ko=0;
for(const[k,v]of P){const a=JSON.stringify(ref[k]),b=JSON.stringify(v);if(a===b)console.log('OK   '+k);else{ko++;console.log('RATÉ '+k);for(const q of Object.keys(v))if(JSON.stringify(v[q])!==JSON.stringify(ref[k]&&ref[k][q]))console.log('     '+q+' : attendu '+JSON.stringify(ref[k]&&ref[k][q])+' · obtenu '+JSON.stringify(v[q]));}}
console.log((P.length-ko)+' OK, '+ko+' ratés');process.exit(ko?1:0);
