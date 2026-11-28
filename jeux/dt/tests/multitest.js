// V4.3 : le multi sur le toit (MULTI.md, chantier 2 : le tuyau et les rôles). Une page hôte avec DEUX « lobbies » (deux cadres, chacun
// avec dt-pour-lobby.js et son jeu dans un cadre) et un facteur : dix fois par seconde, chaque lobby reçoit l'état publié par l'autre
// dans sa liste (DernierToit.pairs), comme le ferait le réseau du vrai lobby.
// Vérifie : sans multi, aucun état publié ; les rôles (hôte = plus petit depuis) ; la publication (10 fois par seconde au plus, taille
// au plus max) ; joueursDistants ; seul l'hôte lance le jour, chez les deux ; l'invité voit les zombies de l'hôte ; un coup de l'invité
// tue chez l'hôte ; la ville est la même ; un faux joueur aux données hostiles (nom nettoyé, rien dans la page) ; l'hôte part →
// l'invité reprend ; un joueur qui arrive devient invité de la partie en cours ; la fin chez les deux (chacun son « fin »).
// Les vérifications sur les zombies ne dépendent pas de la forme exacte de l'instantané.
//   node tests/multitest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const url = f => JSON.stringify('file://' + path.resolve(f));
  // un lobby : le pont, et ce qu'il reçoit (pret, fin, retour, etat) ; il demande sa liste au facteur (page du dessus) toutes les 100 ms
  const lobby =
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#123">' +
    '<script src=' +
    url('dt-pour-lobby.js') +
    '></script><script>DernierToit.troisJs = ' +
    url('gfx/three-lite.js') +
    ';\nwindow.recu = []; window.etat = null; window.nEtat = 0; window.tMax = 0; window.ouvert = () => DernierToit.ouvert;\n' +
    'function lance(o){ etat = null; DernierToit.ouvrir(o, { pret: m => recu.push(m), fin: m => recu.push(m),' +
    ' retour: () => recu.push({ dt: "retour-lobby" }), etat: d => { etat = d; nEtat++; tMax = Math.max(tMax, JSON.stringify(d).length); } }); }\n' +
    'setInterval(() => { if (!DernierToit.ouvert) return; const r = parent.facteur(frameElement.id); if (r) DernierToit.pairs(r.liste, r.moi); }, 100);\n' +
    '</script></body></html>';
  const hote = path.resolve('shots/hote-multi.html');
  fs.mkdirSync(path.dirname(hote), { recursive: true });
  fs.writeFileSync(
    hote,
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">' +
      '<iframe id="A" style="position:absolute;left:0;top:0;width:966px;height:366px;border:0"></iframe>' +
      '<iframe id="B" style="position:absolute;left:0;top:370px;width:966px;height:366px;border:0"></iframe><script>\n' +
      'const LOB = ' +
      JSON.stringify(lobby).replace(/</g, '\\u003c') +
      ';\nA.srcdoc = LOB; B.srcdoc = LOB;\n' +
      // les joueurs (id, nom, héros, rang, depuis) ; coupe[id] : il est parti ; faux : un faux joueur ajouté aux listes ; marche : le facteur tourne
      "window.joueurs = { A: { id: 'a', nom: 'Alice', heros: 'feu', rang: 1, depuis: 1000 }, B: { id: 'b', nom: 'Bob', heros: 'eau', rang: 2, depuis: 2000 } };\n" +
      'window.coupe = {}; window.faux = null; window.marche = false;\n' +
      'window.facteur = moi => {\n' +
      '  if (!marche || coupe[moi]) return null;\n' +
      '  const liste = [];\n' +
      '  for (const k in joueurs) { if (k === moi || coupe[k]) continue; const w = document.getElementById(k).contentWindow;\n' +
      '    if (!w.ouvert || !w.ouvert()) continue;\n' +
      '    const j = joueurs[k]; liste.push({ id: j.id, nom: j.nom, heros: j.heros, rang: j.rang, depuis: j.depuis, etat: w.etat }); }\n' +
      '  if (faux) liste.push(faux);\n' +
      '  const j = joueurs[moi];\n' +
      '  return { liste, moi: { id: j.id, nom: j.nom, depuis: j.depuis } };\n' +
      '};\n' +
      '</script></body></html>'
  );
  const b = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--allow-file-access-from-files'
    ]
  });
  let ok = 0,
    ko = 0;
  const T = (n, c, x) => {
    c ? ok++ : ko++;
    console.log((c ? 'OK  ' : 'RATÉ') + ' ' + n + (x !== undefined ? ' — ' + x : ''));
  };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 966, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text());
  });
  await p.goto('file://' + hote);
  const lob = {};
  for (const k of ['A', 'B']) lob[k] = await (await p.$('#' + k)).contentFrame();
  const attend = async (fn, ms) => {
    const t0 = Date.now();
    for (;;) {
      if (await fn()) return true;
      if (Date.now() - t0 > ms) return false;
      await p.waitForTimeout(100);
    }
  };
  T(
    'les deux lobbies chargent le pont (accepte multi)',
    await attend(
      async () =>
        (await lob.A.evaluate(() => typeof DernierToit === 'object' && DernierToit.accepte.includes('multi'))) &&
        (await lob.B.evaluate(() => typeof DernierToit === 'object' && typeof DernierToit.pairs === 'function')),
      8000
    )
  );
  // le jeu d'un lobby (le cadre dans le cadre), une fois chargé
  const jeu = async k => {
    let f = null;
    await attend(async () => {
      f = lob[k].childFrames()[0];
      return !!f && (await f.evaluate(() => typeof window.__dt === 'object' && !!S).catch(() => false));
    }, 15000);
    // les messages (toast) sont notés : un message peut en remplacer un autre avant qu'on le lise ;
    // la 3D n'est dessinée qu'à la demande (__rendu) : deux cadres 3D en logiciel (swiftshader) tournent à 2 ou 3 images par seconde,
    // sans elle à ~50 (ce test vérifie le tuyau, pas l'image : l'affichage des autres joueurs a son propre test)
    await f.evaluate(() => {
      window.__toasts = [];
      const vrai = toast;
      toast = (t, ms) => {
        __toasts.push(t);
        vrai(t, ms);
      };
      const dessine = gfxFrame;
      let args = null;
      gfxFrame = (...a) => {
        args = a;
      };
      window.__rendu = () => {
        if (args) dessine(...args);
        return !!args;
      };
    });
    return f;
  };

  // ---- sans multi : rien ne change (aucun état publié, pas de compteur)
  await lob.A.evaluate(() => lance({ heros: 'feu', arme: 'fusil' }));
  const seul = await jeu('A');
  await p.evaluate(() => (marche = true));
  await p.waitForTimeout(800);
  const s0 = await seul.evaluate(() => ({
    actif: MULTI.actif,
    nb: !!document.getElementById('mNb'),
    go: document.getElementById('go').textContent
  }));
  T(
    'sans multi : MULTI inactif, aucun état publié, pas de compteur',
    !s0.actif && !s0.nb && s0.go === 'Lancer le jour' && (await lob.A.evaluate(() => nEtat)) === 0,
    JSON.stringify(s0)
  );
  T('sans multi : joueursDistants() = []', await seul.evaluate(() => Array.isArray(joueursDistants()) && joueursDistants().length === 0));
  await lob.A.evaluate(() => DernierToit.fermer());
  await p.evaluate(() => (marche = false));

  // ---- deux joueurs : Alice (depuis 1000) et Bob (depuis 2000, max 2500)
  await lob.A.evaluate(() => lance({ heros: 'feu', arme: 'fusil', multi: { nom: 'Alice', depuis: 1000 } }));
  await lob.B.evaluate(() => lance({ heros: 'eau', arme: 'assaut', rang: 2, multi: { nom: 'Bob', depuis: 2000, max: 2500 } }));
  const fa = await jeu('A'),
    fb = await jeu('B');
  await p.evaluate(() => (marche = true));
  await p.waitForTimeout(1200);
  const role = f =>
    f.evaluate(() => ({
      hote: MULTI.hote,
      hoteId: MULTI.hoteId,
      moi: MULTI.moi.id,
      invite: !!S.invite,
      nb: document.getElementById('mNb') && document.getElementById('mNb').textContent,
      go: document.getElementById('go').textContent,
      attente: document.getElementById('go').classList.contains('attente'),
      toasts: __toasts.join(' | '),
      nJ: S.nJoueurs
    }));
  let ra = await role(fa),
    rb = await role(fb);
  T("rôles : Alice (plus petit depuis) est l'hôte", ra.hote && !ra.invite && ra.hoteId === 'a' && ra.moi === 'a', JSON.stringify(ra));
  T('rôles : Bob est invité (S.invite)', !rb.hote && rb.invite && rb.hoteId === 'a' && rb.moi === 'b', JSON.stringify(rb));
  T('compteur « 2 sur le toit » chez les deux', ra.nb === '2 sur le toit' && rb.nb === '2 sur le toit', ra.nb + ' / ' + rb.nb);
  T(
    "chez l'invité : « L'hôte lance le jour »",
    rb.go === "L'hôte lance le jour" && rb.attente && ra.go === 'Lancer le jour' && !ra.attente
  );
  T("message d'arrivée chez l'invité", /Tu rejoins la partie de Alice/.test(rb.toasts), rb.toasts);
  T("S.nJoueurs = 2 chez l'hôte", ra.nJ === 2, ra.nJ);

  // ---- V4.6 : chacun ses tourelles (avant, seules celles de l'hôte existaient : l'invité voyait ses emplacements vides)
  {
    const pris = await fa.evaluate(() => {
      S.day = 2; // le jour 1 est sans tourelle
      S.mTurSig = null;
      return Object.keys(save.layout).map(Number);
    });
    const choix = await fb.evaluate(
      pris =>
        SLOTS.filter(s => s.k === 'toit' && !pris.includes(s.id))
          .slice(0, 3)
          .map(s => s.id),
      pris
    );
    await fb.evaluate(c => {
      save.layout = { [c[0]]: 'mo', [c[1]]: 'la', [c[2]]: 'mg' };
      save.lv.mo_unl = 1;
      save.lv.la_unl = 1;
      save.lv.t_slot = 1; // 3 tourelles (2 de base + 1)
    }, choix);
    await p.waitForTimeout(1500);
    const tA = await fa.evaluate(() => S.tur.filter(t => t.own === 'b').map(t => t.slot + t.ty));
    const tB = await fb.evaluate(c => {
      __rendu();
      return { tur: S.tur.filter(t => c.includes(t.slot)).map(t => t.slot + t.ty), modeles: c.filter(k => G.tur[k]).length };
    }, choix);
    const attendu = [choix[0] + 'mo', choix[1] + 'la', choix[2] + 'mg'].sort().join(' ');
    T("V4.6 : l'hôte pose et fait tirer les tourelles de l'invité (à son nom)", tA.sort().join(' ') === attendu, tA.join(' '));
    T(
      "V4.6 : l'invité voit ses tourelles (instantané, modèles 3D)",
      tB.tur.sort().join(' ') === attendu && tB.modeles === 3,
      JSON.stringify(tB)
    );
    await fa.evaluate(() => {
      S.day = 1;
      S.mTurSig = null;
    });
    await p.waitForTimeout(400);
  }

  // ---- la publication : au plus 10 fois par seconde, jamais plus longue que max ; l'instantané chez l'hôte seulement
  const n0 = { A: await lob.A.evaluate(() => nEtat), B: await lob.B.evaluate(() => nEtat) },
    i0 = await fa.evaluate(() => window.__frames);
  await p.waitForTimeout(2000);
  const ips = ((await fa.evaluate(() => window.__frames)) - i0) / 2;
  const pub = {
    A: await lob.A.evaluate(() => ({ n: nEtat, tMax, g: etat && typeof etat.g, p: etat && etat.p, v: etat && etat.v })),
    B: await lob.B.evaluate(() => ({ n: nEtat, tMax, g: etat && typeof etat.g, p: etat && etat.p }))
  };
  const debit = { A: (pub.A.n - n0.A) / 2, B: (pub.B.n - n0.B) / 2 };
  // (une publication au plus par image : sur une machine lente, moins de 10 par seconde)
  const bas = Math.min(7, ips * 0.5);
  T(
    'publication : 10 fois par seconde au plus (et au moins ' + bas.toFixed(1) + ' à ' + ips.toFixed(0) + ' images/s)',
    debit.A >= bas && debit.A <= 10.5 && debit.B >= bas && debit.B <= 10.5,
    JSON.stringify(debit)
  );
  T(
    'taille : au plus 3000 (hôte), 2500 (invité, max)',
    pub.A.tMax > 0 && pub.A.tMax <= 3000 && pub.B.tMax > 0 && pub.B.tMax <= 2500,
    pub.A.tMax + ' / ' + pub.B.tMax
  );
  T(
    "l'instantané g chez l'hôte, pas chez l'invité",
    pub.A.g === 'string' && pub.B.g === 'undefined' && pub.A.v === 1,
    pub.A.g + ' / ' + pub.B.g
  );
  const P = pub.B.p || {};
  T(
    "l'état du joueur : nom, héros, arme, place, vie, actions",
    P.n === 'Bob' &&
      P.h === 'eau' &&
      P.w === 'assaut' &&
      [P.x, P.y, P.z, P.a, P.b].every(Number.isFinite) &&
      P.hp === 100 &&
      Array.isArray(P.A),
    JSON.stringify(P)
  );

  // ---- joueursDistants chez l'hôte : Bob, à sa place (lissée)
  const jd = await fa.evaluate(() => joueursDistants());
  const pb = await fb.evaluate(() => ({ x: S.p.x, y: S.p.y, z: S.p.z }));
  const bob = jd.find(j => j.id === 'b') || {};
  T(
    'joueursDistants : Bob, ses champs',
    jd.length === 1 &&
      JSON.stringify(Object.keys(bob)) ===
        JSON.stringify(['id', 'nom', 'heros', 'arme', 'el', 'elHeros', 'x', 'y', 'z', 'yaw', 'pitch', 'tire', 'aTerre']) &&
      bob.nom === 'Bob' &&
      bob.heros === 'eau' &&
      bob.arme === 'assaut' &&
      bob.tire === false &&
      bob.aTerre === false,
    JSON.stringify(bob)
  );
  T('joueursDistants : à sa place', Math.hypot(bob.x - pb.x, bob.y - pb.y, bob.z - pb.z) < 0.5, JSON.stringify(pb));
  T(
    'une image 3D dessinée chez les deux, avec un autre joueur',
    (await fa.evaluate(() => __rendu())) && (await fb.evaluate(() => __rendu()))
  );
  // il fait 2 m de côté : la place affichée glisse (ni tout de suite, ni jamais)
  await fb.evaluate(() => (S.p.x += 2));
  await p.waitForTimeout(150);
  const g1 = await fa.evaluate(() => joueursDistants()[0].x);
  await p.waitForTimeout(1200);
  const g2 = await fa.evaluate(() => joueursDistants()[0].x),
    pb2 = await fb.evaluate(() => S.p.x);
  T(
    'joueursDistants : la place glisse vers la nouvelle',
    g1 < pb2 - 0.05 && Math.abs(g2 - pb2) < 0.2,
    g1.toFixed(2) + ' → ' + g2.toFixed(2) + ' / ' + pb2.toFixed(2)
  );

  // ---- le jour : l'invité ne peut pas le lancer ; l'hôte le lance, chez les deux
  const tap = f =>
    f.evaluate(() => document.getElementById('go').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })));
  await tap(fb);
  await p.waitForTimeout(500);
  T(
    "l'invité touche « Lancer le jour » : rien ne part",
    (await fa.evaluate(() => S.phase)) === 'prep' && (await fb.evaluate(() => S.phase)) === 'prep'
  );
  await tap(fa);
  const jour = await attend(async () => (await fb.evaluate(() => S.phase)) === 'day', 2500);
  T("l'hôte lance le jour : chez les deux", jour && (await fa.evaluate(() => S.phase)) === 'day', await fb.evaluate(() => S.phase));

  // ---- les zombies de l'hôte chez l'invité
  await fa.evaluate(() => devSpawn(25));
  await attend(async () => (await fb.evaluate(() => S.nAct)) >= 15, 2500);
  // les zombies d'un cadre : case → place (et cible, si l'invité glisse vers elle) ; fant : dessiné seulement
  const zombies = f =>
    f.evaluate(() => {
      const Z = S.z,
        r = {};
      for (let i = 0; i < Z.st.length; i++) {
        const fant = !!(Z.fant && Z.fant[i]);
        if (Z.st[i] !== 0 || fant) r[i] = { x: Z.x[i], z: Z.z[i], tx: Z.tx[i], tz: Z.tz[i], fant, hp: Z.hp[i] };
      }
      return r;
    });
  const za = await zombies(fa),
    zb = await zombies(fb);
  let pareils = 0;
  for (const i in zb)
    if (za[i] && Math.min(Math.hypot(za[i].x - zb[i].x, za[i].z - zb[i].z), Math.hypot(za[i].x - zb[i].tx, za[i].z - zb[i].tz)) < 4)
      pareils++;
  T(
    "l'invité voit les zombies de l'hôte",
    Object.keys(za).length >= 20 && Object.keys(zb).length >= 15 && pareils >= 10,
    'hôte ' + Object.keys(za).length + ', invité ' + Object.keys(zb).length + ', mêmes places ' + pareils
  );

  T("une image 3D chez l'invité, avec les zombies de l'hôte", await fb.evaluate(() => __rendu()));
  // capture de l'invité (pour la regarder) : shots/multi-invite.png
  try {
    await fb.evaluate(() => {
      const h = __dt.S.p;
      h.yaw = Math.atan2(-(S.z.x[S.act[0]] - h.x), -(S.z.z[S.act[0]] - h.z)) || 0;
      __rendu();
    });
    const el = await fb.frameElement();
    await el.screenshot({ path: 'shots/multi-invite.png' });
  } catch (_) {}

  // ---- un coup de l'invité tue chez l'hôte (hurtZ chez l'invité → action → appliqueActions chez l'hôte)
  const cible = Object.keys(zb).find(i => za[i] && !zb[i].fant && zb[i].hp > 0);
  // l'hôte compte le tué pour la partie (S.kills) ; c'est l'invité qui compte le sien (runKills) et son argent, pas l'hôte
  const k0 = { A: await fa.evaluate(() => S.kills), Ar: await fa.evaluate(() => S.runKills), B: await fb.evaluate(() => S.runKills) };
  const coup = await fb.evaluate(i => ({ r: hurtZ(S, +i, 1e7, 'p'), A: (S.mActions || []).length }), cible);
  const tue = await attend(async () => (await fa.evaluate(() => S.kills)) > k0.A, 2500);
  T(
    "un coup de l'invité tue chez l'hôte",
    cible !== undefined &&
      coup.A > 0 &&
      tue &&
      (await fb.evaluate(() => S.runKills)) === k0.B + 1 &&
      (await fa.evaluate(() => S.runKills)) === k0.Ar,
    'case ' + cible + ' · ' + JSON.stringify(coup)
  );

  // ---- V4.4 : ce que l'hôte doit à l'invité (tués de ses compétences, ultimes, frappes) arrive chez lui
  {
    const idB = await fb.evaluate(() => MULTI.moi.id),
      kB = await fb.evaluate(() => S.runKills),
      cB = await fb.evaluate(() => save.cash);
    await fa.evaluate(id => {
      S.mCredits = S.mCredits || {};
      S.mCredits[String(id)] = { k: 3, c: 50 };
    }, idB);
    const recu = await attend(async () => (await fb.evaluate(() => S.runKills)) >= kB + 3, 2500);
    const apres = { k: await fb.evaluate(() => S.runKills), c: await fb.evaluate(() => save.cash) };
    T("les tués de l'invité faits chez l'hôte lui reviennent", recu && apres.k === kB + 3 && apres.c === cB + 50, JSON.stringify(apres));
  }

  // ---- la ville : la même chez les deux
  await fa.evaluate(() => (S.city -= 12.5));
  await attend(async () => Math.abs((await fa.evaluate(() => S.city)) - (await fb.evaluate(() => S.city))) <= 1, 2500);
  const villes = [await fa.evaluate(() => S.city), await fb.evaluate(() => S.city)],
    jours = [await fa.evaluate(() => S.day), await fb.evaluate(() => S.day)];
  T('la ville et le jour sont les mêmes', Math.abs(villes[0] - villes[1]) <= 1 && jours[0] === jours[1], JSON.stringify({ villes, jours }));

  // ---- l'hôte ouvre l'arbre (partie en pause chez lui seul) : la partie des autres avance quand même
  const tA0 = await fa.evaluate(() => {
    openTree('run');
    return S.t;
  });
  const avance = await attend(async () => (await fa.evaluate(() => S.t)) > tA0 + 0.3, 2500);
  T("l'hôte dans l'arbre : sa partie avance quand même", avance && (await fa.evaluate(() => !running && ov())));
  await fa.evaluate(() => document.getElementById('tClose').click());
  T("l'hôte sort de l'arbre", await attend(() => fa.evaluate(() => running && !ov()), 1500));

  // ---- un faux joueur aux données hostiles : nom nettoyé, rien d'injecté, aucune erreur, puis il part
  await p.evaluate(() => {
    faux = {
      id: 'c',
      nom: '<img src=x onerror=alert(1)>Zorglub le très long nom',
      heros: 'xx',
      rang: 'a',
      depuis: { a: 1 },
      etat: {
        v: 1,
        p: { n: '<b>', x: 'NaN', y: 1e99, z: 3, a: null, w: '<script>', A: [['h', 1e9, 5, 0, 1e9], 'junk', [1, 2, { o: 1 }]] },
        g: 7
      }
    };
  });
  await attend(async () => (await fa.evaluate(() => document.getElementById('mNb').textContent)) === '3 sur le toit', 2500);
  const fx = await fa.evaluate(() => ({
    jd: joueursDistants(),
    nb: document.getElementById('mNb').textContent,
    img: !!document.querySelector('img[src="x"]'),
    toast: __toasts.join(' | '),
    hote: MULTI.hote
  }));
  const c = fx.jd.find(j => j.id === 'c') || {};
  T(
    'faux joueur : compté, nom nettoyé (12 caractères), place bornée',
    fx.nb === '3 sur le toit' &&
      /^[\p{L}\p{N} -]{1,12}$/u.test(c.nom) &&
      c.nom === 'img srcx one' &&
      c.heros === '' &&
      c.arme === 'fusil' &&
      c.x === 0 &&
      c.y <= 200 &&
      fx.hote,
    JSON.stringify(c)
  );
  T("faux joueur : rien d'injecté dans la page, message d'arrivée", !fx.img && /img srcx one arrive sur le toit/.test(fx.toast), fx.toast);
  await p.evaluate(() => (faux = null));
  await attend(async () => (await fa.evaluate(() => document.getElementById('mNb').textContent)) === '2 sur le toit', 2500);
  const fx2 = await fa.evaluate(() => ({ nb: document.getElementById('mNb').textContent, toast: __toasts.join(' | ') }));
  T(
    'faux joueur parti : « 2 sur le toit », message de départ',
    fx2.nb === '2 sur le toit' && /img srcx one est parti/.test(fx2.toast),
    JSON.stringify(fx2)
  );

  // ---- l'hôte part : Bob reprend la partie
  const tB0 = await fb.evaluate(() => S.t);
  await p.evaluate(() => (coupe.A = true));
  await lob.A.evaluate(() => DernierToit.fermer());
  let vuMsg = '';
  await attend(async () => {
    vuMsg = await fb.evaluate(() => __toasts.join(' | '));
    return /Alice est parti · tu deviens l'hôte/.test(vuMsg);
  }, 2500);
  await p.waitForTimeout(1200);
  rb = await role(fb);
  const sb = await fb.evaluate(() => ({ t: S.t, phase: S.phase, n: S.nAct, toSpawn: S.toSpawn }));
  T(
    "l'hôte part : Bob devient l'hôte",
    rb.hote && !rb.invite && rb.hoteId === 'b' && /Alice est parti · tu deviens l'hôte/.test(vuMsg),
    JSON.stringify(rb)
  );
  T(
    'la partie continue chez Bob (step)',
    sb.phase === 'day' && sb.t > tB0 + 0.5 && rb.nb === '1 sur le toit' && rb.go === 'Lancer le jour',
    JSON.stringify(sb)
  );

  // ---- Alice revient (depuis 3000) : invitée de la partie de Bob, déjà en cours
  await p.evaluate(() => {
    joueurs.A.depuis = 3000;
    coupe.A = false;
  });
  await lob.A.evaluate(() => {
    recu.length = 0;
    lance({ heros: 'feu', arme: 'fusil', multi: { nom: 'Alice', depuis: 3000 } });
  });
  const fa2 = await jeu('A');
  const rejoint = await attend(async () => await fa2.evaluate(() => !MULTI.hote && S.phase === 'day' && !!S.mVu), 4000);
  ra = await role(fa2);
  const jA = await fa2.evaluate(() => S.day),
    jB = await fb.evaluate(() => S.day);
  T(
    'un joueur qui arrive devient invité de la partie en cours',
    rejoint && ra.hoteId === 'b' && ra.invite && jA === jB,
    JSON.stringify(ra) + ' jour ' + jA + '/' + jB
  );

  // ---- la fin : la ville de l'hôte tombe → l'écran de fin chez les deux, un « fin » chacun
  await lob.B.evaluate(() => (recu.length = 0));
  const kA = await fa2.evaluate(() => S.runKills);
  await fb.evaluate(() => hurtCity(S, 1e9));
  const finie = await attend(
    async () =>
      (await lob.A.evaluate(() => recu.some(m => m.dt === 'fin'))) && (await lob.B.evaluate(() => recu.some(m => m.dt === 'fin'))),
    5000
  );
  const finA = await lob.A.evaluate(() => recu.filter(m => m.dt === 'fin')),
    finB = await lob.B.evaluate(() => recu.filter(m => m.dt === 'fin'));
  const ecrans = [
    await fa2.evaluate(() => !document.getElementById('endV').hidden),
    await fb.evaluate(() => !document.getElementById('endV').hidden)
  ];
  T('fin chez les deux : écran de fin', finie && ecrans[0] && ecrans[1], JSON.stringify(ecrans));
  T(
    'fin : un « fin » chacun, le jour du groupe, ses propres tués',
    finA.length === 1 &&
      finB.length === 1 &&
      finA[0].raison === 'ville' &&
      finB[0].raison === 'ville' &&
      finA[0].jour === finB[0].jour &&
      finA[0].tues === kA,
    JSON.stringify({ A: finA[0], B: finB[0] && { jour: finB[0].jour, tues: finB[0].tues } })
  );

  await p.evaluate(() => (marche = false));
  T('aucune erreur', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
