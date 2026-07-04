import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  PROJECT45_EXERCISES,
  PROJECT45_WEEKLY_SEED_PLAN,
  type EquipmentId,
  type ExercisePrescription,
  type GoalId,
  type Project45Exercise,
  type TrainingDay,
  type WorkoutBlock,
  type WorkoutSession,
} from './domain';
import { completionId } from './completion/completionId';
import './styles.css';

type AppView = 'today' | 'week' | 'gto' | 'library';
type GtoMetricId = 'run2KmSeconds' | 'pushUps' | 'pullUps' | 'absOneMinute' | 'sitAndReachCm';
type GtoEntry = Readonly<{
  id: string;
  date: string;
  run2KmSeconds?: number;
  pushUps?: number;
  pullUps?: number;
  absOneMinute?: number;
  sitAndReachCm?: number;
}>;
type GtoFormState = Record<GtoMetricId, string>;
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

const COMPLETION_STORAGE_KEY = 'project45.today.completions.v1';
const GTO_STORAGE_KEY = 'project45.gto.weekly-tests.v1';

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

function TodayScreen() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readCompletions());
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateKey(today);
  const trainingDay = resolveTrainingDay(today);
  const totalMinutes = trainingDay.sessions.reduce(
    (minutes, session) => minutes + (session.estimatedDurationMinutes ?? 0),
    0,
  );
  const totalPrescriptions = trainingDayPrescriptionCount(trainingDay);
  const completedToday = completedPrescriptionCount(dateKey, trainingDay, completedIds);
  const dayProgress = totalPrescriptions > 0 ? Math.round((completedToday / totalPrescriptions) * 100) : 0;

  useEffect(() => {
    writeCompletions(completedIds);
  }, [completedIds]);

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
        <p className="day-title">{trainingDay.title}</p>
        <dl className="summary-strip">
          <div>
            <dt>Sessions</dt>
            <dd>{trainingDay.sessions.length}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{totalMinutes} min</dd>
          </div>
          <div>
            <dt>Done</dt>
            <dd>
              {completedToday}/{totalPrescriptions}
            </dd>
          </div>
        </dl>
        <section className="day-progress" aria-label="Total day progress">
          <div>
            <span>Day progress</span>
            <strong>{dayProgress}%</strong>
          </div>
          <progress value={completedToday} max={totalPrescriptions}>
            {dayProgress}%
          </progress>
        </section>
      </header>

      <section className="session-list" aria-label="Today's sessions">
        {trainingDay.sessions.map((session) => {
          const sessionTotal = session.blocks.reduce((total, block) => total + block.prescriptions.length, 0);
          const sessionDone = session.blocks.reduce(
            (total, block) =>
              total +
              block.prescriptions.filter((prescription) =>
                completedIds.has(completionId(dateKey, session, block, prescription)),
              ).length,
            0,
          );

          return (
            <article className="session-panel" key={session.id}>
              <div className="session-heading">
                <div>
                  <p className="session-meta">
                    {session.location} - {session.estimatedDurationMinutes ?? 0} min - {session.type}
                  </p>
                  <h2>{session.title}</h2>
                </div>
                <div className="session-progress" aria-label={`${session.title} progress`}>
                  <span>
                    {sessionDone}/{sessionTotal} done
                  </span>
                  <progress value={sessionDone} max={sessionTotal}>
                    {sessionDone} of {sessionTotal}
                  </progress>
                </div>
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
                        const cue = exercise?.coachingCues[0] ?? exercise?.summary ?? 'Catalog details pending.';
                        const id = completionId(dateKey, session, block, prescription);
                        const isDone = completedIds.has(id);

                        return (
                          <li className="prescription-row" key={id}>
                            <label className="completion-control">
                              <input
                                aria-label={`Mark ${exercise?.name ?? prescription.exerciseId} done`}
                                checked={isDone}
                                onChange={() => toggleCompletion(id)}
                                type="checkbox"
                              />
                              <span>{isDone ? 'Done' : 'Mark done'}</span>
                            </label>
                            <div>
                              <h4>{exercise?.name ?? prescription.exerciseId}</h4>
                              <p>{cue}</p>
                            </div>
                            <span className="dose-pill">{dose}</span>
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

function App() {
  const [view, setView] = useState<AppView>('today');

  return (
    <main className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <button aria-pressed={view === 'today'} onClick={() => setView('today')} type="button">
          Today
        </button>
        <button aria-pressed={view === 'week'} onClick={() => setView('week')} type="button">
          Week
        </button>
        <button aria-pressed={view === 'gto'} onClick={() => setView('gto')} type="button">
          GTO
        </button>
        <button aria-pressed={view === 'library'} onClick={() => setView('library')} type="button">
          Library
        </button>
      </nav>
      {view === 'today' ? <TodayScreen /> : null}
      {view === 'week' ? <WeekScreen /> : null}
      {view === 'gto' ? <GtoScreen /> : null}
      {view === 'library' ? <ExerciseLibraryScreen /> : null}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
