import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile, calmBot } from './harness.js';
import { createPrologue } from '../../src/engine/kinds/prologue.js';
import { createRunner } from '../../src/play/runner.js';
import RAGE from '../../src/data/chapters/1-rage.js';

function run(scene, shell, policy, maxSecs = 120) {
  let t = 0; const beats = new Set();
  while (!scene.done && t < maxSecs) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else if (policy) policy(scene, t);
    shell.update(1 / 20); if (!shell.card) scene.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
    beats.add(scene.beat);
  }
  return { t, beats };
}

test('the opening story plays through every beat with no input, in about a minute, and never gets stuck', () => {
  const { shell } = makeShell();
  const p = createPrologue(shell);
  const { t, beats } = run(p, shell);
  assert.equal(p.done, true);
  for (const b of ['open', 'tempt', 'chase', 'lost', 'shadow', 'rescue', 'home', 'rumble', 'title']) assert.ok(beats.has(b), `beat ${b}`);
  assert.ok(t > 40 && t < 100, `took ${t.toFixed(0)} s`);
});

test('holding to run makes the raptor chase faster', () => {
  const a = makeShell(), b = makeShell();
  const pa = createPrologue(a.shell), pb = createPrologue(b.shell);
  let holding = false;
  const hold = (fi) => (scene) => { if (scene.beat === 'tempt' || scene.beat === 'chase') { if (!holding) { fi.keyDown('Space'); holding = true; } } else if (holding) { fi.keyUp('Space'); holding = false; } };
  const ra = run(pa, a.shell, hold(a.fi));
  const rb = run(pb, b.shell, null);
  assert.ok(pa.maxRun > pb.maxRun * 1.3, `held ${pa.maxRun} vs idle ${pb.maxRun}`);
  assert.ok(ra.t < rb.t);
});

test('Skip ends the story at once', () => {
  const { shell } = makeShell();
  const p = createPrologue(shell);
  run(p, shell, null, 3);
  p.skip();
  assert.equal(p.done, true);
});

test('Scar speaks the line that sets up the game', () => {
  const { shell } = makeShell();
  const said = []; const say = shell.say; shell.say = (t, ...r) => { said.push(t); say(t, ...r); };
  const p = createPrologue(shell);
  run(p, shell);
  assert.ok(said.some(s => /greatest hunter this valley has ever seen/.test(s)));
  assert.ok(said.some(s => /steer it/.test(s)));
});

function leg0(profile) {
  const { shell, fi } = makeShell({ profile });
  const steps = [];
  const runner = createRunner({ profile, chapter: RAGE, mode: 'leg', leg: 0, shell, now: () => 0, session: { capReached: () => false }, pickSigns: () => {}, onDone: () => {} });
  const bot = calmBot(fi);
  for (let t = 0; t < 40 && steps.length < 4; t += 1 / 20) {
    if (shell.card) { steps.push('card:' + shell.card.title); shell.cardBorn = -9; shell.dismissCard(); }
    else bot({ shell });
    if (runner.scene && runner.scene.kind === 'prologue' && !steps.includes('prologue')) { steps.push('prologue'); runner.scene.skip(); }
    runner.update(1 / 20); shell.input.beginFrame();
  }
  return steps;
}
test('a new player sees the story before Scar\'s first speech, once only', () => {
  const p = makeProfile();
  const first = leg0(p);
  assert.equal(first[0], 'prologue');
  assert.equal(first[1], 'card:OLD SCAR');
  assert.equal(p.seenPrologue, true);
  const again = leg0(p);
  assert.notEqual(again[0], 'prologue');
});

test('Scar\'s first speech follows on from the story', () => {
  assert.doesNotMatch(RAGE.intro.body, /brought down your first prey/);
  assert.match(RAGE.intro.body, /Shadow|safe/i);
});
