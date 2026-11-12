

# Apex — Game Design Document
2026-11-12 · @James

## Vision and goals
Apex is a 2D survival game where a young raptor learns to master its instincts. Every tool it uses is a real coping skill the player can use at home and at school.
It is built first for one player: a 9-year-old with ADHD who loves dinosaurs and video games. It should feel like a game older kids play, not a lesson.
What should change in real life
- He can name his own warning signs for rage, overwhelm and distraction.
- He uses a named tool (for example the Long Exhale) when prompted, and sometimes without a prompt.
- Home and school share one language for hard moments.
- He sees his ADHD traits as strengths he can aim, not flaws.
Not goals: a treatment, a diagnosis, a replacement for clinical support, or a game built to maximise screen time.
| Measure | Target after 8 weeks | How we'll know |
| --- | --- | --- |
| Names his own signs | Can list his 3 rage signs unprompted | Ask him at dinner |
| Uses a tool when prompted | At least once a week | Fridge tally for now; Grown-ups mode log later |
| Uses a tool unprompted | At least once | Fridge tally for now; Grown-ups mode log later |
| Wants to play | 2 to 3 sessions a week, no nagging | Session history |

## Design principles
The rule that matters most: the move in the game is the move in real life. The rest support it.
- The game move is the real move. Every tool is something he physically does, like a real slow breath or noticing three things. It is never just a button press.
- His body, not the raptor's. He chooses his own warning signs, and the game shows them on screen as the meter rises.
- Every chapter has a bridge. Each one ends with a real-world question, a plan card and a phrase for grown-ups.
- The feeling is never the problem. Rage tells him something matters. The game trains what he does with it, not feeling less. Scar says so in his first speech.
- Consequences, not punishment. Lashing out costs trust, injury or food. The game never says he is bad. Failure screens are kind and name one specific next step.
- Repair is a skill. After a blow-up there is always a way to make it right, and the game rewards taking it.
- Strengths, not deficits. Every instinct has an upside (sharp senses, speed, energy, passion) that the game rewards when he aims it.
- A grown-up feel. Silhouettes, real stakes, a mentor instead of a cartoon. No cute talking animals.
- Short and finite. Sessions of 5 to 10 minutes with natural endings. No streaks, no pressure to come back daily.
- Same tool, new situations. Each skill is practised across many scenarios so it carries over beyond one scene.

## World and characters
The game is set in the Late Cretaceous, around a raptor pack living in a volcanic river valley. The player grows from a restless young outsider into the pack's leader.
| Character | Who they are | What they stand for |
| --- | --- | --- |
| The player (he names them) | A young raptor whose senses never switch off. The pack says he's too impatient to hunt. | Him. The story arc runs from outsider to leader. |
| Scar | The old pack leader. He had the same restless brain and nearly lost everything to rage. | A grown-up who gets it. He teaches every tool. |
| Nip | The youngest in the pack. Pesters, grabs and copies. | Little-sibling energy and small everyday triggers. Later the player teaches Nip, which locks the skills in. |
| Fang | A rival from another pack who winds the player up on purpose. | People who push buttons deliberately. He comes back across chapters, and the finale gives him a chance to change. |
| Echo | The pack's tracker. Calm, and notices one thing at a time. | A second mentor for the Overwhelm and Distraction chapters. |
| The Shadow | A tyrannosaur that hunts the valley. | Real outside danger, saved for the late chapters and the finale. |
Places, one per chapter: the Feeding Ground (Rage), the Stampede Plains (Overwhelm), the Fern Maze (Distraction), the River Run (Energy), Ambush Ridge (Patience) and the Burning Valley (finale).

## Game structure and core loop
There are six chapters, each about one instinct. Each is played in short sessions that end in the Den, and the Den links the game to real life.
When an instinct takes over, the tool and choice steps are skipped: the instinct chooses for him, then the consequence and the Den follow as usual.
Each chapter runs in five beats
- Teach: Scar introduces the instinct and its tool. He chooses his warning signs and practises the tool while calm.
- Test: Three scenarios that get harder, like the current Rage prototype.
- Mix: Scenarios that need tools from earlier chapters as well.
- Big moment: One high-stakes scene that ends the chapter.
- Den: Field notes, Scar's question, the plan card and an outside mission.
Progression
- Seasons pass between chapters. The raptor grows in size and feathers, and keeps any scars from fights.
- Pack rank rises with Pack Trust: Hatchling, Runner, Hunter, Tracker, Elder, Apex.
- The Den fills with trophies (a fossil, a feather, a tooth), each earned from a real-world mission a grown-up confirms.
- Once a chapter is done, short daily Hunts remix its scenarios for 5-minute practice.

## Chapters
Each chapter teaches one instinct, its upside, and one tool that works the same way in the game and in life. Rage is already a working prototype. The earlier Hunt prototype (scan, stalk, chase) gives the starting mechanics for chapters 3 to 5.
| # | Chapter | Instinct and its upside | Tool (game = real life) | Scenarios in the game | Where he uses it |
| --- | --- | --- | --- | --- | --- |
| 1 | The Feeding Ground | Rage: passion, standing up for yourself | Long Exhale: notice your signs, breathe in for 3 and out for 5, then choose: stand tall, walk away or get help | Nip grabs your meat; Fang taunts you; Fang steals your kill | Rows with siblings, losing a game, being wound up |
| 2 | The Stampede Plains | Overwhelm: sensing everything | One Thing: get to cover, notice 3 things one at a time (see, hear, feel), then pick one next step | Stampede, thunderstorm, a pack hunt with too many calls at once | Busy classrooms, noisy places, too many instructions |
| 3 | The Fern Maze | Distraction: noticing what others miss | Park It: mark the interesting thing on the scent map and come back to it after the task | Tracking a trail past shiny decoys; Nip pestering mid-hunt | Homework, listening in class |
| 4 | The River Run | Energy: speed and hyperfocus | Burst & Rest: go hard in short bursts, then recover; movement breaks | Chases, a long migration up the river | Homework sprints, winding down after school, bedtime |
| 5 | Ambush Ridge | Impulse: explosive action | Wait for the Signal: feel the urge, ride it out, act on the cue | Stalking under the lookout's gaze; holding position until the pack's signal | Waiting his turn, blurting out, interrupting |
| 6 | The Burning Valley | All of them: knowing your own brain | Choose your tool: he decides which tool each moment needs | The volcano erupts; he leads the pack out; Fang is trapped and needs help | Everyday life, steering his own brain |

## Core systems
Every instinct uses the same meter so the pattern carries over: signs, a lock line and a takeover point. The Rage meter in the prototype is the template.
Instinct meters
- One meter per instinct: Rage, Overload, Drift, Fuel and Urge.
- Each shows his 3 warning signs as markers. Past the lock line, calm choices grey out. When the meter is full, the instinct takes over.
- Heartbeat, growl and red at the screen edges rise with the meter, so he feels it as well as sees it.
Warning signs
- For each instinct he picks 3 signs from a list, or types his own with a grown-up.
- Signs show on the meter and float above the raptor when crossed. He can change them in the Den at any time.
Tools are performed, not pressed
| Tool | What he actually does in the game |
| --- | --- |
| Long Exhale | Holds to breathe in for 3, releases and breathes out slowly for 5. The meter only drops on the out-breath. |
| One Thing | Taps one thing he sees, then one he hears, then one he feels. After that he picks a single next move. |
| Park It | Drags the distraction onto the scent map. After the task it can be explored. |
| Burst & Rest | Sprints in bursts and lets go to recover. Constant sprinting always burns out. |
| Wait for the Signal | Holds still while the urge meter rises, then acts on the cue. |
Tools stay on his toolbelt once learned, so later chapters can mix them.
Locked choices and takeover
- Above the lock line he can only lash out. That teaches that you can't think straight until you're calmer.
- When the meter fills, the instinct chooses for him. Scar names the signs he missed. It is never game over: there is always a consequence and another go.
Consequences
- Pack Trust, injuries and food carry forward. They affect his rank, which scenes open up, and how Nip treats him.
- Calm is stronger. Any calm choice (stand tall, walk away, get help) earns trust, but only if he makes it below his second warning sign. Made while still hot, it works but earns nothing, and Scar suggests one more breath.
- No winning by fighting. Attacking never lowers the meter. Scar points out the rage is still there and waits while he breathes.
- Repair. After any attack, Nip comes back wary. He can make peace (trust returns) or choose "not yet". Neither is punished.
- Always a moment to act. A trigger can never fill the meter by itself, so he always gets a chance to breathe.
Field notes
- End-of-session stats in neutral words, like "caught it early: 2 of 3". They are never scores to beat.
Adapts to him
- After a takeover: rage builds 40% more slowly for the rest of the session and the pause before the next trigger is longer (in the prototype now). Scar prompting earlier is still to build.
- Calm every time: triggers come faster and get mixed together.

## The real-world bridge
The skills only carry over if grown-ups use the game's words in the moment. This layer matters as much as the game itself.
Shared phrases
| Instinct | Grown-ups say | Instead of |
| --- | --- | --- |
| Rage | "Rage meter's rising. Long Exhale?" | "Calm down" |
| Overwhelm | "Too much at once? One Thing." | "Just focus" |
| Distraction | "Park it." | "Stop getting distracted" |
| Energy | "Burst and rest." | "Sit still" |
| Impulse | "Wait for the signal." | "Stop interrupting" |
The best prompt is the grown-up doing the tool with him, like breathing out together. Telling him to do it works less well.
The pieces
- Plan cards: One per chapter with his signs, his tool and his choices. Printed for the fridge and his school bag.
- Den questions: Each session, Scar asks one real question, such as "When did you feel hot face this week? What happened just before?" It works best with a grown-up beside him.
- Outside missions: One small real-world challenge per chapter, for example "Use one Long Exhale before reacting this week." A grown-up confirms it and he earns a Den trophy. Never tie it to screen time or money.
- School: Share the plan cards and the phrase list with his teacher or SENCo, so school uses the same words.
- Practise calm, use hot: The game is where he rehearses a tool while calm, so it's familiar when he's upset.

## Grown-ups mode
This is a PIN-locked area where parents (and later a teacher) support the bridge, see what he's practising, and set limits.
- See: The signs he chose, tools used, times an instinct took over, and missions done. His Den answers appear only if he chooses to share them.
- Do: Confirm outside missions, add custom warning signs with him, and print plan cards.
- Set: Session length (default 15 minutes), which chapters are open, sound and vibration, and reduced motion.
- Coach: Short tips for each chapter: what to say in the moment, what to avoid, and how to do the tool alongside him.
- Log: One-tap notes on real-life moments: phrase used, then whether he used the tool, used it unprompted, or it didn't land. These feed "How we'll know it works".
Version 1 has no accounts and keeps all data on the device.

## Art, audio and feel
Dark silhouettes against big skies, with sound tied to the meters. Tension comes from the heartbeat, not from gore.
- Look: Rim-lit silhouettes, layered scenery that scrolls at different depths, chunky readable shapes.
- Colour per chapter: Red dusk for Rage, brown dust storm for Overwhelm, deep green ferns for Distraction, blue dawn on the river for Energy, moonlight for Ambush Ridge, ash and lava for the finale.
- Voice: Scar speaks in short text lines marked with a claw. A recorded voice is optional later. No cartoon mouths.
- Sound: A heartbeat and growl that follow the meter, breathing sounds that pace the Long Exhale, wind in the background. Music swells only when he handles a moment well.
- Feel: Phone vibration on the heartbeat where supported. The screen shakes when a trigger hits.
- Violence: Hunting is implied. Fights are a dust cloud and a limp, with no blood.
- Accessibility: Large text, colour never the only signal, mute and reduced-motion options, controls that work one-handed on a phone.

## Wellbeing and safety guardrails
Apex supports his care. It does not replace it, and it should never become another thing that pulls him onto a screen.
- Clinician input: Before building each chapter, check its tool and wording with his clinician or SENCo, and use their names for tools if they already have them.
- Healthy play: Default 15-minute cap and natural stopping points. No streaks, loot boxes, ads or notifications pushing him to play.
- No shame: Copy is reviewed against one rule: describe what happened and what to try next, never what he is.
- Tools work without a screen: Every tool is body-based (breath, noticing, movement), so it works at school, in the car or in bed.
- Privacy: Data stays on the device. No third-party analytics, and nothing he types leaves the device.
- Big disclosures: If a Den answer reveals something serious, Grown-ups mode advises talking with him and a professional. The game does not try to handle it.
- Watch for stress: If the heartbeat or meter upsets him rather than engaging him, turn the intensity down in settings.
What the research says, and where Apex falls short of it
- The closest tested game is RAGE-Control from Boston Children's Hospital. In a small randomized trial (40 children aged 10 to 17, alongside anger therapy), the version driven by the child's real heart rate reduced aggression and oppositional behaviour more than a sham version (trial paper, hospital summary).
- The children did not report feeling less angry. What improved was control over how anger came out. That is the goal Apex sets too (principle 4).
- Two differences matter. That game read the body directly, and it ran inside therapy. Apex cannot tell whether he is really breathing, and it has not been tested on anyone.
- So treat Apex as practice and shared language, with a grown-up breathing alongside him. A heart-rate sensor is listed under open questions.

## Tech and build plan
Stay on the web for now and prove the Rage chapter with him before building more. Move to an engine only if the game outgrows the browser.
Where it stands: Two single-file HTML5 canvas prototypes that run in a mobile browser: Hunt 1 (scan, stalk, chase) and Chapter 1: Rage (signs, Long Exhale, locked choices, repair scene, plan card).
Platform: For version 1, an installable web app (PWA) on his tablet or phone: fastest to change, works offline, no app store. Godot 4 is the fallback if he needs richer animation, controller support or store distribution.
Architecture
- Scenarios as data (trigger, spike, simmer rate, choices, outcomes, Scar's lines), so adding a scene means writing JSON, not code.
- One shared instinct-meter component and one shared tool component, reused by every chapter.
- Save data in IndexedDB on the device. Grown-ups mode behind a PIN.
- Claude Code can draft new scenarios and art in parallel sessions, with you reviewing the wording against the guardrails.
Phases (durations are estimates for evenings and weekends)
The two gates are the real decisions. If he doesn't use the phrase at home after Phase 0, change the bridge before building more game. "Tools checked" means his clinician or SENCo has reviewed the next chapters' tools.

## How we'll know it works
Two questions: does he want to play it, and does anything change outside the game? Check both weekly for the first 8 weeks.
In the game (watch him play)
- Does he breathe when the meter climbs, or mash the attack button?
- Does he catch rage at his first sign more often over time? (The field notes track this.)
- Does he pick it up again without being asked?
- Where does he skip, rush or roll his eyes? Usually a sign Scar is too preachy.
At home and school (Fridge tally for now; Grown-ups mode log later)
- How often a phrase is used, and what happens: used the tool, refused, or used it unprompted.
- Look for a trend over 4 to 8 weeks, not perfection in any one week.
- Ask his teacher once a month whether the phrases come up at school.
Ask him
- "What would make it better?" Let him design a scenario or a character. Owning part of it keeps him invested.
Warning signs to act on
- The meter or heartbeat stresses him out: lower the intensity.
- He games the breathing without really doing it: pair it with a grown-up breathing with him.
- He finds it preachy: cut Scar's lines and let the consequences make the point.

## Review of the Rage prototype, 12 Nov
The review found seven problems. Six are fixed in the prototype and this doc; one (the game cannot verify a real breath) is still open.
| Problem found | What changed | Status |
| --- | --- | --- |
| Only Stand Tall earned trust, so walking away and getting help looked second-best | Every calm choice earns trust when made below his second sign | Fixed |
| He could skip breathing whenever the meter was under the lock line | A calm choice made while still hot earns no trust, and Scar suggests one more breath | Fixed |
| One takeover caused the next: rage stayed high and the next trigger filled the meter at once | Triggers can no longer fill the meter alone; after a takeover rage builds more slowly and the pause is longer | Fixed |
| Nothing happened after a blow-up | Repair scene with Nip, and a step 4 on the plan card: calm down first, then make it right | Fixed |
| Rage was framed as the enemy | Scar now opens with "Rage isn't bad. It tells you something matters to you." | Fixed |
| Long sign names overlapped on the meter; a stray tap could skip an outcome card | Labels sit in three fixed columns; cards ignore taps for the first 0.7 seconds | Fixed |
| The game cannot tell if he really breathes | Grown-up breathes alongside; heart-rate sensor to decide | Open |
Tested by simulated play styles only (calm, lazy, never breathing, always attacking, learning after one takeover). Not yet checked on a real phone or with him.

## Open questions
- Which strategies do his clinician and school already use, and should Apex use their names for them?
- Add a heart-rate strap or watch so calm is measured, not assumed? Needs Web Bluetooth, which iPhone and iPad browsers do not support, so it may force the move to a native app.
- Web app or Godot for version 1?
- Does he want to name and customise his raptor (colour pattern, feathers, a scar)?
- Should his 7-year-old sibling get their own profile, or is this just his?
- Recorded voice for Scar, or text only?
- Share plan cards with his teacher from the start, or after the first chapter lands at home?
- A family project only, or something to release for other families later?
