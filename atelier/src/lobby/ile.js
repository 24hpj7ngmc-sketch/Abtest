// [lobby/ile.js] L'Île des Cinq derrière le premier portail : le jeu tourne dans son cadre (ile/ile-pour-lobby.js) ; le lobby l'ouvre, lui donne ses bonus, paie au message « fin », fait le facteur du multi.
// ---- L'Île des Cinq est un mini-jeu à part (V11.0) : son code vit dans son propre atelier, et arrive ici en un seul fichier collé tel quel, ile/ile-pour-lobby.js (variable IleDesCinq).
// Le contrat est dans ile/LOBBY.md. Le lobby garde tout ce qui dure : or céleste, éclats, arbres des héros et des armes, campagne, défis, butin, réglages. Le jeu n'écrit aucune sauvegarde.
//  · à l'ouverture, le lobby donne : héros, arme, mode ou niveau de campagne, bonus (arbres), préparatifs du village, bourse, réglages, barème (pour le Guide du jeu) ;
//  · à chaque partie finie, le jeu dit ce qui s'est passé (« fin ») : le lobby paie avec le barème commun (payOut), puis répond ce qu'il a donné (IleDesCinq.paie), que le jeu affiche ;
//  · « Retour sur l'île » dans le jeu : le cadre se retire, on se réveille devant le portail.
// Rien de ce qui vient du jeu n'est cru sur parole : chaque nombre est borné (une partie ne peut pas rapporter plus que vingt vagues gagnées).
const ileOk = () => typeof IleDesCinq === 'object' && !!IleDesCinq && typeof IleDesCinq.ouvrir === 'function';
let IR = null, // la visite en cours : { el, n : parties finies, pret, gold, sh }
  ileT = 0;
// ce qu'un héros emporte avec une arme : son arbre, les cases de l'arme (générales et celles de ce jeu), la branche de son élément. Le profil de base de l'arme, lui, appartient au jeu.
function ileMods(el, w) {
  const m = {};
  for (const n of HT[el].nodes) m[n.key] = (save.hl[el][n.id] || 0) * n.inc;
  if (WT[w] && WT[w].games.includes('ile'))
    for (const n of WT[w].nodes.concat(WT[w].gt && WT[w].gt.ile ? WT[w].gt.ile.nodes : []))
      m[n.key] = (m[n.key] || 0) + (save.wl[w][n.id] || 0) * n.inc;
  // l'arbre « Élément des balles » : les six branches dès que le jeu dit lire l'élément de chaque arme ('elements' dans IleDesCinq.accepte, V2.1 : il n'applique que celle de l'arme en main) ; sinon la seule branche du héros, comme avant
  if (ileOk() && Array.isArray(IleDesCinq.accepte) && IleDesCinq.accepte.includes('elements')) {
    for (const e of HEROS) elMods(e, m);
    return m;
  }
  return elMods(el, m);
}
function ileOpts(el, x) {
  const mods = {};
  for (const e of HEROS.filter(e => jeuHeros(typeof IleDesCinq === 'object' ? IleDesCinq : null, e))) {
    mods[e] = {};
    for (const w of armsOf('ile')) mods[e][w] = ileMods(e, w);
  }
  const prep = { mods: {}, noms: [] };
  if (save.prep.aff) {
    prep.mods.hDmg = save.prep.aff / 100;
    prep.noms.push('affûtage +' + save.prep.aff + ' %');
  }
  if (save.prep.prov) {
    prep.mods.hHp = save.prep.prov;
    prep.noms.push('provisions +' + save.prep.prov + ' PV');
  }
  const cp = campOf(),
    A = armsOf('ile');
  return Object.assign(
    {
      heros: el,
      arme: A.includes(tWeap) ? tWeap : A[0],
      // V12.1 : le rôle du héros et l'élément choisi pour chaque arme, pour les jeux qui sauront les lire
      role: ROLE[el],
      voie: voieOf(el) ? { id: voieOf(el), nom: VOIES[el][voieOf(el)].n } : null,
      elements: A.reduce((o, w) => ((o[w] = wEl(w, el)), o), {}),
      mode: gameMode(),
      campagne: cp ? { el: cp.el, l: cp.l } : null,
      tuto: false,
      dev: save.dev === true,
      bonus: { mods, prep, or: save.boost ? BOOST_G : 0 },
      gains: Object.assign({ rangs: PAYK.slice() }, GAINS),
      reglages: { snd: save.snd, fire: fireMode(), aj: save.aj === true, devOpt: save.devOpt || {} }
    },
    net.room ? { multi: { nom: LN.nm, depuis: LN.tt, max: dnMax() } } : {},
    x || {}
  );
}
// passer le premier portail : x = { tuto: true } pour la partie guidée
function ileGo(el, x) {
  if (!HEROS.includes(el)) el = tHero;
  if (!ileOk()) {
    toast("L'Île des Cinq n'est pas dans cette page");
    return;
  }
  if (!jeuHeros(IleDesCinq, el)) {
    toast(EL[el].hero + " n'est pas encore dans L'Île des Cinq");
    return;
  }
  if (IleDesCinq.ouvert || (typeof DernierToit === 'object' && DernierToit.ouvert)) return;
  {
    let mx = 0;
    if (net.room)
      try {
        for (const p of net.room.peers() || []) {
          const v = p.presence && +p.presence.tt;
          if (v > mx && v < Date.now() + 864e5) mx = v;
        }
      } catch (_) {}
    LN.tt = Math.max(Date.now(), mx + 1);
    lobNetSt('play', { tt: LN.tt, nm: LN.nm, el, dn: null });
  }
  const o = ileOpts(el, x),
    usePrep = o.bonus.prep.noms.length > 0 && !o.tuto,
    useBoost = o.bonus.or > 0 && !o.tuto;
  tHero = el;
  save.last = el;
  persist();
  IR = { el, n: 0, pret: false, gold: 0, sh: 0 };
  for (const id of LPAN) $(id).hidden = true;
  LB.a = null;
  LB.hold = false;
  joy.id = null;
  joy.f = joy.r = 0;
  joy.full = 0;
  $('knob').style.transform = '';
  SND.hold(true);
  IleDesCinq.ouvrir(o, {
    etat: toitEtat,
    pret: m => {
      ileSos(false);
      if (!IR) return;
      // les préparatifs et la bourse ne sont dépensés que lorsque le jeu a dit « prêt » (une seule fois par passage du portail)
      if (!IR.pret) {
        if (usePrep) save.prep = {};
        if (useBoost) save.boost = 0;
        if (usePrep || useBoost) persist();
      }
      IR.pret = true;
      if (m && HEROS.includes(m.heros)) IR.el = m.heros;
    },
    fin: ileFin,
    retour: ileBack,
    reglages: ileRegl,
    arme: m => {
      if (m && typeof m.arme === 'string' && armsOf('ile').includes(m.arme)) setWeap(m.arme);
    }
  });
  clearTimeout(ileT);
  ileT = setTimeout(() => {
    if (IR && !IR.pret && IleDesCinq.ouvert) ileSos(true);
  }, 12000);
}
// la partie guidée (bouton « Tuto » du portail, et depuis le Guide) : une vraie partie, cœur invincible, avec le dernier héros joué
function ileTuto() {
  $('guideV').hidden = true;
  ileGo(ELS.includes(save.last) ? save.last : 'terre', { tuto: true });
}
// issue de secours : si le jeu n'a pas dit « prêt » au bout de 12 s (cadre resté vide, réseau coupé…), un bouton du lobby passe par-dessus le cadre pour revenir sur l'île
function ileSos(on) {
  let b = $('ileSos');
  if (!on) {
    if (b) b.remove();
    return;
  }
  if (b) return;
  b = document.createElement('button');
  b.id = 'ileSos';
  b.textContent = "L'Île des Cinq ne démarre pas · Retour sur l'île";
  b.style.cssText =
    'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483600;padding:10px 16px;border-radius:999px;border:1px solid #ffcf5a;background:#0f2530;color:#ffcf5a;font:600 14px system-ui';
  b.onclick = () => {
    ileSos(false);
    IleDesCinq.fermer();
    ileBack();
  };
  document.body.appendChild(b);
}
// les réglages changés en partie (mode de tir, saut auto, options du mode dev, tutoriel fini) : le lobby les garde
function ileRegl(m) {
  if (!m || typeof m !== 'object') return;
  if (typeof m.fire === 'string' && FM[m.fire]) save.fire = m.fire;
  if (typeof m.aj === 'boolean') save.aj = m.aj;
  if (m.tuto === true) save.tuto = 1;
  if (save.dev && m.devOpt && typeof m.devOpt === 'object' && !Array.isArray(m.devOpt))
    for (const k of ['auto', 'god', 'hgod', 'fly']) if (typeof m.devOpt[k] === 'boolean') dev[k] = m.devOpt[k];
  if (save.dev && m.devOpt && Number.isFinite(+m.devOpt.speed)) dev.speed = Math.max(1, Math.min(8, +m.devOpt.speed));
  if (save.dev) save.devOpt = dev;
  persist();
}
// une partie finie (une fois par partie, « Rejouer » compris). Les nombres du jeu sont bornés à ce qu'une partie de vingt vagues peut donner.
const ileN = (v, lo, hi) => {
  v = Math.round(+v);
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
};
function ileFin(m) {
  if (!IR || !m || typeof m !== 'object' || Array.isArray(m)) return;
  const el = HEROS.includes(m.heros) ? m.heros : IR.el,
    win = m.victoire === true,
    hard = m.mode === 'hard',
    cleared = ileN(m.passees, 0, 20),
    clv = cleared > 0 ? ileN(m.unites, 1, 1 + (cleared - 1) * 2) : 0,
    boss = ileN(m.boss, 0, 12),
    kills = ileN(m.tues, 0, 20000),
    obj = ileN(m.objectifs, 0, 20),
    C = m.campagne && typeof m.campagne === 'object' ? m.campagne : null,
    cp =
      C && CAMPO.includes(C.el) && ileN(C.l, 0, 9) >= 1 && ileN(C.l, 0, 9) <= CAMPN
        ? { el: C.el, l: ileN(C.l, 1, CAMPN) }
        : null,
    cwin = !!cp && win,
    cfirst = cwin && (save.camp[cp.el] || 0) < cp.l,
    cbonus = cfirst ? 100 * cp.l : 0,
    pk = hard ? 1.5 : cp && m.invite !== true ? PAYK[cp.l - 1] || 1 : 1,
    L = [];
  IR.n++;
  if (m.tuto === true) save.tuto = 1;
  if (cfirst) {
    save.camp[cp.el] = cp.l;
    save.gold += cbonus;
  } // campagne : un niveau fini ouvre le suivant ; prime la première fois
  const P = payOut(el, clv, boss, win, pk),
    mk = hard ? 'hard' : 'normal';
  save.rec[mk] = Math.max(save.rec[mk] || 0, cleared);
  qGame({ game: 'ile', kills, boss, units: clv || cleared, win, hard, obj, fini: cleared >= 3, el });
  if (cleared > 0) {
    hvGrow();
    hvGame();
  } // le village a travaillé pendant la partie : tout est à ramasser sur l'île
  // le butin : le jeu dit ce qui est tombé et avec quelle chance ; le lobby tire, avec le bonus du musée
  const got = {};
  for (const b of Array.isArray(m.butin) ? m.butin.slice(0, 40) : []) {
    if (!Array.isArray(b) || !(HEROS.includes(b[0]) || b[0] === 'relique') || !(+b[1] > 0)) continue;
    if (Math.random() < Math.min(1, +b[1]) + 0.1 * bonus('musee')) got[b[0]] = (got[b[0]] || 0) + 1;
  }
  if (win) {
    got[hard ? 'sceau' : 'couronne'] = 1;
    if (!save.loot['etoile_' + el]) got['etoile_' + el] = 1;
  }
  for (const g in got) save.loot[g] = (save.loot[g] || 0) + got[g];
  IR.gold += P.gold + cbonus;
  IR.sh += P.sh;
  IR.el = el;
  persist();
  syncHeroes();
  if (cwin)
    L.push({
      t:
        cp.l < CAMPN
          ? (cfirst ? 'Débloqué : ' : 'Ouvert : ') + EL[cp.el].n + ' · niveau ' + (cp.l + 1)
          : 'Tous les niveaux de ' + EL[cp.el].n + ' sont finis',
      fort: true
    });
  if (cbonus) L.push({ t: 'Première fois : +' + cbonus + ' or céleste', fort: true });
  L.push({ t: '+' + P.sh + ' éclats pour ' + EL[el].hero });
  L.push({ t: '+' + P.gold + ' or céleste', fort: true });
  if (pk > 1 && P.gold > 0) L.push({ t: 'Gains ×' + payT(pk) });
  for (const g in got) L.push({ t: 'Butin : ' + LOOTN[g] + (got[g] > 1 ? ' × ' + got[g] : ''), fort: true });
  const hv = myVil()
    .filter(B => hvLabel(B))
    .map(B => CAT[B.t].n);
  if (hv.length) L.push({ t: 'À ramasser sur ton île : ' + hv.join(', ') });
  try {
    IleDesCinq.paie(L);
  } catch (e) {
    console.error(e);
  }
}
// « Retour sur l'île » : le cadre est déjà retiré ; le lobby reprend devant le portail
function ileBack() {
  SND.hold(false);
  SND.set(save.snd !== false);
  clearTimeout(ileT);
  ileSos(false);
  const T = IR;
  IR = null;
  lobSpawn('game');
  lobSync();
  syncHeroes();
  if (T && T.n && (T.gold || T.sh))
    toast('De retour sur ton île · +' + T.gold + ' or céleste · +' + T.sh + ' éclats pour ' + EL[T.el].hero);
}
// le facteur du multi : dix fois par seconde, les états des autres joueurs du salon qui sont dans ce jeu sont donnés au jeu (l'état du joueur d'ici part par toitEtat, clé dn)
function ileNet(now) {
  if (now - LN.tnT < 100) return;
  LN.tnT = now;
  const r = net.room;
  if (!r) return;
  let peers = [];
  try {
    peers = r.peers() || [];
  } catch (_) {}
  const me = peers.find(p => p.isMe && p.sameTab),
    L = [];
  for (const p of peers) {
    const pr = p.presence;
    if ((p.isMe && p.sameTab) || !pr || pr.st !== 'play' || !(+pr.tt > 0)) continue;
    let etat = null;
    try {
      const s = JSON.stringify(pr.dn);
      if (typeof s === 'string' && s.length <= dnMax()) etat = pr.dn;
    } catch (_) {}
    L.push({
      id: String(p.peer),
      nom: nmClean(pr.nm),
      heros: jeuHeros(IleDesCinq, pr.el) ? pr.el : 'feu',
      rang: 1,
      depuis: +pr.tt,
      etat
    });
  }
  try {
    IleDesCinq.pairs(L, { id: me ? String(me.peer) : '', nom: LN.nm, depuis: LN.tt || 0 });
  } catch (e) {
    console.error(e);
  }
}
// le panneau du premier portail : les cartes de héros (heroCards : la même carte qu'au hall et au deuxième portail ; la partie se lance par le bouton du bas, V11.3), et le bouton de la partie guidée
function syncHeroes() {
  heroCards('sGrid');
}
syncHeroes();
$('sTuto').onclick = () => ileTuto();
$('sTuto').classList.toggle('hot', !save.tuto);
