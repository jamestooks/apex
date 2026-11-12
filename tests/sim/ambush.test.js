import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile } from './harness.js';
import { createAmbush } from '../../src/engine/kinds/ambush.js';
import { SPIKE_CAP } from '../../src/engine/meter.js';
import CH from '../../src/data/chapters/5-impulse.js';

function setup(sc) {
  const tools = ['longExhale', 'oneThing', 'parkIt', 'burstRest', 'waitSignal'];
  const { shell, fi } = makeShell({ theme: 'moon', profile: makeProfile({ toolbelt: tools }) });
  shell.setStage({ instincts: sc.meters, tools });
  return { shell, fi, scene: createAmbush(sc, shell) };
}
// Runs until done; policy(scene, t) returns 'hold' | 'release' | 'tap'.
function play({ shell, fi, scene }, policy, maxSecs = 120) {
  let t = 0, holding = false, maxUrge = 0;
  while (!scene.done && t < maxSecs) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else {
      const a = policy(scene, t);
      if (a === 'hold' && !holding) { fi.down(200, 200, 7); holding = true; }
      if (a === 'release' && holding) { fi.up(7); holding = false; }
      if (a === 'tap') { scene.pounce(); }
    }
    shell.update(1 / 20); if (!shell.card) scene.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
    const u = shell.meters.get('urge'); if (u) maxUrge = Math.max(maxUrge, u.value);
  }
  return { r: scene.result, maxUrge };
}
const lookout = CH.scenarios.test.find(s => s.id === 'the-lookout');
const falseSig = CH.scenarios.test.find(s => s.id === 'false-signal');

test('holding still until the signal, then letting go, is a successful pounce', () => {
  const s = setup(lookout);
  const { r } = play(s, sc => (sc.signalOn ? 'release' : 'hold'));
  assert.equal(r.outcome, 'success'); assert.equal(r.success, true);
});

test('tapping POUNCE in the window also works', () => {
  const s = setup(lookout);
  const { r } = play(s, sc => (sc.signalOn ? 'tap' : 'hold'));
  assert.equal(r.outcome, 'success');
});

test('letting go at the first wave peak is too early', () => {
  const s = setup(lookout);
  const w = lookout.waves[0];
  const { r } = play(s, (sc, t) => (sc.heldT > w.at + w.rise ? 'release' : 'hold'));
  assert.equal(r.outcome, 'early'); assert.equal(r.dTrust, 0);
});

test("letting go on Nip's false signal counts as early", () => {
  const s = setup(falseSig);
  const { r } = play(s, sc => (sc.falseOn ? 'release' : 'hold'));
  assert.equal(r.outcome, 'early');
});

test('holding and never letting go: urge stays below 1 and the result is late, not a takeover', () => {
  const s = setup(lookout);
  const { r, maxUrge } = play(s, () => 'hold');
  assert.ok(maxUrge < 1);
  assert.equal(r.outcome, 'late'); assert.equal(r.forced, false);
});

for (const sc of CH.scenarios.test) {
  test(`${sc.id}: a twitch on top of a wave peak never passes the spike cap`, () => {
    const s = setup(sc);
    const { maxUrge } = play(s, scn => (scn.signalOn ? 'release' : 'hold'));
    assert.ok(maxUrge <= SPIKE_CAP + 1e-9, `max urge ${maxUrge}`);
  });
}

test('never hiding at all lets the urge take over', () => {
  const s = setup(lookout);
  const { r } = play(s, () => 'none', 90);
  assert.equal(r.forced, true);
});
