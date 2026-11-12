import rage from './1-rage.js';
import overwhelm from './2-overwhelm.js';
import distraction from './3-distraction.js';
import energy from './4-energy.js';
import impulse from './5-impulse.js';
export const CHAPTERS = [rage, overwhelm, distraction, energy, impulse];
export const chapterByN = n => CHAPTERS.find(c => c.n === n);
