// Images de référence de l'affichage : le jeu mis dans des situations fixes, capturé, puis comparé aux références.
// Sert à vérifier qu'un nettoyage du code d'affichage ne change pas une seule image (et à voir tout de suite ce qui a changé sinon).
//
// Le jeu est figé : la boucle du jeu ne tourne pas (requestAnimationFrame ne fait rien), l'horloge (performance.now) et le hasard
// (Math.random) sont fixés, la sauvegarde repart de zéro à chaque situation (la page est rechargée), et on avance nous-mêmes au pas
// de 1/30 s : simulation → événements → dessin. Seul le dessin 3D est capturé (le canevas, sans l'interface), en 966 × 366.
//
//   node tests/images.js                       compare aux références (tests/images-ref/*.png)
//   node tests/images.js --ref                 (ré)écrit les références : avant un nettoyage, ou après un changement VOULU de l'image
//   node tests/images.js --page=<page.html>    une autre page que test3d.html (par exemple une copie isolée du dépôt)
//   SEUL=toit,armes node tests/images.js       seulement ces situations (chaque situation est indépendante des autres)
//   node tests/images.js --mesure              affiche aussi, pour chaque capture, les appels de dessin, les triangles et les particules
// En cas d'écart : la capture et l'image des différences (×8) sont écrites dans /tmp/images-ecarts/ (à regarder).
// Situations : toit (départ), rue (zombies et variantes), interieur (planches, cloisons), tyrolienne, armes (les 6 armes, marteau, masse),
// heros (compétence + ultime de chacun des 5 héros), tourelles (les 4 types, leurre, missile, onde, hélicoptère).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const RACINE = path.join(__dirname, '..');
const REF = path.join(__dirname, 'images-ref');
const ECARTS = '/tmp/images-ecarts';
const arg = process.argv.find(a => a.startsWith('--page='));
const PAGE = arg ? path.resolve(arg.slice(7)) : path.join(RACINE, 'test3d.html');
const ECRIRE = process.argv.includes('--ref');
const SEUL = process.env.SEUL ? process.env.SEUL.split(',') : null;
const MESURE = process.argv.includes('--mesure');
// tolérance : différence moyenne par canal (sur 255) et part des pixels changés ; un nettoyage doit donner 0 et 0
const TOL_MOY = 0.02,
  TOL_PIX = 0.001;

// avant tout script de la page : pas de boucle, horloge fixe (avancée par __adv), hasard à graine, sauvegarde vide
function figer() {
  window.requestAnimationFrame = () => 0;
  window.__now = 1000;
  performance.now = () => window.__now;
  let a = 12345;
  window.__graine = g => {
    a = g >>> 0;
  };
  // mulberry32
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  try {
    localStorage.clear();
  } catch (_) {}
}

// outils dans la page (après chargement)
function outils() {
  // ce que la boucle du jeu passe à gfxFrame
  window.__V = {
    sprint: false,
    tool: 'fusil',
    scope: false,
    hammer: false,
    aim: -1,
    ptype: 'mg',
    door: -1,
    ads: false,
    zoom: 1,
    bob: 0,
    bobT: 0
  };
  // n pas de 1/30 s ; o.draw : dessiner chaque pas (sinon seulement le dernier) ; o.sim === false : sans simulation ; o.inp : commandes en plus
  window.__adv = (n, o) => {
    o = o || {};
    const S = __dt.S,
      r0 = renderer.render;
    try {
      for (let k = 0; k < n; k++) {
        renderer.render = o.draw || k === n - 1 ? r0 : () => {};
        window.__now += 1000 / 30;
        if (o.sim !== false) step(S, 1 / 30, Object.assign({ f: 0, r: 0, yaw: S.p.yaw, pitch: S.p.pitch }, o.inp || {}));
        events();
        gfxFrame(S, 1 / 30, __V);
      }
    } finally {
      renderer.render = r0;
    }
  };
  // une partie neuve, en pause : mode, jour, héros, arme, plan des tourelles, arbre au max, graine ; jour lancé ou non, secondes simulées sans dessin
  window.__partie = o => {
    __graine(o.graine);
    const s = __dt.save;
    s.runs = 5;
    s.runsOut = 5;
    s.mode = o.mode;
    s.hero = o.hero || null;
    s.weap = o.weap || 'fusil';
    if (o.layout) s.layout = o.layout;
    if (o.max) for (const n of NODES) s.lv[n.id] = n.max;
    __dt.newGame(o.day);
    running = false;
    const S = __dt.S;
    S.rnd = mkRng(o.graine);
    S.god = true;
    if (o.start) __dt.startDay(S);
    for (let i = 0; i < 30 * (o.sec || 0); i++) {
      step(S, 1 / 30, { f: 0, r: 0, yaw: 0, pitch: 0 });
      if (S.ev.length > 4000) S.ev.length = 0;
    }
    S.ev.length = 0;
    return S;
  };
  // un zombie de type ty, dehors, à (x, z), tourné vers yaw
  window.__put = (ty, x, z, yaw) => {
    const S = __dt.S,
      Z = S.z;
    S.devTy = ty;
    S.toSpawn++;
    if (!spawnOne(S)) {
      delete S.devTy;
      return -1;
    }
    delete S.devTy;
    const i = S.act[S.nAct - 1];
    Z.x[i] = x;
    Z.z[i] = z;
    Z.y[i] = 0;
    Z.st[i] = 1;
    Z.inv[i] = 0;
    Z.road[i] = 0;
    Z.off[i] = x;
    Z.wp[i] = 0;
    Z.yaw[i] = yaw === undefined ? Math.PI : yaw;
    Z.hp[i] = Z.hm[i] = 1e9;
    return i;
  };
  // tourner le joueur vers un point
  window.__vise = (x, y, z) => {
    const p = __dt.S.p;
    for (let k = 0; k < 4; k++) {
      const e = eyeP(p),
        dx = x - e[0],
        dy = y - e[1],
        dz = z - e[2];
      p.yaw = Math.atan2(-dx, -dz);
      p.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    }
  };
  // le zombie dehors le plus proche d'un point (pour viser la foule)
  window.__foule = (cx, cz) => {
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
  window.__image = () => renderer.domElement.toDataURL('image/png');
}

// les situations : chacune renvoie ses captures avec cap(nom) ; la page est rechargée avant chacune
const SITUATIONS = {
  // le toit au départ (Ils arrivent, jour 1, en préparation, deux mitrailleuses du plan par défaut), vers la ville au nord
  async toit(p, cap) {
    await p.evaluate(() => {
      const S = __partie({ mode: 'in', day: 1, graine: 101 });
      Object.assign(S.p, { x: 0, y: H, z: -7, yaw: 0.35, pitch: -0.18 });
      __adv(20);
    });
    await cap('toit-depart');
  },

  // la rue (Ils s'échappent, jour 6) : de près, les 4 variantes à côté d'un rôdeur, d'un coureur, d'un colosse ; puis du toit, la foule,
  // un hurleur qui crie (anneaux, yeux rouges, traînées), un porteur abattu (gerbe de billets), des corps et du sang
  async rue(p, cap) {
    await p.evaluate(() => {
      const S = __partie({ mode: 'out', day: 6, hero: 'feu', start: true, sec: 0, graine: 202 });
      S.toSpawn = 0;
      const Z = S.z,
        L = [0, 1, 2, 4, 5, 6, 7, 0];
      L.forEach((ty, k) => {
        const i = __put(ty, 5.6 - k * 1.6, -20, 2.05);
        Z.va[i] = k === 7 ? 1 : 0;
        Z.ph[i] = 0.2 + k * 0.7;
        Z.hcd[i] = 30;
        if (k === 3) Z.hst[i] = 3;
      });
      window.__cam = { x: -0.2, y: 1.45, z: -25.4, yaw: Math.PI, pitch: -0.05 };
      __adv(3);
    });
    await cap('rue-variantes');
    await p.evaluate(() => {
      window.__cam = null;
      const S = __partie({ mode: 'out', day: 6, hero: 'feu', start: true, sec: 22, graine: 203 }),
        Z = S.z,
        R = mkRng(3);
      const hx = 1.5,
        hz = -30,
        h = __put(7, hx, hz);
      for (let k = 0; k < 14; k++) {
        const a = R() * 6.283,
          d = 2 + R() * 8;
        __put(k % 5 ? 0 : 1, hx + Math.cos(a) * d, hz + Math.sin(a) * d);
      }
      for (let q = 0; q < S.nAct; q++) {
        const i = S.act[q];
        Z.hcd[i] = i === h ? 0.01 : 30;
      }
      const po = __put(6, -4, -24);
      for (const t of [0, 4, 5]) {
        const i = __put(t, t - 6, -22);
        Z.hp[i] = 1;
        hurtZ(S, i, 5, 'p');
      }
      Object.assign(S.p, { x: 0, y: H, z: -B + 0.8, yaw: 0, pitch: -0.82 });
      gridBuild(S);
      __adv(6);
      Z.hp[po] = 1;
      hurtZ(S, po, 5, 'p');
      __adv(5);
    });
    await cap('rue-toit');
  },

  // l'intérieur (Ils s'échappent, 2e étage) : une porte qu'on barricade (planches, planche fantôme au marteau, une planche arrachée qui vole),
  // puis les cloisons : trous du fusil à pompe, un pan cassé à la masse (gravats, poussière), la masse en plein coup
  async interieur(p, cap) {
    await p.evaluate(() => {
      const S = __partie({ mode: 'out', day: 6, weap: 'pompe', max: true, graine: 303 }),
        D = DOORS[24];
      Object.assign(S.p, { x: 0.6, y: D.y, z: -3.2, yaw: 0, pitch: -0.05, vx: 0, vz: 0, vy: 0 });
      for (let k = 0; k < 90 && D.planks < 3; k++) {
        plankStep(S, 1 / 30, 24);
        __adv(1, { sim: false });
      }
      D.planks--;
      S.plankVer++;
      S.ev.push({ k: 'tear', door: D.id, n: D.planks, x: D.cx, y: D.y + 1.1, z: D.cz });
      tool = 'marteau';
      Object.assign(__V, { tool: 'marteau', hammer: true, door: 24 });
      __adv(8);
    });
    await cap('interieur-planches');
    await p.evaluate(() => {
      const S = __dt.S,
        D = DOORS[24];
      Object.assign(__V, { tool: 'pompe', hammer: false, door: -1 });
      tool = 'fusil';
      __adv(12);
      __vise(-2.4, D.y + 1.3, -6.5);
      __adv(1, { inp: { fire: true } });
      __adv(30);
      __vise(-1.6, D.y + 1.6, -6.5);
      __adv(1, { inp: { fire: true } });
      __adv(30);
      tool = 'masse';
      __V.tool = 'masse';
      __adv(12);
      __vise(2.6, D.y + 0.5, -6.5);
      for (let k = 0; k < 6; k++) {
        useMasse(S);
        __adv(14);
      }
      __vise(2.2, D.y + 1.4, -6.5);
      S.p.yaw += 0.25;
      useMasse(S);
      __adv(4);
    });
    await cap('interieur-cloisons');
  },

  // la tyrolienne du toit vers la passerelle de l'avenue nord, en pleine glissade, le regard vers la rue
  async tyrolienne(p, cap) {
    await p.evaluate(() => {
      const S = __partie({ mode: 'out', day: 2, hero: 'eau', graine: 404 }),
        Zp = ZIPS[0];
      S.P.tyro.on = 1; // V4.7 : la tyrolienne se débloque
      Object.assign(S.p, { x: Zp.a[0] - 0.8, z: Zp.a[2] + 1.3, yaw: Math.atan2(-Zp.n[0], -Zp.n[1]) + 0.25, pitch: -0.05 });
      __adv(3);
      __adv(1, { inp: { jump: true } });
      for (let k = 0; k < 400 && S.p.zip && S.p.zip.s < 20; k++) __adv(1);
      S.p.pitch = -0.35;
      __adv(2);
    });
    await cap('tyrolienne');
  },

  // les armes en main sur le toit (Ils s'échappent, jour 2, horde dans la rue) : fusil qui tire, pistolet, assaut qui tire, sniper,
  // pompe juste après le coup (la pompe recule), lance-flammes en plein jet, marteau (portée de la tourelle visée), masse en plein coup
  async armes(p, cap) {
    await p.evaluate(() => {
      __partie({ mode: 'out', day: 2, hero: 'terre', start: true, sec: 14, max: true, graine: 505 });
    });
    const roof = () =>
      p.evaluate(() => {
        Object.assign(__dt.S.p, { x: 1.5, y: H, z: -B + 2.6, yaw: 0.1, pitch: -0.33, vx: 0, vy: 0, vz: 0 });
      });
    const arme = (k, tirs, apres) =>
      p.evaluate(
        ([k, tirs, apres]) => {
          setWeap(k);
          tool = 'fusil';
          __V.tool = k;
          __adv(16);
          if (tirs) __adv(tirs, { inp: { fire: true } });
          if (apres) __adv(apres);
        },
        [k, tirs, apres]
      );
    await roof();
    await arme('fusil', 1, 0);
    await cap('arme-fusil');
    await roof();
    await arme('pistolet', 0, 0);
    await cap('arme-pistolet');
    await roof();
    await arme('assaut', 3, 0);
    await cap('arme-assaut');
    await roof();
    await arme('sniper', 0, 0);
    await cap('arme-sniper');
    await roof();
    await arme('pompe', 1, 7);
    await cap('arme-pompe');
    await roof();
    await arme('lance', 10, 0);
    await cap('arme-lance');
    await roof();
    await p.evaluate(() => {
      tool = 'marteau';
      Object.assign(__V, { tool: 'marteau', hammer: true, aim: 4, ptype: 'mg' });
      __adv(16);
    });
    await cap('arme-marteau');
    await p.evaluate(() => {
      tool = 'masse';
      Object.assign(__V, { tool: 'masse', hammer: false, aim: -1 });
      __adv(16);
      useMasse(__dt.S);
      __adv(4);
    });
    await cap('arme-masse');
  },

  // les 5 héros (Ils s'échappent, jour 3, la horde dans l'avenue nord) : compétence puis ultime, vus du toit
  async heros(p, cap) {
    for (const h of ['feu', 'eau', 'bois', 'terre', 'elec']) {
      await p.evaluate(h => {
        const S = __partie({ mode: 'out', day: 3, hero: h, start: true, sec: 30, graine: 600 + h.length });
        Object.assign(S.p, { x: 0, y: H, z: -B + 0.8, yaw: 0, pitch: -0.4, vx: 0, vz: 0, vy: 0 });
        __adv(2);
        if (h === 'elec') {
          Object.assign(S.p, { x: 8, z: -6, yaw: Math.PI / 2, pitch: -0.05 });
          S.hab = 0;
          useHeroSkill(S);
          __adv(2);
          S.p.yaw = -Math.PI / 2;
          S.p.pitch = -0.18;
        } else {
          const c = __foule(0, h === 'terre' ? -50 : -54);
          __vise(c[0], 0, c[2]);
          S.hab = 0;
          useHeroSkill(S);
        }
        __adv({ feu: 10, eau: 8, bois: 14, terre: 10, elec: 1 }[h]);
        S.ult = 1;
        useHeroUlt(S);
        if (h !== 'elec') {
          const c = __foule(0, -40);
          __vise(c[0], 0, c[2]);
        }
        __adv({ feu: 14, eau: 24, bois: 40, terre: 12, elec: 30 }[h]);
      }, h);
      await cap('heros-' + h);
    }
  },

  // les tourelles (Ils arrivent, jour 5, arbre au max : les 4 types, les murs d'avenue) vues d'en haut, avec le leurre, un missile en vol,
  // l'onde de choc ; puis l'hélicoptère qui arrive
  async tourelles(p, cap) {
    await p.evaluate(() => {
      const L = { 0: 'mg', 1: 'la', 2: 'mo', 3: 'fl', 4: 'mg', 5: 'la', 6: 'mo', 7: 'fl', 16: 'mg', 17: 'mo' };
      const S = __partie({ mode: 'in', day: 5, layout: L, max: true, start: true, sec: 20, graine: 707 }),
        Z = S.z,
        R = mkRng(7);
      for (let k = 0; k < 50; k++) {
        const i = __put(k % 7 ? 0 : 1, (R() - 0.5) * 22, -18 - R() * 22, 0);
        if (k % 2) Z.hp[i] = Z.hm[i] = 40;
      }
      gridBuild(S);
      Object.assign(S.p, { x: 0, y: H, z: -B + 1.2, yaw: 0, pitch: -0.3, vx: 0, vz: 0, vy: 0 });
      __adv(45);
      let c = __foule(-6, -30);
      __vise(c[0], 0, c[2]);
      useLeurre(S);
      c = __foule(4, -36);
      __vise(c[0], 0, c[2]);
      useMissile(S);
      __adv(8);
      S.ult = 1;
      useOnde(S);
      __adv(6);
      window.__cam = { x: 2, y: H + 9, z: -B + 4, yaw: 0.15, pitch: -0.75 };
      __adv(1);
    });
    await cap('tourelles');
    await p.evaluate(() => {
      const S = __dt.S;
      window.__cam = null;
      S.phase = 'rescue';
      S.heliT = 4;
      Object.assign(S.p, { x: 0, y: H, z: -2, vx: 0, vz: 0, vy: 0 });
      __vise(2, 26.5, -22.6);
      __adv(3, { sim: false });
    });
    await cap('helico');
  }
};

(async () => {
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await ctx.addInitScript(figer);
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push('ERREUR ' + e.message.slice(0, 300)));
  p.on('console', m => {
    if (m.type() === 'error' && !/ERR_|Failed to load|fonts/.test(m.text())) errs.push('console ' + m.text().slice(0, 200));
  });
  if (ECRIRE) fs.mkdirSync(REF, { recursive: true });
  fs.mkdirSync(ECARTS, { recursive: true });
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  // une capture : écrite (--ref) ou comparée à sa référence, pixel par pixel, dans la page
  const cap = async nom => {
    const png = await p.evaluate(() => __image());
    if (MESURE) {
      const m = await p.evaluate(() => {
        let parts = 0;
        for (const k in G.P) parts += G.P[k].n;
        return { appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, parts };
      });
      console.log(
        '     ' +
          nom +
          ' : ' +
          m.appels +
          ' appels de dessin · ' +
          Math.round(m.triangles / 1000) +
          ' k triangles · ' +
          m.parts +
          ' particules'
      );
    }
    const buf = Buffer.from(png.split(',')[1], 'base64');
    const f = path.join(REF, nom + '.png');
    if (ECRIRE) {
      fs.writeFileSync(f, buf);
      console.log('réf. ' + nom);
      return;
    }
    if (!fs.existsSync(f)) {
      T(nom, false, 'pas de référence');
      return;
    }
    const ref = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    const r = await p.evaluate(
      async ([a, b]) => {
        const charge = src =>
          new Promise((ok, ko) => {
            const im = new Image();
            im.onload = () => ok(im);
            im.onerror = ko;
            im.src = src;
          });
        const A = await charge(a),
          Bi = await charge(b);
        if (A.width !== Bi.width || A.height !== Bi.height)
          return { taille: A.width + '×' + A.height + ' au lieu de ' + Bi.width + '×' + Bi.height };
        const c = document.createElement('canvas');
        c.width = A.width;
        c.height = A.height;
        const x = c.getContext('2d');
        x.drawImage(A, 0, 0);
        const da = x.getImageData(0, 0, c.width, c.height).data;
        x.drawImage(Bi, 0, 0);
        const im = x.getImageData(0, 0, c.width, c.height),
          db = im.data;
        let s = 0,
          n = 0,
          mx = 0;
        for (let i = 0; i < da.length; i += 4) {
          let px = 0;
          for (let k = 0; k < 3; k++) {
            const d = Math.abs(da[i + k] - db[i + k]);
            s += d;
            px = Math.max(px, d);
            db[i + k] = Math.min(255, d * 8);
          }
          db[i + 3] = 255;
          if (px) n++;
          mx = Math.max(mx, px);
        }
        x.putImageData(im, 0, 0);
        return { moy: s / (da.length * 0.75), part: n / (da.length / 4), n, mx, diff: n ? c.toDataURL('image/png') : null };
      },
      [png, ref]
    );
    if (r.taille) {
      T(nom, false, 'taille ' + r.taille);
      return;
    }
    const bon = r.moy <= TOL_MOY && r.part <= TOL_PIX;
    T(
      nom,
      bon,
      'écart moyen ' + r.moy.toFixed(4) + ' · pixels changés ' + r.n + ' (' + (r.part * 100).toFixed(3) + ' %) · écart max ' + r.mx
    );
    if (r.n) {
      fs.writeFileSync(path.join(ECARTS, nom + '.png'), buf);
      fs.writeFileSync(path.join(ECARTS, nom + '-diff.png'), Buffer.from(r.diff.split(',')[1], 'base64'));
    }
  };
  for (const nom in SITUATIONS) {
    if (SEUL && !SEUL.includes(nom)) continue;
    await p.goto('file://' + PAGE);
    await p.waitForTimeout(300);
    await p.evaluate(outils);
    try {
      await SITUATIONS[nom](p, cap);
    } catch (e) {
      T(nom, false, 'situation plantée : ' + String(e.message || e).split('\n')[0]);
    }
  }
  console.log(errs.length ? [...new Set(errs)].join('\n') : 'erreurs 0');
  if (!ECRIRE) console.log(ok + ' OK, ' + ko + ' ratés');
  await b.close();
  process.exit(ko || errs.length ? 1 : 0);
})();
