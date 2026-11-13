// The track kind (Fern Maze): follow the scent trail one print at a time while shiny things try to pull you away.
// Park It: drag the distraction onto the scent map. Explore it after the hunt.
import { ctx, W, GY, SH, hash } from '../canvas.js';
import { SIGN_T } from '../meter.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawFootprint, drawBeetle, drawButterfly, drawAmber, drawCallBubble } from '../../art/props.js';

const STEP = 70, ME_X = 120, TAP_R = 36;

export function createTrack(sc, sh) {
  const A = sh.actors, me = A.me, SFX = sh.env.audio.SFX;
  const drift = sh.meters.get('drift'), rage = sh.meters.get('rage');
  const ds = []; sh.targets.distractions = ds;
  const pending = (sc.distractions || []).map(d => ({ ...d, spawned: false }));
  const trig = (sc.triggers || []).map(t => ({ ...t, fired: false }));
  const rates = {};
  const k = {
    phase: 'live', printIndex: 0, fadeT: 0, misses: 0, done: false, result: null, parkHeat: [], camTarget: 0, wanderTo: null, endT: 0,
    nextPrint() {
      if (k.phase !== 'live' || k.printIndex >= sc.prints) return null;
      return { x: worldX(k.printIndex) - sh.cx, y: printY(k.printIndex) };
    },
    printAlpha() { return drift && drift.locked ? 0.3 : 1; },
  };
  for (const m of sh.meters.list) { m.firstToolAt = null; m.peak = m.value; }
  sh.cx = 0; k.camTarget = 0;
  me.x = me.tx = ME_X; me.face = 1; me.limp = false; me.standT = 0;
  A.scar.on = false; A.echo.on = true; A.echo.x = A.echo.tx = 50; A.echo.face = 1;
  A.nip.on = false; A.fang.on = false;
  sh.clearChoices();
  sh.panelText = sc.panelText || 'Follow the trail. Tap the glowing print.';
  if (sc.intro) sh.say(sc.intro, 5, 3, 'narr');
  if (sc.hint) sh.sayNext(sc.hint, 4, 'echo');

  function worldX(i) { return 250 + i * STEP; }
  function printY(i) { return GY() - 2 + Math.sin(i * 1.7) * 5; }

  function spawn(d) {
    d.spawned = true;
    const obj = { id: d.find.name, type: d.type, x: 230 + hash(d.at * 7 + 1) * 110, y: GY() - 120 - hash(d.at * 3 + 2) * 70, r: 30,
      parked: false, on: true, simmer: d.simmer || 0.06, find: d.find, born: sh.T };
    if (d.type === 'nip') {
      A.nip.on = true; A.nip.x = 470; A.nip.tx = obj.x + 30; A.nip.sp = 120; obj.y = GY() - 70; obj.x = Math.min(obj.x, W - 70);
      // Grab Nip by his "PLAY WITH ME!" bubble or by Nip himself.
      obj.hit = (px, py) => (Math.abs(px - obj.x) <= 66 && py >= obj.y - 28 && py <= obj.y + 18) || (Math.abs(px - A.nip.x) <= 42 && py >= GY() - 44 && py <= GY() + 10);
    }
    ds.push(obj);
    if (drift) drift.spike((d.spike != null ? d.spike : 0.18) + (sh.difficulty.spikeAdd || 0));
    if (d.intro) sh.say(d.intro, 4, 3, 'narr');
    if (d.hint) sh.sayNext(d.hint, 4, 'echo');
    SFX.chirp();
  }
  function fireTrig(t) {
    t.fired = true; t.left = t.stay || 9;
    const a = A[t.who]; if (a) { a.on = true; a.x = 470; a.tx = t.enter || 330; a.sp = 140; a.face = -1; }
    const m = sh.meters.get(t.meter || 'rage');
    if (m) { m.spike((t.spike || 0.3) + (sh.difficulty.spikeAdd || 0)); rates[m.instinct] = t.simmer || 0.05; }
    sh.noteTrigger();
    if (t.intro) sh.say(t.intro, 4.5, 3, 'narr');
    if (t.hint) sh.sayNext(t.hint, 4, 'echo');
  }
  function takeover(m) {
    k.phase = 'wander'; k.endT = 0; m.set(1);
    for (const x of sh.meters.list) if (x.full) x.adapt();
    sh.difficulty.simmerMul = 0.6; sh.difficulty.promptEarly = true;
    sh.stats.tookOver += 1; sh.stats.earlyOf += 1; sh.stats.instinctChoices += 1;
    k.takenBy = m.instinct;
    if (m.instinct === 'rage') { const f = A.fang; me.tx = f.on ? f.x - 40 : 320; me.sp = 260; SFX.roar(); }
    else { const d = ds.find(x => !x.parked) || { x: 300 }; me.tx = Math.min(360, d.x); me.sp = 160; }
    k.result = { forced: true, success: false, dTrust: 0, instinct: true, early: false };
  }
  function succeed() {
    k.phase = 'end'; k.endT = 0;
    const allParked = ds.every(d => d.parked);
    const coolParks = k.parkHeat.every(v => v < SIGN_T[1]);
    const dTrust = allParked && coolParks ? 1 : 0;
    const early = drift && ((drift.firstToolAt !== null && drift.firstToolAt < SIGN_T[1]) || drift.peak < SIGN_T[1]);
    sh.stats.trustDelta += dTrust; sh.stats.earlyOf += 1; if (early) sh.stats.early += 1; sh.stats.calmChoices += 1;
    if (dTrust > 0 && sc.strength) sh.stats.strengths.push(sc.strength);
    k.result = { forced: false, success: true, dTrust, instinct: false, early, calmRun: dTrust > 0, usedTool: k.parkHeat.length > 0 };
    SFX.swell();
  }
  function showCard() {
    k.phase = 'card';
    const r = k.result, signs = (k.takenBy === 'rage' ? rage : drift).signs;
    if (r.success) {
      const parkedN = ds.filter(d => d.parked).length;
      sh.showCard({ title: sc.success.title || 'TRAIL FOLLOWED', sub: sc.success.line, good: r.dTrust > 0,
        body: (r.dTrust > 0 ? `"You parked ${parkedN === 1 ? 'it' : 'them'} and came back to the trail. That's the whole trick."` : '"You got there. Next time, park the shiny thing as soon as it shows up."')
          + (parkedN ? '\n\nParked finds are waiting for you in the Den.' : '') + (r.dTrust > 0 && sc.strength ? `\n\nStrength: ${sc.strength}` : '')
          + `\n\nPack trust: ${r.dTrust > 0 ? 'rising' : 'steady'}`,
        cb: finish });
    } else {
      const rageWon = k.takenBy === 'rage';
      sh.showCard({ title: rageWon ? 'RAGE TOOK OVER' : 'DRIFT TOOK OVER', sub: rageWon ? (sc.onRage || 'You go for Fang, and the trail goes cold behind you.') : sc.onTakeover.line, bad: true,
        body: `"Your signs were there: ${signs[0]}, then ${signs[1]}. Next time, ${rageWon ? 'breathe' : 'park it'} at the very first one. It's easiest when it's small."\n\nThe hunt failed this time. Pack trust: steady`,
        cb: finish });
    }
  }
  function finish() {
    if (drift) drift.set(Math.min(drift.value, 0.25));
    if (rage) rage.set(Math.min(rage.value, 0.4));
    sh.targets.distractions = []; A.nip.on = false; A.fang.on = false;
    k.done = true; k.phase = 'done'; sh.panelText = '';
  }

  k.update = dt => {
    const pausing = sh.updateTools(dt);
    for (const d of ds) if (d.parked && !d.notedHeat) { d.notedHeat = true; k.parkHeat.push(drift ? drift.value + 0.25 : 0); if (d.type === 'nip') { A.nip.tx = 470; A.nip.sp = 60; sh.say(d.find.parkLine || 'Not now, Nip. After the hunt.', 3, 2, 'scar'); } }
    // camera follows the trail
    const dc = k.camTarget - sh.cx; if (Math.abs(dc) > 0.5) sh.cx += Math.sign(dc) * Math.min(Math.abs(dc), 150 * dt);
    me.walking = Math.abs(dc) > 0.5;
    sh.move(A.nip, dt); sh.move(A.fang, dt);
    if (k.phase === 'live') {
      for (const d of pending) if (!d.spawned && k.printIndex >= d.at) spawn(d);
      for (const t of trig) {
        if (!t.fired && k.printIndex >= t.at) fireTrig(t);
        if (t.fired && t.left > 0) { t.left -= dt; if (t.left <= 0) { const a = A[t.who]; if (a) { a.tx = 480; a.sp = 120; } rates[t.meter || 'rage'] = 0; } }
      }
      if (!pausing && !sh.listening(k, dt)) {
        if (drift) drift.simmer(ds.reduce((a, d) => a + (d.parked ? 0 : d.simmer), sc.baseSimmer || 0), dt);
        for (const [inst, r] of Object.entries(rates)) { const m = sh.meters.get(inst); if (m && r) m.simmer(r, dt); }
      }
      // taps on the next print
      const p = k.nextPrint();
      if (p && !me.walking) for (const tap of sh.input.taps) {
        if (Math.hypot(tap.x - p.x, tap.y - p.y) <= TAP_R && k.printAlpha() > 0.31 || Math.hypot(tap.x - p.x, tap.y - p.y) <= TAP_R * 0.6) {
          k.printIndex++; k.fadeT = 0; k.misses = 0; SFX.step();
          k.camTarget = worldX(k.printIndex - 1) - ME_X - 20;
          break;
        }
      }
      k.fadeT += dt;
      if (k.fadeT > (sc.fadeSec || 6)) {
        k.fadeT = 0; k.misses++;
        if (k.misses >= 3) {
          k.misses = 0; k.printIndex++; k.camTarget = worldX(k.printIndex - 1) - ME_X - 20;
          sh.say("The trail's going cold. Come on, I'll walk you to the next one. Tap the glowing print.", 4, 2, 'echo');
        }
      }
      const full = sh.meters.list.find(m => m.full);
      if (full) takeover(full);
      else if (k.printIndex >= sc.prints) succeed();
    } else if (k.phase === 'wander') {
      k.endT += dt; sh.move(me, dt);
      if (k.endT > 2.2) showCard();
    } else if (k.phase === 'end') {
      k.endT += dt;
      if (k.endT > 1.2) showCard();
    }
  };

  k.draw = () => {
    sh.drawWorldBack();
    const alpha = k.printAlpha();
    for (let i = Math.max(0, k.printIndex - 3); i < Math.min(sc.prints, k.printIndex + 1); i++) {
      const x = worldX(i) - sh.cx; if (x < -20 || x > W + 20) continue;
      const isNext = i === k.printIndex && k.phase === 'live';
      const glow = isNext ? Math.max(0.2, 1 - k.fadeT / (sc.fadeSec || 6)) * (0.75 + 0.25 * Math.sin(sh.T * 5)) : 0;
      drawFootprint(x, printY(i), glow, isNext ? alpha : 0.5, 1.8);
    }
    if (k.printIndex >= sc.prints - 1) { const gx = worldX(sc.prints) - sh.cx; ctx.fillStyle = 'rgba(134,239,172,0.18)'; ctx.beginPath(); ctx.arc(gx, GY() - 20, 30, 0, 7); ctx.fill(); }
    const E = A.echo;
    if (E.on) drawRaptor(E.x, GY() + 2, E.s, me.walking ? 'walk' : 'crouch', sh.T * 0.8, 1, { eye: '#a7f3d0', rim: '#a7f3d0', feathers: 10 });
    for (const who of ['nip', 'fang']) {
      const a = A[who]; if (!a.on) continue;
      const mv = Math.abs(a.tx - a.x) > 1;
      drawRaptor(a.x, GY() + 2, a.s, mv ? 'walk' : (who === 'fang' ? (Math.sin(sh.T * 4) > 0 ? 'crouch' : 'stand') : 'crouch'), sh.T, mv ? (a.tx > a.x ? 1 : -1) : -1,
        { eye: who === 'fang' ? '#ef4444' : '#fbbf24', snarl: who === 'fang', hk: who === 'fang' ? 0.6 : 0, rim: '#a7f3d0' });
    }
    sh.drawMe(me.walking ? { pose: 'walk' } : (k.phase === 'wander' ? { pose: 'run' } : { pose: 'crouch' }));
    for (const d of ds) {
      if (d.parked) continue;
      const x = d.dragX != null ? d.dragX : d.x + Math.sin(sh.T * 1.3 + d.r) * 6, y = d.dragY != null ? d.dragY : d.y + Math.cos(sh.T * 1.7) * 4;
      if (d.type === 'beetle') drawBeetle(x, y, sh.T, 1.5);
      else if (d.type === 'butterfly') drawButterfly(x, y, sh.T);
      else if (d.type === 'amber') drawAmber(x, y, sh.T, 1.4);
      else if (d.type === 'call') drawCallBubble(x, y, '???');
      else if (d.type === 'nip') drawCallBubble(x, y, 'PLAY WITH ME!');
      if (d.dragX == null && sh.T - d.born < 6) { ctx.strokeStyle = `rgba(134,239,172,${0.4 + 0.3 * Math.sin(sh.T * 6)})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(52, 168); ctx.stroke(); ctx.setLineDash([]); }
    }
    sh.drawWorldFront();
    if (sh.runs.parkIt) sh.runs.parkIt.draw(ds.filter(d => d.parked), sh.T);
    sh.drawPanel(); sh.drawCard();
  };
  return k;
}
