export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function readFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeToLocalStorage<T extends JsonValue>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}
