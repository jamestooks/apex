import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS } from '../../src/data/chapters/index.js';
import { KINDS } from '../../src/play/runner.js';
import { SIGN_OPTIONS } from '../../src/data/signs.js';
import { INSTINCTS } from '../../src/engine/meter.js';
import { TOOLS } from '../../src/engine/tools/index.js';

const BANNED = /(?<!isn't |not )\bbad\b|\b(naughty|stupid|lazy|silly boy|wrong with you|failure|idiot|dumb)\b/i;
function strings(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach(x => strings(x, out));
  else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (k !== 'col' && k !== 'sfx') strings(v, out); });
  return out;
}
const allScenarios = ch => [...ch.scenarios.test, ...ch.scenarios.mix, ...ch.scenarios.big];

for (const ch of CHAPTERS) {
  test(`chapter ${ch.n} has the shape every chapter needs`, () => {
    for (const k of ['n', 'id', 'title', 'place', 'theme', 'season', 'strength', 'intro', 'den', 'coach', 'legs']) assert.ok(ch[k] != null, `${k} missing`);
    assert.equal(ch.legs.length, 2);
    if (ch.instinct !== 'all') { assert.ok(INSTINCTS[ch.instinct]); assert.ok(TOOLS[ch.tool]); assert.equal(SIGN_OPTIONS[ch.instinct].length, 8); }
    assert.equal(ch.den.questions.length, 3);
    for (const k of ['mission', 'phrase', 'strengthLine']) assert.ok(ch.den[k], `den.${k}`);
    assert.ok(ch.den.planSteps.length >= 3);
    assert.ok(ch.coach.say.length && ch.coach.avoid.length && ch.coach.alongside);
    assert.ok(ch.scenarios.test.length === 3, 'three test scenarios');
    assert.ok(ch.scenarios.mix.length >= 1 && ch.scenarios.big.length === 1);
  });
  test(`chapter ${ch.n} scenarios are well formed`, () => {
    for (const sc of allScenarios(ch)) {
      assert.ok(KINDS[sc.kind], `${sc.id}: unknown kind ${sc.kind}`);
      assert.ok(sc.meters.includes(sc.primary), `${sc.id}: primary not in meters`);
      if (sc.choices) for (const c of sc.choices) assert.ok(sc.outcomes[c.k], `${sc.id}: no outcome for ${c.k}`);
      if (sc.kind === 'moment') assert.equal(sc.choices.filter(c => c.instinct).length, 1, `${sc.id}: one instinct choice`);
    }
  });
  test(`chapter ${ch.n} copy never shames`, () => {
    for (const s of strings(ch)) assert.ok(!BANNED.test(s), `banned word in: ${s}`);
  });
}
