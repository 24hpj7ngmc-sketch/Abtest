// capture de la V13.2 à la taille du téléphone (966 × 366) : le Hall des héros avec les six héros (chacun son modèle), vus de plus loin.
//   usage : node tests/sixshot.js [sortie=shots/hall-six.png] [recul=8.5] [angle=0.5] [plein] [hauteur=0]   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'shots/hall-six.png';
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
  const [REC, ANG] = [+process.argv[3] || 8.5, +process.argv[4] || 0];
  const r = await p.evaluate(([REC, ANG, PLEIN, HAUT]) => {
    const g = __g(),
      L = g.LB;
    L.tx = 0;
    L.tz = 2;
    g.vilPlace('hall', 0, 2, Math.PI);
    g.lobSync();
    const Hs = [];
    for (const v of g.vilV.values()) if (v.userData.heroes) Hs.push(...v.userData.heroes);
    if (Hs.length < 6) return 'pas de Hall : ' + Hs.length;
    g.lob.updateMatrixWorld(true);
    // le toit et les colonnes du Hall cachent la rangée : pour la capture, le corps du Hall est aplati (on garde les six héros et leurs faisceaux)
    if (PLEIN !== 'plein') for (const v of g.vilV.values()) if (v.userData.heroes) v.userData.m.scale.y = 0.12;
    const Ps = Hs.map(H => H.av.getWorldPosition(new THREE.Vector3())),
      P = new THREE.Vector3();
    Ps.forEach(q => P.add(q));
    P.multiplyScalar(1 / Ps.length);
    const a = Math.atan2(-Hs[0].av.matrixWorld.elements[8], -Hs[0].av.matrixWorld.elements[10]) + ANG,
      x = P.x + Math.sin(a) * REC,
      z = P.z + Math.cos(a) * REC;
    window.__hold = setInterval(() => {
      L.x = x;
      L.z = z;
      L.yaw = Math.atan2(x - P.x, z - P.z);
      L.pitch = 0.12 - HAUT * 0.075;
      L.y = g.walkAt(x, z, 1e9) + HAUT;
      L.vy = 0;
    }, 8);
    return Hs.length + ' héros autour de ' + P.x.toFixed(1) + ' ' + P.y.toFixed(1) + ' ' + P.z.toFixed(1);
  }, [REC, ANG, process.argv[5] || '', +process.argv[6] || 0]);
  await p.addStyleTag({ content: '#toast{display:none!important}' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out });
  console.log(r, '· capture', out, '· erreurs', errs.length, errs.join('\n'));
  await b.close();
})();
