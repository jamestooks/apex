// Every line the game can speak has a recorded clip. If this fails after changing wording, run: npm run voice
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { sentences, keyFor } from '../../src/engine/speech-text.js';

const lines = JSON.parse(readFileSync('voice/lines.json', 'utf8'));
const manifest = JSON.parse(readFileSync('voice/manifest.json', 'utf8'));
const known = new Set(lines.map(l => l.key));

test('every listed line has a clip and a length', () => {
  const missing = lines.filter(l => !(l.key in manifest) || !existsSync(`voice/${l.key}.mp3`));
  assert.deepEqual(missing.map(l => `${l.speaker}: ${l.text}`).slice(0, 10), []);
});

test('the chapter wording matches the recorded lines (re-run npm run voice after edits)', () => {
  const stale = [];
  const check = text => { for (const s of sentences(text)) if (!['scar', 'echo', 'narr'].some(w => known.has(keyFor(w, s)))) stale.push(s); };
  for (const ch of CHAPTERS) {
    for (const c of [ch.intro, ch.toolCard, ch.chooseCard, ...(ch.legIntro || [])]) if (c) { check(c.sub || ''); check(c.body || ''); }
    for (const sc of [...ch.scenarios.test, ...ch.scenarios.mix, ...ch.scenarios.big]) {
      for (const t of sc.triggers || []) { check(t.intro || ''); check(t.hint || ''); }
      for (const [k, o] of Object.entries(sc.outcomes || {})) if (k !== 'blown' || sc.meters.includes('rage')) check(o.line || '');
    }
  }
  assert.deepEqual(stale.slice(0, 10), []);
});
