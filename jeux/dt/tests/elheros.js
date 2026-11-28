// V5.2 : l'élément choisi du héros (opts.elHeros du lobby ; la clé du héros reste son identité). Vérifie : Braise (feu) avec elHeros « eau » a un
// avatar bleu (son modèle de Braise, palette d'Eau) ; la prédilection (+10 %) joue avec une arme d'Eau et pas avec une arme de Feu ; l'arme sans
// élément prend l'élément choisi (Eau) ; absent ou inconnu : la clé du héros ; le texte de fin et le Guide disent l'élément choisi ; en multi,
// l'élément choisi d'un autre joueur colore son avatar (et le change en cours de route) ; une valeur douteuse est refusée (réseau et affichage).
//   node tests/elheros.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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
    // la couleur moyenne des sommets d'un objet 3D, en « r,g,b » sur 255
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
      return n ? [r, g, bl].map(v => Math.round((v / n) * 255)) : [0, 0, 0];
    };
    // une partie « Ils s'échappent » : héros h, élément choisi eh (lobby), élément d'arme ea (lobby) ou null
    window.__part = (h, eh, ea) => {
      const s = __dt.save;
      s.runs = 5;
      s.runsOut = 5;
      s.mode = 'out';
      s.hero = h;
      s.elArme = null;
      elHerosLobby = eh;
      elementArmeLobby = ea;
      __dt.newGame(1);
      return { hero: S.hero, elHeros: S.elHeros, elArme: S.elArme, pred: predilK(S), ligne: heroLigne(), guide: JSON.stringify(RULES_TOIT()) };
    };
  });
  // 1) les règles : l'élément choisi
  const a = await p.evaluate(() => ({
    eauEau: __part('feu', 'eau', 'eau'),
    eauFeu: __part('feu', 'eau', 'feu'),
    sans: __part('feu', 'eau', null),
    absent: __part('feu', null, 'feu'),
    inconnu: __part('feu', 'constructor', 'feu'),
    autre: __part('terre', 'vent', 'vent')
  }));
  T('Braise (feu) avec elHeros « eau » : la clé reste feu, l\'élément choisi est eau', a.eauEau.hero === 'feu' && a.eauEau.elHeros === 'eau', JSON.stringify([a.eauEau.hero, a.eauEau.elHeros]));
  T("prédilection : arme d'Eau avec elHeros eau = +10 %", a.eauEau.pred === 1.1, a.eauEau.pred);
  T("prédilection : arme de Feu avec elHeros eau = pas de bonus (Braise n'est plus de feu)", a.eauFeu.pred === 1 && a.eauFeu.elArme === 'feu', a.eauFeu.pred);
  T("arme sans élément : l'élément choisi (eau), donc +10 %", a.sans.elArme === 'eau' && a.sans.pred === 1.1, a.sans.elArme);
  T('elHeros absent : la clé du héros (feu), prédilection avec une arme de Feu', a.absent.elHeros === 'feu' && a.absent.pred === 1.1);
  T('elHeros inconnu (« constructor ») : la clé du héros', a.inconnu.elHeros === 'feu', a.inconnu.elHeros);
  T('Roc (terre) avec elHeros vent : la clé reste terre, élément vent, prédilection avec une arme de Vent', a.autre.hero === 'terre' && a.autre.elHeros === 'vent' && a.autre.pred === 1.1);
  T("écran de fin : « Braise, Mage · balles d'Eau (+10 %) » ; sans bonus avec une arme de Feu", /Mage · balles d'Eau \(\+10 %\)/.test(a.eauEau.ligne) && /balles de Feu$/.test(a.eauFeu.ligne), a.eauEau.ligne + ' | ' + a.eauFeu.ligne);
  T('Guide : « Braise, Mage (Eau) » et « élément choisi pour ton héros (Eau) »', /Braise, Mage \(Eau\)/.test(a.eauEau.guide) && /élément choisi pour ton héros \(Eau\)/.test(a.eauEau.guide));

  // 2) l'avatar : le modèle de Braise, à la palette de l'élément choisi
  const v = await p.evaluate(() => {
    const s = el => __sig(instM('joueur.corps', el));
    return {
      feu: s({ el: 'feu', hero: 'feu' }),
      eau: s({ el: 'eau', hero: 'feu' }),
      gardienEau: s({ el: 'eau', hero: 'eau' }),
      avatarEau: __sig(instM('hero.avatar', { P: K.EL.eau, el: 'eau', hero: 'feu' })),
      braiseEau: __sig(instM('hero.braise', { P: K.EL.eau, el: 'eau' }))
    };
  });
  T('avatar de Braise avec élément eau : bleu (b > r)', v.eau[2] > v.eau[0] && v.feu[0] > v.feu[2], JSON.stringify([v.feu, v.eau]));
  T("c'est bien le modèle de Braise (pas le gardien) à la palette d'Eau", JSON.stringify(v.eau) !== JSON.stringify(v.gardienEau), JSON.stringify([v.eau, v.gardienEau]));
  T("hero.avatar : hero « feu » + el « eau » donne le modèle de Braise (palette d'Eau)", JSON.stringify(v.avatarEau) === JSON.stringify(v.braiseEau), JSON.stringify([v.avatarEau, v.braiseEau]));

  // 3) multi : l'élément choisi d'un autre joueur colore son avatar
  await p.evaluate(() => {
    __part('feu', null, null);
    const y = H,
      base = { x: 1, y, z: -10, yaw: 0, pitch: 0, tire: false, aTerre: false, arme: 'fusil' };
    window.__liste = [
      Object.assign({ id: 'a', nom: 'A', heros: 'feu', elHeros: 'eau' }, base),
      Object.assign({ id: 'b', nom: 'B', heros: 'feu' }, base),
      Object.assign({ id: 'c', nom: 'C', heros: 'feu', elHeros: 'constructor' }, base),
      Object.assign({ id: 'd', nom: 'D', heros: 'terre', elHeros: 42 }, base)
    ];
    window.joueursDistants = () => window.__liste;
  });
  await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    // la couleur du corps seul (sans l'arme, portée par le pivot de visée)
    const sc = r => {
        r.root.remove(r.visee);
        const v = __sig(r.root);
        r.root.add(r.visee);
        return v;
      },
      J = id => G.joueurs.find(r => r.id === id),
      s = (el, hero) => JSON.stringify(__sig(instM('joueur.corps', { el, hero })));
    return {
      a: J('a') && JSON.stringify(sc(J('a'))) === s('eau', 'feu') && J('a').elH === 'eau',
      aBleu: J('a') && sc(J('a'))[2] > sc(J('a'))[0],
      b: J('b') && JSON.stringify(sc(J('b'))) === s('feu', 'feu'),
      c: J('c') && JSON.stringify(sc(J('c'))) === s('feu', 'feu') && J('c').elH === 'feu',
      d: J('d') && JSON.stringify(sc(J('d'))) === s('terre', 'terre') && J('d').elH === 'terre'
    };
  });
  T("multi : elHeros « eau » d'un joueur Braise : avatar bleu, à la palette d'Eau", m.a === true && m.aBleu === true, JSON.stringify(m));
  T("multi : sans elHeros (vieux téléphone) : l'apparence d'avant (feu)", m.b === true);
  T('multi : elHeros douteux (« constructor », nombre) : la clé du héros', m.c === true && m.d === true, JSON.stringify(m));
  const ch = await p.evaluate(async () => {
    const sc = r => {
        r.root.remove(r.visee);
        const v = JSON.stringify(__sig(r.root));
        r.root.add(r.visee);
        return v;
      },
      av = sc(G.joueurs.find(r => r.id === 'b'));
    window.__liste[1].elHeros = 'bois';
    await new Promise(r => setTimeout(r, 1200));
    const r = G.joueurs.find(r => r.id === 'b');
    return { ok: r.elH === 'bois' && sc(r) === JSON.stringify(__sig(instM('joueur.corps', { el: 'bois', hero: 'feu' }))) && av !== sc(r) };
  });
  T("multi : l'élément choisi change en cours de route : l'avatar est refait", ch.ok, JSON.stringify(ch));

  // 4) le réseau : champ eh vérifié contre les six clés, comme e
  const net = await p.evaluate(() => {
    const e = el => (etatPropre({ v: 1, p: { n: 'x', h: 'feu', w: 'fusil', eh: el } }) || { p: {} }).p.eh;
    return [e('eau'), e('vent'), e('xx'), e(42), e(null), e({}), e('constructor'), e(undefined)];
  });
  T('réseau : etatPropre garde un élément valide (champ eh), sinon vide', JSON.stringify(net) === '["eau","vent","","","","","",""]', JSON.stringify(net));
  const pub = await p.evaluate(() => {
    __part('feu', 'eau', 'eau');
    return { id: ELKEYS.includes(S.elHeros) };
  });
  T('lobby : DernierToit.accepte annonce elHeros', /accepte: \[[^\]]*'elHeros'/.test(fs.readFileSync('interface/pont-lobby.js', 'utf8')) && /'elHeros'\]/.test(fs.readFileSync('dt-pour-lobby.js', 'utf8').slice(0, 1e9)) && pub.id);
  console.log(errs.length ? errs.join('\n') : 'erreurs 0');
  T('aucune erreur de page', errs.length === 0);
  console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
  process.exit(ko ? 1 : 0);
})();
