// Play-style bots that can play any scene kind through the real input layer.
import { TOOLS } from '../../src/engine/tools/index.js';
import { INSTINCTS } from '../../src/engine/meter.js';

const KEYS = ['q', 'w', 'e', 'r', 't'];

export function makeBot(policy, fi) {
  const st = { hold: null, ptr: false, drag: null, cool: 0, t: 0, ambushHeldT: 0 };
  const press = k => { if (st.hold === k) return; if (st.hold) fi.keyUp(st.hold); fi.keyDown(k); st.hold = k; };
  const release = () => { if (st.hold) { fi.keyUp(st.hold); st.hold = null; } };
  const ptrDown = () => { if (!st.ptr) { fi.down(200, 200, 7); st.ptr = true; } };
  const ptrUp = () => { if (st.ptr) { fi.up(7); st.ptr = false; } };
  const keyFor = (sh, id) => { const i = sh.tools.indexOf(id); return i === 0 && !sh.spaceTaken ? 'Space' : KEYS[i]; };

  // Use one tool to completion. Returns true while busy.
  function useTool(sh, id) {
    if (!sh.tools.includes(id)) id = sh.tools.includes('longExhale') ? 'longExhale' : sh.tools[0];
    const T = TOOLS[id].TOOL, run = sh.runs[id];
    if (T.kind === 'tap') {
      const r = sh.runs[id];
      if (!r || r.done) { if (!sh.activeTool && sh.targets.oneThing) sh.startTapTool(id); return !!sh.runs[id] && !sh.runs[id].done; }
      if (r.t > 1.3) { const b = r.targets[r.phase][0]; fi.tap(b.x + 2, b.y + 2); }
      return true;
    }
    if (T.kind === 'drag') return parkAll(sh);
    if (id === 'longExhale') {
      if (run.phase === 'idle' && st.hold !== keyFor(sh, id)) { press(keyFor(sh, id)); return true; }
      if (run.phase === 'full' || run.phase === 'out') { release(); return run.phase !== 'idle'; }
      return run.phase !== 'idle' || st.hold === keyFor(sh, id);
    }
    // break / ride: hold its key until it completes (its run resets when done)
    const before = sh.stats.toolUses[id] || 0;
    if (st.hold !== keyFor(sh, id)) { st.toolBase = before; press(keyFor(sh, id)); return true; }
    if (before > (st.toolBase || 0)) { release(); return false; }
    return true;
  }
  function parkAll(sh) {
    const ds = (sh.targets.distractions || []).filter(d => !d.parked && d.on !== false);
    if (st.drag) { const m = sh.runs.parkIt.mapRect; fi.move(m.x + 15, m.y + 15, 3); fi.up(3); st.drag = null; st.cool = 0.3; return true; }
    if (ds.length && st.cool <= 0) { fi.down(ds[0].x, ds[0].y, 3); st.drag = ds[0]; return true; }
    return false;
  }
  const hottest = sh => sh.meters.list.reduce((a, m) => (!a || m.value > a.value ? m : a), null);
  const calmChoice = sh => sh.choices.find(c => c.k === 'help' || c.k === 'peace') || sh.choices.find(c => !c.instinct);

  function calm({ shell: sh, runner }) {
    const sc = runner.scene; if (!sc) { release(); ptrUp(); return; }
    if (runner.step === 'repair') { if (sh.choices) sh.choiceCb('peace'); return; }
    if (sc.current !== undefined && sc.order !== undefined || runner.step === 'scene') { // teach Nip
      const id = sc.current; if (id) useTool(sh, id); else release(); return;
    }
    if (sc.nextPrint) { // track
      if (parkAll(sh)) return;
      const rage = sh.meters.get('rage'), le = sh.runs.longExhale;
      if (rage && le && (rage.value > 0.25 || le.phase !== 'idle' || st.hold)) { useTool(sh, 'longExhale'); return; }
      const p = sc.nextPrint(); if (p && st.cool <= 0) { fi.tap(p.x, p.y); st.cool = 0.25; }
      return;
    }
    if (sc.speedFor) { // run
      if (sc.stopAt) { release(); useTool(sh, 'burstRest'); return; }
      const ov = sh.meters.get('overload');
      if (ov && sh.runs.oneThing !== undefined && (ov.value > 0.3 || (sh.runs.oneThing && !sh.runs.oneThing.done))) { release(); if (useTool(sh, 'oneThing')) return; }
      const want = (st.t % 5) < 2; if (want) press('Space'); else if (st.hold === 'Space') release();
      return;
    }
    if (sc.pounce) { // ambush
      const rage = sh.meters.get('rage');
      if (sc.signalOn) { ptrUp(); release(); return; }
      if (sc.phase === 'settle' || sc.phase === 'hide') ptrDown();
      if (rage && (rage.value > 0.3 || sh.runs.longExhale.phase !== 'idle')) useTool(sh, 'longExhale');
      return;
    }
    // moment or moment-practice: finish a tool in progress before anything else
    if (sh.activeTool) { st.acted = true; useTool(sh, sh.activeTool); return; }
    // a calm player hears the opening lines out before first acting (a child reads them first)
    if (!st.acted && (sh.msgT > 0 || sh.queue.length) && !st.hold && sh.heat < 0.6) return;
    if (st.hold) st.acted = true;
    const hot = hottest(sh);
    const busy = sh.activeTool || st.hold;
    if (hot && (hot.value >= 0.25 || busy)) { const id = INSTINCTS[hot.instinct].tool; if (useTool(sh, id)) return; }
    if (sh.choices && sh.heat < 0.5 && !sh.activeTool && !st.hold) { const c = calmChoice(sh); if (c) sh.choiceCb(c.k); }
  }
  function lazy(ctx) {
    const { shell: sh, runner } = ctx, sc = runner.scene;
    if (!sc || runner.step === 'practice' || runner.step === 'scene' || runner.step === 'repair') return calm(ctx);
    if (sc.nextPrint) { const p = sc.nextPrint(); if (p && st.cool <= 0) { fi.tap(p.x, p.y); st.cool = 0.25; } return; }
    if (sc.speedFor) { if (sc.stopAt) useTool(sh, 'burstRest'); return; }
    if (sc.pounce) { if (sc.signalOn) ptrUp(); else ptrDown(); return; }
    if (sh.choices) { const c = sh.choices.find(x => !x.instinct); if (c) sh.choiceCb(c.k); }
  }
  function neverAct(ctx) {
    const { runner } = ctx, sc = runner.scene;
    if (!sc || runner.step === 'practice' || runner.step === 'scene' || runner.step === 'repair') return calm(ctx);
    if (sc.speedFor && sc.stopAt) useTool(ctx.shell, 'burstRest'); // rest stops wait for a break
  }
  function alwaysInstinct(ctx) {
    const { shell: sh, runner } = ctx, sc = runner.scene;
    if (!sc || runner.step === 'practice' || runner.step === 'scene' || runner.step === 'repair') return calm(ctx);
    if (sc.nextPrint) { const p = sc.nextPrint(); if (p && st.cool <= 0) { fi.tap(p.x, p.y); st.cool = 0.25; } return; }
    if (sc.speedFor) { if (sc.stopAt) { useTool(sh, 'burstRest'); return; } press('Space'); return; }
    if (sc.pounce) { if (sc.phase === 'settle') { ptrDown(); st.ambushHeldT = 0; } else if (sc.phase === 'hide') { st.ambushHeldT += 1 / 20; if (st.ambushHeldT > 1) ptrUp(); } return; }
    if (sh.choices) { const c = sh.choices.find(x => x.instinct); if (c) sh.choiceCb(c.k); }
  }
  function learns(ctx) { return ctx.shell.stats.tookOver > 0 ? calm(ctx) : neverAct(ctx); }

  const P = { calm, lazy, neverAct, alwaysInstinct, learns }[policy];
  let lastScene = null;
  return ctx => {
    st.t += 1 / 20; st.cool -= 1 / 20;
    if (ctx.runner.scene !== lastScene) { release(); ptrUp(); st.drag = null; lastScene = ctx.runner.scene; st.t = 0; st.acted = false; }
    P(ctx);
  };
}
