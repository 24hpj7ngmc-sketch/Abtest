// test des sorts de l'élément choisi (V2.6) : Braise en Eau (compétence), Roc en Feu (ultime), les six héros dans les six éléments.   usage : node tests/runsorts.js   (≈ 20 s ; après ./mktest.sh)
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
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('ERREUR ' + e.message.slice(0, 220)));
  await p.addInitScript(
    o => {
      window.__noCiel = true;
      window.ILE_LOBBY = o;
    },
    { heros: 'feu', elHeros: 'eau', mode: 'normal' }
  );
  await p.goto('file://' + path.resolve('construit/test3d.html'));
  await p.waitForTimeout(900);
  const R = await p.evaluate(() => {
    const g = __g(),
      I = { f: 0, r: 0 },
      out = {};
    // une partie neuve, un ennemi d'élément `eEl` immobile à 10 m devant le héros `key` (élément choisi `ce`)
    const mk = (key, ce, eEl) => {
      const s = g.newSim(key, null, {}, 'normal');
      g.startWave(s);
      let n = 0;
      while (!s.enemies.length && n++ < 3000) g.step(s, 0.05, I);
      const e = s.enemies[0],
        h = s.hero;
      s.queue.length = 0;
      s.enemies.length = 1;
      h.ce = ce;
      h.x = 0;
      h.z = 0;
      h.yaw = 0;
      h.pitch = 0;
      h.ab = 0;
      h.hp = h.maxHp;
      e.sea = null;
      e.el = eEl;
      e.boss = false;
      e.hp = e.max = 1e6;
      e.x = 0;
      e.z = -10;
      e.stun = 99;
      e.shield = 0;
      e.burn = 0;
      e.slow = 0;
      e.poi = 0;
      return { s, e, h };
    };
    // Braise : la compétence (Orbe), en Eau ou sans choix, sur un ennemi de Feu
    const brasier = ce => {
      const { s, e, h } = mk('feu', ce, 'feu');
      g.ability(s, h, [0, 0, 0, 0, 0, -10]);
      const dmg = 1e6 - e.hp,
        ev = s.events.find(q => q.k === 'fball'),
        z = s.zones.map(q => q.el + ':' + q.r.toFixed(2) + ':' + q.T);
      e.stun = 99;
      for (let i = 0; i < 6; i++) g.step(s, 0.05, I);
      return { dmg, ev: ev && ev.el, z, burn: e.burn, slow: e.slow };
    };
    out.eau = brasier('eau');
    out.cle = brasier(undefined);
    // Roc : l'ultime (Onde de choc), en Feu ou sans choix, sur un ennemi de Nature
    const seisme = ce => {
      const { s, e, h } = mk('terre', ce, 'bois');
      e.stun = 0;
      g.ULT.terre(s, h);
      const ev = s.events.find(q => q.k === 'quake');
      return { dmg: 1e6 - e.hp, burn: e.burn, stun: e.stun, ev: ev && ev.el };
    };
    out.feu = seisme('feu');
    out.roc = seisme(undefined);
    // les six héros dans les six éléments : compétence et ultime tournent, leurs événements portent l'élément choisi
    out.tous = [];
    for (const key of g.ELS)
      for (const el of g.ELS) {
        const r = { key, el, bad: [] };
        for (const what of ['ab', 'ult']) {
          const { s, e, h } = mk(key, el, 'bois');
          s.events.length = 0;
          try {
            if (what === 'ab') g.ability(s, h, [0, 0, 0, 0, 0, -10]);
            else g.ULT[key](s, h);
            for (let i = 0; i < 40; i++) g.step(s, 0.05, I);
          } catch (x) {
            r.bad.push(what + ' : ' + x.message);
          }
          const evs = s.events.filter(q =>
            [
              'dash',
              'storm',
              'ronce',
              'plonge',
              'guard',
              'fball',
              'rain',
              'tide',
              'deluge',
              'rafale',
              'perce',
              'charge',
              'quake',
              'meteor',
              'bolt2'
            ].includes(q.k)
          );
          if (what === 'ab' && key === 'feu' && !evs.length) r.bad.push("pas d'événement");
          for (const q of evs)
            if (q.el && q.el !== el && !(key === 'vent' && what === 'ult' && q.k === 'perce'))
              r.bad.push(what + ' ' + q.k + ' ' + q.el);
        }
        out.tous.push(r);
      }
    return out;
  });
  const E = R.eau,
    C = R.cle,
    F = R.feu,
    O = R.roc;
  ok(
    "Braise en Eau : événement et dégâts de la compétence d'Eau (×" +
      (E.dmg / C.dmg).toFixed(3) +
      ' contre un ennemi de Feu)',
    E.ev === 'eau' && Math.abs(E.dmg / C.dmg - 1.5) < 0.01
  );
  ok(
    "Braise en Eau : la zone au sol est d'Eau, même rayon et même durée que celle de Feu (" + E.z + ' / ' + C.z + ')',
    E.z.join().replace('eau', 'x') === C.z.join().replace('feu', 'x') && E.z[0].startsWith('eau')
  );
  ok(
    "Braise en Eau : l'ennemi est ralenti (" +
      E.slow.toFixed(2) +
      ') et ne brûle pas (' +
      E.burn.toFixed(2) +
      ') ; sans choix il brûle (' +
      C.burn.toFixed(2) +
      ')',
    E.slow > 0 && E.burn === 0 && C.burn > 0
  );
  ok(
    'Roc en Feu : Onde de choc de Feu (×' +
      (F.dmg / O.dmg).toFixed(3) +
      " contre la Nature), l'ennemi brûle et reste étourdi (" +
      F.burn.toFixed(2) +
      '), événement ' +
      F.ev,
    F.ev === 'feu' && Math.abs(F.dmg / O.dmg - 1.5) < 0.01 && F.burn > 0 && F.stun >= 2
  );
  ok(
    'Roc sans choix : inchangé (terre, étourdit ' + O.stun.toFixed(1) + ' s, ne brûle pas)',
    O.ev === 'terre' && O.burn === 0 && O.stun >= 2
  );
  const mal = R.tous.filter(r => r.bad.length);
  ok(
    '36 cas (six héros × six éléments, compétence et ultime) : aucune erreur, événements à la couleur choisie' +
      (mal.length ? ' · ' + mal.map(r => r.key + '/' + r.el + ' ' + r.bad).join(' ; ') : ''),
    R.tous.length === 36 && !mal.length
  );
  // la couleur : le disque de la zone de Braise en Eau est bleu à l'écran
  const col = await p.evaluate(async () => {
    const g = __g(),
      s = g.sim,
      h = s.hero;
    h.x = 0;
    h.z = 20;
    h.ab = 0;
    g.ability(s, h, [0, h.x, h.z, h.yaw, 0, h.z - 12]);
    await new Promise(r => setTimeout(r, 400));
    const v = [...g.views.z.values()].pop(),
      c = v && v.children[0].material.color;
    return c ? { r: c.r, g: c.g, b: c.b } : null;
  });
  ok(
    "la zone au sol de Braise en Eau est bleue à l'écran (" + JSON.stringify(col) + ')',
    col && col.b > col.r && col.b > 0.5
  );
  // V2.9 : le nuage d'un coéquipier garde l'élément de son lanceur chez un invité (et ce qui vient du réseau est vérifié)
  const R2 = await p.evaluate(() => {
    const g = __g(),
      I = { f: 0, r: 0 },
      out = {};
    const hote = g.newSim('elec', null, {}, 'normal');
    hote.hero.ce = 'eau';
    g.ability(hote, hote.hero, [1, hote.hero.x, hote.hero.z, 0, 0, 0]);
    hote.hero.ult = 100;
    g.ULT.elec(hote, hote.hero);
    const sn = JSON.parse(JSON.stringify(g.snap(hote)));
    const inv = g.newSim('feu', null, {}, 'normal');
    inv.client = true;
    g.applySnap(inv, sn);
    out.hote = hote.storms.map(t => t.el);
    out.invite = inv.storms.map(t => t.el);
    // un vieux téléphone n'envoie que trois valeurs : Élec ; des valeurs absurdes aussi
    const mauvais = [undefined, 99, -1, 'length', null, {}, 'x', 1.5];
    out.mauvais = mauvais.map(v => {
      const o = JSON.parse(JSON.stringify(sn));
      o.sm = [[1, 2, 3, v]];
      const c = g.newSim('feu', null, {}, 'normal');
      c.client = true;
      g.applySnap(c, o);
      return c.storms.length === 1 ? c.storms[0].el : 'perdu';
    });
    // zones des sorts : l'élément est dans le snap
    out.zones = inv.zones.filter(z => z.hero).map(z => z.el);
    return out;
  });
  ok(
    "le nuage du Déchaînement en Eau est Eau chez l'hôte et chez l'invité " + JSON.stringify(R2),
    R2.hote.length === 1 && R2.hote[0] === 'eau' && R2.invite[0] === 'eau'
  );
  ok(
    'élément absent ou douteux dans le réseau : Élec ' + JSON.stringify(R2.mauvais),
    R2.mauvais.every(e => e === 'elec')
  );
  // les sons des sorts suivent l'élément choisi
  const S = await p.evaluate(() => {
    const g = __g(),
      rec = [],
      A = g.SND.at,
      P = g.SND.play;
    g.SND.at = n => rec.push(n);
    g.SND.play = n => rec.push(n);
    const son = (k, el) => {
      rec.length = 0;
      g.feel({ k, x: 0, z: 0, el });
      return rec[0];
    };
    const r = {
      orbeEau: son('fball', 'eau'),
      orbeFeu: son('fball', 'feu'),
      orbeSans: son('fball'),
      nuageEau: son('storm', 'eau'),
      nuageElec: son('storm', 'elec'),
      nuageFeu: son('storm', 'feu'),
      seismeTerre: son('quake', 'terre'),
      seismeFeu: son('quake', 'feu'),
      sylveVent: son('ronce', 'vent'),
      elanElec: son('dash', 'elec'),
      elanBois: son('dash', 'bois'),
      deluge: son('deluge', 'terre'),
      rafaleVent: son('rafale', 'vent'),
      douteux: son('tide', 'constructor')
    };
    g.SND.at = A;
    g.SND.play = P;
    return r;
  });
  ok(
    'sons : un son par élément choisi ' + JSON.stringify(S),
    S.orbeEau === 'water' &&
      S.orbeFeu === 'fire' &&
      S.orbeSans === 'fire' &&
      S.nuageEau === 'water' &&
      S.nuageElec === 'thunder' &&
      S.nuageFeu === 'fire' &&
      S.seismeTerre === 'quake' &&
      S.seismeFeu === 'fire' &&
      S.sylveVent === 'shift' &&
      S.elanElec === 'zap' &&
      S.elanBois === 'wood' &&
      S.deluge === 'quake' &&
      S.rafaleVent === 'shift' &&
      S.douteux === 'water'
  );
  console.log('erreurs de page ' + errs.length + (errs.length ? '\n' + errs.join('\n') : ''));
  await b.close();
  process.exit(bad || errs.length ? 1 : 0);
})();
