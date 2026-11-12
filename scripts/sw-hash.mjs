// Content hash of every precached file, so the service worker's cache name changes whenever the app does.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
function walk(dir, out = []) { for (const f of readdirSync(dir).sort()) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }
export function appFiles() { return ['index.html', 'styles.css', 'manifest.webmanifest', ...walk('src'), ...walk('icons')]; }
export function contentHash() {
  let h = 0x811c9dc5;
  for (const f of appFiles()) { const b = readFileSync(f); for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193) >>> 0; } }
  return h.toString(36);
}
