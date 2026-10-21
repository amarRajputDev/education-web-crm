import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { formatCurrency, formatDate, statusTone } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AcademicsTable, SortHeader, type HeaderCell } from "@/components/admin/academics/table";
import { FilterBar, FilterSelect } from "@/components/admin/academics/list-filters";
import { ListPagination } from "@/components/admin/academics/list-pagination";
import { ListSkeleton } from "@/components/admin/academics/list-skeleton";
import { RecordActions } from "@/components/admin/academics/record-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Courses" };

const PER_PAGE = 12;
const LEVELS = ["Undergraduate", "Postgraduate", "Diploma", "Certificate", "Doctorate"];

type CourseRow = {
  id: number;
  name: string;
  slug: string;
  code: string;
  degree_level: string;
  duration_label: string;
  fee_amount: number;
  status: string;
  updated_at: string;
  department_name: string | null;
};

type CoursesSearchParams = {
  q?: string;
  level?: string;
  status?: string;
  department?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CoursesSearchParams>;
}) {
  const ctx = await requireAuth(PERMISSIONS.COURSE_MANAGE);
  void ctx;

  return (
    <Suspense fallback={<ListSkeleton label="courses" cols={9} />}>
      <CoursesSection searchParams={searchParams} />
    </Suspense>
  );
}

async function CoursesSection({ searchParams }: { searchParams: Promise<CoursesSearchParams> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const level = LEVELS.includes(params.level ?? "") ? (params.level as string) : "";
  const status = params.status === "published" || params.status === "draft" ? params.status : "";
  const departmentValue = Number(params.department ?? 0);
  const department = Number.isInteger(departmentValue) && departmentValue > 0 ? departmentValue : 0;
  const sort = params.sort === "name" ? "name" : "updated";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1);

  const db = getDb();
  let rows: CourseRow[] = [];
  let total = 0;
  let allCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let departments: { id: number; name: string }[] = [];
  let loadError = "";

  try {
    const clauses = ["1 = 1"];
    const args: (string | number)[] = [];
    if (q) {
      const parts = ["c.name LIKE ?", "c.code LIKE ?", "c.slug LIKE ?"];
      const values: string[] = [`%${q}%`, `%${q}%`, `%${q.toLowerCase()}%`];
      const normalized = q.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (normalized) {
        parts.push("replace(c.slug, '-', '') LIKE ?");
        values.push(`%${normalized}%`);
      }
      clauses.push(`(${parts.join(" OR ")})`);
      args.push(...values);
    }
    if (level) {
      clauses.push("c.degree_level = ?");
      args.push(level);
    }
    if (status) {
      clauses.push("c.status = ?");
      args.push(status);
    }
    if (department) {
      clauses.push("c.department_id = ?");
      args.push(department);
    }
    const whereSql = clauses.join(" AND ");

    total = (
      db.prepare(`SELECT COUNT(*) AS c FROM courses c WHERE ${whereSql}`).get(...args) as {
        c: number;
      }
    ).c;

    const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(requestedPage, pageCount);
    const orderBy = sort === "name" ? "c.name COLLATE NOCASE" : "c.updated_at";
    const orderDir = dir === "asc" ? "ASC" : "DESC";

    rows = db
      .prepare(
        `SELECT c.id, c.name, c.slug, c.code, c.degree_level, c.duration_label,
                c.fee_amount, c.status, c.updated_at, d.name AS department_name
           FROM courses c
           LEFT JOIN departments d ON d.id = c.department_id
          WHERE ${whereSql}
          ORDER BY ${orderBy} ${orderDir}, c.id DESC
          LIMIT ? OFFSET ?`,
      )
      .all(...args, PER_PAGE, (page - 1) * PER_PAGE) as CourseRow[];

    const counts = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(status = 'published'), 0) AS published,
                COALESCE(SUM(status = 'draft'), 0) AS draft
           FROM courses`,
      )
      .get() as { total: number; published: number; draft: number };
    allCount = counts.total;
    publishedCount = counts.published;
    draftCount = counts.draft;

    departments = db
      .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
      .all() as { id: number; name: string }[];
  } catch {
    loadError = "Courses could not be loaded because of a database error. Please try again.";
  }

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(requestedPage, pageCount);
  const hasFilters = Boolean(q || level || status || department);

  const queryWith = (overrides: Record<string, string | undefined>): string => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (level) next.set("level", level);
    if (status) next.set("status", status);
    if (department) next.set("department", String(department));
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
    { key: "department", label: "Department" },
    { key: "level", label: "Level" },
    { key: "duration", label: "Duration" },
    { key: "fee", label: "Fee" },
    { key: "status", label: "Status" },
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
        title="Courses"
        description="Programmes shown on the public website. Manage content, curriculum, fees and publication status from one place."
        meta={[
          { label: "Total", value: allCount },
          { label: "Published", value: publishedCount },
          { label: "Draft", value: draftCount },
        ]}
        actions={
          <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden />
            New course
          </Link>
        }
      />

      <FilterBar
        action="/admin/courses"
        resetHref="/admin/courses"
        keyword={q}
        keywordLabel="Search courses"
        keywordPlaceholder="Search by name or code…"
        sort={sort}
        dir={dir}
      >
        <FilterSelect
          id="filter-level"
          name="level"
          label="Level"
          value={level}
          options={[{ value: "", label: "All levels" }, ...LEVELS.map((item) => ({ value: item, label: item }))]}
        />
        <FilterSelect
          id="filter-status"
          name="status"
          label="Status"
          value={status}
          options={[
            { value: "", label: "Any status" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
        <FilterSelect
          id="filter-department"
          name="department"
          label="Department"
          value={department ? String(department) : ""}
          options={[
            { value: "", label: "All departments" },
            ...departments.map((item) => ({ value: String(item.id), label: item.name })),
          ]}
        />
      </FilterBar>

      {loadError ? (
        <div className="card flex flex-col items-start gap-3 border-[#f6cfcf] bg-danger-100 p-6" role="alert">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {loadError}
          </p>
          <Link href="/admin/courses" className="btn btn-outline btn-sm">
            Try again
          </Link>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="search"
          title={hasFilters ? "No courses match these filters" : "No courses yet"}
          description={
            hasFilters
              ? "Try a different keyword, or clear the filters to see every programme."
              : "Create your first programme to start building the public course catalogue."
          }
          action={
            hasFilters ? (
              <Link href="/admin/courses" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                New course
              </Link>
            )
          }
        />
      ) : (
        <AcademicsTable
          label="Courses"
          headers={headers}
          footer={<ListPagination page={page} pageCount={pageCount} total={total} label="courses" />}
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap font-mono text-xs text-slate-body">{row.code || "—"}</td>
              <td>
                <span className="block font-semibold text-navy">{row.name}</span>
                <span className="block text-[11px] text-slate-body">/courses/{row.slug}</span>
              </td>
              <td className="whitespace-nowrap">{row.department_name ?? "—"}</td>
              <td>
                <Badge tone="gold">{row.degree_level}</Badge>
              </td>
              <td className="whitespace-nowrap">{row.duration_label}</td>
              <td className="whitespace-nowrap tabular-nums">{formatCurrency(row.fee_amount)}</td>
              <td>
                <Badge tone={statusTone(row.status)} dot>
                  {row.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap text-slate-body">{formatDate(row.updated_at)}</td>
              <td>
                <RecordActions
                  entity="course"
                  id={row.id}
                  name={row.name}
                  status={row.status}
                  viewHref={`/courses/${row.slug}`}
                  editHref={`/admin/courses/${row.id}/edit`}
                />
              </td>
            </tr>
          ))}
        </AcademicsTable>
      )}
    </div>
  );
}
