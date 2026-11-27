// [interface/carte.js] La grande carte et les options de la partie (on y entre en touchant la mini-carte).
// ---------- grande carte et options de la partie (on y entre en touchant la mini-carte) ----------
const mapC = $('mapC'),
  mapG = mapC.getContext('2d'),
  ov = () => !$('tree').hidden || !$('mapV').hidden || !$('hireV').hidden || !$('arsV').hidden || !$('armV').hidden;
let optSig = '',
  quitArm = false;
function quitGame() {
  running = false;
  placing = false;
  tuto = null;
  tutoHTML();
  versLobby({ ile: 'retour' });
}
function drawOpt(force) {
  const nm = sim.mode === 'normal',
    na = sim.towers.filter(t => t.auto).length,
    sig = [sim.mode, sim.autoNew, na, sim.towers.length, fireMode(), sim.wave, sim.pts, net.n, quitArm].join();
  if (sig === optSig && !force) return;
  optSig = sig;
  $('mapOpt').innerHTML =
    `<div class="optTop"><h2>Options de la partie</h2><button class="solid" data-a="close">Reprendre</button></div><p>Vague ${sim.wave}/${sim.maxW} · ${MODES[sim.mode]}${net.n > 1 ? ' · ' + net.n + ' joueurs' : ''}</p>` +
    (nm
      ? `<button class="ob" data-a="an"><span>Nouvelles défenses auto</span><b>${sim.autoNew ? 'oui' : 'non'}</b></button>
      <div class="ob2"><span>Défenses en auto : ${na} sur ${sim.towers.length}</span><div><button class="ob" data-a="a1">Tout en auto</button><button class="ob" data-a="a0">Tout en manuel</button></div></div>`
      : '') +
    `<button class="ob" data-a="fire"><span>Mode de tir</span><b>${FM[fireMode()]}</b></button>
      <button class="ob" data-a="aj"><span>Saut auto</span><b>${save.aj ? 'oui' : 'non'}</b></button>
      <button class="ob" data-a="grid"><span>Boutique du marchand</span><b>${sim.pts} pts</b></button>
      <button class="ob" data-a="hire"><span>Marchand d'esclaves</span><b>${hiredOf(sim).length} / ${HIREMAX}</b></button>
      <button class="ob" data-a="rules"><span>Règles du jeu</span></button>
      ${save.dev ? '<button class="ob" data-a="dev"><span>Outils dev</span></button>' : ''}
      <button class="ob warn" data-a="quit"><span>${quitArm ? 'Appuie encore pour confirmer' : 'Abandonner la partie'}</span></button>`; // « Reprendre » est en haut (audit écran n° 12 : en bas, il sortait de l'écran)
  $('mapOpt')
    .querySelectorAll('button')
    .forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a;
          if (a !== 'quit') quitArm = false;
          if (a === 'an') send(['an']);
          else if (a === 'a1') send(['aa', 1]);
          else if (a === 'a0') send(['aa', 0]);
          else if (a === 'fire') {
            save.fire = FMK[(FMK.indexOf(fireMode()) + 1) % 3];
            persist();
          } else if (a === 'aj') {
            save.aj = !save.aj;
            persist();
          } else if (a === 'hire') {
            if (cielOn())
              CIEL_BOUTIQUES[1].f(); // depuis le ciel, on n'a pas à marcher jusqu'à l'étal (audit écran n° 13)
            else hireOpen();
            return;
          } else if (a === 'rules') {
            $('mapV').hidden = true;
            rulesShow();
            return;
          } else if (a === 'grid') {
            if (!shopNear && !cielOn()) {
              toast("Le marchand t'attend près du cœur");
              return;
            }
            $('mapV').hidden = true;
            openTree();
            return;
          } else if (a === 'dev') {
            $('mapV').hidden = true;
            $('devP').hidden = false;
            drawDev();
            return;
          } else if (a === 'quit') {
            if (quitArm) {
              quitGame();
              return;
            }
            quitArm = true;
          } else if (a === 'close') {
            $('mapV').hidden = true;
            return;
          }
          drawOpt(true);
        })
    );
}
function drawBig() {
  const b = $('mapBox'),
    s = Math.max(120, Math.min(b.clientWidth, b.clientHeight)) + 'px';
  if (mapC.style.width !== s) mapC.style.width = mapC.style.height = s;
  drawMini(mapG, 720, true);
  drawOpt();
}
$('mini').onpointerdown = () => {
  if (!running) return;
  quitArm = false;
  placing = false;
  $('mapV').hidden = false;
  drawOpt(true);
};
