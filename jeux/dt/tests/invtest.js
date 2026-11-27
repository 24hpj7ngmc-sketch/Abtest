// mode « Ils s'échappent », invasion des étages : le joueur reste sur le toit ; jours 6 et 9, avec et sans tourelles de couloir
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.A={newRun,step,startDay,SLOTS,NLV};',c);const A=c.A;
const lv={root:1,t_slot:10,mg_dmg:14,mg_rate:7,f_dmg:12,s_hp:6,la_unl:1,la_dmg:10,mo_unl:1,mo_dmg:8,b_mur:1};
for(const day of[6,9])for(const withInt of[false,true]){const layout={0:'mg',1:'mg',2:'la',3:'la',4:'mo',5:'mo',16:'mg',18:'mg',20:'mg',22:'mg'};if(withInt)for(const s of A.SLOTS)if(s.k==='int'&&s.lv<=2)layout[s.id]='mg';
  const save={cash:0,lv,layout,best:0,mode:'out'};const S=A.newRun(save,day,11);S.god=true;A.startDay(S);let maxIn=0,maxRoof=0;const fl=[0,0,0,0,0,0];
  for(let t=0;t<300*30&&S.phase==='day';t++){A.step(S,1/30,{f:0,r:0,yaw:0,pitch:0});S.ev.length=0;
    let n=0,r=0;for(let k=0;k<S.nAct;k++){const i=S.act[k],st=S.z.st[i];if(st===7||st===3&&S.z.lv[i]<A.NLV){n++;if(st===3)fl[S.z.lv[i]]=Math.max(fl[S.z.lv[i]],1);}if(st===3&&S.z.lv[i]===A.NLV)r++;}maxIn=Math.max(maxIn,n);maxRoof=Math.max(maxRoof,r);}
  let left={};for(let k=0;k<S.nAct;k++){const i=S.act[k];const key=S.z.st[i]+'@'+S.z.lv[i];left[key]=(left[key]||0)+1;}
  console.log('jour',day,withInt?'avec 4 tourelles de couloir':'sans tourelle de couloir','· envahisseurs',S.invN,'· max dans l\'immeuble',maxIn,'· max sur le toit',maxRoof,'· étages atteints',fl.join(''),'· tourelles',S.tur.length,'· phase',S.phase,Math.round(S.dayT),'s · restants',JSON.stringify(left));}
