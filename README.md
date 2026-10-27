# video-3d — skill de Claude Code

Videos 3D animados de Clawd (la mascota de Claude) hechos en código: un HTML de three.js con `renderAt(t)` puro, render cuadro a cuadro en Chromium headless, narración con Qwen3-TTS, subtítulos y mezcla con ffmpeg. **Todo local**: sin CDN, sin servicios externos, sin conexión a otras máquinas.

```bash
bash scripts/install.sh          # una vez: ~/.video3d (Chromium, PyTorch, Qwen3-TTS, Whisper, ffmpeg) + comando v3d
v3d nuevo ~/Desktop/video-tema   # proyecto desde la plantilla (maestro + equipo, 9:16)
cd ~/Desktop/video-tema && v3d voz && v3d verificar && v3d stills "1,8,15,22" && v3d preview   # → preview.mp4
v3d final                        # 2x + motion blur → final.mp4
```
En Claude Code basta con decir «haz un video 3D de <tema>»: la skill pide el tema y hace el resto (ver `SKILL.md`).

Estructura: `engine/` (motor común) · `template/` (proyecto base) · `scripts/` (v3d, install, build, voz, render, mux, subs) · `examples/` (3 videos completos) · `vendor/` (three.js r160 y fuentes) · `LECCIONES.md`.

Licencias de terceros: three.js (MIT), Inter y JetBrains Mono (SIL OFL 1.1), Qwen3-TTS (Apache 2.0, se descarga al instalar).
