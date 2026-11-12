// The ambush kind (Ambush Ridge): hold still to stay hidden. The urge comes in waves; ride them out.
// Let go (or tap POUNCE) only when Scar gives the signal.
import { ctx, W, GY, SH, FH, FB } from '../canvas.js';
import { SIGN_T, SPIKE_CAP } from '../meter.js';
import { createSetpieces } from '../setpieces.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawCallBubble } from '../../art/props.js';

const BASE = 0.12, SETTLE_SIMMER = 0.05, TWITCH_DECAY = 0.15;

export function createAmbush(sc, sh) {
  const A = sh.actors, me = A.me, SFX = sh.env.audio.SFX, input = sh.input, audio = sh.env.audio;
  const urge = sh.meters.get('urge');
  const pieces = createSetpieces(sc.setpieces, sh);
  const waves = sc.waves || [], twitches = (sc.twitches || []).map(t => ({ ...t, done: false }));
  const falses = (sc.falseSignals || []).map(f => ({ ...f, done: false }));
  const trig = (sc.triggers || []).map(t => ({ ...t, fired: false }));
  const rates = {};
  const k = {
    phase: 'settle', heldT: 0, signalOn: false, falseOn: false, signalT: 0, done: false, result: null,
    settleAcc: 0, twitch: 0, calmAcc: 0, endT: 0, urgeAtSignal: null,
    pounce() { if (k.phase === 'signal') succeed(); else if (k.phase === 'hide') early('Too soon. The herd scatters before you get close.'); },
  };
  for (const m of sh.meters.list) { m.firstToolAt = null; m.peak = m.value; }
  sh.spaceTaken = true; sh.clearChoices(); sh.stonesSettled = false;
  me.x = me.tx = 150; me.face = 1; me.limp = false;
  A.scar.on = true; A.scar.x = A.scar.tx = 58; A.echo.on = false; A.nip.on = !!sc.nip; A.fang.on = false;
  if (sc.nip) { A.nip.x = A.nip.tx = 100; }
  sh.panelText = 'HOLD anywhere to stay hidden. LET GO only when Scar signals.';
  if (sc.intro) sh.say(sc.intro, 5, 3, 'narr');
  sh.sayNext(sc.hint || 'Hold anywhere to hide. Stay still.', 4, 'scar');

  const held = () => !sh.activeTool && input.held({ x: 0, y: 70, w: W, h: SH() - 70 }, 'Space');
  const waveLevel = t => {
    let lv = 0;
    for (const w of waves) {
      const dt = t - w.at; if (dt < 0) continue;
      const c = dt < w.rise ? w.peak * dt / w.rise : w.peak * Math.max(0, 1 - (dt - w.rise) / w.fall);
      lv = Math.max(lv, c);
    }
    return lv;
  };

  function end(outcome, opts) {
    k.phase = 'end'; k.endT = 0; k.signalOn = false; k.falseOn = false; sh.clearChoices(); sh.spaceTaken = false;
    const success = outcome === 'success';
    const cool = success && (k.urgeAtSignal == null || k.urgeAtSignal < SIGN_T[1]);
    const dTrust = cool ? 1 : 0;
    sh.stats.trustDelta += dTrust; sh.stats.earlyOf += 1; if (cool) sh.stats.early += 1;
    if (success) sh.stats.calmChoices += 1; else if (outcome !== 'late') sh.stats.instinctChoices += 1;
    if (sc.meal !== false) { if (success) sh.stats.mealsKept += 1; else sh.stats.mealsLost += 1; }
    if (cool && sc.strength) sh.stats.strengths.push(sc.strength);
    k.result = { outcome, success, dTrust, forced: !!(opts && opts.forced), instinct: outcome === 'early' || outcome === 'takeover' || outcome === 'blown', early: cool, calmRun: cool };
    if (success) { me.tx = 320; me.sp = 260; SFX.roar(); if (cool) SFX.swell(); }
    else if (outcome !== 'late') { SFX.bad(); }
  }
  function succeed() { k.urgeAtSignal = k.urgeAtSignal ?? (urge ? urge.value : 0); end('success'); }
  function early(line) { k.earlyLine = line; end('early'); }
  function takeover(m) {
    m.set(1); for (const x of sh.meters.list) if (x.full) x.adapt();
    sh.difficulty.simmerMul = 0.6; sh.difficulty.promptEarly = true; sh.stats.tookOver += 1;
    k.takenBy = m.instinct;
    end(m.instinct === 'rage' ? 'blown' : 'takeover', { forced: true });
    me.tx = m.instinct === 'rage' && A.fang.on ? A.fang.x - 40 : 320; me.sp = 260;
  }
  function showCard() {
    k.phase = 'card';
    const r = k.result, o = sc.outcomes[r.outcome] || {}, signs = (k.takenBy === 'rage' ? sh.meters.get('rage') : urge).signs;
    let body;
    if (r.outcome === 'success') body = r.dTrust > 0 ? '"You felt it rise, let it pass, and waited for the signal. That\'s what makes a hunter."' : '"You waited, but you were buzzing at the signal. Ride the next wave a bit longer."';
    else if (r.outcome === 'early') body = '"The urge passes if you let it peak. It always comes back down. Next time, ride the wave."';
    else if (r.outcome === 'late') body = '"You held so still you missed the cue. Watch Scar\'s tail. When it flicks, go."';
    else body = `"Your signs were there: ${signs[0]}, then ${signs[1]}. Next time, ${k.takenBy === 'rage' ? 'breathe' : 'hide and ride it out'} at the very first one."`;
    if (r.dTrust > 0 && sc.strength) body += `\n\nStrength: ${sc.strength}`;
    const titles = { success: o.title || 'PERFECT TIMING', early: 'TOO SOON', late: 'A BEAT LATE', takeover: 'THE URGE TOOK OVER', blown: 'RAGE TOOK OVER' };
    sh.showCard({ title: titles[r.outcome], sub: o.line || k.earlyLine || '', good: r.dTrust > 0, bad: r.forced,
      body: body + `\n\nPack trust: ${r.dTrust > 0 ? 'rising' : 'steady'}`,
      cb: () => { k.done = true; k.phase = 'done'; sh.panelText = ''; pieces.stop(); A.nip.on = false; A.fang.on = false; if (urge) urge.set(Math.min(urge.value, 0.25)); } });
  }

  k.update = dt => {
    pieces.update(dt, k.phase === 'hide');
    const h = held();
    // compute urge from waves before tools act, then credit any tool relief
    if (urge && (k.phase === 'settle' || k.phase === 'hide' || k.phase === 'signal')) {
      if (k.phase === 'settle' && !h) k.settleAcc += SETTLE_SIMMER * sh.difficulty.simmerMul * dt;
      k.twitch = Math.max(0, k.twitch - TWITCH_DECAY * dt);
      const raw = BASE + k.settleAcc + waveLevel(k.heldT) + k.twitch - k.calmAcc;
      urge.set(Math.max(0, k.phase === 'settle' ? Math.min(1, raw) : Math.min(SPIKE_CAP, raw)));
    }
    const before = urge ? urge.value : 0;
    const pausing = sh.updateTools(dt);
    if (urge && urge.value < before) k.calmAcc += before - urge.value;
    for (const [inst, r] of Object.entries(rates)) { const m = sh.meters.get(inst); if (m && r && !pausing) m.simmer(r, dt); }
    sh.move(A.fang, dt); sh.move(me, dt);

    if (k.phase === 'settle') {
      if (h) { k.phase = 'hide'; k.settleAcc = Math.min(k.settleAcc, 0.3); sh.say('Good. Still. Feel the urge come, and let it go.', 3, 1); }
      else if (urge && urge.full) takeover(urge);
    } else if (k.phase === 'hide') {
      k.heldT += dt;
      for (const t of twitches) if (!t.done && k.heldT >= t.at) { t.done = true; k.twitch += t.spike; SFX.snarl(); if (t.line) sh.say(t.line, 3, 2, 'narr'); }
      for (const f of falses) {
        if (!f.done && k.heldT >= f.at) { f.done = true; f.until = k.heldT + 1.6; k.falseOn = true; SFX.chirp(); sh.say(f.line || 'Nip chirps: "Now? NOW?" That\'s not the signal.', 3, 2, 'narr'); }
        if (f.done && k.falseOn && k.heldT > f.until) k.falseOn = false;
      }
      for (const t of trig) if (!t.fired && k.heldT >= t.at) {
        t.fired = true; t.left = t.stay || 10; const a = A[t.who]; if (a) { a.on = true; a.x = 470; a.tx = t.enter || 320; a.sp = 120; a.face = -1; }
        const m = sh.meters.get(t.meter || 'rage'); if (m) { m.spike(t.spike || 0.3); rates[m.instinct] = t.simmer || 0.05; }
        sh.noteTrigger(); if (t.intro) sh.say(t.intro, 4.5, 3, 'narr'); if (t.hint) sh.sayNext(t.hint, 4, 'scar');
      }
      for (const t of trig) if (t.fired && t.left > 0) { t.left -= dt; if (t.left <= 0) { const a = A[t.who]; if (a) { a.tx = 480; } rates[t.meter || 'rage'] = 0; } }
      const full = sh.meters.list.find(m => m !== urge && m.full);
      if (full) takeover(full);
      else if (!h) early(sc.earlyLine || 'Too soon. The herd scatters before you get close.');
      else if (k.heldT >= sc.signalAt) {
        k.phase = 'signal'; k.signalOn = true; k.signalT = 0; k.urgeAtSignal = urge ? urge.value : 0; sh.stonesSettled = true;
        SFX.signal(); audio.vibrate(60);
        sh.say(sc.signalLine || "Scar's tail flicks. NOW!", 2.5, 3, 'scar');
        sh.setChoices([{ k: 'pounce', label: sc.pounceLabel || 'POUNCE!', col: '#c084fc', always: true }], () => k.pounce());
      }
    } else if (k.phase === 'signal') {
      k.signalT += dt;
      if (!h) succeed();
      else if (k.signalT > (sc.window || 1.5)) end('late');
    } else if (k.phase === 'end') { k.endT += dt; if (k.endT > 1.3) showCard(); }
  };

  k.draw = () => {
    sh.drawWorldBack(); pieces.drawBack();
    const S = A.scar, flick = k.signalOn ? Math.sin(sh.T * 30) * 0.6 : 0;
    drawRaptor(S.x, GY() + 2, S.s, 'still', sh.T, 1, { scar: true, eye: '#fde68a', tail: flick ? sh.T * 12 : sh.T * 0.2 });
    if (k.signalOn) { ctx.strokeStyle = `rgba(253,230,138,${0.6 + 0.4 * Math.sin(sh.T * 20)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(S.x - 50, GY() - 30, 18 + (k.signalT * 30) % 20, 0, 7); ctx.stroke(); }
    if (A.nip.on) { drawRaptor(A.nip.x, GY() + 2, A.nip.s, 'still', sh.T, 1, {}); if (k.falseOn) drawCallBubble(A.nip.x + 10, GY() - 60, 'NOW? NOW?'); }
    if (A.fang.on) drawRaptor(A.fang.x, GY() + 2, A.fang.s, Math.abs(A.fang.tx - A.fang.x) > 1 ? 'walk' : (Math.sin(sh.T * 4) > 0 ? 'crouch' : 'stand'), sh.T, -1, { eye: '#ef4444', snarl: true, hk: 0.6 });
    const hiding = k.phase === 'hide' || k.phase === 'signal' || (k.phase === 'settle' && held());
    sh.drawMe({ pose: k.phase === 'end' || k.phase === 'card' ? (k.result && k.result.success ? 'run' : 'stand') : hiding ? 'still' : 'crouch', alpha: hiding ? 0.85 : 1 });
    pieces.drawFront(); sh.drawWorldFront();
    ctx.textAlign = 'center';
    if (k.signalOn) { ctx.font = FH(54); ctx.fillStyle = `rgba(253,230,138,${0.7 + 0.3 * Math.sin(sh.T * 16)})`; ctx.fillText('NOW!', W / 2, SH() * 0.36); ctx.font = FB(13, 600); ctx.fillStyle = '#fef3c7'; ctx.fillText('Let go to pounce', W / 2, SH() * 0.36 + 24); }
    else if (k.phase === 'settle') { ctx.font = FH(22); ctx.fillStyle = `rgba(233,213,255,${0.6 + 0.4 * Math.sin(sh.T * 4)})`; ctx.fillText('HOLD ANYWHERE TO HIDE', W / 2, SH() * 0.36); }
    else if (k.phase === 'hide') { ctx.font = FB(12, 600); ctx.fillStyle = 'rgba(233,213,255,0.65)'; ctx.fillText('Stay still. Watch Scar. Feel the urge rise and pass.', W / 2, SH() * 0.33); }
    sh.drawPanel(); sh.drawCard();
  };
  return k;
}
