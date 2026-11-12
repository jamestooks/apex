// Web Audio: synthesised SFX, a growl that follows the meter, ambience. Ported from the prototype.
let AC = null, MG = null, NB = null, growlG = null, rainG = null;
const cfg = { sound: true, vibration: true, intensity: 'normal', muted: false };

export function configureAudio(c) { Object.assign(cfg, c); applyGain(); }
export function isMuted() { return cfg.muted || !cfg.sound; }
export function toggleMute() { cfg.muted = !cfg.muted; applyGain(); return cfg.muted; }
function applyGain() { if (MG) MG.gain.value = isMuted() ? 0 : 0.7; }

export function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    AC = new C(); MG = AC.createGain(); applyGain(); MG.connect(AC.destination);
    NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // wind bed
    const s = AC.createBufferSource(); s.buffer = NB; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320;
    const g = AC.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(MG); s.start();
    // growl, volume follows the hottest meter
    const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 62;
    const lf = AC.createOscillator(); lf.frequency.value = 7; const lg = AC.createGain(); lg.gain.value = 8; lf.connect(lg); lg.connect(o.frequency);
    const gf = AC.createBiquadFilter(); gf.type = 'lowpass'; gf.frequency.value = 260;
    growlG = AC.createGain(); growlG.gain.value = 0; o.connect(gf); gf.connect(growlG); growlG.connect(MG); o.start(); lf.start();
    // rain bed (silent until rainStart)
    const rs = AC.createBufferSource(); rs.buffer = NB; rs.loop = true;
    const rf = AC.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 1200;
    rainG = AC.createGain(); rainG.gain.value = 0; rs.connect(rf); rf.connect(rainG); rainG.connect(MG); rs.start();
  } catch (e) { AC = null; }
}
export function suspend() { try { AC && AC.suspend(); } catch (e) {} }
export function resume() { try { AC && AC.resume(); } catch (e) {} }
export function setGrowl(level) {
  if (!growlG) return;
  const k = cfg.intensity === 'low' ? 0.4 : 1;
  try { growlG.gain.setTargetAtTime(Math.max(0, level - 0.3) * 0.28 * k, AC.currentTime, 0.2); } catch (e) {}
}
export function vibrate(ms) { if (cfg.vibration && !isMuted() && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }

function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(f1, f2, dur, type, vol, delay) {
  if (!AC) return;
  try {
    const t = AC.currentTime + (delay || 0); const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    env(g, t, 0.01, vol, dur); o.connect(g); g.connect(MG); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) {}
}
function noise(dur, freq, q, vol, type, delay, f2, attack) {
  if (!AC) return;
  try {
    const t = AC.currentTime + (delay || 0); const s = AC.createBufferSource(); s.buffer = NB; s.loop = true;
    const f = AC.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur); f.Q.value = q;
    const g = AC.createGain(); env(g, t, attack || 0.02, vol, dur); s.connect(f); f.connect(g); g.connect(MG);
    s.start(t, Math.random()); s.stop(t + dur + (attack || 0) + 0.05);
  } catch (e) {}
}
export const SFX = {
  lubdub(v) { const k = cfg.intensity === 'low' ? 0.4 : 1; tone(68, 40, 0.16, 'sine', 0.7 * v * k); tone(62, 38, 0.14, 'sine', 0.4 * v * k, 0.17); },
  snarl() { tone(180, 90, 0.5, 'sawtooth', 0.2); noise(0.5, 700, 0.8, 0.3, 'bandpass', 0, 300); },
  yelp() { tone(900, 500, 0.18, 'triangle', 0.2); tone(800, 450, 0.15, 'triangle', 0.15, 0.2); },
  roar() { tone(150, 55, 0.9, 'sawtooth', 0.28); noise(0.9, 500, 0.6, 0.45, 'lowpass', 0, 150); },
  lowgrowl() { tone(85, 70, 1.0, 'sawtooth', 0.18); },
  chirp() { tone(1400, 1900, 0.1, 'sine', 0.2); tone(1500, 2100, 0.1, 'sine', 0.2, 0.14); },
  fight() { for (let i = 0; i < 5; i++) { noise(0.12, 400 + Math.random() * 900, 1, 0.4, 'bandpass', i * 0.16); tone(200, 90, 0.15, 'sawtooth', 0.15, i * 0.16 + 0.05); } },
  inhale() { noise(3, 500, 0.6, 0.22, 'bandpass', 0, 1400, 1.2); },
  exhale() { noise(5, 1100, 0.6, 0.25, 'bandpass', 0, 300, 0.4); },
  good() { tone(440, 660, 0.25, 'triangle', 0.18); tone(660, 880, 0.25, 'triangle', 0.12, 0.15); },
  swell() { [220, 277, 330, 440].forEach((f, i) => tone(f, f, 1.6, 'sine', 0.06, i * 0.08)); },
  bad() { tone(220, 150, 0.2, 'triangle', 0.14); },
  click() { tone(900, 700, 0.05, 'triangle', 0.12); },
  thunder() { noise(2.2, 120, 0.5, 0.6, 'lowpass', 0, 60, 0.05); tone(60, 35, 1.5, 'sine', 0.3); },
  rumble() { noise(2.5, 90, 0.7, 0.5, 'lowpass', 0, 70, 0.3); },
  rainStart() { if (rainG) try { rainG.gain.setTargetAtTime(0.06, AC.currentTime, 0.8); } catch (e) {} },
  rainStop() { if (rainG) try { rainG.gain.setTargetAtTime(0, AC.currentTime, 0.8); } catch (e) {} },
  splash() { noise(0.4, 1800, 0.7, 0.25, 'bandpass', 0, 600); },
  signal() { tone(1200, 1600, 0.08, 'square', 0.12); tone(1600, 1600, 0.12, 'square', 0.1, 0.12); },
  calls(n) { for (let i = 0; i < (n || 3); i++) tone(700 + Math.random() * 900, 400 + Math.random() * 500, 0.2, 'triangle', 0.12, i * 0.18); },
  trexRoar() { tone(90, 40, 2.0, 'sawtooth', 0.32); noise(2.0, 300, 0.5, 0.5, 'lowpass', 0, 90, 0.2); },
  eruption() { noise(3, 80, 0.5, 0.7, 'lowpass', 0, 40, 0.1); tone(45, 30, 2.5, 'sine', 0.4); },
  wind() { noise(3, 600, 0.4, 0.15, 'bandpass', 0, 900, 1); },
  sprint() { noise(0.08, 900, 1, 0.12, 'bandpass'); },
  parked() { tone(660, 990, 0.12, 'sine', 0.15); tone(990, 1320, 0.12, 'sine', 0.12, 0.1); },
  step() { tone(500, 700, 0.08, 'sine', 0.12); },
};
