// Shared e2e helpers: an in-page calm bot that plays canvas scenes through real keyboard/pointer events.
export function trackErrors(page) {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
}
export async function newPlayer(page, name = 'Sam', raptor = 'Blaze') {
  await page.click('#new-player');
  await page.fill('#child-name', name);
  await page.fill('#raptor-name', raptor);
  await page.click('#create-player');
  await page.waitForSelector('[data-chapter="1"]');
}
export async function pickSigns(page) {
  await page.waitForSelector('[data-sign]');
  const tiles = page.locator('[data-sign]');
  for (let i = 0; i < 3; i++) await tiles.nth(i).click();
  await page.click('#signs-done');
}
// Starts a bot in the page: dismisses cards, breathes with Space when hot, picks the first calm choice when cool.
export async function startCalmBot(page) {
  await page.evaluate(() => {
    const key = (type, k) => window.dispatchEvent(new KeyboardEvent(type, { key: k }));
    const cv = document.getElementById('game');
    let holding = false;
    window.__bot = setInterval(() => {
      const s = window.__apex && window.__apex.canvasScene, sh = s && s.shell;
      if (!sh) return;
      if (sh.card) { if (sh.T - sh.cardBorn > 0.8) { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 5, clientX: r.left + 50, clientY: r.top + 50, bubbles: true })); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, bubbles: true })); } return; }
      const le = sh.runs.longExhale;
      if (le) {
        if (le.phase === 'idle' && !holding && sh.heat > 0.22) { key('keydown', ' '); holding = true; }
        if (holding && le.phase === 'full') { key('keyup', ' '); holding = false; }
      }
      if (sh.choices && sh.heat < 0.5 && !holding && (!le || le.phase === 'idle')) {
        const i = sh.choices.findIndex(c => !c.instinct); if (i >= 0) { key('keydown', String(i + 1)); key('keyup', String(i + 1)); }
      }
    }, 30);
  });
}
export async function stopBot(page) { await page.evaluate(() => clearInterval(window.__bot)); }
