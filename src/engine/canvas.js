// Canvas setup and drawing helpers, ported from the Rage prototype.
// Logical coordinates: 400 wide, H tall (600–880), bottom PANEL px for controls.
export const W = 400, PANEL = 190;
export const view = { H: 700, scale: 1, dpr: 1, el: null };
export let ctx = null;
export let fontScale = 1;
export function setLargeText(on) { fontScale = on ? 1.12 : 1; }

export function initCanvas(el) {
  view.el = el;
  ctx = el.getContext('2d');
  resize();
  addEventListener('resize', resize);
  return ctx;
}
// iPhone notch / home bar: read env(safe-area-inset-*) through a probe element (custom properties stay unresolved).
let probe = null;
function safeInsets() {
  if (!probe) { probe = document.createElement('div'); probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:var(--sai-top);padding-bottom:var(--sai-bottom)'; document.body.appendChild(probe); }
  const cs = getComputedStyle(probe);
  return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
}
// Draw into another 2D context (gallery, previews). Logical height h.
export function useContext(c, h) { ctx = c; if (h) view.H = h; }
export function resize() {
  const el = view.el; if (!el) return;
  const ins = safeInsets();
  const vw = innerWidth, vh = innerHeight - ins.top - ins.bottom;
  view.H = Math.max(600, Math.min(880, Math.round(W * vh / vw)));
  view.scale = Math.min(vw / W, vh / view.H);
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  el.style.width = W * view.scale + 'px';
  el.style.height = view.H * view.scale + 'px';
  el.style.marginTop = ins.top + Math.max(0, (vh - view.H * view.scale) / 2) + 'px';
  el.width = Math.round(W * view.scale * view.dpr);
  el.height = Math.round(view.H * view.scale * view.dpr);
}
export function beginDraw() { ctx.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, 0, 0); }
export function toLogical(clientX, clientY) {
  const r = view.el.getBoundingClientRect();
  return { x: (clientX - r.left) / view.scale, y: (clientY - r.top) / view.scale };
}

export const H = () => view.H;
export const SH = () => view.H - PANEL;
export const GY = () => Math.round((view.H - PANEL) * 0.82);
export const FH = (s, w) => `${w || 700} ${Math.round(s * fontScale)}px Oswald, 'Arial Narrow', Impact, sans-serif`;
export const FS = s => `italic ${Math.round(s * fontScale)}px Lora, Georgia, serif`;
export const FB = (s, w) => `${w || 400} ${Math.round(s * fontScale)}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
export const COL = '#0b0609', RIM = '#fb923c';

export const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export function rr(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function wrapLines(text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (para === '') { out.push(''); continue; }
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
export function wrap(text, x, y, maxW, lh) {
  let yy = y;
  for (const l of wrapLines(text, maxW)) { if (l === '') yy += lh * 0.5; else { ctx.fillText(l, x, yy); yy += lh; } }
  return yy;
}
