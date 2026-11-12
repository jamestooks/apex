// Tiny DOM helper for the menu screens that sit over the canvas.
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
export function mount(el) { const ui = document.getElementById('ui'); ui.replaceChildren(el); ui.hidden = false; ui.scrollTop = 0; return el; }
export function unmount() { const ui = document.getElementById('ui'); ui.replaceChildren(); ui.hidden = true; }
