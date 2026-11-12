// Updating an installed copy must never load a mix of old and new files.
// Reproduces the real failure: the browser's HTTP cache treats an old, long-unchanged file as fresh,
// so the new offline cache got the old canvas.js next to the new look.js.
import { test, expect, chromium } from '@playwright/test';
import { execSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OLD = '9363e8e'; // the version before raptor customisation (canvas.js had no withContext)

test('an installed copy updates cleanly, with no mixed versions', async () => {
  test.setTimeout(90000);
  const dir = mkdtempSync(join(tmpdir(), 'apex-update-')), site = join(dir, 'site');
  execSync(`mkdir -p "${site}" && git archive ${OLD} | tar -x -C "${site}" && find "${site}" -type f -exec touch {} + && touch -t 202001010000 "${site}/src/engine/canvas.js"`);
  const server = spawn('python3', ['-m', 'http.server', '4175'], { cwd: site, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const ctx = await chromium.launchPersistentContext(join(dir, 'profile'), { viewport: { width: 390, height: 844 } });
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('http://localhost:4175/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await page.waitForTimeout(800);
    // deploy the current version over the top
    execSync(`cd "${site}" && rm -rf src sw.js index.html styles.css && cp -R "${process.cwd()}/src" "${process.cwd()}/sw.js" "${process.cwd()}/index.html" "${process.cwd()}/styles.css" . && find src sw.js -type f -exec touch {} +`);
    // The old installed copy relies on the browser's own (lazy) update check: trigger it, as the browser eventually would.
    for (let i = 0; i < 4; i++) {
      await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update().catch(() => {}); });
      await page.waitForTimeout(1500); await page.reload(); await page.waitForTimeout(1000);
    }
    expect(errs).toEqual([]);
    await expect(page.locator('#new-player')).toBeVisible();
    expect(await page.evaluate(async () => (await import('/src/engine/canvas.js')).withContext !== undefined)).toBe(true);
  } finally { await ctx.close(); server.kill(); rmSync(dir, { recursive: true, force: true }); }
});
