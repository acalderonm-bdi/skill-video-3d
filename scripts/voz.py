#!/usr/bin/env python3
"""voz.py — narración local con Qwen3-TTS (correr con el python de ~/.video3d/tts, dentro del proyecto).
1) diseña UNA voz de referencia con VoiceDesign (descripción en proyecto.json), 2) clona esa voz con Base para cada línea
→ todas suenan igual. Elige la toma que cabe en su ventana; si no cabe, atempo ≤ 1.1. Salida: voz/voz.wav, voz/lineaN.wav, voz/voz.json,
parts/05-vozenv.js (envolvente a 60 Hz para que la boca del personaje hable con la voz)."""
import json, os, sys, shutil, subprocess
import numpy as np, soundfile as sf, torch, torchaudio
from qwen_tts import Qwen3TTSModel
cfg = json.load(open('proyecto.json')); V = cfg['voz']; DUR = cfg['dur']; os.makedirs('voz', exist_ok=True)
dev = 'cuda:0' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')
dt = torch.bfloat16 if dev.startswith('cuda') else torch.float32
FF = shutil.which('ffmpeg') or os.path.expanduser('~/.video3d/bin/ffmpeg')
print('dispositivo', dev, flush=True)
load = lambda name: Qwen3TTSModel.from_pretrained(name, dtype=dt, attn_implementation='sdpa', device_map=dev)
torch.manual_seed(V.get('seed', 7))
vd = load('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign')
w, sr = vd.generate_voice_design(text=V['ref_texto'], language=V.get('idioma', 'Spanish'), instruct=V['descripcion']); sf.write('voz/ref.wav', w[0], sr)
del vd; torch.cuda.empty_cache() if dev.startswith('cuda') else None
base = load('Qwen/Qwen3-TTS-12Hz-1.7B-Base')
SR = 48000; out = np.zeros(int(DUR * SR) + SR * 6, np.float32); info = []
for i, L in enumerate(cfg['lineas']):
    best = None
    for seed in range(V.get('tomas', 3)):
        torch.manual_seed(100 + i * 10 + seed)
        ws, s2 = base.generate_voice_clone(text=L['texto'], language=V.get('idioma', 'Spanish'), ref_audio='voz/ref.wav', ref_text=V['ref_texto'])
        a = torch.tensor(ws[0]).float(); idx = (a.abs() > 0.01).nonzero(); a = a[max(0, idx[0].item() - 800): idx[-1].item() + 1600]; d = len(a) / s2
        key = (d <= L['max'], -abs(d - L['max'] * 0.92))
        if best is None or key > best[0]: best = (key, a, s2, d)
    _, a, s2, d = best; a = torchaudio.functional.resample(a, s2, SR).numpy(); f = f'voz/linea{i + 1}.wav'; sf.write(f, a, SR)
    if d > L['max']:
        r = min(1.1, d / L['max']); subprocess.run([FF, '-y', '-loglevel', 'error', '-i', f, '-af', f'atempo={r}', f + '.t.wav'], check=True); a, _ = sf.read(f + '.t.wav', dtype='float32'); os.replace(f + '.t.wav', f); d = len(a) / SR
    s = int(L['t0'] * SR); out[s:s + len(a)] += a
    info.append({'i': i + 1, 't0': L['t0'], 'dur': round(d, 2), 'fin': round(L['t0'] + d, 2), 'max': L['max'], 'cabe': d <= L['max'] + 0.05, 'texto': L['texto']}); print(info[-1], flush=True)
n = DUR * SR; out[:len(out) - n] += out[n:]; out = out[:n]  # lo que pasa del final se pliega al inicio (loop)
sf.write('voz/voz.wav', out, SR); json.dump(info, open('voz/voz.json', 'w'), ensure_ascii=False, indent=1)
hop = SR // 60; env = [float(np.sqrt(np.mean(out[i * hop:(i + 1) * hop] ** 2))) for i in range(DUR * 60)]; m = max(env) or 1
os.makedirs('parts', exist_ok=True); open('parts/05-vozenv.js', 'w').write('const VOZENV = ' + json.dumps([round(min(1, (e / m) ** 0.6 * 1.25), 3) for e in env]) + ';\n')
print('listo: voz/voz.wav + parts/05-vozenv.js')
