// [interface/boucle.js] La boucle de la page : resize, frame() (une image : entrées, règles, affichage, HUD), démarrage.
// ---------- boucle ----------
function resize() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    pr = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
let last = performance.now(),
  bob = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
  last = now;
  if (slowT > 0) {
    slowT -= dt;
    if (net.n < 2 && !calm) dt *= 0.3;
  } // ralenti sur les grands moments (boss vaincu, ultime), en solo seulement
  resize();
  worldTick(dt, now);
  armTick(dt); // éclairs, ricochets et explosions du marchand d'armes
  netTick(dt);
  multiEnvoi(now);
  if (sim) {
    const h = sim.hero;
    if (tuto && running && !ov()) tutoTick(h);
    if (running && (!ov() || net.n > 1)) {
      const mag = Math.hypot(joy.f, joy.r);
      // sprint : joystick tenu à fond vers l'avant
      if (mag > 0.96 && joy.f > 0.5) joy.full += dt;
      else joy.full = 0;
      inp.f = joy.f;
      inp.r = joy.r;
      inp.sprint = joy.full > 0.3;
      const fm = fireMode();
      if (fireQ && now - fireQT > 900) fireQ = false;
      const scp = !!WT[tWeap].scope;
      if (aimOn()) inp.sprint = false;
      inp.fire =
        !ov() &&
        tool === 'pistolet' &&
        !(sim.hero.down > 0) &&
        ((scp ? fireQ : fireTouch) || (fm !== 'btn' && !aimHold && (fm === 'auto' || hasTarget(sim, sim.hero))));
      const cdB = sim.hero.cd;
      inp.jump = jumpQ;
      jumpQ = false; // arme à lunette : rien ne part tant qu'on tient Tir
      // saut auto (réglage « Saut auto » dans la carte) : en avançant contre une marche d'un bloc (mur, colline), le héros saute tout seul. Deux blocs : il grimpe déjà en poussant. Pas accroupi, pas en vol.
      if (save.aj && !inp.jump && !inp.sneak && !flying() && mag > 0.3) {
        const hh = sim.hero;
        if (!(hh.down > 0) && hh.y <= topAt(sim, hh.x, hh.z) + 0.01) {
          const cy = Math.cos(hh.yaw),
            sy = Math.sin(hh.yaw),
            dx = (-sy * joy.f + cy * joy.r) / mag,
            dz = (-cy * joy.f - sy * joy.r) / mag;
          for (const d of [1, 1.9]) {
            const r = topAt(sim, hh.x + dx * d, hh.z + dz * d) - hh.y;
            if (r > 0.3 && r <= WALLH + 0.05) {
              inp.jump = true;
              break;
            }
          }
        }
      }
      inp.fly = flying();
      inp.up = inp.fly && jumpHeld;
      inp.down = inp.fly && sneakHeld;
      if (inp.fly) inp.sneak = false;
      const nst = save.dev && !sim.client ? dev.speed : 1;
      for (let i = 0; i < nst && !sim.over; i++) {
        step(sim, dt, inp);
        inp.jump = false;
      }
      if (fireQ && sim.hero.cd > cdB + 1e-6) fireQ = false; // le coup demandé au relâcher est parti
      if (save.dev && dev.auto && sim.phase === 'prep' && !sim.over) {
        devT += dt;
        if (devT > 2 && startWave(sim)) {
          devT = 0;
          wavePhase = '';
        }
      } else devT = 0;
      for (const ev of sim.events) {
        feel(ev);
        armEv(ev);
        if (ev.k === 'boom') {
          ringFx(ev.x, ev.z, ev.r, ev.el);
          if (ev.r > 2) burst(ev.x, 0.3, ev.z, ev.el, 4, 0.7);
        } else if (ev.k === 'wave') ringFx(ev.x, ev.z, ev.r, ev.el, 0.6);
        else if (ev.k === 'dead') {
          if (ev.g)
            floater(
              ev.x,
              ev.air ? 9 : ev.boss ? 9 : 3.6,
              ev.z,
              '+' + ev.g,
              '#ffcf5a',
              ev.boss ? 22 : ev.pot ? 12 : 15,
              ev.pot ? 0.9 : 1.25
            );
          if (ev.boss || fx.length < 40) ringFx(ev.x, ev.z, ev.boss ? 5 : 1.6, ev.el, 0.3);
          burst(ev.x, ev.air ? 7.5 : ev.boss ? 3 : 1, ev.z, ev.el, ev.boss ? 26 : 7, ev.boss ? 1.8 : 1);
          if (ev.boss) {
            toast('Boss vaincu');
            shake = 0.5;
            butin.push([ev.el, (ev.bt || 1) > 1 ? 1 : 0.6]);
          }
        } else if (ev.k === 'arc') ringFx(ev.x, ev.z, 1.4, 'elec', 0.25);
        else if (ev.k === 'flame') flameFx(ev);
        else if (ev.k === 'expl') {
          if (fx.length < 40) ringFx(ev.x, ev.z, ev.r, 'feu', 0.28);
        } else if (ev.k === 'renfort') {
          ringFx(ev.x, ev.z, 9, ev.el, 0.6);
          toast('Renfort : ' + ev.n + ' défense' + (ev.n > 1 ? 's' : '') + ' de ' + EL[ev.el].n);
          SND.play('coin');
        } else if (ev.k === 'ruin') {
          burst(ev.x, 1.2, ev.z, ev.el, 14, 1.6);
          ringFx(ev.x, ev.z, RUINR, 'terre', 0.5);
          toast("Une défense de renfort est tombée : des ruines bloquent l'endroit");
        } else if (ev.k === 'heal') {
          if (fx.length < 40) ringFx(ev.x, ev.z, ev.r, 'eau', 0.5);
        } else if (ev.k === 'jam') {
          if (fx.length < 40) ringFx(ev.x, ev.z, ev.r, 'elec', 0.4);
        } else if (ev.k === 'regrow') {
          ringFx(ev.x, ev.z, 2.2, 'bois', 0.5);
          burst(ev.x, 0.6, ev.z, 'bois', 8, 1.1);
          toast('Un Semeur a repoussé');
        } else if (ev.k === 'bolt') {
          ringFx(ev.x, ev.z, 1.5, ev.el, 0.25);
          ringFx(0, 0, 3.5, ev.el, 0.45);
          coreHit = 0.4;
          shake = Math.max(shake, 0.2);
        } else if (ev.k === 'fire') fired[ev.id] = 1;
        else if (ev.k === 'obj') {
          if (ev.t === 'win') {
            butin.push(['relique', 0.4]);
            runObj++;
          }
          toast(
            ev.t === 'start'
              ? 'Objectif : ' + OBJN[ev.o]
              : ev.t === 'win'
                ? OBJN[ev.o] + ' : réussi · +' + ev.g + ' or'
                : OBJN[ev.o] + ' : raté'
          );
        } else if (ev.k === 'quake') {
          ringFx(ev.x, ev.z, ev.r || BAL.quakeR, 'terre', 0.7);
          ringFx(ev.x, ev.z, (ev.r || BAL.quakeR) * 0.6, 'terre', 0.5);
          burst(ev.x, 0.4, ev.z, 'terre', 26, 1.8);
          shake = 0.6;
        } else if (ev.k === 'dash') {
          for (let i = 0; i <= 6; i++)
            burst(ev.x + ((ev.ex - ev.x) * i) / 6, 1, ev.z + ((ev.ez - ev.z) * i) / 6, 'elec', 3, 0.6);
          ringFx(ev.x, ev.z, 2.5, 'elec', 0.3);
          ringFx(ev.ex, ev.ez, 3.5, 'elec', 0.4);
        } else if (ev.k === 'rafale') {
          // Zéphyr : la Rafale (un souffle le long du bond) et le Tir perçant (un trait de vent sur toute sa ligne)
          for (let i = 0; i <= 6; i++)
            burst(ev.x + ((ev.ex - ev.x) * i) / 6, 1, ev.z + ((ev.ez - ev.z) * i) / 6, 'vent', 3, 0.7);
          ringFx(ev.x, ev.z, 3, 'vent', 0.35);
        } else if (ev.k === 'perce') {
          const n = 28,
            pe = ELS.includes(ev.el) ? ev.el : 'vent';
          for (let i = 1; i <= n; i++)
            burst(ev.x + ((ev.ex - ev.x) * i) / n, 1.3, ev.z + ((ev.ez - ev.z) * i) / n, pe, 2, 0.55);
          ringFx(ev.x, ev.z, 2.5, pe, 0.3);
          shake = Math.max(shake, 0.3);
          toast('Tir perçant');
        } else if (ev.k === 'charge' || ev.k === 'plonge') {
          // V2.2 : la charge de l'Avant-garde (Roc) et le bond du Plongeur (Sylve)
          const ce = ev.k === 'charge' ? 'terre' : 'bois';
          for (let i = 0; i <= 6; i++)
            burst(ev.x + ((ev.ex - ev.x) * i) / 6, 0.8, ev.z + ((ev.ez - ev.z) * i) / 6, ce, 3, 0.7);
          ringFx(ev.ex, ev.ez, ev.r || 3, ce, 0.4);
          if (ev.k === 'charge') shake = Math.max(shake, 0.3);
        } else if (ev.k === 'tint') {
          // l'ultime teinté par l'élément de l'arme (V2.2)
          if (ELS.includes(ev.el)) {
            ringFx(ev.x, ev.z, ev.r || 30, ev.el, 0.7);
            if (ev.r) burst(ev.x, 0.6, ev.z, ev.el, 16, 1.4);
          }
        } else if (ev.k === 'aura') {
          if (fx.length < 40) ringFx(ev.x, ev.z, ev.r, 'feu', 0.35);
        } else if (ev.k === 'refl') {
          if (fx.length < 40) ringFx(ev.x, ev.z, 1.6, 'terre', 0.25);
        } else if (ev.k === 'reflect') {
          if (!net.host && Number.isFinite(ev.id)) send(['rf', ev.id, ev.d]); // Roc Gardien chez un invité : l'hôte applique le renvoi
        } else if (ev.k === 'pspread') {
          if (fx.length < 40) ringFx(ev.x, ev.z, 4, 'bois', 0.4);
        } else if (ev.k === 'gust') {
          // le Tourbillon (Vent, V2.2) pousse ses voisins vers le cœur
          if (fx.length < 40) {
            ringFx(ev.x, ev.z, ev.r, 'vent', 0.5);
            burst(ev.x, 1, ev.z, 'vent', 10, 1.2);
          }
        } else if (ev.k === 'storm') {
          ringFx(ev.x, ev.z, BAL.stormR, 'elec', 0.8);
          toast('Orage');
        } else if (ev.k === 'bolt2') {
          bolt(ev.x, ev.z);
          ringFx(ev.x, ev.z, 1.6, ELS.includes(ev.tn) ? ev.tn : 'elec', 0.25);
        } else if (ev.k === 'ronce') {
          ringFx(ev.x, ev.z, BAL.ronceR, 'bois', 0.6);
          burst(ev.x, 0.5, ev.z, 'bois', 16, 1.2);
        } else if (ev.k === 'guard') {
          ringFx(ev.x, ev.z, 11, 'bois', 0.8);
          toast('Les Gardiens sortent de terre');
        } else if (ev.k === 'fball') {
          ringFx(ev.x, ev.z, BAL.fbR, 'feu', 0.5);
          burst(ev.x, 1, ev.z, 'feu', 22, 1.6);
          shake = Math.max(shake, 0.25);
        } else if (ev.k === 'rain') toast('Pluie de météores');
        else if (ev.k === 'meteor') {
          bolt(ev.x, ev.z, 0xff7a2e);
          ringFx(ev.x, ev.z, ev.r || BAL.metR, 'feu', 0.45);
          burst(ev.x, 1, ev.z, ELS.includes(ev.tn) ? ev.tn : 'feu', 14, 1.5);
          shake = Math.max(shake, 0.2);
        } else if (ev.k === 'tide') {
          ringFx(ev.x, ev.z, ev.r, 'eau', 0.6);
          ringFx(ev.x, ev.z, ev.r * 0.55, 'eau', 0.45);
          burst(ev.x, 0.6, ev.z, 'eau', 18, 1.3);
          if (ev.mine) net.hl = [Date.now() % 1e9, r1(ev.x), r1(ev.z), ev.heal || BAL.tideHeal, ev.r, 0, ev.sh || 0]; // V2.2 : le bouclier de la Soigneuse
        } else if (ev.k === 'deluge') {
          toast('Déluge');
          ringFx(0, 0, 70, 'eau', 1.4);
          ringFx(0, 0, 40, 'eau', 1);
          if (ev.mine) net.hl = [Date.now() % 1e9, 0, 0, 999, 999, 1];
        } else if (ev.k === 'wallup') {
          ringFx(ev.x, ev.z, 3.5, 'terre', 0.4);
          burst(ev.x, 1, ev.z, 'terre', 6, 1);
        } else if (ev.k === 'nowall') toast('Pas la place pour un rempart ici');
        else if (ev.k === 'ouch') {
          hurtF = 1;
          if (!calm) shake = Math.max(shake, 0.12);
        } else if (ev.k === 'say') {
          toast(EL[ev.el].hero + ' : ' + ev.t);
          toastT = 4.5;
        } else if (ev.k === 'downB') {
          if (!hiredOf(sim).some(o => o.el === ev.el && o.down > 0))
            toast(EL[ev.el].hero + ' (bot) est à terre : reste près de lui pour le relever');
        } else if (ev.k === 'hire') toast(EL[ev.el].hero + ' te rejoint');
        else if (ev.k === 'hireDead') {
          toast('Ton esclave ' + EL[ev.el].hero + " est mort : rachète-en un au marchand d'esclaves");
          toastT = 4.5;
          burst(ev.x, 1, ev.z, ev.el, 10, 1.2);
          if (!$('hireV').hidden) hireDraw();
        } else if (ev.k === 'down') toast('Tu es à terre');
        else if (ev.k === 'up') toast('De retour au combat');
        else if (ev.k === 'smash') {
          ringFx(ev.x, ev.z, 5, 'terre', 0.5);
          toast('Un tank a mis une défense hors service');
        } else if (ev.k === 'cannon') {
          cannonFx(ev);
          if (canToastW !== sim.wave) {
            canToastW = sim.wave;
            toast('Les navires canonnent tes défenses près des plages');
          }
        } else if (ev.k === 'raid') {
          const a = Math.atan2(ev.x, -ev.z),
            d = [
              'au nord',
              'au nord-est',
              "à l'est",
              'au sud-est',
              'au sud',
              'au sud-ouest',
              "à l'ouest",
              'au nord-ouest'
            ][Math.round(a / (Math.PI / 4) + 8) % 8];
          toast('Un navire surprise approche ' + d + ' !');
          toastT = 5;
        } else if (ev.k === 'pupdrop') {
          ringFx(ev.x, ev.z, 3, 'elec', 0.5);
          if (!pupTold) {
            pupTold = 1;
            toast('Un bonus est tombé : marche dessus !');
            toastT = 4;
          }
        } else if (ev.k === 'pup') {
          const P = PUPS[ev.t];
          toast((ev.who ? ev.who + ' · ' : '') + P.n + ' ! ' + P.d.charAt(0).toUpperCase() + P.d.slice(1));
          toastT = 3.6;
          burst(ev.x, 1.6, ev.z, 'elec', 16, 1.6);
          ringFx(ev.x, ev.z, 6, 'elec', 0.6);
          if (ev.t === 'bombe') {
            ringFx(ev.x, ev.z, 45, 'feu', 1);
            ringFx(0, 0, R_ISLE, 'feu', 1.4);
            if (!calm) shake = Math.max(shake, 0.6);
            const bf = $('boomF');
            bf.style.transition = 'none';
            bf.style.opacity = calm ? '.25' : '.7';
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                bf.style.transition = 'opacity .8s';
                bf.style.opacity = '0';
              })
            );
          }
        } else if (ev.k === 'zap') ringFx(ev.x, ev.z, 1.3, ev.el, 0.2);
        else if (ev.k === 'summon') ringFx(ev.x, ev.z, 5, ev.el, 0.5);
        else if (ev.k === 'shift') {
          ringFx(ev.x, ev.z, 14, ev.el, 0.9);
          burst(ev.x, 6, ev.z, ev.el, 20, 2);
          toast('Le Big Boss passe en ' + EL[ev.el].n);
        } else if (ev.k === 'stomp') {
          ringFx(ev.x, ev.z, 18, ev.el, 0.8);
          shake = Math.max(shake, 0.4);
          toast('Défenses proches paralysées');
        } else if (ev.k === 'leak') {
          toast('Le cœur est touché');
          coreHit = 0.4;
          shake = Math.max(shake, 0.3);
        } else if (ev.k === 'clear' && !sim.over) toast('Vague repoussée');
      }
      sim.events.length = 0;
      if (sim.over) {
        SND.play(sim.over === 'win' ? 'win' : 'lose');
        finish();
      }
    }
    $('joy').classList.toggle('sprint', h.sprint);
    const mv = Math.hypot(inp.f, inp.r) * (h.y > 0 ? 0 : 1);
    bob += dt * mv * (h.sprint ? 15 : 11);
    if (shake > 0) shake = Math.max(0, shake - dt);
    const sk = calm ? 0 : shake * 0.5;
    camera.position.set(
      h.x + (Math.random() - 0.5) * sk,
      Math.max(0.3, h.y + h.eye) + Math.sin(bob) * 0.05 * mv + (Math.random() - 0.5) * sk,
      h.z
    );
    camera.rotation.y = h.yaw;
    camera.rotation.x = h.pitch;
    const fov0 = (camera.aspect < 1 ? 86 : 72) + (h.sprint ? 8 : 0),
      zm = aimZoom(),
      fovT = zm > 1 ? (2 * Math.atan(Math.tan((fov0 * Math.PI) / 360) / zm) * 180) / Math.PI : fov0;
    if (Math.abs(fovT - fovNow) > 0.05) {
      fovNow += (fovT - fovNow) * Math.min(1, dt * (zm > 1 || fovNow < fov0 - 9 ? 16 : 8));
      camera.fov = fovNow;
      camera.updateProjectionMatrix();
    }
    handsTick(h, dt);
    // fantôme : là où on regarde, entre 3 et 16 m devant soi
    if (placing && running) {
      const sy = Math.sin(h.pitch),
        cp = Math.cos(h.pitch);
      let dist = sy < -0.05 ? ((h.y + h.eye) / -sy) * cp : 16;
      dist = Math.max(3, Math.min(16, dist));
      gx = h.x - Math.sin(h.yaw) * dist;
      gz = h.z - Math.cos(h.yaw) * dist;
      const wm = isLine(placeType);
      let gy = 0;
      if (wm) {
        const ci = cellOf(gx, gz);
        gx = cellX(ci);
        gz = cellZ(ci);
        const a = wallA >= 0 ? wallA : ci,
          key = placeType + a + '/' + ci + '/' + sim.fv + '/' + sim.towers.length + '/' + sim.enemies.length;
        if (key !== gKey) {
          gKey = key;
          gChk = (placeType === 'mur' ? checkWalls : checkDig)(sim, cellX(a), cellZ(a), gx, gz);
        }
        gWhy = gChk.why;
        ghostWs.forEach((m, k) => {
          const c = gChk.all[k];
          m.visible = c !== undefined;
          if (m.visible)
            m.position.set(
              cellX(c),
              Math.max(0.12 - WALLH / 2, (sim.wallSet[c] - sim.pit[c] + (placeType === 'mur' ? 0.5 : -0.5)) * WALLH),
              cellZ(c)
            );
        });
      } else {
        const ci = cellOf(gx, gz);
        gy = sim.wallSet[ci] * WALLH;
        if (gy) {
          gx = cellX(ci);
          gz = cellZ(ci);
        }
        gWhy = canPlace(sim, gx, gz);
      }
      ghost.position.set(gx, gy, gz);
      if (!wm) gRing.scale.setScalar((rangeOf(placeType, 1, sim.m) + BAL.wallRange * Math.round(gy / WALLH)) / 17);
      ghostMat.color.setHex(gWhy ? 0xff6b5a : 0x7cf07a);
      ghost.visible = !wm;
      if (!wm) hideGW();
    } else {
      ghost.visible = false;
      hideGW();
      wallA = -1;
    }
    viewsTick(dt, now, h);
    // HUD
    {
      const bk = running ? PUPT.map(k => Math.ceil(sim.buff[k])).join(',') : '';
      if (bk !== buffKey) {
        buffKey = bk;
        $('buffs').innerHTML = running
          ? PUPT.filter(k => sim.buff[k] > 0)
              .map(
                k =>
                  `<span style="--c:${PUPS[k].c}"><b>${PUPS[k].i}</b>${PUPS[k].n}<i>${Math.ceil(sim.buff[k])}</i></span>`
              )
              .join('')
          : '';
      }
    }
    setTxt('sCore', 'b', String(sim.core));
    $('sCore').classList.toggle('low', sim.core <= 6);
    setTxt('sGold', 'b', String(sim.gold));
    $('sPot').hidden = sim.mode !== 'normal' || !running;
    setTxt('sPot', 'b', String(Math.round(sim.pot)));
    setTxt('sWave', 'b', sim.wave + '/' + sim.maxW);
    $('sNet').hidden = net.n < 2;
    setTxt('sNet', 'b', net.n + (net.host ? ' · hôte' : ' · invité'));
    setTxt('bGrid', 'b', String(sim.pts));
    $('bGrid').classList.toggle('has', sim.pts > 0);
    $('bGrid').hidden = !running;
    if (!running || !save.dev) $('devP').hidden = true;
    if (wavePhase !== sim.phase + sim.wave) {
      const was = wavePhase;
      wavePhase = sim.phase + sim.wave;
      drawWave();
      if (sim.phase === 'wave') {
        toast('Vague ' + sim.wave);
        SND.play('wave');
      } else if (was === 'wave' + sim.wave && net.host && !sim.over) botShop();
    }
    {
      // les ennemis qui restent : un chiffre de plus en haut à droite, pendant la vague (V1.2 : avant, un grand bandeau au milieu en haut)
      const inW = sim.phase === 'wave';
      if ($('sLeft').hidden === inW) $('sLeft').hidden = !inW;
      if (inW) setTxt('sLeft', 'b', String(sim.enemies.length + sim.queue.length));
    }
    if (sim.phase === 'wave' && $('objL')) {
      let bo = null;
      for (const e of sim.enemies) if (e.boss && (!bo || (e.bt || 1) > (bo.bt || 1))) bo = e;
      const ob = sim.obj;
      $('objL').hidden = !ob;
      if (ob)
        setTxt(
          'objL',
          '',
          ob.k === 'bomb'
            ? 'Objectif : abats le porteur de bombe · côté ' + PATHS[ob.path].name
            : ob.k === 'zone'
              ? 'Objectif : tiens la zone ' +
                Math.floor(ob.got) +
                ' / ' +
                BAL.zoneNeed +
                ' s · reste ' +
                Math.ceil(ob.t) +
                ' s'
              : 'Objectif : ' +
                (ob.car ? 'ramène la relique au cœur' : 'va chercher la relique sur la route') +
                ' · reste ' +
                Math.ceil(ob.t) +
                ' s'
        );
      const bl = $('bossL');
      bl.hidden = !bo;
      if (bo) {
        setTxt('bossN', '', BN[bo.bt || 1] + ' · ' + EL[bo.el].n);
        const f = $('bossF');
        f.style.width = Math.max(0, Math.min(100, (100 * bo.hp) / bo.max)).toFixed(0) + '%';
        f.style.setProperty('--c', elc(bo.el));
      }
    }
    {
      // pendant la vague, le panneau du haut ne s'affiche que s'il a quelque chose à dire : un objectif, un boss
      const wv = $('wave'),
        vide =
          (sim.phase === 'wave' && !!$('objL') && $('objL').hidden && $('bossL').hidden) ||
          (sim.phase === 'prep' && !!tuto && tuto.i < 2); // les deux premières étapes du tuto n'ont pas d'aperçu (audit écran n° 22)
      if (wv._v !== vide) {
        wv._v = vide;
        wv.classList.toggle('vide', vide);
      }
    }
    nearT = null;
    nearA = null;
    let nd = 5.5,
      na = 5.5;
    for (const t of sim.towers) {
      const d = Math.hypot(t.x - h.x, t.z - h.z);
      if (t.tmpT !== undefined) continue;
      if (d < na) {
        na = d;
        nearA = t;
      }
      if (d < nd && t.els.length < MAXEL * MAXLV) {
        nd = d;
        nearT = t;
      }
    }
    if (!placing && tool !== 'pistolet') setTool('pistolet'); // on reprend le pistolet dès que la pose s'arrête (fin de partie, carte ouverte…)
    const show = running && !ov();
    $('act').hidden = !show;
    let wc = null;
    $('act').classList.toggle('quiet', tool === 'pistolet' && now - barT > 2600);
    shopNear = running && Math.hypot(h.x - SHOP[0], h.z - SHOP[1]) < 6.5 && !(h.down > 0);
    hireNear = running && Math.hypot(h.x - HIREP[0], h.z - HIREP[1]) < 6.5 && !(h.down > 0);
    rulesNear = running && Math.hypot(h.x - RULEP[0], h.z - RULEP[1]) < 6.5 && !(h.down > 0);
    armNear = running && Math.hypot(h.x - ARMP[0], h.z - ARMP[1]) < 6.5 && !(h.down > 0);
    {
      const ba = $('bArmes');
      if (ba.hidden === armNear) ba.hidden = !armNear;
      if (!running && !$('armV').hidden) $('armV').hidden = true;
      if (!$('armV').hidden && $('armG').textContent !== String(sim.gold)) armDraw();
      if (!running && !$('arsV').hidden) $('arsV').hidden = true;
    }
    {
      const br = $('bRules');
      if (br.hidden === rulesNear) br.hidden = !rulesNear;
      if (!running && !$('guideV').hidden) $('guideV').hidden = true;
    }
    {
      const bh = $('bHire');
      if (bh.hidden === hireNear) bh.hidden = !hireNear;
      if (hireNear) setTxt('bHire', 'b', String(hireCost(sim)));
      if (!running && !$('hireV').hidden) $('hireV').hidden = true;
    }
    if (running && sim.pts > lastPts && sim.wave > 0)
      toast(
        '+' +
          (sim.pts - lastPts) +
          (sim.pts - lastPts > 1 ? ' points' : ' point') +
          (cielWant() ? ' · bouton Marchand en bas à gauche' : ' · le marchand est près du cœur') // dans le ciel, on n'y marche pas (audit écran n° 13)
      );
    lastPts = sim.pts;
    if (show) {
      const wm = placing && isLine(placeType);
      const crouch = inp.sneak || (flying() && sneakHeld);
      for (const b of hotSlots) b.classList.toggle('sel', tool === b.dataset.t);
      if (tool !== 'pistolet')
        for (const b of $('sub').children) {
          const k = b.dataset.k,
            v = k === 'mur' ? BAL.wall + '/bloc' : k === 'pelle' ? BAL.dig + '/bloc' : String(placeCost(sim, k)),
            p = b.lastChild;
          if (p.textContent !== v) p.textContent = v;
        }
      if (nearT && crouch && tool !== 'pelle')
        wc = { t: nearT, type: nearT.type, els: nearT.els, cost: costOf(nearT.type, nearT.els.length), why: '' }; // accroupi près d'une défense : on l'améliore
      else if (placing && !wm)
        wc = { place: true, type: placeType, els: [], cost: placeCost(sim, placeType), why: gWhy };
      wheelCtx = wc;
      $('wheel').hidden = !wc;
      $('wheelL').hidden = !wc;
      if (wc) drawWheel(wc);
      // bouton libre : Auto (accroupi près d'une défense, mode normal), sinon Viser (l'arme en main) ; bouton Action : selon l'outil en main.
      // Renfort n'y est plus depuis la V1.2 : il a son propre bouton sur l'arc (voir plus bas).
      freeK =
        nearA && crouch && tool !== 'pelle' && sim.mode === 'normal'
          ? 'auto'
          : tool === 'pistolet'
            ? 'aim'
            : shopNear && !placing
              ? 'shop'
              : ''; // l'arme en main : le bouton libre vise (la boutique reste sur « Marchand », en haut à droite, et dans la carte)
      const fw = freeK === 'auto' ? 'Auto' : freeK === 'aim' ? 'Viser' : freeK ? 'Boutique' : '',
        fs =
          freeK === 'auto'
            ? nearA.auto
              ? 'oui'
              : 'non'
            : freeK === 'shop'
              ? sim.pts + (sim.pts > 1 ? ' pts' : ' pt')
              : '',
        fon = freeK === 'auto' ? !!nearA.auto : freeK === 'aim' && aimOn();
      {
        const sc = aimOn() && !!WT[tWeap].scope,
          so = $('scope');
        if (so.hidden === sc) {
          so.hidden = !sc;
          $('hud').classList.toggle('scoped', sc);
        }
        const cr = $('cross');
        if (cr._a !== aimOn()) {
          cr._a = aimOn();
          cr.classList.toggle('ads', cr._a);
        }
        if (cr._h !== sc) {
          cr._h = sc;
          cr.style.visibility = sc ? 'hidden' : '';
        }
      }
      if (wm) {
        const poor = !!gWhy || (wallA >= 0 && sim.gold < gChk.cost);
        padSet(
          wallA < 0 ? 'Point A' : 'Point B',
          '',
          poor ? 'poor' : 'go',
          fw,
          fs,
          fon,
          gWhy || (wallA < 0 ? 'Point A ici' : 'Point B · ' + gold(gChk.cost)),
          '',
          poor
        );
      } else if (wc && tool !== 'pistolet') {
        const off = !!wc.why || wheelAdv < 0 || sim.gold < wc.cost;
        padSet(
          wc.place ? 'Poser' : 'Améliorer',
          wheelAdv < 0 ? '' : EL[ELS[wheelAdv]].n,
          off ? 'poor' : 'go',
          fw,
          fs,
          fon,
          '',
          '',
          false
        );
      } else padSet('Tir', '', '', fw, fs, fon, '', '', false);
    } else {
      wheelCtx = null;
      $('wheel').hidden = true;
      $('wheelL').hidden = true;
      freeK = '';
      if (!$('scope').hidden) {
        $('scope').hidden = true;
        $('hud').classList.remove('scoped');
      }
      if (!running) aimSet(false);
      padSet('Tir', '', 'idle', '', '', false, '', '', false);
    }
    {
      // vie du héros
      const hp = Math.max(0, h.hp),
        hv = Math.ceil(hp) + ' / ' + Math.round(h.maxHp);
      $('hpF').style.width = ((100 * hp) / h.maxHp).toFixed(0) + '%';
      setTxt('hpT', '', hv);
      $('hp').classList.toggle('low', hp < h.maxHp * 0.35);
      hurtF = Math.max(h.down > 0 ? 0.8 : hp < h.maxHp * 0.3 ? 0.35 : 0, hurtF - dt * 2.5);
      $('hurt').style.opacity = hurtF.toFixed(2);
      const dv = $('downV');
      dv.hidden = !(h.down > 0) || !running;
      if (!dv.hidden)
        setTxt(
          'downV',
          '',
          'À TERRE\nretour dans ' +
            Math.ceil(h.down) +
            ' s' +
            (net.n > 1 ? '\nun coéquipier à côté de toi te relève' : '')
        );
    }
    {
      $('ult').hidden = false;
      $('ultF').style.width = Math.round(h.ult) + '%';
      const rd = h.ult >= 100 && running && !ov() && !(h.down > 0),
        bu = $('bUlt');
      if (bu._r !== rd) {
        bu._r = rd;
        bu.classList.toggle('rdy', rd);
      }
      setTxt('bUlt', 'small', rd ? 'prêt' : Math.floor(h.ult) + ' %');
    }
    const ab = $('bAb');
    ab.classList.toggle('cd', h.ab > 0);
    setTxt('bAb', 'small', h.ab > 0 ? Math.ceil(h.ab) + ' s' : 'prête');
    $('bRenf').classList.toggle('cd', h.sm > 0);
    setTxt('bRenf', 'small', h.sm > 0 ? Math.ceil(h.sm) + ' s' : 'prêt');
    cielTick(dt, now); // la vue du ciel entre deux vagues (interface/ciel.js) : après la vue normale, avant le rendu
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) $('toast').classList.remove('on');
    }
    if (now - miniT >= 45) {
      miniT = now;
      drawMini(mg, 208);
    }
    if (!$('mapV').hidden) drawBig();
    drawMarks(h);
  } else {
    drawMarks(null);
    camera.position.set(Math.sin(now / 9000) * 70, 40, Math.cos(now / 9000) * 70);
    camera.lookAt(0, 2, 0);
  }
  skyTick();
  // si le téléphone peine (moins de 28 images par seconde pendant 3 s), on coupe les ombres, puis on baisse la finesse
  perfT += dt;
  perfN++;
  if (perfT > 3) {
    if (now > 8000 && perfT / perfN > 0.036 && gfxLv > 0) {
      gfxLv--;
      if (gfxLv === 1) sun.castShadow = false;
      else renderer.setPixelRatio(1);
    }
    perfT = 0;
    perfN = 0;
  }
  renderer.render(scene, camera);
}
// ---------- démarrage : le lobby a ouvert le cadre pour une partie, elle commence tout de suite ----------
if (LOBBY.tuto === true) tutoStart();
else begin(save.last);
requestAnimationFrame(frame);
