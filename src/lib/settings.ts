import { getDb } from "./db";

import { SETTING_DEFINITIONS, type SettingType } from "./setting-defs";

export { SETTING_DEFINITIONS };
export type { SettingType };
export const DEFAULT_SETTINGS = SETTING_DEFINITIONS;

let cache: Record<string, string> | null = null;

function loadCache(): Record<string, string> {
  if (cache) return cache;
  const db = getDb();
  const map: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) map[key] = DEFAULT_SETTINGS[key].value;
  try {
    const rows = db.prepare("SELECT setting_key, setting_value FROM site_settings").all() as {
      setting_key: string;
      setting_value: string;
    }[];
    for (const row of rows) map[row.setting_key] = row.setting_value;
  } catch {
    // Fresh database before seeding — defaults are still usable.
  }
  cache = map;
  return map;
}

export function getSetting(key: string, fallback = ""): string {
  const map = loadCache();
  const value = map[key];
  return value === undefined || value === null ? fallback : String(value);
}

export function getBooleanSetting(key: string, fallback = false): boolean {
  const raw = getSetting(key, fallback ? "true" : "false").toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function getNumberSetting(key: string, fallback = 0): number {
  const parsed = Number(getSetting(key, String(fallback)));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getAllSettings(): Record<string, string> {
  return { ...loadCache() };
}

export function setSetting(key: string, value: string, label?: string, group?: string): void {
  const db = getDb();
  const meta = DEFAULT_SETTINGS[key];
  db.prepare(
    `INSERT INTO site_settings (setting_key, setting_value, group_name, label, type, help, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(setting_key) DO UPDATE SET
       setting_value = excluded.setting_value,
       label = excluded.label,
       updated_at = datetime('now')`,
  ).run(
    key,
    value,
    group ?? meta?.group ?? "general",
    label ?? meta?.label ?? key,
    meta?.type ?? "text",
    meta?.help ?? "",
  );
  cache = null;
}

export function setManySettings(entries: Record<string, string>): void {
  const db = getDb();
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries(entries)) {
      const meta = DEFAULT_SETTINGS[key];
      db.prepare(
        `INSERT INTO site_settings (setting_key, setting_value, group_name, label, type, help, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(setting_key) DO UPDATE SET
           setting_value = excluded.setting_value,
           label = excluded.label,
           updated_at = datetime('now')`,
      ).run(
        key,
        value,
        meta?.group ?? "general",
        meta?.label ?? key,
        meta?.type ?? "text",
        meta?.help ?? "",
      );
    }
  });
  run();
  cache = null;
}

export { SETTING_DEFINITIONS as SETTINGS_DEFINITIONS };
