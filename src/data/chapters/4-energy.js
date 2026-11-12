// Chapter 4: The River Run. Energy, and Burst & Rest. Mentor: Scar.
const T = (x, gy, label, w = 64, h = 46) => ({ x, gy, w, h, label });
const S = (x, sy, label, w = 116, h = 36) => ({ x, sy, w, h, label });
const riverTargets = {
  cover: [T(30, -50, 'Reeds', 84, 52), T(290, -50, 'The bank', 84, 50)],
  see: [{ at: 'sun', w: 74, h: 70, label: 'The sun' }, { at: 'river', w: 110, h: 40, label: 'The river' }, T(40, -200, 'Clouds', 70, 50)],
  hear: [T(40, -310, 'Thunder'), T(180, -330, 'Water'), T(310, -300, 'The pack')],
  feel: [S(18, -110, 'Rain on me'), S(142, -110, 'Mud underfoot'), S(266, -110, 'My heartbeat')],
};
const base = { kind: 'run', meters: ['fuel'], primary: 'fuel', mentor: 'scar' };

export default {
  n: 4, id: 'energy', title: 'The River Run', place: 'The River Run', instinct: 'fuel', tool: 'burstRest', mentor: 'scar',
  theme: 'river', season: 'Flood season', strength: 'Speed and energy', blurb: 'Energy. Burst & Rest.',
  legs: [['teach', 'test'], ['mix', 'big']],
  intro: { title: 'OLD SCAR', sub: 'At the river at dawn',
    body: "You've got more speed than any of us. Your engine never stops. That's a gift, but running flat out all day is exhausting.\n\nSpeed isn't the problem. Running until you drop is. I've watched young hunters sprint the whole hunt and collapse right before the catch.\n\nThe trick is short bursts, then rest." },
  toolCard: { title: 'BURST & REST', sub: 'Your energy is a weapon. Spend it on purpose.',
    body: 'HOLD anywhere to sprint. LET GO to rest.\n\nShort bursts beat one long sprint. If the FUEL meter fills, you burn out and have to lie down.\n\nAt rest stops, hold BURST & REST and do a real movement break: reach up high, then shake it out.' },
  practice: { ...base, id: 'practice', distance: 800, target: { type: 'pack', speed: 70 }, practice: true,
    intro: 'Scar jogs along the riverbank. "Keep up. Bursts and rests."', hint: 'Hold anywhere to sprint. Let go to rest.',
    success: { title: 'PRACTICE DONE', line: 'You kept up, and you still had speed left.' }, fail: { line: '' } },
  legIntro: [null, { title: 'THE MIGRATION', sub: 'The whole pack moves upriver.', body: '"A long way, a storm coming, and Nip with tired legs. Burst, rest, burst."' }],
  repair: false,
  scenarios: {
    test: [
      { ...base, id: 'first-chase', distance: 1600, target: { type: 'prey', speed: 80, lead: 130 },
        intro: 'A young duck-billed runner wanders from its herd. Your first solo chase.', hint: 'Burst to close in. Rest before your legs give out.',
        success: { line: 'You close the gap in two quick bursts and pounce. The pack will eat.' },
        fail: { line: 'It slips into the reeds. There will be other chases.' } },
      { ...base, id: 'zigzag', distance: 2400, target: { type: 'prey', lead: 480, pattern: [{ sec: 2, speed: 130 }, { sec: 2, speed: 30 }] },
        intro: 'This one is clever. It sprints, then stops, then sprints again.', hint: 'Match it. Rest while it rests. Burst when it bursts.',
        success: { line: 'You match its rhythm, burst when it tires, and catch it at the water\'s edge.' },
        fail: { line: 'It zigzags away across the shallows. Pacing wins chases. Next time.' } },
      { kind: 'moment', id: 'winding-down', meters: ['fuel'], primary: 'fuel', mentor: 'scar', theme: 'moon',
        choices: [
          { k: 'run', label: 'RUN ABOUT', title: 'YOU KEPT RUNNING', col: '#dc2626', instinct: true, anim: 'bolt' },
          { k: 'lie', label: 'LIE DOWN', title: 'YOU LAY DOWN', col: '#7dd3fc', anim: 'lie' },
          { k: 'breathe', label: 'LONG EXHALE', title: 'YOU BREATHED IT OUT', col: '#38bdf8', anim: 'lie' },
          { k: 'scar', label: 'ASK SCAR', title: 'YOU ASKED SCAR', col: '#f59e0b', anim: 'ally' },
        ],
        triggers: [{ delay: 1.5, spike: 0.45, simmer: 0.05,
          intro: 'Night. The pack beds down by the river. But your legs are buzzing, your head is racing, and sleep feels miles away.',
          hint: 'Too wound up to sleep? Hold BURST & REST for a movement break first.' }],
        lockLine: 'Too wound up to settle. Movement break first: hold BURST & REST.',
        gapLine: 'Running about only wound you up more. A movement break. Then lie down.',
        outcomes: {
          run: { line: 'You race up and down the bank. Everyone else is trying to sleep. You end up more awake than ever.' },
          lie: { line: 'You stretch, shake it out, then curl up. The river sounds slow and steady. Your eyes close.' },
          breathe: { line: 'You breathe out slowly, again and again. Your legs go still. Sleep comes.' },
          scar: { line: 'Scar lies down nearby. "Copy me." You match his slow breathing until you drift off.' },
        } },
    ],
    mix: [
      { ...base, id: 'storm-on-the-river', meters: ['fuel', 'overload'], distance: 1900, target: { type: 'pack', speed: 95 },
        oneThing: riverTargets, setpieces: [{ type: 'storm', every: 3.2, firstFlash: 6 }],
        triggers: [{ at: 500, meter: 'overload', spike: 0.35, simmer: 0.04, sfx: 'thunder', intro: 'A storm crashes over the river. Thunder, rain, the water rising.', hint: 'Two meters now. If it all gets too much, stop and find One Thing.' }],
        intro: 'The pack sets off upriver.', hint: 'Burst and rest. Stay with the pack.',
        success: { line: 'You keep your pace and your head through the storm, and reach the high bank with the pack.' },
        fail: { line: '' } },
    ],
    big: [
      { ...base, id: 'the-long-migration', distance: 3200, target: { type: 'pack', speed: 100 }, nip: true, nipSpeed: 78,
        strength: 'Speed, aimed well: you had the energy to look after Nip.',
        restStops: [{ at: 1000, prompt: 'Rest stop. Real movement break: hold BURST & REST, reach up high, then shake it out.' },
          { at: 2200, prompt: 'Last rest stop. Movement break. Then the final stretch.' }],
        intro: 'The great migration. The whole pack runs upriver to the summer grounds. Nip runs with you.',
        hint: 'A long way. Burst, rest, burst. Keep an eye on Nip.',
        success: { title: 'YOU MADE IT', line: 'You reach the summer grounds with the pack. Nip flops down beside you, tired and proud.' },
        fail: { line: '' } },
    ],
  },
  den: {
    questions: [
      'When did your body feel like it couldn\'t stop this week? What helped?',
      'What is something you do with all your energy that you are really good at?',
      'Where could you fit a movement break into homework or bedtime?',
    ],
    mission: 'Try one burst and rest during homework this week: work hard for a bit, then a movement break.',
    phrase: 'Burst and rest.',
    strengthLine: 'Your engine never stops. It can wear you out, but aimed well it is speed and energy nobody else in the pack has.',
    planTitle: 'MY BURST & REST PLAN',
    planSteps: [
      { head: 'NOTICE MY SIGNS', lines: ['{signsList}', 'Rest at the FIRST one.'], col: '#bae6fd' },
      { head: 'BURST', lines: ['Work hard for a short time. Set a timer if it helps.'], col: '#38bdf8' },
      { head: 'REST', lines: ['Movement break: reach up high, shake it out, get a drink.'], col: '#86efac' },
      { head: 'WIND DOWN', lines: ['Before bed: movement break, then slow breaths.'], col: '#f59e0b' },
    ],
  },
  coach: {
    say: ['Burst and rest.', 'Time for a movement break?'],
    avoid: ['"Sit still."', '"Calm down" at bedtime while they are buzzing.'],
    alongside: 'Do the movement break together: reach up high, shake out arms and legs, then a few slow breaths. Short work bursts with a timer often work better than one long sit.',
  },
};
