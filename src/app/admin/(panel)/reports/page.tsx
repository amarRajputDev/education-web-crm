import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Download, Percent, UserCheck, Users } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { priorityTone, statusTone } from "@/lib/format";
import { can, PERMISSIONS } from "@/lib/rbac";
import { buildReport, parseReportParams, REPORT_OPTIONS, reportKpis, reportScope } from "@/lib/report-queries";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi";
import { ListPagination } from "@/components/admin/academics/list-pagination";
import { PrintButton } from "@/components/admin/print-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ErrorSummary } from "@/components/ui/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

const PER_PAGE = 15;

const RANGES: { value: string; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

const FOLLOWUP_STATUSES = [
  { key: "pending", name: "Pending" },
  { key: "completed", name: "Completed" },
  { key: "missed", name: "Missed" },
];

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

function ReportCell({ column, value }: { column: string; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-body">—</span>;
  }

  if (column === "Status" || column === "Documents") {
    const key = String(value);
    return <Badge tone={statusTone(key)}>{key.replace(/_/g, " ")}</Badge>;
  }
  if (column === "Priority") {
    const key = String(value);
    return <Badge tone={priorityTone(key)}>{key}</Badge>;
  }
  if (column.endsWith("%")) {
    return <span className="font-semibold tabular-nums text-navy">{String(value)}%</span>;
  }
  if (typeof value === "number") {
    return <span className="tabular-nums text-slate-body">{value}</span>;
  }
  return <span className="text-slate-body">{String(value)}</span>;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireAuth(PERMISSIONS.REPORT_VIEW);
  const params = await searchParams;
  const { report, filters, errors } = parseReportParams(params);
  const scope = reportScope(ctx.user.role_key, ctx.user.id);

  const result = buildReport(report, filters, scope);
  const kpis = reportKpis(report, filters, scope);

  const pageCount = Math.max(1, Math.ceil(result.rows.length / PER_PAGE));
  const requestedPage = Number(first(params.page)) || 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const pageRows = result.rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const db = getDb();
  const courses = db.prepare(`SELECT id, name FROM courses ORDER BY name`).all() as {
    id: number;
    name: string;
  }[];
  const counsellors = db
    .prepare(`SELECT id, name FROM users WHERE role_key = 'counsellor' ORDER BY name`)
    .all() as { id: number; name: string }[];
  const enquiryStatuses = db
    .prepare(`SELECT key, name FROM enquiry_statuses WHERE active = 1 ORDER BY sort_order`)
    .all() as { key: string; name: string }[];
  const applicationStatuses = db
    .prepare(`SELECT key, name FROM application_statuses WHERE active = 1 ORDER BY sort_order`)
    .all() as { key: string; name: string }[];

  const statusOptions =
    report === "applications"
      ? applicationStatuses
      : report === "followups"
        ? FOLLOWUP_STATUSES
        : enquiryStatuses;

  const canExport = can(ctx.user.role_key, PERMISSIONS.REPORT_EXPORT);
  const canPickCounsellor = canExport || can(ctx.user.role_key, PERMISSIONS.REPORT_VIEW);

  const exportParams = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (key === "page") continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) exportParams.set(key, value);
  }
  if (!exportParams.has("report")) exportParams.set("report", report);
  const exportHref = `/api/admin/export?${exportParams.toString()}`;

  const selected = REPORT_OPTIONS.find((item) => item.value === report) ?? REPORT_OPTIONS[0];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reports"
        description="Admission funnel reporting with CSV export and print-friendly layouts. Every figure is calculated from stored records."
        meta={[
          { label: "Report", value: selected.label },
          { label: "Rows", value: result.rows.length },
        ]}
        actions={
          <>
            {canExport ? (
              <a href={exportHref} className="btn btn-navy btn-sm" download>
                <Download className="h-4 w-4" aria-hidden />
                Download CSV
              </a>
            ) : null}
            <PrintButton />
          </>
        }
      />

      <form method="get" action="/admin/reports" className="card no-print flex flex-col gap-4 p-4 sm:p-5">
        <ErrorSummary errors={errors} title="Some filters were ignored" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="filter-report" className="label">
              Report
            </label>
            <select id="filter-report" name="report" defaultValue={report} className="field appearance-none">
              {REPORT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-range" className="label">
              Date range
            </label>
            <select id="filter-range" name="range" defaultValue={filters.range ?? "30"} className="field appearance-none">
              {RANGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-from" className="label">
              From date
            </label>
            <input id="filter-from" type="date" name="from" defaultValue={filters.from ?? ""} className="field" />
          </div>

          <div>
            <label htmlFor="filter-to" className="label">
              To date
            </label>
            <input id="filter-to" type="date" name="to" defaultValue={filters.to ?? ""} className="field" />
          </div>

          <div>
            <label htmlFor="filter-course" className="label">
              Programme
            </label>
            <select id="filter-course" name="courseId" defaultValue={String(filters.courseId ?? 0)} className="field appearance-none">
              <option value="0">All programmes</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {canPickCounsellor ? (
            <div>
              <label htmlFor="filter-counsellor" className="label">
                Counsellor
              </label>
              <select
                id="filter-counsellor"
                name="counsellorId"
                defaultValue={String(filters.counsellorId ?? 0)}
                className="field appearance-none"
              >
                <option value="0">All counsellors</option>
                {counsellors.map((counsellor) => (
                  <option key={counsellor.id} value={String(counsellor.id)}>
                    {counsellor.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="filter-status" className="label">
              Status
            </label>
            <select id="filter-status" name="status" defaultValue={filters.status ?? ""} className="field appearance-none">
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-2">
            <button type="submit" className="btn btn-navy btn-sm">
              Apply filters
            </button>
            <Link href={`/admin/reports?report=${report}`} className="btn btn-ghost btn-sm">
              Reset
            </Link>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-body">{selected.hint}</p>
        {!scope.all ? (
          <p className="text-[11px] font-semibold text-royal" role="status">
            Showing only enquiries assigned to you — row visibility is enforced on the server.
          </p>
        ) : null}
      </form>

      <section aria-label="Report metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Records" value={kpis.records} icon={Users} hint={`Rows counted for the ${selected.label.toLowerCase()} report`} />
        <KpiCard
          label={report === "applications" ? "Accepted" : "Converted"}
          value={kpis.converted}
          icon={UserCheck}
          tone="success"
          hint={
            report === "applications"
              ? "Applications with the approved or enrolled status"
              : "Enquiries with the converted status"
          }
        />
        <KpiCard
          label="Conversion rate"
          value={`${kpis.conversionPct}%`}
          icon={Percent}
          hint="Applications ÷ enquiries in the same window and scope"
        />
        <KpiCard
          label="Completed follow-ups"
          value={kpis.completedFollowups}
          icon={CheckCircle2}
          tone="neutral"
          hint="Follow-up tasks due in the window marked completed"
        />
      </section>

      {result.rows.length === 0 ? (
        <EmptyState
          title="No rows for this report"
          description="No records match the selected window and filters. Try a wider date range or clear the filters."
          icon="search"
          action={
            <Link href={`/admin/reports?report=${report}`} className="btn btn-outline btn-sm">
              Reset filters
            </Link>
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <caption className="sr-only">
              {selected.label} — {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </caption>
            <thead>
              <tr>
                {result.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={index}>
                  {result.columns.map((column) => (
                    <td key={column}>
                      <ReportCell column={column} value={row[column]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="no-print">
            <ListPagination page={page} pageCount={pageCount} total={result.rows.length} label="rows" />
          </div>
        </div>
      )}

      <AdminCard
        title="Definitions"
        description="Every figure on this page and in the CSV export uses the same formulas."
        className="no-print"
      >
        <ul className="grid gap-3 text-sm leading-relaxed text-slate-body sm:grid-cols-2">
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Records</span> — rows matching the selected report, window,
            programme, counsellor and status filters, within your row visibility scope.
          </li>
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Converted / accepted</span> — enquiries with the “converted”
            status; on the applications report, applications with the “approved” or “enrolled” status. The status
            filter does not change this figure.
          </li>
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Conversion rate</span> = applications ÷ enquiries × 100 over the
            same window and scope (status filter ignored).
          </li>
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Completed follow-ups</span> = follow-up tasks due inside the
            window whose status is “completed”.
          </li>
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Scope</span> — roles without “view all enquiries” only ever see
            their own records; the restriction is applied in SQL, on screen and in exports.
          </li>
          <li className="rounded-xl border border-line bg-offwhite/50 p-3">
            <span className="font-semibold text-navy">Exports</span> — the CSV contains every matching row (not just
            the current page) and each download is written to the audit log. PDF is available through the print
            dialog.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-body">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-royal" aria-hidden />
            Current report: <span className="font-semibold text-navy">{selected.label}</span>
          </span>
          {canExport ? (
            <Link href={exportHref} className="font-bold text-royal hover:underline">
              Download this report as CSV →
            </Link>
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}
