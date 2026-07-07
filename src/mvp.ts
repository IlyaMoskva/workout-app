export const APP_VERSION_LABEL = 'MVP 0.1';

export const APP_NAV_ITEMS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'history', label: 'History' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'gto', label: 'GTO' },
  { id: 'library', label: 'Library' },
  { id: 'settings', label: 'Settings' },
] as const;

export type AppView = (typeof APP_NAV_ITEMS)[number]['id'];

export const COMPLETION_STORAGE_KEY = 'project45.today.completions.v1';
export const GTO_STORAGE_KEY = 'project45.gto.weekly-tests.v1';
export const RECOVERY_STORAGE_KEY = 'project45.recovery.daily-check-ins.v1';
export const SETTINGS_STORAGE_KEY = 'project45.settings.v1';

export type LocalDataKey =
  | typeof COMPLETION_STORAGE_KEY
  | typeof GTO_STORAGE_KEY
  | typeof RECOVERY_STORAGE_KEY
  | typeof SETTINGS_STORAGE_KEY;

export const BACKUP_SCHEMA = 'project45-local-backup';
export const BACKUP_VERSION = 1;
export const LOCAL_DATA_KEYS = [
  SETTINGS_STORAGE_KEY,
  COMPLETION_STORAGE_KEY,
  RECOVERY_STORAGE_KEY,
  GTO_STORAGE_KEY,
] as const satisfies readonly LocalDataKey[];
