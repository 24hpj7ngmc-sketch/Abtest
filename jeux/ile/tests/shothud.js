// captures du HUD en partie, aux tailles du téléphone de Frédéric.   usage : node tests/shothud.js [prefixe=shots/hud-]   (≈ 40 s)
// Tailles : 'safari' = la page itch.io dans Safari, barres visibles (≈ 840 × 333, mesuré sur sa capture du 24/11) ; 'app' = plein écran (844 × 390).
// Moments : 'arme' (vague en cours, arme en main), 'marteau' (vague en cours, marteau en main, pose refusée, Renfort qui recharge), 'prep' (entre deux vagues : aperçu et « Lancer la vague »).
const { chromium } = require('playwright');
const path = require('path');
const pre = process.argv[2] || 'shots/hud-';
const SIZES = { safari: [840, 333], app: [844, 390] };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [nom, [w, h]] of Object.entries(SIZES)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(nom + ' ERR ' + e.message.slice(0, 200)));
    await p.addInitScript(() => {
      window.__keep = true;
      window.ILE_LOBBY = { heros: 'feu', mode: 'normal' };
    });
    await p.goto('file://' + path.resolve('construit/test3d.html'));
    await p.waitForTimeout(3000);
    const G = f => p.evaluate(f);
    // entre deux vagues : un peu d'or, un point au marchand
    await G(() => {
      const g = __g(), s = g.sim;
      s.heroGod = true;
      s.gold = 240;
      s.pts = 2;
      s.pot = 15;
      s.hero.x = 4; s.hero.z = 12; s.hero.yaw = 0.5; s.hero.pitch = -0.05;
    });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: pre + nom + '-prep.png' });
    // vague 1 en cours, arme en main
    await G(() => {
      const g = __g(), s = g.sim;
      g.startWave(s);
    });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: pre + nom + '-arme.png' });
    // marteau en main près du cœur (pose refusée), Renfort lancé il y a peu
    await G(() => {
      const g = __g(), s = g.sim;
      g.setTool('marteau');
      s.hero.sm = 52;
      s.hero.x = 2; s.hero.z = 6; s.hero.yaw = 0.2;
    });
    await p.waitForTimeout(1300);
    await p.screenshot({ path: pre + nom + '-marteau.png' });
    await ctx.close();
  }
  console.log('erreurs', errs.length);
  console.log(errs.slice(0, 6).join('\n'));
  await b.close();
})();
