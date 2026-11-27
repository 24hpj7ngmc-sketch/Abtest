// multi.js — V4.3 : plusieurs joueurs sur le même toit (mode « Ils s'échappent », lancé depuis le lobby avec opts.multi).
// Le plan commun est MULTI.md (racine) ; le contrat avec le lobby, LOBBY.md (« V4.3 : le multi »). Sans LOBBY.multi, rien ici ne s'exécute.
//   - Le lobby envoie dix fois par seconde { dt: 'pairs', liste, moi } (pont-lobby.js, DernierToit.pairs) : les AUTRES joueurs et moi.
//     Tout ce qui vient de liste est NON FIABLE : chaque champ est vérifié (types, tailles), les noms nettoyés (nomPropre) avant tout affichage.
//   - L'hôte = le plus petit « depuis » (à égalité, le plus petit id en texte). Il fait tourner la vraie partie (step) ; les invités recopient
//     son instantané (appliqueInstantane) et ne font avancer que leur joueur (stepInvite, boucle.js) ; leurs coups arrivent chez l'hôte
//     sous forme d'actions (appliqueActions). Si l'hôte part, le suivant reprend la partie depuis son miroir (reprendHote).
//   - Chaque joueur publie son état d = { v: 1, p: P, g: G? } (G : l'instantané, chez l'hôte seulement) au plus 10 fois par seconde,
//     jamais plus long que MULTI.max caractères de JSON (l'instantané reçoit le budget qui reste).
// Fournit : MULTI, nomPropre, multiInvite (boucle.js, commandes.js), multiAvant, multiTir, multiTick, multiHoteOccupe (boucle.js),
// joueursDistants (affichage/joueurs.js : les autres joueurs à dessiner, positions lissées).
// Utilise des règles (écrites dans regles/multi.js, appelées seulement si elles existent) : encodeInstantane, appliqueInstantane,
// stepInvite, appliqueActions, reprendHote ; les champs S.invite, S.mActions, S.mSeq, S.nJoueurs ; HEROS, WEAP.
// De l'interface : LOBBY, versLobby (lobby.js), toast, bigMsg, prepUI (hud.js), showEnd (menu.js), setTxt, S, running, tool, ov.

// ---------------------------------------------------------------- l'état du multi
// actif : lancé depuis le lobby avec multi ; moi : { id, nom, depuis } ; pairs : Map id → { id, nom, heros, rang, depuis, etat, vu,
// dernier, vis } (etat : le dernier état reçu, vérifié ; vu : dernier numéro d'action exécuté chez l'hôte ; dernier : heure de l'état
// reçu ; vis : place lissée pour l'affichage) ; hote : je suis l'hôte ; hoteId ; max : taille maximale de l'état publié ;
// recu : au moins une liste reçue ; gDernier / gNeuf : le dernier instantané reçu de l'hôte, celui qui reste à appliquer ;
// pubT : heure de la dernière publication ; tirT : temps pendant lequel on dit « il tire » après un coup
const MULTI = (() => {
  const m = LOBBY && LOBBY.multi && typeof LOBBY.multi === 'object' ? LOBBY.multi : null,
    max = m && Number.isFinite(+m.max) && +m.max > 0 ? +m.max : 3000;
  return {
    actif: !!m,
    moi: { id: '', nom: m ? nomPropre(m.nom) : 'Joueur', depuis: m && Number.isFinite(+m.depuis) ? +m.depuis : Infinity },
    pairs: new Map(),
    hote: true,
    hoteId: '',
    max,
    recu: false,
    gDernier: null,
    gNeuf: null,
    pubT: 0,
    tirT: 0
  };
})();
// un nom affichable : lettres, chiffres, espace, tiret ; 12 caractères au plus (« Joueur » si rien ne reste)
function nomPropre(s, defaut) {
  const t = typeof s === 'string' ? s : typeof s === 'number' && Number.isFinite(s) ? String(s) : '';
  const n = t
    .slice(0, 80)
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12)
    .trim();
  return n || defaut || 'Joueur';
}
// un identifiant (texte de 64 caractères au plus) ; '' s'il n'est pas utilisable
const idPropre = v => (typeof v === 'string' ? v.slice(0, 64) : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');
// un nombre fini borné (sinon d)
const nbPropre = (v, a, b, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
// arrondi à 2 décimales (l'état publié)
const r2 = v => Math.round(v * 100) / 100;
// ce que le joueur tient : l'arme (clé de WEAP) ou l'outil
const MAINS = ['masse', 'marteau', 'leurre', 'frappe', 'grappin'];
const mainPropre = w => (typeof w === 'string' && w.length <= 12 && (WEAP[w] || MAINS.includes(w)) ? w : 'fusil');
const herosPropre = h => (typeof h === 'string' && h.length <= 8 && HEROS[h] ? h : '');
// je suis un invité (je ne simule que mon joueur)
function multiInvite() {
  return MULTI.actif && !MULTI.hote;
}

// ---------------------------------------------------------------- ce qui arrive du lobby
// l'état d'un autre joueur, vérifié : { v: 1, p: { n, h, w, x, y, z, a, b, f, dn, hp, k, A }, g } ou null
function etatPropre(d) {
  if (!d || typeof d !== 'object' || d.v !== 1 || !d.p || typeof d.p !== 'object') return null;
  const p = d.p,
    A = [];
  // ses actions (8 au plus) : [type, seq, …données], données en nombres ou en textes courts ; la règle les lit (appliqueActions)
  if (Array.isArray(p.A))
    for (const a of p.A.slice(-8)) {
      if (!Array.isArray(a) || a.length < 2 || a.length > 12 || typeof a[0] !== 'string' || a[0].length > 4) continue;
      if (!Number.isFinite(a[1])) continue;
      if (a.every((v, k) => k === 0 || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.length <= 16)))
        A.push(a.slice());
    }
  // V4.6 : son plan de tourelles et ses niveaux de tourelles (regles/multi.js planLit, niveauxLit) : les deux, ou aucun
  const T = typeof planLit === 'function' ? planLit(p.T) : null,
    L = T && typeof niveauxLit === 'function' ? niveauxLit(p.L) : null;
  return {
    v: 1,
    p: {
      T: L ? T : null,
      Ts: L ? p.T : '',
      L,
      Ls: L ? p.L : '',
      n: nomPropre(p.n),
      h: herosPropre(p.h),
      w: mainPropre(p.w),
      // V5.0 : l'élément de son arme (clé de ELKEYS, sinon vide : on prend alors son héros)
      e: typeof p.e === 'string' && ELKEYS.includes(p.e) ? p.e : '',
      x: nbPropre(p.x, -500, 500, 0),
      y: nbPropre(p.y, -50, 200, 0),
      z: nbPropre(p.z, -500, 500, 0),
      a: nbPropre(p.a, -1e4, 1e4, 0),
      b: nbPropre(p.b, -2, 2, 0),
      f: p.f === 1 ? 1 : 0,
      dn: p.dn === 1 ? 1 : 0,
      hp: nbPropre(p.hp, 0, 100, 100),
      k: Math.round(nbPropre(p.k, 0, 1e7, 0)),
      A
    },
    g: typeof d.g === 'string' && d.g.length <= MULTI.max ? d.g : null,
    // V4.4 : ce que l'hôte me doit (tués et argent de mes compétences, ultimes, frappes…) : [tués, argent], cumulés depuis qu'il est hôte
    cr: (() => {
      const c = d.cr && typeof d.cr === 'object' ? d.cr[MULTI.moi.id] : null;
      return Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && c[0] >= 0 && c[1] >= 0 && c[0] < 1e6 && c[1] < 1e9
        ? [Math.floor(c[0]), c[1]]
        : null;
    })()
  };
}
// l'hôte : le plus petit depuis, à égalité le plus petit id (en texte)
function multiHoteId() {
  let best = MULTI.moi;
  for (const j of MULTI.pairs.values())
    if (j.depuis < best.depuis || (j.depuis === best.depuis && String(j.id) < String(best.id))) best = j;
  return best.id;
}
// le nom d'un joueur (moi ou un pair)
const nomDe = id => (id === MULTI.moi.id ? MULTI.moi.nom : MULTI.pairs.has(id) ? MULTI.pairs.get(id).nom : 'Joueur');
// une liste arrive (10 fois par seconde) : les pairs mis à jour, les arrivées et départs, le rôle
function multiPairs(liste, moi) {
  if (moi && typeof moi === 'object') {
    const id = idPropre(moi.id);
    if (id) MULTI.moi.id = id;
    if (moi.nom !== undefined) MULTI.moi.nom = nomPropre(moi.nom, MULTI.moi.nom);
    if (Number.isFinite(moi.depuis)) MULTI.moi.depuis = moi.depuis;
  }
  const premier = !MULTI.recu,
    vus = new Set(),
    arrives = [],
    partis = [];
  MULTI.recu = true;
  for (const e of Array.isArray(liste) ? liste.slice(0, 16) : []) {
    if (!e || typeof e !== 'object') continue;
    const id = idPropre(e.id);
    if (!id || id === MULTI.moi.id || vus.has(id)) continue;
    vus.add(id);
    let j = MULTI.pairs.get(id);
    if (!j) {
      j = { id, nom: 'Joueur', heros: '', rang: 1, depuis: Infinity, etat: null, vu: undefined, dernier: 0, vis: null };
      MULTI.pairs.set(id, j);
      arrives.push(j);
    }
    const etat = etatPropre(e.etat);
    j.nom = nomPropre(e.nom, etat ? etat.p.n : 'Joueur');
    j.heros = herosPropre(e.heros) || (etat ? etat.p.h : '');
    j.rang = Math.round(nbPropre(e.rang, 1, 4, 1));
    j.depuis = nbPropre(e.depuis, -Infinity, Infinity, Infinity);
    if (etat) {
      j.etat = etat;
      j.dernier = performance.now();
    }
  }
  for (const [id, j] of MULTI.pairs)
    if (!vus.has(id)) {
      MULTI.pairs.delete(id);
      partis.push(j);
    }
  // le rôle
  const avant = MULTI.hoteId,
    hoteAvant = MULTI.hote,
    hid = multiHoteId();
  MULTI.hoteId = hid;
  MULTI.hote = hid === MULTI.moi.id;
  if (!MULTI.hote) {
    // l'instantané de l'hôte : le dernier reçu remplace le précédent (appliqué par multiAvant, à l'image suivante)
    const h = MULTI.pairs.get(hid),
      g = h && h.etat ? h.etat.g : null;
    if (hoteAvant || avant !== hid) {
      MULTI.gDernier = null;
      MULTI.crVu = null;
    }
    if (g && g !== MULTI.gDernier) MULTI.gDernier = MULTI.gNeuf = g;
    // V4.4 : mes tués faits chez l'hôte (compétence, ultime, frappe…) : ajoutés à mes tués et à mon argent
    const cr = h && h.etat ? h.etat.cr : null;
    if (cr) {
      // (nouvel hôte, ou partie relancée chez l'hôte : ses comptes repartent de zéro)
      if (!MULTI.crVu || cr[0] < MULTI.crVu[0]) MULTI.crVu = [0, 0];
      const dk = cr[0] - MULTI.crVu[0],
        dc = cr[1] - MULTI.crVu[1];
      if (S && (dk > 0 || dc > 0) && S.phase !== 'dead' && S.phase !== 'won') {
        S.runKills += dk;
        S.runCash += dc;
        save.cash = (save.cash || 0) + dc;
        MULTI.crVu = cr.slice();
      }
    }
  } else if (!hoteAvant) {
    // je deviens l'hôte : les actions déjà publiées par les autres ne sont pas rejouées (l'ancien hôte les a exécutées)
    for (const j of MULTI.pairs.values()) j.vu = undefined;
    MULTI.gNeuf = null;
  }
  // les messages : arrivées, départs, changement d'hôte
  const noms = l => l.map(j => j.nom).join(', ');
  let msg = '';
  if (premier) {
    if (!MULTI.hote) msg = 'Tu rejoins la partie de ' + nomDe(hid);
    else if (arrives.length) msg = noms(arrives) + (arrives.length > 1 ? ' sont' : ' est') + ' sur le toit';
  } else {
    if (arrives.length) msg = noms(arrives) + (arrives.length > 1 ? ' arrivent' : ' arrive') + ' sur le toit';
    if (partis.length) msg = (msg ? msg + ' · ' : '') + noms(partis) + (partis.length > 1 ? ' sont partis' : ' est parti');
    if (avant && avant !== hid) msg = (msg ? msg + ' · ' : '') + (MULTI.hote ? "tu deviens l'hôte" : nomDe(hid) + " devient l'hôte");
  }
  if (msg) toast(msg, 2600);
}
window.addEventListener('message', e => {
  const m = e.data;
  if (!MULTI.actif || e.source !== window.parent || !m || typeof m !== 'object' || m.dt !== 'pairs') return;
  multiPairs(m.liste, m.moi);
});

// ---------------------------------------------------------------- à chaque image, avant le pas des règles (boucle.js)
// l'invité : marqué S.invite, il applique le dernier instantané reçu ; l'hôte : S.nJoueurs, reprise de la partie s'il vient d'être
// invité (reprendHote), et les actions nouvelles des invités (appliqueActions). Rien sans multi.
function multiAvant() {
  if (!MULTI.actif || !S) return;
  if (!MULTI.hote) {
    if (!S.invite) {
      S.invite = true;
      if (!Array.isArray(S.mActions)) S.mActions = [];
      if (!Number.isFinite(S.mSeq)) S.mSeq = 0;
    }
    if (MULTI.gNeuf && running && !ov()) {
      const g = MULTI.gNeuf;
      MULTI.gNeuf = null;
      multiApplique(g);
    }
    return;
  }
  // hôte
  if (S.invite) {
    if (typeof reprendHote === 'function')
      try {
        reprendHote(S);
      } catch (err) {
        console.error('reprendHote', err);
      }
    S.invite = false;
    S.mTurSig = null; // ses tourelles et celles des autres seront reposées d'après les plans (plus d'après l'instantané)
  }
  S.nJoueurs = 1 + MULTI.pairs.size;
  // V4.6 : les tourelles des invités (leur plan, leurs niveaux), reposées seulement quand quelque chose change (S.mTurSig)
  const invT = [...MULTI.pairs.values()]
    .filter(j => j.etat && j.etat.p.T)
    .sort((a, b) => a.depuis - b.depuis || (String(a.id) < String(b.id) ? -1 : 1));
  const sig = invT.map(j => j.id + ':' + j.etat.p.Ts + ':' + j.etat.p.Ls).join(';');
  if (sig !== S.mTurSig && typeof statsTourelles === 'function') {
    S.mTurSig = sig;
    S.mTurInv = invT.map(j => ({ id: String(j.id).slice(0, 64), plan: j.etat.p.T, P: statsTourelles(j.etat.p.L) }));
    buildTurrets(S);
  }
  // V4.4 : les places des invités, pour que les zombies de l'immeuble les chassent aussi (majCibles, regles/multi.js)
  const inv = [];
  for (const j of MULTI.pairs.values()) if (j.etat) inv.push({ id: j.id, x: j.etat.p.x, y: j.etat.p.y, z: j.etat.p.z, dn: j.etat.p.dn });
  S.mInvites = inv;
  if (S.phase === 'dead' || S.phase === 'won' || typeof appliqueActions !== 'function') return;
  for (const j of MULTI.pairs.values()) {
    const A = j.etat ? j.etat.p.A : null;
    if (!A) continue;
    let haut = 0;
    for (const a of A) haut = Math.max(haut, a[1]);
    // première fois qu'on le voit (ou je viens de devenir hôte) : ses actions passées ne comptent pas
    if (j.vu === undefined) {
      j.vu = haut;
      continue;
    }
    // ses numéros sont repartis de zéro (il a relancé une partie)
    if (haut < j.vu) j.vu = 0;
    if (haut <= j.vu) continue;
    try {
      appliqueActions(S, j, A);
    } catch (err) {
      console.error('appliqueActions', err);
      j.vu = haut;
    }
  }
}
// l'invité applique l'instantané g de l'hôte ; les changements de phase donnent les messages que l'hôte reçoit de ses événements ;
// la fin de partie de l'hôte (phase dead / won) donne l'écran de fin, une fois, si la partie a été vue en cours depuis newGame
function multiApplique(g) {
  if (typeof appliqueInstantane !== 'function') return;
  const ph0 = S.phase;
  try {
    appliqueInstantane(S, g);
  } catch (err) {
    console.error('appliqueInstantane', err);
    return;
  }
  const ph = S.phase,
    fin = ph === 'dead' || ph === 'won';
  if (fin && !S.mVu) {
    // la partie de l'hôte est déjà finie (on arrive, ou on a relancé avant lui) : on attend qu'il en relance une
    S.phase = ph0 === 'dead' || ph0 === 'won' ? 'prep' : ph0;
    if (!S.mAttente) {
      S.mAttente = true;
      toast("La partie de l'hôte est finie : attends qu'il en relance une", 3200);
    }
    return;
  }
  if (!fin) S.mVu = true;
  if (ph === ph0) return;
  if (ph === 'day') {
    SND.play('siren');
    bigMsg('JOUR ' + S.day, 'Ils sortent !', 'red', 2200);
  } else if (ph === 'prep' && ph0 === 'day') {
    SND.play('clear');
    bigMsg('JOUR TENU', '', 'gold', 2400);
    prepUI();
  } else if (ph === 'rescue') bigMsg('JOUR 10 TENU', "L'hélicoptère arrive !", 'gold', 3500);
  else if (fin && !S.mFin) {
    S.mFin = true;
    SND.play(ph === 'won' ? 'win' : 'dead');
    const won = ph === 'won',
      s0 = S;
    setTimeout(() => {
      if (S === s0) showEnd(won);
    }, 1400);
  }
}
// boucle.js, après le pas : un coup est parti à cette image (« il tire » pendant 0,2 s, pour l'éclair des autres)
function multiTir(parti) {
  if (parti) MULTI.tirT = 0.2;
}
// l'hôte a ouvert un écran (arbre, carte, règles) pendant une partie en cours avec d'autres joueurs : la partie avance quand même
// (boucle.js fait alors un pas sans ses commandes), sinon tout le toit serait figé
function multiHoteOccupe() {
  return (
    MULTI.actif &&
    MULTI.hote &&
    MULTI.pairs.size > 0 &&
    !!S &&
    S.phase !== 'dead' &&
    S.phase !== 'won' &&
    $('endV').hidden &&
    $('start').hidden
  );
}

// ---------------------------------------------------------------- à chaque image, après le reste (boucle.js)
// les autres joueurs glissent vers leur dernière place reçue ; publication de mon état (10 fois par seconde au plus) ;
// le compteur « N sur le toit » et le bouton du jour de l'invité
function multiTick(dt) {
  if (!MULTI.actif || !S) return;
  MULTI.tirT = Math.max(0, MULTI.tirT - dt);
  const k = 1 - Math.exp(-dt * 12);
  for (const j of MULTI.pairs.values()) {
    if (!j.etat) continue;
    const p = j.etat.p,
      v = j.vis;
    // première place, ou un saut de plus de 8 m (relevé sur le toit, tyrolienne) : il y est tout de suite
    if (!v || Math.hypot(p.x - v.x, p.y - v.y, p.z - v.z) > 8) {
      j.vis = { x: p.x, y: p.y, z: p.z, yaw: p.a, pitch: p.b };
      continue;
    }
    v.x += (p.x - v.x) * k;
    v.y += (p.y - v.y) * k;
    v.z += (p.z - v.z) * k;
    // l'orientation par le plus court chemin
    let da = (p.a - v.yaw) % (Math.PI * 2);
    if (da > Math.PI) da -= Math.PI * 2;
    else if (da < -Math.PI) da += Math.PI * 2;
    v.yaw += da * k;
    v.pitch += (p.b - v.pitch) * k;
  }
  const now = performance.now();
  if (now - MULTI.pubT >= 100) {
    MULTI.pubT = now;
    multiPublie();
  }
  setTxt('mNb', '', 1 + MULTI.pairs.size + ' sur le toit');
  const inv = !MULTI.hote;
  setTxt('go', '', inv ? "L'hôte lance le jour" : 'Lancer le jour');
  $('go').classList.toggle('attente', inv);
}
// mon état publié : { v: 1, p: P, g: G } (g : l'instantané, chez l'hôte qui a des invités) ; au plus MULTI.max caractères de JSON
function multiPublie() {
  const p = S.p,
    A = [];
  // mes actions (invité) : les 8 dernières ; la liste ne garde pas plus de 32 entrées
  if (!MULTI.hote && Array.isArray(S.mActions)) {
    if (S.mActions.length > 32) S.mActions.splice(0, S.mActions.length - 32);
    // actionsInvite (regles/multi.js) : au plus 8 actions, closes une fois publiées, dans le budget
    const L = typeof actionsInvite === 'function' ? actionsInvite(S, Math.max(300, MULTI.max - 700)) : S.mActions.slice(-8);
    for (const a of L) A.push(a);
  }
  const P = {
    n: MULTI.moi.nom,
    h: S.hero || '',
    w: tool === 'fusil' ? S.weap : tool,
    e: ELKEYS.includes(S.elArme) ? S.elArme : '',
    x: r2(p.x),
    y: r2(p.y),
    z: r2(p.z),
    a: r2(p.yaw),
    b: r2(p.pitch),
    f: MULTI.tirT > 0 ? 1 : 0,
    dn: p.down > 0 || p.dead ? 1 : 0,
    hp: Math.round((Math.max(0, p.hp) / Math.max(1, p.hpMax)) * 100),
    k: S.runKills | 0,
    A
  };
  // V4.6 : l'invité publie son plan de tourelles et ses niveaux de tourelles : l'hôte pose ses tourelles et les fait tirer pour lui
  if (!MULTI.hote && typeof planCode === 'function') {
    P.T = planCode(save.layout);
    P.L = niveauxCode(save.lv || {});
  }
  let d = { v: 1, p: P };
  // V4.4 : l'hôte publie ce qu'il doit à chaque invité présent : { id: [tués, argent] } (S.mCredits, regles/degats.js killZ)
  if (MULTI.hote && S.mCredits) {
    const cr = {};
    let n = 0;
    for (const id of MULTI.pairs.keys()) {
      const c = S.mCredits[String(id).slice(0, 64)];
      if (c) {
        cr[id] = [c.k, Math.round(c.c)];
        n++;
      }
    }
    if (n) d.cr = cr;
  }
  const base = JSON.stringify(d).length;
  if (base > MULTI.max) return; // (ne devrait pas arriver : P fait ~200 caractères)
  if (MULTI.hote && MULTI.pairs.size && typeof encodeInstantane === 'function') {
    // les invités (leurs places) : l'instantané garde d'abord les zombies proches d'eux et de l'hôte
    const invites = [];
    for (const j of MULTI.pairs.values()) if (j.etat) invites.push({ x: j.etat.p.x, y: j.etat.p.y, z: j.etat.p.z });
    // ',"g":""' : 7 caractères de plus que sans g ; l'alphabet de l'instantané n'a rien à échapper en JSON
    let budget = MULTI.max - base - 7;
    for (let essai = 0; essai < 3 && budget > 0; essai++) {
      let G = null;
      try {
        G = encodeInstantane(S, invites, budget);
      } catch (err) {
        console.error('encodeInstantane', err);
        break;
      }
      if (typeof G !== 'string') break;
      const d2 = Object.assign({}, d, { g: G }),
        n = JSON.stringify(d2).length;
      if (n <= MULTI.max) {
        d = d2;
        break;
      }
      budget -= n - MULTI.max + 40; // trop long (des caractères échappés ?) : on recommence plus court
    }
  }
  versLobby({ dt: 'etat', d });
}
// les autres joueurs à dessiner (affichage/joueurs.js) : un tableau neuf à chaque appel, un objet neuf par joueur
// [{ id, nom, heros, arme, el (V5.0 : élément de son arme ou ''), x, y, z, yaw, pitch, tire, aTerre }] ; places lissées ; nom nettoyé (12 caractères) ; heros : clé de HEROS ou '' ;
// arme : clé de WEAP ou 'masse' | 'marteau' | 'leurre' | 'frappe' ; [] sans multi
function joueursDistants() {
  const r = [];
  if (!MULTI.actif) return r;
  for (const j of MULTI.pairs.values()) {
    if (!j.etat || !j.vis) continue;
    const p = j.etat.p,
      v = j.vis;
    r.push({
      id: j.id,
      nom: j.nom,
      heros: j.heros,
      arme: p.w,
      el: p.e || '',
      x: v.x,
      y: v.y,
      z: v.z,
      yaw: v.yaw,
      pitch: v.pitch,
      tire: p.f === 1,
      aTerre: p.dn === 1
    });
  }
  return r;
}
// le compteur « 3 sur le toit » (haut de l'écran, au centre), seulement en multi
if (MULTI.actif) {
  const el = document.createElement('div');
  el.id = 'mNb';
  el.className = 'panel';
  $('hudIn').appendChild(el);
}
