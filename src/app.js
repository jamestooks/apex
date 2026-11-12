// Router + main loop. DOM screens mount into #ui; canvas scenes set app.canvasScene.
import { beginDraw, ctx, W, view } from './engine/canvas.js';
import * as audio from './engine/audio.js';

const params = new URLSearchParams(location.search);
export const app = {
  screens: {}, current: null, canvasScene: null, paused: false, store: null, input: null,
  speed: Math.max(0.1, Math.min(20, parseFloat(params.get('speed')) || 1)),
  debug: params.has('debug'),
  T: 0,
  register(name, fn) { app.screens[name] = fn; },
  show(name, params) {
    if (!app.screens[name]) throw new Error('No screen ' + name);
    // Leaving a scene: release its keyboard/pointer hooks so menus can't trigger game keys.
    const cs = app.canvasScene;
    if (name !== 'play' && cs && cs.shell) { cs.shell.dispose(); app.canvasScene = null; }
    app.current = name;
    app.screens[name](params || {});
  },
  onPause: null,
};

let last = 0;
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)) * app.speed; last = now;
  if (!app.paused) app.T += dt;
  beginDraw();
  const s = app.canvasScene;
  if (app.session && app.current === 'play' && !app.paused && !(s && s.shell && s.shell.paused)) app.session.tick(dt * 1000);
  if (s) {
    if (!app.paused && s.update) s.update(dt);
    // Clear taps only after the scene has read them (they arrive between frames), then redraw re-registers buttons.
    app.input.beginFrame();
    s.draw();
  } else { app.input.beginFrame(); ctx.fillStyle = '#0a0508'; ctx.fillRect(0, 0, W, view.H); }
  requestAnimationFrame(loop);
}
export function startLoop() {
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      app.input.clearAll(); audio.suspend();
      if (app.canvasScene && app.canvasScene.pause) app.canvasScene.pause();
    } else audio.resume();
  });
  addEventListener('blur', () => app.input.clearAll());
  if (app.debug) window.__apex = app;
}
