// Lists every line the game can speak, so each gets a recorded clip. Usage: node scripts/voice/collect.mjs
// Plays the whole game headlessly with several play styles, tries every choice in every moment scene, and
// records what Scar, Echo and the narrator say (split into the same pieces the game looks up at runtime).
import { writeFileSync } from 'node:fs';
import { makeShell, makeProfile, calmBot } from '../../tests/sim/harness.js';
import { makeBot } from '../../tests/sim/bots.js';
import { createRunner, KINDS, WARN_3, WARN_1 } from '../../src/play/runner.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { SIGN_OPTIONS } from '../../src/data/signs.js';
import { TOOL_ORDER } from '../../src/engine/tools/index.js';
import { recordPieces, keyFor } from '../../src/engine/speech-text.js';
import { NEXT_STEPS } from '../../src/engine/kinds/winddown.js';

const lines = new Map();
const add = (who, text) => { if (!['scar', 'echo', 'narr'].includes(who)) who = 'narr'; const k = keyFor(who, text); if (!lines.has(k)) lines.set(k, { speaker: who, text, key: k }); };
const spy = () => ({ speak(who, text, names) { for (const t of recordPieces(text, names)) add(who, t); return 0; }, stop() {}, enabled: () => true });

function signsFor(p, i) { for (const k of Object.keys(SIGN_OPTIONS)) p.signs[k] = SIGN_OPTIONS[k].slice(i, i + 3); }

async function wholeGame(policy, signOffset) {
  const profile = makeProfile({ chapters: {}, toolbelt: [] });
  signsFor(profile, signOffset);
  for (const ch of CHAPTERS) for (const leg of [0, 1]) {
    const { shell, fi } = makeShell({ profile, theme: ch.theme, voice: spy() });
    const runner = createRunner({ profile, chapter: ch, mode: 'leg', leg, shell, now: () => 0, session: { capReached: () => false }, pickSigns: () => {}, onDone: () => {} });
    const bot = makeBot(policy, fi);
    for (let t = 0; !runner.finished && t < 1800; t += 1 / 20) {
      if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); } else bot({ shell, runner });
      runner.update(1 / 20); shell.input.beginFrame();
      if (runner.waiting) await null;
    }
  }
}
// Every choice in every moment scene, so every outcome card is heard.
function everyChoice() {
  for (const ch of CHAPTERS) for (const sc of [...ch.scenarios.test, ...ch.scenarios.mix, ...ch.scenarios.big].filter(s => s.kind === 'moment')) {
    for (const c of sc.choices) for (const calm of [true, false]) {
      const p = makeProfile({ toolbelt: TOOL_ORDER.slice() }); signsFor(p, 0);
      const { shell } = makeShell({ profile: p, voice: spy(), tools: TOOL_ORDER.slice() });
      shell.mentor = sc.mentor || ch.mentor || 'scar';
      shell.setStage({ instincts: sc.meters, tools: TOOL_ORDER.slice(), targets: { oneThing: sc.oneThing || null } });
      const m = KINDS.moment(sc, shell);
      for (let t = 0; !m.done && t < 120; t += 1 / 20) {
        if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); }
        else if (m.phase === 'live') { shell.meters.list.forEach(x => x.set(calm ? 0.1 : 0.6)); m.choose(c.k, false); }
        shell.update(1 / 20); if (!shell.card) m.update(1 / 20); shell.input.beginFrame();
      }
    }
  }
}
// Ambush scenes where the child holds on and misses the signal (the "a beat late" card).
function ambushLate() {
  for (const ch of CHAPTERS) for (const sc of [...ch.scenarios.test, ...ch.scenarios.mix, ...ch.scenarios.big].filter(s => s.kind === 'ambush')) {
    const p = makeProfile(); signsFor(p, 0);
    const { shell, fi } = makeShell({ profile: p, voice: spy() });
    shell.setStage({ instincts: sc.meters, tools: ['longExhale'] });
    const k = KINDS.ambush(sc, shell); fi.down(200, 200, 7);
    for (let t = 0; !k.done && t < 120; t += 1 / 20) { if (shell.card && shell.T - shell.cardBorn > 0.75) shell.dismissCard(); shell.update(1 / 20); if (!shell.card) k.update(1 / 20); shell.input.beginFrame(); }
    if (sc.meters.includes('rage')) { // rage boils over while hiding
      const { shell: s2, fi: f2 } = makeShell({ profile: p, voice: spy() });
      s2.setStage({ instincts: sc.meters, tools: ['longExhale'] });
      const k2 = KINDS.ambush(sc, s2); f2.down(200, 200, 7);
      for (let t = 0; !k2.done && t < 120; t += 1 / 20) { if (s2.card && s2.T - s2.cardBorn > 0.75) s2.dismissCard(); if (k2.phase === 'hide') s2.meters.get('rage').set(1); s2.update(1 / 20); if (!s2.card) k2.update(1 / 20); s2.input.beginFrame(); }
    }
  }
}
function repairAndWinddown() {
  for (let i = 0; i < NEXT_STEPS.length; i++) for (const capped of [false, true]) {
    const { shell } = makeShell({ voice: spy() });
    shell.setStage({ instincts: ['rage'], tools: ['longExhale'] });
    const w = winddown(shell, { capped, pick: () => (i + 0.5) / NEXT_STEPS.length });
    for (let t = 0; !w.done && t < 40; t += 1 / 20) { if (shell.card && shell.T - shell.cardBorn > 0.75) shell.dismissCard(); shell.update(1 / 20); if (!shell.card) w.update(1 / 20); shell.input.beginFrame(); }
  }
  for (const choice of ['peace', 'wait']) {
    const { shell } = makeShell({ voice: spy() });
    shell.setStage({ instincts: ['rage'], tools: ['longExhale'] });
    const r = repair(shell, { who: 'nip' });
    for (let t = 0; !r.done && t < 40; t += 1 / 20) { if (shell.card && shell.T - shell.cardBorn > 0.75) shell.dismissCard(); else if (shell.choices) shell.choiceCb(choice); shell.update(1 / 20); if (!shell.card) r.update(1 / 20); shell.input.beginFrame(); }
  }
}
import { createWinddown as winddown } from '../../src/engine/kinds/winddown.js';
import { createRepair as repair } from '../../src/engine/kinds/repair.js';

for (const p of ['calm', 'lazy', 'neverAct', 'alwaysInstinct', 'learns']) for (const off of [0, 3]) await wholeGame(p, off);
everyChoice(); ambushLate(); repairAndWinddown();
// Fixed lines in the code that play rarely (pauses, timeouts, warnings): find every literal passed to say().
function walk(d, out = []) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p, out) : p.endsWith('.js') && out.push(p); } return out; }
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/say\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`([^`$]*)`)\s*,[^,)]*,[^,)]*(?:,\s*'(\w+)')?/g)) {
    const text = (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'").replace(/\\"/g, '"');
    const who = m[4];
    // Speaker given: record it. No speaker (it's whoever mentors the chapter): only add if the play-throughs never heard it, as Scar.
    for (const t of recordPieces(text, [])) if (who) add(who, t); else if (!['scar', 'echo'].some(sp => lines.has(keyFor(sp, t)))) add('scar', t);
  }
}
for (const sp of ['scar', 'echo']) for (const t of [WARN_3, WARN_1]) add(sp, t); // either mentor can be on duty
for (const t of ['The valley waits for you.', 'Tap to carry on.']) add('narr', t);
// Every built-in warning sign on its own, in each voice, for lines that name the child's signs.
for (const who of ['scar', 'echo']) for (const list of Object.values(SIGN_OPTIONS)) for (const s of list) add(who, s); // only mentors name a child's signs

const out = [...lines.values()].sort((a, b) => a.speaker.localeCompare(b.speaker) || a.text.localeCompare(b.text));
writeFileSync('voice/lines.json', JSON.stringify(out, null, 1));
const words = out.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
console.log(`${out.length} lines (${out.filter(l => l.speaker === 'scar').length} Scar, ${out.filter(l => l.speaker === 'echo').length} Echo, ${out.filter(l => l.speaker === 'narr').length} narrator), about ${words} words`);
