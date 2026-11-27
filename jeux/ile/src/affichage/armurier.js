// [affichage/armurier.js] L'étal du marchand d'armes (V2.0) : à 12 m du cœur, loin des chemins et des autres étals. On s'en approche, le bouton « Armes » apparaît (interface/arsenal.js).
const ARMP = (() => {
  let b = [-9, 7],
    bd = -1;
  for (let i = 0; i < 32; i++) {
    const a = i * 0.19635 + 0.07,
      x = Math.cos(a) * 12,
      z = Math.sin(a) * 12,
      dd = Math.min(
        distPaths(x, z),
        Math.hypot(x - SHOP[0], z - SHOP[1]) / 2.2,
        Math.hypot(x - HIREP[0], z - HIREP[1]) / 2.2,
        Math.hypot(x - RULEP[0], z - RULEP[1]) / 2.2
      );
    if (!HILL[cellOf(x, z)] && dd > bd) {
      bd = dd;
      b = [x, z];
    }
  }
  return b;
})();
{
  const ry = Math.atan2(ARMP[0], ARMP[1]),
    c = Math.cos(ry),
    s = Math.sin(ry),
    at = (u, v) => [ARMP[0] + u * c + v * s, ARMP[1] - u * s + v * c];
  // la place est dégagée pour de bon (les buissons semés au hasard n'y reviennent pas à la partie suivante)
  for (const [i, l] of DEC)
    for (let k = l.length - 1; k >= 0; k--)
      if (Math.hypot(l[k].x - ARMP[0], l[k].z - ARMP[1]) < 4.2) {
        hideDec(l[k]);
        l.splice(k, 1);
      }
  {
    const q = at(0, 0.9);
    put('set.ratelier', q[0], 0, q[1], ry);
  }
  {
    const q = at(0, -0.35);
    put('pnj.armurier', q[0], 0, q[1], ry, {}, 'armurier');
  }
  {
    const q = at(-2.2, -0.3);
    put('set.lanterne', q[0], 0, q[1], ry);
  }
  const l = label('ARMES', '#ff9a5a');
  l.scale.set(2.8, 0.7, 1);
  l.position.set(ARMP[0], 4.1, ARMP[1]);
  scene.add(l);
  SOL.push([ARMP[0], ARMP[1], 1.6, 4]);
}
