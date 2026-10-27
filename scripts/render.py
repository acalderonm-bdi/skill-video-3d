#!/usr/bin/env python3
"""render.py SALIDA ss sub [--audio]   → SALIDA/f_0000.png… (+ master_raw.wav). Bloques de 150 cuadros con .ok → se puede reanudar.
   preview: ss=1 sub=1 · final: ss=2 sub=8 (2x supermuestreo + motion blur de 8 subcuadros)"""
import asyncio, sys, base64, os, time, json
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import serve
GL = os.environ.get("GLARGS", "--use-angle=gl-egl --ignore-gpu-blocklist --enable-gpu" if sys.platform.startswith('linux') else "--ignore-gpu-blocklist").split()
async def main():
    out, ss, sub = sys.argv[1], sys.argv[2], sys.argv[3]; cfg = json.load(open('proyecto.json')); NF = cfg['dur'] * 60
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, args=GL, channel=None)
        pg = await b.new_page(viewport={'width': cfg['w'], 'height': cfg['h']})
        pg.on('pageerror', lambda e: print('[pageerror]', str(e)[:500], flush=True))
        await pg.goto(f'{serve.start()}/index.html?render=1&ss={ss}&sub={sub}')
        await pg.wait_for_function('window.READY===true', timeout=180000)
        T = time.time()
        for c0 in range(0, NF, 150):
            ok = f'{out}/chunk_{c0:04d}.ok'
            if os.path.exists(ok): continue
            for f in range(c0, min(c0 + 150, NF)):
                d = await pg.evaluate(f'window.renderFrame({f})')
                open(f'{out}/f_{f:04d}.png', 'wb').write(base64.b64decode(d.split(',')[1]))
                if f % 60 == 0: print(f'cuadro {f}/{NF} · {time.time() - T:.0f}s', flush=True)
            open(ok, 'w').write('ok')
        if '--audio' in sys.argv:
            a = await pg.evaluate('window.renderAudio()'); open(f'{out}/master_raw.wav', 'wb').write(base64.b64decode(a))
        await b.close()
asyncio.run(main())
