import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { formatDate, statusTone } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AcademicsTable, SortHeader, type HeaderCell } from "@/components/admin/academics/table";
import { FilterBar, FilterSelect } from "@/components/admin/academics/list-filters";
import { ListPagination } from "@/components/admin/academics/list-pagination";
import { ListSkeleton } from "@/components/admin/academics/list-skeleton";
import { RecordActions } from "@/components/admin/academics/record-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Departments" };

const PER_PAGE = 12;

type DepartmentRow = {
  id: number;
  name: string;
  slug: string;
  code: string;
  visibility: string;
  updated_at: string;
  course_count: number;
  faculty_count: number;
};

type DepartmentSearchParams = {
  q?: string;
  visibility?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<DepartmentSearchParams>;
}) {
  const ctx = await requireAuth(PERMISSIONS.DEPARTMENT_MANAGE);
  void ctx;

  return (
    <Suspense fallback={<ListSkeleton label="departments" cols={7} />}>
      <DepartmentsSection searchParams={searchParams} />
    </Suspense>
  );
}

async function DepartmentsSection({
  searchParams,
}: {
  searchParams: Promise<DepartmentSearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const visibility =
    params.visibility === "published" || params.visibility === "draft" ? params.visibility : "";
  const sort = params.sort === "name" ? "name" : "updated";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1);

  const db = getDb();
  let rows: DepartmentRow[] = [];
  let total = 0;
  let allCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let loadError = "";

  try {
    const clauses = ["1 = 1"];
    const args: (string | number)[] = [];
    if (q) {
      const parts = ["d.name LIKE ?", "d.code LIKE ?", "d.slug LIKE ?"];
      const values: string[] = [`%${q}%`, `%${q}%`, `%${q.toLowerCase()}%`];
      const normalized = q.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (normalized) {
        parts.push("replace(d.slug, '-', '') LIKE ?");
        values.push(`%${normalized}%`);
      }
      clauses.push(`(${parts.join(" OR ")})`);
      args.push(...values);
    }
    if (visibility) {
      clauses.push("d.visibility = ?");
      args.push(visibility);
    }
    const whereSql = clauses.join(" AND ");

    total = (
      db.prepare(`SELECT COUNT(*) AS c FROM departments d WHERE ${whereSql}`).get(...args) as {
        c: number;
      }
    ).c;

    const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(requestedPage, pageCount);
    const orderBy = sort === "name" ? "d.name COLLATE NOCASE" : "d.updated_at";
    const orderDir = dir === "asc" ? "ASC" : "DESC";

    rows = db
      .prepare(
        `SELECT d.id, d.name, d.slug, d.code, d.visibility, d.updated_at,
                (SELECT COUNT(*) FROM courses c WHERE c.department_id = d.id) AS course_count,
                (SELECT COUNT(*) FROM faculty f WHERE f.department_id = d.id) AS faculty_count
           FROM departments d
          WHERE ${whereSql}
          ORDER BY ${orderBy} ${orderDir}, d.id DESC
          LIMIT ? OFFSET ?`,
      )
      .all(...args, PER_PAGE, (page - 1) * PER_PAGE) as DepartmentRow[];

    const counts = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(visibility = 'published'), 0) AS published,
                COALESCE(SUM(visibility = 'draft'), 0) AS draft
           FROM departments`,
      )
      .get() as { total: number; published: number; draft: number };
    allCount = counts.total;
    publishedCount = counts.published;
    draftCount = counts.draft;
  } catch {
    loadError = "Departments could not be loaded because of a database error. Please try again.";
  }

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(requestedPage, pageCount);
  const hasFilters = Boolean(q || visibility);

  const queryWith = (overrides: Record<string, string | undefined>): string => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (visibility) next.set("visibility", visibility);
    next.set("sort", sort);
    next.set("dir", dir);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    const queryString = next.toString();
    return queryString ? `?${queryString}` : "?";
  };

  const sortHref = (field: string): string =>
    queryWith({
      sort: field,
      dir: sort === field && dir === "asc" ? "desc" : "asc",
      page: undefined,
    });

  const headers: HeaderCell[] = [
    { key: "code", label: "Code" },
    {
      key: "name",
      label: <SortHeader label="Name" href={sortHref("name")} active={sort === "name"} dir={dir} />,
      ariaSort: sort === "name" ? (dir === "asc" ? "ascending" : "descending") : "none",
    },
    { key: "courses", label: "Courses" },
    { key: "faculty", label: "Faculty" },
    { key: "visibility", label: "Visibility" },
    {
      key: "updated",
      label: (
        <SortHeader label="Updated" href={sortHref("updated")} active={sort === "updated"} dir={dir} />
      ),
      ariaSort: sort === "updated" ? (dir === "asc" ? "ascending" : "descending") : "none",
    },
    { key: "actions", label: <span className="block text-right">Actions</span>, align: "right" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Departments"
        description="Academic schools and departments that group programmes and faculty on the public website."
        meta={[
          { label: "Total", value: allCount },
          { label: "Published", value: publishedCount },
          { label: "Draft", value: draftCount },
        ]}
        actions={
          <Link href="/admin/departments/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden />
            New department
          </Link>
        }
      />

      <FilterBar
        action="/admin/departments"
        resetHref="/admin/departments"
        keyword={q}
        keywordLabel="Search departments"
        keywordPlaceholder="Search by name or code…"
        sort={sort}
        dir={dir}
      >
        <FilterSelect
          id="filter-visibility"
          name="visibility"
          label="Visibility"
          value={visibility}
          options={[
            { value: "", label: "Any visibility" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
      </FilterBar>

      {loadError ? (
        <div className="card flex flex-col items-start gap-3 border-[#f6cfcf] bg-danger-100 p-6" role="alert">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {loadError}
          </p>
          <Link href="/admin/departments" className="btn btn-outline btn-sm">
            Try again
          </Link>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="search"
          title={hasFilters ? "No departments match these filters" : "No departments yet"}
          description={
            hasFilters
              ? "Try a different keyword, or clear the filters to see every department."
              : "Departments group programmes and faculty — create the first one to get started."
          }
          action={
            hasFilters ? (
              <Link href="/admin/departments" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/departments/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                New department
              </Link>
            )
          }
        />
      ) : (
        <AcademicsTable
          label="Departments"
          headers={headers}
          footer={<ListPagination page={page} pageCount={pageCount} total={total} label="departments" />}
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap font-mono text-xs text-slate-body">{row.code || "—"}</td>
              <td>
                <span className="block font-semibold text-navy">{row.name}</span>
                <span className="block text-[11px] text-slate-body">/academics · {row.slug}</span>
              </td>
              <td className="tabular-nums">{row.course_count}</td>
              <td className="tabular-nums">{row.faculty_count}</td>
              <td>
                <Badge tone={statusTone(row.visibility)} dot>
                  {row.visibility}
                </Badge>
              </td>
              <td className="whitespace-nowrap text-slate-body">{formatDate(row.updated_at)}</td>
              <td>
                <RecordActions
                  entity="department"
                  id={row.id}
                  name={row.name}
                  status={row.visibility}
                  viewHref="/academics"
                  editHref={`/admin/departments/${row.id}/edit`}
                />
              </td>
            </tr>
          ))}
        </AcademicsTable>
      )}
    </div>
  );
}
