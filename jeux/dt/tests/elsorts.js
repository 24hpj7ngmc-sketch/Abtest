// V5.3 : les sorts suivent l'élément choisi du héros (opts.elHeros) : effet et couleurs ; les noms et les chiffres ne changent pas.
// Vérifie : Braise en Eau : la zone au sol de l'Orbe ralentit au lieu de brûler, sa lueur et ses gouttes sont bleues (pas de flammes) ;
// Roc en Feu : son Onde de choc brûle (et n'étourdit plus) ; Ondine en Feu : la Répulsion brûle et ne ralentit plus ; Sylve en Terre : le roncier (modèle
// d'une autre palette) et les arbres gardiens ; Volt en Eau : l'orage ralentit ; sans élément choisi : tout comme avant (zone qui brûle, Onde de choc qui étourdit).
// Capture : shots/sort-eau.png (la compétence de Braise en Eau, 966 × 366).
//   node tests/elsorts.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const V = { sprint: false, tool: 'fusil', scope: false, hammer: false, aim: -1, ptype: 'mg', door: -1, ads: false, zoom: 1, bob: 0, bobT: 0 };
    // avancer n pas (dessin ou non)
    window.__adv = (n, draw) => {
      const S = __dt.S,
        r0 = renderer.render;
      if (!draw) renderer.render = () => {};
      try {
        for (let k = 0; k < n; k++) {
          step(S, 1 / 30, { f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch });
          events();
          gfxFrame(S, 1 / 30, V);
        }
      } finally {
        renderer.render = r0;
      }
    };
    window.__aim = (x, y, z) => {
      const q = __dt.S.p;
      for (let k = 0; k < 4; k++) {
        const e = eyeP(q),
          dx = x - e[0],
          dy = y - e[1],
          dz = z - e[2];
        q.yaw = Math.atan2(-dx, -dz);
        q.pitch = Math.atan2(dy, Math.hypot(dx, dz));
      }
    };
    window.__crowd = (cx, cz) => {
      const S = __dt.S,
        Z = S.z;
      let best = -1,
        bd = 1e9;
      for (let q = 0; q < S.nAct; q++) {
        const i = S.act[q];
        if (Z.st[i] !== 1 || Math.max(Math.abs(Z.x[i]), Math.abs(Z.z[i])) < B + BALD + 4) continue;
        const d = Math.hypot(Z.x[i] - cx, Z.z[i] - cz);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best < 0 ? [cx, 0, cz] : [Z.x[best], 0, Z.z[best]];
    };
    // une partie « Ils s'échappent » : héros h, élément choisi eh (ou null), jour 1, 36 s de horde
    window.__setup = (h, eh) => {
      const s = __dt.save;
      s.runs = 5;
      s.mode = 'out';
      s.hero = h;
      s.weap = 'fusil';
      s.layout = {};
      elHerosLobby = eh;
      __dt.newGame(1);
      running = false;
      const S = __dt.S;
      S.god = true;
      __dt.startDay(S);
      document.getElementById('big').style.display = 'none';
      for (let i = 0; i < 30 * 36; i++) {
        step(S, 1 / 30, { f: 0, r: 0, yaw: 0, pitch: 0 });
        if (S.ev.length > 4000) S.ev.length = 0;
      }
      S.ev.length = 0;
      Object.assign(S.p, { x: 0, y: H, z: -B + 0.8, yaw: 0, pitch: -0.4, vx: 0, vz: 0, vy: 0 });
      return S.nAct;
    };
    // rassemble 10 zombies dehors autour de (x, z), au sol (une foule à portée du sort)
    window.__rassembler = (x, z) => {
      const S = __dt.S,
        Z = S.z;
      let n = 0;
      for (let q = 0; q < S.nAct && n < 10; q++) {
        const i = S.act[q];
        if (Z.st[i] !== 1 || Z.ty[i] > 2) continue;
        Z.x[i] = x + ((n % 5) - 2) * 0.8;
        Z.z[i] = z + (Math.floor(n / 5) - 0.5) * 0.8;
        Z.y[i] = 0;
        Z.slow[i] = Z.burn[i] = Z.psn[i] = Z.root[i] = 0;
        // ils encaissent tout : on regarde les effets, pas les morts
        Z.hp[i] = 1e6;
        n++;
      }
      return n;
    };
    // vise (0, 0, -40) (l'avenue nord), y rassemble une foule, lance la compétence
    window.__comp = () => {
      const S = __dt.S;
      __aim(0, 0, -40);
      const a = aimPoint(S, 160);
      __rassembler(a[0], a[2]);
      S.hab = 0;
      return useHeroSkill(S);
    };
    // l'état des zombies dans un rayon r du point (x, z) : combien brûlent, ralentis, empoisonnés, immobilisés
    window.__etat = (x, z, r) => {
      const S = __dt.S,
        Z = S.z,
        o = { n: 0, burn: 0, slow: 0, psn: 0, root: 0 };
      for (let q = 0; q < S.nAct; q++) {
        const i = S.act[q];
        if (Z.st[i] === 0 || Math.hypot(Z.x[i] - x, Z.z[i] - z) > r) continue;
        o.n++;
        if (Z.burn[i] > 0) o.burn++;
        if (Z.slow[i] > 0) o.slow++;
        if (Z.psn[i] > 0) o.psn++;
        if (Z.root[i] > 0) o.root++;
      }
      return o;
    };
  });
  const shot = async n => {
    await p.evaluate(() => {
      __adv(1, true);
      try {
        uiTick(1 / 30);
      } catch (_) {}
      document.getElementById('wave').style.display = 'none';
    });
    await p.screenshot({ path: 'shots/' + n + '.png' });
  };
  const hex = h => '#' + h.toString(16).padStart(6, '0');

  // 1) Braise en Eau : la zone au sol ralentit au lieu de brûler, sa couleur est bleue
  for (const eh of ['eau', null]) {
    const nom = eh ? 'Braise en Eau' : 'Braise sans élément choisi';
    await p.evaluate(eh => __setup('feu', eh), eh);
    await p.evaluate(() => {
      __adv(2, true);
      window.__r = __comp();
    });
    // la boule vole, explose, laisse la zone au sol
    const z = await p.evaluate(() => {
      const S = __dt.S;
      let k = 0;
      while (S.fballs.length && k++ < 90) __adv(1, false);
      const f = S.fires[0];
      if (!f) return null;
      // quelques images de plus : la zone agit une fois par seconde sur chaque zombie
      __adv(20, false);
      const et = __etat(f.x, f.z, f.r),
        L = {
          el: f.el || null,
          r: f.r,
          t: f.t,
          dps: f.dps,
          // la couleur de la lueur et des particules (ce qui est dessiné maintenant)
          glow: HX.glow.m.material.color.getHex(),
          part: { fire: G.P.fire.n, water: G.P.water.n }
        };
      return { f: L, et };
    });
    T(nom + ' : compétence lancée', await p.evaluate(() => window.__r), '');
    if (!z) {
      T(nom + ' : une zone au sol est posée', false);
      continue;
    }
    if (eh === 'eau') {
      T('Braise en Eau : la zone au sol est de l\'Eau (même rayon, même durée)', z.f.el === 'eau' && z.f.r === 4.2 && z.f.dps > 0, JSON.stringify(z.f));
      T('Braise en Eau : la zone ralentit au lieu de brûler', z.et.n > 0 && z.et.slow > 0 && z.et.burn === 0, JSON.stringify(z.et));
      T('Braise en Eau : la lueur de la zone est bleue (Eau, pas orange)', hex(z.f.glow) === hex(0x3fa9ff), hex(z.f.glow));
      T("Braise en Eau : des gouttes d'eau, pas de flammes", z.f.part.water > 0 && z.f.part.fire === 0, JSON.stringify(z.f.part));
      await shot('sort-eau');
    } else {
      T('sans élément choisi : la zone brûle comme avant (pas de ralentissement)', !z.f.el && z.et.burn > 0 && z.et.slow === 0, JSON.stringify(z.et));
      T('sans élément choisi : la lueur est orange comme avant', hex(z.f.glow) === hex(0xff5a1e), hex(z.f.glow));
    }
  }

  // 2) Roc en Feu : l'Onde de choc brûle (et n'étourdit plus) ; sans élément choisi : il étourdit comme avant
  for (const eh of ['feu', null]) {
    await p.evaluate(eh => __setup('terre', eh), eh);
    const r = await p.evaluate(() => {
      const S = __dt.S;
      __rassembler(0, -22);
      S.ult = 1;
      const ok = useHeroUlt(S);
      __adv(3, false);
      const et = __etat(0, -22, 6);
      return { ok, et, vig: HX.vC };
    });
    if (eh) T('Roc en Feu : l\'Onde de choc brûle', r.ok && r.et.burn > 0, JSON.stringify(r.et));
    if (eh) T('Roc en Feu : l\'Onde de choc étourdit aussi (V5.4 : quel que soit l\'élément)', r.et.root > 0, JSON.stringify(r.et));
    else T('Roc sans élément choisi : l\'Onde de choc étourdit comme avant, sans brûler', r.ok && r.et.root > 0 && r.et.burn === 0, JSON.stringify(r.et));
    if (eh) T('Roc en Feu : le voile de l\'Onde de choc est orange (Feu)', r.vig === 0xff6a3d, hex(r.vig));
  }

  // 3) Ondine en Feu : la Répulsion brûle ; Volt en Eau : l'orage ralentit ; Sylve en Terre : les gardiens (modèles d'une autre palette)
  await p.evaluate(() => __setup('eau', 'feu'));
  let r = await p.evaluate(() => {
    const ok = __comp();
    __adv(3, false);
    const S = __dt.S,
      a = aimPoint(S, 160);
    return { ok, et: __etat(a[0], a[2], 8), onde: HX.waves[0].c.material.color.getHex() };
  });
  T('Ondine en Feu : la Répulsion brûle au lieu de ralentir', r.ok && r.et.burn > 0 && r.et.slow === 0, JSON.stringify(r.et));
  T("Ondine en Feu : la vague est orange (Feu)", hex(r.onde) === hex(0xff6a3d), hex(r.onde));
  await p.evaluate(() => __setup('elec', 'eau'));
  r = await p.evaluate(() => {
    const S = __dt.S;
    __aim(0, 0, -40);
    const a = aimPoint(S, 160);
    __rassembler(a[0], a[2]);
    S.ult = 1;
    const ok = useHeroUlt(S);
    __adv(60, false);
    const o = S.storms[0] ? { ec: S.storms[0].ec } : null;
    return { ok, o, et: __etat(a[0], a[2], 16), arc: HX.boltY.m.material.color.getHex() };
  });
  T("Volt en Eau : l'orage ralentit (l'élément choisi), éclairs bleus", r.ok && r.o && r.o.ec === 'eau' && r.et.slow > 0, JSON.stringify(r));
  await p.evaluate(() => __setup('bois', 'terre'));
  r = await p.evaluate(() => {
    const S = __dt.S;
    S.ult = 1;
    const ok = useHeroUlt(S);
    __adv(40, true);
    const a = HX.alt.terre || {};
    return { ok, g: S.guards.length, ec: S.guards[0] && S.guards[0].ec, alt: Object.keys(a).sort().join(','), n: a.treeM ? a.treeM.n : 0 };
  });
  T('Sylve en Terre : les gardiens sont de Terre, dessinés avec un modèle de cette palette', r.ok && r.g > 0 && r.ec === 'terre' && r.n > 0, JSON.stringify(r));
  T('Sylve sans élément choisi : pas de réserve supplémentaire', await p.evaluate(() => (__setup('bois', null), __dt.S.ult = 1, useHeroUlt(__dt.S), __adv(30, false), !HX.alt.bois && HX.treeM.n > 0)), '');

  T('aucune erreur de page', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log('\n' + ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
