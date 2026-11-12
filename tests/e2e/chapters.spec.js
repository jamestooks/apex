import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

// Smoke test: every scenario of every chapter loads and draws for a few seconds without errors.
test('every chapter scene loads and draws', async ({ page }) => {
  test.setTimeout(120000);
  const errors = trackErrors(page);
  await page.goto('/?debug=1&speed=3');
  await newPlayer(page);
  const list = await page.evaluate(() => window.__apex.listScenes());
  expect(list.length).toBeGreaterThan(5);
  for (const [n, beat, i] of list) {
    await page.evaluate(([n, beat, i]) => window.__apex.goto(n, beat, i), [n, beat, i]);
    await page.waitForTimeout(700);
    await page.evaluate(() => { const s = window.__apex.canvasScene.shell; s.cardBorn = -9; s.dismissCard(); });
    await page.waitForTimeout(900);
  }
  expect(errors).toEqual([]);
});
