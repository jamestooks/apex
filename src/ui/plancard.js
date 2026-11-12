// The plan card: one per chapter, made from the child's own signs. Printable for the fridge or school bag.
import { h, mount } from './dom.js';
import { chapterByN } from '../data/chapters/index.js';

export function planSteps(profile, ch) {
  const signs = ch.instinct === 'all' ? [] : (profile.signs[ch.instinct] || []);
  return ch.den.planSteps.map(s => ({ ...s, lines: s.lines.map(l => l.replace('{signsList}', signs.map((x, i) => `${i + 1}. ${x}`).join('\n') || 'Pick your signs in the game.')) }));
}
export function planCardEl(profile, ch) {
  return h('div', { class: 'plan' },
    h('div', { class: 'row', style: { alignItems: 'center' } }, h('h2', { style: { flex: 'none' } }, ch.den.planTitle), h('span', { class: 'small', style: { textAlign: 'right' } }, `${profile.childName} · ${profile.raptorName}`)),
    ...planSteps(profile, ch).map((s, i) => h('div', { class: 'step' },
      h('div', { class: 'dot', style: { background: s.col } }, i + 1),
      h('div', {}, h('h3', { style: { color: s.col } }, s.head), h('p', {}, s.lines.join('\n'))))),
    h('hr', { style: { border: 0, borderTop: '1px solid #2a1a1f', width: '100%' } }),
    h('div', { class: 'small', style: { textTransform: 'uppercase' } }, 'For grown-ups'),
    h('p', { class: 'scar' }, `Try "${ch.den.phrase}" in the moment. Do the tool with them.`));
}
export function showPlanCard(app, profile, n, back) {
  const ch = chapterByN(n);
  mount(h('div', { class: 'screen solid' },
    planCardEl(profile, ch),
    h('p', { class: 'small no-print', style: { textAlign: 'center' } }, 'Print it or screenshot it for the fridge.'),
    h('div', { class: 'row no-print' },
      h('button', { class: 'ghost', onClick: back }, 'Back'),
      h('button', { id: 'print-plan', onClick: () => window.print() }, 'Print'))));
}
