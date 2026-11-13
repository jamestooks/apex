# Voices

Recorded with ElevenLabs (see `voices.json`): Scar = "Julian" and Echo = "Oraya" on the expressive v3 model, the
narrator = "Zane" on Multilingual v2. `voice/sources.json` records which clips came from ElevenLabs.

After changing any wording in the game, record just the new lines (the free ElevenLabs plan is plenty for this):

```sh
node scripts/voice/collect.mjs          # lists every line the game can speak
node scripts/voice/eleven.mjs estimate  # credits needed for lines not yet recorded
node scripts/voice/eleven.mjs generate  # records them (key in ~/.cache/apex-voice/elevenlabs.key)
```

The older local generator (Kokoro: `setup.sh`, `generate.py`, `npm run voice`) still works with no account, but its voices
are flatter and won't match the ElevenLabs ones.

- `voice/lines.json` – every line the game can speak, by speaker (made by `collect.mjs`, which plays the whole game headlessly)
- `voice/<key>.mp3` – one clip per line; `voice/manifest.json` – clip lengths the game uses
- Lines with the child's own words in them are split: each built-in warning sign has its own clip. Anything without a clip
  (a custom sign, the raptor's name) is spoken by the device's built-in voice.
- `npm test` fails if a line in the game has no clip, so you can't forget to re-record.
