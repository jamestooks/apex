# Apex — Full Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Chapter 1: Rage prototype into the full six-chapter Apex game, playable in a browser on phone, tablet and computer, with separate local profiles for each child and a PIN-locked Grown-ups mode.

**Architecture:** A static, installable web app (PWA) with no build step: plain ES modules served as files. Gameplay renders on one portrait `<canvas>` (logical width 400, as in the prototype). Menus, profiles, the Den, plan cards and Grown-ups mode are DOM screens layered over the canvas. Game logic (meters, tools, scene state machines, progress) is pure and unit-tested in Node. Drawing is kept in separate functions. Chapters and scenarios are data files.

**Tech Stack:** HTML5 canvas, Web Audio, vanilla JS ES modules, localStorage, Service Worker. Dev only: Node 26 `node --test` for unit and simulation tests, `@playwright/test` (Chromium) for end-to-end smoke tests, `python3 -m http.server` to serve.

**Spec:** `docs/design.md` (the Apex Game Design Document). Reference implementation of Chapter 1: `docs/reference/rage-prototype.html`. Port its art, audio, timings and copy rather than re-inventing them.

## Global Constraints

- No runtime dependencies, no bundler. Every file in `src/` loads directly in the browser as an ES module. Fonts only from Google Fonts (Oswald, Lora), with system fallbacks as in the prototype.
- Must work on iOS/iPadOS Safari, Android Chrome and desktop Chrome/Safari/Firefox, both touch and mouse/keyboard. Controls must work one-handed on a phone.
- All data stays on the device. No analytics, no network calls except loading the app's own files and fonts.
- Copy rule (spec, Wellbeing): "describe what happened and what to try next, never what he is." No streaks, loot boxes, ads or notifications. No blood: fights are a dust cloud and a limp.
- Copy is UK English (practise, colour, SENCo). The player is addressed as "you". Scar speaks in short lines marked with a claw.
- Meter constants are taken verbatim from the prototype: sign thresholds `[0.3, 0.55, 0.8]`, lock line `0.7`, takeover at `1`. A single trigger can never fill a meter: a spike caps the meter at `0.92`. After a takeover, simmer for the rest of the session is `×0.6`, and the next gap is longer.
- Long Exhale timing: hold to breathe in for 3 s. Release, then breathe out for 5 s. The meter drops only on the out-breath, by `0.075/s`. Simmer pauses while breathing in, while breathing out, and for the first 2 s of a full breath.
- Calm choices (any non-instinct choice) earn +1 trust only when the scene's primary meter is below the second sign (`0.55`) at the moment of choosing. Otherwise they earn 0. An instinct choice costs −1. Instinct choices never lower the meter.
- Outcome cards ignore taps for the first 0.7 s.
- Session cap defaults to 15 minutes and applies only at natural stopping points (after an outcome card or the end of a beat), never mid-scene. After the cap there is a 60-minute rest, which Grown-ups mode can clear. *(The rest length is the builder's call.)*
- Pack ranks by cumulative trust (floored at 0): Hatchling 0, Runner 3, Hunter 7, Tracker 12, Elder 18, Apex 24. Finishing the finale with a calm choice also grants Apex. *(The thresholds are the builder's call.)*
- Storage uses localStorage under the single key `apex.v1` *(builder's call, instead of the spec's IndexedDB: the data is under 100 KB and synchronous access is simpler)*.

## Review Focus

1. **App backgrounded or screen locked mid-scene** (very common on a phone): on `visibilitychange` to hidden, the game must pause, clear held pointers and keys (no stuck "breathing in"), and suspend audio. On return it resumes paused, behind a "Tap to continue" card. Test in Task 5.
2. **Storage unavailable or corrupt** (Safari private mode, cleared site data, a half-written JSON): the game must still run in memory, never crash at boot, keep the corrupt raw string under `apex.v1.corrupt`, and Grown-ups mode must show a warning that progress isn't being saved. Test in Task 2.
3. **Two children on one device**: progress, signs, settings, Den answers and session timers must never leak between profiles. Switching profile ends the current session cleanly. Test in Task 2 and the e2e test in Task 13.
4. **Rotation or resize mid-scene**: the canvas re-lays out (H changes), and the panel, buttons and drag targets stay hittable, with no thrown errors. Test via e2e in Task 13.
5. **Multi-touch and stray taps**: holding the breathe tile with one thumb while tapping a choice with the other must work. A tap on a card in its first 0.7 s does nothing. Keyboard works on desktop: Space = hold tool, 1–4 = choices, Enter = continue, M = mute. Test in Task 5.

---

## File Structure

```
index.html                 shell: <canvas id="game">, <div id="ui"> overlay, manifest link, module entry
styles.css                 DOM screen styles + @media print for plan cards
manifest.webmanifest, sw.js, icons/ (icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png)
package.json               "type":"module"; scripts: start, test, e2e, icons
playwright.config.js
scripts/make-icons.mjs     renders icons/icon.svg to PNGs with Playwright
src/
  main.js                  boot: load store, init canvas/input/audio, register SW, start router + loop
  app.js                   router (show/back), rAF loop, pause on hidden, debug hooks
  store.js                 load/save/migrate, profiles CRUD, settings, PIN, log
  model/progress.js        rank, unlocks, legs, recordSession, trophies, appearance
  model/session.js         session timer + cap + rest
  engine/canvas.js         resize/scale/dpr, fonts, rr/wrapLines/wrap, hash/clamp/rand/inR
  engine/input.js          pointers, keys, per-frame buttons, holds, drags, consume hook
  engine/audio.js          AudioContext, SFX bank, growl, heartbeat, mute, vibrate, intensity
  engine/meter.js          INSTINCTS, Meter, MeterSet
  engine/tools/index.js    TOOLS registry
  engine/tools/longExhale.js oneThing.js parkIt.js burstRest.js waitSignal.js
  engine/scene.js          shared scene shell: actors, messages, cards, panel, toolbelt, vignette
  engine/kinds/moment.js   trigger → meter → tool → choice → outcome → gap
  engine/kinds/track.js    Fern Maze trail following + distractions
  engine/kinds/run.js      side-scrolling burst & rest
  engine/kinds/ambush.js   hold still, urge waves, act on signal
  engine/kinds/repair.js   make-peace scene (prototype's)
  engine/kinds/teachNip.js finale teach beat: do each tool, Nip copies
  art/raptor.js            raptorShape/drawRaptor (+ growth, feathers, scars, rim colour)
  art/world.js             THEMES (6) + drawWorld/drawForeground
  art/props.js             carcass, herd, hadrosaur, tyrannosaur, beetle, amber, footprints, log, rain, lightning, ash, lava stones, ferns
  play/runner.js           runs a chapter leg or a Hunt: beats, cards, difficulty, repair, cap → Den
  data/signs.js            SIGN_OPTIONS per instinct
  data/chapters/index.js   CHAPTERS array
  data/chapters/1-rage.js 2-overwhelm.js 3-distraction.js 4-energy.js 5-impulse.js 6-finale.js
  ui/dom.js                h(tag, props, ...children), mount(screenEl)
  ui/profiles.js           who's playing + new profile (child name, raptor name, rim colour)
  ui/home.js               valley map: chapters, Hunts, Den, rank, raptor preview, rest state
  ui/signs.js              pick 3 signs in order for an instinct
  ui/den.js                field notes, Scar's question, plan card link, mission, trophies, change signs
  ui/plancard.js           printable plan card for one chapter + profile
  ui/grownups.js           PIN gate + tabs: Overview, Missions, Signs, Plan cards, Settings, Coach, Log, Data
tests/
  unit/*.test.js           node --test
  sim/*.test.js            scripted play-style simulations through scene logic
  e2e/*.spec.js            Playwright
docs/dev-gallery.html      art gallery page for visual checks (all themes, raptor stages, props)
```

Scene kinds and tools follow one rule: **`update()` is pure logic over explicit inputs, and `draw(ctx)` only reads state.** Node tests drive `update()` with fake inputs and a no-op audio object.

---

### Task 1: Scaffold, engine basics and the dev loop

**Files:**
- Create: `package.json`, `index.html`, `styles.css`, `src/main.js`, `src/app.js`, `src/engine/canvas.js`, `src/engine/input.js`, `src/engine/audio.js`, `src/ui/dom.js`, `playwright.config.js`, `tests/e2e/boot.spec.js`, `.gitignore`, `README.md`
- Test: `tests/unit/input.test.js`, `tests/e2e/boot.spec.js`

**Interfaces:**
- Produces:
  - `engine/canvas.js`: `W=400`, `PANEL=190`, `view={H,scale,dpr}`, `initCanvas(el)`, live-binding `export let ctx`, `SH()`, `GY()`, `FH(size,weight)`, `FS(size)`, `FB(size,weight)`, `rr(x,y,w,h,r)`, `wrapLines(text,maxW)`, `wrap(text,x,y,maxW,lh)→y`, `hash(i)`, `clamp`, `rand`, `inR(p,rect)`, `toLogical(clientX,clientY)→{x,y}`. Resize logic is ported from the prototype (H between 600 and 880).
  - `engine/input.js`: `createInput()` → `{pointers:Map, keys:Set, buttons:[], addButton({x,y,w,h,cb,primary,key}), beginFrame(), held(rect, keyName)→bool, taps:[{x,y}], drag:{active,id,x,y,startX,startY}|null, onDown:(p)=>bool|null, clearAll()}`. `taps` holds the pointer-downs since the last `beginFrame()` that no button consumed.
  - `engine/audio.js`: the prototype's `audioInit`, `SFX` bank and growl, plus `configureAudio({sound,vibration,intensity})`, `setGrowl(level0to1)`, `heartbeat(rage)`, `suspend()`, `resume()`, `vibrate(ms)`, `toggleMute()`. New SFX: `thunder, rumble, rainStart, rainStop, splash, signal, calls(n), trexRoar, eruption, wind, sprint, parked`.
  - `app.js`: `app.show(name, params)`, `app.canvasScene` (object with `update(dt)`/`draw()` or null), `app.paused`, `?speed=N` dt multiplier and `?debug=1` → `window.__apex`.
  - `ui/dom.js`: `h(tag, props, ...children)`, `mount(el)` (replaces `#ui` contents), `unmount()`.

- [ ] **Step 1:** `npm init`, then add `"type":"module"` and the scripts `start` (`python3 -m http.server 4173`), `test` (`node --test tests/unit tests/sim`), `e2e` (`playwright test`) and `icons`. Install the `@playwright/test` dev dependency and run `npx playwright install chromium`. Add `node_modules`, `test-results` and `playwright-report` to `.gitignore`.
- [ ] **Step 2: Write failing tests.** `tests/unit/input.test.js`: `held(rect)` is true while a pointer is inside the rect and false after `pointerup`. `held(rect,'Space')` is true while the key is held. A button consumes its tap, so `taps` stays empty. `clearAll()` empties pointers and keys. `tests/e2e/boot.spec.js`: the page at `/` loads with zero console errors, and `#game` and `#ui` exist.
- [ ] **Step 3:** Run `npm test && npm run e2e`. Expected: FAIL.
- [ ] **Step 4:** Implement the files above. `input.js` takes an EventTarget-like element so Node tests can pass a fake. `index.html` copies the prototype's viewport meta, `touch-action:none` and user-select rules, and adds `apple-mobile-web-app-capable` and `theme-color`. `main.js` mounts a placeholder screen.
- [ ] **Step 5:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 6:** README: how to run (`npm start`, open `http://localhost:4173`), how to test, and a pointer to the spec. Commit `feat: scaffold app shell, canvas, input, audio`.

### Task 2: Store, profiles, progress model, session cap

**Files:**
- Create: `src/store.js`, `src/model/progress.js`, `src/model/session.js`
- Test: `tests/unit/store.test.js`, `tests/unit/progress.test.js`, `tests/unit/session.test.js`

**Interfaces:**
- Produces:
  - `store.js`: `createStore(storage = globalThis.localStorage)` → `{data, persistent:boolean, save(), profiles(), getProfile(id), addProfile({childName, raptorName, rim})→profile, updateProfile(id, fn), deleteProfile(id), activeId, setActive(id), setPin(pin), checkPin(pin)→bool, hasPin(), exportJSON()→string, importJSON(str)}`.
  - Profile shape: `{id, childName, raptorName, rim, createdAt, settings:{sessionMinutes:15, chaptersOpen:null|number[], sound:true, vibration:true, reducedMotion:false, intensity:'normal'|'low', largeText:false}, signs:{rage:[],overload:[],drift:[],fuel:[],urge:[]}, customSigns:{…same keys}, trust:0, scars:0, mealsKept:0, chapters:{[n]:{leg:0|1|2, done:false}}, toolbelt:[], sessions:[], denAnswers:[{date,chapter,question,answer,shared}], missions:{[n]:'none'|'done-told'|'confirmed'}, log:[{date,instinct,phrase:true,outcome:'used'|'unprompted'|'didnt'}], restUntil:0, strengths:{}, parked:[]}`.
  - Rim colour options: `RIMS = ['#fb923c','#38bdf8','#a3e635','#f472b6','#facc15']`. The first is the prototype's.
  - `progress.js`: `RANKS`, `rankFor(trust, finaleCalm)→{name, index, next}`, `chapterOpen(profile, n)→bool` (sequential unless `settings.chaptersOpen` overrides), `nextLeg(profile, n)→0|1|'done'`, `completeLeg(profile, n, leg)`, `recordSession(profile, stats)`, `appearance(profile)→{scale, feathers, scars, rim}` (scale `1 + 0.06×chaptersDone`, feathers `4 + 2×chaptersDone`, scars `min(3, profile.scars)`), `seasonName(n)`, `trophies(profile)→[{chapter, name, icon}]` (confirmed missions only; names: Fossil, Feather, Tooth, Claw, Amber, Ember).
  - `session.js`: `createSession(profile, now)` → `{elapsed(now), capReached(now)→bool, end(now)}`, `restRemaining(profile, now)→ms`, `startRest(profile, now)` (`restUntil = now + 60 min`).

- [ ] **Step 1: Write failing tests.**
  - store: a round trip preserves profiles. Two profiles stay isolated, so updating A's signs leaves B unchanged. A corrupt JSON string gives a fresh default with the raw string kept at `apex.v1.corrupt`. A storage whose `setItem` throws gives `persistent === false` and `save()` doesn't throw. `checkPin` is true only for the set PIN, and the stored value is not the plain PIN. `deleteProfile` clears `activeId` if it was active. `importJSON(exportJSON())` round-trips.
  - progress: `rankFor(0).name === 'Hatchling'`, `rankFor(7).name === 'Hunter'`, `rankFor(30).name === 'Apex'`, `rankFor(-4).name === 'Hatchling'`. Chapter 2 is closed until chapter 1 is done, unless `chaptersOpen` includes 2. `appearance` after 2 chapters has `scale 1.12` and `feathers 8`. `trophies` lists only confirmed missions.
  - session: `capReached` is false at 14:59 and true at 15:00 for the default, and honours `sessionMinutes: 10`. `restRemaining` counts down after `startRest`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Hash the PIN with a simple synchronous string hash plus a salt (it's kid-proofing, not security). `createStore` falls back to an in-memory map when `storage` is missing or throws.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: local profiles, progress and session model`.

### Task 3: Instinct meters and the five tools (logic)

**Files:**
- Create: `src/engine/meter.js`, `src/engine/tools/index.js`, `src/engine/tools/longExhale.js`, `oneThing.js`, `parkIt.js`, `burstRest.js`, `waitSignal.js`
- Test: `tests/unit/meter.test.js`, `tests/unit/tools.test.js`

**Interfaces:**
- Produces:
  - `meter.js`: `SIGN_T=[0.3,0.55,0.8]`, `LOCK=0.7`, `SPIKE_CAP=0.92`, `INSTINCTS={rage:{label:'RAGE',tool:'longExhale'}, overload:{label:'OVERLOAD',tool:'oneThing'}, drift:{label:'DRIFT',tool:'parkIt'}, fuel:{label:'FUEL',tool:'burstRest'}, urge:{label:'URGE',tool:'waitSignal'}}`.
  - `class Meter {constructor(instinct, signs, {simmerMul=1}={}); value; peak; firstToolAt:null|number; spike(a); simmer(rate, dt); relieve(a); crossings()→number[] (sign indices crossed upward since last call); lit→0..3; locked; full; adapt()}`. `adapt()` sets `simmerMul = 0.6`.
  - `class MeterSet {constructor(meters:Meter[]); get(instinct); list; relieve(instinct, amount)}`. Relief applies in full to the matching meter and at `×0.25` to the others. The first relief on a meter records `firstToolAt = value`.
  - Each tool module: `export const TOOL = {id, name, instinct, how, phrase}` with the phrases from the spec's Shared phrases table, plus `createRun(opts)` → `{phase, done, pausesSimmer:boolean, update(dt, io)→{relief:number, events:string[]}, draw(ctx, layout)}`. Here `io = {held:boolean, taps:[{x,y}], drag, targets}`.
  - `longExhale`: phases `idle → in → full → out → idle`, with the prototype's timings and hints. Events: `inhale`, `exhale`, `breath`, `hint:allTheWayIn`, `hint:letGo`, `hint:letItOut`. Relief is `0.075×dt` only during `out` while not held.
  - `oneThing`: phases `cover → see → hear → feel → next`. Each step waits for a tap on one of `opts.targets[step]` (rects with labels, supplied by the scene) and only accepts it after a 1.2 s dwell. The prompt says "Say it out loud, then tap it." Relief per step: cover 0.10, see 0.15, hear 0.15, feel 0.15. Events: `step:<name>` and `done` (on reaching `next`).
  - `parkIt`: `createRun({mapRect})`, where `io.drag` drops onto `mapRect` a distraction from `io.targets.distractions` (`{id, x, y, r, parked}`). Parking gives instant relief of 0.25 and events `parked:<id>`. The prompt says "Say 'later', then park it."
  - `burstRest`: two modes. `createRun({mode:'run'})`: held means sprint, `{speed:3, fuel:+0.16/s}`. Not held means trot, `{speed:1, fuel:−0.10/s}`, then rest after 2 s not held, `−0.16/s`. Returns `{relief (negative when it adds fuel), speed, events}`. `createRun({mode:'break'})` is a movement break: hold for 5 s while the prompt says "Reach up high… now shake it out", giving relief 0.08/s while held. Releasing pauses it. Event `done`.
  - `waitSignal`: `createRun({mode:'ride'})`: hold the pad for 6 s while a wave rises and falls, relief 0.06/s while held. Event `done`. The ambush kind drives the in-scene version itself (Task 9).
  - `tools/index.js`: `TOOLS = {longExhale, oneThing, parkIt, burstRest, waitSignal}`, `toolForInstinct(instinct)`.

- [ ] **Step 1: Write failing tests.**
  - meter: `spike(0.5)` from 0.6 gives 0.92, not 1. `simmer` can reach 1, and `full` is then true. `crossings()` returns `[0]` once when going from 0.2 to 0.35 and `[]` on the next call. `adapt()` makes `simmer(0.1, 1)` add 0.06. MeterSet relief of 0.4 on rage drops rage by 0.4 and overload by 0.1.
  - longExhale: holding for 3 s reaches `full`. Releasing at 2 s goes back to `idle` with `hint:allTheWayIn`. Releasing from full, then 5 s not held, totals 0.375 relief and emits `breath`. Holding during `out` gives 0 relief and `hint:letItOut`. `pausesSimmer` is true during in, during out, and for full under 2 s.
  - oneThing: taps out of order or before 1.2 s don't advance. A correct sequence emits the four `step:` events and `done`, with total relief 0.55.
  - parkIt: dropping inside `mapRect` parks with 0.25 relief, and a drop outside doesn't.
  - burstRest run: 1 s held gives `relief ≈ −0.16` and `speed 3`. 3 s released gives `≈ 0.10×2 + 0.16×1` relief.
  - waitSignal ride: 6 s held gives `done` with 0.36 relief.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. The `draw` functions port the prototype's breathing circle and the panel fill for longExhale. The others draw their own overlay (step prompts, wave, stretch figure) in the same visual language. Draws are not unit-tested.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: instinct meters and the five tools`.

### Task 4: Art: raptor growth, six worlds, props, dev gallery

**Files:**
- Create: `src/art/raptor.js`, `src/art/world.js`, `src/art/props.js`, `docs/dev-gallery.html`
- Test: `tests/e2e/gallery.spec.js`

**Interfaces:**
- Consumes: `engine/canvas.js`.
- Produces:
  - `drawRaptor(x, y, s, pose, t, face, o)`, ported from the prototype. Poses: `stand|crouch|walk|run|pounce|still|lie`. Options from the prototype (`hk, tail, eye, eyeR, snarl, lean, scar`) plus `rim` (colour), `feathers` (count) and `scars` (0–3 marks).
  - `THEMES = {dusk, dust, ferns, river, moon, ash}`. Each is `{sky:[4 stops], sun:{x,y,r,col}, ridges:[far,mid,near], ground, fern, fog?, weather?:'rain'|'ash'|null}`. `dusk` is exactly the prototype's palette. The others use the colours from the spec's "Colour per chapter".
  - `drawWorld(theme, cx, heat, t, {reducedMotion})` and `drawForeground(theme, cx, t)`.
  - `props.js`: `drawCarcass, drawHerd(x, y, n, t, dust), drawHadrosaur, drawTrex(x, y, s, pose, t), drawBeetle, drawAmber, drawFootprint(x, y, glow), drawLog, drawRain(t, intensity), drawLightning(t), drawAsh(t), drawLavaStone(x, y, settled), drawPtero`. All use the dark-silhouette, rim-lit style.

- [ ] **Step 1: Write the failing test.** `gallery.spec.js` opens `/docs/dev-gallery.html` and expects zero console errors, with a screenshot saved to `test-results/gallery.png` for a human to look at.
- [ ] **Step 2:** Run `npm run e2e -- gallery`. Expected: FAIL.
- [ ] **Step 3:** Implement. The gallery draws each theme, raptor stages 0/3/6 with 0–3 scars in each rim colour, and every prop.
- [ ] **Step 4:** Run it. Expected: PASS. Open the screenshot and check that each theme reads as its chapter's colour and the raptor silhouette matches the prototype.
- [ ] **Step 5:** Commit `feat: art for six worlds, raptor growth and props`.

### Task 5: Scene shell and the moment kind (Chapter 1 logic)

**Files:**
- Create: `src/engine/scene.js`, `src/engine/kinds/moment.js`, `src/engine/kinds/repair.js`
- Test: `tests/unit/scene.test.js`, `tests/sim/moment.test.js`

**Interfaces:**
- Consumes: Meter/MeterSet, TOOLS, art, input, audio.
- Produces:
  - `scene.js` → `createShell(env)`, where `env = {profile, theme, meters:MeterSet, tools:string[], audio, input, difficulty:{simmerMul, gapMul, spikeAdd}, settings, stats}`. The shell provides:
    - `say(text, dur, prio, who)` and `sayNext(...)`, with who ∈ `scar|echo|narr`.
    - `card({title, sub, body, bad, cb})`, which enforces the 0.7 s guard.
    - Actors `me`, `scar`, `echo`, `nip`, `fang` (`{x, tx, face, s, sp, on}`) and `move(actor, dt)→moving`.
    - `drawPanel({choices, lockedFn})`. One meter draws exactly as the prototype; two draw stacked and compact.
    - `toolbelt`. With one tool it's the prototype's big BREATHE tile. With more, it's a grid of tiles, where hold-type tools are held on the tile and tap-type tools start their overlay.
    - The heat vignette, heartbeat, growl, screen shake (none with reducedMotion or intensity low), the mute button, and floating sign labels on crossings.
    - `pause()` and `resume()`, which clear holds.
    - `stats`: `{toolUses:{[toolId]:n}, breaths, early, earlyOf, tookOver, instinctChoices, calmChoices, trustDelta, mealsKept, injured, repaired}`.
  - `moment.js` → `createMoment(scenario, shell)` → `{update(dt), draw(), done, result}`.
    - Phases: `arrive → live → resolve → card → gap → done`.
    - The scenario provides `{id, kind:'moment', meters:[instinct…], primary, actors:{who, enter, sp}, triggers:[{at, meter, spike, simmer, intro, hint, who}], choices:[{k, label, col, instinct?:true}], outcomes:{[k]:{line, trust?, injure?, meat?, hurtPack?, anim}}, oneThing?:{targets}, distractions?:[…], strength?}`.
    - Anims: `charge, stand, retreat, ally, bolt, shelter, lead, help`.
    - Rules from Global Constraints: calm trust, lock, takeover forces the `instinct:true` choice, `meter.adapt()` and gap ×1.8. Early-catch counts if the first tool use happened below 0.55 or the peak stayed below 0.55.
    - The gap ends when the primary meter is below 0.35 after 2.5 s, or after a 12 s / 22 s timeout as in the prototype (×`difficulty.gapMul`).
    - Outcome card copy follows the prototype's `resolveDone`, with the scenario's signs inserted.
  - `repair.js` → `createRepair(shell, {who:'nip'})` is the prototype's repair scene: MAKE PEACE gives +1 trust and `repaired`, NOT YET is neutral.

- [ ] **Step 1: Write failing tests.**
  - `scene.test.js`: a card tap within 0.7 s doesn't dismiss, after 0.7 s it does. `pause()` clears held tools, and `resume()` shows a "Tap to continue" card. A Space hold drives the longExhale tool. Keys 1–4 map to choices.
  - `sim/moment.test.js` runs the prototype's three Rage scenarios with these policies (copied from the spec's review):
    - `calm`: breathe at the first sign, choose stand. Expect +1 trust per scene and `early === 3`.
    - `lazy`: never breathe, choose walk immediately (meter below lock). Expect 0 trust per scene when the meter is above 0.55 at choice.
    - `neverBreathe`: no input. Expect takeover in every scene, no exceptions, and the scene still reaches `done`.
    - `alwaysAttack`: expect −1 per scene and a repair offered after the leg.
    - `learnsAfterTakeover`: one takeover, then calm. Expect slower simmer afterwards and that the next trigger alone never fills the meter.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement by porting the prototype's `updEvent`/`choose`/`resolveDone`/`drawScene`/`drawPanel` into shell + moment, generalised to the scenario data. Wire `visibilitychange` in `app.js` to `shell.pause()` and `audio.suspend()`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: scene shell and moment kind`.

### Task 6: Profiles, home, signs, Den, plan card, runner and Chapter 1, end to end

**Files:**
- Create: `src/ui/profiles.js`, `src/ui/home.js`, `src/ui/signs.js`, `src/ui/den.js`, `src/ui/plancard.js`, `src/play/runner.js`, `src/data/signs.js`, `src/data/chapters/index.js`, `src/data/chapters/1-rage.js`
- Test: `tests/unit/chapters.test.js`, `tests/unit/runner.test.js`, `tests/e2e/chapter1.spec.js`

**Interfaces:**
- Consumes: store, progress, session, shell, moment, repair.
- Produces:
  - Chapter data schema (used by every chapter file): `{n, id, title, place, instinct, tool, mentor:'scar'|'echo', theme, season, strength, intro:{title, sub, body}, toolCard:{title, sub, body}, practice:{kind, startValue, line, …}, legs:[['teach','test'], ['mix','big']], scenarios:{test:[S, S, S], mix:[S…], big:[S]}, repair:true|false, den:{questions:[string], mission, phrase, planSteps:[{head, lines, col}], strengthLine}, coach:{say:[], avoid:[], alongside}}`. Question strings may use `{sign1}` and `{raptor}`.
  - `data/signs.js`: `SIGN_OPTIONS = {rage:[the prototype's 8], overload:[8], drift:[8], fuel:[8], urge:[8]}`. The new lists come from Tasks 7–10. `signOptionsFor(profile, instinct)` appends the custom signs.
  - `runner.js` → `runLeg(app, profile, chapterN, legIndex)` and `runHunt(app, profile, chapterN)`. A leg plays its beats in order. `teach`: intro card (first leg only), signs screen (if this instinct has no signs yet), tool card, practice. `test`: three scenarios with gaps. `mix`. `big`. Then the optional repair, then `den`. The runner checks `session.capReached` only between scenarios and wraps up with Scar's line "The sun's going down. That's enough hunting for today." Adaptivity: three calm scenes in a row (no instinct choice, no takeover) give `gapMul 0.6, spikeAdd 0.05`. After a takeover, Scar prompts at the first sign in every later scene of the session. It produces the session `stats` passed to the Den and `recordSession`.
  - `ui/den.js` → `showDen(app, profile, {chapter, stats, legDone, chapterDone})`. It shows field notes in neutral words (prototype rows plus tool uses), Scar's question with an optional text answer and a "Share with grown-ups" toggle (off by default), the plan card button, and the outside mission when the chapter is done ("Tell a grown-up when you've done it"). It also shows the trophy shelf, the strength line, and Change signs / Back to the valley.
  - `ui/plancard.js` → `showPlanCard(app, profile, chapterN)`: the prototype's MY RAGE PLAN layout for any chapter, a Print button (`window.print()`, print CSS shows only the card), and "For grown-ups" with the phrase.
  - `ui/profiles.js`: "Who's playing?" lists profiles as large tiles with a raptor preview, plus "+ New player". New player asks for the child's name, the raptor's name (default "Raptor") and the rim colour from `RIMS`.
  - `ui/home.js`: a canvas valley scene behind the DOM showing the player's raptor (appearance, rank) in the current chapter's theme. It lists the six chapters with places and open/locked/done state, a Play button (next leg), "Hunt" on done chapters, the Den, a small "Grown-ups" link and "Switch player". When `restRemaining > 0` it shows "Scar is resting. Back in N minutes." instead of Play.

- [ ] **Step 1: Write failing tests.**
  - `chapters.test.js` runs for every chapter in `CHAPTERS`. Every scenario has a known kind, its primary meter is in `meters`, and every choice has an outcome. Exactly one choice is `instinct:true` in moment scenarios. There are three den questions, plus a mission, phrase and coach tips. No copy string matches `/\b(bad|naughty|stupid|lazy|silly boy|wrong with you|failure)\b/i`.
  - `runner.test.js`, with fake shell timing: a leg reaching its end calls `completeLeg`. A cap reached mid-scenario waits for the card before wrapping up. A cap never interrupts a breath. A `hurtPack` outcome in a leg triggers repair. Three calm scenes switch on the faster difficulty.
  - `chapter1.spec.js` on a phone viewport with `?speed=8&debug=1`: create a profile, pick 3 signs, finish practice by holding then releasing the breathe tile, play the three scenes choosing STAND TALL after breathing, reach the Den, check that field notes show "Caught it early", and open the plan card. Zero console errors.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. `1-rage.js` carries the prototype's copy verbatim for intro, tool card, choose card, the three test scenarios and repair.
  - Mix `squabble`: Nip pesters and, before you've settled, Fang arrives. Two triggers 6 s apart, spike 0.25 each, simmer 0.05.
  - Big `the-challenge`: Fang challenges you for the feast in front of the whole pack. Spike 0.45 (capped), simmer 0.07, the same four choices. Calm outcomes earn the line "The whole pack saw you keep your head."
  - Den questions: "When did you feel {sign1} this week? What happened just before?", plus two more in the same style.
  - Mission: "Use one Long Exhale before reacting this week."
  - Coach tips: the spec's phrase, "breathe out together", and avoid "calm down".
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: profiles, valley, Den and playable Chapter 1`.

### Task 7: Chapter 2, The Stampede Plains (Overwhelm, One Thing)

**Files:**
- Create: `src/data/chapters/2-overwhelm.js`
- Modify: `src/data/signs.js`, `src/engine/kinds/moment.js` (oneThing targets and weather hooks if needed)
- Test: `tests/sim/chapter2.test.js`, `tests/e2e/chapters.spec.js` (smoke: each chapter's scenes load via `__apex.goto(n, beat, i)`)

**Interfaces:**
- Consumes: the chapter schema, moment kind, the oneThing tool.

Content (mentor Echo, theme `dust`, instinct `overload`, the instinct choice is BOLT):
- Signs: Covering ears, Everything too loud, Want to hide, Can't think, Snapping at people, Frozen, Want to run, Teary eyes.
- Echo's intro: your senses never switch off, which is why you hear prey first, and when everything comes at once there's a way through.
- Teach practice: a calm meadow where you do One Thing once (meter starts at 0.4).
- Test:
  - `stampede`: herd rumble, dust, shake. Choices: BOLT, FOLLOW ECHO, HIGHER GROUND, WAIT IT OUT.
  - `thunderstorm`: rain, lightning flashes, thunder SFX on a timer.
  - `pack-hunt`: calls of "LEFT!", "GO!", "WAIT!" pop up as text bursts.
  - One Thing targets per scene: cover = a rock or fern, see = 3 objects, hear = 3 pulsing sound icons tied to SFX, feel = "ground under your feet", "rain on your scales", "wind".
- Mix `storm-and-nip`: thunderstorm while Nip shrieks. Meters overload + rage, and both tools are on the belt.
- Big `the-crossing`: a stampede at the river with Nip stranded. Choices include LEAD NIP TO COVER (anim `lead`), which gets the strength line "Your sharp senses found the gap in the herd."
- Den: mission "Try One Thing once this week when it gets loud." Phrase "Too much at once? One Thing."

- [ ] **Step 1: Write failing tests.** `chapter2.test.js` runs the sims. `calm` uses One Thing at the first sign, then a calm choice, and earns trust in every scene. `neverAct` reaches takeover → BOLT, the scene still ends, and the card's copy names a next step. In the mix, using only Long Exhale lowers overload at ×0.25, so the sim asserts that One Thing is needed for an early catch. Add the chapter 2 cases to `chapters.spec.js`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement the data plus any moment-kind hooks it needs (weather overlays, call bursts).
- [ ] **Step 4:** Run the tests. Expected: PASS, including `chapters.test.js` for the new data.
- [ ] **Step 5:** Commit `feat: chapter 2 Stampede Plains`.

### Task 8: Track kind and Chapter 3, The Fern Maze (Distraction, Park It)

**Files:**
- Create: `src/engine/kinds/track.js`, `src/data/chapters/3-distraction.js`
- Modify: `src/data/signs.js`, `src/ui/den.js` (Parked finds)
- Test: `tests/sim/track.test.js`, extend `tests/e2e/chapters.spec.js`

**Interfaces:**
- Produces: `createTrack(scenario, shell)`. The scenario is `{kind:'track', meters:['drift'(, 'rage')], primary:'drift', prints:N, fadeSec, distractions:[{at, id, type:'beetle'|'butterfly'|'amber'|'call'|'nip', simmer, find:{name, line}}], triggers?, onTakeover:{line}, success:{line, trust}}`.
- Mechanic:
  - Glowing footprints run ahead. Tap the next glowing print to advance; that's the task. A print fades after `fadeSec`. Missing three in a row means "trail going cold" and Echo re-marks it, with no failure.
  - A distraction appears and shimmers. While it's unparked, drift simmers at its rate. Drag it to the SCENT MAP slot (top-left) to park it (parkIt tool).
  - Above LOCK, prints dim to 30% alpha (you can't think straight).
  - Takeover: the raptor wanders to the distraction, the trail is lost and the hunt fails for the pack (trust 0, no meal). Echo brings you back kindly.
  - Success: you reach the end. Trust +1 if drift stayed below 0.55 at each park.
  - After the scene, the parked finds can be explored on the Den's "Parked finds" list, each with a strength line ("Noticing what others miss is a tracker's gift"). They're saved to `profile.parked`.
- Content (mentor Echo, theme `ferns`):
  - Signs: Staring off, Fiddling with things, Missing what people say, Wanting to check something else, Bored and fidgety, Losing my place, Thinking about something else, Daydreaming.
  - Test: `trail-one` (2 decoys), `trail-two` (3 decoys, shorter fade), `nip-pesters` (Nip as a distraction, parked with "Not now, Nip. After the hunt.").
  - Mix: `fang-in-the-ferns` (drift + rage; Fang taunts while you track).
  - Big: `lost-hatchling` (track Nip's trail at dusk, many decoys including a glowing amber).
  - Den: mission "Park one distracting thing this week: say 'later', and come back to it after." Phrase "Park it."

- [ ] **Step 1: Write failing tests.**
  - `track.test.js`: tapping prints in order advances. Tapping a decoy instead of dragging it doesn't park it. Parking stops that decoy's simmer. Ignoring all decoys with no parks leads to takeover and a failed hunt, but the scene still completes with a kind card. Above lock, prints report `alpha 0.3`.
  - The calm-policy sim earns trust on all three test trails.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. Draw ferns from `THEMES.ferns` with parallax as the raptor advances.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: track kind and chapter 3 Fern Maze`.

### Task 9: Run kind and Chapter 4, The River Run (Energy, Burst & Rest)

**Files:**
- Create: `src/engine/kinds/run.js`, `src/data/chapters/4-energy.js`
- Modify: `src/data/signs.js`
- Test: `tests/sim/run.test.js`, extend e2e

**Interfaces:**
- Produces: `createRun(scenario, shell)`. The scenario is `{kind:'run', meters:['fuel'(, 'overload')], primary:'fuel', distance, target:{type:'prey'|'pack', pattern:[{sec, speed}]}, restStops?:[{at, prompt}], triggers?, success, fail}`.
- Mechanic:
  - Hold anywhere on the scene, or Space, to sprint (burstRest run mode). The world scrolls by speed, and the gap to the target shows as a distance bar.
  - Above LOCK, sprinting gives no extra speed ("running on empty").
  - Takeover: burnout, so the raptor lies down for 4 s while the target pulls away. The scene continues and can still be finished, but more slowly.
  - Rest stops (migration) show a real movement prompt using burstRest break mode.
  - Success: you catch the prey or keep up with the pack. Trust +1 if fuel never reached the second sign.
- Content (mentor Scar, theme `river`):
  - Signs: Can't sit still, Bouncing legs, Talking super fast, Getting giddy, Can't stop, Too wound up to sleep, Bumping into things, Loud and fast.
  - Teach practice: three bursts and rests along the bank.
  - Test: `first-chase` (short sprint prey), `zigzag` (prey alternates bursts, so pacing wins), `winding-down` (a moment kind with fuel: after the hunt the pack beds down and you're buzzing. Choices: KEEP RUNNING ABOUT (instinct), MOVEMENT BREAK THEN LIE DOWN, LONG EXHALE, ASK SCAR. This is the bedtime bridge).
  - Mix: `storm-on-the-river` (run + overload trigger).
  - Big: `the-long-migration` (a long run with the pack; Nip tires, and slowing down to stay with him earns the strength line).
  - Den: mission "Try one burst and rest during homework this week: work hard for a bit, then a movement break." Phrase "Burst and rest."

- [ ] **Step 1: Write failing tests.**
  - `run.test.js`: an always-sprint policy burns out (takeover) before the distance on `zigzag` and still completes. A burst-3 s/rest-2 s policy finishes without burnout and earns trust. Above lock, sprint speed equals trot speed. Burnout lasts 4 s.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement and tune the numbers so the two policies above pass.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: run kind and chapter 4 River Run`.

### Task 10: Ambush kind and Chapter 5, Ambush Ridge (Impulse, Wait for the Signal)

**Files:**
- Create: `src/engine/kinds/ambush.js`, `src/data/chapters/5-impulse.js`
- Modify: `src/data/signs.js`
- Test: `tests/sim/ambush.test.js`, extend e2e

**Interfaces:**
- Produces: `createAmbush(scenario, shell)`. The scenario is `{kind:'ambush', meters:['urge'(, 'rage')], primary:'urge', waves:[{at, peak, rise, fall}], twitches:[{at, spike}], falseSignals:[{at, who:'nip'}], signalAt, window:1.5, triggers?, success, early, fail}`.
- Mechanic:
  - Press and hold the STILL pad (thumb resting) to stay hidden. Urge follows the waves. While you hold through a wave's peak, it then falls (riding the urge). Twitches spike the urge (capped).
  - Releasing before the signal is a pounce too early: the prey flees, trust 0 and no meal. Scar says the urge passes if you let it peak.
  - The signal is Scar's tail flick, the `signal` SFX and a vibration. Tapping POUNCE within the window is success, +1 trust if urge stayed below 0.55 when the signal came. Missing the window is a gentle "a beat late", trust 0.
  - Takeover: urge full, so you burst out on your own.
  - The waves are tuned so holding alone never reaches 1 (the "never fills alone" rule).
- Content (mentor Scar, theme `moon`):
  - Signs: Want to blurt it out, Can't wait, Grabbing things, Jumping in, Interrupting, Fidgety hands, Butterflies, Have to do it NOW.
  - Test: `the-lookout` (a hadrosaur herd with a lookout), `false-signal` (Nip chirps, which isn't the signal), `long-wait` (a long wait with three waves).
  - Mix: `fang-taunts-the-hide` (urge + rage).
  - Big: `the-shadow-passes`. The tyrannosaur sniffs past you; stay still until Scar's cue to move. Success line: "Waiting was the bravest thing in the valley tonight."
  - Den: mission "Wait for the signal once this week: count to 5 before you jump in." Phrase "Wait for the signal."

- [ ] **Step 1: Write failing tests.**
  - `ambush.test.js`: a hold-until-signal-then-tap policy succeeds. Releasing at the first wave peak gives `early`. Tapping on Nip's false signal counts as early. With holding only and never tapping, urge stays below 1 and the outcome is "late", not takeover. A twitch plus a wave peak never exceeds the 0.92 cap from a single spike.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: ambush kind and chapter 5 Ambush Ridge`.

### Task 11: Chapter 6, The Burning Valley (finale) and the teach-Nip beat

**Files:**
- Create: `src/data/chapters/6-finale.js`, `src/engine/kinds/teachNip.js`
- Modify: `src/play/runner.js` (finale ending sequence), `src/ui/home.js` (Apex state after the finale)
- Test: `tests/sim/finale.test.js`, extend e2e

**Interfaces:**
- Produces:
  - `createTeachNip(shell)`: for each tool on the belt, you do it once while Nip copies it in silhouette, with Scar's line "Teaching it is how you know you've got it." This locks the skills in, per the spec.
  - Finale scenarios use the existing kinds with `chooseTool:true`. The whole toolbelt shows and no tile pulses as a hint. Scar says "Which tool does this moment need?"
- Content (theme `ash`, all instincts):
  - Teach: Scar's speech "I can't tell you which tool any more. You know your own brain.", a review of your signs (with an option to change them), then teach-Nip.
  - Test: `eruption` (moment, overload), `lava-stones` (ambush: wait for each stone to settle), `the-run-out` (run, fuel).
  - Mix: `panic-at-the-ridge` (moment: Nip grabs your tail while Fang shoves past, rage + overload).
  - Big: `fang-is-trapped`. Moment, rage. Fang is pinned under a burning log and snarls at you. Choices: ATTACK (instinct), LEAVE HIM, HELP HIM (anim `help`), GET SCAR. A calm HELP HIM gets "Fang stares at you. Then he lowers his head. The pack follows you out."
  - Ending sequence: a season-change card, the raptor at full growth, rank Apex if the help was calm, and a final card from Scar.
  - Den: final question "Which tool is your favourite, and when will you use it next?" Mission "Teach a grown-up your favourite tool." Phrase "Which tool do you need?"

- [ ] **Step 1: Write failing tests.** `finale.test.js`:
  - A policy using the matching tool per scene earns trust in all of them.
  - A wrong-tool policy relieves at ×0.25 and is more likely to reach takeover, but every scene still completes.
  - A calm HELP HIM sets the `finaleCalm` flag and `rankFor(...).name === 'Apex'`.
  - teachNip completes after each tool is done once.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: chapter 6 Burning Valley finale`.

### Task 12: Grown-ups mode

**Files:**
- Create: `src/ui/grownups.js`
- Modify: `src/ui/home.js`, `src/ui/profiles.js` (entry points), `styles.css`
- Test: `tests/e2e/grownups.spec.js`, `tests/unit/grownups-model.test.js` (pure helpers exported from grownups.js: `weeklyLogSummary(log, now)`, `profileOverview(profile)`)

**Interfaces:**
- Consumes: store (PIN, profiles, log, export/import), CHAPTERS (coach tips, plan cards).
- Produces: `showGrownups(app)`.
  - First visit asks you to set a 4-digit PIN (entered twice). After that, the PIN is needed to enter. Forgot PIN shows a two-digit multiplication; answering it lets you set a new PIN.
  - A child picker sits at the top. Tabs:
    - **Overview**: signs per instinct, tool uses, takeovers, early catches, sessions (date, chapter, minutes), rank, Den answers marked shared (only those), and a storage warning if `persistent` is false.
    - **Missions**: confirm "done-told" missions, which awards the trophy.
    - **Signs**: add or remove custom signs per instinct.
    - **Plan cards**: print any finished chapter's card.
    - **Settings**: session length (10/15/20/30), chapters open (toggle each), sound, vibration, reduced motion, intensity (normal/low), large text, clear rest timer.
    - **Coach**: per-chapter say / avoid / do-it-alongside.
    - **Log**: one-tap rows. Pick the instinct, then Used it / Used it unprompted / Didn't land. Below that, a table of the last 8 weeks by outcome.
    - **Data**: export a backup (downloads JSON), import a backup, rename or delete a player (confirm by typing the name), change PIN.
  - `weeklyLogSummary` returns 8 rows `{weekStart, used, unprompted, didnt}`, newest first.

- [ ] **Step 1: Write failing tests.**
  - unit: `weeklyLogSummary` buckets entries by ISO week, shows weeks with no entries as zeros, and returns 8 rows. `profileOverview` excludes unshared Den answers.
  - e2e: set a PIN, leave, a wrong PIN is refused, the right one is accepted. Confirming a mission shows a trophy in that child's Den but not in the other child's. Setting session length to 10 is saved for that child only. Reduced motion stops the screen shake (check via `__apex` state).
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. Apply the settings live: `configureAudio`, the shell reading `reducedMotion`/`intensity`, and a `largeText` class on `<html>` (DOM text at 120%, canvas message and card fonts +2 px).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: grown-ups mode`.

### Task 13: Hunts, PWA install and offline, cross-device pass

**Files:**
- Create: `manifest.webmanifest`, `sw.js`, `icons/icon.svg`, `scripts/make-icons.mjs`, `tests/e2e/devices.spec.js`
- Modify: `src/play/runner.js` (`runHunt`), `src/ui/home.js`, `index.html`, `src/main.js`, `playwright.config.js` (projects: `phone` = iPhone 13, `tablet` = iPad (gen 7), `desktop` = 1280×800), `README.md`

**Interfaces:**
- Produces:
  - `runHunt(app, profile, n)` plays 2 random scenarios from that chapter's test + mix pools with the current difficulty, then a Den (field notes only, no mission). The home button reads "Hunt (5 min)". There's no daily counter or streak anywhere.
  - `sw.js` is cache-first over an explicit file list with a `CACHE = 'apex-v1'` version string. Old caches are deleted on activate. The manifest is portrait, standalone, theme `#0a0508`, with icons 192/512 and maskable.

- [ ] **Step 1: Write failing tests.** `devices.spec.js` runs on all three projects:
  - Boot creates two profiles; play the chapter 1 teach practice as child A; switch to child B and confirm B is still at chapter 1, leg 0, with no signs (Review Focus 3).
  - Resize the viewport mid-scene and confirm no errors and the breathe tile still works (Review Focus 4).
  - Emulate `visibilitychange` to hidden mid-breath and confirm on return it's paused with no held breath (Review Focus 1).
  - Go offline after the first load, reload, and confirm the app still boots.
  - A Hunt is offered only on a done chapter.
- [ ] **Step 2:** Run `npm run e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement. Draw the icon as a raptor head silhouette with the rim light over a dusk gradient. `npm run icons` writes the PNGs. README gets "Put it on a tablet": GitHub Pages steps (push the repo, enable Pages from the main branch root, open the URL on the tablet, Share → Add to Home Screen). It also notes that Safari can clear the data of sites that aren't on the Home Screen, so install it and use Grown-ups → Data → Export now and then.
- [ ] **Step 4:** Run `npm test && npm run e2e`. Expected: PASS on all three projects.
- [ ] **Step 5:** Commit `feat: hunts, installable offline app, device pass`.

### Task 14: Whole-game balance and copy pass

**Files:**
- Create: `tests/sim/whole-game.test.js`
- Modify: chapter data files as the findings require

- [ ] **Step 1: Write the test.** The sim plays every chapter's two legs with five policies (calm, lazy, neverAct, alwaysInstinct, learnsAfterTakeover), using the matching tool where the policy acts. It asserts:
  - Every scene in every chapter reaches `done` for every policy (no soft-locks).
  - Calm earns trust in at least 80% of scenes.
  - neverAct is never shown a card with an empty next step.
  - No single trigger ever fills a meter.
  - The total simulated play time per leg is between 3 and 10 minutes (spec: sessions of 5 to 10 minutes; a leg plus the Den should land there).
- [ ] **Step 2:** Run `npm test` and fix the data until it passes.
- [ ] **Step 3:** Read every copy string in `src/data/chapters/*.js` against the spec's guardrails: no shame, Scar's lines short, no preaching where a consequence already makes the point. Fix as needed and re-run the tests.
- [ ] **Step 4:** Commit `chore: balance and copy pass across all chapters`.

---

## Builder's calls made in this plan (for review)

- localStorage instead of IndexedDB. A 60-minute rest after the session cap. The rank thresholds.
- Each leg is one session: leg 1 = teach + test, leg 2 = mix + big + the full Den with the mission.
- A unified toolbelt. Every tool is also usable as a short overlay in any scene, so Mix and the finale's "choose your tool" work everywhere. The wrong tool relieves at ×0.25.
- Rim-light colour as the raptor customisation (from the spec's open question). Each child picks one of five.
- Chapter 1's Mix has no earlier tools to mix, so it mixes triggers instead, per the spec's "triggers come faster and get mixed together".
- Forgot-PIN recovery by multiplication question. Export/import backup in Grown-ups.
- Heart-rate sensor, recorded voice and accounts are out of scope (spec open questions).
- Pack trust changes Nip's lines only: when trust is below 0, Nip arrives warier, using a `wary` copy variant in the moment kind. Trust does not lock or unlock scenes, since all scenes are reachable.
- Music swelling when a moment is handled well is the `SFX.good` sting plus a short pad chord on calm outcome cards (Task 5).
- Above shared Den answers, Grown-ups Overview always shows one line: "If an answer worries you, talk with them, and with a professional if needed." (Spec: big disclosures.)
