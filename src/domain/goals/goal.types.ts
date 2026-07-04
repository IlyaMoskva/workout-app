export type GoalId =
  | 'gto_gold'
  | 'endurance'
  | 'pelvic_floor'
  | 'hyperlordosis'
  | 'core_strength'
  | 'relief'
  | 'hiking'
  | 'climbing';

export type CapabilityId =
  | 'strength'
  | 'endurance'
  | 'speed'
  | 'mobility'
  | 'core'
  | 'posture'
  | 'pelvic_control'
  | 'grip'
  | 'recovery';

export type GoalPriority = 'primary' | 'secondary' | 'supporting';

export type Goal = {
  id: GoalId;
  name: string;
  priority: GoalPriority;
  targetDate?: string;
};

export type Capability = {
  id: CapabilityId;
  name: string;
  description: string;
};
