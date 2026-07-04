import { describe, expect, it } from 'vitest';
import { PROJECT45_WEEKLY_SEED_PLAN } from '../domain';
import { completionId } from './completionId';

describe('completionId', () => {
  it('is deterministic for the same date, session, block, and exercise', () => {
    const session = PROJECT45_WEEKLY_SEED_PLAN.days[0].sessions[0];
    const block = session.blocks[0];
    const prescription = block.prescriptions[0];

    expect(completionId('2026-07-04', session, block, prescription)).toBe(
      completionId('2026-07-04', session, block, prescription),
    );
    expect(completionId('2026-07-04', session, block, prescription)).toBe(
      `2026-07-04:${session.id}:${block.id}:${prescription.exerciseId}`,
    );
  });
});
