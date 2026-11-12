// Finale teach beat: show Nip each tool you have learned. He copies you. Teaching it is how you know you've got it.
import { ctx, W, GY, SH, FH } from '../canvas.js';
import { TOOLS, TOOL_ORDER } from '../tools/index.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawBeetle } from '../../art/props.js';

const T = (x, gy, label, w = 64, h = 46) => ({ x, gy, w, h, label });
const S = (x, sy, label, w = 116, h = 36) => ({ x, sy, w, h, label });
const TARGETS = {
  cover: [T(20, -50, 'Rocks', 84, 52), T(296, -50, 'Ridge', 84, 50)],
  see: [{ at: 'nip', w: 64, h: 54, label: 'Nip' }, { at: 'volcano', w: 90, h: 70, label: 'The volcano' }, { at: 'scar', w: 70, h: 60, label: 'Scar' }],
  hear: [T(40, -320, 'Rumbling'), T(180, -340, 'Nip'), T(310, -310, 'Wind')],
  feel: [S(18, -110, 'Warm ground'), S(142, -110, 'Ash on me'), S(266, -110, 'My heartbeat')],
};
const PRAISE = {
  longExhale: 'Nip puffs his chest in, then lets it out slowly. In for 3, out for 5.',
  oneThing: 'Nip ducks into cover and whispers: "Rock. Wind. Warm ground."',
  parkIt: 'Nip pushes a shiny pebble aside: "Later." Then looks back at you.',
  burstRest: 'Nip stretches up tall, then shakes out every claw.',
  waitSignal: 'Nip goes completely still, tail twitching, waiting for your nod.',
};

export function createTeachNip(sh) {
  const A = sh.actors, order = TOOL_ORDER.filter(id => sh.tools.includes(id));
  const k = { i: -1, current: null, done: false, copyT: 0, endT: null, phase: 'teach', result: { calmRun: false } };
  sh.meterHidden = true; sh.clearChoices();
  A.nip.on = true; A.nip.x = A.nip.tx = 250; A.nip.face = -1;
  A.scar.on = true; A.scar.x = A.scar.tx = 58;
  sh.say("Nip has watched you all year. Show him your tools, one at a time. Teaching it is how you know you've got it.", 6, 3, 'scar');
  function next() {
    k.i++; k.copyT = 0;
    if (k.i >= order.length) { k.current = null; k.endT = 0; sh.onlyTool = null; sh.pulseTool = null; sh.say("Nip's got them all. And so have you.", 4, 3, 'scar'); return; }
    const id = order[k.i]; k.current = id; k.base = sh.stats.toolUses[id] || 0;
    sh.resetTools(); sh.onlyTool = id;
    sh.pulseTool = id;
    sh.targets = { oneThing: TARGETS, distractions: id === 'parkIt' ? [{ id: 'Shiny pebble', x: 300, y: GY() - 120, r: 24, parked: false, on: true }] : null };
    const T = TOOLS[id].TOOL;
    sh.sayNext(`Show Nip the ${T.name}. ${T.how}`, 6, 'scar');
    sh.panelText = `Show Nip: ${T.name}`;
  }
  next();
  k.update = dt => {
    sh.updateTools(dt);
    if (k.endT !== null) { k.endT += dt; if (k.endT > 2.5) { k.done = true; sh.meterHidden = false; sh.panelText = ''; A.nip.on = false; } return; }
    const id = k.current;
    if (k.copyT > 0) { k.copyT -= dt; if (k.copyT <= 0) next(); return; }
    if ((sh.stats.toolUses[id] || 0) > k.base) { k.copyT = 2.4; sh.say(PRAISE[id], 3, 2, 'narr'); sh.env.audio.SFX.chirp(); }
  };
  k.draw = () => {
    sh.drawWorldBack(); sh.drawMentors();
    const copying = k.copyT > 0, n = A.nip;
    drawRaptor(n.x, GY() + 2, n.s * (copying && k.current === 'burstRest' ? 1.1 : 1), copying ? (k.current === 'waitSignal' ? 'still' : 'stand') : 'crouch', sh.T, -1, {});
    if (copying && k.current === 'longExhale') { const r = 10 + 16 * (0.5 + 0.5 * Math.sin(sh.T * 2)); ctx.strokeStyle = 'rgba(186,230,253,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, GY() - 60, r, 0, 7); ctx.stroke(); }
    sh.drawMe();
    for (const d of (sh.targets.distractions || [])) if (!d.parked) drawBeetle(d.dragX ?? d.x, d.dragY ?? d.y, sh.T, 1.4);
    sh.drawWorldFront();
    if (k.current === 'parkIt' && sh.runs.parkIt) sh.runs.parkIt.draw([], sh.T);
    ctx.textAlign = 'center'; ctx.font = FH(13, 500); ctx.fillStyle = 'rgba(254,243,199,0.8)';
    ctx.fillText(`TEACHING NIP · ${Math.min(k.i + 1, order.length)} OF ${order.length}`, W / 2, SH() - 30);
    sh.drawPanel(); sh.drawCard();
  };
  return k;
}
