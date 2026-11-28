// test des tables du lobby (interface/tables.js) : elles viennent toutes du jeu collé, qui fait foi ; le lobby en garde les cinq héros, six types de campagne, les réglages cités dans ses textes.   usage : node tests/runtables.js   (< 1 s, sans navigateur)
const fs=require('fs'),vm=require('vm');let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
const src=fs.readFileSync('src/interface/tables.js','utf8')+'\n;__out({ELS,EL,BEATS,CAMPK,CAMPN,CAMPW,CAMPS,KINDS,KIT,BAL,BALN});';
const run=I=>{let o;vm.runInNewContext(src,{IleDesCinq:I,__out:x=>o=x,Number,Array,Object});return o;};
const ile=fs.readFileSync('ile/ile-pour-lobby.js','utf8'),m=ile.match(/TABLES = (\{.*?\});/),T=m?JSON.parse(m[1]):null;
ok('le jeu collé publie ses tables ('+(T?Object.keys(T).join(', '):'introuvables')+')',!!T&&Array.isArray(T.ELS)&&!!T.EL);
const a=run({tables:T});
ok('cinq héros, chacun avec son nom, sa couleur, son style',a.ELS.length===5&&a.ELS.every(e=>a.EL[e]&&a.EL[e].hero&&/^#[0-9a-f]{6}$/.test(a.EL[e].c)&&a.KIT[e]&&a.KIT[e].tag&&a.BEATS[e]));
ok('campagne : quatre niveaux, vingt vagues, un attaquant spécial nommé par type',a.CAMPN===4&&a.CAMPW===20&&a.CAMPK.length===4&&a.ELS.every(e=>a.KINDS[a.CAMPS[e]]&&a.KINDS[a.CAMPS[e]].n));
ok('les réglages cités dans les textes sont là (ni undefined, ni NaN)',['braiseSplash','crit','critK','dashCd','fbCd','gun','heroHp','quakeT','rempartCd','ronceCd','stormT','tideCd','voltSprint'].every(k=>Number.isFinite(a.BAL[k]))&&Number.isFinite(a.BALN.waves));
ok('le lobby garde les six types de la campagne (inc, soi, bro, gol, sem, tou)',Object.keys(a.KINDS).sort().join()==='bro,gol,inc,sem,soi,tou'&&Object.keys(a.CAMPS).length===6);
console.log('ratés',bad,'· erreurs 0');
