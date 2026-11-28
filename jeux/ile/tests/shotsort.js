// capture de la V2.6 à la taille du téléphone (966 × 366) : la compétence de Braise (Orbe) avec l'élément choisi Eau.   usage : node tests/shotsort.js [sortie=shots/sort-eau.png]   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shots/sort-eau.png';
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
  await p.addInitScript(
    o => {
      window.__noCiel = true;
      window.ILE_LOBBY = o;
    },
    { heros: 'feu', elHeros: 'eau', mode: 'normal' }
  );
  await p.goto('file://' + path.resolve('construit/test3d.html'));
  await p.waitForTimeout(2500);
  await p.evaluate(() => {
    const g = __g(),
      s = g.sim,
      h = s.hero;
    s.heroGod = true;
    h.x = 0;
    h.z = 24;
    h.yaw = 0;
    h.pitch = -0.12;
    h.ab = 0;
    window.__hold = setInterval(() => {
      h.x = 0;
      h.z = 24;
      h.yaw = 0;
      h.pitch = -0.12;
    }, 8);
    g.ability(s, h, [0, h.x, h.z, h.yaw, 0, h.z - 11]);
  });
  await p.waitForTimeout(450);
  await p.screenshot({ path: out });
  console.log('capture', out, '· erreurs', errs.length, errs.join('\n'));
  await b.close();
})();
