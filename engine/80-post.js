// ───────────────────────── post: accumulate (motion blur) → downsample → DOF → bloom → ACES ─────────────────────────
const POST = { focus: 3, ap: 14, exposure: 1.18 };
const RTO = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace };
const sceneRT = new THREE.WebGLRenderTarget(W * SS, H * SS, { ...RTO, samples: 4 });
const accRT = new THREE.WebGLRenderTarget(W * SS, H * SS, { ...RTO, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const downRT = new THREE.WebGLRenderTarget(W, H, { ...RTO });
const depthRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const dofRT = new THREE.WebGLRenderTarget(W, H, { ...RTO });
const aoRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const litRT = new THREE.WebGLRenderTarget(W, H, { ...RTO });
const vsq = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const accQ = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, k: { value: 1 } }, vertexShader: vsq, fragmentShader: `uniform sampler2D tSrc; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * k, 1.); }`, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
const copyQ = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: vsq, fragmentShader: `uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.); }`, depthTest: false, depthWrite: false }));
const depthMat = new THREE.ShaderMaterial({ vertexShader: `#include <common>\nvarying float vD;\nvoid main(){\n#include <begin_vertex>\n#include <project_vertex>\nvD = -mvPosition.z; }`, fragmentShader: `varying float vD; void main(){ gl_FragColor = vec4(vD, 0., 0., 1.); }` });
const dofQ = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tCol: { value: null }, tDep: { value: null }, focus: { value: 3 }, ap: { value: 14 }, texel: { value: new THREE.Vector2(1 / W, 1 / H) } },
  vertexShader: vsq, fragmentShader: `
  uniform sampler2D tCol, tDep; uniform float focus, ap; uniform vec2 texel; varying vec2 vUv;
  const float GOLDEN = 2.39996323; const float MAXB = 26.0; const float RAD = 0.7;
  float coc(float z){ float c = ap * abs(z - focus) / max(z, 1e-3); return clamp(max(c - 0.6, 0.0), 0.0, MAXB); }
  void main(){
    float cd = texture2D(tDep, vUv).r; float cs = coc(cd);
    vec3 col = texture2D(tCol, vUv).rgb; float tot = 1.0; float r = RAD;
    for (float a = 0.0; a < 2000.0; a += GOLDEN) {
      if (r >= MAXB) break;
      vec2 tc = vUv + vec2(cos(a), sin(a)) * texel * r;
      vec3 sc = texture2D(tCol, tc).rgb; float sd = texture2D(tDep, tc).r; float ss = coc(sd);
      if (sd > cd) ss = clamp(ss, 0.0, cs * 2.0);
      float m = smoothstep(r - 0.5, r + 0.5, ss);
      col += mix(col / tot, sc, m); tot += 1.0; r += RAD / r;
    }
    gl_FragColor = vec4(col / tot, 1.);
  }`, depthTest: false, depthWrite: false
}));
const aoQ = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tDep: { value: null }, th: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(W, H) }, radius: { value: 0.26 } }, vertexShader: vsq, fragmentShader: `
  uniform sampler2D tDep; uniform vec2 th, res; uniform float radius; varying vec2 vUv;
  vec3 vp(vec2 uv){ float z = texture2D(tDep, uv).r; return vec3((uv*2.0-1.0)*th*z, -z); }
  void main(){
    vec3 P = vp(vUv); if (-P.z > 5000.0) { gl_FragColor = vec4(1.0); return; }
    vec2 px = 1.0/res;
    vec3 a = vp(vUv+vec2(px.x,0.0))-P, b = P-vp(vUv-vec2(px.x,0.0)), c = vp(vUv+vec2(0.0,px.y))-P, d = P-vp(vUv-vec2(0.0,px.y));
    vec3 dx = abs(a.z) < abs(b.z) ? a : b, dy = abs(c.z) < abs(d.z) ? c : d;
    vec3 N = normalize(cross(dx, dy));
    float rpx = clamp(radius / (-P.z) / th.y * res.y * 0.5, 2.0, 110.0);
    float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float ao = 0.0;
    for (int i = 0; i < 24; i++) { float fi = float(i); float r = sqrt((fi + 0.5) / 24.0); float an = fi * 2.39996 + n * 6.2831;
      vec3 S = vp(vUv + vec2(cos(an), sin(an)) * r * rpx * px); vec3 v = S - P; float dd = length(v);
      ao += max(0.0, dot(N, v) / (dd + 1e-4) - 0.1) * (1.0 - smoothstep(radius * 0.6, radius * 1.5, dd)); }
    ao = 1.0 - clamp(ao / 24.0 * 1.9, 0.0, 1.0);
    gl_FragColor = vec4(vec3(ao), 1.0);
  }`, depthTest: false, depthWrite: false }));
const aoApplyQ = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tCol: { value: null }, tAO: { value: null }, tDep: { value: null }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, k: { value: 0.8 } }, vertexShader: vsq, fragmentShader: `
  uniform sampler2D tCol, tAO, tDep; uniform vec2 texel; uniform float k; varying vec2 vUv;
  void main(){
    float zc = texture2D(tDep, vUv).r, s = 0.0, w = 0.0;
    for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) { vec2 o = vec2(float(x), float(y)) * texel * 1.6; float z = texture2D(tDep, vUv + o).r;
      float wt = exp(-abs(z - zc) / (0.02 * zc + 1e-3)); s += texture2D(tAO, vUv + o).r * wt; w += wt; }
    float ao = s / max(w, 1e-4);
    gl_FragColor = vec4(texture2D(tCol, vUv).rgb * mix(1.0, ao, k), 1.0);
  }`, depthTest: false, depthWrite: false }));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.22, 0.5, 1.35);
const finalQ = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tSrc: { value: null }, exposure: { value: 1 }, frame: { value: 0 } }, vertexShader: vsq, fragmentShader: `
  uniform sampler2D tSrc; uniform float exposure, frame; varying vec2 vUv;
  vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
  vec3 aces(vec3 c){ const mat3 I = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777); const mat3 O = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602); c *= exposure/0.6; c = I*c; c = RRTAndODTFit(c); c = O*c; return clamp(c,0.,1.); }
  float srgb(float x){ return x <= 0.0031308 ? 12.92*x : 1.055*pow(x, 1.0/2.4) - 0.055; }
  float hash(vec2 p){ p = fract(p*vec2(443.897, 441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
  void main(){
    vec2 q = vUv - 0.5;
    vec3 c = vec3(texture2D(tSrc, vUv - q * 0.0022).r, texture2D(tSrc, vUv).g, texture2D(tSrc, vUv + q * 0.0022).b) * vec3(1.035, 1.0, 0.965); c *= 1.0 - 0.28 * dot(q, q) * 2.0;
    c = aces(c); c = vec3(srgb(c.r), srgb(c.g), srgb(c.b));
    float n = hash(gl_FragCoord.xy + frame * 17.0) + hash(gl_FragCoord.xy * 1.37 + frame * 3.1) - 1.0;
    float l = dot(c, vec3(0.299, 0.587, 0.114)); float gr = (hash(gl_FragCoord.xy * 0.73 + frame * 11.0) - 0.5) * 0.022 * (1.0 - 0.7 * l);
    gl_FragColor = vec4(c + gr + n / 255.0, 1.);
  }`, depthTest: false, depthWrite: false
}));

function drawScene(target) { renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera); }
function renderComposite(t, sub = SUB, frameNo = 0) {
  renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 1); renderer.clear();
  const span = SHUTTER / FPS;
  for (let i = 0; i < sub; i++) {
    const ts = sub === 1 ? t : t + ((i + 0.5) / sub - 0.5) * span;
    setState(ts);
    renderer.setClearColor(scene.background, 1); drawScene(sceneRT);
    accQ.material.uniforms.tSrc.value = sceneRT.texture; accQ.material.uniforms.k.value = 1 / sub;
    renderer.setRenderTarget(accRT); accQ.render(renderer);
  }
  // depth from the centre of the shutter
  setState(t);
  scene.overrideMaterial = depthMat; camera.layers.disable(1);
  renderer.setRenderTarget(depthRT); renderer.setClearColor(new THREE.Color(1e4, 0, 0), 1); renderer.clear(); renderer.render(scene, camera);
  scene.overrideMaterial = null; camera.layers.enable(1); renderer.setClearColor(0x000000, 1);
  // downsample (2x2 box via bilinear tap at the shared corner)
  copyQ.material.uniforms.tSrc.value = accRT.texture; renderer.setRenderTarget(downRT); copyQ.render(renderer);
  const th = Math.tan(camera.fov * DEG / 2); aoQ.material.uniforms.th.value.set(th * camera.aspect, th); aoQ.material.uniforms.tDep.value = depthRT.texture;
  renderer.setRenderTarget(aoRT); aoQ.render(renderer);
  const am = aoApplyQ.material.uniforms; am.tCol.value = downRT.texture; am.tAO.value = aoRT.texture; am.tDep.value = depthRT.texture;
  renderer.setRenderTarget(litRT); aoApplyQ.render(renderer);
  const dm = dofQ.material.uniforms; dm.tCol.value = litRT.texture; dm.tDep.value = depthRT.texture; dm.focus.value = POST.focus; dm.ap.value = POST.ap;
  renderer.setRenderTarget(dofRT); dofQ.render(renderer);
  bloom.render(renderer, null, dofRT, 0, false);
  finalQ.material.uniforms.tSrc.value = dofRT.texture; finalQ.material.uniforms.exposure.value = POST.exposure; finalQ.material.uniforms.frame.value = frameNo;
  renderer.setRenderTarget(null); finalQ.render(renderer);
}

