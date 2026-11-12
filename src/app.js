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
    app.current = name;
    if (!app.screens[name]) throw new Error('No screen ' + name);
    app.screens[name](params || {});
  },
  onPause: null,
};

let last = 0;
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)) * app.speed; last = now;
  if (!app.paused) app.T += dt;
  app.input.beginFrame();
  beginDraw();
  const s = app.canvasScene;
  if (s) {
    if (!app.paused && s.update) s.update(dt);
    s.draw();
  } else { ctx.fillStyle = '#0a0508'; ctx.fillRect(0, 0, W, view.H); }
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
