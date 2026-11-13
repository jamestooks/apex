// ElevenLabs voices for Apex. The API key is read from ~/.cache/apex-voice/elevenlabs.key (never pasted anywhere).
//   node scripts/voice/eleven.mjs credits             remaining credits
//   node scripts/voice/eleven.mjs search              shortlist voices per role; downloads free previews to the Desktop
//   node scripts/voice/eleven.mjs estimate            credits the full run would use (no API calls)
//   node scripts/voice/eleven.mjs test <role> <voiceId> [model]   one sample line in that voice
//   node scripts/voice/eleven.mjs generate            records every line not yet recorded with ElevenLabs
// Roles and voices are set in scripts/voice/voices.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { sentences, keyFor } from '../../src/engine/speech-text.js';

const API = 'https://api.elevenlabs.io/v1';
const KEYFILE = join(homedir(), '.cache/apex-voice/elevenlabs.key');
const VOICE = 'voice', DESK = join(homedir(), 'Desktop/apex-voice-tests/elevenlabs');
const CONFIG = 'scripts/voice/voices.json', SOURCES = 'voice/sources.json';
const HQ = 'eleven_multilingual_v2', FAST = 'eleven_flash_v2_5', COST = { [HQ]: 1, [FAST]: 0.5, eleven_v3: 1 };
const TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse';
const SAMPLE = {
  scar: "That fire in you could make you the greatest hunter this valley has ever seen. Or it'll get you killed. Rage, panic, the urge to run. Let me teach you to steer it.",
  echo: "Your senses never switch off. That's why you hear prey before anyone else in the pack. It's a gift, and it can swamp you too.",
  narr: 'A volcanic river valley, long ago. A pack of raptors hunts together here. The ground shakes. Something huge is coming.',
};
const SEARCH = {
  scar: [{ gender: 'male', age: 'old', accent: 'british', search: 'gravelly' }, { gender: 'male', age: 'old', accent: 'british', search: 'deep' }, { gender: 'male', age: 'old', accent: 'british' }],
  echo: [{ gender: 'female', age: 'middle_aged', accent: 'british', search: 'calm' }, { gender: 'female', age: 'young', accent: 'british', search: 'calm' }],
  narr: [{ gender: 'male', age: 'middle_aged', accent: 'british', search: 'storyteller' }, { gender: 'male', accent: 'british', search: 'narrator' }],
};

const key = () => { if (!existsSync(KEYFILE)) { console.error(`No key file at ${KEYFILE}`); process.exit(1); } return readFileSync(KEYFILE, 'utf8').trim(); };
async function api(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { 'xi-api-key': key(), ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${path}: ${(await r.text()).slice(0, 300)}`);
  return r;
}
async function credits() { const s = await (await api('/user/subscription')).json(); return { used: s.character_count, limit: s.character_limit, left: s.character_limit - s.character_count, tier: s.tier }; }
const config = () => JSON.parse(readFileSync(CONFIG, 'utf8'));
const sources = () => (existsSync(SOURCES) ? JSON.parse(readFileSync(SOURCES, 'utf8')) : {});

// Narrator lines from the opening story, chapter introductions and the ending use the best model; the rest the fast one.
function keyMoments() {
  const texts = [];
  const pro = readFileSync('src/engine/kinds/prologue.js', 'utf8');
  for (const m of pro.matchAll(/sh\.say\([`'"]((?:[^`'"\\]|\\.)*)/g)) texts.push(m[1]);
  for (const ch of CHAPTERS) for (const c of [ch.intro, ch.toolCard, ch.chooseCard, ...(ch.legIntro || [])]) if (c) texts.push(c.sub || '', c.body || '');
  const fin = CHAPTERS.find(c => c.n === 6);
  for (const f of fin.endingCards || []) { const c = f({ raptorName: 'Raptor', finaleCalm: true }, { stats: { finaleCalm: true } }); texts.push(c.sub || '', c.body || ''); }
  const keys = new Set();
  for (const t of texts) for (const s of sentences(t)) for (const sp of ['scar', 'echo', 'narr']) keys.add(keyFor(sp, s));
  return keys;
}
function plan() {
  const lines = JSON.parse(readFileSync('voice/lines.json', 'utf8')), km = keyMoments(), src = sources();
  return lines.filter(l => src[l.key] !== 'elevenlabs').map(l => {
    const model = l.speaker === 'narr' && !km.has(l.key) ? FAST : HQ;
    return { ...l, model, cost: Math.ceil(l.text.replace(/^[\s,;:.\-]+/, '').length * COST[model]) };
  });
}
async function tts(text, voiceId, model, settings, outMp3, filter) {
  const r = await api(`/text-to-speech/${voiceId}?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify({ text, model_id: model, voice_settings: settings }) });
  const tmp = outMp3 + '.src.mp3';
  writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-af', (filter ? filter + ',' : '') + TRIM, '-ac', '1', '-ar', '24000', '-b:a', '48k', outMp3]);
  unlinkSync(tmp);
}
const duration = f => +(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim()).toFixed(2);
const speakable = t => t.replace(/^[\s,;:.\-]+/, '').replace(/\b([A-Z]{2,})\b/g, m => m[0] + m.slice(1).toLowerCase());

const cmd = process.argv[2], args = process.argv.slice(3);
if (cmd === 'credits') { console.log(await credits()); }
else if (cmd === 'estimate') {
  const p = plan(), sum = m => p.filter(l => l.model === m).reduce((n, l) => n + l.cost, 0);
  console.log(`${p.length} lines to record: ${sum(HQ)} credits on the best model, ${sum(FAST)} on the fast model, ${sum(HQ) + sum(FAST)} in total`);
}
else if (cmd === 'search') {
  mkdirSync(DESK, { recursive: true });
  for (const [role, queries] of Object.entries(SEARCH)) {
    const seen = new Map();
    for (const q of queries) {
      const qs = new URLSearchParams({ page_size: '12', language: 'en', ...q });
      const res = await (await api('/shared-voices?' + qs)).json();
      for (const v of res.voices || []) if (!seen.has(v.voice_id)) seen.set(v.voice_id, v);
    }
    const picks = [...seen.values()].sort((a, b) => (b.cloned_by_count || 0) - (a.cloned_by_count || 0)).slice(0, 6);
    console.log(`\n${role.toUpperCase()}`);
    for (const [i, v] of picks.entries()) {
      console.log(`  ${i + 1}. ${v.name} (${v.accent}, ${v.age}) — ${(v.description || '').slice(0, 90)}  [${v.voice_id} / ${v.public_owner_id}]`);
      if (v.preview_url) { const b = Buffer.from(await (await fetch(v.preview_url)).arrayBuffer()); writeFileSync(join(DESK, `${role}-${i + 1}-${v.name.replace(/[^a-z0-9]+/gi, '_')}.mp3`), b); }
    }
  }
  console.log(`\nFree previews saved to ${DESK}`);
}
else if (cmd === 'test') {
  const [role, voiceId, model = HQ, publicOwner] = args;
  if (publicOwner) await api(`/voices/add/${publicOwner}/${voiceId}`, { method: 'POST', body: JSON.stringify({ new_name: `apex-${role}-${voiceId.slice(0, 6)}` }) }).catch(e => console.log('(already in library?)', e.message.slice(0, 80)));
  const before = await credits();
  mkdirSync(DESK, { recursive: true });
  const out = join(DESK, `test-${role}-${voiceId.slice(0, 8)}-${model}.mp3`);
  await tts(SAMPLE[role], voiceId, model, { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true }, out);
  const after = await credits();
  console.log(`made ${out} (${before.left - after.left} credits; ${after.left} left)`);
}
else if (cmd === 'generate') {
  const cfg = config(), p = plan(), need = p.reduce((n, l) => n + l.cost, 0), c = await credits();
  console.log(`${p.length} lines, about ${need} credits; ${c.left} available`);
  if (need > c.left) { console.error('Not enough credits for the full run. Nothing recorded.'); process.exit(1); }
  const src = sources(), manifest = JSON.parse(readFileSync('voice/manifest.json', 'utf8'));
  let i = 0;
  for (const l of p) {
    const v = cfg[l.speaker];
    const out = join(VOICE, `${l.key}.mp3`);
    for (let tries = 0; ; tries++) {
      try { await tts(speakable(l.text), v.voiceId, l.model, v.settings, out, v.filter); break; }
      catch (e) { if (tries >= 3 || !/429|5\d\d/.test(e.message)) throw e; await new Promise(r => setTimeout(r, 4000 * (tries + 1))); }
    }
    src[l.key] = 'elevenlabs'; manifest[l.key] = duration(out);
    if (++i % 20 === 0 || i === p.length) {
      writeFileSync(SOURCES, JSON.stringify(src)); writeFileSync('voice/manifest.json', JSON.stringify(manifest));
      console.log(`  ${i}/${p.length}`);
    }
  }
  console.log('done', await credits());
}
else console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 8).join('\n'));
