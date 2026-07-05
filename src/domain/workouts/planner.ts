import type { EquipmentId } from '../exercises/exercise.types';
import type { CapabilityId, GoalId } from '../goals/goal.types';
import { PROJECT45_WEEKLY_SEED_PLAN } from './weeklySeedPlan';
import type { LocationType, WorkoutPlan } from './workout.types';

export type PlanningConstraints = Readonly<{
  availableDayIndexes?: readonly number[];
  availableEquipment?: readonly EquipmentId[];
  preferredLocations?: readonly LocationType[];
  maxSessionDurationMinutes?: number;
  maxWeeklyDurationMinutes?: number;
}>;

export type PlanningContext = Readonly<{
  goals: readonly GoalId[];
  capabilities?: readonly CapabilityId[];
  constraints?: PlanningConstraints;
  startDate?: string;
}>;

export type Planner = Readonly<{
  plan: (context: PlanningContext) => WorkoutPlan;
}>;

export const project45SeedPlanner: Planner = {
  plan: () => PROJECT45_WEEKLY_SEED_PLAN,
};

export const planProject45Week = (context: PlanningContext): WorkoutPlan =>
  project45SeedPlanner.plan(context);
