import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  PROJECT45_EXERCISES,
  PROJECT45_WEEKLY_SEED_PLAN,
  type EquipmentId,
  type ExercisePrescription,
  type GoalId,
  type Project45Exercise,
  type WorkoutBlock,
  type WorkoutSession,
} from './domain';
import { completionId } from './completion/completionId';
import './styles.css';

type AppView = 'today' | 'library';

const COMPLETION_STORAGE_KEY = 'project45.today.completions.v1';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
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

function TodayScreen() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => readCompletions());
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateKey(today);
  const trainingDay = resolveTrainingDay(today);
  const totalMinutes = trainingDay.sessions.reduce(
    (minutes, session) => minutes + (session.estimatedDurationMinutes ?? 0),
    0,
  );
  const totalPrescriptions = trainingDay.sessions.reduce(
    (total, session) => total + session.blocks.reduce((blockTotal, block) => blockTotal + block.prescriptions.length, 0),
    0,
  );
  const completedToday = trainingDay.sessions.reduce(
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

function App() {
  const [view, setView] = useState<AppView>('today');

  return (
    <main className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <button aria-pressed={view === 'today'} onClick={() => setView('today')} type="button">
          Today
        </button>
        <button aria-pressed={view === 'library'} onClick={() => setView('library')} type="button">
          Library
        </button>
      </nav>
      {view === 'today' ? <TodayScreen /> : <ExerciseLibraryScreen />}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
