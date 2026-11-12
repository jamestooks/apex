// Changes from the review against UK ADHD guidance (docs: "Apex review against UK ADHD guidance").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile, silentAudio, calmBot } from '../sim/harness.js';
import { createAmbush } from '../../src/engine/kinds/ambush.js';
import { createMoment } from '../../src/engine/kinds/moment.js';
import { createRunner } from '../../src/play/runner.js';
import { createSession } from '../../src/model/session.js';
import { newProfile } from '../../src/store.js';
import { planSteps } from '../../src/ui/plancard.js';
import { missionAck } from '../../src/ui/den.js';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import RAGE from '../../src/data/chapters/1-rage.js';
import IMPULSE from '../../src/data/chapters/5-impulse.js';

const step = (shell, scene, secs, dt = 1 / 20) => { for (let t = 0; t < secs; t += dt) { shell.update(dt); if (scene && !shell.card) scene.update(dt); else if (!scene) shell.updateTools(dt); shell.input.beginFrame(); } };

// 1. Wait for the Signal starts short and adapts (delay-aversion "shaping and fading")
function ambushRun(profile, policy) {
  const sc = IMPULSE.scenarios.test.find(s => s.id === 'the-lookout');
  const { shell, fi } = makeShell({ profile });
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  const scene = createAmbush(sc, shell);
  let t = 0, holding = false, signalAt = null;
  while (!scene.done && t < 90) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else { const a = policy(scene); if (a === 'hold' && !holding) { fi.down(200, 200, 7); holding = true; } if (a === 'release' && holding) { fi.up(7); holding = false; } }
    shell.update(1 / 20); if (!shell.card) scene.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
    if (scene.signalOn && signalAt === null) signalAt = scene.heldT;
  }
  return { scene, signalAt };
}
test('the first wait is about 4 seconds, not the full 13', () => {
  const p = makeProfile();
  const { signalAt } = ambushRun(p, sc => (sc.signalOn ? 'release' : 'hold'));
  assert.ok(signalAt >= 3.5 && signalAt <= 4.6, `signal after ${signalAt}s`);
});
test('a success lengthens the next wait; going too soon shortens it (never below 3 s)', () => {
  const p = makeProfile();
  ambushRun(p, sc => (sc.signalOn ? 'release' : 'hold'));
  assert.equal(p.waitSecs, 7);
  ambushRun(p, sc => (sc.heldT > 1 ? 'release' : 'hold'));
  assert.equal(p.waitSecs, 5);
  p.waitSecs = 3; ambushRun(p, sc => (sc.heldT > 1 ? 'release' : 'hold'));
  assert.equal(p.waitSecs, 3);
});
test('the wait never grows past the scene\'s designed length', () => {
  const p = makeProfile(); p.waitSecs = 40;
  const { signalAt } = ambushRun(p, sc => (sc.signalOn ? 'release' : 'hold'));
  assert.ok(signalAt <= 13.2);
});

// 2. Pack trust only ever rises
test('lashing out never lowers pack trust, and the card talks about the herd, not a falling score', () => {
  const sc = RAGE.scenarios.test[0];
  const { shell } = makeShell();
  shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
  const m = createMoment(sc, shell);
  for (let i = 0; i < 200 && m.phase !== 'live'; i++) step(shell, m, 0.05);
  m.choose('attack');
  for (let i = 0; i < 200 && !shell.card; i++) step(shell, m, 0.05);
  assert.equal(m.result.dTrust, 0);
  assert.equal(shell.stats.trustDelta, 0);
  assert.doesNotMatch(shell.card.body, /shaken/i);
  assert.match(shell.card.body, /herd|pack/i);
});

// 3. Instant acknowledgement for a real-world mission
test('logging a mission gets an instant line from Scar naming the tool used', () => {
  assert.match(missionAck(RAGE), /Long Exhale/);
  assert.match(missionAck(CHAPTERS.find(c => c.n === 6)), /tool/i);
});

// 4. Warnings before the rest, and a calm close to every session
test('session reports time remaining', () => {
  const s = createSession({ settings: { sessionMinutes: 15 } });
  s.tick(12 * 60000);
  assert.equal(s.remaining(), 3 * 60000);
});
function legRunner({ remainingRef, profile } = {}) {
  const p = profile || makeProfile();
  const { shell, fi } = makeShell({ profile: p });
  let summary = null;
  const runner = createRunner({ profile: p, chapter: RAGE, mode: 'leg', leg: 0, shell, now: () => 0,
    session: { capReached: () => remainingRef ? remainingRef.v <= 0 : false, remaining: () => remainingRef ? remainingRef.v : Infinity },
    pickSigns: () => {}, onDone: s => { summary = s; } });
  return { p, shell, fi, runner, get summary() { return summary; } };
}
test('three- and one-minute warnings come from Scar before the rest', () => {
  const rem = { v: 10 * 60000 };
  const s = legRunner({ remainingRef: rem });
  const said = []; const say = s.shell.say; s.shell.say = (t, ...a) => { said.push(t); say(t, ...a); };
  const bot = calmBot(s.fi);
  for (let t = 0; t < 60; t += 1 / 20) {
    if (s.shell.card) { if (s.shell.T - s.shell.cardBorn > 0.75) s.shell.dismissCard(); } else bot({ shell: s.shell });
    if (t > 10) rem.v = 170000; if (t > 20) rem.v = 50000;
    s.runner.update(1 / 20); s.shell.input.beginFrame();
  }
  assert.ok(said.some(x => /three more minutes/i.test(x)), 'three-minute warning');
  assert.ok(said.some(x => /one more minute/i.test(x)), 'one-minute warning');
});
test('every session closes with a breathing round and an off-screen next step', () => {
  const s = legRunner();
  const cards = []; const show = s.shell.showCard; s.shell.showCard = c => { cards.push(c); show(c); };
  const bot = calmBot(s.fi);
  let sawWinddown = false;
  for (let t = 0; t < 900 && !s.runner.finished; t += 1 / 20) {
    if (s.shell.card) { if (s.shell.T - s.shell.cardBorn > 0.75) s.shell.dismissCard(); } else bot({ shell: s.shell });
    if (s.runner.step === 'winddown') sawWinddown = true;
    s.runner.update(1 / 20); s.shell.input.beginFrame();
  }
  assert.ok(sawWinddown);
  assert.match(cards[cards.length - 1].body, /next step/i);
});
test('the closing breathing round never traps a child who does nothing', () => {
  const s = legRunner();
  const bot = calmBot(s.fi);
  let t = 0;
  for (; t < 900 && !s.runner.finished; t += 1 / 20) {
    if (s.shell.card) { if (s.shell.T - s.shell.cardBorn > 0.75) s.shell.dismissCard(); }
    else if (s.runner.step !== 'winddown') bot({ shell: s.shell });
    s.runner.update(1 / 20); s.shell.input.beginFrame();
  }
  assert.equal(s.runner.finished, true);
});

// 5. Separate intensity controls, moderate by default, effects fade while calming
function shellWith(settings, audio) {
  const p = makeProfile(); Object.assign(p.settings, settings);
  return makeShell({ profile: p, audio }).shell;
}
test('feel settings default to moderate', () => {
  const s = newProfile().settings;
  assert.equal(s.feelSound, 'soft'); assert.equal(s.feelRed, 'soft'); assert.equal(s.feelShake, 'soft');
});
test('screen shake follows its own setting', () => {
  for (const [v, want] of [['off', 0], ['soft', 0.2], ['full', 0.4]]) {
    const sh = shellWith({ feelShake: v }); sh.noteTrigger(); assert.equal(sh.shake, want, v);
  }
  const rm = shellWith({ feelShake: 'full', reducedMotion: true }); rm.noteTrigger(); assert.equal(rm.shake, 0);
});
test('red edges follow their own setting and fade while a tool is in use', () => {
  const sh = shellWith({ feelRed: 'full' });
  sh.setStage({ instincts: ['rage'], tools: ['longExhale'] });
  sh.meters.get('rage').set(0.8);
  const a = sh.redAlpha();
  assert.ok(a > 0);
  sh.activeTool = 'longExhale';
  assert.ok(sh.redAlpha() < a * 0.5);
  const off = shellWith({ feelRed: 'off' }); off.setStage({ instincts: ['rage'], tools: ['longExhale'] }); off.meters.get('rage').set(0.8);
  assert.equal(off.redAlpha(), 0);
});
test('heartbeat and growl follow their own setting and soften while a tool is in use', () => {
  const growl = []; const audio = { ...silentAudio, SFX: silentAudio.SFX, setGrowl: v => growl.push(v), vibrate() {}, toggleMute() {}, isMuted: () => false };
  const sh = shellWith({ feelSound: 'full' }, audio);
  sh.setStage({ instincts: ['rage'], tools: ['longExhale'] });
  sh.meters.get('rage').set(0.8);
  sh.update(0.05); const loud = growl.at(-1);
  sh.activeTool = 'longExhale'; sh.update(0.05); const calm = growl.at(-1);
  assert.ok(loud > 0 && calm < loud * 0.5);
  const off = shellWith({ feelSound: 'off' }, audio); off.setStage({ instincts: ['rage'], tools: ['longExhale'] }); off.meters.get('rage').set(0.8);
  off.update(0.05); assert.equal(growl.at(-1), 0);
});

// 6. Strengths paired with costs; no taming, no superpowers
function strings(o, out = []) { if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(x => strings(x, out)); else if (o && typeof o === 'object') Object.values(o).forEach(v => strings(v, out)); return out; }
test('copy never says superpower or tame, and every "gift" comes with its cost', () => {
  for (const s of strings(CHAPTERS)) {
    assert.doesNotMatch(s, /superpower/i, s);
    assert.doesNotMatch(s, /\btam(e|ed|es|ing)\b/i, s);
    if (/gift/i.test(s)) assert.match(s, /\b(but|tiring|exhausting|hard|swamp|cost)/i, `gift without its cost: ${s}`);
  }
});

// 7. Grown-ups add what they notice to each instinct's signs
test('profiles have parent-noticed signs, and they appear on the plan card', () => {
  const p = newProfile();
  assert.deepEqual(p.parentSigns.rage, []);
  p.signs.rage = ['Hot face', 'Loud voice', 'Tight chest']; p.parentSigns.rage = ['Goes quiet', 'Stomps'];
  const steps = planSteps(p, RAGE);
  assert.match(steps[0].lines.join('\n'), /Grown-ups notice: Goes quiet, Stomps/);
});
