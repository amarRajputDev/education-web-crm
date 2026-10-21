import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search, SearchX } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PERMISSIONS, can } from "@/lib/rbac";
import { statusTone, relativeTime } from "@/lib/format";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { FieldShell, TextInput } from "@/components/ui/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search · Admin",
  robots: { index: false, follow: false },
};

type ResultItem = {
  id: number;
  href: string;
  title: string;
  subtitle: string;
  meta: string;
  badge?: { label: string; tone: string };
};

type ResultSection = {
  key: string;
  label: string;
  total: number;
  items: ResultItem[];
};

const LIKE_ESCAPE = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAuth();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const roleKey = ctx.user.role_key;
  const db = getDb();
  const sections: ResultSection[] = [];

  if (q) {
    const term = `%${LIKE_ESCAPE(q)}%`;

    // Enquiries — counsellors without enquiries.view_all only see their own.
    if (can(roleKey, PERMISSIONS.ENQUIRY_VIEW)) {
      const viewAll = can(roleKey, PERMISSIONS.ENQUIRY_VIEW_ALL);
      const rows = db
        .prepare(
          `SELECT id, ref, name, phone, email, status, created_at
             FROM enquiries
            WHERE (ref LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\'
                   OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')
              ${viewAll ? "" : "AND counsellor_id = ?"}
            ORDER BY created_at DESC
            LIMIT 20`,
        )
        .all(...[term, term, term, term, ...(viewAll ? [] : [ctx.user.id])]) as {
        id: number;
        ref: string;
        name: string;
        phone: string;
        email: string;
        status: string;
        created_at: string;
      }[];
      const total = db
        .prepare(
          `SELECT COUNT(*) AS c FROM enquiries
            WHERE (ref LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\'
                   OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')
              ${viewAll ? "" : "AND counsellor_id = ?"}`,
        )
        .get(...[term, term, term, term, ...(viewAll ? [] : [ctx.user.id])]) as { c: number };

      sections.push({
        key: "enquiries",
        label: "Enquiries",
        total: total.c,
        items: rows.map((row) => ({
          id: row.id,
          href: `/admin/enquiries/${row.id}`,
          title: `${row.name} · ${row.ref}`,
          subtitle: [row.phone, row.email].filter(Boolean).join(" · ") || "No contact details",
          meta: relativeTime(row.created_at),
          badge: { label: row.status.replace(/_/g, " "), tone: statusTone(row.status) },
        })),
      });
    }

    if (can(roleKey, PERMISSIONS.APPLICATION_VIEW)) {
      const rows = db
        .prepare(
          `SELECT id, ref, full_name, course_name, status, submitted_at
             FROM admission_applications
            WHERE ref LIKE ? ESCAPE '\\' OR full_name LIKE ? ESCAPE '\\'
            ORDER BY submitted_at DESC
            LIMIT 20`,
        )
        .all(term, term) as {
        id: number;
        ref: string;
        full_name: string;
        course_name: string;
        status: string;
        submitted_at: string;
      }[];
      const total = db
        .prepare(
          `SELECT COUNT(*) AS c FROM admission_applications
            WHERE ref LIKE ? ESCAPE '\\' OR full_name LIKE ? ESCAPE '\\'`,
        )
        .get(term, term) as { c: number };

      sections.push({
        key: "applications",
        label: "Applications",
        total: total.c,
        items: rows.map((row) => ({
          id: row.id,
          href: `/admin/admissions/${row.id}`,
          title: `${row.full_name} · ${row.ref}`,
          subtitle: row.course_name || "No programme recorded",
          meta: relativeTime(row.submitted_at),
          badge: { label: row.status.replace(/_/g, " "), tone: statusTone(row.status) },
        })),
      });
    }

    if (can(roleKey, PERMISSIONS.COURSE_MANAGE)) {
      const rows = db
        .prepare(
          `SELECT id, name, code, status FROM courses
            WHERE name LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\'
            ORDER BY name COLLATE NOCASE
            LIMIT 20`,
        )
        .all(term, term) as {
        id: number;
        name: string;
        code: string;
        status: string;
      }[];
      const total = db
        .prepare(`SELECT COUNT(*) AS c FROM courses WHERE name LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\'`)
        .get(term, term) as { c: number };

      sections.push({
        key: "courses",
        label: "Programmes",
        total: total.c,
        items: rows.map((row) => ({
          id: row.id,
          href: `/admin/courses/${row.id}`,
          title: row.name,
          subtitle: row.code || "No course code",
          meta: "",
          badge: { label: row.status, tone: statusTone(row.status) },
        })),
      });
    }

    if (can(roleKey, PERMISSIONS.FACULTY_MANAGE)) {
      const rows = db
        .prepare(
          `SELECT id, name, designation FROM faculty
            WHERE name LIKE ? ESCAPE '\\' OR designation LIKE ? ESCAPE '\\'
            ORDER BY name COLLATE NOCASE
            LIMIT 20`,
        )
        .all(term, term) as { id: number; name: string; designation: string }[];
      const total = db
        .prepare(
          `SELECT COUNT(*) AS c FROM faculty WHERE name LIKE ? ESCAPE '\\' OR designation LIKE ? ESCAPE '\\'`,
        )
        .get(term, term) as { c: number };

      sections.push({
        key: "faculty",
        label: "Faculty",
        total: total.c,
        items: rows.map((row) => ({
          id: row.id,
          href: `/admin/faculty/${row.id}`,
          title: row.name,
          subtitle: row.designation || "No designation",
          meta: "",
        })),
      });
    }

    if (can(roleKey, PERMISSIONS.CONTENT_MANAGE)) {
      const newsRows = db
        .prepare(
          `SELECT id, title, category, status, updated_at FROM news_posts
            WHERE title LIKE ? ESCAPE '\\'
            ORDER BY updated_at DESC
            LIMIT 20`,
        )
        .all(term) as {
        id: number;
        title: string;
        category: string;
        status: string;
        updated_at: string;
      }[];
      const newsTotal = db
        .prepare(`SELECT COUNT(*) AS c FROM news_posts WHERE title LIKE ? ESCAPE '\\'`)
        .get(term) as { c: number };

      sections.push({
        key: "news",
        label: "News & notices",
        total: newsTotal.c,
        items: newsRows.map((row) => ({
          id: row.id,
          href: `/admin/news/${row.id}`,
          title: row.title,
          subtitle: row.category,
          meta: relativeTime(row.updated_at),
          badge: { label: row.status, tone: statusTone(row.status) },
        })),
      });

      const eventRows = db
        .prepare(
          `SELECT id, title, starts_at, status FROM events
            WHERE title LIKE ? ESCAPE '\\'
            ORDER BY starts_at DESC
            LIMIT 20`,
        )
        .all(term) as {
        id: number;
        title: string;
        starts_at: string;
        status: string;
      }[];
      const eventTotal = db
        .prepare(`SELECT COUNT(*) AS c FROM events WHERE title LIKE ? ESCAPE '\\'`)
        .get(term) as { c: number };

      sections.push({
        key: "events",
        label: "Events",
        total: eventTotal.c,
        items: eventRows.map((row) => ({
          id: row.id,
          href: `/admin/events/${row.id}`,
          title: row.title,
          subtitle: "",
          meta: relativeTime(row.starts_at),
          badge: { label: row.status, tone: statusTone(row.status) },
        })),
      });
    }
  }

  const visibleSections = sections.filter((section) => section.total > 0);
  const resultCount = visibleSections.reduce((total, section) => total + section.total, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Search"
        description="Search enquiries, applications, programmes, faculty, news and events. Results are limited to what your role can access."
      />

      <AdminCard>
        <form method="get" action="/admin/search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FieldShell label="Search everything" className="flex-1">
            {(id) => (
              <TextInput
                id={id}
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Reference, name, phone, email, title…"
                autoComplete="off"
              />
            )}
          </FieldShell>
          <button type="submit" className="btn btn-primary shrink-0">
            <Search className="h-4 w-4" aria-hidden />
            Search
          </button>
        </form>
      </AdminCard>

      {!q ? (
        <EmptyState
          icon="search"
          title="Start typing to search"
          description="Enter a reference, student name, phone number, email address, programme, faculty member, news title or event."
        />
      ) : resultCount === 0 ? (
        <EmptyState
          icon="search"
          title={`No results for “${q}”`}
          description="Nothing you have access to matches that term. Check the spelling or try a shorter keyword."
          action={
            <Link href="/admin/search" className="btn btn-outline btn-sm">
              <SearchX className="h-4 w-4" aria-hidden />
              Clear search
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-body" role="status">
            <span className="font-bold text-navy">{resultCount}</span> result
            {resultCount === 1 ? "" : "s"} for “{q}” across {visibleSections.length} section
            {visibleSections.length === 1 ? "" : "s"}.
          </p>

          <div className="space-y-6">
            {visibleSections.map((section) => (
              <AdminCard
                key={section.key}
                title={section.label}
                description={`${section.total} match${section.total === 1 ? "" : "es"}${
                  section.total > section.items.length ? ` · showing first ${section.items.length}` : ""
                }`}
              >
                <ul className="space-y-2.5">
                  {section.items.map((item) => (
                    <li key={`${section.key}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="flex items-start gap-3 rounded-2xl border border-line bg-offwhite/50 p-3.5 transition hover:border-royal/40 hover:bg-paper"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-navy">{item.title}</span>
                          {item.subtitle ? (
                            <span className="mt-0.5 block truncate text-xs text-slate-body">{item.subtitle}</span>
                          ) : null}
                          {item.meta ? (
                            <span className="mt-0.5 block text-[11px] text-slate-body">{item.meta}</span>
                          ) : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {item.badge ? <Badge tone={item.badge.tone}>{item.badge.label}</Badge> : null}
                          <ArrowUpRight className="h-4 w-4 text-slate-body" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {section.total > section.items.length ? (
                  <p className="mt-3 text-xs text-slate-body">
                    Refine your search to narrow {section.total} down to the first {section.items.length}.
                  </p>
                ) : null}
              </AdminCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
