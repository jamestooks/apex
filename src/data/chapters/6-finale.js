// Chapter 6: The Burning Valley. All instincts. Choose your tool. The finale.
import { INSTINCTS } from '../../engine/meter.js';

const T = (x, gy, label, w = 64, h = 46) => ({ x, gy, w, h, label });
const S = (x, sy, label, w = 116, h = 36) => ({ x, sy, w, h, label });
const ashTargets = {
  cover: [T(20, -50, 'Rocks', 84, 52), T(296, -50, 'Ridge', 84, 50)],
  see: [{ at: 'scar', w: 70, h: 60, label: 'Scar' }, { at: 'volcano', w: 90, h: 70, label: 'The volcano' }, T(290, -40, 'A path', 64, 46)],
  hear: [T(40, -320, 'Rumbling'), T(180, -340, 'The pack'), T(310, -310, 'Wind')],
  feel: [S(18, -110, 'Warm ground'), S(142, -110, 'Ash on me'), S(266, -110, 'My heartbeat')],
};
const base = { chooseTool: true, mentor: 'scar' };
const MOMENT_HINT = 'Which tool does this moment need?';

export default {
  n: 6, id: 'finale', title: 'The Burning Valley', place: 'The Burning Valley', instinct: 'all', tool: null, mentor: 'scar',
  theme: 'ash', season: 'Fire season', strength: 'Knowing your own brain', blurb: 'All of it. Choose your tool.',
  legs: [['teach', 'test'], ['mix', 'big']],
  intro: { title: 'OLD SCAR', sub: 'The mountain is waking',
    body: "The volcano is waking up. Soon the whole valley will burn, and the pack will need someone to lead them out.\n\nI can't tell you which tool any more. You know your own brain.\n\nRage, overload, drift, energy, the urge. You have a tool for every one." },
  teachSteps: [
    { type: 'card', card: null, cardFn: () => ({ title: 'OLD SCAR', sub: 'The mountain is waking',
      body: "The volcano is waking up. Soon the whole valley will burn, and the pack will need someone to lead them out.\n\nI can't tell you which tool any more. You know your own brain." }) },
    { type: 'card', cardFn: p => ({ title: 'YOUR SIGNS', sub: 'Your body, your warning signs.',
      body: ['rage', 'overload', 'drift', 'fuel', 'urge'].filter(k => p.signs[k] && p.signs[k].length === 3)
        .map(k => `${INSTINCTS[k].label}: ${p.signs[k].join(', ')}`).join('\n') + '\n\nYou can change them any time in the Den.' }) },
    { type: 'scene', sc: { kind: 'teachNip', meters: ['rage'], primary: 'rage' } },
  ],
  legIntro: [null, { title: 'THE ERUPTION', sub: 'The mountain blows.', body: '"This is it. Lead them out. And whatever happens with Fang, remember who you are."' }],
  repair: true,
  endingCards: [
    () => ({ title: 'FIRE SEASON ENDS', sub: 'The rains come. The valley turns green again.', body: '"A whole year. Look at you."' }),
    p => ({ title: p.raptorName.toUpperCase(), sub: 'Full grown. Every scar earned.', body: '"You came to this pack a restless young outsider. Too impatient to hunt, they said. Look who led them out of the fire."' }),
    (p, sh) => sh.stats.finaleCalm || p.finaleCalm
      ? { title: 'APEX', sub: 'Leader of the pack', good: true, body: '"The strongest hunter steers the fire inside. That is you now."' }
      : { title: 'THE PACK IS SAFE', sub: 'Fang still needs someone to show him the way.', body: '"Play the Burning Valley again when you are ready. There is one more thing only you can do."' },
    () => ({ title: 'OLD SCAR', sub: 'One last thing',
      body: '"Your brain is not broken. It is fast, and loud, and full of fire. You know how to aim it now.\n\nEvery tool you learned here works out there too. In the car, at school, at bedtime. No screen needed."' }),
  ],
  scenarios: {
    test: [
      { ...base, kind: 'moment', id: 'eruption', meters: ['overload'], primary: 'overload', oneThing: ashTargets, coverX: 70,
        setpieces: [{ type: 'calls', texts: ['RUN!', 'THIS WAY!', 'FIRE!', 'HELP!'], every: 0.7 }],
        choices: [
          { k: 'bolt', label: 'BOLT', title: 'YOU BOLTED', col: '#dc2626', instinct: true, anim: 'bolt' },
          { k: 'lead', label: 'LEAD THE WAY', title: 'YOU LED THE WAY', col: '#f59e0b', anim: 'retreat' },
          { k: 'high', label: 'HIGH GROUND', title: 'YOU FOUND HIGH GROUND', col: '#6ee7b7', anim: 'shelter' },
          { k: 'scar', label: 'FIND SCAR', title: 'YOU FOUND SCAR', col: '#38bdf8', anim: 'ally' },
        ],
        triggers: [{ delay: 1.2, spike: 0.36, simmer: 0.06, sfx: 'eruption',
          intro: 'The mountain explodes. Fire and ash rain down. The whole pack is screaming and running in every direction.', hint: MOMENT_HINT }],
        gapLine: 'Running blind did not help. Which tool does this need? You know.',
        outcomes: {
          bolt: { injure: true, line: 'You run blind through the smoke and come out alone, singed and lost. Scar finds you.' },
          lead: { strength: 'You noticed the safe path while everyone else panicked.', line: 'In all the noise, you spot the safe path down the ridge and call the pack after you.' },
          high: { line: 'You find a high rock above the ash and call the pack up to you.' },
          scar: { line: 'You find Scar in the smoke. Together you gather the pack.' },
        } },
      { ...base, kind: 'ambush', id: 'lava-stones', meters: ['urge'], primary: 'urge', meal: false, signalAt: 14,
        setpieces: [{ type: 'lavaStones', n: 4, x: 200 }],
        waves: [{ at: 2, peak: 0.4, rise: 2, fall: 3 }, { at: 8, peak: 0.45, rise: 2, fall: 3 }],
        intro: 'A river of lava blocks the way. Stepping stones cross it, but they are still wobbling in the heat.',
        hint: 'Hold still until the stones settle. Every part of you wants to jump NOW.',
        signalLine: 'The stones stop wobbling. GO!', pounceLabel: 'JUMP!',
        earlyLine: 'You jump too soon. A stone tips and you scramble back, scorched.',
        outcomes: { success: { title: 'ACROSS', line: 'You wait, the stones settle, and you hop across. The pack follows in your footsteps.' },
          early: { line: 'You jump too soon. A stone tips and you scramble back, scorched. Scar shows you another way.' },
          late: { line: 'The stones settle, and you are still frozen. Nip nudges you. You cross, a little behind.' },
          takeover: { line: 'You leap before you even decide to. Scar hauls you back.' }, blown: { line: '' } } },
      { ...base, kind: 'run', id: 'the-run-out', meters: ['fuel'], primary: 'fuel', distance: 2600, target: { type: 'pack', speed: 100 },
        intro: 'The valley is burning. The pack runs for the river, and you are at the front.', hint: 'A long way. Pace it.',
        success: { title: 'TO THE RIVER', line: 'You reach the river with the whole pack behind you. Nobody left behind.' }, fail: { line: '' } },
    ],
    mix: [
      { ...base, kind: 'moment', id: 'panic-at-the-ridge', meters: ['rage', 'overload'], primary: 'rage', oneThing: ashTargets,
        choices: [
          { k: 'snap', label: 'SNAP', title: 'YOU SNAPPED', col: '#dc2626', instinct: true, anim: 'charge' },
          { k: 'stand', label: 'STAND TALL', title: 'YOU STOOD TALL', col: '#f59e0b', anim: 'stand' },
          { k: 'calm', label: 'CALM NIP', title: 'YOU CALMED NIP', col: '#6ee7b7', anim: 'lead' },
          { k: 'scar', label: 'GET SCAR', title: 'YOU GOT SCAR', col: '#38bdf8', anim: 'ally' },
        ],
        triggers: [
          { delay: 1, meter: 'overload', spike: 0.28, simmer: 0.04, sfx: 'eruption', intro: 'Another blast shakes the ridge. Rocks tumble.', hint: MOMENT_HINT },
          { who: 'nip', at: 3, enter: 230, meter: 'rage', spike: 0.25, simmer: 0.03, intro: 'Nip panics and clamps onto your tail, yanking you backwards.' },
          { who: 'fang', at: 7, enter: 330, meter: 'rage', spike: 0.25, simmer: 0.04, intro: 'And Fang shoves right past you both. "Out of my way!"', hint: 'Two meters. Which first?' },
        ], target: 'fang',
        outcomes: {
          snap: { hurtPack: true, injure: true, line: 'You whirl and snap at everyone. Nip lets go, crying. Fang snaps back. Nobody moves forward.' },
          stand: { line: 'You plant your feet, tall and steady. Fang hesitates and goes round you. Nip lets go of your tail.' },
          calm: { line: 'You turn to Nip, slow and calm: "With me." He lets go and follows. Fang is not your problem right now.' },
          scar: { line: 'Scar is there in a heartbeat. He takes Nip. You keep the pack moving.' },
        } },
    ],
    big: [
      { ...base, kind: 'moment', id: 'fang-is-trapped', meters: ['rage'], primary: 'rage', oneThing: ashTargets,
        setpieces: [{ type: 'log', x: 290, w: 84, lift: 19, burning: true }],
        choices: [
          { k: 'attack', label: 'ATTACK', title: 'YOU ATTACKED', col: '#dc2626', instinct: true, anim: 'charge' },
          { k: 'leave', label: 'LEAVE HIM', title: 'YOU LEFT HIM', col: '#a8a29e', anim: 'leave' },
          { k: 'help', label: 'HELP HIM', title: 'YOU HELPED FANG', col: '#f59e0b', anim: 'help' },
          { k: 'scar', label: 'GET SCAR', title: 'YOU GOT SCAR', col: '#38bdf8', anim: 'ally' },
        ],
        triggers: [{ who: 'fang', fromX: 300, enter: 300, pinned: true, spike: 0.45, simmer: 0.06,
          intro: 'Fang is pinned under a burning log. Even trapped, he snarls at you. "What are YOU looking at?"',
          hint: 'He has spent all year winding you up. And now he needs you. What will you choose?' }],
        target: 'fang',
        outcomes: {
          attack: { injure: true, stays: true, line: 'You lunge at him. Smoke, sparks, a burn on your leg. Scar drags the log off Fang himself.' },
          leave: { stays: true, line: 'You walk away. Scar goes back for Fang. Everyone gets out, but Fang never looks at you.' },
          help: { finaleCalm: true, strength: 'Knowing your own brain: you chose calm when it mattered most.', line: 'You breathe, plant your feet and heave. The log rolls away. Fang stares at you. Then he lowers his head. The pack follows you out.' },
          scar: { line: 'You call Scar and together you shift the log. Fang limps out, quiet for once.' },
        } },
    ],
  },
  den: {
    questions: [
      'Which tool is your favourite, and when will you use it next?',
      'Which instinct shows up the most for you? What is its upside?',
      'If you could teach one tool to someone in your family, which would it be?',
    ],
    mission: 'Teach a grown-up your favourite tool.',
    phrase: 'Which tool do you need?',
    strengthLine: 'You know your own brain. That is what makes a leader.',
    planTitle: 'MY TOOLBELT',
    planSteps: [
      { head: 'RAGE', lines: ['Long Exhale: in for 3, out for 5.'], col: '#fca5a5' },
      { head: 'TOO MUCH', lines: ['One Thing: see one, hear one, feel one.'], col: '#fde68a' },
      { head: 'DRIFTING', lines: ["Park It: say 'later', save it, come back."], col: '#86efac' },
      { head: 'WOUND UP', lines: ['Burst & Rest: movement break.'], col: '#7dd3fc' },
      { head: 'CAN\'T WAIT', lines: ['Wait for the Signal: ride the wave.'], col: '#d8b4fe' },
    ],
  },
  coach: {
    say: ['Which tool do you need?', 'What is your body telling you right now?'],
    avoid: ['Choosing the tool for them every time.', 'Bringing up past blow-ups in the moment.'],
    alongside: 'Ask "Which tool?" and let them choose, then do it with them. Over time, wait a beat before prompting: the goal is them noticing first.',
  },
};
