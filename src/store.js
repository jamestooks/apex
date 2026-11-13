// Local persistence: everything lives on this device under one localStorage key.
import { defaultLook, RIMS } from './model/cosmetics.js';
export { RIMS };
const KEY = 'apex.v1';
const INSTINCT_KEYS = ['rage', 'overload', 'drift', 'fuel', 'urge'];
const perInstinct = () => Object.fromEntries(INSTINCT_KEYS.map(k => [k, []]));

export function defaultSettings() {
  // feel*: heartbeat/growl, red edges, screen shake. 'off' | 'soft' | 'full'; moderate by default.
  return { sessionMinutes: 15, chaptersOpen: null, sound: true, vibration: true, reducedMotion: false, largeText: false, voices: true, feelSound: 'soft', feelRed: 'soft', feelShake: 'soft' };
}
export function newProfile({ childName = 'Player', raptorName = 'Raptor', rim = RIMS[0] } = {}) {
  const p = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    childName, raptorName, rim, createdAt: Date.now(),
    settings: defaultSettings(),
    signs: perInstinct(), customSigns: perInstinct(),
    trust: 0, scars: 0, mealsKept: 0, finaleCalm: false,
    chapters: {}, toolbelt: [], sessions: [], denAnswers: [], missions: {}, log: [],
    restUntil: 0, strengths: {}, parked: [], waitSecs: 4, parentSigns: perInstinct(),
    look: null, calmCount: 0, seenUnlocks: [],
  };
  p.look = defaultLook(rim);
  return p;
}
function emptyData() { return { version: 1, pin: null, activeId: null, profiles: {} }; }

// Kid-proofing, not security: a salted string hash so the PIN isn't readable at a glance.
function pinHash(pin) {
  let h = 5381; const s = 'apex-raptor:' + pin;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36);
}
// Fill fields added in later versions so old saves keep working.
function upgradeProfile(p) {
  if (p.calmCount === undefined) p.calmCount = (p.sessions || []).reduce((n, x) => n + (x.early || 0), 0);
  const base = newProfile();
  for (const k of Object.keys(base)) if (p[k] === undefined) p[k] = base[k];
  const old = p.settings || {};
  p.settings = { ...defaultSettings(), ...old };
  if (old.intensity === 'low' && old.feelShake === undefined) p.settings.feelShake = 'off';
  delete p.settings.intensity;
  for (const k of INSTINCT_KEYS) { p.signs[k] ||= []; p.customSigns[k] ||= []; p.parentSigns[k] ||= []; }
  if (!p.look) p.look = defaultLook(p.rim);
  return p;
}

export function createStore(storage = globalThis.localStorage) {
  let persistent = !!storage;
  let data = emptyData();
  if (storage) {
    let raw = null;
    try { raw = storage.getItem(KEY); } catch (e) { persistent = false; }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || typeof parsed.profiles !== 'object') throw new Error('bad shape');
        data = { ...emptyData(), ...parsed };
        for (const p of Object.values(data.profiles)) upgradeProfile(p);
      } catch (e) {
        try { storage.setItem(KEY + '.corrupt', raw); } catch (_) {}
        data = emptyData();
      }
    }
  }
  const store = {
    get data() { return data; },
    get persistent() { return persistent; },
    get activeId() { return data.activeId; },
    save() {
      if (!storage) return;
      try { storage.setItem(KEY, JSON.stringify(data)); persistent = true; } catch (e) { persistent = false; }
    },
    profiles() { return Object.values(data.profiles).sort((a, b) => a.createdAt - b.createdAt); },
    getProfile(id) { return data.profiles[id]; },
    active() { return data.profiles[data.activeId]; },
    addProfile(opts) { const p = newProfile(opts); data.profiles[p.id] = p; store.save(); return p; },
    updateProfile(id, fn) { const p = data.profiles[id]; if (p) { fn(p); store.save(); } return p; },
    deleteProfile(id) { delete data.profiles[id]; if (data.activeId === id) data.activeId = null; store.save(); },
    setActive(id) { data.activeId = id; store.save(); },
    hasPin() { return !!data.pin; },
    setPin(pin) { data.pin = pinHash(pin); store.save(); },
    checkPin(pin) { return !!data.pin && data.pin === pinHash(pin); },
    exportJSON() { return JSON.stringify({ app: 'apex', exportedAt: new Date().toISOString(), data }, null, 1); },
    importJSON(str) {
      const parsed = JSON.parse(str);
      const d = parsed && parsed.app === 'apex' ? parsed.data : parsed;
      if (!d || typeof d.profiles !== 'object') throw new Error('Not an Apex backup');
      data = { ...emptyData(), ...d };
      for (const p of Object.values(data.profiles)) upgradeProfile(p);
      store.save();
    },
  };
  return store;
}
