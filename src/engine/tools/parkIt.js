// Park It: drag the distracting thing onto the scent map. Come back to it after the task.
import { ctx, FH, rr } from '../canvas.js';
export const TOOL = { id: 'parkIt', name: 'Park It', instinct: 'drift', kind: 'drag', how: "Say 'later', then drag it to your map.", phrase: 'Park it.', col: '#86efac', past: 'parked it', again: 'park it', verb: 'park it' };
export const MAP_RECT = { x: 10, y: 74, w: 84, h: 64 };

export function createRun({ mapRect = MAP_RECT } = {}) {
  const r = {
    phase: 'ready', carrying: null, done: false, pausesSimmer: false, mapRect, lastDrag: null,
    get active() { return !!r.carrying; },
    update(dt, io) {
      const events = []; let relief = 0;
      const ds = (io.targets && io.targets.distractions) || [];
      const d = io.drag;
      if (d && d.active && !r.carrying && d !== r.lastDrag) {
        const hit = ds.find(x => !x.parked && x.on !== false && Math.hypot(d.startX - x.x, d.startY - x.y) <= (x.r || 20) + 10);
        if (hit) { r.carrying = hit; r.lastDrag = d; }
      }
      if (r.carrying && d) {
        if (d.active) { r.carrying.dragX = d.x; r.carrying.dragY = d.y; }
        else if (d.released) {
          const inside = d.x >= mapRect.x && d.x <= mapRect.x + mapRect.w && d.y >= mapRect.y && d.y <= mapRect.y + mapRect.h;
          if (inside) { r.carrying.parked = true; relief = 0.25; events.push('parked:' + r.carrying.id); }
          delete r.carrying.dragX; delete r.carrying.dragY;
          r.carrying = null;
        }
      }
      return { relief, events };
    },
    draw(parked, t) {
      const m = mapRect;
      ctx.fillStyle = 'rgba(233,223,199,0.92)'; rr(m.x, m.y, m.w, m.h, 8); ctx.fill();
      ctx.strokeStyle = r.carrying ? `rgba(134,239,172,${0.6 + 0.4 * Math.sin((t || 0) * 8)})` : 'rgba(120,90,60,0.6)';
      ctx.lineWidth = r.carrying ? 3 : 1.5; ctx.stroke();
      ctx.fillStyle = '#3b2a1a'; ctx.font = FH(10, 500); ctx.textAlign = 'center'; ctx.fillText('SCENT MAP', m.x + m.w / 2, m.y + 13);
      ctx.strokeStyle = 'rgba(120,90,60,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath();
      ctx.moveTo(m.x + 8, m.y + m.h - 10); ctx.quadraticCurveTo(m.x + m.w / 2, m.y + 20, m.x + m.w - 8, m.y + m.h - 18); ctx.stroke(); ctx.setLineDash([]);
      (parked || []).forEach((p, i) => { ctx.fillStyle = '#166534'; ctx.beginPath(); ctx.arc(m.x + 14 + (i % 4) * 18, m.y + 30 + Math.floor(i / 4) * 14, 5, 0, 7); ctx.fill(); });
    },
  };
  return r;
}
