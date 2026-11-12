// The opening story, shown once before Chapter 1: why the raptor needs Scar's training, and what's at stake.
// The young raptor's instincts pull it into the Shadow's land; Scar drives the tyrannosaur off; the mountain stirs.
// About a minute. It never waits on the child: holding to run only makes the chase faster. Skippable.
import { ctx, W, SH, GY, FH, FB, rr, view, PANEL } from '../canvas.js';
import { drawRaptor } from '../../art/raptor.js';
import { drawHerd, drawTrex } from '../../art/props.js';

const NARR = 'narr';

export function createPrologue(sh) {
  const A = sh.actors, me = A.me, SFX = sh.env.audio.SFX, input = sh.input, name = (sh.profile && sh.profile.raptorName) || 'Raptor';
  const k = { kind: 'prologue', beat: 'open', t: 0, done: false, result: { calmRun: false }, speed: 0, maxRun: 0, run: 0,
    dark: 0, fade: 1, herdX: 440, trexX: W + 170, trexFace: -1, scarIn: false, said: {} };
  sh.clearChoices(); sh.meterHidden = true; sh.spaceTaken = true; sh.cx = 0; sh.panelText = '';
  me.x = me.tx = 170; me.face = 1; me.limp = false; me.standT = 0;
  A.scar.on = true; A.scar.x = A.scar.tx = 60; A.scar.face = 1;
  A.echo.on = true; A.echo.x = A.echo.tx = 24; A.echo.face = 1;
  A.nip.on = true; A.nip.x = A.nip.tx = 110; A.nip.face = 1;
  A.fang.on = false;

  const skipRect = () => ({ x: W - 112, y: view.H - PANEL + 126, w: 96, h: 44 });
  const padRect = () => ({ x: 16, y: view.H - PANEL + 70, w: W - 144, h: 100 });
  const held = () => input.held({ x: 0, y: 0, w: W, h: SH() }, 'Space') || input.held(padRect());
  const once = (key, fn) => { if (!k.said[key]) { k.said[key] = true; fn(); } };
  const go = beat => { k.beat = beat; k.t = 0; };

  k.skip = () => { k.done = true; k.beat = 'done'; sh.meterHidden = false; sh.spaceTaken = false; A.nip.on = false; A.echo.on = false; };

  k.update = dt => {
    k.t += dt;
    const t = k.t;
    if (k.beat === 'open') {
      k.fade = Math.max(0, 1 - t / 2);
      once('o1', () => sh.say('A volcanic river valley, long ago. A pack of raptors hunts together here.', 5, 3, NARR));
      if (t > 5) once('o2', () => sh.say(`You are ${name}, the youngest hunter in the pack. Your senses never switch off.`, 5.5, 3, NARR));
      if (t > 11) go('tempt');
    } else if (k.beat === 'tempt') {
      k.herdX = Math.max(330, k.herdX - 30 * dt);
      once('t1', () => { sh.say('A herd moves on the far ridge. Every part of you says GO.', 5, 3, NARR); SFX.rumble(); });
      if (held() || t > 5) go('chase');
    } else if (k.beat === 'chase') {
      const h = held();
      k.speed = h ? 210 : 115; // the instinct pulls you on even if you hold back
      k.maxRun = Math.max(k.maxRun, k.speed);
      k.run += k.speed * dt; sh.cx += k.speed * dt;
      for (const a of [A.scar, A.echo, A.nip]) a.x -= k.speed * dt;
      k.herdX += (k.speed + 40) * dt;
      k.dark = Math.min(0.5, k.run / 2200);
      once('c1', () => sh.say("Faster. Further. You don't look back.", 4, 3, NARR));
      if (k.run > 600) once('c2', () => sh.say('The pack is far behind now. You hardly notice.', 4, 3, NARR));
      if (k.run > 1400 || t > 14) { k.speed = 0; go('lost'); }
    } else if (k.beat === 'lost') {
      once('l1', () => sh.say("The herd is gone. The light is going. This isn't pack land.", 4.5, 3, NARR));
      if (Math.floor(t / 0.8) !== Math.floor((t - dt) / 0.8)) SFX.lubdub(0.6 * sh.feelK('feelSound') + 0.2);
      if (t > 4.5) go('shadow');
    } else if (k.beat === 'shadow') {
      once('s1', () => { sh.say('The ground shakes. Something huge is coming.', 4, 3, NARR); SFX.trexRoar(); sh.shake = 0.5 * sh.shakeK; });
      k.trexX = Math.max(305, k.trexX - 75 * dt);
      if (k.trexX <= 306) once('s2', () => sh.say("The Shadow. Your legs won't move.", 4, 3, NARR));
      if (k.trexX <= 306 && t > 6.5) go('rescue');
    } else if (k.beat === 'rescue') {
      if (!k.scarIn) { k.scarIn = true; A.scar.x = -70; A.scar.tx = 235; A.scar.sp = 280; A.scar.face = 1; }
      sh.move(A.scar, dt);
      if (Math.abs(A.scar.x - A.scar.tx) < 1) once('r1', () => { SFX.roar(); sh.shake = 0.35 * sh.shakeK; sh.say('Old Scar crashes out of the ferns and roars.', 3.5, 3, NARR); });
      if (k.said.r1 && t > 2.5) { k.trexFace = 1; k.trexX += 55 * dt; }
      if (k.said.r1 && t > 3) once('r2', () => sh.say('The Shadow turns away into the dark. For now.', 3.5, 3, NARR));
      if (t > 7.5) go('home');
    } else if (k.beat === 'home') {
      // cut back to pack land at dusk
      if (t < 1) k.fade = t;
      else if (!k.cut) {
        k.cut = true; sh.cx = 0; k.dark = 0; k.trexX = W + 400;
        me.x = me.tx = 150; me.face = 1; A.scar.x = A.scar.tx = 215; A.scar.face = -1;
        A.echo.x = A.echo.tx = 40; A.nip.x = A.nip.tx = 90;
      } else k.fade = Math.max(0, 2 - t);
      if (t > 1.6) once('h1', () => sh.say("That fire in you could make you the greatest hunter this valley has ever seen. Or it'll get you killed.", 6.5, 3, 'scar'));
      if (t > 8.4) once('h2', () => sh.say("Rage, panic, the urge to run. Let me teach you to steer it.", 5.5, 3, 'scar'));
      if (t > 14.2) go('rumble');
    } else if (k.beat === 'rumble') {
      once('u1', () => { SFX.eruption(); sh.shake = 0.3 * sh.shakeK; sh.say('Far off, the mountain rumbles. Something is waking up.', 5, 3, NARR); });
      if (t > 5.5) go('title');
    } else if (k.beat === 'title') {
      if (t > 4.5) k.skip();
    }
  };

  k.draw = () => {
    sh.drawWorldBack();
    if (k.beat === 'tempt' || k.beat === 'chase') drawHerd(k.herdX, GY() - 22, 3, sh.T, true, 1);
    if (k.dark > 0) { ctx.fillStyle = `rgba(5,2,10,${k.dark})`; ctx.fillRect(0, 0, W, SH()); }
    if (k.beat === 'rumble') { // the volcano's crater flares
      const pulse = 0.5 + 0.5 * Math.sin(sh.T * 6);
      const g = ctx.createRadialGradient(60, GY() - 150, 4, 60, GY() - 150, 110);
      g.addColorStop(0, `rgba(255,110,40,${0.55 * pulse})`); g.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, SH());
    }
    if (k.trexX < W + 160) drawTrex(k.trexX, GY() + 4, 1.25, sh.T, k.trexFace, k.beat === 'shadow');
    if (A.echo.on && A.echo.x > -60) drawRaptor(A.echo.x, GY() + 2, A.echo.s, 'crouch', sh.T * 0.8, 1, { eye: '#a7f3d0', rim: '#a7f3d0', feathers: 10 });
    if (A.nip.on && A.nip.x > -60) drawRaptor(A.nip.x, GY() + 2, A.nip.s, 'crouch', sh.T, 1, {});
    if (A.scar.x > -60) drawRaptor(A.scar.x, GY() + 2, A.scar.s * (k.beat === 'rescue' ? 1.08 : 1), Math.abs(A.scar.tx - A.scar.x) > 1 ? 'run' : 'stand', sh.T, A.scar.face, { scar: true, eye: '#fde68a', snarl: k.beat === 'rescue' });
    const pose = k.beat === 'chase' ? 'run' : k.beat === 'shadow' ? 'still' : k.beat === 'tempt' ? 'stand' : 'crouch';
    sh.drawMe({ pose, hk: k.beat === 'chase' || k.beat === 'tempt' ? 0.6 : 0 });
    sh.drawWorldFront();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SH()); ctx.clip();
    if (k.beat === 'shadow' && k.said.s2) { ctx.textAlign = 'center'; ctx.font = FH(20); ctx.fillStyle = `rgba(252,165,165,${0.6 + 0.4 * Math.sin(sh.T * 6)})`; ctx.fillText("YOUR LEGS WON'T MOVE", W / 2, SH() * 0.36); }
    if (k.beat === 'title') {
      const a = Math.min(1, k.t / 1.2);
      ctx.fillStyle = `rgba(5,2,4,${0.55 * a})`; ctx.fillRect(0, 0, W, SH());
      ctx.globalAlpha = a; ctx.textAlign = 'center';
      const g = ctx.createLinearGradient(0, SH() * 0.3, 0, SH() * 0.4); g.addColorStop(0, '#fde68a'); g.addColorStop(1, '#f59e0b');
      ctx.fillStyle = g; ctx.font = FH(84); ctx.fillText('APEX', W / 2, SH() * 0.4);
      ctx.fillStyle = '#fca5a5'; ctx.font = FH(15, 500); ctx.fillText('CHAPTER 1 · THE FEEDING GROUND', W / 2, SH() * 0.4 + 30);
      ctx.globalAlpha = 1;
    }
    if (k.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${k.fade})`; ctx.fillRect(0, 0, W, SH()); }
    ctx.restore();
    // panel: the hold pad during the chase, and Skip
    const P = view.H - PANEL;
    ctx.fillStyle = '#0f0a0c'; ctx.fillRect(0, P, W, PANEL); ctx.fillStyle = '#2a1a1f'; ctx.fillRect(0, P, W, 1);
    ctx.textAlign = 'left'; ctx.font = FH(13, 500); ctx.fillStyle = '#a8a29e'; ctx.fillText('THE FIRST HUNT', 16, P + 24);
    if (k.beat === 'tempt' || k.beat === 'chase') {
      const R = padRect(), on = held();
      ctx.fillStyle = on ? '#3b1d12' : '#1c1917'; rr(R.x, R.y, R.w, R.h, 14); ctx.fill();
      ctx.strokeStyle = `rgba(245,158,11,${on ? 1 : 0.5 + 0.5 * Math.sin(sh.T * 5)})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#fde68a'; ctx.font = FH(24); ctx.fillText('HOLD TO RUN', R.x + R.w / 2, R.y + 52);
      ctx.font = FB(11, 600); ctx.fillStyle = '#a8a29e'; ctx.fillText('or press and hold anywhere', R.x + R.w / 2, R.y + 74);
    }
    const S = skipRect();
    input.addButton({ ...S, cb: () => k.skip() });
    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 2; rr(S.x, S.y, S.w, S.h, 10); ctx.stroke();
    ctx.textAlign = 'center'; ctx.font = FH(15, 500); ctx.fillStyle = '#a8a29e'; ctx.fillText('SKIP STORY', S.x + S.w / 2, S.y + 28);
    sh.drawCard();
  };
  return k;
}
