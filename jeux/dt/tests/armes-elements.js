// V5.0 : la capture des six armes, chacune dans trois éléments (feu, eau, Nature) : shots/armes-elements.png (une seule image, 6 colonnes × 3 rangées).
// Même mise en scène que outils/photos.js (de profil, sans gants ni manches, fond sombre). node tests/armes-elements.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 966, height: 366 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(600);
  const url = await p.evaluate(() => {
    const S0 = 0x010203,
      W = 360,
      Hh = 170,
      ARMES = ['pistolet', 'fusil', 'assaut', 'sniper', 'pompe', 'lance'],
      ELS = ['feu', 'eau', 'bois'],
      cv = document.createElement('canvas'),
      R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true }),
      out = document.createElement('canvas'),
      g = out.getContext('2d');
    R.setPixelRatio(1);
    R.setSize(W, Hh, false);
    out.width = W * ARMES.length;
    out.height = Hh * ELS.length;
    ELS.forEach((el, row) =>
      ARMES.forEach((k, col) => {
        const rec = MODELS['vm.' + k]({ K, el, H: { sleeve: S0, sleeveD: S0, glove: S0, gloveD: S0 } });
        for (const pt of rec.parts) {
          const it = pt.b.items;
          for (let i = it.length - 1; i >= 0; i--) {
            const o = it[i].o;
            if (o.c === S0 || o.c2 === S0 || o.nophoto) it.splice(i, 1);
          }
        }
        const pr = K.prep(rec, rec.bake || {}),
          o = K.inst(pr, { cast: false, recv: false }),
          sc = new THREE.Scene();
        sc.background = new THREE.Color(0x20252b);
        sc.add(o);
        sc.add(new THREE.HemisphereLight(0xeef4ff, 0x5a5a55, 0.95));
        const sd = rec.photo || 1,
          d = new THREE.DirectionalLight(0xffffff, 0.9);
        d.position.set(3 * sd, 4, -1.5);
        sc.add(d);
        sc.add(d.target);
        const mn = pr.min,
          mx = pr.max,
          c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2],
          len = mx[2] - mn[2],
          hh = mx[1] - mn[1],
          fov = 10,
          t = Math.tan(((fov / 2) * Math.PI) / 180),
          dist = Math.max(len / 2 / ((t * W) / Hh), hh / 2 / t) * 1.12 + 0.3,
          dir = [sd, 0.14, -0.1],
          l = Math.hypot(...dir),
          cam = new THREE.PerspectiveCamera(fov, W / Hh, 0.05, 50);
        cam.position.set(c[0] + (dir[0] / l) * dist, c[1] + (dir[1] / l) * dist, c[2] + (dir[2] / l) * dist);
        cam.lookAt(new THREE.Vector3(c[0], c[1], c[2]));
        R.render(sc, cam);
        g.drawImage(cv, col * W, row * Hh);
        g.fillStyle = '#ffffffcc';
        g.font = '14px sans-serif';
        g.fillText(k + ' · ' + el, col * W + 8, row * Hh + 16);
      })
    );
    return out.toDataURL('image/png');
  });
  fs.mkdirSync('shots', { recursive: true });
  fs.writeFileSync('shots/armes-elements.png', Buffer.from(url.split(',')[1], 'base64'));
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  await b.close();
})();
