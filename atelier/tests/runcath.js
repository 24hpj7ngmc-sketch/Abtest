// test de la cathédrale des héros (le Hall, V13.4) : on y entre à pied, ses murs arrêtent, les six héros exposés s'ouvrent au panneau du Hall,
// l'élément choisi et le héros incarné se voient, la porte ouvre toujours le panneau, chaque niveau tient à sa place, la visite chez un autre joueur.
//   usage : node tests/cathshot.js n'est pas nécessaire ; ./mktest.sh puis node tests/runcath.js (≈ 40 s)
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
          B = g.save.vil.find(B => B.t === 'hall'),
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
        B = g.save.vil.find(B => B.t === 'hall'),
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
            B = g.save.vil.find(B => B.t === 'hall'),
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
      B = g.save.vil.find(B => B.t === 'hall'),
      v = g.vilV.get(B.id);
    return { l: B.l || 1, cols: v.userData.cols.length, heros: v.userData.heroes.length, r: g.rOf(B), x: B.x, z: B.z };
  });
  ok(
    'le Hall est une cathédrale : murs en obstacles, six héros exposés, emprise de 10,6 m',
    info.cols > 80 && info.heros === 6 && info.r === 10.6,
    info
  );

  // ---- on entre par la grande porte, à pied
  await pose([0, 15], [0, 0]);
  const t1 = await marche(1, 0, 2600),
    z1 = t1[t1.length - 1];
  ok(
    'on entre à pied par la grande porte (repère du Hall : ' + z1.map(v => v.toFixed(1)).join(' ; ') + ')',
    z1[1] < 4 && Math.abs(z1[0]) < 1.5,
    z1
  );
  // ---- dedans, les murs, les piliers et les cordons arrêtent : on pousse dans huit directions, on ne sort que par la porte
  let dehors = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    await pose([0, 1.5], [Math.sin(a) * 10, 1.5 + Math.cos(a) * 10]);
    const T = await marche(1, 0, 1500);
    for (const q of T) {
      const dansNef = Math.abs(q[0]) < 4.35 && q[1] < 6.7 && q[1] > -3.8,
        dansAbside = q[1] <= -3.8 && Math.hypot(q[0], q[1] + 3.8) < 4.4,
        porte = Math.abs(q[0]) < 1.45 && q[1] >= 6.7;
      if (!dansNef && !dansAbside && !porte) dehors.push([k, q.map(v => +v.toFixed(2))]);
    }
  }
  ok(
    'dedans, personne ne passe à travers les murs ni les piliers (huit directions)',
    dehors.length === 0,
    dehors.slice(0, 4)
  );
  // les cordons gardent les socles : on ne monte pas sur les héros
  await pose([0, 1.0], [10, 1.0]);
  let T = await marche(1, 0, 1500);
  ok('les cordons de velours arrêtent devant le socle', Math.max(...T.map(q => q[0])) < 2.25, T[T.length - 1]);
  // de dehors, on ne traverse pas non plus : un long mur de la nef
  await pose([12, 0], [0, 0]);
  T = await marche(1, 0, 1800);
  ok('de dehors, le mur de la nef arrête', Math.min(...T.map(q => q[0])) > 5.2, T[T.length - 1]);

  // ---- devant un héros exposé : l'étiquette, puis Action ouvre le panneau sur lui
  await pose([1.4, -2.2], [3.4, -2.2], true);
  await W(400);
  let r = await G(() => {
    const g = __g();
    return {
      k: g.LB.near && g.LB.near.k,
      e: g.LB.near && g.LB.near.e,
      lab: document.querySelector('#aLab b').textContent,
      w: document.querySelector('#bFire').textContent,
      h: g.getHero()
    };
  });
  ok(
    'devant Volt : son nom, son rôle, son élément ; le bouton dit « Voir »',
    r.k === 'heros' && r.e === 'elec' && /^Volt · Assassin · Élec/.test(r.lab) && /Voir/.test(r.w),
    r
  );
  await G(() => __g().lobAct(1));
  await W(300);
  r = await G(() => ({
    v: !document.getElementById('hallV').hidden,
    vu: __g().getHallVu(),
    i: !document.getElementById('hallI').hidden && document.getElementById('hallI').textContent,
    a: document.getElementById('hallA').textContent,
    t: document.getElementById('hallT').textContent,
    el: document.getElementById('hallEl').textContent,
    c: !!document.querySelector('#hallB .pick.vu[data-el=elec]'),
    h: __g().getHero()
  }));
  ok(
    'Action ouvre le panneau du Hall sur Volt (sans l’incarner) : « Incarner Volt », son arbre, son élément',
    r.v &&
      r.vu === 'elec' &&
      r.i === 'Incarner Volt' &&
      /^Arbre de Volt/.test(r.a) &&
      /Devant toi : Volt/.test(r.t) &&
      /Son élément/.test(r.el) &&
      r.c &&
      r.h === 'feu',
    r
  );
  await p.locator('#hallI').evaluate(e => e.click());
  await W(300);
  r = await G(() => ({
    h: __g().getHero(),
    i: document.getElementById('hallI').hidden,
    t: document.getElementById('hallT').textContent
  }));
  ok('« Incarner Volt » : on joue Volt, le panneau le dit', r.h === 'elec' && r.i && /^Tu incarnes Volt/.test(r.t), r);
  // son élément se change ici même, et sa statue suit
  await p.locator('#hallEl .tchip[data-hel=eau]').evaluate(e => e.click());
  await W(400);
  r = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'hall'),
      H = g.vilV.get(B.id).userData.heroes,
      V = H.find(h => h.el === 'elec'),
      o = H.filter(h => h.el !== 'elec');
    return {
      ee: V.ee,
      ehl: g.elH('elec'),
      col: V.beam.material.color.getHex().toString(16),
      w: +V.w.toFixed(2),
      op: +V.beam.material.opacity.toFixed(2),
      autres: Math.max(...o.map(h => h.beam.material.opacity)).toFixed(2)
    };
  });
  ok(
    'Volt passe à l’Eau : sa figure et son cône de lumière suivent',
    r.ee === 'eau' && r.ehl === 'eau' && r.col === '3fa9ff',
    r
  );
  ok('le héros incarné a la lumière la plus forte', r.w > 0.8 && r.op > +r.autres + 0.1, r);
  await G(() => {
    __g().setHEl('elec', 'elec');
    document.getElementById('hallV').hidden = true;
  });
  // ---- la porte : l'ancien accès ouvre le panneau sur le héros incarné
  await pose([0, 9.0], [0, 0], true);
  await W(400);
  r = await G(() => ({ k: __g().LB.near && __g().LB.near.k, lab: document.querySelector('#aLab b').textContent }));
  ok('devant la porte : « Hall des héros »', r.k === 'hall' && /^Hall des héros/.test(r.lab), r);
  await G(() => __g().lobAct(1));
  await W(300);
  r = await G(() => ({
    v: !document.getElementById('hallV').hidden,
    vu: __g().getHallVu(),
    i: document.getElementById('hallI').hidden
  }));
  ok('Action à la porte ouvre le panneau sur le héros incarné', r.v && r.vu === 'elec' && r.i, r);
  await G(() => {
    document.getElementById('hallV').hidden = true;
    clearInterval(window.__hold);
  });

  // ---- les six niveaux : même place, même intérieur ; rien ne déborde sur les autres bâtiments, les chemins, les portails
  r = await G(() => {
    const g = __g(),
      B = g.save.vil.find(B => B.t === 'hall'),
      out = [];
    for (let l = 1; l <= 6; l++) {
      B.l = l;
      g.vilRe(B);
      g.terraPlan();
      const v = g.vilV.get(B.id),
        pr = v.userData.m.userData.prep,
        R = g.rOf(B),
        coins = [];
      // les sommets du modèle les plus loin du centre (au sol, sous 4 m : ce qui peut toucher un voisin), dans le repère du Hall
      v.userData.m.traverse(o => {
        const A = o.geometry && o.geometry.attributes && o.geometry.attributes.position;
        if (A)
          for (let i = 0; i < A.array.length; i += 3) if (A.array[i + 1] < 4) coins.push([A.array[i], A.array[i + 2]]);
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
        haut: +pr.max[1].toFixed(1),
        coin: +Math.max(...coins.map(q => Math.hypot(q[0], q[1]))).toFixed(2),
        bord: +bord.toFixed(2),
        autres: autres.map(o => o.t).join(),
        portails: portails.length,
        chemins: chemins.length,
        heros: v.userData.heroes.length
      });
    }
    B.l = 1;
    g.vilRe(B);
    return out;
  });
  console.log(
    '   niveaux : ' +
      r.map(q => 'niv. ' + q.l + ' ' + q.tris + ' tri., ' + q.haut + ' m de haut, coin à ' + q.coin + ' m').join(' · ')
  );
  ok(
    'à chaque niveau la cathédrale tient dans son cercle (10,6 m), sans toucher bâtiment, chemin ni portail',
    r.every(q => q.coin <= 10.8 && q.bord <= 10.8 && !q.autres && !q.portails && !q.chemins && q.heros === 6),
    r
  );
  ok(
    'elle grandit en hauteur avec le niveau, et dépasse les autres bâtiments dès le niveau 1',
    r[0].haut > 12 && r[5].haut > r[3].haut && r[3].haut > r[0].haut,
    r.map(q => q.haut)
  );

  // ---- en visite chez un autre joueur : sa cathédrale à son niveau, nos propres héros dedans
  r = await G(() => {
    const g = __g();
    g.setHEl('bois', 'vent');
    g.islVisit(
      'x',
      {
        e: 4,
        v: [
          ['hall', 0, 0, 3.14, 4],
          ['maison', -30, 0, 1.57, 2]
        ],
        t: 'A99999999'
      },
      'test'
    );
    const B = g.save.vil.find(B => B.t === 'hall'),
      v = B && g.vilV.get(B.id),
      o = {
        vis: g.VISIT.on,
        l: B && g.lvOf(B),
        heros: v && v.userData.heroes.map(h => h.el + ':' + h.ee).join(),
        cols: v && v.userData.cols.length
      };
    g.islHome();
    g.setHEl('bois', 'bois');
    return Object.assign(o, { back: !g.VISIT.on });
  });
  ok(
    'en visite : la cathédrale de l’hôte (niveau 4), nos héros dans nos éléments, puis retour',
    r.vis && r.l === 4 && /bois:vent/.test(r.heros) && r.cols > 80 && r.back,
    r
  );

  console.log('erreurs', errs.length);
  if (errs.length) console.log([...new Set(errs)].slice(0, 8).join('\n'));
  await b.close();
})();
