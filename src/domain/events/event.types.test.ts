import { describe, expect, it } from 'vitest';
import type { ExerciseId } from '../exercises/exercise.types';
import type { GoalId } from '../goals/goal.types';
import type { WorkoutPlanId, WorkoutSessionId } from '../workouts';
import type {
  AggregateId,
  EventId,
  EventMetadata,
  EventVersion,
  ExerciseCompleted,
  GoalChanged,
  GtoTestRecorded,
  Project45Event,
  RecoveryRecorded,
  WeightRecorded,
  WorkoutCompleted,
  WorkoutStarted,
} from './event.types';

const eventId = (value: string): EventId => value as EventId;
const aggregateId = (value: string): AggregateId => value as AggregateId;
const eventVersion = (value: number): EventVersion => value as EventVersion;
const workoutPlanId = (value: string): WorkoutPlanId => value as WorkoutPlanId;
const workoutSessionId = (value: string): WorkoutSessionId => value as WorkoutSessionId;
const exerciseId = (value: string): ExerciseId => value as ExerciseId;
const goalId = (value: string): GoalId => value as GoalId;

const metadata = (id: string, version = 1): EventMetadata => ({
  eventId: eventId(id),
  aggregateId: aggregateId('athlete-local-profile'),
  version: eventVersion(version),
  occurredAt: '2026-07-05T12:00:00.000Z',
  source: 'unit-test',
});

const events: readonly Project45Event[] = [
  {
    type: 'WorkoutStarted',
    metadata: metadata('event-workout-started'),
    payload: {
      workoutPlanId: workoutPlanId('project45-weekly-seed-plan'),
      workoutSessionId: workoutSessionId('day-1-morning-home'),
      startedAt: '2026-07-05T12:00:00.000Z',
    },
  } satisfies WorkoutStarted,
  {
    type: 'WorkoutCompleted',
    metadata: metadata('event-workout-completed', 2),
    payload: {
      workoutPlanId: workoutPlanId('project45-weekly-seed-plan'),
      workoutSessionId: workoutSessionId('day-1-morning-home'),
      completedAt: '2026-07-05T12:20:00.000Z',
      durationMinutes: 20,
    },
  } satisfies WorkoutCompleted,
  {
    type: 'ExerciseCompleted',
    metadata: metadata('event-exercise-completed', 3),
    payload: {
      workoutSessionId: workoutSessionId('day-1-morning-home'),
      exerciseId: exerciseId('dead-bug'),
      completedAt: '2026-07-05T12:10:00.000Z',
      setsCompleted: 2,
      repsCompleted: 8,
    },
  } satisfies ExerciseCompleted,
  {
    type: 'RecoveryRecorded',
    metadata: metadata('event-recovery-recorded'),
    payload: {
      recordedAt: '2026-07-05T08:00:00.000Z',
      readiness: 'fair',
      sleepHours: 7,
      sorenessLevel: 3,
      fatigueLevel: 4,
      notes: ['Slept well enough.'],
    },
  } satisfies RecoveryRecorded,
  {
    type: 'WeightRecorded',
    metadata: metadata('event-weight-recorded'),
    payload: {
      recordedAt: '2026-07-05T08:05:00.000Z',
      weightKg: 82.4,
    },
  } satisfies WeightRecorded,
  {
    type: 'GoalChanged',
    metadata: metadata('event-goal-changed'),
    payload: {
      goalId: goalId('endurance'),
      changedAt: '2026-07-05T09:00:00.000Z',
      previousState: 'supporting',
      nextState: 'primary',
      reason: 'Preparing for hiking season.',
    },
  } satisfies GoalChanged,
  {
    type: 'GtoTestRecorded',
    metadata: metadata('event-gto-test-recorded'),
    payload: {
      recordedAt: '2026-07-05T10:00:00.000Z',
      testId: 'plank-hold',
      resultValue: 75,
      unit: 'seconds',
      passed: true,
    },
  } satisfies GtoTestRecorded,
];

const describeEvent = (event: Project45Event): string => {
  switch (event.type) {
    case 'WorkoutStarted':
      return `Started ${event.payload.workoutSessionId}`;
    case 'WorkoutCompleted':
      return `Completed ${event.payload.workoutSessionId}`;
    case 'ExerciseCompleted':
      return `Completed exercise ${event.payload.exerciseId}`;
    case 'RecoveryRecorded':
      return `Recovery ${event.payload.readiness ?? 'unknown'}`;
    case 'WeightRecorded':
      return `Weight ${event.payload.weightKg}`;
    case 'GoalChanged':
      return `Goal ${event.payload.goalId} changed to ${event.payload.nextState}`;
    case 'GtoTestRecorded':
      return `GTO ${event.payload.testId}`;
  }
};

describe('Project45 event model', () => {
  it('models every initial event as an immutable typed event', () => {
    expect(events.map((event) => event.type)).toEqual([
      'WorkoutStarted',
      'WorkoutCompleted',
      'ExerciseCompleted',
      'RecoveryRecorded',
      'WeightRecorded',
      'GoalChanged',
      'GtoTestRecorded',
    ]);

    for (const event of events) {
      expect(event.metadata.eventId).toMatch(/^event-/);
      expect(event.metadata.aggregateId).toBe('athlete-local-profile');
      expect(event.metadata.version).toBeGreaterThan(0);
      expect(event.metadata.occurredAt).toContain('T');
      expect(Object.keys(event.payload).length).toBeGreaterThan(0);
    }
  });

  it('supports discriminated event handling by event type', () => {
    expect(events.map(describeEvent)).toEqual([
      'Started day-1-morning-home',
      'Completed day-1-morning-home',
      'Completed exercise dead-bug',
      'Recovery fair',
      'Weight 82.4',
      'Goal endurance changed to primary',
      'GTO plank-hold',
    ]);
  });

  it('supports causation and correlation metadata for synchronization history', () => {
    const correlated: WorkoutCompleted = {
      type: 'WorkoutCompleted',
      metadata: {
        ...metadata('event-correlated-workout-completed', 4),
        causationId: eventId('event-workout-started'),
        correlationId: eventId('event-training-day-flow'),
      },
      payload: {
        workoutPlanId: workoutPlanId('project45-weekly-seed-plan'),
        workoutSessionId: workoutSessionId('day-1-evening-gym'),
        completedAt: '2026-07-05T18:00:00.000Z',
      },
    };

    expect(correlated.metadata.causationId).toBe('event-workout-started');
    expect(correlated.metadata.correlationId).toBe('event-training-day-flow');
  });
});
