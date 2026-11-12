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
