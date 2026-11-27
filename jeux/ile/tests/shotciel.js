// captures de la vue du ciel (V2.0), à la taille de la page itch.io dans Safari.   usage : node tests/shotciel.js [prefixe=shots/ciel-]   (≈ 30 s)
// 1) au début de la partie (avant la vague 1, pas de chrono) ; 2) un endroit choisi au doigt (roulette des éléments) ; 3) après la vague 1 (chrono) avec un mur tracé.
const { chromium } = require('playwright');
const path = require('path');
const pre = process.argv[2] || 'shots/ciel-';
const SIZES = { safari: [840, 333], app: [844, 390] };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [nom, [w, h]] of Object.entries(SIZES)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(nom + ' ERR ' + e.message.slice(0, 200)));
    await p.addInitScript(() => {
      window.ILE_LOBBY = { heros: 'feu', mode: 'normal' };
    });
    await p.goto('file://' + path.resolve('construit/test3d.html'));
    await p.waitForTimeout(3200);
    const G = f => p.evaluate(f);
    await G(() => {
      const s = __g().sim;
      s.gold = 400;
      s.pts = 2;
    });
    await p.screenshot({ path: pre + nom + '-debut.png' });
    // toucher le sol un peu devant le centre de l'écran
    await p.touchscreen.tap(w * 0.55, h * 0.45);
    await p.waitForTimeout(500);
    await p.screenshot({ path: pre + nom + '-choix.png' });
    // une vague jouée tout de suite, puis la vue du ciel avec son chrono
    await G(() => {
      const g = __g(),
        s = g.sim;
      g.startWave(s);
      s.queue.length = 0;
      s.enemies.length = 0;
    });
    await p.waitForTimeout(2600);
    await G(() => {
      const g = __g(),
        s = g.sim,
        h = s.hero;
      g.ciel.tool = 'mur';
      g.ciel.a = g.cellOf(h.x + 6, h.z - 14);
      g.ciel.b = g.cellOf(h.x + 22, h.z - 14);
    });
    await p.waitForTimeout(400);
    await p.screenshot({ path: pre + nom + '-chrono.png' });
    await ctx.close();
  }
  console.log('erreurs', errs.length);
  console.log(errs.slice(0, 6).join('\n'));
  await b.close();
})();
