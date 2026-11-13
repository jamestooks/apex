// A child who waits for Scar and the narrator to finish speaking before acting must still get a fair turn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeShell, makeProfile } from './harness.js';
import { KINDS } from '../../src/play/runner.js';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { pieces, keyFor } from '../../src/engine/speech-text.js';
import { TOOL_ORDER } from '../../src/engine/tools/index.js';
import { makeBot } from './bots.js';

const manifest = JSON.parse(readFileSync('voice/manifest.json', 'utf8'));
const realVoice = () => ({ speak: (who, text, names) => pieces(who, text, names, k => k in manifest).reduce((s, p) => s + (p.clip ? manifest[keyFor(who, p.text)] : 0.35 + p.text.split(' ').length * 0.38), 0), stop() {}, enabled: () => true });

// Waits until the speech box is empty before doing anything, then plays calmly with the right tool.
function listener(fi) {
  const calm = makeBot('calm', fi);
  return (shell, m) => { if (!shell.quiet && !shell.activeTool && !(shell.runs.longExhale && shell.runs.longExhale.phase !== 'idle')) return; calm({ shell, runner: { scene: m, step: 'scenario' } }); };
}

for (const ch of CHAPTERS) for (const sc of [...ch.scenarios.test, ...ch.scenarios.mix, ...ch.scenarios.big].filter(s => s.kind === 'moment')) {
  test(`${ch.title}: ${sc.id} gives a listening child a fair turn`, () => {
    const p = makeProfile({ toolbelt: TOOL_ORDER.slice() });
    const { shell, fi } = makeShell({ profile: p, voice: realVoice(), tools: TOOL_ORDER.slice() });
    shell.mentor = sc.mentor || ch.mentor || 'scar';
    const tools = sc.chooseTool ? TOOL_ORDER.slice() : TOOL_ORDER.slice(0, Math.min(5, ch.n)); // the toolbelt a child has by this chapter
    shell.setStage({ instincts: sc.meters, tools, targets: { oneThing: sc.oneThing || null } });
    const m = KINDS.moment(sc, shell), bot = listener(fi);
    for (let t = 0; !m.done && t < 200; t += 1 / 20) {
      if (shell.card) { if (shell.T - shell.cardBorn > 0.75) shell.dismissCard(); } else bot(shell, m);
      shell.update(1 / 20); if (!shell.card) m.update(1 / 20); shell.input.beginFrame();
    }
    assert.equal(m.done, true);
    assert.equal(m.result.forced, false, 'rage took over while the child was still listening');
  });
}
