import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, makeProfile } from '../sim/harness.js';
import { cardSpeech } from '../../src/engine/scene.js';

function voiceSpy(dur = 6) {
  const calls = [];
  return { calls, speak: (who, text, names) => { calls.push({ who, text, names }); return dur; }, stop: () => calls.push('stop'), enabled: () => true };
}

test("Scar's lines are spoken in his voice, and the speech box stays up until he finishes", () => {
  const v = voiceSpy(7.5);
  const p = makeProfile(); p.signs.rage = ['Hot face', 'Loud voice', 'Tight chest'];
  const { shell } = makeShell({ profile: p, voice: v });
  shell.say('Good. Feel it drop?', 3, 1, 'scar');
  assert.equal(v.calls[0].who, 'scar');
  assert.equal(v.calls[0].text, 'Good. Feel it drop?');
  assert.ok(v.calls[0].names.includes('Hot face') && v.calls[0].names.includes(p.raptorName));
  assert.ok(shell.msgT >= 7.5);
});

test('a line that is not shown (lower priority) is not spoken either', () => {
  const v = voiceSpy();
  const { shell } = makeShell({ voice: v });
  shell.say('Important.', 5, 3, 'narr');
  shell.say('Less important.', 3, 0, 'scar');
  assert.equal(v.calls.filter(c => c.text).length, 1);
});

test('cards are read aloud: the story line by the narrator, Scar\'s words by the mentor; dismissing stops the voice', () => {
  const v = voiceSpy(2);
  const { shell } = makeShell({ voice: v });
  shell.showCard({ title: 'YOU STOOD TALL', sub: 'Fang backs off.', body: '"You kept your head."\n\nPack trust: rising' });
  const spoken = v.calls.filter(c => c.text);
  assert.deepEqual(spoken.map(c => c.who), ['narr', 'scar', 'narr']);
  shell.cardBorn = -9; shell.dismissCard();
  assert.equal(v.calls.at(-1), 'stop');
});

test('cards titled with a mentor are read in that mentor\'s voice', () => {
  const parts = cardSpeech({ title: 'ECHO', sub: "The pack's tracker", body: 'Your senses never switch off.' }, 'scar');
  assert.deepEqual(parts.map(p => p.who), ['narr', 'echo']);
});

test('pausing stops the voice', () => {
  const v = voiceSpy();
  const { shell } = makeShell({ voice: v });
  shell.say('Hello.', 3, 1, 'scar');
  shell.pause();
  assert.ok(v.calls.includes('stop'));
});
