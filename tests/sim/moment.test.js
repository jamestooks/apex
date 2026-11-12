import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, runScene } from './harness.js';
import { createMoment } from '../../src/engine/kinds/moment.js';
import { SIGN_T } from '../../src/engine/meter.js';
import RAGE from '../../src/data/chapters/1-rage.js';

// Plays the three Rage test scenes in a row with one shell, the way a leg does.
function playLeg(policyFor) {
  const { shell, fi, difficulty } = makeShell();
  const results = [];
  for (const sc of RAGE.scenarios.test) {
    shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
    const m = createMoment(sc, shell);
    const pol = policyFor({ shell, fi, m, sc });
    runScene(shell, m, pol);
    assert.equal(m.done, true, `${sc.id} should finish`);
    results.push({ ...m.result, peakAfter: m.peakAfterTrigger });
  }
  return { results, shell, difficulty };
}

// Breathe in/out through Space whenever the meter is past the first sign; choose `k` once calm.
function breather(k, { breatheAt = SIGN_T[0], chooseBelow = 0.5 } = {}) {
  return ({ shell, fi, m }) => {
    let holding = false, holdT = 0;
    return ({ t }) => {
      if (m.phase !== 'live' && m.phase !== 'gap') { if (holding) { fi.keyUp('Space'); holding = false; } return; }
      const r = shell.runs.longExhale, v = shell.meters.hottest;
      if (r.phase === 'idle' && !holding && v >= (m.phase === 'gap' ? 0.15 : breatheAt * 0.9)) { fi.keyDown('Space'); holding = true; holdT = t; }
      if (holding && r.phase === 'full') { fi.keyUp('Space'); holding = false; }
      if (m.phase === 'live' && r.phase === 'idle' && !holding && v < chooseBelow && shell.stats.toolUses.longExhale > 0) m.choose(k);
    };
  };
}

test('calm player: breathes at the first sign and stands tall, +1 trust every scene, early 3 of 3', () => {
  const { results, shell } = playLeg(breather('stand'));
  assert.deepEqual(results.map(r => r.dTrust), [1, 1, 1]);
  assert.equal(shell.stats.early, 3);
  assert.equal(shell.stats.tookOver, 0);
});

test('lazy player: never breathes, tries to walk away at once; a calm choice made hot earns nothing', () => {
  const { results } = playLeg(({ m }) => () => { if (m.phase === 'live') m.choose('walk'); });
  assert.equal(results[0].forced, false);
  for (const r of results) {
    if (!r.forced && r.heatAtChoice >= SIGN_T[1]) assert.equal(r.dTrust, 0);
    if (!r.forced && r.heatAtChoice < SIGN_T[1]) assert.equal(r.dTrust, 1);
    if (r.forced) assert.equal(r.choice, 'attack');
  }
});

test('never-breathing player: rage takes over every scene, but every scene still ends', () => {
  const { results, shell } = playLeg(() => () => {});
  assert.ok(results.every(r => r.forced && r.choice === 'attack'));
  assert.equal(shell.stats.tookOver, 3);
});

test('always-attack player: -1 per scene and the leg asks for repair', () => {
  const { results, shell } = playLeg(({ m }) => () => { if (m.phase === 'live') m.choose('attack'); });
  assert.deepEqual(results.map(r => r.dTrust), [-1, -1, -1]);
  assert.equal(shell.stats.needsRepair, true);
});

test('learns after one takeover: slower simmer afterwards and no trigger alone fills the meter', () => {
  let n = 0;
  const { results, difficulty } = playLeg(ctx => {
    const i = n++;
    return i === 0 ? () => {} : breather('stand')(ctx);
  });
  assert.equal(results[0].forced, true);
  assert.equal(difficulty.simmerMul, 0.6);
  for (const r of results.slice(1)) { assert.equal(r.forced, false); assert.ok(r.peakAfter < 1); }
});
