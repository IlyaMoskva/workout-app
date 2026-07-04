export type CompletionStatus = 'planned' | 'done' | 'skipped';

export type ExerciseCompletion = {
  sessionId: string;
  exerciseId: string;
  date: string;
  status: CompletionStatus;
  note?: string;
};

export type GtoTestResult = {
  date: string;
  twoKmSeconds?: number;
  pushUps?: number;
  pullUps?: number;
  absOneMinute?: number;
  sitAndReachCm?: number;
};

export type BodyMetric = {
  date: string;
  weightKg?: number;
  waistCm?: number;
  sleepHours?: number;
  energy?: 1 | 2 | 3 | 4 | 5;
  soreness?: 1 | 2 | 3 | 4 | 5;
  libido?: 1 | 2 | 3 | 4 | 5;
  stress?: 1 | 2 | 3 | 4 | 5;
};
