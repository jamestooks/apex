// Runs one session: a chapter leg (two beats of the chapter) or a short Hunt, then hands field notes to the Den.
// Cards, sign picking, practice, scenarios and the repair scene are steps in a queue.
import { createMoment } from '../engine/kinds/moment.js';
import { createRepair } from '../engine/kinds/repair.js';
import { createPractice } from '../engine/kinds/practice.js';
import { createTrack } from '../engine/kinds/track.js';
import { createRun } from '../engine/kinds/run.js';
import { createAmbush } from '../engine/kinds/ambush.js';
import { createTeachNip } from '../engine/kinds/teachNip.js';
import { TOOL_ORDER } from '../engine/tools/index.js';
import { completeLeg, recordSession, appearance } from '../model/progress.js';

export const KINDS = { moment: createMoment, practice: createPractice, track: createTrack, run: createRun, ambush: createAmbush, teachNip: (sc, sh) => createTeachNip(sh) };
export function registerKind(name, fn) { KINDS[name] = fn; }

const WRAP_CARD = { title: 'TIME TO REST', sub: "The sun's going down. That's enough hunting for today.",
  body: '"Rest is part of being a hunter. Come back later and we will pick up right where we left off."' };

export function createRunner({ profile, chapter, mode = 'leg', leg = 0, shell, now = () => Date.now(), session, pickSigns, onDone, save, rng = Math.random }) {
  const start = now();
  const r = { step: null, scene: null, scenarioIndex: -1, finished: false, waiting: false, difficulty: shell.difficulty, results: [], calmStreak: 0 };
  shell.appearance = appearance(profile);
  shell.theme = chapter.theme; shell.mentor = chapter.mentor || 'scar';
  if (chapter.mentor === 'echo') { shell.actors.echo.on = true; shell.actors.echo.x = shell.actors.echo.tx = 40; shell.actors.scar.on = false; }
  const inst = chapter.instinct;
  const belt = () => TOOL_ORDER.filter(id => profile.toolbelt.includes(id));
  const addTool = id => { if (id && !profile.toolbelt.includes(id)) profile.toolbelt.push(id); };
  if (mode === 'hunt' || leg > 0) addTool(chapter.tool);

  const steps = [];
  if (mode === 'single') {
    steps.push({ type: 'scenario', sc: chapter.__only });
  } else if (mode === 'hunt') {
    if (inst !== 'all') steps.push({ type: 'signs', instinct: inst });
    const pool = [...chapter.scenarios.test, ...chapter.scenarios.mix];
    const picks = []; while (picks.length < Math.min(2, pool.length)) { const s = pool[Math.floor(rng() * pool.length)]; if (!picks.includes(s)) picks.push(s); }
    steps.push({ type: 'card', card: { title: 'HUNT', sub: chapter.place, body: '"A short hunt to keep your skills sharp. Same tools, new moments."' } });
    for (const sc of picks) steps.push({ type: 'scenario', sc });
  } else {
    const intro = chapter.legIntro && chapter.legIntro[leg];
    if (intro) steps.push({ type: 'card', card: intro });
    for (const beat of chapter.legs[leg]) {
      if (beat === 'teach') {
        if (chapter.teachSteps) steps.push(...chapter.teachSteps);
        else {
          steps.push({ type: 'card', card: chapter.intro });
          steps.push({ type: 'signs', instinct: inst });
          steps.push({ type: 'card', card: chapter.toolCard, addTool: chapter.tool });
          steps.push({ type: 'practice', sc: chapter.practice });
          if (chapter.chooseCard) steps.push({ type: 'card', card: chapter.chooseCard });
        }
      } else for (const sc of chapter.scenarios[beat]) steps.push({ type: 'scenario', sc });
    }
  }
  steps.push({ type: 'repair' });
  if (mode === 'leg' && leg === chapter.legs.length - 1 && chapter.endingCards) steps.push(...chapter.endingCards.map(fn => ({ type: 'card', cardFn: fn })));
  let si = -1, played = 0;

  function stageFor(sc) {
    const tools = sc.tools || (sc.chooseTool ? TOOL_ORDER.slice() : belt());
    shell.setStage({ instincts: sc.meters, tools, theme: sc.theme || chapter.theme, chooseTool: sc.chooseTool,
      mentor: sc.mentor || chapter.mentor, targets: { oneThing: sc.oneThing || null, distractions: sc.distractions ? sc.distractions.map(d => ({ ...d, parked: false })) : null } });
  }
  function next() {
    r.scene = null;
    si++;
    const st = steps[si];
    if (!st) return finish(false);
    r.step = st.type;
    if (st.type === 'card') {
      const card = st.cardFn ? st.cardFn(profile, shell) : st.card;
      if (!card) return next();
      shell.showCard({ ...card, cb: () => { if (st.addTool) addTool(st.addTool); next(); } });
    } else if (st.type === 'signs') {
      const k = st.instinct;
      if (profile.signs[k] && profile.signs[k].length === 3) return next();
      r.waiting = true;
      Promise.resolve(pickSigns(k)).then(() => { delete shell.meterPool[k]; r.waiting = false; save && save(); next(); });
    } else if (st.type === 'practice') {
      addTool(chapter.tool);
      r.saved = { stats: JSON.parse(JSON.stringify(shell.stats)), difficulty: { ...shell.difficulty } };
      stageFor(st.sc);
      r.scene = KINDS[st.sc.kind](st.sc, shell);
    } else if (st.type === 'scenario') {
      if (played > 0 && session && session.capReached(now())) return wrapUp();
      r.scenarioIndex = played;
      stageFor(st.sc);
      r.scene = KINDS[st.sc.kind](st.sc, shell);
      r.currentSc = st.sc;
    } else if (st.type === 'repair') {
      if (!shell.stats.needsRepair || chapter.repair === false || shell.stats.repaired) return next();
      shell.setStage({ instincts: [inst === 'all' ? 'rage' : inst], tools: belt() });
      r.scene = createRepair(shell, { who: 'nip' });
    } else if (st.type === 'scene') {
      stageFor(st.sc);
      r.scene = KINDS[st.sc.kind](st.sc, shell);
    }
  }
  function sceneDone() {
    const st = steps[si];
    if (st.type === 'practice' && r.saved) {
      // Practice is for learning: keep the tool uses, drop everything that would count.
      const keepUses = shell.stats.toolUses;
      Object.assign(shell.stats, r.saved.stats, { toolUses: keepUses });
      Object.assign(shell.difficulty, r.saved.difficulty);
      for (const m of Object.values(shell.meterPool)) { m.simmerMul = shell.difficulty.simmerMul; m.set(Math.min(m.value, 0.2)); }
      r.saved = null;
    }
    if (st.type === 'scenario') {
      played++;
      const res = r.scene.result || {};
      r.results.push(res);
      if (!res.instinct && !res.forced && res.choice !== undefined || res.calmRun) r.calmStreak++; else r.calmStreak = 0;
      if (res.forced) r.calmStreak = 0;
      if (r.calmStreak >= 3) { r.difficulty.gapMul = 0.6; r.difficulty.spikeAdd = 0.05; }
    }
    next();
  }
  function wrapUp() {
    r.step = 'wrap';
    shell.showCard({ ...WRAP_CARD, cb: () => finish(true) });
  }
  function finish(capped) {
    if (r.finished) return;
    r.finished = true; r.scene = null; shell.clearChoices();
    const completedLeg = !capped && mode === 'leg';
    if (completedLeg) completeLeg(profile, chapter.n, leg);
    const minutes = Math.max(1, Math.round((now() - start) / 60000));
    const st = shell.stats;
    recordSession(profile, { chapter: chapter.n, kind: mode, trustDelta: st.trustDelta, minutes, injured: st.injured, mealsKept: st.mealsKept,
      toolUses: st.toolUses, tookOver: st.tookOver, early: st.early, earlyOf: st.earlyOf });
    if (chapter.instinct === 'all' && st.finaleCalm) profile.finaleCalm = true;
    for (const p of st.parked) if (!profile.parked.includes(p)) profile.parked.push(p);
    for (const s of st.strengths) profile.strengths[s] = (profile.strengths[s] || 0) + 1;
    save && save();
    const chapterDone = !!(profile.chapters[chapter.n] && profile.chapters[chapter.n].done);
    onDone && onDone({ chapter: chapter.n, mode, leg, completedLeg, chapterDone, capped, minutes, stats: st, results: r.results });
  }

  r.update = dt => {
    if (r.finished) return;
    shell.update(dt);
    if (r.waiting || shell.card || shell.paused) return;
    if (r.scene) { r.scene.update(dt); if (r.scene.done) sceneDone(); }
    else if (r.step === null) next();
    else { shell.updateTools(dt); }
  };
  r.draw = () => {
    if (r.scene) return r.scene.draw();
    shell.drawWorldBack(); shell.drawMentors(); shell.drawMe(); shell.drawWorldFront(); shell.drawPanel(); shell.drawCard();
  };
  r.pause = () => shell.pause();
  return r;
}
