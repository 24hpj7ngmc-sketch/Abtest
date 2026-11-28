// ===================== DERNIER TOIT — l'affichage : les variantes de zombies  (dessin seulement : les règles sont dans regles/) =====================
// Le cri du hurleur (deux anneaux rouge pâle au sol qui s'élargissent jusqu'à 12 m, bouffée rouge à la bouche), les zombies pressés par le cri
// (Z.hst : yeux rouges qui brillent, traînée rouge pâle derrière ceux qui courent), le porteur (billets et paillettes d'or qui tombent du sac ;
// une gerbe de billets quand il meurt). Les tenues elles-mêmes (sprinteur e, casseur f, porteur g, hurleur h) sont dans zombies.js.
// Comme pour les héros : réserves fixes créées au premier appel, nombre d'objets plafonné, rien de créé pendant une image, aucune lumière ajoutée.
// Deux branchements : zvEvent() au début de gfxEvent, zvFrame() juste avant partStep dans gfxFrame (tous deux remplacés par tests/variantes.js
// pour sa mesure : ils doivent rester des fonctions globales appelées par leur nom).
// Attend des règles : l'événement 'hurle' (x, y, z), S.z (hst, ty, st, x, y, z, yaw), S.act / S.nAct, S.corpses, ZT.
// Fournit : ZV, ZVN (lus par tests/variantes.js), zvEvent, zvFrame ; les particules bill et gold (G.P).

// plafonds : anneaux du cri, yeux, traînées, chutes d'or ou de billets par image, reflets
const ZVN = { ring: 6, eye: 160, trail: 120, drip: 4, glint: 80 };
let ZV = null;
// ZV : rings (anneaux du cri : m le grand, w le clair), eye, trail, glint (réserves), seen (corps de porteurs dont la gerbe est déjà partie)
function zvInit() {
  const T3 = THREE,
    addM = (c, o) =>
      new T3.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T3.AdditiveBlending, depthWrite: false });
  const rg = new T3.RingGeometry(0.8, 1, 48),
    cone = new T3.CylinderGeometry(0, 1, 1, 5, 1, true);
  rg.rotateX(-Math.PI / 2);
  cone.rotateX(Math.PI / 2);
  cone.translate(0, 0, 0.5);
  ZV = {
    S: null,
    seen: new WeakSet(),
    rings: [],
    eye: new IPool(new T3.IcosahedronGeometry(1, 0), addM(0xff3020, 0.95), ZVN.eye),
    trail: new IPool(cone, addM(0xff6a58, 0.3), ZVN.trail)
  };
  ZV.glint = new IPool(new T3.OctahedronGeometry(1, 0), addM(0xffe27a, 0.95), ZVN.glint);
  ZV.eye.m.renderOrder = ZV.trail.m.renderOrder = ZV.glint.m.renderOrder = 2;
  for (let i = 0; i < ZVN.ring; i++) {
    const m = new T3.Mesh(rg, addM(0xff8f80, 0.85)),
      w = new T3.Mesh(rg, addM(0xffd8d0, 0.55));
    for (const o of [m, w]) {
      o.visible = false;
      o.renderOrder = 2;
      scene.add(o);
    }
    ZV.rings.push({ m, w, t: 9, T: 0.8, x: 0, y: 0, z: 0 });
  }
  // billets (petits rectangles verts qui voltigent en tombant) et paillettes d'or (additives)
  G.P.bill = mkPart(
    new T3.BoxGeometry(1, 1, 1),
    new T3.MeshLambertMaterial({ color: 0x92d67c, emissive: 0x2a5a22 }),
    260,
    -3.4,
    [1, 0.06, 0.5]
  );
  G.P.gold = mkPart(new T3.OctahedronGeometry(1, 0), addM(0xffd24a, 0.95), 220, -5);
  // vrai three.js : matières compilées tout de suite (pas d'à-coup au premier cri) ; l'aperçu local n'en a pas besoin
  if (renderer.compile)
    try {
      renderer.compile(scene, camera);
    } catch (_) {}
}
// nouvelle partie : plus d'anneau en cours
function zvSync(S) {
  if (ZV.S === S) return;
  ZV.S = S;
  for (const w of ZV.rings) {
    w.t = 9;
    w.m.visible = w.w.visible = false;
  }
}
// un anneau du cri à l'instant u (0 → 1) : le grand rouge pâle file jusqu'à 12 m, le clair le suit plus près
function zvRing(w, u) {
  const e = easeO(u),
    r = 0.5 + 11.5 * e,
    r2 = 0.3 + 7.5 * e;
  w.m.position.set(w.x, w.y, w.z);
  w.m.scale.set(r, 1, r);
  w.m.material.opacity = Math.min(1, 1.15 * (1 - u) * (1 - u * 0.3));
  w.w.position.set(w.x, w.y + 0.02, w.z);
  w.w.scale.set(r2, 1, r2);
  w.w.material.opacity = 0.55 * (1 - u) * (1 - u);
}
// gerbe de billets et d'or (un porteur vient de mourir)
function zvCash(x, y, z) {
  const R = Math.random,
    fl = floorY(x, y + 0.3, z),
    cy = y + 1.3;
  flashAt(x, cy, z, 1.6, 0xffd060, 0.35);
  for (let i = 0; i < 28; i++) {
    const a = R() * 6.283,
      v = 0.4 + R() * 1.4;
    emit(
      'bill',
      x + (R() - 0.5) * 0.3,
      cy,
      z + (R() - 0.5) * 0.3,
      Math.cos(a) * v,
      2 + R() * 3,
      Math.sin(a) * v,
      3 + R() * 1.5,
      0.34,
      0.3,
      fl
    );
  }
  for (let i = 0; i < 16; i++) {
    const a = R() * 6.283,
      v = 1 + R() * 2.5;
    emit('gold', x, cy, z, Math.cos(a) * v, 2 + R() * 4, Math.sin(a) * v, 0.6 + R() * 0.5, 0.14, 0.03, fl);
  }
}
// le cri d'un hurleur (s'il est à moins de 130 m de la caméra) : un anneau libre (sinon le plus avancé est repris), une bouffée rouge
function zvEvent(ev, S, k) {
  if (!ZV) zvInit();
  zvSync(S);
  if (k !== 'hurle') return;
  const c = camera.position;
  if (Math.hypot(ev.x - c.x, ev.z - c.z) > 130) return; // trop loin pour être vu
  let w = ZV.rings[0],
    best = -1;
  for (const q of ZV.rings) {
    if (q.t >= q.T) {
      w = q;
      break;
    }
    if (q.t / q.T > best) {
      best = q.t / q.T;
      w = q;
    }
  }
  w.t = 0;
  w.x = ev.x;
  w.y = ev.y - 1.6 + 0.13;
  w.z = ev.z;
  w.m.visible = w.w.visible = true;
  zvRing(w, 0);
  flashAt(ev.x, ev.y, ev.z, 1.3, 0xff5a48, 0.3);
}
// à chaque image : les anneaux du cri, les pressés, les porteurs, et la gerbe de billets d'un porteur qui vient de mourir
function zvFrame(S, dt) {
  if (!ZV) zvInit();
  zvSync(S);
  const Z = S.z,
    R = Math.random,
    T = G.time;
  for (const w of ZV.rings) {
    if (w.t >= w.T) continue;
    w.t += dt;
    const u = w.t / w.T;
    if (u >= 1) {
      w.m.visible = w.w.visible = false;
      continue;
    }
    zvRing(w, u);
  }
  // pressés par le cri : yeux rouges (devant la tête), traînée derrière (pas pendant l'escalade) ; porteurs : reflet d'or qui scintille sur le sac (environ une fois
  // par seconde : c'est lui qu'on repère de loin), or et billets qui tombent du sac (plafonné par image)
  ZV.eye.begin();
  ZV.trail.begin();
  ZV.glint.begin();
  let chutes = 0;
  for (let q = 0; q < S.nAct; q++) {
    const i = S.act[q],
      st = Z.st[i];
    if (st === 0) continue;
    const h = Z.hst[i],
      ty = Z.ty[i];
    if (h > 0 && ZV.eye.n < ZVN.eye) {
      const sc = ZT[ty].sc,
        yw = Z.yaw[i],
        sy = Math.sin(yw),
        cy = Math.cos(yw),
        cl = st === 2 || st === 5,
        f = (cl ? 0.2 : 0.38) * sc,
        k = Math.min(1, h / 0.6),
        s = (0.12 + 0.03 * Math.sin(T * 16 + i)) * sc * k;
      ZV.eye.add(Z.x[i] + sy * f, Z.y[i] + (cl ? 1.76 : 1.66) * sc, Z.z[i] + cy * f, yw, 0, s * 1.7, s, s);
      if (!cl && ZV.trail.n < ZVN.trail)
        ZV.trail.add(
          Z.x[i] - sy * 0.15,
          Z.y[i] + 1.05 * sc,
          Z.z[i] - cy * 0.15,
          yw + Math.PI,
          0,
          0.24 * sc * k,
          0.36 * sc * k,
          1.6 * sc * k
        );
    }
    if (ty === 6) {
      const sc = ZT[6].sc,
        yw = Z.yaw[i],
        bx = Z.x[i] - Math.sin(yw) * 0.4 * sc,
        by = Z.y[i] + 1.66 * sc,
        bz = Z.z[i] - Math.cos(yw) * 0.4 * sc,
        ph = (T * 0.8 + i * 0.618) % 1;
      if (ph < 0.28 && ZV.glint.n < ZVN.glint - 1) {
        const s = Math.sin((ph / 0.28) * Math.PI) * 0.6 * sc;
        ZV.glint.add(bx, by + 0.12, bz, yw, 0, s * 0.13, s, s * 0.13);
        ZV.glint.add(bx, by + 0.12, bz, yw, 0, s, s * 0.13, s * 0.13);
      }
      if (dt > 0 && chutes < ZVN.drip) {
        if (R() < dt * 3) {
          chutes++;
          emit(
            'gold',
            bx + (R() - 0.5) * 0.3,
            by,
            bz + (R() - 0.5) * 0.3,
            (R() - 0.5) * 0.6,
            0.6 + R(),
            (R() - 0.5) * 0.6,
            0.5 + R() * 0.3,
            0.14,
            0.03
          );
        }
        if (R() < dt * 0.7) {
          chutes++;
          emit('bill', bx, by + 0.1, bz, (R() - 0.5) * 1.2, 0.8 + R(), (R() - 0.5) * 1.2, 1.8 + R(), 0.3, 0.26, floorY(bx, by - 1.2, bz));
        }
      }
    }
  }
  ZV.eye.end();
  ZV.trail.end();
  ZV.glint.end();
  // un porteur vient de mourir (abattu par le joueur ou par une tourelle) : son corps apparaît, une seule gerbe par corps
  for (const c of S.corpses)
    if (c.ty === 6 && !ZV.seen.has(c)) {
      ZV.seen.add(c);
      if (c.t < 0.5) zvCash(c.x, c.y, c.z);
    }
}
