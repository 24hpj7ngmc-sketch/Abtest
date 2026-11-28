// test de l'Arsenal (la salle d'armes, V13.5) : on y entre à pied, ses murs arrêtent, les six armes exposées s'ouvrent au panneau de la salle d'armes,
// l'élément et le niveau de chaque arme se voient, l'arme en main a la lumière la plus forte, la porte ouvre toujours le panneau, l'affûtage se ramasse,
// chaque niveau tient à sa place, l'intérieur n'est pas dessiné de loin, la visite chez un autre joueur.
//   usage : ./mktest.sh puis node tests/runarsenal.js (≈ 40 s) ; captures : node tests/arsenalshot.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('ERREUR ' + e.message.slice(0, 220)));
  p.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push('console ' + m.text().slice(0, 200));
  });
  await p.addInitScript(() => {
    window.__autoPanel = false;
    window.__nodemo = true;
    window.__nohv = true;
  });
  await p.goto('file://' + path.resolve('construit/test.html'));
  await p.waitForTimeout(800);
  const G = (f, a) => p.evaluate(f, a),
    W = ms => p.waitForTimeout(ms),
    ok = (n, c, d) => console.log((c ? 'ok  ' : 'RATÉ ') + n + (c || d === undefined ? '' : ' · ' + JSON.stringify(d)));
  await G(() => {
    const g = __g();
    g.vilDemo();
    for (const v of document.querySelectorAll('.veil')) v.hidden = true;
  });
  // se poser à un point du repère du Hall (la porte côté +Z), regarder vers un autre ; « tenir » rejoue la pose à chaque image
  const pose = (o, c, tenir) =>
    G(
      ([o, c, tenir]) => {
        const g = __g(),
          L = g.LB,
          B = g.save.vil.find(B => B.t === 'armes'),
          a = g.vilMonde(B, o[0], o[1]),
          d = g.vilMonde(B, c[0], c[1]);
        clearInterval(window.__hold);
        const f = () => {
          L.x = a[0];
          L.z = a[1];
          L.y = g.walkAt(a[0], a[1], 1e9);
          L.vy = 0;
          L.yaw = Math.atan2(a[0] - d[0], a[1] - d[1]);
          L.pitch = 0;
        };
        f();
        if (tenir) window.__hold = setInterval(f, 8);
      },
      [o, c, tenir]
    );
  // où est le joueur, dans le repère du Hall
  const ici = () =>
    G(() => {
      const g = __g(),
        L = g.LB,
        B = g.save.vil.find(B => B.t === 'armes'),
        dx = L.x - B.x,
        dz = L.z - B.z,
        c = Math.cos(B.r),
        s = Math.sin(B.r);
      return [+(dx * c - dz * s).toFixed(2), +(dx * s + dz * c).toFixed(2)];
    });
  // pousser le joystick (avant, droite) pendant ms millisecondes, en relevant la position
  const marche = async (f, r, ms) => {
    await G(
      ([f, r]) => {
        clearInterval(window.__hold);
        window.__trace = [];
        window.__hold = setInterval(() => {
          const g = __g(),
            L = g.LB,
            B = g.save.vil.find(B => B.t === 'armes'),
            dx = L.x - B.x,
            dz = L.z - B.z,
            c = Math.cos(B.r),
            s = Math.sin(B.r);
          g.joy.f = f;
          g.joy.r = r;
          window.__trace.push([dx * c - dz * s, dx * s + dz * c]);
        }, 16);
      },
      [f, r]
    );
    await W(ms);
    return G(() => {
      clearInterval(window.__hold);
      const g = __g();
      g.joy.f = g.joy.r = 0;
      return window.__trace;
    });
  };
  const info = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'armes'),
      v = g.vilV.get(B.id);
    return {
      l: B.l || 1,
      cols: v.userData.cols.length,
      expo: v.userData.expo.map(A => A.w).join(),
      r: g.rOf(B),
      x: B.x,
      z: B.z
    };
  });
  ok(
    "la salle d'armes est un arsenal : murs en obstacles, six armes exposées, emprise de 8,7 m",
    info.cols > 60 && info.expo === 'pistolet,assaut,sniper,fusil,pompe,lance' && info.r === 8.7,
    info
  );

  // ---- on entre par la grande porte, à pied
  await pose([0, 13], [0, 0]);
  const t1 = await marche(1, 0, 2600),
    z1 = t1[t1.length - 1];
  ok(
    'on entre à pied par la grande porte (repère de l’Arsenal : ' + z1.map(v => v.toFixed(1)).join(' ; ') + ')',
    z1[1] < 3 && Math.abs(z1[0]) < 1.5,
    z1
  );
  // ---- dedans, les murs arrêtent : on pousse dans huit directions, on ne sort que par la porte
  let dehors = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    await pose([0, 1.5], [Math.sin(a) * 10, 1.5 + Math.cos(a) * 10]);
    const T = await marche(1, 0, 1500);
    for (const q of T) {
      const dansHalle = Math.abs(q[0]) < 4.45 && q[1] < 4.3 && q[1] > -4.1,
        porte = Math.abs(q[0]) < 1.5 && q[1] >= 4.3;
      if (!dansHalle && !porte) dehors.push([k, q.map(v => +v.toFixed(2))]);
    }
  }
  ok('dedans, personne ne passe à travers les murs (huit directions)', dehors.length === 0, dehors.slice(0, 4));
  // les présentoirs arrêtent : on ne monte pas sur une vitrine
  await pose([0, 0.4], [10, 0.4]);
  let T = await marche(1, 0, 1500);
  ok('le présentoir et son pupitre arrêtent', Math.max(...T.map(q => q[0])) < 2.5, T[T.length - 1]);
  // la forge du fond arrête aussi
  await pose([0.0, 0.6], [0.0, -10]);
  T = await marche(1, 0, 1500);
  ok('l’enclume et le foyer arrêtent', Math.min(...T.map(q => q[1])) > -1.7, T[T.length - 1]);
  // de dehors, on ne traverse pas non plus : un long mur
  await pose([12, 1.0], [0, 1.0]);
  T = await marche(1, 0, 1800);
  ok('de dehors, le mur de la halle arrête', Math.min(...T.map(q => q[0])) > 5.2, T[T.length - 1]);

  // ---- devant une arme exposée : l'étiquette, puis Action ouvre le panneau de la salle d'armes sur elle
  await G(() => {
    const g = __g();
    g.setWeap('pistolet');
    g.save.wl.assaut = g.save.wl.assaut || {};
    delete g.save.wl.assaut.d1;
  });
  await pose([1.7, 0.4], [3.25, 0.4], true);
  await W(400);
  let r = await G(() => {
    const g = __g();
    return {
      k: g.LB.near && g.LB.near.k,
      w: g.LB.near && g.LB.near.w,
      lab: document.querySelector('#aLab b').textContent,
      b: document.querySelector('#bFire').textContent,
      main: g.getWeap()
    };
  });
  ok(
    'devant le fusil d’assaut : son nom, son niveau, son élément ; le bouton dit « Voir »',
    r.k === 'vitrine' && r.w === 'assaut' && /^Fusil d'assaut · niv\. \d+ · \S/.test(r.lab) && /Voir/.test(r.b),
    r
  );
  await G(() => __g().lobAct(1));
  await W(300);
  r = await G(() => ({
    v: !document.getElementById('tree').hidden,
    main: __g().getWeap(),
    sel: (document.querySelector('#tArms .tchip.sel[data-w]') || {}).dataset,
    t: document.getElementById('tTitle').textContent
  }));
  ok(
    'Action ouvre le panneau de la salle d’armes sur le fusil d’assaut, qui passe en main',
    r.v && r.main === 'assaut' && r.sel && r.sel.w === 'assaut' && /^Fusil d'assaut/.test(r.t),
    r
  );
  await G(() => {
    document.getElementById('tree').hidden = true;
  });
  // son élément et son niveau se changent au panneau : la vitrine suit (arme, lumière, plaque)
  await G(() => {
    const g = __g();
    g.setWEl('assaut', 'eau');
    g.save.wl.assaut.d1 = 1;
  });
  await W(700);
  r = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'armes'),
      E = g.vilV.get(B.id).userData.expo,
      A = E.find(a => a.w === 'assaut'),
      o = E.filter(a => a.w !== 'assaut');
    return {
      el: A.el,
      lv: A.lv,
      col: A.beam.material.color.getHex().toString(16),
      k: +A.k.toFixed(2),
      op: +A.beam.material.opacity.toFixed(2),
      autres: +Math.max(...o.map(a => a.beam.material.opacity)).toFixed(2),
      lab: document.querySelector('#aLab b').textContent
    };
  });
  ok(
    'le fusil d’assaut passe à l’Eau et au niveau 1 : son arme, sa lumière, sa plaque et l’étiquette suivent',
    r.el === 'eau' && r.col === '3fa9ff' && r.lv === 1 && /niv\. 1 · Eau · en main/.test(r.lab),
    r
  );
  ok('l’arme en main a la lumière la plus forte', r.k > 0.8 && r.op > r.autres + 0.1, r);
  await G(() => {
    const g = __g();
    delete g.save.wel.assaut;
    delete g.save.wl.assaut.d1;
  });
  // ---- la porte : l'ancien accès ouvre le panneau sur l'arme en main
  await pose([0, 7.1], [0, 0], true);
  await W(400);
  r = await G(() => ({ k: __g().LB.near && __g().LB.near.k, lab: document.querySelector('#aLab b').textContent }));
  ok('devant la porte : « Salle d’armes »', r.k === 'armes' && /^Salle d'armes/.test(r.lab), r);
  await G(() => __g().lobAct(1));
  await W(300);
  r = await G(() => ({
    v: !document.getElementById('tree').hidden,
    sel: (document.querySelector('#tArms .tchip.sel[data-w]') || {}).dataset
  }));
  ok('Action à la porte ouvre le panneau sur l’arme en main', r.v && r.sel && r.sel.w === 'assaut', r);
  await G(() => {
    document.getElementById('tree').hidden = true;
  });
  // ---- l'affûtage se ramasse toujours en passant devant
  r = await G(async () => {
    const g = __g();
    g.save.hv.s.armes = 1;
    delete g.save.prep.aff;
    window.__nohv = false;
    await new Promise(f => setTimeout(f, 700));
    window.__nohv = true;
    return { aff: g.save.prep.aff || 0, s: g.save.hv.s.armes };
  });
  ok('l’affûtage se ramasse en passant devant la porte', r.aff > 0 && r.s < 1, r);
  // ---- de loin, l'intérieur n'est pas dessiné
  await pose([0, 75], [0, 0], true);
  await W(300);
  r = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'armes'),
      u = g.vilV.get(B.id).userData;
    return {
      dedans: u.m.userData.nodes.dedans.visible,
      armes: u.expo.some(A => A.piv.visible),
      forge: u.forge.visible
    };
  });
  ok('à 75 m, ni l’intérieur, ni les armes, ni la forge ne sont dessinés', !r.dedans && !r.armes && !r.forge, r);
  await G(() => clearInterval(window.__hold));

  // ---- les six niveaux : même place ; rien ne déborde sur les autres bâtiments, les chemins, les portails
  r = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'armes'),
      H = g.save.vil.find(B => B.t === 'hall'),
      out = [];
    for (let l = 1; l <= 6; l++) {
      H.l = l;
      g.vilRe(H);
      B.l = l;
      g.vilRe(B);
      g.terraPlan();
      const v = g.vilV.get(B.id),
        pr = v.userData.m.userData.prep,
        hp = g.vilV.get(H.id).userData.m.userData.prep,
        R = g.rOf(B),
        coins = [],
        m = v.userData.m,
        fu = m.userData.nodes.fumee;
      // les sommets dans le repère du modèle (chaque pièce est posée sur son pivot) ; la fumée ne compte pas dans la hauteur
      let haut = 0;
      m.traverse(o => {
        const A = o.geometry && o.geometry.attributes && o.geometry.attributes.position;
        if (!A) return;
        let q = o,
          dx = 0,
          dy = 0,
          dz = 0,
          fum = false;
        while (q && q !== m) {
          dx += q.position.x;
          dy += q.position.y;
          dz += q.position.z;
          if (q === fu) fum = true;
          q = q.parent;
        }
        for (let i = 0; i < A.array.length; i += 3) {
          const y = A.array[i + 1] + dy;
          if (y < 4) coins.push([A.array[i] + dx, A.array[i + 2] + dz]);
          if (!fum) haut = Math.max(haut, y);
        }
      });
      const bord = Math.max(...v.userData.cols.map(o => Math.hypot(o[0] - B.x, o[1] - B.z) + o[2] * 0.4)),
        autres = g.save.vil.filter(o => o !== B && !g.CAT[o.t].pass && Math.hypot(o.x - B.x, o.z - B.z) < R + g.rOf(o)),
        portails = g.LGAMES.filter(G => Math.hypot(G.x - B.x, G.z - B.z) < R + 11.5),
        chemins = g.ROADS.edges.filter(e => {
          const vx = e.bx - e.ax,
            vz = e.bz - e.az,
            l2 = vx * vx + vz * vz || 1,
            t = Math.max(0, Math.min(1, ((B.x - e.ax) * vx + (B.z - e.az) * vz) / l2));
          return Math.hypot(e.ax + vx * t - B.x, e.az + vz * t - B.z) < R + 1;
        });
      out.push({
        l,
        tris: pr.tris,
        haut: +haut.toFixed(1),
        hall: +hp.max[1].toFixed(1),
        coin: +Math.max(...coins.map(q => Math.hypot(q[0], q[1]))).toFixed(2),
        bord: +bord.toFixed(2),
        autres: autres.map(o => o.t).join(),
        portails: portails.length,
        chemins: chemins.length,
        expo: v.userData.expo.length
      });
    }
    B.l = 1;
    g.vilRe(B);
    H.l = 1;
    g.vilRe(H);
    return out;
  });
  console.log(
    '   niveaux : ' +
      r
        .map(
          q => 'niv. ' + q.l + ' ' + q.tris + ' tri., ' + q.haut + ' m (Hall ' + q.hall + ' m), coin à ' + q.coin + ' m'
        )
        .join(' · ')
  );
  ok(
    'à chaque niveau l’Arsenal tient dans son cercle (8,7 m), sans toucher bâtiment, chemin ni portail',
    r.every(q => q.coin <= 8.8 && q.bord <= 8.8 && !q.autres && !q.portails && !q.chemins && q.expo === 6),
    r
  );
  ok(
    'il s’embellit avec le niveau, plus haut qu’une maison, moins que la cathédrale du même niveau',
    r[0].haut > 11 && r[5].tris > r[0].tris && r[3].haut > r[0].haut && r.every(q => q.haut < q.hall),
    r.map(q => [q.haut, q.hall])
  );

  // ---- en visite chez un autre joueur : son Arsenal à son niveau, nos propres armes dedans
  r = await G(() => {
    const g = __g();
    g.setWEl('sniper', 'vent');
    g.islVisit(
      'x',
      {
        e: 4,
        v: [
          ['hall', 0, 0, 3.14, 4],
          ['armes', 30, 0, -1.57, 3]
        ],
        t: 'A99999999'
      },
      'test'
    );
    const B = g.save.vil.find(B => B.t === 'armes'),
      v = B && g.vilV.get(B.id),
      o = {
        vis: g.VISIT.on,
        l: B && g.lvOf(B),
        expo: v && v.userData.expo.map(a => a.w + ':' + a.el).join(),
        cols: v && v.userData.cols.length
      };
    g.islHome();
    delete g.save.wel.sniper;
    return Object.assign(o, { back: !g.VISIT.on });
  });
  ok(
    'en visite : l’Arsenal de l’hôte (niveau 3), nos armes dans nos éléments, puis retour',
    r.vis && r.l === 3 && /sniper:vent/.test(r.expo) && r.cols > 60 && r.back,
    r
  );

  console.log('erreurs', errs.length);
  if (errs.length) console.log([...new Set(errs)].slice(0, 8).join('\n'));
  await b.close();
})();
