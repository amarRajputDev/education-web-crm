import Link from "next/link";
import { Download, GraduationCap, Mail, Phone, UserCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader, AdminCard } from "@/components/admin/page-header";
import { AdminPager } from "@/components/admin/pager";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDateTime, statusTone } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { q?: string; course?: string; session?: string; page?: string };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const ctx = await requireAuth(PERMISSIONS.APPLICATION_VIEW);
  void ctx;
  const params = await searchParams;
  const db = getDb();

  const where: string[] = [`a.status = 'enrolled'`];
  const args: unknown[] = [];
  if (params.q) {
    where.push("(a.full_name LIKE ? OR a.ref LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)");
    const like = `%${params.q}%`;
    args.push(like, like.toUpperCase(), like, like);
  }
  if (params.course) {
    where.push("a.course_id = ?");
    args.push(Number(params.course));
  }
  if (params.session) {
    where.push("a.session_id = ?");
    args.push(Number(params.session));
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const PAGE_SIZE = 15;
  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM admission_applications a ${whereSql}`).get(...(args as never[])) as { c: number }
  ).c;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);

  const students = db
    .prepare(
      `SELECT a.id, a.ref, a.full_name, a.email, a.phone, a.course_name, a.session_name, a.updated_at,
              a.document_status, a.dob, a.city,
              (SELECT COUNT(*) FROM application_documents d WHERE d.application_id = a.id AND d.status = 'verified') AS doc_verified,
              (SELECT COUNT(*) FROM application_documents d WHERE d.application_id = a.id) AS doc_total
         FROM admission_applications a
         ${whereSql}
        ORDER BY a.full_name ASC
        LIMIT ? OFFSET ?`,
    )
    .all(...(args as never[]), PAGE_SIZE, (page - 1) * PAGE_SIZE) as {
    id: number;
    ref: string;
    full_name: string;
    email: string;
    phone: string;
    course_name: string;
    session_name: string;
    updated_at: string;
    document_status: string;
    dob: string;
    city: string;
    doc_verified: number;
    doc_total: number;
  }[];

  const courses = db
    .prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`)
    .all() as { id: number; name: string }[];
  const sessions = db.prepare(`SELECT id, name FROM academic_sessions ORDER BY id DESC`).all() as {
    id: number;
    name: string;
  }[];

  const byCourse = db
    .prepare(
      `SELECT course_name, COUNT(*) AS count FROM admission_applications
        WHERE status = 'enrolled' AND course_name != ''
        GROUP BY course_name ORDER BY count DESC LIMIT 8`,
    )
    .all() as { course_name: string; count: number }[];
  const maxCourse = Math.max(1, ...byCourse.map((row) => row.count));

  const sessionCount = (
    db
      .prepare(`SELECT COUNT(*) AS c FROM admission_applications WHERE status = 'enrolled' AND updated_at >= datetime('now','-180 days')`)
      .get() as { c: number }
  ).c;

  const selectClass =
    "w-full rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px] text-navy focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/15";

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Enrolled students"
        description="Candidates whose applications reached the enrolled status — the student master list for this demo."
        meta={[
          { label: "Enrolled", value: total },
          { label: "Recent (180d)", value: sessionCount },
          { label: "Programmes", value: byCourse.length },
        ]}
        actions={
          can(ctx.user.role_key, PERMISSIONS.REPORT_EXPORT) ? (
            <a href="/api/admin/export?report=enrolment" className="btn btn-outline btn-sm">
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </a>
          ) : undefined
        }
      />

      <form method="get" className="card flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="student-q" className="label">
            Search
          </label>
          <input id="student-q" name="q" type="search" defaultValue={params.q ?? ""} placeholder="Name, ID, email or phone…" className={selectClass} />
        </div>
        <div className="min-w-[180px]">
          <label htmlFor="student-course" className="label">
            Programme
          </label>
          <select id="student-course" name="course" defaultValue={params.course ?? ""} className={selectClass}>
            <option value="">All programmes</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label htmlFor="student-session" className="label">
            Session
          </label>
          <select id="student-session" name="session" defaultValue={params.session ?? ""} className={selectClass}>
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Apply
        </button>
      </form>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {students.length === 0 ? (
            <EmptyState
              icon="search"
              title={total === 0 ? "No enrolled students yet" : "No students match these filters"}
              description="Move an application to the enrolled status on its review page to list the student here."
              action={
                <Link href="/admin/admissions" className="btn btn-navy btn-sm">
                  Review applications
                </Link>
              }
            />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Programme</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Enrolled on</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-royal">{student.ref}</td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-navy">{student.full_name}</span>
                        <span className="block text-[11px] text-slate-body">
                          {student.city || "—"}{student.dob ? ` · DOB ${student.dob}` : ""}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-[13px]">{student.course_name || "—"}</td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-body">{student.session_name || "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-body">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" aria-hidden />
                          <span className="truncate">{student.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" aria-hidden />
                          {student.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={student.doc_verified === student.doc_total && student.doc_total > 0 ? "success" : "warning"}>
                          {student.doc_verified}/{student.doc_total} verified
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-body">{formatDateTime(student.updated_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/admissions/${student.id}`} className="btn btn-outline btn-sm">
                          File
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 ? (
            <div className="card overflow-hidden">
              <AdminPager page={page} pageCount={pageCount} total={total} label="students" />
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <AdminCard title="By programme" description="Enrolled students grouped by course">
            {byCourse.length === 0 ? (
              <p className="text-xs text-slate-body">No enrolments recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {byCourse.map((row) => (
                  <li key={row.course_name}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-navy">{row.course_name}</span>
                      <span className="font-bold text-royal">{row.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-royal" style={{ width: `${(row.count / maxCourse) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="Status legend">
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone("enrolled")} dot>
                Enrolled
              </Badge>
              <Badge tone="success">Documents verified</Badge>
              <Badge tone="warning">Documents outstanding</Badge>
            </div>
            <p className="mt-3 flex gap-2 text-xs text-slate-body">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden />
              Student records are derived from the admission workflow — there is no separate manual student table, so every row
              traces back to a reviewed application.
            </p>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
