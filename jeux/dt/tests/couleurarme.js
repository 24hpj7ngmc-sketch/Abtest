// V5.0 : la couleur de l'arme suit l'élément de l'arme. Vérifie : l'arme en main (les 6) porte les couleurs de opts.elementArme (lobby, puis choix
// du menu), à défaut de l'élément du héros ; elle change quand l'élément change (cache par élément) ; page seule : élément du héros ; un élément
// inconnu est ignoré ; en multi, l'arme des autres joueurs prend l'élément publié (champ el), sinon celui de leur héros, et une valeur
// réseau douteuse est ignorée ; le message réseau est assaini (champ e). Aucune erreur de page.
//   node tests/couleurarme.js
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
    // la couleur moyenne des sommets d'un objet 3D (ce qu'on voit de la teinte), arrondie à l'unité
    window.__sig = o => {
      let r = 0,
        g = 0,
        bl = 0,
        n = 0;
      o.traverse(m => {
        const c = m.geometry && m.geometry.attributes && m.geometry.attributes.color;
        if (c) {
          for (let i = 0; i < c.count; i++) {
            r += c.array[i * c.itemSize];
            g += c.array[i * c.itemSize + 1];
            bl += c.array[i * c.itemSize + 2];
            n++;
          }
        }
      });
      return n ? [r, g, bl].map(v => Math.round((v / n) * 255)).join(',') : 'aucune';
    };
    // la couleur attendue : le même modèle, fabriqué avec le héros et l'élément voulus
    window.__att = (arme, el) => {
      const hc = G.H ? { H: G.H } : {};
      if (el) hc.el = el;
      return __sig(instM('vm.' + arme, hc));
    };
    window.__main = (arme, o) => {
      const s = __dt.save;
      s.runs = 5;
      s.runsOut = 5;
      s.mode = 'out';
      s.hero = o.hero;
      s.elArme = o.elArme || null;
      elementArmeLobby = o.lobby || null;
      gearK = '';
      __dt.newGame(1);
      return __sig(G.vm[arme]);
    };
  });
  const ARMES = ['fusil', 'pistolet', 'assaut', 'sniper', 'pompe', 'lance'];
  const ELS = ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'];
  // 1) lobby : opts.elementArme (elementArmeLobby) l'emporte
  for (const a of ARMES) {
    const r = await p.evaluate(
      ([a, ELS]) => {
        const o = {};
        for (const e of ELS) {
          const v = __main(a, { hero: 'feu', lobby: e });
          o[e] = [v, __att(a, e)];
        }
        return o;
      },
      [a, ELS]
    );
    const bon = ELS.every(e => r[e][0] === r[e][1] && r[e][0] !== 'aucune');
    const tous = new Set(ELS.map(e => r[e][0])).size === 6;
    T(a + " : l'arme en main a la couleur de elementArme (6 éléments), et les six couleurs sont différentes", bon && tous, bon && tous ? '' : JSON.stringify(r));
  }
  // 2) sans elementArme : l'élément du héros (page seule) ; le choix du menu passe avant le héros
  const h = await p.evaluate(() => {
    const feu = __main('fusil', { hero: 'feu' }),
      eau = __main('fusil', { hero: 'eau' }),
      aEau = __att('fusil', 'eau'),
      menu = __main('fusil', { hero: 'feu', elArme: 'terre' }),
      lobby = __main('fusil', { hero: 'feu', elArme: 'terre', lobby: 'vent' }),
      zz = __main('fusil', { hero: 'feu', lobby: 'pas-un-element' });
    return { feu, eau, menu, lobby, zz, aFeu: __att('fusil', 'feu'), aEau, aTerre: __att('fusil', 'terre'), aVent: __att('fusil', 'vent') };
  });
  T("page seule : l'arme prend l'élément du héros (feu, puis eau)", h.feu === h.aFeu && h.eau === h.aEau && h.feu !== h.eau);
  T('le choix du menu (terre) remplace le héros ; le lobby (vent) remplace le menu', h.menu === h.aTerre && h.lobby === h.aVent);
  T("élément de lobby inconnu : celui du héros", h.zz === h.aFeu);
  // 3) le cache : revenir à un élément déjà vu redonne la même géométrie (pas de fuite) ; l'ancienne arme est retirée de la caméra
  const c = await p.evaluate(() => {
    __main('pompe', { hero: 'feu', lobby: 'eau' });
    const p1 = G.vm.pompe.userData.prep,
      n1 = camera.children.length;
    __main('pompe', { hero: 'feu', lobby: 'vent' });
    __main('pompe', { hero: 'feu', lobby: 'eau' });
    return { memePrep: G.vm.pompe.userData.prep === p1, n: camera.children.length - n1 };
  });
  T("cache par élément : même modèle préparé au retour, rien ne s'accumule dans la caméra", c.memePrep && c.n === 0, JSON.stringify(c));
  // 4) multi : l'arme des autres joueurs
  await p.evaluate(() => {
    __main('fusil', { hero: 'feu' });
    const y = H;
    const base = { x: 1, y, z: -10, yaw: 0, pitch: 0, tire: false, aTerre: false };
    window.__liste = [
      Object.assign({ id: 'a', nom: 'A', heros: 'feu', arme: 'fusil', el: 'eau' }, base),
      Object.assign({ id: 'b', nom: 'B', heros: 'terre', arme: 'pompe' }, base),
      Object.assign({ id: 'c', nom: 'C', heros: 'vent', arme: 'assaut', el: 'constructor' }, base),
      Object.assign({ id: 'd', nom: 'D', heros: 'bois', arme: 'sniper', el: 42 }, base),
      Object.assign({ id: 'e', nom: 'E', heros: 'elec', arme: 'pistolet', el: '__proto__' }, base)
    ];
    window.joueursDistants = () => window.__liste;
  });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    const J = id => G.joueurs.find(r => r.id === id),
      sig = (r, a) => ({ v: __sig(r.gun), att: null });
    const r = {};
    for (const [id, a, el] of [
      ['a', 'fusil', 'eau'],
      ['b', 'pompe', 'terre'],
      ['c', 'assaut', 'vent'],
      ['d', 'sniper', 'bois'],
      ['e', 'pistolet', 'elec']
    ]) {
      const j = J(id);
      const att = __sig(instM('vm.' + a, { H: joueurGants(j.heros), el }));
      r[id] = j ? __sig(j.gun) === att : 'absent';
    }
    r.nonA = __sig(J('a').gun) !== __sig(instM('vm.fusil', { H: joueurGants('feu'), el: 'feu' }));
    return r;
  });
  T('multi : arme du joueur A à la couleur eau (son héros est feu)', m.a === true && m.nonA === true, JSON.stringify(m));
  T("multi : sans champ el, la couleur de son héros (terre)", m.b === true, JSON.stringify(m.b));
  T("multi : el douteux (« constructor », nombre, « __proto__ ») ignoré : couleur du héros", m.c === true && m.d === true && m.e === true, JSON.stringify(m));
  // changement d'élément d'un joueur : l'arme est refaite
  const ch = await p.evaluate(async () => {
    const av = __sig(G.joueurs.find(r => r.id === 'b').gun);
    window.__liste[1].el = 'eau';
    await new Promise(r => setTimeout(r, 1200));
    const ap = __sig(G.joueurs.find(r => r.id === 'b').gun);
    return { av, ap, ok: ap === __sig(instM('vm.pompe', { H: joueurGants('terre'), el: 'eau' })) && av !== ap };
  });
  T("multi : l'élément de l'arme d'un joueur change, son arme change de couleur", ch.ok, JSON.stringify(ch));
  // 5) le message réseau assaini (champ e)
  const net = await p.evaluate(() => {
    const e = el => (etatPropre({ v: 1, p: { n: 'x', h: 'feu', w: 'fusil', e: el } }) || { p: {} }).p.e;
    return [e('eau'), e('vent'), e('xx'), e(42), e(null), e({}), e('constructor'), e(undefined)];
  });
  T('réseau : etatPropre garde un élément valide (champ e), sinon vide', JSON.stringify(net) === '["eau","vent","","","","","",""]', JSON.stringify(net));
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  T('aucune erreur de page', errs.length === 0);
  console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
  process.exit(ko ? 1 : 0);
})();
