// ───────────────────────── screen UI (widget canvas, diegetic) ─────────────────────────
const C2 = (u) => u * WPX;
const UI = { font: 'Inter', mono: '"JetBrains Mono", monospace' };
function shadowCard(g, x, y, w, h, r, fillStyle = '#fff') { g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 70; g.shadowOffsetY = 22; g.fillStyle = fillStyle; rrect(g, x, y, w, h, r); g.fill(); g.restore(); }
// a desktop window in screen cm (u0,v0 = bottom-left)
function win(g, title, u0, v0, u1, v1, dark, a) {
  if (a <= 0.001) return null;
  g.save(); g.globalAlpha = a;
  const x = wx(u0), y = wy(v1), w = C2(u1 - u0), h = C2(v1 - v0), r = C2(0.12), tb = C2(0.36);
  shadowCard(g, x, y, w, h, r, dark ? '#14161f' : '#fbfaf7');
  g.save(); rrect(g, x, y, w, h, r); g.clip();
  g.fillStyle = dark ? '#1c1f2b' : '#efece6'; g.fillRect(x, y, w, tb);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + C2(0.2 + i * 0.17), y + tb / 2, C2(0.05), 0, 7); g.fill(); });
  g.fillStyle = dark ? '#a9b0c7' : '#5b5752'; g.font = `600 ${C2(0.15)}px ${UI.font}`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(title, x + w / 2, y + tb / 2); g.textAlign = 'left';
  g.restore();
  return { x, y: y + tb, w, h: h - tb, done: () => g.restore() };
}
const DOC = [
  ['h1', 'Inicio de sesión seguro'], ['p', 'Objetivo: que solo el dueño de la cuenta pueda entrar.'], ['h2', 'Requisitos'],
  ['li', 'Entrar con correo y contraseña'], ['li', 'Segundo factor (2FA) con app autenticadora'], ['li', 'Bloqueo tras 5 intentos fallidos'],
  ['li', 'La sesión expira a los 30 minutos'], ['li', 'Contraseñas guardadas con hash, nunca en texto'], ['h2', 'Criterios de aceptación'],
  ['li', 'Con credenciales válidas recibe un token'], ['li', 'Con contraseña incorrecta recibe error genérico'], ['li', 'Al 6.º intento la API responde 429'],
  ['h2', 'Fuera de alcance'], ['li', 'Inicio con redes sociales'], ['li', 'Recuperar cuenta por SMS'],
];
const CODE = [
  "import { hash, verify } from './crypto'",
  "import { rateLimit } from './limits'",
  "",
  "export async function login(email: string, pass: string) {",
  "  await rateLimit(email, { max: 50, window: '15m' })",
  "  const user = await db.users.findByEmail(email)",
  "  if (!user || !(await verify(pass, user.hash)))",
  "    throw new AuthError('Credenciales inválidas')",
  "  const token = await issueSession(user.id, { ttl: '30m' })",
  "  return { token, needs2FA: user.mfa }",
  "}",
];
const CODE_LEN = CODE.join('\n').length;
const KW = /\b(import|from|export|async|function|await|const|if|throw|new|return)\b/g;
function codeLine(g, s, x, y, fs) {
  // tiny highlighter: strings, keywords, types, rest
  const parts = []; let rest = s; const re = /('[^']*'?)|\b(import|from|export|async|function|await|const|if|throw|new|return)\b|\b(string|AuthError)\b|(\{|\}|\(|\)|,|:)/g; let m, last = 0;
  while ((m = re.exec(s))) { if (m.index > last) parts.push([s.slice(last, m.index), '#d6dbea']); parts.push([m[0], m[1] ? '#a5d6a7' : m[2] ? '#c792ea' : m[3] ? '#ffcb6b' : '#89ddff']); last = m.index + m[0].length; }
  if (last < s.length) parts.push([s.slice(last), '#d6dbea']);
  g.font = `500 ${fs}px ${UI.mono}`; let cx = x; for (const [txt, col] of parts) { g.fillStyle = col; g.fillText(txt, cx, y); cx += g.measureText(txt).width; }
  return cx;
}
function typedChars(t) {
  if (t < TYPE[0][0] - 0.25) return 0; if (t >= E.enter1) return CODE_LEN;
  let n = 0; for (const [tl] of TYPE) if (t >= tl) n++;
  const next = TYPE[n] ? TYPE[n][0] : E.enter1, prevT = n ? TYPE[n - 1][0] : TYPE[0][0] - 0.25, k = clamp((t - prevT) / (next - prevT), 0, 1);
  return Math.floor(CODE_LEN * Math.min(1, (n + k * 0.9) / (TYPE.length + 0.6)));
}
const TESTS1 = [[16.2, '✓', 'login con credenciales válidas'], [16.5, '✓', 'rechaza contraseña incorrecta'], [16.8, '✓', 'el token expira a los 30 min'], [17.1, '✓', 'guarda la contraseña con hash'], [17.4, '✗', 'bloquea tras 5 intentos']];
const TESTS2 = [[19.62, '✓', 'login con credenciales válidas'], [19.78, '✓', 'rechaza contraseña incorrecta'], [19.94, '✓', 'el token expira a los 30 min'], [20.1, '✓', 'guarda la contraseña con hash'], [20.26, '✓', 'bloquea tras 5 intentos']];
const SEC = [[21.7, 'Dependencias', '0 CVE conocidas'], [22.2, 'Secretos en el código', 'ninguno'], [22.7, 'Cabeceras HTTP', 'CSP · HSTS · nosniff'], [23.2, 'Inyección SQL', '/search?q='], [23.95, 'Límite de intentos', '429 tras 5']];
const tapPress = (t, what) => { let p = 0; for (const tp of TAPS) if (tp.what === what) p = Math.max(p, bump(tp.t - 0.02, tp.t + 0.16, t)); return p; };
function button(g, u, v, w, h, label, a, opts = {}) {
  if (a <= 0.001) return; const pr = tapPress(opts.t, opts.what);
  g.save(); g.globalAlpha *= a; const x = wx(u - w / 2), y = wy(v + h / 2) + pr * C2(0.015), W2 = C2(w), H2 = C2(h);
  g.fillStyle = pr > 0.1 ? (opts.dark ?? '#3a2fb8') : (opts.fill ?? '#4f46e5'); rrect(g, x, y, W2, H2, C2(0.08)); g.fill();
  if (opts.glow) { g.save(); g.shadowColor = opts.fill ?? '#4f46e5'; g.shadowBlur = 50 * opts.glow; rrect(g, x, y, W2, H2, C2(0.08)); g.fill(); g.restore(); }
  g.fillStyle = opts.ink ?? '#fff'; g.font = `700 ${C2(0.15)}px ${UI.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + W2 / 2, y + H2 / 2 + 2); g.textAlign = 'left'; g.restore();
}
function drawWidget(t) {
  const g = wctx; g.clearRect(0, 0, WCW, WCH); g.textBaseline = 'alphabetic';
  const ph = (a, b) => s5(a, a + 0.3, t) * (1 - s5(b, b + 0.3, t));
  const docA = 1 - s5(5.0, 5.3, t) + s5(E.toDoc, E.toDoc + 0.3, t), boardA = ph(5.0, 10.0), edA = ph(10.0, 21.0), termA = ph(15.8, 21.0), secA = ph(21.0, 26.0), depA = ph(26.0, E.toDoc);
  let light = { u: 0.3, v: 4, w: 6, h: 5, i: 0 };
  // P1 · requirements doc (light theme: it lights his face)
  { const w = win(g, 'REQUISITOS.md', -3.4, 1.5, 4.4, 5.5, false, docA); if (w) {
    g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    const scroll = t < 25 ? C2(0.48) * (s5(TAPS[0].t + 0.02, TAPS[0].t + 0.4, t) + s5(TAPS[1].t + 0.02, TAPS[1].t + 0.4, t)) : 0;
    let y = w.y + C2(0.5) - scroll; const reading = t < 25 ? clamp(Math.floor(1 + t * 1.6), 1, 12) : 1;
    DOC.forEach(([k, s], i) => {
      const fs = C2(k === 'h1' ? 0.26 : k === 'h2' ? 0.18 : 0.14), lh = fs * (k === 'h1' ? 1.5 : 1.75);
      if (i === reading) { g.fillStyle = 'rgba(255,208,80,0.35)'; g.fillRect(w.x + C2(0.25), y - fs * 1.05, w.w - C2(0.5), fs * 1.45); }
      g.fillStyle = k === 'p' ? '#58534d' : '#24211e'; g.font = `${k === 'li' || k === 'p' ? 500 : 800} ${fs}px ${UI.font}`;
      g.fillText((k === 'li' ? '•  ' : '') + s, w.x + C2(0.38), y);
      // underlines appear where he tapped
      const ul = (i === 5 ? s5(TAPS[0].t, TAPS[0].t + 0.3, t) : i === 11 ? s5(TAPS[1].t, TAPS[1].t + 0.3, t) : 0) * (t < 25 ? 1 : 0);
      if (ul > 0) { g.strokeStyle = '#e8743b'; g.lineWidth = C2(0.025); g.beginPath(); const x0 = w.x + C2(0.38), x1 = x0 + g.measureText('•  ' + s).width; g.moveTo(x0, y + C2(0.05)); g.lineTo(lerp(x0, x1, ul), y + C2(0.05)); g.stroke(); }
      y += lh;
    });
    g.restore(); w.done(); light = { u: 0.5, v: 3.5, w: 7.8, h: 4, i: 7 * docA };
  } }
  // P2 · architecture board
  { const w = win(g, 'Arquitectura · login', -3.4, 1.5, 4.4, 5.5, true, boardA); if (w) {
    g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    g.fillStyle = 'rgba(120,130,170,0.18)'; for (let x = w.x; x < w.x + w.w; x += C2(0.25)) for (let y = w.y; y < w.y + w.h; y += C2(0.25)) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    const boxes = [['Web', -2.0, 4.15, '#4f9dff', TAPS[2].t], ['API', 0.5, 4.15, '#e8743b', TAPS[3].t], ['Auth', 3.0, 4.15, '#a78bfa', TAPS[4].t], ['DB', 0.5, 2.35, '#34d399', TAPS[5].t]];
    const pos = {}; boxes.forEach(([n, u, v, c, tb]) => { pos[n] = [u, v, c, tb]; });
    const edges = [['Web', 'API', TAPS[3].t + 0.15], ['API', 'Auth', TAPS[4].t + 0.15], ['API', 'DB', TAPS[5].t + 0.15]];
    edges.forEach(([a2, b2, te]) => { const k = s5(te, te + 0.35, t); if (k <= 0) return; const [ua, va] = pos[a2], [ub, vb] = pos[b2];
      const x0 = wx(ua), y0 = wy(va), x1 = wx(ub), y1 = wy(vb), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ox = dx / L * C2(0.65), oy = dy / L * C2(0.36);
      const sx = x0 + (Math.abs(dx) > Math.abs(dy) ? ox : 0), sy = y0 + (Math.abs(dy) > Math.abs(dx) ? oy : 0), ex = x1 - (Math.abs(dx) > Math.abs(dy) ? ox : 0), ey = y1 - (Math.abs(dy) > Math.abs(dx) ? oy : 0);
      g.strokeStyle = '#7d86b8'; g.lineWidth = C2(0.03); g.setLineDash([C2(0.08), C2(0.06)]); g.beginPath(); g.moveTo(sx, sy); g.lineTo(lerp(sx, ex, k), lerp(sy, ey, k)); g.stroke(); g.setLineDash([]);
      if (k > 0.95) { const ang = Math.atan2(ey - sy, ex - sx); g.fillStyle = '#7d86b8'; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex - Math.cos(ang - 0.4) * C2(0.14), ey - Math.sin(ang - 0.4) * C2(0.14)); g.lineTo(ex - Math.cos(ang + 0.4) * C2(0.14), ey - Math.sin(ang + 0.4) * C2(0.14)); g.fill(); } });
    boxes.forEach(([n, u, v, c, tb]) => { const k = s5(tb + 0.02, tb + 0.3, t); if (k <= 0) return; const sc = k + 0.18 * bump(tb + 0.15, tb + 0.45, t);
      const bw = C2(1.3) * sc, bh = C2(0.72) * sc, x = wx(u) - bw / 2, y = wy(v) - bh / 2;
      g.save(); g.globalAlpha *= k; g.shadowColor = c; g.shadowBlur = 40; g.fillStyle = '#1d2133'; rrect(g, x, y, bw, bh, C2(0.1)); g.fill(); g.restore();
      g.save(); g.globalAlpha *= k; g.strokeStyle = c; g.lineWidth = C2(0.03); rrect(g, x, y, bw, bh, C2(0.1)); g.stroke();
      g.fillStyle = '#fff'; g.font = `800 ${C2(0.24) * sc}px ${UI.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, x + bw / 2, y + bh / 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.restore(); });
    g.restore(); w.done(); light = { u: 0.5, v: 3.5, w: 7.8, h: 4, i: 2.2 * boardA };
  } }
  // P3/P4 · editor (+ terminal while testing)
  { const w = win(g, 'auth.ts — clawd-app', -4.4, 1.5, 5.4, 5.7, true, edA); if (w) {
    g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    const fs = C2(0.165), lh = fs * 1.55, x0 = w.x + C2(0.7); let y = w.y + C2(0.38);
    let left = typedChars(t), cursor = null;
    const fixK = s5(18.3, 18.4, t), fixed = t >= 18.3 && t < 29;
    CODE.forEach((ln, i) => {
      let s = ln; if (i === 4 && fixed) s = ln.replace('max: 50', 'max: 5');
      g.fillStyle = '#4a5068'; g.font = `500 ${fs}px ${UI.mono}`; g.textAlign = 'right'; g.fillText(String(i + 1), w.x + C2(0.5), y); g.textAlign = 'left';
      if (i === 4) { const hl = Math.max(bump(17.5, 18.3, t) * 0.8, 0) ; const gr = bump(18.3, 19.2, t);
        if (hl > 0) { g.fillStyle = `rgba(255,80,80,${0.22 * hl})`; g.fillRect(w.x, y - fs * 1.05, w.w, lh); }
        if (gr > 0) { g.fillStyle = `rgba(60,220,140,${0.22 * gr})`; g.fillRect(w.x, y - fs * 1.05, w.w, lh); } }
      const vis = s.slice(0, Math.max(0, left)); left -= s.length + 1;
      const ex = codeLine(g, vis, x0, y, fs);
      if (left < 0 && cursor == null) cursor = [ex, y];
      y += lh;
    });
    if (!cursor) cursor = [x0, y];
    if (t < E.enter1 + 0.4 || (t > 17.9 && t < 19.0)) { const on = (Math.floor(t * 4) % 2 === 0) || (t > 11.4 && t < E.enter1); if (on) { g.fillStyle = '#e8743b'; g.fillRect(cursor[0] + 2, cursor[1] - fs * 0.9, C2(0.025), fs * 1.1); } }
    // terminal
    if (termA > 0.001) {
      const th = C2(1.75) * termA, ty = w.y + w.h - th;
      g.fillStyle = '#0b0c12'; g.fillRect(w.x, ty, w.w, th); g.fillStyle = '#262a3a'; g.fillRect(w.x, ty, w.w, C2(0.02));
      const tfs = C2(0.15); let yy = ty + C2(0.32); g.font = `600 ${tfs}px ${UI.mono}`;
      const second = t >= E.run2 && t < 25, L = second ? TESTS2 : TESTS1, runT = second ? E.run2 : E.run1;
      if (t >= runT) { g.fillStyle = '#8f96b2'; g.fillText('$ npm test', w.x + C2(0.3), yy); yy += tfs * 1.55; }
      L.forEach(([tl, mk, name]) => { if (t < tl) return; const bad = mk === '✗'; g.fillStyle = bad ? '#ff6b6b' : '#4ade80'; g.fillText(`${mk}  ${name}`, w.x + C2(0.45), yy);
        if (bad) { g.fillStyle = '#ff9b9b'; g.font = `500 ${tfs * 0.9}px ${UI.mono}`; g.fillText('   Expected 429, received 200', w.x + C2(4.6), yy); g.font = `600 ${tfs}px ${UI.mono}`; } yy += tfs * 1.45; });
      const sumT = second ? E.green : E.fail + 0.15;
      if (t >= sumT) { const ok = second; const bw = C2(2.1), bx = w.x + w.w - bw - C2(0.3), by = ty + C2(0.2), pop = 1 + 0.12 * bump(sumT, sumT + 0.3, t);
        g.save(); g.translate(bx + bw / 2, by + C2(0.22)); g.scale(pop, pop); g.fillStyle = ok ? '#16a34a' : '#dc2626'; rrect(g, -bw / 2, -C2(0.22), bw, C2(0.44), C2(0.1)); g.fill();
        g.fillStyle = '#fff'; g.font = `800 ${tfs}px ${UI.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ok ? '5 de 5 ✓' : '1 falla · 4 ok', 0, 2); g.restore(); g.textBaseline = 'alphabetic'; }
    }
    g.restore(); w.done(); light = { u: 0.5, v: 3.6, w: 9.8, h: 4.2, i: 2.4 * edA };
  } }
  // P5 · security scan
  { const w = win(g, 'Seguridad · escaneo', -3.4, 1.5, 4.4, 5.5, true, secA); if (w) {
    g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    const fs = C2(0.165); let y = w.y + C2(0.5);
    SEC.forEach(([ts, name, det], i) => {
      const vuln = i === 3, act = t >= ts - 0.4;
      if (!act) return;
      const done = t >= ts, bad = vuln && t >= E.alert && t < E.lock, fixedV = vuln && t >= E.lock;
      g.fillStyle = bad ? 'rgba(220,38,38,0.18)' : fixedV ? 'rgba(22,163,74,0.14)' : 'rgba(255,255,255,0.03)'; rrect(g, w.x + C2(0.25), y - fs * 1.2, w.w - C2(0.5), fs * 1.9, C2(0.06)); g.fill();
      const ix = w.x + C2(0.55), iy = y - fs * 0.3;
      if (!done || (vuln && t < E.alert)) { g.strokeStyle = '#7d86b8'; g.lineWidth = C2(0.025); g.beginPath(); g.arc(ix, iy, C2(0.08), t * 9, t * 9 + 4.5); g.stroke(); }
      else if (bad || fixedV) { // padlock: open when vulnerable, shut when fixed
        const shut = s5(E.lock, E.lock + 0.12, t), col = fixedV ? '#4ade80' : '#ff6b6b';
        g.fillStyle = col; rrect(g, ix - C2(0.09), iy - C2(0.02), C2(0.18), C2(0.15), C2(0.03)); g.fill();
        g.strokeStyle = col; g.lineWidth = C2(0.03); g.beginPath(); g.arc(ix + (1 - shut) * C2(0.05), iy - C2(0.04) - (1 - shut) * C2(0.05), C2(0.065), Math.PI, 0); g.stroke();
      } else { g.fillStyle = '#4ade80'; g.font = `800 ${fs}px ${UI.font}`; g.fillText('✓', ix - C2(0.07), y); }
      g.fillStyle = '#e7e9f3'; g.font = `700 ${fs}px ${UI.font}`; g.fillText(name, w.x + C2(0.85), y);
      g.fillStyle = bad ? '#ff9b9b' : fixedV ? '#86efac' : '#8f96b2'; g.font = `500 ${fs * 0.85}px ${UI.mono}`;
      g.fillText(bad ? 'vulnerable · ' + det : fixedV ? 'corregido · consulta parametrizada' : (done ? det : 'revisando…'), w.x + C2(0.85), y + fs * 0.95);
      y += fs * 2.05;
    });
    const sh = s5(E.shield, E.shield + 0.35, t) * (t < 29 ? 1 : 0);
    if (sh > 0) { const cx = w.x + w.w - C2(0.95), cy = w.y + C2(0.95), s = C2(0.48) * (sh + 0.2 * bump(E.shield + 0.2, E.shield + 0.55, t));
      g.save(); g.globalAlpha *= sh; g.translate(cx, cy); g.shadowColor = '#4ade80'; g.shadowBlur = 60; g.fillStyle = '#16a34a';
      g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.9, -s * 0.85, s * 0.85, -s * 0.55); g.quadraticCurveTo(s * 0.8, s * 0.45, 0, s); g.quadraticCurveTo(-s * 0.8, s * 0.45, -s * 0.85, -s * 0.55); g.quadraticCurveTo(-s * 0.9, -s * 0.85, 0, -s); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = s * 0.14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-s * 0.35, 0); g.lineTo(-s * 0.08, s * 0.3); g.lineTo(s * 0.4, -s * 0.3); g.stroke(); g.restore();
      g.save(); g.globalAlpha *= sh; g.fillStyle = '#86efac'; g.font = `700 ${C2(0.16)}px ${UI.font}`; g.textAlign = 'center'; g.fillText('0 vulnerabilidades', cx, cy + C2(0.85)); g.restore(); }
    g.restore(); w.done(); light = { u: 0.5, v: 3.5, w: 7.8, h: 4, i: 2.4 * secA };
  } }
  // P6 · deploy
  { const w = win(g, 'Deploy · producción', -3.4, 1.5, 4.4, 5.5, true, depA); if (w) {
    g.save(); g.beginPath(); g.rect(w.x, w.y, w.w, w.h); g.clip();
    const fs = C2(0.19), live = s5(E.live, E.live + 0.3, t);
    g.fillStyle = '#8f96b2'; g.font = `500 ${fs * 0.9}px ${UI.mono}`; g.fillText('main @ 4f2c9a1 · clawd-app', w.x + C2(0.4), w.y + C2(0.55));
    const steps = [['Build', 27.3], ['Pruebas', 27.6], ['Seguridad', 27.9], ['Producción', 28.2]];
    steps.forEach(([n, ts], i) => { const y = w.y + C2(0.95 + i * 0.45), ok = t >= ts, run = t >= E.deployGo && !ok;
      g.fillStyle = ok ? '#4ade80' : run ? '#facc15' : '#4a5068'; g.beginPath(); g.arc(w.x + C2(0.55), y - fs * 0.35, C2(0.08), 0, 7); g.fill();
      g.fillStyle = ok ? '#e7e9f3' : '#8f96b2'; g.font = `700 ${fs}px ${UI.font}`; g.fillText(n, w.x + C2(0.8), y); });
    const prog = clamp((t - E.deployGo) / (28.2 - E.deployGo), 0, 1) * (t < 29.5 ? 1 : 0);
    const bx = w.x + C2(0.4), by = w.y + C2(2.85), bw = w.w - C2(0.8);
    g.fillStyle = '#262a3a'; rrect(g, bx, by, bw, C2(0.14), C2(0.07)); g.fill();
    const pg2 = g.createLinearGradient(bx, 0, bx + bw, 0); pg2.addColorStop(0, '#4f46e5'); pg2.addColorStop(1, '#22c55e'); g.fillStyle = pg2; if (prog > 0) { rrect(g, bx, by, Math.max(C2(0.14), bw * prog), C2(0.14), C2(0.07)); g.fill(); }
    if (live > 0) { const sc = 1 + 0.15 * bump(E.live, E.live + 0.35, t); g.save(); g.globalAlpha *= live; g.translate(w.x + w.w / 2, w.y + C2(3.4)); g.scale(sc, sc);
      g.shadowColor = '#22c55e'; g.shadowBlur = 50; g.fillStyle = '#16a34a'; rrect(g, -C2(2.2), -C2(0.42), C2(4.4), C2(0.84), C2(0.42)); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#fff'; g.font = `800 ${C2(0.3)}px ${UI.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✓  En vivo · clawd.app', 0, 2); g.restore(); g.textBaseline = 'alphabetic'; }
    // confetti (drawn on screen)
    if (t > E.live && t < E.live + 1.4) { const r = mulberry32(77), d = t - E.live; for (let i = 0; i < 70; i++) { const x = w.x + r() * w.w, vy = 0.6 + r() * 1.2, y = w.y + C2(3.4) - C2(2.0) * (1 - d * 1.1) + C2(vy) * d * d * 3 - C2(r() * 0.6); const c = ['#e8743b', '#4ade80', '#60a5fa', '#facc15', '#c084fc'][i % 5];
      g.save(); g.globalAlpha *= clamp(1.4 - d, 0, 1); g.translate(x + Math.sin(d * 6 + i) * C2(0.15), y); g.rotate(d * (3 + r() * 5) + i); g.fillStyle = c; g.fillRect(-C2(0.03), -C2(0.05), C2(0.06), C2(0.1)); g.restore(); } }
    g.restore(); w.done(); light = { u: 0.5, v: 3.5, w: 7.8, h: 4, i: (2.4 + 2.5 * live) * depA };
  } }
  // toolbar strip near his feet (buttons he can reach)
  { const x = wx(-3.5), y = wy(1.36), w = C2(8.0), h = C2(0.82);
    g.save(); g.fillStyle = 'rgba(20,22,32,0.82)'; rrect(g, x, y, w, h, C2(0.18)); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 3; g.stroke(); g.restore();
    const o = { t };
    button(g, ...BTN.up, 0.42, 0.42, '▲', docA, { ...o, what: 'up', fill: '#2b3045' }); button(g, ...BTN.scroll, 0.42, 0.42, '▼', docA, { ...o, what: 'scroll', fill: '#2b3045' });
    [['web', 'Web', '#4f9dff'], ['api', 'API', '#e8743b'], ['auth', 'Auth', '#a78bfa'], ['db', 'DB', '#34d399']].forEach(([k, l, c]) => button(g, ...BTN[k], 0.82, 0.42, l, boardA, { ...o, what: k, fill: c, dark: c }));
    g.save(); g.globalAlpha = edA * (1 - secA); g.fillStyle = '#8f96b2'; g.font = `600 ${C2(0.15)}px ${UI.mono}`; g.textBaseline = 'middle'; g.fillText(t < 16 ? '● escribiendo · auth.ts' : t < E.green ? '▶ npm test' : '✓ 5 de 5', wx(-3.0), wy(0.95)); g.restore();
    button(g, ...BTN.scan, 0.9, 0.42, 'Escanear', secA, { ...o, what: 'scan', fill: '#2b3045' }); button(g, ...BTN.fix, 0.9, 0.42, 'Corregir', secA, { ...o, what: 'fix', fill: '#dc2626', glow: bump(23.7, 24.6, t) });
    button(g, ...BTN.deploy, 1.1, 0.42, 'Deploy ▲', depA, { ...o, what: 'deploy', fill: '#16a34a', glow: bump(26.3, 27.0, t) });
  }
  // tap ripples on the glass
  TAPS.forEach(tp => { const d = t - tp.t; if (d < 0 || d > 0.4) return; const [u, v] = tp.uv, x = wx(u), y = wy(v), a = 1 - d / 0.4;
    const gr = g.createRadialGradient(x, y, 0, x, y, C2(0.16)); gr.addColorStop(0, `rgba(255,255,255,${0.55 * a * (1 - s5(0, 0.15, d))})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, C2(0.16), 0, 7); g.fill();
    g.strokeStyle = `rgba(200,210,255,${0.6 * a * a})`; g.lineWidth = C2(0.012) * (1 + d * 3); g.beginPath(); g.arc(x, y, C2(0.05 + d * 0.6), 0, 7); g.stroke(); });
  widgetTex.needsUpdate = true;
  return light;
}
