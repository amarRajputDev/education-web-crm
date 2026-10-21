import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus, Search } from "lucide-react";
import { EventRowActions } from "@/components/admin/content/row-actions";
import { ListPagination } from "@/components/admin/content/list-pagination";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getDb } from "@/lib/db";
import { formatDateTime, statusTone, type Tone } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events · Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;
const CATEGORIES = ["Academic", "Workshop", "Seminar", "Cultural", "Sports", "Admission", "Other"] as const;
const STATUSES = ["published", "draft"] as const;

const CATEGORY_TONES: Record<string, Tone> = {
  Academic: "info",
  Workshop: "gold",
  Seminar: "neutral",
  Cultural: "warning",
  Sports: "success",
  Admission: "danger",
  Other: "neutral",
};

type EventRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  is_upcoming: number;
};

function parseSqlDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);
  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const rawCategory = params.category ?? "";
  const category = (CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : "";
  const rawStatus = params.status ?? "";
  const status = (STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : "";
  const filtersActive = Boolean(q || category || status);

  const where = `WHERE (@q = '' OR LOWER(title) LIKE @like OR LOWER(location) LIKE @like)
       AND (@category = '' OR category = @category)
       AND (@status = '' OR status = @status)`;
  const bind = { q, like: `%${q.toLowerCase()}%`, category, status };

  const db = getDb();
  const counts = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft
         FROM events ${where}`,
    )
    .get(bind) as { total: number; published: number | null; draft: number | null };

  const upcomingCount = (
    db.prepare(`SELECT COUNT(*) AS c FROM events WHERE starts_at >= datetime('now')`).get() as { c: number }
  ).c;

  const pageCount = Math.max(1, Math.ceil(counts.total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);

  const rows = db
    .prepare(
      `SELECT id, title, slug, category, location, starts_at, ends_at, status,
              CASE WHEN starts_at >= datetime('now') THEN 1 ELSE 0 END AS is_upcoming
         FROM events ${where}
        ORDER BY starts_at DESC, id DESC
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...bind, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }) as EventRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events"
        description="Manage seminars, workshops, cultural programmes and other events shown on the public website."
        meta={[
          { label: "Total", value: counts.total },
          { label: "Upcoming", value: upcomingCount },
          { label: "Published", value: counts.published ?? 0 },
          { label: "Drafts", value: counts.draft ?? 0 },
        ]}
        actions={
          <Link href="/admin/events/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden />
            New event
          </Link>
        }
      />

      <form method="get" className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="events-search" className="label">
            Search
          </label>
          <input
            id="events-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Title or location…"
            className="field"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="events-category" className="label">
            Category
          </label>
          <select id="events-category" name="category" defaultValue={category} className="field appearance-none">
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-40">
          <label htmlFor="events-status" className="label">
            Status
          </label>
          <select id="events-status" name="status" defaultValue={status} className="field appearance-none">
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item === "published" ? "Published" : "Draft"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-navy btn-sm">
            <Search className="h-4 w-4" aria-hidden />
            Apply
          </button>
          {filtersActive ? (
            <Link href="/admin/events" className="btn btn-ghost btn-sm">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={filtersActive ? "No matching events" : "No events yet"}
          description={
            filtersActive
              ? "Try different search terms or clear the filters."
              : "Create your first event to populate the public events calendar."
          }
          icon={filtersActive ? "search" : "calendar"}
          action={
            filtersActive ? (
              <Link href="/admin/events" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/events/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                New event
              </Link>
            )
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <caption className="sr-only">Events with dates, locations and publication status</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Category</th>
                <th scope="col">Location</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const start = parseSqlDate(row.starts_at);
                const isUpcoming = row.is_upcoming === 1;
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-offwhite"
                          aria-hidden
                        >
                          <span className="font-display text-lg font-semibold leading-none text-navy">
                            {start ? String(start.getDate()).padStart(2, "0") : "--"}
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-body">
                            {start ? start.toLocaleDateString("en-IN", { month: "short" }) : ""}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-semibold text-navy">{row.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-body">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" aria-hidden />
                              {formatDateTime(row.starts_at)}
                            </span>
                            <Badge tone={isUpcoming ? "info" : "neutral"}>{isUpcoming ? "Upcoming" : "Past"}</Badge>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={CATEGORY_TONES[row.category] ?? "neutral"}>{row.category}</Badge>
                    </td>
                    <td className="max-w-40 truncate text-slate-body">{row.location || "—"}</td>
                    <td>
                      <Badge tone={statusTone(row.status)} dot>
                        {row.status}
                      </Badge>
                    </td>
                    <td>
                      <EventRowActions item={{ id: row.id, title: row.title, slug: row.slug, status: row.status }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <ListPagination page={page} pageCount={pageCount} total={counts.total} label="events" />
        </div>
      )}
    </div>
  );
}
