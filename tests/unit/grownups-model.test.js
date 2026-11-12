import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weeklyLogSummary, profileOverview } from '../../src/ui/grownups-model.js';
import { newProfile } from '../../src/store.js';

const now = new Date('2026-11-12T12:00:00Z').getTime(); // a Thursday

test('weeklyLogSummary returns 8 weeks, newest first, starting on Mondays', () => {
  const rows = weeklyLogSummary([], now);
  assert.equal(rows.length, 8);
  assert.equal(rows[0].weekStart, '2026-11-09');
  assert.equal(rows[1].weekStart, '2026-11-02');
  assert.deepEqual([rows[0].used, rows[0].unprompted, rows[0].didnt], [0, 0, 0]);
});

test('weeklyLogSummary buckets entries by week and outcome', () => {
  const log = [
    { date: '2026-11-12', outcome: 'used' }, { date: '2026-11-09', outcome: 'unprompted' },
    { date: '2026-11-08', outcome: 'didnt' }, { date: '2026-11-03', outcome: 'used' },
    { date: '2026-08-01', outcome: 'used' },
  ];
  const rows = weeklyLogSummary(log, now);
  assert.deepEqual([rows[0].used, rows[0].unprompted, rows[0].didnt], [1, 1, 0]);
  assert.deepEqual([rows[1].used, rows[1].didnt], [1, 1]);
  assert.equal(rows.reduce((a, r) => a + r.used, 0), 2, 'entries older than 8 weeks are left out');
});

test('profileOverview totals tool uses and only includes shared Den answers', () => {
  const p = newProfile({ childName: 'Sam' });
  p.sessions = [{ date: '2026-11-10', chapter: 1, minutes: 6, toolUses: { longExhale: 3 }, tookOver: 1, early: 2, earlyOf: 3 },
    { date: '2026-11-11', chapter: 1, minutes: 7, toolUses: { longExhale: 2, oneThing: 1 }, tookOver: 0, early: 3, earlyOf: 3 }];
  p.denAnswers = [{ answer: 'secret', shared: false }, { answer: 'shared one', shared: true }];
  const o = profileOverview(p);
  assert.equal(o.toolUses.longExhale, 5); assert.equal(o.toolUses.oneThing, 1);
  assert.equal(o.tookOver, 1); assert.equal(o.early, 5); assert.equal(o.earlyOf, 6);
  assert.deepEqual(o.sharedAnswers.map(a => a.answer), ['shared one']);
});
