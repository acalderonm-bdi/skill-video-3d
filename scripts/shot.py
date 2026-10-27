#!/usr/bin/env python3
"""shot.py "t1,t2,..." [ss] [sub] [--measure]  → stills/tXX.XX.png (+ medidas)   — correr dentro del proyecto"""
import asyncio, sys, base64, json, os
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import serve
GL = os.environ.get("GLARGS", "--use-angle=gl-egl --ignore-gpu-blocklist --enable-gpu" if sys.platform.startswith('linux') else "--ignore-gpu-blocklist").split()
async def main():
    cfg = json.load(open('proyecto.json')); fps = 60
    ts = [float(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 and sys.argv[1] else []
    ss = sys.argv[2] if len(sys.argv) > 2 else '1'; sub = sys.argv[3] if len(sys.argv) > 3 else '1'
    os.makedirs('stills', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, args=GL, channel=None)
        pg = await b.new_page(viewport={'width': cfg['w'], 'height': cfg['h']})
        pg.on('console', lambda m: m.type == 'error' and print('[console]', m.text[:300]))
        pg.on('pageerror', lambda e: print('[pageerror]', str(e)[:500]))
        await pg.goto(f'{serve.start()}/index.html?render=1&ss={ss}&sub={sub}')
        await pg.wait_for_function('window.READY===true', timeout=180000)
        print(json.dumps(await pg.evaluate('window.INFO')))
        if '--measure' in sys.argv: print(json.dumps(await pg.evaluate('window.measure()')))
        for t in ts:
            d = await pg.evaluate(f'window.renderFrame({round(t * fps)})')
            open(f'stills/t{t:05.2f}.png', 'wb').write(base64.b64decode(d.split(',')[1]))
        await b.close()
asyncio.run(main())
