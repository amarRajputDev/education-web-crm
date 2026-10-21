/**
 * Isomorphic helpers that must be safe to import from client components.
 * (The database layer is intentionally NOT imported here.)
 */

/** Parses a JSON column, returning `fallback` on null/invalid content. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

/** SQLite stores booleans as integers; these helpers keep call-sites readable. */
export const toBool = (value: unknown): boolean => value === 1 || value === true;
export const fromBool = (value: boolean): number => (value ? 1 : 0);

export function nowIso(): string {
  return new Date().toISOString();
}
