// Scene dressing that moves and makes noise: herds, storms, shouted calls, logs, rocks.
// A scenario lists them as data: setpieces: [{ type: 'storm' }, { type: 'herd', from: 'right' }, ...].
import { ctx, W, SH, GY, hash } from './canvas.js';
import * as P from '../art/props.js';
import { SAFE_TOP } from './scene.js';

const TYPES = {
  herd(o, sh) {
    const s = { x: o.from === 'left' ? -300 : W + 80, dir: o.from === 'left' ? 1 : -1, wait: o.delay || 0, nextRumble: 0, k: 1 };
    return {
      update(dt, live) {
        if (s.wait > 0) { s.wait -= dt; return; }
        s.x += s.dir * (o.speed || 150) * dt * s.k;
        if (s.dir < 0 && s.x < -320) s.x = W + 80 + Math.random() * 120;
        if (s.dir > 0 && s.x > W + 80) s.x = -320 - Math.random() * 120;
        s.nextRumble -= dt; if (s.nextRumble <= 0 && s.k > 0.3) { s.nextRumble = 2.2; sh.env.audio.SFX.rumble(); sh.shake = Math.max(sh.shake, 0.15 * sh.shakeK); }
      },
      calm() { s.k = 0.25; },
      drawBack() { if (s.wait <= 0) P.drawHerd(s.x, GY() - 18 + (o.y || 0), o.n || 4, sh.T, true, s.dir > 0 ? 1 : -1); },
    };
  },
  storm(o, sh) {
    const s = { flash: 0, next: o.firstFlash || 2, k: 1, started: false };
    return {
      update(dt) {
        if (!s.started) { s.started = true; sh.env.audio.SFX.rainStart(); }
        s.flash = Math.max(0, s.flash - dt * 2.5); s.next -= dt;
        if (s.next <= 0) { s.next = (o.every || 4) * (1 + Math.random()) / s.k; s.flash = sh.rm ? 0.4 : 1; setTimeout(() => sh.env.audio.SFX.thunder(), 250); }
      },
      calm() { s.k = 0.35; },
      stop() { sh.env.audio.SFX.rainStop(); },
      drawFront() { P.drawRain(sh.T, s.k); P.drawLightning(s.flash); },
    };
  },
  calls(o, sh) {
    const s = { list: [], next: 0.5, k: 1 };
    return {
      state: s,
      update(dt, live) {
        for (const c of s.list) c.t += dt; s.list = s.list.filter(c => c.t < 1.3);
        if (!live && !o.always) return;
        s.next -= dt;
        if (s.next <= 0 && s.k > 0.3) {
          s.next = (o.every || 0.7) + Math.random() * 0.5;
          const texts = o.texts || ['LEFT!', 'GO!', 'WAIT!'];
          s.list.push({ text: texts[Math.floor(Math.random() * texts.length)], x: 60 + Math.random() * (W - 120), y: SAFE_TOP + 14 + Math.random() * Math.max(10, GY() - 90 - (SAFE_TOP + 14)), t: 0 });
          sh.env.audio.SFX.calls(1);
        }
      },
      calm() { s.k = 0.2; },
      drawFront() { for (const c of s.list) { ctx.globalAlpha = Math.min(1, (1.3 - c.t) * 3); P.drawCallBubble(c.x, c.y - c.t * 10, c.text); } ctx.globalAlpha = 1; },
    };
  },
  log(o, sh) {
    const s = { x: o.x || 300, roll: 0, free: false };
    return {
      state: s,
      update(dt) { if (s.free && s.roll < 1) s.roll = Math.min(1, s.roll + dt * 0.8); },
      free() { s.free = true; },
      drawFront() { P.drawLog(s.x + s.roll * 90, GY() - (o.lift || 10) - Math.sin(s.roll * Math.PI) * 6, o.w || 120, o.burning, sh.T); },
    };
  },
  rock(o, sh) {
    sh.landmarks[o.name || 'rock'] = () => ({ x: o.x, y: GY() + 4 - (o.h || 46) / 2 });
    return { drawBack() { P.drawRock(o.x, GY() + 4, o.w || 90, o.h || 46); } };
  },
  trex(o, sh) {
    const s = { x: o.x != null ? o.x : W + 160, tx: o.tx != null ? o.tx : -260, sp: o.speed || 28, on: !o.delay, wait: o.delay || 0, roared: false };
    return {
      state: s,
      update(dt) {
        if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) s.on = true; return; }
        if (!s.on) return;
        const d = s.tx - s.x; if (Math.abs(d) > 1) s.x += Math.sign(d) * Math.min(Math.abs(d), s.sp * dt);
        if (!s.roared && s.x < W - 40) { s.roared = true; sh.env.audio.SFX.trexRoar(); sh.shake = Math.max(sh.shake, 0.5 * sh.shakeK); }
      },
      drawBack() { if (s.on) P.drawTrex(s.x, GY() + 4, o.s || 1.1, sh.T, -1, o.sniff && Math.abs(s.x - (o.sniffAt || 220)) < 120); },
    };
  },
  lavaStones(o, sh) {
    return { drawBack() { for (let i = 0; i < (o.n || 4); i++) P.drawLavaStone((o.x || 200) + i * 52, GY() + 6 - (i % 2) * 4, !!sh.stonesSettled, sh.T + i * 0.7, sh.stonesSettled && i === 0); } };
  },
  hadrosaurs(o, sh) {
    return { drawBack() { for (let i = 0; i < (o.n || 3); i++) P.drawHadrosaur((o.x || 260) + i * 60, GY() + 2 - i * 3, 0.8, sh.T + i, i % 2 ? 1 : -1, i === 0 && o.lookout); } };
  },
};

export function createSetpieces(list, sh) {
  const items = (list || []).map(o => ({ o, it: TYPES[o.type](o, sh) }));
  return {
    get(type) { const x = items.find(i => i.o.type === type); return x && x.it; },
    update(dt, live) { for (const { it } of items) it.update && it.update(dt, live); },
    calm() { for (const { it } of items) it.calm && it.calm(); },
    stop() { for (const { it } of items) it.stop && it.stop(); },
    drawBack() { for (const { it } of items) it.drawBack && it.drawBack(); },
    drawFront() { for (const { it } of items) it.drawFront && it.drawFront(); },
  };
}
