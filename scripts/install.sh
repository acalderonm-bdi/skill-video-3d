#!/usr/bin/env bash
# install.sh — deja TODO listo en esta máquina (Linux x86_64/aarch64 con o sin NVIDIA, o Mac Apple Silicon).
# Descarga una sola vez (paquetes, Chromium, modelos de voz y de Whisper); después todo corre offline.
# Destino: ~/.video3d  (render/ = Playwright+Chromium, tts/ = Qwen3-TTS + Whisper, bin/ = ffmpeg, env.sh)
set -euo pipefail
ROOT="${VIDEO3D_HOME:-$HOME/.video3d}"; mkdir -p "$ROOT/bin"; OS=$(uname -s); ARCH=$(uname -m)
log(){ printf '\n▸ %s\n' "$*"; }
PY=$(command -v python3.12 || command -v python3.11 || command -v python3) || { echo "necesito python3 ≥ 3.10"; exit 1; }
mkvenv(){ "$PY" -m venv "$1" 2>/dev/null || { log "python3-venv no disponible: uso uv"; command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh; "$HOME/.local/bin/uv" venv -p 3.12 "$1"; "$HOME/.local/bin/uv" pip install -p "$1/bin/python" pip; }; }
log "ffmpeg (con libass para subtítulos)"
if command -v ffmpeg >/dev/null && ffmpeg -hide_banner -filters 2>/dev/null | grep -q " ass "; then echo "ya está";
elif [ "$OS" = Darwin ]; then command -v brew >/dev/null || { echo "instala Homebrew primero"; exit 1; }; brew install ffmpeg;
else A=$([ "$ARCH" = aarch64 ] || [ "$ARCH" = arm64 ] && echo arm64 || echo amd64); T=$(mktemp -d); curl -sL "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$A-static.tar.xz" | tar -xJ -C "$T"; cp "$T"/ffmpeg-*-static/ffmpeg "$T"/ffmpeg-*-static/ffprobe "$ROOT/bin/"; fi
log "render: Playwright + Chromium"
[ -x "$ROOT/render/bin/python" ] || mkvenv "$ROOT/render"
"$ROOT/render/bin/pip" install -q -U pip playwright pillow numpy
"$ROOT/render/bin/python" -m playwright install chromium
log "voz: PyTorch + Qwen3-TTS"
[ -x "$ROOT/tts/bin/python" ] || mkvenv "$ROOT/tts"
P="$ROOT/tts/bin/pip"; $P install -q -U pip wheel
if [ "$OS" = Darwin ]; then $P install -q torch torchaudio;
elif command -v nvidia-smi >/dev/null; then $P install -q torch torchaudio --index-url https://download.pytorch.org/whl/cu130 || $P install -q torch torchaudio --index-url https://download.pytorch.org/whl/cu128;
else $P install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu; fi
$P install -q -U qwen-tts soundfile numpy huggingface_hub
if [ "$OS" = Darwin ]; then $P install -q mlx-whisper; else $P install -q faster-whisper; fi
: > "$ROOT/env.sh"; echo "export PATH=\"$ROOT/bin:\$PATH\"" >> "$ROOT/env.sh"
# Triton (Linux+CUDA) compila con Python.h; sin sudo se sacan los headers del .deb a una carpeta propia
if [ "$OS" = Linux ] && command -v nvidia-smi >/dev/null; then
  V=$("$ROOT/tts/bin/python" -c 'import sys;print(f"{sys.version_info[0]}.{sys.version_info[1]}")')
  if ! "$ROOT/tts/bin/python" -c "import sysconfig,os,sys;sys.exit(0 if os.path.exists(os.path.join(sysconfig.get_paths()['include'],'Python.h')) else 1)"; then
    log "headers de Python $V (sin sudo)"; H="$ROOT/pyhdr"; mkdir -p "$H"; (cd "$H" && apt-get download "python$V-dev" "libpython$V-dev" && for f in *.deb; do dpkg -x "$f" root; done)
    I="$H/root/usr/include"; echo "export C_INCLUDE_PATH=\"$I/python$V:$I/$(uname -m)-linux-gnu:$I\"" >> "$ROOT/env.sh"; fi
fi
log "modelos (una sola vez)"
"$ROOT/tts/bin/python" - <<'PY'
from huggingface_hub import snapshot_download
for r in ['Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', 'Qwen/Qwen3-TTS-12Hz-1.7B-Base', 'Qwen/Qwen3-TTS-Tokenizer-12Hz']: print(snapshot_download(r))
import sys
if sys.platform == 'darwin': print(snapshot_download('mlx-community/whisper-large-v3-turbo'))
else: print(snapshot_download('mobiuslabsgmbh/faster-whisper-large-v3-turbo'))
PY
mkdir -p "$HOME/.local/bin"; ln -sf "$(cd "$(dirname "$0")" && pwd)/v3d" "$HOME/.local/bin/v3d"
log "listo · comando: v3d   (si no lo encuentra: export PATH=\$HOME/.local/bin:\$PATH)"
