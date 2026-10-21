import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_STATEMENTS } from "./schema";
import { seedDatabase } from "./seed";

type Sqlite = Database.Database;

const globalForDb = globalThis as unknown as { __db?: Sqlite; __dbPath?: string };

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function databasePath(): string {
  return process.env.DATABASE_PATH || path.join(DATA_DIR, "aarohan.db");
}

function applySchema(db: Sqlite) {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  const tx = db.transaction(() => {
    for (const statement of SCHEMA_STATEMENTS) db.exec(statement);
    db.prepare(
      `INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'))`,
    ).run();
  });
  tx();
  try {
    const row = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    if (row.count === 0) seedDatabase(db);
  } catch (error) {
    console.error("database seeding failed", error);
  }
}

export function getDb(): Sqlite {
  const file = databasePath();
  if (globalForDb.__db && globalForDb.__dbPath === file) return globalForDb.__db;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const db = new Database(file);
  applySchema(db);
  globalForDb.__db = db;
  globalForDb.__dbPath = file;
  return db;
}

/** Runs `fn` inside a transaction and returns its result. */
export function withTransaction<T>(fn: (db: Sqlite) => T): T {
  const db = getDb();
  return db.transaction(fn)(db);
}

/** SQLite stores booleans as integers; these helpers keep call-sites readable. */
export const toBool = (value: unknown): boolean => value === 1 || value === true;
export const fromBool = (value: boolean): number => (value ? 1 : 0);

export { parseJson } from "./json";

export function nowIso(): string {
  return new Date().toISOString();
}
