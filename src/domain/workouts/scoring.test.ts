import { describe, expect, it } from 'vitest';
import {
  SCORE_DIMENSIONS,
  scoreTrainingDay,
  scoreWorkoutPlan,
  scoreWorkoutSession,
} from './scoring';
import { PROJECT45_WEEKLY_SEED_PLAN } from './weeklySeedPlan';

describe('workout scoring', () => {
  it('defines the initial score dimensions', () => {
    expect(SCORE_DIMENSIONS).toEqual([
      'core',
      'endurance',
      'strength',
      'mobility',
      'posture',
      'pelvic_control',
      'grip',
      'recovery',
      'fatigue',
    ]);
  });

  it('scores a workout session from type, capabilities, duration, and exercises', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[0].sessions[1];
    const score = scoreWorkoutSession(session);

    expect(score.dimensions.strength).toBeGreaterThan(0);
    expect(score.dimensions.core).toBeGreaterThan(0);
    expect(score.dimensions.posture).toBeGreaterThan(0);
    expect(score.dimensions.fatigue).toBeGreaterThan(0);
    expect(score.total).toBeGreaterThan(score.dimensions.strength);
    expect(score.explanations.some((explanation) => explanation.message.includes(session.title))).toBe(true);
  });

  it('adds explicit session fatigue estimates when available', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[0].sessions[0];
    const baseline = scoreWorkoutSession(session);
    const scored = scoreWorkoutSession(session, {
      sessionFatigueEstimates: {
        [session.id]: 3,
      },
    });

    expect(scored.dimensions.fatigue).toBe(baseline.dimensions.fatigue + 3);
    expect(scored.explanations).toContainEqual(
      expect.objectContaining({
        dimension: 'fatigue',
        message: 'Explicit session fatigue estimate was provided.',
        points: 3,
      }),
    );
  });

  it('scores a training day by aggregating its sessions and day fatigue estimates', () => {
    const day = PROJECT45_WEEKLY_SEED_PLAN.days[0];
    const sessionScores = day.sessions.map((session) => scoreWorkoutSession(session));
    const baselineFatigue = sessionScores.reduce(
      (total, score) => total + score.dimensions.fatigue,
      0,
    );
    const scored = scoreTrainingDay(day, {
      dayFatigueEstimates: {
        [day.dayIndex]: 2,
      },
    });

    expect(scored.dimensions.fatigue).toBe(baselineFatigue + 2);
    expect(scored.explanations.some((explanation) => explanation.message.startsWith(`Day ${day.dayIndex}:`))).toBe(true);
  });

  it('scores a workout plan by aggregating day scores', () => {
    const score = scoreWorkoutPlan(PROJECT45_WEEKLY_SEED_PLAN);
    const dayTotal = score.dayScores.reduce((total, dayScore) => total + dayScore.total, 0);

    expect(score.dayScores).toHaveLength(PROJECT45_WEEKLY_SEED_PLAN.days.length);
    expect(score.total).toBeCloseTo(dayTotal, 1);
    expect(score.dimensions.endurance).toBeGreaterThan(0);
    expect(score.dimensions.recovery).toBeGreaterThan(0);
    expect(score.explanations.length).toBeGreaterThan(score.dayScores.length);
  });
});
