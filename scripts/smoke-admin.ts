/* Read-only smoke test for the admin panel. Usage:
     npx tsx scripts/smoke-admin.ts [baseUrl]
   Requires the app to be running (npm run start) and data/aarohan.db seeded. */
import crypto from "node:crypto";
import Database from "better-sqlite3";

const BASE = process.argv[2] ?? "http://localhost:3210";
const db = new Database("data/aarohan.db", { readonly: true });

const user = db
  .prepare(`SELECT id, name, role_key FROM users WHERE email = ?`)
  .get("admin@agentiva.demo") as { id: number; name: string; role_key: string } | undefined;
if (!user) {
  console.error("No super admin user found — run npm run seed first.");
  process.exit(1);
}

const enquiry = db.prepare(`SELECT id FROM enquiries ORDER BY id LIMIT 1`).get() as { id: number } | undefined;
const application = db.prepare(`SELECT id FROM admission_applications ORDER BY id LIMIT 1`).get() as
  | { id: number }
  | undefined;
const document = db.prepare(`SELECT id FROM application_documents ORDER BY id LIMIT 1`).get() as { id: number } | undefined;

db.close();

/* Session rows need read-write access */
const rw = new Database("data/aarohan.db");
const token = crypto.randomBytes(32).toString("hex");
const sessionId = crypto.createHash("sha256").update(token).digest("hex");
rw.prepare(
  `INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, datetime('now', '+1 day'), '127.0.0.1', 'smoke-script')`,
).run(sessionId, user.id);
rw.close();

const cookie = `aarohan_session=${token}`;

type Case = { path: string; expect?: number; mustContain?: string[] };

const cases: Case[] = [
  { path: "/admin/login" },
  { path: "/admin/dashboard", mustContain: ["Enquiry", "Applications"] },
  { path: "/admin/enquiries", mustContain: ["Enquiry management"] },
  { path: "/admin/enquiries?view=kanban", mustContain: ["Pipeline"] },
  { path: "/admin/enquiries?view=today", mustContain: ["Follow-ups"] },
  { path: "/admin/enquiries?status=new&q=zzzz-no-match", mustContain: ["No enquiries match"] },
  { path: "/admin/enquiries/new", mustContain: ["Add an enquiry"] },
  { path: "/admin/enquiries/" + (enquiry?.id ?? 1), mustContain: ["Lead controls", "Contact history", "Activity timeline"] },
  { path: "/admin/admissions", mustContain: ["Admissions review"] },
  { path: "/admin/admissions/" + (application?.id ?? 1), mustContain: ["Decision", "Documents", "Review history"] },
  { path: "/admin/students", mustContain: ["Enrolled students"] },
  { path: "/admin/courses", mustContain: ["Course"] },
  { path: "/admin/faculty" },
  { path: "/admin/departments" },
  { path: "/admin/news" },
  { path: "/admin/events" },
  { path: "/admin/gallery" },
  { path: "/admin/testimonials" },
  { path: "/admin/faqs" },
  { path: "/admin/downloads" },
  { path: "/admin/content", mustContain: ["Content"] },
  { path: "/admin/reports", mustContain: ["Reports"] },
  { path: "/admin/team", mustContain: ["Team"] },
  { path: "/admin/settings", mustContain: ["Settings"] },
  { path: "/admin/audit-logs", mustContain: ["Audit"] },
  { path: "/admin/search?q=an", mustContain: ["Search"] },
  { path: "/admin/profile", mustContain: ["Password"] },
  { path: "/admin/notifications" },
  { path: "/admin/unauthorized", mustContain: ["access"] },
  { path: "/api/admin/export?report=enquiries&range=30", expect: 200 },
];

let failures = 0;

for (const testCase of cases) {
  const response = await fetch(BASE + testCase.path, {
    headers: { cookie },
    redirect: "manual",
  });
  const status = response.status;
  const expected = testCase.expect ?? 200;
  const body = status === 200 ? await response.text() : "";
  const missing = (testCase.mustContain ?? []).filter((needle) => !body.toLowerCase().includes(needle.toLowerCase()));
  const ok = status === expected && missing.length === 0;
  if (!ok) {
    failures++;
    console.error(
      `FAIL ${status} (want ${expected}) ${testCase.path}${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`,
    );
  } else {
    console.log(`ok   ${status} ${testCase.path}`);
  }
}

/* 401 without a session */
{
  const response = await fetch(BASE + "/api/admin/export?report=enquiries", { redirect: "manual" });
  if (response.status !== 401) {
    failures++;
    console.error(`FAIL export without cookie returned ${response.status}, expected 401`);
  } else {
    console.log("ok   401 /api/admin/export without session");
  }
}

/* 307 to login without a session */
{
  const response = await fetch(BASE + "/admin/enquiries", { redirect: "manual" });
  const location = response.headers.get("location") ?? "";
  if (response.status !== 307 || !location.includes("/admin/login")) {
    failures++;
    console.error(`FAIL /admin/enquiries unauthenticated → ${response.status} ${location}`);
  } else {
    console.log("ok   307 /admin/enquiries → login");
  }
}

/* CSV shape */
{
  const response = await fetch(BASE + "/api/admin/export?report=enquiries&range=30", { headers: { cookie } });
  const text = await response.text();
  if (!response.headers.get("content-type")?.includes("text/csv") || text.split("\n").length < 2) {
    failures++;
    console.error("FAIL CSV export shape", response.headers.get("content-type"), text.slice(0, 120));
  } else {
    console.log("ok   CSV export content-type + rows");
  }
}

/* Document download endpoint: seeded demo has metadata but no physical files — must answer honestly with 404 */
if (document) {
  const response = await fetch(BASE + `/api/admin/documents/${document.id}`, { headers: { cookie } });
  if (response.status === 200) {
    console.log(`ok   200 /api/admin/documents/${document.id} (physical file present)`);
  } else if (response.status === 404) {
    const body = await response.json().catch(() => ({}));
    if (body.error) {
      console.log(`ok   404 /api/admin/documents/${document.id} (${body.error} — honest missing-file response)`);
    } else {
      failures++;
      console.error("FAIL document 404 without explanation", body);
    }
  } else {
    failures++;
    console.error(`FAIL /api/admin/documents/${document.id} → ${response.status}`);
  }
}

/* cleanup */
{
  const rw2 = new Database("data/aarohan.db");
  rw2.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
  rw2.close();
}

console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
