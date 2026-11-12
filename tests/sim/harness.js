// Drives scenes headlessly: fake input, silent audio, fixed time steps.
import { createInput } from '../../src/engine/input.js';
import { createShell } from '../../src/engine/scene.js';
import { Meter, MeterSet } from '../../src/engine/meter.js';
import { newProfile } from '../../src/store.js';

export const silentAudio = new Proxy({}, { get: (t, k) => (k === 'SFX' ? new Proxy({}, { get: () => () => {} }) : () => {}) });

export function fakeInput() {
  const el = new EventTarget(), keys = new EventTarget();
  const input = createInput({ el, keyTarget: keys, toLogical: (x, y) => ({ x, y }) });
  const ev = (type, props) => { const e = new Event(type); Object.assign(e, props); e.preventDefault = () => {}; return e; };
  return {
    input,
    keyDown: k => keys.dispatchEvent(ev('keydown', { key: k === 'Space' ? ' ' : k })),
    keyUp: k => keys.dispatchEvent(ev('keyup', { key: k === 'Space' ? ' ' : k })),
    tap: (x, y) => { el.dispatchEvent(ev('pointerdown', { pointerId: 9, clientX: x, clientY: y })); el.dispatchEvent(ev('pointerup', { pointerId: 9 })); },
    down: (x, y, id = 7) => el.dispatchEvent(ev('pointerdown', { pointerId: id, clientX: x, clientY: y })),
    up: (id = 7) => el.dispatchEvent(ev('pointerup', { pointerId: id })),
  };
}

export const SIGNS = { rage: ['Hot face', 'Clenched fists', 'Tight chest'], overload: ['Covering ears', 'Can\'t think', 'Want to run'],
  drift: ['Staring off', 'Fiddling with things', 'Losing my place'], fuel: ['Can\'t sit still', 'Talking super fast', 'Can\'t stop'],
  urge: ['Can\'t wait', 'Fidgety hands', 'Have to do it NOW'] };

export function makeProfile(extra) {
  const p = newProfile({ childName: 'Test', raptorName: 'Raptor' });
  p.signs = JSON.parse(JSON.stringify(SIGNS));
  return Object.assign(p, extra || {});
}

export function makeShell({ tools = ['longExhale'], theme = 'dusk', profile } = {}) {
  const fi = fakeInput();
  const difficulty = { simmerMul: 1, gapMul: 1, spikeAdd: 0 };
  const shell = createShell({ profile: profile || makeProfile(), theme, tools, audio: silentAudio, input: fi.input, difficulty });
  return { shell, fi, difficulty };
}

export function metersFor(scenario, profile, difficulty) {
  return new MeterSet(scenario.meters.map(m => new Meter(m, profile.signs[m], { simmerMul: difficulty.simmerMul })));
}

// Step the shell + a scene for `secs`, calling policy(ctx) every tick.
export function runScene(shell, scene, policy, { maxSecs = 120, dt = 1 / 30 } = {}) {
  let t = 0;
  while (!scene.done && t < maxSecs) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else if (policy) policy({ t, shell, scene });
    shell.update(dt);
    if (!shell.card) scene.update(dt);
    shell.input.beginFrame();
    t += dt;
  }
  return t;
}

// A sensible calm player for any scene: uses the tool when hot, chooses the first calm option once cool.
export function calmBot(fi, { attack = false } = {}) {
  let holding = false;
  return ({ shell }) => {
    const le = shell.runs.longExhale;
    if (attack) { if (shell.choices) { const c = shell.choices.find(x => x.instinct); if (c) shell.choiceCb(c.k); } return; }
    if (le) {
      if (le.phase === 'idle' && !holding && shell.heat > 0.22) { fi.keyDown('Space'); holding = true; }
      if (holding && le.phase === 'full') { fi.keyUp('Space'); holding = false; }
    }
    if (shell.choices && shell.heat < 0.5 && (!le || le.phase === 'idle') && !holding) {
      const c = shell.choices.find(x => !x.instinct); if (c) shell.choiceCb(c.k);
    }
  };
}
