import { test, expect } from '@playwright/test';
test('boots with no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/');
  await expect(page.locator('#game')).toHaveCount(1);
  await expect(page.locator('#ui')).toHaveCount(1);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
