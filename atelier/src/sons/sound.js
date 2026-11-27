// [sons/sound.js] Les sons du lobby : un fond sonore et quelques bruitages, tous fabriqués à la volée par le navigateur (aucun fichier son).

const SND = (() => {
  let ac = null,
    out = null,
    nb = null,
    on = save.snd !== false,
    busy = 0,
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
  const env = (g, t, vol, a, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
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
    g.connect(out);
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
    g.connect(out);
    busy++;
    s.onended = () => busy--;
    s.start(t, Math.random() * 0.6, dur + 0.05);
  }
  const arp = (fs, gap, dur, vol, type) =>
    fs.forEach((f, i) => tone(type || 'triangle', f, f, dur, vol, { d: i * gap }));
  const S = {
    coin() {
      if (ok('coin', 80)) {
        tone('sine', 1320, 1320, 0.07, 0.07);
        tone('sine', 1980, 1980, 0.14, 0.06, { d: 0.05 });
      }
    },
    place() {
      tone('sine', 200, 120, 0.13, 0.35);
      noise(0.09, 0.2, 'lowpass', 1500, 500);
      tone('triangle', 660, 660, 0.14, 0.1, { d: 0.08 });
    },
    pure() {
      arp([523, 659, 784, 1047, 1319], 0.07, 0.4, 0.15);
      noise(0.6, 0.08, 'highpass', 5000, 9000);
    },
    clear() {
      arp([523, 659, 784, 1047], 0.09, 0.3, 0.14);
    },
    stone() {
      if (!ok('st', 60)) return;
      tone('sine', 140, 60, 0.16, 0.4);
      noise(0.14, 0.3, 'lowpass', 700, 200);
    },
    win() {
      arp([523, 659, 784, 1047, 1319, 1568], 0.12, 0.6, 0.18);
    },
    tick() {
      tone('sine', 880, 660, 0.04, 0.05);
    },
    // un pas, discret (V12.7) : un souffle sourd et un petit coup grave
    step() {
      if (!ok('step', 90)) return;
      noise(0.06, 0.07, 'lowpass', 900, 300);
      tone('sine', 110, 60, 0.07, 0.07);
    }
  };
  const can = () => ac && on && ac.state === 'running' && busy < 34;
  function play(n, a) {
    if (!can() || !S[n]) return;
    try {
      S[n](a);
    } catch (_) {}
  } // un bruitage raté ne doit jamais arrêter le jeu
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
  return { play, set, resume, hold };
})();
