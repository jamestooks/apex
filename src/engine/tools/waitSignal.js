// Wait for the Signal: feel the urge, ride it out, act on the cue.
// 'ride' mode is the short overlay version usable in any scene; the ambush kind drives the full version.
import { ctx, W, SH, FH, FB } from '../canvas.js';
export const TOOL = { id: 'waitSignal', name: 'Wait for the Signal', instinct: 'urge', kind: 'hold', how: 'Hold still. Let the urge rise and pass. Act on the cue.', phrase: 'Wait for the signal.', col: '#d8b4fe', past: 'rode the wave', again: 'ride the wave', verb: 'ride it out', tile: "STAY STILL · LET IT PASS" };
const RIDE_SECS = 6, RIDE_RATE = 0.06;

export function createRun({ mode = 'ride' } = {}) {
  const r = {
    mode, phase: 'idle', t: 0, done: false,
    get pausesSimmer() { return r.phase === 'riding'; },
    get active() { return r.phase !== 'idle' && !r.done; },
    get k() { return r.t / RIDE_SECS; },
    update(dt, io) {
      const events = []; let relief = 0;
      if (r.done) return { relief, events };
      if (io.held) {
        if (r.phase === 'idle') events.push('start');
        r.phase = 'riding';
        const step = Math.min(dt, RIDE_SECS - r.t); r.t += dt; relief = RIDE_RATE * step;
        if (r.t >= RIDE_SECS) { r.done = true; r.phase = 'done'; events.push('done'); }
      } else if (r.phase === 'riding') r.phase = 'paused';
      return { relief, events };
    },
    label() { return r.done ? 'DONE' : r.phase === 'idle' ? 'HOLD STILL TO RIDE IT' : r.phase === 'paused' ? 'KEEP HOLDING' : 'RIDING THE WAVE…'; },
    draw() {
      if (r.phase === 'idle' || r.done) return;
      const cy = SH() * 0.42, x0 = 60, x1 = W - 60;
      ctx.strokeStyle = 'rgba(216,180,254,0.35)'; ctx.lineWidth = 3; ctx.beginPath();
      const wave = x => Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 60;
      for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, cy - wave(x)); ctx.stroke();
      const px = x0 + (x1 - x0) * r.k;
      ctx.strokeStyle = '#d8b4fe'; ctx.beginPath(); for (let x = x0; x <= px; x += 4) ctx.lineTo(x, cy - wave(x)); ctx.stroke();
      ctx.fillStyle = '#f3e8ff'; ctx.beginPath(); ctx.arc(px, cy - wave(px), 7, 0, 7); ctx.fill();
      ctx.textAlign = 'center'; ctx.font = FH(20); ctx.fillText(r.k < 0.5 ? 'FEEL IT RISE…' : 'AND LET IT PASS', W / 2, cy + 40);
      ctx.font = FB(12, 600); ctx.fillStyle = 'rgba(243,232,255,0.7)'; ctx.fillText('Stay still. Notice where you feel it.', W / 2, cy + 60);
    },
  };
  return r;
}
