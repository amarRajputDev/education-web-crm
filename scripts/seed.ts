import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA_STATEMENTS } from "../src/lib/schema";
import { seedDatabase } from "../src/lib/seed";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "aarohan.db");
const force = process.argv.includes("--force");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

for (const statement of SCHEMA_STATEMENTS) db.exec(statement);
db.prepare(`INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'))`).run();

seedDatabase(db, { force });

const tables = [
  "users",
  "roles",
  "departments",
  "courses",
  "faculty",
  "enquiries",
  "enquiry_notes",
  "follow_up_tasks",
  "admission_applications",
  "application_documents",
  "news_posts",
  "events",
  "gallery_items",
  "testimonials",
  "faqs",
];
const counts: Record<string, number> = {};
for (const table of tables) {
  counts[table] = (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;
}

console.log(`Database ready: ${dbPath}`);
console.table(counts);
db.close();
