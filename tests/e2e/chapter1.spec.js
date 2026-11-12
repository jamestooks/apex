import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer, pickSigns, startCalmBot, stopBot } from './helpers.js';

test('a new player plays Chapter 1 part 1 calmly and reaches the Den', async ({ page }) => {
  test.setTimeout(180000);
  const errors = trackErrors(page);
  await page.goto('/?speed=8&debug=1');
  await newPlayer(page);
  await page.click('[data-play="1"]');
  await startCalmBot(page);
  await pickSigns(page);
  await page.waitForSelector('#field-notes', { timeout: 150000 });
  await stopBot(page);
  await expect(page.locator('#field-notes')).toContainText('Caught it early');
  await expect(page.locator('#field-notes')).toContainText('Long Exhale used');
  await page.click('[data-plan="1"]');
  await expect(page.locator('.plan')).toContainText('MY RAGE PLAN');
  expect(errors).toEqual([]);
});
