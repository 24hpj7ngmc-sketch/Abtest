// capture de la V2.4 à la taille du téléphone (966 × 366) : Braise (feu) vu comme coéquipier, un esclave acheté au marchand, devant le joueur (Roc).
//   usage : node tests/shotbraise.js [sortie=shots/braise-jeu.png]   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shots/braise-jeu.png';
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
    { heros: 'terre', mode: 'normal' }
  );
  await p.goto('file://' + path.resolve('construit/test3d.html'));
  await p.waitForTimeout(2500);
  // un esclave Braise près de l'étal, puis tenu sur place face au joueur (les bots bougent d'eux-mêmes)
  const r = await p.evaluate(() => {
    const g = __g(),
      s = g.sim,
      h = s.hero,
      H = g.HIREP;
    s.gold = 5000;
    s.heroGod = true;
    h.x = H[0] * 1.35;
    h.z = H[1] * 1.35;
    const o = g.hire(s, 'feu', {}, H[0], H[1]);
    if (!o) return 'achat refusé';
    h.yaw = Math.atan2(H[0] - h.x, H[1] - h.z);
    const d = 4.3,
      x = h.x - Math.sin(h.yaw) * d - Math.cos(h.yaw) * 1.4,
      z = h.z - Math.cos(h.yaw) * d + Math.sin(h.yaw) * 1.4;
    window.__hold = setInterval(() => {
      o.x = x;
      o.z = z;
      o.yaw = h.yaw + Math.PI - 0.2;
      h.pitch = -0.04;
    }, 8);
    return 'ok ' + o.el;
  });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out });
  console.log('esclave :', r, '· capture', out, '· erreurs', errs.length, errs.join('\n'));
  await b.close();
})();
