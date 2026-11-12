// Instinct meters: one shared component for every instinct (spec, Core systems).
export const SIGN_T = [0.3, 0.55, 0.8];
export const LOCK = 0.7;
export const SPIKE_CAP = 0.92;
export const INSTINCTS = {
  rage: { label: 'RAGE', tool: 'longExhale', col: ['#f59e0b', '#ef4444', '#991b1b'] },
  overload: { label: 'OVERLOAD', tool: 'oneThing', col: ['#fbbf24', '#d97706', '#78350f'] },
  drift: { label: 'DRIFT', tool: 'parkIt', col: ['#86efac', '#22c55e', '#14532d'] },
  fuel: { label: 'FUEL', tool: 'burstRest', col: ['#7dd3fc', '#3b82f6', '#1e3a8a'] },
  urge: { label: 'URGE', tool: 'waitSignal', col: ['#d8b4fe', '#a855f7', '#581c87'] },
};
const OTHER_RELIEF = 0.25;

export class Meter {
  constructor(instinct, signs, { simmerMul = 1 } = {}) {
    this.instinct = instinct; this.signs = signs || []; this.simmerMul = simmerMul;
    this.value = 0; this.prev = 0; this.peak = 0; this.firstToolAt = null;
  }
  set(v) { this.value = Math.max(0, Math.min(1, v)); this.peak = Math.max(this.peak, this.value); }
  // A single trigger can never fill the meter by itself.
  spike(a) { if (this.value < SPIKE_CAP) this.set(Math.min(SPIKE_CAP, this.value + a)); }
  simmer(rate, dt) { this.set(this.value + rate * this.simmerMul * dt); }
  relieve(a) { if (this.firstToolAt === null && a > 0) this.firstToolAt = this.value; this.set(this.value - a); }
  crossings() {
    const out = [];
    for (let i = 0; i < SIGN_T.length; i++) if (this.prev < SIGN_T[i] && this.value >= SIGN_T[i]) out.push(i);
    this.prev = this.value; return out;
  }
  get lit() { return SIGN_T.filter(t => this.value >= t).length; }
  get locked() { return this.value >= LOCK; }
  get full() { return this.value >= 0.999; }
  get label() { return INSTINCTS[this.instinct].label; }
  adapt() { this.simmerMul = 0.6; }
}

export class MeterSet {
  constructor(meters) { this.list = meters; }
  get(instinct) { return this.list.find(m => m.instinct === instinct); }
  relieve(instinct, amount) {
    if (amount <= 0) return;
    for (const m of this.list) m.relieve(m.instinct === instinct ? amount : amount * OTHER_RELIEF);
  }
  get hottest() { return this.list.reduce((a, m) => (m.value > a ? m.value : a), 0); }
}
