import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ListPagination } from "@/components/admin/content/list-pagination";
import { NewsRowActions } from "@/components/admin/content/row-actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getDb } from "@/lib/db";
import { formatDate, statusTone, type Tone } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & Notices · Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;
const CATEGORIES = ["News", "Notice", "Achievement", "Announcement"] as const;
const STATUSES = ["published", "draft"] as const;

const CATEGORY_TONES: Record<string, Tone> = {
  News: "info",
  Notice: "neutral",
  Achievement: "gold",
  Announcement: "warning",
};

type NewsRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  author: string;
  status: string;
  published_at: string | null;
  created_at: string;
};

export default async function AdminNewsPage({
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

  const where = `WHERE (@q = '' OR LOWER(title) LIKE @like OR LOWER(excerpt) LIKE @like)
       AND (@category = '' OR category = @category)
       AND (@status = '' OR status = @status)`;
  const bind = { q, like: `%${q.toLowerCase()}%`, category, status };

  const db = getDb();
  const counts = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft
         FROM news_posts ${where}`,
    )
    .get(bind) as { total: number; published: number | null; draft: number | null };

  const pageCount = Math.max(1, Math.ceil(counts.total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);

  const rows = db
    .prepare(
      `SELECT id, title, slug, category, author, status, published_at, created_at
         FROM news_posts ${where}
        ORDER BY COALESCE(published_at, created_at) DESC, id DESC
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...bind, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }) as NewsRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="News & notices"
        description="Publish notices, news stories, achievements and announcements on the public website."
        meta={[
          { label: "Total", value: counts.total },
          { label: "Published", value: counts.published ?? 0 },
          { label: "Drafts", value: counts.draft ?? 0 },
        ]}
        actions={
          <Link href="/admin/news/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden />
            New notice
          </Link>
        }
      />

      <form method="get" className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="news-search" className="label">
            Search
          </label>
          <input
            id="news-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Title or excerpt…"
            className="field"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="news-category" className="label">
            Category
          </label>
          <select id="news-category" name="category" defaultValue={category} className="field appearance-none">
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-40">
          <label htmlFor="news-status" className="label">
            Status
          </label>
          <select id="news-status" name="status" defaultValue={status} className="field appearance-none">
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
            <Link href="/admin/news" className="btn btn-ghost btn-sm">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={filtersActive ? "No matching notices" : "No notices yet"}
          description={
            filtersActive
              ? "Try different search terms or clear the filters."
              : "Publish your first notice to start the news feed on the public website."
          }
          icon={filtersActive ? "search" : "empty"}
          action={
            filtersActive ? (
              <Link href="/admin/news" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/news/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                New notice
              </Link>
            )
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <caption className="sr-only">News and notices with publication status</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Author</th>
                <th scope="col">Status</th>
                <th scope="col">Published</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="max-w-md truncate font-semibold text-navy">{row.title}</p>
                    <p className="mt-0.5 max-w-md truncate text-xs text-slate-body">/news/{row.slug}</p>
                  </td>
                  <td>
                    <Badge tone={CATEGORY_TONES[row.category] ?? "neutral"}>{row.category}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-slate-body">{row.author || "—"}</td>
                  <td>
                    <Badge tone={statusTone(row.status)} dot>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap text-slate-body">
                    {row.status === "published" ? formatDate(row.published_at) : <span className="text-slate-body">—</span>}
                  </td>
                  <td>
                    <NewsRowActions item={{ id: row.id, title: row.title, slug: row.slug, status: row.status }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ListPagination page={page} pageCount={pageCount} total={counts.total} label="notices" />
        </div>
      )}
    </div>
  );
}
