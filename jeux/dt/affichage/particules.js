// ===================== DERNIER TOIT — l'affichage : particules, sang, traçantes, éclairs =====================
// Particules : des réserves fixes (une par sorte, G.P[sorte]), chaque particule = PST nombres dans un Float32Array, dessinées en masse
// (un appel de dessin par sorte). Rien n'est créé pendant une image ; une réserve pleine refuse les nouvelles particules.
// Sortes (G.P) : blood, spark, fire, smoke, dust, shell (obus), plaster, rubble, pdust (poussière de plâtre), wood (créées ici) ;
// water, leaf, mist, rock (créées par les héros, heros.js) ; bill, gold (créées par les variantes, variantes.js).
// Aussi : les taches de sang au sol (700) et sur les façades (260), les traçantes des balles, 14 éclairs d'explosion, les feux au sol.
// Attend des règles : B, LVY, levelOf, facePt ; S.fires.
// Fournit aux autres fichiers de l'affichage : emit, bloodBurst, splatAt, wallSplat, flashAt, floorY, mkPart, PST ; partStep (lu par les tests).
// Plafonds : voir les capacités dans particulesInit (900 gouttes de sang, 700 flammes, 400 étincelles…), traçantes 260.

// une particule, PST nombres : x y z, vitesse (vx vy vz), âge, durée, taille de départ et d'arrivée, sol (elles s'y posent : la rue,
// ou le plancher de l'étage), angle (tourne en vol)
const PST = 12;
// une réserve : forme, matière, capacité, gravité g (négative : elle tombe et se pose ; positive : elle monte), aspect [x, y, z] (étirement)
function mkPart(geo, mat, cap, g, asp) {
  return { pool: new IPool(geo, mat, cap), d: new Float32Array(cap * PST), n: 0, cap, g, asp: asp || null };
}
// une particule de la sorte kind en (x, y, z), vitesse (vx, vy, vz), durée T, taille s0 → s1, sol fl (0 par défaut : la rue)
function emit(kind, x, y, z, vx, vy, vz, T, s0, s1, fl) {
  const res = G.P[kind];
  if (res.n >= res.cap) {
    return;
  }
  const o = res.n++ * PST,
    d = res.d;
  d[o] = x;
  d[o + 1] = y;
  d[o + 2] = z;
  d[o + 3] = vx;
  d[o + 4] = vy;
  d[o + 5] = vz;
  d[o + 6] = 0;
  d[o + 7] = T;
  d[o + 8] = s0;
  d[o + 9] = s1;
  d[o + 10] = fl || 0;
  d[o + 11] = Math.random() * 6.28;
}
// à chaque image, après toutes les émissions : les particules vivent (gravité, sol, rotation), les mortes sont retirées, les vivantes dessinées
function partStep(dt) {
  for (const k in G.P) {
    const res = G.P[k],
      d = res.d,
      aspect = res.asp;
    res.pool.begin();
    let n = 0;
    for (let i = 0; i < res.n; i++) {
      const o = i * PST;
      d[o + 6] += dt;
      if (d[o + 6] >= d[o + 7]) continue;
      d[o + 4] += res.g * dt;
      d[o] += d[o + 3] * dt;
      d[o + 1] += d[o + 4] * dt;
      d[o + 2] += d[o + 5] * dt;
      if (res.g < 0 && d[o + 1] < d[o + 10] + 0.02) {
        d[o + 1] = d[o + 10] + 0.02;
        d[o + 3] *= 0.5;
        d[o + 5] *= 0.5;
        d[o + 4] = 0;
      } else d[o + 11] += dt * 4;
      const m = n * PST;
      if (n !== i) for (let q = 0; q < PST; q++) d[m + q] = d[o + q];
      const u = d[m + 6] / d[m + 7];
      let s = d[m + 8] + (d[m + 9] - d[m + 8]) * u;
      // fade (poussières, brume) : elles se dissipent sur la fin
      if (res.fade && u > 0.6) s *= (1 - u) / 0.4;
      if (aspect) res.pool.add(d[m], d[m + 1], d[m + 2], d[m + 11], d[m + 11] * 0.7, s * aspect[0], s * aspect[1], s * aspect[2]);
      else res.pool.add(d[m], d[m + 1], d[m + 2], d[m + 11], d[m + 11] * 0.7, s);
      n++;
    }
    res.n = n;
    res.pool.end();
  }
}
// le sol sous un point : plancher de l'étage dans l'immeuble, la rue dehors
const floorY = (x, y, z) => (Math.abs(x) < B - 0.2 && Math.abs(z) < B - 0.2 ? LVY(levelOf(y)) : 0);
// une giclée de n gouttes de sang (big : plus fortes), qui retombent sur le sol du point
function bloodBurst(x, y, z, n, big) {
  const sol = floorY(x, y, z);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28,
      v = 1 + Math.random() * (big ? 5 : 3);
    emit(
      'blood',
      x,
      y,
      z,
      Math.cos(a) * v,
      2 + Math.random() * 3,
      Math.sin(a) * v,
      0.6 + Math.random() * 0.4,
      big ? 0.12 : 0.08,
      0.03,
      sol
    );
  }
}
// une tache de sang au sol (les 700 dernières restent) ; G.splatD, 5 nombres par tache : x, y, z, angle, taille
function splatAt(x, y, z, s) {
  const i = G.splatC % 700,
    o = i * 5;
  G.splatC++;
  G.splatN = Math.min(700, G.splatN + 1);
  G.splatD[o] = x;
  G.splatD[o + 1] = y + 0.035 + (i % 7) * 0.002;
  G.splatD[o + 2] = z;
  G.splatD[o + 3] = Math.random() * 6.28;
  G.splatD[o + 4] = s * (0.6 + Math.random() * 0.8);
}
// une tache de sang sur la façade f (0 à 3) à l'abscisse u et la hauteur y (les 260 dernières restent)
function wallSplat(f, u, y, s) {
  const p = facePt(f, u, 0.04),
    i = G.wsC % 260,
    o = i * 5;
  G.wsC++;
  G.wsN = Math.min(260, G.wsN + 1);
  G.wsD[o] = p[0];
  G.wsD[o + 1] = y;
  G.wsD[o + 2] = p[1];
  G.wsD[o + 3] = f;
  G.wsD[o + 4] = s;
}
// un éclair (boule lumineuse qui grossit et s'efface) de rayon r, couleur col, durée T ; le plus ancien est repris si les 14 sont pris
function flashAt(x, y, z, r, col, T) {
  const f = G.flash.find(q => q.t >= q.T) || G.flash[0];
  f.t = 0;
  f.T = T || 0.38;
  f.r = r;
  f.m.position.set(x, y, z);
  f.m.material.color.setHex(col || 0xffb050);
  f.m.visible = true;
}
// les taches de sang : disques couchés (sol) ou debout (façades), même matière
function sangInit() {
  const splat = new THREE.CircleGeometry(0.6, 9);
  splat.rotateX(-Math.PI / 2);
  const bloodM = new THREE.MeshLambertMaterial({ color: 0x5a0c0c, polygonOffset: true, polygonOffsetFactor: -2 });
  G.splat = new IPool(splat, bloodM, 700);
  G.splatD = new Float32Array(700 * 5);
  G.splatN = 0;
  G.splatC = 0;
  const wsplat = new THREE.CircleGeometry(0.5, 8);
  G.wsplat = new IPool(wsplat, bloodM, 260);
  G.wsD = new Float32Array(260 * 5);
  G.wsN = 0;
  G.wsC = 0;
}
// les réserves de particules communes (capacité, gravité, aspect)
function particulesInit() {
  const oct = new THREE.OctahedronGeometry(1, 0);
  G.P = {
    blood: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0x8a1010 }), 900, -15),
    spark: mkPart(oct, matAdd(0xffd27a), 400, -9),
    fire: mkPart(oct, matAdd(0xff7a22), 700, 3),
    smoke: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0x55524e }), 400, 1.5),
    dust: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0xa49478 }), 300, -6),
    shell: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0x2a2c30 }), 60, 0),
    // éclats de plâtre (plats), gravats, poussière de plâtre (nuage clair), échardes de bois (longues et fines)
    plaster: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0xe6dfd1 }), 420, -11, [1, 0.28, 0.8]),
    rubble: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0xbdb5a5 }), 260, -13, [1, 0.7, 0.9]),
    pdust: mkPart(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshLambertMaterial({ color: 0xcfc9bd, emissive: 0x57524a, transparent: true, opacity: 0.13, depthWrite: false }),
      360,
      0.12
    ),
    wood: mkPart(oct, new THREE.MeshLambertMaterial({ color: 0x9a6a3a }), 240, -12, [0.26, 0.26, 2.6])
  };
  G.P.pdust.fade = 1;
}
// traçantes : G.tr = [{ x0, y0, z0, x1, y1, z1, t, w }] (w : épaisseur, fine pour les plombs), 0,06 s chacune
function tracantesInit(boite) {
  G.tracer = new IPool(boite, matAdd(0xffe9a0), 260);
  G.tr = [];
}
function flashInit() {
  G.flash = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), matAdd(0xffb050));
    m.visible = false;
    scene.add(m);
    G.flash.push({ m, t: 9, T: 0.4, r: 1 });
  }
}
function sangFrame(S) {
  // nouvelle partie : les taches de la partie précédente s'effacent (avant la V4.0, elles restaient)
  if (G.sangS !== S) {
    G.sangS = S;
    G.splatN = G.splatC = G.wsN = G.wsC = 0;
  }
  G.splat.begin();
  for (let i = 0; i < G.splatN; i++) {
    const o = i * 5;
    G.splat.add(G.splatD[o], G.splatD[o + 1], G.splatD[o + 2], G.splatD[o + 3], 0, G.splatD[o + 4], 1, G.splatD[o + 4]);
  }
  G.splat.end();
  G.wsplat.begin();
  for (let i = 0; i < G.wsN; i++) {
    const o = i * 5,
      f = G.wsD[o + 3];
    G.wsplat.add(G.wsD[o], G.wsD[o + 1], G.wsD[o + 2], [Math.PI, Math.PI / 2, 0, -Math.PI / 2][f], 0, G.wsD[o + 4]);
  }
  G.wsplat.end();
}
// une traçante = un trait qui file du départ vers l'arrivée (40 % de la longueur) en 0,06 s
function tracantesFrame(dt) {
  G.tracer.begin();
  G.tr = G.tr.filter(t => (t.t += dt) < 0.06);
  for (const t of G.tr) {
    const dx = t.x1 - t.x0,
      dy = t.y1 - t.y0,
      dz = t.z1 - t.z0,
      l = Math.hypot(dx, dy, dz),
      u = t.t / 0.06;
    G.tracer.add(
      t.x0 + dx * u * 0.6,
      t.y0 + dy * u * 0.6,
      t.z0 + dz * u * 0.6,
      Math.atan2(dx, dz),
      -Math.atan2(dy, Math.hypot(dx, dz)),
      t.w || 0.035,
      t.w || 0.035,
      l * 0.4
    );
  }
  G.tracer.end();
}
// les éclairs grossissent et s'effacent
function flashFrame(dt) {
  for (const f of G.flash) {
    if (f.t < f.T) {
      f.t += dt;
      const u = f.t / f.T;
      f.m.scale.setScalar(f.r * (0.4 + u * 0.9));
      f.m.material.opacity = (1 - u) * 0.9;
      if (f.t >= f.T) f.m.visible = false;
    }
  }
}
// les feux au sol (napalm du mortier, Orbe de Braise…) : des flammes de temps en temps ; l'Orbe a en plus son dessin (hxFeuFrame)
function feuxFrame(S) {
  for (const f of S.fires)
    if (Math.random() < 0.5) {
      // V5.3 : un feu au sol d'un autre élément (f.el) : les particules de cet élément
      hxSk(f.el, 'feu');
      emit(
        hxK('fire'),
        f.x + (Math.random() - 0.5) * f.r * 1.6,
        0.1,
        f.z + (Math.random() - 0.5) * f.r * 1.6,
        0,
        2 + Math.random() * 2,
        0,
        0.5,
        0.25,
        0.05
      );
      HXE = null;
    }
}
