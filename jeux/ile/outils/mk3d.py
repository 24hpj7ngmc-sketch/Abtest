# fabrique la page d'aperçu 3D : le jeu tel quel, avec three-lite (moteur d'aperçu local) à la place de three.js
import sys
src=sys.argv[1] if len(sys.argv)>1 else 'construit/fragment.html'
out=sys.argv[2] if len(sys.argv)>2 else 'construit/test3d.html'
h=open(src).read()
tag='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert h.count(tag)==1
h=h.replace(tag,'<script>'+open('gfx/three-lite.js').read()+'</script>')
h=h.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Barlow:wght@400;600&display=swap">','')
a="requestAnimationFrame(frame);\n})();";assert h.count(a)==1
h=h.replace(a,"window.__g=()=>({sim,net,tool,placing,placeType,save,wheelCtx,tuto,SHOP,shopNear,scene,camera,renderer,views,dev,PREP,K,MODELS,step,inp,place,upgrade,startWave,genWave,opOf,opBuilt,botLaneInfo,botSync,botList,BAL,BOATS,PATHS,posAt,HILL,cellX,cellZ,setTool,dig,addWalls,KINDS,SND,feel,gun,HOLD,held,motes,gulls,live,portals,flying,WT,setWeap,getWeap:()=>tWeap,aimOn,aimZoom,aimSet,getAim:()=>({aim,aimHold,fireQ,fov:fovNow,freeK}),openTree,heroMods,newSim,setCamp,campOf,finish,CAMPK,CAMPS,CAMPT,campDeath,kidOf,send,renfort,canPlace,gameWeap,botShop,runBuy,TREES,hire,hiredOf,hireCost,HIREP,hireOpen,setTheme,themeG,getTheme:()=>themeNow,persist,RULES,RULEP,rulesOpen,guideShow,getRulesNear:()=>rulesNear,GAINS,PAYK,flameShot,fallK,hasTarget,LOBBY,MULTI,multiEnvoi,versLobby,gameMode,begin,paieShow,getPartie:()=>({partieN,butin,runObj}),quitGame,ciel,CIEL,cielOn,cielTap,cielGround,cellOf,CIEL_BOUTIQUES,cielReady,checkWalls,checkDig,getArs:()=>arsenal,setArs:a=>{arsenal=a;armApply();drawSub();},getArmUp:()=>armUp,armBuy,openArmes,armApply,ARMUP,ARMK,ARMP,armOf,drawSub,arsOpen,armHit,getArmNear:()=>armNear,armPeer,armPres,heroStep,doAct,mult,BEATS,renfortF:renfort,charge,hurtHero,heroHpOf,quake,tide,deluge,isolated,auraStep,tintUlt,voieNom,gardNear,ability,perce,ULT,liftable,lift,lobbyEl,armDefault,ELS,EL,KIT,getArmZ:()=>armZ.length,getRun:()=>({bob,spk,gunEl,fov:camera.fov,rz:camera.rotation.z}),setSpk:v=>{spk=v;}});requestAnimationFrame(frame);\n})();")
a2='gfxLv > 0) {';assert h.count(a2)==1;h=h.replace(a2,'gfxLv > 0 && !window.__keep) {')
a3='\nrenderer.render(scene, camera);\n}';assert h.count(a3)==1,h.count(a3);h=h.replace(a3,'\nif(!window.__norender)renderer.render(scene,camera);window.__frames=(window.__frames||0)+1;\n}')
h=h.replace('<div id="stage">','<script>if(window.__autoPanel===undefined)window.__autoPanel=true;if(!window.__guide)window.__noguide=true;</script><div id="stage">',1)
h=h.replace('<script>(function(){','<script>window.__keep=true;(function(){',1) if '<script>(function(){' in h else h
open(out,'w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html{color-scheme:light}:root{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+h+'</body></html>')
print('ok',out,len(h))
