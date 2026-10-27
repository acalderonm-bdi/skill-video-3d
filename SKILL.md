---
name: video-3d
description: Hace videos 3D animados con Clawd (la mascota de Claude) y su equipo — personajes que leen, arquitectan, codean, prueban, aseguran y despliegan, con un maestro que explica, narración con voz local en español, subtítulos, música y efectos — en formato teléfono 9:16 o horizontal 16:9, renderizados en ESTA máquina sin internet. Solo pide el tema. Úsala cuando pidan "haz un video 3D de…", "video de Clawd explicando…", "un reel/short animado sobre…", "video para teléfono con el personaje de Claude", "como el video del maestro", o cuando haya que instalar el entorno de video 3D en otra máquina ("instala lo de video-3d").
---

# video-3d · videos 3D de Clawd, hechos en código y en local

Un video = **un HTML de three.js con `window.renderAt(t)` puro** (mismo t → mismo cuadro), renderizado cuadro por cuadro en Chromium headless, con la voz generada por **Qwen3-TTS** en la misma máquina. Nada sale a internet al trabajar: three.js y las fuentes viven en `vendor/`, el navegador carga la página desde `127.0.0.1`, los modelos ya están en caché (`HF_HUB_OFFLINE=1`).

Lee **LECCIONES.md** antes de empezar y escribe ahí lo que aprendas al terminar.

## 0 · ¿Está instalado?
`test -x ~/.video3d/render/bin/python && test -x ~/.video3d/tts/bin/python && command -v v3d` — si falta algo: `bash ~/.claude/skills/video-3d/scripts/install.sh` (descarga UNA vez: Chromium, PyTorch, Qwen3-TTS 1.7B VoiceDesign + Base, Whisper; ~10 GB). Linux x86_64/aarch64 (con o sin NVIDIA) o Mac Apple Silicon. Sin sudo.

## 1 · Pregunta solo esto
1. **El tema** (qué explica el video). Es lo único obligatorio.
2. Si no lo dijo: **formato** — teléfono 9:16 (default) u horizontal 16:9 — y **duración** (default 30 s).
Todo lo demás (guion, fases, accesorios, utilería, voz, cámara, música) lo decides tú con las reglas de abajo. No hagas más preguntas.

## 2 · Proyecto
`v3d nuevo ~/Desktop/video-<slug>` → copia la plantilla (el video del maestro: 1 maestro con birrete + puntero que habla con la voz, y 3 Clawds que hacen el trabajo en un laptop). Luego, dentro del proyecto:
- **proyecto.json**: `title`, `w`/`h` (1080×1920 o 1920×1080), `dur`, `voz` (descripción de la voz + texto de referencia), `lineas` (narración: `t0`, `max` = segundos que caben, `texto`, `sub` = 1–2 trozos para subtítulos), `fases` (`t0`,`t1`,`rotulo` naranja tipo «01 · LEER»).
- **parts/** (lo que escribes para cada tema; el motor en `engine/` no se toca):
  - `50-story.js` — la coreografía: personajes, accesorios por fase (`OUTFIT`), utilería (`bodyProp`/`armProp`), pláticas (`chat`), toques a la pantalla (`mkTap` + `tapTurn`), saltos (`hop`), teclas (`KEY`), el maestro (`AIM` = a dónde señala en cada fase).
  - `60-ui.js` — lo que se ve en la pantalla del laptop por fase (ventanas `win(...)`, botones del toolbar en `BTN`, textos, código, terminal, barras).
  - `70-cam.js` — tomas por fase (`camKey`), siempre con orientación parecida entre tomas vecinas.
  - `90-sound.js` — música lo-fi (acordes en 12 compases = loop exacto) + efectos atados a los MISMOS tiempos que la imagen (1 cuadro después).
  Para un tema nuevo: adapta fases, rótulos, textos de pantalla, accesorios y utilería al tema; conserva las reglas de diseño. Ejemplos completos de un solo archivo en `examples/` (maestro 9:16, flujo de desarrollo 16:9, captcha 16:9) para copiar piezas.

## 3 · Ciclo (comandos `v3d`, dentro del proyecto)
1. `v3d voz` → `v3d verificar` (Whisper compara cada línea con el texto; todas ✓ y dentro de su `max`; si no, acorta el texto o ajusta `max`/`t0` y repite).
2. `v3d stills "0.9,6.4,13.7,17.6,24,28.6"` → **mira `stills/_sheet.jpg`** (Read) y corrige encuadre/poses; repite hasta que se vea bien. Nunca entregues sin mirar.
3. `v3d medir` → toques con `err_cm` 0, `minArmGlass ≥ -0.005` (solo la punta toca el vidrio), `minBodyGlass > 0`, `camMaxDegPerFrame ≤ 0.5`.
4. `v3d preview` → `preview.mp4` (1x, rápido) para que el usuario lo vea. Ábrelo (`open`/`xdg-open`).
5. Solo con OK: `v3d final` → `final.mp4` (2x supermuestreo + motion blur de 8 subcuadros; ~3–6 s por cuadro en GPU).
Audio: −14 LUFS, pico ≤ −2 dBFS, voz encima de la música (ducking automático), subtítulos quemados con Inter.

## Reglas de diseño (lo que hizo que se vieran bien)
- **Clawd = logo de Claude Code**: bloque ancho naranja (#d97757 aprox.), dos ojos negros rectangulares verticales, sin cejas ni boca por defecto (la boca solo aparece al hablar/«o»/sonrisa), 4 patitas delgadas en fila, bracitos muñón que solo se estiran al tocar.
- **De frente a la cámara.** Solo giran de lado lo justo para tocar la pantalla y regresan (`tapTurn`). Nada de personajes de espaldas.
- **Detallitos**: cada fase con accesorio en la cabeza (lentes, casco de obra, audífonos, goggles, casco con visor, gorra) + utilería en las manos (libros, libreta y lápiz garabateando, latas genéricas y café con vapor, matraz, clipboard, lupa, escudo, candado, cornetas) + set dressing en la mesa. Que **platiquen**: se voltean a verse, mueven la boca, globos con íconos y murmullo «bla bla».
- **Sin marcas reales** (ni logos ni nombres: latas genéricas, captcha propio, etc.).
- **Teléfono 9:16**: arriba subtítulos + rótulo de fase, en medio la pantalla y el equipo, abajo el maestro; cámara alta en las fases de teclado para que el maestro no tape a nadie.
- **Movimiento**: anticipación → acción → rebote → asentarse en cada salto/toque; los ojos se adelantan al cuerpo; respiración, parpadeos, inercia; loop exacto (`renderAt(DUR) == renderAt(0)`).
- **Voz**: una voz diseñada y luego clonada para todas las líneas (suenan igual); el maestro mueve la boca con la envolvente (`VOZENV`).
