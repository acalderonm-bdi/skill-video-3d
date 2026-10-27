#!/usr/bin/env python3
"""asr.py — verifica la narración: transcribe cada línea (mlx-whisper en Mac, faster-whisper en Linux) y la compara con el texto. Local, sin red."""
import json, sys, difflib, re, glob
info = json.load(open('voz/voz.json'))
norm = lambda s: re.sub(r'[^a-záéíóúñü0-9 ]', '', s.lower()).split()
def tr(f):
    try:
        import mlx_whisper; return mlx_whisper.transcribe(f, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='es')['text']
    except ImportError:
        from faster_whisper import WhisperModel
        global M
        if 'M' not in globals(): M = WhisperModel('large-v3-turbo', device='auto', compute_type='auto')
        return ' '.join(s.text for s in M.transcribe(f, language='es')[0])
bad = 0
for L in info:
    h = tr(f"voz/linea{L['i']}.wav").strip(); r = difflib.SequenceMatcher(None, norm(L['texto']), norm(h)).ratio()
    ok = r >= 0.9 and L.get('cabe', True); bad += not ok
    print(('✓' if ok else '✗'), f"{r:.2f}", L['dur'], '/', L['max'], '→', h)
sys.exit(1 if bad else 0)
