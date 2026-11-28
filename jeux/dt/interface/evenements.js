// evenements.js — les événements de la partie (S.ev, remplis par les règles à chaque pas) → sons, messages, effets.
// Chaque événement passe d'abord à l'affichage (gfxEvent : éclairs, sang, explosions…), puis ici : son (SND.play, ou SND.at s'il est
// placé dans la ville), toast ou grand message, gains qui flottent, fin de partie. La liste est vidée après.
// Utilise des règles : ROADS, INV_DAY, H, ZT, VARD ; de l'affichage : gfxEvent ; des sons : SND.
// Les tests appellent events (après avoir fait avancer la partie à la main).

// ---------------------------------------------------------------- les événements du jeu → sons, messages, effets
// groanT : prochain grognement au hasard (boucle) ;
// escT / invT : derniers messages « s'échappe » / « envahissent » (pas plus d'un toutes les 2,5 à 4 s)
let groanT = 2,
  escT = 0,
  invT = 0;
// V4.2 : le voile du joueur tombé (mode fuite) : « Tu es tombé », le compte à rebours du relevé (S.p.down), ce que ça coûte
const chuteV = document.createElement('div');
chuteV.id = 'chuteV';
chuteV.hidden = true;
chuteV.innerHTML =
  '<b>Tu es tombé</b><span id="chuteT"></span><small>La horde file pendant ce temps. Rien n\'est perdu : ton argent est gardé.</small>';
document.body.appendChild(chuteV);
function chuteTick() {
  const d = S && running && S.p.down > 0 ? S.p.down : 0;
  if (!d) {
    if (!chuteV.hidden) chuteV.hidden = true;
    return;
  }
  chuteV.hidden = false;
  $('chuteT').textContent = 'De retour sur le toit dans ' + Math.ceil(d) + ' s';
}
function events() {
  for (const ev of S.ev) {
    gfxEvent(ev, S);
    // k : la sorte d'événement
    const k = ev.k;
    if (k === 'shot') {
      SND.play('shot', ev.w);
      // V4.9 : Sniper, tir chargé
      if (ev.charge) SND.play('percant');
      if (ev.hit) {
        $('cross').className = ev.kill ? 'kill' : ev.crit ? 'crit' : 'hit';
        crossT = ev.kill ? 0.18 : 0.09;
      }
    } else if (k === 'tracer') SND.at('mg', ev.x0, ev.z0, 0, ev.y0);
    else if (k === 'boom') SND.at(ev.kind === 'A' || ev.kind === 'M' ? 'big' : 'boom', ev.x, ev.z, ev.r, ev.y);
    else if (k === 'mortar') SND.at('mortar', ev.x, ev.z);
    else if (k === 'pkill') {
      SND.play('coin');
      floater(ev.x, ev.y, ev.z, '+' + fmt(ev.c) + ' $');
    } else if (k === 'road') {
      SND.play('road');
      bigMsg('NOUVELLE ROUTE', (ROADS[ev.r].w > 6 ? "L'avenue " + ROADS[ev.r].n : 'La ' + ROADS[ev.r].n) + ' est ouverte', 'red');
    } else if (k === 'dawn') {
      SND.play('siren');
      bigMsg(
        'JOUR ' + ev.d,
        S.mode === 'out' ? (ev.d === INV_DAY ? 'Ils sortent… et certains montent dans les étages !' : 'Ils sortent !') : dayLine(ev.d),
        'red',
        S.mode === 'out' && ev.d === INV_DAY ? 3500 : 2200
      );
    } else if (k === 'escape') {
      SND.play('esc');
      if (performance.now() - escT > 2500) {
        escT = performance.now();
        toast("Un zombie s'échappe par " + (ROADS[ev.r].w > 8 ? "l'avenue " : 'la ') + ROADS[ev.r].n.toLowerCase() + ' !', 1800);
      }
    } else if (k === 'boss') {
      SND.play('boss');
      toast(
        S.mode === 'out'
          ? "Un MASTODONTE sort de l'immeuble !"
          : 'Un MASTODONTE arrive par ' + (ROADS[ev.r].w > 8 ? "l'avenue " : 'la ') + ROADS[ev.r].n.toLowerCase() + ' !',
        3000
      );
    } else if (k === 'bossdead') bigMsg('MASTODONTE ABATTU', '', 'gold', 1600);
    else if (k === 'clear') {
      SND.play('clear');
      bigMsg('JOUR ' + ev.d + ' TENU', '+' + fmt(ev.bonus) + ' $ de prime', 'gold', 3000);
      store();
    } else if (k === 'prep') {
      prepUI();
      if (S.day === 2 && save.runs <= 2)
        toast(
          S.mode === 'out'
            ? 'Pour dépenser ton argent : va à une boutique, sur le toit ou au rez-de-chaussée'
            : 'Entre deux jours : dépense ton argent dans « Améliorations » (en haut à droite)',
          4200
        );
    } else if (k === 'heli') {
      bigMsg('JOUR 10 TENU', "L'hélicoptère arrive !", 'gold', 3500);
    } else if (k === 'won') {
      // victoire : le niveau de campagne choisi est marqué fini (mode fuite, hors partie sans fin)
      SND.play('win');
      if (S.mode === 'out' && !S.endless) {
        const niveau = campOf();
        save.camp[niveau.el] = Math.max(save.camp[niveau.el] || 0, niveau.l);
      }
      store();
      setTimeout(() => showEnd(true), 900);
    } else if (k === 'tombe') {
      SND.play('hurt');
      chuteTick();
    } else if (k === 'releve') {
      SND.play('click');
      bigMsg('DE RETOUR', 'La partie continue', 'gold', 1400);
      chuteTick();
    } else if (k === 'dead') {
      SND.play('dead');
      store();
      setTimeout(() => showEnd(false), 1400);
    } else if (k === 'over') {
      if (Math.random() < 0.3) SND.at('groan', ev.x, ev.z, 0, H);
    } else if (k === 'win') {
      SND.at('groan', ev.x, ev.z, 0, ev.y);
      if (performance.now() - escT > 3000) {
        escT = performance.now();
        toast('Ils entrent par les fenêtres !', 1800);
      }
    } else if (k === 'inv') {
      if (performance.now() - invT > 4000) {
        invT = performance.now();
        toast('Ils envahissent le ' + (ev.lv === 1 ? '1er' : ev.lv + 'e') + ' étage !', 2000);
        SND.play('boss');
      }
    }
    // V1.5 : cloisons, masse, planches
    else if (k === 'wallhit') SND.at('wallhit', ev.x, ev.z, 0, ev.y);
    else if (k === 'wallbreak') SND.at('wallbreak', ev.x, ev.z, 0, ev.y);
    else if (k === 'swing') SND.play('swing');
    else if (k === 'masse') {
      if (ev.n || ev.wall) SND.at('masse', ev.x, ev.z, ev.wall ? 2 : 1, ev.y);
    } else if (k === 'plank') {
      SND.at('plank', ev.x, ev.z, 0, ev.y);
      if (ev.pay > 0) {
        SND.play('coin');
        floater(ev.x, ev.y + 0.5, ev.z, '+' + fmt(ev.pay) + ' $');
      }
    } else if (k === 'sprint') {
      SND.play('dash');
    } else if (k === 'tear') {
      SND.at('tear', ev.x, ev.z, 0, ev.y);
      if (!S.toldTear) {
        S.toldTear = 1;
        escT = performance.now() + 1500;
        toast('Ils arrachent tes planches !', 3200);
      }
    }
    // ('decoy', 'mlaunch' et les autres : rien de plus que l'affichage)
    // V3.9 : variantes de zombies (la première de chaque sorte, dans la partie)
    else if (k === 'variant') {
      SND.play('boss');
      toast(ZT[ev.ty].n.toUpperCase() + ' : ' + VARD[ev.ty], 3600);
    } else if (k === 'hurle') SND.at('hurle', ev.x, ev.z, 0, ev.y);
    // V4.7 : la tyrolienne se débloque (l'escalade est offerte)
    else if (k === 'tyro_lock') {
      if (!S.toldClimb) {
        S.toldClimb = 1;
        toast('Tyrolienne : à débloquer à la Boutique (branche Survie)', 3200);
      }
    } else if (k === 'climb') SND.play('swing');
    else if (k === 'zip') SND.play('dash');
    else if (k === 'grappin')
      SND.play('dash'); // V4.7 : le crochet part (la traction fait le bruit de l'escalade)
    // V3.0 : héros
    else if (k === 'refus') {
      SND.play('no');
      toast(ev.why, 1600);
    } else if (k === 'brasier0') SND.play('fireball');
    else if (k === 'meteor') SND.at('meteor', ev.x, ev.z, 0, 25);
    else if (k === 'maree') SND.at('vague', ev.x, ev.z, 0, ev.y);
    else if (k === 'ronces') SND.at('ronces', ev.x, ev.z, 0, ev.y);
    else if (k === 'fleche') SND.at('fleche', ev.x0, ev.z0, 0, ev.y0);
    else if (k === 'rempart') SND.at('rempart', ev.x, ev.z, 0, 0);
    else if (k === 'rempart_fin') SND.at(ev.broke ? 'eboul' : 'enfonce', ev.x, ev.z, 0, 0);
    else if (k === 'zap') {
      if (ev.small) SND.at('zap', ev.x1, ev.z1, 0, ev.y1);
      else SND.at('tonnerre', ev.x1, ev.z1, 0, ev.y1);
    } else if (k === 'eclair') SND.play('eclair');
    // V4.9 : les voies
    else if (k === 'acheve') SND.at('zap', ev.x, ev.z, 0, ev.y);
    else if (k === 'relance') toast('Fulgurance relancé !', 1200);
    else if (k === 'bouclier') SND.play('vague');
    else if (k === 'plonge') SND.play('dash');
    else if (k === 'onde_roc') SND.at('eboul', ev.x, ev.z, 0, 0);
    // V4.8 : Zéphyr
    else if (k === 'rafale') SND.play('rafale');
    else if (k === 'percant') SND.play('percant');
    else if (k === 'hult') SND.play('ult', ev.h);
  }
  chuteTick();
  S.ev.length = 0;
}
// le réticule grossit un instant quand une balle touche (crossT : temps restant)
let crossT = 0;
