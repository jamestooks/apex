// Pick 3 warning signs, in the order they usually happen. "His body, not the raptor's."
import { h, mount } from './dom.js';
import { signOptionsFor, SIGN_QUESTION } from '../data/signs.js';
import { INSTINCTS } from '../engine/meter.js';

export function showSigns(app, profile, instinct, { onDone, onBack } = {}) {
  const chosen = [...(profile.signs[instinct] || [])].slice(0, 3);
  const opts = signOptionsFor(profile, instinct);
  const grid = h('div', { class: 'grid2' });
  const order = h('p', { class: 'scar', style: { textAlign: 'center', fontSize: '0.95rem' } });
  const btn = h('button', { id: 'signs-done', onClick: () => { if (chosen.length === 3) { app.store.updateProfile(profile.id, p => { p.signs[instinct] = chosen.slice(); }); onDone && onDone(); } } });
  function render() {
    grid.replaceChildren(...opts.map(s => {
      const i = chosen.indexOf(s);
      return h('button', { class: 'tile' + (i >= 0 ? ' on' : ''), 'data-sign': s, onClick: () => { if (i >= 0) chosen.splice(i, 1); else if (chosen.length < 3) chosen.push(s); app.audio.SFX.click(); render(); } },
        s.toUpperCase(), i >= 0 ? h('span', { class: 'num' }, i + 1) : null);
    }));
    order.textContent = chosen.length ? chosen.join('  →  ') : '1st sign  →  2nd  →  3rd';
    btn.disabled = chosen.length !== 3;
    btn.textContent = chosen.length === 3 ? 'THESE ARE MINE' : `PICK ${3 - chosen.length} MORE`;
  }
  render();
  mount(h('div', { class: 'screen solid' },
    h('h2', {}, `Your ${INSTINCTS[instinct].name.toLowerCase().replace('the urge', 'urge')} signs`),
    h('p', { class: 'scar' }, `"${SIGN_QUESTION[instinct]}"`),
    h('p', { class: 'muted' }, 'Pick 3, in the order they usually happen to you.'),
    grid, order, btn,
    onBack ? h('button', { class: 'quiet', onClick: onBack }, 'Back') : null));
}
