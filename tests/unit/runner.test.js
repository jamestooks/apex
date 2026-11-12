import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile, calmBot } from '../sim/harness.js';
import { createRunner } from '../../src/play/runner.js';
import RAGE from '../../src/data/chapters/1-rage.js';

function play(runner, shell, policy, { maxSecs = 900, dt = 1 / 20, onTick } = {}) {
  let t = 0;
  while (!runner.finished && t < maxSecs) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else if (policy) policy({ shell, runner, t });
    if (onTick) onTick(t);
    runner.update(dt); shell.input.beginFrame(); t += dt;
  }
  return t;
}
function setup({ leg = 0, profile, nowRef } = {}) {
  const p = profile || makeProfile({ chapters: {} });
  const { shell, fi } = makeShell({ profile: p });
  let summary = null, signsAsked = 0;
  const clock = nowRef || { t: 0 };
  const runner = createRunner({ profile: p, chapter: RAGE, mode: 'leg', leg, shell, now: () => clock.t,
    session: { capReached: t => t >= (clock.cap ?? Infinity) },
    pickSigns: async inst => { signsAsked++; p.signs[inst] = ['Hot face', 'Loud voice', 'Tight chest']; },
    onDone: s => { summary = s; } });
  return { p, shell, fi, runner, get summary() { return summary; }, get signsAsked() { return signsAsked; }, clock };
}

test('a calm leg 0 runs teach + three tests, completes the leg and reports field notes', async () => {
  const s = setup();
  play(s.runner, s.shell, calmBot(s.fi));
  await new Promise(r => setTimeout(r, 0));
  assert.ok(s.summary, 'onDone called');
  assert.equal(s.summary.completedLeg, true);
  assert.equal(s.p.chapters[1].leg, 1);
  assert.equal(s.summary.stats.earlyOf, 3);
  assert.ok(s.p.toolbelt.includes('longExhale'));
});

test('signs are asked for once when the profile has none for this instinct', async () => {
  const p = makeProfile({ chapters: {} }); p.signs = { ...p.signs, rage: [] };
  const s = setup({ profile: p });
  play(s.runner, s.shell, calmBot(s.fi), { maxSecs: 30 });
  await new Promise(r => setTimeout(r, 0));
  play(s.runner, s.shell, calmBot(s.fi));
  assert.equal(s.signsAsked, 1);
  assert.equal(p.signs.rage.length, 3);
});

test('a cap reached mid-scenario waits for the scene to finish, then wraps up without completing the leg', () => {
  const s = setup();
  let capSetDuring = null;
  play(s.runner, s.shell, calmBot(s.fi), { onTick: () => {
    if (capSetDuring === null && s.runner.step === 'scenario' && s.runner.scenarioIndex === 1 && s.runner.scene && s.runner.scene.phase === 'live') {
      s.clock.cap = 0; capSetDuring = s.runner.scene;
    }
  } });
  assert.ok(capSetDuring, 'cap was set during scenario 2');
  assert.equal(capSetDuring.done, true, 'scenario 2 finished before wrap-up');
  assert.equal(s.summary.capped, true);
  assert.equal(s.summary.completedLeg, false);
  assert.equal(s.p.chapters[1] ? s.p.chapters[1].leg : 0, 0);
});

test('a hurtPack outcome brings the repair scene at the end of the leg', () => {
  const s = setup();
  let sawRepair = false;
  const attackBot = calmBot(s.fi, { attack: true }), practiceBot = calmBot(s.fi);
  play(s.runner, s.shell, ctx => { if (s.runner.step === 'practice') practiceBot(ctx); else attackBot(ctx); if (s.runner.step === 'repair') { sawRepair = true; if (s.shell.choices) s.shell.choiceCb('peace'); } });
  assert.equal(sawRepair, true);
  assert.equal(s.summary.stats.repaired, true);
});

test('three calm scenes in a row speed things up', () => {
  const s = setup();
  play(s.runner, s.shell, calmBot(s.fi));
  assert.equal(s.runner.difficulty.gapMul, 0.6);
  assert.equal(s.runner.difficulty.spikeAdd, 0.05);
});

test('leg 1 plays mix + big and marks the chapter done', () => {
  const p = makeProfile({ chapters: { 1: { leg: 1, done: false } }, toolbelt: ['longExhale'] });
  const s = setup({ leg: 1, profile: p });
  play(s.runner, s.shell, calmBot(s.fi));
  assert.equal(s.summary.completedLeg, true);
  assert.equal(s.summary.chapterDone, true);
  assert.equal(p.chapters[1].done, true);
});

test('practice never counts toward trust, field notes or difficulty', async () => {
  const CH5 = (await import('../../src/data/chapters/5-impulse.js')).default;
  const p = makeProfile({ chapters: {} });
  const { shell } = makeShell({ profile: p });
  let stepSeen = false;
  const runner = createRunner({ profile: p, chapter: CH5, mode: 'leg', leg: 0, shell, now: () => 0, session: { capReached: () => false }, pickSigns: async () => {}, onDone: () => {} });
  // never hide during practice: the urge takes over
  for (let t = 0; t < 120 && !(runner.step !== 'practice' && stepSeen); t += 1 / 20) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    runner.update(1 / 20); shell.input.beginFrame();
    if (runner.step === 'practice') stepSeen = true;
  }
  assert.ok(stepSeen);
  assert.equal(shell.stats.tookOver, 0);
  assert.equal(shell.stats.earlyOf, 0);
  assert.equal(shell.difficulty.simmerMul, 1);
});
