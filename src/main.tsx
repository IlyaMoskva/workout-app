import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  PROJECT45_EXERCISES,
  PROJECT45_WEEKLY_SEED_PLAN,
  type ExercisePrescription,
  type Project45Exercise,
} from './domain';
import './styles.css';

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

const exerciseById = new Map(PROJECT45_EXERCISES.map((exercise) => [exercise.id, exercise]));

const resolveTrainingDay = (date: Date) => {
  const dayIndex = ((date.getDay() + 6) % 7) + 1;
  return PROJECT45_WEEKLY_SEED_PLAN.days.find((day) => day.dayIndex === dayIndex) ?? PROJECT45_WEEKLY_SEED_PLAN.days[0];
};

const resolveExercise = (prescription: ExercisePrescription): Project45Exercise | undefined =>
  exerciseById.get(prescription.exerciseId);

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

  return doseParts.join(' · ');
};

function App() {
  const today = new Date();
  const trainingDay = resolveTrainingDay(today);
  const totalMinutes = trainingDay.sessions.reduce(
    (minutes, session) => minutes + (session.estimatedDurationMinutes ?? 0),
    0,
  );

  return (
    <main className="app-shell">
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
            <dt>Plan</dt>
            <dd>Weekly seed</dd>
          </div>
        </dl>
      </header>

      <section className="session-list" aria-label="Today's sessions">
        {trainingDay.sessions.map((session) => (
          <article className="session-panel" key={session.id}>
            <div className="session-heading">
              <div>
                <p className="session-meta">
                  {session.location} · {session.estimatedDurationMinutes ?? 0} min · {session.type}
                </p>
                <h2>{session.title}</h2>
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

                      return (
                        <li className="prescription-row" key={`${block.id}-${prescription.exerciseId}`}>
                          <div>
                            <h4>{exercise?.name ?? prescription.exerciseId}</h4>
                            <p>{cue}</p>
                          </div>
                          <span>{dose}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
