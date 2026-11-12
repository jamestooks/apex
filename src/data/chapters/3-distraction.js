// Chapter 3: The Fern Maze. Distraction, and Park It. Mentor: Echo.
const F = (name, line) => ({ name, line });
export const FINDS = {
  'Jewel beetle': "That shell shimmers because it lives near water. Now you know where to drink. Good eye.",
  'Blue butterfly': 'Butterflies gather where flowers grow, and plant-eaters follow flowers. You noticed a clue.',
  'Strange call': 'That was a far-off pack talking. Knowing who else is out there keeps everyone safe.',
  'Shiny stone': 'A stone polished by a river. Rivers mean fish, and crossings, and shortcuts.',
  'Glowing amber': 'Amber is old tree sap. There is a tiny insect trapped inside, older than the mountains.',
  'Nip': 'You told Nip "after the hunt", and you kept your word. Now he trusts "later" means later.',
  'Odd feather': 'A feather from a bird nobody in the pack has seen. You notice what others miss.',
};
const find = n => F(n, FINDS[n]);
const base = { kind: 'track', meters: ['drift'], primary: 'drift', mentor: 'echo', strength: 'Noticing what others miss, then choosing when to look.' };

export default {
  n: 3, id: 'distraction', title: 'The Fern Maze', place: 'The Fern Maze', instinct: 'drift', tool: 'parkIt', mentor: 'echo',
  theme: 'ferns', season: 'Green season', strength: 'Noticing what others miss', blurb: 'Distraction. Park It.',
  legs: [['teach', 'test'], ['mix', 'big']],
  intro: { title: 'ECHO', sub: 'Tracker of the pack',
    body: "You notice things nobody else does. A twitch in the ferns. A feather on the path. That's a tracker's gift.\n\nThe trick is choosing WHEN to look. In the Fern Maze, the shiny things will try to pull you off the trail.\n\nI don't ignore them. I park them, and come back later." },
  toolCard: { title: 'PARK IT', sub: "Interesting things aren't the problem. Chasing them in the middle of a hunt is.",
    body: "When something shiny pulls at you, say 'LATER' out loud.\n\nThen DRAG it onto your scent map. It's saved. You can explore it after the hunt.\n\nThen tap the next glowing print and carry on." },
  practice: { kind: 'track', meters: ['drift'], primary: 'drift', prints: 4, fadeSec: 9, practice: true,
    distractions: [{ at: 1, type: 'beetle', simmer: 0.03, spike: 0.12, find: find('Jewel beetle'), hint: "Ooh, shiny. Say 'later', then drag it to your scent map." }],
    intro: 'Echo leads you to a quiet patch of ferns to practise.', hint: 'Tap the glowing print to follow the trail.',
    success: { title: 'PRACTICE DONE', line: 'You parked it and stayed on the trail.' }, onTakeover: { line: 'You wandered off after the beetle.' } },
  legIntro: [null, { title: 'DEEPER IN', sub: 'The maze gets thicker. The light gets lower.', body: '"More to notice, more to park. Same plan: say later, park it, back to the trail."' }],
  repair: false,
  scenarios: {
    test: [
      { ...base, id: 'trail-one', prints: 9, fadeSec: 7,
        intro: 'The pack needs a trail to a herd of plant-eaters. Echo has found the first print.', hint: 'Tap the glowing print. One at a time.',
        distractions: [
          { at: 2, type: 'beetle', simmer: 0.06, find: find('Jewel beetle'), intro: 'A jewel beetle crawls across a leaf, flashing green and gold.', hint: "Interesting! Park it. You can come back." },
          { at: 6, type: 'butterfly', simmer: 0.06, find: find('Blue butterfly'), intro: 'A blue butterfly dances right past your nose.' },
        ],
        success: { line: 'You follow the last print to the herd. The pack will eat tonight because of you.' },
        onTakeover: { line: "You chase the shiny thing into the ferns. When you look up, the trail has gone cold. Echo finds you. \"It happens. Let's go home.\"" } },
      { ...base, id: 'trail-two', prints: 11, fadeSec: 5.5,
        intro: 'A faster trail this time. The prints are fading quickly in the damp air.', hint: 'Quick and steady. Park anything shiny straight away.',
        distractions: [
          { at: 2, type: 'call', simmer: 0.07, find: find('Strange call'), intro: 'A strange call echoes through the ferns. What was THAT?' },
          { at: 5, type: 'amber', simmer: 0.07, find: find('Shiny stone'), intro: 'Something glints in the mud. A shiny stone.' },
          { at: 8, type: 'butterfly', simmer: 0.07, find: find('Odd feather'), intro: 'A strange feather floats down in front of you.' },
        ],
        success: { line: 'The trail ends at a herd grazing by a pool. Echo nods at you. "Fast and focused."' },
        onTakeover: { line: 'You wander off to investigate. By the time you come back, the prints have faded. Echo walks you home. "It happens. Tomorrow."' } },
      { ...base, id: 'nip-pesters', prints: 9, fadeSec: 7,
        intro: 'Nip has tagged along on the hunt. He keeps bouncing around you.', hint: "Nip wants to play. Park it: 'Not now, Nip. After the hunt.'",
        distractions: [
          { at: 2, type: 'nip', simmer: 0.07, find: { ...find('Nip'), parkLine: 'Not now, Nip. After the hunt. Promise.' }, intro: 'Nip leaps in front of you. "Play with me! Play with me!"' },
          { at: 6, type: 'beetle', simmer: 0.06, find: find('Jewel beetle'), intro: 'And now a beetle, right on the trail.' },
        ],
        success: { line: 'You reach the herd. Then you turn to Nip: "Right. Now we play." His tail goes mad.' },
        onTakeover: { line: 'You end up chasing Nip round a tree. Fun, but the trail is gone. Echo sighs and smiles. "After, next time."' } },
    ],
    mix: [
      { ...base, id: 'fang-in-the-ferns', meters: ['drift', 'rage'], prints: 10, fadeSec: 7,
        intro: 'Fang is lurking in the Fern Maze, following you.', hint: 'Watch both meters. Park the shiny things. Breathe if Fang gets to you.',
        distractions: [
          { at: 2, type: 'beetle', simmer: 0.06, find: find('Jewel beetle'), intro: 'A jewel beetle catches your eye.' },
          { at: 7, type: 'amber', simmer: 0.06, find: find('Shiny stone'), intro: 'Another glint in the mud.' },
        ],
        triggers: [{ at: 4, who: 'fang', meter: 'rage', spike: 0.32, simmer: 0.05, stay: 9,
          intro: 'Fang steps out of the ferns. "Lost, little tracker? Can\'t even follow a trail?"', hint: "He wants you off the trail. Long Exhale. Don't give him a fight." }],
        success: { line: 'You ignore Fang and finish the trail. He gives up and slinks off. The pack eats well.' },
        onTakeover: { line: 'You lose the trail. Echo finds you and walks you home. "Tomorrow."' } },
    ],
    big: [
      { ...base, id: 'lost-hatchling', prints: 13, fadeSec: 6,
        strength: 'Noticing what others miss: you found Nip when nobody else could.',
        intro: 'Dusk. Nip has wandered into the Fern Maze and not come back. Only you can pick out his tiny prints.',
        hint: 'Everything in here will try to pull you away. Park it all. Nip needs you.',
        distractions: [
          { at: 2, type: 'butterfly', simmer: 0.07, find: find('Blue butterfly'), intro: 'Butterflies swirl in the last of the light.' },
          { at: 5, type: 'call', simmer: 0.07, find: find('Strange call'), intro: 'Something calls in the dark. Not Nip.' },
          { at: 8, type: 'amber', simmer: 0.09, spike: 0.22, find: find('Glowing amber'), intro: 'A lump of amber GLOWS on a fallen tree. The most amazing thing you have ever seen.' },
          { at: 11, type: 'beetle', simmer: 0.07, find: find('Jewel beetle'), intro: 'A beetle glitters on the path.' },
        ],
        success: { title: 'YOU FOUND NIP', line: 'The last print leads to Nip, curled up under a fern. He runs to you. You found him because you stayed on the trail.' },
        onTakeover: { line: 'You get pulled off the trail. Echo finds Nip in the end, and finds you too. Everyone is safe. "Tomorrow, you\'ll be the one who finds him."' } },
    ],
  },
  den: {
    questions: [
      'When did your brain wander off this week? What were you supposed to be doing?',
      'What is the most interesting thing you noticed this week that nobody else did?',
      'What could you "park" during homework, and when could you come back to it?',
    ],
    mission: "Park one distracting thing this week: say 'later', write or draw it down, and come back to it after.",
    phrase: 'Park it.',
    strengthLine: 'You notice what others miss. Aimed well, that is how trackers find trails nobody else can see.',
    planTitle: 'MY PARK IT PLAN',
    planSteps: [
      { head: 'NOTICE MY SIGNS', lines: ['{signsList}', 'Park it at the FIRST one.'], col: '#bbf7d0' },
      { head: "SAY 'LATER'", lines: ['Out loud or in my head.'], col: '#86efac' },
      { head: 'PARK IT', lines: ['Write it, draw it, or put it somewhere I will see it after.'], col: '#7dd3fc' },
      { head: 'BACK TO THE TRAIL', lines: ['Finish the task. Then explore what I parked.'], col: '#f59e0b' },
    ],
  },
  coach: {
    say: ['Park it.', 'Great spot. Let\'s park it and come back after.'],
    avoid: ['"Stop getting distracted."', 'Telling them the interesting thing does not matter.'],
    alongside: 'Keep a "parking spot" (sticky notes or a notebook) by homework. When something pops up, park it together, then actually come back to it afterwards so "later" is real.',
  },
};
