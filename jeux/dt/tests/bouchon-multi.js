// bouchon-multi.js — V4.3 : une version MINIMALE des règles du multi (MULTI.md, chantier 1 : regles/multi.js), pour tester le tuyau et les
// rôles de l'interface (tests/multitest.js) avant la fusion. Le test l'ajoute dans chaque cadre du jeu ; il ne fait RIEN si les vraies
// fonctions existent déjà (window.__bouchon dit lequel tourne). Ce n'est pas un modèle des vraies règles :
//   encodeInstantane : JSON (jour, phase, temps, ville, restants, à sortir, fuyards, les zombies les plus proches des joueurs :
//                      [case, x, y, z, état, type, vie, vie au départ, orientation]) en base64url, coupé au budget ;
//   appliqueInstantane : recopie tout ça, éteint les cases absentes (pas de cible, pas de fantômes : les zombies sont posés à leur place) ;
//   stepInvite : playerStep seul (+ grille et rangement des morts) ; chez l'invité, hurtZ retire la vie localement et ajoute ['h', seq, case, 0, dégâts] ;
//   appliqueActions : les coups ('h') seulement ; reprendHote : refait la liste des cases libres, S.invite = false ; pas de horde ×1,5.
(function () {
  const vraies = ['encodeInstantane', 'appliqueInstantane', 'stepInvite', 'appliqueActions', 'reprendHote'];
  if (vraies.every(n => typeof window[n] === 'function')) {
    window.__bouchon = false;
    return;
  }
  window.__bouchon = true;
  const b64 = s =>
    btoa(unescape(encodeURIComponent(s)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const deb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const r2 = v => Math.round(v * 100) / 100;
  window.encodeInstantane = function (S, invites, max) {
    const Z = S.z,
      gens = [{ x: S.p.x, z: S.p.z }].concat(invites || []),
      dist = i => Math.min(...gens.map(g => Math.hypot(Z.x[i] - g.x, Z.z[i] - g.z))),
      ids = [];
    for (let k = 0; k < S.nAct; k++) ids.push(S.act[k]);
    ids.sort((a, b) => dist(a) - dist(b));
    const tete = {
      d: S.day,
      ph: S.phase,
      t: r2(S.dayT || 0),
      c: r2(S.city),
      l: S.left,
      T: S.dayTotal,
      s: S.toSpawn,
      e: S.escaped
    };
    let n = ids.length,
      g = '';
    for (;;) {
      tete.z = ids.slice(0, n).map(i => [i, r2(Z.x[i]), r2(Z.y[i]), r2(Z.z[i]), Z.st[i], Z.ty[i], r2(Z.hp[i]), r2(Z.hm[i]), r2(Z.yaw[i])]);
      g = b64(JSON.stringify(tete));
      if (g.length <= max || n === 0) break;
      n = Math.floor(n * 0.8);
    }
    return g.length <= max ? g : '';
  };
  window.appliqueInstantane = function (S, G) {
    let o;
    try {
      o = JSON.parse(deb64(G));
    } catch (_) {
      return;
    }
    if (!o || typeof o !== 'object') return;
    const nb = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
    S.day = nb(o.d, S.day);
    if (['prep', 'day', 'rescue', 'dead', 'won'].includes(o.ph)) S.phase = o.ph;
    S.dayT = nb(o.t, S.dayT);
    S.city = nb(o.c, S.city);
    S.left = nb(o.l, S.left);
    S.dayTotal = nb(o.T, S.dayTotal);
    S.toSpawn = nb(o.s, S.toSpawn);
    S.escaped = nb(o.e, S.escaped);
    const Z = S.z,
      garde = new Uint8Array(MAXZ);
    for (const e of Array.isArray(o.z) ? o.z : []) {
      if (!Array.isArray(e) || e.length < 9) continue;
      const i = e[0] | 0;
      if (i < 0 || i >= MAXZ) continue;
      garde[i] = 1;
      Z.x[i] = nb(e[1], 0);
      Z.y[i] = nb(e[2], 0);
      Z.z[i] = nb(e[3], 0);
      Z.st[i] = [1, 2, 3, 5, 7].includes(e[4]) ? e[4] : 1;
      Z.ty[i] = e[5] >= 0 && e[5] < ZT.length ? e[5] : 0;
      Z.hp[i] = nb(e[6], 1);
      Z.hm[i] = nb(e[7], 1);
      Z.yaw[i] = nb(e[8], 0);
    }
    let n = 0;
    for (let i = 0; i < MAXZ; i++) {
      if (!garde[i]) Z.st[i] = 0;
      else S.act[n++] = i;
    }
    S.nAct = n;
  };
  window.stepInvite = function (S, dt, inp) {
    if (dt > 0.05) dt = 0.05;
    S.t += dt;
    if (S.phase === 'dead' || S.phase === 'won') return;
    gridBuild(S);
    playerStep(S, dt, inp);
    compact(S);
  };
  const hurtZvrai = window.hurtZ;
  window.hurtZ = function (S, i, dmg, src) {
    if (!S.invite) return hurtZvrai(S, i, dmg, src);
    const Z = S.z;
    if (Z.st[i] === 0 || Z.hp[i] <= 0) return false;
    S.mActions = S.mActions || [];
    S.mSeq = (S.mSeq || 0) + 1;
    S.mActions.push(['h', S.mSeq, i, 0, r2(dmg)]);
    Z.hp[i] -= dmg;
    if (Z.hp[i] <= 0) {
      Z.st[i] = 0;
      Z.hp[i] = 0;
      S.kills++;
      S.runKills++;
      return true;
    }
    return false;
  };
  window.appliqueActions = function (S, joueur, A) {
    for (const a of A) {
      if (!Array.isArray(a) || !(a[1] > (joueur.vu || 0))) continue;
      joueur.vu = a[1];
      if (a[0] === 'h') {
        const i = a[2] | 0;
        if (i >= 0 && i < MAXZ && S.z.st[i]) hurtZ(S, i, +a[4] || 0, 'p');
      }
    }
  };
  window.reprendHote = function (S) {
    S.invite = false;
    S.free = [];
    for (let i = MAXZ - 1; i >= 0; i--) if (!S.z.st[i]) S.free.push(i);
  };
})();
