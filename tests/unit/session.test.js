import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, restRemaining, startRest } from '../../src/model/session.js';

const MIN = 60000;
test('the cap counts play time only, reached at 15 minutes by default', () => {
  const s = createSession({ settings: { sessionMinutes: 15 } });
  s.tick(15 * MIN - 1000); assert.equal(s.capReached(), false);
  s.tick(1000); assert.equal(s.capReached(), true);
});
test('time spent off the play screen does not count', () => {
  const s = createSession({ settings: { sessionMinutes: 15 } });
  s.tick(5 * MIN);
  // 20 minutes on the valley screen: no ticks
  assert.equal(s.capReached(), false);
  assert.equal(s.minutes(), 5);
});
test('cap honours sessionMinutes', () => {
  const s = createSession({ settings: { sessionMinutes: 10 } });
  s.tick(10 * MIN); assert.equal(s.capReached(), true);
});
test('rest counts down after startRest', () => {
  const p = { restUntil: 0 };
  assert.equal(restRemaining(p, 1000), 0);
  startRest(p, 1000);
  assert.equal(restRemaining(p, 1000), 60 * MIN);
  assert.equal(restRemaining(p, 1000 + 61 * MIN), 0);
});
