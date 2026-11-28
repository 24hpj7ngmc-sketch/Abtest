// menu.js — lancer une partie (newGame), le menu de départ (showStart : mode, héros, campagne, armes, jours) et l'écran de fin (showEnd).
// Utilise des règles : newRun, HEROS / HKEYS (héros), WEAP / WKEYS (armes), START_DAYS, dayCount, J1, turOff, ROADS, INV_DAY ;
// de l'affichage : gfxGuns (couleur des manches et des gants) ; des sons : SND ; de gfx/photos.js : WPHOTO (photos des armes).
// Les tests appellent showStart, newGame (aussi par __dt.newGame) et lisent running.

// ---------------------------------------------------------------- démarrage d'une partie
// mode « Ils s'échappent » choisi ; meilleur jour du mode choisi
const OUT = () => save.mode === 'out',
  bestOf = () => (OUT() ? save.bestF || 0 : save.best || 0);
// les jours de départ possibles : 1, puis 3, 5, 7 avec la case « Raccourci » (si ce jour a déjà été atteint)
function startDays() {
  const jours = [1];
  const niv = save.lv.e_start || 0;
  for (let k = 1; k <= niv; k++) {
    const jour = START_DAYS[k];
    if (bestOf() >= jour) jours.push(jour);
  }
  return jours;
}
let pickDay = 1;
// mélange de deux couleurs 0xRRVVBB (t = 0 : a, t = 1 : b)
const mixC = (a, b, t) => {
  const rvb = x => [(x >> 16) & 255, (x >> 8) & 255, x & 255],
    rvbA = rvb(a),
    rvbB = rvb(b);
  return rvbA.map((v, i) => Math.round(v + (rvbB[i] - v) * t)).reduce((r, v) => r * 256 + v, 0);
};
// manches de veste teintées à la couleur du héros, gants tactiques sombres (armes, marteau, masse) ; gris neutres sans héros
// V5.0 : les armes à feu prennent la couleur de l'élément de l'arme (S.elArme : opts.elementArme du lobby, sinon le choix du menu), sinon celui du héros
let gearK = '';
function heroGear() {
  // « Ils arrivent » : pas de héros, pas d'élément : l'arme reste neutre (sans teinte)
  const hero = S && S.mode === 'out' ? S.hero : null,
    // V5.2 : les manches suivent l'élément choisi du héros (elH), pas sa clé
    eh = hero ? elH(S) : null,
    el = hero ? (ELKEYS.includes(S.elArme) ? S.elArme : HEROS[hero] ? eh : null) : null,
    cle = (hero || '') + '|' + (eh || '') + '|' + (el || '');
  if (cle === gearK) return;
  gearK = cle;
  if (!hero) {
    gfxGuns(null);
    return;
  }
  const couleur = parseInt(HEROS[eh].c.slice(1), 16),
    manche = mixC(couleur, 0x30353b, 0.5);
  gfxGuns({ sleeve: manche, sleeveD: mixC(manche, 0, 0.35), glove: 0x3a3732, gloveD: 0x24221f }, el);
}
// nouvelle partie au jour `day` (endless : la partie sans fin après la victoire)
function newGame(day, endless) {
  save.endlessRun = !!endless;
  S = newRun(save, day || 1);
  S.endless = !!endless;
  godMode = !!(save.dev && devO.god);
  S.god = godMode;
  S.cap = capNow;
  lastHp = S.p.hp;
  tool = 'fusil';
  aimSlot = aimDoor = -1;
  ads = false;
  snipe = false;
  fireQ = 0;
  hideAll();
  running = true;
  subBuild();
  heroGear();
  save.runs++;
  if (OUT()) save.runsOut = (save.runsOut || 0) + 1;
  tutoI = 0;
  // V4.2 : le jour de départ de cette partie, et le mode dev déjà servi (outils donnés avant : arbre au max, argent)
  S.depart = S.day;
  S.devUse = !!(save.dev || save.devDon);
  store();
  prepUI();
  bigMsg('JOUR ' + S.day, dayLine(S.day), '');
  SND.play('click');
  lobbyPartie();
}
// « 240 zombies · nouvelle route : Est » (le panneau du jour, le grand message)
function dayLine(d) {
  const nombre = S && S.day === d && turOff(S) ? J1.n : dayCount(d),
    routes = ROADS.filter(r => r.day === d && d > 1);
  return (
    fmt(nombre) +
    ' zombies' +
    (OUT() && d >= INV_DAY ? ' · certains envahissent les étages' : '') +
    (routes.length ? (OUT() ? ' · nouvelle sortie : ' : ' · nouvelle route : ') + routes.map(r => r.n).join(', ') : '')
  );
}
// ferme les écrans par-dessus le jeu (menu, fin, arbre, carte)
function hideAll() {
  for (const id of ['start', 'endV', 'tree', 'mapV', 'guideV']) $(id).hidden = true;
}
// un écran couvre le jeu : la boucle ne fait plus avancer la partie
function ov() {
  return !$('tree').hidden || !$('mapV').hidden || !$('start').hidden || !$('endV').hidden || !$('guideV').hidden;
}

// ---------------------------------------------------------------- l'écran d'accueil et de fin
// la campagne (affichage seulement) : save.camp[type] = plus haut niveau fini, save.stage = niveau choisi ('eau1') ;
// tous les niveaux jouent la même ville pour l'instant. CAMPL = nombre de niveaux ouverts par type.
const CAMPO = ['eau', 'feu', 'elec', 'terre', 'bois'],
  CAMPL = 1;
const campOpen = (e, l) => l >= 1 && l <= CAMPL;
// le niveau de campagne choisi ({ el: 'eau', l: 1 } par défaut)
function campOf() {
  const etape = typeof save.stage === 'string' ? save.stage : '',
    type = etape.slice(0, -1),
    niveau = +etape.slice(-1);
  return CAMPO.includes(type) && campOpen(type, niveau) ? { el: type, l: niveau } : { el: 'eau', l: 1 };
}
// le menu de départ, redessiné à chaque choix (toucher un héros, une arme, un niveau les choisit sans lancer ; « Commencer » lance)
function showStart() {
  // V4.1 : lancé depuis le lobby, le menu de départ, c'est le lobby (« Retour au lobby », voir lobby.js)
  if (LOBBY) {
    versLobby({ dt: 'retour' });
    return;
  }
  running = false;
  hideAll();
  $('start').hidden = false;
  pickDay = Math.min(pickDay, Math.max(...startDays()));
  $('sMode').innerHTML =
    '<small style="color:var(--mute)">Mode :</small>' +
    [
      ['in', 'Ils arrivent'],
      ['out', "Ils s'échappent"]
    ]
      .map(mode => `<button class="ghost${(save.mode || 'in') === mode[0] ? ' sel' : ''}" data-m="${mode[0]}">${mode[1]}</button>`)
      .join('');
  $('sMode')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          save.mode = b.dataset.m;
          store();
          S = newRun(save, 1);
          showStart();
        })
    );
  $('sP1').innerHTML = OUT()
    ? "La horde <b>sort de l'immeuble</b> et fuit par les rues. Depuis le toit, <b>abats-les avant qu'ils ne s'échappent</b> : chaque fuyard abîme la ville. Tiens <b>10 jours</b>."
    : "Tu es seul sur le toit d'un immeuble, au milieu de la ville, et des milliers de zombies arrivent par les rues. <b>Ils grimpent.</b> Pose tes tourelles au Marteau, prends ton fusil, et tiens <b>10 jours</b> : l'hélicoptère viendra te chercher.";
  // armes avec leur photo (mode fuite) ; toucher une carte la choisit, sans lancer la partie
  const out = OUT();
  $('sArms').hidden = $('sArmT').hidden = !out;
  if (out) {
    const armeChoisie = WEAP[save.weap] ? save.weap : 'fusil',
      virgule = v => String(Math.round(v * 10) / 10).replace('.', ',');
    $('sArms').innerHTML = WKEYS.map(k => {
      const arme = WEAP[k];
      return `<button class="wpk${k === armeChoisie ? ' cur' : ''}" data-w="${k}" style="--c:${WCOL[k]}"><img alt="" src="${WPHOTO[k] || ''}"><b>${arme.short}</b><small>${arme.pellets ? arme.pellets + ' × ' + Math.round(10 * arme.dmg) : Math.round(10 * arme.dmg)} dégâts · ${virgule(4.5 * arme.rate)}/s · ${arme.range} m${arme.flame ? ' · brûle' : ''}</small></button>`;
    }).join('');
    $('sArms')
      .querySelectorAll('button')
      .forEach(
        b =>
          (b.onclick = () => {
            save.weap = b.dataset.w;
            store();
            SND.play('click');
            showStart();
          })
      );
  }
  // V4.8 : l'élément de l'arme (ses balles) : celui du héros par défaut (prédilection : +10 % de dégâts), ou un autre au choix
  $('sElA').hidden = !out;
  if (out) {
    // V5.2 : l'élément choisi du héros (sa clé hors lobby)
    const hk = ELKEYS.includes(elHerosLobby) ? elHerosLobby : HEROS[save.hero] ? save.hero : 'feu',
      choix = ELKEYS.includes(save.elArme) ? save.elArme : '';
    $('sElA').innerHTML =
      '<small style="color:var(--mute)">Balles :</small>' +
      ['']
        .concat(ELKEYS)
        .map(
          e =>
            `<button class="ghost${e === choix ? ' sel' : ''}" data-e="${e}"${e ? ` style="--c:${HEROS[e].c}"` : ''}>${e ? ELNOM[e] + (e === hk ? ' +10 %' : '') : 'Celles du héros'}</button>`
        )
        .join('') +
      `<small id="sElD">Balles ${ELDE[choix || hk]} : elles ${ELFX[choix || hk]}.${!choix || choix === hk ? ' Élément de ton héros : +10 % de dégâts.' : ''}</small>`;
    $('sElA')
      .querySelectorAll('button')
      .forEach(
        b =>
          (b.onclick = () => {
            save.elArme = b.dataset.e || null;
            store();
            SND.play('click');
            showStart();
          })
      );
  }
  // campagne (affichage) : 5 types × 4 niveaux ; seuls les niveaux 1 se jouent (la ville actuelle), les autres n'ont pas encore de carte
  $('sCampH').hidden = $('sCamp').hidden = !out;
  if (out) {
    const choisi = campOf();
    $('sCamp').innerHTML = CAMPO.map(
      type =>
        `<div class="cst" style="--c:${HEROS[type].c}"><b>${HEROS[type].el}</b>${[1, 2, 3, 4]
          .map(niveau => {
            const fini = (save.camp[type] || 0) >= niveau,
              ouvert = campOpen(type, niveau);
            return `<button class="tchip${ouvert ? '' : ' lock'}${fini ? ' done' : ''}${choisi.el === type && choisi.l === niveau ? ' sel' : ''}" data-s="${type + niveau}" data-l="${niveau}">${niveau}${fini ? ' ✓' : ''}</button>`;
          })
          .join('')}</div>`
    ).join('');
    $('sCampD').textContent =
      HEROS[choisi.el].el +
      ' · niveau ' +
      choisi.l +
      ' : la ville, 10 jours. Cinq types, quatre niveaux : les niveaux 2 à 4 arrivent bientôt.';
    $('sCamp')
      .querySelectorAll('.tchip')
      .forEach(
        b =>
          (b.onclick = () => {
            const type = b.dataset.s.slice(0, -1),
              niveau = +b.dataset.l;
            if (!campOpen(type, niveau)) {
              SND.play('no');
              toast(HEROS[type].el + ' · niveau ' + niveau + ' : bientôt');
              return;
            }
            save.stage = b.dataset.s;
            store();
            SND.play('click');
            showStart();
          })
      );
  }
  // héros (mode fuite), comme au portail de L'Île des Cinq ; « Ils arrivent » : une note à la place
  const herosChoisi = HEROS[save.hero] ? save.hero : 'feu';
  $('sHeroT').textContent = out ? 'Choisis ton héros' : "Ils arrivent : le mode d'origine, sans héros";
  $('sGrid').innerHTML = out
    ? HKEYS.map(e => {
        const hero = HEROS[e];
        return `<button class="pick${e === herosChoisi ? ' cur' : ''}" style="--c:${hero.c}" data-h="${e}"><b>${hero.n}</b><em>${hero.role} · ${hero.el}</em><small class="kit">${hero.sk} · ${hero.ul}</small><small>${hero.pas}</small></button>`;
      }).join('')
    : '<div class="note" style="grid-column:1/-1">Dans ce mode, tu joues le survivant d\'origine : Missile en compétence, Onde de choc en ultime. Les héros, les armes et la masse sont dans « Ils s\'échappent ».</div>';
  $('sGrid')
    .querySelectorAll('.pick')
    .forEach(
      b =>
        (b.onclick = () => {
          save.hero = b.dataset.h;
          store();
          SND.play('click');
          showStart();
        })
    );
  // Son et Mode dev, chiffres, jours de départ
  $('sSnd').textContent = 'Son : ' + (save.snd !== false ? 'oui' : 'non');
  $('sSnd').onclick = () => {
    save.snd = save.snd === false;
    SND.set(save.snd);
    store();
    showStart();
  };
  $('sDev').textContent = 'Mode dev : ' + (save.dev ? 'oui' : 'non');
  $('sDev').onclick = () => {
    save.dev = !save.dev;
    store();
    showStart();
  };
  $('sKpi').innerHTML =
    `<span><small>Argent</small><b style="color:var(--gold)">${fmt(save.cash)} $</b></span><span><small>Meilleur jour</small><b>${bestOf()} / 10</b></span><span><small>Parties</small><b>${save.runs}</b></span><span><small>Sauvetages</small><b>${save.won || 0}</b></span>` +
    (save.bestEnd ? `<span><small>Sans fin</small><b>jour ${save.bestEnd}</b></span>` : '');
  const jours = startDays();
  $('sDays').innerHTML =
    jours.length > 1
      ? '<small style="color:var(--mute)">Départ :</small>' +
        jours.map(jour => `<button class="ghost${jour === pickDay ? ' sel' : ''}" data-d="${jour}">Jour ${jour}</button>`).join('')
      : '';
  $('sDays')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          pickDay = +b.dataset.d;
          showStart();
        })
    );
}
$('sGo').onclick = () => newGame(pickDay);
$('sTree').onclick = () => openTree('start');
// l'écran de fin (won : secouru au jour 10 ; sinon submergé, échappés ou envahi)
// V4.8 : « Zéphyr, Tireur · balles de Vent » (écran de fin, hors lobby ; mode fuite seulement)
function heroLigne() {
  if (!S || !S.hero || !HEROS[S.hero]) return '';
  // V5.2 : « (+10 %) » quand l'arme est de l'élément choisi du héros
  const el = S.elArme || elH(S);
  return heroRole(S.hero) + (S.voie ? ' (' + voieNom(S) + ')' : '') + ' · balles ' + ELDE[el] + (el === elH(S) ? ' (+10 %)' : '');
}
function showEnd(won) {
  running = false;
  lobbyFin(won);
  $('endV').hidden = false;
  const jour = S.day;
  $('eT').innerHTML = won
    ? 'Secouru !'
    : S.endless
      ? 'Fin de la partie sans fin'
      : S.mode === 'out'
        ? S.why === 'joueur'
          ? 'Envahi'
          : 'Ils se sont échappés'
        : 'Submergé';
  $('eT').style.color = won ? 'var(--ok)' : 'var(--danger)';
  // V4.2 (sa demande du 22/11 : ne pas faire « défaite ») : en mode fuite, la fin d'une partie est une paie : ce qu'on a gagné en gros,
  // l'arbre en premier bouton, « Repartir plus fort »
  const paie = !won && S.mode === 'out';
  $('eT').classList.toggle('paie', paie);
  if (paie) $('eT').textContent = '+ ' + fmt(S.runCash) + ' $';
  $('eP').textContent = paie
    ? (S.abandon ? 'Partie arrêtée au jour ' : S.endless ? "Partie sans fin tenue jusqu'au jour " : "Tu as tenu jusqu'au jour ") +
      jour +
      (S.abandon ? '.' : ', puis la ville a cédé.') +
      " Ton argent est gardé : dépense-le dans l'arbre de l'immeuble et repars plus fort."
    : !won && S.why === 'joueur' && S.mode === 'out'
      ? "Ceux qui envahissaient l'immeuble t'ont eu au jour " + jour + '. Ton argent est gardé : améliore-toi et repars.'
      : !won && !S.endless && S.mode === 'out'
        ? 'Trop de zombies ont fui par les rues au jour ' +
          jour +
          ' : la ville est contaminée. Ton argent est gardé : améliore-toi et repars.'
        : won
          ? "L'hélicoptère t'a sorti de là après 10 jours. La ville, elle, n'a pas fini de grouiller : tente la partie sans fin."
          : S.endless
            ? "Tu as tenu jusqu'au jour " + jour + '. Améliore-toi et recommence.'
            : "La horde t'a eu au jour " + jour + '. Ton argent est gardé : améliore-toi et repars.';
  $('eKpi').innerHTML = paie
    ? `<span><small>Jour atteint</small><b>${jour}</b></span><span><small>Zombies tués</small><b>${fmt(S.runKills)}</b></span><span><small>Mastodontes</small><b>${S.boss}</b></span><span><small>Ton argent</small><b style="color:var(--gold)">${fmt(save.cash)} $</b></span>`
    : `<span><small>Jour atteint</small><b>${jour}</b></span><span><small>Zombies tués</small><b>${fmt(S.runKills)}</b></span><span><small>Gagné</small><b style="color:var(--gold)">${fmt(S.runCash)} $</b></span><span><small>Argent</small><b style="color:var(--gold)">${fmt(save.cash)} $</b></span>`;
  // V4.2 : depuis le lobby, le rang et les niveaux du héros et de l'arme (lobbyLigne, lobby.js) ; V4.8 : le héros par son rôle, ses balles
  const ligne = lobbyLigne() || heroLigne();
  if (ligne) $('eP').insertAdjacentHTML('beforeend', '<small>' + ligne + '</small>');
  // la paie : l'arbre d'abord (bouton plein), « Repartir plus fort » ensuite
  $('eTree').className = paie ? 'solid' : 'ghost';
  $('eTree').textContent = paie ? "Améliorer l'immeuble" : 'Améliorations';
  $('eBtns').innerHTML = '';
  const bouton = (texte, action, classe) => {
    const el = document.createElement('button');
    el.className = classe || 'solid';
    el.textContent = texte;
    el.onclick = action;
    $('eBtns').appendChild(el);
  };
  if (won)
    bouton(
      'Continuer sans fin',
      () => {
        newGame(11, true);
      },
      'ghost'
    );
  const jours = startDays();
  const rejouer = paie ? 'Repartir plus fort' : 'Rejouer';
  bouton(
    jours.length > 1 ? rejouer + ' (jour ' + Math.max(...jours) + ')' : rejouer,
    () => newGame(Math.max(...jours)),
    paie ? 'ghost' : 'solid'
  );
  if (S.endless) save.bestEnd = Math.max(save.bestEnd || 0, jour);
  store();
}
$('eTree').onclick = () => openTree('end');
$('eMenu').onclick = showStart;
