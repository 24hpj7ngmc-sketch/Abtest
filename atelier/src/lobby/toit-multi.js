// [lobby/toit-multi.js] Le relais du multi pour Dernier Toit : le lobby fait le facteur entre les téléphones (toitEtat, toitNet).
// ---- le relais du multi pour Dernier Toit. Dernier Toit tourne dans son cadre et ne voit pas le salon : le lobby fait le facteur.
// Le contrat (Dernier Toit le suit depuis sa V4.3) : docs/DEMANDE-DT-MULTI.md et dt/LOBBY.md.
//  · Dernier Toit → lobby : toitEtat(d) (branché sur le rappel « etat » de DernierToit.ouvrir) publie d, tel quel, dans le salon (clé dn : un état complet, pas un événement).
//  · lobby → Dernier Toit : dix fois par seconde, DernierToit.pairs(liste, moi) avec les autres joueurs du salon qui sont sur le toit : {id, nom, heros, rang, depuis, etat}.
//    « depuis » ordonne les arrivées : le plus petit est l'hôte de la partie du toit.
// Taille de l'état (V10.7, « il faut qu'on puisse voir tous les zombies ») : 24 000 caractères hors de Claude (de quoi décrire plus de 2 500 zombies), 2 800 dans le salon de la page Claude (présence petite).
// Un gros état part moins souvent, pour ne pas noyer le réseau : au plus ≈ 40 000 caractères par seconde, jamais moins de 2 envois par seconde (3 000 → 10 par seconde, 12 000 → 3, 24 000 → 2).
// Dernier Toit envoie un état complet toutes les 100 ms : celui qu'on saute est remplacé par le suivant, rien ne se perd.
const dnMax = () => (net.ext ? 24000 : 2800);
function toitEtat(d) {
  let s = '';
  try {
    s = JSON.stringify(d);
  } catch (_) {
    return;
  }
  if (typeof s !== 'string' || s.length > dnMax()) return;
  const now = performance.now();
  if (now - (LN.dnT || 0) < Math.min(500, Math.max(90, s.length / 40))) return;
  LN.dnT = now;
  LN.dnN = (LN.dnN || 0) + 1;
  npub({ dn: d });
}
function toitNet(now) {
  if (now - LN.tnT < 100) return;
  LN.tnT = now;
  const r = net.room;
  if (!r) return;
  let peers = [];
  try {
    peers = r.peers() || [];
  } catch (_) {}
  const me = peers.find(p => p.isMe && p.sameTab),
    L = [];
  for (const p of peers) {
    const pr = p.presence;
    if ((p.isMe && p.sameTab) || !pr || pr.st !== 'toit' || !(+pr.tt > 0)) continue;
    L.push({
      id: String(p.peer),
      nom: nmClean(pr.nm),
      heros: HEROS.includes(pr.el) ? pr.el : 'feu',
      rang: Math.max(1, Math.min(4, Math.round(+pr.tr) || 1)),
      depuis: +pr.tt,
      etat: (() => {
        try {
          const s = JSON.stringify(pr.dn);
          return typeof s === 'string' && s.length <= dnMax() ? pr.dn : null;
        } catch (_) {
          return null;
        }
      })()
    });
  }
  if (TR) {
    let h = null;
    const my = { id: me ? String(me.peer) : '', depuis: LN.tt || 0 };
    for (const o of L) if (!h || o.depuis < h.depuis || (o.depuis === h.depuis && o.id < h.id)) h = o;
    TR.hostR = h && (h.depuis < my.depuis || (h.depuis === my.depuis && h.id < my.id)) ? h.rang : TR.r;
  }
  try {
    DernierToit.pairs(L, { id: me ? String(me.peer) : '', nom: LN.nm, depuis: LN.tt || 0 });
  } catch (e) {
    console.error(e);
  }
}
