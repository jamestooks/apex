import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../../src/store.js';
import { rankFor, chapterOpen, nextLeg, completeLeg, appearance, trophies, recordSession } from '../../src/model/progress.js';
import { memStorage } from './helpers.js';

const fresh = () => createStore(memStorage()).addProfile({ childName: 'A' });

test('ranks follow trust thresholds', () => {
  assert.equal(rankFor(0).name, 'Hatchling');
  assert.equal(rankFor(7).name, 'Hunter');
  assert.equal(rankFor(30).name, 'Apex');
  assert.equal(rankFor(-4).name, 'Hatchling');
  assert.equal(rankFor(2, true).name, 'Apex');
});

test('chapter 2 is closed until chapter 1 is done unless opened by a grown-up', () => {
  const p = fresh();
  assert.equal(chapterOpen(p, 1), true);
  assert.equal(chapterOpen(p, 2), false);
  p.settings.chaptersOpen = [1, 2];
  assert.equal(chapterOpen(p, 2), true);
  p.settings.chaptersOpen = null;
  completeLeg(p, 1, 0); completeLeg(p, 1, 1);
  assert.equal(chapterOpen(p, 2), true);
});

test('legs advance 0 → 1 → done', () => {
  const p = fresh();
  assert.equal(nextLeg(p, 1), 0);
  completeLeg(p, 1, 0);
  assert.equal(nextLeg(p, 1), 1);
  completeLeg(p, 1, 1);
  assert.equal(nextLeg(p, 1), 'done');
  assert.equal(p.chapters[1].done, true);
});

test('appearance grows with chapters done', () => {
  const p = fresh();
  for (const n of [1, 2]) { completeLeg(p, n, 0); completeLeg(p, n, 1); }
  p.scars = 5;
  const a = appearance(p);
  assert.equal(+a.scale.toFixed(2), 1.12);
  assert.equal(a.feathers, 8);
  assert.equal(a.scars, 3);
});

test('trophies list only confirmed missions', () => {
  const p = fresh();
  p.missions[1] = 'confirmed'; p.missions[2] = 'done-told';
  const t = trophies(p);
  assert.equal(t.length, 1);
  assert.equal(t[0].chapter, 1);
  assert.equal(t[0].name, 'Fossil');
});

test('recordSession accumulates trust and keeps history', () => {
  const p = fresh();
  recordSession(p, { chapter: 1, trustDelta: 2, minutes: 6, injured: true, mealsKept: 1, date: '2026-11-12' });
  assert.equal(p.trust, 2);
  assert.equal(p.scars, 1);
  assert.equal(p.mealsKept, 1);
  assert.equal(p.sessions.length, 1);
});
