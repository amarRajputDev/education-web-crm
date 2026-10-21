import Link from "next/link";
import { ClipboardList, Download, Inbox, Search, UserCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPager } from "@/components/admin/pager";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AdmissionsFilters } from "@/components/admin/admissions/filters";
import { ApplicationSelection } from "@/components/admin/admissions/selection";
import { formatDateTime, relativeTime, statusTone } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type Params = {
  q?: string;
  status?: string;
  course?: string;
  reviewer?: string;
  doc?: string;
  from?: string;
  to?: string;
  page?: string;
};

const PAGE_SIZE = 15;

export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const ctx = await requireAuth(PERMISSIONS.APPLICATION_VIEW);
  const params = await searchParams;
  const canManage = can(ctx.user.role_key, PERMISSIONS.APPLICATION_MANAGE);

  const db = getDb();
  const courses = db.prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`).all() as {
    id: number;
    name: string;
  }[];
  const reviewers = db
    .prepare(`SELECT id, name FROM users WHERE status = 'active' ORDER BY name`)
    .all() as { id: number; name: string }[];
  const statuses = db
    .prepare(`SELECT key, name, sort_order FROM application_statuses ORDER BY sort_order`)
    .all() as { key: string; name: string; sort_order: number }[];

  const where: string[] = [];
  const args: unknown[] = [];
  if (params.q) {
    where.push("(a.full_name LIKE ? OR a.ref LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)");
    const like = `%${params.q}%`;
    args.push(like, like.toUpperCase(), like, like);
  }
  if (params.status) {
    where.push("a.status = ?");
    args.push(params.status);
  }
  if (params.course) {
    where.push("a.course_id = ?");
    args.push(Number(params.course));
  }
  if (params.reviewer === "none") {
    where.push("a.reviewer_id IS NULL");
  } else if (params.reviewer) {
    where.push("a.reviewer_id = ?");
    args.push(Number(params.reviewer));
  }
  if (params.doc) {
    where.push("a.document_status = ?");
    args.push(params.doc);
  }
  if (params.from) {
    where.push("date(a.submitted_at) >= date(?)");
    args.push(params.from);
  }
  if (params.to) {
    where.push("date(a.submitted_at) <= date(?)");
    args.push(params.to);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM admission_applications a ${whereSql}`).get(...(args as never[])) as { c: number }
  ).c;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = db
    .prepare(
      `SELECT a.id, a.ref, a.full_name, a.email, a.phone, a.course_name, a.session_name, a.status,
              a.document_status, a.submitted_at, a.updated_at,
              s.name AS status_name, s.color AS status_color,
              u.name AS reviewer_name,
              c.id AS enquiry_id,
              (SELECT COUNT(*) FROM application_documents d WHERE d.application_id = a.id) AS doc_total,
              (SELECT COUNT(*) FROM application_documents d WHERE d.application_id = a.id AND d.status = 'verified') AS doc_verified
         FROM admission_applications a
         LEFT JOIN application_statuses s ON s.key = a.status
         LEFT JOIN users u ON u.id = a.reviewer_id
         LEFT JOIN enquiries c ON c.id = a.enquiry_id
         ${whereSql}
        ORDER BY CASE a.status WHEN 'submitted' THEN 0 WHEN 'under_review' THEN 1 WHEN 'documents_required' THEN 2 ELSE 3 END,
                 a.submitted_at DESC
        LIMIT ? OFFSET ?`,
    )
    .all(...(args as never[]), PAGE_SIZE, offset) as {
    id: number;
    ref: string;
    full_name: string;
    email: string;
    phone: string;
    course_name: string;
    session_name: string;
    status: string;
    document_status: string;
    submitted_at: string;
    updated_at: string;
    status_name: string | null;
    status_color: string | null;
    reviewer_name: string | null;
    enquiry_id: number | null;
    doc_total: number;
    doc_verified: number;
  }[];

  const stats = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status IN ('submitted','under_review','documents_required','documents_verified','interview_scheduled') THEN 1 ELSE 0 END) AS open_count,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN status = 'enrolled' THEN 1 ELSE 0 END) AS enrolled,
              SUM(CASE WHEN document_status IN ('pending','partial') THEN 1 ELSE 0 END) AS docs_pending,
              SUM(CASE WHEN reviewer_id IS NULL THEN 1 ELSE 0 END) AS unassigned
         FROM admission_applications`,
    )
    .get() as {
    total: number;
    open_count: number;
    approved: number;
    enrolled: number;
    docs_pending: number;
    unassigned: number;
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Admissions review"
        description="Applications submitted online — verify documents, assign reviewers and move candidates through the decision workflow."
        meta={[
          { label: "Total", value: stats.total },
          { label: "Open", value: stats.open_count },
          { label: "Approved", value: stats.approved },
          { label: "Enrolled", value: stats.enrolled },
          { label: "Docs pending", value: stats.docs_pending },
          { label: "Unassigned", value: stats.unassigned },
        ]}
        actions={
          <>
            <Link href="/admin/reports?report=applications" className="btn btn-outline btn-sm">
              <Download className="h-4 w-4" aria-hidden />
              Reports
            </Link>
            <Link href="/admin/students" className="btn btn-navy btn-sm">
              <UserCheck className="h-4 w-4" aria-hidden />
              Enrolled students
            </Link>
          </>
        }
      />

      <AdmissionsFilters
        courses={courses.map((course) => ({ value: String(course.id), label: course.name }))}
        reviewers={reviewers.map((reviewer) => ({ value: String(reviewer.id), label: reviewer.name }))}
        statuses={statuses.map((status) => ({ value: status.key, label: status.name }))}
        resultCount={total}
      />

      {stats.unassigned > 0 && canManage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold-100 px-4 py-3 text-[13px] text-navy">
          <Inbox className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />
          <span>
            <strong>{stats.unassigned}</strong> application{stats.unassigned === 1 ? " has" : "s have"} no reviewer yet. Select rows below to
            assign one in bulk.
          </span>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={total === 0 ? "empty" : "search"}
          title={total === 0 ? "No applications yet" : "No applications match these filters"}
          description={
            total === 0
              ? "Applications submitted through the public admission form appear here instantly."
              : "Try clearing a filter or widening the date range."
          }
        />
      ) : (
        <ApplicationSelection
          rows={rows.map((row) => ({
            id: row.id,
            ref: row.ref,
            name: row.full_name,
            course: row.course_name,
            status: row.status,
            statusName: row.status_name ?? row.status,
            documentStatus: row.document_status,
            docTotal: row.doc_total,
            docVerified: row.doc_verified,
            reviewer: row.reviewer_name,
            submittedAt: row.submitted_at,
            enquiryId: row.enquiry_id,
          }))}
          reviewers={reviewers}
          canManage={canManage}
        />
      )}

      {total > 0 ? (
        <div className="card overflow-hidden">
          <AdminPager page={page} pageCount={pageCount} total={total} label="applications" />
        </div>
      ) : null}

      <p className="text-[11px] text-slate-body">
        <ClipboardList className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Last application received {rows[0] ? relativeTime(rows[0].submitted_at) : "—"} · documents are stored privately and only stream
        through a permission-checked endpoint.
      </p>
    </div>
  );
}
