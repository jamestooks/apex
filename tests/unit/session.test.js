import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, restRemaining, startRest } from '../../src/model/session.js';

const MIN = 60000;
test('cap is reached at 15 minutes by default', () => {
  const p = { settings: { sessionMinutes: 15 } };
  const s = createSession(p, 0);
  assert.equal(s.capReached(15 * MIN - 1000), false);
  assert.equal(s.capReached(15 * MIN), true);
});
test('cap honours sessionMinutes', () => {
  const s = createSession({ settings: { sessionMinutes: 10 } }, 0);
  assert.equal(s.capReached(10 * MIN), true);
});
test('rest counts down after startRest', () => {
  const p = { restUntil: 0 };
  assert.equal(restRemaining(p, 1000), 0);
  startRest(p, 1000);
  assert.equal(restRemaining(p, 1000), 60 * MIN);
  assert.equal(restRemaining(p, 1000 + 61 * MIN), 0);
});
