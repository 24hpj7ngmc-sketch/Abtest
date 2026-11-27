// Captures de l'écran de jeu (HUD) aux tailles du téléphone de Frédéric, pour juger l'encombrement à l'œil (pas de comparaison).
//   node tests/shothud.js [préfixe=shots/hud-]      (≈ 30 s)
// Tailles (comme tests/shothud.js de L'Île des Cinq, le modèle de l'ATH depuis le 24/11) : 'app' = l'appli (844 × 390),
// 'safari' = la page itch.io dans Safari, barres visibles (840 × 333).
// Moments : 'prep' (jour 1, avant « Lancer le jour »), 'jour' (jour en cours, arme en main), 'marteau' (jour en cours, marteau en main,
// emplacement visé alors qu'aucune tourelle n'est libre : la pose est refusée), 'dedans' (jour 6, des zombies dans l'immeuble).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const pre = process.argv[2] || 'shots/hud-';
const SIZES = { app: [844, 390], safari: [840, 333] };
(async () => {
  fs.mkdirSync(path.dirname(path.resolve(pre + 'x')), { recursive: true });
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  for (const [nom, [w, h]] of Object.entries(SIZES)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(nom + ' ' + e.message.slice(0, 200)));
    await p.goto('file://' + path.resolve('test3d.html'));
    await p.waitForTimeout(900);
    await p.evaluate(() => {
      Object.assign(__dt.save, { mode: 'out', hero: 'feu', weap: 'fusil', cash: 140, snd: false, dev: false, fps: false });
      __dt.newGame(1);
    });
    await p.waitForTimeout(4200);
    await p.screenshot({ path: pre + nom + '-prep.png' });
    // le jour en cours, arme en main, le regard vers une rue
    await p.evaluate(() => {
      const S = __dt.S;
      S.p.invul = 1e9;
      __dt.startDay(S);
      S.p.pitch = -0.35;
    });
    await p.waitForTimeout(3500);
    await p.screenshot({ path: pre + nom + '-jour.png' });
    // marteau en main, un emplacement du toit visé, aucune tourelle libre (jour 1) : la pose est refusée
    await p.evaluate(() => {
      __dt.setTool('marteau');
      const S = __dt.S,
        P = S.p;
      let best = null;
      for (const s of SLOTS) if (slotOn(S.P, s, S.mode) && s.k === 'toit' && (!best || s.z < best.z)) best = s;
      if (!best) best = SLOTS.find(s => slotOn(S.P, s, S.mode));
      P.x = best.x * 0.55;
      P.z = best.z * 0.55;
      const oeil = eyeP(P),
        vx = best.x - oeil[0],
        vy = best.y + 0.4 - oeil[1],
        vz = best.z - oeil[2];
      P.yaw = Math.atan2(-vx, -vz);
      P.pitch = Math.atan2(vy, Math.hypot(vx, vz));
    });
    await p.waitForTimeout(800);
    await p.screenshot({ path: pre + nom + '-marteau.png' });
    // jour 6 : des zombies sont entrés dans l'immeuble
    await p.evaluate(() => {
      __dt.setTool('fusil');
      __dt.newGame(6);
    });
    await p.waitForTimeout(3000);
    await p.evaluate(() => {
      const S = __dt.S;
      S.p.invul = 1e9;
      __dt.startDay(S);
    });
    await p.waitForTimeout(9000);
    await p.screenshot({ path: pre + nom + '-dedans.png' });
    await ctx.close();
  }
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  await b.close();
})();
