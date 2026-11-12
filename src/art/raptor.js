// Raptor silhouettes, ported from the prototype, with growth (scale, feathers), scars and a rim-light colour.
import { ctx, COL, RIM } from '../engine/canvas.js';

function leg(hx, hy, a, amp, lift, thick, claw) {
  const sw = Math.sin(a) * amp, up = Math.max(0, Math.cos(a)) * lift;
  const fx = hx + 4 + sw, fy = -up, kx = hx + 9 + sw * 0.4, ky = hy + (fy - hy) * 0.35, ax = fx - 6, ay = fy - 7;
  ctx.lineWidth = thick; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ax, ay); ctx.lineTo(fx, fy); ctx.lineTo(fx + 8, fy); ctx.stroke();
  if (claw) { ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(fx + 1, fy - 1); ctx.quadraticCurveTo(fx + 3, fy - 7, fx + 7, fy - 5); ctx.stroke(); }
}

export function raptorShape(col, pose, t, o) {
  if (pose === 'lie') return lyingShape(col, t, o);
  const c = pose === 'crouch' || pose === 'still' ? 7 : pose === 'walk' ? 5 : 0, run = pose === 'run' || pose === 'pounce', walk = pose === 'walk';
  const lp = run ? t * 18 : walk ? t * 6 : 0, bob = run ? -Math.abs(Math.sin(lp)) * 3 : walk ? Math.sin(lp * 2) * 0.8 : 0;
  const by = -30 + c + bob, amp = run ? 14 : walk ? 7 : 0, lift = run ? 7 : walk ? 3 : 0, hk = o.hk || 0;
  const tt = pose === 'still' ? t * 0.15 : (o.tail == null ? t : o.tail);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  leg(2, by + 6, lp + Math.PI, amp, lift, 6, true);
  const tw = Math.sin(tt * 2.5) * (3 + hk * 6);
  ctx.beginPath(); ctx.moveTo(-12, by - 6); ctx.quadraticCurveTo(-38, by - 8 + tw * 0.5, -64, by - 6 + tw); ctx.quadraticCurveTo(-38, by + 2, -12, by + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, by, 19, 9.5, -0.12, 0, 7); ctx.fill();
  const nf = o.feathers || 8, span = 40;
  ctx.lineWidth = 1.5 + hk; ctx.beginPath();
  for (let i = 0; i < nf; i++) {
    const fx = -24 + (i * span) / Math.max(1, nf - 1) * 0.9;
    const len = 5 + Math.min(1, nf / 12) * 4;
    ctx.moveTo(fx, by - 7); ctx.lineTo(fx - 5 + hk * 3, by - 7 - len - hk * 9 - Math.sin(i + t * 2 + hk * t * 8) * (1 + hk * 1.5));
  }
  ctx.stroke();
  const hy = by - 14 + (pose === 'crouch' || pose === 'still' ? 5 : 0);
  ctx.beginPath(); ctx.moveTo(10, by - 6); ctx.quadraticCurveTo(20, hy - 2, 28, hy - 4); ctx.lineTo(45, hy); ctx.lineTo(44, hy + 3); ctx.lineTo(30, hy + 5); ctx.quadraticCurveTo(22, hy + 8, 15, by + 4); ctx.closePath(); ctx.fill();
  if (o.snarl) { ctx.beginPath(); ctx.moveTo(30, hy + 4); ctx.lineTo(44, hy + 3); ctx.lineTo(42, hy + 9); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(8, by - 1); ctx.lineTo(22, by + 9); ctx.lineTo(6, by + 7); ctx.closePath(); ctx.fill();
  leg(2, by + 6, lp, amp, lift, 6, true);
  return { ex: 31, ey: hy - 1, by };
}
function lyingShape(col, t, o) {
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  const by = -9, br = Math.sin(t * 1.5) * 0.8;
  ctx.beginPath(); ctx.moveTo(-12, by - 4); ctx.quadraticCurveTo(-40, by - 2, -62, by + 6); ctx.quadraticCurveTo(-38, by + 8, -12, by + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, by + br * 0.3, 20, 8 + br * 0.4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, by - 2); ctx.quadraticCurveTo(24, by - 4, 30, by + 2); ctx.lineTo(44, by + 6); ctx.lineTo(30, by + 9); ctx.quadraticCurveTo(20, by + 9, 14, by + 6); ctx.closePath(); ctx.fill();
  return { ex: 32, ey: by + 3, by };
}

export function drawRaptor(x, y, s, pose, t, face, o) {
  o = o || {};
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (face || 1), s);
  if (o.lean) ctx.rotate(o.lean);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.save(); ctx.translate(-1.4, -1.4); ctx.globalAlpha *= 0.6; raptorShape(o.rim || RIM, pose, t, o); ctx.restore();
  const e = raptorShape(o.body || COL, pose, t, o);
  if (o.scar) { ctx.strokeStyle = 'rgba(254,215,170,0.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(e.ex - 5, e.ey - 5); ctx.lineTo(e.ex + 6, e.ey + 6); ctx.stroke(); }
  for (let i = 0; i < (o.scars || 0); i++) {
    ctx.strokeStyle = 'rgba(254,215,170,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath();
    const sx = -10 + i * 7; ctx.moveTo(sx, e.by - 4); ctx.lineTo(sx + 5, e.by + 3); ctx.stroke();
  }
  ctx.fillStyle = o.eye || '#fbbf24'; ctx.beginPath(); ctx.arc(e.ex, e.ey, o.eyeR || 1.4, 0, 7); ctx.fill();
  ctx.restore();
}
