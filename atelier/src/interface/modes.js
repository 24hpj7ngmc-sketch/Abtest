// [interface/modes.js] Les réglages (le son, le mode de tir et le mode dev se changent sur la carte, V11.3) et ceux du premier portail : mode de jeu (normal, difficile), campagne et ses niveaux ; rangs qui paient (PAYK) ; options du mode dev (dev), son.
// ---------- mode de tir : bouton, 100 % auto, ou auto dès qu'un ennemi est dans le viseur ----------
const FM = { btn: 'bouton', auto: '100 % auto', cible: 'auto sur cible' },
  FMK = ['btn', 'auto', 'cible'];
const fireMode = () => (FM[save.fire] ? save.fire : 'cible');
function fireNext() {
  save.fire = FMK[(FMK.indexOf(fireMode()) + 1) % FMK.length];
  persist();
}

// ---------- mode de jeu : normal (des défenses se gèrent seules) ou difficile (tout à la main) ----------
const MODES = { normal: 'Normal', hard: 'Difficile' },
  MODED = {
    normal:
      "20 vagues très fournies. Des défenses se posent, s'améliorent et s'adaptent seules, payées par un pot que remplissent leurs victimes. Ton or, c'est ce que tu tues toi-même.",
    hard: "10 vagues. Rien ne se pose tout seul, et tout l'or est pour toi."
  };
const gameMode = () => (save.mode === 'hard' ? 'hard' : 'normal');
// La campagne : save.camp[type] = le plus haut niveau fini ; save.stage = le niveau choisi ('feu2'), vide = partie libre (les modes Normal et Difficile d'avant).
if (!save.camp || typeof save.camp !== 'object') save.camp = {};
// Dernier Toit : r = le plus haut rang où l'on a été secouru, sel = le rang choisi au portail
if (!save.toit || typeof save.toit !== 'object') save.toit = { r: 0, sel: 1 };
{
  const T = save.toit,
    n = (v, a, b) => {
      v = Math.round(+v);
      return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a;
    };
  save.toit = { r: Math.max(n(T.r, 0, 4), save.rec && save.rec.toit >= 10 ? 1 : 0), sel: n(T.sel, 1, 4) };
}
// LES RANGS PAIENT : ce que rapporte une partie est multiplié par PAYK[rang − 1], aux deux portails (niveau de campagne sur l'île, rang sur le toit)
const PAYK = [1, 1.25, 1.5, 2],
  payT = k => String(k).replace('.', ',');
// les colonnes de la campagne, dans l'ordre de son dessin ; la sixième, le Vent, depuis L'Île des Cinq V2.2 (lobby V12.6)
const CAMPO = ['eau', 'feu', 'elec', 'terre', 'bois', 'vent'],
  campOpen = (e, l) => l >= 1 && l <= CAMPN && l <= (save.camp[e] || 0) + 1;
function campOf() {
  const st = typeof save.stage === 'string' ? save.stage : '',
    e = st.slice(0, -1),
    l = +st.slice(-1);
  return CAMPO.includes(e) && campOpen(e, l) ? { el: e, l } : null;
}
const campN = c => EL[c.el].n + ' · niveau ' + c.l,
  CAMPD = {
    inc: 'sa traînée de flammes te brûle et fait taire tes défenses',
    soi: 'il soigne les ennemis autour de lui, tue-le en premier',
    bro: "tes défenses proches de lui ne tirent plus tant qu'il vit",
    gol: 'gros et lent, il se casse en trois Éclats en mourant',
    sem: 'en mourant il laisse une graine : détruis-la vite, sinon il repousse',
    tou: 'ses bourrasques poussent les ennemis proches de lui vers le cœur'
  };
function drawMode() {
  const m = gameMode(),
    cp = campOf();
  $('sMode').innerHTML =
    '<span>Partie libre</span>' +
    Object.keys(MODES)
      .map(k => `<button class="tchip${!cp && k === m ? ' sel' : ''}" data-k="${k}">${MODES[k]}</button>`)
      .join('') +
    `<small>${cp ? '' : MODED[m]}</small>`;
  $('sCamp').innerHTML = CAMPO.map(
    e =>
      `<div class="cst" style="--c:${EL[e].c}"><b>${EL[e].n}</b>${CAMPK.map((_, i) => {
        const l = i + 1,
          done = (save.camp[e] || 0) >= l,
          open = campOpen(e, l);
        return `<button class="tchip${open ? '' : ' lock'}${done ? ' done' : ''}${cp && cp.el === e && cp.l === l ? ' sel' : ''}" data-s="${e + l}" data-l="${l}">${l}${done ? ' ✓' : ''}</button>`;
      }).join('')}</div>`
  ).join('');
  $('sCampD').textContent = cp
    ? campN(cp) +
      ' : ' +
      CAMPW +
      ' vagues, surtout des ennemis de ' +
      EL[cp.el].n +
      (cp.l > 1
        ? ', ' + Math.round((CAMPK[cp.l - 1] - 1) * 100) + ' % plus résistants, gains ×' + payT(PAYK[cp.l - 1])
        : '') +
      '. ' +
      EL[Object.keys(BEATS).find(k => BEATS[k] === cp.el)].n +
      ' les bat.' +
      (CAMPS[cp.el] ? ' Attaquant spécial : ' + KINDS[CAMPS[cp.el]].n + ' (' + CAMPD[CAMPS[cp.el]] + ').' : '')
    : 'Six types, quatre niveaux : finis le 1 pour ouvrir le 2.';
  $('sCamp')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          const e = b.dataset.s.slice(0, -1),
            l = +b.dataset.l;
          if (!campOpen(e, l)) {
            toast("Finis d'abord " + EL[e].n + ' · niveau ' + (l - 1));
            return;
          }
          save.stage = save.stage === b.dataset.s ? '' : b.dataset.s;
          persist();
          drawMode();
        })
    );
  $('sMode')
    .querySelectorAll('.tchip')
    .forEach(
      b =>
        (b.onclick = () => {
          save.mode = b.dataset.k;
          save.stage = '';
          persist();
          drawMode();
        })
    );
}
drawMode();

// ---------- mode dev : pose tout seul des défenses et donne des raccourcis de test ----------
const dev = Object.assign({ auto: false, god: true, hgod: true, speed: 1, fly: false }, save.devOpt || {});
function devKeep() {
  save.devOpt = dev;
  persist();
}
function devToggle() {
  save.dev = !save.dev;
  persist();
}
function sndToggle() {
  save.snd = save.snd === false;
  persist();
  SND.set(save.snd !== false);
  if (save.snd) SND.play('clear');
}
