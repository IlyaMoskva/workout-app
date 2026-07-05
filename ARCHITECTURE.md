# Project45 Architecture

Project45 is a local-first Human Performance OS. It is designed to grow from a typed training model into a deterministic training engine that can generate, evaluate, explain, and evolve personalized plans for GTO Gold, endurance, hiking, climbing, posture correction, hyperlordosis, pelvic floor, strength, and longevity.

The system is intentionally modest in implementation and ambitious in architecture. The core idea is simple: business logic should be pure, typed, deterministic, and independently testable. React is only a presentation layer.

## Vision

Project45 should become a personal operating system for human performance:

- Understand the athlete: goals, capabilities, constraints, recovery signals, history, and test results.
- Generate plans deterministically: the same inputs should produce the same plan and the same explanation.
- Explain decisions: every recommendation, warning, score, and constraint result should be inspectable.
- Work locally first: the product should remain useful without a server, cloud account, or opaque remote model.
- Preserve history: events should form the future foundation for sync, analytics, audits, and reproducible planning.

The long-term product is not "log a workout and show a chart." It is a composable training engine with a UI attached.

## Non-Goals

Project45 deliberately avoids several tempting directions:

- No official sports-science claims. The scoring and rules are starter heuristics, not medical advice or a validated training model.
- No AI-dependent planning path. AI may assist future authoring or analysis, but the core engine must remain deterministic.
- No hidden optimization solver. Optimization can come later, after rules, scoring, constraints, and history are stable.
- No React-bound domain logic. UI state and rendering must not leak into the domain model.
- No server-first architecture. Sync can be added, but the local model must remain first-class.
- No event store yet. The event model exists before persistence so the shape can stabilize independently.
- No mutation-based planner. Current planning, rules, constraints, and scoring evaluate plans; they do not silently rewrite them.

## Architectural Principles

### Deterministic Core

The domain layer is plain TypeScript. Functions should be pure whenever practical: pass input in, receive output out, with no hidden network, clock, storage, or UI dependencies. This makes planning behavior reproducible and easy to test.

### Explainability by Default

Planner, rule, constraint, and scoring outputs should carry human-readable explanations. The product should be able to answer "why did this happen?" without reverse-engineering a black box.

### Local-First Boundaries

Project45 should keep a complete local representation of plans, events, scores, constraints, and history. Future sync should reconcile local facts, not replace them with remote authority by default.

### Small Composable Modules

The architecture favors small modules over framework patterns:

- Domain types define the vocabulary.
- Planner produces plans.
- Rules evaluate plan shape.
- Constraints evaluate feasibility and safety boundaries.
- Scoring estimates training emphasis and fatigue.
- Events describe historical facts.
- React renders projections of those concepts.

No dependency injection framework, IoC container, or service graph is needed at this stage. Simple function composition is enough.

### Immutable Domain Objects

Domain objects use readonly TypeScript types. This is not a complete runtime immutability guarantee, but it sets the compile-time contract: domain functions should return new values or result objects, not mutate caller-owned state.

### Small PRs, High Test Density

Each architectural slice should land independently with unit tests. This keeps review small and makes it possible to reason about the engine as it grows.

## Domain Model

The domain model lives under `src/domain`. It is framework-independent and exports through the domain barrel.

Current domain areas:

- Goals and capabilities: typed ids for training intent and performance qualities.
- Exercises: metadata-rich knowledge objects with equipment, muscles, risk, modality, instructions, coaching cues, progressions, regressions, and substitutions.
- Workouts: plans, training days, sessions, blocks, prescriptions, session types, block types, and locations.
- Planner: a typed contract for producing a `WorkoutPlan` from `PlanningContext`.
- Rules: pure evaluators that return pass, warning, failure, or recommendation results.
- Constraints: feasibility and safety checks with substitution suggestions.
- Scoring: deterministic scoring over sessions, days, and plans.
- Events: immutable historical facts for future analytics and synchronization.
- Lifecycle: pure state transitions for workout execution states.

The model intentionally separates "what exists" from "how it is shown." A workout session is not a React component. An exercise is not a row in a table. These are durable domain concepts that can support many UIs.

## Planning Engine

The current planner is intentionally simple. The `Planner` contract accepts `PlanningContext` and returns a `WorkoutPlan`. The deterministic implementation currently returns the seed Project45 weekly plan.

This is a useful architecture step even before generation exists:

- Callers can depend on a stable planning boundary.
- Tests can lock down planner behavior.
- Future planners can be swapped in without changing React.
- Planning inputs can evolve independently from plan rendering.

Expected evolution:

1. Seed planner returns baseline plan.
2. Context-aware planner filters by goals, location, equipment, recovery, and schedule.
3. Rule and constraint results become planning feedback.
4. Scoring helps compare candidate plans.
5. Deterministic generation uses history and event-derived projections.

The planner should not become a monolith. It should compose catalog metadata, constraints, rules, scoring, and history projections through explicit data flow.

## Rule Engine

The rule engine evaluates plan quality and training logic. It does not mutate plans.

A planning rule receives a `WorkoutPlan`, `PlanningContext`, or both, then returns `RuleResult` objects. Results include:

- outcome: pass, warn, fail, or recommendation
- severity: info, warning, or blocking
- message and explanation
- optional day or session context

Starter rules cover examples such as:

- Avoid hard running days back to back.
- Avoid heavy lower-body strength the day after running intervals.
- Require core or hyperlordosis activation before ab wheel work.
- Flag poor recovery when recovery data exists.
- Ensure the week has a recovery or light day.

Long-term, rules should remain pure and individually testable. A rule is not a planner, a solver, or a UI notification. It is a small piece of domain judgment with evidence attached.

## Scoring Engine

The scoring engine estimates training emphasis and fatigue. It is deliberately not an official sports-science model.

Score dimensions:

- core
- endurance
- strength
- mobility
- posture
- pelvic_control
- grip
- recovery
- fatigue

Scoring currently works at three levels:

- `WorkoutSession`
- `TrainingDay`
- `WorkoutPlan`

The initial implementation scores from:

- exercise capabilities
- session type
- block type
- estimated duration
- prescription effort
- high-risk exercise fatigue
- explicit fatigue estimates when available

Scores include human-readable explanations. This matters because scoring will influence future planning decisions. If a generated plan is rejected or preferred, Project45 should be able to explain which dimensions drove that decision.

## Constraint Engine

The constraint engine evaluates feasibility and boundary conditions. It does not mutate plans.

Current constraint support:

- available equipment
- allowed locations
- maximum risk level
- excluded exercise ids
- home-session detection for gym-only exercises
- high-risk exercise warnings in recovery sessions

Constraint results include pass, warn, or fail plus an explanation. When catalog metadata provides substitutions, the resolver suggests replacement exercise ids that satisfy the active constraint.

This establishes a clean separation:

- Constraints answer "can this plan fit the athlete and environment?"
- Rules answer "does this plan make training sense?"
- Scoring answers "what does this plan emphasize and cost?"
- Planning will eventually use all three, but none of them need to own generation.

## Event Model

The event model is the foundation for future history, synchronization, analytics, and auditability. It does not include persistence or an event store yet.

Core event types:

- `Event`
- `EventMetadata`
- `EventId`
- `AggregateId`
- `EventVersion`

Initial typed events:

- `WorkoutStarted`
- `WorkoutCompleted`
- `ExerciseCompleted`
- `RecoveryRecorded`
- `WeightRecorded`
- `GoalChanged`
- `GtoTestRecorded`

Events are immutable facts. They describe what happened, not what the UI currently displays. Future projections can derive current workout state, recovery trends, test progress, and planning inputs from event history.

The event model also prepares the system for local-first sync. Event metadata includes versioning and causation/correlation fields so future synchronization can reason about ordering, provenance, and related changes.

## Plugin Model

Project45 does not have runtime plugins yet, but the architecture should allow plugin-like extension without compromising determinism.

The intended plugin model is simple composition around stable contracts:

- Exercise catalog packs can add metadata.
- Rule packs can add `PlanningRule` functions.
- Constraint packs can add evaluators or substitution policies.
- Scoring packs can add dimensions or alternative heuristics.
- Planner variants can compose different rule, constraint, and scoring sets.
- Import/export adapters can translate local data without owning the domain.

Plugins should be data and pure functions, not hidden services. They should not require React, global mutable state, network access, or background side effects. A plugin should be testable by passing typed inputs into exported functions.

## Local-First Philosophy

Local-first is a product and architecture choice:

- The user should be able to plan, train, and review history without a server.
- Domain state should be serializable and portable.
- Sync should be additive, not foundational.
- Cloud services should not be required for core correctness.
- Deterministic projections should be rebuildable from local events.

This philosophy pairs naturally with the event model. Local events can be appended, projected, exported, and later synchronized. Conflict resolution can be designed around domain facts instead of UI snapshots.

Local-first also keeps trust high. Training, recovery, body weight, and goals are personal data. The architecture should minimize unnecessary data movement.

## Testing Strategy

Testing is part of the architecture, not an afterthought.

Current strategy:

- Unit tests live beside domain modules.
- Domain tests run with Vitest.
- Tests focus on pure function behavior and typed contracts.
- Build uses strict TypeScript checks.
- CI should run tests and build before merge.

Testing priorities:

- Exhaustive transition tests for lifecycle state machines.
- Contract tests for planner, rules, constraints, scoring, and events.
- Catalog integrity tests for ids and metadata references.
- Determinism tests where generated or evaluated output must remain stable.
- Regression tests for every bug fixed in domain behavior.

As the planner grows, tests should emphasize explainable scenarios: given this athlete context, catalog, constraints, and history, the engine produces this plan and these explanations.

## Roadmap

Near term:

- Expand event coverage and introduce projections.
- Add local event persistence.
- Connect workout lifecycle transitions to emitted domain events.
- Improve recovery and readiness modeling.
- Expand the exercise catalog with richer substitutions.
- Add planner inputs for schedule, equipment, location, and training age.

Mid term:

- Generate deterministic plan variants from goals and constraints.
- Use scoring to compare candidate plans.
- Use rules and constraints as planning feedback loops.
- Add progression logic for strength, endurance, mobility, and recovery.
- Add history-derived analytics and readiness trends.
- Add import/export for local data portability.

Long term:

- Build a deterministic planning engine that can explain every recommendation.
- Support domain extension through catalog, rule, constraint, and scoring packs.
- Add local-first synchronization across devices.
- Support richer goal systems for GTO Gold, hiking, climbing, posture, pelvic floor, longevity, and sport-specific preparation.
- Keep the core engine independent from React, storage, and network concerns.

The architectural bet is that a small, well-tested deterministic core can grow into a serious Human Performance OS without becoming opaque, brittle, or framework-bound.
