import { describe, expect, it } from 'vitest';
import { PROJECT45_EXERCISES } from '../exercises/catalog';
import type { ExerciseId } from '../exercises/exercise.types';
import {
  evaluatePlanningConstraint,
  resolveExerciseSubstitutions,
} from './constraints';
import { PROJECT45_WEEKLY_SEED_PLAN } from './weeklySeedPlan';
import type { TrainingDay, WorkoutPlan, WorkoutSession } from './workout.types';

const exerciseId = (value: string): ExerciseId => value as ExerciseId;

const exercisesWithSubstitutions = PROJECT45_EXERCISES.map((exercise) =>
  exercise.id === 'goblet-squat'
    ? {
        ...exercise,
        substitutions: [exerciseId('walking-lunge')],
      }
    : exercise,
);

const planWithDays = (days: readonly TrainingDay[]): WorkoutPlan => ({
  ...PROJECT45_WEEKLY_SEED_PLAN,
  days,
});

const planWithSession = (session: WorkoutSession): WorkoutPlan => {
  const seedDay = PROJECT45_WEEKLY_SEED_PLAN.days[0];

  return planWithDays([
    {
      ...seedDay,
      sessions: [session],
    },
  ]);
};

describe('resolveExerciseSubstitutions', () => {
  it('returns catalog metadata substitutions that satisfy constraints', () => {
    const substitutions = resolveExerciseSubstitutions(
      exerciseId('goblet-squat'),
      {
        id: 'bodyweight-only',
        availableEquipment: ['bodyweight'],
        excludedExerciseIds: [exerciseId('goblet-squat')],
      },
      exercisesWithSubstitutions,
    );

    expect(substitutions.map((exercise) => exercise.id)).toEqual([exerciseId('walking-lunge')]);
  });

  it('filters substitutions that violate risk constraints', () => {
    const substitutions = resolveExerciseSubstitutions(
      exerciseId('goblet-squat'),
      {
        id: 'low-risk-only',
        availableEquipment: ['bodyweight'],
        maxRiskLevel: 'low',
      },
      exercisesWithSubstitutions,
    );

    expect(substitutions).toEqual([]);
  });
});

describe('evaluatePlanningConstraint', () => {
  it('warns and suggests substitutions when required equipment is unavailable', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[0].sessions[1];
    const results = evaluatePlanningConstraint({
      plan: planWithSession(session),
      constraint: {
        id: 'no-dumbbells',
        availableEquipment: ['bodyweight', 'floor_mat'],
      },
      exercises: exercisesWithSubstitutions,
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        outcome: 'warn',
        exerciseId: exerciseId('goblet-squat'),
        suggestedExerciseIds: [exerciseId('walking-lunge')],
      }),
    );
  });

  it('flags gym-only exercises in a home session', () => {
    const gymSession = PROJECT45_WEEKLY_SEED_PLAN.days[2].sessions[1];
    const homeSession: WorkoutSession = {
      ...gymSession,
      location: 'home',
    };

    const results = evaluatePlanningConstraint({
      plan: planWithSession(homeSession),
      constraint: {
        id: 'home-check',
      },
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        outcome: 'warn',
        exerciseId: exerciseId('lat-pulldown'),
      }),
    );
  });

  it('warns when an excluded exercise appears and includes replacement metadata', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[0].sessions[1];
    const results = evaluatePlanningConstraint({
      plan: planWithSession(session),
      constraint: {
        id: 'exclude-goblet',
        availableEquipment: ['bodyweight', 'floor_mat'],
        excludedExerciseIds: [exerciseId('goblet-squat')],
      },
      exercises: exercisesWithSubstitutions,
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        outcome: 'warn',
        exerciseId: exerciseId('goblet-squat'),
        suggestedExerciseIds: [exerciseId('walking-lunge')],
      }),
    );
  });

  it('warns when an exercise exceeds the allowed risk level', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[4].sessions[1];
    const results = evaluatePlanningConstraint({
      plan: planWithSession(session),
      constraint: {
        id: 'low-risk-only',
        maxRiskLevel: 'low',
      },
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        outcome: 'warn',
        exerciseId: exerciseId('step-up'),
      }),
    );
  });

  it('warns when a high-risk exercise appears in a recovery session', () => {
    const recoverySession = PROJECT45_WEEKLY_SEED_PLAN.days[1].sessions[0];
    const recoveryBlock = recoverySession.blocks[0];
    const recoveryWithSwing: WorkoutSession = {
      ...recoverySession,
      blocks: [
        {
          ...recoveryBlock,
          prescriptions: [
            {
              exerciseId: exerciseId('kettlebell-swing'),
              sets: 3,
              reps: 12,
            },
          ],
        },
      ],
    };

    const results = evaluatePlanningConstraint({
      plan: planWithSession(recoveryWithSwing),
      constraint: {
        id: 'recovery-risk',
      },
    });

    expect(results).toContainEqual(
      expect.objectContaining({
        outcome: 'warn',
        exerciseId: exerciseId('kettlebell-swing'),
      }),
    );
  });

  it('passes when no constraint issues are found', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[1].sessions[0];
    const results = evaluatePlanningConstraint({
      plan: planWithSession(session),
      constraint: {
        id: 'home-recovery',
        availableEquipment: ['floor_mat'],
        allowedLocations: ['home'],
        maxRiskLevel: 'low',
      },
    });

    expect(results).toEqual([
      expect.objectContaining({
        constraintId: 'home-recovery',
        outcome: 'pass',
      }),
    ]);
  });
});
