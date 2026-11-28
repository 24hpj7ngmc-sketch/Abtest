// [lobby/taverne.js] La taverne et ses défis ; le panneau du renom.
// ---- taverne : trois défis en cours, qui avancent à chaque partie. On vient y chercher la récompense ; un nouveau défi prend la place.
// LES DÉFIS COMPTENT LES DEUX PORTAILS : kills, boss, waves, hard, obj se font sur l'île ; zomb, jours, secours sur le toit ; win et hero partout.
const QT = {
  kills: { n: [80, 150, 250], g: [80, 130, 200], t: n => 'Élimine ' + n + " ennemis sur l'île" },
  boss: { n: [2, 4, 6], g: [90, 150, 220], t: n => 'Bats ' + n + " boss sur l'île" },
  waves: { n: [12, 25, 40], g: [80, 130, 200], t: n => 'Repousse ' + n + " vagues sur l'île" },
  win: {
    n: [1, 2],
    g: [120, 220],
    t: n => (n > 1 ? 'Gagne ' + n + ' parties' : 'Gagne une partie') + ' (île ou toit)'
  },
  hard: { n: [1], g: [200], t: () => "Gagne une partie en Difficile sur l'île" },
  obj: { n: [2, 4], g: [100, 170], t: n => 'Réussis ' + n + " objectifs de vague sur l'île" },
  hero: {
    n: [1, 2],
    g: [70, 120],
    t: (n, el) => (n > 1 ? 'Termine ' + n + ' parties' : 'Termine une partie') + ' avec ' + EL[el].hero
  },
  zomb: { n: [400, 1200, 3000], g: [80, 130, 200], t: n => 'Abats ' + n + ' zombies sur le toit' },
  jours: { n: [4, 8, 14], g: [80, 130, 200], t: n => 'Tiens ' + n + ' jours sur le toit' },
  secours: { n: [1], g: [200], t: () => 'Sois secouru sur le toit' }
};
function qFill() {
  if (!hasB('taverne')) return;
  save.q = save.q.filter(q => q && QT[q.k]);
  while (save.q.length < 3) {
    const ks = Object.keys(QT).filter(k => !save.q.some(q => q.k === k)),
      k = ks[Math.floor(Math.random() * ks.length)],
      T = QT[k],
      i = Math.floor(Math.random() * T.n.length),
      q = { k, n: T.n[i], g: T.g[i], p: 0 };
    if (k === 'hero') q.el = ELS[Math.floor(Math.random() * 5)];
    save.q.push(q);
  }
}
// o : ce qu'une partie finie apporte aux défis — { game:'ile'|'toit', kills, boss, units (niveau de vague sur l'île), days, win, hard, obj, fini (trois vagues ou trois jours tenus), el }
function qGame(o) {
  if (!hasB('taverne')) return;
  qFill();
  const I = o.game === 'ile',
    T = o.game === 'toit';
  for (const q of save.q) {
    const d =
      q.k === 'kills'
        ? I
          ? o.kills
          : 0
        : q.k === 'boss'
          ? I
            ? o.boss
            : 0
          : q.k === 'waves'
            ? I
              ? o.units
              : 0
            : q.k === 'win'
              ? o.win
                ? 1
                : 0
              : q.k === 'hard'
                ? I && o.win && o.hard
                  ? 1
                  : 0
                : q.k === 'obj'
                  ? I
                    ? o.obj
                    : 0
                  : q.k === 'zomb'
                    ? T
                      ? o.kills
                      : 0
                    : q.k === 'jours'
                      ? T
                        ? o.days
                        : 0
                      : q.k === 'secours'
                        ? T && o.win
                          ? 1
                          : 0
                        : o.el === q.el && o.fini
                          ? 1
                          : 0;
    q.p = Math.min(q.n, q.p + Math.round(d || 0));
  }
}
function tavOpen() {
  qFill();
  persist();
  $('tavV').hidden = false;
  SND.play('tick');
  tavDraw();
}
function tavDraw() {
  $('tavB').innerHTML = save.q
    .map((q, i) => {
      const done = q.p >= q.n,
        g = Math.round((q.g * tavK()) / 5) * 5;
      return `<div class="srow"><span><b>${QT[q.k].t(q.n, q.el)}</b><small>${q.p} / ${q.n} · récompense : ${g} or et 10 renom</small></span><button class="${done ? 'solid' : 'ghost'}" data-i="${i}"${done ? '' : ' disabled'}>${done ? 'Réclamer' : 'En cours'}</button></div>`;
    })
    .join('');
  $('tavB')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          const q = save.q[+b.dataset.i];
          if (!q || q.p < q.n) return;
          const g = Math.round((q.g * tavK()) / 5) * 5;
          save.gold += g;
          save.qd++;
          save.q.splice(+b.dataset.i, 1);
          qFill();
          persist();
          SND.play('coin');
          toast('Défi réussi · +' + g + ' or · +10 renom');
          lobSync();
          tavDraw();
        })
    );
}
$('tavX').onclick = () => {
  $('tavV').hidden = true;
};
$('upX').onclick = () => {
  $('upV').hidden = true;
};
// ---- panneau du renom : d'où il vient, et ce que débloque le prochain niveau
function renOpen() {
  const r = renom(),
    L = save.evo || 1,
    row = (n, v, d) =>
      `<div class="srow"><span><b>${n}</b><small>${d}</small></span><span class="gold">${v}</span></div>`;
  $('renV').hidden = false;
  SND.play('tick');
  const lag = [...new Set(save.vil.filter(o => o.t !== 'hall' && CAT[o.t].up && lvOf(o) < L).map(o => CAT[o.t].n))],
    ks = CATK.filter(k => CAT[k].lv === L + 1).map(k => CAT[k].n);
  $('renT').textContent = 'Évolution ' + L + ' / 6';
  $('renB').innerHTML =
    (L >= 6
      ? '<p><b>Évolution finale atteinte.</b></p>'
      : `<div class="srow"><span><b>Prochaine : évolution ${L + 1}</b><small>Île plus grande, relief plus haut${ks.length ? ' · nouveau : ' + ks.join(', ') : ''}.</small></span><span class="gold">${UPC[L + 1]} or</span></div>` +
        '<p>' +
        (lag.length
          ? "Pour y arriver : monte d'abord au niveau " +
            L +
            ' : <b>' +
            lag.join(', ') +
            '</b>, puis améliore le Hall des héros.'
          : 'Tout le village est au niveau ' + L + ' : <b>améliore le Hall des héros</b>.') +
        '</p>') +
    '<h2>Renom : ' +
    r.tot +
    '</h2>' +
    row('Artefacts du musée', r.art, '25 par artefact différent, 3 par exemplaire en plus.') +
    row('Étoiles de victoire', r.star, '20 par héros victorieux.') +
    row(
      'Records',
      r.rec,
      "Sur l'île, meilleure vague : 3,5 par vague en Normal, 4 en Difficile. Sur le toit : 7 par jour tenu."
    ) +
    row('Bâtiments', r.bat, '10 par bâtiment à rôle, 20 par niveau en plus.') +
    row('Héros et armes', r.her, "1 par niveau de héros, 2 par niveau d'arme.") +
    row('Défis de la taverne', r.def, '10 par défi réussi.') +
    '<p>Le renom est ton score : il ne débloque rien.</p>';
}
$('renX').onclick = () => {
  $('renV').hidden = true;
};
$('lTop').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (lobOv()) return;
  lGuard = performance.now() + 450;
  renOpen();
});
function envSet(k) {
  const E = ENV[k];
  if (!E || LB.env === k) return;
  LB.env = k;
  TC = E.tc;
  const U = lskyU,
    S = E.sky;
  U.cTop.value = V3(S[0]);
  U.cMid.value = V3(S[1]);
  U.cHor.value = V3(S[2]);
  U.cAur.value = V3(S[3]);
  U.cSun.value = V3(S[4]);
  U.kStar.value = S[5];
  lcldU.cLo.value = V3(E.cld[0]);
  lcldU.cHi.value = V3(E.cld[1]);
  lcldU.cGl.value = V3(E.cld[2]);
  lcldU.fogCol.value = new THREE.Color(E.fog);
  lob.fog.color.setHex(E.fog);
  lob.background.setHex(E.fog);
  lHemi.color.setHex(E.hemi[0]);
  lHemi.groundColor.setHex(E.hemi[1]);
  lHemi.intensity = E.hemi[2];
  lSunL.color.setHex(E.sun[0]);
  lSunL.intensity = E.sun[1];
  lRimL.color.setHex(E.rim[0]);
  lRimL.intensity = E.rim[1];
  lWater.material.color.setHex(E.water[0]);
  lWater.material.opacity = E.water[1];
  lmotes.im.material.color.setHex(E.mote);
  for (const G of LGAMES) if (G.gl) G.gl.material.color.setHex(E.glow);
  if (NATK !== k && (NATK || 1) !== k) {
    NATK = k;
    mountSet(MHc);
    terrLocks();
    if (LB.on) LB.y = Math.max(LB.y, hAt(LB.x, LB.z));
  }
  NATK = k;
  terrDraw();
  vilGround();
  payTheme();
}
