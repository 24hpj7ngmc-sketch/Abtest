// [lobby/arme.js] L'outil Arme du lobby (V12.7) : on voit en 1re personne l'arme choisie, à la couleur de son élément, qui suit la course ; Action = « Montrer » (inspection d'environ 1,5 s). Les autres joueurs du salon la voient dans la main de ton avatar.
// ---- l'arme en main au lobby
// les six armes en main (modèles vm.* de gfx/models/armes.js, copie de ceux de Dernier Toit) ; une liste, jamais un objet (une clé venue du réseau ne doit pas atteindre un prototype)
const ARMES = ['pistolet', 'assaut', 'sniper', 'fusil', 'pompe', 'lance'],
  INSPECT = 1.5;
// LA : g = l'arme devant la caméra, key = ce qu'elle montre (arme, élément, héros), up = 0 (rangée) à 1 (levée), ins = temps d'inspection en cours (−1 : aucune)
const LA = { g: null, key: '', hold: [0.22, -0.2, -0.5, 0, 0, 0], up: 0, ins: -1 };
// l'arme du joueur et son élément : la sienne (salle d'armes ou dernier portail), l'élément choisi pour elle, sinon celui du héros joué (wEl)
function armeSel() {
  const a = ARMES.includes(tWeap) ? tWeap : 'pistolet';
  return { a, el: wEl(a) };
}
// gants tactiques sombres et manches teintées à la couleur du héros, comme en partie (Dernier Toit)
function armeGants(h) {
  const c = parseInt(String((EL[h] || EL.feu).c).slice(1), 16) || 0,
    m = K.mix(c, 0x30353b, 0.5);
  return { sleeve: K.hex(m), sleeveD: K.hex(K.shade(m, 0.65)), glove: 0x3a3732, gloveD: 0x24221f };
}
// l'arme (modèle cuit une fois par arme, élément et héros) en main d'un joueur : un exemplaire neuf
function armeInst(a, el, h) {
  const p = prepOf('vm.' + a, { el, H: armeGants(h) }, a + '|' + el + '|' + h);
  return { g: K.inst(p, { cast: false, recv: false }), hold: p.hold || LA.hold, tip: p.tip };
}
// l'enveloppe de l'inspection : monte (22 %), reste, redescend (22 %) ; u de 0 à 1
const armeEnv = u => {
  if (u <= 0 || u >= 1) return 0;
  const e = v => v * v * (3 - 2 * v);
  return u < 0.22 ? e(u / 0.22) : u > 0.78 ? e((1 - u) / 0.22) : 1;
};
// ce qu'on reçoit d'un autre joueur (« arme|élément ») : jamais de confiance, deux mots de la liste ou rien
function armeNet(v) {
  if (typeof v !== 'string' || v.length > 16) return null;
  const q = v.split('|');
  if (q.length !== 2 || !ARMES.includes(q[0]) || !HEROS.includes(q[1])) return null;
  return { a: q[0], el: q[1], k: v };
}
// ce que je publie : rien si je n'ai pas l'arme en main
function armePub() {
  if (LB.tool !== 'arme') return null;
  const s = armeSel();
  return s.a + '|' + s.el;
}
function armeShow() {
  if (LB.tool !== 'arme' || LA.ins >= 0) return;
  LA.ins = 0;
  SND.play('tick');
  LB.sig = '';
}
// à chaque image du lobby : la pose de l'arme devant la caméra (même balancement et même course que Dernier Toit), et l'inspection
function armeFrame(dt) {
  const on = LB.on && LB.tool === 'arme';
  LA.up = Math.max(0, Math.min(1, LA.up + (on ? 1 : -1) * dt * 5.5));
  if (LA.ins >= 0) {
    LA.ins += dt;
    if (LA.ins >= INSPECT) {
      LA.ins = -1;
      LB.sig = '';
    }
  }
  if (LA.up <= 0.001 && !on) {
    if (LA.g) LA.g.visible = false;
    return;
  }
  const s = armeSel(),
    key = s.a + '|' + s.el + '|' + tHero;
  if (key !== LA.key) {
    if (LA.g) lcam.remove(LA.g);
    const m = armeInst(s.a, s.el, tHero);
    LA.g = m.g;
    LA.hold = m.hold;
    LA.key = key;
    lcam.add(LA.g);
  }
  const g = LA.g,
    H = LA.hold,
    bt = LB.bob * 0.5,
    e = LA.up * LA.up * (3 - 2 * LA.up),
    env = armeEnv(LA.ins / INSPECT),
    c = LB.spk * (1 - 0.85 * env);
  g.visible = true;
  // repos, balancement de la marche, arme baissée quand on la sort ou la range
  let x = H[0] + Math.sin(bt) * 0.008,
    y = H[1] - (1 - e) * 0.6 + Math.abs(Math.cos(bt)) * 0.006,
    z = H[2],
    rx = H[3],
    ry = H[4],
    rz = H[5];
  // course : baissée, tournée sur le côté, qui balance
  x += 0.05 * c;
  y -= 0.07 * c + Math.abs(Math.sin(bt)) * 0.02 * c;
  z += 0.05 * c;
  rx -= 0.38 * c;
  ry += 0.55 * c;
  rz += 0.3 * c + Math.sin(bt) * 0.06 * c;
  // inspection : l'arme se lève au centre et pivote pour montrer son flanc, un léger roulis, puis elle revient
  x += (-0.2 + Math.sin(LA.ins * 4) * 0.01) * env;
  y += (0.1 + Math.sin(LA.ins * 3) * 0.01) * env;
  z += 0.03 * env;
  rx -= 0.16 * env;
  ry += (1.25 + 0.18 * Math.sin(LA.ins * 2.6)) * env;
  rz += (0.1 + 0.05 * Math.sin(LA.ins * 3.4)) * env;
  g.position.set(x, y, z);
  g.rotation.set(rx, ry, rz);
}
