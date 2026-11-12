// Dev helper: screenshots of key screens for a visual check. Usage: node scripts/shots.mjs (server on :4173)
import { chromium, devices } from '@playwright/test';
const out = process.argv[2] || 'test-results/shots';
const b = await chromium.launch();
const page = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
await page.goto('http://localhost:4173/?debug=1&speed=4');
await page.waitForTimeout(600); await page.screenshot({ path: `${out}/1-profiles.png` });
await page.click('#new-player'); await page.fill('#child-name', 'Sam'); await page.fill('#raptor-name', 'Blaze'); await page.screenshot({ path: `${out}/2-new.png` });
await page.click('#create-player'); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/3-home.png` });
await page.click('[data-play="1"]'); await page.waitForTimeout(800); await page.screenshot({ path: `${out}/4-intro-card.png` });
const tap = async () => { const r = await page.locator('#game').boundingBox(); await page.mouse.click(r.x + 60, r.y + 60); };
await tap(); await page.waitForSelector('[data-sign]'); await page.screenshot({ path: `${out}/5-signs.png` });
const t = page.locator('[data-sign]'); for (const i of [0, 4, 2]) await t.nth(i).click(); await page.click('#signs-done');
await page.waitForTimeout(500); await tap(); await page.waitForTimeout(400);
await page.keyboard.down(' '); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/6-practice-breath.png` });
await page.waitForTimeout(400); await page.keyboard.up(' '); await page.waitForTimeout(2500);
for (let i = 0; i < 8; i++) { await page.waitForTimeout(400); if (await page.evaluate(() => !!__apex.canvasScene.shell.card)) await tap(); if (await page.evaluate(() => __apex.canvasScene.runner.step === 'scenario' && __apex.canvasScene.shell.choices)) break; }
await page.waitForTimeout(300); await page.screenshot({ path: `${out}/7-scene-live.png` });
await b.close();
