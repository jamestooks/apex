import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

test('journey on the valley; unlocks announced once; dressing room equips only unlocked items', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await newPlayer(page, 'Sam', 'Blaze');
  await expect(page.locator('#journey .journey-stop')).toHaveCount(6);
  await expect(page.locator('[data-stop="1"]')).toHaveClass(/current/);
  await page.evaluate(() => { const a = window.__apex; a.store.updateProfile(a.profile.id, p => { p.chapters[1] = { leg: 2, done: true }; }); a.show('home'); });
  await expect(page.locator('[data-stop="1"]')).toHaveClass(/done/);
  await expect(page.locator('[data-stop="2"]')).toHaveClass(/current/);
  await page.click('#open-den');
  await expect(page.locator('#new-unlocks')).toContainText('Fern crest');
  await page.click('[data-slot="crest"]');
  await expect(page.locator('[data-look="crest-sail"]')).toBeDisabled();
  await page.click('[data-look="crest-fern"]');
  expect(await page.evaluate(() => window.__apex.profile.look.crest)).toBe('crest-fern');
  await page.click('#to-valley');
  await page.click('#open-den');
  await expect(page.locator('#new-unlocks')).toHaveCount(0);
  expect(errors).toEqual([]);
});
