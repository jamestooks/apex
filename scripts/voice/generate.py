"""Records a clip for every line in voice/lines.json with Kokoro (runs locally; no text leaves this computer).
Usage: <kokoro env>/bin/python scripts/voice/generate.py [--limit N]
Only makes clips that don't exist yet, so re-running after wording changes is quick. See scripts/voice/README.md."""
import json, re, subprocess, sys, pathlib
import soundfile as sf
from kokoro import KPipeline

ROOT = pathlib.Path(__file__).resolve().parents[2]
VOICE = ROOT / 'voice'
P = 0.86  # Scar: a touch deeper
GRAVEL = f'asetrate={int(24000 * P)},aresample=24000,atempo={1 / P:.4f},tremolo=f=38:d=0.22,volume=2.4,asoftclip=type=tanh,volume=0.7,lowpass=f=6500'
# Trim silence at both ends (keeping a short natural gap) so pieces stitched together flow.
TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse'
SPEAKERS = {
    'scar': {'voice': 'bm_lewis', 'speed': 0.85, 'filter': GRAVEL},
    'echo': {'voice': 'bf_isabella', 'speed': 0.9, 'filter': 'anull'},
    'narr': {'voice': 'bm_daniel', 'speed': 0.95, 'filter': 'anull'},
}

def speakable(text):
    t = re.sub(r'^[\s,;:.\-]+', '', text)                                   # ", then" -> "then"
    t = re.sub(r'\b([A-Z]{2,})\b', lambda m: m.group(1).capitalize(), t)     # "HOLD" -> "Hold" (not spelled out)
    return t

def duration(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], capture_output=True, text=True).stdout
    return round(float(out.strip() or 0), 2)

def main():
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else None
    lines = json.loads((VOICE / 'lines.json').read_text())
    todo = [l for l in lines if not (VOICE / f"{l['key']}.mp3").exists()][:limit]
    print(f'{len(lines)} lines, {len(todo)} to record', flush=True)
    pipe = KPipeline(lang_code='b', repo_id='hexgrad/Kokoro-82M') if todo else None
    for i, l in enumerate(todo, 1):
        cfg = SPEAKERS[l['speaker']]
        audio = []
        for _, _, a in pipe(speakable(l['text']), voice=cfg['voice'], speed=cfg['speed']):
            audio.extend(a.tolist())
        wav = VOICE / f"{l['key']}.wav"
        sf.write(wav, audio, 24000)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af', cfg['filter'] + ',' + TRIM, '-ac', '1', '-b:a', '48k', str(VOICE / f"{l['key']}.mp3")], check=True)
        wav.unlink()
        if i % 25 == 0 or i == len(todo): print(f'  {i}/{len(todo)}', flush=True)
    keys = {l['key'] for l in lines}
    for f in VOICE.glob('*.mp3'):
        if f.stem not in keys: f.unlink()  # wording that no longer exists
    manifest = {l['key']: duration(VOICE / f"{l['key']}.mp3") for l in lines if (VOICE / f"{l['key']}.mp3").exists()}
    (VOICE / 'manifest.json').write_text(json.dumps(manifest, separators=(',', ':')))
    print(f'manifest: {len(manifest)} clips', flush=True)

main()
