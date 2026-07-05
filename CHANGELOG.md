# Changelog

## Unreleased

Added:

- Vite React TypeScript infrastructure.
- Minimal React entrypoint under `app/`.
- Strict TypeScript configuration split into app and node configs.
- GitHub Actions build workflow.
- Pull request template.
- README with setup and working agreement.
- Initial domain types for goals, capabilities, exercises, equipment, muscle groups, and risk levels.
- Domain constants and readonly exercise metadata shapes for the model foundation.
- Typed workout planning model for plans, training days, sessions, blocks, and exercise prescriptions.
- First small typed Project45 exercise catalog covering GTO, core, hyperlordosis, pelvic floor, and endurance.
- First typed 7-day Project45 weekly seed plan with home, gym, running-focused, endurance, and test sessions.
- Today-first dashboard rendering the local-date training day from the Project45 weekly seed plan.
- Local completion tracking for Today exercises with day and session progress.
- Vitest setup with first domain and completion id unit tests.
- Exercise Library screen with mobile-first catalog rendering and goal/equipment filters.
- Week screen rendering all Project45 seed-plan days with current-day highlight and completion summaries.
- Local GTO weekly test tracking with latest results compared against Project45 targets.
- Daily recovery check-in with local tracking, latest entry display, and recent low-recovery warning.
- Pure TypeScript event model for workout, exercise, recovery, weight, goal, and GTO test history foundations.
- Deterministic pure TypeScript workout lifecycle state transitions for planned, started, paused, completed, and skipped workouts.
- Staff-level Project45 architecture document covering domain, engines, events, plugins, local-first design, tests, and roadmap.

Changed:

- Updated product naming and positioning to Project45.

Notes:

- The legacy `index.html` workout app is intentionally kept untouched.
