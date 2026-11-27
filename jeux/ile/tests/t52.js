//<SIM>
const ELS=['feu','eau','bois','terre','elec'];
const EL={feu:{n:'Feu',c:'#ff6a3d',hero:'Braise'},eau:{n:'Eau',c:'#3fa9ff',hero:'Ondine'},
  bois:{n:'Bois',c:'#5fd068',hero:'Sylve'},terre:{n:'Terre',c:'#cf9a5c',hero:'Roc'},
  elec:{n:'Élec',c:'#ffd93b',hero:'Volt'}};
const BEATS={eau:'feu',feu:'bois',bois:'terre',terre:'elec',elec:'eau'};
const WEAKTO={};for(const k in BEATS)WEAKTO[BEATS[k]]=k;
function mult(a,d,boss,st){if(BEATS[a]===d)return st||2;if(a===d||BEATS[d]===a)return boss?0.25:0.5;return 1;}
const R_ISLE=120,PATH_HALF=2.1;
// ÉQUILIBRAGE : tous les chiffres qui règlent la difficulté sont ici
const BAL={waves:10,core:20,             // nombre de vagues, vie du cœur
  wall:12,wallMax:120,wallLine:24,wallTop:3,wallRange:2, // mur : prix par bloc, nombre de cases maximum, longueur maximale d'une ligne, hauteur maximale en blocs, portée gagnée par étage pour une défense posée dessus
  dig:8,pitTop:2,pitMax:120,pitSlow:.3,pitCost:1.5, // fosse : prix par bloc creusé, profondeur maximale, nombre de cases maximum, ralentissement par niveau de profondeur, surcoût de passage pour les ennemis
  climbSp:3.2,climbWait:.2,            // escalade : vitesse de montée, temps à pousser contre l'obstacle avant de s'y agripper
  heroHp:100,regen:6,regenWait:5,respawn:8,reviveT:3,hDmgG:.03, // héros : vie, soin par seconde après regenWait s sans coup, délai de retour, temps pour être relevé, hausse des dégâts ennemis par vague
  smashCd:6,smashR:7,smashT:2,         // tank : toutes les smashCd s, il met hors service smashT s la défense la plus proche à moins de smashR m
  objP:.6,zoneR:6,zoneNeed:15,zoneTime:50,relicTime:70,bombHp:5,bombLeak:5, // objectifs : chance par vague, zone (rayon, secondes à tenir, délai), délai de la relique, porteur de bombe (vie ×, dégâts au cœur)
  rocHp:50,rocArmor:.7,rempartT:15,rempartCd:18,rempartH:2,quakeR:12,quakeDmg:60,quakeT:2.5, // Roc : vie en plus, part des dégâts au contact qu'il subit, durée, recharge et hauteur en blocs du Rempart, Séisme (rayon, dégâts, étourdissement)
  gun:3.6,markT:4,markK:.6,           // fusil : dégâts d'une balle, durée de la marque posée sur la cible, bonus de dégâts des défenses sur une cible marquée
  ultTick:.8,ultHit:.7,ultHurt:.8,     // charge de l'ultime sur 100 : par seconde de vague, par tir qui touche, par point de vie perdu
  voltHp:-15,voltSprint:1.3,dashCd:8,dashLen:14,dashDmg:40,stormT:6,stormR:16,stormDmg:28, // Volt : vie en moins, sprint ×, Éclair (recharge, longueur, dégâts), Orage (durée, rayon, dégâts par éclair)
  sylveSee:20,ronceCd:12,ronceR:5,ronceT:8,ronceDmg:14,guardT:15, // Sylve : distance à laquelle elle révèle les furtifs, Ronces (recharge, rayon, durée, dégâts par seconde), durée des Gardiens
  fbCd:9,fbR:6,fbDmg:55,fbZoneT:4,metN:8,metR:5,metDmg:70,braiseSplash:.4, // Braise : Brasier (recharge, rayon, dégâts, durée des flammes au sol), Météores (nombre, rayon, dégâts), part des dégâts de tir qui éclabousse autour
  ondWait:2.5,ondRegen:10,tideCd:11,tideR:10,tideHeal:35,tideDmg:25,tideKnock:5,floodT:8,floodDps:6,floodCore:3, // Ondine : soin naturel (délai, par seconde), Marée (recharge, rayon, soin, dégâts, recul), Déluge (durée, dégâts par seconde, points rendus au cœur)
  grass:5,fmK:.88,                     // marcher hors route coûte 5 fois plus (les ennemis préfèrent la route) ; fmK compense les virages coupés
  cnt0:6,cntG:3,gap:.85,gapG:0,        // ennemis par vague (base + par vague), écart entre deux sorties et sa baisse par vague
  goldK:1,ptsW:2,                      // or par ennemi (multiplicateur), points de grille par vague
  hp0:26,hpG:.36,bossHp:900,bossT:[1,1.8,2.5], // vie d'un ennemi de base vague 1, hausse par vague, vie du boss vague 5
  multi:.6,                            // vie des ennemis en plus par joueur supplémentaire (+60 %)
  esc:.08,                             // chaque défense déjà posée renchérit la suivante de 8 %
  upG:.35,                             // hausse du coût des améliorations après la 3e
  dup:.3,                              // bonus de dégâts par niveau supplémentaire d'un même élément
  armor0:2,armorG:.4,                  // blindage du tank : base + par vague
  pot0:100,potWave:30,potWaveG:5}; // mode normal : pot commun des défenses au départ, puis versé à chaque vague (base + par vague)
// mode normal : un niveau long, 35 vagues bien plus fournies. Ce qui n'est pas listé ici reprend les valeurs du dessus.
const BALN=Object.assign({},BAL,{waves:35,core:40,cnt0:12,cntG:4,gapG:.013,goldK:.45,ptsW:1,hpG:.36,bossHp:1400,armorG:.2,pot0:140,potWave:55,potWaveG:7});
const bal=s=>s.mode==='normal'?BALN:BAL;
// trois défenses : zone / grosse cible / tir rapide
const TYPES={mortier:{n:'Mortier',s:'Mortier',costs:[50,80,120],dmg:10,cd:1.5,range:15,rk:2,splash:3.6,fly:.7,h:1.75,d:'Dégâts de zone, tir lent.'},
  canon:{n:'Canon',s:'Canon',costs:[70,100,150],dmg:34,cd:1.8,range:12,rk:1.5,splash:0,fly:.22,h:1.6,d:'Gros dégâts sur l\'ennemi le plus solide, portée courte.'},
  archer:{n:'Tour d\'archer',s:'Archer',costs:[45,70,100],dmg:3.4,cd:.45,range:19,rk:2,splash:0,fly:.3,h:4.9,d:'Tir rapide à longue portée, une cible à la fois.'}};
const TKEYS=['mortier','canon','archer'];
const TK={mortier:'m',canon:'c',archer:'a'};
// bonus des deux grilles (héros + partie), tous à zéro par défaut
const M0={kDur:0,kWide:0,kLen:0,kTrail:0,kHeal:0,uRad:0,uDur:0,uExtra:0,uCharge:0,pA:0, // bonus des arbres de héros : compétence (k…), ultime (u…), passif (pA) ; leur sens dépend du héros
  hHp:0,mRad:0,mDmg:0,mCd:0,mRange:0,mMulti:0,cDmg:0,cCd:0,cRange:0,cRico:0,cDouble:0,aDmg:0,aCd:0,aRange:0,aMulti:0,strong:0,spec:0,fxDur:0,
  coreHp:0,goldKill:0,waveBonus:0,hDmg:0,hCd:0,hLife:0,hPierce:0,hSpd:0,hSprint:0,hJump:0,abCd:0,abRad:0,abDmg:0};
// une défense porte jusqu'à 3 éléments, chacun jusqu'au niveau 3 (9 améliorations). La portée ne grandit que sur les 3 premières.
const MAXEL=3,MAXLV=3,stackH=L=>Math.min(L,3)*.75;
function costOf(type,lv){const c=TYPES[type].costs;return lv<3?c[lv]:Math.round(c[2]*(1+BAL.upG*(lv-2))/5)*5;}
function placeCost(s,type){return Math.round(TYPES[type].costs[0]*(1+bal(s).esc*s.towers.reduce((n,t)=>n+(t.tmpT===undefined?1:0),0))/5)*5;}
function enemyHp(B,n,k,boss,pl){return(boss?B.bossHp*(n/5):B.hp0*(1+B.hpG*(n-1))*(KINDS[k]||KINDS.b).hp)*(1+B.multi*((pl||1)-1));}
function rangeOf(type,lv,m){const T=TYPES[type];return T.range+T.rk*Math.min(lv,3)+(m?m[TK[type]+'Range']:0);}
const PATHS=[
  {name:'Nord',pts:[[0,-112],[-22,-84],[14,-56],[-6,-36],[16,-20],[0,0]]},
  {name:'Est',pts:[[106,38],[76,10],[52,22],[40,-6],[16,-20],[0,0]]},
  {name:'Ouest',pts:[[-102,44],[-72,62],[-48,28],[-58,6],[-24,16],[0,0]]}];
for(const p of PATHS){p.seg=[];p.len=0;for(let i=0;i<p.pts.length-1;i++){const a=p.pts[i],b=p.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
  p.seg.push({a,b,l,dx:(b[0]-a[0])/l,dz:(b[1]-a[1])/l,s:p.len});p.len+=l;}}
function posAt(p,d){d=Math.max(0,Math.min(p.len-1e-4,d));for(const g of p.seg){if(d<=g.s+g.l){const u=d-g.s;return[g.a[0]+g.dx*u,g.a[1]+g.dz*u,g.dx,g.dz];}}
  const g=p.seg[p.seg.length-1];return[g.b[0],g.b[1],g.dx,g.dz];}
function distSeg(x,z,a,b){const vx=b[0]-a[0],vz=b[1]-a[1];let t=((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz);t=Math.max(0,Math.min(1,t));
  return Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t);}
function distPaths(x,z){let m=1e9;for(const p of PATHS)for(const g of p.seg)m=Math.min(m,distSeg(x,z,g.a,g.b));return m;}

// ---- terrain : une grille de cases de 4 m. Les ennemis au sol suivent le chemin le moins coûteux vers le cœur ;
// la route coûte 1, l'herbe BAL.grass, un mur est infranchissable. Sans mur, ils restent donc sur la route.
const CELL=4,GN=64,GH=GN*CELL/2,NB=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const cellOf=(x,z)=>Math.max(0,Math.min(GN-1,Math.floor((x+GH)/CELL)))+GN*Math.max(0,Math.min(GN-1,Math.floor((z+GH)/CELL)));
const cellX=i=>(i%GN)*CELL-GH+CELL/2,cellZ=i=>Math.floor(i/GN)*CELL-GH+CELL/2;
const WALK=new Uint8Array(GN*GN),COST=new Float32Array(GN*GN);
for(let i=0;i<GN*GN;i++){const x=cellX(i),z=cellZ(i);WALK[i]=Math.hypot(x,z)<=R_ISLE-4?1:0;COST[i]=distPaths(x,z)<=PATH_HALF+1?1:BAL.grass;}
function fieldOf(W,P){const D=new Float32Array(GN*GN).fill(1e9),q=[];for(let i=0;i<GN*GN;i++)if(Math.hypot(cellX(i),cellZ(i))<4){D[i]=0;q.push(i);}
  for(let qi=0;qi<q.length;qi++){const i=q[qi],cx=i%GN,cz=(i/GN)|0,d=D[i];
    for(let k=0;k<8;k++){const nx=cx+NB[k][0],nz=cz+NB[k][1];if(nx<0||nz<0||nx>=GN||nz>=GN)continue;const j=nx+nz*GN;if(!WALK[j]||W[j])continue;
      if(k>=4){const a=nx+cz*GN,b=cx+nz*GN;if(!WALK[a]||W[a]||!WALK[b]||W[b])continue;} // pas de passage en diagonale entre deux murs
      const nd=d+CELL*(k>=4?1.414:1)*(COST[i]*(P?1+BAL.pitCost*P[i]:1)+COST[j]*(P?1+BAL.pitCost*P[j]:1))/2;if(nd<D[j]-1e-4){D[j]=nd;q.push(j);}}}
  return D;}
// collines : des plateaux naturels de 1 à 3 blocs, les mêmes pour tous les joueurs. Elles suivent les règles d'un mur (on saute sur 1 bloc, on grimpe 2,
// une défense posée dessus voit plus loin, les ennemis au sol les contournent) mais on ne peut ni les creuser ni les rehausser.
const HILL=new Uint8Array(GN*GN);(function(){let sd=4242,n=0;const r=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const used={};for(let k=0;k<900&&n<10;k++){const sec=k%10,a=(sec+r())*.6283,d=34+r()*64,cx=Math.cos(a)*d,cz=Math.sin(a)*d,R=7+r()*8,top=R>11?3:2;if(used[sec]||distPaths(cx,cz)<R*.6+8)continue;
    let bad=false;for(const p of PATHS)if(Math.hypot(cx-p.pts[0][0],cz-p.pts[0][1])<R+16)bad=true;if(bad)continue;
    for(let i=0;i<GN*GN;i++){if(!WALK[i])continue;const x=cellX(i),z=cellZ(i),q=Math.hypot(x-cx,z-cz)/R+.16*Math.sin(x*.9+cz)*Math.cos(z*.7+cx);
      if(q>1||distPaths(x,z)<7.5||Math.hypot(x,z)>R_ISLE-12||Math.hypot(x,z)<18)continue;HILL[i]=Math.max(HILL[i],q<.36&&top>2?3:q<.66?2:1);}used[sec]=1;n++;}})();
const FIELD0=fieldOf(HILL),fmOf=k=>k!=='air'&&k!=='dig'; // les aériens et les foreurs ignorent les murs : ils gardent le tracé d'origine
function refield(s){s.field=fieldOf(s.wallSet,s.pit);s.fv++;}
// Un mur est un bloc plein de WALLH de haut : il arrête les ennemis au sol et le héros, on peut sauter dessus, marcher dessus et y poser une défense.
const WALLH=1.6; // hauteur d'un bloc ; s.wallSet[case] = nombre de blocs empilés (0 = pas de mur)
// s.pit[case] = profondeur creusée (0 = pas de fosse). Le sol sous les pieds du héros est le point le plus haut qu'il touche.
const topAt=(s,x,z)=>{const a=cellOf(x+.4,z+.4),b=cellOf(x-.4,z+.4),c=cellOf(x+.4,z-.4),d=cellOf(x-.4,z-.4);return WALLH*Math.max(s.wallSet[a]-s.pit[a],s.wallSet[b]-s.pit[b],s.wallSet[c]-s.pit[c],s.wallSet[d]-s.pit[d]);};
// cases traversées par la ligne A → B, reliées par leurs côtés (pas de trou en diagonale)
function lineCells(a,b){let x=a%GN,z=(a/GN)|0;const x1=b%GN,z1=(b/GN)|0,sx=x<x1?1:-1,sz=z<z1?1:-1,dx=2*Math.abs(x1-x),dz=2*Math.abs(z1-z),out=[a];let err=(dx-dz)/2;
  for(let n=(dx+dz)/2;n>0;n--){if(err>0||(err===0&&dx>=dz)){x+=sx;err-=dz;}else{z+=sz;err+=dx;}out.push(x+z*GN);}return out;}
function cellWhy(s,i){const cx=cellX(i),cz=cellZ(i);if(!WALK[i])return'Hors de l\'île';if(Math.hypot(cx,cz)<9)return'Trop près du cœur';
  for(const p of PATHS)if(Math.hypot(cx-p.pts[0][0],cz-p.pts[0][1])<10)return'Trop près d\'un portail';
  for(const t of s.towers)if(!t.wy&&Math.abs(t.x-cx)<3.6&&Math.abs(t.z-cz)<3.6)return'Trop près d\'une défense';
  for(const e of s.enemies)if(e.fm&&cellOf(e.x,e.z)===i)return'Un ennemi est dessus';return'';}
// vérifie une ligne de murs de A à B : renvoie la raison du refus (vide si c'est bon), les cases à construire et le prix
// vérifie une ligne de A à B : un bloc de plus sur chaque case (nouvelle case, étage supplémentaire, ou fosse qu'on rebouche d'un niveau)
function checkWalls(s,x0,z0,x1,z1){const all=lineCells(cellOf(x0,z0),cellOf(x1,z1)),cells=all.filter(i=>s.wallSet[i]<BAL.wallTop),fresh=cells.filter(i=>!s.wallSet[i]&&!s.pit[i]),
    r={why:'',all:(cells.length?cells:all).slice(0,BAL.wallLine),cells,cost:cells.length*BAL.wall};
  if(all.length>BAL.wallLine){r.why='Ligne trop longue';return r;}
  if(!cells.length){r.why='Hauteur maximale';return r;}
  for(const i of cells){const w=HILL[i]?'Colline : pas de mur ici':s.tmpSet[i]?'Rempart en place':s.wallSet[i]?(s.towers.some(t=>t.wy&&cellOf(t.x,t.z)===i)?'Une défense est dessus':''):s.pit[i]?'':cellWhy(s,i);if(w){r.why=w;return r;}}
  if(s.walls.length+fresh.length>BAL.wallMax){r.why='Maximum de murs atteint';return r;}
  if(fresh.length){for(const i of fresh)s.wallSet[i]=1;const D=fieldOf(s.wallSet,s.pit);for(const i of fresh)s.wallSet[i]=0; // un mur ne peut jamais fermer complètement le passage
    for(const p of PATHS)if(D[cellOf(p.pts[0][0],p.pts[0][1])]>=1e8){r.why='Bloquerait le passage';return r;}
    for(const e of s.enemies)if(e.fm&&D[cellOf(e.x,e.z)]>=1e8){r.why='Enfermerait des ennemis';return r;}}
  return r;}
function addWalls(s,x0,z0,x1,z1){const c=checkWalls(s,x0,z0,x1,z1);if(c.why||s.gold<c.cost)return false;s.gold-=c.cost;
  for(const i of c.cells){if(s.pit[i]){if(--s.pit[i]<=0)s.pits.splice(s.pits.indexOf(i),1);}else{if(!s.wallSet[i])s.walls.push(i);s.wallSet[i]++;}}refield(s);return true;}
// creuser = l'inverse : un bloc de moins sur chaque case. Sur un mur, on retire l'étage du dessus (remboursé à moitié) ; au sol, on creuse une fosse.
// Une fosse ne bloque pas : les ennemis au sol la traversent au ralenti, et le héros doit sauter pour en sortir.
function digWhy(s,i){const cx=cellX(i),cz=cellZ(i),d=Math.hypot(cx,cz);if(!WALK[i]||d>R_ISLE-10)return'Trop près du bord';if(d<9)return'Trop près du cœur';
  for(const p of PATHS)if(Math.hypot(cx-p.pts[0][0],cz-p.pts[0][1])<10)return'Trop près d\'un portail';
  for(const t of s.towers)if(Math.abs(t.x-cx)<3.6&&Math.abs(t.z-cz)<3.6)return'Trop près d\'une défense';return'';}
function checkDig(s,x0,z0,x1,z1){const all=lineCells(cellOf(x0,z0),cellOf(x1,z1)),cells=all.filter(i=>s.wallSet[i]||s.pit[i]<BAL.pitTop),r={why:'',all:(cells.length?cells:all).slice(0,BAL.wallLine),cells,cost:0};
  if(all.length>BAL.wallLine){r.why='Ligne trop longue';return r;}
  if(!cells.length){r.why='Profondeur maximale';return r;}
  let nw=0;for(const i of cells){if(HILL[i]){r.why='Colline : on ne creuse pas ici';return r;}if(s.tmpSet[i]){r.why='Rempart en place';return r;}if(s.wallSet[i]){if(s.towers.some(t=>t.wy&&cellOf(t.x,t.z)===i)){r.why='Une défense est dessus';return r;}r.cost-=Math.floor(BAL.wall/2);}
    else{const w=digWhy(s,i);if(w){r.why=w;return r;}r.cost+=BAL.dig;if(!s.pit[i])nw++;}}
  if(s.pits.length+nw>BAL.pitMax)r.why='Maximum de fosses atteint';return r;}
function dig(s,x0,z0,x1,z1){const c=checkDig(s,x0,z0,x1,z1);if(c.why||s.gold<c.cost)return false;s.gold-=c.cost;
  for(const i of c.cells){if(s.wallSet[i]){if(--s.wallSet[i]<=0)s.walls.splice(s.walls.indexOf(i),1);}else{if(!s.pit[i])s.pits.push(i);s.pit[i]++;}}refield(s);return true;}
// avance un ennemi au sol de mv mètres, de case en case, vers la case voisine la plus proche du cœur
function fieldMove(s,e,mv){const D=s.field;for(let guard=0;mv>1e-4&&guard<4;guard++){
    if(e.tc==null||e.fv!==s.fv){const i=cellOf(e.x,e.z),cx=i%GN,cz=(i/GN)|0;let best=-1,bd=D[i];e.fv=s.fv;
      for(let k=0;k<8;k++){const nx=cx+NB[k][0],nz=cz+NB[k][1];if(nx<0||nz<0||nx>=GN||nz>=GN)continue;const j=nx+nz*GN;if(D[j]>=1e8)continue;
        if(k>=4&&(D[nx+cz*GN]>=1e8||D[cx+nz*GN]>=1e8))continue;if(D[j]<bd-1e-4){bd=D[j];best=j;}}
      e.tc=best;}
    if(e.tc<0)return;
    const dx=cellX(e.tc)+e.ox-e.x,dz=cellZ(e.tc)+e.oz-e.z,l=Math.hypot(dx,dz);if(l<.3){e.tc=null;continue;}
    const st=Math.min(mv,l);e.x+=dx/l*st;e.z+=dz/l*st;e.dx=dx/l;e.dz=dz/l;mv-=st;if(st>=l-1e-6)e.tc=null;}}
function knock(s,e,m){if(!e.fm){e.d=Math.max(0,e.d-m);return;}const x=e.x-(e.dx||0)*m,z=e.z-(e.dz||0)*m,i=cellOf(x,z);if(WALK[i]&&!s.wallSet[i]&&s.field[i]<1e8){e.x=x;e.z=z;e.tc=null;}}
// types d'ennemis. hp et vitesse relatifs au basique ; w = place prise dans une vague ; g = or
const KINDS={b:{n:'',hp:1,sp:3.6,w:1,g:7},tank:{n:'Tank',hp:4,sp:2.3,w:3,g:16},air:{n:'Aérien',hp:.6,sp:4.6,w:1,g:8},
  dig:{n:'Foreur',hp:1.1,sp:3.3,w:1,g:8},ste:{n:'Furtif',hp:.8,sp:4.1,w:1,g:8},rng:{n:'Tireur',hp:.9,sp:3.3,w:2.5,g:12}};
const KK=['b','tank','air','dig','ste','rng'],KUNLOCK={tank:2,air:3,dig:4,ste:6,rng:7};
// trois tailles de boss : petit (1), moyen (2) qui invoque des renforts, Big Boss (3) qui change d'élément et paralyse les défenses
const BN=['','Boss','Boss moyen','Big Boss'],BSP=[0,2.2,2,1.6],BLEAK=[0,10,15,999];
const bossTier=(s,n)=>s.maxW<35?1:n>=s.maxW?3:n>=s.maxW-10?2:1;
const cyOf=e=>(e.boss?[0,2.4,3.4,5][e.bt||1]:e.k==='air'?8.1:1.1)+(e.gy||0),rOf=e=>e.boss?[0,2.8,3.8,5.5][e.bt||1]:1.3;
// qui peut viser quoi : le mortier ne touche pas le ciel, seul le mortier atteint un foreur enterré, un furtif n'est vu que de près ou révélé
function sees(type,e,d2){if(e.k==='air'&&type==='mortier')return false;if(e.bur&&type!=='mortier')return false;if(e.k==='ste'&&!(e.rev>0)&&d2>49)return false;return true;}
function hurtE(e,d,pierce,hero){if(!hero&&e.mark>0)d*=1+BAL.markK;if(e.arm&&!pierce)d=Math.max(d*.25,d-e.arm);e.hp-=d;e.lastH=!!hero;if(e.k==='ste')e.rev=2.5;}
function genWave(s,n){const r=s.rng,groups=[],B=bal(s),total=Math.round(B.cnt0+B.cntG*n),np=n===1?1:n===2?2:3;
  const order=[0,1,2].map(i=>[r(),i]).sort((a,b)=>a[0]-b[0]).map(a=>a[1]).slice(0,np);
  const pool=KK.filter(k=>k!=='b'&&n>=KUNLOCK[k]);let fresh=pool.find(k=>KUNLOCK[k]===n);
  const kind=()=>{if(fresh){const k=fresh;fresh=null;return k;}return pool.length&&r()<.45?pool[Math.floor(r()*pool.length)]:'b';};
  const add=(pi,el,c)=>{if(c<=0)return;const k=kind();groups.push({path:pi,el,k,count:Math.max(1,Math.round(c/KINDS[k].w))});};
  const other=not=>{let e;do{e=ELS[Math.floor(r()*5)];}while(not.includes(e));return e;};
  const base=Math.floor(total/np);let rem=total-base*np;
  // chaque chemin a un élément dominant, plus une minorité (20 à 40 %) d'un ou deux autres
  for(const pi of order){const c=base+(rem>0?1:0);rem--;const e1=ELS[Math.floor(r()*5)],minor=n>=2&&c>=4?Math.max(1,Math.round(c*(.2+r()*.2))):0;
    add(pi,e1,c-minor);
    if(minor>=4&&r()<.5){const e2=other([e1]),h2=Math.floor(minor/2);add(pi,e2,minor-h2);add(pi,other([e1,e2]),h2);}else add(pi,other([e1]),minor);}
  if(n>=3)groups[Math.floor(r()*groups.length)].hidden=true;
  if(n%5===0)groups.push({path:Math.floor(r()*3),el:ELS[Math.floor(r()*5)],k:'b',count:1,boss:true,bt:bossTier(s,n)});
  return groups;}
function newSim(heroEl,rng,mods,mode){const m=Object.assign({},M0,mods),s={m,mode:mode==='normal'?'normal':'hard',pot:mode==='normal'?BALN.pot0:0,aiT:1.5,autoNew:true,walls:[],wallSet:Uint8Array.from(HILL),pits:[],pit:new Uint8Array(GN*GN),field:FIELD0,fv:0,maxW:(mode==='normal'?BALN:BAL).waves,pts:2,kills:0,bossKills:0,t:0,gold:130,core:(mode==='normal'?BALN:BAL).core+m.coreHp,wave:0,phase:'prep',over:null,rng:rng||Math.random,nid:1,
  enemies:[],shots:[],bombs:[],queue:[],events:[],towers:[],
  hero:{x:4,z:12,y:0,vy:0,eye:1.7,yaw:0,pitch:0,el:heroEl,cd:0,ab:0,sprint:false,m,hp:BAL.heroHp+m.hHp+(HPB[heroEl]||0),maxHp:BAL.heroHp+m.hHp+(HPB[heroEl]||0),down:0,hurtT:9,rev:0,ult:0,inv:0},others:{},client:false,lid:1,zones:[],players:1,obj:null,pend:[],tmp:[],tmpSet:new Uint8Array(GN*GN),storms:[],rain:[],flood:0};s.coreMax=s.core;s.next=genWave(s,1);return s;}
// les ennemis d'un même chemin sortent mélangés, pas groupe après groupe
function startWave(s){if(s.phase!=='prep'||s.over)return false;s.wave++;s.phase='wave';const by=[[],[],[]],B=bal(s),gap=Math.max(.4,B.gap-B.gapG*s.wave);
  for(const g of s.next){if(!by[g.path])continue;if(g.boss){s.queue.push({t:s.t+6,path:g.path,el:g.el,boss:true,bt:g.bt||1,k:'b'});continue;}
    for(let i=0;i<g.count;i++)by[g.path].push({t:0,path:g.path,el:g.el,boss:false,k:g.k||'b'});}
  by.forEach((list,pi)=>{for(let i=list.length-1;i>0;i--){const j=Math.floor(s.rng()*(i+1)),x=list[i];list[i]=list[j];list[j]=x;}
    list.forEach((q,i)=>{q.t=s.t+1+pi*.5+i*gap+s.rng()*gap*.4;s.queue.push(q);});});
  s.queue.sort((a,b)=>a.t-b.t);s.next=null;if(s.wave>=2&&!s.client&&s.rng()<BAL.objP)newObj(s);return true;}
// pose libre : partout sur l'île sauf sur les chemins
function canPlace(s,x,z){const r=Math.hypot(x,z);if(r>R_ISLE-5)return'Hors de l\'île';if(r<7)return'Trop près du cœur';
  const onW=s.wallSet[cellOf(x,z)];if(s.pit[cellOf(x,z)])return'Dans une fosse';if(s.tmpSet[cellOf(x,z)])return'Sur un rempart';if(!onW&&distPaths(x,z)<PATH_HALF+2.1)return'Sur le chemin';
  for(const t of s.towers)if(Math.hypot(t.x-x,t.z-z)<(onW&&t.wy?3.9:4.6))return'Trop près d\'une défense';return'';}
function place(s,type,x,z,el){const c=placeCost(s,type),ci=cellOf(x,z),onW=s.wallSet[ci];if(onW){x=cellX(ci);z=cellZ(ci);} // sur un mur, la défense se cale au centre du bloc
  if(s.gold<c||canPlace(s,x,z))return false;s.gold-=c;s.towers.push({id:s.nid++,type,x,z,els:[el],cd:.4,aim:0,wy:onW*WALLH});return true;}
function upgrade(s,id,el){const t=s.towers.find(t=>t.id===id);if(!t||t.tmpT!==undefined)return false;const lv=t.els.length,c=t.els.filter(e=>e===el).length,c$=costOf(t.type,lv);
  if(!ELS.includes(el)||c>=MAXLV||(!c&&new Set(t.els).size>=MAXEL)||s.gold<c$)return false;s.gold-=c$;t.els.push(el);return true;}
function tdmg(s,els,cnt,e,base){let d=0;for(const el of els)d+=base*(1+(cnt[el]-1)*(BAL.dup+s.m.spec))*mult(el,e.el,e.boss,2+s.m.strong);return d;}
function pures(els){const c={};for(const e of els)c[e]=(c[e]||0)+1;return ELS.filter(e=>c[e]>=MAXLV);}
const pureOf=els=>pures(els)[0]||null;
// spécialisation (3 fois le même élément) : un effet propre à chaque défense et à chaque élément
const FXN={mortier:{feu:'Obus incendiaires',eau:'Obus-geysers',bois:'Obus à ronces',terre:'Cratères',elec:'Obus-orages'},
  canon:{feu:'Boulets rouges',eau:'Canon à pression',bois:'Boulets-racines',terre:'Perce-blindage',elec:'Boulets foudre'},
  archer:{feu:'Flèches enflammées',eau:'Flèches de givre',bois:'Flèches empoisonnées',terre:'Flèches lourdes',elec:'Flèches conductrices'}};
const FXD={mortier:{feu:'Enflamme et laisse un brasier au sol qui brûle ceux qui le traversent.',eau:'Laisse une flaque qui ralentit tout ce qui passe.',bois:'Laisse des ronces qui blessent et entravent.',
    terre:'Zone plus large, frappe les foreurs enterrés à pleine puissance et laisse un cratère qui ralentit.',elec:'Laisse un champ d\'orage qui foudroie trois ennemis à intervalles.'},
  canon:{feu:'Brûlure double ; une cible tuée explose sur ses voisins.',eau:'Repousse la cible de 4 m et la ralentit.',bois:'Enracine la cible 1,5 s.',terre:'Ignore le blindage des tanks, avec des éclats autour.',elec:'L\'éclair rebondit sur trois ennemis.'},
  archer:{feu:'Chaque flèche enflamme.',eau:'Chaque flèche ralentit.',bois:'Poison qui ronge même les blindés.',terre:'Flèches qui percent le blindage, avec des éclats.',elec:'L\'éclair saute sur deux voisins.'}};
const ZDUR={feu:4,eau:5,bois:4,terre:6,elec:3};
function zoneAdd(s,x,z,r,el,t){for(const q of s.zones)if(q.el===el&&Math.hypot(q.x-x,q.z-z)<1.5){q.t=Math.max(q.t,t);q.T=Math.max(q.T,t);q.r=Math.max(q.r,r);return;}
  s.zones.push({id:s.lid++,x,z,r,el,t,T:t,zap:0});if(s.zones.length>40)s.zones.shift();}
function impact(s,b){const T=TYPES[b.type],m=s.m,els=b.els,cnt={};els.forEach(e=>cnt[e]=(cnt[e]||0)+1);const mort=b.type==='mortier',can=b.type==='canon',arch=b.type==='archer';
  const P={};for(const e in cnt)if(cnt[e]>=MAXLV)P[e]=1; // chaque élément monté au niveau 3 apporte son effet, et ils se cumulent
  const base=T.dmg*(1+m[TK[b.type]+'Dmg']),fxd=1+m.fxDur,sp=T.splash*(mort?1+m.mRad:1);
  const R=P.terre?(sp?sp*1.6:2.4):sp,hit=new Set(),tg=T.splash?null:s.enemies.find(e=>e.id===b.tid&&e.hp>0&&!e.bur);
  if(!R&&!tg)return;
  const hurt=(e,k)=>{hurtE(e,tdmg(s,els,cnt,e,base)*k,!!P.terre);hit.add(e);
    if(P.feu){e.burn=(can?4:3)*fxd;e.bk=can?2:1;}
    if(P.eau){e.slow=2.5*fxd;if(can&&e===tg)knock(s,e,e.boss?1.5:4);}
    if(P.bois){if(arch)e.poi=4*fxd;else if(e.boss)e.slow=1.5*fxd;else if(!(e.imm>0)){e.stun=(can?1.5:.8)*fxd;e.imm=e.stun+1.4;}}};
  for(const e of s.enemies){if(e.hp<=0)continue;let ok=e===tg,k=1;
    if(!ok&&R&&e.k!=='air'&&(mort||!e.bur)){const rr=R+(e.boss?1.5:0),dx=e.x-b.tx,dz=e.z-b.tz;ok=dx*dx+dz*dz<=rr*rr;if(e.bur&&!P.terre)k=.5;}
    if(ok)hurt(e,k);}
  if(can&&tg){let from=tg;for(let i=0;i<m.cRico;i++){let nx=null,bd=8;for(const e of s.enemies){if(e.hp<=0||e.bur||hit.has(e))continue;const d=Math.hypot(e.x-from.x,e.z-from.z);if(d<bd){bd=d;nx=e;}}
    if(!nx)break;hurt(nx,.6);s.events.push({k:'boom',x:nx.x,z:nx.z,r:1.2,el:els[0]});from=nx;}}
  if(P.elec){s.enemies.filter(e=>!hit.has(e)&&e.hp>0&&!e.bur).map(e=>[Math.hypot(e.x-b.tx,e.z-b.tz),e]).filter(a=>a[0]<10)
    .sort((a,b)=>a[0]-b[0]).slice(0,can?3:2).forEach(a=>{hurtE(a[1],tdmg(s,els,cnt,a[1],base)*(can?.6:.5));if(!arch)s.events.push({k:'arc',x:a[1].x,z:a[1].z});});}
  if(can&&P.feu&&tg&&tg.hp<=0){for(const e of s.enemies){if(e===tg||e.hp<=0||e.bur||e.k==='air'||hit.has(e))continue;if(Math.hypot(e.x-tg.x,e.z-tg.z)<3.5)hurt(e,.5);}
    s.events.push({k:'boom',x:tg.x,z:tg.z,r:3.5,el:'feu'});}
  if(mort)for(const el in P)zoneAdd(s,b.tx,b.tz,R,el,ZDUR[el]*fxd);
  if(R||can)s.events.push({k:'boom',x:b.tx,z:b.tz,r:R||1.4,el:els[0]});}
// la compétence de chaque héros
function ability(s,h,a){h=h||s.hero;if(h.el==='terre')return rempart(s,h);if(h.el==='elec')return dash(s,h,a);if(h.el==='bois')return brambles(s,h,a);if(h.el==='feu')return fireball(s,h,a);return tide(s,h,a);}
const offOf=id=>((id*7919)%240)/100-1.2;
// le kit de chaque héros : compétence, ultime, rôle
const KIT={terre:{skill:'Rempart',ult:'Séisme',tag:'Tank · Rempart · Séisme'},elec:{skill:'Éclair',ult:'Orage',tag:'Mobile · Éclair · Orage'},bois:{skill:'Ronces',ult:'Gardiens',tag:'Contrôle · Ronces · Gardiens'},feu:{skill:'Brasier',ult:'Météores',tag:'Dégâts · Brasier · Météores'},eau:{skill:'Marée',ult:'Déluge',tag:'Soutien · Marée · Déluge'}},HPB={terre:BAL.rocHp,elec:BAL.voltHp};
// ---- Volt (Élec), le mobile. Passif : sprint plus rapide, tirs qui sautent sur un voisin, mais moins de vie. Compétence : Éclair. Ultime : Orage.
// Éclair : il file tout droit sur BAL.dashLen m, s'arrête contre un obstacle, électrocute ce qu'il traverse et ne peut pas être touché un instant.
// `a` porte la position de départ envoyée par un invité, pour que l'hôte frappe au bon endroit.
function dash(s,h,a){if(h.ab>0||s.over)return false;h.ab=BAL.dashCd-h.m.abCd;let x=h.x,z=h.z,yaw=h.yaw;
  if(a&&[a[1],a[2],a[3]].every(Number.isFinite)&&Math.hypot(a[1]-h.x,a[2]-h.z)<40){x=a[1];z=a[2];yaw=a[3];}
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),y=h.y||0;let d=0;for(;d<BAL.dashLen+h.m.kLen;d+=.5){const nx=x+fx*(d+.5),nz=z+fz*(d+.5);if(topAt(s,nx,nz)>y+.3||Math.hypot(nx,nz)>R_ISLE-3)break;}
  const ex=x+fx*d,ez=z+fz*d;
  if(!s.client){const dmg=BAL.dashDmg*(1+h.m.abDmg)*(1+.08*(s.wave-1));for(const e of s.enemies){if(e.hp<=0||e.bur||e.k==='air')continue;
    if(distSeg(e.x,e.z,[x,z],[ex,ez])<2.6+(e.boss?2:0)){hurtE(e,dmg*mult('elec',e.el,e.boss,2+s.m.strong),false,true);e.slow=Math.max(e.slow,1);}}
    if(h.m.kTrail){for(let k=1;k<=3;k++)zoneAdd(s,x+(ex-x)*k/4,z+(ez-z)*k/4,3,'elec',3);for(const q of s.zones)if(q.el==='elec'&&distSeg(q.x,q.z,[x,z],[ex,ez])<1)q.hero=1;}}
  if(h===s.hero){h.x=ex;h.z=ez;h.inv=.5;}
  s.events.push({k:'dash',x,z,ex,ez});return true;}
// Orage : un nuage reste BAL.stormT s là où il est lancé et foudroie 3 ennemis toutes les 0,4 s dans son rayon, aériens compris.
function storm(s,h){if(s.over)return false;if(!s.client)s.storms.push({x:h.x,z:h.z,t:BAL.stormT+h.m.uDur,r:BAL.stormR+h.m.uRad,zap:0});s.events.push({k:'storm',x:h.x,z:h.z});return true;}
// ---- Sylve (Bois), le contrôle. Passif : elle voit les furtifs de loin et ses tirs empoisonnent. Compétence : Ronces. Ultime : Gardiens.
// Ronces : un grand roncier là où elle vise (a[4],a[5]), qui blesse, ralentit et entrave par à-coups tout ce qui le traverse au sol.
function brambles(s,h,a){if(h.ab>0||s.over)return false;h.ab=BAL.ronceCd-h.m.abCd;let tx=h.x-Math.sin(h.yaw)*8,tz=h.z-Math.cos(h.yaw)*8;
  if(a&&Number.isFinite(a[4])&&Number.isFinite(a[5])&&Math.hypot(a[4]-h.x,a[5]-h.z)<26){tx=a[4];tz=a[5];}
  if(!s.client){zoneAdd(s,tx,tz,BAL.ronceR+h.m.abRad,'bois',BAL.ronceT+h.m.kDur);for(const q of s.zones)if(q.el==='bois'&&Math.hypot(q.x-tx,q.z-tz)<1.6){q.hero=1;q.pw=BAL.ronceDmg/3*(1+h.m.abDmg)*(1+.08*(s.wave-1));}}
  s.events.push({k:'ronce',x:tx,z:tz});return true;}
// Gardiens : trois tours d'archer Bois de niveau 3 (flèches empoisonnées) poussent autour d'elle et disparaissent au bout de BAL.guardT s. Elles sont gratuites et ne s'améliorent pas.
function guardians(s,h){if(s.over)return false;if(!s.client){let n=0;for(const R of[5,8,11])for(let k=0;k<8&&n<3+h.m.uExtra;k++){const a=k*.785+R,x=h.x+Math.cos(a)*R,z=h.z+Math.sin(a)*R;
      if(canPlace(s,x,z)||s.wallSet[cellOf(x,z)])continue;s.towers.push({id:s.nid++,type:'archer',x,z,els:['bois','bois','bois'],cd:.3,aim:0,wy:0,tmpT:BAL.guardT+h.m.uDur});n++;}}
  s.events.push({k:'guard',x:h.x,z:h.z});return true;}
// ---- Braise (Feu), les dégâts. Passif : ses tirs enflamment et éclaboussent autour de la cible. Compétence : Brasier. Ultime : Météores.
// Brasier : une boule de feu explose là où il vise (a[4],a[5]) et laisse des flammes au sol.
function fireball(s,h,a){if(h.ab>0||s.over)return false;h.ab=BAL.fbCd-h.m.abCd;let tx=h.x-Math.sin(h.yaw)*10,tz=h.z-Math.cos(h.yaw)*10;
  if(a&&Number.isFinite(a[4])&&Number.isFinite(a[5])&&Math.hypot(a[4]-h.x,a[5]-h.z)<26){tx=a[4];tz=a[5];}
  if(!s.client){const d=BAL.fbDmg*(1+h.m.abDmg)*(1+.08*(s.wave-1)),FR=BAL.fbR+h.m.abRad;for(const e of s.enemies){if(e.hp<=0||e.bur||e.k==='air'||Math.hypot(e.x-tx,e.z-tz)>FR+(e.boss?1.5:0))continue;hurtE(e,d*mult('feu',e.el,e.boss,2+s.m.strong),false,true);e.burn=Math.max(e.burn,3);}
    zoneAdd(s,tx,tz,FR*.7,'feu',BAL.fbZoneT);for(const q of s.zones)if(q.el==='feu'&&Math.hypot(q.x-tx,q.z-tz)<1.6){q.hero=1;q.pw=1+.08*(s.wave-1);}}
  s.events.push({k:'fball',x:tx,z:tz});return true;}
// Météores : BAL.metN météores tombent un par un, où qu'il soit, sur l'ennemi le plus avancé vers le cœur. Les aériens sont touchés aussi.
function meteors(s,h){if(s.over)return false;if(!s.client)s.rain.push({n:BAL.metN+h.m.uExtra,t:.3,r:BAL.metR+h.m.uRad});s.events.push({k:'rain'});return true;}
// ---- Ondine (Eau), le soutien. Passif : elle se soigne vite et ses tirs ralentissent. Compétence : Marée. Ultime : Déluge.
// Les soins aux autres joueurs passent par le réseau : chacun gère la vie de son propre héros (`mine` signale au jeu qu'il faut prévenir les coéquipiers).
// Marée : une vague autour d'elle soigne les héros, repousse, ralentit et blesse les ennemis au sol.
function tide(s,h,a){if(h.ab>0||s.over)return false;h.ab=BAL.tideCd-h.m.abCd;const R=BAL.tideR+h.m.abRad;let x=h.x,z=h.z;
  if(a&&Number.isFinite(a[1])&&Number.isFinite(a[2])&&Math.hypot(a[1]-h.x,a[2]-h.z)<40){x=a[1];z=a[2];}
  if(!s.client){const d=BAL.tideDmg*(1+h.m.abDmg)*(1+.08*(s.wave-1));for(const e of s.enemies){if(e.hp<=0||e.k==='air'||Math.hypot(e.x-x,e.z-z)>R)continue;
    hurtE(e,d*mult('eau',e.el,e.boss,2+s.m.strong),false,true);e.slow=Math.max(e.slow,3);if(!e.boss&&!e.bur)knock(s,e,BAL.tideKnock+h.m.kLen);if(e.k==='ste')e.rev=4;}}
  if(h===s.hero)h.hp=Math.min(h.maxHp,h.hp+BAL.tideHeal+h.m.kHeal);
  s.events.push({k:'tide',x,z,r:R,heal:BAL.tideHeal+h.m.kHeal,mine:h===s.hero});return true;}
// Déluge : pendant BAL.floodT s, tous les ennemis au sol de l'île sont ralentis et rongés par l'eau ; le cœur récupère des points ; tous les héros sont soignés et relevés.
function deluge(s,h){if(s.over)return false;if(!s.client){s.flood=BAL.floodT+h.m.uDur;s.core=Math.min(s.coreMax,s.core+BAL.floodCore+h.m.uExtra);}if(h===s.hero)h.hp=h.maxHp;s.events.push({k:'deluge',mine:h===s.hero});return true;}
const ULT={terre:quake,elec:storm,bois:guardians,feu:meteors,eau:deluge};
// ---- Roc (Terre), le tank. Passif : plus de vie, coups au contact amortis. Compétence : Rempart. Ultime : Séisme.
// Rempart : un vrai mur de 5 blocs de large et 2 de haut dressé 5 m devant lui, qui disparaît tout seul. Il ne peut pas fermer le passage ; s'il ne tient pas à 5, on essaie à 3, puis à 1.
function rempart(s,h){if(h.ab>0||s.over)return false;h.ab=BAL.rempartCd-h.m.abCd;if(s.client)return true; // chez un invité, c'est l'hôte qui pose les blocs
  const fx=-Math.sin(h.yaw),fz=-Math.cos(h.yaw),cx=h.x+fx*5,cz=h.z+fz*5,want=[...new Set((h.m.kWide?[0,-1,1,-2,2,-3,3]:[0,-1,1,-2,2]).map(k=>cellOf(cx-fz*k*CELL,cz+fx*k*CELL)))].filter(i=>!s.wallSet[i]&&!s.pit[i]&&!cellWhy(s,i));
  for(const set of[want,want.slice(0,5),want.slice(0,3),want.slice(0,1)]){if(!set.length)continue;for(const i of set)s.wallSet[i]=BAL.rempartH;const D=fieldOf(s.wallSet,s.pit);
    if(PATHS.every(p=>D[cellOf(p.pts[0][0],p.pts[0][1])]<1e8)&&s.enemies.every(e=>!e.fm||D[cellOf(e.x,e.z)]<1e8)){
      for(const i of set){s.walls.push(i);s.tmpSet[i]=1;s.tmp.push({i,t:BAL.rempartT+h.m.kDur});s.events.push({k:'wallup',x:cellX(i),z:cellZ(i)});}s.field=D;s.fv++;return true;}
    for(const i of set)s.wallSet[i]=0;}
  h.ab=1;s.events.push({k:'nowall'});return false;}
// Séisme : blesse et étourdit tout ce qui marche autour de lui (les boss sont seulement ralentis), déterre les foreurs, révèle les furtifs. Les aériens y échappent.
function quake(s,h){if(s.over)return false;const d=BAL.quakeDmg*(1+.08*(s.wave-1)),QR=BAL.quakeR+h.m.uRad,QT=BAL.quakeT+h.m.uDur;
  for(const e of s.enemies){if(e.hp<=0||e.k==='air'||Math.hypot(e.x-h.x,e.z-h.z)>QR+(e.boss?2:0))continue;hurtE(e,d*mult('terre',e.el,e.boss,2+s.m.strong),true,true);
    if(e.boss)e.slow=Math.max(e.slow,QT);else{e.stun=Math.max(e.stun,QT);e.imm=e.stun+1;}if(e.k==='ste')e.rev=4;}
  s.events.push({k:'quake',x:h.x,z:h.z,r:QR});return true;}
// ---- objectifs de vague : à partir de la vague 2, une partie des vagues en propose un. Seul l'hôte les fait avancer.
// bomb : un porteur de bombe rapide et solide à abattre avant le cœur. zone : rester dans un cercle. relic : aller chercher une relique sur la route et la ramener au cœur.
const OBJN={bomb:'Porteur de bombe',zone:'Zone à tenir',relic:'Relique'};
function newObj(s,force){const r=s.rng,k=force||['bomb','zone','relic'][Math.floor(r()*3)];
  if(k==='bomb'){const path=Math.floor(r()*3);s.queue.push({t:s.t+7,path,el:ELS[Math.floor(r()*5)],boss:false,k:'b',bomb:true});s.queue.sort((a,b)=>a.t-b.t);s.obj={k,path,id:0};}
  else if(k==='zone'){let x=40,z=40;for(let i=0;i<40;i++){const a=r()*6.283,d=35+r()*50;x=Math.cos(a)*d;z=Math.sin(a)*d;if(distPaths(x,z)>8)break;}s.obj={k,x,z,got:0,t:BAL.zoneTime};}
  else{const p=PATHS[Math.floor(r()*3)],q=posAt(p,(.35+r()*.25)*p.len);s.obj={k,x:q[0],z:q[1],car:null,t:BAL.relicTime};}
  s.events.push({k:'obj',t:'start',o:k});}
function objEnd(s,win,gold){const o=s.obj;if(!o)return;s.obj=null;if(win){s.gold+=gold;if(o.k!=='bomb')s.pts+=1;}s.events.push({k:'obj',t:win?'win':'fail',o:o.k,g:win?gold:0});}
function objStep(s,dt){const o=s.obj;if(!o||o.k==='bomb')return;const hs=[['me',s.hero]];for(const k in s.others)hs.push([k,s.others[k]]);o.t-=dt;
  if(o.k==='zone'){if(hs.some(h=>!h[1].down&&Math.hypot(h[1].x-o.x,h[1].z-o.z)<BAL.zoneR))o.got+=dt;if(o.got>=BAL.zoneNeed)objEnd(s,true,40+6*s.wave);else if(o.t<=0)objEnd(s,false,0);return;}
  let c=o.car?hs.find(h=>h[0]===o.car):null;if(c&&c[1].down>0)c=null; // un porteur à terre lâche la relique sur place
  if(!c){o.car=null;c=hs.find(h=>!(h[1].down>0)&&Math.hypot(h[1].x-o.x,h[1].z-o.z)<2.5)||null;if(c)o.car=c[0];}
  if(c){o.x=c[1].x;o.z=c[1].z;if(Math.hypot(o.x,o.z)<7){objEnd(s,true,60+8*s.wave);return;}}
  if(o.t<=0)objEnd(s,false,0);}
// ---- le héros en danger. Chaque joueur gère la vie de son propre héros ; les autres la reçoivent par le réseau.
const HDMG={b:4,tank:14,dig:7,ste:10},HBOSS=[0,18,26,40]; // dégâts au contact, avant la hausse par vague
function hurtHero(s,h,d){if(h.down>0||s.heroGod||h.inv>0)return;d*=1+BAL.hDmgG*(s.wave-1);h.hp-=d;h.ult=Math.min(100,h.ult+d*BAL.ultHurt*(1+h.m.uCharge));h.hurtT=0;s.events.push({k:'ouch'});
  if(h.hp<=0){h.hp=0;h.down=BAL.respawn;h.rev=0;s.events.push({k:'down'});}}
// renvoie vrai si le héros est debout. À terre : il revient au cœur après BAL.respawn s, ou plus vite si un coéquipier reste à côté de lui.
function heroLife(s,h,dt){if(h.down>0){let near=false;for(const k in s.others){const o=s.others[k];if(!o.down&&Math.hypot(o.x-h.x,o.z-h.z)<3){near=true;break;}}
    h.rev=near?h.rev+dt:0;h.down-=dt;h.eye+=(.45-h.eye)*Math.min(1,dt*6);
    if(h.rev>=BAL.reviveT){h.down=0;h.rev=0;h.hp=h.maxHp*.5;h.hurtT=0;s.events.push({k:'up'});}
    else if(h.down<=0){h.down=0;h.hp=h.maxHp;h.x=4;h.z=12;h.y=0;h.vy=0;h.hurtT=9;s.events.push({k:'up'});}
    return h.down<=0;}
  h.hurtT+=dt;if(h.inv>0)h.inv-=dt;if(s.phase==='wave')h.ult=Math.min(100,h.ult+BAL.ultTick*(1+h.m.uCharge)*dt);const fast=h.el==='eau';if(h.hurtT>(fast?BAL.ondWait:BAL.regenWait)&&h.hp<h.maxHp)h.hp=Math.min(h.maxHp,h.hp+(fast?BAL.ondRegen+h.m.pA:BAL.regen)*dt);return true;}
// un héros : déplacement (seulement le sien) puis tir. Les coéquipiers arrivent déjà placés par le réseau.
function heroStep(s,h,inp,dt,move){const m=h.m,fx=-Math.sin(h.yaw),fz=-Math.cos(h.yaw);
  if(move){h.sprint=!!inp.sprint&&!inp.sneak;const sp=(inp.sneak?4:(h.sprint?14.5*(1+m.hSprint)*(h.el==='elec'?BAL.voltSprint:1):9))*(1+m.hSpd),rx=Math.cos(h.yaw),rz=-Math.sin(h.yaw);
    const fl=inp.fly?2.2:1,fc=1;const mx=(fx*inp.f*fc+rx*inp.r)*sp*fl*dt,mz=(fz*inp.f*fc+rz*inp.r)*sp*fl*dt,hit=(x,z)=>!inp.fly&&topAt(s,x,z)>h.y+.3;
    if(!hit(h.x+mx,h.z+mz)){h.x+=mx;h.z+=mz;}else if(!hit(h.x+mx,h.z))h.x+=mx;else if(!hit(h.x,h.z+mz))h.z+=mz; // on se cogne au mur et on glisse le long
    // 1 bloc de haut : il faut sauter. 2 blocs : en poussant contre l'obstacle, le héros s'agrippe et grimpe. 3 blocs : trop haut, il faut une marche.
    let climb=false;if(!inp.fly&&(mx||mz)){const bt=topAt(s,h.x+mx,h.z+mz),rise=bt-topAt(s,h.x,h.z);
      if(bt>h.y+.3&&rise>WALLH+.05&&rise<=2*WALLH+.05){h.cl=(h.cl||0)+dt;climb=h.cl>BAL.climbWait;}else h.cl=0;}else h.cl=0;
    const hr=Math.hypot(h.x,h.z),lim=inp.fly?R_ISLE+150:R_ISLE-3;if(hr>lim){h.x*=lim/hr;h.z*=lim/hr;}
    if(inp.fly){h.vy=0;h.y=Math.max(0,Math.min(160,h.y+((inp.up?1:0)-(inp.down?1:0))*16*dt));}
    else{const gr=topAt(s,h.x,h.z);if(inp.jump&&h.y<=gr+.01)h.vy=9.2*Math.sqrt(1+m.hJump);if(climb){h.vy=0;h.y+=BAL.climbSp*dt;}else{h.vy-=22*dt;h.y+=h.vy*dt;}if(h.y<=gr){h.y=gr;h.vy=0;}} // le dessus d'un mur est un sol
    h.eye+=((inp.sneak?1.1:1.7)-h.eye)*Math.min(1,dt*12);}
  h.cd-=dt;h.ab=Math.max(0,h.ab-dt);const ey=h.y+h.eye-.1;
  if(inp.fire&&h.cd<=0){h.cd=.26*(1-m.hCd);const cp=Math.cos(h.pitch),sy=Math.sin(h.pitch);let d=[fx*cp,sy,fz*cp],best=.9925;
    for(const e of s.enemies){if(e.bur)continue;const vx=e.x-h.x,vy=cyOf(e)-ey,vz=e.z-h.z,l=Math.hypot(vx,vy,vz);if(l>50||l<.5)continue;
      const dot=(vx*fx*cp+vy*sy+vz*fz*cp)/l;if(dot>best){best=dot;d=[vx/l,vy/l,vz/l];}}
    s.shots.push({id:s.lid++,x:h.x+d[0],y:ey+d[1],z:h.z+d[2],d,life:.85*(1+m.hLife),el:h.el,dmg:BAL.gun*(1+m.hDmg),left:1+m.hPierce,hit:[],mine:h===s.hero,chain:h.el==='elec'?1+h.m.pA:0,pois:h.el==='bois'?2.5+h.m.pA:0,fire:h.el==='feu'?BAL.braiseSplash+h.m.pA:0,wet:h.el==='eau'});}}
function step(s,dt,inp){if(s.over)return;s.t+=dt;const h0=s.hero;if(heroLife(s,h0,dt))heroStep(s,h0,inp,dt,true);autoDef(s,dt);
  if(s.tmp.length&&!s.client){let ch=false;for(const w of s.tmp){w.t-=dt;if(w.t<=0){ch=true;s.tmpSet[w.i]=0;if(s.wallSet[w.i]){s.wallSet[w.i]=0;const k=s.walls.indexOf(w.i);if(k>=0)s.walls.splice(k,1);}}}if(ch){s.tmp=s.tmp.filter(w=>w.t>0);refield(s);}} // les remparts s'effacent
  if(!s.client&&s.towers.some(t=>t.tmpT!==undefined)){for(const t of s.towers)if(t.tmpT!==undefined)t.tmpT-=dt;s.towers=s.towers.filter(t=>!(t.tmpT<=0));} // les Gardiens se fanent
  if(s.flood>0&&!s.client)s.flood-=dt;
  if(s.rain.length&&!s.client){for(const r of s.rain){r.t-=dt;if(r.t>0)continue;r.t=.45;r.n--;let tg=null;for(const e of s.enemies)if(e.hp>0&&!e.bur&&(!tg||e.rem<tg.rem))tg=e;if(!tg)continue;
      const d=BAL.metDmg*(1+.08*(s.wave-1)),x=tg.x,z=tg.z;for(const e of s.enemies)if(e.hp>0&&!e.bur&&Math.hypot(e.x-x,e.z-z)<(r.r||BAL.metR)+(e.boss?1.5:0)){hurtE(e,d*mult('feu',e.el,e.boss,2+s.m.strong),false,true);e.burn=Math.max(e.burn,3);}s.events.push({k:'meteor',x,z,r:r.r||BAL.metR});}
    s.rain=s.rain.filter(r=>r.n>0);}
  if(s.storms.length&&!s.client){for(const st of s.storms){st.t-=dt;st.zap-=dt;if(st.zap>0)continue;st.zap=.4;const c=s.enemies.filter(e=>e.hp>0&&!e.bur&&Math.hypot(e.x-st.x,e.z-st.z)<(st.r||BAL.stormR));
      for(let i=0;i<3&&c.length;i++){const e=c.splice(Math.floor(s.rng()*c.length),1)[0];hurtE(e,BAL.stormDmg*(1+.08*(s.wave-1))*mult('elec',e.el,e.boss,2+s.m.strong),false,true);s.events.push({k:'bolt2',x:e.x,z:e.z});}}
    s.storms=s.storms.filter(st=>st.t>0);}
  if(s.pend.length){for(const p of s.pend){for(const o of s.enemies)if(o.hp>0&&o.k!=='air'&&Math.hypot(o.x-p.x,o.z-p.z)<p.r)hurtE(o,p.d,true,true);s.events.push({k:'boom',x:p.x,z:p.z,r:p.r,el:'feu'});}s.pend.length=0;}
  for(const k in s.others){const o=s.others[k];heroStep(s,o,o.inp,dt,false);}
  // apparitions
  while(!s.client&&s.queue.length&&s.queue[0].t<=s.t){const q=s.queue.shift(),n=s.wave,p=PATHS[q.path];
    const K=KINDS[q.k]||KINDS.b,B=bal(s),bt=q.boss?(q.bt||1):0,hp=enemyHp(B,n,q.k,q.boss,s.players)*(bt?B.bossT[bt-1]:1)*(q.bomb?BAL.bombHp:1);
    const id=s.nid++;s.enemies.push({id,el:q.el,path:q.path,d:0,hp,max:hp,sp:bt?BSP[bt]:q.bomb?4:K.sp,bomb:!!q.bomb,bt,el0:q.el,ph:0,sum:6,stomp:8,k:q.boss?'b':(KINDS[q.k]?q.k:'b'),arm:!q.boss&&q.k==='tank'?B.armor0+B.armorG*n:0,rev:0,atk:0,bur:false,ang:0,boss:q.boss,off:offOf(id),slow:0,burn:0,stun:0,x:p.pts[0][0],z:p.pts[0][1],fm:fmOf(q.boss?'b':q.k),tc:null,ox:offOf(id)*.7,oz:offOf(id*3+1)*.7,dx:0,dz:0,rem:p.len});if(q.bomb&&s.obj&&s.obj.k==='bomb')s.obj.id=id;}
  // ennemis
  for(const e of s.enemies){const p=PATHS[e.path];if(e.burn>0){e.burn-=dt;e.hp-=6*(e.bk||1)*dt;}else e.bk=1;if(e.poi>0){e.poi-=dt;e.hp-=4*dt;}if(e.rev>0)e.rev-=dt;if(e.mark>0)e.mark-=dt;
    const hold=e.k==='rng'&&Math.hypot(e.x,e.z)<=16; // le tireur s'arrête à portée du cœur et le bombarde
    if(s.flood>0&&e.k!=='air'){e.slow=Math.max(e.slow,.25);if(!s.client)e.hp-=BAL.floodDps*(1+.08*(s.wave-1))*mult('eau',e.el,e.boss)*dt;} // Déluge
    if(e.imm>0)e.imm-=dt;let mv=0;if(e.stun>0)e.stun-=dt;else if(!hold)mv=e.sp*(e.slow>0?.6:1)*dt;if(e.slow>0)e.slow-=dt;
    if(hold&&e.hp>0&&!(e.stun>0)){e.atk=(e.atk||0)+dt;if(e.atk>=5){e.atk=0;if(!s.god&&!s.client)s.core-=1;s.events.push({k:'bolt',x:e.x,z:e.z,el:e.el});}}
    if(e.fm){const pd=s.pit[cellOf(e.x,e.z)];e.gy=-pd*WALLH;if(mv>0)fieldMove(s,e,mv*BAL.fmK*(1-BAL.pitSlow*pd));const r=s.field[cellOf(e.x,e.z)];if(r<1e8)e.rem=r;}                       // au sol : suit le terrain, contourne les murs
    else{e.d+=mv;const q=posAt(p,e.d);e.x=q[0]-q[3]*e.off;e.z=q[1]+q[2]*e.off;e.dx=q[2];e.dz=q[3];e.rem=p.len-e.d;} // aérien ou foreur : tracé d'origine
    e.bur=e.k==='dig'&&(e.d+e.id*7)%30<18&&p.len-e.d>10; // le foreur avance sous terre 18 m, ressort 12 m
    if(e.dx||e.dz)e.ang=Math.atan2(e.dx,e.dz);
    if(e.k==='ste'&&!(e.rev>.4)){if(Math.hypot(e.x-h0.x,e.z-h0.z)<(h0.el==='bois'?BAL.sylveSee:9))e.rev=.5;else for(const k in s.others){const o=s.others[k];if(Math.hypot(e.x-o.x,e.z-o.z)<(o.el==='bois'?BAL.sylveSee:9)){e.rev=.5;break;}}}
    if(!h0.down&&e.hp>0&&!e.bur&&!(e.stun>0)){e.ha=(e.ha||0)-dt; // les ennemis s'en prennent au héros : tir pour le tireur et l'aérien, coup au contact pour les autres
      if(e.ha<=0){const dh=Math.hypot(e.x-h0.x,e.z-h0.z);
        if(e.k==='rng'&&dh<12){e.ha=2;hurtHero(s,h0,6);s.events.push({k:'zap',x:e.x,z:e.z,el:e.el});}
        else if(e.k==='air'&&dh<9){e.ha=1.5;hurtHero(s,h0,3);s.events.push({k:'zap',x:e.x,z:e.z,el:e.el});}
        else if(e.k!=='air'&&dh<(e.boss?rOf(e)+2.5:4)&&h0.y-(e.gy||0)<1.2){e.ha=e.boss?1.2:.9;hurtHero(s,h0,(e.boss?HBOSS[e.bt||1]:HDMG[e.k]||6)*(h0.el==='terre'?BAL.rocArmor-h0.m.pA:1));}}} // perché sur un mur, on est hors de portée des coups
    if(e.k==='tank'&&!s.client&&e.hp>0&&!(e.stun>0)){e.sm=(e.sm===undefined?BAL.smashCd*.6:e.sm)-dt;                  // le tank met hors service la défense la plus proche
      if(e.sm<=0){let bt=null,bd=BAL.smashR;for(const t of s.towers){const d=Math.hypot(t.x-e.x,t.z-e.z);if(d<bd&&!(t.off>0)){bd=d;bt=t;}}
        if(bt){e.sm=BAL.smashCd;bt.off=BAL.smashT;s.events.push({k:'smash',x:bt.x,z:bt.z});}else e.sm=0;}} // prêt dès qu'une défense passe à portée
    if((e.fm?e.rem<=.5:e.d>=p.len-.5)&&e.hp>0){e.hp=-1e9;e.leak=true;if(!s.god&&!s.client)s.core-=e.boss?BLEAK[e.bt||1]:e.bomb?BAL.bombLeak:1;s.events.push({k:'leak'});if(e.bomb&&!s.client)objEnd(s,false,0);}}
  // boss moyens et Big Boss (l'hôte décide, les invités recopient)
  if(!s.client)for(const e of s.enemies.slice()){if(!(e.bt>1)||e.hp<=0)continue;
    if(e.bt===2){e.sum-=dt;if(e.sum<=0){e.sum=6;const hp=enemyHp(bal(s),s.wave,'b',false,s.players); // trois renforts de son élément toutes les 6 s
        for(let i=0;i<3;i++){const id=s.nid++;s.enemies.push({id,el:e.el,path:e.path,d:0,hp,max:hp,sp:KINDS.b.sp,k:'b',arm:0,rev:0,atk:0,bur:false,ang:0,boss:false,bt:0,off:offOf(id),slow:0,burn:0,stun:0,x:e.x-(e.dx||0)*(2+i*1.5),z:e.z-(e.dz||0)*(2+i*1.5),fm:true,tc:null,ox:offOf(id)*.7,oz:offOf(id*3+1)*.7,dx:e.dx||0,dz:e.dz||0,rem:e.rem});}
        s.events.push({k:'summon',x:e.x,z:e.z,el:e.el});}}
    else{const ph=Math.min(4,Math.floor((1-e.hp/e.max)*5));                                        // passe par les cinq éléments, un par cinquième de vie
      if(ph!==e.ph){e.ph=ph;e.el=ELS[(ELS.indexOf(e.el0)+ph)%5];s.events.push({k:'shift',x:e.x,z:e.z,el:e.el});}
      e.stomp-=dt;if(e.stomp<=0){e.stomp=10;for(const t of s.towers)if(Math.hypot(t.x-e.x,t.z-e.z)<18)t.off=3;s.events.push({k:'stomp',x:e.x,z:e.z,el:e.el});}}} // paralyse 3 s les défenses à 18 m, toutes les 10 s
  // zones laissées au sol par les mortiers spécialisés
  for(const z of s.zones){z.t-=dt;z.zap-=dt;const zapNow=z.el==='elec'&&z.zap<=0;let zn=0;if(zapNow)z.zap=.8;
    for(const e of s.enemies){if(e.hp<=0||e.k==='air'||(e.bur&&z.el!=='terre'))continue;const rr=z.r+(e.boss?1.5:0);if((e.x-z.x)**2+(e.z-z.z)**2>rr*rr)continue;
      if(z.el==='feu'){e.hp-=8*(z.pw||1)*mult('feu',e.el,e.boss,2+s.m.strong)*dt;e.burn=Math.max(e.burn,.6);}
      else if(z.el==='eau'||z.el==='terre')e.slow=Math.max(e.slow,.3);
      else if(z.el==='bois'){e.hp-=3*(z.pw||1)*dt;if(z.hero)e.slow=Math.max(e.slow,.3);if(!e.boss&&!(e.imm>0)){e.stun=.8;e.imm=2.2;}}
      else if(zapNow&&zn<3){zn++;hurtE(e,6*mult('elec',e.el,e.boss,2+s.m.strong));s.events.push({k:'arc',x:e.x,z:e.z});}}}
  s.zones=s.zones.filter(z=>z.t>0);
  // tirs du héros
  for(const b of s.shots){b.x+=b.d[0]*60*dt;b.y+=b.d[1]*60*dt;b.z+=b.d[2]*60*dt;b.life-=dt;if(b.y<-4)b.life=0;
    for(const e of s.enemies){if(e.hp<=0||e.bur||b.hit.includes(e.id))continue;const r=rOf(e),cy=cyOf(e);
      if((e.x-b.x)**2+(cy-b.y)**2+(e.z-b.z)**2<r*r){hurtE(e,b.dmg*mult(b.el,e.el,e.boss,2+s.m.strong),false,true);e.mark=BAL.markT;if(b.mine)s.hero.ult=Math.min(100,s.hero.ult+BAL.ultHit*(1+s.hero.m.uCharge));if(b.pois)e.poi=Math.max(e.poi||0,b.pois);if(b.wet)e.slow=Math.max(e.slow,1.2);
        if(b.fire){e.burn=Math.max(e.burn,2);for(const o of s.enemies)if(o!==e&&o.hp>0&&!o.bur&&Math.hypot(o.x-e.x,o.z-e.z)<2.5)hurtE(o,b.dmg*b.fire*mult(b.el,o.el,o.boss,2+s.m.strong),false,true);} // passif de Braise
        if(b.chain){const used=[e];for(let c=0;c<b.chain;c++){let nx=null,bd=6;const fr=used[used.length-1];for(const o of s.enemies){if(used.includes(o)||o.hp<=0||o.bur)continue;const d=Math.hypot(o.x-fr.x,o.z-fr.z);if(d<bd){bd=d;nx=o;}}
          if(!nx)break;used.push(nx);nx.mark=BAL.markT;hurtE(nx,b.dmg*.5*mult(b.el,nx.el,nx.boss,2+s.m.strong),false,true);s.events.push({k:'arc',x:nx.x,z:nx.z});}}b.hit.push(e.id);if(--b.left<=0)b.life=0;break;}}}
  s.shots=s.shots.filter(b=>b.life>0);
  // mortiers
  for(const t of s.towers){if(t.off>0){t.off-=dt;continue;}t.cd-=dt;if(t.cd>0)continue;const T=TYPES[t.type],m=s.m,R=rangeOf(t.type,t.els.length,m)+BAL.wallRange*Math.round((t.wy||0)/WALLH);let tg=null,bp=-1e9,t2=null,b2=-1e9;
    for(const e of s.enemies){if(e.hp<=0)continue;const d2=(e.x-t.x)**2+(e.z-t.z)**2;if(d2<=R*R&&sees(t.type,e,d2)){const pr=t.type==='canon'?e.hp:-e.rem;
      if(pr>bp){b2=bp;t2=tg;bp=pr;tg=e;}else if(pr>b2){b2=pr;t2=e;}}}
    if(!tg)continue;t.cd=T.cd*(1-m[TK[t.type]+'Cd']);t.aim=Math.atan2(tg.x-t.x,tg.z-t.z);s.events.push({k:'fire',id:t.id});
    const shot=(e,off,delay)=>{let tx=e.x,tz=e.z;if(T.splash){const lead=(e.stun>0?0:e.sp*(e.slow>0?.6:1)*T.fly)+off;tx=e.x+(e.dx||0)*lead;tz=e.z+(e.dz||0)*lead;}
      s.bombs.push({id:s.lid++,type:t.type,tid:e.id,x0:t.x,z0:t.z,h0:T.h+stackH(t.els.length)+(t.wy||0),tx,tz,u:-delay,els:t.els.slice()});};
    shot(tg,0,0);
    if(t.type==='mortier')for(let i=0;i<m.mMulti;i++)shot(tg,i?-3.8:3.8,.15*(i+1));
    if(t.type==='canon'&&m.cDouble)shot(tg,0,.6);
    if(t.type==='archer'&&m.aMulti&&t2)shot(t2,0,0);}
  for(const b of s.bombs){const T=TYPES[b.type];b.u+=dt/T.fly;if(!T.splash){const e=s.enemies.find(e=>e.id===b.tid);if(e){b.tx=e.x;b.tz=e.z;}}if(b.u>=1)impact(s,b);}
  s.bombs=s.bombs.filter(b=>b.u<1);
  // morts
  for(const e of s.enemies)if(e.hp<=0&&!e.leak){const gv=Math.max(1,Math.round((e.boss?120*(e.bt||1):(KINDS[e.k]||KINDS.b).g+s.m.goldKill)*bal(s).goldK));if(s.mode==='normal'&&!e.lastH)s.pot+=gv;else s.gold+=gv;s.kills++;if(e.bomb&&!s.client){s.pend.push({x:e.x,z:e.z,r:7,d:e.max*.35});objEnd(s,true,30+5*s.wave);}if(e.boss)s.bossKills++;s.events.push({k:'dead',x:e.x,z:e.z,el:e.el,boss:e.boss,air:e.k==='air',g:gv,pot:s.mode==='normal'&&!e.lastH});}
  s.enemies=s.enemies.filter(e=>e.hp>0);
  if(s.client)return; // un invité ne décide ni des vagues ni de la fin : l'hôte l'envoie
  objStep(s,dt);
  if(s.core<=0){s.core=0;s.over='lose';return;}
  if(s.phase==='wave'&&!s.queue.length&&!s.enemies.length){if(s.obj)objEnd(s,false,0);s.gold+=30+5*s.wave+s.m.waveBonus;if(s.mode==='normal')s.pot+=bal(s).potWave+bal(s).potWaveG*s.wave;s.pts+=bal(s).ptsW*(s.wave%5===0?2:1);s.events.push({k:'clear'});
    if(s.wave>=s.maxW){s.over='win';return;}s.phase='prep';s.next=genWave(s,s.wave+1);}}
// ---- mode normal : des défenses se posent, s'améliorent et s'adaptent toutes seules, payées par un pot commun
// Le pot se remplit avec l'or des ennemis tués par les défenses (les tiens comme les leurs) et un versement à chaque vague.
const nearPath=(t,p)=>{let m=1e9;for(const g of p.seg)m=Math.min(m,distSeg(t.x,t.z,g.a,g.b));return m;};
function potDo(s,fn){const g=s.gold;s.gold=s.pot;const ok=fn();s.pot=s.gold;s.gold=g;return ok;}
function autoDef(s,dt){if(s.mode!=='normal'||s.client||s.over)return;s.aiT-=dt;if(s.aiT>0)return;s.aiT=s.phase==='prep'?.7:1.5;
  // menace par chemin : ce qui est annoncé avant la vague (sans les groupes cachés), puis ce qui reste à venir et ce qui marche
  const th=PATHS.map(()=>({w:0,el:{},k:{}})),add=(p,el,k,w)=>{const t=th[p];if(!t)return;t.w+=w;t.el[el]=(t.el[el]||0)+w;t.k[k]=(t.k[k]||0)+w;};
  if(s.phase==='prep'){for(const g of s.next||[])if(!g.hidden)add(g.path,g.el,g.boss?'tank':g.k,g.boss?8:g.count*KINDS[g.k].w);}
  else{for(const q of s.queue)add(q.path,q.el,q.boss?'tank':q.k,q.boss?8:KINDS[q.k].w);for(const e of s.enemies)add(e.path,e.el,e.boss?'tank':e.k,e.boss?8:KINDS[e.k].w);}
  // on s'occupe du chemin le plus menacé par rapport à ce qui le couvre déjà
  const cov=PATHS.map(p=>s.towers.filter(t=>nearPath(t,p)<10));let best=-1,bs=0;
  th.forEach((t,i)=>{const sc=t.w/(1+cov[i].reduce((a,x)=>a+x.els.length,0));if(sc>bs){bs=sc;best=i;}});
  if(best<0)return;
  const T=th[best],near=cov[best],want=Object.keys(T.el).sort((a,b)=>T.el[b]-T.el[a]).map(e=>WEAKTO[e]),has=ty=>near.some(t=>t.type===ty),big=k=>(T.k[k]||0)>T.w*.25;
  // le type répond à ce qui arrive : archer contre les aériens, canon contre les tanks et les boss, mortier contre les foreurs
  const ty=big('air')&&!has('archer')?'archer':big('tank')&&!has('canon')?'canon':big('dig')&&!has('mortier')?'mortier'
    :TKEYS.slice().sort((a,b)=>near.filter(t=>t.type===a).length-near.filter(t=>t.type===b).length)[0];
  if(s.autoNew&&near.length<2+Math.floor(s.wave/3)&&s.pot>=placeCost(s,ty)){const p=PATHS[best];
    for(const f of[.88,.74,.6,.46,.32,.2])for(const sd of[1,-1]){const q=posAt(p,f*p.len),x=q[0]-q[3]*5.5*sd,z=q[1]+q[2]*5.5*sd;
      if(!canPlace(s,x,z)&&potDo(s,()=>place(s,ty,x,z,want[0]))){s.towers[s.towers.length-1].auto=true;return;}}}
  // sinon : améliorer la moins avancée de ses défenses sur ce chemin, dans l'élément qui bat ce qui arrive
  const mine=near.filter(t=>t.auto&&t.els.length<MAXEL*MAXLV).sort((a,b)=>a.els.length-b.els.length);
  for(const t of mine){const cn=e=>t.els.filter(x=>x===e).length,nd=new Set(t.els).size;
    const el=want.find(e=>cn(e)<MAXLV&&(cn(e)||nd<MAXEL))||[...new Set(t.els)].find(e=>cn(e)<MAXLV);
    if(el&&s.pot>=costOf(t.type,t.els.length)&&potDo(s,()=>upgrade(s,t.id,el)))return;}}
// ---- conseiller : l'élément le plus utile pour une défense à cet endroit, d'après ce qui arrive sur les chemins qu'elle couvre.
// Avant la vague il lit l'aperçu (sans les groupes cachés), pendant la vague ce qui reste à venir et ce qui marche. Renvoie null s'il n'a rien à dire.
function advise(s,x,z,els){const near=PATHS.map((p,i)=>nearPath({x,z},p)<12?i:-1).filter(i=>i>=0),cn=e=>els.filter(q=>q===e).length,nd=new Set(els).size;
  for(const scope of[near,null]){if(scope&&!scope.length)continue;const w={};let tot=0;const add=(p,el,k)=>{if(!scope||scope.includes(p)){w[el]=(w[el]||0)+k;tot+=k;}};
    if(s.phase==='prep'){for(const g of s.next||[])if(!g.hidden)add(g.path,g.el,g.boss?8:g.count*KINDS[g.k].w);}
    else{for(const q of s.queue)add(q.path,q.el,q.boss?8:KINDS[q.k].w);for(const e of s.enemies)add(e.path,e.el,e.boss?8:KINDS[e.k].w);}
    if(!tot)continue;let best=null,bs=-1;
    for(const e of ELS){const c=cn(e);if(c>=MAXLV||(!c&&nd>=MAXEL))continue;let sc=0;for(const t in w)sc+=w[t]*mult(e,t,false);sc*=1+.12*c; // léger avantage à l'élément déjà monté
      if(sc>bs){bs=sc;best=e;}}
    if(!best)return null;const top=Object.keys(w).sort((a,b)=>w[b]-w[a])[0];return{el:best,vs:top,share:Math.round(100*w[top]/tot),local:!!scope};}
  return null;}
// tir auto sur cible : vrai si un ennemi à portée est dans le viseur (même tolérance que l'aide à la visée)
function hasTarget(s,h){const cp=Math.cos(h.pitch),sy=Math.sin(h.pitch),fx=-Math.sin(h.yaw)*cp,fz=-Math.cos(h.yaw)*cp,ey=h.y+h.eye-.1;
  for(const e of s.enemies){if(e.hp<=0||e.bur)continue;const vx=e.x-h.x,vy=cyOf(e)-ey,vz=e.z-h.z,l=Math.hypot(vx,vy,vz);if(l>50||l<.5)continue;
    const pr=vx*fx+vy*sy+vz*fz;if(pr<=0)continue;if(pr/l>.9925||Math.sqrt(Math.max(0,l*l-pr*pr))<rOf(e))return true;}return false;}
// ---- réseau : l'hôte envoie l'état du monde en compact, les invités le recopient
const RUNK=['mRad','mDmg','mCd','mRange','mMulti','cDmg','cCd','cRange','cRico','cDouble','aDmg','aCd','aRange','aMulti','strong','spec','fxDur','coreHp','goldKill','waveBonus'];
const r1=v=>Math.round(v*10)/10;
function snap(s){return{t:r1(s.t),g:s.gold,c:s.core,w:s.wave,ph:s.phase==='prep'?0:1,ov:s.over==='win'?1:s.over==='lose'?2:0,p:s.pts,k:s.kills,b:s.bossKills,n:s.nid,gd:s.god?1:0,pt:Math.round(s.pot),md:s.mode==='normal'?1:0,an:s.autoNew?1:0,sm:s.storms.map(st=>[Math.round(st.x),Math.round(st.z),st.r||BAL.stormR]),hz:s.zones.filter(q=>q.hero).map(q=>[r1(q.x),r1(q.z),q.r,ELS.indexOf(q.el),r1(q.t),r1(q.pw||1)]),ob:s.obj?(s.obj.k==='bomb'?['b',s.obj.id,s.obj.path]:s.obj.k==='zone'?['z',r1(s.obj.x),r1(s.obj.z),r1(s.obj.got),r1(s.obj.t)]:['r',r1(s.obj.x),r1(s.obj.z),s.obj.car?1:0,r1(s.obj.t)]):0,wl:s.walls.map(i=>(i*4+s.wallSet[i]).toString(36)).join('.'),pi:s.pits.map(i=>(i*4+s.pit[i]).toString(36)).join('.'),
  m:RUNK.map(k=>s.m[k]),
  nx:(s.next||[]).map(g=>[g.path,ELS.indexOf(g.el),g.count,g.hidden?1:0,g.boss?(g.bt||1):0,KK.indexOf(g.k||'b')].join(',')).join(';'),
  e:s.enemies.map(e=>[e.id,ELS.indexOf(e.el),e.path,Math.round(e.d*10),Math.ceil(e.hp),(e.boss?1:0)|(e.slow>0?2:0)|(e.stun>0?4:0)|(e.burn>0?8:0)|(e.rev>0?16:0)|((e.bt||0)<<5)|(e.bomb?128:0)|(e.mark>0?256:0),KK.indexOf(e.k||'b')].concat(e.fm?[Math.round(e.x),Math.round(e.z)]:[]).join(',')).join(';'),
  q:s.queue.map(q=>[Math.round((q.t-s.t)*10),q.path,ELS.indexOf(q.el),q.boss?(q.bt||1):0,KK.indexOf(q.k||'b'),q.bomb?1:0].join(',')).join(';'),
  tw:s.towers.map(t=>[t.id,TKEYS.indexOf(t.type),Math.round(t.x*10),Math.round(t.z*10),t.els.map(e=>ELS.indexOf(e)).join(''),(t.auto?1:0)|(Math.round((t.wy||0)/WALLH)<<1)|(t.tmpT!==undefined?8:0)].join(',')).join(';')};}
// ce qui arrive du réseau n'est pas fiable : tout est vérifié avant d'être recopié
function applySnap(s,o){if(!o||typeof o!=='object')return;const num=(v,d)=>Number.isFinite(+v)?+v:d,rows=x=>typeof x==='string'&&x?x.split(';').slice(0,200).map(r=>r.split(',')):[];
  s.t=num(o.t,s.t);s.gold=num(o.g,s.gold);s.core=num(o.c,s.core);s.wave=Math.max(0,Math.min(99,num(o.w,s.wave)|0));s.phase=o.ph?'wave':'prep';
  s.over=o.ov===1?'win':o.ov===2?'lose':null;s.pts=num(o.p,s.pts);s.kills=num(o.k,s.kills);s.bossKills=num(o.b,s.bossKills);s.nid=num(o.n,s.nid);s.god=!!o.gd;s.pot=num(o.pt,0);s.mode=o.md?'normal':'hard';s.maxW=bal(s).waves;s.autoNew=o.an!==0;if(Array.isArray(o.hz))for(const v of o.hz.slice(0,6))if(Array.isArray(v)&&ELS[v[3]]&&[v[0],v[1],v[2],v[4]].every(Number.isFinite)){zoneAdd(s,v[0],v[1],Math.min(12,v[2]),ELS[v[3]],Math.min(30,v[4]));for(const q of s.zones)if(q.el===ELS[v[3]]&&Math.hypot(q.x-v[0],q.z-v[1])<1.6){q.t=Math.min(q.t,v[4]+.5);q.pw=num(v[5],1);}}
  s.storms=Array.isArray(o.sm)?o.sm.slice(0,4).filter(v=>Array.isArray(v)&&Number.isFinite(v[0]+v[1])).map(v=>({x:v[0],z:v[1],r:Number.isFinite(v[2])?Math.min(40,v[2]):BAL.stormR,t:1,zap:9})):[];
  {const ob=o.ob,had=s.obj?s.obj.k:null,n=i=>num(ob[i],0);let nw=null;if(Array.isArray(ob)){if(ob[0]==='b')nw={k:'bomb',id:n(1),path:Math.max(0,Math.min(2,n(2)|0))};else if(ob[0]==='z')nw={k:'zone',x:n(1),z:n(2),got:n(3),t:n(4)};else if(ob[0]==='r')nw={k:'relic',x:n(1),z:n(2),car:ob[3]?'x':null,t:n(4)};}
    if((nw?nw.k:null)!==had&&nw)s.events.push({k:'obj',t:'start',o:nw.k});s.obj=nw;}
  const terr=(o.wl||'')+'|'+(o.pi||'');if(typeof o.wl==='string'&&terr!==s.wlS){s.wlS=terr;const dec=(str,max)=>str?String(str).split('.').map(v=>parseInt(v,36)).filter(v=>v>=0&&(v>>2)<GN*GN&&WALK[v>>2]&&(v&3)).slice(0,max):[];
    const ws=dec(o.wl,BAL.wallMax),ps=dec(o.pi,BAL.pitMax);s.walls=ws.map(v=>v>>2);s.wallSet.set(HILL);for(const v of ws)s.wallSet[v>>2]=v&3;s.pits=ps.map(v=>v>>2);s.pit.fill(0);for(const v of ps)s.pit[v>>2]=Math.min(BAL.pitTop,v&3);refield(s);}
  if(Array.isArray(o.m))RUNK.forEach((k,i)=>{s.m[k]=num(o.m[i],0);});
  s.next=s.phase==='prep'?rows(o.nx).filter(r=>PATHS[+r[0]]&&ELS[+r[1]]).map(r=>({path:+r[0],el:ELS[+r[1]],count:num(r[2],1),hidden:r[3]==='1',boss:+r[4]>0,bt:Math.min(3,+r[4]|0),k:KK[+r[5]]||'b'})):null;
  const old={};for(const e of s.enemies)old[e.id]=e;
  s.enemies=rows(o.e).filter(r=>PATHS[+r[2]]&&ELS[+r[1]]&&Number.isFinite(+r[0])&&Number.isFinite(+r[3])&&Number.isFinite(+r[4])).map(r=>{const fl=+r[5]|0,boss=!!(fl&1),id=+r[0],d=+r[3]/10,kd=boss?'b':KK[+r[6]]||'b',K=KINDS[kd],bt=boss?((fl>>5)&3)||1:0;
    let e=old[id];if(!e){e={id,el:ELS[+r[1]],path:+r[2],d,sp:bt?BSP[bt]:(fl&128)?4:K.sp,bomb:!!(fl&128),bt,el0:ELS[+r[1]],ph:0,sum:6,stomp:8,k:kd,arm:kd==='tank'?bal(s).armor0+bal(s).armorG*s.wave:0,rev:0,atk:0,bur:false,ang:0,boss,off:offOf(id),slow:0,burn:0,stun:0,imm:0,x:0,z:0,fm:fmOf(kd),tc:null,ox:offOf(id)*.7,oz:offOf(id*3+1)*.7,dx:0,dz:0,rem:1e6,_n:1};}
    e.d=Math.abs(d-e.d)<2.5?e.d+(d-e.d)*.3:d;e.hp=+r[4];e.el=ELS[+r[1]];e.max=Math.max(enemyHp(bal(s),s.wave,kd,boss,s.players)*(bt?bal(s).bossT[bt-1]:1)*((fl&128)?BAL.bombHp:1),e.hp);
    e.slow=fl&2?Math.max(e.slow,.4):0;e.stun=fl&4?Math.max(e.stun,.3):0;e.burn=fl&8?Math.max(e.burn,.4):0;e.rev=fl&16?Math.max(e.rev,.4):0;e.mark=fl&256?Math.max(e.mark||0,.4):0;
    if(e.fm){const X=+r[7],Z=+r[8];if(Number.isFinite(X+Z)){if(e._n||Math.hypot(X-e.x,Z-e.z)>5){e.x=X;e.z=Z;e.tc=null;}else{e.x+=(X-e.x)*.25;e.z+=(Z-e.z)*.25;}}const rr=s.field[cellOf(e.x,e.z)];if(rr<1e8)e.rem=rr;}
    else{const q=posAt(PATHS[e.path],e.d);e.x=q[0]-q[3]*e.off;e.z=q[1]+q[2]*e.off;e.rem=PATHS[e.path].len-e.d;}e._n=0;return e;});
  s.queue=rows(o.q).filter(r=>PATHS[+r[1]]&&ELS[+r[2]]&&Number.isFinite(+r[0])).map(r=>({t:s.t+ +r[0]/10,path:+r[1],el:ELS[+r[2]],boss:+r[3]>0,bt:Math.min(3,+r[3]|0),k:KK[+r[4]]||'b',bomb:r[5]==='1'}));
  const ot={};for(const t of s.towers)ot[t.id]=t;
  s.towers=rows(o.tw).filter(r=>TKEYS[+r[1]]&&Number.isFinite(+r[0])&&Number.isFinite(+r[2])&&Number.isFinite(+r[3])).map(r=>{const id=+r[0],els=String(r[4]||'').split('').map(c=>ELS[+c]).filter(Boolean).slice(0,MAXEL*MAXLV);
    const t=ot[id]||{id,type:TKEYS[+r[1]],x:+r[2]/10,z:+r[3]/10,els:[],cd:.4,aim:0};t.els=els.length?els:['feu'];t.auto=!!(+r[5]&1);t.wy=(+r[5]>>1&3)*WALLH;t.tmpT=+r[5]&8?1:undefined;return t;});}
// l'état envoyé doit tenir dans la limite du salon : on retire d'abord la file d'attente, puis les ennemis les plus en arrière
function fitSnap(o,max){let n=JSON.stringify(o).length;if(n>max){n-=o.q.length;o.q='';}
  if(n>max&&o.e.length){const rows=o.e.split(';');o.e=rows.slice(0,Math.max(0,Math.floor(rows.length*(1-(n-max+24)/o.e.length)))).join(';');}return o;}

// joueur simulé : pose selon le type d'ennemi annoncé, contre l'élément, puis améliore
function mk(seed){let x=seed;return()=>(x=(x*16807)%2147483647)/2147483647;}
function spots(pi){const p=PATHS[pi],o=[];for(const f of[.9,.78,.66,.54,.42,.3])for(const sd of[1,-1]){const q=posAt(p,f*p.len);o.push([q[0]-q[3]*5.5*sd,q[1]+q[2]*5.5*sd]);}return o;}
const pcost=(s,ty)=>typeof placeCost==='function'?placeCost(s,ty):TYPES[ty].costs[0];
function bot(s,st,style){const gs=s.next.filter(g=>!g.hidden).sort((a,b)=>b.count-a.count);let guard=0,spent=true;
  while(spent&&guard++<60){spent=false;for(const g of gs){const pi=g.path>=0?g.path:(st.c=((st.c||0)+1)%3),p=PATHS[pi],cel=WEAKTO[g.el],dp=t=>{let m=1e9;for(const q of p.seg)m=Math.min(m,distSeg(t.x,t.z,q.a,q.b));return m;};
    const mine=s.towers.filter(t=>dp(t)<10),cap=style==='spam'?99:style==='deep'?2:2+Math.floor(s.wave/3);
    const ty=g.k==='air'?(st.i++%2?'archer':'canon'):g.k==='tank'||g.boss?'canon':g.k==='dig'?'mortier':['mortier','archer','canon'][st.i++%3];
    const free=spots(pi).find(q=>!canPlace(s,q[0],q[1]));
    if(free&&mine.length<cap&&s.gold>=pcost(s,ty)){if(place(s,ty,free[0],free[1],cel)){spent=true;continue;}}
    const ups=mine.filter(t=>t.els.length<9).sort((a,b)=>a.els.length-b.els.length);
    for(const t of ups){const cn=e=>t.els.filter(x=>x===e).length,ord=[...new Set(t.els)];let el=cn(cel)&&cn(cel)<3?cel:(!cn(cel)&&ord.length<3?cel:ord.find(e=>cn(e)<3));if(!el)continue;if(upgrade(s,t.id,el)){spent=true;break;}}}}}
const f=(v,d)=>v.toFixed(d).replace('.',',');
const HSPEC={
  terre:{k:[['Recharge du Rempart',3,60,'abCd',1.5,L=>f(BAL.rempartCd-1.5*L,1)+' s'],['Durée du Rempart',2,80,'kDur',3,L=>(BAL.rempartT+3*L)+' s'],['Rempart élargi',1,250,'kWide',1,L=>(L?7:5)+' blocs de large',1]],
    u:[['Rayon du Séisme',2,90,'uRad',2,L=>(BAL.quakeR+2*L)+' m'],['Étourdissement du Séisme',2,90,'uDur',.5,L=>f(BAL.quakeT+.5*L,1)+' s'],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Peau de pierre',3,80,'pA',.05,L=>'coups au contact −'+Math.round((1-BAL.rocArmor+.05*L)*100)+' %']]},
  elec:{k:[['Recharge de l\'Éclair',3,60,'abCd',1,L=>(BAL.dashCd-L)+' s'],['Longueur de l\'Éclair',2,80,'kLen',3,L=>(BAL.dashLen+3*L)+' m'],['Sillage électrique',1,250,'kTrail',1,L=>L?'laisse un champ d\'orage 3 s':'aucun sillage',1]],
    u:[['Durée de l\'Orage',2,90,'uDur',2,L=>(BAL.stormT+2*L)+' s'],['Rayon de l\'Orage',2,90,'uRad',3,L=>(BAL.stormR+3*L)+' m'],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Tirs en chaîne',2,120,'pA',1,L=>'saute sur '+(1+L)+' voisin'+(L?'s':'')]]},
  bois:{k:[['Recharge des Ronces',3,60,'abCd',1.5,L=>f(BAL.ronceCd-1.5*L,1)+' s'],['Rayon des Ronces',2,80,'abRad',1.5,L=>f(BAL.ronceR+1.5*L,1)+' m'],['Durée des Ronces',2,90,'kDur',2,L=>(BAL.ronceT+2*L)+' s']],
    u:[['Durée des Gardiens',2,90,'uDur',5,L=>(BAL.guardT+5*L)+' s'],['Quatrième Gardien',1,250,'uExtra',1,L=>(3+L)+' Gardiens',1],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Poison tenace',2,100,'pA',1.5,L=>f(2.5+1.5*L,1)+' s de poison par tir']]},
  feu:{k:[['Recharge du Brasier',3,60,'abCd',1,L=>(BAL.fbCd-L)+' s'],['Rayon du Brasier',2,80,'abRad',1.5,L=>f(BAL.fbR+1.5*L,1)+' m'],['Puissance du Brasier',3,90,'abDmg',.25,L=>'+'+25*L+' %']],
    u:[['Météores en plus',2,110,'uExtra',2,L=>(BAL.metN+2*L)+' météores'],['Rayon des Météores',2,90,'uRad',1,L=>(BAL.metR+L)+' m'],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Éclaboussures',2,100,'pA',.15,L=>Math.round((BAL.braiseSplash+.15*L)*100)+' % des dégâts autour de la cible']]},
  eau:{k:[['Recharge de la Marée',3,60,'abCd',1.5,L=>f(BAL.tideCd-1.5*L,1)+' s'],['Soin de la Marée',3,80,'kHeal',10,L=>(BAL.tideHeal+10*L)+' PV'],['Recul de la Marée',2,80,'kLen',2,L=>(BAL.tideKnock+2*L)+' m']],
    u:[['Durée du Déluge',2,90,'uDur',2,L=>(BAL.floodT+2*L)+' s'],['Cœur soigné',2,120,'uExtra',1,L=>'+'+(BAL.floodCore+L)+' au cœur'],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Source vive',2,100,'pA',3,L=>(BAL.ondRegen+3*L)+' PV par seconde']]},
  vent:{k:[['Recharge de la Rafale',3,60,'abCd',1,L=>(BAL.zephCd-L)+' s'],['Longueur du bond',2,80,'kLen',2,L=>(BAL.zephLen+2*L)+' m'],['Rafale qui repousse',1,250,'kPush',1,L=>L?'repousse les ennemis proches':'ne repousse pas',1]],
    u:[['Puissance du Tir perçant',2,110,'uDmg',.25,L=>'+'+25*L+' %'],['Largeur du Tir perçant',2,90,'uRad',.5,L=>f(BAL.perceR+.5*L,1)+' m'],['Charge de l\'ultime',2,100,'uCharge',.15,L=>'+'+15*L+' %']],
    p:[['Œil de faucon',2,100,'pA',.05,L=>'+'+Math.round((BAL.zephK+.05*L)*100)+' % au-delà de '+BAL.zephFar+' m']]}};

let bad=0,n=0,cost=0;for(const e of ELS)for(const b of['k','u','p'])for(const d of HSPEC[e][b]){n++;if(!(d[3] in M0)){bad++;console.log('bonus inconnu',e,d[3]);}const a=d[5](0),z=d[5](d[1]);if(a===z){bad++;console.log('affichage figé',e,d[0]);}for(let l=0;l<d[1];l++)cost+=d[2]*(l+1);}
console.log('cases propres aux héros:',n,'· problèmes',bad,'· coût moyen de la partie propre à un héros',Math.round(cost/ELS.length),'éclats');
const full=el=>{const m={};for(const b of['k','u','p'])for(const d of HSPEC[el][b])m[d[3]]=d[4]*d[1];return m;};
// Roc
{const q=posAt(PATHS[0],.45*PATHS[0].len);const go=m=>{const s=newSim('terre',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});const h=s.hero;h.x=q[0];h.z=q[1];h.yaw=Math.atan2(q[2],q[3]);ability(s,h);const n=s.walls.length;let t=0;while(s.walls.length&&t<40){step(s,1/60,{f:0,r:0});t+=1/60;}return n+' blocs, '+t.toFixed(0)+' s, recharge '+(BAL.rempartCd-(m.abCd||0))+' s';};console.log('Roc Rempart: de base',go({}),'· arbre complet',go(full('terre')));}
// Volt
{const go=m=>{const s=newSim('elec',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});const h=s.hero;h.x=-60;h.z=70;h.yaw=Math.PI/2;const x0=h.x;ability(s,h);storm(s,h);return Math.abs(h.x-x0).toFixed(0)+' m, sillage '+s.zones.filter(z=>z.el==='elec').length+' zones, orage '+s.storms[0].t+' s sur '+s.storms[0].r+' m';};console.log('Volt: de base',go({}),'· arbre complet',go(full('elec')));}
// Sylve
{const go=m=>{const s=newSim('bois',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});const h=s.hero;h.x=-60;h.z=70;brambles(s,h,null);guardians(s,h);const z=s.zones[0];return 'ronces '+z.r+' m / '+z.t+' s, '+s.towers.length+' gardiens pour '+s.towers[0].tmpT+' s';};console.log('Sylve: de base',go({}),'· arbre complet',go(full('bois')));}
// Braise
{const go=m=>{const s=newSim('feu',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});meteors(s,s.hero);return s.rain[0].n+' météores de '+s.rain[0].r+' m, recharge Brasier '+(BAL.fbCd-(m.abCd||0))+' s';};console.log('Braise: de base',go({}),'· arbre complet',go(full('feu')));}
// Ondine
{const go=m=>{const s=newSim('eau',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});const h=s.hero;h.hp=10;s.core=10;tide(s,h,null);const hp=h.hp;deluge(s,h);return 'Marée +'+(hp-10)+' PV, Déluge '+s.flood+' s et cœur +'+(s.core-10);};console.log('Ondine: de base',go({}),'· arbre complet',go(full('eau')));}
// Zéphyr
{const go=m=>{const s=newSim('vent',mk(3),m,'hard');s.wave=1;s.phase='wave';s.queue.push({t:99,path:0,el:'feu',boss:false,k:'b'});const h=s.hero;h.x=-60;h.z=70;h.yaw=Math.PI/2;const x0=h.x,z0=h.z;ability(s,h);const d=Math.hypot(h.x-x0,h.z-z0);perce(s,h);const ev=s.events.find(e=>e.k==='perce');return 'bond '+d.toFixed(0)+' m, recharge '+h.ab+' s, tir perçant '+(ev?ev.w.toFixed(1):'?')+' m de large';};console.log('Zéphyr: de base',go({}),'· arbre complet',go(full('vent')));}

{let n=0,l=[0,0,0,0];for(let i=0;i<GN*GN;i++){l[HILL[i]]++;if(HILL[i])n++;}console.log('collines: cases',n,'· par niveau',l.slice(1).join('/'));
 const s=newSim('feu',mk(3),{},'hard');let reach=0;for(const p of PATHS){const q=p.pts[0];if(s.field[cellOf(q[0],q[1])]<1e8)reach++;}console.log('portails reliés au cœur',reach,'/3');
 const i=Array.from(HILL).findIndex(v=>v===2),x=cellX(i),z=cellZ(i);s.gold=999;console.log('défense sur colline:',place(s,'archer',x,z,'feu'),'hauteur',s.towers[0]&&s.towers[0].wy,'· mur refusé:',checkWalls(s,x,z,x,z).why,'· creuser refusé:',checkDig(s,x,z,x,z).why);
 const c=newSim('feu',mk(3),{},'hard');c.client=true;applySnap(c,snap(s));let same=true;for(let k=0;k<GN*GN;k++)if(c.wallSet[k]!==s.wallSet[k])same=false;console.log('invité voit le même relief',same);}
// 4) équilibre
function runM(mode,hero,build,N){let w=0,wv=0,co=0,bad=false;for(let sd=1;sd<=N;sd++){const s=newSim('feu',mk(sd*7919),{},mode),st={i:0};let g=0,pt=0;
  while(!s.over&&g++<4000000){if(s.phase==='prep'){pt+=1/30;if(build)bot(s,st,'mixte');if(mode!=='normal'||pt>6){pt=0;startWave(s);}}
    if(hero){const c=s.enemies.filter(e=>!e.bur);if(c.length){const e=c.reduce((a,b)=>a.rem<b.rem?a:b);hurtE(e,hero/30*(1+lvl(s,s.wave)*.05),true,true);}}
    step(s,1/30,{f:0,r:0});if(g%300===0&&(!Number.isFinite(s.core+s.gold+s.pot)||s.enemies.some(e=>!Number.isFinite(e.x+e.z+e.hp+e.rem))))bad=true;}
  if(s.over==='win')w++;wv+=s.wave;co+=s.core;}
  return (mode+(build?'+joueur':'')).padEnd(14)+' héros '+String(hero).padStart(2)+': gagne '+w+'/'+N+' · vague moy '+(wv/N).toFixed(1)+' · cœur '+(co/N).toFixed(1)+(bad?' · NaN!':'');}
console.log(runM('hard',0,true,4));console.log(runM('hard',15,true,4));console.log(runM('normal',0,true,3));console.log(runM('normal',30,true,3));
