# Project45

Project45 is a local-first workout planning app for building a personal Human Performance OS. It evolves the original single-file training PWA into a maintainable React and TypeScript product.

## Current status

The React infrastructure and first domain model slices are in place, including typed goals, capabilities, exercises, and workout planning.

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

Project45 treats exercises as knowledge objects, not as UI rows.

The first domain slice includes:

- goals
- capabilities
- equipment ids
- muscle groups
- exercise risk levels
- exercise metadata
- coaching cues and substitutions
- workout planning types

Workout generation, progress, recovery, and real catalog data will come in separate focused PRs.

For the broader system design, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Working agreement

- Small PRs.
- One focused issue per meaningful PR.
- README updates for setup, behavior, and architecture changes.
- CHANGELOG updates for meaningful product or architecture changes.
- CI must be green before merge.

## Next PRs

1. Project45 exercise catalog and seed plan.
2. Today-first MVP UI.
3. Progress and recovery tracking.
