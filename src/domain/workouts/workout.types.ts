import type { ExerciseId } from '../exercises/exercise.types';
import type { CapabilityId, GoalId } from '../goals/goal.types';

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type WorkoutPlanId = Brand<string, 'WorkoutPlanId'>;
export type TrainingDayId = Brand<string, 'TrainingDayId'>;
export type WorkoutSessionId = Brand<string, 'WorkoutSessionId'>;
export type WorkoutBlockId = Brand<string, 'WorkoutBlockId'>;

export const SESSION_TYPES = [
  'strength',
  'cardio',
  'mobility',
  'skill',
  'recovery',
  'assessment',
] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export const BLOCK_TYPES = [
  'warmup',
  'main',
  'accessory',
  'conditioning',
  'cooldown',
  'prehab',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const LOCATION_TYPES = ['home', 'gym', 'outdoor', 'travel'] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export type PrescriptionIntensity = Readonly<{
  rpe?: number;
  percentOfMax?: number;
  zone?: string;
}>;

export type ExercisePrescription = Readonly<{
  exerciseId: ExerciseId;
  sets?: number;
  reps?: number | string;
  durationSeconds?: number;
  distanceMeters?: number;
  load?: string;
  intensity?: PrescriptionIntensity;
  restSeconds?: number;
  tempo?: string;
  notes?: readonly string[];
}>;

export type WorkoutBlock = Readonly<{
  id: WorkoutBlockId;
  type: BlockType;
  name: string;
  prescriptions: readonly ExercisePrescription[];
  rounds?: number;
  restSeconds?: number;
  notes?: readonly string[];
}>;

export type WorkoutSession = Readonly<{
  id: WorkoutSessionId;
  type: SessionType;
  location: LocationType;
  title: string;
  goals: readonly GoalId[];
  capabilities: readonly CapabilityId[];
  blocks: readonly WorkoutBlock[];
  estimatedDurationMinutes?: number;
  notes?: readonly string[];
}>;

export type TrainingDay = Readonly<{
  id: TrainingDayId;
  dayIndex: number;
  title?: string;
  sessions: readonly WorkoutSession[];
  notes?: readonly string[];
}>;

export type WorkoutPlan = Readonly<{
  id: WorkoutPlanId;
  name: string;
  description?: string;
  goals: readonly GoalId[];
  days: readonly TrainingDay[];
  startDate?: string;
  endDate?: string;
  notes?: readonly string[];
}>;
