#!/bin/bash
# mux.sh CUADROS SALIDA.mp4 [CRF]  — dentro del proyecto.
# música/SFX (de la página) con ducking bajo la voz (voz/voz.wav si existe) → loudnorm -14 LUFS, pico ≤ -2 dBFS → H.264 + subtítulos (subs.ass si existe)
set -e; FF=$(command -v ffmpeg || echo ~/.local/bin/ffmpeg); D=$1; OUT=$2; CRF=${3:-14}
DUR=$(python3 -c "import json;print(json.load(open('proyecto.json'))['dur'])")
if [ -f voz/voz.wav ]; then
  $FF -y -hide_banner -loglevel error -i $D/master_raw.wav -i voz/voz.wav -filter_complex "[1:a]aresample=48000,asplit=2[sc][v];[0:a][sc]sidechaincompress=threshold=0.02:ratio=5:attack=20:release=400:makeup=1[bed];[v]volume=1.9,highpass=f=80,acompressor=threshold=0.1:ratio=3:attack=5:release=120[vv];[bed][vv]amix=inputs=2:normalize=0[m]" -map "[m]" $D/mix.wav
else cp $D/master_raw.wav $D/mix.wav; fi
$FF -hide_banner -i $D/mix.wav -af loudnorm=I=-14:TP=-2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p' > $D/ln.json
g(){ python3 -c "import json;print(json.load(open('$D/ln.json'))['$1'])"; }
$FF -y -hide_banner -loglevel error -i $D/mix.wav -af "loudnorm=I=-14:TP=-2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=192000,alimiter=limit=0.56:attack=1:release=50:level=false:latency=1,aresample=48000" $D/master.wav
VF=""; [ -f subs.ass ] && VF="-vf ass=subs.ass:fontsdir=vendor/fonts"
$FF -y -hide_banner -loglevel error -framerate 60 -i $D/f_%04d.png -i $D/master.wav -map 0:v -map 1:a $VF -c:v libx264 -profile:v high -preset slow -crf $CRF -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 192k -t $DUR -movflags +faststart $OUT
$FF -hide_banner -i $OUT -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
