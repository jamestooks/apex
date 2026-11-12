// Long Exhale: hold to breathe in for 3, release and breathe out for 5. The meter drops only on the out-breath.
import { ctx, W, SH, FH } from '../canvas.js';
export const TOOL = { id: 'longExhale', name: 'Long Exhale', instinct: 'rage', kind: 'hold', how: 'In for 3. Out slowly for 5.', phrase: "Rage meter's rising. Long Exhale?", col: '#38bdf8' };
const IN = 3, OUT = 5, RATE = 0.075;

export function createRun() {
  const r = {
    phase: 'idle', t: 0, done: false, hints: {},
    get pausesSimmer() { return r.phase === 'in' || r.phase === 'out' || (r.phase === 'full' && r.t < 2); },
    get k() { return r.phase === 'in' ? r.t / IN : r.phase === 'full' ? 1 : r.phase === 'out' ? 1 - r.t / OUT : 0; },
    get active() { return r.phase !== 'idle'; },
    update(dt, io) {
      const events = []; let relief = 0;
      if (r.phase === 'idle') { if (io.held) { r.phase = 'in'; r.t = 0; events.push('inhale'); } }
      else if (r.phase === 'in') {
        if (io.held) { r.t += dt; if (r.t >= IN) { r.phase = 'full'; r.t = 0; } }
        else { r.phase = 'idle'; r.t = 0; events.push('hint:allTheWayIn'); }
      } else if (r.phase === 'full') {
        r.t += dt;
        if (r.t > 2.5 && !r.hints.letGo) { r.hints.letGo = 1; events.push('hint:letGo'); }
        if (!io.held) { r.phase = 'out'; r.t = 0; events.push('exhale'); }
      } else if (r.phase === 'out') {
        if (io.held) { if (!r.hints.out) { r.hints.out = 1; events.push('hint:letItOut'); } }
        else {
          const step = Math.min(dt, OUT - r.t); r.t += dt; relief = RATE * step;
          if (r.t >= OUT) { r.phase = 'idle'; r.t = 0; r.hints = {}; events.push('breath'); }
        }
      }
      return { relief, events };
    },
    label() { return { idle: 'HOLD TO BREATHE IN', in: 'KEEP HOLDING…', full: 'NOW LET GO', out: 'BREATHE OUT SLOWLY' }[r.phase]; },
    draw() {
      if (r.phase === 'idle') return;
      const cx = W / 2, cy = SH() * 0.42, rad = 26 + 70 * r.k;
      ctx.fillStyle = 'rgba(125,211,252,0.10)'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(186,230,253,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#e0f2fe'; ctx.textAlign = 'center'; ctx.font = FH(22);
      ctx.fillText(r.phase === 'in' ? 'BREATHE IN…' : r.phase === 'full' ? 'NOW LET GO' : 'BREATHE OUT… SLOWLY', cx, cy + 8);
      if (r.phase === 'in' || r.phase === 'out') {
        ctx.font = FH(15, 500); ctx.fillStyle = 'rgba(224,242,254,0.7)';
        ctx.fillText(r.phase === 'in' ? Math.ceil(IN - r.t) : Math.ceil(OUT - r.t), cx, cy + 32);
      }
    },
  };
  return r;
}
