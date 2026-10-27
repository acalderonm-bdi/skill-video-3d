#!/usr/bin/env python3
"""build.py PROYECTO → PROYECTO/index.html  (motor de la skill + partes del proyecto, en orden numérico)"""
import json, os, sys, glob
P = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
ENG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'engine')
cfg = json.load(open(os.path.join(P, 'proyecto.json')))
files = sorted(glob.glob(os.path.join(ENG, '*.js')) + glob.glob(os.path.join(P, 'parts', '*.js')), key=lambda f: os.path.basename(f))
out = []
for f in files:
    s = open(f).read()
    if os.path.basename(f).startswith('00-'):
        s = s.replace('__TITLE__', cfg['title']).replace('__W__', str(cfg['w'])).replace('__H__', str(cfg['h'])).replace('__DUR__', str(cfg['dur']))
    out.append(s)
import shutil
shutil.copytree(os.path.join(ENG, '..', 'vendor'), os.path.join(P, 'vendor'), dirs_exist_ok=True)
open(os.path.join(P, 'index.html'), 'w').write('\n'.join(out))
print('index.html', sum(s.count('\n') for s in out), 'líneas ←', ', '.join(os.path.basename(f) for f in files))
