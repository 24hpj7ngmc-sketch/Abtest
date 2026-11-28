// captures de l'Arsenal (la salle d'armes, V13.5) dans le village d'exemple, à la taille du téléphone (966 × 366).
//   usage : node tests/arsenalshot.js <préfixe> [niveau=6] [vues=dehors,loin,porte,arme,forge]   (après ./mktest.sh ; ≈ 5 s par vue)
//   une vue = l'œil et le point regardé dans le repère de l'Arsenal (la porte côté +Z)
const { chromium } = require('playwright');
const path = require('path');
const VUES = {
  dehors: { o: [-6.5, 0, 16], c: [0, 5.5, 0] },
  loin: { o: [-30, 7, 30], c: [0, 6, 0] },
  pres: { o: [2.5, 0, 9.5], c: [0, 4.5, 4] },
  porte: { o: [0, 0, 7.2], c: [0, 2.0, -4] },
  dedans: { o: [0, 0, 3.6], c: [0, 2.0, -4.5] },
  arme: { o: [1.75, 0, 0.9], c: [3.25, 1.3, 0.2] },
  vitrine: { o: [-1.5, 0, 1.55], c: [-3.25, 1.15, 0.4] },
  facade: { o: [-10, 0, 17], c: [0.5, 6, 0] },
  arme2: { o: [-1.6, 0, 2.2], c: [-3.25, 1.3, 2.75] },
  forge: { o: [0.6, 0, 1.2], c: [-0.3, 1.4, -3.6] },
  cote: { o: [16, 0, -2], c: [0, 5, -1] },
  arriere: { o: [-12, 0, -16], c: [0, 6, 0] },
  haut: { o: [18, 22, 26], c: [0, 3, 0] }
};
(async () => {
  const pre = process.argv[2] || 'shots3d/ars-',
    niv = +process.argv[3] || 6,
    vues = (process.argv[4] || 'dehors,loin,porte,arme,forge').split(',');
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
    const B = g.save.vil.find(B => B.t === 'armes'),
      H = g.save.vil.find(B => B.t === 'hall');
    H.l = Math.max(H.l || 1, niv);
    g.vilRe(H);
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
      cols: v.userData.cols.length,
      expo: v.userData.expo.length
    };
  }, niv);
  console.log('Arsenal niveau', niv, '·', JSON.stringify(info));
  await p.addStyleTag({ content: '#toast,#gBub{display:none!important}' });
  for (const n of vues) {
    const V = VUES[n];
    if (!V) continue;
    await p.evaluate(V => {
      const g = __g(),
        L = g.LB,
        B = g.save.vil.find(B => B.t === 'armes'),
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
