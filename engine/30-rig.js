// ───────────────────────── Clawd rig, many of them ─────────────────────────
const clayBump = (() => { const [t, g, c] = noiseTex(21, 1024, (x, y, rnd) => 0.5 + (rnd() - 0.5) * 0.35); const rr = mulberry32(22);
  g.globalCompositeOperation = 'overlay'; for (let i = 0; i < 14; i++) { const x = rr() * 1024, y = rr() * 1024, R = 30 + rr() * 50; g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2.5; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(x, y, R - k * 3.4, (R - k * 3.4) * 0.72, rr(), 0, 6.28); g.stroke(); } }
  g.filter = 'blur(1.2px)'; g.drawImage(c, 0, 0); g.filter = 'none'; t.needsUpdate = true; t.repeat.set(1.5, 1.5); return t; })();
const clay = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#e08b6b'), roughness: 0.58, roughnessMap: clayBump, bumpMap: clayBump, bumpScale: 0.3, sheen: 0.55, sheenColor: new THREE.Color('#ffc4a6'), sheenRoughness: 0.6, clearcoat: 0.05, clearcoatRoughness: 0.6, envMap: envTex, envMapIntensity: 0.4 });
const FCW = 1024, FCH = 536;
const capG = new THREE.CapsuleGeometry(R_NUB, L_ARM - R_NUB + 0.1, 8, 20); capG.rotateZ(-Math.PI / 2);
capG.computeBoundingBox(); capG.translate(L_ARM + R_NUB - capG.boundingBox.max.x, 0, 0);
const legG = (() => { const LR = 0.075, g = new THREE.CapsuleGeometry(LR, LEGH - LR * 2 + 0.12, 6, 16); g.translate(0, (LEGH - LR * 2 + 0.12) / 2 + LR, 0); return g; })();
const XAX = new THREE.Vector3(1, 0, 0), NXAX = new THREE.Vector3(-1, 0, 0), GO = new THREE.Vector3(0, 0, LID_Z);
const FWD_N = new THREE.Vector3(-0.2, -0.5, 1).normalize(), FWD_F = new THREE.Vector3(0.2, -0.5, 1).normalize();
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpD = new THREE.Vector3();
const CLAWDS = [];
function makeClawd(name, o = {}) {
  const c = { name, tr: new Tracks(), taps: [], keyhits: [], swaps: o.swaps ?? [], expr: [[0, 'neutral']], gaze: [[0, 0, 0]], blinks: o.blinks ?? [], talk: o.talk ?? null, acc: {} };
  c.root = new THREE.Group(); scene.add(c.root);
  c.bodyPivot = new THREE.Group(); c.root.add(c.bodyPivot);
  c.body = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 8, 0.15), clay); c.body.position.y = BH / 2; c.body.castShadow = true; c.bodyPivot.add(c.body);
  [c.fc, c.fctx, c.ftex] = canvasTex(FCW, FCH);
  c.face = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.68), new THREE.MeshPhysicalMaterial({ map: c.ftex, emissiveMap: c.ftex, emissive: new THREE.Color(0.32, 0.31, 0.3), transparent: true, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15, envMap: envTex, envMapIntensity: 0.5, depthWrite: false }));
  c.face.position.set(0, BH / 2, BD / 2 + 0.003); c.face.layers.set(1); c.bodyPivot.add(c.face);
  const mkArm = sign => { const p = new THREE.Group(); p.position.set(sign * SH.x, SH.y, SH.z); const m = new THREE.Mesh(capG, clay); m.castShadow = true; if (sign < 0) m.scale.x = -1; p.add(m); c.bodyPivot.add(p); return p; };
  c.armN = mkArm(1); c.armF = mkArm(-1);
  c.legs = [[-0.52, 0], [-0.29, 0], [0.29, 0], [0.52, 0]].map(([x, z]) => { const m = new THREE.Mesh(legG, clay); m.position.set(x, 0, z); m.castShadow = true; c.root.add(m); return m; });
  c.sweat = new THREE.Mesh(sweatG, sweatM); c.bodyPivot.add(c.sweat); c.sweat.visible = false;
  CLAWDS.push(c); return c;
}
const sweatG = (() => { const g = new THREE.SphereGeometry(0.055, 20, 14), pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > 0) { const k = 1 - y / 0.055; pos.setX(i, pos.getX(i) * (0.25 + 0.75 * k)); pos.setZ(i, pos.getZ(i) * (0.25 + 0.75 * k)); pos.setY(i, y * 1.9); } } g.computeVertexNormals(); return g; })();
const sweatM = new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.04, clearcoat: 1, envMap: envTex, envMapIntensity: 1.2, emissive: 0x3a6a90, emissiveIntensity: 0.4 });
// per-clawd keyframing helpers
const V3 = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
const wind = (Dl, k = 0.45) => new THREE.Vector3().copy(REST_N).lerp(Dl, k).add(new THREE.Vector3(0, -0.15, 0)).normalize();
function arm(c, t, d, ext, pre = 'n') { c.tr.pose(t, { [pre + 'x']: d.x, [pre + 'y']: d.y, [pre + 'z']: d.z, [pre + 'e']: ext }); }
function arms(c, t, dn, df, en = 1, ef = 1) { arm(c, t, dn, en); arm(c, t, df, ef, 'f'); }
function at(c, t, P, yaw) { c.tr.pose(t, { px: P.x, pz: P.z, yaw }); }
function addTap(c, tp) {
  const { t: tc, sol } = tp, Dl = sol.Dl, pre = 0.22, tr = c.tr;
  at(c, tc - 0.1, sol.P, sol.yaw); at(c, tc + 0.06, sol.P, sol.yaw);
  arm(c, tc - pre, REST_N, REST_EXT); tr.pose(tc - pre, { hop: 0, ls: 1, sq: 1, lean: 0, gy: 0 });
  arm(c, tc - pre * 0.5, wind(Dl), 0.86); tr.pose(tc - pre * 0.5, { sq: 0.93 });
  tr.pose(tc, { hop: sol.hop, ls: sol.ls, sq: 1, lean: 0, roll: 0 }); arm(c, tc, Dl, sol.ext);
  tr.pose(tc + 0.05, { hop: sol.hop, ls: sol.ls, sq: 1, lean: 0, roll: 0 }); arm(c, tc + 0.05, Dl, sol.ext * 0.985);
  tr.pose(tc + 0.2, { ls: 1, hop: 0, sq: 0.96 }); arm(c, tc + 0.2, V3(0.3, 0.55, 0.78), 1.03);
  tr.pose(tc + 0.32, { sq: 1 }); arm(c, tc + 0.34, REST_N, REST_EXT);
  c.taps.push(tp);
}
function hop(c, t0, t1, P0, P1, g0, g1, h, yaw, o = {}) {
  const tr = c.tr;
  if (!o.quick) { tr.pose(t0 - 0.12, { sq: 1 }); tr.pose(t0 - 0.05, { sq: 0.86 }); }
  tr.pose(t0, { px: P0.x, pz: P0.z, hop: 0, gy: g0, sq: 1.08, yaw });
  tr.pose((t0 + t1) / 2, { px: (P0.x + P1.x) / 2, pz: (P0.z + P1.z) / 2, hop: h, gy: (g0 + g1) / 2, sq: 1.04 });
  tr.pose(t1, { px: P1.x, pz: P1.z, hop: 0, gy: g1, sq: 1.0, yaw });
  tr.pose(t1 + 0.06, { sq: o.land ?? 0.86 });
  if (!o.quick) { tr.pose(t1 + 0.16, { sq: 1.04 }); tr.pose(t1 + 0.26, { sq: 1 }); }
  if (o.armsUp !== false) { if (o.keepF) { arm(c, (t0 + t1) / 2, V3(0.7, 0.55, 0.2), 0.9); arm(c, t1 + 0.05, V3(1, -0.55, 0.1), REST_EXT); } else { arms(c, (t0 + t1) / 2, V3(0.7, 0.55, 0.2), V3(-0.7, 0.55, 0.2), 0.9, 0.9); arms(c, t1 + 0.05, V3(1, -0.55, 0.1), V3(-1, -0.55, 0.1), REST_EXT, REST_EXT); } }
  if (g1 > 0.01 && o.key != null) c.keyhits.push([t1, o.key]);
}
const dip = (c, ts) => { c.tr.pose(ts + 0.26, { sq: 1 }); c.tr.pose(ts + 0.34, { sq: 0.88 }); c.tr.pose(ts + 0.46, { sq: 1.04 }); c.tr.pose(ts + 0.58, { sq: 1 }); };
function finishClawd(c) {
  c.tr.build();
  const LUT_HZ = 240, N = DUR * LUT_HZ + 1, d = new Float32Array(N); let px = c.tr.get('px', 0), pz = c.tr.get('pz', 0);
  for (let i = 1; i < N; i++) { const t = i / LUT_HZ, x = c.tr.get('px', t), z = c.tr.get('pz', t); d[i] = d[i - 1] + Math.hypot(x - px, z - pz); px = x; pz = z; }
  c.distAt = t => { const f = clamp(t * LUT_HZ, 0, N - 1), i = Math.floor(f); return lerp(d[i], d[Math.min(i + 1, N - 1)], f - i); };
  c.speedAt = t => (c.distAt(Math.min(t + 0.02, DUR)) - c.distAt(Math.max(t - 0.02, 0))) / 0.04;
  c.rootY = t => c.tr.get('hop', t) + c.tr.get('gy', t) + LEGH * ((c.tr.get('ls', t) || 1) - 1);
  c.expr.sort((a, b) => a[0] - b[0]); c.gaze.sort((a, b) => a[0] - b[0]);
  for (let i = c.gaze.length - 1; i > 0; i--) if (c.gaze[i][0] - c.gaze[i - 1][0] < 1e-3) c.gaze.splice(i, 1);
  c.gzx = mono(c.gaze.map(g => [g[0], g[1]]).concat([[DUR, c.gaze[0][1]]])); c.gzy = mono(c.gaze.map(g => [g[0], g[2]]).concat([[DUR, c.gaze[0][2]]]));
  const r = mulberry32(31 + CLAWDS.indexOf(c) * 7); c.sacc = []; for (let t = 0.2; t < DUR - 0.2; t += 0.45 + r() * 0.5) c.sacc.push([t, (r() - 0.5) * 0.09, (r() - 0.5) * 0.06]);
}
function inertiaAt(c, t) {
  let rx = 0, rz = 0; const dt = 1 / 120, X = tt => c.tr.get('px', wrap(tt)), Z = tt => c.tr.get('pz', wrap(tt));
  for (let k = 1; k <= 40; k++) { const tau = k * dt, tt = t - tau, w = Math.exp(-6.5 * tau) * Math.sin(12 * tau) * dt;
    rx += (X(tt + dt) - 2 * X(tt) + X(tt - dt)) / (dt * dt) * w; rz += (Z(tt + dt) - 2 * Z(tt) + Z(tt - dt)) / (dt * dt) * w; }
  return [rx * 0.05, rz * 0.05];
}
function swingAt(c, t) {
  let r = 0; const dt = 1 / 120;
  for (let k = 1; k <= 36; k++) { const tau = k * dt, tt = wrap(t - tau); const a = (c.rootY(wrap(tt + dt)) - 2 * c.rootY(tt) + c.rootY(wrap(tt - dt))) / (dt * dt); r += a * Math.exp(-7 * tau) * Math.sin(16 * tau) * dt; }
  return clamp(r * 0.09, -0.7, 0.7);
}
function armClear(pivot) { const m = pivot.children[0]; let w = 1e9; for (const s of [0.45, 0.75, 1]) { const p = m.localToWorld(tmpV2.set(s * L_ARM, 0, 0)); w = Math.min(w, p.sub(GO).dot(SN) - R_NUB); } return w; }
function clampArm(c, pivot, sign) {
  c.root.updateMatrixWorld(true);
  if (armClear(pivot) >= -0.004) return;
  const ax = sign > 0 ? XAX : NXAX, d0 = ax.clone().applyQuaternion(pivot.quaternion), fwd = sign > 0 ? FWD_N : FWD_F;
  let lo = 0, hi = 1;
  for (let i = 0; i < 12; i++) { const k = (lo + hi) / 2; tmpD.copy(d0).lerp(fwd, k).normalize(); pivot.quaternion.setFromUnitVectors(ax, tmpD); pivot.updateMatrixWorld(true); if (armClear(pivot) >= -0.002) hi = k; else lo = k; }
  tmpD.copy(d0).lerp(fwd, hi).normalize(); pivot.quaternion.setFromUnitVectors(ax, tmpD); pivot.updateMatrixWorld(true);
}
// expressions
const PRESET = {
  neutral: { open: 1, white: 0, pupil: 1, browA: 0, lid: 0, mW: 0.5, mO: 0, teeth: 0, squint: 0, smile: 0 },
  smug: { open: 1.0, lid: 0.38, squint: 0.12, browA: -0.12, smile: 0.5 },
  surprised: { open: 1.25, mO: 0.5, mW: 0.35 },
  determined: { open: 0.86, lid: 0.25, browA: 0.42 },
  reading: { open: 0.86, lid: 0.18, browA: -0.05 },
  happy: { open: 0.62, squint: 0.55, smile: 1 },
  thinking: { open: 0.9, lid: 0.28, browA: -0.18 },
  focused: { open: 0.8, lid: 0.3, browA: 0.22 },
  worried: { open: 1.1, browA: -0.36, mO: 0.14, mW: 0.2 },
  teach: { open: 1.0, lid: 0.08, smile: 0.55 },
  proud: { open: 0.75, squint: 0.3, smile: 0.9 },
};
const EXKEYS = Object.keys(PRESET.neutral);
function exprAt(c, t) {
  const E2 = c.expr; let i = 0; while (i + 1 < E2.length && E2[i + 1][0] <= t) i++;
  const cur = E2[i], prev = E2[(i - 1 + E2.length) % E2.length];
  const dur = cur[2] ?? 0.22, k = i === 0 ? 1 : s5(cur[0], cur[0] + dur, t);
  const a = { ...PRESET.neutral, ...PRESET[prev[1]] }, b = { ...PRESET.neutral, ...PRESET[cur[1]] }, o = {};
  for (const n of EXKEYS) o[n] = lerp(a[n], b[n], k);
  let bl = 0; for (const b0 of c.blinks) bl = Math.max(bl, bump(b0, b0 + 0.14, t));
  o.open *= 1 - 0.95 * bl;
  const S = c.sacc; let si = S.length - 1; for (let j = 0; j < S.length; j++) if (S[j][0] <= t) si = j;
  const sp0 = S[(si - 1 + S.length) % S.length], sp1 = S[si], sk = s5(sp1[0], sp1[0] + 0.035, t < S[0][0] ? t + DUR : t);
  o.gx = c.gzx(t) + lerp(sp0[1], sp1[1], sk); o.gy = c.gzy(t) + lerp(sp0[2], sp1[2], sk);
  o.gulp = 0; o.sweat = c.sweatAt ? c.sweatAt(t) : 0; o.sweatSlide = c.sweatSlideAt ? c.sweatSlideAt(t) : 0;
  if (c.talk) { const v = c.talk(t); o.talk = v; }
  return o;
}
function drawFace(c, p) {
  const g = c.fctx; g.clearRect(0, 0, FCW, FCH);
  const ink = '#141212', ex = [512 - 318, 512 + 318], ey = 172 + p.gy * 22, gxo = p.gx * 30;
  for (let s = 0; s < 2; s++) {
    const inner = s === 0 ? 1 : -1, cx = ex[s] + gxo, cy = ey, op = clamp(p.open, 0.04, 1.35);
    const ew = 92 * (1 + 0.1 * (p.open - 1)) * (1 + 0.15 * p.white), eh = 190 * op, top = cy - 95 * Math.min(op, 1.35);
    const slant = (p.browA * 70 + p.lid * 10) * inner, lidY = top + eh * p.lid * 0.55;
    g.save();
    rrect(g, cx - ew / 2, cy - eh / 2, ew, Math.max(eh, 6), Math.min(ew / 2, eh / 2, 44)); g.clip();
    if (p.lid > 0.01 || Math.abs(p.browA) > 0.01) { g.beginPath(); g.moveTo(cx - 120, lidY - slant); g.lineTo(cx + 120, lidY + slant); g.lineTo(cx + 120, cy + 300); g.lineTo(cx - 120, cy + 300); g.closePath(); g.clip(); }
    if (p.squint > 0.01) { g.beginPath(); g.rect(cx - 120, cy - 300, 240, 300 + eh / 2 - eh * p.squint * 0.5); g.clip(); }
    g.fillStyle = ink; g.fillRect(cx - 120, cy - 300, 240, 600);
    g.fillStyle = 'rgba(255,255,255,0.85)'; rrect(g, cx - ew * 0.3, cy - eh * 0.36, ew * 0.22, Math.max(4, eh * 0.18), 10); g.fill();
    g.restore();
  }
  const mx = 512 + p.gx * 18, my = 392 + p.gy * 12, mw = 70 + 230 * p.mW;
  g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  const talk = p.talk ?? 0;
  if (talk > 0.06) { // speaking: the mouth follows the voice
    const oh = 14 + 80 * talk, ow = 60 + 70 * (0.6 + 0.4 * Math.sin(talk * 9));
    g.fillStyle = ink; rrect(g, mx - ow / 2, my - oh / 2 + 6, ow, oh, Math.min(ow, oh) / 2); g.fill();
    g.fillStyle = '#c4473a'; g.beginPath(); g.ellipse(mx, my + oh * 0.28 + 6, ow * 0.28, oh * 0.2, 0, 0, 7); g.fill();
  } else if (p.teeth > 0.5) {
    const tw = mw, th = 64; g.fillStyle = '#fbfaf7'; g.lineWidth = 12; rrect(g, mx - tw / 2, my - th / 2, tw, th, 26); g.fill(); g.stroke();
  } else if (p.mO > 0.04) {
    g.fillStyle = ink; g.beginPath(); g.ellipse(mx, my, 18 + 34 * p.mW, 8 + 58 * p.mO, 0, 0, Math.PI * 2); g.fill();
  } else if (p.smile > 0.1) {
    g.lineWidth = 15; g.globalAlpha = Math.min(1, p.smile); g.beginPath(); g.moveTo(mx - 52, my - 8); g.quadraticCurveTo(mx, my + 34, mx + 52, my - 8); g.stroke(); g.globalAlpha = 1;
  }
  c.ftex.needsUpdate = true;
}
// accessories
const eyeY = BH / 2 + (FCH / 2 - 172) / FCH * 0.68, eyeX = 318 / FCW * 1.3, fz = BD / 2;
const AM = (o) => new THREE.MeshPhysicalMaterial({ envMap: envTex, envMapIntensity: 0.6, ...o });
const ACC_BUILD = {
  glasses: g => { const fr = AM({ color: 0x121212, roughness: 0.25, clearcoat: 0.8 }), gl = AM({ color: 0xcfe8ff, roughness: 0.03, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false });
    for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 12, 40), fr); ring.position.set(s * eyeX, eyeY, fz + 0.07); g.add(ring);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.165, 40), gl); lens.position.set(s * eyeX, eyeY, fz + 0.068); g.add(lens);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, BD * 0.8), fr); temple.position.set(s * (BW / 2 + 0.01), eyeY + 0.02, fz - BD * 0.36); g.add(temple);
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(BW / 2 - eyeX - 0.15, 0.025, 0.025), fr); hinge.position.set(s * (eyeX + 0.17 + (BW / 2 - eyeX - 0.17) / 2), eyeY + 0.02, fz + 0.07); g.add(hinge); }
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(eyeX - 0.17, 0.018, 8, 24, Math.PI), fr); bridge.scale.set(1, 0.35, 1); bridge.position.set(0, eyeY + 0.02, fz + 0.07); g.add(bridge); },
  hardhat: g => { const ym = AM({ color: 0xf5b301, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), ym); dome.scale.set(1.2, 1.0, 1.0); dome.position.y = BH - 0.04; g.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.04, 48), ym); brim.scale.set(1.3, 1, 1.12); brim.position.set(0, BH - 0.03, 0.08); g.add(brim);
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.045, 10, 40, Math.PI), ym); ridge.rotation.y = Math.PI / 2; ridge.position.y = BH - 0.04; g.add(ridge); },
  phones: g => { const dk = AM({ color: 0x23252b, roughness: 0.38, clearcoat: 0.4 }), or = AM({ color: 0xe8743b, roughness: 0.35, emissive: 0x3a1408 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(BW / 2 + 0.06, 0.055, 14, 60, Math.PI), dk); band.scale.set(1, 0.62, 1); band.position.set(0, 0.74, -0.05); g.add(band);
    for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.16, 32), dk); cup.rotation.z = Math.PI / 2; cup.position.set(s * (BW / 2 + 0.09), 0.74, -0.05); g.add(cup);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 32), or); ring.rotation.y = Math.PI / 2; ring.position.set(s * (BW / 2 + 0.175), 0.74, -0.05); g.add(ring); } },
  goggles: g => { const strap = AM({ color: 0x2f9e6a, roughness: 0.7 }), rim = AM({ color: 0x7ee2b0, roughness: 0.25, transparent: true, opacity: 0.85 });
    const band = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.04, 0.13, BD + 0.04), strap); band.position.y = eyeY; g.add(band);
    for (const s of [-1, 1]) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.13, 32, 1, true), rim); cup.rotation.x = Math.PI / 2; cup.position.set(s * eyeX, eyeY, fz + 0.075); g.add(cup); } },
  helmet: g => { const nv = AM({ color: 0x1e3a8a, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.12 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), nv); dome.scale.set(1.3, 0.85, 1.06); dome.position.y = BH - 0.06; g.add(dome);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.42, 48, 1, true, -0.95, 1.9), AM({ color: 0x5fd0ff, roughness: 0.05, transparent: true, opacity: 0.32, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, emissive: 0x0b3a52 }));
    visor.scale.set(1.15, 1, 0.75); visor.position.set(0, eyeY + 0.04, -0.02); g.add(visor);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), AM({ color: 0x4ade80, emissive: 0x0c4d26, roughness: 0.3 })); badge.position.set(0, BH + 0.32, 0.5); badge.rotation.x = -0.55; g.add(badge); },
  cap: g => { const cm = AM({ color: 0x1b1c22, roughness: 0.75 }), om = AM({ color: 0xe8743b, roughness: 0.5 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.58, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), cm); dome.scale.set(1.22, 0.62, 1.0); dome.position.y = BH - 0.03; g.add(dome);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.55), cm); brim.position.set(0, BH - 0.01, -0.78); brim.rotation.x = -0.12; g.add(brim);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), om); btn.position.y = BH + 0.33; g.add(btn); },
  mortar: g => { const bk = AM({ color: 0x15151a, roughness: 0.6, sheen: 0.3 }), gold = AM({ color: 0xf2b84b, roughness: 0.35, metalness: 0.4, emissive: 0x2a1a00 });
    const capB = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.26, 40), bk); capB.scale.set(1.2, 1, 1.0); capB.position.y = BH + 0.08; g.add(capB);
    const board = new THREE.Mesh(new RoundedBoxGeometry(1.75, 0.06, 1.75, 2, 0.02), bk); board.position.y = BH + 0.24; board.rotation.y = 0.785; board.rotation.z = 0.06; g.add(board);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), gold); btn.position.y = BH + 0.29; g.add(btn);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 8), gold); tassel.position.set(0.62, BH + 0.06, 0.62); g.add(tassel);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 10), gold); tip.position.set(0.62, BH - 0.36, 0.62); g.add(tip);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6), gold); cord.position.set(0.31, BH + 0.28, 0.31); cord.rotation.set(Math.PI / 2, 0, 0); cord.lookAt(new THREE.Vector3(0.62, BH + 0.28, 0.62)); cord.rotateX(Math.PI / 2); g.add(cord); },
};
function addAcc(c, name) { const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); c.bodyPivot.add(outer); ACC_BUILD[name](inner); inner.traverse(o => { if (o.isMesh) o.castShadow = true; }); c.acc[name] = { outer, inner }; }
function accState(c, name, t) {
  if (!c.swaps.length) return { vis: true, y: 0, rz: 0, sy: 1, s: 1, x: 0 };
  let dIn = 1e9, dOut = 1e9;
  for (const [ts, out, inn] of c.swaps) { const d = ((t - ts) % DUR + DUR) % DUR; if (inn === name) dIn = Math.min(dIn, d); if (out === name) dOut = Math.min(dOut, d); }
  if (dIn < dOut) { const fall = dIn < 0.3 ? 1.5 * (1 - (dIn / 0.3) ** 2) : 0, b = dIn >= 0.3 && dIn < 0.8 ? 0.11 * Math.abs(Math.sin((dIn - 0.3) / 0.2 * Math.PI)) * Math.exp(-(dIn - 0.3) * 7) : 0;
    return { vis: true, y: fall + b, rz: dIn < 0.3 ? (1 - dIn / 0.3) * 0.5 : 0, sy: 1 - 0.18 * bump(0.3, 0.42, dIn), s: 1, x: 0 }; }
  if (dOut < 0.6) return { vis: true, y: 3.2 * dOut - 3.2 * dOut * dOut + 0.2 * dOut, rz: -7 * dOut, sy: 1, s: 1 - s5(0.25, 0.58, dOut), x: 1.1 * dOut };
  return { vis: false };
}
// held props (magnifier, pointer) live at the near nub tip
function holdProp(c, build) { const g = new THREE.Group(); build(g); g.position.x = L_ARM + R_NUB * 0.4; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); c.armN.children[0].add(g); return g; }
const buildMag = g => { const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.32, 16), AM({ color: 0x5b3a22, roughness: 0.45, clearcoat: 0.5 })); handle.rotation.z = Math.PI / 2; handle.position.x = 0.16; g.add(handle);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 12, 48), AM({ color: 0xd8c27a, metalness: 1, roughness: 0.25 })); ring.rotation.y = Math.PI / 2; ring.position.x = 0.54; g.add(ring);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.215, 40), AM({ color: 0xe8f6ff, roughness: 0, transparent: true, opacity: 0.18, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide })); lens.rotation.y = Math.PI / 2; lens.position.x = 0.54; g.add(lens); };
const buildPointer = g => { const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 1.7, 12), AM({ color: 0x8a5a33, roughness: 0.45, clearcoat: 0.6 })); stick.rotation.z = -Math.PI / 2; stick.position.x = 0.8; g.add(stick);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), AM({ color: 0xe8743b, roughness: 0.3, emissive: 0x5a2008 })); tip.position.x = 1.66; g.add(tip); };
// per-frame pose of one clawd
function setClawd(c, t) {
  const tr = c.tr, px = tr.get('px', t), pz = tr.get('pz', t), yaw = tr.get('yaw', t), hp = tr.get('hop', t), gy = tr.get('gy', t), ls = tr.get('ls', t) || 1, sq0 = tr.get('sq', t) || 1;
  let cw = 0; for (const tp of c.taps) cw = Math.max(cw, 1 - s5(0.1, 0.32, Math.abs(t - tp.t)));
  const breathe = 1 + 0.012 * Math.sin(2 * Math.PI * t / 3.0 + CLAWDS.indexOf(c)) * (1 - cw);
  const dt2 = 1 / 120, vy = (c.rootY(wrap(t + dt2)) - c.rootY(wrap(t - dt2))) / (2 * dt2);
  const sq = sq0 * breathe * (1 + clamp(vy * 0.025, -0.07, 0.07) * (1 - cw));
  const sp = c.speedAt(t), walk = clamp(sp / 0.5, 0, 1) * (hp < 0.03 ? 1 : 0), ph = c.distAt(t) / 0.16 * Math.PI;
  let press = 0; for (const [tk] of c.keyhits) press = Math.max(press, bump(tk - 0.015, tk + 0.16, t));
  const bob = 0.03 * Math.abs(Math.sin(ph)) * walk, sink = gy > 0.04 ? 0.045 * press * (hp < 0.05 ? 1 : 0) : 0;
  c.root.position.set(px, gy + hp + bob - sink + (c.baseY ?? 0), pz);
  c.root.rotation.set(0, yaw * DEG, 0);
  c.legs.forEach((l, i) => { const lift = Math.max(0, Math.sin(ph + (i % 2 ? Math.PI : 0))) * 0.07 * walk; l.scale.set(1, ls - lift / LEGH, 1); l.position.y = lift; });
  c.bodyPivot.position.y = LEGH * ls;
  c.bodyPivot.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  const [ix, iz] = inertiaAt(c, t), yr = yaw * DEG, fwd = ix * Math.sin(yr) + iz * Math.cos(yr), side = ix * Math.cos(yr) - iz * Math.sin(yr);
  const leanP = clamp(-fwd * 12, -8, 8) * (1 - cw), rollP = clamp(side * 10, -7, 7) * (1 - cw) + 2.2 * Math.sin(ph) * walk;
  c.bodyPivot.rotation.set((tr.get('lean', t) + leanP) * DEG, 0, (tr.get('roll', t) + rollP) * DEG);
  const sw = swingAt(c, t);
  tmpV.set(tr.get('nx', t), tr.get('ny', t), tr.get('nz', t)).normalize(); c.armN.quaternion.setFromUnitVectors(XAX, tmpV); c.armN.rotateZ(sw * (1 - cw)); c.armN.scale.set(tr.get('ne', t) || 1, 1, 1);
  tmpV.set(tr.get('fx', t), tr.get('fy', t), tr.get('fz', t)).normalize(); c.armF.quaternion.setFromUnitVectors(NXAX, tmpV); c.armF.rotateZ(-sw); c.armF.scale.set(tr.get('fe', t) || 1, 1, 1);
  if (!c.noClamp) { clampArm(c, c.armN, 1); clampArm(c, c.armF, -1); }
  for (const n in c.acc) { const st = accState(c, n, t), a = c.acc[n]; a.outer.visible = st.vis; if (!st.vis) continue; a.inner.position.set(st.x, st.y, 0); a.inner.rotation.set(0, 0, st.rz); a.inner.scale.set(st.s, st.s * st.sy, st.s); }
  if (c.props) c.props(t);
  const p = exprAt(c, t); drawFace(c, p);
  c.sweat.visible = p.sweat > 0.01; c.sweat.scale.setScalar(Math.max(0.01, p.sweat)); c.sweat.position.set(0.62, 0.9 - 0.2 * p.sweatSlide, BD / 2 + 0.03);
}
