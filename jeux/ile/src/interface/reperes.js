// [interface/reperes.js] Repères à l'écran : nombres qui s'envolent, triangles et flèches vers les ennemis hors du champ.
// repères d'ennemis : un triangle au-dessus de ceux qui sont loin à l'écran, une flèche autour du viseur vers ceux qui sont hors champ
const mk = $('mark'),
  mkG = mk.getContext('2d'),
  MKN = 24,
  mkB = [];
// chiffres flottants : dégâts (blanc = le héros, gris = les défenses) et or gagné (doré = pour soi, vert = pot commun)
const floats = [],
  fxHp = new Map();
let fxTick = 0,
  pupTold = 0,
  buffKey = '';
// chaque nouveau chiffre est décalé à gauche, au milieu ou à droite : ils ne s'empilent plus au même endroit
let floatN = 0;
function floater(x, y, z, txt, col, size, life) {
  if (floats.length > 70) floats.shift();
  floats.push({
    ox: ((floatN++ % 3) - 1) * 12,
    x: x + (Math.random() - 0.5) * 1.2,
    y,
    z: z + (Math.random() - 0.5) * 1.2,
    txt: String(txt),
    col,
    size,
    t0: performance.now(),
    life: (life || 0.9) * 1000
  });
}
let mkW = 0,
  mkH = 0,
  mkT = 0,
  mkInk = true;
function drawMarks(h) {
  const now = performance.now();
  if (!mkW || now - mkT > 500) {
    mkT = now;
    mkW = mk.clientWidth;
    mkH = mk.clientHeight;
  }
  const W = mkW,
    H = mkH,
    pr = Math.min(2, window.devicePixelRatio || 1);
  if (mk.width !== Math.round(W * pr) || mk.height !== Math.round(H * pr)) {
    mk.width = Math.round(W * pr);
    mk.height = Math.round(H * pr);
    mkInk = true;
  }
  const g = mkG,
    idle = !h || ov() || !W;
  if (idle && !mkInk) return;
  g.setTransform(pr, 0, 0, pr, 0, 0);
  g.clearRect(0, 0, W, H);
  mkInk = !idle;
  if (idle) return;
  const cy = Math.cos(h.yaw),
    sy = Math.sin(h.yaw),
    cp = Math.cos(h.pitch),
    sp = Math.sin(h.pitch),
    tf = Math.tan(((fovNow || 72) * Math.PI) / 360),
    ey = Math.max(0.3, h.y + h.eye);
  for (let i = 0; i < MKN; i++) mkB[i] = null;
  g.lineJoin = 'round';
  fxTick++;
  for (const e of sim.enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - h.x,
      dz = e.z - h.z,
      d = Math.hypot(dx, dz);
    {
      const r = fxHp.get(e.id);
      if (!r) fxHp.set(e.id, { hp: e.hp, a: 0, t: 0, h: 0, s: fxTick });
      else {
        const dd = r.hp - e.hp;
        if (dd > 0.01) {
          r.a += dd;
          if (e.lastH) r.h = 1;
          else if (e.mark > 0) r.m = 1;
        }
        r.hp = e.hp;
        r.s = fxTick;
        if (r.a >= 1 && now - r.t > 350) {
          if (d < (r.h ? 95 : 50))
            floater(
              e.x,
              e.k === 'air' ? 9 : e.boss ? 9 : 3.4,
              e.z,
              Math.round(r.a),
              r.h ? armEfCol(e.id) || '#ffffff' : r.m ? '#ffcf5a' : '#b4c8cf',
              r.h ? (armEfOf.get(e.id) === 2 ? 15 : 13) : r.m ? 16 : 11,
              0.8
            );
          r.a = 0;
          r.h = 0;
          r.m = 0;
          r.t = now;
        }
      }
    }
    if (e.k === 'ste' && !(e.rev > 0) && d > 7) continue;
    const dy = (e.k === 'air' ? 8.5 : e.boss ? 8 : e.bur ? 1 : 3.2) - ey,
      cz = -dx * sy * cp + dy * sp - dz * cy * cp,
      cx = dx * cy - dz * sy,
      cu = dx * sy * sp + dy * cp + dz * cy * sp;
    if (cz > 0.5) {
      const sx = W / 2 + ((cx / cz / tf) * H) / 2,
        sY = H / 2 - ((cu / cz / tf) * H) / 2;
      if (sx > 14 && sx < W - 14 && sY > -40 && sY < H + 40) {
        if (e.mark > 0) {
          const by = sY + (((e.k === 'air' ? 1.2 : 1.9) / cz / tf) * H) / 2,
            rr = Math.max(6, Math.min(22, (((e.boss ? 70 : 38) / cz) * H) / 390)),
            q = rr * 0.45;
          g.globalAlpha = Math.min(1, e.mark / 0.6);
          g.lineWidth = 2;
          g.strokeStyle = '#fff';
          g.beginPath();
          g.arc(sx, by, rr, 0, 6.3);
          g.moveTo(sx - rr - q, by);
          g.lineTo(sx - rr + q, by);
          g.moveTo(sx + rr - q, by);
          g.lineTo(sx + rr + q, by);
          g.moveTo(sx, by - rr - q);
          g.lineTo(sx, by - rr + q);
          g.moveTo(sx, by + rr - q);
          g.lineTo(sx, by + rr + q);
          g.stroke();
          g.globalAlpha = 1;
        }
        if (d > 20 || e.boss) {
          const s = e.boss ? 10 : d > 70 ? 4.5 : 5.5,
            y = Math.max(12, sY);
          g.globalAlpha = e.bur ? 0.45 : 0.8;
          g.beginPath();
          g.moveTo(sx, y);
          g.lineTo(sx - s, y - s * 1.5);
          g.lineTo(sx + s, y - s * 1.5);
          g.closePath();
          g.fillStyle = elc(e.el);
          g.fill();
          g.lineWidth = 1.5;
          g.strokeStyle = 'rgba(0,0,0,.75)';
          g.stroke();
          if (e.boss) {
            g.lineWidth = 2;
            g.strokeStyle = '#fff';
            g.stroke();
          }
        }
        continue;
      }
    }
    const a = Math.atan2(cx, -dx * sy - dz * cy),
      k = ((Math.round((a / 6.2832) * MKN) % MKN) + MKN) % MKN,
      b = mkB[k];
    if (!b) mkB[k] = { d, el: e.el, n: 1, boss: !!e.boss };
    else {
      b.n++;
      if (e.boss) b.boss = true;
      if (d < b.d) {
        b.d = d;
        b.el = e.el;
      }
    }
  }
  const RX = Math.min(W * 0.27, 220),
    RY = H * 0.25;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 11px sans-serif';
  for (let k = 0; k < MKN; k++) {
    const b = mkB[k];
    if (!b) continue;
    const a = (k / MKN) * 6.2832,
      ux = Math.sin(a),
      uy = -Math.cos(a),
      x = W / 2 + ux * RX,
      y = H / 2 + uy * RY,
      s = b.boss ? 13 : b.d < 25 ? 11 : 9; // audit écran n° 20 : 9 px au moins, bien opaques, cernés de blanc puis de noir
    g.globalAlpha = 0.95;
    g.beginPath();
    g.moveTo(x + ux * s, y + uy * s);
    g.lineTo(x - ux * s * 0.6 - uy * s * 0.75, y - uy * s * 0.6 + ux * s * 0.75);
    g.lineTo(x - ux * s * 0.6 + uy * s * 0.75, y - uy * s * 0.6 - ux * s * 0.75);
    g.closePath();
    g.fillStyle = elc(b.el);
    g.fill();
    g.lineWidth = b.boss ? 4 : 3;
    g.strokeStyle = 'rgba(0,0,0,.85)';
    g.stroke();
    g.lineWidth = b.boss ? 2.5 : 1.5;
    g.strokeStyle = '#fff';
    g.stroke();
    if (b.n > 1) {
      g.globalAlpha = 1;
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(0,0,0,.85)';
      g.strokeText(b.n, x - ux * (s + 9), y - uy * (s + 9));
      g.fillStyle = '#fff';
      g.fillText(b.n, x - ux * (s + 9), y - uy * (s + 9));
    }
  }
  if (fxHp.size > sim.enemies.length + 60) for (const [k, r] of fxHp) if (r.s !== fxTick) fxHp.delete(k);
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i],
      a = (now - f.t0) / f.life;
    if (a >= 1) {
      floats.splice(i, 1);
      continue;
    }
    const dx = f.x - h.x,
      dy = f.y + a * 2.4 - ey,
      dz = f.z - h.z,
      cz = -dx * sy * cp + dy * sp - dz * cy * cp;
    if (cz < 0.5) continue;
    const x = W / 2 + (((dx * cy - dz * sy) / cz / tf) * H) / 2 + (f.ox || 0),
      y = H / 2 - (((dx * sy * sp + dy * cp + dz * cy * sp) / cz / tf) * H) / 2;
    if (x < -30 || x > W + 30 || y < -20 || y > H + 20) continue;
    const k = Math.max(0.6, Math.min(1.3, 24 / cz)) * (a < 0.12 ? 0.7 + a * 2.5 : 1);
    g.font = '700 ' + (f.size * k).toFixed(1) + "px 'Chakra Petch',sans-serif";
    g.globalAlpha = a < 0.65 ? 1 : (1 - a) / 0.35;
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,.8)';
    g.strokeText(f.txt, x, y);
    g.fillStyle = f.col;
    g.fillText(f.txt, x, y);
  }
  g.globalAlpha = 1;
}
