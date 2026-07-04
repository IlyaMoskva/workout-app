# Project 45

Project 45 is a local-first personal training system built from the original single-file workout app.

The immediate product goal is practical: prepare for an 8-week birthday target around GTO gold, endurance, pelvic floor control, hyperlordosis correction, core strength, and better body composition.

The engineering goal is broader: evolve the app into a maintainable Human Performance OS with a real domain model, offline-first UX, and reviewable architecture.

## Status

This branch introduces the React + TypeScript foundation.

The old `index.html` single-file PWA still exists in the repository history and should not be removed until the Project 45 MVP is usable enough for daily training.

## Tech stack

- Vite
- React
- TypeScript strict mode
- Local-first browser storage
- Mobile-first dark UI

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Architecture

```text
app/                 Vite HTML entry
src/app/             App shell and UI styles
src/domain/          Business/domain model
  exercises/         Exercise catalog and exercise model
  goals/             Goals and capabilities
  workouts/          Workout plan model and Project 45 seed plan
  progress/          Completion, GTO, and body metric models
src/shared/          Shared infrastructure such as storage
```

## Domain model

The app does not treat a workout as a flat list of exercises.

```text
WorkoutPlan
  -> TrainingDay
    -> WorkoutSession
      -> WorkoutBlock
        -> ExercisePrescription
          -> Exercise
```

Exercises are knowledge objects. They can have goals, capabilities, equipment, muscle groups, risks, instructions, regressions, progressions, and substitutions.

## Product principles

- Today-first UI.
- Several sessions per day: morning home, work break, evening gym/outdoor.
- Local-first privacy.
- No external analytics by default.
- Each exercise should explain why it exists in the plan.
- Generator logic should be deterministic and explainable before adding advanced intelligence.

## Current scope

Foundation PR:

- Vite + React + TypeScript setup.
- Domain types.
- Initial Project 45 exercise catalog.
- Compact Project 45 seed plan.
- Today, Week, Exercise Library, Progress placeholder.
- Local completion state.

## Roadmap

See GitHub issues for Sprint 0, MVP workflow, metrics/recovery, storage, and future generator work.
