// ===================== DERNIER TOIT — les sons =====================
// Tous fabriqués à la volée par le navigateur (WebAudio : oscillateurs et bruit filtré), aucun fichier son.
// Attend : save.snd (son coupé ou non, lu au chargement), camera (position et cap de l'écoute, pour SND.at) ; rien des règles.
// Fournit : SND = { play(nom, a), at(nom, x, z, a, y), set(oui), resume() }, appelé par l'interface (interface/evenements.js et les commandes).
//   play : le son tel quel ; at : le son placé dans le monde (plus faible avec la distance, à gauche ou à droite selon la caméra) ;
//   set : son oui / non ; resume : réveille l'audio (les navigateurs ne l'autorisent qu'après un geste : branché sur les appuis).
// Les noms des sons sont les clés de SONS (shot, mg, boom, wallhit…). Ajouter un son : une entrée dans SONS, faite de tone() et noise().
// Les tests (sndtest.js, herofx.js, variantes.js, armes2.js) lisent ce fichier tel quel et le rendent hors ligne : SND doit rester
// une constante de haut niveau, play() et at() garder leur try / catch autour de SONS[n](a), et can() son test de l'état « running ».
const SND = (() => {
  // ac : le contexte audio (créé au premier geste) ; maitre : le volume général (puis un compresseur) ; bruitBlanc : 1,5 s de bruit blanc,
  // partagé par tous les bruits ; actif : son voulu ; volume, pan : réglés par at() le temps de jouer un son ; voix : sources en cours (40 au plus)
  let ac = null,
    maitre = null,
    bruitBlanc = null,
    actif = save.snd !== false,
    volume = 1,
    pan = 0,
    voix = 0;
  // cadence(k, ms) : vrai si le son k n'a pas été joué depuis ms millisecondes (évite qu'une rafale empile cent fois le même son)
  const dernier = {};
  const cadence = (k, ms) => {
    const t = performance.now();
    if (t - (dernier[k] || 0) < ms) return false;
    dernier[k] = t;
    return true;
  };
  // création du contexte audio (au premier geste), du bruit blanc et du fond sonore
  function boot() {
    if (ac || !actif) return;
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
    } catch (_) {}
    maitre = ac.createGain();
    maitre.gain.value = 0.5;
    const cp = ac.createDynamicsCompressor();
    maitre.connect(cp);
    cp.connect(ac.destination);
    bruitBlanc = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.5), ac.sampleRate);
    const d = bruitBlanc.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // fond : le vent sur le toit et la rumeur lointaine de la ville
    for (const q of [
      ['lowpass', 300, 0.035, 0.02, 0.07],
      ['bandpass', 900, 0.01, 0.006, 0.11]
    ]) {
      const s = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        g = ac.createGain(),
        l = ac.createOscillator(),
        lg = ac.createGain();
      s.buffer = bruitBlanc;
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
      g.connect(maitre);
      s.start();
      l.start();
    }
  }
  // réveille l'audio : le crée au premier appel, le relance s'il a été suspendu
  function resume() {
    boot();
    if (ac && actif && ac.state !== 'running') ac.resume().catch(() => {});
  }
  // où brancher un son : directement sur le volume général, ou via un panoramique si at() l'a placé à gauche ou à droite
  const sortie = () => {
    if (!pan || !ac.createStereoPanner) return maitre;
    const p = ac.createStereoPanner();
    p.pan.value = pan;
    p.connect(maitre);
    return p;
  };
  // enveloppe d'un son : attaque en a secondes jusqu'à vol (× volume de la distance), puis extinction jusqu'à dur
  const enveloppe = (g, t, vol, a, dur) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * volume), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  };
  // un oscillateur (sine, square, sawtooth, triangle) qui glisse de f0 à f1 Hz en dur secondes ;
  // o = { d : retard (s), a : attaque (s), lp : filtre passe-bas (Hz) }
  function tone(type, f0, f1, dur, vol, o) {
    o = o || {};
    const t = ac.currentTime + (o.d || 0),
      os = ac.createOscillator(),
      g = ac.createGain();
    os.type = type;
    os.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    enveloppe(g, t, vol, o.a || 0.006, dur);
    let n = os;
    if (o.lp) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      os.connect(f);
      n = f;
    }
    n.connect(g);
    g.connect(sortie());
    voix++;
    os.onended = () => voix--;
    os.start(t);
    os.stop(t + dur + 0.05);
  }
  // un bruit filtré (lowpass, highpass, bandpass) dont la fréquence glisse de f0 à f1 ; o = { d : retard, a : attaque, q : résonance }
  function noise(dur, vol, type, f0, f1, o) {
    o = o || {};
    const t = ac.currentTime + (o.d || 0),
      s = ac.createBufferSource(),
      f = ac.createBiquadFilter(),
      g = ac.createGain();
    s.buffer = bruitBlanc;
    f.type = type || 'lowpass';
    f.frequency.setValueAtTime(f0 || 1200, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (o.q) f.Q.value = o.q;
    enveloppe(g, t, vol, o.a || 0.004, dur);
    s.connect(f);
    f.connect(g);
    g.connect(sortie());
    voix++;
    s.onended = () => voix--;
    s.start(t, Math.random() * 0.6, dur + 0.05);
  }
  // des notes qui se suivent (fs en Hz, gap secondes entre deux)
  const arpege = (fs, gap, dur, vol, type) => fs.forEach((f, i) => tone(type || 'triangle', f, f, dur, vol, { d: i * gap }));
  // V3.9 : le lance-flammes. Une boucle de souffle (bruit filtré) démarre au premier tic avec un « whoumf » d'allumage ; chaque tic (12 par seconde)
  // la maintient et programme sa retombée 0,12 s plus tard (annulée par le tic suivant) : elle s'éteint seule quand on lâche Tir. Coupée 0,8 s après le dernier tic.
  let boucle = null;
  function souffle() {
    const t = ac.currentTime;
    if (!boucle) {
      const s = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        f2 = ac.createBiquadFilter(),
        g = ac.createGain();
      s.buffer = bruitBlanc;
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
      g.connect(maitre);
      s.start(t, Math.random() * 0.6);
      voix++;
      boucle = { s, f, g, k: 0 };
      noise(0.34, 0.075, 'bandpass', 240, 1300, { q: 0.7, a: 0.04 });
      noise(0.14, 0.05, 'lowpass', 420, 120);
    }
    const g = boucle.g.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.05, t, 0.035);
    g.setTargetAtTime(0.0001, t + 0.12, 0.07);
    boucle.f.frequency.setTargetAtTime(420 + Math.random() * 260, t, 0.05);
    if (Math.random() < 0.3) noise(0.025, 0.022, 'highpass', 2600, 1200, { d: Math.random() * 0.05 });
    clearTimeout(boucle.k);
    const me = boucle;
    boucle.k = setTimeout(() => {
      if (boucle === me) boucle = null;
      try {
        me.s.stop();
        me.s.disconnect();
      } catch (_) {}
      voix--;
    }, 800);
  }
  // les sons, par nom (SND.play('nom') ou SND.at('nom', …)) ; a = l'argument passé à play / at
  const SONS = {
    // un tir du joueur, selon l'arme w (rien = le fusil)
    shot(w) {
      if (w === 'pistolet') {
        // pistolet : sec et claquant
        noise(0.05, 0.3, 'lowpass', 5200, 1400);
        tone('square', 260, 90, 0.06, 0.14, { lp: 1800 });
        noise(0.02, 0.12, 'highpass', 6000);
      } else if (w === 'assaut') {
        // assaut : court, léger (il en part beaucoup)
        noise(0.045, 0.24, 'lowpass', 3800, 1100);
        tone('square', 150, 70, 0.05, 0.11, { lp: 1300 });
      } else if (w === 'sniper') {
        // sniper : lourd, avec l'écho
        noise(0.32, 0.42, 'lowpass', 2600, 160);
        tone('sine', 90, 32, 0.4, 0.42);
        noise(0.04, 0.16, 'highpass', 4200);
        noise(0.5, 0.06, 'bandpass', 600, 200, { q: 0.8, d: 0.12 });
      } else if (w === 'pompe') {
        // pompe : grave et large, avec sa queue
        noise(0.16, 0.44, 'lowpass', 3200, 320);
        tone('sine', 78, 30, 0.32, 0.48);
        noise(0.035, 0.15, 'highpass', 3800);
        noise(0.6, 0.07, 'bandpass', 480, 150, { q: 0.7, d: 0.1 });
        // clac-clac : la pompe recule puis revient
        for (const q of [
          [0.29, 2300, 1500],
          [0.47, 1700, 1100]
        ]) {
          noise(0.03, 0.15, 'bandpass', q[1], q[2], { q: 2.6, d: q[0] });
          tone('square', q[1] * 0.24, q[2] * 0.2, 0.035, 0.035, { lp: 2600, d: q[0] });
          noise(0.06, 0.06, 'lowpass', 900, 300, { d: q[0] + 0.01 });
        }
      } else if (w === 'lance') souffle();
      else {
        // le fusil
        noise(0.07, 0.32, 'lowpass', 4200, 900);
        tone('square', 180, 60, 0.08, 0.16, { lp: 1400 });
        noise(0.025, 0.12, 'highpass', 5000);
      }
    },
    // tourelles : mitrailleuse (rafale, au plus un toutes les 55 ms), mortier (départ du coup)
    mg() {
      if (!cadence('mg', 55)) return;
      noise(0.05, 0.16, 'lowpass', 2600, 700);
      tone('square', 140, 70, 0.04, 0.06, { lp: 900 });
    },
    mortar() {
      if (!cadence('mo', 90)) return;
      tone('sine', 130, 45, 0.25, 0.4);
      noise(0.14, 0.22, 'lowpass', 800, 250);
    },
    // explosions : boom (r = rayon, plus fort s'il est grand), big (missile, frappe aérienne, impact de météore)
    boom(r) {
      if (!cadence('boom', 60)) return;
      const k = Math.min(1, 0.45 + (+r || 3) * 0.07);
      noise(0.5, 0.45 * k, 'lowpass', 1400, 120);
      tone('sine', 90, 32, 0.4, 0.4 * k);
    },
    big() {
      noise(1.1, 0.6, 'lowpass', 1200, 60);
      tone('sine', 70, 25, 1, 0.6);
    },
    // touché, tué, argent ramassé, râle d'un zombie
    hit() {
      if (cadence('hit', 40)) noise(0.03, 0.08, 'bandpass', 2200, 0, { q: 1.5 });
    },
    kill() {
      if (!cadence('kill', 60)) return;
      noise(0.08, 0.1, 'lowpass', 900, 300);
      tone('sine', 300, 90, 0.12, 0.08);
    },
    coin() {
      if (cadence('coin', 90)) {
        tone('sine', 1320, 1320, 0.06, 0.05);
        tone('sine', 1980, 1980, 0.1, 0.04, { d: 0.04 });
      }
    },
    groan() {
      const f = 70 + Math.random() * 50;
      tone('sawtooth', f, f * 0.7, 0.9 + Math.random() * 0.6, 0.05, { lp: 500, a: 0.15 });
      noise(0.7, 0.025, 'bandpass', 300, 200, { q: 2, a: 0.2 });
    },
    // la partie : sirène de l'aube, jour tenu, route ouverte, mastodonte, tourelle posée / retirée, achat, refus, compétence lancée,
    // onde de choc, leurre, frappe aérienne, hélicoptère, mort, fuyard, victoire, clic, pas
    siren() {
      for (let k = 0; k < 2; k++) tone('sawtooth', 420, 640, 0.7, 0.06, { lp: 1600, d: k * 0.75, a: 0.1 });
      tone('sawtooth', 640, 420, 0.7, 0.06, { lp: 1600, d: 1.5, a: 0.1 });
    },
    clear() {
      arpege([523, 659, 784, 1047], 0.1, 0.35, 0.14);
    },
    road() {
      noise(1.2, 0.6, 'lowpass', 900, 60);
      tone('sine', 60, 28, 1.1, 0.55);
      noise(0.4, 0.2, 'highpass', 2500, 600, { d: 0.05 });
    },
    boss() {
      tone('sawtooth', 73, 65, 1.6, 0.22, { lp: 400, a: 0.2 });
      tone('sawtooth', 110, 98, 1.6, 0.14, { lp: 500, a: 0.25 });
      noise(1.3, 0.2, 'lowpass', 200, 80);
    },
    place() {
      tone('sine', 220, 120, 0.14, 0.3);
      noise(0.08, 0.2, 'lowpass', 1600, 500);
      tone('triangle', 660, 660, 0.12, 0.08, { d: 0.08 });
    },
    remove() {
      tone('triangle', 500, 250, 0.15, 0.1);
    },
    buy() {
      arpege([523, 784, 1047], 0.06, 0.18, 0.12);
    },
    no() {
      tone('square', 220, 160, 0.12, 0.06, { lp: 900 });
    },
    // le joueur mordu (V4.0 : la recette existait depuis le début, sans jamais être jouée) : un coup sourd, au plus toutes les 0,2 s
    hurt() {
      if (!cadence('hurt', 200)) return;
      tone('sine', 170, 80, 0.18, 0.3);
      noise(0.1, 0.2, 'lowpass', 700);
    },
    launch() {
      noise(0.6, 0.25, 'bandpass', 900, 3000, { q: 0.8 });
      tone('sawtooth', 200, 700, 0.5, 0.05, { lp: 2000 });
    },
    onde() {
      noise(1, 0.5, 'lowpass', 700, 60);
      tone('sine', 200, 40, 0.9, 0.5);
      arpege([196, 147, 98], 0.08, 0.4, 0.12, 'sawtooth');
    },
    decoy() {
      tone('square', 880, 880, 0.08, 0.05);
      tone('square', 880, 880, 0.08, 0.05, { d: 0.25 });
    },
    jet() {
      noise(2.2, 0.3, 'bandpass', 400, 2500, { q: 0.5, a: 0.6 });
    },
    heli() {
      if (!cadence('heli', 120)) return;
      noise(0.1, 0.12, 'lowpass', 260, 120);
    },
    dead() {
      arpege([392, 330, 262, 196], 0.22, 0.7, 0.2, 'sawtooth');
    },
    esc() {
      if (!cadence('esc', 350)) return;
      tone('square', 660, 330, 0.25, 0.07, { lp: 1800 });
      tone('square', 520, 260, 0.25, 0.05, { lp: 1600, d: 0.12 });
    },
    win() {
      arpege([523, 659, 784, 1047, 1319, 1568], 0.12, 0.6, 0.18);
    },
    click() {
      tone('sine', 880, 660, 0.04, 0.05);
    },
    step() {
      noise(0.05, 0.03, 'lowpass', 650, 300);
    },
    // V1.5 : cloisons qui cassent, masse, planches
    // plâtre qui encaisse, un peu de poussière
    wallhit() {
      if (!cadence('wh', 45)) return;
      noise(0.1, 0.3, 'lowpass', 1800, 350);
      tone('sine', 150, 70, 0.09, 0.18);
      noise(0.12, 0.06, 'bandpass', 2600, 1400, { q: 1.2, d: 0.03 });
    },
    // le pan qui s'effondre, puis les gravats
    wallbreak() {
      if (!cadence('wb', 90)) return;
      noise(0.6, 0.5, 'lowpass', 1500, 120);
      tone('sine', 95, 34, 0.45, 0.38);
      for (let k = 0; k < 4; k++)
        noise(0.07, 0.12, 'bandpass', 900 + Math.random() * 1500, 0, { q: 1.4, d: 0.12 + k * 0.09 + Math.random() * 0.05 });
    },
    // le souffle de la masse (et de l'escalade)
    swing() {
      noise(0.24, 0.22, 'bandpass', 300, 1600, { q: 0.7, a: 0.1 });
    },
    // départ du sprint (et de la tyrolienne, du bond de Volt) : un souffle, deux appuis
    dash() {
      if (!cadence('dash', 250)) return;
      noise(0.3, 0.16, 'bandpass', 250, 1100, { q: 0.6, a: 0.04 });
      for (const d of [0, 0.11]) noise(0.05, 0.07, 'lowpass', 700, 300, { d });
    },
    // le coup de masse : a = 2 dans un mur (plus sourd), 1 dans un zombie
    masse(a) {
      if (!cadence('ma', 80)) return;
      if (a === 2) {
        tone('sine', 100, 42, 0.2, 0.5, { lp: 500 });
        noise(0.16, 0.3, 'lowpass', 650, 140);
        noise(0.1, 0.08, 'bandpass', 1400, 700, { q: 1, d: 0.04 });
      } else {
        tone('sine', 160, 60, 0.13, 0.42);
        noise(0.11, 0.3, 'lowpass', 1300, 280);
        noise(0.08, 0.12, 'bandpass', 700, 400, { q: 2, d: 0.02 });
      }
    },
    // une planche clouée : deux coups de marteau sur un clou
    plank() {
      for (const d of [0, 0.17]) {
        tone('triangle', 1150, 820, 0.05, 0.07, { d });
        noise(0.05, 0.17, 'bandpass', 1900, 900, { q: 1.6, d });
        tone('sine', 230, 140, 0.09, 0.16, { d });
      }
    },
    // une planche arrachée : le bois qui grince, craque, puis cède
    tear() {
      if (!cadence('tear', 120)) return;
      tone('sawtooth', 150, 85, 0.32, 0.05, { lp: 700, a: 0.05 });
      for (let k = 0; k < 5; k++)
        noise(0.035, 0.1, 'bandpass', 900 + Math.random() * 1800, 0, { q: 2.5, d: k * 0.05 + Math.random() * 0.03 });
      noise(0.09, 0.18, 'highpass', 1800, 700, { d: 0.28 });
      tone('sine', 180, 70, 0.1, 0.18, { d: 0.28 });
    },
    // V3.0 : les héros. Braise : la boule de feu part en grondant ; le météore siffle en tombant (l'impact, c'est « big »)
    fireball() {
      noise(0.5, 0.32, 'bandpass', 300, 1600, { q: 0.7, a: 0.03 });
      noise(0.35, 0.14, 'lowpass', 900, 250, { d: 0.06 });
      tone('sawtooth', 110, 55, 0.45, 0.05, { lp: 500, a: 0.04 });
    },
    meteor() {
      if (!cadence('met', 120)) return;
      tone('sine', 1500, 260, 0.55, 0.16, { a: 0.05 });
      noise(0.55, 0.3, 'bandpass', 2600, 500, { q: 2.5, a: 0.25 });
    },
    // Ondine : la vague (houle qui monte, écume, gouttes) ; la pluie du Déluge (8 s en boucle, un coup de tonnerre au début)
    vague() {
      noise(1.1, 0.42, 'bandpass', 260, 1300, { q: 0.5, a: 0.3 });
      noise(0.7, 0.24, 'highpass', 2400, 900, { d: 0.35, a: 0.03 });
      tone('sine', 85, 45, 0.7, 0.22, { a: 0.12 });
      for (let k = 0; k < 5; k++)
        noise(0.05, 0.08, 'bandpass', 1800 + Math.random() * 2000, 0, { q: 3, d: 0.45 + k * 0.07 + Math.random() * 0.05 });
    },
    // d = durée en secondes (8 par défaut, 2 au moins) ; appelée par ult('eau')
    pluie(d) {
      d = Math.max(2, +d || 8);
      const t = ac.currentTime,
        s = ac.createBufferSource(),
        f = ac.createBiquadFilter(),
        g = ac.createGain();
      s.buffer = bruitBlanc;
      s.loop = true;
      f.type = 'bandpass';
      f.frequency.value = 2600;
      f.Q.value = 0.4;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16 * volume, t + 0.9);
      g.gain.setValueAtTime(0.16 * volume, t + d - 1.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f);
      f.connect(g);
      g.connect(sortie());
      voix++;
      s.onended = () => voix--;
      s.start(t);
      s.stop(t + d + 0.05);
      noise(1.6, 0.4, 'lowpass', 600, 50, { d: 0.1, a: 0.04 });
    },
    // Sylve : les ronces (craquements, froissement) ; les arbres gardiens (bois qui pousse, trois notes) ; la flèche (sifflement court)
    ronces() {
      for (let k = 0; k < 7; k++)
        noise(0.05, 0.13, 'bandpass', 500 + Math.random() * 1500, 0, { q: 3, d: k * 0.055 + Math.random() * 0.03 });
      tone('sawtooth', 80, 150, 0.5, 0.07, { lp: 450, a: 0.1 });
      noise(0.6, 0.16, 'bandpass', 2200, 700, { q: 0.6, a: 0.12 });
    },
    arbre() {
      tone('sawtooth', 55, 110, 1.3, 0.1, { lp: 380, a: 0.35 });
      noise(1.1, 0.2, 'bandpass', 260, 900, { q: 0.8, a: 0.35 });
      arpege([392, 523, 659, 784], 0.13, 0.6, 0.07, 'sine');
    },
    fleche() {
      if (!cadence('arw', 70)) return;
      noise(0.14, 0.5, 'bandpass', 3000, 1000, { q: 1.1 });
      tone('triangle', 950, 420, 0.09, 0.14);
    },
    // Roc : la pierre qui sort du sol, qui s'effondre (cassée) ou s'enfonce (fin du temps) ; le Séisme (grondement long, craquements)
    rempart() {
      tone('sine', 42, 85, 0.75, 0.5, { a: 0.12 });
      noise(0.8, 0.42, 'lowpass', 250, 1100, { a: 0.2 });
      for (let k = 0; k < 6; k++)
        noise(0.05, 0.13, 'bandpass', 700 + Math.random() * 1300, 0, { q: 2, d: 0.3 + k * 0.07 + Math.random() * 0.04 });
    },
    eboul() {
      if (!cadence('eb', 150)) return;
      noise(0.9, 0.55, 'lowpass', 1000, 80);
      tone('sine', 68, 28, 0.65, 0.45);
      for (let k = 0; k < 8; k++)
        noise(0.06, 0.16, 'bandpass', 450 + Math.random() * 1100, 0, { q: 1.5, d: 0.05 + k * 0.08 + Math.random() * 0.05 });
    },
    enfonce() {
      noise(0.9, 0.25, 'lowpass', 380, 70, { a: 0.1 });
      tone('sine', 70, 35, 0.8, 0.25, { a: 0.1 });
    },
    seisme() {
      tone('sine', 38, 26, 1.8, 0.65, { a: 0.06 });
      noise(1.8, 0.5, 'lowpass', 240, 55, { a: 0.08 });
      for (let k = 0; k < 7; k++) noise(0.13, 0.22, 'lowpass', 1100, 220, { d: 0.15 + k * 0.2 + Math.random() * 0.1 });
    },
    // Volt : l'arc d'une balle qui saute (crépitement bref), la foudre de l'orage (claquement + roulement, pas plus d'un roulement toutes les 0,38 s), le bond
    zap() {
      if (!cadence('zap', 60)) return;
      noise(0.07, 0.24, 'highpass', 3600, 1800);
      tone('square', 1300 + Math.random() * 700, 320, 0.07, 0.07, { lp: 5200 });
    },
    tonnerre() {
      if (cadence('th', 380)) {
        noise(0.07, 0.42, 'highpass', 2600, 900);
        noise(1.3, 0.5, 'lowpass', 800, 55, { d: 0.04, a: 0.03 });
        tone('sine', 58, 28, 1.1, 0.38, { d: 0.04 });
      } else if (cadence('th2', 90)) noise(0.08, 0.28, 'highpass', 3000, 1200);
    },
    // V3.9 : le cri du hurleur (strident et court : il monte, se casse, redescend en râlant ; pas plus d'un toutes les 0,25 s)
    hurle() {
      if (!cadence('hurle', 250)) return;
      tone('sawtooth', 620, 1380, 0.22, 0.16, { lp: 3800, a: 0.03 });
      tone('sawtooth', 1380, 520, 0.5, 0.14, { lp: 3200, d: 0.2, a: 0.02 });
      tone('square', 940, 1900, 0.2, 0.045, { lp: 5200, a: 0.03 });
      tone('square', 1900, 700, 0.48, 0.04, { lp: 4200, d: 0.2 });
      noise(0.7, 0.26, 'bandpass', 2600, 1500, { q: 3, a: 0.04 });
    },
    eclair() {
      noise(0.28, 0.3, 'bandpass', 1200, 5200, { q: 0.7, a: 0.01 });
      tone('sawtooth', 260, 1900, 0.22, 0.06, { lp: 6500 });
      noise(0.09, 0.2, 'highpass', 4200, 2000, { d: 0.03 });
    },
    // V4.8 : Zéphyr : la Rafale (un coup de vent qui siffle) ; le Tir perçant (un claquement grave et un sifflement qui file)
    rafale() {
      noise(0.55, 0.34, 'bandpass', 500, 2600, { q: 0.9, a: 0.02 });
      tone('sine', 900, 1500, 0.3, 0.04, { a: 0.05 });
    },
    percant() {
      noise(0.12, 0.42, 'lowpass', 2400, 300, {});
      tone('sawtooth', 140, 60, 0.35, 0.16, { lp: 900 });
      noise(0.9, 0.22, 'bandpass', 4200, 900, { q: 1.4, d: 0.05, a: 0.02 });
    },
    // ultime : un souffle qui monte et un accord propre au héros, puis le son de l'ultime lui-même
    ult(h) {
      const C = {
        feu: [262, 330, 392, 523],
        eau: [294, 370, 440, 587],
        bois: [247, 311, 370, 494],
        terre: [196, 247, 294, 392],
        elec: [330, 415, 494, 659],
        vent: [349, 440, 523, 698]
      }[h] || [262, 330, 392, 523];
      noise(0.7, 0.22, 'bandpass', 260, 3200, { q: 0.6, a: 0.3 });
      arpege(C, 0.07, 0.7, 0.11, 'triangle');
      tone('sine', C[0] / 2, C[0] / 2, 0.9, 0.2, { a: 0.15 });
      if (h === 'eau') SONS.pluie(8);
      else if (h === 'terre') SONS.seisme();
      else if (h === 'bois') SONS.arbre();
      else if (h === 'elec') noise(1.4, 0.3, 'lowpass', 500, 60, { d: 0.25, a: 0.2 });
    }
  };
  // un son peut partir : audio créé, voulu, en marche, et pas plus de 40 sources à la fois
  const can = () => ac && actif && ac.state === 'running' && voix < 40;
  // un son tel quel (interface : clics, sirène, tirs du joueur…)
  function play(n, a) {
    if (!can() || !SONS[n]) return;
    volume = 1;
    pan = 0;
    try {
      SONS[n](a);
    } catch (_) {}
  }
  // un son placé dans le monde en (x, y, z) : volume 1 / (1 + distance / 18), rien au-delà de ~ 340 m, panoramique selon le cap de la caméra
  function at(n, x, z, a, y) {
    if (!can() || !SONS[n]) return;
    const c = camera.position,
      dx = x - c.x,
      dz = z - c.z,
      d = Math.hypot(dx, dz, (y || 0) - c.y);
    volume = 1 / (1 + d / 18);
    if (volume < 0.05) return;
    const r = camera.rotation.y;
    pan = Math.max(-0.8, Math.min(0.8, (dx * Math.cos(r) - dz * Math.sin(r)) / Math.max(d, 2)));
    try {
      SONS[n](a);
    } catch (_) {}
    volume = 1;
    pan = 0;
  }
  // son oui / non (réglage de l'interface)
  function set(v) {
    actif = v;
    if (actif) resume();
    else if (ac) ac.suspend();
  }
  // l'audio ne démarre qu'après un geste ; il se coupe quand la page est cachée
  for (const k of ['pointerdown', 'pointerup', 'touchend', 'click']) window.addEventListener(k, resume, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else if (actif) ac.resume().catch(() => {});
  });
  return { play, at, set, resume };
})();
