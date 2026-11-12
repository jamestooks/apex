// Burst & Rest: go hard in short bursts, then recover. Constant sprinting always burns out.
import { ctx, W, SH, FH, FB } from '../canvas.js';
export const TOOL = { id: 'burstRest', name: 'Burst & Rest', instinct: 'fuel', kind: 'hold', how: 'Short bursts, then rest. Movement breaks.', phrase: 'Burst and rest.', col: '#7dd3fc', past: 'took a movement break', again: 'a movement break', verb: 'rest', tile: "REACH UP · SHAKE OUT" };
const SPRINT_FUEL = 0.16, TROT_RELIEF = 0.10, REST_RELIEF = 0.16, REST_AFTER = 2;
const BREAK_SECS = 5, BREAK_RATE = 0.08;

export function createRun({ mode = 'run' } = {}) {
  if (mode === 'break') return createBreak();
  const r = {
    mode, phase: 'trot', speed: 1, offFor: 0, done: false, pausesSimmer: false,
    update(dt, io) {
      const events = []; let relief;
      if (io.held) { r.phase = 'sprint'; r.speed = 3; r.offFor = 0; relief = -SPRINT_FUEL * dt; }
      else {
        r.speed = 1;
        const trot = Math.max(0, Math.min(dt, REST_AFTER - r.offFor));
        r.offFor += dt;
        relief = TROT_RELIEF * trot + REST_RELIEF * (dt - trot);
        r.phase = r.offFor > REST_AFTER ? 'rest' : 'trot';
      }
      return { relief, events };
    },
    draw() {},
  };
  return r;
}
function createBreak() {
  const r = {
    mode: 'break', phase: 'idle', t: 0, done: false,
    get pausesSimmer() { return r.phase === 'stretch'; },
    get active() { return r.phase !== 'idle' && !r.done; },
    get k() { return r.t / BREAK_SECS; },
    update(dt, io) {
      const events = []; let relief = 0;
      if (r.done) return { relief, events };
      if (io.held) {
        if (r.phase === 'idle') events.push('start');
        r.phase = 'stretch';
        const step = Math.min(dt, BREAK_SECS - r.t); r.t += dt; relief = BREAK_RATE * step;
        if (r.t >= BREAK_SECS) { r.done = true; r.phase = 'done'; events.push('done'); }
      } else if (r.phase === 'stretch') r.phase = 'paused';
      return { relief, events };
    },
    label() { return r.done ? 'DONE' : r.phase === 'idle' ? 'HOLD FOR A MOVEMENT BREAK' : r.phase === 'paused' ? 'KEEP HOLDING' : 'STRETCH…'; },
    draw(t) {
      if (r.phase === 'idle' || r.done) return;
      const cx = W / 2, cy = SH() * 0.4, up = r.t < 2.5;
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const wob = up ? 0 : Math.sin((t || 0) * 30) * 4;
      ctx.beginPath(); ctx.arc(cx, cy - 34, 9, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 10, cy + 34); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 10, cy + 34);
      if (up) { ctx.moveTo(cx, cy - 18); ctx.lineTo(cx - 14, cy - 50); ctx.moveTo(cx, cy - 18); ctx.lineTo(cx + 14, cy - 50); }
      else { ctx.moveTo(cx, cy - 16); ctx.lineTo(cx - 22, cy + wob); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + 22, cy - wob); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(125,211,252,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy - 8, 62, -Math.PI / 2, -Math.PI / 2 + r.k * Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#e0f2fe'; ctx.textAlign = 'center'; ctx.font = FH(20);
      ctx.fillText(up ? 'REACH UP HIGH…' : 'NOW SHAKE IT OUT', cx, cy + 80);
      ctx.font = FB(12, 600); ctx.fillStyle = 'rgba(224,242,254,0.7)'; ctx.fillText('Do it for real, with your own body.', cx, cy + 100);
    },
  };
  return r;
}
