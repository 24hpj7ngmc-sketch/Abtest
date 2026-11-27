# fabrique la page d'aperçu 3D : le jeu tel quel, avec three-lite (moteur d'aperçu local) à la place de three.js
import sys
src=sys.argv[1] if len(sys.argv)>1 else 'construit/ile-des-cinq.html'
out=sys.argv[2] if len(sys.argv)>2 else 'construit/test3d.html'
h=open(src).read()
# le fichier de L'Île des Cinq (son propre <script>, avec toute la page du jeu en texte) est mis de côté : les repères ci-dessous ne doivent toucher que le script du lobby
i0=h.find('<script id="ile">');i1=h.find('</script>',i0)+9 if i0>=0 else -1
ILE=h[i0:i1] if i0>=0 else '';h=h[:i0]+'<!--@ILE@-->'+h[i1:] if i0>=0 else h
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert h.count(tag)==1
h=h.replace(tag,'<script>'+open('gfx/three-lite.js').read()+'</script>')
h=h.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Barlow:wght@400;600&display=swap">','')
a="requestAnimationFrame(frame);\n})();";assert h.count(a)==1
h=h.replace(a,"window.__g=()=>({joy,LA,ARMES,armeSel,armeShow,armeNet,armePub,armeFrame,wPic,prepOf,net,save,voieOf,setVoie,hBase,VOIES,HT,hallDraw,HEROS,ROLE,wEl,heroMods,renderer,dev,PREP,K,MODELS,inp,BAL,KINDS,SND,LB,lob,lcam,lobSync,lobbyEnter,lobAct,LGAMES,vilPlace,vilV,TH,terrDraw,terrLocks,hAt,lobTool,CAT,lobLine,lobBar,flying,renom,terrSetR,upOpen,tavOpen,qFill,getRI:()=>RI,LWALK,MH,vilGround,walkAt,vilMigrate,ROADS,MASS,PLOTS,terraPlan,vilDemo,PAY,payBuild,mountH,ILR,envSet,getMH:()=>MHc,HV,hvGame,hvGrow,hvReady,hvLabel,hvTake,WT,armMods,armsOf,setWeap,getWeap:()=>tWeap,openTree,heroMods,ET,elMods,armNodes,getTab:()=>tTab,campOf,drawMode,CAMPK,CAMPS,mqRoom,TREES,toitBonus,toitGo,toitFin,toitBack,toitOpen,toitDraw,toitRang,persist,dayZ,getTR:()=>TR,toitEtat,lobNetSt,LN,VISIT,lobNet,islPack,islHome,islVisit,netOpen,netLine,lobSpawn,GUIDE,getGD:()=>GD,guideStart,guideEnd,guideNext,guideTalk,guideTopics,guideHome,GSTEPS,guideShow,hvSync,payOut,GAINS,PAYK,dayU,dayBoss,qGame,QT,kHome,kHall,lobOv,ileGo,ileOpts,ileMods,ileFin,ileBack,ileNet,ileTuto,ileRegl,getIR:()=>IR,HT,BOOST_G,payT});requestAnimationFrame(frame);\n})();")
h=h.replace('<div id="stage">','<script>if(window.__autoPanel===undefined)window.__autoPanel=true;if(!window.__guide)window.__noguide=true;</script><div id="stage">',1)
h=h.replace('<script>(function(){','<script>window.__keep=true;(function(){',1) if '<script>(function(){' in h else h
h=h.replace('<!--@ILE@-->',ILE)
open(out,'w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html{color-scheme:light}:root{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+h+'</body></html>')
print('ok',out,len(h))
