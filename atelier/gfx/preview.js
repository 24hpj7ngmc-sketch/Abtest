#!/usr/bin/env node
// Aperçu d'un modèle du kit.   node preview.js <sortie.png> <fichier(s).js,…> <nom[,nom…]> [clé=valeur …]
//   noms    : un ou plusieurs modèles côte à côte, ex. enemy.b   ou   enemy.b,enemy.tank
//   el=feu  : élément passé au modèle (feu, eau, bois, terre, elec). el=all → les cinq côte à côte
//   t=0.4   : instant de l'animation (secondes)            views=hero,back,side,close (défaut) | turn (8 angles) | top | large
//   zoom=0.5 : rapproche la caméra (2 = éloigne)        spacing=1.5 : écart entre modèles côte à côte        ref=0 : sans le repère de taille
//   fp=x,y,z[,rx,ry,rz] : outil tenu en main, placé à cet endroit devant la caméra du jeu (ex. fp=0.27,-0.23,-0.72)
//   toute autre clé=valeur est transmise telle quelle au modèle dans ctx (ex. els=feu,feu,eau  lvl=3)
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const [out,files,namesArg,...kv]=process.argv.slice(2);
if(!out||!files||!namesArg){console.log('usage : node preview.js <sortie.png> <fichier(s).js> <nom[,nom]> [clé=valeur …]');process.exit(1);}
const opt={};for(const a of kv){const i=a.indexOf('=');opt[a.slice(0,i)]=a.slice(i+1);}
let names=namesArg.split(','),ctxs=names.map(()=>({}));const pass=Object.assign({},opt);for(const k of['views','t','tw','th','cols','bg','ground','ref','spacing','fov','pathX','zoom','fp'])delete pass[k];
if(opt.el==='all'){const E=['feu','eau','bois','terre','elec'],n0=names[0];names=E.map(()=>n0);ctxs=E.map(e=>Object.assign({},pass,{el:e}));}else ctxs=names.map(()=>Object.assign({},pass));
const V={hero:{az:25,eye:1.7,d:1.25,dAdd:2.5,label:'vue du joueur (œil à 1,70 m)'},back:{az:205,el:22,d:1.7,label:'trois quarts arrière'},side:{az:90,el:6,d:1.6,label:'profil'},close:{az:12,el:8,d:.75,label:'gros plan de face'},
  top:{az:20,el:62,d:1.9,label:'vue de dessus'},large:{az:35,el:18,d:3.2,label:'vue large'},front:{az:0,el:5,d:1.5,label:'face'},portrait:{az:158,el:6,d:1.15,label:'portrait'}};
let views=(opt.views||'hero,back,side,close').split(',').flatMap(n=>n==='turn'?[0,45,90,135,180,225,270,315].map(a=>({az:a,el:14,d:1.6,label:'angle '+a+'°'})):[V[n]||V.hero]);
const cfg={names,ctxs,views,t:+opt.t||0,cols:opt.cols?+opt.cols:(views.length>4?4:2),tw:opt.tw?+opt.tw:(views.length>4?400:560),th:opt.th?+opt.th:(views.length>4?300:380)};
if(opt.bg)cfg.bg=parseInt(opt.bg,16);if(opt.ground==='0')cfg.ground=false;if(opt.ref==='0')cfg.ref=false;if(opt.spacing)cfg.spacing=+opt.spacing;if(opt.fp){cfg.fp=opt.fp.split(',').map(Number);cfg.tw=844;cfg.th=390;cfg.ref=false;}if(opt.fov)cfg.fov=+opt.fov;if(opt.zoom)cfg.zoom=+opt.zoom;if(opt.pathX)cfg.pathX=+opt.pathX;
(async()=>{const dir=__dirname,b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1200,height:800}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await p.goto('file://'+path.join(dir,'preview.html'));for(const f of files.split(',')){await p.addScriptTag({path:path.resolve(f)}).catch(e=>errs.push('chargement '+f+' : '+e.message));}
  let res=null;try{res=await p.evaluate(c=>window.runPreview(c),cfg);}catch(e){errs.push(String(e.message||e).split('\n')[0]);}
  if(res){await p.locator('#sheet').screenshot({path:out});console.log(res.report.join('\n'));console.log('total '+res.tris+' triangles · taille '+res.size.map(v=>v.toFixed(2)).join(' × ')+' m · image : '+out);if(res.shaderErrors.length)errs.push(...res.shaderErrors);}
  if(errs.length){console.log('ERREURS :\n'+[...new Set(errs)].join('\n'));}await b.close();process.exit(errs.length?2:0);})();
