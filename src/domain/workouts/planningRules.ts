import type { PlanningContext } from './planner';
import type { TrainingDay, WorkoutBlock, WorkoutPlan, WorkoutSession } from './workout.types';

export type RuleOutcome = 'pass' | 'warn' | 'fail' | 'recommendation';
export type RuleSeverity = 'info' | 'warning' | 'blocking';

export type RuleResult = Readonly<{
  ruleId: string;
  outcome: RuleOutcome;
  severity: RuleSeverity;
  message: string;
  explanation: string;
  dayIndex?: number;
  sessionId?: string;
}>;

export type PlanningRuleInput = Readonly<{
  plan?: WorkoutPlan;
  context?: PlanningContext;
}>;

export type PlanningRule = Readonly<{
  id: string;
  description: string;
  evaluate: (input: PlanningRuleInput) => readonly RuleResult[];
}>;

const pass = (rule: PlanningRule, message: string, explanation: string): RuleResult => ({
  ruleId: rule.id,
  outcome: 'pass',
  severity: 'info',
  message,
  explanation,
});

const textIncludes = (value: string | undefined, tokens: readonly string[]): boolean => {
  const normalized = value?.toLowerCase() ?? '';

  return tokens.some((token) => normalized.includes(token));
};

const notesInclude = (notes: readonly string[] | undefined, tokens: readonly string[]): boolean =>
  notes?.some((note) => textIncludes(note, tokens)) ?? false;

const sessionTextIncludes = (session: WorkoutSession, tokens: readonly string[]): boolean =>
  textIncludes(session.title, tokens) ||
  notesInclude(session.notes, tokens) ||
  session.blocks.some(
    (block) =>
      textIncludes(block.name, tokens) ||
      notesInclude(block.notes, tokens) ||
      block.prescriptions.some((prescription) => notesInclude(prescription.notes, tokens)),
  );

const dayHasSession = (
  day: TrainingDay,
  predicate: (session: WorkoutSession) => boolean,
): boolean => day.sessions.some(predicate);

const isRunningSession = (session: WorkoutSession): boolean =>
  session.type === 'cardio' && sessionTextIncludes(session, ['run', 'running', 'interval']);

const isHardRunningSession = (session: WorkoutSession): boolean =>
  isRunningSession(session) &&
  (sessionTextIncludes(session, ['hard', 'interval', 'tempo', 'test']) ||
    session.blocks.some((block) =>
      block.prescriptions.some(
        (prescription) =>
          (prescription.intensity?.rpe ?? 0) >= 7 ||
          textIncludes(prescription.intensity?.zone, ['hard', 'interval', 'tempo', 'zone-4', 'zone-5']),
      ),
    ));

const isRunningIntervalSession = (session: WorkoutSession): boolean =>
  isRunningSession(session) && sessionTextIncludes(session, ['interval', 'repeat', 'sprint']);

const lowerBodyExerciseIds = new Set([
  'goblet-squat',
  'romanian-deadlift',
  'step-up',
  'walking-lunge',
  'kettlebell-swing',
]);

const isHeavyLowerBodyBlock = (block: WorkoutBlock): boolean =>
  block.prescriptions.some(
    (prescription) =>
      lowerBodyExerciseIds.has(prescription.exerciseId) &&
      ((prescription.intensity?.rpe ?? 0) >= 7 || textIncludes(prescription.load, ['heavy'])),
  );

const isHeavyLowerBodyStrengthSession = (session: WorkoutSession): boolean =>
  session.type === 'strength' &&
  (sessionTextIncludes(session, ['lower body', 'leg']) || session.blocks.some(isHeavyLowerBodyBlock));

const activationExerciseIds = new Set([
  'dead-bug',
  'glute-bridge',
  'heel-slide',
  'pallof-press',
  'pelvic-floor-breathing',
  'plank',
  'side-plank',
]);

const isCoreActivationBlock = (block: WorkoutBlock): boolean =>
  block.type === 'warmup' ||
  block.type === 'prehab' ||
  textIncludes(block.name, ['activation', 'brace', 'core']) ||
  block.prescriptions.some((prescription) => activationExerciseIds.has(prescription.exerciseId));

const hasAbWheelWork = (block: WorkoutBlock): boolean =>
  block.prescriptions.some((prescription) => prescription.exerciseId === 'ab-wheel');

const dayIsRecoveryOrLight = (day: TrainingDay): boolean => {
  const estimatedMinutes = day.sessions.reduce(
    (total, session) => total + (session.estimatedDurationMinutes ?? 0),
    0,
  );
  const hasHardSession = day.sessions.some(
    (session) =>
      isHardRunningSession(session) ||
      isHeavyLowerBodyStrengthSession(session) ||
      session.blocks.some((block) =>
        block.prescriptions.some((prescription) => (prescription.intensity?.rpe ?? 0) >= 7),
      ),
  );
  const allRecoveryTypes = day.sessions.every((session) =>
    ['recovery', 'mobility'].includes(session.type),
  );

  return allRecoveryTypes || (!hasHardSession && estimatedMinutes > 0 && estimatedMinutes <= 35);
};

export const avoidBackToBackHardRunningDaysRule: PlanningRule = {
  id: 'avoid-back-to-back-hard-running-days',
  description: 'Avoid scheduling two hard running days back to back.',
  evaluate: ({ plan }) => {
    if (!plan) {
      return [pass(avoidBackToBackHardRunningDaysRule, 'No workout plan to evaluate.', 'This rule needs a workout plan.')];
    }

    const sortedDays = [...plan.days].sort((left, right) => left.dayIndex - right.dayIndex);
    const results: RuleResult[] = [];

    for (let index = 1; index < sortedDays.length; index += 1) {
      const previousDay = sortedDays[index - 1];
      const currentDay = sortedDays[index];

      if (
        currentDay.dayIndex === previousDay.dayIndex + 1 &&
        dayHasSession(previousDay, isHardRunningSession) &&
        dayHasSession(currentDay, isHardRunningSession)
      ) {
        results.push({
          ruleId: avoidBackToBackHardRunningDaysRule.id,
          outcome: 'warn',
          severity: 'warning',
          message: `Hard running days are back to back on days ${previousDay.dayIndex} and ${currentDay.dayIndex}.`,
          explanation: 'Stacking hard running days can raise fatigue and injury risk without a recovery buffer.',
          dayIndex: currentDay.dayIndex,
        });
      }
    }

    return results.length > 0
      ? results
      : [
          pass(
            avoidBackToBackHardRunningDaysRule,
            'No back-to-back hard running days found.',
            'Hard running sessions have at least one day of separation.',
          ),
        ];
  },
};

export const avoidHeavyLowerBodyAfterRunningIntervalsRule: PlanningRule = {
  id: 'avoid-heavy-lower-body-after-running-intervals',
  description: 'Avoid heavy lower-body strength the day after running intervals.',
  evaluate: ({ plan }) => {
    if (!plan) {
      return [pass(avoidHeavyLowerBodyAfterRunningIntervalsRule, 'No workout plan to evaluate.', 'This rule needs a workout plan.')];
    }

    const sortedDays = [...plan.days].sort((left, right) => left.dayIndex - right.dayIndex);
    const results: RuleResult[] = [];

    for (let index = 1; index < sortedDays.length; index += 1) {
      const previousDay = sortedDays[index - 1];
      const currentDay = sortedDays[index];

      if (
        currentDay.dayIndex === previousDay.dayIndex + 1 &&
        dayHasSession(previousDay, isRunningIntervalSession) &&
        dayHasSession(currentDay, isHeavyLowerBodyStrengthSession)
      ) {
        results.push({
          ruleId: avoidHeavyLowerBodyAfterRunningIntervalsRule.id,
          outcome: 'warn',
          severity: 'warning',
          message: `Heavy lower-body strength follows running intervals on day ${currentDay.dayIndex}.`,
          explanation: 'Intervals and heavy lower-body work both load the legs heavily; add recovery or upper-body work between them.',
          dayIndex: currentDay.dayIndex,
        });
      }
    }

    return results.length > 0
      ? results
      : [
          pass(
            avoidHeavyLowerBodyAfterRunningIntervalsRule,
            'No heavy lower-body day immediately follows running intervals.',
            'Lower-body strength is not placed directly after interval running.',
          ),
        ];
  },
};

export const coreActivationBeforeAbWheelRule: PlanningRule = {
  id: 'core-activation-before-ab-wheel',
  description: 'Keep hyperlordosis/core activation before ab wheel work.',
  evaluate: ({ plan }) => {
    if (!plan) {
      return [pass(coreActivationBeforeAbWheelRule, 'No workout plan to evaluate.', 'This rule needs a workout plan.')];
    }

    const results: RuleResult[] = [];

    for (const day of plan.days) {
      for (const session of day.sessions) {
        let hasActivation = false;

        for (const block of session.blocks) {
          if (hasAbWheelWork(block) && !hasActivation) {
            results.push({
              ruleId: coreActivationBeforeAbWheelRule.id,
              outcome: 'fail',
              severity: 'blocking',
              message: `Ab wheel work lacks prior activation in "${session.title}".`,
              explanation: 'Ab wheel work should follow bracing or hyperlordosis-focused activation to reduce extension compensation.',
              dayIndex: day.dayIndex,
              sessionId: session.id,
            });
          }

          hasActivation = hasActivation || isCoreActivationBlock(block);
        }
      }
    }

    return results.length > 0
      ? results
      : [
          pass(
            coreActivationBeforeAbWheelRule,
            'Ab wheel work has prior core activation or is absent.',
            'Every detected ab wheel block is preceded by an activation block in its session.',
          ),
        ];
  },
};

export const flagPoorRecoveryRule: PlanningRule = {
  id: 'flag-poor-recovery',
  description: 'Flag poor recovery when recovery data is available.',
  evaluate: ({ context }) => {
    const recovery = context?.recovery;

    if (!recovery) {
      return [
        {
          ruleId: flagPoorRecoveryRule.id,
          outcome: 'recommendation',
          severity: 'info',
          message: 'No recovery data provided.',
          explanation: 'Add readiness, sleep, soreness, or fatigue data to evaluate recovery risk.',
        },
      ];
    }

    const hasPoorReadiness = recovery.readiness === 'poor';
    const hasLowSleep = recovery.sleepHours !== undefined && recovery.sleepHours < 6;
    const hasHighSoreness = recovery.sorenessLevel !== undefined && recovery.sorenessLevel >= 8;
    const hasHighFatigue = recovery.fatigueLevel !== undefined && recovery.fatigueLevel >= 8;

    if (hasPoorReadiness || hasLowSleep || hasHighSoreness || hasHighFatigue) {
      return [
        {
          ruleId: flagPoorRecoveryRule.id,
          outcome: 'warn',
          severity: 'warning',
          message: 'Recovery data suggests reducing training stress.',
          explanation: 'Poor readiness, short sleep, high soreness, or high fatigue should bias the plan toward lighter work.',
        },
      ];
    }

    return [
      pass(
        flagPoorRecoveryRule,
        'Recovery data does not indicate elevated risk.',
        'Readiness, sleep, soreness, and fatigue are within the starter rule thresholds.',
      ),
    ];
  },
};

export const ensureWeeklyRecoveryDayRule: PlanningRule = {
  id: 'ensure-weekly-recovery-day',
  description: 'Ensure every week has at least one recovery or light day.',
  evaluate: ({ plan }) => {
    if (!plan) {
      return [pass(ensureWeeklyRecoveryDayRule, 'No workout plan to evaluate.', 'This rule needs a workout plan.')];
    }

    const recoveryDay = plan.days.find(dayIsRecoveryOrLight);

    return recoveryDay
      ? [
          pass(
            ensureWeeklyRecoveryDayRule,
            `Day ${recoveryDay.dayIndex} qualifies as a recovery or light day.`,
            'The plan includes at least one low-stress day in the week.',
          ),
        ]
      : [
          {
            ruleId: ensureWeeklyRecoveryDayRule.id,
            outcome: 'warn',
            severity: 'warning',
            message: 'No recovery or light day found in the week.',
            explanation: 'A weekly plan should include at least one low-stress day to support adaptation and consistency.',
          },
        ];
  },
};

export const STARTER_PLANNING_RULES = [
  avoidBackToBackHardRunningDaysRule,
  avoidHeavyLowerBodyAfterRunningIntervalsRule,
  coreActivationBeforeAbWheelRule,
  flagPoorRecoveryRule,
  ensureWeeklyRecoveryDayRule,
] as const satisfies readonly PlanningRule[];

export const runPlanningRules = (
  input: PlanningRuleInput,
  rules: readonly PlanningRule[] = STARTER_PLANNING_RULES,
): readonly RuleResult[] => rules.flatMap((rule) => rule.evaluate(input));
