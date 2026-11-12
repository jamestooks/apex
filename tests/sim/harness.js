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
    move: (x, y, id = 7) => el.dispatchEvent(ev('pointermove', { pointerId: id, clientX: x, clientY: y })),
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

export function makeShell({ tools = ['longExhale'], theme = 'dusk', profile, audio } = {}) {
  const fi = fakeInput();
  const difficulty = { simmerMul: 1, gapMul: 1, spikeAdd: 0 };
  const shell = createShell({ profile: profile || makeProfile(), theme, tools, audio: audio || silentAudio, input: fi.input, difficulty });
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

// Plays One Thing for real: starts it when overload is past the first sign, taps one target per step after the dwell.
export function oneThingBot(fi, { attack = false, start = 0.27, chooseBelow = 0.5, onlyExhale = false } = {}) {
  let wait = 0, holding = false;
  return ({ shell }) => {
    if (attack) { if (shell.choices) { const c = shell.choices.find(x => x.instinct); if (c) shell.choiceCb(c.k); } return; }
    const ov = shell.meters.get('overload'), run = shell.runs.oneThing, le = shell.runs.longExhale;
    if (!onlyExhale && ov && ov.value >= start && (!run || run.done) && !shell.activeTool && shell.targets.oneThing && !(run && run.done && shell.choices)) shell.startTapTool('oneThing');
    const r = shell.runs.oneThing;
    if (r && !r.done && shell.activeTool === 'oneThing') {
      wait += 1 / 20;
      if (r.t > 1.3) { const b = r.targets[r.phase][0]; fi.tap(b.x + 2, b.y + 2); }
    }
    if (le && (onlyExhale || (shell.meters.get('rage') && shell.meters.get('rage').value > 0.3)) && !shell.activeTool || holding) {
      if (le.phase === 'idle' && !holding && shell.heat > 0.22) { fi.keyDown('Space'); holding = true; }
      if (holding && le.phase === 'full') { fi.keyUp('Space'); holding = false; }
    }
    if (shell.choices && shell.heat < chooseBelow && !shell.activeTool && !holding) { const c = shell.choices.find(x => !x.instinct); if (c) shell.choiceCb(c.k); }
  };
}

// Fern Maze player: taps the glowing print; optionally parks each distraction by dragging it to the scent map.
export function trackBot(fi, { park = true, tapDecoy = false, breathe = true } = {}) {
  let dragging = null, holding = false, cool = 0;
  return ({ shell, scene }) => {
    cool -= 1 / 20;
    const ds = (shell.targets.distractions || []).filter(d => !d.parked && d.on !== false);
    if (park && ds.length && !dragging && cool <= 0) { const d = ds[0]; fi.down(d.x, d.y, 3); dragging = d; return; }
    if (dragging) { const m = shell.runs.parkIt.mapRect; fi.move(m.x + 20, m.y + 20, 3); fi.up(3); dragging = null; cool = 0.3; return; }
    if (tapDecoy && ds.length) { fi.tap(ds[0].x, ds[0].y); }
    const le = shell.runs.longExhale, rage = shell.meters.get('rage');
    if (breathe && le && rage) {
      if (le.phase === 'idle' && !holding && rage.value > 0.25) { fi.keyDown('Space'); holding = true; }
      if (holding && le.phase === 'full') { fi.keyUp('Space'); holding = false; }
    }
    const p = scene.nextPrint && scene.nextPrint();
    if (p && cool <= 0 && !holding && (!le || le.phase === 'idle')) { fi.tap(p.x, p.y); cool = 0.25; }
  };
}
