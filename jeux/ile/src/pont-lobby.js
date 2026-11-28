// ===================== L'ÎLE DES CINQ — le pont vers le lobby (ile-pour-lobby.js) =====================
// Ce fichier n'est PAS collé dans la page du jeu : build.py y met la page du jeu (PAGE), sa version et ses tables publiques, et écrit
// construit/ile-pour-lobby.js, à coller tel quel dans un <script> de la page du lobby. Le contrat complet est dans LOBBY.md.
// Une seule variable globale : IleDesCinq. Rien d'autre du jeu n'entre dans la portée du lobby : le jeu tourne dans une iframe (srcdoc),
// avec sa propre 3D, ses sons et ses noms. Il n'écrit AUCUNE sauvegarde : tout ce qui dure (or, éclats, arbres, campagne, réglages) reste au lobby.
//
//   IleDesCinq.ouvrir(opts, rappels)   lance le jeu, plein écran par-dessus le lobby
//     opts : { heros: 'feu'|'eau'|'bois'|'terre'|'elec', arme: 'fusil'|'pistolet'|'assaut'|'sniper'|'pompe'|'lance',
//              mode: 'normal'|'hard', campagne: { el, l } ou null, tuto: vrai = la partie guidée, dev: vrai = le mode développeur est permis,
//              bonus: { mods: { <héros>: { <arme>: { hDmg: 0.2, … } } }, prep: { mods: { hDmg, hHp }, noms: ['…'] }, or: 0 },
//              gains: le barème du lobby (pour le Guide du jeu), reglages: { snd, fire, aj, devOpt },
//              multi: { nom, depuis, max } (facultatif : la partie à plusieurs), encoche: { haut, bas, gauche, droite } (sinon mesurée ici) }
//     rappels : { pret(m), fin(m), retour(), etat(d), reglages(m), arme(m) } — voir LOBBY.md pour le contenu de chaque message
//   IleDesCinq.paie(lignes)         après fin(m) : ce que le lobby vient de payer, affiché par le jeu sur son écran de fin [{ t: 'texte', fort: vrai }]
//   IleDesCinq.pairs(liste, moi)    (multi, 10 fois par seconde) les AUTRES joueurs dans le jeu [{ id, nom, heros, rang, depuis, etat }] et moi = { id, nom, depuis }
//   IleDesCinq.fermer()             retire le jeu (sans attendre le joueur)
//   IleDesCinq.ouvert               vrai pendant que le jeu est affiché (le lobby met alors en pause sa boucle, son rendu et ses sons)
//   IleDesCinq.version              'V1.0'…   IleDesCinq.ARMES, IleDesCinq.HEROS : les clés acceptées
//   IleDesCinq.accepte              ce que le jeu sait lire (le lobby change de conduite selon cette liste)
//   IleDesCinq.tables               des tables du jeu, en lecture seule, pour les textes du lobby (arbres, Guide) : voir LOBBY.md
const IleDesCinq = (() => {
  const VERSION = /*@ILE_VERSION@*/ '';
  const PAGE = /*@ILE_PAGE@*/ '';
  const TABLES = /*@ILE_TABLES@*/ null;
  const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let cadre = null,
    rappels = {},
    tourneT = 0,
    maxEtat = 3000; // taille maximale de l'état publié (opts.multi.max), en caractères de JSON
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
  // la page du jeu, avec les options posées avant tout script (window.ILE_LOBBY)
  function page(opts) {
    const json = JSON.stringify(opts || {}).replace(/</g, '\\u003c');
    let html = PAGE.replace('/*@ILE_OPTS@*/null', () => json);
    if (IleDesCinq.troisJs) html = html.replace(CDN, () => IleDesCinq.troisJs); // tests seulement (pas d'internet)
    return html;
  }
  function vers(m) {
    if (!cadre || !cadre.contentWindow) return;
    try {
      cadre.contentWindow.postMessage(m, '*');
    } catch (_) {
      // (une valeur qui ne se copie pas, une fonction par exemple : on passe par JSON)
      try {
        cadre.contentWindow.postMessage(JSON.parse(JSON.stringify(m)), '*');
      } catch (_) {}
    }
  }
  function surMessage(e) {
    if (!cadre || e.source !== cadre.contentWindow) return;
    const m = e.data;
    if (!m || typeof m !== 'object' || typeof m.ile !== 'string') return;
    if (m.ile === 'etat') {
      // l'état du joueur (multi), jeté s'il dépasse la taille permise (le jeu la respecte déjà)
      if (!rappels.etat) return;
      let n = Infinity;
      try {
        n = JSON.stringify(m.d).length;
      } catch (_) {}
      if (n <= maxEtat) rappels.etat(m.d);
    } else if (m.ile === 'retour') {
      const r = rappels.retour;
      fermer();
      if (r) r();
    } else if ((m.ile === 'pret' || m.ile === 'fin' || m.ile === 'reglages' || m.ile === 'arme') && rappels[m.ile])
      rappels[m.ile](m);
  }
  // téléphone tourné : l'encoche change de côté, on la renvoie au jeu
  function surTourne() {
    clearTimeout(tourneT);
    tourneT = setTimeout(() => vers(Object.assign({ ile: 'encoche' }, mesureEncoche())), 350);
  }
  function ouvrir(opts, r) {
    if (cadre) fermer();
    const o = Object.assign({}, opts);
    if (!o.encoche) o.encoche = mesureEncoche();
    const mx = o.multi && typeof o.multi === 'object' ? +o.multi.max : NaN;
    maxEtat = Number.isFinite(mx) && mx > 0 ? mx : 3000;
    rappels = r || {};
    cadre = document.createElement('iframe');
    cadre.id = 'ileDesCinq';
    cadre.setAttribute('allow', 'autoplay; fullscreen');
    cadre.setAttribute('title', "L'Île des Cinq");
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
    HEROS: ['feu', 'eau', 'bois', 'terre', 'elec', 'vent'], // V2.1 : Zéphyr ('vent') est jouable
    accepte: ['mode', 'campagne', 'tuto', 'bonus', 'gains', 'reglages', 'multi', 'paie', 'elements', 'voie', 'elHeros'], // 'elements' : opts.elements, et les six branches « Élément des balles » dans bonus.mods ; 'voie' (V2.2) : opts.voie et ses cases spA1…spB2
    tables: TABLES,
    ouvrir,
    fermer,
    pairs: (liste, moi) => vers({ ile: 'pairs', liste, moi }),
    paie: lignes => vers({ ile: 'paie', lignes }),
    page,
    mesureEncoche,
    get ouvert() {
      return !!cadre;
    },
    troisJs: null
  };
})();
