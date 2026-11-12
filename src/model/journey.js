// The year as a path through six seasons, for the valley screen.
import { CHAPTERS } from '../data/chapters/index.js';
import { seasonName, currentChapter } from './progress.js';
import { COSMETICS, isUnlocked } from './cosmetics.js';

export function journeyStops(p) {
  const cur = currentChapter(p);
  return CHAPTERS.map(c => {
    const done = !!(p.chapters[c.n] && p.chapters[c.n].done);
    const unlock = COSMETICS.find(x => x.unlock.type === 'chapter' && x.unlock.chapter === c.n);
    return { n: c.n, title: c.title, season: seasonName(c.n), theme: c.theme, state: done ? 'done' : c.n === cur ? 'current' : 'ahead', unlock, unlockOwned: isUnlocked(p, unlock) };
  });
}
