import { describe, expect, it } from 'vitest';
import { PROJECT45_EXERCISES, PROJECT45_WEEKLY_SEED_PLAN } from './domain';
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
} from './mvp';

describe('MVP smoke checks', () => {
  it('opens into a Today-first navigation with every implemented MVP screen reachable', () => {
    expect(APP_NAV_ITEMS[0]).toEqual({ id: 'today', label: 'Today' });
    expect(APP_NAV_ITEMS.map((item) => item.id)).toEqual([
      'today',
      'week',
      'history',
      'recovery',
      'gto',
      'library',
      'settings',
    ]);
  });

  it('exposes the visible MVP version label', () => {
    expect(APP_VERSION_LABEL).toBe('MVP 0.1');
  });

  it('keeps known local-first data keys available for backup and restore', () => {
    expect(LOCAL_DATA_KEYS).toEqual([
      SETTINGS_STORAGE_KEY,
      COMPLETION_STORAGE_KEY,
      RECOVERY_STORAGE_KEY,
      GTO_STORAGE_KEY,
    ]);
    expect(new Set(LOCAL_DATA_KEYS).size).toBe(LOCAL_DATA_KEYS.length);
    expect(LOCAL_DATA_KEYS.every((key) => key.startsWith('project45.'))).toBe(true);
    expect(BACKUP_SCHEMA).toBe('project45-local-backup');
    expect(BACKUP_VERSION).toBe(1);
  });

  it('has a seed plan and catalog for the daily Today flow', () => {
    expect(PROJECT45_WEEKLY_SEED_PLAN.days).toHaveLength(7);
    expect(PROJECT45_WEEKLY_SEED_PLAN.days.every((day) => day.sessions.length > 0)).toBe(true);
    expect(PROJECT45_EXERCISES.length).toBeGreaterThan(0);
  });
});
