import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell } from '../sim/harness.js';
import { createMoment } from '../../src/engine/kinds/moment.js';
import RAGE from '../../src/data/chapters/1-rage.js';

const step = (shell, scene, secs, dt = 1 / 30) => { for (let t = 0; t < secs; t += dt) { shell.update(dt); if (scene && !shell.card) scene.update(dt); else if (!scene) shell.updateTools(dt); shell.input.beginFrame(); } };

test('a card ignores dismissal in its first 0.7 s', () => {
  const { shell } = makeShell();
  let n = 0; shell.showCard({ title: 'X', body: 'y', cb: () => n++ });
  step(shell, null, 0.3); shell.dismissCard();
  assert.ok(shell.card); assert.equal(n, 0);
  step(shell, null, 0.5); shell.dismissCard();
  assert.equal(shell.card, null); assert.equal(n, 1);
});

test('Space holds the first tool and drives a Long Exhale', () => {
  const { shell, fi } = makeShell();
  const sc = RAGE.scenarios.test[0];
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  fi.keyDown('Space'); step(shell, null, 3.1);
  assert.equal(shell.runs.longExhale.phase, 'full');
  fi.keyUp('Space'); step(shell, null, 0.1);
  assert.equal(shell.runs.longExhale.phase, 'out');
});

test('pause clears a held breath and shows a tap-to-continue card', () => {
  const { shell, fi } = makeShell();
  const sc = RAGE.scenarios.test[0];
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  fi.keyDown('Space'); step(shell, null, 1);
  assert.equal(shell.runs.longExhale.phase, 'in');
  shell.pause();
  assert.equal(shell.input.keys.size, 0);
  assert.equal(shell.runs.longExhale.phase, 'idle');
  assert.match(shell.card.title, /PAUSED/);
  step(shell, null, 1); shell.dismissCard();
  assert.equal(shell.card, null);
});

test('keys 1-4 pick choices while a moment is live', () => {
  const { shell, fi } = makeShell();
  const sc = RAGE.scenarios.test[0];
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  const m = createMoment(sc, shell);
  for (let i = 0; i < 400 && m.phase !== 'live'; i++) step(shell, m, 1 / 30);
  assert.equal(m.phase, 'live');
  // drain the meter below the lock line so calm choices are open
  shell.meters.list.forEach(x => x.set(0.2));
  fi.keyDown('2');
  assert.equal(m.phase, 'resolve');
  assert.equal(m.result.choice, sc.choices[1].k);
});

test('calm choices are refused above the lock line', () => {
  const { shell } = makeShell();
  const sc = RAGE.scenarios.test[0];
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  const m = createMoment(sc, shell);
  for (let i = 0; i < 400 && m.phase !== 'live'; i++) step(shell, m, 1 / 30);
  shell.meters.list[0].set(0.75);
  m.choose('stand');
  assert.equal(m.phase, 'live');
  m.choose('attack');
  assert.equal(m.phase, 'resolve');
});

test('an abandoned One Thing times out so other tools and the meters work again', async () => {
  const CH2 = (await import('../../src/data/chapters/2-overwhelm.js')).default;
  const sc = CH2.scenarios.test[0];
  const { shell } = makeShell({ tools: ['longExhale', 'oneThing'] });
  shell.setStage({ instincts: sc.meters, tools: ['longExhale', 'oneThing'], targets: { oneThing: sc.oneThing } });
  shell.startTapTool('oneThing');
  assert.equal(shell.activeTool, 'oneThing');
  step(shell, null, 10.5);
  assert.equal(shell.activeTool, null);
  assert.equal(shell.runs.oneThing, null);
});

test('dispose releases the keyboard and pointer hooks', () => {
  const { shell } = makeShell();
  assert.ok(shell.input.onKey);
  shell.dispose();
  assert.equal(shell.input.onKey, null); assert.equal(shell.input.onDown, null);
});

import { view, GY, SH, W } from '../../src/engine/canvas.js';
import { THEMES } from '../../src/art/world.js';
import { SAFE_TOP, SAFE_BOTTOM } from '../../src/engine/scene.js';
import { createSetpieces } from '../../src/engine/setpieces.js';

async function stampedeOneThing(H) {
  view.H = H;
  const CH2 = (await import('../../src/data/chapters/2-overwhelm.js')).default;
  const sc = CH2.scenarios.test[0];
  const { shell } = makeShell({ tools: ['oneThing'], theme: 'dust' });
  shell.setStage({ instincts: sc.meters, tools: ['oneThing'], theme: 'dust', targets: { oneThing: sc.oneThing } });
  createMoment(sc, shell);
  shell.startTapTool('oneThing');
  return { shell, targets: shell.runs.oneThing.targets };
}
const centre = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

test('One Thing targets sit over the things they name (sun, rock, Echo)', async () => {
  const { shell, targets } = await stampedeOneThing(865);
  const sun = targets.see.find(b => b.label === 'The sun'), echo = targets.see.find(b => b.label === 'Echo'), rock = targets.cover.find(b => b.label === 'Rock');
  const s = THEMES.dust.sun;
  assert.ok(Math.abs(centre(sun).x - W * s.x) < 2 && Math.abs(centre(sun).y - (GY() - s.dy)) < 2, 'sun');
  assert.ok(Math.abs(centre(echo).x - shell.actors.echo.x) < 30, 'echo x');
  assert.ok(Math.abs(centre(rock).x - 72) < 2, 'rock x');
  view.H = 700;
});

for (const H of [600, 700, 865]) {
  test(`One Thing targets stay clear of the speech box and bottom prompt (screen height ${H})`, async () => {
    const { targets } = await stampedeOneThing(H);
    for (const list of Object.values(targets)) for (const b of list) {
      assert.ok(b.y >= SAFE_TOP, `${b.label} top ${b.y} under the speech box`);
      assert.ok(b.y + b.h <= SH() - SAFE_BOTTOM, `${b.label} bottom ${b.y + b.h} under the prompt`);
      assert.ok(b.x >= 0 && b.x + b.w <= W, `${b.label} off screen`);
    }
    view.H = 700;
  });
}

test('shouted call bubbles never appear under the speech box', () => {
  view.H = 600;
  const { shell } = makeShell();
  const pieces = createSetpieces([{ type: 'calls', every: 0.01 }], shell);
  const ys = [];
  for (let i = 0; i < 400; i++) { pieces.update(0.05, true); for (const c of pieces.get('calls').state.list) ys.push(c.y); }
  assert.ok(ys.length > 20);
  assert.ok(Math.min(...ys) >= SAFE_TOP + 14, `lowest call at ${Math.min(...ys)}`);
  view.H = 700;
});
