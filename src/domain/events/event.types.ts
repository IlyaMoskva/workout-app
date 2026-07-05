import type { ExerciseId } from '../exercises/exercise.types';
import type { GoalId } from '../goals/goal.types';
import type { WorkoutPlanId, WorkoutSessionId } from '../workouts';

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type EventId = Brand<string, 'EventId'>;
export type AggregateId = Brand<string, 'AggregateId'>;
export type EventVersion = Brand<number, 'EventVersion'>;

export type EventMetadata = Readonly<{
  eventId: EventId;
  aggregateId: AggregateId;
  version: EventVersion;
  occurredAt: string;
  causationId?: EventId;
  correlationId?: EventId;
  source?: string;
}>;

export type Event<TType extends string, TPayload extends Readonly<Record<string, unknown>>> = Readonly<{
  type: TType;
  metadata: EventMetadata;
  payload: TPayload;
}>;

export type WorkoutStarted = Event<
  'WorkoutStarted',
  Readonly<{
    workoutPlanId: WorkoutPlanId;
    workoutSessionId: WorkoutSessionId;
    startedAt: string;
  }>
>;

export type WorkoutCompleted = Event<
  'WorkoutCompleted',
  Readonly<{
    workoutPlanId: WorkoutPlanId;
    workoutSessionId: WorkoutSessionId;
    completedAt: string;
    durationMinutes?: number;
  }>
>;

export type ExerciseCompleted = Event<
  'ExerciseCompleted',
  Readonly<{
    workoutSessionId: WorkoutSessionId;
    exerciseId: ExerciseId;
    completedAt: string;
    setsCompleted?: number;
    repsCompleted?: number | string;
    durationSeconds?: number;
    distanceMeters?: number;
    load?: string;
  }>
>;

export type RecoveryRecorded = Event<
  'RecoveryRecorded',
  Readonly<{
    recordedAt: string;
    readiness?: 'good' | 'fair' | 'poor';
    sleepHours?: number;
    sorenessLevel?: number;
    fatigueLevel?: number;
    notes?: readonly string[];
  }>
>;

export type WeightRecorded = Event<
  'WeightRecorded',
  Readonly<{
    recordedAt: string;
    weightKg: number;
  }>
>;

export type GoalChanged = Event<
  'GoalChanged',
  Readonly<{
    goalId: GoalId;
    changedAt: string;
    previousState?: string;
    nextState: string;
    reason?: string;
  }>
>;

export type GtoTestRecorded = Event<
  'GtoTestRecorded',
  Readonly<{
    recordedAt: string;
    testId: string;
    resultValue: number;
    unit: string;
    passed?: boolean;
    notes?: readonly string[];
  }>
>;

export type Project45Event =
  | WorkoutStarted
  | WorkoutCompleted
  | ExerciseCompleted
  | RecoveryRecorded
  | WeightRecorded
  | GoalChanged
  | GtoTestRecorded;
