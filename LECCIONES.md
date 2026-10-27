# Lecciones (léelas antes; agrega las tuyas al terminar)

## Técnicas
- **Chromium headless + GPU en Linux NVIDIA**: `--use-angle=gl-egl` (con `vulkan` truena al crear pipelines y sin flags cae a SwiftShader). Se puede cambiar con `GLARGS`.
- **Módulos ES no cargan desde `file://`** → los scripts levantan un servidor estático en 127.0.0.1 (`serve.py`). three.js y fuentes van en `vendor/` (sin CDN).
- **Triton (Linux+CUDA) compila con `Python.h`**; sin sudo, `install.sh` saca los headers del `.deb` a `~/.video3d/pyhdr` y los exporta en `env.sh`.
- **Qwen3-TTS**: VoiceDesign genera la referencia, Base la clona → misma voz en todas las líneas. 3 tomas por línea, gana la que cabe. ~7 s por línea en GPU.
- **Verifica la voz con Whisper** (no se puede escuchar): `v3d verificar`.
- **alimiter mete latencia** → ceros al inicio → AAC hace un pico falso de +1.5 dB a los 13 ms. Usar `latency=1`. El pico se mide en el MP4, no en el WAV.
- **`pgrep -f` en un `ssh … 'while pgrep …'` se encuentra a sí mismo** → bucle infinito. Usar archivos `.ok`/«FIN» en el log.
- **Loop de audio**: renderizar unos segundos de más y sumar la cola sobre el inicio (los ecos cruzan el corte sin salto).
- **Interpolación**: Hermite monótona (Fritsch–Butland) con pendiente cero en los extremos → sin rebotes falsos y el loop cierra en pose y velocidad.
- **Toques exactos**: resolver ángulo de brazo/salto al cargar (`solveTap`), estirar el muñón hasta que el cuerpo quede ≥ 0.2 cm del vidrio, y un «clamp» que gira el brazo si se mete al vidrio. `v3d medir` lo comprueba.

## De diseño (lo que pidió el usuario)
- Clawd tiene que parecerse al logo de Claude Code (ver SKILL.md). Al principio tenía cejas y boca y se veía genérico.
- Los personajes de lado/espaldas «no se ven»: siempre de frente, giro solo para tocar.
- Pidió «más detallitos»: utilería por fase, set dressing y que platiquen entre ellos. Es lo que más mejoró el video.
- Cámara: tomas cercanas; con 9:16 dejar el tercio de arriba para subtítulos. Giros ≤ 0.5°/cuadro.
- Blender no: sin build oficial ARM64 con GPU y el resultado se aleja del estilo.
