// [interface/tutoriel.js] Le tutoriel pas à pas de L'Île des Cinq : une vraie partie guidée, cœur invincible.
// ---------- tutoriel : une vraie partie guidée pas à pas, cœur invincible ----------
let tuto = null;
const tutoG = () => {
  const gs = (sim.next || []).filter(g => !g.hidden && !g.boss).sort((a, b) => b.count - a.count),
    g = gs[0] || { el: 'feu' };
  return { el: g.el, path: sectOf((sim.varc || [PATHA[0]])[0]) }; // le chemin du côté d'où ils viennent (V2.0 : ils débarquent tout le long de la côte)
};
// le côté de l'île d'où vient la vague, comme l'aperçu le dit (audit écran n° 21 : « côté Nord » contre « NORD-OUEST » à l'écran)
const tutoCote = () => {
  const A = sim.varc;
  return A && A[1] < 6.28 ? 'côté ' + coteOf(A[0]) : 'de partout';
};
const TUTO = [
  {
    t: () => "Bouge avec le pouce gauche sur le joystick. Pousse-le à fond vers l'avant pour sprinter.",
    ok: () => tuto.mv > 12
  },
  { t: () => "Regarde autour de toi : glisse le pouce droit sur l'écran.", ok: () => tuto.lk > 1.6 },
  {
    t: () => {
      const g = tutoG();
      return (
        "L'aperçu annonce la vague : des ennemis " +
        EL[g.el].n +
        ' débarquent ' +
        tutoCote() +
        ' et rejoignent la route vers le cœur. Prends le Marteau dans la barre du bas.'
      );
    },
    ok: () => tool === 'marteau'
  },
  {
    t: () => {
      const g = tutoG();
      return (
        'Va au bord du chemin ' +
        PATHS[g.path].name +
        ', vise le sol et touche « ' +
        EL[WEAKTO[g.el]].n +
        ' » dans la roulette à droite : ' +
        EL[WEAKTO[g.el]].n +
        ' bat ' +
        EL[g.el].n +
        '.'
      );
    },
    in: () => {
      tuto.n0 = sim.towers.length;
      sim.gold = Math.max(sim.gold, 300);
    },
    ok: () => sim.towers.length > tuto.n0
  },
  { t: () => 'Défense posée. Touche « Lancer la vague » : ça marche même en courant.', ok: () => sim.phase === 'wave' },
  {
    t: () =>
      "Reprends le Pistolet et tire sur les ennemis. Ton tir les marque d'un cercle blanc : tes défenses leur font alors 60 % de dégâts en plus.",
    ok: () => tuto.mark || (sim.phase === 'prep' && sim.wave > 0)
  },
  {
    t: () => 'Bien visé. Marque les plus dangereux et laisse tes défenses finir la vague.',
    ok: () => sim.phase === 'prep' && sim.wave > 0
  },
  // V2.0 (audit écran n° 6) : la vue du ciel, la grande nouveauté, s'apprend ici, sans chrono (ciel: vrai = interface/ciel.js monte la caméra)
  {
    ciel: true,
    t: () =>
      "Entre deux vagues, la caméra monte dans le ciel. Touche le sol près d'une route, puis un élément sur la roulette qui s'ouvre : une défense de plus.",
    in: () => {
      sim.gold += 300;
      tuto.n1 = sim.towers.length;
    },
    ok: () => sim.towers.length > tuto.n1
  },
  {
    ciel: true,
    t: () =>
      'Touche deux fois « Prêt », en bas à droite : la vague part. En vraie partie, elle part de toute façon au bout de ' +
      CIEL.prepT +
      ' s.',
    ok: () => sim.phase === 'wave'
  },
  {
    t: () =>
      "Améliore ta défense : approche-toi d'elle, touche Sneak et choisis un élément dans la roulette. L'étoile dorée est le conseil.",
    in: () => {
      sim.gold += 300;
    },
    ok: () => sim.towers.some(q => q.els.length > 1)
  },
  {
    t: () =>
      'Prends la Pelle, choisis « Mur », puis touche Action, la moitié basse du bouton du coin : une fois pour le point A, une fois pour le point B.',
    in: () => {
      sim.gold += 150;
      tuto.w0 = sim.walls.length + sim.pits.length;
    },
    ok: () => sim.walls.length + sim.pits.length > tuto.w0
  },
  {
    t: () =>
      'Ta compétence : touche deux fois de suite « ' +
      KIT[sim.hero.el].skill +
      ' », le long du bouton du coin (les petits boutons demandent deux appuis). Elle se recharge en quelques secondes.',
    in: () => {
      sim.hero.ab = 0;
    },
    ok: () => sim.hero.ab > 0
  },
  {
    t: () =>
      'Ton ultime se charge en jouant. Il est prêt : touche deux fois le bouton doré « ' + KIT[sim.hero.el].ult + ' ».',
    in: () => {
      sim.hero.ult = 100;
    },
    ok: () => sim.hero.ult < 60
  },
  {
    t: () =>
      'Tu sais tout. Le cercle à retenir : Eau › Feu › Nature › Vent › Terre › Élec › Eau. La minimap ouvre la carte.',
    ok: () => false
  }
];
function tutoHTML() {
  const el = $('tutoB'),
    on = !!tuto && running;
  el.hidden = !on;
  document.documentElement.classList.toggle('tu', on);
  if (!on) return '';
  const last = tuto.i >= TUTO.length - 1;
  el.innerHTML = `<div class="th"><b>TUTO ${tuto.i + 1} / ${TUTO.length}</b>${last ? '' : '<button id="tutoSkip">Passer</button>'}</div><span>${TUTO[tuto.i].t()}</span>${last ? '<button id="tutoSkip" class="end">Terminer et continuer</button>' : ''}`;
  $('tutoSkip').onpointerdown = tutoEnd;
  return '';
}
function tutoEnd() {
  if (!tuto) return;
  tuto = null;
  save.tuto = 1;
  persist();
  tutoHTML();
  if (sim) {
    if (!(save.dev && dev.god)) sim.god = false;
    // la partie continue avec les vraies règles : le chrono du ciel revient (audit règles n° 7) ; cW = −1 relance une préparation neuve
    sim.cNoT = false;
    sim.cW = -1;
    if (running) {
      drawWave();
      toast('À toi de jouer');
    }
  }
}
function tutoTick(h) {
  const d = Math.hypot(h.x - tuto.px, h.z - tuto.pz);
  if (d < 3) tuto.mv += d;
  tuto.px = h.x;
  tuto.pz = h.z;
  tuto.lk += Math.min(0.3, Math.abs(h.yaw - tuto.yaw));
  tuto.yaw = h.yaw;
  if (sim.enemies.some(e => e.mark > 0)) tuto.mark = true;
  sim.god = true;
  if (TUTO[tuto.i].ok()) {
    tuto.i++;
    const s = TUTO[tuto.i];
    if (s.in) s.in();
    toast(tuto.i >= TUTO.length - 1 ? 'Tuto terminé' : 'Bien joué');
    drawWave();
  }
}
function tutoStart() {
  tuto = { i: 0, mv: 0, lk: 0, px: 0, pz: 0, yaw: 0, mark: false, n0: 0, w0: 0 };
  begin(save.last || 'terre', 'hard');
  tuto.px = sim.hero.x;
  tuto.pz = sim.hero.z;
  tuto.yaw = sim.hero.yaw;
  sim.god = true;
}
