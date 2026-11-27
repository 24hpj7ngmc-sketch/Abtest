// V4.7 : le grappin dans la page : la case de la barre (verrouillée, puis débloquée), l'étiquette sous le viseur, Action le lance, la corde,
// on arrive ; captures (shots/grappin-*.png) à la taille de l'appli.          node tests/grappintest.js   (≈ 15 s)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    Object.assign(__dt.save, { mode: 'out', hero: 'eau', weap: 'fusil', snd: false, lv: { root: 1 } });
    __dt.newGame(2);
    document.getElementById('big').style.display = 'none';
  });
  await p.waitForTimeout(500);
  const slot = () =>
    p.evaluate(() => {
      const e = document.querySelector('.slot[data-k="grappin"]');
      return {
        vu: !!e && !e.hidden && e.getBoundingClientRect().width > 0,
        lock: e.classList.contains('lock'),
        sel: e.classList.contains('sel')
      };
    });
  let s = await slot();
  T('la case Grappin est dans la barre, verrouillée sans la case', s.vu && s.lock, JSON.stringify(s));
  // la barre à six outils tient entre le joystick et les boutons
  const place = await p.evaluate(() => {
    const h = document.getElementById('hot').getBoundingClientRect(),
      j = document.getElementById('joy').getBoundingClientRect(),
      f = document.getElementById('bFree').getBoundingClientRect();
    return { g: h.left, d: h.right, joy: j.right, libre: f.left };
  });
  T('six outils : la barre ne touche ni le joystick ni les boutons', place.g > place.joy && place.d < place.libre, JSON.stringify(place));
  // débloqué : on le prend, on vise la façade nord depuis la rue
  await p.evaluate(() => {
    __dt.save.lv.m_tyro = 1;
    __dt.save.lv.m_grap = 1;
    __dt.S.P = derive(__dt.save.lv);
  });
  await p.waitForTimeout(200);
  await p.tap('.slot[data-k="grappin"]');
  await p.waitForTimeout(400);
  s = await slot();
  T('débloqué : on le prend en main', !s.lock && s.sel, JSON.stringify(s));
  await p.evaluate(() => {
    const P = __dt.S.p;
    Object.assign(P, { x: 1.3, y: 0, z: -26, ground: true });
    const o = eyeP(P),
      dx = 0,
      dy = 9.5 - o[1],
      dz = -13 - o[2];
    P.yaw = Math.atan2(-dx, -dz);
    P.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  });
  await p.waitForTimeout(400);
  const lab = await p.evaluate(() => document.getElementById('aLab').textContent);
  T("l'étiquette dit où il mène", /Grappin.*vers le balcon du/.test(lab), lab);
  await p.screenshot({ path: 'shots/grappin-vise.png' });
  // Action : il part, la corde se voit, on arrive sur le balcon
  await p.evaluate(() => padAct({ preventDefault() {} }));
  await p.waitForTimeout(250);
  const vol = await p.evaluate(() => ({ clb: !!__dt.S.p.clb, corde: G.corde.n, crochet: G.crochet.visible }));
  T('il part : traction, corde et crochet dessinés', vol.clb && vol.corde === 1 && vol.crochet, JSON.stringify(vol));
  await p.screenshot({ path: 'shots/grappin-traction.png' });
  await p.waitForFunction(() => !__dt.S.p.clb, null, { timeout: 6000 });
  await p.waitForTimeout(200);
  const fin = await p.evaluate(() => ({ y: __dt.S.p.y, yb: LVY(3), z: __dt.S.p.z, corde: G.corde.n, crochet: G.crochet.visible }));
  T(
    'arrivé sur le balcon ; la corde disparaît',
    Math.abs(fin.y - fin.yb) < 0.05 && fin.z < -13 && !fin.corde && !fin.crochet,
    JSON.stringify(fin)
  );
  await p.screenshot({ path: 'shots/grappin-arrive.png' });
  // vers le ciel : « rien à attraper », Action ne part pas
  await p.evaluate(() => {
    __dt.S.grapCd = 0;
    __dt.S.p.yaw = 0; // dos à l'immeuble (nord), vers le ciel
    __dt.S.p.pitch = 0.5;
  });
  await p.waitForTimeout(300);
  const ciel = await p.evaluate(() => ({
    t: document.getElementById('aLab').textContent,
    rouge: document.getElementById('aLab').classList.contains('poor')
  }));
  await p.evaluate(() => padAct({ preventDefault() {} }));
  await p.waitForTimeout(150);
  T(
    'le ciel : « rien à attraper », il ne part pas',
    /rien à attraper/.test(ciel.t) && !(await p.evaluate(() => !!__dt.S.p.clb)),
    JSON.stringify(ciel)
  );
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
})();
