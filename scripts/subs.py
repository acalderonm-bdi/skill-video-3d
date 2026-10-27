#!/usr/bin/env python3
"""subs.py → subs.ass: subtítulos con los tiempos reales de la voz (voz/voz.json) + rótulo de fase. Arriba en vertical, abajo en horizontal."""
import json
cfg = json.load(open('proyecto.json')); W, H = cfg['w'], cfg['h']; vert = H > W
try: info = json.load(open('voz/voz.json'))
except FileNotFoundError: info = [{'t0': L['t0'], 'dur': L['max']} for L in cfg['lineas']]
ts = lambda s: f"{int(s // 3600)}:{int(s % 3600 // 60):02d}:{s % 60:05.2f}"
cap, tag = (62, 38) if vert else (52, 30)
al, mv, mt = (8, 150, 80) if vert else (2, 70, 0)
out = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "", "[V4+ Styles]",
 "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
 f"Style: Cap,Inter,{cap},&H00FFFFFF,&H00FFFFFF,&H00140D0A,&H64000000,-1,0,0,0,100,100,0,0,1,5,2,{al},70,70,{mv},1",
 f"Style: Tag,Inter,{tag},&H003B74E8,&H003B74E8,&H00140D0A,&H64000000,-1,0,0,0,100,100,6,0,1,4,0,{8 if vert else 7},70,70,{mt if vert else 50},1", "", "[Events]",
 "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
for F in cfg.get('fases', []):
    if F.get('rotulo'): out.append(f"Dialogue: 1,{ts(F['t0'] + 0.05)},{ts(F['t1'] - 0.05)},Tag,,0,0,0,,{{\\fad(150,150)}}{F['rotulo']}")
for L, I in zip(cfg['lineas'], info):
    parts = L.get('sub') or [L['texto']]; t, d = I['t0'], I['dur']; tot = sum(len(p) for p in parts)
    for j, p in enumerate(parts):
        dd = d * len(p) / tot; end = t + dd + (0.35 if j == len(parts) - 1 else 0)
        out.append(f"Dialogue: 0,{ts(t)},{ts(min(cfg['dur'], end))},Cap,,0,0,0,,{{\\fad(80,80)}}{p}"); t += dd
open('subs.ass', 'w').write('\n'.join(out) + '\n'); print('subs.ass', len(out))
