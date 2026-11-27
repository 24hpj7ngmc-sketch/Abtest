// Captures fixes de l'interface (sans la 3D), pour vérifier que l'aspect ne change pas pendant un rangement du code.
//   node tests/ecrans.js --ref   enregistre les références dans tests/ecrans-ref/
//   node tests/ecrans.js         refait les captures (shots/ecrans/) et les compare aux références, pixel par pixel
// Le canevas 3D est caché : la comparaison ne dépend que de l'interface (HTML, style, mini-carte et grande carte).
// Écran de l'iPhone de Frédéric dans l'appli : 966 × 366, tactile.
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const REF = path.join(__dirname, 'ecrans-ref');
const OUT = path.resolve('shots/ecrans');
const faireRef = process.argv.includes('--ref');
// un pixel « diffère » si une de ses composantes bouge de plus de SEUIL ; une capture passe si au plus TOLERE pixels diffèrent
const SEUIL = 8,
  TOLERE = 30;

(async () => {
  fs.mkdirSync(faireRef ? REF : OUT, { recursive: true });
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
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(900);

  // sauvegarde fixe (argent, arbre, meilleurs jours, choix du menu), canevas 3D caché
  await p.evaluate(() => {
    document.getElementById('game').style.visibility = 'hidden';
    Object.assign(__dt.save, {
      cash: 23456,
      best: 4,
      bestF: 3,
      runs: 7,
      runsOut: 6,
      won: 1,
      bestEnd: 0,
      hero: 'feu',
      weap: 'fusil',
      stage: 'eau1',
      camp: { feu: 1 },
      snd: true,
      auto: true,
      sens: 1,
      dev: false,
      fps: false
    });
    Object.assign(__dt.save.lv, { f_dmg: 2, f_rate: 1, t_slot: 1, mg_dmg: 1, s_hp: 1 });
  });

  // attend que les photos des armes soient chargées et que les transitions soient finies
  const calme = async ms => {
    await p.waitForTimeout(ms || 400);
    await p.evaluate(() => Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => (i.onload = i.onerror = r))))));
  };

  const capture = async nom => {
    const buf = await p.screenshot({ animations: 'disabled', caret: 'hide' });
    if (faireRef) {
      fs.writeFileSync(path.join(REF, nom + '.png'), buf);
      console.log('réf. ' + nom);
      return;
    }
    fs.writeFileSync(path.join(OUT, nom + '.png'), buf);
    const fRef = path.join(REF, nom + '.png');
    if (!fs.existsSync(fRef)) {
      T(nom, false, 'pas de référence (lance avec --ref)');
      return;
    }
    const a = await sharp(fRef).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const c = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (a.info.width !== c.info.width || a.info.height !== c.info.height) {
      T(nom, false, 'taille différente');
      return;
    }
    let n = 0,
      max = 0;
    const diff = Buffer.alloc(a.data.length);
    for (let i = 0; i < a.data.length; i += 4) {
      const d = Math.max(
        Math.abs(a.data[i] - c.data[i]),
        Math.abs(a.data[i + 1] - c.data[i + 1]),
        Math.abs(a.data[i + 2] - c.data[i + 2])
      );
      if (d > max) max = d;
      const grisé = (a.data[i] + a.data[i + 1] + a.data[i + 2]) / 9;
      if (d > SEUIL) {
        n++;
        diff[i] = 255;
        diff[i + 1] = diff[i + 2] = 0;
      } else diff[i] = diff[i + 1] = diff[i + 2] = grisé;
      diff[i + 3] = 255;
    }
    if (n > TOLERE)
      await sharp(diff, { raw: { width: a.info.width, height: a.info.height, channels: 4 } })
        .png()
        .toFile(path.join(OUT, nom + '-ecart.png'));
    T(nom, n <= TOLERE, n + ' pixels différents (écart max ' + max + ')');
  };

  // ---- menu de départ, mode fuite : en haut, puis défilé jusqu'en bas
  await p.evaluate(() => {
    __dt.save.mode = 'out';
    showStart();
  });
  await calme(600);
  await capture('01-menu-fuite-haut');
  await p.evaluate(() => (document.getElementById('start').scrollTop = 260));
  await calme();
  await capture('02-menu-fuite-milieu');
  await p.evaluate(() => (document.getElementById('start').scrollTop = 99999));
  await calme();
  await capture('03-menu-fuite-bas');

  // ---- menu de départ, « Ils arrivent »
  await p.evaluate(() => {
    __dt.save.mode = 'in';
    showStart();
    document.getElementById('start').scrollTop = 0;
  });
  await calme();
  await capture('04-menu-arrivent-haut');
  await p.evaluate(() => (document.getElementById('start').scrollTop = 99999));
  await calme();
  await capture('05-menu-arrivent-bas');

  // ---- arbre ouvert depuis le menu, une case choisie
  await p.evaluate(() => {
    openTree('start');
    __dt.treeSel('f_rate');
  });
  await calme();
  await capture('06-arbre');

  // ---- HUD en partie, « Ils arrivent », jour 2 (préparation) ; le grand message du jour s'efface (2,6 s)
  await p.evaluate(() => {
    __dt.save.mode = 'in';
    __dt.newGame(2);
  });
  await calme(4200);
  await capture('07-hud-arrivent');
  // marteau en main : sous-barre des tourelles, étiquette d'action
  await p.evaluate(() => __dt.setTool('marteau'));
  await calme(600);
  await capture('08-hud-marteau');
  await p.evaluate(() => __dt.setTool('fusil'));
  await calme(1000);
  // grande carte (tourelles posées et leur portée)
  await p.evaluate(() => openMap());
  await calme();
  await capture('09-carte');
  // écran de fin
  await p.evaluate(() => {
    document.getElementById('mapV').hidden = true;
    __dt.S.phase = 'dead';
    __dt.S.p.dead = true;
    showEnd(false);
  });
  await calme();
  await capture('10-fin');

  // ---- HUD en partie, mode fuite, héros Braise, jour 1 (préparation)
  await p.evaluate(() => {
    __dt.save.mode = 'out';
    __dt.newGame(1);
  });
  await calme(4200);
  await capture('11-hud-fuite');
  // panneau DEV ouvert
  await p.evaluate(() => {
    __dt.save.dev = true;
  });
  await calme(300);
  await p.evaluate(() =>
    document.getElementById('devB').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
  );
  await calme(500);
  await capture('12-dev');
  await p.evaluate(() => {
    document.getElementById('devB').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    __dt.save.dev = false;
  });
  // à côté de la boutique du toit : le bouton « Boutique » apparaît
  await p.evaluate(() => {
    const P = __dt.S.p,
      s = SHOPS[0];
    P.x = s.x - 1.6;
    P.z = s.z;
    P.yaw = -Math.PI / 2;
    P.pitch = -0.2;
  });
  await calme(600);
  await capture('13-hud-boutique');
  // la boutique ouverte (l'arbre, jeu en pause)
  await p.evaluate(() => document.getElementById('bTree').click());
  await calme();
  await capture('14-boutique-ouverte');

  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  if (!faireRef) console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
})();
