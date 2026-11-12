import rage from './1-rage.js';
import overwhelm from './2-overwhelm.js';
export const CHAPTERS = [rage, overwhelm];
export const chapterByN = n => CHAPTERS.find(c => c.n === n);
