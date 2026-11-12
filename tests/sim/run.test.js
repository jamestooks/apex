import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, runScene, makeProfile } from './harness.js';
import { createRun } from '../../src/engine/kinds/run.js';
import CH from '../../src/data/chapters/4-energy.js';

function setup(sc, tools = ['longExhale', 'oneThing', 'parkIt', 'burstRest']) {
  const { shell, fi } = makeShell({ theme: 'river', profile: makeProfile({ toolbelt: tools }) });
  shell.setStage({ instincts: sc.meters, tools });
  return { shell, fi, scene: createRun(sc, shell) };
}
// Holds Space to sprint on a fixed rhythm.
const rhythm = (fi, on, off) => { let t = 0, held = false; return () => { t += 1 / 20; const want = (t % (on + off)) < on; if (want !== held) { want ? fi.keyDown('Space') : fi.keyUp('Space'); held = want; } }; };
const zig = CH.scenarios.test.find(s => s.id === 'zigzag');

test('always sprinting burns out before the end of the zigzag chase, and the scene still finishes', () => {
  const { shell, fi, scene } = setup(zig);
  fi.keyDown('Space');
  runScene(shell, scene, () => {}, { dt: 1 / 20, maxSecs: 240 });
  assert.equal(scene.done, true);
  assert.ok(shell.stats.tookOver >= 1);
  assert.equal(scene.result.dTrust, 0);
});

test('short bursts and rests (2 s / 3 s) catch the prey without burning out, and earn trust', () => {
  const { shell, fi, scene } = setup(zig);
  runScene(shell, scene, rhythm(fi, 2, 3), { dt: 1 / 20, maxSecs: 240 });
  assert.equal(scene.done, true);
  assert.equal(shell.stats.tookOver, 0);
  assert.equal(scene.result.success, true);
  assert.equal(scene.result.dTrust, 1);
});

test('above the lock line a sprint is no faster than a trot', () => {
  const { shell, fi, scene } = setup(zig);
  shell.meters.get('fuel').set(0.75);
  assert.equal(scene.speedFor(true), scene.speedFor(false));
  shell.meters.get('fuel').set(0.2);
  assert.ok(scene.speedFor(true) > scene.speedFor(false));
});

test('a burnout lasts 4 seconds', () => {
  const { shell, fi, scene } = setup(zig);
  fi.keyDown('Space');
  let t = 0, start = null, end = null;
  while (t < 60 && end === null) {
    shell.update(1 / 20); scene.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
    if (scene.burnout > 0 && start === null) start = t;
    if (start !== null && scene.burnout <= 0) end = t;
  }
  assert.ok(start !== null);
  assert.ok(Math.abs((end - start) - 4) < 0.15, `burnout lasted ${end - start}`);
});

for (const sc of CH.scenarios.test.filter(s => s.kind === 'run')) {
  test(`${sc.id}: the pacing player finishes`, () => {
    const { shell, fi, scene } = setup(sc);
    runScene(shell, scene, rhythm(fi, 2, 3), { dt: 1 / 20, maxSecs: 300 });
    assert.equal(scene.done, true); assert.equal(scene.result.success, true);
  });
}

test('after a run you start the next one rested (fuel at most 0.1)', () => {
  const sc = CH.scenarios.test[0];
  const { shell, fi, scene } = setup(sc);
  runScene(shell, scene, rhythm(fi, 2, 3), { dt: 1 / 20, maxSecs: 200 });
  assert.ok(shell.meters.get('fuel').value <= 0.1 + 1e-9);
});
