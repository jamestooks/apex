// Grown-ups mode: PIN-locked. See what they're practising, confirm missions, set limits, coach, log real moments.
import { h, mount } from './dom.js';
import { CHAPTERS } from '../data/chapters/index.js';
import { SIGN_OPTIONS } from '../data/signs.js';
import { INSTINCTS } from '../engine/meter.js';
import { TOOLS, TOOL_ORDER } from '../engine/tools/index.js';
import { showPlanCard } from './plancard.js';
import { weeklyLogSummary, profileOverview } from './grownups-model.js';

const INST = ['rage', 'overload', 'drift', 'fuel', 'urge'];
const TABS = [['overview', 'Overview'], ['missions', 'Missions'], ['signs', 'Signs'], ['plans', 'Plan cards'], ['settings', 'Settings'], ['coach', 'Coach'], ['log', 'Log'], ['data', 'Data']];
let unlocked = false, tab = 'overview', childId = null;

function pinScreen(app, { title, sub, onPin, extra }) {
  let entry = '';
  const dots = h('div', { class: 'pindots' }), msg = h('p', { class: 'muted', id: 'pin-msg', style: { textAlign: 'center', minHeight: '1.4em' } });
  const render = () => { dots.textContent = '●'.repeat(entry.length) + '○'.repeat(4 - entry.length); };
  const press = d => { if (entry.length < 4) entry += d; render(); if (entry.length === 4) { const e = entry; entry = ''; setTimeout(render, 150); onPin(e, msg); } };
  render();
  mount(h('div', { class: 'screen solid' },
    h('h2', {}, 'Grown-ups'), h('p', { class: 'muted' }, sub), h('h3', { style: { textAlign: 'center' } }, title), dots, msg,
    h('div', { class: 'pinpad' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(d => d === '' ? h('span', {}) :
      h('button', { 'data-digit': d === '⌫' ? 'back' : d, onClick: () => { if (d === '⌫') { entry = entry.slice(0, -1); render(); } else press(d); } }, d))),
    extra || null,
    h('button', { class: 'quiet', onClick: () => app.show(app.profile ? 'home' : 'profiles') }, 'Back to the game')));
}

export function registerGrownups(app) {
  app.register('grownups', () => {
    const st = app.store;
    if (!unlocked) {
      if (!st.hasPin()) {
        let first = null;
        const ask = () => pinScreen(app, { title: first ? 'Enter it again' : 'Choose a 4-digit PIN', sub: 'This keeps settings and notes for grown-ups only.',
          onPin: (pin, msg) => { if (!first) { first = pin; ask(); } else if (pin === first) { st.setPin(pin); unlocked = true; app.show('grownups'); } else { first = null; msg.textContent = "Those didn't match. Try again."; setTimeout(ask, 900); } } });
        return ask();
      }
      return pinScreen(app, { title: 'Enter PIN', sub: 'For parents and carers.',
        onPin: (pin, msg) => { if (st.checkPin(pin)) { unlocked = true; app.show('grownups'); } else msg.textContent = "That's not right. Try again."; },
        extra: h('button', { class: 'quiet', id: 'forgot-pin', onClick: () => forgot(app) }, 'Forgot PIN') });
    }
    const profiles = st.profiles();
    if (!childId || !st.getProfile(childId)) childId = (app.profile && app.profile.id) || (profiles[0] && profiles[0].id) || null;
    const p = childId && st.getProfile(childId);
    const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
    const rerender = () => app.show('grownups');
    if (!st.persistent) body.append(h('div', { class: 'warn' }, "Progress isn't being saved on this device (private browsing or storage is blocked). Use Data → Export to keep a backup."));
    if (!p && tab !== 'data') body.append(h('p', { class: 'muted' }, 'No players yet. Add one from the main screen.'));
    else if (tab === 'overview') overview(body, p);
    else if (tab === 'missions') missions(body, app, p, rerender);
    else if (tab === 'signs') signs(body, app, p, rerender);
    else if (tab === 'plans') plans(body, app, p);
    else if (tab === 'settings') settings(body, app, p);
    else if (tab === 'coach') coach(body);
    else if (tab === 'log') logTab(body, app, p, rerender);
    if (tab === 'data') data(body, app, p, rerender);
    mount(h('div', { class: 'screen solid' },
      h('div', { class: 'row', style: { alignItems: 'center' } }, h('h2', { style: { flex: 'none' } }, 'Grown-ups'),
        h('button', { class: 'quiet', id: 'gu-exit', style: { flex: 'none', marginLeft: 'auto' }, onClick: () => { unlocked = false; app.show(app.profile ? 'home' : 'profiles'); } }, 'Lock & exit')),
      profiles.length ? h('label', {}, 'Child', h('select', { id: 'gu-child', onChange: e => { childId = e.target.value; rerender(); } },
        profiles.map(x => h('option', { value: x.id, selected: x.id === childId }, `${x.childName} (${x.raptorName})`)))) : null,
      h('div', { class: 'tabs' }, TABS.map(([k, l]) => h('button', { class: tab === k ? 'on' : '', 'data-tab': k, onClick: () => { tab = k; rerender(); } }, l))),
      body));
  });
}

function forgot(app) {
  const a = 12 + Math.floor(Math.random() * 80), b = 3 + Math.floor(Math.random() * 7);
  const inp = h('input', { type: 'number', inputmode: 'numeric', id: 'forgot-answer' }), msg = h('p', { class: 'muted' });
  mount(h('div', { class: 'screen solid' }, h('h2', {}, 'Reset PIN'), h('p', { class: 'muted' }, 'Answer this to set a new PIN.'),
    h('h3', {}, `${a} × ${b} = ?`), inp, msg,
    h('button', { onClick: () => { if (+inp.value === a * b) { app.store.data.pin = null; app.store.save(); app.show('grownups'); } else msg.textContent = 'Not quite. Try again.'; } }, 'Check'),
    h('button', { class: 'quiet', onClick: () => app.show('grownups') }, 'Back')));
}
function overview(body, p) {
  const o = profileOverview(p);
  body.append(
    h('div', { class: 'card' }, h('h3', {}, `${p.childName} · ${o.rank}`),
      h('p', { class: 'muted' }, `Played ${o.sessions.length ? (p.sessions.length + ' sessions') : 'no sessions yet'}, ${o.minutes} minutes in total. Caught it early ${o.early} of ${o.earlyOf} times. An instinct took over ${o.tookOver} times.`),
      h('table', {}, h('tr', {}, h('th', {}, 'Tool'), h('th', {}, 'Used')), TOOL_ORDER.map(id => h('tr', {}, h('td', {}, TOOLS[id].TOOL.name), h('td', {}, o.toolUses[id] || 0))))),
    h('div', { class: 'card' }, h('h3', {}, 'Their warning signs'),
      INST.map(k => h('p', {}, h('b', {}, INSTINCTS[k].label + ': '), (p.signs[k] && p.signs[k].length) ? p.signs[k].join(' → ') : h('span', { class: 'muted' }, 'not chosen yet')))),
    h('div', { class: 'card' }, h('h3', {}, 'Recent sessions'),
      o.sessions.length ? h('table', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Chapter'), h('th', {}, 'Mins')), o.sessions.map(s => h('tr', {}, h('td', {}, s.date), h('td', {}, (CHAPTERS.find(c => c.n === s.chapter) || {}).title || s.chapter, s.kind === 'hunt' ? ' (hunt)' : ''), h('td', {}, s.minutes)))) : h('p', { class: 'muted' }, 'None yet.')),
    h('div', { class: 'card' }, h('h3', {}, 'Den answers they chose to share'),
      h('p', { class: 'small' }, 'If an answer worries you, talk with them, and with a professional if needed.'),
      o.sharedAnswers.length ? o.sharedAnswers.map(a => h('div', {}, h('p', { class: 'scar' }, `"${a.question}"`), h('p', {}, a.answer), h('p', { class: 'small' }, a.date))) : h('p', { class: 'muted' }, 'Nothing shared yet. Answers are private unless they choose to share.')));
}
function missions(body, app, p, rerender) {
  const done = CHAPTERS.filter(c => p.chapters[c.n] && p.chapters[c.n].done);
  if (!done.length) return body.append(h('p', { class: 'muted' }, 'Missions appear when a chapter is finished.'));
  for (const c of done) {
    const s = p.missions[c.n] || 'none';
    body.append(h('div', { class: 'card' }, h('h3', {}, c.title), h('p', {}, c.den.mission),
      h('p', { class: 'small' }, s === 'confirmed' ? 'Confirmed. Trophy earned.' : s === 'done-told' ? 'They say they have done it.' : 'Not done yet.'),
      s !== 'confirmed' ? h('button', { 'data-confirm': c.n, onClick: () => { app.store.updateProfile(p.id, q => { q.missions[c.n] = 'confirmed'; }); rerender(); } }, 'Confirm: they did it') : null));
  }
  body.append(h('p', { class: 'small' }, 'Never tie missions to screen time or money.'));
}
function signs(body, app, p, rerender) {
  body.append(h('p', { class: 'muted' }, 'Children with ADHD often notice their own body signals late. Add what YOU notice first; it goes on their plan card beside the signs they chose. You can also add signs in their own words for them to pick.'));
  for (const k of INST) {
    const inp = h('input', { type: 'text', maxlength: 28, placeholder: 'e.g. Stomping feet' });
    const seen = h('input', { type: 'text', maxlength: 28, placeholder: 'e.g. Goes very quiet', 'data-parent-sign': k });
    body.append(h('div', { class: 'card' }, h('h3', {}, INSTINCTS[k].label),
      h('p', { class: 'small' }, 'Built in: ' + SIGN_OPTIONS[k].join(', ')),
      h('div', { class: 'row' }, (p.customSigns[k] || []).map(s => h('button', { class: 'quiet', style: { flex: 'none' }, onClick: () => { app.store.updateProfile(p.id, q => { q.customSigns[k] = q.customSigns[k].filter(x => x !== s); }); rerender(); } }, s + ' ✕'))),
      h('p', { class: 'small' }, 'What grown-ups notice first'),
      h('div', { class: 'row' }, (p.parentSigns[k] || []).map(s => h('button', { class: 'quiet', style: { flex: 'none' }, onClick: () => { app.store.updateProfile(p.id, q => { q.parentSigns[k] = q.parentSigns[k].filter(x => x !== s); }); rerender(); } }, s + ' ✕'))),
      h('div', { class: 'row' }, seen, h('button', { style: { flex: 'none' }, 'data-add-parent-sign': k, onClick: () => { const v = seen.value.trim(); if (v) { app.store.updateProfile(p.id, q => { if (!q.parentSigns[k].includes(v)) q.parentSigns[k].push(v); }); rerender(); } } }, 'Add')),
      h('p', { class: 'small' }, 'Extra signs for them to pick from'),
      h('div', { class: 'row' }, inp, h('button', { style: { flex: 'none' }, onClick: () => { const v = inp.value.trim(); if (v) { app.store.updateProfile(p.id, q => { if (!q.customSigns[k].includes(v)) q.customSigns[k].push(v); }); rerender(); } } }, 'Add'))));
  }
}
function plans(body, app, p) {
  const opened = CHAPTERS.filter(c => p.chapters[c.n] && (p.chapters[c.n].leg > 0 || p.chapters[c.n].done));
  if (!opened.length) return body.append(h('p', { class: 'muted' }, 'Plan cards appear after their first session in a chapter.'));
  body.append(h('p', { class: 'muted' }, 'Print these for the fridge, their school bag, or their teacher or SENCo.'));
  for (const c of opened) body.append(h('button', { class: 'ghost', onClick: () => showPlanCard(app, p, c.n, () => app.show('grownups')) }, c.den.planTitle));
}
function settings(body, app, p) {
  const save = fn => { app.store.updateProfile(p.id, fn); if (app.profile && app.profile.id === p.id) app.applySettings(p); };
  const S = p.settings;
  const check = (key, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'set-' + key, checked: !!S[key], onChange: e => save(q => { q.settings[key] = e.target.checked; }) }), label);
  body.append(
    h('div', { class: 'card' }, h('h3', {}, 'Session'),
      h('label', {}, 'Session length (minutes). The game finishes the current moment, then rests.',
        h('select', { id: 'set-minutes', onChange: e => save(q => { q.settings.sessionMinutes = +e.target.value; }) }, [10, 15, 20, 30].map(m => h('option', { value: m, selected: S.sessionMinutes === m }, m)))),
      p.restUntil > Date.now() ? h('button', { class: 'ghost', onClick: () => { save(q => { q.restUntil = 0; }); app.show('grownups'); } }, 'End the rest now') : null),
    h('div', { class: 'card' }, h('h3', {}, 'Sound and feel'), check('sound', 'Sound'), check('vibration', 'Vibration (phones that support it)'),
      check('reducedMotion', 'Reduced motion (no screen shake, still backgrounds)'), check('largeText', 'Larger text'),
      h('p', { class: 'small' }, 'These effects rise as the meter rises and soften while a tool is being used. Watch the first sessions: if they wind your child up rather than help them notice, turn them down.'),
      ...[['feelSound', 'Heartbeat and growl'], ['feelRed', 'Red at the screen edges'], ['feelShake', 'Screen shake']].map(([key, label]) => h('label', {}, label, h('select', { id: 'set-' + key, onChange: e => save(q => { q.settings[key] = e.target.value; }) },
        [['off', 'Off'], ['soft', 'Gentle (default)'], ['full', 'Full']].map(([v, l]) => h('option', { value: v, selected: (S[key] || 'soft') === v }, l))))),
    ),
    h('div', { class: 'card' }, h('h3', {}, 'Chapters open'), h('p', { class: 'small' }, 'By default chapters open in order. Tick to open specific chapters.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !Array.isArray(S.chaptersOpen), onChange: e => { save(q => { q.settings.chaptersOpen = e.target.checked ? null : CHAPTERS.filter(c => c.n === 1 || (q.chapters[c.n - 1] && q.chapters[c.n - 1].done)).map(c => c.n); }); app.show('grownups'); } }), 'Open in order (recommended)'),
      Array.isArray(S.chaptersOpen) ? CHAPTERS.map(c => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: S.chaptersOpen.includes(c.n), onChange: e => save(q => { const set = new Set(q.settings.chaptersOpen); e.target.checked ? set.add(c.n) : set.delete(c.n); q.settings.chaptersOpen = [...set].sort(); }) }), `${c.n}. ${c.title}`)) : null));
}
function coach(body) {
  body.append(h('p', { class: 'muted' }, 'The game only works if grown-ups use its words in the moment. Doing the tool with them works better than telling them to do it.'));
  for (const c of CHAPTERS) body.append(h('div', { class: 'card' }, h('h3', {}, `${c.n}. ${c.title}`), h('p', { class: 'small' }, c.blurb),
    h('p', {}, h('b', {}, 'First: '), 'take your own slow breath out. We cannot help a child calm down until we are calm ourselves.'),
    h('p', {}, h('b', {}, 'Then say: '), c.coach.say.map(s => `"${s.replace(/^"|"$/g, '')}"`).join('  ·  ')),
    h('p', {}, h('b', {}, 'Avoid: '), c.coach.avoid.join('  ·  ')),
    h('p', {}, h('b', {}, 'Do it alongside: '), c.coach.alongside)));
}
function logTab(body, app, p, rerender) {
  let inst = 'rage';
  const chips = h('div', { class: 'row' });
  const drawChips = () => chips.replaceChildren(...INST.map(k => h('button', { class: 'tile' + (k === inst ? ' on' : ''), style: { flex: 'none', minHeight: '44px' }, onClick: () => { inst = k; drawChips(); } }, INSTINCTS[k].label)));
  drawChips();
  const add = outcome => { app.store.updateProfile(p.id, q => q.log.push({ date: new Date().toISOString().slice(0, 10), instinct: inst, phrase: true, outcome })); rerender(); };
  const rows = weeklyLogSummary(p.log, Date.now());
  body.append(
    h('div', { class: 'card' }, h('h3', {}, 'Log a real moment'), h('p', { class: 'small' }, 'You used the phrase. What happened?'), chips,
      h('div', { class: 'row' }, h('button', { onClick: () => add('used') }, 'Used the tool'), h('button', { class: 'sky', onClick: () => add('unprompted') }, 'Did it unprompted')),
      h('button', { class: 'ghost', onClick: () => add('didnt') }, "Didn't land this time")),
    h('div', { class: 'card' }, h('h3', {}, 'Last 8 weeks'), h('p', { class: 'small' }, 'Look for a trend, not perfection in any one week.'),
      h('table', {}, h('tr', {}, h('th', {}, 'Week of'), h('th', {}, 'Used'), h('th', {}, 'Unprompted'), h('th', {}, "Didn't land")),
        rows.map(r => h('tr', {}, h('td', {}, r.weekStart), h('td', {}, r.used), h('td', {}, r.unprompted), h('td', {}, r.didnt))))));
}
function data(body, app, p, rerender) {
  const st = app.store;
  const file = h('input', { type: 'file', accept: 'application/json,.json' }), msg = h('p', { class: 'small' });
  body.append(h('div', { class: 'card' }, h('h3', {}, 'Backup'), h('p', { class: 'small' }, 'Everything lives on this device only. Export now and then so progress is never lost.'),
    h('button', { onClick: async () => {
      const name = `apex-backup-${new Date().toISOString().slice(0, 10)}.json`, json = st.exportJSON();
      // Installed iPhone/iPad apps can't download files; the share sheet (Save to Files, AirDrop, email) works.
      try { const f = new File([json], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Apex backup' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = h('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); a.remove();
    } }, 'Export backup'),
    h('button', { class: 'quiet', id: 'show-backup', onClick: e => { const ta = h('textarea', { id: 'backup-text', readonly: true, style: { minHeight: '140px' } }); ta.value = st.exportJSON(); const cp = h('button', { class: 'ghost', onClick: () => { ta.select(); try { navigator.clipboard.writeText(ta.value); cp.textContent = 'Copied'; } catch (_) { document.execCommand && document.execCommand('copy'); } } }, 'Copy'); e.currentTarget.replaceWith(h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, h('p', { class: 'small' }, 'If Export does nothing, copy this text and paste it into a note or email to yourself.'), ta, cp)); } }, 'Show backup as text'),
    file, h('button', { class: 'ghost', onClick: async () => { const f = file.files[0]; if (!f) { msg.textContent = 'Choose a backup file first.'; return; } try { st.importJSON(await f.text()); msg.textContent = 'Backup restored.'; rerender(); } catch (e) { msg.textContent = "That file isn't an Apex backup. Nothing was changed."; } } }, 'Import backup'), msg));
  if (p) {
    const cn = h('input', { type: 'text', value: p.childName, maxlength: 20 }), rn = h('input', { type: 'text', value: p.raptorName, maxlength: 16 });
    const del = h('input', { type: 'text', placeholder: `Type ${p.childName} to confirm` });
    body.append(h('div', { class: 'card' }, h('h3', {}, `${p.childName}'s profile`), h('label', {}, "Child's name", cn), h('label', {}, "Raptor's name", rn),
      h('button', { class: 'ghost', onClick: () => { st.updateProfile(p.id, q => { q.childName = cn.value.trim() || q.childName; q.raptorName = rn.value.trim() || q.raptorName; }); rerender(); } }, 'Save names'),
      h('label', {}, 'Delete this player and all their progress', del),
      h('button', { class: 'quiet', onClick: () => { if (del.value.trim() === p.childName) { st.deleteProfile(p.id); childId = null; rerender(); } } }, 'Delete player')));
  }
  body.append(h('div', { class: 'card' }, h('h3', {}, 'PIN'), h('button', { class: 'ghost', onClick: () => { st.data.pin = null; st.save(); unlocked = false; app.show('grownups'); } }, 'Change PIN')));
}
