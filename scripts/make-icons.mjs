// Renders icons/icon.svg to the PNG sizes the manifest and iOS need. Usage: npm run icons
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const svg = readFileSync('icons/icon.svg', 'utf8');
const b = await chromium.launch();
const page = await b.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0.1], ['apple-touch-icon.png', 180, 0]]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<html><body style="margin:0;background:#1a0d2e;display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: `icons/${name}`, clip: { x: 0, y: 0, width: size, height: size } });
}
await b.close();
console.log('icons written');
