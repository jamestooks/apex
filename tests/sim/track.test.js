import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, runScene, trackBot, makeProfile } from './harness.js';
import { createTrack } from '../../src/engine/kinds/track.js';
import CH from '../../src/data/chapters/3-distraction.js';

function setup(sc, tools = ['longExhale', 'oneThing', 'parkIt']) {
  const { shell, fi } = makeShell({ theme: 'ferns', profile: makeProfile({ toolbelt: tools }) });
  shell.setStage({ instincts: sc.meters, tools, targets: { distractions: [] } });
  return { shell, fi, scene: createTrack(sc, shell) };
}
const step = (shell, scene, secs, dt = 1 / 20) => { for (let t = 0; t < secs; t += dt) { shell.update(dt); if (!shell.card) scene.update(dt); shell.input.beginFrame(); } };

test('tapping the glowing print advances along the trail', () => {
  const { shell, fi, scene } = setup(CH.scenarios.test[0]);
  step(shell, scene, 0.5);
  const before = scene.printIndex, p = scene.nextPrint();
  fi.tap(p.x, p.y); step(shell, scene, 0.1);
  assert.equal(scene.printIndex, before + 1);
});

test('tapping a decoy does not park it; dragging it to the map does, and stops its simmer', () => {
  const sc = CH.scenarios.test[0];
  const { shell, fi, scene } = setup(sc);
  for (let i = 0; i < 200 && !(shell.targets.distractions || []).length; i++) { const p = scene.nextPrint(); if (p) fi.tap(p.x, p.y); step(shell, scene, 0.3); }
  const d = shell.targets.distractions[0];
  assert.ok(d, 'a distraction appeared');
  fi.tap(d.x, d.y); step(shell, scene, 0.1);
  assert.equal(d.parked, false);
  const drift = shell.meters.get('drift');
  const v0 = drift.value; step(shell, scene, 1); assert.ok(drift.value > v0, 'unparked decoy simmers');
  fi.down(d.x, d.y, 3); fi.move(30, 90, 3); fi.up(3); step(shell, scene, 0.1);
  assert.equal(d.parked, true);
  const v1 = drift.value; step(shell, scene, 1); assert.ok(drift.value <= v1 + 1e-9, 'parked decoy no longer simmers');
});

test('ignoring every decoy ends in takeover and a failed hunt, but the scene still finishes with a card', () => {
  const { shell, fi, scene } = setup(CH.scenarios.test[1]);
  let sawCard = false;
  runScene(shell, scene, ctx => { if (shell.card) sawCard = true; trackBot(fi, { park: false })(ctx); }, { dt: 1 / 20, maxSecs: 300 });
  assert.equal(scene.done, true);
  assert.equal(scene.result.forced, true);
  assert.equal(scene.result.success, false);
  assert.equal(scene.result.dTrust, 0);
});

test('above the lock line the prints fade to 30%', () => {
  const { shell, scene } = setup(CH.scenarios.test[0]);
  step(shell, scene, 0.2);
  shell.meters.get('drift').set(0.75);
  assert.equal(scene.printAlpha(), 0.3);
  shell.meters.get('drift').set(0.2);
  assert.equal(scene.printAlpha(), 1);
});

for (const sc of CH.scenarios.test) {
  test(`${sc.id}: a calm tracker who parks distractions earns trust`, () => {
    const { shell, fi, scene } = setup(sc);
    runScene(shell, scene, trackBot(fi), { dt: 1 / 20, maxSecs: 300 });
    assert.equal(scene.done, true);
    assert.equal(scene.result.success, true);
    assert.equal(scene.result.dTrust, 1);
    assert.ok(shell.stats.parked.length >= 1);
  });
}

test('mix with Fang: rage rises too, and a breathing tracker still succeeds', () => {
  const { shell, fi, scene } = setup(CH.scenarios.mix[0]);
  runScene(shell, scene, trackBot(fi), { dt: 1 / 20, maxSecs: 300 });
  assert.equal(scene.result.success, true);
  assert.ok(shell.stats.toolUses.longExhale >= 1);
});
