import type { CapabilityId, GoalId } from '../goals/goal.types';

export type EquipmentId =
  | 'bodyweight'
  | 'floor_mat'
  | 'dumbbells'
  | 'short_barbell'
  | 'ez_bar'
  | 'ab_wheel'
  | 'pullup_bar'
  | 'treadmill'
  | 'cable_machine'
  | 'lat_pulldown'
  | 'gym_bench'
  | 'outdoor';

export type MuscleGroup =
  | 'core'
  | 'glutes'
  | 'hip_flexors'
  | 'hamstrings'
  | 'quads'
  | 'calves'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'pelvic_floor';

export type ExerciseRisk = 'low' | 'medium' | 'high';

export type Exercise = {
  id: string;
  name: string;
  englishName?: string;
  summary: string;
  goals: GoalId[];
  capabilities: CapabilityId[];
  equipment: EquipmentId[];
  muscleGroups: MuscleGroup[];
  risk: ExerciseRisk;
  instructions: string[];
  coachingCues: string[];
  contraindications?: string[];
  regressions?: string[];
  progressions?: string[];
  substitutions?: string[];
};
