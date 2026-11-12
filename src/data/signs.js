// Warning signs the player can pick from, per instinct. Grown-ups can add custom ones per child.
export const SIGN_OPTIONS = {
  rage: ['Hot face', 'Clenched fists', 'Tight chest', 'Racing heart', 'Loud voice', 'Shaky body', 'Teary eyes', 'Want to lash out'],
  overload: ['Covering ears', 'Everything too loud', 'Want to hide', "Can't think", 'Snapping at people', 'Frozen', 'Want to run', 'Teary eyes'],
  drift: ['Staring off', 'Fiddling with things', 'Missing what people say', 'Wanting to check something else', 'Bored and fidgety', 'Losing my place', 'Thinking about something else', 'Daydreaming'],
  fuel: ["Can't sit still", 'Bouncing legs', 'Talking super fast', 'Getting giddy', "Can't stop", 'Too wound up to sleep', 'Bumping into things', 'Loud and fast'],
  urge: ['Want to blurt it out', "Can't wait", 'Grabbing things', 'Jumping in', 'Interrupting', 'Fidgety hands', 'Butterflies', 'Have to do it NOW'],
};
export const SIGN_QUESTION = {
  rage: 'Every hunter feels rage coming before it takes over. What does yours feel like?',
  overload: 'When everything comes at once, your body tells you first. What does yours do?',
  drift: 'Before your mind wanders off, there are clues. What are yours?',
  fuel: 'When your engine is running too fast, how can you tell?',
  urge: 'Right before you jump in too soon, what do you notice?',
};
export function signOptionsFor(profile, instinct) {
  const custom = (profile.customSigns && profile.customSigns[instinct]) || [];
  return [...SIGN_OPTIONS[instinct], ...custom.filter(s => !SIGN_OPTIONS[instinct].includes(s))];
}
