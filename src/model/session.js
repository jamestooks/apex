// Session length cap and the rest that follows it.
const MIN = 60000;
export const REST_MINUTES = 60;
export function createSession(profile, now) {
  const start = now;
  return {
    start,
    elapsed: t => t - start,
    capReached: t => t - start >= (profile.settings.sessionMinutes || 15) * MIN,
    minutes: t => Math.round((t - start) / MIN),
  };
}
export function restRemaining(p, now) { return Math.max(0, (p.restUntil || 0) - now); }
export function startRest(p, now) { p.restUntil = now + REST_MINUTES * MIN; }
