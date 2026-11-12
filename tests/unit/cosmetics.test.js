import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COSMETICS, SLOTS, isUnlocked, lockHint, equip, newUnlocks, markSeen, lookOf } from '../../src/model/cosmetics.js';
import { journeyStops } from '../../src/model/journey.js';
import { newProfile, createStore } from '../../src/store.js';
import { recordSession, completeLeg, appearance } from '../../src/model/progress.js';
import { memStorage } from './helpers.js';

const byUnlock = type => COSMETICS.filter(c => c.unlock.type === type);

test('every slot has free starter options and something to unlock', () => {
  for (const s of SLOTS) {
    assert.ok(COSMETICS.some(c => c.slot === s.id && c.unlock.type === 'start'), `${s.id} starter`);
    assert.ok(COSMETICS.some(c => c.slot === s.id && c.unlock.type !== 'start'), `${s.id} unlockable`);
  }
  assert.ok(byUnlock('chapter').length === 6 && byUnlock('mission').length === 6 && byUnlock('calm').length >= 5);
  assert.equal(new Set(COSMETICS.map(c => c.id)).size, COSMETICS.length, 'unique ids');
});

test('finishing a chapter unlocks its big item', () => {
  const p = newProfile();
  const item = byUnlock('chapter').find(c => c.unlock.chapter === 3);
  assert.equal(isUnlocked(p, item), false);
  completeLeg(p, 3, 0); completeLeg(p, 3, 1);
  assert.equal(isUnlocked(p, item), true);
});

test('calm play unlocks smaller items as early catches add up', () => {
  const p = newProfile();
  const first = byUnlock('calm').sort((a, b) => a.unlock.count - b.unlock.count)[0];
  recordSession(p, { chapter: 1, early: first.unlock.count - 1, earlyOf: 3 });
  assert.equal(isUnlocked(p, first), false);
  assert.match(lockHint(p, first), new RegExp(`${first.unlock.count - 1} so far`));
  recordSession(p, { chapter: 1, early: 1, earlyOf: 3 });
  assert.equal(p.calmCount, first.unlock.count);
  assert.equal(isUnlocked(p, first), true);
});

test('real-world missions unlock the best items, only once a grown-up confirms', () => {
  const p = newProfile();
  const item = byUnlock('mission').find(c => c.unlock.chapter === 2);
  p.missions[2] = 'done-told';
  assert.equal(isUnlocked(p, item), false);
  assert.match(lockHint(p, item), /outside mission/i);
  p.missions[2] = 'confirmed';
  assert.equal(isUnlocked(p, item), true);
});

test('only unlocked items can be worn; the colour stays in sync with the profile colour', () => {
  const p = newProfile();
  const locked = byUnlock('chapter')[0];
  assert.equal(equip(p, locked.id), false);
  const rim = COSMETICS.find(c => c.slot === 'rim' && c.unlock.type === 'start' && c.value !== p.rim);
  assert.equal(equip(p, rim.id), true);
  assert.equal(p.look.rim, rim.id); assert.equal(p.rim, rim.value);
  assert.equal(lookOf(p).rim, rim.value);
});

test('new unlocks are reported once, then marked seen', () => {
  const p = newProfile();
  markSeen(p);
  assert.deepEqual(newUnlocks(p), []);
  completeLeg(p, 1, 0); completeLeg(p, 1, 1);
  const fresh = newUnlocks(p);
  assert.ok(fresh.some(c => c.unlock.type === 'chapter' && c.unlock.chapter === 1));
  markSeen(p);
  assert.deepEqual(newUnlocks(p), []);
});

test('old saves gain a look built from their colour', () => {
  const s = memStorage({ 'apex.v1': JSON.stringify({ version: 1, profiles: { a: { id: 'a', childName: 'A', raptorName: 'R', rim: '#38bdf8', createdAt: 1, settings: {}, signs: {}, customSigns: {}, chapters: {}, sessions: [] } } }) });
  const p = createStore(s).getProfile('a');
  assert.equal(lookOf(p).rim, '#38bdf8');
  assert.equal(p.calmCount, 0);
  assert.ok(Array.isArray(p.seenUnlocks));
});

test('appearance carries the look for drawing', () => {
  const p = newProfile();
  completeLeg(p, 1, 0); completeLeg(p, 1, 1);
  const crest = byUnlock('chapter').find(c => c.unlock.chapter === 1);
  equip(p, crest.id);
  assert.equal(appearance(p).look[crest.slot], crest.value);
});

test('the journey shows six seasons: done, current and ahead, each with its chapter unlock', () => {
  const p = newProfile();
  completeLeg(p, 1, 0); completeLeg(p, 1, 1); completeLeg(p, 2, 0);
  const stops = journeyStops(p);
  assert.equal(stops.length, 6);
  assert.deepEqual(stops.map(s => s.state), ['done', 'current', 'ahead', 'ahead', 'ahead', 'ahead']);
  assert.equal(stops[0].season, 'Dry season');
  assert.ok(stops.every(s => s.unlock && s.unlock.name));
  assert.equal(stops[0].unlockOwned, true); assert.equal(stops[1].unlockOwned, false);
});
