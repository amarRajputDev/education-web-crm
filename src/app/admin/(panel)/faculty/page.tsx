import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { formatDate, initials, statusTone } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AcademicsTable, SortHeader, type HeaderCell } from "@/components/admin/academics/table";
import { FilterBar, FilterSelect } from "@/components/admin/academics/list-filters";
import { ListPagination } from "@/components/admin/academics/list-pagination";
import { ListSkeleton } from "@/components/admin/academics/list-skeleton";
import { RecordActions } from "@/components/admin/academics/record-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Faculty" };

const PER_PAGE = 12;

type FacultyRow = {
  id: number;
  name: string;
  slug: string;
  designation: string;
  qualifications: string;
  experience_years: number;
  photo: string;
  visibility: string;
  updated_at: string;
  department_name: string | null;
};

type FacultySearchParams = {
  q?: string;
  department?: string;
  visibility?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

export default async function FacultyPage({
  searchParams,
}: {
  searchParams: Promise<FacultySearchParams>;
}) {
  const ctx = await requireAuth(PERMISSIONS.FACULTY_MANAGE);
  void ctx;

  return (
    <Suspense fallback={<ListSkeleton label="faculty" cols={8} />}>
      <FacultySection searchParams={searchParams} />
    </Suspense>
  );
}

async function FacultySection({ searchParams }: { searchParams: Promise<FacultySearchParams> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const departmentValue = Number(params.department ?? 0);
  const department = Number.isInteger(departmentValue) && departmentValue > 0 ? departmentValue : 0;
  const visibility =
    params.visibility === "published" || params.visibility === "draft" ? params.visibility : "";
  const sort = params.sort === "name" ? "name" : "updated";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const requestedPage = Math.max(1, Number(params.page ?? 1) || 1);

  const db = getDb();
  let rows: FacultyRow[] = [];
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
      const parts = ["f.name LIKE ?", "f.email LIKE ?", "f.designation LIKE ?", "f.slug LIKE ?"];
      const values: string[] = [`%${q}%`, `%${q}%`, `%${q}%`, `%${q.toLowerCase()}%`];
      const normalized = q.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (normalized) {
        parts.push("replace(f.slug, '-', '') LIKE ?");
        values.push(`%${normalized}%`);
      }
      clauses.push(`(${parts.join(" OR ")})`);
      args.push(...values);
    }
    if (department) {
      clauses.push("f.department_id = ?");
      args.push(department);
    }
    if (visibility) {
      clauses.push("f.visibility = ?");
      args.push(visibility);
    }
    const whereSql = clauses.join(" AND ");

    total = (
      db.prepare(`SELECT COUNT(*) AS c FROM faculty f WHERE ${whereSql}`).get(...args) as {
        c: number;
      }
    ).c;

    const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(requestedPage, pageCount);
    const orderBy = sort === "name" ? "f.name COLLATE NOCASE" : "f.updated_at";
    const orderDir = dir === "asc" ? "ASC" : "DESC";

    rows = db
      .prepare(
        `SELECT f.id, f.name, f.slug, f.designation, f.qualifications, f.experience_years,
                f.photo, f.visibility, f.updated_at, d.name AS department_name
           FROM faculty f
           LEFT JOIN departments d ON d.id = f.department_id
          WHERE ${whereSql}
          ORDER BY ${orderBy} ${orderDir}, f.id DESC
          LIMIT ? OFFSET ?`,
      )
      .all(...args, PER_PAGE, (page - 1) * PER_PAGE) as FacultyRow[];

    const counts = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(visibility = 'published'), 0) AS published,
                COALESCE(SUM(visibility = 'draft'), 0) AS draft
           FROM faculty`,
      )
      .get() as { total: number; published: number; draft: number };
    allCount = counts.total;
    publishedCount = counts.published;
    draftCount = counts.draft;

    departments = db
      .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
      .all() as { id: number; name: string }[];
  } catch {
    loadError = "Faculty records could not be loaded because of a database error. Please try again.";
  }

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(requestedPage, pageCount);
  const hasFilters = Boolean(q || department || visibility);

  const queryWith = (overrides: Record<string, string | undefined>): string => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (department) next.set("department", String(department));
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
    {
      key: "name",
      label: <SortHeader label="Photo & name" href={sortHref("name")} active={sort === "name"} dir={dir} />,
      ariaSort: sort === "name" ? (dir === "asc" ? "ascending" : "descending") : "none",
    },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "qualifications", label: "Qualifications" },
    { key: "experience", label: "Experience" },
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
        title="Faculty"
        description="The public faculty directory. Photos, designations and research interests are shown on the website."
        meta={[
          { label: "Total", value: allCount },
          { label: "Visible", value: publishedCount },
          { label: "Hidden", value: draftCount },
        ]}
        actions={
          <Link href="/admin/faculty/new" className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden />
            New faculty member
          </Link>
        }
      />

      <FilterBar
        action="/admin/faculty"
        resetHref="/admin/faculty"
        keyword={q}
        keywordLabel="Search faculty"
        keywordPlaceholder="Search by name, email or designation…"
        sort={sort}
        dir={dir}
      >
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
          <Link href="/admin/faculty" className="btn btn-outline btn-sm">
            Try again
          </Link>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="search"
          title={hasFilters ? "No faculty match these filters" : "No faculty members yet"}
          description={
            hasFilters
              ? "Try a different keyword, or clear the filters to see the full directory."
              : "Add the first faculty member to populate the public directory."
          }
          action={
            hasFilters ? (
              <Link href="/admin/faculty" className="btn btn-outline btn-sm">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/faculty/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                New faculty member
              </Link>
            )
          }
        />
      ) : (
        <AcademicsTable
          label="Faculty"
          headers={headers}
          footer={<ListPagination page={page} pageCount={pageCount} total={total} label="members" />}
        >
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className="flex items-center gap-3">
                  {row.photo ? (
                    <img
                      src={row.photo}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-royal-100 text-xs font-bold text-royal">
                      {initials(row.name)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{row.name}</span>
                    <span className="block text-[11px] text-slate-body">/faculty/{row.slug}</span>
                  </span>
                </span>
              </td>
              <td className="whitespace-nowrap">{row.designation}</td>
              <td className="whitespace-nowrap">{row.department_name ?? "—"}</td>
              <td>
                <span className="block max-w-[220px] truncate" title={row.qualifications}>
                  {row.qualifications || "—"}
                </span>
              </td>
              <td className="whitespace-nowrap tabular-nums">{row.experience_years} yrs</td>
              <td>
                <Badge tone={statusTone(row.visibility)} dot>
                  {row.visibility}
                </Badge>
              </td>
              <td className="whitespace-nowrap text-slate-body">{formatDate(row.updated_at)}</td>
              <td>
                <RecordActions
                  entity="faculty"
                  id={row.id}
                  name={row.name}
                  status={row.visibility}
                  viewHref={`/faculty/${row.slug}`}
                  editHref={`/admin/faculty/${row.id}/edit`}
                />
              </td>
            </tr>
          ))}
        </AcademicsTable>
      )}
    </div>
  );
}
