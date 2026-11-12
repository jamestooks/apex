import rage from './1-rage.js';
import overwhelm from './2-overwhelm.js';
import distraction from './3-distraction.js';
export const CHAPTERS = [rage, overwhelm, distraction];
export const chapterByN = n => CHAPTERS.find(c => c.n === n);
