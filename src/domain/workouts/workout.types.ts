export type SessionType =
  | 'morning_home'
  | 'work_break'
  | 'evening_gym'
  | 'outdoor'
  | 'recovery'
  | 'test';

export type WorkoutBlockType =
  | 'warmup'
  | 'mobility'
  | 'strength'
  | 'conditioning'
  | 'core'
  | 'pelvic_floor'
  | 'test'
  | 'cooldown';

export type ExercisePrescription = {
  exerciseId: string;
  sets?: number;
  reps?: string;
  duration?: string;
  intensity?: string;
  rest?: string;
  note?: string;
};

export type WorkoutBlock = {
  id: string;
  type: WorkoutBlockType;
  title: string;
  prescriptions: ExercisePrescription[];
};

export type WorkoutSession = {
  id: string;
  type: SessionType;
  title: string;
  location: 'home' | 'gym' | 'outdoor';
  estimatedMinutes: number;
  blocks: WorkoutBlock[];
};

export type TrainingDay = {
  id: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  focus: string;
  sessions: WorkoutSession[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  version: string;
  description: string;
  days: TrainingDay[];
};
