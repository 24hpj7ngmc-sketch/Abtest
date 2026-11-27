// ===================== DERNIER TOIT — l'affichage : cloisons cassables et planches (V1.5, V2.1) =====================
// Les 1 140 panneaux de cloison (PANELS) dessinés en masse, entiers ou abîmés (moins de la moitié de leurs points de vie) ; les trous
// laissés par les balles ; les gravats au pied d'un panneau tombé ; les planches clouées sur les portes (DOORS), la planche « fantôme »
// qui montre au marteau où ira la prochaine ; les planches arrachées qui volent puis restent un moment au sol.
// Tout est redessiné seulement quand les règles le signalent (S.wallVer, S.plankVer changent) ou à une nouvelle partie (nouvel S).
// Attend des règles : PANELS (x0…z1, y0, y1, ax, lv, pid, hp, hp0, dead, tier), DOORS (cx, cz, y, ax, id, planks, x0…z1), PLANKS_MAX,
// LVY, floorAt ; S.wallVer, S.plankVer, S.p ; les événements 'wallhit', 'wallbreak', 'plank', 'tear' (voir cloisonsEvent).
// Fournit : cloisonsInit (gfxInit), cloisonsSync et cloisonsFrame (gfxFrame ; cloisonsFrame renvoie la porte visée au marteau),
// cloisonsEvent (gfxEvent).
// Plafonds : 360 trous (les plus anciens sont repris), 10 planches en vol, 2 gravats par panneau.

const HOLES = 360,
  FLYN = 10;
// réserves : une par teinte d'étage (6) et par état (entier / abîmé) ; trous ; gravats ; planches (deux bois) ; planche fantôme ; planches en vol
function cloisonsInit() {
  const parTeinte = {};
  for (const o of PANELS) parTeinte[o.lv % 6] = (parTeinte[o.lv % 6] || 0) + 1;
  G.wp = {};
  for (const t in parTeinte)
    G.wp[t] = {
      ok: new IPool(prepM('cloison', { lv: +t, bad: 0 }).parts[0].gs.m, K.MAT.m, parTeinte[t]),
      bad: new IPool(prepM('cloison', { lv: +t, bad: 1 }).parts[0].gs.m, K.MAT.m, parTeinte[t])
    };
  G.hole = new IPool(
    prepM('trou').parts[0].gs.m,
    new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    HOLES
  );
  G.holeD = new Float32Array(HOLES * 6);
  G.holeN = 0;
  G.holeC = 0;
  G.rub = new IPool(prepM('gravats').parts[0].gs.m, K.MAT.m, PANELS.length * 2);
  G.php = new Float32Array(PANELS.length);
  G.pl = [0, 1].map(v => new IPool(prepM('planche', { v }).parts[0].gs.m, K.MAT.m, DOORS.length * 3));
  G.plSide = new Int8Array(DOORS.length);
  G.ghost = new IPool(
    prepM('planche', { v: 0 }).parts[0].gs.m,
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.4, depthWrite: false }),
    1
  );
  G.ghost.m.renderOrder = 4;
  G.fly = new IPool(prepM('planche', { v: 1 }).parts[0].gs.m, K.MAT.m, FLYN);
  G.flyD = new Float32Array(FLYN * FLS);
  G.flyOn = 0;
  G.brk = new Float32Array(PANELS.length).fill(-9);
  G.S = null;
  G.wVer = -1;
  G.pVer = -1;
  G.rubDue = 0;
  G.ghostOn = 0;
}
// nouvelle partie (nouvel S) : l'immeuble repart intact, on oublie les trous, les planches qui volent, le côté des planches
function cloisonsSync(S) {
  if (G.S === S) return;
  G.S = S;
  G.wVer = -1;
  G.pVer = -1;
  G.holeN = 0;
  G.holeC = 0;
  G.php.fill(1);
  G.brk.fill(-9);
  G.plSide.fill(0);
  G.flyD.fill(0);
  G.flyOn = 0;
  G.fly.begin();
  G.fly.end();
}
// un panneau o : cap qui couche l'axe x d'un modèle le long du mur, longueur, épaisseur
const pYaw = o => (o.ax === 'x' ? 0 : Math.PI / 2);
const pLen = o => (o.ax === 'x' ? o.x1 - o.x0 : o.z1 - o.z0),
  pThk = o => (o.ax === 'x' ? o.z1 - o.z0 : o.x1 - o.x0);
// côté d'une face : +1 si le point est du côté +z (mur le long de x) ou +x (mur le long de z)
const pSide = (o, x, z) => ((o.ax === 'x' ? z - (o.z0 + o.z1) / 2 : x - (o.x0 + o.x1) / 2) >= 0 ? 1 : -1);
// tous les panneaux : debout (entiers ou abîmés), ou tombés (des gravats des deux côtés, 0,6 s après la chute) ; puis les trous des panneaux debout
function wallsBuild() {
  for (const t in G.wp) {
    G.wp[t].ok.begin();
    G.wp[t].bad.begin();
  }
  G.rub.begin();
  for (const o of PANELS) {
    const cx = (o.x0 + o.x1) / 2,
      cz = (o.z0 + o.z1) / 2,
      yw = pYaw(o),
      L = pLen(o);
    if (o.dead) {
      if (G.time - G.brk[o.pid] < 0.6) continue;
      const y = LVY(o.lv) + 0.022,
        h = o.tier === 'haut' ? 0.7 : 0.55;
      for (const s of [-1, 1]) {
        const d = pThk(o) / 2 + 0.22;
        G.rub.add(
          cx + (o.ax === 'x' ? 0 : s * d),
          y,
          cz + (o.ax === 'x' ? s * d : 0),
          yw + (s < 0 ? Math.PI : 0) + (o.pid & 1) * 0.08,
          0,
          L * 0.95,
          h,
          1
        );
      }
      continue;
    }
    const w = G.wp[o.lv % 6];
    (o.hp < o.hp0 * 0.5 ? w.bad : w.ok).add(
      cx,
      (o.y0 + o.y1) / 2,
      cz,
      yw + (o.pid & 1) * Math.PI,
      0,
      L + 0.004,
      o.y1 - o.y0 + 0.004,
      pThk(o)
    );
  }
  for (const t in G.wp) {
    G.wp[t].ok.end();
    G.wp[t].bad.end();
  }
  G.rub.end();
  G.hole.begin();
  const D = G.holeD;
  for (let i = 0; i < G.holeN; i++) {
    const q = i * 6,
      o = PANELS[D[q + 4]];
    if (o && !o.dead) G.hole.add(D[q], D[q + 1], D[q + 2], D[q + 3], 0, D[q + 5]);
  }
  G.hole.end();
}
// un trou là où la cloison a été touchée (plus grand si le coup était fort), sur la face du côté du tireur ;
// G.holeD, 6 nombres par trou : x, y, z, cap, panneau, taille
function holeAt(o, x, y, z, s) {
  const sd = pSide(o, x, z),
    i = G.holeC % HOLES,
    q = i * 6,
    D = G.holeD,
    m = 0.06;
  G.holeC++;
  G.holeN = Math.min(HOLES, G.holeN + 1);
  if (o.ax === 'x') {
    D[q] = Math.max(o.x0 + m, Math.min(o.x1 - m, x));
    D[q + 2] = sd > 0 ? o.z1 + 0.004 : o.z0 - 0.004;
    D[q + 3] = sd > 0 ? 0 : Math.PI;
  } else {
    D[q + 2] = Math.max(o.z0 + m, Math.min(o.z1 - m, z));
    D[q] = sd > 0 ? o.x1 + 0.004 : o.x0 - 0.004;
    D[q + 3] = sd > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  D[q + 1] = Math.max(o.y0 + m, Math.min(o.y1 - m, y));
  D[q + 4] = o.pid;
  D[q + 5] = s;
}
// les planches d'une porte : 5 places entre 0,4 et 1,9 m, posées dans cet ordre (milieu d'abord, celle du bas en dernier), un peu de biais, en alternance
const PL_Y = [0.4, 0.775, 1.15, 1.525, 1.9],
  PL_ORD = [2, 1, 3, 4, 0],
  PL_ROLL = [0.15, -0.19, 0.11, -0.13, 0.21];
// côté où sont clouées les planches d'une porte : celui du joueur à la première planche (G.plSide), sinon du côté du centre de l'immeuble
const plDefSide = D => ((D.ax === 'x' ? -D.cz : -D.cx) >= 0 ? 1 : -1);
const plSide = D => G.plSide[D.id] || plDefSide(D);
// largeur et épaisseur d'une porte
const doorW = D => (D.ax === 'x' ? D.x1 - D.x0 : D.z1 - D.z0),
  doorT = D => (D.ax === 'x' ? D.z1 - D.z0 : D.x1 - D.x0);
// place de la planche n° i (0 = la première posée) : remplit PLQ = [x, y, z, cap, roulis, longueur]
const PLQ = new Float32Array(6);
function plankAt(D, i, sd) {
  const k = PL_ORD[i],
    h = (((D.id * 7 + i * 3) % 5) - 2) * 0.012,
    off = sd * (doorT(D) / 2 + 0.02 + (i & 1) * 0.028),
    sl = (((D.id * 5 + i) % 3) - 1) * 0.04;
  PLQ[0] = D.cx + (D.ax === 'x' ? sl : off);
  PLQ[1] = D.y + PL_Y[k] + h;
  PLQ[2] = D.cz + (D.ax === 'x' ? off : sl);
  PLQ[3] = D.ax === 'x' ? (sd > 0 ? 0 : Math.PI) : sd > 0 ? Math.PI / 2 : -Math.PI / 2;
  PLQ[4] = PL_ROLL[i] * (D.id & 1 ? -1 : 1);
  PLQ[5] = doorW(D) + 0.34;
  return PLQ;
}
// toutes les planches clouées, deux bois en alternance
function planksBuild() {
  G.pl[0].begin();
  G.pl[1].begin();
  for (const D of DOORS) {
    if (!D.planks) continue;
    const sd = plSide(D);
    for (let i = 0; i < D.planks; i++) {
      const q = plankAt(D, i, sd);
      G.pl[(D.id + i) & 1].addR(q[0], q[1], q[2], q[3], 0, q[4], q[5], 1, 1);
    }
  }
  G.pl[0].end();
  G.pl[1].end();
}
// une planche arrachée s'envole (vers le côté opposé), tombe au plancher, reste un moment puis s'enfonce
// G.flyD, 14 nombres par planche : x y z, vitesse, cap, tangage, roulis, vitesse de rotation, longueur, état (0 libre, 1 en vol, 2 au sol), temps, plancher
const FLS = 14;
function flyPlank(D, i, sd) {
  const F = G.flyD;
  let place = 0,
    plusVieux = -1;
  for (let j = 0; j < FLYN; j++) {
    if (!F[j * FLS + 11]) {
      place = j;
      break;
    }
    if (F[j * FLS + 12] > plusVieux) {
      plusVieux = F[j * FLS + 12];
      place = j;
    }
  }
  const q = plankAt(D, i, sd),
    o = place * FLS,
    v = 1.8 + Math.random() * 1.6,
    nx = D.ax === 'x' ? 0 : -sd,
    nz = D.ax === 'x' ? -sd : 0;
  F[o] = q[0];
  F[o + 1] = q[1];
  F[o + 2] = q[2];
  F[o + 3] = nx * v + (Math.random() - 0.5) * 1.2;
  F[o + 4] = 1.4 + Math.random() * 1.8;
  F[o + 5] = nz * v + (Math.random() - 0.5) * 1.2;
  F[o + 6] = q[3];
  F[o + 7] = 0;
  F[o + 8] = q[4];
  F[o + 9] = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8);
  F[o + 10] = q[5];
  F[o + 11] = 1;
  F[o + 12] = 0;
  F[o + 13] = D.y;
  G.flyOn = 1;
}
// les planches en vol : gravité, rotation, posées à plat sur le plancher ; au sol 4 s, puis elles s'enfoncent et disparaissent (5 s)
function flyStep(dt) {
  if (!G.flyOn) return;
  const F = G.flyD;
  let enVol = 0;
  G.fly.begin();
  for (let j = 0; j < FLYN; j++) {
    const o = j * FLS;
    if (!F[o + 11]) continue;
    F[o + 12] += dt;
    const plancher = F[o + 11] === 1 ? (F[o + 13] = floorAt(F[o], F[o + 2], F[o + 1] + 0.3)) : F[o + 13];
    if (F[o + 11] === 1) {
      F[o + 4] -= 9.8 * dt;
      F[o] += F[o + 3] * dt;
      F[o + 1] += F[o + 4] * dt;
      F[o + 2] += F[o + 5] * dt;
      F[o + 7] += F[o + 9] * dt * 0.5;
      F[o + 8] += F[o + 9] * dt;
      if (F[o + 1] < plancher + 0.04 && F[o + 4] < 0) {
        // à plat sur le plancher
        F[o + 1] = plancher + 0.04;
        F[o + 11] = 2;
        F[o + 7] = Math.PI / 2;
        F[o + 12] = 0;
      }
    } else if (F[o + 12] > 4) {
      F[o + 1] -= dt * 0.2;
      if (F[o + 12] > 5) {
        F[o + 11] = 0;
        continue;
      }
    }
    enVol = 1;
    G.fly.addR(F[o], F[o + 1], F[o + 2], F[o + 6], F[o + 7], F[o + 8], F[o + 10], 1, 1);
  }
  G.fly.end();
  G.flyOn = enVol;
}
// à chaque image : gravats qui apparaissent 0,75 s après une chute, cloisons et planches redessinées si elles ont changé,
// planche fantôme (marteau sur une porte qui a encore de la place), planches en vol ; renvoie la porte visée (ou null)
function cloisonsFrame(S, dt, V) {
  const p = S.p;
  if (G.rubDue > 0) {
    G.rubDue -= dt;
    if (G.rubDue <= 0) G.wVer = -1;
  }
  if (S.wallVer !== G.wVer) {
    G.wVer = S.wallVer;
    wallsBuild();
  }
  if (S.plankVer !== G.pVer) {
    G.pVer = S.plankVer;
    planksBuild();
  }
  const porte = V.door >= 0 ? DOORS[V.door] : null;
  if (porte && porte.planks < PLANKS_MAX) {
    const cote = porte.planks ? plSide(porte) : (porte.ax === 'x' ? p.z - porte.cz : p.x - porte.cx) >= 0 ? 1 : -1,
      cle = 1 + porte.id * 32 + porte.planks * 2 + (cote > 0 ? 1 : 0);
    if (cle !== G.ghostOn) {
      const q = plankAt(porte, porte.planks, cote);
      G.ghost.begin();
      G.ghost.addR(q[0], q[1], q[2], q[3], 0, q[4], q[5], 1, 1);
      G.ghost.end();
      // la matrice ne change qu'avec la porte visée (ou son nombre de planches, ou le côté)
      G.ghostOn = cle;
    }
    G.ghost.m.material.opacity = 0.38 + 0.16 * Math.sin(G.time * 7);
  } else if (G.ghostOn) {
    G.ghost.begin();
    G.ghost.end();
    G.ghostOn = 0;
  }
  flyStep(dt);
  return porte;
}
// les événements des cloisons et des planches : 'wallhit' (trou, éclats de plâtre, poussière), 'wallbreak' (le pan tombe : gravats,
// éclats, nuage), 'plank' (planche clouée : poussière aux bouts, copeaux), 'tear' (planche arrachée qui part du côté des zombies, échardes)
function cloisonsEvent(ev, S, k) {
  cloisonsSync(S);
  const R = Math.random;
  if (k === 'wallhit') {
    const o = PANELS[ev.pid];
    if (!o) return;
    const dr = Math.max(0.06, G.php[o.pid] - ev.hp);
    G.php[o.pid] = ev.hp;
    holeAt(o, ev.x, ev.y, ev.z, Math.min(3, 0.8 + dr * 3));
    // éclats de plâtre projetés du côté du coup, un peu de poussière
    const sd = pSide(o, ev.x, ev.z),
      nx = o.ax === 'x' ? 0 : sd,
      nz = o.ax === 'x' ? sd : 0,
      fl = LVY(o.lv),
      n = 2 + Math.round(dr * 14);
    for (let i = 0; i < n; i++) {
      const v = 1 + R() * 2.5;
      emit(
        'plaster',
        ev.x + nx * 0.03,
        ev.y,
        ev.z + nz * 0.03,
        nx * v + (R() - 0.5) * 1.6,
        R() * 2.4,
        nz * v + (R() - 0.5) * 1.6,
        0.8 + R() * 0.6,
        0.02 + R() * 0.022,
        0.014,
        fl
      );
    }
    for (let i = 0, m = 1 + Math.round(dr * 5); i < m; i++) {
      const v = 0.25 + R() * 0.6;
      emit(
        'pdust',
        ev.x + nx * 0.08,
        ev.y + (R() - 0.5) * 0.1,
        ev.z + nz * 0.08,
        nx * v + (R() - 0.5) * 0.3,
        (R() - 0.3) * 0.3,
        nz * v + (R() - 0.5) * 0.3,
        0.8 + R() * 0.7,
        0.03 + dr * 0.03,
        0.06 + dr * 0.1
      );
    }
  } else if (k === 'wallbreak') {
    const o = PANELS[ev.pid];
    if (!o) return;
    G.php[o.pid] = 0;
    G.brk[o.pid] = G.time;
    G.rubDue = 0.75;
    // gravats qui tombent (surtout de l'autre côté du coup), éclats, nuage de poussière qui s'étale
    const fl = LVY(o.lv),
      L = pLen(o),
      hh = o.y1 - o.y0,
      ax = o.ax === 'x',
      sd = pSide(o, ev.x, ev.z),
      cx = (o.x0 + o.x1) / 2,
      cz = (o.z0 + o.z1) / 2,
      a0 = ax ? o.x0 : o.z0;
    const jette = (u, y, s, v, kind, T, s0, s1) => {
      const w = a0 + u * L;
      emit(
        kind,
        ax ? w : cx + s * 0.08,
        y,
        ax ? cz + s * 0.08 : w,
        ax ? (R() - 0.5) * 0.8 : s * v,
        0.3 + R() * 1.6,
        ax ? s * v : (R() - 0.5) * 0.8,
        T,
        s0,
        s1,
        fl
      );
    };
    for (let i = 0, n = Math.round(L * hh * 8); i < n; i++) {
      const s = R() < 0.8 ? -sd : sd;
      jette(R(), o.y0 + R() * hh, s, s === sd ? 0.2 + R() * 0.6 : 0.4 + R() * 1.8, 'rubble', 2.2 + R() * 1.6, 0.04 + R() * 0.06, 0.03);
    }
    for (let i = 0, n = Math.round(L * hh * 10); i < n; i++) {
      const s = R() < 0.75 ? -sd : sd;
      jette(R(), o.y0 + R() * hh, s, s === sd ? 0.3 + R() : 0.6 + R() * 2.6, 'plaster', 1 + R() * 0.8, 0.02 + R() * 0.022, 0.014);
    }
    for (let i = 0, n = 6 + Math.round(L * hh * 3); i < n; i++) {
      const s = R() < 0.65 ? -sd : sd,
        v = 0.2 + R() * 0.9,
        w = a0 + R() * L,
        y = o.y0 + R() * hh * 0.85;
      emit(
        'pdust',
        ax ? w : cx + s * 0.15,
        y,
        ax ? cz + s * 0.15 : w,
        ax ? (R() - 0.5) * 0.6 : s * v,
        -0.25 + R() * 0.3,
        ax ? s * v : (R() - 0.5) * 0.6,
        1.2 + R() * 1.2,
        0.05 + R() * 0.04,
        0.12 + R() * 0.13
      );
    }
    const dd = Math.hypot(ev.x - S.p.x, ev.y - S.p.y - 1.5, ev.z - S.p.z);
    G.shake = Math.max(G.shake, 0.24 * Math.max(0, 1 - dd / 9));
  } else if (k === 'plank') {
    const D = DOORS[ev.door];
    if (!D) return;
    if (ev.n === 1) G.plSide[D.id] = (D.ax === 'x' ? S.p.z - D.cz : S.p.x - D.cx) >= 0 ? 1 : -1;
    // petit choc : poussière qui s'échappe des bouts, deux ou trois copeaux
    const q = plankAt(D, Math.max(0, ev.n - 1), plSide(D)),
      sd = plSide(D),
      nx = D.ax === 'x' ? 0 : sd,
      nz = D.ax === 'x' ? sd : 0,
      ex = D.ax === 'x' ? 1 : 0,
      ez = D.ax === 'x' ? 0 : 1;
    for (const e of [-1, 1]) {
      const x = q[0] + ex * e * q[5] * 0.45,
        z = q[2] + ez * e * q[5] * 0.45;
      emit(
        'pdust',
        x + nx * 0.05,
        q[1],
        z + nz * 0.05,
        nx * (0.2 + R() * 0.3) + (R() - 0.5) * 0.2,
        0.1 + R() * 0.2,
        nz * (0.2 + R() * 0.3) + (R() - 0.5) * 0.2,
        0.45 + R() * 0.3,
        0.02,
        0.06 + R() * 0.03
      );
      for (let i = 0; i < 2; i++)
        emit(
          'wood',
          x + nx * 0.05,
          q[1],
          z + nz * 0.05,
          nx * (0.5 + R()) + (R() - 0.5),
          0.8 + R() * 1.4,
          nz * (0.5 + R()) + (R() - 0.5),
          0.8 + R() * 0.5,
          0.018,
          0.012,
          floorAt(x, z, q[1])
        );
    }
    if (Math.hypot(S.p.x - D.cx, S.p.z - D.cz) < 3.2) G.shake = Math.max(G.shake, 0.1);
  } else if (k === 'tear') {
    const D = DOORS[ev.door];
    if (!D) return;
    const sd = plSide(D);
    flyPlank(D, ev.n, sd);
    const q = PLQ,
      nx = D.ax === 'x' ? 0 : -sd,
      nz = D.ax === 'x' ? -sd : 0;
    // la planche part du côté des zombies (à l'opposé de celui où elle était clouée), avec des échardes
    for (let i = 0; i < 14; i++) {
      const u = (R() - 0.5) * q[5],
        v = 1 + R() * 2.5;
      emit(
        'wood',
        q[0] + (D.ax === 'x' ? u : 0),
        q[1] + (R() - 0.5) * 0.12,
        q[2] + (D.ax === 'x' ? 0 : u),
        nx * v + (R() - 0.5) * 1.5,
        0.5 + R() * 2.5,
        nz * v + (R() - 0.5) * 1.5,
        0.9 + R() * 0.8,
        0.022 + R() * 0.02,
        0.012,
        floorAt(q[0], q[2], q[1])
      );
    }
    for (let i = 0; i < 4; i++)
      emit(
        'pdust',
        q[0] + (R() - 0.5) * q[5] * 0.8 * (D.ax === 'x' ? 1 : 0),
        q[1],
        q[2] + (R() - 0.5) * q[5] * 0.8 * (D.ax === 'x' ? 0 : 1),
        nx * 0.4,
        0.1,
        nz * 0.4,
        0.9,
        0.08,
        0.3
      );
    if (ev.n === 0) G.plSide[D.id] = 0;
  }
}
