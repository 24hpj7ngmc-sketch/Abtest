// contrôle de l'immeuble : boîtes, sols, grilles de marche (chaque niveau doit être joignable depuis l'escalier)
const fs=require('fs'),vm=require('vm');const c={Math,console,Float32Array,Uint8Array,Int32Array,Int16Array,Uint16Array,Object,JSON,Array,Set};vm.createContext(c);
const t0=Date.now();vm.runInContext(fs.readFileSync(__dirname+'/../regles.js','utf8')+';this.X={BOX,FLOORS,OPEN,ROOMS,WALK,FUP,FDOWN,H,NLV,LVY,NC,STAIRS,cellX,cellZ,nearWalk,SA,SB,floorAt};',c);const X=c.X;
console.log('init ms',Date.now()-t0,'boîtes',X.BOX.length,'sols',X.FLOORS.length,'ouvertures',X.OPEN.length,'pièces',X.ROOMS.length,'H',X.H);
for(let lv=0;lv<=X.NLV;lv++){const w=X.WALK[lv];let n=0,reach=0,rd=0;for(let i=0;i<w.length;i++){n+=w[i];if(X.FUP[lv]&&X.FUP[lv][i]<1e8)reach++;if(X.FDOWN[lv]&&X.FDOWN[lv][i]<1e8)rd++;}console.log('niveau',lv,'cases',n,'joignables montée',reach,'descente',rd);}
const lv=+(process.argv[2]||2),w=X.WALK[lv],F=X.FUP[lv]||X.FDOWN[lv];let out='';for(let j=0;j<X.NC;j++){let l='';for(let i=0;i<X.NC;i++){const k=j*X.NC+i;l+=!w[k]?'#':F[k]>1e8?'?':'.';}out+=l+'\n';}console.log(out);
console.log('sol en (5,-7) niveau 3 :',X.floorAt(5,-7,X.LVY(3)+.4),' escalier A milieu niveau 1 :',X.floorAt(-1,0,X.LVY(1)+3),' balcon nord niveau 2 :',X.floorAt(3.2,-9.8,X.LVY(2)+.4));
