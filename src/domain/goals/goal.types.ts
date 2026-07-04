export const GOAL_IDS = [
  'gto_gold',
  'endurance',
  'pelvic_floor',
  'hyperlordosis',
  'core_strength',
  'relief',
  'hiking',
  'climbing',
] as const;

export type GoalId = (typeof GOAL_IDS)[number];

export const CAPABILITY_IDS = [
  'strength',
  'endurance',
  'speed',
  'mobility',
  'core',
  'posture',
  'pelvic_control',
  'grip',
  'recovery',
] as const;

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export type GoalPriority = 'primary' | 'secondary' | 'supporting';

export type Goal = Readonly<{
  id: GoalId;
  name: string;
  description?: string;
  priority: GoalPriority;
  capabilities: readonly CapabilityId[];
  targetDate?: string;
}>;

export type Capability = Readonly<{
  id: CapabilityId;
  name: string;
  description: string;
}>;
