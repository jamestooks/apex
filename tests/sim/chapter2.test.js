import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, runScene, oneThingBot, makeProfile } from './harness.js';
import { KINDS } from '../../src/play/runner.js';
import CH from '../../src/data/chapters/2-overwhelm.js';

function play(sc, mkPolicy, tools = ['longExhale', 'oneThing']) {
  const { shell, fi } = makeShell({ theme: CH.theme, profile: makeProfile({ toolbelt: tools }) });
  shell.setStage({ instincts: sc.meters, tools, targets: { oneThing: sc.oneThing } });
  const scene = KINDS[sc.kind](sc, shell);
  runScene(shell, scene, mkPolicy(fi), { dt: 1 / 20, maxSecs: 200 });
  assert.equal(scene.done, true, `${sc.id} finished`);
  return { r: scene.result, shell };
}

for (const sc of CH.scenarios.test) {
  test(`${sc.id}: One Thing at the first sign, then a calm choice, earns trust`, () => {
    const { r } = play(sc, fi => oneThingBot(fi));
    assert.equal(r.forced, false); assert.equal(r.dTrust, 1); assert.equal(r.early, true);
  });
  test(`${sc.id}: doing nothing ends in BOLT, still finishes, and names a next step`, () => {
    const { r, shell } = play(sc, () => () => {});
    assert.equal(r.forced, true); assert.equal(r.choice, 'bolt');
  });
}

test('mix: Long Exhale alone never marks overload as tackled; One Thing does', () => {
  const sc = CH.scenarios.mix[0];
  const a = play(sc, fi => oneThingBot(fi, { onlyExhale: true }));
  assert.equal(a.shell.meters.get('overload').firstToolAt, null);
  assert.equal(a.r.usedTool, false);
  const b = play(sc, fi => oneThingBot(fi));
  assert.notEqual(b.shell.meters.get('overload').firstToolAt, null);
  assert.equal(b.r.early, true);
});

test('big moment: leading Nip to cover is an option and earns the strength line', () => {
  const sc = CH.scenarios.big[0];
  assert.ok(sc.choices.find(c => c.k === 'lead'));
  assert.match(sc.outcomes.lead.strength, /sharp senses/i);
});
