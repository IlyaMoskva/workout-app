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

export type Goal = {
  id: GoalId;
  name: string;
  priority: 'primary' | 'secondary' | 'supporting';
  targetDate?: string;
};
