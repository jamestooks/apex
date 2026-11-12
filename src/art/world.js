// Layered silhouette worlds, one colour scheme per chapter (spec, Art: colour per chapter).
import { ctx, W, SH, GY, hash } from '../engine/canvas.js';
import { drawFern, drawPtero } from './props.js';

function mkRidge(n, step, lo, hi, seed) { const pts = []; for (let i = 0; i < n; i++) pts.push(lo + hash(i * 3.7 + seed) * (hi - lo)); return { pts, step }; }
const FAR = mkRidge(30, 60, 55, 130, 1), MID = mkRidge(30, 44, 28, 80, 7), NEAR = mkRidge(40, 30, 8, 34, 13);
function ridgeH(R, wx) { const L = R.pts.length; const u = ((wx / R.step) % L + L) % L, i = Math.floor(u), f = u - i, s = f * f * (3 - 2 * f); return R.pts[i] + (R.pts[(i + 1) % L] - R.pts[i]) * s; }
function ridge(R, off, gy, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, gy); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, gy - ridgeH(R, x + off)); ctx.lineTo(W, gy); ctx.closePath(); ctx.fill(); }

export const THEMES = {
  dusk: { sky: ['#1a0d2e', '#6d2747', '#df5a3c', '#fcb672'], sun: { x: 0.66, dy: 80, r: 32, col: '#fff1c9', glow: '255,237,180' },
    ridges: ['#5a2242', '#3a1430', '#25101e'], volcano: '#4a1b37', ground: '#130810', fern: '#1e0d17', fg: '#070305', ptero: '#3b1530' },
  dust: { sky: ['#2b1d12', '#6b4a2b', '#b07a45', '#e0b27a'], sun: { x: 0.3, dy: 110, r: 24, col: '#f8e3bd', glow: '248,227,189' },
    ridges: ['#6b4c35', '#4d3423', '#2e1f14'], ground: '#1a120b', fern: '#2a1c12', fg: '#0d0805', ptero: '#3a2716', weather: 'dust' },
  ferns: { sky: ['#03100a', '#0b2e1c', '#1d5232', '#5d9156'], sun: { x: 0.5, dy: 150, r: 18, col: '#e9f5c9', glow: '220,240,170' },
    ridges: ['#0f3321', '#0a2618', '#06180f'], ground: '#03100a', fern: '#0b2c18', fg: '#020805', ptero: '#0a2416', trunks: true, fog: 'rgba(160,210,170,0.06)' },
  river: { sky: ['#0b1a3a', '#1f3f73', '#5b86b8', '#f2c9a0'], sun: { x: 0.72, dy: 30, r: 30, col: '#ffe8c2', glow: '255,232,194' },
    ridges: ['#1b2f55', '#142443', '#0c1830'], ground: '#08111f', fern: '#0e1a2e', fg: '#03070e', ptero: '#13223f', water: true },
  moon: { sky: ['#02040c', '#0a1430', '#1b2a4d', '#33476e'], sun: { x: 0.25, dy: 230, r: 22, col: '#eef3ff', glow: '200,215,255' },
    ridges: ['#0d1730', '#0a1226', '#060b18'], ground: '#04070f', fern: '#0b1222', fg: '#010205', ptero: '#0b1430', stars: true },
  ash: { sky: ['#120707', '#3a1010', '#7a2a12', '#d9541f'], sun: null,
    ridges: ['#2a0d0d', '#1c0909', '#120606'], volcano: '#1a0808', erupting: true, ground: '#0b0505', fern: '#1a0a0a', fg: '#050202', ptero: '#2a0c0c', weather: 'ash', lava: true },
};

export function drawWorld(themeName, cx, heat, t, opts) {
  const th = THEMES[themeName] || THEMES.dusk, sh = SH(), gy = GY();
  const rm = opts && opts.reducedMotion; if (rm) t = 0;
  const g = ctx.createLinearGradient(0, 0, 0, gy);
  th.sky.forEach((c, i) => g.addColorStop([0, 0.45, 0.82, 1][i], c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy);
  if (th.stars) for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * hash(i + 3) * (0.7 + 0.3 * Math.sin(t * 2 + i))})`; ctx.fillRect(hash(i) * W, hash(i + 77) * gy * 0.6, 1.4, 1.4); }
  if (th.sun) {
    const s = th.sun, sx = W * s.x, sy = gy - s.dy;
    const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150);
    sg.addColorStop(0, `rgba(${s.glow},0.85)`); sg.addColorStop(0.25, `rgba(${s.glow},0.3)`); sg.addColorStop(1, `rgba(${s.glow},0)`);
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, gy);
    ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 3; i++) { const px = ((t * 13 + i * 170) % (W + 120)) - 60, py = gy * 0.22 + i * 26 + Math.sin(t + i) * 6; drawPtero(px, py, 0.6 + i * 0.15, t, th.ptero); }
  ridge(FAR, cx * 0.08, gy, th.ridges[0]);
  if (th.volcano) {
    const vx = ((260 - cx * 0.12) % 1000 + 1000) % 1000 - 200, vb = gy - 40;
    ctx.fillStyle = th.volcano; ctx.beginPath(); ctx.moveTo(vx - 90, vb + 40); ctx.lineTo(vx - 16, vb - 110); ctx.lineTo(vx + 16, vb - 110); ctx.lineTo(vx + 90, vb + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = th.erupting ? 'rgba(255,120,40,0.95)' : 'rgba(255,90,40,0.7)'; ctx.fillRect(vx - 14, vb - 112, 28, 3);
    const n = th.erupting ? 10 : 6;
    for (let i = 0; i < n; i++) { const k = (t * (th.erupting ? 0.3 : 0.15) + i / n) % 1; ctx.fillStyle = th.erupting ? `rgba(40,15,15,${0.7 * (1 - k)})` : `rgba(50,25,45,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(vx + Math.sin(k * 4 + i) * 10 + k * 40, vb - 115 - k * 90, 8 + k * (th.erupting ? 40 : 22), 0, 7); ctx.fill(); }
    if (th.erupting) { ctx.strokeStyle = 'rgba(255,110,30,0.8)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const k = (t * 0.8 + i / 4) % 1; ctx.beginPath(); ctx.moveTo(vx + (i - 1.5) * 6, vb - 112); ctx.quadraticCurveTo(vx + (i - 1.5) * 30, vb - 150 - k * 30, vx + (i - 1.5) * 50 * k, vb - 110 + k * 60); ctx.stroke(); } }
  }
  ridge(MID, cx * 0.25, gy, th.ridges[1]);
  if (th.trunks) for (let i = -1; i < 8; i++) { const x = ((i * 70 - cx * 0.35) % 560 + 560) % 560 - 40; ctx.fillStyle = th.ridges[2]; ctx.fillRect(x, 0, 10 + hash(i + 40) * 10, gy); }
  ridge(NEAR, cx * 0.5, gy, th.ridges[2]);
  ctx.fillStyle = th.ground; ctx.fillRect(0, gy, W, sh - gy);
  if (th.water) {
    ctx.fillStyle = 'rgba(91,134,184,0.35)'; ctx.fillRect(0, gy + 6, W, 16);
    ctx.strokeStyle = 'rgba(255,232,194,0.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const x = ((i * 37 - cx * 0.6 + t * 20) % W + W) % W; ctx.beginPath(); ctx.moveTo(x, gy + 10 + (i % 3) * 4); ctx.lineTo(x + 12, gy + 10 + (i % 3) * 4); ctx.stroke(); }
  }
  if (th.lava) {
    ctx.strokeStyle = `rgba(255,100,30,${0.5 + 0.2 * Math.sin(t * 3)})`; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const x = ((i * 90 - cx) % 540 + 540) % 540 - 70; ctx.beginPath(); ctx.moveTo(x, gy + 4); ctx.lineTo(x + 18, gy + 12); ctx.lineTo(x + 30, gy + 9); ctx.stroke(); }
  }
  const step = 48;
  for (let i = Math.floor(cx / step) - 1; i <= Math.floor((cx + W) / step) + 1; i++) drawFern(i * step + hash(i) * 30 - cx, gy + 3, 14 + hash(i + 9) * 20, th.fern, t, 5, 1.0);
  if (th.fog) { ctx.fillStyle = th.fog; ctx.fillRect(0, gy - 60, W, 80); }
  if (heat > 0) { ctx.fillStyle = `rgba(180,20,20,${heat * 0.18})`; ctx.fillRect(0, 0, W, sh); }
}

export function drawForeground(themeName, cx, t, opts) {
  const th = THEMES[themeName] || THEMES.dusk, sh = SH(), step = 95, c = cx * 1.3;
  if (opts && opts.reducedMotion) t = 0;
  for (let i = Math.floor(c / step) - 1; i <= Math.floor((c + W) / step) + 1; i++) drawFern(i * step + hash(i + 50) * 40 - c, sh + 8, 26 + hash(i + 70) * 20, th.fg, t, 6, 1.1);
  if (th.weather === 'dust') for (let i = 0; i < 50; i++) { const x = ((hash(i) * W + t * (60 + hash(i + 5) * 80)) % (W + 40)) - 20, y = hash(i + 9) * sh; ctx.fillStyle = `rgba(214,170,110,${0.15 + hash(i + 2) * 0.25})`; ctx.fillRect(x, y, 2.5, 1.5); }
  if (th.weather === 'ash') for (let i = 0; i < 70; i++) { const x = (hash(i) * W + Math.sin(t + i) * 10 + W) % W, y = (hash(i + 9) * sh + t * (20 + hash(i + 3) * 30)) % sh; ctx.fillStyle = i % 7 === 0 ? 'rgba(255,140,60,0.8)' : 'rgba(180,170,160,0.5)'; ctx.fillRect(x, y, 2, 2); }
  const v = ctx.createRadialGradient(W / 2, sh * 0.45, sh * 0.3, W / 2, sh * 0.45, sh * 0.85);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, sh);
}
