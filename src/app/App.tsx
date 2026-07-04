import { useMemo, useState } from 'react';
import { exerciseById, exerciseCatalog } from '../domain/exercises/exercise.catalog';
import { project45Plan } from '../domain/workouts/project45.plan';
import type { TrainingDay, WorkoutSession } from '../domain/workouts/workout.types';
import { readFromLocalStorage, writeToLocalStorage } from '../shared/storage/localStorageRepository';

type View = 'today' | 'week' | 'library' | 'progress';
type CompletionMap = Record<string, boolean>;

const completionKey = 'project45.completions.v1';

function todayDayOfWeek(): TrainingDay['dayOfWeek'] {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 7 : (jsDay as TrainingDay['dayOfWeek']);
}

export function App() {
  const [view, setView] = useState<View>('today');
  const [completion, setCompletion] = useState<CompletionMap>(() => readFromLocalStorage(completionKey, {}));
  const today = useMemo(
    () => project45Plan.days.find((day) => day.dayOfWeek === todayDayOfWeek()) ?? project45Plan.days[0],
    [],
  );

  const toggle = (sessionId: string, exerciseId: string) => {
    const key = `${new Date().toISOString().slice(0, 10)}:${sessionId}:${exerciseId}`;
    const next = { ...completion, [key]: !completion[key] };
    setCompletion(next);
    writeToLocalStorage(completionKey, next);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="eyebrow">Project 45 · Human Performance OS</div>
        <h1>ГТО, выносливость, кор и качество жизни</h1>
        <p>{project45Plan.description}</p>
      </header>

      <nav className="tabs" aria-label="Основная навигация">
        <button className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Сегодня</button>
        <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Неделя</button>
        <button className={view === 'library' ? 'active' : ''} onClick={() => setView('library')}>Упражнения</button>
        <button className={view === 'progress' ? 'active' : ''} onClick={() => setView('progress')}>Прогресс</button>
      </nav>

      {view === 'today' && <TodayView day={today} completion={completion} onToggle={toggle} />}
      {view === 'week' && <WeekView days={project45Plan.days} completion={completion} onToggle={toggle} />}
      {view === 'library' && <LibraryView />}
      {view === 'progress' && <ProgressView />}
    </main>
  );
}

function TodayView(props: { day: TrainingDay; completion: CompletionMap; onToggle: (sessionId: string, exerciseId: string) => void }) {
  const total = props.day.sessions.flatMap((session) => session.blocks.flatMap((block) => block.prescriptions)).length;
  const done = props.day.sessions
    .flatMap((session) => session.blocks.flatMap((block) => block.prescriptions.map((p) => `${new Date().toISOString().slice(0, 10)}:${session.id}:${p.exerciseId}`)))
    .filter((key) => props.completion[key]).length;

  return (
    <section className="screen">
      <div className="metric-grid">
        <Metric label="Сегодня" value={`${done}/${total}`} />
        <Metric label="План" value={props.day.name} />
        <Metric label="Фокус" value={props.day.focus} />
      </div>
      <DayCard day={props.day} completion={props.completion} onToggle={props.onToggle} />
    </section>
  );
}

function WeekView(props: { days: TrainingDay[]; completion: CompletionMap; onToggle: (sessionId: string, exerciseId: string) => void }) {
  return (
    <section className="screen day-grid">
      {props.days.map((day) => (
        <DayCard key={day.id} day={day} completion={props.completion} onToggle={props.onToggle} compact />
      ))}
    </section>
  );
}

function DayCard(props: { day: TrainingDay; completion: CompletionMap; onToggle: (sessionId: string, exerciseId: string) => void; compact?: boolean }) {
  return (
    <article className="card day-card">
      <div className="day-heading">
        <div>
          <h2>{props.day.name}</h2>
          <p>{props.day.focus}</p>
        </div>
        <span className="badge">{props.day.sessions.length} сесс.</span>
      </div>
      {props.day.sessions.map((session) => (
        <SessionCard key={session.id} session={session} completion={props.completion} onToggle={props.onToggle} compact={props.compact} />
      ))}
    </article>
  );
}

function SessionCard(props: { session: WorkoutSession; completion: CompletionMap; onToggle: (sessionId: string, exerciseId: string) => void; compact?: boolean }) {
  return (
    <section className="session-card">
      <div className="session-heading">
        <div>
          <h3>{props.session.title}</h3>
          <p>{props.session.location} · {props.session.estimatedMinutes} мин</p>
        </div>
        <span className="badge subtle">{props.session.type}</span>
      </div>
      {!props.compact && props.session.blocks.map((block) => (
        <div className="block" key={block.id}>
          <h4>{block.title}</h4>
          {block.prescriptions.map((prescription) => {
            const exercise = exerciseById.get(prescription.exerciseId);
            const key = `${new Date().toISOString().slice(0, 10)}:${props.session.id}:${prescription.exerciseId}`;
            return (
              <label className="exercise-row" key={`${block.id}-${prescription.exerciseId}`}>
                <input type="checkbox" checked={Boolean(props.completion[key])} onChange={() => props.onToggle(props.session.id, prescription.exerciseId)} />
                <span>
                  <strong>{exercise?.name ?? prescription.exerciseId}</strong>
                  <small>{formatPrescription(prescription)}</small>
                </span>
              </label>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function LibraryView() {
  return (
    <section className="screen library-grid">
      {exerciseCatalog.map((exercise) => (
        <article className="card exercise-card" key={exercise.id}>
          <div className="eyebrow">{exercise.englishName}</div>
          <h2>{exercise.name}</h2>
          <p>{exercise.summary}</p>
          <div className="chips">
            {exercise.goals.map((goal) => <span key={goal}>{goal}</span>)}
          </div>
          <h4>Техника</h4>
          <ul>
            {exercise.instructions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
}

function ProgressView() {
  return (
    <section className="screen">
      <div className="card">
        <h2>Прогресс</h2>
        <p>Следующий PR добавит журнал тестов ГТО, вес, талию и recovery check-in. Сейчас foundation фиксирует модель данных и Today-first UI.</p>
      </div>
    </section>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="card metric-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function formatPrescription(prescription: { sets?: number; reps?: string; duration?: string; rest?: string; intensity?: string }) {
  const parts = [
    prescription.sets ? `${prescription.sets} подхода` : undefined,
    prescription.reps,
    prescription.duration,
    prescription.intensity,
    prescription.rest ? `отдых ${prescription.rest}` : undefined,
  ].filter(Boolean);
  return parts.join(' · ');
}
