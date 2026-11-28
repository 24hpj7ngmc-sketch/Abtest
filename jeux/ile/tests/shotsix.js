// capture de la V2.8 à la taille du téléphone (966 × 366) : quatre héros achetés comme esclaves (Ondine, Sylve, Volt, Zéphyr ; le jeu n'en laisse pas plus de quatre), chacun avec son modèle, en rang devant le joueur (Roc).
//   usage : node tests/shotsix.js [sortie=shots/six-en-jeu.png]   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shots/six-en-jeu.png';
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
    const L = ['eau', 'bois', 'elec', 'vent'].map(e => g.hire(s, e, {}, H[0], H[1]));
    if (L.some(o => !o)) return 'achat refusé';
    h.yaw = Math.atan2(H[0] - h.x, H[1] - h.z);
    const pos = L.map((o, i) => {
      const a = (i - 1.5) * 0.3,
        d = 6.2 + (i % 2) * 1.2,
        yy = h.yaw + Math.PI + a;
      return [h.x + Math.sin(yy + Math.PI) * 0 - Math.sin(h.yaw) * d * Math.cos(a) - Math.cos(h.yaw) * d * Math.sin(a), h.z - Math.cos(h.yaw) * d * Math.cos(a) + Math.sin(h.yaw) * d * Math.sin(a)];
    });
    window.__hold = setInterval(() => {
      L.forEach((o, i) => {
        o.x = pos[i][0];
        o.z = pos[i][1];
        o.yaw = h.yaw + Math.PI + (i - 1.5) * 0.12;
      });
      h.pitch = -0.04;
    }, 8);
    return 'ok ' + L.map(o => o.el).join(' ');
  });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out });
  console.log('esclave :', r, '· capture', out, '· erreurs', errs.length, errs.join('\n'));
  await b.close();
})();
