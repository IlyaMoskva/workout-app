# Project 45

Project 45 is the next version of the workout app. The current goal is to evolve the original single-file training PWA into a maintainable Human Performance OS.

## Current status

The React infrastructure is in place. The current branch starts the domain model with typed goals, capabilities, and exercises.

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
src/                 React source code and domain model
src/domain/          Typed domain model
.github/workflows/   CI workflow
index.html           Legacy single-file workout app, kept for now
```

## Domain model direction

Project 45 will treat exercises as knowledge objects, not as UI rows.

The first domain slice includes:

- goals
- capabilities
- equipment ids
- muscle groups
- exercise risk levels
- exercise metadata
- coaching cues and substitutions

Workout plans, progress, recovery, and real catalog data will come in separate focused PRs.

## Working agreement

- Small PRs.
- One focused issue per meaningful PR.
- README updates for setup, behavior, and architecture changes.
- CHANGELOG updates for meaningful product or architecture changes.
- CI must be green before merge.

## Next PRs

1. Workout plan model.
2. Project 45 exercise catalog and seed plan.
3. Today-first MVP UI.
4. Progress and recovery tracking.
