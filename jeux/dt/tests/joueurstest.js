// V4.3 : les autres joueurs sur le toit (affichage/joueurs.js), sans réseau : joueursDistants est remplacée par une liste factice.
// Vérifie : trois joueurs créés (corps, arme, étiquette, éclair, traînée) et posés à leur place ; le nom porté par l'étiquette (coupé
// à 12 caractères, couleur de l'élément, au-dessus de la tête) ; ils suivent leurs positions ; la marche (jambes) puis l'arrêt ;
// celui qui tire : éclair de bouche et traînée dans la direction de son regard ; celui qui est à terre : couché ; changement de héros
// et d'arme ; un joueur retiré de la liste est retiré de la scène (étiquette libérée) ; une liste vide, absente ou abîmée ne casse
// rien ; la scène revient au même nombre d'objets ; aucune erreur de page.
// Capture : shots/joueurs.png (966 × 366, trois joueurs sur le toit vus depuis le départ).
//   node tests/joueurstest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  fs.mkdirSync('shots', { recursive: true });
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
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve('test3d.html'));
  await p.waitForTimeout(800);
  // une partie « Ils s'échappent » (pas la première : pas de tuto), le joueur au départ
  await p.evaluate(() => {
    __dt.save.mode = 'out';
    __dt.save.runsOut = 3;
    __dt.newGame(1);
    document.getElementById('big').style.display = 'none';
  });
  await p.waitForTimeout(600);
  // attendre n images de l'affichage des joueurs (le moteur d'aperçu est lent : on compte les images, pas le temps)
  const images = async n => {
    const n0 = await p.evaluate(() => JR.n);
    for (let i = 0; i < 300; i++) {
      await p.waitForTimeout(40);
      if ((await p.evaluate(() => JR.n)) >= n0 + n) break;
    }
  };
  const vide = await p.evaluate(() => ({ n: scene.children.length, j: G.joueurs.length }));
  T("sans autres joueurs : rien n'est ajouté", vide.j === 0, JSON.stringify(vide));

  // ---- la liste factice : Léa (feu, fusil) debout, Marc (eau, assaut) tire vers la gauche, Zoé (terre, pompe) à terre ;
  // un témoin note, à chaque image, ce que l'on veut vérifier sur la durée (éclair, traînée, jambes)
  await p.evaluate(() => {
    const y = H;
    window.__liste = [
      { id: 'a', nom: 'Léa', heros: 'feu', arme: 'fusil', x: 1.7, y, z: -10.2, yaw: 0.5, pitch: 0, tire: false, aTerre: false },
      {
        id: 'b',
        nom: 'Maximilien-Alexandre',
        heros: 'eau',
        arme: 'assaut',
        x: 4.2,
        y,
        z: -11.3,
        yaw: 1.1,
        pitch: 0.05,
        tire: true,
        aTerre: false
      },
      { id: 'c', nom: 'Zoé', heros: 'terre', arme: 'pompe', x: -0.5, y, z: -12, yaw: -1.5, pitch: 0, tire: true, aTerre: true }
    ];
    window.__vraie = typeof joueursDistants === 'function' ? joueursDistants : null;
    window.joueursDistants = () => window.__liste;
    window.__vu = { flashB: 0, sansB: 0, traitB: 0, flashA: 0, flashC: 0, traitC: 0, jambe: 0, dir: null };
    const orig = joueursFrame;
    window.joueursFrame = function (S, dt) {
      orig(S, dt);
      const V = window.__vu,
        J = id => G.joueurs.find(r => r.id === id);
      const a = J('a'),
        bb = J('b'),
        c = J('c');
      if (bb && bb.flash.visible) V.flashB++;
      else if (bb) V.sansB++;
      if (bb && bb.trait.visible) {
        V.traitB++;
        V.dir = [bb.trait.rotation.y, bb.trait.rotation.x];
      }
      if (a && a.flash.visible) V.flashA++;
      if (c && c.flash.visible) V.flashC++;
      if (c && c.trait.visible) V.traitC++;
      if (a) V.jambe = Math.max(V.jambe, Math.abs(a.nodes.legL.rotation.x));
    };
  });
  await images(6);
  const s = await p.evaluate(() =>
    G.joueurs.map(r => ({
      id: r.id,
      nom: r.nom,
      heros: r.heros,
      arme: r.arme,
      dansScene: r.root.parent === scene && r.lab.parent === scene && r.trait.parent === scene,
      arme3d: !!r.gun && r.gun.parent === r.visee && r.flash.parent === r.gun,
      x: r.root.position.x,
      y: r.root.position.y,
      z: r.root.position.z,
      ry: r.root.rotation.y,
      rx: r.root.rotation.x,
      labY: r.lab.position.y,
      labW: r.lab.scale.x
    }))
  );
  T('trois joueurs dessinés', s.length === 3, s.map(r => r.id).join(','));
  T(
    'corps, étiquette et traînée dans la scène ; arme en main, éclair au bout',
    s.every(r => r.dansScene && r.arme3d)
  );
  T('héros et armes repris de la liste', s.map(r => r.heros + '/' + r.arme).join(' ') === 'feu/fusil eau/assaut terre/pompe');
  const A = s.find(r => r.id === 'a');
  T('Léa à sa place, debout, tournée selon yaw', A.x === 1.7 && A.z === -10.2 && Math.abs(A.y - 19.4) < 1e-6 && A.ry === 0.5 && A.rx === 0);
  T('étiquette au-dessus de la tête', A.labY > A.y + 2 && A.labY < A.y + 2.6, (A.labY - A.y).toFixed(2));
  T("le nom de l'étiquette", s.map(r => r.nom).join(',') === 'Léa,Maximilien-A,Zoé', s.map(r => r.nom).join(','));
  // l'étiquette est bien dessinée : du texte de la couleur de l'élément (feu : clair orangé) au milieu du canevas
  const pix = await p.evaluate(() => {
    const r = G.joueurs[0],
      d = r.lab.userData.c.getContext('2d').getImageData(0, 0, 384, 96).data;
    let fond = 0,
      texte = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 100) fond++;
      if (d[i] > 200 && d[i + 1] > 120 && d[i + 2] < 140 && d[i + 3] > 200) texte++;
    }
    return { fond, texte, map: r.lab.material.map === r.lab.userData.t };
  });
  T('étiquette dessinée (fond et nom à la couleur du feu)', pix.fond > 8000 && pix.texte > 300 && pix.map, JSON.stringify(pix));
  const C = s.find(r => r.id === 'c');
  T('Zoé à terre : couchée (rotation de π/2), étiquette plus basse', Math.abs(C.rx - Math.PI / 2) < 0.01 && C.labY < C.y + 1.2);

  // ---- la capture : les trois joueurs vus depuis le départ (le panneau « Jour 1 » est caché le temps de la capture)
  await images(4);
  await p.evaluate(() => (document.getElementById('wave').style.visibility = 'hidden'));
  await p.screenshot({ path: 'shots/joueurs.png' });
  await p.evaluate(() => (document.getElementById('wave').style.visibility = ''));

  // ---- le tir : éclair et traînée chez Marc (dans la direction de son regard), rien chez Léa, rien chez Zoé (à terre)
  await images(20);
  const v = await p.evaluate(() => window.__vu);
  T(
    'Marc tire : éclair de bouche par moments (au rythme de son arme)',
    v.flashB > 0 && v.sansB > 0,
    v.flashB + ' images avec, ' + v.sansB + ' sans'
  );
  const yaw = 1.1,
    pitch = 0.05,
    dx = -Math.sin(yaw) * Math.cos(pitch),
    dy = Math.sin(pitch),
    dz = -Math.cos(yaw) * Math.cos(pitch);
  T(
    'Marc tire : traînée dans la direction de son regard',
    v.traitB > 0 &&
      v.dir &&
      Math.abs(v.dir[0] - Math.atan2(dx, dz)) < 1e-6 &&
      Math.abs(v.dir[1] + Math.atan2(dy, Math.hypot(dx, dz))) < 1e-6,
    JSON.stringify(v.dir)
  );
  T('Léa ne tire pas, Zoé est à terre : ni éclair ni traînée', v.flashA === 0 && v.flashC === 0 && v.traitC === 0);
  const tip = await p.evaluate(() => {
    const r = G.joueurs.find(q => q.id === 'b');
    r.root.updateMatrixWorld(true);
    const o = new THREE.Vector3(r.tip[0], r.tip[1], r.tip[2]).applyMatrix4(r.gun.matrixWorld);
    return { x: o.x - r.root.position.x, y: o.y - r.root.position.y, z: o.z - r.root.position.z };
  });
  T(
    "le bout du canon : devant lui, à hauteur d'épaule",
    tip.y > 1.1 && tip.y < 1.7 && tip.x * dx + tip.z * dz > 0.5,
    JSON.stringify(tip, (k, x) => (typeof x === 'number' ? +x.toFixed(2) : x))
  );

  // ---- ils suivent leurs positions ; la marche de Léa puis son arrêt
  await p.evaluate(() => {
    window.__marche = setInterval(() => {
      const a = window.__liste[0];
      a.x += 0.06;
      a.z -= 0.02;
    }, 30);
  });
  await images(12);
  const m = await p.evaluate(() => {
    const r = G.joueurs.find(q => q.id === 'a'),
      e = window.__liste[0];
    return { dx: Math.abs(r.root.position.x - e.x), w: r.w, jambe: window.__vu.jambe };
  });
  T('Léa suit sa position (marche)', m.dx < 0.2, m.dx.toFixed(3));
  T('Léa marche : jambes en mouvement', m.w > 0.3 && m.jambe > 0.1, JSON.stringify(m));
  await p.evaluate(() => clearInterval(window.__marche));
  await images(25);
  const arret = await p.evaluate(() => {
    const r = G.joueurs.find(q => q.id === 'a'),
      e = window.__liste[0];
    return { x: r.root.position.x - e.x, w: r.w, l: Math.abs(r.nodes.legL.rotation.x) };
  });
  T('Léa arrêtée : debout, immobile, à sa place', arret.x === 0 && arret.w < 0.05 && arret.l < 0.03, JSON.stringify(arret));

  // ---- changement de héros et d'arme ; Zoé se relève
  await p.evaluate(() => {
    window.__ancien = G.joueurs.find(q => q.id === 'b').root;
    window.__liste[1].heros = 'elec';
    window.__liste[1].arme = 'lance';
    window.__liste[2].aTerre = false;
    window.__liste[2].tire = false;
  });
  await images(30);
  const ch = await p.evaluate(() => {
    const r = G.joueurs.find(q => q.id === 'b'),
      c = G.joueurs.find(q => q.id === 'c');
    return {
      heros: r.heros,
      arme: r.arme,
      ancien: window.__ancien.parent === null,
      neuf: r.root.parent === scene && r.root !== window.__ancien,
      flash: r.flash.parent === r.gun,
      jet: r.trait.material === JR.matJet,
      debout: Math.abs(c.root.rotation.x) < 0.05
    };
  });
  T(
    "Marc passe à Volt et au lance-flammes : nouveau corps, nouvelle arme, l'ancien corps est retiré",
    ch.heros === 'elec' && ch.arme === 'lance' && ch.ancien && ch.neuf && ch.flash && ch.jet,
    JSON.stringify(ch)
  );
  T('Zoé se relève', ch.debout);

  // ---- un joueur qui part : retiré de la scène, son étiquette libérée
  await p.evaluate(() => {
    const r = G.joueurs.find(q => q.id === 'a');
    window.__parti = r;
    window.__libere = 0;
    const t = r.lab.material.map,
      mt = r.lab.material,
      d1 = t.dispose.bind(t),
      d2 = mt.dispose.bind(mt);
    t.dispose = () => {
      window.__libere++;
      d1();
    };
    mt.dispose = () => {
      window.__libere++;
      d2();
    };
    window.__liste.splice(0, 1);
  });
  await images(3);
  const dep = await p.evaluate(() => ({
    n: G.joueurs.length,
    ids: G.joueurs.map(r => r.id).join(','),
    hors: window.__parti.root.parent === null && window.__parti.lab.parent === null && window.__parti.trait.parent === null,
    libere: window.__libere
  }));
  T(
    'Léa part : retirée de la scène, étiquette libérée (texture et matière)',
    dep.n === 2 && dep.ids === 'b,c' && dep.hors && dep.libere === 2,
    JSON.stringify(dep)
  );

  // ---- une liste abîmée (venue du réseau) ne casse rien
  await p.evaluate(() => {
    window.__liste.push(
      null,
      { id: { x: 1 } },
      { id: 'z', nom: '<b>x</b>\u0007', heros: 'constructor', arme: '__proto__', x: 'abc', y: null, z: NaN, yaw: Infinity, tire: 1 },
      { id: 'b', nom: 'Doublon', heros: 'feu', arme: 'sniper', x: 0, y: 0, z: 0 }
    );
  });
  await images(4);
  const ab = await p.evaluate(() => {
    const z = G.joueurs.find(q => q.id === 'z');
    return {
      n: G.joueurs.length,
      z: z && [z.nom, z.heros, z.arme, z.root.position.x, z.root.position.z].join(','),
      b: G.joueurs.find(q => q.id === 'b').nom
    };
  });
  T(
    'liste abîmée : entrées invalides ignorées, valeurs par défaut, doublon ignoré',
    ab.n === 3 && ab.z === '<b>x</b>,feu,fusil,0,0' && ab.b === 'Maximilien-A',
    JSON.stringify(ab)
  );

  // ---- liste vide, puis fonction absente : plus personne, la scène revient comme avant
  await p.evaluate(() => (window.__liste = []));
  await images(3);
  const fin = await p.evaluate(() => ({ n: scene.children.length, j: G.joueurs.length }));
  T("liste vide : plus personne, la scène revient au même nombre d'objets", fin.j === 0 && fin.n === vide.n, JSON.stringify(fin));
  await p.evaluate(() => {
    window.__liste = [{ id: 'q', nom: 'Q', heros: 'bois', arme: 'sniper', x: 0, y: H, z: -9, yaw: 0, pitch: 0 }];
  });
  await images(3);
  await p.evaluate(() => {
    // la vraie (interface/multi.js, sans multi : liste vide) si elle existe, sinon plus de fonction du tout
    if (window.__vraie) window.joueursDistants = window.__vraie;
    else delete window.joueursDistants;
  });
  await images(3);
  const sans = await p.evaluate(() => ({ n: scene.children.length, j: G.joueurs.length, t: typeof joueursDistants }));
  T(
    'sans multi (ou sans joueursDistants) : rien de dessiné, sans erreur',
    sans.j === 0 && sans.n === vide.n && (sans.t === 'undefined' || sans.t === 'function'),
    JSON.stringify(sans)
  );

  T('aucune erreur de page', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
