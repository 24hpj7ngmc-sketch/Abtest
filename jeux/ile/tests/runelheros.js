// test de l'élément choisi du héros (V2.5, opts.elHeros) : Braise (feu) avec elHeros 'eau' ; une valeur douteuse est refusée.   usage : node tests/runelheros.js   (≈ 15 s ; après ./mktest.sh)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  let bad = 0;
  const ok = (n, c) => {
    if (!c) bad++;
    console.log((c ? 'ok  ' : 'RATÉ ') + n);
  };
  const open = async lobby => {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('ERREUR ' + e.message.slice(0, 220)));
    await p.addInitScript(o => {
      window.__noCiel = true;
      window.ILE_LOBBY = o;
    }, lobby);
    await p.goto('file://' + path.resolve('construit/test3d.html'));
    await p.waitForTimeout(900);
    return p;
  };
  // ce que chaque cas mesure : l'élément, l'avatar, les dégâts de la prédilection, l'arme par défaut, le Renfort
  const mesure = p =>
    p.evaluate(() => {
      const g = __g(),
        I = { f: 0, r: 0 },
        h0 = g.sim.hero,
        R = {
          key: h0.el,
          ce: h0.ce,
          elOf: g.elOf(h0),
          arme: h0.wEl,
          ars: g
            .getArs()
            .map(o => o.el)
            .join()
        };
      // la couleur moyenne des sommets de l'avatar de Braise (rouge ou bleu ?)
      const col = o => {
        const v = g.mateView(o);
        let r = 0,
          bl = 0,
          n = 0;
        v.userData.mdl.traverse(c => {
          const a = c.geometry && c.geometry.attributes && c.geometry.attributes.color;
          if (a)
            for (let i = 0; i < a.count; i++) {
              r += a.getX(i);
              bl += a.getZ(i);
              n++;
            }
        });
        return { r: r / Math.max(1, n), b: bl / Math.max(1, n), n };
      };
      R.av = col({ el: h0.el, ce: h0.ce, x: 0, z: 0 });
      R.avCle = col({ el: 'feu', x: 0, z: 0 });
      // prédilection : même ennemi de l'élément de l'arme (×1), seul le +10 % change
      const dmg = (ce, w, eEl) => {
        const s = g.newSim('feu', null, {}, 'normal');
        g.startWave(s);
        let n = 0;
        while (!s.enemies.length && n++ < 3000) g.step(s, 0.05, I);
        const e = s.enemies[0],
          h = s.hero;
        s.queue.length = 0;
        s.enemies.length = 1;
        h.ce = ce;
        h.wEl = w;
        h.m = Object.assign({}, h.m, { hFlame: 1, hCone: 0.38 });
        h.x = 0;
        h.z = 0;
        h.yaw = 0;
        h.pitch = 0;
        e.sea = null;
        e.el = eEl;
        e.boss = false;
        e.hp = e.max = 1e6;
        e.x = 0;
        e.z = -10;
        e.stun = 0;
        e.shield = 0;
        g.flameShot(s, h, [0, 0, -1], 1.7);
        return 1e6 - e.hp;
      };
      R.pEauChoisi = dmg('eau', 'eau', 'eau') / dmg('eau', 'feu', 'feu');
      R.pCle = dmg(undefined, 'feu', 'feu') / dmg(undefined, 'eau', 'eau');
      R.pDoute = dmg('plasma', 'feu', 'feu') / dmg('plasma', 'eau', 'eau');
      // Renfort
      const s = g.newSim('feu', null, {}, 'normal');
      s.hero.ce = h0.ce;
      s.hero.x = 30;
      s.hero.z = 24;
      g.renfort(s, s.hero);
      R.renf = s.towers
        .filter(t => t.sum)
        .map(t => t.els.join(''))
        .join();
      const ev = s.events.find(q => q.k === 'renfort');
      R.renfEv = ev && ev.el;
      return R;
    });
  const p1 = await open({ heros: 'feu', elHeros: 'eau', mode: 'normal' });
  const A = await mesure(p1);
  ok(
    "heros 'feu' + elHeros 'eau' : la clé reste feu, l'élément choisi est eau (" +
      A.key +
      '/' +
      A.ce +
      '/' +
      A.elOf +
      ')',
    A.key === 'feu' && A.ce === 'eau' && A.elOf === 'eau'
  );
  ok(
    "l'avatar de Braise est bleu (rouge " +
      A.av.r.toFixed(2) +
      ' · bleu ' +
      A.av.b.toFixed(2) +
      '), alors que sans choix il est rouge (' +
      A.avCle.r.toFixed(2) +
      ' · ' +
      A.avCle.b.toFixed(2) +
      ')',
    A.av.n > 0 && A.av.b > A.av.r && A.avCle.r > A.avCle.b
  );
  ok(
    "prédilection : +10 % avec une arme d'Eau seulement (×" + A.pEauChoisi.toFixed(3) + ')',
    Math.abs(A.pEauChoisi - 1.1) < 0.01
  );
  ok(
    'sans élément choisi, la prédilection reste celle du Feu (×' + A.pCle.toFixed(3) + ' pour feu/eau)',
    Math.abs(A.pCle - 1.1) < 0.01
  );
  ok('valeur douteuse : prédilection du Feu (×' + A.pDoute.toFixed(3) + ')', Math.abs(A.pDoute - 1.1) < 0.01);
  ok(
    'arme sans élément (armes par défaut) : Eau (' + A.ars + ', en main ' + A.arme + ')',
    A.arme === 'eau' && A.ars.split(',')[0] === 'eau'
  );
  ok(
    "Renfort : des défenses d'Eau (" + A.renf + '), annoncées en Eau (' + A.renfEv + ')',
    A.renf === 'eau,eau,eau' && A.renfEv === 'eau'
  );
  await p1.context().close();
  for (const v of ['plasma', 42, {}, null, undefined]) {
    const p = await open({ heros: 'feu', elHeros: v, mode: 'normal' });
    const R = await mesure(p);
    ok(
      'elHeros ' + JSON.stringify(v) + ' : refusé, élément = clé du héros, avatar rouge, Renfort de Feu',
      R.ce === undefined && R.elOf === 'feu' && R.av.r > R.av.b && R.renf === 'feu,feu,feu' && R.arme === 'feu'
    );
    await p.context().close();
  }
  {
    const p = await open({ heros: 'terre', elHeros: 'vent', mode: 'normal' });
    const R = await p.evaluate(() => {
      const g = __g(),
        h = g.sim.hero;
      return {
        key: h.el,
        el: g.elOf(h),
        mate: g.elOf({ el: 'bois', ce: 'x' }),
        mate2: g.elOf({ el: 'bois' }),
        mate3: g.elOf({ el: 'bois', ce: 'elec' })
      };
    });
    ok(
      'Roc + elHeros vent : clé terre, élément vent ; coéquipier sans champ ou douteux : sa clé',
      R.key === 'terre' && R.el === 'vent' && R.mate === 'bois' && R.mate2 === 'bois' && R.mate3 === 'elec'
    );
    await p.context().close();
  }
  {
    // le pont : le jeu annonce qu'il lit elHeros, et sa version est V2.5
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    const fs = require('fs');
    await p.setContent(
      '<body><script>' +
        fs.readFileSync('construit/ile-pour-lobby.js', 'utf8') +
        '\nwindow.IleDesCinq=IleDesCinq;</script></body>'
    );
    const v = await p.evaluate(() => ({ v: IleDesCinq.version, a: IleDesCinq.accepte.includes('elHeros') }));
    ok('IleDesCinq.accepte contient elHeros ; version ' + v.v, v.a && v.v === 'V2.9');
    await ctx.close();
  }
  console.log('ratés', bad, '· erreurs', errs.length);
  console.log(errs.slice(0, 8).join('\n'));
  await b.close();
})();
