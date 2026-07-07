# Project45 Roadmap

Project45 is a local-first Human Performance OS. The immediate goal is simple: make it useful every day for training, GTO preparation, recovery awareness, and habit consistency.

## Current status

### MVP 0.1 — Phone preview and dogfooding

Status: in use.

- Legacy app remains available at `/workout-app/`.
- Project45 preview is available at `/workout-app/project45/`.
- The next development cycle is driven by real daily feedback.
- Architecture Freeze v1 is active: no new architecture layers unless required by a user-facing feature.

## Product principles

- Daily-use first.
- Local-first by default.
- No cloud sync until privacy and migration rules are explicit.
- Training logic must remain deterministic and explainable.
- React is presentation only; business logic belongs in pure TypeScript.
- Apple Watch and Strava integration are required long-term, but not before the core mobile workflow is stable.

## Near-term roadmap

### MVP 0.2 — Daily training usability

Goal: Project45 replaces notes/manual tracking for daily workouts.

Focus:

- Today screen polish.
- Large mobile controls.
- Completion tracking that is obvious and reliable.
- Week view.
- Exercise library.
- Settings for active goals, equipment, and preferred session slots.
- Local workout history.
- Export/import backup.

Exit criteria:

- User can open the app on phone and train without thinking about navigation.
- User can mark exercises done quickly with one hand.
- Progress survives reloads.
- Legacy app remains untouched.

### MVP 0.3 — GTO preparation loop

Goal: Project45 becomes useful specifically for the 8-week GTO target.

Focus:

- GTO dashboard.
- Weekly GTO test logging.
- Latest result vs target gap.
- Running, push-up, pull-up, abs, and flexibility visibility.
- Recovery check-in.
- Basic warnings when training load and recovery look bad.

Exit criteria:

- User can see whether GTO readiness is improving.
- Weekly test data is easy to enter.
- Recovery state is visible before choosing hard training.

### MVP 0.4 — Plan adaptation v1

Goal: Start using the internal engine for practical, visible decisions.

Focus:

- Use settings in the planner.
- Respect available equipment.
- Respect session slots.
- Show simple substitution suggestions.
- Show rule/scoring explanations only where they help the user.

Exit criteria:

- If equipment or schedule changes, the plan output changes predictably.
- User can understand why a session was suggested.

## Integrations roadmap

### Apple Watch track

Apple Watch integration is required long-term, but should not be the next immediate task.

Likely phases:

1. Keep using Apple Watch and Strava for runs, hikes, heart rate, and outdoor activities.
2. Add manual import/export path first if practical.
3. Investigate Apple Health / HealthKit path for workout, heart rate, sleep, and recovery data.
4. Decide whether Project45 needs a native iOS/watchOS companion app.

Notes:

- A web PWA cannot directly behave like a full Apple Watch app.
- Real Apple Watch integration usually means iOS/watchOS development and HealthKit permissions.
- Strava is good enough for the first dogfooding phase.

### Strava track

Potential use:

- Import runs, hikes, and cycling/outdoor sessions.
- Use distance, duration, pace, elevation, and heart-rate zones if available.
- Avoid building this before local history and GTO dashboard are stable.

## Later roadmap

### v1.0 — Personal daily release

Goal: Stable daily-use app for one real user.

Focus:

- Smooth mobile UX.
- Stable local storage.
- Backup/restore.
- GTO loop.
- Recovery loop.
- Manual corrections.
- Clear limitations.

### v1.5 — Public portfolio release

Goal: Make the repository presentable as Staff/Principal-level engineering work.

Focus:

- Clean README.
- Strong ARCHITECTURE.md.
- Good tests.
- Screenshots or demo video.
- Issue hygiene.
- Changelog discipline.

### v2.0 — Adaptive planning

Goal: Project45 becomes an adaptive deterministic training planner.

Focus:

- Progression engine.
- Fatigue/load model.
- Better substitutions.
- Goal-specific plugins: GTO, climbing, hiking, hypertrophy, posture.
- Explainable plan changes.

### v3.0 — Human Performance OS

Goal: Expand beyond workouts.

Focus:

- Nutrition basics.
- Supplements.
- Sleep.
- Recovery trends.
- Apple Watch / HealthKit.
- Strava.
- Optional sync.

## Backlog policy

- Keep active open issues focused.
- Close completed umbrella issues once replaced by smaller tasks.
- Dogfooding bugs beat roadmap features.
- P0 daily-use friction is always higher priority than new architecture.
