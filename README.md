# Apex

A raptor survival game where every tool is a real coping skill. Built for phone, tablet and computer browsers, installable to the home screen, works offline, and keeps all data on the device.

- Design: [`docs/design.md`](docs/design.md)
- Original Rage prototype: [`docs/reference/rage-prototype.html`](docs/reference/rage-prototype.html)

## Run it locally

```sh
npm start            # serves on http://localhost:4173 (no-cache dev server)
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

## Put it on a phone or tablet

The game is a set of static files, so any static web host works. GitHub Pages is free:

1. Run `npm run sw` (refreshes the offline file list and cache version), then commit.
2. Push the repo to GitHub.
3. In the repo on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`, save.
4. After a minute, open `https://<your-username>.github.io/<repo-name>/` on the tablet.
5. **iPhone/iPad (Safari):** Share → **Add to Home Screen**. **Android (Chrome):** menu → **Install app**.

Once it's on the home screen it opens full screen and works offline.

**Keep a backup.** Everything is stored on the device only. Safari can clear data for sites that are *not* on the home screen and haven't been opened for a while, so install it, and use **Grown-ups → Data → Export backup** now and then.

## Players and grown-ups

- Each child gets their own player: their own raptor, warning signs, progress, trophies and Den answers.
- **Grown-ups** (PIN-locked, from the main screen or the valley) has per-child overview, outside-mission confirmation, custom warning signs, printable plan cards, settings (session length, chapters open, sound, vibration, reduced motion, intensity, larger text), coaching tips for each chapter, a real-life log, and backup/restore.
- Forgot the PIN? Tap **Forgot PIN** and answer the multiplication question.
