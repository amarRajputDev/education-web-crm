import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ScrollText } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, statusTone } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FilterBar } from "@/components/admin/academics/list-filters";
import { ListPagination } from "@/components/admin/academics/list-pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ErrorSummary } from "@/components/ui/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit logs",
  robots: { index: false, follow: false },
};

const PER_PAGE = 15;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type AuditRow = {
  id: number;
  action: string;
  entity: string;
  entity_id: string;
  detail: string;
  ip: string;
  created_at: string;
  user_name: string | null;
};

/** Badge tone for an audit action, derived from its verb, then mapped through `statusTone`. */
const ACTION_TONE_KEYS: { pattern: RegExp; key: string }[] = [
  { pattern: /[._](delete|remove|failed|blocked|revoke|reject|archive)/, key: "rejected" },
  { pattern: /[._](create|login|approve|publish|verify|complete|success)/, key: "active" },
  { pattern: /[._](export|save|submit|reorder)/, key: "submitted" },
  { pattern: /[._](update|status|reset|change|edit)/, key: "pending" },
];

function actionToneKey(action: string): string {
  const value = `.${action.toLowerCase()}`;
  for (const item of ACTION_TONE_KEYS) {
    if (item.pattern.test(value)) return item.key;
  }
  return "neutral";
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth(PERMISSIONS.AUDIT_VIEW);
  const params = await searchParams;

  const q = first(params.q);
  const from = first(params.from);
  const to = first(params.to);

  const errors: Record<string, string> = {};
  if (from && !DATE_PATTERN.test(from)) errors.from = "Use a date in yyyy-mm-dd format.";
  if (to && !DATE_PATTERN.test(to)) errors.to = "Use a date in yyyy-mm-dd format.";
  if (!errors.from && !errors.to && from && to && from > to) {
    errors.to = "The end date must be on or after the start date.";
  }

  const conditions: string[] = [];
  const args: (string | number)[] = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push("(a.action LIKE ? OR a.entity LIKE ? OR a.detail LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    args.push(like, like, like, like, like);
  }
  if (from && !errors.from) {
    conditions.push("date(a.created_at) >= date(?)");
    args.push(from);
  }
  if (to && !errors.to) {
    conditions.push("date(a.created_at) <= date(?)");
    args.push(to);
  }
  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const joins = "FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id";

  const db = getDb();
  const totalRow = db.prepare(`SELECT COUNT(*) AS c ${joins} ${whereSql}`).get(...args) as { c: number } | undefined;
  const total = totalRow?.c ?? 0;
  const allTimeRow = db.prepare(`SELECT COUNT(*) AS c FROM audit_logs`).get() as { c: number } | undefined;

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const requestedPage = Number(first(params.page)) || 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);

  const rows = db
    .prepare(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.detail, a.ip, a.created_at, u.name AS user_name
         ${joins}
         ${whereSql}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT ? OFFSET ?`,
    )
    .all(...args, PER_PAGE, (page - 1) * PER_PAGE) as AuditRow[];

  const hasFilters = Boolean(q || from || to);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit logs"
        description="Every sensitive change in the system, newest first: who did what, to which record, and from where."
        meta={[{ label: "Entries", value: allTimeRow?.c ?? 0 }]}
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-body">
            <ScrollText className="h-3.5 w-3.5 text-royal" aria-hidden />
            Read only
          </span>
        }
      />

      <div className="rounded-2xl border border-line bg-offwhite/60 p-4" role="note">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-body">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
          <span>
            <span className="font-semibold text-navy">Audit entries are append-only</span> — records cannot be edited
            or deleted from the interface. Use the filters to narrow the trail by actor, action, entity or date.
          </span>
        </p>
      </div>

      <ErrorSummary errors={errors} title="Some filters were ignored" />

      <FilterBar
        action="/admin/audit-logs"
        resetHref="/admin/audit-logs"
        keyword={q}
        keywordLabel="Search audit entries"
        keywordPlaceholder="Search action, user, entity or detail…"
      >
        <div className="min-w-[150px]">
          <label htmlFor="audit-from" className="label">
            From date
          </label>
          <input id="audit-from" type="date" name="from" defaultValue={from} className="field" />
        </div>
        <div className="min-w-[150px]">
          <label htmlFor="audit-to" className="label">
            To date
          </label>
          <input id="audit-to" type="date" name="to" defaultValue={to} className="field" />
        </div>
      </FilterBar>

      <p className="text-xs text-slate-body" role="status">
        {total === 0
          ? "No audit entries match the current filters."
          : `${total} audit entr${total === 1 ? "y" : "ies"} match${total === 1 ? "es" : ""} the current filters.`}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No audit entries found"
          description="Nothing matches the current search and date range. Clear the filters to see the full trail."
          icon="search"
          action={
            hasFilters ? (
              <Link href="/admin/audit-logs" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <caption className="sr-only">Audit log — {total} entr{total === 1 ? "y" : "ies"}</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">User</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
                <th scope="col">Entity ID</th>
                <th scope="col">Detail</th>
                <th scope="col">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-slate-body">{formatDateTime(row.created_at)}</td>
                  <td className="font-semibold text-navy">{row.user_name ?? <span className="text-slate-body">System</span>}</td>
                  <td>
                    <Badge tone={statusTone(actionToneKey(row.action))}>{row.action}</Badge>
                  </td>
                  <td className="text-slate-body">{row.entity || "—"}</td>
                  <td className="tabular-nums text-slate-body">{row.entity_id || "—"}</td>
                  <td className="max-w-[24rem] text-slate-body">{row.detail || "—"}</td>
                  <td className="tabular-nums text-slate-body">{row.ip || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="no-print">
            <ListPagination page={page} pageCount={pageCount} total={total} label="entries" />
          </div>
        </div>
      )}
    </div>
  );
}
