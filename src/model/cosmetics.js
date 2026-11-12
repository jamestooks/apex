// Raptor customisation: colours, markings and accessories. Everything is earned in a way that's visible
// in advance: finishing chapters (big items), calm play (smaller items), real-world missions (the best items).
// No random drops, no daily rewards.
export const RIMS = ['#fb923c', '#38bdf8', '#a3e635', '#f472b6', '#facc15'];

export const SLOTS = [
  { id: 'rim', name: 'Colour' }, { id: 'eye', name: 'Eyes' }, { id: 'markings', name: 'Markings' },
  { id: 'crest', name: 'Crest' }, { id: 'tail', name: 'Tail' }, { id: 'neck', name: 'Necklace' },
];
const start = { type: 'start' }, ch = n => ({ type: 'chapter', chapter: n }), calm = n => ({ type: 'calm', count: n }), mission = n => ({ type: 'mission', chapter: n });
const RIM_NAMES = ['Sunset', 'Sky', 'Moss', 'Rose', 'Sun'];

export const COSMETICS = [
  ...RIMS.map((v, i) => ({ id: 'rim-' + RIM_NAMES[i].toLowerCase(), slot: 'rim', name: RIM_NAMES[i], value: v, unlock: start })),
  { id: 'eye-amber', slot: 'eye', name: 'Amber', value: '#fbbf24', unlock: start },
  { id: 'markings-none', slot: 'markings', name: 'None', value: 'none', unlock: start },
  { id: 'crest-none', slot: 'crest', name: 'None', value: 'none', unlock: start },
  { id: 'tail-none', slot: 'tail', name: 'None', value: 'none', unlock: start },
  { id: 'neck-none', slot: 'neck', name: 'None', value: 'none', unlock: start },
  // finishing chapters: the big items
  { id: 'crest-fern', slot: 'crest', name: 'Fern crest', value: 'fern', unlock: ch(1) },
  { id: 'tail-plume', slot: 'tail', name: 'Tail plume', value: 'plume', unlock: ch(2) },
  { id: 'markings-stripes', slot: 'markings', name: 'Tiger stripes', value: 'stripes', unlock: ch(3) },
  { id: 'crest-sail', slot: 'crest', name: 'Sail crest', value: 'sail', unlock: ch(4) },
  { id: 'neck-teeth', slot: 'neck', name: 'Tooth necklace', value: 'teeth', unlock: ch(5) },
  { id: 'rim-molten', slot: 'rim', name: 'Molten', value: '#ff5a1f', unlock: ch(6) },
  // calm play: catching it early, again and again
  { id: 'rim-teal', slot: 'rim', name: 'Teal', value: '#2dd4bf', unlock: calm(3) },
  { id: 'markings-spots', slot: 'markings', name: 'Spots', value: 'spots', unlock: calm(6) },
  { id: 'eye-green', slot: 'eye', name: 'Green', value: '#4ade80', unlock: calm(10) },
  { id: 'tail-band', slot: 'tail', name: 'Tail bands', value: 'band', unlock: calm(15) },
  { id: 'rim-violet', slot: 'rim', name: 'Violet', value: '#c084fc', unlock: calm(22) },
  { id: 'eye-ice', slot: 'eye', name: 'Ice', value: '#bae6fd', unlock: calm(30) },
  { id: 'neck-claw', slot: 'neck', name: 'Claw charm', value: 'claw', unlock: calm(40) },
  // real-world missions a grown-up confirms: the best items
  { id: 'crest-golden', slot: 'crest', name: 'Golden crest', value: 'golden', unlock: mission(1) },
  { id: 'rim-moonlight', slot: 'rim', name: 'Moonlight', value: '#e0e7ff', unlock: mission(2) },
  { id: 'markings-lightning', slot: 'markings', name: 'Lightning marks', value: 'lightning', unlock: mission(3) },
  { id: 'tail-comet', slot: 'tail', name: 'Comet tail', value: 'comet', unlock: mission(4) },
  { id: 'eye-ruby', slot: 'eye', name: 'Ruby', value: '#f43f5e', unlock: mission(5) },
  { id: 'neck-ember', slot: 'neck', name: 'Ember charm', value: 'ember', unlock: mission(6) },
];
const byId = id => COSMETICS.find(c => c.id === id);
export const starterFor = slot => COSMETICS.find(c => c.slot === slot && c.unlock.type === 'start');
export function defaultLook(rimValue) {
  const look = Object.fromEntries(SLOTS.map(s => [s.id, starterFor(s.id).id]));
  const rim = COSMETICS.find(c => c.slot === 'rim' && c.value === rimValue);
  if (rim) look.rim = rim.id;
  return look;
}
export function isUnlocked(p, item) {
  const u = item.unlock;
  if (u.type === 'start') return true;
  if (u.type === 'chapter') return !!(p.chapters[u.chapter] && p.chapters[u.chapter].done);
  if (u.type === 'calm') return (p.calmCount || 0) >= u.count;
  if (u.type === 'mission') return p.missions[u.chapter] === 'confirmed';
  return false;
}
export function lockHint(p, item) {
  const u = item.unlock;
  if (u.type === 'chapter') return `Finish Chapter ${u.chapter}`;
  if (u.type === 'calm') return `Catch it early ${u.count} times (${p.calmCount || 0} so far)`;
  if (u.type === 'mission') return `Chapter ${u.chapter} outside mission, confirmed by a grown-up`;
  return '';
}
export function equip(p, id) {
  const item = byId(id);
  if (!item || !isUnlocked(p, item)) return false;
  p.look = p.look || defaultLook(p.rim);
  p.look[item.slot] = id;
  if (item.slot === 'rim') p.rim = item.value;
  return true;
}
// Resolved values for drawing. Colour comes from p.rim so older profiles keep theirs.
export function lookOf(p) {
  const look = p.look || defaultLook(p.rim), out = {};
  for (const s of SLOTS) out[s.id] = (byId(look[s.id]) || starterFor(s.id)).value;
  out.rim = p.rim || out.rim;
  return out;
}
export function newUnlocks(p) {
  const seen = new Set(p.seenUnlocks || []);
  return COSMETICS.filter(c => c.unlock.type !== 'start' && isUnlocked(p, c) && !seen.has(c.id));
}
export function markSeen(p) { p.seenUnlocks = COSMETICS.filter(c => c.unlock.type !== 'start' && isUnlocked(p, c)).map(c => c.id); }
