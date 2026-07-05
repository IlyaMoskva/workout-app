import { describe, expect, it } from 'vitest';
import {
  WORKOUT_LIFECYCLE_STATES,
  complete,
  pause,
  resume,
  skip,
  start,
} from './lifecycle';
import type {
  WorkoutLifecycleResult,
  WorkoutLifecycleState,
  WorkoutLifecycleTransition,
} from './lifecycle';

const transitions: Readonly<
  Record<WorkoutLifecycleTransition, (state: WorkoutLifecycleState) => WorkoutLifecycleResult>
> = {
  start,
  pause,
  resume,
  complete,
  skip,
};

const legalTransitions: readonly Readonly<{
  transition: WorkoutLifecycleTransition;
  from: WorkoutLifecycleState;
  to: WorkoutLifecycleState;
}>[] = [
  { transition: 'start', from: 'Planned', to: 'Started' },
  { transition: 'pause', from: 'Started', to: 'Paused' },
  { transition: 'resume', from: 'Paused', to: 'Started' },
  { transition: 'complete', from: 'Started', to: 'Completed' },
  { transition: 'complete', from: 'Paused', to: 'Completed' },
  { transition: 'skip', from: 'Planned', to: 'Skipped' },
  { transition: 'skip', from: 'Started', to: 'Skipped' },
  { transition: 'skip', from: 'Paused', to: 'Skipped' },
];

const legalKey = (
  transition: WorkoutLifecycleTransition,
  from: WorkoutLifecycleState,
): string => `${transition}:${from}`;

const legalTransitionKeys = new Set(
  legalTransitions.map(({ transition, from }) => legalKey(transition, from)),
);

describe('workout lifecycle', () => {
  it('defines the deterministic workout lifecycle states', () => {
    expect(WORKOUT_LIFECYCLE_STATES).toEqual([
      'Planned',
      'Started',
      'Paused',
      'Completed',
      'Skipped',
    ]);
  });

  it.each(legalTransitions)('$transition transitions $from to $to', ({ transition, from, to }) => {
    expect(transitions[transition](from)).toEqual({
      ok: true,
      transition,
      from,
      to,
    });
  });

  it('fails every illegal transition without changing state', () => {
    const illegalCases = Object.keys(transitions).flatMap((transition) =>
      WORKOUT_LIFECYCLE_STATES
        .filter(
          (state) =>
            !legalTransitionKeys.has(
              legalKey(transition as WorkoutLifecycleTransition, state),
            ),
        )
        .map((state) => ({
          transition: transition as WorkoutLifecycleTransition,
          from: state,
        })),
    );

    expect(illegalCases).toHaveLength(17);

    for (const { transition, from } of illegalCases) {
      expect(transitions[transition](from)).toEqual({
        ok: false,
        transition,
        from,
        reason: `Cannot ${transition} workout from ${from} state.`,
      });
    }
  });

  it('supports a normal start pause resume complete flow with pure results', () => {
    const started = start('Planned');
    expect(started).toEqual({ ok: true, transition: 'start', from: 'Planned', to: 'Started' });

    const paused = started.ok ? pause(started.to) : started;
    expect(paused).toEqual({ ok: true, transition: 'pause', from: 'Started', to: 'Paused' });

    const resumed = paused.ok ? resume(paused.to) : paused;
    expect(resumed).toEqual({ ok: true, transition: 'resume', from: 'Paused', to: 'Started' });

    const completed = resumed.ok ? complete(resumed.to) : resumed;
    expect(completed).toEqual({ ok: true, transition: 'complete', from: 'Started', to: 'Completed' });
  });
});
