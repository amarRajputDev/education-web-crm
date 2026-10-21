"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, clientMeta } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { fieldErrors, noteSchema } from "@/lib/validation";
import { normalizeEmail, normalizePhone } from "@/lib/format";

export type EnquiryActionResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  id?: number;
  ref?: string;
};

function refresh(id?: number) {
  revalidatePath("/admin/enquiries");
  if (id) {
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin/dashboard");
  }
}

function logActivity(enquiryId: number, actorId: number, action: string, detail = "") {
  getDb()
    .prepare(
      `INSERT INTO enquiry_activities (enquiry_id, actor_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
    )
    .run(enquiryId, actorId, action, detail);
}

function loadScoped(id: number, scopeAll: boolean, userId: number) {
  const row = getDb()
    .prepare(`SELECT id, ref, name, status, counsellor_id FROM enquiries WHERE id = ?`)
    .get(id) as { id: number; ref: string; name: string; status: string; counsellor_id: number | null } | undefined;
  if (!row) return null;
  if (!scopeAll && row.counsellor_id !== userId) return null;
  return row;
}

/* ------------------------------------------------------------------ */
/* create                                                              */
/* ------------------------------------------------------------------ */
const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name").max(120),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  courseId: z.coerce.number().optional().nullable(),
  source: z.enum(["Website", "Phone", "Walk-in", "Social Media", "Referral", "Campaign", "Event", "Other"]),
  preferredContact: z.enum(["Phone", "Email", "WhatsApp"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  counsellorId: z.coerce.number().optional().nullable(),
  message: z.string().trim().max(1200).optional().default(""),
  nextFollowupAt: z.string().optional().nullable(),
  consent: z.coerce.number().optional().default(1),
});

export async function createEnquiry(_prev: EnquiryActionResult, formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    courseId: formData.get("courseId") || null,
    source: formData.get("source") ?? "Phone",
    preferredContact: formData.get("preferredContact") ?? "Phone",
    priority: formData.get("priority") ?? "medium",
    counsellorId: formData.get("counsellorId") || null,
    message: formData.get("message") ?? "",
    nextFollowupAt: formData.get("nextFollowupAt") || null,
    consent: 1,
  });
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  const db = getDb();
  const phone = normalizePhone(parsed.data.phone);
  const email = normalizeEmail(parsed.data.email ?? "");

  const duplicate = db
    .prepare(
      `SELECT id, ref FROM enquiries
        WHERE REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','') LIKE ?
           OR (email != '' AND LOWER(email) = ?)
        ORDER BY id DESC LIMIT 1`,
    )
    .get(`%${phone}`, email) as { id: number; ref: string } | undefined;

  const course = parsed.data.courseId
    ? (db.prepare("SELECT id, name FROM courses WHERE id = ?").get(parsed.data.courseId) as { id: number; name: string } | undefined)
    : undefined;

  const count = (db.prepare("SELECT COUNT(*) AS c FROM enquiries").get() as { c: number }).c;
  const ref = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  try {
    const info = db
      .prepare(
        `INSERT INTO enquiries (ref, name, phone, email, course_id, course_interest, source, preferred_contact,
           message, consent, status, priority, counsellor_id, tags, is_duplicate, next_followup_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'new', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(
        ref,
        parsed.data.name.trim(),
        phone,
        email,
        course?.id ?? null,
        course?.name ?? "",
        parsed.data.source,
        parsed.data.preferredContact,
        parsed.data.message ?? "",
        parsed.data.priority,
        parsed.data.counsellorId ?? ctx.user.id,
        JSON.stringify(duplicate ? ["possible-duplicate"] : []),
        duplicate ? 1 : 0,
        parsed.data.nextFollowupAt ? new Date(parsed.data.nextFollowupAt).toISOString() : null,
      );
    const id = Number(info.lastInsertRowid);

    logActivity(id, ctx.user.id, "created", `Created manually by ${ctx.user.name} (${parsed.data.source})`);
    if (duplicate) logActivity(id, ctx.user.id, "duplicate_flagged", `Possible duplicate of ${duplicate.ref}`);
    if (parsed.data.nextFollowupAt) {
      db.prepare(
        `INSERT INTO follow_up_tasks (enquiry_id, counsellor_id, due_at, note, status, created_by, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'))`,
      ).run(id, parsed.data.counsellorId ?? ctx.user.id, new Date(parsed.data.nextFollowupAt).toISOString(), "Initial follow-up", ctx.user.id);
    }

    logAudit({ userId: ctx.user.id, action: "enquiry.create", entity: "enquiry", entityId: id, detail: ref, ip });
    notify({
      type: "info",
      title: duplicate ? "Enquiry created (possible duplicate)" : "New enquiry added",
      body: `${parsed.data.name} · ${ref}`,
      link: `/admin/enquiries/${id}`,
      entity: "enquiries",
      entityId: id,
    });
    refresh(id);
    return { ok: true, id, ref, message: `Enquiry ${ref} created for ${parsed.data.name}.` };
  } catch (error) {
    console.error("createEnquiry failed", error);
    return { ok: false, message: "Could not save the enquiry. Please try again." };
  }
}

/* ------------------------------------------------------------------ */
/* update (status / priority / assignment / follow-up)                 */
/* ------------------------------------------------------------------ */
const updateSchema = z.object({
  status: z.string().min(1, "Select a status"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  counsellorId: z.coerce.number().optional().nullable(),
  nextFollowupAt: z.string().optional().nullable(),
  tags: z.string().max(400).optional().default(""),
});

export async function updateEnquiry(_prev: EnquiryActionResult, formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const id = Number(formData.get("id"));
  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  const existing = loadScoped(id, scopeAll, ctx.user.id);
  if (!existing) return { ok: false, message: "Enquiry not found or not available to your role." };

  // Assignment requires a dedicated permission.
  const requestedCounsellor = formData.get("counsellorId") ? Number(formData.get("counsellorId")) : null;
  const canAssign = ctx.permissions.includes(PERMISSIONS.ENQUIRY_ASSIGN);
  const counsellorId = canAssign ? requestedCounsellor : existing.counsellor_id;

  const parsed = updateSchema.safeParse({
    status: formData.get("status") ?? existing.status,
    priority: formData.get("priority") ?? "medium",
    counsellorId,
    nextFollowupAt: formData.get("nextFollowupAt") || null,
    tags: formData.get("tags") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  // Status workflow is editable in the database — validate against it.
  const db = getDb();
  const statusRow = db.prepare("SELECT key FROM enquiry_statuses WHERE key = ? AND active = 1").get(parsed.data.status);
  if (!statusRow) return { ok: false, errors: { status: "Unknown status value" }, message: "Unknown status value." };

  const tags = parsed.data.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

  try {
    const nextFollowup = parsed.data.nextFollowupAt ? new Date(parsed.data.nextFollowupAt).toISOString() : null;
    db.prepare(
      `UPDATE enquiries
          SET status = ?, priority = ?, counsellor_id = ?, tags = ?, next_followup_at = ?,
              last_contacted_at = CASE WHEN ? NOT IN ('new','contact_pending') AND last_contacted_at IS NULL
                                       THEN datetime('now') ELSE last_contacted_at END,
              updated_at = datetime('now')
        WHERE id = ?`,
    ).run(
      parsed.data.status,
      parsed.data.priority,
      parsed.data.counsellorId,
      JSON.stringify(tags),
      nextFollowup,
      parsed.data.status,
      id,
    );

    if (existing.status !== parsed.data.status) {
      logActivity(id, ctx.user.id, "status_changed", `${existing.status} → ${parsed.data.status}`);
    }
    if (canAssign && requestedCounsellor !== existing.counsellor_id) {
      const assigned = db.prepare("SELECT name FROM users WHERE id = ?").get(parsed.data.counsellorId) as { name: string } | undefined;
      logActivity(id, ctx.user.id, "assigned", assigned ? `Assigned to ${assigned.name}` : "Unassigned");
      if (parsed.data.counsellorId) {
        notify({
          userId: parsed.data.counsellorId,
          type: "info",
          title: "New enquiry assigned",
          body: `${existing.name} (${existing.ref})`,
          link: `/admin/enquiries/${id}`,
          entity: "enquiries",
          entityId: id,
        });
      }
    }

    logAudit({
      userId: ctx.user.id,
      action: "enquiry.update",
      entity: "enquiry",
      entityId: id,
      detail: `${existing.ref} status=${parsed.data.status} priority=${parsed.data.priority}`,
      ip,
    });
    refresh(id);
    return { ok: true, id, message: `Enquiry ${existing.ref} updated.` };
  } catch (error) {
    console.error("updateEnquiry failed", error);
    return { ok: false, message: "Could not update the enquiry." };
  }
}

/* ------------------------------------------------------------------ */
/* notes / contact history                                             */
/* ------------------------------------------------------------------ */
export async function addEnquiryNote(_prev: EnquiryActionResult, formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const parsed = noteSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    noteType: formData.get("noteType") ?? "note",
    body: formData.get("body"),
    outcome: formData.get("outcome") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  const existing = loadScoped(parsed.data.enquiryId, scopeAll, ctx.user.id);
  if (!existing) return { ok: false, message: "Enquiry not available to your role." };

  const db = getDb();
  db.prepare(
    `INSERT INTO enquiry_notes (enquiry_id, author_id, note_type, body, outcome, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  ).run(existing.id, ctx.user.id, parsed.data.noteType, parsed.data.body.trim(), parsed.data.outcome);

  if (parsed.data.noteType !== "note") {
    db.prepare("UPDATE enquiries SET last_contacted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(existing.id);
  }
  logActivity(existing.id, ctx.user.id, "note_added", `${parsed.data.noteType}: ${parsed.data.outcome || "contact recorded"}`);
  logAudit({ userId: ctx.user.id, action: "enquiry.note", entity: "enquiry", entityId: existing.id, detail: parsed.data.noteType, ip });
  refresh(existing.id);
  return { ok: true, id: existing.id, message: "Contact history updated." };
}

/* ------------------------------------------------------------------ */
/* follow-ups                                                          */
/* ------------------------------------------------------------------ */
const followUpSchema = z.object({
  enquiryId: z.coerce.number().min(1),
  dueAt: z.string().min(1, "Pick a date and time"),
  counsellorId: z.coerce.number().min(1, "Assign a counsellor"),
  note: z.string().trim().max(600).optional().default(""),
});

export async function createFollowUp(_prev: EnquiryActionResult, formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const parsed = followUpSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    dueAt: formData.get("dueAt"),
    counsellorId: formData.get("counsellorId"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  const existing = loadScoped(parsed.data.enquiryId, scopeAll, ctx.user.id);
  if (!existing) return { ok: false, message: "Enquiry not available to your role." };

  const dueAt = new Date(parsed.data.dueAt).toISOString();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO follow_up_tasks (enquiry_id, counsellor_id, due_at, note, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))`,
    )
    .run(existing.id, parsed.data.counsellorId, dueAt, parsed.data.note, ctx.user.id);

  db.prepare("UPDATE enquiries SET next_followup_at = ?, updated_at = datetime('now') WHERE id = ?").run(dueAt, existing.id);
  logActivity(existing.id, ctx.user.id, "followup_created", `${parsed.data.note || "Follow-up"} due ${dueAt}`);
  logAudit({ userId: ctx.user.id, action: "followup.create", entity: "enquiry", entityId: existing.id, detail: dueAt, ip });

  if (parsed.data.counsellorId !== ctx.user.id) {
    notify({
      userId: parsed.data.counsellorId,
      type: "info",
      title: "Follow-up assigned to you",
      body: `${existing.name} (${existing.ref}) — ${parsed.data.note || "call back"}`,
      link: `/admin/enquiries/${existing.id}`,
      entity: "enquiries",
      entityId: existing.id,
    });
  }
  refresh(existing.id);
  return { ok: true, id: existing.id, message: "Follow-up scheduled." };
}

export async function completeFollowUp(formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const taskId = Number(formData.get("taskId"));
  const outcome = String(formData.get("outcome") ?? "").slice(0, 180);
  const db = getDb();
  const task = db
    .prepare(
      `SELECT t.id, t.enquiry_id, t.counsellor_id, e.ref, e.name
         FROM follow_up_tasks t JOIN enquiries e ON e.id = t.enquiry_id
        WHERE t.id = ?`,
    )
    .get(taskId) as { id: number; enquiry_id: number; counsellor_id: number | null; ref: string; name: string } | undefined;
  if (!task) return { ok: false, message: "Follow-up not found." };

  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  if (!loadScoped(task.enquiry_id, scopeAll, ctx.user.id)) return { ok: false, message: "Not available to your role." };

  db.prepare(
    `UPDATE follow_up_tasks SET status = 'completed', outcome = ?, completed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?`,
  ).run(outcome, taskId);
  db.prepare(
    `UPDATE enquiries SET last_contacted_at = datetime('now'), next_followup_at = NULL, updated_at = datetime('now')
      WHERE id = ? AND NOT EXISTS (SELECT 1 FROM follow_up_tasks WHERE enquiry_id = ? AND status = 'pending')`,
  ).run(task.enquiry_id, task.enquiry_id);

  logActivity(task.enquiry_id, ctx.user.id, "followup_completed", outcome || "Completed");
  logAudit({ userId: ctx.user.id, action: "followup.complete", entity: "follow_up", entityId: taskId, detail: outcome, ip });
  refresh(task.enquiry_id);
  return { ok: true, id: task.enquiry_id, message: "Follow-up marked as completed." };
}

export async function rescheduleFollowUp(_prev: EnquiryActionResult, formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const taskId = Number(formData.get("taskId"));
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  if (!dueAtRaw) return { ok: false, message: "Pick a new date and time.", errors: { dueAt: "Required" } };

  const db = getDb();
  const task = db
    .prepare(`SELECT id, enquiry_id, status FROM follow_up_tasks WHERE id = ?`)
    .get(taskId) as { id: number; enquiry_id: number; status: string } | undefined;
  if (!task) return { ok: false, message: "Follow-up not found." };
  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  if (!loadScoped(task.enquiry_id, scopeAll, ctx.user.id)) return { ok: false, message: "Not available to your role." };

  const dueAt = new Date(dueAtRaw).toISOString();
  db.prepare(
    `UPDATE follow_up_tasks SET due_at = ?, status = 'pending', completed_at = NULL, updated_at = datetime('now') WHERE id = ?`,
  ).run(dueAt, taskId);
  db.prepare("UPDATE enquiries SET next_followup_at = ?, updated_at = datetime('now') WHERE id = ?").run(dueAt, task.enquiry_id);
  logActivity(task.enquiry_id, ctx.user.id, "followup_rescheduled", dueAt);
  logAudit({ userId: ctx.user.id, action: "followup.reschedule", entity: "follow_up", entityId: taskId, detail: dueAt, ip });
  refresh(task.enquiry_id);
  return { ok: true, id: task.enquiry_id, message: "Follow-up rescheduled." };
}

export async function deleteFollowUp(formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const taskId = Number(formData.get("taskId"));
  const db = getDb();
  const task = db.prepare(`SELECT id, enquiry_id FROM follow_up_tasks WHERE id = ?`).get(taskId) as
    | { id: number; enquiry_id: number }
    | undefined;
  if (!task) return { ok: false, message: "Follow-up not found." };
  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  if (!loadScoped(task.enquiry_id, scopeAll, ctx.user.id)) return { ok: false, message: "Not available to your role." };

  db.prepare("DELETE FROM follow_up_tasks WHERE id = ?").run(taskId);
  logActivity(task.enquiry_id, ctx.user.id, "followup_deleted", `Task #${taskId}`);
  logAudit({ userId: ctx.user.id, action: "followup.delete", entity: "follow_up", entityId: taskId, ip });
  refresh(task.enquiry_id);
  return { ok: true, id: task.enquiry_id, message: "Follow-up removed." };
}

/* ------------------------------------------------------------------ */
/* bulk actions                                                        */
/* ------------------------------------------------------------------ */
export async function bulkUpdateEnquiries(formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MANAGE);
  const { ip } = await clientMeta();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 200);
  if (ids.length === 0) return { ok: false, message: "Select at least one enquiry." };

  const action = String(formData.get("action") ?? "");
  const scopeAll = ctx.permissions.includes(PERMISSIONS.ENQUIRY_VIEW_ALL);
  const canAssign = ctx.permissions.includes(PERMISSIONS.ENQUIRY_ASSIGN);
  const db = getDb();

  const visible = ids.filter((id) => loadScoped(id, scopeAll, ctx.user.id) !== null);
  if (visible.length === 0) return { ok: false, message: "None of the selected enquiries are available to your role." };

  let updated = 0;
  if (action === "status") {
    const status = String(formData.get("status") ?? "");
    const valid = db.prepare("SELECT key FROM enquiry_statuses WHERE key = ? AND active = 1").get(status);
    if (!valid) return { ok: false, message: "Unknown status." };
    const stmt = db.prepare("UPDATE enquiries SET status = ?, updated_at = datetime('now') WHERE id = ?");
    for (const id of visible) {
      stmt.run(status, id);
      logActivity(id, ctx.user.id, "status_changed", `Bulk → ${status}`);
      updated++;
    }
  } else if (action === "assign" && canAssign) {
    const counsellorId = Number(formData.get("counsellorId") ?? 0);
    const counsellor = db.prepare("SELECT id, name FROM users WHERE id = ? AND role_key = 'counsellor'").get(counsellorId) as
      | { id: number; name: string }
      | undefined;
    if (!counsellor) return { ok: false, message: "Select a valid counsellor." };
    const stmt = db.prepare("UPDATE enquiries SET counsellor_id = ?, updated_at = datetime('now') WHERE id = ?");
    for (const id of visible) {
      stmt.run(counsellorId, id);
      logActivity(id, ctx.user.id, "assigned", `Bulk assignment → ${counsellor.name}`);
      updated++;
    }
    notify({
      userId: counsellorId,
      type: "info",
      title: `${visible.length} enquiries assigned to you`,
      body: `Assigned by ${ctx.user.name}`,
      link: "/admin/enquiries?view=mine",
      entity: "enquiries",
    });
  } else if (action === "priority") {
    const priority = String(formData.get("priority") ?? "");
    if (!["low", "medium", "high", "urgent"].includes(priority)) return { ok: false, message: "Unknown priority." };
    const stmt = db.prepare("UPDATE enquiries SET priority = ?, updated_at = datetime('now') WHERE id = ?");
    for (const id of visible) {
      stmt.run(priority, id);
      logActivity(id, ctx.user.id, "priority_changed", `Bulk → ${priority}`);
      updated++;
    }
  } else if (action === "export") {
    return { ok: false, message: "Use the Reports section for CSV exports." };
  } else {
    return { ok: false, message: "Unknown bulk action." };
  }

  logAudit({
    userId: ctx.user.id,
    action: "enquiry.bulk",
    entity: "enquiry",
    entityId: visible.join(","),
    detail: `${action} ×${updated}`,
    ip,
  });
  refresh();
  return { ok: true, message: `${updated} enquir${updated === 1 ? "y" : "ies"} updated.` };
}

/* ------------------------------------------------------------------ */
/* duplicate merge                                                     */
/* ------------------------------------------------------------------ */
export async function mergeEnquiries(formData: FormData): Promise<EnquiryActionResult> {
  const ctx = await assertPermission(PERMISSIONS.ENQUIRY_MERGE);
  const { ip } = await clientMeta();
  const keepId = Number(formData.get("keepId"));
  const mergeId = Number(formData.get("mergeId"));
  if (!keepId || !mergeId || keepId === mergeId) return { ok: false, message: "Select two different enquiries." };

  const db = getDb();
  const keep = db.prepare("SELECT id, ref FROM enquiries WHERE id = ?").get(keepId) as { id: number; ref: string } | undefined;
  const merge = db.prepare("SELECT id, ref FROM enquiries WHERE id = ?").get(mergeId) as { id: number; ref: string } | undefined;
  if (!keep || !merge) return { ok: false, message: "Enquiry not found." };

  const run = db.transaction(() => {
    db.prepare(
      `UPDATE follow_up_tasks SET enquiry_id = ? WHERE enquiry_id = ?`,
    ).run(keepId, mergeId);
    db.prepare(`UPDATE enquiry_notes SET enquiry_id = ? WHERE enquiry_id = ?`).run(keepId, mergeId);
    db.prepare(`UPDATE enquiry_activities SET enquiry_id = ? WHERE enquiry_id = ?`).run(keepId, mergeId);
    db.prepare(`UPDATE admission_applications SET enquiry_id = ? WHERE enquiry_id = ?`).run(keepId, mergeId);
    db.prepare(
      `UPDATE enquiries
          SET merged_into = ?, is_duplicate = 1, status = 'invalid_lead', updated_at = datetime('now')
        WHERE id = ?`,
    ).run(keepId, mergeId);
    db.prepare(
      `INSERT INTO enquiry_activities (enquiry_id, actor_id, action, detail, created_at)
       VALUES (?, ?, 'merged', ?, datetime('now'))`,
    ).run(keepId, ctx.user.id, `Merged ${merge.ref} into ${keep.ref}`);
  });
  run();

  logAudit({ userId: ctx.user.id, action: "enquiry.merge", entity: "enquiry", entityId: keepId, detail: `merged ${merge.ref}`, ip });
  refresh(keepId);
  return { ok: true, id: keepId, message: `${merge.ref} merged into ${keep.ref}.` };
}
