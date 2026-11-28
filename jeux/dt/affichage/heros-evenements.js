// ===================== DERNIER TOIT — l'affichage : effets des héros, ce qui part d'un coup (événements) =====================
// hfxEvent voit passer tous les événements (appelé au début de gfxEvent) et réagit à ceux des héros :
// brasier0 (Braise lance sa boule de feu), boom de kind 'B' (elle explose), meteor (un météore part), maree (vague d'Ondine), ronces,
// fleche (flèche d'un gardien de Sylve), rempart et rempart_fin (le mur de Roc sort, puis s'effondre ou s'enfonce), zap (une balle de Volt
// saute sur un voisin, ou la foudre de l'orage), eclair (le bond de Volt), hult (un ultime : voile coloré et effet de départ) ;
// V4.8 : rafale (le bond de Zéphyr), percant (son Tir perçant), souleve (une balle de Vent soulève un petit zombie).
// Attend des règles : ces événements, S.p, S.guards, S.storms, eyeP, viewDir. Le reste (ce qui dure) : heros-image.js.
function hfxEvent(ev, S, k) {
  if (!HX) hfxInit();
  hxSync(S);
  const R = Math.random;
  // V5.3 : l'élément choisi qui remplace celui du sort (ev.ec ; absent : celui d'origine). Les balles (zap de saut, souleve) gardent leurs couleurs
  hxSk(
    ev.small || k === 'souleve' ? null : ev.ec,
    k === 'maree'
      ? 'eau'
      : k === 'ronces' || k === 'fleche' || k === 'plonge'
        ? 'bois'
        : k === 'rempart' || k === 'rempart_fin' || k === 'onde_roc'
          ? 'terre'
          : k === 'zap' || k === 'eclair' || k === 'acheve'
            ? 'elec'
            : k === 'rafale' || k === 'percant'
              ? 'vent'
              : k === 'hult'
                ? ev.h
                : 'feu'
  );
  // Braise lance sa boule de feu : des flammes devant le joueur
  if (k === 'brasier0') {
    const e = eyeP(S.p),
      d = viewDir(S.p);
    for (let i = 0; i < 10; i++) {
      const v = 3 + R() * 4;
      emit(
        hxK('fire'),
        e[0] + d[0] * 1.3,
        e[1] - 0.15 + d[1] * 1.3,
        e[2] + d[2] * 1.3,
        d[0] * v + (R() - 0.5) * 2,
        d[1] * v + (R() - 0.5) * 2 + 0.5,
        d[2] * v + (R() - 0.5) * 2,
        0.22 + R() * 0.12,
        0.1,
        0.02
      );
    }
  }
  // explosion de la boule de feu (le reste de l'explosion est fait par 'boom') : anneau de feu, braises, sol brûlé
  else if (k === 'boom' && ev.kind === 'B') {
    hxRing(ev.x, Math.max(0.12, ev.y - 0.2), ev.z, 1, ev.r * 1.7, 0.6, hxC(0xff7a2e, 'main'), 0.95);
    for (let i = 0; i < 20; i++) {
      const a = R() * 6.283,
        v = 4 + R() * 8;
      emit(hxK('fire'), ev.x, ev.y, ev.z, Math.cos(a) * v, 2 + R() * 7, Math.sin(a) * v, 0.45 + R() * 0.4, 0.18 + R() * 0.1, 0.03);
    }
    if (ev.y < 1.3 && !HXE) hxScorch(ev.x, ev.z, 3.6);
  } else if (k === 'meteor') {
    // un météore part (réserve HX.metD, 7 nombres : cible x z, temps restant, durée, départ x z, 26 m plus près de l'immeuble et 56 m plus haut, élément qui remplace) ; il tombe dans hxFeuFrame
    const M = HX.metD;
    let j = 0;
    for (; j < HXN.met; j++) if (M[j * 7 + 2] <= 0) break;
    if (j >= HXN.met) j = 0;
    const o = j * 7,
      l = Math.hypot(ev.x, ev.z) || 1;
    M[o] = ev.x;
    M[o + 1] = ev.z;
    M[o + 2] = M[o + 3] = ev.t || 0.55;
    M[o + 4] = ev.x - (ev.x / l) * 26;
    M[o + 5] = ev.z - (ev.z / l) * 26;
    M[o + 6] = hxI(HXE);
  } else if (k === 'maree') {
    // la vague d'Ondine : une vague (cylindre qui s'élargit, dans hxAnneauxFrame), des gerbes d'eau, un anneau clair
    let w = HX.waves[0];
    for (const q of HX.waves)
      if (q.t >= 1.1) {
        w = q;
        break;
      }
    w.t = 0;
    w.x = ev.x;
    w.y = ev.y;
    w.z = ev.z;
    w.r = ev.r;
    w.el = HXE;
    // V5.3 : la vague prend la palette de l'élément qui remplace (sinon ses bleus d'origine)
    w.c.material.color.setHex(hxC(0x3fa9ff, 'main'));
    w.f.material.color.setHex(hxC(0xe2f6ff, 'glow'));
    w.d.material.color.setHex(hxC(0x9fd8ff, 'light'));
    for (let i = 0; i < 34; i++) {
      const a = R() * 6.283,
        v = 2 + R() * 5;
      emit(
        hxK('water'),
        ev.x + Math.cos(a) * 0.8,
        ev.y + 0.3,
        ev.z + Math.sin(a) * 0.8,
        Math.cos(a) * v * 0.6,
        5 + R() * 6,
        Math.sin(a) * v * 0.6,
        1 + R() * 0.6,
        0.16 + R() * 0.1,
        0.06,
        ev.y
      );
    }
    hxRing(ev.x, ev.y + 0.1, ev.z, 1, ev.r * 1.15, 0.8, hxC(0xbfe8ff, 'light'), 0.9);
  } else if (k === 'ronces') {
    // le roncier de Sylve sort : anneau vert, feuilles et poussière
    hxRing(ev.x, ev.y + 0.12, ev.z, 0.5, ev.r, 0.5, hxC(0x5fd068, 'main'), 0.9);
    for (let i = 0; i < 26; i++) {
      const a = R() * 6.283,
        d = R() * ev.r;
      emit(
        hxK('leaf'),
        ev.x + Math.cos(a) * d,
        ev.y + 0.2,
        ev.z + Math.sin(a) * d,
        Math.cos(a) * 1.5,
        3 + R() * 3,
        Math.sin(a) * 1.5,
        1.6 + R(),
        0.14,
        0.1,
        ev.y
      );
      if (i % 2)
        emit(
          'dust',
          ev.x + Math.cos(a) * d,
          ev.y + 0.1,
          ev.z + Math.sin(a) * d,
          Math.cos(a) * 2,
          1 + R() * 2,
          Math.sin(a) * 2,
          0.8,
          0.18,
          0.05,
          ev.y
        );
    }
  } else if (k === 'fleche') {
    // une flèche d'un gardien (HX.arwD, 9 nombres : départ en haut de l'arbre, arrivée, âge, durée du vol à 75 m/s, élément qui remplace)
    const A = HX.arwD,
      o = (HX.arwC++ % HXN.arw) * 9,
      y0 = ev.y0 + 2.6,
      l = Math.hypot(ev.x1 - ev.x0, ev.y1 - y0, ev.z1 - ev.z0);
    A[o] = ev.x0;
    A[o + 1] = y0;
    A[o + 2] = ev.z0;
    A[o + 3] = ev.x1;
    A[o + 4] = ev.y1;
    A[o + 5] = ev.z1;
    A[o + 6] = 0;
    A[o + 7] = Math.max(0.12, l / 75);
    A[o + 8] = hxI(HXE);
  } else if (k === 'rempart') {
    // le rempart de Roc sort de terre : poussière et éclats des deux côtés, anneau sombre, secousse si proche
    const tx = -ev.nz,
      tz = ev.nx;
    for (let i = 0; i < 30; i++) {
      const u = (R() * 2 - 1) * ev.half,
        s = R() < 0.5 ? -1 : 1;
      emit(
        'dust',
        ev.x + tx * u + ev.nx * s * 0.9,
        0.2,
        ev.z + tz * u + ev.nz * s * 0.9,
        ev.nx * s * (1 + R() * 2),
        1 + R() * 2.5,
        ev.nz * s * (1 + R() * 2),
        1.1,
        0.3,
        0.08
      );
      if (i % 2)
        emit(
          hxK('rock'),
          ev.x + tx * u,
          0.4,
          ev.z + tz * u,
          ev.nx * s * (1 + R() * 3) + (R() - 0.5),
          4 + R() * 5,
          ev.nz * s * (1 + R() * 3) + (R() - 0.5),
          1.4,
          0.12 + R() * 0.1,
          0.08
        );
      if (i % 3 === 0)
        emit('pdust', ev.x + tx * u + ev.nx * s, 0.5, ev.z + tz * u + ev.nz * s, ev.nx * s * 0.8, 0.5, ev.nz * s * 0.8, 1.5, 0.5, 1.6);
    }
    hxRing(ev.x, 0.12, ev.z, 1, ev.half * 1.3, 0.6, hxC(0x5a3a1e, 'dark'), 0.7, 1);
    const dd = Math.hypot(ev.x - S.p.x, ev.z - S.p.z);
    G.shake = Math.max(G.shake, 0.32 * Math.max(0, 1 - dd / 70));
  } else if (k === 'rempart_fin') {
    // fin du rempart : cassé, il part en morceaux d'un coup ; sinon il s'enfonce (dans hxTerreFrame)
    let w = null;
    for (const q of HX.walls)
      if (q.on && q.id === ev.id) {
        w = q;
        break;
      }
    const x = w ? w.x : ev.x,
      z = w ? w.z : ev.z,
      nx = w ? w.nx : 0,
      nz = w ? w.nz : 1,
      hf = w ? w.half : 4.5;
    if (w) {
      w.fin = 0;
      w.broke = ev.broke ? 1 : 0;
    }
    // cassé : il part en morceaux d'un coup ; sinon il s'enfonce (dans hfxFrame)
    if (ev.broke) {
      for (let i = 0; i < 40; i++) {
        const u = (R() * 2 - 1) * hf,
          s = R() < 0.5 ? -1 : 1;
        emit(
          hxK('rock'),
          x - nz * u,
          0.2 + R() * 2.4,
          z + nx * u,
          nx * s * (1 + R() * 3) + (R() - 0.5) * 2,
          1 + R() * 4,
          nz * s * (1 + R() * 3) + (R() - 0.5) * 2,
          2 + R(),
          0.14 + R() * 0.14,
          0.1
        );
        if (i % 3 === 0) emit('pdust', x - nz * u, 0.8, z + nx * u, R() - 0.5, 0.6, R() - 0.5, 1.8, 0.6, 2);
      }
      const dd = Math.hypot(x - S.p.x, z - S.p.z);
      G.shake = Math.max(G.shake, 0.25 * Math.max(0, 1 - dd / 60));
    }
  } else if (k === 'zap') {
    // ev.small : une balle de Volt saute sur un voisin (petit arc) ; sinon la foudre de l'orage (gros arc, éclair, étincelles, sol brûlé)
    const foudre = !ev.small;
    hxArc(ev.x0, ev.y0, ev.z0, ev.x1, ev.y1, ev.z1, foudre ? 0.24 : 0.13, foudre ? 1 : 0);
    if (foudre) HX.arcEl = HXE;
    const sol = floorY(ev.x1, ev.y1, ev.z1);
    if (foudre) {
      flashAt(ev.x1, ev.y1, ev.z1, 2.6, hxC(0xfff2a0, 'glow'), 0.22);
      for (let i = 0; i < 10; i++) {
        const a = R() * 6.283,
          v = 2 + R() * 5;
        emit(hxK('spark'), ev.x1, ev.y1 - 0.6, ev.z1, Math.cos(a) * v, 2 + R() * 4, Math.sin(a) * v, 0.35 + R() * 0.2, 0.09, 0.02, sol);
      }
      if (ev.y1 < 1.6 && R() < 0.5 && !HXE) hxScorch(ev.x1, ev.z1, 1.1);
    } else
      for (let i = 0; i < 3; i++) emit(hxK('spark'), ev.x1, ev.y1, ev.z1, (R() - 0.5) * 4, R() * 3, (R() - 0.5) * 4, 0.25, 0.06, 0.01, sol);
  } else if (k === 'eclair') {
    // le bond de Volt : traînée (HX.dashD, 7 nombres : départ x y z, arrivée x z, âge, durée), deux arcs, étincelles, coup de caméra, voile jaune
    const D = HX.dashD,
      o = (HX.dashC++ % HXN.dash) * 7;
    D[o] = ev.x0;
    D[o + 1] = ev.y - 0.45;
    D[o + 2] = ev.z0;
    D[o + 3] = ev.x1;
    D[o + 4] = ev.z1;
    D[o + 5] = 0;
    D[o + 6] = 0.45;
    const ax = lerp(ev.x0, ev.x1, 0.8),
      az = lerp(ev.z0, ev.z1, 0.8);
    for (let n = 0; n < 2; n++) hxArc(ev.x0, ev.y - 0.4, ev.z0, ax, ev.y - 0.4, az, 0.3, 2);
    const sol = floorY(ev.x1, ev.y, ev.z1);
    for (let i = 0; i < 22; i++) {
      const u = R() * 0.8;
      emit(
        hxK('spark'),
        lerp(ev.x0, ev.x1, u),
        ev.y - 0.6 + R() * 0.8,
        lerp(ev.z0, ev.z1, u),
        (R() - 0.5) * 3,
        R() * 2.5,
        (R() - 0.5) * 3,
        0.3 + R() * 0.3,
        0.07,
        0.01,
        sol
      );
    }
    HX.arcEl = HX.dashEl = HXE;
    G.kick = 1;
    hxVig(hxC(HXC.elec, 'main'), 0.38, 0.35);
  } else if (k === 'rafale') {
    // le Bond de Zéphyr : un souffle turquoise là où le bond a commencé, qui file devant (loin de la caméra, qui recule), un anneau
    // au sol, un coup de caméra, voile turquoise
    const dx = ev.x1 - ev.x0,
      dz = ev.z1 - ev.z0,
      l = Math.hypot(dx, dz) || 1,
      sol = floorY(ev.x0, ev.y, ev.z0);
    for (let i = 0; i < 18; i++) {
      const u = -R() * 0.6,
        a = R() * 6.283,
        v = 0.6 + R() * 1.2;
      emit(
        hxK('gust'),
        ev.x0 + dx * u + Math.cos(a) * 0.5,
        ev.y - 0.9 + R() * 1.2,
        ev.z0 + dz * u + Math.sin(a) * 0.5,
        (-dx / l) * (2 + R() * 3) + Math.cos(a) * v,
        R() * 1.2,
        (-dz / l) * (2 + R() * 3) + Math.sin(a) * v,
        0.4 + R() * 0.3,
        0.06,
        0.22,
        sol
      );
    }
    hxRing(ev.x0, sol + 0.12, ev.z0, 0.4, 5, 0.45, hxC(HXC.vent, 'main'), 0.7);
    G.kick = 1;
    hxVig(hxC(HXC.vent, 'main'), 0.32, 0.35);
  } else if (k === 'percant') {
    // le Tir perçant : un long trait turquoise (heros-image.js), du souffle le long des 40 premiers mètres
    hxBeam(ev.x0, ev.y0, ev.z0, ev.x1, ev.y1, ev.z1, Math.max(0.3, ev.w * 0.5));
    hxTeinte(HX.beam, 0x8fe6dc, 'main');
    const dx = ev.x1 - ev.x0,
      dy = ev.y1 - ev.y0,
      dz = ev.z1 - ev.z0,
      l = Math.hypot(dx, dy, dz) || 1;
    for (let i = 0; i < 24; i++) {
      const t = 7 + R() * Math.max(0, Math.min(40, l - 7)),
        a = R() * 6.283;
      emit(
        hxK('gust'),
        ev.x0 + (dx / l) * t,
        ev.y0 + (dy / l) * t,
        ev.z0 + (dz / l) * t,
        Math.cos(a) * 2,
        (R() - 0.3) * 2,
        Math.sin(a) * 2,
        0.5 + R() * 0.4,
        0.1,
        0.35
      );
    }
    flashAt(ev.x0 + (dx / l) * 1.5, ev.y0 + (dy / l) * 1.5, ev.z0 + (dz / l) * 1.5, 2.2, hxC(0xc8f5ef, 'light'), 0.12);
    G.kick = 1;
    G.shake = Math.max(G.shake, 0.18);
  } else if (k === 'souleve') {
    // une balle de Vent soulève un petit zombie (zombies.js le monte, HX.lev0 / lev1) : un tourbillon sous ses pieds
    if (ev.i >= 0 && ev.i < MAXZ) {
      HX.lev0[ev.i] = S.t;
      HX.lev1[ev.i] = S.t + (ev.d || 0.6);
    }
    for (let i = 0; i < 5; i++) {
      const a = R() * 6.283;
      emit(
        hxK('gust'),
        ev.x + Math.cos(a) * 0.4,
        ev.y + 0.1,
        ev.z + Math.sin(a) * 0.4,
        -Math.sin(a) * 1.5,
        1.5 + R() * 1.5,
        Math.cos(a) * 1.5,
        0.5,
        0.1,
        0.3
      );
    }
  } else if (k === 'hult') {
    // un ultime : voile à la couleur du héros, et le départ de son effet (Onde de choc, anneaux, gardiens, orage)
    hxVig(hxC(HXC[ev.h] || 0xffffff, 'main'), 0.55, 0.75);
    if (ev.h === 'terre') hxSeisme(S);
    else if (ev.h === 'eau') hxRing(0, 0.15, 0, B + 3, 60, 1.6, hxC(0x9fd8ff, 'light'), 0.8);
    else if (ev.h === 'feu') hxRing(0, 0.15, 0, B + 3, 60, 1.2, hxC(0xff6a3d, 'main'), 0.7);
    else if (ev.h === 'bois') {
      for (const g of S.guards) {
        hxRing(g.x, 0.14, g.z, 0.6, 7, 0.7, hxC(0x5fd068, 'main'), 0.9);
        for (let i = 0; i < 12; i++) {
          const a = R() * 6.283;
          emit('dust', g.x, 0.2, g.z, Math.cos(a) * 4, 1 + R() * 3, Math.sin(a) * 4, 1, 0.25, 0.06);
        }
      }
    } else if (ev.h === 'elec') {
      const O = S.storms[S.storms.length - 1];
      if (O) hxRing(O.x, O.y + 0.14, O.z, 2, O.r, 0.6, hxC(0xffd93b, 'main'), 0.9);
    } else if (ev.h === 'vent') hxRing(S.p.x, S.p.y + 0.12, S.p.z, 0.5, 9, 0.55, hxC(HXC.vent, 'main'), 0.8);
    // V4.9 : ultime teinté par l'élément de l'arme : un second anneau et un second voile, à sa couleur
    if (ev.el && HXC[ev.el]) {
      hxRing(S.p.x, S.p.y + 0.13, S.p.z, 0.8, 14, 0.8, HXC[ev.el], 0.75);
      hxVig(HXC[ev.el], 0.35, 1.1);
    }
  } else if (k === 'plonge') {
    // V4.9 : Plongeur, le bond de Sylve : feuilles et poussière au départ
    const sol = floorY(ev.x0, ev.y, ev.z0);
    for (let i = 0; i < 14; i++) {
      const a = R() * 6.283;
      emit(
        hxK('leaf'),
        ev.x0 + Math.cos(a) * 0.5,
        sol + 0.3,
        ev.z0 + Math.sin(a) * 0.5,
        Math.cos(a) * 2,
        1 + R() * 2,
        Math.sin(a) * 2,
        1.2,
        0.12,
        0.3,
        sol
      );
    }
    G.kick = 1;
    hxVig(hxC(HXC.bois, 'main'), 0.3, 0.35);
  } else if (k === 'onde_roc') {
    // V4.9 : Avant-garde, l'onde à l'arrivée de la charge
    hxRing(ev.x, 0.12, ev.z, 1, ev.r, 0.5, hxC(0x8f6a44, 'dark'), 0.85);
    for (let i = 0; i < 16; i++) {
      const a = R() * 6.283;
      emit(
        hxK('rock'),
        ev.x + Math.cos(a) * 1.5,
        0.3,
        ev.z + Math.sin(a) * 1.5,
        Math.cos(a) * 5,
        3 + R() * 4,
        Math.sin(a) * 5,
        1.2,
        0.14,
        0.08
      );
    }
  } else if (k === 'acheve') {
    // V4.9 : Lame, une exécution : éclat jaune
    flashAt(ev.x, ev.y, ev.z, 1.6, hxC(0xffd93b, 'main'), 0.1);
    for (let i = 0; i < 8; i++) {
      const a = R() * 6.283;
      emit(hxK('spark'), ev.x, ev.y, ev.z, Math.cos(a) * 4, 1 + R() * 3, Math.sin(a) * 4, 0.35, 0.08, 0.02);
    }
  } else if (k === 'bouclier') hxVig(0x3fa9ff, 0.4, 0.6);
  HXE = null;
}
