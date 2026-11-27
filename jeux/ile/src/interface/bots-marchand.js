// [interface/bots-marchand.js] Les bots au marchand en fin de vague, puis netTick : qui est l'hôte de la partie, envois et réceptions à chaque image.
// Les bots au marchand (V9.9, demande de Frédéric) : à chaque vague finie, chaque bot ou esclave en vie gagne un point à lui (deux aux vagues de boss), mis en commun dans sim.bpts.
// Ils le dépensent tout de suite au marchand : la case la moins chère qu'ils peuvent s'offrir. Les points du joueur ne sont jamais touchés.
function botShop() {
  const B = botList(sim).filter(o => !(o.down > 0));
  if (!B.length || sim.client) return;
  sim.bpts = (sim.bpts || 0) + B.length * (sim.wave % 5 === 0 ? 2 : 1);
  for (let k = 0; k < 3; k++) {
    const C = TREES.run.nodes
      .filter(n => (sim.run[n.id] || 0) < n.max && n.cost <= sim.bpts && (!n.p || sim.run[n.p] > 0))
      .sort((a, b) => a.cost - b.cost);
    if (!C.length) return;
    if (runBuy(C[0].id, true)) {
      toast(EL[B[k % B.length].el].hero + ' (bot) achète « ' + C[0].n + ' » au marchand');
      toastT = 3.5;
      if (!$('tree').hidden) drawTree();
    }
  }
}
function runBuy(id, bot) {
  const n = TREES.run.nodes.find(n => n.id === id);
  if (!n) return false;
  const L = sim.run[id] || 0,
    P = bot ? 'bpts' : 'pts';
  if (L >= n.max || (sim[P] || 0) < n.cost || (n.p && !(sim.run[n.p] > 0))) return false;
  sim[P] -= n.cost;
  sim.run[id] = L + 1;
  sim.m[n.key] = n.inc * (L + 1);
  if (n.key === 'coreHp') {
    sim.core += n.inc;
    sim.coreMax += n.inc;
  }
  return true;
}
function doAct(a, h) {
  if (!Array.isArray(a) || !sim || sim.over) return;
  const k = a[0];
  if (k === 'go') startWave(sim);
  else if (k === 'rdy')
    cielReady(sim, h, !!a[1]); // vue du ciel : ce joueur est prêt (ou ne l'est plus)
  else if (k === 'pl') {
    if (TKEYS[a[1]] && ELS[a[4]] && Number.isFinite(a[2]) && Number.isFinite(a[3]))
      place(sim, TKEYS[a[1]], a[2], a[3], ELS[a[4]]);
  } else if (k === 'up') {
    if (ELS[a[2]]) upgrade(sim, a[1], ELS[a[2]]);
  } else if (k === 'ab') ability(sim, h, a);
  else if (k === 'sm') renfort(sim, h);
  else if (k === 'ul') {
    if (ULT[h.el]) ULT[h.el](sim, h);
  } else if (k === 'wl') {
    if ([a[1], a[2], a[3], a[4]].every(Number.isFinite)) addWalls(sim, a[1], a[2], a[3], a[4]);
  } else if (k === 'dg') {
    if ([a[1], a[2], a[3], a[4]].every(Number.isFinite)) dig(sim, a[1], a[2], a[3], a[4]);
  } else if (k === 'an') {
    if (sim.mode === 'normal') sim.autoNew = !sim.autoNew;
  } else if (k === 'aa') {
    if (sim.mode === 'normal') for (const t of sim.towers) t.auto = !!a[1];
  } else if (k === 'au') {
    const t = sim.towers.find(t => t.id === a[1]);
    if (t && sim.mode === 'normal') t.auto = !t.auto;
  } else if (k === 'wb') {
    // un invité achète chez le marchand d'armes : l'hôte seul juge (audit V2.0, problème 3). Il paie avec l'or de l'équipe s'il y en a assez
    // et note le niveau payé pour ce joueur et cette arme ; armPeer ne lui accorde jamais plus que ce qui a été payé.
    const u = ARMUP[a[1]],
      wk = WTK[a[3]];
    if (u && wk && h !== sim.hero && h.id !== undefined && Number.isInteger(a[2]) && a[2] >= 1 && a[2] <= u.max) {
      const P = (sim.wpay[h.id] = sim.wpay[h.id] || {}),
        W = (P[wk] = P[wk] || {});
      if ((W[u.id] || 0) === a[2] - 1 && armPay(sim, u.id, a[2] - 1)) W[u.id] = a[2];
    }
  } else if (k === 'rf') {
    // Roc Gardien chez un invité (V2.2) : il renvoie les coups reçus au contact. L'hôte vérifie la voie, la distance et le rythme.
    const e = sim.enemies.find(o => o.id === a[1]);
    if (
      e &&
      h !== sim.hero &&
      h.el === 'terre' &&
      h.m.voA &&
      h.m.spA2 &&
      Number.isFinite(a[2]) &&
      Math.hypot(e.x - h.x, e.z - h.z) < 8 &&
      sim.t - (h.rfT || -9) > 0.4
    ) {
      h.rfT = sim.t;
      hurtE(e, Math.max(0, Math.min(120, a[2])), true, true);
    }
  } else if (k === 'rb') {
    if (runBuy(String(a[1])) && !$('tree').hidden) drawTree();
  }
}
// à terre, on ne peut rien faire, sauf : dire qu'on est prêt, acheter chez le marchand d'armes, et bâtir depuis la vue du ciel pendant la préparation (audit V2.0, problèmes 3 et 9)
const DOWNOK = { go: 1, rdy: 1, wb: 1 },
  DOWNPREP = { pl: 1, up: 1, wl: 1, dg: 1 };
function send(a) {
  if (!sim || (sim.hero.down > 0 && !DOWNOK[a[0]] && !(DOWNPREP[a[0]] && sim.phase === 'prep'))) return;
  if (a[0] === 'pl' || a[0] === 'up' || a[0] === 'wl' || a[0] === 'dg') swing = 1;
  if (net.host) doAct(a, sim.hero);
  else {
    net.acts.push([++net.seq].concat(a));
    if (net.acts.length > 8) net.acts.shift();
    if (a[0] === 'ab') ability(sim, sim.hero, a);
  }
}
function netTick(dt) {
  const r = net.room;
  if (r) {
    let peers = [];
    try {
      peers = r.peers();
    } catch (_) {}
    const me = peers.find(p => p.isMe && p.sameTab),
      play = peers.filter(p => p.kind === 'viewer' && p.presence && p.presence.st === 'play' && !(p.isMe && p.sameTab));
    if (!running) {
      net.n = 1;
      if (net.endT > 0) net.endT -= dt;
      else if (net.wasPlay !== false) {
        net.wasPlay = false;
        r.presence({ st: 'menu', hs: 0, s: null, rl: null, a: null, f: 0 }).catch(() => {});
      }
    } else {
      net.wasPlay = true;
      net.n = play.length + 1;
      sim.players = net.n + botList(sim).length;
      let best = null;
      for (const p of play) {
        const hs = +p.presence.hs;
        if (hs > 0 && (!best || hs < +best.presence.hs || (hs === +best.presence.hs && p.peer < best.peer))) best = p;
      }
      if (net.host) {
        if (best && me && (+best.presence.hs < net.hs || (+best.presence.hs === net.hs && best.peer < me.peer))) {
          net.host = false;
          net.hs = 0;
          net.lastS = null;
          net.rl = '';
          net.noHost = 0;
          sim.client = true;
          sim.shots = [];
          sim.bombs = [];
          sim.towers = [];
          sim.enemies = [];
          sim.queue = [];
          toast('Tu rejoins la partie en cours');
        }
      } else if (best) {
        net.noHost = 0;
        const pr = best.presence;
        if (pr.s && pr.s !== net.lastS) {
          net.lastS = pr.s;
          applySnap(sim, pr.s);
        }
        if (pr.wp && typeof pr.wp === 'object') {
          net.wp = pr.wp; // les niveaux d'armes payés, tels que l'hôte les tient : on corrige les nôtres (audit V2.0, problème 3)
          if (me) armPaid(pr.wp[me.peer + sim.hero.el]);
        }
        if (typeof pr.rl === 'string' && pr.rl !== net.rl) {
          net.rl = pr.rl;
          TREES.run.nodes.forEach((n, i) => {
            sim.run[n.id] = Math.max(0, Math.min(n.max, +pr.rl[i] || 0));
          });
          if (!$('tree').hidden) drawTree();
        }
      } else {
        net.noHost += dt;
        if (net.noHost > 2.5 && (!me || play.every(p => p.peer > me.peer))) {
          net.host = true;
          net.hs = Date.now();
          net.seen = {};
          sim.client = false;
          net.noHost = 0;
          // ce que l'ancien hôte savait et qui ne passe pas par le snap (audit V2.0, problèmes 2, 3, 5 et 8)
          net.acts = []; // nos actions d'invité ne doivent plus voyager dans la présence (place) ni être rejouées
          sim.cW = sim.phase === 'prep' ? sim.wave : -1; // la préparation continue : chrono repris du dernier snap, les « Prêt » ne sont pas effacés
          sim.cRdy = {};
          if (sim.phase === 'prep' && ciel.me && ciel.rw === sim.wave + 1) sim.cRdy.h = 1;
          sim.wpay = wpayDec(net.wp, sim.wpay); // les niveaux d'armes payés par chacun, annoncés par l'ancien hôte
          sim.can = BOATS.map(() => 4); // les canons des navires reprennent
          toast("L'hôte est parti : tu reprends la partie");
        }
      }
      const here = {};
      for (const p of play) {
        const pr = p.presence,
          q = pr.p;
        if (!Array.isArray(q) || q.length < 5 || !q.slice(0, 5).every(Number.isFinite)) continue;
        here[p.peer] = 1;
        const el = ELS.includes(pr.el) ? pr.el : 'feu';
        let o = sim.others[p.peer];
        if (!o || o.el !== el)
          o = sim.others[p.peer] = {
            id: p.peer + el,
            x: q[0],
            y: q[1],
            z: q[2],
            yaw: q[3],
            pitch: q[4],
            eye: 1.6,
            el,
            cd: 0,
            ab: 0,
            inp: { fire: false },
            m: Object.assign({}, M0)
          };
        if (Array.isArray(pr.hm))
          HK.forEach((k, i) => {
            const v = +pr.hm[i];
            o.m[k] = Number.isFinite(v) ? Math.max(-3, Math.min(k[0] === 's' && k[1] === 'p' ? 100 : 12, v)) : 0; // les cases des voies (spA1…) peuvent valoir 25 ou 15
          });
        armPeer(o, pr, p.peer); // son arme en main, son élément, ses améliorations (V2.0)
        if (net.host && sim.phase === 'prep') {
          // « Prêt » d'un invité : lu dans sa présence à chaque image, marqué du numéro de la vague attendue (audit V2.0, problème 2)
          sim.cRdy = sim.cRdy || {};
          if (+pr.rd === sim.wave + 1) sim.cRdy[o.id] = 1;
          else delete sim.cRdy[o.id];
        }
        const k = Math.min(1, dt * 12);
        o.x += (q[0] - o.x) * k;
        o.y += (Math.max(0, q[1]) - o.y) * k;
        o.z += (q[2] - o.z) * k;
        const dy = q[3] - o.yaw;
        o.yaw += Math.atan2(Math.sin(dy), Math.cos(dy)) * k;
        o.pitch = Math.max(-1.3, Math.min(1.3, q[4]));
        o.inp.fire = !!pr.f;
        o.down = !!pr.d;
        if (Array.isArray(pr.hl) && pr.hl.slice(0, 5).every(Number.isFinite)) {
          const first = net.hlSeen[p.peer] === undefined,
            nw = net.hlSeen[p.peer] !== pr.hl[0];
          net.hlSeen[p.peer] = pr.hl[0]; // soin envoyé par un coéquipier
          const me2 = sim.hero;
          if (nw && !first && Math.hypot(me2.x - pr.hl[1], me2.z - pr.hl[2]) <= pr.hl[4]) {
            if (me2.down > 0 && pr.hl[5]) {
              me2.down = 0;
              me2.rev = 0;
              me2.hp = me2.maxHp * 0.5;
            }
            if (!(me2.down > 0)) {
              me2.hp = Math.min(me2.maxHp, me2.hp + Math.max(0, Math.min(999, pr.hl[3])));
              if (Number.isFinite(pr.hl[6]) && pr.hl[6] > 0) {
                me2.shd = Math.max(me2.shd || 0, Math.min(100, pr.hl[6])); // V2.2 : le bouclier d'eau d'une Soigneuse
                me2.shT = BAL.shieldT;
              }
              toast(pr.hl[6] > 0 ? 'Soigné et protégé par un coéquipier' : 'Soigné par un coéquipier');
            }
          }
        } else if (net.hlSeen[p.peer] === undefined) net.hlSeen[p.peer] = 0;
        if (net.host) {
          const list = Array.isArray(pr.a) ? pr.a.slice(-8) : [];
          let mx = net.seen[p.peer];
          if (mx === undefined) {
            mx = 0;
            for (const a of list) if (Array.isArray(a) && a[0] > mx) mx = a[0];
          } else
            for (const a of list)
              if (Array.isArray(a) && Number.isFinite(a[0]) && a[0] > mx) {
                mx = a[0];
                doAct(a.slice(1), o);
              }
          net.seen[p.peer] = mx;
        }
      }
      for (const k in sim.others) if (!here[k] && !sim.others[k].bot) delete sim.others[k];
      net.pubT += dt;
      if (net.pubT > 0.08) {
        net.pubT = 0;
        const h = sim.hero,
          pa = {
            st: 'play',
            hs: net.hs,
            el: h.el,
            p: [r1(h.x), r1(h.y), r1(h.z), Math.round(h.yaw * 100) / 100, Math.round(h.pitch * 100) / 100],
            f: inp.fire ? 1 : 0,
            d: h.down > 0 ? 1 : 0,
            hl: net.hl && (Date.now() % 1e9) - net.hl[0] < 2500 ? net.hl : null, // un soin ne reste annoncé que 2,5 s
            a: net.acts.slice(),
            hm: HK.map(k => sim.m[k]),
            rd: sim.phase === 'prep' && ciel.me ? ciel.rw || 0 : 0
          };
        armPres(pa);
        if (net.host && play.length) {
          pa.rl = TREES.run.nodes.map(n => sim.run[n.id] || 0).join('');
          pa.wp = wpayEnc(sim.wpay);
          net.snapT += 1;
          if (net.snapT >= 2 || !net.snap) {
            net.snapT = 0;
            // la place du snap = la limite du salon moins ce qui l'accompagne vraiment (audit V2.0, problème 5)
            const base = JSON.stringify(pa).length + 12;
            net.snap = fitSnap(snap(sim), Math.max(600, Math.min(2900, MULTI.max) - base));
          }
          pa.s = net.snap;
        } else {
          pa.s = null;
          pa.rl = null;
          net.snap = null;
        }
        r.presence(pa).catch(() => {});
      }
    }
  }
}
