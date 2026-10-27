// ───────────────────────── props, set dressing and speech bubbles ─────────────────────────
const PM = (o) => new THREE.MeshPhysicalMaterial({ envMap: envTex, envMapIntensity: 0.7, ...o });
function labelTex(w, h, draw) { const [c, g, t] = canvasTex(w, h); draw(g, w, h); t.needsUpdate = true; return t; }
const PROP = {
  book: (g, col = 0x2f6fd6) => { const cover = PM({ color: col, roughness: 0.55 }), page = PM({ color: 0xf6f1e6, roughness: 0.8 });
    for (const s of [-1, 1]) { const half = new THREE.Group(); half.rotation.y = s * 0.35; g.add(half);
      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.02), cover); cv.position.set(s * 0.21, 0, -0.012); half.add(cv);
      const pg = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.52, 0.035), page); pg.position.set(s * 0.2, 0, 0.012); half.add(pg);
      const lines = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshBasicMaterial({ map: labelTex(128, 160, (x) => { x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, 128, 160); x.fillStyle = '#8a8478'; for (let i = 0; i < 11; i++) x.fillRect(10, 12 + i * 13, 70 + (i * 37) % 40, 4); }), color: 0xbfbab0 })); lines.position.set(s * 0.2, 0, 0.031); half.add(lines); } },
  notebook: g => { const cv = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.03), PM({ color: 0x1f2937, roughness: 0.6 })); g.add(cv);
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), new THREE.MeshBasicMaterial({ map: labelTex(256, 180, (x) => { x.fillStyle = '#f4f7ff'; x.fillRect(0, 0, 256, 180); x.strokeStyle = '#9fb7e8'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(0, 18 + i * 18); x.lineTo(256, 18 + i * 18); x.stroke(); }
      x.strokeStyle = '#2b4fa8'; x.lineWidth = 4; [[20, 30, 60, 34], [150, 30, 70, 34], [85, 110, 70, 34]].forEach(([a, b, w, h]) => x.strokeRect(a, b, w, h)); x.beginPath(); x.moveTo(80, 47); x.lineTo(150, 47); x.moveTo(185, 64); x.lineTo(130, 110); x.stroke(); }), color: 0xd8dce6 })); pg.position.z = 0.017; g.add(pg);
    const ring = PM({ color: 0xb0b4bd, metalness: 1, roughness: 0.3 }); for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), ring); r.position.set(-0.2 + i * 0.08, 0.18, 0.01); r.rotation.x = Math.PI / 2; g.add(r); } },
  pencil: g => { const pb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), PM({ color: 0xffc83d, roughness: 0.5 })); pb.rotation.z = -Math.PI / 2; pb.position.x = 0.25; g.add(pb);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), PM({ color: 0xf2d0a4, roughness: 0.6 })); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.54; g.add(tip);
    const er = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.06, 10), PM({ color: 0xff8fa3, roughness: 0.7 })); er.rotation.z = -Math.PI / 2; er.position.x = -0.02; g.add(er); },
  can: g => { const tex = labelTex(256, 128, (x) => { x.fillStyle = '#0d0f0d'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#39e75f'; x.fillRect(0, 96, 256, 10); x.strokeStyle = '#39e75f'; x.lineWidth = 9; x.lineCap = 'round';
      for (const dx of [-26, 0, 26]) { x.beginPath(); x.moveTo(128 + dx - 10, 22); x.quadraticCurveTo(128 + dx + 8, 50, 128 + dx - 4, 84); x.stroke(); } });
    tex.wrapS = THREE.RepeatWrapping; const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 32), PM({ map: tex, roughness: 0.25, metalness: 0.6, clearcoat: 0.8 })); g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 32), PM({ color: 0xc9ccd2, metalness: 1, roughness: 0.25 })); top.position.y = 0.2; g.add(top);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.03), PM({ color: 0xc9ccd2, metalness: 1, roughness: 0.3 })); tab.position.set(0.02, 0.217, 0); g.add(tab); },
  mug: g => { const cer = PM({ color: 0xf2efe8, roughness: 0.35, clearcoat: 0.6 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.3, 32, 1, true), cer); g.add(b);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), cer); bot.rotation.x = Math.PI / 2; bot.position.y = -0.15; g.add(bot);
    const cof = new THREE.Mesh(new THREE.CircleGeometry(0.135, 24), PM({ color: 0x3a1f0f, roughness: 0.15 })); cof.rotation.x = -Math.PI / 2; cof.position.y = 0.12; g.add(cof);
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.022, 8, 20), cer); h.position.set(0.16, 0, 0); g.add(h);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), PM({ color: 0xe8743b, roughness: 0.5 })); logo.position.set(0, 0, 0.142); g.add(logo);
    g.userData.steam = []; for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.22), new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.5 })); s.position.set(-0.05 + i * 0.05, 0.3, 0); g.add(s); g.userData.steam.push(s); } },
  flask: g => { const glass = PM({ color: 0xe8fbff, roughness: 0.02, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), glass); g.add(bulb); const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.2, 16, 1, true), glass); neck.position.y = 0.2; g.add(neck);
    const liq = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), PM({ color: 0x3ddc84, emissive: 0x0f5a2e, roughness: 0.2, transparent: true, opacity: 0.85 })); g.add(liq);
    g.userData.bub = []; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), PM({ color: 0xbfffd8, emissive: 0x2a8f55, transparent: true, opacity: 0.8 })); g.add(b); g.userData.bub.push(b); } },
  clipboard: g => { const bd = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.025), PM({ color: 0x8a5a33, roughness: 0.6 })); g.add(bd);
    const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.46), new THREE.MeshBasicMaterial({ map: labelTex(128, 164, (x) => { x.fillStyle = '#fbfaf7'; x.fillRect(0, 0, 128, 164); x.font = '700 18px Inter'; for (let i = 0; i < 6; i++) { x.fillStyle = i === 4 ? '#dc2626' : '#16a34a'; x.fillText(i === 4 ? '✗' : '✓', 12, 34 + i * 22); x.fillStyle = '#9a958c'; x.fillRect(36, 22 + i * 22, 70, 5); } }), color: 0xd6d3cc })); pp.position.set(0, -0.02, 0.014); g.add(pp);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.04), PM({ color: 0xb0b4bd, metalness: 1, roughness: 0.3 })); clip.position.set(0, 0.27, 0.02); g.add(clip); },
  shield: g => { const sh = new THREE.Shape(); sh.moveTo(0, 0.3); sh.quadraticCurveTo(0.24, 0.27, 0.25, 0.14); sh.quadraticCurveTo(0.22, -0.16, 0, -0.3); sh.quadraticCurveTo(-0.22, -0.16, -0.25, 0.14); sh.quadraticCurveTo(-0.24, 0.27, 0, 0.3);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), PM({ color: 0x16a34a, roughness: 0.3, clearcoat: 0.7 })); m.position.z = -0.03; g.add(m);
    const ck = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: labelTex(128, 128, (x) => { x.strokeStyle = '#fff'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(30, 66); x.lineTo(56, 92); x.lineTo(100, 38); x.stroke(); }), transparent: true })); ck.position.z = 0.05; g.add(ck); },
  padlock: g => { const b = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.24, 0.12, 3, 0.04), PM({ color: 0xf5b301, metalness: 0.7, roughness: 0.3 })); g.add(b);
    const sk = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 10, 24, Math.PI), PM({ color: 0xc9ccd2, metalness: 1, roughness: 0.25 })); sk.position.y = 0.12; g.add(sk); g.userData.shackle = sk;
    const kh = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), PM({ color: 0x1a1a1a })); kh.position.z = 0.061; g.add(kh); },
  horn: g => { const tex = labelTex(128, 64, (x) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#e8743b' : '#facc15'; x.fillRect(i * 16, 0, 16, 64); } });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.55, 24, 1, true), PM({ map: tex, roughness: 0.5, side: THREE.DoubleSide })); cone.rotation.z = -Math.PI / 2; cone.position.x = 0.3; g.add(cone);
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 20, Math.PI * 1.5), PM({ color: 0x60a5fa, roughness: 0.4 })); curl.position.x = 0.62; g.add(curl); g.userData.curl = curl; },
};
const steamTex = labelTex(32, 128, (x) => { const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(16, 64, 10, 60, 0, 0, 7); x.fill(); });
// a prop on the body, visible in [t0,t1) (wraps), popping in and out
const BPROPS = [];
function bodyProp(c, kind, pos, rot, t0, t1, arg) { const g = new THREE.Group(); PROP[kind](g, arg); g.position.copy(pos); g.rotation.set(...rot); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); c.bodyPivot.add(g); const p = { c, g, kind, t0, t1, base: g.scale.clone() }; BPROPS.push(p); return p; }
function armProp(c, kind, t0, t1, far = false) { const g = new THREE.Group(); PROP[kind](g); g.position.x = L_ARM + R_NUB * 0.3; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); (far ? c.armF : c.armN).children[0].add(g); const p = { c, g, kind, t0, t1 }; BPROPS.push(p); return p; }
const inWin = (t, a, b) => a <= b ? (t >= a && t < b) : (t >= a || t < b);
function propAmt(t, a, b) { const d0 = ((t - a) % DUR + DUR) % DUR, d1 = ((b - t) % DUR + DUR) % DUR; if (!inWin(t, a, b)) return 0; return s5(0, 0.22, d0) * s5(0, 0.18, d1) * (1 + 0.25 * bump(0.05, 0.35, d0)); }
function updateProps(t) {
  for (const p of BPROPS) { if (p.c) { const a = propAmt(t, p.t0, p.t1); p.g.visible = a > 0.001; if (!p.g.visible) continue; p.g.scale.setScalar(Math.max(0.001, a)); }
    const u = p.g.userData;
    if (u.steam) u.steam.forEach((s, i) => { const ph = (t * 0.6 + i * 0.33) % 1; s.position.y = 0.22 + ph * 0.35; s.material.opacity = 0.45 * Math.sin(Math.PI * ph); s.position.x = -0.05 + i * 0.05 + Math.sin(t * 3 + i) * 0.02; s.quaternion.copy(camera.quaternion); });
    if (u.bub) u.bub.forEach((b, i) => { const ph = (t * 0.9 + i * 0.25) % 1; b.position.set(Math.sin(i * 2.1) * 0.06, -0.05 + ph * 0.42, Math.cos(i * 1.7) * 0.05); b.visible = ph < 0.9; });
    if (u.shackle) { const open = 1 - s5(E.lock, E.lock + 0.12, t); u.shackle.position.y = 0.12 + 0.07 * open; u.shackle.rotation.y = open * 0.9; }
    if (u.curl) { const blow = bump(E.live + 0.02, E.live + 0.6, t); u.curl.scale.setScalar(1 + 2.2 * blow); u.curl.position.x = 0.62 + 0.25 * blow; }
  }
}
// speech bubbles (billboards)
const BUBBLES = [];
function bubbleIcon(x, icon) {
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1b1c22';
  const txt = (s, sz = 120) => { x.font = `800 ${sz}px Inter`; x.fillText(s, 256, 176); };
  if (icon === 'bulb') { x.fillStyle = '#facc15'; x.beginPath(); x.arc(256, 150, 70, 0, 7); x.fill(); x.fillStyle = '#9ca3af'; x.fillRect(226, 210, 60, 40); x.strokeStyle = '#facc15'; x.lineWidth = 10; for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; x.beginPath(); x.moveTo(256 + Math.cos(a) * 90, 150 + Math.sin(a) * 90); x.lineTo(256 + Math.cos(a) * 118, 150 + Math.sin(a) * 118); x.stroke(); } }
  else if (icon === 'diagram') { x.strokeStyle = '#4f46e5'; x.lineWidth = 12; [[120, 110], [300, 110], [210, 220]].forEach(([a, b]) => x.strokeRect(a, b, 90, 60)); x.beginPath(); x.moveTo(210, 140); x.lineTo(300, 140); x.moveTo(345, 170); x.lineTo(280, 220); x.stroke(); }
  else if (icon === 'lockOpen' || icon === 'lock') { const c = icon === 'lock' ? '#16a34a' : '#dc2626'; x.fillStyle = c; x.fillRect(196, 160, 120, 90); x.strokeStyle = c; x.lineWidth = 22; x.beginPath(); x.arc(256 + (icon === 'lock' ? 0 : 30), 160 - (icon === 'lock' ? 0 : 20), 42, Math.PI, 0); x.stroke(); }
  else if (icon === 'party') { const cs = ['#e8743b', '#4ade80', '#60a5fa', '#facc15', '#c084fc']; for (let i = 0; i < 22; i++) { x.fillStyle = cs[i % 5]; x.save(); x.translate(150 + (i * 53) % 220, 90 + (i * 37) % 170); x.rotate(i); x.fillRect(-10, -16, 20, 32); x.restore(); } }
  else if (icon === 'zap') { x.fillStyle = '#39e75f'; x.beginPath(); x.moveTo(280, 70); x.lineTo(190, 190); x.lineTo(250, 190); x.lineTo(230, 280); x.lineTo(320, 150); x.lineTo(262, 150); x.closePath(); x.fill(); }
  else if (icon === 'check') { x.strokeStyle = '#16a34a'; x.lineWidth = 34; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(170, 180); x.lineTo(235, 245); x.lineTo(345, 115); x.stroke(); }
  else if (icon === 'code') { x.fillStyle = '#4f46e5'; txt('</>', 116); }
  else if (icon === '!') { x.fillStyle = '#dc2626'; txt('!', 170); }
  else if (icon === '?') { x.fillStyle = '#4f46e5'; txt('?', 170); }
  else { x.fillStyle = '#1b1c22'; txt(icon, icon.length > 3 ? 84 : 110); }
}
function bubble(c, t0, t1, icon, side = 1) {
  const [cv, x, tex] = canvasTex(512, 384);
  x.fillStyle = '#ffffff'; x.shadowColor = 'rgba(0,0,0,0.25)'; x.shadowBlur = 18; rrect(x, 20, 20, 472, 300, 90); x.fill(); x.shadowBlur = 0;
  x.beginPath(); x.moveTo(256 - side * 70, 300); x.lineTo(256 - side * 120, 372); x.lineTo(256 - side * 10, 300); x.fill();
  bubbleIcon(x, icon); tex.needsUpdate = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.31), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color(1.05, 1.05, 1.05) }));
  m.renderOrder = 10; scene.add(m); BUBBLES.push({ c, m, t0, t1, side });
}
function updateBubbles(t) {
  for (const b of BUBBLES) { const a = propAmt(t, b.t0, b.t1); b.m.visible = a > 0.001; if (!b.m.visible) continue;
    const head = b.c.bodyPivot.localToWorld(new THREE.Vector3(0, BH + 0.35, 0));
    b.m.position.copy(head).add(new THREE.Vector3(0.0, 0.95 + 0.05 * Math.sin(t * 5), 0)); b.m.quaternion.copy(camera.quaternion);
    b.m.translateX(b.side * 0.75); b.m.scale.setScalar(a); }
}
// set dressing: mini cans and a coffee cup on the deck, a sticky note on the bezel
{
  const put = (kind, x, y, z, ry = 0, s = 1) => { const g = new THREE.Group(); PROP[kind](g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(g); return g; };
  put('can', -5.9, 0.19 * 1.6 + 0.0, 1.9, 0.4, 1.6); put('can', 6.6, 0.19 * 1.6, 2.2, -0.6, 1.6);
  const tipped = put('can', 5.4, 0.12 * 1.6, 1.4, 0, 1.6); tipped.rotation.set(0, 0.5, Math.PI / 2); tipped.position.y = 0.12 * 1.6;
  const cup = put('mug', -4.6, 0.15 * 1.8, 2.6, 0.8, 1.8); cup.userData.static = true; BPROPS.push({ c: null, g: cup, kind: 'mug', t0: 0, t1: DUR - 1e-6 });
}
