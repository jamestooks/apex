import { initCanvas, toLogical, setLargeText } from './engine/canvas.js';
import { createInput } from './engine/input.js';
import * as audio from './engine/audio.js';
import { app, startLoop } from './app.js';
import { h, mount, unmount } from './ui/dom.js';
import { createStore } from './store.js';
import { createSession, startRest } from './model/session.js';
import { createShell } from './engine/scene.js';
import { createRunner } from './play/runner.js';
import { chapterByN, CHAPTERS } from './data/chapters/index.js';
import { registerProfiles } from './ui/profiles.js';
import { registerHome, valleyScene } from './ui/home.js';
import { registerDen } from './ui/den.js';
import { showSigns } from './ui/signs.js';
import { registerGrownups } from './ui/grownups.js';

const canvas = document.getElementById('game');
initCanvas(canvas);
app.input = createInput({ el: canvas, keyTarget: window, toLogical });
app.audio = audio;
addEventListener('pointerdown', audio.audioInit, { capture: true });
addEventListener('keydown', audio.audioInit, { capture: true });

app.store = createStore((() => { try { return window.localStorage; } catch (e) { return undefined; } })());
app.session = null;
app.titleScene = valleyScene(app, null, 'dusk');
Object.defineProperty(app, 'profile', { get: () => app.store.active() });

app.applySettings = p => {
  const s = p ? p.settings : { sound: true, vibration: true, largeText: false };
  audio.configureAudio({ sound: s.sound, vibration: s.vibration });
  setLargeText(!!s.largeText);
  document.documentElement.classList.toggle('large-text', !!s.largeText);
};
app.selectProfile = id => { app.session = null; app.store.setActive(id); app.applySettings(app.profile); app.show('home'); };
app.switchPlayer = () => { app.session = null; app.store.setActive(null); app.applySettings(null); app.show('profiles'); };
app.endSessionIfCapped = () => {
  const p = app.profile;
  if (p && app.session && app.session.capReached(Date.now())) { app.store.updateProfile(p.id, q => startRest(q, Date.now())); app.session = null; }
};
app.play = (n, mode, leg) => app.show('play', { n, mode, leg: leg || 0 });

app.register('play', ({ n, mode, leg, only }) => {
  const p = app.profile, base = chapterByN(n), ch = only ? { ...base, __only: only } : base;
  if (!p || !ch) return app.show('home');
  if (!app.session) app.session = createSession(p);
  unmount();
  const shell = createShell({ profile: p, theme: ch.theme, tools: [], audio, input: app.input, difficulty: { simmerMul: 1, gapMul: 1, spikeAdd: 0 } });
  const runner = createRunner({
    profile: p, chapter: ch, mode, leg, shell, session: app.session, save: () => app.store.save(),
    pickSigns: inst => new Promise(res => { app.paused = true; showSigns(app, p, inst, { onDone: () => { unmount(); app.paused = false; res(); } }); }),
    onDone: summary => { app.store.save(); app.show(mode === 'prologue' ? 'home' : 'den', summary); },
  });
  shell.onMenu = () => {
    app.paused = true; app.input.clearAll();
    mount(h('div', { class: 'screen', style: { justifyContent: 'center' } }, h('div', { class: 'card' },
      h('h2', {}, 'Paused'), h('p', { class: 'scar' }, '"Take your time. The valley will wait."'),
      h('button', { id: 'resume-scene', onClick: () => { unmount(); app.paused = false; shell.resumedAt = shell.T; } }, 'Carry on'),
      h('button', { class: 'ghost', id: 'leave-scene', onClick: () => { app.paused = false; app.store.save(); app.show('home'); } }, 'Back to the valley'),
      h('p', { class: 'small' }, 'Leaving now keeps your signs, but this part of the chapter starts again next time.'))));
  };
  app.canvasScene = { update: runner.update, draw: runner.draw, pause: runner.pause, runner, shell };
});

// Dev hooks (with ?debug=1): list and jump straight into any scenario.
app.listScenes = () => CHAPTERS.flatMap(c => ['test', 'mix', 'big'].flatMap(b => c.scenarios[b].map((_, i) => [c.n, b, i])));
app.goto = (n, beat, i) => {
  const p = app.profile, ch = chapterByN(n);
  for (const k of Object.keys(p.signs)) if (p.signs[k].length !== 3) p.signs[k] = ['First sign', 'Second sign', 'Third sign'];
  if (ch.tool && !p.toolbelt.includes(ch.tool)) p.toolbelt.push(ch.tool);
  app.show('play', { n, mode: 'single', only: ch.scenarios[beat][i] });
};

registerProfiles(app);
registerHome(app);
registerDen(app);
registerGrownups(app);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  // Check for a new version on every load (browsers otherwise check lazily).
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => reg.update()).catch(() => {}));
  // When an update takes over, reload once so the page never runs a mix of old and new files.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
}

startLoop();
if (app.profile) { app.applySettings(app.profile); app.show('home'); } else app.show('profiles');
