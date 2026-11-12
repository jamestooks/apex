import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

test('Den privacy line, mission acknowledgement, plan card label, grown-up cue and noticed signs', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await newPlayer(page, 'Sam', 'Blaze');
  await page.evaluate(() => { const a = window.__apex; a.store.updateProfile(a.profile.id, p => { p.chapters[1] = { leg: 2, done: true }; p.signs.rage = ['Hot face', 'Loud voice', 'Tight chest']; }); a.show('home'); });
  await page.click('#open-den');
  await expect(page.locator('#den-privacy')).toContainText('Grown-ups can see');
  await page.click('[data-did-it="1"]');
  await expect(page.locator('[data-ack="1"]')).toContainText('Long Exhale');

  // a grown-up adds what they notice; it shows on the plan card
  await page.click('#to-valley');
  await page.click('#grownups-link');
  for (const d of '12341234') await page.click(`[data-digit="${d}"]`);
  await page.click('[data-tab="signs"]');
  await page.fill('[data-parent-sign="rage"]', 'Goes quiet');
  await page.click('[data-add-parent-sign="rage"]');
  await page.click('[data-tab="settings"]');
  await expect(page.locator('#set-feelSound')).toHaveValue('soft');
  await expect(page.locator('#set-feelShake')).toHaveValue('soft');
  await page.click('#gu-exit');
  await page.click('#open-den');
  await page.click('[data-plan="1"]');
  await expect(page.locator('.plan')).toContainText('Grown-ups notice: Goes quiet');
  await expect(page.locator('.plan')).toContainText('Take your own slow breath out first');
  await expect(page.locator('#plan-label')).toContainText('Written by Sam and a grown-up. Not medical advice.');
  expect(errors).toEqual([]);
});
