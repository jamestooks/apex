// The moment kind: something sets off an instinct, the meter climbs, the player uses a tool, then chooses.
// Generalised from the prototype's Rage events so every chapter's "trigger → tool → choice" scenes share it.
import { ctx, GY } from '../canvas.js';
import { SIGN_T, INSTINCTS } from '../meter.js';
import { TOOLS } from '../tools/index.js';
import { createSetpieces } from '../setpieces.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawCarcass } from '../../art/props.js';

const GAP_CALM = 0.35;

export function createMoment(sc, sh) {
  const A = sh.actors, me = A.me, SFX = sh.env.audio.SFX;
  const primary = sc.primary || sc.meters[0];
  const rates = {};
  const trig = (sc.triggers || []).map(t => ({ ...t, fired: false, started: false }));
  const pieces = createSetpieces(sc.setpieces, sh);
  const m = {
    phase: 'arrive', t: 0, liveT: 0, anim: 0, done: false, result: null, peakAfterTrigger: 0,
    carcass: sc.carcass ? { x: sc.carcass.x || 218, on: true } : null, meat: true, dust: null, pieces,
    choose(k, forced) { choose(k, forced); },
  };
  // Fresh per-scene bookkeeping on the (persistent) meters.
  for (const mm of sh.meters.list) { mm.firstToolAt = null; mm.peak = mm.value; }
  me.tx = me.x; me.limp = false; me.standT = 0; me.lying = false;
  if (sc.mentor) sh.mentor = sc.mentor;
  const mentor = A[sc.ally || sh.mentor || 'scar'];
  if (sc.ally === 'echo' || sh.mentor === 'echo') { A.echo.on = true; if (A.echo.x < 0) { A.echo.x = 40; A.echo.tx = 40; } }
  sh.clearChoices();
  sh.panelText = sc.arriveText || "Something's coming…";

  const targetActor = () => { const w = sc.target || (trig.length ? trig[trig.length - 1].who : null); return w && A[w] ? A[w] : null; };
  const meterFor = t => sh.meters.get(t.meter || primary) || sh.meters.list[0];

  function startTrigger(t) {
    t.started = true;
    if (t.who && A[t.who]) {
      const a = A[t.who]; a.on = true; a.pinned = !!t.pinned;
      if (t.fromX != null) a.x = t.fromX; else if (!t.keepX) a.x = 470;
      a.tx = t.enter != null ? t.enter : 280; a.face = -1; a.sp = t.sp || 110;
    } else t.wait = t.delay != null ? t.delay : 1.2;
  }
  function fire(t) {
    t.fired = true;
    const mm = meterFor(t);
    mm.spike((t.spike || 0) + (sh.difficulty.spikeAdd || 0));
    rates[mm.instinct] = Math.max(rates[mm.instinct] || 0, t.simmer || 0);
    m.peakAfterTrigger = Math.max(m.peakAfterTrigger, mm.value);
    sh.noteTrigger();
    if (t.sfx && SFX[t.sfx]) SFX[t.sfx]();
    const intro = (sh.profile.trust < 0 && t.introWary) ? t.introWary : t.intro;
    if (intro) sh.say(intro, 4.5, 3, 'narr');
    if (t.hint) sh.sayNext(t.hint, 4);
  }
  function arrived(t) {
    if (!t.started) return false;
    if (t.who && A[t.who]) return !sh.move(A[t.who], 0) && Math.abs(A[t.who].x - A[t.who].tx) < 1;
    return t.wait <= 0;
  }

  function choose(k, forced) {
    if (m.phase !== 'live') return;
    const c = sc.choices.find(x => x.k === k); if (!c) return;
    const heat = sh.heat;
    if (!forced && !c.instinct && !c.always && sh.locked) { SFX.bad(); sh.say(sc.lockLine || `Too much ${INSTINCTS[primary].name.toLowerCase()} to think straight. ${TOOLS[INSTINCTS[primary].tool].TOOL.name} first.`, 3, 3); return; }
    const o = sc.outcomes[k] || {};
    const pm = sh.meters.get(primary) || sh.meters.list[0];
    const calm = !c.instinct && heat < SIGN_T[1];
    const dTrust = o.trust != null && c.instinct ? o.trust : c.instinct ? -1 : (calm ? 1 : 0);
    const firstTool = pm ? pm.firstToolAt : null;
    const peak = Math.max(...sh.meters.list.map(x => x.peak));
    const early = !forced && !c.instinct && ((firstTool !== null && firstTool < SIGN_T[1]) || peak < SIGN_T[1]);
    m.result = { choice: k, forced: !!forced, calm, dTrust, heatAtChoice: heat, early, instinct: !!c.instinct,
      injured: !!o.injure, meatLost: o.meat === false, hurtPack: !!o.hurtPack, usedTool: firstTool !== null };
    const st = sh.stats;
    st.trustDelta += dTrust; st.earlyOf += 1; if (early) st.early += 1;
    if (c.instinct) st.instinctChoices += 1; else st.calmChoices += 1;
    if (o.injure) { st.injured = true; me.limp = true; }
    if (o.hurtPack) st.needsRepair = true;
    if (o.meat === false) m.meat = false;
    if (calm && (o.strength || sc.strength)) st.strengths.push(o.strength || sc.strength);
    if (calm && o.finaleCalm) st.finaleCalm = true;
    if (forced) {
      st.tookOver += 1;
      for (const x of sh.meters.list) if (x.full) x.adapt();
      sh.difficulty.simmerMul = 0.6; sh.difficulty.promptEarly = true; sh.difficulty.gapBoost = 1.8;
    }
    sh.clearChoices();
    m.phase = 'resolve'; m.anim = 0; m.choice = k; m.outcome = o; m.c = c;
    startAnim(o.anim || c.anim || (c.instinct ? 'charge' : 'stand'));
  }

  function startAnim(anim) {
    m.animName = anim;
    const tgt = targetActor();
    if (anim === 'charge') { me.tx = tgt ? tgt.x - 40 : 300; me.sp = 260; SFX.roar(); setTimeout(() => SFX.fight(), 300); }
    else if (anim === 'stand') { me.standT = 2.2; SFX.lowgrowl(); }
    else if (anim === 'retreat' || anim === 'leave') { me.tx = 112; me.face = -1; me.sp = 70; }
    else if (anim === 'ally') { SFX.chirp(); mentor.on = true; mentor.tx = me.x + 30; mentor.sp = 130; }
    else if (anim === 'bolt') { me.tx = -90; me.sp = 260; SFX.yelp(); }
    else if (anim === 'shelter' || anim === 'follow') { me.tx = sc.coverX || 96; me.sp = 90; if (anim === 'follow') { A.echo.on = true; A.echo.tx = (sc.coverX || 96) - 40; A.echo.sp = 90; } pieces.calm(); }
    else if (anim === 'lead') { me.tx = (A.nip.x || 300) - 30; me.sp = 120; }
    else if (anim === 'help') { me.tx = (tgt ? tgt.x : 300) - 50; me.sp = 100; }
    else if (anim === 'wait') { pieces.calm(); }
    else if (anim === 'lie') { me.lying = true; pieces.calm(); }
    if (!(m.c && m.c.instinct)) SFX.swell();
  }

  function updateResolve(dt) {
    m.anim += dt; const tgt = targetActor(), a = m.anim, n = m.animName;
    if (n === 'charge') {
      sh.move(me, dt);
      if (a > 0.35 && !m.dust) m.dust = { x: tgt ? (me.x + tgt.x) / 2 + 20 : me.x + 20, t: 0 };
      if (a > 0.5 && tgt === A.nip && !m.yelped) { m.yelped = true; SFX.yelp(); }
      if (a > 1.6) { if (tgt) { tgt.tx = 480; tgt.sp = 220; sh.move(tgt, dt); } me.tx = 150; me.sp = 90; }
    } else if (n === 'stand') { if (a > 1.0 && tgt) { tgt.tx = 480; tgt.sp = 110; sh.move(tgt, dt); } }
    else if (n === 'retreat') { sh.move(me, dt); if (a > 1.2 && tgt) { tgt.tx = 480; tgt.sp = 90; sh.move(tgt, dt); } }
    else if (n === 'leave') { sh.move(me, dt); }
    else if (n === 'ally') { sh.move(mentor, dt); if (a > 1.0 && tgt) { tgt.tx = 480; tgt.sp = 150; sh.move(tgt, dt); } }
    else if (n === 'bolt') { sh.move(me, dt); if (a > 1.6 && me.x < -60) { me.x = -60; me.tx = 150; me.sp = 90; } if (a > 1.6) sh.move(me, dt); }
    else if (n === 'shelter' || n === 'follow') { sh.move(me, dt); sh.move(A.echo, dt); }
    else if (n === 'lead') { sh.move(me, dt); if (a > 1.0) { A.nip.tx = (sc.coverX || 96) + 30; A.nip.sp = 80; me.tx = sc.coverX || 96; me.sp = 80; sh.move(A.nip, dt); } }
    else if (n === 'help') { sh.move(me, dt); if (a > 1.0) { const lg = pieces.get('log'); if (lg) lg.free(); } if (a > 1.8 && tgt) { tgt.pinned = false; } }
    if (m.carcass && !m.meat && tgt) m.carcass.x = tgt.x - 44;
    if (a > 2.6) {
      if (!m.meat && m.carcass) m.carcass.on = false;
      const stays = n === 'help' || n === 'leave' || (m.outcome && m.outcome.stays);
      if (tgt && !stays) { tgt.on = false; tgt.x = 470; }
      m.phase = 'card'; showOutcomeCard();
    }
  }

  function showOutcomeCard() {
    const r = m.result, o = m.outcome || {}, c = m.c, I = INSTINCTS[primary], T = TOOLS[I.tool].TOOL;
    const signs = (sh.meters.get(primary) || sh.meters.list[0]).signs;
    let title = o.title || c.title || ('YOU CHOSE ' + c.label), body;
    if (r.forced) {
      title = o.forcedTitle || `${I.label} TOOK OVER`;
      body = primary === 'rage'
        ? `"Your signs were there: ${signs[0]}, then ${signs[1]}. Next time, breathe at the very first one. It's easiest to stop rage when it's small."`
        : `"Your signs were there: ${signs[0]}, then ${signs[1]}. Next time, ${T.verb} at the very first one. It's easiest when it's small."`;
    } else if (c.instinct) body = o.note || `"You had other choices. ${I.name} just shouts the loudest."`;
    else if (!r.calm) body = `"It worked, but you were still running hot. ${capital(T.again)} and you choose with a clear head."`;
    else if (r.usedTool) body = o.note || `"You ${T.past} before you chose. That's the whole secret."`;
    else body = o.note || '"You kept your head. Remember how that felt."';
    if (r.calm && (o.strength || sc.strength)) body += `\n\nStrength: ${o.strength || sc.strength}`;
    const tline = r.dTrust > 0 ? 'Pack trust: rising' : r.dTrust < 0 ? 'Pack trust: shaken' : 'Pack trust: steady';
    sh.showCard({ title, sub: o.line || '', body: body + '\n\n' + tline + (o.injure ? '  ·  You are hurt' : '') + (o.meat === false ? '  ·  The meat is gone' : ''),
      bad: c.instinct, good: r.calm,
      cb: () => {
        m.phase = 'gap'; m.gapT = 0;
        if (c.instinct) { m.gapHinted = true; sh.say(sc.gapLine || (primary === 'rage' ? "Fighting didn't burn the rage off. Feel it? Still there. Long Exhale. I'll wait." : `That didn't make it go away. Feel it? Still there. ${T.name}. I'll wait.`), 6, 2); }
      } });
  }

  function updateGap(dt) {
    m.gapT += dt;
    me.tx = sc.homeX || 150; me.face = 1; me.sp = 70; sh.move(me, dt);
    if (mentor && mentor.on && !sc.mentorStays) { mentor.tx = mentor === A.scar ? 58 : 40; mentor.sp = 70; sh.move(mentor, dt); }
    if (!sh.activeTool) for (const x of sh.meters.list) x.relieve(0.012 * dt, false);
    const heat = sh.heat;
    if (heat >= GAP_CALM && !m.gapHinted && m.gapT > 1) { m.gapHinted = true; sh.say('Still feeling it? Check your signs. Calm down before anything else happens.', 5, 2); }
    const maxGap = (c => (c && c.instinct ? 22 : 12))(m.c) * (sh.difficulty.gapMul || 1) * (m.result && m.result.forced ? 1.8 : 1);
    sh.panelText = heat >= GAP_CALM ? 'Calm down before the next thing happens.' : (sc.calmText || 'Steady…');
    if ((heat < GAP_CALM && m.gapT > 2.5) || m.gapT > maxGap) finish();
  }
  function finish() {
    me.lying = false;
    if (m.carcass && m.meat) sh.stats.mealsKept += 1;
    if (m.carcass && !m.meat) sh.stats.mealsLost += 1;
    pieces.stop(); m.done = true; m.phase = 'done'; sh.panelText = '';
  }

  m.update = dt => {
    m.t += dt;
    if (me.standT > 0) me.standT -= dt;
    if (m.dust) { m.dust.t += dt; if (m.dust.t > 1.4) m.dust = null; }
    pieces.update(dt, m.phase === 'live');
    const pausing = sh.updateTools(dt);
    if (m.phase === 'arrive' || m.phase === 'live') {
      for (const t of trig) {
        const first = trig.indexOf(t) === 0;
        if (!t.started && (first || (m.phase === 'live' && m.liveT >= (t.at || 0)))) startTrigger(t);
        if (t.started && !t.fired) {
          if (t.who && A[t.who]) { if (!sh.move(A[t.who], dt)) fire(t); }
          else { t.wait -= dt; if (t.wait <= 0) fire(t); }
        }
      }
      if (m.phase === 'arrive' && trig.length && trig[0].fired) { m.phase = 'live'; sh.setChoices(sc.choices, k => choose(k, false)); sh.panelText = ''; }
      if (m.phase === 'arrive' && !trig.length) { m.phase = 'live'; sh.setChoices(sc.choices, k => choose(k, false)); }
    }
    if (m.phase === 'live') {
      m.liveT += dt;
      if (!pausing) for (const mm of sh.meters.list) if (rates[mm.instinct]) mm.simmer(rates[mm.instinct], dt);
      m.peakAfterTrigger = Math.max(m.peakAfterTrigger, sh.heat);
      for (const t of trig) if (t.fired && t.grab && t.who) { const a = A[t.who]; a.tx = t.dragTo || 345; a.sp = 10; sh.move(a, dt); if (m.carcass) m.carcass.x = a.x - 44; }
      const full = sh.meters.list.find(x => x.full);
      if (full) { full.set(1); const inst = sc.choices.find(c => c.instinct); choose(inst.k, true); }
    } else if (m.phase === 'resolve') updateResolve(dt);
    else if (m.phase === 'gap') updateGap(dt);
  };

  m.draw = () => {
    sh.drawWorldBack();
    pieces.drawBack();
    sh.drawMentors();
    if (m.carcass && m.carcass.on && m.carcass.x < 440) drawCarcass(m.carcass.x, GY() + 2);
    for (const who of ['nip', 'fang']) {
      const a = A[who]; if (!a.on) continue;
      const moving = Math.abs(a.tx - a.x) > 1;
      const taunting = who === 'fang' && m.phase === 'live' && sc.taunt;
      const pose = a.pinned ? 'lie' : moving ? (a.sp > 140 ? 'run' : 'walk') : taunting ? (Math.sin(sh.T * 4) > 0 ? 'crouch' : 'stand') : (who === 'nip' ? 'crouch' : 'stand');
      drawRaptor(a.x, GY() + 2, a.s, pose, moving ? sh.T : sh.T * 0.6, a.tx > a.x + 1 ? 1 : (moving ? -1 : a.face), { eye: who === 'fang' ? '#ef4444' : '#fbbf24', snarl: who === 'fang' && !moving, hk: who === 'fang' ? 0.6 : 0 });
    }
    sh.drawMe(me.lying && m.phase !== 'live' ? { pose: 'lie' } : m.phase === 'resolve' && (m.animName === 'shelter' || m.animName === 'follow') && Math.abs(me.tx - me.x) < 1 ? { pose: 'crouch' } : null);
    if (m.dust) { const d = m.dust, k = d.t / 1.4; for (let i = 0; i < 9; i++) { ctx.fillStyle = `rgba(110,80,70,${0.55 * (1 - k)})`; ctx.beginPath(); ctx.arc(d.x + Math.sin(i * 2.3 + d.t * 9) * 24, GY() - 18 + Math.cos(i * 1.7 + d.t * 7) * 14, 10 + k * 18 + (i % 3) * 4, 0, 7); ctx.fill(); } }
    pieces.drawFront();
    sh.drawWorldFront();
    sh.drawPanel();
    sh.drawCard();
  };
  return m;
}
function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
