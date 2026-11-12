import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeShell, runScene, makeProfile, oneThingBot, calmBot } from './harness.js';
import { KINDS } from '../../src/play/runner.js';
import { createTeachNip } from '../../src/engine/kinds/teachNip.js';
import { rankFor } from '../../src/model/progress.js';
import { TOOL_ORDER } from '../../src/engine/tools/index.js';
import CH from '../../src/data/chapters/6-finale.js';

const ALL = TOOL_ORDER.slice();
function setup(sc) {
  const { shell, fi } = makeShell({ theme: 'ash', profile: makeProfile({ toolbelt: ALL }) });
  shell.setStage({ instincts: sc.meters, tools: ALL, chooseTool: true, targets: { oneThing: sc.oneThing || null, distractions: null } });
  return { shell, fi, scene: KINDS[sc.kind](sc, shell) };
}
const byId = id => [...CH.scenarios.test, ...CH.scenarios.mix, ...CH.scenarios.big].find(s => s.id === id);
const rhythm = (fi, on, off) => { let t = 0, held = false; return () => { t += 1 / 20; const want = (t % (on + off)) < on; if (want !== held) { want ? fi.keyDown('Space') : fi.keyUp('Space'); held = want; } }; };

test('every finale scene shows the whole toolbelt with no hint', () => {
  for (const sc of [...CH.scenarios.test, ...CH.scenarios.mix, ...CH.scenarios.big]) assert.equal(sc.chooseTool, true, sc.id);
});

test('eruption: the matching tool (One Thing) earns trust', () => {
  const s = setup(byId('eruption'));
  runScene(s.shell, s.scene, oneThingBot(s.fi), { dt: 1 / 20, maxSecs: 200 });
  assert.equal(s.scene.result.dTrust, 1);
});

test('eruption: the wrong tool (Long Exhale only) still finishes the scene', () => {
  const s = setup(byId('eruption'));
  runScene(s.shell, s.scene, oneThingBot(s.fi, { onlyExhale: true }), { dt: 1 / 20, maxSecs: 200 });
  assert.equal(s.scene.done, true);
  assert.equal(s.shell.meters.get('overload').firstToolAt, null);
});

test('lava stones: holding still and going on the signal earns trust', () => {
  const s = setup(byId('lava-stones'));
  let holding = false;
  runScene(s.shell, s.scene, ({ scene }) => {
    if (!scene.signalOn && !holding && scene.phase !== 'end') { s.fi.down(200, 200, 7); holding = true; }
    if (scene.signalOn && holding) { s.fi.up(7); holding = false; }
  }, { dt: 1 / 20, maxSecs: 120 });
  assert.equal(s.scene.result.dTrust, 1);
});

test('the run out: short bursts and rests earn trust', () => {
  const s = setup(byId('the-run-out'));
  runScene(s.shell, s.scene, rhythm(s.fi, 2, 3), { dt: 1 / 20, maxSecs: 300 });
  assert.equal(s.scene.result.success, true); assert.equal(s.scene.result.dTrust, 1);
});

test('Fang is trapped: a calm HELP HIM sets finaleCalm and makes you Apex', () => {
  const sc = byId('fang-is-trapped');
  const s = setup(sc);
  const bot = calmBot(s.fi);
  runScene(s.shell, s.scene, ctx => { if (s.shell.choices && s.shell.heat < 0.5 && s.shell.runs.longExhale.phase === 'idle' && s.shell.stats.toolUses.longExhale) s.shell.choiceCb('help'); else bot(ctx); }, { dt: 1 / 20, maxSecs: 200 });
  assert.equal(s.scene.result.choice, 'help');
  assert.equal(s.shell.stats.finaleCalm, true);
  assert.equal(rankFor(2, s.shell.stats.finaleCalm).name, 'Apex');
});

test('teach Nip completes after each tool on the belt is done once', () => {
  const { shell, fi } = makeShell({ theme: 'ash', profile: makeProfile({ toolbelt: ALL }) });
  shell.setStage({ instincts: ['rage'], tools: ALL });
  const tn = createTeachNip(shell);
  let t = 0, holding = null, dragging = false;
  while (!tn.done && t < 200) {
    if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
    else {
      const id = tn.current;
      if (id === 'longExhale') { const le = shell.runs.longExhale; if (le.phase === 'idle' && holding !== 'Space') { fi.keyDown('Space'); holding = 'Space'; } if (holding === 'Space' && le.phase === 'full') { fi.keyUp('Space'); holding = null; } }
      if (id === 'oneThing') { const r = shell.runs.oneThing; if (!r || r.done) shell.startTapTool('oneThing'); else if (r.t > 1.3) { const b = r.targets[r.phase][0]; fi.tap(b.x + 2, b.y + 2); } }
      if (id === 'parkIt') { const d = (shell.targets.distractions || []).find(x => !x.parked); if (d && !dragging) { fi.down(d.x, d.y, 3); dragging = true; } else if (dragging) { const m = shell.runs.parkIt.mapRect; fi.move(m.x + 10, m.y + 10, 3); fi.up(3); dragging = false; } }
      if (id === 'burstRest' && holding !== 'r') { if (holding) fi.keyUp(holding); fi.keyDown('r'); holding = 'r'; }
      if (id === 'waitSignal' && holding !== 't') { if (holding) fi.keyUp(holding); fi.keyDown('t'); holding = 't'; }
    }
    shell.update(1 / 20); if (!shell.card) tn.update(1 / 20); shell.input.beginFrame(); t += 1 / 20;
  }
  assert.equal(tn.done, true);
  for (const id of ALL) assert.ok(shell.stats.toolUses[id] >= 1, id);
});
