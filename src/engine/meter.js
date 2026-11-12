// Instinct meters: one shared component for every instinct (spec, Core systems).
export const SIGN_T = [0.3, 0.55, 0.8];
export const LOCK = 0.7;
export const SPIKE_CAP = 0.92;
export const INSTINCTS = {
  rage: { label: 'RAGE', name: 'Rage', tool: 'longExhale', lockText: 'TOO ANGRY TO THINK', col: ['#f59e0b', '#ef4444', '#991b1b'] },
  overload: { label: 'OVERLOAD', name: 'Overload', tool: 'oneThing', lockText: 'TOO MUCH TO THINK', col: ['#fde68a', '#f59e0b', '#b45309'] },
  drift: { label: 'DRIFT', name: 'Drift', tool: 'parkIt', lockText: 'TOO FOGGY TO FOCUS', col: ['#bbf7d0', '#4ade80', '#15803d'] },
  fuel: { label: 'FUEL', name: 'Fuel', tool: 'burstRest', lockText: 'RUNNING ON EMPTY', col: ['#bae6fd', '#38bdf8', '#1d4ed8'] },
  urge: { label: 'URGE', name: 'The urge', tool: 'waitSignal', lockText: 'TOO JUMPY TO WAIT', col: ['#e9d5ff', '#c084fc', '#7e22ce'] },
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
  relieve(a, own = true) { if (own && this.firstToolAt === null && a > 0) this.firstToolAt = this.value; this.set(this.value - a); }
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
    for (const m of this.list) m.instinct === instinct ? m.relieve(amount, true) : m.relieve(amount * OTHER_RELIEF, false);
  }
  get hottest() { return this.list.reduce((a, m) => (m.value > a ? m.value : a), 0); }
}
