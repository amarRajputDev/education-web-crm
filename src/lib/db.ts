import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SCHEMA_STATEMENTS } from "./schema";
import { seedDatabase } from "./seed";

type Sqlite = Database.Database;

const globalForDb = globalThis as unknown as { __db?: Sqlite; __dbPath?: string };

/**
 * Storage must work both locally and on serverless hosts (Vercel runs the
 * bundle at /var/task with a read-only filesystem — only /tmp is writable).
 */
function canUseDirectory(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    fs.writeFileSync(probe, "ok");
    fs.rmSync(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

function pickDataDir(): string {
  const override = process.env.DATA_DIR;
  if (override && canUseDirectory(override)) return override;

  const projectDir = path.join(process.cwd(), "data");
  if (canUseDirectory(projectDir)) return projectDir;

  const tmpDir = path.join(os.tmpdir(), "aarohan-demo-data");
  canUseDirectory(tmpDir);
  return tmpDir;
}

export const DATA_DIR = pickDataDir();
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export function databasePath(): string {
  return process.env.DATABASE_PATH || path.join(DATA_DIR, "aarohan.db");
}

/**
 * If we had to move to a writable directory, bring the demo database that
 * ships with the build along so the seeded content is preserved.
 */
function restoreBundledDatabase(target: string) {
  if (fs.existsSync(target)) return;
  const bundled = path.join(process.cwd(), "data", "aarohan.db");
  if (!fs.existsSync(bundled) || path.resolve(bundled) === path.resolve(target)) return;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(bundled, target);
  } catch (error) {
    console.error("could not copy bundled database, falling back to auto-seed", error);
  }
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
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // Read-only filesystem — databasePath()/DATA_DIR already point at a writable fallback.
    console.error("data directory check failed", error);
  }
  restoreBundledDatabase(file);
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
