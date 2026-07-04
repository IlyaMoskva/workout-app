import type { CapabilityId, GoalId } from '../goals/goal.types';

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type ExerciseId = Brand<string, 'ExerciseId'>;

export const EQUIPMENT_IDS = [
  'bodyweight',
  'floor_mat',
  'dumbbells',
  'short_barbell',
  'ez_bar',
  'ab_wheel',
  'pullup_bar',
  'treadmill',
  'cable_machine',
  'lat_pulldown',
  'gym_bench',
  'outdoor',
] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export const MUSCLE_GROUPS = [
  'core',
  'glutes',
  'hip_flexors',
  'hamstrings',
  'quads',
  'calves',
  'back',
  'chest',
  'shoulders',
  'arms',
  'pelvic_floor',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export type ExerciseRiskLevel = (typeof RISK_LEVELS)[number];

export type ExerciseRisk = Readonly<{
  level: ExerciseRiskLevel;
  notes?: readonly string[];
  contraindications?: readonly string[];
}>;

export type ExerciseModality = 'strength' | 'cardio' | 'mobility' | 'skill' | 'recovery';

export type ExerciseMeasurement = 'reps' | 'time' | 'distance' | 'load' | 'rounds';

export type MuscleTarget = Readonly<{
  primary: readonly MuscleGroup[];
  secondary?: readonly MuscleGroup[];
}>;

export type EquipmentRequirement = Readonly<{
  required: readonly EquipmentId[];
  optional?: readonly EquipmentId[];
}>;

export type Exercise = Readonly<{
  id: ExerciseId;
  name: string;
  englishName?: string;
  summary: string;
  modality: ExerciseModality;
  goals: readonly GoalId[];
  capabilities: readonly CapabilityId[];
  equipment: EquipmentRequirement;
  muscleGroups: MuscleTarget;
  measurements: readonly ExerciseMeasurement[];
  risk: ExerciseRisk;
  instructions: readonly string[];
  coachingCues: readonly string[];
  regressions?: readonly ExerciseId[];
  progressions?: readonly ExerciseId[];
  substitutions?: readonly ExerciseId[];
}>;
