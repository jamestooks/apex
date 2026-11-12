// Session length cap (counts play time only, not time on menus) and the rest that follows it.
const MIN = 60000;
export const REST_MINUTES = 60;
export function createSession(profile) {
  let played = 0;
  return {
    tick(ms) { played += ms; },
    elapsed: () => played,
    capReached: () => played >= (profile.settings.sessionMinutes || 15) * MIN,
    minutes: () => Math.round(played / MIN),
    remaining: () => Math.max(0, (profile.settings.sessionMinutes || 15) * MIN - played),
  };
}
export function restRemaining(p, now) { return Math.max(0, (p.restUntil || 0) - now); }
export function startRest(p, now) { p.restUntil = now + REST_MINUTES * MIN; }
