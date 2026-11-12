import { test, expect } from '@playwright/test';
import { newPlayer } from './helpers.js';

// Real taps on scene targets (not keys, not buttons) must reach the scene.
const toClient = (page, x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('game').getBoundingClientRect(), s = r.width / 400; return { x: r.left + x * s, y: r.top + y * s }; }, [x, y]);
const clearCard = page => page.evaluate(() => { const s = window.__apex.canvasScene.shell; if (s.card) { s.cardBorn = -9; s.dismissCard(); } });

test('One Thing: tapping a cover target moves on to SEE', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.evaluate(() => window.__apex.goto(2, 'test', 0));
  await page.waitForTimeout(500); await clearCard(page);
  await page.evaluate(() => window.__apex.canvasScene.shell.startTapTool('oneThing'));
  await page.waitForTimeout(1500);
  const b = await page.evaluate(() => window.__apex.canvasScene.shell.runs.oneThing.targets.cover[0]);
  const c = await toClient(page, b.x + b.w / 2, b.y + b.h / 2);
  await page.mouse.click(c.x, c.y);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__apex.canvasScene.shell.runs.oneThing.phase)).toBe('see');
});

test('Fern Maze: tapping the glowing print moves along the trail', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.evaluate(() => window.__apex.goto(3, 'test', 0));
  await page.waitForTimeout(500); await clearCard(page);
  await page.waitForTimeout(300);
  const p = await page.evaluate(() => window.__apex.canvasScene.runner.scene.nextPrint());
  const c = await toClient(page, p.x, p.y);
  await page.mouse.click(c.x, c.y);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__apex.canvasScene.runner.scene.printIndex)).toBe(1);
});
