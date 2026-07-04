import type { ExercisePrescription, WorkoutBlock, WorkoutSession } from '../domain';

export const completionId = (
  dateKey: string,
  session: WorkoutSession,
  block: WorkoutBlock,
  prescription: ExercisePrescription,
): string => `${dateKey}:${session.id}:${block.id}:${prescription.exerciseId}`;
