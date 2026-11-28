// [lobby/village.js] Le village : catalogue des bâtiments (CAT), poser, ranger, améliorer, recaler sur le sol, village de départ.
// ---- le village : tout ce que le joueur pose sur son île. Les cinq bâtiments à rôle sont uniques et gratuits ; les décors coûtent de l'or céleste (rendu si on les range).
const LOOT = [
  ['feu', 'Corne de braise', 'Sur un boss de Feu.'],
  ['eau', 'Écaille des marées', "Sur un boss d'Eau."],
  ['bois', 'Ramure ancienne', 'Sur un boss de Nature.'],
  ['terre', 'Cœur de roche', 'Sur un boss de Terre.'],
  ['elec', "Bobine d'orage", "Sur un boss d'Élec."],
  ['vent', 'Plume des rafales', 'Sur un boss de Vent.'],
  ['relique', 'Relique oubliée', 'Parfois sur un objectif de vague ; à chaque secours sur le toit.'],
  ['couronne', 'Couronne des 20 vagues', 'Gagner une partie en mode Normal.'],
  ['sceau', "Sceau de l'île", 'Gagner une partie en mode Difficile.']
];
const CAT = {
  hall: {
    n: 'Hall des héros',
    m: 'vil.hall',
    r: 6.6,
    u: 1,
    up: 1,
    mx: 6,
    act: 'hall',
    ly: 11.6,
    col: '#ffcf5a',
    d: 'Choisir son héros'
  },
  maison: {
    n: 'Maison',
    m: 'vil.maison',
    r: 4.6,
    u: 1,
    up: 1,
    mx: 6,
    act: 'maison',
    ly: 7.6,
    col: '#ffd9a0',
    d: 'Chez toi'
  },
  musee: {
    n: 'Musée',
    m: 'vil.musee',
    r: 6.9,
    u: 1,
    up: 1,
    mx: 6,
    act: 'musee',
    ly: 8.4,
    col: '#ffcf5a',
    d: 'Tes artefacts'
  },
  armes: {
    n: "Salle d'armes",
    m: 'vil.armes',
    r: 5.4,
    u: 1,
    up: 1,
    mx: 6,
    act: 'armes',
    ly: 8.9,
    col: '#ff9d5c',
    d: 'Améliorer ses armes'
  },
  marchand: {
    n: 'Marchand',
    m: 'vil.marchand',
    r: 2.7,
    u: 1,
    up: 1,
    mx: 6,
    act: 'shop',
    ly: 4.7,
    col: '#ffcf5a',
    d: 'Or céleste'
  },
  mine: {
    n: "Mine d'étoiles",
    m: 'vil.mine',
    r: 5,
    u: 1,
    up: 1,
    mx: 6,
    lv: 2,
    act: 'mine',
    ly: 6.6,
    col: '#8fd6ff',
    d: 'Or à chaque partie'
  },
  taverne: {
    n: 'Taverne',
    m: 'vil.taverne',
    r: 5.6,
    u: 1,
    up: 1,
    mx: 6,
    lv: 3,
    act: 'taverne',
    ly: 10.6,
    col: '#ffb14a',
    d: 'Défis'
  },
  verger: {
    n: 'Verger céleste',
    m: 'vil.verger',
    r: 5.2,
    u: 1,
    up: 1,
    mx: 6,
    act: 'verger',
    ly: 8,
    col: '#9be27a',
    d: 'Provisions'
  },
  fontaine: { n: 'Fontaine', lv: 2, m: 'vil.fontaine', r: 2.4, c: 60 },
  astre: { n: 'Astrolabe', lv: 4, m: 'lob.astre', r: 3.7, c: 120 },
  statue: { n: 'Statue', lv: 3, m: 'set.statue', r: 1, c: 40 },
  arche: { n: 'Arche', lv: 3, m: 'set.arche', r: 0.6, c: 40, pass: 1 },
  colonne: { n: 'Colonne', lv: 2, m: 'set.colonne', r: 0.65, c: 15 },
  lanterne: { n: 'Lanterne', m: 'set.lanterne', r: 0.3, c: 10, pass: 1 },
  banniere: { n: 'Bannière', lv: 2, m: 'lob.banniere', r: 0.3, c: 15, pass: 1, el: 1 },
  barriere: { n: 'Barrière', m: 'set.barriere', r: 0.4, c: 5, pass: 1 },
  caisses: { n: 'Caisses', m: 'set.caisses', r: 0.9, c: 10 },
  arbre: { n: 'Arbre', m: ['nat.arbre1', 'nat.arbre2', 'nat.arbre3'], r: 0.45, c: 10 },
  pin: { n: 'Pin', m: ['nat.pin1', 'nat.pin2', 'nat.pin3'], r: 0.4, c: 10 },
  palmier: { n: 'Palmier', lv: 2, m: 'nat.palmier', r: 0.35, c: 10 },
  rocher: { n: 'Rocher', m: ['nat.rocher1', 'nat.rocher2', 'nat.rocher3'], r: 0.9, c: 5 },
  buisson: { n: 'Buisson', m: ['nat.buisson1', 'nat.buisson2'], r: 0.3, c: 5, pass: 1 },
  fleurs: { n: 'Fleurs', m: ['nat.fleur1', 'nat.fleur2', 'nat.fleur3'], r: 0.2, c: 5, pass: 1 },
  champi: { n: 'Champignons', m: 'nat.champi', r: 0.2, c: 5, pass: 1 }
};
for (const k in CAT) {
  const C = CAT[k];
  C.k = k;
  C.ms = (Array.isArray(C.m) ? C.m : [C.m]).filter(m => MODELS[m]);
  if (!C.ms.length) delete CAT[k];
}
const CATK = Object.keys(CAT),
  VMAX = 140,
  HVK = ['mine', 'musee', 'hall', 'marchand', 'armes', 'verger', 'taverne']; // HVK : les bâtiments qui peuvent avoir quelque chose pour le joueur (voir « LES RÉCOLTES »)
if (!Array.isArray(save.vil)) save.vil = [];
save.vil = save.vil.filter(B => B && CAT[B.t] && Number.isFinite(B.x + B.z + B.r)).slice(0, VMAX);
const vilV = new Map();
let vilId = 1,
  hallV = null,
  museeV = null;
const mdlFor = (C, B) => C.ms[Math.abs(Math.round(B.x * 7 + B.z * 13)) % C.ms.length];
// un bâtiment améliorable monte jusqu'au niveau `mx` (6) : chaque niveau l'agrandit de 6 % et augmente son bonus
const lvOf = B => Math.max(1, Math.min(CAT[B.t].mx || 3, B.l || 1)),
  kOf = B => (!CAT[B.t].up ? 1 : 1 + 0.06 * (lvOf(B) - 1)),
  rOf = B => CAT[B.t].r * kOf(B),
  myVil = () => (VISIT.on ? VISIT.mine.vil : save.vil),
  myB = B => (VISIT.on ? VISIT.mine.vil.find(o => o.t === B.t) : B),
  bLv = t => {
    const B = myVil().find(B => B.t === t);
    return B ? lvOf(B) : 0;
  };
// la colonne de lumière au-dessus d'un héros du hall (une seule géométrie pour tous)
const pillarG = new THREE.CylinderGeometry(1, 1, 70, 12, 1, true);
function vilView(B) {
  const C = CAT[B.t],
    g = new THREE.Group(),
    inn = new THREE.Group(),
    lv = lvOf(B),
    m = mdlOf(mdlFor(C, B), C.el ? elCtx(B.el || 'feu') : undefined, C.el ? B.el : undefined, { cast: false });
  inn.add(m);
  g.add(inn);
  if (C.up) inn.scale.setScalar(kOf(B));
  g.userData = { B, C, m, live: m.userData.prep.parts.some(q => q.anim) };
  if (C.ly) {
    const l = lobLabel(5);
    {
      const pr = m.userData.prep;
      l.position.y = C.up && pr.max ? pr.max[1] * (pr.scale || 1) * kOf(B) + 1.7 : C.ly;
    }
    g.add(l);
    lobText(l, C.n.toUpperCase(), C.d + (C.up ? ' · niv. ' + lv : ''), C.col);
    g.userData.lab = l;
    if (HVK.includes(B.t)) {
      const h = lobLabel(4.2);
      h.visible = false;
      g.userData.hvY = l.position.y + 1.75;
      h.position.y = g.userData.hvY;
      g.add(h);
      g.userData.hv = h;
    }
  }
  if (B.t === 'hall') {
    const sp = m.userData.prep.spots || [];
    g.userData.heroes = sp.map(S => {
      const ee = elH(S.el),
        av = mdlOf('hero.avatar', avCtx(S.el, ee), avKey(S.el, ee), { cast: false });
      av.position.set(S.x, S.y, S.z);
      av.rotation.y = S.a + Math.PI;
      inn.add(av);
      const col = new THREE.Color(elc(ee)).getHex(),
        beam = new THREE.Mesh(
          pillarG,
          new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false
          })
        );
      beam.position.set(S.x, 36, S.z);
      beam.scale.set(0.6, 1, 0.6);
      inn.add(beam);
      const glow = new THREE.Sprite(glowM(col, 0.5));
      glow.position.set(S.x, S.y + 1.1, S.z);
      glow.scale.setScalar(3);
      inn.add(glow);
      return { el: S.el, ee, av, beam, glow, y: S.y, a: S.a, w: 0 };
    });
  }
  if (B.t === 'musee') {
    const sl = m.userData.prep.slots || [];
    g.userData.loot = LOOT.map((L, i) => {
      const S = sl[i] || [0, 1.2, 4],
        it = mdlOf('lob.butin', { kind: L[0] }, L[0], { cast: false });
      it.position.set(S[0], S[1], S[2]);
      it.scale.multiplyScalar(1.1);
      inn.add(it);
      return { k: L[0], it, y: S[1] };
    });
  }
  if (B.t === 'marchand') {
    const q = m.userData.prep.npc || [0, -0.3],
      n = mdlOf('set.marchand', undefined, undefined, { cast: false });
    n.position.set(q[0], 0, q[1]);
    inn.add(n);
    g.userData.npc = n;
  }
  if (B.t === 'lanterne' || B.t === 'maison') {
    const lp = m.userData.prep.lamp;
    if (lp) {
      const s = new THREE.Sprite(glowM(0xffd27a, 0.8)),
        k = m.scale.x || 1;
      s.position.set(lp[0] * k, lp[1] * k, lp[2] * k);
      s.scale.setScalar(2.2);
      inn.add(s);
    }
  }
  g.position.set(B.x, B.y || 0, B.z);
  g.rotation.y = B.r;
  lob.add(g);
  return g;
}
// Sur une pente, un bâtiment reste de niveau : il se cale sur le point le plus haut de son emprise, et le vide dessous est comblé selon la hauteur —
// un socle plein si c'est peu, sinon une plateforme sur pilotis, avec une passerelle qui redescend jusqu'au sol du côté de la porte. On peut marcher sur les plateformes et les passerelles.
const SUPM = [new THREE.MeshLambertMaterial({ color: 0xcfc8ba }), new THREE.MeshLambertMaterial({ color: 0xa59d8a })];
const supCyl = new THREE.CylinderGeometry(1, 1, 1, 10),
  supBox = new THREE.BoxGeometry(1, 1, 1),
  LWALK = [];
function baseY(B) {
  const R = rOf(B);
  let y = hAt(B.x, B.z);
  if (R > 1)
    for (let k = 0; k < 10; k++) {
      const a = k * 0.6283;
      y = Math.max(y, hAt(B.x + Math.sin(a) * R * 0.85, B.z + Math.cos(a) * R * 0.85));
    }
  return y;
}
function vilSup(B, g) {
  const u = g.userData;
  if (u.sup) {
    g.remove(u.sup);
    u.sup = null;
  }
  u.deck = null;
  u.ramp = null;
  const C = CAT[B.t],
    R = rOf(B);
  if (R <= 1) return;
  let gap = 0;
  const P = [];
  for (let k = 0; k < 10; k++) {
    const a = k * 0.6283,
      x = B.x + Math.sin(a) * R * 0.95,
      z = B.z + Math.cos(a) * R * 0.95,
      d = B.y - hAt(x, z);
    P.push([Math.sin(a) * R * 0.95, Math.cos(a) * R * 0.95, d]);
    gap = Math.max(gap, d);
  }
  if (gap < 0.25) return;
  const sup = new THREE.Group(),
    M = SUPM,
    add = (geo, m, x, y, z, sx, sy, sz) => {
      const me = new THREE.Mesh(geo, m);
      me.position.set(x, y, z);
      me.scale.set(sx, sy, sz);
      sup.add(me);
      return me;
    };
  sup.rotation.y = -B.r; // les appuis sont calculés dans le repère du monde
  if (gap < 1.6) {
    add(supCyl, M[1], 0, -gap / 2 - 0.05, 0, R * 1.02, gap + 0.3, R * 1.02);
  } else {
    const DR = R * 1.22;
    add(supCyl, M[0], 0, -0.22, 0, DR, 0.44, DR);
    add(supCyl, M[1], 0, -0.5, 0, DR * 0.96, 0.16, DR * 0.96);
    u.deck = { x: B.x, z: B.z, R: DR, y: B.y };
    for (let k = 0; k < 10; k++) {
      const a = k * 0.6283,
        lx = Math.sin(a) * DR * 0.88,
        lz = Math.cos(a) * DR * 0.88,
        d = B.y - hAt(B.x + lx, B.z + lz);
      if (d > 0.5) {
        add(supCyl, M[1], lx, -d / 2 - 0.3, lz, 0.3, d + 0.4, 0.3);
        if (d > 3.2) add(supBox, M[1], lx * 0.93, -d * 0.5, lz * 0.93, 0.16, 0.16, DR * 0.55).rotation.set(0.9, a, 0);
      }
    }
    {
      const d = B.y - hAt(B.x, B.z);
      if (d > 0.5) add(supCyl, M[1], 0, -d / 2 - 0.3, 0, 0.45, d + 0.4, 0.45);
    }
    // passerelle : part du bord de la plateforme, côté porte, et descend jusqu'au sol
    if (C.act) {
      let best = null;
      for (const da of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4, 3.14]) {
        const a = B.r + da,
          dx = Math.sin(a),
          dz = Math.cos(a),
          ax = B.x + dx * DR * 0.96,
          az = B.z + dz * DR * 0.96;
        for (let L = 4; L <= 26; L += 2) {
          const bx = ax + dx * L,
            bz = az + dz * L;
          if (Math.hypot(bx, bz) > RI - 3) break;
          const yb = hAt(bx, bz),
            dy = B.y - yb;
          if (dy < -0.3) break;
          if (dy / L < 0.62) {
            best = { a, ax, az, bx, bz, yb, L, dy };
            break;
          }
        }
        if (best) break;
      }
      if (best && best.dy > 0.4) {
        const q = best,
          len = Math.hypot(q.L, q.dy),
          mx = (q.ax + q.bx) / 2 - B.x,
          mz = (q.az + q.bz) / 2 - B.z,
          r = add(supBox, M[0], mx, -q.dy / 2 - 0.08, mz, 2.4, 0.2, len + 0.4);
        r.rotation.set(Math.atan2(q.dy, q.L), q.a, 0);
        r.rotation.order = 'YXZ';
        for (const sd of [1, -1]) {
          const rl = add(
            supBox,
            M[1],
            mx + Math.cos(q.a) * sd * 1.15,
            -q.dy / 2 + 0.42,
            mz - Math.sin(q.a) * sd * 1.15,
            0.1,
            0.1,
            len + 0.4
          );
          rl.rotation.order = 'YXZ';
          rl.rotation.set(Math.atan2(q.dy, q.L), q.a, 0);
        }
        for (let t = 0.25; t < 1; t += 0.25) {
          const px = q.ax + (q.bx - q.ax) * t,
            pz = q.az + (q.bz - q.az) * t,
            py = B.y - q.dy * t,
            d = py - hAt(px, pz);
          if (d > 0.8)
            for (const sd of [1, -1])
              add(
                supCyl,
                M[1],
                px - B.x + Math.cos(q.a) * sd * 1.05,
                py - B.y - d / 2 - 0.2,
                pz - B.z - Math.sin(q.a) * sd * 1.05,
                0.16,
                d + 0.2,
                0.16
              );
        }
        u.ramp = { ax: q.ax, az: q.az, bx: q.bx, bz: q.bz, ya: B.y, yb: q.yb };
      }
    }
  }
  g.add(sup);
  u.sup = sup;
}
// recale tous les bâtiments sur le sol (après un changement de relief, de niveau d'île ou de skin) et refait leurs appuis
function vilGround() {
  LWALK.length = 0;
  for (const B of save.vil) {
    const g = vilV.get(B.id);
    B.y = baseY(B);
    if (!g) continue;
    g.position.y = B.y;
    vilSup(B, g);
    if (g.userData.deck) LWALK.push(g.userData.deck);
    if (g.userData.ramp) LWALK.push(g.userData.ramp);
  }
  payMark();
}
// hauteur où l'on marche : le sol, ou une plateforme / une passerelle si l'on peut y monter d'un pas
function walkAt(x, z, y) {
  let g = hAt(x, z);
  for (const W of LWALK) {
    let h = -1e9;
    if (W.R) {
      if (Math.hypot(x - W.x, z - W.z) < W.R) h = W.y;
    } else {
      const vx = W.bx - W.ax,
        vz = W.bz - W.az,
        l2 = vx * vx + vz * vz;
      let t = ((x - W.ax) * vx + (z - W.az) * vz) / l2;
      if (t > -0.05 && t < 1.05) {
        t = Math.max(0, Math.min(1, t));
        if (Math.hypot(x - W.ax - vx * t, z - W.az - vz * t) < 1.3) h = W.ya + (W.yb - W.ya) * t;
      }
    }
    if (h > g && h - y < 1.4) g = h;
  }
  return g;
}
function vilAdd(B) {
  B.id = vilId++;
  B.y = baseY(B);
  const g = vilView(B);
  vilV.set(B.id, g);
  if (B.t === 'hall') hallV = g;
  if (B.t === 'musee') museeV = g;
  if (VILOK) TERQ = 0.15;
  payMark();
  return g;
}
function vilDel(B) {
  const g = vilV.get(B.id);
  if (g) {
    lob.remove(g);
    vilV.delete(B.id);
  }
  if (B.t === 'hall') hallV = null;
  if (B.t === 'musee') museeV = null;
  save.vil = save.vil.filter(o => o !== B);
  if (VILOK) TERQ = 0.15;
  payMark();
}
function terrLocks() {
  for (let i = 0; i < TLOCK.length; i++) TLOCK[i] = TFIX[i];
  for (const B of save.vil) {
    const R = rOf(B) + 0.6;
    if (R < 1.2) continue;
    const i0 = Math.max(0, Math.floor((B.x - R + VH) / VC)),
      i1 = Math.min(VN, Math.ceil((B.x + R + VH) / VC)),
      j0 = Math.max(0, Math.floor((B.z - R + VH) / VC)),
      j1 = Math.min(VN, Math.ceil((B.z + R + VH) / VC));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) if (Math.hypot(-VH + i * VC - B.x, -VH + j * VC - B.z) < R) TLOCK[i + j * VW] = 1;
  }
}
for (const B of save.vil) vilAdd(B);
VILOK = true;
terraPlan();
terrDraw();
for (const B of save.vil) {
  B.y = baseY(B);
  const g = vilV.get(B.id);
  if (g) g.position.y = B.y;
}
terrLocks();
// poser : le terrain s'aplanit sous les grands bâtiments ; ranger : le prix est rendu
function vilWhy(k, x, z) {
  const C = CAT[k],
    r = Math.hypot(x, z);
  if (C.lv && !save.dev && C.lv > (save.evo || 1)) return 'Évolution ' + C.lv + ' requise';
  if (r > RI - 4 - C.r * 0.6) return 'Trop près du bord';
  if (LGAMES.some(G => Math.hypot(G.x - x, G.z - z) < PADR - 1 + C.r)) return 'Trop près des portails';
  if (hAt(x, z) < -0.6 && C.r > 0.5) return "Dans l'eau";
  for (const B of save.vil) {
    const D = CAT[B.t];
    if (Math.hypot(B.x - x, B.z - z) < Math.max(0.5, (C.pass ? C.r : C.r + 0.3) + (D.pass ? D.r : rOf(B))))
      return 'Pas la place';
  }
  if (C.u && save.vil.some(B => B.t === k)) return 'Déjà posé';
  if (save.vil.length >= VMAX) return 'Île pleine';
  if (!save.dev && (C.c || 0) > save.gold) return "Pas assez d'or";
  return '';
}

// le héros du Hall change d'élément : son avatar est refait (même place) et son halo prend la couleur de l'élément choisi
function hallAv(H) {
  const ee = elH(H.el),
    p = H.av.parent,
    ps = H.av.position.clone(),
    ry = H.av.rotation.y,
    av = mdlOf('hero.avatar', avCtx(H.el, ee), avKey(H.el, ee), { cast: false }),
    col = new THREE.Color(elc(ee)).getHex();
  if (p) p.remove(H.av);
  av.position.copy(ps);
  av.rotation.y = ry;
  if (p) p.add(av);
  H.av = av;
  H.ee = ee;
  H.beam.material.color.setHex(col);
  H.glow.material = glowM(col, 0.5);
}
function vilPlace(k, x, z, ry) {
  if (vilWhy(k, x, z)) return false;
  const C = CAT[k];
  if (C.c && !save.dev) save.gold -= C.c;
  const B = { t: k, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, r: Math.round(ry * 100) / 100 };
  if (C.el) B.el = elH(tHero);
  if (C.c && !save.dev) B.c = C.c;
  save.vil.push(B);
  const g = vilAdd(B);
  g.userData.pop = 0;
  terrLocks();
  if (!lQuiet) {
    vilGround();
    persist();
    lobSync();
    SND.play('place');
  }
  return true;
}
// village d'exemple : un relief (colline à l'est, mare à l'ouest, butte au sud) et tous les bâtiments posés, pour voir ce que donne une île aménagée
let lQuiet = false;
const TPLOT = { maison: 0, armes: 1, taverne: 2, mine: 3, marchand: 4, musee: 5, verger: 7 }; // parcelle du premier anneau réservée à chaque bâtiment du plan de départ
function vilDemo(keep) {
  for (const B of save.vil.slice()) vilDel(B);
  TH.fill(0);
  terraPlan();
  terrLocks();
  terrDraw();
  const d0 = save.dev,
    P = (k, x, z, r) => {
      if (CAT[k]) vilPlace(k, x, z, r || 0);
    };
  save.dev = true;
  lQuiet = true;
  P('hall', 0, 0, Math.PI);
  for (const k in TPLOT)
    if (keep ? keep[k] : k !== 'mine' && k !== 'taverne') {
      const p = PLOTS[TPLOT[k]];
      P(k, p.x, p.z, -p.a);
    }
  // l'avenue des portails : lanternes, bannières, statues, colonnes, arche ; fontaine et astrolabe dans l'axe sud ; fleurs autour de la Grand-Place
  for (const sd of [1, -1]) {
    for (const z of [-17, -23, -29]) P('lanterne', sd * 3.6, z, sd * 1.57);
    P('banniere', sd * 4.4, -32);
    P('statue', sd * 7, -15.5, Math.PI);
    P('colonne', sd * 5.2, -33.5);
    P('fleurs', sd * 5, -20, sd);
    P('fleurs', sd * 5, -26, sd * 2);
    P('buisson', sd * 6.2, -23, sd);
  }
  P('arche', 0, -31.5);
  P('fontaine', -15.5, 9.5);
  P('astre', 15.5, 9.5);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + 0.52;
    P('fleurs', Math.sin(a) * 17.5, -Math.cos(a) * 17.5, a);
    P('lanterne', Math.sin(a) * 15.6, -Math.cos(a) * 15.6, -a);
  }
  if (keep)
    for (const B of save.vil) {
      const o = keep[B.t];
      if (o && CAT[B.t].up) {
        if (o.l) B.l = o.l;
        if (o.el) B.el = o.el;
      }
    }
  save.dev = d0;
  lQuiet = false;
  if (keep)
    for (const B of save.vil.slice())
      if (keep[B.t] && CAT[B.t].up) {
        const old = vilV.get(B.id);
        if (old) lob.remove(old);
        const g = vilView(B);
        vilV.set(B.id, g);
        if (B.t === 'hall') hallV = g;
        if (B.t === 'musee') museeV = g;
      }
  terraPlan();
  terrDraw();
  terrLocks();
  for (const g of vilV.values()) {
    g.userData.pop = undefined;
    g.scale.setScalar(1);
  }
  vilGround();
  terrSave();
  persist();
  lobSync();
}
// passage à la grande île : les bâtiments à rôle gardent niveau et skin et vont sur leur parcelle du nouveau plan ; les décors sont rendus (leur or revient)
function vilMigrate() {
  const keep = {};
  let back = 0;
  for (const B of save.vil) {
    const C = CAT[B.t];
    if (!C) continue;
    if (C.up) keep[B.t] = { l: B.l, el: B.el };
    else if (B.c) back += B.c;
  }
  save.gold = (save.gold || 0) + back;
  vilDemo(keep);
  return back;
}
function vilClear() {
  for (const B of save.vil.slice()) {
    if (B.c) save.gold += B.c;
    vilDel(B);
  }
  terrLocks();
  vilGround();
  persist();
  lobSync();
}
function vilTake(B) {
  if (B.c) save.gold += B.c;
  vilDel(B);
  terrLocks();
  vilGround();
  persist();
  lobSync();
  SND.play('tick');
}
