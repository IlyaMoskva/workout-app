import { PROJECT45_EXERCISES } from '../exercises/catalog';
import type { EquipmentId, Exercise, ExerciseId, ExerciseRiskLevel } from '../exercises/exercise.types';
import type { LocationType, WorkoutPlan, WorkoutSession } from './workout.types';

export type ConstraintOutcome = 'pass' | 'warn' | 'fail';

export type PlanningConstraint = Readonly<{
  id: string;
  availableEquipment?: readonly EquipmentId[];
  allowedLocations?: readonly LocationType[];
  maxRiskLevel?: ExerciseRiskLevel;
  excludedExerciseIds?: readonly ExerciseId[];
}>;

export type ConstraintResult = Readonly<{
  constraintId: string;
  outcome: ConstraintOutcome;
  message: string;
  explanation: string;
  dayIndex?: number;
  sessionId?: string;
  exerciseId?: ExerciseId;
  suggestedExerciseIds?: readonly ExerciseId[];
}>;

export type ConstraintEvaluationInput = Readonly<{
  plan: WorkoutPlan;
  constraint: PlanningConstraint;
  exercises?: readonly Exercise[];
}>;

const riskRank: Readonly<Record<ExerciseRiskLevel, number>> = {
  low: 1,
  medium: 2,
  high: 3,
};

const homeFriendlyEquipment = new Set<EquipmentId>([
  'bodyweight',
  'floor_mat',
  'dumbbells',
  'ab_wheel',
  'outdoor',
]);

const pass = (constraint: PlanningConstraint): ConstraintResult => ({
  constraintId: constraint.id,
  outcome: 'pass',
  message: 'Workout plan satisfies the planning constraint.',
  explanation: 'No equipment, location, risk, or excluded-exercise constraint issues were found.',
});

const exerciseSatisfiesConstraint = (
  exercise: Exercise,
  constraint: PlanningConstraint,
): boolean => {
  const availableEquipment = constraint.availableEquipment;
  const excludedExerciseIds = new Set(constraint.excludedExerciseIds ?? []);
  const maxRiskLevel = constraint.maxRiskLevel;

  if (excludedExerciseIds.has(exercise.id)) {
    return false;
  }

  if (
    availableEquipment &&
    !exercise.equipment.required.every((equipmentId) => availableEquipment.includes(equipmentId))
  ) {
    return false;
  }

  if (maxRiskLevel && riskRank[exercise.risk.level] > riskRank[maxRiskLevel]) {
    return false;
  }

  return true;
};

export const resolveExerciseSubstitutions = (
  exerciseId: ExerciseId,
  constraint: PlanningConstraint,
  exercises: readonly Exercise[] = PROJECT45_EXERCISES,
): readonly Exercise[] => {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const exercise = exerciseById.get(exerciseId);

  if (!exercise?.substitutions) {
    return [];
  }

  return exercise.substitutions
    .map((substitutionId) => exerciseById.get(substitutionId))
    .filter((substitution): substitution is Exercise => Boolean(substitution))
    .filter((substitution) => exerciseSatisfiesConstraint(substitution, constraint));
};

const getExercise = (
  exerciseId: ExerciseId,
  exerciseById: ReadonlyMap<ExerciseId, Exercise>,
): Exercise | undefined => exerciseById.get(exerciseId);

const requiredEquipmentIsAvailable = (
  exercise: Exercise,
  availableEquipment: readonly EquipmentId[],
): boolean => exercise.equipment.required.every((equipmentId) => availableEquipment.includes(equipmentId));

const exerciseIsGymOnly = (exercise: Exercise): boolean =>
  exercise.equipment.required.some((equipmentId) => !homeFriendlyEquipment.has(equipmentId));

const suggestionIds = (
  exerciseId: ExerciseId,
  constraint: PlanningConstraint,
  exercises: readonly Exercise[],
): readonly ExerciseId[] =>
  resolveExerciseSubstitutions(exerciseId, constraint, exercises).map((exercise) => exercise.id);

const resultForExercise = (
  constraint: PlanningConstraint,
  session: WorkoutSession,
  dayIndex: number,
  exercise: Exercise,
  message: string,
  explanation: string,
  exercises: readonly Exercise[],
): ConstraintResult => ({
  constraintId: constraint.id,
  outcome: 'warn',
  message,
  explanation,
  dayIndex,
  sessionId: session.id,
  exerciseId: exercise.id,
  suggestedExerciseIds: suggestionIds(exercise.id, constraint, exercises),
});

export const evaluatePlanningConstraint = ({
  plan,
  constraint,
  exercises = PROJECT45_EXERCISES,
}: ConstraintEvaluationInput): readonly ConstraintResult[] => {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const results: ConstraintResult[] = [];
  const excludedExerciseIds = new Set(constraint.excludedExerciseIds ?? []);

  for (const day of plan.days) {
    for (const session of day.sessions) {
      if (constraint.allowedLocations && !constraint.allowedLocations.includes(session.location)) {
        results.push({
          constraintId: constraint.id,
          outcome: 'fail',
          message: `Session "${session.title}" uses disallowed location "${session.location}".`,
          explanation: `Allowed locations are: ${constraint.allowedLocations.join(', ')}.`,
          dayIndex: day.dayIndex,
          sessionId: session.id,
        });
      }

      for (const block of session.blocks) {
        for (const prescription of block.prescriptions) {
          const exercise = getExercise(prescription.exerciseId, exerciseById);

          if (!exercise) {
            continue;
          }

          if (
            constraint.availableEquipment &&
            !requiredEquipmentIsAvailable(exercise, constraint.availableEquipment)
          ) {
            const missingEquipment = exercise.equipment.required.filter(
              (equipmentId) => !constraint.availableEquipment?.includes(equipmentId),
            );

            results.push(
              resultForExercise(
                constraint,
                session,
                day.dayIndex,
                exercise,
                `Exercise "${exercise.name}" needs unavailable equipment.`,
                `Missing required equipment: ${missingEquipment.join(', ')}.`,
                exercises,
              ),
            );
          }

          if (session.location === 'home' && exerciseIsGymOnly(exercise)) {
            results.push(
              resultForExercise(
                constraint,
                session,
                day.dayIndex,
                exercise,
                `Exercise "${exercise.name}" looks gym-only for a home session.`,
                `Home sessions should avoid required equipment such as ${exercise.equipment.required.join(', ')}.`,
                exercises,
              ),
            );
          }

          if (excludedExerciseIds.has(exercise.id)) {
            results.push(
              resultForExercise(
                constraint,
                session,
                day.dayIndex,
                exercise,
                `Exercise "${exercise.name}" is excluded by constraint.`,
                'Use a catalog substitution if one is available and satisfies the same constraint.',
                exercises,
              ),
            );
          }

          if (constraint.maxRiskLevel && riskRank[exercise.risk.level] > riskRank[constraint.maxRiskLevel]) {
            results.push(
              resultForExercise(
                constraint,
                session,
                day.dayIndex,
                exercise,
                `Exercise "${exercise.name}" exceeds the allowed risk level.`,
                `Exercise risk is ${exercise.risk.level}; allowed maximum is ${constraint.maxRiskLevel}.`,
                exercises,
              ),
            );
          }

          if (session.type === 'recovery' && exercise.risk.level === 'high') {
            results.push(
              resultForExercise(
                constraint,
                session,
                day.dayIndex,
                exercise,
                `High-risk exercise "${exercise.name}" appears in a recovery session.`,
                'Recovery sessions should stay low stress unless a coach explicitly overrides the plan.',
                exercises,
              ),
            );
          }
        }
      }
    }
  }

  return results.length > 0 ? results : [pass(constraint)];
};
