import rage from './1-rage.js';
export const CHAPTERS = [rage];
export const chapterByN = n => CHAPTERS.find(c => c.n === n);
