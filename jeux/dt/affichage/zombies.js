// ===================== DERNIER TOIT — l'affichage : les zombies et leurs corps =====================
// Dessinés en masse : un maillage par tenue (8 : a à h) et par pose (6 : marche w0 w1 w2, escalade c0 c1, à terre lie), soit 48 réserves,
// recopié à chaque image pour chaque zombie vivant (une matrice par zombie). Une réserve = un appel de dessin, deux pour les tenues qui
// ont des pièces lumineuses (canal g : bandes réfléchissantes, or du porteur).
// Attend des règles : S.z (tableaux des zombies : x, y, z, yaw, st, ty, va, ph, tr), S.act / S.nAct (les zombies en jeu), S.corpses,
// ZT (types : sc = taille), MAXZ. États st : 0 libre · 1 marche dehors · 2 grimpe la façade · 3 dans l'immeuble · 5 grimpe un mur d'avenue ·
// 7 dans l'escalier. ph : phase de la marche ; tr : il arrache une planche ; va : rôdeur à l'autre tenue.
// Fournit : zSet (tenue d'un type), ZTY (lu par tests/variantes.js), zombiesInit (gfxInit), zombiesFrame (gfxFrame).
const ZSETS = 'abcdefgh',
  ZPOSES = ['w0', 'w1', 'w2', 'c0', 'c1', 'lie'];
// tenue selon le type : rôdeur a/b, coureur c, colosse et mastodonte d ; sprinteur e, casseur f, porteur g, hurleur h
const ZTY = ['a', 'c', 'd', 'd', 'e', 'f', 'g', 'h'],
  zSet = (ty, va) => (ty === 0 && va ? 'b' : ZTY[ty] || 'd');
// une réserve de zombies = le maillage éclairé (canal m) et, s'il existe, celui des pièces lumineuses (canal g : bandes réfléchissantes, or du porteur), mêmes matrices
class ZPool {
  constructor(gs, cap) {
    this.a = new IPool(gs.m, K.MAT.m, cap);
    this.g = gs.g ? new IPool(gs.g, K.MAT.g, cap) : null;
  }
  begin() {
    this.a.begin();
    if (this.g) this.g.begin();
  }
  add(x, y, z, yaw, pitch, sc) {
    this.a.add(x, y, z, yaw, pitch, sc);
    if (this.g) this.g.add(x, y, z, yaw, pitch, sc);
  }
  end() {
    this.a.end();
    if (this.g) this.g.end();
  }
  get n() {
    return this.a.n;
  }
  get cap() {
    return this.a.cap;
  }
}
// petit sautillement de la marche (dehors seulement)
const pasZ = ph => Math.abs(Math.sin(ph)) * 0.04;
// les 48 réserves : vivants (MAXZ par tenue, 640 pour les variantes) et corps (560, 240 pour les variantes)
function zombiesInit() {
  // (variantes e-h : 2 à 8 % de la horde chacune, quelques dizaines à la fois au plus ; réserves plus petites, largement assez)
  G.z = {};
  for (const k of ZSETS)
    for (const p of ZPOSES) {
      const pr = prepM('z.' + k + '.' + p),
        v = k > 'd';
      G.z[k + p] = new ZPool(pr.parts[0].gs, p === 'lie' ? (v ? 240 : 560) : v ? 640 : MAXZ);
    }
}
// chaque zombie en jeu dans la réserve de sa tenue et de sa pose (escalade : penché en avant ; coureur et dedans : penché aussi),
// puis les corps (ils tombent, restent 6,5 s, puis s'enfoncent)
function zombiesFrame(S) {
  const Z = S.z;
  for (const k in G.z) G.z[k].begin();
  for (let q = 0; q < S.nAct; q++) {
    const i = S.act[q],
      st = Z.st[i];
    if (st === 0) continue;
    const ty = Z.ty[i],
      tenue = zSet(ty, Z.va[i]),
      taille = ZT[ty].sc;
    let pose,
      pitch = 0;
    if (st === 2 || st === 5) {
      pose = Math.floor(Z.ph[i] / Math.PI) % 2 ? 'c1' : 'c0';
      pitch = 0.12;
    } else {
      const f = Math.floor(Z.ph[i] / (Math.PI / 2)) % 4;
      pose = f === 0 ? 'w0' : f === 2 ? 'w2' : 'w1';
      pitch = ty === 1 || st === 3 ? 0.22 : 0;
    }
    // il arrache une planche (bras levés, il tire) ; dans l'escalier, un pas en arrière (dessiné derrière les planches)
    let reculX = 0,
      reculZ = 0;
    if (Z.tr[i] > 0) {
      pose = Math.floor(Z.tr[i] * 6) % 2 ? 'c1' : 'c0';
      pitch = 0.08;
      if (st === 7) {
        reculX = -Math.sin(Z.yaw[i]) * 0.35;
        reculZ = -Math.cos(Z.yaw[i]) * 0.35;
      }
    }
    // V4.8 : soulevé par une balle de Vent (HX.lev0 / lev1, heros-evenements.js) : il monte en 0,15 s, flotte, retombe en 0,2 s
    let leve = 0;
    if (HX && HX.lev1[i] > 0 && (st === 1 || st === 5)) {
      const t = S.t,
        a = (t - HX.lev0[i]) / 0.15,
        b = (HX.lev1[i] + 0.2 - t) / 0.2;
      if (a > 0 && b > 0) leve = 0.55 * Math.min(1, a, b) + 0.05 * Math.sin(t * 9 + i);
      else if (b <= 0) HX.lev1[i] = 0;
    }
    G.z[tenue + pose].add(
      Z.x[i] + reculX,
      Z.y[i] + (st === 1 ? pasZ(Z.ph[i]) : 0) + leve,
      Z.z[i] + reculZ,
      Z.yaw[i],
      pitch + (leve ? 0.25 : 0),
      taille
    );
  }
  for (const c of S.corpses) {
    const tenue = zSet(c.ty, c.va),
      taille = ZT[c.ty].sc;
    const sink = c.t > 6.5 ? (c.t - 6.5) * 0.35 : 0,
      pitch = c.land ? Math.PI / 2 : c.rot;
    G.z[tenue + 'lie'].add(c.x, c.y + (c.land ? 0.12 * taille : 0) - sink, c.z, c.yaw, pitch, taille);
  }
  for (const k in G.z) G.z[k].end();
}
