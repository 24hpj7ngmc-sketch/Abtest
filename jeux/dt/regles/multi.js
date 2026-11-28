// ===================== LE MULTI (V4.3) : l'instantané de l'hôte, le pas de l'invité, les actions des invités =====================
// Mode « Ils s'échappent » à plusieurs, lancé depuis le lobby (plan : MULTI.md). L'hôte fait tourner la vraie partie (step) ; chaque invité
// recopie l'instantané de l'hôte (appliqueInstantane) et ne fait avancer que son propre joueur (stepInvite). Ses coups, compétences, ultimes,
// leurres, frappes et planches passent par l'hôte sous forme d'actions (S.mActions, numérotées par S.mSeq), que l'hôte exécute (appliqueActions).
// L'instantané : une chaîne de bits, 6 bits par caractère, alphabet sûr pour JSON (A–Z a–z 0–9 - _). Contenu : la journée, la ville,
// les tourelles, les planches, un quart des cloisons (à tour de rôle), les effets des héros, les dernières explosions, puis les zombies
// proches des joueurs (place à 0,25 m, ~7 caractères) et la foule lointaine (place à 1 m, ~4 caractères), les plus proches d'abord.
// Chez l'invité (S.invite), hurtZ, wallDmg (degats.js), useHeroSkill, useHeroUlt (heros.js), useLeurre, useAir (capacites.js) et plankStep
// (zombies-dedans.js) passent par ce fichier : rien n'est fait pour de vrai, une action part vers l'hôte (sauf le retour visuel local).
// Sans multi (S.invite faux, S.nJoueurs 1), rien de ce fichier ne s'exécute : les parties restent les mêmes au chiffre près.
// Utilise : MAXZ, ZT, RANGK, HEROS, HMK, BMK, TKEYS, SLOTS, DOORS, PANELS, NAVDIRTY, PLANKS_MAX, ROADS, PLAZA, NLV, LVY, B, levelOf,
// stairParam, setPlanks, playerStep, masseHit, navFlush, zBite, gridBuild, compact, corpsesStep, addCorpse, killZ, hurtZ, outRoute,
// roadOpen, aimPoint, rayWall, hPow, uPow, heroHp, hpMul, useHeroSkill, useHeroUlt, inPlaza, clamp.
// Fournit aux autres dossiers (interface) : encodeInstantane, appliqueInstantane, stepInvite, appliqueActions, actionsInvite, reprendHote,
// hordeK ; les champs S.invite, S.nJoueurs, S.mActions, S.mSeq, S.mStat, S.mVilleMax ; les colonnes Z.fant, Z.mx, Z.my, Z.mz, Z.kt.

// ---------------------------------------------------------------- la horde à plusieurs
// S.nJoueurs (posé par l'interface chez l'hôte) : +50 % de zombies par joueur en plus (lu par startDay ; la cadence suit le total du jour)
const hordeK = S => 1 + 0.5 * (Math.min(8, Math.max(1, Math.floor(S.nJoueurs) || 1)) - 1);

// ---------------------------------------------------------------- les bits
// l'alphabet (6 bits par caractère) et sa table inverse (−1 : caractère interdit)
const MALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  MVAL = (() => {
    const t = new Int8Array(128).fill(-1);
    for (let k = 0; k < 64; k++) t[MALPHA.charCodeAt(k)] = k;
    return t;
  })(),
  MTOUR = Math.PI * 2,
  // les phases dans l'ordre de leur numéro ; les sortes d'explosions (boom) ; l'état d'un zombie → son code sur 2 bits (et retour)
  MPH = ['prep', 'day', 'clear', 'rescue', 'won', 'dead'],
  MKIND = ['b', 's', 'm', 'M', 'A', 'B'],
  MSTC = [0, 0, 2, 1, 0, 2, 0, 3],
  MCST = [1, 3, 5, 7],
  // ce que l'hôte ne garde pas des actions d'un invité (son voile, ses pièces, la boule de feu devant ses yeux, son refus)
  MSANS = { pkill: 1, brasier0: 1, refus: 1, hult: 1, eclair: 1, rafale: 1 },
  // V4.8 : les cases de l'arbre du héros (lobby) qu'un invité envoie avec sa compétence et son ultime (l'hôte les applique)
  // (V4.9 : + spA1, spA2, spB1, spB2, les cases de sa voie ; l'action porte aussi sa voie et l'élément de son arme : mVoieEl)
  MHMA = ['abRad', 'kDur', 'kWide', 'kLen', 'kPush', 'uRad', 'uDur', 'uExtra', 'uDmg', 'spA1', 'spA2', 'spB1', 'spB2'],
  // les bonus du héros à zéro (une compétence d'invité exécutée chez l'hôte n'a pas l'arbre du lobby de l'hôte)
  HM0 = (() => {
    const o = {};
    for (const k of HMK.concat(BMK)) o[k] = 0;
    return o;
  })();
// écrire n bits de v (entier, 0 ≤ v < 2^31), poids fort d'abord
function mPut(W, v, n) {
  for (let k = n - 1; k >= 0; k--) W.push((v >>> k) & 1);
}
// un nombre arrondi et ramené dans 0…2^n − 1 (NaN : 0)
function mPutQ(W, v, n) {
  const m = 2 ** n - 1;
  v = Math.round(v);
  mPut(W, v > 0 ? (v > m ? m : v) : 0, n);
}
// lire n bits (au-delà de la fin : erreur, l'instantané est rejeté)
function mGet(R, n) {
  let v = 0;
  for (let k = 0; k < n; k++) {
    if (R.i >= R.b.length) throw new Error('instantané trop court');
    v = v * 2 + R.b[R.i++];
  }
  return v;
}
// les bits → la chaîne (le dernier caractère est complété par des 0)
function mChaine(W) {
  const out = [];
  for (let k = 0; k < W.length; k += 6) {
    let v = 0;
    for (let j = 0; j < 6; j++) v = v * 2 + (W[k + j] || 0);
    out.push(MALPHA[v]);
  }
  return out.join('');
}
// la chaîne → les bits (null si un caractère n'est pas de l'alphabet)
function mBits(G) {
  const b = new Uint8Array(G.length * 6);
  for (let k = 0; k < G.length; k++) {
    const c = G.charCodeAt(k),
      v = c < 128 ? MVAL[c] : -1;
    if (v < 0) return null;
    for (let j = 0; j < 6; j++) b[k * 6 + j] = (v >> (5 - j)) & 1;
  }
  return b;
}
// les numéros de place, croissants, en écarts (code de Rice de paramètre k ; au-delà de 15 en unaire : 15 uns puis l'écart sur 12 bits)
const mRiceL = (g, k) => (g >> k < 15 ? (g >> k) + 1 + k : 27);
function mRiceK(gaps) {
  let bk = 0,
    bl = Infinity;
  for (let k = 0; k < 12; k++) {
    let l = 0;
    for (const g of gaps) l += mRiceL(g, k);
    if (l < bl) {
      bl = l;
      bk = k;
    }
  }
  return bk;
}
function mRicePut(W, g, k) {
  const q = g >> k;
  if (q < 15) {
    for (let j = 0; j < q; j++) W.push(1);
    W.push(0);
    mPut(W, g & ((1 << k) - 1), k);
  } else {
    for (let j = 0; j < 15; j++) W.push(1);
    mPut(W, g, 12);
  }
}
function mRiceGet(R, k) {
  let q = 0;
  while (q < 15 && mGet(R, 1)) q++;
  return q === 15 ? mGet(R, 12) : q * 2 ** k + mGet(R, k);
}
// places : x, z sur 10 bits à 0,25 m (−128…127,75), hauteur sur 7 bits à 0,25 m ; un angle sur n bits
const mQx = v => (v + 128) * 4,
  mDx = q => q / 4 - 128,
  mAng = (a, n) => Math.round(((((a % MTOUR) + MTOUR) % MTOUR) / MTOUR) * 2 ** n) % 2 ** n,
  mR2 = v => Math.round(v * 100) / 100,
  mR3 = v => Math.round(v * 1000) / 1000;
// un nombre venu d'un autre joueur : fini et dans [a, b], sinon def
const mNb = (v, a, b, def) => (typeof v === 'number' && isFinite(v) ? (v < a ? a : v > b ? b : v) : def);
// la vie pleine d'un zombie de type ty au jour de l'hôte (même calcul que spawnOne, avec le rang de l'hôte)
const mVie = (S, ty) => ZT[ty].hp * hpMul(S.day) * (ty === 3 ? 1 + 0.15 * (S.day - 5) : 1) * (S.mRangK || 1);

// ---------------------------------------------------------------- l'instantané, chez l'hôte
// encodeInstantane(S, invites, max) : l'état de l'hôte en une chaîne dont JSON.stringify ne dépasse jamais max caractères (chaîne vide si
// max est trop petit). invites = [{ x, y, z }] : où sont les invités (les zombies proches d'eux et de l'hôte passent en premier).
// Bilan dans S.mStat = { actifs, proches, lointains, car }.
function encodeInstantane(S, invites, max) {
  const Z = S.z,
    maxBits = Math.floor((mNb(max, 0, 1e6, 3000) - 2) * 6);
  if (!S.mBooms) S.mBooms = [];
  // l'en-tête
  const W = [];
  mPut(W, 1, 6);
  mPutQ(W, S.day, 8);
  mPut(W, Math.max(0, MPH.indexOf(S.phase)), 3);
  W.push(S.why === 'joueur' ? 1 : 0, S.endless ? 1 : 0);
  let rg = 0;
  for (let k = 1; k < RANGK.length; k++) if (Math.abs(RANGK[k] - S.rangK) < Math.abs(RANGK[rg] - S.rangK)) rg = k;
  mPut(W, rg, 2);
  mPutQ(W, (S.dayT || 0) * 10, 14);
  mPutQ(W, (S.heliT || 0) * 10, 7);
  mPutQ(W, S.city * 10, 16);
  mPutQ(W, S.P.hp * 10, 16);
  for (const v of [S.toSpawn, S.spawned, S.dayTotal, S.left, S.escaped]) mPutQ(W, v, 18);
  mPutQ(W, S.dayEsc, 16);
  mPut(W, (S.escR || 0) & 7, 3);
  const ba = S.bossAt.slice(0, 7);
  mPut(W, ba.length, 3);
  for (const v of ba) mPutQ(W, v, 18);
  mPutQ(W, S.P.mur, 2);
  mPutQ(W, S.P.murH * 10, 7);
  W.push(S.flood > 0 ? 1 : 0);
  // les parties facultatives, par ordre d'importance : tourelles, planches, effets des héros, explosions, cloisons (un quart)
  const secs = [mSecTourelles(S), mSecPortes(), mSecEffets(S), mSecBooms(S), mSecMurs(S)];
  if (W.length + secs.length + 32 > maxBits) {
    S.mStat = { actifs: S.nAct, proches: 0, lointains: 0, car: 0 };
    return '';
  }
  let used = W.length + secs.length + 32;
  const flags = secs.map(s => {
    if (used + s.length > maxBits) return 0;
    used += s.length;
    return 1;
  });
  for (const f of flags) W.push(f);
  secs.forEach((s, k) => {
    if (flags[k]) for (const b of s) W.push(b);
  });
  // les zombies : du plus proche d'un joueur au plus loin (la hauteur compte double : les étages)
  const anc = [[S.p.x, S.p.y, S.p.z]];
  if (Array.isArray(invites))
    for (const q of invites.slice(0, 16)) if (q && isFinite(q.x) && isFinite(q.z)) anc.push([+q.x, mNb(q.y, -10, 200, 0), +q.z]);
  const ord = [],
    dist = new Float64Array(MAXZ);
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (Z.st[i] === 0) continue;
    let d = Infinity;
    for (const a of anc) {
      const dx = Z.x[i] - a[0],
        dy = Z.y[i] - a[1],
        dz = Z.z[i] - a[2],
        e = dx * dx + dz * dz + 4 * dy * dy;
      if (e < d) d = e;
    }
    dist[i] = d;
    ord.push(i);
  }
  ord.sort((a, b) => dist[a] - dist[b] || a - b);
  // combien de proches (au plus 65 % de la place, plus s'il en reste), combien de lointains (estimation : 42 et 25 bits) ; puis on retire
  // jusqu'à ce que ça tienne (taille exacte calculée sans écrire : mTailleZ), et on écrit une seule fois
  const N = ord.length,
    Bz = maxBits - W.length,
    cN = 42,
    cF = 25;
  let Kn = N,
    Kf = 0;
  if (N * cN > Bz) {
    Kn = Math.min(N, Math.max(Math.floor((0.65 * Bz) / cN), Math.floor((Bz - N * cF) / (cN - cF))));
    Kf = Math.max(0, Math.min(N - Kn, Math.floor((Bz - Kn * cN) / cF)));
  }
  for (;;) {
    const over = mTailleZ(S, ord.slice(0, Kn), true) + mTailleZ(S, ord.slice(Kn, Kn + Kf), false) - Bz;
    if (over <= 0) break;
    if (Kf > 0) Kf = Math.max(0, Kf - Math.ceil(over / 21) - 1);
    else Kn = Math.max(0, Kn - Math.ceil(over / 37) - 1);
  }
  const W0 = W.length;
  mSecZombies(W, S, ord.slice(0, Kn), true);
  mSecZombies(W, S, ord.slice(Kn, Kn + Kf), false);
  // garde-fou (ne devrait jamais servir) : trop long, on n'envoie aucun zombie
  if (W.length > maxBits) {
    W.length = W0;
    Kn = Kf = 0;
    mPut(W, 0, 32);
  }
  const G = mChaine(W);
  S.mStat = { actifs: N, proches: Kn, lointains: Kf, car: G.length };
  return G;
}
// les tourelles : place (6 bits), type, orientation, inclinaison, tire en ce moment
function mSecTourelles(S) {
  const W = [],
    L = S.tur.slice(0, 63);
  mPut(W, L.length, 6);
  for (const t of L) {
    mPut(W, t.slot & 63, 6);
    mPut(W, Math.max(0, TKEYS.indexOf(t.ty)), 2);
    mPut(W, mAng(t.ry, 6), 6);
    mPutQ(W, ((t.rp + Math.PI / 2) / Math.PI) * 31, 5);
    W.push(S.phase === 'day' && t.ti >= 0 && S.z.st[t.ti] !== 0 ? 1 : 0);
  }
  return W;
}
// les planches de chaque porte (3 bits)
function mSecPortes() {
  const W = [];
  for (const d of DOORS) mPutQ(W, d.planks, 3);
  return W;
}
// un quart des cloisons à chaque instantané (à tour de rôle : l'invité a tout en 0,4 s) : 1 = cassée
function mSecMurs(S) {
  const W = [],
    CH = Math.ceil(PANELS.length / 4),
    c = (S.mMurC = ((S.mMurC || 0) + 1) & 3);
  mPut(W, c, 2);
  for (let k = c * CH; k < Math.min(PANELS.length, (c + 1) * CH); k++) W.push(PANELS[k].dead ? 1 : 0);
  return W;
}
// ce que l'affichage dessine des héros : leurre, remparts, ronciers, gardiens, orages (le Déluge est dans l'en-tête)
function mSecEffets(S) {
  const W = [],
    P2 = (x, z) => {
      mPutQ(W, mQx(x), 10);
      mPutQ(W, mQx(z), 10);
    },
    dc = S.decoy;
  W.push(dc ? 1 : 0);
  if (dc) {
    P2(dc.x, dc.z);
    mPutQ(W, dc.R, 7);
    mPutQ(W, dc.t * 4, 7);
  }
  const R = S.ramparts.slice(0, 7);
  mPut(W, R.length, 3);
  for (const w of R) {
    mPut(W, (w.id || 0) & 255, 8);
    P2(w.x, w.z);
    mPut(W, mAng(Math.atan2(w.nx, w.nz), 6), 6);
    mPutQ(W, w.half * 4, 6);
    mPutQ(W, w.t * 2, 7);
  }
  const Th = S.thorns.slice(0, 7);
  mPut(W, Th.length, 3);
  for (const th of Th) {
    P2(th.x, th.z);
    mPutQ(W, th.y * 4, 7);
    mPutQ(W, th.r * 4, 6);
    mPutQ(W, th.t * 2, 7);
  }
  const Gd = S.guards.slice(0, 7);
  mPut(W, Gd.length, 3);
  for (const g of Gd) {
    P2(g.x, g.z);
    mPutQ(W, g.t * 2, 7);
  }
  const St = S.storms.slice(0, 3);
  mPut(W, St.length, 2);
  for (const o of St) {
    P2(o.x, o.z);
    mPutQ(W, o.y * 4, 7);
    mPutQ(W, o.r, 6);
    mPutQ(W, o.t * 2, 7);
  }
  return W;
}
// les explosions des 0,6 dernières secondes (7 au plus, numérotées : l'invité ne rejoue que celles qu'il n'a pas vues)
function mSecBooms(S) {
  const W = [];
  S.mBooms = S.mBooms.filter(b => S.t - b.t < 0.6);
  const L = S.mBooms.slice(-7);
  mPut(W, L.length, 3);
  for (const b of L) {
    mPut(W, b.id & 255, 8);
    mPutQ(W, mQx(b.x), 10);
    mPutQ(W, mQx(b.z), 10);
    mPutQ(W, b.y * 4, 7);
    mPutQ(W, b.r, 5);
    mPut(W, Math.max(0, MKIND.indexOf(b.kind)), 3);
  }
  return W;
}
// une liste de zombies (rangés par place croissante, en écarts), ajoutée à W : proches (pres = true) ou lointains.
// Proche : génération (4 bits), x, z (0,25 m), état, hauteur, type, vie (pleine, ou en 16es), orientation (16es de tour), effets.
// Lointain : x, z (1 m), hauteur et état s'il n'est pas au sol dehors, type.
// mBitsZ : les bits d'un zombie sans sa place (doit suivre mSecZombies) ; mTailleZ : la taille exacte d'une liste
function mBitsZ(Z, i, pres) {
  const sc = MSTC[Z.st[i]];
  if (!pres) return 19 + (sc === 0 && Z.y[i] <= 0.25 ? 1 : 9);
  const fx = Z.burn[i] > 0 || Z.psn[i] > 0 || Z.slow[i] > 0 || Z.hst[i] > 0;
  return 33 + (sc !== 0 ? 7 : Z.y[i] > 0.12 ? 8 : 1) + (Z.hp[i] / (Z.hm[i] || 1) >= 0.999 ? 1 : 5) + (fx ? 5 : 1);
}
function mTailleZ(S, L, pres) {
  const s = L.slice().sort((a, b) => a - b),
    gaps = s.map((v, k) => v - (k ? s[k - 1] : -1) - 1),
    k = mRiceK(gaps);
  let n = 16;
  for (let q = 0; q < s.length; q++) n += mRiceL(gaps[q], k) + mBitsZ(S.z, s[q], pres);
  return n;
}
function mSecZombies(W, S, L, pres) {
  const Z = S.z,
    s = L.slice().sort((a, b) => a - b),
    gaps = s.map((v, k) => v - (k ? s[k - 1] : -1) - 1),
    k = mRiceK(gaps);
  mPut(W, s.length, 12);
  mPut(W, k, 4);
  for (let n = 0; n < s.length; n++) {
    const i = s[n],
      sc = MSTC[Z.st[i]];
    mRicePut(W, gaps[n], k);
    if (pres) {
      mPut(W, Z.gen[i] & 15, 4);
      mPutQ(W, mQx(Z.x[i]), 10);
      mPutQ(W, mQx(Z.z[i]), 10);
      mPut(W, sc, 2);
      if (sc !== 0) mPutQ(W, Z.y[i] * 4, 7);
      else if (Z.y[i] > 0.12) {
        W.push(1);
        mPutQ(W, Z.y[i] * 4, 7);
      } else W.push(0);
      mPut(W, Z.ty[i] & 7, 3);
      const f = Z.hp[i] / (Z.hm[i] || 1);
      if (f >= 0.999) W.push(0);
      else {
        W.push(1);
        mPut(W, clamp(Math.ceil(f * 16) - 1, 0, 15), 4);
      }
      mPut(W, mAng(Z.yaw[i], 4), 4);
      const fx = (Z.burn[i] > 0 ? 1 : 0) | (Z.psn[i] > 0 ? 2 : 0) | (Z.slow[i] > 0 ? 4 : 0) | (Z.hst[i] > 0 ? 8 : 0);
      W.push(fx ? 1 : 0);
      if (fx) mPut(W, fx, 4);
    } else {
      mPutQ(W, Z.x[i] + 128, 8);
      mPutQ(W, Z.z[i] + 128, 8);
      if (sc === 0 && Z.y[i] <= 0.25) W.push(0);
      else {
        W.push(1);
        mPut(W, sc, 2);
        mPutQ(W, Z.y[i] * 2, 6);
      }
      mPut(W, Z.ty[i] & 7, 3);
    }
  }
}

// ---------------------------------------------------------------- l'instantané, chez l'invité
// lire la chaîne (rien n'est touché tant qu'elle n'est pas lue en entier sans erreur) ; null si elle n'est pas valable
function mLit(G) {
  const b = mBits(G);
  if (!b) return null;
  const R = { b, i: 0 },
    g = n => mGet(R, n),
    D = {};
  if (g(6) !== 1) return null;
  D.day = g(8);
  const ph = g(3);
  if (ph >= MPH.length || D.day < 1) return null;
  D.phase = MPH[ph];
  D.why = g(1) ? 'joueur' : 'ville';
  D.endless = !!g(1);
  D.rang = g(2);
  D.dayT = g(14) / 10;
  D.heliT = g(7) / 10;
  D.city = g(16) / 10;
  D.cityMax = g(16) / 10;
  D.toSpawn = g(18);
  D.spawned = g(18);
  D.dayTotal = g(18);
  D.left = g(18);
  D.escaped = g(18);
  D.dayEsc = g(16);
  D.escR = g(3);
  D.bossAt = [];
  for (let n = g(3); n > 0; n--) D.bossAt.push(g(18));
  D.mur = g(2);
  D.murH = g(7) / 10;
  D.flood = g(1);
  const fl = [g(1), g(1), g(1), g(1), g(1)],
    P2 = () => [mDx(g(10)), mDx(g(10))];
  if (fl[0]) {
    D.tur = [];
    for (let n = g(6); n > 0; n--) {
      const slot = g(6),
        ty = TKEYS[g(2)],
        ry = (g(6) / 64) * MTOUR,
        rp = (g(5) / 31) * Math.PI - Math.PI / 2,
        tire = g(1);
      if (slot >= SLOTS.length) return null;
      D.tur.push({ slot, ty, ry, rp, tire });
    }
  }
  if (fl[1]) {
    D.portes = [];
    for (let n = 0; n < DOORS.length; n++) D.portes.push(Math.min(PLANKS_MAX, g(3)));
  }
  if (fl[2]) {
    D.decoy = null;
    if (g(1)) {
      const p = P2();
      D.decoy = { x: p[0], z: p[1], R: g(7), t: g(7) / 4 };
    }
    D.ramparts = [];
    for (let n = g(3); n > 0; n--) {
      const id = g(8),
        p = P2(),
        a = (g(6) / 64) * MTOUR;
      D.ramparts.push({ id, x: p[0], z: p[1], nx: Math.sin(a), nz: Math.cos(a), half: g(6) / 4, t: g(7) / 2 });
    }
    D.thorns = [];
    for (let n = g(3); n > 0; n--) {
      const p = P2();
      D.thorns.push({ x: p[0], z: p[1], y: g(7) / 4, r: g(6) / 4, t: g(7) / 2 });
    }
    D.guards = [];
    for (let n = g(3); n > 0; n--) {
      const p = P2();
      D.guards.push({ x: p[0], z: p[1], t: g(7) / 2 });
    }
    D.storms = [];
    for (let n = g(2); n > 0; n--) {
      const p = P2();
      D.storms.push({ x: p[0], z: p[1], y: g(7) / 4, r: g(6), t: g(7) / 2 });
    }
  }
  if (fl[3]) {
    D.booms = [];
    for (let n = g(3); n > 0; n--) {
      const id = g(8),
        p = P2(),
        y = g(7) / 4,
        r = g(5),
        kind = MKIND[g(3)] || 'b';
      D.booms.push({ id, x: p[0], z: p[1], y, r, kind });
    }
  }
  if (fl[4]) {
    const CH = Math.ceil(PANELS.length / 4),
      c = g(2),
      a = c * CH,
      e = Math.min(PANELS.length, a + CH);
    D.murs = { a, v: [] };
    for (let k = a; k < e; k++) D.murs.v.push(g(1));
  }
  // les zombies : proches puis lointains ; une place ne peut pas être dans les deux listes
  const pris = new Uint8Array(MAXZ);
  for (const pres of [1, 0]) {
    const L = [],
      n = g(12),
      k = g(4);
    let prev = -1;
    for (let q = 0; q < n; q++) {
      const s = prev + 1 + mRiceGet(R, k);
      if (s >= MAXZ || pris[s]) return null;
      pris[s] = 1;
      prev = s;
      const e = { s };
      if (pres) {
        e.g = g(4);
        e.x = mDx(g(10));
        e.z = mDx(g(10));
        const sc = g(2);
        e.st = MCST[sc];
        e.y = sc !== 0 || g(1) ? g(7) / 4 : 0;
        e.ty = g(3);
        e.hp = g(1) ? (g(4) + 1) / 16 : 1;
        e.yaw = (g(4) / 16) * MTOUR;
        e.fx = g(1) ? g(4) : 0;
      } else {
        e.x = g(8) - 128;
        e.z = g(8) - 128;
        if (g(1)) {
          e.st = MCST[g(2)];
          e.y = g(6) / 2;
        } else {
          e.st = 1;
          e.y = 0;
        }
        e.ty = g(3);
      }
      L.push(e);
    }
    if (pres) D.proches = L;
    else D.loin = L;
  }
  return D;
}
// appliqueInstantane(S, G) chez l'invité : met à jour la journée, la ville, les tourelles, les planches, les cloisons, les effets et les zombies
// (proches : actifs, avec une cible Z.mx/my/mz vers laquelle ils glissent ; lointains : fantômes, Z.fant = 1). Renvoie false (et ne touche
// à rien) si G n'est pas un instantané valable. Pousse les événements que step aurait poussés (aube, jour tenu, fin, explosions…).
function appliqueInstantane(S, G) {
  if (typeof G !== 'string' || !G.length || G.length > 60000) return false;
  let D = null;
  try {
    D = mLit(G);
  } catch (e) {
    D = null;
  }
  if (!D) return false;
  mApplique(S, D);
  return true;
}
function mApplique(S, D) {
  const Z = S.z,
    old = S.phase,
    premier = !S.mVu,
    escOld = S.escaped;
  S.mVu = 1;
  // la journée et la ville
  S.day = D.day;
  S.phase = D.phase;
  S.why = D.why;
  S.endless = D.endless;
  S.mRangK = RANGK[D.rang] || 1;
  S.dayT = D.dayT;
  S.heliT = D.heliT;
  S.city = D.city;
  S.mVilleMax = D.cityMax;
  S.toSpawn = D.toSpawn;
  S.spawned = D.spawned;
  S.dayTotal = D.dayTotal;
  S.left = D.left;
  S.escaped = D.escaped;
  S.dayEsc = D.dayEsc;
  S.bossAt = D.bossAt;
  S.P.mur = D.mur;
  S.P.murH = D.murH;
  S.flood = D.flood ? Math.max(S.flood, 0.5) : 0;
  // les changements de phase : les événements que l'hôte a eus (chaque joueur touche sa prime)
  if (!premier && S.escaped > escOld) S.ev.push({ k: 'escape', r: D.escR, ty: 0 });
  if (S.phase !== old) {
    const d = S.day;
    if (S.phase === 'day') {
      if (!premier) for (let r = 0; r < ROADS.length; r++) if (ROADS[r].day === d) S.ev.push({ k: 'road', r });
      S.ev.push({ k: 'dawn', d });
    } else if (S.phase === 'clear' && old === 'day') {
      const bonus = Math.round(15 * d * S.P.dayB);
      S.save.cash = (S.save.cash || 0) + bonus;
      S.runCash += bonus;
      S.save.bestF = Math.max(S.save.bestF || 0, d);
      S.ev.push({ k: 'clear', d, bonus });
    } else if (S.phase === 'prep' && (old === 'clear' || old === 'day' || old === 'rescue')) {
      S.p.hpMax = heroHp(S);
      S.p.hp = S.p.hpMax;
      S.ev.push({ k: 'prep', d });
    } else if (S.phase === 'rescue') S.ev.push({ k: 'heli' });
    else if (S.phase === 'won') {
      S.save.won = (S.save.won || 0) + 1;
      S.ev.push({ k: 'won' });
    } else if (S.phase === 'dead') {
      S.p.down = 0;
      S.p.dead = true;
      S.ev.push({ k: 'dead' });
    }
  }
  // les tourelles de l'hôte (objets gardés d'un instantané à l'autre, complets : ils servent tels quels si l'invité devient hôte)
  if (D.tur) {
    const avant = {};
    for (const t of S.tur) avant[t.slot] = t;
    S.tur = D.tur.map(q => {
      const s = SLOTS[q.slot],
        t =
          avant[q.slot] && avant[q.slot].ty === q.ty
            ? avant[q.slot]
            : { slot: q.slot, ty: q.ty, cd: 0, ti: -1, tg: 0, ry: q.ry, rp: 0, flash: 0, beams: [], flame: 0, ont: 0, re: 0 };
      t.x = s.x;
      t.y = (s.k === 'mur' ? S.P.murH : s.y) + (q.ty === 'mo' ? 0.7 : 1.05);
      t.z = s.z;
      t.k = s.k;
      t.f = s.f;
      t.ry = q.ry;
      t.rp = q.rp;
      t.mTire = q.tire;
      t.ti = q.tire ? 0 : -1;
      t.flame = q.tire && q.ty === 'fl' ? 1 : 0;
      t.beams.length = 0;
      if (q.tire && q.ty === 'la') {
        const cp = Math.cos(q.rp);
        t.beams.push([t.x + Math.sin(q.ry) * cp * 25, t.y + Math.sin(q.rp) * 25, t.z + Math.cos(q.ry) * cp * 25]);
      }
      return t;
    });
  }
  // les planches et les cloisons de l'hôte (la marche des niveaux touchés sera recalculée par navFlush)
  if (D.portes) {
    let chg = 0;
    D.portes.forEach((n, k) => {
      if (DOORS[k].planks !== n) {
        setPlanks(DOORS[k], n);
        chg = 1;
      }
    });
    if (chg) S.plankVer++;
  }
  if (D.murs) {
    let chg = 0;
    D.murs.v.forEach((v, k) => {
      const o = PANELS[D.murs.a + k];
      if (!o.dead === !v) return;
      o.dead = v;
      o.hp = v ? 0 : o.hp0;
      if (o.tier === 'bas' || o.tier === 'milieu') NAVDIRTY[o.lv] = 1;
      chg = 1;
    });
    if (chg) S.wallVer++;
  }
  // les effets des héros (mêmes objets d'un instantané à l'autre, pour que l'affichage garde leur âge)
  if (D.ramparts) {
    S.decoy = D.decoy;
    S.ramparts = D.ramparts.map(q => {
      const w = S.ramparts.find(o => o.id === q.id) || { hp: 450, hp0: 450 };
      return Object.assign(w, q);
    });
    const garde = (avant, L, defs) =>
      L.map(q => {
        const o = avant.find(a => !a.mPris && Math.abs(a.x - q.x) < 0.6 && Math.abs(a.z - q.z) < 0.6) || Object.assign({}, defs);
        o.mPris = 1;
        return Object.assign(o, q);
      }).map(o => {
        delete o.mPris;
        return o;
      });
    S.thorns = garde(S.thorns, D.thorns, { dps: 22, pulse: 0 });
    S.guards = garde(S.guards, D.guards, { cd: 0, pw: 1 });
    S.storms = garde(S.storms, D.storms, { zap: 0, pw: 1 });
  }
  // les explosions qu'on n'a pas encore vues
  if (D.booms) {
    const vu = S.mBoomVu || (S.mBoomVu = new Float64Array(256).fill(-1e9));
    for (const b of D.booms) {
      if (S.t - vu[b.id] < 1) continue;
      vu[b.id] = S.t;
      S.ev.push({ k: 'boom', x: b.x, y: b.y, z: b.z, r: b.r, kind: b.kind });
    }
  }
  // les zombies
  const vus = S.mPris || (S.mPris = new Uint8Array(MAXZ)),
    etaitProche = S.mProche || (S.mProche = new Uint8Array(MAXZ));
  vus.fill(0);
  const place = (e, i, pres) => {
    const neuf = Z.st[i] === 0 || Z.ty[i] !== e.ty || (pres && !Z.fant[i] && (Z.gen[i] & 15) !== e.g),
      hm = mVie(S, e.ty);
    if (neuf) {
      Z.hp[i] = (pres ? e.hp : 1) * hm;
      Z.ph[i] = (i * 1.7) % 6.28;
      Z.va[i] = (i ^ (pres ? e.g : 0)) & 1;
      Z.burn[i] = Z.psn[i] = Z.slow[i] = Z.hst[i] = Z.root[i] = Z.tr[i] = 0;
      Z.yaw[i] = pres ? e.yaw : Math.atan2(e.x, e.z);
      // une variante jamais vue, un mastodonte : les annonces de l'hôte
      if (e.ty >= 4 && !(S.seenTy & (1 << e.ty))) {
        S.seenTy = (S.seenTy || 0) | (1 << e.ty);
        S.ev.push({ k: 'variant', ty: e.ty });
      }
      if (e.ty === 3 && !premier) S.ev.push({ k: 'boss', r: 0 });
    } else if (pres) Z.hp[i] = Math.min(Z.hp[i], e.hp * hm);
    Z.hm[i] = hm;
    Z.ty[i] = e.ty;
    Z.st[i] = e.st;
    Z.fant[i] = pres ? 0 : 1;
    if (pres) Z.gen[i] = e.g;
    Z.mx[i] = e.x;
    Z.my[i] = e.y;
    Z.mz[i] = e.z;
    if (neuf || Math.abs(Z.x[i] - e.x) + Math.abs(Z.z[i] - e.z) + Math.abs(Z.y[i] - e.y) > 8) {
      Z.x[i] = e.x;
      Z.y[i] = e.y;
      Z.z[i] = e.z;
    }
    Z.lv[i] = e.st === 7 ? Math.min(NLV - 1, levelOf(e.y)) : levelOf(e.y);
    if (pres) {
      Z.yaw[i] = e.yaw;
      if (e.fx & 1) Z.burn[i] = Math.max(Z.burn[i], 0.3);
      if (e.fx & 2) Z.psn[i] = Math.max(Z.psn[i], 0.3);
      if (e.fx & 4) Z.slow[i] = Math.max(Z.slow[i], 0.3);
      if (e.fx & 8) Z.hst[i] = Math.max(Z.hst[i], 0.3);
    }
    vus[i] = 1;
  };
  for (const e of D.proches) {
    // tué ici il y a moins de 1,5 s : l'hôte ne le sait pas encore, il reste éteint
    if (Z.kt[e.s] > S.t && (Z.gen[e.s] & 15) === e.g) continue;
    place(e, e.s, true);
  }
  for (const e of D.loin) if (!(Z.kt[e.s] > S.t)) place(e, e.s, false);
  // ceux qui ne sont plus là s'éteignent ; un proche qui disparaît loin du bout des rues est mort chez l'hôte : son cadavre tombe
  for (let k = 0; k < S.nAct; k++) {
    const i = S.act[k];
    if (vus[i] || Z.st[i] === 0) continue;
    if (etaitProche[i] && Math.hypot(Z.x[i], Z.z[i]) < 80)
      addCorpse(S, Z.x[i], Z.y[i] + 0.02, Z.z[i], Z.yaw[i], 0, 0, 0, Z.ty[i], Z.va[i], Z.st[i]);
    Z.st[i] = 0;
    Z.fant[i] = 0;
  }
  S.nAct = 0;
  S.free.length = 0;
  for (let i = MAXZ - 1; i >= 0; i--) {
    etaitProche[i] = vus[i] && !Z.fant[i] ? 1 : 0;
    if (!vus[i]) S.free.push(i);
  }
  for (let i = 0; i < MAXZ; i++) if (vus[i]) S.act[S.nAct++] = i;
  gridBuild(S);
}

// ---------------------------------------------------------------- le pas de l'invité
// stepInvite(S, dt, inp) : comme step, mais sans zombies ni tourelles à faire vivre : son joueur (déplacement, tir), le coup de masse,
// les zombies qui glissent vers leur cible (Z.mx/my/mz), les morsures des proches dans l'immeuble, les effets qui s'éteignent.
function stepInvite(S, dt, inp) {
  if (dt > 0.05) dt = 0.05;
  S.t += dt;
  if (S.phase === 'dead' || S.phase === 'won') return;
  const Z = S.z;
  playerStep(S, dt, inp);
  if (S.swing > 0) {
    S.swing -= dt;
    if (!S.swingHit && S.swingT - S.swing >= S.swingT * 0.35) {
      S.swingHit = 1;
      masseHit(S);
    }
    if (S.swing < 0) S.swing = 0;
  }
  navFlush();
  if (S.phase === 'day') {
    S.dayT += dt;
    S.jeuT += dt;
    S.misCd = Math.max(0, S.misCd - dt);
    S.leuCd = Math.max(0, S.leuCd - dt);
    S.airCd = Math.max(0, S.airCd - dt);
  }
  // les zombies glissent vers la place que l'hôte leur donne (en ~0,1 s) ; orientation : le sens de la marche
  const k = Math.min(1, dt * 10),
    FX = [Z.burn, Z.psn, Z.slow, Z.hst, Z.root];
  for (let q = 0; q < S.nAct; q++) {
    const i = S.act[q],
      st = Z.st[i];
    if (st === 0) continue;
    for (const c of FX) if (c[i] > 0) c[i] = Math.max(0, c[i] - dt);
    const dx = Z.mx[i] - Z.x[i],
      dy = Z.my[i] - Z.y[i],
      dz = Z.mz[i] - Z.z[i],
      mv = Math.hypot(dx, dz) * k;
    Z.x[i] += dx * k;
    Z.y[i] += dy * k;
    Z.z[i] += dz * k;
    if (dx * dx + dz * dz > 0.0025) Z.yaw[i] = Math.atan2(dx, dz);
    Z.ph[i] += st === 2 || st === 5 ? dt * 3.2 : mv * 2.2;
    if (!Z.fant[i] && (st === 3 || st === 7)) zBite(S, i, dt);
  }
  // les effets de l'hôte s'éteignent ici aussi (l'instantané suivant les remet)
  if (S.decoy && (S.decoy.t -= dt) <= 0) S.decoy = null;
  if (S.flood > 0) S.flood = Math.max(0, S.flood - dt);
  for (const th of S.thorns) if ((th.pulse -= dt) <= 0) th.pulse = 1;
  for (const L of [S.thorns, S.guards, S.storms, S.ramparts]) for (const o of L) o.t -= dt;
  S.thorns = S.thorns.filter(o => o.t > 0);
  S.guards = S.guards.filter(o => o.t > 0);
  S.storms = S.storms.filter(o => o.t > 0);
  S.ramparts = S.ramparts.filter(o => o.t > 0);
  // les mitrailleuses de l'hôte qui tirent : une traçante toutes les 0,12 s (son et image)
  for (const t of S.tur) {
    t.flash = Math.max(0, t.flash - dt);
    if (!t.mTire || t.ty !== 'mg') continue;
    t.cd -= dt;
    if (t.cd > 0) continue;
    t.cd = 0.12;
    t.flash = 0.06;
    const cp = Math.cos(t.rp);
    S.ev.push({
      k: 'tracer',
      x0: t.x,
      y0: t.y,
      z0: t.z,
      x1: t.x + Math.sin(t.ry) * cp * 30,
      y1: t.y + Math.sin(t.rp) * 30,
      z1: t.z + Math.cos(t.ry) * cp * 30,
      ty: 'mg'
    });
  }
  // les actions trop vieilles (plus de 3 s : l'hôte les a vues ou ne les verra plus)
  while (S.mActions.length && S.t - S.mActions[0].t > 3) S.mActions.shift();
  gridBuild(S);
  compact(S);
  corpsesStep(S, dt);
}

// ---------------------------------------------------------------- les gestes de l'invité → des actions
// une action de plus (seq croissant ; a.t : son moment, gardé hors du JSON) ; les 16 dernières sont gardées
function actionInvite(S, a) {
  a[1] = ++S.mSeq;
  a.t = S.t;
  S.mActions.push(a);
  if (S.mActions.length > 16) S.mActions.shift();
  return a;
}
// actionsInvite(S, max) : les dernières actions à publier (8 au plus, les plus récentes, JSON.stringify ≤ max caractères), par seq croissant.
// Une action publiée est close (a.pub) : un coup qui suit en ouvre une autre (l'hôte ne relit pas une action déjà vue)
function actionsInvite(S, max) {
  const out = [];
  let n = 2;
  max = mNb(max, 0, 1e6, 2000);
  for (let k = S.mActions.length - 1; k >= 0 && out.length < 8; k--) {
    const l = JSON.stringify(S.mActions[k]).length + 1;
    if (n + l > max) break;
    n += l;
    S.mActions[k].pub = 1;
    out.unshift(S.mActions[k]);
  }
  return out;
}
// hurtZ chez l'invité : la vie baisse ici (retour visuel), le coup part vers l'hôte (action 'h', un zombie = place, génération, dégâts,
// effets : 1 brûle, 2 empoisonné, 4 ralenti, 8 soulevé (V4.8, balle de Vent : S.mLeve), posés juste avant par le passif du héros ou
// l'élément de l'arme). À 0, il meurt ici (killZ : son argent, son tué,
// son cadavre) et reste éteint 1,5 s même si l'hôte ne l'a pas encore vu mourir. Les fantômes ne se touchent pas.
function hurtInvite(S, i, dmg, src) {
  const Z = S.z;
  if (Z.st[i] === 0 || Z.hp[i] <= 0 || Z.fant[i] || !(dmg > 0)) return false;
  const fx = (Z.burn[i] > 1 ? 1 : 0) | (Z.psn[i] > 1 ? 2 : 0) | (Z.slow[i] > 1 ? 4 : 0) | (S.mLeve === i ? 8 : 0);
  S.mLeve = -1;
  let a = S.mActions[S.mActions.length - 1];
  // les coups d'un même pas vont dans la même action (40 zombies au plus, pas encore publiée) ; un zombie déjà touché : on additionne
  if (!a || a[0] !== 'h' || a.t !== S.t || a.pub || a.length >= 2 + 4 * 40) a = actionInvite(S, ['h', 0]);
  let k = 2;
  while (k < a.length && a[k] !== i) k += 4;
  if (k < a.length) {
    a[k + 2] = mR2(a[k + 2] + dmg);
    a[k + 3] |= fx;
  } else a.push(i, Z.gen[i] & 15, mR2(dmg), fx);
  Z.hp[i] -= dmg;
  if (Z.hp[i] <= 0) {
    killZ(S, i, src);
    Z.kt[i] = S.t + 1.5;
    return true;
  }
  return false;
}
// la pose du joueur pour une action : x, y, z, yaw, pitch
const mPose = p => [mR2(p.x), mR2(p.y), mR2(p.z), mR3(p.yaw), mR3(p.pitch)];
// la compétence chez l'invité (appelée par useHeroSkill, après ses conditions) : l'action 'c' (pose de départ, héros, puissance) ;
// ici seulement le retour : le bond de Volt (le joueur bouge, l'hôte fait les dégâts), le soin d'Ondine, les effets à l'endroit visé
function skillInvite(S, h, cd) {
  const p = S.p,
    m = S.hm,
    a = aimPoint(S, 160);
  if (h === 'terre' && a[1] > 0.8) {
    S.ev.push({ k: 'refus', why: 'Vise la rue' });
    return false;
  }
  actionInvite(S, ['c', 0].concat(mPose(p), [h, mR3(hPow(S)), MHMA.map(k => mR2(m[k] || 0)), S.voie || '', S.elArme || '', S.elHeros || '']));
  if (h === 'elec') {
    const fx = -Math.sin(p.yaw),
      fz = -Math.cos(p.yaw),
      dash = Math.max(0, rayWall(p.x, p.y + 0.55, p.z, fx, 0, fz, 14 + m.kLen) - 0.45),
      x0 = p.x,
      z0 = p.z;
    p.x += fx * dash;
    p.z += fz * dash;
    p.vx = fx * 7;
    p.vz = fz * 7;
    p.inv = 0.6;
    S.ev.push({ k: 'eclair', x0, y: p.y + 1, z0, x1: p.x, z1: p.z });
  } else if (h === 'vent') rafale(S, m, false);
  else if (h === 'feu') S.ev.push({ k: 'brasier0' });
  else if (h === 'eau') {
    if (m.kHeal) p.hp = Math.min(p.hpMax, p.hp + m.kHeal * soinK(S));
    // V4.9 : Soigneuse, le bouclier est sur l'invité : posé ici
    if (voieDe(S, 'eau', 'a') && m.spA2 > 0) bouclier(S);
    S.ev.push({ k: 'maree', x: a[0], y: a[1], z: a[2], r: 8 });
  } else if (h === 'bois' && voieDe(S, 'bois', 'b')) plonge(S, a, m, hPow(S), true, false);
  else if (h === 'bois') S.ev.push({ k: 'ronces', x: a[0], y: a[1], z: a[2], r: 5.2 + m.abRad });
  else if (h === 'terre') {
    const l = Math.hypot(a[0], a[2]) || 1;
    S.ev.push({
      k: 'rempart',
      x: a[0],
      z: a[2],
      nx: a[0] / l,
      nz: a[2] / l,
      half: 4.5 + m.kWide + (voieDe(S, 'terre', 'a') ? 2 + m.spA1 : 0)
    });
  }
  S.hab = cd;
  return true;
}
// l'ultime chez l'invité (appelé par useHeroUlt, après ses conditions) : l'action 'u' ; ici, le voile et le soin du Déluge
function ultInvite(S, h) {
  S.ult = 0;
  actionInvite(S, ['u', 0].concat(mPose(S.p), [h, mR3(uPow(S)), MHMA.map(k => mR2(S.hm[k] || 0)), S.voie || '', S.elArme || '', S.elHeros || '']));
  if (h === 'eau') S.p.hp = S.p.hpMax;
  // V4.8 : le trait du Tir perçant, tout de suite (les dégâts sont chez l'hôte)
  else if (h === 'vent') {
    const l = lignePercant(S.p);
    S.ev.push({ k: 'percant', x0: l[0], y0: l[1], z0: l[2], x1: l[3], y1: l[4], z1: l[5], w: 1.5 + (S.hm.uRad || 0) });
  }
  S.ev.push({ k: 'hult', h, el: teinteDe(S, h) });
  return true;
}
// le leurre et la frappe chez l'invité (après leurs conditions, la recharge est déjà comptée) : actions 'l' et 'r', avec ses chiffres
function leurreInvite(S, aim) {
  const L = S.P.leu;
  actionInvite(S, ['l', 0, mR2(aim[0]), mR2(aim[2]), mR2(L.dur), mR2(L.R)]);
  S.ev.push({ k: 'decoy', x: aim[0], z: aim[2] });
  return true;
}
function frappeInvite(S, aim) {
  const A = S.P.air;
  actionInvite(S, ['r', 0, mR2(aim[0]), mR2(aim[2]), A.n, mR2(A.dmg)]);
  S.ev.push({ k: 'jet', x: aim[0], z: aim[2] });
  return true;
}
// V4.4 : un coup sur une cloison chez l'invité (wallDmg) : l'action 'm' (morceau = o.pid, dégâts ; les coups d'un même pas vont dans la
// même action, 20 morceaux au plus) ; la cloison cassera chez l'hôte et l'instantané la montrera cassée
function murInvite(S, o, dmg) {
  if (!(dmg > 0) || !(o.pid >= 0)) return;
  let a = S.mActions[S.mActions.length - 1];
  if (!a || a[0] !== 'm' || a.t !== S.t || a.pub || a.length >= 2 + 2 * 20) a = actionInvite(S, ['m', 0]);
  let k = 2;
  while (k < a.length && a[k] !== o.pid) k += 2;
  if (k < a.length) a[k + 1] = mR2(a[k + 1] + dmg);
  else a.push(o.pid, mR2(dmg));
}
// une planche chez l'invité (plankStep, quand elle serait posée) : l'action 'k' ; elle apparaîtra avec l'instantané de l'hôte
function plancheInvite(S, id) {
  const d = DOORS[id];
  actionInvite(S, ['k', 0, id]);
  S.ev.push({ k: 'plank', door: id, n: Math.min(PLANKS_MAX, d.planks + 1), x: d.cx, y: d.y + 1.1, z: d.cz, pay: 0 });
  return true;
}

// ---------------------------------------------------------------- les actions des invités, chez l'hôte
// appliqueActions(S, joueur, A) : exécute les actions nouvelles de l'invité joueur (joueur.vu : dernier seq exécuté ; absent : on se cale
// sur ce qui est déjà dans A sans l'exécuter ; un seq plus petit que vu : l'invité a recommencé, on repart de 0). Tout est vérifié
// (A vient d'un autre joueur). Renvoie le nombre d'actions exécutées. Actions (voir LISEZMOI.md, V4.3) :
//   ['h', seq, place, gén, dégâts, effets, …]  ['c' | 'u', seq, x, y, z, yaw, pitch, héros, puissance, cases] (V4.8 : cases = les valeurs
//   de MHMA, l'arbre du héros de l'invité ; absentes : à zéro)
//   ['l', seq, x, z, durée, rayon]  ['r', seq, x, z, bombes, dégâts]  ['k', seq, porte]  ['m', seq, morceau, dégâts, …] (V4.4, cloisons)
function appliqueActions(S, joueur, A) {
  if (!joueur || typeof joueur !== 'object' || !Array.isArray(A) || S.invite) return 0;
  const L = A.slice(0, 16).filter(a => Array.isArray(a) && typeof a[0] === 'string' && Number.isInteger(a[1]) && a[1] > 0);
  L.sort((a, b) => a[1] - b[1]);
  const top = L.length ? L[L.length - 1][1] : 0;
  if (!(joueur.vu >= 0)) {
    joueur.vu = top;
    return 0;
  }
  if (top < joueur.vu) joueur.vu = 0;
  let n = 0;
  for (const a of L) {
    if (a[1] <= joueur.vu) continue;
    joueur.vu = a[1];
    try {
      if (mAction(S, joueur, a)) n++;
    } catch (e) {
      // une action invalide est perdue, les suivantes passent
    }
  }
  return n;
}
// une action d'invité : ses dégâts comptent comme un tir du joueur (cause 'p'), mais l'argent, les tués, la charge de l'ultime et les
// pièces (pkill) de l'hôte sont remis comme avant (l'invité compte les siens chez lui) ; le temps de l'appel, la pose, le héros, ses
// bonus (aucun) et sa puissance remplacent ceux de l'hôte, tout est remis même en cas d'erreur
function mAction(S, joueur, a) {
  const Z = S.z,
    ty = a[0];
  if (S.phase === 'dead' || S.phase === 'won') return false;
  if (ty === 'k') {
    const d = DOORS[a[2]];
    if (!Number.isInteger(a[2]) || !d || d.planks >= PLANKS_MAX) return false;
    setPlanks(d, d.planks + 1);
    if (d.torn > 0) d.torn--;
    S.plankVer++;
    S.ev.push({ k: 'plank', door: a[2], n: d.planks, x: d.cx, y: d.y + 1.1, z: d.cz, pay: 0 });
    return true;
  }
  // V4.4 : les coups d'un invité sur les cloisons
  if (ty === 'm') {
    if (S.mode !== 'out') return false;
    let n = 0;
    for (let k = 2; k + 1 < a.length && k < 2 + 2 * 20; k += 2) {
      const o = PANELS[a[k]],
        dmg = mNb(a[k + 1], 0, 5000, 0);
      if (!Number.isInteger(a[k]) || !o || !o.destr || o.dead || !(dmg > 0)) continue;
      wallDmg(S, o, dmg, (o.x0 + o.x1) / 2, (o.y0 + o.y1) / 2, (o.z0 + o.z1) / 2);
      n++;
    }
    return n > 0;
  }
  let pose = null,
    hero = null,
    pw = 1,
    hm = HM0,
    voie = null,
    elA = null,
    elHh = null;
  if (ty === 'c' || ty === 'u') {
    hero = HEROS[a[7]] ? a[7] : HEROS[joueur.heros] ? joueur.heros : null;
    if (!hero) return false;
    pose = {
      x: mNb(a[2], -200, 200, 0),
      y: mNb(a[3], -5, 100, H),
      z: mNb(a[4], -200, 200, 0),
      yaw: mNb(a[5], -100, 100, 0),
      pitch: mNb(a[6], -1.6, 1.6, 0)
    };
    pw = mNb(a[8], 0.1, 20, 1);
    if (Array.isArray(a[9])) {
      hm = Object.assign({}, HM0);
      MHMA.forEach((k, j) => (hm[k] = mNb(a[9][j], 0, k === 'spA1' ? 100 : 30, 0)));
    }
    // V4.9 : sa voie et l'élément de son arme
    if (a[10] === 'a' || a[10] === 'b') voie = a[10];
    if (ELKEYS.includes(a[11])) elA = a[11];
    // V5.2 : l'élément choisi de son héros (a[12] ; absent d'un vieux téléphone : sa clé)
    if (ELKEYS.includes(a[12])) elHh = a[12];
  } else if (ty !== 'h' && ty !== 'l' && ty !== 'r') return false;
  const p0 = S.p,
    h0 = S.hero,
    hm0 = S.hm,
    voie0 = S.voie,
    elA0 = S.elArme,
    elH0 = S.elHeros,
    P0 = S.P,
    hab0 = S.hab,
    ult0 = S.ult,
    cash0 = S.save.cash,
    rc0 = S.runCash,
    rk0 = S.runKills,
    ev0 = S.ev.length,
    // V4.4 : ce que l'action crée (boules de feu, ronces, météores, gardiens, orages, bombes, feux) est à l'invité : ses tués lui
    // reviennent (killZ, S.mCredits) ; les coups 'h' non (l'invité compte déjà les siens chez lui)
    own = ty !== 'h' && joueur.id !== undefined ? String(joueur.id).slice(0, 64) : undefined,
    L0 = MOWN.map(k => S[k].length),
    fl0 = S.flood;
  S.mOwn = own;
  try {
    if (pose) {
      S.p = Object.assign({}, p0, pose, { vx: 0, vy: 0, vz: 0, crouch: false, dead: false, down: 0, inv: 0, clb: null, zip: null, gl: 0 });
      S.hero = hero;
      S.hm = hm;
      S.voie = voie;
      S.elHeros = elHh || hero;
      S.elArme = elA || S.elHeros;
      S.P = Object.assign({}, P0, {
        mis: Object.assign({}, P0.mis, ty === 'c' ? { dmg: pw * 160 } : {}),
        onde: Object.assign({}, P0.onde, ty === 'u' ? { pw } : {})
      });
      S.hab = 0;
      S.ult = 1;
      return ty === 'c' ? useHeroSkill(S) : useHeroUlt(S);
    }
    if (ty === 'h') {
      let n = 0;
      for (let k = 2; k + 3 < a.length && k < 2 + 4 * 40; k += 4) {
        const i = a[k],
          dmg = mNb(a[k + 2], 0, 1e6, 0),
          fx = a[k + 3] | 0;
        if (!Number.isInteger(i) || i < 0 || i >= MAXZ || Z.st[i] === 0 || (Z.gen[i] & 15) !== a[k + 1] || !(dmg > 0)) continue;
        if (fx & 1) Z.burn[i] = Math.max(Z.burn[i], 2.5);
        if (fx & 2) Z.psn[i] = Math.max(Z.psn[i], 4);
        if (fx & 4) Z.slow[i] = Math.max(Z.slow[i], 1.6);
        if (fx & 8 && !bigZ(Z.ty[i]) && outside(Z, i) && Z.root[i] < 0.55) {
          Z.root[i] = 0.6;
          S.ev.push({ k: 'souleve', i, d: 0.6, x: Z.x[i], y: Z.y[i], z: Z.z[i] });
        }
        hurtZ(S, i, dmg, 'p');
        n++;
      }
      return n > 0;
    }
    if (S.phase !== 'day') return false;
    const x = mNb(a[2], -150, 150, 0),
      z = mNb(a[3], -150, 150, 0);
    if (ty === 'l') {
      S.decoy = { x, z, t: mNb(a[4], 1, 60, 8), R: mNb(a[5], 5, 80, 34) };
      S.ev.push({ k: 'decoy', x, z });
      return true;
    }
    // la frappe : comme useAir, depuis le point visé par l'invité, avec ses bombes et leurs dégâts
    const l = Math.hypot(x, z) || 1,
      ux = x / l,
      uz = z / l,
      nb = Math.round(mNb(a[4], 1, 30, 6)),
      dmg = mNb(a[5], 1, 1e6, 100);
    for (let k = 0; k < nb; k++) {
      const along = Math.max(B + 4, l - 10) + k * 5.5;
      S.bombs.push({ x: ux * along + (S.rnd() - 0.5) * 4, z: uz * along + (S.rnd() - 0.5) * 4, t: 1.1 + k * 0.13, dmg });
    }
    S.ev.push({ k: 'jet', x: ux * l, z: uz * l });
    return true;
  } finally {
    S.mOwn = undefined;
    if (own) {
      MOWN.forEach((k, j) => {
        for (let n = L0[j]; n < S[k].length; n++) S[k][n].own = own;
      });
      if (S.flood > fl0) S.floodOwn = own;
    }
    S.p = p0;
    S.hero = h0;
    S.hm = hm0;
    S.voie = voie0;
    S.elArme = elA0;
    S.elHeros = elH0;
    S.P = P0;
    S.hab = hab0;
    S.ult = ult0;
    S.save.cash = cash0;
    S.runCash = rc0;
    S.runKills = rk0;
    for (let k = S.ev.length - 1; k >= ev0; k--) if (MSANS[S.ev[k].k]) S.ev.splice(k, 1);
  }
}

// les tableaux d'effets qui peuvent tuer, et dont l'auteur est noté (own)
const MOWN = ['fballs', 'thorns', 'meteors', 'guards', 'storms', 'bombs', 'fires', 'ramparts'];

// ---------------------------------------------------------------- V4.4 : les zombies de l'immeuble chassent aussi les invités
// L'interface pose chez l'hôte S.mInvites = [{ id, x, y, z }] (les places reçues). majCibles (boucle.js, à chaque pas) en fait des cibles
// S.mCibles = [{ x, y, z, lv, pst, pss, pf }] : leur niveau, leur volée d'escalier et un champ de marche à leur niveau (refait toutes les
// 0,25 s). mCible(S, i) choisit pour le zombie i la cible la plus proche (même niveau d'abord) : null = l'hôte (comme sans multi).
function majCibles(S, dt) {
  const L = Array.isArray(S.mInvites) ? S.mInvites : [];
  if (!L.length) {
    if (S.mCibles && S.mCibles.length) S.mCibles = [];
    return;
  }
  const old = new Map((S.mCibles || []).map(c => [c.id, c])),
    out = [];
  for (const g of L.slice(0, 8)) {
    if (!g || !isFinite(g.x) || !isFinite(g.y) || !isFinite(g.z) || g.dn) continue;
    const c = old.get(g.id) || { id: g.id, pf: new Float32Array(S.pf.length), pfT: 0, pfLv: -9 };
    c.x = g.x;
    c.y = g.y;
    c.z = g.z;
    c.lv = levelOf(g.y);
    // sa volée d'escalier, comme finishP pour le joueur (S.pst, S.pss)
    c.pst = -1;
    c.pss = 0;
    if (c.x > HOLE.x0 && c.x < HOLE.x1 && c.z > HOLE.z0 && c.z < HOLE.z1) {
      const lvBelow = Math.min(NLV - 1, c.lv);
      if (c.y < H - 0.05 || c.x > 0) {
        c.pst = Math.max(0, c.y >= LVY(lvBelow) + 0.01 || lvBelow === 0 ? lvBelow : lvBelow - 1);
        c.pss = stairParam(c.pst, c.x, c.y, c.z);
      }
    }
    c.pfT -= dt;
    if (c.pfT <= 0 || c.pfLv !== c.lv) {
      c.pfT = 0.25;
      c.pfLv = c.lv;
      bfs(c.lv, [nearWalk(c.lv, c.x, c.z)], c.pf);
    }
    out.push(c);
  }
  S.mCibles = out;
}
function mCible(S, i) {
  const C = S.mCibles;
  if (!C || !C.length) return null;
  const Z = S.z,
    lv = Z.lv[i],
    sc = (x, z, l) => Math.abs(l - lv) * 1000 + Math.hypot(x - Z.x[i], z - Z.z[i]);
  let best = null,
    bs = S.p.dead || S.p.down > 0 ? Infinity : sc(S.p.x, S.p.z, S.plv);
  for (const c of C) {
    const s = sc(c.x, c.z, c.lv);
    if (s < bs) {
      bs = s;
      best = c;
    }
  }
  return best;
}

// ---------------------------------------------------------------- l'invité devient hôte
// reprendHote(S) : l'hôte est parti, cet invité reprend la partie depuis son miroir : les cibles deviennent les places, les fantômes de
// vrais zombies ; ceux du dehors sont remis sur une route (la plus proche), ceux de l'immeuble envahissent l'étage où ils sont, ceux de
// l'escalier continuent de monter ; la marche de tous les niveaux sera recalculée. Renvoie false si S n'était pas un invité.
function reprendHote(S) {
  if (!S.invite) return false;
  const Z = S.z;
  S.invite = false;
  for (let q = 0; q < S.nAct; q++) {
    const i = S.act[q];
    if (Z.st[i] === 0) continue;
    const T = ZT[Z.ty[i]];
    Z.x[i] = Z.mx[i];
    Z.y[i] = Z.my[i];
    Z.z[i] = Z.mz[i];
    Z.fant[i] = 0;
    Z.sp[i] = T.sp;
    Z.dec[i] = 0;
    Z.root[i] = 0;
    Z.tr[i] = 0;
    Z.hcd[i] = 2;
    Z.dw[i] = 0.8;
    Z.inv[i] = 0;
    if (Z.st[i] === 2) Z.st[i] = 1;
    const st = Z.st[i];
    if (st === 1 || st === 5) mSurRoute(S, i);
    else if (st === 3) {
      const lv = levelOf(Z.y[i]);
      Z.lv[i] = lv;
      Z.y[i] = LVY(lv);
      Z.inv[i] = lv < NLV ? Math.max(1, lv) : 0;
      Z.u[i] = -1;
    } else if (st === 7) {
      const k = Math.min(NLV - 1, levelOf(Z.y[i]));
      Z.lv[i] = k;
      Z.f[i] = 0;
      Z.u[i] = stairParam(k, Z.x[i], Z.y[i], Z.z[i]);
      Z.inv[i] = k + 1 < NLV ? k + 1 : 0;
    }
  }
  for (const t of S.tur) {
    t.ti = -1;
    t.tg = 0;
    t.re = 0;
    t.cd = 0;
    t.ont = 0;
    t.flame = 0;
    t.beams.length = 0;
    t.mTire = 0;
  }
  NAVDIRTY.fill(1);
  S.pfT = 0;
  S.spAcc = 0;
  gridBuild(S);
  return true;
}
// un zombie du dehors remis sur une route : sur la place, la route ouverte dont le débouché est le plus proche (outRoute : par un coin
// si besoin) ; dans une rue, cette rue (il court vers son bout) ; sur un mur d'avenue, ce mur
function mSurRoute(S, i) {
  const Z = S.z,
    x = Z.x[i],
    z = Z.z[i],
    surPlace = inPlaza(x, z);
  let best = 0,
    bd = Infinity;
  for (let r = 0; r < ROADS.length; r++) {
    const R = ROADS[r];
    if (!roadOpen(r, S.day) || (Z.st[i] === 5 && !R.wall)) continue;
    let d;
    if (surPlace || Z.st[i] === 5) d = Math.hypot(R.b[0] - x, R.b[1] - z);
    else {
      const u = clamp((x - R.a[0]) * R.dx + (z - R.a[1]) * R.dz, -20, R.len);
      d = Math.hypot(R.a[0] + R.dx * u - x, R.a[1] + R.dz * u - z);
    }
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  const R = ROADS[best];
  Z.road[i] = best;
  Z.off[i] = clamp((x - R.b[0]) * R.px + (z - R.b[1]) * R.pz, -(R.w / 2 - 0.6), R.w / 2 - 0.6);
  if (Z.st[i] === 5) return;
  if (surPlace) outRoute(S, i);
  else Z.wp[i] = 0;
}

// ---------------------------------------------------------------- V4.6 : chacun ses tourelles
// À plusieurs, chaque invité publie son plan de tourelles (save.layout) et ses niveaux de l'arbre qui touchent les tourelles ; l'hôte en
// tire S.mTurInv (interface/multi.js) et buildTurrets (tourelles.js) pose ces tourelles après les siennes, sur les emplacements libres,
// avec les chiffres de leur propriétaire (statsTourelles) ; leurs tués lui reviennent (killZ, S.mCredits). Avant la V4.6, seules les
// tourelles de l'hôte existaient : celles de l'invité n'étaient ni posées ni dessinées.
// Le plan : 2 caractères de MALPHA par tourelle (emplacement, type) ; les niveaux : un chiffre en base 36 par case de MTUR_LV.
const MTUR_LV = [
  't_slot',
  'mg_dmg',
  'mg_rate',
  'mg_twin',
  'mg_range',
  'la_unl',
  'la_dmg',
  'la_ramp',
  'la_prism',
  'mo_unl',
  'mo_dmg',
  'mo_rad',
  'mo_frag',
  'fl_unl',
  'fl_dmg',
  'fl_range',
  'fl_nap'
];
function planCode(layout) {
  let s = '';
  for (const k in layout || {}) {
    const slot = +k,
      ty = TKEYS.indexOf(layout[k]);
    if (Number.isInteger(slot) && slot >= 0 && slot < Math.min(64, SLOTS.length) && ty >= 0) s += MALPHA[slot] + MALPHA[ty];
  }
  return s.slice(0, 128);
}
// le plan publié par un invité (non fiable) : { emplacement: type } ou null s'il est mal formé
function planLit(s) {
  if (typeof s !== 'string' || s.length > 128 || s.length % 2) return null;
  const o = {};
  for (let k = 0; k < s.length; k += 2) {
    const slot = MVAL[s.charCodeAt(k)],
      ty = MVAL[s.charCodeAt(k + 1)];
    if (!(slot >= 0) || slot >= SLOTS.length || !(ty >= 0) || ty >= TKEYS.length) return null;
    o[slot] = TKEYS[ty];
  }
  return o;
}
function niveauxCode(lv) {
  return MTUR_LV.map(k => Math.max(0, Math.min(35, (lv && lv[k]) | 0)).toString(36)).join('');
}
// les niveaux publiés par un invité (non fiables) : { case: niveau } bornés au maximum de chaque case, ou null s'ils sont mal formés
function niveauxLit(s) {
  if (typeof s !== 'string' || s.length !== MTUR_LV.length) return null;
  const lv = {};
  for (let k = 0; k < s.length; k++) {
    const v = parseInt(s[k], 36),
      n = NODES.find(q => q.id === MTUR_LV[k]);
    if (!Number.isInteger(v) || v < 0 || !n) return null;
    lv[MTUR_LV[k]] = Math.min(v, n.max);
  }
  return lv;
}
// les chiffres des tourelles d'un joueur d'après ses niveaux : nombre de tourelles, et chaque type (mg, la, mo, fl), comme S.P
function statsTourelles(lv) {
  const P = derive(lv || {});
  return { turrets: P.turrets, mg: P.mg, la: P.la, mo: P.mo, fl: P.fl };
}
