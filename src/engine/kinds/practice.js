// Teach-beat practice: try the tool once while it's calm and safe. No simmer, no takeover.
import { ctx, GY } from '../canvas.js';
import { INSTINCTS } from '../meter.js';
import { createSetpieces } from '../setpieces.js';
import { drawCarcass, drawBeetle } from '../../art/props.js';

export function createPractice(cfg, sh) {
  const inst = cfg.primary || cfg.meters[0], toolId = cfg.tool || INSTINCTS[inst].tool;
  const pieces = createSetpieces(cfg.setpieces, sh);
  const p = { phase: 'live', t: 0, done: false, after: null, base: sh.stats.toolUses[toolId] || 0 };
  const m = sh.meters.get(inst); if (m) { m.set(Math.max(m.value, cfg.startValue || 0.4)); m.crossings(); }
  sh.clearChoices();
  sh.panelText = cfg.panelText || '';
  sh.pulseTool = toolId;
  if (cfg.line) sh.say(cfg.line, 6, 2);
  p.update = dt => {
    p.t += dt; pieces.update(dt, true);
    sh.updateTools(dt);
    if (p.after === null && (sh.stats.toolUses[toolId] || 0) > p.base) p.after = 3;
    if (p.after !== null) { p.after -= dt; if (p.after <= 0) { p.done = true; p.phase = 'done'; sh.pulseTool = null; pieces.stop(); } }
  };
  p.draw = () => {
    sh.drawWorldBack(); pieces.drawBack(); sh.drawMentors();
    if (cfg.carcass) drawCarcass(cfg.carcass.x || 218, GY() + 2);
    for (const d of (sh.targets.distractions || [])) if (!d.parked) drawBeetle(d.dragX ?? d.x, d.dragY ?? d.y, sh.T, 1.3);
    sh.drawMe(); pieces.drawFront(); sh.drawWorldFront();
    if (sh.runs.parkIt) { sh.runs.parkIt.draw(sh.stats.parked, sh.T); }
    sh.drawPanel(); sh.drawCard();
  };
  return p;
}
