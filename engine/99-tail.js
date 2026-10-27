// ───────────────────────── measuring (contact, glass, camera speed) ─────────────────────────
function measure() {
  const out = { minBodyGlass: 1e9, minArmGlass: 1e9, worstArm: null, camMaxDegPerFrame: 0, camWorst: null, taps: [] };
  const pts = []; for (const x of [-BW / 2, BW / 2]) for (const y of [0.05, BH - 0.05]) for (const z of [-BD / 2, BD / 2]) pts.push(new THREE.Vector3(x * 0.92, y, z * 0.92));
  const O = new THREE.Vector3(0, 0, LID_Z); let prevQ = null;
  for (let f = 0; f <= NF; f++) {
    const t = f / FPS; setState(t);
    for (const c of CLAWDS) { if (c.noClamp) continue; c.root.updateMatrixWorld(true);
      for (const p of pts) { const w = c.body.localToWorld(p.clone().sub(new THREE.Vector3(0, BH / 2, 0))); const d = w.clone().sub(O).dot(SN); if (d < out.minBodyGlass) out.minBodyGlass = d; }
      for (const a of [c.armN, c.armF]) { const m = a.children[0]; for (const s of [0, 0.5, 1]) { const w = m.localToWorld(new THREE.Vector3(-0.1 + s * (L_ARM + 0.1), 0, 0)); const d = w.clone().sub(O).dot(SN) - R_NUB; if (d < out.minArmGlass) { out.minArmGlass = d; out.worstArm = [f, c.name]; } } } }
    const q = camera.quaternion.clone(); if (prevQ) { const a = 2 * Math.acos(clamp(Math.abs(prevQ.dot(q)), -1, 1)) / DEG; if (a > out.camMaxDegPerFrame) { out.camMaxDegPerFrame = a; out.camWorst = f; } } prevQ = q;
  }
  for (const c of CLAWDS) for (const tp of c.taps) { setState(tp.t); c.root.updateMatrixWorld(true); const tip = c.armN.children[0].localToWorld(new THREE.Vector3(L_ARM, 0, 0)); out.taps.push({ who: c.name, t: tp.t, err_cm: +tip.distanceTo(tp.sol.C).toFixed(4) }); }
  return out;
}
// ───────────────────────── API (contract: renderAt(t) is a pure function of t) ─────────────────────────
window.renderAt = (t) => { renderComposite(wrap(t), SUB, Math.round(t * FPS)); };
window.renderFrame = (f) => { renderComposite(f / FPS, SUB, f); return renderer.domElement.toDataURL('image/png'); };
window.renderAudio = renderAudio; window.measure = measure;
window.INFO = { clawds: CLAWDS.map(c => c.name), taps: CLAWDS.reduce((n, c) => n + c.taps.length, 0) };
window.READY = true;
if (TFIX != null) renderComposite(wrap(TFIX), SUB, Math.round(TFIX * FPS));
else if (!RENDER) { const t0 = performance.now(); const loop = () => { renderComposite(((performance.now() - t0) / 1000) % DUR, 1); requestAnimationFrame(loop); }; loop(); }
</script>
</body></html>
