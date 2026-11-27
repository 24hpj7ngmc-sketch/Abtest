// [interface/multi.js] Le multi vu de la partie : l'état du réseau (net), et le salon que le lobby tient pour elle (MULTI : le lobby fait le facteur entre les téléphones).
// ---------- multijoueur : le « salon » de la page relie ceux qui l'ont ouverte en même temps ----------
// La partie la plus ancienne fait foi : son téléphone est l'hôte et fait tourner les ennemis et les défenses.
// Les invités lui envoient leurs actions et recopient son état plusieurs fois par seconde. Si l'hôte part, un invité reprend.
const HK = [
  'hDmg',
  'hCd',
  'hLife',
  'hPierce',
  'hSpd',
  'hSprint',
  'hJump',
  'abCd',
  'abRad',
  'abDmg',
  'kDur',
  'kWide',
  'kLen',
  'kTrail',
  'kHeal',
  'uRad',
  'uDur',
  'uExtra',
  'uCharge',
  'pA',
  'hCrit',
  'hCritD',
  'hMark',
  'hBoss',
  'eFireR',
  'eBurn',
  'eSlow',
  'eWave',
  'ePois',
  'ePoisD',
  'eKnock',
  'eArm',
  'eChain',
  'eChainD',
  'hPel',
  'hSpread',
  'hFlame',
  'hCone',
  'hBurn',
  'kPush',
  'uDmg',
  'ePierce',
  'eLift',
  'voA',
  'voB',
  'spA1',
  'spA2',
  'spB1',
  'spB2'
];
const net = {
  room: null,
  host: true,
  hs: 0,
  seq: 0,
  acts: [],
  seen: {},
  lastS: null,
  rl: '',
  noHost: 0,
  n: 1,
  pubT: 0,
  snapT: 0,
  snap: null,
  wasPlay: null,
  endT: 0,
  hlSeen: {},
  hl: null,
  aL: {}, // les armes choisies par les coéquipiers, pour l'écran du choix (interface/arsenal.js)
  wp: null, // chez un invité : les niveaux d'armes payés, tels que l'hôte les annonce (repris si l'on devient hôte)
  wpMine: '' // la dernière réponse de l'hôte pour nos propres armes
};
// ---------- LE SALON VU DU JEU ----------
// La partie, dans son cadre, ne voit pas le réseau : le lobby fait le facteur (LOBBY.md). La partie lui donne son état complet (message « etat », au plus dix fois par seconde,
// au plus MULTI.max caractères de JSON), et le lobby lui rend dix fois par seconde les états des AUTRES joueurs qui sont dans ce jeu (message « pairs »).
// Cet objet donne à netTick la même interface qu'un salon (presence, peers, connected) : rien d'autre ne change dans le multi de la partie.
// Tout ce qui arrive par « pairs » vient d'autres téléphones : rien n'y est fiable (netTick et applySnap vérifient déjà ce qu'ils lisent).
const MULTI = {
  actif: !!(LOBBY.multi && typeof LOBBY.multi === 'object'),
  max: 3000,
  id: 'moi',
  liste: [],
  mine: {},
  sale: false,
  envT: 0
};
if (MULTI.actif) {
  const mx = +LOBBY.multi.max;
  if (Number.isFinite(mx) && mx > 0) MULTI.max = mx;
  net.room = {
    connected: () => true,
    presence: p => {
      for (const k in p) {
        if (p[k] === null) delete MULTI.mine[k];
        else MULTI.mine[k] = p[k];
      }
      MULTI.sale = true;
      return Promise.resolve();
    },
    peers: () =>
      [{ peer: MULTI.id, isMe: true, sameTab: true, kind: 'viewer', presence: MULTI.mine }].concat(
        MULTI.liste.map(o => ({
          peer: o.id,
          isMe: false,
          sameTab: false,
          kind: 'viewer',
          guest: true,
          presence: o.etat
        }))
      )
  };
  addEventListener('message', e => {
    const m = e.data;
    if (e.source !== parent || !m || typeof m !== 'object' || m.ile !== 'pairs') return;
    const out = [];
    for (const o of Array.isArray(m.liste) ? m.liste.slice(0, 8) : []) {
      if (!o || typeof o !== 'object' || typeof o.id !== 'string' || !o.id || o.id.length > 80) continue;
      out.push({ id: o.id, etat: o.etat && typeof o.etat === 'object' && !Array.isArray(o.etat) ? o.etat : {} });
    }
    MULTI.liste = out;
    if (m.moi && typeof m.moi === 'object' && typeof m.moi.id === 'string' && m.moi.id)
      MULTI.id = m.moi.id.slice(0, 80);
  });
}
// appelée à chaque image : envoie l'état s'il a changé
function multiEnvoi(now) {
  if (!MULTI.actif || !MULTI.sale || now - MULTI.envT < 95) return;
  MULTI.envT = now;
  MULTI.sale = false;
  let n = Infinity;
  try {
    n = JSON.stringify(MULTI.mine).length;
  } catch (_) {}
  if (n <= MULTI.max) versLobby({ ile: 'etat', d: MULTI.mine });
}
