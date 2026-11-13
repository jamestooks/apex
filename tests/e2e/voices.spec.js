import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

test('the opening story plays recorded voice clips; turning voices off stops them', async ({ page }) => {
  const errors = trackErrors(page);
  const clips = [];
  page.on('request', r => { if (/\/voice\/[a-z0-9]+\.mp3$/.test(r.url())) clips.push(r.url()); });
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.click('[data-play="1"]');
  await page.waitForTimeout(2500);
  expect(clips.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);

  // voices off for this child: no clips are fetched for new lines
  await page.evaluate(() => { const a = window.__apex; a.canvasScene.runner.scene.skip(); a.store.updateProfile(a.profile.id, p => { p.settings.voices = false; }); a.applySettings(a.profile); });
  const before = clips.length;
  await page.evaluate(() => window.__apex.canvasScene.shell.say('Good. Feel it drop?', 3, 3, 'scar'));
  await page.waitForTimeout(800);
  expect(clips.length).toBe(before);
});
