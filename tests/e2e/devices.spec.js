import { test, expect } from '@playwright/test';
import { trackErrors, newPlayer, pickSigns } from './helpers.js';

const tileCenter = page => page.evaluate(() => {
  const sh = window.__apex.canvasScene.shell, r = sh.tileRect(0), cv = document.getElementById('game').getBoundingClientRect(), s = cv.width / 400;
  return { x: cv.left + (r.x + r.w / 2) * s, y: cv.top + (r.y + r.h / 2) * s };
});

test('two children on one device stay separate; leaving mid-chapter is safe', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await newPlayer(page, 'Sam', 'Blaze');
  await page.click('[data-play="1"]');
  // the opening story plays first: wait for it, then press Skip
  await page.waitForFunction(() => { const c = window.__apex.canvasScene; return c && c.runner && c.runner.scene && c.runner.scene.kind === 'prologue'; });
  await page.evaluate(() => window.__apex.canvasScene.runner.scene.skip());
  const cv = await page.locator('#game').boundingBox();
  await page.waitForTimeout(900); await page.mouse.click(cv.x + 60, cv.y + 200);
  await pickSigns(page);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__apex.canvasScene.shell.onMenu());
  await page.click('#leave-scene');
  await page.click('#switch-player');
  await newPlayer(page, 'Ava', 'Spark');
  const [a, b] = await page.evaluate(() => window.__apex.store.profiles());
  expect(a.signs.rage.length).toBe(3);
  expect(b.signs.rage.length).toBe(0);
  expect(b.chapters[1] ? b.chapters[1].leg : 0).toBe(0);
  expect(errors).toEqual([]);
});

test('resizing mid-scene keeps the breathe tile working', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.evaluate(() => window.__apex.goto(1, 'test', 0));
  await page.waitForTimeout(300);
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.height > vp.width ? vp.height : 500, height: vp.height > vp.width ? vp.width : 700 });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const s = window.__apex.canvasScene.shell; if (s.card) { s.cardBorn = -9; s.dismissCard(); } });
  const c = await tileCenter(page);
  await page.mouse.move(c.x, c.y); await page.mouse.down();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__apex.canvasScene.shell.runs.longExhale.phase)).toBe('in');
  await page.mouse.up();
  expect(errors).toEqual([]);
});

test('backgrounding mid-breath pauses and drops the held breath', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await page.evaluate(() => window.__apex.goto(1, 'test', 0));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const s = window.__apex.canvasScene.shell; if (s.card) { s.cardBorn = -9; s.dismissCard(); } });
  const c = await tileCenter(page);
  await page.mouse.move(c.x, c.y); await page.mouse.down();
  await page.waitForTimeout(500);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const st = await page.evaluate(() => { const s = window.__apex.canvasScene.shell; return { paused: s.paused, phase: s.runs.longExhale.phase, title: s.card && s.card.title }; });
  expect(st.paused).toBe(true); expect(st.phase).toBe('idle'); expect(st.title).toBe('PAUSED');
  await page.mouse.up();
});

test('a Hunt is offered only on a finished chapter', async ({ page }) => {
  await page.goto('/?debug=1');
  await newPlayer(page);
  await expect(page.locator('[data-hunt="1"]')).toHaveCount(0);
  await page.evaluate(() => { const a = window.__apex; a.store.updateProfile(a.profile.id, p => { p.chapters[1] = { leg: 2, done: true }; }); a.show('home'); });
  await expect(page.locator('[data-hunt="1"]')).toHaveCount(1);
  await page.click('[data-hunt="1"]');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__apex.canvasScene.runner && window.__apex.canvasScene.runner.step)).toBeTruthy();
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#new-player')).toBeVisible();
  await context.setOffline(false);
});
