import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Flag,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Tag,
  UserRound,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb, parseJson } from "@/lib/db";
import { AdminPageHeader, AdminCard } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { EnquiryPanel, FollowUpScheduler, CompleteFollowUpButton } from "@/components/admin/enquiries/panels";
import { NoteForm, QuickCallNote } from "@/components/admin/enquiries/note-form";
import { formatDateTime, isBeforeNow, priorityTone, relativeTime, statusTone } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type EnquiryRecord = {
  id: number;
  ref: string;
  name: string;
  phone: string;
  email: string;
  course_id: number | null;
  course_interest: string;
  source: string;
  source_page: string;
  utm_campaign: string;
  preferred_contact: string;
  message: string;
  status: string;
  priority: string;
  counsellor_id: number | null;
  tags: string;
  is_duplicate: number;
  merged_into: number | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
};

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth(PERMISSIONS.ENQUIRY_VIEW);
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const scopeAll = can(ctx.user.role_key, PERMISSIONS.ENQUIRY_VIEW_ALL);
  const canManage = can(ctx.user.role_key, PERMISSIONS.ENQUIRY_MANAGE);
  const canAssign = can(ctx.user.role_key, PERMISSIONS.ENQUIRY_ASSIGN);

  const db = getDb();
  const enquiry = db.prepare(`SELECT * FROM enquiries WHERE id = ?`).get(id) as EnquiryRecord | undefined;
  if (!enquiry) notFound();
  if (!scopeAll && enquiry.counsellor_id !== ctx.user.id) notFound();

  const statuses = db
    .prepare(`SELECT key, name FROM enquiry_statuses WHERE active = 1 ORDER BY sort_order`)
    .all() as { key: string; name: string }[];
  const counsellors = db
    .prepare(`SELECT id, name FROM users WHERE status = 'active' AND role_key IN ('counsellor','admission_manager') ORDER BY name`)
    .all() as { id: number; name: string }[];

  const notes = db
    .prepare(
      `SELECT n.*, u.name AS author_name FROM enquiry_notes n
         LEFT JOIN users u ON u.id = n.author_id
        WHERE n.enquiry_id = ? ORDER BY n.created_at DESC`,
    )
    .all(id) as {
    id: number;
    note_type: string;
    body: string;
    outcome: string;
    created_at: string;
    author_name: string | null;
  }[];

  const activities = db
    .prepare(
      `SELECT a.*, u.name AS actor_name FROM enquiry_activities a
         LEFT JOIN users u ON u.id = a.actor_id
        WHERE a.enquiry_id = ? ORDER BY a.created_at DESC LIMIT 60`,
    )
    .all(id) as { id: number; action: string; detail: string; created_at: string; actor_name: string | null }[];

  const followups = db
    .prepare(
      `SELECT t.*, u.name AS counsellor_name FROM follow_up_tasks t
         LEFT JOIN users u ON u.id = t.counsellor_id
        WHERE t.enquiry_id = ? ORDER BY t.status = 'completed', t.due_at ASC`,
    )
    .all(id) as {
    id: number;
    due_at: string;
    note: string;
    status: string;
    outcome: string;
    completed_at: string | null;
    counsellor_name: string | null;
  }[];

  const application = db
    .prepare(`SELECT id, ref, status, submitted_at, course_name FROM admission_applications WHERE enquiry_id = ? ORDER BY id DESC LIMIT 1`)
    .get(id) as { id: number; ref: string; status: string; submitted_at: string; course_name: string } | undefined;

  const duplicateOf = enquiry.merged_into
    ? (db.prepare(`SELECT id, ref FROM enquiries WHERE id = ?`).get(enquiry.merged_into) as { id: number; ref: string } | undefined)
    : undefined;

  const relatedDuplicate = db
    .prepare(
      `SELECT id, ref, name FROM enquiries
        WHERE id != ? AND merged_into IS NULL
          AND (REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','') = REPLACE(REPLACE(REPLACE(?,' ',''),'-',''),'+','')
               OR (email != '' AND LOWER(email) = LOWER(?)))
        LIMIT 5`,
    )
    .all(id, enquiry.phone, enquiry.email) as { id: number; ref: string; name: string }[];

  const tags = parseJson<string[]>(enquiry.tags, []);
  const pendingTasks = followups.filter((task) => task.status === "pending");
  const overdueTasks = pendingTasks.filter((task) => isBeforeNow(task.due_at));
  const statusName = statuses.find((status) => status.key === enquiry.status)?.name ?? enquiry.status;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={`${enquiry.name}`}
        description={`${enquiry.ref} · received ${formatDateTime(enquiry.created_at)} via ${enquiry.source}`}
        actions={
          <>
            <Link href="/admin/enquiries" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to enquiries
            </Link>
            {application ? (
              <Link href={`/admin/admissions/${application.id}`} className="btn btn-navy btn-sm">
                <ClipboardList className="h-4 w-4" aria-hidden />
                Open application {application.ref}
              </Link>
            ) : null}
            <Link href={`/admin/enquiries?view=kanban`} className="btn btn-outline btn-sm">
              Pipeline view
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(enquiry.status)} dot>
          {statusName}
        </Badge>
        <Badge tone={priorityTone(enquiry.priority)}>{enquiry.priority}</Badge>
        <Badge tone="neutral">{enquiry.source}</Badge>
        <Badge tone="info">{enquiry.preferred_contact} preferred</Badge>
        {enquiry.is_duplicate ? <Badge tone="danger">Possible duplicate</Badge> : null}
        {tags.length > 0
          ? tags.map((tag) => (
              <Badge key={tag} tone="gold">
                {tag}
              </Badge>
            ))
          : null}
        {pendingTasks.length > 0 ? (
          <span className="text-xs text-slate-body">
            <Flag className="mr-1 inline h-3.5 w-3.5 text-royal" aria-hidden />
            {pendingTasks.length} pending follow-up{pendingTasks.length === 1 ? "" : "s"}
            {overdueTasks.length > 0 ? <span className="ml-1 font-semibold text-danger">({overdueTasks.length} overdue)</span> : null}
          </span>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* ---------------- main column ---------------- */}
        <div className="space-y-5">
          <AdminCard title="Student profile" description="Details captured with the enquiry">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                { icon: UserRound, label: "Full name", value: enquiry.name },
                { icon: Phone, label: "Mobile", value: enquiry.phone, href: `tel:${enquiry.phone}` },
                { icon: Mail, label: "Email", value: enquiry.email || "—", href: enquiry.email ? `mailto:${enquiry.email}` : undefined },
                { icon: MapPin, label: "Interested course", value: enquiry.course_interest || "Not specified" },
                { icon: Tag, label: "Source", value: enquiry.source },
                { icon: Flag, label: "Last contacted", value: enquiry.last_contacted_at ? relativeTime(enquiry.last_contacted_at) : "Never" },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 border-b border-line/70 pb-2.5 last:border-0">
                  <dt className="flex w-32 shrink-0 items-start gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-body">
                    <item.icon className="mt-0.5 h-3.5 w-3.5 text-royal" aria-hidden />
                    {item.label}
                  </dt>
                  <dd className="min-w-0 flex-1 break-words text-[13.5px] text-navy">
                    {item.href ? (
                      <a href={item.href} className="font-semibold text-royal hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {enquiry.message ? (
              <div className="mt-4 rounded-2xl border border-line bg-offwhite/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-body">Message from student</p>
                <p className="mt-1.5 text-sm leading-relaxed text-navy">{enquiry.message}</p>
              </div>
            ) : null}

            {enquiry.source_page || enquiry.utm_campaign ? (
              <p className="mt-3 text-[11px] text-slate-body">
                Attribution: {enquiry.source_page || "—"}
                {enquiry.utm_campaign ? ` · campaign: ${enquiry.utm_campaign}` : ""}
              </p>
            ) : null}
          </AdminCard>

          {/* duplicate detection */}
          {(relatedDuplicate.length > 0 || duplicateOf) && (
            <AdminCard
              title="Duplicate detection"
              description="Matched on normalised phone number or email address"
              className="border-danger/40"
            >
              {duplicateOf ? (
                <p className="mb-3 rounded-xl border border-[#f6cfcf] bg-danger-100 px-4 py-3 text-sm text-danger">
                  This record was merged into{" "}
                  <Link href={`/admin/enquiries/${duplicateOf.id}`} className="font-bold underline">
                    {duplicateOf.ref}
                  </Link>{" "}
                  and is no longer active.
                </p>
              ) : null}
              {relatedDuplicate.length > 0 ? (
                <ul className="space-y-2">
                  {relatedDuplicate.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-offwhite/60 px-3.5 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-navy">{item.name}</span>
                        <span className="font-mono text-[11px] text-royal">{item.ref}</span>
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <Link href={`/admin/enquiries/${item.id}`} className="btn btn-outline btn-sm">
                          Compare
                        </Link>
                        {can(ctx.user.role_key, PERMISSIONS.ENQUIRY_MERGE) ? (
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              formData.set("keepId", String(item.id));
                              formData.set("mergeId", String(enquiry.id));
                              const { mergeEnquiries } = await import("@/app/admin/actions/enquiries");
                              await mergeEnquiries(formData);
                            }}
                          >
                            <button type="submit" className="btn btn-danger btn-sm">
                              Merge into {item.ref}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-body">No matching records found.</p>
              )}
            </AdminCard>
          )}

          {/* contact history */}
          <AdminCard title="Contact history" description={`${notes.length} recorded interaction${notes.length === 1 ? "" : "s"}`}>
            {notes.length === 0 ? (
              <EmptyState
                compact
                title="No contact recorded yet"
                description="Log the first call, WhatsApp message or note below — it becomes part of the enquiry timeline."
              />
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="rounded-2xl border border-line bg-offwhite/50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={note.note_type === "note" ? "neutral" : "info"}>{note.note_type}</Badge>
                      <span className="text-[12px] font-semibold text-navy">{note.author_name ?? "System"}</span>
                      <span className="ml-auto text-[11px] text-slate-body">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-navy">{note.body}</p>
                    {note.outcome ? <p className="mt-1.5 text-xs font-semibold text-success">Outcome: {note.outcome}</p> : null}
                  </li>
                ))}
              </ul>
            )}

            {canManage ? (
              <div className="mt-4 border-t border-line pt-4">
                <NoteForm enquiryId={enquiry.id} />
              </div>
            ) : null}
          </AdminCard>

          {/* timeline */}
          <AdminCard title="Activity timeline" description="Every state change, assignment and merge is recorded">
            <ol className="relative space-y-4 border-l border-line pl-5">
              {activities.map((activity) => (
                <li key={activity.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-royal" aria-hidden />
                  <p className="text-[13px] text-navy">
                    <span className="font-bold">{activity.actor_name ?? "System"}</span>{" "}
                    <span className="text-slate-body">{activity.action.replace(/_/g, " ")}</span>
                    {activity.detail ? <span className="text-slate-body"> — {activity.detail}</span> : null}
                  </p>
                  <p className="text-[11px] text-slate-body">{formatDateTime(activity.created_at)}</p>
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        {/* ---------------- side column ---------------- */}
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <AdminCard title="Lead controls" description="Status, priority, assignment and scheduling">
            <EnquiryPanel
              enquiryId={enquiry.id}
              status={enquiry.status}
              priority={enquiry.priority}
              counsellorId={enquiry.counsellor_id}
              nextFollowupAt={enquiry.next_followup_at}
              statuses={statuses}
              counsellors={counsellors}
              canAssign={canAssign}
            />
          </AdminCard>

          <AdminCard title="Follow-ups" description={`${pendingTasks.length} pending · ${followups.length} total`}>
            {followups.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-3 py-5 text-center text-xs text-slate-body">
                Nothing scheduled yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {followups.map((task) => {
                  const overdue = task.status === "pending" && isBeforeNow(task.due_at);
                  return (
                    <li
                      key={task.id}
                      className={cn(
                        "rounded-2xl border p-3",
                        task.status === "completed"
                          ? "border-line bg-success-100/40"
                          : overdue
                            ? "border-danger/40 bg-danger-100/40"
                            : "border-line bg-offwhite/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn("text-[12.5px] font-bold", overdue ? "text-danger" : "text-navy")}>
                            {formatDateTime(task.due_at)}
                          </p>
                          <p className="text-xs text-slate-body">{task.note || "Follow-up"}</p>
                          <p className="text-[11px] text-slate-body">{task.counsellor_name ?? "Unassigned"}</p>
                          {task.outcome ? <p className="mt-1 text-[11px] font-semibold text-success">{task.outcome}</p> : null}
                        </div>
                        <Badge tone={task.status === "completed" ? "success" : overdue ? "danger" : "info"}>
                          {task.status === "completed" ? "Done" : overdue ? "Overdue" : "Pending"}
                        </Badge>
                      </div>
                      {task.status !== "completed" && canManage ? (
                        <div className="mt-2.5 flex gap-2">
                          <CompleteFollowUpButton taskId={task.id} enquiryId={enquiry.id} />
                          <RescheduleButton taskId={task.id} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {canManage ? (
              <div className="mt-4 border-t border-line pt-4">
                <FollowUpScheduler enquiryId={enquiry.id} counsellorId={enquiry.counsellor_id} counsellors={counsellors} />
              </div>
            ) : null}
          </AdminCard>

          <AdminCard title="Quick contact">
            <div className="flex flex-col gap-2">
              <a href={`tel:${enquiry.phone}`} className="btn btn-navy btn-sm">
                <Phone className="h-4 w-4" aria-hidden />
                Call {enquiry.phone}
              </a>
              {enquiry.email ? (
                <a href={`mailto:${enquiry.email}`} className="btn btn-outline btn-sm">
                  <Mail className="h-4 w-4" aria-hidden />
                  Email student
                </a>
              ) : null}
              <a
                href={`https://wa.me/91${enquiry.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hello ${enquiry.name.split(" ")[0]}, this is the admissions team from Aarohan Institute.`)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline btn-sm"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                WhatsApp
              </a>
              {canManage ? (
                <div className="mt-1 rounded-2xl border border-line bg-offwhite/60 p-3">
                  <QuickCallNote enquiryId={enquiry.id} phone={enquiry.phone} />
                </div>
              ) : null}
            </div>
          </AdminCard>

          <AdminCard title="Record information">
            <dl className="space-y-2 text-xs text-slate-body">
              <div className="flex justify-between gap-3">
                <dt>Enquiry ID</dt>
                <dd className="font-mono text-navy">{enquiry.ref}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Created</dt>
                <dd className="text-navy">{formatDateTime(enquiry.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Last updated</dt>
                <dd className="text-navy">{relativeTime(enquiry.updated_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Linked course ID</dt>
                <dd className="text-navy">{enquiry.course_id ?? "—"}</dd>
              </div>
            </dl>
            <Link href="/admin/enquiries/new" className="btn btn-outline btn-sm mt-4 w-full">
              <Plus className="h-4 w-4" aria-hidden />
              Create related enquiry
            </Link>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}

function RescheduleButton({ taskId }: { taskId: number }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const { rescheduleFollowUp } = await import("@/app/admin/actions/enquiries");
        await rescheduleFollowUp({ ok: false, message: "" }, formData);
      }}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="taskId" value={taskId} />
      <label htmlFor={`reschedule-${taskId}`} className="sr-only">
        New date and time
      </label>
      <input id={`reschedule-${taskId}`} name="dueAt" type="datetime-local" required className="field !py-1.5 !text-xs" />
      <button type="submit" className="btn btn-outline btn-sm">
        Reschedule
      </button>
    </form>
  );
}
