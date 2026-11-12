// Pure progress rules: ranks, unlocks, legs, growth, trophies.
import { lookOf } from './cosmetics.js';
export const RANKS = [
  { name: 'Hatchling', at: 0 }, { name: 'Runner', at: 3 }, { name: 'Hunter', at: 7 },
  { name: 'Tracker', at: 12 }, { name: 'Elder', at: 18 }, { name: 'Apex', at: 24 },
];
export const CHAPTER_COUNT = 6;
const TROPHIES = [
  { name: 'Fossil', icon: '🦴' }, { name: 'Feather', icon: '🪶' }, { name: 'Tooth', icon: '🦷' },
  { name: 'Claw', icon: '🪝' }, { name: 'Amber', icon: '🟠' }, { name: 'Ember', icon: '🔥' },
];
const SEASONS = ['Dry season', 'Storm season', 'Green season', 'Flood season', 'Cold season', 'Fire season'];

export function rankFor(trust, finaleCalm = false) {
  const t = Math.max(0, trust || 0);
  let index = 0;
  RANKS.forEach((r, i) => { if (t >= r.at) index = i; });
  if (finaleCalm) index = RANKS.length - 1;
  const next = RANKS[index + 1] || null;
  return { name: RANKS[index].name, index, next: next ? { name: next.name, needs: next.at - t } : null };
}
export function chapterState(p, n) { return p.chapters[n] || (p.chapters[n] = { leg: 0, done: false }); }
export function chaptersDone(p) { return Object.values(p.chapters).filter(c => c.done).length; }
export function chapterOpen(p, n) {
  if (Array.isArray(p.settings.chaptersOpen)) return p.settings.chaptersOpen.includes(n);
  return n === 1 || !!(p.chapters[n - 1] && p.chapters[n - 1].done) || !!(p.chapters[n] && (p.chapters[n].done || p.chapters[n].leg > 0));
}
export function nextLeg(p, n) { const c = chapterState(p, n); return c.done ? 'done' : c.leg; }
export function completeLeg(p, n, leg) {
  const c = chapterState(p, n);
  if (leg >= c.leg) c.leg = leg + 1;
  if (c.leg >= 2) c.done = true;
}
export function currentChapter(p) {
  for (let n = 1; n <= CHAPTER_COUNT; n++) if (!chapterState(p, n).done && chapterOpen(p, n)) return n;
  return CHAPTER_COUNT;
}
export function recordSession(p, s) {
  p.trust += s.trustDelta || 0;
  if (s.injured) p.scars += 1;
  p.mealsKept += s.mealsKept || 0;
  p.calmCount = (p.calmCount || 0) + (s.early || 0);
  p.sessions.push({ date: s.date || new Date().toISOString().slice(0, 10), chapter: s.chapter, kind: s.kind || 'leg',
    minutes: s.minutes || 0, toolUses: s.toolUses || {}, tookOver: s.tookOver || 0, early: s.early || 0, earlyOf: s.earlyOf || 0 });
  if (p.sessions.length > 300) p.sessions.splice(0, p.sessions.length - 300);
}
export function appearance(p) {
  const d = chaptersDone(p);
  const look = lookOf(p);
  return { scale: 1 + 0.06 * d, feathers: 4 + 2 * d, scars: Math.min(3, p.scars || 0), rim: look.rim, look };
}
export function seasonName(n) { return SEASONS[(n - 1) % SEASONS.length]; }
export function trophies(p) {
  return Object.entries(p.missions).filter(([, v]) => v === 'confirmed')
    .map(([n]) => ({ chapter: +n, ...TROPHIES[(+n - 1) % TROPHIES.length] })).sort((a, b) => a.chapter - b.chapter);
}
