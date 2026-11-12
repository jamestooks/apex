// Pure helpers for Grown-ups mode (no DOM), so they can be tested in Node.
import { rankFor } from '../model/progress.js';

const DAY = 86400000;
const ymd = t => new Date(t).toISOString().slice(0, 10);
function mondayOf(t) {
  const d = new Date(t); d.setUTCHours(0, 0, 0, 0);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return d.getTime() - dow * DAY;
}
export function weeklyLogSummary(log, now) {
  const start = mondayOf(now);
  const rows = Array.from({ length: 8 }, (_, i) => ({ weekStart: ymd(start - i * 7 * DAY), used: 0, unprompted: 0, didnt: 0 }));
  for (const e of log || []) {
    const t = Date.parse(e.date + 'T12:00:00Z'); if (isNaN(t)) continue;
    const i = Math.floor((start - mondayOf(t)) / (7 * DAY));
    if (i >= 0 && i < 8 && rows[i][e.outcome] !== undefined) rows[i][e.outcome]++;
  }
  return rows;
}
export function profileOverview(p) {
  const toolUses = {}; let tookOver = 0, early = 0, earlyOf = 0, minutes = 0;
  for (const s of p.sessions || []) {
    for (const [k, v] of Object.entries(s.toolUses || {})) toolUses[k] = (toolUses[k] || 0) + v;
    tookOver += s.tookOver || 0; early += s.early || 0; earlyOf += s.earlyOf || 0; minutes += s.minutes || 0;
  }
  return { toolUses, tookOver, early, earlyOf, minutes, rank: rankFor(p.trust, p.finaleCalm).name,
    sessions: (p.sessions || []).slice(-20).reverse(), sharedAnswers: (p.denAnswers || []).filter(a => a.shared) };
}
