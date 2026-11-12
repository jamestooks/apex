// Scenery and creature silhouettes in the same rim-lit style as the raptors.
import { ctx, W, SH, COL, RIM, hash } from '../engine/canvas.js';

function rimmed(x, y, s, face, shape, rim) {
  ctx.save(); ctx.translate(x - 1.2, y - 1.2); ctx.scale(s * (face || 1), s); ctx.globalAlpha *= 0.5; shape(rim || RIM); ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (face || 1), s); shape(COL); ctx.restore();
}

export function drawFern(x, y, h, col, t, n, spread) {
  n = n || 5; spread = spread || 0.9; ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const a = -spread + 2 * spread * (n === 1 ? 0.5 : k / (n - 1)) + Math.sin(t * 1.2 + x * 0.05 + k) * 0.04;
    const tx = x + Math.sin(a) * h, ty = y - Math.cos(a) * h * 0.95, cx = x + Math.sin(a) * h * 0.3, cy = y - h * 0.75;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const s = i / 8, u = 1 - s, px = u * u * x + 2 * u * s * cx + s * s * tx, py = u * u * y + 2 * u * s * cy + s * s * ty;
      const dx = 2 * u * (cx - x) + 2 * s * (tx - cx), dy = 2 * u * (cy - y) + 2 * s * (ty - cy), L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, len = h * 0.17 * (1 - s * 0.8);
      ctx.moveTo(px, py); ctx.lineTo(px + nx * len + dx / L * len * 0.5, py + ny * len + dy / L * len * 0.5);
      ctx.moveTo(px, py); ctx.lineTo(px - nx * len + dx / L * len * 0.5, py - ny * len + dy / L * len * 0.5);
    }
    ctx.stroke();
  }
}
export function drawPtero(x, y, s, t, col) {
  const f = Math.sin(t * 5 + x * 0.03) * 4 * s; ctx.strokeStyle = col || '#3b1530'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y - f); ctx.quadraticCurveTo(x - 4 * s, y - 3 * s, x, y); ctx.quadraticCurveTo(x + 4 * s, y - 3 * s, x + 10 * s, y - f); ctx.stroke();
}
export function drawCarcass(x, y) {
  rimmed(x, y, 1, 1, c => {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.beginPath(); ctx.ellipse(0, -8, 24, 9, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, -10); ctx.quadraticCurveTo(-40, -5, -54, -2); ctx.lineTo(-20, -2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, -10); ctx.quadraticCurveTo(32, -7, 40, -3); ctx.lineTo(46, -1); ctx.lineTo(22, -1); ctx.fill();
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(3, -26); ctx.moveTo(7, -14); ctx.lineTo(16, -23); ctx.stroke();
  });
}
// Big plant-eaters: a horned ceratopsian body, used for herds.
function ceraShape(c, t, run) {
  const lp = run ? t * 10 : 0, by = -26;
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(0, by, 30, 15, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-26, by - 4); ctx.lineTo(-48, by + 4); ctx.lineTo(-26, by + 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(24, by - 10); ctx.lineTo(36, by - 26); ctx.lineTo(46, by - 6); ctx.lineTo(50, by + 6); ctx.lineTo(28, by + 8); ctx.fill();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(44, by - 4); ctx.lineTo(58, by - 12); ctx.moveTo(40, by - 10); ctx.lineTo(52, by - 22); ctx.stroke();
  ctx.lineWidth = 7;
  for (const [hx, ph] of [[-18, 0], [-10, Math.PI], [14, Math.PI / 2], [22, Math.PI * 1.5]]) { const sw = Math.sin(lp + ph) * (run ? 7 : 0); ctx.beginPath(); ctx.moveTo(hx, by + 8); ctx.lineTo(hx + sw, 0); ctx.stroke(); }
}
export function drawHerd(x, y, n, t, dust, face) {
  for (let i = 0; i < n; i++) {
    const ox = x + i * 70 * (face || 1) + Math.sin(i * 3.1) * 14, oy = y + (i % 2) * 6, s = 0.9 + hash(i) * 0.3;
    rimmed(ox, oy, s, face || 1, c => ceraShape(c, t + i, true), '#d6a46a');
  }
  if (dust) for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(150,110,70,${0.25 + hash(i) * 0.2})`; ctx.beginPath(); ctx.arc(x - 30 + hash(i + 2) * (n * 70 + 60) * (face || 1), y - 10 - hash(i + 5) * 30 + Math.sin(t * 3 + i) * 4, 10 + hash(i + 8) * 18, 0, 7); ctx.fill(); }
}
export function drawHadrosaur(x, y, s, t, face, lookout) {
  rimmed(x, y, s, face, c => {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round';
    const by = -34, hb = lookout ? -30 : Math.sin(t * 0.8) * 4;
    ctx.beginPath(); ctx.ellipse(0, by, 28, 13, -0.15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24, by - 2); ctx.quadraticCurveTo(-50, by, -66, by + 10); ctx.quadraticCurveTo(-44, by + 8, -22, by + 8); ctx.fill();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(18, by - 4); ctx.quadraticCurveTo(28, by - 20 + hb * 0.5, 30, by - 26 + hb); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, by - 30 + hb); ctx.lineTo(44, by - 26 + hb); ctx.lineTo(42, by - 20 + hb); ctx.lineTo(28, by - 20 + hb); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, by - 30 + hb); ctx.lineTo(16, by - 42 + hb); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-6, by + 8); ctx.lineTo(-4, 0); ctx.moveTo(6, by + 8); ctx.lineTo(10, 0); ctx.stroke();
  }, '#9fb3d9');
}
export function drawTrex(x, y, s, t, face, sniff) {
  const hd = sniff ? 16 + Math.sin(t * 3) * 4 : 0;
  rimmed(x, y, s, face, c => {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lp = t * 2.2, by = -78;
    for (const ph of [Math.PI, 0]) {
      const sw = Math.sin(lp + ph) * 9;
      ctx.beginPath(); ctx.ellipse(-2, by + 14, 16, 24, 0.2, 0, 7); ctx.fill();
      ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(4, by + 30); ctx.lineTo(10 + sw * 0.4, by + 56); ctx.lineTo(sw, -4); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sw - 4, -2); ctx.lineTo(sw + 18, 0); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(4, by, 46, 24, -0.12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-36, by - 12); ctx.quadraticCurveTo(-90, by - 10, -132, by + 4); ctx.quadraticCurveTo(-90, by + 16, -36, by + 16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, by - 18); ctx.quadraticCurveTo(48, by - 30 + hd, 62, by - 34 + hd);
    ctx.lineTo(100, by - 30 + hd); ctx.quadraticCurveTo(108, by - 24 + hd, 104, by - 16 + hd); ctx.lineTo(70, by - 12 + hd);
    ctx.lineTo(98, by - 8 + hd); ctx.lineTo(94, by - 2 + hd); ctx.lineTo(66, by + 2 + hd); ctx.quadraticCurveTo(48, by + 10, 34, by + 14); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(40, by + 8); ctx.lineTo(48, by + 18); ctx.lineTo(54, by + 16); ctx.stroke();
  }, '#ef4444');
  ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(x + 80 * s * (face || 1), y + (-78 - 25 + hd) * s, 2.4 * s, 0, 7); ctx.fill();
}
export function drawBeetle(x, y, t, s) {
  s = s || 1; const hue = (t * 80) % 360;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10); g.addColorStop(0, `hsl(${hue},90%,75%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360},80%,35%)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx * 6, -4 + i * 5); ctx.lineTo(sx * 12, -6 + i * 6); ctx.stroke(); }
  ctx.restore(); sparkle(x, y, t);
}
export function drawButterfly(x, y, t) {
  const f = Math.abs(Math.sin(t * 9));
  ctx.fillStyle = '#93c5fd'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sx * 7 * f, y, 7 * f + 1, 9, sx * 0.3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#1e293b'; ctx.fillRect(x - 1, y - 6, 2, 12); sparkle(x, y, t);
}
export function drawAmber(x, y, t, s) {
  s = s || 1; const glow = 0.6 + 0.4 * Math.sin(t * 3);
  const g = ctx.createRadialGradient(x, y, 2, x, y, 30 * s); g.addColorStop(0, `rgba(251,191,36,${0.5 * glow})`); g.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 30 * s, 0, 7); ctx.fill();
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(x, y - 10 * s); ctx.lineTo(x + 8 * s, y - 2 * s); ctx.lineTo(x + 4 * s, y + 9 * s); ctx.lineTo(x - 6 * s, y + 7 * s); ctx.lineTo(x - 8 * s, y - 3 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 3 * s, y - 5 * s, 2 * s, 4 * s);
}
export function drawCallBubble(x, y, text, t) {
  ctx.font = "700 14px Oswald, 'Arial Narrow', sans-serif"; const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(254,243,199,0.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 14, w, 24, 8) : ctx.rect(x - w / 2, y - 14, w, 24); ctx.fill();
  ctx.fillStyle = '#1c0a00'; ctx.textAlign = 'center'; ctx.fillText(text, x, y + 3);
}
function sparkle(x, y, t) {
  for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1, r = 14 + Math.sin(t * 5 + i) * 3; ctx.fillStyle = `rgba(255,255,220,${0.5 + 0.5 * Math.sin(t * 6 + i)})`; ctx.fillRect(x + Math.cos(a) * r - 1, y + Math.sin(a) * r - 1, 2, 2); }
}
export function drawFootprint(x, y, glow, alpha, scale) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  if (scale && scale !== 1) { ctx.translate(x, y); ctx.scale(scale, scale); x = 0; y = 0; }
  if (glow > 0) { const g = ctx.createRadialGradient(x, y, 1, x, y, 22); g.addColorStop(0, `rgba(134,239,172,${0.75 * glow})`); g.addColorStop(1, 'rgba(134,239,172,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); }
  ctx.strokeStyle = glow > 0 ? '#bbf7d0' : 'rgba(187,247,208,0.35)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 4, y + 5); ctx.lineTo(x, y - 6); ctx.moveTo(x - 4, y + 5); ctx.lineTo(x + 6, y - 2); ctx.moveTo(x - 4, y + 5); ctx.lineTo(x - 7, y - 4); ctx.stroke();
  ctx.restore();
}
export function drawLog(x, y, w, burning, t) {
  ctx.fillStyle = COL; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.08);
  ctx.fillRect(-w / 2, -9, w, 18); ctx.strokeStyle = 'rgba(251,146,60,0.6)'; ctx.lineWidth = 1.2; ctx.strokeRect(-w / 2, -9, w, 18); ctx.restore();
  if (burning) for (let i = 0; i < 7; i++) { const k = (t * 1.3 + i / 7) % 1; ctx.fillStyle = `rgba(255,${120 + i * 15},40,${0.8 * (1 - k)})`; ctx.beginPath(); ctx.arc(x - w / 2 + (i + 0.5) * (w / 7), y - 10 - k * 26, 5 * (1 - k) + 2, 0, 7); ctx.fill(); }
}
export function drawRock(x, y, w, h) {
  rimmed(x, y, 1, 1, c => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2 + 8, -h * 0.7); ctx.lineTo(-w / 6, -h); ctx.lineTo(w / 3, -h * 0.85); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); });
}
export function drawRain(t, intensity) {
  const n = Math.round(90 * (intensity == null ? 1 : intensity)); ctx.strokeStyle = 'rgba(186,210,240,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < n; i++) { const x = (hash(i) * (W + 60) + t * 80) % (W + 60) - 30, y = (hash(i + 31) * SH() + t * 520) % SH(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); }
  ctx.stroke();
}
export function drawLightning(k) {
  if (k <= 0) return; ctx.fillStyle = `rgba(230,235,255,${0.55 * k})`; ctx.fillRect(0, 0, W, SH());
  if (k > 0.6) { ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.5; ctx.beginPath(); let x = W * 0.7, y = 0; ctx.moveTo(x, y); while (y < SH() * 0.55) { x += (hash(y) - 0.5) * 40; y += 24; ctx.lineTo(x, y); } ctx.stroke(); }
}
export function drawLavaStone(x, y, settled, t, highlight) {
  const wob = settled ? 0 : Math.sin(t * 12) * 2.5;
  ctx.fillStyle = 'rgba(255,90,20,0.55)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 34, 8, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y + wob); ctx.rotate(settled ? 0 : Math.sin(t * 9) * 0.06);
  ctx.fillStyle = COL; ctx.beginPath(); ctx.ellipse(0, 0, 26, 8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = highlight ? '#fde68a' : settled ? 'rgba(251,146,60,0.9)' : 'rgba(251,146,60,0.4)'; ctx.lineWidth = highlight ? 2.5 : 1.5; ctx.stroke(); ctx.restore();
}
export function drawNipBubble(x, y, text) { drawCallBubble(x, y, text); }
