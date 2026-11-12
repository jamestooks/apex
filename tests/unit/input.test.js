import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../../src/engine/input.js';

function ev(type, props) { const e = new Event(type); Object.assign(e, props); e.preventDefault = () => {}; return e; }
function setup() {
  const el = new EventTarget(), keys = new EventTarget();
  const input = createInput({ el, keyTarget: keys, toLogical: (x, y) => ({ x, y }) });
  return { el, keys, input };
}
const R = { x: 10, y: 10, w: 50, h: 50 };

test('held(rect) is true while a pointer is inside and false after pointerup', () => {
  const { el, input } = setup();
  el.dispatchEvent(ev('pointerdown', { pointerId: 1, clientX: 20, clientY: 20 }));
  assert.equal(input.held(R), true);
  el.dispatchEvent(ev('pointerup', { pointerId: 1 }));
  assert.equal(input.held(R), false);
});

test('held(rect, Space) is true while the key is held', () => {
  const { keys, input } = setup();
  keys.dispatchEvent(ev('keydown', { key: ' ', code: 'Space' }));
  assert.equal(input.held(R, 'Space'), true);
  keys.dispatchEvent(ev('keyup', { key: ' ', code: 'Space' }));
  assert.equal(input.held(R, 'Space'), false);
});

test('a button consumes its tap so taps stays empty', () => {
  const { el, input } = setup();
  let hit = 0;
  input.beginFrame();
  input.addButton({ ...R, cb: () => hit++ });
  el.dispatchEvent(ev('pointerdown', { pointerId: 2, clientX: 20, clientY: 20 }));
  assert.equal(hit, 1);
  assert.deepEqual(input.taps, []);
});

test('an unconsumed pointerdown is recorded as a tap until the next frame', () => {
  const { el, input } = setup();
  input.beginFrame();
  el.dispatchEvent(ev('pointerdown', { pointerId: 3, clientX: 200, clientY: 200 }));
  assert.deepEqual(input.taps, [{ x: 200, y: 200 }]);
  input.beginFrame();
  assert.deepEqual(input.taps, []);
});

test('clearAll empties pointers and keys', () => {
  const { el, keys, input } = setup();
  el.dispatchEvent(ev('pointerdown', { pointerId: 1, clientX: 20, clientY: 20 }));
  keys.dispatchEvent(ev('keydown', { key: ' ', code: 'Space' }));
  input.clearAll();
  assert.equal(input.pointers.size, 0);
  assert.equal(input.held(R, 'Space'), false);
});

test('drag tracks a pointer from down to move', () => {
  const { el, input } = setup();
  el.dispatchEvent(ev('pointerdown', { pointerId: 4, clientX: 5, clientY: 5 }));
  el.dispatchEvent(ev('pointermove', { pointerId: 4, clientX: 40, clientY: 30 }));
  assert.equal(input.drag.active, true);
  assert.equal(input.drag.x, 40); assert.equal(input.drag.startX, 5);
});
