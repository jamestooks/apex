import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }

test('the service worker precaches every app file', () => {
  const sw = readFileSync('sw.js', 'utf8');
  const files = ['index.html', 'styles.css', 'manifest.webmanifest', ...walk('src'), ...walk('icons')];
  for (const f of files) assert.ok(sw.includes(`'./${f}'`), `sw.js is missing ${f} (run npm run sw)`);
});

test('the manifest is installable: standalone, portrait, 192 and 512 icons', () => {
  const m = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  assert.equal(m.display, 'standalone'); assert.equal(m.orientation, 'portrait');
  const sizes = m.icons.map(i => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(m.icons.some(i => (i.purpose || '').includes('maskable')));
});
