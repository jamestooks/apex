// Chapter 1: The Feeding Ground. Rage, and the Long Exhale. Copy for the test scenes is the prototype's, verbatim.
const CHOICES = [
  { k: 'attack', label: 'ATTACK', title: 'YOU ATTACKED', col: '#dc2626', instinct: true, anim: 'charge' },
  { k: 'stand', label: 'STAND TALL', title: 'YOU STOOD TALL', col: '#f59e0b', anim: 'stand' },
  { k: 'walk', label: 'WALK AWAY', title: 'YOU WALKED AWAY', col: '#a8a29e', anim: 'retreat' },
  { k: 'scar', label: 'GET SCAR', title: 'YOU GOT SCAR', col: '#38bdf8', anim: 'ally' },
];
const base = { kind: 'moment', meters: ['rage'], primary: 'rage', choices: CHOICES, carcass: { x: 218 }, mentor: 'scar' };

export default {
  n: 1, id: 'rage', title: 'The Feeding Ground', place: 'The Feeding Ground', instinct: 'rage', tool: 'longExhale', mentor: 'scar',
  theme: 'dusk', season: 'Dry season', strength: 'Passion: standing up for yourself',
  scenarios: {
    test: [
      { ...base, id: 'bump',
        triggers: [{ who: 'nip', enter: 262, spike: 0.30, simmer: 0.03,
          intro: 'Nip, the youngest of the pack, barges in and snatches meat right from under your nose.',
          introWary: 'Nip edges in, keeping one eye on you, and snatches meat from under your nose.',
          hint: "Little Nip. Check your signs. What's your body telling you?" }],
        outcomes: {
          attack: { trust: -1, hurtPack: true, line: "Nip yelps and runs. He's pack, and half your size. The others saw it." },
          stand: { line: 'You rise to your full height and look him in the eye. Nip drops the meat and backs off. He knows where the line is now.' },
          walk: { line: "You shift round to the other side of the kill. A scrap isn't worth a fight. Smart." },
          scar: { line: 'Scar gives one low chirp and Nip slinks away. Asking for help is what the pack is for.' },
        } },
      { ...base, id: 'taunt', taunt: true,
        triggers: [{ who: 'fang', enter: 318, spike: 0.30, simmer: 0.06,
          intro: 'Fang, a rival from another pack, circles you. Snarling. Mocking. Trying to get a reaction.',
          hint: "Fang wants you to snap. That's his whole game." }],
        outcomes: {
          attack: { trust: -1, injure: true, line: 'You launch at Fang. Teeth, claws, dust. You limp back hurt. He got exactly what he wanted.' },
          stand: { line: 'You hold still and stare him down. Fang gets bored and leaves. He feeds on rage, and you gave him none.' },
          walk: { line: 'You turn your back and walk over to Scar. Fang hangs about, then gives up. Walking away from a pointless fight takes guts.' },
          scar: { line: "Scar steps forward beside you. Fang backs off fast. Knowing when to get backup is a hunter's skill." },
        } },
      { ...base, id: 'steal',
        triggers: [{ who: 'fang', enter: 262, sp: 160, spike: 0.40, simmer: 0.05, grab: true,
          intro: 'Fang is back. He grabs your kill and starts dragging it away!',
          hint: 'Your kill. Your choice. But breathe first.' }],
        outcomes: {
          attack: { trust: -1, injure: true, meat: false, line: 'You charge in, raging. In the scuffle you get hurt AND the meat is lost in the dust.' },
          stand: { line: 'You plant your feet and give one deep, steady growl. Fang drops your kill and slinks off.' },
          walk: { meat: false, line: "You let it go. You lost a meal, but you're not hurt. There will be other hunts. You're worth more than one kill." },
          scar: { line: 'You call for Scar. Together you stand over the kill and Fang backs down. You kept your head AND your meal.' },
        } },
    ],
    mix: [],
    big: [],
  },
};
