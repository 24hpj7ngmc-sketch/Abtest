// [lobby/guide.js] Le Guide du lobby : la visite pas à pas du village, ses sujets quand on lui reparle.
// ---- LE GUIDE : le personnage qui explique les vraies règles. Il attend près de la maison (là où l'on arrive), accueille le joueur à sa première venue et lui fait faire la visite du
// village : à chaque arrêt on fait le geste (ouvrir le hall, ramasser une récolte, améliorer…), et l'étape ne passe que lorsqu'il est fait. « Passer » arrête tout de suite. Ensuite il reste à sa
// place : on lui reparle (main, Action) et on choisit un sujet. Il n'arrête pas le joueur (on passe à travers), se pose toujours hors des bâtiments, et change de place en un clin d'œil d'étoile.
// save.guide : 1 = visite passée, 2 = visite finie (le cadeau est donné une seule fois, à la première visite finie). Le même personnage tient les « Règles » dans chaque mini-jeu (RULES, interface/guide.js).
const GUIDE = { g: null, lab: null, pil: null, x: 0, z: 0, ry: 0, tp: null, s: 1 };
let GD = null; // la visite en cours : { i : étape, L : la liste des étapes de cette visite, op : un panneau a été vu ouvert, tool : outil pris }
const gFree = (x, z) =>
    Math.hypot(x, z) < RI - 4 &&
    !LOBS.some(o => Math.hypot(x - o[0], z - o[1]) < o[2] + 0.9) &&
    !save.vil.some(B => Math.hypot(x - B.x, z - B.z) < rOf(B) + 0.9),
  // un point libre à d mètres de (x, z), d'abord dans la direction a, puis en tournant autour
  gSpot = (x, z, a, d) => {
    for (let k = 0; k < 16; k++) {
      const q = a + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.4,
        px = x + Math.sin(q) * d,
        pz = z + Math.cos(q) * d;
      if (gFree(px, pz)) return [px, pz];
    }
    return [x + Math.sin(a) * d, z + Math.cos(a) * d];
  },
  gB = k => save.vil.find(B => B.t === k),
  gDoor = (B, side) => gSpot(B.x, B.z, B.r + (side || 0.55), rOf(B) + 2.6);
function guideHome() {
  const H = gB('maison');
  return H ? gSpot(H.x, H.z, H.r + 0.42, rOf(H) + 5.4) : gSpot(0, -19, 2.6, 4);
}
function guideMake() {
  if (GUIDE.g || !MODELS['pnj.guide']) return;
  GUIDE.g = lput('pnj.guide', 0, 0, 0, 0, {}, 'guide');
  GUIDE.lab = lobLabel(2.5, 0.84);
  lobText(GUIDE.lab, 'LE GUIDE', 'parle-moi', '#ffcf5a');
  GUIDE.lab.position.y = 2.75;
  GUIDE.g.add(GUIDE.lab);
  // le repère de la visite : une colonne de lumière dorée au-dessus de l'endroit où aller
  GUIDE.pil = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 40, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd76a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
  );
  GUIDE.pil.visible = false;
  lob.add(GUIDE.pil);
  const p = guideHome();
  GUIDE.x = p[0];
  GUIDE.z = p[1];
}
// il disparaît et reparaît à côté de l'endroit suivant (un quart de seconde pour rétrécir, autant pour revenir)
function guideGo(p) {
  if (Math.hypot(p[0] - GUIDE.x, p[1] - GUIDE.z) < 1.5) return;
  GUIDE.tp = { t: 0, to: p };
}
// LES ÉTAPES DE LA VISITE. t : ce qu'il dit · at : où aller (colonne de lumière, anneau sur la carte) · in : au début de l'étape · ok : le geste est fait · btn : étape qu'on valide par un bouton
// has : l'étape n'existe que si le bâtiment est là (la Mine et la Taverne arrivent avec l'évolution de l'île). Un panneau « vu » = ouvert puis refermé (GD.op).
const gSeen = id => {
  if (!$(id).hidden) GD.op = id;
  return GD.op === id && $(id).hidden;
};
const GSTEPS = [
  {
    btn: "C'est parti",
    t: () =>
      'Bienvenue sur ton île ! Je suis le Guide. Je te fais faire le tour : à chaque arrêt, tu fais le geste toi-même. Suis la colonne de lumière dorée.'
  },
  {
    b: 'hall',
    t: () =>
      "Le Hall des héros, notre cathédrale : tes six héros y sont exposés, chacun sur son socle. Entre par la grande porte, approche-toi d'un héros et touche Action : son élément, sa voie, son arbre (payé avec les éclats qu'il gagne aux portails), et de quoi l'incarner. Regarde, puis referme.",
    ok: () => gSeen('hallV')
  },
  {
    b: 'armes',
    t: () =>
      "La Salle d'armes : six armes, les mêmes aux deux portails. Leurs arbres se paient en or céleste. Ouvre-la, regarde les onglets, puis referme.",
    ok: () => {
      if (!$('tree').hidden) GD.op = 'tree';
      return GD.op === 'tree' && $('tree').hidden;
    }
  },
  {
    b: 'marchand',
    t: () =>
      "Le Marchand : contre de l'or céleste, une bourse pour ta prochaine partie ou des éclats pour ton héros. Ouvre, puis referme.",
    ok: () => gSeen('shopV')
  },
  {
    b: 'verger',
    in: () => {
      save.hv.s.verger = Math.max(1, save.hv.s.verger || 0);
      delete save.prep.prov;
      hvSync();
    },
    t: () =>
      "Tes bâtiments travaillent pendant tes parties. Une étiquette dorée au-dessus = c'est prêt. Passe devant le Verger : tu ramasses tes provisions, des points de vie pour ta prochaine partie.",
    ok: () => !!save.prep.prov
  },
  {
    b: 'musee',
    t: () =>
      "Le Musée garde le butin de tes parties : couronnes, étoiles, reliques. Plus tu as d'artefacts, plus il rapporte d'or. Ouvre, puis referme.",
    ok: () => gSeen('lootV')
  },
  {
    b: 'mine',
    t: () =>
      "La Mine d'étoiles produit de l'or céleste à chaque partie finie. Passe devant quand son étiquette est dorée. Ouvre-la pour voir, puis referme.",
    ok: () => gSeen('upV')
  },
  {
    b: 'taverne',
    t: () =>
      "La Taverne propose trois défis à la fois, sur l'île ou sur le toit. Un défi réussi se réclame ici, contre de l'or céleste. Ouvre, puis referme.",
    ok: () => gSeen('tavV')
  },
  {
    b: 'maison',
    t: () =>
      "Améliorer : devant la Maison, deux appuis sur le petit bouton « Améliorer ». Chaque niveau de la Maison augmente l'or céleste gagné. Regarde le prix, puis referme.",
    ok: () => gSeen('upV')
  },
  {
    b: 'hall',
    side: -0.55,
    t: () =>
      "Un bâtiment ne dépasse jamais le Hall, et le Hall ne monte que si tout le village est à son niveau : c'est l'évolution de ton île, de 1 à 6. À chaque niveau la cathédrale s'embellit : vitraux, contreforts, tours, flèche, dorures. Maintenant prends le Marteau, dans la barre du bas.",
    ok: () => LB.tool === 'marteau'
  },
  {
    t: () =>
      'Le Marteau pose des décors et déplace tes bâtiments ; la Pelle, à côté, modèle le terrain, et l’outil Arme montre ton arme à la couleur de son élément. Reprends la Main pour continuer.',
    ok: () => LB.tool === 'main'
  },
  {
    at: () => {
      const G = LGAMES[0],
        H = LGAMES[1];
      return [(G.x + H.x) / 2, (G.z + H.z) / 2 + 7];
    },
    t: () =>
      "Au nord, les portails : c'est là que tout se gagne. L'Île des Cinq à gauche, Dernier Toit à droite. Va devant l'un des deux.",
    ok: () => LGAMES.some(G => Math.hypot(LB.x - G.x, LB.z - G.z) < 9.5)
  },
  {
    btn: 'Terminer',
    at: () => {
      const G = LGAMES[0],
        H = LGAMES[1];
      return [(G.x + H.x) / 2, (G.z + H.z) / 2 + 7];
    },
    t: () =>
      "Chaque partie rapporte de l'or céleste, pour le village et les armes, et des éclats, pour ton héros. Voici " +
      GUIDEG +
      ' or céleste pour commencer. Je reste près de ta maison : reviens me parler quand tu veux.'
  }
];
const GUIDEG = 100;
function guideStart() {
  if (VISIT.on) {
    toast('La visite guidée se fait sur ta propre île');
    return;
  }
  guideMake();
  GD = { i: 0, op: '', L: GSTEPS.filter(S => !S.b || gB(S.b)) };
  for (const id of LPAN.concat(['tree', 'mapV', 'guideV'])) $(id).hidden = true;
  guideStep();
  SND.play('pure');
}
function guideAt(S) {
  if (S.at) return S.at();
  if (!S.b) return null;
  const B = gB(S.b),
    u = B.t === 'hall' && vilV.get(B.id) && vilV.get(B.id).userData;
  // le Hall, une cathédrale : la colonne de lumière se pose devant sa grande porte
  return u && u.porte ? vilMonde(B, u.porte[0], u.porte[1] + 0.6) : gDoor(B, S.side);
}
function guideStep() {
  const S = GD.L[GD.i];
  GD.op = '';
  if (S.in) S.in();
  const p = guideAt(S);
  GD.p = p;
  if (p) guideGo(gSpot(p[0], p[1], Math.atan2(LB.x - p[0], LB.z - p[1]) + 1.1, 2.2));
  guideDraw();
}
function guideDraw() {
  const el = $('gBub');
  if (!GD) {
    el.hidden = true;
    return;
  }
  const S = GD.L[GD.i];
  $('gHead').textContent = 'LE GUIDE · ' + (GD.i + 1) + ' / ' + GD.L.length;
  $('gTxt').textContent = S.t();
  const n = $('gNext');
  n.hidden = !S.btn;
  if (S.btn) n.textContent = S.btn;
}
function guideNext() {
  if (!GD) return;
  if (GD.i >= GD.L.length - 1) {
    guideEnd(true);
    return;
  }
  GD.i++;
  SND.play('pure');
  guideStep();
}
// fin de la visite : finie (le cadeau, une seule fois) ou passée (pas de cadeau). Dans les deux cas elle ne se relance plus toute seule.
function guideEnd(done) {
  if (!GD) return;
  GD = null;
  const had = save.guide;
  if (done) {
    if (had !== 2) {
      save.gold += GUIDEG;
      toast("Le Guide t'offre " + GUIDEG + ' or céleste');
    }
    save.guide = 2;
  } else {
    if (!had) save.guide = 1;
    toast('Visite passée · le Guide reste près de ta maison');
  }
  persist();
  guideDraw();
  GUIDE.pil.visible = false;
  guideGo(guideHome());
  lobSync();
}
$('gSkip').onclick = () => guideEnd(false);
$('gNext').onclick = guideNext;
// lui parler : pendant la visite il répète l'étape ; sinon il ouvre ses sujets
function guideTalk() {
  if (GD) {
    guideDraw();
    toast('Suis la colonne de lumière dorée');
    return;
  }
  SND.play('tick');
  guideShow('Le Guide', guideTopics(), 0, [
    'Refaire la visite',
    () => {
      $('guideV').hidden = true;
      guideStart();
    }
  ]);
}
// ses sujets : les vraies règles du lobby, écrites à partir des chiffres du jeu (elles suivent donc les réglages)
function guideTopics() {
  const up = k => UPD[k][0].toLowerCase() + ' : ' + UPD[k][1](2) + ' par niveau',
    B = (k, d) => [
      CAT[k].n + (gB(k) ? ' · niveau ' + lvOf(gB(k)) : CAT[k].lv ? " · à l'évolution " + CAT[k].lv : ''),
      d
    ];
  return [
    [
      "L'île",
      [
        [
          "À quoi sert l'île",
          "C'est chez toi. Tu joues aux portails pour la faire grandir, elle et tes héros : tout ce que tu gagnes là-bas revient ici."
        ],
        [
          'Deux monnaies',
          "L'or céleste paie le village et les armes. Les éclats paient l'arbre d'un héros : chaque héros a les siens, gagnés en jouant avec lui."
        ],
        [
          'Ramasser',
          "Tes bâtiments se remplissent à chaque partie finie, et un peu avec le temps. Étiquette dorée au-dessus, cercle doré sur la carte : passe devant, c'est ramassé."
        ],
        [
          'Améliorer',
          'Main en main, devant un bâtiment : deux appuis sur « Améliorer ». Prix : ' +
            UPC.slice(2).join(', ') +
            ' or céleste du niveau 2 au niveau 6.'
        ],
        [
          "L'évolution",
          "Un bâtiment ne dépasse jamais le Hall, et le Hall ne monte que si tout le village est à son niveau. Le niveau du Hall est l'évolution de l'île (1 à 6) : elle agrandit l'île et ouvre de nouveaux bâtiments."
        ],
        [
          'Bâtir',
          'Le Marteau pose des décors et déplace tes bâtiments (le bouton libre range ou tourne). La Pelle monte, creuse et aplanit le terrain. L’outil Arme sort ton arme, à la couleur de son élément : Action la montre, et les autres joueurs la voient dans la main de ton avatar.'
        ]
      ]
    ],
    [
      'Bâtiments',
      [
        B(
          'hall',
          "La cathédrale de tes six héros : entre, approche-toi d'un héros exposé et touche Action pour choisir son élément, sa voie, ouvrir son arbre ou l'incarner (la porte ouvre le panneau du héros incarné). Produit des éclats pour le héros incarné. " +
            up('hall') +
            '.'
        ),
        B('maison', 'Là où tu te réveilles ; réglages. ' + up('maison') + '.'),
        B(
          'armes',
          'Les arbres de tes six armes. Prépare un affûtage (dégâts en plus à la prochaine partie). ' +
            up('armes') +
            '.'
        ),
        B('marchand', "Bourse de départ et éclats, contre de l'or céleste. " + up('marchand') + '.'),
        B(
          'verger',
          'Prépare des provisions : des points de vie en plus à la prochaine partie, ' +
            UPD.verger[1](1).replace('+', '') +
            ' au niveau 1.'
        ),
        B('musee', "Ton butin. Produit de l'or selon tes artefacts. " + up('musee') + '.'),
        B(
          'mine',
          "Produit de l'or céleste à chaque partie finie : " + MINEG[1] + ' au niveau 1, ' + MINEG[6] + ' au niveau 6.'
        ),
        B('taverne', "Trois défis à la fois, sur l'île ou sur le toit. " + up('taverne') + '.')
      ]
    ],
    [
      'Héros',
      [
        [
          'Six héros, six rôles',
          HEROS.map(e => EL[e].hero + ' (' + ROLE[e] + ')').join(', ') +
            ". Le rôle, c'est qui tu es : le kit d'un héros est le même dans tous les jeux. L'élément, c'est comment tu frappes : chaque héros a le sien, que tu choisis au Hall (Braise est mage, mais pas forcément de feu), et chaque arme garde aussi le sien. Quand les deux sont pareils, l'arme frappe 10 % plus fort. Tu changes de héros au Hall ou au portail."
        ],
        [
          'Son arbre',
          'Compétence, ultime, passif et corps (vitesse, saut, points de vie). Il se paie avec les éclats de ce héros.'
        ],
        [
          'Gagner des éclats',
          "En jouant ce héros aux portails ; le Hall en produit pour celui que tu incarnes ; le Marchand en vend 100 contre de l'or céleste."
        ],
        [
          'Aux deux portails',
          "Son arbre compte sur l'île comme sur le toit : vie, vitesse, compétence, ultime, passif."
        ]
      ]
    ],
    [
      'Armes',
      [
        [
          'Six armes',
          "Pistolet, fusil d'assaut, fusil de sniper, fusil, fusil à pompe, lance-flammes. Toutes disponibles, aux deux portails."
        ],
        [
          'Quatre arbres chacune',
          "Général (partout), L'Île des Cinq, Dernier Toit, et Élément : tes balles prennent l'élément de ton arme (par défaut, celui de ton héros). Tout se paie en or céleste."
        ],
        ["Changer d'arme", "À la salle d'armes, au panneau d'un portail, ou en partie dans la barre d'outils."],
        [
          'Préparatifs',
          "Un seul d'avance chacun : affûtage (salle d'armes), provisions (verger), bourse (marchand). Ils partent avec toi à la prochaine partie."
        ]
      ]
    ],
    [
      'Portails',
      [
        [
          "L'Île des Cinq",
          "Défends le cœur de l'île, vague après vague. Partie libre (Normal, Difficile) ou campagne : cinq types, quatre niveaux chacun."
        ],
        [
          'Dernier Toit',
          "Tiens dix jours sur ton immeuble sans laisser les zombies s'échapper. Si tu tombes, tu te relèves : seule la ville peut tomber. Quatre rangs : être secouru ouvre le suivant."
        ],
        [
          'À plusieurs',
          (net.ext
            ? 'Touche la mini-carte, puis « Multi » : tapez tous le même mot de salon.'
            : 'Touche la mini-carte, puis « Multi ».') +
            " Le premier arrivé accueille les autres sur son île. On s'y promène ensemble, et quand l'un passe un portail (L'Île des Cinq ou Dernier Toit), les autres le rejoignent d'un bouton. On ne bâtit que chez soi."
        ],
        [
          'Ce que ça rapporte',
          GAINS.or +
            ' or céleste et ' +
            GAINS.ecl +
            ' éclats par tranche de 45 secondes de jeu environ, +' +
            GAINS.orBoss +
            ' et +' +
            GAINS.eclBoss +
            ' par boss, +' +
            GAINS.orWin +
            ' et +' +
            GAINS.eclWin +
            " par victoire. La maison augmente l'or, le hall les éclats."
        ],
        [
          'Plus dur, mieux payé',
          'Niveaux de campagne et rangs : ' +
            PAYK.map(k => '×' + payT(k)).join(', ') +
            ". Difficile : ×1,5. La première fois qu'un niveau ou un rang est fini : une prime."
        ],
        [
          'Les règles en partie',
          "Je suis aussi dans chaque jeu, sous le même chapeau et l'étiquette « RÈGLES » : près du cœur sur L'Île des Cinq, près de ton point de départ sur le toit."
        ]
      ]
    ]
  ];
}
// à chaque image du lobby : le Guide regarde le joueur, la visite avance quand le geste est fait
function guideTick(dt, t) {
  if (!GUIDE.g) {
    if (window.__noguide && !window.__guide) return;
    guideMake();
    if (!GUIDE.g) return;
  }
  const G = GUIDE;
  if (G.tp) {
    G.tp.t += dt;
    if (G.tp.to && G.tp.t >= 0.25) {
      G.x = G.tp.to[0];
      G.z = G.tp.to[1];
      G.tp.to = null;
    }
    if (G.tp.t >= 0.5) G.tp = null;
  }
  G.s = G.tp ? Math.abs(1 - G.tp.t / 0.25) : 1;
  const dx = LB.x - G.x,
    dz = LB.z - G.z,
    d = Math.hypot(dx, dz);
  if (d < 40) G.ry = Math.atan2(-dx, -dz);
  G.g.position.set(G.x, hAt(G.x, G.z), G.z);
  G.g.rotation.y = G.ry;
  G.g.scale.setScalar(Math.max(0.01, G.s));
  G.g.visible = d < 90;
  if (G.g.visible) K.pose(G.g, t, 0, 0);
  if (GD) {
    const S = GD.L[GD.i],
      p = GD.p,
      ov = lobOv();
    $('gBub').hidden = ov;
    G.pil.visible = !!p;
    if (p) {
      G.pil.position.set(p[0], hAt(p[0], p[1]) + 20, p[1]);
      G.pil.material.opacity = 0.42 + 0.14 * Math.sin(t * 3);
    }
    if (!S.btn && S.ok && S.ok()) guideNext();
  } else {
    if (!$('gBub').hidden) $('gBub').hidden = true;
    // première venue sur l'île (village installé, pas de panneau ouvert) : il prend la parole tout seul
    if (!save.guide && !window.__noguide && !VISIT.on && save.vil.length && !lobOv() && LB.on) guideStart();
  }
}
