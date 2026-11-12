// The run kind (River Run): hold anywhere to sprint, let go to recover. Constant sprinting always burns out.
import { ctx, W, GY, SH, FH, FB, rr } from '../canvas.js';
import { SIGN_T, LOCK } from '../meter.js';
import { TOOLS } from '../tools/index.js';
import { createSetpieces } from '../setpieces.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawHadrosaur } from '../../art/props.js';

const TROT = 60, ME_X = 120, BURNOUT = 4;

export function createRun(sc, sh) {
  const A = sh.actors, me = A.me, SFX = sh.env.audio.SFX, input = sh.input;
  const fuel = sh.meters.get('fuel');
  const legs = TOOLS.burstRest.createRun({ mode: 'run' });
  const pieces = createSetpieces(sc.setpieces, sh);
  const trig = (sc.triggers || []).map(t => ({ ...t, fired: false }));
  const tgt = sc.target || { type: 'pack', speed: 95 };
  const rates = {};
  const k = {
    phase: 'run', done: false, result: null, px: 0, tx: tgt.lead != null ? tgt.lead : 140, nipX: sc.nip ? -40 : null,
    burnout: 0, peakFuel: fuel ? fuel.value : 0, wasHeld: false, stopAt: null, endT: 0, sprintT: 0, bursts: 0,
    speedFor(held) { return held && !(fuel && fuel.value >= LOCK) ? TROT * 3 : TROT; },
  };
  for (const m of sh.meters.list) { m.firstToolAt = null; m.peak = m.value; }
  sh.spaceTaken = true; sh.cx = 0; sh.clearChoices();
  me.x = me.tx = ME_X; me.face = 1; me.limp = false;
  A.scar.on = false; A.echo.on = false; A.nip.on = !!sc.nip; A.fang.on = false;
  sh.panelText = sc.panelText || 'HOLD anywhere to sprint. LET GO to rest.';
  if (sc.intro) sh.say(sc.intro, 5, 3, 'narr');
  if (sc.hint) sh.sayNext(sc.hint, 4, 'scar');
  const stops = (sc.restStops || []).map(s => ({ ...s, done: false }));
  const targetSpeed = t => {
    if (!tgt.pattern) return tgt.speed || 95;
    const total = tgt.pattern.reduce((a, p) => a + p.sec, 0); let x = t % total;
    for (const p of tgt.pattern) { if (x < p.sec) return p.speed; x -= p.sec; }
    return tgt.pattern[0].speed;
  };

  function finish(success) {
    k.phase = 'end'; k.endT = 0; sh.spaceTaken = false;
    const cool = k.peakFuel < SIGN_T[1] && sh.stats.tookOver === k.tookOverAtStart;
    const dTrust = success && cool && !k.burntOut ? 1 : 0;
    const early = fuel && ((fuel.firstToolAt !== null && fuel.firstToolAt < SIGN_T[1]) || fuel.peak < SIGN_T[1]);
    sh.stats.trustDelta += dTrust; sh.stats.earlyOf += 1; if (early && !k.burntOut) sh.stats.early += 1; sh.stats.calmChoices += success ? 1 : 0;
    if (tgt.type === 'prey') { if (success) sh.stats.mealsKept += 1; else sh.stats.mealsLost += 1; }
    const nipOk = sc.nip && k.nipX !== null && (k.px - k.nipX) < 140;
    if (dTrust > 0 && sc.strength && (!sc.nip || nipOk)) sh.stats.strengths.push(sc.strength);
    k.result = { success, dTrust, forced: !!k.burntOut, instinct: !!k.burntOut, early, calmRun: dTrust > 0, nipOk };
    if (dTrust > 0) SFX.swell();
  }
  function showCard() {
    k.phase = 'card';
    const r = k.result, s = fuel ? fuel.signs : ['', ''];
    const title = r.success ? (sc.success.title || (tgt.type === 'prey' ? 'CAUGHT IT' : 'YOU KEPT UP')) : (sc.fail.title || 'IT GOT AWAY');
    let body;
    if (k.burntOut) body = `"You burned out. Your signs were there: ${s[0]}, then ${s[1]}. Next time, rest at the very first one. Short bursts win."`;
    else if (r.dTrust > 0) body = '"Short bursts, then rest. You had speed left when it mattered."';
    else if (r.success) body = '"You got there, but you were running hot. Rest a little sooner next time."';
    else body = '"Not this time. Pace yourself: burst, rest, burst."';
    if (r.dTrust > 0 && sc.strength && (!sc.nip || r.nipOk)) body += `\n\nStrength: ${sc.strength}`;
    sh.showCard({ title, sub: r.success ? sc.success.line : sc.fail.line, good: r.dTrust > 0, bad: !r.success && k.burntOut,
      body: body + `\n\nPack trust: ${r.dTrust > 0 ? 'rising' : 'steady'}`, cb: () => { k.done = true; k.phase = 'done'; sh.panelText = ''; if (fuel) fuel.set(Math.min(fuel.value, 0.1)); pieces.stop(); A.nip.on = false; } });
  }
  k.tookOverAtStart = sh.stats.tookOver;

  k.update = dt => {
    pieces.update(dt, k.phase === 'run');
    const pausing = sh.updateTools(dt);
    if (k.phase === 'run') {
      const stop = stops.find(s => !s.done && k.px >= s.at);
      if (stop && !k.stopAt) { k.stopAt = stop; k.stopBase = sh.stats.toolUses.burstRest || 0; sh.say(stop.prompt, 6, 3, 'scar'); sh.panelText = 'REST STOP: hold BURST & REST for a real movement break.'; sh.pulseTool = 'burstRest'; }
      if (k.stopAt) {
        if ((sh.stats.toolUses.burstRest || 0) > k.stopBase) { k.stopAt.done = true; k.stopAt = null; sh.pulseTool = null; sh.panelText = sc.panelText || 'HOLD anywhere to sprint. LET GO to rest.'; sh.say('Good. Legs loose, head clear. Off we go.', 3, 2, 'scar'); }
        legs.update(dt, { held: false }); if (fuel) fuel.relieve(0.05 * dt, false);
        return;
      }
      for (const t of trig) if (!t.fired && k.px >= t.at) {
        t.fired = true; const m = sh.meters.get(t.meter); if (m) { m.spike(t.spike || 0.3); rates[t.meter] = t.simmer || 0.05; }
        sh.noteTrigger(); if (t.sfx && SFX[t.sfx]) SFX[t.sfx](); if (t.intro) sh.say(t.intro, 4.5, 3, 'narr'); if (t.hint) sh.sayNext(t.hint, 4);
      }
      if (!pausing) for (const [inst, r] of Object.entries(rates)) { const m = sh.meters.get(inst); if (m && r) m.simmer(r, dt); }
      const sceneHeld = !sh.activeTool && input.held({ x: 0, y: 70, w: W, h: SH() - 70 }, 'Space');
      let held = sceneHeld, speed;
      if (k.burnout > 0) { k.burnout = Math.max(0, k.burnout - dt); held = false; speed = 0; if (k.burnout === 0) { sh.say('Up you get. Short bursts this time.', 3, 2, 'scar'); } }
      else speed = sh.activeTool === 'oneThing' ? 0 : k.speedFor(held);
      const o = legs.update(dt, { held });
      if (fuel) {
        if (o.relief < 0) fuel.set(fuel.value - o.relief); else fuel.relieve(o.relief, false);
        if (k.wasHeld && !held && fuel.value >= SIGN_T[0] && fuel.firstToolAt === null) fuel.firstToolAt = fuel.value;
        k.peakFuel = Math.max(k.peakFuel, fuel.value);
      }
      if (held && !k.wasHeld) { k.bursts++; SFX.sprint(); }
      k.wasHeld = held;
      if (fuel && fuel.full && k.burnout === 0) {
        k.burnout = BURNOUT; k.burntOut = true; fuel.adapt(); sh.difficulty.simmerMul = 0.6; sh.difficulty.promptEarly = true;
        sh.stats.tookOver += 1; sh.stats.instinctChoices += 1;
        sh.say(`Burned out. ${sc.burnoutLine || 'Your legs just stop. Lie still and get your breath back.'}`, 4, 3, 'narr');
        if (!sh.rm && !sh.low) sh.shake = 0.3;
      }
      k.px += speed * dt;
      sh.cx = k.px * 0.6;
      k.tx += targetSpeed(sh.T) * dt * (tgt.type === 'pack' ? (k.burnout > 0 ? 0.3 : 1) : 1);
      if (k.nipX !== null) { k.nipX += (sc.nipSpeed || 70) * dt; if (k.px - k.nipX > 170 && !k.nipCalled) { k.nipCalled = true; sh.say("Nip is falling behind. He's tiring. Slow down for him?", 4, 2, 'scar'); } if (k.px - k.nipX < 120) k.nipCalled = false; }
      if (tgt.type === 'prey') {
        if (k.tx - k.px <= 12) finish(true);
        else if (k.tx >= sc.distance) finish(false);
      } else {
        if (tgt.type === 'pack' && k.tx - k.px > (tgt.maxGap || 320)) k.tx = k.px + (tgt.maxGap || 320);
        if (k.px >= sc.distance) finish(true);
      }
    } else if (k.phase === 'end') { k.endT += dt; if (k.endT > 1) showCard(); }
  };

  k.draw = () => {
    sh.drawWorldBack(); pieces.drawBack();
    const gap = k.tx - k.px, tX = Math.min(W - 30, ME_X + 30 + gap * 0.35);
    if (tgt.type === 'prey') drawHadrosaur(tX, GY() + 2, 0.55, sh.T * 3, 1, false);
    else { drawRaptor(tX, GY() + 2, 1.1, 'run', sh.T, 1, { scar: true, eye: '#fde68a' }); drawRaptor(tX + 34, GY() + 2, 1.0, 'run', sh.T + 0.3, 1, { eye: '#a7f3d0', rim: '#a7f3d0' }); }
    if (k.nipX !== null) drawRaptor(Math.max(14, ME_X - (k.px - k.nipX) * 0.35), GY() + 2, 0.72, 'run', sh.T * 0.8, 1, {});
    const running = k.burnout <= 0 && !k.stopAt && k.phase === 'run';
    sh.drawMe({ pose: k.burnout > 0 ? 'lie' : k.stopAt ? 'stand' : running ? (k.wasHeld ? 'run' : 'walk') : 'stand' });
    pieces.drawFront(); sh.drawWorldFront();
    // progress strip
    const y = SH() - 24, x0 = 20, x1 = W - 60;
    ctx.fillStyle = 'rgba(10,5,8,0.6)'; rr(x0 - 6, y - 10, x1 - x0 + 12, 22, 8); ctx.fill();
    const prog = Math.min(1, k.px / sc.distance);
    ctx.fillStyle = 'rgba(125,211,252,0.35)'; ctx.fillRect(x0, y, (x1 - x0) * prog, 3);
    ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * prog, y + 1, 5, 0, 7); ctx.fill();
    const tp = Math.min(1, k.tx / sc.distance); ctx.fillStyle = tgt.type === 'prey' ? '#fca5a5' : '#fde68a'; ctx.fillRect(x0 + (x1 - x0) * tp - 2, y - 5, 4, 12);
    if (k.burnout > 0) { ctx.textAlign = 'center'; ctx.font = FH(22); ctx.fillStyle = '#fca5a5'; ctx.fillText('BURNED OUT', W / 2, SH() * 0.4); ctx.font = FB(13, 600); ctx.fillStyle = '#fde68a'; ctx.fillText('Getting your breath back…', W / 2, SH() * 0.4 + 22); }
    else if (k.phase === 'run' && !k.stopAt && sh.T < 8) { ctx.textAlign = 'center'; ctx.font = FB(13, 600); ctx.fillStyle = 'rgba(224,242,254,0.75)'; ctx.fillText('HOLD ANYWHERE TO SPRINT · LET GO TO REST', W / 2, SH() * 0.35); }
    sh.drawPanel(); sh.drawCard();
  };
  return k;
}
