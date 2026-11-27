// [lobby/dev.js] Le mode dev du lobby : raccourcis de test.
// ---- mode dev du lobby : raccourcis de test (le mode dev s'active dans la maison ou dans le panneau du portail ; tout se pose alors gratuitement)
const ldev = { fast: false, clip: false };
function ldevDraw() {
  const B = (id, txt, on) => `<button class="dv${on ? ' on' : ''}" data-a="${id}">${txt}</button>`,
    all = LOOT.every(L => save.loot[L[0]] > 0) && HEROS.every(e => save.loot['etoile_' + e]);
  $('lDevP').innerHTML =
    B('x', 'Fermer ✕') +
    B('fly', 'Vol libre : ' + (dev.fly ? 'oui' : 'non'), dev.fly) +
    B('fast', 'Vitesse ×3 : ' + (ldev.fast ? 'oui' : 'non'), ldev.fast) +
    B('clip', 'Traverser tout : ' + (ldev.clip ? 'oui' : 'non'), ldev.clip) +
    B('hv', 'Remplir les récoltes') +
    B('gold', '+1000 or céleste') +
    B('ren', '+200 renom') +
    B('bmax', 'Bâtiments au max') +
    B('sh', '+500 éclats (' + EL[tHero].hero + ')') +
    B('loot', all ? 'Vider le musée' : 'Tout le butin', all) +
    B('wmax', "Maxer l'arme en main") +
    B('hmax', 'Maxer ' + EL[tHero].hero) +
    B('zero', 'Arbres à zéro') +
    B('demo', "Village d'exemple") +
    B('clear', 'Tout ranger') +
    B('flat', 'Aplanir le relief') +
    B('home', 'Aller à la maison') +
    B('gate', 'Aller aux portails') +
    B('off', 'Quitter le mode dev');
  $('lDevP')
    .querySelectorAll('.dv')
    .forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a;
          if (a === 'x') {
            $('lDevP').hidden = true;
            return;
          }
          if (a === 'fly') {
            dev.fly = !dev.fly;
            devKeep();
          } else if (a === 'fast' || a === 'clip') ldev[a] = !ldev[a];
          else if (a === 'hv') {
            for (const k in HV) {
              const o = hvB(k);
              if (o) save.hv.s[k] = hvCap(k, lvOf(o));
            }
            toast('Récoltes remplies');
          } else if (a === 'gold') {
            save.gold += 1000;
            toast('+1000 or céleste');
          } else if (a === 'ren') {
            save.qd += 20;
          } else if (a === 'bmax') {
            for (const o of save.vil) {
              const C = CAT[o.t];
              if (C.up) {
                o.l = C.mx || 3;
                vilRe(o);
              }
            }
            toast('Tous les bâtiments au niveau maximum');
          } else if (a === 'sh') {
            save.sh[tHero] += 500;
            toast('+500 éclats pour ' + EL[tHero].hero);
          } else if (a === 'loot') {
            if (all) save.loot = {};
            else {
              for (const L of LOOT) save.loot[L[0]] = save.loot[L[0]] || 1;
              for (const e of HEROS) save.loot['etoile_' + e] = 1;
            }
            toast(all ? 'Musée vidé' : 'Tout le butin est au musée');
          } else if (a === 'wmax') {
            armNodes(tWeap).forEach(n => (save.wl[tWeap][n.id] = n.max));
            ET.nodes.forEach(n => (save.we[n.id] = n.max));
            toast(WT[tWeap].title + ' et élément des balles au maximum');
          } else if (a === 'hmax') {
            HT[tHero].nodes.forEach(n => (save.hl[tHero][n.id] = n.max));
            toast(EL[tHero].hero + ' au maximum');
          } else if (a === 'zero') {
            for (const w in WT) save.wl[w] = {};
            save.we = {};
            for (const e of HEROS) save.hl[e] = {};
            toast('Arbres des héros et des armes remis à zéro');
          } else if (a === 'demo') {
            vilDemo();
            lobSpawn();
            toast("Village d'exemple installé");
          } else if (a === 'clear') {
            vilClear();
            toast('Île vidée');
          } else if (a === 'flat') {
            TH.fill(0);
            terrDraw();
            terrSave();
            vilGround();
            toast('Relief aplani');
          } else if (a === 'home') {
            if (hasB('maison')) lobSpawn();
            else toast("Pas de maison sur l'île");
          } else if (a === 'gate') lobSpawn('game');
          else if (a === 'off') {
            save.dev = false;
            ldev.fast = ldev.clip = false;
            $('lDevP').hidden = true;
          }
          persist();
          syncHeroes();
          lobSync();
          if (save.dev) ldevDraw();
        })
    );
}
