// Regenerates the precache list in sw.js from the files on disk and bumps the cache version. Usage: npm run sw
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
function walk(dir, out = []) { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }
const files = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', ...walk('src'), ...walk('icons')].map(f => f === './' ? f : './' + f);
let sw = readFileSync('sw.js', 'utf8');
sw = sw.replace(/const PRECACHE = \[[\s\S]*?\];/, 'const PRECACHE = [\n' + files.map(f => `  '${f}',`).join('\n') + '\n];');
sw = sw.replace(/const CACHE = 'apex-[^']*';/, `const CACHE = 'apex-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}';`);
writeFileSync('sw.js', sw);
console.log(`sw.js: ${files.length} files`);
