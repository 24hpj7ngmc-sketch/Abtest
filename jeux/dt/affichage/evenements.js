// ===================== DERNIER TOIT — l'affichage : les événements du jeu → effets =====================
// L'interface passe chaque événement des règles (S.ev) à gfxEvent(ev, S), avant de jouer son son (interface/evenements.js), puis vide S.ev.
// Ici : le tri vers les fichiers par sujet, et les effets simples.
// Événements traités : shot, pellet (tirs.js) ; tracer (traçante d'une mitrailleuse, ou d'un ricochet V4.7) ; allume (balle incendiaire V4.7), boom (explosion : éclair, flammes, fumée, poussière,
// taches au sol, secousse), land (un zombie tombé : tache, sang), onde (onde de choc), road (une barricade saute), wk (sang sur une façade),
// dawn (le jour se lève, mode fuite : poussière au pied des façades), over (un zombie passe le parapet), masse (coup de masse) ;
// wallhit, wallbreak, plank, tear (cloisons.js) ; les héros (heros-evenements.js) et les variantes (variantes.js) voient passer tous les événements.
// Les autres (pkill, escape, prep, clear, dead…) ne concernent que l'interface et les sons.
// sprint : coup de caméra au départ du sprint (plus doux que le bond de Volt).
// Fournit : gfxEvent (interface).
function gfxEvent(ev, S) {
  const k = ev.k;
  hfxEvent(ev, S, k);
  zvEvent(ev, S, k);
  if (k === 'sprint') G.kick = Math.max(G.kick || 0, 0.7);
  else if (k === 'shot') tirEvent(ev, S);
  else if (k === 'pellet') pelletFx(ev, S);
  else if (k === 'tracer') {
    // la traçante d'une tourelle (au plus 220 à la fois), parfois du sang au bout
    if (G.tr.length < 220) G.tr.push({ x0: ev.x0, y0: ev.y0, z0: ev.z0, x1: ev.x1, y1: ev.y1, z1: ev.z1, t: 0 });
    if (Math.random() < 0.35) bloodBurst(ev.x1, ev.y1, ev.z1, 2, false);
  } else if (k === 'allume') {
    // V4.7 : une balle incendiaire enflamme le zombie : une gerbe de flammes au point d'impact
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * 6.28,
        v = 0.6 + Math.random() * 1.4;
      emit('fire', ev.x, ev.y, ev.z, Math.cos(a) * v, 1.5 + Math.random() * 2.5, Math.sin(a) * v, 0.3 + Math.random() * 0.25, 0.22, 0.04);
    }
  } else if (k === 'boom') {
    // kind : 'M' missile, 'A' frappe aérienne (les grosses), 'm' obus de mortier, 's' éclat de fragmentation (petite), 'B' boule de feu de Braise
    const big = ev.kind === 'M' || ev.kind === 'A',
      r = ev.r;
    // V5.3 : la boule de Orbe et les météores d'un héros à l'élément choisi (ev.ec) : éclair et particules de cet élément
    hxSk(ev.ec, 'feu');
    flashAt(ev.x, ev.y + 0.4, ev.z, r * (big ? 1 : 0.8), ev.kind === 's' ? 0xffd070 : hxC(0xffa040, 'light'), big ? 0.5 : 0.35);
    const n = ev.kind === 's' ? 3 : big ? 26 : 14;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28,
        v = Math.random() * r * 2;
      emit(
        hxK('fire'),
        ev.x,
        ev.y + 0.3,
        ev.z,
        Math.cos(a) * v,
        2 + Math.random() * 4,
        Math.sin(a) * v,
        0.35 + Math.random() * 0.3,
        r * 0.16,
        0.05
      );
      if (i % 2)
        emit(
          'smoke',
          ev.x + (Math.random() - 0.5) * r,
          ev.y + 0.5,
          ev.z + (Math.random() - 0.5) * r,
          Math.random() - 0.5,
          1.5 + Math.random() * 2,
          Math.random() - 0.5,
          1.2 + Math.random(),
          r * 0.1,
          r * 0.32
        );
      if (i % 3 === 0)
        emit('dust', ev.x, ev.y + 0.2, ev.z, Math.cos(a) * v * 1.5, 4 + Math.random() * 5, Math.sin(a) * v * 1.5, 1, 0.12, 0.05);
    }
    if (ev.kind !== 's' && ev.y < 0.6)
      for (let i = 0; i < (big ? 5 : 2); i++) splatAt(ev.x + (Math.random() - 0.5) * r, 0, ev.z + (Math.random() - 0.5) * r, 1.2);
    HXE = null;
    const dd = Math.hypot(ev.x - S.p.x, ev.z - S.p.z);
    G.shake = Math.max(G.shake, (big ? 0.5 : 0.25) * Math.max(0, 1 - dd / 60));
  } else if (k === 'land') {
    // un zombie tombé (de la façade, d'un balcon) : tache où il atterrit
    if (ev.y > 1) splatAt(ev.x, ev.y, ev.z, ev.big ? 1.5 : 1);
    else if (Math.random() < 0.7) splatAt(ev.x, 0, ev.z, ev.big ? 1.6 : 1);
    if (Math.random() < 0.5) bloodBurst(ev.x, ev.y + 0.2, ev.z, 3, false);
  } else if (k === 'onde') {
    // l'onde de choc : l'anneau (decor.js), une forte secousse, de la poussière soufflée hors des façades
    G.ringT = 0;
    G.ring.visible = true;
    G.shake = 0.6;
    for (let f = 0; f < 4; f++)
      for (let i = 0; i < 10; i++) {
        const p = facePt(f, (Math.random() * 2 - 1) * (B - 0.5), 0.5);
        emit('dust', p[0], Math.random() * 14, p[1], FACES[f][0] * 8, 2, FACES[f][1] * 8, 0.9, 0.25, 0.05);
      }
  } else if (k === 'road') {
    // une route s'ouvre : sa barricade saute (éclair, fumée)
    const o = G.barr[ev.r];
    if (o) {
      flashAt(o.position.x, 1.5, o.position.z, 8, 0xffa040, 0.7);
      for (let i = 0; i < 30; i++)
        emit(
          'smoke',
          o.position.x + (Math.random() - 0.5) * 10,
          1,
          o.position.z + (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 2,
          2 + Math.random() * 3,
          (Math.random() - 0.5) * 2,
          2,
          1,
          3
        );
    }
  } else if (k === 'wk') {
    wallSplat(ev.f, ev.u + (Math.random() - 0.5), ev.y, 0.6 + Math.random() * 0.6);
  } else if (k === 'dawn' && S.mode === 'out') {
    // mode fuite, début du jour : les rideaux de fer se lèvent dans la poussière
    for (let f = 0; f < 4; f++)
      for (const u of [-5.6, 0, 5.6]) {
        const p = facePt(f, u, 0.6);
        for (let i = 0; i < 5; i++)
          emit(
            'dust',
            p[0],
            1 + Math.random() * 1.5,
            p[1],
            FACES[f][0] * (2 + Math.random() * 3) + (Math.random() - 0.5) * 2,
            1 + Math.random() * 2,
            FACES[f][1] * (2 + Math.random() * 3) + (Math.random() - 0.5) * 2,
            0.9,
            0.3,
            0.1
          );
      }
    G.shake = Math.max(G.shake, 0.35);
  } else if (k === 'over') {
    if (Math.random() < 0.5) emit('dust', ev.x, H + 1, ev.z, 0, 1, 0, 0.4, 0.15, 0.05);
  }
  // cloisons touchées / cassées, planches posées / arrachées (voir cloisons.js)
  else if (k === 'wallhit' || k === 'wallbreak' || k === 'plank' || k === 'tear') cloisonsEvent(ev, S, k);
  // un coup de masse qui porte (dans un zombie : du sang ; la caméra encaisse)
  else if (k === 'masse') {
    if (ev.n || ev.wall) {
      G.shake = Math.max(G.shake, ev.wall ? 0.36 : 0.28);
      G.mk = 1;
    }
    if (ev.n) bloodBurst(ev.x, ev.y, ev.z, 4 + ev.n * 3, true);
  }
}
