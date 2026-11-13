import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, sentences, keyFor, pieces, recordPieces } from '../../src/engine/speech-text.js';

test('normalize strips quotes and squashes spaces', () => {
  assert.equal(normalize('  "You kept your head.  Remember   how that felt."  '), 'You kept your head. Remember how that felt.');
  assert.equal(normalize('“Curly”'), 'Curly');
});

test('sentences split on full stops, question marks, exclamations and line breaks', () => {
  assert.deepEqual(sentences('Rage isn\'t bad. It tells you something matters!\n\nTonight I\'ll teach you. Ready?'),
    ["Rage isn't bad.", 'It tells you something matters!', "Tonight I'll teach you.", 'Ready?']);
});

test('keys are stable, short, and depend on the speaker', () => {
  const a = keyFor('scar', 'Good. Feel it drop?'), b = keyFor('scar', ' "Good.  Feel it drop?" '), c = keyFor('echo', 'Good. Feel it drop?');
  assert.equal(a, b); assert.notEqual(a, c); assert.match(a, /^[a-z0-9]{4,10}$/);
});

test('pieces: a whole sentence with a clip is used as is', () => {
  const has = new Set([keyFor('scar', 'There.')]);
  assert.deepEqual(pieces('scar', 'There.', ['Hot face'], k => has.has(k)), [{ text: 'There.', clip: true }]);
});

test('pieces: a sentence with no clip is split around the child\'s signs and names', () => {
  const lines = ['Your signs were there:', 'Hot face', ', then', 'Loud voice', '.'];
  const has = new Set(['Your signs were there:', 'Hot face', ', then', 'Loud voice'].map(t => keyFor('scar', t)));
  const out = pieces('scar', 'Your signs were there: Hot face, then Loud voice.', ['Hot face', 'Loud voice', 'Blaze'], k => has.has(k));
  assert.deepEqual(out.map(p => p.text), ['Your signs were there:', 'Hot face', ', then', 'Loud voice']);
  assert.ok(out.every(p => p.clip));
});

test('pieces: a typed name with no clip is marked for the device voice', () => {
  const has = new Set(['You are', ', the youngest hunter in the pack.'].map(t => keyFor('narr', t)));
  const out = pieces('narr', 'You are Blaze, the youngest hunter in the pack.', ['Blaze'], k => has.has(k));
  assert.deepEqual(out, [{ text: 'You are', clip: true }, { text: 'Blaze', clip: false }, { text: ', the youngest hunter in the pack.', clip: true }]);
});

test('pieces: signs match whatever their case in the sentence', () => {
  const has = new Set(['When did you feel', 'hot face', 'this week?'].map(t => keyFor('scar', t)));
  const out = pieces('scar', 'When did you feel hot face this week?', ['Hot face'], k => has.has(k));
  assert.deepEqual(out.map(p => p.text), ['When did you feel', 'hot face', 'this week?']);
});

test('names only match whole words (a raptor called Ash never splits "crash")', () => {
  const out = pieces('scar', 'Old Scar crashes out of the ferns.', ['Ash', 'Test'], () => false);
  assert.deepEqual(out.map(p => p.text), ['Old Scar crashes out of the ferns.']);
  assert.deepEqual(recordPieces('the greatest hunter', ['Test']), ['the greatest hunter']);
});
