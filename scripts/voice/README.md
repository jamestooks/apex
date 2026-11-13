# Voices

Scar (Kokoro "Lewis", slower, deeper, with a gravel effect), Echo ("Isabella") and the narrator ("Daniel") are
recorded on this computer with the open-source Kokoro model. Nothing is sent to any service.

After changing any wording in the game, re-record:

```sh
scripts/voice/setup.sh        # first time only (installs into ~/.cache/apex-voice)
npm run voice                 # lists every line, records new ones, removes unused ones
```

- `voice/lines.json` – every line the game can speak, by speaker (made by `collect.mjs`, which plays the whole game headlessly)
- `voice/<key>.mp3` – one clip per line; `voice/manifest.json` – clip lengths the game uses
- Lines with the child's own words in them are split: each built-in warning sign has its own clip. Anything without a clip
  (a custom sign, the raptor's name) is spoken by the device's built-in voice.
- `npm test` fails if a line in the game has no clip, so you can't forget to re-record.
