// [interface/modes.js] Le mode de tir (bouton, auto, auto sur cible), le mode de jeu reçu du lobby, et le mode dev de la partie.
// ---------- mode de tir : bouton, 100 % auto, ou auto dès qu'un ennemi est dans le viseur ----------
const FM = { btn: 'bouton', auto: '100 % auto', cible: 'auto sur cible' },
  FMK = ['btn', 'auto', 'cible'];
const fireMode = () => (FM[save.fire] ? save.fire : 'cible');
// le mode de jeu et le niveau de campagne sont choisis au portail, dans le lobby
const MODES = { normal: 'Normal', hard: 'Difficile' };
const gameMode = () => (LOBBY.mode === 'hard' ? 'hard' : 'normal'),
  campOf = () => {
    const c = LOBBY.campagne;
    return c && typeof c === 'object' && ELS.includes(c.el) && c.l >= 1 && c.l <= 4
      ? { el: c.el, l: Math.round(c.l) }
      : null;
  },
  campN = c => EL[c.el].n + ' · niveau ' + c.l;

// ---------- mode dev : pose tout seul des défenses et donne des raccourcis de test ----------
const dev = Object.assign({ auto: false, god: true, hgod: true, speed: 1, fly: false }, save.devOpt || {});
let devT = 0;
function devKeep() {
  save.devOpt = dev;
  persist();
}
function devSetup() {
  if (!sim) return;
  const g0 = sim.gold;
  sim.gold = 99999;
  let i = 0;
  PATHS.forEach((p, pi) => {
    [0.38, 0.62, 0.86].forEach((fr, k) => {
      const q = posAt(p, fr * p.len);
      for (const sd of k % 2 ? [1, -1] : [-1, 1]) {
        const x = q[0] - q[3] * 5.5 * sd,
          z = q[1] + q[2] * 5.5 * sd;
        if (canPlace(sim, x, z)) continue;
        const el = ELS[i % ELS.length],
          lv = (i % 3) + 1;
        if (place(sim, TKEYS[(k + pi) % 3], x, z, el)) {
          const t = sim.towers[sim.towers.length - 1];
          for (let l = 1; l < lv; l++) upgrade(sim, t.id, i % 2 ? ELS[(i + l) % ELS.length] : el);
        }
        i++;
        break;
      }
    });
  });
  sim.gold = Math.max(g0, 2000);
  sim.pts = Math.max(sim.pts, 20);
  return i;
}
// remplit les trois chemins et fait tourner les 15 combinaisons défense × élément
function devFill() {
  if (!sim) return 0;
  const g0 = sim.gold;
  sim.gold = 999999;
  let i = 0,
    n = 0;
  PATHS.forEach(p => {
    for (const fr of [0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.89])
      for (const sd of [1, -1]) {
        const q = posAt(p, fr * p.len),
          x = q[0] - q[3] * 5.5 * sd,
          z = q[1] + q[2] * 5.5 * sd;
        if (canPlace(sim, x, z)) continue;
        if (place(sim, TKEYS[i % 3], x, z, ELS[Math.floor(i / 3) % ELS.length])) {
          i++;
          n++;
        }
      }
  });
  sim.gold = Math.max(g0, 2000);
  return n;
}
// monte toutes les défenses au niveau 3, spécialisées dans leur premier élément
function devMax() {
  if (!sim) return 0;
  const g0 = sim.gold;
  sim.gold = 9999999;
  let n = 0;
  for (const t of sim.towers) {
    for (let guard = 0; guard < 12; guard++) {
      const ord = [...new Set(t.els)],
        cn = e => t.els.filter(x => x === e).length;
      const el =
        ord.find(e => cn(e) < MAXLV) ||
        (ord.length < MAXEL ? ELS[(ELS.indexOf(ord[ord.length - 1]) + 1 + (t.id % 2)) % ELS.length] : null);
      if (!el || !upgrade(sim, t.id, ord.includes(el) || !t.els.includes(el) ? el : ELS.find(e => !t.els.includes(e))))
        break;
      n++;
    }
  }
  sim.gold = Math.max(g0, 2000);
  return n;
}
function drawDev() {
  const B = (id, txt, on) => `<button class="dv${on ? ' on' : ''}" data-a="${id}">${txt}</button>`;
  $('devP').innerHTML =
    B('x', 'Fermer ✕') +
    B('speed', 'Vitesse ×' + dev.speed, dev.speed > 1) +
    B('auto', 'Vagues auto : ' + (dev.auto ? 'oui' : 'non'), dev.auto) +
    B('god', 'Cœur invincible : ' + (dev.god ? 'oui' : 'non'), dev.god) +
    B('hgod', 'Héros invincible : ' + (dev.hgod ? 'oui' : 'non'), dev.hgod) +
    B('fly', 'Vol libre : ' + (dev.fly ? 'oui' : 'non'), dev.fly) +
    B('set', 'Poser des défenses') +
    B('fill', "Remplir et maxer l'île") +
    B('max', 'Maxer les défenses') +
    B('rmax', 'Maxer la grille de partie') +
    B('zoo', "Tous les types d'ennemis") +
    B('ult', "Charger l'ultime") +
    B('ob', 'Lancer un objectif') +
    B('pup', 'Faire tomber les 6 bonus') +
    B('b2', 'Faire venir un boss moyen') +
    B('b3', 'Faire venir le Big Boss') +
    B('botp', 'Bot joueur : + (' + (dev.bots | 0) + '/4)', dev.bots > 0) +
    B('botm', 'Bot joueur : −') +
    B('botb', 'Les bots bâtissent : ' + (dev.botBuild === false ? 'non' : 'oui'), dev.botBuild !== false) +
    B('skip', 'Passer la vague') +
    B('gold', '+1000 or') +
    B('pts', '+10 points');
  $('devP')
    .querySelectorAll('.dv')
    .forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a;
          if (a === 'x') {
            $('devP').hidden = true;
            return;
          }
          if (!sim) return;
          if (a === 'speed') dev.speed = dev.speed === 1 ? 2 : dev.speed === 2 ? 4 : 1;
          else if (a === 'auto') dev.auto = !dev.auto;
          else if (a === 'god') {
            dev.god = !dev.god;
            sim.god = dev.god;
          } else if (a === 'hgod') {
            dev.hgod = !dev.hgod;
            sim.heroGod = dev.hgod;
          } else if (a === 'fly') {
            dev.fly = !dev.fly;
            $('bSneak').classList.remove('on');
            toast(dev.fly ? 'Vol libre : Saut monte, Sneak descend' : 'Vol coupé');
          } else if (a === 'set') {
            const n = devSetup();
            toast(n ? n + ' défenses posées' : 'Plus de place libre');
          } else if (a === 'botp' || a === 'botm') {
            dev.bots = Math.max(0, Math.min(4, (dev.bots | 0) + (a === 'botp' ? 1 : -1)));
            botSync();
            toast(
              dev.bots
                ? dev.bots +
                    ' bot' +
                    (dev.bots > 1 ? 's' : '') +
                    ' en jeu : ' +
                    botList(sim)
                      .map(o => EL[o.el].hero)
                      .join(', ')
                : 'Plus de bot'
            );
          } else if (a === 'botb') {
            dev.botBuild = dev.botBuild === false;
            botSync();
          } else if (a === 'skip') {
            if (sim.phase === 'prep') startWave(sim);
            sim.queue.length = 0;
            for (const e of sim.enemies) e.hp = 0;
            wavePhase = '';
          } else if (a === 'zoo') {
            if (sim.phase === 'prep') startWave(sim);
            KK.forEach((k, i) =>
              PATHS.forEach((p, pi) =>
                sim.queue.push({
                  t: sim.t + 1 + i * 1.6 + pi * 0.4,
                  path: pi,
                  el: ELS[(i + pi) % ELS.length],
                  boss: false,
                  k
                })
              )
            );
            sim.queue.sort((x, y) => x.t - y.t);
            wavePhase = '';
          } else if (a === 'fill') {
            const n = devFill();
            devMax();
            toast(n + ' défenses posées, tout au maximum');
          } else if (a === 'max') {
            const n = devMax();
            toast(n ? n + ' améliorations faites' : 'Tout est déjà au maximum');
          } else if (a === 'rmax') {
            TREES.run.nodes.forEach(n => {
              const L = sim.run[n.id] || 0;
              if (n.key === 'coreHp') sim.core += n.inc * (n.max - L);
              sim.run[n.id] = n.max;
              sim.m[n.key] = n.inc * n.max;
            });
            toast('Boutique au max');
          } else if (a === 'gold') sim.gold += 1000;
          else if (a === 'pts') sim.pts += 10;
          devKeep();
          drawDev();
        })
    );
}
