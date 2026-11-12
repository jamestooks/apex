// The Den: where every session ends. Field notes, Scar's question, plan card, outside mission, trophies.
import { h, mount } from './dom.js';
import { CHAPTERS, chapterByN } from '../data/chapters/index.js';
import { TOOLS, TOOL_ORDER } from '../engine/tools/index.js';
import { trophies, nextLeg, chapterOpen } from '../model/progress.js';
import { showPlanCard } from './plancard.js';
import { showSigns } from './signs.js';
import { FINDS } from '../data/chapters/3-distraction.js';

function row(label, value) { return h('div', { class: 'r' }, h('span', {}, label), h('b', {}, String(value))); }

export function fieldNotes(summary, ch) {
  const st = summary.stats, rows = [];
  rows.push(['Pack trust', st.trustDelta > 0 ? 'Rising' : st.trustDelta < 0 ? 'Shaken' : 'Steady']);
  if (st.mealsKept || st.mealsLost) rows.push(['Kept your kill', st.mealsLost ? (st.mealsKept ? 'Some' : 'No') : 'Yes']);
  for (const id of TOOL_ORDER) if (st.toolUses[id]) rows.push([`${TOOLS[id].TOOL.name} used`, st.toolUses[id]]);
  if (st.earlyOf) rows.push(['Caught it early', `${st.early} of ${st.earlyOf}`]);
  rows.push([`Times ${ch.instinct === 'all' ? 'an instinct' : ch.instinct === 'urge' ? 'the urge' : ch.instinct} took over`, st.tookOver]);
  if (st.needsRepair) rows.push(['Made it right afterwards', st.repaired ? 'Yes' : 'Not yet']);
  if (st.parked && st.parked.length) rows.push(['Things you parked', st.parked.length]);
  return rows;
}
function question(p, ch) {
  const q = ch.den.questions[p.sessions.length % ch.den.questions.length];
  const s1 = ch.instinct !== 'all' && p.signs[ch.instinct] && p.signs[ch.instinct][0];
  return q.replace('{sign1}', s1 ? s1.toLowerCase() : 'your first sign').replace('{raptor}', p.raptorName);
}

export function registerDen(app) {
  app.register('den', (summary) => {
    const p = app.profile; if (!p) return app.show('profiles');
    const n = summary.chapter || Math.max(1, ...Object.keys(p.chapters).map(Number).filter(k => p.chapters[k].leg > 0 || p.chapters[k].done), 1);
    const ch = chapterByN(n) || CHAPTERS[0];
    const back = () => app.show('den', summary);
    const parts = [h('h2', {}, 'The Den')];
    if (summary.stats) {
      parts.push(h('div', { class: 'notes', id: 'field-notes' },
        h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'baseline' } }, h('h2', { style: { flex: 'none' } }, 'Field notes'), h('span', { class: 'scar', style: { color: '#7c5a3a', flex: 'none' } }, summary.mode === 'hunt' ? 'Hunt' : ch.title)),
        ...fieldNotes(summary, ch).map(([l, v]) => row(l, v)),
        ch.instinct !== 'all' ? [h('div', { class: 'lab' }, 'Your signs'), h('div', { class: 'head', style: { fontWeight: 500 } }, (p.signs[ch.instinct] || []).join('  →  '))] : null,
        summary.stats.strengths.length ? [h('div', { class: 'lab' }, 'Strength'), h('p', { class: 'scar', style: { color: '#3b2a1a' } }, ch.den.strengthLine)] : null));
      // Scar's question
      const qText = question(p, ch);
      const ans = h('textarea', { id: 'den-answer', placeholder: 'Talk it through with a grown-up, or type here if you like.' });
      const share = h('input', { type: 'checkbox', id: 'den-share' });
      const saved = h('span', { class: 'small' });
      parts.push(h('div', { class: 'card' },
        h('h3', {}, "Scar's question"), h('p', { class: 'scar' }, `"${qText}"`), ans,
        h('label', { class: 'check' }, share, 'Share my answer with grown-ups'),
        h('div', { class: 'row' }, h('button', { class: 'ghost', id: 'save-answer', onClick: () => {
          if (!ans.value.trim()) { saved.textContent = 'There are no wrong answers. Saying it out loud counts too.'; return; }
          app.store.updateProfile(p.id, q => q.denAnswers.push({ date: new Date().toISOString().slice(0, 10), chapter: n, question: qText, answer: ans.value.trim(), shared: share.checked }));
          saved.textContent = 'Saved.'; ans.value = '';
        } }, 'Save answer')), saved,
        h('p', { class: 'small' }, 'There are no wrong answers.')));
    }
    // Mission (once the chapter is done)
    for (const c of CHAPTERS) {
      if (!(p.chapters[c.n] && p.chapters[c.n].done)) continue;
      const status = p.missions[c.n] || 'none';
      if (status === 'confirmed' && !(summary.chapter === c.n)) continue;
      parts.push(h('div', { class: 'card', 'data-mission': c.n },
        h('h3', {}, `Outside mission · ${c.title}`), h('p', {}, c.den.mission),
        status === 'none' ? h('button', { class: 'sky', onClick: () => { app.store.updateProfile(p.id, q => { q.missions[c.n] = 'done-told'; }); back(); } }, "I did it! I'll tell a grown-up") :
        status === 'done-told' ? h('p', { class: 'muted' }, 'Waiting for a grown-up to confirm it in Grown-ups mode.') :
        h('p', { class: 'muted' }, 'Confirmed. Trophy earned!')));
    }
    const tr = trophies(p);
    parts.push(h('div', { class: 'card', id: 'trophies' }, h('h3', {}, 'Trophies'),
      tr.length ? h('div', { class: 'row' }, tr.map(t => h('div', { class: 'tile', style: { flex: 'none' } }, `${t.icon} ${t.name}`))) : h('p', { class: 'muted' }, 'Finish a chapter and do its outside mission to earn a trophy.')));
    if (p.parked.length) {
      const reveal = h('p', { class: 'scar', id: 'find-line' }, 'Tap a find to explore it.');
      parts.push(h('div', { class: 'card', id: 'parked-finds' }, h('h3', {}, 'Parked finds'), h('p', { class: 'muted' }, "Things you noticed and saved for later. Now's the time to explore them."),
        h('div', { class: 'row' }, p.parked.map(x => h('button', { class: 'tile', style: { flex: 'none' }, onClick: () => { reveal.textContent = FINDS[x] || 'You noticed something nobody else did.'; } }, x))), reveal));
    }
    // Plan cards + signs
    const opened = CHAPTERS.filter(c => chapterOpen(p, c.n) && (p.chapters[c.n] && (p.chapters[c.n].leg > 0 || p.chapters[c.n].done)));
    parts.push(h('div', { class: 'card' }, h('h3', {}, 'My plan cards'),
      opened.length ? h('div', { class: 'row' }, opened.map(c => h('button', { class: 'ghost', 'data-plan': c.n, onClick: () => showPlanCard(app, p, c.n, back) }, c.den.planTitle.replace('MY ', '')))) : h('p', { class: 'muted' }, 'Your first plan card arrives after your first hunt.'),
      h('div', { class: 'row' }, ['rage', 'overload', 'drift', 'fuel', 'urge'].filter(k => p.signs[k] && p.signs[k].length).map(k =>
        h('button', { class: 'quiet', onClick: () => showSigns(app, p, k, { onDone: back, onBack: back }) }, `Change ${k} signs`)))));
    // Continue
    const next = summary.chapter && !summary.capped ? nextLeg(p, summary.chapter) : null;
    const capNow = app.session && app.session.capReached(Date.now());
    parts.push(h('div', { class: 'row' },
      next !== null && next !== 'done' && !capNow && summary.mode === 'leg' ? h('button', { id: 'keep-playing', onClick: () => app.play(summary.chapter, 'leg', next) }, 'Keep playing') : null,
      h('button', { class: summary.stats ? 'ghost' : '', id: 'to-valley', onClick: () => { app.endSessionIfCapped(); app.show('home'); } }, 'Back to the valley')));
    mount(h('div', { class: 'screen solid' }, ...parts));
  });
}
