// V5.6 : les corrections de la page : (1) « Ils arrivent » : l'arme en main est neutre, chez soi et vue par les autres ; (4 à 5) le son d'un sort
// suit l'élément choisi ; (2) l'annonce du bouclier d'une Soigneuse (état publié, vérifié) protège ceux qui sont dans la zone ; (6) la marche
// des jambes suit le champ « pas » de la recette du modèle. Aucune erreur de page.
//   node tests/v56page.js
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
    // la recette de l'avatar d'un héros porte un « pas » de 0,5 (une robe) : à poser avant tout corps de joueur
    const avatar = MODELS['hero.avatar'];
    MODELS['hero.avatar'] = ctx => Object.assign(avatar(ctx), { pas: 0.5 });
  });

  // ---- 1. « Ils arrivent » : arme neutre en main
  const m1 = await p.evaluate(() => {
    const s = __dt.save;
    s.runs = 5;
    s.runsOut = 5;
    const o = {};
    s.mode = 'out';
    s.hero = 'feu';
    s.elArme = 'eau';
    gearK = '';
    __dt.newGame(1);
    o.sortie = __sig(G.vm.fusil);
    s.mode = 'in';
    gearK = '';
    __dt.newGame(1);
    o.entree = __sig(G.vm.fusil);
    o.neutre = __sig(instM('vm.fusil', null));
    o.el = G.el;
    o.hero = S.hero;
    return o;
  });
  T('« Ils arrivent » : l’arme en main est neutre', m1.entree === m1.neutre && m1.el === null && m1.hero === null, JSON.stringify(m1));
  T('« Ils s’échappent » : elle est teintée', m1.sortie !== m1.neutre);

  // ---- 1 bis. vue par les autres : un joueur sans héros a l'arme neutre ; avec un héros, celle de son élément
  await p.evaluate(() => {
    __dt.save.mode = 'out';
    __dt.save.hero = 'feu';
    __dt.save.elArme = null;
    gearK = '';
    __dt.newGame(1);
    document.getElementById('big').style.display = 'none';
    const y = H;
    window.__liste = [
      {
        id: 'n',
        nom: 'Neutre',
        heros: '',
        arme: 'fusil',
        el: '',
        elHeros: '',
        x: 1,
        y,
        z: -10,
        yaw: 0,
        pitch: 0,
        tire: false,
        aTerre: false
      },
      {
        id: 'f',
        nom: 'Feu',
        heros: 'feu',
        arme: 'fusil',
        el: 'feu',
        elHeros: 'feu',
        x: 3,
        y,
        z: -10,
        yaw: 0,
        pitch: 0,
        tire: false,
        aTerre: false
      }
    ];
    window.joueursDistants = () => window.__liste;
  });
  const images = async n => {
    const n0 = await p.evaluate(() => JR.n);
    for (let i = 0; i < 300; i++) {
      await p.waitForTimeout(40);
      if ((await p.evaluate(() => JR.n)) >= n0 + n) break;
    }
  };
  await images(3);
  const m2 = await p.evaluate(() => {
    const J = id => G.joueurs.find(r => r.id === id);
    return {
      n: __sig(J('n').gun),
      f: __sig(J('f').gun),
      attN: __sig(instM('vm.fusil', { H: joueurGants('feu'), el: '' })),
      attF: __sig(instM('vm.fusil', { H: joueurGants('feu'), el: 'feu' }))
    };
  });
  T('vu par les autres : sans héros, l’arme est neutre', m2.n === m2.attN && m2.n !== m2.attF, JSON.stringify(m2));
  T('vu par les autres : avec un héros, l’arme est à son élément', m2.f === m2.attF);

  // ---- 6. la marche : amplitude des jambes × pas (0,5 ici)
  await p.evaluate(() => {
    const y = H;
    window.__liste = [
      {
        id: 'w',
        nom: 'Marche',
        heros: 'eau',
        arme: 'fusil',
        el: 'eau',
        elHeros: 'eau',
        x: 0,
        y,
        z: -10,
        yaw: 0,
        pitch: 0,
        tire: false,
        aTerre: false
      }
    ];
    window.__max = 0;
    window.__dx = 0;
    const orig = joueursFrame;
    window.joueursFrame = function (S, dt) {
      window.__dx += 0.12;
      window.__liste[0].x = Math.sin(window.__dx * 0.2) * 0 + (window.__dx % 20);
      orig(S, dt);
      const r = G.joueurs.find(q => q.id === 'w');
      if (r && r.nodes) window.__max = Math.max(window.__max, Math.abs(r.nodes.legL.rotation.x), Math.abs(r.nodes.legR.rotation.x));
    };
  });
  await images(40);
  const m3 = await p.evaluate(() => ({ max: window.__max, k: G.joueurs.find(q => q.id === 'w').pasK }));
  T('marche : pas = 0,5 lu de la recette', m3.k === 0.5, 'pasK ' + m3.k);
  T('marche : l’amplitude des jambes est celle de 0,55 × pas', m3.max > 0.05 && m3.max <= 0.55 * 0.5 + 1e-6, 'max ' + m3.max.toFixed(3));

  // ---- 4 à 5. sons des sorts : un son par élément
  const sons = await p.evaluate(() => {
    const L = [];
    const play = SND.play,
      at = SND.at;
    SND.play = (n, a) => L.push(n + (a ? ':' + a : ''));
    SND.at = n => L.push(n);
    const lance = ev => {
      L.length = 0;
      S.ev.push(ev);
      events();
      return L.join();
    };
    const o = {};
    const base = { x: 0, y: 0, z: -20, x0: 0, y0: 0, z0: -20, x1: 0, y1: 0, z1: -30 };
    for (const k of ['brasier0', 'maree', 'ronces', 'rempart', 'eclair', 'rafale', 'meteor', 'fleche', 'percant']) {
      for (const ec of [undefined, 'feu', 'eau', 'bois', 'terre', 'elec', 'vent']) o[k + '/' + ec] = lance(Object.assign({ k, ec }, base));
    }
    o.zapBalle = lance(Object.assign({ k: 'zap', small: 1 }, base));
    o.zapOrage = lance(Object.assign({ k: 'zap', ec: 'elec' }, base));
    o.zapOrageFeu = lance(Object.assign({ k: 'zap', ec: 'feu' }, base));
    o.ultEau = lance({ k: 'hult', h: 'eau', ec: 'feu' });
    o.ultNat = lance({ k: 'hult', h: 'eau', ec: 'eau' });
    o.ultSans = lance({ k: 'hult', h: 'bois' });
    SND.play = play;
    SND.at = at;
    return o;
  });
  const E = { feu: 'fireball', eau: 'vague', bois: 'ronces', terre: 'rempart', elec: 'eclair', vent: 'rafale' };
  const natif = {
    brasier0: 'fireball',
    maree: 'vague',
    ronces: 'ronces',
    rempart: 'rempart',
    eclair: 'eclair',
    rafale: 'rafale',
    meteor: 'meteor',
    fleche: 'fleche',
    percant: 'percant'
  };
  const nat = {
    brasier0: 'feu',
    maree: 'eau',
    ronces: 'bois',
    rempart: 'terre',
    eclair: 'elec',
    rafale: 'vent',
    meteor: 'feu',
    fleche: 'bois',
    percant: 'vent'
  };
  let bien = 0,
    total = 0,
    mal = [];
  for (const k in natif)
    for (const ec of ['feu', 'eau', 'bois', 'terre', 'elec', 'vent']) {
      total++;
      const att = ec === nat[k] ? natif[k] : E[ec];
      if (sons[k + '/' + ec] === att) bien++;
      else mal.push(k + '/' + ec + ' → ' + sons[k + '/' + ec] + ' (attendu ' + att + ')');
    }
  T(
    'chaque sort fait le son de son élément choisi',
    bien === total,
    bien + ' / ' + total + (mal.length ? ' : ' + mal.slice(0, 4).join(' ; ') : '')
  );
  T(
    'sans élément (ou l’élément d’origine) : les sons d’avant',
    Object.keys(natif).every(k => sons[k + '/undefined'] === natif[k]),
    JSON.stringify(Object.keys(natif).map(k => sons[k + '/undefined']))
  );
  T('l’Orbe en Eau fait le son de l’Eau, pas celui du feu', sons['brasier0/eau'] === 'vague');
  T(
    'la balle qui rebondit (zap) garde son son ; l’orage de Feu prend celui du feu',
    sons.zapBalle === 'zap' && sons.zapOrage === 'tonnerre' && sons.zapOrageFeu === 'fireball',
    [sons.zapBalle, sons.zapOrage, sons.zapOrageFeu].join(' ')
  );
  T(
    'l’ultime suit l’élément choisi (accord et pluie, séisme…)',
    sons.ultEau === 'ult:feu' && sons.ultNat === 'ult:eau' && sons.ultSans === 'ult:bois',
    [sons.ultEau, sons.ultNat, sons.ultSans].join(' ')
  );

  // ---- 2. le bouclier de la Répulsion pour les autres : annonce vérifiée, puis effet
  const net = await p.evaluate(() => {
    const o = {};
    const ok = B => etatPropre({ v: 1, p: { x: 0, y: 0, z: 0, B } }).p.B;
    o.bonne = JSON.stringify(ok([3, 1.5, 0, -9, 8]));
    o.troisValeurs = ok([1, 2, 3]);
    o.texte = ok([1, 'a', 0, 0, 8]);
    o.nan = ok([1, NaN, 0, 0, 8]);
    o.objet = ok({ 0: 1 });
    o.enorme = JSON.stringify(ok([1e12, 1e9, 1e9, -1e9, 1e9]));
    o.absente = etatPropre({ v: 1, p: { x: 0, y: 0, z: 0 } }).p.B;
    return o;
  });
  T('annonce de bouclier valide gardée', net.bonne === '[3,1.5,0,-9,8]', net.bonne);
  T(
    'annonces abîmées (trois valeurs, texte, NaN, objet, absente) jetées',
    net.troisValeurs === null && net.texte === null && net.nan === null && net.objet === null && net.absente === null
  );
  T('annonce démesurée ramenée dans les bornes', net.enorme === '[1000000000,500,200,-500,30]', net.enorme);
  const eff = await p.evaluate(() => {
    __dt.save.mode = 'out';
    __dt.save.hero = 'feu';
    __dt.newGame(1);
    S.phase = 'day';
    running = true;
    MULTI.actif = true;
    const o = {};
    Object.assign(S.p, { x: 3, y: 0, z: -10 });
    const joueur = B => ({ etat: { p: { B } } });
    MULTI.pairs.clear();
    MULTI.pairs.set('s', joueur([5, 0, 0, -10, 8]));
    multiBoucliers();
    o.premiere = S.p.boucl || 0;
    MULTI.pairs.get('s').etat.p.B = [6, 0, 0, -10, 8];
    multiBoucliers();
    o.proche = S.p.boucl;
    S.p.boucl = 0;
    multiBoucliers();
    o.encore = S.p.boucl;
    MULTI.pairs.get('s').etat.p.B = [7, 40, 0, -10, 8];
    multiBoucliers();
    o.loin = S.p.boucl;
    MULTI.actif = false;
    MULTI.pairs.clear();
    return o;
  });
  T('la première annonce vue ne compte pas (elle date d’avant)', eff.premiere === 0);
  T('une nouvelle annonce : l’allié dans la zone a le bouclier de 30', eff.proche === 30, 'bouclier ' + eff.proche);
  T('la même annonce ne le repose pas', eff.encore === 0);
  T('une annonce lointaine : pas de bouclier', eff.loin === 0);

  T('aucune erreur de page', errs.length === 0, errs.join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
  process.exit(ko ? 1 : 0);
})();
