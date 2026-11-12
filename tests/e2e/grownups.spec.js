import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer } from './helpers.js';

async function enterPin(page, pin) { for (const d of pin) await page.click(`[data-digit="${d}"]`); }

test('grown-ups mode: PIN, missions, per-child settings, reduced motion', async ({ page }) => {
  test.setTimeout(90000);
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await newPlayer(page, 'Sam', 'Blaze');
  await page.click('#switch-player');
  await newPlayer(page, 'Ava', 'Spark');
  const ids = await page.evaluate(() => window.__apex.store.profiles().map(p => p.id));
  await page.evaluate(id => window.__apex.store.updateProfile(id, p => { p.chapters[1] = { leg: 2, done: true }; p.missions[1] = 'done-told'; }), ids[0]);

  // set a PIN, leave, wrong PIN refused, right PIN accepted
  await page.click('#grownups-link');
  await enterPin(page, '1234'); await enterPin(page, '1234');
  await expect(page.locator('.tabs')).toBeVisible();
  await page.click('#gu-exit');
  await page.click('#grownups-link');
  await enterPin(page, '9999');
  await expect(page.locator('#pin-msg')).toContainText('not right');
  await enterPin(page, '1234');
  await expect(page.locator('.tabs')).toBeVisible();

  // confirm Sam's mission
  await page.selectOption('#gu-child', ids[0]);
  await page.click('[data-tab="missions"]');
  await page.click('[data-confirm="1"]');
  expect(await page.evaluate(id => window.__apex.store.getProfile(id).missions[1], ids[0])).toBe('confirmed');
  expect(await page.evaluate(id => window.__apex.store.getProfile(id).missions[1] || 'none', ids[1])).toBe('none');

  // session length for Sam only
  await page.click('[data-tab="settings"]');
  await page.selectOption('#set-minutes', '10');
  expect(await page.evaluate(id => window.__apex.store.getProfile(id).settings.sessionMinutes, ids[0])).toBe(10);
  expect(await page.evaluate(id => window.__apex.store.getProfile(id).settings.sessionMinutes, ids[1])).toBe(15);
  await page.check('#set-reducedMotion');
  await page.click('#gu-exit');

  // Sam's Den shows the trophy; Ava's does not
  await page.evaluate(id => window.__apex.selectProfile(id), ids[0]);
  await page.click('#open-den');
  await expect(page.locator('#trophies')).toContainText('Fossil');
  await page.evaluate(id => window.__apex.selectProfile(id), ids[1]);
  await page.click('#open-den');
  await expect(page.locator('#trophies')).not.toContainText('Fossil');

  // reduced motion: no screen shake when a trigger hits
  await page.evaluate(id => window.__apex.selectProfile(id), ids[0]);
  await page.evaluate(() => window.__apex.goto(1, 'test', 0));
  const maxShake = await page.evaluate(() => new Promise(res => { let m = 0; const t0 = Date.now(); const iv = setInterval(() => { const s = window.__apex.canvasScene && window.__apex.canvasScene.shell; if (s) { if (s.card) { s.cardBorn = -9; s.dismissCard(); } m = Math.max(m, s.shake); } if (Date.now() - t0 > 4000) { clearInterval(iv); res(m); } }, 30); }));
  expect(maxShake).toBe(0);
  expect(errors).toEqual([]);
});
