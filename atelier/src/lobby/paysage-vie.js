// [lobby/paysage-vie.js] Le paysage : reconstruction quand l'île change, et sa vie à chaque image.
// ---- reconstruction et vie
function payTheme() {
  if (!PAY) return;
  const th = LB.env || 1;
  if (PAY.th === th) return;
  const P = PAY,
    F = PFX[th];
  P.th = th;
  P.rivU.sp.value = F.sp;
  P.rivU.op.value = F.op;
  P.rivU.ice.value = F.ice;
  P.rivU.cA.value = V3(F.a);
  P.rivU.cB.value = V3(F.b);
  payScatterMake(th);
  while (P.flots.length) P.root.remove(P.flots.pop().g);
  paySky();
  P.sig = '';
  P.dirty = 0.01;
}
function payBuild() {
  const P = PAY;
  if (!P.th) return;
  payRoads();
  payRivers();
  payCave();
  payScatter();
  payFlots();
  payMon();
  const sig =
    P.th +
    '|' +
    save.vil
      .filter(B => CAT[B.t].up)
      .map(B => B.id)
      .join();
  if (sig !== P.sig) {
    P.sig = sig;
    pnjMake();
  }
}
function payTick(dt, t) {
  const P = PAY;
  if (!P) return;
  if (!P.th) payTheme();
  if (P.dirty > 0) {
    P.dirty -= Math.max(0, Math.min(0.1, dt));
    if (P.dirty <= 0) {
      P.dirty = 0;
      try {
        payBuild();
      } catch (e) {
        if (!P.err) {
          P.err = 1;
          console.error('paysage', e);
        }
      }
    }
  }
  P.rivU.t.value = t;
  if (Math.hypot(LB.x - P.sx, LB.z - P.sz) > 14 && P.val.length) payScatterShow();
  for (const F of P.flots) {
    const a = F.a + t * 0.035;
    const fr = MASS.r * 0.5 + F.r;
    F.g.position.set(
      MASS.x + Math.cos(a) * fr,
      MASS.h * 0.9 + F.h + Math.sin(t * 0.5 + F.ph) * 0.8,
      MASS.z + Math.sin(a) * fr
    );
    F.g.rotation.y = a * 0.6 + F.ph;
  }
  P.monG.position.y = P.monY + Math.sin(t * 0.3) * 0.7;
  P.skyG.rotation.y = t * 0.004;
  P.skyR.rotation.z = t * 0.01;
  pnjTick(dt, t);
}
