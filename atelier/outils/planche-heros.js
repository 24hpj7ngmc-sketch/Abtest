#!/usr/bin/env node
// PLANCHE DE HÉROS (V12.8) : l'atelier de modélisation des héros. Rend un modèle de héros sur une seule image PNG, à la lumière du jeu
// (moteur d'aperçu gfx/preview.html : mêmes lumières, même sol) : face, trois-quarts, profil, dos, gros plan du visage, vue à hauteur
// d'œil, lisibilité de loin (≈ 120 px de haut, puis à 30 m sur l'écran du téléphone) et silhouettes noires (le test des studios :
// un bon héros se reconnaît à sa seule ombre). Un modèle de comparaison peut être posé à côté (par défaut le gardien d'un autre élément).
// Les héros regardent vers −Z : la face est donc l'azimut 180° du moteur d'aperçu.
//   usage (depuis atelier/) : node outils/planche-heros.js <sortie.png> [clé=valeur …]
//   modele=hero.braise   el=feu   fichiers=gfx/models/shared.js,gfx/models/braise.js   cmp=hero.avatar:eau (cmp=0 : sans)
//   cmpfichiers=gfx/models/mains.js   t=0 (instant de l'animation)   arme=1 (la variante qui tient une arme)
// Affiche les triangles et les pièces du modèle et du modèle de comparaison.
const { chromium } = require('playwright');
const path = require('path'),
  fs = require('fs');
const [out, ...kv] = process.argv.slice(2);
if (!out) {
  console.log(
    'usage : node outils/planche-heros.js <sortie.png> [modele=hero.braise] [el=feu] [fichiers=…] [cmp=hero.avatar:eau] [t=0] [arme=1]'
  );
  process.exit(1);
}
const opt = {};
for (const a of kv) {
  const i = a.indexOf('=');
  opt[a.slice(0, i)] = a.slice(i + 1);
}
const GFX = path.join(__dirname, '..', 'gfx'),
  modele = opt.modele || 'hero.braise',
  el = opt.el || 'feu',
  fichiers = (opt.fichiers || 'gfx/models/shared.js,gfx/models/braise.js').split(','),
  cmp = opt.cmp === '0' ? null : (opt.cmp || 'hero.avatar:eau').split(':'),
  cmpF = (opt.cmpfichiers || 'gfx/models/mains.js').split(','),
  t = +opt.t || 0,
  ctx0 = Object.assign({ el }, opt.arme ? { arme: 1 } : {});
const tous = [...new Set(['gfx/models/shared.js', ...fichiers, ...(cmp ? cmpF : [])])].map(f =>
  path.resolve(path.join(__dirname, '..'), f)
);
// les planches : une liste de rendus (chacun = un appel du moteur d'aperçu), puis la mise en page
const RENDUS = [
  {
    id: 'vues',
    names: [modele],
    views: [
      { az: 180, el: 4, d: 1.2, label: 'face' },
      { az: 215, el: 8, d: 1.2, label: 'trois-quarts avant' },
      { az: 90, el: 4, d: 1.2, label: 'profil (côté droit)' },
      { az: 20, el: 12, d: 1.2, label: 'dos' }
    ],
    tw: 482,
    th: 560,
    cols: 4
  },
  {
    id: 'visage',
    names: [modele],
    views: [
      // cadré sur la tête (à 0,8 m de l'axe du héros, à hauteur des yeux), pas sur la boîte englobante : l'écharpe de Volt la décale
      { az: 192, el: 4, abs: 1, dAbs: 0.8, ty: 1.66, label: 'gros plan du visage' },
      { az: 160, eye: 1.7, d: 1.6, ty: 1.1, label: 'vu par un coéquipier (œil à 1,70 m, 3,5 m)' }
    ],
    tw: 420,
    th: 400,
    cols: 2
  },
  {
    id: 'loin',
    names: cmp ? [modele, cmp[0]] : [modele],
    ctxs: cmp ? [ctx0, { el: cmp[1] }] : [ctx0],
    views: [
      { az: 200, eye: 1.7, d: 3.4, label: 'de loin (≈ 120 px de haut)' + (cmp ? ' · à droite : ' + cmp.join(' ') : '') }
    ],
    tw: 420,
    th: 380,
    cols: 1,
    spacing: 1.6
  },
  {
    id: 'trente',
    names: [modele],
    views: [{ az: 205, eye: 1.7, d: 14.3, fov: 72, label: 'à 30 m, sur le téléphone (966 × 366, champ 72°)' }],
    tw: 966,
    th: 366,
    cols: 1
  },
  {
    id: 'ombre',
    names: cmp ? [modele, cmp[0]] : [modele],
    ctxs: cmp ? [ctx0, { el: cmp[1] }] : [ctx0],
    views: [
      { az: 180, el: 2, d: 1.5, label: 'silhouettes : face' },
      { az: 90, el: 2, d: 1.5, label: 'silhouettes : profil' }
    ],
    tw: 330,
    th: 400,
    cols: 2,
    spacing: 1.3,
    ombre: true
  }
];
(async () => {
  const br = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [],
    images = {},
    rapport = [];
  for (const R of RENDUS) {
    const p = await br.newPage({ viewport: { width: 1600, height: 1000 } });
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => {
      if (m.type() === 'error') errs.push(m.text());
    });
    await p.goto('file://' + path.join(GFX, 'preview.html'));
    for (const f of tous) await p.addScriptTag({ path: f });
    const cfg = {
      names: R.names,
      ctxs: R.ctxs || [ctx0],
      views: R.views,
      t,
      tw: R.tw,
      th: R.th,
      cols: R.cols,
      ref: false,
      spacing: R.spacing
    };
    if (R.ombre) {
      cfg.ground = false;
      cfg.bg = 0xffffff;
    }
    const res = await p.evaluate(
      ([c, ombre]) => {
        const r = window.runPreview(c),
          s = document.getElementById('sheet');
        if (ombre) {
          // silhouette : tout ce qui n'est pas le fond blanc devient noir (le bandeau du titre est gardé)
          const g = s.getContext('2d'),
            im = g.getImageData(0, 0, s.width, s.height),
            d = im.data;
          for (let i = 0; i < d.length; i += 4) {
            const y = Math.floor(i / 4 / s.width) % c.th;
            if (y < 18) continue;
            const fond = d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235;
            d[i] = d[i + 1] = d[i + 2] = fond ? 255 : 20;
          }
          g.putImageData(im, 0, 0);
        }
        return { r, url: s.toDataURL('image/png') };
      },
      [cfg, !!R.ombre]
    );
    images[R.id] = res.url;
    if (R.id === 'loin') rapport.push(...res.r.report);
    await p.close();
  }
  // la mise en page : bandeau, vues (4), visage + coéquipier, loin + 30 m, silhouettes
  const p = await br.newPage({ viewport: { width: 1600, height: 1000 } });
  const titre =
    modele +
    ' [' +
    el +
    (opt.arme ? ', tient une arme' : '') +
    ']  ·  ' +
    rapport.map(l => l.split(' · boîte')[0]).join('   |   ');
  const url = await p.evaluate(
    async ([I, titre]) => {
      const ch = u =>
        new Promise(r => {
          const im = new Image();
          im.onload = () => r(im);
          im.src = u;
        });
      const V = await ch(I.vues),
        F = await ch(I.visage),
        L = await ch(I.loin),
        T = await ch(I.trente),
        O = await ch(I.ombre);
      const W = V.width,
        H2 = Math.max(F.height, L.height, O.height),
        H = 34 + V.height + 4 + H2 + 4 + T.height + 8,
        c = document.createElement('canvas');
      c.width = Math.max(W, F.width + L.width + O.width + 8);
      c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#12303a';
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffe08a';
      g.font = 'bold 15px sans-serif';
      g.fillText(titre, 10, 22, c.width - 20);
      g.drawImage(V, 0, 34);
      const y = 34 + V.height + 4;
      g.drawImage(F, 0, y);
      g.drawImage(L, F.width + 4, y);
      g.drawImage(O, F.width + L.width + 8, y);
      // à 30 m : l'écran du téléphone tel quel, puis le milieu agrandi trois fois (pixels francs)
      const y3 = y + H2 + 4;
      g.drawImage(T, 0, y3);
      g.imageSmoothingEnabled = false;
      g.drawImage(T, T.width / 2 - 80, 18 + (T.height - 18) / 2 - 45, 160, 90, T.width + 4, y3, 480, 270);
      g.fillStyle = '#ffe08a';
      g.font = '13px sans-serif';
      g.fillText('à 30 m, agrandi × 3', T.width + 10, y3 + 288);
      return c.toDataURL('image/png');
    },
    [images, titre]
  );
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(rapport.join('\n'));
  console.log('planche : ' + out);
  await br.close();
  if (errs.length) {
    console.log('ERREURS :\n' + [...new Set(errs)].join('\n'));
    process.exit(2);
  }
})();
