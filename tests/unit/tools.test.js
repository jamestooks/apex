import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, toolForInstinct } from '../../src/engine/tools/index.js';

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);
function run(r, secs, io, step = 1 / 60) {
  let relief = 0; const events = [];
  for (let t = 0; t < secs - 1e-9; t += step) { const o = r.update(step, io); relief += o.relief; events.push(...o.events); }
  return { relief, events };
}
const io = (held, extra) => ({ held, taps: [], drag: null, targets: {}, ...extra });

test('registry has five tools mapped to instincts with spec phrases', () => {
  assert.deepEqual(Object.keys(TOOLS).sort(), ['burstRest', 'longExhale', 'oneThing', 'parkIt', 'waitSignal']);
  assert.equal(toolForInstinct('rage').TOOL.id, 'longExhale');
  assert.equal(TOOLS.longExhale.TOOL.phrase, "Rage meter's rising. Long Exhale?");
  assert.equal(TOOLS.oneThing.TOOL.phrase, 'Too much at once? One Thing.');
  assert.equal(TOOLS.parkIt.TOOL.phrase, 'Park it.');
  assert.equal(TOOLS.burstRest.TOOL.phrase, 'Burst and rest.');
  assert.equal(TOOLS.waitSignal.TOOL.phrase, 'Wait for the signal.');
});

test('longExhale: holding 3 s reaches full', () => {
  const r = TOOLS.longExhale.createRun();
  run(r, 3.05, io(true));
  assert.equal(r.phase, 'full');
});
test('longExhale: releasing early returns to idle with a hint', () => {
  const r = TOOLS.longExhale.createRun();
  run(r, 2, io(true));
  const o = run(r, 0.02, io(false));
  assert.equal(r.phase, 'idle'); assert.ok(o.events.includes('hint:allTheWayIn'));
});
test('longExhale: a full out-breath relieves 0.375 and emits breath', () => {
  const r = TOOLS.longExhale.createRun();
  run(r, 3.05, io(true));
  const o = run(r, 5.1, io(false));
  near(o.relief, 0.375, 0.002); assert.ok(o.events.includes('breath')); assert.equal(r.phase, 'idle');
});
test('longExhale: holding during the out-breath gives no relief and a hint', () => {
  const r = TOOLS.longExhale.createRun();
  run(r, 3.05, io(true)); run(r, 0.1, io(false));
  const o = run(r, 1, io(true));
  assert.equal(o.relief, 0); assert.ok(o.events.includes('hint:letItOut'));
});
test('longExhale: simmer pauses during in, out and the first 2 s of full', () => {
  const r = TOOLS.longExhale.createRun();
  assert.equal(r.pausesSimmer, false);
  run(r, 1, io(true)); assert.equal(r.pausesSimmer, true);
  run(r, 2.1, io(true)); assert.equal(r.phase, 'full'); assert.equal(r.pausesSimmer, true);
  run(r, 2.1, io(true)); assert.equal(r.pausesSimmer, false);
  run(r, 0.1, io(false)); assert.equal(r.phase, 'out'); assert.equal(r.pausesSimmer, true);
});

const box = (x, label) => ({ x, y: 100, w: 40, h: 40, label });
const targets = { cover: [box(0, 'rock')], see: [box(50, 'tree'), box(100, 'sun')], hear: [box(150, 'thunder')], feel: [box(200, 'ground')] };
const tapAt = b => ({ held: false, taps: [{ x: b.x + 5, y: b.y + 5 }], drag: null, targets: {} });

test('oneThing: taps before the dwell or on the wrong step do not advance', () => {
  const r = TOOLS.oneThing.createRun({ targets });
  r.update(0.5, tapAt(targets.cover[0]));
  assert.equal(r.phase, 'cover');
  run(r, 1.3, io(false));
  r.update(0.016, tapAt(targets.see[0]));
  assert.equal(r.phase, 'cover');
});
test('oneThing: the full sequence relieves 0.55 and emits each step', () => {
  const r = TOOLS.oneThing.createRun({ targets });
  let relief = 0; const ev = [];
  for (const step of ['cover', 'see', 'hear', 'feel']) {
    run(r, 1.3, io(false));
    const o = r.update(0.016, tapAt(targets[step][0])); relief += o.relief; ev.push(...o.events);
  }
  near(relief, 0.55);
  assert.deepEqual(ev, ['step:cover', 'step:see', 'step:hear', 'step:feel', 'done']);
  assert.equal(r.phase, 'next'); assert.equal(r.done, true);
});

test('parkIt: a drop inside the map parks with 0.25 relief, outside does not', () => {
  const mapRect = { x: 0, y: 0, w: 60, h: 60 };
  const d = { id: 'beetle', x: 200, y: 200, r: 20, parked: false };
  const r = TOOLS.parkIt.createRun({ mapRect });
  const drag = { active: true, startX: 205, startY: 198, x: 205, y: 198, released: false };
  r.update(0.016, { held: true, taps: [], drag, targets: { distractions: [d] } });
  Object.assign(drag, { active: false, released: true, x: 300, y: 300 });
  let o = r.update(0.016, { held: false, taps: [], drag, targets: { distractions: [d] } });
  assert.equal(o.relief, 0); assert.equal(d.parked, false);
  const drag2 = { active: true, startX: 200, startY: 200, x: 200, y: 200, released: false };
  r.update(0.016, { held: true, taps: [], drag: drag2, targets: { distractions: [d] } });
  Object.assign(drag2, { active: false, released: true, x: 30, y: 30 });
  o = r.update(0.016, { held: false, taps: [], drag: drag2, targets: { distractions: [d] } });
  assert.equal(o.relief, 0.25); assert.equal(d.parked, true); assert.ok(o.events.includes('parked:beetle'));
});

test('burstRest run: sprinting adds fuel at 0.16/s at speed 3', () => {
  const r = TOOLS.burstRest.createRun({ mode: 'run' });
  const o = run(r, 1, io(true));
  near(o.relief, -0.16, 0.003); assert.equal(r.speed, 3);
});
test('burstRest run: releasing trots for 2 s then rests', () => {
  const r = TOOLS.burstRest.createRun({ mode: 'run' });
  const o = run(r, 3, io(false));
  near(o.relief, 0.10 * 2 + 0.16 * 1, 0.004); assert.equal(r.speed, 1);
});
test('burstRest break: 5 s held completes with 0.4 relief, release pauses', () => {
  const r = TOOLS.burstRest.createRun({ mode: 'break' });
  run(r, 2, io(true)); run(r, 3, io(false));
  assert.equal(r.done, false);
  const o = run(r, 3.05, io(true));
  assert.equal(r.done, true); assert.ok(o.events.includes('done'));
});
test('waitSignal ride: 6 s held completes with 0.36 relief', () => {
  const r = TOOLS.waitSignal.createRun({ mode: 'ride' });
  const o = run(r, 6.02, io(true));
  near(o.relief, 0.36, 0.002); assert.equal(r.done, true); assert.ok(o.events.includes('done'));
});
