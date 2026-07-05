export const WORKOUT_LIFECYCLE_STATES = [
  'Planned',
  'Started',
  'Paused',
  'Completed',
  'Skipped',
] as const;

export type WorkoutLifecycleState = (typeof WORKOUT_LIFECYCLE_STATES)[number];

export const WORKOUT_LIFECYCLE_TRANSITIONS = [
  'start',
  'pause',
  'resume',
  'complete',
  'skip',
] as const;

export type WorkoutLifecycleTransition = (typeof WORKOUT_LIFECYCLE_TRANSITIONS)[number];

export type WorkoutLifecycleSuccess = Readonly<{
  ok: true;
  from: WorkoutLifecycleState;
  to: WorkoutLifecycleState;
  transition: WorkoutLifecycleTransition;
}>;

export type WorkoutLifecycleFailure = Readonly<{
  ok: false;
  from: WorkoutLifecycleState;
  transition: WorkoutLifecycleTransition;
  reason: string;
}>;

export type WorkoutLifecycleResult = WorkoutLifecycleSuccess | WorkoutLifecycleFailure;

const allowedTransitions: Readonly<
  Record<WorkoutLifecycleTransition, Partial<Record<WorkoutLifecycleState, WorkoutLifecycleState>>>
> = {
  start: {
    Planned: 'Started',
  },
  pause: {
    Started: 'Paused',
  },
  resume: {
    Paused: 'Started',
  },
  complete: {
    Started: 'Completed',
    Paused: 'Completed',
  },
  skip: {
    Planned: 'Skipped',
    Started: 'Skipped',
    Paused: 'Skipped',
  },
};

const transitionWorkout = (
  from: WorkoutLifecycleState,
  transition: WorkoutLifecycleTransition,
): WorkoutLifecycleResult => {
  const to = allowedTransitions[transition][from];

  if (!to) {
    return {
      ok: false,
      from,
      transition,
      reason: `Cannot ${transition} workout from ${from} state.`,
    };
  }

  return {
    ok: true,
    from,
    to,
    transition,
  };
};

export const start = (from: WorkoutLifecycleState): WorkoutLifecycleResult =>
  transitionWorkout(from, 'start');

export const pause = (from: WorkoutLifecycleState): WorkoutLifecycleResult =>
  transitionWorkout(from, 'pause');

export const resume = (from: WorkoutLifecycleState): WorkoutLifecycleResult =>
  transitionWorkout(from, 'resume');

export const complete = (from: WorkoutLifecycleState): WorkoutLifecycleResult =>
  transitionWorkout(from, 'complete');

export const skip = (from: WorkoutLifecycleState): WorkoutLifecycleResult =>
  transitionWorkout(from, 'skip');
