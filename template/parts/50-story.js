// ───────────────────────── the class: one teacher, a team of three (facing the camera) ─────────────────────────
const KTOP = 0.08;
const KEY = (r, c) => new THREE.Vector3(-12.3 + c * 1.89, KTOP, 3.4 + r * 1.75);
const KIDX = (r, c) => r * 14 + c;
const BTN = { up: [-0.05, 0.95], scroll: [0.55, 0.95], web: [-2.35, 0.95], api: [0.1, 0.95], auth: [3.45, 0.95], db: [0.95, 0.95], scan: [1.9, 0.95], fix: [3.45, 0.95], deploy: [0.55, 0.95] };
const E = { enter1: 15.75, run1: 15.85, fail: 17.4, enter2: 19.4, run2: 19.5, green: 20.4, alert: 23.6, lock: 24.7, shield: 25.0, deployGo: 27.0, live: 28.3, toDoc: 29.3 };
const mkTap = (t, what, o = {}) => { const [u, v] = BTN[what]; const tp = { t, what, uv: [u, v], T: scr(u, v) }; tp.sol = solveTap(tp.T, { az: 32, ...o }); return tp; };
const TAPS = [mkTap(1.7, 'scroll'), mkTap(3.0, 'scroll'), mkTap(5.95, 'web'), mkTap(6.75, 'api'), mkTap(7.55, 'auth'), mkTap(8.35, 'db'), mkTap(24.6, 'fix'), mkTap(26.95, 'deploy')];
const PH = [0, 5, 10, 16, 21, 26];
const OUTFIT = ['glasses', 'hardhat', 'phones', 'goggles', 'helmet', 'cap'];
const CAMPOS = new THREE.Vector3(0.9, 5.0, 17.5);
const swapsFor = k => PH.map((p, i) => [p === 0 ? 29.4 + k * 0.06 : p + k * 0.06, OUTFIT[(i + 5) % 6], OUTFIT[i]]);
const WK = [0, 1, 2].map(k => { const c = makeClawd('w' + k, { swaps: swapsFor(k), blinks: [1.1, 2.6, 4.9, 6.4, 8.0, 9.4, 12.3, 14.1, 16.6, 18.1, 19.9, 22.0, 24.2, 25.9, 27.6, 29.1].map(b => b + k * 0.37) }); OUTFIT.forEach(n => addAcc(c, n)); return c; });
const HOME = [TAPS[2].sol.P.clone().add(new THREE.Vector3(0, 0, 0.25)), TAPS[0].sol.P.clone().add(new THREE.Vector3(0, 0, 0.25)), TAPS[4].sol.P.clone().add(new THREE.Vector3(0, 0, 0.25))];
const faceCam = P => Math.atan2(CAMPOS.x - P.x, CAMPOS.z - P.z) / DEG;
const FY = HOME.map((H, k) => faceCam(H) + [10, 0, -10][k]);
const TOWARD = (k, j) => FY[k] + (j > k ? 48 : -48); // turn to chat with a neighbour
const COLS = [6, 7, 8];
const ENTERK = [1, 7];
const SCAN = [[22.35, -1.95, 1.95], [22.85, -1.1, 1.8], [23.35, -0.3, 1.95]];
const TYPEH = [];
const CHATS = []; // [clawd index, t0, t1] → mouth + murmur
// held-item hand poses (body-local) and arm directions toward them
const SHN = new THREE.Vector3(SH.x, SH.y, SH.z), SHF = new THREE.Vector3(-SH.x, SH.y, SH.z);
const reach = (from, to) => { const d = to.clone().sub(from); return [d.clone().normalize(), clamp(d.length() / L_ARM, 0.55, 1.25)]; };
const HOLD_F = new THREE.Vector3(-0.98, 0.3, 0.42), HOLD_N = new THREE.Vector3(0.98, 0.3, 0.42), BOOK = new THREE.Vector3(0, 0.22, 0.85), NOTE = new THREE.Vector3(-0.3, 0.26, 0.78);
const [dHF, eHF] = reach(SHF, HOLD_F), [dHN, eHN] = reach(SHN, HOLD_N), [dBN, eBN] = reach(SHN, BOOK.clone().add(new THREE.Vector3(0.25, 0, 0))), [dBF, eBF] = reach(SHF, BOOK.clone().add(new THREE.Vector3(-0.25, 0, 0))), [dNN, eNN] = reach(SHN, NOTE.clone().add(new THREE.Vector3(0.05, 0.02, 0.05)));
const holdF = (c, t0, t1) => { arm(c, t0, dHF, eHF, 'f'); arm(c, t1, dHF, eHF, 'f'); };
const holdBook = (c, t0, t1) => { arm(c, t0, dBN, eBN); arm(c, t1, dBN, eBN); arm(c, t0, dBF, eBF, 'f'); arm(c, t1, dBF, eBF, 'f'); };
const scribble = (c, t0, t1) => { for (let t = t0; t < t1; t += 0.16) { const w = Math.sin(t * 37) * 0.08; arm(c, t, dNN.clone().add(new THREE.Vector3(w, Math.cos(t * 23) * 0.05, 0)).normalize(), eNN); } arm(c, t1, dNN, eNN); };
function chat(k, t0, t1, j, icon) { const c = WK[k]; c.tr.pose(t0 - 0.12, { yaw: c.tr.k.yaw?.get(t0 - 0.12) ?? FY[k] }); c.tr.pose(t0 + 0.15, { yaw: TOWARD(k, j) }); c.tr.pose(t1, { yaw: TOWARD(k, j) }); c.tr.pose(t1 + 0.3, { yaw: FY[k] }); CHATS.push([k, t0 + 0.1, t1]); if (icon) bubble(c, t0 + 0.05, t1 + 0.25, icon, j > k ? 1 : -1); c.gaze.push([t0, j > k ? 0.6 : -0.6, 0], [t1, j > k ? 0.6 : -0.6, 0], [t1 + 0.3, 0, 0]); }
// taps: turn to the glass only for the touch, then face the camera again
function tapTurn(c, k, tp) { c.tr.pose(tp.t - 0.42, { yaw: FY[k] }); addTap(c, tp); c.tr.pose(tp.t + 0.5, { yaw: FY[k] }); at(c, tp.t + 0.75, tp.sol.P.clone().add(new THREE.Vector3(0, 0, 0.25)), FY[k]); }
{
  WK.forEach((c, k) => {
    const tr = c.tr, H = HOME[k], F = FY[k];
    tr.pose(0, { px: H.x, pz: H.z, yaw: F, hop: 0, gy: 0, ls: 1, sq: 1, lean: -4, roll: 0 });
    tr.pose(DUR, { px: H.x, pz: H.z, yaw: F, hop: 0, gy: 0, ls: 1, sq: 1, lean: -4, roll: 0 });
    c.expr = [[0, 'reading'], [3.8 + k * 0.2, 'happy'], [4.5, 'thinking'], [5.2, 'determined'], [9.0 + k * 0.1, 'proud'], [10.1, 'happy'], [11.5, 'focused'], [15.6, 'determined'],
      [16.2, 'reading'], [17.42 + k * 0.03, 'worried', 0.06], [17.9, 'focused'], [19.5, 'reading'], [20.42, 'happy', 0.06], [21.2, 'determined'], [22.25, 'focused'],
      [23.62, 'surprised', 0.05], [24.0, 'determined'], [24.75, 'happy'], [25.35, 'proud'], [26.1, 'determined'], [27.05, 'happy'], [28.32, 'happy', 0.06], [29.55, 'reading', 0.3]];
    c.gaze = [[0, 0, 0.75], [5.1, 0, 0], [5.6, -0.2, 0.7], [9.0, 0, 0], [10.2, 0, 0.2], [11.6, 0, 0.5], [15.6, 0, 0.2], [16.4, 0, -0.95], [17.8, 0, 0.5], [19.5, 0, -0.95], [20.45, 0, 0],
      [21.2, 0.2, 0], [22.3, 0.2, 0.1], [24.0, 0.2, 0], [25.3, 0, 0], [27.0, 0, -0.4], [28.35, 0, 0], [29.7, 0, 0.75]];
    // P1 · read: books (sides), the middle one scrolls the doc
    if (k !== 1) { bodyProp(c, 'book', BOOK, [-0.5, 0, 0], 29.55, 4.85, k ? 0xd9534f : 0x2f6fd6); holdBook(c, 0, 1.9); holdBook(c, 3.4, 4.6); arms(c, 4.95, REST_N, REST_F, REST_EXT, REST_EXT); holdBook(c, DUR, DUR); holdBook(c, 29.75, 29.75); }
    else { tapTurn(c, k, TAPS[0]); tapTurn(c, k, TAPS[1]); arms(c, 0, REST_N, REST_F, REST_EXT, REST_EXT); arms(c, DUR, REST_N, REST_F, REST_EXT, REST_EXT); }
    tr.pose(1.2, { lean: -7 }); tr.pose(3.6 + k * 0.15, { lean: -6 }); tr.pose(3.75 + k * 0.15, { lean: 4 }); tr.pose(3.9 + k * 0.15, { lean: -4 }); tr.pose(4.05 + k * 0.15, { lean: 3 }); tr.pose(4.25 + k * 0.15, { lean: -2 });
    at(c, 4.9, H, F); dip(c, 5.0 + k * 0.06);
    // P2 · architect: notebooks + pencils on the sides, everyone talks it over
    if (k !== 1) { bodyProp(c, 'notebook', NOTE, [-0.7, 0.25, 0], 5.3, 9.8); armProp(c, 'pencil', 5.3, 9.8); holdF(c, 5.4, 9.6); arm(c, 5.4, dNN, eNN); }
    if (k === 0) { tapTurn(c, k, TAPS[2]); scribble(c, 6.75, 7.5); scribble(c, 8.45, 8.95); }
    if (k === 1) { tapTurn(c, k, TAPS[3]); tapTurn(c, k, TAPS[5]); }
    if (k === 2) { scribble(c, 5.5, 6.6); tapTurn(c, k, TAPS[4]); scribble(c, 8.0, 8.9); }
    tr.pose(8.95, { lean: 0 }); tr.pose(9.15 + k * 0.08, { lean: -7, sq: 1.03 }); tr.pose(9.7, { lean: -6, sq: 1.02 });
    if (k === 1) { arms(c, 9.1, V3(0.55, -0.75, 0.35), V3(-0.55, -0.75, 0.35), 0.75, 0.75); arms(c, 9.75, V3(0.55, -0.75, 0.35), V3(-0.55, -0.75, 0.35), 0.75, 0.75); }
    else { arm(c, 9.75, REST_N, REST_EXT); arm(c, 9.75, REST_F, REST_EXT, 'f'); }
    at(c, 9.75, H, F);
    dip(c, 10.0 + k * 0.06);
    // P3 · code: energy cans and coffee in the free nub, hopping key to key
    const col = COLS[k], D1 = new THREE.Vector3(H.x, 0, 2.2), K0 = KEY(0, col);
    bodyProp(c, k === 1 ? 'mug' : 'can', HOLD_F.clone().add(new THREE.Vector3(-0.06, -0.06, 0.06)), [0, 0, 0], 10.15, 16.0);
    hop(c, 10.12 + k * 0.1, 10.44 + k * 0.1, H, D1, 0, 0, 0.5, F, { keepF: true });
    hop(c, 10.62 + k * 0.1, 10.96 + k * 0.1, D1, K0, 0, KTOP, 0.55, F, { key: KIDX(0, col), keepF: true });
    holdF(c, 10.2, 15.95);
    let prev = K0; const seq = [[1, col], [0, col], [1, col], [0, col], [1, col], [0, col], [1, col], [0, col], [1, col], [0, col]];
    seq.forEach(([r, cc], i) => { const t1 = 11.55 + k * 0.12 + i * 0.36; const P = KEY(r, cc); hop(c, t1 - 0.2, t1, prev, P, KTOP, KTOP, 0.3, F + (i % 2 ? 6 : -6), { quick: true, key: KIDX(r, cc), land: 0.88, keepF: true }); TYPEH.push(t1); prev = P; });
    // a sip mid-typing
    { const ts = 13.45 + k * 0.4; arm(c, ts, dHF, eHF, 'f'); arm(c, ts + 0.2, V3(-0.35, 0.55, 0.75), 0.8, 'f'); arm(c, ts + 0.45, V3(-0.35, 0.55, 0.75), 0.8, 'f'); arm(c, ts + 0.65, dHF, eHF, 'f'); }
    if (k === 1) { const PE = KEY(...ENTERK); hop(c, 15.3, E.enter1, prev, PE, KTOP, KTOP, 0.8, F, { key: KIDX(...ENTERK), land: 0.76, keepF: true }); prev = PE; }
    dip(c, 16.0 + k * 0.06);
    // P4 · test: flask, clipboard, the right one fixes
    if (k === 0) { bodyProp(c, 'flask', HOLD_F.clone().add(new THREE.Vector3(-0.04, 0.0, 0.08)), [0, 0, 0.2], 16.2, 21.0); }
    if (k === 1) { bodyProp(c, 'clipboard', new THREE.Vector3(-0.55, 0.3, 0.68), [-0.25, 0.35, 0.08], 16.2, 21.0); }
    if (k !== 2) holdF(c, 16.2, 20.9); else arm(c, 16.2, REST_F, REST_EXT, 'f');
    tr.pose(16.3, { yaw: F, lean: 0 }); tr.pose(16.7, { yaw: F + (k - 1) * 14, lean: -8 }); tr.pose(17.3, { yaw: F + (k - 1) * 14, lean: -8 }); tr.pose(17.7, { yaw: F, lean: 0 });
    tr.pose(17.45, { sq: 1.08 }); tr.pose(17.6, { sq: 0.97 }); tr.pose(17.75, { sq: 1 });
    let kp = prev;
    if (k === 2) { arms(c, 17.45, V3(0.6, 0.6, 0.3), V3(-0.6, 0.6, 0.3), 0.95, 0.95); arms(c, 17.75, REST_N, REST_F, REST_EXT, REST_EXT);
      [[17.95, 1], [18.3, 0], [18.65, 1], [19.0, 0]].forEach(([t1, r]) => { const P = KEY(r, col); hop(c, t1 - 0.2, t1, kp, P, KTOP, KTOP, 0.32, F, { quick: true, key: KIDX(r, col), land: 0.88 }); kp = P; }); }
    if (k === 1) { hop(c, 19.08, E.enter2, kp, kp, KTOP, KTOP, 0.75, F, { key: KIDX(...ENTERK), land: 0.78, keepF: true }); }
    tr.pose(19.6, { sq: 1, yaw: F + (k - 1) * 14, lean: -7 }); tr.pose(20.3, { yaw: F + (k - 1) * 14, lean: -8 }); tr.pose(20.45, { yaw: F });
    hop(c, 20.5 + k * 0.05, 20.86 + k * 0.05, kp, kp, KTOP, KTOP, 0.6, F, { key: null, keepF: k !== 2 });
    if (k === 2) arms(c, 20.68 + k * 0.05, V3(0.35, 1, 0.25), V3(-0.35, 1, 0.25), 1.0, 1.0); else arm(c, 20.68 + k * 0.05, V3(0.35, 1, 0.25), 1.0);
    dip(c, 21.0 + k * 0.06);
    // P5 · secure: magnifier (left), shield (middle), padlock (right, who fixes it)
    const D2 = new THREE.Vector3(kp.x, 0, 2.2);
    hop(c, 21.15 + k * 0.08, 21.5 + k * 0.08, kp, D2, KTOP, 0, 0.55, F + 180, { keepF: k !== 0 });
    const sols = k === 0 ? SCAN.map(([t, u, v]) => solveTap(scr(u, v, 0.55), { az: 28 })) : null;
    const P5 = k === 0 ? sols[0].P : k === 2 ? TAPS[6].sol.P.clone().add(new THREE.Vector3(0, 0, 0.25)) : H;
    hop(c, 21.65 + k * 0.08, 22.0 + k * 0.08, D2, P5, 0, 0, 0.45, F + 40, { keepF: k !== 0 });
    tr.pose(22.25, { yaw: k === 0 ? sols[0].yaw : F });
    if (k === 0) {
      SCAN.forEach(([t], i) => { const s = sols[i]; at(c, t - 0.12, s.P, s.yaw); at(c, t + 0.15, s.P, s.yaw); arm(c, t - 0.12, s.Dl, s.ext); arm(c, t + 0.15, s.Dl, s.ext); tr.pose(t, { hop: s.hop, ls: s.ls, lean: 0 }); });
      arm(c, 22.15, wind(sols[0].Dl, 0.6), 0.9); arm(c, 23.8, REST_N, REST_EXT); tr.pose(23.9, { yaw: F });
      at(c, 25.6, sols[2].P.clone().add(new THREE.Vector3(0, 0, 0.25)), F); at(c, 26.3, H, F);
    }
    if (k === 1) { bodyProp(c, 'shield', new THREE.Vector3(-0.72, 0.32, 0.62), [0, 0.35, 0], 21.3, 26.0); holdF(c, 21.4, 25.9); arm(c, 25.25, REST_N, REST_EXT); arm(c, 25.45, V3(0.25, 1, 0.35), 0.95); arm(c, 25.85, V3(0.25, 1, 0.35), 0.95); arm(c, 26.15, REST_N, REST_EXT); }
    if (k === 2) { bodyProp(c, 'padlock', HOLD_F.clone().add(new THREE.Vector3(-0.05, 0.02, 0.1)), [0, 0.3, 0], 21.3, 26.0); holdF(c, 21.4, 25.9); tapTurn(c, k, TAPS[6]); }
    tr.pose(E.alert - 0.05, { sq: 1 }); tr.pose(E.alert + 0.06, { sq: 1.1 }); tr.pose(E.alert + 0.25, { sq: 0.97 }); tr.pose(E.alert + 0.4, { sq: 1 });
    tr.pose(25.2, { lean: 0 }); tr.pose(25.4 + k * 0.06, { lean: -6, sq: 1.03 }); tr.pose(25.85, { lean: -5, sq: 1.02 });
    if (k !== 0) at(c, 25.9, P5, F);
    dip(c, 26.0 + k * 0.06);
    // P6 · deploy (middle) with party horns on the sides
    if (k === 1) tapTurn(c, k, TAPS[7]);
    else { const hp = bodyProp(c, 'horn', new THREE.Vector3(0.0, 0.42, 0.62), [0, -Math.PI / 2 + 0.15, 0.25], 26.3, 29.3); holdF(c, 26.4, 29.1); arm(c, 29.3, REST_F, REST_EXT, 'f'); }
    tr.pose(27.25, { lean: 0 }); tr.pose(27.5, { lean: -4 }); tr.pose(28.2, { lean: -4 });
    const P6 = k === 1 ? TAPS[7].sol.P.clone().add(new THREE.Vector3(0, 0, 0.25)) : H;
    hop(c, 28.38 + k * 0.06, 28.74 + k * 0.06, P6, P6, 0, 0, 0.55, F + (k - 1) * 20, { keepF: k !== 1 });
    if (k === 1) arms(c, 28.56, V3(0.35, 1, 0.25), V3(-0.35, 1, 0.25), 1.0, 1.0); else arm(c, 28.56 + k * 0.06, V3(0.35, 1, 0.25), 1.0);
    at(c, 29.4, H, F); tr.pose(29.75, { lean: 0 }); tr.pose(29.92, { lean: -4 });
    arm(c, 29.4, REST_N, REST_EXT);
    c.sweatAt = t => (k === 2 ? 1 : 0) * s5(17.5, 17.7, t) * (1 - s5(19.4, 19.6, t)); c.sweatSlideAt = t => s5(17.6, 19.3, t);
  });
  // they talk it over (mouths + bubbles)
  chat(0, 2.15, 2.75, 1, '?'); chat(2, 3.3, 3.85, 1, 'bulb');
  chat(0, 6.2, 6.65, 1, 'diagram'); chat(1, 7.0, 7.4, 2, 'API'); chat(2, 7.85, 8.25, 1, 'check'); chat(1, 8.6, 9.0, 0, 'DB');
  chat(0, 12.9, 13.35, 1, 'code'); chat(2, 14.2, 14.6, 1, 'zap');
  chat(2, 17.5, 17.85, 1, '!'); chat(1, 19.55, 19.95, 2, 'check');
  chat(0, 23.65, 24.05, 1, 'lockOpen'); chat(1, 24.85, 25.25, 2, 'lock');
  chat(0, 28.4, 28.9, 1, 'party'); chat(2, 28.5, 29.0, 1, 'party');
  WK.forEach((c, k) => { c.talk = t => { let v = 0; for (const [kk, a, b] of CHATS) if (kk === k && t >= a && t < b) v = 0.3 + 0.35 * Math.abs(Math.sin(t * 21 + k * 2)) * (0.6 + 0.4 * Math.sin(t * 7.3)); return v; }; });
  WK[0].props = (() => { const mag = holdProp(WK[0], buildMag); return t => { const m = s5(21.3, 21.55, t) * (1 - s5(25.95, 26.2, t)); mag.visible = m > 0.001; mag.scale.setScalar(Math.max(0.001, m * (1 + 0.25 * bump(21.35, 21.65, t)))); }; })();
  WK.forEach(finishClawd);
}
const TYPE = TYPEH.sort((a, b) => a - b).map(t => [t]);
const SW = WK.flatMap(c => c.swaps.map(s => [s[0]]));

// the teacher: mortarboard, glasses, pointer; talks with the narration
const TP = KEY(3, 7);
const T = makeClawd('teacher', { talk: t => { const i = Math.floor(wrap(t) * 60), f = wrap(t) * 60 - i; return lerp(VOZENV[i % 1800], VOZENV[(i + 1) % 1800], f); }, blinks: [0.9, 3.3, 5.9, 8.4, 11.2, 13.6, 15.4, 18.9, 21.7, 24.9, 27.3, 29.5] });
addAcc(T, 'mortar'); addAcc(T, 'glasses');
T.noClamp = true;
const pointer = holdProp(T, buildPointer);
{
  const tr = T.tr, faceYaw = Math.atan2(CAMPOS.x - TP.x, CAMPOS.z - TP.z) / DEG;
  const AIM = [scr(0.3, 3.6), scr(0.3, 3.4), KEY(0.5, 6.5).add(new THREE.Vector3(0, 0.9, 0)), scr(0.6, 2.6), scr(0.0, 2.8), scr(0.5, 3.0)];
  const shoulderAt = yaw => TP.clone().setY(0).add(new THREE.Vector3(SH.x, 0, SH.z).applyAxisAngle(Y, yaw * DEG)).add(new THREE.Vector3(0, LEGH + SH.y, 0));
  const pointDir = (aim, yaw) => aim.clone().sub(shoulderAt(yaw)).normalize().applyAxisAngle(Y, -yaw * DEG);
  const RESTP = V3(0.7, -0.62, 0.45), TALKF = V3(-0.75, 0.15, 0.6), TALKF2 = V3(-0.6, 0.45, 0.65);
  tr.pose(0, { px: TP.x, pz: TP.z, yaw: faceYaw, hop: 0, gy: KTOP, ls: 1, sq: 1, lean: -2, roll: 0 }); arms(T, 0, RESTP, REST_F, 0.9, REST_EXT);
  tr.pose(DUR, { px: TP.x, pz: TP.z, yaw: faceYaw, hop: 0, gy: KTOP, ls: 1, sq: 1, lean: -2, roll: 0 }); arms(T, DUR, RESTP, REST_F, 0.9, REST_EXT);
  T.expr = [[0, 'teach']]; T.gaze = [[0, 0, 0]];
  PH.forEach((p0, i) => {
    const PY = 68 + (i === 2 || i === 3 ? -6 : 0), dir = pointDir(AIM[i], PY);
    const a = p0 + 0.08;
    tr.pose(a, { yaw: faceYaw, lean: -2 }); arms(T, a, RESTP, REST_F, 0.9, REST_EXT);
    tr.pose(a + 0.35, { yaw: PY, lean: 2 }); arm(T, a + 0.3, wind(dir, 0.5), 0.92); arm(T, a + 0.5, dir, 1.0);
    arm(T, a + 0.95, dir, 1.0); arm(T, a + 1.08, dir.clone().add(new THREE.Vector3(0, -0.12, 0)).normalize(), 1.04); arm(T, a + 1.22, dir, 1.0); arm(T, a + 1.6, dir, 1.0);
    tr.pose(a + 1.6, { yaw: PY, lean: 2 });
    tr.pose(a + 2.0, { yaw: faceYaw + (i % 2 ? 6 : -6), lean: -2 }); arm(T, a + 2.0, RESTP, 0.9);
    arm(T, a + 2.3, TALKF, 0.85, 'f'); arm(T, a + 2.75, TALKF2, 0.9, 'f'); arm(T, a + 3.2, TALKF, 0.85, 'f'); arm(T, a + 3.7, REST_F, REST_EXT, 'f');
    tr.pose(a + 3.0, { lean: 1 }); tr.pose(a + 3.6, { lean: -2 });
    T.gaze.push([a + 0.15, 0.6, -0.3], [a + 1.75, 0.6, -0.3], [a + 2.0, 0, 0]);
    T.expr.push([a + 0.15, 'teach'], [a + 3.8, 'proud']);
  });
  T.expr.push([E.fail + 0.05, 'worried', 0.08], [E.fail + 0.7, 'teach'], [E.live + 0.05, 'happy', 0.08], [29.3, 'teach']);
  // at the very end: a little hop of joy
  hop(T, 28.45, 28.8, TP, TP, KTOP, KTOP, 0.45, faceYaw, { armsUp: false, key: KIDX(3, 7) });
  finishClawd(T);
}
const KEYHITS = CLAWDS.flatMap(c => c.keyhits);
