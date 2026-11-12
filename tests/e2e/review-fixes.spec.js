import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

test('spaces can be typed in names, and Escape on the valley after a scene does nothing', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await page.click('#new-player');
  await page.click('#child-name');
  await page.keyboard.type('Sam Jones');
  await expect(page.locator('#child-name')).toHaveValue('Sam Jones');
  await page.click('#create-player');
  await page.waitForSelector('[data-chapter="1"]');
  await page.evaluate(() => window.__apex.goto(1, 'test', 0));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__apex.canvasScene.shell.onMenu());
  await page.click('#leave-scene');
  await page.waitForSelector('[data-chapter="1"]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await expect(page.locator('#resume-scene')).toHaveCount(0);
  await expect(page.locator('[data-chapter="1"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the canvas stays clear of iPhone safe areas', async ({ page }) => {
  await page.goto('/?debug=1');
  await page.evaluate(() => { document.documentElement.style.setProperty('--sai-top', '47px'); document.documentElement.style.setProperty('--sai-bottom', '34px'); dispatchEvent(new Event('resize')); });
  const box = await page.locator('#game').boundingBox();
  const vh = await page.evaluate(() => innerHeight);
  expect(box.y).toBeGreaterThanOrEqual(47);
  expect(box.y + box.height).toBeLessThanOrEqual(vh - 34 + 0.5);
});

test('grown-ups can always get the backup as text to copy', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.click('#grownups-link');
  for (const d of '12341234') await page.click(`[data-digit="${d}"]`);
  await page.click('[data-tab="data"]');
  await page.click('#show-backup');
  await expect(page.locator('#backup-text')).toHaveValue(/"app": "apex"/);
});
