// Plays the whole game, every chapter and both legs, with five play styles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile } from './harness.js';
import { makeBot } from './bots.js';
import { createRunner } from '../../src/play/runner.js';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { Meter, SPIKE_CAP } from '../../src/engine/meter.js';

const CARD_READ_SECS = 5;
const spikeViolations = [];
const origSpike = Meter.prototype.spike;
Meter.prototype.spike = function (a) { const before = this.value; origSpike.call(this, a); if (this.value > SPIKE_CAP + 1e-9 && before < SPIKE_CAP) spikeViolations.push(this.instinct); };

async function playWholeGame(policy) {
  const profile = makeProfile({ chapters: {}, toolbelt: [] });
  for (const k of Object.keys(profile.signs)) profile.signs[k] = [];
  const legs = [];
  for (const ch of CHAPTERS) for (const leg of [0, 1]) {
    const { shell, fi } = makeShell({ profile, theme: ch.theme });
    const cards = [];
    const show = shell.showCard; shell.showCard = c => { cards.push(c); show(c); };
    let summary = null;
    const runner = createRunner({ profile, chapter: ch, mode: 'leg', leg, shell, now: () => 0, session: { capReached: () => false },
      pickSigns: inst => { profile.signs[inst] = ['First', 'Second', 'Third']; }, onDone: s => { summary = s; } });
    const bot = makeBot(policy, fi);
    let t = 0;
    while (!runner.finished && t < 1800) {
      if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
      else bot({ shell, runner });
      runner.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
      if (runner.waiting) await null;
    }
    legs.push({ ch: ch.n, leg, finished: runner.finished, secs: t + cards.length * CARD_READ_SECS, cards, results: runner.results, summary, step: runner.step });
  }
  return { profile, legs };
}

const POLICIES = ['calm', 'lazy', 'neverAct', 'alwaysInstinct', 'learns'];
const runs = {};
for (const p of POLICIES) runs[p] = null;
const get = p => (runs[p] ||= playWholeGame(p));

for (const p of POLICIES) {
  test(`${p}: every leg of every chapter finishes (no soft-locks)`, async () => {
    for (const l of (await get(p)).legs) assert.ok(l.finished, `chapter ${l.ch} leg ${l.leg} stuck at step ${l.step}`);
  });
}

test('calm play earns trust in at least 80% of scenes', async () => {
  const all = (await get('calm')).legs.flatMap(l => l.results);
  const earned = all.filter(r => r.dTrust > 0).length;
  assert.ok(earned / all.length >= 0.8, `${earned} of ${all.length}`);
});

test('calm play reaches Apex', async () => {
  assert.equal((await get('calm')).profile.finaleCalm, true);
});

test('a player who never acts is always told what to try next', async () => {
  for (const l of (await get('neverAct')).legs) for (const c of l.cards) if (c.bad) assert.match(c.body, /next time/i, `${c.title}: ${c.body}`);
});

test('no single trigger ever fills a meter', async () => {
  for (const p of POLICIES) await get(p);
  assert.deepEqual(spikeViolations, []);
});

// A bot plays 2-3x faster than a child, so this is a regression guard, not a measure of real session length.
test('every calm leg takes between 25 seconds and 10 minutes of bot play (cards included)', async () => {
  for (const l of (await get('calm')).legs) {
    assert.ok(l.secs >= 25 && l.secs <= 600, `chapter ${l.ch} leg ${l.leg}: ${l.secs.toFixed(0)} s`);
  }
});
