// capture de la V12.8 à la taille du téléphone (966 × 366) : Braise (feu, le héros choisi) dans le Hall des héros, entouré des cinq autres.
//   usage : node tests/braiseshot.js [sortie=shots/braise-hall.png]   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shots/braise-hall.png';
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
  await p.addInitScript(() => {
    window.__keep = true;
    window.__autoPanel = false;
    window.__nodemo = true;
  });
  await p.goto('file://' + path.resolve('construit/test3d.html'));
  await p.waitForTimeout(2500);
  // le Hall posé au milieu de l'île ; le joueur se place devant Braise, à 4,4 m (le Hall est à l'échelle de son niveau), et le regarde (tenu sur place)
  const r = await p.evaluate(() => {
    const g = __g(),
      L = g.LB;
    L.tx = 0;
    L.tz = 2;
    g.vilPlace('hall', 0, 2, Math.PI);
    g.lobSync();
    let H = null;
    for (const v of g.vilV.values()) if (v.userData.heroes) H = v.userData.heroes.find(q => q.el === 'feu');
    if (!H) return 'pas de Hall';
    g.lob.updateMatrixWorld(true);
    const P = new THREE.Vector3();
    H.av.getWorldPosition(P);
    const a = Math.atan2(-H.av.matrixWorld.elements[8], -H.av.matrixWorld.elements[10]) + 0.35,
      x = P.x + Math.sin(a) * 4.4,
      z = P.z + Math.cos(a) * 4.4;
    window.__hold = setInterval(() => {
      L.x = x;
      L.z = z;
      L.yaw = Math.atan2(x - P.x, z - P.z);
      L.pitch = 0.2;
      L.y = g.walkAt(x, z, 1e9);
      L.vy = 0;
    }, 8);
    return 'Braise en ' + P.x.toFixed(1) + ' ' + P.y.toFixed(1) + ' ' + P.z.toFixed(1);
  });
  await p.addStyleTag({ content: '#toast{display:none!important}' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out });
  console.log(r, '· capture', out, '· erreurs', errs.length, errs.join('\n'));
  await b.close();
})();
