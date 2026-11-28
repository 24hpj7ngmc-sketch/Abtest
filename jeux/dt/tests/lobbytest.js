// V4.1 : Dernier Toit lancé depuis une page « lobby » (une page hôte minimale qui colle dt-pour-lobby.js, comme le fera le vrai lobby).
// Vérifie : la partie démarre sans menu, avec le héros, l'arme, le jour et les bonus demandés ; l'encoche passée arrive dans le style ;
// abandonner envoie un seul message « fin » au lobby ; « Retour au lobby » ferme le jeu ; une deuxième ouverture repart proprement ;
// la page seule (sans lobby) garde son menu.
//   node tests/lobbytest.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  // la page hôte, à côté de test3d.html (même dossier : le jeu y trouve gfx/three-lite.js)
  const hote = path.resolve('shots/hote-lobby.html');
  fs.mkdirSync(path.dirname(hote), { recursive: true });
  fs.writeFileSync(
    hote,
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
      '<body style="margin:0;background:#123"><h1 id="lob">LOBBY</h1><script>' +
      fs.readFileSync('dt-pour-lobby.js', 'utf8') +
      '\nDernierToit.troisJs = ' +
      JSON.stringify('file://' + path.resolve('gfx/three-lite.js')) +
      ';\nwindow.recu = [];\n' +
      'function lance(o){ DernierToit.ouvrir(o, { pret: m => recu.push(m), fin: m => recu.push(m), retour: () => recu.push({ dt: "retour-lobby" }) }); }\n' +
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
  const ctx = await b.newContext({ viewport: { width: 966, height: 366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    // (les polices Google ne chargent pas ici : pas d'internet)
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.push(m.text());
  });
  await p.goto('file://' + hote);
  T(
    'le lobby charge le pont',
    await p.evaluate(() => typeof DernierToit === 'object' && DernierToit.version === 'V5.6' && !DernierToit.ouvert)
  );

  // une partie : Roc (terre, +50 vie), fusil à pompe, dégâts ×2, +20 vie, recharge ×0,5, encoche à gauche
  await p.evaluate(() =>
    lance({
      heros: 'terre',
      arme: 'pompe',
      jour: 7,
      bonus: { degats: 2, vie: 20, recharge: 0.5, critique: 0.1 },
      encoche: { gauche: 47, droite: 0, haut: 0, bas: 21 }
    })
  );
  await p.waitForTimeout(2500);
  const f = p.frames().find(fr => fr !== p.mainFrame());
  T('le jeu est dans une iframe', !!f);
  const etat = await f.evaluate(() => {
    // la référence : l'arbre de l'immeuble seul, sans les bonus du lobby
    const S = __dt.S,
      garde = bonusLobby;
    bonusLobby = null;
    const base = derive(save.lv);
    bonusLobby = garde;
    const cs = getComputedStyle(document.documentElement);
    return {
      running,
      menu: !document.getElementById('start').hidden,
      hero: S.hero,
      weap: S.weap,
      mode: S.mode,
      day: S.day,
      rDmg: S.P.rDmg / base.rDmg,
      crit: S.P.rCrit - base.rCrit,
      cd: S.P.mis.cd / base.mis.cd,
      hpMax: S.p.hpMax,
      hpBase: base.hp,
      saL: cs.getPropertyValue('--saL').trim(),
      saB: cs.getPropertyValue('--saB').trim(),
      eMenu: document.getElementById('eMenu').textContent,
      lv: JSON.stringify(save.lv)
    };
  });
  T('la partie démarre sans menu', etat.running && !etat.menu, JSON.stringify({ running: etat.running, menu: etat.menu }));
  T(
    'héros et arme du lobby',
    etat.hero === 'terre' && etat.weap === 'pompe' && etat.mode === 'out',
    etat.hero + ' ' + etat.weap + ' ' + etat.mode
  );
  T('jour 7 refusé sans « Raccourci » : jour 1', etat.day === 1, etat.day);
  T('bonus de dégâts ×2', Math.abs(etat.rDmg - 2) < 1e-9, etat.rDmg);
  T('bonus de critique +0,1', Math.abs(etat.crit - 0.1) < 1e-9, etat.crit);
  T('recharge ×0,5', Math.abs(etat.cd - 0.5) < 1e-9, etat.cd);
  T('vie : base + 50 (Roc) + 20 (lobby)', etat.hpMax === etat.hpBase + 70, etat.hpMax + ' / ' + etat.hpBase);
  T("l'encoche passée arrive dans le style", etat.saL === '47px' && etat.saB === '21px', etat.saL + ' ' + etat.saB);
  T('« Retour au lobby » à la place de « Menu »', etat.eMenu === 'Retour au lobby', etat.eMenu);
  let recu = await p.evaluate(() => recu);
  T(
    'message « pret »',
    recu.length === 1 && recu[0].dt === 'pret' && recu[0].heros === 'terre' && recu[0].arme === 'pompe',
    JSON.stringify(recu)
  );

  // un achat à la boutique garde les bonus du lobby (S.P est recalculé)
  const apres = await f.evaluate(() => {
    S.P = derive(save.lv);
    const garde = bonusLobby;
    bonusLobby = null;
    const r = S.P.rDmg / derive(save.lv).rDmg;
    bonusLobby = garde;
    return r;
  });
  T('les bonus tiennent après un recalcul de S.P', Math.abs(apres - 2) < 1e-9, apres);

  // le joueur abandonne (grande carte) : un seul « fin », même si l'écran de fin est redessiné (retour de l'arbre)
  await f.evaluate(() => {
    S.runKills = 37;
    S.runCash = 512;
    S.escaped = 4;
    openMap();
  });
  await p.waitForTimeout(200);
  const abandon = await f.evaluate(() => {
    const bt = [...document.querySelectorAll('#mapV button')].find(x => x.textContent.includes('Abandonner'));
    if (!bt) return false;
    bt.click();
    showEnd(false);
    return true;
  });
  T('bouton « Abandonner » trouvé', abandon);
  await p.waitForTimeout(300);
  recu = await p.evaluate(() => recu);
  const fins = recu.filter(m => m.dt === 'fin');
  T('un seul message « fin »', fins.length === 1, fins.length);
  const fin = fins[0] || {};
  T(
    'contenu de « fin »',
    fin.victoire === false &&
      fin.raison === 'abandon' &&
      fin.tues === 37 &&
      fin.argent === 512 &&
      fin.fuyards === 4 &&
      fin.jour === 1 &&
      fin.heros === 'terre' &&
      fin.arme === 'pompe',
    JSON.stringify(fin)
  );
  T("l'écran de fin est affiché", await f.evaluate(() => !document.getElementById('endV').hidden));

  // « Retour au lobby »
  await f.evaluate(() => document.getElementById('eMenu').click());
  await p.waitForTimeout(400);
  recu = await p.evaluate(() => recu);
  T(
    '« Retour au lobby » ferme le jeu',
    recu.some(m => m.dt === 'retour-lobby') && (await p.evaluate(() => !DernierToit.ouvert && !document.getElementById('dernierToit')))
  );

  // deuxième ouverture : Volt, sniper, sans bonus ; la sauvegarde du jeu (clé à lui) est gardée d'une ouverture à l'autre
  await p.evaluate(() => {
    recu.length = 0;
    lance({ heros: 'elec', arme: 'sniper' });
  });
  await p.waitForTimeout(2500);
  const f2 = p.frames().find(fr => fr !== p.mainFrame());
  const e2 = await f2.evaluate(() => ({
    hero: S.hero,
    weap: S.weap,
    rDmg: bonusLobby === null ? 1 : -1,
    runs: save.runs,
    hpMax: S.p.hpMax,
    base: derive(save.lv).hp
  }));
  T(
    'deuxième partie : Volt, sniper, sans bonus',
    e2.hero === 'elec' && e2.weap === 'sniper' && Math.abs(e2.rDmg - 1) < 1e-9 && e2.hpMax === e2.base - 15,
    JSON.stringify(e2)
  );
  T('la sauvegarde du jeu est gardée (2 parties lancées)', e2.runs >= 2, e2.runs);
  T('le lobby garde sa propre page', await p.evaluate(() => document.getElementById('lob').textContent === 'LOBBY'));
  T(
    "l'encoche se renvoie quand on tourne le téléphone",
    await (async () => {
      await p.setViewportSize({ width: 900, height: 380 });
      await p.waitForTimeout(700);
      return f2.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--saL').trim() === '0px');
    })()
  );
  await p.evaluate(() => DernierToit.fermer());

  // la page seule : le menu de départ, pas de lobby
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errs.push('page seule : ' + e.message));
  await p2.goto('file://' + path.resolve('test3d.html'));
  await p2.waitForTimeout(1500);
  T(
    'page seule : menu de départ, rien du lobby',
    await p2.evaluate(
      () =>
        !document.getElementById('start').hidden &&
        !running &&
        LOBBY === null &&
        bonusLobby === null &&
        document.getElementById('eMenu').textContent === 'Menu'
    )
  );

  T('aucune erreur', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(ok + ' OK, ' + ko + ' ratés · erreurs ' + errs.length);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
