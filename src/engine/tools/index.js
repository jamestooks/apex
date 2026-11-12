import * as longExhale from './longExhale.js';
import * as oneThing from './oneThing.js';
import * as parkIt from './parkIt.js';
import * as burstRest from './burstRest.js';
import * as waitSignal from './waitSignal.js';
import { INSTINCTS } from '../meter.js';

export const TOOLS = { longExhale, oneThing, parkIt, burstRest, waitSignal };
export const TOOL_ORDER = ['longExhale', 'oneThing', 'parkIt', 'burstRest', 'waitSignal'];
export function toolForInstinct(instinct) { return TOOLS[INSTINCTS[instinct].tool]; }
