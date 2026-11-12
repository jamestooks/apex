// Pointer + keyboard input. Buttons are re-registered every frame by whoever draws them.
import { inR } from './canvas.js';

const KEY_NAMES = { ' ': 'Space', Enter: 'Enter', Escape: 'Escape' };
// Typing in a text box (names, Den answers, Grown-ups) must never trigger game keys.
const editable = t => !!(t && t.matches && t.matches('input, textarea, select, [contenteditable], [contenteditable] *'));

export function createInput({ el, keyTarget, toLogical }) {
  const input = {
    pointers: new Map(), keys: new Set(), buttons: [], taps: [], drag: null,
    onDown: null, onKey: null,
    beginFrame() { input.buttons = []; input.taps = []; },
    addButton(b) { input.buttons.push(b); return b; },
    held(rect, keyName) {
      if (keyName && input.keys.has(keyName)) return true;
      if (!rect) return false;
      for (const p of input.pointers.values()) if (inR(p, rect)) return true;
      return false;
    },
    anyPointer() { return input.pointers.size > 0; },
    clearAll() { input.pointers.clear(); input.keys.clear(); input.drag = null; },
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    const p = toLogical(e.clientX, e.clientY);
    input.pointers.set(e.pointerId, p);
    try { el.setPointerCapture && el.setPointerCapture(e.pointerId); } catch (_) {}
    input.drag = { active: true, id: e.pointerId, x: p.x, y: p.y, startX: p.x, startY: p.y, released: false };
    if (input.onDown && input.onDown(p)) { input.pointers.delete(e.pointerId); input.drag = null; return; }
    for (let i = input.buttons.length - 1; i >= 0; i--) {
      const b = input.buttons[i];
      if (inR(p, b)) { if (!b.hold) input.pointers.delete(e.pointerId); input.drag = null; b.cb && b.cb(p); return; }
    }
    input.taps.push({ x: p.x, y: p.y });
  });
  el.addEventListener('pointermove', e => {
    if (!input.pointers.has(e.pointerId)) return;
    const p = toLogical(e.clientX, e.clientY);
    input.pointers.set(e.pointerId, p);
    if (input.drag && input.drag.id === e.pointerId) { input.drag.x = p.x; input.drag.y = p.y; }
  });
  const up = e => {
    input.pointers.delete(e.pointerId);
    if (input.drag && input.drag.id === e.pointerId) { input.drag.active = false; input.drag.released = true; }
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('contextmenu', e => e.preventDefault && e.preventDefault());
  keyTarget.addEventListener('keydown', e => {
    if (editable(e.target)) return;
    const name = KEY_NAMES[e.key] || e.key;
    if (name === 'Space') e.preventDefault();
    if (e.repeat) return;
    input.keys.add(name);
    if (input.onKey) input.onKey(name);
  });
  keyTarget.addEventListener('keyup', e => input.keys.delete(KEY_NAMES[e.key] || e.key));
  return input;
}
