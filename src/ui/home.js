// The valley: the player's raptor in the current chapter's world, the six chapters, Hunts, and the Den.
import { h, mount } from './dom.js';
import { CHAPTERS } from '../data/chapters/index.js';
import { rankFor, chapterOpen, nextLeg, currentChapter, appearance } from '../model/progress.js';
import { restRemaining } from '../model/session.js';
import { ctx, W, GY, SH, view } from '../engine/canvas.js';
import { drawWorld, drawForeground } from '../art/world.js';
import { drawRaptor } from '../art/raptor.js';

export function valleyScene(app, profile, theme) {
  const ap = profile ? appearance(profile) : { scale: 1.6, feathers: 8, scars: 0, rim: '#fb923c' };
  return {
    update() {},
    draw() {
      const t = app.T, rm = profile && profile.settings.reducedMotion;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, view.H); ctx.clip();
      drawWorld(theme, t * 6, 0, t, { reducedMotion: rm });
      const gy = GY();
      ctx.fillStyle = '#0a0407'; ctx.beginPath(); ctx.moveTo(90, gy + 6); ctx.lineTo(120, gy - 30); ctx.lineTo(170, gy - 44); ctx.lineTo(230, gy - 38); ctx.lineTo(270, gy - 12); ctx.lineTo(290, gy + 6); ctx.closePath(); ctx.fill();
      drawRaptor(190, gy - 42, 1.5 * ap.scale, 'stand', t, 1, { hk: 0.3 + 0.2 * Math.sin(t), rim: ap.rim, feathers: ap.feathers, scars: ap.scars });
      drawForeground(theme, t * 6, t, { reducedMotion: rm });
      ctx.fillStyle = '#0a0508'; ctx.fillRect(0, SH(), W, view.H - SH());
      ctx.restore();
    },
  };
}

function fmtMins(ms) { return Math.max(1, Math.ceil(ms / 60000)); }

export function registerHome(app) {
  app.register('home', () => {
    const p = app.profile;
    if (!p) return app.show('profiles');
    const cur = currentChapter(p), curCh = CHAPTERS.find(c => c.n === cur) || CHAPTERS[0];
    const allDone = CHAPTERS.every(c => p.chapters[c.n] && p.chapters[c.n].done);
    app.canvasScene = valleyScene(app, p, allDone ? 'dusk' : curCh.theme);
    const rank = rankFor(p.trust, p.finaleCalm);
    const rest = restRemaining(p, Date.now());
    const tiles = [];
    for (let n = 1; n <= 6; n++) {
      const ch = CHAPTERS.find(c => c.n === n);
      const open = ch && chapterOpen(p, n), leg = ch ? nextLeg(p, n) : 0, done = leg === 'done';
      const label = !ch ? 'Coming soon' : done ? 'Done' : !open ? 'Locked' : leg === 0 ? 'Start' : 'Part 2';
      tiles.push(h('div', { class: 'tile chapter-tile' + (done ? ' done' : '') + (!open ? ' locked' : ''), 'data-chapter': n },
        h('span', { class: 'n' }, n),
        h('span', { class: 't' }, ch ? ch.title : '—', h('small', {}, ch ? `${ch.blurb || ''}` : '')),
        h('span', { class: 'row', style: { flex: 'none', gap: '6px' } },
          done ? h('button', { class: 'quiet', 'data-hunt': n, disabled: rest > 0, onClick: () => app.play(n, 'hunt') }, 'Hunt · 5 min') : null,
          open && !done ? h('button', { 'data-play': n, disabled: rest > 0, style: { minHeight: '44px', fontSize: '1rem' }, onClick: () => app.play(n, 'leg', leg) }, label) : (!done ? h('span', { class: 'small' }, label) : null))));
    }
    mount(h('div', { class: 'screen' },
      h('div', { class: 'row', style: { justifyContent: 'space-between', alignItems: 'center' } },
        h('div', { style: { flex: 'none' } }, h('h2', { style: { color: p.rim } }, p.raptorName), h('div', { class: 'kicker', style: { textAlign: 'left' } }, allDone && p.finaleCalm ? 'APEX · LEADER OF THE PACK' : `${rank.name} · ${allDone ? 'Green season' : curCh.season}`)),
        h('button', { class: 'quiet', style: { flex: 'none' }, id: 'switch-player', onClick: () => app.switchPlayer() }, 'Switch player')),
      h('div', { style: { height: '46vh', flex: 'none' } }),
      rest > 0 ? h('div', { class: 'warn', id: 'resting' }, `Scar is resting. Back in ${fmtMins(rest)} minutes.`) : null,
      h('div', { class: 'card', style: { background: 'rgba(22,16,15,0.94)' } }, ...tiles),
      h('div', { class: 'row' },
        h('button', { class: 'ghost', id: 'open-den', onClick: () => app.show('den', {}) }, 'The Den'),
        h('button', { class: 'quiet', id: 'grownups-link', onClick: () => app.show('grownups') }, 'Grown-ups'))));
  });
}
