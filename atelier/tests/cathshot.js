// captures de la cathédrale des héros (le Hall, V13.4) dans le village d'exemple, à la taille du téléphone (966 × 366).
//   usage : node tests/cathshot.js <préfixe> [niveau=6] [vues=dehors,loin,pres,nef,heros,haut]   (après ./mktest.sh ; ≈ 5 s par vue)
//   une vue = l'œil et le point regardé dans le repère du Hall (la porte côté +Z) ; « monde » : coordonnées du monde
const { chromium } = require('playwright');
const path = require('path');
const VUES = {
  dehors: { o: [9, 0, 23], c: [0, 10.5, 0] },
  loin: { o: [30, 6, 62], c: [0, 10, 0] },
  pres: { o: [3.5, 0, 15], c: [0, 6.5, 6] },
  porte: { o: [0, 0, 10.5], c: [0, 2.2, -4] },
  nef: { o: [0, 0, 6.2], c: [0, 3.3, -6] },
  heros: { o: [0.9, 0, 5.1], c: [3.4, 1.9, 4.1] },
  heros2: { o: [-1.0, 0, 0.4], c: [-3.4, 1.6, 1.0] },
  abside: { o: [0, 0, -1.5], c: [0, 5.2, -8] },
  voute: { o: [0, 0, 5.5], c: [0, 10, -2] },
  arriere: { o: [-24, 0, -26], c: [0, 9, 0] },
  haut: { o: [26, 30, 40], c: [0, 4, 0] }
};
(async () => {
  const pre = process.argv[2] || 'shots3d/cath-',
    niv = +process.argv[3] || 6,
    vues = (process.argv[4] || 'dehors,loin,pres,nef,heros,haut').split(',');
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  const ctx = await b.newContext({
    viewport: { width: 966, height: 366 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message.slice(0, 220)));
  p.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('console ' + m.text().slice(0, 200));
  });
  await p.addInitScript(() => {
    window.__keep = true;
    window.__autoPanel = false;
    window.__nodemo = true;
    window.__nohv = true;
  });
  await p.goto('file://' + path.resolve('construit/test3d.html'));
  await p.waitForTimeout(2000);
  const info = await p.evaluate(niv => {
    const g = __g();
    g.vilDemo();
    const B = g.save.vil.find(B => B.t === 'hall');
    B.l = niv;
    g.vilRe(B);
    g.lobSync();
    const v = g.vilV.get(B.id);
    let me = 0;
    v.traverse(o => {
      if (o.isMesh || o.isSprite) me++;
    });
    const pr = v.userData.m.userData.prep;
    return {
      tris: pr.tris,
      ch: pr.parts.map(q => Object.keys(q.gs).join('')).join(','),
      objets: me,
      cols: v.userData.cols.length
    };
  }, niv);
  console.log('Hall niveau', niv, '·', JSON.stringify(info));
  await p.addStyleTag({ content: '#toast,#gBub{display:none!important}' });
  for (const n of vues) {
    const V = VUES[n];
    if (!V) continue;
    await p.evaluate(V => {
      const g = __g(),
        L = g.LB,
        B = g.save.vil.find(B => B.t === 'hall'),
        o = g.vilMonde(B, V.o[0], V.o[2]),
        c = g.vilMonde(B, V.c[0], V.c[2]);
      clearInterval(window.__hold);
      window.__hold = setInterval(() => {
        L.x = o[0];
        L.z = o[1];
        L.y = g.walkAt(o[0], o[1], 1e9) + V.o[1];
        L.vy = 0;
        L.yaw = Math.atan2(o[0] - c[0], o[1] - c[1]);
        L.pitch = Math.atan2(B.y + V.c[1] - (L.y + 1.7), Math.hypot(o[0] - c[0], o[1] - c[1]));
      }, 8);
    }, V);
    await p.waitForTimeout(1600);
    await p.screenshot({ path: pre + n + '.png' });
  }
  const lab = await p.evaluate(() => (document.querySelector('#aLab b') || {}).textContent || '');
  console.log('étiquette :', lab, '· erreurs', errs.length, [...new Set(errs)].slice(0, 6).join('\n'));
  await b.close();
})();
