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

test('Fern Maze: Nip can be dragged onto the scent map with a real drag', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.evaluate(() => window.__apex.goto(3, 'test', 2));
  await page.waitForTimeout(500); await clearCard(page);
  await page.evaluate(() => { window.__apex.canvasScene.runner.scene.printIndex = 2; });
  await page.waitForTimeout(3000);
  const g = await page.evaluate(() => { const sh = window.__apex.canvasScene.shell, n = sh.actors.nip, m = sh.runs.parkIt.mapRect; return { nx: n.x, mx: m.x + m.w / 2, my: m.y + m.h / 2 }; });
  const from = await toClient(page, g.nx, await page.evaluate(() => Math.round((window.__apex.canvasScene.shell.P0()) * 0.82) - 12));
  const to = await toClient(page, g.mx, g.my);
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 5 }); await page.mouse.move(to.x, to.y, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__apex.canvasScene.shell.targets.distractions.find(d => d.type === 'nip').parked)).toBe(true);
});
