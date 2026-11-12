// Every session ends calmly: one Long Exhale together, then a step away from the screen.
// It never traps a child: it moves on after one breath or 25 seconds, whichever comes first.
import { ctx, W, SH, FH } from '../canvas.js';

export const NEXT_STEPS = [
  'Get a drink of water.',
  'Stand up and stretch, really big.',
  'Find a grown-up and tell them one thing you did.',
  'Go outside for five minutes if you can.',
  'Have a snack.',
  'Show someone your Long Exhale.',
];

export function createWinddown(sh, { capped = false, pick = Math.random } = {}) {
  const k = { phase: 'breathe', t: 0, done: false, result: null, base: sh.stats.toolUses.longExhale || 0 };
  sh.clearChoices(); sh.meterHidden = true; sh.pulseTool = 'longExhale';
  sh.panelText = 'One slow breath to finish.';
  sh.say(capped ? "The sun's going down. That's enough hunting for today. One Long Exhale together before we rest." : 'Good hunting. One Long Exhale together before we go.', 6, 3, 'scar');
  const next = NEXT_STEPS[Math.floor(pick() * NEXT_STEPS.length)];
  function close() {
    k.phase = 'card'; sh.pulseTool = null;
    sh.showCard({ title: capped ? 'TIME TO REST' : 'WELL HUNTED', sub: capped ? 'Rest is part of being a hunter.' : 'That is enough for now.',
      body: `Your next step, away from the screen:\n\n${next}`, good: true,
      cb: () => { k.done = true; k.phase = 'done'; sh.meterHidden = false; sh.panelText = ''; } });
  }
  k.update = dt => {
    sh.updateTools(dt);
    if (k.phase !== 'breathe') return;
    k.t += dt;
    const le = sh.runs.longExhale;
    const breathed = (sh.stats.toolUses.longExhale || 0) > k.base;
    if ((breathed && (!le || le.phase === 'idle')) || (k.t > 25 && (!le || le.phase === 'idle'))) close();
  };
  k.draw = () => {
    sh.drawWorldBack(); sh.drawMentors(); sh.drawMe({ pose: 'crouch' }); sh.drawWorldFront();
    if (k.phase === 'breathe') { ctx.textAlign = 'center'; ctx.font = FH(14, 500); ctx.fillStyle = 'rgba(224,242,254,0.8)'; ctx.fillText('HOLD BREATHE · IN FOR 3 · OUT FOR 5', W / 2, SH() - 30); }
    sh.drawPanel(); sh.drawCard();
  };
  return k;
}
