// outils.js — la barre d'outils (bas centre : Fusil, Masse, Marteau, Leurre, Frappe), la sous-barre (armes au fusil en mode fuite,
// types de tourelle au marteau), le choix de l'arme (setWeap) et la visée d'un emplacement de tourelle au marteau (pickSlot).
// Utilise des règles : WEAP / WKEYS, weapOf, TKEYS / TT (tourelles), SLOTS, slotOn, placedCount, viewDir, eyeP, rayWall ; des sons : SND.
// Les tests appellent setTool (aussi par __dt.setTool), setWeap et lisent tool, ptype.

// ---------------------------------------------------------------- la barre d'outils (bas centre)
const ICON = {
  fusil: '<svg viewBox="0 0 24 24"><path d="M2 10h15l4-2v4l-4 1H9l-2 5H4l1-5H2z"/></svg>',
  marteau: '<svg viewBox="0 0 24 24"><path d="M14 4l6 6-3 3-6-6zM11 7L3 18l3 3 11-8"/></svg>',
  leurre:
    '<svg viewBox="0 0 24 24"><rect x="5" y="9" width="14" height="10" rx="2"/><path d="M15 9V3M9 14h.01M12 14a2 2 0 1 0 0 .01"/></svg>',
  frappe: '<svg viewBox="0 0 24 24"><path d="M12 2l3 8 7 2-7 2-3 8-3-8-7-2 7-2z"/></svg>',
  masse: '<svg viewBox="0 0 24 24"><path d="M3 21l10.4-10.4"/><path d="M13.1 3.9l7 7-3.2 3.2-7-7z"/></svg>',
  // V4.7 : le grappin (un crochet à trois griffes au bout de sa corde)
  grappin:
    '<svg viewBox="0 0 24 24"><path d="M12 2v13"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M4 13l2-2 2 2M16 13l2-2 2 2"/><path d="M3 22c3-1 6-4 9-7"/></svg>'
};
// need : la case de l'arbre qui débloque l'outil (S.P[need].on) ; out : mode « Ils s'échappent » seulement
// la Masse (V1.5) : seulement en mode fuite, verrouillée tant que le nœud « Masse » n'est pas acheté
const TOOLS = [
  { k: 'fusil', n: 'Fusil' },
  { k: 'masse', n: 'Masse', need: 'masse', out: 1 },
  { k: 'marteau', n: 'Marteau' },
  { k: 'leurre', n: 'Leurre', need: 'leu' },
  { k: 'frappe', n: 'Frappe', need: 'air' },
  { k: 'grappin', n: 'Grappin', need: 'grap', out: 1 } // V4.7 : Survie → Tyrolienne → Grappin
];
// l'outil est utilisable dans cette partie (mode et déblocage)
const toolOk = t => (!t.out || S.mode === 'out') && (!t.need || !!S.P[t.need].on);
// fabrique les cases de la barre (une fois, au lancement) ; un outil verrouillé dit où le débloquer
function hotBuild() {
  $('hot').innerHTML = TOOLS.map(
    t => `<button class="slot" data-k="${t.k}"${t.out ? ' hidden' : ''}>${ICON[t.k]}<small>${t.n}</small><i></i></button>`
  ).join('');
  $('hot')
    .querySelectorAll('.slot')
    .forEach(btn =>
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        barT = performance.now();
        const t = TOOLS.find(q => q.k === btn.dataset.k);
        if (t.out && S.mode !== 'out') return;
        if (t.need && !S.P[t.need].on) {
          toast(
            t.k === 'masse'
              ? 'Masse : à débloquer dans les améliorations (Survie)'
              : t.k === 'grappin'
                ? 'Grappin : à débloquer dans les améliorations (Survie, après la Tyrolienne)'
                : 'À débloquer dans les améliorations'
          );
          SND.play('no');
          return;
        }
        setTool(t.k);
      })
    );
}
// prendre un outil en main (changer d'outil annule le coup de masse en cours, la visée et le tir du sniper)
function setTool(k) {
  if (tool === k) return;
  if (tool === 'masse' && S) {
    S.swing = 0;
    S.swingHit = 1;
  }
  tool = k;
  ads = false;
  snipe = false;
  fireQ = 0;
  SND.play('click');
  subBuild();
}
// couleur de chaque arme (menu, sous-barre)
const WCOL = { fusil: '#d8dde2', pistolet: '#ffcf5a', assaut: '#ff8a3d', sniper: '#7fd8ff', pompe: '#b9d66a', lance: '#ff5a36' };
// changer d'arme (mode fuite) : gardée dans la sauvegarde ; un court délai avant le premier tir
function setWeap(k) {
  if (!S || S.mode !== 'out' || !WEAP[k] || S.weap === k) return;
  S.weap = k;
  save.weap = k;
  store();
  ads = false;
  snipe = false;
  fireQ = 0;
  S.p.fireT = Math.max(S.p.fireT, 0.25);
  SND.play('click');
  subBuild();
  toast(WEAP[k].n + (WEAP[k].scope ? ' : tiens Tir pour la lunette, relâche pour tirer' : ''), 1600);
}
// la sous-barre au-dessus de la barre : les armes (fusil en main, mode fuite) ou les types de tourelle et le compte (marteau)
function subBuild() {
  const sous = $('sub');
  if (tool === 'fusil' && S && S.mode === 'out') {
    sous.hidden = false;
    sous.innerHTML = WKEYS.map(
      k => `<button class="tchip${k === S.weap ? ' sel' : ''}" data-w="${k}" style="--c:${WCOL[k]}">${WEAP[k].short}</button>`
    ).join('');
    sous.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        barT = performance.now();
        setWeap(btn.dataset.w);
      })
    );
    return;
  }
  if (tool !== 'marteau' || !S) {
    sous.hidden = true;
    return;
  }
  sous.hidden = false;
  const P = S.P;
  sous.innerHTML =
    TKEYS.filter(k => P[k].on)
      .map(k => `<button class="tchip${k === ptype ? ' sel' : ''}" data-k="${k}" style="--c:${TT[k].c}">${TT[k].n}</button>`)
      .join('') + `<span class="tchip" id="tCount"></span>`;
  sous.querySelectorAll('button').forEach(btn =>
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      barT = performance.now();
      ptype = btn.dataset.k;
      SND.play('click');
      subBuild();
    })
  );
}
// à chaque image : nom de l'arme, cases cachées / verrouillées / choisies, recharges, barre qui s'efface (3,5 s sans appui, fusil en main)
function hotTick() {
  const P = S.P;
  $('hot')
    .querySelectorAll('.slot')
    .forEach(btn => {
      if (btn.dataset.k === 'fusil') {
        const nomEl = btn.querySelector('small'),
          nom = weapOf(S).short;
        if (nomEl.textContent !== nom) nomEl.textContent = nom;
      }
      const k = btn.dataset.k,
        t = TOOLS.find(q => q.k === k),
        lock = t.need && !P[t.need].on,
        cache = !!t.out && S.mode !== 'out';
      if (btn.hidden !== cache) btn.hidden = cache;
      btn.classList.toggle('sel', k === tool);
      btn.classList.toggle('lock', !!lock);
      const recharge =
        k === 'leurre'
          ? S.leuCd / P.leu.cd
          : k === 'frappe'
            ? S.airCd / P.air.cd
            : k === 'grappin'
              ? (S.grapCd || 0) / P.grap.cd
              : k === 'masse' && S.swingT > 0
                ? S.swing / S.swingT
                : 0;
      btn.querySelector('i').style.height = (recharge > 0 ? recharge * 100 : 0) + '%';
    });
  $('act').classList.toggle('quiet', performance.now() - barT > 3500 && tool === 'fusil');
  const compte = $('tCount');
  if (compte) compte.textContent = placedCount(save) + ' / ' + P.turrets + ' tourelles';
  // mode fuite : la classe mOut sur <html> (5 outils : la barre glisse un peu à gauche, voir style.css)
  const fuite = S.mode === 'out';
  if (hotTick._m !== fuite) {
    hotTick._m = fuite;
    document.documentElement.classList.toggle('mOut', fuite);
  }
}

// ---------------------------------------------------------------- viser un emplacement de tourelle au marteau
// l'emplacement le plus proche de l'axe du regard (à moins de 95 m, pas derrière un mur) ; −1 si aucun
function pickSlot() {
  const p = S.p,
    dir = viewDir(p),
    oeil = eyeP(p),
    ex = oeil[0],
    ey = oeil[1],
    ez = oeil[2];
  let best = -1,
    bestScore = 1e9;
  for (const s of SLOTS) {
    if (!slotOn(S.P, s, S.mode)) continue;
    const sy = (s.k === 'mur' ? S.P.murH : s.y) + 0.4,
      vx = s.x - ex,
      vy = sy - ey,
      vz = s.z - ez,
      dist = Math.hypot(vx, vy, vz);
    if (dist > 95) continue;
    const cos = (vx * dir[0] + vy * dir[1] + vz * dir[2]) / dist;
    if (cos < 0.9) continue;
    const ang = Math.acos(Math.min(1, cos)),
      tol = Math.max(0.05, 1.6 / dist);
    if (ang > tol * 2.2) continue;
    if (rayWall(ex, ey, ez, vx / dist, vy / dist, vz / dist, dist) < dist - 0.9) continue;
    const score = ang / tol + dist * 0.002;
    if (score < bestScore) {
      bestScore = score;
      best = s.id;
    }
  }
  return best;
}
// le nom d'une porte barricadable (marteau en main, mode fuite) ; « arrivée » = l'escalier qui descend vers l'étage du dessous
function doorName(D) {
  return D.kind === 'toit'
    ? 'Porte du toit'
    : D.kind === 'escalier'
      ? D.sens === 'montée'
        ? 'Escalier (monte)'
        : 'Escalier (descend)'
      : 'Porte';
}
