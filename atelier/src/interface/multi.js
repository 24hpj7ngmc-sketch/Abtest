// [interface/multi.js] Le multi : le salon de la page (dans Claude) ou un mot de salon relayé par MQTT (ailleurs) — net, mqRoom, mqJoin ; netTick à chaque image.
// ---------- multijoueur : le « salon » relie ceux qui ont ouvert la page en même temps (dans Claude), ou ceux qui ont tapé le même mot de salon (ailleurs) ----------
// net.room : le salon ; net.why : pourquoi il n'y en a pas ; net.ext : hors de Claude ; net.wasPlay : ma présence « au lobby » est-elle à republier.
// Le lobby à plusieurs (lobby/multi.js) et le facteur des mini-jeux (ileNet, toitNet) parlent tous à ce salon.
const net = { room: null, wasPlay: null };
net.why = window.claude && window.claude.use ? 'wait' : 'page';
if (net.why === 'wait')
  window.claude
    .use('room')
    .then(r => {
      net.room = r;
      net.why = r ? '' : 'refus';
    })
    .catch(() => {
      net.why = 'erreur';
    });
// ---------- LE MULTI HORS DE CLAUDE (V9.8) ----------
// Dans Claude, le multi passe par le salon de la page (`room`), qui n'admet que des invités connectés à Claude. Quand le jeu est hébergé ailleurs (itch.io, Netlify…), il n'y a pas de salon :
// mqRoom(mot, serveur) le remplace. Même interface que le salon pour ce que le jeu utilise (peers, presence, connected), donc netTick ne change pas. Les joueurs tapent le même « mot de salon » ;
// chacun publie son état environ 10 fois par seconde sur un serveur de messages public (MQTT 3.1.1 sur WebSocket, écrit ici à la main : CONNECT, SUBSCRIBE, PUBLISH sans accusé) et écoute celui des autres.
// Ces serveurs sont publics et gratuits, sans garantie : qui connaît le mot peut écouter ou s'inviter. Un joueur muet depuis 5 s est considéré parti. `window.__mq` remplace la liste (tests).
const MQURLS = window.__mq || [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt'
];
function mqRoom(code, srv) {
  const enc = new TextEncoder(),
    dec = new TextDecoder(),
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3),
    base = 'abtest-ile5/' + code + '/',
    mine = {},
    others = {};
  let ws = null,
    ok = false,
    buf = new Uint8Array(0),
    dirty = true,
    lastPub = 0,
    closed = false,
    upd = Date.now(),
    bigD = false,
    lastBig = 0;
  const BIG = { isl: 1 };
  const cat = (...a) => {
      let n = 0;
      for (const x of a) n += x.length;
      const u = new Uint8Array(n);
      let o = 0;
      for (const x of a) {
        u.set(x, o);
        o += x.length;
      }
      return u;
    },
    str = s => {
      const b = enc.encode(s);
      return cat([b.length >> 8, b.length & 255], b);
    },
    pkt = (h, body) => {
      const L = [];
      let n = body.length;
      do {
        let d = n % 128;
        n = Math.floor(n / 128);
        if (n > 0) d |= 128;
        L.push(d);
      } while (n > 0);
      return cat([h], L, body);
    },
    send = u => {
      try {
        if (ws && ws.readyState === 1) ws.send(u);
      } catch (_) {}
    },
    pub = o => send(pkt(0x30, cat(str(base + id), enc.encode(JSON.stringify(o)))));
  function take(w, h, d) {
    const t = h >> 4;
    if (t === 2) {
      if (d[1] === 0) {
        ok = true;
        dirty = true;
        bigD = true;
        send(pkt(0x82, cat([0, 1], str(base + '+'), [0])));
      } else w.close();
    } // CONNACK accepté : on s'abonne aux états de tout le salon
    else if (t === 3) {
      const tl = (d[0] << 8) | d[1],
        topic = dec.decode(d.subarray(2, 2 + tl)),
        from = topic.slice(base.length),
        q = (h >> 1) & 3;
      if (!from || from === id || !topic.startsWith(base)) return;
      try {
        const o = JSON.parse(dec.decode(d.subarray(2 + tl + (q ? 2 : 0))));
        if (o && o.bye) delete others[from];
        else if (o && o.p && typeof o.p === 'object')
          others[from] = { p: o.p, b: others[from] ? others[from].b : null, t: Date.now() };
        else if (o && o.b && typeof o.b === 'object' && others[from]) others[from].b = o.b;
      } catch (_) {}
    }
  }
  function open() {
    if (closed) return;
    ok = false;
    buf = new Uint8Array(0);
    let w;
    try {
      w = new WebSocket(MQURLS[srv % MQURLS.length], 'mqtt');
    } catch (_) {
      setTimeout(open, 2500);
      return;
    }
    ws = w;
    w.binaryType = 'arraybuffer';
    w.onopen = () => send(pkt(0x10, cat(str('MQTT'), [4, 2, 0, 60], str('ab' + id))));
    w.onmessage = e => {
      if (w !== ws || typeof e.data === 'string') return;
      buf = cat(buf, new Uint8Array(e.data));
      for (;;) {
        if (buf.length < 2) return;
        let n = 0,
          m = 1,
          i = 1,
          b;
        do {
          if (i >= buf.length) return;
          if (i > 4) {
            w.close();
            return;
          }
          b = buf[i++];
          n += (b & 127) * m;
          m *= 128;
        } while (b & 128);
        if (buf.length < i + n) return;
        const h = buf[0],
          d = buf.slice(i, i + n);
        buf = buf.slice(i + n);
        take(w, h, d);
      }
    };
    w.onclose = () => {
      if (w !== ws) return;
      ok = false;
      if (!closed) setTimeout(open, 2000);
    };
    w.onerror = () => {};
  }
  open();
  const iv = setInterval(() => {
      if (!ok) return;
      const now = Date.now();
      if (dirty || now - lastPub > 1500) {
        dirty = false;
        lastPub = now;
        const s = {};
        for (const k in mine) if (!BIG[k]) s[k] = mine[k];
        pub({ p: s });
      }
      if (bigD || now - lastBig > 4000) {
        const b = {};
        let n = 0;
        for (const k in mine)
          if (BIG[k]) {
            b[k] = mine[k];
            n++;
          }
        if (n || bigD) pub({ b });
        bigD = false;
        lastBig = now;
      }
    }, 90),
    bye = () => {
      if (ok) pub({ bye: 1 });
    };
  addEventListener('pagehide', bye);
  return {
    code,
    srv,
    connected: () => ok,
    peers: () => {
      const now = Date.now(),
        L = [
          {
            peer: id,
            isMe: true,
            sameTab: true,
            kind: 'viewer',
            guest: false,
            by: null,
            presence: mine,
            updatedAt: upd
          }
        ];
      for (const k in others) {
        if (now - others[k].t > 5000) {
          delete others[k];
          continue;
        }
        L.push({
          peer: k,
          isMe: false,
          sameTab: false,
          kind: 'viewer',
          guest: true,
          by: null,
          presence: others[k].b ? Object.assign({}, others[k].b, others[k].p) : others[k].p,
          updatedAt: others[k].t
        });
      }
      return L;
    },
    presence: p => {
      for (const k in p) {
        if (BIG[k]) bigD = true;
        else dirty = true;
        if (p[k] === null) delete mine[k];
        else mine[k] = p[k];
      }
      upd = Date.now();
      return Promise.resolve();
    },
    close: () => {
      closed = true;
      bye();
      clearInterval(iv);
      removeEventListener('pagehide', bye);
      try {
        if (ws) ws.close();
      } catch (_) {}
    }
  };
}
net.ext = net.why === 'page';
let mqSrvI = 0;
function mqJoin() {
  const c = $('mq2')
    .value.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  $('mq2').value = c;
  $('mq2').blur();
  if (c.length < 3) {
    toast("Choisis un mot de salon d'au moins 3 lettres ou chiffres");
    return;
  }
  try {
    localStorage.setItem('ile5-mq', c);
  } catch (_) {}
  if (net.room) net.room.close();
  net.room = mqRoom(c, mqSrvI);
  net.why = '';
  net.wasPlay = null;
}
// le mot de salon et le serveur se choisissent sur la carte, bouton « Multi » (V11.3)
const mqLab = () => {
  $('mq2Srv').textContent = 'Serveur ' + (mqSrvI + 1);
};
function mqNext() {
  mqSrvI = (mqSrvI + 1) % MQURLS.length;
  try {
    localStorage.setItem('ile5-mqs', String(mqSrvI));
  } catch (_) {}
  mqLab();
  if (net.room) mqJoin();
}
if (net.ext) {
  let c0 = '';
  try {
    c0 = localStorage.getItem('ile5-mq') || '';
    mqSrvI = (+localStorage.getItem('ile5-mqs') || 0) % MQURLS.length;
  } catch (_) {}
  mqLab();
  if (c0) {
    $('mq2').value = c0;
    mqJoin();
  }
}
// à chaque image : la ligne d'état du multi au portail, ma présence dans le salon (« au lobby »), puis le lobby à plusieurs (lobNet)
function netTick(dt) {
  const r = net.room;
  let info =
    net.why === 'wait'
      ? 'Recherche du multi… (10 s au plus)'
      : net.why === 'refus'
        ? 'Multi refusé par Claude pour cette vue (lien public ou compte non admis) : partie solo.'
        : net.why === 'erreur'
          ? 'Multi en erreur au chargement : partie solo. Recharge la page.'
          : net.ext
            ? 'Multi : touche la carte en haut à gauche, puis « Multi », pour choisir un mot de salon.'
            : 'Multi indisponible ici (page ouverte hors de Claude) : partie solo.';
  if (r) {
    let peers = [];
    try {
      peers = r.peers();
    } catch (_) {}
    const play = peers.filter(
      p => p.kind === 'viewer' && p.presence && p.presence.st === 'play' && !(p.isMe && p.sameTab)
    );
    info = !r.connected()
      ? 'Connexion au multi…'
      : play.length
        ? play.length +
          (play.length > 1 ? ' joueurs sont' : ' joueur est') +
          ' en partie. Lance la partie pour rejoindre.'
        : 'Multi prêt : ceux qui ouvrent cette page en même temps que toi jouent sur la même île.';
    if (net.ext)
      info = !r.connected()
        ? 'Connexion au salon « ' +
          r.code +
          ' » (serveur ' +
          (r.srv + 1) +
          ')… Si ça dure, essaie un autre serveur, le même pour tous.'
        : play.length
          ? info
          : 'Salon « ' +
            r.code +
            ' » · serveur ' +
            (r.srv + 1) +
            ' · ' +
            peers.length +
            ' connecté' +
            (peers.length > 1 ? 's' : '') +
            ". Le premier qui lance la partie est l'hôte, les autres le rejoignent.";
    if (net.wasPlay !== false) {
      net.wasPlay = false;
      r.presence({ st: LB.on ? 'lob' : 'menu', hs: 0, s: null, rl: null, a: null, f: 0 }).catch(() => {});
    }
  }
  net.info = info;
  lobNet(dt);
}
