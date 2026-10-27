// ───────────────────────── sound: lo-fi bed + SFX from the same timeline (narration is mixed in ffmpeg, with ducking) ─────────────────────────
async function renderAudio() {
  const SR = 48000, LEN = DUR + 2, ctx = new OfflineAudioContext(2, Math.ceil(SR * LEN), SR), rnd = mulberry32(99);
  const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const verb = ctx.createConvolver(); { const n = SR * 1.1, b = ctx.createBuffer(2, n, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, 3.0) * 0.45; } verb.buffer = b; }
  const verbG = ctx.createGain(); verbG.gain.value = 0.25; verb.connect(verbG); verbG.connect(master);
  const buf = (dur, fn) => { const n = Math.ceil(dur * SR), b = ctx.createBuffer(1, n, SR), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = fn(i / SR, i); return b; };
  function play(b, t, gain = 1, pan = 0, wet = 0.25, dest = master) {
    const s = ctx.createBufferSource(); s.buffer = b; const g = ctx.createGain(); g.gain.value = gain; const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
    s.connect(g); g.connect(p); p.connect(dest); if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; p.connect(w); w.connect(verb); } s.start(Math.max(0, t));
  }
  const noise = () => rnd() * 2 - 1, F = 1 / 60, sin = (f, t) => Math.sin(2 * Math.PI * f * t);
  // ── music: 96 bpm, Am7 · Fmaj7 · Cmaj7 · G6, 12 bars = 30 s (seamless)
  const music = ctx.createGain(); music.gain.value = 0.42; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; music.connect(lp); lp.connect(master);
  const BEAT = 60 / 96, BAR = BEAT * 4, mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]], ROOT = [45, 41, 48, 43];
  const ep = (f, d) => buf(d, t => (sin(f, t) + 0.28 * sin(2 * f, t) * Math.exp(-t * 3) + 0.08 * sin(3 * f, t) * Math.exp(-t * 5)) * Math.exp(-t * 1.6) * Math.min(1, t * 300) * (1 + 0.08 * sin(4.5, t)) * 0.22);
  const bass = (f) => buf(1.2, t => Math.tanh(1.6 * (sin(f, t) + 0.2 * sin(2 * f, t))) * Math.exp(-t * 2.2) * Math.min(1, t * 200) * 0.5);
  const kick = buf(0.35, t => sin(45 + 85 * Math.exp(-t * 30), t) * Math.exp(-t * 9) * 0.9);
  const snap = buf(0.18, t => (noise() * 0.6 + sin(190, t) * 0.4) * Math.exp(-t * 28) * 0.55);
  let hpPrev = 0; const hat = buf(0.05, t => { const x = noise(); const y = x - hpPrev; hpPrev = x; return y * Math.exp(-t * 90) * 0.22; });
  const vinyl = buf(DUR, t => (rnd() < 0.0006 ? noise() * 0.5 : 0) + noise() * 0.004);
  play(vinyl, 0, 0.6, 0, 0, music);
  for (let bar = 0; bar < 12; bar++) {
    const t0 = bar * BAR, ch = CH[bar % 4];
    for (const [beat, vel] of [[0, 1], [2.5, 0.75]]) ch.forEach((m, i) => play(ep(mtof(m), 2.2), t0 + beat * BEAT + i * 0.012, vel * 0.9, (i - 1.5) * 0.25, 0.3, music));
    play(bass(mtof(ROOT[bar % 4])), t0, 0.9, 0, 0, music); play(bass(mtof(ROOT[bar % 4])), t0 + 2 * BEAT, 0.7, 0, 0, music);
    play(kick, t0, 0.9, 0, 0, music); play(kick, t0 + 2 * BEAT, 0.8, 0, 0, music); if (bar % 2) play(kick, t0 + 3.5 * BEAT, 0.5, 0, 0, music);
    play(snap, t0 + BEAT, 0.7, 0.1, 0.2, music); play(snap, t0 + 3 * BEAT, 0.7, 0.1, 0.2, music);
    for (let e = 0; e < 8; e++) play(hat, t0 + e * BEAT / 2 + (e % 2 ? BEAT * 0.08 : 0), e % 2 ? 0.55 : 0.85, 0.3, 0, music);
  }
  // ── SFX
  const click = buf(0.06, t => (sin(2400, t) * 0.5 + sin(4100, t) * 0.3 + noise() * 0.35) * Math.exp(-t * 160) + sin(520, t) * Math.exp(-t * 90) * 0.4);
  const keyThock = buf(0.09, t => (noise() * 0.5) * Math.exp(-t * 220) + sin(170 + 60 * Math.exp(-t * 60), t) * Math.exp(-t * 45) * 0.7);
  const stomp = buf(0.3, t => sin(55 + 90 * Math.exp(-t * 35), t) * Math.exp(-t * 14) * 0.9 + noise() * Math.exp(-t * 70) * 0.35);
  let w1 = 0; const whooshUp = buf(0.32, t => { w1 += (0.05 + 0.6 * t) * (noise() - w1); return w1 * Math.sin(Math.PI * t / 0.32) * 1.2; });
  const pop = buf(0.12, t => sin(500 + 1400 * Math.min(1, t * 20), t) * Math.exp(-t * 30) * 0.5);
  const bonk = buf(0.22, t => (sin(330, t) * 0.6 + sin(495, t) * 0.25 + sin(880, t) * 0.1 * Math.exp(-t * 30)) * Math.exp(-t * 18) * Math.min(1, t * 500));
  const blip = (f) => buf(0.16, t => (sin(f, t) * 0.6 + sin(f * 2, t) * 0.15) * Math.min(1, t * 400) * Math.exp(-t * 26));
  const tickS = buf(0.05, t => sin(3200, t) * Math.exp(-t * 120) * 0.4);
  const fail = buf(0.6, t => (sin(t < 0.22 ? 330 : 247, t) * 0.5 + sin(t < 0.22 ? 165 : 123, t) * 0.3) * Math.min(1, t * 300) * Math.exp(-((t % 0.3)) * 6) * 0.6);
  const arp = (notes, gap, d = 0.9) => buf(gap * notes.length + d, t => { let s = 0; notes.forEach((m, i) => { const tt = t - i * gap; if (tt > 0) s += (sin(mtof(m), tt) * 0.5 + sin(mtof(m) * 2, tt) * 0.12) * Math.exp(-tt * 4.5) * Math.min(1, tt * 400); }); return s * 0.35; });
  const alert = buf(0.7, t => (sin(Math.floor(t / 0.17) % 2 ? 660 : 880, t)) * (t % 0.17 < 0.13 ? 1 : 0) * 0.32 * Math.min(1, (t % 0.17) * 400));
  const clack = buf(0.14, t => noise() * Math.exp(-t * 120) * 0.6 + sin(1250, t) * Math.exp(-t * 60) * 0.35 + sin(420, t) * Math.exp(-t * 40) * 0.3);
  const shimmer = buf(1.6, t => [1568, 2093, 2637, 3136].reduce((s, f, i) => s + sin(f, t) * Math.exp(-t * (2.2 + i)) * (0.3 / (i + 1)), 0) * Math.min(1, t * 80));
  let w2 = 0; const riser = buf(1.3, t => { w2 += (0.02 + 0.45 * (t / 1.3)) * (noise() - w2); return w2 * (t / 1.3) * 0.9 + sin(200 + 500 * (t / 1.3) ** 2, t) * 0.12 * (t / 1.3); });
  let w3 = 0; const crash = buf(1.4, t => { w3 += 0.7 * (noise() - w3); return (noise() - w3) * Math.exp(-t * 3.5) * 0.35; });
  const hum = buf(1.3, t => sin(520 + 80 * Math.sin(2 * Math.PI * 1.6 * t), t) * 0.08 * Math.sin(Math.PI * t / 1.3));
  const land = buf(0.08, t => (noise() * 0.4 + sin(260, t) * 0.5) * Math.exp(-t * 80));
  // pan from where it happens on screen
  const panAt = (t, pnt) => { setState(t); const v = pnt.clone().project(camera); return clamp(v.x * 0.7, -0.8, 0.8); };
  for (const [ts] of SW) { play(whooshUp, ts - 0.04 + F, 0.22, 0, 0.2); play(pop, ts + F, 0.22, 0, 0.2); play(bonk, ts + 0.3 + F, 0.24, 0, 0.15); }
  TAPS.forEach(tp => { play(click, tp.t + F, 0.5, panAt(tp.t, tp.T), 0.2); });
  TAPS.slice(2, 6).forEach((tp, i) => play(blip([784, 880, 988, 1175][i]), tp.t + 0.05 + F, 0.35, panAt(tp.t, tp.T), 0.3));
  KEYHITS.forEach(([tk, k]) => { const big = Math.abs(tk - E.enter1) < 0.01 || Math.abs(tk - E.enter2) < 0.01; play(big ? stomp : keyThock, tk + F, big ? 0.75 : 0.4, 0.15, 0.12); });
  // landings on the deck (non-key hops)
  [10.44, 10.54, 10.64, 21.5, 22.0, 28.74, 28.8, 28.86].forEach(tl => play(land, tl + F, 0.25, 0, 0.1));
  TESTS1.concat(TESTS2).forEach(([tl, mk]) => { if (mk === '✓') play(tickS, tl + F, 0.5, 0.2, 0.1); });
  play(fail, E.fail + F, 0.5, 0.2, 0.25);
  play(arp([72, 76, 79, 84], 0.07), E.green + F, 0.55, 0, 0.35);
  play(hum, 22.25, 0.6, 0.3, 0.2);
  SEC.forEach(([ts], i) => { if (i !== 3) play(tickS, ts + F, 0.45, 0.3, 0.1); });
  play(alert, E.alert + F, 0.42, 0.35, 0.25);
  play(clack, E.lock + F, 0.6, 0.3, 0.15); play(shimmer, E.shield + F, 0.45, 0.3, 0.4);
  play(riser, E.deployGo + F, 0.45, 0.2, 0.3);
  [27.3, 27.6, 27.9, 28.2].forEach(ts => play(tickS, ts + F, 0.45, 0.25, 0.1));
  play(arp([67, 72, 76, 79, 84], 0.06, 1.2), E.live + F, 0.6, 0, 0.4); play(crash, E.live + F, 0.45, 0, 0.3);
  // the teacher's pointer swishes at the start of every phase
  { let w4 = 0; const swish = buf(0.3, t => { w4 += (0.15 + 0.5 * Math.sin(Math.PI * t / 0.3)) * (noise() - w4); return w4 * Math.sin(Math.PI * t / 0.3) ** 2 * 0.9; }); PH.forEach(p0 => play(swish, p0 + 0.3, 0.35, -0.3, 0.15)); }
  // the team murmurs while they talk it over (gibberish, Animal-Crossing style)
  { const syl = (f) => buf(0.07, t => (Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.5 + Math.sin(2 * Math.PI * f * 2 * t) * 0.2) * Math.sin(Math.PI * t / 0.07) * 0.22);
    const rr = mulberry32(5); for (const [k, a, b] of CHATS) for (let t = a; t < b - 0.05; t += 0.085 + rr() * 0.05) play(syl(380 + k * 70 + rr() * 160), t, 0.28, (k - 1) * 0.5, 0.15); }
  const out = await ctx.startRendering();
  const n = Math.round(DUR * SR), Lc = out.getChannelData(0), Rc = out.getChannelData(1), fl = new Float32Array(n), fr = new Float32Array(n);
  for (let i = 0; i < out.length; i++) { const j = i % n; fl[j] += Lc[i]; fr[j] += Rc[i]; }
  const wav = new ArrayBuffer(44 + n * 8), dv = new DataView(wav); const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 8, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 2, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 8, true); dv.setUint16(32, 8, true); dv.setUint16(34, 32, true); ws(36, 'data'); dv.setUint32(40, n * 8, true);
  for (let i = 0; i < n; i++) { dv.setFloat32(44 + i * 8, fl[i], true); dv.setFloat32(48 + i * 8, fr[i], true); }
  let s = ''; const u8 = new Uint8Array(wav); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
