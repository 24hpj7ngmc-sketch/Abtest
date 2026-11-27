// [sons/sound.js] Sons et sensations : tous les bruitages sont fabriqués à la volée ; ce que chaque événement du jeu fait entendre et vibrer.
// ---------- son et sensations : tous les bruitages sont fabriqués à la volée par le navigateur (aucun fichier son) ----------
let slowT = 0,
  crossT = 0,
  stepN = 0,
  beatT = 0,
  gullT = 8;
const SND = (() => {
  let ac = null,
    out = null,
    nb = null,
    on = save.snd !== false,
    V = 1,
    P = 0,
    busy = 0,
    FL = null,
    held = false;
  const last = {};
  const ok = (k, ms) => {
    const t = performance.now();
    if (t - (last[k] || 0) < ms) return false;
    last[k] = t;
    return true;
  };
  function boot() {
    if (ac || !on) return;
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    try {
      ac = new A();
    } catch (_) {
      ac = null;
      return;
    }
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (_) {} // iPhone : joue aussi quand le bouton « silencieux » est mis, si le navigateur le permet
    out = ac.createGain();
    out.gain.value = 0.55;
    const cp = ac.createDynamicsCompressor();
    out.connect(cp);
    cp.connect(ac.destination);
    nb = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.5), ac.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // fond sonore : le ressac (bruit grave qui enfle et retombe) et un filet de vent
    for (const q of [
      ['lowpass', 420, 0.05, 0.03, 0.11],
      ['bandpass', 800, 0.012, 0.008, 0.07]
    ]) {
      const s = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        g = ac.createGain(),
        l = ac.createOscillator(),
        lg = ac.createGain();
      s.buffer = nb;
      s.loop = true;
      f.type = q[0];
      f.frequency.value = q[1];
      g.gain.value = q[2];
      l.frequency.value = q[4];
      lg.gain.value = q[3];
      l.connect(lg);
      lg.connect(g.gain);
      s.connect(f);
      f.connect(g);
      g.connect(out);
      s.start();
      l.start();
    }
  }
  function resume() {
    if (held) return;
    boot();
    if (ac && on && ac.state !== 'running') ac.resume().catch(() => {});
  }
  function hold(v) {
    held = !!v;
    if (!ac) return;
    if (held) ac.suspend();
    else if (on && !document.hidden) ac.resume().catch(() => {});
  }
  const dest = () => {
    if (!P || !ac.createStereoPanner) return out;
    const p = ac.createStereoPanner();
    p.pan.value = P;
    p.connect(out);
    return p;
  };
  const env = (g, t, vol, a, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * V), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  // une note : la hauteur glisse de f0 à f1. o : {d: retard, a: attaque, lp: filtre passe-bas}
  function tone(type, f0, f1, dur, vol, o) {
    o = o || {};
    const t = ac.currentTime + (o.d || 0),
      os = ac.createOscillator(),
      g = ac.createGain();
    os.type = type;
    os.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, vol, o.a || 0.006, dur);
    let n = os;
    if (o.lp) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      os.connect(f);
      n = f;
    }
    n.connect(g);
    g.connect(dest());
    busy++;
    os.onended = () => busy--;
    os.start(t);
    os.stop(t + dur + 0.05);
  }
  // un souffle : bruit filtré dont le filtre glisse de f0 à f1
  function noise(dur, vol, type, f0, f1, o) {
    o = o || {};
    const t = ac.currentTime + (o.d || 0),
      s = ac.createBufferSource(),
      f = ac.createBiquadFilter(),
      g = ac.createGain();
    s.buffer = nb;
    f.type = type;
    f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, vol, o.a || 0.004, dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest());
    busy++;
    s.onended = () => busy--;
    s.start(t, Math.random() * 0.6, dur + 0.05);
  }
  const arp = (fs, gap, dur, vol, type) =>
    fs.forEach((f, i) => tone(type || 'triangle', f, f, dur, vol, { d: i * gap }));
  const S = {
    // un tir, selon l'arme (V10.1 : les sons de Dernier Toit, un peu moins forts) ; rien de connu = le fusil
    shot(w) {
      const k = 0.55;
      if (w === 'pistolet') {
        noise(0.05, 0.3 * k, 'lowpass', 5200, 1400);
        tone('square', 260, 90, 0.06, 0.14 * k, { lp: 1800 });
        noise(0.02, 0.12 * k, 'highpass', 6000);
      } else if (w === 'assaut') {
        noise(0.045, 0.24 * k, 'lowpass', 3800, 1100);
        tone('square', 150, 70, 0.05, 0.11 * k, { lp: 1300 });
      } else if (w === 'sniper') {
        noise(0.32, 0.42 * k, 'lowpass', 2600, 160);
        tone('sine', 90, 32, 0.4, 0.42 * k);
        noise(0.04, 0.16 * k, 'highpass', 4200);
        noise(0.5, 0.06 * k, 'bandpass', 600, 200, { q: 0.8, d: 0.12 });
      } else if (w === 'pompe') {
        noise(0.16, 0.44 * k, 'lowpass', 3200, 320);
        tone('sine', 78, 30, 0.32, 0.48 * k);
        noise(0.035, 0.15 * k, 'highpass', 3800);
        noise(0.6, 0.07 * k, 'bandpass', 480, 150, { q: 0.7, d: 0.1 });
        for (const q of [
          [0.29, 2300, 1500],
          [0.47, 1700, 1100]
        ]) {
          noise(0.03, 0.15 * k, 'bandpass', q[1], q[2], { q: 2.6, d: q[0] });
          tone('square', q[1] * 0.24, q[2] * 0.2, 0.035, 0.035 * k, { lp: 2600, d: q[0] });
          noise(0.06, 0.06 * k, 'lowpass', 900, 300, { d: q[0] + 0.01 });
        }
      } else {
        noise(0.07, 0.32 * k, 'lowpass', 4200, 900);
        tone('square', 180, 60, 0.08, 0.16 * k, { lp: 1400 });
        noise(0.025, 0.12 * k, 'highpass', 5000);
      }
    },
    // le lance-flammes : une boucle de souffle qui démarre au premier tic (avec le « whoumf » d'allumage) ; chaque tic la maintient, elle retombe seule 0,12 s après le dernier et s'arrête au bout de 0,8 s
    flame() {
      const t = ac.currentTime;
      if (!FL) {
        const s = ac.createBufferSource(),
          f = ac.createBiquadFilter(),
          f2 = ac.createBiquadFilter(),
          g = ac.createGain();
        s.buffer = nb;
        s.loop = true;
        f.type = 'bandpass';
        f.frequency.value = 520;
        f.Q.value = 0.55;
        f2.type = 'lowpass';
        f2.frequency.value = 1700;
        g.gain.value = 0.0001;
        s.connect(f);
        f.connect(f2);
        f2.connect(g);
        g.connect(out);
        s.start(t, Math.random() * 0.6);
        busy++;
        FL = { s, f, g, k: 0 };
        noise(0.34, 0.06, 'bandpass', 240, 1300, { q: 0.7, a: 0.04 });
        noise(0.14, 0.04, 'lowpass', 420, 120);
      }
      const g = FL.g.gain;
      g.cancelScheduledValues(t);
      g.setTargetAtTime(0.04 * V, t, 0.035);
      g.setTargetAtTime(0.0001, t + 0.12, 0.07);
      FL.f.frequency.setTargetAtTime(420 + Math.random() * 260, t, 0.05);
      clearTimeout(FL.k);
      const me = FL;
      FL.k = setTimeout(() => {
        if (FL === me) FL = null;
        try {
          me.s.stop();
          me.s.disconnect();
        } catch (_) {}
        busy--;
      }, 800);
    },
    hit() {
      if (ok('hit', 45)) noise(0.035, 0.1, 'bandpass', 2600, 0, { q: 1.5 });
    },
    crit() {
      tone('triangle', 1400, 2200, 0.11, 0.16);
      tone('sine', 2640, 2640, 0.2, 0.09, { d: 0.04 });
    },
    dead() {
      if (!ok('dead', 55)) return;
      tone('sine', 520, 110, 0.16, 0.2);
      noise(0.09, 0.1, 'lowpass', 1800, 400);
    },
    pupdrop() {
      if (!ok('pupdrop', 300)) return;
      tone('sine', 1568, 2093, 0.16, 0.09);
      tone('sine', 2093, 3136, 0.22, 0.07, { d: 0.09 });
    },
    pup() {
      arp([523, 659, 784, 1047, 1319], 0.065, 0.26, 0.17);
      tone('sine', 1568, 1568, 0.5, 0.08, { d: 0.33 });
    },
    pupboom() {
      tone('sine', 140, 28, 1.2, 0.5);
      noise(1.3, 0.36, 'lowpass', 2200, 110);
      arp([523, 659, 784, 1047, 1319], 0.065, 0.26, 0.12);
    },
    coin() {
      if (ok('coin', 80)) {
        tone('sine', 1320, 1320, 0.07, 0.07);
        tone('sine', 1980, 1980, 0.14, 0.06, { d: 0.05 });
      }
    },
    bossdead() {
      noise(1.3, 0.5, 'lowpass', 500, 60);
      tone('sine', 90, 30, 1.1, 0.5);
      arp([392, 494, 587, 784], 0.11, 0.5, 0.16);
    },
    horn() {
      if (!ok('horn', 900)) return;
      tone('sawtooth', 98, 92, 1.25, 0.2, { lp: 420, a: 0.2 });
      tone('sawtooth', 147, 139, 1.25, 0.14, { lp: 520, a: 0.24 });
      tone('triangle', 73.5, 70, 1.35, 0.2, { a: 0.22 });
      noise(1.1, 0.05, 'lowpass', 300, 120, { a: 0.3 });
    },
    cannon() {
      noise(0.55, 0.7, 'lowpass', 900, 70);
      tone('sine', 120, 34, 0.5, 0.7);
      noise(0.08, 0.3, 'highpass', 2500);
    },
    splash() {
      if (ok('splash', 110)) noise(0.24, 0.2, 'bandpass', 1500, 450, { q: 0.7 });
    },
    boss() {
      tone('sawtooth', 98, 92, 1.3, 0.3, { lp: 500, a: 0.15 });
      tone('sawtooth', 147, 138, 1.3, 0.2, { lp: 600, a: 0.2 });
      noise(1.2, 0.25, 'lowpass', 200, 80);
    },
    mortier() {
      if (!ok('mo', 70)) return;
      tone('sine', 150, 45, 0.22, 0.4);
      noise(0.12, 0.22, 'lowpass', 900, 300);
    },
    canon() {
      if (!ok('ca', 70)) return;
      noise(0.26, 0.5, 'lowpass', 800, 150);
      tone('sine', 110, 38, 0.3, 0.5);
    },
    archer() {
      if (!ok('ar', 50)) return;
      tone('triangle', 700, 320, 0.07, 0.1);
      noise(0.03, 0.05, 'highpass', 4000);
    },
    boom(r) {
      if (!ok('boom', 70)) return;
      const k = Math.min(1, 0.4 + (+r || 2) * 0.12);
      noise(0.32, 0.36 * k, 'lowpass', 1300, 200);
      tone('sine', 95, 40, 0.25, 0.3 * k);
    },
    place() {
      tone('sine', 200, 120, 0.13, 0.35);
      noise(0.09, 0.2, 'lowpass', 1500, 500);
      tone('triangle', 660, 660, 0.14, 0.1, { d: 0.08 });
    },
    up(n) {
      arp(
        [523, 659, 784].map(f => f * (1 + (+n || 1) * 0.06)),
        0.065,
        0.16,
        0.13
      );
    },
    pure() {
      arp([523, 659, 784, 1047, 1319], 0.07, 0.4, 0.15);
      noise(0.6, 0.08, 'highpass', 5000, 9000);
    },
    wave() {
      tone('sawtooth', 196, 196, 0.55, 0.2, { lp: 900, a: 0.05 });
      tone('sawtooth', 294, 294, 0.55, 0.15, { lp: 1100, a: 0.05, d: 0.02 });
      tone('sawtooth', 392, 392, 0.5, 0.12, { lp: 1200, a: 0.05, d: 0.3 });
    },
    clear() {
      arp([523, 659, 784, 1047], 0.09, 0.3, 0.14);
    },
    leak() {
      tone('square', 220, 105, 0.4, 0.28, { lp: 900 });
      noise(0.25, 0.3, 'lowpass', 500, 150);
    },
    ouch() {
      if (!ok('ouch', 150)) return;
      tone('sine', 180, 85, 0.16, 0.32);
      noise(0.07, 0.16, 'lowpass', 800);
    },
    down() {
      arp([330, 262, 196, 147], 0.14, 0.3, 0.2, 'sine');
    },
    rise() {
      arp([262, 392, 523], 0.09, 0.22, 0.16);
    },
    quake() {
      noise(1.3, 0.6, 'lowpass', 220, 50);
      tone('sine', 62, 28, 1, 0.6);
    },
    fire() {
      noise(0.5, 0.4, 'lowpass', 1600, 200);
      tone('sine', 120, 40, 0.4, 0.4);
      noise(0.3, 0.12, 'bandpass', 900, 3000, { q: 0.6 });
    },
    water() {
      noise(0.8, 0.35, 'bandpass', 300, 2200, { q: 0.7, a: 0.08 });
      noise(0.5, 0.2, 'lowpass', 900, 300, { d: 0.25 });
    },
    thunder() {
      if (!ok('th', 90)) return;
      noise(0.08, 0.5, 'highpass', 2500);
      noise(0.7, 0.45, 'lowpass', 2500, 120, { d: 0.03 });
    },
    zap() {
      if (ok('zap', 60)) tone('sawtooth', 1900, 320, 0.13, 0.13, { lp: 3500 });
    },
    wood() {
      tone('triangle', 170, 330, 0.26, 0.22);
      noise(0.2, 0.12, 'bandpass', 600, 1400, { q: 1.2 });
    },
    stone() {
      if (!ok('st', 60)) return;
      tone('sine', 140, 60, 0.16, 0.4);
      noise(0.14, 0.3, 'lowpass', 700, 200);
    },
    shift() {
      tone('sine', 180, 760, 0.7, 0.25, { a: 0.1 });
      tone('sine', 270, 1140, 0.7, 0.14, { a: 0.1 });
    },
    obj() {
      arp([784, 1047], 0.16, 0.3, 0.14, 'sine');
    },
    win() {
      arp([523, 659, 784, 1047, 1319, 1568], 0.12, 0.6, 0.18);
    },
    lose() {
      arp([392, 330, 262, 196], 0.22, 0.7, 0.2, 'sawtooth');
    },
    step() {
      noise(0.05, 0.035, 'lowpass', 650, 300);
    },
    beat() {
      tone('sine', 72, 48, 0.13, 0.42);
      tone('sine', 72, 48, 0.13, 0.3, { d: 0.19 });
    },
    gull() {
      const f = 1500 + Math.random() * 400;
      tone('sawtooth', f, f * 0.72, 0.16, 0.035, { lp: 3000, a: 0.03 });
      tone('sawtooth', f * 0.95, f * 0.68, 0.2, 0.03, { lp: 3000, a: 0.03, d: 0.22 });
    },
    tick() {
      tone('sine', 880, 660, 0.04, 0.05);
    }
  };
  const can = () => ac && on && ac.state === 'running' && busy < 34;
  function play(n, a) {
    if (!can() || !S[n]) return;
    V = 1;
    P = 0;
    try {
      S[n](a);
    } catch (_) {}
  } // un bruitage raté ne doit jamais arrêter le jeu
  // un bruit qui vient d'un endroit de l'île : plus faible de loin, à gauche ou à droite selon où l'on regarde
  function at(n, x, z, a) {
    if (!can() || !S[n]) return;
    const dx = x - camera.position.x,
      dz = z - camera.position.z,
      d = Math.hypot(dx, dz);
    V = 1 / (1 + d / 16);
    if (V < 0.06) return;
    const y = camera.rotation.y;
    P = Math.max(-0.8, Math.min(0.8, (dx * Math.cos(y) - dz * Math.sin(y)) / Math.max(d, 2)));
    try {
      S[n](a);
    } catch (_) {}
    V = 1;
    P = 0;
  }
  function set(v) {
    on = v;
    if (on) resume();
    else if (ac) ac.suspend();
  }
  for (const k of ['pointerdown', 'pointerup', 'touchend', 'click'])
    window.addEventListener(k, resume, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else if (on && !held) ac.resume().catch(() => {});
  });
  return { play, at, set, resume, hold };
})();
// ce que chaque événement du jeu fait entendre et ressentir (appelé pour chaque événement, avant son effet visuel)
let critT = 0;
function feel(ev) {
  const k = ev.k,
    A = n => SND.at(n, ev.x, ev.z);
  if (k === 'hit') {
    if (ev.m) {
      $('cross').className = ev.dead ? 'kill' : ev.c ? 'crit' : 'hit';
      crossT = ev.dead ? 0.2 : 0.1;
    }
    if (ev.c) {
      SND.at('crit', ev.x, ev.z);
      const now = performance.now();
      if (now - critT > 800) {
        critT = now; // un « CRITIQUE » toutes les 0,8 s au plus : avec les tirs multiples, ils s'empilaient (audit écran n° 10)
        floater(ev.x, ev.y + 1.6, ev.z, 'CRITIQUE', '#ffcf5a', 12, 0.7);
      }
    } else A('hit');
  } else if (k === 'dead') {
    A(ev.boss ? 'bossdead' : 'dead');
    if (ev.g && !ev.pot) SND.play('coin');
    if (ev.boss) slowT = 0.9;
  } else if (k === 'boom') SND.at('boom', ev.x, ev.z, ev.r);
  else if (k === 'leak' || k === 'bolt') SND.play('leak');
  else if (k === 'ouch') SND.play('ouch');
  else if (k === 'down') SND.play('down');
  else if (k === 'up') SND.play('rise');
  else if (k === 'clear') SND.play('clear');
  else if (k === 'obj') SND.play(ev.t === 'win' ? 'clear' : 'obj');
  else if (k === 'quake') {
    SND.play('quake');
    slowT = 0.35;
  } else if (k === 'fball' || k === 'meteor') A('fire');
  else if (k === 'flame') A('flame');
  else if (k === 'rain') {
    SND.play('fire');
    slowT = 0.35;
  } else if (k === 'tide') A('water');
  else if (k === 'deluge') {
    SND.play('water');
    slowT = 0.35;
  } else if (k === 'storm') {
    SND.play('thunder');
    slowT = 0.35;
  } else if (k === 'bolt2') A('thunder');
  else if (k === 'dash' || k === 'arc' || k === 'zap') A('zap');
  else if (k === 'rafale')
    A('water'); // Zéphyr (V2.1) : en attendant un vrai souffle, le bruit d'eau fait une rafale
  else if (k === 'perce') {
    SND.play('thunder');
    slowT = 0.3;
  } else if (k === 'ronce') A('wood');
  else if (k === 'charge')
    A('stone'); // V2.2 : la charge de l'Avant-garde, le bond du Plongeur, la bourrasque du Tourbillon
  else if (k === 'plonge') A('wood');
  else if (k === 'gust') A('water');
  else if (k === 'guard') {
    SND.play('wood');
    slowT = 0.35;
  } else if (k === 'pup') SND.play(ev.t === 'bombe' ? 'pupboom' : 'pup');
  else if (k === 'horn' || k === 'raid') SND.play('horn');
  else if (k === 'wallup' || k === 'smash') A('stone');
  else if (k === 'stomp') {
    SND.play('quake');
  } else if (k === 'shift') SND.play('shift');
  else if (k === 'summon') A('shift');
}
// à chaque image : viseur qui réagit, bruits de pas calés sur le balancement de la marche, cœur qui bat quand le cristal va céder, cris de mouettes
function feelTick(h, dt) {
  if (crossT > 0) {
    crossT -= dt;
    if (crossT <= 0) $('cross').className = '';
  }
  const st = Math.floor(bob / Math.PI);
  if (st !== stepN) {
    stepN = st;
    SND.play('step');
  }
  if (running && sim.phase === 'wave' && sim.core <= 6 && !sim.over) {
    beatT -= dt;
    if (beatT <= 0) {
      beatT = 0.85;
      SND.play('beat');
    }
  }
  gullT -= dt;
  if (gullT <= 0) {
    gullT = 9 + Math.random() * 16;
    const a = Math.random() * 6.28;
    SND.at('gull', h.x + Math.cos(a) * 25, h.z + Math.sin(a) * 25);
  }
}
