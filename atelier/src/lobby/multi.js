// [lobby/multi.js] Le lobby à plusieurs : tous ceux du salon sur l'île de l'hôte (islVisit, islHome), les autres joueurs affichés, le bouton Rejoindre (lobNet).
// ---- LE LOBBY À PLUSIEURS (V10.5, demande de Frédéric : « le multi partout, même dans le lobby ; chacun spawn dans le même lobby ») ----
// Tous ceux du même salon (le salon de la page dans Claude, le « mot de salon » ailleurs) sont sur la même île : celle du plus ancien du salon, l'hôte.
// L'hôte publie son île (évolution, village, relief) ; les autres la chargent à la place de la leur le temps de la visite (islVisit), sans jamais l'écrire dans leur sauvegarde
// (persist et terrSave s'en gardent ; VISIT.mine garde leur village). En visite on se promène, on ouvre les bâtiments (hall, armes, marchand… : c'est sa propre progression qu'on y voit),
// on passe les portails ; on ne bâtit pas, on ne creuse pas, on n'améliore rien. Chacun publie sa position dix fois par seconde ; les autres sont dessinés avec le modèle de leur héros.
// Quand quelqu'un du salon est en partie sur L'Île des Cinq, un bouton « Rejoindre » apparaît en haut de l'écran des autres : on passe le portail en groupe.
// L'hôte s'en va : le plus ancien qui reste devient l'hôte, et tout le monde se retrouve chez lui. Seul dans le salon : on est chez soi.
// Dernier Toit (V4.4, recollé en V10.6) se joue à plusieurs : le même bouton sert à rejoindre ceux qui sont sur le toit ; le relais est plus bas (toitEtat, toitNet).
const LN = {
  ls: 0,
  t0: 0,
  room: null,
  pubT: 0,
  pubS: '',
  pubF: 0,
  islT: 9,
  islStr: '',
  sig: '',
  av: {},
  n: 1,
  list: [],
  host: '',
  me: '',
  drawT: 0,
  up: false,
  nm: '',
  tnT: 0
};
try {
  LN.nm = nmClean(localStorage.getItem('ile5-nom') || '');
} catch (_) {}
// un nom reçu du salon n'est jamais de confiance : lettres, chiffres, espace, tiret, 12 au plus (il part dans du HTML)
function nmClean(s) {
  return String(s == null ? '' : s)
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .slice(0, 12);
}
const npub = o => {
  const r = net.room;
  if (!r) return;
  try {
    const q = r.presence(o);
    if (q && q.catch) q.catch(() => {});
  } catch (_) {}
};
const VISITNO = "En visite : sur l'île de ton hôte, on ne bâtit pas et on n'améliore rien";
const rle = s => {
    let o = '',
      i = 0;
    while (i < s.length) {
      let j = i + 1;
      while (j < s.length && s[j] === s[i]) j++;
      o += s[i] + (j - i > 1 ? j - i : '');
      i = j;
    }
    return o;
  },
  unrle = s => {
    let o = '';
    const re = /(\D)(\d*)/g;
    let m;
    while ((m = re.exec(s)) && o.length <= NV) o += m[1].repeat(Math.min(NV, m[2] ? +m[2] : 1));
    return o;
  },
  hsh32 = s => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  };
// l'île en peu d'octets : évolution, village (type, place, sens, niveau, élément), relief sculpté (rien s'il est intact)
function islPack() {
  const t = typeof save.terr === 'string' && save.terr.length === NV && !/^M+$/.test(save.terr) ? rle(save.terr) : '';
  return {
    e: Math.max(1, Math.min(6, save.evo || 1)),
    v: save.vil.map(B => [B.t, B.x, B.z, B.r, lvOf(B), B.el || '']),
    t
  };
}
// remplace l'île affichée : village, relief, taille. `terr` : le relief sous sa forme de sauvegarde (une lettre par sommet), ou rien pour un relief intact.
function islApply(vil, terr, evo) {
  for (const g of vilV.values()) lob.remove(g);
  vilV.clear();
  hallV = museeV = null;
  LWALK.length = 0;
  lGhost.visible = false;
  LB.takeB = null;
  LB.near = null;
  LB.a = null;
  save.vil = vil;
  save.evo = evo;
  TH.fill(0);
  if (typeof terr === 'string' && terr.length === NV)
    for (let i = 0; i < NV; i++) TH[i] = Math.max(TMIN, Math.min(TMAX, (terr.charCodeAt(i) - 77) / 4));
  MHc = mountH();
  VILOK = false;
  for (const B of save.vil) vilAdd(B);
  VILOK = true;
  terrSetR(ILR[evo - 1]);
  terraPlan();
  terrDraw();
  terrLocks();
  vilGround();
  TERQ = 0;
  if (GUIDE.g) {
    const p = guideHome();
    GUIDE.x = p[0];
    GUIDE.z = p[1];
    GUIDE.tp = null;
  }
  LB.hm = null;
  LB.sig = '';
  lobSync();
}
function islVisit(peer, isl, who) {
  const v = [];
  for (const q of (Array.isArray(isl.v) ? isl.v : []).slice(0, VMAX)) {
    if (
      !Array.isArray(q) ||
      typeof q[0] !== 'string' ||
      !Object.prototype.hasOwnProperty.call(CAT, q[0]) ||
      ![q[1], q[2], q[3]].every(Number.isFinite) ||
      Math.hypot(q[1], q[2]) > ILR[5]
    )
      continue;
    const C = CAT[q[0]],
      B = {
        t: q[0],
        x: Math.round(q[1] * 100) / 100,
        z: Math.round(q[2] * 100) / 100,
        r: Math.round((q[3] % 6.2832) * 100) / 100
      };
    if (C.up) B.l = Math.max(1, Math.min(C.mx || 3, Math.round(+q[4]) || 1));
    if (C.el && HEROS.includes(q[5])) B.el = q[5];
    v.push(B);
  }
  const first = !VISIT.on || VISIT.peer !== peer;
  if (!VISIT.on) {
    if (LB.dirty) {
      terrSave();
      persist();
      LB.dirty = 0;
    }
    if (GD) {
      GD = null;
      $('gBub').hidden = true;
      if (GUIDE.pil) GUIDE.pil.visible = false;
    }
    for (const id of ['upV', 'lDevP', 'homeV']) $(id).hidden = true;
    VISIT.mine = { vil: save.vil, evo: save.evo };
    VISIT.on = true;
  }
  VISIT.peer = peer;
  if (LB.tool !== 'main' && LB.tool !== 'arme') {
    LB.tool = 'main';
    LB.a = null;
    lobBar();
  }
  try {
    islApply(
      v,
      typeof isl.t === 'string' && isl.t ? unrle(isl.t) : '',
      Math.max(1, Math.min(6, Math.round(+isl.e) || 1))
    );
  } catch (e) {
    console.error(e);
    islHome("L'île de ton hôte n'a pas pu être chargée : tu restes chez toi");
    return;
  }
  if (first) {
    lobSpawn();
    toast("Tu arrives sur l'île de " + who);
    toastT = 4;
    SND.play('pure');
  } else if (Math.hypot(LB.x, LB.z) > RI - 2) lobSpawn();
  else LB.y = Math.max(LB.y, walkAt(LB.x, LB.z, 1e9));
}
function islHome(why) {
  if (!VISIT.on) return;
  const m = VISIT.mine;
  VISIT.on = false;
  VISIT.mine = null;
  VISIT.peer = '';
  islApply(m.vil, save.terr, Math.max(1, Math.min(6, m.evo || 1)));
  ilCheck();
  lobSpawn();
  if (why) {
    toast(why);
    toastT = 4;
  }
}
// aw : l'arme qu'il tient (armeNet) ou rien. Avec une arme : le gardien sans son pistolet à cristal, l'arme de son élément devant l'épaule droite, les bras qui la tiennent
// el = la clé du héros (le modèle), ee = son élément choisi (la palette, V12.9)
function avMake(el, ee, aw) {
  const g = new THREE.Group(),
    m = mdlOf(aw ? 'hero.avatar.arme' : 'hero.avatar', avCtx(el, ee), avKey(el, ee), { cast: false }),
    pr = m.userData.prep,
    l = lobLabel(3.3, 1.1);
  let vis = null,
    gun = null;
  if (aw) {
    const N = m.userData.nodes;
    N.armL.rotation.order = N.armR.rotation.order = 'YXZ';
    vis = new THREE.Group();
    vis.position.set(0.12, 1.4, 0);
    gun = armeInst(aw.a, aw.el, ee).g;
    gun.scale.setScalar(0.9);
    gun.position.set(0.07, -0.06, -0.42);
    vis.add(gun);
    m.add(vis);
  }
  g.add(m);
  l.position.y = (pr.labelY || (pr.max ? pr.max[1] * (pr.scale || 1) : 2)) + 0.95;
  g.add(l);
  lob.add(g);
  return {
    g,
    m,
    l,
    el,
    ee,
    aw: aw ? aw.k : '',
    vis,
    gun,
    ix: 0,
    exT: -1,
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    tx: 0,
    ty: 0,
    tz: 0,
    tyaw: 0,
    w: 0
  };
}
function lobNetSt(st, x) {
  npub(Object.assign({ st }, x || {}));
  LN.pubS = '';
}
const netWho = p => {
  const pr = (p && p.presence) || {},
    e = HEROS.includes(pr.el) ? pr.el : null;
  return nmClean(pr.nm) || (e ? EL[e].hero : 'un joueur');
};
function netLine() {
  const r = net.room;
  return !r
    ? net.ext
      ? 'pas de salon'
      : 'indisponible ici'
    : !LN.up
      ? 'connexion…'
      : LN.n < 2
        ? 'salon ouvert · seul'
        : LN.n + ' joueurs · ' + (VISIT.on ? 'en visite' : 'chez toi');
}
function netOpen() {
  for (const id of LPAN) $(id).hidden = true;
  $('netV').hidden = false;
  $('netName').value = LN.nm;
  $('netMq').hidden = !net.ext;
  SND.play('tick');
  netDraw();
}
function netDraw() {
  const r = net.room;
  $('netP').textContent = !r
    ? net.ext
      ? 'Tapez tous le même mot de salon, puis « Rejoindre ». Le premier arrivé accueille les autres sur son île ; ensuite vous passez les portails ensemble.'
      : net.why === 'wait'
        ? 'Recherche du multi…'
        : "Le multi n'est pas disponible sur cette page."
    : !LN.up
      ? 'Connexion au salon' +
        (r.code ? ' « ' + r.code + ' »' : '') +
        '… Si ça dure, essayez un autre serveur, le même pour tous.'
      : (r.code ? 'Salon « ' + r.code + ' ». ' : '') +
        (LN.n < 2
          ? "Tu es seul pour l'instant : les autres te rejoindront sur ton île."
          : VISIT.on
            ? 'Tu es en visite : on se promène, on ouvre les bâtiments, on passe les portails ; on ne bâtit que chez soi.'
            : 'Tout le monde est sur ton île.');
  $('mq2Out').hidden = !r;
  $('netL').innerHTML =
    !r || !LN.up
      ? ''
      : LN.list
          .map(
            o =>
              `<div class="srow"><span><b style="color:${elc(o.ee || o.el)}">${o.nm ? o.nm + ' · ' : ''}${EL[o.el].hero}${o.me ? ' · toi' : ''}</b><small>${(o.host ? 'hôte · ' : '') + (o.st === 'play' ? "en partie sur L'Île des Cinq" : o.st === 'toit' ? 'sur le toit, dans Dernier Toit' : o.here ? "sur l'île" : 'arrive…')}</small></span></div>`
          )
          .join('');
}
$('netX').onclick = () => {
  $('netV').hidden = true;
};
$('netName').addEventListener('input', () => {
  LN.nm = nmClean($('netName').value);
  try {
    localStorage.setItem('ile5-nom', LN.nm);
  } catch (_) {}
  LN.pubS = '';
});
$('netName').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('netName').blur();
});
$('mq2Go').onclick = () => {
  mqJoin();
  netDraw();
};
$('mq2').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('mq2Go').click();
});
$('mq2Srv').onclick = () => {
  mqNext();
  netDraw();
};
$('mq2Out').onclick = () => {
  if (net.room && net.ext) {
    net.room.close();
    net.room = null;
    net.wasPlay = null;
    try {
      localStorage.removeItem('ile5-mq');
    } catch (_) {}
    toast('Tu as quitté le salon');
  }
  netDraw();
};
$('lGrp').addEventListener('pointerdown', e => {
  e.preventDefault();
  lGuard = performance.now() + 450;
  if (LB.on && !lobOv()) {
    if (LN.grp === 'toit') toitGo(tHero);
    else ileGo(tHero);
  }
});
// appelée à chaque image par netTick, au lobby comme en partie
function lobNet(dt) {
  const r = net.room,
    now = performance.now();
  let peers = [];
  if (r) {
    try {
      peers = r.peers() || [];
    } catch (_) {}
  }
  const up = !!r && (typeof r.connected !== 'function' || !!r.connected());
  if (LN.room !== r) {
    LN.room = r;
    LN.ls = 0;
    LN.t0 = 0;
    LN.islStr = '';
    LN.pubS = '';
    LN.blind = false;
  }
  LN.up = up;
  const me = peers.find(p => p.isMe && p.sameTab),
    oth = up
      ? peers.filter(
          p =>
            !(p.isMe && p.sameTab) &&
            p.kind === 'viewer' &&
            p.presence &&
            typeof p.presence === 'object' &&
            typeof p.presence.st === 'string'
        )
      : [],
    okLs = v => v > 0 && v < Date.now() + 864e5;
  // mon rang d'arrivée : fixé 1,8 s après la connexion, toujours après ceux qui étaient déjà là (les horloges des téléphones ne sont pas d'accord entre elles)
  // Fixé sans avoir entendu personne (« à l'aveugle »), il se replace une fois derrière un joueur qui se montre dans les 7 s et qui est là depuis plus longtemps que moi (durée `la`, qui ne dépend pas des horloges).
  if (up) {
    if (!LN.t0) LN.t0 = now;
    let mx = 0,
      old = 0;
    const age = LN.ls ? (now - LN.lsT) / 1000 : 0;
    for (const p of oth) {
      const v = +p.presence.ls;
      if (!okLs(v)) continue;
      if (v > mx) mx = v;
      if ((+p.presence.la || 0) > age + 2 && v > old) old = v;
    }
    if (!LN.ls && now - LN.t0 > 3000) {
      LN.ls = Math.max(Date.now(), mx + 1);
      LN.lsT = now;
      LN.blind = !mx;
    } else if (LN.ls && LN.blind && old && now - LN.t0 < 7000) {
      LN.blind = false;
      LN.ls = Math.max(LN.ls, old + 1);
    }
  }
  let host = null;
  for (const p of oth) {
    const v = +p.presence.ls;
    if (!okLs(v)) continue;
    if (!host || v < +host.presence.ls || (v === +host.presence.ls && p.peer < host.peer)) host = p;
  }
  const mineFirst =
    !host || (LN.ls > 0 && (LN.ls < +host.presence.ls || (LN.ls === +host.presence.ls && !!me && me.peer < host.peer)));
  LN.me = me ? me.peer : '';
  if (oth.length > LN.n - 1 && LN.isl && LN.islStr) npub({ isl: LN.isl });
  LN.n = oth.length + 1;
  LN.host = mineFirst ? LN.me : host.peer;
  if (LB.on) {
    if (mineFirst) {
      if (VISIT.on) {
        islHome(LN.n > 1 ? 'Ton hôte est parti : tout le monde arrive sur ton île' : 'Te revoilà sur ton île');
        LN.sig = '';
      }
    } else {
      const isl = host.presence.isl;
      if (isl && typeof isl === 'object') {
        const sig = host.peer + '|' + isl.g;
        if (sig !== LN.sig) {
          LN.sig = sig;
          try {
            islVisit(host.peer, isl, netWho(host));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    if (VISIT.on && !$('lDevP').hidden) $('lDevP').hidden = true;
  }
  // l'hôte publie son île : quand elle change (au plus toutes les 2 s) ; les autres retirent la leur
  if (r && up) {
    LN.islT += dt;
    if (mineFirst && LN.ls > 0 && !VISIT.on && oth.length) {
      if (LN.islT > 2) {
        LN.islT = 0;
        const I = islPack(),
          cap = net.ext ? 24000 : 2800;
        let s = JSON.stringify(I);
        if (s.length > cap) {
          I.t = '';
          s = JSON.stringify(I);
        }
        if (s.length > cap) {
          I.v = I.v.filter(q => CAT[q[0]].up);
          s = JSON.stringify(I);
        }
        if (s !== LN.islStr) {
          LN.islStr = s;
          I.g = hsh32(s);
          LN.isl = I;
          npub({ isl: I });
        }
      }
    } else if (LN.islStr) {
      LN.islStr = '';
      LN.isl = null;
      npub({ isl: null });
    }
  }
  // ma place sur l'île, dix fois par seconde quand elle change (et une fois par seconde de toute façon)
  if (r && up && LB.on) {
    LN.pubT += dt;
    LN.pubF += dt;
    if (LN.pubT > 0.1) {
      LN.pubT = 0;
      const io = VISIT.on ? VISIT.peer : LN.me,
        lp = [r1(LB.x), r1(LB.y), r1(LB.z), Math.round(LB.yaw * 100) / 100],
        aw = armePub(),
        ix = aw && LA.ins >= 0 ? 1 : 0,
        s = lp.join() + tHero + elH(tHero) + io + LN.ls + LN.nm + aw + ix;
      if (s !== LN.pubS || LN.pubF > 1) {
        LN.pubS = s;
        LN.pubF = 0;
        npub({
          st: 'lob',
          ls: LN.ls,
          la: LN.ls ? Math.round((now - LN.lsT) / 1000) : 0,
          el: tHero,
          // l'élément choisi du héros : un champ court, vérifié à la réception
          ee: elH(tHero),
          lp,
          io,
          nm: LN.nm,
          tt: null,
          dn: null,
          aw,
          ix
        });
      }
    }
  }
  // les autres joueurs, sur la même île que moi
  const here = {},
    isle = VISIT.on ? VISIT.peer : LN.me,
    t = now / 1000;
  LN.list = [{ me: 1, nm: LN.nm, el: tHero, ee: elH(tHero), st: IR ? 'play' : 'lob', here: 1, host: mineFirst }];
  for (const p of oth) {
    const pr = p.presence,
      el = HEROS.includes(pr.el) ? pr.el : 'feu',
      ee = HEROS.includes(pr.ee) ? pr.ee : el,
      q = pr.lp,
      on =
        pr.st === 'lob' &&
        !!isle &&
        pr.io === isle &&
        Array.isArray(q) &&
        q.length >= 4 &&
        q.slice(0, 4).every(Number.isFinite);
    const nm = nmClean(pr.nm);
    LN.list.push({ nm, el, ee, st: pr.st, here: on, host: !mineFirst && p === host });
    if (!on || !LB.on) continue;
    here[p.peer] = 1;
    let o = LN.av[p.peer];
    // l'arme qu'il tient (absente chez un téléphone plus ancien : rien)
    const aw = armeNet(pr.aw);
    if (!o || o.el !== el || o.ee !== ee || o.aw !== (aw ? aw.k : '')) {
      const old = o;
      if (o) lob.remove(o.g);
      else if (now - LN.t0 > 4000) {
        toast((nm || EL[el].hero) + " arrive sur l'île");
        toastT = 3;
      }
      o = LN.av[p.peer] = avMake(el, ee, aw);
      o.x = old ? old.x : q[0];
      o.y = old ? old.y : q[1];
      o.z = old ? old.z : q[2];
      o.yaw = old ? old.yaw : q[3];
      if (old) o.w = old.w;
    }
    lobText(
      o.l,
      (nm || EL[el].hero).toUpperCase(),
      (nm ? EL[el].hero + ' · ' : '') + (p.peer === LN.host ? 'hôte' : 'en visite'),
      elc(ee)
    );
    const k = Math.min(1, dt * 10),
      px = o.x,
      pz = o.z;
    o.x += (q[0] - o.x) * k;
    o.y += (q[1] - o.y) * k;
    o.z += (q[2] - o.z) * k;
    const dy = q[3] - o.yaw;
    o.yaw += Math.atan2(Math.sin(dy), Math.cos(dy)) * k;
    const sp = Math.hypot(o.x - px, o.z - pz) / Math.max(dt, 0.001);
    o.w += ((sp > 0.5 ? 1 : 0.12) - o.w) * Math.min(1, dt * 8);
    K.pose(o.m, t, o.x * 0.3 + o.z * 0.3, o.w);
    if (o.vis) {
      // les bras tiennent l'arme ; quand il la montre (ix), elle se lève et pivote comme chez lui
      const ix = pr.ix === 1 ? 1 : 0;
      if (ix && !o.ix) o.exT = 0;
      o.ix = ix;
      if (o.exT >= 0) {
        o.exT += dt;
        if (o.exT >= INSPECT) o.exT = -1;
      }
      const ev = armeEnv(o.exT / INSPECT),
        N = o.m.userData.nodes;
      N.armR.rotation.set(1.39 + 0.25 * ev, 0.25, 0);
      N.armL.rotation.set(1.45 + 0.25 * ev, -0.62 + 0.3 * ev, 0);
      o.vis.rotation.x = 0.25 * ev;
      o.gun.rotation.y = 1.1 * ev;
      o.gun.position.x = 0.07 - 0.1 * ev;
    }
    o.g.position.set(o.x, o.y + Math.abs(Math.sin(t * 6 + o.x * 0.3 + o.z * 0.3)) * 0.05 * o.w, o.z);
    o.g.rotation.y = o.yaw;
  }
  for (const k in LN.av)
    if (!here[k]) {
      lob.remove(LN.av[k].g);
      delete LN.av[k];
    }
  // passer le portail en groupe : quelqu'un du salon est en partie → un bouton pour le rejoindre avec son héros du moment
  if (LB.on) {
    const pi = oth.filter(p => p.presence.st === 'play'),
      pt = oth.filter(p => p.presence.st === 'toit'),
      toit = pt.length > pi.length,
      pl = toit ? pt : pi,
      b = $('lGrp'),
      show = pl.length > 0 && !lobOv();
    if (b.hidden === show) b.hidden = !show;
    LN.grp = toit ? 'toit' : 'ile';
    if (show)
      setTxt(
        'lGrp',
        '',
        (pl.length > 1 ? pl.length + ' joueurs sont' : netWho(pl[0]) + ' est') +
          (toit ? ' sur le toit' : ' en partie') +
          ' · Rejoindre avec ' +
          EL[tHero].hero
      );
    if (!$('netV').hidden && now - LN.drawT > 500) {
      LN.drawT = now;
      netDraw();
    }
  } else if (!$('lGrp').hidden) $('lGrp').hidden = true;
}
