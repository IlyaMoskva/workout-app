# Project 45

Project 45 is the next version of the workout app. The current goal is to evolve the original single-file training PWA into a maintainable Human Performance OS.

## Current status

This branch adds only the React infrastructure foundation.

The legacy `index.html` app is intentionally kept untouched. The new React app lives under `app/` and is used by Vite as the development/build root.

## Stack

- Vite
- React
- TypeScript
- GitHub Actions build check

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Project layout

```text
app/                 React HTML entrypoint used by Vite
src/                 React source code
.github/workflows/   CI workflow
index.html           Legacy single-file workout app, kept for now
```

## Working agreement

- Small PRs.
- One focused issue per meaningful PR.
- README updates for setup, behavior, and architecture changes.
- CHANGELOG updates for meaningful product or architecture changes.
- CI must be green before merge.

## Next PRs

1. Domain model: goals, capabilities, exercises, workouts, progress.
2. Project 45 exercise catalog and seed plan.
3. Today-first MVP UI.
4. Progress and recovery tracking.
