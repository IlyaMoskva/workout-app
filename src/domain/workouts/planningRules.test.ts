import { describe, expect, it } from 'vitest';
import type { ExerciseId } from '../exercises/exercise.types';
import type { PlanningContext } from './planner';
import {
  avoidBackToBackHardRunningDaysRule,
  avoidHeavyLowerBodyAfterRunningIntervalsRule,
  coreActivationBeforeAbWheelRule,
  ensureWeeklyRecoveryDayRule,
  flagPoorRecoveryRule,
  runPlanningRules,
} from './planningRules';
import { PROJECT45_WEEKLY_SEED_PLAN } from './weeklySeedPlan';
import type { TrainingDay, WorkoutPlan } from './workout.types';

const exerciseId = (value: string): ExerciseId => value as ExerciseId;

const planWithDays = (days: readonly TrainingDay[]): WorkoutPlan => ({
  ...PROJECT45_WEEKLY_SEED_PLAN,
  days,
});

const intervalRunDay = (dayIndex: number): TrainingDay => {
  const seedDay = PROJECT45_WEEKLY_SEED_PLAN.days[1];
  const runSession = seedDay.sessions[1];
  const runBlock = runSession.blocks[0];

  return {
    ...seedDay,
    dayIndex,
    sessions: [
      {
        ...runSession,
        title: 'Track Running Intervals',
        blocks: [
          {
            ...runBlock,
            name: 'Running interval repeats',
            prescriptions: runBlock.prescriptions.map((prescription) => ({
              ...prescription,
              intensity: { zone: 'interval' },
            })),
          },
        ],
      },
    ],
  };
};

const heavyLowerBodyDay = (dayIndex: number): TrainingDay => {
  const seedDay = PROJECT45_WEEKLY_SEED_PLAN.days[0];
  const lowerBodySession = seedDay.sessions[1];

  return {
    ...seedDay,
    dayIndex,
    sessions: [lowerBodySession],
  };
};

describe('runPlanningRules', () => {
  it('evaluates starter rules against the seed plan without warnings or failures', () => {
    const results = runPlanningRules({
      plan: PROJECT45_WEEKLY_SEED_PLAN,
      context: { goals: ['gto_gold'] },
    });

    expect(results).toHaveLength(5);
    expect(results.every((result) => result.explanation.length > 0)).toBe(true);
    expect(results.filter((result) => ['warn', 'fail'].includes(result.outcome))).toEqual([]);
  });
});

describe('starter planning rules', () => {
  it('warns when hard running days are back to back', () => {
    const results = avoidBackToBackHardRunningDaysRule.evaluate({
      plan: planWithDays([intervalRunDay(1), intervalRunDay(2)]),
    });

    expect(results).toEqual([
      expect.objectContaining({
        outcome: 'warn',
        severity: 'warning',
        dayIndex: 2,
      }),
    ]);
  });

  it('warns when heavy lower-body strength follows running intervals', () => {
    const results = avoidHeavyLowerBodyAfterRunningIntervalsRule.evaluate({
      plan: planWithDays([intervalRunDay(1), heavyLowerBodyDay(2)]),
    });

    expect(results).toEqual([
      expect.objectContaining({
        outcome: 'warn',
        severity: 'warning',
        dayIndex: 2,
      }),
    ]);
  });

  it('blocks ab wheel work that lacks prior core activation', () => {
    const seedDay = PROJECT45_WEEKLY_SEED_PLAN.days[2];
    const seedSession = seedDay.sessions[0];
    const seedBlock = seedSession.blocks[0];
    const abWheelPlan = planWithDays([
      {
        ...seedDay,
        sessions: [
          {
            ...seedSession,
            blocks: [
              {
                ...seedBlock,
                name: 'Ab wheel strength',
                prescriptions: [{ exerciseId: exerciseId('ab-wheel'), sets: 3, reps: 8 }],
              },
            ],
          },
        ],
      },
    ]);

    const results = coreActivationBeforeAbWheelRule.evaluate({ plan: abWheelPlan });

    expect(results).toEqual([
      expect.objectContaining({
        outcome: 'fail',
        severity: 'blocking',
        dayIndex: seedDay.dayIndex,
      }),
    ]);
  });

  it('warns when recovery data is poor', () => {
    const context: PlanningContext = {
      goals: ['gto_gold'],
      recovery: {
        readiness: 'poor',
        sleepHours: 5.5,
        sorenessLevel: 8,
        fatigueLevel: 7,
      },
    };

    const results = flagPoorRecoveryRule.evaluate({ context });

    expect(results).toEqual([
      expect.objectContaining({
        outcome: 'warn',
        severity: 'warning',
      }),
    ]);
  });

  it('warns when the week has no recovery or light day', () => {
    const results = ensureWeeklyRecoveryDayRule.evaluate({
      plan: planWithDays([heavyLowerBodyDay(1)]),
    });

    expect(results).toEqual([
      expect.objectContaining({
        outcome: 'warn',
        severity: 'warning',
      }),
    ]);
  });
});
