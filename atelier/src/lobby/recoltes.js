// [lobby/recoltes.js] Les récoltes : chaque bâtiment qui produit a une réserve, qu'on ramasse en passant ; préparatifs pour la prochaine partie.
// ---- LES RÉCOLTES (V8.6) : le village travaille pour le joueur. Chaque bâtiment qui produit a une réserve, qui se remplit à chaque partie terminée et, plus lentement, avec le temps.
// On ramasse en passant devant le bâtiment : rien à toucher. Trois réserves de ressources (mine et musée : or céleste ; hall : éclats du héros incarné)
// et trois préparatifs pour la prochaine partie, un seul d'avance chacun (marchand : bourse de départ ; salle d'armes : affûtage ; verger : provisions).
const HVH = 6,
  HVI = 8; // heures pour remplir une réserve de ressources vide sans jouer ; heures pour qu'un préparatif soit prêt sans jouer (sinon : deux parties)
const artN = () => LOOT.filter(A => save.loot[A[0]] > 0).length;
const HV = {
  mine: { u: 'or', per: l => MINEG[l] },
  musee: { u: 'or', per: l => 5 * l + 5 * artN() },
  hall: { u: 'éclats', per: l => 20 + 10 * l },
  marchand: { it: 'boost', n: 'Bourse de départ', v: () => BOOST_G, t: v => '+' + v + ' or au départ' },
  armes: { it: 'aff', n: 'Affûtage', v: l => 8 + 2 * l, t: v => '+' + v + ' % de dégâts' },
  verger: { it: 'prov', n: 'Provisions', v: l => 10 + 5 * l, t: v => '+' + v + ' PV' }
};
if (!save.hv || typeof save.hv !== 'object' || !save.hv.s || typeof save.hv.s !== 'object')
  save.hv = { t: Date.now(), s: {} };
if (!save.prep || typeof save.prep !== 'object') save.prep = {};
const hvB = k => myVil().find(B => B.t === k),
  hvCap = (k, l) => (HV[k].it ? 1 : HV[k].per(l) * 3),
  hvHeld = k => (HV[k].it === 'boost' ? !!save.boost : !!save.prep[HV[k].it]);
// f : en parties terminées pour une ressource (1 = le gain d'une partie), en part de préparatif sinon (1 = prêt). Un bâtiment tout neuf arrive avec une première récolte.
function hvAdd(k, f) {
  const B = hvB(k);
  if (!B) return;
  const l = lvOf(B),
    H = HV[k];
  if (typeof save.hv.s[k] !== 'number') save.hv.s[k] = H.it ? 1 : H.per(l);
  save.hv.s[k] = Math.min(hvCap(k, l), save.hv.s[k] + (H.it ? f : f * H.per(l)));
}
function hvGrow() {
  const now = Date.now(),
    h = Math.max(0, Math.min(48, (now - (save.hv.t || now)) / 3.6e6));
  if (h < 0.01 && !Object.keys(HV).some(k => hvB(k) && typeof save.hv.s[k] !== 'number')) return;
  save.hv.t = now;
  for (const k in HV) hvAdd(k, HV[k].it ? h / HVI : (3 * h) / HVH);
}
function hvGame() {
  for (const k in HV) hvAdd(k, HV[k].it ? 0.5 : 1);
}
// ce qu'il y a à ramasser dans un bâtiment : {n: quantité} pour une ressource (par paquets de 5, à partir d'une demi-partie), {it: 1} pour un préparatif prêt qu'on n'emporte pas déjà
function hvReady(B) {
  const H = HV[B.t];
  if (!H) return null;
  const s = save.hv.s[B.t] || 0,
    l = lvOf(B);
  if (H.it) return s >= 1 && !hvHeld(B.t) ? { it: 1 } : null;
  const n = Math.floor(s / 5) * 5;
  return n >= Math.max(5, Math.floor(H.per(l) / 2)) ? { n } : null;
}
function hvTake(B) {
  const R = hvReady(B),
    H = HV[B.t],
    C = CAT[B.t];
  if (!R) return false;
  if (R.it) {
    const v = H.v(lvOf(B));
    if (H.it === 'boost') save.boost = 1;
    else save.prep[H.it] = v;
    save.hv.s[B.t] -= 1;
    toast(C.n + ' : ' + H.n.toLowerCase() + ' (' + H.t(v) + ' à ta prochaine partie)');
  } else {
    if (H.u === 'or') save.gold += R.n;
    else save.sh[tHero] += R.n;
    save.hv.s[B.t] -= R.n;
    toast(C.n + ' : +' + R.n + (H.u === 'or' ? ' or céleste' : ' éclats pour ' + EL[tHero].hero));
  }
  toastT = 3;
  SND.play('coin');
  persist();
  lobSync();
  return true;
}
// l'étiquette qui flotte au-dessus d'un bâtiment quand il a quelque chose pour le joueur (visible de loin, reprise sur la carte)
function hvLabel(B) {
  if (B.t === 'taverne') return save.q.some(q => q && q.p >= q.n) ? ['DÉFI RÉUSSI', 'récompense à réclamer'] : null;
  const R = hvReady(B);
  if (!R) return null;
  const H = HV[B.t];
  return R.it
    ? [H.n.toUpperCase(), 'prête : passe devant']
    : ['+' + R.n + (H.u === 'or' ? ' OR' : ' ÉCLATS'), 'à ramasser en passant'];
}
function hvSync() {
  for (const g of vilV.values()) {
    const h = g.userData.hv;
    if (!h) continue;
    const Bm = myB(g.userData.B),
      tx = Bm ? hvLabel(Bm) : null;
    if (h.visible !== !!tx) h.visible = !!tx;
    if (tx) lobText(h, tx[0], tx[1], '#ffcf5a');
  }
}
const prepText = () => {
  const P = [];
  if (save.boost) P.push('bourse +' + BOOST_G + ' or');
  if (save.prep.aff) P.push('affûtage +' + save.prep.aff + ' % de dégâts');
  if (save.prep.prov) P.push('provisions +' + save.prep.prov + ' PV');
  return P;
};
let upB = null;
function upOpen(B) {
  upB = B;
  $('upV').hidden = false;
  SND.play('tick');
  upDraw();
}
function vilRe(B) {
  const old = vilV.get(B.id);
  if (old) lob.remove(old);
  const g = vilView(B);
  vilV.set(B.id, g);
  if (B.t === 'hall') hallV = g;
  if (B.t === 'musee') museeV = g;
  g.userData.pop = 0;
  terrLocks();
  vilGround();
}
function upDraw() {
  const B = upB,
    C = CAT[B.t],
    l = lvOf(B),
    D = UPD[B.t],
    mx = l >= (C.mx || 3),
    c = UPC[l + 1],
    lag = B.t === 'hall' ? save.vil.filter(o => o !== B && CAT[o.t].up && lvOf(o) < l) : [],
    why = mx
      ? ''
      : save.dev
        ? ''
        : B.t === 'hall' && lag.length
          ? "Monte d'abord tout le village au niveau " + l + ' : ' + [...new Set(lag.map(o => CAT[o.t].n))].join(', ')
          : B.t !== 'hall' && l >= bLv('hall')
            ? "Fais d'abord évoluer le Hall des héros (niveau " + (l + 1) + ')'
            : save.gold < c && !save.dev
              ? 'Il te manque ' + (c - save.gold) + ' or'
              : '';
  $('upT').textContent = C.n + ' · niveau ' + l;
  $('upB').innerHTML =
    `<div class="srow"><span><b>${D[0]}</b><small>Niveau ${l} : ${D[1](l)}${mx ? ' (maximum)' : ' → niveau ' + (l + 1) + ' : ' + D[1](l + 1)}</small></span><button class="solid" id="upGo"${mx || why ? ' disabled' : ''}>${mx ? 'Maximum' : save.dev ? 'Améliorer' : c + ' or'}</button></div>` +
    (() => {
      const H = HV[B.t];
      if (!H) return '';
      const s = save.hv.s[B.t] || 0;
      return H.it
        ? `<div class="srow"><span><b>${H.n}</b><small>${H.t(H.v(l))} à ta prochaine partie. Prête toutes les deux parties, ou en ${HVI} h. ${s >= 1 ? (hvHeld(B.t) ? 'Prête, mais tu en emportes déjà une.' : 'Prête : passe devant le bâtiment.') : 'En préparation : ' + Math.round(s * 100) + ' %.'}</small></span></div>`
        : `<div class="srow"><span><b>Récolte</b><small>+${H.per(l)} ${H.u} à chaque partie terminée, et un peu avec le temps. En réserve : ${Math.floor(s)} sur ${hvCap(B.t, l)}. On ramasse en passant devant.</small></span></div>`;
    })() +
    `<p>${mx ? 'Ce bâtiment est à son niveau maximum.' : why || "Le bâtiment s'agrandit. +20 renom."}</p>`;
  if (!mx && !why)
    $('upGo').onclick = () => {
      if (!save.dev) save.gold -= c;
      B.l = l + 1;
      vilRe(B);
      persist();
      SND.play(B.t === 'hall' ? 'win' : 'pure');
      if (B.t === 'hall') {
        {
          const nw = CATK.filter(k => CAT[k].lv === B.l).map(k => CAT[k].n);
          toast(
            'ÉVOLUTION ' +
              B.l +
              " : l'île s'agrandit, le relief monte" +
              (nw.length ? ' · nouveau : ' + nw.join(', ') : '')
          );
          toastT = 6;
        }
        $('upV').hidden = true;
      } else toast(C.n + ' : niveau ' + B.l);
      lobSync();
      if (B.t !== 'hall') upDraw();
    };
}
