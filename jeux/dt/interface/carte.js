// carte.js — la mini-carte (en haut à gauche, redessinée 8 fois par seconde par la boucle) et la grande carte (mini-carte touchée)
// avec ses réglages : Son, Tir auto sur cible, Caméra, Mode dev, Règles (V4.2, mode fuite), Abandonner, Reprendre.
// Utilise des règles : PLAZA, ROADS, roadOpen, B, SLOTS, TT, turretReach, ZIPS, PASSW, SHOPS ; de l'interface : GUIDEP, rulesOpen (regles.js) ;
// des sons : SND.
// Les tests appellent openMap.

// ---------------------------------------------------------------- mini-carte et grande carte (options)
const mg = $('mini').getContext('2d');
// dessine la ville vue de dessus dans un disque (repère de 208 × 208 mis à l'échelle de `taille` pixels), `rayon` mètres autour du centre :
// place, rues (fermées : croix rouge), immeuble, zombies (500 points au plus), tourelles (portées sur la grande carte),
// tyroliennes et boutiques (mode fuite), leurre, joueur (flèche) ; `full` : la grande carte
function drawMap(g, partie, taille, rayon, full) {
  g.setTransform(taille / 208, 0, 0, taille / 208, 0, 0);
  g.clearRect(0, 0, 208, 208);
  const echelle = 104 / rayon,
    X = x => 104 + x * echelle,
    Y = z => 104 + z * echelle;
  g.save();
  g.beginPath();
  g.arc(104, 104, 103, 0, 7);
  g.clip();
  g.fillStyle = 'rgba(40,42,46,.9)';
  g.fillRect(0, 0, 208, 208);
  g.fillStyle = '#55524c';
  g.fillRect(X(-PLAZA), Y(-PLAZA), PLAZA * 2 * echelle, PLAZA * 2 * echelle);
  for (let r = 0; r < ROADS.length; r++) {
    const route = ROADS[r],
      ouverte = roadOpen(r, partie ? partie.day : 1);
    g.strokeStyle = ouverte ? '#8a857a' : '#3a3c40';
    g.lineWidth = route.w * echelle;
    g.beginPath();
    g.moveTo(X(route.a[0]), Y(route.a[1]));
    g.lineTo(X(route.b[0]), Y(route.b[1]));
    g.stroke();
    if (!ouverte) {
      g.strokeStyle = '#c0392b';
      g.lineWidth = 2;
      const cx = X(route.b[0] - route.dx * 3),
        cy = Y(route.b[1] - route.dz * 3);
      g.beginPath();
      g.moveTo(cx - 4, cy - 4);
      g.lineTo(cx + 4, cy + 4);
      g.moveTo(cx + 4, cy - 4);
      g.lineTo(cx - 4, cy + 4);
      g.stroke();
    }
  }
  g.fillStyle = '#c9b48f';
  g.fillRect(X(-B), Y(-B), B * 2 * echelle, B * 2 * echelle);
  if (partie) {
    const Z = partie.z;
    g.fillStyle = '#ff4a3a';
    const pas = Math.max(1, Math.floor(partie.nAct / 500));
    for (let q = 0; q < partie.nAct; q += pas) {
      const i = partie.act[q];
      g.fillRect(X(Z.x[i]) - 1, Y(Z.z[i]) - 1, full ? 2.5 : 2, full ? 2.5 : 2);
    }
    if (full)
      for (const t of partie.tur) {
        const portee = turretReach(partie, SLOTS[t.slot], t.ty);
        if (!portee) continue;
        g.strokeStyle = TT[t.ty].c;
        g.fillStyle = TT[t.ty].c;
        g.globalAlpha = 0.07;
        g.beginPath();
        g.arc(X(t.x), Y(t.z), portee.r * echelle, 0, 7);
        g.fill();
        g.globalAlpha = 0.55;
        g.lineWidth = 0.8;
        g.beginPath();
        g.arc(X(t.x), Y(t.z), portee.r * echelle, 0, 7);
        g.stroke();
        // mortier : distance minimale en pointillés
        if (portee.rmin > 0) {
          g.setLineDash([2, 2]);
          g.beginPath();
          g.arc(X(t.x), Y(t.z), portee.rmin * echelle, 0, 7);
          g.stroke();
          g.setLineDash([]);
        }
        g.globalAlpha = 1;
      }
    for (const t of partie.tur) {
      g.fillStyle = TT[t.ty].c;
      g.beginPath();
      g.arc(X(t.x), Y(t.z), full ? 2.5 : 1.8, 0, 7);
      g.fill();
    }
    // tyroliennes : câble doré et passerelle
    if (partie.mode === 'out') {
      g.strokeStyle = 'rgba(255,207,90,.7)';
      g.lineWidth = 1;
      for (const tyro of ZIPS) {
        g.beginPath();
        g.moveTo(X(tyro.a[0]), Y(tyro.a[2]));
        g.lineTo(X(tyro.b[0]), Y(tyro.b[2]));
        g.stroke();
        const axeX = Math.abs(tyro.n[0]) > 0.5;
        g.fillStyle = '#d9b24a';
        g.fillRect(
          X(tyro.c[0] - (axeX ? 1.25 : PASSW)),
          Y(tyro.c[2] - (axeX ? PASSW : 1.25)),
          (axeX ? 2.5 : PASSW * 2) * echelle,
          (axeX ? PASSW * 2 : 2.5) * echelle
        );
      }
    }
    // boutiques : carré vert, plein sur l'étage du joueur
    if (partie.mode === 'out')
      for (const s of SHOPS) {
        const monEtage = Math.abs(partie.p.y - s.y) < 1.3;
        g.fillStyle = monEtage ? '#3dff8e' : 'rgba(61,255,142,.45)';
        g.fillRect(X(s.x) - (full ? 4 : 3), Y(s.z) - (full ? 4 : 3), full ? 8 : 6, full ? 8 : 6);
        if (full) {
          g.fillStyle = '#0f3a24';
          g.font = 'bold 8px sans-serif';
          g.textAlign = 'center';
          g.fillText('$', X(s.x), Y(s.z) + 3);
        }
      }
    // V4.2 : le Guide « Règles » (regles.js) : losange doré, comme dans L'Île des Cinq
    if (partie.mode === 'out') {
      const gx = X(GUIDEP.x),
        gy = Y(GUIDEP.z),
        t = full ? 5 : 4;
      g.fillStyle = '#ffcf5a';
      g.strokeStyle = '#10202a';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(gx, gy - t);
      g.lineTo(gx + t, gy);
      g.lineTo(gx, gy + t);
      g.lineTo(gx - t, gy);
      g.closePath();
      g.fill();
      g.stroke();
    }
    if (partie.decoy) {
      g.fillStyle = '#ffd23a';
      g.beginPath();
      g.arc(X(partie.decoy.x), Y(partie.decoy.z), 3, 0, 7);
      g.fill();
    }
    const p = partie.p;
    g.save();
    g.translate(X(p.x), Y(p.z));
    g.rotate(-p.yaw);
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(4, 4);
    g.lineTo(-4, 4);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,.75)';
  g.font = 'bold 11px sans-serif';
  g.textAlign = 'center';
  g.fillText('N', 104, 12);
  g.fillText('S', 104, 203);
  g.fillText('E', 200, 108);
  g.fillText('O', 8, 108);
  g.restore();
}
$('mini').addEventListener('click', e => {
  e.stopPropagation();
  if (!running) return;
  openMap();
});
// la grande carte : la partie est en pause tant qu'elle est ouverte (voir ov)
function openMap() {
  $('mapV').hidden = false;
  mapDraw();
}
// dessine la grande carte et refait la colonne des réglages (chaque réglage redessine tout)
function mapDraw() {
  drawMap($('mapC').getContext('2d'), S, 720, 100, true);
  const opts = $('mapOpt');
  const bouton = (texte, action, classe) => {
    const btn = document.createElement('button');
    btn.className = classe || 'ghost';
    btn.innerHTML = texte;
    btn.onclick = () => {
      action();
      SND.play('click');
      mapDraw();
    };
    opts.appendChild(btn);
  };
  opts.innerHTML = '<h2>Carte et réglages</h2>';
  bouton('Son : <b>' + (save.snd !== false ? 'oui' : 'non') + '</b>', () => {
    save.snd = save.snd === false;
    SND.set(save.snd);
    store();
  });
  bouton('Tir auto sur cible : <b>' + (save.auto ? 'oui' : 'non') + '</b>', () => {
    save.auto = !save.auto;
    store();
  });
  bouton(
    'Caméra : <b>' +
      ['lente', 'normale', 'rapide', 'très rapide'][
        [0.7, 1, 1.35, 1.7].indexOf(save.sens) >= 0 ? [0.7, 1, 1.35, 1.7].indexOf(save.sens) : 1
      ] +
      '</b>',
    () => {
      const vitesses = [0.7, 1, 1.35, 1.7];
      save.sens = vitesses[(vitesses.indexOf(save.sens) + 1) % vitesses.length];
      store();
    }
  );
  bouton(
    'Mode dev : <b>' + (save.dev ? 'oui' : 'non') + '</b>' + (save.dev ? ' <small>(outils : bouton DEV sous la mini-carte)</small>' : ''),
    () => {
      save.dev = !save.dev;
      store();
    }
  );
  // V4.2 : la fiche des règles du Guide (regles.js) ; « Retour » y ramène ici
  if (S && S.mode === 'out') bouton('Règles <small>(le Guide)</small>', () => rulesOpen('carte'));
  bouton('Abandonner la partie', () => {
    $('mapV').hidden = true;
    S.phase = 'dead';
    S.p.dead = true;
    S.abandon = true;
    showEnd(false);
  });
  bouton(
    'Reprendre',
    () => {
      $('mapV').hidden = true;
    },
    'solid'
  );
}
// toucher la carte la referme
$('mapC').addEventListener('click', () => {
  $('mapV').hidden = true;
});
