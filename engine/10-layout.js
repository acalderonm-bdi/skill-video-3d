// ───────────────────────── layout (cm) ─────────────────────────
const TILT = 15 * DEG, LID_Z = -0.05;
const SN = new THREE.Vector3(0, Math.sin(TILT), Math.cos(TILT));
const scr = (u, v, off = 0) => new THREE.Vector3(u, v * Math.cos(TILT), LID_Z - v * Math.sin(TILT)).addScaledVector(SN, off);
const toUV = p => [p.x, p.y / Math.cos(TILT)];
const DISP = { u0: -14.3, u1: 14.3, v0: 0.35, v1: 18.9 };
const WG = { u0: -4.6, v0: 0.36, w: 11.2, h: 7.04 };
const WCW = 4096, WPX = WCW / WG.w, WCH = Math.round(WG.h * WPX);
const wx = u => (u - WG.u0) * WPX, wy = v => (WG.v0 + WG.h - v) * WPX;

// Clawd rig dims
const BW = 1.62, BH = 1.0, BD = 0.95, LEGH = 0.36, L_ARM = 0.45, R_NUB = 0.12;
const SH = { x: BW / 2, y: 0.4, z: 0.0 };
const REST_EXT = 0.74;
const REST_N = new THREE.Vector3(1, -0.3, 0.12).normalize();
const REST_F = new THREE.Vector3(-1, -0.3, 0.12).normalize();

// ───────────────────────── tap solver ─────────────────────────
function solveTap(T, o = {}) {
  const yaw = (o.yaw ?? 90) * DEG, ls = o.ls ?? 1, az = (o.az ?? 32) * DEG;
  const C = T.clone().addScaledVector(SN, R_NUB);
  const base = LEGH * ls + SH.y;
  let L = L_ARM * (o.ext ?? 1), el, hop = o.hop ?? 0;
  let D, S, P; const off = new THREE.Vector3(SH.x, 0, SH.z).applyAxisAngle(Y, yaw);
  for (let it = 0; it < 40; it++) { // stretch the nub until the body keeps ≥ 0.17 cm off the glass
    if (o.el == null) {
      let s = (C.y - base - hop) / L;
      if (Math.abs(s) > 0.97) { L = Math.abs(C.y - base - hop) / 0.97; s = Math.sign(s) * 0.97; }
      el = Math.asin(s);
    } else { el = o.el * DEG; hop = C.y - base - L * Math.sin(el); }
    D = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    S = C.clone().addScaledVector(D, -L);
    P = new THREE.Vector3(S.x - off.x, 0, S.z - off.z);
    let clr = 1e9; for (const x of [-BW / 2 + 0.05, BW / 2 - 0.05]) for (const z of [-BD / 2 + 0.05, BD / 2 - 0.05]) for (const y of [0.08, BH - 0.08]) { const w = new THREE.Vector3(x, y + LEGH * ls + hop, z).applyAxisAngle(Y, yaw).add(P); clr = Math.min(clr, w.sub(new THREE.Vector3(0, 0, LID_Z)).dot(SN)); }
    if (clr >= 0.23 || L > L_ARM * 1.45) break; L *= 1.02;
  }
  const Dl = D.clone().applyAxisAngle(Y, -yaw);
  return { P, yaw: yaw / DEG, hop, ls, ext: L / L_ARM, Dl, C, T, el: el / DEG };
}


