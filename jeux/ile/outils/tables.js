// node outils/tables.js construit/all.js  →  (sortie) les tables publiques du jeu, en JSON : celles nommées dans src/TABLES, tirées des règles elles-mêmes (la partie //<SIM> du script)
const fs = require('fs');
const js = fs.readFileSync(process.argv[2], 'utf8');
const a = js.indexOf('//<SIM>'),
  b = js.indexOf('//</SIM>');
if (a < 0 || b < 0) throw new Error('repères //<SIM> introuvables');
const noms = fs
  .readFileSync(__dirname + '/../src/TABLES', 'utf8')
  .split('\n')
  .map(l => l.replace(/#.*/, '').trim())
  .filter(Boolean);
const T = new Function(js.slice(a, b) + '\nreturn {' + noms.map(n => n + ':typeof ' + n + "==='undefined'?undefined:" + n).join(',') + '};')();
for (const n of noms) if (T[n] === undefined) throw new Error('table inconnue : ' + n);
process.stdout.write(JSON.stringify(T));
