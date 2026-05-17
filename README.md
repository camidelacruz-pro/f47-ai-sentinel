# F-47 AI Sentinel

A browser-based arcade combat game inspired by classic asteroid shooters.

Fly an original F-47-inspired aircraft through twelve long escalating missions, collect AI powerups for drone support, grab EMP cores for instant shockwaves, activate shield cores when the fight gets dangerous, and answer unique debrief questions between levels to earn extra lives.

## Play

Open `index.html` in a browser, or run a local static server:

```sh
python3 -m http.server 4173
```

Then visit `http://127.0.0.1:4173`.

## Controls

- `W` / `Up`: thrust
- `S` / `Down`: brake
- `A` / `Left`: rotate left
- `D` / `Right`: rotate right
- `Space`: fire
- `Shift`: boost
- `E`: EMP
- `P`: pause
- `1`, `2`, `3`: answer debrief questions

## Gameplay

- Collect the AI artifact for 10 seconds of drone support.
- Collect floating EMP cores to instantly clear nearby enemies and missiles.
- Collect shield cores for a short protective barrier and a hull repair.
- Every level starts lighter, then gradually adds more enemies, faster spawns, tougher mixes, and more available superpowers.
- Complete each mission to unlock a 3-question debrief.
- Debrief questions are drawn from a 100-question bank without repeats during a run.
- Each correct debrief answer grants one extra life.
- Missions escalate from training drones to ground combat, mountain hazards, orbital asteroids, alien fleets, and a final singularity assault.
