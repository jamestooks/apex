// How spoken lines map to recorded clips. Pure, so the clip generator and the game agree exactly.
// A line is split into sentences; each sentence has a clip keyed by speaker + wording. Sentences that
// include something personal (the child's warning signs, the raptor's name) are split around it, so the
// fixed words and each built-in sign have their own clips.
export function normalize(t) {
  return String(t).replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim();
}
export function sentences(text) {
  return String(text).replace(/[“”"]/g, '').split(/\n+|(?<=[.!?])\s+/).map(s => normalize(s)).filter(s => /[a-z0-9]/i.test(s));
}
export function keyFor(speaker, text) {
  const s = speaker + '|' + normalize(text).toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
const meaningful = s => /[a-z0-9]/i.test(s);

function findName(s, names) {
  const lower = s.toLowerCase();
  let best = null;
  const word = c => c && /[a-z0-9']/i.test(c);
  for (const n of names) {
    if (!n) continue;
    const nl = n.toLowerCase();
    for (let i = lower.indexOf(nl); i >= 0; i = lower.indexOf(nl, i + 1)) {
      if (word(lower[i - 1]) || word(lower[i + nl.length])) continue; // whole words only
      if (!best || i < best.i || (i === best.i && n.length > best.n.length)) best = { i, n };
      break;
    }
  }
  return best;
}
// Split one sentence around names. `has(key)` says whether a clip exists; pass () => false to list what to record.
function split(speaker, s, names, has, wholeFirst) {
  if (wholeFirst && has(keyFor(speaker, s))) return [{ text: s, clip: true }];
  const f = findName(s, names);
  if (!f) return [{ text: s, clip: has(keyFor(speaker, s)) }];
  const before = s.slice(0, f.i).trim(), mid = s.slice(f.i, f.i + f.n.length), after = s.slice(f.i + f.n.length).trim();
  const out = [];
  if (meaningful(before)) out.push({ text: before, clip: has(keyFor(speaker, before)) });
  out.push({ text: mid, clip: has(keyFor(speaker, mid)) });
  if (meaningful(after)) out.push(...split(speaker, after, names, has, false));
  return out;
}
// What to play for a line: [{ text, clip }]. clip=false means "say this with the device voice".
export function pieces(speaker, text, names, has) {
  return sentences(text).flatMap(s => split(speaker, s, names || [], has, true));
}
// What to record for a line as it was spoken with these names.
export function recordPieces(text, names) {
  return sentences(text).flatMap(s => (findName(s, names || []) ? split('x', s, names, () => false, false).map(p => p.text) : [s]));
}
