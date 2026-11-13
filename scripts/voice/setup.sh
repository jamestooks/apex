#!/bin/sh
# Sets up the Kokoro voice generator in ~/.cache/apex-voice (once). Needs ffmpeg and network for the first run.
# Works on Intel Macs: pins the last PyTorch with Intel Mac support and a compatible transformers.
set -e
ENV="$HOME/.cache/apex-voice"
mkdir -p "$ENV"
if ! command -v uv >/dev/null 2>&1 && [ ! -x "$ENV/uvenv/bin/uv" ]; then
  python3 -m venv "$ENV/uvenv" && "$ENV/uvenv/bin/pip" install -q --upgrade pip uv
fi
UV=$(command -v uv || echo "$ENV/uvenv/bin/uv")
[ -x "$ENV/kenv/bin/python" ] || "$UV" venv -q --python 3.11 "$ENV/kenv"
"$UV" pip install -q --python "$ENV/kenv/bin/python" "kokoro>=0.9" soundfile "torch==2.2.2" "numpy<2" "transformers==4.46.3" pip
# The bundled espeak-ng library looks for its data one folder up: link it where it looks.
L=$("$ENV/kenv/bin/python" -c "import espeakng_loader, os; print(os.path.dirname(espeakng_loader.__file__))")
for f in "$L"/espeak-ng-data/*; do b=$(basename "$f"); [ -e "$L/$b" ] || ln -s "espeak-ng-data/$b" "$L/$b"; done
echo "Voice generator ready: $ENV/kenv/bin/python"
