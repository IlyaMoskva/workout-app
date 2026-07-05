export type {
  Capability,
  CapabilityId,
  Goal,
  GoalId,
  GoalPriority,
} from './goals/goal.types';
export { CAPABILITY_IDS, GOAL_IDS } from './goals/goal.types';

export type {
  EquipmentId,
  EquipmentRequirement,
  Exercise,
  ExerciseId,
  ExerciseMeasurement,
  ExerciseModality,
  ExerciseRisk,
  ExerciseRiskLevel,
  MuscleGroup,
  MuscleTarget,
} from './exercises/exercise.types';
export { EQUIPMENT_IDS, MUSCLE_GROUPS, RISK_LEVELS } from './exercises/exercise.types';
export type { Project45Exercise } from './exercises/catalog';
export { PROJECT45_EXERCISES } from './exercises/catalog';

export type {
  BlockType,
  ExercisePrescription,
  LocationType,
  PrescriptionIntensity,
  SessionType,
  TrainingDay,
  TrainingDayId,
  WorkoutBlock,
  WorkoutBlockId,
  WorkoutPlan,
  WorkoutPlanId,
  WorkoutSession,
  WorkoutSessionId,
} from './workouts';
export type {
  ConstraintEvaluationInput,
  ConstraintOutcome,
  ConstraintResult,
  Planner,
  PlanningConstraint,
  PlanningConstraints,
  PlanningContext,
  PlanningRecoveryData,
  PlanningRule,
  PlanningRuleInput,
  Project45WeeklySeedPlan,
  RecoveryReadiness,
  PlanScore,
  ScoreByDimension,
  ScoreDimension,
  ScoreExplanation,
  RuleOutcome,
  RuleResult,
  RuleSeverity,
  WorkoutScore,
  WorkoutScoringOptions,
} from './workouts';
export {
  BLOCK_TYPES,
  LOCATION_TYPES,
  PROJECT45_WEEKLY_SEED_PLAN,
  SESSION_TYPES,
  evaluatePlanningConstraint,
  STARTER_PLANNING_RULES,
  avoidBackToBackHardRunningDaysRule,
  avoidHeavyLowerBodyAfterRunningIntervalsRule,
  coreActivationBeforeAbWheelRule,
  ensureWeeklyRecoveryDayRule,
  flagPoorRecoveryRule,
  planProject45Week,
  project45SeedPlanner,
  resolveExerciseSubstitutions,
  runPlanningRules,
  SCORE_DIMENSIONS,
  scoreTrainingDay,
  scoreWorkoutPlan,
  scoreWorkoutSession,
} from './workouts';
