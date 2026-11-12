// After a blow-up there is always a way to make it right (spec: Repair is a skill). Ported from the prototype.
import { GY } from '../canvas.js';
import { drawRaptor } from '../../art/raptor.js';

const CHOICES = [
  { k: 'peace', label: 'MAKE PEACE', col: '#38bdf8', always: true },
  { k: 'wait', label: 'NOT YET', col: '#a8a29e', always: true },
];

export function createRepair(sh, { who = 'nip' } = {}) {
  const A = sh.actors, n = A[who], SFX = sh.env.audio.SFX;
  const r = { phase: 'arrive', anim: 0, done: false, result: null };
  n.on = true; n.x = 470; n.tx = 330; n.sp = 45; n.face = -1;
  sh.clearChoices(); sh.panelText = '';
  sh.say("Nip creeps back, keeping his distance. After what he saw, he's wary of you.", 5, 3, 'narr');
  sh.sayNext('Everyone loses it sometimes. What you do next is what the pack remembers.', 5, 'scar');

  function choose(k) {
    if (r.phase !== 'live') return;
    r.phase = 'resolve'; r.anim = 0; r.choice = k; sh.clearChoices();
    if (k === 'peace') { sh.stats.trustDelta += 1; sh.stats.repaired = true; n.tx = A.me.x + 62; n.sp = 55; SFX.chirp(); SFX.swell(); }
    else { n.tx = 470; n.sp = 60; }
  }
  r.update = dt => {
    sh.updateTools(dt);
    if (r.phase === 'arrive') { if (!sh.move(n, dt)) { r.phase = 'live'; sh.setChoices(CHOICES, choose); } }
    else if (r.phase === 'resolve') {
      r.anim += dt; sh.move(n, dt);
      if (r.anim > 2.4) {
        r.phase = 'card'; const p = r.choice === 'peace'; if (!p) n.on = false;
        r.result = { peace: p };
        sh.showCard({ title: p ? 'YOU MADE PEACE' : 'NOT YET', good: p,
          sub: p ? 'You lower your head and let Nip come close. He settles beside you.' : 'Nip keeps his distance for now.',
          body: p ? '"That took more courage than any fight. Trust comes back, one calm moment at a time."\n\nPack trust: rising'
                  : '"That\'s all right. You can\'t make peace until you\'re calm. The chance will come again."',
          cb: () => { r.done = true; r.phase = 'done'; n.on = false; } });
      }
    }
  };
  r.draw = () => {
    sh.drawWorldBack();
    sh.drawMentors();
    if (n.on) { const mv = Math.abs(n.tx - n.x) > 1; drawRaptor(n.x, GY() + 2, n.s, mv ? 'walk' : 'crouch', sh.T * 0.6, n.tx > n.x + 1 ? 1 : (mv ? -1 : n.face), {}); }
    sh.drawMe();
    sh.drawWorldFront(); sh.drawPanel(); sh.drawCard();
  };
  return r;
}
