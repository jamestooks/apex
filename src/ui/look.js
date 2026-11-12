// The raptor's look: a live preview, the dressing room in the Den, and the season journey on the valley screen.
import { h } from './dom.js';
import { withContext } from '../engine/canvas.js';
import { drawRaptor } from '../art/raptor.js';
import { appearance } from '../model/progress.js';
import { SLOTS, COSMETICS, isUnlocked, lockHint, equip, newUnlocks } from '../model/cosmetics.js';
import { journeyStops } from '../model/journey.js';
import { THEMES } from '../art/world.js';

export function raptorPreview(p, { w = 300, hgt = 150, scale = 2.4, bare = false } = {}) {
  const c = h('canvas', { class: 'raptor-preview', width: w * 2, height: hgt * 2, style: { width: w + 'px', height: hgt + 'px' } });
  c.redraw = () => {
    const x = c.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0);
    withContext(x, hgt, () => {
      x.clearRect(0, 0, w, hgt);
      if (!bare) {
        const g = x.createLinearGradient(0, 0, 0, hgt); g.addColorStop(0, '#2a1230'); g.addColorStop(1, '#6d2747');
        x.fillStyle = g; x.fillRect(0, 0, w, hgt);
        x.fillStyle = '#130810'; x.fillRect(0, hgt - 18, w, 18);
      }
      const ap = appearance(p);
      drawRaptor(w / 2 + 10, bare ? hgt - 2 : hgt - 16, scale, 'stand', 1.3, 1, { rim: ap.rim, feathers: ap.feathers, scars: ap.scars, look: ap.look, eye: ap.look.eye });
    });
  };
  c.redraw();
  return c;
}

const swatch = col => h('span', { class: 'look-swatch', style: { background: col } });

// The Den's "Your raptor" section. `fresh` = ids unlocked since last visit (shown as NEW).
export function dressingRoom(app, p, fresh) {
  let slot = 'rim';
  const preview = raptorPreview(p);
  const tabs = h('div', { class: 'tabs' });
  const grid = h('div', { class: 'look-grid' });
  const freshIds = new Set(fresh.map(c => c.id));
  function render() {
    tabs.replaceChildren(...SLOTS.map(s => h('button', { class: s.id === slot ? 'on' : '', 'data-slot': s.id, onClick: () => { slot = s.id; render(); } }, s.name)));
    const worn = (p.look || {})[slot];
    grid.replaceChildren(...COSMETICS.filter(c => c.slot === slot).map(c => {
      const open = isUnlocked(p, c), on = worn === c.id;
      return h('button', { class: 'tile look-item' + (on ? ' on' : '') + (open ? '' : ' locked'), 'data-look': c.id, disabled: !open,
        onClick: () => { app.store.updateProfile(p.id, q => equip(q, c.id)); app.audio.SFX.click(); preview.redraw(); render(); } },
        (c.slot === 'rim' || c.slot === 'eye') ? swatch(c.value) : null,
        h('span', { class: 'look-text' }, c.name, open ? null : h('small', {}, lockHint(p, c))),
        freshIds.has(c.id) ? h('span', { class: 'look-new' }, 'NEW') : null);
    }));
  }
  render();
  return h('div', { class: 'card', id: 'dressing-room' }, h('h3', {}, 'Your raptor'), preview,
    h('p', { class: 'small' }, 'Finish chapters for big items. Catch it early for smaller ones. Outside missions earn the best.'), tabs, grid);
}

export function newUnlockNotice(fresh) {
  if (!fresh.length) return null;
  return h('div', { class: 'card look-notice', id: 'new-unlocks' }, h('h3', { style: { color: '#86efac' } }, 'New for your raptor'),
    h('p', {}, fresh.map(c => c.name).join(', ')),
    h('button', { class: 'ghost', onClick: () => document.getElementById('dressing-room').scrollIntoView({ behavior: 'smooth' }) }, 'Try them on'));
}

// The season path across the top of the valley screen.
export function journeyStrip(p) {
  const stops = journeyStops(p);
  return h('div', { class: 'journey', id: 'journey' },
    h('div', { class: 'journey-line' }),
    ...stops.map(s => h('div', { class: 'journey-stop ' + s.state, 'data-stop': s.n },
      h('span', { class: 'journey-dot', style: { '--season': (THEMES[s.theme].sky[2]) } }, s.state === 'done' ? '✓' : s.n),
      s.state === 'current' ? raptorPreview(p, { w: 64, hgt: 36, scale: 0.55, bare: true }) : null,
      h('span', { class: 'journey-season' }, s.season.replace(' season', '')),
      h('span', { class: 'journey-unlock' + (s.unlockOwned ? ' owned' : '') }, s.unlock.name))));
}
