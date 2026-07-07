import { describe, expect, it } from 'vitest';
import missingMediaReport from '../../../docs/MISSING_EXERCISE_MEDIA.md?raw';
import {
  CAPABILITY_IDS,
  EQUIPMENT_IDS,
  GOAL_IDS,
  MUSCLE_GROUPS,
  PROJECT45_EXERCISES,
} from '..';

const gifModules = import.meta.glob('../../../gifs/*.gif', { query: '?url', import: 'default' });
const legacyGifPaths = new Set(Object.keys(gifModules).map((path) => path.replace('../../../', '../')));

describe('PROJECT45_EXERCISES', () => {
  it('has unique exercise ids', () => {
    const ids = PROJECT45_EXERCISES.map((exercise) => exercise.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only known goals, capabilities, equipment, and muscle groups', () => {
    const knownGoals = new Set(GOAL_IDS);
    const knownCapabilities = new Set(CAPABILITY_IDS);
    const knownEquipment = new Set(EQUIPMENT_IDS);
    const knownMuscleGroups = new Set(MUSCLE_GROUPS);

    for (const exercise of PROJECT45_EXERCISES) {
      expect(exercise.goals.every((goal) => knownGoals.has(goal))).toBe(true);
      expect(exercise.capabilities.every((capability) => knownCapabilities.has(capability))).toBe(true);
      expect(exercise.equipment.required.every((equipment) => knownEquipment.has(equipment))).toBe(true);
      expect(
        'optional' in exercise.equipment
          ? (exercise.equipment.optional ?? []).every((equipment) => knownEquipment.has(equipment))
          : true,
      ).toBe(true);
      expect(exercise.muscleGroups.primary.every((muscleGroup) => knownMuscleGroups.has(muscleGroup))).toBe(true);
      expect(exercise.muscleGroups.secondary?.every((muscleGroup) => knownMuscleGroups.has(muscleGroup)) ?? true).toBe(
        true,
      );
    }
  });

  it('uses existing local GIFs when media is configured', () => {
    for (const exercise of PROJECT45_EXERCISES) {
      if (!exercise.media) {
        continue;
      }

      expect(exercise.media.kind).toBe('gif');
      expect(exercise.media.path.startsWith('../gifs/')).toBe(true);
      expect(legacyGifPaths.has(exercise.media.path)).toBe(true);
    }
  });

  it('documents every catalog exercise without media', () => {
    for (const exercise of PROJECT45_EXERCISES) {
      if (exercise.media) {
        continue;
      }

      expect(missingMediaReport).toContain(`\`${exercise.id}\``);
    }
  });
});
