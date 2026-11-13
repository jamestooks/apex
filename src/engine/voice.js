// Spoken lines: plays recorded clips (made with scripts/voice) through the game's sound output, so mute and
// the sound setting apply. Anything without a clip (a custom sign, a typed name) uses the device's own voice.
import { pieces } from './speech-text.js';
import { audioOut, isMuted } from './audio.js';

const BASE = 'voice/';
const DEVICE = { scar: { rate: 0.85, pitch: 0.6 }, echo: { rate: 0.92, pitch: 1.05 }, narr: { rate: 0.95, pitch: 0.9 } };
let manifest = null, enabled = true, token = 0, chain = Promise.resolve(), current = null;
const buffers = new Map();

export async function loadVoices() {
  try { const r = await fetch(BASE + 'manifest.json'); manifest = r.ok ? await r.json() : {}; } catch (e) { manifest = {}; }
  return manifest;
}
export function configure(c) { if ('enabled' in c) enabled = c.enabled; if (!enabled) stop(); }
export const enabledNow = () => enabled;

async function buffer(key) {
  if (buffers.has(key)) return buffers.get(key);
  const o = audioOut(); if (!o) return null;
  const p = fetch(BASE + key + '.mp3').then(r => r.arrayBuffer()).then(b => o.ac.decodeAudioData(b)).catch(() => null);
  buffers.set(key, p);
  return p;
}
function playClip(key, my) {
  return buffer(key).then(buf => new Promise(res => {
    const o = audioOut();
    if (!buf || !o || my !== token) return res();
    const src = o.ac.createBufferSource(); src.buffer = buf; src.connect(o.out);
    src.onended = () => res(); current = src; src.start();
  }));
}
function sayWithDevice(who, text, my) {
  return new Promise(res => {
    const ss = globalThis.speechSynthesis;
    if (!ss || isMuted() || my !== token) return res();
    const u = new SpeechSynthesisUtterance(text);
    const v = ss.getVoices().find(x => /en-GB/i.test(x.lang)) || ss.getVoices().find(x => /^en/i.test(x.lang));
    if (v) u.voice = v;
    Object.assign(u, DEVICE[who] || DEVICE.narr);
    u.onend = u.onerror = () => res();
    ss.speak(u);
  });
}
const estimate = t => 0.35 + String(t).split(/\s+/).length * 0.38;

// Speak a line. Returns roughly how long it takes (seconds) so the speech box can stay up.
export function speak(who, text, names, { queue = false } = {}) {
  if (!enabled || !manifest) return 0;
  if (!queue) stop();
  const has = k => Object.prototype.hasOwnProperty.call(manifest, k);
  const ps = pieces(who, text, names, has);
  const my = token;
  chain = chain.then(async () => {
    for (const p of ps) {
      if (my !== token) return;
      if (p.clip) await playClip(keyOf(who, p.text), my); else await sayWithDevice(who, p.text, my);
    }
  });
  return ps.reduce((s, p) => s + (p.clip ? manifest[keyOf(who, p.text)] : estimate(p.text)), 0);
}
import { keyFor as keyOf } from './speech-text.js';

export function stop() {
  token++; chain = Promise.resolve();
  try { current && current.stop(); } catch (e) {}
  current = null;
  try { globalThis.speechSynthesis && globalThis.speechSynthesis.cancel(); } catch (e) {}
}
// Warm the offline cache with every clip, slowly, so voices work without a connection later.
export async function prefetchAll() {
  if (!manifest) return;
  for (const k of Object.keys(manifest)) {
    if (!enabled) return;
    try { await fetch(BASE + k + '.mp3'); } catch (e) { return; }
    await new Promise(r => setTimeout(r, 120));
  }
}
