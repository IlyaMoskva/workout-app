import { PROJECT45_EXERCISES } from '../exercises/catalog';
import type { Exercise } from '../exercises/exercise.types';
import type { CapabilityId } from '../goals/goal.types';
import type {
  ExercisePrescription,
  TrainingDay,
  WorkoutBlock,
  WorkoutPlan,
  WorkoutSession,
} from './workout.types';

export const SCORE_DIMENSIONS = [
  'core',
  'endurance',
  'strength',
  'mobility',
  'posture',
  'pelvic_control',
  'grip',
  'recovery',
  'fatigue',
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];
export type ScoreByDimension = Readonly<Record<ScoreDimension, number>>;

export type ScoreExplanation = Readonly<{
  dimension: ScoreDimension;
  message: string;
  points: number;
}>;

export type WorkoutScore = Readonly<{
  dimensions: ScoreByDimension;
  total: number;
  explanations: readonly ScoreExplanation[];
}>;

export type PlanScore = WorkoutScore &
  Readonly<{
    dayScores: readonly WorkoutScore[];
  }>;

export type WorkoutScoringOptions = Readonly<{
  exercises?: readonly Exercise[];
  sessionFatigueEstimates?: Readonly<Record<string, number>>;
  dayFatigueEstimates?: Readonly<Record<number, number>>;
}>;

const capabilityDimensions: Readonly<Record<CapabilityId, readonly ScoreDimension[]>> = {
  strength: ['strength'],
  endurance: ['endurance'],
  speed: ['endurance', 'fatigue'],
  mobility: ['mobility'],
  core: ['core'],
  posture: ['posture'],
  pelvic_control: ['pelvic_control'],
  grip: ['grip'],
  recovery: ['recovery'],
};

const createEmptyDimensions = (): Record<ScoreDimension, number> =>
  SCORE_DIMENSIONS.reduce(
    (score, dimension) => ({
      ...score,
      [dimension]: 0,
    }),
    {} as Record<ScoreDimension, number>,
  );

const roundScore = (value: number): number => Math.round(value * 10) / 10;

const addScore = (
  dimensions: Record<ScoreDimension, number>,
  explanations: ScoreExplanation[],
  dimension: ScoreDimension,
  points: number,
  message: string,
): void => {
  const roundedPoints = roundScore(points);

  if (roundedPoints === 0) {
    return;
  }

  dimensions[dimension] = roundScore(dimensions[dimension] + roundedPoints);
  explanations.push({ dimension, message, points: roundedPoints });
};

const addCapabilities = (
  dimensions: Record<ScoreDimension, number>,
  explanations: ScoreExplanation[],
  capabilities: readonly CapabilityId[],
  points: number,
  source: string,
): void => {
  for (const capability of capabilities) {
    for (const dimension of capabilityDimensions[capability]) {
      addScore(dimensions, explanations, dimension, points, `${source} supports ${dimension}.`);
    }
  }
};

const scoreDuration = (durationMinutes: number | undefined): number => {
  if (!durationMinutes) {
    return 0;
  }

  return Math.min(durationMinutes / 20, 4);
};

const prescriptionEffort = (prescription: ExercisePrescription): number => {
  const setEffort = (prescription.sets ?? 1) * 0.4;
  const durationEffort = Math.min((prescription.durationSeconds ?? 0) / 600, 2);
  const distanceEffort = Math.min((prescription.distanceMeters ?? 0) / 1000, 2);
  const rpeEffort = Math.max((prescription.intensity?.rpe ?? 0) - 5, 0) * 0.35;

  return Math.max(1, roundScore(setEffort + durationEffort + distanceEffort + rpeEffort));
};

const addSessionTypeScore = (
  dimensions: Record<ScoreDimension, number>,
  explanations: ScoreExplanation[],
  session: WorkoutSession,
): void => {
  if (session.type === 'strength') {
    addScore(dimensions, explanations, 'strength', 2, 'Strength session type adds strength emphasis.');
    addScore(dimensions, explanations, 'fatigue', 1.5, 'Strength session type adds training fatigue.');
  }

  if (session.type === 'cardio') {
    addScore(dimensions, explanations, 'endurance', 2, 'Cardio session type adds endurance emphasis.');
    addScore(dimensions, explanations, 'fatigue', 1, 'Cardio session type adds training fatigue.');
  }

  if (session.type === 'mobility') {
    addScore(dimensions, explanations, 'mobility', 2, 'Mobility session type adds mobility emphasis.');
    addScore(dimensions, explanations, 'recovery', 0.5, 'Mobility session type supports recovery.');
  }

  if (session.type === 'recovery') {
    addScore(dimensions, explanations, 'recovery', 2, 'Recovery session type adds recovery emphasis.');
    addScore(dimensions, explanations, 'mobility', 0.5, 'Recovery session type supports easy movement.');
  }

  if (session.type === 'assessment') {
    addScore(dimensions, explanations, 'fatigue', 0.5, 'Assessment session type adds a small fatigue cost.');
  }
};

const addBlockTypeScore = (
  dimensions: Record<ScoreDimension, number>,
  explanations: ScoreExplanation[],
  block: WorkoutBlock,
): void => {
  if (block.type === 'warmup') {
    addScore(dimensions, explanations, 'mobility', 0.75, `Warmup block "${block.name}" supports mobility.`);
  }

  if (block.type === 'prehab') {
    addScore(dimensions, explanations, 'posture', 0.75, `Prehab block "${block.name}" supports posture.`);
    addScore(dimensions, explanations, 'pelvic_control', 0.75, `Prehab block "${block.name}" supports pelvic control.`);
  }

  if (block.type === 'main') {
    addScore(dimensions, explanations, 'fatigue', 1, `Main block "${block.name}" adds training fatigue.`);
  }

  if (block.type === 'accessory') {
    addScore(dimensions, explanations, 'fatigue', 0.5, `Accessory block "${block.name}" adds training fatigue.`);
  }

  if (block.type === 'conditioning') {
    addScore(dimensions, explanations, 'endurance', 1, `Conditioning block "${block.name}" supports endurance.`);
    addScore(dimensions, explanations, 'fatigue', 1, `Conditioning block "${block.name}" adds training fatigue.`);
  }

  if (block.type === 'cooldown') {
    addScore(dimensions, explanations, 'recovery', 1, `Cooldown block "${block.name}" supports recovery.`);
  }
};

const finalizeScore = (
  dimensions: Record<ScoreDimension, number>,
  explanations: ScoreExplanation[],
): WorkoutScore => {
  const roundedDimensions = SCORE_DIMENSIONS.reduce(
    (score, dimension) => ({
      ...score,
      [dimension]: roundScore(dimensions[dimension]),
    }),
    {} as Record<ScoreDimension, number>,
  );
  const total = roundScore(
    SCORE_DIMENSIONS.reduce((sum, dimension) => sum + roundedDimensions[dimension], 0),
  );

  return {
    dimensions: roundedDimensions,
    total,
    explanations,
  };
};

export const scoreWorkoutSession = (
  session: WorkoutSession,
  options: WorkoutScoringOptions = {},
): WorkoutScore => {
  const exercises = options.exercises ?? PROJECT45_EXERCISES;
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const dimensions = createEmptyDimensions();
  const explanations: ScoreExplanation[] = [];

  addSessionTypeScore(dimensions, explanations, session);
  addCapabilities(dimensions, explanations, session.capabilities, 1.25, `Session "${session.title}"`);

  const durationScore = scoreDuration(session.estimatedDurationMinutes);
  if (durationScore > 0) {
    addScore(
      dimensions,
      explanations,
      'fatigue',
      durationScore,
      `Estimated duration of ${session.estimatedDurationMinutes} minutes adds fatigue load.`,
    );
  }

  const explicitFatigue = options.sessionFatigueEstimates?.[session.id];
  if (explicitFatigue !== undefined) {
    addScore(dimensions, explanations, 'fatigue', explicitFatigue, 'Explicit session fatigue estimate was provided.');
  }

  for (const block of session.blocks) {
    addBlockTypeScore(dimensions, explanations, block);

    for (const prescription of block.prescriptions) {
      const exercise = exerciseById.get(prescription.exerciseId);

      if (!exercise) {
        continue;
      }

      const effort = prescriptionEffort(prescription);
      addCapabilities(
        dimensions,
        explanations,
        exercise.capabilities,
        effort,
        `Exercise "${exercise.name}"`,
      );

      if (exercise.risk.level === 'high') {
        addScore(dimensions, explanations, 'fatigue', 1, `High-risk exercise "${exercise.name}" adds fatigue load.`);
      }
    }
  }

  return finalizeScore(dimensions, explanations);
};

export const scoreTrainingDay = (
  day: TrainingDay,
  options: WorkoutScoringOptions = {},
): WorkoutScore => {
  const dimensions = createEmptyDimensions();
  const explanations: ScoreExplanation[] = [];

  for (const session of day.sessions) {
    const sessionScore = scoreWorkoutSession(session, options);

    for (const dimension of SCORE_DIMENSIONS) {
      dimensions[dimension] = roundScore(dimensions[dimension] + sessionScore.dimensions[dimension]);
    }

    explanations.push(
      ...sessionScore.explanations.map((explanation) => ({
        ...explanation,
        message: `Day ${day.dayIndex}: ${explanation.message}`,
      })),
    );
  }

  const explicitFatigue = options.dayFatigueEstimates?.[day.dayIndex];
  if (explicitFatigue !== undefined) {
    addScore(dimensions, explanations, 'fatigue', explicitFatigue, `Day ${day.dayIndex} explicit fatigue estimate was provided.`);
  }

  return finalizeScore(dimensions, explanations);
};

export const scoreWorkoutPlan = (
  plan: WorkoutPlan,
  options: WorkoutScoringOptions = {},
): PlanScore => {
  const dimensions = createEmptyDimensions();
  const explanations: ScoreExplanation[] = [];
  const dayScores = plan.days.map((day) => scoreTrainingDay(day, options));

  for (const dayScore of dayScores) {
    for (const dimension of SCORE_DIMENSIONS) {
      dimensions[dimension] = roundScore(dimensions[dimension] + dayScore.dimensions[dimension]);
    }

    explanations.push(...dayScore.explanations);
  }

  return {
    ...finalizeScore(dimensions, explanations),
    dayScores,
  };
};
