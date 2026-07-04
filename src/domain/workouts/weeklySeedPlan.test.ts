import { describe, expect, it } from 'vitest';
import { PROJECT45_EXERCISES, PROJECT45_WEEKLY_SEED_PLAN } from '..';

describe('PROJECT45_WEEKLY_SEED_PLAN', () => {
  it('references only existing exercise ids', () => {
    const knownExerciseIds = new Set(PROJECT45_EXERCISES.map((exercise) => exercise.id));

    for (const day of PROJECT45_WEEKLY_SEED_PLAN.days) {
      for (const session of day.sessions) {
        for (const block of session.blocks) {
          for (const prescription of block.prescriptions) {
            expect(knownExerciseIds.has(prescription.exerciseId)).toBe(true);
          }
        }
      }
    }
  });
});
