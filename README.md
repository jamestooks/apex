# Apex

A raptor survival game where every tool is a real coping skill. Built for phone, tablet and computer browsers, installable to the home screen, works offline, and keeps all data on the device.

- Design: [`docs/design.md`](docs/design.md)
- Original Rage prototype: [`docs/reference/rage-prototype.html`](docs/reference/rage-prototype.html)

## Run it locally

```sh
npm start            # serves on http://localhost:4173
```

Open http://localhost:4173 in a browser. No build step: the files in `src/` load directly.

Dev helpers: `?speed=8` runs the game 8× faster, `?debug=1` exposes `window.__apex`.

## Tests

```sh
npm install
npx playwright install chromium
npm test             # unit + simulation tests (node --test)
npm run e2e          # browser tests (Playwright)
```
