// The shared scene shell: actors, Scar's lines, cards, the control panel, the toolbelt, and the feel layer
// (heartbeat, growl, red edges). Every scene kind runs inside one of these. Logic in update(); drawing only reads.
import { ctx, W, PANEL, view, SH, GY, FH, FS, FB, rr, wrapLines, wrap, inR, hash } from './canvas.js';
import { SIGN_T, LOCK, INSTINCTS, Meter, MeterSet } from './meter.js';
import { TOOLS } from './tools/index.js';
import { drawWorld, drawForeground, THEMES } from '../art/world.js';
import { drawRaptor } from '../art/raptor.js';

const MENTOR = { scar: 'SCAR', echo: 'ECHO', narr: 'NOW', nip: 'NIP', fang: 'FANG' };
const BREATH_LINES = ["That's it. Slow out-breaths tell your body the fight is over.", 'Good. Feel it drop?', "Again if you need it. There's no rush.", "That's the Long Exhale. Your best weapon."];
const KEYS = ['q', 'w', 'e', 'r', 't'];
// The clear band in the scene: below Scar's speech box (up to 3 lines) and above the bottom prompt banner.
export const SAFE_TOP = 104, SAFE_BOTTOM = 74;
// Feel settings: how strongly the heartbeat/growl, red edges and screen shake play. Effects soften while a tool is in use, so calm feels like the reward.
const FEEL = { off: 0, soft: 0.5, full: 1 }, CALMING = 0.35;
const SHORT = { longExhale: 'BREATHE', oneThing: 'ONE THING', parkIt: 'PARK IT', burstRest: 'BURST & REST', waitSignal: 'RIDE IT' };

export function actor(x, face, s, extra) { return { x, tx: x, face, s, sp: 110, on: true, ...extra }; }

export function createShell(env) {
  const input = env.input, audio = env.audio, SFX = audio.SFX;
  const settings = (env.profile && env.profile.settings) || {};
  const sh = {
    env, input, profile: env.profile, difficulty: env.difficulty || { simmerMul: 1, gapMul: 1, spikeAdd: 0 },
    theme: env.theme || 'dusk', tools: env.tools || [], meters: new MeterSet([]), runs: {}, activeTool: null,
    targets: {}, chooseTool: false, cx: 0,
    T: 0, msg: null, msgT: 0, msgPrio: 0, msgWho: 'scar', queue: [], card: null, cardBorn: 0,
    shake: 0, floats: [], beat: 0, hbT: 0.5, hintSign: {}, paused: false, mentor: 'scar',
    choices: null, choiceCb: null, panelText: '', meterHidden: false,
    actors: {
      me: actor(150, 1, 1), scar: actor(58, 1, 1.15), echo: actor(-60, 1, 1.05, { on: false }),
      nip: actor(470, -1, 0.72, { on: false }), fang: actor(470, -1, 1.12, { on: false }),
    },
    stats: { toolUses: {}, early: 0, earlyOf: 0, tookOver: 0, instinctChoices: 0, calmChoices: 0, trustDelta: 0,
      mealsKept: 0, mealsLost: 0, injured: false, repaired: false, needsRepair: false, strengths: [], parked: [] },
    get settings() { return settings; },
    get rm() { return !!settings.reducedMotion; },
    feelK(name) { const v = FEEL[settings[name] || 'soft']; return v == null ? 0.5 : v; },
    get shakeK() { return sh.rm ? 0 : sh.feelK('feelShake'); },
    get calmF() { const le = sh.runs.longExhale; return (sh.activeTool || (le && le.phase && le.phase !== 'idle')) ? CALMING : 1; },
    redAlpha() { const r = sh.heat; if (sh.meterHidden || r <= 0.3) return 0; return (r - 0.3) * 0.8 * (0.6 + sh.beat * 0.4) * sh.feelK('feelRed') * sh.calmF; },

    // Meters persist across scenes in a session, so rage left over from one scene carries into the next.
    meterPool: {},
    useMeters(instincts) {
      return new MeterSet(instincts.map(k => {
        let m = sh.meterPool[k];
        if (!m) {
          const signs = (sh.profile.signs && sh.profile.signs[k] && sh.profile.signs[k].length === 3) ? sh.profile.signs[k] : ['First sign', 'Second sign', 'Third sign'];
          m = sh.meterPool[k] = new Meter(k, signs, { simmerMul: sh.difficulty.simmerMul });
        }
        return m;
      }));
    },
    setStage({ instincts, meters, tools, theme, chooseTool, targets, mentor } = {}) {
      if (instincts) sh.meters = sh.useMeters(instincts);
      if (meters) sh.meters = meters;
      if (tools) sh.tools = tools;
      if (theme) sh.theme = theme;
      if (mentor) sh.mentor = mentor;
      sh.chooseTool = !!chooseTool; sh.targets = targets || {}; sh.landmarks = {}; sh.spaceTaken = false; sh.cx = 0; sh.onlyTool = null;
      sh.resetTools();
      for (const m of sh.meters.list) m.crossings();
    },
    resetTools() {
      sh.runs = {}; sh.activeTool = null;
      for (const id of sh.tools) {
        const T = TOOLS[id];
        if (T.TOOL.kind === 'tap') sh.runs[id] = null;
        else if (id === 'burstRest') sh.runs[id] = T.createRun({ mode: 'break' });
        else if (id === 'waitSignal') sh.runs[id] = T.createRun({ mode: 'ride' });
        else sh.runs[id] = T.createRun({});
      }
    },
    say(text, dur, prio, who) {
      prio = prio || 0;
      if (sh.msgT > 0 && prio < sh.msgPrio) return;
      sh.msg = text; sh.msgT = dur || 4; sh.msgPrio = prio; sh.msgWho = who || sh.mentor;
    },
    sayNext(text, dur, who) { sh.queue.push({ text, dur, who: who || sh.mentor }); },
    showCard(c) { sh.card = c; sh.cardBorn = sh.T; },
    dismissCard() {
      if (!sh.card || sh.T - sh.cardBorn < 0.7) return;
      const c = sh.card; sh.card = null; SFX.click();
      if (c.cb) c.cb();
    },
    setChoices(list, cb) { sh.choices = list; sh.choiceCb = cb; },
    clearChoices() { sh.choices = null; sh.choiceCb = null; },
    move(a, dt) {
      if (!a.on) return false;
      const d = a.tx - a.x; if (Math.abs(d) < 1) { a.x = a.tx; return false; }
      a.x += Math.sign(d) * Math.min(Math.abs(d), a.sp * dt); return true;
    },
    get heat() { return sh.meters.hottest; },
    get locked() { return sh.meters.list.some(m => m.locked); },

    // ---------- layout ----------
    P0() { return view.H - PANEL; },
    tileRect(i) {
      const n = sh.tools.length, P = sh.P0();
      if (n <= 2) return { x: 14, y: P + 70 + i * 58, w: 150, h: n === 1 ? 110 : 52 };
      const w = (W - 28 - (n - 1) * 6) / n; return { x: 14 + i * (w + 6), y: P + 70, w, h: 46 };
    },
    choiceRect(i, count) {
      const P = sh.P0();
      if (sh.tools.length <= 2) {
        if (count <= 2) return { x: 172, y: P + 70 + i * 58, w: 214, h: 52 };
        return { x: 172 + (i % 2) * 110, y: P + 70 + Math.floor(i / 2) * 58, w: 104, h: 52 };
      }
      const n = Math.max(2, count), w = (W - 28 - (n - 1) * 6) / n;
      return { x: 14 + i * (w + 6), y: P + 124, w, h: 56 };
    },
    muteRect() { return { x: W - 38, y: SH() - 38, w: 30, h: 30 }; },
    menuRect() { return { x: W - 76, y: SH() - 38, w: 30, h: 30 }; },

    // ---------- input hooks ----------
    handleDown(p) {
      if (sh.card) { sh.dismissCard(); return true; }
      if (inR(p, sh.muteRect())) { audio.toggleMute(); return true; }
      if (sh.onMenu && inR(p, sh.menuRect())) { sh.onMenu(); return true; }
      return false;
    },
    handleKey(name) {
      if (sh.card) { if (name === 'Space' || name === 'Enter') { input.keys.delete('Space'); sh.dismissCard(); } return; }
      if (name === 'm' || name === 'M') audio.toggleMute();
      if (name === 'Escape' && sh.onMenu) sh.onMenu();
      if (name === 'Enter' && sh.choices && sh.choices.length === 1 && sh.choiceCb) sh.choiceCb(sh.choices[0].k);
      if (sh.choices && sh.choiceCb && '1234'.includes(name) && name.length === 1) {
        const c = sh.choices[+name - 1]; if (c) sh.choiceCb(c.k);
      }
      const ti = KEYS.indexOf(String(name).toLowerCase());
      if (ti >= 0 && sh.tools[ti] && TOOLS[sh.tools[ti]].TOOL.kind === 'tap') sh.startTapTool(sh.tools[ti]);
    },
    startTapTool(id) {
      if (sh.onlyTool && id !== sh.onlyTool) return;
      if (sh.activeTool && sh.activeTool !== id) return;
      if (sh.runs[id] && !sh.runs[id].done) return;
      const tgt = sh.targets[id];
      if (!tgt) { sh.say(id === 'oneThing' ? "Nothing's too much right now. Save One Thing for when it is." : 'Not now.', 3, 2); return; }
      const resolved = {};
      for (const [step, list] of Object.entries(tgt)) resolved[step] = sh.placeTargets(step, list);
      sh.runs[id] = TOOLS[id].createRun({ targets: resolved });
      sh.activeTool = id; SFX.click();
    },

    // Where a named thing is drawn right now, so a target labelled "The sun" sits over the sun.
    landmarks: {},
    anchor(name) {
      const a = sh.actors[name];
      if (a) return a.on ? { x: a.x + 8 * (a.face || 1), y: GY() - 26 * a.s } : null;
      if (name === 'sun') { const s = (THEMES[sh.theme] || {}).sun; return s ? { x: W * s.x, y: GY() - s.dy } : null; }
      if (name === 'volcano') { const vx = ((260 - sh.cx * 0.12) % 1000 + 1000) % 1000 - 200; return vx > 20 && vx < W - 20 && (THEMES[sh.theme] || {}).volcano ? { x: vx, y: GY() - 150 } : null; }
      if (name === 'river') return { x: W / 2, y: GY() + 14 };
      const l = sh.landmarks[name]; return l ? l() : null;
    },
    placeTargets(step, list) {
      const lo = SAFE_TOP, hi = SH() - SAFE_BOTTOM;
      let out = list.map(b => {
        let x = b.x, y;
        if (b.at) { const a = sh.anchor(b.at); if (!a) return null; x = a.x - b.w / 2; y = a.y - b.h / 2; }
        else y = b.y != null ? b.y : b.gy != null ? GY() + b.gy : SH() + (b.sy || 0);
        return { ...b, x: Math.max(2, Math.min(W - b.w - 2, x)), y: Math.max(lo, Math.min(hi - b.h, y)) };
      }).filter(Boolean);
      if (step === 'hear') { // sounds have no place: a tidy row of sound bubbles just under the speech box
        const n = out.length, slot = W / n;
        out = out.map((b, i) => ({ ...b, x: i * slot + (slot - b.w) / 2, y: lo + 6 }));
      }
      return out;
    },
    pause() {
      if (sh.paused) return;
      input.clearAll();
      const le = sh.runs.longExhale; if (le && (le.phase === 'in' || le.phase === 'full')) { le.phase = 'idle'; le.t = 0; }
      for (const id of ['burstRest', 'waitSignal']) { const r = sh.runs[id]; if (r && r.phase && r.phase !== 'idle' && !r.done) r.phase = 'paused'; }
      sh.paused = true;
      const prev = sh.card;
      sh.showCard({ title: 'PAUSED', sub: 'The valley waits for you.', body: 'Tap to carry on.', cb: () => { sh.paused = false; sh.resumedAt = sh.T; if (prev) sh.showCard(prev); } });
      sh.cardBorn = sh.T - 0.7;
    },

    // ---------- per-frame logic ----------
    update(dt) {
      sh.T += dt;
      if (sh.msgT > 0) sh.msgT -= dt; else if (sh.queue.length) { const q = sh.queue.shift(); sh.say(q.text, q.dur, 1, q.who); }
      sh.beat = Math.max(0, sh.beat - dt * 4);
      if (sh.shake > 0) sh.shake -= dt;
      for (const f of sh.floats) f.t += dt; sh.floats = sh.floats.filter(f => f.t < 2.2);
      const heat = sh.heat;
      const soundK = sh.feelK('feelSound') * sh.calmF;
      audio.setGrowl(sh.meterHidden ? 0 : Math.max(0, heat - 0.3) * soundK);
      sh.hbT -= dt;
      if (sh.hbT <= 0) {
        sh.hbT = 60 / (64 + heat * 90);
        if (heat > 0.15 && !sh.meterHidden && soundK > 0) { SFX.lubdub((0.4 + heat * 0.6) * soundK); if (heat > 0.5) audio.vibrate(18); }
        sh.beat = 1;
      }
      for (const m of sh.meters.list) for (const i of m.crossings()) {
        sh.floats.push({ text: m.signs[i] || '', x: sh.actors.me.x, y: GY() - 80, t: 0 });
        if (i === 0 && (!sh.hintSign[m.instinct] || sh.difficulty.promptEarly)) {
          sh.hintSign[m.instinct] = 1;
          const tool = TOOLS[INSTINCTS[m.instinct].tool].TOOL;
          const line = `There. ${m.signs[0]}. That's your first warning sign. Best time to ${tool.verb}.`;
          if (sh.difficulty.promptEarly) sh.say(line, 4, 2); else sh.sayNext(line, 4);
        }
      }
    },
    // Runs the toolbelt. Returns true if a tool in progress should pause the meters' simmer.
    updateTools(dt) {
      let pause = false;
      sh.tools.forEach((id, i) => {
        const T = TOOLS[id].TOOL; let run = sh.runs[id];
        if (!run || (sh.onlyTool && id !== sh.onlyTool)) return;
        const free = !sh.activeTool || sh.activeTool === id;
        const held = free && T.kind === 'hold' && !sh.card && (input.held(sh.tileRect(i), i === 0 && !sh.spaceTaken ? 'Space' : KEYS[i]) || input.keys.has(KEYS[i]));
        const io = { held, taps: T.kind === 'tap' && sh.activeTool === id ? input.taps : [], drag: input.drag, targets: sh.targets };
        if (T.kind === 'tap' && !run.done && run.t > 10) {
          sh.runs[id] = null; if (sh.activeTool === id) sh.activeTool = null;
          sh.say("Let's leave that for now. Tap ONE THING again whenever you need it.", 3.5, 2);
          return;
        }
        const out = run.update(dt, io);
        if (out.relief > 0) sh.meters.relieve(T.instinct, out.relief);
        for (const e of out.events) sh.toolEvent(id, e);
        if (run.pausesSimmer) pause = true;
        if (run.active && !run.done) sh.activeTool = id; else if (sh.activeTool === id) sh.activeTool = null;
        if (run.done && (id === 'burstRest' || id === 'waitSignal')) sh.runs[id] = TOOLS[id].createRun({ mode: id === 'burstRest' ? 'break' : 'ride' });
      });
      if (input.drag && input.drag.released) input.drag = null;
      return pause;
    },
    toolEvent(id, e) {
      const u = sh.stats.toolUses;
      if (e === 'inhale') SFX.inhale();
      else if (e === 'exhale') SFX.exhale();
      else if (e === 'hint:allTheWayIn') sh.say('All the way in. Keep holding until the circle is full.', 3, 2);
      else if (e === 'hint:letGo') sh.say('Now let go, and breathe out slowly.', 3, 2);
      else if (e === 'hint:letItOut') sh.say('Let go. Let it ALL out. Slowly.', 2.5, 2);
      else if (e === 'breath') { u[id] = (u[id] || 0) + 1; SFX.good(); sh.say(BREATH_LINES[Math.min(u[id] - 1, BREATH_LINES.length - 1)], 3, 1); }
      else if (e.startsWith('step:')) SFX.step();
      else if (e === 'done') {
        u[id] = (u[id] || 0) + 1; SFX.good();
        const lines = { oneThing: 'One thing at a time. Now you can think. Pick your next step.', burstRest: 'Good. Energy spent on purpose, then a rest.', waitSignal: 'Felt it rise. Let it pass. You stayed in charge.' };
        if (lines[id]) sh.say(lines[id], 3.5, 1);
      } else if (e.startsWith('parked:')) {
        u[id] = (u[id] || 0) + 1; SFX.parked(); sh.stats.parked.push(e.slice(7));
        sh.say("Parked. It'll still be there after. Back to the trail.", 3, 1);
      } else if (e === 'start') SFX.click();
    },
    noteTrigger() { sh.shake = 0.4 * sh.shakeK; SFX.snarl(); },

    // ---------- drawing ----------
    drawRaptorActor(a, opts) {
      const moving = Math.abs(a.tx - a.x) > 1;
      const pose = opts.pose || (moving ? (a.sp > 150 ? 'run' : 'walk') : 'stand');
      drawRaptor(a.x, (opts.y || GY() + 2), a.s * (opts.grow || 1), pose, sh.T * (opts.speed || 1), opts.face || (moving ? (a.tx > a.x ? 1 : -1) : a.face), opts);
    },
    drawMe(extra) {
      const me = sh.actors.me, r = sh.heat, p = sh.profile, moving = Math.abs(me.tx - me.x) > 1;
      const ap = sh.appearance || { scale: 1, feathers: 8, scars: 0, rim: p && p.rim };
      const pose = (extra && extra.pose) || (moving ? (me.sp > 200 ? 'run' : 'walk') : (me.standT > 0 ? 'stand' : (r > 0.55 ? 'stand' : 'crouch')));
      const eye = r > SIGN_T[1] ? `rgb(${Math.round(251 - 10 * r)},${Math.round(191 - 170 * r)},${Math.round(36 - 20 * r)})` : ((ap.look && ap.look.eye) || '#fbbf24');
      drawRaptor(me.x, GY() + 2, ap.scale * (me.standT > 0 ? 1.12 : 1), pose, sh.T, moving ? (me.tx > me.x ? 1 : -1) : me.face,
        { hk: r, tail: sh.T * (1 + r * 3), eye, eyeR: 1.4 + r * 0.8, snarl: r > 0.55, lean: me.limp && !moving ? 0.06 : 0,
          rim: ap.rim, feathers: ap.feathers, scars: ap.scars, look: ap.look, ...(extra || {}) });
    },
    drawMentors() {
      const { scar, echo } = sh.actors;
      if (scar.on) drawRaptor(scar.x, GY() + 2, scar.s, Math.abs(scar.tx - scar.x) > 1 ? 'walk' : 'stand', sh.T, scar.tx < scar.x - 1 ? -1 : scar.face, { scar: true, eye: '#fde68a' });
      if (echo.on) drawRaptor(echo.x, GY() + 2, echo.s, Math.abs(echo.tx - echo.x) > 1 ? 'walk' : 'crouch', sh.T * 0.8, echo.tx < echo.x - 1 ? -1 : echo.face, { eye: '#a7f3d0', rim: '#a7f3d0', feathers: 10 });
    },
    drawWorldBack() {
      const sx = sh.shake > 0 ? Math.sin(sh.T * 90) * sh.shake * 8 : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SH()); ctx.clip(); ctx.translate(sx, 0);
      drawWorld(sh.theme, sh.cx, sh.meterHidden ? 0 : sh.heat * sh.feelK('feelRed') * sh.calmF, sh.T, { reducedMotion: sh.rm });
    },
    drawWorldFront() {
      drawForeground(sh.theme, sh.cx, sh.T, { reducedMotion: sh.rm });
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SH()); ctx.clip();
      for (const f of sh.floats) { const k = f.t / 2.2; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fca5a5'; ctx.font = FH(16); ctx.textAlign = 'center'; ctx.fillText(String(f.text).toUpperCase(), f.x, f.y - k * 30); }
      ctx.globalAlpha = 1;
      for (const id of sh.tools) { const r = sh.runs[id]; if (r && r.draw && id !== 'parkIt') r.draw(sh.T); }
      const a = sh.redAlpha();
      if (a > 0) {
        const v = ctx.createRadialGradient(W / 2, SH() / 2, SH() * 0.3, W / 2, SH() / 2, SH() * 0.8);
        v.addColorStop(0, 'rgba(127,29,29,0)'); v.addColorStop(1, `rgba(127,29,29,${a})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, SH());
      }
      sh.drawMsg(); sh.drawMute();
      ctx.restore();
    },
    drawMsg() {
      if (!sh.msg || sh.msgT <= 0) return;
      ctx.globalAlpha = Math.min(1, sh.msgT * 3);
      const narr = sh.msgWho === 'narr';
      ctx.font = narr ? FB(15, 500) : FS(15); const lines = wrapLines(sh.msg, W - 86), h = Math.max(58, 30 + lines.length * 19);
      ctx.fillStyle = 'rgba(10,5,8,0.85)'; rr(10, 10, W - 20, h, 10); ctx.fill();
      const col = narr ? '#e7e5e4' : sh.msgWho === 'echo' ? '#6ee7b7' : '#f59e0b';
      ctx.fillStyle = col; ctx.fillRect(10, 14, 3, h - 8);
      ctx.textAlign = 'left';
      if (!narr) { clawMark(24, 22, col); ctx.fillStyle = col; ctx.font = FH(11, 500); ctx.fillText(MENTOR[sh.msgWho] || 'SCAR', 24, 52); }
      else { ctx.fillStyle = '#a8a29e'; ctx.font = FH(11, 500); ctx.fillText('NOW', 24, 34); }
      ctx.fillStyle = narr ? '#fafaf9' : sh.msgWho === 'echo' ? '#d1fae5' : '#fef3c7'; ctx.font = narr ? FB(15, 500) : FS(15);
      let y = 32; for (const l of lines) { ctx.fillText(l, 62, y); y += 19; }
      ctx.globalAlpha = 1;
    },
    drawMute() {
      if (sh.onMenu) {
        const q = sh.menuRect();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(q.x + 15, q.y + 15, 15, 0, 7); ctx.fill();
        ctx.fillStyle = '#d6d3d1'; ctx.fillRect(q.x + 10, q.y + 9, 4, 12); ctx.fillRect(q.x + 17, q.y + 9, 4, 12);
      }
      const r = sh.muteRect(), muted = audio.isMuted();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(r.x + 15, r.y + 15, 15, 0, 7); ctx.fill();
      ctx.fillStyle = '#d6d3d1'; ctx.beginPath(); ctx.moveTo(r.x + 8, r.y + 12); ctx.lineTo(r.x + 12, r.y + 12); ctx.lineTo(r.x + 17, r.y + 8); ctx.lineTo(r.x + 17, r.y + 22); ctx.lineTo(r.x + 12, r.y + 18); ctx.lineTo(r.x + 8, r.y + 18); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 1.6; ctx.beginPath();
      if (muted) { ctx.moveTo(r.x + 19, r.y + 11); ctx.lineTo(r.x + 25, r.y + 19); ctx.moveTo(r.x + 25, r.y + 11); ctx.lineTo(r.x + 19, r.y + 19); }
      else { ctx.arc(r.x + 17, r.y + 15, 5, -0.8, 0.8); ctx.moveTo(r.x + 23, r.y + 8); ctx.arc(r.x + 17, r.y + 15, 9, -0.8, 0.8); }
      ctx.stroke();
    },
    drawMeters() {
      const P = sh.P0(), list = sh.meters.list;
      if (!list.length || sh.meterHidden) return;
      if (list.length === 1) {
        const m = list[0], r = m.value, I = INSTINCTS[m.instinct];
        ctx.textAlign = 'left'; ctx.font = FH(13, 500); ctx.fillStyle = '#a8a29e'; ctx.fillText(I.label, 16, P + 20);
        ctx.textAlign = 'right'; ctx.fillStyle = r >= LOCK ? '#f87171' : '#78716c'; ctx.font = FH(12, 500);
        ctx.fillText(r >= 0.999 ? 'TAKEN OVER' : r >= LOCK ? I.lockText : 'IN CONTROL', W - 16, P + 20);
        meterBar(m, 16, P + 27, W - 32, 12, true);
      } else list.slice(0, 2).forEach((m, i) => {
        const y = P + 10 + i * 30, I = INSTINCTS[m.instinct];
        ctx.textAlign = 'left'; ctx.font = FH(12, 500); ctx.fillStyle = m.locked ? '#f87171' : '#a8a29e'; ctx.fillText(I.label, 16, y + 10);
        meterBar(m, 92, y + 1, W - 108, 10, false);
      });
    },
    drawPanel() {
      const P = sh.P0();
      ctx.fillStyle = '#0f0a0c'; ctx.fillRect(0, P, W, PANEL); ctx.fillStyle = '#2a1a1f'; ctx.fillRect(0, P, W, 1);
      sh.drawMeters();
      sh.tools.forEach((id, i) => sh.drawTile(id, i));
      if (sh.choices) sh.drawChoices();
      else if (sh.panelText) {
        ctx.textAlign = 'left'; ctx.fillStyle = '#78716c'; ctx.font = FS(14);
        if (sh.tools.length <= 2) wrap(sh.panelText, sh.tools.length ? 176 : 16, P + 92, sh.tools.length ? W - 192 : W - 32, 19);
        else wrap(sh.panelText, 16, P + 140, W - 32, 19);
      }
    },
    drawTile(id, i) {
      const T = TOOLS[id].TOOL, R = sh.tileRect(i), run = sh.runs[id], big = sh.tools.length === 1, small = sh.tools.length >= 3;
      const active = run && run.active && !run.done;
      if (T.kind === 'tap') input.addButton({ ...R, cb: () => sh.startTapTool(id) });
      ctx.fillStyle = active ? '#0c4a6e' : '#1c1917'; rr(R.x, R.y, R.w, R.h, 12); ctx.fill();
      const hot = sh.meters.list.find(m => INSTINCTS[m.instinct].tool === id && m.value >= SIGN_T[0]);
      const pulse = !sh.chooseTool && !active && (hot || sh.pulseTool === id);
      ctx.strokeStyle = pulse ? hexA(T.col, 0.5 + 0.5 * Math.sin(sh.T * 5)) : hexA(T.col, sh.activeTool && !active ? 0.3 : 1);
      ctx.lineWidth = 2; ctx.stroke();
      const k = run && run.k != null ? run.k : 0;
      if (active && k > 0) { ctx.fillStyle = hexA(T.col, 0.25); rr(R.x, R.y + R.h * (1 - k), R.w, R.h * k, 12); ctx.fill(); }
      ctx.textAlign = 'center'; ctx.fillStyle = '#f5f5f4';
      if (big) {
        ctx.font = FH(22); ctx.fillText(SHORT[id], R.x + R.w / 2, R.y + 50);
        ctx.font = FB(id === 'parkIt' ? 9 : 11, 600); ctx.fillStyle = T.col; ctx.fillText(run && run.label ? run.label() : 'TAP TO START', R.x + R.w / 2, R.y + 72);
        ctx.fillStyle = '#57534e'; ctx.font = FB(10); ctx.fillText(T.tile, R.x + R.w / 2, R.y + 92);
      } else if (!small) {
        ctx.font = FH(17); ctx.fillText(SHORT[id], R.x + R.w / 2, R.y + 24);
        ctx.font = FB(10, 600); ctx.fillStyle = T.col; ctx.fillText(run && run.label ? run.label() : T.kind === 'tap' ? 'TAP TO START' : T.kind === 'drag' ? 'DRAG IT TO THE MAP' : '', R.x + R.w / 2, R.y + 40);
      } else {
        const short = { ...SHORT, burstRest: 'REST' }[id];
        ctx.font = FH(13); ctx.fillText(short, R.x + R.w / 2, R.y + 20);
        ctx.font = FB(9, 600); ctx.fillStyle = T.col; ctx.fillText(T.kind === 'tap' ? 'TAP' : T.kind === 'drag' ? 'DRAG' : 'HOLD', R.x + R.w / 2, R.y + 36);
      }
    },
    drawChoices() {
      const list = sh.choices, lockedAll = sh.locked;
      list.forEach((c, i) => {
        const R = sh.choiceRect(i, list.length), locked = !c.instinct && !c.always && lockedAll;
        input.addButton({ ...R, cb: () => sh.choiceCb && sh.choiceCb(c.k) });
        ctx.fillStyle = locked ? '#1c1917' : '#211a1a'; rr(R.x, R.y, R.w, R.h, 10); ctx.fill();
        ctx.strokeStyle = locked ? '#3f3a36' : c.col; ctx.lineWidth = 2; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = locked ? '#57534e' : c.col;
        const fs = R.w > 150 ? 17 : c.label.length > 9 ? 13 : c.label.length > 7 ? 15 : 17;
        ctx.font = FH(fs); ctx.fillText(c.label, R.x + R.w / 2, R.y + R.h / 2 + (locked ? 0 : 6));
        if (locked) { ctx.font = FB(9, 600); ctx.fillStyle = '#78716c'; ctx.fillText('LOCKED · CALM FIRST', R.x + R.w / 2, R.y + R.h / 2 + 15); }
      });
    },
    drawCard() {
      const c = sh.card; if (!c) return;
      const H = view.H;
      ctx.fillStyle = 'rgba(5,2,4,0.74)'; ctx.fillRect(0, 0, W, H);
      const x = 20, w = W - 40;
      ctx.font = FS(15); const sub = c.sub ? wrapLines(c.sub, w - 40) : [];
      ctx.font = FB(15); const body = c.body ? wrapLines(c.body, w - 40) : [];
      const h = 40 + 38 + sub.length * 20 + 14 + body.reduce((a, l) => a + (l === '' ? 10 : 21), 0) + 46;
      const y = Math.max(12, (H - h) / 2);
      ctx.fillStyle = '#16100f'; rr(x, y, w, h, 16); ctx.fill();
      ctx.strokeStyle = c.bad ? '#7f1d1d' : c.good ? '#166534' : '#78350f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.textAlign = 'left'; let yy = y + 46;
      ctx.fillStyle = c.bad ? '#f87171' : c.good ? '#86efac' : '#f59e0b'; ctx.font = FH(28); ctx.fillText(c.title, x + 20, yy); yy += 26;
      ctx.fillStyle = '#fde68a'; ctx.font = FS(15); for (const l of sub) { ctx.fillText(l, x + 20, yy); yy += 20; }
      yy += 14; ctx.fillStyle = '#e7e5e4'; ctx.font = FB(15);
      for (const l of body) { if (l === '') yy += 10; else { ctx.fillText(l, x + 20, yy); yy += 21; } }
      if (sh.T - sh.cardBorn >= 0.7) {
        ctx.textAlign = 'center'; ctx.font = FH(13, 500); ctx.fillStyle = `rgba(245,158,11,${0.55 + 0.45 * Math.sin(sh.T * 4)})`;
        ctx.fillText('TAP TO CONTINUE', W / 2, y + h - 20);
      }
    },
  };
  sh.dispose = () => { if (input.onDown === hDown) input.onDown = null; if (input.onKey === hKey) input.onKey = null; sh.onMenu = null; };
  const hDown = p => sh.handleDown(p), hKey = name => sh.handleKey(name);
  input.onDown = hDown; input.onKey = hKey;
  return sh;
}

function meterBar(m, bx, by, bw, bh, labels) {
  const r = m.value, I = INSTINCTS[m.instinct];
  ctx.fillStyle = '#292524'; rr(bx, by, bw, bh, bh / 2); ctx.fill();
  if (r > 0.005) {
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, I.col[0]); g.addColorStop(0.6, I.col[1]); g.addColorStop(1, I.col[2]);
    ctx.fillStyle = g; rr(bx, by, Math.max(bh, bw * r), bh, bh / 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(248,113,113,0.5)'; ctx.fillRect(bx + bw * LOCK - 1, by - 3, 2, bh + 6);
  for (let i = 0; i < 3; i++) {
    const x = bx + bw * SIGN_T[i], lit = r >= SIGN_T[i];
    ctx.fillStyle = lit ? '#fca5a5' : '#57534e'; ctx.beginPath(); ctx.moveTo(x, by + bh + 2); ctx.lineTo(x - 5, by + bh + 9); ctx.lineTo(x + 5, by + bh + 9); ctx.closePath(); ctx.fill();
    if (labels) {
      ctx.textAlign = i === 0 ? 'left' : i === 2 ? 'right' : 'center'; ctx.font = FH(11, lit ? 700 : 500);
      const lx = i === 0 ? bx : i === 2 ? bx + bw : bx + bw / 2;
      ctx.fillText((i + 1) + ' ' + String(m.signs[i] || '').toUpperCase(), lx, by + bh + 23);
    }
  }
}
export function clawMark(x, y, col) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(x + i * 6, y); ctx.lineTo(x + i * 6 + 8, y + 16); } ctx.stroke(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
