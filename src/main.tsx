import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  EQUIPMENT_IDS,
  GOAL_IDS,
  PROJECT45_EXERCISES,
  PROJECT45_WEEKLY_SEED_PLAN,
  type EquipmentId,
  type ExercisePrescription,
  type GoalId,
  type Project45Exercise,
  type TrainingDay,
  type WorkoutBlock,
  type WorkoutPlan,
  type WorkoutSession,
} from './domain';
import { completionId } from './completion/completionId';
import {
  APP_NAV_ITEMS,
  APP_VERSION_LABEL,
  BACKUP_SCHEMA,
  BACKUP_VERSION,
  COMPLETION_STORAGE_KEY,
  GTO_STORAGE_KEY,
  LOCAL_DATA_KEYS,
  RECOVERY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  type AppView,
  type LocalDataKey,
} from './mvp';
import './styles.css';

type GtoMetricId = 'run2KmSeconds' | 'pushUps' | 'pullUps' | 'absOneMinute' | 'sitAndReachCm';
type RecoveryMetricId = 'sleepHours' | 'energy' | 'soreness' | 'stress' | 'libido' | 'readiness';
type SessionSlotId = 'morningHome' | 'workBreak' | 'eveningGymOutdoor';
type HistoryDayStatus = 'complete' | 'partial' | 'missed' | 'open';
type GtoEntry = Readonly<{
  id: string;
  date: string;
  run2KmSeconds?: number;
  pushUps?: number;
  pullUps?: number;
  absOneMinute?: number;
  sitAndReachCm?: number;
}>;
type RecoveryEntry = Readonly<{
  id: string;
  date: string;
  sleepHours: number;
  energy: number;
  soreness: number;
  stress: number;
  libido?: number;
  readiness?: number;
}>;
type GtoFormState = Record<GtoMetricId, string>;
type RecoveryFormState = Record<RecoveryMetricId, string>;
type UserSettings = Readonly<{
  activeGoals: readonly GoalId[];
  availableEquipment: readonly EquipmentId[];
  preferredSessionSlots: Readonly<Record<SessionSlotId, boolean>>;
}>;
type HistoryDaySummary = Readonly<{
  completedCount: number;
  date: Date;
  dateKey: string;
  progress: number;
  status: HistoryDayStatus;
  totalCount: number;
  trainingDay: TrainingDay;
}>;
type BackupStatus = Readonly<{
  message: string;
  type: 'success' | 'error';
}>;
type Project45Backup = Readonly<{
  schema: 'project45-local-backup';
  version: 1;
  exportedAt: string;
  data: Partial<Record<LocalDataKey, unknown>>;
  history: readonly Readonly<{
    completedCount: number;
    dateKey: string;
    progress: number;
    status: HistoryDayStatus;
    totalCount: number;
    trainingDayTitle: string;
  }>[];
}>;
type GtoMetric = Readonly<{
  id: GtoMetricId;
  label: string;
  targetLabel: string;
  targetValue: number;
  unit: string;
  better: 'lower' | 'higher';
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  format: (value: number) => string;
  parse: (value: string) => number | undefined;
}>;

const SESSION_SLOT_OPTIONS = [
  {
    id: 'morningHome',
    label: 'Morning home',
    detail: 'Short home work before the day starts.',
  },
  {
    id: 'workBreak',
    label: 'Work break',
    detail: 'Small mobility or control session during the day.',
  },
  {
    id: 'eveningGymOutdoor',
    label: 'Evening gym/outdoor',
    detail: 'Main gym, run, or outdoor session after work.',
  },
] as const satisfies readonly { id: SessionSlotId; label: string; detail: string }[];

const DEFAULT_SETTINGS: UserSettings = {
  activeGoals: PROJECT45_WEEKLY_SEED_PLAN.goals,
  availableEquipment: ['bodyweight', 'floor_mat', 'dumbbells', 'cable_machine', 'lat_pulldown', 'gym_bench', 'outdoor'],
  preferredSessionSlots: {
    morningHome: true,
    workBreak: false,
    eveningGymOutdoor: true,
  },
};

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

const weekdayNameFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
});

const exerciseById = new Map(PROJECT45_EXERCISES.map((exercise) => [exercise.id, exercise]));

const labelText = (value: string): string =>
  value
    .split(/[-_]/)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');

const resolveTrainingDay = (date: Date) => {
  const dayIndex = ((date.getDay() + 6) % 7) + 1;
  return PROJECT45_WEEKLY_SEED_PLAN.days.find((day) => day.dayIndex === dayIndex) ?? PROJECT45_WEEKLY_SEED_PLAN.days[0];
};

const resolveExercise = (prescription: ExercisePrescription): Project45Exercise | undefined =>
  exerciseById.get(prescription.exerciseId);

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
};

const readCompletions = (): Set<string> => {
  try {
    const stored = window.localStorage.getItem(COMPLETION_STORAGE_KEY);

    if (!stored) {
      return new Set();
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? new Set(parsed.filter((value) => typeof value === 'string')) : new Set();
  } catch {
    return new Set();
  }
};

const writeCompletions = (completionIds: Set<string>): void => {
  window.localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify([...completionIds]));
};

const isGoalId = (value: unknown): value is GoalId =>
  typeof value === 'string' && (GOAL_IDS as readonly string[]).includes(value);

const isEquipmentId = (value: unknown): value is EquipmentId =>
  typeof value === 'string' && (EQUIPMENT_IDS as readonly string[]).includes(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeSettings = (value: unknown): UserSettings | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const preferredSessionSlots = isRecord(value.preferredSessionSlots)
    ? value.preferredSessionSlots
    : DEFAULT_SETTINGS.preferredSessionSlots;

  return {
    activeGoals: Array.isArray(value.activeGoals) ? value.activeGoals.filter(isGoalId) : DEFAULT_SETTINGS.activeGoals,
    availableEquipment: Array.isArray(value.availableEquipment)
      ? value.availableEquipment.filter(isEquipmentId)
      : DEFAULT_SETTINGS.availableEquipment,
    preferredSessionSlots: {
      morningHome: Boolean(preferredSessionSlots.morningHome),
      workBreak: Boolean(preferredSessionSlots.workBreak),
      eveningGymOutdoor: Boolean(preferredSessionSlots.eveningGymOutdoor),
    },
  };
};

const readSettings = (): UserSettings => {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    return normalizeSettings(JSON.parse(stored)) ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const writeSettings = (settings: UserSettings): void => {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${meters / 1000} km`;
  }

  return `${meters} m`;
};

const formatRunTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const parseRunTime = (value: string): number | undefined => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const timeMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})$/);

  if (timeMatch) {
    const minutes = Number(timeMatch[1]);
    const seconds = Number(timeMatch[2]);
    return seconds < 60 ? minutes * 60 + seconds : undefined;
  }

  const numericMinutes = Number(trimmedValue.replace(',', '.'));
  return Number.isFinite(numericMinutes) ? Math.round(numericMinutes * 60) : undefined;
};

const parseNumber = (value: string): number | undefined => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue.replace(',', '.'));
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const formatCount = (value: number): string => String(value);

const formatCentimeters = (value: number): string => `${value > 0 ? '+' : ''}${value} cm`;

const GTO_METRICS = [
  {
    id: 'run2KmSeconds',
    label: '2 km run',
    targetLabel: '10:00',
    targetValue: 600,
    unit: 'time',
    better: 'lower',
    inputMode: 'numeric',
    placeholder: '10:00',
    format: formatRunTime,
    parse: parseRunTime,
  },
  {
    id: 'pushUps',
    label: 'Push-ups',
    targetLabel: '30+',
    targetValue: 30,
    unit: 'reps',
    better: 'higher',
    inputMode: 'numeric',
    placeholder: '30',
    format: formatCount,
    parse: parseNumber,
  },
  {
    id: 'pullUps',
    label: 'Pull-ups',
    targetLabel: '9+',
    targetValue: 9,
    unit: 'reps',
    better: 'higher',
    inputMode: 'numeric',
    placeholder: '9',
    format: formatCount,
    parse: parseNumber,
  },
  {
    id: 'absOneMinute',
    label: 'Abs in 1 minute',
    targetLabel: '25+',
    targetValue: 25,
    unit: 'reps',
    better: 'higher',
    inputMode: 'numeric',
    placeholder: '25',
    format: formatCount,
    parse: parseNumber,
  },
  {
    id: 'sitAndReachCm',
    label: 'Sit-and-reach',
    targetLabel: '+9 cm',
    targetValue: 9,
    unit: 'cm',
    better: 'higher',
    inputMode: 'decimal',
    placeholder: '+9',
    format: formatCentimeters,
    parse: parseNumber,
  },
] as const satisfies readonly GtoMetric[];

const emptyGtoForm = (): GtoFormState => ({
  run2KmSeconds: '',
  pushUps: '',
  pullUps: '',
  absOneMinute: '',
  sitAndReachCm: '',
});

const emptyRecoveryForm = (): RecoveryFormState => ({
  sleepHours: '',
  energy: '',
  soreness: '',
  stress: '',
  libido: '',
  readiness: '',
});

const readGtoEntries = (): GtoEntry[] => {
  try {
    const stored = window.localStorage.getItem(GTO_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is GtoEntry => typeof entry?.id === 'string') : [];
  } catch {
    return [];
  }
};

const writeGtoEntries = (entries: readonly GtoEntry[]): void => {
  window.localStorage.setItem(GTO_STORAGE_KEY, JSON.stringify(entries));
};

const isRecoveryEntry = (entry: unknown): entry is RecoveryEntry => {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const candidate = entry as Partial<RecoveryEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.sleepHours === 'number' &&
    typeof candidate.energy === 'number' &&
    typeof candidate.soreness === 'number' &&
    typeof candidate.stress === 'number'
  );
};

const readRecoveryEntries = (): RecoveryEntry[] => {
  try {
    const stored = window.localStorage.getItem(RECOVERY_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isRecoveryEntry) : [];
  } catch {
    return [];
  }
};

const writeRecoveryEntries = (entries: readonly RecoveryEntry[]): void => {
  window.localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(entries));
};

const recoveryEntryIsPoor = (entry: RecoveryEntry): boolean => {
  const readinessIsLow = typeof entry.readiness === 'number' && entry.readiness <= 2;
  return entry.sleepHours < 6 || entry.energy <= 2 || entry.soreness >= 4 || entry.stress >= 4 || readinessIsLow;
};

const poorRecoveryWarning = (entries: readonly RecoveryEntry[]): string | undefined => {
  const recentEntries = entries.slice(0, 3);
  const poorCount = recentEntries.filter(recoveryEntryIsPoor).length;

  if (poorCount >= 3) {
    return 'Recovery has been low for 3 recent check-ins.';
  }

  if (poorCount >= 2) {
    return 'Recovery has been low for 2 recent check-ins.';
  }

  return undefined;
};

const metricIsOnTarget = (metric: GtoMetric, value: number): boolean =>
  metric.better === 'lower' ? value <= metric.targetValue : value >= metric.targetValue;

const metricDeltaLabel = (metric: GtoMetric, value: number): string => {
  const delta = value - metric.targetValue;

  if (delta === 0) {
    return 'At target';
  }

  if (metric.id === 'run2KmSeconds') {
    return `${Math.abs(delta)}s ${delta < 0 ? 'faster' : 'over'}`;
  }

  return `${delta > 0 ? '+' : ''}${delta} ${metric.unit}`;
};

const formatDose = (prescription: ExercisePrescription): string => {
  const doseParts: string[] = [];

  if (prescription.sets && prescription.reps) {
    doseParts.push(`${prescription.sets} x ${prescription.reps}`);
  } else if (prescription.sets) {
    doseParts.push(`${prescription.sets} sets`);
  } else if (prescription.reps) {
    doseParts.push(`${prescription.reps} reps`);
  }

  if (prescription.durationSeconds) {
    doseParts.push(formatDuration(prescription.durationSeconds));
  }

  if (prescription.distanceMeters) {
    doseParts.push(formatDistance(prescription.distanceMeters));
  }

  if (prescription.load) {
    doseParts.push(prescription.load);
  }

  if (prescription.intensity?.rpe) {
    doseParts.push(`RPE ${prescription.intensity.rpe}`);
  }

  if (prescription.intensity?.zone) {
    doseParts.push(prescription.intensity.zone);
  }

  if (prescription.restSeconds) {
    doseParts.push(`${formatDuration(prescription.restSeconds)} rest`);
  }

  return doseParts.join(' - ');
};

const exerciseEquipment = (exercise: Project45Exercise): readonly EquipmentId[] =>
  'optional' in exercise.equipment
    ? [...exercise.equipment.required, ...exercise.equipment.optional]
    : exercise.equipment.required;

const exerciseHasGoal = (exercise: Project45Exercise, goal: GoalId): boolean =>
  (exercise.goals as readonly GoalId[]).includes(goal);

const exerciseHasEquipment = (exercise: Project45Exercise, equipment: EquipmentId): boolean =>
  exerciseEquipment(exercise).includes(equipment);

const trainingDayDate = (today: Date, trainingDay: TrainingDay): Date => {
  const currentDayIndex = ((today.getDay() + 6) % 7) + 1;
  return addDays(today, trainingDay.dayIndex - currentDayIndex);
};

const trainingDayPrescriptionCount = (trainingDay: TrainingDay): number =>
  trainingDay.sessions.reduce(
    (total, session) => total + session.blocks.reduce((blockTotal, block) => blockTotal + block.prescriptions.length, 0),
    0,
  );

const completedPrescriptionCount = (dateKey: string, trainingDay: TrainingDay, completedIds: Set<string>): number =>
  trainingDay.sessions.reduce(
    (total, session) =>
      total +
      session.blocks.reduce(
        (blockTotal, block) =>
          blockTotal +
          block.prescriptions.filter((prescription) =>
            completedIds.has(completionId(dateKey, session, block, prescription)),
          ).length,
        0,
      ),
    0,
  );

const sessionPrescriptionIds = (dateKey: string, session: WorkoutSession): string[] =>
  session.blocks.flatMap((block) =>
    block.prescriptions.map((prescription) => completionId(dateKey, session, block, prescription)),
  );

const sessionPrescriptionCount = (session: WorkoutSession): number =>
  session.blocks.reduce((total, block) => total + block.prescriptions.length, 0);

const completedSessionPrescriptionCount = (
  dateKey: string,
  session: WorkoutSession,
  completedIds: Set<string>,
): number =>
  session.blocks.reduce(
    (total, block) =>
      total +
      block.prescriptions.filter((prescription) =>
        completedIds.has(completionId(dateKey, session, block, prescription)),
      ).length,
    0,
  );

const completionDateKey = (id: string): string | undefined => {
  const [dateKey] = id.split(':');
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : undefined;
};

const groupCompletionsByDate = (completedIds: Set<string>): Map<string, Set<string>> => {
  const groupedCompletions = new Map<string, Set<string>>();

  for (const id of completedIds) {
    const dateKey = completionDateKey(id);

    if (!dateKey) {
      continue;
    }

    const dateCompletions = groupedCompletions.get(dateKey) ?? new Set<string>();
    dateCompletions.add(id);
    groupedCompletions.set(dateKey, dateCompletions);
  }

  return groupedCompletions;
};

const historyStatus = (
  dateKey: string,
  todayKey: string,
  completedCount: number,
  totalCount: number,
): HistoryDayStatus => {
  if (totalCount > 0 && completedCount === totalCount) {
    return 'complete';
  }

  if (completedCount > 0) {
    return 'partial';
  }

  if (dateKey < todayKey && totalCount > 0) {
    return 'missed';
  }

  return 'open';
};

const recentHistoryDays = (today: Date, completedIds: Set<string>, dayCount = 14): HistoryDaySummary[] => {
  const todayKey = formatDateKey(today);
  const groupedCompletions = groupCompletionsByDate(completedIds);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(today, -index);
    const dateKey = formatDateKey(date);
    const trainingDay = resolveTrainingDay(date);
    const totalCount = trainingDayPrescriptionCount(trainingDay);
    const completedCount = completedPrescriptionCount(dateKey, trainingDay, groupedCompletions.get(dateKey) ?? new Set());
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedCount,
      date,
      dateKey,
      progress,
      status: historyStatus(dateKey, todayKey, completedCount, totalCount),
      totalCount,
      trainingDay,
    };
  });
};

const isGtoEntry = (entry: unknown): entry is GtoEntry => isRecord(entry) && typeof entry.id === 'string';

const historyBackupSnapshot = (today: Date, completedIds: Set<string>) =>
  recentHistoryDays(today, completedIds).map((historyDay) => ({
    completedCount: historyDay.completedCount,
    dateKey: historyDay.dateKey,
    progress: historyDay.progress,
    status: historyDay.status,
    totalCount: historyDay.totalCount,
    trainingDayTitle: historyDay.trainingDay.title ?? `Day ${historyDay.trainingDay.dayIndex}`,
  }));

const createLocalBackup = (settings: UserSettings): Project45Backup => {
  const completedIds = readCompletions();

  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      [SETTINGS_STORAGE_KEY]: settings,
      [COMPLETION_STORAGE_KEY]: [...completedIds],
      [RECOVERY_STORAGE_KEY]: readRecoveryEntries(),
      [GTO_STORAGE_KEY]: readGtoEntries(),
    },
    history: historyBackupSnapshot(new Date(), completedIds),
  };
};

const validateBackupDataValue = (key: LocalDataKey, value: unknown): unknown | undefined => {
  if (key === SETTINGS_STORAGE_KEY) {
    return normalizeSettings(value);
  }

  if (key === COMPLETION_STORAGE_KEY) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined;
  }

  if (key === RECOVERY_STORAGE_KEY) {
    return Array.isArray(value) && value.every(isRecoveryEntry) ? value : undefined;
  }

  if (key === GTO_STORAGE_KEY) {
    return Array.isArray(value) && value.every(isGtoEntry) ? value : undefined;
  }

  return undefined;
};

const parseBackupImport = (
  backupText: string,
): { data: Partial<Record<LocalDataKey, unknown>>; importedSettings: UserSettings } | { error: string } => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(backupText);
  } catch {
    return { error: 'Backup is not valid JSON.' };
  }

  if (!isRecord(parsed) || parsed.schema !== BACKUP_SCHEMA || parsed.version !== BACKUP_VERSION) {
    return { error: 'Backup schema or version is not supported.' };
  }

  if (!isRecord(parsed.data)) {
    return { error: 'Backup does not include local app data.' };
  }

  const nextData: Partial<Record<LocalDataKey, unknown>> = {};

  for (const key of LOCAL_DATA_KEYS) {
    if (!(key in parsed.data)) {
      continue;
    }

    const validatedValue = validateBackupDataValue(key, parsed.data[key]);

    if (typeof validatedValue === 'undefined') {
      return { error: `Backup has invalid data for ${key}.` };
    }

    nextData[key] = validatedValue;
  }

  if (Object.keys(nextData).length === 0) {
    return { error: 'Backup does not contain any known Project45 data keys.' };
  }

  return {
    data: nextData,
    importedSettings: (nextData[SETTINGS_STORAGE_KEY] as UserSettings | undefined) ?? readSettings(),
  };
};

const importLocalBackup = (backupText: string): { importedKeys: number; importedSettings: UserSettings } | { error: string } => {
  const parsedImport = parseBackupImport(backupText);

  if ('error' in parsedImport) {
    return parsedImport;
  }

  for (const key of LOCAL_DATA_KEYS) {
    if (key in parsedImport.data) {
      window.localStorage.setItem(key, JSON.stringify(parsedImport.data[key]));
    }
  }

  return {
    importedKeys: Object.keys(parsedImport.data).length,
    importedSettings: parsedImport.importedSettings,
  };
};

type TodayPrescriptionItem = Readonly<{
  block: WorkoutBlock;
  exercise?: Project45Exercise;
  id: string;
  isMissingExercise: boolean;
  prescription: ExercisePrescription;
  session: WorkoutSession;
}>;

const resolveTodayTrainingDay = (plan: WorkoutPlan | undefined, today: Date): TrainingDay | undefined => {
  if (!plan || plan.days.length === 0) {
    return undefined;
  }

  const dayIndex = ((today.getDay() + 6) % 7) + 1;
  return plan.days.find((day) => day.dayIndex === dayIndex);
};

const dayDurationMinutes = (trainingDay: TrainingDay): number =>
  trainingDay.sessions.reduce((minutes, session) => minutes + (session.estimatedDurationMinutes ?? 0), 0);

const trainingDayFocus = (trainingDay: TrainingDay): string => {
  const goals = [...new Set(trainingDay.sessions.flatMap((session) => session.goals))];
  return goals.length > 0 ? goals.map(labelText).join(', ') : 'Project45 training';
};

const todayPrescriptionItems = (dateKey: string, trainingDay: TrainingDay): TodayPrescriptionItem[] =>
  trainingDay.sessions.flatMap((session) =>
    session.blocks.flatMap((block) =>
      block.prescriptions.map((prescription) => {
        const exercise = resolveExercise(prescription);

        return {
          block,
          exercise,
          id: completionId(dateKey, session, block, prescription),
          isMissingExercise: !exercise,
          prescription,
          session,
        };
      }),
    ),
  );

const sessionMomentLabel = (session: WorkoutSession): string => {
  const title = session.title.toLowerCase();

  if (title.includes('morning')) {
    return 'Morning';
  }

  if (title.includes('break')) {
    return 'Work break';
  }

  if (title.includes('evening')) {
    return session.location === 'gym' ? 'Evening gym' : 'Evening outdoor';
  }

  if (session.location === 'gym') {
    return 'Gym';
  }

  return labelText(session.location);
};

type TodayScreenProps = Readonly<{
  settings: UserSettings;
}>;

function TodayScreen({ settings }: TodayScreenProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readCompletions());
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateKey(today);
  const workoutPlan: WorkoutPlan | undefined = PROJECT45_WEEKLY_SEED_PLAN;
  const trainingDay = resolveTodayTrainingDay(workoutPlan, today);

  useEffect(() => {
    writeCompletions(completedIds);
  }, [completedIds]);

  if (!trainingDay) {
    return (
      <section className="today-empty-state" role="status">
        <p className="eyebrow">Today</p>
        <h1>No workout plan</h1>
        <p>Add a Project45 weekly plan to see today&apos;s sessions, progress, and completion controls here.</p>
      </section>
    );
  }

  const totalMinutes = dayDurationMinutes(trainingDay);
  const totalPrescriptions = trainingDayPrescriptionCount(trainingDay);
  const completedToday = completedPrescriptionCount(dateKey, trainingDay, completedIds);
  const dayProgress = totalPrescriptions > 0 ? Math.round((completedToday / totalPrescriptions) * 100) : 0;
  const remainingToday = Math.max(totalPrescriptions - completedToday, 0);
  const dayIsComplete = totalPrescriptions > 0 && completedToday === totalPrescriptions;
  const prescriptionItems = todayPrescriptionItems(dateKey, trainingDay);
  const missingCatalogItems = prescriptionItems.filter((item) => item.isMissingExercise);
  const nextPrescription = prescriptionItems.find((item) => !completedIds.has(item.id));
  const focusText =
    settings.activeGoals.length > 0 ? settings.activeGoals.map(labelText).join(', ') : trainingDayFocus(trainingDay);

  const toggleCompletion = (id: string): void => {
    setCompletedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const setSessionCompletion = (session: WorkoutSession, shouldComplete: boolean): void => {
    const ids = sessionPrescriptionIds(dateKey, session);

    setCompletedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      for (const id of ids) {
        if (shouldComplete) {
          nextIds.add(id);
        } else {
          nextIds.delete(id);
        }
      }

      return nextIds;
    });
  };

  return (
    <>
      <header className="today-header">
        <p className="eyebrow">Project45</p>
        <div className="header-row">
          <div>
            <h1>Today</h1>
            <p className="date-line">{weekdayFormatter.format(today)}</p>
          </div>
          <div className="day-pill">Day {trainingDay.dayIndex}</div>
        </div>
        <p className="day-title">{trainingDay.title ?? 'Daily workout'}</p>
        <p className="day-focus">Focus: {focusText}</p>
        <section className={`today-command${dayIsComplete ? ' is-complete' : ''}`} aria-label="Today progress">
          <div className="today-progress-ring" aria-hidden="true">
            {dayProgress}%
          </div>
          <div className="today-command-copy">
            <p>{dayIsComplete ? 'Day complete' : `${remainingToday} item${remainingToday === 1 ? '' : 's'} left`}</p>
            <h2>
              {nextPrescription
                ? `Next: ${nextPrescription.exercise?.name ?? `Missing catalog: ${nextPrescription.prescription.exerciseId}`}`
                : 'Everything is done'}
            </h2>
            <span>{nextPrescription ? `${nextPrescription.session.title} - ${nextPrescription.block.name}` : 'Nice work today.'}</span>
          </div>
        </section>
        <section className="day-progress" aria-label="Full-day progress">
          <div>
            <span>Full day progress</span>
            <strong>{dayProgress}%</strong>
          </div>
          <progress value={completedToday} max={Math.max(totalPrescriptions, 1)}>
            {completedToday} of {totalPrescriptions}
          </progress>
        </section>
        <dl className="summary-strip">
          <div>
            <dt>Focus</dt>
            <dd>{focusText}</dd>
          </div>
          <div>
            <dt>Sessions</dt>
            <dd>{trainingDay.sessions.length}</dd>
          </div>
          <div>
            <dt>Total duration</dt>
            <dd>{totalMinutes} min</dd>
          </div>
          <div>
            <dt>Complete</dt>
            <dd>{dayProgress}%</dd>
          </div>
        </dl>
        {missingCatalogItems.length > 0 ? (
          <section className="today-error-state" role="alert">
            {missingCatalogItems.length} catalog exercise {missingCatalogItems.length === 1 ? 'is' : 'are'} missing from
            today&apos;s plan. You can still track completion while the catalog is repaired.
          </section>
        ) : null}
      </header>

      <section className="session-list" aria-label="Today's sessions">
        {trainingDay.sessions.length === 0 ? (
          <section className="today-empty-state" role="status">
            <h2>No sessions today</h2>
            <p>This training day exists, but it does not include any workout sessions yet.</p>
          </section>
        ) : null}
        {trainingDay.sessions.map((session) => {
          const sessionTotal = sessionPrescriptionCount(session);
          const sessionDone = completedSessionPrescriptionCount(dateKey, session, completedIds);
          const sessionProgress = sessionTotal > 0 ? Math.round((sessionDone / sessionTotal) * 100) : 0;
          const sessionIsComplete = sessionTotal > 0 && sessionDone === sessionTotal;

          return (
            <article className={`session-panel${sessionIsComplete ? ' is-complete' : ''}`} key={session.id}>
              <div className="session-heading">
                <div>
                  <p className="session-meta">
                    {sessionMomentLabel(session)} - {labelText(session.location)} - {session.estimatedDurationMinutes ?? 0} min
                  </p>
                  <h2>{session.title}</h2>
                </div>
                <div className="session-progress" aria-label={`${session.title} progress`}>
                  <span>{sessionProgress}%</span>
                  <progress value={sessionDone} max={sessionTotal}>
                    {sessionDone} of {sessionTotal}
                  </progress>
                  <strong>
                    {sessionDone}/{sessionTotal} done
                  </strong>
                </div>
              </div>
              <div className="session-actions">
                <button
                  onClick={() => setSessionCompletion(session, !sessionIsComplete)}
                  type="button"
                >
                  {sessionIsComplete ? 'Clear session' : 'Mark session done'}
                </button>
              </div>

              <div className="block-list">
                {session.blocks.map((block) => (
                  <section className="block-section" key={block.id}>
                    <div className="block-heading">
                      <p>{block.type}</p>
                      <h3>{block.name}</h3>
                    </div>

                    <ul className="prescription-list">
                      {block.prescriptions.map((prescription) => {
                        const exercise = resolveExercise(prescription);
                        const dose = formatDose(prescription);
                        const cue =
                          exercise?.coachingCues[0] ??
                          exercise?.summary ??
                          `Missing catalog exercise: ${prescription.exerciseId}`;
                        const id = completionId(dateKey, session, block, prescription);
                        const isDone = completedIds.has(id);
                        const isMissingExercise = !exercise;

                        return (
                          <li
                            className={`prescription-row${isDone ? ' is-done' : ''}${
                              isMissingExercise ? ' is-missing' : ''
                            }`}
                            key={id}
                          >
                            <label className="completion-control">
                              <input
                                aria-label={`Mark ${exercise?.name ?? prescription.exerciseId} done`}
                                checked={isDone}
                                onChange={() => toggleCompletion(id)}
                                type="checkbox"
                              />
                              <span>{isDone ? 'Done' : 'Tap when done'}</span>
                            </label>
                            <div>
                              <h4>{exercise?.name ?? `Missing catalog: ${prescription.exerciseId}`}</h4>
                              <p>{cue}</p>
                              {prescription.notes ? <p className="prescription-notes">{prescription.notes.join(' ')}</p> : null}
                            </div>
                            {dose ? <span className="dose-pill">{dose}</span> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

function HistoryScreen() {
  const [completedIds] = useState<Set<string>>(() => readCompletions());
  const today = useMemo(() => new Date(), []);
  const historyDays = useMemo(() => recentHistoryDays(today, completedIds), [completedIds, today]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => historyDays[0]?.dateKey ?? formatDateKey(today));
  const selectedDay = historyDays.find((historyDay) => historyDay.dateKey === selectedDateKey) ?? historyDays[0];
  const hasStoredCompletions = completedIds.size > 0;

  return (
    <>
      <header className="history-header">
        <p className="eyebrow">Local log</p>
        <h1>History</h1>
        <p className="history-subtitle">Recent Project45 days from completion data saved on this device.</p>
      </header>

      {!hasStoredCompletions ? (
        <section className="history-empty-state" role="status">
          <h2>No completed exercises yet</h2>
          <p>Finish items on Today and they will appear here grouped by date.</p>
        </section>
      ) : null}

      <section className="history-day-list" aria-label="Recent training history">
        {historyDays.map((historyDay) => (
          <button
            aria-pressed={selectedDay?.dateKey === historyDay.dateKey}
            className={`history-day-card status-${historyDay.status}`}
            key={historyDay.dateKey}
            onClick={() => setSelectedDateKey(historyDay.dateKey)}
            type="button"
          >
            <span>
              <strong>{weekdayFormatter.format(historyDay.date)}</strong>
              <small>{historyDay.trainingDay.title ?? `Day ${historyDay.trainingDay.dayIndex}`}</small>
            </span>
            <span className="history-day-progress">
              <strong>{historyDay.progress}%</strong>
              <small>
                {historyDay.completedCount}/{historyDay.totalCount} done
              </small>
            </span>
            <span className="history-status-pill">{labelText(historyDay.status)}</span>
          </button>
        ))}
      </section>

      {selectedDay ? (
        <section className={`history-summary status-${selectedDay.status}`} aria-label="Selected day summary">
          <div className="history-summary-heading">
            <div>
              <p>{weekdayFormatter.format(selectedDay.date)}</p>
              <h2>{selectedDay.trainingDay.title ?? `Day ${selectedDay.trainingDay.dayIndex}`}</h2>
            </div>
            <span>{selectedDay.progress}%</span>
          </div>
          <progress value={selectedDay.completedCount} max={Math.max(selectedDay.totalCount, 1)}>
            {selectedDay.completedCount} of {selectedDay.totalCount}
          </progress>
          <dl className="history-summary-grid">
            <div>
              <dt>Status</dt>
              <dd>{labelText(selectedDay.status)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>
                {selectedDay.completedCount}/{selectedDay.totalCount}
              </dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{selectedDay.trainingDay.sessions.length}</dd>
            </div>
          </dl>

          <div className="history-session-list">
            {selectedDay.trainingDay.sessions.map((session) => {
              const sessionTotal = sessionPrescriptionCount(session);
              const sessionDone = completedSessionPrescriptionCount(selectedDay.dateKey, session, completedIds);
              const sessionProgress = sessionTotal > 0 ? Math.round((sessionDone / sessionTotal) * 100) : 0;

              return (
                <article className="history-session-card" key={session.id}>
                  <div>
                    <p>
                      {sessionMomentLabel(session)} - {labelText(session.location)}
                    </p>
                    <h3>{session.title}</h3>
                  </div>
                  <span>
                    {sessionProgress}% - {sessionDone}/{sessionTotal}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}

function WeekScreen() {
  const [completedIds] = useState<Set<string>>(() => readCompletions());
  const today = useMemo(() => new Date(), []);
  const currentTrainingDay = resolveTrainingDay(today);

  return (
    <>
      <header className="week-header">
        <p className="eyebrow">Plan</p>
        <h1>Week</h1>
        <p className="week-subtitle">7-day Project45 seed plan</p>
      </header>

      <section className="week-list" aria-label="Project45 week">
        {PROJECT45_WEEKLY_SEED_PLAN.days.map((trainingDay) => {
          const dayDate = trainingDayDate(today, trainingDay);
          const dateKey = formatDateKey(dayDate);
          const totalPrescriptions = trainingDayPrescriptionCount(trainingDay);
          const completedCount = completedPrescriptionCount(dateKey, trainingDay, completedIds);
          const durationMinutes = trainingDay.sessions.reduce(
            (total, session) => total + (session.estimatedDurationMinutes ?? 0),
            0,
          );
          const locations = [...new Set(trainingDay.sessions.map((session) => session.location))];
          const mainBlockTitles = trainingDay.sessions.flatMap((session) =>
            session.blocks.filter((block) => block.type === 'main').map((block) => block.name),
          );
          const visibleBlockTitles =
            mainBlockTitles.length > 0
              ? mainBlockTitles
              : trainingDay.sessions.flatMap((session) => session.blocks.map((block) => block.name));
          const isToday = trainingDay.dayIndex === currentTrainingDay.dayIndex;
          const progress = totalPrescriptions > 0 ? Math.round((completedCount / totalPrescriptions) * 100) : 0;

          return (
            <article className={`week-day-card${isToday ? ' is-today' : ''}`} key={trainingDay.id}>
              <div className="week-day-heading">
                <div>
                  <p className="week-day-name">{weekdayNameFormatter.format(dayDate)}</p>
                  <h2>{trainingDay.title}</h2>
                </div>
                <span>{isToday ? 'Today' : `Day ${trainingDay.dayIndex}`}</span>
              </div>

              <dl className="week-meta-grid">
                <div>
                  <dt>Sessions</dt>
                  <dd>{trainingDay.sessions.length}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{durationMinutes} min</dd>
                </div>
                <div>
                  <dt>Done</dt>
                  <dd>
                    {completedCount}/{totalPrescriptions}
                  </dd>
                </div>
              </dl>

              <div className="week-progress" aria-label={`${trainingDay.title} completion`}>
                <span>{progress}% complete</span>
                <progress value={completedCount} max={totalPrescriptions}>
                  {progress}%
                </progress>
              </div>

              <section className="week-detail-section">
                <h3>Locations</h3>
                <p>{locations.map(labelText).join(', ')}</p>
              </section>

              <section className="week-detail-section">
                <h3>Main Blocks</h3>
                <ul>
                  {visibleBlockTitles.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </section>

              <section className="week-detail-section">
                <h3>Sessions</h3>
                <ul>
                  {trainingDay.sessions.map((session) => (
                    <li key={session.id}>
                      {session.title} - {labelText(session.location)} - {session.estimatedDurationMinutes ?? 0} min
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          );
        })}
      </section>
    </>
  );
}

function ExerciseLibraryScreen() {
  const [goalFilter, setGoalFilter] = useState<GoalId | 'all'>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentId | 'all'>('all');
  const goalOptions = useMemo<GoalId[]>(
    () => [...new Set(PROJECT45_EXERCISES.flatMap((exercise) => exercise.goals as readonly GoalId[]))].sort(),
    [],
  );
  const equipmentOptions = useMemo<EquipmentId[]>(
    () => [...new Set(PROJECT45_EXERCISES.flatMap((exercise) => exerciseEquipment(exercise)))].sort(),
    [],
  );
  const filteredExercises = PROJECT45_EXERCISES.filter((exercise) => {
    const matchesGoal = goalFilter === 'all' || exerciseHasGoal(exercise, goalFilter);
    const matchesEquipment = equipmentFilter === 'all' || exerciseHasEquipment(exercise, equipmentFilter);

    return matchesGoal && matchesEquipment;
  });

  return (
    <>
      <header className="library-header">
        <p className="eyebrow">Catalog</p>
        <h1>Exercise Library</h1>
        <p className="library-subtitle">
          {filteredExercises.length} of {PROJECT45_EXERCISES.length} Project45 exercises
        </p>
        <div className="filter-grid" aria-label="Exercise filters">
          <label>
            <span>Goal</span>
            <select value={goalFilter} onChange={(event) => setGoalFilter(event.target.value as GoalId | 'all')}>
              <option value="all">All goals</option>
              {goalOptions.map((goal) => (
                <option key={goal} value={goal}>
                  {labelText(goal)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Equipment</span>
            <select
              value={equipmentFilter}
              onChange={(event) => setEquipmentFilter(event.target.value as EquipmentId | 'all')}
            >
              <option value="all">All equipment</option>
              {equipmentOptions.map((equipment) => (
                <option key={equipment} value={equipment}>
                  {labelText(equipment)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="exercise-library-list" aria-label="Exercise library">
        {filteredExercises.map((exercise) => (
          <article className="exercise-card" key={exercise.id}>
            <div className="exercise-card-header">
              <div>
                <h2>{exercise.name}</h2>
                <p>{exercise.summary}</p>
              </div>
              <span className={`risk-pill risk-${exercise.risk.level}`}>{exercise.risk.level}</span>
            </div>

            <dl className="exercise-meta-grid">
              <div>
                <dt>Goals</dt>
                <dd>{exercise.goals.map(labelText).join(', ')}</dd>
              </div>
              <div>
                <dt>Capabilities</dt>
                <dd>{exercise.capabilities.map(labelText).join(', ')}</dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>{exerciseEquipment(exercise).map(labelText).join(', ')}</dd>
              </div>
            </dl>

            <section className="exercise-detail-section">
              <h3>Instructions</h3>
              <ol>
                {exercise.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </section>

            <section className="exercise-detail-section">
              <h3>Coaching Cues</h3>
              <ul>
                {exercise.coachingCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </section>
          </article>
        ))}
      </section>
    </>
  );
}

function GtoScreen() {
  const [entries, setEntries] = useState<GtoEntry[]>(() => readGtoEntries());
  const [formState, setFormState] = useState<GtoFormState>(() => emptyGtoForm());
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const latestEntry = entries[0];

  useEffect(() => {
    writeGtoEntries(entries);
  }, [entries]);

  const updateMetric = (metricId: GtoMetricId, value: string): void => {
    setFormState((currentState) => ({
      ...currentState,
      [metricId]: value,
    }));
  };

  const saveEntry = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const nextEntry: Record<string, string | number | undefined> = {
      id: `${todayKey}-${Date.now()}`,
      date: todayKey,
    };

    for (const metric of GTO_METRICS) {
      nextEntry[metric.id] = metric.parse(formState[metric.id]);
    }

    const hasResult = GTO_METRICS.some((metric) => typeof nextEntry[metric.id] === 'number');

    if (!hasResult) {
      return;
    }

    setEntries((currentEntries) => [nextEntry as GtoEntry, ...currentEntries]);
    setFormState(emptyGtoForm());
  };

  return (
    <>
      <header className="gto-header">
        <p className="eyebrow">Tests</p>
        <h1>GTO</h1>
        <p className="gto-subtitle">Weekly Project45 targets</p>
      </header>

      <section className="gto-target-grid" aria-label="Latest GTO results">
        {GTO_METRICS.map((metric) => {
          const latestValue = latestEntry?.[metric.id];
          const hasLatestValue = typeof latestValue === 'number';
          const isOnTarget = hasLatestValue ? metricIsOnTarget(metric, latestValue) : false;

          return (
            <article className="gto-target-card" key={metric.id}>
              <div>
                <p>{metric.label}</p>
                <h2>{hasLatestValue ? metric.format(latestValue) : 'No result'}</h2>
              </div>
              <dl>
                <div>
                  <dt>Target</dt>
                  <dd>{metric.targetLabel}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd className={hasLatestValue && isOnTarget ? 'target-hit' : 'target-open'}>
                    {hasLatestValue ? (isOnTarget ? 'On target' : metricDeltaLabel(metric, latestValue)) : 'Pending'}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <form className="gto-entry-form" onSubmit={saveEntry}>
        <div className="gto-form-heading">
          <h2>New weekly entry</h2>
          <span>{todayKey}</span>
        </div>
        <div className="gto-input-grid">
          {GTO_METRICS.map((metric) => (
            <label key={metric.id}>
              <span>{metric.label}</span>
              <input
                inputMode={metric.inputMode}
                onChange={(event) => updateMetric(metric.id, event.target.value)}
                placeholder={metric.placeholder}
                value={formState[metric.id]}
              />
            </label>
          ))}
        </div>
        <button type="submit">Save entry</button>
      </form>

      <section className="gto-history" aria-label="GTO local entries">
        <h2>Local entries</h2>
        {entries.length === 0 ? (
          <p>No entries stored yet.</p>
        ) : (
          <ul>
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span>{entry.date}</span>
                <p>
                  {GTO_METRICS.map((metric) => {
                    const value = entry[metric.id];
                    return typeof value === 'number' ? `${metric.label}: ${metric.format(value)}` : null;
                  })
                    .filter(Boolean)
                    .join(' - ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function RecoveryScreen() {
  const [entries, setEntries] = useState<RecoveryEntry[]>(() => readRecoveryEntries());
  const [formState, setFormState] = useState<RecoveryFormState>(() => emptyRecoveryForm());
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const latestEntry = entries[0];
  const warning = poorRecoveryWarning(entries);

  useEffect(() => {
    writeRecoveryEntries(entries);
  }, [entries]);

  const updateMetric = (metricId: RecoveryMetricId, value: string): void => {
    setFormState((currentState) => ({
      ...currentState,
      [metricId]: value,
    }));
  };

  const saveEntry = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const sleepHours = parseNumber(formState.sleepHours);
    const energy = parseNumber(formState.energy);
    const soreness = parseNumber(formState.soreness);
    const stress = parseNumber(formState.stress);

    if (
      typeof sleepHours !== 'number' ||
      typeof energy !== 'number' ||
      typeof soreness !== 'number' ||
      typeof stress !== 'number'
    ) {
      return;
    }

    const libido = parseNumber(formState.libido);
    const readiness = parseNumber(formState.readiness);
    const nextEntry: RecoveryEntry = {
      id: `${todayKey}-${Date.now()}`,
      date: todayKey,
      sleepHours,
      energy,
      soreness,
      stress,
      ...(typeof libido === 'number' ? { libido } : {}),
      ...(typeof readiness === 'number' ? { readiness } : {}),
    };

    setEntries((currentEntries) => [nextEntry, ...currentEntries]);
    setFormState(emptyRecoveryForm());
  };

  return (
    <>
      <header className="recovery-header">
        <p className="eyebrow">Check-in</p>
        <h1>Recovery</h1>
        <p className="recovery-subtitle">Daily local readiness log</p>
      </header>

      {warning ? <section className="recovery-warning">{warning}</section> : null}

      <section className="recovery-latest" aria-label="Latest recovery entry">
        <div className="recovery-section-heading">
          <h2>Latest entry</h2>
          <span>{latestEntry?.date ?? 'No entry yet'}</span>
        </div>
        {latestEntry ? (
          <dl className="recovery-metric-grid">
            <div>
              <dt>Sleep</dt>
              <dd>{latestEntry.sleepHours}h</dd>
            </div>
            <div>
              <dt>Energy</dt>
              <dd>{latestEntry.energy}/5</dd>
            </div>
            <div>
              <dt>Soreness</dt>
              <dd>{latestEntry.soreness}/5</dd>
            </div>
            <div>
              <dt>Stress</dt>
              <dd>{latestEntry.stress}/5</dd>
            </div>
            <div>
              <dt>Libido</dt>
              <dd>{typeof latestEntry.libido === 'number' ? `${latestEntry.libido}/5` : 'Optional'}</dd>
            </div>
            <div>
              <dt>Readiness</dt>
              <dd>{typeof latestEntry.readiness === 'number' ? `${latestEntry.readiness}/5` : 'Optional'}</dd>
            </div>
          </dl>
        ) : (
          <p>No recovery check-ins stored yet.</p>
        )}
      </section>

      <form className="recovery-form" onSubmit={saveEntry}>
        <div className="recovery-section-heading">
          <h2>Today</h2>
          <span>{todayKey}</span>
        </div>
        <div className="recovery-input-grid">
          <label>
            <span>Sleep hours</span>
            <input
              inputMode="decimal"
              onChange={(event) => updateMetric('sleepHours', event.target.value)}
              placeholder="7.5"
              value={formState.sleepHours}
            />
          </label>
          <label>
            <span>Energy 1-5</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateMetric('energy', event.target.value)}
              placeholder="4"
              value={formState.energy}
            />
          </label>
          <label>
            <span>Soreness 1-5</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateMetric('soreness', event.target.value)}
              placeholder="2"
              value={formState.soreness}
            />
          </label>
          <label>
            <span>Stress 1-5</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateMetric('stress', event.target.value)}
              placeholder="2"
              value={formState.stress}
            />
          </label>
          <label>
            <span>Libido 1-5 optional</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateMetric('libido', event.target.value)}
              placeholder="Optional"
              value={formState.libido}
            />
          </label>
          <label>
            <span>Morning readiness 1-5 optional</span>
            <input
              inputMode="numeric"
              onChange={(event) => updateMetric('readiness', event.target.value)}
              placeholder="Optional"
              value={formState.readiness}
            />
          </label>
        </div>
        <button type="submit">Save check-in</button>
      </form>

      <section className="recovery-history" aria-label="Recovery local entries">
        <h2>Recent check-ins</h2>
        {entries.length === 0 ? (
          <p>No entries stored yet.</p>
        ) : (
          <ul>
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span>{entry.date}</span>
                <p>
                  {entry.sleepHours}h sleep - Energy {entry.energy}/5 - Soreness {entry.soreness}/5 - Stress{' '}
                  {entry.stress}/5
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

type SettingsScreenProps = Readonly<{
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}>;

function SettingsScreen({ settings, onSettingsChange }: SettingsScreenProps) {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | undefined>();

  const toggleGoal = (goal: GoalId): void => {
    const activeGoals = settings.activeGoals.includes(goal)
      ? settings.activeGoals.filter((currentGoal) => currentGoal !== goal)
      : [...settings.activeGoals, goal];

    onSettingsChange({
      ...settings,
      activeGoals,
    });
  };

  const toggleEquipment = (equipment: EquipmentId): void => {
    const availableEquipment = settings.availableEquipment.includes(equipment)
      ? settings.availableEquipment.filter((currentEquipment) => currentEquipment !== equipment)
      : [...settings.availableEquipment, equipment];

    onSettingsChange({
      ...settings,
      availableEquipment,
    });
  };

  const toggleSessionSlot = (slot: SessionSlotId): void => {
    onSettingsChange({
      ...settings,
      preferredSessionSlots: {
        ...settings.preferredSessionSlots,
        [slot]: !settings.preferredSessionSlots[slot],
      },
    });
  };

  const activeSlotLabels = SESSION_SLOT_OPTIONS.filter((slot) => settings.preferredSessionSlots[slot.id]).map(
    (slot) => slot.label,
  );
  const exportBackup = (): void => {
    const backup = createLocalBackup(settings);
    const backupText = JSON.stringify(backup, null, 2);
    const backupBlob = new Blob([backupText], { type: 'application/json' });
    const backupUrl = URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = backupUrl;
    downloadLink.download = `project45-backup-${formatDateKey(new Date())}.json`;
    downloadLink.click();
    URL.revokeObjectURL(backupUrl);
    setBackupStatus({ type: 'success', message: 'Backup JSON exported from this browser.' });
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    try {
      const importResult = importLocalBackup(await file.text());

      if ('error' in importResult) {
        setBackupStatus({ type: 'error', message: importResult.error });
        return;
      }

      onSettingsChange(importResult.importedSettings);
      setBackupStatus({
        type: 'success',
        message: `Imported ${importResult.importedKeys} local data key${importResult.importedKeys === 1 ? '' : 's'}.`,
      });
    } catch {
      setBackupStatus({ type: 'error', message: 'Could not read that backup file.' });
    }
  };

  return (
    <>
      <header className="settings-header">
        <p className="eyebrow">Local profile</p>
        <h1>Settings</h1>
        <p className="settings-subtitle">Goals, equipment, and preferred training slots stay on this device.</p>
      </header>

      <dl className="settings-summary" aria-label="Active settings summary">
        <div>
          <dt>Active goals</dt>
          <dd>{settings.activeGoals.length > 0 ? settings.activeGoals.map(labelText).join(', ') : 'None selected'}</dd>
        </div>
        <div>
          <dt>Equipment</dt>
          <dd>
            {settings.availableEquipment.length > 0
              ? settings.availableEquipment.map(labelText).join(', ')
              : 'None selected'}
          </dd>
        </div>
        <div>
          <dt>Session slots</dt>
          <dd>{activeSlotLabels.length > 0 ? activeSlotLabels.join(', ') : 'None selected'}</dd>
        </div>
      </dl>

      <section className="settings-panel" aria-labelledby="settings-goals-heading">
        <div className="settings-section-heading">
          <h2 id="settings-goals-heading">Active goals</h2>
          <span>{settings.activeGoals.length} selected</span>
        </div>
        <div className="settings-option-grid">
          {GOAL_IDS.map((goal) => (
            <label className="settings-check-card" key={goal}>
              <input checked={settings.activeGoals.includes(goal)} onChange={() => toggleGoal(goal)} type="checkbox" />
              <span>{labelText(goal)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="settings-equipment-heading">
        <div className="settings-section-heading">
          <h2 id="settings-equipment-heading">Available equipment</h2>
          <span>{settings.availableEquipment.length} selected</span>
        </div>
        <div className="settings-option-grid">
          {EQUIPMENT_IDS.map((equipment) => (
            <label className="settings-check-card" key={equipment}>
              <input
                checked={settings.availableEquipment.includes(equipment)}
                onChange={() => toggleEquipment(equipment)}
                type="checkbox"
              />
              <span>{labelText(equipment)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="settings-slots-heading">
        <div className="settings-section-heading">
          <h2 id="settings-slots-heading">Preferred session slots</h2>
          <span>{activeSlotLabels.length} selected</span>
        </div>
        <div className="settings-slot-list">
          {SESSION_SLOT_OPTIONS.map((slot) => (
            <label className="settings-slot-card" key={slot.id}>
              <input
                checked={settings.preferredSessionSlots[slot.id]}
                onChange={() => toggleSessionSlot(slot.id)}
                type="checkbox"
              />
              <span>
                <strong>{slot.label}</strong>
                <small>{slot.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-panel" aria-labelledby="settings-backup-heading">
        <div className="settings-section-heading">
          <h2 id="settings-backup-heading">Export / Import</h2>
          <span>JSON</span>
        </div>
        <div className="backup-actions">
          <button onClick={exportBackup} type="button">
            Export backup
          </button>
          <label className="backup-import-control">
            <input accept="application/json,.json" onChange={importBackup} type="file" />
            <span>Import backup</span>
          </label>
        </div>
        {backupStatus ? (
          <p className={`backup-status is-${backupStatus.type}`} role={backupStatus.type === 'error' ? 'alert' : 'status'}>
            {backupStatus.message}
          </p>
        ) : null}
      </section>
    </>
  );
}

function App() {
  const [view, setView] = useState<AppView>('today');
  const [settings, setSettings] = useState<UserSettings>(() => readSettings());

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  return (
    <main className="app-shell">
      <header className="app-masthead" aria-label="Project45 MVP status">
        <span>Project45</span>
        <strong>{APP_VERSION_LABEL}</strong>
      </header>
      <nav className="app-nav" aria-label="Primary">
        {APP_NAV_ITEMS.map((item) => (
          <button
            aria-pressed={view === item.id}
            key={item.id}
            onClick={() => setView(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      {view === 'today' ? <TodayScreen settings={settings} /> : null}
      {view === 'week' ? <WeekScreen /> : null}
      {view === 'history' ? <HistoryScreen /> : null}
      {view === 'recovery' ? <RecoveryScreen /> : null}
      {view === 'gto' ? <GtoScreen /> : null}
      {view === 'library' ? <ExerciseLibraryScreen /> : null}
      {view === 'settings' ? <SettingsScreen settings={settings} onSettingsChange={setSettings} /> : null}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
