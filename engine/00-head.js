<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>__TITLE__</title>
<style>@font-face{font-family:Inter;src:url(vendor/fonts/Inter.ttf) format('truetype');font-weight:100 900}@font-face{font-family:'JetBrains Mono';src:url(vendor/fonts/JetBrainsMono.ttf) format('truetype');font-weight:100 900}</style>
<style>html,body{margin:0;background:#000;overflow:hidden;height:100%}canvas{display:block;max-width:100vw;max-height:100vh;margin:auto;aspect-ratio:__W__/__H__}</style>
<script type="importmap">{"imports":{"three":"./vendor/three/three.module.js","three/addons/":"./vendor/three/addons/"}}</script>
</head><body>
<script type="module">
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// ───────────────────────── contract ─────────────────────────
const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
const TFIX = Q.has('t') ? parseFloat(Q.get('t')) : null;
const W = __W__, H = __H__, FPS = 60, DUR = __DUR__, NF = __DUR__ * FPS;
const SS = parseFloat(Q.get('ss') ?? (RENDER ? 2 : 1));
const SUB = parseInt(Q.get('sub') ?? (RENDER ? 8 : 1));
const SHUTTER = 0.45;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const s5 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
const bump = (a, b, x) => (x <= a || x >= b) ? 0 : Math.sin(Math.PI * (x - a) / (b - a));
const DEG = Math.PI / 180, Y = new THREE.Vector3(0, 1, 0);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const wrap = t => ((t % DUR) + DUR) % DUR;

// monotone cubic (Fritsch–Butland), flat at both ends → holds and loop seams have zero velocity
function mono(keys) {
  const n = keys.length, ts = keys.map(k => k[0]), vs = keys.map(k => k[1]);
  if (n === 1) return () => vs[0];
  const d = [], h = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = ts[i + 1] - ts[i]; d[i] = (vs[i + 1] - vs[i]) / h[i]; }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return t => {
    if (t <= ts[0]) return vs[0]; if (t >= ts[n - 1]) return vs[n - 1];
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid; }
    const hh = h[lo], s = (t - ts[lo]) / hh, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * vs[lo] + (s3 - 2 * s2 + s) * hh * m[lo] + (-2 * s3 + 3 * s2) * vs[hi] + (s3 - s2) * hh * m[hi];
  };
}
class Tracks {
  constructor() { this.k = {}; this.f = {}; }
  set(n, t, v) { (this.k[n] ||= new Map()).set(Math.round(t * 1e4) / 1e4, v); }
  pose(t, o) { for (const n in o) this.set(n, t, o[n]); }
  get(n, t) { return this.f[n] ? this.f[n](t) : 0; }
  build() {
    for (const n in this.k) {
      const mp = this.k[n]; const arr = [...mp.entries()].sort((a, b) => a[0] - b[0]);
      if (arr[0][0] > 0) arr.unshift([0, arr[arr.length - 1][1]]);
      if (arr[arr.length - 1][0] < DUR) arr.push([DUR, arr[0][1]]);
      this.f[n] = mono(arr);
    }
  }
}


