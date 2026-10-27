#!/usr/bin/env python3
"""sheet.py → stills/_sheet.jpg (hoja de contacto de los stills, para revisarlos de un vistazo)"""
import glob
from PIL import Image
fs = sorted(glob.glob('stills/t*.png')); ims = [Image.open(f) for f in fs]
if not ims: raise SystemExit('sin stills')
w, h = ims[0].size; k = 640 / max(w, h); tw, th = int(w * k), int(h * k); cols = min(len(ims), 6 if h > w else 3); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (tw * cols, th * rows))
for i, im in enumerate(ims): S.paste(im.resize((tw, th)), ((i % cols) * tw, (i // cols) * th))
S.save('stills/_sheet.jpg', quality=85); print('stills/_sheet.jpg', len(ims))
