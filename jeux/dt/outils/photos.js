// photos des armes pour le menu : chaque arme seule (sans gants ni manches), de profil, rendue ici sur fond magenta → photos.py en fait des PNG transparents (gfx/photos.js)
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const errs=[];
  const p=await (await b.newContext({viewport:{width:966,height:366}})).newPage();p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve('test3d.html'));await p.waitForTimeout(600);
  const out=await p.evaluate(()=>{const S0=0x010203,W=480,H=180,r={};
    const cv=document.createElement('canvas');const R=new THREE.WebGLRenderer({canvas:cv,antialias:false,preserveDrawingBuffer:true});R.setPixelRatio(1);R.setSize(W,H,false);
    for(const k of['fusil','pistolet','assaut','sniper','pompe','lance']){const rec=MODELS['vm.'+k]({K,H:{sleeve:S0,sleeveD:S0,glove:S0,gloveD:S0}});
      // on retire tout ce qui est gant ou manche (couleur témoin)
      for(const pt of rec.parts){const it=pt.b.items;for(let i=it.length-1;i>=0;i--){const o=it[i].o;if(o.c===S0||o.c2===S0||o.nophoto)it.splice(i,1);}}
      const pr=K.prep(rec,rec.bake||{}),o=K.inst(pr,{cast:false,recv:false});
      const sc=new THREE.Scene();sc.background=new THREE.Color(0xff00ff);sc.add(o);
      sc.add(new THREE.HemisphereLight(0xeef4ff,0x5a5a55,.95));const sd=rec.photo||1,d=new THREE.DirectionalLight(0xffffff,.9);d.position.set(3*sd,4,-1.5);sc.add(d);sc.add(d.target);
      const mn=pr.min,mx=pr.max,c=[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2],len=mx[2]-mn[2],hh=mx[1]-mn[1];
      const fov=10,t=Math.tan(fov/2*Math.PI/180),dist=Math.max(len/2/(t*W/H),hh/2/t)*1.12+.3,dir=[sd,.14,-.1],l=Math.hypot(...dir);
      const cam=new THREE.PerspectiveCamera(fov,W/H,.05,50);cam.position.set(c[0]+dir[0]/l*dist,c[1]+dir[1]/l*dist,c[2]+dir[2]/l*dist);cam.lookAt(new THREE.Vector3(c[0],c[1],c[2]));
      R.render(sc,cam);r[k]=cv.toDataURL('image/png');if(sd<0)r[k+'.flip']=1;}
    return r;});
  fs.mkdirSync('/tmp/photos',{recursive:true});for(const k in out){if(k.endsWith('.flip'))continue;fs.writeFileSync('/tmp/photos/'+k+'.png',Buffer.from(out[k].split(',')[1],'base64'));if(out[k+'.flip'])fs.writeFileSync('/tmp/photos/'+k+'.flip','1');else if(fs.existsSync('/tmp/photos/'+k+'.flip'))fs.unlinkSync('/tmp/photos/'+k+'.flip');}
  console.log(errs.length?errs.join('\n'):'erreurs 0',Object.keys(out));await b.close();})();
