// ───────────────────────── state at t (pure) ─────────────────────────
const KEYM = []; { const m = new THREE.Matrix4(); for (let i = 0; i < KEYS.count; i++) { KEYS.getMatrixAt(i, m); KEYM.push(m.clone()); } }
function setState(tIn) {
  const t = wrap(tIn);
  for (const c of CLAWDS) setClawd(c, t);
  { const m = new THREE.Matrix4(), tm = new THREE.Matrix4(); for (let i = 0; i < KEYS.count; i++) { let pr = 0; for (const [tk, k] of KEYHITS) if (k === i) pr = Math.max(pr, bump(tk - 0.015, tk + 0.16, t)); m.copy(KEYM[i]); if (pr > 0) m.premultiply(tm.makeTranslation(0, -0.05 * pr, 0)); KEYS.setMatrixAt(i, m); } KEYS.instanceMatrix.needsUpdate = true; }
  const L = drawWidget(t);
  placeRect(cardLight, L.u, L.v, L.w, L.h); cardLight.intensity = L.i; dlgLight.intensity = 0;
  camera.position.set(ct.get('cx', t), ct.get('cy', t), ct.get('cz', t));
  camera.lookAt(ct.get('tx', t), ct.get('ty', t), ct.get('tz', t));
  { const w = 2 * Math.PI / DUR; camera.rotateX((0.1 * Math.sin(9 * w * t + 0.7) + 0.05 * Math.sin(17 * w * t + 2.1)) * DEG); camera.rotateY((0.09 * Math.sin(7 * w * t + 1.3) + 0.04 * Math.sin(19 * w * t)) * DEG); camera.rotateZ(0.05 * Math.sin(5 * w * t + 0.4) * DEG); }
  camera.updateMatrixWorld();
  updateProps(t); updateBubbles(t);
  const f = V(ct.get('fx', t), ct.get('fy', t), ct.get('fz', t)).applyMatrix4(camera.matrixWorldInverse);
  POST.focus = -f.z; POST.ap = ct.get('ap', t);
  return t;
}
