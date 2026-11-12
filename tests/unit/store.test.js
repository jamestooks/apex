import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/store.js';
import { memStorage, brokenStorage } from './helpers.js';

test('profiles survive a save/load round trip', () => {
  const s = memStorage();
  const a = createStore(s);
  const p = a.addProfile({ childName: 'Sam', raptorName: 'Blaze', rim: '#38bdf8' });
  a.save();
  const b = createStore(s);
  assert.equal(b.getProfile(p.id).raptorName, 'Blaze');
  assert.equal(b.getProfile(p.id).settings.sessionMinutes, 15);
});

test('two profiles are isolated', () => {
  const st = createStore(memStorage());
  const A = st.addProfile({ childName: 'A' }), B = st.addProfile({ childName: 'B' });
  st.updateProfile(A.id, p => { p.signs.rage = ['Hot face', 'Loud voice', 'Tight chest']; p.trust = 5; });
  assert.deepEqual(st.getProfile(B.id).signs.rage, []);
  assert.equal(st.getProfile(B.id).trust, 0);
});

test('corrupt JSON gives a fresh store and keeps the raw string', () => {
  const s = memStorage({ 'apex.v1': '{"profiles":{bad' });
  const st = createStore(s);
  assert.deepEqual(st.profiles(), []);
  assert.equal(s.getItem('apex.v1.corrupt'), '{"profiles":{bad');
});

test('storage that throws marks the store non-persistent without crashing', () => {
  const st = createStore(brokenStorage());
  st.addProfile({ childName: 'A' });
  assert.doesNotThrow(() => st.save());
  assert.equal(st.persistent, false);
});

test('missing storage falls back to memory', () => {
  const st = createStore(undefined);
  st.addProfile({ childName: 'A' });
  assert.equal(st.persistent, false);
  assert.equal(st.profiles().length, 1);
});

test('PIN checks only the set PIN and is not stored in plain text', () => {
  const s = memStorage();
  const st = createStore(s);
  assert.equal(st.hasPin(), false);
  st.setPin('4821'); st.save();
  assert.equal(st.checkPin('4821'), true);
  assert.equal(st.checkPin('1111'), false);
  assert.ok(!s.getItem('apex.v1').includes('4821'));
});

test('deleteProfile clears activeId if it was active', () => {
  const st = createStore(memStorage());
  const A = st.addProfile({ childName: 'A' });
  st.setActive(A.id);
  st.deleteProfile(A.id);
  assert.equal(st.activeId, null);
  assert.equal(st.getProfile(A.id), undefined);
});

test('importJSON(exportJSON()) round-trips', () => {
  const st = createStore(memStorage());
  st.addProfile({ childName: 'A', raptorName: 'Rex' });
  const json = st.exportJSON();
  const st2 = createStore(memStorage());
  st2.importJSON(json);
  assert.equal(st2.profiles()[0].raptorName, 'Rex');
});

test('importJSON rejects junk without wiping data', () => {
  const st = createStore(memStorage());
  st.addProfile({ childName: 'A' });
  assert.throws(() => st.importJSON('not json'));
  assert.equal(st.profiles().length, 1);
});
