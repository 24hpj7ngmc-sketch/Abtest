// [lobby/boucle.js] La boucle du lobby : se déplacer, tourner, ramasser les récoltes, dessiner (lobbyTick).
// ---- la boucle du lobby
function lobTurn(dx, dy) {
  LB.yaw -= dx * 0.0055;
  LB.pitch = Math.max(-1.3, Math.min(1.3, LB.pitch - dy * 0.0055));
}
// les obstacles pleins au sol, en cercles [x, z, rayon] : les poteaux et arbres fixes, ceux du parvis, les bâtiments (les chemins se traversent) ;
// le Hall, une cathédrale où l'on entre, donne les siens : murs, piliers, socles, autel (cols, calculés à la pose)
function lobCercles() {
  const L = LOBS.slice();
  if (PAY) for (const o of PAY.obs) L.push(o);
  for (const B of save.vil) {
    const C = CAT[B.t];
    if (C.pass) continue;
    if (B.t === 'hall') {
      const g = vilV.get(B.id);
      if (g && g.userData.cols) for (const o of g.userData.cols) L.push(o);
      continue;
    }
    const br = rOf(B);
    L.push([B.x, B.z, Math.max(0.45, br * (br > 2 ? 0.72 : 1))]);
  }
  return L;
}
// distance (au plus tmax) de l'œil à l'obstacle le plus proche dans la direction du regard ; les cercles qui contiennent déjà l'œil ne comptent pas
function lobRayon(cercles, tmax) {
  const c = Math.cos(LB.pitch),
    dx = -Math.sin(LB.yaw) * c,
    dz = -Math.cos(LB.yaw) * c;
  let best = tmax;
  if (c < 0.05) return best;
  for (const o of cercles) {
    const ox = LB.x - o[0],
      oz = LB.z - o[1],
      b = ox * dx + oz * dz,
      q = ox * ox + oz * oz - o[2] * o[2];
    if (q <= 0) continue;
    const d = b * b - q;
    if (d < 0) continue;
    const t = -b - Math.sqrt(d);
    if (t >= 0 && t < best) best = t;
  }
  return best;
}
function lobbyTick(dt, now) {
  const t = now / 1000,
    free = !lobOv();
  // la course, comme dans Dernier Toit : sprint lissé (LB.spk), balancement de la tête (LB.bob), pas, roulis, champ de vision
  LB.spr = false;
  LB.mg = 0;
  // déplacement : mêmes commandes qu'en partie (joystick, sprint à fond, saut) ; on suit le relief
  if (free) {
    const mag = Math.hypot(joy.f, joy.r);
    if (mag > 0.96 && joy.f > 0.5) joy.full += dt;
    else joy.full = 0;
    const dv = !!save.dev,
      fly = flying(),
      hm = LB.hm || (LB.hm = heroMods(tHero)),
      snk = inp.sneak && !fly,
      spr = joy.full > 0.3 && !snk,
      sp =
        (snk ? 4 : spr ? 14.5 * (1 + (hm.hSprint || 0)) * (tHero === 'elec' ? BAL.voltSprint : 1) : 9) *
        (1 + (hm.hSpd || 0)) *
        (dv && ldev.fast ? 3 : 1) *
        (fly ? 2.2 : 1),
      fx = -Math.sin(LB.yaw),
      fz = -Math.cos(LB.yaw),
      rx = Math.cos(LB.yaw),
      rz = -Math.sin(LB.yaw);
    const mx = (fx * joy.f + rx * joy.r) * sp * dt,
      mz = (fz * joy.f + rz * joy.r) * sp * dt,
      cercles = lobCercles(),
      hit = (x, z) => {
        if (fly || (dv && ldev.clip)) return Math.hypot(x, z) > RI + 150;
        if (Math.hypot(x, z) > RI - 1.6) return true;
        for (const o of cercles)
          if (Math.hypot(x - o[0], z - o[1]) < o[2] && Math.hypot(LB.x - o[0], LB.z - o[1]) >= o[2]) return true;
        return false;
      };
    if (!hit(LB.x + mx, LB.z + mz)) {
      LB.x += mx;
      LB.z += mz;
    } else if (!hit(LB.x + mx, LB.z)) LB.x += mx;
    else if (!hit(LB.x, LB.z + mz)) LB.z += mz;
    const gy = Math.hypot(LB.x, LB.z) < RI ? walkAt(LB.x, LB.z, LB.y) : -30;
    if (fly) {
      LB.vy = 0;
      LB.y = Math.max(gy, Math.min(160, LB.y + ((jumpHeld ? 1 : 0) - (sneakHeld ? 1 : 0)) * 16 * dt));
    } else {
      if (jumpQ && LB.y <= gy + 0.05) LB.vy = 9.2 * Math.sqrt(1 + (hm.hJump || 0));
      LB.vy -= 22 * dt;
      LB.y += LB.vy * dt;
      if (LB.y <= gy) {
        LB.y = gy;
        LB.vy = Math.max(0, LB.vy);
      }
    }
    LB.eye += ((snk ? 1.1 : 1.7) - LB.eye) * Math.min(1, dt * 12);
    LB.spr = spr;
    LB.mg = mag;
    if (mag > 0.1 && !fly && LB.y <= gy + 0.05) {
      LB.bob += dt * (spr ? 13 : 9) * mag;
      const pas = Math.floor(LB.bob / Math.PI);
      if (pas !== LB.pas) {
        LB.pas = pas;
        SND.play('step');
      }
    }
    $('joy').classList.toggle('sprint', spr);
  }
  jumpQ = false;
  LB.spk += ((LB.spr ? 1 : 0) - LB.spk) * Math.min(1, dt * 7);
  lcam.aspect = aspect;
  if (lcam.userData.a !== lcam.aspect) {
    lcam.userData.a = lcam.aspect;
    lcam.updateProjectionMatrix();
  }
  // champ de vision : +8° en sprint
  const ft = (lcam.aspect < 1 ? 86 : 72) + 8 * LB.spk;
  if (Math.abs(ft - LB.fov) > 0.05) {
    LB.fov += (ft - LB.fov) * Math.min(1, dt * 14);
    lcam.fov = LB.fov;
    lcam.updateProjectionMatrix();
  }
  lcam.position.set(LB.x, LB.eye + LB.y + Math.sin(LB.bob) * (LB.spr ? 0.06 : 0.035) * Math.min(1, LB.mg), LB.z);
  lcam.rotation.y = LB.yaw;
  lcam.rotation.x = LB.pitch;
  lcam.rotation.z = Math.sin(LB.bob * 0.5) * 0.014 * LB.spk;
  armeFrame(dt);
  lsky.position.copy(lcam.position);
  document.documentElement.classList.toggle('lfly', flying());
  if (!save.dev && !$('lDevP').hidden) $('lDevP').hidden = true;
  $('lBar').classList.toggle('quiet', (LB.tool === 'main' || LB.tool === 'arme') && now - barT > 2600);
  if (now - (LB.mt || 0) >= 120) {
    LB.mt = now;
    lobMini(mg, 208);
  }
  if (!$('mapV').hidden) lobBig();
  // récoltes : le temps fait son œuvre, et on ramasse ce qui est prêt en passant devant le bâtiment (quatre fois par seconde)
  if (now - (LB.hvT || 0) > 250) {
    LB.hvT = now;
    hvGrow();
    if (free && !window.__nohv)
      for (const B of save.vil)
        if (HV[B.t] && Math.hypot(LB.x - B.x, LB.z - B.z) < rOf(B) + 4.2 && myB(B) && hvTake(myB(B))) break;
    hvSync();
  }
  // outils
  let near = null,
    nd = 1e9;
  LB.takeB = null;
  const see = (o, x, z, r) => {
    const d = Math.hypot(LB.x - x, LB.z - z);
    if (d < r && d / r < nd) {
      nd = d / r;
      near = o;
    }
  };
  if (LB.tool === 'main') {
    if (GUIDE.g && !GUIDE.tp) see({ k: 'guide', id: 'guide' }, GUIDE.x, GUIDE.z, 4.4);
    for (const G of LGAMES) see({ k: 'portal', G, id: G.id }, G.x, G.z, 7.5);
    for (const B of save.vil) {
      const C = CAT[B.t],
        u = B.t === 'hall' && vilV.get(B.id) && vilV.get(B.id).userData;
      // au Hall : la porte ouvre le panneau, comme avant ; dedans, chaque héros exposé se regarde de l'allée (Action ouvre le panneau sur lui)
      if (u && u.porte) {
        const q = vilMonde(B, u.porte[0], u.porte[1]);
        see({ k: C.act, id: B.t + lvOf(B), B }, q[0], q[1], 4.4);
        for (const H of u.heroes) {
          const a = vilMonde(B, H.x - Math.sign(H.x) * 1.6, H.z);
          see({ k: 'heros', e: H.el, id: 'heros' + H.el, B }, a[0], a[1], 2.3);
        }
      } else if (C.act) see({ k: C.act, id: B.t + lvOf(B), B }, B.x, B.z, rOf(B) + 3.6);
    }
  } else if (LB.tool === 'marteau') {
    lobAim();
    for (const B of save.vil) {
      const d = Math.hypot(LB.tx - B.x, LB.tz - B.z);
      if (d < rOf(B) + 1.2 && d < nd) {
        nd = d;
        LB.takeB = B;
      }
    }
    nd = 1e9;
    LB.why = free ? vilWhy(LB.item, LB.tx, LB.tz) : '';
  } else {
    lobAim();
    LB.why = '';
  }
  const gOn = free && LB.tool === 'marteau' && !(LB.takeB && CAT[LB.item].u && hasB(LB.item));
  lGhost.visible = gOn;
  if (gOn) {
    lGhostSet(LB.item);
    lGhost.position.set(LB.tx, hAt(LB.tx, LB.tz), LB.tz);
    lGhost.rotation.y = LB.yaw + LB.rot;
    lGhostM.color.setHex(LB.why ? 0xff6b5a : 0x7cf07a);
  }
  if (LB.hold) {
    if (!free || LB.tool !== 'pelle') LB.hold = false;
    else if (
      LB.last &&
      Math.hypot(LB.tx - LB.last[0], LB.tz - LB.last[1]) >= 4.4 &&
      !lobLineWhy(LB.tx, LB.tz, LB.tx, LB.tz)
    ) {
      lobLine(LB.tx, LB.tz, LB.tx, LB.tz, LB.mode, LB.flatH);
      LB.last = [LB.tx, LB.tz];
    }
  }
  {
    const on = free && LB.tool === 'pelle',
      col = LB.why ? 0xff6b5a : LB.mode === 'down' ? 0x6fc8ff : LB.mode === 'flat' ? 0xffffff : 0xffcf5a;
    lRing.visible = on;
    lRingA.visible = lBar3.visible = on && !!LB.a;
    if (on) {
      lRing.material.color.setHex(col);
      const ty = hAt(LB.tx, LB.tz) + 0.25;
      lRing.position.set(LB.tx, ty, LB.tz);
      if (LB.a) {
        const ay = hAt(LB.a[0], LB.a[1]) + 0.25,
          dx = LB.tx - LB.a[0],
          dz = LB.tz - LB.a[1],
          l = Math.hypot(dx, dz);
        lRingA.position.set(LB.a[0], ay, LB.a[1]);
        lBar3.position.set((LB.a[0] + LB.tx) / 2, (ay + ty) / 2 + 0.15, (LB.a[1] + LB.tz) / 2);
        lBar3.rotation.set(0, Math.atan2(-dz, dx), Math.atan2(ty - ay, Math.max(0.01, l)));
        lBar3.scale.set(Math.max(0.2, Math.hypot(l, ty - ay)), 1, 1);
      }
    }
  }
  LB.near = near;
  const sig =
    LB.tool +
    '|' +
    (near ? near.id : '') +
    '|' +
    free +
    '|' +
    tHero +
    '|' +
    save.gold +
    '|' +
    lootN() +
    '|' +
    LB.item +
    '|' +
    LB.why +
    '|' +
    LB.mode +
    '|' +
    (LB.a ? 1 : 0) +
    '|' +
    (LB.takeB ? LB.takeB.id : '') +
    (near && near.e ? elH(near.e) : '') +
    '|' +
    save.vil.length +
    '|' +
    tWeap +
    wLevel(tWeap) +
    wEl(tWeap) +
    (LA.ins >= 0 ? 'i' : '') +
    '|' +
    (save.evo || 1) +
    '|' +
    save.q.map(q => q.p).join() +
    '|' +
    ((save.hv.s.verger || 0) >= 1);
  // les boutons ne sont jamais cachés puis remontrés d'un coup : sur téléphone, cela couperait l'appui en cours (pose à la chaîne)
  if (sig !== LB.sig) {
    LB.sig = sig;
    let t1 = '',
      t2 = '',
      t3 = '',
      alt = false,
      poor = false,
      w = 'Action'; // w : le mot du bouton Action ; t1 : son étiquette ; t2, t3 : le bouton libre
    if (free) {
      if (LB.tool === 'marteau') {
        const C = CAT[LB.item];
        t1 = LB.why || 'Poser ' + C.n + (C.c && !save.dev ? ' · ' + C.c + ' or' : '');
        poor = !!LB.why;
        t2 = 'Tourner';
        if (LB.takeB) t3 = 'Ranger ' + CAT[LB.takeB.t].n + (LB.takeB.c ? ' · +' + LB.takeB.c + ' or' : '');
        w = 'Poser';
      } else if (LB.tool === 'pelle') {
        t1 = LMODES[LB.mode];
        w = t1;
      } else if (LB.tool === 'arme') {
        t1 = WT[tWeap].short + ' · ' + EL[wEl(tWeap)].n;
        w = 'Montrer';
      } else if (near) {
        w =
          near.k === 'guide'
            ? 'Parler'
            : near.k === 'portal' || near.k === 'maison'
              ? 'Entrer'
              : near.k === 'heros'
                ? 'Voir'
                : 'Ouvrir';
        t1 =
          near.k === 'heros'
            ? EL[near.e].hero +
              ' · ' +
              ROLE[near.e] +
              ' · ' +
              EL[elH(near.e)].n +
              (near.e === tHero ? ' · incarné' : '')
            : near.k === 'guide'
              ? GD
                ? 'Le Guide · la visite continue'
                : 'Le Guide · pose-lui une question'
              : near.k === 'portal'
                ? near.G.open
                  ? 'Entrer · ' + near.G.t
                  : 'Portail scellé'
                : near.k === 'hall'
                  ? 'Hall des héros · ' + EL[tHero].hero
                  : near.k === 'armes'
                    ? "Salle d'armes · " + WT[tWeap].title.toLowerCase() + ' niv. ' + wLevel(tWeap)
                    : near.k === 'musee'
                      ? 'Musée · ' + lootN() + ' / ' + LOOT.length
                      : near.k === 'shop'
                        ? 'Marchand · ' + save.gold + ' or'
                        : near.k === 'mine'
                          ? "Mine d'étoiles · +" + mineG() + ' or par partie'
                          : near.k === 'taverne'
                            ? 'Taverne · ' + save.q.filter(q => q.p >= q.n).length + ' défi(s) à réclamer'
                            : near.k === 'verger'
                              ? 'Verger céleste · provisions ' +
                                ((save.hv.s.verger || 0) >= 1 ? 'prêtes' : 'en préparation')
                              : 'Entrer chez toi';
        alt = near.k === 'portal' && !near.G.open;
        if (near.B && CAT[near.B.t].up && near.k !== 'mine' && near.k !== 'verger' && near.k !== 'heros')
          t2 = lvOf(near.B) < (CAT[near.B.t].mx || 3) ? 'Améliorer · niv. ' + (lvOf(near.B) + 1) : 'Niveau maximum';
      }
    }
    // marteau : le bouton libre range le bâtiment visé s'il y en a un, sinon il tourne celui qu'on pose
    LB.fk = t3 ? 3 : 2;
    const ft = t3 || t2,
      fw = !ft ? '' : t3 ? 'Ranger' : ft === 'Tourner' ? ft : ft.startsWith('Améliorer') ? 'Améliorer' : 'Niv. max';
    padSet(
      w,
      '',
      !t1 ? 'idle' : poor || alt ? 'poor' : 'go',
      fw,
      '',
      false,
      LB.tool === 'pelle' ? '' : t1,
      ft === 'Tourner' ? '' : ft,
      poor
    );
  }
  guideTick(dt, t);
  // vie du lieu
  if (TERQ > 0 && (TERQ -= Math.max(0, dt)) <= 0) {
    TERQ = 0;
    terraPlan();
    terrDraw();
    terrLocks();
    vilGround();
  }
  payTick(dt, t);
  lskyU.t.value = t;
  lcldU.t.value = t;
  for (const g of llive) K.pose(g, t, 0, 1);
  for (const g of vilV.values()) {
    const u = g.userData;
    if (u.hv && u.hv.visible) u.hv.position.y = u.hvY + Math.sin(t * 2.4 + g.position.x) * 0.18;
    if (u.live) K.pose(u.m, t, 0, 1);
    if (u.npc) K.pose(u.npc, t, 0, 1);
    if (u.pop !== undefined) {
      u.pop = Math.min(1, u.pop + dt * 3.2);
      const q = u.pop - 1;
      g.scale.setScalar(Math.max(0.05, 1 + 2.70158 * q * q * q + 1.70158 * q * q));
      if (u.pop >= 1) {
        g.scale.setScalar(1);
        u.pop = undefined;
      }
    }
    // au Hall, les héros exposés ne bougent pas (figures de cire ; seule la magie de leurs mains tourne) ; celui qu'on incarne a la lumière la plus forte.
    // De loin (plus de 60 m), l'intérieur n'est pas dessiné.
    if (u.heroes) {
      const vu = Math.hypot(LB.x - g.position.x, LB.z - g.position.z) < 60;
      for (const H of u.heroes) {
        const me = H.el === tHero;
        H.av.visible = H.beam.visible = H.glow.visible = H.pl.visible = vu;
        if (!vu) continue;
        if (H.ee !== elH(H.el)) hallAv(H);
        H.w += ((me ? 1 : 0) - H.w) * Math.min(1, dt * 5);
        K.pose(H.av, t, H.x, 0);
        H.beam.material.opacity = 0.09 + 0.2 * H.w + 0.02 * Math.sin(t * 2 + H.z);
        H.glow.scale.setScalar(2.2 + 1.8 * H.w + Math.sin(t * 2.2 + H.z) * 0.12);
        H.glow.material.opacity = 0.25 + 0.4 * H.w;
      }
    }
    if (u.loot)
      for (const V of u.loot)
        if (V.it.visible) {
          V.it.position.y = V.y + 0.1 + Math.sin(t * 1.4 + V.it.position.x) * 0.05;
          V.it.rotation.y += dt * 0.5;
        }
  }
  for (const G of LGAMES) {
    G.u.t.value = t;
    if (G.gl) G.gl.scale.setScalar(7.5 + Math.sin(t * 2.4) * 0.7);
  }
  for (const I of lIsles) {
    I.g.position.y = I.y + Math.sin(t * 0.35 + I.ph) * 1.6;
    I.g.rotation.y += dt * 0.02;
  }
  {
    const im = lmotes.im;
    for (let i = 0; i < lmotes.n; i++) {
      const b = lmotes.b[i];
      DUM.position.set(
        LB.x + b[0] + Math.sin(t * 0.3 + b[3]) * 1.5,
        LB.y + ((b[1] + t * 0.5 * b[4]) % 14) + 0.3 - 2,
        LB.z + b[2] + Math.cos(t * 0.25 + b[3]) * 1.5
      );
      DUM.rotation.set(t * b[4], t * 0.7, 0);
      DUM.scale.setScalar(b[4] * (0.6 + 0.4 * Math.sin(t * 2 + b[3] * 3)));
      DUM.updateMatrix();
      im.setMatrixAt(i, DUM.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }
  lShootT -= dt;
  if (lShootT <= 0) {
    lShootT = 3 + Math.random() * 6;
    const S = lShoot.find(s => s.t <= 0);
    if (S) {
      const a = Math.random() * 6.28,
        r = 260,
        dir = a + 2 + Math.random();
      S.p = [Math.cos(a) * r, 150 + Math.random() * 120, Math.sin(a) * r];
      S.v = [Math.cos(dir) * 170, -55 - Math.random() * 40, Math.sin(dir) * 170];
      S.T = S.t = 0.9 + Math.random() * 0.6;
      S.m.visible = true;
    }
  }
  for (const S of lShoot)
    if (S.t > 0) {
      S.t -= dt;
      const u = 1 - S.t / S.T;
      S.m.position.set(S.p[0] + S.v[0] * u * S.T, S.p[1] + S.v[1] * u * S.T, S.p[2] + S.v[2] * u * S.T);
      S.m.material.opacity = Math.sin(u * 3.1416) * 0.9;
      const cy = Math.cos(LB.yaw),
        sy = Math.sin(LB.yaw),
        sx = S.v[0] * cy - S.v[2] * sy;
      S.m.material.rotation = Math.atan2(S.v[1], sx);
      if (S.t <= 0) S.m.visible = false;
    }
  if (toastT > 0) {
    toastT -= dt;
    if (toastT <= 0) $('toast').classList.remove('on');
  }
  if (!window.__norender) renderer.render(lob, lcam);
  window.__lframes = (window.__lframes || 0) + 1;
}
