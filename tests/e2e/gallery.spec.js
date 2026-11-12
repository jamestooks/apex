import { test, expect } from '@playwright/test';
test('art gallery renders every theme, raptor stage and prop without errors', async ({ page }) => {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewportSize({ width: 1200, height: 1800 });
  await page.goto('/docs/dev-gallery.html');
  await expect.poll(() => page.evaluate(() => window.galleryReady === true)).toBe(true);
  await page.screenshot({ path: 'test-results/gallery.png', fullPage: true });
  expect(errors).toEqual([]);
});
