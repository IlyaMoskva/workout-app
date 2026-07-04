import { PROJECT45_EXERCISES } from '../exercises/catalog';
import type { ExerciseId } from '../exercises/exercise.types';
import type {
  TrainingDayId,
  WorkoutBlockId,
  WorkoutPlan,
  WorkoutPlanId,
  WorkoutSessionId,
} from './workout.types';

const workoutPlanId = (value: string): WorkoutPlanId => value as WorkoutPlanId;
const trainingDayId = (value: string): TrainingDayId => value as TrainingDayId;
const workoutSessionId = (value: string): WorkoutSessionId => value as WorkoutSessionId;
const workoutBlockId = (value: string): WorkoutBlockId => value as WorkoutBlockId;

const catalogExerciseId = (value: string): ExerciseId => {
  const exercise = PROJECT45_EXERCISES.find((catalogExercise) => catalogExercise.id === value);

  if (!exercise) {
    throw new Error(`Unknown Project45 exercise id: ${value}`);
  }

  return exercise.id;
};

export const PROJECT45_WEEKLY_SEED_PLAN = {
  id: workoutPlanId('project45-weekly-seed-plan'),
  name: 'Project45 Weekly Seed Plan',
  description:
    'A first typed 7-day seed plan with morning home work, evening gym sessions, running-focused conditioning, weekend endurance, and weekly tests.',
  goals: ['gto_gold', 'core_strength', 'hyperlordosis', 'pelvic_floor', 'endurance'],
  days: [
    {
      id: trainingDayId('day-1'),
      dayIndex: 1,
      title: 'Monday Strength Base',
      sessions: [
        {
          id: workoutSessionId('day-1-morning-home'),
          type: 'mobility',
          location: 'home',
          title: 'Morning Home Stack',
          goals: ['core_strength', 'hyperlordosis', 'pelvic_floor'],
          capabilities: ['core', 'posture', 'pelvic_control'],
          estimatedDurationMinutes: 18,
          blocks: [
            {
              id: workoutBlockId('day-1-morning-prehab'),
              type: 'prehab',
              name: 'Stack and brace',
              prescriptions: [
                { exerciseId: catalogExerciseId('pelvic-floor-breathing'), durationSeconds: 180 },
                { exerciseId: catalogExerciseId('dead-bug'), sets: 2, reps: 8, restSeconds: 30 },
                { exerciseId: catalogExerciseId('glute-bridge'), sets: 2, reps: 12, restSeconds: 30 },
              ],
            },
          ],
        },
        {
          id: workoutSessionId('day-1-evening-gym'),
          type: 'strength',
          location: 'gym',
          title: 'Evening Gym Lower Body',
          goals: ['gto_gold', 'hyperlordosis'],
          capabilities: ['strength', 'core', 'posture'],
          estimatedDurationMinutes: 50,
          blocks: [
            {
              id: workoutBlockId('day-1-evening-main'),
              type: 'main',
              name: 'Squat and hinge',
              prescriptions: [
                { exerciseId: catalogExerciseId('goblet-squat'), sets: 4, reps: 8, intensity: { rpe: 7 }, restSeconds: 90 },
                { exerciseId: catalogExerciseId('romanian-deadlift'), sets: 3, reps: 10, intensity: { rpe: 7 }, restSeconds: 90 },
                { exerciseId: catalogExerciseId('pallof-press'), sets: 3, reps: 10, restSeconds: 45 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-2'),
      dayIndex: 2,
      title: 'Tuesday Run and Core',
      sessions: [
        {
          id: workoutSessionId('day-2-morning-home'),
          type: 'recovery',
          location: 'home',
          title: 'Morning Pelvic Control',
          goals: ['pelvic_floor', 'hyperlordosis'],
          capabilities: ['pelvic_control', 'recovery'],
          estimatedDurationMinutes: 15,
          blocks: [
            {
              id: workoutBlockId('day-2-morning-prehab'),
              type: 'prehab',
              name: 'Low-load control',
              prescriptions: [
                { exerciseId: catalogExerciseId('pelvic-floor-breathing'), durationSeconds: 180 },
                { exerciseId: catalogExerciseId('heel-slide'), sets: 2, reps: 10, restSeconds: 30 },
              ],
            },
          ],
        },
        {
          id: workoutSessionId('day-2-evening-run'),
          type: 'cardio',
          location: 'outdoor',
          title: 'Evening Easy Run Prep',
          goals: ['endurance', 'gto_gold'],
          capabilities: ['endurance', 'recovery'],
          estimatedDurationMinutes: 35,
          blocks: [
            {
              id: workoutBlockId('day-2-evening-conditioning'),
              type: 'conditioning',
              name: 'Run-focused aerobic base',
              prescriptions: [
                {
                  exerciseId: catalogExerciseId('zone-2-walk'),
                  durationSeconds: 1800,
                  intensity: { zone: 'zone-2' },
                  notes: ['Use as easy run or run-walk base until a dedicated running exercise enters the catalog.'],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-3'),
      dayIndex: 3,
      title: 'Wednesday Upper and Carries',
      sessions: [
        {
          id: workoutSessionId('day-3-morning-home'),
          type: 'strength',
          location: 'home',
          title: 'Morning Core Primer',
          goals: ['core_strength', 'hyperlordosis'],
          capabilities: ['core', 'posture'],
          estimatedDurationMinutes: 16,
          blocks: [
            {
              id: workoutBlockId('day-3-morning-main'),
              type: 'main',
              name: 'Brace endurance',
              prescriptions: [
                { exerciseId: catalogExerciseId('plank'), sets: 3, durationSeconds: 30, restSeconds: 30 },
                { exerciseId: catalogExerciseId('side-plank'), sets: 2, durationSeconds: 25, restSeconds: 30 },
              ],
            },
          ],
        },
        {
          id: workoutSessionId('day-3-evening-gym'),
          type: 'strength',
          location: 'gym',
          title: 'Evening Gym Pull and Carry',
          goals: ['gto_gold', 'endurance'],
          capabilities: ['strength', 'grip', 'posture'],
          estimatedDurationMinutes: 45,
          blocks: [
            {
              id: workoutBlockId('day-3-evening-main'),
              type: 'main',
              name: 'Pulling strength',
              prescriptions: [
                { exerciseId: catalogExerciseId('lat-pulldown'), sets: 3, reps: 10, intensity: { rpe: 7 }, restSeconds: 75 },
                { exerciseId: catalogExerciseId('seated-row'), sets: 3, reps: 10, intensity: { rpe: 7 }, restSeconds: 75 },
              ],
            },
            {
              id: workoutBlockId('day-3-evening-accessory'),
              type: 'accessory',
              name: 'Loaded carry',
              prescriptions: [
                { exerciseId: catalogExerciseId('farmers-walk'), sets: 4, distanceMeters: 30, intensity: { rpe: 7 }, restSeconds: 60 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-4'),
      dayIndex: 4,
      title: 'Thursday Recovery Run',
      sessions: [
        {
          id: workoutSessionId('day-4-morning-home'),
          type: 'recovery',
          location: 'home',
          title: 'Morning Reset',
          goals: ['pelvic_floor', 'relief'],
          capabilities: ['pelvic_control', 'recovery'],
          estimatedDurationMinutes: 12,
          blocks: [
            {
              id: workoutBlockId('day-4-morning-cooldown'),
              type: 'cooldown',
              name: 'Breathing reset',
              prescriptions: [
                { exerciseId: catalogExerciseId('pelvic-floor-breathing'), durationSeconds: 300 },
              ],
            },
          ],
        },
        {
          id: workoutSessionId('day-4-evening-run'),
          type: 'cardio',
          location: 'outdoor',
          title: 'Evening Recovery Run',
          goals: ['endurance', 'relief'],
          capabilities: ['endurance', 'recovery'],
          estimatedDurationMinutes: 30,
          blocks: [
            {
              id: workoutBlockId('day-4-evening-conditioning'),
              type: 'conditioning',
              name: 'Easy aerobic flow',
              prescriptions: [
                { exerciseId: catalogExerciseId('zone-2-walk'), durationSeconds: 1500, intensity: { zone: 'easy' } },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-5'),
      dayIndex: 5,
      title: 'Friday Full Body and Tests',
      sessions: [
        {
          id: workoutSessionId('day-5-morning-home'),
          type: 'assessment',
          location: 'home',
          title: 'Morning Weekly Core Test',
          goals: ['core_strength', 'hyperlordosis'],
          capabilities: ['core', 'posture'],
          estimatedDurationMinutes: 14,
          blocks: [
            {
              id: workoutBlockId('day-5-morning-test'),
              type: 'main',
              name: 'Weekly brace test',
              prescriptions: [
                { exerciseId: catalogExerciseId('plank'), sets: 1, durationSeconds: 60, notes: ['Record best crisp hold.'] },
                { exerciseId: catalogExerciseId('side-plank'), sets: 1, durationSeconds: 45, notes: ['Test both sides.'] },
              ],
            },
          ],
        },
        {
          id: workoutSessionId('day-5-evening-gym'),
          type: 'strength',
          location: 'gym',
          title: 'Evening Gym Full Body',
          goals: ['gto_gold', 'endurance'],
          capabilities: ['strength', 'endurance', 'core'],
          estimatedDurationMinutes: 55,
          blocks: [
            {
              id: workoutBlockId('day-5-evening-main'),
              type: 'main',
              name: 'Strength circuit',
              prescriptions: [
                { exerciseId: catalogExerciseId('step-up'), sets: 3, reps: 10, intensity: { rpe: 7 }, restSeconds: 60 },
                { exerciseId: catalogExerciseId('push-up'), sets: 3, reps: '8-12', restSeconds: 60 },
                { exerciseId: catalogExerciseId('kettlebell-swing'), sets: 4, reps: 12, intensity: { rpe: 6 }, restSeconds: 75 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-6'),
      dayIndex: 6,
      title: 'Saturday Weekend Endurance',
      sessions: [
        {
          id: workoutSessionId('day-6-morning-endurance'),
          type: 'cardio',
          location: 'outdoor',
          title: 'Weekend Endurance Base',
          goals: ['endurance', 'hiking', 'gto_gold'],
          capabilities: ['endurance', 'recovery'],
          estimatedDurationMinutes: 75,
          blocks: [
            {
              id: workoutBlockId('day-6-morning-conditioning'),
              type: 'conditioning',
              name: 'Long steady effort',
              prescriptions: [
                { exerciseId: catalogExerciseId('zone-2-walk'), durationSeconds: 3600, intensity: { zone: 'zone-2' } },
                { exerciseId: catalogExerciseId('incline-treadmill-walk'), durationSeconds: 900, intensity: { zone: 'steady' } },
              ],
            },
          ],
        },
      ],
    },
    {
      id: trainingDayId('day-7'),
      dayIndex: 7,
      title: 'Sunday Test and Restore',
      sessions: [
        {
          id: workoutSessionId('day-7-morning-home'),
          type: 'assessment',
          location: 'home',
          title: 'Weekly Endurance and Control Tests',
          goals: ['endurance', 'pelvic_floor', 'core_strength'],
          capabilities: ['endurance', 'pelvic_control', 'core'],
          estimatedDurationMinutes: 35,
          blocks: [
            {
              id: workoutBlockId('day-7-morning-test'),
              type: 'main',
              name: 'Weekly readiness tests',
              prescriptions: [
                { exerciseId: catalogExerciseId('zone-2-walk'), durationSeconds: 1200, notes: ['Record distance covered at easy effort.'] },
                { exerciseId: catalogExerciseId('heel-slide'), sets: 1, reps: 12, notes: ['Record whether pelvis stayed quiet.'] },
              ],
            },
            {
              id: workoutBlockId('day-7-morning-cooldown'),
              type: 'cooldown',
              name: 'Restore',
              prescriptions: [
                { exerciseId: catalogExerciseId('pelvic-floor-breathing'), durationSeconds: 240 },
              ],
            },
          ],
        },
      ],
    },
  ],
  notes: [
    'Seed data only: this is not a generator and does not track completion.',
    'Running sessions use the current catalog aerobic entries until dedicated run drills are added.',
  ],
} as const satisfies WorkoutPlan;

export type Project45WeeklySeedPlan = typeof PROJECT45_WEEKLY_SEED_PLAN;
