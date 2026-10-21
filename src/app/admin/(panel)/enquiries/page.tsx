import Link from "next/link";
import { CalendarClock, KanbanSquare, LayoutList, Megaphone, Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { EmptyState } from "@/components/ui/feedback";
import { AdminPager } from "@/components/admin/pager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EnquiryFilters } from "@/components/admin/enquiries/filters";
import { EnquiryTable, type EnquiryRow } from "@/components/admin/enquiries/enquiry-table";
import { KanbanBoard, type KanbanCard } from "@/components/admin/enquiries/kanban";
import { cn } from "@/lib/cn";
import { formatDateTime, isBeforeNow, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = {
  q?: string;
  status?: string;
  course?: string;
  counsellor?: string;
  source?: string;
  priority?: string;
  from?: string;
  to?: string;
  view?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const PAGE_SIZE = 15;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const ctx = await requireAuth(PERMISSIONS.ENQUIRY_VIEW);
  const params = await searchParams;
  const scopeAll = can(ctx.user.role_key, PERMISSIONS.ENQUIRY_VIEW_ALL);

  const db = getDb();
  const courses = db
    .prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`)
    .all() as { id: number; name: string }[];
  const counsellors = db
    .prepare(`SELECT id, name FROM users WHERE status = 'active' AND role_key IN ('counsellor','admission_manager') ORDER BY name`)
    .all() as { id: number; name: string }[];
  const statuses = db
    .prepare(`SELECT key, name, color, sort_order FROM enquiry_statuses WHERE active = 1 ORDER BY sort_order`)
    .all() as { key: string; name: string; color: string; sort_order: number }[];

  /* --------- build where clause --------- */
  const where: string[] = [];
  const args: unknown[] = [];
  if (!scopeAll) {
    where.push("e.counsellor_id = ?");
    args.push(ctx.user.id);
  }
  if (params.q) {
    where.push("(e.name LIKE ? OR e.phone LIKE ? OR LOWER(e.email) LIKE ? OR e.ref LIKE ?)");
    const like = `%${params.q}%`;
    args.push(like, like, like.toLowerCase(), like.toUpperCase());
  }
  if (params.status) {
    where.push("e.status = ?");
    args.push(params.status);
  }
  if (params.course) {
    where.push("(e.course_id = ? OR e.course_interest = ?)");
    const course = courses.find((item) => String(item.id) === params.course);
    args.push(Number(params.course), course?.name ?? params.course);
  }
  if (params.counsellor) {
    where.push("e.counsellor_id = ?");
    args.push(Number(params.counsellor));
  }
  if (params.source) {
    where.push("e.source = ?");
    args.push(params.source);
  }
  if (params.priority) {
    where.push("e.priority = ?");
    args.push(params.priority);
  }
  if (params.from) {
    where.push("date(e.created_at) >= date(?)");
    args.push(params.from);
  }
  if (params.to) {
    where.push("date(e.created_at) <= date(?)");
    args.push(params.to);
  }

  const view = params.view ?? "table";
  if (view === "today") {
    where.push("e.next_followup_at IS NOT NULL");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortable = new Set(["ref", "status", "priority", "created_at", "next_followup_at", "name"]);
  const sortField = sortable.has(params.sort ?? "") ? params.sort! : "created_at";
  const sortDir = params.dir === "asc" ? "ASC" : "DESC";

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM enquiries e ${whereSql}`).get(...(args as never[])) as { c: number }
  ).c;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pageCount);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = db
    .prepare(
      `SELECT e.id, e.ref, e.name, e.phone, e.email, e.course_interest, e.source, e.status, e.priority,
              (SELECT u.name FROM users u WHERE u.id = e.counsellor_id) AS counsellor_name,
              e.last_contacted_at, e.next_followup_at, e.created_at, e.updated_at,
              s.name AS status_name
         FROM enquiries e
         LEFT JOIN enquiry_statuses s ON s.key = e.status
         ${whereSql}
        ORDER BY CASE WHEN e.next_followup_at IS NOT NULL AND e.next_followup_at < datetime('now') THEN 0 ELSE 1 END,
                 e.${sortField} ${sortDir}
        LIMIT ? OFFSET ?`,
    )
    .all(...(args as never[]), PAGE_SIZE, offset) as EnquiryRow[];

  const kanbanColumns = statuses
    .filter((status) => status.key !== "invalid_lead")
    .map((status) => ({ key: status.key, name: status.name }));
  const kanbanArgs = [...args];
  const kanbanWhere = where.filter((clause) => !clause.startsWith("e.next_followup_at"));
  const kanbanWhereSql = kanbanWhere.length ? `WHERE ${kanbanWhere.join(" AND ")}` : "";
  const groupedWithStatus = db
    .prepare(
      `SELECT status, id, ref, name, course_interest, priority, next_followup_at,
              (SELECT u.name FROM users u WHERE u.id = e.counsellor_id) AS counsellor_name
         FROM enquiries e
         ${kanbanWhereSql}
        ORDER BY e.created_at DESC
        LIMIT 150`,
    )
    .all(...(kanbanArgs as never[])) as (KanbanCard & { status: string })[];
  const board: Record<string, KanbanCard[]> = {};
  for (const column of kanbanColumns) board[column.key] = [];
  for (const card of groupedWithStatus) {
    if (board[card.status]) board[card.status].push(card);
  }

  /* --------- today view data --------- */
  const todayTasks =
    view === "today"
      ? (db
          .prepare(
            `SELECT t.id, t.due_at, t.note, t.status AS task_status, e.id AS enquiry_id, e.ref, e.name,
                    e.phone, e.course_interest, u.name AS counsellor_name
               FROM follow_up_tasks t
               JOIN enquiries e ON e.id = t.enquiry_id
               LEFT JOIN users u ON u.id = t.counsellor_id
              ${whereSql ? whereSql : "WHERE 1 = 1"}
                AND t.status = 'pending'
              ORDER BY t.due_at ASC
              LIMIT 60`,
          )
          .all(...(args as never[])) as {
          id: number;
          due_at: string;
          note: string;
          task_status: string;
          enquiry_id: number;
          ref: string;
          name: string;
          phone: string;
          course_interest: string;
          counsellor_name: string | null;
        }[])
      : [];

  const views = [
    { key: "table", label: "Table", icon: LayoutList },
    { key: "kanban", label: "Pipeline", icon: KanbanSquare },
    { key: "today", label: "Follow-ups", icon: CalendarClock },
  ];

  const stats = (
    db
      .prepare(
        `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
            SUM(CASE WHEN status IN ('interested','counselling_scheduled') THEN 1 ELSE 0 END) AS hot,
            SUM(CASE WHEN next_followup_at IS NOT NULL AND next_followup_at < datetime('now')
                      AND status NOT IN ('converted','invalid_lead','not_interested') THEN 1 ELSE 0 END) AS overdue
           FROM enquiries ${scopeAll ? "" : "WHERE counsellor_id = ?"}`,
      )
      .get(...(scopeAll ? [] : ([ctx.user.id] as never[]))) as {
      total: number;
      new_count: number;
      hot: number;
      overdue: number;
    }
  ) ?? { total: 0, new_count: 0, hot: 0, overdue: 0 };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Enquiry management"
        description={
          scopeAll
            ? "Every lead from the website, phone, walk-ins and campaigns — with assignment, follow-ups and a full contact timeline."
            : "Enquiries assigned to you. Ask an admission manager if a record is missing."
        }
        meta={[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.new_count },
          { label: "Hot leads", value: stats.hot },
          { label: "Overdue", value: stats.overdue },
        ]}
        actions={
          <>
            <Link href="/admin/reports?report=enquiries" className="btn btn-outline btn-sm">
              Reports
            </Link>
            {can(ctx.user.role_key, PERMISSIONS.ENQUIRY_MANAGE) ? (
              <Link href="/admin/enquiries/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                Add enquiry
              </Link>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {views.map((item) => {
          const active = view === item.key;
          const href = item.key === "table" ? "/admin/enquiries" : `/admin/enquiries?view=${item.key}`;
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-bold transition",
                active ? "border-navy bg-navy text-white" : "border-line bg-paper text-slate-body hover:border-royal hover:text-royal",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        {stats.overdue > 0 ? (
          <Link href="/admin/enquiries?view=today" className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-danger-100 px-3 py-2 text-[12.5px] font-bold text-danger">
            {stats.overdue} overdue follow-up{stats.overdue === 1 ? "" : "s"}
          </Link>
        ) : null}
      </div>

      <EnquiryFilters
        courses={courses.map((course) => ({ value: String(course.id), label: course.name }))}
        counsellors={counsellors.map((counsellor) => ({ value: String(counsellor.id), label: counsellor.name }))}
        statuses={statuses.map((status) => ({ value: status.key, label: status.name }))}
        sources={["Website", "Phone", "Walk-in", "Social Media", "Referral", "Campaign", "Event", "Other"].map((value) => ({
          value,
          label: value,
        }))}
        resultCount={total}
      />

      {view === "kanban" ? (
        <KanbanBoard columns={kanbanColumns} grouped={board} />
      ) : view === "today" ? (
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-navy">Scheduled follow-ups</h2>
            <p className="text-xs text-slate-body">{todayTasks.length} pending task{todayTasks.length === 1 ? "" : "s"}</p>
          </div>
          {todayTasks.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No pending follow-ups"
              description="Create a follow-up from any enquiry record to see it here."
              compact
            />
          ) : (
            <ul className="divide-y divide-line">
              {todayTasks.map((task) => {
                const overdue = isBeforeNow(task.due_at);
                return (
                  <li key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", overdue ? "bg-danger" : "bg-royal")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/enquiries/${task.enquiry_id}`} className="text-[13.5px] font-bold text-navy hover:text-royal">
                        {task.name} <span className="font-mono text-[11px] font-normal text-royal">{task.ref}</span>
                      </Link>
                      <p className="truncate text-xs text-slate-body">
                        {task.note} · {task.course_interest || "No course"} · {task.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[12.5px] font-semibold", overdue ? "text-danger" : "text-navy")}>{formatDateTime(task.due_at)}</p>
                      <p className="text-[11px] text-slate-body">{task.counsellor_name ?? "Unassigned"}</p>
                    </div>
                    <Link href={`/admin/enquiries/${task.enquiry_id}`} className="btn btn-outline btn-sm">
                      Open
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : rows.length === 0 && total === 0 ? (
        <EmptyState
          icon="empty"
          title="No enquiries yet"
          description="Enquiries submitted from the website appear here instantly. You can also add one manually."
          action={
            can(ctx.user.role_key, PERMISSIONS.ENQUIRY_MANAGE) ? (
              <Link href="/admin/enquiries/new" className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" aria-hidden />
                Add enquiry
              </Link>
            ) : undefined
          }
        />
      ) : (
        <EnquiryTable
          rows={rows}
          statuses={statuses}
          counsellors={counsellors}
          canAssign={can(ctx.user.role_key, PERMISSIONS.ENQUIRY_ASSIGN)}
          canExport={can(ctx.user.role_key, PERMISSIONS.ENQUIRY_EXPORT)}
          sort={sortField}
          dir={sortDir.toLowerCase()}
        />
      )}

      {view === "table" && total > 0 ? (
        <div className="card overflow-hidden">
          <AdminPager page={page} pageCount={pageCount} total={total} label="enquiries" />
        </div>
      ) : null}

      <p className="text-[11px] text-slate-body">
        <Megaphone className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Lead sources and attribution are captured automatically from the website forms. Last updated{" "}
        {rows[0] ? relativeTime(rows[0].updated_at) : "—"}.
      </p>
    </div>
  );
}
