import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Meter, MeterSet, SIGN_T, LOCK, SPIKE_CAP } from '../../src/engine/meter.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);
const signs = ['Hot face', 'Clenched fists', 'Tight chest'];

test('constants match the prototype', () => {
  assert.deepEqual(SIGN_T, [0.3, 0.55, 0.8]); assert.equal(LOCK, 0.7); assert.equal(SPIKE_CAP, 0.92);
});
test('a spike never fills the meter', () => {
  const m = new Meter('rage', signs); m.value = 0.6; m.spike(0.5);
  near(m.value, 0.92); assert.equal(m.full, false);
});
test('a spike never lowers the meter', () => {
  const m = new Meter('rage', signs); m.value = 0.95; m.spike(0.1);
  near(m.value, 0.95);
});
test('simmer can fill the meter', () => {
  const m = new Meter('rage', signs); m.value = 0.95; m.simmer(0.1, 1);
  assert.equal(m.value, 1); assert.equal(m.full, true);
});
test('crossings reports each upward sign crossing once', () => {
  const m = new Meter('rage', signs); m.value = 0.2; m.crossings();
  m.value = 0.35; assert.deepEqual(m.crossings(), [0]); assert.deepEqual(m.crossings(), []);
  m.value = 0.9; assert.deepEqual(m.crossings(), [1, 2]);
});
test('locked at the lock line, lit counts signs', () => {
  const m = new Meter('rage', signs); m.value = 0.69; assert.equal(m.locked, false);
  m.value = 0.7; assert.equal(m.locked, true); assert.equal(m.lit, 2);
});
test('adapt slows simmer to 0.6x', () => {
  const m = new Meter('rage', signs); m.adapt(); m.simmer(0.1, 1); near(m.value, 0.06);
});
test('peak tracks the highest value', () => {
  const m = new Meter('rage', signs); m.spike(0.5); m.relieve(0.3); assert.equal(m.peak, 0.5);
});
test('MeterSet relief: full on the matching meter, quarter on the others', () => {
  const r = new Meter('rage', signs), o = new Meter('overload', signs);
  r.value = 0.8; o.value = 0.8;
  const set = new MeterSet([r, o]);
  set.relieve('rage', 0.4);
  near(r.value, 0.4); near(o.value, 0.7);
  assert.equal(r.firstToolAt, 0.8);
});
test('MeterSet relief for an instinct not in the scene still helps at a quarter', () => {
  const r = new Meter('rage', signs); r.value = 0.5;
  new MeterSet([r]).relieve('drift', 0.4);
  near(r.value, 0.4);
});
