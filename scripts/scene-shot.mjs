// Dev helper: screenshot one scenario. Usage: node scripts/scene-shot.mjs <chapter> <beat> <i> <out.png> [waitMs] [js-to-run]
import { chromium, devices } from '@playwright/test';
const [n, beat, i, out, wait = '2500', js = ''] = process.argv.slice(2);
const b = await chromium.launch();
const page = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:4173/?debug=1');
await page.click('#new-player'); await page.click('#create-player'); await page.waitForSelector('[data-chapter]');
await page.evaluate(([n, beat, i]) => window.__apex.goto(+n, beat, +i), [n, beat, i]);
await page.waitForTimeout(+wait);
if (js) { await page.evaluate(js); await page.waitForTimeout(1500); }
await page.screenshot({ path: out });
await b.close();
