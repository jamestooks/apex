// "Who's playing?" and new-player setup. Each child gets their own raptor and their own progress.
import { h, mount } from './dom.js';
import { RIMS } from '../store.js';
import { rankFor } from '../model/progress.js';

export function registerProfiles(app) {
  app.register('profiles', () => {
    app.canvasScene = app.titleScene;
    const list = app.store.profiles();
    const scr = h('div', { class: 'screen over-canvas-screen' },
      h('div', { style: { height: '4vh' } }),
      h('h1', { class: 'title' }, 'APEX'),
      h('div', { class: 'kicker' }, 'The strongest hunter controls the fire inside'),
      h('div', { class: 'spacer' }),
      h('div', { class: 'card' },
        h('h3', {}, list.length ? "Who's playing?" : 'Welcome to the valley'),
        ...list.map(p => h('button', { class: 'tile', 'data-profile': p.id, onClick: () => { app.selectProfile(p.id); } },
          h('span', { class: 'swatch', style: { background: p.rim, width: '28px', height: '28px', display: 'inline-block' } }),
          h('span', {}, `${p.childName} `, h('small', { class: 'muted' }, `· ${p.raptorName} · ${rankFor(p.trust, p.finaleCalm).name}`)))),
        h('button', { class: list.length ? 'ghost' : '', id: 'new-player', onClick: () => app.show('newProfile') }, '+ New player')),
      h('button', { class: 'quiet', id: 'grownups-link', onClick: () => app.show('grownups') }, 'Grown-ups'),
      h('p', { class: 'small', style: { textAlign: 'center' } }, 'Everything stays on this device. Sound on.'));
    mount(scr);
  });

  app.register('newProfile', () => {
    let rim = RIMS[0];
    const child = h('input', { type: 'text', id: 'child-name', maxlength: 20, placeholder: 'Your name', autocomplete: 'off' });
    const raptor = h('input', { type: 'text', id: 'raptor-name', maxlength: 16, placeholder: 'Raptor', autocomplete: 'off' });
    const sw = h('div', { class: 'swatches' }, RIMS.map((c, i) => h('button', { class: 'swatch' + (i === 0 ? ' on' : ''), 'aria-label': 'Colour ' + (i + 1), style: { background: c }, onClick: e => { rim = c; sw.querySelectorAll('.swatch').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } })));
    const go = () => {
      const p = app.store.addProfile({ childName: child.value.trim() || 'Player', raptorName: raptor.value.trim() || 'Raptor', rim });
      app.selectProfile(p.id);
    };
    mount(h('div', { class: 'screen solid' },
      h('h2', {}, 'New player'),
      h('p', { class: 'scar' }, '"Every hunter in this pack has a name. What should we call you, and your raptor?"'),
      h('label', {}, 'Your name', child),
      h('label', {}, "Your raptor's name", raptor),
      h('label', {}, 'Your raptor glows this colour in the sunset', sw),
      h('div', { class: 'spacer' }),
      h('button', { id: 'create-player', onClick: go }, 'Start'),
      h('button', { class: 'quiet', onClick: () => app.show('profiles') }, 'Back')));
    setTimeout(() => child.focus(), 50);
  });
}
