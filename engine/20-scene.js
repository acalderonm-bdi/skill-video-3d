// ───────────────────────── renderer & scene ─────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = true;
document.body.appendChild(renderer.domElement);
RectAreaLightUniformsLib.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
const pmrem = new THREE.PMREMGenerator(renderer);
function nightEnv() { // dark room: warm lamp, indigo screen, white card, warm desk bounce
  const s = new THREE.Scene(), bm = c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
  s.add(new THREE.Mesh(new THREE.BoxGeometry(120, 70, 120), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.014, 0.012, 0.016), side: THREE.BackSide })));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 10), bm(new THREE.Color(16, 9, 3.8))); lamp.position.set(26, 26, 30); s.add(lamp);
  const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 10), bm(new THREE.Color(4, 2.2, 1))); lamp2.position.set(-34, 22, 18); s.add(lamp2);
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(34, 20), bm(new THREE.Color(0.09, 0.1, 0.34))); sc.position.set(0, 10, -9); s.add(sc);
  const cd = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), bm(new THREE.Color(1.1, 1.15, 1.3))); cd.position.set(0, 3, -7); s.add(cd);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), bm(new THREE.Color(0.09, 0.05, 0.028))); desk.rotation.x = -Math.PI / 2; desk.position.y = -6; s.add(desk);
  return pmrem.fromScene(s, 0.015, 0.1, 400).texture;
}
const envTex = nightEnv();
function noiseTex(seed, size, fn) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), im = g.createImageData(size, size), rr = mulberry32(seed); for (let i = 0; i < size * size; i++) { const v = fn(i % size, (i / size) | 0, rr) * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return [t, g, c]; }
const camera = new THREE.PerspectiveCamera(W > H ? 2 * Math.atan(12 / 40) / DEG : 50, W / H, 0.05, 600); // 40 mm equiv (24 mm sensor height)
camera.layers.enable(1);

await document.fonts.load('600 80px Inter'); await document.fonts.load('800 80px Inter'); await document.fonts.load('500 80px Inter'); await document.fonts.load('700 80px Inter'); await document.fonts.ready;

function canvasTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return [c, c.getContext('2d'), t]; }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// desk
{
  const [c, g, t] = canvasTex(2048, 2048); const rnd = mulberry32(7);
  const grd = g.createLinearGradient(0, 0, 2048, 0); grd.addColorStop(0, '#6b4429'); grd.addColorStop(0.5, '#7a4e2f'); grd.addColorStop(1, '#68412a');
  g.fillStyle = grd; g.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 900; i++) { const y = rnd() * 2048, a = 0.03 + rnd() * 0.07; g.strokeStyle = rnd() > 0.5 ? `rgba(40,22,10,${a})` : `rgba(160,110,70,${a * 0.7})`; g.lineWidth = 1 + rnd() * 5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 2048; x += 64) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 10 + (rnd() - 0.5) * 3); g.stroke(); }
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), new THREE.MeshStandardMaterial({ map: t, roughness: 0.48, metalness: 0, envMap: envTex, envMapIntensity: 0.2 }));
  desk.rotation.x = -Math.PI / 2; desk.position.set(0, -1.2, 20); desk.receiveShadow = true; scene.add(desk);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.MeshStandardMaterial({ color: 0x1c1b22, roughness: 0.95 }));
  wall.position.set(0, 60, -70); scene.add(wall);
}
// laptop
const brushed = (() => { const N = 1024, rows = new Float32Array(N), rr = mulberry32(5); let v = 0; for (let y = 0; y < N; y++) { v = 0.6 * v + 0.4 * rr(); rows[y] = v; } const [t] = noiseTex(6, N, (x, y, rnd) => clamp(0.5 + (rows[y] - 0.5) * 0.7 + (rnd() - 0.5) * 0.12, 0, 1)); t.repeat.set(6, 6); return t; })();
const alu = new THREE.MeshPhysicalMaterial({ color: 0xa7abb2, metalness: 1, roughness: 0.33, anisotropy: 0.8, bumpMap: brushed, bumpScale: 0.22, envMap: envTex, envMapIntensity: 0.9 });
const laptop = new THREE.Group(); scene.add(laptop);
let KEYS;
{
  const base = new THREE.Mesh(new RoundedBoxGeometry(30, 1.2, 21, 4, 0.4), alu); base.position.set(0, -0.6, 9.7); base.receiveShadow = true; base.castShadow = true; laptop.add(base);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(27.2, 9.8), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.8 }));
  plate.rotation.x = -Math.PI / 2; plate.position.set(0, 0.002, 7.6); plate.receiveShadow = true; laptop.add(plate);
  const keyG = new RoundedBoxGeometry(1.62, 0.1, 1.5, 2, 0.12), keyM = new THREE.MeshStandardMaterial({ color: 0x202126, roughness: 0.55, envMap: envTex, envMapIntensity: 0.25 });
  const keys = KEYS = new THREE.InstancedMesh(keyG, keyM, 6 * 14); let k = 0; const m = new THREE.Matrix4();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) { m.makeTranslation(-12.3 + c * 1.89 + (r === 5 ? 0.0 : 0), 0.03, 3.4 + r * 1.75); if (r === 0) m.scale(new THREE.Vector3(1, 1, 0.55)); keys.setMatrixAt(k++, m); }
  keys.receiveShadow = true; keys.position.y = 0; laptop.add(keys);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(13, 7.6), new THREE.MeshPhysicalMaterial({ color: 0xb4b7bd, metalness: 1, roughness: 0.22, envMap: envTex, envMapIntensity: 0.5 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.003, 16.2); pad.receiveShadow = true; laptop.add(pad);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 26, 24), new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.4, metalness: 0.6, envMap: envTex, envMapIntensity: 0.4 }));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, -0.05, -0.42); laptop.add(hinge);
}
const lid = new THREE.Group(); lid.position.set(0, 0, LID_Z); lid.rotation.x = -TILT; laptop.add(lid);
let pageTex, widget, widgetTex, wctx, display;
{
  const shell = new THREE.Mesh(new RoundedBoxGeometry(30, 19.4, 0.5, 4, 0.22), alu); shell.position.set(0, 9.6, -0.27); shell.castShadow = true; shell.receiveShadow = true; lid.add(shell);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(29.6, 19.1), new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMap: envTex, envMapIntensity: 0.6 }));
  bezel.position.set(0, 9.6, 0.0); lid.add(bezel);
  // page
  const [pc, pg, pt] = canvasTex(4096, Math.round(4096 * (DISP.v1 - DISP.v0) / (DISP.u1 - DISP.u0)));
  const ppx = pc.width / (DISP.u1 - DISP.u0), px = u => (u - DISP.u0) * ppx, py = v => (DISP.v1 - v) * ppx;
  { const bg = pg.createLinearGradient(0, 0, pc.width, pc.height); bg.addColorStop(0, '#11131c'); bg.addColorStop(0.55, '#171a2a'); bg.addColorStop(1, '#2a1a16'); pg.fillStyle = bg; pg.fillRect(0, 0, pc.width, pc.height);
    const gl = pg.createRadialGradient(px(9), py(12), 10, px(9), py(12), 2200); gl.addColorStop(0, 'rgba(232,116,59,0.28)'); gl.addColorStop(1, 'rgba(232,116,59,0)'); pg.fillStyle = gl; pg.fillRect(0, 0, pc.width, pc.height);
    pg.fillStyle = 'rgba(10,11,16,0.9)'; pg.fillRect(0, 0, pc.width, py(18.3)); pg.fillStyle = '#d7dbe8'; pg.font = `700 ${0.36 * ppx}px Inter`; pg.fillText('✳ Clawd Studio', px(-13.6), py(18.48));
    pg.font = `500 ${0.32 * ppx}px Inter`; pg.fillStyle = '#8e93a9'; ['Archivo', 'Editar', 'Ver', 'Terminal', 'Ayuda'].forEach((s, i) => pg.fillText(s, px(-9.6 + i * 2.1), py(18.48))); pg.fillText('10:42', px(12.4), py(18.48));
    pg.fillStyle = 'rgba(232,116,59,0.08)'; pg.font = `800 ${3.2 * ppx}px Inter`; pg.fillText('ship it.', px(-12.5), py(12.5)); }
  pageTex = pt;
  display = new THREE.Mesh(new THREE.PlaneGeometry(DISP.u1 - DISP.u0, DISP.v1 - DISP.v0), new THREE.MeshBasicMaterial({ map: pt, color: new THREE.Color(1.15, 1.15, 1.15), toneMapped: false }));
  display.position.set((DISP.u0 + DISP.u1) / 2, (DISP.v0 + DISP.v1) / 2, 0.003); lid.add(display);
  const [wc, wg, wt] = canvasTex(WCW, WCH); wctx = wg; widgetTex = wt; wt.generateMipmaps = true; wt.minFilter = THREE.LinearMipmapLinearFilter;
  widget = new THREE.Mesh(new THREE.PlaneGeometry(WG.w, WG.h), new THREE.MeshBasicMaterial({ map: wt, transparent: true, color: new THREE.Color(1.22, 1.22, 1.22), toneMapped: false, depthWrite: false }));
  widget.position.set(WG.u0 + WG.w / 2, WG.v0 + WG.h / 2, 0.006); lid.add(widget);
}
// the glass: an additive reflection on the display (Clawd, the lamp and the room show in it)
const REFL = { strength: 0.06 };
const refl = new Reflector(new THREE.PlaneGeometry(DISP.u1 - DISP.u0, DISP.v1 - DISP.v0), {
  textureWidth: 1920, textureHeight: 1200, multisample: 4, clipBias: 0.002,
  shader: { name: 'GlassReflection', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: REFL.strength } },
    vertexShader: Reflector.ReflectorShader.vertexShader,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float strength; varying vec4 vUv;
      void main(){ vec4 b = texture2DProj(tDiffuse, vUv); vec4 b2 = texture2DProj(tDiffuse, vUv + vec4(0.0015, 0.0, 0.0, 0.0)*vUv.w); gl_FragColor = vec4(mix(b.rgb, b2.rgb, 0.5) * strength, 1.0); }` }
});
refl.material.transparent = true; refl.material.blending = THREE.AdditiveBlending; refl.material.depthWrite = false;
refl.camera.layers.enable(1); refl.position.set((DISP.u0 + DISP.u1) / 2, (DISP.v0 + DISP.v1) / 2, 0.009); refl.renderOrder = 5; lid.add(refl);
// screen light: whole display (dim, indigo) + the white widget (bright, follows the card) + dialog
const screenLight = new THREE.RectAreaLight(0x8a92ff, 0.35, 28.6, 18.5); lid.add(screenLight); screenLight.position.set(0, 9.6, 0.05); screenLight.rotation.set(0, Math.PI, 0);
const cardLight = new THREE.RectAreaLight(0xdfe6ff, 4, 1, 1); lid.add(cardLight);
const dlgLight = new THREE.RectAreaLight(0xcfd4ff, 0, 1.6, 0.9); lid.add(dlgLight);
function placeRect(l, u, v, w, h) { l.width = w; l.height = h; l.position.set(u, v, 0.06); l.rotation.set(0, Math.PI, 0); }
// lamp, props, bokeh
const lampSpot = new THREE.SpotLight(0xffcc9a, 1500, 0, 0.62, 0.85, 2);
lampSpot.position.set(17, 25, 25); lampSpot.target.position.set(0.9, 0.6, 7.0); scene.add(lampSpot, lampSpot.target);
lampSpot.castShadow = true; lampSpot.shadow.mapSize.set(4096, 4096); lampSpot.shadow.camera.near = 10; lampSpot.shadow.camera.far = 80; lampSpot.shadow.bias = -0.00008; lampSpot.shadow.normalBias = 0.01; lampSpot.shadow.radius = 4;
const fill = new THREE.SpotLight(0xffc896, 170, 0, 0.7, 1, 2); fill.position.set(-24, 16, 15); fill.target.position.set(0, 1, 0.5); scene.add(fill, fill.target);
scene.add(new THREE.HemisphereLight(0x3c4266, 0x3a2414, 0.18));
{
  const lampM = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.4, metalness: 0.7, envMap: envTex, envMapIntensity: 0.3 });
  const lp = new THREE.Group(); lp.position.set(-30, -1.2, 22); scene.add(lp);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.5, 1.2, 40), lampM); b.position.y = 0.6; lp.add(b);
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 26, 16), lampM); p1.position.set(0, 13, 0); lp.add(p1);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(6, 8, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x2b2a2a, side: THREE.DoubleSide, roughness: 0.6 })); shade.position.set(3, 28, -3); shade.rotation.z = -0.5; lp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(30, 16, 6) })); bulb.position.set(3.6, 25.6, -3); lp.add(bulb);
  const mugM = new THREE.MeshPhysicalMaterial({ color: 0xe9e3d8, roughness: 0.3, clearcoat: 0.6, envMap: envTex, envMapIntensity: 0.4 });
  const mug = new THREE.Group(); mug.position.set(24, -1.2, 18); scene.add(mug);
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(4, 3.8, 9.5, 48, 1, true), mugM); mb.position.y = 4.75; mug.add(mb);
  const mbot = new THREE.Mesh(new THREE.CircleGeometry(3.8, 32), mugM); mbot.rotation.x = -Math.PI / 2; mbot.position.y = 0.4; mug.add(mbot);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(3.85, 32), new THREE.MeshStandardMaterial({ color: 0x2a160b, roughness: 0.15 })); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 8.4; mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.6, 16, 32), mugM); handle.position.set(4.3, 4.8, 0); mug.add(handle);
  const pot = new THREE.Group(); pot.position.set(-24, -1.2, -10); scene.add(pot);
  const pm = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.2, 10, 40), new THREE.MeshStandardMaterial({ color: 0xb8664a, roughness: 0.8 })); pm.position.y = 5; pot.add(pm);
  const leafM = new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.6 }); const lr = mulberry32(3);
  for (let i = 0; i < 26; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), leafM); const a = lr() * Math.PI * 2, hgt = 10 + lr() * 18, rr = 1 + lr() * 6; lf.scale.set(1.2, 4 + lr() * 2, 0.35); lf.position.set(Math.cos(a) * rr, hgt, Math.sin(a) * rr); lf.rotation.set(lr() - 0.5, a, (lr() - 0.5) * 1.4); pot.add(lf); }
  const bk = mulberry32(11);
  for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 + bk() * 0.7, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.07 + bk() * 0.06, 0.8, 0.5).multiplyScalar(3 + bk() * 5) })); s.position.set(-120 + bk() * 240, 8 + bk() * 60, -66); scene.add(s); }
}
scene.traverse(o => { if (o.isMesh) o.receiveShadow = true; });


