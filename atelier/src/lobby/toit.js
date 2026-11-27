// [lobby/toit.js] Dernier Toit derrière le deuxième portail : panneau, bonus emportés, ouverture, paie au retour (toitFin), écran de retour.
// ---- DERNIER TOIT (V10.1) : le jeu derrière le deuxième portail. Il n'est pas mêlé au code du lobby : dt/dt-pour-lobby.js (collé tel quel par build.py) donne une seule variable,
// DernierToit, qui ouvre le jeu dans un cadre par-dessus l'île (contrat : dt/LOBBY.md). Ici : le panneau du portail (héros, arme, ce qu'on emporte), la conversion de ce que le lobby
// apporte en « bonus », la pause du lobby pendant la partie (frame() ne fait plus rien, le son est suspendu), les récompenses à chaque partie finie, et le retour devant le portail.
// Le lobby ne touche jamais à la sauvegarde de Dernier Toit (localStorage « dernier-toit-v1 »).
const wPic = w => (typeof WPHOTO === 'object' && WPHOTO[w] ? `<img class="wpic" src="${WPHOTO[w]}" alt="">` : ''),
  dtOk = () => typeof DernierToit === 'object' && !!DernierToit;
// TR : la visite en cours (héros, arme, jour de départ, gains cumulés)
let TR = null;
// ce que le lobby apporte à une partie de Dernier Toit : l'arbre Général et l'arbre « Dernier Toit » de l'arme (dégâts, cadence, critique), l'arbre du héros (force et recharge de la compétence, vie),
// l'affûtage et les provisions. V10.2 : tout l'arbre du héros (heros), ses balles d'élément (balles) et les niveaux (niveaux) partent aussi, pour que le héros vaille pareil aux deux portails ;
// Dernier Toit les lit depuis sa V4.2 (rang, argent, heros, balles, niveaux) et joue à plusieurs depuis sa V4.3 (multi) : il est collé dans la page, le lobby n'a plus à s'en assurer.
const r3 = v => Math.round(v * 1000) / 1000;
const dtLit = k => dtOk() && Array.isArray(DernierToit.accepte) && DernierToit.accepte.includes(k);
function toitBonus(el, w) {
  const a = armMods('toit', w, {}),
    B = WT[w].base || {},
    b = k => B[k] || 0,
    hm = {};
  for (const n of HT[el].nodes) hm[n.key] = r3((hm[n.key] || 0) + (save.hl[el][n.id] || 0) * n.inc);
  const CD =
    { feu: BAL.fbCd, eau: BAL.tideCd, bois: BAL.ronceCd, terre: BAL.rempartCd, elec: BAL.dashCd, vent: 14 }[el] || 20;
  return {
    degats: r3(((1 + (a.hDmg || 0)) / (1 + b('hDmg'))) * (1 + (a.tDmg || 0)) * (1 + (save.prep.aff || 0) / 100)),
    cadence: r3(((1 - b('hCd')) / Math.max(0.05, 1 - (a.hCd || 0))) * (1 + (a.tCd || 0))),
    critique: r3((a.hCrit || 0) - b('hCrit') + (a.tCrit || 0)),
    vie: Math.round((hm.hHp || 0) + (save.prep.prov || 0)),
    heroDegats: r3(1 + (hm.abDmg || 0)),
    recharge: r3(Math.max(0.4, (CD - (hm.abCd || 0)) / CD)),
    heros: hm,
    // la branche d'élément envoyée : celle de l'arme dès que le jeu dit la lire ('elementArme' dans DernierToit.accepte), sinon celle du héros comme avant (V12.2)
    balles: elMods(dtLit('elementArme') ? wEl(w, el) : el, {}),
    niveaux: { heros: hLevel(el), arme: wLevel(w) }
  };
}
// le rang joué : celui choisi, sans dépasser le premier rang pas encore fini
const toitRang = () => Math.max(1, Math.min(PAYK.length, save.toit.sel || 1, (save.toit.r || 0) + 1));
function toitDraw() {
  const A = armsOf('toit');
  if (!A.includes(tWeap) && A.length) setWeap(A[0]);
  $('dtVer').textContent = dtOk() ? 'version ' + DernierToit.version : '';
  $('dtArms').innerHTML =
    '<span>Ton arme</span>' +
    A.map(
      w =>
        `<button class="tchip${w === tWeap ? ' sel' : ''}" data-w="${w}">${wPic(w)}${WT[w].short} · niv. ${wLevel(w)}</button>`
    ).join('');
  $('dtArms')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          setWeap(b.dataset.w);
          lobSync();
          toitDraw();
        })
    );
  const rs = toitRang(),
    R0 = save.toit.r || 0;
  // même dessin que la campagne de l'île : une colonne de niveaux, le 1 en bas (V11.5)
  $('dtRang').innerHTML =
    '<div class="cst" style="--c:var(--gold)"><b>Dernier Toit</b>' +
    PAYK.map((_, i) => {
      const l = i + 1;
      return `<button class="tchip${l <= R0 + 1 ? '' : ' lock'}${R0 >= l ? ' done' : ''}${rs === l ? ' sel' : ''}" data-l="${l}">${l}${R0 >= l ? ' ✓' : ''}</button>`;
    }).join('') +
    '</div>';
  $('dtRangD').textContent =
    `${rs > 1 ? 'zombies +' + Math.round((CAMPK[rs - 1] - 1) * 100) + ' % de vie · gains ×' + payT(PAYK[rs - 1]) : R0 ? 'gains de base' : 'Quatre niveaux : sois secouru au 1 pour ouvrir le 2, plus dur, mieux payé.'}`;
  $('dtRang')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          const l = +b.dataset.l;
          if (l > R0 + 1) {
            toast("Sois d'abord secouru au rang " + (l - 1));
            return;
          }
          save.toit.sel = l;
          persist();
          SND.play('tick');
          toitDraw();
        })
    );
  heroCards('dtGrid', toitDraw);
  goTxt('dtGo', dtOk() ? DernierToit : null, tHero);
  welRow('dtWel', tWeap, toitDraw);
  const B = toitBonus(tHero, tWeap),
    L = [],
    pc = v => (v >= 1 ? '+' : '−') + Math.abs(Math.round((v - 1) * 100)) + ' %';
  if (B.degats !== 1) L.push('dégâts ' + pc(B.degats));
  if (B.cadence !== 1) L.push('cadence ' + pc(B.cadence));
  if (B.critique) L.push('critique ' + (B.critique > 0 ? '+' : '−') + Math.abs(Math.round(B.critique * 100)) + ' pts');
  if (B.vie) L.push('vie +' + B.vie);
  if (B.heroDegats !== 1) L.push('compétence ' + pc(B.heroDegats));
  if (B.recharge !== 1) L.push('recharge ' + pc(B.recharge));
  if (save.boost) L.push('bourse +' + BOOST_G + ' $');
  $('dtPrep').textContent =
    (L.length
      ? 'Tu emportes : ' + L.join(' · ') + '.'
      : "Rien à emporter pour l'instant : monte ton arme à la salle d'armes et ton héros au hall, le verger et la salle d'armes préparent le reste.") +
    " L'arbre de " +
    EL[tHero].hero +
    " et l'élément de ses balles comptent aussi ; seule la portée de l'arme ne change pas sur le toit.";
  const r = save.rec.toit || 0;
  $('dtRec').textContent = r
    ? 'Ton record : ' +
      r +
      ' jour' +
      (r > 1 ? 's' : '') +
      ' tenu' +
      (r > 1 ? 's' : '') +
      (r >= 10 ? ' (secouru)' : '') +
      '.'
    : 'Tiens dix jours pour être secouru.';
}
function toitOpen() {
  if (!dtOk()) {
    toast("Dernier Toit n'est pas chargé dans cette page");
    return;
  }
  toitDraw();
  $('toitV').hidden = false;
  SND.play('tick');
}
function toitGo(el) {
  if (!HEROS.includes(el)) el = tHero;
  if (dtOk() && !jeuHeros(DernierToit, el)) {
    toast(EL[el].hero + " n'est pas encore dans Dernier Toit");
    return;
  }
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
    lobNetSt('toit', { tt: LN.tt, tr: toitRang(), nm: LN.nm, el, dn: null });
  }
  if (!dtOk() || DernierToit.ouvert || !HEROS.includes(el)) return;
  const A = armsOf('toit'),
    w = A.includes(tWeap) ? tWeap : A[0],
    bonus = toitBonus(el, w),
    rg = toitRang(),
    usePrep = !!(save.prep.aff || save.prep.prov);
  let useBoost = false;
  tHero = el;
  save.last = el;
  // le rang : c'est Dernier Toit qui durcit les zombies (champ « rang »). La bourse du marchand : comme l'affûtage et les provisions, elle n'est dépensée que lorsqu'il a dit « prêt »
  if (save.boost) {
    bonus.argent = BOOST_G;
    useBoost = true;
  }
  persist();
  TR = { el, w, r: rg, n: 0, gold: 0, sh: 0, loot: [], days: 0, best: 0, tues: 0, win: false, prime: 0, up: 0 };
  $('toitV').hidden = true;
  LB.a = null;
  LB.hold = false;
  joy.id = null;
  joy.f = joy.r = 0;
  joy.full = 0;
  $('knob').style.transform = '';
  SND.hold(true);
  DernierToit.ouvrir(
    Object.assign(
      {
        heros: el,
        arme: w,
        rang: rg,
        bonus,
        role: ROLE[el],
        elementArme: wEl(w, el),
        voie: voieOf(el) ? { id: voieOf(el), nom: VOIES[el][voieOf(el)].n } : null
      },
      net.room ? { multi: { nom: LN.nm, depuis: LN.tt, max: dnMax() } } : {}
    ),
    {
      etat: toitEtat,
      pret: () => {
        toitSos(false);
        if (!TR) return;
        if (!TR.pret) {
          if (usePrep) save.prep = {};
          if (useBoost) save.boost = 0;
          if (usePrep || useBoost) persist();
        }
        TR.pret = true;
      },
      fin: toitFin,
      retour: toitBack
    }
  );
  clearTimeout(toitT);
  toitT = setTimeout(() => {
    if (TR && !TR.pret && DernierToit.ouvert) toitSos(true);
  }, 12000);
}
// issue de secours : si Dernier Toit n'a pas dit « prêt » au bout de 12 s (cadre resté vide, réseau coupé…), un bouton du lobby passe par-dessus le cadre pour revenir sur l'île
let toitT = 0;
function toitSos(on) {
  let b = $('dtSos');
  if (!on) {
    if (b) b.remove();
    return;
  }
  if (b) return;
  b = document.createElement('button');
  b.id = 'dtSos';
  b.textContent = 'Dernier Toit ne démarre pas' + " · Retour sur l'île";
  b.style.cssText =
    'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483600;padding:10px 16px;border-radius:999px;border:1px solid #ffcf5a;background:#0f2530;color:#ffcf5a;font:600 14px system-ui';
  b.onclick = () => {
    toitSos(false);
    DernierToit.fermer();
    toitBack();
  };
  document.body.appendChild(b);
}
// une partie finie (une fois par partie, « Rejouer » compris) : le barème commun (payOut), sur les journées tenues dans cette partie (12 au plus).
// QUELLES JOURNÉES : en remontant depuis le dernier jour tenu, tant que les zombies tués couvrent 70 % des hordes de ces journées (DAYZ : les hordes de Dernier Toit, 70 au jour 1 sans tourelle).
// Depuis Dernier Toit V4.2, « fin » donne le jour de départ (depart) et dit si le mode dev a servi (dev) : le lobby s'en sert, et garde le compte des tués comme garde-fou.
// Pourquoi ce garde-fou : la V4.1 ne disait son jour de départ qu'à l'ouverture (pret) ; « Rejouer » peut repartir du jour 3, 5 ou 7 (case Raccourci) sans le dire, et l'audit de la V10.2 a montré qu'on
// touchait alors des jours jamais joués en abandonnant aussitôt. Le compte des tués ferme aussi la porte aux jours sautés par le mode dev. Le jour de départ connu (première partie de la visite) borne le compte.
// Puis : record, étoile du héros et relique si secouru, rang suivant ouvert (prime la première fois, comme un niveau de campagne), défis de la taverne, réserves du village.
const DAYZ = [0, 70, 240, 420, 700, 1100, 1700, 2600, 3900, 5800, 8500],
  dayZ = d => (d <= 10 ? DAYZ[d] : Math.round(8500 * Math.pow(1.4, d - 10)));
function toitFin(m) {
  if (!TR || !m || typeof m !== 'object' || Array.isArray(m)) return;
  const el = HEROS.includes(m.heros) ? m.heros : TR.el,
    j = Math.max(1, Math.min(999, Math.round(+m.jour) || 1)),
    win = m.victoire === true,
    dep = Math.round(+m.depart),
    lo = Number.isFinite(dep) && dep >= 1 ? dep : m.sansFin ? 11 : 1,
    last = win ? j : j - 1,
    tr = Math.round(+m.tues),
    tues = Number.isFinite(tr) ? Math.max(0, Math.min(1e7, tr)) : 0;
  let days = 0,
    u = 0,
    boss = 0,
    need = 0;
  if (m.dev === true) {
    TR.n++;
    TR.dev = true;
    return;
  } // mode dev de Dernier Toit : ni gains, ni record, ni défis
  const multi = (Math.round(+m.joueurs) || 1) > 1,
    rg = multi ? Math.max(1, Math.min(TR.r, TR.hostR || TR.r)) : TR.r;
  if (multi) {
    let left = Math.max(0, Math.min(36000, Math.round(+m.duree) || 0));
    for (let d = last; d >= 1 && days < 12; d--) {
      const len = dayU(d) * 46;
      need += dayZ(d) * 0.1;
      if (left < len * 0.7 || tues < need) break;
      left -= len;
      days++;
      u += dayU(d);
      boss += dayBoss(d);
    }
  } else
    for (let d = last; d >= lo && days < 12; d--) {
      need += dayZ(d) * 0.7;
      if (tues < need) break;
      days++;
      u += dayU(d);
      boss += dayBoss(d);
    }
  TR.n++;
  TR.tues += tues;
  if (!days) {
    qGame({ game: 'toit', kills: tues, units: 0, days: 0, win: false, fini: false, el });
    persist();
    return;
  }
  const P = payOut(el, u, boss, win, PAYK[rg - 1] || 1),
    held = win ? Math.max(10, j) : j - 1;
  if (multi) {
    TR.multi = Math.max(TR.multi || 0, Math.min(8, Math.round(+m.joueurs) || 2));
    TR.rp = rg;
  }
  save.rec.toit = Math.max(save.rec.toit || 0, held);
  TR.gold += P.gold;
  TR.sh += P.sh;
  TR.days += days;
  TR.best = Math.max(TR.best, held);
  TR.el = el;
  if (win) {
    TR.win = true;
    save.loot.relique = (save.loot.relique || 0) + 1;
    TR.loot.push(LOOTN.relique);
    if (!save.loot['etoile_' + el]) {
      save.loot['etoile_' + el] = 1;
      TR.loot.push(LOOTN['etoile_' + el]);
    }
    if (!m.sansFin && (save.toit.r || 0) < rg) {
      save.toit.r = rg;
      TR.up = rg;
      TR.prime += 100 * rg;
      save.gold += 100 * rg;
    }
  }
  qGame({ game: 'toit', kills: tues, units: u, days, win, fini: days >= 3, el });
  hvGrow();
  hvGame();
  persist();
}
// « Retour au lobby » : le cadre est déjà retiré ; le lobby reprend devant le portail, avec ce qui a été gagné
function toitBack() {
  SND.hold(false);
  clearTimeout(toitT);
  toitSos(false);
  const T = TR;
  TR = null;
  lobSpawn('toit');
  lobSync();
  syncHeroes();
  if (!T || !T.n) return;
  $('eTitle').textContent = (T.win ? 'Dernier Toit · secouru' : 'Dernier Toit') + (T.r > 1 ? ' · rang ' + T.r : '');
  $('eText').textContent = T.days
    ? (T.n > 1 ? T.n + ' parties, ' : '') +
      T.days +
      ' jour' +
      (T.days > 1 ? 's' : '') +
      ' tenu' +
      (T.days > 1 ? 's' : '') +
      ', ' +
      T.tues +
      ' zombies tués.'
    : T.dev
      ? "Partie en mode dev : rien n'est compté."
      : 'Aucune journée tenue cette fois : rien à rapporter.';
  $('eGain').innerHTML = T.days
    ? (T.up
        ? `<span class="tchip sel">${T.up < PAYK.length ? 'Débloqué : rang ' + (T.up + 1) : 'Tous les rangs du toit sont finis'}</span><span class="tchip sel">Première fois : +${T.prime} or céleste</span>`
        : '') +
      `<span class="tchip">+${T.sh} éclats pour ${EL[T.el].hero}</span><span class="tchip sel">+${T.gold} or céleste</span>` +
      ((T.rp || T.r) > 1 ? `<span class="tchip">Gains ×${payT(PAYK[(T.rp || T.r) - 1])}</span>` : '') +
      (T.multi
        ? `<span class="tchip">À ${T.multi} sur le toit : payé au temps joué${T.rp && T.rp < T.r ? ', au rang ' + T.rp + " de l'hôte" : ''}</span>`
        : '') +
      T.loot.map(n => `<span class="tchip sel">Butin : ${n}</span>`).join('') +
      `<span class="tchip">Record : ${save.rec.toit || 0} jour${(save.rec.toit || 0) > 1 ? 's' : ''}</span>` +
      (myVil().some(B => hvLabel(B)) ? '<span class="tchip">À ramasser sur ton île</span>' : '')
    : '';
  $('end').hidden = false;
}
// l'écran de retour (#end) n'a qu'un bouton : « Retour sur l'île »
$('eAgain').onclick = () => {
  $('end').hidden = true;
};
