// One Thing: get to cover, then notice one thing you see, one you hear, one you feel. Then pick one next step.
import { ctx, W, SH, FH, FB, rr, inR } from '../canvas.js';
export const TOOL = { id: 'oneThing', name: 'One Thing', instinct: 'overload', kind: 'tap', how: 'Cover. See one. Hear one. Feel one. Then one next step.', phrase: 'Too much at once? One Thing.', col: '#fbbf24', past: 'found your One Thing', again: 'One Thing', verb: 'find your One Thing' };
const STEPS = ['cover', 'see', 'hear', 'feel'];
const RELIEF = { cover: 0.10, see: 0.15, hear: 0.15, feel: 0.15 };
const DWELL = 1.2;
const PROMPTS = {
  cover: 'GET TO COVER. Tap somewhere safe.',
  see: 'SEE: say one thing you can see, out loud. Then tap it.',
  hear: 'HEAR: what is one sound? Say it, then tap it.',
  feel: 'FEEL: what can you feel right now? Say it, then tap it.',
  next: 'Now pick ONE next step.',
};

export function createRun({ targets } = {}) {
  const r = {
    phase: 'cover', t: 0, done: false, picked: {},
    get pausesSimmer() { return !r.done; }, targets: targets || {},
    get active() { return !r.done; },
    update(dt, io) {
      const events = []; let relief = 0;
      if (r.done) return { relief, events };
      r.t += dt;
      const list = r.targets[r.phase] || [];
      if (r.t >= DWELL) for (const tap of io.taps || []) {
        const hit = list.find(b => inR(tap, b));
        if (!hit) continue;
        r.picked[r.phase] = hit; relief += RELIEF[r.phase]; events.push('step:' + r.phase);
        const i = STEPS.indexOf(r.phase);
        if (i === STEPS.length - 1) { r.phase = 'next'; r.done = true; events.push('done'); }
        else { r.phase = STEPS[i + 1]; r.t = 0; }
        break;
      }
      return { relief, events };
    },
    draw(t) {
      const sh = SH();
      ctx.fillStyle = 'rgba(10,5,8,0.82)'; rr(12, sh - 62, W - 24, 50, 10); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(12, sh - 58, 3, 42);
      ctx.textAlign = 'left'; ctx.font = FH(11, 500); ctx.fillStyle = '#fbbf24'; ctx.fillText('ONE THING', 24, sh - 44);
      ctx.font = FB(13, 600); ctx.fillStyle = '#fef3c7'; ctx.fillText(PROMPTS[r.phase] || '', 24, sh - 24);
      STEPS.forEach((s, i) => {
        ctx.fillStyle = r.picked[s] ? '#fbbf24' : s === r.phase ? 'rgba(251,191,36,0.5)' : '#44403c';
        ctx.beginPath(); ctx.arc(W - 70 + i * 14, sh - 47, 4, 0, 7); ctx.fill();
      });
      if (r.done) return;
      const ready = r.t >= DWELL, pulse = 0.5 + 0.5 * Math.sin((t || 0) * 5);
      for (const b of r.targets[r.phase] || []) {
        ctx.strokeStyle = ready ? `rgba(253,230,138,${0.5 + 0.5 * pulse})` : 'rgba(253,230,138,0.25)';
        ctx.lineWidth = 2; rr(b.x, b.y, b.w, b.h, 10); ctx.stroke();
        if (r.phase === 'hear') {
          ctx.strokeStyle = 'rgba(253,230,138,0.6)'; ctx.lineWidth = 1.5;
          for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2 - 6, 4 + k * 4 + pulse * 2, -0.7, 0.7); ctx.stroke(); }
        }
        ctx.fillStyle = '#fef3c7'; ctx.font = FH(12, 500); ctx.textAlign = 'center';
        ctx.fillText(b.label.toUpperCase(), b.x + b.w / 2, b.y + b.h - 6);
      }
    },
  };
  return r;
}
