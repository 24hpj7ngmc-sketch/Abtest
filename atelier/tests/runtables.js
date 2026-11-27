// test des tables du lobby (V11.1, interface/tables.js) : mêmes valeurs avec le jeu collé et sans lui ; tout vient du jeu (V11.2) ; une valeur abîmée venue du jeu est refusée, une valeur saine est prise.   usage : node tests/runtables.js   (< 1 s, sans navigateur)
const fs=require('fs'),vm=require('vm');let bad=0;const ok=(n,c,d)=>{if(!c)bad++;console.log((c?'ok  ':'RATÉ ')+n+(c||d===undefined?'':' — '+JSON.stringify(d)));};
const src=fs.readFileSync('src/interface/tables.js','utf8')+'\n;__out({ELS,EL,BEATS,WEAKTO,CAMPK,CAMPN,CAMPW,CAMPS,KINDS,KIT,BAL,BALN});';
const run=I=>{let o;vm.runInNewContext(src,{IleDesCinq:I,__out:x=>o=x,Number,Array});return o;};
const ile=fs.readFileSync('ile/ile-pour-lobby.js','utf8'),m=ile.match(/TABLES = (\{.*?\});/),T=m?JSON.parse(m[1]):null;
ok('le jeu collé publie ses tables ('+(T?Object.keys(T).join(', '):'introuvables')+')',!!T&&Array.isArray(T.ELS)&&!!T.EL);
const a=run(undefined),b=run({tables:T||{}});
// si ce contrôle rate après un recollage, le jeu a changé un chiffre que le lobby affiche : c'est voulu (le jeu fait foi), il suffit de relire les textes concernés puis de mettre la copie à jour
const diff=[];const cmp=(x,y,p)=>{if(x&&typeof x==='object'){for(const k in x)cmp(x[k],y&&y[k],p+'.'+k);}else if(x!==y)diff.push(p.slice(1)+' : '+x+' → '+y);};cmp(a,b,'');
ok('la copie du lobby dit la même chose que le jeu collé',diff.length===0,diff.slice(0,12));
ok('cinq héros, chacun avec son nom, sa couleur, son style',a.ELS.length===5&&a.ELS.every(e=>a.EL[e]&&a.EL[e].hero&&/^#[0-9a-f]{6}$/.test(a.EL[e].c)&&a.KIT[e]&&a.KIT[e].tag&&a.BEATS[e]&&a.WEAKTO[e]));
ok('campagne : quatre niveaux, vingt vagues, un attaquant spécial nommé par type',a.CAMPN===4&&a.CAMPW===20&&a.CAMPK.length===4&&a.ELS.every(e=>a.KINDS[a.CAMPS[e]]&&a.KINDS[a.CAMPS[e]].n));
ok('aucun réglage manquant (ni undefined, ni NaN)',Object.values(a.BAL).every(Number.isFinite)&&Number.isFinite(a.BALN.waves));
// depuis L'Île des Cinq V1.1 le jeu publie tout ce que le lobby lit : si ce contrôle rate après un recollage, une table ou une clé a disparu du jeu et le lobby est retombé sur sa copie
const manque=[];const vient=(t,copie,p)=>{if(Array.isArray(copie)){if(!Array.isArray(t)||t.length!==copie.length)manque.push(p.slice(1));}else if(copie&&typeof copie==='object'){for(const k in copie)vient(t&&typeof t==='object'?t[k]:undefined,copie[k],p+'.'+k);}else if(typeof t!==typeof copie||(typeof t==='number'&&!Number.isFinite(t)))manque.push(p.slice(1));};
for(const nom of['EL','BEATS','CAMPK','CAMPN','CAMPW','CAMPS','KINDS','KIT','BAL','BALN'])vient(T&&T[nom],a[nom],'.'+nom);
ok('tout ce que le lobby lit vient du jeu collé (rien ne retombe sur la copie)',manque.length===0,manque.slice(0,12));
const c=run({tables:{EL:{feu:{n:5,c:null}},BAL:{gun:'x',crit:NaN,heroHp:120,inconnu:9},CAMPK:[1,2],KIT:'oui',BALN:{waves:25}}});
ok('une valeur abîmée venue du jeu est refusée (la copie reste)',c.EL.feu.n==='Feu'&&c.EL.feu.c===a.EL.feu.c&&c.BAL.gun===a.BAL.gun&&c.BAL.crit===a.BAL.crit&&c.CAMPK.join()===a.CAMPK.join()&&c.KIT.feu.tag===a.KIT.feu.tag&&c.BAL.inconnu===undefined,c.BAL);
ok('une valeur saine venue du jeu est prise',c.BAL.heroHp===120&&c.BALN.waves===25);
console.log('ratés',bad,'· erreurs 0');
