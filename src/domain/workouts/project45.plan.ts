import type { WorkoutPlan } from './workout.types';

export const project45Plan: WorkoutPlan = {
  id: 'project-45',
  name: 'Project 45',
  version: '0.1.0',
  description: '8-week plan for GTO gold, endurance, pelvic floor, hyperlordosis, core strength, and better body composition.',
  days: [
    {
      id: 'mon',
      dayOfWeek: 1,
      name: 'Понедельник',
      focus: 'Ноги, ягодицы, гиперлордоз, кор',
      sessions: [
        {
          id: 'mon-morning',
          type: 'morning_home',
          title: 'Утро дома',
          location: 'home',
          estimatedMinutes: 22,
          blocks: [
            {
              id: 'mon-core',
              type: 'core',
              title: 'Мобильность и кор',
              prescriptions: [
                { exerciseId: 'pelvic-breathing', duration: '3 мин' },
                { exerciseId: 'pelvic-tilt', sets: 2, reps: '12' },
                { exerciseId: 'hip-flexor-stretch', sets: 2, duration: '45 сек/сторона' },
                { exerciseId: 'dead-bug', sets: 3, reps: '10/сторона' },
                { exerciseId: 'ab-wheel-knees', sets: 3, reps: '5–8' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'tue',
      dayOfWeek: 2,
      name: 'Вторник',
      focus: 'Бег ГТО и тазовое дно',
      sessions: [
        {
          id: 'tue-evening',
          type: 'evening_gym',
          title: 'Вечер скорость',
          location: 'gym',
          estimatedMinutes: 55,
          blocks: [
            {
              id: 'tue-run',
              type: 'conditioning',
              title: 'Беговые интервалы',
              prescriptions: [
                { exerciseId: 'run-intervals-400', sets: 4, reps: '400 м', rest: '2 мин' },
                { exerciseId: 'push-up', sets: 3, reps: '20–25' },
                { exerciseId: 'sit-and-reach', sets: 3, duration: '45 сек' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'wed',
      dayOfWeek: 3,
      name: 'Среда',
      focus: 'Верх тела, подтягивания, скалодром',
      sessions: [
        {
          id: 'wed-evening',
          type: 'evening_gym',
          title: 'Вечер зал или скалодром',
          location: 'gym',
          estimatedMinutes: 75,
          blocks: [
            {
              id: 'wed-pull',
              type: 'strength',
              title: 'Подтягивания и спина',
              prescriptions: [
                { exerciseId: 'pull-up', sets: 5, reps: '50–70% максимума' },
                { exerciseId: 'lat-pulldown', sets: 4, reps: '8–12' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'thu',
      dayOfWeek: 4,
      name: 'Четверг',
      focus: 'Восстановление и лордоз',
      sessions: [
        {
          id: 'thu-morning',
          type: 'morning_home',
          title: 'Утро восстановление',
          location: 'home',
          estimatedMinutes: 20,
          blocks: [
            {
              id: 'thu-recovery',
              type: 'mobility',
              title: 'Мягкое восстановление',
              prescriptions: [
                { exerciseId: 'pelvic-breathing', duration: '3 мин' },
                { exerciseId: 'pelvic-tilt', sets: 2, reps: '12' },
                { exerciseId: 'glute-bridge', sets: 3, reps: '15' },
                { exerciseId: 'incline-walk', duration: '30–45 мин' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fri',
      dayOfWeek: 5,
      name: 'Пятница',
      focus: 'Верх, кор, рельеф',
      sessions: [
        {
          id: 'fri-evening',
          type: 'evening_gym',
          title: 'Вечер зал',
          location: 'gym',
          estimatedMinutes: 70,
          blocks: [
            {
              id: 'fri-upper',
              type: 'strength',
              title: 'Верх и ГТО',
              prescriptions: [
                { exerciseId: 'pull-up', sets: 5, reps: '50–70% максимума' },
                { exerciseId: 'push-up', sets: 3, reps: '20–30' },
                { exerciseId: 'gto-abs', duration: '1 мин тест или 3×20' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'sat',
      dayOfWeek: 6,
      name: 'Суббота',
      focus: 'Хайк или длинная выносливость',
      sessions: [
        {
          id: 'sat-cardio',
          type: 'outdoor',
          title: 'Длинное кардио',
          location: 'outdoor',
          estimatedMinutes: 90,
          blocks: [
            {
              id: 'sat-endurance',
              type: 'conditioning',
              title: 'Выносливость',
              prescriptions: [
                { exerciseId: 'incline-walk', duration: '60+ мин' },
                { exerciseId: 'sit-and-reach', sets: 3, duration: '45 сек' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'sun',
      dayOfWeek: 7,
      name: 'Воскресенье',
      focus: 'Контрольные тесты и восстановление',
      sessions: [
        {
          id: 'sun-test',
          type: 'test',
          title: 'Еженедельные тесты',
          location: 'gym',
          estimatedMinutes: 35,
          blocks: [
            {
              id: 'sun-gto',
              type: 'test',
              title: 'ГТО контроль',
              prescriptions: [
                { exerciseId: 'push-up', reps: 'максимум' },
                { exerciseId: 'pull-up', reps: 'максимум' },
                { exerciseId: 'gto-abs', duration: '1 мин' },
                { exerciseId: 'sit-and-reach', sets: 3, duration: '45 сек' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
