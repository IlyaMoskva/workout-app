import { describe, expect, it } from 'vitest';
import type { Planner, PlanningContext } from './planner';
import { planProject45Week, project45SeedPlanner } from './planner';
import { PROJECT45_WEEKLY_SEED_PLAN } from './weeklySeedPlan';

const baseContext: PlanningContext = {
  goals: ['gto_gold', 'core_strength'],
  capabilities: ['strength', 'core'],
  constraints: {
    availableDayIndexes: [1, 2, 3, 4, 5, 6, 7],
    availableEquipment: ['bodyweight', 'floor_mat'],
    preferredLocations: ['home', 'gym'],
    maxSessionDurationMinutes: 60,
    maxWeeklyDurationMinutes: 300,
  },
  startDate: '2026-07-06',
};

describe('project45SeedPlanner', () => {
  it('satisfies the planner contract', () => {
    const planner: Planner = project45SeedPlanner;

    expect(planner.plan(baseContext)).toBe(PROJECT45_WEEKLY_SEED_PLAN);
  });

  it('returns the current seed plan through the function contract', () => {
    expect(planProject45Week(baseContext)).toBe(PROJECT45_WEEKLY_SEED_PLAN);
  });

  it('is deterministic for different planning contexts', () => {
    const travelContext: PlanningContext = {
      goals: ['endurance'],
      constraints: {
        availableDayIndexes: [2, 4, 6],
        preferredLocations: ['travel', 'outdoor'],
        maxSessionDurationMinutes: 30,
      },
      startDate: '2026-08-01',
    };

    expect(project45SeedPlanner.plan(baseContext)).toBe(project45SeedPlanner.plan(baseContext));
    expect(project45SeedPlanner.plan(travelContext)).toBe(PROJECT45_WEEKLY_SEED_PLAN);
  });
});
