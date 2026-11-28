// ===================== DERNIER TOIT — le pont vers le lobby (dt-pour-lobby.js) =====================
// Ce fichier n'est PAS collé dans la page de Dernier Toit : build.py y met la page publiée (PAGE) et sa version, et écrit
// dt-pour-lobby.js, à coller tel quel dans un <script> de la page du lobby. Le contrat complet est dans LOBBY.md.
// Une seule variable globale : DernierToit. Rien d'autre de Dernier Toit n'entre dans la portée du lobby : le jeu tourne dans
// une iframe (srcdoc), avec sa propre 3D, ses sons, sa sauvegarde (clé localStorage « dernier-toit-v1 ») et ses noms.
//
//   DernierToit.ouvrir(opts, rappels)   lance une partie, plein écran par-dessus le lobby
//     opts : { heros: 'feu'|'eau'|'bois'|'terre'|'elec'|'vent', arme: 'fusil'|'pistolet'|'assaut'|'sniper'|'pompe'|'lance',
//              elementArme: 'feu'|'eau'|'bois'|'terre'|'elec'|'vent' (facultatif, V4.8 : l'élément de l'arme ; sinon celui du héros),
//              elHeros: 'feu'|'eau'|'bois'|'terre'|'elec'|'vent' (facultatif, V5.2 : l'élément choisi du héros, dont la clé reste l'identité ; sinon sa clé),
//              voie: { id: 'a'|'b', nom } ou null (facultatif, V4.9 : la voie du héros ; ses cases spA1, spA2, spB1, spB2 dans bonus.heros),
//              jour: 1 (facultatif : sinon le jour le plus loin permis par la case « Raccourci » de l'immeuble),
//              rang: 1 à 4 (facultatif : vie des zombies ×1 · ×1,35 · ×1,8 · ×2,4),
//              bonus: { degats, cadence, critique, vie, heroDegats, recharge, argent, heros, balles, niveaux } (facultatif, voir LOBBY.md),
//              encoche: { haut, bas, gauche, droite } (facultatif : sinon mesurée ici, en pixels),
//              multi: { nom, depuis, max } (facultatif, V4.3 : le multi sur le toit, voir LOBBY.md ; max : taille de l'état, défaut 3000) }
//     rappels : { pret(m), fin(m), retour(), etat(d) } ; etat(d) (multi seulement) : l'état du joueur, au plus 10 fois par seconde ; pret(m) à chaque nouvelle partie : m = { jour, partie, rang, argent, sansFin, heros, arme } ;
//              fin(m) arrive une fois par partie finie : m = { victoire, jour, depart, tues, fuyards, argent, boss, duree, chutes, rang, dev,
//              sansFin, raison: 'secouru'|'ville'|'envahi'|'abandon', heros, arme, elementArme, voie }
//   DernierToit.pairs(liste, moi)   (multi, 10 fois par seconde) les AUTRES joueurs sur le toit [{ id, nom, heros, rang, depuis, etat }]
//                                    et moi = { id, nom, depuis } : transmis tels quels au jeu, qui vérifie tout
//   DernierToit.fermer()    retire le jeu (sans attendre le joueur)
//   DernierToit.ouvert      vrai pendant que le jeu est affiché (le lobby met alors en pause sa boucle, son rendu et ses sons)
//   DernierToit.version     'V4.2'…   DernierToit.ARMES, DernierToit.HEROS : les clés acceptées
//   DernierToit.accepte     ce que le jeu sait lire en plus du contrat de la V4.1 (le lobby change de conduite selon cette liste)
const DernierToit = (() => {
  const VERSION = /*@DT_VERSION@*/ '';
  const PAGE = /*@DT_PAGE@*/ '';
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let cadre = null,
    rappels = {},
    tourneT = 0,
    maxEtat = 3000; // V4.3 : taille maximale de l'état publié (opts.multi.max), en caractères de JSON
  // les bords à éviter (encoche, coins), mesurés dans la page du lobby : une iframe ne les reçoit pas toujours elle-même
  function mesureEncoche() {
    const d = document.createElement('div');
    d.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(d);
    const cs = getComputedStyle(d),
      e = {
        haut: parseFloat(cs.paddingTop) || 0,
        droite: parseFloat(cs.paddingRight) || 0,
        bas: parseFloat(cs.paddingBottom) || 0,
        gauche: parseFloat(cs.paddingLeft) || 0
      };
    d.remove();
    return e;
  }
  // la page du jeu, avec les options posées avant tout script (window.DT_LOBBY)
  function page(opts) {
    const json = JSON.stringify(opts || {}).replace(/</g, '\\u003c');
    let html = PAGE.replace('/*@DT_OPTS@*/null', () => json);
    if (DernierToit.troisJs) html = html.replace(CDN, () => DernierToit.troisJs); // tests seulement (pas d'internet)
    return html;
  }
  function surMessage(e) {
    if (!cadre || e.source !== cadre.contentWindow) return;
    const m = e.data;
    if (!m || typeof m !== 'object' || !m.dt) return;
    if (m.dt === 'pret' && rappels.pret) rappels.pret(m);
    else if (m.dt === 'fin' && rappels.fin) rappels.fin(m);
    // V4.3 : l'état du joueur (multi), jeté s'il dépasse la taille permise (le jeu la respecte déjà)
    else if (m.dt === 'etat' && rappels.etat) {
      let n = Infinity;
      try {
        n = JSON.stringify(m.d).length;
      } catch (_) {}
      if (n <= maxEtat) rappels.etat(m.d);
    } else if (m.dt === 'retour') {
      const r = rappels.retour;
      fermer();
      if (r) r();
    }
  }
  // téléphone tourné : l'encoche change de côté, on la renvoie au jeu
  function surTourne() {
    clearTimeout(tourneT);
    tourneT = setTimeout(() => {
      if (cadre && cadre.contentWindow) cadre.contentWindow.postMessage(Object.assign({ dt: 'encoche' }, mesureEncoche()), '*');
    }, 350);
  }
  function ouvrir(opts, r) {
    if (cadre) fermer();
    const o = Object.assign({}, opts);
    if (!o.encoche) o.encoche = mesureEncoche();
    const mx = o.multi && typeof o.multi === 'object' ? +o.multi.max : NaN;
    maxEtat = Number.isFinite(mx) && mx > 0 ? mx : 3000;
    rappels = r || {};
    cadre = document.createElement('iframe');
    cadre.id = 'dernierToit';
    cadre.setAttribute('allow', 'autoplay; fullscreen');
    cadre.setAttribute('title', 'Dernier Toit');
    cadre.style.cssText =
      'position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;border:0;margin:0;padding:0;display:block;z-index:2147483000;background:#0b0d10';
    cadre.srcdoc = page(o);
    document.body.appendChild(cadre);
    addEventListener('message', surMessage);
    addEventListener('resize', surTourne);
    addEventListener('orientationchange', surTourne);
    try {
      cadre.focus();
    } catch (_) {}
  }
  // V4.3 : les autres joueurs sur le toit (multi), envoyés au jeu ; il vérifie lui-même tout ce qui vient de liste
  function pairs(liste, moi) {
    if (!cadre || !cadre.contentWindow) return;
    const m = { dt: 'pairs', liste, moi };
    try {
      cadre.contentWindow.postMessage(m, '*');
    } catch (_) {
      // (une valeur qui ne se copie pas, une fonction par exemple : on passe par JSON)
      try {
        cadre.contentWindow.postMessage(JSON.parse(JSON.stringify(m)), '*');
      } catch (_) {}
    }
  }
  function fermer() {
    removeEventListener('message', surMessage);
    removeEventListener('resize', surTourne);
    removeEventListener('orientationchange', surTourne);
    clearTimeout(tourneT);
    if (cadre) cadre.remove();
    cadre = null;
    rappels = {};
  }
  return {
    version: VERSION,
    ARMES: ['fusil', 'pistolet', 'assaut', 'sniper', 'pompe', 'lance'],
    // V4.8 : Zéphyr (vent)
    HEROS: ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'],
    // V4.2 : rang (vie des zombies), argent (bourse au départ), heros (tout l'arbre du héros), balles (élément des balles), niveaux (écran de fin)
    // V4.3 : multi (plusieurs joueurs sur le même toit : opts.multi, pairs, rappels.etat)
    // V4.8 : elementArme (les balles prennent l'élément de l'arme : bonus.balles = la branche de cet élément)
    // V4.9 : voie (les voies du héros et l'ultime teinté)
    accepte: ['rang', 'argent', 'heros', 'balles', 'niveaux', 'multi', 'elementArme', 'voie', 'elHeros'],
    ouvrir,
    fermer,
    pairs,
    page,
    mesureEncoche,
    get ouvert() {
      return !!cadre;
    },
    troisJs: null
  };
})();
