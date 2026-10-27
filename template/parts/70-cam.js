// ───────────────────────── camera (vertical 9:16) ─────────────────────────
const ct = new Tracks();
function camKey(t, pos, tgt, opts = {}) { ct.pose(t, { cx: pos.x, cy: pos.y, cz: pos.z, tx: tgt.x, ty: tgt.y, tz: tgt.z, ap: opts.ap ?? 5, fx: opts.f.x, fy: opts.f.y, fz: opts.f.z }); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
{
  const tch = TP.clone().add(V(0, 0.9, 0));
  const base = [CAMPOS.clone(), V(0.9, 1.45, 3.0)], f0 = V(0.6, 1.0, 5.0);
  const sh = (dp, dt, f = f0, ap = 5) => [base[0].clone().add(dp), base[1].clone().add(dt), { f, ap }];
  const S1 = sh(V(0, 0, 0), V(0, 0.25, 0)), S2 = sh(V(-0.2, 0.1, -0.4), V(0, 0.15, 0)), S3 = sh(V(0, 2.6, -0.6), V(0.0, -0.55, 2.0), V(0.9, 0.9, 5.5)), S4 = sh(V(0.2, 3.1, -0.6), V(0.2, -0.65, 1.8), V(0.9, 0.9, 5.5)), S5 = sh(V(0.3, 0, -0.4), V(-0.1, 0.1, 0)), S6 = sh(V(0.2, 0.1, -0.6), V(0.3, 0.15, 0));
  camKey(0, ...S1); camKey(4.5, ...sh(V(0, -0.05, -0.5), V(0, 0.25, 0)));
  camKey(5.6, ...S2); camKey(9.5, ...sh(V(-0.2, 0.05, -0.9), V(0, 0.15, 0)));
  camKey(10.9, ...S3); camKey(15.6, ...sh(V(0, 2.55, -1.0), V(0, -0.55, 2.0), V(0.9, 0.9, 5.5)));
  camKey(16.6, ...S4); camKey(20.6, ...sh(V(0.2, 3.05, -1.0), V(0.2, -0.65, 1.8), V(0.9, 0.9, 5.5)));
  camKey(21.8, ...S5); camKey(25.6, ...sh(V(0.3, -0.05, -0.8), V(-0.1, 0.1, 0)));
  camKey(26.6, ...S6); camKey(28.9, ...sh(V(0.2, 0.05, -0.9), V(0.3, 0.15, 0)));
  camKey(DUR, ...S1);
  ct.build();
}
